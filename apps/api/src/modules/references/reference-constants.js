'use strict';

/**
 * Constantes técnicas del módulo de referencias.
 * Los códigos de catálogo coinciden con la semilla confirmada.
 * La versión de plantilla y el tope de archivo son decisiones técnicas,
 * no un formulario institucional aprobado.
 * HU-014 permanece en propuesta de diseño validada.
 * HU-017 permanece con diseño documental pendiente.
 */

const TEMPLATE_VERSION = 'SIA-REF-PLANTILLA-1';
const MAX_TEMPLATE_BYTES = 1024 * 1024;
const MAX_MOTIVES = 20;
const MAX_SPECIFICATION_LENGTH = 1000;
const MAX_NARRATIVE_LENGTH = 2000;
const MAX_DRAFT_JSON_LENGTH = 12000;
const MAX_PAGE_SIZE = 50;
const DEFAULT_PAGE_SIZE = 20;
const MAX_OFFSET = 5000;
const NAME_MATCH_LIMIT = 100;

const ACTIVE_CASE_MESSAGE = 'No se puede registrar la referencia porque la persona tiene un caso de Atención Interdisciplinaria activo.';
const DUPLICATE_CONSECUTIVE_MESSAGE = 'El consecutivo ya está registrado.';
const PERSON_NOT_IN_SCOPE_MESSAGE = 'No hay una persona disponible con ese identificador en el ámbito autorizado.';
const REFERENCE_NOT_FOUND_MESSAGE = 'El recurso solicitado no existe.';
const RESPONSIBLE_LOCKED_MESSAGE = 'El responsable de la referencia se obtiene de la sesión y no puede sustituirse.';

const REGION_CODES = Object.freeze(['CS', 'HN', 'CH', 'HC', 'BR', 'CN', 'PC', 'CO', 'CE']);

const CAPTURE_ORIGIN = Object.freeze({
  MANUAL: 'MANUAL',
  TEMPLATE: 'PLANTILLA'
});

const REFERENCE_STATUS = Object.freeze({
  PENDING_REVIEW: 'PENDIENTE_REVISION',
  ADMITTED: 'ADMITIDA_AI',
  NOT_REQUIRED: 'NO_REQUIERE_AI'
});

const STATUS_LABEL = Object.freeze({
  PENDIENTE_REVISION: 'Pendiente de revisión',
  ADMITIDA_AI: 'Admitida a A.I.',
  NO_REQUIERE_AI: 'No requiere A.I.'
});

/**
 * Agrupación de lectura de los motivos confirmados en el catálogo vigente.
 * No inventa ítems de factores de riesgo: esos códigos no están en la semilla.
 */
const MOTIVE_CATEGORY_BY_CODE = Object.freeze({
  CONDICION_MALNUTRICION: 'CRECIMIENTO',
  MALNUTRICION_NECESIDADES_ESPECIALES: 'CRECIMIENTO',
  EDIN_II_RIESGO_RETRASO_ROJO: 'DESARROLLO',
  EVADE_RIESGO_REZAGO_0_1: 'DESARROLLO',
  OTRA_CONDICION_SALUD: 'SALUD'
});

const CATEGORY_LABEL = Object.freeze({
  CRECIMIENTO: 'Crecimiento',
  DESARROLLO: 'Desarrollo',
  SALUD: 'Salud',
  SIN_CLASIFICAR: 'Sin clasificación confirmada'
});

const TEMPLATE_HEADERS = Object.freeze([
  'version_plantilla',
  'identificacion_persona',
  'fecha_referencia',
  'via_atencion',
  'origen',
  'consecutivo',
  'motivos',
  'especificaciones',
  'acciones_previas',
  'resultados_previos',
  'informacion_complementaria'
]);

const TEMPLATE_SHEET = 'Referencia';

module.exports = {
  TEMPLATE_VERSION,
  MAX_TEMPLATE_BYTES,
  MAX_MOTIVES,
  MAX_SPECIFICATION_LENGTH,
  MAX_NARRATIVE_LENGTH,
  MAX_DRAFT_JSON_LENGTH,
  MAX_PAGE_SIZE,
  DEFAULT_PAGE_SIZE,
  MAX_OFFSET,
  NAME_MATCH_LIMIT,
  ACTIVE_CASE_MESSAGE,
  DUPLICATE_CONSECUTIVE_MESSAGE,
  PERSON_NOT_IN_SCOPE_MESSAGE,
  REFERENCE_NOT_FOUND_MESSAGE,
  RESPONSIBLE_LOCKED_MESSAGE,
  REGION_CODES,
  CAPTURE_ORIGIN,
  REFERENCE_STATUS,
  STATUS_LABEL,
  MOTIVE_CATEGORY_BY_CODE,
  CATEGORY_LABEL,
  TEMPLATE_HEADERS,
  TEMPLATE_SHEET
};
