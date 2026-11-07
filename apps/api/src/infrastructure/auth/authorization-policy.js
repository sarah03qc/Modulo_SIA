'use strict';

const { ForbiddenError } = require('../../common/errors');
const { isKnownCapability } = require('./capabilities');

/*
  Políticas de autorización por capacidad.
  La denegación es el resultado inicial: sin contexto o sin capacidad no hay operación.
  El mensaje al cliente no revela el código interno ni el catálogo.
  RNF-001 y RNF-002.
*/

const DENIED = 'La operación no está permitida.';
const UNCONFIRMED_SCOPE = 'La combinación de concesiones no tiene una regla de consulta confirmada.';

/*
  Propósito: impedir que una unión de concesiones sin ancla confirmada autorice operaciones
  Entrada: contexto interno
  Salida: ninguna. Si hay varias concesiones y no quedaron en un solo ámbito, responde 403
  Varios establecimientos del mismo rol ya llegan unidos y no entran aquí
*/
function assertConfirmedScope(access) {
  const grantCount = access && Array.isArray(access.grants) ? access.grants.length : 0;
  if (grantCount > 1 && (!access || access.scopeConfirmed === false || !access.accessLevel)) {
    throw new ForbiddenError(UNCONFIRMED_SCOPE);
  }
}

/*
  Propósito: consultar si el contexto interno tiene una capacidad conocida
  Entrada: contexto de usuario y código de capacidad
  Salida: true solo cuando el código existe y fue concedido por un rol interno
*/
function hasCapability(access, capability) {
  if (access && access.scopeConfirmed === false) {
    return false;
  }
  return Boolean(
    isKnownCapability(capability)
    && access
    && Array.isArray(access.capabilities)
    && access.capabilities.includes(capability)
  );
}

/*
  Propósito: exigir una capacidad antes de ejecutar una operación
  Entrada: contexto de usuario y código de capacidad
  Salida: el mismo contexto cuando la capacidad está concedida
  Si falta, responde 403 sin indicar qué capacidad se pidió
*/
function requireCapability(access, capability) {
  assertConfirmedScope(access);
  if (!hasCapability(access, capability)) {
    throw new ForbiddenError(DENIED);
  }
  return access;
}

/*
  Propósito: aplicar la misma exigencia en una ruta Express
  Entrada: código de capacidad
  Salida: middleware que deja pasar solo un contexto ya concedido
*/
function createCapabilityGuard(capability) {
  return function guardCapability(req, res, next) {
    try {
      requireCapability(req.access, capability);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  hasCapability,
  requireCapability,
  createCapabilityGuard
};
