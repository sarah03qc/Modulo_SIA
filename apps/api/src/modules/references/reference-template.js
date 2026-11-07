'use strict';

const ExcelJS = require('exceljs');
const { ValidationError } = require('../../common/errors');
const {
  TEMPLATE_VERSION,
  TEMPLATE_HEADERS,
  TEMPLATE_SHEET,
  MAX_TEMPLATE_BYTES
} = require('./reference-constants');

const INSTRUCTIONS = [
  'Plantilla técnica de precarga. No es el formulario gráfico institucional definitivo.',
  'Cargar este archivo no envía la referencia, no reserva el consecutivo y no asigna responsable.',
  'El responsable se toma de la sesión al confirmar. No agregue una columna de responsable.',
  'Complete una sola fila de datos, la fila 2 de la hoja Referencia.',
  'version_plantilla debe ser SIA-REF-PLANTILLA-1.',
  'fecha_referencia usa AAAA-MM-DD.',
  'via_atencion admite URGENCIA o NO_INMEDIATA.',
  'origen admite VIGILANCIA_TAMIZAJE, OBSERVACION, INFORMACION_FAMILIA_U_OTROS o REFERENCIA_EXTERNA.',
  'consecutivo se digita completo. Esta plantilla no lo genera.',
  'motivos separa códigos con |. Ejemplo: CONDICION_MALNUTRICION|EDIN_II_RIESGO_RETRASO_ROJO.',
  'especificaciones usa CODIGO=texto y separa pares con ||.',
  'No use fórmulas, macros ni enlaces.'
];

/**
 * Detecta contenido activo en el paquete OOXML antes de interpretarlo.
 *
 * @param {Buffer} buffer Archivo recibido.
 * @returns {void}
 * @throws {ValidationError} Cuando hay macros, enlaces externos u hojas de macro.
 */
function assertInactivePackage(buffer) {
  const latin = buffer.toString('latin1');
  if (
    latin.includes('vbaProject')
    || latin.includes('xl/externalLinks')
    || latin.includes('macrosheets')
    || latin.includes('xl/embeddings')
    || latin.includes('xl/activeX')
  ) {
    throw new ValidationError('El archivo contiene macros, enlaces externos o contenido activo y no se procesa.');
  }
}

/**
 * Lee el texto de una celda y rechaza fórmulas, hipervínculos y valores enriquecidos.
 *
 * @param {object|undefined} cell Celda de ExcelJS.
 * @returns {string} Texto plano.
 * @throws {ValidationError} Cuando la celda no es un valor plano.
 */
function plainCell(cell) {
  if (cell && cell.hyperlink) {
    throw new ValidationError('La plantilla contiene fórmulas o enlaces y no se procesa.');
  }
  if (!cell || cell.value === null || cell.value === undefined) {
    return '';
  }
  const value = cell.value;
  if (typeof value === 'number') {
    return String(value);
  }
  if (typeof value === 'string') {
    return value.trim();
  }
  if (value instanceof Date) {
    throw new ValidationError('Las fechas de la plantilla deben escribirse como texto AAAA-MM-DD, sin formato de fecha de Excel.');
  }
  if (typeof value === 'object') {
    if (value.formula || value.sharedFormula || value.hyperlink) {
      throw new ValidationError('La plantilla contiene fórmulas o enlaces y no se procesa.');
    }
    if (Array.isArray(value.richText)) {
      throw new ValidationError('La plantilla contiene texto enriquecido y no se procesa.');
    }
  }
  throw new ValidationError('La plantilla contiene un valor que no puede leerse como texto.');
}

/**
 * Separa especificaciones CODIGO=texto unidas por ||.
 *
 * @param {string} text Celda de especificaciones.
 * @returns {Map<string, string>} Especificación por código de motivo.
 * @throws {ValidationError} Cuando un par no tiene código.
 */
function parseSpecifications(text) {
  const specifications = new Map();
  if (!text) {
    return specifications;
  }
  const pairs = text.split('||').map((part) => part.trim()).filter((part) => part.length > 0);
  for (const pair of pairs) {
    const separator = pair.indexOf('=');
    if (separator <= 0) {
      throw new ValidationError('Cada especificación debe escribirse como CODIGO=texto.');
    }
    const code = pair.slice(0, separator).trim();
    const specification = pair.slice(separator + 1).trim();
    if (!code || specifications.has(code)) {
      throw new ValidationError('Las especificaciones de la plantilla tienen un código vacío o repetido.');
    }
    specifications.set(code, specification);
  }
  return specifications;
}

/**
 * Genera el libro de la plantilla vigente, sin fórmulas ni datos de una persona.
 *
 * Requisito: HU-014 CA-01 y RF-036.
 *
 * @returns {Promise<Buffer>} Libro XLSX.
 */
async function buildTemplateWorkbook() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'SIA-CENCINAI';
  const sheet = workbook.addWorksheet(TEMPLATE_SHEET);
  sheet.addRow([...TEMPLATE_HEADERS]);
  sheet.addRow([TEMPLATE_VERSION, '', '', '', '', '', '', '', '', '', '']);
  sheet.getRow(1).font = { bold: true };
  const help = workbook.addWorksheet('Instrucciones');
  for (const line of INSTRUCTIONS) {
    help.addRow([line]);
  }
  const raw = await workbook.xlsx.writeBuffer();
  return Buffer.from(raw);
}

/**
 * Extrae una sola referencia del libro y la deja lista para corrección humana.
 * No llama al registro y no reserva el consecutivo.
 *
 * Requisitos: HU-014 CA-02, CA-03 y CA-04; RF-036.
 *
 * @param {Buffer} buffer Archivo recibido.
 * @returns {Promise<object>} Cuerpo compatible con el envío, sin responsable.
 * @throws {ValidationError} Cuando el tipo, el tamaño, la versión o la estructura no corresponden.
 */
async function readTemplateWorkbook(buffer) {
  if (!Buffer.isBuffer(buffer) || buffer.length === 0) {
    throw new ValidationError('No se recibió un archivo de plantilla.');
  }
  if (buffer.length > MAX_TEMPLATE_BYTES) {
    throw new ValidationError('El archivo de plantilla supera el tamaño permitido.');
  }
  if (buffer[0] !== 0x50 || buffer[1] !== 0x4b) {
    throw new ValidationError('El archivo no es un libro de Excel compatible.');
  }
  assertInactivePackage(buffer);
  const workbook = new ExcelJS.Workbook();
  try {
    await workbook.xlsx.load(buffer);
  } catch {
    throw new ValidationError('El archivo de plantilla no pudo leerse. Compruebe que no esté dañado.');
  }
  const sheet = workbook.getWorksheet(TEMPLATE_SHEET);
  if (!sheet) {
    throw new ValidationError('La plantilla no contiene la hoja Referencia.');
  }
  const headers = TEMPLATE_HEADERS.map((header, index) => plainCell(sheet.getRow(1).getCell(index + 1)));
  if (headers.some((header, index) => header !== TEMPLATE_HEADERS[index])) {
    throw new ValidationError('La estructura de la plantilla no corresponde a la versión compatible.');
  }
  const extraHeader = plainCell(sheet.getRow(1).getCell(TEMPLATE_HEADERS.length + 1));
  if (extraHeader) {
    throw new ValidationError('La plantilla tiene columnas que no pertenecen a la versión compatible.');
  }
  const values = TEMPLATE_HEADERS.map((header, index) => plainCell(sheet.getRow(2).getCell(index + 1)));
  if (sheet.rowCount > 2) {
    const third = TEMPLATE_HEADERS.some((header, index) => plainCell(sheet.getRow(3).getCell(index + 1)) !== '');
    if (third) {
      throw new ValidationError('La plantilla solo admite una referencia por archivo.');
    }
  }
  const [
    version,
    personId,
    referenceDate,
    attentionRouteCode,
    originCode,
    consecutive,
    motiveText,
    specificationText,
    previousActions,
    previousResults,
    complementaryInformation
  ] = values;
  if (version !== TEMPLATE_VERSION) {
    throw new ValidationError('La versión de la plantilla no es compatible.');
  }
  const motiveCodes = motiveText.split('|').map((code) => code.trim()).filter((code) => code.length > 0);
  const specifications = parseSpecifications(specificationText);
  const motives = motiveCodes.map((code) => ({
    code,
    specification: specifications.get(code) || null
  }));
  for (const code of specifications.keys()) {
    if (!motiveCodes.includes(code)) {
      throw new ValidationError('Hay una especificación de un motivo que no está seleccionado.');
    }
  }
  return {
    templateVersion: version,
    referral: {
      personId,
      referenceDate,
      attentionRouteCode,
      originCode,
      consecutive,
      motives,
      previousActions,
      previousResults,
      complementaryInformation,
      captureOrigin: 'PLANTILLA',
      templateVersion: version
    }
  };
}

module.exports = {
  buildTemplateWorkbook,
  readTemplateWorkbook
};
