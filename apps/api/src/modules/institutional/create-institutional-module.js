'use strict';

const { CrearLectorResumenCasos } = require('../../infrastructure/persistence/case-summary-reader');
const { CrearServicioConsultaPersona } = require('./person-query-service');

/**
 * Arma la consulta institucional con el adaptador de la réplica
 * y el lector de casos de SIA_CENCINAI.
 * Si no recibe un lector de casos, lo crea con el cliente de la base propia.
 */
function CrearModuloInstitucional(dependencies) {
  const cases = dependencies.cases || CrearLectorResumenCasos(dependencies.sia);
  return CrearServicioConsultaPersona({
    periodId: dependencies.periodId,
    adapter: dependencies.adapter,
    cases,
    clock: dependencies.clock
  });
}

module.exports = { CrearModuloInstitucional };
