/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16.
 * HU-038, HU-039. RF-086 a RF-091, RF-125, RF-128, RF-129. RN-040.
 * Una sola definición para la consulta, las doce visualizaciones y la descarga.
 */
'use strict';

const PRESENTACION_TOP = 10;
const MUESTRA_CASOS = 20;
const LIMITE_FILAS_EXPORTACION = 2000;
const LIMITE_PERSONAS_DEMOGRAFICAS = 2000;

const PRIORIDADES = Object.freeze([
  { codigo: 'ALTO', etiqueta: 'Alto' },
  { codigo: 'MODERADO', etiqueta: 'Moderado' },
  { codigo: 'BAJO', etiqueta: 'Bajo' }
]);

const ESTADOS_CASO = Object.freeze([
  { codigo: 'ACTIVO', etiqueta: 'Activo' },
  { codigo: 'CERRADO', etiqueta: 'Cerrado' }
]);

const MOTIVOS_CIERRE = Object.freeze([
  { codigo: 'CIERRE_SATISFACTORIO', etiqueta: 'Cierre satisfactorio' },
  { codigo: 'TRASLADO', etiqueta: 'Traslado' },
  { codigo: 'OTRO', etiqueta: 'Otro' }
]);

/*
 * RN-040 sigue provisional. El cálculo usa esta fórmula y no la ratifica.
 * D es el corte actual de casos activos. El año solo limita la atención de N.
 */
const TEXTO_COBERTURA = 'Definición operativa provisional de RN-040 y RF-129, '
  + 'pendiente de ratificación con Alina. '
  + 'D son las personas únicas con caso activo actualmente en el ámbito. '
  + 'N son las personas de ese mismo D con al menos una atención efectiva '
  + 'en el año, vinculada a su caso activo actual. '
  + 'El porcentaje es N / D × 100. '
  + 'Si D es cero, no se divide: se informa Sin casos activos y No aplica. '
  + 'El filtro general de estado no cambia este universo.';

const CATALOGO_VISUALIZACIONES = Object.freeze([
  {
    numero: 1,
    codigo: 'CASOS_ESTABLECIMIENTO',
    titulo: 'Casos por establecimiento',
    formato: 'BARRAS',
    fecha: 'Corte de la consulta. El año no convierte el estado actual en un estado histórico.'
  },
  {
    numero: 2,
    codigo: 'CASOS_SEXO',
    titulo: 'Casos por sexo',
    formato: 'DISTRIBUCION',
    fecha: 'Corte de la consulta. El sexo sale de la réplica institucional, sin nombre.'
  },
  {
    numero: 3,
    codigo: 'CASOS_EDAD',
    titulo: 'Casos por edad actual',
    formato: 'DISTRIBUCION',
    fecha: 'Edad cumplida en la fecha de consulta. No hay grupos etarios institucionales.'
  },
  {
    numero: 4,
    codigo: 'CASOS_PRIORIDAD',
    titulo: 'Casos por prioridad',
    formato: 'DISTRIBUCION',
    fecha: 'Prioridad vigente de la valoración actual. No mezcla prioridades históricas.'
  },
  {
    numero: 5,
    codigo: 'CASOS_ESTADO',
    titulo: 'Casos por estado',
    formato: 'DISTRIBUCION',
    fecha: 'Estado vigente del caso. No es el estado que tenía durante el año seleccionado.'
  },
  {
    numero: 6,
    codigo: 'MOTIVOS_CANCELACION',
    titulo: 'Principales motivos de cancelación',
    formato: 'TABLA',
    fecha: 'Fecha del evento de cancelación. No usa la fecha vigente de la actividad.'
  },
  {
    numero: 7,
    codigo: 'MOTIVOS_REFERENCIA',
    titulo: 'Motivos de referencia a Atención Interdisciplinaria',
    formato: 'NUBE',
    fecha: 'Fecha de la referencia. No usa la fecha de digitación ni la de envío técnico.'
  },
  {
    numero: 8,
    codigo: 'ATENCIONES_TIPO',
    titulo: 'Atenciones realizadas por tipo',
    formato: 'DISTRIBUCION',
    fecha: 'Fecha real de atención. Excluye programación, reprogramación y cancelación.'
  },
  {
    numero: 9,
    codigo: 'MOTIVOS_CIERRE',
    titulo: 'Motivos de cierre',
    formato: 'CIRCULAR',
    fecha: 'Fecha de cierre. Traslado no se suma a cierre satisfactorio.'
  },
  {
    numero: 10,
    codigo: 'PALABRAS_OTRO',
    titulo: 'Palabras frecuentes en cierres Otro',
    formato: 'NUBE',
    fecha: 'Explicaciones de cierres Otro cuya fecha de cierre cae en el año.'
  },
  {
    numero: 11,
    codigo: 'COBERTURA_PORCENTAJE',
    titulo: 'Porcentaje de niños atendidos en el año seleccionado',
    formato: 'KPI_PORCENTAJE',
    fecha: 'El año limita la atención efectiva. Activo se evalúa en la consulta.'
  },
  {
    numero: 12,
    codigo: 'COBERTURA_CANTIDAD',
    titulo: 'Cantidad de niños atendidos en el año seleccionado',
    formato: 'KPI_CANTIDAD',
    fecha: 'Numerador N de la cobertura. No es el total de atenciones '
      + 'ni todas las personas atendidas.'
  }
]);

const PALABRAS_VACIAS = new Set([
  'para', 'como', 'esta', 'este', 'estos', 'estas', 'esa', 'ese', 'eso',
  'una', 'uno', 'unos', 'unas', 'del', 'las', 'los', 'con', 'sin', 'por',
  'que', 'sus', 'su', 'the', 'and', 'más', 'mas', 'muy', 'pero', 'porque',
  'cuando', 'donde', 'desde', 'hasta', 'entre', 'sobre', 'también', 'tambien',
  'hay', 'son', 'fue', 'ser', 'está', 'estan', 'están', 'tiene', 'tienen',
  'caso', 'otro', 'otra', 'otros', 'otras'
]);

/**
 * Porcentaje N/D con un decimal. D cero no produce un porcentaje.
 *
 * @param {number} numerador Personas de D atendidas.
 * @param {number} denominador Personas con caso activo.
 * @returns {number|null} Porcentaje o null si no aplica.
 */
function PorcentajeCobertura(numerador, denominador) {
  if (!Number.isInteger(denominador) || denominador <= 0) {
    return null;
  }
  if (!Number.isInteger(numerador) || numerador < 0) {
    return null;
  }
  return Math.round((numerador / denominador) * 1000) / 10;
}

/**
 * Cuenta palabras de explicaciones. No interpreta el motivo profesional.
 *
 * @param {string[]} textos Explicaciones de Otro.
 * @returns {Array<{etiqueta: string, cantidad: number}>} Frecuencia descendente.
 */
function ContarPalabras(textos) {
  const conteo = new Map();
  for (const texto of textos) {
    if (typeof texto !== 'string') {
      continue;
    }
    const partes = texto.toLocaleLowerCase('es').split(/[^\p{L}]+/u);
    for (const palabra of partes) {
      if (palabra.length < 3 || PALABRAS_VACIAS.has(palabra)) {
        continue;
      }
      conteo.set(palabra, (conteo.get(palabra) || 0) + 1);
    }
  }
  return [...conteo.entries()]
    .map(([etiqueta, cantidad]) => ({ etiqueta, cantidad }))
    .sort((a, b) => b.cantidad - a.cantidad || a.etiqueta.localeCompare(b.etiqueta, 'es'));
}

/**
 * Arma el título con los filtros que sí aplican a esa visualización.
 *
 * @param {string} titulo Título base del catálogo.
 * @param {string[]} complementos Fragmentos ya redactados.
 * @returns {string} Título dinámico.
 */
function TituloDinamico(titulo, complementos) {
  const partes = [titulo, ...complementos.filter((parte) => parte)];
  return partes.join(' — ');
}

function EtiquetaPrioridad(codigo) {
  const encontrada = PRIORIDADES.find((item) => item.codigo === codigo);
  return encontrada ? encontrada.etiqueta : null;
}

function EtiquetaEstado(codigo) {
  const encontrada = ESTADOS_CASO.find((item) => item.codigo === codigo);
  return encontrada ? encontrada.etiqueta : null;
}

module.exports = {
  PRESENTACION_TOP,
  MUESTRA_CASOS,
  LIMITE_FILAS_EXPORTACION,
  LIMITE_PERSONAS_DEMOGRAFICAS,
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
};
