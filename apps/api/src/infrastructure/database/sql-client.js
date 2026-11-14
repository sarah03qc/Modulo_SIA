'use strict';

const sql = require('mssql');
const { InfrastructureError } = require('../../common/errors');
const { assertInstitutionalRead } = require('./institutional-read');

/*
  Cliente compartido de SQL Server.
  El acceso a SIA_CENCINAI puede escribir. El de SIDINACC_LOCAL
  pasa cada sentencia por el filtro de lectura antes de enviarla.
*/

/**
 * Consulta de diagnóstico. Confirma el nombre de la base y si la cuenta
 * puede insertar, actualizar, borrar o es administradora del servidor.
 */
const PROBE_SQL = `
SELECT
  DB_NAME() AS database_name,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'INSERT')) AS can_insert,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'UPDATE')) AS can_update,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'DELETE')) AS can_delete,
  CONVERT(int, IS_SRVROLEMEMBER('sysadmin')) AS is_sysadmin
`;

/**
 * Interpreta el resultado del permiso como denegado.
 * El motor puede devolver 0, el texto "0" o false.
 */
function denied(value) {
  return value === 0 || value === '0' || value === false;
}

/**
 * Error de una sentencia SQL ya ejecutada.
 * Conserva el número del motor para que el servicio distinga duplicado,
 * interbloqueo o permiso, sin exponer el texto del motor al cliente.
 */
class SqlExecutionError extends Error {
  /**
   * @param {Error} source Error original del controlador.
   */
  constructor(source) {
    super('La operación de base de datos no se completó.');
    this.name = 'SqlExecutionError';
    this.driverCode = source && source.code ? String(source.code) : 'DB_ERROR';
    this.sqlNumber = readSqlNumber(source);
    this.permissionDenied = this.sqlNumber === 229 || this.sqlNumber === 230;
  }
}

/**
 * Extrae el número de error de SQL Server, si el controlador lo trae.
 * Sirve para distinguir permiso, duplicado o interbloqueo sin mostrar el texto del motor.
 */
function readSqlNumber(error) {
  if (!error || typeof error !== 'object') {
    return null;
  }
  const candidates = [
    error.number,
    error.originalError && error.originalError.info && error.originalError.info.number
  ];
  for (const candidate of candidates) {
    if (candidate === undefined || candidate === null || candidate === '') {
      continue;
    }
    const parsed = Number(candidate);
    if (Number.isInteger(parsed)) {
      return parsed;
    }
  }
  return null;
}

/**
 * Indica si el fallo es de conexión y conviene descartar el pool.
 *
 * @param {Error} error Error del controlador o de la red.
 * @returns {boolean} true cuando no se trata de un rechazo de sentencia.
 */
function isConnectionFailure(error) {
  const code = error && error.code;
  return code === 'ECONNRESET' || code === 'ESOCKET' || code === 'ETIMEOUT' || code === 'ELOGIN';
}

/**
 * Asigna parámetros planos o tipados a una solicitud de mssql.
 * Un valor `{ type, value }` fija el tipo SQL, incluido NULL.
 *
 * @param {object} request Solicitud o solicitud de transacción.
 * @param {object} parameters Mapa de parámetros.
 * @returns {void}
 */
function bindParameters(request, parameters) {
  for (const [name, value] of Object.entries(parameters || {})) {
    if (
      value
      && typeof value === 'object'
      && Object.prototype.hasOwnProperty.call(value, 'type')
      && Object.prototype.hasOwnProperty.call(value, 'value')
    ) {
      request.input(name, value.type, value.value);
    } else {
      request.input(name, value);
    }
  }
}

/**
 * Arma la configuración del controlador a partir de la base ya validada.
 * No elige la base: usa el nombre, el usuario y los tiempos que entregó la configuración.
 */
function toMssqlConfig(database, timeouts, poolMax) {
  return {
    server: database.server,
    port: database.port,
    database: database.database,
    user: database.user,
    password: database.password,
    connectionTimeout: timeouts.connectionTimeoutMs,
    requestTimeout: timeouts.requestTimeoutMs,
    pool: {
      max: poolMax,
      min: 0,
      idleTimeoutMillis: 30000
    },
    options: {
      encrypt: database.encrypt,
      trustServerCertificate: database.trustServerCertificate,
      enableArithAbort: true,
      appName: database.appName
    }
  };
}

/**
 * Crea un cliente para una sola base.
 *
 * Si el filtro de escritura está activo, cada sentencia se rechaza cuando no es de lectura.
 * Ese filtro se usa en la réplica institucional. La base propia no lo activa.
 * El conjunto de conexiones se abre en la primera consulta y se cierra si la conexión
 * falla o cuando el proceso pide el cierre. Un permiso denegado no lo descarta.
 */
function createSqlClient(options) {
  const writeFilterEnabled = Boolean(options.writeFilterEnabled);
  let pool = null;

  /**
   * Devuelve el conjunto de conexiones abierto, o lo crea si todavía no existe.
   */
  async function getPool() {
    if (pool) {
      return pool;
    }
    const factory = options.connectPool || ((config) => new sql.ConnectionPool(config).connect());
    pool = await factory(options.mssqlConfig);
    return pool;
  }

  /**
   * Ejecuta una consulta y devuelve las filas.
   *
   * En el cliente de la réplica, la sentencia pasa primero el filtro de lectura.
   * Si el motor niega el permiso, se conserva el número SQL y no se cierra la conexión.
   * Cualquier otro fallo sí la cierra, para no reutilizarla.
   */
  async function query(sqlText, parameters = {}) {
    if (writeFilterEnabled) {
      assertInstitutionalRead(sqlText);
    }
    try {
      const active = await getPool();
      const request = active.request();
      bindParameters(request, parameters);
      const result = await request.query(sqlText);
      return result.recordset;
    } catch (error) {
      if (error instanceof InfrastructureError) {
        throw error;
      }
      const failure = new InfrastructureError('La dependencia de base de datos no está disponible.');
      failure.driverCode = error && error.code ? String(error.code) : 'DB_ERROR';
      const sqlNumber = readSqlNumber(error);
      if (sqlNumber !== null) {
        failure.sqlNumber = sqlNumber;
      }
      // 229 y 230 son denegacion de permiso, no una conexion rota. El mensaje no sale al cliente.
      failure.permissionDenied = sqlNumber === 229 || sqlNumber === 230;
      if (!failure.permissionDenied) {
        await close();
      }
      throw failure;
    }
  }

  /**
   * Ejecuta varias sentencias en una sola transacción.
   * El controlador la abre con lectura confirmada, su aislamiento por defecto.
   *
   * Confirma solo si el trabajo termina. Cualquier error revierte todo.
   * Si el cliente es de solo lectura, cada sentencia pasa el mismo filtro que una consulta suelta.
   * No cierra la conexión por un duplicado o un permiso denegado.
   * Un fallo de conexión sí la cierra. El texto del motor no se reenvía al cliente.
   */
  async function withTransaction(work) {
    const active = await getPool();
    const beginTransaction = options.beginTransaction || ((pool) => new sql.Transaction(pool));
    const transaction = beginTransaction(active);
    await transaction.begin();
    try {
      const value = await work({
        async query(sqlText, parameters) {
          if (writeFilterEnabled) {
            assertInstitutionalRead(sqlText);
          }
          const request = new sql.Request(transaction);
          bindParameters(request, parameters);
          const result = await request.query(sqlText);
          return result.recordset;
        }
      });
      await transaction.commit();
      return value;
    } catch (error) {
      try {
        await transaction.rollback();
      } catch {
        // El motor ya pudo revertir la transacción antes de este punto.
      }
      if (
        error
        && (
          error.expose === true
          || error.domain === true
          || error instanceof InfrastructureError
          || error instanceof SqlExecutionError
        )
      ) {
        throw error;
      }
      const failure = new SqlExecutionError(error);
      if (!failure.permissionDenied && isConnectionFailure(error)) {
        await close();
      }
      throw failure;
    }
  }

  /**
   * Comprueba que la conexión responde y que apunta a la base configurada.
   *
   * Devuelve el papel del cliente, el nombre de la base y si la cuenta
   * no puede insertar, actualizar, borrar ni actuar como administradora.
   * Ese indicador describe el permiso visto en el momento; no cambia la cuenta.
   */
  async function probe() {
    const rows = await query(PROBE_SQL);
    const row = rows && rows[0];
    if (!row || row.database_name !== options.databaseName) {
      throw new InfrastructureError('La conexión no corresponde a la base configurada.');
    }
    const readOnlyLogin = denied(row.can_insert)
      && denied(row.can_update)
      && denied(row.can_delete)
      && denied(row.is_sysadmin);
    return {
      role: options.role,
      database: row.database_name,
      readOnly: readOnlyLogin
    };
  }

  /**
   * Cierra el conjunto de conexiones si estaba abierto.
   * Una segunda llamada no intenta cerrarlo de nuevo.
   */
  async function close() {
    const current = pool;
    pool = null;
    if (current && typeof current.close === 'function') {
      await current.close();
    }
  }

  return {
    role: options.role,
    databaseName: options.databaseName,
    writeFilterEnabled,
    query,
    withTransaction,
    probe,
    close
  };
}

/**
 * Abre los dos clientes que usa el proceso.
 *
 * sia escribe en SIA_CENCINAI. sidinacc lee SIDINACC_LOCAL y activa el filtro
 * de solo lectura. No comparten conexiones. close cierra ambos.
 */
function createDatabaseGateway(config, dependencies = {}) {
  const timeouts = {
    connectionTimeoutMs: config.connectionTimeoutMs,
    requestTimeoutMs: config.requestTimeoutMs
  };
  const sia = createSqlClient({
    role: 'sia',
    databaseName: config.sia.database,
    writeFilterEnabled: false,
    mssqlConfig: toMssqlConfig(
      { ...config.sia, appName: 'sia-cencinai-api' },
      timeouts,
      config.poolMax
    ),
    connectPool: dependencies.connectPool
  });
  const sidinacc = createSqlClient({
    role: 'sidinacc',
    databaseName: config.sidinacc.database,
    writeFilterEnabled: true,
    mssqlConfig: toMssqlConfig(
      { ...config.sidinacc, appName: 'sia-cencinai-sidinacc-adapter' },
      timeouts,
      config.poolMax
    ),
    connectPool: dependencies.connectPool
  });

  return {
    sia,
    sidinacc,
    async close() {
      await Promise.all([sia.close(), sidinacc.close()]);
    }
  };
}

module.exports = {
  PROBE_SQL,
  SqlExecutionError,
  toMssqlConfig,
  createSqlClient,
  createDatabaseGateway
};
