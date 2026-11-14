'use strict';

/*
  Resolución del ámbito territorial sobre la jerarquía
  Establecimiento, Oficina Local, Región y Nacional.
  Aplica el ancla ya concedida. No elige el rol ni lee la solicitud cruda.
  RF-012, RF-104 y RNF-001.
*/

const { ErrorProhibido, ErrorValidacion } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');

const OUTSIDE_SCOPE = 'El filtro territorial está fuera del ámbito autorizado.';
const INCOMPATIBLE = 'La combinación territorial no es compatible.';
const INACTIVE = 'El filtro territorial no corresponde a una unidad activa.';
const ESTABLISHMENT_FILTER_ONLY = 'El nivel Establecimiento solo admite filtro por establecimiento autorizado.';
const MISSING_SCOPE = 'El ámbito autorizado no está disponible.';

/**
 * Rechaza un filtro que cae fuera del ámbito ya concedido.
 */
function FueraDeAmbito() {
  return new ErrorProhibido(OUTSIDE_SCOPE);
}

/**
 * Exige un contexto con nivel de acceso. Sin ese nivel no hay consulta territorial.
 */
function ExigirAcceso(acceso) {
  if (!acceso || !acceso.accessLevel) {
    throw new ErrorProhibido('No hay un contexto de acceso institucional.');
  }
}

/**
 * Arma el ámbito efectivo que usarán las consultas.
 * establishmentAppliedAutomatically indica que había un solo establecimiento
 * y no hizo falta elegirlo.
 */
function AmbitoBase(acceso, extra) {
  return {
    accessLevel: acceso.accessLevel,
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
function ResolverNivelEstablecimiento(acceso, filters) {
  if (filters.regionId !== null || filters.localOfficeId !== null) {
    throw new ErrorValidacion(ESTABLISHMENT_FILTER_ONLY);
  }
  const authorized = acceso.establishmentIds;
  if (!Array.isArray(authorized) || authorized.length === 0) {
    throw new ErrorProhibido(MISSING_SCOPE);
  }
  if (filters.establishmentId !== null && !authorized.includes(filters.establishmentId)) {
    throw FueraDeAmbito();
  }
  const establishmentIds = filters.establishmentId === null
    ? authorized.slice()
    : [filters.establishmentId];
  return AmbitoBase(acceso, {
    establishmentIds,
    establishmentAppliedAutomatically: authorized.length === 1
  });
}

/**
 * Comprueba que la oficina exista y pertenezca a la región indicada.
 * Quien llama decide si el fallo es un ámbito ajeno o una combinación incompatible.
 */
async function OficinaDentroDeAmbito(territory, localOfficeId, regionId, reject) {
  const office = await territory.BuscarOficinaLocal(localOfficeId);
  if (!office || office.regionId !== regionId) {
    throw reject();
  }
  return office;
}

/**
 * Comprueba que el establecimiento exista y pertenezca a la región indicada.
 */
async function EstablecimientoDentroDeAmbito(territory, establishmentId, regionId, reject) {
  const establishment = await territory.BuscarEstablecimiento(establishmentId);
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
async function ResolverNivelOficinaLocal(acceso, filters, territory) {
  if (!Number.isInteger(acceso.regionId) || !Number.isInteger(acceso.localOfficeId)) {
    throw new ErrorProhibido(MISSING_SCOPE);
  }
  if (filters.regionId !== null && filters.regionId !== acceso.regionId) {
    throw FueraDeAmbito();
  }
  if (filters.localOfficeId !== null && filters.localOfficeId !== acceso.localOfficeId) {
    throw FueraDeAmbito();
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await EstablecimientoDentroDeAmbito(
      territory,
      filters.establishmentId,
      acceso.regionId,
      FueraDeAmbito
    );
    if (establishment.localOfficeId !== acceso.localOfficeId) {
      throw FueraDeAmbito();
    }
    establishmentIds = [establishment.establishmentId];
  }
  return AmbitoBase(acceso, {
    regionId: acceso.regionId,
    localOfficeId: acceso.localOfficeId,
    establishmentIds
  });
}

/**
 * Fija la región concedida y permite estrechar por oficina o establecimiento de esa región.
 * Si la oficina y el establecimiento no coinciden, la combinación se rechaza.
 */
async function ResolverNivelRegion(acceso, filters, territory) {
  if (!Number.isInteger(acceso.regionId)) {
    throw new ErrorProhibido(MISSING_SCOPE);
  }
  if (filters.regionId !== null && filters.regionId !== acceso.regionId) {
    throw FueraDeAmbito();
  }
  let localOfficeId = null;
  if (filters.localOfficeId !== null) {
    const office = await OficinaDentroDeAmbito(
      territory,
      filters.localOfficeId,
      acceso.regionId,
      FueraDeAmbito
    );
    localOfficeId = office.localOfficeId;
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await EstablecimientoDentroDeAmbito(
      territory,
      filters.establishmentId,
      acceso.regionId,
      FueraDeAmbito
    );
    if (localOfficeId !== null && establishment.localOfficeId !== localOfficeId) {
      throw new ErrorValidacion(INCOMPATIBLE);
    }
    localOfficeId = localOfficeId === null ? establishment.localOfficeId : localOfficeId;
    establishmentIds = [establishment.establishmentId];
  }
  return AmbitoBase(acceso, {
    regionId: acceso.regionId,
    localOfficeId,
    establishmentIds
  });
}

/**
 * Parte sin ancla territorial fija y acepta filtros de región, oficina y establecimiento,
 * siempre que existan y sean compatibles entre sí.
 * Una unidad inactiva o inexistente no se usa como filtro.
 */
async function ResolverNivelNacional(acceso, filters, territory) {
  let regionId = null;
  let localOfficeId = null;
  if (filters.regionId !== null) {
    const region = await territory.BuscarRegion(filters.regionId);
    if (!region) {
      throw new ErrorValidacion(INACTIVE);
    }
    regionId = region.regionId;
  }
  if (filters.localOfficeId !== null) {
    const office = await territory.BuscarOficinaLocal(filters.localOfficeId);
    if (!office) {
      throw new ErrorValidacion(INACTIVE);
    }
    if (regionId !== null && office.regionId !== regionId) {
      throw new ErrorValidacion(INCOMPATIBLE);
    }
    regionId = regionId === null ? office.regionId : regionId;
    localOfficeId = office.localOfficeId;
  }
  let establishmentIds = null;
  if (filters.establishmentId !== null) {
    const establishment = await territory.BuscarEstablecimiento(filters.establishmentId);
    if (!establishment) {
      throw new ErrorValidacion(INACTIVE);
    }
    if (localOfficeId !== null && establishment.localOfficeId !== localOfficeId) {
      throw new ErrorValidacion(INCOMPATIBLE);
    }
    if (regionId !== null && establishment.regionId !== regionId) {
      throw new ErrorValidacion(INCOMPATIBLE);
    }
    regionId = regionId === null ? establishment.regionId : regionId;
    localOfficeId = localOfficeId === null ? establishment.localOfficeId : localOfficeId;
    establishmentIds = [establishment.establishmentId];
  }
  return AmbitoBase(acceso, {
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
function AfirmarAnclaTerritorial(acceso) {
  if (acceso && acceso.accessLevel) {
    return acceso;
  }
  const grantCount = acceso && Array.isArray(acceso.grants) ? acceso.grants.length : 0;
  if (grantCount > 1) {
    throw new ErrorProhibido(
      'La combinación de concesiones no tiene una regla de consulta confirmada.'
    );
  }
  throw new ErrorProhibido(MISSING_SCOPE);
}

/**
 * Elige la regla de ámbito según el nivel ya concedido.
 *
 * Recibe el contexto interno, los filtros pedidos y las búsquedas de territorio.
 * Devuelve el ámbito efectivo de la consulta. No lee el rol desde la solicitud
 * ni amplía el acceso: un filtro solo puede estrecharlo.
 */
async function ResolverAmbitoTerritorial(acceso, filters, territory) {
  ExigirAcceso(acceso);
  const requested = {
    regionId: filters.regionId ?? null,
    localOfficeId: filters.localOfficeId ?? null,
    establishmentId: filters.establishmentId ?? null
  };
  filters = requested;
  if (acceso.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
    return ResolverNivelEstablecimiento(acceso, filters);
  }
  if (acceso.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
    return ResolverNivelOficinaLocal(acceso, filters, territory);
  }
  if (acceso.accessLevel === ACCESS_LEVEL.REGION) {
    return ResolverNivelRegion(acceso, filters, territory);
  }
  if (acceso.accessLevel === ACCESS_LEVEL.NATIONAL) {
    return ResolverNivelNacional(acceso, filters, territory);
  }
  throw new ErrorProhibido(MISSING_SCOPE);
}

module.exports = {
  ResolverAmbitoTerritorial,
  AfirmarAnclaTerritorial
};
