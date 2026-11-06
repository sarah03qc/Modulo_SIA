/*
SIA_CENCINAI — concurrencia, sesion B.
Ejecutar en otra ventana mientras 060 espera en WAITFOR.
Resultado esperado: error 2601 sobre UX_ref_referencia_consecutivo.
Si A ya confirmo antes de empezar B, el 2601 demuestra el indice, no la carrera.
Esta archivo no imprime PASS.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @ejecutar bit = 0;
IF @ejecutar <> 1
    THROW 51111, N'Concurrencia bloqueada. Cambie @ejecutar a 1 solo en una copia desechable.', 1;

DECLARE @via bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'URGENCIA');
DECLARE @origen bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'VIGILANCIA_TAMIZAJE');
DECLARE @inicio datetime2(0) = CAST(SYSUTCDATETIME() AS datetime2(0));

BEGIN TRY
    INSERT INTO dbo.ref_referencia (
        per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
        responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
        enviada_en, enviada_por, creada_en, creada_por
    )
    VALUES (
        N'SYN-1100102-90', N'PENDIENTE_REVISION', '20261105', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
        N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-900-2026', 1100102, 101, 1,
        '2026-11-05T08:01:00', N'sintetico.local.01', '2026-11-05T08:01:00', N'sintetico.local.01'
    );
    THROW 51112, N'La sesion B inserto el mismo consecutivo. La prueba no puede aprobarse.', 1;
END TRY
BEGIN CATCH
    PRINT N'Sesion B inicio UTC ' + CONVERT(nvarchar(19), @inicio, 126);
    PRINT N'Error ' + CONVERT(nvarchar(10), ERROR_NUMBER()) + N'. Se esperaba 2601 si A gano la carrera o ya habia confirmado.';
    PRINT N'No se asigna otro consecutivo. Este archivo no declara la prueba aprobada.';
    IF ERROR_NUMBER() <> 2601
        THROW;
END CATCH
GO
