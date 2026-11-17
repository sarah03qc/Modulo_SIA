'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioReporteria } = require('../src/modules/reporteria/servicio-reporteria');

function AccesoOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

function AccesoEstablecimiento() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-establecimiento-unico',
    grants: [{ role: 'ESTABLECIMIENTO', establishmentIds: [1100102] }]
  });
}

function AccesoRegion() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-region',
    grants: [{ role: 'REGION', regionId: 1 }]
  });
}

function HechosVacios() {
  return {
    casos: [],
    referencias: [],
    motivosReferencia: [],
    individuales: [],
    grupales: [],
    disciplinasGrupales: [],
    profesionalesGrupales: [],
    participantes: [],
    cancelaciones: [],
    cierres: [],
    ultimasAtenciones: [],
    catalogoTipos: [],
    catalogoDisciplinas: [{ itemId: 3, etiqueta: 'Trabajo social', codigo: 'TS' }]
  };
}

function Filtros(extra = {}) {
  return {
    anio: 2026,
    establecimientoId: null,
    estado: 'TODOS',
    prioridad: null,
    disciplinaId: null,
    profesional: null,
    sexo: null,
    edad: null,
    ...extra
  };
}

function Servicio(hechos, adaptadorExtra = {}) {
  const consultar = jest.fn(async () => hechos);
  const adaptador = {
    BuscarEstablecimiento: jest.fn(async (id) => {
      if (id === 1100102) {
        return {
          establishmentId: id,
          localOfficeId: 101,
          regionId: 1,
          name: 'Centro norte'
        };
      }
      return {
        establishmentId: id,
        localOfficeId: 301,
        regionId: 3,
        name: 'Otra oficina'
      };
    }),
    ListarEstablecimientos: jest.fn(async () => [{
      establishmentId: 1100102,
      localOfficeId: 101,
      regionId: 1,
      name: 'Centro norte'
    }]),
    LeerSexoYNacimiento: jest.fn(async () => []),
    ...adaptadorExtra
  };
  return {
    consultar,
    servicio: CrearServicioReporteria({
      repositorio: { ConsultarHechos: consultar },
      adaptador
    })
  };
}

describe('servicio de reportería de Oficina Local', () => {
  test('el establecimiento y la región no consultan esta reportería', async () => {
    const { servicio, consultar } = Servicio(HechosVacios());
    await expect(servicio.ConsultarOficina(AccesoEstablecimiento(), Filtros()))
      .rejects.toMatchObject({ status: 403 });
    await expect(servicio.ConsultarOficina(AccesoRegion(), Filtros()))
      .rejects.toMatchObject({ status: 403 });
    await expect(servicio.DescargarConsolidacion(AccesoEstablecimiento(), Filtros()))
      .rejects.toMatchObject({ status: 403 });
    expect(consultar).not.toHaveBeenCalled();
  });

  test('un establecimiento de otra oficina no se consulta', async () => {
    const { servicio, consultar } = Servicio(HechosVacios());
    await expect(servicio.ConsultarOficina(
      AccesoOficina(),
      Filtros({ establecimientoId: 5010104 })
    )).rejects.toMatchObject({ status: 403 });
    expect(consultar).not.toHaveBeenCalled();
  });

  test('la consulta usa la oficina de la sesión', async () => {
    const { servicio, consultar } = Servicio(HechosVacios());
    const respuesta = await servicio.ConsultarOficina(
      AccesoOficina(),
      Filtros({ establecimientoId: 1100102 })
    );
    expect(consultar).toHaveBeenCalledWith(expect.objectContaining({
      oficinaLocalId: 101,
      regionId: 1,
      establecimientoId: 1100102,
      inicio: '2026-01-01',
      fin: '2027-01-01'
    }));
    expect(respuesta.visualizaciones).toHaveLength(12);
    expect(respuesta.informeAnalitico.disponible).toBe(true);
    expect(respuesta.huellaCorte).toMatch(/^[a-f0-9]{64}$/);
    expect(respuesta.informeAnalitico.mensaje).toMatch(/HU-050/);
    expect(respuesta.casosSinAtencion.filas).toBeUndefined();
  });

  test('la descarga rechaza el sexo si la réplica no responde', async () => {
    const { servicio } = Servicio(HechosVacios(), {
      LeerSexoYNacimiento: jest.fn(async () => {
        throw new Error('replica');
      })
    });
    await expect(servicio.ConsultarOficina(
      AccesoOficina(),
      Filtros({ sexo: 'Femenino' })
    )).rejects.toMatchObject({ status: 503 });
  });
});

function AccesoNacional() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-nacional',
    grants: [{ role: 'NACIONAL' }]
  });
}

describe('reportería Regional y Nacional', () => {
  test('la región usa su sesión y rechaza otra oficina', async () => {
    const { servicio, consultar } = Servicio(HechosVacios(), {
      BuscarOficinaLocal: jest.fn(async (id) => ({
        localOfficeId: id,
        regionId: id === 101 ? 1 : 5,
        name: id === 101 ? 'Hatillo' : 'Ajena'
      })),
      BuscarRegion: jest.fn(async () => ({ regionId: 1, name: 'Central Sur' }))
    });
    const respuesta = await servicio.ConsultarAmbito(AccesoRegion(), Filtros());
    expect(consultar).toHaveBeenCalledWith(expect.objectContaining({
      oficinaLocalId: null,
      regionId: 1,
      establecimientoId: null
    }));
    expect(respuesta.visualizaciones).toHaveLength(12);
    expect(respuesta.informeAnalitico.disponible).toBe(false);
    expect(respuesta.identificacion.unidad).toBe('Región');
    consultar.mockClear();
    await expect(servicio.ConsultarAmbito(
      AccesoRegion(),
      Filtros({ localOfficeId: 501 })
    )).rejects.toMatchObject({ status: 403 });
    expect(consultar).not.toHaveBeenCalled();
  });

  test('el nacional calcula el universo y rechaza una combinación incompatible', async () => {
    const { servicio, consultar } = Servicio(HechosVacios(), {
      BuscarRegion: jest.fn(async (id) => ({ regionId: id, name: 'Región' })),
      BuscarOficinaLocal: jest.fn(async (id) => ({
        localOfficeId: id,
        regionId: 5,
        name: 'Ajena'
      }))
    });
    const respuesta = await servicio.ConsultarAmbito(AccesoNacional(), Filtros());
    expect(consultar).toHaveBeenCalledWith(expect.objectContaining({
      oficinaLocalId: null,
      regionId: null
    }));
    expect(respuesta.identificacion.unidad).toBe('Nacional');
    expect(respuesta.visualizaciones).toHaveLength(12);
    const archivo = await servicio.DescargarConsolidacionAmbito(
      AccesoNacional(),
      Filtros()
    );
    expect(Buffer.isBuffer(archivo)).toBe(true);
    await expect(servicio.ConsultarAmbito(
      AccesoNacional(),
      Filtros({ regionId: 1, localOfficeId: 501 })
    )).rejects.toMatchObject({ status: 400 });
    await expect(servicio.ConsultarAmbito(AccesoEstablecimiento(), Filtros()))
      .rejects.toMatchObject({ status: 403 });
    await expect(servicio.ConsultarAmbito(AccesoOficina(), Filtros()))
      .rejects.toMatchObject({ status: 403 });
  });
});
