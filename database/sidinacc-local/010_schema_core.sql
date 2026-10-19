/*
  SIDINACC_LOCAL - 010_schema_core.sql
  DDL minimo de compatibilidad (proyeccion consumida por SIA, no tablas completas).
  Referencia: docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md secciones 5.2 a 5.13 y 14.

  - Idempotente: cada CREATE esta protegido. No elimina ni modifica la estructura de tablas
    existentes; en cada ejecucion reaplica el DENY del rol de lectura y agrega membresias de
    rol solo si faltan (operaciones idempotentes).
  - Las guardas de existencia (OBJECT_ID / sys.indexes) NO verifican la forma de una tabla o
    indice preexistente. TODO: si la estructura difiere de la spec, recrearla manualmente
    con aprobacion humana (este script nunca lo hace).
  - Las 12 tablas, columnas, tipos, nulabilidad, PK, FK, UQ, DEFAULT e indices
    reproducen exactamente la especificacion v0.1. No agregar nada fuera de ella.
  - TODO-UTIC: sustituir tipos y estructura cuando UTIC entregue el DDL institucional real.
*/
USE SIDINACC_LOCAL;
GO

IF DB_NAME() <> N'SIDINACC_LOCAL'
    THROW 50001, 'Este script solo debe ejecutarse sobre SIDINACC_LOCAL.', 1;
GO

-- Respaldo para SSMS: si la guarda anterior fallo, los lotes siguientes se compilan pero no se ejecutan.
IF DB_NAME() <> N'SIDINACC_LOCAL'
    SET NOEXEC ON;
GO

/* ---------------------------------------------------------------------------
   5.2 CAF_CAT_REGION
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_CAT_REGION', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_CAT_REGION (
        CAT_idRegion      int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        REG_nombre        varchar(200) NOT NULL, -- PROVISIONAL_TYPE (ficha del manual: tinyint) -- TODO-UTIC: validar tipo real contra DDL institucional
        REG_descripcion   varchar(200) NULL,
        BIT_eliminado     bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.3 CAF_CAT_OFICINA_LOCAL
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_CAT_OFICINA_LOCAL', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_CAT_OFICINA_LOCAL (
        CAT_idOficinaLocal int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        -- Relacion solo logica con CAF_CAT_REGION.CAT_idRegion (sin FK fisica: tinyint vs int); verificada por smoke tests.
        -- TODO-UTIC: validar tipo real contra DDL institucional
        CAT_idRegion       tinyint NOT NULL,
        OFL_nombre         varchar(200) NOT NULL, -- PROVISIONAL_TYPE -- TODO-UTIC: validar tipo real contra DDL institucional
        OFL_descripcion    varchar(200) NULL,
        BIT_eliminado      bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.4 RCS_ESTABLECIMIENTO
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.RCS_ESTABLECIMIENTO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RCS_ESTABLECIMIENTO (
        EST_idEstablecimiento int NOT NULL PRIMARY KEY,
        EST_descripcion       varchar(250) NULL,
        -- Relacion solo logica con CAF_CAT_OFICINA_LOCAL (el DDL de la spec no define FK); verificada por smoke tests.
        CAT_idOficinaLocal    int NOT NULL,
        EST_inActivo          bit NOT NULL,
        BIT_eliminado         bit NULL
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_RCS_ESTABLECIMIENTO_Oficina'
                 AND object_id = OBJECT_ID(N'dbo.RCS_ESTABLECIMIENTO'))
BEGIN
    CREATE INDEX IX_RCS_ESTABLECIMIENTO_Oficina
    ON dbo.RCS_ESTABLECIMIENTO (
        CAT_idOficinaLocal,
        EST_inActivo,
        BIT_eliminado
    );
END
GO

/* ---------------------------------------------------------------------------
   5.5 RCS_PERIODO
   TODO-UTIC: confirmar mecanismo institucional del periodo vigente;
   la app configura SIDINACC_PERIOD_ID de forma explicita.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.RCS_PERIODO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.RCS_PERIODO (
        RCS_idPeriodo        numeric(18,0) NOT NULL PRIMARY KEY,
        RCS_descripcion      varchar(100) NOT NULL,
        RCS_periodoAnterior  numeric(18,0) NULL,
        BIT_eliminado        bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.6 CAF_CAT_SEXO
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_CAT_SEXO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_CAT_SEXO (
        CAT_idSexo        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SNB_codigo        tinyint NOT NULL,
        SNB_descripcion   varchar(100) NULL,
        BIT_eliminado     bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.7 CAF_FAMILIA
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_FAMILIA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_FAMILIA (
        FAM_idFamilia  int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        BIT_eliminado  bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.8 CAF_FAMILIA_DETALLE
   Fuente preferida del establecimiento actual por periodo (spec seccion 6).
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_FAMILIA_DETALLE (
        FAD_idFamiliaDetalle        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FAM_idFamilia               int NOT NULL,
        FAD_inActiva                bit NULL,
        EST_idEstablecimientoActual int NULL,
        RCS_idPeriodo               numeric(18,0) NOT NULL,
        BIT_eliminado               bit NULL,

        CONSTRAINT FK_LOCAL_FAD_FAMILIA
            FOREIGN KEY (FAM_idFamilia)
            REFERENCES dbo.CAF_FAMILIA(FAM_idFamilia),

        CONSTRAINT FK_LOCAL_FAD_ESTABLECIMIENTO
            FOREIGN KEY (EST_idEstablecimientoActual)
            REFERENCES dbo.RCS_ESTABLECIMIENTO(EST_idEstablecimiento),

        CONSTRAINT FK_LOCAL_FAD_PERIODO
            FOREIGN KEY (RCS_idPeriodo)
            REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_CAF_FAMILIA_DETALLE_Periodo'
                 AND object_id = OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE'))
BEGIN
    CREATE INDEX IX_CAF_FAMILIA_DETALLE_Periodo
    ON dbo.CAF_FAMILIA_DETALLE (
        FAM_idFamilia,
        RCS_idPeriodo,
        FAD_inActiva,
        BIT_eliminado
    );
END
GO

/* ---------------------------------------------------------------------------
   5.9 CAF_PERSONA
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_PERSONA', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_PERSONA (
        -- Clave de integracion v0.1 (spec seccion 4).
        -- TODO-UTIC: confirmar PER_idPersona vs RCS_idPersona como clave oficial de interoperabilidad.
        -- No cambiar esta decision sin registrar una ADR.
        PER_idPersona       nvarchar(20) NOT NULL PRIMARY KEY,
        PER_beneficiario    varchar(2) NULL,
        PER_apellidoUno     varchar(50) NULL,
        PER_apellidoDos     varchar(50) NULL,
        PER_nombre          varchar(50) NULL,
        PER_fechaNacimiento datetime NULL,
        FAM_idFamilia       int NULL,
        CAT_idSexo          int NULL,
        BIT_eliminado       bit NULL,
        RCS_idPersona       int IDENTITY(1,1) NOT NULL,

        CONSTRAINT UQ_LOCAL_CAF_PERSONA_RCS
            UNIQUE (RCS_idPersona),

        CONSTRAINT FK_LOCAL_PERSONA_FAMILIA
            FOREIGN KEY (FAM_idFamilia)
            REFERENCES dbo.CAF_FAMILIA(FAM_idFamilia),

        CONSTRAINT FK_LOCAL_PERSONA_SEXO
            FOREIGN KEY (CAT_idSexo)
            REFERENCES dbo.CAF_CAT_SEXO(CAT_idSexo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_CAF_PERSONA_Nombre'
                 AND object_id = OBJECT_ID(N'dbo.CAF_PERSONA'))
BEGIN
    CREATE INDEX IX_CAF_PERSONA_Nombre
    ON dbo.CAF_PERSONA (
        PER_apellidoUno,
        PER_apellidoDos,
        PER_nombre
    );
END
GO

/* ---------------------------------------------------------------------------
   5.10 CAF_PERSONA_DETALLE
   SIA usa CAF_FAMILIA_DETALLE para la ubicacion institucional, no este campo.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_PERSONA_DETALLE', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_PERSONA_DETALLE (
        RCS_RCS_idRegistro          int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        PER_idPersona               nvarchar(20) NOT NULL,
        -- Relacion solo logica con RCS_ESTABLECIMIENTO (sin FK fisica: numeric(18,0) vs int); verificada por smoke tests.
        -- TODO-UTIC: validar tipo real contra DDL institucional
        EST_idEstablecimientoActual numeric(18,0) NULL,
        RCS_idPeriodo               numeric(18,0) NOT NULL,
        BIT_eliminado               bit NOT NULL DEFAULT 0,

        CONSTRAINT FK_LOCAL_PD_PERSONA
            FOREIGN KEY (PER_idPersona)
            REFERENCES dbo.CAF_PERSONA(PER_idPersona),

        CONSTRAINT FK_LOCAL_PD_PERIODO
            FOREIGN KEY (RCS_idPeriodo)
            REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
    );
END
GO

/* ---------------------------------------------------------------------------
   5.11 CAF_SERVICIO
   Sin SNB_codigo por decision de la spec (SIA no lo consume).
   TODO-UTIC: confirmar que CAF_SERVICIO corresponde a la modalidad que SIA debe mostrar.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_SERVICIO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_SERVICIO (
        SER_idServicio   int NOT NULL PRIMARY KEY,
        SER_descripcion  nvarchar(100) NOT NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.12 CAF_CAT_TIPO_CLIENTE
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_CAT_TIPO_CLIENTE', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_CAT_TIPO_CLIENTE (
        CAT_idTipoCliente int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SNB_codigo        tinyint NOT NULL,
        SNB_descripcion   varchar(100) NULL,
        BIT_eliminado     bit NULL
    );
END
GO

/* ---------------------------------------------------------------------------
   5.13 CAF_SERVICIO_CLIENTE
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_SERVICIO_CLIENTE', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_SERVICIO_CLIENTE (
        SEC_idRegistro     int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SER_idServicio     int NOT NULL,
        PER_idPersona      nvarchar(20) NOT NULL,
        CAT_idTipoCliente  int NOT NULL,
        RCS_idPeriodo      numeric(18,0) NOT NULL,
        SEC_mes            tinyint NOT NULL,
        -- tinyint segun la spec (no bit); se conserva tal cual.
        -- TODO-UTIC: validar tipo real contra DDL institucional
        BIT_eliminado      tinyint NULL,

        CONSTRAINT FK_LOCAL_SC_SERVICIO
            FOREIGN KEY (SER_idServicio)
            REFERENCES dbo.CAF_SERVICIO(SER_idServicio),

        CONSTRAINT FK_LOCAL_SC_PERSONA
            FOREIGN KEY (PER_idPersona)
            REFERENCES dbo.CAF_PERSONA(PER_idPersona),

        CONSTRAINT FK_LOCAL_SC_TIPO
            FOREIGN KEY (CAT_idTipoCliente)
            REFERENCES dbo.CAF_CAT_TIPO_CLIENTE(CAT_idTipoCliente),

        CONSTRAINT FK_LOCAL_SC_PERIODO
            FOREIGN KEY (RCS_idPeriodo)
            REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_CAF_SERVICIO_CLIENTE_PersonaPeriodo'
                 AND object_id = OBJECT_ID(N'dbo.CAF_SERVICIO_CLIENTE'))
BEGIN
    CREATE INDEX IX_CAF_SERVICIO_CLIENTE_PersonaPeriodo
    ON dbo.CAF_SERVICIO_CLIENTE (
        PER_idPersona,
        RCS_idPeriodo,
        SEC_mes,
        BIT_eliminado
    );
END
GO

/* ---------------------------------------------------------------------------
   Acceso de solo lectura (spec seccion 14, adaptada a rol + usuario).
   - Los logins reales se crean por entorno y se mapean como un usuario nuevo
     agregado a sia_sidinacc_reader_role. No hay contrasenas en el repositorio.
   - DENY ALTER es una adicion solicitada por el usuario, fuera de la seccion 14.
   --------------------------------------------------------------------------- */
IF DATABASE_PRINCIPAL_ID(N'sia_sidinacc_reader_role') IS NULL
BEGIN
    CREATE ROLE sia_sidinacc_reader_role;
END
GO

IF NOT EXISTS (SELECT 1
               FROM sys.database_role_members drm
               JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
               JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
               WHERE r.name = N'db_datareader'
                 AND m.name = N'sia_sidinacc_reader_role')
BEGIN
    ALTER ROLE db_datareader ADD MEMBER sia_sidinacc_reader_role;
END
GO

DENY INSERT, UPDATE, DELETE, ALTER TO sia_sidinacc_reader_role;
GO

IF DATABASE_PRINCIPAL_ID(N'sia_sidinacc_reader') IS NULL
BEGIN
    CREATE USER sia_sidinacc_reader WITHOUT LOGIN;
END
GO

IF NOT EXISTS (SELECT 1
               FROM sys.database_role_members drm
               JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
               JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
               WHERE r.name = N'sia_sidinacc_reader_role'
                 AND m.name = N'sia_sidinacc_reader')
BEGIN
    ALTER ROLE sia_sidinacc_reader_role ADD MEMBER sia_sidinacc_reader;
END
GO

SET NOEXEC OFF;
GO
