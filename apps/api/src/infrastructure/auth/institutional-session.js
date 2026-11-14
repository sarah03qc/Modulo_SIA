'use strict';

const { DescartarCuerpoNoProcesado } = require('../../common/http-error-handler');
const { ErrorAutenticacionNoConfigurada, ErrorNoAutorizado } = require('../../common/errors');
const { ResolverIdentidadPresentada } = require('./identity-provider');
const { AdaptarIdentidadInstitucional } = require('./institutional-identity-adapter');

/*
  Frontera HTTP de identidad.
  Fuera de development y test no interpreta la credencial: responde el contrato SIDINACC.
  En local, el proveedor sintético y el adaptador arman req.acceso.
  Los encabezados de rol, capacidad o establecimiento no se leen.
*/

/*
  Propósito: adjuntar el contexto interno a la solicitud, o rechazarla
  Entrada: configuración con nodeEnv
  Salida: middleware de Express
  Sin credencial local responde 401 AUTHENTICATION_NOT_CONFIGURED
  Con credencial desconocida o mal formada responde 401 UNAUTHORIZED
*/
function CrearSesionInstitucional(config) {
  return function SesionInstitucional(req, res, next) {
    const resolution = ResolverIdentidadPresentada({
      nodeEnv: config && config.nodeEnv,
      authorizationHeader: req.get('authorization')
    });
    if (resolution.status === 'unconfigured' || resolution.status === 'anonymous') {
      DescartarCuerpoNoProcesado(req, () => next(new ErrorAutenticacionNoConfigurada()));
      return;
    }
    if (resolution.status !== 'authenticated') {
      const mensaje = resolution.message || 'La credencial de acceso no es válida.';
      DescartarCuerpoNoProcesado(req, () => next(new ErrorNoAutorizado(mensaje)));
      return;
    }
    req.acceso = AdaptarIdentidadInstitucional(resolution.identidad);
    next();
  };
}

module.exports = {
  CrearSesionInstitucional
};
