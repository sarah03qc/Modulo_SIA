/*
SIA_CENCINAI — consultas de referencia para las doce visualizaciones y la cobertura.
No son una prueba. El predicado de ambito lo pone el servicio; aqui hay ejemplos.
Sexo y edad no se leen de esta base: los resuelve el adaptador de SIDINACC.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @consultar bit = 0;
IF @consultar <> 1
    THROW 51120, N'Consulta bloqueada. Cambie @consultar a 1 solo para revisar resultados en desarrollo.', 1;

DECLARE @oficina_local_id int = 101;
DECLARE @region_id int = 1;
DECLARE @inicio_anio date = '20260101';
DECLARE @fin_anio date = '20270101';
DECLARE @hoy date = '20261105';

/* 1. Casos por establecimiento dentro del ambito y del estado consultado. */
SELECT c.establecimiento_id, c.estado, casos = COUNT(*)
FROM dbo.caso_ai AS c
WHERE c.oficina_local_id = @oficina_local_id
GROUP BY c.establecimiento_id, c.estado;

/* 2 y 3. El sexo y la edad salen del adaptador, despues de este conjunto de personas. */
SELECT DISTINCT c.per_id_persona
FROM dbo.caso_ai AS c
WHERE c.oficina_local_id = @oficina_local_id;

/* 4. Prioridad vigente. No hay columna de prioridad en caso_ai. */
SELECT v.prioridad_codigo, casos = COUNT(*)
FROM dbo.caso_ai AS c
INNER JOIN dbo.ses_valoracion AS v ON v.valoracion_id = c.valoracion_vigente_id
WHERE c.oficina_local_id = @oficina_local_id
GROUP BY v.prioridad_codigo;

/* 5. Estado actual, no el estado historico del anio. */
SELECT c.estado, casos = COUNT(*)
FROM dbo.caso_ai AS c
WHERE c.oficina_local_id = @oficina_local_id
GROUP BY c.estado;

/* 6. Motivos de cancelacion. Top del texto exacto. */
SELECT a.motivo_vigente, actividades = COUNT(*)
FROM dbo.prog_actividad AS a
INNER JOIN dbo.prog_cambio AS k
    ON k.actividad_id = a.actividad_id
   AND k.estado_nuevo = N'CANCELADA'
WHERE a.oficina_local_id = @oficina_local_id
  AND a.estado = N'CANCELADA'
  AND k.ocurrido_en >= @inicio_anio
  AND k.ocurrido_en < @fin_anio
GROUP BY a.motivo_vigente;

/* 7. Motivos de referencia enviada. Puede superar el numero de referencias. */
SELECT m.cat_item_id, motivos = COUNT(*)
FROM dbo.ref_motivo AS m
INNER JOIN dbo.ref_referencia AS r ON r.referencia_id = m.referencia_id
WHERE r.oficina_local_id = @oficina_local_id
GROUP BY m.cat_item_id;

/* 8. Atenciones efectivas: individuales mas grupales, no participantes ni programadas. */
SELECT origen = N'INDIVIDUAL', actividades = COUNT(*)
FROM dbo.ate_individual AS i
INNER JOIN dbo.caso_ai AS c ON c.caso_id = i.caso_id
WHERE c.oficina_local_id = @oficina_local_id
  AND i.fecha_atencion >= @inicio_anio
  AND i.fecha_atencion < @fin_anio
UNION ALL
SELECT N'GRUPAL', COUNT(*)
FROM dbo.ate_grupal AS g
WHERE g.oficina_local_id = @oficina_local_id
  AND g.fecha_atencion >= @inicio_anio
  AND g.fecha_atencion < @fin_anio;

/* 9. Motivos de cierre. Traslado no se suma a satisfactorio. */
SELECT z.motivo_codigo, cierres = COUNT(*)
FROM dbo.caso_cierre AS z
INNER JOIN dbo.caso_ai AS c ON c.caso_id = z.caso_id
WHERE c.oficina_local_id = @oficina_local_id
GROUP BY z.motivo_codigo;

/* 10. La tokenizacion de Otro es del servicio. La base solo entrega la explicacion al rol autorizado. */
SELECT z.caso_id
FROM dbo.caso_cierre AS z
INNER JOIN dbo.caso_ai AS c ON c.caso_id = z.caso_id
WHERE c.oficina_local_id = @oficina_local_id
  AND z.motivo_requiere_texto = 1;

/* 11 y 12. Cobertura anual. Misma formula para oficina, region o nacion. */
WITH d AS (
    SELECT c.caso_id, c.per_id_persona
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND c.oficina_local_id = @oficina_local_id
),
n AS (
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_individual AS i
        ON i.caso_id = d.caso_id
       AND i.fecha_atencion >= @inicio_anio
       AND i.fecha_atencion < @fin_anio
    UNION
    SELECT d.per_id_persona
    FROM d
    INNER JOIN dbo.ate_grupal_participante AS p
        ON p.caso_id = d.caso_id AND p.asistio = 1
    INNER JOIN dbo.ate_grupal AS g
        ON g.atencion_grupal_id = p.atencion_grupal_id
       AND g.fecha_atencion >= @inicio_anio
       AND g.fecha_atencion < @fin_anio
)
SELECT
    denominador = (SELECT COUNT(DISTINCT per_id_persona) FROM d),
    numerador = (SELECT COUNT(*) FROM n);

/* Casos sin atencion efectiva en el anio. */
SELECT c.caso_id, c.per_id_persona
FROM dbo.caso_ai AS c
WHERE c.estado = N'ACTIVO'
  AND c.oficina_local_id = @oficina_local_id
  AND NOT EXISTS (
      SELECT 1 FROM dbo.ate_individual AS i
      WHERE i.caso_id = c.caso_id
        AND i.fecha_atencion >= @inicio_anio AND i.fecha_atencion < @fin_anio
  )
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.ate_grupal_participante AS p
      INNER JOIN dbo.ate_grupal AS g ON g.atencion_grupal_id = p.atencion_grupal_id
      WHERE p.caso_id = c.caso_id AND p.asistio = 1
        AND g.fecha_atencion >= @inicio_anio AND g.fecha_atencion < @fin_anio
  );

/* Programaciones vencidas. No es un estado. */
SELECT a.actividad_id, a.fecha_vigente, a.titulo
FROM dbo.prog_actividad AS a
WHERE a.oficina_local_id = @oficina_local_id
  AND a.estado = N'PROGRAMADA'
  AND a.fecha_vigente < @hoy;

/* Region: el mismo patron, con region_id. */
SELECT c.estado, casos = COUNT(*)
FROM dbo.caso_ai AS c
WHERE c.region_id = @region_id
GROUP BY c.estado;
GO
