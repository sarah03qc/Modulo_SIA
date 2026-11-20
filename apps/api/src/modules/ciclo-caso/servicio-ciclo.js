/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-027, HU-028, HU-030 y HU-031. HU-029 no se implementa.
 * El traslado cierra el caso de origen y no abre otro caso.
 * El reporte no cambia el estado. La plantilla oficial sigue pendiente.
 */
'use strict';

const path = require('path');
const { FechaCalendarioLocal } = require('../../common/fecha-local');
const { CrearAlmacenDocumentos } = require('./almacen-documentos');
const { CrearPdfTexto } = require('./pdf-texto');
const {
  ErrorConflicto,
  ErrorInfraestructura,
  ErrorNoEncontrado,
  ErrorProhibido,
  ErrorValidacion
} = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');

const NO_ENCONTRADO = 'El recurso solicitado no existe.';
const INTENTOS = 3;
const CODIGO_TRASLADO = 'TRASLADO';
const AVISO_PLANTILLA = 'Presentación provisional para consulta e impresión. '
  + 'No es la plantilla institucional definitiva. '
  + 'La vista se arma con la información vigente del expediente; '
  + 'el reporte conservado solo guarda fecha, tipo, responsable y motivo.';
const NOTA_REPORTE = 'Este registro conserva fecha, tipo, responsable y motivo. '
  + 'No congela el texto. La vista se vuelve a armar con la información vigente.';

function FechaHoy() {
  return FechaCalendarioLocal();
}

function TraducirPersistencia(error, mensajes) {
  if (error && error.expose === true) {
    throw error;
  }
  if (error && error.code === 'NO_ENCONTRADO') {
    throw new ErrorNoEncontrado(NO_ENCONTRADO);
  }
  if (error && error.code === 'CASO_NO_ACTIVO') {
    throw new ErrorConflicto(mensajes.cerrado);
  }
  if (error && error.code === 'CLAVE_AJENA') {
    throw new ErrorConflicto('La clave de la operación ya se usó en otro caso.');
  }
  if (error && error.code === 'FECHA') {
    throw new ErrorValidacion('La fecha no puede ser anterior a la apertura del caso.');
  }
  if (error && error.code === 'DESTINO') {
    throw new ErrorValidacion('El destino debe ser distinto del establecimiento de origen.');
  }
      if (error && (error.code === 'DATOS' || error.code === 'MOTIVO')) {
    throw new ErrorValidacion('Los datos no cumplen las condiciones del registro.');
  }
  if (error && error.code === 'DUPLICADO') {
    throw new ErrorConflicto('La operación ya fue registrada.');
  }
  if (error && error.code === 'PERMISO') {
    throw new ErrorInfraestructura(mensajes.permiso);
  }
  if (error && error.code === 'INTERBLOQUEO') {
    return 'REINTENTAR';
  }
  if (error instanceof ErrorInfraestructura) {
    throw error;
  }
  throw new ErrorInfraestructura('La operación de base de datos no se completó.');
}

async function Reintentar(operacion, mensajes) {
  for (let intento = 1; intento <= INTENTOS; intento += 1) {
    try {
      return await operacion();
    } catch (error) {
      const traduccion = TraducirPersistencia(error, mensajes);
      if (traduccion === 'REINTENTAR' && intento < INTENTOS) {
        continue;
      }
      if (traduccion === 'REINTENTAR') {
        throw new ErrorConflicto(
          'La operación no pudo confirmarse por concurrencia. Intente de nuevo.'
        );
      }
    }
  }
  throw new ErrorInfraestructura('La operación de base de datos no se completó.');
}

function ExigirOficina(acceso, capacidad) {
  ExigirCapacidad(acceso, capacidad);
  if (!acceso || acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
    throw new ErrorProhibido('La operación no está permitida.');
  }
  if (!Number.isInteger(acceso.localOfficeId) || !Number.isInteger(acceso.regionId)) {
    throw new ErrorProhibido('La operación no está permitida.');
  }
  if (!acceso.principalId || acceso.principalId.length > 128) {
    throw new ErrorProhibido('La identidad de la sesión no puede usarse como responsable.');
  }
}

function RegistroBase(acceso, solicitud) {
  return {
    casoId: solicitud.casoId,
    usuario: acceso.principalId,
    rol: acceso.accessLevel,
    oficinaLocalId: acceso.localOfficeId,
    regionId: acceso.regionId,
    claveOperacion: solicitud.claveOperacion,
    ambito: `oficina:${acceso.localOfficeId};region:${acceso.regionId};`
      + `caso:${solicitud.casoId}`
  };
}

function PresentarCatalogo(filas, codigo, vacio) {
  const items = filas
    .filter((fila) => fila.codigo_catalogo === codigo)
    .map((fila) => ({
      itemId: Number(fila.cat_item_id),
      codigo: fila.codigo,
      etiqueta: fila.etiqueta,
      requiereTexto: fila.requiere_texto === true || fila.requiere_texto === 1,
      ambito: fila.ambito || null
    }));
  if (items.length === 0) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      items: [],
      mensaje: vacio
    };
  }
  return { disponibilidad: 'DISPONIBLE', items };
}

function ResolverTexto(catalogo, itemId, texto, etiqueta) {
  if (catalogo.disponibilidad === 'DISPONIBLE') {
    const item = catalogo.items.find((entrada) => entrada.itemId === itemId);
    if (!item) {
      throw new ErrorValidacion(`Seleccione ${etiqueta} del catálogo vigente.`);
    }
    return { itemId: item.itemId, texto: item.etiqueta };
  }
  if (itemId !== null) {
    throw new ErrorValidacion(
      `No hay un catálogo vigente de ${etiqueta}. Registre el texto.`
    );
  }
  if (!texto) {
    throw new ErrorValidacion(`Indique ${etiqueta}.`);
  }
  return { itemId: null, texto };
}

function Lineas(valores) {
  return valores.length > 0 ? valores : ['Sin registros.'];
}

function TextoDestino(cierre) {
  if (cierre.destinoNombre) {
    return cierre.destinoNombre;
  }
  if (cierre.destinoEstablecimientoId) {
    return `establecimiento ${cierre.destinoEstablecimientoId}`;
  }
  return 'sin nombre adicional';
}

/**
 * Arma la vista provisional solo con datos ya persistidos del expediente.
 * No copia el nombre vigente de la fuente institucional.
 *
 * @param {object} expediente Expediente autorizado.
 * @returns {object} Secciones para consulta e impresión.
 */
function ArmarVista(expediente) {
  const ingreso = expediente.contextoIngreso || {};
  const cierre = expediente.cierre && expediente.cierre.registro
    ? expediente.cierre.registro
    : null;
  const plan = expediente.plan;
  return {
    plantilla: 'PROVISIONAL',
    estadoPlantilla: 'NEEDS_VALIDATION',
    origen: 'INFORMACION_VIGENTE',
    aviso: AVISO_PLANTILLA,
    casoId: expediente.casoId,
    estadoCaso: expediente.estado,
    fechaVista: FechaHoy(),
    secciones: [
      {
        titulo: 'Identificación del caso',
        parrafos: [
          `Caso ${expediente.casoId}.`,
          `Identificación institucional registrada: ${expediente.identificacion}.`,
          `Consecutivo de origen: ${expediente.consecutivo}.`,
          'Establecimiento registrado: '
            + `${expediente.establecimientoNombre || expediente.establecimientoId}.`,
          `Estado: ${expediente.estado}. Apertura: ${expediente.fechaApertura}.`,
          expediente.fechaCierre ? `Fecha de cierre: ${expediente.fechaCierre}.` : null,
          'El nombre vigente de la fuente institucional no forma parte de esta vista.'
        ].filter(Boolean)
      },
      {
        titulo: 'Contexto de ingreso registrado',
        parrafos: [
          `Encargado: ${ingreso.encargado || 'No registrado'}.`,
          `Relación: ${ingreso.relacion || 'No registrada'}.`,
          `Contacto: ${ingreso.contacto || 'No registrado'}.`
        ]
      },
      {
        titulo: 'Valoraciones',
        parrafos: Lineas((expediente.valoraciones || []).map((item) => (
          `${item.fecha} — valoración ${item.numero}. `
          + `Prioridad ${item.prioridadEtiqueta}. `
          + `Riesgo ${item.riesgoCodigo}. Protección ${item.proteccionCodigo}. `
          + `${item.vigente ? 'Vigente' : 'Histórica'}. ${item.responsable}.`
        )))
      },
      {
        titulo: 'Planes',
        parrafos: Lineas([
          ...(expediente.planes || []).map((item) => (
            `Versión ${item.numero} — ${item.fecha}. ${item.frecuenciaEtiqueta}. `
            + `${item.vigente ? 'Vigente' : 'Histórica'}. ${item.responsable}.`
          )),
          plan ? `Propósitos del plan vigente: ${plan.propositos.join('; ')}.` : null
        ].filter(Boolean))
      },
      {
        titulo: 'Atenciones individuales',
        parrafos: Lineas((expediente.atenciones || []).map((item) => (
          `${item.fechaAtencion}. ${item.profesional}. ${item.acciones}`
        )))
      },
      {
        titulo: 'Participaciones grupales',
        parrafos: Lineas((expediente.participacionesGrupales || []).map((item) => {
          const asistencia = item.asistio === true
            ? 'asistió'
            : (item.asistio === false ? 'no asistió' : 'asistencia no registrada');
          return `${item.fechaAtencion}. ${item.tema}. ${asistencia}.`;
        }))
      },
      {
        titulo: 'Coordinaciones',
        parrafos: Lineas(((expediente.coordinaciones && expediente.coordinaciones.registros) || []).map((item) => (
          `${item.fecha}. ${item.institucion}. Estado ${item.estado}. `
          + `Profesional ${item.profesional}. Motivo: ${item.motivo}.`
        )))
      },
      {
        titulo: 'Reportes conservados',
        parrafos: Lineas(((expediente.reportes && expediente.reportes.registros) || []).map((item) => (
          `${item.fecha}. ${item.tipoProposito}. Responsable ${item.responsable}. `
          + 'Conserva metadatos, no el texto de una vista anterior.'
        )))
      },
      {
        titulo: 'Cierre o traslado',
        parrafos: cierre
          ? [
            cierre.motivoCodigo === CODIGO_TRASLADO
              ? `Traslado el ${cierre.fecha}. Destino: ${TextoDestino(cierre)}. `
                + 'No se creó un caso en el destino.'
              : `Cierre el ${cierre.fecha}. Motivo: ${cierre.motivoEtiqueta}.`,
            `Responsable: ${cierre.responsable}.`
          ]
          : ['Sin cierre registrado.']
      },
      {
        titulo: 'Historial de estado',
        parrafos: Lineas((expediente.historial || []).map((item) => (
          `${item.ocurridoEn} — ${item.estado}`
        )))
      },
      {
        titulo: 'Documentos',
        parrafos: [
          `Documentos registrados: ${expediente.documentos ? expediente.documentos.cantidad : 0}.`
        ]
      }
    ]
  };
}

function LecturasIncompletas(expediente) {
  const lecturas = [
    ['coordinaciones', expediente.coordinaciones],
    ['reportes', expediente.reportes],
    ['cierre', expediente.cierre],
    ['atenciones individuales', expediente.consultaIndividual],
    ['participaciones grupales', expediente.consultaGrupal],
    ['planes', expediente.consultaPlanes],
    ['documentos', expediente.documentos]
  ];
  return lecturas
    .filter((entrada) => !entrada[1] || entrada[1].disponibilidad !== 'DISPONIBLE')
    .map((entrada) => entrada[0]);
}

/**
 * Servicio del ciclo. La autorización y el ámbito se vuelven a comprobar aquí.
 *
 * @param {object} dependencias Repositorio, adaptador y servicio de expediente.
 * @returns {object} Operaciones del ciclo.
 */
function CrearServicioCiclo(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;
  const proceso = dependencias.proceso;
  const almacen = dependencias.almacen || CrearAlmacenDocumentos(
    dependencias.directorioDocumentos
      || path.join(__dirname, '../../../var/documentos-caso')
  );

  async function Catalogos() {
    let filas;
    try {
      filas = await repositorio.ListarCatalogo([
        'MOTIVO_CIERRE',
        'INSTITUCION_COORDINACION',
        'ESTADO_COORDINACION',
        'MODALIDAD_COORDINACION'
      ]);
    } catch (error) {
      const traduccion = TraducirPersistencia(error, {
        permiso: 'Los catálogos del ciclo no están disponibles para la cuenta técnica actual.',
        cerrado: 'La operación no está disponible.'
      });
      if (traduccion === 'REINTENTAR') {
        throw new ErrorConflicto(
          'La operación no pudo confirmarse por concurrencia. Intente de nuevo.'
        );
      }
      throw new ErrorInfraestructura('La operación de base de datos no se completó.');
    }
    return {
      motivosCierre: PresentarCatalogo(
        filas,
        'MOTIVO_CIERRE',
        'No hay motivos vigentes de cierre. No se inventan motivos.'
      ),
      instituciones: PresentarCatalogo(
        filas,
        'INSTITUCION_COORDINACION',
        'No hay un catálogo vigente de instituciones. Se registra el texto indicado.'
      ),
      estadosCoordinacion: PresentarCatalogo(
        filas,
        'ESTADO_COORDINACION',
        'No hay un catálogo vigente de estados. Se registra el texto indicado.'
      ),
      modalidades: PresentarCatalogo(
        filas,
        'MODALIDAD_COORDINACION',
        'No hay un catálogo vigente de modalidades. Indique la actuación en el motivo.'
      ),
      plantillaReporte: 'PROVISIONAL'
    };
  }

  async function ConsultarVista(acceso, casoId) {
    ExigirOficina(acceso, CAPABILITY.CASE_REPORT_WRITE);
    if (!proceso || typeof proceso.ObtenerCaso !== 'function') {
      throw new ErrorInfraestructura('El expediente no está disponible.');
    }
    const expediente = await proceso.ObtenerCaso(acceso, casoId);
    const faltantes = LecturasIncompletas(expediente);
    if (faltantes.length > 0) {
      throw new ErrorInfraestructura(
        'La vista del reporte no está disponible para la cuenta técnica actual. '
        + `Falta: ${faltantes.join(', ')}.`
      );
    }
    return ArmarVista(expediente);
  }

  async function ResolverDestino(motivo, solicitud) {
    const pideDestino = solicitud.destinoEstablecimientoId !== null
      || solicitud.destinoNombre !== null;
    if (motivo.codigo !== CODIGO_TRASLADO) {
      if (pideDestino) {
        throw new ErrorValidacion('El destino solo corresponde al motivo de traslado.');
      }
      return {
        destinoEstablecimientoId: null,
        destinoOficinaLocalId: null,
        destinoRegionId: null,
        destinoNombre: null,
        accion: 'CIERRE'
      };
    }
    if (!pideDestino) {
      throw new ErrorValidacion('El traslado requiere un destino disponible.');
    }
    if (solicitud.destinoEstablecimientoId === null) {
      return {
        destinoEstablecimientoId: null,
        destinoOficinaLocalId: null,
        destinoRegionId: null,
        destinoNombre: solicitud.destinoNombre,
        accion: 'TRASLADO'
      };
    }
    if (!adaptador || typeof adaptador.BuscarEstablecimiento !== 'function') {
      throw new ErrorInfraestructura('La fuente institucional no está disponible.');
    }
    let establecimiento;
    try {
      establecimiento = await adaptador.BuscarEstablecimiento(
        solicitud.destinoEstablecimientoId
      );
    } catch (error) {
      if (error && error.expose === true) {
        throw error;
      }
      throw new ErrorInfraestructura('La fuente institucional no está disponible.');
    }
    if (!establecimiento) {
      throw new ErrorValidacion(
        'El establecimiento de destino no está disponible en la fuente institucional.'
      );
    }
    return {
      destinoEstablecimientoId: establecimiento.establishmentId,
      destinoOficinaLocalId: establecimiento.localOfficeId,
      destinoRegionId: establecimiento.regionId,
      destinoNombre: solicitud.destinoNombre,
      accion: 'TRASLADO'
    };
  }

  function PresentarCierre(resultado) {
    const efecto = resultado.cierre.motivoCodigo === CODIGO_TRASLADO
      ? 'TRASLADO'
      : 'CIERRE';
    return {
      repetida: resultado.repetida === true,
      efecto,
      casoDestinoCreado: false,
      estadoCaso: 'CERRADO',
      mensaje: efecto === 'TRASLADO'
        ? 'El traslado cerró el caso de origen. No se creó un caso en el destino.'
        : 'El caso quedó cerrado. Generar un reporte no era requisito.',
      cierre: resultado.cierre
    };
  }

  return {
    async ListarCatalogos(acceso) {
      ExigirOficina(acceso, CAPABILITY.CASE_READ);
      if (acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      const puede = [
        CAPABILITY.COORDINATION_WRITE,
        CAPABILITY.CASE_REPORT_WRITE,
        CAPABILITY.CASE_CLOSE
      ].some((capacidad) => acceso.capabilities.includes(capacidad));
      if (!puede) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      try {
        return await Catalogos();
      } catch (error) {
        return TraducirPersistencia(error, {
          permiso: 'Los catálogos del ciclo no están disponibles para la cuenta técnica actual.',
          cerrado: 'La operación no está disponible.'
        });
      }
    },

    async RegistrarCoordinacion(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.COORDINATION_WRITE);
      const catalogos = await Catalogos();
      const institucion = ResolverTexto(
        catalogos.instituciones,
        solicitud.institucionItemId,
        solicitud.institucionTexto,
        'la institución'
      );
      const itemInstitucion = institucion.itemId === null
        ? null
        : catalogos.instituciones.items.find((item) => item.itemId === institucion.itemId);
      if (itemInstitucion && itemInstitucion.requiereTexto && !solicitud.institucionTexto) {
        throw new ErrorValidacion('Indique el nombre de la institución.');
      }
      const textoInstitucion = itemInstitucion && itemInstitucion.requiereTexto
        ? solicitud.institucionTexto
        : institucion.texto;
      const modalidadId = solicitud.modalidadItemId === undefined
        ? null
        : solicitud.modalidadItemId;
      const modalidad = catalogos.modalidades.disponibilidad === 'DISPONIBLE'
        || modalidadId !== null
        ? ResolverTexto(catalogos.modalidades, modalidadId, null, 'la modalidad')
        : { itemId: null, texto: null };
      const estado = ResolverTexto(
        catalogos.estadosCoordinacion,
        solicitud.estadoItemId,
        solicitud.estadoTexto,
        'el estado'
      );
      const itemEstado = estado.itemId === null
        ? null
        : catalogos.estadosCoordinacion.items.find((item) => item.itemId === estado.itemId);
      const itemModalidad = modalidad.itemId === null
        ? null
        : catalogos.modalidades.items.find((item) => item.itemId === modalidad.itemId);
      if (itemEstado && itemEstado.ambito === 'INTERCAMBIO_FORMAL'
        && (!itemModalidad || itemModalidad.ambito !== 'INTERCAMBIO_FORMAL')) {
        throw new ErrorValidacion(
          'Ese estado solo corresponde a un intercambio documental formal.'
        );
      }
      const profesional = solicitud.profesional || acceso.principalId;
      if (profesional.length > 200) {
        throw new ErrorValidacion('El profesional responsable no es válido.');
      }
      const resultado = await Reintentar(
        () => repositorio.RegistrarCoordinacion({
          ...RegistroBase(acceso, solicitud),
          institucionItemId: institucion.itemId,
          institucionTexto: textoInstitucion,
          modalidadItemId: modalidad.itemId,
          profesional,
          fecha: solicitud.fecha,
          motivo: solicitud.motivo,
          observaciones: solicitud.observaciones,
          estadoItemId: estado.itemId,
          estadoTexto: estado.texto
        }),
        {
          cerrado: 'La coordinación solo puede registrarse sobre un caso activo autorizado.',
          permiso: 'El registro de coordinaciones no está disponible para la cuenta técnica actual.'
        }
      );
      return {
        repetida: resultado.repetida === true,
        estadoCaso: resultado.estadoCaso,
        coordinacion: resultado.coordinacion
      };
    },

    ConsultarVista,

    async RegistrarReporte(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.CASE_REPORT_WRITE);
      const vistaPrevia = await ConsultarVista(acceso, solicitud.casoId);
      const resultado = await Reintentar(
        () => repositorio.RegistrarReporte({
          ...RegistroBase(acceso, solicitud),
          tipoProposito: solicitud.tipoProposito,
          motivo: solicitud.motivo
        }),
        {
          cerrado: 'El reporte solo puede conservarse sobre un caso activo autorizado.',
          permiso: 'La conservación de reportes no está disponible para la cuenta técnica actual.'
        }
      );
      let vista = vistaPrevia;
      try {
        vista = await ConsultarVista(acceso, solicitud.casoId);
      } catch (error) {
        if (!error || error.expose !== true) {
          throw error;
        }
      }
      return {
        repetida: resultado.repetida === true,
        estadoCaso: resultado.estadoCaso,
        estadoModificado: false,
        reporte: {
          ...resultado.reporte,
          nota: NOTA_REPORTE
        },
        vista
      };
    },

    async CerrarCaso(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.CASE_CLOSE);
      const catalogos = await Catalogos();
      if (catalogos.motivosCierre.disponibilidad !== 'DISPONIBLE') {
        throw new ErrorValidacion(catalogos.motivosCierre.mensaje);
      }
      const motivo = catalogos.motivosCierre.items.find(
        (item) => item.itemId === solicitud.motivoItemId
      );
      if (!motivo) {
        throw new ErrorValidacion('El motivo no pertenece al catálogo vigente de cierre.');
      }
      const esTraslado = motivo.codigo === CODIGO_TRASLADO;
      const exigeExplicacion = Boolean(motivo.requiereTexto) || esTraslado;
      if (exigeExplicacion && !solicitud.explicacion) {
        throw new ErrorValidacion(esTraslado
          ? 'El traslado exige el motivo.'
          : 'Este motivo exige una explicación.');
      }
      if (!exigeExplicacion && solicitud.explicacion) {
        throw new ErrorValidacion('La explicación solo corresponde al motivo que la exige.');
      }
      if (esTraslado && solicitud.destinoEstablecimientoId !== null && proceso) {
        const expediente = await proceso.ObtenerCaso(acceso, solicitud.casoId);
        if (Number(expediente.establecimientoId)
          === Number(solicitud.destinoEstablecimientoId)) {
          throw new ErrorValidacion(
            'El establecimiento de destino no puede ser el de origen.'
          );
        }
      }
      const destino = await ResolverDestino(motivo, solicitud);
      const resultado = await Reintentar(
        () => repositorio.CerrarCaso({
          ...RegistroBase(acceso, solicitud),
          motivoItemId: motivo.itemId,
          explicacion: exigeExplicacion ? solicitud.explicacion : null,
          fechaCierre: solicitud.fechaCierre,
          ...destino
        }),
        {
          cerrado: 'El caso ya no está activo.',
          permiso: 'El cierre no está disponible para la cuenta técnica actual.'
        }
      );
      return PresentarCierre(resultado);
    },

    async RegistrarDocumento(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.DOCUMENT_WRITE);
      let guardado;
      try {
        const contenido = Buffer.from(solicitud.contenidoBase64, 'base64');
        guardado = almacen.Guardar(solicitud.casoId, solicitud.nombre, contenido);
      } catch (error) {
        if (error && error.code === 'VALIDACION') {
          throw new ErrorValidacion(error.message);
        }
        throw new ErrorInfraestructura('No fue posible conservar el archivo.');
      }
      try {
        return await repositorio.RegistrarDocumento({
          ...RegistroBase(acceso, solicitud),
          fecha: FechaHoy(),
          tipoTexto: solicitud.tipoTexto,
          nombreOriginal: guardado.nombre,
          claveAlmacen: guardado.clave,
          tamano: guardado.tamano
        });
      } catch (error) {
        if (error && error.code === 'DUPLICADO') {
          throw new ErrorConflicto('Ese documento ya está asociado al caso.');
        }
        if (guardado && !guardado.duplicadoEnDisco) {
          try {
            almacen.Eliminar(guardado.clave);
          } catch (limpieza) {
            void limpieza;
          }
        }
        return TraducirPersistencia(error, {
          cerrado: 'Solo se adjunta un documento a un caso activo autorizado.',
          permiso: 'La carga de documentos no está disponible para esta cuenta.'
        });
      }
    },

    async DescargarDocumento(acceso, casoId, documentoId) {
      ExigirOficina(acceso, CAPABILITY.DOCUMENT_READ);
      let fila;
      try {
        fila = await repositorio.ObtenerDocumento({
          casoId,
          documentoId,
          oficinaLocalId: acceso.localOfficeId,
          regionId: acceso.regionId
        });
      } catch (error) {
        TraducirPersistencia(error, {
          permiso: 'La consulta de documentos no está disponible para esta cuenta.'
        });
      }
      if (!fila) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      try {
        return {
          nombre: fila.nombre_original,
          tipo: almacen.Tipo(fila.clave_almacen),
          contenido: almacen.Leer(fila.clave_almacen)
        };
      } catch (error) {
        throw new ErrorInfraestructura('El documento registrado no está disponible.');
      }
    },

    async ExportarExpediente(acceso, casoId) {
      ExigirOficina(acceso, CAPABILITY.CASE_READ);
      if (!proceso || typeof proceso.ObtenerCaso !== 'function') {
        throw new ErrorInfraestructura('El expediente no está disponible.');
      }
      const expediente = await proceso.ObtenerCaso(acceso, casoId);
      const vista = ArmarVista(expediente);
      const inventario = (expediente.documentos && expediente.documentos.registros) || [];
      const secciones = [
        ...(vista.secciones || []),
        {
          titulo: 'Inventario de documentos',
          parrafos: inventario.length === 0
            ? ['No hay documentos asociados. Este PDF no incluye archivos anexos.']
            : inventario.map((item) => (
              `${item.fecha}. ${item.nombre}. ${item.tipo}. Responsable: ${item.responsable}. `
              + 'El archivo no está incrustado; se descarga aparte.'
            ))
        }
      ];
      return {
        nombre: `expediente-caso-${casoId}.pdf`,
        tipo: 'application/pdf',
        contenido: CrearPdfTexto({
          titulo: `Expediente del caso ${casoId}`,
          generadoEn: FechaHoy(),
          secciones
        })
      };
    }
  };
}

module.exports = { CrearServicioCiclo, ArmarVista };
