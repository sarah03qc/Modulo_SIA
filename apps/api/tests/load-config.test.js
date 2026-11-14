'use strict';

const { ErrorConfiguracion, CargarConfiguracion, ResumenPublicoConfiguracion } = require('../src/config/load-config');
const { EntornoValido } = require('./env-fixture');

describe('CargarConfiguracion', () => {
  test('acepta una configuración de prueba separada por base', () => {
    const config = CargarConfiguracion(EntornoValido());
    expect(config.sia.database).toBe('SIA_CENCINAI');
    expect(config.sidinacc.database).toBe('SIDINACC_LOCAL');
    expect(config.sameDatabaseUser).toBe(false);
    expect(JSON.stringify(ResumenPublicoConfiguracion(config))).not.toContain('sia-secret-value');
    expect(JSON.stringify(ResumenPublicoConfiguracion(config))).not.toContain('reader-secret-value');
  });

  test('rechaza producción y un nombre de base distinto del previsto', () => {
    expect(() => CargarConfiguracion(EntornoValido({ NODE_ENV: 'production' }))).toThrow(ErrorConfiguracion);
    expect(() => CargarConfiguracion(EntornoValido({ NODE_ENV: 'production' }))).toThrow(/producción/);
    expect(() => CargarConfiguracion(EntornoValido({ SIA_DB_NAME: 'master' }))).toThrow(/SIA_CENCINAI/);
    expect(() => CargarConfiguracion(EntornoValido({ SIDINACC_DB_NAME: 'SIA_CENCINAI' }))).toThrow(/SIDINACC_LOCAL/);
  });

  test('no incluye secretos en el mensaje cuando falta configuración', () => {
    const env = EntornoValido();
    delete env.SIA_DB_PASSWORD;
    expect(() => CargarConfiguracion(env)).toThrow('Falta la variable obligatoria SIA_DB_PASSWORD.');
    try {
      CargarConfiguracion(env);
    } catch (error) {
      expect(error.message).not.toContain('reader-secret-value');
      expect(error.message).not.toContain('sia-secret-value');
    }
  });

  test('rechaza el valor de ejemplo y un origen con credenciales', () => {
    expect(() => CargarConfiguracion(EntornoValido({ SIDINACC_DB_PASSWORD: 'CHANGE_ME' }))).toThrow(/valor de ejemplo/);
    expect(() => CargarConfiguracion(EntornoValido({
      CORS_ORIGIN: 'http://user:password@127.0.0.1:5174'
    }))).toThrow(/credenciales/);
  });

  test('marca cuando las dos conexiones usan el mismo usuario', () => {
    const config = CargarConfiguracion(EntornoValido({ SIDINACC_DB_USER: 'sia_user' }));
    expect(config.sameDatabaseUser).toBe(true);
  });
});
