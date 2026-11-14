'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { ErrorInfraestructura } = require('../src/common/errors');
const { EntornoValido } = require('./env-fixture');

function CrearAplicacionDePrueba(service) {
  const config = CargarConfiguracion(EntornoValido());
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: {
      ComprobarDisponibilidad: jest.fn(async () => ({
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
    const service = { BuscarPersonas: jest.fn(), ObtenerPersona: jest.fn(), ListarOpcionesTerritorio: jest.fn() };
    const { app } = CrearAplicacionDePrueba(service);
    const missing = await request(app).get('/api/institutional/persons/search');
    expect(missing.status).toBe(401);
    expect(missing.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');

    const forged = await request(app)
      .get('/api/institutional/persons/search')
      .set('X-Access-Level', 'NACIONAL')
      .set('X-Establishment-Id', '1190108');
    expect(forged.status).toBe(401);
    expect(service.BuscarPersonas).not.toHaveBeenCalled();
  });

  test('una credencial desconocida no selecciona un ámbito', async () => {
    const service = { BuscarPersonas: jest.fn(), ObtenerPersona: jest.fn(), ListarOpcionesTerritorio: jest.fn() };
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set('Authorization', 'Bearer dev-nacional-falso');
    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHORIZED');
    expect(service.BuscarPersonas).not.toHaveBeenCalled();
  });

  test('el ámbito llega del registro del servidor aunque la solicitud declare otro', async () => {
    const service = {
      BuscarPersonas: jest.fn(async (acceso) => ({
        scope: { accessLevel: acceso.accessLevel, principalId: acceso.principalId },
        result: { total: 0, returned: 0, items: [] }
      })),
      ObtenerPersona: jest.fn(),
      ListarOpcionesTerritorio: jest.fn()
    };
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/institutional/persons/search?q=Ana&accessLevel=NACIONAL&establishmentId=1190108')
      .set(bearer('dev-establecimiento-unico'))
      .set('X-Access-Level', 'NACIONAL');
    expect(response.status).toBe(200);
    expect(service.BuscarPersonas).toHaveBeenCalledWith(
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
      BuscarPersonas: jest.fn(async () => {
        const error = new ErrorInfraestructura('La dependencia de base de datos no está disponible.');
        error.driverCode = 'ELOGIN';
        throw error;
      }),
      ObtenerPersona: jest.fn(),
      ListarOpcionesTerritorio: jest.fn()
    };
    const { app, logger } = CrearAplicacionDePrueba(service);
    const solicitudInvalida = await request(app)
      .get('/api/institutional/persons/search')
      .set(bearer('dev-nacional'));
    expect(solicitudInvalida.status).toBe(400);
    expect(solicitudInvalida.body.error.code).toBe('VALIDATION_ERROR');

    const down = await request(app)
      .get('/api/institutional/persons/search?q=Ana')
      .set(bearer('dev-nacional'));
    expect(down.status).toBe(503);
    expect(down.body.error.code).toBe('INFRASTRUCTURE_UNAVAILABLE');
    expect(JSON.stringify(down.body)).not.toMatch(/ELOGIN|password|secret/i);
    expect(JSON.stringify(logger.error.mock.calls)).not.toMatch(/password|secret/i);
  });

  test('la preflight local admite Authorization', async () => {
    const { app } = CrearAplicacionDePrueba({
      BuscarPersonas: jest.fn(),
      ObtenerPersona: jest.fn(),
      ListarOpcionesTerritorio: jest.fn()
    });
    const response = await request(app)
      .options('/api/institutional/persons/search')
      .set('Origin', 'http://127.0.0.1:5174')
      .set('Access-Control-Request-Headers', 'authorization');
    expect(response.status).toBe(204);
    expect(response.headers['access-control-allow-headers']).toMatch(/Authorization/);
  });
});
