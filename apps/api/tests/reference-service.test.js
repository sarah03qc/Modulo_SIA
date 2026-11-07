'use strict';

const { createUserContext } = require('../src/infrastructure/auth/user-context');
const { findDevelopmentPrincipal } = require('../src/infrastructure/auth/development-access');
const { ConflictError, NotFoundError, ValidationError } = require('../src/common/errors');
const { createReferenceService } = require('../src/modules/references/reference-service');
const { createReferenceRepository } = require('../src/modules/references/reference-repository');
const { buildTemplateWorkbook, readTemplateWorkbook } = require('../src/modules/references/reference-template');
const { ACTIVE_CASE_MESSAGE } = require('../src/modules/references/reference-constants');

function access(principalId) {
  return createUserContext(findDevelopmentPrincipal(principalId));
}

function catalogRows() {
  return [
    ['VIA_ATENCION', 1, 'URGENCIA', 'Urgencia'],
    ['VIA_ATENCION', 2, 'NO_INMEDIATA', 'No inmediata'],
    ['ORIGEN_REFERENCIA', 3, 'VIGILANCIA_TAMIZAJE', 'Vigilancia / tamizaje'],
    ['ORIGEN_REFERENCIA', 4, 'OBSERVACION', 'Observación'],
    ['ORIGEN_REFERENCIA', 5, 'INFORMACION_FAMILIA_U_OTROS', 'Información aportada por la familia u otros'],
    ['ORIGEN_REFERENCIA', 6, 'REFERENCIA_EXTERNA', 'Referencia externa'],
    ['MOTIVO_REFERENCIA', 7, 'CONDICION_MALNUTRICION', 'Condición de malnutrición'],
    ['MOTIVO_REFERENCIA', 8, 'MALNUTRICION_NECESIDADES_ESPECIALES', 'Malnutrición con necesidades especiales'],
    ['MOTIVO_REFERENCIA', 9, 'EDIN_II_RIESGO_RETRASO_ROJO', 'EDIN II: riesgo de retraso (rojo)'],
    ['MOTIVO_REFERENCIA', 10, 'EVADE_RIESGO_REZAGO_0_1', 'EVADE: riesgo de rezago (0,1 sin logro de edad anterior)'],
    ['MOTIVO_REFERENCIA', 11, 'OTRA_CONDICION_SALUD', 'Otra condición de salud']
  ].map(([catalog, itemId, code, label], index) => ({
    cat_item_id: itemId,
    codigo_catalogo: catalog,
    codigo: code,
    etiqueta: label,
    orden: index + 1
  }));
}

function personRow(overrides = {}) {
  return {
    person_id: 'SYN-1100102-09',
    given_name: 'Ana',
    first_surname: 'Solis',
    second_surname: 'Rojas',
    birth_date: '2020-01-15',
    sex_name: 'Femenino',
    establishment_id: 1100102,
    establishment_name: 'Establecimiento de prueba',
    local_office_id: 101,
    local_office_name: 'Hatillo',
    region_id: 1,
    region_name: 'Central Sur',
    address_line: 'Dirección sintética',
    phone_one: '22220000',
    phone_two: null,
    location_count: 1,
    ...overrides
  };
}

function command(overrides = {}) {
  return {
    personId: 'SYN-1100102-09',
    referenceDate: '2026-11-06',
    attentionRouteCode: 'URGENCIA',
    originCode: 'OBSERVACION',
    consecutive: 'DNCC-DRCS-OL101-1100102-REF-015-2026',
    motives: [
      { code: 'CONDICION_MALNUTRICION', specification: 'detalle de crecimiento' },
      { code: 'OTRA_CONDICION_SALUD', specification: 'detalle de salud' }
    ],
    previousActions: 'acciones previas',
    previousResults: 'resultados previos',
    complementaryInformation: 'información complementaria',
    captureOrigin: 'MANUAL',
    templateVersion: null,
    draftId: null,
    responsibleProvided: false,
    responsible: null,
    ...overrides
  };
}

function createHarness(options = {}) {
  const state = {
    activeCase: options.activeCase || false,
    inserts: [],
    drafts: []
  };
  const repository = {
    listCatalog: jest.fn(async () => catalogRows()),
    personHasActiveCase: jest.fn(async () => state.activeCase),
    insertSubmitted: jest.fn(async (record) => {
      if (options.failTimes && state.inserts.length < options.failTimes) {
        state.inserts.push(record);
        const error = new Error('interbloqueo');
        error.code = options.failureCode || 'DEADLOCK';
        throw error;
      }
      if (options.duplicateOnInsert) {
        const error = new Error('duplicado');
        error.code = 'DUPLICATE_CONSECUTIVE';
        throw error;
      }
      state.inserts.push(record);
      return { referenceId: 77, sentAt: '2026-11-06 18:04:00' };
    }),
    listReferences: jest.fn(async () => options.page || { total: 0, items: [] }),
    findReference: jest.fn(async () => options.header || null),
    listMotives: jest.fn(async () => options.motives || []),
    recordPrint: jest.fn(async () => ({ generatedAt: '2026-11-06 19:10:00' })),
    saveDraft: jest.fn(async (draft) => {
      state.drafts.push(draft);
      return { draftId: draft.draftId || 4, updatedAt: '2026-11-06 18:00:00' };
    }),
    listDrafts: jest.fn(async () => []),
    deleteDraft: jest.fn(async () => true)
  };
  const people = new Map([[personRow().person_id, personRow()]]);
  const adapter = {
    findEstablishment: jest.fn(async (id) => (
      id === 1100102 ? { establishmentId: 1100102, localOfficeId: 101, regionId: 1 } : null
    )),
    findLocalOffice: jest.fn(async (id) => (
      id === 101 ? { localOfficeId: 101, regionId: 1, name: 'Hatillo' } : null
    )),
    findRegion: jest.fn(async () => ({ regionId: 1, name: 'Central Sur' })),
    findPersonInScope: jest.fn(async ({ personId }) => {
      const row = people.get(personId);
      return row ? [row] : [];
    }),
    listServices: jest.fn(async () => [{ service_name: 'Cuido diario' }]),
    listGuardianRows: jest.fn(async () => [{
      person_id: 'SYN-ENC-01',
      given_name: 'Luis',
      first_surname: 'Solis',
      second_surname: '',
      mother_id: 'SYN-ENC-01',
      father_id: null,
      guardian_id: 'SYN-ENC-01'
    }]),
    searchPersons: jest.fn(async () => ({ total: 1, items: [personRow()] }))
  };
  const service = createReferenceService({
    periodId: 2026,
    adapter,
    repository,
    clock: () => new Date(2026, 10, 6)
  });
  return { service, repository, adapter, state, people };
}

describe('servicio de referencias', () => {
  test('envía una referencia manual con contexto histórico y responsable de la sesión', async () => {
    const { service, repository, state } = createHarness();
    const result = await service.submitReferral(access('dev-establecimiento-unico'), command());
    expect(result.status).toBe('PENDIENTE_REVISION');
    expect(result.sentAt).toBe('2026-11-06T18:04:00Z');
    expect(result.responsible).toBe('dev-establecimiento-unico');
    expect(state.inserts).toHaveLength(1);
    const saved = state.inserts[0];
    expect(saved.responsible).toBe('dev-establecimiento-unico');
    expect(saved.context.establishmentId).toBe(1100102);
    expect(saved.context.ageYears).toBe(6);
    expect(saved.context.guardianRelationship).toBe('MADRE');
    expect(saved.context.servicesText).toBe('Cuido diario');
    expect(saved.referenceDate).toBe('2026-11-06');
    expect(saved.previousActions).toBe('acciones previas');
    expect(saved.previousResults).toBe('resultados previos');
    expect(saved.complementaryInformation).toBe('información complementaria');
    expect(saved.origin.code).toBe('OBSERVACION');
    expect(saved.motives.map((item) => item.code)).toEqual([
      'CONDICION_MALNUTRICION',
      'OTRA_CONDICION_SALUD'
    ]);
    expect(saved.motives.map((item) => item.specification)).toEqual([
      'detalle de crecimiento',
      'detalle de salud'
    ]);
    expect(saved.captureOrigin).toBe('MANUAL');
    expect(repository.insertSubmitted).toHaveBeenCalledTimes(1);
  });

  test('rechaza un responsable distinto y no inserta', async () => {
    const { service, repository } = createHarness();
    await expect(service.submitReferral(access('dev-establecimiento-unico'), command({
      responsibleProvided: true,
      responsible: 'otra-persona'
    }))).rejects.toThrow(/no puede sustituirse/);
    expect(repository.insertSubmitted).not.toHaveBeenCalled();
  });

  test('bloquea un caso activo sin revelar el expediente y permite casos no activos', async () => {
    const blocked = createHarness({ activeCase: true });
    await expect(blocked.service.submitReferral(access('dev-establecimiento-unico'), command()))
      .rejects.toThrow(new ConflictError(ACTIVE_CASE_MESSAGE));
    expect(blocked.repository.insertSubmitted).not.toHaveBeenCalled();
    expect(ACTIVE_CASE_MESSAGE).not.toMatch(/caso_id|prioridad|establecimiento/i);

    const closed = createHarness({ activeCase: false });
    await expect(closed.service.submitReferral(access('dev-establecimiento-unico'), command())).resolves.toMatchObject({
      submitted: true
    });
  });

  test('acepta los orígenes de familia y de referencia externa', async () => {
    for (const originCode of ['INFORMACION_FAMILIA_U_OTROS', 'REFERENCIA_EXTERNA']) {
      const harness = createHarness();
      await harness.service.submitReferral(access('dev-establecimiento-unico'), command({ originCode }));
      expect(harness.state.inserts[0].origin.code).toBe(originCode);
    }
  });

  test('una persona fuera del ámbito no se referencia', async () => {
    const { service, repository } = createHarness();
    await expect(service.submitReferral(access('dev-establecimiento-unico'), command({
      personId: 'SYN-1190108-01'
    }))).rejects.toBeInstanceOf(NotFoundError);
    expect(repository.insertSubmitted).not.toHaveBeenCalled();
  });

  test('reintenta un interbloqueo y no reintenta un consecutivo duplicado', async () => {
    const deadlock = createHarness({ failTimes: 1 });
    await expect(deadlock.service.submitReferral(access('dev-establecimiento-unico'), command())).resolves.toMatchObject({
      referenceId: 77
    });
    expect(deadlock.repository.insertSubmitted).toHaveBeenCalledTimes(2);

    const duplicate = createHarness({ duplicateOnInsert: true });
    await expect(duplicate.service.submitReferral(access('dev-establecimiento-unico'), command()))
      .rejects.toThrow(/ya está registrado/);
    expect(duplicate.repository.insertSubmitted).toHaveBeenCalledTimes(1);
  });

  test('un borrador de otra persona no se envía ni se reintenta', async () => {
    const harness = createHarness();
    const mismatch = new Error('borrador');
    mismatch.code = 'DRAFT_MISMATCH';
    harness.repository.insertSubmitted.mockRejectedValue(mismatch);
    await expect(harness.service.submitReferral(access('dev-establecimiento-unico'), command()))
      .rejects.toThrow(/no corresponde a la persona/);
    expect(harness.repository.insertSubmitted).toHaveBeenCalledTimes(1);
  });

  test('el envío solo elimina el borrador de la persona referida', async () => {
    let draftSql = '';
    const client = {
      query: async () => [],
      withTransaction: async (work) => work({
        query: async (sqlText) => {
          if (sqlText.includes('THROW 52112')) {
            draftSql = sqlText;
          }
          if (sqlText.includes('INSERT INTO dbo.ref_referencia')) {
            return [{ referencia_id: 1, enviada_en: '2026-11-06 18:00:00' }];
          }
          return [];
        }
      })
    };
    const repository = createReferenceRepository(client);
    await repository.insertSubmitted({
      personId: 'SYN-1100102-09',
      referenceDate: '2026-11-06',
      attentionRoute: { itemId: 1 },
      origin: { itemId: 4 },
      responsible: 'dev-establecimiento-unico',
      previousActions: null,
      previousResults: null,
      complementaryInformation: null,
      captureOrigin: 'MANUAL',
      templateVersion: null,
      consecutive: 'DNCC-DRCS-OL101-1100102-REF-015-2026',
      draftId: 8,
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
        regionName: null,
        localOfficeName: null,
        establishmentName: null,
        ageYears: 6,
        birthDate: '2020-01-15'
      },
      motives: [{ itemId: 7, specification: null }]
    });
    expect(draftSql).toContain('clave_negocio = @personId');
    expect(draftSql).toContain('THROW 52112');
    expect(draftSql).not.toContain('OR (@personId IS NOT NULL');
  });

  test('la validación no envía y un borrador no recibe estado ni comprobante', async () => {
    const { service, repository } = createHarness();
    const preview = await service.validateReferral(access('dev-establecimiento-unico'), command());
    expect(preview.submitted).toBe(false);
    expect(preview.consecutiveReserved).toBe(false);
    expect(preview.review.responsible.editable).toBe(false);
    expect(preview.review.responsible.principalId).toBe('dev-establecimiento-unico');
    expect(preview.review.person).toMatchObject({
      personId: 'SYN-1100102-09',
      fullName: 'Ana Solis Rojas',
      birthDate: '2020-01-15',
      ageYears: 6,
      sex: 'Femenino'
    });
    expect(preview.review.territory).toEqual({
      region: { id: 1, name: 'Central Sur' },
      localOffice: { id: 101, name: 'Hatillo' },
      establishment: { id: 1100102, name: 'Establecimiento de prueba' }
    });
    expect(preview.review.services).toBe('Cuido diario');
    expect(preview.review.referenceDate).toBe('2026-11-06');
    expect(preview.review.previousResults).toBe('resultados previos');
    expect(preview.review.complementaryInformation).toBe('información complementaria');
    expect(preview.stages.map((stage) => stage.code)).toEqual([
      'PERSON',
      'REFERENCE_DATA',
      'MOTIVES',
      'NARRATIVE',
      'CONSECUTIVE',
      'REVIEW'
    ]);
    expect(preview.stages.every((stage) => stage.complete)).toBe(true);
    expect(repository.insertSubmitted).not.toHaveBeenCalled();

    const draft = await service.saveDraft(access('dev-establecimiento-unico'), {
      draftId: null,
      personId: 'SYN-1100102-09',
      content: { consecutive: 'DNCC-DRCS-OL101-1100102-REF-015-2026', responsible: 'intruso', estado: 'PENDIENTE_REVISION' }
    });
    expect(draft.submitted).toBe(false);
    expect(draft.status).toBeNull();
    expect(draft.sentAt).toBeNull();
    expect(draft.content.responsible).toBeUndefined();
    expect(draft.content.estado).toBeUndefined();
  });

  test('la plantilla precarga y el envío reutiliza la misma confirmación', async () => {
    const workbook = await buildTemplateWorkbook();
    const ExcelJS = require('exceljs');
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(workbook);
    const sheet = book.getWorksheet('Referencia');
    const row = sheet.getRow(2);
    row.getCell(2).value = 'SYN-1100102-09';
    row.getCell(3).value = '2026-11-06';
    row.getCell(4).value = 'NO_INMEDIATA';
    row.getCell(5).value = 'VIGILANCIA_TAMIZAJE';
    row.getCell(6).value = 'DNCC-DRCS-OL101-1100102-REF-016-2026';
    row.getCell(7).value = 'CONDICION_MALNUTRICION|EDIN_II_RIESGO_RETRASO_ROJO';
    row.getCell(8).value = 'CONDICION_MALNUTRICION=texto||EDIN_II_RIESGO_RETRASO_ROJO=otro';
    row.getCell(9).value = 'acciones';
    row.getCell(10).value = 'resultados';
    row.getCell(11).value = 'complemento';
    const filled = Buffer.from(await book.xlsx.writeBuffer());
    const { service, repository } = createHarness();
    const preload = await service.preloadTemplate(access('dev-establecimiento-unico'), filled);
    expect(preload.submitted).toBe(false);
    expect(preload.consecutiveReserved).toBe(false);
    expect(preload.referral.captureOrigin).toBe('PLANTILLA');
    expect(preload.referral.responsible).toBeUndefined();
    expect(repository.insertSubmitted).not.toHaveBeenCalled();

    const corrected = {
      ...preload.referral,
      previousActions: 'acciones corregidas',
      originCode: 'REFERENCIA_EXTERNA',
      responsibleProvided: false,
      responsible: null,
      draftId: null
    };
    const submitted = await service.submitReferral(access('dev-establecimiento-unico'), corrected);
    expect(submitted.status).toBe('PENDIENTE_REVISION');
    expect(repository.insertSubmitted).toHaveBeenCalledTimes(1);
    expect(repository.insertSubmitted.mock.calls[0][0].captureOrigin).toBe('PLANTILLA');
    expect(repository.insertSubmitted.mock.calls[0][0].previousActions).toBe('acciones corregidas');
    expect(repository.insertSubmitted.mock.calls[0][0].origin.code).toBe('REFERENCIA_EXTERNA');

    const file = await service.downloadTemplate(access('dev-establecimiento-unico'));
    expect(file.contentType).toContain('spreadsheetml.sheet');
    expect(file.fileName).toBe('referencia-plantilla.xlsx');
    const downloaded = await readTemplateWorkbook(file.body);
    expect(downloaded.templateVersion).toBe('SIA-REF-PLANTILLA-1');
    expect(downloaded.referral.personId).toBe('');

    const blocked = createHarness({ activeCase: true });
    const rejected = await blocked.service.preloadTemplate(access('dev-establecimiento-unico'), filled);
    expect(rejected.submitted).toBe(false);
    expect(rejected.consecutiveReserved).toBe(false);
    expect(rejected.issues[0].message).toBe(ACTIVE_CASE_MESSAGE);
    expect(blocked.repository.insertSubmitted).not.toHaveBeenCalled();
  });

  test('rechaza plantilla dañada, versión ajena, fórmula y tamaño', async () => {
    await expect(readTemplateWorkbook(Buffer.from('no-es-xlsx'))).rejects.toThrow(ValidationError);
    await expect(readTemplateWorkbook(Buffer.concat([
      Buffer.from('PK'),
      Buffer.from('esto-no-es-un-libro-de-excel')
    ]))).rejects.toThrow(/no pudo leerse|contenido activo|no es un libro/);

    const workbook = await buildTemplateWorkbook();
    const ExcelJS = require('exceljs');
    const book = new ExcelJS.Workbook();
    await book.xlsx.load(workbook);
    book.getWorksheet('Referencia').getRow(2).getCell(1).value = 'OTRA-VERSION';
    const other = Buffer.from(await book.xlsx.writeBuffer());
    await expect(readTemplateWorkbook(other)).rejects.toThrow(/versión/);

    const formulaBook = new ExcelJS.Workbook();
    await formulaBook.xlsx.load(workbook);
    formulaBook.getWorksheet('Referencia').getRow(2).getCell(6).value = { formula: '1+1', result: 2 };
    const withFormula = Buffer.from(await formulaBook.xlsx.writeBuffer());
    await expect(readTemplateWorkbook(withFormula)).rejects.toThrow(/fórmulas/);

    const huge = Buffer.alloc(1024 * 1024 + 1, 1);
    await expect(readTemplateWorkbook(huge)).rejects.toThrow(/tamaño/);
    const active = Buffer.concat([workbook, Buffer.from('vbaProject')]);
    await expect(readTemplateWorkbook(active)).rejects.toThrow(/contenido activo/);
    const activeX = Buffer.concat([workbook, Buffer.from('xl/activeX')]);
    await expect(readTemplateWorkbook(activeX)).rejects.toThrow(/contenido activo/);

    const linked = new ExcelJS.Workbook();
    await linked.xlsx.load(workbook);
    const linkedCell = linked.getWorksheet('Referencia').getRow(2).getCell(6);
    linkedCell.value = {
      text: 'DNCC-DRCS-OL101-1100102-REF-016-2026',
      hyperlink: 'https://example.invalid/referencia'
    };
    const withLink = Buffer.from(await linked.xlsx.writeBuffer());
    await expect(readTemplateWorkbook(withLink)).rejects.toThrow(/enlaces/);

    const orphan = new ExcelJS.Workbook();
    await orphan.xlsx.load(workbook);
    const orphanRow = orphan.getWorksheet('Referencia').getRow(2);
    orphanRow.getCell(2).value = 'SYN-1100102-09';
    orphanRow.getCell(7).value = 'CONDICION_MALNUTRICION';
    orphanRow.getCell(8).value = 'EDIN_II_RIESGO_RETRASO_ROJO=no seleccionada';
    const orphanFile = Buffer.from(await orphan.xlsx.writeBuffer());
    await expect(readTemplateWorkbook(orphanFile)).rejects.toThrow(/no está seleccionado/);
  });

  test('lista por ámbito y niega el detalle ajeno sin confirmar existencia', async () => {
    const header = {
      referencia_id: 15,
      consecutivo: 'DNCC-DRCS-OL101-1100102-REF-001-2026',
      per_id_persona: 'SYN-1100102-09',
      estado: 'PENDIENTE_REVISION',
      fecha_referencia: '2026-02-01',
      enviada_en: '2026-02-01 08:00:00',
      responsable_usuario: 'dev-establecimiento-unico',
      enviada_por: 'dev-establecimiento-unico',
      acciones_previas: 'acciones guardadas',
      resultados_previos: 'resultados guardados',
      informacion_complementaria: 'nota guardada',
      origen_captura: 'MANUAL',
      plantilla_version: null,
      establecimiento_id: 1100102,
      oficina_local_id: 101,
      region_id: 1,
      via_codigo: 'URGENCIA',
      via_etiqueta: 'Urgencia',
      origen_codigo: 'OBSERVACION',
      origen_etiqueta: 'Observación',
      encargado_nombre: 'Luis Solis',
      relacion_encargado: 'MADRE',
      contacto: '22220000',
      direccion: 'Dirección histórica',
      servicios_texto: 'Cuido diario',
      region_nombre: 'Región histórica',
      oficina_local_nombre: 'Oficina histórica',
      establecimiento_nombre: 'Establecimiento histórico',
      edad_anios: 6,
      fecha_nacimiento_informada: '2020-01-15'
    };
    const { service, repository, adapter } = createHarness({
      header,
      motives: [{ codigo: 'CONDICION_MALNUTRICION', etiqueta: 'Condición de malnutrición', especificacion: 'detalle' }],
      page: {
        total: 1,
        items: [{
          referencia_id: 15,
          consecutivo: header.consecutivo,
          per_id_persona: header.per_id_persona,
          estado: header.estado,
          responsable_usuario: header.responsable_usuario,
          enviada_en: header.enviada_en,
          establecimiento_id: 1100102,
          establecimiento_nombre: 'Establecimiento histórico',
          via_codigo: 'URGENCIA',
          via_etiqueta: 'Urgencia'
        }]
      }
    });
    const page = await service.listReferences(access('dev-establecimiento-unico'), {
      page: 1,
      pageSize: 20,
      name: null,
      identification: null,
      consecutive: null,
      status: 'PENDIENTE_REVISION',
      attentionRoute: 'URGENCIA',
      origin: null,
      category: null,
      motiveCodes: [],
      categoryHasNoConfirmedCodes: false,
      establishmentId: null
    });
    expect(page.result.total).toBe(1);
    expect(page.result.items[0].establishment.name).toBe('Establecimiento histórico');
    expect(repository.listReferences.mock.calls[0][0].scope.establishmentIds).toEqual([1100102]);

    await service.listReferences(access('dev-establecimiento-unico'), {
      page: 3,
      pageSize: 20,
      offset: 40,
      name: 'Ana',
      identification: 'SYN-1100102-09',
      consecutive: 'REF-001',
      status: 'PENDIENTE_REVISION',
      attentionRoute: 'URGENCIA',
      origin: 'OBSERVACION',
      category: 'CRECIMIENTO',
      motiveCodes: ['CONDICION_MALNUTRICION', 'MALNUTRICION_NECESIDADES_ESPECIALES'],
      categoryHasNoConfirmedCodes: false,
      establishmentId: null
    });
    expect(adapter.searchPersons).toHaveBeenCalledWith(expect.objectContaining({ mode: 'name', text: 'Ana' }));
    expect(repository.listReferences.mock.calls[1][0]).toMatchObject({
      offset: 40,
      pageSize: 20,
      identification: 'SYN-1100102-09',
      consecutive: 'REF-001',
      status: 'PENDIENTE_REVISION',
      attentionRoute: 'URGENCIA',
      origin: 'OBSERVACION',
      motiveCodes: ['CONDICION_MALNUTRICION', 'MALNUTRICION_NECESIDADES_ESPECIALES'],
      personIds: ['SYN-1100102-09']
    });

    const detail = await service.getReference(access('dev-establecimiento-unico'), 15);
    expect(detail.historicalContext.regionName).toBe('Región histórica');
    expect(detail.historicalContext.ageYears).toBe(6);
    expect(detail.referenceDate).toBe('2026-02-01');
    expect(detail.attentionRoute.code).toBe('URGENCIA');
    expect(detail.origin.code).toBe('OBSERVACION');
    expect(detail.previousActions).toBe('acciones guardadas');
    expect(detail.previousResults).toBe('resultados guardados');
    expect(detail.complementaryInformation).toBe('nota guardada');
    expect(detail.motives[0].specification).toBe('detalle');
    expect(detail.responsible).toBe('dev-establecimiento-unico');
    expect(detail.sentBy).toBe('dev-establecimiento-unico');

    repository.findReference.mockResolvedValueOnce(null);
    await expect(service.getReference(access('dev-oficina-perez-zeledon'), 15)).rejects.toThrow('El recurso solicitado no existe.');
    expect(repository.findReference.mock.calls.at(-1)[1]).toMatchObject({
      accessLevel: 'OFICINA_LOCAL',
      localOfficeId: 501,
      regionId: 5
    });
    expect(adapter.findPersonInScope).toHaveBeenCalled();
  });

  test('imprime sin cambiar el comprobante de envío', async () => {
    const header = {
      referencia_id: 15,
      consecutivo: 'DNCC-DRCS-OL101-1100102-REF-001-2026',
      per_id_persona: 'SYN-1100102-09',
      estado: 'PENDIENTE_REVISION',
      fecha_referencia: '2026-02-01',
      enviada_en: '2026-02-01 08:00:00',
      responsable_usuario: 'dev-establecimiento-unico',
      enviada_por: 'dev-establecimiento-unico',
      acciones_previas: 'acciones guardadas',
      resultados_previos: 'resultados guardados',
      informacion_complementaria: 'nota guardada',
      origen_captura: 'MANUAL',
      plantilla_version: null,
      establecimiento_id: 1100102,
      oficina_local_id: 101,
      region_id: 1,
      via_codigo: 'URGENCIA',
      via_etiqueta: 'Urgencia',
      origen_codigo: 'OBSERVACION',
      origen_etiqueta: 'Observación',
      encargado_nombre: null,
      relacion_encargado: null,
      contacto: null,
      direccion: null,
      servicios_texto: null,
      region_nombre: 'Región histórica',
      oficina_local_nombre: 'Oficina histórica',
      establecimiento_nombre: 'Establecimiento histórico',
      edad_anios: 6,
      fecha_nacimiento_informada: '2020-01-15'
    };
    const { service, repository } = createHarness({
      header,
      motives: [{ codigo: 'OTRA_CONDICION_SALUD', etiqueta: 'Otra condición de salud', especificacion: 'detalle de salud' }]
    });
    const document = await service.printReference(access('dev-establecimiento-unico'), 15);
    expect(document.generatedAt).toBe('2026-11-06T19:10:00Z');
    expect(document.sentAt).toBe('2026-02-01T08:00:00Z');
    expect(document.body).toContain('Región histórica');
    expect(document.body).toContain('Oficina histórica');
    expect(document.body).toContain('Establecimiento histórico');
    expect(document.body).toContain('SYN-1100102-09');
    expect(document.body).toContain('Ana Solis Rojas');
    expect(document.body).toContain('Femenino');
    expect(document.body).toContain('2020-01-15');
    expect(document.body).toContain('Urgencia');
    expect(document.body).toContain('Observación');
    expect(document.body).toContain('Otra condición de salud');
    expect(document.body).toContain('detalle de salud');
    expect(document.body).toContain('acciones guardadas');
    expect(document.body).toContain('resultados guardados');
    expect(document.body).toContain('nota guardada');
    expect(document.body).toContain('2026-02-01T08:00:00Z');
    expect(document.body).toContain('2026-11-06T19:10:00Z');
    expect(repository.recordPrint).toHaveBeenCalledTimes(1);
    expect(repository.insertSubmitted).not.toHaveBeenCalled();
  });

  test('un rol sin capacidad no consulta ni crea', async () => {
    const { service, repository } = createHarness();
    await expect(service.listReferences(access('dev-region-central-sur'), {
      page: 1,
      pageSize: 20,
      categoryHasNoConfirmedCodes: false
    })).rejects.toThrow(/no está permitida/);
    await expect(service.submitReferral(access('dev-sin-capacidades'), command())).rejects.toThrow(/no está permitida/);
    expect(repository.listReferences).not.toHaveBeenCalled();
    expect(repository.insertSubmitted).not.toHaveBeenCalled();
  });

  test('la categoría sin ítems confirmados no abre el ámbito', async () => {
    const { service, repository } = createHarness();
    const page = await service.listReferences(access('dev-oficina-hatillo'), {
      page: 1,
      pageSize: 20,
      name: null,
      identification: null,
      consecutive: null,
      status: null,
      attentionRoute: null,
      origin: null,
      category: 'FACTORES_RIESGO',
      motiveCodes: [],
      categoryHasNoConfirmedCodes: true,
      establishmentId: null
    });
    expect(page.result.total).toBe(0);
    expect(repository.listReferences).not.toHaveBeenCalled();
  });

  test('publica crecimiento, desarrollo y salud, y deja factores de riesgo sin ítems', async () => {
    const { service } = createHarness();
    const catalogs = await service.listCatalogs(access('dev-establecimiento-unico'));
    expect(catalogs.motives.filter((item) => item.category === 'DESARROLLO').map((item) => item.code)).toEqual([
      'EDIN_II_RIESGO_RETRASO_ROJO',
      'EVADE_RIESGO_REZAGO_0_1'
    ]);
    expect(catalogs.motives.filter((item) => item.category === 'SALUD').map((item) => item.code)).toEqual([
      'OTRA_CONDICION_SALUD'
    ]);
    expect(catalogs.origins.map((item) => item.code)).toEqual(expect.arrayContaining([
      'INFORMACION_FAMILIA_U_OTROS',
      'REFERENCIA_EXTERNA'
    ]));
    expect(catalogs.riskFactors).toMatchObject({ status: 'NEEDS_VALIDATION', items: [] });
  });
});
