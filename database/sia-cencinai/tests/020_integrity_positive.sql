/*
SIA_CENCINAI — prueba 020_integrity_positive
Exige la semilla sintetica. Las inserciones de mas se revierten.
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

IF NOT EXISTS (
    SELECT 1 FROM dbo.ref_referencia
    WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-001-2026'
)
    THROW 51052, N'Falta la semilla sintetica.', 1;

IF (SELECT COUNT(*) FROM dbo.ref_referencia WHERE per_id_persona = N'SYN-1100102-01') <> 2
    THROW 51053, N'SYN-1100102-01 deberia tener dos referencias historicas.', 1;

IF (SELECT COUNT(*) FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-01' AND estado = N'ACTIVO') <> 1
    THROW 51054, N'SYN-1100102-01 deberia tener un caso activo.', 1;

IF (SELECT COUNT(*) FROM dbo.caso_ai WHERE estado = N'CERRADO') <> 2
    THROW 51055, N'Deberia haber dos casos cerrados.', 1;

IF NOT EXISTS (
    SELECT 1
    FROM dbo.caso_cierre
    WHERE motivo_codigo = N'TRASLADO'
      AND destino_establecimiento_id = 5010104
)
    THROW 51056, N'Falta el traslado sintetico sin caso sucesor.', 1;

IF EXISTS (
    SELECT 1
    FROM dbo.caso_ai
    WHERE per_id_persona = N'SYN-5010104-01'
      AND consecutivo_origen = N'DNCC-DRCS-OL101-1100102-REF-004-2026'
)
    THROW 51057, N'La referencia de destino no debe ser el caso de origen del traslado.', 1;

IF (SELECT COUNT(*) FROM dbo.ses_valoracion WHERE caso_id = (
        SELECT caso_id FROM dbo.caso_ai WHERE per_id_persona = N'SYN-1100102-01' AND estado = N'ACTIVO'
    )) <> 2
    THROW 51058, N'La revaloracion de SYN-1100102-01 no quedo versionada.', 1;

IF (SELECT COUNT(*) FROM dbo.ate_grupal_participante p
    JOIN dbo.ate_grupal g ON g.atencion_grupal_id = p.atencion_grupal_id) <> 3
    THROW 51059, N'La grupal sintetica deberia tener tres participantes.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.ate_grupal_participante
    WHERE per_id_persona = N'SYN-1100102-05' AND caso_id IS NULL AND asistio = 1
)
    THROW 51060, N'Falta el participante sintetico sin caso.', 1;

IF NOT EXISTS (
    SELECT 1 FROM dbo.prog_actividad
    WHERE estado = N'REPROGRAMADA' AND fecha_vigente = '20260601' AND fecha_prevista = '20260501'
)
    THROW 51061, N'Falta la actividad reprogramada sobre la misma fila.', 1;

IF (SELECT COUNT(*) FROM dbo.inf_visualizacion) < 5
    THROW 51062, N'El informe sintetico no tiene al menos cinco visualizaciones.', 1;

DECLARE @antes int = (SELECT COUNT(*) FROM dbo.ref_referencia);

BEGIN TRY
    BEGIN TRANSACTION;
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    SELECT
        N'SYN-1100102-05', N'PENDIENTE_REVISION', '20261101', via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-050-2026', 1100102, 101, 1,
        '2026-11-01T08:00:00', N'sintetico.local.01', '2026-11-01T08:00:00', N'sintetico.local.01'
    FROM dbo.ref_referencia
    WHERE consecutivo = N'DNCC-DRCS-OL101-1100102-REF-005-2026';
    ROLLBACK TRANSACTION;
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
    THROW;
END CATCH

IF (SELECT COUNT(*) FROM dbo.ref_referencia) <> @antes
    THROW 51063, N'La referencia de prueba no se revirtio.', 1;

PRINT N'PASS integridad positiva del conjunto sintetico.';
GO
