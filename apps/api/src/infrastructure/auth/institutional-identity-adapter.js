'use strict';

const { createUserContext } = require('./user-context');

/*
  Adaptador de identidad institucional hacia el contexto interno de SIA.
  Hoy solo acepta el registro sintético controlado por el servidor.
  La traducción de un perfil SIDINACC a un rol interno sigue NEEDS_VALIDATION.
  No copia capacidades ni ámbitos que acompañen a la identidad.
*/

/*
  Propósito: convertir una identidad autenticada en contexto interno
  Entrada: identidad del proveedor, con source, principalId y grants
  Salida: contexto de usuario. Si la fuente no es la sintética, el contexto no concede nada
*/
function adaptInstitutionalIdentity(identity) {
  if (!identity || identity.source !== 'SYNTHETIC_DEVELOPMENT') {
    return createUserContext({
      principalId: null,
      source: 'UNCONFIRMED',
      grants: []
    });
  }
  return createUserContext({
    principalId: identity.principalId,
    source: identity.source,
    grants: identity.grants
  });
}

module.exports = {
  adaptInstitutionalIdentity
};
