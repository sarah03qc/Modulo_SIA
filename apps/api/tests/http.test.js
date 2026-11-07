'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { errorHandler } = require('../src/common/http-error-handler');
const { loadConfig } = require('../src/config/load-config');
const { validEnv } = require('./env-fixture');

function createTestApp(overrides = {}) {
  const config = loadConfig(validEnv());
  const databases = overrides.databases || {
    sia: {
      probe: jest.fn(async () => ({ database: 'SIA_CENCINAI', readOnly: false, role: 'sia' }))
    }
  };
  const adapter = overrides.adapter || {
    checkAvailability: jest.fn(async () => ({
      available: true,
      database: 'SIDINACC_LOCAL',
      readOnly: true
    }))
  };
  const logger = {
    error: jest.fn(),
    warn: jest.fn(),
    info: jest.fn()
  };
  const app = createApp({ config, databases, adapter, logger });
  return { app, databases, adapter, logger };
}

describe('API técnica', () => {
  test('GET /health responde sin secretos ni cabecera de tecnología', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://127.0.0.1:5174');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      status: 'ok',
      service: 'sia-cencinai-api',
      environment: 'test'
    });
    expect(response.headers['x-powered-by']).toBeUndefined();
    expect(response.headers['access-control-allow-origin']).toBe('http://127.0.0.1:5174');
    expect(JSON.stringify(response.body)).not.toMatch(/password|secret|connection/i);
  });

  test('rechaza un origen CORS no configurado', async () => {
    const { app } = createTestApp();
    const response = await request(app)
      .get('/health')
      .set('Origin', 'http://evil.example');
    expect(response.headers['access-control-allow-origin']).toBeUndefined();
  });

  test('GET /ready distingue dependencias disponibles y caídas sin filtrar el error', async () => {
    const readyApp = createTestApp();
    const ready = await request(readyApp.app).get('/ready');
    expect(ready.status).toBe(200);
    expect(ready.body.status).toBe('ready');
    expect(ready.body.checks.sia).toEqual({ status: 'up', database: 'SIA_CENCINAI' });
    expect(ready.body.checks.sidinacc.readOnly).toBe(true);

    const down = createTestApp({
      databases: {
        sia: {
          probe: jest.fn(async () => {
            const error = new Error('password=hunter2');
            error.code = 'ELOGIN';
            throw error;
          })
        }
      },
      adapter: {
        checkAvailability: jest.fn(async () => {
          throw new Error('Server=secret;User ID=sa');
        })
      }
    });
    const response = await request(down.app).get('/ready');
    expect(response.status).toBe(503);
    expect(response.body.status).toBe('unavailable');
    expect(response.body.checks.sia.status).toBe('down');
    expect(response.body.checks.sidinacc.status).toBe('down');
    expect(JSON.stringify(response.body)).not.toMatch(/hunter2|secret|User ID/i);
  });

  test('protege las rutas funcionales hasta integrar la sesión institucional', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/api/references');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');
  });

  test('responde 404 controlado', async () => {
    const { app } = createTestApp();
    const response = await request(app).get('/recurso-desconocido');
    expect(response.status).toBe(404);
    expect(response.body.error.code).toBe('NOT_FOUND');
  });
});

describe('errorHandler', () => {
  test('oculta fallos internos y conserva los errores previstos', () => {
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    const handler = errorHandler(logger);
    const res = {
      headersSent: false,
      statusCode: 0,
      body: null,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(body) {
        this.body = body;
        return this;
      }
    };

    handler(new Error('password=sia-secret-value'), { path: '/health' }, res, jest.fn());
    expect(res.statusCode).toBe(500);
    expect(res.body.error.message).toBe('Ocurrió un error interno.');
    expect(JSON.stringify(res.body)).not.toContain('sia-secret-value');
    expect(logger.error).toHaveBeenCalled();
    expect(JSON.stringify(logger.error.mock.calls)).not.toContain('sia-secret-value');
  });

  test('no registra el identificador de la persona en la ruta', () => {
    const logger = { error: jest.fn(), info: jest.fn(), warn: jest.fn() };
    const handler = errorHandler(logger);
    const res = {
      headersSent: false,
      status(code) {
        this.statusCode = code;
        return this;
      },
      json() {
        return this;
      }
    };
    const { NotFoundError } = require('../src/common/errors');
    handler(new NotFoundError(), { path: '/api/institutional/persons/SYN-1100102-01' }, res, jest.fn());
    expect(JSON.stringify(logger.info.mock.calls)).not.toContain('SYN-1100102-01');
    expect(JSON.stringify(logger.info.mock.calls)).toContain('/persons/:personId');
  });
});
