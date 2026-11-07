'use strict';

const { AuthenticationNotConfiguredError, UnauthorizedError } = require('../../common/errors');
const { findDevelopmentPrincipal } = require('./development-access');

const BEARER = /^Bearer ([A-Za-z0-9._-]+)$/;

function createInstitutionalSession(config) {
  return function institutionalSession(req, res, next) {
    const localIdentityAllowed = Boolean(
      config
      && (config.nodeEnv === 'development' || config.nodeEnv === 'test')
    );
    if (!localIdentityAllowed) {
      next(new AuthenticationNotConfiguredError());
      return;
    }

    const header = req.get('authorization');
    if (!header) {
      next(new AuthenticationNotConfiguredError());
      return;
    }

    const match = BEARER.exec(header.trim());
    if (!match) {
      next(new UnauthorizedError('La credencial de acceso no es válida.'));
      return;
    }

    const principal = findDevelopmentPrincipal(match[1]);
    if (!principal) {
      next(new UnauthorizedError('La identidad de desarrollo no está autorizada.'));
      return;
    }

    // X-Access-Level, X-Establishment-Id y parametros de rol no se leen.
    // La autorizacion sale solo de este registro controlado por el servidor.
    req.access = {
      principalId: principal.principalId,
      accessLevel: principal.accessLevel,
      regionId: principal.regionId,
      localOfficeId: principal.localOfficeId,
      establishmentIds: principal.establishmentIds
        ? principal.establishmentIds.slice()
        : null
    };
    next();
  };
}

module.exports = { createInstitutionalSession };
