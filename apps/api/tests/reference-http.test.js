'use strict';

const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/load-config');
const { validEnv } = require('./env-fixture');

function createTestApp(service) {
  const config = loadConfig(validEnv());
  const logger = { error: jest.fn(), warn: jest.fn(), info: jest.fn() };
  const app = createApp({
    config,
    databases: { sia: { probe: jest.fn() } },
    adapter: { checkAvailability: jest.fn(async () => ({ available: true, readOnly: true })) },
    references: service,
    logger
  });
  return { app, logger };
}

function serviceDouble() {
  return {
    listCatalogs: jest.fn(async () => ({ attentionRoutes: [], origins: [], motives: [] })),
    downloadTemplate: jest.fn(async () => ({
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      fileName: 'referencia-plantilla.xlsx',
      body: Buffer.from('PK')
    })),
    preloadTemplate: jest.fn(async () => ({ submitted: false, consecutiveReserved: false })),
    validateReferral: jest.fn(async () => ({ valid: true, submitted: false })),
    submitReferral: jest.fn(async () => ({ referenceId: 1, submitted: true })),
    listReferences: jest.fn(async () => ({ result: { total: 0, returned: 0, items: [] } })),
    getReference: jest.fn(async () => ({ referenceId: 9 })),
    printReference: jest.fn(async () => ({
      contentType: 'text/html; charset=utf-8',
      fileName: 'referencia-9.html',
      generatedAt: '2026-11-06T19:00:00Z',
      sentAt: '2026-11-06T18:00:00Z',
      body: '<html lang="es"></html>'
    })),
    saveDraft: jest.fn(async () => ({ draftId: 3, submitted: false, status: null })),
    listDrafts: jest.fn(async () => ({ items: [] })),
    deleteDraft: jest.fn(async () => undefined)
  };
}

describe('HTTP de referencias', () => {
  test('exige sesión y no acepta un rol enviado por el cliente', async () => {
    const service = serviceDouble();
    const { app } = createTestApp(service);
    const anonymous = await request(app).get('/api/references');
    expect(anonymous.status).toBe(401);

    const forged = await request(app)
      .get('/api/references')
      .set('Authorization', 'Bearer dev-region-central-sur')
      .set('X-Role', 'ESTABLECIMIENTO')
      .set('X-Capability', 'referral.read');
    expect(forged.status).toBe(403);
    expect(service.listReferences).not.toHaveBeenCalled();
  });

  test('el establecimiento consulta, crea, precarga y descarga el documento', async () => {
    const service = serviceDouble();
    const { app } = createTestApp(service);
    const auth = { Authorization: 'Bearer dev-establecimiento-unico' };

    expect((await request(app).get('/api/references/catalogs').set(auth)).status).toBe(200);
    const template = await request(app).get('/api/references/template').set(auth);
    expect(template.status).toBe(200);
    expect(template.headers['content-type']).toContain('spreadsheetml.sheet');
    expect(service.downloadTemplate).toHaveBeenCalled();
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
    expect(service.submitReferral).toHaveBeenCalled();

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
    const service = serviceDouble();
    const { app } = createTestApp(service);
    const response = await request(app)
      .get('/api/references')
      .query({ establishmentId: '1190108' })
      .set('Authorization', 'Bearer dev-oficina-perez-zeledon');
    expect(response.status).toBe(200);
    expect(service.listReferences.mock.calls[0][1].establishmentId).toBe(1190108);
  });
});
