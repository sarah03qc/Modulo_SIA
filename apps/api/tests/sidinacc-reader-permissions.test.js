'use strict';

const sql = require('mssql');
const { loadConfig } = require('../src/config/load-config');
const { toMssqlConfig, createDatabaseGateway } = require('../src/infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('../src/infrastructure/integrations/sidinacc-adapter');

const READER_LOGIN = 'sia_sidinacc_app';
const PROBE_TABLE = '__sia_reader_permission_probe';
const readerReady = process.env.SIDINACC_DB_USER === READER_LOGIN
  && process.env.SIDINACC_DB_PASSWORD
  && process.env.SIDINACC_DB_PASSWORD !== 'CHANGE_ME'
  && process.env.SIA_DB_PASSWORD
  && process.env.SIA_DB_PASSWORD !== 'CHANGE_ME';

const describeLive = readerReady ? describe : describe.skip;

const COUNTS_SQL = `
SELECT
  (SELECT COUNT(*) FROM SIDINACC_LOCAL.sys.tables) AS sidinacc_tables,
  (SELECT COUNT(*) FROM SIDINACC_LOCAL.dbo.CAF_CAT_SEXO) AS catalog_rows,
  (SELECT COUNT(*) FROM SIDINACC_LOCAL.dbo.CAF_PERSONA) AS person_rows,
  (SELECT COUNT(*) FROM SIA_CENCINAI.dbo.schema_migracion) AS sia_migrations,
  (SELECT COUNT(*) FROM SIA_CENCINAI.sys.tables) AS sia_tables
`;

function errorNumber(error) {
  if (error && Number.isInteger(error.number)) {
    return error.number;
  }
  const nested = error && error.originalError && error.originalError.info;
  return nested && Number.isInteger(nested.number) ? nested.number : null;
}

async function runStatement(pool, statement) {
  try {
    const result = await pool.request().query(statement);
    return { denied: false, rows: result.recordset ? result.recordset.length : 0 };
  } catch (error) {
    return { denied: true, number: errorNumber(error) };
  }
}

describeLive('permisos SQL del login institucional', () => {
  jest.setTimeout(30000);

  let config;
  let admin;
  let reader;
  let gateway;
  let before;

  beforeAll(async () => {
    config = loadConfig(process.env);
    const timeouts = {
      connectionTimeoutMs: config.connectionTimeoutMs,
      requestTimeoutMs: config.requestTimeoutMs
    };
    admin = await new sql.ConnectionPool(toMssqlConfig(
      { ...config.sia, database: 'master', appName: 'sia-reader-permission-test' },
      timeouts,
      1
    )).connect();
    reader = await new sql.ConnectionPool(toMssqlConfig(
      { ...config.sidinacc, appName: 'sia-sidinacc-reader-check' },
      timeouts,
      1
    )).connect();
    gateway = createDatabaseGateway(config);
    before = (await admin.request().query(COUNTS_SQL)).recordset[0];
    await admin.request().query(`
      IF OBJECT_ID(N'SIDINACC_LOCAL.dbo.${PROBE_TABLE}', N'U') IS NOT NULL
        DROP TABLE SIDINACC_LOCAL.dbo.${PROBE_TABLE};
      CREATE TABLE SIDINACC_LOCAL.dbo.${PROBE_TABLE} (id int NOT NULL);
    `);
  });

  afterAll(async () => {
    if (admin) {
      await admin.request().query(`
        IF COL_LENGTH(N'SIDINACC_LOCAL.dbo.CAF_CAT_SEXO', N'__sia_reader_probe') IS NOT NULL
          ALTER TABLE SIDINACC_LOCAL.dbo.CAF_CAT_SEXO DROP COLUMN __sia_reader_probe;
        IF OBJECT_ID(N'SIDINACC_LOCAL.dbo.${PROBE_TABLE}', N'U') IS NOT NULL
          DROP TABLE SIDINACC_LOCAL.dbo.${PROBE_TABLE};
        IF OBJECT_ID(N'SIDINACC_LOCAL.dbo.__sia_reader_create_probe', N'U') IS NOT NULL
          DROP TABLE SIDINACC_LOCAL.dbo.__sia_reader_create_probe;
      `);
      const after = before ? (await admin.request().query(COUNTS_SQL)).recordset[0] : null;
      await admin.close();
      if (before && after && Object.keys(before).some((key) => before[key] !== after[key])) {
        throw new Error('Los conteos de comprobación cambiaron durante la prueba de permisos.');
      }
    }
    if (reader) {
      await reader.close();
    }
    if (gateway) {
      await gateway.close();
    }
  });

  test('la cuenta técnica lee SIDINACC_LOCAL y el motor niega escritura y SIA_CENCINAI', async () => {
    const permissions = (await reader.request().query(`
      SELECT
        ORIGINAL_LOGIN() AS original_login,
        DB_NAME() AS database_name,
        CONVERT(int, IS_SRVROLEMEMBER('sysadmin')) AS sysadmin,
        CONVERT(int, IS_ROLEMEMBER('db_owner')) AS db_owner,
        CONVERT(int, IS_ROLEMEMBER('db_datawriter')) AS db_datawriter,
        CONVERT(int, IS_ROLEMEMBER('db_ddladmin')) AS db_ddladmin,
        CONVERT(int, IS_ROLEMEMBER('db_datareader')) AS db_datareader,
        CONVERT(int, IS_ROLEMEMBER('sia_sidinacc_reader_role')) AS reader_role,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'SELECT')) AS can_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'INSERT')) AS can_insert,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'UPDATE')) AS can_update,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'DELETE')) AS can_delete,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'ALTER')) AS can_alter,
        CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE')) AS can_create_table,
        CONVERT(int, HAS_DBACCESS('SIA_CENCINAI')) AS sia_access
    `)).recordset[0];

    expect(permissions).toMatchObject({
      original_login: READER_LOGIN,
      database_name: 'SIDINACC_LOCAL',
      sysadmin: 0,
      db_owner: 0,
      db_datawriter: 0,
      db_ddladmin: 0,
      db_datareader: 1,
      reader_role: 1,
      can_select: 1,
      can_insert: 0,
      can_update: 0,
      can_delete: 0,
      can_alter: 0,
      can_create_table: 0,
      sia_access: 0
    });
    expect(config.sameDatabaseUser).toBe(false);
    expect(gateway.sidinacc.writeFilterEnabled).toBe(true);

    const selected = await gateway.sidinacc.query(
      'SELECT TOP (0) CAT_idSexo AS catalog_key FROM dbo.CAF_CAT_SEXO'
    );
    expect(selected).toEqual([]);

    await expect(
      gateway.sidinacc.query('DELETE FROM dbo.CAF_CAT_SEXO WHERE 1 = 0')
    ).rejects.toMatchObject({ code: 'INFRASTRUCTURE_UNAVAILABLE' });

    const availability = await createSidinaccAdapter(gateway.sidinacc).checkAvailability();
    expect(availability).toMatchObject({
      available: true,
      database: 'SIDINACC_LOCAL',
      readOnly: true
    });

    expect(await runStatement(
      reader,
      'INSERT INTO dbo.CAF_CAT_SEXO (SNB_codigo) SELECT CAST(1 AS tinyint) WHERE 1 = 0'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      reader,
      'UPDATE dbo.CAF_CAT_SEXO SET BIT_eliminado = BIT_eliminado WHERE 1 = 0'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      reader,
      'DELETE FROM dbo.CAF_CAT_SEXO WHERE 1 = 0'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      reader,
      'CREATE TABLE dbo.__sia_reader_create_probe (id int NOT NULL)'
    )).toEqual({ denied: true, number: 262 });
    expect(await runStatement(
      reader,
      'ALTER TABLE dbo.CAF_CAT_SEXO ADD __sia_reader_probe int NULL'
    )).toEqual({ denied: true, number: 1088 });
    expect(await runStatement(
      reader,
      `DROP TABLE dbo.${PROBE_TABLE}`
    )).toEqual({ denied: true, number: 3701 });
    expect(await runStatement(
      reader,
      'SELECT TOP (0) schema_migracion_id AS migration_key FROM SIA_CENCINAI.dbo.schema_migracion'
    )).toEqual({ denied: true, number: 916 });
    expect(await runStatement(
      reader,
      "INSERT INTO SIA_CENCINAI.dbo.schema_migracion (codigo) SELECT N'probe' WHERE 1 = 0"
    )).toEqual({ denied: true, number: 916 });

    const probeStillExists = (await admin.request().query(`
      SELECT OBJECT_ID(N'SIDINACC_LOCAL.dbo.${PROBE_TABLE}', N'U') AS probe_table
    `)).recordset[0].probe_table;
    expect(probeStillExists).not.toBeNull();
  });
});
