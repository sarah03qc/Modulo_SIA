/*
  SIDINACC_LOCAL - 020_seed_catalogs.sql
  Catalogos no territoriales: periodo, sexo, tipo de cliente y servicio.
  Ningun valor es institucional salvo donde la spec lo documenta (sexo y tipo de cliente).
  La jerarquia Region -> Oficina Local -> Establecimiento vive en 030_seed_institutional_structure.sql.
  Referencia: docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md secciones 5.5, 5.6, 5.11, 5.12 y 13.

  - Solo inserta filas faltantes (INSERT ... WHERE NOT EXISTS); nunca sobrescribe.
  - IDs deterministas mediante IDENTITY_INSERT (una tabla a la vez).
*/
USE SIDINACC_LOCAL;
GO

IF DB_NAME() <> N'SIDINACC_LOCAL'
    THROW 50001, 'Este script solo debe ejecutarse sobre SIDINACC_LOCAL.', 1;
GO

-- Respaldo para SSMS: si la guarda anterior fallo, los lotes siguientes se compilan pero no se ejecutan.
IF DB_NAME() <> N'SIDINACC_LOCAL'
    SET NOEXEC ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

/* Precondicion: el esquema debe existir. Se valida antes de abrir la transaccion. */
IF OBJECT_ID(N'dbo.RCS_PERIODO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_SEXO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_TIPO_CLIENTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_REGION', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_OFICINA_LOCAL', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RCS_ESTABLECIMIENTO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_SERVICIO', N'U') IS NULL
BEGIN
    THROW 50002, 'Faltan tablas de SIDINACC_LOCAL. Ejecute primero 010_schema_core.sql', 1;
END;

BEGIN TRY
    BEGIN TRANSACTION;

    /* RCS_PERIODO
       SIDINACC_PERIOD_ID=2026 lo configura la app de forma explicita.
       TODO-UTIC: confirmar el mecanismo institucional del periodo vigente.
       TODO-UTIC: RCS_periodoAnterior = 2025 se interpreta como el periodo anterior de 2026
       (interpretacion del nombre de la columna; validar semantica real). */
    INSERT INTO dbo.RCS_PERIODO (RCS_idPeriodo, RCS_descripcion, RCS_periodoAnterior, BIT_eliminado)
    SELECT v.RCS_idPeriodo, v.RCS_descripcion, v.RCS_periodoAnterior, v.BIT_eliminado
    FROM (VALUES
        (CAST(2025 AS numeric(18,0)), 'Periodo 2025 (DEMO)', CAST(NULL AS numeric(18,0)), CAST(0 AS bit)),
        (CAST(2026 AS numeric(18,0)), 'Periodo 2026 (DEMO)', CAST(2025 AS numeric(18,0)), CAST(0 AS bit))
    ) v (RCS_idPeriodo, RCS_descripcion, RCS_periodoAnterior, BIT_eliminado)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.RCS_PERIODO t WHERE t.RCS_idPeriodo = v.RCS_idPeriodo);

    /* CAF_CAT_SEXO
       LOCAL_COMPATIBILITY_DECISION -- IDs deterministas iguales al SNB_codigo documentado, solo para el mock;
       TODO-UTIC: verificar IDs/codigos reales. */
    SET IDENTITY_INSERT dbo.CAF_CAT_SEXO ON;
    INSERT INTO dbo.CAF_CAT_SEXO (CAT_idSexo, SNB_codigo, SNB_descripcion, BIT_eliminado)
    SELECT v.CAT_idSexo, v.SNB_codigo, v.SNB_descripcion, v.BIT_eliminado
    FROM (VALUES
        (1, 1, 'Hombre',   0),
        (2, 2, 'Mujer',    0),
        (3, 3, 'Intersex', 0)
    ) v (CAT_idSexo, SNB_codigo, SNB_descripcion, BIT_eliminado)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_CAT_SEXO t WHERE t.CAT_idSexo = v.CAT_idSexo);
    SET IDENTITY_INSERT dbo.CAF_CAT_SEXO OFF;

    /* CAF_CAT_TIPO_CLIENTE
       LOCAL_COMPATIBILITY_DECISION -- IDs deterministas iguales al SNB_codigo documentado, solo para el mock;
       TODO-UTIC: verificar IDs/codigos reales.
       La descripcion documentada contiene enie; se construye con NCHAR(241) para mantener el archivo ASCII. */
    SET IDENTITY_INSERT dbo.CAF_CAT_TIPO_CLIENTE ON;
    INSERT INTO dbo.CAF_CAT_TIPO_CLIENTE (CAT_idTipoCliente, SNB_codigo, SNB_descripcion, BIT_eliminado)
    SELECT v.CAT_idTipoCliente, v.SNB_codigo, v.SNB_descripcion, v.BIT_eliminado
    FROM (VALUES
        (1, 1, N'Ni' + NCHAR(241) + N'o menor 13 a' + NCHAR(241) + N'os', 0),
        (2, 2, N'Gestante / Lactante', 0)
    ) v (CAT_idTipoCliente, SNB_codigo, SNB_descripcion, BIT_eliminado)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_CAT_TIPO_CLIENTE t WHERE t.CAT_idTipoCliente = v.CAT_idTipoCliente);
    SET IDENTITY_INSERT dbo.CAF_CAT_TIPO_CLIENTE OFF;

    /* CAF_SERVICIO (sin identity)
       Valores sinteticos de relleno; NO es el catalogo institucional ni define semantica de modalidad.
       TODO-UTIC: confirmar que CAF_SERVICIO corresponde a la modalidad que SIA debe mostrar. */
    INSERT INTO dbo.CAF_SERVICIO (SER_idServicio, SER_descripcion)
    SELECT v.SER_idServicio, v.SER_descripcion
    FROM (VALUES
        (1, N'Servicio Demo 1 (SINTETICO)'),
        (2, N'Servicio Demo 2 (SINTETICO)'),
        (3, N'Servicio Demo 3 (SINTETICO)')
    ) v (SER_idServicio, SER_descripcion)
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_SERVICIO t WHERE t.SER_idServicio = v.SER_idServicio);

    COMMIT TRANSACTION;
    PRINT 'SIDINACC_LOCAL: catalogos no territoriales aplicados (solo filas faltantes).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    SET IDENTITY_INSERT dbo.CAF_CAT_SEXO OFF;
    SET IDENTITY_INSERT dbo.CAF_CAT_TIPO_CLIENTE OFF;
    THROW;
END CATCH;
GO

SET NOEXEC OFF;
GO
