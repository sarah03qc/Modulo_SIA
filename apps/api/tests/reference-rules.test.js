'use strict';

const { ValidationError } = require('../src/common/errors');
const { buildReferenceListQuery } = require('../src/modules/references/reference-repository');
const {
  canonicalizeConsecutive,
  assertConsecutiveMatchesPerson,
  normalizeMotives,
  motiveCodesForCategory
} = require('../src/modules/references/reference-rules');
const { renderReferenceDocument } = require('../src/modules/references/reference-document');

const motives = new Map([
  ['CONDICION_MALNUTRICION', { itemId: 7, code: 'CONDICION_MALNUTRICION', label: 'Condición de malnutrición' }],
  ['EDIN_II_RIESGO_RETRASO_ROJO', { itemId: 9, code: 'EDIN_II_RIESGO_RETRASO_ROJO', label: 'EDIN II' }]
]);

describe('reglas del consecutivo y de la consulta', () => {
  test('acepta el patrón vigente y conserva la forma canónica', () => {
    const value = canonicalizeConsecutive(' dncc-drcs-ol101-1100102-ref-015-2026 ');
    expect(value).toBe('DNCC-DRCS-OL101-1100102-REF-015-2026');
  });

  test('no exige que la oficina ni la región del patrón coincidan con la persona', () => {
    const value = canonicalizeConsecutive('DNCC-DRBR-OL999-1100102-REF-015-2026');
    expect(() => assertConsecutiveMatchesPerson(value, 1100102)).not.toThrow();
  });

  test('rechaza formato, región desconocida y establecimiento distinto', () => {
    expect(() => canonicalizeConsecutive('REF-001')).toThrow(ValidationError);
    expect(() => canonicalizeConsecutive('DNCC-DRZZ-OL101-1100102-REF-015-2026')).toThrow(/regional/);
    const valid = canonicalizeConsecutive('DNCC-DRCS-OL101-999-REF-015-2026');
    expect(() => assertConsecutiveMatchesPerson(valid, 1100102)).toThrow(/persona referida/);
  });

  test('admite varios motivos y no conserva una especificación de uno no seleccionado', () => {
    const selected = normalizeMotives([
      { code: 'CONDICION_MALNUTRICION', specification: 'detalle' },
      { code: 'EDIN_II_RIESGO_RETRASO_ROJO', specification: null }
    ], motives);
    expect(selected).toHaveLength(2);
    expect(selected.map((item) => item.specification)).toEqual(['detalle', null]);
    expect(() => normalizeMotives([{ code: 'OTRO_FACTOR' }], motives)).toThrow(/catálogo vigente/);
  });

  test('la categoría de factores de riesgo no tiene códigos confirmados', () => {
    expect(motiveCodesForCategory('FACTORES_RIESGO')).toEqual([]);
    expect(motiveCodesForCategory('CRECIMIENTO')).toEqual([
      'CONDICION_MALNUTRICION',
      'MALNUTRICION_NECESIDADES_ESPECIALES'
    ]);
    expect(motiveCodesForCategory('DESARROLLO')).toEqual([
      'EDIN_II_RIESGO_RETRASO_ROJO',
      'EVADE_RIESGO_REZAGO_0_1'
    ]);
    expect(motiveCodesForCategory('SALUD')).toEqual(['OTRA_CONDICION_SALUD']);
  });

  test('el filtro SQL no interpola el texto buscado', () => {
    const attack = "'; DROP TABLE dbo.ref_referencia; --";
    const query = buildReferenceListQuery({
      scope: { accessLevel: 'ESTABLECIMIENTO', establishmentIds: [1100102] },
      consecutive: attack,
      identification: 'SYN-1100102-01',
      offset: 0,
      pageSize: 20,
      motiveCodes: ['CONDICION_MALNUTRICION']
    });
    expect(query.listSql).not.toContain('DROP TABLE');
    expect(query.countSql).toContain('ref.establecimiento_id IN');
    expect(query.parameters.consecutivePattern.value).toContain('DROP TABLE');
    expect(query.parameters.identification.value).toBe('SYN-1100102-01');
    expect(query.parameters.motiveCode0.value).toBe('CONDICION_MALNUTRICION');
    expect(query.listSql).toContain('motive_item.codigo IN (@motiveCode0)');
    expect(query.countSql).toContain('motive_item.codigo IN (@motiveCode0)');
  });

  test('la oficina local filtra por oficina y región dentro de SQL', () => {
    const query = buildReferenceListQuery({
      scope: { accessLevel: 'OFICINA_LOCAL', localOfficeId: 101, regionId: 1, establishmentIds: null },
      offset: 20,
      pageSize: 20
    });
    expect(query.listSql).toContain('ref.oficina_local_id = @scopeOffice');
    expect(query.listSql).toContain('ref.region_id = @scopeRegion');
    expect(query.parameters.scopeOffice.value).toBe(101);
    expect(query.parameters.rowOffset.value).toBe(20);
    expect(query.listSql).toContain('OFFSET @rowOffset ROWS FETCH NEXT @pageSize ROWS ONLY');
    expect(query.countSql).not.toContain('OFFSET');
  });

  test('estado, vía, origen y página viajan como parámetros', () => {
    const query = buildReferenceListQuery({
      scope: { accessLevel: 'ESTABLECIMIENTO', establishmentIds: [1100102] },
      status: 'PENDIENTE_REVISION',
      attentionRoute: 'URGENCIA',
      origin: 'REFERENCIA_EXTERNA',
      offset: 40,
      pageSize: 20
    });
    expect(query.listSql).toContain('ref.estado = @status');
    expect(query.listSql).toContain('via.codigo = @attentionRoute');
    expect(query.listSql).toContain('origin.codigo = @origin');
    expect(query.countSql).toContain('origin.codigo = @origin');
    expect(query.parameters.status.value).toBe('PENDIENTE_REVISION');
    expect(query.parameters.attentionRoute.value).toBe('URGENCIA');
    expect(query.parameters.origin.value).toBe('REFERENCIA_EXTERNA');
    expect(query.parameters.rowOffset.value).toBe(40);
    expect(query.parameters.pageSize.value).toBe(20);
  });

  test('el documento escapa contenido y separa la generación del envío', () => {
    const html = renderReferenceDocument({
      consecutive: 'DNCC-DRCS-OL101-1100102-REF-015-2026',
      referenceDate: '2026-11-06',
      sentAt: '2026-11-06T18:00:00Z',
      responsible: 'dev-establecimiento-unico',
      status: 'PENDIENTE_REVISION',
      person: { personId: 'SYN-1', fullName: '<script>alert(1)</script>', sex: 'Femenino' },
      historicalContext: {
        birthDate: '2020-01-15',
        ageYears: 6,
        servicesText: null,
        regionName: 'Central Sur',
        localOfficeName: 'Hatillo',
        establishmentName: 'Establecimiento',
        guardianName: null,
        guardianRelationship: null,
        contact: null,
        address: null
      },
      attentionRoute: { label: 'Urgencia' },
      origin: { label: 'Observación' },
      previousActions: 'acción',
      previousResults: 'resultado',
      complementaryInformation: 'nota',
      motives: [{ label: 'Condición de malnutrición', specification: 'detalle' }]
    }, '2026-11-06T19:00:00Z');
    expect(html).toContain('DNCC-DRCS-OL101-1100102-REF-015-2026');
    expect(html).toContain('2026-11-06T18:00:00Z');
    expect(html).toContain('2026-11-06T19:00:00Z');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toContain('<script>');
    expect(html).toContain('No aplica un diseño institucional aprobado');
    expect(html).toContain('SYN-1');
    expect(html).toContain('2020-01-15');
    expect(html).toContain('>6<');
    expect(html).toContain('Femenino');
    expect(html).toContain('Central Sur');
    expect(html).toContain('Hatillo');
    expect(html).toContain('Urgencia');
    expect(html).toContain('Observación');
    expect(html).toContain('Condición de malnutrición');
    expect(html).toContain('detalle');
    expect(html).toContain('acción');
    expect(html).toContain('resultado');
    expect(html).toContain('nota');
    expect(html).toContain('Fecha y hora de envío');
    expect(html).toContain('Fecha y hora de generación del documento');
  });
});
