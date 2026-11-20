/*
SIA_CENCINAI — semilla 053_retirar_beneficiarios_adultos
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

La escala 030 llego a abrir casos de Atencion Interdisciplinaria para personas
sinteticas que ya habian cumplido 18 anos el 2026-11-05. Esos casos no son
poblacion de A.I. Esta semilla los retira, junto con las filas que existen
solo por ellos, sin usar el cierre funcional y sin escribir en SIDINACC_LOCAL.

Solo entran identificadores SYN-. Con permitir = 0 unicamente informa.
Ejecutar en desarrollo: sqlcmd -v permitir=1 -i este archivo.
030 ya excluye a esas personas en corridas nuevas.
*/
:on error exit
SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
SET ANSI_PADDING ON;
SET ANSI_WARNINGS ON;
SET CONCAT_NULL_YIELDS_NULL ON;

DECLARE @permitir bit = $(permitir);
DECLARE @corte date = '20261105';

IF OBJECT_ID(N'SIDINACC_LOCAL.dbo.CAF_PERSONA', N'U') IS NULL
    THROW 51154, N'No esta la replica SIDINACC_LOCAL. No se inventan edades.', 1;

SELECT
    caso.caso_id,
    caso.referencia_id,
    caso.per_id_persona,
    caso.estado
INTO #caso
FROM dbo.caso_ai AS caso
INNER JOIN SIDINACC_LOCAL.dbo.CAF_PERSONA AS persona
    ON persona.PER_idPersona = caso.per_id_persona COLLATE Latin1_General_100_CI_AS
WHERE caso.per_id_persona LIKE N'SYN-%'
  AND persona.PER_fechaNacimiento IS NOT NULL
  AND DATEADD(YEAR, 18, CONVERT(date, persona.PER_fechaNacimiento)) <= @corte;

IF EXISTS (SELECT 1 FROM #caso WHERE per_id_persona NOT LIKE N'SYN-%')
    THROW 51155, N'El conjunto no es exclusivamente sintetico.', 1;

SELECT
    COUNT(*) AS casos_adultos,
    SUM(CASE WHEN estado = N'ACTIVO' THEN 1 ELSE 0 END) AS activos,
    SUM(CASE WHEN estado = N'CERRADO' THEN 1 ELSE 0 END) AS cerrados
FROM #caso;

IF @permitir <> 1
BEGIN
    PRINT N'Semilla 053 en informe. Use -v permitir=1 solo en desarrollo.';
    RETURN;
END

BEGIN TRANSACTION;

ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT FK_caso_ai_cierre;
ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT FK_caso_ai_valoracion_vigente;
ALTER TABLE dbo.caso_ai NOCHECK CONSTRAINT CK_caso_ai_estado_cierre;

UPDATE dbo.caso_ai
SET plan_vigente_id = NULL,
    cierre_caso_id = NULL
WHERE caso_id IN (SELECT caso_id FROM #caso);

SELECT DISTINCT participante.atencion_grupal_id
INTO #grupo
FROM dbo.ate_grupal_participante AS participante
WHERE participante.caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.ate_grupal_participante
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE disciplina
FROM dbo.ate_grupal_disciplina AS disciplina
WHERE disciplina.atencion_grupal_id IN (SELECT atencion_grupal_id FROM #grupo)
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.ate_grupal_participante AS participante
      WHERE participante.atencion_grupal_id = disciplina.atencion_grupal_id
  );

DELETE profesional
FROM dbo.ate_grupal_profesional AS profesional
WHERE profesional.atencion_grupal_id IN (SELECT atencion_grupal_id FROM #grupo)
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.ate_grupal_participante AS participante
      WHERE participante.atencion_grupal_id = profesional.atencion_grupal_id
  );

DELETE grupal
FROM dbo.ate_grupal AS grupal
WHERE grupal.atencion_grupal_id IN (SELECT atencion_grupal_id FROM #grupo)
  AND NOT EXISTS (
      SELECT 1
      FROM dbo.ate_grupal_participante AS participante
      WHERE participante.atencion_grupal_id = grupal.atencion_grupal_id
  );

DELETE FROM dbo.ate_individual
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.prog_persona
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE evento
FROM dbo.doc_coordinacion_evento AS evento
INNER JOIN dbo.doc_coordinacion AS coordinacion
    ON coordinacion.coordinacion_id = evento.coordinacion_id
WHERE coordinacion.caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.doc_coordinacion
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.doc_documento
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.doc_reporte_caso
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.caso_cierre
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.caso_estado_historial
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE proposito
FROM dbo.caso_plan_proposito AS proposito
INNER JOIN dbo.caso_plan AS plan_atencion
    ON plan_atencion.plan_id = proposito.plan_id
WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

DELETE estrategia
FROM dbo.caso_plan_estrategia AS estrategia
INNER JOIN dbo.caso_plan AS plan_atencion
    ON plan_atencion.plan_id = estrategia.plan_id
WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

DELETE disciplina_plan
FROM dbo.caso_plan_disciplina AS disciplina_plan
INNER JOIN dbo.caso_plan AS plan_atencion
    ON plan_atencion.plan_id = disciplina_plan.plan_id
WHERE plan_atencion.caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.caso_plan
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.ses_resolucion
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE factor
FROM dbo.ses_valoracion_factor AS factor
WHERE factor.valoracion_id IN (
    SELECT valoracion.valoracion_id
    FROM dbo.ses_valoracion AS valoracion
    WHERE valoracion.caso_id IN (SELECT caso_id FROM #caso)
       OR valoracion.referencia_id IN (SELECT referencia_id FROM #caso)
);

DELETE categoria
FROM dbo.ses_valoracion_categoria AS categoria
WHERE categoria.valoracion_id IN (
    SELECT valoracion.valoracion_id
    FROM dbo.ses_valoracion AS valoracion
    WHERE valoracion.caso_id IN (SELECT caso_id FROM #caso)
       OR valoracion.referencia_id IN (SELECT referencia_id FROM #caso)
);

DELETE FROM dbo.ses_valoracion
WHERE caso_id IN (SELECT caso_id FROM #caso)
   OR referencia_id IN (SELECT referencia_id FROM #caso);

DELETE FROM dbo.ses_situacion
WHERE caso_id IN (SELECT caso_id FROM #caso)
   OR referencia_id IN (SELECT referencia_id FROM #caso);

UPDATE dbo.ref_posible
SET estado = N'PENDIENTE',
    referencia_id = NULL
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE FROM dbo.ref_motivo
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE FROM dbo.ref_contexto
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE FROM dbo.ref_impresion
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE FROM dbo.caso_ai
WHERE caso_id IN (SELECT caso_id FROM #caso);

DELETE FROM dbo.ref_referencia
WHERE referencia_id IN (SELECT referencia_id FROM #caso);

DELETE vinculo
FROM dbo.vinculo_persona AS vinculo
WHERE vinculo.per_id_persona IN (SELECT per_id_persona FROM #caso)
  AND NOT EXISTS (
      SELECT 1 FROM dbo.caso_ai AS caso
      WHERE caso.per_id_persona = vinculo.per_id_persona
  )
  AND NOT EXISTS (
      SELECT 1 FROM dbo.ref_referencia AS referencia
      WHERE referencia.per_id_persona = vinculo.per_id_persona
  )
  AND NOT EXISTS (
      SELECT 1 FROM dbo.ref_posible AS posible
      WHERE posible.per_id_persona = vinculo.per_id_persona
  )
  AND NOT EXISTS (
      SELECT 1 FROM dbo.prog_persona AS programada
      WHERE programada.per_id_persona = vinculo.per_id_persona
  )
  AND NOT EXISTS (
      SELECT 1 FROM dbo.ate_grupal_participante AS participante
      WHERE participante.per_id_persona = vinculo.per_id_persona
  );

IF EXISTS (
    SELECT 1
    FROM dbo.caso_ai AS caso
    INNER JOIN SIDINACC_LOCAL.dbo.CAF_PERSONA AS persona
        ON persona.PER_idPersona = caso.per_id_persona COLLATE Latin1_General_100_CI_AS
    WHERE caso.per_id_persona LIKE N'SYN-%'
      AND persona.PER_fechaNacimiento IS NOT NULL
      AND DATEADD(YEAR, 18, CONVERT(date, persona.PER_fechaNacimiento)) <= @corte
)
    THROW 51156, N'Aun quedan casos sinteticos de personas adultas.', 1;

ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_cierre;
ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT FK_caso_ai_valoracion_vigente;
ALTER TABLE dbo.caso_ai WITH CHECK CHECK CONSTRAINT CK_caso_ai_estado_cierre;

COMMIT TRANSACTION;

SELECT COUNT(*) AS casos_sinteticos_restantes
FROM dbo.caso_ai
WHERE per_id_persona LIKE N'SYN-%';
GO
