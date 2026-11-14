'use strict';

/*
  Resolución del ámbito territorial sobre la jerarquía
  Establecimiento, Oficina Local, Región y Nacional.
  Aplica el ancla ya concedida. No elige el rol ni lee la solicitud cruda.
  RF-012, RF-104 y RNF-001.
*/

const { ForbiddenError, ValidationError } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');

const OUTSIDE_SCOPE = 'El filtro territorial está fuera del ámbito autorizado.';
const INCOMPATIBLE = 'La combinación territorial no es compatible.';
const INACTIVE = 'El filtro territorial no corresponde a una unidad activa.';
const ESTABLISHMENT_FILTER_ONLY = 'El nivel Establecimiento solo admite filtro por establecimiento autorizado.';
const MISSING_SCOPE = 'El ámbito autorizado no está disponible.';

/**
 * Rechaza un filtro que cae fuera del ámbito ya concedido.
 */
function outsideScope() {
  return new ForbiddenError(OUTSIDE_SCOPE);
}

/**
 * Exige un contexto con nivel de acceso. Sin ese nivel no hay consulta territorial.
 */
function requireAccess(access) {
  if (!access || !access.accessLevel) {
    throw new ForbiddenError('No hay un contexto de acceso institucional.');
  }
}

/**
 * Arma el ámbito efectivo que usarán las consultas.
 * establishmentAppliedAutomatically indica que había un solo establecimiento
 * y no hizo falta elegirlo.
 */
function baseScope(access, extra) {
  return {
    accessLevel: access.accessLevel,
    regionId: extra.regionId ?? null,
    localOfficeId: extra.localOfficeId ?? null,
    establishmentIds: extra.establishmentIds ?? null,
    establishmentAppliedAutomatically: Boolean(extra.establishmentAppliedAutomatically)
  };
}

/**
 * Resuelve el ámbito de un acceso de Establecimiento.
 *
 * Solo admite filtrar por un establecimiento de su lista. Un filtro de región
 * u oficina se rechaza. Si la lista tiene un solo establecimiento, ese filtro
 * queda aplicado aunque la solicitud no lo envíe.
 */
function resolveEstablishmentLevel(access, filters) {
  if (filters.regionId !== null || filters.localOfficeId !== null) {
    throw new ValidationError(ESTABLISHMENT_FILTER_ONLY);
  }
  const authorized = access.establishmentIds;
  if (!Array.isArray(authorized) || authorized.length === 0) {
    throw new ForbiddenError(MISSING_SCOPE);
  }
  if (filters.establishmentId !== null && !authorized.includes(filters.establishmentId)) {
    throw outsideScope();
  }
  const establishmentIds = filters.establishmentId === null
    ? authorized.slice()
    : [filters.establishmentId];
  return baseScope(access, {
    establishmentIds,
    establishmentAppliedAutomatically: authorized.length === 1
  });
}

/**
 * Comprueba que la oficina exista y pertenezca a la región indicada.
 * Quien llama decide si el fallo es un ámbito ajeno o una combinación incompatible.
 */
async function officeWithin(territory, localOfficeId, regionId, reject) {
  const office = await territory.findLocalOffice(localOfficeId);
  if (!office || office.regionId !== regionId) {
    throw reject();
  }
  return office;
}

/**
 * Comprueba que el establecimiento exista y pertenezca a la región indicada.
 */
async function establishmentWithin(territory, establishmentId, regionId, reject) {
  const establishment = await territory.findEstablishment(establishmentId);
  if (!establishment || establishment.regionId !== regionId) {
    throw reject();
  }
  return establishment;
}

/**
 * Fija la región y la oficina concedidas.
 * Un establecimiento solo se acepta si pertenece a esa oficina.
 * Pedir otra región u otra oficina se rechaza como fuera de ámbito.
 */
async function resolveLocalOfficeLevel(access, filters, territory) {
  if (!Number.isInteger(access.regionId) || !Number.isInteger(access.localOfficeId)) {
    throw new ForbiddenError(MISSING_SCOPE);
  }
  if (filters.regionId !== null && filters.regionId !== access.regionId) {
    throw outsideScope();
  }
  if (filters.localOfficeId !== null && filters.localOfficeId !== access.localOfficeId) {
    throw outsideScope();
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await establishmentWithin(
      territory,
      filters.establishmentId,
      access.regionId,
      outsideScope
    );
    if (establishment.localOfficeId !== access.localOfficeId) {
      throw outsideScope();
    }
    establishmentIds = [establishment.establishmentId];
  }
  return baseScope(access, {
    regionId: access.regionId,
    localOfficeId: access.localOfficeId,
    establishmentIds
  });
}

/**
 * Fija la región concedida y permite estrechar por oficina o establecimiento de esa región.
 * Si la oficina y el establecimiento no coinciden, la combinación se rechaza.
 */
async function resolveRegionLevel(access, filters, territory) {
  if (!Number.isInteger(access.regionId)) {
    throw new ForbiddenError(MISSING_SCOPE);
  }
  if (filters.regionId !== null && filters.regionId !== access.regionId) {
    throw outsideScope();
  }
  let localOfficeId = null;
  if (filters.localOfficeId !== null) {
    const office = await officeWithin(
      territory,
      filters.localOfficeId,
      access.regionId,
      outsideScope
    );
    localOfficeId = office.localOfficeId;
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await establishmentWithin(
      territory,
      filters.establishmentId,
      access.regionId,
      outsideScope
    );
    if (localOfficeId !== null && establishment.localOfficeId !== localOfficeId) {
      throw new ValidationError(INCOMPATIBLE);
    }
    localOfficeId = localOfficeId === null ? establishment.localOfficeId : localOfficeId;
    establishmentIds = [establishment.establishmentId];
  }
  return baseScope(access, {
    regionId: access.regionId,
    localOfficeId,
    establishmentIds
  });
}

/**
 * Parte sin ancla territorial fija y acepta filtros de región, oficina y establecimiento,
 * siempre que existan y sean compatibles entre sí.
 * Una unidad inactiva o inexistente no se usa como filtro.
 */
async function resolveNationalLevel(access, filters, territory) {
  let regionId = null;
  let localOfficeId = null;
  if (filters.regionId !== null) {
    const region = await territory.findRegion(filters.regionId);
    if (!region) {
      throw new ValidationError(INACTIVE);
    }
    regionId = region.regionId;
  }
  if (filters.localOfficeId !== null) {
    const office = await territory.findLocalOffice(filters.localOfficeId);
    if (!office) {
      throw new ValidationError(INACTIVE);
    }
    if (regionId !== null && office.regionId !== regionId) {
      throw new ValidationError(INCOMPATIBLE);
    }
    regionId = regionId === null ? office.regionId : regionId;
    localOfficeId = office.localOfficeId;
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await territory.findEstablishment(filters.establishmentId);
    if (!establishment) {
      throw new ValidationError(INACTIVE);
    }
    if (localOfficeId !== null && establishment.localOfficeId !== localOfficeId) {
      throw new ValidationError(INCOMPATIBLE);
    }
    if (regionId !== null && establishment.regionId !== regionId) {
      throw new ValidationError(INCOMPATIBLE);
    }
    regionId = regionId === null ? establishment.regionId : regionId;
    localOfficeId = localOfficeId === null ? establishment.localOfficeId : localOfficeId;
    establishmentIds = [establishment.establishmentId];
  }
  return baseScope(access, {
    regionId,
    localOfficeId,
    establishmentIds
  });
}

/*
  Propósito: impedir que roles de distinto nivel se consulten como un solo ámbito
  Entrada: contexto interno
  Salida: el mismo contexto cuando ya tiene un ancla confirmada
  Varias concesiones de Establecimiento llegan unidas y no entran en este rechazo
  La unión entre niveles distintos sigue NEEDS_VALIDATION y no amplía la consulta
*/
function assertConfirmedTerritorialAnchor(access) {
  if (access && access.accessLevel) {
    return access;
  }
  const grantCount = access && Array.isArray(access.grants) ? access.grants.length : 0;
  if (grantCount > 1) {
    throw new ForbiddenError(
      'La combinación de concesiones no tiene una regla de consulta confirmada.'
    );
  }
  throw new ForbiddenError(MISSING_SCOPE);
}

/**
 * Elige la regla de ámbito según el nivel ya concedido.
 *
 * Recibe el contexto interno, los filtros pedidos y las búsquedas de territorio.
 * Devuelve el ámbito efectivo de la consulta. No lee el rol desde la solicitud
 * ni amplía el acceso: un filtro solo puede estrecharlo.
 */
async function resolveTerritorialScope(access, filters, territory) {
  requireAccess(access);
  const requested = {
    regionId: filters.regionId ?? null,
    localOfficeId: filters.localOfficeId ?? null,
    establishmentId: filters.establishmentId ?? null
  };
  filters = requested;
  if (access.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    return resolveEstablishmentLevel(access, filters);
  }
  if (access.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
    return resolveLocalOfficeLevel(access, filters, territory);
  }
  if (access.accessLevel === ACCESS_LEVEL.REGION) {
    return resolveRegionLevel(access, filters, territory);
  }
  if (access.accessLevel === ACCESS_LEVEL.NATIONAL) {
    return resolveNationalLevel(access, filters, territory);
  }
  throw new ForbiddenError(MISSING_SCOPE);
}

module.exports = {
  resolveTerritorialScope,
  assertConfirmedTerritorialAnchor
};
