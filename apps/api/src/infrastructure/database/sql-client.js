'use strict';

const sql = require('mssql');
const { InfrastructureError } = require('../../common/errors');
const { assertInstitutionalRead } = require('./institutional-read');

const PROBE_SQL = `
SELECT
  DB_NAME() AS database_name,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'INSERT')) AS can_insert,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'UPDATE')) AS can_update,
  CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'DELETE')) AS can_delete,
  CONVERT(int, IS_SRVROLEMEMBER('sysadmin')) AS is_sysadmin
`;

function denied(value) {
  return value === 0 || value === '0' || value === false;
}

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

function createSqlClient(options) {
  const writeFilterEnabled = Boolean(options.writeFilterEnabled);
  let pool = null;

  async function getPool() {
    if (pool) {
      return pool;
    }
    const factory = options.connectPool || ((config) => new sql.ConnectionPool(config).connect());
    pool = await factory(options.mssqlConfig);
    return pool;
  }

  async function query(sqlText, parameters = {}) {
    if (writeFilterEnabled) {
      assertInstitutionalRead(sqlText);
    }
    try {
      const active = await getPool();
      const request = active.request();
      for (const [name, value] of Object.entries(parameters)) {
        request.input(name, value);
      }
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
    probe,
    close
  };
}

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
  toMssqlConfig,
  createSqlClient,
  createDatabaseGateway
};
