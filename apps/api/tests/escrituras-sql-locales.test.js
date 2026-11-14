'use strict';

const { PermitirEscriturasSqlLocales } = require('./escrituras-sql-locales');

const entornoLocal = {
  NODE_ENV: 'test',
  SIA_DB_SERVER: '127.0.0.1',
  SIDINACC_DB_SERVER: 'localhost'
};

test('las escrituras SQL locales requieren consentimiento explícito', () => {
  expect(PermitirEscriturasSqlLocales(entornoLocal)).toBe(false);
  expect(PermitirEscriturasSqlLocales({
    ...entornoLocal,
    SIA_TEST_ENABLE_SQL_WRITES: '1'
  })).toBe(true);
});

test.each([
  ['NODE_ENV', 'production'],
  ['SIA_DB_SERVER', '192.0.2.1'],
  ['SIDINACC_DB_SERVER', '192.0.2.1']
])('rechaza la opción %s fuera del entorno sintético local', (nombre, valor) => {
  expect(PermitirEscriturasSqlLocales({
    ...entornoLocal,
    SIA_TEST_ENABLE_SQL_WRITES: '1',
    [nombre]: valor
  })).toBe(false);
});
