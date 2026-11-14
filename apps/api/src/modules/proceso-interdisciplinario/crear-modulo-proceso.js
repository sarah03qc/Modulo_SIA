/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 */
'use strict';

const { CrearRepositorioProceso } = require('./repositorio-proceso');
const { CrearServicioProceso } = require('./servicio-proceso');

/**
 * Arma el proceso interdisciplinario con el adaptador y la base propia.
 * No abre otra conexión.
 *
 * @param {object} dependencias Periodo, adaptador, cliente y repositorio opcional.
 * @returns {object} Servicio del proceso.
 */
function CrearModuloProceso(dependencias) {
  const repositorio = dependencias.repositorio || CrearRepositorioProceso(dependencias.sia);
  return CrearServicioProceso({
    periodId: dependencias.periodId,
    adaptador: dependencias.adapter,
    repositorio
  });
}

module.exports = { CrearModuloProceso };
