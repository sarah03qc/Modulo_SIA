/*
Limpieza reversible de las filas de prueba del Lote 02.
Solo borra el consecutivo de sonda. No toca la población sintética.
Lo ejecuta un principal administrativo, no la cuenta de la API.
*/
USE SIA_CENCINAI;
GO

DECLARE @ids TABLE (referencia_id bigint NOT NULL PRIMARY KEY);

INSERT INTO @ids (referencia_id)
SELECT referencia_id
FROM dbo.ref_referencia
WHERE consecutivo IN (
    N'DNCC-DRCS-OL101-1100102-REF-890-2026',
    N'DNCC-DRCS-OL101-1100102-REF-891-2026',
    N'DNCC-DRCS-OL101-1100102-REF-892-2026'
);

DELETE evento
FROM dbo.aud_evento AS evento
INNER JOIN @ids AS ids
    ON evento.entidad = N'ref_referencia'
   AND evento.entidad_id = CONVERT(nvarchar(40), ids.referencia_id);

DELETE impresion
FROM dbo.ref_impresion AS impresion
INNER JOIN @ids AS ids
    ON impresion.referencia_id = ids.referencia_id;

DELETE motivo
FROM dbo.ref_motivo AS motivo
INNER JOIN @ids AS ids
    ON motivo.referencia_id = ids.referencia_id;

DELETE contexto
FROM dbo.ref_contexto AS contexto
INNER JOIN @ids AS ids
    ON contexto.referencia_id = ids.referencia_id;

DELETE referencia
FROM dbo.ref_referencia AS referencia
INNER JOIN @ids AS ids
    ON referencia.referencia_id = ids.referencia_id;

DELETE FROM dbo.bor_captura
WHERE flujo = N'REFERENCIA'
  AND clave_negocio IN (N'SYN-1100102-04', N'SYN-1100102-05')
  AND usuario IN (N'dev-establecimiento-unico', N'dev-oficina-hatillo');
GO
