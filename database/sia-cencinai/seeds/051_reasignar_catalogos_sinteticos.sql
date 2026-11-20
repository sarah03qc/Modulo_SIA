/*
SIA_CENCINAI — semilla 051_reasignar_catalogos_sinteticos
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

SOLO DESARROLLO. Las semillas 020, 030 y 040 crearon datos de prueba que apuntan a
items artificiales (SYN_NUTRICION, SYN_TRABAJO_SOCIAL, SYN_ACOMPANAMIENTO). Esos items
no son catalogo funcional. Este script reasigna solo esas filas de prueba a los items
vigentes de la semilla 015 y desactiva los items artificiales (activo = 0).

Reglas de reasignacion (deterministas y reproducibles):
- Atencion individual: disciplina = atencion_individual_id % 5; estrategia = atencion_individual_id % 9
  (no se asigna "Otra" porque exigiria un texto que la prueba no tiene).
- Tablas de conjunto (sesion, plan, atencion grupal): SYN_NUTRICION -> clave % 5;
  SYN_TRABAJO_SOCIAL -> (clave + 1) % 5. Nunca colisionan dentro de la misma clave.
- Estrategia del plan: plan_id % 9.

No borra filas. No toca registros que apunten a items distintos de SYN_*.
No modifica SIDINACC_LOCAL. Requiere 015 aplicada.
Para ejecutar en desarrollo, cambie @permitir a 1.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @permitir bit = 0;
IF @permitir <> 1
    THROW 51160, N'Semilla 051 bloqueada. Cambie @permitir a 1 solo en desarrollo autorizado.', 1;

DECLARE @disc TABLE (posicion int PRIMARY KEY, item_id bigint NOT NULL);
DECLARE @estr TABLE (posicion int PRIMARY KEY, item_id bigint NOT NULL);

INSERT INTO @disc (posicion, item_id)
SELECT i.orden - 1, i.cat_item_id
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v ON v.cat_version_id = i.cat_version_id
WHERE v.codigo_catalogo = N'DISCIPLINA' AND v.vigente = 1 AND i.activo = 1;

INSERT INTO @estr (posicion, item_id)
SELECT i.orden - 1, i.cat_item_id
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v ON v.cat_version_id = i.cat_version_id
WHERE v.codigo_catalogo = N'ESTRATEGIA' AND v.vigente = 1 AND i.activo = 1
  AND i.requiere_texto = 0;

IF (SELECT COUNT(*) FROM @disc) <> 5 OR (SELECT COUNT(*) FROM @estr) <> 9
    THROW 51161, N'Los catalogos vigentes de 015 no estan completos.', 1;

DECLARE @syn_nut bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'DISCIPLINA' AND codigo = N'SYN_NUTRICION'
);
DECLARE @syn_ts bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'DISCIPLINA' AND codigo = N'SYN_TRABAJO_SOCIAL'
);
DECLARE @syn_est bigint = (
    SELECT cat_item_id FROM dbo.cat_item
    WHERE codigo_catalogo = N'ESTRATEGIA' AND codigo = N'SYN_ACOMPANAMIENTO'
);

IF @syn_nut IS NULL AND @syn_ts IS NULL AND @syn_est IS NULL
BEGIN
    PRINT N'No hay items artificiales. Sin cambios.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    UPDATE a
    SET disciplina_item_id = d.item_id
    FROM dbo.ate_individual AS a
    INNER JOIN @disc AS d ON d.posicion = a.atencion_individual_id % 5
    WHERE a.disciplina_item_id IN (@syn_nut, @syn_ts);

    UPDATE a
    SET estrategia_item_id = e.item_id
    FROM dbo.ate_individual AS a
    INNER JOIN @estr AS e ON e.posicion = a.atencion_individual_id % 9
    WHERE a.estrategia_item_id = @syn_est;

    UPDATE s
    SET disciplina_item_id = d.item_id
    FROM dbo.ses_disciplina AS s
    INNER JOIN @disc AS d
        ON d.posicion = (s.sesion_id + CASE WHEN s.disciplina_item_id = @syn_ts THEN 1 ELSE 0 END) % 5
    WHERE s.disciplina_item_id IN (@syn_nut, @syn_ts);

    UPDATE p
    SET disciplina_item_id = d.item_id
    FROM dbo.caso_plan_disciplina AS p
    INNER JOIN @disc AS d
        ON d.posicion = (p.plan_id + CASE WHEN p.disciplina_item_id = @syn_ts THEN 1 ELSE 0 END) % 5
    WHERE p.disciplina_item_id IN (@syn_nut, @syn_ts);

    UPDATE g
    SET disciplina_item_id = d.item_id
    FROM dbo.ate_grupal_disciplina AS g
    INNER JOIN @disc AS d
        ON d.posicion = (g.atencion_grupal_id
            + CASE WHEN g.disciplina_item_id = @syn_ts THEN 1 ELSE 0 END) % 5
    WHERE g.disciplina_item_id IN (@syn_nut, @syn_ts);

    UPDATE p
    SET estrategia_item_id = e.item_id
    FROM dbo.caso_plan_estrategia AS p
    INNER JOIN @estr AS e ON e.posicion = p.plan_id % 9
    WHERE p.estrategia_item_id = @syn_est;

    IF EXISTS (SELECT 1 FROM dbo.ate_individual
               WHERE disciplina_item_id IN (@syn_nut, @syn_ts) OR estrategia_item_id = @syn_est)
        OR EXISTS (SELECT 1 FROM dbo.ses_disciplina WHERE disciplina_item_id IN (@syn_nut, @syn_ts))
        OR EXISTS (SELECT 1 FROM dbo.caso_plan_disciplina WHERE disciplina_item_id IN (@syn_nut, @syn_ts))
        OR EXISTS (SELECT 1 FROM dbo.ate_grupal_disciplina WHERE disciplina_item_id IN (@syn_nut, @syn_ts))
        OR EXISTS (SELECT 1 FROM dbo.caso_plan_estrategia WHERE estrategia_item_id = @syn_est)
        THROW 51162, N'Quedaron filas apuntando a items artificiales.', 1;

    UPDATE dbo.cat_item
    SET activo = 0
    WHERE cat_item_id IN (@syn_nut, @syn_ts, @syn_est);

    COMMIT TRANSACTION;
    PRINT N'Reasignacion de catalogos sinteticos completada.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
