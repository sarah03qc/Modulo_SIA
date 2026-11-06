/*
SIA_CENCINAI — migracion 020_catalogs_and_configuration
Catalogos estructurales, matriz RN-009 e instrumento versionado.
No inserta valores. Las semillas estan en database/sia-cencinai/seeds/.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 020.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'020_catalogs_and_configuration' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'020_catalogs_and_configuration ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.cat_version
    (
        cat_version_id bigint IDENTITY(1, 1) NOT NULL,
        codigo_catalogo nvarchar(40) NOT NULL,
        numero_version int NOT NULL,
        vigente bit NOT NULL,
        vigente_desde date NOT NULL,
        CONSTRAINT PK_cat_version PRIMARY KEY CLUSTERED (cat_version_id),
        CONSTRAINT UQ_cat_version_codigo_numero UNIQUE (codigo_catalogo, numero_version),
        CONSTRAINT UQ_cat_version_id_codigo UNIQUE (cat_version_id, codigo_catalogo),
        CONSTRAINT CK_cat_version_numero CHECK (numero_version >= 1),
        CONSTRAINT CK_cat_version_codigo CHECK (
            codigo_catalogo IN (
                N'VIA_ATENCION',
                N'ORIGEN_REFERENCIA',
                N'MOTIVO_REFERENCIA',
                N'DISCIPLINA',
                N'ESTRATEGIA',
                N'FRECUENCIA',
                N'TIPO_ACTIVIDAD_PROGRAMADA',
                N'TIPO_ATENCION',
                N'MOTIVO_CIERRE',
                N'INSTITUCION_COORDINACION',
                N'ESTADO_COORDINACION',
                N'TIPO_DOCUMENTO',
                N'MATRIZ_PRIORIDAD'
            )
        )
    );

    CREATE UNIQUE INDEX UX_cat_version_vigente
        ON dbo.cat_version (codigo_catalogo)
        WHERE vigente = 1;

    CREATE TABLE dbo.cat_item
    (
        cat_item_id bigint IDENTITY(1, 1) NOT NULL,
        cat_version_id bigint NOT NULL,
        codigo_catalogo nvarchar(40) NOT NULL,
        codigo nvarchar(80) NOT NULL,
        etiqueta nvarchar(300) NOT NULL,
        orden int NOT NULL,
        requiere_texto bit NOT NULL,
        ambito nvarchar(40) NULL,
        activo bit NOT NULL,
        CONSTRAINT PK_cat_item PRIMARY KEY CLUSTERED (cat_item_id),
        CONSTRAINT UQ_cat_item_version_codigo UNIQUE (cat_version_id, codigo),
        CONSTRAINT UQ_cat_item_id_catalogo UNIQUE (cat_item_id, codigo_catalogo),
        CONSTRAINT UQ_cat_item_ampliada UNIQUE (cat_item_id, codigo_catalogo, codigo, requiere_texto),
        CONSTRAINT FK_cat_item_version
            FOREIGN KEY (cat_version_id, codigo_catalogo)
            REFERENCES dbo.cat_version (cat_version_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_cat_item_orden CHECK (orden >= 0),
        CONSTRAINT CK_cat_item_codigo CHECK (
            DATALENGTH(codigo) = DATALENGTH(LTRIM(RTRIM(codigo)))
            AND LEN(codigo) > 0
        ),
        CONSTRAINT CK_cat_item_etiqueta CHECK (LEN(LTRIM(RTRIM(etiqueta))) > 0),
        CONSTRAINT CK_cat_item_catalogo CHECK (
            codigo_catalogo IN (
                N'VIA_ATENCION',
                N'ORIGEN_REFERENCIA',
                N'MOTIVO_REFERENCIA',
                N'DISCIPLINA',
                N'ESTRATEGIA',
                N'FRECUENCIA',
                N'TIPO_ACTIVIDAD_PROGRAMADA',
                N'TIPO_ATENCION',
                N'MOTIVO_CIERRE',
                N'INSTITUCION_COORDINACION',
                N'ESTADO_COORDINACION',
                N'TIPO_DOCUMENTO'
            )
        )
    );

    CREATE TABLE dbo.cat_matriz_prioridad
    (
        matriz_version_id bigint NOT NULL,
        codigo_catalogo nvarchar(40) NOT NULL,
        riesgo_codigo nvarchar(20) NOT NULL,
        proteccion_codigo nvarchar(20) NOT NULL,
        prioridad_codigo nvarchar(20) NOT NULL,
        CONSTRAINT PK_cat_matriz_prioridad
            PRIMARY KEY CLUSTERED (matriz_version_id, riesgo_codigo, proteccion_codigo),
        CONSTRAINT UQ_cat_matriz_prioridad_completa
            UNIQUE (matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo),
        CONSTRAINT FK_cat_matriz_prioridad_version
            FOREIGN KEY (matriz_version_id, codigo_catalogo)
            REFERENCES dbo.cat_version (cat_version_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_cat_matriz_prioridad_catalogo CHECK (codigo_catalogo = N'MATRIZ_PRIORIDAD'),
        CONSTRAINT CK_cat_matriz_prioridad_riesgo CHECK (riesgo_codigo IN (N'ALTO', N'MODERADO', N'BAJO')),
        CONSTRAINT CK_cat_matriz_prioridad_proteccion CHECK (proteccion_codigo IN (N'ALTA', N'MODERADA', N'BAJA')),
        CONSTRAINT CK_cat_matriz_prioridad_prioridad CHECK (prioridad_codigo IN (N'ALTO', N'MODERADO', N'BAJO'))
    );

    CREATE TABLE dbo.cat_instrumento_version
    (
        instrumento_version_id bigint IDENTITY(1, 1) NOT NULL,
        numero_version int NOT NULL,
        vigente bit NOT NULL,
        vigente_desde date NOT NULL,
        CONSTRAINT PK_cat_instrumento_version PRIMARY KEY CLUSTERED (instrumento_version_id),
        CONSTRAINT UQ_cat_instrumento_version_numero UNIQUE (numero_version),
        CONSTRAINT CK_cat_instrumento_version_numero CHECK (numero_version >= 1)
    );

    CREATE TABLE dbo.cat_instrumento_categoria
    (
        categoria_id bigint IDENTITY(1, 1) NOT NULL,
        instrumento_version_id bigint NOT NULL,
        eje nvarchar(20) NOT NULL,
        ambito nvarchar(20) NOT NULL,
        es_requerida bit NOT NULL,
        orden int NOT NULL,
        CONSTRAINT PK_cat_instrumento_categoria PRIMARY KEY CLUSTERED (categoria_id),
        CONSTRAINT UQ_cat_instrumento_categoria_eje
            UNIQUE (instrumento_version_id, eje, ambito),
        CONSTRAINT UQ_cat_instrumento_categoria_version
            UNIQUE (categoria_id, instrumento_version_id),
        CONSTRAINT FK_cat_instrumento_categoria_version
            FOREIGN KEY (instrumento_version_id)
            REFERENCES dbo.cat_instrumento_version (instrumento_version_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_cat_instrumento_categoria_eje CHECK (eje IN (N'PROTECTOR', N'RIESGO', N'SIGNO_ALERTA')),
        CONSTRAINT CK_cat_instrumento_categoria_ambito CHECK (ambito IN (N'INDIVIDUAL', N'HOGAR_FAMILIAR', N'COMUNITARIO')),
        CONSTRAINT CK_cat_instrumento_categoria_orden CHECK (orden >= 0)
    );

    CREATE TABLE dbo.cat_instrumento_factor
    (
        factor_id bigint IDENTITY(1, 1) NOT NULL,
        categoria_id bigint NOT NULL,
        codigo nvarchar(80) NOT NULL,
        etiqueta nvarchar(300) NOT NULL,
        es_abierto bit NOT NULL,
        orden int NOT NULL,
        activo bit NOT NULL,
        CONSTRAINT PK_cat_instrumento_factor PRIMARY KEY CLUSTERED (factor_id),
        CONSTRAINT UQ_cat_instrumento_factor_codigo UNIQUE (categoria_id, codigo),
        CONSTRAINT UQ_cat_instrumento_factor_categoria UNIQUE (factor_id, categoria_id),
        CONSTRAINT FK_cat_instrumento_factor_categoria
            FOREIGN KEY (categoria_id)
            REFERENCES dbo.cat_instrumento_categoria (categoria_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_cat_instrumento_factor_codigo CHECK (
            DATALENGTH(codigo) = DATALENGTH(LTRIM(RTRIM(codigo)))
            AND LEN(codigo) > 0
        ),
        CONSTRAINT CK_cat_instrumento_factor_etiqueta CHECK (LEN(LTRIM(RTRIM(etiqueta))) > 0),
        CONSTRAINT CK_cat_instrumento_factor_orden CHECK (orden >= 0)
    );

    CREATE TABLE dbo.cat_codigo_region_referencia
    (
        region_id int NOT NULL,
        codigo nvarchar(2) NOT NULL,
        CONSTRAINT PK_cat_codigo_region_referencia PRIMARY KEY CLUSTERED (region_id),
        CONSTRAINT UQ_cat_codigo_region_referencia_codigo UNIQUE (codigo),
        CONSTRAINT CK_cat_codigo_region_referencia_id CHECK (region_id > 0),
        CONSTRAINT CK_cat_codigo_region_referencia_codigo CHECK (
            codigo IN (N'CS', N'HN', N'CH', N'HC', N'BR', N'CN', N'PC', N'CO', N'CE')
        )
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'020_catalogs_and_configuration', 20, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
