/*
SIA_CENCINAI — migracion 110_catalogos_y_expediente_operativo
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

Cambios aditivos para la ronda de correcciones del 2026-11-18:
- Catalogo MODALIDAD_COORDINACION (llamada, correo, reunion, seguimiento, intercambio formal).
  Se redefinen los CHECK de catalogo para admitir el codigo nuevo. No se borran filas.
- Texto de la estrategia "Otra" en la atencion individual y en el plan.
- Modalidad y observaciones de la coordinacion.
- Huella SHA-256 y tipo de contenido del documento, para evitar duplicados por caso.

No ejecuta DROP de tablas ni de columnas. No modifica filas existentes.
Revertir: eliminar las columnas e indice nuevos y restaurar los CHECK de 020.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 110.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'090_constraints_and_indexes' AND estado = N'APLICADA'
)
    THROW 51110, N'La migracion 090 no esta aplicada.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'110_catalogos_y_expediente_operativo' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'110_catalogos_y_expediente_operativo ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.cat_version DROP CONSTRAINT CK_cat_version_codigo;
    ALTER TABLE dbo.cat_version WITH CHECK ADD CONSTRAINT CK_cat_version_codigo CHECK (
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
            N'MODALIDAD_COORDINACION',
            N'TIPO_DOCUMENTO',
            N'MATRIZ_PRIORIDAD'
        )
    );

    ALTER TABLE dbo.cat_item DROP CONSTRAINT CK_cat_item_catalogo;
    ALTER TABLE dbo.cat_item WITH CHECK ADD CONSTRAINT CK_cat_item_catalogo CHECK (
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
            N'MODALIDAD_COORDINACION',
            N'TIPO_DOCUMENTO'
        )
    );

    ALTER TABLE dbo.ate_individual ADD estrategia_otra_texto nvarchar(300) NULL;
    ALTER TABLE dbo.caso_plan_estrategia ADD estrategia_otra_texto nvarchar(300) NULL;

    ALTER TABLE dbo.doc_coordinacion ADD
        modalidad_item_id bigint NULL,
        modalidad_catalogo nvarchar(40) NULL,
        observaciones nvarchar(2000) NULL;

    ALTER TABLE dbo.doc_documento ADD
        hash_sha256 char(64) NULL,
        tipo_contenido nvarchar(100) NULL;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'110_catalogos_y_expediente_operativo' AND estado = N'APLICADA'
)
    RETURN;

IF COL_LENGTH(N'dbo.doc_documento', N'hash_sha256') IS NULL
    THROW 51111, N'La primera parte de 110 no se aplico.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    EXEC (N'
    ALTER TABLE dbo.ate_individual WITH CHECK ADD CONSTRAINT CK_ate_individual_estrategia_otra
        CHECK (estrategia_otra_texto IS NULL OR LEN(LTRIM(RTRIM(estrategia_otra_texto))) > 0);
    ALTER TABLE dbo.caso_plan_estrategia WITH CHECK ADD CONSTRAINT CK_caso_plan_estrategia_otra
        CHECK (estrategia_otra_texto IS NULL OR LEN(LTRIM(RTRIM(estrategia_otra_texto))) > 0);
    ALTER TABLE dbo.doc_coordinacion WITH CHECK ADD
        CONSTRAINT FK_doc_coordinacion_modalidad
            FOREIGN KEY (modalidad_item_id, modalidad_catalogo)
            REFERENCES dbo.cat_item (cat_item_id, codigo_catalogo),
        CONSTRAINT CK_doc_coordinacion_modalidad CHECK (
            (modalidad_item_id IS NULL AND modalidad_catalogo IS NULL)
            OR (modalidad_item_id IS NOT NULL
                AND modalidad_catalogo = N''MODALIDAD_COORDINACION'')
        );
    ALTER TABLE dbo.doc_documento WITH CHECK ADD CONSTRAINT CK_doc_documento_hash
        CHECK (hash_sha256 IS NULL OR hash_sha256 NOT LIKE ''%[^0-9a-f]%'');
    CREATE UNIQUE INDEX UX_doc_documento_caso_hash
        ON dbo.doc_documento (caso_id, hash_sha256)
        WHERE hash_sha256 IS NOT NULL;
    ');

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'110_catalogos_y_expediente_operativo', 110, N'APLICADA',
            CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
