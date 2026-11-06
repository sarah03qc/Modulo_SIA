# Contratos transaccionales

El motor garantiza cada sentencia y cada transacción que el servicio confirma o revierte. No garantiza un flujo de varias sentencias si el servicio hace `COMMIT` en el medio. Los protocolos de abajo son una sola transacción.

Aislamiento: `READ COMMITTED`. Los bloqueos se piden con `UPDLOCK, HOLDLOCK` y siguen siendo válidos si la base usa `READ_COMMITTED_SNAPSHOT`. No se usa `MERGE` ni `SERIALIZABLE` de sesión.

## Orden de bloqueos

1. `vinculo_persona` por `per_id_persona`. Si hay varias personas, se bloquean todas al inicio, ordenadas por el identificador.
2. `caso_ai` por `caso_id`, solo cuando la operación ya tiene ese caso. Varios casos, por `caso_id` ascendente.
3. `ref_posible` por `posible_id`, solo al gestionar una sugerencia.
4. Hijos. El borrador, si se borra en la misma transacción, va después.

La lectura al adaptador de SIDINACC termina antes de `BEGIN TRAN`.

Alta del vínculo, dentro del paso 1:

1. `SELECT` de la PK con `UPDLOCK, HOLDLOCK`.
2. Si no hay fila, `INSERT` en la misma transacción.
3. Si aparece 2627 y la transacción sigue activa, repetir el `SELECT`. Si quedó inconclusa, `ROLLBACK` y reintento completo.

Reintento: solo 1205, o un 2627 del vínculo que deje la transacción inconclusa. Máximo tres intentos, contados juntos. No se reintenta el caso activo, el consecutivo duplicado, la valoración vigente duplicada ni una sugerencia ya confirmada. Un consecutivo duplicado no se sustituye por otro número.

## Qué impone el motor y qué impone el servicio

| Invariante | Motor | Servicio |
| --- | --- | --- |
| Un caso activo por persona | `UX_caso_activo` | Bloqueo del vínculo y mensaje fijo, sin datos del otro expediente |
| Consecutivo único y canónico | `UX_ref_referencia_consecutivo` y `CK_ref_referencia_consecutivo` | Recorte, mayúsculas y correspondencia del establecimiento (RF-115) |
| Prioridad de RN-009 | FK de cuatro columnas | Calcula el código. El usuario no lo envía |
| `Ninguno` sin factores | FK del factor hacia respuesta `FACTORES` | Exige las categorías `es_requerida` al confirmar |
| Persona de la atención, la grupal y la programación | FK compuesta. `caso_id` nulo no la dispara | Exige caso activo dentro del ámbito al dar de alta |
| Cierre completo | `CHECK`, PK de `caso_cierre` y FK al historial | `ops.cerrar_caso` en una sola transacción |
| Caso activo con fila de cierre ya confirmada | No lo impide el `CHECK` | Sin `COMMIT` intermedio. El rol no inserta `caso_cierre`. Lo ve la conciliación |
| Ámbito autorizado | No hay RLS | Predicado del servicio. No hay tabla de asignaciones |
| Cinco a doce visualizaciones | No hay `CHECK` de conteo | La transacción del informe |

## 1. Envío de referencia

1. `BEGIN TRAN` y bloqueo del vínculo.
2. Si existe un caso `ACTIVO` de esa persona, `ROLLBACK` y el mensaje fijo. No se leen columnas del otro caso.
3. Validar el consecutivo ya digitado. No se genera ni se reserva.
4. Insertar la referencia en `PENDIENTE_REVISION`, el contexto y los motivos.
5. Borrar el borrador del autor, si aplica.
6. `COMMIT`.

Dos pendientes de la misma persona pueden confirmarse si el consecutivo canónico es distinto. El duplicado devuelve 2601. El servicio lo informa como consecutivo ya registrado y no propone otro.

## 2. Apertura de caso

La valoración confirmada ya existe con `caso_id` nulo. SQL Server comprueba cada sentencia al terminarla; esta secuencia cumple las FK y el `CHECK` sin diferir constraints hasta el `COMMIT`:

1. Bloqueo del vínculo y comprobación de que no hay activo.
2. `INSERT` de `caso_ai` en `ACTIVO`, con `valoracion_vigente_id` informado, `plan_vigente_id` nulo y `cierre_caso_id` nulo.
3. `INSERT` del plan, de al menos un propósito y de las estrategias y disciplinas.
4. `UPDATE` solo de `plan_vigente_id`.
5. `UPDATE` de `ses_valoracion.caso_id` donde todavía es nulo.
6. `UPDATE` de la referencia a `ADMITIDA_AI`, solo la columna `estado`.
7. `INSERT` del historial `ACTIVO`.
8. `COMMIT`.

No se inserta una segunda valoración. No se abre un caso por una posible referencia sin este flujo. `valoracion_vigente_id` sigue siendo `NOT NULL`: la valoración nace antes que el caso.

## 3. Revaloración

1. Bloquear vínculo y caso. Volver a leer la vigente con el caso ya bloqueado.
2. Poner `es_vigente = 0` en la anterior.
3. Insertar la nueva con el `numero` siguiente, `es_vigente = 1`, `caso_id` conocido y una tupla que exista en la matriz de su versión.
4. Actualizar solo `valoracion_vigente_id`.
5. Si cambia el abordaje, apagar el plan vigente, insertar otra versión y mover `plan_vigente_id`.
6. No modificar factores, riesgo, protección, prioridad ni responsable de una valoración ya confirmada.

Si el orden se invierte, el índice filtrado responde 2601. Ese 2601 no se reintenta.

## 4. Cierre

La única vía del rol de aplicación es `ops.cerrar_caso`. El servicio abre la transacción, comprueba el ámbito y llama al procedimiento. El procedimiento no confirma si ya hay una transacción externa.

1. Bloquea el vínculo y después el caso.
2. Exige `ACTIVO` y `cierre_caso_id` nulo. Si no, error `52103`, sin texto clínico.
3. Lee el ítem `MOTIVO_CIERRE`.
4. Inserta historial `CERRADO`.
5. Inserta `caso_cierre`.
6. Un solo `UPDATE` escribe `estado = CERRADO` y `cierre_caso_id = caso_id`.
7. El servicio inserta `aud_evento` con el código `CIERRE`, sin la explicación, y confirma.

No inserta otro caso, no copia valoración ni plan y no crea continuidad. El traslado es un motivo de cierre. Una referencia posterior en el destino usa el contrato de envío cuando ya no hay activo.

## 5. Posible referencia

1. Bloquear el vínculo y la fila de la sugerencia.
2. Si el estado ya no es `PENDIENTE`, revertir antes de insertar la referencia.
3. Ejecutar el envío de referencia.
4. `UPDATE` condicionado por `posible_id`, `fila_version` y `estado = PENDIENTE`.
5. Si no afecta filas, `ROLLBACK`. No queda una segunda referencia confirmada.

## 6. Atención

Individual: bloquear el caso, exigir `ACTIVO` en esa transacción e insertar con la persona del caso. La FK no exige `ACTIVO`, para que el cierre no invalide la atención ya guardada.

Grupal: bloquear todas las personas ordenadas, resolver el caso activo solo dentro del ámbito, bloquear esos casos, comprobar que siguen activos e insertar cabecera y participantes. `caso_id` nulo no crea caso. El rol no actualiza `caso_id` después del alta.

## 7. Programación

Crear la actividad y la primera fila de `prog_cambio` en la misma transacción. Reprogramar actualiza `fecha_vigente`, `estado` y `motivo_vigente` de la misma fila y agrega otro cambio. No se crea otra actividad. `REALIZADA` no inserta atención. Vencida es `PROGRAMADA` con `fecha_vigente` anterior a la fecha de consulta; no es un valor de `estado`.

## Errores

| Situación | Efecto |
| --- | --- |
| Caso activo al referir o abrir | Reversión. Mensaje fijo. Sin reintento |
| Consecutivo duplicado | 2601. Sin otro número y sin reintento |
| Cierre de un caso que ya no está activo | `52103` y reversión |
| Otro sin explicación, o destino fuera de traslado | 547 y reversión |
| Segundo cierre | 2627 y reversión |
| Interbloqueo 1205 | Reversión y reintento completo, máximo tres |
| Caída antes de `COMMIT` | La transacción no confirmada se revierte con el registro |

No hay reparación automática de hechos clínicos.
