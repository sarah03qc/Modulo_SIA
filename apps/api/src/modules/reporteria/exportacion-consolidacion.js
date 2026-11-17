/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Creación: 2026-11-16. Modificación: 2026-11-16.
 * HU-039, HU-041 y HU-043. La descarga usa el mismo corte que la consulta.
 * Un texto que Excel trataría como fórmula se guarda como texto.
 */
'use strict';

const ExcelJS = require('exceljs');
const { ErrorConflicto } = require('../../common/errors');
const { LIMITE_FILAS_EXPORTACION } = require('./definiciones-analiticas');

/**
 * Evita que una celda textual se ejecute como fórmula al abrirla.
 *
 * @param {string|number|null} valor Valor ya calculado.
 * @returns {string|number|null} Valor seguro para una hoja de cálculo.
 */
function TextoCelda(valor) {
  if (valor === null || valor === undefined) {
    return '';
  }
  if (typeof valor === 'number') {
    return valor;
  }
  const texto = String(valor);
  if (/^[=+\-@\t\r]/.test(texto)) {
    return `'${texto}`;
  }
  return texto;
}

function AgregarFila(hoja, valores) {
  hoja.addRow(valores.map((valor) => TextoCelda(valor)));
}

function Encabezado(hoja) {
  hoja.getRow(1).font = { bold: true };
}

/**
 * Rechaza una descarga que no pueda incluir el conjunto filtrado completo.
 *
 * @param {number} cantidad Filas del conjunto.
 */
function AfirmarExportacionCompleta(cantidad) {
  if (cantidad > LIMITE_FILAS_EXPORTACION) {
    throw new ErrorConflicto(
      `La consolidación tiene ${cantidad} filas y supera el límite de `
      + `${LIMITE_FILAS_EXPORTACION}. No se entrega un archivo parcial.`
    );
  }
}

/**
 * Arma el libro de la consolidación a partir del corte ya calculado.
 *
 * @param {object} corte Corte ensamblado.
 * @returns {Promise<Buffer>} Libro XLSX.
 */
async function CrearLibroConsolidacion(corte) {
  AfirmarExportacionCompleta(corte.casosSinAtencion.filas.length);
  const libro = new ExcelJS.Workbook();
  libro.creator = 'SIA-CENCINAI';
  const corteHoja = libro.addWorksheet('Corte');
  AgregarFila(corteHoja, ['Atributo', 'Valor']);
  Encabezado(corteHoja);
  const atributos = [
    ['Ámbito', corte.etiquetaAmbito || 'Oficina Local'],
    ['Oficina local', corte.oficinaLocalId],
    ['Región', corte.regionId],
    ['Año', corte.anio],
    ['Fecha de consulta', corte.fechaConsulta],
    ['Filtros activos', corte.filtrosActivos.map((filtro) => filtro.etiqueta).join('; ')],
    ['Cobertura', corte.cobertura.texto],
    ['Ratificación', corte.cobertura.ratificacion],
    ['Denominador D', corte.cobertura.denominador],
    ['Numerador N', corte.cobertura.numerador],
    ['Porcentaje', corte.cobertura.porcentaje === null
      ? corte.cobertura.mensaje
      : corte.cobertura.porcentaje],
    ['Personas únicas atendidas', corte.personasUnicas],
    ['Total de atenciones', corte.totalAtenciones],
    ['Atenciones individuales', corte.atencionesIndividuales],
    ['Atenciones grupales', corte.atencionesGrupales],
    ['Referencias enviadas', corte.referencias.enviadas],
    ['Referencias analizadas', corte.referencias.analizadas],
    ['Referencias admitidas', corte.referencias.admitidas],
    ['No requiere A.I.', corte.referencias.noRequiere]
  ];
  for (const atributo of atributos) {
    AgregarFila(corteHoja, atributo);
  }
  const indicadores = libro.addWorksheet('Indicadores');
  AgregarFila(indicadores, ['Indicador', 'Valor', 'Nota']);
  Encabezado(indicadores);
  AgregarFila(indicadores, [
    'Personas únicas atendidas',
    corte.personasUnicas,
    'Personas distintas con atención efectiva en el año. No es el total de atenciones.'
  ]);
  AgregarFila(indicadores, [
    'Total de atenciones',
    corte.totalAtenciones,
    'Eventos individuales más actividades grupales. Una grupal no se multiplica por asistentes.'
  ]);
  AgregarFila(indicadores, [
    'Cobertura N',
    corte.cobertura.numerador,
    'Personas del denominador con atención efectiva en su caso activo actual.'
  ]);
  AgregarFila(indicadores, [
    'Cobertura D',
    corte.cobertura.denominador,
    'Personas únicas con caso activo actualmente. El estado general no cambia esta cifra.'
  ]);
  for (const visualizacion of corte.visualizaciones) {
    const nombre = `${String(visualizacion.numero).padStart(2, '0')} ${visualizacion.codigo}`
      .replace(/[\\/*?:[\]]/g, ' ')
      .slice(0, 31);
    const hoja = libro.addWorksheet(nombre);
    AgregarFila(hoja, ['Título', visualizacion.titulo]);
    AgregarFila(hoja, ['Fecha aplicada', visualizacion.fechaAplicada]);
    AgregarFila(hoja, ['Estado', visualizacion.estado]);
    AgregarFila(hoja, ['Mensaje', visualizacion.mensaje || '']);
    AgregarFila(hoja, ['Nota', visualizacion.nota || '']);
    const esKpi = visualizacion.formato === 'KPI_PORCENTAJE'
      || visualizacion.formato === 'KPI_CANTIDAD';
    if (esKpi) {
      AgregarFila(hoja, ['Numerador', visualizacion.numerador]);
      AgregarFila(hoja, ['Denominador', visualizacion.denominador]);
      const porcentaje = visualizacion.porcentaje === null ? '' : visualizacion.porcentaje;
      AgregarFila(hoja, ['Porcentaje', porcentaje]);
      continue;
    }
    AgregarFila(hoja, []);
    AgregarFila(hoja, ['Etiqueta', 'Cantidad']);
    const filas = visualizacion.frecuenciaCompleta || visualizacion.serie || [];
    if (filas.length === 0) {
      AgregarFila(hoja, ['Sin información', '']);
      continue;
    }
    for (const fila of filas) {
      AgregarFila(hoja, [fila.etiqueta, fila.cantidad]);
    }
  }
  const seguimiento = libro.addWorksheet('Casos sin atencion');
  AgregarFila(seguimiento, ['Caso', 'Establecimiento', 'Última atención', 'Situación']);
  Encabezado(seguimiento);
  for (const fila of corte.casosSinAtencion.filas) {
    AgregarFila(seguimiento, [
      fila.casoId,
      fila.establecimiento,
      fila.ultimaAtencion || '',
      fila.situacion
    ]);
  }
  const crudo = await libro.xlsx.writeBuffer();
  return Buffer.from(crudo);
}

module.exports = {
  TextoCelda,
  AfirmarExportacionCompleta,
  CrearLibroConsolidacion
};
