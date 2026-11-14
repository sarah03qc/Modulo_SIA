'use strict';

const { ErrorProhibido, ErrorValidacion, ErrorUbicacionInstitucionalAmbigua } = require('../src/common/errors');
const { BuscarPrincipalDesarrollo } = require('../src/infrastructure/auth/development-access');
const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { ResolverAmbitoTerritorial } = require('../src/modules/institutional/territorial-scope');
const { CrearServicioConsultaPersona } = require('../src/modules/institutional/person-query-service');
const { AniosCumplidos, CASE_FIELDS } = require('../src/modules/institutional/person-presenter');
const { ConstruirSqlResumenCasos } = require('../src/infrastructure/persistence/case-summary-reader');
const { LeerConsultaBusqueda } = require('../src/modules/institutional/request-validation');
const { EjemplosSentenciasInstitucionales, ContienePatron } = require('../src/infrastructure/integrations/sidinacc-person-reader');
const { AfirmarLecturaInstitucional } = require('../src/infrastructure/database/institutional-read');

const TODAY = new Date(2026, 10, 6);

function AccesoDe(principalId) {
  return CrearContextoUsuario(BuscarPrincipalDesarrollo(principalId));
}

function territory() {
  const establishments = {
    1100102: { establishmentId: 1100102, localOfficeId: 101, regionId: 1 },
    1010320: { establishmentId: 1010320, localOfficeId: 101, regionId: 1 },
    1010202: { establishmentId: 1010202, localOfficeId: 103, regionId: 1 },
    1190108: { establishmentId: 1190108, localOfficeId: 501, regionId: 5 }
  };
  const offices = {
    101: { localOfficeId: 101, regionId: 1, name: 'Hatillo' },
    103: { localOfficeId: 103, regionId: 1, name: 'Tibas' },
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

function SinFiltros() {
  return { regionId: null, localOfficeId: null, establishmentId: null };
}

describe('ámbito territorial', () => {
  test('aplica el único establecimiento y rechaza filtros ajenos', async () => {
    const acceso = AccesoDe('dev-establecimiento-unico');
    const catalog = territory();
    const applied = await ResolverAmbitoTerritorial(acceso, SinFiltros(), catalog);
    expect(applied.establishmentIds).toEqual([1100102]);
    expect(applied.establishmentAppliedAutomatically).toBe(true);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      establishmentId: 1010320
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 101
    }, catalog)).rejects.toBeInstanceOf(ErrorValidacion);
  });

  test('un establecimiento con varios ámbitos solo filtra entre los autorizados', async () => {
    const acceso = AccesoDe('dev-establecimiento-multiple');
    const catalog = territory();
    const open = await ResolverAmbitoTerritorial(acceso, SinFiltros(), catalog);
    expect(open.establishmentIds).toEqual([1100102, 1010320]);
    expect(open.establishmentAppliedAutomatically).toBe(false);

    const selected = await ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      establishmentId: 1010320
    }, catalog);
    expect(selected.establishmentIds).toEqual([1010320]);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      establishmentId: 1190108
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);
  });

  test('Oficina Local excluye otras oficinas y acepta su establecimiento', async () => {
    const acceso = AccesoDe('dev-oficina-hatillo');
    const catalog = territory();
    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 501
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);

    const selected = await ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      establishmentId: 1100102
    }, catalog);
    expect(selected.localOfficeId).toBe(101);
    expect(selected.establishmentIds).toEqual([1100102]);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      establishmentId: 1190108
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);
  });

  test('Regional rechaza otra región y una combinación incompatible', async () => {
    const acceso = AccesoDe('dev-region-central-sur');
    const catalog = territory();
    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      regionId: 5
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);

    const office = await ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 101
    }, catalog);
    expect(office.regionId).toBe(1);
    expect(office.localOfficeId).toBe(101);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 101,
      establishmentId: 1010202
    }, catalog)).rejects.toBeInstanceOf(ErrorValidacion);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 501
    }, catalog)).rejects.toBeInstanceOf(ErrorProhibido);
  });

  test('Nacional exige coherencia y no arma un listado sin ámbito falso', async () => {
    const acceso = AccesoDe('dev-nacional');
    const catalog = territory();
    const open = await ResolverAmbitoTerritorial(acceso, SinFiltros(), catalog);
    expect(open.establishmentIds).toBeNull();
    expect(open.regionId).toBeNull();

    await expect(ResolverAmbitoTerritorial(acceso, {
      regionId: 1,
      localOfficeId: 501,
      establishmentId: null
    }, catalog)).rejects.toBeInstanceOf(ErrorValidacion);

    await expect(ResolverAmbitoTerritorial(acceso, {
      ...SinFiltros(),
      localOfficeId: 999
    }, catalog)).rejects.toBeInstanceOf(ErrorValidacion);

    const chained = await ResolverAmbitoTerritorial(acceso, {
      regionId: 5,
      localOfficeId: 501,
      establishmentId: 1190108
    }, catalog);
    expect(chained.establishmentIds).toEqual([1190108]);
  });

  test('sin contexto de acceso no consulta', async () => {
    await expect(ResolverAmbitoTerritorial(null, SinFiltros(), territory()))
      .rejects.toBeInstanceOf(ErrorProhibido);
  });
});

describe('búsqueda contextual', () => {
  function serviceWith(BuscarPersonas) {
    const adapter = {
      BuscarPersonas: jest.fn(BuscarPersonas),
      BuscarPersonaEnAmbito: jest.fn(async () => []),
      ListarServicios: jest.fn(async () => []),
      ListarFilasEncargado: jest.fn(async () => []),
      BuscarEstablecimiento: territory().BuscarEstablecimiento,
      BuscarOficinaLocal: territory().BuscarOficinaLocal,
      BuscarRegion: territory().BuscarRegion,
      ListarRegiones: jest.fn(async () => []),
      ListarOficinasLocales: jest.fn(async () => []),
      ListarEstablecimientos: jest.fn(async () => [])
    };
    const cases = { ListarResumenesAutorizados: jest.fn() };
    return {
      adapter,
      cases,
      service: CrearServicioConsultaPersona({
        periodId: 2026,
        adapter,
        cases,
        clock: () => TODAY
      })
    };
  }

  test('la identificación exacta tiene precedencia y no continúa por nombre', async () => {
    const { adapter, service } = serviceWith(async (criteria) => {
      if (criteria.mode === 'identification') {
        return { total: 1, items: [{ person_id: 'SYN-1100102-01', given_name: 'Ana' }] };
      }
      return { total: 4, items: [] };
    });
    const body = await service.BuscarPersonas(AccesoDe('dev-establecimiento-unico'), {
      text: 'SYN-1100102-01',
      page: 1,
      pageSize: 20,
      offset: 0,
      ...SinFiltros()
    });
    expect(body.query.matchMode).toBe('identification');
    expect(body.result.total).toBe(1);
    expect(body.result.returned).toBe(1);
    expect(adapter.BuscarPersonas).toHaveBeenCalledTimes(1);
    expect(body.scope.establishmentAppliedAutomatically).toBe(true);
    expect(body.provenance.periodId).toBe('2026');
  });

  test('sin identificación exacta busca por nombre y puede informar cero coincidencias', async () => {
    const { service } = serviceWith(async (criteria) => {
      if (criteria.mode === 'identification') {
        return { total: 0, items: [] };
      }
      return { total: 0, items: [] };
    });
    const body = await service.BuscarPersonas(AccesoDe('dev-oficina-hatillo'), {
      text: 'Nombre Inexistente',
      page: 1,
      pageSize: 20,
      offset: 0,
      ...SinFiltros()
    });
    expect(body.query.matchMode).toBe('name');
    expect(body.result.total).toBe(0);
    expect(body.result.message).toMatch(/ámbito autorizado/);
    expect(body.scope.localOfficeId).toBe(101);
  });

  test('varias coincidencias conservan datos para distinguir y el conteo', async () => {
    const { service } = serviceWith(async (criteria) => {
      if (criteria.mode === 'identification') {
        return { total: 0, items: [] };
      }
      return {
        total: 2,
        items: [
          {
            person_id: 'SYN-1100102-01',
            given_name: 'Ana',
            first_surname: 'Campos',
            second_surname: 'Jimenez',
            birth_date: '2016-03-02',
            sex_name: 'Mujer',
            establishment_id: 1100102,
            establishment_name: 'Establecimiento demo',
            local_office_id: 101,
            local_office_name: 'Hatillo',
            region_id: 1,
            region_name: 'Central Sur'
          },
          {
            person_id: 'SYN-1010320-01',
            given_name: 'Lucia',
            first_surname: 'Mora',
            second_surname: 'Campos',
            birth_date: '2015-11-06',
            sex_name: 'Mujer',
            establishment_id: 1010320,
            establishment_name: 'Otro establecimiento',
            local_office_id: 101,
            local_office_name: 'Hatillo',
            region_id: 1,
            region_name: 'Central Sur'
          }
        ]
      };
    });
    const body = await service.BuscarPersonas(AccesoDe('dev-oficina-hatillo'), {
      text: 'Campos',
      page: 1,
      pageSize: 1,
      offset: 0,
      ...SinFiltros()
    });
    expect(body.result.total).toBe(2);
    expect(body.result.returned).toBe(2);
    expect(body.result.items[0].personId).not.toBe(body.result.items[1].personId);
    expect(body.result.items[0].establishment.id).not.toBe(body.result.items[1].establishment.id);
    expect(body.result.items[0].ageYears).toBe(10);
    expect(body.result.items[1].ageYears).toBe(11);
  });

  test('el criterio malicioso viaja como parámetro, no como sentencia', async () => {
    const { adapter, service } = serviceWith(async () => ({ total: 0, items: [] }));
    const text = "SYN-1100102-01' OR 1=1 --";
    await service.BuscarPersonas(AccesoDe('dev-nacional'), {
      text,
      page: 1,
      pageSize: 20,
      offset: 0,
      ...SinFiltros()
    });
    expect(adapter.BuscarPersonas).toHaveBeenCalledWith(expect.objectContaining({
      text,
      mode: 'identification'
    }));
    expect(ContienePatron('%_Ana')).toBe('%\\%\\_ANA%');
  });
});

describe('consulta básica', () => {
  const FilaDePersona = {
    person_id: 'SYN-1100102-01',
    given_name: 'Ana',
    first_surname: 'Campos',
    second_surname: 'Jimenez',
    birth_date: '2016-01-15',
    sex_name: 'Mujer',
    establishment_id: 1100102,
    establishment_name: 'Establecimiento demo',
    local_office_id: 101,
    local_office_name: 'Hatillo',
    region_id: 1,
    region_name: 'Central Sur',
    address_line: 'Calle Sintetica 12',
    phone_one: '88881101',
    phone_two: null
  };

  function profileService(overrides = {}) {
    const cases = {
      ListarResumenesAutorizados: jest.fn(async () => overrides.cases || {
        availability: 'AVAILABLE',
        items: []
      })
    };
    const adapter = {
      BuscarPersonas: jest.fn(),
      BuscarPersonaEnAmbito: jest.fn(async () => overrides.rows || [FilaDePersona]),
      ListarServicios: jest.fn(async () => overrides.services || [
        { service_id: 1, service_name: 'Servicio Demo 1 (SINTETICO)' }
      ]),
      ListarFilasEncargado: jest.fn(async () => overrides.guardian || [{
        person_id: 'SYN-1100102-81',
        given_name: 'Rosa',
        first_surname: 'Solano',
        second_surname: 'Campos',
        mother_id: 'SYN-1100102-81',
        father_id: 'SYN-1100102-82',
        guardian_id: 'SYN-1100102-81'
      }]),
      BuscarEstablecimiento: territory().BuscarEstablecimiento,
      BuscarOficinaLocal: territory().BuscarOficinaLocal,
      BuscarRegion: territory().BuscarRegion,
      ListarRegiones: jest.fn(async () => []),
      ListarOficinasLocales: jest.fn(async () => []),
      ListarEstablecimientos: jest.fn(async () => [])
    };
    return {
      cases,
      service: CrearServicioConsultaPersona({
        periodId: 2026,
        adapter,
        cases,
        clock: () => TODAY
      })
    };
  }

  test('devuelve identidad, ubicación, servicio y encargado sin tratarlo como cliente', async () => {
    const { service } = profileService();
    const body = await service.ObtenerPersona(AccesoDe('dev-establecimiento-unico'), 'SYN-1100102-01');
    expect(body.personId).toBe('SYN-1100102-01');
    expect(body.fullName).toBe('Ana Campos Jimenez');
    expect(body.establishment.id).toBe(1100102);
    expect(body.localOffice.name).toBe('Hatillo');
    expect(body.region.name).toBe('Central Sur');
    expect(body.services.items).toHaveLength(1);
    expect(body.services.interpretationStatus).toBe('NEEDS_VALIDATION');
    expect(body.guardian.contextOnly).toBe(true);
    expect(body.guardian.person.relationship).toBe('MADRE');
    expect(body.guardian.person.isInterdisciplinaryClient).toBeUndefined();
    expect(body.provenance.source).toBe('SIDINACC_LOCAL');
    expect(body.interdisciplinaryAttention.visibleCaseCount).toBe(0);
    expect(body.interdisciplinaryAttention.message).toMatch(/No hay casos/);
  });

  test('persona fuera de ámbito o inexistente usa la misma respuesta', async () => {
    const { service } = profileService({ rows: [] });
    await expect(service.ObtenerPersona(AccesoDe('dev-region-brunca'), 'SYN-1100102-01'))
      .rejects.toMatchObject({ status: 404 });
  });

  test('no elige una ubicación institucional ambigua', async () => {
    const { service } = profileService({ rows: [FilaDePersona, { ...FilaDePersona, establishment_id: 1010320 }] });
    await expect(service.ObtenerPersona(AccesoDe('dev-nacional'), 'SYN-1100102-01'))
      .rejects.toBeInstanceOf(ErrorUbicacionInstitucionalAmbigua);
  });

  test('un detalle fuera del ámbito también deja la ficha sin elegir fila', async () => {
    const { service } = profileService({
      rows: [{ ...FilaDePersona, location_count: 2 }]
    });
    await expect(service.ObtenerPersona(AccesoDe('dev-establecimiento-unico'), 'SYN-1100102-01'))
      .rejects.toBeInstanceOf(ErrorUbicacionInstitucionalAmbigua);
  });

  test('el encargado distinto de madre y padre no recibe una relación inventada', async () => {
    const { service } = profileService({
      guardian: [{
        person_id: 'SYN-1100102-87',
        given_name: 'Teresa',
        first_surname: 'Aguilar',
        second_surname: 'Molina',
        mother_id: 'SYN-1100102-85',
        father_id: 'SYN-1100102-86',
        guardian_id: 'SYN-1100102-87'
      }]
    });
    const body = await service.ObtenerPersona(AccesoDe('dev-establecimiento-unico'), 'SYN-1100102-03');
    expect(body.guardian.person.personId).toBe('SYN-1100102-87');
    expect(body.guardian.person.relationship).toBeNull();
  });

  test('sin permiso de casos no simula resultados ni expone columnas restringidas', async () => {
    const { service } = profileService({ cases: { availability: 'BLOCKED', items: null } });
    const body = await service.ObtenerPersona(AccesoDe('dev-establecimiento-unico'), 'SYN-1100102-01');
    expect(body.interdisciplinaryAttention.availability).toBe('BLOCKED');
    expect(body.interdisciplinaryAttention.items).toBeNull();
    expect(JSON.stringify(body)).not.toMatch(/riesgo|proteccion|factor|planOperativo|valoracion/i);
  });

  test('un caso autorizado solo conserva identificador, estado, prioridad y fechas', async () => {
    const { cases, service } = profileService({
      cases: {
        availability: 'AVAILABLE',
        items: [{
          caseId: 15,
          status: 'ACTIVO',
          priority: 'MODERADO',
          openedOn: '2026-02-01',
          closedOn: null
        }]
      }
    });
    const body = await service.ObtenerPersona(AccesoDe('dev-establecimiento-multiple'), 'SYN-1100102-01');
    expect(Object.keys(body.interdisciplinaryAttention.items[0]).sort()).toEqual([...CASE_FIELDS].sort());
    expect(body.interdisciplinaryAttention.items[0]).toEqual({
      caseId: '15',
      status: 'ACTIVO',
      priority: 'MODERADO',
      openedOn: '2026-02-01',
      closedOn: null
    });
    const statement = ConstruirSqlResumenCasos({
      regionId: null,
      localOfficeId: null,
      establishmentIds: [1100102, 1010320]
    });
    expect(statement.sql).not.toMatch(/riesgo|proteccion|factor|caso_plan|ses_valoracion|ate_|doc_/i);
    expect(() => AfirmarLecturaInstitucional(statement.sql)).not.toThrow();
    expect(cases.ListarResumenesAutorizados).toHaveBeenCalledWith('SYN-1100102-01', expect.objectContaining({
      establishmentIds: [1100102, 1010320]
    }));
  });
});

describe('validación y lecturas institucionales', () => {
  test('exige criterio, limita la página y rechaza identificadores no numéricos', () => {
    expect(() => LeerConsultaBusqueda({})).toThrow(ErrorValidacion);
    expect(() => LeerConsultaBusqueda({ q: 'A' })).toThrow(/2 caracteres/);
    expect(() => LeerConsultaBusqueda({ q: 'Ana', pageSize: '100' })).toThrow(/tamaño de página/);
    expect(() => LeerConsultaBusqueda({ q: 'Ana', regionId: '1 OR 1=1' })).toThrow(ErrorValidacion);
    const parsed = LeerConsultaBusqueda({ q: '  Ana  ', page: '2', pageSize: '10' });
    expect(parsed).toMatchObject({ text: 'Ana', page: 2, pageSize: 10, offset: 10 });
  });

  test('la edad usa la fecha del servidor y no adelanta un cumpleaños', () => {
    expect(AniosCumplidos('2015-11-07', TODAY)).toBe(10);
    expect(AniosCumplidos('2015-11-06', TODAY)).toBe(11);
    expect(AniosCumplidos(null, TODAY)).toBeNull();
  });

  test('las sentencias de la réplica son una sola lectura con columnas nombradas', () => {
    for (const sql of EjemplosSentenciasInstitucionales()) {
      expect(() => AfirmarLecturaInstitucional(sql)).not.toThrow();
    }
  });
});
