'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/load-config');
const { ForbiddenError } = require('../src/common/errors');
const { validEnv } = require('./env-fixture');
const { CAPABILITY, capabilitiesForRoles } = require('../src/infrastructure/auth/capabilities');
const { findDevelopmentPrincipal } = require('../src/infrastructure/auth/development-access');
const { resolvePresentedIdentity } = require('../src/infrastructure/auth/identity-provider');
const { adaptInstitutionalIdentity } = require('../src/infrastructure/auth/institutional-identity-adapter');
const { createUserContext } = require('../src/infrastructure/auth/user-context');
const { hasCapability, requireCapability } = require('../src/infrastructure/auth/authorization-policy');
const { applyFieldPolicy } = require('../src/infrastructure/auth/field-policy');
const { resolveSidinaccSession } = require('../src/infrastructure/auth/sidinacc-session-contract');
const { createPersonQueryService } = require('../src/modules/institutional/person-query-service');

function createTestApp(service, configOverrides = {}) {
  const config = {
    ...loadConfig(validEnv()),
    ...configOverrides
  };
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = createApp({
    config,
    databases: { sia: { probe: jest.fn() } },
    adapter: { checkAvailability: jest.fn(async () => ({ available: true, readOnly: true })) },
    institutional: service,
    logger
  });
  return { app, logger };
}

function bearer(principalId) {
  return { Authorization: `Bearer ${principalId}` };
}

function contextOf(principalId) {
  return createUserContext(findDevelopmentPrincipal(principalId));
}

function territory() {
  const establishments = {
    1100102: { establishmentId: 1100102, localOfficeId: 101, regionId: 1 },
    1010320: { establishmentId: 1010320, localOfficeId: 101, regionId: 1 },
    1190108: { establishmentId: 1190108, localOfficeId: 501, regionId: 5 }
  };
  const offices = {
    101: { localOfficeId: 101, regionId: 1, name: 'Hatillo' },
    501: { localOfficeId: 501, regionId: 5, name: 'Perez Zeledon' }
  };
  const regions = {
    1: { regionId: 1, name: 'Central Sur' },
    5: { regionId: 5, name: 'Brunca' }
  };
  return {
    findEstablishment: async (id) => establishments[id] || null,
    findLocalOffice: async (id) => offices[id] || null,
    findRegion: async (id) => regions[id] || null
  };
}

function queryService() {
  const catalog = territory();
  const adapter = {
    searchPersons: jest.fn(async () => ({ total: 0, items: [] })),
    findPersonInScope: jest.fn(async () => []),
    listServices: jest.fn(async () => []),
    listGuardianRows: jest.fn(async () => []),
    findEstablishment: catalog.findEstablishment,
    findLocalOffice: catalog.findLocalOffice,
    findRegion: catalog.findRegion,
    listRegions: jest.fn(async () => []),
    listLocalOffices: jest.fn(async () => []),
    listEstablishments: jest.fn(async () => [])
  };
  const cases = {
    listAuthorizedSummaries: jest.fn(async () => ({ availability: 'AVAILABLE', items: [] }))
  };
  return {
    adapter,
    cases,
    service: createPersonQueryService({
      periodId: 2026,
      adapter,
      cases,
      clock: () => new Date(2026, 10, 6)
    })
  };
}

describe('catálogo de capacidades', () => {
  test('los roles internos no heredan la gestión de catálogos ni el detalle reservado a Oficina Local', () => {
    const establishment = contextOf('dev-establecimiento-unico');
    const region = contextOf('dev-region-central-sur');
    const national = contextOf('dev-nacional');
    const office = contextOf('dev-oficina-hatillo');

    expect(hasCapability(establishment, CAPABILITY.PERSON_SEARCH)).toBe(true);
    expect(hasCapability(establishment, CAPABILITY.REFERRAL_CREATE)).toBe(true);
    expect(hasCapability(establishment, CAPABILITY.REPORTING_READ)).toBe(false);
    expect(hasCapability(establishment, CAPABILITY.CASE_READ)).toBe(false);
    expect(hasCapability(establishment, CAPABILITY.ASSESSMENT_READ)).toBe(false);
    expect(hasCapability(establishment, CAPABILITY.SESSION_MANAGE)).toBe(false);

    expect(hasCapability(region, CAPABILITY.REPORTING_READ)).toBe(true);
    expect(hasCapability(region, CAPABILITY.CASE_READ)).toBe(true);
    expect(hasCapability(region, CAPABILITY.ASSESSMENT_READ)).toBe(false);
    expect(hasCapability(region, CAPABILITY.CASE_CLOSE)).toBe(false);
    expect(hasCapability(national, CAPABILITY.SCHEDULING_MANAGE)).toBe(false);
    expect(hasCapability(office, CAPABILITY.CASE_CLOSE)).toBe(true);
    expect(hasCapability(office, CAPABILITY.ASSESSMENT_WRITE)).toBe(true);

    expect(capabilitiesForRoles(['ESTABLECIMIENTO', 'NACIONAL'])).not.toContain(CAPABILITY.CATALOG_MANAGE);
    expect(() => requireCapability(national, CAPABILITY.CATALOG_MANAGE)).toThrow(ForbiddenError);
    expect(() => requireCapability(national, 'person.search.extra')).toThrow(ForbiddenError);
  });

  test('una identidad sin concesiones autentica y no recibe capacidades', () => {
    const access = contextOf('dev-sin-capacidades');
    expect(access.principalId).toBe('dev-sin-capacidades');
    expect(access.capabilities).toEqual([]);
    expect(access.accessLevel).toBeNull();
    expect(() => requireCapability(access, CAPABILITY.PERSON_SEARCH)).toThrow(ForbiddenError);
  });
});

describe('adaptador y contrato SIDINACC', () => {
  test('el adaptador ignora capacidades, roles y establecimientos inyectados en la identidad', () => {
    const registered = findDevelopmentPrincipal('dev-establecimiento-unico');
    const access = adaptInstitutionalIdentity({
      ...registered,
      capabilities: [CAPABILITY.REPORTING_READ, CAPABILITY.PERSON_SEARCH],
      roles: ['NACIONAL'],
      accessLevel: 'NACIONAL',
      establishmentIds: [1190108]
    });
    expect(access.accessLevel).toBe('ESTABLECIMIENTO');
    expect(access.roles).toEqual(['ESTABLECIMIENTO']);
    expect(access.establishmentIds).toEqual([1100102]);
    expect(access.capabilities).not.toContain(CAPABILITY.REPORTING_READ);
  });

  test('un payload con fuente SIDINACC no concede rol ni ámbito', () => {
    const access = adaptInstitutionalIdentity({
      source: 'SIDINACC',
      principalId: 'usuario-institucional',
      grants: [{ role: 'NACIONAL' }],
      capabilities: [CAPABILITY.PERSON_SEARCH]
    });
    expect(access.principalId).toBeNull();
    expect(access.capabilities).toEqual([]);
    expect(access.identitySource).toBe('UNCONFIRMED');
  });

  test('una concesión nacional con establecimientos pegados se descarta', () => {
    const access = createUserContext({
      principalId: 'ancla-no-valida',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: [{ role: 'NACIONAL', establishmentIds: [1100102] }]
    });
    expect(access.grants).toEqual([]);
    expect(access.capabilities).toEqual([]);
  });

  test('fuera de development y test la credencial conocida no se resuelve', () => {
    const resolution = resolvePresentedIdentity({
      nodeEnv: 'production',
      authorizationHeader: 'Bearer dev-nacional'
    });
    expect(resolution.status).toBe('unconfigured');
    expect(resolution.contract.acceptsCredentials).toBe(false);
    expect(resolution.contract.assignsRoles).toBe(false);
    expect(resolveSidinaccSession().status).toBe('unconfigured');
  });
});

describe('ámbito de varios roles', () => {
  test('dos concesiones de Establecimiento se unen y un tercero se rechaza', async () => {
    const { adapter, service } = queryService();
    const { app } = createTestApp(service);
    const selected = await request(app)
      .get('/api/institutional/persons/search?q=Ana&establishmentId=1010320')
      .set(bearer('dev-establecimientos-por-rol'));
    expect(selected.status).toBe(200);
    expect(adapter.searchPersons).toHaveBeenCalledWith(expect.objectContaining({
      scope: expect.objectContaining({ establishmentIds: [1010320] })
    }));

    const callsBefore = adapter.searchPersons.mock.calls.length;
    const foreign = await request(app)
      .get('/api/institutional/persons/search?q=Ana&establishmentId=1190108')
      .set(bearer('dev-establecimientos-por-rol'))
      .set('X-Establishment-Id', '1100102');
    expect(foreign.status).toBe(403);
    expect(foreign.body.error.code).toBe('FORBIDDEN');
    expect(adapter.searchPersons.mock.calls.length).toBe(callsBefore);
  });

  test('roles de distinto nivel no amplían la consulta al ámbito superior', async () => {
    const { adapter, service } = queryService();
    const { app } = createTestApp(service);
    const access = contextOf('dev-roles-heterogeneos');
    expect(access.capabilities).toEqual(expect.arrayContaining([
      CAPABILITY.REPORTING_READ,
      CAPABILITY.REFERRAL_CREATE
    ]));
    expect(access.scopeConfirmed).toBe(false);
    expect(hasCapability(access, CAPABILITY.REPORTING_READ)).toBe(false);
    expect(hasCapability(access, CAPABILITY.REFERRAL_CREATE)).toBe(false);
    expect(access.accessLevel).toBeNull();

    const search = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-roles-heterogeneos'));
    const profile = await request(app)
      .get('/api/institutional/persons/SYN-1100102-01')
      .set(bearer('dev-roles-heterogeneos'));
    expect(search.status).toBe(403);
    expect(profile.status).toBe(403);
    expect(search.body.error.message).toMatch(/combinación de concesiones/);
    expect(adapter.searchPersons).not.toHaveBeenCalled();
    expect(adapter.findPersonInScope).not.toHaveBeenCalled();
  });

  test('dos oficinas locales distintas tampoco se consultan como un solo ámbito', () => {
    const access = createUserContext({
      principalId: 'dos-oficinas',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: [
        { role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 },
        { role: 'OFICINA_LOCAL', regionId: 5, localOfficeId: 501 }
      ]
    });
    expect(access.roles).toEqual(['OFICINA_LOCAL']);
    expect(access.accessLevel).toBeNull();
    expect(access.scopeConfirmed).toBe(false);
    expect(() => requireCapability(access, CAPABILITY.PERSON_SEARCH)).toThrow(ForbiddenError);
    return expect(queryService().service.searchPersons(access, {
      text: 'Ana',
      page: 1,
      pageSize: 20,
      offset: 0,
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    })).rejects.toMatchObject({
      status: 403,
      message: expect.stringMatching(/combinación de concesiones/)
    });
  });
});

describe('aplicación HTTP de permisos', () => {
  test('sin capacidades las tres operaciones responden 403 y no entran al servicio', async () => {
    const service = {
      searchPersons: jest.fn(),
      getPerson: jest.fn(),
      listTerritoryOptions: jest.fn()
    };
    const { app } = createTestApp(service);
    const paths = [
      '/api/institutional/persons/search?q=Ana',
      '/api/institutional/persons/SYN-1100102-01',
      '/api/institutional/territory/options'
    ];
    for (const path of paths) {
      const response = await request(app).get(path).set(bearer('dev-sin-capacidades'));
      expect(response.status).toBe(403);
      expect(response.body.error.code).toBe('FORBIDDEN');
    }
    expect(service.searchPersons).not.toHaveBeenCalled();
    expect(service.getPerson).not.toHaveBeenCalled();
    expect(service.listTerritoryOptions).not.toHaveBeenCalled();
  });

  test('el servicio niega la ausencia de capacidades antes de consultar', async () => {
    const { adapter, service } = queryService();
    const criteria = {
      text: 'Ana',
      page: 1,
      pageSize: 20,
      offset: 0,
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    };
    await expect(service.searchPersons(contextOf('dev-sin-capacidades'), criteria))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.getPerson(contextOf('dev-sin-capacidades'), 'SYN-1100102-01'))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.listTerritoryOptions(contextOf('dev-sin-capacidades'), {
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    })).rejects.toMatchObject({ status: 403 });
    expect(adapter.searchPersons).not.toHaveBeenCalled();
    expect(adapter.findPersonInScope).not.toHaveBeenCalled();
    expect(adapter.listRegions).not.toHaveBeenCalled();
  });

  test('un identificador revocado o desconocido no recupera el ámbito anterior', async () => {
    const service = { searchPersons: jest.fn(), getPerson: jest.fn(), listTerritoryOptions: jest.fn() };
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-establecimiento-unico-revocado'));
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(service.searchPersons).not.toHaveBeenCalled();
  });

  test('encabezados y parámetros no agregan capacidades ni cambian el rol', async () => {
    const service = {
      searchPersons: jest.fn(async () => ({ result: { total: 0, returned: 0, items: [] } })),
      getPerson: jest.fn(),
      listTerritoryOptions: jest.fn()
    };
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana&accessLevel=NACIONAL&capability=reporting.read')
      .set(bearer('dev-establecimiento-unico'))
      .set('X-Access-Level', 'NACIONAL')
      .set('X-Capability', 'reporting.read')
      .set('X-Role', 'NACIONAL')
      .set('X-Establishment-Id', '1190108');
    expect(response.status).toBe(200);
    expect(service.searchPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        principalId: 'dev-establecimiento-unico',
        accessLevel: 'ESTABLECIMIENTO',
        roles: ['ESTABLECIMIENTO'],
        establishmentIds: [1100102]
      }),
      expect.any(Object)
    );
    const access = service.searchPersons.mock.calls[0][0];
    expect(access.capabilities).not.toContain(CAPABILITY.REPORTING_READ);
    expect(access.capabilities).toContain(CAPABILITY.PERSON_SEARCH);
  });

  test('en un entorno distinto de development o test no se acepta la identidad sintética', async () => {
    const service = { searchPersons: jest.fn(), getPerson: jest.fn(), listTerritoryOptions: jest.fn() };
    const { app } = createTestApp(service, { nodeEnv: 'production' });
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-nacional'))
      .set('X-Access-Level', 'NACIONAL');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');
    expect(service.searchPersons).not.toHaveBeenCalled();
  });

  test('el acceso directo a una persona ajena no confirma el registro y conserva el ámbito del servidor', async () => {
    const { adapter, service } = queryService();
    const seen = [];
    adapter.findPersonInScope.mockImplementation(async (criteria) => {
      seen.push(criteria.scope.establishmentIds);
      return [];
    });
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/institutional/persons/SYN-1190108-01?establishmentId=1190108')
      .set(bearer('dev-establecimiento-unico'));
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(seen).toEqual([[1100102]]);
    expect(adapter.listServices).not.toHaveBeenCalled();
  });
});

describe('campos restringidos', () => {
  function sensitiveRecord() {
    return {
      personId: 'SYN-1100102-01',
      fullName: 'Ana Campos Jimenez',
      riskLevel: 'ALTO',
      protectionLevel: 'BAJO',
      assessment: { note: 'detalle interno' },
      factors: ['factor interno'],
      plan: { strategy: 'plan interno' },
      attentions: [{ kind: 'individual' }],
      documents: [{ name: 'documento interno' }],
      coordinations: [{ counterpart: 'institucion' }],
      transfers: [{ destination: 'otro' }],
      closureDetail: { reason: 'cierre' },
      frequency: 'semanal',
      timeline: [{ event: 'seguimiento' }],
      internalDisciplines: ['disciplina interna'],
      internalReports: ['reporte interno'],
      interdisciplinaryAttention: {
        availability: 'AVAILABLE',
        items: [{
          caseId: '15',
          status: 'ACTIVO',
          priority: 'MODERADO',
          openedOn: '2026-02-01',
          closedOn: null,
          riskLevel: 'ALTO',
          assessment: { note: 'detalle interno' }
        }]
      }
    };
  }

  test('Establecimiento y Región pierden el detalle interno y Oficina Local lo conserva', () => {
    const establishment = applyFieldPolicy(sensitiveRecord(), contextOf('dev-establecimiento-unico'));
    const region = applyFieldPolicy(sensitiveRecord(), contextOf('dev-region-brunca'));
    const office = applyFieldPolicy(sensitiveRecord(), contextOf('dev-oficina-hatillo'));

    expect(establishment.personId).toBe('SYN-1100102-01');
    expect(establishment.riskLevel).toBeUndefined();
    expect(establishment.assessment).toBeUndefined();
    expect(establishment.plan).toBeUndefined();
    expect(establishment.attentions).toBeUndefined();
    expect(establishment.documents).toBeUndefined();
    expect(establishment.internalDisciplines).toBeUndefined();
    expect(establishment.internalReports).toBeUndefined();
    expect(region.internalDisciplines).toBeUndefined();
    expect(region.internalReports).toBeUndefined();
    expect(establishment.interdisciplinaryAttention.items[0].riskLevel).toBeUndefined();
    expect(establishment.interdisciplinaryAttention.items[0].status).toBe('ACTIVO');
    expect(JSON.stringify(establishment)).not.toMatch(/detalle interno|ALTO/);
    expect(JSON.stringify(region)).not.toMatch(/detalle interno|plan interno/);
    expect(region.interdisciplinaryAttention.items[0].priority).toBe('MODERADO');

    expect(office.assessment).toEqual({ note: 'detalle interno' });
    expect(office.internalDisciplines).toEqual(['disciplina interna']);
    expect(office.internalReports).toEqual(['reporte interno']);
    expect(office.riskLevel).toBe('ALTO');
    expect(office.interdisciplinaryAttention.items[0].assessment).toEqual({ note: 'detalle interno' });
  });

  test('sin capacidad de resumen no se conservan filas de casos', () => {
    const access = createUserContext({
      principalId: 'solo-busqueda',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: []
    });
    const projected = applyFieldPolicy(sensitiveRecord(), access);
    expect(projected.interdisciplinaryAttention.items).toBeNull();
    expect(projected.interdisciplinaryAttention.availability).toBe('BLOCKED');
    expect(JSON.stringify(projected)).not.toMatch(/ACTIVO|detalle interno/);
  });
});
