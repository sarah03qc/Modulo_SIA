'use strict';

const { ACCESS_LEVEL, isInstitutionalRole } = require('./institutional-roles');
const { capabilitiesForRoles } = require('./capabilities');

/*
  Contexto interno del usuario.
  Se arma solo con concesiones de rol ya aceptadas por el adaptador.
  No lee capacidades, roles ni establecimientos enviados por el cliente.
  Varios establecimientos del mismo rol Establecimiento se unen.
  RF-104. Si las concesiones no forman un ancla, scopeConfirmed queda en falso
  y las capacidades listadas no se pueden usar.
*/

/*
  Propósito: aceptar un entero institucional positivo
  Entrada: valor candidato
  Salida: true cuando es un entero mayor que cero
*/
function positiveInt(value) {
  return Number.isInteger(value) && value > 0;
}

/*
  Propósito: copiar identificadores de establecimiento válidos y únicos
  Entrada: lista declarada en una concesión
  Salida: lista congelada, o null si algún valor no es utilizable
*/
function establishmentIdsOf(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const ids = [];
  for (const establishmentId of value) {
    if (!positiveInt(establishmentId)) {
      return null;
    }
    if (!ids.includes(establishmentId)) {
      ids.push(establishmentId);
    }
  }
  return Object.freeze(ids);
}

/*
  Propósito: descartar anclas territoriales que el rol no usa
  Entrada: concesión y nombres de anclas que deben venir vacías
  Salida: true cuando esas anclas no traen un valor
*/
function anchorsAbsent(grant, names) {
  return names.every((name) => grant[name] === null || grant[name] === undefined);
}

/*
  Propósito: normalizar una concesión sin ampliarla
  Entrada: concesión declarada por el registro del servidor
  Salida: concesión congelada, o null si el rol o el ámbito no son utilizables
*/
function normalizeGrant(grant) {
  if (!grant || !isInstitutionalRole(grant.role)) {
    return null;
  }
  if (grant.role === ACCESS_LEVEL.ESTABLISHMENT) {
    const establishmentIds = establishmentIdsOf(grant.establishmentIds);
    if (!establishmentIds || !anchorsAbsent(grant, ['regionId', 'localOfficeId'])) {
      return null;
    }
    return Object.freeze({
      role: grant.role,
      regionId: null,
      localOfficeId: null,
      establishmentIds
    });
  }
  if (grant.role === ACCESS_LEVEL.LOCAL_OFFICE) {
    if (!positiveInt(grant.regionId) || !positiveInt(grant.localOfficeId)) {
      return null;
    }
    if (!anchorsAbsent(grant, ['establishmentIds'])) {
      return null;
    }
    return Object.freeze({
      role: grant.role,
      regionId: grant.regionId,
      localOfficeId: grant.localOfficeId,
      establishmentIds: null
    });
  }
  if (grant.role === ACCESS_LEVEL.REGION) {
    if (!positiveInt(grant.regionId) || !anchorsAbsent(grant, ['localOfficeId', 'establishmentIds'])) {
      return null;
    }
    return Object.freeze({
      role: grant.role,
      regionId: grant.regionId,
      localOfficeId: null,
      establishmentIds: null
    });
  }
  if (grant.role !== ACCESS_LEVEL.NATIONAL) {
    return null;
  }
  if (!anchorsAbsent(grant, ['regionId', 'localOfficeId', 'establishmentIds'])) {
    return null;
  }
  return Object.freeze({
    role: ACCESS_LEVEL.NATIONAL,
    regionId: null,
    localOfficeId: null,
    establishmentIds: null
  });
}

/*
  Propósito: obtener el ancla territorial que el resolvedor actual ya sabe aplicar
  Entrada: concesiones normalizadas
  Salida: nivel, región, oficina y establecimientos
  Varias concesiones de Establecimiento se unen. Otra combinación no fabrica un nivel superior.
*/
function deriveAnchor(grants) {
  const empty = {
    accessLevel: null,
    regionId: null,
    localOfficeId: null,
    establishmentIds: null
  };
  if (grants.length === 0) {
    return empty;
  }
  if (grants.length === 1) {
    const grant = grants[0];
    return {
      accessLevel: grant.role,
      regionId: grant.regionId,
      localOfficeId: grant.localOfficeId,
      establishmentIds: grant.establishmentIds
    };
  }
  const establishmentGrants = grants.every((grant) => grant.role === ACCESS_LEVEL.ESTABLISHMENT);
  if (!establishmentGrants) {
    return empty;
  }
  const establishmentIds = [];
  for (const grant of grants) {
    for (const establishmentId of grant.establishmentIds) {
      if (!establishmentIds.includes(establishmentId)) {
        establishmentIds.push(establishmentId);
      }
    }
  }
  return {
    accessLevel: ACCESS_LEVEL.ESTABLISHMENT,
    regionId: null,
    localOfficeId: null,
    establishmentIds: Object.freeze(establishmentIds)
  };
}

/*
  Propósito: construir el contexto interno que usan políticas y servicios
  Entrada: identidad ya separada del transporte, con principalId, source y grants
  Salida: contexto congelado con roles, capacidades y ancla territorial
  Ignora capabilities, roles y accessLevel que vengan en el mismo objeto
*/
function createUserContext(identity) {
  const source = identity && Array.isArray(identity.grants) ? identity.grants : [];
  const grants = Object.freeze(source.map(normalizeGrant).filter(Boolean));
  const roles = Object.freeze([...new Set(grants.map((grant) => grant.role))]);
  const capabilities = Object.freeze(capabilitiesForRoles(roles));
  const anchor = deriveAnchor(grants);
  const principalId = identity && typeof identity.principalId === 'string' && identity.principalId.length > 0
    ? identity.principalId
    : null;
  return Object.freeze({
    principalId,
    identitySource: identity && identity.source === 'SYNTHETIC_DEVELOPMENT'
      ? 'SYNTHETIC_DEVELOPMENT'
      : 'UNCONFIRMED',
    roles,
    grants,
    capabilities,
    accessLevel: anchor.accessLevel,
    regionId: anchor.regionId,
    localOfficeId: anchor.localOfficeId,
    establishmentIds: anchor.establishmentIds,
    scopeConfirmed: anchor.accessLevel !== null
  });
}

module.exports = {
  createUserContext
};
