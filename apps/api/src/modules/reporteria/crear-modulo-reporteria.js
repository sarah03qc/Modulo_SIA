/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. La aplicación entrega el adaptador como adapter.
 */
'use strict';

const { CrearRepositorioReporteria } = require('./repositorio-reporteria');
const { CrearServicioReporteria } = require('./servicio-reporteria');

function CrearModuloReporteria(dependencias) {
  const repositorio = dependencias.repositorio
    || CrearRepositorioReporteria(dependencias.sia);
  return CrearServicioReporteria({
    adaptador: dependencias.adapter || dependencias.adaptador,
    repositorio
  });
}

module.exports = { CrearModuloReporteria };
