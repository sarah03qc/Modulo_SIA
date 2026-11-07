'use strict';

const { resolveDevelopmentIdentity } = require('./development-identity-provider');
const { resolveSidinaccSession } = require('./sidinacc-session-contract');

/*
  Proveedor de identidad.
  Elige la fuente según el entorno y no construye roles ni capacidades.
  development y test usan el registro sintético.
  Cualquier otro entorno cae en el contrato SIDINACC, que sigue sin mecanismo.
*/

/*
  Propósito: resolver quién presentó la credencial, sin autorizar operaciones
  Entrada: nodeEnv y el encabezado Authorization
  Salida: resultado del proveedor sintético o del contrato institucional
*/
function resolvePresentedIdentity(input) {
  const nodeEnv = input && input.nodeEnv;
  if (nodeEnv !== 'development' && nodeEnv !== 'test') {
    return resolveSidinaccSession();
  }
  return resolveDevelopmentIdentity(input && input.authorizationHeader);
}

module.exports = {
  resolvePresentedIdentity
};
