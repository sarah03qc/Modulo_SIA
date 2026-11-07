'use strict';

const { ValidationError } = require('../../common/errors');
const {
  REGION_CODES,
  MOTIVE_CATEGORY_BY_CODE,
  MAX_MOTIVES,
  MAX_SPECIFICATION_LENGTH,
  MAX_NARRATIVE_LENGTH
} = require('./reference-constants');

const CONSECUTIVE_PATTERN = /^DNCC-DR[A-Z]{2}-OL[0-9]{3}-[0-9]+-REF-[0-9]{3}-20[0-9]{2}$/;

/**
 * Recorta un texto opcional y lo convierte en null cuando queda vacío.
 *
 * @param {unknown} value Texto de un campo narrativo.
 * @returns {string|null} Texto recortado o null.
 */
function blankToNull(value) {
  if (value === null || value === undefined) {
    return null;
  }
  const text = String(value).trim();
  return text.length === 0 ? null : text;
}

/**
 * Comprueba una fecha civil real en formato AAAA-MM-DD.
 * No aplica una regla de negocio sobre fechas futuras: la fuente no la confirma.
 *
 * @param {unknown} value Fecha digitada.
 * @returns {string} Fecha canónica.
 * @throws {ValidationError} Cuando el valor no es una fecha civil.
 */
function requireReferenceDate(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    throw new ValidationError('La fecha de referencia debe indicarse como AAAA-MM-DD.');
  }
  const year = Number(value.slice(0, 4));
  const month = Number(value.slice(5, 7));
  const day = Number(value.slice(8, 10));
  const utc = new Date(Date.UTC(year, month - 1, day));
  if (
    utc.getUTCFullYear() !== year
    || utc.getUTCMonth() !== month - 1
    || utc.getUTCDate() !== day
  ) {
    throw new ValidationError('La fecha de referencia no es una fecha válida.');
  }
  return value;
}

/**
 * Calcula la edad en años cumplidos en la fecha de la referencia.
 *
 * @param {string|null} birthDate Fecha de nacimiento AAAA-MM-DD.
 * @param {string} referenceDate Fecha de la referencia.
 * @returns {number|null} Edad entre 0 y 120, o null si no puede calcularse.
 */
function ageAtReference(birthDate, referenceDate) {
  if (typeof birthDate !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    return null;
  }
  const year = Number(birthDate.slice(0, 4));
  const month = Number(birthDate.slice(5, 7));
  const day = Number(birthDate.slice(8, 10));
  const refYear = Number(referenceDate.slice(0, 4));
  const refMonth = Number(referenceDate.slice(5, 7));
  const refDay = Number(referenceDate.slice(8, 10));
  let age = refYear - year;
  if (refMonth < month || (refMonth === month && refDay < day)) {
    age -= 1;
  }
  if (!Number.isInteger(age) || age < 0 || age > 120) {
    return null;
  }
  return age;
}

/**
 * Normaliza el consecutivo digitado al valor que el CHECK de la base acepta.
 * Recorta extremos y pasa a mayúsculas. No genera ni completa segmentos.
 * No exige que el número sea el siguiente de una serie.
 *
 * Requisitos: HU-013 CA-25, RF-114 y RN-030.
 *
 * @param {unknown} value Consecutivo digitado o precargado.
 * @returns {string} Consecutivo canónico.
 * @throws {ValidationError} Cuando el patrón, el código regional o los separadores no corresponden.
 */
function canonicalizeConsecutive(value) {
  if (typeof value !== 'string') {
    throw new ValidationError('El consecutivo institucional es obligatorio y debe digitarse completo.');
  }
  const consecutive = value.trim().toUpperCase();
  if (consecutive.length === 0) {
    throw new ValidationError('El consecutivo institucional es obligatorio y debe digitarse completo.');
  }
  if (/\s/.test(consecutive)) {
    throw new ValidationError('El consecutivo institucional no admite espacios.');
  }
  if (!CONSECUTIVE_PATTERN.test(consecutive)) {
    throw new ValidationError(
      'El consecutivo no corresponde al patrón DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX.'
    );
  }
  const regionCode = consecutive.slice(7, 9);
  if (!REGION_CODES.includes(regionCode)) {
    throw new ValidationError('El segmento regional del consecutivo no corresponde a un código identificado.');
  }
  const hyphenCount = consecutive.length - consecutive.replace(/-/g, '').length;
  if (hyphenCount !== 6) {
    throw new ValidationError('El consecutivo no tiene la cantidad de segmentos esperada.');
  }
  return consecutive;
}

/**
 * Extrae el código de establecimiento contenido en un consecutivo ya canónico.
 *
 * @param {string} consecutive Consecutivo canónico.
 * @returns {string} Segmento numérico del establecimiento.
 */
function establishmentCodeOf(consecutive) {
  return consecutive.split('-')[3];
}

/**
 * Exige que el establecimiento del consecutivo sea el de la persona referida.
 * No lo compara con el establecimiento de quien registra.
 *
 * Requisitos: HU-013 CA-26, RF-115 y RN-030.
 *
 * @param {string} consecutive Consecutivo canónico.
 * @param {number} establishmentId Establecimiento asociado a la persona.
 * @returns {void}
 * @throws {ValidationError} Cuando el segmento no coincide.
 */
function assertConsecutiveMatchesPerson(consecutive, establishmentId) {
  const code = establishmentCodeOf(consecutive);
  if (code !== String(establishmentId)) {
    throw new ValidationError(
      'El código de establecimiento del consecutivo no corresponde al establecimiento de la persona referida.'
    );
  }
}

/**
 * Limita un texto narrativo al tamaño de la columna.
 *
 * @param {unknown} value Texto recibido.
 * @param {string} label Nombre funcional del campo.
 * @returns {string|null} Texto o null.
 * @throws {ValidationError} Cuando supera la longitud permitida.
 */
function narrative(value, label) {
  const text = blankToNull(value);
  if (text && text.length > MAX_NARRATIVE_LENGTH) {
    throw new ValidationError(`El campo ${label} supera la longitud permitida.`);
  }
  return text;
}

/**
 * Clasifica un código de motivo para filtros y presentación.
 * Un código vigente que todavía no tiene categoría confirmada queda sin clasificar.
 *
 * @param {string} code Código de catálogo.
 * @returns {string} Categoría de lectura.
 */
function motiveCategory(code) {
  return MOTIVE_CATEGORY_BY_CODE[code] || 'SIN_CLASIFICAR';
}

/**
 * Códigos de motivo que pertenecen a una categoría de filtro.
 *
 * @param {string} category Categoría solicitada.
 * @returns {string[]} Códigos conocidos. Vacío cuando la categoría no tiene ítems confirmados.
 */
function motiveCodesForCategory(category) {
  return Object.entries(MOTIVE_CATEGORY_BY_CODE)
    .filter((entry) => entry[1] === category)
    .map((entry) => entry[0]);
}

/**
 * Valida motivos y elimina la posibilidad de una especificación huérfana.
 * Solo persisten los motivos seleccionados, cada uno con su propio texto.
 *
 * Requisitos: HU-013 CA-14, CA-15 y CA-16; RF-024, RF-025 y RF-026.
 *
 * @param {unknown} motives Lista recibida.
 * @param {Map<string, object>} catalogItems Motivos vigentes por código.
 * @returns {Array<object>} Motivos listos para persistir, con el ítem de catálogo.
 * @throws {ValidationError} Cuando falta el motivo, está repetido o la especificación no corresponde.
 */
function normalizeMotives(motives, catalogItems) {
  if (!Array.isArray(motives) || motives.length === 0) {
    throw new ValidationError('La referencia requiere al menos un motivo del catálogo vigente.');
  }
  if (motives.length > MAX_MOTIVES) {
    throw new ValidationError('La cantidad de motivos supera el máximo admitido.');
  }
  const selected = [];
  const seen = new Set();
  for (const motive of motives) {
    if (!motive || typeof motive !== 'object' || Array.isArray(motive)) {
      throw new ValidationError('Cada motivo debe indicar su código de catálogo.');
    }
    const code = typeof motive.code === 'string' ? motive.code.trim() : '';
    if (!code || seen.has(code)) {
      throw new ValidationError('Los motivos deben existir en el catálogo y no pueden repetirse.');
    }
    const item = catalogItems.get(code);
    if (!item) {
      throw new ValidationError('Hay un motivo que no pertenece al catálogo vigente.');
    }
    const specification = blankToNull(motive.specification);
    if (specification && specification.length > MAX_SPECIFICATION_LENGTH) {
      throw new ValidationError('La especificación de un motivo supera la longitud permitida.');
    }
    seen.add(code);
    selected.push({
      code,
      label: item.label,
      category: motiveCategory(code),
      itemId: item.itemId,
      specification
    });
  }
  return selected;
}

module.exports = {
  CONSECUTIVE_PATTERN,
  blankToNull,
  requireReferenceDate,
  ageAtReference,
  canonicalizeConsecutive,
  establishmentCodeOf,
  assertConsecutiveMatchesPerson,
  narrative,
  motiveCategory,
  motiveCodesForCategory,
  normalizeMotives
};
