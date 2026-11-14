/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-07 (f289a6c).
 * Modificación del 2026-11-14: hojas admitidas y tope al descomprimir el XLSX.
 */
'use strict';

const ExcelJS = require('exceljs');
const { ErrorValidacion } = require('../../common/errors');
const {
  TEMPLATE_VERSION,
  TEMPLATE_HEADERS,
  TEMPLATE_SHEET,
  MAX_TEMPLATE_BYTES
} = require('./reference-constants');

const HOJA_INSTRUCCIONES = 'Instrucciones';
const LIMITE_ENTRADAS_ZIP = 64;
const LIMITE_OCTETOS_DESCOMPRIMIDOS = 4 * 1024 * 1024;
const MARCAS_CONTENIDO_ACTIVO = Object.freeze([
  'vbaProject',
  'xl/externalLinks',
  'macrosheets',
  'xl/embeddings',
  'xl/activeX'
]);

const INSTRUCCIONES = [
  'Plantilla técnica de precarga. No es el formulario gráfico institucional definitivo.',
  'Cargar este archivo no envía la referencia, no reserva el consecutivo y no asigna responsable.',
  'El responsable se toma de la sesión al confirmar. No agregue una columna de responsable.',
  'Complete una sola fila de datos, la fila 2 de la hoja Referencia.',
  'version_plantilla debe ser SIA-REF-PLANTILLA-1.',
  'fecha_referencia usa AAAA-MM-DD.',
  'via_atencion admite URGENCIA o NO_INMEDIATA.',
  'origen admite VIGILANCIA_TAMIZAJE, OBSERVACION, '
  + 'INFORMACION_FAMILIA_U_OTROS o REFERENCIA_EXTERNA.',
  'consecutivo se digita completo. Esta plantilla no lo genera.',
  'motivos separa códigos con |. Ejemplo: CONDICION_MALNUTRICION|EDIN_II_RIESGO_RETRASO_ROJO.',
  'especificaciones usa CODIGO=texto y separa pares con ||.',
  'No use fórmulas, macros ni enlaces.'
];

/**
 * Indica si un nombre o fragmento corresponde a contenido activo.
 *
 * @param {string} texto Nombre de entrada o contenido sin comprimir.
 * @returns {boolean} Verdadero cuando la marca está presente.
 */
function ContieneMarcaActiva(texto) {
  const normalizado = texto.toLowerCase();
  return MARCAS_CONTENIDO_ACTIVO.some((marca) => normalizado.includes(marca.toLowerCase()));
}

/**
 * Localiza el fin del directorio central cuyo comentario cierra el archivo.
 *
 * @param {Buffer} contenido Archivo ZIP recibido.
 * @returns {number} Posición de la firma, o -1 si el cierre no cuadra.
 */
function BuscarFinDirectorioZip(contenido) {
  const firma = 0x06054b50;
  const minimo = Math.max(0, contenido.length - 22 - 65535);
  for (let posicion = contenido.length - 22; posicion >= minimo; posicion -= 1) {
    if (contenido.readUInt32LE(posicion) !== firma) {
      continue;
    }
    const largoComentario = contenido.readUInt16LE(posicion + 20);
    if (posicion + 22 + largoComentario === contenido.length) {
      return posicion;
    }
  }
  return -1;
}

/**
 * Lee nombres y tamaños declarados sin descomprimir las entradas.
 *
 * @param {Buffer} contenido Archivo ZIP recibido.
 * @returns {Array<{nombre: string, tamanoDescomprimido: number}>} Entradas del directorio.
 * @throws {ErrorValidacion} Cuando el paquete no tiene un directorio central usable.
 */
function LeerEntradasZip(contenido) {
  const fin = BuscarFinDirectorioZip(contenido);
  if (fin < 0) {
    throw new ErrorValidacion('El archivo no es un libro de Excel compatible.');
  }
  const totalEntradas = contenido.readUInt16LE(fin + 10);
  const tamanoDirectorio = contenido.readUInt32LE(fin + 12);
  const desplazamiento = contenido.readUInt32LE(fin + 16);
  const directorioInusable = totalEntradas === 0xffff
    || tamanoDirectorio === 0xffffffff
    || desplazamiento === 0xffffffff
    || totalEntradas > LIMITE_ENTRADAS_ZIP
    || desplazamiento + tamanoDirectorio > contenido.length;
  if (directorioInusable) {
    throw new ErrorValidacion('El archivo de plantilla tiene una estructura demasiado extensa.');
  }
  const entradas = [];
  let cursor = desplazamiento;
  const limite = desplazamiento + tamanoDirectorio;
  while (entradas.length < totalEntradas) {
    if (cursor + 46 > limite || contenido.readUInt32LE(cursor) !== 0x02014b50) {
      throw new ErrorValidacion('El archivo no es un libro de Excel compatible.');
    }
    const tamanoDescomprimido = contenido.readUInt32LE(cursor + 24);
    const largoNombre = contenido.readUInt16LE(cursor + 28);
    const largoExtra = contenido.readUInt16LE(cursor + 30);
    const largoComentario = contenido.readUInt16LE(cursor + 32);
    const inicioNombre = cursor + 46;
    const finNombre = inicioNombre + largoNombre;
    if (finNombre + largoExtra + largoComentario > contenido.length) {
      throw new ErrorValidacion('El archivo no es un libro de Excel compatible.');
    }
    entradas.push({
      nombre: contenido.toString('utf8', inicioNombre, finNombre),
      tamanoDescomprimido
    });
    cursor = finNombre + largoExtra + largoComentario;
  }
  return entradas;
}

/**
 * Rechaza macros, enlaces externos y paquetes cuyo tamaño declarado no cabe.
 *
 * @param {Buffer} contenido Archivo recibido.
 * @returns {void}
 * @throws {ErrorValidacion} Cuando hay contenido activo o el ZIP declara demasiado.
 */
function ValidarPaqueteInactivo(contenido) {
  const latin = contenido.toString('latin1');
  if (MARCAS_CONTENIDO_ACTIVO.some((marca) => latin.includes(marca))) {
    throw new ErrorValidacion(
      'El archivo contiene macros, enlaces externos o contenido activo y no se procesa.'
    );
  }
  let totalDescomprimido = 0;
  for (const entrada of LeerEntradasZip(contenido)) {
    const nombre = entrada.nombre.replace(/\\/g, '/');
    if (ContieneMarcaActiva(nombre)) {
      throw new ErrorValidacion(
        'El archivo contiene macros, enlaces externos o contenido activo y no se procesa.'
      );
    }
    const excede = entrada.tamanoDescomprimido === 0xffffffff
      || entrada.tamanoDescomprimido > LIMITE_OCTETOS_DESCOMPRIMIDOS
      || totalDescomprimido + entrada.tamanoDescomprimido > LIMITE_OCTETOS_DESCOMPRIMIDOS;
    if (excede) {
      throw new ErrorValidacion(
        'El archivo de plantilla supera el tamaño permitido al descomprimirse.'
      );
    }
    totalDescomprimido += entrada.tamanoDescomprimido;
  }
}

/**
 * Lee el texto de una celda y rechaza fórmulas, hipervínculos y valores enriquecidos.
 *
 * @param {object|undefined} celda Celda de ExcelJS.
 * @returns {string} Texto plano.
 * @throws {ErrorValidacion} Cuando la celda no es un valor plano.
 */
function LeerTextoCelda(celda) {
  if (celda && celda.hyperlink) {
    throw new ErrorValidacion('La plantilla contiene fórmulas o enlaces y no se procesa.');
  }
  if (!celda || celda.value === null || celda.value === undefined) {
    return '';
  }
  const valor = celda.value;
  if (typeof valor === 'number') {
    return String(valor);
  }
  if (typeof valor === 'string') {
    return valor.trim();
  }
  if (valor instanceof Date) {
    throw new ErrorValidacion(
      'Las fechas de la plantilla deben escribirse como texto AAAA-MM-DD, '
      + 'sin formato de fecha de Excel.'
    );
  }
  if (typeof valor === 'object') {
    if (valor.formula || valor.sharedFormula || valor.hyperlink) {
      throw new ErrorValidacion('La plantilla contiene fórmulas o enlaces y no se procesa.');
    }
    if (Array.isArray(valor.richText)) {
      throw new ErrorValidacion('La plantilla contiene texto enriquecido y no se procesa.');
    }
  }
  throw new ErrorValidacion('La plantilla contiene un valor que no puede leerse como texto.');
}

/**
 * Separa especificaciones CODIGO=texto unidas por ||.
 *
 * @param {string} texto Celda de especificaciones.
 * @returns {Map<string, string>} Especificación por código de motivo.
 * @throws {ErrorValidacion} Cuando un par no tiene código.
 */
function InterpretarEspecificaciones(texto) {
  const especificaciones = new Map();
  if (!texto) {
    return especificaciones;
  }
  const pares = texto.split('||').map((parte) => parte.trim()).filter((parte) => parte.length > 0);
  for (const par of pares) {
    const separador = par.indexOf('=');
    if (separador <= 0) {
      throw new ErrorValidacion('Cada especificación debe escribirse como CODIGO=texto.');
    }
    const codigo = par.slice(0, separador).trim();
    const especificacion = par.slice(separador + 1).trim();
    if (!codigo || especificaciones.has(codigo)) {
      throw new ErrorValidacion(
        'Las especificaciones de la plantilla tienen un código vacío o repetido.'
      );
    }
    especificaciones.set(codigo, especificacion);
  }
  return especificaciones;
}

/**
 * Genera el libro de la plantilla vigente, sin fórmulas ni datos de una persona.
 *
 * Requisito: HU-014 CA-01 y RF-036.
 *
 * @returns {Promise<Buffer>} Libro XLSX.
 */
async function GenerarLibroPlantilla() {
  const libro = new ExcelJS.Workbook();
  libro.creator = 'SIA-CENCINAI';
  const hoja = libro.addWorksheet(TEMPLATE_SHEET);
  hoja.addRow([...TEMPLATE_HEADERS]);
  hoja.addRow([TEMPLATE_VERSION, '', '', '', '', '', '', '', '', '', '']);
  hoja.getRow(1).font = { bold: true };
  const ayuda = libro.addWorksheet(HOJA_INSTRUCCIONES);
  for (const linea of INSTRUCCIONES) {
    ayuda.addRow([linea]);
  }
  const crudo = await libro.xlsx.writeBuffer();
  return Buffer.from(crudo);
}

/**
 * Extrae una sola referencia del libro y la deja lista para corrección humana.
 * No llama al registro y no reserva el consecutivo.
 *
 * Requisitos: HU-014 CA-02, CA-03 y CA-04; RF-036.
 *
 * @param {Buffer} contenido Archivo recibido.
 * @returns {Promise<object>} Cuerpo compatible con el envío, sin responsable.
 * @throws {ErrorValidacion} Cuando el tipo, el tamaño, la versión o la estructura no corresponden.
 */
async function LeerLibroPlantilla(contenido) {
  if (!Buffer.isBuffer(contenido) || contenido.length === 0) {
    throw new ErrorValidacion('No se recibió un archivo de plantilla.');
  }
  if (contenido.length > MAX_TEMPLATE_BYTES) {
    throw new ErrorValidacion('El archivo de plantilla supera el tamaño permitido.');
  }
  if (contenido[0] !== 0x50 || contenido[1] !== 0x4b) {
    throw new ErrorValidacion('El archivo no es un libro de Excel compatible.');
  }
  ValidarPaqueteInactivo(contenido);
  const libro = new ExcelJS.Workbook();
  try {
    await libro.xlsx.load(contenido);
  } catch {
    throw new ErrorValidacion(
      'El archivo de plantilla no pudo leerse. Compruebe que no esté dañado.'
    );
  }
  const hoja = libro.getWorksheet(TEMPLATE_SHEET);
  if (!hoja) {
    throw new ErrorValidacion('La plantilla no contiene la hoja Referencia.');
  }
  ValidarHojasPlantilla(libro);
  const encabezados = TEMPLATE_HEADERS.map((encabezado, indice) => (
    LeerTextoCelda(hoja.getRow(1).getCell(indice + 1))
  ));
  if (encabezados.some((encabezado, indice) => encabezado !== TEMPLATE_HEADERS[indice])) {
    throw new ErrorValidacion(
      'La estructura de la plantilla no corresponde a la versión compatible.'
    );
  }
  ValidarDimensionesPlantilla(hoja);
  const valores = TEMPLATE_HEADERS.map((encabezado, indice) => (
    LeerTextoCelda(hoja.getRow(2).getCell(indice + 1))
  ));
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
  ] = valores;
  if (version !== TEMPLATE_VERSION) {
    throw new ErrorValidacion('La versión de la plantilla no es compatible.');
  }
  const codigosMotivo = motiveText
    .split('|')
    .map((codigo) => codigo.trim())
    .filter((codigo) => codigo.length > 0);
  const especificaciones = InterpretarEspecificaciones(specificationText);
  const motives = codigosMotivo.map((code) => ({
    code,
    specification: especificaciones.get(code) || null
  }));
  for (const code of especificaciones.keys()) {
    if (!codigosMotivo.includes(code)) {
      throw new ErrorValidacion('Hay una especificación de un motivo que no está seleccionado.');
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

/**
 * Admite solo la hoja de datos y la de instrucciones, y revisa sus celdas.
 * La hoja de instrucciones puede omitirse. Cualquier otra hoja se rechaza.
 *
 * @param {ExcelJS.Workbook} libro Libro ya abierto.
 * @returns {void}
 * @throws {ErrorValidacion} Cuando hay hojas ajenas, fórmulas o enlaces.
 */
function ValidarHojasPlantilla(libro) {
  for (const hoja of libro.worksheets) {
    if (hoja.name !== TEMPLATE_SHEET && hoja.name !== HOJA_INSTRUCCIONES) {
      throw new ErrorValidacion(
        'La plantilla contiene hojas que no pertenecen a la versión compatible.'
      );
    }
    hoja.eachRow((fila) => {
      fila.eachCell((celda) => {
        LeerTextoCelda(celda);
      });
    });
  }
}

/**
 * Verifica las celdas con contenido fuera de las dos filas y columnas definidas.
 * El formato de celdas vacías no amplía la estructura de HU-014 y RF-036.
 *
 * @param {ExcelJS.Worksheet} hoja Hoja de referencia del libro recibido.
 * @throws {ErrorValidacion} Cuando hay datos fuera de la estructura de la plantilla.
 */
function ValidarDimensionesPlantilla(hoja) {
  hoja.eachRow((fila, numeroFila) => {
    fila.eachCell((celda, numeroColumna) => {
      if (numeroFila <= 2 && numeroColumna <= TEMPLATE_HEADERS.length) {
        return;
      }
      if (LeerTextoCelda(celda) === '') {
        return;
      }
      if (numeroFila > 2) {
        throw new ErrorValidacion('La plantilla solo admite una referencia por archivo.');
      }
      throw new ErrorValidacion(
        'La plantilla tiene columnas que no pertenecen a la versión compatible.'
      );
    });
  });
}

module.exports = {
  GenerarLibroPlantilla,
  LeerLibroPlantilla
};
