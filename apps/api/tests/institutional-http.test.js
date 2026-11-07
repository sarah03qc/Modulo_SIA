'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/load-config');
const { InfrastructureError } = require('../src/common/errors');
const { validEnv } = require('./env-fixture');

function createTestApp(service) {
  const config = loadConfig(validEnv());
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = createApp({
    config,
    databases: { sia: { probe: jest.fn() } },
    adapter: {
      checkAvailability: jest.fn(async () => ({
        available: true,
        database: 'SIDINACC_LOCAL',
        readOnly: true
      }))
    },
    institutional: service,
    logger
  });
  return { app, logger };
}

function bearer(principalId) {
  return { Authorization: `Bearer ${principalId}` };
}

describe('HTTP de consulta institucional', () => {
  test('sin credencial sigue en autenticación no configurada y un encabezado de rol no autentica', async () => {
    const service = { searchPersons: jest.fn(), getPerson: jest.fn(), listTerritoryOptions: jest.fn() };
    const { app } = createTestApp(service);
    const missing = await request(app).get('/api/institutional/persons/search');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');

    const forged = await request(app)
      .get('/api/institutional/persons/search')
      .set('X-Access-Level', 'NACIONAL')
      .set('X-Establishment-Id', '1190108');
    expect(forged.status).toBe(401);
    expect(service.searchPersons).not.toHaveBeenCalled();
  });

  test('una credencial desconocida no selecciona un ámbito', async () => {
    const service = { searchPersons: jest.fn(), getPerson: jest.fn(), listTerritoryOptions: jest.fn() };
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set('Authorization', 'Bearer dev-nacional-falso');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(service.searchPersons).not.toHaveBeenCalled();
  });

  test('el ámbito llega del registro del servidor aunque la solicitud declare otro', async () => {
    const service = {
      searchPersons: jest.fn(async (access) => ({
        scope: { accessLevel: access.accessLevel, principalId: access.principalId },
        result: { total: 0, returned: 0, items: [] }
      })),
      getPerson: jest.fn(),
      listTerritoryOptions: jest.fn()
    };
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana&accessLevel=NACIONAL&establishmentId=1190108')
      .set(bearer('dev-establecimiento-unico'))
      .set('X-Access-Level', 'NACIONAL');
    expect(response.status).toBe(200);
    expect(service.searchPersons).toHaveBeenCalledWith(
      expect.objectContaining({
        principalId: 'dev-establecimiento-unico',
        accessLevel: 'ESTABLECIMIENTO',
        establishmentIds: [1100102]
      }),
      expect.objectContaining({ establishmentId: 1190108 })
    );
    expect(response.body.scope.accessLevel).toBe('ESTABLECIMIENTO');
  });

  test('valida el criterio y traduce una caída de la réplica sin filtrar la causa', async () => {
    const service = {
      searchPersons: jest.fn(async () => {
        const error = new InfrastructureError('La dependencia de base de datos no está disponible.');
        error.driverCode = 'ELOGIN';
        throw error;
      }),
      getPerson: jest.fn(),
      listTerritoryOptions: jest.fn()
    };
    const { app, logger } = createTestApp(service);
    const invalid = await request(app)
      .get('/api/institutional/persons/search')
      .set(bearer('dev-nacional'));
    expect(invalid.status).toBe(400);
    expect(invalid.body.error.code).toBe('VALIDATION_ERROR');

    const down = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-nacional'));
    expect(down.status).toBe(503);
    expect(down.body.error.code).toBe('INFRASTRUCTURE_UNAVAILABLE');
    expect(JSON.stringify(down.body)).not.toMatch(/ELOGIN|password|secret/i);
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/password|secret/i);
  });

  test('la preflight local admite Authorization', async () => {
    const { app } = createTestApp({
      searchPersons: jest.fn(),
      getPerson: jest.fn(),
      listTerritoryOptions: jest.fn()
    });
    const response = await request(app)
      .options('/api/institutional/persons/search')
      .set('Origin', 'http://127.0.0.1:5174')
      .set('Access-Control-Request-Headers', 'authorization');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-headers']).toMatch(/Authorization/);
  });
});
