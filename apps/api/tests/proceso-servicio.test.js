'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioProceso } = require(
  '../src/modules/proceso-interdisciplinario/servicio-proceso'
);

function AccesoEstablecimiento() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-establecimiento-unico',
    grants: [{ role: 'ESTABLECIMIENTO', establishmentIds: [1100102] }]
  });
}

function AccesoOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-hatillo',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 1, localOfficeId: 101 }]
  });
}

function MatrizConfirmada() {
  return [
    ['ALTO', 'BAJA', 'ALTO'],
    ['ALTO', 'MODERADA', 'ALTO'],
    ['ALTO', 'ALTA', 'MODERADO'],
    ['MODERADO', 'BAJA', 'ALTO'],
    ['MODERADO', 'MODERADA', 'MODERADO'],
    ['MODERADO', 'ALTA', 'MODERADO'],
    ['BAJO', 'BAJA', 'MODERADO'],
    ['BAJO', 'MODERADA', 'BAJO'],
    ['BAJO', 'ALTA', 'BAJO']
  ].map(([riesgo, proteccion, prioridad]) => ({
    cat_version_id: 7,
    riesgo_codigo: riesgo,
    proteccion_codigo: proteccion,
    prioridad_codigo: prioridad
  }));
}

function RepositorioBase(extra) {
  return {
    ListarMatrizVigente: jest.fn(async () => MatrizConfirmada()),
    ListarCatalogo: jest.fn(async () => []),
    ListarInstrumentoVigente: jest.fn(async () => []),
    ContarReferencias: jest.fn(async () => 2),
    ContarCasos: jest.fn(async () => ({ total: 1, personas: 1 })),
    ListarProximasSesiones: jest.fn(async () => []),
    ObtenerSesion: jest.fn(async () => ({
      sesion: { sesion_id: 3 },
      disciplinas: [],
      situaciones: []
    })),
    ListarCasos: jest.fn(async () => ({
      total: 1,
      filas: [{
        caso_id: 4,
        per_id_persona: 'SYN-1100102-01',
        establecimiento_id: 1100102,
        estado: 'ACTIVO',
        prioridad_codigo: 'ALTO',
        fecha_apertura: '2026-02-01',
        fecha_cierre: null,
        riesgo_codigo: 'ALTO',
        factores: [{ secreto: true }]
      }]
    })),
    BuscarReferencia: jest.fn(async () => null),
    AbrirCaso: jest.fn(async () => {
      const error = new Error('duplicado');
      error.code = 'CASO_ACTIVO';
      error.domain = true;
      throw error;
    }),
    ...extra
  };
}

describe('servicio del proceso interdisciplinario', () => {
  test('el establecimiento no abre casos ni ve factores en la lista', async () => {
    const repositorio = RepositorioBase();
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {
        BuscarPersonaEnAmbito: jest.fn(async () => [])
      },
      repositorio
    });
    const acceso = AccesoEstablecimiento();

    await expect(servicio.AbrirCaso(acceso, {
      referenciaId: 1,
      propositos: ['Acompañar'],
      estrategias: [1],
      disciplinas: [1],
      frecuenciaCodigo: 'TRIMESTRAL'
    })).rejects.toMatchObject({ status: 403 });

    const lista = await servicio.ListarCasos(acceso, {
      pagina: 1,
      tamano: 20,
      desplazamiento: 0,
      estado: null,
      prioridad: null,
      identificacion: null,
      nombre: null,
      establecimientoId: null
    });
    expect(lista.detallePermitido).toBe(false);
    expect(lista.items[0]).toEqual({
      casoId: 4,
      identificacion: 'SYN-1100102-01',
      nombre: null,
      origenNombre: 'NO_DISPONIBLE',
      establecimientoId: 1100102,
      estado: 'ACTIVO',
      prioridadCodigo: 'ALTO',
      prioridadEtiqueta: 'Alto',
      fechaApertura: '2026-02-01',
      fechaCierre: null
    });
    expect(lista.items[0].riesgo_codigo).toBeUndefined();
    expect(lista.items[0].factores).toBeUndefined();
    expect(repositorio.AbrirCaso).not.toHaveBeenCalled();
  });

  test('una persona fuera de ámbito no se asocia a la sesión', async () => {
    const repositorio = RepositorioBase();
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio
    });
    await expect(servicio.AsociarSituacion(AccesoOficina(), 3, {
      referenciaId: 99,
      casoId: null
    })).rejects.toMatchObject({ status: 404 });
  });

  test('el caso activo duplicado no revela el expediente', async () => {
    const repositorio = RepositorioBase({
      ListarCatalogo: jest.fn(async () => [
        { cat_item_id: 1, codigo_catalogo: 'ESTRATEGIA', codigo: 'SYN_ACOMPANAMIENTO', etiqueta: 'Acompañar' },
        { cat_item_id: 2, codigo_catalogo: 'DISCIPLINA', codigo: 'SYN_NUTRICION', etiqueta: 'Nutrición' },
        { cat_item_id: 3, codigo_catalogo: 'FRECUENCIA', codigo: 'TRIMESTRAL', etiqueta: 'Trimestral' }
      ]),
      BuscarReferencia: jest.fn(async () => ({
        referencia_id: 8,
        per_id_persona: 'SYN-1100102-01',
        estado: 'PENDIENTE_REVISION'
      })),
      ObtenerResolucion: jest.fn(async () => ({
        decision: 'REQUIERE_AI',
        valoracion_id: 15
      }))
    });
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio
    });
    await expect(servicio.AbrirCaso(AccesoOficina(), {
      referenciaId: 8,
      propositos: ['Acompañar el cuidado'],
      estrategias: [1],
      disciplinas: [2],
      frecuenciaCodigo: 'TRIMESTRAL'
    })).rejects.toMatchObject({
      status: 409,
      message: expect.stringContaining('caso de Atención Interdisciplinaria activo')
    });
  });

  test('detiene la prioridad si la matriz vigente no coincide con RN-009', async () => {
    const filas = MatrizConfirmada();
    filas[0].prioridad_codigo = 'BAJO';
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio: RepositorioBase({
        ListarMatrizVigente: jest.fn(async () => filas)
      })
    });
    await expect(servicio.CalcularPrioridad(AccesoOficina(), {
      riesgoCodigo: 'ALTO',
      proteccionCodigo: 'BAJA'
    })).rejects.toMatchObject({ status: 409 });
  });

  test('la lista de sesiones informa el permiso ausente sin simular cero', async () => {
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio: RepositorioBase({
        ListarSesiones: jest.fn(async () => {
          const error = new Error('permiso');
          error.code = 'PERMISO';
          error.domain = true;
          throw error;
        })
      })
    });
    const lista = await servicio.ListarSesiones(AccesoOficina());
    expect(lista.disponibilidad).toBe('BLOQUEADO');
    expect(lista.total).toBeNull();
    expect(lista.items).toEqual([]);
  });

  test('el resumen no inventa indicadores de módulos ausentes', async () => {
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio: RepositorioBase()
    });
    const resumen = await servicio.ObtenerResumen(AccesoOficina());
    expect(resumen.referenciasPendientes.cantidad).toBe(2);
    expect(resumen.casosActivos.cantidad).toBe(1);
    expect(resumen.posiblesReferencias.disponibilidad).toBe('NO_DISPONIBLE');
    expect(resumen.posiblesReferencias.cantidad).toBeNull();
    expect(resumen.actividadesVencidas.cantidad).toBeNull();
    expect(resumen.proximasAcciones.cantidad).toBeNull();
  });

  test('un cambio de estado inválido se rechaza sin persistir otro resultado', async () => {
    const registrar = jest.fn(async () => {
      const error = new Error('estado');
      error.code = 'ESTADO_INVALIDO';
      error.domain = true;
      throw error;
    });
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio: RepositorioBase({
        BuscarReferencia: jest.fn(async () => ({
          referencia_id: 8,
          estado: 'PENDIENTE_REVISION'
        })),
        ObtenerValoracionEnSesion: jest.fn(async () => ({
          valoracion_id: 4,
          caso_id: null
        })),
        RegistrarResolucion: registrar
      })
    });
    await expect(servicio.RegistrarResolucion(AccesoOficina(), {
      referenciaId: 8,
      sesionId: 2,
      valoracionId: 4,
      decision: 'NO_REQUIERE_AI',
      justificacion: 'El equipo no identifica la necesidad.'
    })).rejects.toMatchObject({ status: 409 });
  });
});
