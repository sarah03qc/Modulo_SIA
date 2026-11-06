# Estrategia de migración

## Orden

Las diez migraciones se aplican de `001` a `090`. Cada una inserta su fila en `dbo.schema_migracion` en la misma transacción que sus objetos, salvo el `CREATE DATABASE` de `001`, que SQL Server no admite dentro de una transacción de usuario.

| Orden | Código | Qué cierra |
| --- | --- | --- |
| 1 | `001_database_prerequisites` | Base, esquema `ops`, roles y libro de versiones |
| 10 | `010_core_schema` | `vinculo_persona` |
| 20 | `020_catalogs_and_configuration` | Catálogos, matriz e instrumento |
| 30 | `030_references` | Referencias |
| 40 | `040_sessions_and_assessments` | Sesión y valoración, sin FK al caso |
| 50 | `050_cases_and_plans` | Caso, cierre, historial y plan |
| 60 | `060_attentions_and_scheduling` | Atenciones y programación |
| 70 | `070_documents_and_reporting` | Documentos e informe |
| 80 | `080_audit_and_security` | Borrador, auditoría y `ops.cerrar_caso` |
| 90 | `090_constraints_and_indexes` | FK circulares, vista y permisos |

`090` es obligatoria. Un despliegue que se detenga en `080` tiene columnas de caso sin las FK de regreso y sin permisos. `schema_migracion` no tendrá la fila `090`, así que la instalación no aparece completa.

## Idempotencia

Si el código ya está en `schema_migracion` con estado `APLICADA`, el archivo imprime que ya fue aplicado y no repite el DDL. `001` consulta esa tabla con SQL dinámico porque en la primera corrida la tabla todavía no existe al compilar el lote.

Las semillas confirmadas y sintéticas también pueden repetirse: la confirmada inserta por clave natural y la sintética sale si ya existe `REF-001-2026`.

## Fallo y recuperación

El DDL de cada archivo, desde `010` hasta `090`, va en una transacción con `XACT_ABORT ON`. Si una sentencia falla, el `CATCH` revierte el archivo completo y no inserta la fila de versión. La base queda en la última migración confirmada, no en un intermedio marcado como instalado.

`CREATE DATABASE` no entra en esa transacción. Si `001` crea la base y luego falla al crear roles, la base puede existir vacía. La recuperación es volver a ejecutar `001`: no recrea la base y continúa con los objetos que la transacción no haya confirmado.

No hay scripts `DROP` ni de bajada automática. Recuperar una migración ya confirmada es restaurar el respaldo de la instancia de desarrollo o descartar la base de esa instancia. No se ha escrito un camino destructivo.

El procedimiento `ops.cerrar_caso` se crea con SQL dinámico dentro de la transacción de `080`, para que un fallo también revierta el procedimiento.

## Cómo validar una instalación desde cero

1. Ejecutar los diez archivos en orden, cada uno en su propia invocación.
2. Confirmar diez filas `APLICADA` en `dbo.schema_migracion`.
3. Ejecutar `tests/010_schema_validation.sql` con `@ejecutar = 1`.
4. Ejecutar la semilla confirmada y, solo en desarrollo, la sintética.
5. Ejecutar las pruebas `020` a `050`.
6. Dejar `060` y `061` para una copia desechable y dos ventanas. No cuentan como aprobadas hasta esa ejecución.

La sintaxis de estos archivos no se validó contra un motor en esta etapa.
