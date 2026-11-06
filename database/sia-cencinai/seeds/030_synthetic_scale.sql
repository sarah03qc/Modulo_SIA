/*
SIA_CENCINAI — generador sintetico por escala.

CLASIFICACION: SYNTHETIC. No es semilla productiva ni una prevalencia institucional.
Lee identificadores SYN- de SIDINACC_LOCAL y escribe solo en SIA_CENCINAI.
No ejecuta INSERT, UPDATE, DELETE, TRUNCATE, DROP ni ALTER sobre SIDINACC_LOCAL.

Escalas acumuladas, con la misma semilla y el mismo orden CHECKSUM:
- small:  120 personas elegibles todavia no vinculadas.
- medium: 940 personas de escala en total.
- large:  todas las elegibles que sigan libres.

La semilla manual 020 cubre el expediente de pruebas funcionales y no se vuelve a insertar.
Este archivo no borra filas. Si la escala pedida ya esta cubierta, termina sin escribir.
El consecutivo lo compone el generador de pruebas. No es la generacion del producto:
no hay tabla contador ni cambio de RF-114. El sufijo de tres digitos continua
despues del maximo ya guardado para ese establecimiento y anio.

Poner @permitir_escala = 1 solo en la base local de desarrollo.
Cambiar @escala a small, medium o large. @semilla fija la reproducibilidad.

La cobertura minima de un caso por establecimiento activo elegible no sale de estos
perfiles. Ese pase posterior es seeds/040_territorial_coverage.sql, con la misma semilla.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir_escala bit = 0;
DECLARE @escala nvarchar(20) = N'small';
DECLARE @semilla int = 20261105;

IF @permitir_escala <> 1
    THROW 51060, N'Escala sintetica bloqueada. Cambie @permitir_escala a 1 solo en desarrollo.', 1;

IF @escala NOT IN (N'small', N'medium', N'large')
    THROW 51061, N'Escala no reconocida. Use small, medium o large.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'090_constraints_and_indexes' AND estado = N'APLICADA'
)
    THROW 51062, N'La migracion 090 no esta aplicada.', 1;

DECLARE @inst bigint = (
    SELECT instrumento_version_id
    FROM dbo.cat_instrumento_version
    WHERE numero_version = 1
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
DECLARE @tipo_ate bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'TIPO_ATENCION' AND codigo = N'SYN_TALLER'
);
DECLARE @tipo_prog bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'TIPO_ACTIVIDAD_PROGRAMADA' AND codigo = N'SESION_INTERDISCIPLINARIA'
);
DECLARE @via_u bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'VIA_ATENCION' AND codigo = N'URGENCIA'
);
DECLARE @via_n bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'VIA_ATENCION' AND codigo = N'NO_INMEDIATA'
);
DECLARE @cierre_ok bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'CIERRE_SATISFACTORIO'
);
DECLARE @cierre_tr bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'TRASLADO'
);
DECLARE @cierre_otro bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'OTRO'
);
DECLARE @matriz bigint = (
    SELECT cat_version_id FROM dbo.cat_version
    WHERE codigo_catalogo = N'MATRIZ_PRIORIDAD' AND numero_version = 1
);

IF @inst IS NULL OR @cat_prot IS NULL OR @cat_riesgo IS NULL
    OR @fac_prot IS NULL OR @fac_riesgo IS NULL OR @disc IS NULL OR @disc2 IS NULL
    OR @estr IS NULL OR @tipo_ate IS NULL OR @tipo_prog IS NULL
    OR @via_u IS NULL OR @via_n IS NULL
    OR @cierre_ok IS NULL OR @cierre_tr IS NULL OR @cierre_otro IS NULL
    OR @matriz IS NULL
    THROW 51063, N'Faltan catalogos o el instrumento de la semilla 020_synthetic_dataset.', 1;

DECLARE @ya int = (
    SELECT COUNT(*)
    FROM dbo.vinculo_persona
    WHERE per_id_persona NOT IN (
        N'SYN-1100102-01', N'SYN-1100102-02', N'SYN-1100102-03',
        N'SYN-1100102-04', N'SYN-1100102-05', N'SYN-1100102-06',
        N'SYN-5010104-01'
    )
);
DECLARE @meta int = CASE @escala
    WHEN N'small' THEN 120
    WHEN N'medium' THEN 940
    ELSE 1000000
END;
DECLARE @falta int = CASE WHEN @meta > @ya THEN @meta - @ya ELSE 0 END;

IF @falta <= 0
BEGIN
    PRINT N'Escala ' + @escala + N' ya cubierta (' + CONVERT(nvarchar(20), @ya) + N' personas de escala). No se inserta.';
    RETURN;
END

CREATE TABLE #territorio (
    establecimiento_id int NOT NULL PRIMARY KEY,
    oficina_local_id int NOT NULL,
    region_id int NOT NULL
);

INSERT INTO #territorio (establecimiento_id, oficina_local_id, region_id)
SELECT e.EST_idEstablecimiento, e.CAT_idOficinaLocal, CONVERT(int, o.CAT_idRegion)
FROM SIDINACC_LOCAL.dbo.RCS_ESTABLECIMIENTO AS e
INNER JOIN SIDINACC_LOCAL.dbo.CAF_CAT_OFICINA_LOCAL AS o
    ON o.CAT_idOficinaLocal = e.CAT_idOficinaLocal
WHERE e.EST_inActivo = 1
  AND o.CAT_idOficinaLocal BETWEEN 100 AND 999;

CREATE TABLE #persona (
    per_id_persona nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL PRIMARY KEY,
    establecimiento_id int NOT NULL,
    oficina_local_id int NOT NULL,
    region_id int NOT NULL,
    dr nvarchar(2) COLLATE Latin1_General_100_CI_AS NOT NULL,
    edad smallint NULL,
    bucket int NOT NULL,
    perfil nvarchar(20) COLLATE Latin1_General_100_CI_AS NULL
);

INSERT INTO #persona (
    per_id_persona, establecimiento_id, oficina_local_id, region_id, dr, edad, bucket
)
SELECT TOP (@falta)
    p.PER_idPersona COLLATE Latin1_General_100_CI_AS,
    e.EST_idEstablecimiento,
    o.CAT_idOficinaLocal,
    CONVERT(int, o.CAT_idRegion),
    dr.codigo,
    CASE
        WHEN p.PER_fechaNacimiento IS NULL THEN NULL
        WHEN DATEDIFF(YEAR, p.PER_fechaNacimiento, CONVERT(date, '20261105')) BETWEEN 0 AND 120
            THEN CONVERT(smallint, DATEDIFF(YEAR, p.PER_fechaNacimiento, CONVERT(date, '20261105')))
        ELSE NULL
    END,
    (CHECKSUM(@semilla, p.PER_idPersona) & 2147483647) % 100
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
INNER JOIN dbo.cat_codigo_region_referencia AS dr
    ON dr.region_id = CONVERT(int, o.CAT_idRegion)
WHERE p.FAM_idFamilia IS NOT NULL
  AND p.PER_idPersona COLLATE Latin1_General_100_CI_AS LIKE N'SYN-[0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9]'
  AND (p.BIT_eliminado IS NULL OR p.BIT_eliminado = 0)
  AND o.CAT_idOficinaLocal BETWEEN 100 AND 999
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.vinculo_persona AS v
      WHERE v.per_id_persona = p.PER_idPersona COLLATE Latin1_General_100_CI_AS
  )
ORDER BY CHECKSUM(@semilla, p.PER_idPersona), p.PER_idPersona;

IF NOT EXISTS (SELECT 1 FROM #persona)
BEGIN
    PRINT N'No quedan personas sinteticas elegibles.';
    RETURN;
END

UPDATE #persona
SET perfil = CASE
    WHEN bucket < 50 THEN N'VINCULO'
    WHEN bucket < 62 THEN N'PENDIENTE'
    WHEN bucket < 70 THEN N'NO_AI'
    WHEN bucket < 82 THEN N'ACTIVO'
    WHEN bucket < 89 THEN N'CERRADO'
    WHEN bucket < 95 THEN N'HIST'
    WHEN bucket < 98 THEN N'MULTI'
    ELSE N'ALTO'
END;

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

CREATE TABLE #ref (
    work_id int IDENTITY(1, 1) NOT NULL PRIMARY KEY,
    per_id_persona nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    orden_ref int NOT NULL,
    perfil nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
    estado nvarchar(30) COLLATE Latin1_General_100_CI_AS NOT NULL,
    fecha_referencia date NOT NULL,
    anio int NULL,
    abre_caso bit NOT NULL,
    es_activo bit NOT NULL,
    cierra bit NOT NULL,
    motivo_cierre nvarchar(30) COLLATE Latin1_General_100_CI_AS NULL,
    motivo_item_id bigint NULL,
    explicacion nvarchar(2000) COLLATE Latin1_General_100_CI_AS NULL,
    fecha_apertura date NULL,
    fecha_cierre date NULL,
    fecha_reval date NULL,
    revalora bit NOT NULL DEFAULT 0,
    revisa_plan bit NOT NULL DEFAULT 0,
    n_atenciones int NOT NULL,
    spacing_days int NOT NULL,
    riesgo nvarchar(20) COLLATE Latin1_General_100_CI_AS NULL,
    proteccion nvarchar(20) COLLATE Latin1_General_100_CI_AS NULL,
    prioridad nvarchar(20) COLLATE Latin1_General_100_CI_AS NULL,
    matriz_n int NULL,
    establecimiento_id int NOT NULL,
    oficina_local_id int NOT NULL,
    region_id int NOT NULL,
    dr nvarchar(2) COLLATE Latin1_General_100_CI_AS NOT NULL,
    edad smallint NULL,
    via_item_id bigint NULL,
    origen_item_id bigint NULL,
    motivo_ref_id bigint NULL,
    frec_item_id bigint NULL,
    destino_est int NULL,
    destino_ol int NULL,
    destino_region int NULL,
    consecutivo nvarchar(80) COLLATE Latin1_General_100_CI_AS NULL,
    referencia_id bigint NULL,
    sesion_id bigint NULL,
    situacion_id bigint NULL,
    valoracion_id bigint NULL,
    caso_id bigint NULL,
    plan_id bigint NULL
);

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'PENDIENTE_REVISION',
       DATEADD(DAY, (CHECKSUM(@semilla, per_id_persona) & 45), CONVERT(date, '20260701')),
       0, 0, 0, 0, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'PENDIENTE';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'NO_REQUIERE_AI',
       DATEFROMPARTS(2024 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 8, 20),
       0, 0, 0, 0, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'NO_AI';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'ADMITIDA_AI',
       CASE
           WHEN (CHECKSUM(@semilla, per_id_persona) & 2147483647) % 5 = 0 THEN CONVERT(date, '20260312')
           ELSE DATEFROMPARTS(2023 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 4, 18)
       END,
       1, 1, 0,
       CASE
           WHEN (CHECKSUM(@semilla, per_id_persona) & 2147483647) % 5 = 0 THEN CONVERT(date, '20260312')
           ELSE DATEFROMPARTS(2023 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 4, 18)
       END,
       2, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'ACTIVO';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, fecha_cierre, n_atenciones, spacing_days,
    establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'ADMITIDA_AI',
       CASE
           WHEN (CHECKSUM(@semilla, per_id_persona) & 3) = 0 THEN CONVERT(date, '20240202')
           ELSE DATEFROMPARTS(2022 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 6, 15)
       END,
       1, 0, 1,
       CASE
           WHEN (CHECKSUM(@semilla, per_id_persona) & 3) = 0 THEN CONVERT(date, '20240202')
           ELSE DATEFROMPARTS(2022 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 6, 15)
       END,
       CASE
           WHEN (CHECKSUM(@semilla, per_id_persona) & 3) = 0 THEN CONVERT(date, '20241002')
           ELSE DATEADD(MONTH, 11, DATEFROMPARTS(2022 + ((CHECKSUM(@semilla, per_id_persona) & 2147483647) % 3), 6, 15))
       END,
       3, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'CERRADO'
  AND (CHECKSUM(@semilla, per_id_persona) & 1) = 1;

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, fecha_cierre, n_atenciones, spacing_days,
    establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, v.orden_ref, perfil, N'ADMITIDA_AI', v.fecha_apertura,
       1, 0, 1, v.fecha_apertura, v.fecha_cierre, 2, 21,
       establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
CROSS JOIN (VALUES
    (1, CONVERT(date, '20220301'), CONVERT(date, '20230301')),
    (2, CONVERT(date, '20240401'), CONVERT(date, '20250401'))
) AS v (orden_ref, fecha_apertura, fecha_cierre)
WHERE perfil = N'CERRADO'
  AND (CHECKSUM(@semilla, per_id_persona) & 1) = 0;

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, fecha_cierre, n_atenciones, spacing_days,
    establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'ADMITIDA_AI',
       CONVERT(date, '20220510'), 1, 0, 1,
       CONVERT(date, '20220510'), CONVERT(date, '20230610'), 2, 21,
       establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'HIST';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 2, perfil, N'ADMITIDA_AI',
       CASE WHEN (CHECKSUM(@semilla, per_id_persona) & 1) = 0 THEN CONVERT(date, '20260201') ELSE CONVERT(date, '20250801') END,
       1, 1, 0,
       CASE WHEN (CHECKSUM(@semilla, per_id_persona) & 1) = 0 THEN CONVERT(date, '20260201') ELSE CONVERT(date, '20250801') END,
       2, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'HIST';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'NO_REQUIERE_AI', CONVERT(date, '20230901'),
       0, 0, 0, 0, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'MULTI';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 2, perfil, N'PENDIENTE_REVISION', CONVERT(date, '20260501'),
       0, 0, 0, 0, 21, establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'MULTI';

INSERT INTO #ref (
    per_id_persona, orden_ref, perfil, estado, fecha_referencia, abre_caso, es_activo, cierra,
    fecha_apertura, n_atenciones, spacing_days, establecimiento_id, oficina_local_id, region_id, dr, edad
)
SELECT per_id_persona, 1, perfil, N'ADMITIDA_AI', CONVERT(date, '20230116'),
       1, 1, 0, CONVERT(date, '20230116'), 8, 100,
       establecimiento_id, oficina_local_id, region_id, dr, edad
FROM #persona
WHERE perfil = N'ALTO';

UPDATE #ref SET anio = YEAR(fecha_referencia);

UPDATE r
SET via_item_id = CASE WHEN r.work_id % 2 = 0 THEN @via_u ELSE @via_n END
FROM #ref AS r;

UPDATE r
SET origen_item_id = t.id
FROM #ref AS r
INNER JOIN #rot AS t
    ON t.grupo = N'ORIGEN_REFERENCIA'
   AND t.n = (r.work_id % @n_origen);

UPDATE r
SET motivo_ref_id = t.id
FROM #ref AS r
INNER JOIN #rot AS t
    ON t.grupo = N'MOTIVO_REFERENCIA'
   AND t.n = (r.work_id % @n_motivo);

UPDATE r
SET frec_item_id = t.id
FROM #ref AS r
INNER JOIN #rot AS t
    ON t.grupo = N'FRECUENCIA'
   AND t.n = (r.work_id % @n_frec);

UPDATE r
SET riesgo = m.riesgo,
    proteccion = m.proteccion,
    prioridad = m.prioridad,
    matriz_n = x.n
FROM #ref AS r
INNER JOIN (
    SELECT work_id, (ROW_NUMBER() OVER (ORDER BY work_id) - 1) % 9 AS n
    FROM #ref
    WHERE estado <> N'PENDIENTE_REVISION'
) AS x ON x.work_id = r.work_id
INNER JOIN #matriz AS m ON m.n = x.n;

UPDATE #ref
SET motivo_cierre = CASE (CHECKSUM(@semilla, per_id_persona, orden_ref) & 7)
        WHEN 0 THEN N'TRASLADO'
        WHEN 1 THEN N'TRASLADO'
        WHEN 2 THEN N'OTRO'
        ELSE N'CIERRE_SATISFACTORIO'
    END
WHERE cierra = 1;

UPDATE #ref
SET motivo_cierre = N'TRASLADO'
WHERE cierra = 1
  AND perfil = N'HIST'
  AND orden_ref = 1;

UPDATE #ref
SET motivo_item_id = CASE motivo_cierre
        WHEN N'TRASLADO' THEN @cierre_tr
        WHEN N'OTRO' THEN @cierre_otro
        ELSE @cierre_ok
    END,
    explicacion = CASE
        WHEN motivo_cierre = N'OTRO' THEN N'Justificacion sintetica de prueba. No es un criterio profesional.'
        ELSE NULL
    END
WHERE cierra = 1;

UPDATE r
SET destino_est = d.establecimiento_id,
    destino_ol = d.oficina_local_id,
    destino_region = d.region_id
FROM #ref AS r
CROSS APPLY (
    SELECT TOP (1) t.establecimiento_id, t.oficina_local_id, t.region_id
    FROM #territorio AS t
    WHERE t.establecimiento_id <> r.establecimiento_id
    ORDER BY CHECKSUM(@semilla, r.per_id_persona, t.establecimiento_id), t.establecimiento_id
) AS d
WHERE r.motivo_cierre = N'TRASLADO';

UPDATE #ref
SET fecha_reval = DATEADD(DAY, 160, fecha_apertura)
WHERE abre_caso = 1;

UPDATE #ref
SET revalora = 1
WHERE abre_caso = 1
  AND (CHECKSUM(@semilla, per_id_persona, orden_ref) & 3) = 0
  AND fecha_reval < COALESCE(fecha_cierre, CONVERT(date, '20261001'))
  AND fecha_reval > fecha_apertura;

UPDATE #ref
SET revisa_plan = 1
WHERE es_activo = 1
  AND (work_id % 4) = 0
  AND DATEADD(DAY, 90, fecha_apertura) < CONVERT(date, '20261001');

IF EXISTS (
    SELECT 1
    FROM (
        SELECT r.establecimiento_id, r.anio,
               ROW_NUMBER() OVER (PARTITION BY r.establecimiento_id, r.anio ORDER BY r.per_id_persona, r.orden_ref) AS n
        FROM #ref AS r
    ) AS x
    LEFT JOIN (
        SELECT establecimiento_id,
               CONVERT(int, RIGHT(consecutivo, 4)) AS anio,
               MAX(CONVERT(int, SUBSTRING(consecutivo, LEN(consecutivo) - 7, 3))) AS max_ref
        FROM dbo.ref_referencia
        GROUP BY establecimiento_id, CONVERT(int, RIGHT(consecutivo, 4))
    ) AS u ON u.establecimiento_id = x.establecimiento_id AND u.anio = x.anio
    WHERE ISNULL(u.max_ref, 0) + x.n > 999
)
    THROW 51073, N'No cabe otro consecutivo de tres digitos en un establecimiento y anio.', 1;

UPDATE r
SET consecutivo =
    N'DNCC-DR' + r.dr
    + N'-OL' + RIGHT(N'000' + CONVERT(nvarchar(3), r.oficina_local_id), 3)
    + N'-' + CONVERT(nvarchar(10), r.establecimiento_id)
    + N'-REF-' + RIGHT(N'000' + CONVERT(nvarchar(3), ISNULL(u.max_ref, 0) + x.n), 3)
    + N'-' + CONVERT(char(4), r.anio)
FROM #ref AS r
INNER JOIN (
    SELECT work_id, establecimiento_id, anio,
           ROW_NUMBER() OVER (PARTITION BY establecimiento_id, anio ORDER BY per_id_persona, orden_ref) AS n
    FROM #ref
) AS x ON x.work_id = r.work_id
LEFT JOIN (
    SELECT establecimiento_id,
           CONVERT(int, RIGHT(consecutivo, 4)) AS anio,
           MAX(CONVERT(int, SUBSTRING(consecutivo, LEN(consecutivo) - 7, 3))) AS max_ref
    FROM dbo.ref_referencia
    GROUP BY establecimiento_id, CONVERT(int, RIGHT(consecutivo, 4))
) AS u ON u.establecimiento_id = r.establecimiento_id AND u.anio = r.anio;

IF EXISTS (SELECT 1 FROM #ref WHERE consecutivo IS NULL OR LEN(consecutivo) < 30)
    THROW 51066, N'Quedo un consecutivo vacio.', 1;

IF EXISTS (
    SELECT consecutivo FROM #ref GROUP BY consecutivo HAVING COUNT(*) > 1
)
    THROW 51067, N'El generador produjo consecutivos duplicados.', 1;

IF EXISTS (
    SELECT 1
    FROM #ref AS r
    INNER JOIN dbo.ref_referencia AS x ON x.consecutivo = r.consecutivo
)
    THROW 51068, N'Un consecutivo de escala ya existe.', 1;

IF EXISTS (
    SELECT per_id_persona FROM #ref WHERE es_activo = 1
    GROUP BY per_id_persona HAVING COUNT(*) > 1
)
    THROW 51069, N'El generador preparo dos casos activos para una persona.', 1;

IF EXISTS (SELECT 1 FROM #ref WHERE cierra = 1 AND es_activo = 1)
    THROW 51070, N'Un caso no puede quedar activo y cerrado a la vez.', 1;

DECLARE @n_personas int = (SELECT COUNT(*) FROM #persona);
DECLARE @n_refs int = (SELECT COUNT(*) FROM #ref);
DECLARE @inicio datetime2(0) = CAST(SYSUTCDATETIME() AS datetime2(0));
DECLARE @usr nvarchar(128) = N'sintetico.escala.01';

RAISERROR(N'Escala %s: personas %d, referencias %d.', 0, 1, @escala, @n_personas, @n_refs) WITH NOWAIT;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.vinculo_persona (per_id_persona, primera_operacion_en)
    SELECT p.per_id_persona,
           COALESCE(
               DATEADD(HOUR, 8, CAST(x.fecha_referencia AS datetime2(0))),
               CONVERT(datetime2(0), '2022-01-15T08:00:00')
           )
    FROM #persona AS p
    OUTER APPLY (
        SELECT MIN(r.fecha_referencia) AS fecha_referencia
        FROM #ref AS r
        WHERE r.per_id_persona = p.per_id_persona
    ) AS x;

    DECLARE @map_ref TABLE (
        work_id int NOT NULL PRIMARY KEY,
        referencia_id bigint NOT NULL
    );

    MERGE dbo.ref_referencia AS t
    USING #ref AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo,
            origen_item_id, origen_catalogo, responsable_usuario, origen_captura, consecutivo,
            establecimiento_id, oficina_local_id, region_id, enviada_en, enviada_por, creada_en, creada_por
        )
        VALUES (
            s.per_id_persona, s.estado, s.fecha_referencia, s.via_item_id, N'VIA_ATENCION',
            s.origen_item_id, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', s.consecutivo,
            s.establecimiento_id, s.oficina_local_id, s.region_id,
            DATEADD(HOUR, 8, CAST(s.fecha_referencia AS datetime2(0))), @usr,
            DATEADD(HOUR, 8, CAST(s.fecha_referencia AS datetime2(0))), @usr
        )
    OUTPUT s.work_id, inserted.referencia_id INTO @map_ref (work_id, referencia_id);

    UPDATE r
    SET referencia_id = m.referencia_id
    FROM #ref AS r
    INNER JOIN @map_ref AS m ON m.work_id = r.work_id;

    INSERT INTO dbo.ref_motivo (referencia_id, cat_item_id, motivo_catalogo, especificacion)
    SELECT referencia_id, motivo_ref_id, N'MOTIVO_REFERENCIA',
           N'Especificacion sintetica de prueba.'
    FROM #ref;

    INSERT INTO dbo.ref_contexto (
        referencia_id, servicios_texto, region_nombre, oficina_local_nombre,
        establecimiento_nombre, edad_anios
    )
    SELECT referencia_id,
           N'Servicio sintetico de prueba',
           N'Region ' + dr,
           N'OL ' + CONVERT(nvarchar(10), oficina_local_id),
           N'EST ' + CONVERT(nvarchar(10), establecimiento_id),
           edad
    FROM #ref;

    DECLARE @map_ses TABLE (
        work_id int NOT NULL PRIMARY KEY,
        sesion_id bigint NOT NULL
    );

    MERGE dbo.ses_sesion AS t
    USING (
        SELECT work_id, oficina_local_id, fecha_referencia
        FROM #ref
        WHERE estado <> N'PENDIENTE_REVISION'
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
        VALUES (
            s.oficina_local_id, s.fecha_referencia, '08:00:00', '09:30:00',
            N'Sala sintetica de prueba',
            DATEADD(HOUR, 8, CAST(s.fecha_referencia AS datetime2(0))), @usr
        )
    OUTPUT s.work_id, inserted.sesion_id INTO @map_ses (work_id, sesion_id);

    UPDATE r
    SET sesion_id = m.sesion_id
    FROM #ref AS r
    INNER JOIN @map_ses AS m ON m.work_id = r.work_id;

    INSERT INTO dbo.ses_disciplina (sesion_id, disciplina_item_id, disciplina_catalogo)
    SELECT sesion_id, CASE WHEN work_id % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA'
    FROM #ref
    WHERE sesion_id IS NOT NULL;

    DECLARE @map_sit TABLE (
        work_id int NOT NULL PRIMARY KEY,
        situacion_id bigint NOT NULL
    );

    MERGE dbo.ses_situacion AS t
    USING (
        SELECT work_id, sesion_id, referencia_id
        FROM #ref
        WHERE sesion_id IS NOT NULL
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (sesion_id, referencia_id, caso_id)
        VALUES (s.sesion_id, s.referencia_id, NULL)
    OUTPUT s.work_id, inserted.situacion_id INTO @map_sit (work_id, situacion_id);

    UPDATE r
    SET situacion_id = m.situacion_id
    FROM #ref AS r
    INNER JOIN @map_sit AS m ON m.work_id = r.work_id;

    DECLARE @map_val TABLE (
        work_id int NOT NULL PRIMARY KEY,
        valoracion_id bigint NOT NULL
    );

    MERGE dbo.ses_valoracion AS t
    USING (
        SELECT work_id, situacion_id, referencia_id, riesgo, proteccion, prioridad, fecha_referencia
        FROM #ref
        WHERE situacion_id IS NOT NULL
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
            @usr, s.fecha_referencia, DATEADD(HOUR, 10, CAST(s.fecha_referencia AS datetime2(0)))
        )
    OUTPUT s.work_id, inserted.valoracion_id INTO @map_val (work_id, valoracion_id);

    UPDATE r
    SET valoracion_id = m.valoracion_id
    FROM #ref AS r
    INNER JOIN @map_val AS m ON m.work_id = r.work_id;

    INSERT INTO dbo.ses_resolucion (
        referencia_id, sesion_id, valoracion_id, decision, justificacion,
        responsable_usuario, fecha_decision, registrada_en
    )
    SELECT referencia_id, sesion_id, valoracion_id,
           CASE WHEN abre_caso = 1 THEN N'REQUIERE_AI' ELSE N'NO_REQUIERE_AI' END,
           CASE
               WHEN abre_caso = 1 THEN NULL
               ELSE N'Justificacion sintetica: la referencia de prueba no abre caso.'
           END,
           @usr, fecha_referencia, DATEADD(HOUR, 11, CAST(fecha_referencia AS datetime2(0)))
    FROM #ref
    WHERE valoracion_id IS NOT NULL;

    CREATE TABLE #reval (
        work_id int NOT NULL PRIMARY KEY,
        sesion_id bigint NULL,
        situacion_id bigint NULL,
        valoracion_id bigint NULL
    );

    DECLARE @fase int = 1;
    DECLARE @map_caso TABLE (
        work_id int NOT NULL PRIMARY KEY,
        caso_id bigint NOT NULL
    );

    WHILE @fase <= 2
    BEGIN

    MERGE dbo.caso_ai AS t
    USING (
        SELECT work_id, per_id_persona, referencia_id, fecha_apertura, establecimiento_id,
               oficina_local_id, region_id, consecutivo, valoracion_id
        FROM #ref
        WHERE abre_caso = 1
          AND orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
            establecimiento_id, oficina_local_id, region_id, consecutivo_origen, valoracion_vigente_id
        )
        VALUES (
            s.per_id_persona, s.referencia_id, N'ACTIVO', s.fecha_apertura,
            DATEADD(HOUR, 11, CAST(s.fecha_apertura AS datetime2(0))), @usr,
            s.establecimiento_id, s.oficina_local_id, s.region_id, s.consecutivo, s.valoracion_id
        )
    OUTPUT s.work_id, inserted.caso_id INTO @map_caso (work_id, caso_id);

    UPDATE r
    SET caso_id = m.caso_id
    FROM #ref AS r
    INNER JOIN @map_caso AS m ON m.work_id = r.work_id;

    UPDATE v
    SET caso_id = r.caso_id
    FROM dbo.ses_valoracion AS v
    INNER JOIN #ref AS r ON r.valoracion_id = v.valoracion_id
    WHERE r.caso_id IS NOT NULL;

    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario)
    SELECT caso_id, N'ACTIVO', DATEADD(HOUR, 11, CAST(fecha_apertura AS datetime2(0))), @usr
    FROM #ref
    WHERE caso_id IS NOT NULL
      AND orden_ref = @fase;

    DECLARE @map_plan TABLE (
        work_id int NOT NULL PRIMARY KEY,
        plan_id bigint NOT NULL
    );

    MERGE dbo.caso_plan AS t
    USING (
        SELECT work_id, caso_id, frec_item_id, fecha_apertura
        FROM #ref
        WHERE caso_id IS NOT NULL
          AND orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
            responsable_usuario, fecha_plan, registrado_en
        )
        VALUES (
            s.caso_id, 1, 1, s.frec_item_id, N'FRECUENCIA', @usr, s.fecha_apertura,
            DATEADD(HOUR, 12, CAST(s.fecha_apertura AS datetime2(0)))
        )
    OUTPUT s.work_id, inserted.plan_id INTO @map_plan (work_id, plan_id);

    UPDATE r
    SET plan_id = m.plan_id
    FROM #ref AS r
    INNER JOIN @map_plan AS m ON m.work_id = r.work_id;

    INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
    SELECT plan_id, 1, N'Proposito sintetico de prueba. No sustituye un plan profesional.'
    FROM #ref
    WHERE plan_id IS NOT NULL
      AND orden_ref = @fase;

    INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
    SELECT plan_id, @estr, N'ESTRATEGIA'
    FROM #ref
    WHERE plan_id IS NOT NULL
      AND orden_ref = @fase;

    INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
    SELECT plan_id, CASE WHEN work_id % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA'
    FROM #ref
    WHERE plan_id IS NOT NULL
      AND orden_ref = @fase;

    UPDATE c
    SET plan_vigente_id = r.plan_id
    FROM dbo.caso_ai AS c
    INNER JOIN #ref AS r ON r.caso_id = c.caso_id
    WHERE r.plan_id IS NOT NULL
      AND r.orden_ref = @fase;

    UPDATE p
    SET es_vigente = 0
    FROM dbo.caso_plan AS p
    INNER JOIN #ref AS r ON r.plan_id = p.plan_id
    WHERE r.revisa_plan = 1
      AND r.orden_ref = @fase;

    DECLARE @map_plan2 TABLE (
        work_id int NOT NULL PRIMARY KEY,
        plan_id bigint NOT NULL
    );

    MERGE dbo.caso_plan AS t
    USING (
        SELECT work_id, caso_id, frec_item_id, fecha_apertura
        FROM #ref
        WHERE revisa_plan = 1
          AND orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
            responsable_usuario, fecha_plan, registrado_en
        )
        VALUES (
            s.caso_id, 2, 1, s.frec_item_id, N'FRECUENCIA', @usr,
            DATEADD(DAY, 90, s.fecha_apertura),
            DATEADD(HOUR, 12, CAST(DATEADD(DAY, 90, s.fecha_apertura) AS datetime2(0)))
        )
    OUTPUT s.work_id, inserted.plan_id INTO @map_plan2 (work_id, plan_id);

    UPDATE r
    SET plan_id = m.plan_id
    FROM #ref AS r
    INNER JOIN @map_plan2 AS m ON m.work_id = r.work_id;

    INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
    SELECT plan_id, 1, N'Revision sintetica del plan. No sustituye una revision profesional.'
    FROM #ref
    WHERE revisa_plan = 1
      AND orden_ref = @fase;

    INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
    SELECT plan_id, @estr, N'ESTRATEGIA'
    FROM #ref
    WHERE revisa_plan = 1
      AND orden_ref = @fase;

    INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
    SELECT plan_id, @disc2, N'DISCIPLINA'
    FROM #ref
    WHERE revisa_plan = 1
      AND orden_ref = @fase;

    UPDATE c
    SET plan_vigente_id = r.plan_id
    FROM dbo.caso_ai AS c
    INNER JOIN #ref AS r ON r.caso_id = c.caso_id
    WHERE r.revisa_plan = 1
      AND r.orden_ref = @fase;

    INSERT INTO dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta, instrumento_version_id)
    SELECT valoracion_id, @cat_prot,
           CASE WHEN riesgo = N'BAJO' AND proteccion = N'ALTA' THEN N'NINGUNO' ELSE N'FACTORES' END,
           @inst
    FROM #ref
    WHERE valoracion_id IS NOT NULL
      AND orden_ref = @fase
    UNION ALL
    SELECT valoracion_id, @cat_riesgo, N'FACTORES', @inst
    FROM #ref
    WHERE valoracion_id IS NOT NULL
      AND orden_ref = @fase;

    INSERT INTO dbo.ses_valoracion_factor (
        valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace
    )
    SELECT valoracion_id, @cat_prot, @fac_prot, NULL, N'FACTORES'
    FROM #ref
    WHERE valoracion_id IS NOT NULL
      AND orden_ref = @fase
      AND NOT (riesgo = N'BAJO' AND proteccion = N'ALTA')
    UNION ALL
    SELECT valoracion_id, @cat_riesgo, @fac_riesgo, N'Especificacion sintetica de prueba', N'FACTORES'
    FROM #ref
    WHERE valoracion_id IS NOT NULL
      AND orden_ref = @fase;

    INSERT INTO #reval (work_id)
    SELECT work_id FROM #ref WHERE revalora = 1 AND orden_ref = @fase;

    DECLARE @map_reval_ses TABLE (
        work_id int NOT NULL PRIMARY KEY,
        sesion_id bigint NOT NULL
    );

    MERGE dbo.ses_sesion AS t
    USING (
        SELECT r.work_id, r.oficina_local_id, r.fecha_reval
        FROM #ref AS r
        WHERE r.revalora = 1
          AND r.orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
        VALUES (
            s.oficina_local_id, s.fecha_reval, '10:00:00', '11:00:00',
            N'Sala sintetica de revaloracion',
            DATEADD(HOUR, 10, CAST(s.fecha_reval AS datetime2(0))), @usr
        )
    OUTPUT s.work_id, inserted.sesion_id INTO @map_reval_ses (work_id, sesion_id);

    UPDATE rv
    SET sesion_id = m.sesion_id
    FROM #reval AS rv
    INNER JOIN @map_reval_ses AS m ON m.work_id = rv.work_id;

    INSERT INTO dbo.ses_disciplina (sesion_id, disciplina_item_id, disciplina_catalogo)
    SELECT rv.sesion_id, @disc, N'DISCIPLINA'
    FROM #reval AS rv
    INNER JOIN #ref AS r ON r.work_id = rv.work_id
    WHERE r.orden_ref = @fase
      AND rv.sesion_id IS NOT NULL;

    DECLARE @map_reval_sit TABLE (
        work_id int NOT NULL PRIMARY KEY,
        situacion_id bigint NOT NULL
    );

    MERGE dbo.ses_situacion AS t
    USING (
        SELECT rv.work_id, rv.sesion_id, r.caso_id
        FROM #reval AS rv
        INNER JOIN #ref AS r ON r.work_id = rv.work_id
        WHERE r.orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (sesion_id, referencia_id, caso_id)
        VALUES (s.sesion_id, NULL, s.caso_id)
    OUTPUT s.work_id, inserted.situacion_id INTO @map_reval_sit (work_id, situacion_id);

    UPDATE rv
    SET situacion_id = m.situacion_id
    FROM #reval AS rv
    INNER JOIN @map_reval_sit AS m ON m.work_id = rv.work_id;

    UPDATE v
    SET es_vigente = 0
    FROM dbo.ses_valoracion AS v
    INNER JOIN #ref AS r ON r.valoracion_id = v.valoracion_id
    WHERE r.revalora = 1
      AND r.orden_ref = @fase;

    DECLARE @map_reval_val TABLE (
        work_id int NOT NULL PRIMARY KEY,
        valoracion_id bigint NOT NULL
    );

    MERGE dbo.ses_valoracion AS t
    USING (
        SELECT r.work_id, rv.situacion_id, r.caso_id, r.referencia_id, r.fecha_reval,
               m.riesgo, m.proteccion, m.prioridad
        FROM #reval AS rv
        INNER JOIN #ref AS r ON r.work_id = rv.work_id
        INNER JOIN #matriz AS m ON m.n = ((r.matriz_n + 3) % 9)
        WHERE r.orden_ref = @fase
    ) AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
            matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
            responsable_usuario, fecha_valoracion, confirmada_en
        )
        VALUES (
            s.situacion_id, s.caso_id, s.referencia_id, @inst, 2, 1,
            @matriz, s.riesgo, s.proteccion, s.prioridad,
            @usr, s.fecha_reval, DATEADD(HOUR, 11, CAST(s.fecha_reval AS datetime2(0)))
        )
    OUTPUT s.work_id, inserted.valoracion_id INTO @map_reval_val (work_id, valoracion_id);

    UPDATE rv
    SET valoracion_id = m.valoracion_id
    FROM #reval AS rv
    INNER JOIN @map_reval_val AS m ON m.work_id = rv.work_id;

    INSERT INTO dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta, instrumento_version_id)
    SELECT rv.valoracion_id, @cat_prot,
           CASE WHEN m.riesgo = N'BAJO' AND m.proteccion = N'ALTA' THEN N'NINGUNO' ELSE N'FACTORES' END,
           @inst
    FROM #reval AS rv
    INNER JOIN #ref AS r ON r.work_id = rv.work_id
    INNER JOIN #matriz AS m ON m.n = ((r.matriz_n + 3) % 9)
    WHERE r.orden_ref = @fase
    UNION ALL
    SELECT rv.valoracion_id, @cat_riesgo, N'FACTORES', @inst
    FROM #reval AS rv
    INNER JOIN #ref AS r ON r.work_id = rv.work_id
    WHERE r.orden_ref = @fase;

    INSERT INTO dbo.ses_valoracion_factor (
        valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace
    )
    SELECT rv.valoracion_id, @cat_prot, @fac_prot, NULL, N'FACTORES'
    FROM #reval AS rv
    INNER JOIN #ref AS r ON r.work_id = rv.work_id
    INNER JOIN #matriz AS m ON m.n = ((r.matriz_n + 3) % 9)
    WHERE r.orden_ref = @fase
      AND NOT (m.riesgo = N'BAJO' AND m.proteccion = N'ALTA')
    UNION ALL
    SELECT rv.valoracion_id, @cat_riesgo, @fac_riesgo, N'Especificacion sintetica de revaloracion', N'FACTORES'
    FROM #reval AS rv
    INNER JOIN #ref AS r ON r.work_id = rv.work_id
    WHERE r.orden_ref = @fase;

    UPDATE c
    SET valoracion_vigente_id = rv.valoracion_id
    FROM dbo.caso_ai AS c
    INNER JOIN #ref AS r ON r.caso_id = c.caso_id AND r.revalora = 1 AND r.orden_ref = @fase
    INNER JOIN #reval AS rv ON rv.work_id = r.work_id
    WHERE rv.valoracion_id IS NOT NULL;

    ;WITH n AS (
        SELECT 1 AS k
        UNION ALL SELECT 2
        UNION ALL SELECT 3
        UNION ALL SELECT 4
        UNION ALL SELECT 5
        UNION ALL SELECT 6
        UNION ALL SELECT 7
        UNION ALL SELECT 8
    )
    INSERT INTO dbo.ate_individual (
        caso_id, per_id_persona, fecha_atencion, disciplina_item_id, disciplina_catalogo,
        estrategia_item_id, estrategia_catalogo, acciones, recomendaciones,
        profesional_usuario, digitador_usuario, digitada_en
    )
    SELECT r.caso_id, r.per_id_persona, DATEADD(DAY, r.spacing_days * n.k, r.fecha_apertura),
           CASE WHEN n.k % 2 = 0 THEN @disc ELSE @disc2 END, N'DISCIPLINA',
           @estr, N'ESTRATEGIA',
           N'Accion sintetica de prueba. No es un registro clinico.',
           N'Recomendacion sintetica de prueba.',
           @usr, @usr,
           DATEADD(HOUR, 15, CAST(DATEADD(DAY, r.spacing_days * n.k, r.fecha_apertura) AS datetime2(0)))
    FROM #ref AS r
    INNER JOIN n ON n.k <= r.n_atenciones
    WHERE r.caso_id IS NOT NULL
      AND r.orden_ref = @fase
      AND DATEADD(DAY, r.spacing_days * n.k, r.fecha_apertura) > r.fecha_apertura
      AND DATEADD(DAY, r.spacing_days * n.k, r.fecha_apertura) < COALESCE(r.fecha_cierre, CONVERT(date, '20261101'));

    IF EXISTS (
        SELECT 1
        FROM dbo.ate_individual AS i
        INNER JOIN #ref AS r ON r.caso_id = i.caso_id
        WHERE i.fecha_atencion < r.fecha_apertura
           OR (r.fecha_cierre IS NOT NULL AND i.fecha_atencion >= r.fecha_cierre)
    )
        THROW 51071, N'Una atencion quedo fuera de la vigencia del caso.', 1;

    DECLARE @c_caso bigint;
    DECLARE @c_per nvarchar(20);
    DECLARE @c_motivo bigint;
    DECLARE @c_expl nvarchar(2000);
    DECLARE @c_fecha date;
    DECLARE @c_dest_est int;
    DECLARE @c_dest_ol int;
    DECLARE @c_dest_reg int;
    DECLARE @c_dest_nom nvarchar(200);
    DECLARE @c_ocurrido datetime2(0);

    DECLARE cierre CURSOR LOCAL FAST_FORWARD FOR
        SELECT caso_id, per_id_persona, motivo_item_id, explicacion, fecha_cierre,
               destino_est, destino_ol, destino_region,
               CASE WHEN motivo_cierre = N'TRASLADO' THEN N'Destino sintetico de prueba' ELSE NULL END
        FROM #ref
        WHERE cierra = 1
          AND caso_id IS NOT NULL
          AND orden_ref = @fase
        ORDER BY fecha_cierre, caso_id;

    OPEN cierre;
    FETCH NEXT FROM cierre INTO @c_caso, @c_per, @c_motivo, @c_expl, @c_fecha, @c_dest_est, @c_dest_ol, @c_dest_reg, @c_dest_nom;
    WHILE @@FETCH_STATUS = 0
    BEGIN
        SET @c_ocurrido = DATEADD(HOUR, 16, CAST(@c_fecha AS datetime2(0)));
        EXEC ops.cerrar_caso
            @caso_id = @c_caso,
            @per_id_persona = @c_per,
            @motivo_item_id = @c_motivo,
            @explicacion = @c_expl,
            @fecha_cierre = @c_fecha,
            @responsable_usuario = @usr,
            @usuario = @usr,
            @ocurrido_en = @c_ocurrido,
            @destino_establecimiento_id = @c_dest_est,
            @destino_oficina_local_id = @c_dest_ol,
            @destino_region_id = @c_dest_reg,
            @destino_nombre = @c_dest_nom;
        FETCH NEXT FROM cierre INTO @c_caso, @c_per, @c_motivo, @c_expl, @c_fecha, @c_dest_est, @c_dest_ol, @c_dest_reg, @c_dest_nom;
    END
    CLOSE cierre;
    DEALLOCATE cierre;

    SET @fase = @fase + 1;
    END

    DECLARE @n_grupos int = CASE WHEN @n_personas <= 150 THEN 6 WHEN @n_personas <= 1000 THEN 36 ELSE 160 END;

    CREATE TABLE #grupo (
        local_id int IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        oficina_local_id int NOT NULL,
        establecimiento_id int NOT NULL,
        region_id int NOT NULL,
        fecha_atencion date NOT NULL
    );

    INSERT INTO #grupo (oficina_local_id, establecimiento_id, region_id, fecha_atencion)
    SELECT TOP (@n_grupos)
        oficina_local_id,
        MIN(establecimiento_id),
        MIN(region_id),
        DATEFROMPARTS(2024 + (MIN(establecimiento_id) % 3), 4, 12)
    FROM #persona
    GROUP BY oficina_local_id
    HAVING COUNT(*) >= 2
    ORDER BY oficina_local_id;

    DECLARE @map_grupo TABLE (
        local_id int NOT NULL PRIMARY KEY,
        atencion_grupal_id bigint NOT NULL
    );

    MERGE dbo.ate_grupal AS t
    USING #grupo AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            oficina_local_id, establecimiento_id, fecha_atencion, tipo_item_id, tipo_catalogo,
            tema, lugar, acciones, recomendaciones, digitador_usuario, digitada_en
        )
        VALUES (
            s.oficina_local_id, s.establecimiento_id, s.fecha_atencion, @tipo_ate, N'TIPO_ATENCION',
            N'Taller sintetico de prueba ' + @escala,
            N'Espacio sintetico',
            N'Accion grupal sintetica de prueba.',
            N'Recomendacion grupal sintetica de prueba.',
            @usr, DATEADD(HOUR, 15, CAST(s.fecha_atencion AS datetime2(0)))
        )
    OUTPUT s.local_id, inserted.atencion_grupal_id INTO @map_grupo (local_id, atencion_grupal_id);

    INSERT INTO dbo.ate_grupal_disciplina (atencion_grupal_id, disciplina_item_id, disciplina_catalogo)
    SELECT atencion_grupal_id, @disc, N'DISCIPLINA'
    FROM @map_grupo;

    INSERT INTO dbo.ate_grupal_profesional (atencion_grupal_id, profesional_usuario)
    SELECT atencion_grupal_id, @usr
    FROM @map_grupo;

    INSERT INTO dbo.ate_grupal_participante (atencion_grupal_id, per_id_persona, caso_id, asistio)
    SELECT m.atencion_grupal_id, q.per_id_persona,
           CASE
               WHEN q.fecha_apertura IS NOT NULL AND q.fecha_apertura <= g.fecha_atencion THEN q.caso_id
               ELSE NULL
           END,
           q.asistio
    FROM #grupo AS g
    INNER JOIN @map_grupo AS m ON m.local_id = g.local_id
    CROSS APPLY (
        SELECT TOP (5)
            p.per_id_persona,
            r.caso_id,
            r.fecha_apertura,
            CASE (ROW_NUMBER() OVER (ORDER BY p.per_id_persona)) % 5
                WHEN 0 THEN CAST(NULL AS bit)
                WHEN 1 THEN CAST(0 AS bit)
                ELSE CAST(1 AS bit)
            END AS asistio
        FROM #persona AS p
        LEFT JOIN #ref AS r
            ON r.per_id_persona = p.per_id_persona
           AND r.es_activo = 1
        WHERE p.oficina_local_id = g.oficina_local_id
        ORDER BY p.per_id_persona
    ) AS q;

    CREATE TABLE #prog (
        prog_local int IDENTITY(1, 1) NOT NULL PRIMARY KEY,
        caso_id bigint NULL,
        per_id_persona nvarchar(20) COLLATE Latin1_General_100_CI_AS NULL,
        oficina_local_id int NOT NULL,
        establecimiento_id int NULL,
        region_id int NOT NULL,
        estado nvarchar(20) COLLATE Latin1_General_100_CI_AS NOT NULL,
        fecha_prevista date NOT NULL,
        fecha_vigente date NOT NULL,
        motivo nvarchar(500) COLLATE Latin1_General_100_CI_AS NULL,
        actividad_id bigint NULL
    );

    INSERT INTO #prog (
        caso_id, per_id_persona, oficina_local_id, establecimiento_id, region_id,
        estado, fecha_prevista, fecha_vigente, motivo
    )
    SELECT r.caso_id, r.per_id_persona, r.oficina_local_id, r.establecimiento_id, r.region_id,
           s.estado, s.fecha_prevista,
           CASE WHEN s.estado = N'REPROGRAMADA' THEN DATEADD(DAY, 21, s.fecha_prevista) ELSE s.fecha_prevista END,
           CASE WHEN s.estado IN (N'CANCELADA', N'REPROGRAMADA') THEN N'Motivo sintetico de prueba' ELSE NULL END
    FROM #ref AS r
    CROSS APPLY (
        SELECT
            CASE r.work_id % 5
                WHEN 0 THEN N'PROGRAMADA'
                WHEN 1 THEN N'PROGRAMADA'
                WHEN 2 THEN N'REALIZADA'
                WHEN 3 THEN N'CANCELADA'
                ELSE N'REPROGRAMADA'
            END AS estado,
            CASE r.work_id % 5
                WHEN 0 THEN CONVERT(date, '20261215')
                WHEN 1 THEN CASE
                    WHEN DATEADD(DAY, 14, r.fecha_apertura) < CONVERT(date, '20261101')
                        THEN DATEADD(DAY, 14, r.fecha_apertura)
                    ELSE CONVERT(date, '20261215')
                END
                ELSE CASE
                    WHEN DATEADD(DAY, 40, r.fecha_apertura) < CONVERT(date, '20261101')
                        THEN DATEADD(DAY, 40, r.fecha_apertura)
                    ELSE r.fecha_apertura
                END
            END AS fecha_prevista
    ) AS s
    WHERE r.es_activo = 1;

    INSERT INTO #prog (
        oficina_local_id, region_id, estado, fecha_prevista, fecha_vigente, motivo
    )
    SELECT p.oficina_local_id, p.region_id, v.estado, v.fecha_prevista, v.fecha_vigente, v.motivo
    FROM (
        SELECT TOP (1) oficina_local_id, region_id
        FROM #persona
        ORDER BY per_id_persona
    ) AS p
    CROSS JOIN (VALUES
        (N'PROGRAMADA', CONVERT(date, '20261220'), CONVERT(date, '20261220'), CAST(NULL AS nvarchar(500))),
        (N'PROGRAMADA', CONVERT(date, '20260201'), CONVERT(date, '20260201'), CAST(NULL AS nvarchar(500))),
        (N'CANCELADA', CONVERT(date, '20260301'), CONVERT(date, '20260301'), N'Motivo sintetico de prueba')
    ) AS v (estado, fecha_prevista, fecha_vigente, motivo);

    DECLARE @map_prog TABLE (
        prog_local int NOT NULL PRIMARY KEY,
        actividad_id bigint NOT NULL
    );

    MERGE dbo.prog_actividad AS t
    USING #prog AS s
    ON 1 = 0
    WHEN NOT MATCHED THEN
        INSERT (
            oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo,
            titulo, fecha_prevista, fecha_vigente, estado, motivo_vigente, creada_en, creada_por
        )
        VALUES (
            s.oficina_local_id, s.establecimiento_id, s.region_id, @tipo_prog, N'TIPO_ACTIVIDAD_PROGRAMADA',
            N'Actividad sintetica de prueba ' + @escala,
            s.fecha_prevista, s.fecha_vigente, s.estado, s.motivo,
            CONVERT(datetime2(0), '2026-01-10T08:00:00'), @usr
        )
    OUTPUT s.prog_local, inserted.actividad_id INTO @map_prog (prog_local, actividad_id);

    UPDATE p
    SET actividad_id = m.actividad_id
    FROM #prog AS p
    INNER JOIN @map_prog AS m ON m.prog_local = p.prog_local;

    INSERT INTO dbo.prog_cambio (
        actividad_id, numero, estado_anterior, estado_nuevo, fecha_anterior, fecha_nueva, motivo, usuario, ocurrido_en
    )
    SELECT actividad_id, 1, N'PROGRAMADA', estado, fecha_prevista, fecha_vigente, motivo, @usr,
           CONVERT(datetime2(0), '2026-01-11T08:00:00')
    FROM #prog
    WHERE estado IN (N'CANCELADA', N'REPROGRAMADA');

    INSERT INTO dbo.prog_persona (actividad_id, per_id_persona, caso_id)
    SELECT actividad_id, per_id_persona, caso_id
    FROM #prog
    WHERE per_id_persona IS NOT NULL;

    INSERT INTO dbo.ref_posible (
        per_id_persona, establecimiento_id, oficina_local_id, region_id,
        criterio_codigo, fecha_deteccion, sistema_origen, estado, referencia_id
    )
    SELECT per_id_persona, establecimiento_id, oficina_local_id, region_id,
           N'SYN_CRITERIO_TAMIZAJE', CONVERT(date, '20260120'), N'SYN_TEST', N'PENDIENTE', NULL
    FROM #persona
    WHERE perfil = N'VINCULO'
      AND (CHECKSUM(@semilla, per_id_persona) & 3) = 0;

    INSERT INTO dbo.ref_posible (
        per_id_persona, establecimiento_id, oficina_local_id, region_id,
        criterio_codigo, fecha_deteccion, sistema_origen, estado, referencia_id
    )
    SELECT per_id_persona, establecimiento_id, oficina_local_id, region_id,
           N'SYN_CRITERIO_TAMIZAJE', fecha_referencia, N'SYN_TEST', N'REFERENCIA_CREADA', referencia_id
    FROM #ref
    WHERE perfil = N'PENDIENTE';

    INSERT INTO dbo.ref_impresion (referencia_id, usuario, impresa_en)
    SELECT referencia_id, @usr, DATEADD(HOUR, 9, CAST(fecha_referencia AS datetime2(0)))
    FROM #ref
    WHERE abre_caso = 1;

    DECLARE @den int;
    DECLARE @num int;
    SELECT @den = COUNT(*)
    FROM dbo.caso_ai
    WHERE estado = N'ACTIVO';

    SELECT @num = COUNT(*)
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND (
          EXISTS (
              SELECT 1
              FROM dbo.ate_individual AS i
              WHERE i.caso_id = c.caso_id
                AND i.fecha_atencion >= CONVERT(date, '20260101')
                AND i.fecha_atencion < CONVERT(date, '20270101')
          )
          OR EXISTS (
              SELECT 1
              FROM dbo.ate_grupal_participante AS p
              INNER JOIN dbo.ate_grupal AS g ON g.atencion_grupal_id = p.atencion_grupal_id
              WHERE p.caso_id = c.caso_id
                AND p.asistio = 1
                AND g.fecha_atencion >= CONVERT(date, '20260101')
                AND g.fecha_atencion < CONVERT(date, '20270101')
          )
      );

    DECLARE @informe bigint;
    INSERT INTO dbo.inf_informe (
        titulo, responsable_usuario, rol_codigo, ambito_nivel, periodo_anio,
        filtros_resumen, corte_en, generado_en
    )
    VALUES (
        N'PRUEBA ESCALA ' + @escala + N' nacional',
        @usr, N'ROL_PRUEBA', N'NACIONAL', 2026,
        N'anio=2026;ambito=NACIONAL;fuente=PRUEBA_SINTETICA;semilla=' + CONVERT(nvarchar(20), @semilla),
        CONVERT(datetime2(0), '2026-11-05T12:00:00'),
        CONVERT(datetime2(0), '2026-11-05T12:00:00')
    );
    SET @informe = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.inf_visualizacion (informe_id, codigo_visualizacion, orden, titulo, filtros, analisis)
    SELECT @informe, v.codigo, v.codigo, v.titulo, N'anio=2026;ambito=NACIONAL',
           N'[PRUEBA SINTETICA] ' + v.titulo + N'. No es un analisis profesional.'
    FROM (VALUES
        (1, N'Casos por establecimiento'),
        (2, N'Sexo: lo aporta el adaptador, no esta tabla'),
        (3, N'Edad: la aporta el adaptador; el contexto solo guarda un snapshot'),
        (4, N'Prioridad vigente'),
        (5, N'Estado actual'),
        (6, N'Cancelaciones'),
        (7, N'Motivos de referencia'),
        (8, N'Atenciones efectivas'),
        (9, N'Motivos de cierre'),
        (10, N'Cierres Otro'),
        (11, N'Cobertura anual por personas unicas'),
        (12, N'Casos activos sin atencion en el anio')
    ) AS v (codigo, titulo);

    INSERT INTO dbo.inf_agregado (visualizacion_id, orden, etiqueta, valor_numerico, valor_texto)
    SELECT vi.visualizacion_id, 1, N'denominador_activos', @den, NULL
    FROM dbo.inf_visualizacion AS vi
    WHERE vi.informe_id = @informe
      AND vi.codigo_visualizacion = 11
    UNION ALL
    SELECT vi.visualizacion_id, 2, N'numerador_con_atencion_2026', @num, NULL
    FROM dbo.inf_visualizacion AS vi
    WHERE vi.informe_id = @informe
      AND vi.codigo_visualizacion = 11
    UNION ALL
    SELECT vi.visualizacion_id, 1, N'nota', NULL, N'PRUEBA SINTETICA'
    FROM dbo.inf_visualizacion AS vi
    WHERE vi.informe_id = @informe
      AND vi.codigo_visualizacion <> 11;

    DECLARE @region int = (SELECT MIN(region_id) FROM #persona);
    DECLARE @oficina int = (SELECT MIN(oficina_local_id) FROM #persona);
    DECLARE @informe_r bigint;
    INSERT INTO dbo.inf_informe (
        titulo, responsable_usuario, rol_codigo, ambito_nivel, region_id, periodo_anio,
        filtros_resumen, corte_en, generado_en
    )
    VALUES (
        N'PRUEBA ESCALA ' + @escala + N' region',
        @usr, N'ROL_PRUEBA', N'REGION', @region, 2026,
        N'anio=2026;ambito=REGION;fuente=PRUEBA_SINTETICA',
        CONVERT(datetime2(0), '2026-11-05T12:00:00'),
        CONVERT(datetime2(0), '2026-11-05T12:00:00')
    );
    SET @informe_r = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.inf_visualizacion (informe_id, codigo_visualizacion, orden, titulo, filtros, analisis)
    SELECT @informe_r, v.n, v.n, N'Visualizacion regional de prueba ' + CONVERT(nvarchar(10), v.n),
           N'region=' + CONVERT(nvarchar(10), @region),
           N'[PRUEBA SINTETICA] Contenido regional de prueba.'
    FROM (VALUES (1), (2), (3), (4), (5), (6), (7), (8)) AS v (n);

    INSERT INTO dbo.inf_agregado (visualizacion_id, orden, etiqueta, valor_texto)
    SELECT visualizacion_id, 1, N'nota', N'PRUEBA SINTETICA'
    FROM dbo.inf_visualizacion
    WHERE informe_id = @informe_r;

    DECLARE @informe_o bigint;
    INSERT INTO dbo.inf_informe (
        titulo, responsable_usuario, rol_codigo, ambito_nivel, oficina_local_id, periodo_anio,
        filtros_resumen, corte_en, generado_en
    )
    VALUES (
        N'PRUEBA ESCALA ' + @escala + N' oficina',
        @usr, N'ROL_PRUEBA', N'OFICINA_LOCAL', @oficina, 2026,
        N'anio=2026;ambito=OFICINA_LOCAL;fuente=PRUEBA_SINTETICA',
        CONVERT(datetime2(0), '2026-11-05T12:00:00'),
        CONVERT(datetime2(0), '2026-11-05T12:00:00')
    );
    SET @informe_o = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.inf_visualizacion (informe_id, codigo_visualizacion, orden, titulo, filtros, analisis)
    SELECT @informe_o, v.n, v.n, N'Visualizacion de oficina de prueba ' + CONVERT(nvarchar(10), v.n),
           N'oficina=' + CONVERT(nvarchar(10), @oficina),
           N'[PRUEBA SINTETICA] Contenido de oficina de prueba.'
    FROM (VALUES (1), (2), (3), (4), (5)) AS v (n);

    INSERT INTO dbo.inf_agregado (visualizacion_id, orden, etiqueta, valor_texto)
    SELECT visualizacion_id, 1, N'nota', N'PRUEBA SINTETICA'
    FROM dbo.inf_visualizacion
    WHERE informe_id = @informe_o;

    INSERT INTO dbo.aud_evento (
        ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio
    )
    SELECT DATEADD(HOUR, 11, CAST(fecha_apertura AS datetime2(0))),
           @usr, N'ROL_PRUEBA', N'APERTURA', N'caso_ai',
           CONVERT(nvarchar(40), caso_id),
           N'OL ' + CONVERT(nvarchar(10), oficina_local_id),
           N'SYN_SCALE'
    FROM #ref
    WHERE caso_id IS NOT NULL;

    INSERT INTO dbo.aud_migracion_lote (
        fuente, usuario, iniciado_en, cerrado_en, filas_aceptadas, filas_rechazadas
    )
    VALUES (
        N'SYN-SCALE:' + @escala + N':seed:' + CONVERT(nvarchar(20), @semilla),
        @usr, @inicio, CAST(SYSUTCDATETIME() AS datetime2(0)), @n_personas, 0
    );

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF CURSOR_STATUS(N'local', N'cierre') > 0
        CLOSE cierre;
    IF CURSOR_STATUS(N'local', N'cierre') >= -1
        DEALLOCATE cierre;
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH

PRINT N'Escala ' + @escala + N' insertada. Personas ' + CONVERT(nvarchar(20), @n_personas)
    + N'. Referencias ' + CONVERT(nvarchar(20), @n_refs) + N'.';
GO
