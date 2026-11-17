/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. CU-29 y CU-32. RF-083, RF-087 a RF-092, RF-125, RF-128, RF-129.
 * RN-040 permanece provisional. El ámbito sale solo de la sesión.
 */
'use strict';

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
const {
  ESTADO_ZONA_HORARIA,
  FechaCalendarioLocal,
  FechaHoraLocal,
  ZONA_HORARIA_OPERATIVA
} = require('../../common/fecha-local');
const { TEXTO_COBERTURA, LIMITE_PERSONAS_DEMOGRAFICAS } = require('./definiciones-analiticas');
const { EnsamblarCorte, EnsamblarDemografia } = require('./ensamblar-corte');
const { CrearDocumentoInforme } = require('./documento-informe');
const { CrearLibroConsolidacion } = require('./exportacion-consolidacion');
const { HuellaCorte } = require('./huella-corte');
const {
  AfirmarClaveInforme,
  LeerIdentificadorInforme,
  LeerPedidoInforme
} = require('./validacion-informe');

const MENSAJE_INFORME = 'El asistente genera el informe analítico de HU-050 y CU-38. '
  + 'No descarga la consolidación tabular de Oficina Local ni el reporte individual del caso. '
  + 'El formato institucional definitivo sigue pendiente de confirmación.';

function FechaHoy() {
  return FechaCalendarioLocal();
}

function ExigirOficina(acceso, capacidad) {
  ExigirCapacidad(acceso, capacidad);
  if (!acceso || acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE || !acceso.scopeConfirmed) {
    throw new ErrorProhibido(
      'La reportería interna de Oficina Local no está permitida para este ámbito.'
    );
  }
  if (!Number.isInteger(acceso.localOfficeId) || !Number.isInteger(acceso.regionId)) {
    throw new ErrorProhibido('El ámbito autorizado no está disponible.');
  }
}

function RangoAnio(anio) {
  return {
    inicio: `${anio}-01-01`,
    fin: `${anio + 1}-01-01`
  };
}

function ParaCliente(corte, acceso) {
  return {
    fechaConsulta: corte.fechaConsulta,
    anio: corte.anio,
    filtrosActivos: corte.filtrosActivos,
    alcanceFiltros: corte.alcanceFiltros,
    cobertura: corte.cobertura,
    referencias: corte.referencias,
    personasUnicas: corte.personasUnicas,
    totalAtenciones: corte.totalAtenciones,
    atencionesIndividuales: corte.atencionesIndividuales,
    atencionesGrupales: corte.atencionesGrupales,
    notaPersonas: 'Personas distintas con atención efectiva en el año. '
      + 'Varias atenciones de la misma persona cuentan una vez. '
      + 'No es el numerador de la cobertura.',
    notaAtenciones: 'Suma de atenciones individuales y actividades grupales. '
      + 'Una grupal con varias personas sigue siendo una actividad. '
      + 'La participación sin asistencia no es atención efectiva. '
      + 'Sexo y edad no modifican este total.',
    casosSinAtencion: {
      total: corte.casosSinAtencion.total,
      muestra: corte.casosSinAtencion.muestra,
      estado: corte.casosSinAtencion.estado,
      nota: 'Casos activos actuales sin atención efectiva en el año. '
        + 'La programación no cuenta. El estado general no cambia este universo.'
    },
    visualizaciones: corte.visualizaciones.map((item) => ({
      numero: item.numero,
      codigo: item.codigo,
      titulo: item.titulo,
      formato: item.formato,
      fechaAplicada: item.fechaAplicada,
      estado: item.estado,
      mensaje: item.mensaje,
      serie: item.serie,
      nota: item.nota,
      filtrosAplicados: item.filtrosAplicados,
      totalFrecuencia: Array.isArray(item.frecuenciaCompleta)
        ? item.frecuenciaCompleta.length
        : (item.serie || []).length,
      numerador: item.numerador,
      denominador: item.denominador,
      porcentaje: item.porcentaje,
      autorizada: true
    })),
    opciones: corte.opciones,
    disciplinas: corte.catalogoDisciplinas,
    establecimientos: corte.establecimientos,
    identificacion: acceso ? {
      responsable: acceso.principalId,
      rol: acceso.accessLevel,
      unidad: 'Oficina Local',
      oficinaLocalId: acceso.localOfficeId,
      regionId: acceso.regionId,
      zonaHoraria: ZONA_HORARIA_OPERATIVA,
      estadoZona: ESTADO_ZONA_HORARIA
    } : null,
    informeAnalitico: {
      disponible: true,
      estado: 'DISPONIBLE',
      formatoProvisional: 'HTML',
      mensaje: MENSAJE_INFORME,
      instruccionSeleccion: 'Seleccione al menos 5 visualizaciones de las '
        + 'siguientes para incluir en su reporte',
      instruccionAnalisis: 'Por favor, redacte su análisis asociado a la '
        + 'visualización mostrada'
    }
  };
}

function RespuestaCliente(corte, acceso) {
  const respuesta = ParaCliente(corte, acceso);
  respuesta.huellaCorte = HuellaCorte(respuesta);
  return respuesta;
}

function FiltrosTexto(visualizacion) {
  const filtros = visualizacion.filtrosAplicados || [];
  return filtros.length > 0 ? filtros.join('; ') : 'Ninguno adicional.';
}

function ArmarModelo(acceso, respuesta, pedido, filtros, instante) {
  const etiquetasFiltro = (respuesta.filtrosActivos || [])
    .map((filtro) => filtro.etiqueta)
    .join('; ');
  const fechaHoraLocal = FechaHoraLocal(instante);
  const resumen = `fecha_hora_local=${fechaHoraLocal}; `
    + `fecha_calendario=${respuesta.fechaConsulta}; `
    + `personas=${respuesta.personasUnicas}; `
    + `atenciones=${respuesta.totalAtenciones} | ${etiquetasFiltro}`;
  return {
    titulo: pedido.titulo,
    responsable: acceso.principalId,
    rol: acceso.accessLevel,
    unidad: 'Oficina Local',
    ambito: 'OFICINA_LOCAL',
    regionId: acceso.regionId,
    oficinaLocalId: acceso.localOfficeId,
    establecimientoId: filtros.establecimientoId,
    anio: respuesta.anio,
    fechaHoraLocal,
    fechaCalendario: respuesta.fechaConsulta,
    zonaHoraria: ZONA_HORARIA_OPERATIVA,
    estadoZona: ESTADO_ZONA_HORARIA,
    filtrosResumen: resumen,
    filtrosVisibles: etiquetasFiltro,
    personasUnicas: respuesta.personasUnicas,
    totalAtenciones: respuesta.totalAtenciones,
    coberturaTexto: TEXTO_COBERTURA,
    claveOperacion: pedido.claveOperacion,
    visualizaciones: pedido.seleccion.map((item, indice) => ({
      numero: item.origen.numero,
      orden: indice + 1,
      titulo: item.origen.titulo,
      formato: item.origen.formato,
      fechaAplicada: item.origen.fechaAplicada,
      estado: item.origen.estado,
      mensaje: item.origen.mensaje,
      nota: item.origen.nota,
      filtrosTexto: FiltrosTexto(item.origen),
      analisis: item.analisis,
      serie: item.origen.serie || [],
      numerador: item.origen.numerador,
      denominador: item.origen.denominador,
      porcentaje: item.origen.porcentaje
    }))
  };
}

function PersistenciaPendiente(error) {
  return error && (error.code === 'PERMISO' || error.code === 'AUSENTE');
}

function Archivo(modelo, opciones) {
  return {
    contenido: Buffer.from(CrearDocumentoInforme(modelo, opciones), 'utf8'),
    persistencia: opciones.persistido ? 'REGISTRADO' : opciones.persistencia,
    informeId: opciones.informeId || null,
    reintento: Boolean(opciones.reintento),
    historico: Boolean(opciones.historico)
  };
}

/**
 * Reportería analítica de Oficina Local.
 *
 * @param {object} dependencias Repositorio y adaptador institucional.
 * @returns {object} Consulta y consolidación.
 */
function CrearServicioReporteria(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;

  async function ConfirmarEstablecimiento(acceso, establecimientoId) {
    if (!establecimientoId) {
      return;
    }
    let encontrado;
    try {
      encontrado = await adaptador.BuscarEstablecimiento(establecimientoId);
    } catch (error) {
      if (error && error.expose === true) {
        throw error;
      }
      throw new ErrorInfraestructura('No fue posible comprobar el establecimiento.');
    }
    if (!encontrado) {
      throw new ErrorValidacion('El establecimiento no corresponde a una unidad activa.');
    }
    if (
      encontrado.localOfficeId !== acceso.localOfficeId
      || encontrado.regionId !== acceso.regionId
    ) {
      throw new ErrorProhibido('El filtro territorial está fuera del ámbito autorizado.');
    }
  }

  async function Nombres(acceso) {
    try {
      const filas = await adaptador.ListarEstablecimientos({
        localOfficeId: acceso.localOfficeId
      });
      const mapa = new Map();
      for (const fila of filas) {
        if (fila.regionId === acceso.regionId) {
          mapa.set(fila.establishmentId, fila.name);
        }
      }
      return mapa;
    } catch {
      return new Map();
    }
  }

  async function Demografia(hechos, fechaConsulta) {
    const identificadores = new Set();
    for (const caso of hechos.casos) {
      if (caso.personaId) {
        identificadores.add(caso.personaId);
      }
    }
    for (const fila of hechos.individuales) {
      if (fila.personaId) {
        identificadores.add(fila.personaId);
      }
    }
    for (const fila of hechos.participantes) {
      if (fila.personaId) {
        identificadores.add(fila.personaId);
      }
    }
    const lista = [...identificadores];
    if (lista.length > LIMITE_PERSONAS_DEMOGRAFICAS) {
      return null;
    }
    try {
      const filas = await adaptador.LeerSexoYNacimiento(lista);
      return EnsamblarDemografia(filas, fechaConsulta);
    } catch {
      return null;
    }
  }

  async function Preparar(acceso, filtros) {
    await ConfirmarEstablecimiento(acceso, filtros.establecimientoId);
    const fechaConsulta = FechaHoy();
    const rango = RangoAnio(filtros.anio);
    let hechos;
    try {
      hechos = await repositorio.ConsultarHechos({
        oficinaLocalId: acceso.localOfficeId,
        regionId: acceso.regionId,
        establecimientoId: filtros.establecimientoId,
        inicio: rango.inicio,
        fin: rango.fin
      });
    } catch (error) {
      if (error && error.expose === true) {
        throw error;
      }
      throw new ErrorInfraestructura('La consulta analítica no pudo completarse.');
    }
    if (filtros.disciplinaId) {
      const vigente = hechos.catalogoDisciplinas.some((item) => (
        item.itemId === filtros.disciplinaId
      ));
      if (!vigente) {
        throw new ErrorValidacion('La disciplina no pertenece al catálogo vigente.');
      }
    }
    const demografia = await Demografia(hechos, fechaConsulta);
    if (!demografia && (filtros.sexo || filtros.edad !== null)) {
      throw new ErrorInfraestructura(
        'No fue posible aplicar sexo o edad porque la réplica institucional no está disponible.'
      );
    }
    const nombres = await Nombres(acceso);
    const corte = EnsamblarCorte(hechos, {
      ...filtros,
      fechaConsulta,
      oficinaLocalId: acceso.localOfficeId,
      regionId: acceso.regionId,
      catalogoDisciplinas: hechos.catalogoDisciplinas
    }, demografia, nombres);
    if (filtros.profesional) {
      const conocido = corte.opciones.profesionales.includes(filtros.profesional);
      if (!conocido) {
        throw new ErrorValidacion(
          'El profesional no está en las atenciones verificables de este corte.'
        );
      }
    }
    return corte;
  }

  return {
    async ConsultarOficina(acceso, filtros) {
      ExigirOficina(acceso, CAPABILITY.REPORTING_READ);
      return RespuestaCliente(await Preparar(acceso, filtros), acceso);
    },

    async ConsultarInformeHistorico(acceso, informeId) {
      ExigirOficina(acceso, CAPABILITY.REPORTING_READ);
      const identificador = LeerIdentificadorInforme(informeId);
      let modelo = null;
      if (typeof repositorio.BuscarInformePorId === 'function') {
        try {
          modelo = await repositorio.BuscarInformePorId(
            acceso.localOfficeId,
            identificador
          );
        } catch (error) {
          if (!PersistenciaPendiente(error)) {
            throw new ErrorInfraestructura('No fue posible leer el informe histórico.');
          }
          throw new ErrorInfraestructura(
            'El informe histórico no está disponible para la cuenta técnica actual.'
          );
        }
      }
      if (!modelo) {
        throw new ErrorNoEncontrado('El informe no está disponible en este ámbito.');
      }
      return Archivo(modelo, {
        persistido: true,
        informeId: modelo.informeId,
        historico: true
      });
    },

    async DescargarConsolidacion(acceso, filtros) {
      ExigirOficina(acceso, CAPABILITY.REPORTING_EXPORT);
      const corte = await Preparar(acceso, filtros);
      return CrearLibroConsolidacion(corte);
    },

    async GenerarInforme(acceso, filtros, cuerpo) {
      ExigirOficina(acceso, CAPABILITY.REPORTING_EXPORT);
      const instante = new Date();
      let previo = null;
      const clave = AfirmarClaveInforme(cuerpo);
      if (typeof repositorio.BuscarInformePorClave === 'function') {
        try {
          previo = await repositorio.BuscarInformePorClave(acceso.localOfficeId, clave);
        } catch (error) {
          if (!PersistenciaPendiente(error)) {
            throw new ErrorInfraestructura('No fue posible comprobar el informe ya emitido.');
          }
        }
      }
      if (previo) {
        return Archivo(previo, {
          persistido: true,
          informeId: previo.informeId,
          reintento: true
        });
      }
      const corte = await Preparar(acceso, filtros);
      const respuesta = RespuestaCliente(corte, acceso);
      const pedido = LeerPedidoInforme(cuerpo, respuesta.visualizaciones);
      if (pedido.huellaCorte !== respuesta.huellaCorte) {
        throw new ErrorConflicto(
          'El corte analítico cambió. Vuelva a consultar antes de generar el informe.'
        );
      }
      const modelo = ArmarModelo(acceso, respuesta, pedido, filtros, instante);
      if (modelo.filtrosResumen.length > 2000) {
        throw new ErrorValidacion('Los filtros del informe exceden la longitud permitida.');
      }
      let informeId = null;
      let persistencia = 'PENDIENTE_PERMISO';
      if (typeof repositorio.GuardarInforme === 'function') {
        try {
          informeId = await repositorio.GuardarInforme(modelo);
          persistencia = 'REGISTRADO';
        } catch (error) {
          if (error && error.code === 'DUPLICADO') {
            const existente = await repositorio.BuscarInformePorClave(
              acceso.localOfficeId,
              pedido.claveOperacion
            );
            if (existente) {
              return Archivo(existente, {
                persistido: true,
                informeId: existente.informeId,
                reintento: true
              });
            }
          }
          if (!PersistenciaPendiente(error)) {
            throw new ErrorInfraestructura('No fue posible conservar el informe.');
          }
          persistencia = error.code === 'AUSENTE' ? 'PENDIENTE_TABLA' : 'PENDIENTE_PERMISO';
        }
      } else {
        persistencia = 'PENDIENTE_TABLA';
      }
      return Archivo(modelo, {
        persistido: persistencia === 'REGISTRADO',
        persistencia,
        informeId
      });
    }
  };
}

module.exports = { CrearServicioReporteria, MENSAJE_INFORME };
