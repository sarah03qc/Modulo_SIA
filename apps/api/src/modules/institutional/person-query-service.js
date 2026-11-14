'use strict';

const { ErrorNoEncontrado, ErrorUbicacionInstitucionalAmbigua } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ResolverAmbitoTerritorial, AfirmarAnclaTerritorial } = require('./territorial-scope');
const { PresentarBusqueda, PresentarFicha } = require('./person-presenter');

/*
  Busqueda y consulta contextual compartidas por HU-005, HU-006, HU-007, HU-008 y HU-009.
  CU-02 y CU-03. La coincidencia exacta por identificacion tiene precedencia (RF-009).
  Sin criterio no hay listado. El periodo no viaja en la solicitud.
*/

/**
 * Expone solo las búsquedas de territorio que el ámbito necesita.
 * El adaptador sigue siendo de lectura.
 */
function PuertoTerritorial(adapter) {
  return {
    BuscarEstablecimiento: (establishmentId) => adapter.BuscarEstablecimiento(establishmentId),
    BuscarOficinaLocal: (localOfficeId) => adapter.BuscarOficinaLocal(localOfficeId),
    BuscarRegion: (regionId) => adapter.BuscarRegion(regionId)
  };
}

/**
 * Copia el ámbito que se puede devolver al cliente, junto con la identidad de la sesión.
 * No incluye capacidades ni concesiones.
 */
function AmbitoPresentable(acceso, scope) {
  return {
    accessLevel: scope.accessLevel,
    regionId: scope.regionId,
    localOfficeId: scope.localOfficeId,
    establishmentIds: scope.establishmentIds,
    establishmentAppliedAutomatically: scope.establishmentAppliedAutomatically,
    principalId: acceso.principalId
  };
}

/**
 * Describe un filtro territorial: si se puede elegir, si ya quedó aplicado
 * y si falta elegir el nivel anterior antes de ver opciones.
 */
function GrupoFiltro(selectable, appliedAutomatically, requiresParent, options) {
  return {
    selectable,
    appliedAutomatically,
    requiresParent,
    options
  };
}

function CrearServicioConsultaPersona(dependencies) {
  const periodId = dependencies.periodId;
  const adapter = dependencies.adapter;
  const cases = dependencies.cases;
  const clock = dependencies.clock || (() => new Date());
  const territory = PuertoTerritorial(adapter);

  /*
    Propósito: resolver el ámbito después de comprobar que el ancla territorial es consultable
    Entrada: contexto interno y filtros ya validados
    Salida: ámbito efectivo para la lectura institucional
  */
  async function ResolverConsulta(acceso, filters) {
    if (!acceso || !acceso.accessLevel) {
      AfirmarAnclaTerritorial(acceso);
    }
    return ResolverAmbitoTerritorial(acceso, filters, territory);
  }

  /*
    Propósito: buscar personas dentro del ámbito y de la capacidad person.search
    Entrada: contexto interno y criterio de búsqueda
    Salida: página contextual. Sin capacidad responde 403 y no consulta la réplica
    HU-005 a HU-008, CU-02, RF-009 y RF-012
  */
  async function BuscarPersonas(acceso, criteria) {
    ExigirCapacidad(acceso, CAPABILITY.PERSON_SEARCH);
    const scope = await ResolverConsulta(acceso, criteria);
    const exact = await adapter.BuscarPersonas({
      mode: 'identification',
      periodId,
      text: criteria.text,
      scope,
      offset: criteria.offset,
      pageSize: criteria.pageSize
    });
    const chosen = exact.total > 0
      ? { matchMode: 'identification', result: exact }
      : {
        matchMode: 'name',
        result: await adapter.BuscarPersonas({
          mode: 'name',
          periodId,
          text: criteria.text,
          scope,
          offset: criteria.offset,
          pageSize: criteria.pageSize
        })
      };
    return PresentarBusqueda({
      matchMode: chosen.matchMode,
      page: criteria.page,
      pageSize: criteria.pageSize,
      total: chosen.result.total,
      rows: chosen.result.items,
      scope: AmbitoPresentable(acceso, scope),
      periodId,
      today: clock(),
      acceso
    });
  }

  /*
    Propósito: devolver la ficha básica de una persona localizable en el ámbito
    Entrada: contexto interno e identificador institucional de la réplica
    Salida: ficha proyectada con la política de campos
    Sin person.profile.read responde 403. Fuera de ámbito responde 404
    HU-009, CU-03 y RF-012
  */
  async function ObtenerPersona(acceso, personId) {
    ExigirCapacidad(acceso, CAPABILITY.PERSON_PROFILE_READ);
    const scope = await ResolverConsulta(acceso, {
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    });
    const rows = await adapter.BuscarPersonaEnAmbito({
      periodId,
      personId,
      scope
    });
    const locationCounts = rows.map((row) => Number(row.location_count));
    if (rows.length > 1 || locationCounts.some((count) => count > 1)) {
      throw new ErrorUbicacionInstitucionalAmbigua();
    }
    if (rows.length === 0) {
      throw new ErrorNoEncontrado('No hay una persona disponible con ese identificador en el ámbito autorizado.');
    }
    const [services, guardianRows, caseSummary] = await Promise.all([
      adapter.ListarServicios({ periodId, personId }),
      adapter.ListarFilasEncargado({ periodId, personId }),
      cases.ListarResumenesAutorizados(personId, scope)
    ]);
    return PresentarFicha({
      person: rows[0],
      services,
      guardianRows,
      cases: caseSummary,
      periodId,
      today: clock(),
      acceso
    });
  }

  /*
    Propósito: listar solo las opciones territoriales que el ámbito autoriza
    Entrada: contexto interno y filtros solicitados
    Salida: opciones de región, oficina y establecimiento
    Exige territory.options.read. Un filtro ajeno no amplía el catálogo
  */
  async function ListarOpcionesTerritorio(acceso, filters) {
    ExigirCapacidad(acceso, CAPABILITY.TERRITORY_OPTIONS_READ);
    const scope = await ResolverConsulta(acceso, filters);
    const regions = await RegionesPara(acceso, scope);
    const offices = await OficinasPara(acceso, scope);
    const establishments = await EstablecimientosPara(acceso, scope);
    return {
      accessLevel: acceso.accessLevel,
      selected: {
        regionId: scope.regionId,
        localOfficeId: scope.localOfficeId,
        establishmentId: Array.isArray(scope.establishmentIds) && scope.establishmentIds.length === 1
          && (scope.establishmentAppliedAutomatically || filters.establishmentId !== null)
          ? scope.establishmentIds[0]
          : null
      },
      filters: {
        region: GrupoFiltro(
          acceso.accessLevel === ACCESS_LEVEL.NATIONAL,
          acceso.accessLevel === ACCESS_LEVEL.REGION,
          false,
          regions
        ),
        localOffice: GrupoFiltro(
          acceso.accessLevel === ACCESS_LEVEL.REGION || acceso.accessLevel === ACCESS_LEVEL.NATIONAL,
          acceso.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE,
          acceso.accessLevel === ACCESS_LEVEL.NATIONAL && scope.regionId === null,
          offices
        ),
        establishment: GrupoFiltro(
          acceso.accessLevel !== ACCESS_LEVEL.ESTABLISHMENT || !scope.establishmentAppliedAutomatically,
          scope.establishmentAppliedAutomatically,
          acceso.accessLevel !== ACCESS_LEVEL.ESTABLISHMENT && scope.localOfficeId === null,
          establishments
        )
      }
    };
  }

  /**
   * Regiones que el nivel puede ver.
   * Nacional lista todas. Establecimiento las deduce de sus establecimientos.
   * Los demás niveles ven solo la región de su ámbito, o ninguna si todavía no hay región.
   */
  async function RegionesPara(acceso, scope) {
    if (acceso.accessLevel === ACCESS_LEVEL.NATIONAL) {
      const rows = await adapter.ListarRegiones({});
      return rows.map((row) => ({ id: row.regionId, name: row.name }));
    }
    if (acceso.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.ListarEstablecimientos({ establishmentIds: acceso.establishmentIds });
      return UnificarPorIdentificador(rows, 'regionId', 'regionName');
    }
    if (scope.regionId === null) {
      return [];
    }
    const rows = await adapter.ListarRegiones({ regionId: scope.regionId });
    return rows.map((row) => ({ id: row.regionId, name: row.name }));
  }

  /**
   * Oficinas visibles dentro del ámbito.
   * Establecimiento las deduce de sus establecimientos y Oficina Local ve la suya.
   * Región y Nacional no listan oficinas mientras no haya una región resuelta.
   */
  async function OficinasPara(acceso, scope) {
    if (acceso.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.ListarEstablecimientos({ establishmentIds: acceso.establishmentIds });
      return UnificarPorIdentificador(rows, 'localOfficeId', 'localOfficeName');
    }
    if (acceso.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
      const rows = await adapter.ListarOficinasLocales({ localOfficeId: acceso.localOfficeId });
      return rows.map((row) => ({ id: row.localOfficeId, name: row.name }));
    }
    if (scope.regionId === null) {
      return [];
    }
    const rows = await adapter.ListarOficinasLocales({ regionId: scope.regionId });
    return rows.map((row) => ({ id: row.localOfficeId, name: row.name }));
  }

  /**
   * Establecimientos visibles.
   * El nivel Establecimiento usa su lista concedida. Los demás niveles necesitan
   * una oficina ya resuelta; si no la hay, la lista queda vacía.
   */
  async function EstablecimientosPara(acceso, scope) {
    if (acceso.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.ListarEstablecimientos({ establishmentIds: acceso.establishmentIds });
      return rows.map(OpcionEstablecimiento);
    }
    if (scope.localOfficeId === null) {
      return [];
    }
    const rows = await adapter.ListarEstablecimientos({ localOfficeId: scope.localOfficeId });
    return rows.map(OpcionEstablecimiento);
  }

  return {
    BuscarPersonas,
    ObtenerPersona,
    ListarOpcionesTerritorio
  };
}

function OpcionEstablecimiento(row) {
  return {
    id: row.establishmentId,
    name: row.name,
    localOfficeId: row.localOfficeId,
    regionId: row.regionId
  };
}

/**
 * Deja una opción por identificador cuando varias filas repiten la misma región u oficina.
 */
function UnificarPorIdentificador(rows, idKey, nameKey) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row[idKey])) {
      seen.set(row[idKey], { id: row[idKey], name: row[nameKey] });
    }
  }
  return [...seen.values()];
}

module.exports = { CrearServicioConsultaPersona };
