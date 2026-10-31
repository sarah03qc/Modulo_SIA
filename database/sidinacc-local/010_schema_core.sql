/*
  SIDINACC_LOCAL - 010_schema_core.sql
  DDL minimo de compatibilidad (proyeccion consumida por SIA, no tablas completas).
  Referencia base: docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md secciones 5.2 a 5.13 y 14.
  Ampliacion de superficie (menor, direccion/contacto familiar, evaluacion nutricional,
  indicador antropometrico): tipos y nulabilidad tomados de
  docs/architecture/SIDINACC_CAH_DATABASE_ANALYSIS.md (fichas A.25, A.27, A.29, A.30).
  NEEDS_VALIDATION: la spec v0.1 aun excluye CAF_MENOR, CAF_EVALUACION_MENOR y
  CAF_INDICADOR_ANTROPOMETRICO y no declara FAD_direccion / FAD_telefonoUno / FAD_telefonoDos.
  Esta ampliacion no reescribe esa spec. No es DDL productivo.

  - Idempotente: cada CREATE esta protegido. No elimina tablas.
  - Si CAF_FAMILIA_DETALLE ya existe, solo agrega las columnas de direccion y telefono
    cuando faltan (ALTER ADD, nullable). No reescribe filas.
  - Las guardas de existencia NO verifican el resto de la forma de una tabla preexistente.
    Si la PK o los indices difieren, recrear SIDINACC_LOCAL manualmente.
  - TODO-UTIC: sustituir tipos y estructura cuando UTIC entregue el DDL institucional real.
  - No se crean tablas EDIN II / EVADE. No se incluye MEN_rezagoDesarrollo.
  - No se almacenan datos propios de Atencion Interdisciplinaria.
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
   FAD_direccion, FAD_telefonoUno y FAD_telefonoDos: ficha CAH (analisis A.27).
   Son contexto familiar del periodo, no telefonos personales exclusivos del encargado.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_FAMILIA_DETALLE (
        FAD_idFamiliaDetalle        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
        FAM_idFamilia               int NOT NULL,
        FAD_direccion               varchar(100) NULL,
        FAD_telefonoUno             numeric(18,0) NULL,
        FAD_telefonoDos             numeric(18,0) NULL,
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

/* Columnas aditivas si la tabla ya existia sin direccion/telefono. No actualiza filas. */
IF OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CAF_FAMILIA_DETALLE', N'FAD_direccion') IS NULL
    ALTER TABLE dbo.CAF_FAMILIA_DETALLE ADD FAD_direccion varchar(100) NULL;
GO

IF OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CAF_FAMILIA_DETALLE', N'FAD_telefonoUno') IS NULL
    ALTER TABLE dbo.CAF_FAMILIA_DETALLE ADD FAD_telefonoUno numeric(18,0) NULL;
GO

IF OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NOT NULL
   AND COL_LENGTH(N'dbo.CAF_FAMILIA_DETALLE', N'FAD_telefonoDos') IS NULL
    ALTER TABLE dbo.CAF_FAMILIA_DETALLE ADD FAD_telefonoDos numeric(18,0) NULL;
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
   CAF_MENOR
   Proyeccion minima para resolver madre, padre, encargado y periodo.
   Tipos: ficha CAH (analisis A.30). No se copian poblacion, condicion de nacer,
   referencia CAH, rezago ni auditoria: SIA no los consume en esta superficie.
   MEN_rezagoDesarrollo NO se incluye y NO equivale a EDIN II ni a EVADE.
   FK_LOCAL_*: constraint local de la replica. La ficha marca Fk hacia persona y
   periodo, pero no desambigua un nombre fisico por columna. No se usan nombres
   institucionales de FK.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_MENOR', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_MENOR (
        MEN_idRegistroMenor int NOT NULL PRIMARY KEY, -- TODO-UTIC: la ficha lo marca identity; el mock asigna el id
        PER_idPersona       nvarchar(20) NOT NULL,
        MEN_idMadre         nvarchar(20) NULL,
        MEN_idPadre         nvarchar(20) NULL,
        MEN_idEncargado     nvarchar(20) NOT NULL,
        RCS_idPeriodo       numeric(18,0) NOT NULL,
        BIT_eliminado       bit NULL,

        CONSTRAINT FK_LOCAL_MENOR_PERSONA
            FOREIGN KEY (PER_idPersona)
            REFERENCES dbo.CAF_PERSONA (PER_idPersona),

        CONSTRAINT FK_LOCAL_MENOR_MADRE
            FOREIGN KEY (MEN_idMadre)
            REFERENCES dbo.CAF_PERSONA (PER_idPersona),

        CONSTRAINT FK_LOCAL_MENOR_PADRE
            FOREIGN KEY (MEN_idPadre)
            REFERENCES dbo.CAF_PERSONA (PER_idPersona),

        CONSTRAINT FK_LOCAL_MENOR_ENCARGADO
            FOREIGN KEY (MEN_idEncargado)
            REFERENCES dbo.CAF_PERSONA (PER_idPersona),

        CONSTRAINT FK_LOCAL_MENOR_PERIODO
            FOREIGN KEY (RCS_idPeriodo)
            REFERENCES dbo.RCS_PERIODO (RCS_idPeriodo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_CAF_MENOR_PersonaPeriodo'
                 AND object_id = OBJECT_ID(N'dbo.CAF_MENOR'))
BEGIN
    CREATE INDEX IX_CAF_MENOR_PersonaPeriodo
    ON dbo.CAF_MENOR (
        PER_idPersona,
        RCS_idPeriodo
    );
END
GO

/* ---------------------------------------------------------------------------
   CAF_EVALUACION_MENOR
   Resultados nutricionales ya registrados. SIA no recalcula PE/PT/TE/IMC.
   PROVISIONAL_KEY / TODO-UTIC:
   La ficha (analisis A.25) marca PER_idPersona como PK y EVM_idEvaluacionMenor
   como identity no-PK. Esa PK no admite varias evaluaciones por persona.
   La replica usa EVM_idEvaluacionMenor como PK local solo para el mock.
   NEEDS_VALIDATION: SIDINACC_LOCAL_REPLICA_SPEC.md v0.1 no documenta esta decision.
   No hay FK hacia CAF_INDICADOR_ANTROPOMETRICO: la ficha no la demuestra.
   No se replican peso, talla, edad ni auditoria.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_EVALUACION_MENOR (
        EVM_idEvaluacionMenor    int NOT NULL PRIMARY KEY, -- PROVISIONAL_KEY / TODO-UTIC
        PER_idPersona            nvarchar(20) NOT NULL,
        EVM_fechaEvaluacion      datetime NOT NULL,
        RCS_idPeriodo            numeric(18,0) NOT NULL,
        EVM_estadoNutricionalPe  tinyint NULL,
        EVM_estadoNutricionalPt  tinyint NULL,
        EVM_estadoNutricionalTe  tinyint NULL,
        EVM_estadoNutricionalImc tinyint NULL,
        BIT_eliminado            bit NULL,

        CONSTRAINT FK_LOCAL_EVM_PERSONA
            FOREIGN KEY (PER_idPersona)
            REFERENCES dbo.CAF_PERSONA (PER_idPersona),

        CONSTRAINT FK_LOCAL_EVM_PERIODO
            FOREIGN KEY (RCS_idPeriodo)
            REFERENCES dbo.RCS_PERIODO (RCS_idPeriodo)
    );
END
GO

IF NOT EXISTS (SELECT 1 FROM sys.indexes
               WHERE name = N'IX_CAF_EVALUACION_MENOR_PersonaPeriodoFecha'
                 AND object_id = OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR'))
BEGIN
    CREATE INDEX IX_CAF_EVALUACION_MENOR_PersonaPeriodoFecha
    ON dbo.CAF_EVALUACION_MENOR (
        PER_idPersona,
        RCS_idPeriodo,
        EVM_fechaEvaluacion
    );
END
GO

/* ---------------------------------------------------------------------------
   CAF_INDICADOR_ANTROPOMETRICO
   Catalogo de area / clasificacion / nomenclatura (analisis A.29).
   La ficha no declara FK. El seed es MOCK_ONLY, no catalogo oficial.
   --------------------------------------------------------------------------- */
IF OBJECT_ID(N'dbo.CAF_INDICADOR_ANTROPOMETRICO', N'U') IS NULL
BEGIN
    CREATE TABLE dbo.CAF_INDICADOR_ANTROPOMETRICO (
        ANT_id             int NOT NULL PRIMARY KEY, -- TODO-UTIC: la ficha lo marca identity
        ANT_area           char(3) NULL,
        ANT_clasificacion  nvarchar(50) NULL,
        ANT_nomenclatura   nchar(6) NULL,
        BIT_eliminado      bit NULL
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
