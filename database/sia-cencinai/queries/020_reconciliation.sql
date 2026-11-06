/*
SIA_CENCINAI — conciliaciones.
Cada consulta debe devolver cero filas en una base operada por los protocolos.
No corrigen ni borran.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @consultar bit = 0;
IF @consultar <> 1
    THROW 51121, N'Conciliacion bloqueada. Cambie @consultar a 1 solo en desarrollo.', 1;

SELECT c.caso_id, hallazgo = N'VIGENTE_O_PLAN'
FROM dbo.caso_ai AS c
INNER JOIN dbo.ses_valoracion AS v ON v.valoracion_id = c.valoracion_vigente_id
WHERE v.es_vigente <> 1
   OR v.caso_id <> c.caso_id
   OR (c.estado = N'ACTIVO' AND c.plan_vigente_id IS NULL);

SELECT c.caso_id, hallazgo = N'PLAN_NO_VIGENTE'
FROM dbo.caso_ai AS c
INNER JOIN dbo.caso_plan AS p ON p.plan_id = c.plan_vigente_id
WHERE p.es_vigente <> 1
   OR p.caso_id <> c.caso_id;

SELECT c.caso_id, hallazgo = N'CIERRE_ESTADO'
FROM dbo.caso_ai AS c
LEFT JOIN dbo.caso_cierre AS z ON z.caso_id = c.caso_id
WHERE (c.estado = N'CERRADO' AND (z.caso_id IS NULL OR c.cierre_caso_id IS NULL))
   OR (c.estado = N'ACTIVO' AND z.caso_id IS NOT NULL);

SELECT h.historial_id, hallazgo = N'HISTORIAL_CERRADO_SIN_CIERRE'
FROM dbo.caso_estado_historial AS h
WHERE h.estado = N'CERRADO'
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.caso_cierre AS z
      WHERE z.caso_id = h.caso_id
        AND z.historial_id = h.historial_id
  );

SELECT z.caso_id, hallazgo = N'MOTIVO_DISTINTO'
FROM dbo.caso_cierre AS z
INNER JOIN dbo.caso_estado_historial AS h ON h.historial_id = z.historial_id
WHERE h.motivo_item_id IS NULL
   OR h.motivo_item_id <> z.motivo_item_id;

SELECT p.participante_id, hallazgo = N'PERSONA_DISTINTA'
FROM dbo.ate_grupal_participante AS p
INNER JOIN dbo.caso_ai AS c ON c.caso_id = p.caso_id
WHERE p.caso_id IS NOT NULL
  AND p.per_id_persona <> c.per_id_persona;

SELECT pr.actividad_id, pr.per_id_persona, hallazgo = N'PROGRAMACION_PERSONA_DISTINTA'
FROM dbo.prog_persona AS pr
INNER JOIN dbo.caso_ai AS c ON c.caso_id = pr.caso_id
WHERE pr.caso_id IS NOT NULL
  AND pr.per_id_persona <> c.per_id_persona;
GO
