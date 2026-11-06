/*
SIA_CENCINAI — cobertura territorial sintetica.

CLASIFICACION: SYNTHETIC. No es actividad institucional ni una prevalencia.
Continua el generador de seeds/030_synthetic_scale.sql. Semilla 20261105.

Lee la jerarquia Region -> Oficina Local -> Establecimiento y las personas SYN-
de SIDINACC_LOCAL. Escribe solo en SIA_CENCINAI. No ejecuta INSERT, UPDATE,
DELETE, TRUNCATE, DROP ni ALTER sobre SIDINACC_LOCAL.

Objetivo de prueba: un caso de Atencion Interdisciplinaria por establecimiento
activo que ya tiene al menos una persona sintetica elegible. Si el
establecimiento no tiene una persona sin caso activo, no se inventa una
identidad y el script se detiene.

No reabre ni modifica casos ya validos. No crea un segundo caso activo para
la misma persona. El consecutivo es un fixture de prueba: continua el sufijo
de tres digitos ya guardado para ese establecimiento y el anio 2025. No hay
tabla contador ni cambio de RF-114.

El codigo DR del fixture sale de dbo.cat_codigo_region_referencia, el mismo
catalogo provisional de la semilla 010. Ese mapa region_id -> DR sigue en
NEEDS_VALIDATION. Los identificadores de region, oficina y establecimiento
salen de la replica, no de una equivalencia nueva.

EST_inActivo = 1 se toma como activo porque asi esta construida la replica
local (DESC_ESTADO = ACTIVO). La semantica del DDL institucional sigue en
NEEDS_VALIDATION. No se abren casos en establecimientos con EST_inActivo = 0.

Si no queda ningun establecimiento elegible sin caso, termina sin escribir.
Poner @permitir_cobertura = 1 solo en la base local de desarrollo.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir_cobertura bit = 0;
DECLARE @semilla int = 20261105;

IF @permitir_cobertura <> 1
    THROW 51080, N'Cobertura territorial bloqueada. Cambie @permitir_cobertura a 1 solo en desarrollo.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'090_constraints_and_indexes' AND estado = N'APLICADA'
)
    THROW 51062, N'La migracion 090 no esta aplicada.', 1;

DECLARE @inst bigint = (
    SELECT instrumento_version_id FROM dbo.cat_instrumento_version WHERE numero_version = 1
);
DECLARE @cat_prot bigint = (
    SELECT categoria_id FROM dbo.cat_instrumento_categoria
    WHERE instrumento_version_id = @inst AND eje = N'PROTECTOR'
);
DECLARE @cat_riesgo bigint = (
    SELECT categoria_id FROM dbo.cat_instrumento_categoria
    WHERE instrumento_version_id = @inst AND eje = N'RIESGO'
);
DECLARE @fac_prot bigint = (
    SELECT factor_id FROM dbo.cat_instrumento_factor WHERE codigo = N'SYN_PROT_01'
);
DECLARE @fac_riesgo bigint = (
    SELECT factor_id FROM dbo.cat_instrumento_factor WHERE codigo = N'SYN_RIESGO_01'
);
DECLARE @disc bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'DISCIPLINA' AND codigo = N'SYN_NUTRICION'
);
DECLARE @disc2 bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'DISCIPLINA' AND codigo = N'SYN_TRABAJO_SOCIAL'
);
DECLARE @estr bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'ESTRATEGIA' AND codigo = N'SYN_ACOMPANAMIENTO'
);
DECLARE @via bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'VIA_ATENCION' AND codigo = N'NO_INMEDIATA'
);
DECLARE @matriz bigint = (
    SELECT cat_version_id FROM dbo.cat_version
    WHERE codigo_catalogo = N'MATRIZ_PRIORIDAD' AND numero_version = 1
);

IF @inst IS NULL OR @cat_prot IS NULL OR @cat_riesgo IS NULL
    OR @fac_prot IS NULL OR @fac_riesgo IS NULL
    OR @disc IS NULL OR @disc2 IS NULL OR @estr IS NULL OR @via IS NULL
    OR @matriz IS NULL
    THROW 51063, N'Faltan catalogos o el instrumento de la semilla 020_synthetic_dataset.', 1;

IF OBJECT_ID(N'tempdb..#rot') IS NOT NULL DROP TABLE #rot;
CREATE TABLE #rot (
    grupo nvarchar(40) COLLATE Latin1_General_100_CI_AS NOT NULL,
    n int NOT NULL,
    id bigint NOT NULL,
    PRIMARY KEY (grupo, n)
);

INSERT INTO #rot (grupo, n, id)
SELECT codigo_catalogo,
       ROW_NUMBER() OVER (PARTITION BY codigo_catalogo ORDER BY orden) - 1,
       cat_item_id
FROM dbo.cat_item
WHERE codigo_catalogo IN (N'ORIGEN_REFERENCIA', N'MOTIVO_REFERENCIA', N'FRECUENCIA')
  AND activo = 1;

DECLARE @n_origen int = (SELECT COUNT(*) FROM #rot WHERE grupo = N'ORIGEN_REFERENCIA');
DECLARE @n_motivo int = (SELECT COUNT(*) FROM #rot WHERE grupo = N'MOTIVO_REFERENCIA');
DECLARE @n_frec int = (SELECT COUNT(*) FROM #rot WHERE grupo = N'FRECUENCIA');
IF @n_origen < 1 OR @n_motivo < 1 OR @n_frec < 1
    THROW 51064, N'Faltan items de origen, motivo o frecuencia.', 1;

IF OBJECT_ID(N'tempdb..#matriz') IS NOT NULL DROP TABLE #matriz;
CREATE TABLE #matriz (
    n int NOT NULL PRIMARY KEY,
    riesgo nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    proteccion nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    prioridad nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL
);

INSERT INTO #matriz (n, riesgo, proteccion, prioridad)
SELECT ROW_NUMBER() OVER (ORDER BY riesgo_codigo, proteccion_codigo) - 1,
       riesgo_codigo, proteccion_codigo, prioridad_codigo
FROM dbo.cat_matriz_prioridad
WHERE matriz_version_id = @matriz;

IF (SELECT COUNT(*) FROM #matriz) <> 9
    THROW 51065, N'La matriz RN-009 no tiene nueve filas.', 1;

IF OBJECT_ID(N'tempdb..#elegible') IS NOT NULL DROP TABLE #elegible;
CREATE TABLE #elegible (
    per_id nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL PRIMARY KEY,
    establecimiento_id int NOT NULL,
    oficina_local_id int NOT NULL,
    region_id int NOT NULL,
    dr nvarchar(2) COLLATE Latin1_General_100_CI_AS NOT NULL,
    region_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    oficina_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    establecimiento_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    edad smallint NULL
);

INSERT INTO #elegible (
    per_id, establecimiento_id, oficina_local_id, region_id, dr,
    region_nombre, oficina_nombre, establecimiento_nombre, edad
)
SELECT
    p.PER_idPersona COLLATE Latin1_General_100_CI_AS,
    e.EST_idEstablecimiento,
    o.CAT_idOficinaLocal,
    CONVERT(int, o.CAT_idRegion),
    dr.codigo,
    LEFT(r.REG_nombre, 200) COLLATE Latin1_General_100_CI_AS,
    LEFT(o.OFL_nombre, 200) COLLATE Latin1_General_100_CI_AS,
    LEFT(COALESCE(
        e.EST_descripcion COLLATE Latin1_General_100_CI_AS,
        N'EST ' + CONVERT(nvarchar(10), e.EST_idEstablecimiento)
    ), 200),
    CASE
        WHEN p.PER_fechaNacimiento IS NULL THEN NULL
        WHEN DATEDIFF(YEAR, p.PER_fechaNacimiento, CONVERT(date, '20261105')) BETWEEN 0 AND 120
            THEN CONVERT(smallint, DATEDIFF(YEAR, p.PER_fechaNacimiento, CONVERT(date, '20261105')))
        ELSE NULL
    END
FROM SIDINACC_LOCAL.dbo.CAF_PERSONA AS p
CROSS APPLY (
    SELECT TOP (1) f.EST_idEstablecimientoActual
    FROM SIDINACC_LOCAL.dbo.CAF_FAMILIA_DETALLE AS f
    WHERE f.FAM_idFamilia = p.FAM_idFamilia
      AND f.RCS_idPeriodo = 2026
      AND (f.BIT_eliminado IS NULL OR f.BIT_eliminado = 0)
      AND f.EST_idEstablecimientoActual IS NOT NULL
    ORDER BY f.FAD_idFamiliaDetalle DESC
) AS det
INNER JOIN SIDINACC_LOCAL.dbo.RCS_ESTABLECIMIENTO AS e
    ON e.EST_idEstablecimiento = det.EST_idEstablecimientoActual
   AND e.EST_inActivo = 1
INNER JOIN SIDINACC_LOCAL.dbo.CAF_CAT_OFICINA_LOCAL AS o
    ON o.CAT_idOficinaLocal = e.CAT_idOficinaLocal
INNER JOIN SIDINACC_LOCAL.dbo.CAF_CAT_REGION AS r
    ON r.CAT_idRegion = CONVERT(int, o.CAT_idRegion)
INNER JOIN dbo.cat_codigo_region_referencia AS dr
    ON dr.region_id = CONVERT(int, o.CAT_idRegion)
WHERE p.FAM_idFamilia IS NOT NULL
  AND p.PER_idPersona COLLATE Latin1_General_100_CI_AS LIKE N'SYN-[0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9]'
  AND (p.BIT_eliminado IS NULL OR p.BIT_eliminado = 0)
  AND o.CAT_idOficinaLocal BETWEEN 100 AND 999;

IF OBJECT_ID(N'tempdb..#cov') IS NOT NULL DROP TABLE #cov;
CREATE TABLE #cov (
    work_id int IDENTITY(1, 1) NOT NULL PRIMARY KEY,
    per_id nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    establecimiento_id int NOT NULL,
    oficina_local_id int NOT NULL,
    region_id int NOT NULL,
    dr nvarchar(2) COLLATE Latin1_General_100_CI_AS NOT NULL,
    region_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    oficina_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    establecimiento_nombre nvarchar(200) COLLATE Latin1_General_100_CI_AS NOT NULL,
    edad smallint NULL,
    anio int NOT NULL,
    fecha_referencia date NOT NULL,
    riesgo nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    proteccion nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    prioridad nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    origen_item_id bigint NOT NULL,
    motivo_item_id bigint NOT NULL,
    frec_item_id bigint NOT NULL,
    consecutivo nvarchar(80) COLLATE Latin1_General_100_CI_AS NULL,
    referencia_id bigint NULL,
    sesion_id bigint NULL,
    situacion_id bigint NULL,
    valoracion_id bigint NULL,
    caso_id bigint NULL,
    plan_id bigint NULL
);

;WITH hueco AS (
    SELECT DISTINCT e.establecimiento_id
    FROM #elegible AS e
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.caso_ai AS c
        WHERE c.establecimiento_id = e.establecimiento_id
    )
),
libre AS (
    SELECT
        e.per_id, e.establecimiento_id, e.oficina_local_id, e.region_id, e.dr,
        e.region_nombre, e.oficina_nombre, e.establecimiento_nombre, e.edad,
        ROW_NUMBER() OVER (
            PARTITION BY e.establecimiento_id
            ORDER BY (CHECKSUM(@semilla, e.per_id) & 2147483647), e.per_id
        ) AS n
    FROM #elegible AS e
    INNER JOIN hueco AS h ON h.establecimiento_id = e.establecimiento_id
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.caso_ai AS c
        WHERE c.per_id_persona = e.per_id
          AND c.estado = N'ACTIVO'
    )
)
INSERT INTO #cov (
    per_id, establecimiento_id, oficina_local_id, region_id, dr,
    region_nombre, oficina_nombre, establecimiento_nombre, edad,
    anio, fecha_referencia, riesgo, proteccion, prioridad,
    origen_item_id, motivo_item_id, frec_item_id
)
SELECT
    l.per_id, l.establecimiento_id, l.oficina_local_id, l.region_id, l.dr,
    l.region_nombre, l.oficina_nombre, l.establecimiento_nombre, l.edad,
    2025, CONVERT(date, '20250418'),
    m.riesgo, m.proteccion, m.prioridad,
    ori.id, mot.id, fre.id
FROM libre AS l
INNER JOIN #matriz AS m ON m.n = (l.establecimiento_id % 9)
INNER JOIN #rot AS ori
    ON ori.grupo = N'ORIGEN_REFERENCIA' AND ori.n = (l.establecimiento_id % @n_origen)
INNER JOIN #rot AS mot
    ON mot.grupo = N'MOTIVO_REFERENCIA' AND mot.n = (l.establecimiento_id % @n_motivo)
INNER JOIN #rot AS fre
    ON fre.grupo = N'FRECUENCIA' AND fre.n = (l.establecimiento_id % @n_frec)
WHERE l.n = 1;

DECLARE @huecos int = (
    SELECT COUNT(DISTINCT establecimiento_id)
    FROM #elegible AS e
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.caso_ai AS c WHERE c.establecimiento_id = e.establecimiento_id
    )
);
DECLARE @preparados int = (SELECT COUNT(*) FROM #cov);

IF @huecos = 0
BEGIN
    PRINT N'Cobertura territorial ya completa. No se inserta.';
    RETURN;
END;

IF @preparados <> @huecos
    THROW 51081, N'Hay un establecimiento elegible sin una persona sintetica libre de caso activo. No se inventa una identidad.', 1;

IF EXISTS (
    SELECT establecimiento_id FROM #cov GROUP BY establecimiento_id HAVING COUNT(*) > 1
)
    THROW 51082, N'La cobertura preparo dos casos para el mismo establecimiento.', 1;

IF EXISTS (
    SELECT per_id FROM #cov GROUP BY per_id HAVING COUNT(*) > 1
)
    THROW 51083, N'La cobertura preparo dos casos para la misma persona.', 1;

IF EXISTS (
    SELECT 1
    FROM #cov AS c
    INNER JOIN dbo.caso_ai AS a ON a.per_id_persona = c.per_id AND a.estado = N'ACTIVO'
)
    THROW 51084, N'La persona elegida ya tiene un caso activo.', 1;

UPDATE r
SET consecutivo =
    N'DNCC-DR' + r.dr
    + N'-OL' + RIGHT(N'000' + CONVERT(nvarchar(3), r.oficina_local_id), 3)
    + N'-' + CONVERT(nvarchar(10), r.establecimiento_id)
    + N'-REF-' + RIGHT(N'000' + CONVERT(nvarchar(3), ISNULL(u.max_ref, 0) + x.n), 3)
    + N'-' + CONVERT(char(4), r.anio)
FROM #cov AS r
INNER JOIN (
    SELECT work_id, establecimiento_id, anio,
           ROW_NUMBER() OVER (PARTITION BY establecimiento_id, anio ORDER BY per_id) AS n
    FROM #cov
) AS x ON x.work_id = r.work_id
LEFT JOIN (
    SELECT establecimiento_id,
           CONVERT(int, RIGHT(consecutivo, 4)) AS anio,
           MAX(CONVERT(int, SUBSTRING(consecutivo, LEN(consecutivo) - 7, 3))) AS max_ref
    FROM dbo.ref_referencia
    GROUP BY establecimiento_id, CONVERT(int, RIGHT(consecutivo, 4))
) AS u ON u.establecimiento_id = r.establecimiento_id AND u.anio = r.anio;

IF EXISTS (SELECT 1 FROM #cov WHERE consecutivo IS NULL OR LEN(consecutivo) < 30)
    THROW 51066, N'Quedo un consecutivo vacio.', 1;

IF EXISTS (SELECT consecutivo FROM #cov GROUP BY consecutivo HAVING COUNT(*) > 1)
    THROW 51067, N'El generador produjo consecutivos duplicados.', 1;

IF EXISTS (
    SELECT 1
    FROM #cov AS c
    INNER JOIN dbo.ref_referencia AS x ON x.consecutivo = c.consecutivo
)
    THROW 51068, N'Un consecutivo de cobertura ya existe.', 1;

IF EXISTS (
    SELECT 1
    FROM #cov
    WHERE ISNULL((
        SELECT MAX(CONVERT(int, SUBSTRING(x.consecutivo, LEN(x.consecutivo) - 7, 3)))
        FROM dbo.ref_referencia AS x
        WHERE x.establecimiento_id = #cov.establecimiento_id
          AND CONVERT(int, RIGHT(x.consecutivo, 4)) = #cov.anio
    ), 0) + 1 > 999
)
    THROW 51073, N'No cabe otro consecutivo de tres digitos en un establecimiento y anio.', 1;

DECLARE @inicio datetime2(0) = CAST(SYSUTCDATETIME() AS datetime2(0));
DECLARE @usr nvarchar(128) = N'sintetico.cobertura.01';
DECLARE @n int = (SELECT COUNT(*) FROM #cov);

RAISERROR(N'Cobertura territorial: %d casos nuevos.', 0, 1, @n) WITH NOWAIT;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.vinculo_persona (per_id_persona, primera_operacion_en)
    SELECT c.per_id, CONVERT(datetime2(0), '2025-04-18T08:00:00')
    FROM #cov AS c
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.vinculo_persona AS v WHERE v.per_id_persona = c.per_id
    );

    DECLARE @map_ref TABLE (
        work_id int NOT NULL PRIMARY KEY,
        referencia_id bigint NOT NULL
    );

    MERGE dbo.ref_referencia AS t
    USING #cov AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo,
            origen_item_id, origen_catalogo, responsable_usuario, origen_captura, consecutivo,
            establecimiento_id, oficina_local_id, region_id, enviada_en, enviada_por, creada_en, creada_por
        )
        VALUES (
            s.per_id, N'ADMITIDA_AI', s.fecha_referencia, @via, N'VIA_ATENCION',
            s.origen_item_id, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', s.consecutivo,
            s.establecimiento_id, s.oficina_local_id, s.region_id,
            CONVERT(datetime2(0), '2025-04-18T08:00:00'), @usr,
            CONVERT(datetime2(0), '2025-04-18T08:00:00'), @usr
        )
    OUTPUT s.work_id, inserted.referencia_id INTO @map_ref (work_id, referencia_id);

    UPDATE c
    SET referencia_id = m.referencia_id
    FROM #cov AS c
    INNER JOIN @map_ref AS m ON m.work_id = c.work_id;

    INSERT INTO dbo.ref_motivo (referencia_id, cat_item_id, motivo_catalogo, especificacion)
    SELECT referencia_id, motivo_item_id, N'MOTIVO_REFERENCIA',
           N'Especificacion sintetica de prueba para cobertura territorial.'
    FROM #cov;

    INSERT INTO dbo.ref_contexto (
        referencia_id, servicios_texto, region_nombre, oficina_local_nombre,
        establecimiento_nombre, edad_anios
    )
    SELECT referencia_id,
           N'Servicio sintetico de prueba',
           region_nombre, oficina_nombre, establecimiento_nombre, edad
    FROM #cov;

    DECLARE @map_ses TABLE (
        work_id int NOT NULL PRIMARY KEY,
        sesion_id bigint NOT NULL
    );

    MERGE dbo.ses_sesion AS t
    USING (SELECT work_id, oficina_local_id FROM #cov) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
        VALUES (
            s.oficina_local_id, CONVERT(date, '20250418'), '08:00:00', '09:30:00',
            N'Sala sintetica de prueba',
            CONVERT(datetime2(0), '2025-04-18T08:00:00'), @usr
        )
    OUTPUT s.work_id, inserted.sesion_id INTO @map_ses (work_id, sesion_id);

    UPDATE c SET sesion_id = m.sesion_id
    FROM #cov AS c
    INNER JOIN @map_ses AS m ON m.work_id = c.work_id;

    INSERT INTO dbo.ses_disciplina (sesion_id, disciplina_item_id, disciplina_catalogo)
    SELECT sesion_id, CASE WHEN work_id % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA'
    FROM #cov;

    DECLARE @map_sit TABLE (
        work_id int NOT NULL PRIMARY KEY,
        situacion_id bigint NOT NULL
    );

    MERGE dbo.ses_situacion AS t
    USING (SELECT work_id, sesion_id, referencia_id FROM #cov) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (sesion_id, referencia_id, caso_id)
        VALUES (s.sesion_id, s.referencia_id, NULL)
    OUTPUT s.work_id, inserted.situacion_id INTO @map_sit (work_id, situacion_id);

    UPDATE c SET situacion_id = m.situacion_id
    FROM #cov AS c
    INNER JOIN @map_sit AS m ON m.work_id = c.work_id;

    DECLARE @map_val TABLE (
        work_id int NOT NULL PRIMARY KEY,
        valoracion_id bigint NOT NULL
    );

    MERGE dbo.ses_valoracion AS t
    USING (
        SELECT work_id, situacion_id, referencia_id, riesgo, proteccion, prioridad
        FROM #cov
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
            matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
            responsable_usuario, fecha_valoracion, confirmada_en
        )
        VALUES (
            s.situacion_id, NULL, s.referencia_id, @inst, 1, 1,
            @matriz, s.riesgo, s.proteccion, s.prioridad,
            @usr, CONVERT(date, '20250418'), CONVERT(datetime2(0), '2025-04-18T10:00:00')
        )
    OUTPUT s.work_id, inserted.valoracion_id INTO @map_val (work_id, valoracion_id);

    UPDATE c SET valoracion_id = m.valoracion_id
    FROM #cov AS c
    INNER JOIN @map_val AS m ON m.work_id = c.work_id;

    INSERT INTO dbo.ses_resolucion (
        referencia_id, sesion_id, valoracion_id, decision, justificacion,
        responsable_usuario, fecha_decision, registrada_en
    )
    SELECT referencia_id, sesion_id, valoracion_id, N'REQUIERE_AI', NULL,
           @usr, CONVERT(date, '20250418'), CONVERT(datetime2(0), '2025-04-18T11:00:00')
    FROM #cov;

    DECLARE @map_caso TABLE (
        work_id int NOT NULL PRIMARY KEY,
        caso_id bigint NOT NULL
    );

    MERGE dbo.caso_ai AS t
    USING (
        SELECT work_id, per_id, referencia_id, establecimiento_id, oficina_local_id,
               region_id, consecutivo, valoracion_id
        FROM #cov
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
            establecimiento_id, oficina_local_id, region_id, consecutivo_origen, valoracion_vigente_id
        )
        VALUES (
            s.per_id, s.referencia_id, N'ACTIVO', CONVERT(date, '20250418'),
            CONVERT(datetime2(0), '2025-04-18T11:00:00'), @usr,
            s.establecimiento_id, s.oficina_local_id, s.region_id, s.consecutivo, s.valoracion_id
        )
    OUTPUT s.work_id, inserted.caso_id INTO @map_caso (work_id, caso_id);

    UPDATE c SET caso_id = m.caso_id
    FROM #cov AS c
    INNER JOIN @map_caso AS m ON m.work_id = c.work_id;

    UPDATE v
    SET caso_id = c.caso_id
    FROM dbo.ses_valoracion AS v
    INNER JOIN #cov AS c ON c.valoracion_id = v.valoracion_id;

    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario)
    SELECT caso_id, N'ACTIVO', CONVERT(datetime2(0), '2025-04-18T11:00:00'), @usr
    FROM #cov;

    DECLARE @map_plan TABLE (
        work_id int NOT NULL PRIMARY KEY,
        plan_id bigint NOT NULL
    );

    MERGE dbo.caso_plan AS t
    USING (SELECT work_id, caso_id, frec_item_id FROM #cov) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
            responsable_usuario, fecha_plan, registrado_en
        )
        VALUES (
            s.caso_id, 1, 1, s.frec_item_id, N'FRECUENCIA', @usr,
            CONVERT(date, '20250418'), CONVERT(datetime2(0), '2025-04-18T12:00:00')
        )
    OUTPUT s.work_id, inserted.plan_id INTO @map_plan (work_id, plan_id);

    UPDATE c SET plan_id = m.plan_id
    FROM #cov AS c
    INNER JOIN @map_plan AS m ON m.work_id = c.work_id;

    INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
    SELECT plan_id, 1, N'Proposito sintetico de prueba. No sustituye un plan profesional.'
    FROM #cov;

    INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
    SELECT plan_id, @estr, N'ESTRATEGIA'
    FROM #cov;

    INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
    SELECT plan_id, CASE WHEN work_id % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA'
    FROM #cov;

    UPDATE a
    SET plan_vigente_id = c.plan_id
    FROM dbo.caso_ai AS a
    INNER JOIN #cov AS c ON c.caso_id = a.caso_id;

    INSERT INTO dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta, instrumento_version_id)
    SELECT valoracion_id, @cat_prot,
           CASE WHEN riesgo = N'BAJO' AND proteccion = N'ALTA' THEN N'NINGUNO' ELSE N'FACTORES' END,
           @inst
    FROM #cov
    UNION ALL
    SELECT valoracion_id, @cat_riesgo, N'FACTORES', @inst
    FROM #cov;

    INSERT INTO dbo.ses_valoracion_factor (
        valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace
    )
    SELECT valoracion_id, @cat_prot, @fac_prot, NULL, N'FACTORES'
    FROM #cov
    WHERE NOT (riesgo = N'BAJO' AND proteccion = N'ALTA')
    UNION ALL
    SELECT valoracion_id, @cat_riesgo, @fac_riesgo,
           N'Especificacion sintetica de prueba', N'FACTORES'
    FROM #cov;

    INSERT INTO dbo.ate_individual (
        caso_id, per_id_persona, fecha_atencion, disciplina_item_id, disciplina_catalogo,
        estrategia_item_id, estrategia_catalogo, acciones, recomendaciones,
        profesional_usuario, digitador_usuario, digitada_en
    )
    SELECT caso_id, per_id, CONVERT(date, '20250509'),
           CASE WHEN work_id % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA',
           @estr, N'ESTRATEGIA',
           N'Accion sintetica de prueba. No es un registro clinico.',
           N'Recomendacion sintetica de prueba.',
           @usr, @usr, CONVERT(datetime2(0), '2025-05-09T15:00:00')
    FROM #cov;

    INSERT INTO dbo.aud_evento (
        ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
    )
    SELECT CONVERT(datetime2(0), '2025-04-18T11:00:00'),
           @usr, N'ROL_PRUEBA', N'APERTURA', N'caso_ai',
           CONVERT(nvarchar(40), caso_id),
           N'OL ' + CONVERT(nvarchar(10), oficina_local_id),
           N'SYN_COVERAGE'
    FROM #cov;

    IF EXISTS (SELECT 1 FROM #cov WHERE caso_id IS NULL OR referencia_id IS NULL OR plan_id IS NULL)
        THROW 51085, N'Quedo un expediente de cobertura incompleto.', 1;

    IF EXISTS (
        SELECT per_id_persona
        FROM dbo.caso_ai
        WHERE estado = N'ACTIVO'
        GROUP BY per_id_persona
        HAVING COUNT(*) > 1
    )
        THROW 51086, N'Quedaron dos casos activos para una persona.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.ate_individual AS i
        INNER JOIN #cov AS c ON c.caso_id = i.caso_id
        WHERE i.fecha_atencion <= CONVERT(date, '20250418')
    )
        THROW 51071, N'Una atencion quedo fuera de la vigencia del caso.', 1;

    IF EXISTS (
        SELECT 1
        FROM #cov AS c
        INNER JOIN dbo.caso_ai AS a ON a.caso_id = c.caso_id
        INNER JOIN dbo.ref_referencia AS r ON r.referencia_id = c.referencia_id
        WHERE a.per_id_persona <> c.per_id
           OR a.referencia_id <> r.referencia_id
           OR a.establecimiento_id <> c.establecimiento_id
           OR a.oficina_local_id <> c.oficina_local_id
           OR a.region_id <> c.region_id
           OR r.establecimiento_id <> c.establecimiento_id
           OR r.oficina_local_id <> c.oficina_local_id
           OR r.region_id <> c.region_id
           OR a.consecutivo_origen <> r.consecutivo
           OR a.estado <> N'ACTIVO'
    )
        THROW 51087, N'El caso nuevo no coincide con su referencia o con el establecimiento de origen.', 1;

    IF EXISTS (
        SELECT 1
        FROM #cov AS c
        INNER JOIN SIDINACC_LOCAL.dbo.RCS_ESTABLECIMIENTO AS e
            ON e.EST_idEstablecimiento = c.establecimiento_id
        INNER JOIN SIDINACC_LOCAL.dbo.CAF_CAT_OFICINA_LOCAL AS o
            ON o.CAT_idOficinaLocal = e.CAT_idOficinaLocal
        WHERE e.EST_inActivo <> 1
           OR o.CAT_idOficinaLocal <> c.oficina_local_id
           OR CONVERT(int, o.CAT_idRegion) <> c.region_id
    )
        THROW 51088, N'La cobertura no respeta la jerarquia de la replica.', 1;

    IF EXISTS (
        SELECT 1
        FROM #elegible AS e
        WHERE NOT EXISTS (
            SELECT 1 FROM dbo.caso_ai AS c WHERE c.establecimiento_id = e.establecimiento_id
        )
    )
        THROW 51089, N'La cobertura no cerro todos los establecimientos elegibles.', 1;

    INSERT INTO dbo.aud_migracion_lote (
        fuente, usuario, iniciado_en, cerrado_en, filas_aceptadas, filas_rechazadas
    )
    VALUES (
        N'SYN-COVERAGE:seed:' + CONVERT(nvarchar(20), @semilla),
        @usr, @inicio, CAST(SYSUTCDATETIME() AS datetime2(0)), @n, 0
    );

    COMMIT TRANSACTION;
    PRINT N'Cobertura territorial confirmada.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH;
