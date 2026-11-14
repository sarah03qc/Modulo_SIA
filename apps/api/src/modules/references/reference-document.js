'use strict';

const { STATUS_LABEL } = require('./reference-constants');

/**
 * Escapa texto antes de insertarlo en HTML.
 * La referencia puede contener datos digitados y no debe interpretarse como marcado.
 *
 * @param {unknown} value Texto o número a mostrar.
 * @returns {string} Texto seguro para HTML.
 */
function EscaparHtml(value) {
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
function Mostrar(value) {
  const text = value === null || value === undefined || value === '' ? 'No disponible' : String(value);
  return EscaparHtml(text);
}

/**
 * Arma una fila de definición.
 *
 * @param {string} label Etiqueta visible.
 * @param {unknown} value Dato.
 * @returns {string} HTML de la fila.
 */
function FilaDefinicion(label, value) {
  return `<tr><th scope="row">${EscaparHtml(label)}</th><td>${Mostrar(value)}</td></tr>`;
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
function GenerarDocumentoReferencia(detail, generatedAt) {
  const context = detail.historicalContext;
  const motives = (detail.motives || []).map((motive) => (
    `<li><strong>${EscaparHtml(motive.label)}</strong>`
    + (motive.specification ? `: ${EscaparHtml(motive.specification)}` : '')
    + `</li>`
  )).join('');
  const status = STATUS_LABEL[detail.status] || detail.status;
  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <title>Referencia ${EscaparHtml(detail.consecutive)}</title>
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
    ${FilaDefinicion('Consecutivo', detail.consecutive)}
    ${FilaDefinicion('Fecha de referencia', detail.referenceDate)}
    ${FilaDefinicion('Fecha y hora de envío', detail.sentAt)}
    ${FilaDefinicion('Responsable del envío', detail.responsible)}
    ${FilaDefinicion('Estado', status)}
    ${FilaDefinicion('Fecha y hora de generación del documento', generatedAt)}
  </table>
  <h2>Persona</h2>
  <table>
    ${FilaDefinicion('Identificación', detail.person.personId)}
    ${FilaDefinicion('Nombre', detail.person.fullName)}
    ${FilaDefinicion('Fecha de nacimiento', context.birthDate)}
    ${FilaDefinicion('Edad al momento de la referencia', context.ageYears)}
    ${FilaDefinicion('Sexo', detail.person.sex)}
    ${FilaDefinicion('Modalidades o servicios', context.servicesText)}
  </table>
  <h2>Contexto territorial</h2>
  <table>
    ${FilaDefinicion('Región', context.regionName)}
    ${FilaDefinicion('Oficina Local', context.localOfficeName)}
    ${FilaDefinicion('Establecimiento', context.establishmentName)}
    ${FilaDefinicion('Persona encargada', context.guardianName)}
    ${FilaDefinicion('Relación', context.RelacionEncargado)}
    ${FilaDefinicion('Contacto', context.contact)}
    ${FilaDefinicion('Dirección', context.address)}
  </table>
  <h2>Referencia</h2>
  <table>
    ${FilaDefinicion('Vía de Atención', detail.attentionRoute.label)}
    ${FilaDefinicion('Origen', detail.origin.label)}
    ${FilaDefinicion('Acciones previas', detail.previousActions)}
    ${FilaDefinicion('Resultados previos', detail.previousResults)}
    ${FilaDefinicion('Información complementaria', detail.complementaryInformation)}
  </table>
  <h2>Motivos y especificaciones</h2>
  <ul>${motives || '<li>No disponible</li>'}</ul>
</body>
</html>`;
}

module.exports = {
  GenerarDocumentoReferencia,
  EscaparHtml
};
