# Endurecimiento de la arquitectura seleccionada

**Fecha:** 2026-11-03
**Objeto:** propuesta A ya seleccionada, en `DATABASE_DESIGN_SELECTED.md`.
**No es:** otra arquitectura, una comparación A/B/C, DDL, una base creada ni aceptación institucional.
**Estado del diseño:** PROPUESTO.
**Corrección 2026-11-05:** Alina confirmó que el consecutivo se digita. Se retiró de este texto la fila de control que solo incrementaba la serie. Las demás decisiones de esta pasada se conservan.

## 1. Método

Se leyeron el diseño seleccionado, su revisión, los dominios, el inventario, la evaluación, la especificación y los casos de uso v0.7, y el contrato de la réplica en el punto de autorización. Se aplicaron como criterio `review-sql-server-schema`, `design-database-architecture` (sin generar alternativas), `verify-traceability` y `evolve-data-model`. No hay migración que ejecutar: la base de producto no existe y no se tocó `SIDINACC_LOCAL`.

Revisiones de solo lectura, antes de editar:

| Rol | Resultado usado |
| --- | --- |
| A-05 Data | Confirmó la FK compuesta y quitar la caché. Ajustó el cierre y el `INSERT` del vínculo |
| A-02 Arquitectura | Confirmó el orden de bloqueos y que quitar la caché es interno a la propuesta A |
| A-07 Seguridad | Exigió que el rol de aplicación no tenga `UPDATE` de tabla sobre el estado. El enlace grupal fuera de ámbito queda abierto |
| A-01 Trazabilidad | Confirmó cierre, prioridad, programación y el alta contra el caso activo. Dejó abierto el participante sin caso y RN-040 |

No se ejecutó SQL. Las constraints de este documento no están probadas en un motor.

## 2. Hallazgo 1 — Participante grupal

**Decisión:** FK (`caso_id`, `per_id_persona`) hacia la única (`caso_id`, `per_id_persona`) de `caso_ai`. `caso_id` sigue anulable. `per_id_persona` sigue no nulo y con FK a `vinculo_persona`. La misma FK se aplica a `prog_persona`.

SQL Server solo implementa `MATCH SIMPLE`. Con `caso_id` nulo no comprueba la FK compuesta, así que un participante sin caso sigue siendo válido. Con `caso_id` informado, el caso tiene que ser de esa persona. `ON DELETE` y `ON UPDATE` quedan en `NO ACTION`. El destino no es el índice filtrado `UX_caso_activo`: una FK no apunta a un filtro, y la participación tiene que sobrevivir al cierre.

En el alta, la transacción solo enlaza el caso `ACTIVO` que está dentro del ámbito del actor. No enlaza un caso cerrado ni el caso de otra persona. Si no hay activo en el ámbito, `caso_id` queda nulo y no se crea caso. El identificador de un activo fuera de ámbito no se copia. Qué actividades admiten ese nulo sigue NEEDS_VALIDATION (HU-037 CA-09, 17.8). La columna no impide al participante legítimo sin caso.

## 3. Hallazgo 2 — Cierre

**Decisión:** se conserva `caso_cierre`. Se añade `caso_ai.cierre_caso_id` y este `CHECK`:

```text
(estado = ACTIVO AND cierre_caso_id IS NULL)
OR (estado = CERRADO AND cierre_caso_id = caso_id)
```

El puntero tiene FK a `caso_cierre`. `caso_cierre` tiene FK (`caso_id`, `historial_id`, `historial_estado`) hacia la única (`caso_id`, `historial_id`, `estado`) del historial, con `historial_estado = CERRADO`. La explicación de Otro y la prohibición de destino fuera de `TRASLADO` son `CHECK` locales, copiando `codigo` y `requiere_texto` por FK. Esas copias son no nulas: un nulo dejaría el `CHECK` en desconocido y SQL Server lo aceptaría. `TRASLADO` no exige las cuatro columnas de destino.

SQL Server no difiere constraints. El orden dentro de una sola transacción es: historial `CERRADO`, fila de cierre, un solo `UPDATE` que escribe estado y puntero juntos. No hay trigger. Una vista indexada no puede impedir la fila ausente.

| Invariante | Qué la garantiza |
| --- | --- |
| No hay caso cerrado sin fila de cierre | `CHECK` y FK. Un `COMMIT` en ese estado falla |
| No hay dos cierres | PK de `caso_cierre` |
| No se pierde el evento del cierre que sí se guardó | FK al historial `CERRADO` del mismo caso |
| No hay caso sucesor ni continuidad | La operación no inserta `caso_ai` ni esas columnas |
| Dos cierres concurrentes | Bloqueo del vínculo y después del caso. La PK es el respaldo |
| Fallo o caída antes de `COMMIT` | La transacción revierte entera |
| Caso activo que ya tiene fila de cierre | No lo cubre el `CHECK`. Lo cubren la ausencia de `COMMIT` intermedio, la falta de `INSERT` directo del rol de aplicación y la conciliación |
| Historial `CERRADO` de más | No lo cubre un permiso de `INSERT`. Lo cubre la conciliación |

El rol de aplicación actualiza en `caso_ai` solo los dos punteros de vigente. No actualiza `estado` ni `cierre_caso_id` y no inserta `caso_cierre`. Un procedimiento con encadenamiento de propiedad se salta el permiso de columna: la apertura y la revaloración no nombran esas columnas. Un `UPDATE` de tabla amplio sigue pudiendo saltarse la separación.

## 4. Hallazgo 3 — Prioridad

La regla confirmada es RN-009 y RF-118: la prioridad se calcula, no se elige, y cada valoración la conserva. Riesgo y protección siguen siendo profesionales. La especificación no prohíbe una caché técnica. Se elimina igual, porque no aporta una garantía que el puntero no tenga ya.

| Criterio | Conservar las tres columnas | No almacenarlas |
| --- | --- | --- |
| Integridad | Pueden divergir de la valoración | Una sola copia, en `ses_valoracion` |
| Simplicidad | Escritura extra en apertura y revaloración | El caso solo mueve `valoracion_vigente_id` |
| Bandeja | Filtro por la columna cacheada | Seek por ámbito y estado, lookup por la PK de la valoración |
| Consulta regional y nacional | Igual, con otra copia | Mismo lookup. El volumen de A.I. no es el de vigilancia |
| Revaloración frecuente | Hay que actualizar caché y puntero | Solo la bandera y el puntero |
| Divergencia | Residual conocido | Desaparece |
| Recálculo | La FK de la valoración ya permite recomprobar | Igual, sin segunda cifra |

**Decisión:** no se persisten `riesgo_vigente`, `proteccion_vigente` ni `prioridad_vigente`. `valoracion_vigente_id` es no nulo: la valoración nace antes que el caso. Los índices de ámbito incluyen ese puntero. No se crea una vista materializada.

Una revaloración apaga `es_vigente` de la anterior, inserta otra fila y mueve el puntero. No reescribe la valoración confirmada. La prioridad de la fila nueva entra solo si existe en la matriz de su versión.

## 5. Hallazgo 4 — Concurrencia

El protocolo normativo está en la sección 16 del diseño seleccionado. Lo que cambia respecto del texto anterior:

- No se usa `MERGE`. El vínculo se toma con `SELECT ... UPDLOCK, HOLDLOCK` y, si no existe, `INSERT` en la misma transacción.
- El orden es vínculo, caso, sugerencia, hijos. Varias personas se ordenan por `per_id_persona` antes de tocar un caso. No hay bloqueo de una fila de consecutivo.
- El adaptador se consulta antes del `BEGIN TRAN`.
- El reintento completo, máximo tres, es para el interbloqueo 1205 y para un 2627 que deje la transacción inconclusa. El caso activo y la sugerencia ya confirmada no se reintentan.
- `READ COMMITTED` con hints. Esos hints siguen valiendo si la base usa `READ_COMMITTED_SNAPSHOT`.

| Escenario | Resultado |
| --- | --- |
| Dos referencias de la misma persona | Quedan en serie sobre el vínculo. Si no hay caso activo, las dos pendientes pueden confirmarse |
| Dos aperturas | La segunda espera, ve el activo y recibe el mensaje fijo, sin datos del otro expediente |
| Cierre mientras otra sesión refiere | Quedan en serie sobre el vínculo. Si el cierre confirma primero, la referencia ya no ve activo |
| Dos gestiones de la misma sugerencia | Una confirma. La otra revierte. El único filtrado de `referencia_id` es el respaldo |
| Dos revaloraciones | Quedan en serie. Cada una usa la vigente leída ya con el caso bloqueado |
| Dos cierres | El segundo observa `CERRADO` o choca con la PK |
| Dos envíos del mismo consecutivo digitado | No hay fila de control. El índice único de `consecutivo` rechaza al segundo. No se asigna otro número |

El orden no cubre dos transacciones que bloqueen catálogos distintos después de haber tomado personas distintas. Por eso se conserva el reintento de interbloqueo. `bor_captura`, si se toca en la misma transacción, va después de los hijos.

## 6. Verificación adicional

| Punto | Resultado |
| --- | --- |
| 8.1 Valoración antes y después de abrir | Es la misma fila. Nace con `caso_id` nulo, el caso apunta a ella y después se completa `caso_id` una sola vez. No se clona. Los únicos filtrados impiden dos vigentes de la referencia sin caso y dos vigentes del caso |
| 8.2 Catálogos | Cada uso lleva el código de catálogo y `CHECK` de un solo valor. La FK compuesta es expresable en SQL Server. El ítem opcional va con las dos columnas nulas o las dos informadas |
| 8.3 Instrumento | La respuesta arrastra la versión. El factor no entra en `NINGUNO` ni en una categoría ajena. Las categorías requeridas siguen en la transacción. Cuáles son requeridas: NEEDS_VALIDATION |
| 8.4 Atenciones | Una grupal, muchos participantes, persona única en el KPI por `UNION`. `asistio = 1` es la efectiva. El alta no apunta a un caso cerrado; la fila ya guardada permanece al cerrar. Sin caso, `caso_id` nulo |
| 8.5 Programación | `PROGRAMADA`, `REALIZADA`, `REPROGRAMADA`, `CANCELADA`. Vencida es `PROGRAMADA` con fecha vigente anterior a la consulta. `REALIZADA` no inserta atención |
| 8.6 Informe | Título, responsable, ámbito, corte, filtros, orden, análisis obligatorio y agregados. Sin `per_id_persona` en el agregado. De cinco a doce visualizaciones: regla de transacción, porque un `CHECK` no cuenta hijas |
| 8.7 KPI | D cuenta personas distintas con caso activo ahora. N son esas personas con atención efectiva del año ligada a ese caso. El nacional usa la misma consulta, sin promediar porcentajes. RN-040 sigue provisional |
| 8.8 Ámbito | Predicado de servicio. La vista de Establecimiento no filtra filas ni muestra riesgo, protección ni cierre. No hay tabla de establecimientos autorizados |

## 7. Clasificación

### A. Cerrado en esta pasada

FK compuesta de participante y de persona programada. `CHECK` y puntero de cierre. FK del cierre al historial del mismo caso. `CHECK` de Otro y de destino. Eliminación de la caché de prioridad. Índices de bandeja con el puntero. Orden de bloqueos. Alta del vínculo sin `MERGE`. FK del factor a su categoría y de la respuesta a su versión. `DISTINCT` del denominador. Permiso de columna del estado.

### B. Institucional, abierto, sin cambiar la forma del esquema

Llave definitiva `PER_idPersona` o `RCS_idPersona`. Catálogos no escritos en v0.7. Equivalencia de posibles referencias. Permisos finos de Regional, Nacional y documentos. Formato y retención del informe. Ratificación de RN-040 con Alina. Fuente técnica de EDIN II y EVADE. Qué actividades grupales admiten participante sin caso. Si un activo fuera del ámbito del actor debe enlazarse (`NV-GRUPAL-AMBITO`). Mecanismo real de establecimientos autorizados. Motor de producto todavía no aprobado en `sources-and-validation.md`.

La representación es reversible: columnas de interoperabilidad, ítems versionados, `caso_id` anulable, `id_externo` nulo y predicado de ámbito sin tabla paralela.

### C. Bloqueos para describir el esquema

Ninguno. Los puntos de la sección B no impiden una estructura coherente. Impiden sembrar catálogos no escritos, ejecutar la base en producción y dar por ratificado el KPI.

## 8. Riesgo residual que permanece

- Caso `ACTIVO` con fila de cierre confirmada por una sesión que no usa la operación.
- Historial `CERRADO` no referenciado.
- Alta de atención sobre un caso ya cerrado, rechazada por la transacción y no por la FK.
- Participación grupal invisible para un expediente de otro ámbito mientras `NV-GRUPAL-AMBITO` siga abierto.
- Rol de base con escritura amplia.
- Agregado pequeño reidentificable, sin umbral inventado.
- Esta revisión no ejecutó las constraints.

## 9. Quality gates de esta pasada

| Gate | Resultado |
| --- | --- |
| Infraestructura de agentes | PASS del script `scripts/validate-agent-infrastructure.ps1`: 7 reglas, 11 agentes, 15 skills. NOT_RUN el descubrimiento de runtime de Cursor. El script no aprueba un gate de producto |
| Compilación, lint y pruebas de producto | NOT_APPLICABLE. No hay aplicación ni DDL de este diseño |
| SQL de las constraints | NOT_RUN. No se creó base ni se ejecutó una sentencia |
| Trazabilidad HU → RF → CU → diseño | Cubierta hasta el diseño para el núcleo ya inventariado. No llega a código ni a pruebas |
| Seguridad | A-07 revisó las medidas antes de editarlas. Los permisos de runtime no están ejercidos |
| Revisión independiente del texto ya editado | A-09 pidió alinear la cardinalidad del puntero vigente. Tras el ajuste, la relectura cerró en `APPROVED`. No se reabrieron participante, cierre, caché ni bloqueos |
| Sintaxis Mermaid | PASS de `mermaid.parse` sobre el diagrama global y los seis diagramas de dominio. No es una prueba de constraints |

## 10. Veredicto

`READY_WITH_NOTES`

Las decisiones de integridad que esta pasada podía cerrar quedaron escritas en el diseño seleccionado. Se puede pasar al diseño físico de SQL Server sin reabrir la FK de participante, el cierre atómico, la caché de prioridad ni el orden de bloqueos. Las notas que viajan con ese diseño son los permisos de la sección 16, las conciliaciones, los NEEDS_VALIDATION de la sección B y la ausencia de una prueba ejecutable. No es permiso para crear la base ni para tratar RN-040 como ratificado.
