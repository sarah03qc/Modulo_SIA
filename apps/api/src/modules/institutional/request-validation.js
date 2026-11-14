'use strict';

/*
  Validación de las consultas institucionales.
  Estos campos piden un filtro. No conceden permiso.
  El servicio decide después si ese filtro cabe en el acceso autorizado.
*/

const { ErrorValidacion } = require('../../common/errors');

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

function CrearErrorDeEntrada(message) {
  return new ErrorValidacion(message);
}

/**
 * Lee un identificador opcional de región, oficina o establecimiento.
 * Vacío significa que el filtro no se pidió. Un texto que no sea un entero positivo se rechaza.
 */
function LeerIdentificadorOpcional(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string' || !POSITIVE_ID.test(value)) {
    throw CrearErrorDeEntrada(`El parámetro ${label} no es válido.`);
  }
  const parsed = Number(value);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SQL_INT) {
    throw CrearErrorDeEntrada(`El parámetro ${label} no es válido.`);
  }
  return parsed;
}

function LeerPagina(value) {
  if (value === undefined || value === null || value === '') {
    return 1;
  }
  const page = LeerIdentificadorOpcional(String(value), 'page');
  return page;
}

function LeerTamanoPagina(value) {
  if (value === undefined || value === null || value === '') {
    return SEARCH_LIMITS.defaultPageSize;
  }
  const pageSize = LeerIdentificadorOpcional(String(value), 'pageSize');
  if (pageSize > SEARCH_LIMITS.maxPageSize) {
    throw CrearErrorDeEntrada('El tamaño de página supera el límite de la búsqueda contextual.');
  }
  return pageSize;
}

/**
 * Interpreta la búsqueda de personas.
 *
 * Exige un texto de al menos dos caracteres. La página y el tamaño tienen tope
 * para no pedir un recorrido ilimitado. Los filtros territoriales son opcionales.
 */
function LeerConsultaBusqueda(query) {
  const source = query || {};
  if (typeof source.q !== 'string') {
    throw CrearErrorDeEntrada('La búsqueda requiere identificación o nombre.');
  }
  const text = source.q.trim();
  if (text.length < SEARCH_LIMITS.minQueryLength) {
    throw CrearErrorDeEntrada('La búsqueda requiere identificación o nombre de al menos 2 caracteres.');
  }
  if (text.length > SEARCH_LIMITS.maxQueryLength) {
    throw CrearErrorDeEntrada('El criterio de búsqueda supera la longitud permitida.');
  }
  const page = LeerPagina(source.page);
  const pageSize = LeerTamanoPagina(source.pageSize);
  const offset = (page - 1) * pageSize;
  if (offset > SEARCH_LIMITS.maxOffset) {
    throw CrearErrorDeEntrada('La página solicitada supera el límite de la búsqueda contextual.');
  }
  return {
    text,
    page,
    pageSize,
    offset,
    regionId: LeerIdentificadorOpcional(source.regionId, 'regionId'),
    localOfficeId: LeerIdentificadorOpcional(source.localOfficeId, 'localOfficeId'),
    establishmentId: LeerIdentificadorOpcional(source.establishmentId, 'establishmentId')
  };
}

/**
 * Lee los filtros territoriales de las opciones de catálogo.
 * Ninguno es obligatorio: el ámbito concedido completa lo que falte.
 */
function LeerConsultaTerritorio(query) {
  const source = query || {};
  return {
    regionId: LeerIdentificadorOpcional(source.regionId, 'regionId'),
    localOfficeId: LeerIdentificadorOpcional(source.localOfficeId, 'localOfficeId'),
    establishmentId: LeerIdentificadorOpcional(source.establishmentId, 'establishmentId')
  };
}

/**
 * Acepta el identificador de persona de la ruta si usa letras, números o guiones.
 */
function LeerIdentificadorPersona(value) {
  if (typeof value !== 'string' || !PERSON_ID.test(value) || value.length > SEARCH_LIMITS.maxPersonIdLength) {
    throw CrearErrorDeEntrada('El identificador de la persona no es válido.');
  }
  return value;
}

module.exports = {
  SEARCH_LIMITS,
  LeerConsultaBusqueda,
  LeerConsultaTerritorio,
  LeerIdentificadorPersona
};
