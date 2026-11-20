/*
SIA_CENCINAI — semilla 052_beneficiarios_menores
Autora y responsable del proyecto: Sarah Priscilla Quesada Chaves.
Creacion: 2026-11-18.

La escala 030 podia abrir casos de Atencion Interdisciplinaria para cualquier
persona sintetica con familia y edad de 0 a 120 anos. Responsables sin familia
no entran. Las personas de 18 anos o mas con familia si podian quedar como
beneficiarias del caso. Eso no las convierte en poblacion de A.I.

030 ya excluye, en corridas nuevas, a quien haya cumplido 18 anos el 2026-11-05.
Esta semilla no borra filas ni reasigna identificadores. Con @permitir = 0 solo
informa. Con @permitir = 1 cierra, mediante ops.cerrar_caso y motivo Otro, los
casos ACTIVOS sinteticos cuya persona ya cumplio 18. No toca identificadores que
no empiecen por SYN-. No modifica SIDINACC_LOCAL.

La recepcion del traslado en destino no forma parte de esta correccion.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

DECLARE @permitir bit = 0;
DECLARE @corte date = '20261105';

IF OBJECT_ID(N'SIDINACC_LOCAL.dbo.CAF_PERSONA', N'U') IS NULL
    THROW 51152, N'No esta la replica SIDINACC_LOCAL. No se inventan edades.', 1;

SELECT caso.caso_id, caso.per_id_persona, persona.PER_fechaNacimiento
FROM dbo.caso_ai AS caso
INNER JOIN SIDINACC_LOCAL.dbo.CAF_PERSONA AS persona
    ON persona.PER_idPersona = caso.per_id_persona COLLATE Latin1_General_100_CI_AS
WHERE caso.estado = N'ACTIVO'
  AND caso.per_id_persona LIKE N'SYN-%'
  AND persona.PER_fechaNacimiento IS NOT NULL
  AND DATEADD(YEAR, 18, CONVERT(date, persona.PER_fechaNacimiento)) <= @corte;

IF @permitir <> 1
BEGIN
    PRINT N'Semilla 052 en informe. Cambie @permitir a 1 solo en desarrollo autorizado.';
    RETURN;
END

DECLARE @motivo bigint;
SELECT @motivo = i.cat_item_id
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v
    ON v.cat_version_id = i.cat_version_id
WHERE v.codigo_catalogo = N'MOTIVO_CIERRE'
  AND v.vigente = 1
  AND i.activo = 1
  AND i.codigo = N'OTRO';

IF @motivo IS NULL
    THROW 51153, N'No hay motivo Otro vigente. No se cierra ningun caso.', 1;

DECLARE @caso bigint;
DECLARE @persona nvarchar(20);
DECLARE cierre CURSOR LOCAL FAST_FORWARD FOR
    SELECT caso.caso_id, caso.per_id_persona
    FROM dbo.caso_ai AS caso
    INNER JOIN SIDINACC_LOCAL.dbo.CAF_PERSONA AS persona
        ON persona.PER_idPersona = caso.per_id_persona COLLATE Latin1_General_100_CI_AS
    WHERE caso.estado = N'ACTIVO'
      AND caso.per_id_persona LIKE N'SYN-%'
      AND persona.PER_fechaNacimiento IS NOT NULL
      AND DATEADD(YEAR, 18, CONVERT(date, persona.PER_fechaNacimiento)) <= @corte;

OPEN cierre;
FETCH NEXT FROM cierre INTO @caso, @persona;
WHILE @@FETCH_STATUS = 0
BEGIN
    EXEC ops.cerrar_caso
        @caso_id = @caso,
        @per_id_persona = @persona,
        @motivo_item_id = @motivo,
        @explicacion = N'Correccion de semilla: la persona ya tenia 18 anos y no debio quedar como beneficiaria de A.I. No es un cierre profesional.',
        @fecha_cierre = @corte,
        @responsable_usuario = N'semilla-052',
        @usuario = N'semilla-052',
        @ocurrido_en = SYSUTCDATETIME(),
        @destino_establecimiento_id = NULL,
        @destino_oficina_local_id = NULL,
        @destino_region_id = NULL,
        @destino_nombre = NULL;
    FETCH NEXT FROM cierre INTO @caso, @persona;
END
CLOSE cierre;
DEALLOCATE cierre;
GO
