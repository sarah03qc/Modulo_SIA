'use strict';

const { findDevelopmentPrincipal } = require('./development-access');

const BEARER = /^Bearer ([A-Za-z0-9._-]+)$/;

/*
  Proveedor de identidad sintética.
  Solo lo invoca el proveedor compuesto cuando el entorno es development o test.
  El identificador Bearer selecciona un registro del servidor.
  Esta función no lee encabezados de rol, capacidad, ámbito ni establecimiento.
*/

/*
  Propósito: resolver la credencial local contra el registro sintético
  Entrada: valor del encabezado Authorization, o vacío si no vino
  Salida: anonymous, invalid o authenticated con la identidad del servidor
*/
function resolveDevelopmentIdentity(authorizationHeader) {
  if (typeof authorizationHeader !== 'string' || authorizationHeader.trim() === '') {
    return Object.freeze({ status: 'anonymous' });
  }
  const match = BEARER.exec(authorizationHeader.trim());
  if (!match) {
    return Object.freeze({
      status: 'invalid',
      message: 'La credencial de acceso no es válida.'
    });
  }
  const identity = findDevelopmentPrincipal(match[1]);
  if (!identity) {
    return Object.freeze({
      status: 'invalid',
      message: 'La identidad de desarrollo no está autorizada.'
    });
  }
  return Object.freeze({
    status: 'authenticated',
    identity
  });
}

module.exports = {
  resolveDevelopmentIdentity
};
