'use strict';

const express = require('express');
const { asyncHandler } = require('../../common/async-handler');

function createTechnicalRouter(dependencies) {
  const router = express.Router();
  const logger = dependencies.logger;

  router.get('/health', (req, res) => {
    res.status(200).json({
      status: 'ok',
      service: 'sia-cencinai-api',
      environment: dependencies.config.nodeEnv
    });
  });

  router.get('/ready', asyncHandler(async (req, res) => {
    const checks = {
      sia: { status: 'down' },
      sidinacc: { status: 'down' }
    };
    let ready = true;

    try {
      const sia = await dependencies.databases.sia.probe();
      checks.sia = { status: 'up', database: sia.database };
    } catch (error) {
      ready = false;
      logger.warn('SIA no disponible', { driverCode: error.driverCode || error.code || 'UNKNOWN' });
    }

    try {
      const sidinacc = await dependencies.adapter.checkAvailability();
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

module.exports = { createTechnicalRouter };
