/*
 * Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
 * Primer registro del archivo en Git: 2026-11-06 (5fabddc).
 * Modificación del 2026-11-14: proceso interdisciplinario, autorización y CORS.
 * Modificación del 2026-11-16: registro de atenciones, ciclo, programación y reportería.
 * Modificación del 2026-11-18: posibles referencias.
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
const { CrearModuloProceso } = require('./modules/proceso-interdisciplinario/crear-modulo-proceso');
const { CrearEnrutadorProceso } = require('./modules/proceso-interdisciplinario/rutas-proceso');
const { CrearModuloAtenciones } = require('./modules/atenciones/crear-modulo-atenciones');
const { CrearEnrutadorAtenciones } = require('./modules/atenciones/rutas-atenciones');
const { CrearModuloCiclo } = require('./modules/ciclo-caso/crear-modulo-ciclo');
const { CrearEnrutadorCiclo } = require('./modules/ciclo-caso/rutas-ciclo');
const { CrearModuloProgramacion } = require('./modules/programacion/crear-modulo-programacion');
const { CrearEnrutadorProgramacion } = require('./modules/programacion/rutas-programacion');
const { CrearModuloReporteria } = require('./modules/reporteria/crear-modulo-reporteria');
const { CrearEnrutadorReporteria } = require('./modules/reporteria/rutas-reporteria');
const { CrearModuloPosibles } = require('./modules/posibles-referencias/crear-modulo-posibles');
const { CrearEnrutadorPosibles } = require('./modules/posibles-referencias/rutas-posibles');

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
      res.setHeader(
        'Access-Control-Expose-Headers',
        'Content-Disposition, X-Persistencia-Informe, X-Informe-Id'
      );
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
  const proceso = dependencies.proceso || CrearModuloProceso({
    periodId: dependencies.config.sidinaccPeriodId,
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia
  });
  const atenciones = dependencies.atenciones || CrearModuloAtenciones({
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia
  });
  const ciclo = dependencies.ciclo || CrearModuloCiclo({
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia,
    proceso
  });
  app.use('/api/institutional', CrearEnrutadorInstitucional(institutional));
  app.use('/api/references', CrearEnrutadorReferencias(references));
  app.use('/api/proceso', CrearEnrutadorProceso(proceso));
  app.use('/api/atenciones', CrearEnrutadorAtenciones(atenciones));
  app.use('/api/ciclo', CrearEnrutadorCiclo(ciclo));
  const programacion = dependencies.programacion || CrearModuloProgramacion({
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia
  });
  app.use('/api/programacion', CrearEnrutadorProgramacion(programacion));
  const reporteria = dependencies.reporteria || CrearModuloReporteria({
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia
  });
  app.use('/api/reporteria', CrearEnrutadorReporteria(reporteria));
  const posibles = dependencies.posibles || CrearModuloPosibles({
    periodId: dependencies.config.sidinaccPeriodId,
    adaptador: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia,
    logger
  });
  app.use('/api/posibles-referencias', CrearEnrutadorPosibles(posibles));
  app.use(ResponderRutaNoEncontrada);
  app.use(CrearControlErrores(logger));
  return app;
}

module.exports = { CrearAplicacion };
