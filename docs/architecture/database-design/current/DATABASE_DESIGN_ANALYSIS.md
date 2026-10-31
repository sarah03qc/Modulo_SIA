# Análisis de arquitectura de datos — SIA-CENCINAI

**Fecha:** 31 de octubre de 2026

**Estado:** propuesta de arquitectura. Sin DDL, sin implementación y sin aprobación institucional.

**Fuentes normativas de esta lectura:** `docs/functional/FUNCTIONAL_SPEC_v0.6.md` y `docs/functional/USE_CASES_v0.6.md`.

**Fuentes de integración y territorio:** `docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md`, `docs/architecture/SIDINACC_CAH_DATABASE_ANALYSIS.md`, `docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md`, `docs/agent-workflow/sources-and-validation.md`.

Este análisis reconstruye el dominio desde el proceso, las necesidades funcionales, las reglas, los datos y las relaciones. No parte de una propuesta de base de datos anterior. Los documentos de propuestas previas que puedan existir en el repositorio no fueron abiertos ni usados como insumo.

La persistencia diseñada es la base propia del módulo SIA-CENCINAI. `SIDINACC` / CAH es la fuente institucional. `SIDINACC_LOCAL` es la réplica de desarrollo de esa fuente. Ninguna de las dos es la base de Atención Interdisciplinaria.

---

## 1. Lectura del dominio

SIA-CENCINAI apoya el proceso de Atención Interdisciplinaria desde la referencia hasta el seguimiento, el traslado, la reportería y el cierre. El sistema organiza información, conserva trazabilidad y calcula la prioridad a partir de una matriz aplicada a dos niveles definidos por el equipo. La decisión de ingreso, de riesgo, de protección, de abordaje y de cierre permanece en el equipo profesional.

### 1.1 Unidades del dominio

| Unidad | Qué representa | Dónde vive |
| --- | --- | --- |
| Persona institucional | Identidad del cliente o beneficiaria. La identificación es la clave preferente de coincidencia. | SIDINACC / CAH. SIA guarda el identificador `PER_idPersona`. |
| Contexto territorial vigente | Región, Oficina Local, establecimiento y servicios del período institucional. | SIDINACC / CAH, leído por adaptador. |
| Referencia a A.I. | Solicitud enviada, con consecutivo, comprobante de envío y contexto congelado. | SIA. |
| Sesión interdisciplinaria | Reunión del equipo en la que se analizan referencias o casos. | SIA. |
| Valoración situacional | Lectura estructurada de factores y niveles profesionales de riesgo y protección. | SIA. |
| Resolución | Decisión explícita de si la situación requiere A.I. | SIA. |
| Caso A.I. | Episodio de responsabilidad de una Oficina Local sobre la atención de una persona. | SIA. |
| Plan de atención | Propósitos, estrategias, disciplinas y frecuencia planificada vigentes en ese episodio. | SIA. |
| Atención | Hecho de atención individual o grupal. La grupal es un solo registro con participantes. | SIA. |
| Programación | Intención operativa. No acredita atención. | SIA. |
| Traslado | Cierre de la responsabilidad de origen y ingreso pendiente de continuidad en destino. | SIA. |
| Reportería | Lectura del operativo. No es un circuito de aprobación ni un segundo registro. | Vistas y consultas. |

La persona puede tener varias referencias y varios casos a lo largo del tiempo. Un caso puede tener muchas atenciones. Una atención grupal se registra una vez. Vigilancia, nutrición, EDIN II y EVADE no abren un caso y no se redigitan.

### 1.2 Agregados

1. **Referencia enviada.** Existe solo después del envío digital. El borrador no es una referencia.
2. **Sesión y sus asuntos.** La sesión puede nacer sin asuntos e incorporar después referencias o casos del ámbito, sin duplicar el mismo asunto.
3. **Valoración confirmada.** Queda ligada a la sesión y a la referencia o al caso analizado. Antes de confirmar, vive en borrador.
4. **Resolución.** Una decisión confirmada por referencia, con justificación obligatoria cuando no requiere A.I.
5. **Caso.** Nace en la admisión o en la continuidad por traslado. Conserva el estado actual y apunta a la decisión profesional vigente y al plan vigente.
6. **Atención individual.** Hecho de un caso activo.
7. **Atención grupal.** Hecho de la Oficina Local, con disciplinas, profesionales y participantes.
8. **Programación.** Actividad de la Oficina Local, con sujetos opcionales y transiciones de estado.
9. **Traslado.** Puente entre el caso de origen y, si destino confirma, el caso nuevo.
10. **Configuración publicada.** Catálogos, instrumento de valoración, matriz de prioridad y rangos de edad analíticos.
11. **Migración.** Lote controlado, separado de la operación nativa.

Documentos, coordinaciones y reportes de caso son entidades propias dentro del agregado del caso. La línea de tiempo no es un agregado de escritura: es una lectura cronológica de hechos ya guardados.

### 1.3 Relaciones y cardinalidades

| Relación | Cardinalidad | Carácter |
| --- | --- | --- |
| Persona institucional → referencias | 1:N | Histórica. La persona no se duplica en SIA. |
| Persona institucional → casos | 1:N | Una persona puede tener más de un episodio. |
| Referencia → motivos | 1:N | N:M resuelta con entidad asociativa y especificación por motivo. |
| Referencia → servicios congelados | 1:N | Snapshot. |
| Referencia → resolución confirmada | 1:0..1 | Una resolución confirmada por referencia. |
| Referencia → casos | 1:N | Un caso de admisión y, si hay traslados posteriores, casos de continuidad que conservan el consecutivo de origen. |
| Sesión → disciplinas | N:M | Entidad asociativa. |
| Sesión → asuntos | 1:N | Cada asunto apunta a una referencia, a un caso o a ambos, sin repetir el mismo par. |
| Valoración → categorías respondidas | 1:N | Una respuesta por categoría del instrumento. |
| Valoración → factores seleccionados | 1:N | Solo cuando la respuesta de la categoría es de factores. |
| Caso → decisiones profesionales | 1:N | Append-only. El caso apunta a la vigente. |
| Caso → versiones de plan | 1:N | Append-only. El caso apunta a la vigente, que puede no existir todavía en una continuidad. |
| Caso → atenciones individuales | 1:N | Hechos. |
| Atención grupal → participantes | 1:N | Asistencia por persona. El caso del participante es opcional. |
| Atención grupal → disciplinas y profesionales | N:M | No son excluyentes. |
| Caso de origen → traslado | 1:0..1 | El traslado cierra ese episodio. |
| Traslado → caso de destino | 1:0..1 | Nace al confirmar la continuidad. |
| Caso → documentos, coordinaciones, reportes | 1:N | El reporte no cambia el estado del caso. |
| Actividad programada → sujetos | 1:N opcional | Sin sujetos, la actividad es general. |
| Actividad programada → transiciones | 1:N | Reprogramación y cancelación conservan motivo. |
| Versión de matriz → celdas | 1:N | Una celda por par riesgo-protección. |
| Ítem de catálogo → conjuntos publicados | N:M | El ítem es estable; el conjunto dice qué estaba vigente. |

### 1.4 Hechos, estado actual e historia

| Dato | Tratamiento |
| --- | --- |
| Envío de referencia, consecutivo, responsable y contexto de ese momento | Hecho inmutable. |
| Estado de la referencia (`Pendiente de revisión`, `Admitida a A.I.`, `No requiere A.I.`) | Estado actual de la referencia, avanzado por la resolución o la admisión. No existe estado manual `Recibida` ni resultado `Rechazada`. |
| Valoración confirmada, factores y respuesta `Ninguno` | Hecho inmutable. Una revaloración futura sería otra valoración. |
| Riesgo, protección y prioridad del caso | Decisión profesional append-only. El caso muestra la vigente. |
| Plan | Versiones inmutables. El caso muestra la vigente. |
| Estado del caso | Estado actual más evento de apertura o cierre. |
| Atención, coordinación, documento, reporte, traslado | Hechos. La coordinación conserva además los cambios de su estado. |
| Programación | Estado actual más transición inmutable. |
| Catálogo e instrumento | Ítems estables y conjuntos publicados. La selección guarda la etiqueta usada. |
| Edad actual, actividad vencida, última atención, personas únicas, totales | Derivados de consulta. No se guardan como verdad operativa. |
| Sugerencia automática de riesgo o protección | Exploratoria. No tiene tabla en este modelo. |

`updated_at` no sustituye historia. Las filas confirmadas de atención, valoración, referencia enviada y traslado no se borran para “corregir” el pasado.

### 1.5 Qué puede cambiar y qué se congela

Pueden cambiar, con rastro:

- el estado de la referencia, cuando el equipo resuelve o admite;
- el estado del caso, al cerrar o al cerrar por traslado;
- la decisión vigente y el plan vigente, si más adelante se valida que el equipo puede actualizarlos;
- el estado de una coordinación;
- la fecha, el estado y el motivo de una actividad programada;
- la publicación del catálogo vigente, sin reescribir selecciones anteriores.

Se congelan al enviar la referencia:

- identificación, nombre, nacimiento, sexo y edad de referencia cuando existan;
- persona encargada, relación, contacto y dirección cuando existan;
- modalidades o servicios;
- Región, Oficina Local, establecimiento y los nombres o códigos usados en el consecutivo;
- responsable autenticado;
- fecha y hora de envío y usuario remitente.

Se congelan al ocurrir el hecho:

- la valoración y su instrumento;
- la prioridad calculada, los dos niveles profesionales y la versión de matriz;
- la atención, con fecha real distinta de la fecha de digitación;
- el traslado y el cierre;
- la etiqueta de catálogo seleccionada.

### 1.6 Datos externos, snapshots y derivados

| Información | Tratamiento | Motivo |
| --- | --- | --- |
| Identidad y ficha vigente de la persona | Consulta dinámica | RF-001, RF-011, RF-102. Evita un padrón paralelo. |
| Ubicación y servicios vigentes | Consulta dinámica | El perfil operativo muestra el período institucional. |
| Establecimientos autorizados del usuario | Proveedor de autorización, fuera de SIA y fuera de `SIDINACC_LOCAL` | RF-104. SIA no mantiene la asignación. |
| Contexto de la referencia | Snapshot | RF-116. El documento histórico sobrevive a cambios maestros. |
| Resultado de vigilancia, EDIN II o EVADE | Consulta dinámica y vínculo mínimo si se inicia una referencia | RF-127 y RF-102. No se copia la ficha ni se recalcula. |
| Prioridad A.I. | Derivada de la matriz y persistida como evidencia | RF-118 y RF-100. |
| Edad mostrada en la referencia | Persistida junto con la fecha de nacimiento congelada | El impreso debe poder mostrar la edad de ese día. |
| Edad de casos activos en reportería | Derivada en la consulta | RF-089. El rango es configuración analítica. |
| Última atención y casos sin atención | Derivados | RF-125 y RF-126. |
| Actividad vencida | Derivada: sigue `Programada` y la fecha prevista ya pasó | RF-080. |
| Color del semáforo | Presentación de Alto, Moderado y Bajo | RF-118. No es un dato. |

### 1.7 Configuración y auditoría

Catálogos configurables, con vigencia por conjunto publicado:

- motivos de referencia y sus categorías;
- disciplinas;
- estrategias;
- frecuencias;
- tipos de actividad programada;
- tipos de atención grupal;
- motivos de cancelación;
- instituciones externas;
- tipos documentales;
- tipos o propósitos de reporte;
- motivos de cierre;
- motivos de traslado;
- vía de atención y origen de la referencia;
- estados de coordinación, cuando se definan.

Enumeraciones técnicas estables, porque el proceso vigente les fija el significado y cambiarlas altera reglas ya modeladas:

- estado de referencia;
- estado de caso;
- base de apertura del caso: admisión, continuidad por traslado o migración;
- respuesta de categoría: factores o `Ninguno`;
- estado de programación: Programada, Realizada, Reprogramada, Cancelada;
- estado de traslado: pendiente de continuidad o continuidad confirmada;
- escalas de riesgo, protección y prioridad, referenciadas por la matriz.

La matriz de prioridad se versiona. El instrumento de factores se versiona. Los rangos de edad analíticos se versionan como configuración de consulta, no como clasificación clínica de la persona.

La auditoría de negocio queda en el propio hecho: quién lo registró, quién era el responsable profesional cuando son distintos, fecha del hecho y fecha de digitación. Las impresiones y generaciones documentales quedan en un registro aparte del envío. Los borradores se pueden descartar. No hay borrado lógico universal.

### 1.8 Clasificación de alcance

| Tema | Clasificación |
| --- | --- |
| Referencia, sesión, valoración, resolución, caso, plan, atenciones, documentos, coordinaciones, traslado con continuidad, reportes, cierre, programación, reportería, catálogos y migración controlada | CONFIRMADO en la especificación 0.6, con huecos marcados abajo. |
| Sugerencia orientativa de riesgo y protección | EXPLORATORIO. La especificación la mantiene fuera de la decisión profesional y remite a una sección 17.9 que no está en los dos documentos leídos. |
| Asistente conversacional, RF-105 a RF-111 y CU-35 | EXPLORATORIO / posterior a 2027. Fuera de implementación 2026. |
| Texto completo de RN-009, lista cerrada de disciplinas, estrategias, frecuencias, tipos de actividad y categorías requeridas del instrumento | NEEDS_VALIDATION. La especificación exige la matriz y los catálogos, y no trae su contenido exhaustivo. |
| Qué ocurre si destino no continúa el caso | NEEDS_VALIDATION. |
| Si el plan, el riesgo y la prioridad se heredan, se reconfirman o solo se consultan en origen | NEEDS_VALIDATION. |
| Si puede haber más de un caso activo para la misma persona | NEEDS_VALIDATION. |
| Si la prioridad puede cambiar después de la apertura | NEEDS_VALIDATION. |
| Atribución territorial de una grupal cuando se filtra por establecimiento | NEEDS_VALIDATION. |
| Motor de puntajes, admisión automática, módulo de calidad regional, SNOMED, OCR y modo offline | FUERA_DE_ALCANCE. |

---

## 2. Criterios usados para diseñar

1. Representar el proceso, no las pantallas.
2. No duplicar SIDINACC. Congelar solo el contexto que un documento o una decisión histórica debe poder mostrar después.
3. Distinguir persona, episodio de responsabilidad y hecho de atención.
4. Conservar quién, cuándo, en qué territorio y con qué regla se tomó una decisión.
5. Calzar con SQL Server sin event sourcing, sin EAV de negocio y sin JSON como modelo de los hechos confirmados.
6. Dejar una extensión pequeña para lo exploratorio, sin tablas de una función no aprobada.
7. Preferir el modelo que un equipo pueda implementar, explicar y auditar.

---

## 3. Respuestas explícitas

### 3.1 ¿Cuál es la unidad longitudinal principal?

La unidad longitudinal de identidad es la persona institucional. La unidad longitudinal de gestión que el proceso nombra, abre, cierra, lista y cuenta es el caso A.I. Varios casos de la misma persona, unidos por traslados, reconstruyen la continuidad cuando destino la confirma.

### 3.2 ¿Caso A.I. y episodio territorial deben ser la misma entidad?

Sí, en el modelo elegido. CU-20 cierra el caso de origen. CU-21 crea un caso activo nuevo y prohíbe reabrir o alterar el anterior. El caso vigente en los requerimientos es la responsabilidad de una Oficina Local, no un expediente único que cambia de oficina.

### 3.3 ¿Cómo debe representarse un traslado sin perder histórico?

Un traslado es una fila propia. Apunta al caso de origen, que queda cerrado por traslado con su historia intacta, y guarda destino, fecha y motivo. Al confirmar la continuidad apunta al caso nuevo. Las atenciones, la valoración y el plan de origen siguen en el caso de origen y se consultan por ese vínculo.

### 3.4 ¿Qué debe ocurrir cuando destino no continúa el caso?

La especificación no define rechazo, devolución, vencimiento ni reapertura de origen. El traslado permanece `Pendiente de continuidad` y no se crea caso en destino. El caso de origen ya fue cerrado al registrar el traslado. Inventar un desenlace sería una regla institucional nueva. Queda `NEEDS_VALIDATION`.

### 3.5 ¿Cómo representar una atención grupal sin duplicar registros?

Una fila de atención grupal contiene lo común. Las personas están en participantes, con asistencia. Si el participante tiene un caso activo en ese momento, el participante apunta a ese caso. La línea de tiempo del caso lee esa participación. La reportería cuenta el registro base una vez y cuenta como persona atendida solo a quien asistió.

### 3.6 ¿Cómo asociar múltiples disciplinas y profesionales?

La sesión, el plan y la atención grupal usan tablas asociativas. La atención individual, según RF-068, registra una disciplina y una estrategia. El filtro analítico por disciplina no asume exclusividad: una grupal con dos disciplinas puede aparecer en ambos grupos y esa suma no es una partición.

### 3.7 ¿Qué parte de una referencia debe ser snapshot?

La parte necesaria para reimprimir y explicar la referencia aunque cambie el maestro: identidad visible, edad de referencia, sexo, encargada y su relación, contacto, dirección, servicios, territorio y códigos del consecutivo, más el responsable y el comprobante de envío. El resto de la ficha institucional se consulta en la fuente.

### 3.8 ¿Cómo preservar versiones de instrumentos y factores?

El factor tiene identidad estable. La versión del instrumento publica qué categorías y factores estaban vigentes y cuáles categorías eran requeridas. La valoración guarda la versión usada. Cada factor elegido guarda la etiqueta de ese momento.

### 3.9 ¿Cómo modelar `Ninguno`?

`Ninguno` es el estado de respuesta de una categoría revisada, no un factor y no un valor nulo.

- Sin fila de respuesta: la categoría requerida sigue pendiente.
- Respuesta `NINGUNO`: fue revisada y no hay factores aplicables.
- Respuesta `FACTORES`: existen una o más selecciones y no puede coexistir `NINGUNO`.

Así se distinguen pendiente, revisión negativa explícita y selección positiva, que es la regla descrita para RN-008.

### 3.10 ¿La prioridad debe persistirse o derivarse?

Se calcula con la matriz y se persiste. Si solo se derivara al consultar, un cambio posterior de la matriz reescribiría decisiones ya tomadas. RF-100 pide conservar la interpretación histórica.

### 3.11 Si se persiste, ¿qué evidencia necesita?

Cada decisión profesional guarda nivel de riesgo, nivel de protección, prioridad resultante, versión de matriz, valoración de respaldo cuando existe, actor, fecha y, si la decisión cita otra, la decisión de origen. El caso apunta a la decisión vigente. La primera decisión de una admisión se escribe al abrir el caso. Corregir riesgo o protección antes de confirmar no genera caso: sigue en el borrador.

### 3.12 ¿Cómo separar una sugerencia futura de la decisión profesional?

La decisión vive en `caso_decision_profesional` y en los niveles de la valoración. Una sugerencia futura sería otra entidad, colgando de la valoración, con metodología, versión, resultado, fecha y contexto, sin permiso de escritura sobre la decisión profesional. No se crea esa tabla ahora. No hay pesos ni puntajes.

### 3.13 ¿Qué derivados no deberían almacenarse?

Edad corriente, semáforo, actividad vencida, última atención, casos sin atención, personas únicas, total de atenciones, embudo de referencias, conteos de inicio y consolidaciones. Se calculan al consultar. La edad de la referencia sí se guarda porque forma parte del documento histórico.

### 3.14 ¿Qué necesita auditoría explícita?

Envío de referencia, impresión o generación documental, resolución, apertura, decisión profesional, cierre, traslado, confirmación de continuidad, atención, coordinación, documento, reporte de caso, publicación de catálogo o matriz, y migración. En cada uno: actor que registra, responsable profesional cuando difiere, fecha del hecho y fecha de registro.

### 3.15 ¿Qué necesita historial propio?

Decisiones profesionales, versiones de plan, eventos de estado del caso, transiciones de programación, estados de coordinación, valoraciones confirmadas, conjunto publicado de catálogo e instrumento, y versiones de matriz. La referencia enviada, la atención y el traslado no se versionan: se corrige un borrador antes de confirmar o se agrega un hecho nuevo.

### 3.16 ¿Qué catálogos necesitan vigencia?

Los de la sección 1.7. Además, el instrumento y la matriz. Riesgo, protección y prioridad tienen filas de escala para que la matriz pueda referenciarlas, y sus códigos vigentes están fijados por RF-119 y HU-020. Agregar un nivel nuevo exige una versión de matriz y validación institucional; no es un texto libre.

### 3.17 ¿Qué datos pertenecen a SIDINACC y cuáles a SIA?

SIDINACC posee persona, familia, período, establecimiento, Oficina Local, Región, servicios del período y, cuando se integre, resultados de vigilancia o tamizaje. El mecanismo de establecimientos autorizados pertenece a la autorización institucional, todavía no precisada por UTIC. SIA posee el proceso de A.I.: referencia, sesión, valoración, resolución, caso, plan, atenciones, programación, traslado, documentos, coordinaciones, reportes, cierre, catálogos del módulo y auditoría de ese proceso.

### 3.18 ¿Qué debe congelar SIA aunque venga de SIDINACC?

El contexto de la referencia enumerado en 3.7, los identificadores territoriales de la responsabilidad del caso y los nombres de origen y destino en el traslado. El caso no sigue la mudanza administrativa de la ficha familiar. Cambiar de Oficina Local responsable es un traslado.

### 3.19 ¿El modelo permite reportería sin sacrificar el operativo?

Sí. El operativo queda en las tablas de hechos y de estado. La reportería usa consultas y vistas lógicas sobre esas tablas, filtradas por los identificadores territoriales guardados en el caso, la referencia, la atención y la programación. No se crea un modelo estrella ni se desnormaliza el operativo para los indicadores.

### 3.20 ¿Qué decisión sería más costosa de cambiar?

Tratar el caso como episodio territorial, con caso nuevo en destino, es la decisión más cara de revertir si más adelante se exigiera un único identificador de caso nacional que nunca se cierra. Revertirla obliga a redefinir listas, cierres y conteos de casos. Mitigación: el traslado ya encadena los episodios, así que un identificador de trayectoria puede agregarse después y rellenarse con esa cadena. Más caro todavía sería haber copiado toda la historia clínica en cada destino o haber guardado el proceso completo como event sourcing: el primero parte la historia; el segundo dificulta las reglas de integridad que el proceso sí necesita.

---

## 4. Tres propuestas

Las tres cubren el mismo proceso. Cambian la pieza que organiza la persistencia.

### 4.1 Propuesta 1 — Episodios operativos e historia selectiva

**Concepto.** Cada agregado del proceso guarda su estado actual cuando ese estado se consulta todo el tiempo, y guarda un hecho inmutable cuando lo que importa es lo que ocurrió. El caso es el episodio territorial. La persona, por su identificador institucional, y la cadena de traslados reconstruyen la continuidad.

**Entidades principales.** Referencia con snapshot, sesión, valoración, resolución, caso, decisión profesional, plan versionado, atención individual, atención grupal con participantes, programación con transiciones, traslado, documentos, coordinaciones, reportes, catálogos publicados, instrumento, matriz y lotes de migración.

**Relaciones clave.** Las de la sección 1.3.

**Histórico.** Hechos append-only más versiones donde el proceso habla de “vigente”: decisión y plan. La línea de tiempo es una vista.

**Traslados.** Caso origen cerrado, caso destino nuevo, fila de traslado. La historia de origen no se mueve.

**Atenciones grupales.** Un registro base y participantes. El historial individual es una lectura.

**Valoración.** Instrumento versionado. `Ninguno` es respuesta de categoría. Riesgo y protección son niveles profesionales. La prioridad se calcula, se guarda con la versión de matriz y no se edita a mano.

**Catálogos.** Ítem estable, conjunto vigente y etiqueta congelada en la selección.

**Auditoría.** Columnas de actor y fechas en el hecho, más registro de salidas documentales.

**Reportería.** Consultas de embudo, casos, personas distintas y atenciones, con la grupal contada una vez.

**SIDINACC.** Identificador de persona y de territorio, sin copia de la ficha y sin llave foránea entre bases.

**Exploratorios.** La sugerencia futura se puede colgar de la valoración. El asistente futuro lee vistas autorizadas y, si se aprueba, registra su traza en una tabla nueva.

**Ventajas.** Sigue el lenguaje de casos de uso. Las reglas de unicidad y de estado se pueden proteger en SQL Server. La reportería operativa es directa.

**Desventajas.** La continuidad entre oficinas se consulta recorriendo traslados, no mediante una sola fila de “necesidad”. Una revaloración o un cambio de prioridad posteriores necesitan reglas que la especificación todavía no cierra.

**Complejidad.** Media. Hay varias tablas asociativas porque las cardinalidades son reales.

**Riesgos.** Heredar de más al confirmar un traslado, o de menos y dejar el caso destino sin prioridad visible. Ese punto queda explícitamente pendiente.

**Evolución que facilita.** Nuevos catálogos, nuevas versiones de instrumento y de matriz, nuevos tipos de atención y una sugerencia desacoplada.

### 4.2 Propuesta 2 — Hilo de necesidad y episodios de responsabilidad

**Concepto.** Encima del caso existe una trayectoria de la necesidad de A.I. El caso sigue siendo el episodio de una Oficina Local. La trayectoria nace en la primera admisión y agrupa los episodios unidos por traslado.

**Entidades principales.** Las de la propuesta 1, más `trayectoria_ai` y la obligación de que todo caso pertenezca a una trayectoria.

**Relaciones clave.** Persona 1:N trayectorias, trayectoria 1:N casos, traslado une dos casos de la misma trayectoria.

**Histórico.** Igual que la propuesta 1 dentro de cada episodio. La trayectoria aporta el hilo explícito.

**Traslados.** El origen cierra su episodio. Destino abre otro episodio de la misma trayectoria. Si destino no continúa, la trayectoria queda sin episodio activo.

**Atenciones grupales.** Igual que la propuesta 1. La atención sigue colgando del episodio, no de la trayectoria.

**Valoración, catálogos, auditoría e integración.** Iguales a la propuesta 1.

**Reportería.** Permite contar “necesidades” además de casos y personas. También obliga a definir esa métrica, que los requerimientos no piden. Los conteos confirmados son de casos, referencias, personas únicas y atenciones.

**Exploratorios.** La trayectoria sería un buen sujeto para una analítica de continuidad. También es una entidad no nombrada por el proceso.

**Ventajas.** La pregunta “esta atención es la misma necesidad en otra oficina” tiene una llave propia. Un identificador longitudinal estable aparece desde el primer día.

**Desventajas.** Introduce un concepto que HU-028, HU-029, CU-20 y CU-21 no usan. Riesgo de contar dos veces, o de discutir si una referencia nueva de la misma persona abre otra trayectoria. Esa regla no está dada.

**Complejidad.** Media-alta, sobre todo en las reglas de apertura de trayectoria.

**Riesgos.** Convertir una comodidad de consulta en una regla de negocio aparente. Si la institución luego define la continuidad de otra manera, la trayectoria ya habría partido los datos.

**Evolución que facilita.** Indicadores de continuidad y de reingreso, cuando existan. No facilita mejor el operativo diario que la propuesta 1.

### 4.3 Propuesta 3 — Bitácora de dominio y proyecciones de estado

**Concepto.** Cada acción profesional se agrega a una bitácora inmutable. Las pantallas de caso, referencia y bandeja leen proyecciones reconstruidas desde esa bitácora.

**Entidades principales.** `evento_dominio` con tipo, sujeto, carga del hecho y metadatos de actor y tiempo. Tablas de proyección para el estado actual de referencia, caso, plan y programación. Las asociativas de participantes y de catálogos siguen existiendo, o también se proyectan.

**Relaciones clave.** El evento apunta a un sujeto. Las proyecciones apuntan al último evento aplicado. Las reglas entre casos y traslados viven en el proyector, no en llaves que impidan un estado inválido por sí solas.

**Histórico.** Completo por construcción. Cualquier atributo se puede reconstruir si fue emitido como evento.

**Traslados.** Un evento cierra la proyección de origen y otro, al confirmar, crea la proyección de destino. La cadena es la secuencia de eventos.

**Atenciones grupales.** Un evento de actividad y un evento por participante, o un evento con el conjunto de participantes. Hay que fijar una convención para no duplicar el hecho analítico.

**Valoración.** Cada confirmación es un evento. `Ninguno`, la matriz y la prioridad son cargas del evento. La constraint de exclusión de `Ninguno` queda en la aplicación o en el proyector.

**Catálogos.** También pueden ser eventos de publicación. Las proyecciones materiales conservan la versión.

**Auditoría.** La bitácora es la auditoría. Hace falta disciplina para no meter en ella borradores ni datos que no debían persistir.

**Reportería.** Flexible hacia atrás. Las consultas de bandeja, unicidad y conteo dependen de que la proyección esté al día. Un error de proyección corrompe la operación aunque la bitácora esté bien.

**SIDINACC.** El snapshot sigue siendo necesario dentro del evento de envío. La bitácora no elimina la frontera con la fuente.

**Exploratorios.** Una sugerencia es otro tipo de evento y no pisa el evento de decisión. Es la opción más cómoda para analítica futura y para un asistente de solo lectura sobre historia.

**Ventajas.** Cambia poco el esquema cuando aparece un hecho nuevo. La reconstrucción temporal es uniforme.

**Desventajas.** SQL Server deja de proteger gran parte del dominio: una referencia con dos admisiones, un `Ninguno` acompañado de factores o una grupal sin tema se vuelven cargas válidas hasta que el proyector las rechace. La operación de CEN-CINAI es de expediente y de reglas, no de un flujo de miles de eventos por segundo. El costo de implementación y de prueba es el de dos modelos.

**Complejidad.** Alta.

**Riesgos.** Sobreingeniería. Divergencia entre bitácora y proyección. Dificultad para explicar el modelo al equipo funcional.

**Evolución que facilita.** Nuevos hechos y explotación analítica. Dificulta las reglas de integridad confirmadas.

---

## 5. Comparación

Escala de 1 a 5. Un 5 es más favorable para este sistema. En complejidad, riesgo de sobreingeniería y facilidad de implementación, 5 significa menor carga.

| Criterio | P1 Episodios | P2 Hilo + episodios | P3 Bitácora |
| --- | ---: | ---: | ---: |
| Cobertura de requerimientos confirmados | 5 | 4 | 4 |
| Claridad conceptual | 5 | 3 | 2 |
| Normalización | 4 | 4 | 3 |
| Integridad referencial | 5 | 5 | 2 |
| Trazabilidad | 4 | 5 | 5 |
| Histórico | 4 | 4 | 5 |
| Traslados | 5 | 5 | 4 |
| Atenciones grupales | 5 | 5 | 4 |
| Versionamiento | 5 | 5 | 3 |
| Reporterías | 5 | 4 | 3 |
| Integración con SIDINACC | 5 | 5 | 4 |
| Facilidad de consultas | 5 | 4 | 2 |
| Compatibilidad SQL Server | 5 | 5 | 3 |
| Mantenibilidad | 5 | 3 | 2 |
| Evolución futura | 4 | 4 | 5 |
| Exploratorios | 4 | 4 | 5 |
| Complejidad (5 = más simple) | 4 | 3 | 1 |
| Riesgo de sobreingeniería (5 = menor) | 4 | 3 | 1 |
| Facilidad de implementación | 4 | 3 | 1 |

P2 gana una llave longitudinal que el proceso no pide y pierde claridad. P3 gana reconstrucción uniforme y pierde integridad, consultas y costo. P1 cubre el proceso confirmado con la historia que ese proceso realmente distingue.

---

## 6. Decisión

Se selecciona la **propuesta 1**.

Gana porque el caso de uso ya resolvió la pieza más difícil: el traslado cierra un caso y, si hay continuidad, abre otro. La propuesta 1 toma esa pieza tal como está, le pone hechos inmutables donde el proceso exige memoria y versiones donde el proceso habla de vigencia. La prioridad queda guardada con su matriz. La grupal no se copia por persona. SIDINACC no se clona.

### Qué se pierde al no elegir la propuesta 2

Se pierde un identificador único de la necesidad a través de las oficinas. Las preguntas de continuidad se responden recorriendo `caso_traslado` y el caso predecesor. Con el volumen de CEN-CINAI, 9 regiones y 41 oficinas locales, ese recorrido es viable. Si más adelante la institución define la trayectoria como concepto propio, se puede agregar sin reescribir las atenciones.

### Qué se pierde al no elegir la propuesta 3

Se pierde la captura automática de cualquier cambio no previsto. Solo queda historia donde el modelo la declaró: decisión, plan, estado del caso, programación, coordinación, valoración y catálogo. Un cambio de un texto libre ya confirmado no se reconstruye solo. Esa pérdida es aceptable: los textos confirmados son hechos, y los cambios de vigencia tienen tabla propia.

---

## 7. Revisión para SQL Server

La revisión se aplicó sobre la propuesta 1, ya elegida, antes de fijar el modelo detallado. Plataforma de destino: Microsoft SQL Server, alineada con la plataforma documentada de SIDINACC/CAH y con el pedido de esta evaluación. La elección de motor del producto sigue sujeta al pendiente de stack del bootstrap si todavía no existe un ADR; este diseño no la sustituye.

### Hallazgos críticos

1. Las personas y el territorio institucional no pueden tener llave foránea hacia `SIDINACC` o `SIDINACC_LOCAL`. Son identificadores verificados por el adaptador en el momento de escribir.
2. Un borrado en cascada destruiría historia clínica. Las filas confirmadas no se borran en cascada.
3. El consecutivo institucional compite entre usuarios del mismo establecimiento y año. Hace falta un contador transaccional con bloqueo de actualización, no un `MAX() + 1` sin aislamiento.
4. `Ninguno` no puede ser una fila de factor. La exclusión se expresa con la respuesta de categoría y con la ausencia de factores de esa categoría.
5. La prioridad guardada sin versión de matriz pierde sentido cuando la matriz cambie.
6. La fecha del hecho y la fecha de digitación son columnas distintas.
7. El caso guarda el territorio responsable. No se obtiene, en cada consulta operativa, del establecimiento actual de la familia.
8. Debe existir como máximo un caso de admisión por referencia. Los casos de continuidad pueden apuntar a la misma referencia de origen para conservar el consecutivo.

### Hallazgos importantes

1. Llave sustituta `bigint` identidad para las filas propias de SIA. El consecutivo, el identificador de persona y los códigos de catálogo son llaves naturales alternas, no la llave primaria: nacen en momentos distintos y algunas filas existen antes del consecutivo solo como borrador, fuera de la tabla de referencia.
2. No usar `uniqueidentifier` como identidad por defecto. No hay fusión distribuida que lo exija.
3. `rowversion` en referencia, caso, sesión, coordinación, actividad programada y borrador, que son las filas editadas por más de un paso o por más de una persona.
4. La decisión vigente y el plan vigente forman un ciclo con el caso. El apuntador en el caso es nulo hasta que existe la fila hija. El orden de alta es caso, fila hija, actualización del apuntador.
5. Índices filtrados para admisión única por referencia, un conjunto vigente por tipo de catálogo, traslados pendientes y actividades programadas.
6. `nvarchar(max)` solo en narrativas clínicas, justificación, información complementaria y carga de borrador.
7. Instantes en `datetime2`. Fechas institucionales en `date`. Horas de sesión en `time`. Sin `datetime`, `float`, `text`, `ntext` ni `image`.
8. La etiqueta mostrada del catálogo se copia en la selección. Renombrar un ítem no reescribe valoraciones anteriores.
9. Los niveles de riesgo, protección y prioridad no se guardan como texto libre.

### Mejoras opcionales, no incorporadas al núcleo

1. Row-level security de SQL Server como defensa adicional del ámbito. La autorización de negocio sigue siendo obligatoria en la capa de servicio.
2. Vistas indexadas de última atención o de bandejas, cuando haya medición.
3. Tablas temporales del sistema. No reemplazan la versión de plan ni la matriz: esas versiones son funcionales, no una foto técnica de la fila.
4. Un almacén analítico posterior. Fuera de este diseño.

### Decisión de la revisión

`APPROVED_WITH_CHANGES`

Los cambios críticos e importantes quedan incorporados en `DATABASE_DESIGN_SELECTED.md` y en los diagramas. No queda un segundo modelo “antes de la revisión”.

### Índices que la operación realmente usa

- Referencias por Oficina Local, estado y fecha de envío.
- Referencias por establecimiento y estado.
- Consecutivo único.
- Casos por Oficina Local, estado y prioridad.
- Casos por establecimiento y estado.
- Casos por persona y fecha de apertura.
- Atenciones individuales por caso y fecha real.
- Participantes grupales por persona, por caso y por asistencia.
- Traslados por Oficina Local destino y estado.
- Programación por Oficina Local, estado y fecha.
- Decisiones y planes por caso.
- Ítems de catálogo por tipo y código.

No se indexa cada llave foránea por reflejo. Las asociativas pequeñas de un caso se alcanzan por la llave del padre.

### Concurrencia

El contador de consecutivo se actualiza en la misma transacción del envío, tomando la fila del establecimiento y año con bloqueo de actualización. El `rowversion` del caso, de la sesión y de la programación detecta dos ediciones simultáneas. No se diseña un bloqueo de aplicación.

### Nulabilidad

Un nulo significa ausencia de ese vínculo o de ese dato de fuente, y el nombre de la columna lo acota.

- Snapshot nulo: la fuente no traía ese dato. No significa “desconocido clínico” ni “no aplica” por sí solo.
- `caso_id` nulo en un participante grupal: la persona no tenía caso activo que vincular.
- `plan_vigente_id` nulo: el episodio todavía no tiene plan propio.
- Justificación nula solo es válida cuando la resolución es que sí requiere A.I.
- La respuesta `Ninguno` no se representa con nulo.

---

## 8. Cobertura de la especificación y de los casos de uso

| Capacidad confirmada | Representación |
| --- | --- |
| HU-001 a HU-012, CU-01 a CU-03, RF-001 a RF-020, RF-112, RF-113, RF-124 | Identificador institucional, ámbito en cada fila operativa, perfil por consulta a SIDINACC. La encargada no es un caso. |
| HU-013 a HU-018, CU-04 a CU-06, RF-021 a RF-037, RF-114 a RF-117 | `referencia`, motivos, servicios congelados, consecutivo, salidas de impresión. |
| HU-049, CU-37, RF-127 | `vinculo_deteccion_referencia`. El resultado fuente no se copia. |
| HU-019 a HU-022, CU-07 a CU-10, RF-038 a RF-048, RF-118 a RF-120 | Sesión, valoración, respuesta por categoría, resolución, caso, decisión y plan. |
| HU-023 a HU-025, HU-032 a HU-035, CU-11 a CU-17 | Consultas del caso. El detalle interno no está en otra tabla “de establecimiento”; el permiso es de lectura. |
| HU-026 a HU-027, CU-18 a CU-19 | Documento y coordinación. |
| HU-028 a HU-029, CU-20 a CU-21 | `caso_traslado` y caso nuevo. |
| HU-030 a HU-031, CU-22 a CU-23 | Reporte independiente del cierre. Evento de estado. |
| HU-048, CU-36, RF-125, RF-126 | Consulta sobre atenciones y asistencia. La programación no entra en ese predicado. |
| HU-036 a HU-037, CU-24 a CU-25 | Atención individual y grupal. |
| HU-044 a HU-046, CU-26 a CU-28 | Programación, sujetos explícitos y transiciones. |
| HU-038 a HU-043, CU-29 a CU-32 | Vistas lógicas de lectura. Sin tablas de consolidado. |
| CU-33, RF-099, RF-100 | Conjuntos, instrumento y matriz. |
| CU-34, RF-101 | Lote e incidencias. |
| RF-097, RF-098 | Actores, fechas y borrador. |
| RF-103, RF-104 | Columnas de ámbito para autorizar en servicio. Sin tabla paralela de establecimientos autorizados. |
| P-01 a P-18 | Un caso con muchas atenciones; grupal única; traslado que cierra responsabilidad; reporte distinto de cierre; prioridad distinta de vía de atención. |

Quedaron sin convertir en requisito: la sugerencia de la línea 17.9, el asistente conversacional y cualquier puntaje automático. El vínculo de detección no abre casos. Marcar una actividad como realizada no crea una atención.

---

## 9. Validación final de esta lectura

- Cada flujo confirmado de referencia, sesión, valoración, caso, atención, programación, traslado, reporte y cierre tiene una entidad de escritura.
- `Ninguno`, la grupal y el traslado cumplen las reglas explícitas de la versión 0.6.
- Los exploratorios tienen un punto de extensión y no tienen tabla operativa.
- La matriz RN-009 no fue inventada: solo su contenedor versionado.
- Este documento no implementa tablas físicas.

Detalle del modelo elegido, entidades y diagramas: `DATABASE_DESIGN_SELECTED.md`, `DATABASE_DESIGN_SELECTED.dbml` y `DATABASE_DESIGN_SELECTED.mmd`.
