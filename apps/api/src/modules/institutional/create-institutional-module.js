'use strict';

const { createCaseSummaryReader } = require('../../infrastructure/persistence/case-summary-reader');
const { createPersonQueryService } = require('./person-query-service');

/**
 * Arma la consulta institucional con el adaptador de la réplica
 * y el lector de casos de SIA_CENCINAI.
 * Si no recibe un lector de casos, lo crea con el cliente de la base propia.
 */
function createInstitutionalModule(dependencies) {
  const cases = dependencies.cases || createCaseSummaryReader(dependencies.sia);
  return createPersonQueryService({
    periodId: dependencies.periodId,
    adapter: dependencies.adapter,
    cases,
    clock: dependencies.clock
  });
}

module.exports = { createInstitutionalModule };
