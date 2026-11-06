/*
SIA_CENCINAI — semilla 010_confirmed_catalogs

CLASIFICACION: CONFIRMED, salvo la nota de region_id.
No incluye datos de prueba ni catalogos no escritos en v0.7.

Codigos confirmados:
- Via, origen y motivos: RF-022 / RF-024 y el diseno seleccionado.
- Cierre, frecuencia y tipos de programacion: diseno seleccionado, seccion 5.2.
- Nueve filas de RN-009: FUNCTIONAL_SPEC_v0.7.
- Codigos DR CS, HN, CH, HC, BR, CN, PC, CO, CE: RF-114.

region_id 1..9 sigue el orden de la replica local (Central Sur = 1 ... Central Este = 9).
Ese mapa es NEEDS_VALIDATION. No hay FK desde la referencia ni desde el caso.
El servicio solo usa el conjunto de codigos para el segmento DR.

vigente_desde = 2026-11-05 es la fecha de linea base de esta semilla, no un acto institucional distinto.

Para ejecutar en una instancia aislada ya migrada, cambie @permitir a 1.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51020, N'Semilla confirmada bloqueada. Cambie @permitir a 1 solo en una instancia de desarrollo autorizada.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'090_constraints_and_indexes' AND estado = N'APLICADA'
)
    THROW 51021, N'La migracion 090 no esta aplicada.', 1;

DECLARE @desde date = '20261105';

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.cat_version (codigo_catalogo, numero_version, vigente, vigente_desde)
    SELECT v.codigo_catalogo, 1, 1, @desde
    FROM (VALUES
        (N'VIA_ATENCION'),
        (N'ORIGEN_REFERENCIA'),
        (N'MOTIVO_REFERENCIA'),
        (N'MOTIVO_CIERRE'),
        (N'FRECUENCIA'),
        (N'TIPO_ACTIVIDAD_PROGRAMADA'),
        (N'MATRIZ_PRIORIDAD')
    ) AS v (codigo_catalogo)
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.cat_version AS c
        WHERE c.codigo_catalogo = v.codigo_catalogo
          AND c.numero_version = 1
    );

    INSERT INTO dbo.cat_item (
        cat_version_id, codigo_catalogo, codigo, etiqueta, orden, requiere_texto, ambito, activo
    )
    SELECT c.cat_version_id, c.codigo_catalogo, s.codigo, s.etiqueta, s.orden, s.requiere_texto, NULL, 1
    FROM dbo.cat_version AS c
    INNER JOIN (VALUES
        (N'VIA_ATENCION', N'URGENCIA', N'Urgencia', 1, 0),
        (N'VIA_ATENCION', N'NO_INMEDIATA', N'No inmediata', 2, 0),
        (N'ORIGEN_REFERENCIA', N'VIGILANCIA_TAMIZAJE', N'Vigilancia / tamizaje', 1, 0),
        (N'ORIGEN_REFERENCIA', N'OBSERVACION', N'Observaci' + NCHAR(243) + N'n', 2, 0),
        (N'ORIGEN_REFERENCIA', N'INFORMACION_FAMILIA_U_OTROS', N'Informaci' + NCHAR(243) + N'n aportada por la familia u otros', 3, 0),
        (N'ORIGEN_REFERENCIA', N'REFERENCIA_EXTERNA', N'Referencia externa', 4, 0),
        (N'MOTIVO_REFERENCIA', N'CONDICION_MALNUTRICION', N'Condici' + NCHAR(243) + N'n de malnutrici' + NCHAR(243) + N'n', 1, 0),
        (N'MOTIVO_REFERENCIA', N'MALNUTRICION_NECESIDADES_ESPECIALES', N'Malnutrici' + NCHAR(243) + N'n con necesidades especiales', 2, 0),
        (N'MOTIVO_REFERENCIA', N'EDIN_II_RIESGO_RETRASO_ROJO', N'EDIN II: riesgo de retraso (rojo)', 3, 0),
        (N'MOTIVO_REFERENCIA', N'EVADE_RIESGO_REZAGO_0_1', N'EVADE: riesgo de rezago (0,1 sin logro de edad anterior)', 4, 0),
        (N'MOTIVO_REFERENCIA', N'OTRA_CONDICION_SALUD', N'Otra condici' + NCHAR(243) + N'n de salud', 5, 0),
        (N'MOTIVO_CIERRE', N'CIERRE_SATISFACTORIO', N'Cierre satisfactorio', 1, 0),
        (N'MOTIVO_CIERRE', N'TRASLADO', N'Traslado', 2, 0),
        (N'MOTIVO_CIERRE', N'OTRO', N'Otro', 3, 1),
        (N'FRECUENCIA', N'TRIMESTRAL', N'Trimestral', 1, 0),
        (N'FRECUENCIA', N'SEMESTRAL', N'Semestral', 2, 0),
        (N'FRECUENCIA', N'SEGUN_NECESIDAD', N'Seg' + NCHAR(250) + N'n necesidad', 3, 0),
        (N'TIPO_ACTIVIDAD_PROGRAMADA', N'SESION_INTERDISCIPLINARIA', N'Sesi' + NCHAR(243) + N'n interdisciplinaria', 1, 0),
        (N'TIPO_ACTIVIDAD_PROGRAMADA', N'VISITA_ESTABLECIMIENTO_AI', N'Visita a establecimiento de A.I.', 2, 0)
    ) AS s (codigo_catalogo, codigo, etiqueta, orden, requiere_texto)
        ON s.codigo_catalogo = c.codigo_catalogo
       AND c.numero_version = 1
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.cat_item AS i
        WHERE i.cat_version_id = c.cat_version_id
          AND i.codigo = s.codigo
    );

    INSERT INTO dbo.cat_matriz_prioridad (
        matriz_version_id, codigo_catalogo, riesgo_codigo, proteccion_codigo, prioridad_codigo
    )
    SELECT c.cat_version_id, N'MATRIZ_PRIORIDAD', m.riesgo_codigo, m.proteccion_codigo, m.prioridad_codigo
    FROM dbo.cat_version AS c
    CROSS JOIN (VALUES
        (N'ALTO', N'BAJA', N'ALTO'),
        (N'ALTO', N'MODERADA', N'ALTO'),
        (N'ALTO', N'ALTA', N'MODERADO'),
        (N'MODERADO', N'BAJA', N'ALTO'),
        (N'MODERADO', N'MODERADA', N'MODERADO'),
        (N'MODERADO', N'ALTA', N'MODERADO'),
        (N'BAJO', N'BAJA', N'MODERADO'),
        (N'BAJO', N'MODERADA', N'BAJO'),
        (N'BAJO', N'ALTA', N'BAJO')
    ) AS m (riesgo_codigo, proteccion_codigo, prioridad_codigo)
    WHERE c.codigo_catalogo = N'MATRIZ_PRIORIDAD'
      AND c.numero_version = 1
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.cat_matriz_prioridad AS p
          WHERE p.matriz_version_id = c.cat_version_id
            AND p.riesgo_codigo = m.riesgo_codigo
            AND p.proteccion_codigo = m.proteccion_codigo
      );

    INSERT INTO dbo.cat_codigo_region_referencia (region_id, codigo)
    SELECT r.region_id, r.codigo
    FROM (VALUES
        (1, N'CS'),
        (2, N'HN'),
        (3, N'CH'),
        (4, N'HC'),
        (5, N'BR'),
        (6, N'CN'),
        (7, N'PC'),
        (8, N'CO'),
        (9, N'CE')
    ) AS r (region_id, codigo)
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.cat_codigo_region_referencia AS c
        WHERE c.codigo = r.codigo
    );

    IF (SELECT COUNT(*) FROM dbo.cat_matriz_prioridad) <> 9
        THROW 51022, N'La matriz RN-009 no quedo en nueve filas.', 1;

    IF (SELECT COUNT(*) FROM dbo.cat_codigo_region_referencia) <> 9
        THROW 51023, N'El conjunto DR confirmado no quedo en nueve codigos.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
