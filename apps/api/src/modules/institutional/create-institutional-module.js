'use strict';

const { createCaseSummaryReader } = require('../../infrastructure/persistence/case-summary-reader');
const { createPersonQueryService } = require('./person-query-service');

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
