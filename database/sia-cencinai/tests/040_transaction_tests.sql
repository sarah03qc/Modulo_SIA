/*
SIA_CENCINAI — prueba 040_transaction_tests
Demuestra rollback de una sola sesion. No simula una caida del proceso.
ops.cerrar_caso participa en la transaccion del llamador y no confirma solo.
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

DECLARE @antes int = (SELECT COUNT(*) FROM dbo.ref_referencia);
DECLARE @via bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'URGENCIA');
DECLARE @origen bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'VIGILANCIA_TAMIZAJE');

BEGIN TRANSACTION;
INSERT INTO dbo.ref_referencia (
    per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
    responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
    enviada_en, enviada_por, creada_en, creada_por
)
VALUES (
    N'SYN-1100102-05', N'PENDIENTE_REVISION', '20261105', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
    N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-060-2026', 1100102, 101, 1,
    '2026-11-05T08:00:00', N'sintetico.local.01', '2026-11-05T08:00:00', N'sintetico.local.01'
);
IF (SELECT COUNT(*) FROM dbo.ref_referencia) <> @antes + 1
    THROW 51090, N'La referencia de prueba no quedo visible dentro de la transaccion.', 1;
ROLLBACK TRANSACTION;
IF (SELECT COUNT(*) FROM dbo.ref_referencia) <> @antes
    THROW 51091, N'El rollback del envio no elimino la referencia.', 1;
PRINT N'PASS rollback de envio de referencia.';

DECLARE @caso bigint = (
    SELECT caso_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-06' AND estado = N'ACTIVO'
);
DECLARE @motivo bigint = (
    SELECT cat_item_id FROM dbo.cat_item WHERE codigo_catalogo = N'MOTIVO_CIERRE' AND codigo = N'CIERRE_SATISFACTORIO'
);

BEGIN TRANSACTION;
EXEC ops.cerrar_caso
    @caso_id = @caso,
    @per_id_persona = N'SYN-1100102-06',
    @motivo_item_id = @motivo,
    @explicacion = NULL,
    @fecha_cierre = '20261105',
    @responsable_usuario = N'sintetico.local.01',
    @usuario = N'sintetico.local.01',
    @ocurrido_en = '2026-11-05T16:00:00';
IF NOT EXISTS (SELECT 1 FROM dbo.caso_ai WHERE caso_id = @caso AND estado = N'CERRADO' AND cierre_caso_id = @caso)
    THROW 51092, N'El cierre no quedo completo dentro de la transaccion.', 1;
ROLLBACK TRANSACTION;
IF NOT EXISTS (SELECT 1 FROM dbo.caso_ai WHERE caso_id = @caso AND estado = N'ACTIVO' AND cierre_caso_id IS NULL)
    OR EXISTS (SELECT 1 FROM dbo.caso_cierre WHERE caso_id = @caso)
    THROW 51093, N'El rollback del cierre dejo un caso cerrado o una fila de cierre.', 1;
PRINT N'PASS rollback de cierre.';

DECLARE @vigente bigint = (
    SELECT valoracion_vigente_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-01' AND estado = N'ACTIVO'
);
BEGIN TRY
    BEGIN TRANSACTION;
    UPDATE dbo.ses_valoracion SET es_vigente = 0 WHERE valoracion_id = @vigente;
    INSERT INTO dbo.ses_valoracion (
        situacion_id, caso_id, referencia_id, instrumento_version_id, numero, es_vigente,
        matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo,
        responsable_usuario, fecha_valoracion, confirmada_en
    )
    SELECT TOP (1)
        situacion_id, caso_id, referencia_id, instrumento_version_id, 8, 1,
        matriz_version_id, N'ALTO', N'ALTA', N'ALTO',
        N'sintetico.local.01', '20261105', '2026-11-05T09:00:00'
    FROM dbo.ses_valoracion
    WHERE valoracion_id = @vigente;
    ROLLBACK TRANSACTION;
    THROW 51094, N'La revaloracion invalida no fue rechazada.', 1;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    IF ERROR_NUMBER() = 51094 THROW;
    IF ERROR_NUMBER() <> 547 THROW;
END CATCH
IF NOT EXISTS (SELECT 1 FROM dbo.ses_valoracion WHERE valoracion_id = @vigente AND es_vigente = 1)
    THROW 51095, N'El rollback de la revaloracion no restituyo la vigente.', 1;
PRINT N'PASS rollback de revaloracion.';
PRINT N'PASS pruebas de transaccion de una sesion. No prueban una caida del proceso.';
GO
