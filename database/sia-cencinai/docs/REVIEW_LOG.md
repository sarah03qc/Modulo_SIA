# Registro de revisión del diseño físico

Revisión estática. Ningún archivo SQL se ejecutó. `database/sidinacc-local` no se modificó.

## Quién revisó

| Revisión | Resultado | Límite |
| --- | --- | --- |
| Skill `review-sql-server-schema` | `APPROVED` en `SQL_SERVER_SCHEMA_REVIEW.md` | Estática. Sintaxis contra el motor: `NOT_RUN` |
| A-09 code-reviewer | `APPROVED` en el conjunto y otra vez en el delta de permisos, índice de instrumento y pruebas 2627/230 | No ejecutó SQL |
| A-07 security-privacy | Los dos hallazgos medios de `GRANT` quedaron cerrados. El borrador por autor sigue en el servicio | No ejecutó SQL |
| A-02 solution-architecture | Las nueve decisiones del modelo seleccionado se conservan | No propuso otra arquitectura |
| A-06 integration | Frontera con `SIDINACC_LOCAL` limpia. Llave UTIC y mapa de región siguen abiertos | No tocó la réplica |
| A-08 QA | Las aserciones de `030` coinciden con el error que dispararía la semilla. Todo runtime es `NOT_RUN` | No marcó pruebas como aprobadas |
| A-01 requirements-traceability | Consecutivo manual, caso activo, RN-009, cierre, grupal y ausencia de caso sucesor corresponden a v0.7. RN-040 sigue provisional | No inventó requisitos |
| `scripts/validate-agent-infrastructure.ps1` | PASS de infraestructura de agentes | Compilación de producto y SQL: `NOT_RUN` |

El diseño lo escribió esta sesión de orquestación. A-05 no fue un proceso aparte. La revisión de A-09 sí fue un agente distinto y no redactó los scripts.

## Correcciones hechas por los hallazgos

- `GRANT` por columna para Regional y Nacional en referencia, motivo e informe.
- Se quitó el índice que obligaba una sola versión vigente del instrumento.
- El segundo cierre de prueba acepta solo 2627.
- Se añadieron pruebas no ejecutadas de denegación 230.

## Residuos que siguen visibles

- Un caso `ACTIVO` puede convivir con una fila de `caso_cierre` si alguien inserta el cierre fuera de `ops.cerrar_caso`.
- La atención sobre un caso ya cerrado la rechaza el servicio, no una FK.
- La prueba de dos sesiones no se ejecutó y no está aprobada.
- Llave de persona, mapa `region_id`, zona horaria, RN-040 y ámbito grupal siguen `NEEDS_VALIDATION`.
