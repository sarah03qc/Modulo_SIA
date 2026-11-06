/*
SIA_CENCINAI — migracion 010_core_schema
Tabla de ancla: dbo.vinculo_persona.
Identificador provisional nvarchar(20), sin FK hacia SIDINACC_LOCAL.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 010.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'010_core_schema' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'010_core_schema ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    CREATE TABLE dbo.vinculo_persona
    (
        per_id_persona nvarchar(20) NOT NULL,
        primera_operacion_en datetime2(0) NOT NULL,
        fila_version rowversion NOT NULL,
        CONSTRAINT PK_vinculo_persona PRIMARY KEY CLUSTERED (per_id_persona),
        CONSTRAINT CK_vinculo_persona_id CHECK (
            DATALENGTH(per_id_persona) = DATALENGTH(LTRIM(RTRIM(per_id_persona)))
            AND LEN(per_id_persona) > 0
        )
    );

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'010_core_schema', 10, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
