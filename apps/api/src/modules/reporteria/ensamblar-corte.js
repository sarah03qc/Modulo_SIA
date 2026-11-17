/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038 y HU-039. El mismo ensamblado alimenta la API, la pantalla y la descarga.
 * No convierte un dato desconocido en cero. Un cero solo sale de un conteo realizado.
 */
'use strict';

const { AniosCumplidos } = require('../institutional/person-presenter');
const {
  PRESENTACION_TOP,
  MUESTRA_CASOS,
  PRIORIDADES,
  ESTADOS_CASO,
  MOTIVOS_CIERRE,
  TEXTO_COBERTURA,
  CATALOGO_VISUALIZACIONES,
  PorcentajeCobertura,
  ContarPalabras,
  TituloDinamico,
  EtiquetaPrioridad,
  EtiquetaEstado
} = require('./definiciones-analiticas');

function Asistio(valor) {
  return valor === true || valor === 1 || valor === '1';
}

function FechaConsulta(fecha) {
  const anio = Number(fecha.slice(0, 4));
  const mes = Number(fecha.slice(5, 7));
  const dia = Number(fecha.slice(8, 10));
  return new Date(anio, mes - 1, dia);
}

function DemografiaDe(mapa, personaId) {
  if (!personaId || !mapa) {
    return null;
  }
  return mapa.get(personaId) || null;
}

function PersonaCumple(personaId, filtros, demografia) {
  if (!filtros.sexo && filtros.edad === null) {
    return true;
  }
  const dato = DemografiaDe(demografia, personaId);
  if (filtros.sexo && (!dato || dato.sexo !== filtros.sexo)) {
    return false;
  }
  if (filtros.edad !== null && (!dato || dato.edad !== filtros.edad)) {
    return false;
  }
  return true;
}

function CasoEnEstablecimiento(caso, filtros) {
  if (!filtros.establecimientoId) {
    return true;
  }
  return caso.establecimientoId === filtros.establecimientoId;
}

function CasosDeDistribucion(hechos, filtros, demografia) {
  return hechos.casos.filter((caso) => {
    if (!CasoEnEstablecimiento(caso, filtros)) {
      return false;
    }
    if (filtros.estado !== 'TODOS' && caso.estado !== filtros.estado) {
      return false;
    }
    if (filtros.prioridad && caso.prioridad !== filtros.prioridad) {
      return false;
    }
    return PersonaCumple(caso.personaId, filtros, demografia);
  });
}

function CasosActivosCobertura(hechos, filtros, demografia) {
  return hechos.casos.filter((caso) => (
    caso.estado === 'ACTIVO'
    && CasoEnEstablecimiento(caso, filtros)
    && PersonaCumple(caso.personaId, filtros, demografia)
  ));
}

function IndividualAplica(fila, filtros, demografia, aplicarPersona) {
  if (filtros.establecimientoId && fila.establecimientoId !== filtros.establecimientoId) {
    return false;
  }
  if (filtros.disciplinaId && fila.disciplinaId !== filtros.disciplinaId) {
    return false;
  }
  if (filtros.profesional && fila.profesional !== filtros.profesional) {
    return false;
  }
  if (aplicarPersona && !PersonaCumple(fila.personaId, filtros, demografia)) {
    return false;
  }
  return true;
}

function GruposAplican(hechos, filtros) {
  const disciplinas = new Map();
  for (const fila of hechos.disciplinasGrupales) {
    const lista = disciplinas.get(fila.atencionId) || [];
    lista.push(fila.disciplinaId);
    disciplinas.set(fila.atencionId, lista);
  }
  const profesionales = new Map();
  for (const fila of hechos.profesionalesGrupales) {
    const lista = profesionales.get(fila.atencionId) || [];
    lista.push(fila.profesional);
    profesionales.set(fila.atencionId, lista);
  }
  return hechos.grupales.filter((grupo) => {
    if (filtros.establecimientoId && grupo.establecimientoId !== filtros.establecimientoId) {
      return false;
    }
    if (filtros.disciplinaId) {
      const lista = disciplinas.get(grupo.atencionId) || [];
      if (!lista.includes(filtros.disciplinaId)) {
        return false;
      }
    }
    if (filtros.profesional) {
      const lista = profesionales.get(grupo.atencionId) || [];
      if (!lista.includes(filtros.profesional)) {
        return false;
      }
    }
    return true;
  });
}

function ParticipantesEfectivos(hechos, grupos) {
  const identificadores = new Set(grupos.map((grupo) => grupo.atencionId));
  return hechos.participantes.filter((fila) => (
    identificadores.has(fila.atencionId) && Asistio(fila.asistio)
  ));
}

function CasoAtendido(casoId, individuales, participantes) {
  if (individuales.some((fila) => fila.casoId === casoId)) {
    return true;
  }
  return participantes.some((fila) => fila.casoId === casoId);
}

function Contar(serie, clave, etiqueta) {
  const actual = serie.get(clave) || { clave, etiqueta, cantidad: 0 };
  actual.cantidad += 1;
  serie.set(clave, actual);
  return serie;
}

function OrdenarSerie(serie) {
  return [...serie.values()].sort((a, b) => (
    b.cantidad - a.cantidad || String(a.etiqueta).localeCompare(String(b.etiqueta), 'es')
  ));
}

function NombreEstablecimiento(identificador, nombres) {
  if (identificador === null || identificador === undefined) {
    return 'Sin establecimiento en la actividad';
  }
  const nombre = nombres.get(identificador);
  if (nombre) {
    return nombre;
  }
  return `Establecimiento ${identificador}`;
}

function ComplementosCaso(filtros, nombres, fechaConsulta) {
  const partes = [`corte ${fechaConsulta}`];
  if (filtros.estado !== 'TODOS') {
    partes.push(`estado ${EtiquetaEstado(filtros.estado)}`);
  }
  if (filtros.prioridad) {
    partes.push(`prioridad ${EtiquetaPrioridad(filtros.prioridad)}`);
  }
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  if (filtros.sexo) {
    partes.push(`sexo ${filtros.sexo}`);
  }
  if (filtros.edad !== null) {
    partes.push(`edad ${filtros.edad} años`);
  }
  return partes;
}

function ComplementosAtencion(filtros, nombres, anio) {
  const partes = [`año ${anio}`];
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  if (filtros.disciplinaId) {
    const disciplina = (filtros.catalogoDisciplinas || []).find((item) => (
      item.itemId === filtros.disciplinaId
    ));
    partes.push(disciplina ? disciplina.etiqueta : 'disciplina seleccionada');
  }
  if (filtros.profesional) {
    partes.push(`profesional ${filtros.profesional}`);
  }
  return partes;
}

function Visualizacion(definicion, titulo, estado, mensaje, serie, nota, filtrosAplicados) {
  return {
    numero: definicion.numero,
    codigo: definicion.codigo,
    titulo,
    formato: definicion.formato,
    fechaAplicada: definicion.fecha,
    estado,
    mensaje,
    serie,
    nota,
    filtrosAplicados
  };
}

function Definicion(numero) {
  return CATALOGO_VISUALIZACIONES.find((item) => item.numero === numero);
}

function EnsamblarDemografia(personas, fechaConsulta) {
  const mapa = new Map();
  const hoy = FechaConsulta(fechaConsulta);
  for (const persona of personas) {
    if (!persona.personId) {
      continue;
    }
    const sexo = persona.sexName && persona.sexName.length > 0 ? persona.sexName : null;
    mapa.set(persona.personId, {
      sexo,
      edad: AniosCumplidos(persona.birthDate, hoy)
    });
  }
  return mapa;
}

function Opciones(hechos, demografia) {
  const profesionales = new Set();
  for (const fila of hechos.individuales) {
    if (fila.profesional) {
      profesionales.add(fila.profesional);
    }
  }
  for (const fila of hechos.profesionalesGrupales) {
    if (fila.profesional) {
      profesionales.add(fila.profesional);
    }
  }
  const sexos = new Set();
  const edades = new Set();
  for (const caso of hechos.casos) {
    const dato = DemografiaDe(demografia, caso.personaId);
    if (!dato) {
      continue;
    }
    if (dato.sexo) {
      sexos.add(dato.sexo);
    }
    if (Number.isInteger(dato.edad)) {
      edades.add(dato.edad);
    }
  }
  return {
    profesionales: [...profesionales].sort((a, b) => a.localeCompare(b, 'es')),
    sexos: [...sexos].sort((a, b) => a.localeCompare(b, 'es')),
    edades: [...edades].sort((a, b) => a - b)
  };
}

function DistribucionEstablecimiento(casos, nombres) {
  const serie = new Map();
  for (const caso of casos) {
    Contar(
      serie,
      String(caso.establecimientoId),
      NombreEstablecimiento(caso.establecimientoId, nombres)
    );
  }
  return OrdenarSerie(serie);
}

function DistribucionSexo(casos, demografia) {
  let sinDato = 0;
  const serie = new Map();
  for (const caso of casos) {
    const dato = DemografiaDe(demografia, caso.personaId);
    if (!dato || !dato.sexo) {
      sinDato += 1;
      continue;
    }
    Contar(serie, dato.sexo, dato.sexo);
  }
  if (serie.size === 0) {
    return {
      estado: 'NO_DISPONIBLE',
      serie: [],
      mensaje: 'El sexo no está disponible para los casos de este corte.'
    };
  }
  const resultado = OrdenarSerie(serie);
  if (sinDato > 0) {
    resultado.push({ clave: 'NO_DISPONIBLE', etiqueta: 'No disponible', cantidad: sinDato });
  }
  return { estado: 'CON_DATOS', serie: resultado, mensaje: null };
}

function DistribucionEdad(casos, demografia) {
  let sinDato = 0;
  const serie = new Map();
  for (const caso of casos) {
    const dato = DemografiaDe(demografia, caso.personaId);
    if (!dato || !Number.isInteger(dato.edad)) {
      sinDato += 1;
      continue;
    }
    Contar(serie, String(dato.edad), `${dato.edad} años`);
  }
  if (serie.size === 0) {
    return {
      estado: 'NO_DISPONIBLE',
      serie: [],
      mensaje: 'La edad actual no está disponible para los casos de este corte.'
    };
  }
  const resultado = [...serie.values()].sort((a, b) => Number(a.clave) - Number(b.clave));
  if (sinDato > 0) {
    resultado.push({ clave: 'NO_DISPONIBLE', etiqueta: 'No disponible', cantidad: sinDato });
  }
  return { estado: 'CON_DATOS', serie: resultado, mensaje: null };
}

function DistribucionPrioridad(casos, filtros) {
  if (filtros.prioridad) {
    const etiqueta = EtiquetaPrioridad(filtros.prioridad);
    return [{
      clave: filtros.prioridad,
      etiqueta,
      cantidad: casos.filter((caso) => caso.prioridad === filtros.prioridad).length
    }];
  }
  return PRIORIDADES.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: casos.filter((caso) => caso.prioridad === item.codigo).length
  }));
}

function DistribucionEstado(casos, filtros) {
  const base = filtros.estado === 'TODOS'
    ? ESTADOS_CASO
    : ESTADOS_CASO.filter((item) => item.codigo === filtros.estado);
  return base.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: casos.filter((caso) => caso.estado === item.codigo).length
  }));
}

function ReferenciasDelCorte(hechos, filtros) {
  return hechos.referencias.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
}

function ResumenReferencias(referencias) {
  const enviadas = referencias.length;
  const admitidas = referencias.filter((fila) => fila.estado === 'ADMITIDA_AI').length;
  const noRequiere = referencias.filter((fila) => fila.estado === 'NO_REQUIERE_AI').length;
  return {
    enviadas,
    analizadas: admitidas + noRequiere,
    admitidas,
    noRequiere,
    fecha: 'fecha de la referencia',
    nota: 'Una referencia analizada puede concluir admitida o no requiere '
      + 'Atención Interdisciplinaria. Esas cifras parten las analizadas '
      + 'y no se suman a las enviadas.'
  };
}

function MotivosReferencia(hechos, referencias) {
  const identificadores = new Set(referencias.map((fila) => fila.referenciaId));
  const serie = new Map();
  for (const motivo of hechos.motivosReferencia) {
    if (!identificadores.has(motivo.referenciaId)) {
      continue;
    }
    Contar(serie, motivo.etiqueta, motivo.etiqueta);
  }
  return OrdenarSerie(serie);
}

function Cancelaciones(hechos, filtros) {
  const serie = new Map();
  const vistas = new Set();
  for (const fila of hechos.cancelaciones) {
    if (filtros.establecimientoId && fila.establecimientoId !== filtros.establecimientoId) {
      continue;
    }
    if (vistas.has(fila.actividadId)) {
      continue;
    }
    vistas.add(fila.actividadId);
    const etiqueta = fila.motivo && fila.motivo.trim().length > 0
      ? fila.motivo.trim()
      : null;
    if (!etiqueta) {
      continue;
    }
    Contar(serie, etiqueta, etiqueta);
  }
  return OrdenarSerie(serie);
}

function Cierres(hechos, filtros) {
  return hechos.cierres.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
}

function SerieCierres(cierres) {
  const conteo = new Map(cierres.map((fila) => [fila.codigo, 0]));
  for (const fila of cierres) {
    conteo.set(fila.codigo, (conteo.get(fila.codigo) || 0) + 1);
  }
  const oficiales = MOTIVOS_CIERRE.map((item) => ({
    clave: item.codigo,
    etiqueta: item.etiqueta,
    cantidad: conteo.get(item.codigo) || 0
  }));
  const extras = [];
  for (const [codigo, cantidad] of conteo) {
    if (!MOTIVOS_CIERRE.some((item) => item.codigo === codigo)) {
      const muestra = cierres.find((fila) => fila.codigo === codigo);
      extras.push({
        clave: codigo,
        etiqueta: muestra && muestra.etiqueta ? muestra.etiqueta : codigo,
        cantidad
      });
    }
  }
  return oficiales.concat(extras);
}

function SerieTipos(grupos, catalogo) {
  const serie = new Map();
  for (const grupo of grupos) {
    const clave = grupo.tipoId === null ? 'NO_DISPONIBLE' : String(grupo.tipoId);
    const etiqueta = grupo.tipoEtiqueta || 'Tipo no disponible';
    Contar(serie, clave, etiqueta);
  }
  for (const tipo of catalogo) {
    const clave = String(tipo.itemId);
    if (!serie.has(clave)) {
      serie.set(clave, { clave, etiqueta: tipo.etiqueta, cantidad: 0 });
    }
  }
  return OrdenarSerie(serie);
}

function PersonasUnicas(individuales, participantes, filtros, demografia) {
  const personas = new Set();
  for (const fila of individuales) {
    if (IndividualAplica(fila, filtros, demografia, true)) {
      personas.add(fila.personaId);
    }
  }
  for (const fila of participantes) {
    if (PersonaCumple(fila.personaId, filtros, demografia)) {
      personas.add(fila.personaId);
    }
  }
  return personas.size;
}

function FiltrosActivos(filtros, nombres) {
  const activos = [{ codigo: 'anio', etiqueta: `Año ${filtros.anio}` }];
  if (filtros.establecimientoId) {
    activos.push({
      codigo: 'establecimiento',
      etiqueta: NombreEstablecimiento(filtros.establecimientoId, nombres)
    });
  }
  if (filtros.estado !== 'TODOS') {
    activos.push({ codigo: 'estado', etiqueta: `Estado ${EtiquetaEstado(filtros.estado)}` });
  }
  if (filtros.prioridad) {
    activos.push({
      codigo: 'prioridad',
      etiqueta: `Prioridad ${EtiquetaPrioridad(filtros.prioridad)}`
    });
  }
  if (filtros.disciplinaId) {
    const disciplina = (filtros.catalogoDisciplinas || []).find((item) => (
      item.itemId === filtros.disciplinaId
    ));
    activos.push({
      codigo: 'disciplina',
      etiqueta: disciplina ? disciplina.etiqueta : 'Disciplina seleccionada'
    });
  }
  if (filtros.profesional) {
    activos.push({ codigo: 'profesional', etiqueta: `Profesional ${filtros.profesional}` });
  }
  if (filtros.sexo) {
    activos.push({ codigo: 'sexo', etiqueta: `Sexo ${filtros.sexo}` });
  }
  if (filtros.edad !== null) {
    activos.push({ codigo: 'edad', etiqueta: `Edad ${filtros.edad} años` });
  }
  return activos;
}

function AlcanceFiltros() {
  return [
    {
      codigo: 'anio',
      aplicaA: [6, 7, 8, 9, 10, 11, 12],
      noAplicaA: [1, 2, 3, 4, 5],
      motivo: 'El año usa el evento de cada indicador. '
        + 'En los casos 1 a 5 el corte es la consulta actual.'
    },
    {
      codigo: 'establecimiento',
      aplicaA: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
      noAplicaA: [],
      motivo: 'Restringe el ámbito ya autorizado. No elige otra Oficina Local.'
    },
    {
      codigo: 'estado',
      aplicaA: [1, 2, 3, 4, 5],
      noAplicaA: [6, 7, 8, 9, 10, 11, 12],
      motivo: 'No cambia la cobertura ni convierte los cierres en casos activos.'
    },
    {
      codigo: 'prioridad',
      aplicaA: [1, 2, 3, 4, 5],
      noAplicaA: [6, 7, 8, 9, 10, 11, 12],
      motivo: 'La prioridad vigente distribuye casos. No altera N ni D de la cobertura.'
    },
    {
      codigo: 'disciplina',
      aplicaA: [8],
      noAplicaA: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      motivo: 'Delimita atenciones. No se aplica solo al numerador de la cobertura.'
    },
    {
      codigo: 'profesional',
      aplicaA: [8],
      noAplicaA: [1, 2, 3, 4, 5, 6, 7, 9, 10, 11, 12],
      motivo: 'Delimita atenciones cuando el usuario está registrado. '
        + 'No cambia la cobertura.'
    },
    {
      codigo: 'sexo',
      aplicaA: [1, 2, 3, 4, 5, 11, 12],
      noAplicaA: [6, 7, 8, 9, 10],
      motivo: 'Delimita casos y la cobertura. No filtra motivos ni el tipo de atención.'
    },
    {
      codigo: 'edad',
      aplicaA: [1, 2, 3, 4, 5, 11, 12],
      noAplicaA: [6, 7, 8, 9, 10],
      motivo: 'Usa la edad cumplida al corte. No inventa un grupo etario.'
    }
  ];
}

/**
 * Construye el corte analítico de Oficina Local.
 * Los hechos ya vienen limitados por la oficina y la región de la sesión.
 *
 * @param {object} hechos Lecturas normalizadas.
 * @param {object} filtros Filtros ya validados.
 * @param {Map} demografia Sexo y edad por persona, o null si la réplica falló.
 * @param {Map} nombres Nombres de establecimiento.
 * @returns {object} Catálogo, complementos y cobertura.
 */
function EnsamblarCorte(hechos, filtros, demografia, nombres) {
  if ((filtros.sexo || filtros.edad !== null) && !(demografia instanceof Map)) {
    const error = new Error('La demografía no está disponible.');
    error.code = 'DEMOGRAFIA';
    throw error;
  }
  const demografiaDisponible = demografia instanceof Map;
  const mapa = demografiaDisponible ? demografia : new Map();
  const casos = CasosDeDistribucion(hechos, filtros, mapa);
  const activos = CasosActivosCobertura(hechos, filtros, mapa);
  const individualesAtencion = hechos.individuales.filter((fila) => (
    IndividualAplica(fila, filtros, mapa, false)
  ));
  const grupos = GruposAplican(hechos, filtros);
  const participantes = ParticipantesEfectivos(hechos, grupos);
  const individualesCobertura = hechos.individuales.filter((fila) => (
    !filtros.establecimientoId || fila.establecimientoId === filtros.establecimientoId
  ));
  const gruposCobertura = GruposAplican(hechos, {
    ...filtros,
    disciplinaId: null,
    profesional: null
  });
  const participantesCobertura = ParticipantesEfectivos(hechos, gruposCobertura);
  const personasDenominador = new Set(activos.map((caso) => caso.personaId));
  let numerador = 0;
  for (const personaId of personasDenominador) {
    const casosPersona = activos.filter((caso) => caso.personaId === personaId);
    const atendida = casosPersona.some((caso) => CasoAtendido(
      caso.casoId,
      individualesCobertura,
      participantesCobertura
    ));
    if (atendida) {
      numerador += 1;
    }
  }
  const denominador = personasDenominador.size;
  const porcentaje = PorcentajeCobertura(numerador, denominador);
  const cobertura = {
    texto: TEXTO_COBERTURA,
    ratificacion: 'NEEDS_VALIDATION',
    denominador,
    numerador,
    porcentaje,
    estado: denominador === 0 ? 'SIN_CASOS_ACTIVOS' : 'CALCULADO',
    mensaje: denominador === 0
      ? 'Sin casos activos. No aplica.'
      : null,
    anio: filtros.anio,
    fechaConsulta: filtros.fechaConsulta
  };
  const referencias = ReferenciasDelCorte(hechos, filtros);
  const motivos = MotivosReferencia(hechos, referencias);
  const canceladas = Cancelaciones(hechos, filtros);
  const cierres = Cierres(hechos, filtros);
  const palabras = ContarPalabras(
    cierres
      .filter((fila) => fila.requiereTexto && fila.explicacion)
      .map((fila) => fila.explicacion)
  );
  const tipos = grupos.length === 0 ? [] : SerieTipos(grupos, hechos.catalogoTipos || []);
  const individualesFueraDeTipo = individualesAtencion.length;
  const ultimas = new Map(hechos.ultimasAtenciones.map((fila) => [fila.casoId, fila.fecha]));
  const sinAtencion = [];
  for (const caso of activos) {
    if (CasoAtendido(caso.casoId, individualesCobertura, participantesCobertura)) {
      continue;
    }
    const ultima = ultimas.get(caso.casoId) || null;
    sinAtencion.push({
      casoId: caso.casoId,
      establecimiento: NombreEstablecimiento(caso.establecimientoId, nombres),
      ultimaAtencion: ultima,
      situacion: ultima ? 'Atendido fuera del período' : 'Sin atención registrada'
    });
  }
  sinAtencion.sort((a, b) => a.casoId - b.casoId);
  const partesCaso = ComplementosCaso(filtros, nombres, filtros.fechaConsulta);
  const partesAtencion = ComplementosAtencion(filtros, nombres, filtros.anio);
  const partesCierre = [`año ${filtros.anio}`];
  if (filtros.establecimientoId) {
    partesCierre.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  const visualizaciones = [
    VisualizacionCasos(1, casos, () => ({
      estado: 'CON_DATOS',
      serie: DistribucionEstablecimiento(casos, nombres),
      mensaje: null
    }), partesCaso),
    VisualizacionPersona(2, casos, demografiaDisponible, () => (
      DistribucionSexo(casos, mapa)
    ), partesCaso),
    VisualizacionPersona(3, casos, demografiaDisponible, () => (
      DistribucionEdad(casos, mapa)
    ), partesCaso),
    VisualizacionCasos(4, casos, () => ({
      estado: 'CON_DATOS',
      serie: DistribucionPrioridad(casos, filtros),
      mensaje: null
    }), partesCaso),
    VisualizacionCasos(5, casos, () => ({
      estado: 'CON_DATOS',
      serie: DistribucionEstado(casos, filtros),
      mensaje: null
    }), partesCaso),
    VisualizacionFrecuencia(6, canceladas, `año ${filtros.anio}`, (
      'La tabla muestra los principales. La descarga incluye la frecuencia completa.'
    )),
    VisualizacionFrecuencia(7, motivos, `año ${filtros.anio}`, (
      'Cada motivo se cuenta por aparición. La suma puede superar el total de referencias '
      + `y no es una partición de ${referencias.length} referencias.`
    )),
    VisualizacionTipos(tipos, individualesFueraDeTipo, partesAtencion),
    VisualizacionCierres(cierres, partesCierre),
    VisualizacionPalabras(palabras, partesCierre),
    VisualizacionCobertura(11, cobertura, partesCobertura(filtros, nombres)),
    VisualizacionCobertura(12, cobertura, partesCobertura(filtros, nombres))
  ];
  return {
    fechaConsulta: filtros.fechaConsulta,
    anio: filtros.anio,
    oficinaLocalId: filtros.oficinaLocalId,
    regionId: filtros.regionId,
    filtrosActivos: FiltrosActivos(filtros, nombres),
    alcanceFiltros: AlcanceFiltros(),
    cobertura,
    referencias: ResumenReferencias(referencias),
    personasUnicas: PersonasUnicas(
      hechos.individuales,
      participantes,
      filtros,
      mapa
    ),
    totalAtenciones: individualesAtencion.length + grupos.length,
    atencionesIndividuales: individualesAtencion.length,
    atencionesGrupales: grupos.length,
    casosSinAtencion: {
      total: sinAtencion.length,
      muestra: sinAtencion.slice(0, MUESTRA_CASOS),
      filas: sinAtencion,
      estado: activos.length === 0 ? 'SIN_CASOS_ACTIVOS' : 'CON_DATOS'
    },
    visualizaciones,
    opciones: Opciones(hechos, mapa),
    catalogoDisciplinas: hechos.catalogoDisciplinas || [],
    establecimientos: [...nombres.entries()]
      .map(([id, nombre]) => ({ id, nombre }))
      .sort((a, b) => String(a.nombre).localeCompare(String(b.nombre), 'es'))
  };
}

function partesCobertura(filtros, nombres) {
  const partes = [`año ${filtros.anio}`, 'casos activos actuales'];
  if (filtros.establecimientoId) {
    partes.push(NombreEstablecimiento(filtros.establecimientoId, nombres));
  }
  if (filtros.sexo) {
    partes.push(`sexo ${filtros.sexo}`);
  }
  if (filtros.edad !== null) {
    partes.push(`edad ${filtros.edad} años`);
  }
  return partes;
}

function VisualizacionCasos(numero, casos, construir, complementos) {
  const definicion = Definicion(numero);
  const contenido = casos.length === 0
    ? { estado: 'SIN_INFORMACION', serie: [], mensaje: 'No hay casos en este corte.' }
    : construir();
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    contenido.estado,
    contenido.mensaje,
    contenido.serie,
    null,
    complementos
  );
}

function VisualizacionPersona(numero, casos, disponible, construir, complementos) {
  const definicion = Definicion(numero);
  if (!disponible) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'NO_DISPONIBLE',
      'La réplica institucional no permitió leer sexo o edad. No se sustituye por cero.',
      [],
      null,
      complementos
    );
  }
  return VisualizacionCasos(numero, casos, construir, complementos);
}

function VisualizacionFrecuencia(numero, serie, complemento, nota) {
  const definicion = Definicion(numero);
  if (serie.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, [complemento]),
      'SIN_INFORMACION',
      'No hay registros en el año seleccionado.',
      [],
      nota,
      [complemento]
    );
  }
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, [complemento]),
      'CON_DATOS',
      null,
      serie.slice(0, PRESENTACION_TOP),
      nota,
      [complemento]
    ),
    frecuenciaCompleta: serie
  };
}

function VisualizacionTipos(serie, individuales, complementos) {
  const definicion = Definicion(8);
  const nota = individuales > 0
    ? `Hay ${individuales} atenciones individuales sin tipo institucional TIPO_ATENCION. `
      + 'No entran en esta distribución ni se asignan a un tipo inventado.'
    : 'Una atención grupal cuenta una vez, aunque tenga varias personas.';
  if (serie.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      individuales > 0 ? 'NO_DISPONIBLE' : 'SIN_INFORMACION',
      individuales > 0
        ? nota
        : 'No hay atenciones grupales clasificadas por tipo en el año seleccionado.',
      [],
      nota,
      complementos
    );
  }
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    'CON_DATOS',
    null,
    serie,
    nota,
    complementos
  );
}

function VisualizacionCierres(cierres, complementos) {
  const definicion = Definicion(9);
  if (cierres.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'SIN_INFORMACION',
      'No hay cierres en el año seleccionado.',
      [],
      'Traslado no equivale a cierre satisfactorio.',
      complementos
    );
  }
  return Visualizacion(
    definicion,
    TituloDinamico(definicion.titulo, complementos),
    'CON_DATOS',
    null,
    SerieCierres(cierres),
    'Traslado no equivale a cierre satisfactorio.',
    complementos
  );
}

function VisualizacionPalabras(palabras, complementos) {
  const definicion = Definicion(10);
  if (palabras.length === 0) {
    return Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'SIN_INFORMACION',
      'No hay explicaciones de cierre Otro en el año seleccionado.',
      [],
      null,
      complementos
    );
  }
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      'CON_DATOS',
      null,
      palabras.slice(0, PRESENTACION_TOP),
      'La nube muestra las palabras más frecuentes. La descarga incluye la frecuencia completa.',
      complementos
    ),
    frecuenciaCompleta: palabras
  };
}

function VisualizacionCobertura(numero, cobertura, complementos) {
  const definicion = Definicion(numero);
  const estado = cobertura.estado === 'SIN_CASOS_ACTIVOS' ? 'SIN_CASOS_ACTIVOS' : 'CON_DATOS';
  return {
    ...Visualizacion(
      definicion,
      TituloDinamico(definicion.titulo, complementos),
      estado,
      cobertura.mensaje,
      [],
      TEXTO_COBERTURA,
      complementos
    ),
    numerador: cobertura.numerador,
    denominador: cobertura.denominador,
    porcentaje: cobertura.porcentaje
  };
}

module.exports = {
  EnsamblarCorte,
  EnsamblarDemografia
};
