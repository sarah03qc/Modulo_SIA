'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { ErrorProhibido } = require('../src/common/errors');
const { EntornoValido } = require('./env-fixture');
const { CAPABILITY, CapacidadesDeRoles } = require('../src/infrastructure/auth/capabilities');
const { BuscarPrincipalDesarrollo } = require('../src/infrastructure/auth/development-access');
const { ResolverIdentidadPresentada } = require('../src/infrastructure/auth/identity-provider');
const { AdaptarIdentidadInstitucional } = require('../src/infrastructure/auth/institutional-identity-adapter');
const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { TieneCapacidad, ExigirCapacidad } = require('../src/infrastructure/auth/authorization-policy');
const { AplicarPoliticaCampos } = require('../src/infrastructure/auth/field-policy');
const { ResolverSesionSidinacc } = require('../src/infrastructure/auth/sidinacc-session-contract');
const { CrearServicioConsultaPersona } = require('../src/modules/institutional/person-query-service');

function CrearAplicacionDePrueba(service, configOverrides = {}) {
  const config = {
    ...CargarConfiguracion(EntornoValido()),
    ...configOverrides
  };
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: { ComprobarDisponibilidad: jest.fn(async () => ({ available: true, readOnly: true })) },
    institutional: service,
    logger
  });
  return { app, logger };
}

function bearer(principalId) {
  return { Authorization: `Bearer ${principalId}` };
}

function ContextoDe(principalId) {
  return CrearContextoUsuario(BuscarPrincipalDesarrollo(principalId));
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
    BuscarEstablecimiento: async (id) => establishments[id] || null,
    BuscarOficinaLocal: async (id) => offices[id] || null,
    BuscarRegion: async (id) => regions[id] || null
  };
}

function ServicioDeConsultaPrueba() {
  const catalog = territory();
  const adapter = {
    BuscarPersonas: jest.fn(async () => ({ total: 0, items: [] })),
    BuscarPersonaEnAmbito: jest.fn(async () => []),
    ListarServicios: jest.fn(async () => []),
    ListarFilasEncargado: jest.fn(async () => []),
    BuscarEstablecimiento: catalog.BuscarEstablecimiento,
    BuscarOficinaLocal: catalog.BuscarOficinaLocal,
    BuscarRegion: catalog.BuscarRegion,
    ListarRegiones: jest.fn(async () => []),
    ListarOficinasLocales: jest.fn(async () => []),
    ListarEstablecimientos: jest.fn(async () => [])
  };
  const cases = {
    ListarResumenesAutorizados: jest.fn(async () => ({ availability: 'AVAILABLE', items: [] }))
  };
  return {
    adapter,
    cases,
    service: CrearServicioConsultaPersona({
      periodId: 2026,
      adapter,
      cases,
      clock: () => new Date(2026, 10, 6)
    })
  };
}

describe('catálogo de capacidades', () => {
  test('los roles internos no heredan la gestión de catálogos ni el detalle reservado a Oficina Local', () => {
    const establishment = ContextoDe('dev-establecimiento-unico');
    const region = ContextoDe('dev-region-central-sur');
    const national = ContextoDe('dev-nacional');
    const office = ContextoDe('dev-oficina-hatillo');

    expect(TieneCapacidad(establishment, CAPABILITY.PERSON_SEARCH)).toBe(true);
    expect(TieneCapacidad(establishment, CAPABILITY.REFERRAL_CREATE)).toBe(true);
    expect(TieneCapacidad(establishment, CAPABILITY.REFERRAL_READ_DETAIL)).toBe(true);
    expect(TieneCapacidad(establishment, CAPABILITY.REFERRAL_PRINT)).toBe(true);
    expect(TieneCapacidad(establishment, CAPABILITY.REFERRAL_IMPORT)).toBe(true);
    expect(TieneCapacidad(office, CAPABILITY.REFERRAL_PRINT)).toBe(true);
    expect(TieneCapacidad(office, CAPABILITY.REFERRAL_IMPORT)).toBe(true);
    expect(TieneCapacidad(region, CAPABILITY.REFERRAL_CREATE)).toBe(false);
    expect(TieneCapacidad(region, CAPABILITY.REFERRAL_READ)).toBe(false);
    expect(TieneCapacidad(national, CAPABILITY.REFERRAL_PRINT)).toBe(false);
    expect(TieneCapacidad(establishment, CAPABILITY.REPORTING_READ)).toBe(false);
    expect(TieneCapacidad(establishment, CAPABILITY.CASE_READ)).toBe(false);
    expect(TieneCapacidad(establishment, CAPABILITY.ASSESSMENT_READ)).toBe(false);
    expect(TieneCapacidad(establishment, CAPABILITY.SESSION_MANAGE)).toBe(false);

    expect(TieneCapacidad(region, CAPABILITY.REPORTING_READ)).toBe(true);
    expect(TieneCapacidad(region, CAPABILITY.CASE_READ)).toBe(true);
    expect(TieneCapacidad(region, CAPABILITY.ASSESSMENT_READ)).toBe(false);
    expect(TieneCapacidad(region, CAPABILITY.CASE_CLOSE)).toBe(false);
    expect(TieneCapacidad(national, CAPABILITY.SCHEDULING_MANAGE)).toBe(false);
    expect(TieneCapacidad(office, CAPABILITY.CASE_CLOSE)).toBe(true);
    expect(TieneCapacidad(office, CAPABILITY.ASSESSMENT_WRITE)).toBe(true);

    expect(CapacidadesDeRoles(['ESTABLECIMIENTO', 'NACIONAL'])).not.toContain(CAPABILITY.CATALOG_MANAGE);
    expect(() => ExigirCapacidad(national, CAPABILITY.CATALOG_MANAGE)).toThrow(ErrorProhibido);
    expect(() => ExigirCapacidad(national, 'person.search.extra')).toThrow(ErrorProhibido);
  });

  test('una identidad sin concesiones autentica y no recibe capacidades', () => {
    const acceso = ContextoDe('dev-sin-capacidades');
    expect(acceso.principalId).toBe('dev-sin-capacidades');
    expect(acceso.capabilities).toEqual([]);
    expect(acceso.accessLevel).toBeNull();
    expect(() => ExigirCapacidad(acceso, CAPABILITY.PERSON_SEARCH)).toThrow(ErrorProhibido);
  });
});

describe('adaptador y contrato SIDINACC', () => {
  test('el adaptador ignora capacidades, roles y establecimientos inyectados en la identidad', () => {
    const registered = BuscarPrincipalDesarrollo('dev-establecimiento-unico');
    const acceso = AdaptarIdentidadInstitucional({
      ...registered,
      capabilities: [CAPABILITY.REPORTING_READ, CAPABILITY.PERSON_SEARCH],
      roles: ['NACIONAL'],
      accessLevel: 'NACIONAL',
      establishmentIds: [1190108]
    });
    expect(acceso.accessLevel).toBe('ESTABLECIMIENTO');
    expect(acceso.roles).toEqual(['ESTABLECIMIENTO']);
    expect(acceso.establishmentIds).toEqual([1100102]);
    expect(acceso.capabilities).not.toContain(CAPABILITY.REPORTING_READ);
  });

  test('un payload con fuente SIDINACC no concede rol ni ámbito', () => {
    const acceso = AdaptarIdentidadInstitucional({
      source: 'SIDINACC',
      principalId: 'usuario-institucional',
      grants: [{ role: 'NACIONAL' }],
      capabilities: [CAPABILITY.PERSON_SEARCH]
    });
    expect(acceso.principalId).toBeNull();
    expect(acceso.capabilities).toEqual([]);
    expect(acceso.identitySource).toBe('UNCONFIRMED');
  });

  test('una concesión nacional con establecimientos pegados se descarta', () => {
    const acceso = CrearContextoUsuario({
      principalId: 'ancla-no-valida',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: [{ role: 'NACIONAL', establishmentIds: [1100102] }]
    });
    expect(acceso.grants).toEqual([]);
    expect(acceso.capabilities).toEqual([]);
  });

  test('fuera de development y test la credencial conocida no se resuelve', () => {
    const resolution = ResolverIdentidadPresentada({
      nodeEnv: 'production',
      authorizationHeader: 'Bearer dev-nacional'
    });
    expect(resolution.status).toBe('unconfigured');
    expect(resolution.contract.acceptsCredentials).toBe(false);
    expect(resolution.contract.assignsRoles).toBe(false);
    expect(ResolverSesionSidinacc().status).toBe('unconfigured');
  });
});

describe('ámbito de varios roles', () => {
  test('dos concesiones de Establecimiento se unen y un tercero se rechaza', async () => {
    const { adapter, service } = ServicioDeConsultaPrueba();
    const { app } = CrearAplicacionDePrueba(service);
    const selected = await request(app)
      .get('/api/institutional/persons/search?q=Ana&establishmentId=1010320')
      .set(bearer('dev-establecimientos-por-rol'));
    expect(selected.status).toBe(200);
    expect(adapter.BuscarPersonas).toHaveBeenCalledWith(expect.objectContaining({
      scope: expect.objectContaining({ establishmentIds: [1010320] })
    }));

    const callsBefore = adapter.BuscarPersonas.mock.calls.length;
    const foreign = await request(app)
      .get('/api/institutional/persons/search?q=Ana&establishmentId=1190108')
      .set(bearer('dev-establecimientos-por-rol'))
      .set('X-Establishment-Id', '1100102');
    expect(foreign.status).toBe(403);
    expect(foreign.body.error.code).toBe('FORBIDDEN');
    expect(adapter.BuscarPersonas.mock.calls.length).toBe(callsBefore);
  });

  test('roles de distinto nivel no amplían la consulta al ámbito superior', async () => {
    const { adapter, service } = ServicioDeConsultaPrueba();
    const { app } = CrearAplicacionDePrueba(service);
    const acceso = ContextoDe('dev-roles-heterogeneos');
    expect(acceso.capabilities).toEqual(expect.arrayContaining([
      CAPABILITY.REPORTING_READ,
      CAPABILITY.REFERRAL_CREATE
    ]));
    expect(acceso.scopeConfirmed).toBe(false);
    expect(TieneCapacidad(acceso, CAPABILITY.REPORTING_READ)).toBe(false);
    expect(TieneCapacidad(acceso, CAPABILITY.REFERRAL_CREATE)).toBe(false);
    expect(acceso.accessLevel).toBeNull();

    const search = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-roles-heterogeneos'));
    const profile = await request(app)
      .get('/api/institutional/persons/SYN-1100102-01')
      .set(bearer('dev-roles-heterogeneos'));
    expect(search.status).toBe(403);
    expect(profile.status).toBe(403);
    expect(search.body.error.message).toMatch(/combinación de concesiones/);
    expect(adapter.BuscarPersonas).not.toHaveBeenCalled();
    expect(adapter.BuscarPersonaEnAmbito).not.toHaveBeenCalled();
  });

  test('dos oficinas locales distintas tampoco se consultan como un solo ámbito', () => {
    const acceso = CrearContextoUsuario({
      principalId: 'dos-oficinas',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: [
        { role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 },
        { role: 'OFICINA_LOCAL', regionId: 5, localOfficeId: 501 }
      ]
    });
    expect(acceso.roles).toEqual(['OFICINA_LOCAL']);
    expect(acceso.accessLevel).toBeNull();
    expect(acceso.scopeConfirmed).toBe(false);
    expect(() => ExigirCapacidad(acceso, CAPABILITY.PERSON_SEARCH)).toThrow(ErrorProhibido);
    return expect(ServicioDeConsultaPrueba().service.BuscarPersonas(acceso, {
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
      BuscarPersonas: jest.fn(),
      ObtenerPersona: jest.fn(),
      ListarOpcionesTerritorio: jest.fn()
    };
    const { app } = CrearAplicacionDePrueba(service);
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
    expect(service.BuscarPersonas).not.toHaveBeenCalled();
    expect(service.ObtenerPersona).not.toHaveBeenCalled();
    expect(service.ListarOpcionesTerritorio).not.toHaveBeenCalled();
  });

  test('el servicio niega la ausencia de capacidades antes de consultar', async () => {
    const { adapter, service } = ServicioDeConsultaPrueba();
    const criteria = {
      text: 'Ana',
      page: 1,
      pageSize: 20,
      offset: 0,
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    };
    await expect(service.BuscarPersonas(ContextoDe('dev-sin-capacidades'), criteria))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.ObtenerPersona(ContextoDe('dev-sin-capacidades'), 'SYN-1100102-01'))
      .rejects.toMatchObject({ status: 403 });
    await expect(service.ListarOpcionesTerritorio(ContextoDe('dev-sin-capacidades'), {
      regionId: null,
      localOfficeId: null,
      establishmentId: null
    })).rejects.toMatchObject({ status: 403 });
    expect(adapter.BuscarPersonas).not.toHaveBeenCalled();
    expect(adapter.BuscarPersonaEnAmbito).not.toHaveBeenCalled();
    expect(adapter.ListarRegiones).not.toHaveBeenCalled();
  });

  test('un identificador revocado o desconocido no recupera el ámbito anterior', async () => {
    const service = { BuscarPersonas: jest.fn(), ObtenerPersona: jest.fn(), ListarOpcionesTerritorio: jest.fn() };
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-establecimiento-unico-revocado'));
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(service.BuscarPersonas).not.toHaveBeenCalled();
  });

  test('encabezados y parámetros no agregan capacidades ni cambian el rol', async () => {
    const service = {
      BuscarPersonas: jest.fn(async () => ({ result: { total: 0, returned: 0, items: [] } })),
      ObtenerPersona: jest.fn(),
      ListarOpcionesTerritorio: jest.fn()
    };
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana&accessLevel=NACIONAL&capability=reporting.read')
      .set(bearer('dev-establecimiento-unico'))
      .set('X-Access-Level', 'NACIONAL')
      .set('X-Capability', 'reporting.read')
      .set('X-Role', 'NACIONAL')
      .set('X-Establishment-Id', '1190108');
    expect(response.status).toBe(200);
    expect(service.BuscarPersonas).toHaveBeenCalledWith(
      expect.objectContaining({
        principalId: 'dev-establecimiento-unico',
        accessLevel: 'ESTABLECIMIENTO',
        roles: ['ESTABLECIMIENTO'],
        establishmentIds: [1100102]
      }),
      expect.any(Object)
    );
    const acceso = service.BuscarPersonas.mock.calls[0][0];
    expect(acceso.capabilities).not.toContain(CAPABILITY.REPORTING_READ);
    expect(acceso.capabilities).toContain(CAPABILITY.PERSON_SEARCH);
  });

  test('en un entorno distinto de development o test no se acepta la identidad sintética', async () => {
    const service = { BuscarPersonas: jest.fn(), ObtenerPersona: jest.fn(), ListarOpcionesTerritorio: jest.fn() };
    const { app } = CrearAplicacionDePrueba(service, { nodeEnv: 'production' });
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-nacional'))
      .set('X-Access-Level', 'NACIONAL');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');
    expect(service.BuscarPersonas).not.toHaveBeenCalled();
  });

  test('el acceso directo a una persona ajena no confirma el registro y conserva el ámbito del servidor', async () => {
    const { adapter, service } = ServicioDeConsultaPrueba();
    const seen = [];
    adapter.BuscarPersonaEnAmbito.mockImplementation(async (criteria) => {
      seen.push(criteria.scope.establishmentIds);
      return [];
    });
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/institutional/persons/SYN-1190108-01?establishmentId=1190108')
      .set(bearer('dev-establecimiento-unico'));
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
    expect(seen).toEqual([[1100102]]);
    expect(adapter.ListarServicios).not.toHaveBeenCalled();
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
    const establishment = AplicarPoliticaCampos(sensitiveRecord(), ContextoDe('dev-establecimiento-unico'));
    const region = AplicarPoliticaCampos(sensitiveRecord(), ContextoDe('dev-region-brunca'));
    const office = AplicarPoliticaCampos(sensitiveRecord(), ContextoDe('dev-oficina-hatillo'));

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
    const acceso = CrearContextoUsuario({
      principalId: 'solo-busqueda',
      source: 'SYNTHETIC_DEVELOPMENT',
      grants: []
    });
    const projected = AplicarPoliticaCampos(sensitiveRecord(), acceso);
    expect(projected.interdisciplinaryAttention.items).toBeNull();
    expect(projected.interdisciplinaryAttention.availability).toBe('BLOCKED');
    expect(JSON.stringify(projected)).not.toMatch(/ACTIVO|detalle interno/);
  });
});
