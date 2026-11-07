'use strict';

/*
  Identidades sinteticas solo para development y test.
  No representan la sesion institucional de SIDINACC (NEEDS_VALIDATION con UTIC).
  El consumidor no elige rol ni ambito: presenta un identificador que el servidor ya asocio.
  Los identificadores no son secretos de produccion. La API solo arranca en local y
  rechaza NODE_ENV=production.
  HU-005 a HU-008, RF-012, RF-104.
*/

const ACCESS_LEVEL = Object.freeze({
  ESTABLISHMENT: 'ESTABLECIMIENTO',
  LOCAL_OFFICE: 'OFICINA_LOCAL',
  REGION: 'REGION',
  NATIONAL: 'NACIONAL'
});

function principal(definition) {
  const establishmentIds = definition.establishmentIds
    ? Object.freeze(definition.establishmentIds.slice())
    : null;
  if (establishmentIds) {
    for (const establishmentId of establishmentIds) {
      if (!Number.isInteger(establishmentId) || establishmentId <= 0) {
        throw new Error('La identidad de desarrollo tiene un establecimiento invalido.');
      }
    }
  }
  return Object.freeze({
    principalId: definition.principalId,
    accessLevel: definition.accessLevel,
    regionId: definition.regionId || null,
    localOfficeId: definition.localOfficeId || null,
    establishmentIds
  });
}

// Ambitos tomados del catalogo territorial publico de la replica, no de personas reales.
// Establecimiento 1100102 y 1010320 pertenecen a la Oficina Local 101, Region 1.
// Oficina Local 501 y Region 5 sirven para comprobar exclusion de ambito.
const DEVELOPMENT_PRINCIPALS = Object.freeze([
  principal({
    principalId: 'dev-establecimiento-unico',
    accessLevel: ACCESS_LEVEL.ESTABLISHMENT,
    establishmentIds: [1100102]
  }),
  principal({
    principalId: 'dev-establecimiento-multiple',
    accessLevel: ACCESS_LEVEL.ESTABLISHMENT,
    establishmentIds: [1100102, 1010320]
  }),
  principal({
    principalId: 'dev-oficina-hatillo',
    accessLevel: ACCESS_LEVEL.LOCAL_OFFICE,
    regionId: 1,
    localOfficeId: 101
  }),
  principal({
    principalId: 'dev-oficina-perez-zeledon',
    accessLevel: ACCESS_LEVEL.LOCAL_OFFICE,
    regionId: 5,
    localOfficeId: 501
  }),
  principal({
    principalId: 'dev-region-central-sur',
    accessLevel: ACCESS_LEVEL.REGION,
    regionId: 1
  }),
  principal({
    principalId: 'dev-region-brunca',
    accessLevel: ACCESS_LEVEL.REGION,
    regionId: 5
  }),
  principal({
    principalId: 'dev-nacional',
    accessLevel: ACCESS_LEVEL.NATIONAL
  })
]);

const principalsById = new Map(
  DEVELOPMENT_PRINCIPALS.map((item) => [item.principalId, item])
);

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
