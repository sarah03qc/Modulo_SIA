'use strict';

/*
  Contrato de integración futura con la sesión institucional de SIDINACC.
  Estado NEEDS_VALIDATION con UTIC.
  No define token, cookie, claim, identificador de usuario ni perfil institucional.
  No consulta SIDINACC y no convierte una credencial presentada en un contexto de SIA.
*/

const SIDINACC_SESSION_CONTRACT = Object.freeze({
  status: 'NEEDS_VALIDATION',
  owner: 'UTIC',
  acceptsCredentials: false,
  readsAuthorizationHeaders: false,
  assignsRoles: false,
  assignsEstablishments: false
});

/*
  Propósito: mantener cerrada la frontera productiva de identidad
  Entrada: ninguna. Una credencial externa no es argumento de esta función
  Salida: estado no configurado y el contrato pendiente, sin datos de usuario
*/
function resolveSidinaccSession() {
  return Object.freeze({
    status: 'unconfigured',
    contract: SIDINACC_SESSION_CONTRACT
  });
}

module.exports = {
  SIDINACC_SESSION_CONTRACT,
  resolveSidinaccSession
};
