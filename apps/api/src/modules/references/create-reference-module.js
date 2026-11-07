'use strict';

const { createReferenceRepository } = require('./reference-repository');
const { createReferenceService } = require('./reference-service');

/**
 * Arma el módulo de referencias con el adaptador institucional y la base propia.
 * No abre una conexión nueva: usa el cliente que ya creó el arranque.
 *
 * @param {object} dependencies Periodo, adaptador y cliente SQL.
 * @returns {object} Servicio de referencias.
 */
function createReferenceModule(dependencies) {
  const repository = dependencies.repository || createReferenceRepository(dependencies.sia);
  return createReferenceService({
    periodId: dependencies.periodId,
    adapter: dependencies.adapter,
    repository
  });
}

module.exports = { createReferenceModule };
