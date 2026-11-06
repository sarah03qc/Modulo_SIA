# Plan de pruebas SQL

Ninguna de estas pruebas se ejecutó al preparar el diseño. Un archivo que exige dos sesiones no queda aprobado por lectura.

Todas traen un interruptor en 0. Hay que ponerlo en 1 en una instancia aislada. La sintética, además, no debe correr fuera de desarrollo.

## Orden

1. Migraciones `001` a `090`.
2. `tests/010_schema_validation.sql`. No necesita semilla.
3. Semilla confirmada y semilla sintética.
4. `tests/020_integrity_positive.sql`.
5. `tests/030_integrity_negative.sql`.
6. `tests/040_transaction_tests.sql`.
7. `tests/050_reporting_tests.sql`.
8. `queries/020_reconciliation.sql` debe devolver cero filas.
9. En una copia desechable, `tests/060_concurrency_session_a.sql` y, durante su espera, `tests/061_concurrency_session_b.sql` en otra ventana.

`050` espera los conteos de la semilla. `060` inserta `REF-900-2026` y cambia esos conteos. Por eso va al final y en otra copia.

## Resultado esperado

| Prueba | Esperado | Evidencia en esta etapa |
| --- | --- | --- |
| 010 | 46 tablas de dominio, vista, procedimiento, sin `CAF_`/`RCS_` y sin cascada | No ejecutada |
| 020 | Dos referencias históricas, un activo, dos cerrados, traslado sin sucesor, revaloración, grupal con y sin caso, reprogramación, informe | No ejecutada |
| 030 | 2601 en consecutivo y en segundo activo; 547 en formato, FK cruzada, catálogo, prioridad, Otro y destino; 2627 en segundo cierre; 229 al insertar cierre con el rol de aplicación; 230 al actualizar `estado` y al leer `clave_archivo` o `acciones_previas` como regional | No ejecutada |
| 030, nota final | El `CHECK` no impide un `ACTIVO` con fila de cierre; la conciliación sí lo ve, y la transacción se revierte | No ejecutada. No es un fallo escondido |
| 040 | Rollback de envío, de `ops.cerrar_caso` y de revaloración inválida | Una sola sesión. No simula una caída del proceso |
| 050 | Oficina 101: D=2, N=1. Nacional: D=3, N=2. Una grupal, dos individuales, un caso sin atención, una vencida | No ejecutada |
| 060 + 061 | Una sesión confirma `REF-900-2026`. La otra recibe 2601 y no propone otro número | No ejecutada. Un 2601 sin solapamiento solo prueba el índice |

## Concurrencia que estos dos archivos no cubren solos

El mismo método, en dos ventanas y sobre una persona sin caso activo, cubre la apertura simultánea: cada sesión crea su referencia con un consecutivo distinto, bloquea el vínculo y trata de insertar `ACTIVO`. Una confirma. La otra espera y luego recibe 2601 de `UX_caso_activo`, o ve el activo y revierte con el mensaje de negocio si el servicio hace esa lectura.

Cierre concurrente: las dos llaman a `ops.cerrar_caso` sobre el mismo caso. La segunda observa `CERRADO` (`52103`) o choca con la PK. Revaloración concurrente: cada una lee la vigente ya con el caso bloqueado. Dos gestiones de la misma posible referencia: el `UPDATE` condicionado por `fila_version` y estado `PENDIENTE` deja una sola referencia.

Esas cuatro no están escritas como un segundo par de archivos para no duplicar el expediente sintético de forma automática. No se declaran aprobadas.

## Datos

Hacen falta las semillas. Los identificadores son `SYN-1100102-0n` y `SYN-5010104-01`, compatibles con el formato de la réplica local. No hay nombres reales ni texto clínico. Las disciplinas `SYN_*` y el criterio `SYN_CRITERIO_TAMIZAJE` son exclusivos del entorno sintético.
