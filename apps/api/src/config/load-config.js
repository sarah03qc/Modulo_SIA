'use strict';

/*
  Carga la configuración del proceso desde variables de entorno.
  Solo admite development y test. Producción no arranca por aquí.
  Exige los nombres SIA_CENCINAI y SIDINACC_LOCAL, y no acepta
  la contraseña de ejemplo. El periodo de la réplica queda fijo
  en el servidor: la solicitud HTTP no puede cambiarlo.
*/

const { SIA_DATABASE, SIDINACC_DATABASE } = require('./databases');

const ALLOWED_ENVIRONMENTS = new Set(['development', 'test']);
const ALLOWED_LOG_LEVELS = new Set(['error', 'warn', 'info']);
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);
const EXAMPLE_SECRET = 'CHANGE_ME';

/**
 * Error de arranque cuando una variable falta o no es utilizable.
 * El mensaje nombra la variable y no incluye el secreto.
 */
class ErrorConfiguracion extends Error {
  constructor(message) {
    super(message);
    this.name = 'ErrorConfiguracion';
    this.code = 'INVALID_CONFIGURATION';
  }
}

function ExigirTexto(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ErrorConfiguracion(`Falta la variable obligatoria ${key}.`);
  }
  return value.trim();
}

/**
 * Lee un secreto obligatorio y rechaza el valor de ejemplo CHANGE_ME.
 */
function ExigirSecreto(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ErrorConfiguracion(`Falta la variable obligatoria ${key}.`);
  }
  if (value === EXAMPLE_SECRET) {
    throw new ErrorConfiguracion(`${key} sigue en el valor de ejemplo.`);
  }
  return value;
}

function ExigirPuerto(env, key) {
  const raw = ExigirTexto(env, key);
  if (!/^\d+$/.test(raw)) {
    throw new ErrorConfiguracion(`${key} debe ser un puerto numérico.`);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    throw new ErrorConfiguracion(`${key} debe estar entre 1 y 65535.`);
  }
  return port;
}

function ExigirBooleano(env, key) {
  const raw = ExigirTexto(env, key).toLowerCase();
  if (raw !== 'true' && raw !== 'false') {
    throw new ErrorConfiguracion(`${key} debe ser true o false.`);
  }
  return raw === 'true';
}

function ExigirEnteroPositivo(env, key) {
  const raw = ExigirTexto(env, key);
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new ErrorConfiguracion(`${key} debe ser un entero positivo.`);
  }
  return Number(raw);
}

function ExigirOrigen(env, key) {
  const raw = ExigirTexto(env, key);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ErrorConfiguracion(`${key} debe ser una URL absoluta de origen.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ErrorConfiguracion(`${key} debe usar http o https.`);
  }
  if (url.username || url.password) {
    throw new ErrorConfiguracion(`${key} no debe incluir credenciales.`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new ErrorConfiguracion(`${key} debe ser solo el origen, sin ruta ni consulta.`);
  }
  return url.origin;
}

function ExigirNombreBase(env, key, expected) {
  const name = ExigirTexto(env, key);
  if (name !== expected) {
    throw new ErrorConfiguracion(`${key} debe ser ${expected}.`);
  }
  return name;
}

/**
 * Lee la conexión de una base. El nombre tiene que coincidir con el esperado:
 * SIA_CENCINAI o SIDINACC_LOCAL, según el prefijo.
 */
function CargarBaseDatos(env, prefix, expectedName) {
  return {
    server: ExigirTexto(env, `${prefix}_DB_SERVER`),
    port: ExigirPuerto(env, `${prefix}_DB_PORT`),
    database: ExigirNombreBase(env, `${prefix}_DB_NAME`, expectedName),
    user: ExigirTexto(env, `${prefix}_DB_USER`),
    password: ExigirSecreto(env, `${prefix}_DB_PASSWORD`),
    encrypt: ExigirBooleano(env, `${prefix}_DB_ENCRYPT`),
    trustServerCertificate: ExigirBooleano(env, `${prefix}_DB_TRUST_SERVER_CERTIFICATE`)
  };
}

/**
 * Construye la configuración del proceso.
 *
 * Recibe el entorno, normalmente process.env. Devuelve host, puertos,
 * las dos conexiones y el periodo de lectura de la réplica.
 * Rechaza producción, un host que no sea local y un origen CORS con ruta,
 * consulta o credenciales. Si las dos bases usan el mismo usuario, lo marca
 * para que el arranque pueda advertirlo.
 */
function CargarConfiguracion(env) {
  const source = env || {};
  const nodeEnv = ExigirTexto(source, 'NODE_ENV');
  if (!ALLOWED_ENVIRONMENTS.has(nodeEnv)) {
    throw new ErrorConfiguracion(
      'NODE_ENV debe ser development o test. El arranque de producción no está habilitado.'
    );
  }

  const logLevel = ExigirTexto(source, 'LOG_LEVEL');
  if (!ALLOWED_LOG_LEVELS.has(logLevel)) {
    throw new ErrorConfiguracion('LOG_LEVEL debe ser error, warn o info.');
  }

  const host = ExigirTexto(source, 'API_HOST');
  if (!ALLOWED_HOSTS.has(host)) {
    throw new ErrorConfiguracion('API_HOST debe ser 127.0.0.1 o localhost en este bootstrap.');
  }

  const sia = CargarBaseDatos(source, 'SIA', SIA_DATABASE);
  const sidinacc = CargarBaseDatos(source, 'SIDINACC', SIDINACC_DATABASE);

  return {
    nodeEnv,
    host,
    port: ExigirPuerto(source, 'API_PORT'),
    logLevel,
    corsOrigin: ExigirOrigen(source, 'CORS_ORIGIN'),
    connectionTimeoutMs: ExigirEnteroPositivo(source, 'DB_CONNECTION_TIMEOUT_MS'),
    requestTimeoutMs: ExigirEnteroPositivo(source, 'DB_REQUEST_TIMEOUT_MS'),
    poolMax: ExigirEnteroPositivo(source, 'DB_POOL_MAX'),
    sia,
    sidinacc,
    sameDatabaseUser: sia.user.toLowerCase() === sidinacc.user.toLowerCase(),
    // Periodo de lectura de la replica. El cliente HTTP no puede cambiarlo.
    sidinaccPeriodId: ExigirEnteroPositivo(source, 'SIDINACC_PERIOD_ID')
  };
}

/**
 * Resume la configuración para diagnóstico, sin usuarios ni contraseñas.
 */
function ResumenPublicoConfiguracion(config) {
  return {
    nodeEnv: config.nodeEnv,
    host: config.host,
    port: config.port,
    logLevel: config.logLevel,
    corsOrigin: config.corsOrigin,
    siaDatabase: config.sia.database,
    sidinaccDatabase: config.sidinacc.database,
    sameDatabaseUser: config.sameDatabaseUser,
    sidinaccPeriodId: config.sidinaccPeriodId
  };
}

module.exports = {
  ErrorConfiguracion,
  CargarConfiguracion,
  ResumenPublicoConfiguracion
};
