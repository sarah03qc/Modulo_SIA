/*
SIA_CENCINAI — script pendiente 100_motivos_factor_riesgo

Responsable: Sarah Priscilla Quesada Chaves.
Fecha del script: 2026-11-17.
Ajuste de orden: 2026-11-18. Los tres motivos quedan en 18, 19 y 20
para ir después de Salud cuando se aplique el script 102.

NO EJECUTAR como parte de la cadena 001 a 090.
No inserta fila en dbo.schema_migracion.
No modifica referencias, ítems ni etiquetas ya guardadas.

Agrega, en la versión vigente de MOTIVO_REFERENCIA, los tres motivos que
RF-024, HU-013 CA-13 y CU-04 distinguen:
- Factor de riesgo individual
- Factor de riesgo hogar-familiar
- Factor de riesgo comunitario

No agrega las alternativas de Salud del prototipo que v0.7 no enumera.
Esas alternativas quedan NEEDS_VALIDATION.

Para aplicarlo en una instancia de desarrollo autorizada, cambie @permitir a 1.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51100, N'Script pendiente bloqueado. Cambie @permitir a 1 solo con autorización explícita.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.cat_version
    WHERE codigo_catalogo = N'MOTIVO_REFERENCIA'
      AND vigente = 1
)
    THROW 51101, N'No hay una versión vigente de MOTIVO_REFERENCIA.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.cat_item (
        cat_version_id, codigo_catalogo, codigo, etiqueta, orden, requiere_texto, ambito, activo
    )
    SELECT
        v.cat_version_id,
        N'MOTIVO_REFERENCIA',
        s.codigo,
        s.etiqueta,
        s.orden,
        0,
        s.ambito,
        1
    FROM dbo.cat_version AS v
    INNER JOIN (VALUES
        (N'FACTOR_RIESGO_INDIVIDUAL', N'Factor de riesgo individual', 18, N'INDIVIDUAL'),
        (N'FACTOR_RIESGO_HOGAR_FAMILIAR', N'Factor de riesgo hogar-familiar', 19, N'HOGAR_FAMILIAR'),
        (N'FACTOR_RIESGO_COMUNITARIO', N'Factor de riesgo comunitario', 20, N'COMUNITARIO')
    ) AS s (codigo, etiqueta, orden, ambito)
        ON v.codigo_catalogo = N'MOTIVO_REFERENCIA'
       AND v.vigente = 1
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.cat_item AS i
        WHERE i.cat_version_id = v.cat_version_id
          AND i.codigo = s.codigo
    );

    IF (
        SELECT COUNT(*)
        FROM dbo.cat_item AS i
        INNER JOIN dbo.cat_version AS v
            ON v.cat_version_id = i.cat_version_id
        WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
          AND v.vigente = 1
          AND i.codigo IN (
              N'FACTOR_RIESGO_INDIVIDUAL',
              N'FACTOR_RIESGO_HOGAR_FAMILIAR',
              N'FACTOR_RIESGO_COMUNITARIO'
          )
          AND i.activo = 1
    ) <> 3
        THROW 51102, N'Los tres motivos de factor de riesgo no quedaron activos.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
