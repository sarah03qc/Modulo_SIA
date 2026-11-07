'use strict';

const express = require('express');
const { createLogger } = require('./common/logger');
const { notFoundHandler, errorHandler } = require('./common/http-error-handler');
const { createInstitutionalSession } = require('./infrastructure/auth/institutional-session');
const { createTechnicalRouter } = require('./modules/technical/technical-routes');
const { createInstitutionalModule } = require('./modules/institutional/create-institutional-module');
const { createInstitutionalRouter } = require('./modules/institutional/institutional-routes');

function applySecurityHeaders(req, res, next) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Cache-Control', 'no-store');
  next();
}

function applyCors(corsOrigin) {
  return function cors(req, res, next) {
    const origin = req.headers.origin;
    if (origin && origin === corsOrigin) {
      res.setHeader('Access-Control-Allow-Origin', origin);
      res.setHeader('Vary', 'Origin');
      res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    }
    if (req.method === 'OPTIONS') {
      res.status(204).end();
      return;
    }
    next();
  };
}

function createApp(dependencies) {
  const logger = dependencies.logger || createLogger(dependencies.config.logLevel);
  const app = express();
  app.disable('x-powered-by');
  const institutional = dependencies.institutional || createInstitutionalModule({
    periodId: dependencies.config.sidinaccPeriodId,
    adapter: dependencies.adapter,
    sia: dependencies.databases && dependencies.databases.sia,
    cases: dependencies.cases
  });
  app.use(applySecurityHeaders);
  app.use(applyCors(dependencies.config.corsOrigin));
  app.use(express.json({ limit: '100kb' }));
  app.use(createTechnicalRouter({ ...dependencies, logger }));
  app.use('/api', createInstitutionalSession(dependencies.config));
  app.use('/api/institutional', createInstitutionalRouter(institutional));
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
