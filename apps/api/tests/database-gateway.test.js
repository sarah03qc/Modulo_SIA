'use strict';

const { loadConfig } = require('../src/config/load-config');
const { createDatabaseGateway, createSqlClient, toMssqlConfig } = require('../src/infrastructure/database/sql-client');
const { assertInstitutionalRead } = require('../src/infrastructure/database/institutional-read');
const { validEnv } = require('./env-fixture');

describe('clientes SQL', () => {
  test('prepara dos configuraciones con base y aplicación distintas', () => {
    const config = loadConfig(validEnv());
    const timeouts = {
      connectionTimeoutMs: config.connectionTimeoutMs,
      requestTimeoutMs: config.requestTimeoutMs
    };
    const sia = toMssqlConfig({ ...config.sia, appName: 'sia-cencinai-api' }, timeouts, config.poolMax);
    const sidinacc = toMssqlConfig(
      { ...config.sidinacc, appName: 'sia-cencinai-sidinacc-adapter' },
      timeouts,
      config.poolMax
    );

    expect(sia.database).toBe('SIA_CENCINAI');
    expect(sidinacc.database).toBe('SIDINACC_LOCAL');
    expect(sia.options.appName).not.toBe(sidinacc.options.appName);
    expect(sia).not.toBe(sidinacc);
  });

  test('el cliente institucional rechaza escritura y SELECT * sin abrir conexión', async () => {
    const config = loadConfig(validEnv());
    const connectPool = jest.fn();
    const gateway = createDatabaseGateway(config, { connectPool });

    await expect(gateway.sidinacc.query('UPDATE dbo.ejemplo SET valor = 1')).rejects.toMatchObject({
      code: 'INFRASTRUCTURE_UNAVAILABLE'
    });
    await expect(gateway.sidinacc.query('SELECT * FROM dbo.ejemplo')).rejects.toMatchObject({
      code: 'INFRASTRUCTURE_UNAVAILABLE'
    });
    const blocked = [
      'SELECT 1 AS probe CREATE TABLE dbo.ejemplo (id int)',
      'SELECT 1 AS probe USE master',
      'SELECT 1 AS probe DENY SELECT ON SCHEMA::dbo TO public',
      'SELECT 1 AS probe DBCC CHECKDB',
      'SELECT 1 AS probe SELECT 2 AS other',
      'SELECT alias.* FROM dbo.ejemplo AS alias'
    ];
    for (const sqlText of blocked) {
      expect(() => assertInstitutionalRead(sqlText)).toThrow();
    }
    expect(() => assertInstitutionalRead('WITH cte AS (SELECT 1 AS n) SELECT n FROM cte')).not.toThrow();
    expect(connectPool).not.toHaveBeenCalled();
    expect(gateway.sia.writeFilterEnabled).toBe(false);
    expect(gateway.sidinacc.writeFilterEnabled).toBe(true);
    expect(() => assertInstitutionalRead("SELECT COUNT(*) AS total FROM sys.tables WHERE name = 'ejemplo'")).not.toThrow();
  });

  test('la transacción institucional rechaza una escritura antes de enviarla al motor', async () => {
    const config = loadConfig(validEnv());
    const rollback = jest.fn(async () => {});
    const client = createSqlClient({
      role: 'sidinacc',
      databaseName: config.sidinacc.database,
      writeFilterEnabled: true,
      mssqlConfig: {},
      connectPool: async () => ({ close: async () => {} }),
      beginTransaction: () => ({
        begin: async () => {},
        commit: async () => {},
        rollback
      })
    });
    await expect(client.withTransaction(async (transaction) => {
      await transaction.query('INSERT INTO dbo.ejemplo (valor) VALUES (1)');
    })).rejects.toMatchObject({ code: 'INFRASTRUCTURE_UNAVAILABLE' });
    expect(rollback).toHaveBeenCalledTimes(1);
  });

  test('un fallo de conexión no copia el mensaje del controlador a la respuesta de dominio', async () => {
    const config = loadConfig(validEnv());
    const gateway = createDatabaseGateway(config, {
      connectPool: async () => {
        const error = new Error('Login failed for user sa password=sia-secret-value');
        error.code = 'ELOGIN';
        throw error;
      }
    });

    await expect(gateway.sia.query('SELECT 1 AS probe')).rejects.toMatchObject({
      code: 'INFRASTRUCTURE_UNAVAILABLE',
      message: 'La dependencia de base de datos no está disponible.',
      driverCode: 'ELOGIN'
    });
  });
});
