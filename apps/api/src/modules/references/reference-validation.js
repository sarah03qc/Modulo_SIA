'use strict';

const { ValidationError } = require('../../common/errors');
const {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  MAX_OFFSET,
  CAPTURE_ORIGIN,
  REFERENCE_STATUS
} = require('./reference-constants');
const { motiveCodesForCategory } = require('./reference-rules');

const PERSON_ID = /^[A-Za-z0-9-]{1,20}$/;
const POSITIVE_ID = /^[1-9][0-9]*$/;
const MAX_SQL_INT = 2147483647;
const CATEGORIES = new Set(['CRECIMIENTO', 'DESARROLLO', 'SALUD', 'FACTORES_RIESGO']);
const ROUTE_CODES = new Set(['URGENCIA', 'NO_INMEDIATA']);
const ORIGIN_CODES = new Set([
  'VIGILANCIA_TAMIZAJE',
  'OBSERVACION',
  'INFORMACION_FAMILIA_U_OTROS',
  'REFERENCIA_EXTERNA'
]);
const LOCKED_FIELDS = [
  'estado',
  'status',
  'enviada_en',
  'sentAt',
  'enviada_por',
  'creada_por',
  'creada_en'
];

/**
 * Rechaza un campo de entrada con un mensaje fijo.
 *
 * @param {string} message Mensaje visible para quien corrige la captura.
 * @returns {never}
 * @throws {ValidationError} Siempre.
 */
function invalid(message) {
  throw new ValidationError(message);
}

/**
 * Lee un identificador de persona sin ampliar el alfabeto admitido por el vínculo.
 *
 * @param {unknown} value Identificador recibido.
 * @returns {string} Identificador recortado.
 * @throws {ValidationError} Cuando el formato no es utilizable.
 */
function readPersonId(value) {
  if (typeof value !== 'string' || !PERSON_ID.test(value.trim())) {
    invalid('La persona de la referencia no es válida.');
  }
  return value.trim();
}

/**
 * Lee un entero positivo de consulta.
 *
 * @param {unknown} value Texto del parámetro.
 * @param {string} label Nombre del parámetro.
 * @returns {number|null} Entero o null si el parámetro no vino.
 * @throws {ValidationError} Cuando el texto no es un entero positivo.
 */
function readOptionalPositive(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const text = String(value);
  if (!POSITIVE_ID.test(text)) {
    invalid(`El parámetro ${label} no es válido.`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SQL_INT) {
    invalid(`El parámetro ${label} no es válido.`);
  }
  return parsed;
}

/**
 * Lee la paginación del listado sin permitir un desplazamiento ilimitado.
 *
 * @param {object} query Consulta HTTP.
 * @returns {{page: number, pageSize: number, offset: number}} Página normalizada.
 * @throws {ValidationError} Cuando la página supera el tope técnico.
 */
function readPage(query) {
  const page = readOptionalPositive(query.page, 'page') || 1;
  const requestedSize = readOptionalPositive(query.pageSize, 'pageSize');
  const pageSize = requestedSize === null ? DEFAULT_PAGE_SIZE : requestedSize;
  if (pageSize > MAX_PAGE_SIZE) {
    invalid('El tamaño de página supera el límite del listado de referencias.');
  }
  const offset = (page - 1) * pageSize;
  if (offset > MAX_OFFSET) {
    invalid('La página solicitada supera el límite del listado de referencias.');
  }
  return { page, pageSize, offset };
}

/**
 * Lee un criterio textual opcional.
 *
 * @param {unknown} value Parámetro de búsqueda.
 * @param {string} label Nombre funcional.
 * @param {number} maxLength Longitud máxima.
 * @returns {string|null} Texto recortado o null.
 * @throws {ValidationError} Cuando el texto supera la longitud.
 */
function readSearchText(value, label, maxLength) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    invalid(`El parámetro ${label} no es válido.`);
  }
  const text = value.trim();
  if (text.length === 0) {
    return null;
  }
  if (text.length > maxLength) {
    invalid(`El parámetro ${label} supera la longitud permitida.`);
  }
  return text;
}

/**
 * Traduce los filtros del listado. El ámbito no se toma de estos campos:
 * el servicio lo resuelve con el contexto de la sesión.
 *
 * Requisitos: HU-015 CA-03 y CA-04; RF-015 y RF-124.
 *
 * @param {object} query Consulta HTTP.
 * @returns {object} Filtros y paginación.
 * @throws {ValidationError} Cuando un filtro no pertenece al vocabulario vigente.
 */
function readReferenceListQuery(query) {
  const source = query || {};
  const page = readPage(source);
  const status = readSearchText(source.status, 'status', 30);
  if (status && !Object.values(REFERENCE_STATUS).includes(status)) {
    invalid('El estado solicitado no corresponde a un estado de referencia.');
  }
  const attentionRoute = readSearchText(source.attentionRoute, 'attentionRoute', 40);
  if (attentionRoute && !ROUTE_CODES.has(attentionRoute)) {
    invalid('La Vía de Atención solicitada no corresponde al catálogo vigente.');
  }
  const origin = readSearchText(source.origin, 'origin', 80);
  if (origin && !ORIGIN_CODES.has(origin)) {
    invalid('El origen solicitado no corresponde al catálogo vigente.');
  }
  const category = readSearchText(source.category, 'category', 40);
  if (category && !CATEGORIES.has(category)) {
    invalid('La categoría solicitada no corresponde a una categoría de motivo confirmada.');
  }
  const identification = readSearchText(source.identification, 'identification', 20);
  if (identification && !PERSON_ID.test(identification)) {
    invalid('La identificación buscada no es válida.');
  }
  return {
    ...page,
    name: readSearchText(source.name, 'name', 80),
    identification,
    consecutive: readSearchText(source.consecutive, 'consecutive', 80),
    status,
    attentionRoute,
    origin,
    category,
    motiveCodes: category && category !== 'FACTORES_RIESGO' ? motiveCodesForCategory(category) : [],
    categoryHasNoConfirmedCodes: category === 'FACTORES_RIESGO',
    establishmentId: readOptionalPositive(source.establishmentId, 'establishmentId')
  };
}

/**
 * Lee el identificador técnico de una referencia.
 *
 * @param {unknown} value Segmento de ruta.
 * @returns {number} Identificador interno.
 * @throws {ValidationError} Cuando no es un entero positivo.
 */
function readReferenceId(value) {
  const parsed = readOptionalPositive(value, 'referencia');
  if (parsed === null) {
    invalid('La referencia solicitada no es válida.');
  }
  return parsed;
}

/**
 * Copia solo los campos funcionales de un motivo.
 *
 * @param {unknown} value Elemento de la lista.
 * @returns {object} Motivo con código y especificación.
 * @throws {ValidationError} Cuando el elemento no es un objeto.
 */
function readMotive(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    invalid('Cada motivo debe indicar su código de catálogo.');
  }
  return {
    code: value.code,
    specification: value.specification
  };
}

/**
 * Lee el cuerpo de validación o de envío sin aceptar estado, fecha de envío ni responsable sustituto.
 * Si el cliente envía un responsable, queda marcado para que el servicio lo compare con la sesión.
 *
 * Requisitos: HU-013 CA-08 y CA-09; RF-023.
 *
 * @param {object} body Cuerpo JSON.
 * @param {{requireCaptureOrigin?: boolean}} options Exige origen de captura solo en el envío.
 * @returns {object} DTO de referencia.
 * @throws {ValidationError} Cuando el cuerpo intenta fijar el comprobante o el estado.
 */
function readReferralCommand(body, options = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    invalid('La solicitud de referencia no tiene un cuerpo utilizable.');
  }
  for (const field of LOCKED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      invalid('La solicitud no puede fijar el estado ni el comprobante de envío.');
    }
  }
  let responsibleProvided = false;
  let responsible = null;
  if (Object.prototype.hasOwnProperty.call(body, 'responsible') || Object.prototype.hasOwnProperty.call(body, 'responsable')) {
    responsibleProvided = true;
    const raw = Object.prototype.hasOwnProperty.call(body, 'responsible') ? body.responsible : body.responsable;
    responsible = typeof raw === 'string' ? raw.trim() : raw;
  }
  const captureOrigin = body.captureOrigin === undefined || body.captureOrigin === null || body.captureOrigin === ''
    ? CAPTURE_ORIGIN.MANUAL
    : body.captureOrigin;
  if (captureOrigin !== CAPTURE_ORIGIN.MANUAL && captureOrigin !== CAPTURE_ORIGIN.TEMPLATE) {
    invalid('El origen de captura no es válido.');
  }
  if (options.requireCaptureOrigin && body.captureOrigin === undefined) {
    invalid('El envío debe indicar si la captura es manual o de plantilla.');
  }
  if (captureOrigin === CAPTURE_ORIGIN.TEMPLATE && (typeof body.templateVersion !== 'string' || body.templateVersion.trim() === '')) {
    invalid('Una referencia cargada desde plantilla debe indicar la versión de esa plantilla.');
  }
  return {
    personId: readPersonId(body.personId),
    referenceDate: body.referenceDate,
    attentionRouteCode: body.attentionRouteCode,
    originCode: body.originCode,
    consecutive: body.consecutive,
    motives: Array.isArray(body.motives) ? body.motives.map(readMotive) : body.motives,
    previousActions: body.previousActions,
    previousResults: body.previousResults,
    complementaryInformation: body.complementaryInformation,
    captureOrigin,
    templateVersion: typeof body.templateVersion === 'string' ? body.templateVersion.trim() : null,
    draftId: readOptionalPositive(body.draftId, 'draftId'),
    responsibleProvided,
    responsible
  };
}

/**
 * Lee un borrador sin tratarlo como referencia enviada.
 * El contenido se conserva como objeto de captura. El servicio elimina el responsable.
 *
 * @param {object} body Cuerpo JSON.
 * @returns {object} Borrador todavía no enviado.
 * @throws {ValidationError} Cuando el contenido no es un objeto.
 */
function readDraftCommand(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    invalid('El borrador no tiene un cuerpo utilizable.');
  }
  if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
    invalid('El borrador debe incluir el contenido de la captura.');
  }
  return {
    draftId: readOptionalPositive(body.draftId, 'draftId'),
    personId: body.personId === undefined || body.personId === null || body.personId === ''
      ? null
      : readPersonId(body.personId),
    content: body.content
  };
}

module.exports = {
  readReferenceListQuery,
  readReferenceId,
  readReferralCommand,
  readDraftCommand,
  readPersonId
};
