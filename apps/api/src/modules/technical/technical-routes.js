'use strict';

const express = require('express');
const { EnvolverAsincrono } = require('../../common/async-handler');

/**
 * Rutas de diagnóstico. No exigen sesión.
 *
 * /health indica que el proceso responde.
 * /ready comprueba SIA_CENCINAI y la réplica. En la réplica informa
 * si la cuenta se ve como solo lectura. Si una dependencia falla,
 * responde no disponible y no incluye el detalle del error.
 */
function CrearEnrutadorTecnico(dependencies) {
  const router = express.Router();
  const logger = dependencies.logger;

  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'sia-cencinai-api',
      environment: dependencies.config.nodeEnv
    });
  });

  router.get('/ready', EnvolverAsincrono(async (req, res) => {
    const checks = {
      sia: { status: 'down' },
      sidinacc: { status: 'down' }
    };
    let ready = true;

    try {
      const sia = await dependencies.databases.sia.Sondear();
      checks.sia = { status: 'up', database: sia.database };
    } catch (error) {
      ready = false;
      logger.warn('SIA no disponible', { driverCode: error.driverCode || error.code || 'UNKNOWN' });
    }

    try {
      const sidinacc = await dependencies.adapter.ComprobarDisponibilidad();
      checks.sidinacc = {
        status: sidinacc.available ? 'up' : 'down',
        database: sidinacc.database,
        readOnly: sidinacc.readOnly
      };
      if (!sidinacc.available) {
        ready = false;
      }
      logger.info('Comprobación de SIDINACC', {
        status: checks.sidinacc.status,
        readOnly: sidinacc.readOnly
      });
    } catch (error) {
      ready = false;
      logger.warn('SIDINACC no disponible', { driverCode: error.driverCode || error.code || 'UNKNOWN' });
    }

    res.status(ready ? 200 : 503).json({
      status: ready ? 'ready' : 'unavailable',
      checks
    });
  }));

  return router;
}

module.exports = { CrearEnrutadorTecnico };
