'use strict';

const { ConfigError, loadConfig, publicConfigSummary } = require('../src/config/load-config');
const { validEnv } = require('./env-fixture');

describe('loadConfig', () => {
  test('acepta una configuración de prueba separada por base', () => {
    const config = loadConfig(validEnv());
    expect(config.sia.database).toBe('SIA_CENCINAI');
    expect(config.sidinacc.database).toBe('SIDINACC_LOCAL');
    expect(config.sameDatabaseUser).toBe(false);
    expect(JSON.stringify(publicConfigSummary(config))).not.toContain('sia-secret-value');
    expect(JSON.stringify(publicConfigSummary(config))).not.toContain('reader-secret-value');
  });

  test('rechaza producción y un nombre de base distinto del previsto', () => {
    expect(() => loadConfig(validEnv({ NODE_ENV: 'production' }))).toThrow(ConfigError);
    expect(() => loadConfig(validEnv({ NODE_ENV: 'production' }))).toThrow(/producción/);
    expect(() => loadConfig(validEnv({ SIA_DB_NAME: 'master' }))).toThrow(/SIA_CENCINAI/);
    expect(() => loadConfig(validEnv({ SIDINACC_DB_NAME: 'SIA_CENCINAI' }))).toThrow(/SIDINACC_LOCAL/);
  });

  test('no incluye secretos en el mensaje cuando falta configuración', () => {
    const env = validEnv();
    delete env.SIA_DB_PASSWORD;
    expect(() => loadConfig(env)).toThrow('Falta la variable obligatoria SIA_DB_PASSWORD.');
    try {
      loadConfig(env);
    } catch (error) {
      expect(error.message).not.toContain('reader-secret-value');
      expect(error.message).not.toContain('sia-secret-value');
    }
  });

  test('rechaza el valor de ejemplo y un origen con credenciales', () => {
    expect(() => loadConfig(validEnv({ SIDINACC_DB_PASSWORD: 'CHANGE_ME' }))).toThrow(/valor de ejemplo/);
    expect(() => loadConfig(validEnv({
      CORS_ORIGIN: 'http://user:password@127.0.0.1:5174'
    }))).toThrow(/credenciales/);
  });

  test('marca cuando las dos conexiones usan el mismo usuario', () => {
    const config = loadConfig(validEnv({ SIDINACC_DB_USER: 'sia_user' }));
    expect(config.sameDatabaseUser).toBe(true);
  });
});
