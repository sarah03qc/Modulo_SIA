/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-18.
 * Traduce códigos almacenados a clasificaciones. No decide una sugerencia.
 *
 * TODO-UTIC: confirmar si el código 0 representa no aplicable.
 * TODO-UTIC: confirmar el rango de edad de talla para la edad.
 */
'use strict';

const {
  CAMPOS,
  MAPEO_SINTETICO,
  MAPEO_INSTITUCIONAL,
  MODO_INSTITUCIONAL
} = require('./configuracion-nutricion');

/**
 * Indica si el indicador aplica a la edad cumplida en la evaluación.
 * No interpreta el código almacenado.
 *
 * @param {string} campo PE, PT, TE o IMC.
 * @param {number|null} edadAnios Edad cumplida, o null si no se puede calcular.
 * @returns {string} APLICABLE, NO_APLICABLE o EDAD_DESCONOCIDA.
 */
function AplicabilidadPorEdad(campo, edadAnios) {
  if (!Number.isInteger(edadAnios) || edadAnios < 0) {
    return 'EDAD_DESCONOCIDA';
  }
  if (campo === 'PE' || campo === 'PT') {
    return edadAnios < 5 ? 'APLICABLE' : 'NO_APLICABLE';
  }
  if (campo === 'IMC') {
    return edadAnios >= 5 ? 'APLICABLE' : 'NO_APLICABLE';
  }
  if (campo === 'TE') {
    return 'APLICABLE';
  }
  return 'NO_APLICABLE';
}

/**
 * Calcula la edad cumplida en la fecha de evaluación.
 *
 * @param {string|null} nacimiento Fecha YYYY-MM-DD.
 * @param {string|null} evaluacion Fecha YYYY-MM-DD.
 * @returns {number|null} Años cumplidos, o null si alguna fecha no sirve.
 */
function EdadEnEvaluacion(nacimiento, evaluacion) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(nacimiento || '')
    || !/^\d{4}-\d{2}-\d{2}$/.test(evaluacion || '')) {
    return null;
  }
  const [anioN, mesN, diaN] = nacimiento.split('-').map(Number);
  const [anioE, mesE, diaE] = evaluacion.split('-').map(Number);
  let edad = anioE - anioN;
  if (mesE < mesN || (mesE === mesN && diaE < diaN)) {
    edad -= 1;
  }
  if (!Number.isInteger(edad) || edad < 0 || edad > 120) {
    return null;
  }
  return edad;
}

/**
 * Traduce un código de un indicador.
 * Un código ausente del mapeo queda desconocido. No se convierte en normal
 * ni en alteración.
 *
 * @param {object} entrada Campo, código, modo y mapeo.
 * @returns {object} Interpretación explícita.
 */
function InterpretarCampo(entrada) {
  const campo = entrada && entrada.campo;
  const modo = entrada && entrada.modo;
  const mapeo = modo === MODO_INSTITUCIONAL ? MAPEO_INSTITUCIONAL : MAPEO_SINTETICO;
  const base = {
    campo,
    codigoOrigen: entrada ? entrada.codigo : null,
    versionMapeo: mapeo.version,
    estadoValidacion: mapeo.estadoValidacion,
    fuente: mapeo.fuente,
    clasificacion: null
  };
  if (!CAMPOS.includes(campo)) {
    return { ...base, estado: 'DESCONOCIDO' };
  }
  if (mapeo.estadoValidacion === 'NO_VALIDADO') {
    return { ...base, estado: 'MAPEO_NO_VALIDADO' };
  }
  if (entrada.codigo === null || entrada.codigo === undefined) {
    return { ...base, estado: 'NULO' };
  }
  const codigo = Number(entrada.codigo);
  if (!Number.isInteger(codigo) || codigo < 0 || codigo > 255) {
    return { ...base, estado: 'DESCONOCIDO', codigoOrigen: entrada.codigo };
  }
  const tabla = mapeo.campos[campo] || {};
  const clasificacion = tabla[codigo];
  if (!clasificacion) {
    return { ...base, estado: 'DESCONOCIDO', codigoOrigen: codigo };
  }
  return {
    ...base,
    estado: 'RECONOCIDO',
    codigoOrigen: codigo,
    clasificacion
  };
}

module.exports = {
  AplicabilidadPorEdad,
  EdadEnEvaluacion,
  InterpretarCampo
};
