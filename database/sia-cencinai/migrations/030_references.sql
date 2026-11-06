/*
SIA_CENCINAI — migracion 030_references
Referencia enviada, contexto, motivos, impresion y posible referencia.
El consecutivo es manual. No hay tabla de secuencia ni IDENTITY sobre esa cadena.
La correspondencia del establecimiento (RF-115) no cabe en un CHECK: la resuelve el servicio.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 030.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'030_references' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'030_references ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.ref_referencia
    (
        referencia_id bigint IDENTITY(1, 1) NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        estado nvarchar(30) NOT NULL,
        fecha_referencia date NOT NULL,
        via_item_id bigint NOT NULL,
        via_catalogo nvarchar(40) NOT NULL,
        origen_item_id bigint NOT NULL,
        origen_catalogo nvarchar(40) NOT NULL,
        responsable_usuario nvarchar(128) NOT NULL,
        acciones_previas nvarchar(2000) NULL,
        resultados_previos nvarchar(2000) NULL,
        informacion_complementaria nvarchar(2000) NULL,
        origen_captura nvarchar(20) NOT NULL,
        plantilla_version nvarchar(40) NULL,
        consecutivo nvarchar(80) NOT NULL,
        establecimiento_id int NOT NULL,
        oficina_local_id int NOT NULL,
        region_id int NOT NULL,
        enviada_en datetime2(0) NOT NULL,
        enviada_por nvarchar(128) NOT NULL,
        creada_en datetime2(0) NOT NULL,
        creada_por nvarchar(128) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_ref_referencia PRIMARY KEY CLUSTERED (referencia_id),
        CONSTRAINT FK_ref_referencia_vinculo
            FOREIGN KEY (per_id_persona) REFERENCES dbo.vinculo_persona (per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ref_referencia_via
            FOREIGN KEY (via_item_id, via_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ref_referencia_origen
            FOREIGN KEY (origen_item_id, origen_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ref_referencia_estado CHECK (
            estado IN (N'PENDIENTE_REVISION', N'ADMITIDA_AI', N'NO_REQUIERE_AI')
        ),
        CONSTRAINT CK_ref_referencia_via_catalogo CHECK (via_catalogo = N'VIA_ATENCION'),
        CONSTRAINT CK_ref_referencia_origen_catalogo CHECK (origen_catalogo = N'ORIGEN_REFERENCIA'),
        CONSTRAINT CK_ref_referencia_origen_captura CHECK (origen_captura IN (N'MANUAL', N'PLANTILLA')),
        CONSTRAINT CK_ref_referencia_plantilla CHECK (
            origen_captura <> N'PLANTILLA'
            OR (
                plantilla_version IS NOT NULL
                AND LEN(LTRIM(RTRIM(plantilla_version))) > 0
            )
        ),
        CONSTRAINT CK_ref_referencia_ambito CHECK (
            establecimiento_id > 0
            AND oficina_local_id > 0
            AND region_id > 0
        ),
        CONSTRAINT CK_ref_referencia_usuarios CHECK (
            LEN(LTRIM(RTRIM(responsable_usuario))) > 0
            AND LEN(LTRIM(RTRIM(enviada_por))) > 0
            AND LEN(LTRIM(RTRIM(creada_por))) > 0
        ),
        CONSTRAINT CK_ref_referencia_consecutivo CHECK (
            DATALENGTH(consecutivo) = DATALENGTH(LTRIM(RTRIM(consecutivo)))
            AND consecutivo COLLATE Latin1_General_100_BIN2
                = UPPER(consecutivo COLLATE Latin1_General_100_CI_AS) COLLATE Latin1_General_100_BIN2
            AND consecutivo COLLATE Latin1_General_100_BIN2
                NOT LIKE N'%[^A-Z0-9-]%' COLLATE Latin1_General_100_BIN2
            AND LEFT(consecutivo, 16) COLLATE Latin1_General_100_BIN2
                LIKE N'DNCC-DR[A-Z][A-Z]-OL[0-9][0-9][0-9]-' COLLATE Latin1_General_100_BIN2
            AND SUBSTRING(consecutivo, 8, 2) COLLATE Latin1_General_100_BIN2
                IN (N'CS', N'HN', N'CH', N'HC', N'BR', N'CN', N'PC', N'CO', N'CE')
            AND (LEN(consecutivo) - LEN(REPLACE(consecutivo, N'-', N''))) = 6
            AND RIGHT(consecutivo, 13) COLLATE Latin1_General_100_BIN2
                LIKE N'-REF-[0-9][0-9][0-9]-20[0-9][0-9]' COLLATE Latin1_General_100_BIN2
            AND LEN(consecutivo) > 29
            AND SUBSTRING(consecutivo, 17, LEN(consecutivo) - 29) COLLATE Latin1_General_100_BIN2
                NOT LIKE N'%[^0-9]%' COLLATE Latin1_General_100_BIN2
        )
    );

    CREATE UNIQUE INDEX UX_ref_referencia_consecutivo
        ON dbo.ref_referencia (consecutivo);

    CREATE INDEX IX_ref_referencia_oficina_estado
        ON dbo.ref_referencia (oficina_local_id, estado, enviada_en);

    CREATE INDEX IX_ref_referencia_establecimiento_estado
        ON dbo.ref_referencia (establecimiento_id, estado);

    CREATE INDEX IX_ref_referencia_persona_estado
        ON dbo.ref_referencia (per_id_persona, estado);

    CREATE TABLE dbo.ref_contexto
    (
        referencia_id bigint NOT NULL,
        encargado_nombre nvarchar(200) NULL,
        relacion_encargado nvarchar(80) NULL,
        contacto nvarchar(80) NULL,
        direccion nvarchar(200) NULL,
        servicios_texto nvarchar(500) NULL,
        region_nombre nvarchar(200) NULL,
        oficina_local_nombre nvarchar(200) NULL,
        establecimiento_nombre nvarchar(200) NULL,
        edad_anios smallint NULL,
        fecha_nacimiento_informada date NULL,
        CONSTRAINT PK_ref_contexto PRIMARY KEY CLUSTERED (referencia_id),
        CONSTRAINT FK_ref_contexto_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ref_contexto_edad CHECK (edad_anios IS NULL OR (edad_anios >= 0 AND edad_anios <= 120))
    );

    CREATE TABLE dbo.ref_motivo
    (
        motivo_id bigint IDENTITY(1, 1) NOT NULL,
        referencia_id bigint NOT NULL,
        cat_item_id bigint NOT NULL,
        motivo_catalogo nvarchar(40) NOT NULL,
        especificacion nvarchar(1000) NULL,
        CONSTRAINT PK_ref_motivo PRIMARY KEY CLUSTERED (motivo_id),
        CONSTRAINT UQ_ref_motivo_referencia_item UNIQUE (referencia_id, cat_item_id),
        CONSTRAINT FK_ref_motivo_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ref_motivo_item
            FOREIGN KEY (cat_item_id, motivo_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ref_motivo_catalogo CHECK (motivo_catalogo = N'MOTIVO_REFERENCIA')
    );

    CREATE INDEX IX_ref_motivo_item
        ON dbo.ref_motivo (cat_item_id, referencia_id);

    CREATE TABLE dbo.ref_impresion
    (
        impresion_id bigint IDENTITY(1, 1) NOT NULL,
        referencia_id bigint NOT NULL,
        usuario nvarchar(128) NOT NULL,
        impresa_en datetime2(0) NOT NULL,
        CONSTRAINT PK_ref_impresion PRIMARY KEY CLUSTERED (impresion_id),
        CONSTRAINT FK_ref_impresion_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ref_impresion_usuario CHECK (LEN(LTRIM(RTRIM(usuario))) > 0)
    );

    CREATE TABLE dbo.ref_posible
    (
        posible_id bigint IDENTITY(1, 1) NOT NULL,
        per_id_persona nvarchar(20) NOT NULL,
        establecimiento_id int NOT NULL,
        oficina_local_id int NOT NULL,
        region_id int NOT NULL,
        criterio_codigo nvarchar(80) NOT NULL,
        fecha_deteccion date NOT NULL,
        id_externo nvarchar(80) NULL,
        sistema_origen nvarchar(40) NULL,
        estado nvarchar(30) NOT NULL,
        referencia_id bigint NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_ref_posible PRIMARY KEY CLUSTERED (posible_id),
        CONSTRAINT FK_ref_posible_vinculo
            FOREIGN KEY (per_id_persona) REFERENCES dbo.vinculo_persona (per_id_persona)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT FK_ref_posible_referencia
            FOREIGN KEY (referencia_id) REFERENCES dbo.ref_referencia (referencia_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION,
        CONSTRAINT CK_ref_posible_estado CHECK (estado IN (N'PENDIENTE', N'REFERENCIA_CREADA')),
        CONSTRAINT CK_ref_posible_ambito CHECK (
            establecimiento_id > 0
            AND oficina_local_id > 0
            AND region_id > 0
        ),
        CONSTRAINT CK_ref_posible_criterio CHECK (LEN(LTRIM(RTRIM(criterio_codigo))) > 0),
        CONSTRAINT CK_ref_posible_referencia_estado CHECK (
            (estado = N'PENDIENTE' AND referencia_id IS NULL)
            OR (estado = N'REFERENCIA_CREADA' AND referencia_id IS NOT NULL)
        )
    );

    CREATE UNIQUE INDEX UX_ref_posible_pendiente
        ON dbo.ref_posible (per_id_persona, criterio_codigo, establecimiento_id)
        WHERE estado = N'PENDIENTE';

    CREATE UNIQUE INDEX UX_ref_posible_referencia
        ON dbo.ref_posible (referencia_id)
        WHERE referencia_id IS NOT NULL;

    CREATE INDEX IX_ref_posible_oficina_estado
        ON dbo.ref_posible (oficina_local_id, estado, fecha_deteccion);

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'030_references', 30, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
