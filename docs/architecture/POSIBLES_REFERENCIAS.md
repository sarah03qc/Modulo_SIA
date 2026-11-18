# Posibles referencias

HU-049, RF-127, RF-102, RF-021, RN-037 y CU-37.

La sección es independiente de la bandeja de referencias enviadas. Una señal no abre un caso, no envía una referencia, no asigna prioridad RN-009 y no emite un diagnóstico.

## Separación

| Pieza | Responsabilidad |
| --- | --- |
| `lector-evaluaciones.js` | Lee `CAF_EVALUACION_MENOR` del período por el adaptador de `SIDINACC_LOCAL`. No clasifica. |
| `interprete-nutricional.js` | Traduce un código a una clasificación, o declara que no puede. |
| `reglas-nutricion.js` | Decide si las clasificaciones ya interpretadas forman una candidata. |
| `conciliacion-posible.js` | Contrasta la candidata con caso activo, sugerencia y referencia ya vinculada. |
| `repositorio-posibles.js` | Guarda y consulta `dbo.ref_posible`. |
| `PosiblesReferenciasPagina.jsx` | Lista, filtra y abre el formulario. No envía. |

La réplica se consulta en solo lectura. No se recalculan puntajes Z ni se usan peso y talla. No hay relación inventada con `CAF_INDICADOR_ANTROPOMETRICO`. La ubicación sale del detalle familiar vigente del período, no del establecimiento histórico.

## Mapeos

| Mapeo | Estado | Efecto |
| --- | --- | --- |
| `MOCK-1` | `SINTETICO` | Código 9: señal de demostración. Código 1: normal. Otro código, incluido 0: desconocido. |
| `INSTITUCIONAL-0` | `NO_VALIDADO` | No clasifica. El modo institucional responde `CODIGOS_NO_VALIDADOS` y no crea sugerencias. |

El modo de arranque es `SINTETICO`. `POSIBLES_MODO=INSTITUCIONAL` no activa equivalencias clínicas mientras el mapeo siga sin validar. Un código desconocido no se trata como normal ni como alteración.

## Reglas

Sobre clasificaciones, no sobre el `tinyint`:

- Peso para la edad, menor de cinco años: peso alto, bajo peso, bajo peso severo.
- Peso para la talla, menor de cinco años: desnutrición, desnutrición severa, sobrepeso, obesidad.
- Talla para la edad: baja talla y baja talla severa. Alto y muy alto no se tratan como malnutrición.
- IMC para la edad, desde los cinco años cumplidos: desnutrición, desnutrición severa, sobrepeso, obesidad.

Varias alteraciones de la misma evaluación producen una sola candidata. La señal de demostración usa el criterio `NUTRICION_DEMO` y se muestra como demostración, no como diagnóstico. La edad se calcula con la fecha de nacimiento y la fecha de evaluación. Si la edad no se puede calcular, una clasificación clínica no genera sugerencia.

Solo entra la evaluación no eliminada más reciente del período. Una anterior queda fuera de la bandeja pendiente. El borrado lógico no se interpreta.

## Elegibilidad

No se guarda sugerencia si la persona tiene un caso activo en cualquier ámbito. La respuesta no incluye datos de ese caso. Tampoco se duplica una pendiente con el mismo criterio, establecimiento y evaluación. Si ya hay una pendiente de otra evaluación, o una sugerencia del mismo criterio ya vinculada a una referencia, no se crea otra. Esa recurrencia queda pendiente de confirmación funcional. La segunda ejecución es idempotente: el índice único de `ref_posible` también rechaza el duplicado concurrente.

Al confirmar la referencia, el mismo envío actualiza la sugerencia a `REFERENCIA_CREADA` si sigue pendiente, corresponde a la persona y al establecimiento. Si dos confirmaciones coinciden, solo una vincula la fila.

## Ejecución

`POST /api/posibles-referencias/deteccion` la ejecuta quien puede crear referencias en Establecimiento u Oficina Local, y solo dentro de su ámbito. No arranca al iniciar la API. La programación cada 24 horas solo se habilita con `POSIBLES_DETECCION_AUTOMATICA=1`. La última corrida queda en `aud_evento`, acción `DETECCION`, sin identificadores de persona. El código resume conteos.

## API

Prefijo `/api/posibles-referencias`. Exige `referral.read` para consultar y `referral.create` para detectar. Región y Nacional no entran. ASC2 y ASC3 usan las mismas capacidades de Establecimiento ya concedidas; no hay un rol paralelo.

La cuenta `sia_cencinai_app` necesita el permiso estrecho de `database/sia-cencinai/security/080_grant_posible_referencia_to_app.sql`: lectura e inserción de `ref_posible`, y actualización solo de `estado` y `referencia_id`. No es una migración.

| Método y ruta | Efecto |
| --- | --- |
| `GET /` | Listado paginado, con búsqueda, fecha, establecimiento, criterio y estado |
| `GET /:posibleId` | Detalle del ámbito, o el mismo vacío que una fila ajena |
| `GET /configuracion` | Modo, mapeos y si la programación está activa |
| `GET /ultima-ejecucion` | Última corrida registrada |
| `POST /deteccion` | Corrida manual. No envía referencias |

`Crear referencia` abre el formulario con la persona. El envío existente de `/api/references` acepta `posibleId` y vincula la sugerencia en la misma transacción.

Inicio de Establecimiento y Oficina Local cuenta las pendientes del ámbito y enlaza la sección.

## Pendiente de UTIC y de criterio funcional

- Si `EVM_estadoNutricionalPe`, `Pt`, `Te` e `Imc` guardan `ANT_id` global o un código relativo.
- Cómo se representa un indicador no aplicable.
- Contrato y permisos de lectura de evaluaciones en el CAH institucional.
- Vigencia institucional de una evaluación histórica.
- Si una alerta debe reaparecer después de una referencia equivalente ya gestionada, incluida una referencia creada a mano.
