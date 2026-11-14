'use strict';

// Solo habilita las suites que modifican o intentan modificar una base sintética local.
function PermitirEscriturasSqlLocales(entorno) {
  const servidoresLocales = ['127.0.0.1', 'localhost', '::1'];
  return entorno.SIA_TEST_ENABLE_SQL_WRITES === '1'
    && ['development', 'test'].includes(entorno.NODE_ENV)
    && servidoresLocales.includes(entorno.SIA_DB_SERVER)
    && servidoresLocales.includes(entorno.SIDINACC_DB_SERVER);
}

module.exports = { PermitirEscriturasSqlLocales };
