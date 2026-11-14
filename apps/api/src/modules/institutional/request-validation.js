'use strict';

/*
  Validación de las consultas institucionales.
  Estos campos piden un filtro. No conceden permiso.
  El servicio decide después si ese filtro cabe en el acceso autorizado.
*/

const { ValidationError } = require('../../common/errors');

const SEARCH_LIMITS = Object.freeze({
  minQueryLength: 2,
  maxQueryLength: 80,
  maxPersonIdLength: 20,
  defaultPageSize: 20,
  maxPageSize: 25,
  maxOffset: 500
});

const PERSON_ID = /^[A-Za-z0-9-]{1,20}$/;
const POSITIVE_ID = /^[1-9][0-9]*$/;
const MAX_SQL_INT = 2147483647;

function validationError(message) {
  return new ValidationError(message);
}

/**
 * Lee un identificador opcional de región, oficina o establecimiento.
 * Vacío significa que el filtro no se pidió. Un texto que no sea un entero positivo se rechaza.
 */
function readOptionalId(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !POSITIVE_ID.test(value)) {
    throw validationError(`El parámetro ${label} no es válido.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SQL_INT) {
    throw validationError(`El parámetro ${label} no es válido.`);
  }
  return parsed;
}

function readPage(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  const page = readOptionalId(String(value), 'page');
  return page;
}

function readPageSize(value) {
  if (value === undefined || value === null || value === '') {
    return SEARCH_LIMITS.defaultPageSize;
  }
  const pageSize = readOptionalId(String(value), 'pageSize');
  if (pageSize > SEARCH_LIMITS.maxPageSize) {
    throw validationError('El tamaño de página supera el límite de la búsqueda contextual.');
  }
  return pageSize;
}

/**
 * Interpreta la búsqueda de personas.
 *
 * Exige un texto de al menos dos caracteres. La página y el tamaño tienen tope
 * para no pedir un recorrido ilimitado. Los filtros territoriales son opcionales.
 */
function readSearchQuery(query) {
  const source = query || {};
  if (typeof source.q !== 'string') {
    throw validationError('La búsqueda requiere identificación o nombre.');
  }
  const text = source.q.trim();
  if (text.length < SEARCH_LIMITS.minQueryLength) {
    throw validationError('La búsqueda requiere identificación o nombre de al menos 2 caracteres.');
  }
  if (text.length > SEARCH_LIMITS.maxQueryLength) {
    throw validationError('El criterio de búsqueda supera la longitud permitida.');
  }
  const page = readPage(source.page);
  const pageSize = readPageSize(source.pageSize);
  const offset = (page - 1) * pageSize;
  if (offset > SEARCH_LIMITS.maxOffset) {
    throw validationError('La página solicitada supera el límite de la búsqueda contextual.');
  }
  return {
    text,
    page,
    pageSize,
    offset,
    regionId: readOptionalId(source.regionId, 'regionId'),
    localOfficeId: readOptionalId(source.localOfficeId, 'localOfficeId'),
    establishmentId: readOptionalId(source.establishmentId, 'establishmentId')
  };
}

/**
 * Lee los filtros territoriales de las opciones de catálogo.
 * Ninguno es obligatorio: el ámbito concedido completa lo que falte.
 */
function readTerritoryQuery(query) {
  const source = query || {};
  return {
    regionId: readOptionalId(source.regionId, 'regionId'),
    localOfficeId: readOptionalId(source.localOfficeId, 'localOfficeId'),
    establishmentId: readOptionalId(source.establishmentId, 'establishmentId')
  };
}

/**
 * Acepta el identificador de persona de la ruta si usa letras, números o guiones.
 */
function readPersonId(value) {
  if (typeof value !== 'string' || !PERSON_ID.test(value) || value.length > SEARCH_LIMITS.maxPersonIdLength) {
    throw validationError('El identificador de la persona no es válido.');
  }
  return value;
}

module.exports = {
  SEARCH_LIMITS,
  readSearchQuery,
  readTerritoryQuery,
  readPersonId
};
