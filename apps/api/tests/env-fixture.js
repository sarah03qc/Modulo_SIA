'use strict';

function validEnv(overrides = {}) {
  return {
    NODE_ENV: 'test',
    API_HOST: '127.0.0.1',
    API_PORT: '3001',
    LOG_LEVEL: 'error',
    CORS_ORIGIN: 'http://127.0.0.1:5174',
    DB_CONNECTION_TIMEOUT_MS: '15000',
    DB_REQUEST_TIMEOUT_MS: '15000',
    DB_POOL_MAX: '5',
    SIA_DB_SERVER: '127.0.0.1',
    SIA_DB_PORT: '1433',
    SIA_DB_NAME: 'SIA_CENCINAI',
    SIA_DB_USER: 'sia_user',
    SIA_DB_PASSWORD: 'sia-secret-value',
    SIA_DB_ENCRYPT: 'false',
    SIA_DB_TRUST_SERVER_CERTIFICATE: 'true',
    SIDINACC_DB_SERVER: '127.0.0.1',
    SIDINACC_DB_PORT: '1433',
    SIDINACC_DB_NAME: 'SIDINACC_LOCAL',
    SIDINACC_DB_USER: 'sidinacc_reader',
    SIDINACC_DB_PASSWORD: 'reader-secret-value',
    SIDINACC_DB_ENCRYPT: 'false',
    SIDINACC_DB_TRUST_SERVER_CERTIFICATE: 'true',
    SIDINACC_PERIOD_ID: '2026',
    ...overrides
  };
}

module.exports = { validEnv };
