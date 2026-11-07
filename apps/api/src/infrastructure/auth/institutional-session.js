'use strict';

const { AuthenticationNotConfiguredError, UnauthorizedError } = require('../../common/errors');
const { resolvePresentedIdentity } = require('./identity-provider');
const { adaptInstitutionalIdentity } = require('./institutional-identity-adapter');

/*
  Frontera HTTP de identidad.
  Fuera de development y test no interpreta la credencial: responde el contrato SIDINACC.
  En local, el proveedor sintético y el adaptador arman req.access.
  Los encabezados de rol, capacidad o establecimiento no se leen.
*/

/*
  Propósito: adjuntar el contexto interno a la solicitud, o rechazarla
  Entrada: configuración con nodeEnv
  Salida: middleware de Express
  Sin credencial local responde 401 AUTHENTICATION_NOT_CONFIGURED
  Con credencial desconocida o mal formada responde 401 UNAUTHORIZED
*/
function createInstitutionalSession(config) {
  return function institutionalSession(req, res, next) {
    const resolution = resolvePresentedIdentity({
      nodeEnv: config && config.nodeEnv,
      authorizationHeader: req.get('authorization')
    });
    if (resolution.status === 'unconfigured' || resolution.status === 'anonymous') {
      next(new AuthenticationNotConfiguredError());
      return;
    }
    if (resolution.status !== 'authenticated') {
      next(new UnauthorizedError(resolution.message || 'La credencial de acceso no es válida.'));
      return;
    }
    req.access = adaptInstitutionalIdentity(resolution.identity);
    next();
  };
}

module.exports = {
  createInstitutionalSession
};
