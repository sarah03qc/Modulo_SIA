# Revisión SQL Server, seguridad y trazabilidad

**Fecha:** 2026-11-03
**Objeto:** `current/DATABASE_DESIGN_SELECTED.md` y `current/DATABASE_DESIGN_SELECTED.mmd`, ya con los cambios de la evaluación.
**Skill aplicada:** `review-sql-server-schema`.
**También se usan:** `verify-traceability` sobre la cadena hasta el diseño, y los hallazgos de A-07 ya incorporados.
**Quién revisa:** A-00, después de la selección independiente. No es un cuarto subprocess. La evaluación de las tres propuestas sí lo fue. Esta revisión no ejecuta SQL ni crea la base.
**Decisión de esta pasada:** `APPROVED`. Al revisar la candidata aparecieron dos ajustes de clave; quedaron escritos en el diseño seleccionado antes de cerrar esta revisión. No queda un rediseño pendiente. La aceptación humana sigue abierta.
**Pasada posterior:** el endurecimiento del 2026-11-03 está en la sección 16. Donde esta revisión decía residual de cierre, caché o participante grupal, manda esa sección.

## 1. Claves

Las PK de hechos SIA son `bigint IDENTITY`. Son sustitutas, estables y suficientes para el volumen de factores, participaciones y auditoría. No se usa GUID.

`per_id_persona nvarchar(20)` es clave natural de `vinculo_persona` y clave foránea interna. No es IDENTITY. Sigue siendo la clave provisional de interoperabilidad. Cambiarla a `RCS_idPersona` queda NEEDS_VALIDATION y exigirá migración.

`caso_ai` añade la única (`caso_id`, `per_id_persona`) para que la atención individual no pueda nombrar otra persona. `referencia_id` es única: una referencia abre un solo caso.

`cat_matriz_prioridad` tiene la única de negocio por riesgo y protección, y la única de cuatro columnas que la valoración referencia. Una prioridad distinta de RN-009 no entra.

`cat_item` tiene la única (`cat_item_id`, `codigo_catalogo`). Cada uso lleva un `CHECK` de un solo código de catálogo. Este ajuste salió de esta revisión: sin él, la FK a `cat_item` aceptaba un motivo de cierre en el campo de vía de atención.

## 2. Foreign keys

Hay FK internas entre hechos de SIA. No hay FK a `SIDINACC_LOCAL`. No hay `ON DELETE CASCADE` ni `ON UPDATE CASCADE`.

Las circulares están acotadas y son insertables:

- `caso_ai.valoracion_vigente_id` hacia `ses_valoracion` es no nulo: el caso se inserta con la valoración ya creada. `ses_valoracion.caso_id` hacia `caso_ai` sí nace nulo y se completa después. `plan_vigente_id` sigue nulo hasta que el plan existe.
- `caso_ai.plan_vigente_id` hacia `caso_plan`, y `caso_plan.caso_id` hacia `caso_ai`. El plan se inserta después del caso.

`ses_valoracion_factor` referencia la categoría solo cuando su respuesta es `FACTORES`. `NINGUNO` no admite hijos. No hace falta trigger.

`ref_posible.referencia_id` es opcional. `ate_grupal_participante.caso_id` es opcional. Desde el endurecimiento usa la misma FK compuesta de la individual: si `caso_id` es nulo, SQL Server no la comprueba; si viene informado, la persona tiene que ser la del caso. La conciliación de la sección 12 queda como detector de una constraint desactivada. El detalle está en la sección 16.

No existe `caso_destino_id`.

## 3. Tipos y nulos

Se usan `date`, `time(0)`, `datetime2(0)`, `nvarchar` acotado, `int`, `bigint`, `bit`, `smallint`, `tinyint`, `decimal(18,4)` y `rowversion`. No se usan `float`, `text`, `ntext`, `image`, `datetime` ni `uniqueidentifier`.

`nvarchar(max)` queda solo en `bor_captura.contenido`. Es captura incompleta, no el registro clínico. Está justificado y aislado.

`NULL` de `asistio` significa asistencia no confirmada y no cuenta. `NULL` de columnas del snapshot significa que la fuente no trajo el dato. `NULL` no significa `Ninguno`. `fecha_nacimiento_informada` no alimenta la edad actual.

Edad congelada: `smallint` con rango 0 a 120 si viene informada.

Teléfono y dirección del snapshot son `nvarchar`, no `numeric`. El tipo institucional del teléfono sigue NEEDS_VALIDATION y no se copia el `numeric(18,0)` de la réplica.

## 4. Constraints e índices

Quedan en el motor, entre otros:

- `CHECK` de estados de referencia, caso, actividad, decisión, respuesta de categoría, vía de catálogo y ámbito del informe.
- Único filtrado de un caso `ACTIVO` por persona.
- Únicos filtrados de valoración vigente, antes y después de tener caso.
- Único filtrado de un plan vigente por caso.
- Único del consecutivo digitado. No hay tabla de secuencia.
- Único filtrado de una referencia originada por sugerencia.
- Único filtrado propuesto de posible referencia pendiente por persona, criterio y establecimiento. La equivalencia institucional sigue NEEDS_VALIDATION. El índice puede cambiar sin tocar los hechos ya resueltos.
- `CHECK` de hora de fin posterior a la de inicio, de motivo obligatorio al reprogramar o cancelar, y de justificación cuando la decisión es no requiere A.I.

Índices de bandeja, cobertura, motivos, cierres y vencidas están justificados en la sección 21 del diseño. No hay un índice por cada FK.

No se crean tablas temporales, vistas materializadas, triggers ni `sp_getapplock`. El bloqueo es `HOLDLOCK` y `UPDLOCK` sobre `vinculo_persona`. El alta de esa fila quedó después como `SELECT` más `INSERT`, sin `MERGE`. Ver sección 16.

## 5. Historial, fechas y concurrencia

Valoraciones, factores, categorías, planes anteriores, envío, contexto, impresiones, historial de estado, cambios de programación, eventos de coordinación y cierres no tienen `UPDATE` de contenido. `rowversion` cubre caso, referencia, posible referencia, valoración, plan, actividad, coordinación, vínculo y borrador.

La fecha real de atención es `date`. La digitación es `datetime2(0)`. El envío no se confunde con la impresión. La edad de la referencia no se confunde con la edad actual.

En esta pasada, el estado `CERRADO` sin fila de cierre y la caché de prioridad quedaron fuera de un `CHECK`. El endurecimiento posterior sí ata `CERRADO` a `cierre_caso_id` y elimina la caché. El caso `ACTIVO` que conserve una fila de cierre sigue sin constraint. El detalle y el motivo para no usar trigger están en la sección 16.

No hay borrado lógico general. El borrado físico solo aplica a `bor_captura` al confirmar, y no a hechos clínicos.

## 6. Catálogos y derivados

La matriz, los catálogos y el instrumento son configuración versionada. La prioridad guardada es un derivado con versión, insumos y fecha. Se puede recomprobar por la FK. No se recalcula sola si la matriz cambia.

La actividad vencida, la edad actual, la línea de tiempo, N, D y las palabras de Otro no son columnas operativas. El informe sí guarda el agregado ya mostrado, porque RF-131 pide conservar el significado del corte. No guarda el microdato.

## 7. Reportería y ámbito

Las doce visualizaciones y el KPI tienen una sola consulta autoritativa, escrita en la sección 17 del diseño. El predicado de ámbito es el efectivo, no un ejemplo de una región. El nacional suma personas. D = 0 no divide. La grupal cuenta una vez como actividad y las personas solo con `asistio = 1`.

Sexo y edad salen del adaptador después del filtro. Si el adaptador no responde, esas dos visualizaciones fallan de forma explícita y el resto de A.I. sigue operando. No son un requisito para abrir un caso.

No hay RLS. El servicio aplica el ámbito. La vista `caso_lista_establecimiento` solo cierra columnas. Un `SELECT` nacional de esa vista seguiría siendo un error de servicio. El rol de Establecimiento no debe tener `SELECT` sobre `caso_ai`.

## 8. Seguridad

Incorporado desde A-07:

- Borrador fuera de `aud_`.
- Auditoría por `codigo_cambio`, sin texto clínico.
- Lista de Establecimiento sin riesgo, protección ni cierre operativo.
- Snapshot familiar fuera del DTO de caso.
- Clave de archivo no entregada a Regional ni a Nacional mientras 17.4 siga abierto.
- Mensaje de caso activo sin datos del otro expediente.
- Error de migración sin payload clínico.
- Establecimiento sin lectura de `inf_*`.

Siguen NEEDS_VALIDATION y no se cierran aquí: campos exactos de Regional y Nacional, permisos reforzados por tipo documental, retención del archivo, si otra persona de la oficina puede leer un borrador, y el mecanismo real de establecimientos autorizados. No se crea una tabla paralela para tapar esos huecos.

## 9. Trazabilidad

Skill `verify-traceability`. La cadena del inventario, sección 10, llega a este diseño. No llega a código ni a pruebas: no existen. Eso es NOT_APPLICABLE de implementación, no un identificador inventado.

| Comprobación | Resultado |
| --- | --- |
| HU, RF y CU del núcleo tienen dominio en el inventario y tabla en el diseño | Cubierto |
| RN-002, RN-008, RN-009, RN-010, RN-012, RN-013, RN-040 | Cubiertos por índice, FK, transacción o consulta |
| HU-029, RF-062, RF-063, CU-21 | Sin tabla. Correcto |
| RF-105 a RF-111 | Sin tabla. EXPLORATORIO |
| Pruebas automatizadas | No hay. Pendientes cuando exista implementación |

`evolve-data-model` se usó solo como criterio: no hay migración, no hay DROP y no se ejecuta SQL. El diseño es aditivo respecto de una base que todavía no existe. Un cambio futuro de `per_id_persona` o de la única de posibles referencias debe ser migración reversible, con conciliación previa. Eso no se escribe ahora.

## 10. Escalabilidad y costo

El módulo nacional de A.I. no es el volumen de vigilancia. Índices por ámbito, estado y fecha cubren bandejas y el KPI. La prioridad oficial hace un join a una fila vigente, no un barrido de historia. Sexo y edad son el costo externo: lotes de identificadores ya filtrados.

El rol de aplicación debe ser estrecho. Un login con `UPDATE` y `DELETE` amplios anula los permisos de columna. Eso es costo operativo de despliegue, no una tabla más.

## 11. Hallazgos

### Críticos

Ninguno abierto. Los dos que esta revisión encontró se escribieron en el diseño antes de cerrar el documento:

1. FK compuesta de catálogo con `CHECK` de código, para que un ítem no salte de catálogo.
2. Único filtrado de valoración vigente por referencia mientras `caso_id` es nulo.

### Importantes

| ID | Hallazgo | Estado |
| --- | --- | --- |
| R-01 | Cierre y estado no están atados por constraint | Superado en la sección 16 para `CERRADO` sin fila. Sigue abierto el lado `ACTIVO` con fila de cierre |
| R-02 | Caché de prioridad puede divergir | Cerrado. Las tres columnas no se persisten |
| R-03 | Participante grupal con `caso_id` de otra persona | Cerrado por FK compuesta. `caso_id` sigue anulable |
| R-04 | Atención insertada sobre un caso ya cerrado | Residual. La transacción exige `ACTIVO`. No hay constraint cruzado. |
| R-05 | Vista de Establecimiento sin predicado de filas | Residual. El rol no lee `caso_ai` y el servicio filtra. |

### Opcionales

- Columna persistida de catálogo podría evitarse con tablas de ítem separadas por catálogo. La FK compuesta es suficiente y mantiene un solo mantenimiento de vigencia.
- Full-text para la nube de Otro. No se adopta hasta conocer volumen. La tokenización de servicio basta para el diseño.
- RLS cuando el mecanismo institucional de autorización esté definido. No antes.

## 12. Conciliaciones que deben poder ejecutarse

Además de las dos ya escritas en el diseño seleccionado:

```sql
SELECT p.participante_id
FROM dbo.ate_grupal_participante AS p
JOIN dbo.caso_ai AS c
  ON c.caso_id = p.caso_id
WHERE p.caso_id IS NOT NULL
  AND p.per_id_persona <> c.per_id_persona;
```

```sql
SELECT i.atencion_individual_id
FROM dbo.ate_individual AS i
JOIN dbo.caso_ai AS c
  ON c.caso_id = i.caso_id
WHERE c.estado <> N'ACTIVO'
  AND i.digitada_en > ISNULL(
        (SELECT z.registrado_en FROM dbo.caso_cierre AS z WHERE z.caso_id = c.caso_id),
        i.digitada_en);
```

La segunda solo señala atenciones digitadas después del cierre. No borra nada. Sirve de alerta, no de corrección silenciosa. La primera queda cubierta por la FK compuesta; se conserva por si la constraint se desactiva. La misma forma aplica a `prog_persona`.

## 13. Evolución

No se ejecutó migración. El diseño no pisa historia porque la base no existe. Cuando se cree, el primer script debe ser aditivo y reversible por eliminación de la base nueva, no por `DROP` de objetos de `SIDINACC_LOCAL`. Esa eliminación no está autorizada por este documento.

Exploratorios siguen sin tablas. La sugerencia de niveles, si algún día se valida, nace en otra tabla.

## 14. NEEDS_VALIDATION que permanecen

NV-UTIC-PERSONA, NV-UTIC-PERIODO, NV-UTIC-MODALIDAD, NV-UTIC-SENAL, NV-EQUIV, NV-CATEGORIAS, NV-FACTORES, NV-DISCIPLINAS, NV-FRECUENCIA, NV-TIPO-ATENCION, NV-TIPO-PROG, NV-CANCELACION, NV-COORD-DOC, NV-ARCHIVO, NV-REPORTERIA-EST, NV-RN040, NV-CORRECCION, NV-SEXO-EDAD como dependencia de consulta, NV-AUTH, NV-STACK, 17.4 y el mapa de códigos regionales hacia `region_id`.

Ninguno de ellos autoriza a sembrar ítems no escritos ni a conceder reportería a Establecimiento.

## 15. Decisión de la revisión

`APPROVED`

Los cambios de A-02, A-09, A-07 y los dos de esta revisión están en el diseño seleccionado. Los residuales están nombrados y tienen conciliación o permiso, no una regla escondida. No se pide otro modelo.

Esto no es aceptación humana del módulo ni permiso para crear la base.

## 16. Endurecimiento del 2026-11-03

Segunda pasada, solo sobre la propuesta A. No compara A/B/C ni ejecuta SQL. Intervinieron, en solo lectura, A-05, A-02, A-07 y A-01. Sus ajustes quedaron incorporados al diseño seleccionado antes de cerrar esta sección.

| Decisión | Resultado |
| --- | --- |
| FK compuesta de `ate_grupal_participante` y de `prog_persona` | Incorporada. `caso_id` anulable. `MATCH SIMPLE` no comprueba la FK cuando ese valor es nulo |
| `CHECK` de `cierre_caso_id` y FK al historial `CERRADO` del mismo caso | Incorporados. Impiden confirmar un caso cerrado sin su fila y sin su evento |
| Caso activo con fila de cierre | Sigue sin constraint. Transacción, permiso y conciliación |
| Caché de prioridad | Eliminada. La bandeja usa `INCLUDE (valoracion_vigente_id)` y la PK de `ses_valoracion` |
| `MERGE` del vínculo | Sustituido por `SELECT ... UPDLOCK, HOLDLOCK` e `INSERT` si no hay fila |
| Trigger | No. El lado que el motor puede cerrar ya lo cierra el `CHECK`. El otro lado no mejora con un trigger mientras el rol de aplicación no tenga escritura directa |

`NV-GRUPAL-AMBITO` queda abierto: un alta grupal no copia el identificador de un caso activo fuera del ámbito del actor. RN-040 sigue provisional. No aparece un bloqueo nuevo que impida describir el esquema.

La validación de esta pasada es documental. No hubo DDL ni prueba ejecutable de las constraints.

A-09 revisó el texto ya editado y pidió un ajuste: la relación `vigente` y la viñeta de las FK circulares todavía trataban `valoracion_vigente_id` como nulo. Ese puntero es obligatorio. El nulo del ciclo es `ses_valoracion.caso_id`, y el de la apertura es `plan_vigente_id`. Los dos diagramas y esta sección quedaron alineados con eso. No se reabrió el participante, el cierre, la caché ni el orden de bloqueos.

## 17. Aclaración del consecutivo — 2026-11-05

Alina, contraparte institucional, confirmó que el consecutivo se digita completo. El sistema valida formato y unicidad. No lo genera. Esta sección no reescribe el dictamen del 2026-11-03 ni las puntuaciones de `SIA_DATABASE_EVALUATION.md`. Esas propuestas describían un contador; el diseño seleccionado ya no lo tiene.

| Qué cambia | Dónde |
| --- | --- |
| `ref_referencia.consecutivo` sigue obligatorio y único | Captura manual. Cadena canónica |
| `ref_consecutivo_control` | Eliminada. Su única función era incrementar |
| Bloqueo por establecimiento y año | Retirado. El duplicado lo resuelve el índice único |
| `caso_ai.consecutivo_origen` | Sigue siendo copia inmutable del valor validado |
| `cat_codigo_region_referencia` | Sigue. El segmento DR debe ser uno de los nueve códigos. No exige coincidir con la región de la persona y no numera |
| Corrección después del envío | NV-CORRECCION. Sin `UPDATE` libre |

Normalización que compara y guarda: recorte de extremos y mayúsculas ASCII. No se quitan ceros ni se rellenan segmentos. `001` y `1` no son el mismo consecutivo.

La validación de formato es del servicio. El formulario es complementario. El motor garantiza `NOT NULL` y el índice único. Un `CHECK` no puede saber el establecimiento de la persona.

### 17.1 Criterios de prueba

No se ejecutaron. No exigen que un número sea el siguiente de otro.

| Criterio | Resultado esperado |
| --- | --- |
| Estructura válida, como `DNCC-DRCS-OL101-1010102-REF-001-2026`, con un DR de los nueve códigos y el establecimiento de la persona referida | Se conserva esa cadena canónica. `referencia_id` se genera aparte |
| Misma cadena en minúsculas o con espacios extremos | Se guarda una sola forma canónica. No crea otra referencia |
| Prefijo distinto de `DNCC`, `DR`, `OL` o `REF` | Mensaje de formato. No se envía |
| Segmento faltante | Mensaje de formato. No se envía |
| Separador distinto del guion, o guion de más | Mensaje de formato. No se envía |
| Carácter fuera de letras, dígitos y guion | Mensaje de formato. No se envía |
| Año que no cumple `20` y dos dígitos | Mensaje de formato. No se envía. No se exige que el año sea el de la fecha de envío |
| Establecimiento distinto del de la persona referida | Mensaje de correspondencia. No se usa el establecimiento de quien digita |
| Oficina Local con formato `OL` y tres dígitos, aunque no sea la de quien digita | El formato se acepta. RF-115 no exige que coincida con la Oficina Local de la persona |
| Consecutivo ya registrado | Mensaje de duplicado, sin datos de la otra referencia. No se asigna otro número |
| Dos usuarios envían a la vez el mismo valor canónico | Uno confirma. El otro recibe el duplicado del índice único. No hay reintento que invente un número |
| Referencia desde plantilla Excel | El consecutivo precargado se revisa y se valida como en CU-04. El archivo no lo genera |
| Apertura del caso | `consecutivo_origen` queda igual al valor validado de la referencia |
| Ausencia de generación | No existe fila de control. Un envío no propone ni completa la serie. `REF-017` es válido aunque no exista `REF-016` |
| Borrador | Puede guardar el texto. No reserva el número |
| Consecutivo ya enviado | No hay modificación libre. El procedimiento autorizado sigue NEEDS_VALIDATION |

### 17.2 Revisión SQL Server de este delta

- Clave sustituta `referencia_id` e identificador documental natural único conviven. La natural no se genera.
- No queda tabla de secuencia ni protocolo de `UPDLOCK` exclusivo del incremento.
- La carrera de dos insertos iguales la cierra el índice único, no un contador.
- La normalización evita dos filas por mayúsculas o espacios extremos, sin declarar equivalentes números de distinto ancho.
- El formato que depende de la persona queda fuera del `CHECK`.
- No se añaden reglas de hueco, reserva o reutilización.

El dictamen `APPROVED` del esquema se mantiene con esta corrección. No es permiso para crear la base.
