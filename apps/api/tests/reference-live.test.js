'use strict';

const { execFileSync } = require('child_process');
const path = require('path');
const request = require('supertest');
const { createApp } = require('../src/app');
const { loadConfig } = require('../src/config/load-config');
const { createDatabaseGateway } = require('../src/infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('../src/infrastructure/integrations/sidinacc-adapter');
const { createReferenceRepository } = require('../src/modules/references/reference-repository');

const placeholder = !process.env.SIA_DB_PASSWORD
  || !process.env.SIDINACC_DB_PASSWORD
  || process.env.SIA_DB_PASSWORD === 'CHANGE_ME'
  || process.env.SIDINACC_DB_PASSWORD === 'CHANGE_ME'
  || !process.env.SIDINACC_PERIOD_ID;

const describeLive = placeholder ? describe.skip : describe;
const PROBE_CONSECUTIVE = 'DNCC-DRCS-OL101-1100102-REF-891-2026';
const PROBE_PERSON = 'SYN-1100102-05';

describeLive('referencias contra SQL Server local', () => {
  jest.setTimeout(90000);

  let app;
  let gateway;
  let config;
  const createdIds = [];

  beforeAll(() => {
    config = loadConfig(process.env);
    gateway = createDatabaseGateway(config);
    app = createApp({
      config,
      databases: gateway,
      adapter: createSidinaccAdapter(gateway.sidinacc),
      logger: { error: jest.fn(), warn: jest.fn(), info: jest.fn() }
    });
  });

  afterAll(async () => {
    const cleanupFile = path.resolve(
      __dirname,
      '../../../database/sia-cencinai/security/021_cleanup_reference_probe.sql'
    );
    try {
      execFileSync('docker', [
        'cp',
        cleanupFile,
        'sidinacc-local-sql:/tmp/021_cleanup_reference_probe.sql'
      ], { stdio: 'pipe' });
      execFileSync('docker', [
        'exec',
        'sidinacc-local-sql',
        'bash',
        '-lc',
        'SQLCMD=/opt/mssql-tools18/bin/sqlcmd; "$SQLCMD" -S localhost -U sa -P "$MSSQL_SA_PASSWORD" -C -b -I -d SIA_CENCINAI -i /tmp/021_cleanup_reference_probe.sql'
      ], { stdio: 'pipe' });
    } catch {
      throw new Error('No se pudo revertir la referencia de prueba. Ejecute security/021_cleanup_reference_probe.sql.');
    }
    if (gateway) {
      await gateway.close();
    }
  });

  function authed(method, path, principalId) {
    return request(app)[method](path).set('Authorization', `Bearer ${principalId}`);
  }

  test('lista, detalla y niega una referencia fuera del ámbito', async () => {
    const list = await authed('get', '/api/references', 'dev-establecimiento-unico')
      .query({ page: 1, pageSize: 5, status: 'PENDIENTE_REVISION' });
    expect(list.status).toBe(200);
    expect(list.body.result.total).toBeGreaterThan(0);
    expect(list.body.result.returned).toBe(list.body.result.items.length);
    const item = list.body.result.items[0];
    expect(item).toEqual(expect.objectContaining({
      consecutive: expect.any(String),
      responsible: expect.any(String),
      status: 'PENDIENTE_REVISION'
    }));
    expect(item.establishment.id).toBe(1100102);

    const narrow = await authed('get', '/api/references', 'dev-establecimiento-unico')
      .query({ page: 1, pageSize: 1, status: 'PENDIENTE_REVISION' });
    const next = await authed('get', '/api/references', 'dev-establecimiento-unico')
      .query({ page: 2, pageSize: 1, status: 'PENDIENTE_REVISION' });
    expect(narrow.body.result.total).toBe(next.body.result.total);
    expect(narrow.body.result.returned).toBe(1);
    expect(narrow.body.result.items[0].referenceId).not.toBe(next.body.result.items[0] && next.body.result.items[0].referenceId);

    const byConsecutive = await authed('get', '/api/references', 'dev-establecimiento-unico')
      .query({ consecutive: item.consecutive, page: 1, pageSize: 5 });
    expect(byConsecutive.status).toBe(200);
    expect(byConsecutive.body.result.total).toBeGreaterThan(0);
    expect(byConsecutive.body.result.items.every((row) => row.consecutive === item.consecutive)).toBe(true);

    const detail = await authed('get', `/api/references/${item.referenceId}`, 'dev-establecimiento-unico');
    expect(detail.status).toBe(200);
    expect(detail.body.consecutive).toBe(item.consecutive);
    expect(detail.body.historicalContext.establishmentId).toBe(1100102);
    expect(detail.body.sentAt).toBe(item.sentAt);
    expect(detail.body.referenceDate).toEqual(expect.any(String));
    expect(detail.body.origin.code).toEqual(expect.any(String));
    expect(detail.body.attentionRoute.code).toEqual(expect.any(String));
    expect(detail.body.responsible).toBe(item.responsible);
    expect(detail.body.sentBy).toEqual(expect.any(String));

    const byIdentification = await authed('get', '/api/references', 'dev-establecimiento-unico')
      .query({
        identification: detail.body.person.personId,
        origin: detail.body.origin.code,
        attentionRoute: detail.body.attentionRoute.code,
        page: 1,
        pageSize: 5
      });
    expect(byIdentification.status).toBe(200);
    expect(byIdentification.body.result.items.some((row) => row.referenceId === item.referenceId)).toBe(true);

    const foreign = await authed('get', `/api/references/${item.referenceId}`, 'dev-oficina-perez-zeledon');
    expect(foreign.status).toBe(404);
    expect(foreign.body.error.message).toBe('El recurso solicitado no existe.');

    const region = await authed('get', '/api/references', 'dev-region-central-sur');
    expect(region.status).toBe(403);
  });

  test('impide una referencia cuando la persona tiene un caso activo y permite una pendiente previa', async () => {
    const blocked = await authed('post', '/api/references', 'dev-establecimiento-unico').send({
      personId: 'SYN-1100102-01',
      referenceDate: '2026-11-06',
      attentionRouteCode: 'URGENCIA',
      originCode: 'OBSERVACION',
      consecutive: 'DNCC-DRCS-OL101-1100102-REF-890-2026',
      motives: [{ code: 'CONDICION_MALNUTRICION', specification: 'no debe guardarse' }],
      previousActions: 'no debe guardarse',
      previousResults: 'no debe guardarse',
      complementaryInformation: 'no debe guardarse',
      captureOrigin: 'MANUAL'
    });
    expect(blocked.status).toBe(409);
    expect(blocked.body.error.message).toBe(
      'No se puede registrar la referencia porque la persona tiene un caso de Atención Interdisciplinaria activo.'
    );
    expect(JSON.stringify(blocked.body)).not.toMatch(/casoId|prioridad|valoracion/i);

    const pending = await authed('post', '/api/references/validation', 'dev-establecimiento-unico').send({
      personId: 'SYN-1100102-04',
      referenceDate: '2026-11-06',
      attentionRouteCode: 'NO_INMEDIATA',
      originCode: 'OBSERVACION',
      consecutive: PROBE_CONSECUTIVE,
      motives: [{ code: 'EDIN_II_RIESGO_RETRASO_ROJO', specification: 'precarga' }],
      captureOrigin: 'MANUAL'
    });
    expect(pending.status).toBe(200);
    expect(pending.body.activeCaseBlocked).toBe(false);
    expect(pending.body.submitted).toBe(false);
  });

  test('confirma, reintenta el mismo consecutivo, imprime y no altera el envío', async () => {
    const payload = {
      personId: PROBE_PERSON,
      referenceDate: '2026-11-06',
      attentionRouteCode: 'URGENCIA',
      originCode: 'VIGILANCIA_TAMIZAJE',
      consecutive: PROBE_CONSECUTIVE,
      motives: [
        { code: 'CONDICION_MALNUTRICION', specification: 'especificacion de prueba' },
        { code: 'OTRA_CONDICION_SALUD', specification: 'otra especificacion' }
      ],
      previousActions: 'acciones de prueba',
      previousResults: 'resultados de prueba',
      complementaryInformation: 'complemento de prueba',
      captureOrigin: 'MANUAL'
    };
    const [first, second] = await Promise.all([
      authed('post', '/api/references', 'dev-establecimiento-unico').send(payload),
      authed('post', '/api/references', 'dev-oficina-hatillo').send(payload)
    ]);
    const statuses = [first.status, second.status].sort();
    expect(statuses).toEqual([201, 409]);
    const saved = first.status === 201 ? first.body : second.body;
    expect(saved.referenceId).toEqual(expect.any(Number));
    expect(saved.status).toBe('PENDIENTE_REVISION');
    expect(saved.responsible).toBe(first.status === 201
      ? 'dev-establecimiento-unico'
      : 'dev-oficina-hatillo');
    createdIds.push(saved.referenceId);

    const detail = await authed('get', `/api/references/${saved.referenceId}`, 'dev-oficina-hatillo');
    expect(detail.status).toBe(200);
    expect(detail.body.historicalContext.establishmentName).toEqual(expect.any(String));
    expect(detail.body.motives).toHaveLength(2);
    expect(detail.body.motives.map((motive) => motive.specification).sort()).toEqual([
      'especificacion de prueba',
      'otra especificacion'
    ]);
    expect(detail.body.referenceDate).toBe('2026-11-06');
    expect(detail.body.origin.code).toBe('VIGILANCIA_TAMIZAJE');
    expect(detail.body.attentionRoute.code).toBe('URGENCIA');
    expect(detail.body.previousActions).toBe('acciones de prueba');
    expect(detail.body.previousResults).toBe('resultados de prueba');
    expect(detail.body.complementaryInformation).toBe('complemento de prueba');
    expect(detail.body.sentBy).toBe(saved.responsible);
    const sentAt = detail.body.sentAt;

    await new Promise((resolve) => {
      setTimeout(resolve, 1100);
    });
    const document = await authed('get', `/api/references/${saved.referenceId}/document`, 'dev-establecimiento-unico');
    expect(document.status).toBe(200);
    expect(document.text).toContain(PROBE_CONSECUTIVE);
    expect(document.text).toContain(sentAt);
    expect(document.text).toContain('2026-11-06');
    expect(document.text).toContain(PROBE_PERSON);
    expect(document.text).toContain('acciones de prueba');
    expect(document.text).toContain('resultados de prueba');
    expect(document.text).toContain('complemento de prueba');
    expect(document.text).toContain('especificacion de prueba');
    expect(document.text).toContain('otra especificacion');
    expect(document.text).toContain('Fecha y hora de generación del documento');
    expect(document.headers['x-document-generated-at']).not.toBe(sentAt);

    const after = await authed('get', `/api/references/${saved.referenceId}`, 'dev-establecimiento-unico');
    expect(after.body.sentAt).toBe(sentAt);
    expect(after.body.previousActions).toBe('acciones de prueba');
    expect(after.body.status).toBe('PENDIENTE_REVISION');
  });

  test('recupera un borrador del autor y no lo expone a otra persona de la oficina', async () => {
    const saved = await authed('put', '/api/references/drafts', 'dev-establecimiento-unico').send({
      personId: PROBE_PERSON,
      content: {
        referenceDate: '2026-11-06',
        responsible: 'intruso',
        estado: 'PENDIENTE_REVISION'
      }
    });
    expect(saved.status).toBe(200);
    expect(saved.body.submitted).toBe(false);
    expect(saved.body.status).toBeNull();
    expect(saved.body.sentAt).toBeNull();
    expect(saved.body.content.responsible).toBeUndefined();
    expect(saved.body.content.estado).toBeUndefined();

    const own = await authed('get', '/api/references/drafts', 'dev-establecimiento-unico');
    expect(own.status).toBe(200);
    expect(own.body.items.some((item) => item.draftId === saved.body.draftId)).toBe(true);

    const other = await authed('delete', `/api/references/drafts/${saved.body.draftId}`, 'dev-oficina-hatillo');
    expect(other.status).toBe(404);

    const removed = await authed('delete', `/api/references/drafts/${saved.body.draftId}`, 'dev-establecimiento-unico');
    expect(removed.status).toBe(204);
  });

  test('un motivo inválido revierte la referencia ya insertada en la misma transacción', async () => {
    const repository = createReferenceRepository(gateway.sia);
    const catalog = await repository.listCatalog();
    const route = catalog.find((row) => row.codigo_catalogo === 'VIA_ATENCION' && row.codigo === 'URGENCIA');
    const origin = catalog.find((row) => row.codigo_catalogo === 'ORIGEN_REFERENCIA' && row.codigo === 'OBSERVACION');
    const consecutive = 'DNCC-DRCS-OL101-1100102-REF-892-2026';
    let failure = null;
    try {
      await repository.insertSubmitted({
        personId: PROBE_PERSON,
        referenceDate: '2026-11-06',
        attentionRoute: { itemId: Number(route.cat_item_id) },
        origin: { itemId: Number(origin.cat_item_id) },
        responsible: 'dev-establecimiento-unico',
        previousActions: 'no debe quedar',
        previousResults: 'no debe quedar',
        complementaryInformation: 'no debe quedar',
        captureOrigin: 'MANUAL',
        templateVersion: null,
        consecutive,
        draftId: null,
        auditRole: 'ESTABLECIMIENTO',
        scopeText: 'E:1100102|OL:101|R:1|ID:SINTETICA',
        context: {
          establishmentId: 1100102,
          localOfficeId: 101,
          regionId: 1,
          guardianName: null,
          guardianRelationship: null,
          contact: null,
          address: null,
          servicesText: null,
          regionName: 'Central Sur',
          localOfficeName: 'Hatillo',
          establishmentName: 'Establecimiento de prueba',
          ageYears: 6,
          birthDate: '2020-01-15'
        },
        motives: [{ itemId: 999999999, specification: 'no debe quedar' }]
      });
    } catch (error) {
      failure = error;
    }
    expect(failure && failure.code).toBe('CONSTRAINT');
    const rows = await gateway.sia.query(`
      SELECT
        (SELECT COUNT(*) FROM dbo.ref_referencia WHERE consecutivo = @consecutive) AS references_left,
        (SELECT COUNT(*)
         FROM dbo.ref_contexto AS context
         INNER JOIN dbo.ref_referencia AS reference
           ON reference.referencia_id = context.referencia_id
         WHERE reference.consecutivo = @consecutive) AS contexts_left
    `, { consecutive });
    expect(Number(rows[0].references_left)).toBe(0);
    expect(Number(rows[0].contexts_left)).toBe(0);
  });
});
