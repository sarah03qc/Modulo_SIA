# Evaluación independiente de las tres arquitecturas

**Fecha:** 2026-11-03
**Objeto evaluado:** `SIA_DATABASE_REQUIREMENTS.md` y `SIA_DATABASE_PROPOSALS.md`, en el texto entregado a los revisores.
**Diseño de las alternativas:** contexto de orquestación A-00, con la skill `design-database-architecture`. No fue un subprocess distinto de A-05. Esa limitación queda explícita: la independencia reclamada por el encargo se aplicó a la evaluación, no a la autoría de las tres propuestas.
**Los revisores no recibieron una recomendación previa del diseñador.** No leyeron historial Git ni un diseño anterior de base propia. No modificaron archivos.

## 1. Quién evaluó y con qué criterio

| Rol | Agente | Identificador de ejecución | Skills y fuentes usadas | Resultado |
| --- | --- | --- | --- | --- |
| Evaluador de arquitectura | A-02 solution-architecture | [Evaluación de arquitecturas](72802eb3-24d8-4809-98f1-43325b1b199a) | `design-database-architecture`; inventario; propuestas; RN-002, RN-003, RN-007, RN-008, RN-009, RN-010, RN-012, RN-013, RN-014, RN-040; RF-048, RF-061, RF-066, RF-073, RF-088, RF-116, RF-127, RF-128, RF-129 | `APPROVED_WITH_CHANGES`. Selecciona A. |
| Puerta técnica | A-09 code-reviewer | [Revisión técnica](b630a1bf-33b4-4f72-9f77-6c0432cfa136) | Contraste con la especificación v0.7. No hay skill de producto adicional: el rol revisa diseño, alcance y trazabilidad. | `CHANGES_REQUIRED`. La menos riesgosa es A. |
| Seguridad y privacidad | A-07 security-privacy | [Revisión de privacidad](b5983c4f-6bdc-4ae5-ab12-8e1673eded41) | Regla `.cursor/rules/02-security-privacy.mdc`; RNF-001 a RNF-004; RN-024; RF-017, RF-050, RF-056, RF-103, RF-104; sección 17.4 | Ninguna se rechaza por seguridad. Las tres necesitan condiciones antes de adoptarse. Handoff de ejecución `COMPLETED`, con `NEEDS_CHANGES` de diseño. |

No hubo código de producto, pruebas ni migraciones. Gate 2 de implementación: NOT_APPLICABLE.

La skill `design-database-architecture` pide no destruir la continuidad en un traslado. Los tres revisores aplicaron RN-012, RN-013 y RN-014: no hay caso sucesor. Conservar el historial del caso cerrado sí fue exigido.

## 2. Matriz ponderada

Convención de A-02: 5 es mejor cumplimiento. En complejidad, 5 es menor costo de implementación correcta. Los pesos no se modificaron.

| Criterio | Peso | A | B | C |
| --- | ---: | ---: | ---: | ---: |
| Cobertura funcional y reglas críticas | 25 % | 5 | 4 | 4 |
| Integridad, historización y trazabilidad | 20 % | 4 | 4 | 3 |
| Consultas, reportería y rendimiento | 15 % | 4 | 3 | 3 |
| Seguridad y control de acceso | 15 % | 4 | 4 | 3 |
| Mantenibilidad y claridad del modelo | 10 % | 4 | 3 | 3 |
| Integración y extensibilidad | 10 % | 4 | 4 | 4 |
| Complejidad de implementación | 5 % | 4 | 3 | 2 |
| **Ponderado** | **100 %** | **4,25** | **3,70** | **3,30** |

A = 1,25 + 0,80 + 0,60 + 0,60 + 0,40 + 0,40 + 0,20.
B = 1,00 + 0,80 + 0,45 + 0,60 + 0,30 + 0,40 + 0,15.
C = 1,00 + 0,60 + 0,45 + 0,45 + 0,30 + 0,40 + 0,10.

La matriz no sustituye el criterio. A-09 no usó estas notas y aun así señaló A como la menos riesgosa. A-07 no puntuó y no rechazó ninguna por seguridad.

## 3. Evidencia por criterio

### 3.1 Cobertura funcional

A recibe 5 porque cada regla crítica tiene estructura propia: `UX_caso_activo` en `caso_ai`, `ses_valoracion` sucesiva, `caso_plan` versionado, `ses_valoracion_categoria.respuesta` con `NINGUNO` o `FACTORES`, `cat_matriz_prioridad` con las nueve filas de RN-009, `ate_grupal` más participantes, `caso_cierre` sin `caso_destino_id`, `ref_contexto` para RF-116, `ref_posible` para RF-127, y una consulta de cobertura con D activo actual y N del mismo caso.

B recibe 4 porque los hechos existen, pero «activo» se define a la vez como fila de `persona_caso_activo` y como ausencia de `h_caso_cierre`. Además, `h_programacion_persona` queda fija al crear, más rígida que RF-076.

C recibe 4 porque el operativo cubre caso, grupal, snapshot y cierre, pero motivos, factores y niveles dependen de que `cfg.item` los declare bien, y el KPI tiene un segundo camino en `anl`.

### 3.2 Integridad e historia

A recibe 4, no 5. Hay historial real y el índice filtrado impide dos vigentes. Los punteros `prioridad_vigente` pueden apartarse de `ses_valoracion`. La igualdad con la matriz y la exclusión de `Ninguno` son de transacción. Un `UPDATE` directo puede reescribir una valoración confirmada.

B recibe 4. El contenido confirmado no se actualiza y no pueden quedar dos banderas vigentes. No llega a 5 porque borrar `persona_caso_activo` fuera del cierre deja una apertura sin cierre y libera la PK.

C recibe 3. Hereda punteros y suma tablas derivadas que pueden no cuadrar. El índice único `(valoracion_id, item_id, opcion_id)` no impide varias filas con `opcion_id` nulo: en SQL Server un único compuesto admite varios NULL.

### 3.3 Consultas y reportería

A recibe 4. Una sola consulta de cobertura, conteo de motivos por fila y conteo de grupales por cabecera. Sexo y edad quedan en el adaptador. La nota baja si `prioridad_vigente` miente.

B recibe 3. El ancla hace barato el denominador, pero un `TOP 1` sin orden o una divergencia entre ancla y cierre cambia el resultado.

C recibe 3. Hay ventana de dos cifras hasta reconstruir. Contar filas de `anl.atencion_efectiva` multiplicaría la grupal si no se usa `DISTINCT`.

### 3.4 Seguridad

A y B reciben 4. No hay tabla paralela de autorización. Auditoría e informe agregado no están pensados para guardar el expediente. C recibe 3 porque `ses.respuesta` y `ref.respuesta` concentran el texto clínico.

A-07 añadió condiciones que la nota 4 no absorbe: el borrador `nvarchar(max)` no puede vivir en el esquema de auditoría, y la fila completa del caso no puede ser la lista de Establecimiento.

### 3.5 Mantenibilidad, integración y costo

A es la más legible: tablas con nombre de dominio y un esquema. B obliga a redefinir «vigente» en cada consulta. C exige un diccionario de instrumento y recordar cuál camino manda.

Las tres integran igual de bien con SIDINACC: sin FK, con `per_id_persona` y snapshot justificado. C prepara mejor un formulario nuevo y no mejora la integración institucional.

Implementar A es el camino más corto. C es el más largo.

## 4. Restricciones eliminatorias

A-02 no rechazó ninguna. A-09 sí consideró que B no sostiene, con una sola regla de base, RN-002, RF-048 y RN-040. A-00 registra esa discrepancia y no la promedia: B no se selecciona. No hace falta declararla eliminada para todo uso comparativo, y tampoco se adopta.

| Restricción | A | B | C |
| --- | --- | --- | --- |
| Dos activos sin mecanismo sólido | Índice filtrado y bloqueo de `vinculo_persona`. | PK del ancla. A-09: dos aperturas sin cierre, o un `DELETE` del ancla, no están cerrados por el mismo constraint. | Igual que A. |
| Pérdida de historial | No, si la transacción se cumple. | No en el contenido clínico. | No en las cabeceras. |
| Continuidad automática | No existe. | No existe. | No existe. |
| Maestros SIDINACC duplicados | No. | No. | No. La proyección tampoco copia sexo ni nacimiento. |
| Grupal | Una cabecera y N participantes. | Igual, con asistencia obligatoria al confirmar. | Igual. |
| Cobertura ambigua | Una consulta. | Fórmula escrita; D puede leer un universo distinto del de la visualización 5. | Dos caminos. Manda el operativo. |
| Dato institucional indispensable para funcionar | No. Sexo y edad no bloquean el núcleo. | Igual. | Igual. |
| Seguridad de datos sensibles | Contemplada, con condiciones de A-07. | Contemplada, con condiciones de A-07. | Contemplada, con mayor radio de exposición. |
| Decisión profesional automatizada | No. La prioridad sale de la matriz. | No. | No. `origen_calculo = MATRIZ`. |

## 5. Fortalezas y debilidades

**A.** El activo está en la fila del caso. Bandeja, lista y cobertura leen el presente sin reconstruir eventos. Debilidad: `Ninguno`, la matriz y los punteros dependen de la transacción; el borrador convive con el hecho; `ate_individual.per_id_persona` puede no ser la persona del caso.

**B.** Una valoración confirmada no se actualiza. Debilidad: ancla y ausencia de cierre pueden contradecirse; cada gráfico redefine el último hecho; los participantes de la programación no se corrigen.

**C.** El formulario cambia por versión de ítem y la proyección se puede rehacer. Debilidad: `Ninguno` es un ítem más, el único con NULL no hace lo que el texto promete, y la proyección puede mostrar otro N o D.

## 6. Hallazgos de A-09

| Severidad | Propuesta | Hallazgo |
| --- | --- | --- |
| Alta | B | Dos casos sin cierre pueden coexistir. La visualización 5 usa «sin cierre» y la cobertura usa el ancla. |
| Media | C | N y D tienen dos caminos. |
| Media | A y C | `Ninguno` y la igualdad con la matriz cruzan tablas y quedan en la transacción. |
| Media | A y C | Un caso puede pasar a `CERRADO` sin fila de cierre si la transacción se parte. |
| Baja | C | Una sección vacía puede leerse como `Ninguno` si se implementa mal. |
| Baja | B | Participantes de programación fijos al crear. Más rígido que RF-076. |
| Baja | A | `fecha_nacimiento_informada` no debe usarse como nacimiento vigente en las visualizaciones 2 y 3. |

## 7. Hallazgos de A-07

Ninguna propuesta se rechaza por seguridad. Condiciones de adopción:

| ID | Severidad | Afecta | Condición |
| --- | --- | --- | --- |
| H-01 | Alta | A y C | Sacar el borrador clínico de auditoría. Tabla propia, excluida de reportería y de lectura de auditoría. |
| H-02 | Alta | C | Sin `SELECT` directo de `ses.respuesta` ni `ref.respuesta`. |
| H-03 | Alta | B | Sin `DELETE` libre del ancla. |
| H-04 | Media | A, B y C | Lista de Establecimiento solo con persona, establecimiento, estado, prioridad y fechas. Sin riesgo, protección ni cierre operativo. |
| H-05 | Media | A y C | Borradores fuera de las doce visualizaciones, de la cobertura y de las exportaciones. |
| H-06 | Media | A, B y C | Resumen de auditoría con códigos y estados, no con el antes y el después clínico. |
| H-07 | Media | B y C; A ya lo escribe | Mensaje de conflicto sin datos del otro expediente. |
| H-08 | Media | A, B y C | El snapshot familiar se lee con la referencia, no dentro del DTO general del caso. |
| H-09 | Media | A, B y C | La clave de archivo no se entrega solo por ver el caso. Regional y Nacional no la reciben mientras 17.4 siga abierto. |
| H-10 | Media | C, con efecto en A y B | RF-056 no autoriza el volcado de factores, textos de atención, explicación de Otro ni destino del traslado. |
| H-11 | Media | C, y el agregado de palabras en las tres | La proyección y la nube respetan el ámbito. No se inventa umbral de supresión. |
| H-12 | Media | A, B y C | El informe se lee en el ámbito con el que se generó. Establecimiento no lee informes. |
| H-13 | Baja | A | El predicado de cobertura es el ámbito efectivo completo, no solo una región de ejemplo. |
| H-14 | Baja | Las tres | El error de migración guarda clave y código, no el texto clínico. |
| H-15 | Baja | C | La reconstrucción de `anl`, si existiera, sería privilegiada. No se adopta `anl`. |

## 8. Veredicto

**Veredicto de A-02:** `APPROVED_WITH_CHANGES`.
**Propuesta seleccionada:** A. Expediente operativo con estado vigente e historial explícito.
**Veredicto de A-09:** `CHANGES_REQUIRED`. Compatible con adoptar A y no adoptar B como equivalente.
**Veredicto de A-07:** no hay rechazo. Hay condiciones de diseño.

A-00 no elige por el puntaje más alto ni por el número de tablas. Adopta A porque los tres revisores coinciden en que es la menos riesgosa y la única con una consulta única de cobertura, un índice de caso activo sobre la fila del caso y tablas de dominio legibles. B protege el pasado y deja abierto un segundo caso sin cierre. C prepara el formulario y agrega un segundo resultado.

Los cambios se aplican en `current/DATABASE_DESIGN_SELECTED.md`. No se reescribe B ni C para convertirlas en ganadoras.

### 8.1 Cambios exigidos por A-02, incorporados

1. FK de `ses_valoracion` a una clave única de `cat_matriz_prioridad` que incluye riesgo, protección y prioridad.
2. FK compuesta de `ses_valoracion_factor` hacia la categoría cuya respuesta es `FACTORES`. `NINGUNO` sigue siendo fila explícita. Sin trigger.
3. FK compuesta `(caso_id, per_id_persona)` desde `ate_individual` hacia `caso_ai`.
4. La autoridad de lectura del vigente es `valoracion_vigente_id` y `es_vigente`. Las columnas de caché, si se conservan, solo se escriben en esa transacción y una consulta de conciliación debe devolver cero filas.
5. El rol de aplicación no actualiza el contenido de una valoración confirmada. Puede cambiar `es_vigente` y completar `caso_id` una sola vez. Envío y apertura bloquean `vinculo_persona`.
6. Una sola consulta de cobertura, sin tabla derivada de N y D.

### 8.2 Cambios añadidos por A-09 y A-07, incorporados

- Cerrar el caso inserta `caso_cierre` y cambia el estado en la misma transacción. Una consulta de conciliación detecta estados huérfanos.
- `fecha_nacimiento_informada` no alimenta las visualizaciones 2 y 3.
- El borrador pasa a `bor_captura`, fuera de `aud_`.
- Vista `caso_lista_establecimiento` con columnas cerradas.
- `aud_evento` no tiene texto clínico libre.
- Las consultas de motivos, cobertura y exportaciones solo leen hechos enviados o confirmados.
- El mensaje de conflicto queda fijado para la propuesta seleccionada.
- El snapshot familiar no forma parte del DTO de caso ni de la lista de Establecimiento.
- El error de migración no guarda el contenido clínico del archivo.

## 9. Qué no quedó cerrado

Siguen NEEDS_VALIDATION y no bloquean la selección del modelo: ratificación de RN-040 con Alina, corrección de un hecho confirmado, equivalencia de posibles referencias, catálogo completo de factores y disciplinas, información individual exacta de Regional y Nacional, permisos reforzados de documentos, formato del informe, clave institucional definitiva de persona y mecanismo real de autorización. El diseño no los resuelve ampliando permisos ni inventando ítems.
