'use strict';

const { CrearContextoUsuario } = require('../src/infrastructure/auth/user-context');
const { CrearServicioCiclo } = require('../src/modules/ciclo-caso/servicio-ciclo');
const { LeerCoordinacion, LeerCierre } = require('../src/modules/ciclo-caso/validacion-ciclo');

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

function AccesoOtraOficina() {
  return CrearContextoUsuario({
    source: 'SYNTHETIC_DEVELOPMENT',
    principalId: 'dev-oficina-perez-zeledon',
    grants: [{ role: 'OFICINA_LOCAL', regionId: 5, localOfficeId: 501 }]
  });
}

function FilasCatalogo() {
  return [
    {
      cat_item_id: 1,
      codigo_catalogo: 'MOTIVO_CIERRE',
      codigo: 'CIERRE_SATISFACTORIO',
      etiqueta: 'Cierre satisfactorio',
      requiere_texto: 0
    },
    {
      cat_item_id: 2,
      codigo_catalogo: 'MOTIVO_CIERRE',
      codigo: 'TRASLADO',
      etiqueta: 'Traslado',
      requiere_texto: 0
    },
    {
      cat_item_id: 3,
      codigo_catalogo: 'MOTIVO_CIERRE',
      codigo: 'OTRO',
      etiqueta: 'Otro',
      requiere_texto: 1
    }
  ];
}

function Expediente(estado = 'ACTIVO') {
  return {
    casoId: 40,
    identificacion: 'SYN-CICLO',
    nombre: 'No debe copiarse',
    establecimientoId: 1100102,
    establecimientoNombre: 'Establecimiento sintético',
    consecutivo: 'CONS-40',
    estado,
    fechaApertura: '2024-01-01',
    fechaCierre: null,
    contextoIngreso: { encargado: null, relacion: null, contacto: null },
    valoraciones: [],
    planes: [],
    plan: null,
    atenciones: [],
    participacionesGrupales: [],
    historial: [{ estado: 'ACTIVO', ocurridoEn: '2024-01-01 00:00:00' }],
    coordinaciones: { disponibilidad: 'DISPONIBLE', registros: [], cantidad: 0 },
    reportes: { disponibilidad: 'DISPONIBLE', registros: [], cantidad: 0 },
    cierre: { disponibilidad: 'DISPONIBLE', registro: null },
    consultaIndividual: { disponibilidad: 'DISPONIBLE' },
    consultaGrupal: { disponibilidad: 'DISPONIBLE' },
    consultaPlanes: { disponibilidad: 'DISPONIBLE' },
    documentos: { disponibilidad: 'DISPONIBLE', cantidad: 0 }
  };
}

function Servicio(extra = {}) {
  const repositorio = {
    ListarCatalogo: jest.fn(async () => FilasCatalogo()),
    RegistrarCoordinacion: jest.fn(),
    RegistrarReporte: jest.fn(),
    CerrarCaso: jest.fn(),
    ...extra.repositorio
  };
  const proceso = {
    ObtenerCaso: jest.fn(async () => Expediente()),
    ...extra.proceso
  };
  const adaptador = {
    BuscarEstablecimiento: jest.fn(async (id) => (
      id === 1190108 ? { establishmentId: 1190108, localOfficeId: 501, regionId: 5 } : null
    )),
    ...extra.adaptador
  };
  return {
    servicio: CrearServicioCiclo({ repositorio, proceso, adaptador }),
    repositorio,
    proceso,
    adaptador
  };
}

describe('servicio del ciclo del caso', () => {
  test('el establecimiento no coordina, no reporta y no cierra', async () => {
    const { servicio, repositorio } = Servicio();
    const acceso = AccesoEstablecimiento();
    await expect(servicio.RegistrarCoordinacion(acceso, {
      casoId: 40,
      institucionItemId: null,
      institucionTexto: 'Centro',
      profesional: null,
      fecha: '2026-11-16',
      motivo: 'Consulta',
      estadoItemId: null,
      estadoTexto: 'Realizada',
      claveOperacion: 'clave-coord-01'
    })).rejects.toMatchObject({ status: 403 });
    await expect(servicio.CerrarCaso(acceso, {
      casoId: 40,
      motivoItemId: 1,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-01'
    })).rejects.toMatchObject({ status: 403 });
    expect(repositorio.RegistrarCoordinacion).not.toHaveBeenCalled();
    expect(repositorio.CerrarCaso).not.toHaveBeenCalled();
  });

  test('rechaza una coordinación incompleta antes de persistir', () => {
    expect(() => LeerCoordinacion({
      casoId: 40,
      fecha: '2026-11-16',
      institucionTexto: 'Centro'
    })).toThrow(expect.objectContaining({ status: 400 }));
  });

  test('registra la coordinación con texto cuando no hay catálogo de instituciones', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.RegistrarCoordinacion.mockResolvedValue({
      repetida: false,
      estadoCaso: 'ACTIVO',
      coordinacion: { coordinacionId: 9, institucion: 'Centro de salud' }
    });
    const resultado = await servicio.RegistrarCoordinacion(AccesoOficina(), {
      casoId: 40,
      institucionItemId: null,
      institucionTexto: 'Centro de salud',
      profesional: 'Otra persona',
      fecha: '2026-11-16',
      motivo: 'Consulta conjunta',
      estadoItemId: null,
      estadoTexto: 'Realizada',
      claveOperacion: 'clave-coord-01'
    });
    expect(resultado.coordinacion.coordinacionId).toBe(9);
    expect(repositorio.RegistrarCoordinacion).toHaveBeenCalledWith(
      expect.objectContaining({
        institucionItemId: null,
        institucionTexto: 'Centro de salud',
        profesional: 'Otra persona',
        usuario: 'dev-oficina-hatillo'
      })
    );
  });

  test('la misma clave devuelve la coordinación ya registrada', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.RegistrarCoordinacion.mockResolvedValue({
      repetida: true,
      estadoCaso: 'ACTIVO',
      coordinacion: { coordinacionId: 9 }
    });
    const resultado = await servicio.RegistrarCoordinacion(AccesoOficina(), {
      casoId: 40,
      institucionItemId: null,
      institucionTexto: 'Centro de salud',
      profesional: null,
      fecha: '2026-11-16',
      motivo: 'Consulta conjunta',
      estadoItemId: null,
      estadoTexto: 'Realizada',
      claveOperacion: 'clave-coord-01'
    });
    expect(resultado.repetida).toBe(true);
    expect(resultado.coordinacion.coordinacionId).toBe(9);
  });

  test('conserva el reporte sin pedir el cierre y sin copiar el nombre vigente', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.RegistrarReporte.mockResolvedValue({
      repetida: false,
      estadoCaso: 'ACTIVO',
      reporte: {
        reporteId: 4,
        tipoProposito: 'Informe de avance',
        fecha: '2026-11-16',
        responsable: 'dev-oficina-hatillo',
        motivo: null,
        conservacion: 'METADATOS'
      }
    });
    const resultado = await servicio.RegistrarReporte(AccesoOficina(), {
      casoId: 40,
      tipoProposito: 'Informe de avance',
      motivo: null,
      claveOperacion: 'clave-reporte-01'
    });
    expect(repositorio.CerrarCaso).not.toHaveBeenCalled();
    expect(resultado.estadoCaso).toBe('ACTIVO');
    expect(resultado.estadoModificado).toBe(false);
    expect(resultado.reporte.conservacion).toBe('METADATOS');
    const texto = resultado.vista.secciones
      .flatMap((seccion) => seccion.parrafos)
      .join(' ');
    expect(texto).not.toContain('No debe copiarse');
    expect(texto).toContain('SYN-CICLO');
    expect(resultado.vista.plantilla).toBe('PROVISIONAL');
    expect(resultado.vista.origen).toBe('INFORMACION_VIGENTE');
  });

  test('no conserva el reporte si el expediente no puede leerse completo', async () => {
    const { servicio, repositorio, proceso } = Servicio();
    proceso.ObtenerCaso.mockResolvedValue({
      ...Expediente(),
      reportes: { disponibilidad: 'BLOQUEADO', registros: [], cantidad: null }
    });
    await expect(servicio.RegistrarReporte(AccesoOficina(), {
      casoId: 40,
      tipoProposito: 'Informe de avance',
      motivo: null,
      claveOperacion: 'clave-reporte-01'
    })).rejects.toMatchObject({ status: 503 });
    expect(repositorio.RegistrarReporte).not.toHaveBeenCalled();
  });

  test('el reintento del reporte conserva el tipo ya guardado', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.RegistrarReporte.mockResolvedValue({
      repetida: true,
      estadoCaso: 'ACTIVO',
      reporte: {
        reporteId: 4,
        tipoProposito: 'Informe original',
        conservacion: 'METADATOS'
      }
    });
    const resultado = await servicio.RegistrarReporte(AccesoOficina(), {
      casoId: 40,
      tipoProposito: 'Otro texto enviado después',
      motivo: null,
      claveOperacion: 'clave-reporte-01'
    });
    expect(resultado.repetida).toBe(true);
    expect(resultado.reporte.tipoProposito).toBe('Informe original');
  });

  test('cierra de forma satisfactoria sin explicación y sin reporte previo', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.CerrarCaso.mockResolvedValue({
      repetida: false,
      cierre: {
        motivoCodigo: 'CIERRE_SATISFACTORIO',
        motivoEtiqueta: 'Cierre satisfactorio',
        casoDestinoCreado: false
      }
    });
    const resultado = await servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 1,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-01'
    });
    expect(repositorio.RegistrarReporte).not.toHaveBeenCalled();
    expect(resultado.efecto).toBe('CIERRE');
    expect(resultado.casoDestinoCreado).toBe(false);
    expect(repositorio.CerrarCaso).toHaveBeenCalledWith(expect.objectContaining({
      explicacion: null,
      destinoEstablecimientoId: null
    }));
  });

  test('el motivo Otro exige explicación y el satisfactorio no la acepta', async () => {
    const { servicio, repositorio } = Servicio();
    await expect(servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 3,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-02'
    })).rejects.toMatchObject({ status: 400 });
    await expect(servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 1,
      explicacion: 'No corresponde',
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-03'
    })).rejects.toMatchObject({ status: 400 });
    expect(repositorio.CerrarCaso).not.toHaveBeenCalled();
  });

  test('el traslado cierra el origen, toma el destino de la fuente y no crea caso', async () => {
    const { servicio, repositorio, adaptador } = Servicio();
    repositorio.CerrarCaso.mockResolvedValue({
      repetida: false,
      cierre: {
        motivoCodigo: 'TRASLADO',
        motivoEtiqueta: 'Traslado',
        destinoEstablecimientoId: 1190108,
        destinoOficinaLocalId: 501,
        destinoRegionId: 5,
        casoDestinoCreado: false
      }
    });
    const resultado = await servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 2,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: 1190108,
      destinoNombre: 'Destino sintético',
      claveOperacion: 'clave-traslado-01'
    });
    expect(adaptador.BuscarEstablecimiento).toHaveBeenCalledWith(1190108);
    expect(repositorio.CerrarCaso).toHaveBeenCalledWith(expect.objectContaining({
      accion: 'TRASLADO',
      destinoOficinaLocalId: 501,
      destinoRegionId: 5,
      destinoNombre: 'Destino sintético'
    }));
    expect(resultado.efecto).toBe('TRASLADO');
    expect(resultado.casoDestinoCreado).toBe(false);
    expect(resultado.mensaje).toContain('No se creó un caso');
  });

  test('rechaza traslado sin destino y destino en un cierre satisfactorio', async () => {
    const { servicio, repositorio } = Servicio();
    await expect(servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 2,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-traslado-02'
    })).rejects.toMatchObject({ status: 400 });
    await expect(servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 1,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: 'Otro lugar',
      claveOperacion: 'clave-cierre-04'
    })).rejects.toMatchObject({ status: 400 });
    expect(repositorio.CerrarCaso).not.toHaveBeenCalled();
  });

  test('un caso ajeno o ya cerrado no confirma otro cierre', async () => {
    const { servicio, repositorio } = Servicio();
    const noEncontrado = new Error('no');
    noEncontrado.domain = true;
    noEncontrado.code = 'NO_ENCONTRADO';
    const cerrado = new Error('cerrado');
    cerrado.domain = true;
    cerrado.code = 'CASO_NO_ACTIVO';
    repositorio.CerrarCaso
      .mockRejectedValueOnce(noEncontrado)
      .mockRejectedValueOnce(cerrado);
    const solicitud = {
      casoId: 40,
      motivoItemId: 1,
      explicacion: null,
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-05'
    };
    await expect(servicio.CerrarCaso(AccesoOtraOficina(), solicitud)).rejects.toMatchObject({
      status: 404
    });
    await expect(servicio.CerrarCaso(AccesoOficina(), {
      ...solicitud,
      claveOperacion: 'clave-cierre-06'
    })).rejects.toMatchObject({ status: 409 });
  });

  test('la segunda confirmación con la misma clave devuelve el cierre guardado', async () => {
    const { servicio, repositorio } = Servicio();
    repositorio.CerrarCaso.mockResolvedValue({
      repetida: true,
      cierre: {
        motivoCodigo: 'OTRO',
        motivoEtiqueta: 'Otro',
        casoDestinoCreado: false
      }
    });
    const resultado = await servicio.CerrarCaso(AccesoOficina(), {
      casoId: 40,
      motivoItemId: 3,
      explicacion: 'La familia cambió de domicilio.',
      fechaCierre: '2026-11-16',
      destinoEstablecimientoId: null,
      destinoNombre: null,
      claveOperacion: 'clave-cierre-07'
    });
    expect(resultado.repetida).toBe(true);
    expect(resultado.efecto).toBe('CIERRE');
  });

  test('no acepta que el cliente envíe la oficina de destino', () => {
    expect(() => LeerCierre({
      casoId: 40,
      motivoItemId: 2,
      fechaCierre: '2026-11-16',
      destinoOficinaLocalId: 501,
      claveOperacion: 'clave-traslado-03'
    })).toThrow(expect.objectContaining({ status: 400 }));
  });
});
