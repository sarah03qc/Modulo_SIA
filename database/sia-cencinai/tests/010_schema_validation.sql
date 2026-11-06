/*
SIA_CENCINAI — prueba 010_schema_validation
Lectura de catalogos del motor. No modifica datos.
Resultado esperado: ningun THROW y el mensaje RESUMEN OK.
No sustituye una ejecucion real: este archivo no se ha corrido en el diseno fisico.

Cambie @ejecutar a 1 solo despues de aplicar las migraciones 001 a 090.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @ejecutar bit = 0;
IF @ejecutar <> 1
    THROW 51040, N'Prueba bloqueada. Cambie @ejecutar a 1 en una instancia aislada ya migrada.', 1;

DECLARE @esperadas TABLE (nombre sysname NOT NULL PRIMARY KEY);
INSERT INTO @esperadas (nombre) VALUES
    (N'vinculo_persona'),
    (N'cat_version'), (N'cat_item'), (N'cat_matriz_prioridad'),
    (N'cat_instrumento_version'), (N'cat_instrumento_categoria'), (N'cat_instrumento_factor'),
    (N'cat_codigo_region_referencia'),
    (N'ref_referencia'), (N'ref_contexto'), (N'ref_motivo'), (N'ref_impresion'), (N'ref_posible'),
    (N'ses_sesion'), (N'ses_disciplina'), (N'ses_situacion'), (N'ses_valoracion'),
    (N'ses_valoracion_categoria'), (N'ses_valoracion_factor'), (N'ses_resolucion'),
    (N'caso_ai'), (N'caso_estado_historial'), (N'caso_cierre'),
    (N'caso_plan'), (N'caso_plan_proposito'), (N'caso_plan_estrategia'), (N'caso_plan_disciplina'),
    (N'ate_individual'), (N'ate_grupal'), (N'ate_grupal_disciplina'),
    (N'ate_grupal_profesional'), (N'ate_grupal_participante'),
    (N'prog_actividad'), (N'prog_cambio'), (N'prog_persona'),
    (N'doc_documento'), (N'doc_coordinacion'), (N'doc_coordinacion_evento'), (N'doc_reporte_caso'),
    (N'inf_informe'), (N'inf_visualizacion'), (N'inf_agregado'),
    (N'bor_captura'), (N'aud_evento'), (N'aud_migracion_lote'), (N'aud_migracion_error');

IF (SELECT COUNT(*) FROM @esperadas) <> 46
    THROW 51041, N'La lista de prueba no tiene 46 tablas de dominio.', 1;

IF EXISTS (
    SELECT 1
    FROM @esperadas AS e
    WHERE OBJECT_ID(N'dbo.' + e.nombre, N'U') IS NULL
)
    THROW 51042, N'Falta una tabla de dominio esperada.', 1;

IF EXISTS (
    SELECT 1
    FROM sys.tables
    WHERE schema_id = SCHEMA_ID(N'dbo')
      AND (name LIKE N'CAF[_]%' OR name LIKE N'RCS[_]%')
)
    THROW 51043, N'Hay tablas CAF_ o RCS_ dentro de SIA_CENCINAI.', 1;

IF OBJECT_ID(N'dbo.caso_lista_establecimiento', N'V') IS NULL
    THROW 51044, N'Falta la vista caso_lista_establecimiento.', 1;

IF OBJECT_ID(N'ops.cerrar_caso', N'P') IS NULL
    THROW 51045, N'Falta ops.cerrar_caso.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_caso_activo'
      AND is_unique = 1
      AND has_filter = 1
)
    THROW 51046, N'UX_caso_activo no es un indice unico filtrado.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM sys.indexes
    WHERE name = N'UX_ref_referencia_consecutivo'
      AND is_unique = 1
)
    THROW 51047, N'Falta el indice unico del consecutivo.', 1;

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE delete_referential_action <> 0
       OR update_referential_action <> 0
)
    THROW 51048, N'Hay una FK con CASCADE o SET NULL.', 1;

IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys AS fk
    WHERE OBJECT_SCHEMA_NAME(fk.referenced_object_id) IS NULL
)
    THROW 51049, N'Hay una FK cuyo destino no esta en esta base.', 1;

IF (SELECT COUNT(*) FROM dbo.schema_migracion WHERE estado = N'APLICADA') <> 10
    THROW 51050, N'No estan las diez migraciones aplicadas, de 001 a 090.', 1;

DECLARE @dominio int = (
    SELECT COUNT(*)
    FROM sys.tables
    WHERE schema_id = SCHEMA_ID(N'dbo')
      AND name <> N'schema_migracion'
);
IF @dominio <> 46
    THROW 51051, N'El numero de tablas de dominio no es 46.', 1;

PRINT N'RESUMEN OK: 46 tablas de dominio, vista, procedimiento de cierre, sin CAF_/RCS_ y sin cascada.';
GO
