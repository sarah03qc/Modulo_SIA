'use strict';

/**
 * Envuelve una ruta asíncrona para que un rechazo llegue al manejador de errores
 * y no quede como una promesa sin atender.
 */
function asyncHandler(fn) {
  return function wrapped(req, res, next) {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = { asyncHandler };
