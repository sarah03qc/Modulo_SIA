'use strict';

const { STATUS_LABEL } = require('./reference-constants');

/**
 * Escapa texto antes de insertarlo en HTML.
 * La referencia puede contener datos digitados y no debe interpretarse como marcado.
 *
 * @param {unknown} value Texto o número a mostrar.
 * @returns {string} Texto seguro para HTML.
 */
function escapeHtml(value) {
  return String(value === null || value === undefined ? '' : value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * Presenta un dato ausente sin sustituirlo por un valor institucional inventado.
 *
 * @param {unknown} value Dato histórico o actual.
 * @returns {string} Texto visible.
 */
function show(value) {
  const text = value === null || value === undefined || value === '' ? 'No disponible' : String(value);
  return escapeHtml(text);
}

/**
 * Arma una fila de definición.
 *
 * @param {string} label Etiqueta visible.
 * @param {unknown} value Dato.
 * @returns {string} HTML de la fila.
 */
function row(label, value) {
  return `<tr><th scope="row">${escapeHtml(label)}</th><td>${show(value)}</td></tr>`;
}

/**
 * Genera la representación imprimible sin modificar la referencia.
 * No incluye logotipo ni encabezado oficial: el diseño documental sigue pendiente.
 *
 * Requisitos: HU-017 y RF-035.
 *
 * @param {object} detail Detalle autorizado, con contexto histórico.
 * @param {string} generatedAt Fecha y hora de generación, distinta del envío.
 * @returns {string} Documento HTML autónomo.
 */
function renderReferenceDocument(detail, generatedAt) {
  const context = detail.historicalContext;
  const motives = (detail.motives || []).map((motive) => (
    `<li><strong>${escapeHtml(motive.label)}</strong>`
    + (motive.specification ? `: ${escapeHtml(motive.specification)}` : '')
    + `</li>`
  )).join('');
  const status = STATUS_LABEL[detail.status] || detail.status;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Referencia ${escapeHtml(detail.consecutive)}</title>
  <style>
    body { font-family: Arial, sans-serif; color: #1a1a1a; margin: 24px; }
    h1 { font-size: 20px; margin-bottom: 0; }
    p.note { font-size: 12px; color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 12px 0 20px; }
    th, td { border: 1px solid #444; padding: 6px 8px; vertical-align: top; text-align: left; }
    th { width: 34%; background: #f3f3f3; }
    h2 { font-size: 16px; margin-bottom: 4px; }
  </style>
</head>
<body>
  <h1>Referencia de Atención Interdisciplinaria</h1>
  <p class="note">Representación funcional para respaldo. No aplica un diseño institucional aprobado ni un logotipo oficial.</p>
  <h2>Identificación documental</h2>
  <table>
    ${row('Consecutivo', detail.consecutive)}
    ${row('Fecha de referencia', detail.referenceDate)}
    ${row('Fecha y hora de envío', detail.sentAt)}
    ${row('Responsable del envío', detail.responsible)}
    ${row('Estado', status)}
    ${row('Fecha y hora de generación del documento', generatedAt)}
  </table>
  <h2>Persona</h2>
  <table>
    ${row('Identificación', detail.person.personId)}
    ${row('Nombre', detail.person.fullName)}
    ${row('Fecha de nacimiento', context.birthDate)}
    ${row('Edad al momento de la referencia', context.ageYears)}
    ${row('Sexo', detail.person.sex)}
    ${row('Modalidades o servicios', context.servicesText)}
  </table>
  <h2>Contexto territorial</h2>
  <table>
    ${row('Región', context.regionName)}
    ${row('Oficina Local', context.localOfficeName)}
    ${row('Establecimiento', context.establishmentName)}
    ${row('Persona encargada', context.guardianName)}
    ${row('Relación', context.guardianRelationship)}
    ${row('Contacto', context.contact)}
    ${row('Dirección', context.address)}
  </table>
  <h2>Referencia</h2>
  <table>
    ${row('Vía de Atención', detail.attentionRoute.label)}
    ${row('Origen', detail.origin.label)}
    ${row('Acciones previas', detail.previousActions)}
    ${row('Resultados previos', detail.previousResults)}
    ${row('Información complementaria', detail.complementaryInformation)}
  </table>
  <h2>Motivos y especificaciones</h2>
  <ul>${motives || '<li>No disponible</li>'}</ul>
</body>
</html>`;
}

module.exports = {
  renderReferenceDocument,
  escapeHtml
};
