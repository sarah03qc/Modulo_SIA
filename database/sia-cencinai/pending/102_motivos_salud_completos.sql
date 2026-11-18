/*
SIA_CENCINAI — script pendiente 102_motivos_salud_completos

Responsable: Sarah Priscilla Quesada Chaves.
Fecha del script: 2026-11-18.

NO EJECUTAR como parte de la cadena 001 a 090.
No inserta fila en dbo.schema_migracion.
No modifica referencias, especificaciones ni etiquetas ya guardadas.
Solo ajusta el orden de presentación de ítems ya existentes.

Completa Salud con las doce opciones del prototipo aprobado, guía
sección 3.4, y deja «Otra condición de salud». Exige que el script 100
ya haya insertado los tres factores de riesgo. Al terminar, la versión
vigente de MOTIVO_REFERENCIA tiene 20 motivos activos, en este orden:

 1 Condición de malnutrición
 2 Malnutrición con necesidades especiales
 3 EDIN II: riesgo de retraso (rojo)
 4 EVADE: riesgo de rezago (0,1 sin logro de edad anterior)
 5 a 16 las doce condiciones de Salud nuevas
17 Otra condición de salud
18 Factor de riesgo individual
19 Factor de riesgo hogar-familiar
20 Factor de riesgo comunitario

No es una oficialización del catálogo de producción.
Para una base local de desarrollo autorizada, cambie @permitir a 1
en una copia de trabajo. No deje ese valor en el archivo del repositorio.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51200, N'Script pendiente bloqueado. Cambie @permitir a 1 solo con autorización explícita.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.cat_version
    WHERE codigo_catalogo = N'MOTIVO_REFERENCIA'
      AND vigente = 1
)
    THROW 51201, N'No hay una versión vigente de MOTIVO_REFERENCIA.', 1;

DECLARE @esperados TABLE (
    codigo nvarchar(80) NOT NULL,
    etiqueta nvarchar(300) NOT NULL,
    orden int NOT NULL,
    nuevo bit NOT NULL
);

INSERT INTO @esperados (codigo, etiqueta, orden, nuevo)
VALUES
    (N'CONDICION_MALNUTRICION', N'Condición de malnutrición', 1, 0),
    (N'MALNUTRICION_NECESIDADES_ESPECIALES', N'Malnutrición con necesidades especiales', 2, 0),
    (N'EDIN_II_RIESGO_RETRASO_ROJO', N'EDIN II: riesgo de retraso (rojo)', 3, 0),
    (N'EVADE_RIESGO_REZAGO_0_1', N'EVADE: riesgo de rezago (0,1 sin logro de edad anterior)', 4, 0),
    (N'ALTERACION_VISUAL', N'Alteración visual', 5, 1),
    (N'ALTERACION_AUDITIVA', N'Alteración auditiva', 6, 1),
    (N'ALTERACION_DEL_LENGUAJE', N'Alteración del lenguaje', 7, 1),
    (N'ALTERACION_MOTORA', N'Alteración motora', 8, 1),
    (N'ALTERACION_SALUD_ORAL', N'Alteración de salud oral', 9, 1),
    (N'ALERGIA_ALIMENTARIA', N'Alergia alimentaria', 10, 1),
    (N'ENFERMEDAD_CRONICA', N'Enfermedad crónica', 11, 1),
    (N'LACTANCIA_MATERNA_ALIMENTACION_COMPLEMENTARIA', N'Lactancia materna / alimentación complementaria', 12, 1),
    (N'TRASTORNO_ESPECIFICO_APRENDIZAJE', N'Trastorno específico del aprendizaje', 13, 1),
    (N'SOSPECHA_O_DIAGNOSTICO_TRASTORNO_NEURODESARROLLO', N'Sospecha o diagnóstico de trastorno del neurodesarrollo', 14, 1),
    (N'ALTERACIONES_EMOCIONALES', N'Alteraciones emocionales', 15, 1),
    (N'ALTERACIONES_CONDUCTUALES', N'Alteraciones conductuales', 16, 1),
    (N'OTRA_CONDICION_SALUD', N'Otra condición de salud', 17, 0),
    (N'FACTOR_RIESGO_INDIVIDUAL', N'Factor de riesgo individual', 18, 0),
    (N'FACTOR_RIESGO_HOGAR_FAMILIAR', N'Factor de riesgo hogar-familiar', 19, 0),
    (N'FACTOR_RIESGO_COMUNITARIO', N'Factor de riesgo comunitario', 20, 0);

IF (SELECT COUNT(*) FROM @esperados) <> 20
    THROW 51202, N'La lista aprobada no quedó en 20 motivos.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    IF (
        SELECT COUNT(*)
        FROM @esperados AS s
        INNER JOIN dbo.cat_item AS i
            ON i.codigo = s.codigo
           AND i.activo = 1
        INNER JOIN dbo.cat_version AS v
            ON v.cat_version_id = i.cat_version_id
        WHERE s.nuevo = 0
          AND v.codigo_catalogo = N'MOTIVO_REFERENCIA'
          AND v.vigente = 1
    ) <> 8
        THROW 51203, N'Faltan motivos previos. Ejecute el script 100 antes de este.', 1;

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
        NULL,
        1
    FROM dbo.cat_version AS v
    INNER JOIN @esperados AS s
        ON s.nuevo = 1
    WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
      AND v.vigente = 1
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.cat_item AS i
          WHERE i.cat_version_id = v.cat_version_id
            AND i.codigo = s.codigo
      );

    UPDATE i
    SET orden = s.orden
    FROM dbo.cat_item AS i
    INNER JOIN dbo.cat_version AS v
        ON v.cat_version_id = i.cat_version_id
    INNER JOIN @esperados AS s
        ON s.codigo = i.codigo
    WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
      AND v.vigente = 1
      AND i.orden <> s.orden;

    IF (
        SELECT COUNT(*)
        FROM dbo.cat_item AS i
        INNER JOIN dbo.cat_version AS v
            ON v.cat_version_id = i.cat_version_id
        INNER JOIN @esperados AS s
            ON s.codigo = i.codigo
        WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
          AND v.vigente = 1
          AND i.activo = 1
          AND i.etiqueta = s.etiqueta
          AND i.orden = s.orden
    ) <> 20
        THROW 51204, N'Los 20 motivos no quedaron activos, con su etiqueta y su orden.', 1;

    IF EXISTS (
        SELECT i.orden
        FROM dbo.cat_item AS i
        INNER JOIN dbo.cat_version AS v
            ON v.cat_version_id = i.cat_version_id
        WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
          AND v.vigente = 1
          AND i.activo = 1
        GROUP BY i.orden
        HAVING COUNT(*) > 1
    )
        THROW 51205, N'Hay dos motivos vigentes con el mismo orden.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
