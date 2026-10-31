/*
  SIDINACC_LOCAL - 090_smoke_tests.sql
  Smoke tests de la replica local con estructura territorial institucional
  y poblacion sintetica (T01-T14 adaptados; T15-T37 territoriales/poblacion;
  T38-T40 conservan controles de rol, objetos extra y NULL no documentados;
  T41: establecimientos inactivos/cerrados sin personas activas 2026;
  T42-T61: menor, direccion/contacto familiar, evaluaciones y ausencia de EDIN/EVADE).

  Constantes @expEstTotal / @expEstActive / @expEstChecksum las mantiene
  database/sidinacc-local/tools/generate_territorial_seed.py --check a partir
  del Excel oficial; no son un "639" hardcodeado.

  - Solo lectura: unicamente escribe en variables de tabla locales.
  - THROW 50090 si alguna prueba falla; THROW 50091 si no se evaluaron 61 pruebas.
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

DECLARE @periodId numeric(18,0) = 2026;
DECLARE @expEstTotal int = 661;
DECLARE @expEstActive int = 630;
DECLARE @expEstChecksum bigint = 2365392756;
DECLARE @r TABLE (test varchar(10), descripcion varchar(200), resultado varchar(4), detalle varchar(400));

DECLARE @resolved TABLE (
    PER_idPersona         nvarchar(20),
    Nombre                varchar(200),
    PER_nombre            varchar(50),
    PER_apellidoUno       varchar(50),
    PER_apellidoDos       varchar(50),
    Sexo                  varchar(100),
    EST_idEstablecimiento int,
    CAT_idOficinaLocal    int,
    CAT_idRegion          int
);

INSERT INTO @resolved
SELECT
    P.PER_idPersona,
    LTRIM(RTRIM(CONCAT(
        COALESCE(P.PER_nombre, ''), ' ',
        COALESCE(P.PER_apellidoUno, ''), ' ',
        COALESCE(P.PER_apellidoDos, '')
    ))),
    P.PER_nombre,
    P.PER_apellidoUno,
    P.PER_apellidoDos,
    SX.SNB_descripcion,
    E.EST_idEstablecimiento,
    OL.CAT_idOficinaLocal,
    R.CAT_idRegion
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
LEFT JOIN dbo.CAF_CAT_SEXO SX
  ON SX.CAT_idSexo = P.CAT_idSexo
LEFT JOIN dbo.RCS_ESTABLECIMIENTO E
  ON E.EST_idEstablecimiento = FD.EST_idEstablecimientoActual
LEFT JOIN dbo.CAF_CAT_OFICINA_LOCAL OL
  ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
LEFT JOIN dbo.CAF_CAT_REGION R
  ON R.CAT_idRegion = OL.CAT_idRegion
WHERE ISNULL(P.BIT_eliminado, 0) = 0
  AND E.EST_idEstablecimiento IN (
      SELECT EST_idEstablecimiento
      FROM dbo.RCS_ESTABLECIMIENTO
      WHERE EST_inActivo = 1
        AND ISNULL(BIT_eliminado, 0) = 0
  );

DECLARE @n1 int, @n2 int, @n3 int, @n4 int;
DECLARE @sumEst bigint;
DECLARE @s1 varchar(400);
DECLARE @tcNino nvarchar(100) = N'Ni' + NCHAR(241) + N'o menor 13 a' + NCHAR(241) + N'os';
DECLARE @pac nvarchar(200) = N'Pac' + NCHAR(237) + N'fico Central';

/* T01 */
SELECT @n1 = COUNT(*) FROM dbo.RCS_PERIODO;
SELECT @n2 = COUNT(*) FROM dbo.RCS_PERIODO
WHERE (RCS_idPeriodo = 2025 AND RCS_periodoAnterior IS NULL)
   OR (RCS_idPeriodo = 2026 AND RCS_periodoAnterior = 2025);
INSERT INTO @r VALUES ('T01', 'periodos 2025 y 2026 existen',
    CASE WHEN @n1 = 2 AND @n2 = 2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; esperados=', @n2));

/* T02 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_SEXO;
SELECT @n2 = COUNT(*) FROM dbo.CAF_CAT_SEXO
WHERE (CAT_idSexo = 1 AND SNB_codigo = 1 AND SNB_descripcion = 'Hombre')
   OR (CAT_idSexo = 2 AND SNB_codigo = 2 AND SNB_descripcion = 'Mujer')
   OR (CAT_idSexo = 3 AND SNB_codigo = 3 AND SNB_descripcion = 'Intersex');
INSERT INTO @r VALUES ('T02', 'catalogo de sexo documentado (3 valores)',
    CASE WHEN @n1 = 3 AND @n2 = 3 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; coinciden=', @n2));

/* T03 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_TIPO_CLIENTE;
SELECT @n2 = COUNT(*) FROM dbo.CAF_CAT_TIPO_CLIENTE
WHERE (CAT_idTipoCliente = 1 AND SNB_codigo = 1
       AND CONVERT(nvarchar(100), SNB_descripcion) COLLATE Latin1_General_BIN2 = @tcNino COLLATE Latin1_General_BIN2)
   OR (CAT_idTipoCliente = 2 AND SNB_codigo = 2 AND SNB_descripcion = 'Gestante / Lactante');
INSERT INTO @r VALUES ('T03', 'catalogo tipo cliente documentado (2 valores)',
    CASE WHEN @n1 = 2 AND @n2 = 2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; coinciden=', @n2));

/* T04 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_SERVICIO;
SELECT @n2 = COUNT(*) FROM dbo.CAF_SERVICIO
WHERE SER_idServicio IN (1, 2, 3) AND SER_descripcion LIKE N'%SINTETICO%';
INSERT INTO @r VALUES ('T04', 'servicios 1-3 marcados SINTETICO (no catalogo oficial)',
    CASE WHEN @n1 = 3 AND @n2 = 3 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; sintetico=', @n2));

/* T05 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE PER_idPersona NOT LIKE N'SYN-%';
SELECT @n2 = COUNT(*) FROM dbo.CAF_PERSONA_DETALLE WHERE PER_idPersona NOT LIKE N'SYN-%';
SELECT @n3 = COUNT(*) FROM dbo.CAF_SERVICIO_CLIENTE WHERE PER_idPersona NOT LIKE N'SYN-%';
INSERT INTO @r VALUES ('T05', 'no hay IDs de persona que no empiecen por SYN-',
    CASE WHEN @n1 = 0 AND @n2 = 0 AND @n3 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('CAF_PERSONA=', @n1, '; CAF_PERSONA_DETALLE=', @n2, '; CAF_SERVICIO_CLIENTE=', @n3));

/* T06 */
DECLARE @q nvarchar(100) = N'SYN-1100102-01';
DECLARE @first nvarchar(20);
SELECT @n1 = COUNT(*) FROM @resolved WHERE PER_idPersona = @q;
SELECT TOP (1) @first = PER_idPersona
FROM @resolved
WHERE PER_idPersona = @q
   OR Nombre LIKE '%' + @q + '%'
ORDER BY
    CASE WHEN PER_idPersona = @q THEN 0 ELSE 1 END,
    PER_apellidoUno, PER_apellidoDos, PER_nombre;
INSERT INTO @r VALUES ('T06', 'SYN-1100102-01 se resuelve por identificacion y aparece primero',
    CASE WHEN @n1 = 1 AND @first = @q THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('coincidencias_exactas=', @n1, '; primer_resultado=', COALESCE(@first, N'(ninguno)')));

/* T07 */
SELECT @n1 = COUNT(*) FROM @resolved WHERE Nombre LIKE '%Lucia Mora Camp%';
SELECT @n2 = COUNT(*) FROM @resolved
WHERE PER_idPersona IN (N'SYN-1010320-01', N'SYN-1010321-01')
  AND Nombre LIKE '%Lucia Mora Camp%';
INSERT INTO @r VALUES ('T07', 'nombres similares en la misma OL (Lucia Mora Camp*)',
    CASE WHEN @n1 = 2 AND @n2 = 2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('candidatos=', @n1, '; esperados=', @n2));

/* T08 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE PER_idPersona = N'SYN-1100102-99' AND BIT_eliminado = 1;
SELECT @n2 = COUNT(*) FROM @resolved WHERE PER_idPersona = N'SYN-1100102-99';
INSERT INTO @r VALUES ('T08', 'persona eliminada no aparece en la resolucion 2026',
    CASE WHEN @n1 = 1 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('existe_eliminada=', @n1, '; en_resueltos=', @n2));

/* T09 */
DECLARE @e2025 int, @e2026 int, @eRes int;
SELECT @e2025 = MIN(FD.EST_idEstablecimientoActual), @n1 = COUNT(*)
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD ON FD.FAM_idFamilia = P.FAM_idFamilia
WHERE P.PER_idPersona = N'SYN-1100102-03'
  AND FD.RCS_idPeriodo = 2025
  AND ISNULL(FD.BIT_eliminado, 0) = 0;
SELECT @e2026 = MIN(FD.EST_idEstablecimientoActual), @n2 = COUNT(*)
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD ON FD.FAM_idFamilia = P.FAM_idFamilia
WHERE P.PER_idPersona = N'SYN-1100102-03'
  AND FD.RCS_idPeriodo = 2026
  AND ISNULL(FD.BIT_eliminado, 0) = 0;
SELECT @eRes = MIN(EST_idEstablecimiento), @n3 = COUNT(*) FROM @resolved WHERE PER_idPersona = N'SYN-1100102-03';
INSERT INTO @r VALUES ('T09', 'familia historica: 2025=1010320, 2026=1100102',
    CASE WHEN @n1 = 1 AND @n2 = 1 AND @n3 = 1
              AND @e2025 = 1010320 AND @e2026 = 1100102 AND @eRes = 1100102
         THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('2025=', @e2025, ' (filas ', @n1, '); 2026=', @e2026, ' (filas ', @n2,
           '); resuelto=', @eRes, ' (filas ', @n3, ')'));

/* T10 */
SELECT @n1 = COUNT(*), @n2 = COUNT(DISTINCT SER_idServicio), @n3 = MIN(SER_idServicio), @n4 = MAX(SER_idServicio)
FROM dbo.CAF_SERVICIO_CLIENTE
WHERE PER_idPersona = N'SYN-1100102-01'
  AND RCS_idPeriodo = @periodId
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T10', 'SYN-1100102-01 tiene servicios 1 y 2 en 2026',
    CASE WHEN @n1 = 2 AND @n2 = 2 AND @n3 = 1 AND @n4 = 2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('filas_2026=', @n1, '; servicios_distintos=', @n2, '; min=', @n3, '; max=', @n4));

/* T11 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_SERVICIO_CLIENTE
WHERE PER_idPersona = N'SYN-1100102-02' AND RCS_idPeriodo = @periodId AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*) FROM dbo.CAF_PERSONA
WHERE PER_idPersona = N'SYN-1100102-02' AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n3 = COUNT(*) FROM @resolved WHERE PER_idPersona = N'SYN-1100102-02';
INSERT INTO @r VALUES ('T11', 'SYN-1100102-02 existe, se resuelve y no tiene servicios 2026',
    CASE WHEN @n1 = 0 AND @n2 = 1 AND @n3 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('filas_2026=', @n1, '; persona_no_eliminada=', @n2, '; en_resueltos=', @n3));

/* T12 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_SERVICIO_CLIENTE SC
LEFT JOIN dbo.CAF_PERSONA P ON P.PER_idPersona = SC.PER_idPersona
LEFT JOIN dbo.RCS_PERIODO PE ON PE.RCS_idPeriodo = SC.RCS_idPeriodo
LEFT JOIN dbo.CAF_SERVICIO S ON S.SER_idServicio = SC.SER_idServicio
LEFT JOIN dbo.CAF_CAT_TIPO_CLIENTE TC ON TC.CAT_idTipoCliente = SC.CAT_idTipoCliente
WHERE P.PER_idPersona IS NULL
   OR PE.RCS_idPeriodo IS NULL
   OR S.SER_idServicio IS NULL
   OR TC.CAT_idTipoCliente IS NULL;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_PERSONA_DETALLE PD
LEFT JOIN dbo.CAF_PERSONA P ON P.PER_idPersona = PD.PER_idPersona
LEFT JOIN dbo.RCS_PERIODO PE ON PE.RCS_idPeriodo = PD.RCS_idPeriodo
WHERE P.PER_idPersona IS NULL
   OR PE.RCS_idPeriodo IS NULL;
INSERT INTO @r VALUES ('T12', 'servicios y detalles referencian personas/periodos validos',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('servicio_cliente_huerfanos=', @n1, '; persona_detalle_huerfanos=', @n2));

/* T13 */
SELECT @n4 = COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO;
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
JOIN dbo.CAF_CAT_OFICINA_LOCAL OL ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
JOIN dbo.CAF_CAT_REGION R ON R.CAT_idRegion = OL.CAT_idRegion;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_PERSONA_DETALLE PD
LEFT JOIN dbo.RCS_ESTABLECIMIENTO E ON E.EST_idEstablecimiento = PD.EST_idEstablecimientoActual
WHERE PD.EST_idEstablecimientoActual IS NOT NULL
  AND E.EST_idEstablecimiento IS NULL;
INSERT INTO @r VALUES ('T13', 'jerarquia EST->OL->Region resuelve para todos los EST',
    CASE WHEN @n4 > 0 AND @n1 = @n4 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('est_con_ol_y_region=', @n1, '; est_total=', @n4, '; persona_detalle_est_inexistente=', @n2));

/* T14 / T37 */
DECLARE @allowed TABLE (name sysname);
INSERT INTO @allowed VALUES
    (N'CAF_CAT_REGION'), (N'CAF_CAT_OFICINA_LOCAL'), (N'RCS_ESTABLECIMIENTO'), (N'RCS_PERIODO'),
    (N'CAF_CAT_SEXO'), (N'CAF_FAMILIA'), (N'CAF_FAMILIA_DETALLE'), (N'CAF_PERSONA'),
    (N'CAF_PERSONA_DETALLE'), (N'CAF_SERVICIO'), (N'CAF_CAT_TIPO_CLIENTE'), (N'CAF_SERVICIO_CLIENTE'),
    (N'CAF_MENOR'), (N'CAF_EVALUACION_MENOR'), (N'CAF_INDICADOR_ANTROPOMETRICO');
SELECT @n1 = COUNT(*), @s1 = STRING_AGG(CONVERT(varchar(260), SCHEMA_NAME(t.schema_id) + N'.' + t.name), ', ')
FROM sys.tables t
WHERE t.is_ms_shipped = 0
  AND NOT (SCHEMA_NAME(t.schema_id) = N'dbo' AND t.name IN (SELECT name FROM @allowed));
SELECT @n2 = COUNT(*)
FROM @allowed a
WHERE NOT EXISTS (SELECT 1 FROM sys.tables t
                  WHERE t.is_ms_shipped = 0
                    AND SCHEMA_NAME(t.schema_id) = N'dbo'
                    AND t.name = a.name);
INSERT INTO @r VALUES ('T14', 'tablas de usuario = exactamente las 15 permitidas',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    LEFT(CONCAT('extras=', @n1, '; faltantes=', @n2, '; lista_extras=', COALESCE(@s1, '(ninguna)')), 400));

/* T15 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_REGION;
SELECT @n2 = COUNT(*) FROM dbo.CAF_CAT_REGION
WHERE (CAT_idRegion = 1 AND REG_nombre = 'Central Sur')
   OR (CAT_idRegion = 2 AND REG_nombre = 'Huetar Norte')
   OR (CAT_idRegion = 3 AND REG_nombre = 'Chorotega')
   OR (CAT_idRegion = 4 AND REG_nombre = 'Huetar Caribe')
   OR (CAT_idRegion = 5 AND REG_nombre = 'Brunca')
   OR (CAT_idRegion = 6 AND REG_nombre = 'Central Norte')
   OR (CAT_idRegion = 7 AND CONVERT(nvarchar(200), REG_nombre) COLLATE Latin1_General_BIN2 = @pac COLLATE Latin1_General_BIN2)
   OR (CAT_idRegion = 8 AND REG_nombre = 'Central Occidente')
   OR (CAT_idRegion = 9 AND REG_nombre = 'Central Este');
INSERT INTO @r VALUES ('T15', 'existen exactamente las 9 Regiones esperadas',
    CASE WHEN @n1 = 9 AND @n2 = 9 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; nombres_esperados=', @n2));

/* T16 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL;
SELECT @n2 = COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL
WHERE CAT_idOficinaLocal IN (
    101,102,103,104,105,106,
    201,202,203,204,
    301,302,303,304,305,
    401,402,403,404,405,
    501,502,503,504,505,506,
    601,602,603,604,605,
    701,702,703,
    801,802,803,
    901,902,903,904
);
INSERT INTO @r VALUES ('T16', 'existen exactamente las 41 Oficinas Locales esperadas',
    CASE WHEN @n1 = 41 AND @n2 = 41 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; codigos_esperados=', @n2));

/* T17 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL OL
LEFT JOIN dbo.CAF_CAT_REGION R ON R.CAT_idRegion = OL.CAT_idRegion
WHERE R.CAT_idRegion IS NULL
   OR OL.CAT_idOficinaLocal / 100 <> OL.CAT_idRegion;
INSERT INTO @r VALUES ('T17', 'cada OL referencia una Region valida',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('ol_sin_region_o_prefijo_invalido=', @n1));

/* T18 */
SELECT @n1 = COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO;
SELECT @n2 = COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO WHERE EST_inActivo = 1 AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @sumEst = SUM(CAST(EST_idEstablecimiento AS bigint)) FROM dbo.RCS_ESTABLECIMIENTO;
INSERT INTO @r VALUES ('T18', 'el numero de establecimientos coincide con el catalogo territorial derivado',
    CASE WHEN @n1 = @expEstTotal AND @n2 = @expEstActive AND @sumEst = @expEstChecksum THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; activos=', @n2, '; checksum=', @sumEst));

/* T19 */
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
LEFT JOIN dbo.CAF_CAT_OFICINA_LOCAL OL ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
WHERE OL.CAT_idOficinaLocal IS NULL;
INSERT INTO @r VALUES ('T19', 'cada establecimiento posee una Oficina Local valida',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('est_sin_ol=', @n1));

/* T20 */
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
LEFT JOIN dbo.CAF_CAT_OFICINA_LOCAL OL ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
LEFT JOIN dbo.CAF_CAT_REGION R ON R.CAT_idRegion = OL.CAT_idRegion
WHERE R.CAT_idRegion IS NULL;
INSERT INTO @r VALUES ('T20', 'cada establecimiento puede resolverse hasta una Region',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('est_sin_region=', @n1));

/* T21 */
SELECT @n1 = COUNT(*) FROM dbo.RCS_ESTABLECIMIENTO;
SELECT @n2 = COUNT(DISTINCT EST_idEstablecimiento) FROM dbo.RCS_ESTABLECIMIENTO;
INSERT INTO @r VALUES ('T21', 'no existen establecimientos duplicados por codigo',
    CASE WHEN @n1 = @n2 AND @n1 = @expEstTotal THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('filas=', @n1, '; distintos=', @n2));

/* T22 */
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
WHERE E.CAT_idOficinaLocal IS NULL
   OR NOT EXISTS (SELECT 1 FROM dbo.CAF_CAT_OFICINA_LOCAL OL WHERE OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal);
INSERT INTO @r VALUES ('T22', 'no existen establecimientos huerfanos',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('huerfanos=', @n1));

/* T23 */
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO
WHERE EST_inActivo = 1 AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
WHERE E.EST_inActivo = 1
  AND ISNULL(E.BIT_eliminado, 0) = 0
  AND (
      SELECT COUNT(*)
      FROM dbo.CAF_PERSONA P
      JOIN dbo.CAF_FAMILIA_DETALLE FD
        ON FD.FAM_idFamilia = P.FAM_idFamilia
       AND FD.RCS_idPeriodo = @periodId
       AND ISNULL(FD.BIT_eliminado, 0) = 0
       AND FD.EST_idEstablecimientoActual = E.EST_idEstablecimiento
      WHERE ISNULL(P.BIT_eliminado, 0) = 0
  ) BETWEEN 5 AND 10;
SELECT @n3 = MIN(c.n), @n4 = MAX(c.n)
FROM (
    SELECT COUNT(*) AS n
    FROM dbo.RCS_ESTABLECIMIENTO E
    JOIN dbo.CAF_FAMILIA_DETALLE FD
      ON FD.EST_idEstablecimientoActual = E.EST_idEstablecimiento
     AND FD.RCS_idPeriodo = @periodId
     AND ISNULL(FD.BIT_eliminado, 0) = 0
    JOIN dbo.CAF_PERSONA P
      ON P.FAM_idFamilia = FD.FAM_idFamilia
     AND ISNULL(P.BIT_eliminado, 0) = 0
    WHERE E.EST_inActivo = 1
      AND ISNULL(E.BIT_eliminado, 0) = 0
    GROUP BY E.EST_idEstablecimiento
) c;
INSERT INTO @r VALUES ('T23', 'cada establecimiento ACTIVO tiene entre 5 y 10 personas ACTIVAS para 2026',
    CASE WHEN @n1 = @n2 AND @n1 = @expEstActive AND @n3 >= 5 AND @n4 <= 10 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('est_activos=', @n1, '; en_rango=', @n2, '; min=', @n3, '; max=', @n4));

/* T24 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*) FROM dbo.CAF_PERSONA
WHERE ISNULL(BIT_eliminado, 0) = 0 AND PER_idPersona LIKE N'SYN-%';
INSERT INTO @r VALUES ('T24', 'todas las personas activas tienen PER_idPersona sintetico',
    CASE WHEN @n1 > 0 AND @n1 = @n2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('activas=', @n1, '; SYN=', @n2));

/* T25 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA;
SELECT @n2 = COUNT(*) FROM dbo.CAF_PERSONA
WHERE PER_idPersona LIKE N'SYN-[0-9][0-9][0-9][0-9][0-9][0-9][0-9]-[0-9][0-9]'
  AND LEN(PER_idPersona) <= 20;
INSERT INTO @r VALUES ('T25', 'todos los PER_idPersona cumplen SYN-<ESTID>-<NN> y caben en nvarchar(20)',
    CASE WHEN @n1 = @n2 AND @n1 > 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('total=', @n1, '; formato_ok=', @n2));

/* T26 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA;
SELECT @n2 = COUNT(DISTINCT PER_idPersona) FROM dbo.CAF_PERSONA;
INSERT INTO @r VALUES ('T26', 'no hay PER_idPersona duplicados',
    CASE WHEN @n1 = @n2 AND @n1 > 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('filas=', @n1, '; distintos=', @n2));

/* T27: cliente = persona activa con familia. Madre/padre/encargado pueden existir sin familia. */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_PERSONA P
LEFT JOIN dbo.CAF_FAMILIA F ON F.FAM_idFamilia = P.FAM_idFamilia
WHERE ISNULL(P.BIT_eliminado, 0) = 0
  AND P.FAM_idFamilia IS NOT NULL
  AND F.FAM_idFamilia IS NULL;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_PERSONA P
WHERE ISNULL(P.BIT_eliminado, 0) = 0
  AND P.FAM_idFamilia IS NULL
  AND (
      EXISTS (SELECT 1 FROM dbo.CAF_SERVICIO_CLIENTE SC WHERE SC.PER_idPersona = P.PER_idPersona)
      OR EXISTS (SELECT 1 FROM dbo.CAF_PERSONA_DETALLE PD WHERE PD.PER_idPersona = P.PER_idPersona)
      OR EXISTS (
          SELECT 1 FROM dbo.CAF_MENOR M
          WHERE M.PER_idPersona = P.PER_idPersona
            AND ISNULL(M.BIT_eliminado, 0) = 0)
  );
INSERT INTO @r VALUES ('T27', 'clientes activos poseen familia; el contexto sin familia no es cliente',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('clientes_sin_familia=', @n1, '; contexto_contaminado=', @n2));

/* T28 */
SELECT @n1 = COUNT(DISTINCT P.FAM_idFamilia)
FROM dbo.CAF_PERSONA P
LEFT JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
 AND FD.EST_idEstablecimientoActual IS NOT NULL
LEFT JOIN dbo.RCS_ESTABLECIMIENTO E ON E.EST_idEstablecimiento = FD.EST_idEstablecimientoActual
WHERE ISNULL(P.BIT_eliminado, 0) = 0
  AND (FD.FAD_idFamiliaDetalle IS NULL OR E.EST_idEstablecimiento IS NULL);
INSERT INTO @r VALUES ('T28', 'todas las familias usadas en 2026 poseen CAF_FAMILIA_DETALLE valido',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('familias_2026_invalidas=', @n1));

/* T29 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_REGION;
SELECT @n2 = COUNT(DISTINCT CAT_idRegion) FROM @resolved;
INSERT INTO @r VALUES ('T29', 'todas las Regiones tienen poblacion sintetica',
    CASE WHEN @n1 = 9 AND @n2 = 9 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('regiones=', @n1, '; con_poblacion_activa_resuelta=', @n2));

/* T30 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_CAT_OFICINA_LOCAL;
SELECT @n2 = COUNT(DISTINCT CAT_idOficinaLocal) FROM @resolved;
INSERT INTO @r VALUES ('T30', 'todas las Oficinas Locales tienen poblacion sintetica',
    CASE WHEN @n1 = 41 AND @n2 = 41 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('ol=', @n1, '; con_poblacion_activa_resuelta=', @n2));

/* T31 */
SELECT @n1 = COUNT(*)
FROM @resolved r
WHERE NOT EXISTS (
    SELECT 1 FROM dbo.CAF_SERVICIO_CLIENTE SC
    WHERE SC.PER_idPersona = r.PER_idPersona
      AND SC.RCS_idPeriodo = @periodId
      AND ISNULL(SC.BIT_eliminado, 0) = 0
);
INSERT INTO @r VALUES ('T31', 'existe al menos una persona sin servicios',
    CASE WHEN @n1 >= 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('personas_resueltas_sin_servicio=', @n1));

/* T32 */
SELECT @n1 = COUNT(*)
FROM (
    SELECT SC.PER_idPersona
    FROM dbo.CAF_SERVICIO_CLIENTE SC
    WHERE SC.RCS_idPeriodo = @periodId AND ISNULL(SC.BIT_eliminado, 0) = 0
    GROUP BY SC.PER_idPersona
    HAVING COUNT(DISTINCT SC.SER_idServicio) >= 2
) x;
INSERT INTO @r VALUES ('T32', 'existe al menos una persona con 2+ servicios',
    CASE WHEN @n1 >= 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('personas_multiservicio=', @n1));

/* T33 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_FAMILIA_DETALLE a
JOIN dbo.CAF_FAMILIA_DETALLE b
  ON b.FAM_idFamilia = a.FAM_idFamilia
 AND b.RCS_idPeriodo = 2026
 AND ISNULL(b.BIT_eliminado, 0) = 0
WHERE a.RCS_idPeriodo = 2025
  AND ISNULL(a.BIT_eliminado, 0) = 0
  AND a.EST_idEstablecimientoActual <> b.EST_idEstablecimientoActual;
INSERT INTO @r VALUES ('T33', 'existe al menos una familia con establecimiento diferente entre 2025 y 2026',
    CASE WHEN @n1 >= 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('familias_con_cambio=', @n1));

/* T34 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE BIT_eliminado = 1;
INSERT INTO @r VALUES ('T34', 'existe al menos una persona BIT_eliminado = 1',
    CASE WHEN @n1 >= 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('personas_eliminadas=', @n1));

/* T35 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE PER_idPersona = N'SYN-1100102-99' AND BIT_eliminado = 1;
SELECT @n2 = COUNT(*) FROM @resolved WHERE PER_idPersona = N'SYN-1100102-99';
SELECT @n3 = COUNT(*)
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
 AND FD.EST_idEstablecimientoActual = 1100102
WHERE ISNULL(P.BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T35', 'la persona eliminada no se incluye al calcular el rango 5-10',
    CASE WHEN @n1 = 1 AND @n2 = 0 AND @n3 BETWEEN 5 AND 10 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('eliminada=', @n1, '; en_resueltos=', @n2, '; activas_1100102=', @n3));

/* T36 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_SERVICIO_CLIENTE SC
LEFT JOIN dbo.CAF_PERSONA P ON P.PER_idPersona = SC.PER_idPersona
LEFT JOIN dbo.CAF_SERVICIO S ON S.SER_idServicio = SC.SER_idServicio
LEFT JOIN dbo.CAF_CAT_TIPO_CLIENTE TC ON TC.CAT_idTipoCliente = SC.CAT_idTipoCliente
LEFT JOIN dbo.RCS_PERIODO PE ON PE.RCS_idPeriodo = SC.RCS_idPeriodo
WHERE P.PER_idPersona IS NULL
   OR S.SER_idServicio IS NULL
   OR TC.CAT_idTipoCliente IS NULL
   OR PE.RCS_idPeriodo IS NULL
   OR SC.SEC_mes NOT BETWEEN 1 AND 12;
INSERT INTO @r VALUES ('T36', 'todos los servicios referencian persona, servicio, tipo de cliente y periodo validos',
    CASE WHEN @n1 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('filas_invalidas=', @n1));

/* T37 */
SELECT @n1 = COUNT(*)
FROM sys.tables t
WHERE t.is_ms_shipped = 0
  AND NOT (SCHEMA_NAME(t.schema_id) = N'dbo' AND t.name IN (SELECT name FROM @allowed));
SELECT @n2 = COUNT(*)
FROM @allowed a
WHERE NOT EXISTS (SELECT 1 FROM sys.tables t
                  WHERE t.is_ms_shipped = 0
                    AND SCHEMA_NAME(t.schema_id) = N'dbo'
                    AND t.name = a.name);
INSERT INTO @r VALUES ('T37', 'no existen tablas adicionales fuera de las 15 permitidas',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('extras=', @n1, '; faltantes=', @n2));

/* T38: acceso de solo lectura */
DECLARE @roleExists bit = 0, @userExists bit = 0, @userInRole bit = 0, @roleInReader bit = 0;
DECLARE @pSel int, @pIns int, @pUpd int, @pDel int, @pAlt int, @pDbAlt int, @denyRows int;
IF DATABASE_PRINCIPAL_ID(N'sia_sidinacc_reader_role') IS NOT NULL SET @roleExists = 1;
SELECT @denyRows = COUNT(*)
FROM sys.database_permissions dp
WHERE dp.grantee_principal_id = DATABASE_PRINCIPAL_ID(N'sia_sidinacc_reader_role')
  AND dp.class = 0
  AND dp.state = 'D'
  AND dp.permission_name IN (N'INSERT', N'UPDATE', N'DELETE', N'ALTER');
IF DATABASE_PRINCIPAL_ID(N'sia_sidinacc_reader') IS NOT NULL SET @userExists = 1;
IF EXISTS (SELECT 1
           FROM sys.database_role_members drm
           JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
           JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
           WHERE r.name = N'sia_sidinacc_reader_role' AND m.name = N'sia_sidinacc_reader')
    SET @userInRole = 1;
IF EXISTS (SELECT 1
           FROM sys.database_role_members drm
           JOIN sys.database_principals r ON r.principal_id = drm.role_principal_id
           JOIN sys.database_principals m ON m.principal_id = drm.member_principal_id
           WHERE r.name = N'db_datareader' AND m.name = N'sia_sidinacc_reader_role')
    SET @roleInReader = 1;
IF @userExists = 1
BEGIN
    EXECUTE AS USER = N'sia_sidinacc_reader';
    SET @pSel = HAS_PERMS_BY_NAME(N'dbo.CAF_PERSONA', N'OBJECT', N'SELECT');
    SET @pIns = HAS_PERMS_BY_NAME(N'dbo.CAF_PERSONA', N'OBJECT', N'INSERT');
    SET @pUpd = HAS_PERMS_BY_NAME(N'dbo.CAF_PERSONA', N'OBJECT', N'UPDATE');
    SET @pDel = HAS_PERMS_BY_NAME(N'dbo.CAF_PERSONA', N'OBJECT', N'DELETE');
    SET @pAlt = HAS_PERMS_BY_NAME(N'dbo.CAF_PERSONA', N'OBJECT', N'ALTER');
    SET @pDbAlt = HAS_PERMS_BY_NAME(NULL, N'DATABASE', N'ALTER');
    REVERT;
END;
INSERT INTO @r VALUES ('T38', 'usuario de la app solo puede leer (SELECT=1; INSERT/UPDATE/DELETE/ALTER=0; 4 DENY)',
    CASE WHEN @roleExists = 1 AND @userExists = 1 AND @userInRole = 1 AND @roleInReader = 1
              AND @denyRows = 4
              AND @pSel = 1 AND @pIns = 0 AND @pUpd = 0 AND @pDel = 0 AND @pAlt = 0 AND @pDbAlt = 0
         THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('rol=', @roleExists, '; usuario=', @userExists, '; usuario_en_rol=', @userInRole,
           '; rol_en_db_datareader=', @roleInReader, '; deny_rows=', @denyRows,
           '; sel=', COALESCE(CONVERT(varchar(4), @pSel), 'NULL'),
           '; ins=', COALESCE(CONVERT(varchar(4), @pIns), 'NULL'),
           '; upd=', COALESCE(CONVERT(varchar(4), @pUpd), 'NULL'),
           '; del=', COALESCE(CONVERT(varchar(4), @pDel), 'NULL'),
           '; alt=', COALESCE(CONVERT(varchar(4), @pAlt), 'NULL'),
           '; db_alt=', COALESCE(CONVERT(varchar(4), @pDbAlt), 'NULL')));

/* T39 */
SELECT @n1 = COUNT(*) FROM sys.objects
WHERE is_ms_shipped = 0 AND type IN ('V', 'P', 'FN', 'IF', 'TF', 'TR');
SELECT @n2 = COUNT(*) FROM sys.triggers WHERE is_ms_shipped = 0;
INSERT INTO @r VALUES ('T39', 'sin vistas, procedimientos, funciones ni triggers de usuario',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('objetos_V_P_FN_IF_TF_TR=', @n1, '; triggers=', @n2));

/* T40 */
SELECT @n1 = COUNT(*) FROM dbo.CAF_PERSONA WHERE PER_beneficiario IS NOT NULL;
SELECT @n2 = COUNT(*) FROM dbo.CAF_FAMILIA_DETALLE WHERE FAD_inActiva IS NOT NULL;
INSERT INTO @r VALUES ('T40', 'PER_beneficiario y FAD_inActiva permanecen NULL',
    CASE WHEN @n1 = 0 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('PER_beneficiario_no_nulo=', @n1, '; FAD_inActiva_no_nulo=', @n2));

/* T41 */
SELECT @n1 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO
WHERE EST_inActivo = 0 AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*)
FROM dbo.RCS_ESTABLECIMIENTO E
WHERE E.EST_inActivo = 0
  AND ISNULL(E.BIT_eliminado, 0) = 0
  AND (
      SELECT COUNT(*)
      FROM dbo.CAF_PERSONA P
      JOIN dbo.CAF_FAMILIA_DETALLE FD
        ON FD.FAM_idFamilia = P.FAM_idFamilia
       AND FD.RCS_idPeriodo = @periodId
       AND ISNULL(FD.BIT_eliminado, 0) = 0
       AND FD.EST_idEstablecimientoActual = E.EST_idEstablecimiento
      WHERE ISNULL(P.BIT_eliminado, 0) = 0
  ) = 0;
INSERT INTO @r VALUES ('T41', 'cada establecimiento INACTIVO/CERRADO tiene 0 personas activas 2026',
    CASE WHEN @n1 = (@expEstTotal - @expEstActive) AND @n1 = @n2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('est_inactivos=', @n1, '; esperados=', @expEstTotal - @expEstActive, '; con_cero_activas_2026=', @n2));

/* Relacion estructural. No inventa otros parentescos.
   Madre si encargado = madre; Padre si encargado = padre; si no, Persona encargada. */
DECLARE @rel nvarchar(40);

/* T42 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_MENOR M
JOIN dbo.CAF_PERSONA N ON N.PER_idPersona = M.PER_idPersona
JOIN dbo.CAF_PERSONA E ON E.PER_idPersona = M.MEN_idEncargado
WHERE M.PER_idPersona = N'SYN-1100102-01'
  AND M.RCS_idPeriodo = @periodId
  AND ISNULL(M.BIT_eliminado, 0) = 0
  AND E.PER_idPersona = N'SYN-1100102-81'
  AND E.PER_nombre = 'Rosa'
  AND E.PER_apellidoUno = 'Solano';
INSERT INTO @r VALUES ('T42', 'CAF_MENOR asocia a la persona con su encargado en CAF_PERSONA',
    CASE WHEN @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('vinculos_2026=', @n1));

/* T43 */
SELECT @rel = CASE
        WHEN M.MEN_idEncargado = M.MEN_idMadre THEN N'Madre'
        WHEN M.MEN_idEncargado = M.MEN_idPadre THEN N'Padre'
        ELSE N'Persona encargada'
    END
FROM dbo.CAF_MENOR M
WHERE M.PER_idPersona = N'SYN-1100102-01'
  AND M.RCS_idPeriodo = 2026
  AND ISNULL(M.BIT_eliminado, 0) = 0;
SELECT @n1 = COUNT(*)
FROM dbo.CAF_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND RCS_idPeriodo = 2025
  AND MEN_idEncargado = N'SYN-1100102-82'
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T43', 'encargado = madre en 2026 se lee Madre y no el encargado de 2025',
    CASE WHEN @rel = N'Madre' AND @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('relacion_2026=', COALESCE(@rel, N'(ninguna)'), '; fila_2025_padre=', @n1));

/* T44 */
SELECT @rel = CASE
        WHEN M.MEN_idEncargado = M.MEN_idMadre THEN N'Madre'
        WHEN M.MEN_idEncargado = M.MEN_idPadre THEN N'Padre'
        ELSE N'Persona encargada'
    END
FROM dbo.CAF_MENOR M
WHERE M.PER_idPersona = N'SYN-1100102-02'
  AND M.RCS_idPeriodo = 2026
  AND ISNULL(M.BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T44', 'encargado = padre se lee Padre',
    CASE WHEN @rel = N'Padre' THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('relacion=', COALESCE(@rel, N'(ninguna)')));

/* T45 */
SELECT @rel = CASE
        WHEN M.MEN_idEncargado = M.MEN_idMadre THEN N'Madre'
        WHEN M.MEN_idEncargado = M.MEN_idPadre THEN N'Padre'
        ELSE N'Persona encargada'
    END
FROM dbo.CAF_MENOR M
WHERE M.PER_idPersona = N'SYN-1100102-03'
  AND M.RCS_idPeriodo = 2026
  AND ISNULL(M.BIT_eliminado, 0) = 0
  AND M.MEN_idEncargado = N'SYN-1100102-87'
  AND M.MEN_idEncargado <> M.MEN_idMadre
  AND M.MEN_idEncargado <> M.MEN_idPadre;
INSERT INTO @r VALUES ('T45', 'encargado distinto de madre y padre se lee Persona encargada',
    CASE WHEN @rel = N'Persona encargada' THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('relacion=', COALESCE(@rel, N'(ninguna)')));

/* T46 */
SELECT @rel = CASE
        WHEN M.MEN_idEncargado = M.MEN_idMadre THEN N'Madre'
        WHEN M.MEN_idEncargado = M.MEN_idPadre THEN N'Padre'
        ELSE N'Persona encargada'
    END,
    @n1 = CASE WHEN M.MEN_idPadre IS NULL THEN 1 ELSE 0 END
FROM dbo.CAF_MENOR M
WHERE M.PER_idPersona = N'SYN-1100102-04'
  AND M.RCS_idPeriodo = 2026
  AND ISNULL(M.BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T46', 'si el padre no esta registrado, el encargado madre sigue siendo Madre',
    CASE WHEN @rel = N'Madre' AND @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('relacion=', COALESCE(@rel, N'(ninguna)'), '; padre_ausente=', @n1));

/* T47 perfil: persona, menor, encargado, familia, establecimiento, OL, region y direccion del periodo. */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_MENOR M
  ON M.PER_idPersona = P.PER_idPersona
 AND M.RCS_idPeriodo = @periodId
 AND ISNULL(M.BIT_eliminado, 0) = 0
JOIN dbo.CAF_PERSONA ENC ON ENC.PER_idPersona = M.MEN_idEncargado
JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
JOIN dbo.RCS_ESTABLECIMIENTO E ON E.EST_idEstablecimiento = FD.EST_idEstablecimientoActual
JOIN dbo.CAF_CAT_OFICINA_LOCAL OL ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
JOIN dbo.CAF_CAT_REGION R ON R.CAT_idRegion = OL.CAT_idRegion
WHERE P.PER_idPersona = N'SYN-1100102-01'
  AND ENC.PER_idPersona = N'SYN-1100102-81'
  AND FD.FAD_direccion = 'Calle Sintetica 12 casa demo'
  AND E.EST_idEstablecimiento = 1100102
  AND OL.CAT_idOficinaLocal = 101
  AND R.CAT_idRegion = 1;
INSERT INTO @r VALUES ('T47', 'el perfil 2026 resuelve direccion familiar y jerarquia territorial',
    CASE WHEN @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('perfiles=', @n1));

/* T48 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
WHERE P.PER_idPersona = N'SYN-1100102-01'
  AND FD.FAD_telefonoUno = 88881101;
INSERT INTO @r VALUES ('T48', 'el contacto principal sale del detalle familiar del periodo',
    CASE WHEN @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('coincidencias=', @n1));

/* T49 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_FAMILIA_DETALLE
WHERE FAM_idFamilia = 110010201
  AND RCS_idPeriodo = 2026
  AND FAD_telefonoDos = 88881102
  AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_FAMILIA_DETALLE
WHERE FAM_idFamilia = 110010203
  AND RCS_idPeriodo = 2025
  AND FAD_telefonoDos IS NULL
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T49', 'hay telefono alternativo y tambien un periodo sin telefono alternativo',
    CASE WHEN @n1 = 1 AND @n2 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('alternativo_2026=', @n1, '; ausente_2025=', @n2));

/* T50 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_FAMILIA_DETALLE a
JOIN dbo.CAF_FAMILIA_DETALLE b
  ON b.FAM_idFamilia = a.FAM_idFamilia
 AND b.RCS_idPeriodo = 2025
 AND ISNULL(b.BIT_eliminado, 0) = 0
WHERE a.FAM_idFamilia = 110010203
  AND a.RCS_idPeriodo = 2026
  AND ISNULL(a.BIT_eliminado, 0) = 0
  AND a.FAD_direccion = 'Calle Sintetica 30 casa demo 2026'
  AND b.FAD_direccion = 'Calle Sintetica 4 casa demo 2025'
  AND a.FAD_direccion <> b.FAD_direccion
  AND a.FAD_telefonoUno = 88883301
  AND b.FAD_telefonoUno = 88882201
  AND a.FAD_telefonoUno <> b.FAD_telefonoUno;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_FAMILIA_DETALLE
WHERE FAM_idFamilia = 110010203
  AND RCS_idPeriodo = 2026
  AND (FAD_direccion = 'Calle Sintetica 4 casa demo 2025' OR FAD_telefonoUno = 88882201);
INSERT INTO @r VALUES ('T50', '2026 no reutiliza direccion ni telefono del detalle 2025',
    CASE WHEN @n1 = 1 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('periodos_distintos=', @n1, '; contaminacion_2026=', @n2));

/* T51 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(DISTINCT EVM_fechaEvaluacion)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T51', 'una persona puede tener varias evaluaciones activas en fechas distintas',
    CASE WHEN @n1 >= 2 AND @n2 >= 2 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('activas=', @n1, '; fechas=', @n2));

/* T52 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE EVM_idEvaluacionMenor = 1
  AND PER_idPersona = N'SYN-1100102-01'
  AND EVM_fechaEvaluacion = DATETIMEFROMPARTS(2026, 3, 15, 0, 0, 0, 0);
INSERT INTO @r VALUES ('T52', 'se conserva la fecha de evaluacion',
    CASE WHEN @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('coincidencias=', @n1));

/* T53 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND EVM_fechaEvaluacion = DATETIMEFROMPARTS(2026, 3, 15, 0, 0, 0, 0)
  AND RCS_idPeriodo = 2026
  AND ISNULL(BIT_eliminado, 0) = 0;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND EVM_fechaEvaluacion = DATETIMEFROMPARTS(2025, 11, 2, 0, 0, 0, 0)
  AND RCS_idPeriodo = 2025
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T53', 'se conservan evaluaciones de 2026 y de 2025 con su periodo',
    CASE WHEN @n1 = 1 AND @n2 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('eval_2026=', @n1, '; eval_2025=', @n2));

/* T54 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE EVM_idEvaluacionMenor = 4
  AND BIT_eliminado = 1;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-02'
  AND ISNULL(BIT_eliminado, 0) = 0;
INSERT INTO @r VALUES ('T54', 'una evaluacion eliminada no se considera activa',
    CASE WHEN @n1 = 1 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('eliminada=', @n1, '; activas_persona_02=', @n2));

/* MOCK_ONLY: tinyint 9 = senal demo sintetica; tinyint 1 = normal. No es ANT_id ni catalogo productivo. */
/* T55 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE ISNULL(BIT_eliminado, 0) = 0
  AND EVM_estadoNutricionalPe = 9;
SELECT @n2 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE BIT_eliminado = 1
  AND EVM_estadoNutricionalPe = 9;
INSERT INTO @r VALUES ('T55', 'el codigo sintetico 9 activo puede producir senal demo MOCK_ONLY',
    CASE WHEN @n1 = 1 AND @n2 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('senal_activa=', @n1, '; senal_eliminada_no_activa=', @n2));

/* T56 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_EVALUACION_MENOR
WHERE PER_idPersona = N'SYN-1100102-01'
  AND EVM_fechaEvaluacion = DATETIMEFROMPARTS(2026, 8, 20, 0, 0, 0, 0)
  AND ISNULL(BIT_eliminado, 0) = 0
  AND EVM_estadoNutricionalPe = 1
  AND EVM_estadoNutricionalPt = 1
  AND EVM_estadoNutricionalTe = 1
  AND EVM_estadoNutricionalImc = 1;
INSERT INTO @r VALUES ('T56', 'el codigo sintetico 1 no produce senal demo',
    CASE WHEN @n1 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('evaluaciones_normales=', @n1));

/* T57 */
SELECT @n1 = COUNT(*)
FROM sys.tables
WHERE name LIKE N'%EDIN%'
   OR name LIKE N'%EVADE%'
   OR name IN (N'CAF_EDIN', N'CAF_EVADE', N'CAF_RESULTADO_EDIN', N'CAF_RESULTADO_EVADE');
SELECT @n2 = CASE WHEN COL_LENGTH(N'dbo.CAF_MENOR', N'MEN_rezagoDesarrollo') IS NULL THEN 0 ELSE 1 END;
SELECT @n3 = COUNT(*)
FROM sys.columns
WHERE name IN (N'REG_codigoReferencia', N'OFL_codigoReferencia', N'EST_codigoReferencia');
INSERT INTO @r VALUES ('T57', 'no hay tablas EDIN/EVADE, ni rezago como sustituto, ni codigos territoriales inventados',
    CASE WHEN @n1 = 0 AND @n2 = 0 AND @n3 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('tablas_edin_evade=', @n1, '; columna_rezago=', @n2, '; columnas_codigo=', @n3));

/* T58 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_PERSONA
WHERE PER_idPersona IN (
    N'SYN-1100102-81', N'SYN-1100102-82', N'SYN-1100102-83', N'SYN-1100102-84',
    N'SYN-1100102-85', N'SYN-1100102-86', N'SYN-1100102-87', N'SYN-1100102-88');
SELECT @n2 = COUNT(*)
FROM @resolved
WHERE PER_idPersona IN (
    N'SYN-1100102-81', N'SYN-1100102-82', N'SYN-1100102-83', N'SYN-1100102-84',
    N'SYN-1100102-85', N'SYN-1100102-86', N'SYN-1100102-87', N'SYN-1100102-88');
SELECT @n3 = COUNT(*)
FROM dbo.CAF_SERVICIO_CLIENTE
WHERE PER_idPersona IN (
    N'SYN-1100102-81', N'SYN-1100102-82', N'SYN-1100102-83', N'SYN-1100102-84',
    N'SYN-1100102-85', N'SYN-1100102-86', N'SYN-1100102-87', N'SYN-1100102-88');
INSERT INTO @r VALUES ('T58', 'madre, padre y encargado no aparecen como beneficiarios solo por estar en CAF_PERSONA',
    CASE WHEN @n1 = 8 AND @n2 = 0 AND @n3 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('personas_contexto=', @n1, '; en_busqueda=', @n2, '; con_servicios=', @n3));

/* T59 */
SELECT @n1 = COUNT(*)
FROM dbo.CAF_INDICADOR_ANTROPOMETRICO
WHERE BIT_eliminado = 0
  AND ANT_clasificacion LIKE N'MOCK_ONLY%'
  AND ANT_id IN (9001, 9002);
SELECT @n2 = COUNT(*)
FROM sys.foreign_keys fk
WHERE fk.parent_object_id = OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR')
  AND fk.referenced_object_id = OBJECT_ID(N'dbo.CAF_INDICADOR_ANTROPOMETRICO');
INSERT INTO @r VALUES ('T59', 'el indicador es MOCK_ONLY y no hay FK desde los estados nutricionales',
    CASE WHEN @n1 = 2 AND @n2 = 0 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('indicadores_mock=', @n1, '; fk_estado_ant=', @n2));

/* T60 */
SELECT @n1 = COUNT(*)
FROM sys.indexes
WHERE name = N'IX_CAF_MENOR_PersonaPeriodo'
  AND object_id = OBJECT_ID(N'dbo.CAF_MENOR');
SELECT @n2 = COUNT(*)
FROM sys.indexes
WHERE name = N'IX_CAF_EVALUACION_MENOR_PersonaPeriodoFecha'
  AND object_id = OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR');
INSERT INTO @r VALUES ('T60', 'existen los indices de menor y de evaluacion por persona, periodo y fecha',
    CASE WHEN @n1 = 1 AND @n2 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('idx_menor=', @n1, '; idx_evaluacion=', @n2));

/* T61 PROVISIONAL_KEY / TODO-UTIC */
SELECT @n1 = COUNT(*)
FROM sys.indexes i
JOIN sys.index_columns ic
  ON ic.object_id = i.object_id
 AND ic.index_id = i.index_id
JOIN sys.columns c
  ON c.object_id = ic.object_id
 AND c.column_id = ic.column_id
WHERE i.object_id = OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR')
  AND i.is_primary_key = 1
  AND c.name = N'EVM_idEvaluacionMenor';
SELECT @n2 = COUNT(*)
FROM sys.index_columns ic
JOIN sys.indexes i
  ON i.object_id = ic.object_id
 AND i.index_id = ic.index_id
WHERE i.object_id = OBJECT_ID(N'dbo.CAF_EVALUACION_MENOR')
  AND i.is_primary_key = 1;
INSERT INTO @r VALUES ('T61', 'la PK local provisional de la evaluacion es EVM_idEvaluacionMenor',
    CASE WHEN @n1 = 1 AND @n2 = 1 THEN 'PASS' ELSE 'FAIL' END,
    CONCAT('pk_evm=', @n1, '; columnas_pk=', @n2));

SELECT * FROM @r ORDER BY test;

IF (SELECT COUNT(*) FROM @r) <> 61
    THROW 50091, 'SIDINACC_LOCAL smoke tests: se esperaban 61 pruebas evaluadas', 1;

IF EXISTS (SELECT 1 FROM @r WHERE resultado <> 'PASS')
BEGIN
    THROW 50090, 'SIDINACC_LOCAL smoke tests FAILED', 1;
END
ELSE
BEGIN
    PRINT 'SIDINACC_LOCAL smoke tests PASSED (61/61)';
END;
GO

SET NOEXEC OFF;
GO
