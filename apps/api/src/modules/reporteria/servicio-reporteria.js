/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. CU-29 y CU-32. RF-083, RF-087 a RF-092, RF-125, RF-128, RF-129.
 * RN-040 permanece provisional. El ámbito sale solo de la sesión.
 */
'use strict';

const {
  ErrorInfraestructura,
  ErrorProhibido,
  ErrorValidacion
} = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { LIMITE_PERSONAS_DEMOGRAFICAS } = require('./definiciones-analiticas');
const { EnsamblarCorte, EnsamblarDemografia } = require('./ensamblar-corte');
const { CrearLibroConsolidacion } = require('./exportacion-consolidacion');

const MENSAJE_INFORME = 'El asistente del informe analítico de HU-050 y CU-38 '
  + 'todavía no está disponible. El formato de descarga sigue pendiente de confirmación. '
  + 'Esta acción no descarga la consolidación de Oficina Local ni el reporte individual del caso.';

function FechaHoy() {
  return new Date().toISOString().slice(0, 10);
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

function ParaCliente(corte) {
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
      porcentaje: item.porcentaje
    })),
    opciones: corte.opciones,
    disciplinas: corte.catalogoDisciplinas,
    establecimientos: corte.establecimientos,
    informeAnalitico: {
      disponible: false,
      estado: 'PENDIENTE',
      mensaje: MENSAJE_INFORME
    }
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
      return ParaCliente(await Preparar(acceso, filtros));
    },

    async DescargarConsolidacion(acceso, filtros) {
      ExigirOficina(acceso, CAPABILITY.REPORTING_EXPORT);
      const corte = await Preparar(acceso, filtros);
      return CrearLibroConsolidacion(corte);
    }
  };
}

module.exports = { CrearServicioReporteria, MENSAJE_INFORME };
