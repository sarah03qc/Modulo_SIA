'use strict';

/*
  Roles funcionales internos de SIA.
  No son nombres de perfil ni de rol de SIDINACC.
  El ámbito territorial sigue usando estos mismos códigos.
  Actores de FUNCTIONAL_SPEC_v0.7, secciones 4 y 5.
  RF-012, RF-104, RNF-001 y RNF-002.
*/

const ACCESS_LEVEL = Object.freeze({
  ESTABLISHMENT: 'ESTABLECIMIENTO',
  LOCAL_OFFICE: 'OFICINA_LOCAL',
  REGION: 'REGION',
  NATIONAL: 'NACIONAL'
});

const INSTITUTIONAL_ROLES = Object.freeze(new Set(Object.values(ACCESS_LEVEL)));

/*
  Propósito: reconocer un rol interno ya normalizado
  Entrada: código de rol
  Salida: true cuando el código pertenece al catálogo interno
*/
function isInstitutionalRole(role) {
  return INSTITUTIONAL_ROLES.has(role);
}

module.exports = {
  ACCESS_LEVEL,
  INSTITUTIONAL_ROLES,
  isInstitutionalRole
};
