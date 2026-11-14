'use strict';

const { CrearContextoUsuario } = require('./user-context');

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
function AdaptarIdentidadInstitucional(identidad) {
  if (!identidad || identidad.source !== 'SYNTHETIC_DEVELOPMENT') {
    return CrearContextoUsuario({
      principalId: null,
      source: 'UNCONFIRMED',
      grants: []
    });
  }
  return CrearContextoUsuario({
    principalId: identidad.principalId,
    source: identidad.source,
    grants: identidad.grants
  });
}

module.exports = {
  AdaptarIdentidadInstitucional
};
