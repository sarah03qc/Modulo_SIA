# Revisión SQL Server, seguridad y trazabilidad

**Fecha:** 2026-11-03
**Objeto:** `current/DATABASE_DESIGN_SELECTED.md` y `current/DATABASE_DESIGN_SELECTED.mmd`, ya con los cambios de la evaluación.
**Skill aplicada:** `review-sql-server-schema`.
**También se usan:** `verify-traceability` sobre la cadena hasta el diseño, y los hallazgos de A-07 ya incorporados.
**Quién revisa:** A-00, después de la selección independiente. No es un cuarto subprocess. La evaluación de las tres propuestas sí lo fue. Esta revisión no ejecuta SQL ni crea la base.
**Decisión de cierre:** `APPROVED`. Al revisar la candidata aparecieron dos ajustes de clave; quedaron escritos en el diseño seleccionado antes de cerrar esta revisión. No queda un rediseño pendiente. La aceptación humana sigue abierta.

## 1. Claves

Las PK de hechos SIA son `bigint IDENTITY`. Son sustitutas, estables y suficientes para el volumen de factores, participaciones y auditoría. No se usa GUID.

`per_id_persona nvarchar(20)` es clave natural de `vinculo_persona` y clave foránea interna. No es IDENTITY. Sigue siendo la clave provisional de interoperabilidad. Cambiarla a `RCS_idPersona` queda NEEDS_VALIDATION y exigirá migración.

`caso_ai` añade la única (`caso_id`, `per_id_persona`) para que la atención individual no pueda nombrar otra persona. `referencia_id` es única: una referencia abre un solo caso.

`cat_matriz_prioridad` tiene la única de negocio por riesgo y protección, y la única de cuatro columnas que la valoración referencia. Una prioridad distinta de RN-009 no entra.

`cat_item` tiene la única (`cat_item_id`, `codigo_catalogo`). Cada uso lleva un `CHECK` de un solo código de catálogo. Este ajuste salió de esta revisión: sin él, la FK a `cat_item` aceptaba un motivo de cierre en el campo de vía de atención.

## 2. Foreign keys

Hay FK internas entre hechos de SIA. No hay FK a `SIDINACC_LOCAL`. No hay `ON DELETE CASCADE` ni `ON UPDATE CASCADE`.

Las circulares están acotadas y son insertables:

- `caso_ai.valoracion_vigente_id` hacia `ses_valoracion`, y `ses_valoracion.caso_id` hacia `caso_ai`, ambos nulos en el momento intermedio de la apertura.
- `caso_ai.plan_vigente_id` hacia `caso_plan`, y `caso_plan.caso_id` hacia `caso_ai`. El plan se inserta después del caso.

`ses_valoracion_factor` referencia la categoría solo cuando su respuesta es `FACTORES`. `NINGUNO` no admite hijos. No hace falta trigger.

`ref_posible.referencia_id` es opcional. `ate_grupal_participante.caso_id` es opcional y no usa la FK compuesta de la individual, porque la persona puede no tener caso. La igualdad de persona, cuando el caso viene informado, queda en prueba de transacción. Es un hallazgo importante no bloqueante: un participante podría apuntar al caso de otra persona si el servicio se equivoca. La conciliación correspondiente está en la sección 12.

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
- Único de consecutivo.
- Único filtrado de una referencia originada por sugerencia.
- Único filtrado propuesto de posible referencia pendiente por persona, criterio y establecimiento. La equivalencia institucional sigue NEEDS_VALIDATION. El índice puede cambiar sin tocar los hechos ya resueltos.
- `CHECK` de hora de fin posterior a la de inicio, de motivo obligatorio al reprogramar o cancelar, y de justificación cuando la decisión es no requiere A.I.

Índices de bandeja, cobertura, motivos, cierres y vencidas están justificados en la sección 21 del diseño. No hay un índice por cada FK.

No se crean tablas temporales, vistas materializadas, triggers ni `sp_getapplock`. El bloqueo es `HOLDLOCK` y `UPDLOCK` sobre `vinculo_persona`.

## 5. Historial, fechas y concurrencia

Valoraciones, factores, categorías, planes anteriores, envío, contexto, impresiones, historial de estado, cambios de programación, eventos de coordinación y cierres no tienen `UPDATE` de contenido. `rowversion` cubre caso, referencia, posible referencia, valoración, plan, actividad, coordinación, vínculo y borrador.

La fecha real de atención es `date`. La digitación es `datetime2(0)`. El envío no se confunde con la impresión. La edad de la referencia no se confunde con la edad actual.

El estado `CERRADO` sin fila de cierre, y la caché de prioridad distinta de la valoración vigente, no los impide un `CHECK`. Lo impiden la transacción y dos consultas de conciliación que deben devolver cero filas. Es el límite consciente de no usar trigger. Queda como riesgo residual, no como rediseño: A-09 aceptó esa vía.

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
| R-01 | Cierre y estado no están atados por constraint | Residual. Transacción más conciliación en cero. |
| R-02 | Caché de prioridad puede divergir | Residual. La lectura oficial es la valoración. Conciliación en cero. |
| R-03 | Participante grupal con `caso_id` de otra persona | Residual. Prueba de transacción. No bloquea el modelo. |
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

La segunda solo señala atenciones digitadas después del cierre. No borra nada. Sirve de alerta, no de corrección silenciosa.

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
