'use strict';

class HttpError extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

class ValidationError extends HttpError {
  constructor(message = 'La solicitud no es válida.') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

class UnauthorizedError extends HttpError {
  constructor(message = 'Se requiere una sesión institucional.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

class AuthenticationNotConfiguredError extends HttpError {
  constructor() {
    super(
      401,
      'AUTHENTICATION_NOT_CONFIGURED',
      'La sesión institucional de SIDINACC todavía no está integrada.'
    );
  }
}

class ForbiddenError extends HttpError {
  constructor(message = 'La operación no está permitida.') {
    super(403, 'FORBIDDEN', message);
  }
}

class NotFoundError extends HttpError {
  constructor(message = 'El recurso solicitado no existe.') {
    super(404, 'NOT_FOUND', message);
  }
}

class ConflictError extends HttpError {
  constructor(message = 'La operación entra en conflicto con el estado actual.') {
    super(409, 'CONFLICT', message);
  }
}

class AmbiguousInstitutionalLocationError extends HttpError {
  constructor() {
    super(
      409,
      'INSTITUTIONAL_LOCATION_AMBIGUOUS',
      'La ubicación institucional del período configurado tiene más de un registro en el ámbito y no se resuelve de forma automática.'
    );
  }
}

class InfrastructureError extends HttpError {
  constructor(message = 'Una dependencia necesaria no está disponible.') {
    super(503, 'INFRASTRUCTURE_UNAVAILABLE', message);
  }
}

module.exports = {
  HttpError,
  ValidationError,
  UnauthorizedError,
  AuthenticationNotConfiguredError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  AmbiguousInstitutionalLocationError,
  InfrastructureError
};
