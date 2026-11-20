/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16. Modificación: 2026-11-16.
 * Modificación: 2026-11-20. Informe por ámbito y reportería de establecimiento.
 * HU-038, HU-039 y HU-040 a HU-043. CU-29, CU-30, CU-31 y CU-32.
 * RN-040 permanece provisional. El ámbito sale de la sesión y solo se estrecha.
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
const { ResolverAmbitoTerritorial } = require('../institutional/territorial-scope');
const {
  ESTADO_ZONA_HORARIA,
  FechaCalendarioLocal,
  FechaHoraLocal,
  ZONA_HORARIA_OPERATIVA
} = require('../../common/fecha-local');
const { TEXTO_COBERTURA, LIMITE_PERSONAS_DEMOGRAFICAS } = require('./definiciones-analiticas');
const {
  EnsamblarCorte,
  EnsamblarCorteEstablecimiento,
  EnsamblarDemografia
} = require('./ensamblar-corte');
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

function FechaVisible(iso) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(String(iso))) {
    return '';
  }
  const [anio, mes, dia] = String(iso).split('-');
  return `${dia}/${mes}/${anio}`;
}

function AgrupacionVisible(acceso, filtros) {
  const nivel = acceso && acceso.accessLevel;
  if (nivel === ACCESS_LEVEL.ESTABLISHMENT || filtros.establecimientoId) {
    return 'PROPIO';
  }
  if (nivel === ACCESS_LEVEL.LOCAL_OFFICE || filtros.localOfficeId) {
    return 'ESTABLECIMIENTO';
  }
  if (nivel === ACCESS_LEVEL.REGION || filtros.regionId) {
    return 'OFICINA_LOCAL';
  }
  return 'REGION';
}

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

function ParaCliente(corte, acceso, opciones) {
  const unidad = opciones && opciones.unidad ? opciones.unidad : 'Oficina Local';
  const informeOficina = !opciones || opciones.informeDisponible !== false;
  return {
    fechaConsulta: corte.fechaConsulta,
    fechaConsultaVisible: FechaVisible(corte.fechaConsulta),
    modo: corte.modo || 'OPERATIVO',
    anio: corte.anio,
    filtrosActivos: corte.filtrosActivos,
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
      serieCompleta: item.frecuenciaCompleta || item.serie,
      nota: item.nota,
      notaMetodologica: item.notaMetodologica || item.nota,
      advertencia: item.advertencia || null,
      periodoEtiqueta: item.periodoEtiqueta || null,
      agrupacion: item.agrupacion || null,
      detalleKpi: item.detalleKpi || null,
      activos: item.activos,
      filtrosAplicados: item.filtrosAplicados,
      filtrosNoAplicados: item.filtrosNoAplicados || [],
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
      unidad,
      oficinaLocalId: corte.oficinaLocalId,
      regionId: corte.regionId,
      zonaHoraria: ZONA_HORARIA_OPERATIVA,
      estadoZona: ESTADO_ZONA_HORARIA
    } : null,
    informeAnalitico: informeOficina ? {
      disponible: true,
      estado: 'DISPONIBLE',
      formatoProvisional: 'HTML',
      mensaje: MENSAJE_INFORME,
      instruccionSeleccion: 'Seleccione al menos 5 visualizaciones de las '
        + 'siguientes para incluir en su reporte',
      instruccionAnalisis: 'Por favor, redacte su análisis asociado a la '
        + 'visualización mostrada'
    } : {
      disponible: false,
      estado: 'PENDIENTE',
      formatoProvisional: null,
      mensaje: 'El informe no está habilitado para esta consulta.',
      instruccionSeleccion: null,
      instruccionAnalisis: null
    }
  };
}

function RespuestaCliente(corte, acceso, opciones) {
  const respuesta = ParaCliente(corte, acceso, opciones);
  respuesta.huellaCorte = HuellaCorte(respuesta);
  return respuesta;
}

function FiltrosTexto(visualizacion) {
  const filtros = visualizacion.filtrosAplicados || [];
  return filtros.length > 0 ? filtros.join('; ') : 'Ninguno adicional.';
}

function ArmarModelo(acceso, respuesta, pedido, filtros, instante, opciones) {
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
    unidad: opciones && opciones.unidad ? opciones.unidad : 'Oficina Local',
    ambito: opciones && opciones.ambito ? opciones.ambito : 'OFICINA_LOCAL',
    regionId: acceso.regionId || filtros.regionId || null,
    oficinaLocalId: acceso.localOfficeId || filtros.localOfficeId || null,
    establecimientoId: filtros.establecimientoId
      || (Array.isArray(acceso.establishmentIds) && acceso.establishmentIds.length === 1
        ? acceso.establishmentIds[0]
        : null),
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

  function PuertoTerritorial() {
    return {
      BuscarEstablecimiento: (id) => adaptador.BuscarEstablecimiento(id),
      BuscarOficinaLocal: (id) => adaptador.BuscarOficinaLocal(id),
      BuscarRegion: (id) => adaptador.BuscarRegion(id)
    };
  }

  function ExigirConsulta(acceso, capacidad) {
    ExigirCapacidad(acceso, capacidad);
    const nivel = acceso && acceso.accessLevel;
    if (nivel !== ACCESS_LEVEL.REGION && nivel !== ACCESS_LEVEL.NATIONAL) {
      throw new ErrorProhibido(
        'La reportería de este ámbito no está permitida para la sesión.'
      );
    }
    if (!acceso.scopeConfirmed) {
      throw new ErrorProhibido('El ámbito autorizado no está disponible.');
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

  function IdentificadoresEstablecimiento(hechos) {
    const ids = new Set();
    const listas = [hechos.casos, hechos.referencias, hechos.individuales, hechos.grupales];
    for (const lista of listas) {
      for (const fila of lista || []) {
        if (fila.establecimientoId) {
          ids.add(fila.establecimientoId);
        }
      }
    }
    return [...ids];
  }

  async function NombresAmbito(ambito, hechos) {
    try {
      let filas = [];
      if (ambito.localOfficeId) {
        filas = await adaptador.ListarEstablecimientos({
          localOfficeId: ambito.localOfficeId
        });
      } else {
        const ids = IdentificadoresEstablecimiento(hechos);
        if (ids.length === 0) {
          return new Map();
        }
        filas = await adaptador.ListarEstablecimientos({ establishmentIds: ids });
      }
      const mapa = new Map();
      for (const fila of filas) {
        if (ambito.regionId && fila.regionId !== ambito.regionId) {
          continue;
        }
        mapa.set(fila.establishmentId, fila.name);
      }
      return mapa;
    } catch {
      return new Map();
    }
  }

  async function EtiquetaUnidad(trabajo, respaldo) {
    try {
      const fila = await trabajo();
      return fila && fila.name ? fila.name : respaldo;
    } catch {
      return respaldo;
    }
  }

  async function CatalogoTerritorial(filtros) {
    const regiones = new Map();
    const oficinas = new Map();
    const agrupacion = AgrupacionVisible(
      { accessLevel: filtros.nivelAmbito },
      filtros
    );
    try {
      if (agrupacion === 'REGION' && typeof adaptador.ListarRegiones === 'function') {
        const lista = await adaptador.ListarRegiones({});
        for (const fila of lista || []) {
          regiones.set(fila.regionId, fila.name);
        }
      }
      if (
        agrupacion === 'OFICINA_LOCAL'
        && typeof adaptador.ListarOficinasLocales === 'function'
      ) {
        const lista = await adaptador.ListarOficinasLocales(
          filtros.regionId ? { regionId: filtros.regionId } : {}
        );
        for (const fila of lista || []) {
          oficinas.set(fila.localOfficeId, fila.name);
        }
      }
    } catch {
      return { regiones, oficinas };
    }
    return { regiones, oficinas };
  }

  async function Preparar(acceso, filtros, ambito, extra = {}) {
    const oficinaLocalId = ambito ? ambito.localOfficeId : acceso.localOfficeId;
    const regionId = ambito ? ambito.regionId : acceso.regionId;
    if (!ambito) {
      await ConfirmarEstablecimiento(acceso, filtros.establecimientoId);
    }
    const fechaConsulta = FechaHoy();
    const rango = RangoAnio(filtros.anio);
    let hechos;
    try {
      hechos = await repositorio.ConsultarHechos({
        oficinaLocalId,
        regionId,
        establecimientoId: filtros.establecimientoId,
        establecimientosAutorizados: extra.establecimientosAutorizados,
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
    if (!demografia && (filtros.sexo || filtros.grupoEdad)) {
      throw new ErrorInfraestructura(
        'No fue posible aplicar sexo o grupo de edad en este momento.'
      );
    }
    const nombres = ambito
      ? await NombresAmbito(ambito, hechos)
      : await Nombres(acceso);
    const nivelAmbito = acceso.accessLevel;
    const catalogoTerritorial = await CatalogoTerritorial({
      ...filtros,
      oficinaLocalId,
      regionId,
      nivelAmbito
    });
    const corte = EnsamblarCorte(hechos, {
      ...filtros,
      fechaConsulta,
      oficinaLocalId,
      regionId,
      nivelAmbito,
      catalogoTerritorial,
      etiquetaAmbito: ambito ? ambito.etiquetaAmbito : undefined,
      etiquetaOficina: ambito ? ambito.etiquetaOficina : undefined,
      etiquetaRegion: ambito ? ambito.etiquetaRegion : undefined,
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

  async function ResolverCorte(acceso, filtros) {
    const resuelto = await ResolverAmbitoTerritorial(acceso, {
      regionId: filtros.regionId ?? null,
      localOfficeId: filtros.localOfficeId ?? null,
      establishmentId: filtros.establecimientoId ?? null
    }, PuertoTerritorial());
    const regional = acceso.accessLevel === ACCESS_LEVEL.REGION;
    const etiquetaOficina = filtros.localOfficeId
      ? `Oficina Local ${await EtiquetaUnidad(
        () => adaptador.BuscarOficinaLocal(filtros.localOfficeId),
        String(filtros.localOfficeId)
      )}`
      : null;
    const etiquetaRegion = filtros.regionId
      ? `Región ${await EtiquetaUnidad(
        () => adaptador.BuscarRegion(filtros.regionId),
        String(filtros.regionId)
      )}`
      : null;
    return {
      localOfficeId: resuelto.localOfficeId,
      regionId: resuelto.regionId,
      etiquetaAmbito: regional ? 'Región' : 'Nacional',
      etiquetaOficina,
      etiquetaRegion
    };
  }

  function OpcionesCliente(acceso) {
    if (acceso.accessLevel === ACCESS_LEVEL.REGION) {
      return { unidad: 'Región', informeDisponible: true, ambito: 'REGION' };
    }
    if (acceso.accessLevel === ACCESS_LEVEL.NATIONAL) {
      return { unidad: 'Nacional', informeDisponible: true, ambito: 'NACIONAL' };
    }
    if (acceso.accessLevel === ACCESS_LEVEL.ESTABLISHMENT) {
      return {
        unidad: 'Establecimiento',
        informeDisponible: true,
        ambito: 'ESTABLECIMIENTO'
      };
    }
    return {
      unidad: 'Oficina Local',
      informeDisponible: true,
      ambito: 'OFICINA_LOCAL'
    };
  }

  function ExigirEstablecimiento(acceso, capacidad) {
    ExigirCapacidad(acceso, capacidad);
    if (
      !acceso
      || acceso.accessLevel !== ACCESS_LEVEL.ESTABLISHMENT
      || !acceso.scopeConfirmed
    ) {
      throw new ErrorProhibido(
        'La reportería de Establecimiento no está permitida para la sesión.'
      );
    }
    if (!Array.isArray(acceso.establishmentIds) || acceso.establishmentIds.length === 0) {
      throw new ErrorProhibido('El ámbito autorizado no está disponible.');
    }
  }

  function IdentificadorEstablecimiento(acceso, filtros) {
    if (filtros.establecimientoId) {
      return filtros.establecimientoId;
    }
    if (Array.isArray(acceso.establishmentIds) && acceso.establishmentIds.length === 1) {
      return acceso.establishmentIds[0];
    }
    return null;
  }

  async function PrepararEstablecimiento(acceso, filtros) {
    const autorizados = filtros.establecimientoId
      ? [filtros.establecimientoId]
      : acceso.establishmentIds.slice();
    if (
      filtros.establecimientoId
      && !acceso.establishmentIds.includes(filtros.establecimientoId)
    ) {
      throw new ErrorProhibido('El filtro territorial está fuera del ámbito autorizado.');
    }
    const fechaConsulta = FechaHoy();
    const rango = RangoAnio(filtros.anio);
    let hechos;
    try {
      hechos = await repositorio.ConsultarHechos({
        oficinaLocalId: null,
        regionId: null,
        establecimientoId: null,
        establecimientosAutorizados: autorizados,
        inicio: rango.inicio,
        fin: rango.fin
      });
    } catch (error) {
      if (error && error.expose === true) {
        throw error;
      }
      throw new ErrorInfraestructura('La consulta analítica no pudo completarse.');
    }
    const nombres = new Map();
    try {
      if (typeof adaptador.ListarEstablecimientos === 'function') {
        const filas = await adaptador.ListarEstablecimientos({
          establishmentIds: autorizados
        });
        for (const fila of filas || []) {
          if (autorizados.includes(fila.establishmentId)) {
            nombres.set(fila.establishmentId, fila.name);
          }
        }
      }
    } catch {
      /* Un nombre ausente no amplía el ámbito. */
    }
    let posibles = null;
    if (typeof repositorio.ContarPosiblesPendientes === 'function') {
      try {
        posibles = await repositorio.ContarPosiblesPendientes(autorizados);
      } catch {
        posibles = null;
      }
    }
    return EnsamblarCorteEstablecimiento(hechos, {
      ...filtros,
      fechaConsulta,
      nivelAmbito: ACCESS_LEVEL.ESTABLISHMENT
    }, nombres, posibles);
  }

  async function BuscarPrevio(acceso, filtros, clave, opciones, buscarOficina) {
    if (buscarOficina) {
      return buscarOficina();
    }
    if (typeof repositorio.BuscarInformePorAmbito !== 'function') {
      return null;
    }
    return repositorio.BuscarInformePorAmbito({
      claveOperacion: clave,
      ambito: opciones.ambito,
      oficinaLocalId: acceso.localOfficeId || null,
      regionId: acceso.regionId || filtros.regionId || null,
      establecimientoId: IdentificadorEstablecimiento(acceso, filtros)
    });
  }

  async function PersistirInforme(acceso, filtros, cuerpo, corte, opciones, buscarOficina) {
    const instante = new Date();
    const clave = AfirmarClaveInforme(cuerpo);
    let previo = null;
    try {
      previo = await BuscarPrevio(acceso, filtros, clave, opciones, buscarOficina);
    } catch (error) {
      if (!PersistenciaPendiente(error)) {
        throw new ErrorInfraestructura('No fue posible comprobar el informe ya emitido.');
      }
    }
    if (previo) {
      return Archivo(previo, {
        persistido: true,
        informeId: previo.informeId,
        reintento: true
      });
    }
    const respuesta = RespuestaCliente(corte, acceso, opciones);
    const pedido = LeerPedidoInforme(cuerpo, respuesta.visualizaciones);
    if (pedido.huellaCorte !== respuesta.huellaCorte) {
      throw new ErrorConflicto(
        'El corte analítico cambió. Vuelva a consultar antes de generar el informe.'
      );
    }
    const modelo = ArmarModelo(acceso, respuesta, pedido, filtros, instante, opciones);
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
          const existente = await BuscarPrevio(
            acceso,
            filtros,
            pedido.claveOperacion,
            opciones,
            buscarOficina
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

    async ConsultarAmbito(acceso, filtros) {
      ExigirConsulta(acceso, CAPABILITY.REPORTING_READ);
      const ambito = await ResolverCorte(acceso, filtros);
      const corte = await Preparar(acceso, filtros, ambito);
      return RespuestaCliente(corte, acceso, OpcionesCliente(acceso));
    },

    async DescargarConsolidacionAmbito(acceso, filtros) {
      ExigirConsulta(acceso, CAPABILITY.REPORTING_EXPORT);
      const ambito = await ResolverCorte(acceso, filtros);
      const corte = await Preparar(acceso, filtros, ambito);
      return CrearLibroConsolidacion(corte);
    },

    async ConsultarEstablecimiento(acceso, filtros) {
      ExigirEstablecimiento(acceso, CAPABILITY.REPORTING_READ);
      const corte = await PrepararEstablecimiento(acceso, filtros);
      return RespuestaCliente(corte, acceso, OpcionesCliente(acceso));
    },

    async GenerarInforme(acceso, filtros, cuerpo) {
      ExigirCapacidad(acceso, CAPABILITY.REPORTING_EXPORT);
      const nivel = acceso && acceso.accessLevel;
      if (nivel === ACCESS_LEVEL.LOCAL_OFFICE) {
        ExigirOficina(acceso, CAPABILITY.REPORTING_EXPORT);
        const corte = await Preparar(acceso, filtros);
        return PersistirInforme(
          acceso,
          filtros,
          cuerpo,
          corte,
          OpcionesCliente(acceso),
          async () => {
            if (typeof repositorio.BuscarInformePorClave !== 'function') {
              return null;
            }
            return repositorio.BuscarInformePorClave(
              acceso.localOfficeId,
              AfirmarClaveInforme(cuerpo)
            );
          }
        );
      }
      if (nivel === ACCESS_LEVEL.REGION || nivel === ACCESS_LEVEL.NATIONAL) {
        ExigirConsulta(acceso, CAPABILITY.REPORTING_EXPORT);
        const ambito = await ResolverCorte(acceso, filtros);
        const corte = await Preparar(acceso, filtros, ambito);
        return PersistirInforme(acceso, filtros, cuerpo, corte, OpcionesCliente(acceso));
      }
      if (nivel === ACCESS_LEVEL.ESTABLISHMENT) {
        ExigirEstablecimiento(acceso, CAPABILITY.REPORTING_EXPORT);
        const corte = await PrepararEstablecimiento(acceso, filtros);
        return PersistirInforme(acceso, filtros, cuerpo, corte, OpcionesCliente(acceso));
      }
      throw new ErrorProhibido(
        'La reportería de este ámbito no está permitida para la sesión.'
      );
    }
  };
}

module.exports = { CrearServicioReporteria, MENSAJE_INFORME };
