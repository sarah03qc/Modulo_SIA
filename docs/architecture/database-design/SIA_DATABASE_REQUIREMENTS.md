# Inventario de necesidades de persistencia — SIA_CENCINAI

**Estado del documento:** PROPUESTO como insumo de diseño. No es aprobación institucional ni DDL.
**Fecha de análisis:** 2026-11-03
**Aclaración 2026-11-05:** Alina confirmó que el consecutivo se digita. Este inventario queda alineado con esa regla. Las tres propuestas candidatas no se reescribieron: siguen describiendo el contador que después se retiró del diseño seleccionado.
**Base a diseñar:** persistencia propia de Atención Interdisciplinaria. Nombre de trabajo `SIA_CENCINAI`.
**Base que no se diseña aquí:** `SIDINACC_LOCAL` / CAH.

## 1. Fuentes leídas y autoridad

| Orden | Fuente | Uso en este inventario |
| --- | --- | --- |
| 1 | `docs/functional/FUNCTIONAL_SPEC_v0.7.md` secciones 1–9 y 11–21 | Decisiones funcionales vigentes. Incluye HU, RF, RN, RNF, modelo conceptual, reportería y pendientes. |
| 2 | `docs/functional/USE_CASES_v0.7.md` sección 10 | Flujos y poscondiciones. No contradice el cierre por traslado ni la unicidad global. CU-21 permanece como registro histórico retirado. |
| 3 | `docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md` | Frontera de lectura institucional y contrato `PER_idPersona`. |
| 4 | `database/sidinacc-local/README.md`, `DATASET_SUMMARY.md`, `010_schema_core.sql` | Superficie real de la réplica: 15 tablas, clave `PER_idPersona nvarchar(20)`. |
| 5 | `AGENTS.md`, `docs/agent-workflow/workflow.md`, `sources-and-validation.md`, `quality-gates.md`, reglas `.cursor/rules/` | Jerarquía, trazabilidad, seguridad y límites de alcance. |

El prototipo navegable no está como código en este repositorio. No se copió almacenamiento local, objetos de interfaz ni datos sintéticos como modelo físico. La especificación v0.7 declara que la actualización documental no certifica la implementación del prototipo. Ante cualquier diferencia, prevalece v0.7.

No se consultó historial Git ni propuestas anteriores de base propia.

La skill `design-database-architecture` incluye una comprobación genérica de que un traslado no destruya la continuidad. En este dominio, RN-012, RN-013 y RN-014 confirman lo contrario para la continuidad del caso: el traslado cierra el origen y no crea sucesor. Lo que sí se conserva es el historial del caso cerrado. Esa distinción manda sobre la frase genérica de la skill.

`sources-and-validation.md` NV-05 dice que no debe seleccionarse SQL Server solo porque aparezca en un rol. Esta tarea fija Microsoft SQL Server como motor de la arquitectura candidata, por encargo explícito de diseño. Eso no convierte la elección en una aprobación institucional de stack de producto. Queda registrada como restricción de este encargo, estado PROPUESTO para implementación futura.

## 2. Frontera de propiedad

### 2.1 SOURCE_OWNED — SIDINACC / CAH

SIA no modifica estos datos y no crea FK física hacia la réplica.

| Dato | Dónde vive hoy | Por qué no se duplica como maestro |
| --- | --- | --- |
| Identidad `CAF_PERSONA.PER_idPersona` | Réplica | Clave provisional de interoperabilidad. Pendiente UTIC frente a `RCS_idPersona`. |
| Nombre | `CAF_PERSONA` | Maestro externo. |
| Fecha de nacimiento | `CAF_PERSONA` | La edad actual de reportería se calcula al corte; no es un hecho de A.I. |
| Sexo | `CAF_PERSONA` + `CAF_CAT_SEXO` | Maestro externo. |
| Familia, encargado, madre, padre, relación | `CAF_FAMILIA`, `CAF_MENOR` | Contexto. El encargado no es un cliente A.I. (RF-113). |
| Dirección y teléfonos familiares del período | `CAF_FAMILIA_DETALLE` | Contacto familiar, no teléfono personal del encargado. |
| Establecimiento vigente, Oficina Local, Región | `CAF_FAMILIA_DETALLE` → `RCS_ESTABLECIMIENTO` → `CAF_CAT_OFICINA_LOCAL` → `CAF_CAT_REGION` | Ubicación institucional viva. Una reasignación dentro del mismo período es NEEDS_VALIDATION (spec §6). |
| Servicios y modalidades | `CAF_SERVICIO`, `CAF_SERVICIO_CLIENTE`, `CAF_CAT_TIPO_CLIENTE` | Semántica de modalidad pendiente de UTIC. |
| Resultados nutricionales PE/PT/TE/IMC | `CAF_EVALUACION_MENOR` | Antecedente de lectura. No es detector clínico ni abre un caso. |
| Autorización usuario → establecimientos | Fuera de la réplica | RF-104. SIA no mantiene asignación paralela. |

Cadena de ubicación vigente, solo lectura: `CAF_PERSONA.FAM_idFamilia` → `CAF_FAMILIA_DETALLE` del período configurado, no eliminado → `EST_idEstablecimientoActual` → Oficina Local → Región. Si no hay detalle del período, la ubicación es nula. No se infiere otro período ni se usa `TOP 1`.

### 2.2 SYSTEM_OWNED — hechos de Atención Interdisciplinaria

Referencias, posibles referencias y su gestión, sesiones, valoraciones, resoluciones, casos, planes, atenciones, programación, documentos, coordinaciones, reportes individuales, cierres, informes analíticos y la ancla técnica de persona usada solo para integridad.

### 2.3 SNAPSHOT — congelado justificado

Al enviar una referencia se congelan, cuando existan en la fuente, los valores exigidos por RF-116 y RF-035: encargado, relación, contacto, dirección, modalidades o servicios, Región, Oficina Local, establecimiento, edad en ese momento, y los nombres territoriales necesarios para impresión. El caso conserva el contexto de su referencia de origen (RF-115, RF-116). Los cambios posteriores del maestro no reescriben ese snapshot.

El establecimiento, la Oficina Local y la Región del caso son los del ingreso, no la ubicación viva posterior de la persona. Así el caso cerrado por traslado sigue perteneciendo al ámbito de origen.

### 2.4 DERIVED — no persistir como maestro

| Derivado | Regla | Persistencia |
| --- | --- | --- |
| Edad actual | Corte de consulta menos fecha de nacimiento institucional | No se guarda. Se calcula. |
| Edad en la referencia | Congelada en el snapshot | Sí, como dato histórico del envío. |
| Prioridad A.I. | RN-009 a partir de riesgo y protección profesionales | Se guarda en cada valoración, con la versión de matriz, porque RF-100 exige interpretar el pasado si la matriz cambia. No es editable. |
| Actividad vencida | `Programada` y fecha prevista anterior a la fecha de consulta | No es un estado almacenado (RF-080, RN-016). |
| Línea de tiempo | Unión de admisión, valoraciones, atenciones, participaciones, coordinaciones, reportes, traslado y cierre | No se copia el cuerpo de cada hecho en una segunda tabla. |
| Persona única atendida | Distinta del conteo de atenciones (P-18, RN-025) | Se calcula. |
| Cobertura anual | RN-040 / RF-129 | Se calcula. N y D no se almacenan como columnas operativas. |
| Porcentaje nacional | Suma de personas, no promedio de porcentajes regionales | Se calcula. |
| Palabras frecuentes de Otro | Tokenización de la explicación | El texto se guarda. El diccionario de palabras no se materializa en la operación diaria. El informe formal puede guardar el agregado ya mostrado. |

### 2.5 CONFIGURATION

Catálogos y versiones de motivos de referencia, factores del instrumento, estrategias, disciplinas, frecuencias, tipos de actividad, tipos de atención, motivos de cierre, instituciones de coordinación, tipos documentales, orígenes, vía de atención, niveles de riesgo, niveles de protección y matriz RN-009. Los valores confirmados se siembran. Donde la especificación no enumera el catálogo completo, la estructura existe y los ítems quedan NEEDS_VALIDATION. No se inventan disciplinas, factores de valoración ni tipos de atención no escritos.

### 2.6 AUDIT

Usuario institucional, rol declarado en la operación, fecha y hora, acción, tipo de entidad, identificador, ámbito usado y un resumen de cambio que no reproduzca el texto clínico completo (RNF-003, RNF-004). Impresiones de referencia, separadas del envío (RN-029). Lotes de migración histórica (RF-101, CU-34) como evidencia técnica, no como dominio clínico.

## 3. Dominios y hechos que deben persistir

### 3.1 Identidad de vínculo

Hecho propio: la persona ya fue tocada por SIA y debe poder bloquearse de forma global.

Se persiste `PER_idPersona` (`nvarchar(20)`, igual que la réplica). No se persisten nombre, sexo ni nacimiento como maestro. Una caché declarada de sexo y nacimiento solo es admisible si queda marcada como caché, con fecha de sincronización y posibilidad de recálculo. No sustituye al adaptador.

No hay tabla de usuarios ni de establecimientos autorizados.

### 3.2 Referencia

Hechos confirmados (HU-013, HU-014, HU-015 a HU-018; RF-021 a RF-037, RF-114 a RF-117, RF-119; CU-04, CU-05, CU-06; RN-021, RN-022, RN-027 a RN-031):

- Persona referida, dentro del ámbito de quien la crea.
- Fecha de referencia.
- Vía de Atención: `Urgencia` o `No inmediata`. No es prioridad.
- Origen: `Vigilancia / tamizaje`, `Observación`, `Información aportada por la familia u otros`, `Referencia externa`.
- Responsable = identidad autenticada. No editable. También en plantilla.
- Varios motivos de catálogo, cada uno con especificación opcional. Al quitar el motivo se invalida la especificación (RF-026).
- Motivos confirmados de Crecimiento: `Condición de malnutrición`, `Malnutrición con necesidades especiales`.
- Motivos confirmados de Desarrollo: `EDIN II: riesgo de retraso (rojo)`, `EVADE: riesgo de rezago (0,1 sin logro de edad anterior)`. Son motivos declarados por la persona que refiere, no resultados recalculados por SIA.
- Salud puede incluir `Otra condición de salud`. El resto de alternativas de Salud no está enumerado.
- Factores de riesgo de referencia distinguen ámbito individual, hogar-familiar y comunitario, sin opción genérica `Otro factor de riesgo`. Los ítems concretos de ese grupo no están enumerados.
- Acciones previas, resultados previos e información complementaria: tres textos distintos.
- Consecutivo digitado por la persona usuaria, `DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX`, único, más un identificador técnico. El sistema valida formato y unicidad; no lo genera ni exige correlatividad. Códigos regionales identificados: CS, HN, CH, HC, BR, CN, PC, CO, CE. El establecimiento es el del niño, no el del digitador.
- Contexto histórico del apartado 2.3.
- Envío digital: fecha, hora y usuario no editables. Estado resultante `Pendiente de revisión`. Un borrador no es una referencia enviada.
- Resultado posterior: `Admitida a A.I.` al abrir el caso, o `No requiere A.I.` con justificación. No hay estado manual `Recibida`.
- Trazabilidad de impresión, distinta del envío.
- Origen de captura: manual o plantilla. La plantilla exige revisión humana (RN-021). Estructura final de la plantilla: NEEDS_VALIDATION (17.6).
- Puede existir sin caso.

Antes de confirmar el envío se comprueba el caso activo global. Si existe, se bloquea con un mensaje que no revela expediente interno.

### 3.3 Posible referencia

Hechos confirmados (HU-049, RF-127, CU-37, RN-037, RN-001):

- Persona, establecimiento, criterio o señal, fecha de detección.
- Estado de gestión y vínculo opcional a la referencia creada con revisión humana.
- Ámbito de consulta.
- Prevención de duplicados equivalentes y una sola confirmación concurrente desde la misma sugerencia.
- No abre caso ni admite automáticamente.
- No se almacenan variables EDIN II, EVADE ni nutrición. Solo la señal mínima y el identificador externo cuando UTIC lo defina.

La experiencia de la sección está validada. La detección automática no está productiva. Criterio exacto de equivalencia: NEEDS_VALIDATION (17.2).

### 3.4 Sesión interdisciplinaria

Hechos confirmados (HU-019, RF-038 a RF-040, CU-07):

- Fecha, hora de inicio, hora de fin, lugar, Oficina Local.
- Una o varias disciplinas del catálogo vigente. Sin disciplina genérica `Otra`.
- Cero o varias situaciones. Cada referencia entra una sola vez en la sesión. Un caso activo entra una sola vez para revaloración.
- La sesión no es una atención efectiva ni una actividad programada. Puede existir un vínculo opcional posterior, no exigido por la especificación.

Participantes profesionales con nombre: la especificación obliga disciplinas, no un padrón nominal. Un padrón nominal es PROPUESTO y NEEDS_VALIDATION. No es requisito para guardar la sesión.

### 3.5 Valoración situacional

Hechos confirmados (HU-020, RF-041 a RF-044, RF-118, CU-08, RN-007, RN-008, RN-009):

- Varias valoraciones por caso activo. Cada una ligada a la sesión y a la situación analizada. Las anteriores no se actualizan.
- Instrumento versionado.
- Categorías por eje (factor protector, factor de riesgo, signo de alerta) y ámbito (individual, hogar-familiar, comunitario).
- Factores seleccionados y especificación por factor (P-14).
- Respuesta explícita `Ninguno` en cada categoría requerida. `Ninguno` significa revisada sin factores aplicables. No significa NULL, pendiente, no revisado ni desconocido.
- `Ninguno` es excluyente con cualquier otro factor de su categoría.
- Una categoría sin filas no es `Ninguno`.
- No se capturan intensidad, frecuencia ni persistencia.
- Riesgo global profesional: Alto, Moderado o Bajo.
- Protección global profesional: Alta, Moderada o Baja.
- Independientes entre sí. Los factores no los calculan.
- Prioridad calculada por RN-009, con versión de matriz, responsable y fecha.
- Responsable y fecha de la valoración.

Matriz confirmada RN-009:

| Riesgo | Protección | Prioridad |
| --- | --- | --- |
| Alto | Baja | Alto |
| Alto | Moderada | Alto |
| Moderado | Baja | Alto |
| Alto | Alta | Moderado |
| Moderado | Moderada | Moderado |
| Moderado | Alta | Moderado |
| Bajo | Baja | Moderado |
| Bajo | Moderada | Bajo |
| Bajo | Alta | Bajo |

Qué categorías son requeridas en cada versión del instrumento: NEEDS_VALIDATION. RN-008 no las declara todas obligatorias.

La lista cerrada de factores del instrumento no está en v0.7. No se inventa.

La sugerencia automática de riesgo y protección (17.9) es EXPLORATORIO. No se modela como decisión ni se le reserva una tabla específica.

### 3.6 Resolución y apertura

Hechos confirmados (HU-021, HU-022, RF-045 a RF-048, CU-09, CU-10, RN-002):

- Decisión explícita `Sí requiere A.I.` o `No requiere A.I.`, ligada a referencia y sesión.
- `No requiere A.I.` exige justificación, conserva la valoración y no abre caso.
- `Sí requiere A.I.` exige propósitos, estrategias, disciplinas y frecuencia antes de abrir.
- Frecuencias que deben poder existir: Trimestral, Semestral y Según necesidad, más las alternativas vigentes no enumeradas. La frecuencia es planificación ideal (RN-032).
- Un caso nace de una referencia, hereda su consecutivo y su contexto, y registra admisión.
- Al confirmar se revalida la unicidad global dentro de la misma transacción.
- Una revaloración de un caso ya activo actualiza el abordaje cuando corresponda y no abre otro caso.

### 3.7 Caso, plan, cierre y traslado

Hechos confirmados (HU-023 a HU-035, HU-028, HU-030, HU-031, HU-048; RF-049 a RF-066, RF-125, RF-126; CU-11 a CU-20, CU-22, CU-23, CU-36; RN-003, RN-011 a RN-014, RN-024, RN-035):

- Apertura, estado actual `Activo` o `Cerrado`, historial de estados.
- Responsable institucional de la apertura y de cada decisión.
- Ámbito territorial de origen (snapshot).
- Plan versionado: propósitos (uno o varios), estrategias (varias), disciplinas (varias), frecuencia. La versión vigente coexiste con las anteriores.
- Última atención efectiva o ausencia total, calculable.
- Cierre con fecha, responsable y motivo: `Cierre satisfactorio`, `Traslado`, `Otro`. `Otro` exige explicación. El traslado no se reclasifica como satisfactorio.
- Traslado: datos de destino disponibles, fecha y responsable. Cierra el caso de origen. No crea caso destino, no guarda estado `Pendiente de continuidad`, no exige caso sucesor y no copia valoraciones ni planes.
- Una referencia posterior en el destino es independiente, con otro consecutivo.
- Reporte individual de caso: tipo o propósito, fecha, responsable y motivo. No cambia el estado (P-15). Tipos de plantilla: NEEDS_VALIDATION (17.3).
- Lista de Establecimiento: solo persona, identificación, establecimiento, estado, prioridad, apertura y cierre. Sin expediente interno (RN-024).

Identificadores retirados, sin tabla y sin columna: HU-029, RF-062, RF-063, CU-21.

### 3.8 Atenciones

Hechos confirmados (HU-036, HU-037, RF-067 a RF-074, CU-24, CU-25, RN-010, RN-033):

- Individual: un caso activo del ámbito, fecha real distinta de la fecha de digitación, una disciplina, tipo o estrategia, acciones, recomendaciones, profesional responsable, próxima acción y fecha prevista cuando existan.
- Grupal: un solo registro con fecha, tipo, tema u objetivo, lugar, disciplinas, profesionales, acciones y recomendaciones generales.
- Varios participantes, sin repetir persona en la misma actividad.
- Asistencia individual explícita.
- Al menos un participante y un tema antes de guardar.
- Si el participante tiene caso activo, la participación aparece en su historia sin clonar la atención.
- Si no tiene caso activo, la participación puede quedar en el grupal y no crea línea de tiempo de un caso inexistente.
- Los acompañantes no forman parte del registro (RN-033).
- Una sesión educativa general no se inserta sola como atención A.I. La clasificación fina sigue pendiente (17.8).

Programar no es atender. `Realizada` en programación no crea una atención.

### 3.9 Programación

Hechos confirmados (HU-044 a HU-046, RF-075 a RF-082, CU-26 a CU-28, RN-015 a RN-017, RN-034):

- Actividad con fecha prevista, tipo, título o propósito, Oficina Local, establecimiento opcional, observaciones.
- Tipos con nombre confirmado: `Sesión interdisciplinaria` y `Visita a establecimiento para Atención Interdisciplinaria`. Otros tipos vigentes, incluida la visita domiciliaria, solo si la fuente los confirma. No se siembran por ejemplo.
- Estado inicial `Programada`. Transiciones a `Realizada`, `Reprogramada` o `Cancelada`.
- Reprogramar exige nueva fecha y motivo. Cancelar exige motivo y no borra la fila.
- Historial de cambios de programación.
- Asociación explícita a personas o casos. Sin asociación, la actividad es general y no cubre implícitamente a todos los casos del establecimiento.
- Consulta regional y nacional de solo lectura.
- Vencida es indicador derivado.

Datos obligatorios por tipo y vista calendario: NEEDS_VALIDATION / EXPLORATORIO (17.5).

### 3.10 Documentos y coordinaciones

- Documento de caso: tipo, fecha, responsable, metadatos de almacenamiento. El binario no se asume dentro de la tabla. Ubicación segura del archivo: NEEDS_VALIDATION.
- Coordinación: caso, institución, profesional responsable distinto del digitador cuando corresponda, motivo, fecha, estado, historial de gestión.
- Valores institucionales de tipo documental, institución y estado de coordinación: NEEDS_VALIDATION. La estructura sí está confirmada (RF-058 a RF-060).

### 3.11 Informe analítico y consolidación

Hechos confirmados (HU-038 a HU-043, HU-050; RF-083 a RF-096, RF-122, RF-123, RF-128 a RF-131; CU-29 a CU-32, CU-38; RN-018 a RN-020, RN-040, RN-041):

- Informe: título, responsable, rol, ámbito, unidad, fecha y hora, período, filtros, corte.
- De 5 a 12 visualizaciones del catálogo fijo de 12, con orden, título dinámico, filtros relevantes y análisis humano obligatorio.
- Instantánea suficiente para leer después los números ya mostrados, sin copiar el microdato de cada gráfico.
- Archivo generado: opcional hasta confirmar formato y retención.
- La consolidación tabular no es el informe ni el reporte individual. Puede no persistirse; es una salida. Si se registra la descarga, basta auditoría de ámbito, filtros y período (RNF-017).

### 3.12 Borradores, catálogos, migración y auditoría

- Borrador recuperable para referencia, sesión, valoración y atenciones (RNF-008). No se confunde con un hecho confirmado ni reserva el consecutivo. El valor, si el borrador lo trae, se valida al enviar.
- Versionado de catálogos e instrumentos (RF-099, RF-100, RNF-018, RNF-019, CU-33).
- Migración controlada con lote, mapeo y errores (RF-101, CU-34). Sin duplicar personas institucionales.
- Auditoría de accesos y cambios relevantes.

## 4. Invariantes

| ID | Invariante | Fuente | Dónde debe garantizarse |
| --- | --- | --- | --- |
| INV-01 | Una persona tiene como máximo un caso A.I. activo en todo el país. | RN-002, RF-048, RNF-007, P-01 ampliado en v0.7 | Índice único filtrado o ancla de unicidad, dentro de transacción. No basta la interfaz. |
| INV-02 | No se envía una referencia nueva si ya existe caso activo. | RF-021, RF-030, RF-036 | Misma llave de persona que INV-01, antes del insert de la referencia enviada. |
| INV-03 | La apertura revalida INV-01. | RF-048, HU-022 CA-16 | Misma transacción que crea el caso. |
| INV-04 | Referencia pendiente no es caso activo. | RN-002 | Estados distintos y tablas distintas. |
| INV-05 | No existe caso sucesor, continuidad ni estado pendiente de continuidad. | RN-012, RN-013, RN-014, P-16 | Esas columnas y estados no se crean. |
| INV-06 | El traslado cierra el origen con motivo Traslado y conserva el historial. | RF-061, RF-066, HU-028 | Cierre estructurado. El destino solo se documenta. |
| INV-07 | Las valoraciones confirmadas no se sobrescriben. | RF-041, RNF-005, RN-007 | Filas inmutables. La vigente es una marca o la última confirmada. |
| INV-08 | Prioridad = RN-009. No se elige a mano. Riesgo y protección siguen siendo profesionales. | RN-009, P-04, RF-118 | Matriz versionada. Sin columna editable de prioridad independiente de sus insumos. |
| INV-09 | `Ninguno` no convive con otros factores de su categoría. Ausencia de filas no es `Ninguno`. | RN-008 | Respuesta explícita por categoría más exclusión. |
| INV-10 | Una atención grupal es un registro y muchos participantes. | RN-010, P-08, RF-073 | Tabla de actividad distinta de la de participación. |
| INV-11 | La asistencia no confirmada no cuenta como atención efectiva. | RF-088, RF-129 | Participación con asistencia explícita afirmativa. |
| INV-12 | Programación y atención son hechos distintos. | RF-075, RF-126, 15.3 visualización 8 | Sin disparador que copie una actividad programada a una atención. |
| INV-13 | El reporte individual no cierra el caso. | RN-011, P-15 | Sin cambio de estado en esa operación. |
| INV-14 | `Otro` exige texto. Traslado no es cierre satisfactorio. | RN-003, RF-066 | Restricción condicional. |
| INV-15 | El consecutivo de referencia es único, lo digita la persona usuaria y usa el establecimiento de la persona. | RF-114, RF-115, RN-030 | Índice único y validación de formato en el servicio. Sin contador por establecimiento y año. La propuesta anterior de asignación bajo bloqueo quedó retirada el 2026-11-05. |
| INV-16 | Una referencia entra una sola vez en una sesión. Un caso activo también. | RF-040 | Unicidad de la asociación. |
| INV-17 | De una misma sugerencia concurrente solo una operación válida confirma la referencia. | RF-127, RNF-007 | Bloqueo de la sugerencia y unicidad de la referencia originada. |
| INV-18 | El ámbito se aplica en datos, no solo en pantalla. | RNF-001, RF-002, RF-104 | Predicado de ámbito en cada consulta. Sin tabla paralela de autorización. |
| INV-19 | SIA no escribe SIDINACC ni recalcula vigilancia, EDIN II o EVADE. | RF-102, RN-039 | Ausencia de esas tablas y de FK de escritura. |
| INV-20 | Cobertura: D = personas con caso activo ahora en el ámbito; N = personas de D con atención efectiva en el año, ligada a ese caso activo. Porcentaje = N/D×100. D=0 no divide. | RN-040, RF-129 | Consulta reproducible. El filtro Activo/Cerrado/Todos no cambia D. |
| INV-21 | El total nacional de cobertura no es el promedio de porcentajes regionales. | Encargo y definición de N/D | N y D se suman; el porcentaje se calcula al final. |
| INV-22 | Borrador no aparece como hecho enviado ni como atención realizada. | RN-028, RNF-008 | Estado o tabla separada, excluida de reportería. |

Mensaje seguro ante INV-01 e INV-02: informar que no es posible continuar porque la persona ya tiene un caso activo de Atención Interdisciplinaria. No incluir Oficina Local, establecimiento, profesional, prioridad ni identificador del otro caso cuando el actor no tenga permiso sobre ese expediente.

## 5. Patrones de consulta

Operación frecuente:

- Buscar por identificación exacta y, en segundo lugar, por nombre. El nombre se resuelve en el adaptador, no en una copia local (RN-005, RN-006).
- Bandeja de referencias por ámbito, estado, vía, origen, motivo, persona y consecutivo.
- Casos por ámbito, estado, prioridad y establecimiento.
- Detalle de caso con valoración vigente, historial de valoraciones, plan vigente y última atención.
- Casos activos sin atención en un período (RF-125, RF-126).
- Programación por ámbito y estado; vencidas derivadas.
- Inicio de Oficina Local: posibles referencias pendientes, referencias pendientes, casos activos, próximas sesiones, actividades vencidas (RF-005).

Reportería, catálogo cerrado de doce visualizaciones (RF-128, 15.3):

| # | Visualización | Recorrido de datos | Fecha que manda |
| --- | --- | --- | --- |
| 1 | Casos por establecimiento | Caso → snapshot de establecimiento | Corte de consulta; estado según filtro |
| 2 | Casos por sexo | Caso → persona → sexo SOURCE_OWNED | Sexo vigente al corte |
| 3 | Casos por edad actual | Caso → fecha de nacimiento SOURCE_OWNED → edad al corte | No es la edad del snapshot de la referencia |
| 4 | Casos por prioridad | Prioridad vigente Alto, Moderado, Bajo | Corte de consulta |
| 5 | Casos por estado | Activo y Cerrado | Estado vigente, no histórico anual |
| 6 | Motivos de cancelación | Actividades canceladas | Fecha del hecho de cancelación |
| 7 | Motivos de referencia | Motivos no excluyentes; el conteo puede superar al de referencias | Fecha de la referencia |
| 8 | Atenciones realizadas por tipo | Individuales confirmadas más grupales únicas, no por participante | Fecha real de atención |
| 9 | Motivos de cierre | Cierre satisfactorio, Traslado, Otro | Fecha de cierre |
| 10 | Palabras en Otro | Explicación del cierre Otro | Fecha de cierre |
| 11 | Porcentaje de cobertura | INV-20 | Año de la atención; activo ahora |
| 12 | Cantidad de niños atendidos | Numerador de INV-20 | Igual que 11 |

Filtros de sexo, edad, tipo, disciplina y profesional solo entran a N y a D si aplican a ambos. Si no, se muestran como no aplicables y no se usan (15.1). Establecimiento no recibe Reportería hasta una validación específica (RN-018).

Agregados jerárquicos: Establecimiento solo con sus autorizados; Oficina Local con sus establecimientos; Región con sus Oficinas Locales; Nacional con el país o el subconjunto filtrado. Los identificadores territoriales del snapshot permiten filtrar sin promover el ámbito.

## 6. Historia que no puede reducirse a `updated_at`

| Hecho | Tratamiento |
| --- | --- |
| Valoración y prioridad | Filas sucesivas con responsable y fecha. |
| Plan | Versiones. La vigente no borra las anteriores. |
| Estado del caso | Historial de transiciones además del estado actual, si el modelo guarda estado actual. |
| Envío de referencia | Comprobante inmutable. |
| Contexto de referencia | Snapshot inmutable. |
| Cierre y traslado | Hecho de cierre, no un update mudo. |
| Programación | Transiciones con motivo y fechas. |
| Coordinación | Cambios de estado identificables. |
| Informe | Corte y análisis conservados. |
| Corrección de un hecho confirmado, incluido el consecutivo ya enviado | No está especificada. NEEDS_VALIDATION. Mientras tanto, no se actualiza el contenido confirmado ni el consecutivo. |

## 7. Concurrencia

Puntos calientes:

- Envío de referencia y apertura de caso sobre la misma persona.
- Dos aperturas simultáneas en Oficinas Locales distintas.
- Dos gestiones de la misma posible referencia.
- Revaloración y cambio de plan del mismo caso.
- Dos envíos simultáneos del mismo consecutivo digitado.
- Edición de borrador o de actividad programada.

El diseño físico debe distinguir lo que un constraint cubre de lo que solo cubre la transacción. El detalle por propuesta está en `SIA_DATABASE_PROPOSALS.md`.

## 8. Sensibilidad y acceso

Datos sensibles propios: motivos y especificaciones, acciones y resultados previos, factores, especificaciones, riesgo, protección, justificación de no ingreso, plan, atenciones, documentos, coordinaciones, explicación de cierre, snapshot familiar de la referencia.

| Actor | Lectura operativa | Escritura |
| --- | --- | --- |
| ACT-01 Establecimiento, ASC2 y ASC3 equivalentes | Referencias de sus establecimientos, posibles referencias, lista mínima de casos | Referencias. No sesión, valoración, plan, atención, cierre ni expediente interno. |
| ACT-02, ACT-03 y ACT-04 Oficina Local | Ámbito de su Oficina Local, con las mismas capacidades | La misma operación de A.I. Sin subroles. Decisión `docs/decisions/0003-local-office-actors.md` |
| ACT-05 Regional | Consulta de su Región | Sin operación de caso ni programación |
| ACT-06 Nacional | Consulta nacional | Sin operación de caso ni programación |
| ACT-07 Administración de catálogos | Catálogos | Configuración autorizada |
| ACT-08 Persona y familia | Sin acceso | Sin acceso |
| Reportería | Oficina Local, Regional y Nacional según permiso | No concede el módulo a Establecimiento |

RF-103: permisos reforzados adicionales. Qué documentos los exigen: NEEDS_VALIDATION (17.4).

## 9. Integración

- Lectura exclusiva por adaptador. El dominio SIA no ejecuta SQL institucional directo (spec §8).
- Identificador provisional: `PER_idPersona`.
- Sin FK cruzada.
- Posibles referencias: frontera futura. Una evaluación nutricional leída no es un detector.
- SINIRUBE, SNOMED CT, OCR y modo offline: fuera del alcance o sin integración formal (sección 16).
- Autenticación: contrato `InstitutionalUserContext`. El fixture local no es tabla.

## 10. Trazabilidad HU → RF → CU → necesidad de persistencia

| Dominio | HU | RF | CU | RN / RNF |
| --- | --- | --- | --- | --- |
| Ámbito y búsqueda | HU-001 a HU-012 | RF-001 a RF-020, RF-104, RF-112, RF-113, RF-124 | CU-01 a CU-03 | RN-005, RN-006, RNF-001, RNF-002 |
| Referencia | HU-013 a HU-018 | RF-021 a RF-037, RF-114 a RF-117, RF-119 | CU-04 a CU-06 | RN-021, RN-022, RN-027 a RN-031, RNF-006, RNF-008 |
| Posible referencia | HU-049 | RF-127, RF-102 | CU-37 | RN-001, RN-037, RN-039 |
| Sesión | HU-019 | RF-038 a RF-040, RF-120 | CU-07 | RNF-009 |
| Valoración y prioridad | HU-020 | RF-041 a RF-044, RF-118 | CU-08 | RN-007, RN-008, RN-009, RNF-005 |
| Resolución y apertura | HU-021, HU-022 | RF-045 a RF-048 | CU-09, CU-10 | RN-002, RNF-007 |
| Consulta de casos | HU-023 a HU-025, HU-032 a HU-035, HU-048 | RF-049 a RF-057, RF-125, RF-126 | CU-11 a CU-17, CU-36 | RN-024, RN-035 |
| Documentos | HU-026 | RF-058, RF-103 | CU-18 | RNF-004 |
| Coordinación | HU-027 | RF-059, RF-060, RF-097 | CU-19 | RN-022 |
| Traslado y cierre | HU-028, HU-031 | RF-061, RF-066 | CU-20, CU-23 | RN-003, RN-012, RN-013, RN-014 |
| Retirados | HU-029 | RF-062, RF-063 | CU-21 | RN-013. Sin persistencia. |
| Reporte individual | HU-030 | RF-064, RF-065, RF-123 | CU-22 | RN-011, P-15 |
| Atención individual | HU-036 | RF-067 a RF-069 | CU-24 | RNF-006 |
| Atención grupal | HU-037 | RF-070 a RF-074 | CU-25 | RN-010, RN-033 |
| Programación | HU-044 a HU-046 | RF-075 a RF-082 | CU-26 a CU-28 | RN-015, RN-016, RN-017, RN-034 |
| Reportería e informe | HU-038 a HU-043, HU-050 | RF-083 a RF-096, RF-122, RF-128 a RF-131 | CU-29 a CU-32, CU-38 | RN-018, RN-019, RN-020, RN-025, RN-026, RN-040, RN-041, RNF-013, RNF-015, RNF-017 |
| Catálogos | Transversal | RF-099, RF-100 | CU-33 | RNF-018, RNF-019 |
| Migración | Transversal | RF-101, RF-001 | CU-34 | RNF-021 |
| Asistente | HU-047 | RF-105 a RF-111 | CU-35 | RN-038. EXPLORATORIO. Sin tablas en este diseño. |
| Auditoría | Transversal | RF-097 | Varios | RNF-003, RNF-005, RNF-006, RNF-007 |

## 11. Exploratorio que no debe inflar el núcleo

| Tema | Estado | Extensión admisible más adelante |
| --- | --- | --- |
| Asistente conversacional | EXPLORATORIO, RF-105 a RF-111 | Tabla de trazabilidad de consultas, sobre vistas ya autorizadas. |
| Sugerencia de riesgo y protección | EXPLORATORIO, 17.9 | Tabla aparte de sugerencia, sin escribir riesgo ni protección profesionales. |
| EDIN II / EVADE como subsistema | FUERA_DE_ALCANCE | No hay extensión estructural. |
| Continuidad automática | FUERA_DE_ALCANCE | No se deja FK opcional "por si vuelve". |
| Control de calidad regional | FUERA_DE_ALCANCE | Sin flujo de devolución. |
| Calendario de programación | EXPLORATORIO P2 | La actividad ya tiene fecha. |
| OCR, offline, SNOMED | FUERA_DE_ALCANCE | Sin columnas de espera. |

## 12. NEEDS_VALIDATION que el modelo no cierra

| ID | Tema | Efecto en el diseño |
| --- | --- | --- |
| NV-UTIC-PERSONA | `PER_idPersona` frente a `RCS_idPersona` | Columna única de integración, tipo `nvarchar(20)`, sin FK. Cambiarla exigirá ADR y migración. |
| NV-UTIC-PERIODO | Reasignación intra-período en CAH | El caso no depende de elegir una fila ambigua. Usa el snapshot propio. |
| NV-UTIC-MODALIDAD | Si `CAF_SERVICIO` es la modalidad a mostrar | El snapshot guarda el texto autorizado al momento del envío, no interpreta el catálogo. |
| NV-UTIC-SENAL | Contrato de detección automática | La posible referencia guarda señal mínima e id externo opcional. |
| NV-EQUIV | Qué es una referencia equivalente | Unicidad propuesta, no confirmada como regla institucional. |
| NV-CATEGORIAS | Categorías requeridas del instrumento | Bandera de configuración por versión. |
| NV-FACTORES | Ítems reales de factores y de riesgo de referencia | Catálogo vacío de ítems no escritos. |
| NV-DISCIPLINAS | Nombres oficiales de disciplinas | Catálogo sin `Otra` y sin nombres inventados. |
| NV-FRECUENCIA | Resto de frecuencias además de Trimestral, Semestral y Según necesidad | Esas tres sí se pueden sembrar. |
| NV-TIPO-ATENCION | Tipos vigentes de atención individual y grupal | Catálogo extensible. Sesión educativa no entra sola. |
| NV-TIPO-PROG | Tipos de programación no nombrados | Solo dos nombres confirmados. |
| NV-CANCELACION | Si el motivo de cancelación será catálogo o texto | Se guarda el texto exigido. Un catálogo opcional queda propuesto. |
| NV-COORD-DOC | Estados, instituciones y tipos documentales | Estructura sí; semilla institucional no. |
| NV-ARCHIVO | Repositorio de binarios y retención del informe | Metadatos sí; binario y formato no. |
| NV-REPORTERIA-EST | KPI permitidos a Establecimiento | El predicado de ámbito existe; el permiso no se concede. |
| NV-RN040 | Ratificación de la fórmula de cobertura con Alina | La fórmula provisional se implementa tal como está escrita. |
| NV-CORRECCION | Cómo se corrige un hecho confirmado, incluido el consecutivo ya enviado | Contenido confirmado inmutable hasta regla explícita. Sin modificación libre del consecutivo. |
| NV-SEXO-EDAD | Sexo y edad actual exigen lectura institucional al consultar | Las visualizaciones 2 y 3 dependen del adaptador. El resto de A.I. funciona sin copiar esos maestros. |
| NV-AUTH | Mecanismo real de autorización | Sin tabla SIA de establecimientos por usuario. |
| NV-STACK | SQL Server como motor de producto | Restricción de este diseño; falta decisión de stack aprobada. |

## 13. Fuera de alcance de este entregable

Crear la base, ejecutar DDL, migrar, tocar `SIDINACC_LOCAL`, cambiar v0.7, modificar el prototipo, implementar servicios o pantallas, y publicar en Git.
