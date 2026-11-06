# Despliegue de SIA_CENCINAI

Ejecución real en el SQL Server local que ya alojaba `SIDINACC_LOCAL`. No se reinstaló el motor ni se creó otra instancia.

## Instancia

| Dato | Valor |
| --- | --- |
| Contenedor | `sidinacc-local-sql` |
| Imagen | `mcr.microsoft.com/mssql/server:2022-latest` |
| Puerto publicado | `1433` |
| Nombre de servidor | `d0587951c363` |
| Versión | 16.0.4305.5 |
| Edición | Developer Edition (64-bit) |
| Base creada | `SIA_CENCINAI` |
| Collation | `Latin1_General_100_CI_AS` |
| Fecha de las migraciones, según `schema_migracion` | 2026-11-06 00:02:32 a 00:02:34 |

No hay credenciales en este informe. El contenedor ya existía y estaba detenido; se inició el mismo contenedor. Docker Desktop tuvo que arrancar porque el servicio estaba parado.

Antes de `CREATE DATABASE`, `sys.databases` mostraba `master`, `model`, `msdb`, `tempdb` y `SIDINACC_LOCAL`. `SIA_CENCINAI` no existía.

## Migraciones

Las diez se aplicaron en orden, cada una con `sqlcmd -b -I`, y quedaron `APLICADA`.

| Orden | Código | Resultado |
| ---: | --- | --- |
| 1 | `001_database_prerequisites` | Aplicada |
| 10 | `010_core_schema` | Aplicada |
| 20 | `020_catalogs_and_configuration` | Aplicada |
| 30 | `030_references` | Aplicada |
| 40 | `040_sessions_and_assessments` | Aplicada |
| 50 | `050_cases_and_plans` | Aplicada |
| 60 | `060_attentions_and_scheduling` | Aplicada |
| 70 | `070_documents_and_reporting` | Aplicada |
| 80 | `080_audit_and_security` | Aplicada |
| 90 | `090_constraints_and_indexes` | Aplicada |

No hubo que corregir el DDL. La primera ejecución pasó.

## Objetos en el motor

| Objeto | Cantidad |
| --- | ---: |
| Tablas de usuario | 47 |
| Tablas de dominio | 46 |
| `schema_migracion` | 1 |
| Vista `dbo.caso_lista_establecimiento` | 1 |
| Procedimiento `ops.cerrar_caso` | 1 |
| Claves primarias | 47 |
| Claves foráneas | 73 |
| Restricciones `UNIQUE` | 31 |
| Restricciones `CHECK` | 112 |
| Valores predeterminados | 1 |
| Índices únicos que no son la clave primaria | 43 |
| Índices secundarios no únicos | 17 |

Los 43 índices únicos no primarios son las 31 restricciones `UNIQUE` más los 12 índices únicos explícitos del diseño. Los 17 secundarios coinciden con el diseño. Las 73 claves foráneas y las 112 restricciones `CHECK` están habilitadas y son de confianza: cero deshabilitadas y cero sin confianza.

No hay tablas `CAF_` ni `RCS_` en `SIA_CENCINAI`. No hay columna de caso sucesor.

`tests/010_schema_validation.sql` imprimió: `RESUMEN OK: 46 tablas de dominio, vista, procedimiento de cierre, sin CAF_/RCS_ y sin cascada.`

## Semillas

La semilla confirmada `010_confirmed_catalogs.sql` se ejecutó con el interruptor de desarrollo en una copia de ejecución. Dejó nueve filas de la matriz y nueve códigos DR. Los scripts del repositorio conservan el interruptor en 0.

## Correcciones

Ninguna migración fue reescrita. El generador `seeds/030_synthetic_scale.sql` sí se ajustó al ejecutarlo:

1. Comparación explícita `Latin1_General_100_CI_AS` al leer texto de `SIDINACC_LOCAL`, cuya collation es distinta.
2. El sufijo `REF` de un lote siguiente continúa después del máximo ya guardado para ese establecimiento y año. No se creó una tabla contador.
3. El caso histórico se cierra con `ops.cerrar_caso` antes de abrir otro caso de la misma persona.
4. La llamada al procedimiento usa variables. `EXEC` no acepta una expresión en el argumento.
5. Las categorías de la valoración de cada fase no se vuelven a insertar en la fase siguiente.

## Tamaño

Después de la carga, los archivos de `SIA_CENCINAI` ocupaban 72 MB de datos y 144 MB en total, según `sys.database_files`.
