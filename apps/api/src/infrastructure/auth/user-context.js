'use strict';

const { ACCESS_LEVEL, EsRolInstitucional } = require('./institutional-roles');
const { CapacidadesDeRoles } = require('./capabilities');

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
function EnteroPositivo(value) {
  return Number.isInteger(value) && value > 0;
}

/*
  Propósito: copiar identificadores de establecimiento válidos y únicos
  Entrada: lista declarada en una concesión
  Salida: lista congelada, o null si algún valor no es utilizable
*/
function IdentificadoresDeEstablecimiento(value) {
  if (!Array.isArray(value) || value.length === 0) {
    return null;
  }
  const ids = [];
  for (const establishmentId of value) {
    if (!EnteroPositivo(establishmentId)) {
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
function AnclasAusentes(concesion, names) {
  return names.every((name) => concesion[name] === null || concesion[name] === undefined);
}

/*
  Propósito: normalizar una concesión sin ampliarla
  Entrada: concesión declarada por el registro del servidor
  Salida: concesión congelada, o null si el rol o el ámbito no son utilizables
*/
function NormalizarConcesion(concesion) {
  if (!concesion || !EsRolInstitucional(concesion.role)) {
    return null;
  }
  if (concesion.role === ACCESS_LEVEL.ESTABLISHMENT) {
    const establishmentIds = IdentificadoresDeEstablecimiento(concesion.establishmentIds);
    if (!establishmentIds || !AnclasAusentes(concesion, ['regionId', 'localOfficeId'])) {
      return null;
    }
    return Object.freeze({
      role: concesion.role,
      regionId: null,
      localOfficeId: null,
      establishmentIds
    });
  }
  if (concesion.role === ACCESS_LEVEL.LOCAL_OFFICE) {
    if (!EnteroPositivo(concesion.regionId) || !EnteroPositivo(concesion.localOfficeId)) {
      return null;
    }
    if (!AnclasAusentes(concesion, ['establishmentIds'])) {
      return null;
    }
    return Object.freeze({
      role: concesion.role,
      regionId: concesion.regionId,
      localOfficeId: concesion.localOfficeId,
      establishmentIds: null
    });
  }
  if (concesion.role === ACCESS_LEVEL.REGION) {
    if (!EnteroPositivo(concesion.regionId) || !AnclasAusentes(concesion, ['localOfficeId', 'establishmentIds'])) {
      return null;
    }
    return Object.freeze({
      role: concesion.role,
      regionId: concesion.regionId,
      localOfficeId: null,
      establishmentIds: null
    });
  }
  if (concesion.role !== ACCESS_LEVEL.NATIONAL) {
    return null;
  }
  if (!AnclasAusentes(concesion, ['regionId', 'localOfficeId', 'establishmentIds'])) {
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
function DerivarAncla(grants) {
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
    const concesion = grants[0];
    return {
      accessLevel: concesion.role,
      regionId: concesion.regionId,
      localOfficeId: concesion.localOfficeId,
      establishmentIds: concesion.establishmentIds
    };
  }
  const establishmentGrants = grants.every((concesion) => concesion.role === ACCESS_LEVEL.ESTABLISHMENT);
  if (!establishmentGrants) {
    return empty;
  }
  const establishmentIds = [];
  for (const concesion of grants) {
    for (const establishmentId of concesion.establishmentIds) {
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
function CrearContextoUsuario(identidad) {
  const source = identidad && Array.isArray(identidad.grants) ? identidad.grants : [];
  const grants = Object.freeze(source.map(NormalizarConcesion).filter(Boolean));
  const roles = Object.freeze([...new Set(grants.map((concesion) => concesion.role))]);
  const capabilities = Object.freeze(CapacidadesDeRoles(roles));
  const anchor = DerivarAncla(grants);
  const principalId = identidad && typeof identidad.principalId === 'string' && identidad.principalId.length > 0
    ? identidad.principalId
    : null;
  return Object.freeze({
    principalId,
    identitySource: identidad && identidad.source === 'SYNTHETIC_DEVELOPMENT'
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
  CrearContextoUsuario
};
