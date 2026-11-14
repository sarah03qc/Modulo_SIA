'use strict';

const request = require('supertest');
const { CrearAplicacion } = require('../src/app');
const { CargarConfiguracion } = require('../src/config/load-config');
const { EntornoValido } = require('./env-fixture');

function CrearAplicacionDePrueba(service) {
  const config = CargarConfiguracion(EntornoValido());
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = CrearAplicacion({
    config,
    databases: { sia: { Sondear: jest.fn() } },
    adapter: { ComprobarDisponibilidad: jest.fn(async () => ({ available: true, readOnly: true })) },
    references: service,
    logger
  });
  return { app, logger };
}

function DobleServicio() {
  return {
    ListarCatalogos: jest.fn(async () => ({ attentionRoutes: [], origins: [], motives: [] })),
    DescargarPlantilla: jest.fn(async () => ({
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: 'referencia-plantilla.xlsx',
      body: Buffer.from('PK')
    })),
    PrecargarPlantilla: jest.fn(async () => ({ submitted: false, consecutiveReserved: false })),
    ValidarReferencia: jest.fn(async () => ({ valid: true, submitted: false })),
    EnviarReferencia: jest.fn(async () => ({ referenceId: 1, submitted: true })),
    ListarReferencias: jest.fn(async () => ({ result: { total: 0, returned: 0, items: [] } })),
    ObtenerReferencia: jest.fn(async () => ({ referenceId: 9 })),
    ImprimirReferencia: jest.fn(async () => ({
      contentType: 'text/html; charset=utf-8',
      fileName: 'referencia-9.html',
      generatedAt: '2026-11-06T19:00:00Z',
      sentAt: '2026-11-06T18:00:00Z',
      body: '<html lang="es"></html>'
    })),
    GuardarBorrador: jest.fn(async () => ({ draftId: 3, submitted: false, status: null })),
    ListarBorradores: jest.fn(async () => ({ items: [] })),
    EliminarBorrador: jest.fn(async () => undefined)
  };
}

describe('HTTP de referencias', () => {
  test('comprueba sesión y capacidad antes de leer una plantilla', async () => {
    const servicio = DobleServicio();
    const { app } = CrearAplicacionDePrueba(servicio);
    const cargar = () => request(app)
      .post('/api/references/template')
      .set('Content-Type', 'application/octet-stream')
      .set('Content-Encoding', 'formato-no-admitido')
      .send(Buffer.from('PK'));

    expect((await cargar()).status).toBe(401);
    expect((await cargar().set('Authorization', 'Bearer dev-region-central-sur')).status)
      .toBe(403);
    expect(servicio.PrecargarPlantilla).not.toHaveBeenCalled();
  });

  test('exige sesión y no acepta un rol enviado por el cliente', async () => {
    const service = DobleServicio();
    const { app } = CrearAplicacionDePrueba(service);
    const anonymous = await request(app).get('/api/references');
    expect(anonymous.status).toBe(401);

    const forged = await request(app)
      .get('/api/references')
      .set('Authorization', 'Bearer dev-region-central-sur')
      .set('X-Role', 'ESTABLECIMIENTO')
      .set('X-Capability', 'referral.read');
    expect(forged.status).toBe(403);
    expect(service.ListarReferencias).not.toHaveBeenCalled();
  });

  test('el establecimiento consulta, crea, precarga y descarga el documento', async () => {
    const service = DobleServicio();
    const { app } = CrearAplicacionDePrueba(service);
    const auth = { Authorization: 'Bearer dev-establecimiento-unico' };

    expect((await request(app).get('/api/references/catalogs').set(auth)).status).toBe(200);
    const template = await request(app).get('/api/references/template').set(auth);
    expect(template.status).toBe(200);
    expect(template.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(service.DescargarPlantilla).toHaveBeenCalled();
    expect((await request(app).get('/api/references').set(auth)).status).toBe(200);
    expect((await request(app).get('/api/references/9').set(auth)).status).toBe(200);
    const created = await request(app).post('/api/references').set(auth).send({
      personId: 'SYN-1100102-09',
      referenceDate: '2026-11-06',
      attentionRouteCode: 'URGENCIA',
      originCode: 'OBSERVACION',
      consecutive: 'DNCC-DRCS-OL101-1100102-REF-015-2026',
      motives: [{ code: 'CONDICION_MALNUTRICION' }],
      captureOrigin: 'MANUAL'
    });
    expect(created.status).toBe(201);
    expect(service.EnviarReferencia).toHaveBeenCalled();

    const forgedBody = await request(app).post('/api/references').set(auth).send({
      personId: 'SYN-1100102-09',
      estado: 'ADMITIDA_AI',
      captureOrigin: 'MANUAL'
    });
    expect(forgedBody.status).toBe(400);

    const preload = await request(app)
      .post('/api/references/template')
      .set(auth)
      .set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
      .send(Buffer.from('PK'));
    expect(preload.status).toBe(200);
    expect(preload.body.submitted).toBe(false);

    const document = await request(app).get('/api/references/9/document').set(auth);
    expect(document.status).toBe(200);
    expect(document.headers['content-type']).toContain('text/html');
    expect(document.headers['x-document-generated-at']).toBe('2026-11-06T19:00:00Z');
  });

  test('la oficina local usa las mismas capacidades y otro establecimiento no se infiere', async () => {
    const service = DobleServicio();
    const { app } = CrearAplicacionDePrueba(service);
    const response = await request(app)
      .get('/api/references')
      .query({ establishmentId: '1190108' })
      .set('Authorization', 'Bearer dev-oficina-perez-zeledon');
    expect(response.status).toBe(200);
    expect(service.ListarReferencias.mock.calls[0][1].establishmentId).toBe(1190108);
  });

  test('un JSON inválido sin sesión responde 401 y no entra al servicio', async () => {
    const servicio = DobleServicio();
    const { app } = CrearAplicacionDePrueba(servicio);
    const anonimo = await request(app)
      .post('/api/references')
      .set('Content-Type', 'application/json')
      .send('{');
    expect(anonimo.status).toBe(401);
    expect(anonimo.body.error.code).toBe('AUTHENTICATION_NOT_CONFIGURED');
    expect(servicio.EnviarReferencia).not.toHaveBeenCalled();
  });

  test('un JSON inválido sin capacidad responde 403 y no entra al servicio', async () => {
    const servicio = DobleServicio();
    const { app } = CrearAplicacionDePrueba(servicio);
    const sinCapacidad = await request(app)
      .post('/api/references')
      .set('Content-Type', 'application/json')
      .set('Authorization', 'Bearer dev-region-central-sur')
      .send('{');
    expect(sinCapacidad.status).toBe(403);
    expect(servicio.EnviarReferencia).not.toHaveBeenCalled();
  });

  test('una plantilla enorme sin sesión responde 401 y no se precarga', async () => {
    const servicio = DobleServicio();
    const { app } = CrearAplicacionDePrueba(servicio);
    const enorme = Buffer.alloc(1024 * 1024 + 1, 0x61);
    const plantillaAnonima = await request(app)
      .post('/api/references/template')
      .set('Content-Type', 'application/octet-stream')
      .send(enorme);
    expect(plantillaAnonima.status).toBe(401);
    expect(servicio.PrecargarPlantilla).not.toHaveBeenCalled();
  });

  test('una plantilla enorme autorizada responde 413 y no se precarga', async () => {
    const servicio = DobleServicio();
    const { app } = CrearAplicacionDePrueba(servicio);
    const enorme = Buffer.alloc(1024 * 1024 + 1, 0x61);
    const plantillaGrande = await request(app)
      .post('/api/references/template')
      .set('Authorization', 'Bearer dev-establecimiento-unico')
      .set('Content-Type', 'application/octet-stream')
      .send(enorme);
    expect(plantillaGrande.status).toBe(413);
    expect(plantillaGrande.body.error.code).toBe('VALIDATION_ERROR');
    expect(servicio.PrecargarPlantilla).not.toHaveBeenCalled();
  });
});
