/*
  SIDINACC_LOCAL - 040_seed_synthetic_population.sql
  Poblacion 100% SINTETICA sobre la estructura territorial institucional de 030.
  No contiene personas, identificaciones, expedientes, telefonos ni direcciones reales.
  Todos los PER_idPersona usan el formato SYN-<ESTID>-<NN> (siempre <= nvarchar(20)).

  Semilla fija: SIDINACC_SYNTHETIC_SEED = 20261019
  Universo de poblacion: solo EST_inActivo = 1 AND ISNULL(BIT_eliminado, 0) = 0.
  Los 31 establecimientos CERRADO/INACTIVO permanecen en RCS_ESTABLECIMIENTO
  pero no reciben personas, familias, detalle historico ni servicios.
  Personas activas por establecimiento ACTIVO: 5 + (EST_id * 2654435761 + semilla) % 6  -> 5..10
  Generacion set-based (tally 1..10); no hay INSERT manual por establecimiento.
  Destinos historicos (LEAD/MIN) se calculan dentro del mismo universo activo.

  Escenarios documentados en DATASET_SUMMARY.md:
    SYN-1100102-01   identificacion exacta; Ana Campos Jimenez; 2 servicios 2026
    SYN-1100102-02   sin servicios 2026
    SYN-1100102-03   familia con EST 1010320 en 2025 y 1100102 en 2026
    SYN-1100102-99   BIT_eliminado = 1 (no cuenta en el rango 5-10)
    SYN-1010320-01 / SYN-1010321-01   Lucia Mora Campos / Campo (misma OL 101)
    SYN-1010202-01 / SYN-1190108-01   Mateo Vargas Rojas (Regiones 1 y 5)

  - Solo inserta filas faltantes (INSERT ... WHERE NOT EXISTS); nunca sobrescribe.
  - IDs deterministas mediante IDENTITY_INSERT.
  - Requiere 010, 020 y 030.
*/
USE SIDINACC_LOCAL;
GO

IF DB_NAME() <> N'SIDINACC_LOCAL'
    THROW 50001, 'Este script solo debe ejecutarse sobre SIDINACC_LOCAL.', 1;
GO

IF DB_NAME() <> N'SIDINACC_LOCAL'
    SET NOEXEC ON;
GO

SET NOCOUNT ON;
SET XACT_ABORT ON;

IF OBJECT_ID(N'dbo.CAF_FAMILIA', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_FAMILIA_DETALLE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_PERSONA', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_PERSONA_DETALLE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_SERVICIO_CLIENTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RCS_PERIODO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.RCS_ESTABLECIMIENTO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_SERVICIO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_SEXO', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_TIPO_CLIENTE', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_REGION', N'U') IS NULL
   OR OBJECT_ID(N'dbo.CAF_CAT_OFICINA_LOCAL', N'U') IS NULL
BEGIN
    THROW 50002, 'Faltan tablas de SIDINACC_LOCAL. Ejecute primero 010_schema_core.sql', 1;
END;

IF (SELECT COUNT(*) FROM dbo.RCS_PERIODO WHERE RCS_idPeriodo IN (2025, 2026)) <> 2
   OR (SELECT COUNT(*) FROM dbo.CAF_SERVICIO WHERE SER_idServicio IN (1, 2, 3)) <> 3
   OR (SELECT COUNT(*) FROM dbo.CAF_CAT_SEXO WHERE CAT_idSexo IN (1, 2, 3)) <> 3
   OR (SELECT COUNT(*) FROM dbo.CAF_CAT_TIPO_CLIENTE WHERE CAT_idTipoCliente IN (1, 2)) <> 2
BEGIN
    THROW 50002, 'Faltan catalogos requeridos. Ejecute primero 020_seed_catalogs.sql', 1;
END;

IF (SELECT COUNT(*) FROM dbo.CAF_CAT_REGION) <> 9
   OR (SELECT COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL) <> 41
   OR (SELECT COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO) = 0
BEGIN
    THROW 50002, 'Falta la estructura territorial institucional. Ejecute primero 030_seed_institutional_structure.sql', 1;
END;

IF EXISTS (
    SELECT 1 FROM dbo.CAF_PERSONA
    WHERE PER_idPersona NOT LIKE N'SYN-[0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9]'
)
BEGIN
    THROW 50003, 'Existen PER_idPersona que no usan el formato sintetico actual (posible seed DEMO anterior). Recree SIDINACC_LOCAL manualmente; ver README seccion 8.', 1;
END;

DECLARE @seed bigint = 20261019;

DECLARE @n TABLE (n int PRIMARY KEY);
INSERT INTO @n (n) VALUES (1), (2), (3), (4), (5), (6), (7), (8), (9), (10);

DECLARE @nom TABLE (id int PRIMARY KEY, v varchar(50) NOT NULL);
INSERT INTO @nom (id, v) VALUES
    (0, 'Ana'), (1, 'Lucia'), (2, 'Sofia'), (3, 'Mateo'), (4, 'Daniel'),
    (5, 'Valentina'), (6, 'Gabriel'), (7, 'Elena'), (8, 'Tomas'), (9, 'Camila'),
    (10, 'Martin'), (11, 'Isabella'), (12, 'Diego'), (13, 'Paula'), (14, 'Nicolas'),
    (15, 'Fernanda'), (16, 'Andres'), (17, 'Carolina'), (18, 'Felipe'), (19, 'Jimena'),
    (20, 'Bruno'), (21, 'Renata'), (22, 'Samuel'), (23, 'Olivia');

DECLARE @ape TABLE (id int PRIMARY KEY, v varchar(50) NOT NULL);
INSERT INTO @ape (id, v) VALUES
    (0, 'Rojas'), (1, 'Vargas'), (2, 'Solano'), (3, 'Mora'), (4, 'Jimenez'),
    (5, 'Castro'), (6, 'Ramirez'), (7, 'Campos'), (8, 'Herrera'), (9, 'Delgado'),
    (10, 'Navarro'), (11, 'Pineda'), (12, 'Quesada'), (13, 'Salazar'), (14, 'Chaves'),
    (15, 'Montero'), (16, 'Aguilar'), (17, 'Fallas'), (18, 'Urena'), (19, 'Molina');

DECLARE @est TABLE (
    EST_idEstablecimiento int PRIMARY KEY,
    CAT_idOficinaLocal    int NOT NULL,
    n_persons             int NOT NULL,
    hist_dest             int NOT NULL
);

INSERT INTO @est (EST_idEstablecimiento, CAT_idOficinaLocal, n_persons, hist_dest)
SELECT
    x.EST_idEstablecimiento,
    x.CAT_idOficinaLocal,
    x.n_persons,
    x.hist_dest
FROM (
    SELECT
        e.EST_idEstablecimiento,
        e.CAT_idOficinaLocal,
        CAST(5 + ((CAST(e.EST_idEstablecimiento AS bigint) * CAST(2654435761 AS bigint) + @seed) % 6) AS int) AS n_persons,
        COALESCE(
            LEAD(e.EST_idEstablecimiento) OVER (
                PARTITION BY e.CAT_idOficinaLocal
                ORDER BY e.EST_idEstablecimiento),
            MIN(e.EST_idEstablecimiento) OVER (PARTITION BY e.CAT_idOficinaLocal)
        ) AS hist_dest
    FROM dbo.RCS_ESTABLECIMIENTO e
    WHERE e.EST_inActivo = 1
      AND ISNULL(e.BIT_eliminado, 0) = 0
) x;

DECLARE @slot TABLE (
    EST_idEstablecimiento int NOT NULL,
    n                     int NOT NULL,
    n_persons             int NOT NULL,
    hist_dest             int NOT NULL,
    BIT_eliminado         bit NOT NULL,
    PRIMARY KEY (EST_idEstablecimiento, n)
);

INSERT INTO @slot (EST_idEstablecimiento, n, n_persons, hist_dest, BIT_eliminado)
SELECT e.EST_idEstablecimiento, n.n, e.n_persons, e.hist_dest, CAST(0 AS bit)
FROM @est e
CROSS JOIN @n n
WHERE n.n <= e.n_persons;

INSERT INTO @slot (EST_idEstablecimiento, n, n_persons, hist_dest, BIT_eliminado)
SELECT e.EST_idEstablecimiento, 99, e.n_persons, e.hist_dest, CAST(1 AS bit)
FROM @est e
WHERE (CAST(e.EST_idEstablecimiento AS bigint) * 7 + @seed) % 131 = 0
   OR e.EST_idEstablecimiento = 1100102;

DECLARE @per TABLE (
    RCS_idPersona         int NOT NULL PRIMARY KEY,
    PER_idPersona         nvarchar(20) NOT NULL UNIQUE,
    PER_nombre            varchar(50) NOT NULL,
    PER_apellidoUno       varchar(50) NOT NULL,
    PER_apellidoDos       varchar(50) NOT NULL,
    PER_fechaNacimiento   datetime NOT NULL,
    FAM_idFamilia         int NOT NULL,
    CAT_idSexo            int NOT NULL,
    BIT_eliminado         bit NOT NULL,
    EST_idEstablecimiento int NOT NULL,
    n                     int NOT NULL,
    n_persons             int NOT NULL,
    family_local          int NOT NULL,
    is_hist               bit NOT NULL,
    hist_est              int NOT NULL,
    svc_count             int NOT NULL,
    is_child              bit NOT NULL
);

INSERT INTO @per (
    RCS_idPersona, PER_idPersona, PER_nombre, PER_apellidoUno, PER_apellidoDos,
    PER_fechaNacimiento, FAM_idFamilia, CAT_idSexo, BIT_eliminado,
    EST_idEstablecimiento, n, n_persons, family_local, is_hist, hist_est, svc_count, is_child)
SELECT
    ROW_NUMBER() OVER (ORDER BY s.EST_idEstablecimiento, s.n) AS RCS_idPersona,
    N'SYN-' + CONVERT(varchar(10), s.EST_idEstablecimiento) + N'-'
        + RIGHT(N'00' + CONVERT(varchar(2), s.n), 2),
    CASE
        WHEN s.EST_idEstablecimiento = 1010320 AND s.n = 1 THEN 'Lucia'
        WHEN s.EST_idEstablecimiento = 1010321 AND s.n = 1 THEN 'Lucia'
        WHEN s.EST_idEstablecimiento = 1010202 AND s.n = 1 THEN 'Mateo'
        WHEN s.EST_idEstablecimiento = 1190108 AND s.n = 1 THEN 'Mateo'
        WHEN s.EST_idEstablecimiento = 1100102 AND s.n = 1 THEN 'Ana'
        ELSE nom.v
    END,
    CASE
        WHEN s.EST_idEstablecimiento = 1010320 AND s.n = 1 THEN 'Mora'
        WHEN s.EST_idEstablecimiento = 1010321 AND s.n = 1 THEN 'Mora'
        WHEN s.EST_idEstablecimiento = 1010202 AND s.n = 1 THEN 'Vargas'
        WHEN s.EST_idEstablecimiento = 1190108 AND s.n = 1 THEN 'Vargas'
        WHEN s.EST_idEstablecimiento = 1100102 AND s.n = 1 THEN 'Campos'
        ELSE ape1.v
    END,
    CASE
        WHEN s.EST_idEstablecimiento = 1010320 AND s.n = 1 THEN 'Campos'
        WHEN s.EST_idEstablecimiento = 1010321 AND s.n = 1 THEN 'Campo'
        WHEN s.EST_idEstablecimiento = 1010202 AND s.n = 1 THEN 'Rojas'
        WHEN s.EST_idEstablecimiento = 1190108 AND s.n = 1 THEN 'Rojas'
        WHEN s.EST_idEstablecimiento = 1100102 AND s.n = 1 THEN 'Jimenez'
        ELSE ape2.v
    END,
    DATETIMEFROMPARTS(
        CASE WHEN (h.h % 10) < 8 THEN 2014 + CAST(h.h % 12 AS int) ELSE 1986 + CAST(h.h % 20 AS int) END,
        1 + CAST(h.h % 12 AS int),
        1 + CAST((h.h / 12) % 28 AS int),
        0, 0, 0, 0),
    s.EST_idEstablecimiento * 100 + fl.family_local,
    1 + CAST((CAST(s.EST_idEstablecimiento AS bigint) + s.n) % 3 AS int),
    s.BIT_eliminado,
    s.EST_idEstablecimiento,
    s.n,
    s.n_persons,
    fl.family_local,
    CASE
        WHEN s.n = 99 THEN CAST(0 AS bit)
        WHEN s.EST_idEstablecimiento = 1100102 AND fl.family_local = 3 THEN CAST(1 AS bit)
        WHEN (CAST(s.EST_idEstablecimiento AS bigint) * 17 + fl.family_local * 31 + @seed) % 67 = 0
             AND CASE
                     WHEN s.EST_idEstablecimiento = 1100102 AND fl.family_local = 3 THEN 1010320
                     ELSE s.hist_dest
                 END <> s.EST_idEstablecimiento
            THEN CAST(1 AS bit)
        ELSE CAST(0 AS bit)
    END,
    CASE
        WHEN s.EST_idEstablecimiento = 1100102 AND fl.family_local = 3 THEN 1010320
        ELSE s.hist_dest
    END,
    CASE
        WHEN s.BIT_eliminado = 1 THEN 0
        WHEN s.EST_idEstablecimiento = 1100102 AND s.n = 1 THEN 2
        WHEN s.EST_idEstablecimiento = 1100102 AND s.n = 2 THEN 0
        WHEN svc.svc_n < 15 THEN 0
        WHEN svc.svc_n < 75 THEN 1
        WHEN svc.svc_n < 95 THEN 2
        ELSE 3
    END,
    CASE WHEN (h.h % 10) < 8 THEN CAST(1 AS bit) ELSE CAST(0 AS bit) END
FROM @slot s
CROSS APPLY (VALUES (
    CASE
        WHEN s.n = 99 THEN 99
        WHEN s.n IN (3, 4) AND s.n_persons >= 4 THEN 3
        WHEN s.n IN (6, 7, 8) AND s.n_persons >= 8 THEN 6
        ELSE s.n
    END
)) fl (family_local)
CROSS APPLY (VALUES (
    CAST(s.EST_idEstablecimiento AS bigint) * 17 + s.n * 97 + @seed
)) h (h)
CROSS APPLY (VALUES (
    (CAST(s.EST_idEstablecimiento AS bigint) * 17 + s.n * 31 + @seed) % 100
)) svc (svc_n)
CROSS APPLY (VALUES (
    (CAST(s.EST_idEstablecimiento AS bigint) + s.n + @seed) % 24,
    (CAST(s.EST_idEstablecimiento % 1000 AS bigint) * 3 + s.n + @seed) % 20,
    (CAST(s.EST_idEstablecimiento % 1000 AS bigint) * 7 + s.n * 11 + @seed) % 20
)) idx (nid, a1id, a2raw)
CROSS APPLY (VALUES (
    idx.nid,
    idx.a1id,
    CASE WHEN idx.a2raw = idx.a1id THEN (idx.a2raw + 1) % 20 ELSE idx.a2raw END
)) idx2 (nid, a1id, a2id)
JOIN @nom nom ON nom.id = idx2.nid
JOIN @ape ape1 ON ape1.id = idx2.a1id
JOIN @ape ape2 ON ape2.id = idx2.a2id;

BEGIN TRY
    BEGIN TRANSACTION;

    SET IDENTITY_INSERT dbo.CAF_FAMILIA ON;
    INSERT INTO dbo.CAF_FAMILIA (FAM_idFamilia, BIT_eliminado)
    SELECT DISTINCT p.FAM_idFamilia, 0
    FROM @per p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_FAMILIA t WHERE t.FAM_idFamilia = p.FAM_idFamilia);
    SET IDENTITY_INSERT dbo.CAF_FAMILIA OFF;

    SET IDENTITY_INSERT dbo.CAF_FAMILIA_DETALLE ON;
    INSERT INTO dbo.CAF_FAMILIA_DETALLE (
        FAD_idFamiliaDetalle, FAM_idFamilia, FAD_inActiva,
        EST_idEstablecimientoActual, RCS_idPeriodo, BIT_eliminado)
    SELECT
        x.FAD_idFamiliaDetalle,
        x.FAM_idFamilia,
        CAST(NULL AS bit),
        x.EST_idEstablecimientoActual,
        x.RCS_idPeriodo,
        0
    FROM (
        SELECT DISTINCT
            p.FAM_idFamilia AS FAD_idFamiliaDetalle,
            p.FAM_idFamilia,
            p.EST_idEstablecimiento AS EST_idEstablecimientoActual,
            CAST(2026 AS numeric(18,0)) AS RCS_idPeriodo
        FROM @per p
        UNION ALL
        SELECT DISTINCT
            p.FAM_idFamilia + 1000000000,
            p.FAM_idFamilia,
            p.hist_est,
            CAST(2025 AS numeric(18,0))
        FROM @per p
        WHERE p.is_hist = 1
          AND p.BIT_eliminado = 0
    ) x
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.CAF_FAMILIA_DETALLE t
        WHERE t.FAD_idFamiliaDetalle = x.FAD_idFamiliaDetalle
    );
    SET IDENTITY_INSERT dbo.CAF_FAMILIA_DETALLE OFF;

    SET IDENTITY_INSERT dbo.CAF_PERSONA ON;
    INSERT INTO dbo.CAF_PERSONA (
        PER_idPersona, PER_beneficiario, PER_apellidoUno, PER_apellidoDos, PER_nombre,
        PER_fechaNacimiento, FAM_idFamilia, CAT_idSexo, BIT_eliminado, RCS_idPersona)
    SELECT
        p.PER_idPersona, CAST(NULL AS varchar(2)), p.PER_apellidoUno, p.PER_apellidoDos, p.PER_nombre,
        p.PER_fechaNacimiento, p.FAM_idFamilia, p.CAT_idSexo, p.BIT_eliminado, p.RCS_idPersona
    FROM @per p
    WHERE NOT EXISTS (SELECT 1 FROM dbo.CAF_PERSONA t WHERE t.PER_idPersona = p.PER_idPersona);
    SET IDENTITY_INSERT dbo.CAF_PERSONA OFF;

    SET IDENTITY_INSERT dbo.CAF_PERSONA_DETALLE ON;
    INSERT INTO dbo.CAF_PERSONA_DETALLE (
        RCS_RCS_idRegistro, PER_idPersona, EST_idEstablecimientoActual, RCS_idPeriodo, BIT_eliminado)
    SELECT
        x.RCS_RCS_idRegistro,
        x.PER_idPersona,
        x.EST_idEstablecimientoActual,
        x.RCS_idPeriodo,
        0
    FROM (
        SELECT p.RCS_idPersona AS RCS_RCS_idRegistro,
               p.PER_idPersona,
               p.EST_idEstablecimiento AS EST_idEstablecimientoActual,
               CAST(2026 AS numeric(18,0)) AS RCS_idPeriodo
        FROM @per p
        UNION ALL
        SELECT p.RCS_idPersona + 1000000,
               p.PER_idPersona,
               p.hist_est,
               CAST(2025 AS numeric(18,0))
        FROM @per p
        WHERE p.is_hist = 1
          AND p.BIT_eliminado = 0
    ) x
    WHERE NOT EXISTS (
        SELECT 1 FROM dbo.CAF_PERSONA_DETALLE t
        WHERE t.RCS_RCS_idRegistro = x.RCS_RCS_idRegistro
    );
    SET IDENTITY_INSERT dbo.CAF_PERSONA_DETALLE OFF;

    SET IDENTITY_INSERT dbo.CAF_SERVICIO_CLIENTE ON;
    INSERT INTO dbo.CAF_SERVICIO_CLIENTE (
        SEC_idRegistro, SER_idServicio, PER_idPersona, CAT_idTipoCliente,
        RCS_idPeriodo, SEC_mes, BIT_eliminado)
    SELECT
        p.RCS_idPersona * 10 + k.k,
        k.k,
        p.PER_idPersona,
        CASE WHEN p.is_child = 1 THEN 1 ELSE 2 END,
        CAST(2026 AS numeric(18,0)),
        CAST(1 + ((CAST(p.EST_idEstablecimiento AS bigint) + p.n + k.k * 7 + @seed) % 12) AS tinyint),
        0
    FROM @per p
    CROSS JOIN (VALUES (1), (2), (3)) k (k)
    WHERE p.BIT_eliminado = 0
      AND k.k <= p.svc_count
      AND NOT EXISTS (
          SELECT 1 FROM dbo.CAF_SERVICIO_CLIENTE t
          WHERE t.SEC_idRegistro = p.RCS_idPersona * 10 + k.k
      );
    SET IDENTITY_INSERT dbo.CAF_SERVICIO_CLIENTE OFF;

    /* Verificacion de cardinalidad e integridad del seed sintetico. */
    IF (SELECT COUNT(*) FROM dbo.CAF_PERSONA) <> (SELECT COUNT(*) FROM @per)
        THROW 50003, 'La cantidad de personas no coincide con el seed sintetico (posible residuo DEMO). Recree SIDINACC_LOCAL manualmente.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.RCS_ESTABLECIMIENTO e
        WHERE e.EST_inActivo = 1
          AND ISNULL(e.BIT_eliminado, 0) = 0
          AND (
              SELECT COUNT(*)
              FROM dbo.CAF_PERSONA p
              JOIN dbo.CAF_FAMILIA_DETALLE fd
                ON fd.FAM_idFamilia = p.FAM_idFamilia
               AND fd.RCS_idPeriodo = 2026
               AND ISNULL(fd.BIT_eliminado, 0) = 0
               AND fd.EST_idEstablecimientoActual = e.EST_idEstablecimiento
              WHERE ISNULL(p.BIT_eliminado, 0) = 0
          ) NOT BETWEEN 5 AND 10
    )
        THROW 50003, 'Hay establecimientos ACTIVOS fuera del rango 5-10 personas activas 2026.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.RCS_ESTABLECIMIENTO e
        WHERE e.EST_inActivo = 0
          AND ISNULL(e.BIT_eliminado, 0) = 0
          AND (
              SELECT COUNT(*)
              FROM dbo.CAF_PERSONA p
              JOIN dbo.CAF_FAMILIA_DETALLE fd
                ON fd.FAM_idFamilia = p.FAM_idFamilia
               AND fd.RCS_idPeriodo = 2026
               AND ISNULL(fd.BIT_eliminado, 0) = 0
               AND fd.EST_idEstablecimientoActual = e.EST_idEstablecimiento
              WHERE ISNULL(p.BIT_eliminado, 0) = 0
          ) <> 0
    )
        THROW 50003, 'Hay establecimientos INACTIVOS/CERRADOS con personas activas 2026.', 1;

    COMMIT TRANSACTION;
    PRINT 'SIDINACC_LOCAL: poblacion sintetica aplicada (solo filas faltantes).';
END TRY
BEGIN CATCH
    IF @@TRANCOUNT > 0
        ROLLBACK TRANSACTION;
    SET IDENTITY_INSERT dbo.CAF_FAMILIA OFF;
    SET IDENTITY_INSERT dbo.CAF_FAMILIA_DETALLE OFF;
    SET IDENTITY_INSERT dbo.CAF_PERSONA OFF;
    SET IDENTITY_INSERT dbo.CAF_PERSONA_DETALLE OFF;
    SET IDENTITY_INSERT dbo.CAF_SERVICIO_CLIENTE OFF;
    THROW;
END CATCH;
GO

SET NOEXEC OFF;
GO
