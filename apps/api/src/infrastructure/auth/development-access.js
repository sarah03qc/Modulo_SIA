'use strict';

const { ACCESS_LEVEL, EsRolInstitucional } = require('./institutional-roles');

/*
  Identidades sintéticas solo para development y test.
  No representan la sesión institucional de SIDINACC. Ese mecanismo sigue NEEDS_VALIDATION con UTIC.
  El consumidor no elige rol ni ámbito: presenta un identificador que el servidor ya asoció.
  Los identificadores no son secretos de producción ni perfiles de SIDINACC.
  La API rechaza NODE_ENV=production en la configuración.
  HU-005 a HU-008, RF-012 y RF-104.
  El registro no es una asignación institucional paralela. Es el doble de prueba del proveedor futuro.
*/

/*
  Propósito: validar un entero de catálogo usado por una identidad sintética
  Entrada: valor candidato
  Salida: true cuando es un entero mayor que cero
*/
function EnteroPositivo(value) {
  return Number.isInteger(value) && value > 0;
}

/*
  Propósito: congelar una concesión sintética o detener el arranque si está mal formada
  Entrada: rol interno y anclas territoriales del registro
  Salida: concesión congelada que el adaptador puede normalizar
*/
function CrearConcesion(definition) {
  if (!EsRolInstitucional(definition.role)) {
    throw new Error('La identidad de desarrollo tiene un rol no reconocido.');
  }
  if (definition.role === ACCESS_LEVEL.ESTABLISHMENT) {
    const establishmentIds = definition.establishmentIds;
    if (!Array.isArray(establishmentIds) || establishmentIds.length === 0) {
      throw new Error('La identidad de desarrollo no tiene establecimientos.');
    }
    for (const establishmentId of establishmentIds) {
      if (!EnteroPositivo(establishmentId)) {
        throw new Error('La identidad de desarrollo tiene un establecimiento invalido.');
      }
    }
    return Object.freeze({
      role: definition.role,
      regionId: null,
      localOfficeId: null,
      establishmentIds: Object.freeze(establishmentIds.slice())
    });
  }
  if (definition.role === ACCESS_LEVEL.LOCAL_OFFICE) {
    if (!EnteroPositivo(definition.regionId) || !EnteroPositivo(definition.localOfficeId)) {
      throw new Error('La identidad de desarrollo no tiene oficina local.');
    }
    return Object.freeze({
      role: definition.role,
      regionId: definition.regionId,
      localOfficeId: definition.localOfficeId,
      establishmentIds: null
    });
  }
  if (definition.role === ACCESS_LEVEL.REGION) {
    if (!EnteroPositivo(definition.regionId)) {
      throw new Error('La identidad de desarrollo no tiene region.');
    }
    if (definition.localOfficeId !== undefined || definition.establishmentIds !== undefined) {
      throw new Error('La identidad regional de desarrollo trae un ambito que no corresponde.');
    }
    return Object.freeze({
      role: definition.role,
      regionId: definition.regionId,
      localOfficeId: null,
      establishmentIds: null
    });
  }
  if (definition.regionId !== undefined || definition.localOfficeId !== undefined || definition.establishmentIds !== undefined) {
    throw new Error('La identidad nacional de desarrollo trae un ambito que no corresponde.');
  }
  return Object.freeze({
    role: ACCESS_LEVEL.NATIONAL,
    regionId: null,
    localOfficeId: null,
    establishmentIds: null
  });
}

/*
  Propósito: registrar una identidad sintética sin capacidades elegidas por el cliente
  Entrada: identificador y concesiones ya validadas
  Salida: identidad congelada del proveedor de desarrollo
*/
function CrearIdentidad(principalId, grants) {
  return Object.freeze({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId,
    grants: Object.freeze(grants)
  });
}

// Ámbitos tomados del catálogo territorial público de la réplica, no de personas reales.
// Establecimiento 1100102 y 1010320 pertenecen a la Oficina Local 101, Región 1.
// Oficina Local 501 y Región 5 sirven para comprobar exclusión de ámbito.
const DEVELOPMENT_PRINCIPALS = Object.freeze([
  CrearIdentidad('dev-establecimiento-unico', [
    CrearConcesion({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] })
  ]),
  CrearIdentidad('dev-establecimiento-multiple', [
    CrearConcesion({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102, 1010320] })
  ]),
  CrearIdentidad('dev-establecimientos-por-rol', [
    CrearConcesion({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] }),
    CrearConcesion({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1010320] })
  ]),
  CrearIdentidad('dev-oficina-hatillo', [
    CrearConcesion({ role: ACCESS_LEVEL.LOCAL_OFFICE, regionId: 1, localOfficeId: 101 })
  ]),
  CrearIdentidad('dev-oficina-perez-zeledon', [
    CrearConcesion({ role: ACCESS_LEVEL.LOCAL_OFFICE, regionId: 5, localOfficeId: 501 })
  ]),
  CrearIdentidad('dev-region-central-sur', [
    CrearConcesion({ role: ACCESS_LEVEL.REGION, regionId: 1 })
  ]),
  CrearIdentidad('dev-region-brunca', [
    CrearConcesion({ role: ACCESS_LEVEL.REGION, regionId: 5 })
  ]),
  CrearIdentidad('dev-nacional', [
    CrearConcesion({ role: ACCESS_LEVEL.NATIONAL })
  ]),
  CrearIdentidad('dev-roles-heterogeneos', [
    CrearConcesion({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] }),
    CrearConcesion({ role: ACCESS_LEVEL.NATIONAL })
  ]),
  CrearIdentidad('dev-sin-capacidades', [])
]);

const principalsById = new Map(
  DEVELOPMENT_PRINCIPALS.map((item) => [item.principalId, item])
);

/*
  Propósito: buscar una identidad sintética por el identificador que presenta el cliente
  Entrada: texto del identificador
  Salida: identidad del servidor, o null si no está registrada
*/
function BuscarPrincipalDesarrollo(principalId) {
  if (typeof principalId !== 'string' || principalId.length === 0) {
    return null;
  }
  return principalsById.get(principalId) || null;
}

module.exports = {
  ACCESS_LEVEL,
  DEVELOPMENT_PRINCIPALS,
  BuscarPrincipalDesarrollo
};
