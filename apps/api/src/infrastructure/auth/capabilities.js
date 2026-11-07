'use strict';

const { ACCESS_LEVEL } = require('./institutional-roles');

/*
  Catálogo interno de capacidades por operación.
  Los códigos no repiten nombres de SIDINACC.
  Conceder una capacidad no abre una ruta: la ruta y el servicio deben exigirla.
  Una capacidad sin rol asignado queda denegada.
  Trazabilidad principal: RF-012, RF-104, RNF-001, RNF-002 y sección 5 de la especificación v0.7.

  Correspondencia de actores, sin perfiles externos:
  ACT-01 Profesional, ASC2 y ASC3 usan ESTABLECIMIENTO.
  ACT-02, ACT-03 y ACT-04 comparten OFICINA_LOCAL. Decisión 0003.
  ACT-05 usa REGION. ACT-06 usa NACIONAL.
  ACT-07 no tiene rol interno: catalog.manage permanece sin concesión.
  ACT-08 no tiene acceso. ACT-09 no es un rol de la operación de A.I.

  Referencias: se amplía el mismo catálogo. No hay códigos `references.*`
  ni un rol distinto para ACT-02, ACT-03 y ACT-04.
  referral.create cubre el envío y el borrador.
  referral.read cubre el listado. referral.read.detail cubre la ficha.
  referral.print y referral.import cubren el documento y la plantilla.
  Establecimiento las recibe. Oficina Local las hereda. Región y Nacional no.
*/

const CAPABILITY = Object.freeze({
  PERSON_SEARCH: 'person.search',
  PERSON_PROFILE_READ: 'person.profile.read',
  TERRITORY_OPTIONS_READ: 'territory.options.read',
  CASE_SUMMARY_READ: 'case.summary.read',
  REFERRAL_CREATE: 'referral.create',
  REFERRAL_READ: 'referral.read',
  REFERRAL_READ_DETAIL: 'referral.read.detail',
  REFERRAL_PRINT: 'referral.print',
  REFERRAL_IMPORT: 'referral.import',
  SESSION_MANAGE: 'session.manage',
  ASSESSMENT_READ: 'assessment.read',
  ASSESSMENT_WRITE: 'assessment.write',
  CASE_OPEN: 'case.open',
  CASE_READ: 'case.read',
  CASE_CLOSE: 'case.close',
  CASE_RISK_READ: 'case.risk.read',
  CASE_PROTECTION_READ: 'case.protection.read',
  CASE_CLOSURE_READ: 'case.closure.read',
  PLAN_READ: 'plan.read',
  ATTENTION_DETAIL_READ: 'attention.detail.read',
  ATTENTION_WRITE: 'attention.write',
  DOCUMENT_READ: 'document.read',
  COORDINATION_READ: 'coordination.read',
  TRANSFER_READ: 'transfer.read',
  SCHEDULING_READ: 'scheduling.read',
  SCHEDULING_MANAGE: 'scheduling.manage',
  REPORTING_READ: 'reporting.read',
  REPORTING_EXPORT: 'reporting.export',
  CATALOG_MANAGE: 'catalog.manage'
});

const KNOWN_CAPABILITIES = Object.freeze(new Set(Object.values(CAPABILITY)));

const BASIC_CONSULTATION = Object.freeze([
  CAPABILITY.PERSON_SEARCH,
  CAPABILITY.PERSON_PROFILE_READ,
  CAPABILITY.TERRITORY_OPTIONS_READ,
  CAPABILITY.CASE_SUMMARY_READ
]);

const ESTABLISHMENT_CAPABILITIES = Object.freeze([
  ...BASIC_CONSULTATION,
  CAPABILITY.REFERRAL_CREATE,
  CAPABILITY.REFERRAL_READ,
  CAPABILITY.REFERRAL_READ_DETAIL,
  CAPABILITY.REFERRAL_PRINT,
  CAPABILITY.REFERRAL_IMPORT
]);

const LOCAL_OFFICE_CAPABILITIES = Object.freeze([
  ...ESTABLISHMENT_CAPABILITIES,
  CAPABILITY.SESSION_MANAGE,
  CAPABILITY.ASSESSMENT_READ,
  CAPABILITY.ASSESSMENT_WRITE,
  CAPABILITY.CASE_OPEN,
  CAPABILITY.CASE_READ,
  CAPABILITY.CASE_CLOSE,
  CAPABILITY.CASE_RISK_READ,
  CAPABILITY.CASE_PROTECTION_READ,
  CAPABILITY.CASE_CLOSURE_READ,
  CAPABILITY.PLAN_READ,
  CAPABILITY.ATTENTION_DETAIL_READ,
  CAPABILITY.ATTENTION_WRITE,
  CAPABILITY.DOCUMENT_READ,
  CAPABILITY.COORDINATION_READ,
  CAPABILITY.TRANSFER_READ,
  CAPABILITY.SCHEDULING_READ,
  CAPABILITY.SCHEDULING_MANAGE,
  CAPABILITY.REPORTING_READ,
  CAPABILITY.REPORTING_EXPORT
]);

const UPPER_LEVEL_CONSULTATION = Object.freeze([
  ...BASIC_CONSULTATION,
  CAPABILITY.CASE_READ,
  CAPABILITY.SCHEDULING_READ,
  CAPABILITY.REPORTING_READ,
  CAPABILITY.REPORTING_EXPORT
]);

const ROLE_CAPABILITIES = Object.freeze({
  [ACCESS_LEVEL.ESTABLISHMENT]: ESTABLISHMENT_CAPABILITIES,
  [ACCESS_LEVEL.LOCAL_OFFICE]: LOCAL_OFFICE_CAPABILITIES,
  [ACCESS_LEVEL.REGION]: UPPER_LEVEL_CONSULTATION,
  [ACCESS_LEVEL.NATIONAL]: UPPER_LEVEL_CONSULTATION
});

/*
  Propósito: reconocer un código declarado en el catálogo
  Entrada: texto de capacidad
  Salida: true solo si el código es interno y conocido
*/
function isKnownCapability(capability) {
  return KNOWN_CAPABILITIES.has(capability);
}

/*
  Propósito: unir las capacidades de los roles internos recibidos
  Entrada: lista de roles ya normalizados
  Salida: capacidades conocidas, sin duplicados y en el orden del catálogo
  Un rol desconocido no aporta capacidades
*/
function capabilitiesForRoles(roles) {
  const granted = new Set();
  const source = Array.isArray(roles) ? roles : [];
  for (const role of source) {
    const capabilities = ROLE_CAPABILITIES[role] || [];
    for (const capability of capabilities) {
      granted.add(capability);
    }
  }
  return Object.values(CAPABILITY).filter((capability) => granted.has(capability));
}

module.exports = {
  CAPABILITY,
  ROLE_CAPABILITIES,
  isKnownCapability,
  capabilitiesForRoles
};
