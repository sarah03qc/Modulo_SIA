/*
SIA_CENCINAI — prueba 030_integrity_negative
Cada rechazo se revierte. Un caso que confirme cuando debia fallar detiene el script.
La seccion final muestra, sin darlo por corregido, el hueco conocido:
un caso ACTIVO puede tener fila de cierre si la sesion no usa la operacion de cierre.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT OFF;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @ejecutar bit = 0;
IF @ejecutar <> 1
    THROW 51040, N'Prueba bloqueada. Cambie @ejecutar a 1 despues de la semilla sintetica.', 1;

IF NOT EXISTS (SELECT 1 FROM dbo.ref_referencia WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-001-2026')
    THROW 51052, N'Falta la semilla sintetica.', 1;

DECLARE @via bigint, @origen bigint, @disc bigint, @estr bigint, @tipo_prog bigint, @inst bigint, @matriz bigint;
DECLARE @otro bigint, @ok bigint, @caso01 bigint, @caso02 bigint;
SELECT @via = cat_item_id FROM dbo.cat_item WHERE codigo = N'URGENCIA';
SELECT @origen = cat_item_id FROM dbo.cat_item WHERE codigo = N'VIGILANCIA_TAMIZAJE';
SELECT @disc = cat_item_id FROM dbo.cat_item WHERE codigo = N'SYN_NUTRICION';
SELECT @estr = cat_item_id FROM dbo.cat_item WHERE codigo = N'SYN_ACOMPANAMIENTO';
SELECT @tipo_prog = cat_item_id FROM dbo.cat_item WHERE codigo = N'SESION_INTERDISCIPLINARIA';
SELECT @inst = instrumento_version_id FROM dbo.cat_instrumento_version WHERE numero_version = 1;
SELECT @matriz = cat_version_id FROM dbo.cat_version WHERE codigo_catalogo = N'MATRIZ_PRIORIDAD' AND numero_version = 1;
SELECT @otro = cat_item_id FROM dbo.cat_item WHERE codigo = N'OTRO' AND codigo_catalogo = N'MOTIVO_CIERRE';
SELECT @ok = cat_item_id FROM dbo.cat_item WHERE codigo = N'CIERRE_SATISFACTORIO';
SELECT @caso01 = caso_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-01' AND estado = N'ACTIVO';
SELECT @caso02 = caso_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-02' AND estado = N'CERRADO';

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES (
        N'SYN-1100102-04', N'PENDIENTE_REVISION', '20261102', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
        N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-001-2026', 1100102, 101, 1,
        '2026-11-02T08:00:00', N'sintetico.local.01', '2026-11-02T08:00:00', N'sintetico.local.01'
    );
    ROLLBACK TRANSACTION;
    THROW 51070, N'FALLO: el consecutivo duplicado fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 2601 THROW;
    PRINT N'PASS consecutivo duplicado -> 2601.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES (
        N'SYN-1100102-04', N'PENDIENTE_REVISION', '20261102', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
        N'sintetico.local.01', N'MANUAL', N'dncc-drcs-ol101-1100102-ref-008-2026', 1100102, 101, 1,
        '2026-11-02T08:00:00', N'sintetico.local.01', '2026-11-02T08:00:00', N'sintetico.local.01'
    );
    ROLLBACK TRANSACTION;
    THROW 51071, N'FALLO: el consecutivo en minusculas fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS consecutivo no canonico -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @ref bigint, @ses bigint, @sit bigint, @val bigint;
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES (
        N'SYN-1100102-01', N'PENDIENTE_REVISION', '20261102', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
        N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-099-2026', 1100102, 101, 1,
        '2026-11-02T08:00:00', N'sintetico.local.01', '2026-11-02T08:00:00', N'sintetico.local.01'
    );
    SET @ref = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, creada_en, creada_por)
    VALUES (101, '20261102', '08:00:00', '09:00:00', '2026-11-02T08:00:00', N'sintetico.local.01');
    SET @ses = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id) VALUES (@ses, @ref, NULL);
    SET @sit = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (@sit, NULL, @ref, @inst, 1, 1, @matriz, N'BAJO', N'ALTA', N'BAJO', N'sintetico.local.01', '20261102', '2026-11-02T08:10:00');
    SET @val = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_ai (
        per_id_persona, referencia_id, estado, fecha_apertura, abierto_en, abierto_por,
        establecimiento_id, oficina_local_id, region_id, consecutivo_origen, valoracion_vigente_id
    )
    VALUES (
        N'SYN-1100102-01', @ref, N'ACTIVO', '20261102', '2026-11-02T08:20:00', N'sintetico.local.01',
        1100102, 101, 1, N'DNCC-DRCS-OL101-1100102-REF-099-2026', @val
    );
    ROLLBACK TRANSACTION;
    THROW 51072, N'FALLO: un segundo caso activo fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 2601 THROW;
    PRINT N'PASS segundo caso activo -> 2601.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ate_individual (
        caso_id, per_id_persona, fecha_atencion, disciplina_item_id, disciplina_catalogo,
        estrategia_item_id, estrategia_catalogo, acciones, recomendaciones,
        profesional_usuario, digitador_usuario, digitada_en
    )
    VALUES (
        @caso01, N'SYN-1100102-05', '20261102', @disc, N'DISCIPLINA', @estr, N'ESTRATEGIA',
        N'Accion', N'Recomendacion', N'sintetico.local.01', N'sintetico.digitador.01', '2026-11-02T08:00:00'
    );
    ROLLBACK TRANSACTION;
    THROW 51073, N'FALLO: la atencion individual cruzada fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS atencion individual de otra persona -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ate_grupal_participante (atencion_grupal_id, per_id_persona, caso_id, asistio)
    SELECT TOP (1) atencion_grupal_id, N'SYN-1100102-04', @caso01, 1
    FROM dbo.ate_grupal;
    ROLLBACK TRANSACTION;
    THROW 51074, N'FALLO: la participacion cruzada fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS participacion grupal cruzada -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.prog_persona (actividad_id, per_id_persona, caso_id)
    SELECT TOP (1) actividad_id, N'SYN-1100102-05', @caso01
    FROM dbo.prog_actividad
    WHERE estado = N'PROGRAMADA';
    ROLLBACK TRANSACTION;
    THROW 51075, N'FALLO: la persona programada cruzada fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS programacion cruzada -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ref_motivo (referencia_id, cat_item_id, motivo_catalogo)
    SELECT TOP (1) referencia_id, @via, N'MOTIVO_REFERENCIA'
    FROM dbo.ref_referencia
    WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-005-2026';
    ROLLBACK TRANSACTION;
    THROW 51076, N'FALLO: un motivo de otro catalogo fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS motivo de catalogo incorrecto -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @ses_bad bigint;
    DECLARE @ref_bad bigint = (
        SELECT referencia_id FROM dbo.ref_referencia
        WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-005-2026'
    );
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, creada_en, creada_por)
    VALUES (101, '20261103', '08:00:00', '09:00:00', '2026-11-03T08:00:00', N'sintetico.local.01');
    SET @ses_bad = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id)
    VALUES (@ses_bad, @ref_bad, NULL);
    DECLARE @sit_bad bigint = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    VALUES (
        @sit_bad, NULL, @ref_bad, @inst, 1, 0, @matriz, N'ALTO', N'ALTA', N'ALTO',
        N'sintetico.local.01', '20261103', '2026-11-03T08:00:00'
    );
    ROLLBACK TRANSACTION;
    THROW 51077, N'FALLO: una prioridad fuera de RN-009 fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS prioridad incompatible -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @ses_vig bigint;
    INSERT INTO dbo.ses_sesion (oficina_local_id, fecha, hora_inicio, hora_fin, creada_en, creada_por)
    VALUES (101, '20261104', '08:00:00', '09:00:00', '2026-11-04T08:00:00', N'sintetico.local.01');
    SET @ses_vig = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_situacion (sesion_id, referencia_id, caso_id)
    VALUES (@ses_vig, NULL, @caso01);
    DECLARE @sit_vig bigint = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    SELECT @sit_vig, @caso01, referencia_id, @inst, 9, 1, @matriz, N'BAJO', N'ALTA', N'BAJO',
           N'sintetico.local.01', '20261102', '2026-11-02T08:00:00'
    FROM dbo.caso_ai WHERE caso_id = @caso01;
    ROLLBACK TRANSACTION;
    THROW 51078, N'FALLO: una segunda valoracion vigente fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 2601 THROW;
    PRINT N'PASS segunda valoracion vigente -> 2601.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    )
    SELECT caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
           explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    FROM dbo.caso_cierre
    WHERE caso_id = @caso02;
    ROLLBACK TRANSACTION;
    THROW 51079, N'FALLO: un segundo cierre fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 2627 THROW;
    PRINT N'PASS segundo cierre -> 2627.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @h bigint;
    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES (@caso01, N'CERRADO', '2026-11-02T08:00:00', N'sintetico.local.01', @otro, N'MOTIVO_CIERRE');
    SET @h = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    )
    VALUES (
        @caso01, @otro, N'MOTIVO_CIERRE', N'OTRO', 1, NULL, '20261102', N'sintetico.local.01',
        '2026-11-02T08:00:00', @h, N'CERRADO'
    );
    ROLLBACK TRANSACTION;
    THROW 51080, N'FALLO: Otro sin explicacion fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS Otro sin explicacion -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @h2 bigint;
    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES (@caso01, N'CERRADO', '2026-11-02T08:00:00', N'sintetico.local.01', @ok, N'MOTIVO_CIERRE');
    SET @h2 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado,
        destino_establecimiento_id
    )
    VALUES (
        @caso01, @ok, N'MOTIVO_CIERRE', N'CIERRE_SATISFACTORIO', 0, NULL, '20261102', N'sintetico.local.01',
        '2026-11-02T08:00:00', @h2, N'CERRADO', 5010104
    );
    ROLLBACK TRANSACTION;
    THROW 51081, N'FALLO: un destino con motivo distinto de traslado fue aceptado.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS destino fuera de traslado -> 547.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES (
        N'NO-EXISTE', N'PENDIENTE_REVISION', '20261102', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
        N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-098-2026', 1100102, 101, 1,
        '2026-11-02T08:00:00', N'sintetico.local.01', '2026-11-02T08:00:00', N'sintetico.local.01'
    );
    ROLLBACK TRANSACTION;
    THROW 51082, N'FALLO: una persona inexistente fue aceptada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() <> 547 THROW;
    PRINT N'PASS persona inexistente -> 547.';
END CATCH

EXECUTE AS USER = N'usuario_aplicacion';
BEGIN TRY
    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    )
    SELECT TOP (1) caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
           explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    FROM dbo.caso_cierre;
    REVERT;
    THROW 51083, N'FALLO: el rol de aplicacion inserto un cierre.', 1;
END TRY
BEGIN CATCH
    DECLARE @permiso int = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    REVERT;
    IF @permiso <> 229 THROW;
    PRINT N'PASS rol_aplicacion sin INSERT en caso_cierre -> 229.';
END CATCH

EXECUTE AS USER = N'usuario_aplicacion';
BEGIN TRY
    UPDATE dbo.caso_ai
    SET estado = N'CERRADO'
    WHERE caso_id = @caso01;
    REVERT;
    THROW 51085, N'FALLO: el rol de aplicacion actualizo el estado del caso.', 1;
END TRY
BEGIN CATCH
    DECLARE @estado_permiso int = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    REVERT;
    IF @estado_permiso <> 230 THROW;
    PRINT N'PASS rol_aplicacion sin UPDATE de caso_ai.estado -> 230.';
END CATCH

EXECUTE AS USER = N'usuario_regional';
BEGIN TRY
    DECLARE @clave nvarchar(200);
    SELECT @clave = clave_archivo
    FROM dbo.inf_informe;
    REVERT;
    THROW 51086, N'FALLO: lectura regional de clave_archivo.', 1;
END TRY
BEGIN CATCH
    DECLARE @clave_permiso int = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    REVERT;
    IF @clave_permiso <> 230 THROW;
    PRINT N'PASS lectura regional sin clave_archivo -> 230.';
END CATCH

EXECUTE AS USER = N'usuario_regional';
BEGIN TRY
    DECLARE @narrativa nvarchar(2000);
    SELECT @narrativa = acciones_previas
    FROM dbo.ref_referencia;
    REVERT;
    THROW 51087, N'FALLO: lectura regional de acciones_previas.', 1;
END TRY
BEGIN CATCH
    DECLARE @narrativa_permiso int = ERROR_NUMBER();
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    REVERT;
    IF @narrativa_permiso <> 230 THROW;
    PRINT N'PASS lectura regional sin acciones_previas -> 230.';
END CATCH

BEGIN TRY
    BEGIN TRANSACTION;
    DECLARE @h3 bigint;
    DECLARE @activo bigint = (
        SELECT caso_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-06' AND estado = N'ACTIVO'
    );
    INSERT INTO dbo.caso_estado_historial (caso_id, estado, ocurrido_en, usuario, motivo_item_id, motivo_catalogo)
    VALUES (@activo, N'CERRADO', '2026-11-02T08:00:00', N'sintetico.local.01', @ok, N'MOTIVO_CIERRE');
    SET @h3 = CONVERT(bigint, SCOPE_IDENTITY());
    INSERT INTO dbo.caso_cierre (
        caso_id, motivo_item_id, motivo_catalogo, motivo_codigo, motivo_requiere_texto,
        explicacion, fecha_cierre, responsable_usuario, registrado_en, historial_id, historial_estado
    )
    VALUES (
        @activo, @ok, N'MOTIVO_CIERRE', N'CIERRE_SATISFACTORIO', 0, NULL, '20261102',
        N'sintetico.local.01', '2026-11-02T08:00:00', @h3, N'CERRADO'
    );
    IF NOT EXISTS (
        SELECT 1
        FROM dbo.caso_ai AS c
        INNER JOIN dbo.caso_cierre AS z ON z.caso_id = c.caso_id
        WHERE c.caso_id = @activo AND c.estado = N'ACTIVO'
    )
        THROW 51084, N'El detector no vio el caso activo con fila de cierre.', 1;
    ROLLBACK TRANSACTION;
    PRINT N'NOTA: el CHECK no impide un ACTIVO con fila de cierre ya confirmada. La conciliacion si lo ve. Esta nota no es un fallo de la prueba.';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH

PRINT N'PASS integridad negativa.';
GO
