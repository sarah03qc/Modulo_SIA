'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioProceso } = require(
  '../src/modules/proceso-interdisciplinario/servicio-proceso'
);
const { LeerValoracion } = require(
  '../src/modules/proceso-interdisciplinario/validacion-proceso'
);

function ErrorPermiso() {
  const error = new Error('permiso');
  error.code = 'PERMISO';
  error.domain = true;
  return error;
}

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
    ContarAtencionesAmbito: jest.fn(async () => {
      throw ErrorPermiso();
    }),
    ListarProximasAcciones: jest.fn(async () => {
      throw ErrorPermiso();
    }),
    ContarActividadesVencidas: jest.fn(async () => {
      throw ErrorPermiso();
    }),
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
    expect(resumen.actividadesVencidas.disponibilidad).toBe('BLOQUEADO');
    expect(resumen.actividadesVencidas.cantidad).toBeNull();
    expect(resumen.proximasAcciones.disponibilidad).toBe('BLOQUEADO');
    expect(resumen.proximasAcciones.cantidad).toBeNull();
    expect(resumen.atencionesRegistradas.disponibilidad).toBe('BLOQUEADO');
    expect(resumen.atencionesRegistradas.cantidad).toBeNull();
  });

  test('el resumen regional calcula el ámbito y no anuncia un lote pendiente', async () => {
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {
        BuscarRegion: jest.fn(async () => ({ name: 'Región Central Sur' })),
        ListarOficinasLocales: jest.fn(async () => [
          { localOfficeId: 101, name: 'Hatillo' }
        ])
      },
      repositorio: RepositorioBase({
        ListarDistribucion: jest.fn(async () => [{ clave: 101, cantidad: 1 }]),
        ContarActividadesVencidasAmbito: jest.fn(async () => 0)
      })
    });
    const acceso = CrearContextoUsuario({
      source: 'SYNTHETIC_DEVELOPMENT',
      principalId: 'dev-region-central-sur',
      grants: [{ role: 'REGION', regionId: 1 }]
    });
    const resumen = await servicio.ObtenerResumen(acceso);
    expect(resumen.mensaje).toBeUndefined();
    expect(resumen.casosActivos.cantidad).toBe(1);
    expect(resumen.etiquetaAmbito).toBe('Región Central Sur');
    expect(resumen.distribucion.filas[0].nombre).toBe('Hatillo');
    expect(resumen.distribucion.filas[0].casosActivos).toBe(1);
    expect(resumen.posiblesReferencias).toBeUndefined();
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

  test('Ninguno no puede convivir con factores de la misma categoría', () => {
    expect(() => LeerValoracion({
      situacionId: 1,
      riesgoCodigo: 'ALTO',
      proteccionCodigo: 'BAJA',
      categorias: [{
        categoriaId: 1,
        respuesta: 'NINGUNO',
        factores: [{ factorId: 2, especificacion: '' }]
      }]
    })).toThrow(/Ninguno/);
  });

  test('una categoría requerida sin respuesta impide confirmar la valoración', async () => {
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: {},
      repositorio: RepositorioBase({
        ObtenerSituacion: jest.fn(async () => ({
          situacion_id: 1,
          referencia_id: 8,
          caso_id: null,
          fecha: '2026-11-16'
        })),
        BuscarReferencia: jest.fn(async () => ({
          referencia_id: 8,
          estado: 'PENDIENTE_REVISION'
        })),
        ListarInstrumentoVigente: jest.fn(async () => [{
          instrumento_version_id: 1,
          numero_version: 1,
          categoria_id: 10,
          eje: 'RIESGO',
          ambito: 'INDIVIDUAL',
          es_requerida: 1,
          orden_categoria: 1,
          factor_id: 100,
          codigo: 'F1',
          etiqueta: 'Factor uno',
          es_abierto: 0
        }])
      })
    });
    await expect(servicio.RegistrarValoracion(AccesoOficina(), {
      situacionId: 1,
      riesgoCodigo: 'BAJO',
      proteccionCodigo: 'ALTA',
      categorias: [],
      abordaje: null
    })).rejects.toMatchObject({ status: 400 });
  });

  test('la exportación entrega el corte completo y rechaza un total que no cabe', async () => {
    const filas = [{
      caso_id: 4,
      per_id_persona: 'SYN-1100102-01',
      establecimiento_id: 1100102,
      estado: 'ACTIVO',
      prioridad_codigo: 'ALTO',
      fecha_apertura: '2026-02-01',
      fecha_cierre: null
    }];
    const listar = jest.fn(async (consulta) => ({
      total: consulta.tamano === 1 ? 1 : 1,
      filas: consulta.tamano === 1 ? filas.slice(0, 1) : filas
    }));
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: { BuscarPersonaEnAmbito: jest.fn(async () => []) },
      repositorio: RepositorioBase({ ListarCasos: listar })
    });
    const consulta = {
      pagina: 1,
      tamano: 20,
      desplazamiento: 0,
      estado: 'ACTIVO',
      prioridad: 'ALTO',
      identificacion: null,
      nombre: null,
      establecimientoId: null
    };
    const archivo = await servicio.ExportarCasos(AccesoOficina(), consulta);
    expect(archivo.total).toBe(1);
    expect(archivo.contenido.split('\n')).toHaveLength(2);
    listar.mockImplementation(async () => ({ total: 2001, filas: [] }));
    await expect(servicio.ExportarCasos(AccesoOficina(), consulta)).rejects.toMatchObject({
      status: 400
    });
  });

  test('el expediente incorpora coordinación, reporte y traslado persistidos', async () => {
    const servicio = CrearServicioProceso({
      periodId: '2026',
      adaptador: { BuscarPersonaEnAmbito: jest.fn(async () => []) },
      repositorio: {
        ObtenerDetalleCaso: jest.fn(async () => ({
          caso: {
            caso_id: 50,
            per_id_persona: 'SYN-CICLO',
            estado: 'CERRADO',
            fecha_apertura: '2024-01-01',
            establecimiento_id: 1100102,
            consecutivo_origen: 'CONS-50',
            encargado_nombre: null,
            relacion_encargado: null,
            contacto: null,
            direccion: null,
            establecimiento_nombre: 'Establecimiento sintético'
          },
          valoraciones: [],
          factores: [],
          historial: [
            { estado: 'ACTIVO', ocurrido_en: '2024-01-01 00:00:00' },
            { estado: 'CERRADO', ocurrido_en: '2026-11-16 00:00:00' }
          ],
          plan: null
        })),
        ObtenerUltimaAtencion: jest.fn(async () => null),
        ListarAtencionesIndividuales: jest.fn(async () => []),
        ListarParticipacionesGrupales: jest.fn(async () => []),
        ListarPlanesCaso: jest.fn(async () => []),
        ContarDocumentosCaso: jest.fn(async () => 0),
        ListarCoordinacionesCaso: jest.fn(async () => [{
          coordinacion_id: 7,
          institucion_texto: 'Centro de salud',
          profesional_responsable: 'Profesional declarado',
          digitador_usuario: 'dev-oficina-hatillo',
          motivo: 'Seguimiento',
          fecha_coordinacion: '2026-11-01',
          estado_texto: 'Realizada'
        }, {
          coordinacion_id: 8,
          institucion_texto: 'Centro de salud',
          profesional_responsable: 'Profesional declarado',
          digitador_usuario: 'dev-oficina-hatillo',
          motivo: 'Otro seguimiento',
          fecha_coordinacion: '2026-11-01',
          estado_texto: 'Realizada'
        }]),
        ListarReportesCaso: jest.fn(async () => [{
          reporte_id: 3,
          tipo_proposito: 'Informe de avance',
          fecha_reporte: '2026-11-02',
          responsable_usuario: 'dev-oficina-hatillo',
          motivo: null,
          creado_en: '2026-11-02 10:00:00'
        }]),
        ObtenerCierreCaso: jest.fn(async () => ({
          motivo_codigo: 'TRASLADO',
          motivo_etiqueta: 'Traslado',
          explicacion: null,
          fecha_cierre: '2026-11-16',
          responsable_usuario: 'dev-oficina-hatillo',
          destino_establecimiento_id: 1190108,
          destino_oficina_local_id: 501,
          destino_region_id: 5,
          destino_nombre: 'Destino sintético'
        }))
      }
    });
    const expediente = await servicio.ObtenerCaso(AccesoOficina(), 50);
    const tipos = expediente.lineaTiempo.map((evento) => evento.tipo);
    const claves = expediente.lineaTiempo.map((evento) => evento.clave);
    expect(new Set(claves).size).toBe(claves.length);
    expect(tipos).toEqual(expect.arrayContaining([
      'COORDINACION',
      'REPORTE',
      'TRASLADO',
      'ESTADO'
    ]));
    expect(expediente.cierre.registro.casoDestinoCreado).toBe(false);
    expect(expediente.fechaCierre).toBe('2026-11-16');
    expect(expediente.reportes.registros[0].conservacion).toBe('METADATOS');
    expect(expediente.pendientes).not.toContain(
      'Traslados y reportes internos no forman parte de este incremento.'
    );
  });
});
