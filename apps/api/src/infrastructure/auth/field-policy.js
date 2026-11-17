'use strict';

const { CAPABILITY } = require('./capabilities');
const { TieneCapacidad } = require('./authorization-policy');

/*
  Proyección de campos según capacidad.
  Los campos restringidos salen de la sección 5.1: valoración, factores, riesgo,
  protección, plan, estrategias, atenciones, documentos, coordinaciones, traslados,
  frecuencia, línea de tiempo, cierre operativo, disciplinas internas y reportes internos.
  Regional y Nacional no los reciben por esta política.
  HU-033 y HU-035 usan una proyección propia de consulta, sin conceder estas
  capacidades ni reabrir la ficha de persona. El texto clínico sigue restringido.
  RNF-002.
*/

const RESTRICTED_FIELDS = Object.freeze({
  riskLevel: CAPABILITY.CASE_RISK_READ,
  protectionLevel: CAPABILITY.CASE_PROTECTION_READ,
  assessment: CAPABILITY.ASSESSMENT_READ,
  factors: CAPABILITY.ASSESSMENT_READ,
  plan: CAPABILITY.PLAN_READ,
  strategies: CAPABILITY.PLAN_READ,
  attentions: CAPABILITY.ATTENTION_DETAIL_READ,
  documents: CAPABILITY.DOCUMENT_READ,
  coordinations: CAPABILITY.COORDINATION_READ,
  transfers: CAPABILITY.TRANSFER_READ,
  closureDetail: CAPABILITY.CASE_CLOSURE_READ,
  frequency: CAPABILITY.ATTENTION_DETAIL_READ,
  timeline: CAPABILITY.ATTENTION_DETAIL_READ,
  internalDisciplines: CAPABILITY.SESSION_MANAGE,
  internalReports: CAPABILITY.CASE_CLOSURE_READ
});

/*
  Propósito: quitar de un registro los campos que el contexto no puede ver
  Entrada: registro plano y contexto de usuario
  Salida: copia sin esos campos. El registro original no se modifica
  Sin capacidad de resumen, el bloque de casos no conserva filas
*/
function AplicarPoliticaCampos(record, acceso) {
  if (!record || typeof record !== 'object' || Array.isArray(record)) {
    return record;
  }
  const copy = { ...record };
  for (const field of Object.keys(RESTRICTED_FIELDS)) {
    if (Object.prototype.hasOwnProperty.call(copy, field) && !TieneCapacidad(acceso, RESTRICTED_FIELDS[field])) {
      delete copy[field];
    }
  }
  if (copy.interdisciplinaryAttention && typeof copy.interdisciplinaryAttention === 'object') {
    const attention = { ...copy.interdisciplinaryAttention };
    if (!TieneCapacidad(acceso, CAPABILITY.CASE_SUMMARY_READ)) {
      attention.availability = 'BLOCKED';
      attention.reasonCode = 'PERMISSION_PENDING';
      attention.source = null;
      attention.visibleCaseCount = null;
      attention.items = null;
      attention.message = 'La consulta de casos autorizados no está permitida para este acceso.';
    } else if (Array.isArray(attention.items)) {
      attention.items = attention.items.map((item) => AplicarPoliticaCampos(item, acceso));
    }
    copy.interdisciplinaryAttention = attention;
  }
  return copy;
}

module.exports = {
  RESTRICTED_FIELDS,
  AplicarPoliticaCampos
};
