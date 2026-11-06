/*
SIA_CENCINAI — migracion 001_database_prerequisites

Crea la base vacia, el esquema ops, el libro de versiones y los roles.
No crea tablas de dominio. No toca SIDINACC_LOCAL. No crea inicios de sesion,
contrasenas ni usuarios de Windows.

Ejecutar solo cuando se autorice una instancia aislada de desarrollo.
Este archivo no se ejecuta durante el diseno fisico.

Orden: primero este archivo, en autocommit, con un principal de despliegue.
No forma parte de la transaccion de las migraciones siguientes: CREATE DATABASE
no puede confirmarse dentro de una transaccion de usuario.
*/
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF DB_ID(N'SIA_CENCINAI') IS NULL
BEGIN
    CREATE DATABASE SIA_CENCINAI
        COLLATE Latin1_General_100_CI_AS;
END
ELSE
BEGIN
    PRINT N'SIA_CENCINAI ya existe. No se altera su collation ni sus archivos.';
END
GO

USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF EXISTS (
    SELECT 1
    FROM sys.databases
    WHERE name = N'SIA_CENCINAI'
      AND collation_name <> N'Latin1_General_100_CI_AS'
)
    THROW 51001, N'SIA_CENCINAI existe con una collation distinta de Latin1_General_100_CI_AS. No se continua.', 1;

DECLARE @aplicada bit = 0;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NOT NULL
BEGIN
    EXEC sys.sp_executesql
        N'SELECT @out = CASE WHEN EXISTS (
              SELECT 1
              FROM dbo.schema_migracion
              WHERE codigo = N''001_database_prerequisites''
                AND estado = N''APLICADA''
          ) THEN 1 ELSE 0 END;',
        N'@out bit OUTPUT',
        @out = @aplicada OUTPUT;
END

IF @aplicada = 1
BEGIN
    PRINT N'001_database_prerequisites ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    IF SCHEMA_ID(N'ops') IS NULL
        EXEC(N'CREATE SCHEMA ops AUTHORIZATION dbo;');

    IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    BEGIN
        CREATE TABLE dbo.schema_migracion
        (
            schema_migracion_id bigint IDENTITY(1, 1) NOT NULL,
            codigo nvarchar(80) NOT NULL,
            orden int NOT NULL,
            estado nvarchar(20) NOT NULL,
            aplicada_en datetime2(0) NOT NULL,
            CONSTRAINT PK_schema_migracion PRIMARY KEY CLUSTERED (schema_migracion_id),
            CONSTRAINT UQ_schema_migracion_codigo UNIQUE (codigo),
            CONSTRAINT UQ_schema_migracion_orden UNIQUE (orden),
            CONSTRAINT CK_schema_migracion_estado CHECK (estado = N'APLICADA'),
            CONSTRAINT CK_schema_migracion_orden CHECK (orden > 0)
        );
    END

    IF DATABASE_PRINCIPAL_ID(N'rol_aplicacion') IS NULL
        CREATE ROLE rol_aplicacion;
    IF DATABASE_PRINCIPAL_ID(N'rol_establecimiento') IS NULL
        CREATE ROLE rol_establecimiento;
    IF DATABASE_PRINCIPAL_ID(N'rol_lectura_regional') IS NULL
        CREATE ROLE rol_lectura_regional;
    IF DATABASE_PRINCIPAL_ID(N'rol_lectura_nacional') IS NULL
        CREATE ROLE rol_lectura_nacional;
    IF DATABASE_PRINCIPAL_ID(N'rol_catalogo') IS NULL
        CREATE ROLE rol_catalogo;
    IF DATABASE_PRINCIPAL_ID(N'rol_auditoria') IS NULL
        CREATE ROLE rol_auditoria;

    IF DATABASE_PRINCIPAL_ID(N'usuario_aplicacion') IS NULL
        CREATE USER usuario_aplicacion WITHOUT LOGIN;
    IF DATABASE_PRINCIPAL_ID(N'usuario_establecimiento') IS NULL
        CREATE USER usuario_establecimiento WITHOUT LOGIN;
    IF DATABASE_PRINCIPAL_ID(N'usuario_regional') IS NULL
        CREATE USER usuario_regional WITHOUT LOGIN;
    IF DATABASE_PRINCIPAL_ID(N'usuario_nacional') IS NULL
        CREATE USER usuario_nacional WITHOUT LOGIN;
    IF DATABASE_PRINCIPAL_ID(N'usuario_catalogo') IS NULL
        CREATE USER usuario_catalogo WITHOUT LOGIN;
    IF DATABASE_PRINCIPAL_ID(N'usuario_auditoria') IS NULL
        CREATE USER usuario_auditoria WITHOUT LOGIN;

    ALTER ROLE rol_aplicacion ADD MEMBER usuario_aplicacion;
    ALTER ROLE rol_establecimiento ADD MEMBER usuario_establecimiento;
    ALTER ROLE rol_lectura_regional ADD MEMBER usuario_regional;
    ALTER ROLE rol_lectura_nacional ADD MEMBER usuario_nacional;
    ALTER ROLE rol_catalogo ADD MEMBER usuario_catalogo;
    ALTER ROLE rol_auditoria ADD MEMBER usuario_auditoria;

    EXEC sys.sp_executesql
        N'INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
          VALUES (N''001_database_prerequisites'', 1, N''APLICADA'', CAST(SYSUTCDATETIME() AS datetime2(0)));';

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
