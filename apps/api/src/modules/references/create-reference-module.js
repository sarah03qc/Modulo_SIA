'use strict';

const { CrearRepositorioReferencias } = require('./reference-repository');
const { CrearServicioReferencias } = require('./reference-service');

/**
 * Arma el módulo de referencias con el adaptador institucional y la base propia.
 * No abre una conexión nueva: usa el cliente que ya creó el arranque.
 *
 * @param {object} dependencies Periodo, adaptador y cliente SQL.
 * @returns {object} Servicio de referencias.
 */
function CrearModuloReferencias(dependencies) {
  const repository = dependencies.repository || CrearRepositorioReferencias(dependencies.sia);
  return CrearServicioReferencias({
    periodId: dependencies.periodId,
    adapter: dependencies.adapter,
    repository
  });
}

module.exports = { CrearModuloReferencias };
