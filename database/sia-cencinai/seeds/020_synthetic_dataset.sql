/*
SIA_CENCINAI — semilla 020_synthetic_dataset

CLASIFICACION: SYNTHETIC. No es semilla productiva.
Identificadores PER compatibles con SIDINACC_LOCAL: SYN-<establecimiento>-<nn>.
No copia nombres ni textos clinicos de la replica.
El criterio de posible referencia SYN_CRITERIO_TAMIZAJE no es un catalogo oficial.

Escenario, para las pruebas de reporteria:
- Activos OL 101 / region 1: SYN-1100102-01 y SYN-1100102-06. Cobertura 2026: D=2, N=1.
- Activo OL 301 / region 3: SYN-5010104-01. D=1, N=1.
- Nacional 2026: D=3, N=2. No es el promedio de los porcentajes de oficina.
- Cerrados: satisfactorio y traslado, sin caso sucesor.
- SYN-1100102-04 solo tiene referencia pendiente.
- SYN-1100102-05 participa en grupal sin caso.

Cambie @permitir_sintetico a 1 solo en una base de desarrollo aislada.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @permitir_sintetico bit = 0;
IF @permitir_sintetico <> 1
    THROW 51030, N'Datos sinteticos bloqueados. Cambie @permitir_sintetico a 1 solo en desarrollo aislado.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.cat_item
    WHERE codigo_catalogo = N'VIA_ATENCION' AND codigo = N'URGENCIA'
)
    THROW 51031, N'Falta la semilla confirmada 010_confirmed_catalogs.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.ref_referencia
    WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-001-2026'
)
BEGIN
    PRINT N'El conjunto sintetico ya esta presente.';
    RETURN;
END

DECLARE @usr nvarchar(128) = N'sintetico.local.01';
DECLARE @dig nvarchar(128) = N'sintetico.digitador.01';
DECLARE @t datetime2(0) = '2026-02-01T08:00:00';
DECLARE @via bigint;
DECLARE @origen bigint;
DECLARE @motivo bigint;
DECLARE @frec bigint;
DECLARE @tipo_prog bigint;
DECLARE @cierre_ok bigint;
DECLARE @cierre_traslado bigint;
DECLARE @matriz bigint;
DECLARE @ver_disc bigint;
DECLARE @ver_est bigint;
DECLARE @ver_tipo bigint;
DECLARE @disc bigint;
DECLARE @estr bigint;
DECLARE @tipo_ate bigint;
DECLARE @inst bigint;
DECLARE @cat_prot bigint;
DECLARE @cat_riesgo bigint;
DECLARE @fac_prot bigint;
DECLARE @fac_riesgo bigint;

SELECT @via = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'VIA_ATENCION' AND codigo = N'URGENCIA';
SELECT @origen = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'ORIGEN_REFERENCIA' AND codigo = N'VIGILANCIA_TAMIZAJE';
SELECT @motivo = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'MOTIVO_REFERENCIA' AND codigo = N'CONDICION_MALNUTRICION';
SELECT @frec = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'FRECUENCIA' AND codigo = N'TRIMESTRAL';
SELECT @tipo_prog = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'TIPO_ACTIVIDAD_PROGRAMADA' AND codigo = N'SESION_INTERDISCIPLINARIA';
SELECT @cierre_ok = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'CIERRE_SATISFACTORIO';
SELECT @cierre_traslado = cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'TRASLADO';
SELECT @matriz = cat_version_id FROM dbo.cat_version WHERE codigo_catalogo = N'MATRIZ_PRIORIDAD' AND numero_version = 1;

IF @via IS NULL OR @origen IS NULL OR @motivo IS NULL OR @frec IS NULL
    OR @tipo_prog IS NULL OR @cierre_ok IS NULL OR @cierre_traslado IS NULL OR @matriz IS NULL
    THROW 51032, N'No se pudieron resolver los catalogos confirmados.', 1;

BEGIN TRY
    BEGIN TRANSACTION;

    INSERT INTO dbo.cat_version (codigo_catalogo, numero_version, vigente, vigente_desde)
    VALUES
        (N'DISCIPLINA', 1, 1, '20261105'),
        (N'ESTRATEGIA', 1, 1, '20261105'),
        (N'TIPO_ATENCION', 1, 1, '20261105');

    SELECT @ver_disc = cat_version_id FROM dbo.cat_version WHERE codigo_catalogo = N'DISCIPLINA' AND numero_version = 1;
    SELECT @ver_est = cat_version_id FROM dbo.cat_version WHERE codigo_catalogo = N'ESTRATEGIA' AND numero_version = 1;
    SELECT @ver_tipo = cat_version_id FROM dbo.cat_version WHERE codigo_catalogo = N'TIPO_ATENCION' AND numero_version = 1;

    INSERT INTO dbo.cat_item (cat_version_id, codigo_catalogo, codigo, etiqueta, orden, requiere_texto, ambito, activo)
    VALUES
        (@ver_disc, N'DISCIPLINA', N'SYN_NUTRICION', N'Disciplina sintetica nutricion', 1, 0, NULL, 1),
        (@ver_disc, N'DISCIPLINA', N'SYN_TRABAJO_SOCIAL', N'Disciplina sintetica trabajo social', 2, 0, NULL, 1),
        (@ver_est, N'ESTRATEGIA', N'SYN_ACOMPANAMIENTO', N'Estrategia sintetica de acompanamiento', 1, 0, NULL, 1),
        (@ver_tipo, N'TIPO_ATENCION', N'SYN_TALLER', N'Tipo sintetico de taller', 1, 0, NULL, 1);

    SELECT @disc = cat_item_id FROM dbo.cat_item WHERE codigo = N'SYN_NUTRICION';
    SELECT @estr = cat_item_id FROM dbo.cat_item WHERE codigo = N'SYN_ACOMPANAMIENTO';
    SELECT @tipo_ate = cat_item_id FROM dbo.cat_item WHERE codigo = N'SYN_TALLER';

    INSERT INTO dbo.cat_instrumento_version (numero_version, vigente, vigente_desde)
    VALUES (1, 1, '20261105');
    SET @inst = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.cat_instrumento_categoria (instrumento_version_id, eje, ambito, es_requerida, orden)
    VALUES
        (@inst, N'PROTECTOR', N'INDIVIDUAL', 1, 1),
        (@inst, N'RIESGO', N'INDIVIDUAL', 1, 2);
    SELECT @cat_prot = categoria_id FROM dbo.cat_instrumento_categoria WHERE instrumento_version_id = @inst AND eje = N'PROTECTOR';
    SELECT @cat_riesgo = categoria_id FROM dbo.cat_instrumento_categoria WHERE instrumento_version_id = @inst AND eje = N'RIESGO';

    INSERT INTO dbo.cat_instrumento_factor (categoria_id, codigo, etiqueta, es_abierto, orden, activo)
    VALUES
        (@cat_prot, N'SYN_PROT_01', N'Factor sintetico protector', 0, 1, 1),
        (@cat_riesgo, N'SYN_RIESGO_01', N'Factor sintetico de riesgo', 1, 1, 1);
    SELECT @fac_prot = factor_id FROM dbo.cat_instrumento_factor WHERE codigo = N'SYN_PROT_01';
    SELECT @fac_riesgo = factor_id FROM dbo.cat_instrumento_factor WHERE codigo = N'SYN_RIESGO_01';

    INSERT INTO dbo.vinculo_persona (per_id_persona, primera_operacion_en)
    VALUES
        (N'SYN-1100102-01', @t),
        (N'SYN-1100102-02', @t),
        (N'SYN-1100102-03', @t),
        (N'SYN-1100102-04', @t),
        (N'SYN-1100102-05', @t),
        (N'SYN-1100102-06', @t),
        (N'SYN-5010104-01', @t);

    DECLARE @r01 bigint, @r01b bigint, @r02a bigint, @r02b bigint, @r03 bigint, @r04 bigint, @r05 bigint, @r07 bigint;

    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-01', N'PENDIENTE_REVISION', '20260201', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-001-2026', 1100102, 101, 1, @t, @usr, @t, @usr);
    SET @r01 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-01', N'PENDIENTE_REVISION', '20240115', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-007-2024', 1100102, 101, 1, '2024-01-15T09:00:00', @usr, '2024-01-15T09:00:00', @usr);
    SET @r01b = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-02', N'PENDIENTE_REVISION', '20260202', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-002-2026', 1100102, 101, 1, '2026-02-02T08:00:00', @usr, '2026-02-02T08:00:00', @usr);
    SET @r02a = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-02', N'PENDIENTE_REVISION', '20250301', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-003-2025', 1100102, 101, 1, '2025-03-01T08:00:00', @usr, '2025-03-01T08:00:00', @usr);
    SET @r02b = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-03', N'PENDIENTE_REVISION', '20260203', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-004-2026', 1100102, 101, 1, '2026-02-03T08:00:00', @usr, '2026-02-03T08:00:00', @usr);
    SET @r03 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-04', N'PENDIENTE_REVISION', '20260204', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-005-2026', 1100102, 101, 1, '2026-02-04T08:00:00', @usr, '2026-02-04T08:00:00', @usr);
    SET @r04 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-5010104-01', N'PENDIENTE_REVISION', '20260320', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCH-OL301-5010104-REF-001-2026', 5010104, 301, 3, '2026-03-20T08:00:00', @usr, '2026-03-20T08:00:00', @usr);
    SET @r05 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES
        (N'SYN-1100102-06', N'PENDIENTE_REVISION', '20260206', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA', @usr, N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-006-2026', 1100102, 101, 1, '2026-02-06T08:00:00', @usr, '2026-02-06T08:00:00', @usr);
    SET @r07 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ref_contexto (referencia_id, encargado_nombre, relacion_encargado, establecimiento_nombre, region_nombre, oficina_local_nombre, edad_anios)
    VALUES
        (@r01, N'Encargado sintetico', N'Relacion sintetica', N'Establecimiento 1100102', N'Central Sur', N'Oficina 101', 4),
        (@r05, N'Encargado sintetico', N'Relacion sintetica', N'Establecimiento 5010104', N'Chorotega', N'Oficina 301', 5);

    INSERT INTO dbo.ref_motivo (referencia_id, cat_item_id, motivo_catalogo, especificacion)
    SELECT r.referencia_id, @motivo, N'MOTIVO_REFERENCIA', NULL
    FROM (VALUES (@r01), (@r01b), (@r02a), (@r02b), (@r03), (@r04), (@r05), (@r07)) AS r (referencia_id);

    INSERT INTO dbo.ref_impresion (referencia_id, usuario, impresa_en)
    VALUES (@r01, @usr, '2026-02-01T10:00:00');

    DECLARE @s1 bigint, @s2 bigint, @s3 bigint;
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
    VALUES (101, '20260201', '08:00:00', '09:30:00', N'Sala sintetica', @t, @usr);
    SET @s1 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
    VALUES (101, '20260601', '08:00:00', '09:00:00', N'Sala sintetica', '2026-06-01T08:00:00', @usr);
    SET @s2 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, lugar, creada_en, creada_por)
    VALUES (301, '20260320', '10:00:00', '11:00:00', N'Sala sintetica', '2026-03-20T10:00:00', @usr);
    SET @s3 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_disciplina (sesion_id, disciplina_item_id, disciplina_catalogo)
    VALUES
        (@s1, @disc, N'DISCIPLINA'),
        (@s2, @disc, N'DISCIPLINA'),
        (@s3, @disc, N'DISCIPLINA');

    DECLARE @sit bigint, @val bigint;
    DECLARE @v01 bigint, @v01b bigint, @v02a bigint, @v02b bigint, @v03 bigint, @v05 bigint, @v07 bigint;

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r01, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r01, @inst, 1, 1, @matriz, N'MODERADO', N'BAJA', N'ALTO', @usr, '20260201', @t);
    SET @v01 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r01b, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r01b, @inst, 1, 1, @matriz, N'BAJO', N'ALTA', N'BAJO', @usr, '20240115', '2024-01-15T09:30:00');
    SET @v01b = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r02a, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r02a, @inst, 1, 1, @matriz, N'ALTO', N'ALTA', N'MODERADO', @usr, '20260202', '2026-02-02T09:00:00');
    SET @v02a = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r02b, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r02b, @inst, 1, 1, @matriz, N'BAJO', N'MODERADA', N'BAJO', @usr, '20250301', '2025-03-01T09:00:00');
    SET @v02b = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r03, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r03, @inst, 1, 1, @matriz, N'ALTO', N'BAJA', N'ALTO', @usr, '20260203', '2026-02-03T09:00:00');
    SET @v03 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s3, @r05, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r05, @inst, 1, 1, @matriz, N'MODERADO', N'MODERADA', N'MODERADO', @usr, '20260320', '2026-03-20T11:00:00');
    SET @v05 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s1, @r07, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @r07, @inst, 1, 1, @matriz, N'ALTO', N'ALTA', N'MODERADO', @usr, '20260206', '2026-02-06T09:00:00');
    SET @v07 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta, instrumento_version_id)
    SELECT v.valoracion_id, c.categoria_id, N'NINGUNO', @inst
    FROM (VALUES (@v01), (@v01b), (@v02a), (@v02b), (@v03), (@v05), (@v07)) AS v (valoracion_id)
    CROSS JOIN (VALUES (@cat_prot), (@cat_riesgo)) AS c (categoria_id);

    UPDATE dbo.ses_valoracion_categoria
    SET respuesta = N'FACTORES'
    WHERE valoracion_id = @v01 AND categoria_id = @cat_prot;

    INSERT INTO dbo.ses_valoracion_factor (
        valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace
    )
    VALUES (@v01, @cat_prot, @fac_prot, NULL, N'FACTORES');

    INSERT INTO dbo.ses_resolucion (
        referencia_id, sesion_id, valoracion_id, decision, justificacion, responsable_usuario, fecha_decision, registrada_en
    )
    VALUES
        (@r01, @s1, @v01, N'REQUIERE_AI', NULL, @usr, '20260201', @t),
        (@r01b, @s1, @v01b, N'NO_REQUIERE_AI', N'Texto sintetico de no ingreso', @usr, '20240115', '2024-01-15T09:40:00'),
        (@r02a, @s1, @v02a, N'NO_REQUIERE_AI', N'Texto sintetico de no ingreso', @usr, '20260202', '2026-02-02T09:10:00'),
        (@r02b, @s1, @v02b, N'REQUIERE_AI', NULL, @usr, '20250301', '2025-03-01T09:10:00'),
        (@r03, @s1, @v03, N'REQUIERE_AI', NULL, @usr, '20260203', '2026-02-03T09:10:00'),
        (@r05, @s3, @v05, N'REQUIERE_AI', NULL, @usr, '20260320', '2026-03-20T11:10:00'),
        (@r07, @s1, @v07, N'REQUIERE_AI', NULL, @usr, '20260206', '2026-02-06T09:10:00');

    UPDATE dbo.ref_referencia SET estado = N'NO_REQUIERE_AI' WHERE referencia_id IN (@r01b, @r02a);

    DECLARE @c01 bigint, @c02 bigint, @c03 bigint, @c05 bigint, @c07 bigint;
    DECLARE @p01 bigint, @p02 bigint, @p03 bigint, @p05 bigint, @p07 bigint;

    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen,
        valoracion_vigente_id, plan_vigente_id, cierre_caso_id
    )
    VALUES
        (N'SYN-1100102-01', @r01, N'ACTIVO', '20260201', @t, @usr, 1100102, 101, 1, N'DNCC-DRCS-OL101-1100102-REF-001-2026', @v01, NULL, NULL);
    SET @c01 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen,
        valoracion_vigente_id, plan_vigente_id, cierre_caso_id
    )
    VALUES
        (N'SYN-1100102-02', @r02b, N'ACTIVO', '20250301', '2025-03-01T09:20:00', @usr, 1100102, 101, 1, N'DNCC-DRCS-OL101-1100102-REF-003-2025', @v02b, NULL, NULL);
    SET @c02 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen,
        valoracion_vigente_id, plan_vigente_id, cierre_caso_id
    )
    VALUES
        (N'SYN-1100102-03', @r03, N'ACTIVO', '20260203', '2026-02-03T09:20:00', @usr, 1100102, 101, 1, N'DNCC-DRCS-OL101-1100102-REF-004-2026', @v03, NULL, NULL);
    SET @c03 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen,
        valoracion_vigente_id, plan_vigente_id, cierre_caso_id
    )
    VALUES
        (N'SYN-5010104-01', @r05, N'ACTIVO', '20260320', '2026-03-20T11:20:00', @usr, 5010104, 301, 3, N'DNCC-DRCH-OL301-5010104-REF-001-2026', @v05, NULL, NULL);
    SET @c05 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen,
        valoracion_vigente_id, plan_vigente_id, cierre_caso_id
    )
    VALUES
        (N'SYN-1100102-06', @r07, N'ACTIVO', '20260206', '2026-02-06T09:20:00', @usr, 1100102, 101, 1, N'DNCC-DRCS-OL101-1100102-REF-006-2026', @v07, NULL, NULL);
    SET @c07 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.caso_plan (
        caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
        responsable_usuario, fecha_plan, registrado_en
    )
    VALUES
        (@c01, 1, 1, @frec, N'FRECUENCIA', @usr, '20260201', @t),
        (@c02, 1, 1, @frec, N'FRECUENCIA', @usr, '20250301', '2025-03-01T09:25:00'),
        (@c03, 1, 1, @frec, N'FRECUENCIA', @usr, '20260203', '2026-02-03T09:25:00'),
        (@c05, 1, 1, @frec, N'FRECUENCIA', @usr, '20260320', '2026-03-20T11:25:00'),
        (@c07, 1, 1, @frec, N'FRECUENCIA', @usr, '20260206', '2026-02-06T09:25:00');

    SELECT @p01 = plan_id FROM dbo.caso_plan WHERE caso_id = @c01 AND numero_version = 1;
    SELECT @p02 = plan_id FROM dbo.caso_plan WHERE caso_id = @c02 AND numero_version = 1;
    SELECT @p03 = plan_id FROM dbo.caso_plan WHERE caso_id = @c03 AND numero_version = 1;
    SELECT @p05 = plan_id FROM dbo.caso_plan WHERE caso_id = @c05 AND numero_version = 1;
    SELECT @p07 = plan_id FROM dbo.caso_plan WHERE caso_id = @c07 AND numero_version = 1;

    INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
    SELECT p.plan_id, 1, N'Proposito sintetico de prueba'
    FROM (VALUES (@p01), (@p02), (@p03), (@p05), (@p07)) AS p (plan_id);

    INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
    SELECT p.plan_id, @estr, N'ESTRATEGIA'
    FROM (VALUES (@p01), (@p02), (@p03), (@p05), (@p07)) AS p (plan_id);

    INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
    SELECT p.plan_id, @disc, N'DISCIPLINA'
    FROM (VALUES (@p01), (@p02), (@p03), (@p05), (@p07)) AS p (plan_id);

    UPDATE dbo.caso_ai SET plan_vigente_id = @p01 WHERE caso_id = @c01;
    UPDATE dbo.caso_ai SET plan_vigente_id = @p02 WHERE caso_id = @c02;
    UPDATE dbo.caso_ai SET plan_vigente_id = @p03 WHERE caso_id = @c03;
    UPDATE dbo.caso_ai SET plan_vigente_id = @p05 WHERE caso_id = @c05;
    UPDATE dbo.caso_ai SET plan_vigente_id = @p07 WHERE caso_id = @c07;

    UPDATE dbo.ses_valoracion SET caso_id = @c01 WHERE valoracion_id = @v01 AND caso_id IS NULL;
    UPDATE dbo.ses_valoracion SET caso_id = @c02 WHERE valoracion_id = @v02b AND caso_id IS NULL;
    UPDATE dbo.ses_valoracion SET caso_id = @c03 WHERE valoracion_id = @v03 AND caso_id IS NULL;
    UPDATE dbo.ses_valoracion SET caso_id = @c05 WHERE valoracion_id = @v05 AND caso_id IS NULL;
    UPDATE dbo.ses_valoracion SET caso_id = @c07 WHERE valoracion_id = @v07 AND caso_id IS NULL;

    UPDATE dbo.ref_referencia
    SET estado = N'ADMITIDA_AI'
    WHERE referencia_id IN (@r01, @r02b, @r03, @r05, @r07);

    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES
        (@c01, N'ACTIVO', @t, @usr, NULL, NULL),
        (@c02, N'ACTIVO', '2025-03-01T09:20:00', @usr, NULL, NULL),
        (@c03, N'ACTIVO', '2026-02-03T09:20:00', @usr, NULL, NULL),
        (@c05, N'ACTIVO', '2026-03-20T11:20:00', @usr, NULL, NULL),
        (@c07, N'ACTIVO', '2026-02-06T09:20:00', @usr, NULL, NULL);

    UPDATE dbo.ses_valoracion SET es_vigente = 0 WHERE valoracion_id = @v01;

    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@s2, NULL, @c01);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, @c01, @r01, @inst, 2, 1, @matriz, N'BAJO', N'ALTA', N'BAJO', @usr, '20260601', '2026-06-01T09:00:00');
    SET @val = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.ses_valoracion_categoria (valoracion_id, categoria_id, respuesta, instrumento_version_id)
    VALUES
        (@val, @cat_prot, N'NINGUNO', @inst),
        (@val, @cat_riesgo, N'FACTORES', @inst);
    INSERT INTO dbo.ses_valoracion_factor (valoracion_id, categoria_id, factor_id, especificacion, respuesta_enlace)
    VALUES (@val, @cat_riesgo, @fac_riesgo, N'Especificacion sintetica', N'FACTORES');

    UPDATE dbo.caso_ai SET valoracion_vigente_id = @val WHERE caso_id = @c01;

    UPDATE dbo.caso_plan SET es_vigente = 0 WHERE plan_id = @p01;
    INSERT INTO dbo.caso_plan (
        caso_id, numero_version, es_vigente, frecuencia_item_id, frecuencia_catalogo,
        responsable_usuario, fecha_plan, registrado_en
    )
    VALUES (@c01, 2, 1, @frec, N'FRECUENCIA', @usr, '20260601', '2026-06-01T09:05:00');
    DECLARE @p01b bigint = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_plan_proposito (plan_id, orden, texto)
    VALUES (@p01b, 1, N'Proposito sintetico de la segunda version');
    INSERT INTO dbo.caso_plan_estrategia (plan_id, estrategia_item_id, estrategia_catalogo)
    VALUES (@p01b, @estr, N'ESTRATEGIA');
    INSERT INTO dbo.caso_plan_disciplina (plan_id, disciplina_item_id, disciplina_catalogo)
    VALUES (@p01b, @disc, N'DISCIPLINA');
    UPDATE dbo.caso_ai SET plan_vigente_id = @p01b WHERE caso_id = @c01;

    DECLARE @h02 bigint, @h03 bigint;
    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES (@c02, N'CERRADO', '2025-11-01T15:00:00', @usr, @cierre_ok, N'MOTIVO_CIERRE');
    SET @h02 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES (@c03, N'CERRADO', '2026-04-01T15:00:00', @usr, @cierre_traslado, N'MOTIVO_CIERRE');
    SET @h03 = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en,
        historial_id, historial_estado,
        destino_establecimiento_id, destino_oficina_local_id, destino_region_id, destino_nombre
    )
    VALUES
        (@c02, @cierre_ok, N'MOTIVO_CIERRE', N'CIERRE_SATISFACTORIO', 0, NULL, '20251101', @usr, '2025-11-01T15:00:00', @h02, N'CERRADO', NULL, NULL, NULL, NULL),
        (@c03, @cierre_traslado, N'MOTIVO_CIERRE', N'TRASLADO', 0, NULL, '20260401', @usr, '2026-04-01T15:00:00', @h03, N'CERRADO', 5010104, 301, 3, N'Destino sintetico 5010104');

    UPDATE dbo.caso_ai
    SET estado = N'CERRADO', cierre_caso_id = caso_id
    WHERE caso_id IN (@c02, @c03);

    INSERT INTO dbo.ate_individual (
        caso_id, per_id_persona, fecha_atencion, disciplina_item_id, disciplina_catalogo,
        estrategia_item_id, estrategia_catalogo, acciones, recomendaciones,
        profesional_usuario, proxima_accion, fecha_proxima, digitador_usuario, digitada_en
    )
    VALUES
        (@c01, N'SYN-1100102-01', '20260210', @disc, N'DISCIPLINA', @estr, N'ESTRATEGIA', N'Accion sintetica', N'Recomendacion sintetica', @usr, NULL, NULL, @dig, '2026-02-10T11:00:00'),
        (@c05, N'SYN-5010104-01', '20260401', @disc, N'DISCIPLINA', @estr, N'ESTRATEGIA', N'Accion sintetica', N'Recomendacion sintetica', @usr, N'Siguiente paso sintetico', '20260701', @dig, '2026-04-01T11:00:00');

    DECLARE @g bigint;
    INSERT INTO dbo.ate_grupal (
        oficina_local_id, establecimiento_id, fecha_atencion, tipo_item_id, tipo_catalogo,
        tema, lugar, acciones, recomendaciones, digitador_usuario, digitada_en
    )
    VALUES (101, 1100102, '20260315', @tipo_ate, N'TIPO_ATENCION', N'Tema sintetico de prueba', N'Lugar sintetico', N'Accion grupal sintetica', N'Recomendacion grupal sintetica', @dig, '2026-03-15T14:00:00');
    SET @g = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ate_grupal_disciplina (atencion_grupal_id, disciplina_item_id, disciplina_catalogo)
    VALUES (@g, @disc, N'DISCIPLINA');
    INSERT INTO dbo.ate_grupal_profesional (atencion_grupal_id, profesional_usuario)
    VALUES (@g, @usr);
    INSERT INTO dbo.ate_grupal_participante (atencion_grupal_id, per_id_persona, caso_id, asistio)
    VALUES
        (@g, N'SYN-1100102-01', @c01, 1),
        (@g, N'SYN-1100102-05', NULL, 1),
        (@g, N'SYN-1100102-06', @c07, 0);

    DECLARE @a_vencida bigint, @a_futura bigint, @a_reprog bigint, @a_cancel bigint;
    INSERT INTO dbo.prog_actividad (
        oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo, titulo,
        fecha_prevista, fecha_vigente, estado, motivo_vigente, observaciones, creada_en, creada_por
    )
    VALUES
        (101, 1100102, 1, @tipo_prog, N'TIPO_ACTIVIDAD_PROGRAMADA', N'Actividad sintetica vencida', '20260115', '20260115', N'PROGRAMADA', NULL, NULL, '2026-01-10T08:00:00', @usr);
    SET @a_vencida = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.prog_actividad (
        oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo, titulo,
        fecha_prevista, fecha_vigente, estado, motivo_vigente, observaciones, creada_en, creada_por
    )
    VALUES
        (101, NULL, 1, @tipo_prog, N'TIPO_ACTIVIDAD_PROGRAMADA', N'Actividad sintetica general', '20261201', '20261201', N'PROGRAMADA', NULL, NULL, @t, @usr);
    SET @a_futura = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.prog_actividad (
        oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo, titulo,
        fecha_prevista, fecha_vigente, estado, motivo_vigente, observaciones, creada_en, creada_por
    )
    VALUES
        (101, 1100102, 1, @tipo_prog, N'TIPO_ACTIVIDAD_PROGRAMADA', N'Actividad sintetica reprogramada', '20260501', '20260601', N'REPROGRAMADA', N'Sintetico reprogramacion', NULL, '2026-04-01T08:00:00', @usr);
    SET @a_reprog = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.prog_actividad (
        oficina_local_id, establecimiento_id, region_id, tipo_item_id, tipo_catalogo, titulo,
        fecha_prevista, fecha_vigente, estado, motivo_vigente, observaciones, creada_en, creada_por
    )
    VALUES
        (101, 1100102, 1, @tipo_prog, N'TIPO_ACTIVIDAD_PROGRAMADA', N'Actividad sintetica cancelada', '20260415', '20260415', N'CANCELADA', N'Sintetico clima', NULL, '2026-04-01T08:00:00', @usr);
    SET @a_cancel = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.prog_cambio (actividad_id, numero, estado_anterior, estado_nuevo, fecha_anterior, fecha_nueva, motivo, usuario, ocurrido_en)
    VALUES
        (@a_vencida, 1, NULL, N'PROGRAMADA', NULL, '20260115', NULL, @usr, '2026-01-10T08:00:00'),
        (@a_futura, 1, NULL, N'PROGRAMADA', NULL, '20261201', NULL, @usr, @t),
        (@a_reprog, 1, NULL, N'PROGRAMADA', NULL, '20260501', NULL, @usr, '2026-04-01T08:00:00'),
        (@a_reprog, 2, N'PROGRAMADA', N'REPROGRAMADA', '20260501', '20260601', N'Sintetico reprogramacion', @usr, '2026-04-20T08:00:00'),
        (@a_cancel, 1, NULL, N'PROGRAMADA', NULL, '20260415', NULL, @usr, '2026-04-01T08:00:00'),
        (@a_cancel, 2, N'PROGRAMADA', N'CANCELADA', '20260415', '20260415', N'Sintetico clima', @usr, '2026-04-10T08:00:00');

    INSERT INTO dbo.prog_persona (actividad_id, per_id_persona, caso_id)
    VALUES (@a_vencida, N'SYN-1100102-01', @c01);

    INSERT INTO dbo.ref_posible (
        per_id_persona, establecimiento_id, oficina_local_id, region_id, criterio_codigo,
        fecha_deteccion, id_externo, sistema_origen, estado, referencia_id
    )
    VALUES
        (N'SYN-1100102-04', 1100102, 101, 1, N'SYN_CRITERIO_TAMIZAJE', '20260204', NULL, NULL, N'PENDIENTE', NULL),
        (N'SYN-1100102-02', 1100102, 101, 1, N'SYN_CRITERIO_TAMIZAJE', '20250301', NULL, NULL, N'REFERENCIA_CREADA', @r02b);

    INSERT INTO dbo.doc_documento (
        caso_id, tipo_item_id, tipo_catalogo, tipo_texto, fecha_documento, responsable_usuario,
        nombre_original, clave_almacen, tamano_bytes, creado_en
    )
    VALUES (@c01, NULL, NULL, N'Sintetico', '20260211', @usr, N'sintetico.txt', N'sintetico-clave-opaca', 128, '2026-02-11T08:00:00');

    DECLARE @coord bigint;
    INSERT INTO dbo.doc_coordinacion (
        caso_id, institucion_item_id, institucion_catalogo, institucion_texto, profesional_responsable,
        digitador_usuario, motivo, fecha_coordinacion, estado_item_id, estado_catalogo, estado_texto
    )
    VALUES (@c01, NULL, NULL, N'Institucion sintetica', N'Profesional sintetico', @dig, N'Motivo sintetico', '20260212', NULL, NULL, N'Registrado sintetico');
    SET @coord = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.doc_coordinacion_evento (coordinacion_id, estado_texto, estado_item_id, estado_catalogo, usuario, ocurrido_en)
    VALUES (@coord, N'Registrado sintetico', NULL, NULL, @dig, '2026-02-12T08:00:00');

    INSERT INTO dbo.doc_reporte_caso (caso_id, tipo_proposito, fecha_reporte, responsable_usuario, motivo, creado_en)
    VALUES (@c01, N'Seguimiento sintetico', '20260220', @usr, NULL, '2026-02-20T08:00:00');

    DECLARE @inf bigint;
    INSERT INTO dbo.inf_informe (
        titulo, responsable_usuario, rol_codigo, ambito_nivel, region_id, oficina_local_id,
        establecimiento_id, periodo_anio, filtros_resumen, corte_en, generado_en, clave_archivo
    )
    VALUES (
        N'Informe sintetico de oficina', @usr, N'OFICINA_LOCAL', N'OFICINA_LOCAL', 1, 101,
        NULL, 2026, N'Oficina 101; anio 2026; sin identificadores de persona',
        '2026-11-05T12:00:00', '2026-11-05T12:05:00', NULL
    );
    SET @inf = CONVERT(bigint, SCOPE_IDENTITY());

    INSERT INTO dbo.inf_visualizacion (informe_id, codigo_visualizacion, orden, titulo, filtros, analisis)
    VALUES
        (@inf, 1, 1, N'Casos por establecimiento', N'Oficina 101', N'Analisis sintetico de la visualizacion 1'),
        (@inf, 4, 2, N'Prioridad vigente', N'Oficina 101', N'Analisis sintetico de la visualizacion 4'),
        (@inf, 5, 3, N'Estado del caso', N'Oficina 101', N'Analisis sintetico de la visualizacion 5'),
        (@inf, 8, 4, N'Atenciones', N'Anio 2026', N'Analisis sintetico de la visualizacion 8'),
        (@inf, 11, 5, N'Cobertura', N'Anio 2026', N'Analisis sintetico de la visualizacion 11');

    INSERT INTO dbo.inf_agregado (visualizacion_id, orden, etiqueta, valor_numerico, valor_texto)
    SELECT v.visualizacion_id, 1, N'Grupo sintetico', 1, NULL
    FROM dbo.inf_visualizacion AS v
    WHERE v.informe_id = @inf;

    INSERT INTO dbo.bor_captura (
        usuario, ambito_nivel, oficina_local_id, establecimiento_id, flujo, clave_negocio, contenido, actualizado_en
    )
    VALUES (@usr, N'OFICINA_LOCAL', 101, 1100102, N'REFERENCIA', NULL, N'{"sintetico":true}', @t);

    INSERT INTO dbo.aud_evento (ocurrido_en, usuario, rol, accion, entidad, entidad_id, ambito, codigo_cambio)
    VALUES
        (@t, @usr, N'OFICINA_LOCAL', N'ENVIO', N'ref_referencia', CONVERT(nvarchar(40), @r01), N'OL101', N'ENVIO'),
        (@t, @usr, N'OFICINA_LOCAL', N'APERTURA', N'caso_ai', CONVERT(nvarchar(40), @c01), N'OL101', N'APERTURA'),
        ('2026-06-01T09:00:00', @usr, N'OFICINA_LOCAL', N'REVALORACION', N'caso_ai', CONVERT(nvarchar(40), @c01), N'OL101', N'REVALORACION'),
        ('2026-04-01T15:00:00', @usr, N'OFICINA_LOCAL', N'CIERRE', N'caso_ai', CONVERT(nvarchar(40), @c03), N'OL101', N'CIERRE');

    IF (SELECT COUNT(*) FROM dbo.caso_ai WHERE estado = N'ACTIVO') <> 3
        OR (SELECT COUNT(*) FROM dbo.caso_cierre) <> 2
        OR (SELECT COUNT(*) FROM dbo.ref_referencia) <> 8
        OR (SELECT COUNT(*) FROM dbo.ses_valoracion) <> 8
        OR (SELECT COUNT(*) FROM dbo.ate_individual) <> 2
        OR (SELECT COUNT(*) FROM dbo.ate_grupal) <> 1
        OR (SELECT COUNT(*) FROM dbo.inf_visualizacion) <> 5
        THROW 51033, N'El conjunto sintetico no quedo con los conteos esperados.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
