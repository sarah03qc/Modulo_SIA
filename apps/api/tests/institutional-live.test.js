'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/load-config');
const { createDatabaseGateway } = require('../src/infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('../src/infrastructure/integrations/sidinacc-adapter');

const placeholder = !process.env.SIA_DB_PASSWORD
  || !process.env.SIDINACC_DB_PASSWORD
  || process.env.SIA_DB_PASSWORD === 'CHANGE_ME'
  || process.env.SIDINACC_DB_PASSWORD === 'CHANGE_ME'
  || !process.env.SIDINACC_PERIOD_ID;

const describeLive = placeholder ? describe.skip : describe;

function keysDeep(value, found = []) {
  if (Array.isArray(value)) {
    for (const item of value) {
      keysDeep(item, found);
    }
    return found;
  }
  if (value && typeof value === 'object') {
    for (const [key, item] of Object.entries(value)) {
      found.push(key);
      keysDeep(item, found);
    }
  }
  return found;
}

describeLive('consulta institucional contra SQL Server local', () => {
  jest.setTimeout(60000);

  let app;
  let gateway;
  let config;

  beforeAll(() => {
    config = loadConfig(process.env);
    gateway = createDatabaseGateway(config);
    app = createApp({
      config,
      databases: gateway,
      adapter: createSidinaccAdapter(gateway.sidinacc),
      logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
    });
  });

  afterAll(async () => {
    if (gateway) {
      await gateway.close();
    }
  });

  function authed(principalId) {
    return {
      get(path) {
        return request(app).get(path).set('Authorization', `Bearer ${principalId}`);
      }
    };
  }

  test('identificación exacta, ámbito automático y exclusión de otra persona de la oficina', async () => {
    const response = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-01', periodId: '2025', accessLevel: 'NACIONAL' });

    expect(response.status).toBe(200);
    expect(response.body.query.matchMode).toBe('identification');
    expect(response.body.provenance.periodId).toBe(String(config.sidinaccPeriodId));
    expect(response.body.scope.establishmentAppliedAutomatically).toBe(true);
    expect(response.body.scope.establishmentIds).toEqual([1100102]);
    expect(response.body.scope.accessLevel).toBe('ESTABLECIMIENTO');
    expect(response.body.result.total).toBe(1);
    expect(response.body.result.returned).toBe(1);
    expect(response.body.result.items[0].personId).toBe('SYN-1100102-01');
    expect(response.body.result.items[0].fullName).toBe('Ana Campos Jimenez');
    expect(response.body.result.items[0].establishment.id).toBe(1100102);
  });

  test('nombre con varias coincidencias, conteo y página dentro de la Oficina Local', async () => {
    const first = await authed('dev-oficina-hatillo')
      .get('/api/institutional/persons/search')
      .query({ q: 'Campos', page: 1, pageSize: 1 });
    const second = await authed('dev-oficina-hatillo')
      .get('/api/institutional/persons/search')
      .query({ q: 'Campos', page: 2, pageSize: 1 });

    expect(first.status).toBe(200);
    expect(first.body.query.matchMode).toBe('name');
    expect(first.body.result.total).toBeGreaterThanOrEqual(2);
    expect(first.body.result.returned).toBe(1);
    expect(second.body.result.total).toBe(first.body.result.total);
    expect(second.body.result.items[0].personId).not.toBe(first.body.result.items[0].personId);
    expect(first.body.result.items[0].establishment.id).toEqual(expect.any(Number));
    expect(first.body.result.items[0].fullName.length).toBeGreaterThan(0);
    expect(first.body.scope.localOfficeId).toBe(101);
  });

  test('sin coincidencias, encargada y persona eliminada no amplían el ámbito', async () => {
    const missing = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/search')
      .query({ q: 'ZZZNOEXISTE' });
    const guardian = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-81' });
    const deleted = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-99' });

    expect(missing.body.result.total).toBe(0);
    expect(missing.body.result.message).toMatch(/ámbito autorizado/);
    expect(guardian.body.result.total).toBe(0);
    expect(guardian.body.result.items).toEqual([]);
    expect(deleted.body.result.total).toBe(0);
  });

  test('Regional y Nacional respetan la jerarquía y rechazan combinaciones incompatibles', async () => {
    const inside = await authed('dev-region-central-sur')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-01' });
    const outside = await authed('dev-region-brunca')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-01' });
    const centralMateo = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1010202-01' });
    const bruncaMateo = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1190108-01' });
    const byName = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'Mateo Vargas', pageSize: 25 });
    const brunca = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1190108-01', regionId: 5 });
    const incompatible = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: 'Ana', regionId: 1, localOfficeId: 501 });
    const otherOffice = await authed('dev-oficina-perez-zeledon')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-01' });

    expect(inside.body.result.total).toBe(1);
    expect(outside.body.result.total).toBe(0);
    expect(centralMateo.body.result.items[0].region.id).toBe(1);
    expect(bruncaMateo.body.result.items[0].region.id).toBe(5);
    expect(byName.body.query.matchMode).toBe('name');
    expect(byName.body.result.total).toBeGreaterThanOrEqual(2);
    expect(brunca.body.result.items.map((item) => item.personId)).toEqual(['SYN-1190108-01']);
    expect(incompatible.status).toBe(400);
    expect(incompatible.body.error.code).toBe('VALIDATION_ERROR');
    expect(otherOffice.body.result.total).toBe(0);
  });

  test('varios establecimientos autorizados filtran y un filtro ajeno se rechaza', async () => {
    const selected = await authed('dev-establecimiento-multiple')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1010320-01', establishmentId: 1010320 });
    const rejected = await authed('dev-establecimiento-multiple')
      .get('/api/institutional/persons/search')
      .query({ q: 'Ana', establishmentId: 1190108 });
    const singleRejected = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/search')
      .query({ q: 'Lucia', establishmentId: 1010320 });

    expect(selected.status).toBe(200);
    expect(selected.body.result.items[0].personId).toBe('SYN-1010320-01');
    expect(selected.body.result.items[0].establishment.id).toBe(1010320);
    expect(rejected.status).toBe(403);
    expect(singleRejected.status).toBe(403);
    expect(JSON.stringify(rejected.body)).not.toMatch(/SYN-/);
  });

  test('un criterio hostil no altera la réplica ni rompe la consulta siguiente', async () => {
    const before = await gateway.sidinacc.query(
      'SELECT COUNT(*) AS person_count FROM dbo.CAF_PERSONA'
    );
    const hostile = await authed('dev-nacional')
      .get('/api/institutional/persons/search')
      .query({ q: "SYN-1100102-01' OR '1'='1" });
    const after = await gateway.sidinacc.query(
      'SELECT COUNT(*) AS person_count FROM dbo.CAF_PERSONA'
    );
    const stillThere = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/search')
      .query({ q: 'SYN-1100102-01' });

    expect(hostile.status).toBe(200);
    expect(hostile.body.result.total).toBe(0);
    expect(Number(before[0].person_count)).toBe(Number(after[0].person_count));
    expect(stillThere.body.result.total).toBe(1);
  });

  test('la ficha básica reutiliza la réplica y no expone la gestión interna del caso', async () => {
    const profile = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/SYN-1100102-01');
    const withoutServices = await authed('dev-oficina-hatillo')
      .get('/api/institutional/persons/SYN-1100102-02');
    const otherGuardian = await authed('dev-region-central-sur')
      .get('/api/institutional/persons/SYN-1100102-03');
    const hidden = await authed('dev-region-brunca')
      .get('/api/institutional/persons/SYN-1100102-01');
    const guardianProfile = await authed('dev-nacional')
      .get('/api/institutional/persons/SYN-1100102-81');

    expect(profile.status).toBe(200);
    expect(profile.body.fullName).toBe('Ana Campos Jimenez');
    expect(profile.body.birthDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(profile.body.ageYears).toEqual(expect.any(Number));
    expect(['Hombre', 'Mujer', 'Intersex']).toContain(profile.body.sex);
    expect(profile.body.establishment.id).toBe(1100102);
    expect(profile.body.localOffice.id).toBe(101);
    expect(profile.body.region.id).toBe(1);
    expect(profile.body.services.items).toHaveLength(2);
    expect(profile.body.services.items.map((item) => item.name).join(' ')).toMatch(/SINTETICO/);
    expect(profile.body.guardian.contextOnly).toBe(true);
    expect(profile.body.guardian.person).toEqual(expect.objectContaining({
      personId: 'SYN-1100102-81',
      relationship: 'MADRE'
    }));
    expect(profile.body.guardian.contact.address).toMatch(/Sintetica/);
    expect(profile.body.guardian.contact.phoneOne).toBe('88881101');
    expect(profile.body.familyContext.phoneTwo).toBe('88881102');
    expect(profile.body.provenance.integrationStatus).toBe('NEEDS_VALIDATION');

    const attention = profile.body.interdisciplinaryAttention;
    expect(attention.availability).toBe('AVAILABLE');
    expect(attention.reasonCode).toBeNull();
    expect(attention.source).toBe('SIA_CENCINAI');
    expect(attention.visibleCaseCount).toBe(1);
    expect(attention.items).toEqual([
      {
        caseId: '1',
        status: 'ACTIVO',
        priority: 'BAJO',
        openedOn: '2026-02-01',
        closedOn: null
      }
    ]);
    expect(keysDeep(profile.body)).not.toEqual(expect.arrayContaining([
      'riesgo',
      'proteccion',
      'factores',
      'plan',
      'valoracion',
      'atenciones'
    ]));

    expect(withoutServices.body.services.items).toEqual([]);
    expect(withoutServices.body.guardian.person.relationship).toBe('PADRE');
    expect(otherGuardian.body.guardian.person.relationship).toBeNull();
    expect(otherGuardian.body.guardian.person.personId).toBe('SYN-1100102-87');
    expect(hidden.status).toBe(404);
    expect(hidden.body.error.code).toBe('NOT_FOUND');
    expect(guardianProfile.status).toBe(404);
  });

  test('las opciones territoriales dependen del ámbito y no listan personas', async () => {
    const single = await authed('dev-establecimiento-unico')
      .get('/api/institutional/territory/options');
    const multiple = await authed('dev-establecimiento-multiple')
      .get('/api/institutional/territory/options');
    const region = await authed('dev-region-central-sur')
      .get('/api/institutional/territory/options');
    const children = await authed('dev-region-central-sur')
      .get('/api/institutional/territory/options')
      .query({ localOfficeId: 101 });
    const national = await authed('dev-nacional')
      .get('/api/institutional/territory/options');
    const broken = await authed('dev-region-central-sur')
      .get('/api/institutional/territory/options')
      .query({ localOfficeId: 101, establishmentId: 1010202 });

    expect(single.body.filters.establishment.appliedAutomatically).toBe(true);
    expect(single.body.filters.establishment.selectable).toBe(false);
    expect(single.body.filters.establishment.options.map((item) => item.id)).toEqual([1100102]);
    expect(multiple.body.filters.establishment.selectable).toBe(true);
    expect(multiple.body.filters.establishment.options.map((item) => item.id).sort()).toEqual([1010320, 1100102]);
    expect(region.body.filters.region.appliedAutomatically).toBe(true);
    expect(region.body.filters.localOffice.options.map((item) => item.id)).toContain(101);
    expect(region.body.filters.localOffice.options.map((item) => item.id)).not.toContain(501);
    expect(region.body.filters.establishment.requiresParent).toBe(true);
    expect(region.body.filters.establishment.options).toEqual([]);
    expect(children.body.filters.establishment.options.map((item) => item.id)).toEqual(
      expect.arrayContaining([1100102, 1010320])
    );
    expect(children.body.filters.establishment.options.map((item) => item.id)).not.toContain(1190108);
    expect(national.body.filters.region.options.length).toBeGreaterThanOrEqual(2);
    expect(national.body.filters.establishment.requiresParent).toBe(true);
    expect(JSON.stringify(national.body)).not.toMatch(/SYN-/);
    expect(broken.status).toBe(400);
  });

  test('la ficha distingue un caso autorizado, la ausencia de casos y el ámbito', async () => {
    const establishment = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/SYN-1100102-01');
    const office = await authed('dev-oficina-hatillo')
      .get('/api/institutional/persons/SYN-1100102-01');
    const region = await authed('dev-region-central-sur')
      .get('/api/institutional/persons/SYN-1100102-01');
    const national = await authed('dev-nacional')
      .get('/api/institutional/persons/SYN-1100102-01');
    const empty = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/SYN-1100102-04');
    const outside = await authed('dev-region-brunca')
      .get('/api/institutional/persons/SYN-1100102-01');
    const foreignEstablishment = await authed('dev-establecimiento-unico')
      .get('/api/institutional/persons/SYN-1190108-01');

    for (const response of [establishment, office, region, national]) {
      expect(response.status).toBe(200);
      expect(response.body.interdisciplinaryAttention).toMatchObject({
        availability: 'AVAILABLE',
        reasonCode: null,
        source: 'SIA_CENCINAI',
        visibleCaseCount: 1,
        message: null,
        items: [
          {
            caseId: '1',
            status: 'ACTIVO',
            priority: 'BAJO',
            openedOn: '2026-02-01',
            closedOn: null
          }
        ]
      });
    }

    expect(empty.status).toBe(200);
    expect(empty.body.personId).toBe('SYN-1100102-04');
    expect(empty.body.establishment.id).toBe(1100102);
    expect(empty.body.interdisciplinaryAttention).toEqual({
      availability: 'AVAILABLE',
      reasonCode: null,
      source: 'SIA_CENCINAI',
      visibleCaseCount: 0,
      message: 'No hay casos de Atención Interdisciplinaria visibles en el ámbito autorizado.',
      items: []
    });
    expect(outside.status).toBe(404);
    expect(outside.body.error.code).toBe('NOT_FOUND');
    expect(foreignEstablishment.status).toBe(404);
    expect(foreignEstablishment.body.error.code).toBe('NOT_FOUND');
  });
});
