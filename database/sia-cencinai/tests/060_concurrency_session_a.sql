/*
SIA_CENCINAI — concurrencia, sesion A.
NO ejecutar este archivo junto con la sesion B en la misma ventana.
NO declara la prueba como aprobada: hacen falta dos sesiones reales.

Escenario 1, consecutivo.
1. Aplique migraciones y semillas en una copia desechable.
2. Ejecute este archivo.
3. Mientras espera, ejecute 061 en otra ventana.
4. A confirma. B debe recibir 2601 y no obtiene otro consecutivo.
5. La fila REF-900-2026 queda confirmada. No la use para la prueba de reporteria.

Escenario 2, dos casos activos, queda descrito en TEST_PLAN.md.
Usa el mismo protocolo de bloqueo sobre vinculo_persona y el indice UX_caso_activo.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;
SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;

DECLARE @ejecutar bit = 0;
IF @ejecutar <> 1
    THROW 51110, N'Concurrencia bloqueada. Cambie @ejecutar a 1 solo en una copia desechable.', 1;

DECLARE @via bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'URGENCIA');
DECLARE @origen bigint = (SELECT cat_item_id FROM dbo.cat_item WHERE codigo = N'VIGILANCIA_TAMIZAJE');

IF NOT EXISTS (SELECT 1 FROM dbo.vinculo_persona WHERE per_id_persona = N'SYN-1100102-90')
    INSERT INTO dbo.vinculo_persona (per_id_persona, primera_operacion_en)
    VALUES (N'SYN-1100102-90', '2026-11-05T08:00:00');

BEGIN TRANSACTION;
INSERT INTO dbo.ref_referencia (
    per_id_persona, estado, fecha_referencia, via_item_id, via_catalogo, origen_item_id, origen_catalogo,
    responsable_usuario, origen_captura, consecutivo, establecimiento_id, oficina_local_id, region_id,
    enviada_en, enviada_por, creada_en, creada_por
)
VALUES (
    N'SYN-1100102-90', N'PENDIENTE_REVISION', '20261105', @via, N'VIA_ATENCION', @origen, N'ORIGEN_REFERENCIA',
    N'sintetico.local.01', N'MANUAL', N'DNCC-DRCS-OL101-1100102-REF-900-2026', 1100102, 101, 1,
    '2026-11-05T08:00:00', N'sintetico.local.01', '2026-11-05T08:00:00', N'sintetico.local.01'
);
PRINT N'Sesion A tiene el consecutivo sin confirmar. Ejecute ahora la sesion B. Esta espera no es un resultado aprobado.';
WAITFOR DELAY '00:00:20';
COMMIT TRANSACTION;
PRINT N'Sesion A confirmo REF-900-2026. Registre el error de la sesion B. Este PRINT no aprueba la prueba.';
GO
