'use strict';

const { NotFoundError, AmbiguousInstitutionalLocationError } = require('../../common/errors');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/development-access');
const { resolveTerritorialScope } = require('./territorial-scope');
const { presentSearch, presentProfile } = require('./person-presenter');

/*
  Busqueda y consulta contextual compartidas por HU-005, HU-006, HU-007, HU-008 y HU-009.
  CU-02 y CU-03. La coincidencia exacta por identificacion tiene precedencia (RF-009).
  Sin criterio no hay listado. El periodo no viaja en la solicitud.
*/

function territoryPort(adapter) {
  return {
    findEstablishment: (establishmentId) => adapter.findEstablishment(establishmentId),
    findLocalOffice: (localOfficeId) => adapter.findLocalOffice(localOfficeId),
    findRegion: (regionId) => adapter.findRegion(regionId)
  };
}

function presentableScope(access, scope) {
  return {
    accessLevel: scope.accessLevel,
    regionId: scope.regionId,
    localOfficeId: scope.localOfficeId,
    establishmentIds: scope.establishmentIds,
    establishmentAppliedAutomatically: scope.establishmentAppliedAutomatically,
    principalId: access.principalId
  };
}

function filterGroup(selectable, appliedAutomatically, requiresParent, options) {
  return {
    selectable,
    appliedAutomatically,
    requiresParent,
    options
  };
}

function createPersonQueryService(dependencies) {
  const periodId = dependencies.periodId;
  const adapter = dependencies.adapter;
  const cases = dependencies.cases;
  const clock = dependencies.clock || (() => new Date());
  const territory = territoryPort(adapter);

  async function resolve(access, filters) {
    return resolveTerritorialScope(access, filters, territory);
  }

  async function searchPersons(access, criteria) {
    const scope = await resolve(access, criteria);
    const exact = await adapter.searchPersons({
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
        result: await adapter.searchPersons({
          mode: 'name',
          periodId,
          text: criteria.text,
          scope,
          offset: criteria.offset,
          pageSize: criteria.pageSize
        })
      };
    return presentSearch({
      matchMode: chosen.matchMode,
      page: criteria.page,
      pageSize: criteria.pageSize,
      total: chosen.result.total,
      rows: chosen.result.items,
      scope: presentableScope(access, scope),
      periodId,
      today: clock()
    });
  }

  async function getPerson(access, personId) {
    const scope = await resolve(access, {
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    });
    const rows = await adapter.findPersonInScope({
      periodId,
      personId,
      scope
    });
    const locationCounts = rows.map((row) => Number(row.location_count));
    if (rows.length > 1 || locationCounts.some((count) => count > 1)) {
      throw new AmbiguousInstitutionalLocationError();
    }
    if (rows.length === 0) {
      throw new NotFoundError('No hay una persona disponible con ese identificador en el ámbito autorizado.');
    }
    const [services, guardianRows, caseSummary] = await Promise.all([
      adapter.listServices({ periodId, personId }),
      adapter.listGuardianRows({ periodId, personId }),
      cases.listAuthorizedSummaries(personId, scope)
    ]);
    return presentProfile({
      person: rows[0],
      services,
      guardianRows,
      cases: caseSummary,
      periodId,
      today: clock()
    });
  }

  async function listTerritoryOptions(access, filters) {
    const scope = await resolve(access, filters);
    const regions = await regionsFor(access, scope);
    const offices = await officesFor(access, scope);
    const establishments = await establishmentsFor(access, scope);
    return {
      accessLevel: access.accessLevel,
      selected: {
        regionId: scope.regionId,
        localOfficeId: scope.localOfficeId,
        establishmentId: Array.isArray(scope.establishmentIds) && scope.establishmentIds.length === 1
          && (scope.establishmentAppliedAutomatically || filters.establishmentId !== null)
          ? scope.establishmentIds[0]
          : null
      },
      filters: {
        region: filterGroup(
          access.accessLevel === ACCESS_LEVEL.NATIONAL,
          access.accessLevel === ACCESS_LEVEL.REGION,
          false,
          regions
        ),
        localOffice: filterGroup(
          access.accessLevel === ACCESS_LEVEL.REGION || access.accessLevel === ACCESS_LEVEL.NATIONAL,
          access.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE,
          access.accessLevel === ACCESS_LEVEL.NATIONAL && scope.regionId === null,
          offices
        ),
        establishment: filterGroup(
          access.accessLevel !== ACCESS_LEVEL.ESTABLISHMENT || !scope.establishmentAppliedAutomatically,
          scope.establishmentAppliedAutomatically,
          access.accessLevel !== ACCESS_LEVEL.ESTABLISHMENT && scope.localOfficeId === null,
          establishments
        )
      }
    };
  }

  async function regionsFor(access, scope) {
    if (access.accessLevel === ACCESS_LEVEL.NATIONAL) {
      const rows = await adapter.listRegions({});
      return rows.map((row) => ({ id: row.regionId, name: row.name }));
    }
    if (access.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.listEstablishments({ establishmentIds: access.establishmentIds });
      return unique(rows, 'regionId', 'regionName');
    }
    if (scope.regionId === null) {
      return [];
    }
    const rows = await adapter.listRegions({ regionId: scope.regionId });
    return rows.map((row) => ({ id: row.regionId, name: row.name }));
  }

  async function officesFor(access, scope) {
    if (access.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.listEstablishments({ establishmentIds: access.establishmentIds });
      return unique(rows, 'localOfficeId', 'localOfficeName');
    }
    if (access.accessLevel === ACCESS_LEVEL.LOCAL_OFFICE) {
      const rows = await adapter.listLocalOffices({ localOfficeId: access.localOfficeId });
      return rows.map((row) => ({ id: row.localOfficeId, name: row.name }));
    }
    if (scope.regionId === null) {
      return [];
    }
    const rows = await adapter.listLocalOffices({ regionId: scope.regionId });
    return rows.map((row) => ({ id: row.localOfficeId, name: row.name }));
  }

  async function establishmentsFor(access, scope) {
    if (access.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      const rows = await adapter.listEstablishments({ establishmentIds: access.establishmentIds });
      return rows.map(establishmentOption);
    }
    if (scope.localOfficeId === null) {
      return [];
    }
    const rows = await adapter.listEstablishments({ localOfficeId: scope.localOfficeId });
    return rows.map(establishmentOption);
  }

  return {
    searchPersons,
    getPerson,
    listTerritoryOptions
  };
}

function establishmentOption(row) {
  return {
    id: row.establishmentId,
    name: row.name,
    localOfficeId: row.localOfficeId,
    regionId: row.regionId
  };
}

function unique(rows, idKey, nameKey) {
  const seen = new Map();
  for (const row of rows) {
    if (!seen.has(row[idKey])) {
      seen.set(row[idKey], { id: row[idKey], name: row[nameKey] });
    }
  }
  return [...seen.values()];
}

module.exports = { createPersonQueryService };
