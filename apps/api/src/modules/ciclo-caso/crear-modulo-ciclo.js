/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-027, HU-028, HU-030 y HU-031.
 */
'use strict';

const { CrearRepositorioCiclo } = require('./repositorio-ciclo');
const { CrearServicioCiclo } = require('./servicio-ciclo');

/**
 * Arma el ciclo del caso con la base propia y el expediente ya existente.
 *
 * @param {object} dependencias Adaptador, cliente, repositorio y proceso.
 * @returns {object} Servicio del ciclo.
 */
function CrearModuloCiclo(dependencias) {
  const repositorio = dependencias.repositorio
    || CrearRepositorioCiclo(dependencias.sia);
  return CrearServicioCiclo({
    adaptador: dependencias.adaptador,
    repositorio,
    proceso: dependencias.proceso
  });
}

module.exports = { CrearModuloCiclo };
