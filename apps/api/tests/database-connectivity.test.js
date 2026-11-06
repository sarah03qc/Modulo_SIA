'use strict';

const { loadConfig } = require('../src/config/load-config');
const { createDatabaseGateway } = require('../src/infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('../src/infrastructure/integrations/sidinacc-adapter');

const placeholder = !process.env.SIA_DB_PASSWORD
  || !process.env.SIDINACC_DB_PASSWORD
  || process.env.SIA_DB_PASSWORD === 'CHANGE_ME'
  || process.env.SIDINACC_DB_PASSWORD === 'CHANGE_ME';

const describeLive = placeholder ? describe.skip : describe;

describeLive('conexión local a SQL Server', () => {
  jest.setTimeout(30000);

  let config;
  let gateway;
  let adapter;

  beforeAll(() => {
    config = loadConfig(process.env);
    gateway = createDatabaseGateway(config);
    adapter = createSidinaccAdapter(gateway.sidinacc);
  });

  afterAll(async () => {
    if (gateway) {
      await gateway.close();
    }
  });

  test('lee ambas bases sin modificar los conteos de comprobación', async () => {
    const siaBefore = await gateway.sia.query(
      'SELECT COUNT(*) AS migration_count FROM dbo.schema_migracion'
    );
    const sidinaccBefore = await gateway.sidinacc.query(
      'SELECT COUNT(*) AS table_count FROM sys.tables'
    );

    const sia = await gateway.sia.probe();
    const sidinacc = await adapter.checkAvailability();

    const siaAfter = await gateway.sia.query(
      'SELECT COUNT(*) AS migration_count FROM dbo.schema_migracion'
    );
    const sidinaccAfter = await gateway.sidinacc.query(
      'SELECT COUNT(*) AS table_count FROM sys.tables'
    );

    expect(sia.database).toBe('SIA_CENCINAI');
    expect(sidinacc.available).toBe(true);
    expect(sidinacc.database).toBe('SIDINACC_LOCAL');
    expect(typeof sidinacc.readOnly).toBe('boolean');
    if (config.sidinacc.user.toLowerCase() === 'sa' || config.sameDatabaseUser) {
      expect(sidinacc.readOnly).toBe(false);
    }
    expect(siaBefore[0].migration_count).toBe(siaAfter[0].migration_count);
    expect(sidinaccBefore[0].table_count).toBe(sidinaccAfter[0].table_count);
  });
});
