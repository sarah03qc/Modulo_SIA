'use strict';

/*
  Errores HTTP que la API sí puede mostrar al cliente.
  Cuando expose es verdadero, el manejador envía el mensaje.
  Los fallos de base se traducen a estos tipos antes de salir,
  para no revelar el texto del motor.
*/

class ErrorHttp extends Error {
  constructor(status, code, message) {
    super(message);
    this.name = new.target.name;
    this.status = status;
    this.code = code;
    this.expose = true;
  }
}

class ErrorValidacion extends ErrorHttp {
  constructor(message = 'La solicitud no es válida.') {
    super(400, 'VALIDATION_ERROR', message);
  }
}

class ErrorNoAutorizado extends ErrorHttp {
  constructor(message = 'Se requiere una sesión institucional.') {
    super(401, 'UNAUTHORIZED', message);
  }
}

/**
 * La sesión institucional todavía no está integrada.
 * No describe un token ni un perfil de SIDINACC.
 */
class ErrorAutenticacionNoConfigurada extends ErrorHttp {
  constructor() {
    super(
      401,
      'AUTHENTICATION_NOT_CONFIGURED',
      'La sesión institucional de SIDINACC todavía no está integrada.'
    );
  }
}

class ErrorProhibido extends ErrorHttp {
  constructor(message = 'La operación no está permitida.') {
    super(403, 'FORBIDDEN', message);
  }
}

class ErrorNoEncontrado extends ErrorHttp {
  constructor(message = 'El recurso solicitado no existe.') {
    super(404, 'NOT_FOUND', message);
  }
}

class ErrorConflicto extends ErrorHttp {
  constructor(message = 'La operación entra en conflicto con el estado actual.') {
    super(409, 'CONFLICT', message);
  }
}

/**
 * Hay más de una ubicación en el periodo y el ámbito.
 * No se elige una de forma automática.
 */
class ErrorUbicacionInstitucionalAmbigua extends ErrorHttp {
  constructor() {
    super(
      409,
      'INSTITUTIONAL_LOCATION_AMBIGUOUS',
      'La ubicación institucional del período configurado tiene más de un registro en el ámbito y no se resuelve de forma automática.'
    );
  }
}

class ErrorInfraestructura extends ErrorHttp {
  constructor(message = 'Una dependencia necesaria no está disponible.') {
    super(503, 'INFRASTRUCTURE_UNAVAILABLE', message);
  }
}

module.exports = {
  ErrorHttp,
  ErrorValidacion,
  ErrorNoAutorizado,
  ErrorAutenticacionNoConfigurada,
  ErrorProhibido,
  ErrorNoEncontrado,
  ErrorConflicto,
  ErrorUbicacionInstitucionalAmbigua,
  ErrorInfraestructura
};
