/*
SIA_CENCINAI — comprobación de solo lectura para los scripts 100 y 101

Responsable: Sarah Priscilla Quesada Chaves.
Fecha: 2026-11-18.

No inserta, no actualiza y no borra. Puede ejecutarse antes y después,
en la misma instancia de desarrollo, y comparar ambos resultados.

No apunta a SIDINACC_LOCAL. No forma parte de la cadena 001 a 090.
No cambia @permitir ni activa catálogos.

Ejecución, desde la raíz del repositorio:

sqlcmd -S <instancia-aislada> -d SIA_CENCINAI -E -b -I -i database/sia-cencinai/pending/comprobacion_catalogos_100_101.sql

Antes, con la semilla sintética vigente, se espera:
- 5 motivos de referencia activos y ninguno de los tres códigos nuevos;
- una sola versión de instrumento vigente, la número 1, con 2 categorías
  y 2 factores;
- la versión 1 conserva sus factores.

Después de 100, 101 y 102, en ese orden, se espera:
- 20 motivos activos: 2 de Crecimiento, 2 de Desarrollo, 13 de Salud
  y 3 factores de riesgo, con órdenes 1 a 20 sin repetirse;
- una sola versión vigente, la número 2, con 9 categorías y 74 factores;
- la versión 1 sigue existiendo con vigente = 0 y los mismos factores;
- los conteos de referencias, motivos guardados, valoraciones y factores
  ya valorados no cambian.
*/
USE SIA_CENCINAI;
GO

SET NOCOUNT ON;

SELECT
    DB_NAME() AS base_actual,
    (SELECT COUNT(*) FROM dbo.ref_referencia) AS referencias,
    (SELECT COUNT(*) FROM dbo.ref_motivo) AS motivos_guardados,
    (SELECT COUNT(*) FROM dbo.ses_valoracion) AS valoraciones,
    (SELECT COUNT(*) FROM dbo.ses_valoracion_factor) AS factores_valorados;

SELECT
    v.cat_version_id,
    v.numero_version,
    v.vigente,
    (
        SELECT COUNT(*)
        FROM dbo.cat_item AS i
        WHERE i.cat_version_id = v.cat_version_id
          AND i.activo = 1
    ) AS motivos_activos
FROM dbo.cat_version AS v
WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
ORDER BY v.numero_version;

SELECT
    i.codigo,
    i.etiqueta,
    i.orden,
    i.ambito,
    i.requiere_texto,
    i.activo
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v
    ON v.cat_version_id = i.cat_version_id
WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
  AND v.vigente = 1
  AND i.codigo IN (
      N'FACTOR_RIESGO_INDIVIDUAL',
      N'FACTOR_RIESGO_HOGAR_FAMILIAR',
      N'FACTOR_RIESGO_COMUNITARIO'
  )
ORDER BY i.orden, i.codigo;

SELECT
    i.codigo,
    COUNT(*) AS repeticiones
FROM dbo.cat_item AS i
INNER JOIN dbo.cat_version AS v
    ON v.cat_version_id = i.cat_version_id
WHERE v.codigo_catalogo = N'MOTIVO_REFERENCIA'
  AND v.vigente = 1
GROUP BY i.codigo
HAVING COUNT(*) > 1;

SELECT
    v.instrumento_version_id,
    v.numero_version,
    v.vigente,
    CONVERT(char(10), v.vigente_desde, 23) AS vigente_desde,
    (
        SELECT COUNT(*)
        FROM dbo.cat_instrumento_categoria AS c
        WHERE c.instrumento_version_id = v.instrumento_version_id
    ) AS categorias,
    (
        SELECT COUNT(*)
        FROM dbo.cat_instrumento_factor AS f
        INNER JOIN dbo.cat_instrumento_categoria AS c
            ON c.categoria_id = f.categoria_id
        WHERE c.instrumento_version_id = v.instrumento_version_id
    ) AS factores
FROM dbo.cat_instrumento_version AS v
ORDER BY v.numero_version;

SELECT
    c.orden,
    c.eje,
    c.ambito,
    c.es_requerida,
    COUNT(f.factor_id) AS factores
FROM dbo.cat_instrumento_version AS v
INNER JOIN dbo.cat_instrumento_categoria AS c
    ON c.instrumento_version_id = v.instrumento_version_id
LEFT JOIN dbo.cat_instrumento_factor AS f
    ON f.categoria_id = c.categoria_id
   AND f.activo = 1
WHERE v.vigente = 1
GROUP BY c.orden, c.eje, c.ambito, c.es_requerida
ORDER BY c.orden;

SELECT
    f.codigo,
    COUNT(*) AS repeticiones
FROM dbo.cat_instrumento_factor AS f
INNER JOIN dbo.cat_instrumento_categoria AS c
    ON c.categoria_id = f.categoria_id
INNER JOIN dbo.cat_instrumento_version AS v
    ON v.instrumento_version_id = c.instrumento_version_id
WHERE v.vigente = 1
GROUP BY f.codigo
HAVING COUNT(*) > 1;

SELECT
    SUM(CASE WHEN vigente = 1 THEN 1 ELSE 0 END) AS versiones_vigentes
FROM dbo.cat_instrumento_version;

SELECT
    dp.name AS rol,
    OBJECT_NAME(pe.major_id) AS objeto,
    pe.permission_name,
    pe.state_desc
FROM sys.database_permissions AS pe
INNER JOIN sys.database_principals AS dp
    ON dp.principal_id = pe.grantee_principal_id
WHERE dp.name = N'rol_aplicacion'
  AND pe.class = 1
  AND OBJECT_NAME(pe.major_id) IN (
      N'cat_item',
      N'cat_instrumento_version',
      N'cat_instrumento_categoria',
      N'cat_instrumento_factor'
  )
ORDER BY objeto, pe.permission_name;
GO
