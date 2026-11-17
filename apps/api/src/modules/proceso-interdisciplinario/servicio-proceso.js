/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-14.
 * Modificación: 2026-11-16. Expediente, programación, reportería
 * y consulta de casos de Región y Nacional.
 * HU-001, HU-002 y HU-018 a HU-025, HU-048. El equipo decide; RN-009 calcula la prioridad.
 */
'use strict';

const { FechaCalendarioLocal } = require('../../common/fecha-local');
const {
  ErrorConflicto,
  ErrorInfraestructura,
  ErrorNoEncontrado,
  ErrorProhibido,
  ErrorValidacion
} = require('../../common/errors');
const { CAPABILITY } = require('../../infrastructure/auth/capabilities');
const { ExigirCapacidad, TieneCapacidad } = require('../../infrastructure/auth/authorization-policy');
const { ACCESS_LEVEL } = require('../../infrastructure/auth/institutional-roles');
const { ResolverAmbitoTerritorial } = require('../institutional/territorial-scope');
const { NombreCompleto } = require('../references/reference-snapshot');
const {
  CalcularPrioridadRn009,
  ETIQUETA_PRIORIDAD,
  ETIQUETA_PROTECCION,
  ETIQUETA_RIESGO
} = require('./reglas-prioridad');

const NO_ENCONTRADO = 'El recurso solicitado no existe.';
const CASO_ACTIVO = 'No se puede abrir el caso porque la persona ya tiene un caso de Atención Interdisciplinaria activo.';
const INTENTOS = 3;
const LIMITE_NOMBRES = 100;
const LIMITE_EXPORTACION = 2000;
const LIMITE_ACCIONES = 8;
const ETIQUETA_EJE = Object.freeze({
  PROTECTOR: 'Factor protector',
  RIESGO: 'Factor de riesgo',
  SIGNO_ALERTA: 'Signo de alerta'
});
const ETIQUETA_AMBITO = Object.freeze({
  INDIVIDUAL: 'Individual',
  HOGAR_FAMILIAR: 'Hogar/Familiar',
  COMUNITARIO: 'Comunitario'
});

function PuertoTerritorial(adaptador) {
  return {
    BuscarEstablecimiento: (id) => adaptador.BuscarEstablecimiento(id),
    BuscarOficinaLocal: (id) => adaptador.BuscarOficinaLocal(id),
    BuscarRegion: (id) => adaptador.BuscarRegion(id)
  };
}

function ExigirResponsable(acceso) {
  if (!acceso || typeof acceso.principalId !== 'string' || acceso.principalId.length === 0) {
    throw new ErrorProhibido('La identidad de la sesión no puede usarse como responsable.');
  }
  return acceso.principalId;
}

function TraducirPersistencia(error, mensajes) {
  if (error && error.expose === true) {
    throw error;
  }
  if (error && error.code === 'CASO_ACTIVO') {
    throw new ErrorConflicto(CASO_ACTIVO);
  }
  if (error && error.code === 'SITUACION_DUPLICADA') {
    throw new ErrorConflicto('Esa referencia o ese caso ya está en la sesión.');
  }
  if (error && error.code === 'ESTADO_INVALIDO') {
    throw new ErrorConflicto('La operación no corresponde al estado actual.');
  }
  if (error && error.code === 'DUPLICADO') {
    throw new ErrorConflicto(mensajes.duplicado || 'El registro entra en conflicto con uno existente.');
  }
  if (error && error.code === 'PERMISO') {
    throw new ErrorInfraestructura('La operación no está disponible para la cuenta técnica actual.');
  }
  if (error && error.code === 'INTERBLOQUEO') {
    return 'REINTENTAR';
  }
  if (error instanceof ErrorInfraestructura) {
    throw error;
  }
  throw new ErrorInfraestructura('La operación de base de datos no se completó.');
}

async function LeerOpcional(trabajo) {
  try {
    return { disponibilidad: 'DISPONIBLE', datos: await trabajo() };
  } catch (error) {
    if (error && error.code === 'PERMISO') {
      return { disponibilidad: 'BLOQUEADO', datos: null };
    }
    return TraducirPersistencia(error, {});
  }
}

async function SiPermiso(trabajo, bloqueado) {
  try {
    return await trabajo();
  } catch (error) {
    if (error && error.code === 'PERMISO') {
      return bloqueado;
    }
    return TraducirPersistencia(error, {});
  }
}

function IndicadorNoDisponible(motivo) {
  return { disponibilidad: 'NO_DISPONIBLE', cantidad: null, motivo };
}

function FechaEvento(valor) {
  return valor ? String(valor).slice(0, 10) : '';
}

function IdentificadorOpcional(valor) {
  if (valor === null || valor === undefined) {
    return null;
  }
  return Number(valor);
}

function AgregarEventos(destino, filas, construir) {
  for (const fila of filas) {
    destino.push(construir(fila));
  }
}

/**
 * Línea de tiempo solo con eventos ya persistidos.
 *
 * @param {object} partes Historial, valoraciones, planes y atenciones.
 * @returns {object[]} Eventos ordenados por fecha.
 */
function ConstruirLineaTiempo(partes) {
  const eventos = [];
  AgregarEventos(eventos, partes.historial, (fila) => ({
    tipo: 'ESTADO',
    fecha: FechaEvento(fila.ocurridoEn),
    texto: `Estado ${fila.estado}`,
    responsable: null
  }));
  AgregarEventos(eventos, partes.valoraciones, (fila) => ({
    tipo: 'VALORACION',
    fecha: fila.fecha,
    texto: `Valoración ${fila.numero}. Prioridad ${fila.prioridadEtiqueta}.`,
    responsable: fila.responsable
  }));
  AgregarEventos(eventos, partes.planes, (fila) => ({
    tipo: 'PLAN',
    fecha: fila.fecha,
    texto: `Plan versión ${fila.numero}${fila.vigente ? ', vigente' : ''}.`,
    responsable: fila.responsable
  }));
  AgregarEventos(eventos, partes.atenciones, (fila) => ({
    tipo: 'ATENCION_INDIVIDUAL',
    fecha: fila.fechaAtencion,
    texto: fila.acciones,
    responsable: fila.profesional
  }));
  AgregarEventos(eventos, partes.grupales, (fila) => ({
    tipo: 'ATENCION_GRUPAL',
    fecha: fila.fechaAtencion,
    texto: fila.asistio === true
      ? `Participación con asistencia. ${fila.tema}`
      : `Participación sin asistencia confirmada. ${fila.tema}`,
    responsable: null
  }));
  AgregarEventos(eventos, partes.coordinaciones || [], (fila) => ({
    tipo: 'COORDINACION',
    fecha: FechaEvento(fila.fecha),
    texto: `Coordinación con ${fila.institucion}. Estado ${fila.estado}.`,
    responsable: fila.profesional
  }));
  AgregarEventos(eventos, partes.reportes || [], (fila) => ({
    tipo: 'REPORTE',
    fecha: FechaEvento(fila.fecha),
    texto: `Reporte conservado: ${fila.tipoProposito}.`,
    responsable: fila.responsable
  }));
  if (partes.cierre) {
    const traslado = partes.cierre.motivoCodigo === 'TRASLADO';
    const destino = partes.cierre.destinoNombre
      || (partes.cierre.destinoEstablecimientoId
        ? `establecimiento ${partes.cierre.destinoEstablecimientoId}`
        : 'sin nombre adicional');
    eventos.push({
      tipo: traslado ? 'TRASLADO' : 'CIERRE',
      fecha: FechaEvento(partes.cierre.fecha),
      texto: traslado
        ? `Traslado. Destino ${destino}.`
        : `Cierre. Motivo ${partes.cierre.motivoEtiqueta}.`,
      responsable: partes.cierre.responsable
    });
  }
  eventos.sort((izquierda, derecha) => {
    const porFecha = izquierda.fecha.localeCompare(derecha.fecha);
    return porFecha === 0 ? izquierda.tipo.localeCompare(derecha.tipo) : porFecha;
  });
  return eventos.map((evento, indice) => ({
    ...evento,
    clave: `${evento.tipo}-${indice}`
  }));
}

/**
 * Línea de tiempo de consulta superior.
 * Conserva el tipo y la fecha. Omite narrativa clínica.
 *
 * @param {object} partes Eventos ya recortados.
 * @returns {object[]} Eventos ordenados por fecha.
 */
function ConstruirLineaConsulta(partes) {
  const eventos = [];
  AgregarEventos(eventos, partes.historial, (fila) => ({
    tipo: 'ESTADO',
    fecha: FechaEvento(fila.ocurridoEn),
    texto: `Estado ${fila.estado}`
  }));
  AgregarEventos(eventos, partes.valoraciones, (fila) => ({
    tipo: 'VALORACION',
    fecha: FechaEvento(fila.fecha),
    texto: `Valoración ${fila.numero}. Prioridad ${fila.prioridadEtiqueta}.`
  }));
  AgregarEventos(eventos, partes.planes, (fila) => ({
    tipo: 'PLAN',
    fecha: FechaEvento(fila.fecha),
    texto: `Plan versión ${fila.numero}${fila.vigente ? ', vigente' : ''}. `
      + `Frecuencia ${fila.frecuenciaEtiqueta}.`
  }));
  AgregarEventos(eventos, partes.atenciones, (fila) => ({
    tipo: 'ATENCION_INDIVIDUAL',
    fecha: FechaEvento(fila.fechaAtencion),
    texto: 'Atención individual registrada.'
  }));
  AgregarEventos(eventos, partes.grupales, (fila) => ({
    tipo: 'ATENCION_GRUPAL',
    fecha: FechaEvento(fila.fechaAtencion),
    texto: fila.asistio
      ? 'Participación grupal con asistencia.'
      : 'Participación grupal sin asistencia confirmada.'
  }));
  AgregarEventos(eventos, partes.coordinaciones, (fila) => ({
    tipo: 'COORDINACION',
    fecha: FechaEvento(fila.fecha),
    texto: `Coordinación registrada. Estado ${fila.estado}.`
  }));
  AgregarEventos(eventos, partes.reportes, (fila) => ({
    tipo: 'REPORTE',
    fecha: FechaEvento(fila.fecha),
    texto: 'Reporte conservado.'
  }));
  if (partes.cierre) {
    const traslado = partes.cierre.motivoCodigo === 'TRASLADO';
    const destino = partes.cierre.destinoNombre
      || (partes.cierre.destinoEstablecimientoId
        ? `establecimiento ${partes.cierre.destinoEstablecimientoId}`
        : 'sin nombre adicional');
    eventos.push({
      tipo: traslado ? 'TRASLADO' : 'CIERRE',
      fecha: FechaEvento(partes.cierre.fecha),
      texto: traslado
        ? `Traslado. Destino ${destino}.`
        : `Cierre. Motivo ${partes.cierre.motivoEtiqueta}.`
    });
  }
  eventos.sort((izquierda, derecha) => {
    const porFecha = izquierda.fecha.localeCompare(derecha.fecha);
    return porFecha === 0 ? izquierda.tipo.localeCompare(derecha.tipo) : porFecha;
  });
  return eventos.map((evento, indice) => ({
    ...evento,
    clave: `${evento.tipo}-${indice}`
  }));
}

function PresentarConteo(resultado, vacio, bloqueo) {
  if (resultado.disponibilidad !== 'DISPONIBLE') {
    return {
      disponibilidad: 'BLOQUEADO',
      cantidad: null,
      mensaje: bloqueo
    };
  }
  return {
    disponibilidad: 'DISPONIBLE',
    cantidad: resultado.datos,
    mensaje: resultado.datos === 0 ? vacio : null
  };
}

function UltimaFecha(individual, grupal) {
  if (!individual && !grupal) {
    return null;
  }
  if (!individual) {
    return grupal;
  }
  if (!grupal) {
    return individual;
  }
  return individual >= grupal ? individual : grupal;
}

function FechaHoy() {
  return FechaCalendarioLocal();
}

function EtiquetaCategoria(categoria) {
  const eje = ETIQUETA_EJE[categoria.eje] || categoria.eje;
  const ambito = ETIQUETA_AMBITO[categoria.ambito] || categoria.ambito;
  return `${eje} — ${ambito}`;
}

function AgruparInstrumento(filas) {
  if (!filas || filas.length === 0) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      mensaje: 'No hay una versión vigente del instrumento de valoración. No se inventan factores.'
    };
  }
  const versiones = new Set(filas.map((fila) => Number(fila.instrumento_version_id)));
  if (versiones.size !== 1) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      mensaje: 'Hay más de una versión vigente del instrumento. No se elige una automáticamente.'
    };
  }
  const categorias = new Map();
  for (const fila of filas) {
    const categoriaId = Number(fila.categoria_id);
    if (!categorias.has(categoriaId)) {
      categorias.set(categoriaId, {
        categoriaId,
        eje: fila.eje,
        ambito: fila.ambito,
        esRequerida: fila.es_requerida === true || fila.es_requerida === 1,
        orden: Number(fila.orden_categoria),
        etiqueta: EtiquetaCategoria(fila),
        factores: []
      });
    }
    if (fila.factor_id !== null && fila.factor_id !== undefined) {
      categorias.get(categoriaId).factores.push({
        factorId: Number(fila.factor_id),
        codigo: fila.codigo,
        etiqueta: fila.etiqueta,
        esAbierto: fila.es_abierto === true || fila.es_abierto === 1
      });
    }
  }
  return {
    disponibilidad: 'DISPONIBLE',
    instrumentoVersionId: Number(filas[0].instrumento_version_id),
    numeroVersion: Number(filas[0].numero_version),
    categorias: [...categorias.values()]
  };
}

function AgruparMatriz(filas) {
  if (!filas || filas.length === 0) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      mensaje: 'No hay una matriz vigente de prioridad. La valoración no puede confirmarse.'
    };
  }
  const versiones = new Set(filas.map((fila) => Number(fila.cat_version_id)));
  if (versiones.size !== 1 || filas.length !== 9) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      mensaje: 'La matriz vigente no tiene las nueve combinaciones de RN-009.'
    };
  }
  return {
    disponibilidad: 'DISPONIBLE',
    versionId: Number(filas[0].cat_version_id),
    filas: filas.map((fila) => ({
      riesgo: fila.riesgo_codigo,
      proteccion: fila.proteccion_codigo,
      prioridad: fila.prioridad_codigo
    }))
  };
}

function PresentarCatalogo(filas, codigo) {
  const items = filas
    .filter((fila) => fila.codigo_catalogo === codigo)
    .filter((fila) => fila.codigo !== 'OTRA' && fila.codigo !== 'OTRO')
    .map((fila) => ({
      itemId: Number(fila.cat_item_id),
      codigo: fila.codigo,
      etiqueta: fila.etiqueta
    }));
  if (items.length === 0) {
    return {
      disponibilidad: 'NEEDS_VALIDATION',
      items: [],
      mensaje: `No hay ítems vigentes de ${codigo}. No se inventan valores.`
    };
  }
  return { disponibilidad: 'DISPONIBLE', items };
}

function ResolverPrioridad(matriz, riesgo, proteccion) {
  if (matriz.disponibilidad !== 'DISPONIBLE') {
    throw new ErrorValidacion(matriz.mensaje);
  }
  const calculada = CalcularPrioridadRn009(riesgo, proteccion);
  const fila = matriz.filas.find((item) => item.riesgo === riesgo && item.proteccion === proteccion);
  if (!calculada || !fila || fila.prioridad !== calculada) {
    throw new ErrorConflicto(
      'La matriz vigente no coincide con la regla RN-009. La prioridad no se registró.'
    );
  }
  return { prioridadCodigo: calculada, matrizVersionId: matriz.versionId };
}

function ValidarCategorias(instrumento, respuestas) {
  if (instrumento.disponibilidad !== 'DISPONIBLE') {
    throw new ErrorValidacion(instrumento.mensaje);
  }
  const porId = new Map(respuestas.map((respuesta) => [respuesta.categoriaId, respuesta]));
  const conocidas = new Set(instrumento.categorias.map((categoria) => categoria.categoriaId));
  for (const categoriaId of porId.keys()) {
    if (!conocidas.has(categoriaId)) {
      throw new ErrorValidacion('Una categoría no pertenece al instrumento vigente.');
    }
  }
  const pendientes = [];
  const categorias = [];
  for (const categoria of instrumento.categorias) {
    const respuesta = porId.get(categoria.categoriaId);
    if (!respuesta) {
      if (categoria.esRequerida) {
        pendientes.push(categoria.etiqueta);
      }
      continue;
    }
    const catalogo = new Map(categoria.factores.map((factor) => [factor.factorId, factor]));
    const vistos = new Set();
    const factores = respuesta.factores.map((factor) => {
      const definido = catalogo.get(factor.factorId);
      if (!definido || vistos.has(factor.factorId)) {
        throw new ErrorValidacion('Un factor no pertenece a la categoría o está repetido.');
      }
      vistos.add(factor.factorId);
      if (definido.esAbierto && !factor.especificacion) {
        throw new ErrorValidacion('Un factor abierto exige la especificación correspondiente.');
      }
      return factor;
    });
    categorias.push({
      categoriaId: categoria.categoriaId,
      respuesta: respuesta.respuesta,
      factores
    });
  }
  if (pendientes.length > 0) {
    throw new ErrorValidacion(`Falta responder: ${pendientes.join(', ')}.`);
  }
  return categorias;
}

function PresentarCasoLista(fila, nombre) {
  const item = {
    casoId: Number(fila.caso_id),
    identificacion: fila.per_id_persona,
    nombre: nombre ? nombre.fullName : null,
    origenNombre: nombre ? 'VIGENTE' : 'NO_DISPONIBLE',
    establecimientoId: Number(fila.establecimiento_id),
    estado: fila.estado,
    prioridadCodigo: fila.prioridad_codigo,
    prioridadEtiqueta: ETIQUETA_PRIORIDAD[fila.prioridad_codigo] || fila.prioridad_codigo,
    fechaApertura: fila.fecha_apertura,
    fechaCierre: fila.fecha_cierre
  };
  if (fila.oficina_local_id !== undefined && fila.oficina_local_id !== null) {
    item.oficinaLocalId = Number(fila.oficina_local_id);
  }
  if (fila.region_id !== undefined && fila.region_id !== null) {
    item.regionId = Number(fila.region_id);
  }
  return item;
}

function CeldaCsv(valor) {
  const texto = String(valor ?? '');
  const protegido = /^[=+\-@\t\r]/.test(texto) ? `'${texto}` : texto;
  return `"${protegido.replaceAll('"', '""')}"`;
}

const RESTRICCION_CLINICA = 'Notas, factores, diagnósticos, riesgo, protección, '
  + 'contacto y texto clínico no se incluyen. NEEDS_VALIDATION.';

/**
 * Servicio del proceso interdisciplinario.
 * Vuelve a exigir capacidad y ámbito. No calcula riesgo ni protección.
 *
 * @param {object} dependencias Repositorio, adaptador y periodo.
 * @returns {object} Operaciones del módulo.
 */
function CrearServicioProceso(dependencias) {
  const repositorio = dependencias.repositorio;
  const adaptador = dependencias.adaptador;
  const periodoId = dependencias.periodId;
  const territorio = PuertoTerritorial(adaptador);

  async function Ambito(acceso, establecimientoId) {
    return ResolverAmbitoTerritorial(acceso, {
      regionId: null,
      localOfficeId: null,
      establishmentId: establecimientoId ?? null
    }, territorio);
  }

  async function AmbitoConsulta(acceso, consulta) {
    const pedido = consulta || {};
    return ResolverAmbitoTerritorial(acceso, {
      regionId: pedido.regionId ?? null,
      localOfficeId: pedido.localOfficeId ?? null,
      establishmentId: pedido.establecimientoId ?? null
    }, territorio);
  }

  function ExigirLecturaCasos(acceso) {
    ExigirCapacidad(acceso, CAPABILITY.CASE_READ);
    const nivel = acceso && acceso.accessLevel;
    if (nivel !== ACCESS_LEVEL.LOCAL_OFFICE
      && nivel !== ACCESS_LEVEL.REGION
      && nivel !== ACCESS_LEVEL.NATIONAL) {
      throw new ErrorProhibido('La operación no está permitida.');
    }
  }

  function ExigirOficina(acceso, capacidad) {
    ExigirCapacidad(acceso, capacidad);
    if (!acceso || acceso.accessLevel !== ACCESS_LEVEL.LOCAL_OFFICE) {
      throw new ErrorProhibido('La operación no está permitida.');
    }
  }

  async function Nombres(ambito, identificaciones) {
    const nombres = new Map();
    await Promise.all(identificaciones.map(async (identificacion) => {
      try {
        const filas = await adaptador.BuscarPersonaEnAmbito({
          periodId: periodoId,
          personId: identificacion,
          scope: ambito
        });
        if (filas.length === 1 && Number(filas[0].location_count) === 1) {
          nombres.set(identificacion, { fullName: NombreCompleto(filas[0]) });
        }
      } catch (error) {
        if (error && error.expose === true) {
          throw error;
        }
      }
    }));
    return nombres;
  }

  async function IdentificacionesPorNombre(ambito, nombre) {
    const resultado = await adaptador.BuscarPersonas({
      mode: 'name',
      periodId: periodoId,
      text: nombre,
      scope: ambito,
      offset: 0,
      pageSize: LIMITE_NOMBRES
    });
    if (resultado.total > LIMITE_NOMBRES) {
      throw new ErrorValidacion('La búsqueda por nombre es demasiado amplia. Precise el criterio.');
    }
    return resultado.items.map((fila) => fila.person_id);
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
          throw new ErrorConflicto('La operación no pudo confirmarse por concurrencia. Intente de nuevo.');
        }
      }
    }
    throw new ErrorInfraestructura('La operación de base de datos no se completó.');
  }

  async function CargarMatriz() {
    return AgruparMatriz(await repositorio.ListarMatrizVigente());
  }

  async function LeerIndicadorAtenciones(ambito) {
    try {
      const conteo = await repositorio.ContarAtencionesAmbito(ambito);
      return {
        disponibilidad: conteo.grupalesDisponibles ? 'DISPONIBLE' : 'PARCIAL',
        cantidad: conteo.individuales,
        grupalesConAsistencia: conteo.grupalesDisponibles ? conteo.grupales : null,
        motivo: conteo.grupalesDisponibles
          ? null
          : 'La asistencia grupal no está disponible para la cuenta técnica actual.'
      };
    } catch (error) {
      if (error && error.code === 'PERMISO') {
        return {
          disponibilidad: 'BLOQUEADO',
          cantidad: null,
          grupalesConAsistencia: null,
          motivo: 'La consulta de atenciones no está disponible para la cuenta técnica actual.'
        };
      }
      return TraducirPersistencia(error, {});
    }
  }

  async function LeerProximasAcciones(ambito) {
    try {
      const filas = await repositorio.ListarProximasAcciones(ambito, FechaHoy(), LIMITE_ACCIONES);
      return {
        disponibilidad: 'DISPONIBLE',
        cantidad: filas.length,
        items: filas.map((fila) => ({
          casoId: Number(fila.caso_id),
          identificacion: fila.per_id_persona,
          fecha: fila.fecha_proxima,
          accion: fila.proxima_accion
        }))
      };
    } catch (error) {
      if (error && error.code === 'PERMISO') {
        return {
          disponibilidad: 'BLOQUEADO',
          cantidad: null,
          items: null,
          motivo: 'Las próximas acciones no están disponibles para la cuenta técnica actual.'
        };
      }
      return TraducirPersistencia(error, {});
    }
  }

  async function LeerActividadesVencidas(oficinaLocalId) {
    try {
      const cantidad = await repositorio.ContarActividadesVencidas(oficinaLocalId, FechaHoy());
      return {
        disponibilidad: 'DISPONIBLE',
        cantidad,
        motivo: cantidad > 0
          ? 'Hay actividades vencidas. Siguen programadas después de su fecha.'
          : null
      };
    } catch (error) {
      if (error && error.code === 'PERMISO') {
        return {
          disponibilidad: 'BLOQUEADO',
          cantidad: null,
          motivo: 'La programación no está disponible para la cuenta técnica actual.'
        };
      }
      return TraducirPersistencia(error, {});
    }
  }

  async function PrepararAbordaje(solicitud) {
    const catalogo = await repositorio.ListarCatalogo(['ESTRATEGIA', 'DISCIPLINA', 'FRECUENCIA']);
    const estrategias = PresentarCatalogo(catalogo, 'ESTRATEGIA');
    const disciplinas = PresentarCatalogo(catalogo, 'DISCIPLINA');
    const frecuencias = PresentarCatalogo(catalogo, 'FRECUENCIA');
    if (estrategias.disponibilidad !== 'DISPONIBLE' || disciplinas.disponibilidad !== 'DISPONIBLE') {
      throw new ErrorValidacion(
        'Falta el catálogo vigente de estrategias o disciplinas. No se inventan valores.'
      );
    }
    const frecuencia = (frecuencias.items || []).find((item) => item.codigo === solicitud.frecuenciaCodigo);
    if (!frecuencia) {
      throw new ErrorValidacion('La frecuencia no pertenece al catálogo vigente.');
    }
    const estrategiasValidas = new Set(estrategias.items.map((item) => item.itemId));
    const disciplinasValidas = new Set(disciplinas.items.map((item) => item.itemId));
    for (const itemId of solicitud.estrategias) {
      if (!estrategiasValidas.has(itemId)) {
        throw new ErrorValidacion('Una estrategia no pertenece al catálogo vigente.');
      }
    }
    for (const itemId of solicitud.disciplinas) {
      if (!disciplinasValidas.has(itemId)) {
        throw new ErrorValidacion('Una disciplina no pertenece al catálogo vigente.');
      }
    }
    return {
      ...solicitud,
      frecuenciaItemId: frecuencia.itemId
    };
  }

  return {
    ObtenerContexto(acceso) {
      const nivel = acceso && acceso.accessLevel ? acceso.accessLevel : null;
      return {
        identidad: acceso && acceso.principalId ? acceso.principalId : null,
        nivel,
        puedeBuscarPersonas: TieneCapacidad(acceso, CAPABILITY.PERSON_SEARCH),
        puedeCrearReferencia: TieneCapacidad(acceso, CAPABILITY.REFERRAL_CREATE),
        puedeConsultarReferencias: TieneCapacidad(acceso, CAPABILITY.REFERRAL_READ),
        puedeGestionarSesiones: TieneCapacidad(acceso, CAPABILITY.SESSION_MANAGE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeRegistrarValoracion: TieneCapacidad(acceso, CAPABILITY.ASSESSMENT_WRITE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeAbrirCaso: TieneCapacidad(acceso, CAPABILITY.CASE_OPEN)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeVerListaSimplificada: TieneCapacidad(acceso, CAPABILITY.CASE_SUMMARY_READ)
          && nivel === ACCESS_LEVEL.ESTABLISHMENT,
        puedeVerCasosOficina: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeVerCasosRegion: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && nivel === ACCESS_LEVEL.REGION,
        puedeVerCasosNacional: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && nivel === ACCESS_LEVEL.NATIONAL,
        puedeVerDetalleCaso: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeVerDetalleConsulta: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && (nivel === ACCESS_LEVEL.REGION || nivel === ACCESS_LEVEL.NATIONAL),
        puedeExportarCasos: TieneCapacidad(acceso, CAPABILITY.CASE_READ)
          && (nivel === ACCESS_LEVEL.LOCAL_OFFICE
            || nivel === ACCESS_LEVEL.REGION
            || nivel === ACCESS_LEVEL.NATIONAL),
        puedeRegistrarAtencion: TieneCapacidad(acceso, CAPABILITY.ATTENTION_WRITE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeConsultarSeguimiento: TieneCapacidad(acceso, CAPABILITY.ATTENTION_DETAIL_READ)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeRegistrarCoordinacion: TieneCapacidad(acceso, CAPABILITY.COORDINATION_WRITE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeGenerarReporte: TieneCapacidad(acceso, CAPABILITY.CASE_REPORT_WRITE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeCerrarCaso: TieneCapacidad(acceso, CAPABILITY.CASE_CLOSE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeConsultarProgramacion: TieneCapacidad(acceso, CAPABILITY.SCHEDULING_READ)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeGestionarProgramacion: TieneCapacidad(acceso, CAPABILITY.SCHEDULING_MANAGE)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeConsultarReporteria: TieneCapacidad(acceso, CAPABILITY.REPORTING_READ)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE,
        puedeDescargarConsolidacion: TieneCapacidad(acceso, CAPABILITY.REPORTING_EXPORT)
          && nivel === ACCESS_LEVEL.LOCAL_OFFICE
      };
    },

    async ObtenerResumen(acceso) {
      const contexto = this.ObtenerContexto(acceso);
      if (contexto.nivel !== ACCESS_LEVEL.ESTABLISHMENT && contexto.nivel !== ACCESS_LEVEL.LOCAL_OFFICE) {
        return {
          nivel: contexto.nivel,
          indicadores: {
            posiblesReferencias: IndicadorNoDisponible(
              'La detección de posibles referencias no forma parte de este lote.'
            ),
            actividadesVencidas: IndicadorNoDisponible(
              'La programación operativa no forma parte de este lote.'
            ),
            proximasAcciones: IndicadorNoDisponible(
              'El seguimiento de atenciones no forma parte de este lote.'
            )
          },
          mensaje: 'Los indicadores de inicio regional y nacional no forman parte '
            + 'de este lote. La consulta de casos está en Casos.'
        };
      }
      const ambito = await Ambito(acceso, null);
      const referencias = await Reintentar(
        () => repositorio.ContarReferencias(ambito, null),
        {}
      );
      const pendientes = await Reintentar(
        () => repositorio.ContarReferencias(ambito, 'PENDIENTE_REVISION'),
        {}
      );
      let casos = { disponibilidad: 'DISPONIBLE', cantidad: null, personas: null };
      try {
        const conteo = await repositorio.ContarCasos(ambito, 'ACTIVO');
        casos = { disponibilidad: 'DISPONIBLE', cantidad: conteo.total, personas: conteo.personas };
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          casos = {
            disponibilidad: 'BLOQUEADO',
            cantidad: null,
            personas: null,
            motivo: 'La consulta de casos no está disponible para la cuenta técnica actual.'
          };
        } else {
          TraducirPersistencia(error, {});
        }
      }
      const resumen = {
        nivel: contexto.nivel,
        referencias: { disponibilidad: 'DISPONIBLE', cantidad: referencias },
        referenciasPendientes: { disponibilidad: 'DISPONIBLE', cantidad: pendientes },
        casosActivos: casos,
        posiblesReferencias: IndicadorNoDisponible(
          'La detección de posibles referencias no forma parte de este lote.'
        ),
        atencionesRegistradas: await LeerIndicadorAtenciones(ambito),
        proximasAcciones: await LeerProximasAcciones(ambito),
        actividadesVencidas: contexto.nivel === ACCESS_LEVEL.LOCAL_OFFICE
          ? await LeerActividadesVencidas(ambito.localOfficeId)
          : IndicadorNoDisponible(
            'La programación se consulta en el ámbito de Oficina Local.'
          )
      };
      if (contexto.nivel === ACCESS_LEVEL.LOCAL_OFFICE) {
        try {
          const sesiones = await repositorio.ListarProximasSesiones(ambito.localOfficeId, FechaHoy());
          resumen.proximasSesiones = {
            disponibilidad: 'DISPONIBLE',
            items: sesiones.map((fila) => ({
              sesionId: Number(fila.sesion_id),
              fecha: fila.fecha,
              horaInicio: fila.hora_inicio,
              lugar: fila.lugar
            }))
          };
        } catch (error) {
          if (error && error.code === 'PERMISO') {
            resumen.proximasSesiones = {
              disponibilidad: 'BLOQUEADO',
              items: null,
              motivo: 'La consulta de sesiones no está disponible para la cuenta técnica actual.'
            };
          } else {
            TraducirPersistencia(error, {});
          }
        }
      }
      return resumen;
    },

    async ListarCatalogos(acceso) {
      ExigirOficina(acceso, CAPABILITY.SESSION_MANAGE);
      const bloqueado = {
        disponibilidad: 'BLOQUEADO',
        items: [],
        mensaje: 'El catálogo no está disponible para la cuenta técnica actual.'
      };
      const [filas, instrumento, matriz] = await Promise.all([
        SiPermiso(
          () => repositorio.ListarCatalogo(['DISCIPLINA', 'ESTRATEGIA', 'FRECUENCIA']),
          null
        ),
        SiPermiso(
          () => repositorio.ListarInstrumentoVigente().then(AgruparInstrumento),
          {
            disponibilidad: 'BLOQUEADO',
            mensaje: 'El instrumento no está disponible para la cuenta técnica actual.'
          }
        ),
        SiPermiso(
          () => repositorio.ListarMatrizVigente().then(AgruparMatriz),
          {
            disponibilidad: 'BLOQUEADO',
            mensaje: 'La matriz de prioridad no está disponible para la cuenta técnica actual.'
          }
        )
      ]);
      return {
        disciplinas: filas ? PresentarCatalogo(filas, 'DISCIPLINA') : bloqueado,
        estrategias: filas ? PresentarCatalogo(filas, 'ESTRATEGIA') : bloqueado,
        frecuencias: filas ? PresentarCatalogo(filas, 'FRECUENCIA') : bloqueado,
        instrumento,
        matriz: {
          disponibilidad: matriz.disponibilidad,
          mensaje: matriz.mensaje || null
        }
      };
    },

    async CalcularPrioridad(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.ASSESSMENT_WRITE);
      const matriz = await CargarMatriz();
      const prioridad = ResolverPrioridad(matriz, solicitud.riesgoCodigo, solicitud.proteccionCodigo);
      return {
        riesgoCodigo: solicitud.riesgoCodigo,
        riesgoEtiqueta: ETIQUETA_RIESGO[solicitud.riesgoCodigo],
        proteccionCodigo: solicitud.proteccionCodigo,
        proteccionEtiqueta: ETIQUETA_PROTECCION[solicitud.proteccionCodigo],
        prioridadCodigo: prioridad.prioridadCodigo,
        prioridadEtiqueta: ETIQUETA_PRIORIDAD[prioridad.prioridadCodigo],
        editable: false
      };
    },

    async CrearSesion(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.SESSION_MANAGE);
      const catalogo = await repositorio.ListarCatalogo(['DISCIPLINA']);
      const disciplinas = PresentarCatalogo(catalogo, 'DISCIPLINA');
      const permitidas = new Set((disciplinas.items || []).map((item) => item.itemId));
      for (const disciplinaId of solicitud.disciplinas) {
        if (!permitidas.has(disciplinaId)) {
          throw new ErrorValidacion('Una disciplina no pertenece al catálogo vigente.');
        }
      }
      const ambito = await Ambito(acceso, null);
      const sesionId = await Reintentar(() => repositorio.CrearSesion({
        oficinaLocalId: ambito.localOfficeId,
        fecha: solicitud.fecha,
        horaInicio: solicitud.horaInicio,
        horaFin: solicitud.horaFin,
        lugar: solicitud.lugar,
        disciplinas: solicitud.disciplinas,
        responsable: ExigirResponsable(acceso),
        rol: acceso.accessLevel,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), { duplicado: 'No se pudo registrar la sesión.' });
      return {
        sesionId,
        advertencia: disciplinas.disponibilidad === 'DISPONIBLE' ? null : disciplinas.mensaje
      };
    },

    async ListarSesiones(acceso) {
      ExigirOficina(acceso, CAPABILITY.SESSION_MANAGE);
      const ambito = await Ambito(acceso, null);
      const filas = await SiPermiso(
        () => repositorio.ListarSesiones(ambito.localOfficeId),
        null
      );
      if (!filas) {
        return {
          disponibilidad: 'BLOQUEADO',
          total: null,
          items: [],
          motivo: 'La consulta de sesiones no está disponible para la cuenta técnica actual.'
        };
      }
      return {
        disponibilidad: 'DISPONIBLE',
        total: filas.length,
        items: filas.map((fila) => ({
          sesionId: Number(fila.sesion_id),
          fecha: fila.fecha,
          horaInicio: fila.hora_inicio,
          horaFin: fila.hora_fin,
          lugar: fila.lugar
        }))
      };
    },

    async ObtenerSesion(acceso, sesionId) {
      ExigirOficina(acceso, CAPABILITY.SESSION_MANAGE);
      const ambito = await Ambito(acceso, null);
      const encontrada = await repositorio.ObtenerSesion(sesionId, ambito.localOfficeId);
      if (!encontrada) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      return {
        sesionId: Number(encontrada.sesion.sesion_id),
        fecha: encontrada.sesion.fecha,
        horaInicio: encontrada.sesion.hora_inicio,
        horaFin: encontrada.sesion.hora_fin,
        lugar: encontrada.sesion.lugar,
        disciplinas: encontrada.disciplinas.map((fila) => ({
          itemId: Number(fila.disciplina_item_id),
          codigo: fila.codigo,
          etiqueta: fila.etiqueta
        })),
        situaciones: encontrada.situaciones.map((fila) => ({
          situacionId: Number(fila.situacion_id),
          referenciaId: fila.referencia_id === null ? null : Number(fila.referencia_id),
          casoId: fila.caso_id === null ? null : Number(fila.caso_id)
        }))
      };
    },

    async AsociarSituacion(acceso, sesionId, solicitud) {
      ExigirOficina(acceso, CAPABILITY.SESSION_MANAGE);
      const ambito = await Ambito(acceso, null);
      const sesion = await repositorio.ObtenerSesion(sesionId, ambito.localOfficeId);
      if (!sesion) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      if (solicitud.referenciaId !== null) {
        const referencia = await repositorio.BuscarReferencia(solicitud.referenciaId, ambito);
        if (!referencia || referencia.estado !== 'PENDIENTE_REVISION') {
          throw new ErrorNoEncontrado(NO_ENCONTRADO);
        }
      } else {
        const caso = await repositorio.BuscarCasoActivo(solicitud.casoId, ambito);
        if (!caso) {
          throw new ErrorNoEncontrado(NO_ENCONTRADO);
        }
      }
      const situacionId = await Reintentar(() => repositorio.AsociarSituacion({
        sesionId,
        referenciaId: solicitud.referenciaId,
        casoId: solicitud.casoId
      }), {});
      return { situacionId, sesionId };
    },

    async RegistrarValoracion(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.ASSESSMENT_WRITE);
      const ambito = await Ambito(acceso, null);
      const situacion = await repositorio.ObtenerSituacion(solicitud.situacionId, ambito.localOfficeId);
      if (!situacion) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      let referenciaId = situacion.referencia_id === null ? null : Number(situacion.referencia_id);
      let casoId = situacion.caso_id === null ? null : Number(situacion.caso_id);
      if (referenciaId !== null) {
        const referencia = await repositorio.BuscarReferencia(referenciaId, ambito);
        if (!referencia || referencia.estado !== 'PENDIENTE_REVISION') {
          throw new ErrorConflicto('La referencia no está pendiente de revisión.');
        }
      } else {
        const caso = await repositorio.BuscarCasoActivo(casoId, ambito);
        if (!caso) {
          throw new ErrorNoEncontrado(NO_ENCONTRADO);
        }
        referenciaId = Number(caso.referencia_id);
      }
      const instrumento = AgruparInstrumento(await repositorio.ListarInstrumentoVigente());
      const categorias = ValidarCategorias(instrumento, solicitud.categorias);
      const prioridad = ResolverPrioridad(
        AgruparMatriz(await repositorio.ListarMatrizVigente()),
        solicitud.riesgoCodigo,
        solicitud.proteccionCodigo
      );
      if (solicitud.abordaje && casoId === null) {
        throw new ErrorValidacion(
          'El abordaje se actualiza en la revaloración de un caso activo. La apertura sigue siendo un paso aparte.'
        );
      }
      const abordaje = solicitud.abordaje ? await PrepararAbordaje(solicitud.abordaje) : null;
      const anteriores = await repositorio.ContarValoraciones(referenciaId, casoId);
      const valoracionId = await Reintentar(() => repositorio.RegistrarValoracion({
        situacionId: solicitud.situacionId,
        casoId,
        referenciaId,
        instrumentoVersionId: instrumento.instrumentoVersionId,
        numero: anteriores + 1,
        matrizVersionId: prioridad.matrizVersionId,
        riesgoCodigo: solicitud.riesgoCodigo,
        proteccionCodigo: solicitud.proteccionCodigo,
        prioridadCodigo: prioridad.prioridadCodigo,
        categorias,
        abordaje,
        responsable: ExigirResponsable(acceso),
        rol: acceso.accessLevel,
        fecha: situacion.fecha,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), { duplicado: 'Ya existe una valoración vigente para esa situación.' });
      return {
        valoracionId,
        prioridadCodigo: prioridad.prioridadCodigo,
        prioridadEtiqueta: ETIQUETA_PRIORIDAD[prioridad.prioridadCodigo],
        planActualizado: Boolean(abordaje),
        editable: false
      };
    },

    async RegistrarResolucion(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.ASSESSMENT_WRITE);
      const ambito = await Ambito(acceso, null);
      const referencia = await repositorio.BuscarReferencia(solicitud.referenciaId, ambito);
      if (!referencia || referencia.estado !== 'PENDIENTE_REVISION') {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      const valoracion = await repositorio.ObtenerValoracionEnSesion(
        solicitud.valoracionId,
        solicitud.referenciaId,
        solicitud.sesionId
      );
      if (!valoracion || valoracion.caso_id !== null) {
        throw new ErrorConflicto('La valoración no corresponde a la referencia en esa sesión.');
      }
      const resolucionId = await Reintentar(() => repositorio.RegistrarResolucion({
        ...solicitud,
        fecha: FechaHoy(),
        responsable: ExigirResponsable(acceso),
        rol: acceso.accessLevel,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), { duplicado: 'La referencia ya tiene una resolución.' });
      return {
        resolucionId,
        decision: solicitud.decision,
        casoAbierto: false
      };
    },

    async AbrirCaso(acceso, solicitud) {
      ExigirOficina(acceso, CAPABILITY.CASE_OPEN);
      const ambito = await Ambito(acceso, null);
      const abordaje = await PrepararAbordaje(solicitud);
      const referencia = await repositorio.BuscarReferencia(solicitud.referenciaId, ambito);
      if (!referencia || referencia.estado !== 'PENDIENTE_REVISION') {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      const resolucion = await repositorio.ObtenerResolucion(solicitud.referenciaId);
      if (!resolucion || resolucion.decision !== 'REQUIERE_AI') {
        throw new ErrorConflicto(
          'La apertura exige una decisión profesional de que sí requiere Atención Interdisciplinaria.'
        );
      }
      const abierto = await Reintentar(() => repositorio.AbrirCaso({
        referenciaId: solicitud.referenciaId,
        valoracionId: Number(resolucion.valoracion_id),
        personaId: referencia.per_id_persona,
        oficinaLocalId: ambito.localOfficeId,
        regionId: ambito.regionId,
        frecuenciaItemId: abordaje.frecuenciaItemId,
        propositos: abordaje.propositos,
        estrategias: abordaje.estrategias,
        disciplinas: abordaje.disciplinas,
        fecha: FechaHoy(),
        responsable: ExigirResponsable(acceso),
        rol: acceso.accessLevel,
        ambitoTexto: `OL-${ambito.localOfficeId}`
      }), { duplicado: CASO_ACTIVO });
      return {
        casoId: abierto.casoId,
        identificacion: abierto.personaId,
        consecutivo: abierto.consecutivo,
        estado: 'ACTIVO'
      };
    },

    async ListarCasos(acceso, consulta) {
      const contexto = this.ObtenerContexto(acceso);
      if (!contexto.puedeVerListaSimplificada
        && !contexto.puedeVerCasosOficina
        && !contexto.puedeVerCasosRegion
        && !contexto.puedeVerCasosNacional) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      if (consulta.identificacion && consulta.nombre) {
        throw new ErrorValidacion('Use identificación o nombre, no ambos a la vez.');
      }
      const ambito = await AmbitoConsulta(acceso, consulta);
      let personas;
      if (consulta.identificacion) {
        personas = [consulta.identificacion];
      } else if (consulta.nombre) {
        personas = await IdentificacionesPorNombre(ambito, consulta.nombre);
      }
      const pagina = await repositorio.ListarCasos({ ...consulta, ambito, personas });
      const nombres = await Nombres(ambito, pagina.filas.map((fila) => fila.per_id_persona));
      return {
        consulta: {
          pagina: consulta.pagina,
          tamano: consulta.tamano,
          estado: consulta.estado,
          prioridad: consulta.prioridad,
          identificacion: consulta.identificacion,
          nombre: consulta.nombre,
          establecimientoId: consulta.establecimientoId,
          regionId: consulta.regionId || null,
          localOfficeId: consulta.localOfficeId || null
        },
        total: pagina.total,
        devueltos: pagina.filas.length,
        detallePermitido: contexto.puedeVerDetalleCaso,
        consultaPermitida: contexto.puedeVerDetalleConsulta,
        items: pagina.filas.map((fila) => PresentarCasoLista(fila, nombres.get(fila.per_id_persona)))
      };
    },

    async ExportarCasos(acceso, consulta) {
      ExigirLecturaCasos(acceso);
      const sonda = await this.ListarCasos(acceso, {
        ...consulta,
        pagina: 1,
        tamano: 1,
        desplazamiento: 0
      });
      if (sonda.total > LIMITE_EXPORTACION) {
        throw new ErrorValidacion(
          'El corte filtrado supera 2000 filas. Precise los filtros. No se exporta una página parcial.'
        );
      }
      const listado = sonda.total === 0
        ? { ...sonda, items: [] }
        : await this.ListarCasos(acceso, {
          ...consulta,
          pagina: 1,
          tamano: sonda.total,
          desplazamiento: 0
        });
      if (listado.items.length !== sonda.total) {
        throw new ErrorConflicto(
          'La exportación no coincide con el total filtrado. No se entregó un archivo parcial.'
        );
      }
      const superior = acceso.accessLevel === ACCESS_LEVEL.REGION
        || acceso.accessLevel === ACCESS_LEVEL.NATIONAL;
      const encabezado = [
        'identificacion',
        'nombre',
        'establecimiento',
        'estado',
        'prioridad',
        'fecha_apertura',
        'fecha_cierre'
      ];
      if (superior) {
        encabezado.push('oficina_local', 'region');
      }
      const lineas = listado.items.map((item) => {
        const celdas = [
          item.identificacion,
          item.nombre || '',
          String(item.establecimientoId),
          item.estado,
          item.prioridadEtiqueta,
          item.fechaApertura || '',
          item.fechaCierre || ''
        ];
        if (superior) {
          celdas.push(
            item.oficinaLocalId === undefined ? '' : String(item.oficinaLocalId),
            item.regionId === undefined ? '' : String(item.regionId)
          );
        }
        return celdas.map(CeldaCsv).join(',');
      });
      return {
        contenido: [encabezado.join(','), ...lineas].join('\n'),
        total: listado.total
      };
    },

    async ObtenerCaso(acceso, casoId) {
      ExigirOficina(acceso, CAPABILITY.CASE_READ);
      if (!TieneCapacidad(acceso, CAPABILITY.ASSESSMENT_READ)) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      const ambito = await Ambito(acceso, null);
      let detalle;
      try {
        detalle = await repositorio.ObtenerDetalleCaso(casoId, ambito);
      } catch (error) {
        TraducirPersistencia(error, {});
      }
      if (!detalle) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      const nombres = await Nombres(ambito, [detalle.caso.per_id_persona]);
      const nombre = nombres.get(detalle.caso.per_id_persona);
      let ultimaAtencion = { disponibilidad: 'DISPONIBLE', fecha: null, mensaje: 'Sin atención registrada.' };
      try {
        const fecha = await repositorio.ObtenerUltimaAtencion(casoId);
        ultimaAtencion = fecha
          ? { disponibilidad: 'DISPONIBLE', fecha, mensaje: null }
          : ultimaAtencion;
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          ultimaAtencion = {
            disponibilidad: 'BLOQUEADO',
            fecha: null,
            mensaje: 'La consulta de atenciones no está disponible para la cuenta técnica actual.'
          };
        } else {
          TraducirPersistencia(error, {});
        }
      }
      const vigente = detalle.valoraciones.find((fila) => fila.es_vigente === true || fila.es_vigente === 1);
      const individuales = await LeerOpcional(() => repositorio.ListarAtencionesIndividuales(casoId));
      const grupales = await LeerOpcional(() => repositorio.ListarParticipacionesGrupales(casoId));
      const planes = await LeerOpcional(() => repositorio.ListarPlanesCaso(casoId));
      const documentos = await LeerOpcional(() => repositorio.ContarDocumentosCaso(casoId));
      const coordinaciones = await LeerOpcional(() => repositorio.ListarCoordinacionesCaso(casoId));
      const reportes = await LeerOpcional(() => repositorio.ListarReportesCaso(casoId));
      const cierre = await LeerOpcional(() => repositorio.ObtenerCierreCaso(casoId));
      const atenciones = individuales.disponibilidad === 'DISPONIBLE'
        ? individuales.datos.map((fila) => ({
          atencionId: Number(fila.atencion_individual_id),
          fechaAtencion: fila.fecha_atencion,
          fechaRegistro: fila.digitada_en,
          acciones: fila.acciones,
          recomendaciones: fila.recomendaciones,
          profesional: fila.profesional_usuario,
          proximaAccion: fila.proxima_accion,
          fechaProxima: fila.fecha_proxima
        }))
        : [];
      const participaciones = grupales.disponibilidad === 'DISPONIBLE'
        ? grupales.datos.map((fila) => ({
          atencionGrupalId: Number(fila.atencion_grupal_id),
          fechaAtencion: fila.fecha_atencion,
          tema: fila.tema,
          asistio: fila.asistio === true || fila.asistio === 1
            ? true
            : (fila.asistio === false || fila.asistio === 0 ? false : null)
        }))
        : [];
      const versionesPlan = planes.disponibilidad === 'DISPONIBLE'
        ? planes.datos.map((fila) => ({
          planId: Number(fila.plan_id),
          numero: Number(fila.numero_version),
          vigente: fila.es_vigente === true || fila.es_vigente === 1,
          fecha: fila.fecha_plan,
          responsable: fila.responsable_usuario,
          frecuenciaEtiqueta: fila.frecuencia_etiqueta
        }))
        : [];
      const valoraciones = detalle.valoraciones.map((fila) => ({
        valoracionId: Number(fila.valoracion_id),
        numero: Number(fila.numero),
        vigente: fila.es_vigente === true || fila.es_vigente === 1,
        riesgoCodigo: fila.riesgo_codigo,
        proteccionCodigo: fila.proteccion_codigo,
        prioridadCodigo: fila.prioridad_codigo,
        prioridadEtiqueta: ETIQUETA_PRIORIDAD[fila.prioridad_codigo],
        responsable: fila.responsable_usuario,
        fecha: fila.fecha_valoracion,
        sesionId: Number(fila.sesion_id),
        fechaSesion: fila.fecha_sesion,
        instrumentoVersionId: fila.instrumento_version_id === undefined
          || fila.instrumento_version_id === null
          ? null
          : Number(fila.instrumento_version_id)
      }));
      const historial = detalle.historial.map((fila) => ({
        estado: fila.estado,
        ocurridoEn: fila.ocurrido_en
      }));
      const registrosCoordinacion = coordinaciones.disponibilidad === 'DISPONIBLE'
        ? coordinaciones.datos.map((fila) => ({
          coordinacionId: Number(fila.coordinacion_id),
          institucion: fila.institucion_texto,
          profesional: fila.profesional_responsable,
          digitador: fila.digitador_usuario,
          motivo: fila.motivo,
          fecha: fila.fecha_coordinacion,
          estado: fila.estado_texto
        }))
        : [];
      const registrosReporte = reportes.disponibilidad === 'DISPONIBLE'
        ? reportes.datos.map((fila) => ({
          reporteId: Number(fila.reporte_id),
          tipoProposito: fila.tipo_proposito,
          fecha: fila.fecha_reporte,
          responsable: fila.responsable_usuario,
          motivo: fila.motivo,
          creadoEn: fila.creado_en,
          conservacion: 'METADATOS'
        }))
        : [];
      const registroCierre = cierre.disponibilidad === 'DISPONIBLE' && cierre.datos
        ? {
          motivoCodigo: cierre.datos.motivo_codigo,
          motivoEtiqueta: cierre.datos.motivo_etiqueta,
          explicacion: cierre.datos.explicacion,
          fecha: cierre.datos.fecha_cierre,
          responsable: cierre.datos.responsable_usuario,
          destinoEstablecimientoId: IdentificadorOpcional(
            cierre.datos.destino_establecimiento_id
          ),
          destinoOficinaLocalId: IdentificadorOpcional(
            cierre.datos.destino_oficina_local_id
          ),
          destinoRegionId: IdentificadorOpcional(cierre.datos.destino_region_id),
          destinoNombre: cierre.datos.destino_nombre,
          casoDestinoCreado: false
        }
        : null;
      const consultaIndividual = {
        disponibilidad: individuales.disponibilidad,
        mensaje: individuales.disponibilidad === 'DISPONIBLE'
          ? null
          : 'La consulta de atenciones individuales no está disponible para la cuenta técnica actual.'
      };
      const consultaPlanes = {
        disponibilidad: planes.disponibilidad,
        mensaje: planes.disponibilidad === 'DISPONIBLE'
          ? null
          : 'La consulta de planes no está disponible para la cuenta técnica actual.'
      };
      return {
        casoId: Number(detalle.caso.caso_id),
        identificacion: detalle.caso.per_id_persona,
        nombre: nombre ? nombre.fullName : null,
        establecimientoId: Number(detalle.caso.establecimiento_id),
        establecimientoNombre: detalle.caso.establecimiento_nombre,
        consecutivo: detalle.caso.consecutivo_origen,
        estado: detalle.caso.estado,
        fechaApertura: detalle.caso.fecha_apertura,
        fechaCierre: registroCierre ? registroCierre.fecha : null,
        prioridadCodigo: vigente ? vigente.prioridad_codigo : null,
        prioridadEtiqueta: vigente ? ETIQUETA_PRIORIDAD[vigente.prioridad_codigo] : null,
        riesgoCodigo: vigente ? vigente.riesgo_codigo : null,
        proteccionCodigo: vigente ? vigente.proteccion_codigo : null,
        contextoIngreso: {
          encargado: detalle.caso.encargado_nombre,
          relacion: detalle.caso.relacion_encargado,
          contacto: detalle.caso.contacto,
          direccion: detalle.caso.direccion
        },
        valoraciones,
        factores: detalle.factores.map((fila) => ({
          valoracionId: Number(fila.valoracion_id),
          eje: fila.eje,
          ambito: fila.ambito,
          etiqueta: fila.etiqueta,
          especificacion: fila.especificacion
        })),
        plan: detalle.plan ? {
          frecuenciaCodigo: detalle.plan.frecuencia_codigo,
          frecuenciaEtiqueta: detalle.plan.frecuencia_etiqueta,
          propositos: detalle.plan.propositos.map((fila) => fila.texto),
          estrategias: detalle.plan.estrategias.map((fila) => fila.etiqueta),
          disciplinas: detalle.plan.disciplinas.map((fila) => fila.etiqueta)
        } : null,
        historial,
        planes: versionesPlan,
        atenciones,
        participacionesGrupales: participaciones,
        consultaIndividual,
        consultaGrupal: {
          disponibilidad: grupales.disponibilidad,
          mensaje: grupales.disponibilidad === 'DISPONIBLE'
            ? null
            : 'La asistencia grupal no está disponible para la cuenta técnica actual.'
        },
        consultaPlanes,
        documentos: PresentarConteo(
          documentos,
          'Sin documentos registrados.',
          'La consulta de documentos no está disponible para la cuenta técnica actual.'
        ),
        coordinaciones: {
          disponibilidad: coordinaciones.disponibilidad,
          cantidad: coordinaciones.disponibilidad === 'DISPONIBLE'
            ? registrosCoordinacion.length
            : null,
          registros: registrosCoordinacion,
          mensaje: coordinaciones.disponibilidad === 'DISPONIBLE'
            ? (registrosCoordinacion.length === 0 ? 'Sin coordinaciones registradas.' : null)
            : 'La consulta de coordinaciones no está disponible para la cuenta técnica actual.'
        },
        reportes: {
          disponibilidad: reportes.disponibilidad,
          cantidad: reportes.disponibilidad === 'DISPONIBLE' ? registrosReporte.length : null,
          registros: registrosReporte,
          mensaje: reportes.disponibilidad === 'DISPONIBLE'
            ? (registrosReporte.length === 0
              ? 'Sin reportes conservados.'
              : 'Cada reporte conserva fecha, tipo, responsable y motivo.')
            : 'La consulta de reportes no está disponible para la cuenta técnica actual.'
        },
        cierre: {
          disponibilidad: cierre.disponibilidad,
          registro: registroCierre,
          mensaje: cierre.disponibilidad === 'DISPONIBLE'
            ? (registroCierre ? null : 'Sin cierre registrado.')
            : 'La consulta del cierre no está disponible para la cuenta técnica actual.'
        },
        lineaTiempo: ConstruirLineaTiempo({
          historial,
          valoraciones,
          planes: versionesPlan,
          atenciones,
          grupales: participaciones,
          coordinaciones: registrosCoordinacion,
          reportes: registrosReporte,
          cierre: registroCierre
        }),
        ultimaAtencion,
        coberturaHistorial: [
          grupales,
          individuales,
          planes,
          coordinaciones,
          reportes,
          cierre,
          documentos
        ].every((lectura) => lectura.disponibilidad === 'DISPONIBLE')
          ? 'OPERATIVA'
          : 'PARCIAL',
        pendientes: [
          consultaIndividual.mensaje,
          grupales.disponibilidad === 'DISPONIBLE'
            ? null
            : 'La asistencia grupal no está disponible para la cuenta técnica actual.',
          consultaPlanes.mensaje,
          coordinaciones.disponibilidad === 'DISPONIBLE'
            ? null
            : 'La consulta de coordinaciones no está disponible para la cuenta técnica actual.',
          reportes.disponibilidad === 'DISPONIBLE'
            ? null
            : 'La consulta de reportes no está disponible para la cuenta técnica actual.',
          cierre.disponibilidad === 'DISPONIBLE'
            ? null
            : 'La consulta del cierre no está disponible para la cuenta técnica actual.'
        ].filter(Boolean)
      };
    },

    async ObtenerConsultaCaso(acceso, casoId) {
      ExigirLecturaCasos(acceso);
      if (acceso.accessLevel !== ACCESS_LEVEL.REGION
        && acceso.accessLevel !== ACCESS_LEVEL.NATIONAL) {
        throw new ErrorProhibido('La operación no está permitida.');
      }
      const ambito = await AmbitoConsulta(acceso, {});
      let cabecera;
      try {
        cabecera = await repositorio.ObtenerCabeceraConsulta(casoId, ambito);
      } catch (error) {
        TraducirPersistencia(error, {});
      }
      if (!cabecera) {
        throw new ErrorNoEncontrado(NO_ENCONTRADO);
      }
      const nombres = await Nombres(ambito, [cabecera.per_id_persona]);
      const nombre = nombres.get(cabecera.per_id_persona);
      const historial = await LeerOpcional(() => repositorio.ListarHistorialConsulta(casoId));
      const valoraciones = await LeerOpcional(
        () => repositorio.ListarValoracionesConsulta(casoId)
      );
      const planes = await LeerOpcional(() => repositorio.ListarPlanesConsulta(casoId));
      const plan = await LeerOpcional(() => repositorio.ObtenerPlanVigenteConsulta(casoId));
      const atenciones = await LeerOpcional(() => repositorio.ListarAtencionesConsulta(casoId));
      const grupales = await LeerOpcional(() => repositorio.ListarGrupalesConsulta(casoId));
      const coordinaciones = await LeerOpcional(
        () => repositorio.ListarCoordinacionesConsulta(casoId)
      );
      const reportes = await LeerOpcional(() => repositorio.ListarReportesConsulta(casoId));
      const cierre = await LeerOpcional(() => repositorio.ObtenerCierreConsulta(casoId));
      let ultimaAtencion = {
        disponibilidad: 'DISPONIBLE',
        fecha: null,
        mensaje: 'Sin atención registrada.'
      };
      try {
        const fecha = await repositorio.ObtenerUltimaAtencion(casoId);
        if (fecha) {
          ultimaAtencion = { disponibilidad: 'DISPONIBLE', fecha, mensaje: null };
        }
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          ultimaAtencion = {
            disponibilidad: 'BLOQUEADO',
            fecha: null,
            mensaje: 'La fecha de última atención no está disponible para la cuenta técnica actual.'
          };
        } else {
          TraducirPersistencia(error, {});
        }
      }
      const eventosHistorial = historial.disponibilidad === 'DISPONIBLE'
        ? historial.datos.map((fila) => ({
          estado: fila.estado,
          ocurridoEn: fila.ocurrido_en
        }))
        : [];
      const eventosValoracion = valoraciones.disponibilidad === 'DISPONIBLE'
        ? valoraciones.datos.map((fila) => ({
          numero: Number(fila.numero),
          fecha: fila.fecha_valoracion,
          prioridadEtiqueta: ETIQUETA_PRIORIDAD[fila.prioridad_codigo]
            || fila.prioridad_codigo,
          responsable: fila.responsable_usuario
        }))
        : [];
      const eventosPlan = planes.disponibilidad === 'DISPONIBLE'
        ? planes.datos.map((fila) => ({
          numero: Number(fila.numero_version),
          vigente: fila.es_vigente === true || fila.es_vigente === 1,
          fecha: fila.fecha_plan,
          frecuenciaEtiqueta: fila.frecuencia_etiqueta,
          responsable: fila.responsable_usuario
        }))
        : [];
      const eventosAtencion = atenciones.disponibilidad === 'DISPONIBLE'
        ? atenciones.datos.map((fila) => ({ fechaAtencion: fila.fecha_atencion }))
        : [];
      const eventosGrupales = grupales.disponibilidad === 'DISPONIBLE'
        ? grupales.datos.map((fila) => ({
          fechaAtencion: fila.fecha_atencion,
          asistio: fila.asistio === true || fila.asistio === 1
        }))
        : [];
      const eventosCoordinacion = coordinaciones.disponibilidad === 'DISPONIBLE'
        ? coordinaciones.datos.map((fila) => ({
          fecha: fila.fecha_coordinacion,
          estado: fila.estado_texto
        }))
        : [];
      const eventosReporte = reportes.disponibilidad === 'DISPONIBLE'
        ? reportes.datos.map((fila) => ({ fecha: fila.fecha_reporte }))
        : [];
      const registroCierre = cierre.disponibilidad === 'DISPONIBLE' && cierre.datos
        ? {
          motivoCodigo: cierre.datos.motivo_codigo,
          motivoEtiqueta: cierre.datos.motivo_etiqueta,
          fecha: cierre.datos.fecha_cierre,
          destinoNombre: cierre.datos.destino_nombre,
          destinoEstablecimientoId: IdentificadorOpcional(
            cierre.datos.destino_establecimiento_id
          )
        }
        : null;
      const lineaTiempo = ConstruirLineaConsulta({
        historial: eventosHistorial,
        valoraciones: eventosValoracion,
        planes: eventosPlan,
        atenciones: eventosAtencion,
        grupales: eventosGrupales,
        coordinaciones: eventosCoordinacion,
        reportes: eventosReporte,
        cierre: registroCierre
      });
      const planVigente = plan.disponibilidad === 'DISPONIBLE' && plan.datos
        ? {
          frecuenciaEtiqueta: plan.datos.frecuenciaEtiqueta,
          estrategias: plan.datos.estrategias.map((fila) => fila.etiqueta),
          disciplinas: plan.datos.disciplinas.map((fila) => fila.etiqueta)
        }
        : null;
      return {
        modo: 'CONSULTA',
        soloLectura: true,
        casoId: Number(cabecera.caso_id),
        identificacion: cabecera.per_id_persona,
        nombre: nombre ? nombre.fullName : null,
        establecimientoId: Number(cabecera.establecimiento_id),
        establecimientoNombre: cabecera.establecimiento_nombre,
        oficinaLocalId: Number(cabecera.oficina_local_id),
        regionId: Number(cabecera.region_id),
        consecutivo: cabecera.consecutivo_origen,
        estado: cabecera.estado,
        fechaApertura: cabecera.fecha_apertura,
        fechaCierre: cabecera.fecha_cierre,
        prioridadCodigo: cabecera.prioridad_codigo,
        prioridadEtiqueta: cabecera.prioridad_codigo
          ? (ETIQUETA_PRIORIDAD[cabecera.prioridad_codigo] || cabecera.prioridad_codigo)
          : null,
        resumen: {
          estado: cabecera.estado,
          prioridadEtiqueta: cabecera.prioridad_codigo
            ? (ETIQUETA_PRIORIDAD[cabecera.prioridad_codigo] || cabecera.prioridad_codigo)
            : null,
          fechaApertura: cabecera.fecha_apertura,
          fechaCierre: cabecera.fecha_cierre,
          establecimientoNombre: cabecera.establecimiento_nombre,
          frecuenciaEtiqueta: planVigente ? planVigente.frecuenciaEtiqueta : null,
          ultimaAtencion
        },
        plan: planVigente,
        lineaTiempo,
        restricciones: [RESTRICCION_CLINICA]
      };
    },

    async ListarSinAtencion(acceso, consulta) {
      ExigirOficina(acceso, CAPABILITY.ATTENTION_DETAIL_READ);
      const ambito = await Ambito(acceso, null);
      let pagina;
      try {
        pagina = await repositorio.ListarCasosSinAtencion({ ...consulta, ambito });
      } catch (error) {
        if (error && error.code === 'PERMISO') {
          return {
            disponibilidad: 'BLOQUEADO',
            total: null,
            items: [],
            motivo: 'El seguimiento de atenciones no está disponible para la cuenta técnica actual.'
          };
        }
        TraducirPersistencia(error, {});
      }
      const nombres = await Nombres(ambito, pagina.filas.map((fila) => fila.per_id_persona));
      return {
        disponibilidad: 'DISPONIBLE',
        desde: consulta.desde,
        hasta: consulta.hasta,
        pagina: consulta.pagina,
        tamano: consulta.tamano,
        total: pagina.total,
        devueltos: pagina.filas.length,
        items: pagina.filas.map((fila) => {
          const nombre = nombres.get(fila.per_id_persona);
          const ultima = UltimaFecha(fila.ultima_individual, fila.ultima_grupal);
          return {
            casoId: Number(fila.caso_id),
            identificacion: fila.per_id_persona,
            nombre: nombre ? nombre.fullName : null,
            establecimientoId: Number(fila.establecimiento_id),
            ultimaAtencion: ultima,
            situacion: ultima ? 'ATENDIDO_FUERA_DEL_PERIODO' : 'SIN_ATENCION_REGISTRADA'
          };
        })
      };
    }
  };
}

module.exports = { CrearServicioProceso, PresentarCasoLista };
