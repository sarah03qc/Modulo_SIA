'use strict';

const { ACCESS_LEVEL, isInstitutionalRole } = require('./institutional-roles');

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
function positiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

/*
  Propósito: congelar una concesión sintética o detener el arranque si está mal formada
  Entrada: rol interno y anclas territoriales del registro
  Salida: concesión congelada que el adaptador puede normalizar
*/
function grant(definition) {
  if (!isInstitutionalRole(definition.role)) {
    throw new Error('La identidad de desarrollo tiene un rol no reconocido.');
  }
  if (definition.role === ACCESS_LEVEL.ESTABLISHMENT) {
    const establishmentIds = definition.establishmentIds;
    if (!Array.isArray(establishmentIds) || establishmentIds.length === 0) {
      throw new Error('La identidad de desarrollo no tiene establecimientos.');
    }
    for (const establishmentId of establishmentIds) {
      if (!positiveInt(establishmentId)) {
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
    if (!positiveInt(definition.regionId) || !positiveInt(definition.localOfficeId)) {
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
    if (!positiveInt(definition.regionId)) {
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
function identity(principalId, grants) {
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
  identity('dev-establecimiento-unico', [
    grant({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] })
  ]),
  identity('dev-establecimiento-multiple', [
    grant({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102, 1010320] })
  ]),
  identity('dev-establecimientos-por-rol', [
    grant({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] }),
    grant({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1010320] })
  ]),
  identity('dev-oficina-hatillo', [
    grant({ role: ACCESS_LEVEL.LOCAL_OFFICE, regionId: 1, localOfficeId: 101 })
  ]),
  identity('dev-oficina-perez-zeledon', [
    grant({ role: ACCESS_LEVEL.LOCAL_OFFICE, regionId: 5, localOfficeId: 501 })
  ]),
  identity('dev-region-central-sur', [
    grant({ role: ACCESS_LEVEL.REGION, regionId: 1 })
  ]),
  identity('dev-region-brunca', [
    grant({ role: ACCESS_LEVEL.REGION, regionId: 5 })
  ]),
  identity('dev-nacional', [
    grant({ role: ACCESS_LEVEL.NATIONAL })
  ]),
  identity('dev-roles-heterogeneos', [
    grant({ role: ACCESS_LEVEL.ESTABLISHMENT, establishmentIds: [1100102] }),
    grant({ role: ACCESS_LEVEL.NATIONAL })
  ]),
  identity('dev-sin-capacidades', [])
]);

const principalsById = new Map(
  DEVELOPMENT_PRINCIPALS.map((item) => [item.principalId, item])
);

/*
  Propósito: buscar una identidad sintética por el identificador que presenta el cliente
  Entrada: texto del identificador
  Salida: identidad del servidor, o null si no está registrada
*/
function findDevelopmentPrincipal(principalId) {
  if (typeof principalId !== 'string' || principalId.length === 0) {
    return null;
  }
  return principalsById.get(principalId) || null;
}

module.exports = {
  ACCESS_LEVEL,
  DEVELOPMENT_PRINCIPALS,
  findDevelopmentPrincipal
};
