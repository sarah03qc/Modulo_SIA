'use strict';

const sql = require('mssql');
const { loadConfig } = require('../src/config/load-config');
const { toMssqlConfig, createDatabaseGateway } = require('../src/infrastructure/database/sql-client');
const { createSidinaccAdapter } = require('../src/infrastructure/integrations/sidinacc-adapter');

const READER_LOGIN = 'sia_sidinacc_app';
const APP_LOGIN = 'sia_cencinai_app';

const liveReady = Boolean(process.env.SIDINACC_DB_PASSWORD)
  && process.env.SIDINACC_DB_PASSWORD !== 'CHANGE_ME'
  && Boolean(process.env.SIA_DB_PASSWORD)
  && process.env.SIA_DB_PASSWORD !== 'CHANGE_ME';

const describeLive = liveReady ? describe : describe.skip;

const READER_COUNTS_SQL = `
SELECT
  (SELECT COUNT(*) FROM sys.tables) AS sidinacc_tables,
  (SELECT COUNT(*) FROM dbo.CAF_CAT_SEXO) AS catalog_rows,
  (SELECT COUNT(*) FROM dbo.CAF_PERSONA) AS person_rows
`;

const APP_COUNTS_SQL = `
SELECT
  (SELECT COUNT(*) FROM dbo.schema_migracion) AS sia_migrations,
  (SELECT COUNT(*) FROM sys.tables) AS visible_tables,
  (SELECT COUNT(*) FROM dbo.caso_lista_establecimiento) AS case_rows
`;

const APPLIED_MIGRATIONS = [
  { codigo: '001_database_prerequisites', orden: 1, estado: 'APLICADA' },
  { codigo: '010_core_schema', orden: 10, estado: 'APLICADA' },
  { codigo: '020_catalogs_and_configuration', orden: 20, estado: 'APLICADA' },
  { codigo: '030_references', orden: 30, estado: 'APLICADA' },
  { codigo: '040_sessions_and_assessments', orden: 40, estado: 'APLICADA' },
  { codigo: '050_cases_and_plans', orden: 50, estado: 'APLICADA' },
  { codigo: '060_attentions_and_scheduling', orden: 60, estado: 'APLICADA' },
  { codigo: '070_documents_and_reporting', orden: 70, estado: 'APLICADA' },
  { codigo: '080_audit_and_security', orden: 80, estado: 'APLICADA' },
  { codigo: '090_constraints_and_indexes', orden: 90, estado: 'APLICADA' }
];

const PUBLIC_SERVER_PERMISSIONS = ['CONNECT SQL', 'VIEW ANY DATABASE'];
const PUBLIC_DATABASE_EXTRAS = [
  'VIEW ANY COLUMN ENCRYPTION KEY DEFINITION',
  'VIEW ANY COLUMN MASTER KEY DEFINITION'
];

function errorNumber(error) {
  if (error && Number.isInteger(error.number)) {
    return error.number;
  }
  const nested = error && error.originalError && error.originalError.info;
  return nested && Number.isInteger(nested.number) ? nested.number : null;
}

function sortedNames(rows) {
  return rows.map((row) => row.permission_name).sort();
}

async function runStatement(pool, statement) {
  try {
    const result = await pool.request().query(statement);
    return { denied: false, rows: result.recordset ? result.recordset.length : 0 };
  } catch (error) {
    return { denied: true, number: errorNumber(error) };
  }
}

async function connectPool(databaseConfig, timeouts, appName) {
  const pool = new sql.ConnectionPool(toMssqlConfig(
    { ...databaseConfig, appName },
    timeouts,
    1
  ));
  try {
    await pool.connect();
    return pool;
  } catch (error) {
    await pool.close().catch(() => {});
    throw error;
  }
}

async function expectDatabaseRejected(databaseConfig, timeouts, appName) {
  const pool = new sql.ConnectionPool(toMssqlConfig(
    { ...databaseConfig, appName },
    timeouts,
    1
  ));
  try {
    await pool.connect();
  } catch (error) {
    await pool.close().catch(() => {});
    expect(error.code).toBe('ELOGIN');
    return;
  }
  await pool.close().catch(() => {});
  throw new Error(
    `La cuenta ${databaseConfig.user} no debía conectarse a ${databaseConfig.database}.`
  );
}

describeLive('permisos SQL de las cuentas de aplicación', () => {
  jest.setTimeout(60000);

  let config;
  let timeouts;
  let reader;
  let app;
  let gateway;
  let readerBefore;
  let appBefore;

  async function closeQuiet(resource, failures) {
    if (!resource || typeof resource.close !== 'function') {
      return;
    }
    try {
      await resource.close();
    } catch (error) {
      failures.push(error);
    }
  }

  beforeAll(async () => {
    config = loadConfig(process.env);
    timeouts = {
      connectionTimeoutMs: config.connectionTimeoutMs,
      requestTimeoutMs: config.requestTimeoutMs
    };
    try {
      reader = await connectPool(config.sidinacc, timeouts, 'sia-sidinacc-reader-check');
      app = await connectPool(config.sia, timeouts, 'sia-cencinai-app-check');
      gateway = createDatabaseGateway(config);
      readerBefore = (await reader.request().query(READER_COUNTS_SQL)).recordset[0];
      appBefore = (await app.request().query(APP_COUNTS_SQL)).recordset[0];
    } catch (error) {
      const failures = [];
      await closeQuiet(reader, failures);
      await closeQuiet(app, failures);
      await closeQuiet(gateway, failures);
      reader = null;
      app = null;
      gateway = null;
      if (failures.length > 0) {
        error.message = `${error.message} | limpieza: ${failures.map((item) => item.message).join(' | ')}`;
      }
      throw error;
    }
  });

  afterAll(async () => {
    const failures = [];
    if (reader && readerBefore) {
      try {
        const after = (await reader.request().query(READER_COUNTS_SQL)).recordset[0];
        if (JSON.stringify(readerBefore) !== JSON.stringify(after)) {
          failures.push(new Error('Los conteos de SIDINACC_LOCAL cambiaron durante la prueba de permisos.'));
        }
      } catch (error) {
        failures.push(error);
      }
    }
    if (app && appBefore) {
      try {
        const after = (await app.request().query(APP_COUNTS_SQL)).recordset[0];
        if (JSON.stringify(appBefore) !== JSON.stringify(after)) {
          failures.push(new Error('Los conteos visibles de SIA_CENCINAI cambiaron durante la prueba de permisos.'));
        }
      } catch (error) {
        failures.push(error);
      }
    }
    await closeQuiet(reader, failures);
    await closeQuiet(app, failures);
    await closeQuiet(gateway, failures);
    reader = null;
    app = null;
    gateway = null;
    if (failures.length > 0) {
      throw new Error(failures.map((error) => error.message).join(' | '));
    }
  });

  test('sia_sidinacc_app lee SIDINACC_LOCAL y el motor niega escritura y SIA_CENCINAI', async () => {
    const permissions = (await reader.request().query(`
      SELECT
        ORIGINAL_LOGIN() AS original_login,
        DB_NAME() AS database_name,
        CONVERT(int, IS_SRVROLEMEMBER('sysadmin')) AS sysadmin,
        CONVERT(int, IS_SRVROLEMEMBER('serveradmin')) AS serveradmin,
        CONVERT(int, IS_SRVROLEMEMBER('securityadmin')) AS securityadmin,
        CONVERT(int, IS_SRVROLEMEMBER('dbcreator')) AS dbcreator,
        CONVERT(int, IS_ROLEMEMBER('db_owner')) AS db_owner,
        CONVERT(int, IS_ROLEMEMBER('db_securityadmin')) AS db_securityadmin,
        CONVERT(int, IS_ROLEMEMBER('db_ddladmin')) AS db_ddladmin,
        CONVERT(int, IS_ROLEMEMBER('db_datawriter')) AS db_datawriter,
        CONVERT(int, IS_ROLEMEMBER('db_datareader')) AS db_datareader,
        CONVERT(int, IS_ROLEMEMBER('sia_sidinacc_reader_role')) AS reader_role,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'SELECT')) AS can_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'INSERT')) AS can_insert,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'UPDATE')) AS can_update,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'DELETE')) AS can_delete,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.CAF_CAT_SEXO', 'OBJECT', 'ALTER')) AS can_alter,
        CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE')) AS can_create_table,
        CONVERT(int, HAS_DBACCESS('SIA_CENCINAI')) AS sia_access,
        CONVERT(int, HAS_DBACCESS('SIDINACC_LOCAL')) AS sidinacc_access
    `)).recordset[0];

    expect(permissions).toMatchObject({
      original_login: READER_LOGIN,
      database_name: 'SIDINACC_LOCAL',
      sysadmin: 0,
      serveradmin: 0,
      securityadmin: 0,
      dbcreator: 0,
      db_owner: 0,
      db_securityadmin: 0,
      db_ddladmin: 0,
      db_datawriter: 0,
      db_datareader: 1,
      reader_role: 1,
      can_select: 1,
      can_insert: 0,
      can_update: 0,
      can_delete: 0,
      can_alter: 0,
      can_create_table: 0,
      sia_access: 0,
      sidinacc_access: 1
    });

    const serverPermissions = await reader.request().query(`
      SELECT permission_name
      FROM fn_my_permissions(NULL, 'SERVER')
    `);
    expect(sortedNames(serverPermissions.recordset)).toEqual(PUBLIC_SERVER_PERMISSIONS);

    const databasePermissions = await reader.request().query(`
      SELECT permission_name
      FROM fn_my_permissions(NULL, 'DATABASE')
    `);
    expect(sortedNames(databasePermissions.recordset)).toEqual(
      ['CONNECT', 'SELECT', ...PUBLIC_DATABASE_EXTRAS].sort()
    );

    const roles = await reader.request().query(`
      SELECT r.name AS role_name
      FROM sys.database_role_members AS membership
      INNER JOIN sys.database_principals AS r
        ON membership.role_principal_id = r.principal_id
      INNER JOIN sys.database_principals AS member
        ON membership.member_principal_id = member.principal_id
      WHERE member.name = USER_NAME()
    `);
    expect(roles.recordset).toEqual([{ role_name: 'sia_sidinacc_reader_role' }]);

    const probes = await reader.request().query(`
      SELECT name
      FROM sys.tables
      WHERE name LIKE N'%probe%' OR LEFT(name, 5) = N'__sia'
    `);
    expect(probes.recordset).toEqual([]);
    expect(readerBefore.sidinacc_tables).toBe(15);

    expect(config.sameDatabaseUser).toBe(false);
    expect(config.sidinacc.user).toBe(READER_LOGIN);
    expect(gateway.sidinacc.writeFilterEnabled).toBe(true);

    const identity = await gateway.sidinacc.query(`
      SELECT ORIGINAL_LOGIN() AS original_login, DB_NAME() AS database_name
    `);
    expect(identity).toEqual([{ original_login: READER_LOGIN, database_name: 'SIDINACC_LOCAL' }]);

    const selected = await gateway.sidinacc.query(
      'SELECT TOP (0) CAT_idSexo AS catalog_key FROM dbo.CAF_CAT_SEXO'
    );
    expect(selected).toEqual([]);

    // El filtro del adaptador rechaza el DELETE antes de abrir SQL.
    // La denegación del motor está en las sentencias crudas que esperan el error 229.
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
      'SELECT TOP (0) schema_migracion_id AS migration_key FROM SIA_CENCINAI.dbo.schema_migracion'
    )).toEqual({ denied: true, number: 916 });

    await expectDatabaseRejected(
      { ...config.sidinacc, database: 'SIA_CENCINAI' },
      timeouts,
      'sia-sidinacc-boundary'
    );
  });

  test('sia_cencinai_app consulta SIA_CENCINAI y no administra ni alcanza SIDINACC_LOCAL', async () => {
    const permissions = (await app.request().query(`
      SELECT
        ORIGINAL_LOGIN() AS original_login,
        USER_NAME() AS database_user,
        DB_NAME() AS database_name,
        CONVERT(int, IS_SRVROLEMEMBER('sysadmin')) AS sysadmin,
        CONVERT(int, IS_SRVROLEMEMBER('serveradmin')) AS serveradmin,
        CONVERT(int, IS_SRVROLEMEMBER('securityadmin')) AS securityadmin,
        CONVERT(int, IS_SRVROLEMEMBER('dbcreator')) AS dbcreator,
        CONVERT(int, IS_ROLEMEMBER('db_owner')) AS db_owner,
        CONVERT(int, IS_ROLEMEMBER('db_securityadmin')) AS db_securityadmin,
        CONVERT(int, IS_ROLEMEMBER('db_accessadmin')) AS db_accessadmin,
        CONVERT(int, IS_ROLEMEMBER('db_ddladmin')) AS db_ddladmin,
        CONVERT(int, IS_ROLEMEMBER('db_datawriter')) AS db_datawriter,
        CONVERT(int, IS_ROLEMEMBER('db_datareader')) AS db_datareader,
        CONVERT(int, IS_ROLEMEMBER('rol_aplicacion')) AS rol_aplicacion,
        CONVERT(int, IS_ROLEMEMBER('rol_establecimiento')) AS rol_establecimiento,
        CONVERT(int, IS_ROLEMEMBER('rol_lectura_regional')) AS rol_lectura_regional,
        CONVERT(int, IS_ROLEMEMBER('rol_lectura_nacional')) AS rol_lectura_nacional,
        CONVERT(int, IS_ROLEMEMBER('rol_catalogo')) AS rol_catalogo,
        CONVERT(int, IS_ROLEMEMBER('rol_auditoria')) AS rol_auditoria,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.schema_migracion', 'OBJECT', 'SELECT')) AS can_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.schema_migracion', 'OBJECT', 'INSERT')) AS can_insert,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.schema_migracion', 'OBJECT', 'UPDATE')) AS can_update,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.schema_migracion', 'OBJECT', 'DELETE')) AS can_delete,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.schema_migracion', 'OBJECT', 'ALTER')) AS can_alter,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_lista_establecimiento', 'OBJECT', 'SELECT')) AS case_view_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_lista_establecimiento', 'OBJECT', 'INSERT')) AS case_view_insert,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_lista_establecimiento', 'OBJECT', 'UPDATE')) AS case_view_update,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_lista_establecimiento', 'OBJECT', 'DELETE')) AS case_view_delete,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.ses_valoracion', 'OBJECT', 'SELECT')) AS valoracion_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_ai', 'OBJECT', 'SELECT')) AS caso_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.caso_plan', 'OBJECT', 'SELECT')) AS plan_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.ate_individual', 'OBJECT', 'SELECT')) AS atencion_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.doc_documento', 'OBJECT', 'SELECT')) AS documento_select,
        CONVERT(int, HAS_PERMS_BY_NAME('dbo.aud_evento', 'OBJECT', 'INSERT')) AS audit_insert,
        CONVERT(int, HAS_PERMS_BY_NAME('ops.cerrar_caso', 'OBJECT', 'EXECUTE')) AS can_execute_close,
        CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'CREATE TABLE')) AS can_create_table,
        CONVERT(int, HAS_PERMS_BY_NAME(DB_NAME(), 'DATABASE', 'ALTER')) AS can_alter_database,
        CONVERT(int, HAS_DBACCESS('SIA_CENCINAI')) AS sia_access,
        CONVERT(int, HAS_DBACCESS('SIDINACC_LOCAL')) AS sidinacc_access
    `)).recordset[0];

    expect(permissions).toEqual({
      original_login: APP_LOGIN,
      database_user: APP_LOGIN,
      database_name: 'SIA_CENCINAI',
      sysadmin: 0,
      serveradmin: 0,
      securityadmin: 0,
      dbcreator: 0,
      db_owner: 0,
      db_securityadmin: 0,
      db_accessadmin: 0,
      db_ddladmin: 0,
      db_datawriter: 0,
      db_datareader: 0,
      rol_aplicacion: 0,
      rol_establecimiento: 0,
      rol_lectura_regional: 0,
      rol_lectura_nacional: 0,
      rol_catalogo: 0,
      rol_auditoria: 0,
      can_select: 1,
      can_insert: 0,
      can_update: 0,
      can_delete: 0,
      can_alter: 0,
      case_view_select: 1,
      case_view_insert: 0,
      case_view_update: 0,
      case_view_delete: 0,
      valoracion_select: 0,
      caso_select: 0,
      plan_select: 0,
      atencion_select: 0,
      documento_select: 0,
      audit_insert: 0,
      can_execute_close: 0,
      can_create_table: 0,
      can_alter_database: 0,
      sia_access: 1,
      sidinacc_access: 0
    });

    const serverPermissions = await app.request().query(`
      SELECT permission_name
      FROM fn_my_permissions(NULL, 'SERVER')
    `);
    expect(sortedNames(serverPermissions.recordset)).toEqual(PUBLIC_SERVER_PERMISSIONS);

    const databasePermissions = await app.request().query(`
      SELECT permission_name
      FROM fn_my_permissions(NULL, 'DATABASE')
    `);
    expect(sortedNames(databasePermissions.recordset)).toEqual(
      ['CONNECT', ...PUBLIC_DATABASE_EXTRAS].sort()
    );

    const roles = await app.request().query(`
      SELECT r.name AS role_name
      FROM sys.database_role_members AS membership
      INNER JOIN sys.database_principals AS r
        ON membership.role_principal_id = r.principal_id
      INNER JOIN sys.database_principals AS member
        ON membership.member_principal_id = member.principal_id
      WHERE member.name = USER_NAME()
    `);
    expect(roles.recordset).toEqual([]);

    const visibleTables = await app.request().query(`
      SELECT SCHEMA_NAME(schema_id) AS schema_name, name
      FROM sys.tables
      ORDER BY schema_name, name
    `);
    expect(visibleTables.recordset).toEqual([
      { schema_name: 'dbo', name: 'schema_migracion' }
    ]);

    const visibleCaseView = await app.request().query(`
      SELECT SCHEMA_NAME(schema_id) AS schema_name, name
      FROM sys.views
      WHERE name = N'caso_lista_establecimiento'
    `);
    expect(visibleCaseView.recordset).toEqual([
      { schema_name: 'dbo', name: 'caso_lista_establecimiento' }
    ]);

    const migrations = await app.request().query(`
      SELECT codigo, orden, estado
      FROM dbo.schema_migracion
      ORDER BY orden
    `);
    expect(migrations.recordset).toEqual(APPLIED_MIGRATIONS);

    const probes = await app.request().query(`
      SELECT name
      FROM sys.tables
      WHERE name LIKE N'%probe%' OR LEFT(name, 5) = N'__sia'
    `);
    expect(probes.recordset).toEqual([]);

    expect(config.sia.user).toBe(APP_LOGIN);
    expect(config.sameDatabaseUser).toBe(false);

    const identity = await gateway.sia.query(`
      SELECT ORIGINAL_LOGIN() AS original_login, DB_NAME() AS database_name
    `);
    expect(identity).toEqual([{ original_login: APP_LOGIN, database_name: 'SIA_CENCINAI' }]);

    const probe = await gateway.sia.probe();
    expect(probe).toMatchObject({
      database: 'SIA_CENCINAI',
      readOnly: true
    });

    expect(await runStatement(
      app,
      `INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
       SELECT N'probe', 999, N'APLICADA', SYSUTCDATETIME() WHERE 1 = 0`
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      'UPDATE dbo.schema_migracion SET estado = estado WHERE 1 = 0'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      'DELETE FROM dbo.schema_migracion WHERE 1 = 0'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      'SELECT TOP (0) caso_id AS case_key FROM dbo.caso_lista_establecimiento'
    )).toEqual({ denied: false, rows: 0 });
    expect(await runStatement(
      app,
      'SELECT TOP (0) caso_id AS case_key FROM dbo.caso_ai'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      'SELECT TOP (0) valoracion_id AS assessment_key FROM dbo.ses_valoracion'
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      `INSERT INTO dbo.aud_evento (
         ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
       )
       SELECT SYSUTCDATETIME(), N'probe', N'probe', N'probe', N'probe', N'probe', N'probe', N'probe'
       WHERE 1 = 0`
    )).toEqual({ denied: true, number: 229 });
    expect(await runStatement(
      app,
      'SELECT TOP (0) CAT_idSexo AS catalog_key FROM SIDINACC_LOCAL.dbo.CAF_CAT_SEXO'
    )).toEqual({ denied: true, number: 916 });

    await expectDatabaseRejected(
      { ...config.sia, database: 'SIDINACC_LOCAL' },
      timeouts,
      'sia-cencinai-boundary'
    );
  });
});
