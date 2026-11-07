'use strict';

const { SIA_DATABASE, SIDINACC_DATABASE } = require('./databases');

const ALLOWED_ENVIRONMENTS = new Set(['development', 'test']);
const ALLOWED_LOG_LEVELS = new Set(['error', 'warn', 'info']);
const ALLOWED_HOSTS = new Set(['127.0.0.1', 'localhost']);
const EXAMPLE_SECRET = 'CHANGE_ME';

class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
    this.code = 'INVALID_CONFIGURATION';
  }
}

function requireText(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || value.trim() === '') {
    throw new ConfigError(`Falta la variable obligatoria ${key}.`);
  }
  return value.trim();
}

function requireSecret(env, key) {
  const value = env[key];
  if (typeof value !== 'string' || value.length === 0) {
    throw new ConfigError(`Falta la variable obligatoria ${key}.`);
  }
  if (value === EXAMPLE_SECRET) {
    throw new ConfigError(`${key} sigue en el valor de ejemplo.`);
  }
  return value;
}

function requirePort(env, key) {
  const raw = requireText(env, key);
  if (!/^\d+$/.test(raw)) {
    throw new ConfigError(`${key} debe ser un puerto numérico.`);
  }
  const port = Number(raw);
  if (port < 1 || port > 65535) {
    throw new ConfigError(`${key} debe estar entre 1 y 65535.`);
  }
  return port;
}

function requireBoolean(env, key) {
  const raw = requireText(env, key).toLowerCase();
  if (raw !== 'true' && raw !== 'false') {
    throw new ConfigError(`${key} debe ser true o false.`);
  }
  return raw === 'true';
}

function requirePositiveInt(env, key) {
  const raw = requireText(env, key);
  if (!/^\d+$/.test(raw) || Number(raw) < 1) {
    throw new ConfigError(`${key} debe ser un entero positivo.`);
  }
  return Number(raw);
}

function requireOrigin(env, key) {
  const raw = requireText(env, key);
  let url;
  try {
    url = new URL(raw);
  } catch {
    throw new ConfigError(`${key} debe ser una URL absoluta de origen.`);
  }
  if (url.protocol !== 'http:' && url.protocol !== 'https:') {
    throw new ConfigError(`${key} debe usar http o https.`);
  }
  if (url.username || url.password) {
    throw new ConfigError(`${key} no debe incluir credenciales.`);
  }
  if (url.pathname !== '/' || url.search || url.hash) {
    throw new ConfigError(`${key} debe ser solo el origen, sin ruta ni consulta.`);
  }
  return url.origin;
}

function requireDatabaseName(env, key, expected) {
  const name = requireText(env, key);
  if (name !== expected) {
    throw new ConfigError(`${key} debe ser ${expected}.`);
  }
  return name;
}

function loadDatabase(env, prefix, expectedName) {
  return {
    server: requireText(env, `${prefix}_DB_SERVER`),
    port: requirePort(env, `${prefix}_DB_PORT`),
    database: requireDatabaseName(env, `${prefix}_DB_NAME`, expectedName),
    user: requireText(env, `${prefix}_DB_USER`),
    password: requireSecret(env, `${prefix}_DB_PASSWORD`),
    encrypt: requireBoolean(env, `${prefix}_DB_ENCRYPT`),
    trustServerCertificate: requireBoolean(env, `${prefix}_DB_TRUST_SERVER_CERTIFICATE`)
  };
}

function loadConfig(env) {
  const source = env || {};
  const nodeEnv = requireText(source, 'NODE_ENV');
  if (!ALLOWED_ENVIRONMENTS.has(nodeEnv)) {
    throw new ConfigError(
      'NODE_ENV debe ser development o test. El arranque de producción no está habilitado.'
    );
  }

  const logLevel = requireText(source, 'LOG_LEVEL');
  if (!ALLOWED_LOG_LEVELS.has(logLevel)) {
    throw new ConfigError('LOG_LEVEL debe ser error, warn o info.');
  }

  const host = requireText(source, 'API_HOST');
  if (!ALLOWED_HOSTS.has(host)) {
    throw new ConfigError('API_HOST debe ser 127.0.0.1 o localhost en este bootstrap.');
  }

  const sia = loadDatabase(source, 'SIA', SIA_DATABASE);
  const sidinacc = loadDatabase(source, 'SIDINACC', SIDINACC_DATABASE);

  return {
    nodeEnv,
    host,
    port: requirePort(source, 'API_PORT'),
    logLevel,
    corsOrigin: requireOrigin(source, 'CORS_ORIGIN'),
    connectionTimeoutMs: requirePositiveInt(source, 'DB_CONNECTION_TIMEOUT_MS'),
    requestTimeoutMs: requirePositiveInt(source, 'DB_REQUEST_TIMEOUT_MS'),
    poolMax: requirePositiveInt(source, 'DB_POOL_MAX'),
    sia,
    sidinacc,
    sameDatabaseUser: sia.user.toLowerCase() === sidinacc.user.toLowerCase(),
    // Periodo de lectura de la replica. El cliente HTTP no puede cambiarlo.
    sidinaccPeriodId: requirePositiveInt(source, 'SIDINACC_PERIOD_ID')
  };
}

function publicConfigSummary(config) {
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
  ConfigError,
  loadConfig,
  publicConfigSummary
};
