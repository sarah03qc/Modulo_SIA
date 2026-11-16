/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 */
'use strict';

const { CrearRepositorioAtenciones } = require('./repositorio-atenciones');
const { CrearServicioAtenciones } = require('./servicio-atenciones');

/**
 * Arma el módulo de atenciones con la misma base de SIA_CENCINAI.
 *
 * @param {object} dependencias Adaptador, cliente y repositorio opcional.
 * @returns {object} Servicio de atenciones.
 */
function CrearModuloAtenciones(dependencias) {
  const repositorio = dependencias.repositorio || CrearRepositorioAtenciones(dependencias.sia);
  return CrearServicioAtenciones({
    adaptador: dependencias.adapter,
    repositorio
  });
}

module.exports = { CrearModuloAtenciones };
