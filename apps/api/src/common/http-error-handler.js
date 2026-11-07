'use strict';

const { NotFoundError } = require('./errors');

function logPath(path) {
  if (typeof path !== 'string') {
    return path;
  }
  return path.replace(/\/persons\/[^/]+/g, '/persons/:personId');
}

function notFoundHandler(req, res, next) {
  next(new NotFoundError());
}

function errorHandler(logger) {
  return function handleError(err, req, res, next) {
    if (res.headersSent) {
      next(err);
      return;
    }

    if (err instanceof SyntaxError && err.status === 400) {
      logger.info('Solicitud rechazada', { code: 'VALIDATION_ERROR', status: 400, path: logPath(req.path) });
      res.status(400).json({
        error: {
          code: 'VALIDATION_ERROR',
          message: 'El cuerpo de la solicitud no es JSON válido.'
        }
      });
      return;
    }

    const exposed = Boolean(err && err.expose === true && err.status && err.code);
    const status = exposed ? err.status : 500;
    const code = exposed ? err.code : 'INTERNAL_ERROR';
    const message = exposed ? err.message : 'Ocurrió un error interno.';
    const log = status >= 500 ? logger.error.bind(logger) : logger.info.bind(logger);
    log('Solicitud fallida', { code, status, path: logPath(req.path) });
    res.status(status).json({ error: { code, message } });
  };
}

module.exports = { notFoundHandler, errorHandler };
