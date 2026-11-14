/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc).
 * Modificación del 2026-11-14: orden de autorización y lectura de cuerpos, y CORS.
 */
'use strict';

const express = require('express');
const { CrearRegistro } = require('./common/logger');
const { ResponderRutaNoEncontrada, CrearControlErrores } = require('./common/http-error-handler');
const { CrearSesionInstitucional } = require('./infrastructure/auth/institutional-session');
const { CrearEnrutadorTecnico } = require('./modules/technical/technical-routes');
const { CrearModuloInstitucional } = require('./modules/institutional/create-institutional-module');
const { CrearEnrutadorInstitucional } = require('./modules/institutional/institutional-routes');
const { CrearModuloReferencias } = require('./modules/references/create-reference-module');
const { CrearEnrutadorReferencias } = require('./modules/references/reference-routes');

/**
 * Aplica encabezados para que el navegador no interprete mal el contenido,
 * no incruste la API en un marco y no guarde la respuesta en caché.
 */
function AplicarEncabezadosSeguridad(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

/**
 * Habilita en el navegador el acceso entre orígenes para el origen configurado.
 * Las verificaciones previas se responden antes de iniciar una sesión.
 *
 * @param {string} origenPermitido Origen autorizado en la configuración.
 * @returns {Function} Middleware de Express para los encabezados CORS.
 */
function ConfigurarCors(origenPermitido) {
  return function AplicarCors(req, res, next) {
    const origen = req.headers.origin;
    res.vary('Origin');
    if (origen && origen === origenPermitido) {
      res.setHeader('Access-Control-Allow-Origin', origen);
      res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}

/**
 * Monta los módulos HTTP de la aplicación.
 *
 * Las rutas de salud quedan fuera de la sesión. A partir de /api se exige identidad.
 * La consulta institucional y las referencias comparten el adaptador de la réplica.
 * Cada módulo lee el cuerpo de una solicitud únicamente en las rutas que lo requieren.
 *
 * @param {object} dependencies Configuración y dependencias de los módulos.
 * @returns {express.Express} Aplicación HTTP sin iniciar el servidor.
 */
function CrearAplicacion(dependencies) {
  const logger = dependencies.logger || CrearRegistro(dependencies.config.logLevel);
  const app = express();
  app.disable('x-powered-by');
  const institutional = dependencies.institutional || CrearModuloInstitucional({
    periodId: dependencies.config.sidinaccPeriodId,
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia,
    cases: dependencies.cases
  });
  app.use(AplicarEncabezadosSeguridad);
  app.use(ConfigurarCors(dependencies.config.corsOrigin));
  app.use(CrearEnrutadorTecnico({ ...dependencies, logger }));
  // Salud y disponibilidad no exigen sesión. El resto de /api sí.
  app.use('/api', CrearSesionInstitucional(dependencies.config));
  const references = dependencies.references || CrearModuloReferencias({
    periodId: dependencies.config.sidinaccPeriodId,
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia
  });
  app.use('/api/institutional', CrearEnrutadorInstitucional(institutional));
  app.use('/api/references', CrearEnrutadorReferencias(references));
  app.use(ResponderRutaNoEncontrada);
  app.use(CrearControlErrores(logger));
  return app;
}

module.exports = { CrearAplicacion };
