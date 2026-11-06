/*
SIA_CENCINAI — migracion 090_constraints_and_indexes
Cierra las FK circulares, publica la vista de Establecimiento y concede permisos.
Hasta que esta migracion confirma, el esquema no esta completo.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

IF OBJECT_ID(N'dbo.schema_migracion', N'U') IS NULL
    THROW 51000, N'Falta dbo.schema_migracion. Ejecute 001 antes de 090.', 1;

IF EXISTS (
    SELECT 1 FROM dbo.schema_migracion
    WHERE codigo = N'090_constraints_and_indexes' AND estado = N'APLICADA'
)
BEGIN
    PRINT N'090_constraints_and_indexes ya aplicada.';
    RETURN;
END

BEGIN TRY
    BEGIN TRANSACTION;

    ALTER TABLE dbo.caso_ai
        ADD CONSTRAINT FK_caso_ai_valoracion_vigente
            FOREIGN KEY (valoracion_vigente_id)
            REFERENCES dbo.ses_valoracion (valoracion_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;

    ALTER TABLE dbo.ses_valoracion
        ADD CONSTRAINT FK_ses_valoracion_caso
            FOREIGN KEY (caso_id)
            REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;

    ALTER TABLE dbo.ses_situacion
        ADD CONSTRAINT FK_ses_situacion_caso
            FOREIGN KEY (caso_id)
            REFERENCES dbo.caso_ai (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;

    ALTER TABLE dbo.caso_ai
        ADD CONSTRAINT FK_caso_ai_plan_vigente
            FOREIGN KEY (caso_id, plan_vigente_id)
            REFERENCES dbo.caso_plan (caso_id, plan_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;

    ALTER TABLE dbo.caso_ai
        ADD CONSTRAINT FK_caso_ai_cierre
            FOREIGN KEY (cierre_caso_id)
            REFERENCES dbo.caso_cierre (caso_id)
            ON DELETE NO ACTION ON UPDATE NO ACTION;

    EXEC(N'
CREATE VIEW dbo.caso_lista_establecimiento
WITH SCHEMABINDING
AS
SELECT
    c.caso_id,
    c.per_id_persona,
    c.establecimiento_id,
    c.oficina_local_id,
    c.region_id,
    c.estado,
    v.prioridad_codigo,
    c.fecha_apertura,
    z.fecha_cierre
FROM dbo.caso_ai AS c
INNER JOIN dbo.ses_valoracion AS v
    ON v.valoracion_id = c.valoracion_vigente_id
LEFT JOIN dbo.caso_cierre AS z
    ON z.caso_id = c.caso_id;
');

    GRANT SELECT ON dbo.vinculo_persona TO rol_aplicacion;
    GRANT INSERT ON dbo.vinculo_persona TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.ref_referencia TO rol_aplicacion;
    GRANT UPDATE ON dbo.ref_referencia (estado) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ref_contexto TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ref_motivo TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ref_impresion TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ref_posible TO rol_aplicacion;
    GRANT UPDATE ON dbo.ref_posible (estado, referencia_id) TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.ses_sesion TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_disciplina TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_situacion TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_valoracion TO rol_aplicacion;
    GRANT UPDATE ON dbo.ses_valoracion (es_vigente, caso_id) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_valoracion_categoria TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_valoracion_factor TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ses_resolucion TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.caso_ai TO rol_aplicacion;
    GRANT UPDATE ON dbo.caso_ai (valoracion_vigente_id, plan_vigente_id) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.caso_estado_historial TO rol_aplicacion;
    GRANT SELECT ON dbo.caso_cierre TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.caso_plan TO rol_aplicacion;
    GRANT UPDATE ON dbo.caso_plan (es_vigente) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.caso_plan_proposito TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.caso_plan_estrategia TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.caso_plan_disciplina TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.ate_individual TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ate_grupal TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ate_grupal_disciplina TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ate_grupal_profesional TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.ate_grupal_participante TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.prog_actividad TO rol_aplicacion;
    GRANT UPDATE ON dbo.prog_actividad (fecha_vigente, estado, motivo_vigente, observaciones) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.prog_cambio TO rol_aplicacion;
    GRANT SELECT, INSERT, DELETE ON dbo.prog_persona TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.doc_documento TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.doc_coordinacion TO rol_aplicacion;
    GRANT UPDATE ON dbo.doc_coordinacion (
        institucion_item_id, institucion_catalogo, institucion_texto,
        estado_item_id, estado_catalogo, estado_texto
    ) TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.doc_coordinacion_evento TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.doc_reporte_caso TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.inf_informe TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.inf_visualizacion TO rol_aplicacion;
    GRANT SELECT, INSERT ON dbo.inf_agregado TO rol_aplicacion;

    GRANT SELECT, INSERT, DELETE ON dbo.bor_captura TO rol_aplicacion;
    GRANT UPDATE ON dbo.bor_captura (
        contenido, actualizado_en, clave_negocio, ambito_nivel, oficina_local_id, establecimiento_id
    ) TO rol_aplicacion;

    GRANT SELECT, INSERT ON dbo.aud_evento TO rol_aplicacion;
    GRANT EXECUTE ON ops.cerrar_caso TO rol_aplicacion;
    GRANT SELECT ON dbo.caso_lista_establecimiento TO rol_aplicacion;

    GRANT SELECT ON dbo.cat_version TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_item TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_matriz_prioridad TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_instrumento_version TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_instrumento_categoria TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_instrumento_factor TO rol_aplicacion;
    GRANT SELECT ON dbo.cat_codigo_region_referencia TO rol_aplicacion;

    GRANT SELECT ON dbo.caso_lista_establecimiento TO rol_establecimiento;

    GRANT SELECT ON dbo.cat_version TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.cat_item TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.cat_matriz_prioridad TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.cat_codigo_region_referencia TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.vinculo_persona TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ref_referencia (
        referencia_id, per_id_persona, estado, fecha_referencia,
        via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, plantilla_version, consecutivo,
        establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por, fila_version
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ref_motivo (
        motivo_id, referencia_id, cat_item_id, motivo_catalogo
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_ai TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_estado_historial (
        historial_id, caso_id, estado, ocurrido_en, usuario
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_plan TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_plan_proposito TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_plan_estrategia TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_plan_disciplina TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ses_valoracion (
        valoracion_id, situacion_id, caso_id, referencia_id, instrumento_version_id,
        numero, es_vigente, matriz_version_id, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ate_individual (
        atencion_individual_id, caso_id, per_id_persona, fecha_atencion,
        disciplina_item_id, disciplina_catalogo, estrategia_item_id, estrategia_catalogo,
        profesional_usuario, digitador_usuario, digitada_en
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ate_grupal (
        atencion_grupal_id, oficina_local_id, establecimiento_id, fecha_atencion,
        tipo_item_id, tipo_catalogo, digitador_usuario, digitada_en
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ate_grupal_participante TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.ate_grupal_disciplina TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.prog_actividad TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.prog_cambio TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.inf_informe (
        informe_id, titulo, responsable_usuario, rol_codigo, ambito_nivel,
        region_id, oficina_local_id, establecimiento_id, periodo_anio,
        filtros_resumen, corte_en, generado_en
    ) TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.inf_visualizacion TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.inf_agregado TO rol_lectura_regional, rol_lectura_nacional;
    GRANT SELECT ON dbo.caso_lista_establecimiento TO rol_lectura_regional, rol_lectura_nacional;

    GRANT SELECT, INSERT ON dbo.cat_version TO rol_catalogo;
    GRANT UPDATE ON dbo.cat_version (vigente) TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_item TO rol_catalogo;
    GRANT UPDATE ON dbo.cat_item (activo) TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_matriz_prioridad TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_instrumento_version TO rol_catalogo;
    GRANT UPDATE ON dbo.cat_instrumento_version (vigente) TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_instrumento_categoria TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_instrumento_factor TO rol_catalogo;
    GRANT UPDATE ON dbo.cat_instrumento_factor (activo) TO rol_catalogo;
    GRANT SELECT, INSERT ON dbo.cat_codigo_region_referencia TO rol_catalogo;

    GRANT SELECT ON dbo.aud_evento TO rol_auditoria;
    GRANT SELECT ON dbo.aud_migracion_lote TO rol_auditoria;
    GRANT SELECT ON dbo.aud_migracion_error TO rol_auditoria;

    INSERT INTO dbo.schema_migracion (codigo, orden, estado, aplicada_en)
    VALUES (N'090_constraints_and_indexes', 90, N'APLICADA', CAST(SYSUTCDATETIME() AS datetime2(0)));

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    THROW;
END CATCH
GO
