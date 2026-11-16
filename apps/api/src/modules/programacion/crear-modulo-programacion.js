/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-044. La aplicación entrega el adaptador como adapter.
 */
'use strict';

const { CrearRepositorioProgramacion } = require('./repositorio-programacion');
const { CrearServicioProgramacion } = require('./servicio-programacion');

function CrearModuloProgramacion(dependencias) {
  const repositorio = dependencias.repositorio
    || CrearRepositorioProgramacion(dependencias.sia);
  return CrearServicioProgramacion({
    adaptador: dependencias.adapter || dependencias.adaptador,
    repositorio
  });
}

module.exports = { CrearModuloProgramacion };
