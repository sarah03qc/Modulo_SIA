'use strict';

const { ForbiddenError } = require('../../common/errors');
const { isKnownCapability } = require('./capabilities');

/*
  Políticas de autorización por capacidad.
  La denegación es el resultado inicial: sin contexto o sin capacidad no hay operación.
  El mensaje al cliente no revela el código interno ni el catálogo.
  RNF-001 y RNF-002.
*/

const OPERACION_DENEGADA = 'La operación no está permitida.';
const AMBITO_NO_CONFIRMADO = 'La combinación de concesiones no tiene una regla de consulta confirmada.';

/*
  Propósito: impedir que una unión de concesiones sin ancla confirmada autorice operaciones
  Entrada: contexto interno
  Salida: ninguna. Si hay varias concesiones y no quedaron en un solo ámbito, responde 403
  Varios establecimientos del mismo rol ya llegan unidos y no entran aquí
*/
function ExigirAmbitoConfirmado(contexto) {
  const totalConcesiones = contexto && Array.isArray(contexto.grants) ? contexto.grants.length : 0;
  if (totalConcesiones > 1 && (contexto.scopeConfirmed === false || !contexto.accessLevel)) {
    throw new ForbiddenError(AMBITO_NO_CONFIRMADO);
  }
}

/*
  Propósito: consultar si el contexto interno tiene una capacidad conocida
  Entrada: contexto de usuario y código de capacidad
  Salida: true solo cuando el código existe y fue concedido por un rol interno
*/
function TieneCapacidad(contexto, capacidad) {
  if (contexto && contexto.scopeConfirmed === false) {
    return false;
  }
  return Boolean(
    isKnownCapability(capacidad)
    && contexto
    && Array.isArray(contexto.capabilities)
    && contexto.capabilities.includes(capacidad)
  );
}

/*
  Propósito: exigir una capacidad antes de ejecutar una operación
  Entrada: contexto de usuario y código de capacidad
  Salida: el mismo contexto cuando la capacidad está concedida
  Si falta, responde 403 sin indicar qué capacidad se pidió
*/
function ExigirCapacidad(contexto, capacidad) {
  ExigirAmbitoConfirmado(contexto);
  if (!TieneCapacidad(contexto, capacidad)) {
    throw new ForbiddenError(OPERACION_DENEGADA);
  }
  return contexto;
}

/*
  Propósito: aplicar la misma exigencia en una ruta Express
  Entrada: código de capacidad
  Salida: middleware que deja pasar solo un contexto ya concedido
*/
function CrearControlCapacidad(capacidad) {
  return function ComprobarCapacidad(req, res, next) {
    try {
      ExigirCapacidad(req.access, capacidad);
      next();
    } catch (error) {
      next(error);
    }
  };
}

module.exports = {
  TieneCapacidad,
  ExigirCapacidad,
  CrearControlCapacidad
};
