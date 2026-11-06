# SIA_CENCINAI — diseño físico SQL Server

Scripts de la base de desarrollo. La ejecución local quedó registrada en `docs/DEPLOYMENT_REPORT.md`.
Estos archivos no modifican `SIDINACC_LOCAL`.

## Qué hay

| Carpeta | Contenido |
| --- | --- |
| `migrations/` | Diez scripts ordenados, de la base vacía a las FK circulares y los permisos. |
| `seeds/010_confirmed_catalogs.sql` | Catálogos confirmados y las nueve filas de RN-009. |
| `seeds/020_synthetic_dataset.sql` | Expediente pequeño para las pruebas funcionales. No es semilla productiva. |
| `seeds/030_synthetic_scale.sql` | Generador reproducible `small` / `medium` / `large`. Lee identificadores `SYN-` y no escribe en `SIDINACC_LOCAL`. |
| `seeds/040_territorial_coverage.sql` | Pase posterior: un caso sintético por establecimiento activo que ya tiene personas elegibles y ningún caso. No inventa personas. |
| `tests/` | Validación de catálogo, integridad, transacciones, reportería y concurrencia. |
| `queries/` | Consultas de las visualizaciones y conciliaciones. |
| `docs/` | Diseño, migraciones, transacciones, seguridad, pruebas y huecos. |

## Orden de ejecución futura

Solo con autorización explícita, en una instancia que no sea institucional:

1. `migrations/001_database_prerequisites.sql`
2. `migrations/010_core_schema.sql`
3. `migrations/020_catalogs_and_configuration.sql`
4. `migrations/030_references.sql`
5. `migrations/040_sessions_and_assessments.sql`
6. `migrations/050_cases_and_plans.sql`
7. `migrations/060_attentions_and_scheduling.sql`
8. `migrations/070_documents_and_reporting.sql`
9. `migrations/080_audit_and_security.sql`
10. `migrations/090_constraints_and_indexes.sql`
11. `seeds/010_confirmed_catalogs.sql` después de cambiar `@permitir` a 1
12. `seeds/020_synthetic_dataset.sql` después de cambiar `@permitir_sintetico` a 1, solo en desarrollo
13. `seeds/030_synthetic_scale.sql` en desarrollo, con `@permitir_escala = 1`, semilla fija y `@escala` en `small`, luego `medium`, luego `large`
14. `seeds/040_territorial_coverage.sql` en desarrollo, con `@permitir_cobertura = 1` y la misma semilla, solo si la auditoría muestra establecimientos activos elegibles sin caso
15. Pruebas, en el orden de `docs/TEST_PLAN.md`

Cada archivo de migración es una invocación aparte. `001` crea la base; el resto empieza con `USE SIA_CENCINAI`.

Ejemplo, no ejecutado en este diseño:

```text
sqlcmd -S <instancia-aislada> -E -b -I -i database/sia-cencinai/migrations/001_database_prerequisites.sql
```

`-b` detiene el lote ante un error. `-I` activa `QUOTED_IDENTIFIER`, necesario para los índices filtrados.

## Qué no hace esta carpeta

- No abre una conexión.
- No ejecuta `CREATE DATABASE`, `CREATE TABLE` ni semillas.
- No contiene contraseñas, usuarios de Windows ni cadenas de producción.
- No crea tablas `CAF_*` ni `RCS_*`.
- No crea una FK hacia `SIDINACC_LOCAL`.
- No asigna establecimientos autorizados. Eso sigue en el servicio.

El detalle físico está en `docs/PHYSICAL_DESIGN.md`.
