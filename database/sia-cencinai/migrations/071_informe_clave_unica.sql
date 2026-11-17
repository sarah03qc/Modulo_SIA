/*
SIA_CENCINAI — migracion 071_informe_clave_unica
Indice unico para no duplicar un informe al reintentar la misma operacion.
No modifica filas existentes. No se ejecuta desde la API.
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-16.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51071, N'Falta dbo.schema_migracion. Ejecute 001 antes de 071.', 1;

IF OBJECT_ID(N'dbo.inf_informe', N'U') IS NULL
    THROW 51072, N'Falta dbo.inf_informe. Ejecute 070 antes de 071.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'071_informe_clave_unica' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'071_informe_clave_unica ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    IF NOT EXISTS (
        SELECT 1
        FROM sys.indexes
        WHERE name = N'UQ_inf_informe_clave'
          AND object_id = OBJECT_ID(N'dbo.inf_informe')
    )
    BEGIN
        CREATE UNIQUE INDEX UQ_inf_informe_clave
            ON dbo.inf_informe (oficina_local_id, clave_archivo)
            WHERE clave_archivo IS NOT NULL;
    END

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (
        N'071_informe_clave_unica',
        71,
        N'APLICADA',
        CAST(SYSUTCDATETIME() AS datetime2(0))
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
