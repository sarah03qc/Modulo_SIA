/*
SIA_CENCINAI — prueba 050_reporting_tests
Comprueba el conjunto sintetico. La fecha de corte es 2026-11-05.
Ejecutar antes de las pruebas de concurrencia: esas agregan filas.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @ejecutar bit = 0;
IF @ejecutar <> 1
    THROW 51040, N'Prueba bloqueada. Cambie @ejecutar a 1 despues de la semilla sintetica.', 1;

DECLARE @inicio date = '20260101';
DECLARE @fin date = '20270101';
DECLARE @hoy date = '20261105';
DECLARE @d int;
DECLARE @n int;

;WITH d AS (
    SELECT c.caso_id, c.per_id_persona
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND c.oficina_local_id = 101
),
n AS (
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_individual AS i
        ON i.caso_id = d.caso_id
       AND i.fecha_atencion >= @inicio
       AND i.fecha_atencion < @fin
    UNION
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_grupal_participante AS p
        ON p.caso_id = d.caso_id
       AND p.asistio = 1
    INNER JOIN dbo.ate_grupal AS g
        ON g.atencion_grupal_id = p.atencion_grupal_id
       AND g.fecha_atencion >= @inicio
       AND g.fecha_atencion < @fin
)
SELECT
    @d = (SELECT COUNT(DISTINCT per_id_persona) FROM d),
    @n = (SELECT COUNT(*) FROM n);

IF @d <> 2 OR @n <> 1
    THROW 51100, N'Cobertura de la oficina 101: se esperaba D=2 y N=1.', 1;

;WITH d AS (
    SELECT c.caso_id, c.per_id_persona
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
),
n AS (
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_individual AS i
        ON i.caso_id = d.caso_id
       AND i.fecha_atencion >= @inicio
       AND i.fecha_atencion < @fin
    UNION
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_grupal_participante AS p
        ON p.caso_id = d.caso_id
       AND p.asistio = 1
    INNER JOIN dbo.ate_grupal AS g
        ON g.atencion_grupal_id = p.atencion_grupal_id
       AND g.fecha_atencion >= @inicio
       AND g.fecha_atencion < @fin
)
SELECT
    @d = (SELECT COUNT(DISTINCT per_id_persona) FROM d),
    @n = (SELECT COUNT(*) FROM n);

IF @d <> 3 OR @n <> 2
    THROW 51101, N'Cobertura nacional: se esperaba D=3 y N=2, no el promedio de oficinas.', 1;

IF (
    SELECT COUNT(*)
    FROM dbo.ate_grupal
    WHERE fecha_atencion >= @inicio AND fecha_atencion < @fin
) <> 1
    THROW 51102, N'La grupal debe contarse una vez, no por participante.', 1;

IF (
    SELECT COUNT(*)
    FROM dbo.ate_individual
    WHERE fecha_atencion >= @inicio AND fecha_atencion < @fin
) <> 2
    THROW 51103, N'Se esperaban dos atenciones individuales en 2026.', 1;

IF (
    SELECT COUNT(*)
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND c.oficina_local_id = 101
      AND NOT EXISTS (
          SELECT 1 FROM dbo.ate_individual AS i
          WHERE i.caso_id = c.caso_id AND i.fecha_atencion >= @inicio AND i.fecha_atencion < @fin
      )
      AND NOT EXISTS (
          SELECT 1
          FROM dbo.ate_grupal_participante AS p
          INNER JOIN dbo.ate_grupal AS g ON g.atencion_grupal_id = p.atencion_grupal_id
          WHERE p.caso_id = c.caso_id
            AND p.asistio = 1
            AND g.fecha_atencion >= @inicio
            AND g.fecha_atencion < @fin
      )
) <> 1
    THROW 51104, N'Se esperaba un caso activo de la oficina 101 sin atencion efectiva en 2026.', 1;

IF (
    SELECT COUNT(*)
    FROM dbo.prog_actividad
    WHERE oficina_local_id = 101
      AND estado = N'PROGRAMADA'
      AND fecha_vigente < @hoy
) <> 1
    THROW 51105, N'Se esperaba una programacion vencida. REPROGRAMADA no cuenta.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.caso_ai AS c
    INNER JOIN dbo.ses_valoracion AS v ON v.valoracion_id = c.valoracion_vigente_id
    WHERE v.es_vigente <> 1 OR v.caso_id <> c.caso_id
       OR (c.estado = N'ACTIVO' AND c.plan_vigente_id IS NULL)
)
    THROW 51106, N'La conciliacion de vigente o de plan no esta en cero.', 1;

PRINT N'PASS reporteria del conjunto sintetico.';
GO
