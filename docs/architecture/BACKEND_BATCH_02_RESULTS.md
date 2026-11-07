# Lote backend 02 — resultado

Fecha de verificación: 2026-11-06.

Veredicto: `BACKEND_BATCH_02_PASS_WITH_NOTES`.

El envío, la consulta, la plantilla, el detalle y el documento imprimible funcionan sobre el esquema ya desplegado. No hay migración nueva. El `GRANT` mínimo quedó aplicado en el SQL Server local. Quedan notas donde el catálogo o el diseño físico no permiten cerrar un criterio sin inventar una regla.

## Alcance

| HU | CU | Estado del lote |
| --- | --- | --- |
| HU-013 | CU-04 | Implementada, con notas en factores de riesgo, nombre/sexo histórico y etapas visuales |
| HU-014 | CU-05 | Implementada sobre la propuesta de diseño validada. El libro es técnico, no el formulario gráfico definitivo |
| HU-015 | CU-06 | Implementada para Establecimiento y, con el mismo contrato, para Oficina Local |
| HU-016 | CU-06 | Implementada. Nombre y sexo se leen de la réplica actual porque `ref_contexto` no los guarda |
| HU-017 | CU-06 | Implementada con HTML neutro. El diseño documental sigue pendiente |

No se implementaron sesiones, valoración, admisión ni apertura de caso. HU-018 queda fuera: la consulta de Oficina Local usa el mismo listado, pero no hay resolución de la referencia.

## Matriz

| HU | Criterio | Implementación | Prueba | Estado |
| --- | --- | --- | --- | --- |
| HU-013 | CA-01 búsqueda de persona | Reutiliza `GET /api/institutional/persons/search` | Lote 01 | PASS |
| HU-013 | CA-02 ámbito | `resolveTerritorialScope` antes de leer la réplica | `reference-service`, `reference-live` | PASS |
| HU-013 | CA-03 reutilizar datos | `reference-snapshot.js` | `reference-service` | PASS |
| HU-013 | CA-04 rol autorizado | `referral.create` en Establecimiento y Oficina Local | `authorization-model`, `reference-http` | PASS |
| HU-013 | CA-05 fecha | `fecha_referencia` | `reference-service`, `reference-live` | PASS |
| HU-013 | CA-06 Vía de Atención | Catálogo `VIA_ATENCION` | `reference-service` | PASS |
| HU-013 | CA-07 origen | Catálogo `ORIGEN_REFERENCIA` | `reference-service` | PASS |
| HU-013 | CA-08 responsable de sesión | `principalId` del servidor | `reference-service`, `reference-live` | PASS |
| HU-013 | CA-09 responsable no editable | El cuerpo no puede sustituirlo | `reference-service`, `reference-http` | PASS |
| HU-013 | CA-10 a CA-12 motivos confirmados | Ítems vigentes de crecimiento, desarrollo y salud | `reference-rules`, `reference-service` (`listCatalogs` y orígenes) | PASS |
| HU-013 | CA-13 factores de riesgo | El catálogo vigente no trae esos ítems. Respuesta `NEEDS_VALIDATION` | `reference-rules`, `reference-service` | PARTIAL |
| HU-013 | CA-14 a CA-16 motivos y especificaciones | Varios motivos. Una especificación no seleccionada no se guarda | `reference-rules`, `reference-service` (texto leído al insertar y plantilla huérfana), `reference-live` | PASS |
| HU-013 | CA-17 a CA-19 textos diferenciados | Tres columnas | `reference-service`, `reference-live` | PASS |
| HU-013 | CA-20 etapas | Contrato `stages` en la validación. Sin navegación visual | `reference-service` | PARTIAL |
| HU-013 | CA-21 foco de interfaz | Pantalla. Este lote no tiene frontend | — | NOT_APPLICABLE_CURRENT_SCOPE |
| HU-013 | CA-22 persona obligatoria | Sin persona en ámbito no hay envío | `reference-service` | PASS |
| HU-013 | CA-23 y CA-24 revisión | Objeto `review` con persona, territorio, servicios y responsable en solo lectura | `reference-service` | PASS |
| HU-013 | CA-25 consecutivo digitado | `canonicalizeConsecutive`. No se genera ni se correlaciona | `reference-rules` | PASS |
| HU-013 | CA-26 establecimiento de la persona | Segmento comparado con la persona, no con quien registra | `reference-rules` | PASS |
| HU-013 | CA-27 contexto histórico | `ref_contexto`. Nombre y sexo no tienen columna | `reference-live` | PARTIAL |
| HU-013 | CA-28 a CA-30 envío | Transacción, `PENDIENTE_REVISION`, fecha y responsable del servidor. Un motivo inválido no deja referencia ni contexto | `reference-live` | PASS |
| HU-013 | CA-31 caso activo | Error 52110 y mensaje fijo. Una pendiente no bloquea | `reference-service`, `reference-live` | PASS |
| HU-014 | CA-01 a CA-05 plantilla | Descarga, lectura, estructura, precarga, corrección posterior y rechazo de especificación huérfana | `reference-service`, `reference-http` | PASS |
| HU-014 | CA-06 responsable | La plantilla no tiene columna de responsable | `reference-service` | PASS |
| HU-014 | CA-07 a CA-09 mismas reglas | `submitReferral` único. La precarga con caso activo no inserta ni reserva consecutivo | `reference-service` | PASS |
| HU-015 | CA-01 a CA-05 consulta | SQL con ámbito, nombre resuelto a identificadores, identificación, consecutivo, estado, vía, origen, categoría, total y `OFFSET` | `reference-live`, `reference-rules`, `reference-service` | PASS |
| HU-016 | CA-01 a CA-06 y CA-08 detalle | Histórico guardado, motivos, especificaciones, tres textos, fecha, origen, responsable y envío | `reference-service`, `reference-live` | PASS |
| HU-016 | CA-02 nombre y sexo | Lectura actual marcada `CURRENT_INSTITUTIONAL` o `UNAVAILABLE` | `reference-service` | PARTIAL |
| HU-016 | CA-07 ámbito | Fuera de ámbito responde 404, el mismo texto que si no existe | `reference-live` | PASS |
| HU-017 | CA-01 a CA-06 y CA-08 a CA-09 documento | HTML con identificación, territorio, vía, origen, motivos, especificaciones y los tres textos. La impresión no cambia el envío | `reference-document`, `reference-service`, `reference-live` | PASS |
| HU-017 | CA-03 nombre y sexo | Misma limitación de columnas que HU-016 | `reference-document` | PARTIAL |
| HU-017 | CA-07 diseño institucional | No hay plantilla visual aprobada. Salida neutra, sin logotipo | `reference-document` | PASS |

## Permisos SQL

Aplicado en local: `database/sia-cencinai/security/020_grant_reference_writes_to_app.sql`.

`sia_cencinai_app` sigue fuera de `db_owner`, `db_datawriter` y `rol_aplicacion`. Puede insertar y leer las tablas de referencia, el vínculo, el borrador, la auditoría y los dos catálogos. No puede actualizar ni borrar `ref_referencia`, ni leer `caso_ai` o `ses_valoracion`. El caso activo se consulta por `caso_lista_establecimiento`.

La sonda de `/ready` sigue en `readOnly: true` porque mide el `INSERT` de la base, no el de estos objetos.

## Integridad

La prueba viva insertó una referencia de sonda sobre `SYN-1100102-05`, comprobó el choque concurrente del mismo consecutivo, imprimió el documento y confirmó que `sentAt` no cambió. `database/sia-cencinai/security/021_cleanup_reference_probe.sql` borra solo esos consecutivos de sonda y los borradores de prueba de esas identidades sintéticas. No modifica la población sintética compartida.

La auditoría del envío y de la impresión se escribió y se eliminó con esa limpieza. El actor guardado es la identidad sintética del servidor, marcada `ID:SINTETICA`. No representa una sesión productiva de SIDINACC.

## Dependencia

`exceljs` 4.4.0, licencia MIT, solo en la API. Justificación en `DEPENDENCY_DECISIONS.md`.

## Pendientes

| Tema | Estado | Cierre |
| --- | --- | --- |
| Ítems de factor de riesgo por ámbito | `NEEDS_VALIDATION` | Publicar los códigos en `MOTIVO_REFERENCIA` cuando la fuente los confirme |
| Nombre y sexo históricos | Propuesta no ejecutada | Migración que agregue esas columnas a `ref_contexto`, si se aprueba |
| Diseño gráfico de HU-014 y HU-017 | Propuesta / diseño por refinar | Sustituir el libro técnico y el HTML neutro cuando exista la plantilla aprobada |
| Borrador visible para otra persona de la misma oficina | `NEEDS_VALIDATION` | Hoy solo lo lee el autor |
| Sesión productiva SIDINACC | `NEEDS_VALIDATION` | UTIC. Este lote no la inventa |
| Zona horaria institucional | `NEEDS_VALIDATION` | El instante guardado es UTC del motor |

## Verificación

Corrida de cierre, 2026-11-06, desde la raíz del repositorio. Los cuatro comandos terminaron con código 0.

| Comando | Resultado |
| --- | --- |
| `npm run verify:config` | `status: ok`. `nodeEnv=development`, API `127.0.0.1:3001`, `SIA_CENCINAI` y `SIDINACC_LOCAL` con usuarios distintos, periodo 2026 |
| `npm test` | API: 14 suites, 101 pruebas. Web: 2 suites, 8 pruebas. Sin `--forceExit`. La corrida posterior al ajuste de evidencias de QA repitió ese resultado |
| `npm run lint` | ESLint sin errores |
| `npm run build` | Vite del workspace web, sin cambios de fuente en `apps/web` |

Arranque real de la API, misma configuración, proceso cerrado al terminar la comprobación:

| Comprobación | Resultado |
| --- | --- |
| `GET /health` | 200, `status=ok`, servicio `sia-cencinai-api` |
| `GET /ready` | 200, `ready`. SIA `up` sobre `SIA_CENCINAI`. SIDINACC `up` y `readOnly: true` |
| `GET /api/references` sin identidad | 401 |
| `GET /api/references` con `dev-establecimiento-unico` | 200 |
| `GET /api/references/catalogs` con la misma identidad | 200 |

La sonda de solo lectura de `/ready` mide el `INSERT` a nivel de base. Sigue denegado. Los `GRANT` de este lote son por objeto.

## Integridad medida después de las pruebas

Consulta con `sia_cencinai_app`, sin imprimir credenciales:

| Medida | Valor |
| --- | --- |
| Referencias de sonda `REF-890-2026` y `REF-891-2026` | 0 |
| Consecutivos sintéticos `REF-001-2026`, `REF-005-2026` y `REF-007-2024` | 3 |
| Borradores de sonda de esas identidades de desarrollo | 0 |
| Caso activo de `SYN-1100102-01` | 1 |
| `INSERT` en `ref_referencia` | concedido |
| `UPDATE` y `DELETE` en `ref_referencia` | denegados |
| `db_owner`, `db_datawriter`, `rol_aplicacion` | no pertenece |

No hay migración nueva. El frontend de `apps/web` no tiene cambios de fuente.

## Revisión independiente

| Revisión | Resultado |
| --- | --- |
| Arquitectura | Encaja. Node, Express y JavaScript. Capacidades `referral.*`. La confirmación de plantilla reutiliza `submitReferral`. `exceljs` 4.4.0 queda aislado en la plantilla. Sin archivos modificados por la revisión |
| Datos | El esquema vigente alcanza. Los `GRANT` no incluyen `db_owner`, `db_datawriter` ni `UPDATE` de `ref_referencia`. La transacción bloquea el vínculo, rechaza el caso activo con 52110 y no asigna otro consecutivo. La limpieza 021 no alcanza los consecutivos sintéticos. Sin archivos modificados |
| QA | La primera lectura marcó filas PASS cuya prueba no fijaba el criterio. Esas comprobaciones quedaron en las pruebas de reglas, servicio, HTTP y la prueba viva: filtros y página, textos diferenciados, especificaciones, orígenes, revisión, descarga y corrección de plantilla, caso activo en precarga, campos del documento y reversión cuando falla el motivo. La suite de referencias volvió a pasar, 31 pruebas |
| Seguridad | No bloquea. Autorización, SQL parametrizado, `GRANT` mínimos, escape del documento y la marca `ID:SINTETICA` se sostienen. Queda en nota la detección incompleta de hipervínculos dentro del ZIP comprimido; el lector rechaza `xl/activeX`, fórmulas y celdas con enlace |
| Código | No bloquea `PASS_WITH_NOTES`. Se corrigieron dos hallazgos: el envío ya no borra un borrador de otra persona del mismo autor, y `withTransaction` aplica el filtro de solo lectura del cliente institucional |

## Compuertas

| Compuerta | Resultado |
| --- | --- |
| Lista para desarrollo | PASS. HU-013 a HU-017, CU-04 a CU-06 y los RF citados en el módulo están localizados. Factores de riesgo, nombre/sexo histórico y diseño documental quedan `NEEDS_VALIDATION` |
| Implementación completa | PASS con notas. Compilación, lint, pruebas, permisos positivos y negativos, auditoría de envío e impresión, y ausencia de migración. Las notas de la matriz no se documentan como cerradas |
| Lista para revisión humana | PASS con notas en lo ya revisado. Arquitectura y datos no bloquearon. La aceptación institucional sigue siendo humana. El validador de infraestructura de agentes pasó (`rules=10`, `agents=11`, `skills=15`) y no ejecuta el producto |
