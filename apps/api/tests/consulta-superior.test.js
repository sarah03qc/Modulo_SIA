'use strict';

/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-032 a HU-035. Ámbito, filtros, exportación y expediente de consulta.
 */

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { AgregarAmbito } = require(
  '../src/modules/proceso-interdisciplinario/repositorio-proceso'
);
const { CrearServicioProceso } = require(
  '../src/modules/proceso-interdisciplinario/servicio-proceso'
);

function Acceso(rol, extra) {
  const grants = [{ role: rol, ...extra }];
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: `dev-${rol}`,
    grants
  });
}

function Fila(extra) {
  return {
    caso_id: 4,
    per_id_persona: 'SYN-1100102-01',
    establecimiento_id: 1100102,
    oficina_local_id: 101,
    region_id: 1,
    estado: 'ACTIVO',
    prioridad_codigo: 'ALTO',
    fecha_apertura: '2026-02-01',
    fecha_cierre: null,
    ...extra
  };
}

function Consulta(extra) {
  return {
    pagina: 1,
    tamano: 20,
    desplazamiento: 0,
    estado: null,
    prioridad: null,
    identificacion: null,
    nombre: null,
    establecimientoId: null,
    regionId: null,
    localOfficeId: null,
    ...extra
  };
}

function Adaptador() {
  return {
    BuscarRegion: jest.fn(async (id) => (id === 1 || id === 5 ? { regionId: id } : null)),
    BuscarOficinaLocal: jest.fn(async (id) => {
      if (id === 101) {
        return { localOfficeId: 101, regionId: 1 };
      }
      if (id === 501) {
        return { localOfficeId: 501, regionId: 5 };
      }
      return null;
    }),
    BuscarEstablecimiento: jest.fn(async (id) => {
      if (id === 1100102) {
        return { establishmentId: 1100102, localOfficeId: 101, regionId: 1 };
      }
      if (id === 5099001) {
        return { establishmentId: 5099001, localOfficeId: 501, regionId: 5 };
      }
      return null;
    }),
    BuscarPersonaEnAmbito: jest.fn(async () => []),
    BuscarPersonas: jest.fn(async () => ({ total: 1, items: [{ person_id: 'SYN-1100102-01' }] }))
  };
}

function Servicio(repositorio, adaptador = Adaptador()) {
  return CrearServicioProceso({
    periodId: '2026',
    adaptador,
    repositorio
  });
}

describe('consulta regional y nacional de casos', () => {
  test('el ámbito regional y nacional queda parametrizado', () => {
    const regional = [];
    const parametrosRegional = {};
    AgregarAmbito('caso', {
      accessLevel: 'REGION',
      regionId: 1,
      localOfficeId: 101,
      establishmentIds: [1100102]
    }, parametrosRegional, regional);
    expect(regional).toEqual([
      'caso.region_id = @ambitoRegion',
      'caso.oficina_local_id = @ambitoOficina',
      'caso.establecimiento_id IN (@ambitoEstablecimiento0)'
    ]);
    expect(parametrosRegional.ambitoRegion.value).toBe(1);

    const nacional = [];
    AgregarAmbito('caso', {
      accessLevel: 'NACIONAL',
      regionId: null,
      localOfficeId: null,
      establishmentIds: null
    }, {}, nacional);
    expect(nacional).toEqual(['1 = 1']);
  });

  test('Regional lista su región y rechaza otra región u otra oficina', async () => {
    const listar = jest.fn(async () => ({ total: 5, filas: [Fila()] }));
    const servicio = Servicio({ ListarCasos: listar });
    const acceso = Acceso('REGION', { regionId: 1 });
    const lista = await servicio.ListarCasos(acceso, Consulta({
      estado: 'ACTIVO',
      prioridad: 'ALTO',
      localOfficeId: 101,
      establecimientoId: 1100102,
      tamano: 1
    }));
    expect(lista.total).toBe(5);
    expect(lista.devueltos).toBe(1);
    expect(lista.consultaPermitida).toBe(true);
    expect(lista.detallePermitido).toBe(false);
    expect(listar.mock.calls[0][0].ambito).toMatchObject({
      accessLevel: 'REGION',
      regionId: 1,
      localOfficeId: 101,
      establishmentIds: [1100102]
    });
    expect(listar.mock.calls[0][0].estado).toBe('ACTIVO');
    expect(listar.mock.calls[0][0].prioridad).toBe('ALTO');
    await expect(servicio.ListarCasos(acceso, Consulta({ regionId: 5 })))
      .rejects.toMatchObject({ status: 403 });
    await expect(servicio.ListarCasos(acceso, Consulta({ localOfficeId: 501 })))
      .rejects.toMatchObject({ status: 403 });
    await expect(servicio.AbrirCaso(acceso, {})).rejects.toMatchObject({ status: 403 });
  });

  test('Nacional combina la jerarquía y rechaza una combinación incompatible', async () => {
    const listar = jest.fn(async () => ({ total: 2, filas: [Fila()] }));
    const servicio = Servicio({ ListarCasos: listar });
    const acceso = Acceso('NACIONAL', {});
    await servicio.ListarCasos(acceso, Consulta({
      regionId: 1,
      localOfficeId: 101,
      establecimientoId: 1100102,
      nombre: 'Sintetica'
    }));
    expect(listar.mock.calls[0][0].ambito).toMatchObject({
      accessLevel: 'NACIONAL',
      regionId: 1,
      localOfficeId: 101,
      establishmentIds: [1100102]
    });
    expect(listar.mock.calls[0][0].personas).toEqual(['SYN-1100102-01']);
    await expect(servicio.ListarCasos(acceso, Consulta({
      regionId: 1,
      localOfficeId: 501
    }))).rejects.toMatchObject({ status: 400 });
    await expect(servicio.ListarCasos(acceso, Consulta({ regionId: 99 })))
      .rejects.toMatchObject({ status: 400 });
  });

  test('la exportación regional respeta el total y protege fórmulas', async () => {
    const filas = [Fila({ per_id_persona: '=SYN' })];
    const listar = jest.fn(async (consulta) => ({
      total: 2,
      filas: consulta.tamano === 1 ? filas.slice(0, 1) : filas.concat([Fila()])
    }));
    const servicio = Servicio({ ListarCasos: listar });
    const archivo = await servicio.ExportarCasos(
      Acceso('REGION', { regionId: 1 }),
      Consulta()
    );
    expect(archivo.total).toBe(2);
    expect(archivo.contenido.split('\n')).toHaveLength(3);
    expect(archivo.contenido).toContain('oficina_local');
    expect(archivo.contenido).toContain("\"'=SYN\"");
    expect(listar.mock.calls[1][0].tamano).toBe(2);
    expect(listar.mock.calls[1][0].desplazamiento).toBe(0);
  });

  test('el expediente de consulta omite el texto clínico y niega otra región', async () => {
    const repositorio = {
      ObtenerCabeceraConsulta: jest.fn(async (casoId, ambito) => (
        ambito.regionId === 1 || ambito.regionId === null ? {
          caso_id: casoId,
          per_id_persona: 'SYN-1100102-01',
          establecimiento_id: 1100102,
          oficina_local_id: 101,
          region_id: 1,
          estado: 'ACTIVO',
          consecutivo_origen: 'CONS-4',
          fecha_apertura: '2026-02-01',
          establecimiento_nombre: 'Establecimiento sintético',
          prioridad_codigo: 'ALTO',
          fecha_cierre: null
        } : null
      )),
      ListarHistorialConsulta: jest.fn(async () => ([
        { estado: 'ACTIVO', ocurrido_en: '2026-02-01 08:00:00' }
      ])),
      ListarValoracionesConsulta: jest.fn(async () => ([
        {
          valoracion_id: 1,
          numero: 1,
          es_vigente: 1,
          prioridad_codigo: 'ALTO',
          responsable_usuario: 'dev-oficina',
          fecha_valoracion: '2026-02-01'
        }
      ])),
      ListarPlanesConsulta: jest.fn(async () => ([
        {
          plan_id: 3,
          numero_version: 1,
          es_vigente: 1,
          fecha_plan: '2026-02-01',
          responsable_usuario: 'dev-oficina',
          frecuencia_etiqueta: 'Trimestral'
        }
      ])),
      ObtenerPlanVigenteConsulta: jest.fn(async () => ({
        frecuenciaEtiqueta: 'Trimestral',
        estrategias: [{ etiqueta: 'Acompañamiento' }],
        disciplinas: [{ etiqueta: 'Nutrición' }]
      })),
      ListarAtencionesConsulta: jest.fn(async () => ([
        { atencion_individual_id: 9, fecha_atencion: '2026-03-01' }
      ])),
      ListarGrupalesConsulta: jest.fn(async () => []),
      ListarCoordinacionesConsulta: jest.fn(async () => []),
      ListarReportesConsulta: jest.fn(async () => []),
      ObtenerCierreConsulta: jest.fn(async () => null),
      ObtenerUltimaAtencion: jest.fn(async () => '2026-03-01')
    };
    const servicio = Servicio(repositorio);
    const detalle = await servicio.ObtenerConsultaCaso(
      Acceso('NACIONAL', {}),
      4
    );
    expect(detalle.modo).toBe('CONSULTA');
    expect(detalle.soloLectura).toBe(true);
    expect(detalle.plan.estrategias).toEqual(['Acompañamiento']);
    expect(detalle.plan.disciplinas).toEqual(['Nutrición']);
    expect(detalle.lineaTiempo.map((evento) => evento.tipo)).toEqual([
      'ESTADO',
      'PLAN',
      'VALORACION',
      'ATENCION_INDIVIDUAL'
    ]);
    expect(detalle.riesgoCodigo).toBeUndefined();
    expect(detalle.factores).toBeUndefined();
    expect(detalle.contextoIngreso).toBeUndefined();
    expect(detalle.atenciones).toBeUndefined();
    expect(detalle.lineaTiempo.every((evento) => (
      !/recomend|diagnóst|factor|contacto/i.test(evento.texto)
    ))).toBe(true);
    await expect(servicio.ObtenerConsultaCaso(Acceso('REGION', { regionId: 5 }), 4))
      .rejects.toMatchObject({ status: 404 });
    await expect(servicio.ObtenerCaso(Acceso('REGION', { regionId: 1 }), 4))
      .rejects.toMatchObject({ status: 403 });
  });
});
