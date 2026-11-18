/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Arma el módulo con la réplica de solo lectura y la base propia.
 */
'use strict';

const { ErrorInfraestructura } = require('../../common/errors');
const { CrearRepositorioPosibles } = require('./repositorio-posibles');
const { CrearServicioPosibles, ProgramarDeteccion } = require('./servicio-posibles');
const { DeteccionAutomaticaHabilitada, LeerModo } = require('./configuracion-nutricion');

function RepositorioAusente() {
  return new Proxy({}, {
    get() {
      return () => {
        throw new ErrorInfraestructura('La base de posibles referencias no está disponible.');
      };
    }
  });
}

/**
 * @param {object} dependencias Periodo, adaptador, cliente SQL y entorno.
 * @returns {object} Servicio de posibles referencias.
 */
function CrearModuloPosibles(dependencias) {
  const cliente = dependencias.sia;
  const repositorio = dependencias.repositorio
    || (cliente && typeof cliente.query === 'function'
      ? CrearRepositorioPosibles(cliente)
      : RepositorioAusente());
  const servicio = CrearServicioPosibles({
    periodId: dependencias.periodId,
    adaptador: dependencias.adaptador,
    repositorio,
    modo: LeerModo(dependencias.env || process.env),
    logger: dependencias.logger
  });
  if (DeteccionAutomaticaHabilitada(dependencias.env || process.env)) {
    ProgramarDeteccion(servicio, dependencias.logger);
  }
  return servicio;
}

module.exports = { CrearModuloPosibles };
