'use strict';

const { ErrorValidacion } = require('../../common/errors');
const {
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  MAX_OFFSET,
  CAPTURE_ORIGIN,
  REFERENCE_STATUS
} = require('./reference-constants');
const { CodigosMotivoDeCategoria } = require('./reference-rules');

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
 * @throws {ErrorValidacion} Siempre.
 */
function CrearEntradaInvalida(message) {
  throw new ErrorValidacion(message);
}

/**
 * Lee un identificador de persona sin ampliar el alfabeto admitido por el vínculo.
 *
 * @param {unknown} value Identificador recibido.
 * @returns {string} Identificador recortado.
 * @throws {ErrorValidacion} Cuando el formato no es utilizable.
 */
function LeerIdentificadorPersona(value) {
  if (typeof value !== 'string' || !PERSON_ID.test(value.trim())) {
    CrearEntradaInvalida('La persona de la referencia no es válida.');
  }
  return value.trim();
}

/**
 * Lee un entero positivo de consulta.
 *
 * @param {unknown} value Texto del parámetro.
 * @param {string} label Nombre del parámetro.
 * @returns {number|null} Entero o null si el parámetro no vino.
 * @throws {ErrorValidacion} Cuando el texto no es un entero positivo.
 */
function LeerEnteroOpcional(value, label) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  const text = String(value);
  if (!POSITIVE_ID.test(text)) {
    CrearEntradaInvalida(`El parámetro ${label} no es válido.`);
  }
  const parsed = Number(text);
  if (!Number.isSafeInteger(parsed) || parsed > MAX_SQL_INT) {
    CrearEntradaInvalida(`El parámetro ${label} no es válido.`);
  }
  return parsed;
}

/**
 * Lee la paginación del listado sin permitir un desplazamiento ilimitado.
 *
 * @param {object} query Consulta HTTP.
 * @returns {{page: number, pageSize: number, offset: number}} Página normalizada.
 * @throws {ErrorValidacion} Cuando la página supera el tope técnico.
 */
function LeerPagina(query) {
  const page = LeerEnteroOpcional(query.page, 'page') || 1;
  const requestedSize = LeerEnteroOpcional(query.pageSize, 'pageSize');
  const pageSize = requestedSize === null ? DEFAULT_PAGE_SIZE : requestedSize;
  if (pageSize > MAX_PAGE_SIZE) {
    CrearEntradaInvalida('El tamaño de página supera el límite del listado de referencias.');
  }
  const offset = (page - 1) * pageSize;
  if (offset > MAX_OFFSET) {
    CrearEntradaInvalida('La página solicitada supera el límite del listado de referencias.');
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
 * @throws {ErrorValidacion} Cuando el texto supera la longitud.
 */
function LeerTextoBusqueda(value, label, maxLength) {
  if (value === undefined || value === null || value === '') {
    return null;
  }
  if (typeof value !== 'string') {
    CrearEntradaInvalida(`El parámetro ${label} no es válido.`);
  }
  const text = value.trim();
  if (text.length === 0) {
    return null;
  }
  if (text.length > maxLength) {
    CrearEntradaInvalida(`El parámetro ${label} supera la longitud permitida.`);
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
 * @throws {ErrorValidacion} Cuando un filtro no pertenece al vocabulario vigente.
 */
function LeerConsultaReferencias(query) {
  const source = query || {};
  const page = LeerPagina(source);
  const status = LeerTextoBusqueda(source.status, 'status', 30);
  if (status && !Object.values(REFERENCE_STATUS).includes(status)) {
    CrearEntradaInvalida('El estado solicitado no corresponde a un estado de referencia.');
  }
  const attentionRoute = LeerTextoBusqueda(source.attentionRoute, 'attentionRoute', 40);
  if (attentionRoute && !ROUTE_CODES.has(attentionRoute)) {
    CrearEntradaInvalida('La Vía de Atención solicitada no corresponde al catálogo vigente.');
  }
  const origin = LeerTextoBusqueda(source.origin, 'origin', 80);
  if (origin && !ORIGIN_CODES.has(origin)) {
    CrearEntradaInvalida('El origen solicitado no corresponde al catálogo vigente.');
  }
  const category = LeerTextoBusqueda(source.category, 'category', 40);
  if (category && !CATEGORIES.has(category)) {
    CrearEntradaInvalida('La categoría solicitada no corresponde a una categoría de motivo confirmada.');
  }
  const identification = LeerTextoBusqueda(source.identification, 'identification', 20);
  if (identification && !PERSON_ID.test(identification)) {
    CrearEntradaInvalida('La identificación buscada no es válida.');
  }
  return {
    ...page,
    name: LeerTextoBusqueda(source.name, 'name', 80),
    identification,
    consecutive: LeerTextoBusqueda(source.consecutive, 'consecutive', 80),
    status,
    attentionRoute,
    origin,
    category,
    motiveCodes: category ? CodigosMotivoDeCategoria(category) : [],
    categoryHasNoConfirmedCodes: Boolean(category) && CodigosMotivoDeCategoria(category).length === 0,
    establishmentId: LeerEnteroOpcional(source.establishmentId, 'establishmentId')
  };
}

/**
 * Lee el identificador técnico de una referencia.
 *
 * @param {unknown} value Segmento de ruta.
 * @returns {number} Identificador interno.
 * @throws {ErrorValidacion} Cuando no es un entero positivo.
 */
function LeerIdentificadorReferencia(value) {
  const parsed = LeerEnteroOpcional(value, 'referencia');
  if (parsed === null) {
    CrearEntradaInvalida('La referencia solicitada no es válida.');
  }
  return parsed;
}

/**
 * Copia solo los campos funcionales de un motivo.
 *
 * @param {unknown} value Elemento de la lista.
 * @returns {object} Motivo con código y especificación.
 * @throws {ErrorValidacion} Cuando el elemento no es un objeto.
 */
function LeerMotivo(value) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    CrearEntradaInvalida('Cada motivo debe indicar su código de catálogo.');
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
 * @throws {ErrorValidacion} Cuando el cuerpo intenta fijar el comprobante o el estado.
 */
function LeerSolicitudReferencia(body, options = {}) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    CrearEntradaInvalida('La solicitud de referencia no tiene un cuerpo utilizable.');
  }
  for (const field of LOCKED_FIELDS) {
    if (Object.prototype.hasOwnProperty.call(body, field)) {
      CrearEntradaInvalida('La solicitud no puede fijar el estado ni el comprobante de envío.');
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
    CrearEntradaInvalida('El origen de captura no es válido.');
  }
  if (options.requireCaptureOrigin && body.captureOrigin === undefined) {
    CrearEntradaInvalida('El envío debe indicar si la captura es manual o de plantilla.');
  }
  if (captureOrigin === CAPTURE_ORIGIN.TEMPLATE && (typeof body.templateVersion !== 'string' || body.templateVersion.trim() === '')) {
    CrearEntradaInvalida('Una referencia cargada desde plantilla debe indicar la versión de esa plantilla.');
  }
  return {
    personId: LeerIdentificadorPersona(body.personId),
    referenceDate: body.referenceDate,
    attentionRouteCode: body.attentionRouteCode,
    originCode: body.originCode,
    consecutive: body.consecutive,
    motives: Array.isArray(body.motives) ? body.motives.map(LeerMotivo) : body.motives,
    previousActions: body.previousActions,
    previousResults: body.previousResults,
    complementaryInformation: body.complementaryInformation,
    captureOrigin,
    templateVersion: typeof body.templateVersion === 'string' ? body.templateVersion.trim() : null,
    draftId: LeerEnteroOpcional(body.draftId, 'draftId'),
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
 * @throws {ErrorValidacion} Cuando el contenido no es un objeto.
 */
function LeerSolicitudBorrador(body) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    CrearEntradaInvalida('El borrador no tiene un cuerpo utilizable.');
  }
  if (!body.content || typeof body.content !== 'object' || Array.isArray(body.content)) {
    CrearEntradaInvalida('El borrador debe incluir el contenido de la captura.');
  }
  return {
    draftId: LeerEnteroOpcional(body.draftId, 'draftId'),
    personId: body.personId === undefined || body.personId === null || body.personId === ''
      ? null
      : LeerIdentificadorPersona(body.personId),
    content: body.content
  };
}

module.exports = {
  LeerConsultaReferencias,
  LeerIdentificadorReferencia,
  LeerSolicitudReferencia,
  LeerSolicitudBorrador,
  LeerIdentificadorPersona
};
