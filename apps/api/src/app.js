'use strict';

const express = require('express');
const { createLogger } = require('./common/logger');
const { notFoundHandler, errorHandler } = require('./common/http-error-handler');
const { requireInstitutionalSession } = require('./infrastructure/auth/institutional-session');
const { createTechnicalRouter } = require('./modules/technical/technical-routes');

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
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
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
  app.use(applySecurityHeaders);
  app.use(applyCors(dependencies.config.corsOrigin));
  app.use(express.json({ limit: '100kb' }));
  app.use(createTechnicalRouter({ ...dependencies, logger }));
  app.use('/api', requireInstitutionalSession);
  app.use(notFoundHandler);
  app.use(errorHandler(logger));
  return app;
}

module.exports = { createApp };
