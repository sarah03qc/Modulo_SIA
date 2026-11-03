# Historias de Usuario y Requerimientos

#  SIA-CENCINAI — Historias de Usuario, Requerimientos y Casos de Uso

**Versión:** 0.7  
**Fecha:**   
**Estado:** Descubrimiento / refinamiento funcional / validación mediante prototipo  
**Producto:** Sistema de apoyo a la Atención Interdisciplinaria (SIA-CENCINAI)

> \[!IMPORTANT\] Este documento constituye un backlog vivo de descubrimiento y especificación funcional. Los elementos se identifican según su nivel de certeza y pueden evolucionar conforme avance la validación institucional, normativa y técnica.

---

> **Origen canónico:** documento adjunto `Historias de Usuario y Requerimientos-updated.md`, versión 0.7, validación funcional con Alina del 02/11/2026. Los contenidos normativos de las secciones reproducidas abajo se conservan íntegramente de esa fuente. Las fechas vacías del encabezado o del historial de cambios de origen se mantienen sin inventar valores.
> **Uso:** insumo de contexto funcional para Cursor/Codex; no confundir especificación objetivo con código implementado en la maqueta.

**Archivos complementarios:** [`FUNCTIONAL_SPEC_v0.7.md`](FUNCTIONAL_SPEC_v0.7.md) · [`USE_CASES_v0.7.md`](USE_CASES_v0.7.md). El primero contiene íntegramente las secciones 1–9 y 11–21; el segundo contiene íntegramente la sección 10, incluidos el índice y los flujos de los casos de uso.

---

# 1. Objetivo del documento

Consolidar en un único documento la especificación funcional vigente de SIA-CENCINAI, incluyendo:

1. Actores y alcance de acceso.
2. Modelo jerárquico de consulta y operación.
3. Principios de diseño.
4. Épicas.
5. Historias de usuario.
6. Requerimientos funcionales.
7. Casos de uso.
8. Reglas de negocio.
9. Requerimientos no funcionales.
10. Modelo conceptual de datos.
11. Reportería y analítica.
12. Integraciones, captura alternativa y migración.
13. Preguntas abiertas y decisiones pendientes.

La trazabilidad objetivo es:

**Proceso institucional → flujograma → instrumentos/variables → historias de usuario → requerimientos → casos de uso → prototipo → implementación.**

---

---

# 2. Cambios de alcance consolidados

La versión 0.7 consolida las decisiones funcionales previas y los acuerdos de la **Sesión de validación funcional con Alina — **, documentados el  en dos partes: gestión de casos y Reportería/informes. Se conservan los hallazgos de v0.6 de la sesión del 30 de octubre (Factores colapsables, selección múltiple estructurada y respuesta explícita por categoría requerida) y la exploración de 17.9. Confirmados funcionalmente: traslado con cierre sin continuidad automática, unicidad global del caso activo, revaloraciones históricas, búsqueda contextual sin pantalla general Personas/Clientes, capacidades equivalentes ASC2 / ASC3, sección independiente Posibles referencias, Inicio, cierre estructurado y catálogo de doce visualizaciones con informe guiado. La detección automática de posibles referencias depende de fuentes autorizadas e integración coordinada con UTIC; no se declara productiva. El KPI de cobertura tiene definición operativa provisional vigente, pendiente de ratificación con Alina; el formato del informe y los permisos específicos de Reportería de Establecimiento siguen pendientes. Las propuestas validadas y funcionalidades exploratorias conservan su estado. Esta actualización es documental, no certifica implementación ni modifica el prototipo.

## 2.1 Simplificaciones adoptadas

- Se elimina del alcance actual el módulo independiente de **Control de Calidad Regional**.
- Se elimina el flujo artificial de **Regional valida → devuelve → Oficina Local corrige → reenvía**.
- La reportería se concibe como una capa de consulta y analítica sobre los datos operativos, no como un proceso paralelo de aprobación.
- Se eliminan de la valoración situacional los campos obligatorios de **intensidad, frecuencia y persistencia**.
- Se sustituyen selectores masivos de personas y casos por búsqueda mediante **identificación o nombre**. Se retira la pantalla principal Personas/Clientes y el listado general de CAH/SIDINACC; se conserva la búsqueda contextual en los flujos autorizados, sin cargas masivas innecesarias.
- La gestión operativa se concentra en **Oficina Local**; Regional y Nacional disponen principalmente de consulta y analítica.
- **Reportes** y **Cierre** se mantienen como acciones independientes.
- El cambio de establecimiento cierra el caso activo de origen con motivo **Traslado**, sin generar caso ni ingreso pendiente en destino.
- Los consolidados se generan dinámicamente según ámbito y filtros, sin un proceso obligatorio de remisión entre niveles.

## 2.2 Capacidades incorporadas o refinadas

- Rol de **Establecimiento** con acceso limitado a información mínima de A.I.
- Acceso jerárquico por **Establecimiento → Oficina Local → Región → Nivel Nacional**.
- Filtros jerárquicos dependientes.
- Programación operativa de sesiones y atenciones.
- Exportación de listados y consolidaciones a Excel.
- Impresión de referencias.
- Captura de referencias mediante plantilla Excel estandarizada.
- Valoración situacional por ámbitos con especificación textual para cualquier factor seleccionado.
- Cierre del caso activo de origen por **Traslado** al cambiar de establecimiento; una referencia posterior en destino es nueva, con consecutivo propio y apertura por el procedimiento normal.
- Diferenciación entre **personas únicas atendidas** y **cantidad total de atenciones**.
- Reporterías con filtros temporales, territoriales y funcionales. Reportería: catálogo principal de doce visualizaciones, filtros activos visibles/restablecibles, títulos dinámicos y actualización reactiva según ámbito; informe formal con cinco a doce visualizaciones, análisis humano obligatorio por cada una y metadatos/corte trazables (HU-050/CU-38). Las consolidaciones tabulares y el reporte individual del caso se conservan como capacidades distintas.

---

---

# 3. Alcance funcional actual

SIA-CENCINAI deberá apoyar el proceso de Atención Interdisciplinaria desde la referencia y análisis interdisciplinario hasta el seguimiento, traslado, reportería y cierre del caso, procurando reducir redigitación y reutilizar información institucional existente. Se incluyen exploración interactiva de Reportería e informe analítico formal independientes conforme a 15.1 a 15.4; no se amplían permisos de Establecimiento. El KPI se aplica provisionalmente según RN-040, con ratificación pendiente, y la detección automática mantiene su dependencia institucional.

## 3.1 Incluido en el alcance funcional consolidado

- Búsqueda e identificación de clientes/beneficiarias.
- Consulta de información según rol y ámbito institucional.
- Creación, envío digital, consulta e impresión de referencias a Atención Interdisciplinaria. Posibles referencias constituye una sección independiente de la bandeja ordinaria de Referencias, para personal autorizado de Establecimiento y Oficina Local; su experiencia funcional está validada y la detección automática depende de fuentes autorizadas y coordinación con UTIC.
- Carga de referencias desde plantilla Excel estandarizada.
- Sesiones interdisciplinarias.
- Valoración situacional por ámbitos. Durante un caso activo se admiten nuevas sesiones y revaloraciones, preservando valoraciones y prioridades históricas, fechas y responsables.
- Resolución de si un caso requiere A.I.
- Priorización y definición del abordaje inicial.
- Apertura y gestión del caso A.I. Una persona puede tener varios casos históricos, pero nunca dos activos simultáneamente, incluso entre establecimientos u Oficinas Locales distintos.
- Línea de tiempo longitudinal.
- Plan de atención.
- Atenciones individuales.
- Atenciones grupales con múltiples participantes.
- Documentos asociados al caso.
- Coordinaciones interinstitucionales.
- Cierre por Traslado cuando la persona cambia de establecimiento, con historial conservado y consultable según permisos; sin generación automática de casos ni confirmación de continuidad en destino.
- Generación de reportes durante la vida del caso.
- Cierre del caso.
- Programación de sesiones y atenciones.
- Consulta Regional y Nacional de programación.
- Reporterías y visualizaciones filtrables.
- Consolidaciones dinámicas.
- Exportación de listados y consolidaciones.
- Trazabilidad, auditoría y control de acceso.
- Configuración de catálogos y versionamiento funcional.
- Migración controlada de información histórica.

## 3.2 Fuera del alcance funcional consolidado actual

- Sustituir SIDINACC/CAH o Infoservicios, o mantener registros paralelos de vigilancia, nutrición, EDIN II o EVADE. También quedan fuera la pantalla general Personas/Clientes y los flujos de continuidad automática por traslado, ingreso pendiente y estado Pendiente de continuidad.
- Rediseñar la selección de hogares o modalidades institucionales.
- Automatizar decisiones profesionales de ingreso, valoración de riesgo/protección o cierre.
- Implementar un flujo de aprobación Regional de los registros de Oficina Local.
- Adoptar SNOMED CT como integración formal.
- Implementar OCR como dependencia del producto.
- Implementar un modo offline avanzado con sincronización como dependencia del producto.
- Capturar nuevamente vigilancia, nutrición, EDIN II o EVADE, recalcular sus resultados o abrir automáticamente casos A.I. a partir de hallazgos institucionales.
- Exportaciones anonimizadas sin una política institucional de gobernanza previamente definida.

---

---

# 4. Actores y alcance de acceso

| Código | Actor | Alcance principal |
| --- | --- | --- |
| **ACT-01** | Profesional del establecimiento / ASC2 / ASC3 | Crear y consultar referencias de sus establecimientos autorizados; consultar clientes/beneficiarias de su ámbito y una Lista de A.I. simplificada con estado y prioridad A.I., y filtrar por prioridad. ASC2 y ASC3 comparten las mismas capacidades autorizadas para Establecimiento. ASC2 / ASC3 comparten capacidades equivalentes de A.I. cuando están autorizados, sin variantes funcionales ni visuales innecesarias. El rótulo visual definitivo queda pendiente de confirmación. No se concede automáticamente Reportería; las visualizaciones y KPI permitidos de ese nivel requieren validación específica. |
| **ACT-02** | Profesional del EE.II. de Oficina Local | Gestionar referencias, sesiones, casos, atenciones, documentos, coordinaciones, traslados, reportes, cierre, programación y reportería dentro de su Oficina Local. |
| **ACT-03** | Equipo Interdisciplinario de Oficina Local | Analizar casos, registrar valoración situacional y niveles profesionales de riesgo y protección, decidir si requieren A.I., consultar la prioridad calculada y definir el abordaje inicial. |
| **ACT-04** | Jefatura / Nivel Local | Consultar y acompañar la operación del ámbito local de acuerdo con los permisos definidos para Oficina Local. |
| **ACT-05** | ATE / Dirección Regional | Consultar clientes/beneficiarias, casos, programación y reportería de su Región; realizar seguimiento técnico sin modificar la gestión operativa de Oficina Local. |
| **ACT-06** | UIVCD / UNAT / Nivel Nacional | Consultar información nacional y desagregarla por Región, Oficina Local y establecimiento; acceder a programación, reportería y consolidaciones en modo de consulta. |
| **ACT-07** | Administrador funcional/técnico autorizado | Gestionar catálogos, versiones y configuraciones autorizadas. |
| **ACT-08** | Persona usuaria / familia | Fuente o receptora de información; no dispone de acceso directo al módulo de A.I. en el alcance actual. |
| **ACT-09** | Equipo de implementación / soporte | Ejecutar migraciones, configuraciones e integraciones técnicas autorizadas. |

---

---

# 5. Modelo jerárquico de acceso

```
Nivel Nacional
└── Región
    └── Oficina Local
        └── Establecimiento
```

## 5.1 Establecimiento

El profesional, ASC2 y ASC3 comparten las mismas capacidades autorizadas de Atención Interdisciplinaria para este nivel. La nomenclatura institucional es ASC2 / ASC3; se mantienen capacidades equivalentes autorizadas junto al profesional, sin variantes funcionales o visuales innecesarias. Rótulo visual definitivo pendiente de confirmación. Esta autorización operativa no concede acceso general a Reportería: visualizaciones y KPI permitidos para Establecimiento quedan pendientes de validación. Cualquier eventual acceso solo abarcará sus establecimientos autorizados, sin unidades superiores.

Puede:

- buscar y consultar clientes/beneficiarias de sus establecimientos autorizados;
- crear y enviar referencias;
- consultar referencias, su estado y trazabilidad;
- consultar información básica y contextual autorizada del cliente/beneficiaria;
- consultar la Lista de A.I. simplificada con estado general, prioridad A.I. y fechas de apertura/cierre;
- filtrar la Lista de A.I. por prioridad Alto, Moderado o Bajo;
- utilizar la plantilla estandarizada de referencia;
- consultar posibles referencias pendientes detectadas desde fuentes institucionales autorizadas, dentro de su ámbito y según disponibilidad de integración.

No puede realizar sesiones interdisciplinarias, modificar valoraciones o planes, cerrar casos ni registrar la gestión interna reservada a Oficina Local. No debe consultar valoración situacional completa, factores detallados, nivel de riesgo, nivel de protección, plan interno, estrategias, disciplinas internas, frecuencia, línea de tiempo detallada, atenciones detalladas, documentos internos, coordinaciones, traslados, reportes internos ni cierre operativo detallado.

## 5.2 Oficina Local

Es el nivel operativo principal. Puede:

- buscar clientes/beneficiarias de todos sus establecimientos;
- consultar y analizar referencias enviadas digitalmente;
- gestionar sesiones interdisciplinarias;
- registrar valoración y resolución;
- abrir y gestionar casos A.I.;
- registrar atenciones individuales y grupales;
- gestionar documentos y coordinaciones;
- gestionar traslados;
- generar reportes;
- cerrar casos;
- gestionar programación;
- consultar reportería;
- generar consolidaciones;
- exportar listados autorizados.

## 5.3 Nivel Regional

Su función principal es consulta, seguimiento y analítica. Puede:

- consultar clientes/beneficiarias de su Región;
- consultar casos en modo de solo lectura;
- filtrar por Oficina Local y establecimiento;
- consultar programación;
- consultar reportería;
- generar consolidaciones y exportaciones autorizadas.

No modifica la gestión operativa de Oficina Local.

## 5.4 Nivel Nacional

Puede consultar información de todo el país y descender jerárquicamente:

**País → Región → Oficina Local → Establecimiento**

Su acceso a la gestión individual es de consulta según los permisos institucionales definidos. No asume las acciones operativas de Oficina Local.

---

---

# 6. Principios de diseño

### P-01 — Un caso, múltiples atenciones

Un caso A.I. puede relacionarse con múltiples atenciones y eventos sin duplicar estructuras de datos.

### P-02 — Reutilización de datos

No se debe redigitar información que ya esté disponible en fuentes institucionales autorizadas.

### P-03 — Vigilancia no equivale a Atención Interdisciplinaria

Un hallazgo de vigilancia puede aportar información al proceso, pero no abre automáticamente un caso A.I.

### P-04 — El sistema apoya; el equipo decide

Las decisiones profesionales de ingreso, riesgo, protección, abordaje y cierre corresponden al equipo; la prioridad se calcula a partir de riesgo y protección conforme a RN-009. La Prioridad A.I. se calcula después de definir profesionalmente ambos niveles. La línea exploratoria de 17.9 no modifica este principio ni la responsabilidad profesional.

### P-05 — Documentos vinculados al caso

Los documentos especializados se relacionan con el caso y no deben convertirse en silos funcionales independientes.

### P-06 — Configuración antes que valores rígidos

Los elementos sujetos a evolución institucional deben ser configurables cuando sea técnicamente viable.

### P-07 — Trazabilidad completa

Se debe conservar, cuando corresponda, la fuente, el digitador, el profesional responsable, la fecha real del evento y la fecha de digitación.

### P-08 — Una atención grupal se registra una sola vez

La actividad grupal utiliza un único registro base y se asocia a múltiples participantes.

### P-09 — Identificación antes que nombre

La identificación es el criterio preferente para coincidencia exacta y conciliación de personas.

### P-10 — Búsqueda antes que listas masivas

La selección de clientes/beneficiarias y casos debe apoyarse en mecanismos de búsqueda, no en dropdowns con universos completos.

### P-11 — Registrar una vez, reutilizar en reportería

La reportería consume los datos operativos ya registrados y no requiere redigitación para consolidar información.

### P-12 — El alcance depende del nivel institucional

La información visible y las acciones disponibles se restringen según Establecimiento, Oficina Local, Región o Nivel Nacional.

### P-13 — Los niveles superiores heredan consulta, no necesariamente edición

Regional y Nacional pueden consultar ámbitos inferiores sin asumir la gestión operativa correspondiente a Oficina Local.

### P-14 — Cualquier factor seleccionado puede especificarse

Todo factor protector, factor de riesgo, signo de alerta u otro elemento seleccionado puede incluir una especificación textual cuando se necesite contexto adicional.

### P-15 — Reporte no equivale a cierre

Un reporte puede generarse durante la vida de un caso sin modificar su estado.

### P-16 — El traslado cierra la responsabilidad del origen, no necesariamente la necesidad de A.I.

Cuando una persona cambia de establecimiento con un caso A.I. activo, el caso de origen se cierra con motivo **Traslado**. No se genera automáticamente otro caso ni ingreso pendiente, no existe confirmación o estado Pendiente de continuidad ni vinculación obligatoria entre casos de origen y destino. Una vez asociada al nuevo establecimiento en CAH/SIDINACC, el personal autorizado puede crear una referencia nueva con consecutivo propio y, si requiere A.I., abrir otro caso por el procedimiento normal. El historial anterior permanece conservado y consultable según permisos.

### P-17 — Filtros jerárquicos consistentes

Región, Oficina Local y establecimiento deben mantener relaciones válidas; al cambiar un nivel superior, los filtros inferiores incompatibles se actualizan o se limpian.

### P-18 — Personas únicas y atenciones son métricas distintas

Una misma persona se contabiliza una sola vez como persona atendida dentro de un corte, aunque pueda tener múltiples atenciones.

---

---

# 7. Épicas

Se conservan los identificadores históricos utilizados por las historias de usuario para mantener trazabilidad.

| Épica | Nombre | Objetivo |
| --- | --- | --- |
| **EP-01** | Identidad y expediente lógico | Buscar, consultar y reutilizar información de clientes/beneficiarias según rol y ámbito. La búsqueda y consulta son contextuales en creación de referencias, sesiones, casos, atenciones y otros flujos autorizados; no existe una pantalla principal Personas/Clientes ni un listado general de CAH/SIDINACC. |
| **EP-02** | Detección y referencia | Crear, enviar digitalmente, consultar e imprimir referencias a Atención Interdisciplinaria. |
| **EP-03** | Sesión y valoración interdisciplinaria | Organizar sesiones, valorar casos, resolver ingreso y definir el abordaje inicial. |
| **EP-04** | Gestión del caso A.I. | Consultar y gestionar casos, documentos, coordinaciones, traslados, reportes y cierre. |
| **EP-05** | Atenciones y seguimiento | Registrar atenciones individuales y grupales y mantener su trazabilidad longitudinal. |
| **EP-08** | Reportería y analítica | Consultar, filtrar, visualizar, consolidar y exportar información. Catálogo principal de doce visualizaciones y generación de informe analítico guiado con interpretación humana por visualización (HU-050/CU-38); mantiene ámbitos y permisos sin conceder automáticamente Reportería a Establecimiento. |
| **EP-14** | Programación | Planificar actividades en Oficina Local y permitir su consulta en niveles superiores. |

---

---

# 8. Historias de usuario

## EP-01 — Identidad y expediente lógico

### HU-001 — Consultar resumen operativo del establecimiento

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, ASC2 o ASC3 con acceso de nivel Establecimiento, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi establecimiento, **para** identificar rápidamente las referencias y clientes/beneficiarias relacionados con A.I. que requieren mi atención o consulta.

#### Criterios de aceptación

##### CA-01 — Restringir el resumen al establecimiento

**Dado** que el usuario posee acceso a uno o más establecimientos autorizados, **cuando** ingresa a la página de inicio, **entonces** el sistema debe mostrar únicamente información correspondiente a ese ámbito.

##### CA-02 — Mostrar referencias

**Dado** que existen referencias asociadas al ámbito autorizado, **cuando** el usuario consulta Inicio, **entonces** debe visualizar la cantidad de referencias correspondientes.

##### CA-03 — Mostrar clientes/beneficiarias asociados a A.I.

**Dado** que existen clientes/beneficiarias del ámbito con casos de A.I., **cuando** el usuario consulta Inicio, **entonces** debe visualizar un contador correspondiente.

##### CA-04 — Acceso rápido a referencia

**Dado** que el usuario se encuentra en Inicio y posee permiso para crear referencias, **cuando** selecciona la acción de nueva referencia, **entonces** el sistema debe llevarlo al flujo correspondiente.

##### CA-05 — Acceso rápido a lista de A.I.

**Dado** que el usuario consulta Inicio, **cuando** selecciona la Lista de A.I., **entonces** debe acceder a la vista simplificada correspondiente a su ámbito.

##### CA-06 — Consultar estado y prioridad autorizados

Dado que el usuario es profesional, ASC2 o ASC3 autorizado, cuando accede desde el resumen a la Lista de A.I., entonces debe poder consultar estado y prioridad A.I. y filtrar por prioridad sin acceder al detalle interno.

---

### HU-002 — Consultar el resumen operativo de la Oficina Local

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi Oficina Local, **para** identificar rápidamente posibles referencias, referencias, casos, sesiones y actividades que requieren atención. El orden operativo es: posibles referencias pendientes cuando su detección esté disponible; referencias nuevas o pendientes; casos activos; próximas sesiones; actividades programadas vencidas. Se conservan próximas acciones y demás capacidades válidas.

#### Criterios de aceptación

##### CA-01 — Restringir información al ámbito

**Dado** que el usuario pertenece a una Oficina Local, **cuando** ingresa al sistema, **entonces** el resumen debe mostrar únicamente información correspondiente a esa Oficina Local y sus establecimientos.

##### CA-02 — Mostrar referencias pendientes

**Dado** que existen referencias pendientes de gestión, **cuando** el usuario consulta Inicio, **entonces** debe visualizar su cantidad y poder acceder a ellas.

##### CA-03 — Mostrar casos activos

**Dado** que existen casos activos, **cuando** se muestra el resumen, **entonces** debe visualizarse su cantidad y permitir navegar al listado correspondiente.

##### CA-04 — Mostrar sesiones próximas

**Dado** que existen sesiones interdisciplinarias programadas, **cuando** el usuario consulta el resumen, **entonces** debe visualizar las próximas sesiones y poder acceder a su gestión.

##### CA-05 — Mostrar posibles referencias pendientes

**Dado** que la detección de posibles referencias está disponible, **cuando** se consulta Inicio de Oficina Local, **entonces** se prioriza su cantidad pendiente y el acceso a la sección independiente, sin indicadores de traslados pendientes de continuidad.

##### CA-06 — Mostrar actividades programadas vencidas

Dado que una actividad permanece Programada después de su fecha prevista, cuando se consulta Inicio, entonces debe mostrarse como vencida con alerta e indicación roja acompañada de texto para resolverla como Realizada, Reprogramada o Cancelada.

##### CA-07 — Mostrar próximas acciones

**Dado** que existen casos con próximas acciones registradas, **cuando** el usuario consulta Inicio, **entonces** debe poder visualizarlas y acceder al caso correspondiente.

---

### HU-003 — Consultar el resumen regional de Atención Interdisciplinaria

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi Región, **para** conocer de forma rápida la situación general de los casos, personas atendidas, atenciones y programación de las Oficinas Locales bajo mi ámbito.

#### Criterios de aceptación

##### CA-01 — Restringir el resumen a la Región

**Dado** que el usuario pertenece a una Región, **cuando** ingresa al sistema, **entonces** el resumen debe mostrar únicamente información correspondiente a esa Región y sus unidades dependientes.

##### CA-02 — Mostrar clientes/beneficiarias del ámbito

**Dado** que existen clientes/beneficiarias dentro de la Región, **cuando** se consulta Inicio, **entonces** debe mostrarse la cantidad correspondiente.

##### CA-03 — Mostrar casos activos

**Dado** que existen casos A.I. activos dentro de la Región, **cuando** se consulta el resumen, **entonces** debe mostrarse su cantidad.

##### CA-04 — Mostrar actividad de atención

**Dado** que existen atenciones registradas dentro de la Región, **cuando** se consulta el resumen, **entonces** debe mostrarse una medida resumida de la actividad.

##### CA-05 — Mostrar programación

**Dado** que existen actividades programadas, **cuando** se consulta el resumen, **entonces** debe mostrarse la cantidad correspondiente y permitir acceder a Programación.

##### CA-06 — Acceso a analítica

**Dado** que el usuario necesita profundizar en la información regional, **cuando** accede a Reportería, **entonces** debe conservarse su ámbito regional.

---

### HU-004 — Consultar el resumen nacional de Atención Interdisciplinaria

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar un resumen general de la actividad de Atención Interdisciplinaria en el país, **para** obtener una visión rápida de la cantidad de clientes/beneficiarias, casos, atenciones y actividades programadas.

#### Criterios de aceptación

##### CA-01 — Utilizar el ámbito nacional

**Dado** que el usuario posee acceso de Nivel Nacional, **cuando** ingresa al sistema, **entonces** el resumen debe considerar toda la información nacional permitida.

##### CA-02 — Mostrar clientes/beneficiarias

**Dado** que existen clientes/beneficiarias registrados, **cuando** se consulta Inicio, **entonces** debe mostrarse la cantidad correspondiente.

##### CA-03 — Mostrar casos activos

**Dado** que existen casos A.I. activos, **cuando** se consulta el resumen nacional, **entonces** debe mostrarse su cantidad.

##### CA-04 — Mostrar actividad de atención

**Dado** que existen atenciones registradas, **cuando** se consulta Inicio, **entonces** debe mostrarse una medida resumida de la actividad realizada.

##### CA-05 — Mostrar programación

**Dado** que existen actividades programadas, **cuando** el usuario consulta el resumen, **entonces** debe poder visualizar una medida de la programación y acceder a su consulta.

##### CA-06 — Acceder a reportería

**Dado** que el usuario necesita profundizar en los datos, **cuando** accede a Reportería, **entonces** debe conservar su ámbito nacional.

---

### HU-005 — Buscar un cliente/beneficiaria del establecimiento

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, ASC2 o ASC3 con acceso de nivel Establecimiento, **quiero** buscar clientes/beneficiarias principalmente por identificación y secundariamente por nombre dentro de mis establecimientos autorizados, **para** localizar rápidamente a la persona correcta sin acceder a información fuera de mi ámbito.

#### Criterios de aceptación

##### CA-01 — Búsqueda por identificación

**Dado** que el usuario conoce la identificación, **cuando** la ingresa, **entonces** el sistema debe devolver únicamente coincidencias del ámbito autorizado.

##### CA-02 — Prioridad de coincidencia exacta

**Dado** que existe una coincidencia exacta por identificación, **cuando** se ejecuta la búsqueda, **entonces** esta debe tener precedencia sobre coincidencias aproximadas por nombre.

##### CA-03 — Búsqueda por nombre

**Dado** que no se dispone de la identificación, **cuando** se ingresa un nombre total o parcial, **entonces** deben mostrarse únicamente coincidencias del ámbito autorizado.

##### CA-04 — Varias coincidencias

**Dado** que existen varias coincidencias, **cuando** se muestran los resultados, **entonces** deben presentarse datos suficientes para distinguir a las personas.

##### CA-05 — Restricción de ámbito

**Dado** que el usuario posee acceso de nivel Establecimiento, **cuando** realiza una búsqueda, **entonces** no debe poder localizar ni seleccionar personas fuera de sus establecimientos autorizados.

##### CA-06 — Conteo de resultados

**Dado** que se ejecuta una búsqueda, **cuando** existen resultados, **entonces** debe indicarse la cantidad de registros encontrados.

##### CA-07 — Múltiples establecimientos autorizados

**Dado** que el usuario posee más de un establecimiento autorizado, **cuando** accede a la búsqueda, **entonces** debe poder filtrar exclusivamente entre dichos establecimientos.

##### CA-08 — Único establecimiento autorizado

**Dado** que existe un único establecimiento autorizado, **cuando** se accede a la búsqueda, **entonces** el sistema debe aplicarlo automáticamente sin mostrar un filtro innecesario.

##### CA-09 — Sin coincidencias

**Dado** que la búsqueda no encuentra resultados, **cuando** finaliza, **entonces** el sistema debe informarlo sin ampliar el ámbito autorizado.

##### CA-10 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-006 — Consultar y localizar clientes/beneficiarias de la Oficina Local

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** buscar y consultar clientes/beneficiarias pertenecientes a los establecimientos de mi Oficina Local, **para** localizar rápidamente a la persona correcta y acceder a la información permitida.

#### Criterios de aceptación

##### CA-01 — Buscar por identificación

**Dado** que el usuario conoce la identificación, **cuando** la ingresa, **entonces** el sistema debe priorizar la coincidencia exacta.

##### CA-02 — Buscar por nombre

**Dado** que no conoce la identificación, **cuando** busca por nombre, **entonces** debe obtener las coincidencias de su Oficina Local.

##### CA-03 — Restringir ámbito

**Dado** que pertenece a una Oficina Local, **cuando** realiza la búsqueda, **entonces** no debe recibir resultados de otras Oficinas Locales.

##### CA-04 — Filtrar por establecimiento

**Dado** que existen múltiples establecimientos, **cuando** selecciona uno, **entonces** el listado debe limitarse a ese establecimiento.

##### CA-05 — Mostrar conteo

**Dado** que existe una búsqueda o filtro activo, **cuando** cambian los resultados, **entonces** debe mostrarse su cantidad respecto del total disponible.

##### CA-06 — Exportación de personas pendiente de revisión

**Dado** que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, **cuando** se revisa esta capacidad, **entonces** queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.

##### CA-07 — Estructurar exportación

**Dado** que se genera una exportación tabular, **cuando** se abre en una herramienta compatible, **entonces** los atributos deben organizarse en encabezados y columnas diferenciadas.

##### CA-08 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-007 — Buscar y consultar clientes/beneficiarias de la Región

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** buscar y consultar clientes/beneficiarias pertenecientes a mi Región, **para** localizar personas específicas y consultar la información permitida.

#### Criterios de aceptación

##### CA-01 — Buscar por identificación

**Dado** que el usuario conoce la identificación, **cuando** la ingresa, **entonces** debe priorizarse la coincidencia exacta dentro de la Región.

##### CA-02 — Buscar por nombre

**Dado** que no conoce la identificación, **cuando** ingresa un nombre, **entonces** deben mostrarse las coincidencias de la Región.

##### CA-03 — Restringir ámbito

**Dado** que pertenece a una Región, **cuando** realiza una búsqueda, **entonces** no debe recibir resultados de otras Regiones.

##### CA-04 — Filtrar por Oficina Local

**Dado** que existen varias Oficinas Locales, **cuando** selecciona una, **entonces** deben mostrarse únicamente sus clientes/beneficiarias.

##### CA-05 — Filtrar por establecimiento

**Dado** que existen varios establecimientos en el ámbito seleccionado, **cuando** selecciona uno, **entonces** debe limitarse el listado.

##### CA-06 — Filtros dependientes

**Dado** que cambia la Oficina Local seleccionada, **cuando** un establecimiento previo deja de ser compatible, **entonces** debe actualizarse o limpiarse.

##### CA-07 — Mostrar conteo

**Dado** que se aplican filtros, **cuando** se actualizan los resultados, **entonces** debe indicarse la cantidad encontrada.

##### CA-08 — Exportación de personas pendiente de revisión

**Dado** que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, **cuando** se revisa esta capacidad, **entonces** queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.

##### CA-09 — Estructurar exportación

**Dado** que se genera la exportación, **cuando** se abre externamente, **entonces** sus atributos deben encontrarse distribuidos en columnas claramente identificadas.

##### CA-10 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-008 — Buscar y consultar clientes/beneficiarias a nivel nacional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** buscar y consultar clientes/beneficiarias del país y desagregarlos territorialmente, **para** localizar personas específicas y acceder a la información permitida.

#### Criterios de aceptación

##### CA-01 — Buscar por identificación

**Dado** que se conoce la identificación, **cuando** se ingresa, **entonces** debe priorizarse la coincidencia exacta.

##### CA-02 — Buscar por nombre

**Dado** que no se conoce la identificación, **cuando** se busca por nombre, **entonces** deben mostrarse las coincidencias permitidas.

##### CA-03 — Búsqueda contextual en ámbito nacional

**Dado** que no se aplicaron filtros territoriales, **cuando** se ejecuta una búsqueda contextual por identificación o nombre, **entonces** se utiliza el ámbito nacional permitido sin cargar el listado general de personas.

##### CA-04 — Filtrar por Región

**Dado** que se selecciona una Región, **cuando** se actualiza el listado, **entonces** deben mostrarse únicamente sus registros.

##### CA-05 — Filtrar por Oficina Local

**Dado** que se selecciona una Oficina Local, **cuando** se actualiza el listado, **entonces** deben mostrarse únicamente sus registros.

##### CA-06 — Filtrar por establecimiento

**Dado** que se selecciona un establecimiento, **cuando** se actualiza el listado, **entonces** deben mostrarse únicamente sus clientes/beneficiarias.

##### CA-07 — Mantener jerarquía de filtros

**Dado** que los filtros son dependientes, **cuando** cambia un nivel superior, **entonces** deben actualizarse o limpiarse los niveles inferiores incompatibles.

##### CA-08 — Mostrar conteo

**Dado** que existen filtros activos, **cuando** se actualizan los resultados, **entonces** debe indicarse su cantidad.

##### CA-09 — Exportación de personas pendiente de revisión

**Dado** que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, **cuando** se revisa esta capacidad, **entonces** queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.

##### CA-10 — Estructurar exportación

**Dado** que se genera una salida tabular, **cuando** se utiliza externamente, **entonces** debe contener encabezados y columnas diferenciadas.

##### CA-11 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-009 — Consultar información básica de un cliente/beneficiaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, ASC2 o ASC3 con acceso de nivel Establecimiento, **quiero** consultar la información básica y el estado general de A.I. de un cliente/beneficiaria de mi ámbito, **para** identificarlo correctamente sin acceder a información restringida del caso.

#### Criterios de aceptación

##### CA-01 — Mostrar identificación básica

**Dado** que se selecciona un cliente/beneficiaria, **cuando** se abre su información, **entonces** debe visualizar al menos nombre, identificación, fecha de nacimiento o edad cuando esté disponible, sexo y establecimiento.

##### CA-02 — Mostrar ubicación y servicios

**Dado** que existe información institucional disponible, **cuando** se consulta el perfil, **entonces** podrá mostrarse establecimiento, Oficina Local, Región y modalidades o servicios aplicables.

##### CA-03 — Mostrar información contextual disponible

**Dado** que las fuentes institucionales contienen información relacionada con la persona encargada, **cuando** resulte pertinente para el flujo y el rol, **entonces** podrá mostrarse de forma compacta la persona encargada, relación, contacto y dirección disponibles.

##### CA-04 — No convertir al encargado en cliente A.I.

**Dado** que se muestra información de la persona encargada, **cuando** se consulta el perfil, **entonces** esta debe manejarse como contexto relacionado con el cliente/beneficiaria y no como un cliente A.I. independiente.

##### CA-05 — Mostrar procedencia del dato

**Dado** que un dato fue reutilizado desde una fuente institucional, **cuando** corresponda, **entonces** el sistema debe poder conservar su procedencia.

##### CA-06 — Mostrar estado y prioridad de A.I.

Dado que existen casos A.I. asociados, cuando se consulta el perfil, entonces deben mostrarse identificador, estado, prioridad A.I. y fechas de apertura/cierre autorizadas para Establecimiento.

##### CA-07 — Persona sin caso A.I.

**Dado** que no existen casos visibles, **cuando** se consulta el perfil, **entonces** debe indicarse claramente.

##### CA-08 — Protección de información interna

Dado que el usuario pertenece a Establecimiento, cuando consulta el perfil, entonces no debe acceder a valoración completa, factores detallados, nivel de riesgo, nivel de protección, plan interno, atenciones detalladas, documentos sensibles ni demás gestión interna restringida.

##### CA-09 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-010 — Consultar la información integral disponible de un cliente/beneficiaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar los datos disponibles, casos e historial de un cliente/beneficiaria, **para** comprender su situación dentro de Atención Interdisciplinaria sin volver a recopilar información ya existente.

#### Criterios de aceptación

##### CA-01 — Datos básicos

**Dado** que se selecciona una persona, **cuando** se abre su perfil, **entonces** debe visualizar al menos identificación, nombre, fecha de nacimiento, edad, sexo, establecimiento, Oficina Local, Región y modalidades o servicios disponibles.

##### CA-02 — Información de persona encargada

**Dado** que existe información institucional disponible, **cuando** se consulta el perfil, **entonces** podrá visualizarse de forma contextual la persona encargada, relación, contacto y dirección registrados.

##### CA-03 — Procedencia de datos

**Dado** que la información proviene de otra fuente institucional, **cuando** se utiliza en SIA-CENCINAI, **entonces** debe conservarse su procedencia cuando corresponda.

##### CA-04 — Casos asociados

**Dado** que la persona posee casos A.I., **cuando** se consulta el perfil, **entonces** deben mostrarse y permitir acceso según permisos.

##### CA-05 — Historial

**Dado** que existen eventos registrados, **cuando** se consulta el historial, **entonces** deben mostrarse cronológicamente.

##### CA-06 — Evitar redigitación

**Dado** que un dato maestro ya existe, **cuando** se utiliza la persona en otro flujo, **entonces** el sistema debe reutilizarlo en lugar de solicitarlo nuevamente.

##### CA-07 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-011 — Consultar información de un cliente/beneficiaria desde Nivel Regional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** consultar la información permitida de un cliente/beneficiaria y sus casos A.I., **para** dar seguimiento técnico sin modificar la gestión de Oficina Local.

#### Criterios de aceptación

##### CA-01 — Consultar datos básicos

**Dado** que se selecciona una persona, **cuando** se abre su perfil, **entonces** deben mostrarse únicamente los datos permitidos.

##### CA-02 — Mostrar pertenencia institucional

**Dado** que la persona pertenece a un establecimiento, **cuando** se consulta, **entonces** deben mostrarse establecimiento, Oficina Local y Región.

##### CA-03 — Consultar casos asociados

**Dado** que existen casos A.I., **cuando** se consulta el perfil, **entonces** deben mostrarse los casos visibles para Regional.

##### CA-04 — Acceder al caso permitido

**Dado** que se selecciona un caso, **cuando** se abre, **entonces** debe mostrarse en modo lectura según permisos.

##### CA-05 — Consultar historial permitido

**Dado** que existen eventos, **cuando** se consulta el historial, **entonces** deben mostrarse únicamente los autorizados.

##### CA-06 — Solo lectura

**Dado** que la gestión corresponde a Oficina Local, **cuando** Regional consulta información individual, **entonces** no debe poder modificarla.

##### CA-07 — Protección de información sensible

**Dado** que existen datos sujetos a permisos adicionales, **cuando** se consulta el expediente, **entonces** deben aplicarse las restricciones institucionales correspondientes.

##### CA-08 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

### HU-012 — Consultar información de un cliente/beneficiaria desde Nivel Nacional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar la información permitida de un cliente/beneficiaria y sus casos A.I., **para** dar seguimiento institucional sin modificar la gestión operativa.

#### Criterios de aceptación

##### CA-01 — Consultar datos básicos

**Dado** que se selecciona una persona, **cuando** se abre su perfil, **entonces** deben mostrarse únicamente los datos permitidos.

##### CA-02 — Consultar ubicación institucional

**Dado** que la persona está asociada a un establecimiento, **cuando** se consulta, **entonces** deben visualizarse establecimiento, Oficina Local y Región.

##### CA-03 — Consultar casos asociados

**Dado** que existen casos A.I., **cuando** se consulta el perfil, **entonces** deben mostrarse los casos accesibles para Nivel Nacional.

##### CA-04 — Acceder al detalle permitido

**Dado** que se selecciona un caso, **cuando** se abre, **entonces** debe consultarse en modo lectura.

##### CA-05 — Consultar historial permitido

**Dado** que existen eventos, **cuando** se consulta el historial, **entonces** deben mostrarse únicamente los autorizados.

##### CA-06 — Impedir modificación operativa

**Dado** que el usuario pertenece al Nivel Nacional, **cuando** consulta información individual, **entonces** no debe poder modificar registros operativos.

##### CA-07 — Restringir información sensible

**Dado** que existen restricciones adicionales, **cuando** se accede al expediente, **entonces** deben aplicarse antes de mostrar la información.

##### CA-08 — Acceso contextual sin pantalla general

**Dado** que se requiere localizar o consultar una persona, **cuando** se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, **entonces** se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

---

## EP-02 — Detección y referencia

### HU-013 — Crear manualmente una referencia a Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

#### Historia de Usuario

**Como** usuario autorizado de un Establecimiento u Oficina Local, **quiero** registrar una referencia estructurada a Atención Interdisciplinaria para un cliente/beneficiaria dentro de mi ámbito, **para** documentar y remitir la información necesaria para valorar una posible necesidad de Atención Interdisciplinaria.

#### Criterios de aceptación

##### CA-01 — Seleccionar cliente/beneficiaria mediante búsqueda

**Dado** que se inicia una referencia, **cuando** debe identificarse al cliente/beneficiaria, **entonces** debe buscarse por identificación o nombre y no mediante una lista masiva.

##### CA-02 — Restringir selección según ámbito

**Dado** que el usuario crea una referencia, **cuando** busca al cliente/beneficiaria, **entonces** los resultados deben limitarse a su ámbito autorizado.

##### CA-03 — Reutilizar datos existentes

**Dado** que existen datos institucionales disponibles, **cuando** se selecciona al cliente/beneficiaria, **entonces** el sistema debe reutilizarlos y evitar solicitar su redigitación.

##### CA-04 — Permitir creación según rol autorizado

**Dado** que el usuario posee autorización de nivel Establecimiento como profesional, ASC2 o ASC3, o autorización operativa de Oficina Local, **cuando** inicia una referencia, **entonces** debe poder crearla dentro de su ámbito.

##### CA-05 — Registrar fecha

**Dado** que se crea una referencia, **cuando** se completa su información inicial, **entonces** debe registrarse la fecha correspondiente.

##### CA-06 — Registrar Vía de Atención

**Dado** que se crea una referencia, **cuando** se define la Vía de Atención, **entonces** debe poder seleccionarse `Urgencia` o `No inmediata`.

##### CA-07 — Registrar origen

**Dado** que debe registrarse cómo se identificó la situación, **cuando** se define el origen, **entonces** debe seleccionarse una de las opciones vigentes:

- `Vigilancia / tamizaje`.
- `Observación`.
- `Información aportada por la familia u otros`.
- `Referencia externa`.

##### CA-08 — Determinar automáticamente quién realiza la referencia

**Dado** que el usuario se encuentra autenticado, **cuando** crea una referencia, **entonces** el sistema debe obtener automáticamente su identidad y conservarla como responsable de la referencia.

##### CA-09 — Impedir edición del responsable

**Dado** que la identidad del responsable proviene de la sesión institucional, **cuando** se completa la referencia, **entonces** no debe existir un campo editable para sustituir manualmente a quien realiza la referencia.

##### CA-10 — Motivos de Crecimiento

**Dado** que se selecciona la categoría Crecimiento, **cuando** se muestran sus motivos, **entonces** deben contemplarse `Condición de malnutrición` y `Malnutrición con necesidades especiales`, sin una opción genérica de otra alteración.

##### CA-11 — Motivos de Desarrollo

**Dado** que se selecciona Desarrollo, **cuando** se muestran sus motivos, **entonces** deben existir únicamente:

- `EDIN II: riesgo de retraso (rojo)`.
- `EVADE: riesgo de rezago (0,1 sin logro de edad anterior)`.

##### CA-12 — Motivos de Salud

**Dado** que la categoría Salud puede contener situaciones no previstas, **cuando** se muestran sus motivos, **entonces** podrá mantenerse la opción `Otra condición de salud` junto con las alternativas estructuradas vigentes.

##### CA-13 — Factores de riesgo

**Dado** que se seleccionan factores de riesgo como motivo de referencia, **cuando** se muestran las opciones, **entonces** deben distinguirse al menos los ámbitos individual, hogar-familiar y comunitario y no debe existir un `Otro factor de riesgo` genérico.

##### CA-14 — Seleccionar múltiples motivos

**Dado** que pueden coexistir diferentes condiciones, **cuando** se registran los motivos, **entonces** debe poder seleccionarse más de uno.

##### CA-15 — Especificar un motivo seleccionado

**Dado** que un motivo requiere contextualización, **cuando** se selecciona, **entonces** debe poder registrarse un detalle textual asociado.

##### CA-16 — Mantener relación selección-detalle

**Dado** que un motivo posee detalle asociado, **cuando** se elimina de la selección, **entonces** el sistema debe eliminar o invalidar también su detalle.

##### CA-17 — Registrar acciones realizadas previamente

**Dado** que se han realizado acciones antes de referir, **cuando** se completa la referencia, **entonces** debe existir un campo para documentarlas.

##### CA-18 — Registrar resultados previos

**Dado** que las acciones previas produjeron resultados, **cuando** se completa la referencia, **entonces** debe existir un campo diferenciado para documentarlos.

##### CA-19 — Registrar información complementaria asociada al motivo de referencia

Dado que existe contexto útil relacionado con el motivo, cuando se completa la referencia, entonces debe poder registrarse en un campo diferenciado de información complementaria asociada al motivo de referencia, sin exigir una historia narrativa extensa del niño o su familia.

##### CA-20 — Navegación estructurada

**Dado** que el usuario completa una referencia, **cuando** avanza por el formulario, **entonces** la captura debe organizarse en etapas y permitir regresar antes de guardar.

##### CA-21 — Enfocar la interfaz durante la creación

**Dado** que el usuario se encuentra confeccionando una referencia, **cuando** está dentro del flujo de creación, **entonces** la interfaz no debe mostrar simultáneamente la bandeja y detalle de referencias existentes cuando estos no sean necesarios para completar la tarea.

##### CA-22 — Cliente/beneficiaria obligatorio

**Dado** que no se seleccionó una persona válida, **cuando** se intenta avanzar, **entonces** el sistema debe impedirlo.

##### CA-23 — Mostrar datos reutilizados en la revisión

Dado que se llega al paso final, cuando se revisa la referencia, entonces deben mostrarse compactamente los datos disponibles de identificación, nombre, fecha de nacimiento, edad, sexo y modalidades/servicios, seguidos del contexto territorial en orden Región → Oficina Local → Establecimiento y los datos disponibles de persona encargada, relación, contacto y dirección.

##### CA-24 — Mostrar responsable en modo lectura

**Dado** que el sistema conoce quién realiza la referencia, **cuando** se presenta la revisión final, **entonces** esta persona debe mostrarse como información no editable.

##### CA-25 — Asignar consecutivo institucional

Dado que la referencia se registra, cuando se identifica documentalmente, entonces debe disponer del consecutivo DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX conforme a RF-114, que puede coexistir con un identificador técnico interno.

`DNCC-DRXX-OLXXX-{código establecimiento}-REF-XXX-20XX`.

##### CA-26 — Vincular consecutivo con el establecimiento del niño

**Dado** que el consecutivo contiene información territorial, **cuando** se construye o valida, **entonces** el código de establecimiento debe corresponder al establecimiento asociado al cliente/beneficiaria y no a la ubicación de quien confecciona la referencia.

##### CA-27 — Preservar contexto histórico

Dado que los datos institucionales pueden cambiar, cuando se registra la referencia, entonces deben preservarse persona encargada, relación, contacto, dirección, modalidades/servicios, Región, Oficina Local, establecimiento y edad al momento de la referencia, cuando estén disponibles, sin actualización retroactiva por cambios maestros.

##### CA-28 — Registrar y enviar referencia

Dado que la información fue revisada, cuando el usuario confirma el envío, entonces la referencia debe quedar registrada y asociada al cliente/beneficiaria y a su contexto institucional, disponible inmediatamente para Oficina Local.

##### CA-29 — Estado después del envío

Dado que la referencia fue enviada, cuando finaliza el proceso, entonces debe quedar Pendiente de revisión en Oficina Local, sin confirmación manual de recepción ni estado manual Recibida.

##### CA-30 — Conservar comprobante de envío

Dado que se confirma el envío digital, cuando se registra, entonces el sistema debe conservar automáticamente fecha, hora e identidad institucional del usuario que realizó el envío como datos no editables, diferenciados de la generación o impresión del documento.

##### CA-31 — Comprobar caso activo antes del registro

**Dado** que se inicia una referencia, **cuando** se identifica a la persona y antes de registrarla, **entonces** se comprueba globalmente si posee un caso A.I. activo; si existe se bloquea la referencia incompatible y se informa sin revelar detalles internos no autorizados; una referencia pendiente no equivale a un caso activo.

---

### HU-014 — Cargar una referencia desde una plantilla estandarizada

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** PROPUESTA DE DISEÑO VALIDADA

#### Historia de Usuario

**Como** usuario autorizado de Establecimiento u Oficina Local, **quiero** cargar una plantilla estandarizada previamente completada, **para** precargar una referencia sin volver a transcribir toda la información capturada externamente.

#### Criterios de aceptación

##### CA-01 — Descargar plantilla

**Dado** que se requiere captura mediante plantilla, **cuando** se selecciona la opción correspondiente, **entonces** debe poder descargarse la versión compatible vigente.

##### CA-02 — Cargar archivo

**Dado** que existe una plantilla completada, **cuando** se selecciona el archivo, **entonces** debe iniciarse la precarga.

##### CA-03 — Validar estructura

**Dado** que se carga un archivo, **cuando** se procesa, **entonces** debe comprobarse su estructura antes de utilizar los datos.

##### CA-04 — Precargar formulario

**Dado** que la plantilla es válida, **cuando** finaliza su procesamiento, **entonces** los valores compatibles deben precargarse.

##### CA-05 — Revisión humana

**Dado** que los datos fueron precargados, **cuando** se continúa el flujo, **entonces** deben poder revisarse y corregirse antes de guardar.

##### CA-06 — Responsable automático

**Dado** que la referencia es confirmada por un usuario autenticado, **cuando** se guarda, **entonces** el responsable deberá obtenerse de su identidad institucional y no de un valor editable de la plantilla.

##### CA-07 — Aplicar mismas reglas

**Dado** que la información fue revisada, **cuando** se confirma la referencia, **entonces** debe cumplir las mismas reglas de motivos, Vía de Atención, origen, consecutivo, asociación territorial y contexto histórico que una referencia creada directamente.

##### CA-08 — Confirmar envío digital

Dado que se revisó la precarga y se confirma su envío, cuando se registra la referencia, entonces debe quedar inmediatamente disponible para Oficina Local como Pendiente de revisión, con fecha, hora y usuario del envío automáticos y no editables.

##### CA-09 — Validar unicidad también desde plantilla

**Dado** que una referencia procede de plantilla, **cuando** se valida y confirma su registro, **entonces** se aplica el mismo bloqueo por caso A.I. activo que en HU-013, sin revelar información restringida ni equiparar una referencia pendiente con un caso activo.

---

### HU-015 — Consultar las referencias del establecimiento

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, ASC2 o ASC3 con acceso de nivel Establecimiento, **quiero** consultar las referencias correspondientes a mis establecimientos autorizados, **para** conocer cuáles han sido registradas y revisar su estado e información principal.

#### Criterios de aceptación

##### CA-01 — Restringir referencias por ámbito

**Dado** que el usuario posee acceso de Establecimiento, **cuando** abre Referencias, **entonces** únicamente debe visualizar las correspondientes a sus establecimientos autorizados.

##### CA-02 — Información resumida

Dado que existen referencias visibles, cuando se presenta el listado, entonces debe mostrar consecutivo, cliente/beneficiaria, identificación, establecimiento, responsable, fecha/hora de envío, estado y Vía de Atención.

##### CA-03 — Buscar referencias

**Dado** que existen múltiples referencias, **cuando** se busca por nombre, identificación o consecutivo, **entonces** deben mostrarse únicamente las coincidencias del ámbito autorizado.

##### CA-04 — Filtrar referencias

**Dado** que el usuario necesita organizar las referencias visibles, **cuando** aplica filtros autorizados como estado, Vía de Atención, origen o categoría, **entonces** el listado debe actualizarse sin ampliar su ámbito.

##### CA-05 — Seleccionar referencia

**Dado** que existe una referencia visible, **cuando** se selecciona, **entonces** debe poder consultarse su detalle permitido.

---

### HU-016 — Consultar el detalle de una referencia

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

#### Historia de Usuario

**Como** usuario autorizado de Establecimiento u Oficina Local, **quiero** consultar el detalle de una referencia registrada dentro de mi ámbito, **para** verificar la información remitida, su estado y trazabilidad.

#### Criterios de aceptación

##### CA-01 — Información general

**Dado** que se abre una referencia, **cuando** se carga su detalle, **entonces** deben visualizarse consecutivo institucional, cliente/beneficiaria, identificación, fecha, estado, Vía de Atención y origen.

##### CA-02 — Contexto histórico

**Dado** que la referencia preservó información contextual al registrarse, **cuando** se consulta posteriormente, **entonces** debe mostrar ese contexto histórico y no reemplazarlo retroactivamente por datos maestros actuales.

##### CA-03 — Motivos y especificaciones

**Dado** que existen motivos seleccionados, **cuando** se consulta el detalle, **entonces** deben mostrarse junto con sus especificaciones.

##### CA-04 — Acciones previas y resultados

**Dado** que se registraron acciones y resultados previos, **cuando** se consulta la referencia, **entonces** deben mostrarse como datos diferenciados.

##### CA-05 — Información complementaria asociada al motivo

Dado que se registró información complementaria asociada al motivo de referencia, cuando se consulta el detalle, entonces debe mostrarse separadamente de las acciones previas y sus resultados.

##### CA-06 — Responsable

**Dado** que la referencia fue creada por una persona usuaria autenticada, **cuando** se consulta posteriormente, **entonces** debe mostrarse quién la realizó y ese dato no debe cambiar por cambios posteriores de sesión o rol.

##### CA-07 — Respetar ámbito

**Dado** que el usuario intenta acceder a una referencia, **cuando** esta no pertenece a su ámbito autorizado, **entonces** el acceso debe impedirse.

##### CA-08 — Consultar trazabilidad de envío

Dado que la referencia fue enviada, cuando se consulta su detalle, entonces deben mostrarse fecha y hora de envío y usuario remitente como datos históricos de solo lectura, junto con el estado Pendiente de revisión, Admitida a A.I. o No requiere A.I. que corresponda.

---

### HU-017 — Imprimir una referencia

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / DISEÑO DOCUMENTAL A REFINAR

#### Historia de Usuario

**Como** usuario autorizado de Establecimiento u Oficina Local, **quiero** generar una versión imprimible de una referencia registrada, **para** utilizarla como respaldo documental cuando sea necesario.

#### Criterios de aceptación

##### CA-01 — Generar versión imprimible

**Dado** que existe una referencia, **cuando** se selecciona imprimir, **entonces** debe generarse una representación preparada para impresión.

##### CA-02 — Identificación documental

**Dado** que se genera el documento, **cuando** se presenta, **entonces** debe incluir el consecutivo institucional y la fecha.

##### CA-03 — Datos del cliente/beneficiaria

**Dado** que la referencia contiene información de identificación y contexto, **cuando** se imprime, **entonces** debe incluir al menos nombre, identificación, fecha de nacimiento, edad al momento de la referencia, sexo y los datos institucionales pertinentes disponibles.

##### CA-04 — Datos territoriales

Dado que la referencia pertenece a un establecimiento, cuando se imprime, entonces deben presentarse después de los datos principales de identificación en orden Región → Oficina Local → Establecimiento.

##### CA-05 — Datos de referencia

Dado que se genera el documento, cuando se imprime, entonces debe incluir título, consecutivo, fecha de referencia, fecha y hora de envío, responsable, identificación, nombre, fecha de nacimiento, edad de la referencia, sexo, modalidades/servicios, contexto territorial, persona encargada, relación, contacto, dirección, Vía de Atención, origen, motivos, especificaciones, acciones previas, resultados e información complementaria asociada al motivo, según los datos disponibles.

##### CA-06 — Información contextual

**Dado** que la referencia preservó datos históricos de contexto, **cuando** se imprime posteriormente, **entonces** debe utilizar esos valores preservados.

##### CA-07 — Presentación documental

Dado que la salida se utiliza como respaldo institucional, cuando exista un diseño aprobado, entonces debe aplicar logo, encabezado, paginación y demás elementos institucionales autorizados sin imponer un diseño gráfico concreto.

##### CA-08 — No alterar el registro

**Dado** que se genera una impresión, **cuando** finaliza el proceso, **entonces** la referencia original no debe modificarse.

##### CA-09 — Diferenciar envío y generación documental

Dado que se genera o imprime un comprobante, cuando se presenta su trazabilidad, entonces la fecha y hora de envío deben permanecer inalteradas y distinguirse de la fecha y hora de generación o impresión cuando estas se conserven.

---

### HU-018 — Consultar referencias de Atención Interdisciplinaria pendientes de revisión

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar las referencias a Atención Interdisciplinaria enviadas desde los establecimientos de mi ámbito, **para** identificar las situaciones pendientes de revisión y organizar su análisis interdisciplinario.

#### Criterios de aceptación

##### CA-01 — Bandeja de referencias

**Dado** que existen referencias en la Oficina Local, **cuando** se abre la sección, **entonces** debe mostrarse el listado correspondiente al ámbito.

##### CA-02 — Información resumida

Dado que una referencia aparece en la bandeja, cuando se presenta, entonces debe mostrar consecutivo, cliente/beneficiaria, identificación, establecimiento, responsable, fecha/hora de envío, estado y Vía de Atención.

##### CA-03 — Buscar y filtrar

**Dado** que existen múltiples referencias, **cuando** el usuario aplica búsqueda o filtros de estado, Vía de Atención, origen o categoría, **entonces** deben mostrarse únicamente los registros que correspondan.

##### CA-04 — Disponibilidad inmediata por envío digital

Dado que un usuario autorizado envió una referencia mediante SIA, cuando finaliza el envío, entonces debe aparecer inmediatamente en la bandeja de Oficina Local como Pendiente de revisión sin registrar un recibido manual.

##### CA-05 — Mantener origen y consecutivo

**Dado** que la referencia proviene de un establecimiento, **cuando** Oficina Local la consulta, **entonces** deben conservarse su establecimiento de origen, responsable y consecutivo institucional.

##### CA-06 — Distinguir revisión y resultado

Dado que la referencia está pendiente de revisión, cuando el Equipo Interdisciplinario concluye su análisis, entonces debe conservarse el resultado Admitida a A.I. al confirmar la admisión o No requiere A.I. con justificación, sin utilizar Rechazada como denominación del resultado.

---

### HU-049 — Consultar posibles referencias pendientes detectadas desde fuentes institucionales

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** SECCIÓN Y EXPERIENCIA FUNCIONAL VALIDADAS / DETECCIÓN AUTOMÁTICA DEPENDIENTE DE INTEGRACIÓN CON FUENTES AUTORIZADAS Y COORDINACIÓN CON UTIC

#### Historia de Usuario

**Como** personal autorizado de Establecimiento (profesional, ASC2 / ASC3) u Oficina Local, **quiero** consultar la sección independiente Posibles referencias dentro de mi ámbito, **para** revisar situaciones detectadas e iniciar una referencia sin duplicar la información fuente. La detección automática depende de integración autorizada y coordinación con UTIC; no se declara implementada en producción.

#### Criterios de aceptación

##### CA-01 — Reutilizar fuente autorizada

Dado que existe un resultado institucional disponible mediante integración autorizada, cuando cumple un criterio vigente de referencia, entonces podrá detectarse como posible referencia pendiente sin recapturar variables ni recalcular resultados.

##### CA-02 — Aplicar criterios institucionales

Dado que el criterio vigente lo establece, cuando existe condición de malnutrición que amerita referencia, EDIN II rojo o EVADE 0/1 bajo el criterio definido, entonces el resultado debe contrastarse con la gestión existente en SIA, sin sustituir la decisión profesional.

##### CA-03 — Evitar duplicados

Dado que existe una referencia equivalente gestionada en SIA, cuando se evalúa el resultado, entonces no debe presentarse como pendiente ni generar una referencia duplicada.

##### CA-04 — Mostrar contexto de detección

Dado que una situación permanece pendiente, cuando se muestra la lista o alerta, entonces debe incluir cliente/beneficiaria, establecimiento, motivo o criterio y fecha o período del resultado cuando estén disponibles.

##### CA-05 — Respetar permisos

Dado que la función se asigna institucionalmente a personal autorizado, cuando se presentan situaciones, entonces los resultados deben restringirse al permiso y ámbito autorizados de la persona usuaria que tenga asignada esta función, sin conceder acceso al detalle interno de casos.

##### CA-06 — Iniciar gestión autorizada

Dado que se selecciona una situación, cuando el usuario actúa, entonces debe poder localizar al cliente/beneficiaria o iniciar el flujo autorizado de referencia con revisión humana.

##### CA-07 — Resolver pendiente

Dado que se gestiona la referencia correspondiente, cuando se actualiza la detección, entonces la situación debe dejar de mostrarse como pendiente, conservando la trazabilidad pertinente.

##### CA-08 — No abrir casos automáticamente

Dado que se detecta un resultado o se inicia una referencia, cuando continúa el proceso, entonces no debe abrirse automáticamente un caso A.I. sin valoración y decisión del equipo.

##### CA-09 — Dependencia institucional

Dado que la detección depende de fuentes autorizadas, cuando se habilita, entonces debe utilizar el mecanismo definido con UTIC y los criterios institucionales vigentes, sin imponer evento, consulta periódica ni periodicidad técnica; se relaciona con RF-127 y CU-37.

##### CA-10 — Sección independiente con búsqueda y paginación

**Dado** que el personal autorizado de Establecimiento u Oficina Local accede a Posibles referencias, **cuando** consulta la sección separada de la bandeja ordinaria de Referencias, **entonces** dispone de paginación, búsqueda por identificación y nombre y filtros por establecimiento, fecha de detección y criterio o categoría, siempre limitados al ámbito y permisos.

##### CA-11 — Confirmar una sola referencia desde la sugerencia

**Dado** que dos personas intentan crear una referencia desde la misma sugerencia, **cuando** confirman la operación, **entonces** solo una operación válida puede confirmarse; se comprueba la ausencia de referencia equivalente duplicada y de caso A.I. activo incompatible, se informa sin revelar detalles no autorizados y se conserva trazabilidad de detección y gestión.

---

## EP-03 — Sesión y valoración interdisciplinaria

### HU-019 — Gestionar una sesión interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** integrante del Equipo Interdisciplinario de Oficina Local, **quiero** crear y gestionar una sesión interdisciplinaria con múltiples situaciones por analizar, **para** organizar el análisis conjunto de las referencias recibidas.

#### Criterios de aceptación

##### CA-01 — Crear sesión

**Dado** que el EE.II. necesita registrar una sesión, **cuando** la crea, **entonces** debe poder registrar fecha, horario y lugar.

##### CA-02 — Registrar disciplinas participantes

**Dado** que participan diferentes perfiles profesionales, **cuando** se configura la sesión, **entonces** deben poder indicarse una o varias disciplinas del catálogo vigente. Las Disciplinas se seleccionan mediante un selector múltiple convencional y compacto, como lista o desplegable multiselección con búsqueda opcional, sin chips/globitos como mecanismo principal de entrada y conservando las opciones y reglas vigentes (RF-038, RF-120).

##### CA-03 — No incluir disciplina genérica

**Dado** que el catálogo institucional define las disciplinas aplicables, **cuando** se seleccionan participantes profesionales, **entonces** no debe existir una disciplina genérica `Otra` salvo que el procedimiento vuelva a incorporarla formalmente.

##### CA-04 — Permitir sesión sin casos iniciales

**Dado** que una sesión puede programarse anticipadamente, **cuando** se crea, **entonces** no debe ser obligatorio incorporar referencias de inmediato.

##### CA-05 — Buscar referencias

**Dado** que se desea incorporar una situación, **cuando** se busca, **entonces** debe localizarse por identificación o nombre sin utilizar una lista masiva.

##### CA-06 — Múltiples referencias

**Dado** que una sesión puede analizar múltiples situaciones, **cuando** se agregan referencias, **entonces** debe permitirse asociar varias a la misma sesión.

##### CA-07 — Evitar duplicados

**Dado** que una referencia ya forma parte de la sesión, **cuando** intenta agregarse nuevamente, **entonces** el sistema debe impedirlo.

##### CA-08 — Valoración dentro de la Sesión interdisciplinaria

Dado que se abre la Valoración situacional de una situación de la sesión, cuando se revisan los Factores, entonces se aplican las categorías colapsables, la persistencia de selecciones y las validaciones de HU-020 CA-12 a CA-14 y CU-08, sin alterar la clasificación institucional.

##### CA-09 — Incorporar casos activos para revaloración

**Dado** que surgen situaciones nuevas en un caso activo del ámbito, **cuando** el Equipo Interdisciplinario organiza otra sesión, **entonces** puede buscarlo por identificación o nombre y asociarlo una sola vez a la sesión para revalorarlo sin abrir otro caso.

---

### HU-020 — Registrar la valoración situacional de un caso

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** MODELO OBJETIVO / ACTUALIZADO Y VALIDADO FUNCIONALMENTE

#### Historia de Usuario

**Como** integrante del Equipo Interdisciplinario de Oficina Local, **quiero** registrar factores protectores, factores de riesgo y signos de alerta en los ámbitos individual, hogar-familiar y comunitario, así como los niveles globales de riesgo y protección, **para** disponer de una valoración estructurada que sustente la decisión interdisciplinaria.

#### Criterios de aceptación

##### CA-01 — Ámbito individual

**Dado** que el equipo analiza una situación, **cuando** registra la valoración individual, **entonces** debe poder seleccionar factores protectores, factores de riesgo y signos de alerta.

##### CA-02 — Ámbito hogar-familiar

**Dado** que se analiza el contexto familiar, **cuando** se completa ese ámbito, **entonces** deben poder registrarse los factores correspondientes.

##### CA-03 — Ámbito comunitario

**Dado** que se analiza el entorno comunitario, **cuando** se completa ese ámbito, **entonces** deben poder registrarse los factores correspondientes.

##### CA-04 — Múltiples factores

**Dado** que pueden coexistir varios elementos, **cuando** se realiza la valoración, **entonces** debe permitirse seleccionar múltiples factores dentro de cada ámbito.

##### CA-05 — Especificación textual

**Dado** que un factor seleccionado requiere contexto, **cuando** el profesional lo considera necesario, **entonces** debe poder registrar una especificación asociada.

##### CA-06 — Elementos abiertos del instrumento

**Dado** que el instrumento vigente contemple opciones abiertas equivalentes a `Otro` o `Entre otros`, **cuando** la situación no quede adecuadamente representada por los elementos estructurados, **entonces** podrá registrarse la especificación correspondiente.

##### CA-07 — No exigir intensidad, frecuencia o persistencia

**Dado** que dichos campos no forman parte obligatoria del modelo vigente, **cuando** se completa la valoración, **entonces** el sistema no debe exigirlos.

##### CA-08 — Registrar nivel de riesgo profesional

Dado que el equipo concluye el análisis de factores, cuando establece el nivel global de riesgo, entonces debe registrar Alto, Moderado o Bajo mediante valoración profesional; la selección de checkboxes no debe determinarlo automáticamente.

##### CA-09 — Registrar nivel de protección

**Dado** que el equipo concluye el análisis de factores protectores, **cuando** establece el nivel global, **entonces** debe poder registrar `Alta`, `Moderada` o `Baja`.

##### CA-10 — Conservar ambos niveles

**Dado** que riesgo y protección son dimensiones distintas, **cuando** se guarda la valoración, **entonces** ambos valores deben conservarse de forma independiente.

##### CA-11 — Utilizar catálogos vigentes

**Dado** que factores, riesgos, elementos protectores o signos de alerta pueden evolucionar con el procedimiento, **cuando** se realiza una valoración, **entonces** debe utilizarse la versión institucional vigente aplicable.

##### CA-12 — Categorías colapsables

Dado que se abre la Valoración situacional, cuando se presentan los Factores, entonces cada categoría aparece inicialmente compacta y puede expandirse al hacer clic para mostrar sus factores y volver a contraerse; cerrar y reabrir conserva las selecciones. No es necesario visualizar todos los factores simultáneamente ni cambia su clasificación o significado institucional (RF-042).

##### CA-13 — Respuesta explícita por categoría requerida

Dado que se intenta continuar o finalizar la etapa correspondiente, cuando alguna categoría requerida no tiene respuesta, entonces el sistema bloquea el avance, identifica las categorías pendientes y muestra una validación comprensible. Es válido seleccionar uno o más factores aplicables o marcar explícitamente Ninguno. Ninguno significa que la categoría fue revisada y no se identificaron factores aplicables; no significa dato faltante, pendiente, no revisado o desconocido (RF-043, RN-008).

##### CA-14 — Exclusividad y selección múltiple

Dado que una categoría tiene Ninguno, cuando se selecciona otro factor, entonces Ninguno debe retirarse o la persona debe desmarcarlo antes de continuar; la combinación no es válida. Las selecciones múltiples utilizan controles claros y estructurados según RNF-009, manteniendo opciones y reglas vigentes (RF-043, RN-008).

##### CA-15 — Conservar revaloraciones del caso activo

**Dado** que existe un caso activo con valoraciones previas, **cuando** el equipo registra una nueva valoración en otra sesión, **entonces** puede incorporar nuevos factores protectores, de riesgo o signos de alerta y actualizar profesionalmente riesgo y protección; se recalcula prioridad por RN-009 sin selección manual y se conservan valoraciones, prioridades históricas, fechas y responsables sin sobrescribir el pasado.

---

### HU-021 — Resolver si un caso requiere Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

#### Historia de Usuario

**Como** Equipo Interdisciplinario de Oficina Local, **quiero** registrar la decisión sobre si una situación requiere Atención Interdisciplinaria, **para** formalizar el resultado del análisis y determinar cómo debe continuar el proceso.

#### Criterios de aceptación

##### CA-01 — Decisión explícita

**Dado** que una situación fue analizada, **cuando** concluye la valoración, **entonces** debe registrarse `Sí requiere A.I.` o `No requiere A.I.`.

##### CA-02 — Exigir justificación cuando no requiere A.I.

**Dado** que se selecciona `No requiere A.I.`, **cuando** se intenta confirmar la decisión, **entonces** debe ser obligatorio registrar una justificación.

##### CA-03 — No abrir caso

**Dado** que se confirmó `No requiere A.I.`, **cuando** se guarda la resolución, **entonces** debe conservarse la valoración y su justificación sin crear un caso A.I. activo.

##### CA-04 — Requiere A.I.

**Dado** que se selecciona `Sí requiere A.I.`, **cuando** continúa el flujo, **entonces** deben habilitarse los datos necesarios para completar el abordaje inicial.

##### CA-05 — Mantener trazabilidad de resolución

Dado que se registra una decisión, cuando se confirma, entonces debe conservarse su relación con referencia y sesión; No requiere A.I. queda como resultado justificado y Sí requiere A.I. continúa hasta la admisión y apertura mediante HU-022.

##### CA-06 — Respetar el caso activo existente

**Dado** que se analiza una situación, **cuando** se determina que la persona ya tiene un caso A.I. activo en cualquier ámbito, **entonces** la resolución no habilita otro caso simultáneo; las situaciones nuevas del caso activo se revaloran en ese mismo caso mediante una nueva sesión autorizada.

---

### HU-022 — Definir el abordaje inicial y abrir el caso de A.I.

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / MODELO OBJETIVO ACTUALIZADO

#### Historia de Usuario

**Como** Equipo Interdisciplinario de Oficina Local, **quiero** registrar el nivel de riesgo y protección, obtener la prioridad resultante y definir propósitos, estrategias, disciplinas y frecuencia inicial de un caso que requiere A.I., **para** abrir formalmente el caso con un abordaje estructurado.

#### Criterios de aceptación

##### CA-01 — Utilizar riesgo y protección registrados

**Dado** que el caso requiere A.I., **cuando** se completa su abordaje, **entonces** deben estar disponibles el nivel de riesgo y el nivel de protección establecidos por el equipo.

##### CA-02 — Calcular prioridad automáticamente

**Dado** que existen un nivel de riesgo y protección válidos, **cuando** ambos están definidos, **entonces** el sistema debe calcular la prioridad sin solicitar su selección manual.

##### CA-03 — Aplicar la matriz institucional

Dado que riesgo y protección están registrados, cuando se calcula prioridad, entonces debe aplicarse la matriz única de RN-009.

##### CA-04 — Recalcular ante cambios de valoración

Dado que el equipo corrige riesgo o protección antes de confirmar, cuando cambia la combinación, entonces debe recalcularse la prioridad conforme a RN-009 sin edición manual.

##### CA-05 — Validar dimensiones requeridas

Dado que falta riesgo o protección, cuando se intenta concluir el abordaje, entonces no debe asignarse una prioridad arbitraria y debe solicitarse completar la valoración profesional.

##### CA-06 — Mostrar semáforo

**Dado** que se calculó una prioridad, **cuando** se presenta al equipo, **entonces** podrá representarse visualmente como rojo para Alto, ámbar para Moderado y verde para Bajo.

##### CA-07 — Diferenciar prioridad de Vía de Atención

**Dado** que la referencia puede tener Vía de Atención `Urgencia`, **cuando** se calcula la prioridad A.I., **entonces** `Urgencia` no debe utilizarse como nivel de prioridad; los únicos niveles son Alto, Moderado y Bajo.

##### CA-08 — Registrar propósitos

**Dado** que el caso requiere atención, **cuando** se define el abordaje, **entonces** deben poder registrarse uno o más propósitos.

##### CA-09 — Seleccionar estrategias

**Dado** que el equipo define el abordaje, **cuando** configura el plan inicial, **entonces** debe poder seleccionar múltiples estrategias.

##### CA-10 — Seleccionar disciplinas

**Dado** que pueden participar diferentes áreas profesionales, **cuando** se configura el plan, **entonces** debe poder asociarse una o varias disciplinas vigentes sin utilizar una disciplina genérica `Otra`.

##### CA-11 — Registrar frecuencia planificada

Dado que se define la periodicidad esperada del abordaje, cuando se abre el caso, entonces deben mantenerse las alternativas vigentes e incluir Trimestral, Semestral y Según necesidad; la frecuencia expresa planificación y no garantiza intervalos exactos ni determina la periodicidad institucional de reuniones del equipo.

##### CA-12 — Abrir caso

**Dado** que el abordaje está completo, **cuando** el equipo confirma, **entonces** debe crearse un caso A.I. activo vinculado a la persona y referencia de origen.

##### CA-13 — Conservar consecutivo de origen

**Dado** que el caso nace de una referencia, **cuando** se crea, **entonces** debe mantener asociado el consecutivo institucional de dicha referencia.

##### CA-14 — Conservar contexto histórico

**Dado** que la referencia preservó información contextual, **cuando** se abre el caso, **entonces** el caso debe poder mantener ese contexto de ingreso sin sustituirlo retroactivamente por cambios futuros de datos maestros.

##### CA-15 — Registrar evento inicial

**Dado** que el caso fue abierto, **cuando** se crea, **entonces** debe incorporarse el evento de admisión a su historial longitudinal.

##### CA-16 — Revalidar unicidad al confirmar

**Dado** que el equipo confirma una apertura, **cuando** se verifica nuevamente la existencia de un caso A.I. activo de la persona en cualquier establecimiento u Oficina Local, **entonces** solo se confirma si no existe otro activo, evitando duplicados por concurrencia; se informa del bloqueo sin exponer detalles no autorizados y se permiten nuevos casos si los anteriores están cerrados.

##### CA-17 — Actualizar abordaje tras revaloración

**Dado** que un caso ya está activo y se revalora en nueva sesión, **cuando** cambian profesionalmente riesgo o protección, **entonces** se recalcula la prioridad por RN-009 y se actualiza el abordaje o plan cuando corresponda, conservando su evolución y sin ejecutar otra apertura.

---

## EP-04 — Gestión del caso A.I.

### HU-023 — Consultar una lista simplificada de Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, ASC2 o ASC3 con acceso de nivel Establecimiento, **quiero** consultar una lista simplificada de los clientes/beneficiarias de mis establecimientos que poseen o han poseído un caso A.I., **para** conocer su vinculación general sin acceder al expediente interno de Oficina Local.

#### Criterios de aceptación

##### CA-01 — Restringir ámbito

**Dado** que el usuario posee acceso de Establecimiento, **cuando** consulta la Lista de A.I., **entonces** debe visualizar únicamente casos correspondientes a sus establecimientos autorizados.

##### CA-02 — Buscar en la lista

**Dado** que existen múltiples registros, **cuando** se busca por identificación o nombre, **entonces** deben mostrarse únicamente las coincidencias autorizadas.

##### CA-03 — Filtrar información autorizada

Dado que existen diferentes estados y prioridades A.I., cuando se aplican filtros de estado o prioridad Alto, Moderado o Bajo, entonces la lista debe actualizarse dentro del ámbito autorizado sin exponer información interna.

##### CA-04 — Mostrar conteo

**Dado** que se aplica búsqueda o filtros, **cuando** cambian los registros, **entonces** debe mostrarse la cantidad visible.

##### CA-05 — Información permitida

**Dado** que se muestra un caso, **cuando** el usuario lo consulta, **entonces** únicamente debe visualizar:

- cliente/beneficiaria;
- identificación;
- establecimiento;
- estado general;
- fecha de apertura;
- fecha de cierre cuando corresponda.
- prioridad A.I. Alto, Moderado o Bajo.

##### CA-06 — Mostrar y filtrar prioridad A.I.

Dado que el usuario es profesional, ASC2 o ASC3 autorizado de Establecimiento, cuando consulta la lista, entonces debe visualizar la prioridad A.I. y poder filtrar por ella sin acceder a nivel de riesgo, nivel de protección ni valoración interna.

##### CA-07 — Impedir acceso al expediente interno

**Dado** que el usuario posee acceso de Establecimiento, **cuando** consulta un caso, **entonces** no debe acceder a valoración, plan, línea de tiempo interna, estrategias, disciplinas, frecuencia, atenciones detalladas, documentos, coordinaciones, traslados, reportes internos o cierre operativo.

##### CA-08 — Múltiples establecimientos autorizados

**Dado** que existen varios establecimientos autorizados, **cuando** se consulta la lista, **entonces** debe habilitarse un filtro limitado a ellos.

##### CA-09 — Único establecimiento autorizado

**Dado** que existe un único establecimiento autorizado, **cuando** se consulta la lista, **entonces** debe aplicarse automáticamente.

##### CA-10 — Sin coincidencias

**Dado** que no existen casos coincidentes, **cuando** finaliza la consulta, **entonces** debe informarse sin ampliar el ámbito.

##### CA-11 — No permitir exportación

**Dado** que se utiliza la Lista de A.I. desde Establecimiento, **cuando** se consulta, **entonces** no debe habilitarse exportación de dicha lista.

---

### HU-024 — Consultar, buscar y filtrar los casos de la Oficina Local

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar y filtrar los casos A.I. de mi ámbito, **para** localizar casos específicos y organizar el trabajo del equipo.

#### Criterios de aceptación

##### CA-01 — Buscar persona

**Dado** que se necesita localizar un caso, **cuando** se busca por identificación o nombre, **entonces** deben mostrarse coincidencias de la Oficina Local.

##### CA-02 — Filtrar por establecimiento

**Dado** que existen múltiples establecimientos, **cuando** se selecciona uno, **entonces** deben mostrarse únicamente sus casos.

##### CA-03 — Filtrar por estado

**Dado** que existen distintos estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse.

##### CA-04 — Filtrar por prioridad

**Dado** que los casos poseen prioridad `Alto`, `Moderado` o `Bajo`, **cuando** se selecciona una, **entonces** deben mostrarse los casos correspondientes.

##### CA-05 — Combinar filtros

**Dado** que se aplican varios criterios, **cuando** se combinan, **entonces** todos deben aplicarse simultáneamente.

##### CA-06 — Mostrar cantidad

**Dado** que existen filtros activos, **cuando** se actualizan los resultados, **entonces** debe mostrarse la cantidad coincidente.

##### CA-07 — Exportar

**Dado** que existe un listado filtrado, **cuando** se exporta, **entonces** debe respetar el mismo corte.

##### CA-08 — Exportación estructurada

**Dado** que se genera una salida tabular, **cuando** se abre externamente, **entonces** debe utilizar encabezados y columnas diferenciadas para los atributos principales.

---

### HU-025 — Consultar el detalle integral de un caso A.I.

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar en un único espacio el contexto de ingreso, resumen, historial y plan de atención de un caso, **para** comprender rápidamente su situación actual y evolución.

#### Criterios de aceptación

##### CA-01 — Encabezado del caso

**Dado** que se abre un caso, **cuando** carga su detalle, **entonces** debe visualizar persona, identificación, establecimiento, identificador técnico, consecutivo de la referencia de origen, apertura, estado y prioridad.

##### CA-02 — Contexto de ingreso

**Dado** que el caso se originó desde una referencia, **cuando** se consulta su resumen, **entonces** debe poder mostrarse el contexto histórico preservado de ingreso, incluyendo cuando corresponda persona encargada, relación, contacto y establecimiento de origen.

##### CA-03 — Riesgo, protección y prioridad vigentes

**Dado** que el caso dispone de una valoración inicial y puede tener revaloraciones, **cuando** se consulta el resumen, **entonces** se muestran los niveles profesionales y la prioridad calculada vigentes, manteniendo consultables las valoraciones y prioridades anteriores según permisos.

##### CA-04 — Resumen

**Dado** que existe información vigente, **cuando** se consulta Resumen, **entonces** debe derivarse de los registros existentes sin exigir redigitación.

##### CA-05 — Línea de tiempo

**Dado** que existen eventos, **cuando** se consulta el historial, **entonces** deben visualizarse cronológicamente admisiones, atenciones, actividades grupales, coordinaciones, traslados, reportes, cierre y demás eventos aplicables.

##### CA-06 — Plan de atención

**Dado** que existe un plan vigente, **cuando** se consulta, **entonces** deben mostrarse propósitos, estrategias, disciplinas y frecuencia.

##### CA-07 — Preservar contexto histórico

**Dado** que posteriormente cambien datos maestros del cliente/beneficiaria, **cuando** se consulta un caso histórico, **entonces** el contexto preservado de su referencia de origen no debe modificarse retroactivamente.

##### CA-08 — Mostrar última atención

Dado que se consulta el detalle autorizado, cuando existen atenciones registradas, entonces debe mostrarse la fecha de la última; si nunca existen, debe indicarse Sin atención registrada.

##### CA-09 — Consultar evolución de valoraciones

**Dado** que existen revaloraciones posteriores a la apertura, **cuando** se consulta el detalle autorizado, **entonces** se muestran la valoración y prioridad vigentes junto con las valoraciones y prioridades históricas, fechas, sesiones y responsables; el cambio no crea otro caso ni sobrescribe registros anteriores.

##### CA-10 — Conservar historial tras traslado

**Dado** que el caso se cerró por Traslado, **cuando** se consulta el historial según permisos, **entonces** se conserva la trayectoria anterior sin ingreso pendiente ni confirmación de continuidad o vinculación obligatoria a un caso de destino.

---

### HU-026 — Gestionar documentos asociados a un caso

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** cargar y consultar documentos relacionados con un caso A.I., **para** mantener la documentación pertinente vinculada al expediente lógico.

#### Criterios de aceptación

##### CA-01 — Consultar documentos

**Dado** que existen documentos, **cuando** se accede a la sección, **entonces** deben mostrarse sus metadatos principales.

##### CA-02 — Cargar documento

**Dado** que se requiere incorporar un archivo, **cuando** se selecciona, **entonces** debe poder asociarse al caso.

##### CA-03 — Registrar metadatos

**Dado** que se incorpora un documento, **cuando** se guarda, **entonces** debe conservar tipo, fecha, responsable y demás metadatos requeridos.

##### CA-04 — Mantener vinculación

**Dado** que el documento fue registrado, **cuando** se consulta posteriormente, **entonces** debe mantenerse vinculado al caso correspondiente.

---

### HU-027 — Registrar una coordinación interinstitucional

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** registrar coordinaciones realizadas con instituciones externas, **para** conservar trazabilidad de las acciones efectuadas fuera de CEN-CINAI.

#### Criterios de aceptación

##### CA-01 — Institución destino

**Dado** que se registra una coordinación, **cuando** se completa, **entonces** debe poder indicarse la institución correspondiente.

##### CA-02 — Responsable

**Dado** que quien digita puede ser diferente de quien realizó la coordinación, **cuando** corresponde, **entonces** debe poder indicarse la persona profesional responsable.

##### CA-03 — Motivo y estado

**Dado** que la coordinación requiere seguimiento, **cuando** se registra, **entonces** deben conservarse motivo, fecha y estado.

##### CA-04 — Relación con el caso

**Dado** que la coordinación forma parte del abordaje, **cuando** se guarda, **entonces** debe quedar vinculada al caso.

---

### HU-028 — Registrar el traslado de un caso hacia otra Oficina Local

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / ACTUALIZADO — VALIDACIÓN CON ALINA 02-11-2026

#### Historia de Usuario

**Como** profesional autorizado de la Oficina Local de origen, **quiero** cerrar con motivo Traslado el caso activo de una persona que cambia de establecimiento, **para** finalizar su gestión de origen conservando su historial consultable según permisos.

#### Criterios de aceptación

##### CA-01 — Cambio de establecimiento

**Dado** que una persona con caso A.I. activo cambia de establecimiento, **cuando** se registra el traslado, **entonces** se documenta el cambio con los datos institucionales de destino disponibles, sin crear ingreso pendiente ni caso de destino.

##### CA-02 — Fecha y motivo

**Dado** que el traslado debe quedar documentado, **cuando** se confirma, **entonces** deben registrarse fecha y motivo.

##### CA-03 — Cierre por traslado

**Dado** que la OL de origen deja de ser responsable, **cuando** confirma el traslado, **entonces** su caso debe cerrarse por traslado.

##### CA-04 — Conservar historial

**Dado** que la necesidad puede continuar, **cuando** se traslada el caso, **entonces** no debe perderse el historial previo.

##### CA-05 — Conservar trazabilidad de origen

**Dado** que el caso deriva de una referencia y trayectoria previa, **cuando** se traslada, **entonces** deben preservarse sus relaciones históricas y el consecutivo de referencia de origen.

##### CA-06 — Nueva referencia independiente en destino

**Dado** que el caso de origen fue cerrado por Traslado, **cuando** la persona aparece asociada al nuevo establecimiento en CAH/SIDINACC, **entonces** el personal autorizado puede crear una referencia completamente nueva con consecutivo propio; si requiere A.I., se abre un caso por el procedimiento normal, sin continuidad automática ni vinculación obligatoria con el anterior.

---

### HU-029 — Confirmar la continuidad de un caso recibido por traslado — RETIRADA DEL ALCANCE VIGENTE

**Prioridad histórica:** P1  
**Estimación:** No aplica  
**Estado:** RETIRADA DEL ALCANCE VIGENTE — validación con Alina del 2 de noviembre de 2026. Identificador reservado; no reutilizar.

#### Historia de Usuario

Historia retirada: la confirmación de continuidad en destino no forma parte del comportamiento vigente. Se conserva el identificador para trazabilidad; el nuevo ingreso, si corresponde, utiliza una referencia nueva y la apertura normal.

#### Criterios de aceptación

##### CA-01 — Mostrar ingreso pendiente — RETIRADO / no exigible

**No aplicable al alcance vigente.** Criterio histórico retirado junto con HU-029; no genera ingreso pendiente, confirmación de continuidad ni apertura automática. Aplican HU-013, HU-022, HU-028 y HU-031.

##### CA-02 — Mostrar origen — RETIRADO / no exigible

**No aplicable al alcance vigente.** Criterio histórico retirado junto con HU-029; no genera ingreso pendiente, confirmación de continuidad ni apertura automática. Aplican HU-013, HU-022, HU-028 y HU-031.

##### CA-03 — Confirmar continuidad — RETIRADO / no exigible

**No aplicable al alcance vigente.** Criterio histórico retirado junto con HU-029; no genera ingreso pendiente, confirmación de continuidad ni apertura automática. Aplican HU-013, HU-022, HU-028 y HU-031.

##### CA-04 — Conservar historia previa — RETIRADO / no exigible

**No aplicable al alcance vigente.** Criterio histórico retirado junto con HU-029; no genera ingreso pendiente, confirmación de continuidad ni apertura automática. Aplican HU-013, HU-022, HU-028 y HU-031.

##### CA-05 — No modificar retroactivamente el caso anterior — RETIRADO / no exigible

**No aplicable al alcance vigente.** Criterio histórico retirado junto con HU-029; no genera ingreso pendiente, confirmación de continuidad ni apertura automática. Aplican HU-013, HU-022, HU-028 y HU-031.

---

### HU-030 — Generar un reporte de un caso sin cerrarlo

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / DISEÑO DE SALIDAS A REFINAR

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** generar un reporte sobre un caso en cualquier momento de su atención, **para** responder a necesidades institucionales sin tener que cerrar el caso.

#### Criterios de aceptación

##### CA-01 — Caso activo

**Dado** que un caso continúa activo, **cuando** se genera un reporte, **entonces** su estado no debe cambiar.

##### CA-02 — Seleccionar tipo o propósito

**Dado** que pueden existir diferentes necesidades, **cuando** se genera un reporte, **entonces** debe poder indicarse su tipo o propósito.

##### CA-03 — Reutilizar historial

**Dado** que el sistema ya posee información del caso, **cuando** se prepara el reporte, **entonces** debe reutilizarse para reducir redigitación.

##### CA-04 — Generar durante cualquier etapa

**Dado** que el caso todavía no ha sido cerrado, **cuando** existe una necesidad de reporte, **entonces** debe poder generarse con la información disponible hasta ese momento.

##### CA-05 — Presentación estructurada

**Dado** que se genera un documento para consulta o impresión, **cuando** se presenta, **entonces** debe organizar la información mediante secciones comprensibles e incluir los identificadores, fecha y contexto necesarios.

##### CA-06 — Aplicar plantilla institucional

**Dado** que posteriormente se defina una plantilla institucional autorizada, **cuando** se genere el reporte, **entonces** deberá incorporar sus elementos gráficos y documentales correspondientes.

##### CA-07 — Conservar historial de reportes

**Dado** que un reporte fue generado, **cuando** se consulta posteriormente el caso, **entonces** debe existir trazabilidad de fecha, tipo, responsable y propósito o motivo.

---

### HU-031 — Cerrar un caso de Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** registrar el cierre de un caso A.I. cuando corresponda, **para** dejar constancia de que la gestión activa ha finalizado.

#### Criterios de aceptación

##### CA-01 — Seleccionar motivo estructurado

**Dado** que se decide cerrar un caso, **cuando** se registra el motivo, **entonces** se selecciona Cierre satisfactorio (objetivos de Atención Interdisciplinaria alcanzados), Traslado u Otro; Otro exige explicación textual.

##### CA-02 — Registrar fecha

**Dado** que el cierre forma parte del historial, **cuando** se ejecuta, **entonces** debe conservarse la fecha.

##### CA-03 — Cambiar estado

**Dado** que el cierre fue confirmado, **cuando** finaliza la operación, **entonces** el caso debe quedar Cerrado.

##### CA-04 — Registrar evento y responsable

**Dado** que el caso fue cerrado, **cuando** se consulta su línea de tiempo, **entonces** se conservan fecha, responsable, motivo estructurado, explicación de Otro cuando aplique y evento de cierre.

##### CA-05 — No confundir con reporte

**Dado** que Reporte y Cierre son acciones independientes, **cuando** se cierra un caso, **entonces** no debe asumirse que generar un reporte sea requisito para hacerlo salvo decisión institucional posterior.

##### CA-06 — Distinguir motivos y conservar su interpretación

**Dado** que se cierra por Traslado u Otro, **cuando** se conserva el motivo, **entonces** no se clasifica automáticamente como Cierre satisfactorio; el catálogo se mantiene configurable y versionable cuando corresponda para reportería posterior y se conserva el texto de Otro para eventual análisis de palabras frecuentes, según las visualizaciones 9 y 10 de 15.3 / RF-128.

---

### HU-032 — Consultar y filtrar casos A.I. de la Región

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** buscar, filtrar y consultar casos A.I. de mi Región, **para** dar seguimiento a sus Oficinas Locales y establecimientos.

#### Criterios de aceptación

##### CA-01 — Restringir casos a la Región

**Dado** que el usuario pertenece a una Región, **cuando** abre Casos de A.I., **entonces** solo debe visualizar casos de ese ámbito.

##### CA-02 — Buscar por identificación o nombre

**Dado** que se desea localizar un caso, **cuando** se busca por identificación o nombre, **entonces** deben mostrarse las coincidencias correspondientes.

##### CA-03 — Filtrar por Oficina Local

**Dado** que existen múltiples Oficinas Locales, **cuando** se selecciona una, **entonces** deben mostrarse únicamente sus casos.

##### CA-04 — Filtrar por establecimiento

**Dado** que existen varios establecimientos, **cuando** se selecciona uno, **entonces** deben mostrarse únicamente sus casos.

##### CA-05 — Filtrar por estado

**Dado** que existen distintos estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse.

##### CA-06 — Filtrar por prioridad

**Dado** que la prioridad A.I. utiliza `Alto`, `Moderado` y `Bajo`, **cuando** se selecciona una, **entonces** deben mostrarse únicamente los casos correspondientes.

##### CA-07 — Combinar filtros

**Dado** que se aplican varios criterios, **cuando** se combinan, **entonces** todos deben aplicarse simultáneamente.

##### CA-08 — Mostrar conteo

**Dado** que existen filtros, **cuando** cambian los resultados, **entonces** debe mostrarse la cantidad correspondiente.

##### CA-09 — Exportar resultados

**Dado** que existe un listado filtrado, **cuando** se exporta, **entonces** debe respetar los filtros y ámbito regional.

##### CA-10 — Estructurar exportación

**Dado** que se genera la exportación, **cuando** se abre externamente, **entonces** debe contener encabezados y columnas diferenciadas.

---

### HU-033 — Consultar el detalle de un caso A.I. desde Nivel Regional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** consultar el resumen, evolución y plan permitido de un caso A.I. de mi Región, **para** brindar seguimiento técnico sin intervenir en su gestión.

#### Criterios de aceptación

##### CA-01 — Información general

**Dado** que se abre un caso permitido, **cuando** carga su detalle, **entonces** debe mostrar identificación general, establecimiento, identificador/consecutivo aplicable, fecha de apertura, estado y prioridad cuando el permiso lo permita.

##### CA-02 — Consultar resumen

**Dado** que existe información vigente, **cuando** se consulta Resumen, **entonces** debe mostrarse únicamente la información autorizada.

##### CA-03 — Consultar línea de tiempo

**Dado** que existen eventos, **cuando** se consulta la línea de tiempo, **entonces** deben mostrarse los permitidos en orden cronológico.

##### CA-04 — Consultar plan

**Dado** que existe un plan vigente, **cuando** se consulta, **entonces** deben mostrarse estrategias, disciplinas y frecuencia permitidas.

##### CA-05 — Prohibir edición

**Dado** que el usuario pertenece al Nivel Regional, **cuando** consulta un caso, **entonces** no debe modificar información operativa.

##### CA-06 — No ejecutar acciones propias de Oficina Local

**Dado** que registrar atenciones, trasladar, cerrar o modificar el caso corresponde a Oficina Local, **cuando** Regional consulta el expediente, **entonces** dichas acciones no deben estar habilitadas.

---

### HU-034 — Consultar y filtrar casos de Atención Interdisciplinaria a nivel nacional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** buscar, filtrar y consultar los casos A.I. del país, **para** analizar la situación nacional y profundizar progresivamente hasta Región, Oficina Local o establecimiento.

#### Criterios de aceptación

##### CA-01 — Consultar casos nacionales

**Dado** que no existen filtros territoriales, **cuando** se abre Casos de A.I., **entonces** debe mostrarse el universo nacional permitido.

##### CA-02 — Buscar por identificación o nombre

**Dado** que se necesita localizar un caso, **cuando** se busca por identificación o nombre, **entonces** deben mostrarse las coincidencias correspondientes.

##### CA-03 — Filtrar por Región

**Dado** que se selecciona una Región, **cuando** se aplica el filtro, **entonces** deben mostrarse únicamente sus casos.

##### CA-04 — Filtrar por Oficina Local

**Dado** que se selecciona una Oficina Local, **cuando** se aplica, **entonces** deben mostrarse únicamente sus casos.

##### CA-05 — Filtrar por establecimiento

**Dado** que se selecciona un establecimiento, **cuando** se aplica, **entonces** deben mostrarse únicamente sus casos.

##### CA-06 — Filtrar por estado

**Dado** que existen diferentes estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse.

##### CA-07 — Filtrar por prioridad

**Dado** que las prioridades A.I. son `Alto`, `Moderado` y `Bajo`, **cuando** se selecciona una, **entonces** deben mostrarse los casos correspondientes.

##### CA-08 — Aplicar filtros jerárquicos

**Dado** que los filtros territoriales dependen entre sí, **cuando** cambia un nivel superior, **entonces** los niveles inferiores incompatibles deben limpiarse o actualizarse.

##### CA-09 — Combinar filtros

**Dado** que existen múltiples criterios, **cuando** se aplican simultáneamente, **entonces** todos deben respetarse.

##### CA-10 — Mostrar conteo

**Dado** que existen filtros activos, **cuando** cambian los resultados, **entonces** debe mostrarse su cantidad.

##### CA-11 — Exportar resultados

**Dado** que existe un conjunto filtrado, **cuando** se exporta, **entonces** debe respetar búsqueda, filtros y permisos.

##### CA-12 — Estructurar exportación

**Dado** que se genera la salida, **cuando** se abre externamente, **entonces** debe utilizar encabezados y columnas diferenciadas.

---

### HU-035 — Consultar el detalle de un caso A.I. desde Nivel Nacional

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar el resumen, evolución y plan permitido de un caso A.I., **para** brindar seguimiento institucional sin intervenir en su gestión operativa.

#### Criterios de aceptación

##### CA-01 — Información general

**Dado** que se abre un caso permitido, **cuando** carga su detalle, **entonces** debe mostrarse la información general autorizada.

##### CA-02 — Consultar resumen

**Dado** que existe información vigente, **cuando** se consulta Resumen, **entonces** deben mostrarse únicamente los datos permitidos.

##### CA-03 — Consultar línea de tiempo

**Dado** que existen eventos, **cuando** se consulta la línea de tiempo, **entonces** deben mostrarse cronológicamente los autorizados.

##### CA-04 — Consultar plan

**Dado** que existe un plan vigente, **cuando** se consulta, **entonces** deben mostrarse las estrategias, disciplinas y frecuencia permitidas.

##### CA-05 — Solo lectura

**Dado** que la gestión directa corresponde a Oficina Local, **cuando** Nacional consulta un caso, **entonces** no debe poder modificarlo.

##### CA-06 — No ejecutar funciones operativas

**Dado** que las funciones operativas corresponden a otros niveles, **cuando** Nacional consulta el expediente, **entonces** dichas acciones no deben estar habilitadas.

---

### HU-048 — Identificar casos activos sin atención en un período

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** integrante del Equipo Interdisciplinario de Oficina Local, **quiero** identificar casos activos sin atenciones en un período o año y consultar su última atención, **para** organizar el seguimiento sin depender de actividades programadas.

#### Criterios de aceptación

##### CA-01 — Seleccionar período o año

Dado que se requiere revisar seguimiento, cuando se selecciona un intervalo o año, entonces el sistema debe evaluar las atenciones registradas en ese período.

##### CA-02 — Restringir a casos activos del ámbito

Dado que el equipo pertenece a una Oficina Local, cuando consulta, entonces solo deben mostrarse casos activos de su ámbito sin atenciones en el período.

##### CA-03 — Independencia de la programación

Dado que un caso no tiene actividades programadas, cuando tampoco tiene atenciones registradas en el período, entonces debe identificarse igualmente como Sin atención en el período.

##### CA-04 — Mostrar última atención

Dado que existen atenciones previas del caso, cuando se presenta el resultado, entonces debe mostrarse la fecha de la última atención registrada.

##### CA-05 — Distinguir ausencia histórica

Dado que nunca se registró una atención del caso, cuando se presenta, entonces debe indicarse Sin atención registrada, diferenciándolo de un caso atendido fuera del período.

##### CA-06 — Utilizar atenciones efectivas

Dado que hay programación o convocatorias grupales, cuando se determina atención en el período, entonces solo deben considerarse atenciones registradas y participación con asistencia, sin tomar la programación o convocatoria como atención.

##### CA-07 — Localizar el caso

Dado que un caso aparece en el resultado, cuando se selecciona, entonces debe poder localizarse y consultarse conforme a los permisos operativos vigentes.

##### CA-08 — Trazabilidad funcional

Dado que esta capacidad se utiliza operativa o analíticamente, cuando se aplica, entonces debe mantener RF-125 y RF-126 y el flujo CU-36; Regional/Nacional solo accederán al análisis permitido.

---

## EP-05 — Atenciones y seguimiento

### HU-036 — Registrar una atención individual

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional de Atención Interdisciplinaria de Oficina Local, **quiero** registrar cada atención individual realizada a un cliente/beneficiaria, **para** conservar una historia cronológica de las acciones y recomendaciones brindadas.

#### Criterios de aceptación

##### CA-01 — Buscar caso activo

**Dado** que se desea registrar una atención, **cuando** se busca por identificación o nombre, **entonces** solo deben seleccionarse casos activos del ámbito.

##### CA-02 — Registrar fecha real

**Dado** que la fecha de atención puede diferir de la fecha de digitación, **cuando** se registra, **entonces** ambas deben poder diferenciarse.

##### CA-03 — Registrar disciplina y estrategia

**Dado** que la atención pertenece a una disciplina y estrategia, **cuando** se captura, **entonces** deben registrarse esos datos utilizando los catálogos vigentes.

##### CA-04 — No utilizar disciplina genérica

**Dado** que existe un catálogo definido de disciplinas, **cuando** se registra la atención, **entonces** no debe existir una disciplina genérica `Otra` salvo cambio institucional posterior.

##### CA-05 — Registrar acciones y recomendaciones

**Dado** que la atención produjo acciones o indicaciones, **cuando** se registra, **entonces** deben poder documentarse.

##### CA-06 — Registrar próxima acción

**Dado** que se requiere continuidad, **cuando** se define una próxima acción, **entonces** debe almacenarse junto con su fecha cuando corresponda.

##### CA-07 — Incorporar al historial

**Dado** que la atención fue guardada, **cuando** se consulta el caso, **entonces** debe aparecer en su línea de tiempo.

---

### HU-037 — Registrar una atención grupal para múltiples participantes

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / CLASIFICACIÓN DE ACTIVIDADES PENDIENTE DE REFINAMIENTO

#### Historia de Usuario

**Como** profesional de Atención Interdisciplinaria de Oficina Local, **quiero** registrar una atención grupal una sola vez y asociarla a múltiples clientes/beneficiarias, **para** evitar duplicar la misma información en cada expediente individual y conservar la participación de cada persona atendida.

#### Criterios de aceptación

##### CA-01 — Registrar información común

**Dado** que se realiza una atención grupal, **cuando** se crea, **entonces** deben registrarse fecha, tipo de actividad, tema u objetivo, lugar, disciplinas, profesionales, acciones y recomendaciones generales.

##### CA-02 — Diferenciar objetivos institucionales

Dado que la atención grupal A.I. y las sesiones educativas generales corresponden a objetivos que requieren delimitación institucional, cuando se registra una actividad, entonces no deben incorporarse automáticamente sesiones educativas generales como atenciones A.I. ni imponerse una clasificación definitiva aún no validada.

##### CA-03 — Buscar participantes

**Dado** que deben incorporarse participantes, **cuando** se agregan, **entonces** deben buscarse por identificación o nombre y no mediante una lista masiva.

##### CA-04 — Múltiples participantes

**Dado** que una actividad puede involucrar varias personas, **cuando** se registran participantes, **entonces** debe permitirse asociar múltiples clientes/beneficiarias.

##### CA-05 — Evitar duplicados

**Dado** que una persona ya está incluida, **cuando** vuelve a seleccionarse, **entonces** no debe agregarse por segunda vez.

##### CA-06 — Registrar asistencia

**Dado** que no todas las personas convocadas necesariamente asisten, **cuando** se completa la atención, **entonces** debe poder registrarse su asistencia individual.

##### CA-07 — Registro único

**Dado** que la actividad grupal es una sola, **cuando** se guarda, **entonces** debe conservarse un único registro base.

##### CA-08 — Historial individual

**Dado** que un participante posee un caso A.I. activo, **cuando** se guarda la actividad, **entonces** su participación debe aparecer en su historial individual sin duplicar físicamente la atención.

##### CA-09 — Participación sin caso activo

**Dado** que se permita registrar una persona sin caso A.I. activo dentro de una actividad cuya definición funcional así lo admita, **cuando** se guarda, **entonces** su participación podrá conservarse en el registro grupal sin generar una línea de tiempo de A.I. inexistente.

---

## EP-08 — Reportería y analítica

### HU-038 — Consultar reportería analítica de la Oficina Local

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional o jefatura autorizada de Oficina Local, **quiero** consultar indicadores y visualizaciones de Atención Interdisciplinaria aplicando filtros sobre mi ámbito, **para** analizar actividad, carga de trabajo y distribución de casos.

#### Criterios de aceptación

##### CA-01 — Filtrar por año/período

**Dado** que se requiere un corte temporal, **cuando** se selecciona, **entonces** deben actualizarse las métricas aplicables.

##### CA-02 — Filtrar por establecimiento

**Dado** que existen múltiples establecimientos, **cuando** se selecciona uno, **entonces** las métricas deben limitarse a ese ámbito.

##### CA-03 — Filtrar por estado y prioridad

**Dado** que se requiere analizar subconjuntos, **cuando** se aplican estado o prioridad, **entonces** deben actualizarse los indicadores relacionados.

##### CA-04 — Utilizar prioridades vigentes

**Dado** que se analiza la prioridad A.I., **cuando** se muestran filtros o distribuciones, **entonces** deben utilizarse únicamente `Alto`, `Moderado` y `Bajo`.

##### CA-05 — Filtrar por disciplina/profesional

**Dado** que se analiza actividad profesional, **cuando** se selecciona una disciplina o profesional, **entonces** deben actualizarse las métricas relacionadas con atenciones.

##### CA-06 — Casos por estado

**Dado** que existen casos en distintos estados, **cuando** se consulta reportería, **entonces** debe visualizarse su distribución.

##### CA-07 — Casos por prioridad

**Dado** que existen diferentes prioridades, **cuando** se consulta reportería, **entonces** debe mostrarse su distribución.

##### CA-08 — Personas únicas atendidas

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula esta métrica, **entonces** debe contabilizarse una sola vez dentro del corte.

##### CA-09 — Total de atenciones

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula la actividad, **entonces** cada atención debe contabilizarse.

##### CA-10 — Diferenciar métricas

**Dado** que personas atendidas y atenciones realizadas son conceptos distintos, **cuando** se presentan, **entonces** deben mostrarse separadamente.

##### CA-11 — Referencias a Atención Interdisciplinaria por resultado

Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.

##### CA-12 — Casos por establecimiento, sexo y edad actual

**Dado** que se consulta el ámbito autorizado, **cuando** se distribuyen casos por establecimiento, sexo o edad actual, **entonces** se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.

##### CA-13 — Atenciones REALIZADAS por tipo vigente

**Dado** que existen atenciones efectivas, **cuando** se muestra su distribución por tipo vigente, **entonces** se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.

##### CA-14 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-15 — Motivos de cancelación — tabla Top-N

**Dado** que se conservan actividades Canceladas y sus motivos, **cuando** se analizan los principales motivos del período autorizado, **entonces** se muestran en una tabla Top-N.

##### CA-16 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-17 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

##### CA-18 — Catálogo principal de doce visualizaciones

**Dado** que el usuario posee autorización de Reportería en su ámbito, **cuando** explora la información, **entonces** consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.

##### CA-19 — KPI de cobertura sobre casos activos actuales

**Dado** que se selecciona un año y ámbito permitido, **cuando** se consultan los KPI 11 y 12, **entonces** se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el filtro de estado no cambia el denominador y se identifica la definición operativa provisional pendiente de ratificación con Alina.

##### CA-20 — Filtros visibles, pertinentes y títulos dinámicos

**Dado** que se aplica un filtro autorizado, **cuando** se actualiza la consulta, **entonces** se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.

##### CA-21 — Iniciar informe independiente de la exploración

**Dado** que el usuario consulta Reportería, **cuando** selecciona el botón superior visible Generar reporte, **entonces** se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

---

### HU-039 — Generar y descargar una consolidación según filtros

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

#### Historia de Usuario

**Como** profesional o jefatura autorizada de Oficina Local, **quiero** generar una salida consolidada basada en los filtros aplicados, **para** disponer de un resumen del período y ámbito requerido sin realizar consolidaciones manuales.

#### Criterios de aceptación

##### CA-01 — Respetar filtros

**Dado** que se aplicaron filtros, **cuando** se genera la consolidación, **entonces** debe corresponder exactamente al corte definido.

##### CA-02 — Determinar ámbito

**Dado** que no se seleccionó un establecimiento, **cuando** se genera el consolidado, **entonces** debe representar la Oficina Local.

##### CA-03 — Consolidado por establecimiento

**Dado** que se seleccionó un establecimiento, **cuando** se genera, **entonces** debe representar ese establecimiento.

##### CA-04 — Mostrar métricas principales

**Dado** que se genera una consolidación, **cuando** se presenta, **entonces** debe incluir las métricas definidas para el corte.

##### CA-05 — Utilizar prioridad vigente

**Dado** que se incluye distribución por prioridad, **cuando** se genera, **entonces** debe utilizar Alto, Moderado y Bajo.

##### CA-06 — Descargar

**Dado** que se necesita utilizar la información externamente, **cuando** se descarga, **entonces** debe generarse un archivo compatible con herramientas ofimáticas.

##### CA-07 — Salida estructurada

**Dado** que la consolidación se descarga como tabla, **cuando** se abre externamente, **entonces** debe contener encabezados claros y atributos distribuidos en columnas independientes.

##### CA-08 — Conservar definiciones analíticas

Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.

##### CA-09 — Conservar catálogo y definición de cobertura

**Dado** que se obtiene una consolidación, **cuando** incluye métricas del catálogo principal, **entonces** conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.

##### CA-10 — Distinguir consolidación e informe analítico

**Dado** que se necesita un documento con interpretación humana por visualización, **cuando** se inicia Generar reporte, **entonces** se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

---

### HU-040 — Consultar reportería analítica de la Región

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** consultar indicadores y visualizaciones de A.I. dentro de mi Región, **para** analizar la situación y comparar la actividad de sus Oficinas Locales y establecimientos.

#### Criterios de aceptación

##### CA-01 — Ámbito regional implícito

**Dado** que el usuario pertenece a una Región, **cuando** abre Reportería, **entonces** esta debe utilizarse como límite superior.

##### CA-02 — Filtrar por período

**Dado** que se selecciona un período, **cuando** se aplica, **entonces** deben actualizarse las métricas correspondientes.

##### CA-03 — Filtrar por Oficina Local

**Dado** que se selecciona una Oficina Local, **cuando** se aplica, **entonces** las métricas deben limitarse a ella.

##### CA-04 — Filtrar por establecimiento

**Dado** que se selecciona un establecimiento, **cuando** se aplica, **entonces** la reportería debe limitarse a ese ámbito.

##### CA-05 — Filtrar por estado y prioridad

**Dado** que se necesita analizar un subconjunto de casos, **cuando** se aplican dichos filtros, **entonces** deben actualizarse sus indicadores.

##### CA-06 — Utilizar prioridad vigente

**Dado** que se utiliza el criterio de prioridad, **cuando** se filtra o visualiza, **entonces** únicamente deben utilizarse Alto, Moderado y Bajo.

##### CA-07 — Filtrar por disciplina y profesional

**Dado** que se analiza la actividad de atención, **cuando** se selecciona una disciplina o profesional, **entonces** deben ajustarse las métricas aplicables.

##### CA-08 — Consultar casos y referencias a Atención Interdisciplinaria

**Dado** que existe un corte seleccionado, **cuando** se consulta la reportería, **entonces** deben mostrarse las cantidades correspondientes de casos y referencias a Atención Interdisciplinaria.

##### CA-09 — Consultar personas únicas atendidas

**Dado** que una misma persona puede recibir varias atenciones, **cuando** se calcula el indicador, **entonces** debe contabilizarse una sola vez.

##### CA-10 — Consultar total de atenciones

**Dado** que existen múltiples atenciones, **cuando** se calcula el indicador, **entonces** cada atención registrada debe contabilizarse.

##### CA-11 — Diferenciar personas y atenciones

**Dado** que ambas métricas son distintas, **cuando** se presentan, **entonces** deben mostrarse separadamente.

##### CA-12 — Visualizar casos por prioridad

**Dado** que existen diferentes prioridades, **cuando** se consulta la reportería, **entonces** debe mostrarse su distribución.

##### CA-13 — Visualizar casos por estado

**Dado** que existen diferentes estados, **cuando** se consulta la reportería, **entonces** debe mostrarse su distribución.

##### CA-14 — Comparar actividad por disciplina

**Dado** que distintas disciplinas realizan atenciones, **cuando** se consulta dicha visualización, **entonces** debe permitir comparar personas únicas y total de atenciones.

##### CA-15 — Mantener consistencia de filtros

**Dado** que determinados filtros solo afectan ciertas métricas, **cuando** se aplican, **entonces** debe indicarse claramente su alcance.

##### CA-16 — Referencias a Atención Interdisciplinaria por resultado

Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.

##### CA-17 — Casos por establecimiento, sexo y edad actual

**Dado** que se consulta el ámbito autorizado, **cuando** se distribuyen casos por establecimiento, sexo o edad actual, **entonces** se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.

##### CA-18 — Atenciones REALIZADAS por tipo vigente

**Dado** que existen atenciones efectivas, **cuando** se muestra su distribución por tipo vigente, **entonces** se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.

##### CA-19 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-20 — Motivos de cancelación — tabla Top-N

**Dado** que se conservan actividades Canceladas y sus motivos, **cuando** se analizan los principales motivos del período autorizado, **entonces** se muestran en una tabla Top-N.

##### CA-21 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-22 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

##### CA-23 — Catálogo principal de doce visualizaciones

**Dado** que el usuario posee autorización de Reportería en su ámbito, **cuando** explora la información, **entonces** consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.

##### CA-24 — KPI de cobertura sobre casos activos actuales

**Dado** que se selecciona un año y ámbito permitido, **cuando** se consultan los KPI 11 y 12, **entonces** se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el filtro de estado no cambia el denominador y se identifica la definición operativa provisional pendiente de ratificación con Alina.

##### CA-25 — Filtros visibles, pertinentes y títulos dinámicos

**Dado** que se aplica un filtro autorizado, **cuando** se actualiza la consulta, **entonces** se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.

##### CA-26 — Iniciar informe independiente de la exploración

**Dado** que el usuario consulta Reportería, **cuando** selecciona el botón superior visible Generar reporte, **entonces** se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

---

### HU-041 — Generar y descargar consolidaciones dinámicas del ámbito regional

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** generar consolidaciones dinámicas de mi Región, de una Oficina Local o de un establecimiento, **para** obtener resúmenes sin realizar consolidaciones manuales.

#### Criterios de aceptación

##### CA-01 — Consolidado regional

**Dado** que no existe un filtro territorial inferior, **cuando** se genera, **entonces** debe representar toda la Región.

##### CA-02 — Consolidado por Oficina Local

**Dado** que se seleccionó una OL, **cuando** se genera, **entonces** debe representar únicamente esa unidad.

##### CA-03 — Consolidado por establecimiento

**Dado** que se seleccionó un establecimiento, **cuando** se genera, **entonces** debe representar ese ámbito.

##### CA-04 — Respetar corte temporal

**Dado** que se seleccionó un período, **cuando** se genera, **entonces** los datos deben corresponder al corte.

##### CA-05 — Respetar filtros funcionales

**Dado** que existen filtros aplicables, **cuando** se genera, **entonces** deben respetarse.

##### CA-06 — Mostrar métricas principales

**Dado** que se genera el consolidado, **cuando** se presenta, **entonces** debe incluir los indicadores principales definidos.

##### CA-07 — Descargar consolidado

**Dado** que se necesita utilizar la información externamente, **cuando** se descarga, **entonces** debe generarse una salida compatible con herramientas ofimáticas.

##### CA-08 — Salida estructurada

**Dado** que el archivo es tabular, **cuando** se abre, **entonces** debe contener encabezados y columnas diferenciadas.

##### CA-09 — Sin flujo de remisión

**Dado** que Regional posee acceso autorizado a la información, **cuando** necesita una consolidación, **entonces** no debe requerirse que Oficina Local prepare y remita manualmente el mismo conjunto de datos.

##### CA-10 — Conservar definiciones analíticas

Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.

##### CA-11 — Conservar catálogo y definición de cobertura

**Dado** que se obtiene una consolidación, **cuando** incluye métricas del catálogo principal, **entonces** conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.

##### CA-12 — Distinguir consolidación e informe analítico

**Dado** que se necesita un documento con interpretación humana por visualización, **cuando** se inicia Generar reporte, **entonces** se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

---

### HU-042 — Consultar reportería analítica nacional con desagregación jerárquica

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar indicadores y visualizaciones para todo el país y desagregarlos territorialmente, **para** analizar y comparar la actividad de Atención Interdisciplinaria.

#### Criterios de aceptación

##### CA-01 — Consultar el país completo

**Dado** que no existen filtros territoriales, **cuando** se abre Reportería, **entonces** debe representar el ámbito nacional permitido.

##### CA-02 — Filtrar por período

**Dado** que se selecciona un período, **cuando** se aplica, **entonces** deben actualizarse los indicadores.

##### CA-03 — Filtrar por Región

**Dado** que se selecciona una Región, **cuando** se aplica, **entonces** debe limitarse la reportería.

##### CA-04 — Filtrar por Oficina Local

**Dado** que se selecciona una OL, **cuando** se aplica, **entonces** deben limitarse los indicadores.

##### CA-05 — Filtrar por establecimiento

**Dado** que se selecciona un establecimiento, **cuando** se aplica, **entonces** debe limitarse el ámbito.

##### CA-06 — Mantener filtros jerárquicos

**Dado** que los filtros están relacionados, **cuando** cambia un nivel superior, **entonces** los inferiores incompatibles deben limpiarse o actualizarse.

##### CA-07 — Filtrar casos por estado

**Dado** que existen diferentes estados, **cuando** se selecciona uno, **entonces** deben actualizarse los indicadores relacionados.

##### CA-08 — Filtrar casos por prioridad

**Dado** que existen prioridades Alto, Moderado y Bajo, **cuando** se selecciona una, **entonces** deben actualizarse los indicadores correspondientes.

##### CA-09 — Filtrar actividad por disciplina

**Dado** que se desea analizar una disciplina, **cuando** se selecciona, **entonces** deben actualizarse las métricas relacionadas.

##### CA-10 — Filtrar actividad por profesional

**Dado** que se desea analizar la actividad de una persona profesional, **cuando** se selecciona, **entonces** deben actualizarse las métricas aplicables.

##### CA-11 — Consultar cantidad de casos

**Dado** que existe un corte seleccionado, **cuando** se consulta, **entonces** debe mostrarse la cantidad de casos.

##### CA-12 — Consultar referencias a Atención Interdisciplinaria

**Dado** que existen referencias a Atención Interdisciplinaria dentro del corte, **cuando** se consulta, **entonces** debe mostrarse su cantidad.

##### CA-13 — Consultar personas únicas atendidas

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula, **entonces** debe contabilizarse una sola vez.

##### CA-14 — Consultar total de atenciones

**Dado** que existen múltiples atenciones, **cuando** se calcula, **entonces** cada una debe contabilizarse.

##### CA-15 — Diferenciar indicadores

**Dado** que personas atendidas y atenciones realizadas representan conceptos distintos, **cuando** se presentan, **entonces** deben mostrarse separadamente.

##### CA-16 — Visualizar casos por prioridad

**Dado** que los casos poseen diferentes prioridades, **cuando** se consulta, **entonces** debe mostrarse su distribución.

##### CA-17 — Visualizar casos por estado

**Dado** que los casos poseen diferentes estados, **cuando** se consulta, **entonces** debe mostrarse su distribución.

##### CA-18 — Comparar actividad por disciplina

**Dado** que distintas disciplinas realizan atenciones, **cuando** se consulta la visualización correspondiente, **entonces** debe poder compararse personas únicas y total de atenciones.

##### CA-19 — Claridad semántica de filtros

**Dado** que algunos filtros afectan únicamente determinadas métricas, **cuando** se utilizan, **entonces** debe quedar claro qué indicadores se encuentran afectados.

##### CA-20 — Referencias a Atención Interdisciplinaria por resultado

Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.

##### CA-21 — Casos por establecimiento, sexo y edad actual

**Dado** que se consulta el ámbito autorizado, **cuando** se distribuyen casos por establecimiento, sexo o edad actual, **entonces** se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.

##### CA-22 — Atenciones REALIZADAS por tipo vigente

**Dado** que existen atenciones efectivas, **cuando** se muestra su distribución por tipo vigente, **entonces** se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.

##### CA-23 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-24 — Motivos de cancelación — tabla Top-N

**Dado** que se conservan actividades Canceladas y sus motivos, **cuando** se analizan los principales motivos del período autorizado, **entonces** se muestran en una tabla Top-N.

##### CA-25 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-26 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

##### CA-27 — Catálogo principal de doce visualizaciones

**Dado** que el usuario posee autorización de Reportería en su ámbito, **cuando** explora la información, **entonces** consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.

##### CA-28 — KPI de cobertura sobre casos activos actuales

**Dado** que se selecciona un año y ámbito permitido, **cuando** se consultan los KPI 11 y 12, **entonces** se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el filtro de estado no cambia el denominador y se identifica la definición operativa provisional pendiente de ratificación con Alina.

##### CA-29 — Filtros visibles, pertinentes y títulos dinámicos

**Dado** que se aplica un filtro autorizado, **cuando** se actualiza la consulta, **entonces** se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.

##### CA-30 — Iniciar informe independiente de la exploración

**Dado** que el usuario consulta Reportería, **cuando** selecciona el botón superior visible Generar reporte, **entonces** se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

---

### HU-043 — Generar y descargar consolidaciones dinámicas para cualquier ámbito institucional

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** generar consolidaciones dinámicas del país, Región, Oficina Local o establecimiento según filtros, **para** obtener información consolidada sin depender de procesos manuales de remisión.

#### Criterios de aceptación

##### CA-01 — Consolidado nacional

**Dado** que no se aplicaron filtros territoriales inferiores, **cuando** se genera, **entonces** debe representar el ámbito nacional.

##### CA-02 — Consolidado Regional

**Dado** que se seleccionó una Región, **cuando** se genera, **entonces** debe representar esa Región.

##### CA-03 — Consolidado de Oficina Local

**Dado** que se seleccionó una OL, **cuando** se genera, **entonces** debe representar dicha unidad.

##### CA-04 — Consolidado de establecimiento

**Dado** que se seleccionó un establecimiento, **cuando** se genera, **entonces** debe representar dicho establecimiento.

##### CA-05 — Respetar período

**Dado** que se seleccionó un período, **cuando** se genera, **entonces** la información debe corresponder al corte.

##### CA-06 — Respetar filtros funcionales

**Dado** que se aplicaron filtros válidos, **cuando** se genera, **entonces** las métricas correspondientes deben respetarlos.

##### CA-07 — Mostrar métricas principales

**Dado** que se genera un consolidado, **cuando** se presenta, **entonces** debe incluir al menos los principales indicadores definidos, como casos, referencias a Atención Interdisciplinaria, personas únicas atendidas, total de atenciones y distribución por prioridad cuando corresponda.

##### CA-08 — Descargar

**Dado** que se necesita utilizar la información externamente, **cuando** se selecciona descargar, **entonces** debe generarse una salida compatible.

##### CA-09 — Salida tabular estructurada

**Dado** que la salida es tabular, **cuando** se abre externamente, **entonces** debe contener encabezados y columnas diferenciadas.

##### CA-10 — No requerir remisión entre niveles

**Dado** que Nivel Nacional tiene acceso a la información, **cuando** necesita una consolidación, **entonces** debe poder generarla directamente.

##### CA-11 — Mantener trazabilidad del corte

**Dado** que una consolidación depende de filtros, **cuando** se genera o descarga, **entonces** debe poder identificarse al menos su período y ámbito.

##### CA-12 — Conservar definiciones analíticas

Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.

##### CA-13 — Conservar catálogo y definición de cobertura

**Dado** que se obtiene una consolidación, **cuando** incluye métricas del catálogo principal, **entonces** conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.

##### CA-14 — Distinguir consolidación e informe analítico

**Dado** que se necesita un documento con interpretación humana por visualización, **cuando** se inicia Generar reporte, **entonces** se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

---

### HU-050 — Generar y descargar un informe analítico con análisis por visualización

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO FUNCIONALMENTE — validación con Alina 02-11-2026; formato pendiente. Cobertura según definición operativa provisional de RN-040.

#### Historia de Usuario

**Como** usuario autorizado de Reportería de Oficina Local, Regional o Nacional, **quiero** seleccionar visualizaciones y redactar su análisis en un asistente guiado, **para** generar un informe analítico formal con identificación institucional y contexto trazables. No se amplían permisos de Establecimiento; sus visualizaciones y KPI permitidos siguen pendientes de validación.

#### Criterios de aceptación

##### CA-01 — Seleccionar de cinco a doce visualizaciones

**Dado** que el usuario posee autorización de Reportería, **cuando** pulsa el botón visible Generar reporte en la parte superior, **entonces** se abre un asistente guiado emergente, modal o equivalente, con «Seleccione al menos 5 visualizaciones de las siguientes para incluir en su reporte» y las doce opciones de 15.3; solo se seleccionan las autorizadas y realmente disponibles.

##### CA-02 — Bloquear selección insuficiente

**Dado** que hay menos de cinco visualizaciones válidas seleccionadas, **cuando** se intenta Siguiente, **entonces** se bloquea el avance; se permiten de cinco a doce y una opción no disponible no cuenta ni amplía permisos; si hay menos de cinco disponibles se informa la limitación.

##### CA-03 — Mostrar una visualización por paso

**Dado** que se seleccionaron cinco o más visualizaciones válidas, **cuando** se inicia el análisis, **entonces** se presenta una por una cada gráfica o KPI con título dinámico, filtros relevantes y «Por favor, redacte su análisis asociado a la visualización mostrada», junto con campo multilínea.

##### CA-04 — Exigir interpretación humana

**Dado** que se muestra una visualización, **cuando** se intenta avanzar, **entonces** se exige análisis no vacío ni compuesto solo por espacios; el sistema no genera análisis automáticamente como sustituto de la interpretación humana.

##### CA-05 — Conservar textos al navegar

**Dado** que se escribió un análisis, **cuando** se utiliza Anterior/Siguiente, **entonces** se conserva el texto asociado a cada visualización y se repite el análisis obligatorio hasta completar todas las seleccionadas.

##### CA-06 — Solicitar título y obtener metadatos

**Dado** que se completaron todos los análisis, **cuando** se identifica el informe, **entonces** se exige título y se obtienen automáticamente fecha/hora, usuario responsable, rol, ámbito y unidad institucional correspondiente, período y filtros, sin redigitación de datos disponibles en la sesión.

##### CA-07 — Revisar antes de confirmar

**Dado** que el informe tiene título, visualizaciones y análisis, **cuando** se llega a revisión, **entonces** se permite verificar el documento, los filtros y metadatos antes de confirmar su generación.

##### CA-08 — Descargar visualizaciones con sus análisis

**Dado** que la revisión está confirmada, **cuando** se genera el documento, **entonces** se incluyen título, fecha/hora, responsable, área/ámbito, período y filtros, seguidos de cada visualización seleccionada y directamente su análisis en el orden revisado, conservando títulos dinámicos y filtros relevantes.

##### CA-09 — Conservar trazabilidad e interpretación histórica

**Dado** que se genera un informe, **cuando** se conserva su contexto, **entonces** se registran metadatos, filtros, corte temporal y datos utilizados y, cuando sea técnicamente viable, una instantánea histórica reproducible para que las actualizaciones futuras no alteren su significado.

##### CA-10 — Mantener independencia y formato pendiente

**Dado** que se descarga el informe analítico, **cuando** se utiliza el flujo, **entonces** el formato definitivo sigue pendiente de confirmación (PDF posible, no obligatorio), sin aprobaciones, remisiones obligatorias ni periodicidad semestral/anual y sin confundirlo con consolidaciones tabulares ni HU-030/CU-22.

## EP-14 — Programación

### HU-044 — Gestionar la programación operativa de la Oficina Local

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** programar y actualizar sesiones y atenciones del equipo, **para** organizar el trabajo futuro y conservar trazabilidad de las actividades realizadas, reprogramadas o canceladas.

#### Criterios de aceptación

##### CA-01 — Crear actividad

**Dado** que se planifica una actividad futura, **cuando** se registra, **entonces** debe poder definirse fecha, tipo, propósito, establecimiento cuando corresponda y observaciones.

##### CA-02 — Tipos de actividad

Dado que se programa una actividad, cuando se selecciona el tipo, entonces Sesión interdisciplinaria debe comprender análisis, priorización, valoración y decisiones del equipo; las visitas específicas de A.I. deben denominarse Visita a establecimiento para Atención Interdisciplinaria, conservando los demás tipos vigentes no cuestionados sin duplicar la sesión del equipo.

##### CA-03 — Estado inicial

**Dado** que una actividad futura fue creada, **cuando** se guarda, **entonces** debe iniciar como Programada.

##### CA-04 — Marcar realizada

**Dado** que la actividad se ejecutó, **cuando** se actualiza su estado, **entonces** debe poder marcarse como Realizada.

##### CA-05 — Reprogramar

**Dado** que no pudo realizarse en la fecha prevista, **cuando** se marca como Reprogramada, **entonces** debe exigirse nueva fecha y motivo.

##### CA-06 — Cancelar conservando trazabilidad

Dado que una actividad no se realizará, cuando se marca Cancelada, entonces debe exigirse y conservarse el motivo y mantenerse el registro para consulta y análisis, sin borrarlo como mecanismo normal de gestión.

##### CA-07 — Filtrar programación

**Dado** que existen múltiples actividades, **cuando** se aplican filtros, **entonces** debe poder consultarse al menos por establecimiento y estado.

##### CA-08 — Identificar actividad vencida

Dado que una actividad permanece Programada después de su fecha prevista, cuando se consulta la programación o el resumen, entonces debe identificarse como vencida mediante alerta e indicación roja acompañada de texto, y permitir resolverla como Realizada, Reprogramada o Cancelada.

##### CA-09 — Asociar personas explícitamente

Dado que una actividad está dirigida a uno o más clientes/beneficiarias o casos, cuando se programa, entonces su asociación debe ser explícita; si no se especifican personas, debe tratarse como actividad general del establecimiento o equipo sin inferir que todos sus casos serán atendidos.

---

### HU-045 — Consultar la programación de las Oficinas Locales de la Región

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Regional, **quiero** consultar la programación de las Oficinas Locales de mi Región, **para** dar seguimiento a su planificación sin modificarla.

#### Criterios de aceptación

##### CA-01 — Restringir programación a la Región

**Dado** que el usuario pertenece a una Región, **cuando** abre Programación, **entonces** solo debe visualizar actividades correspondientes a esa Región.

##### CA-02 — Filtrar por Oficina Local

**Dado** que existen varias Oficinas Locales, **cuando** se selecciona una, **entonces** deben mostrarse únicamente sus actividades.

##### CA-03 — Filtrar por establecimiento

**Dado** que existen actividades asociadas a establecimientos, **cuando** se selecciona uno, **entonces** deben mostrarse únicamente las correspondientes.

##### CA-04 — Filtrar por estado

**Dado** que existen distintos estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse.

##### CA-05 — Combinar filtros

**Dado** que se aplican varios criterios, **cuando** se combinan, **entonces** todos deben aplicarse simultáneamente.

##### CA-06 — Consultar información

**Dado** que existe una actividad visible, **cuando** se presenta, **entonces** debe poder consultarse fecha, tipo, propósito, Oficina Local, establecimiento, estado y motivo cuando corresponda.

##### CA-07 — Solo lectura

Dado que la programación corresponde a Oficina Local, cuando Regional la consulta, entonces no debe poder crear, modificar, cancelar, reprogramar ni marcar actividades como realizadas.

---

### HU-046 — Consultar la programación de Atención Interdisciplinaria a nivel nacional

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar la programación registrada por las Oficinas Locales del país y desagregarla territorialmente, **para** conocer su planificación sin modificarla.

#### Criterios de aceptación

##### CA-01 — Consultar programación nacional

**Dado** que no existen filtros territoriales, **cuando** se abre Programación, **entonces** debe mostrarse todo el ámbito nacional permitido.

##### CA-02 — Filtrar por Región

**Dado** que se selecciona una Región, **cuando** se aplica, **entonces** deben mostrarse únicamente sus actividades.

##### CA-03 — Filtrar por Oficina Local

**Dado** que se selecciona una OL, **cuando** se aplica, **entonces** deben mostrarse únicamente sus actividades.

##### CA-04 — Filtrar por establecimiento

**Dado** que se selecciona un establecimiento, **cuando** se aplica, **entonces** deben mostrarse únicamente las actividades correspondientes.

##### CA-05 — Filtrar por estado

**Dado** que existen distintos estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse.

##### CA-06 — Mantener jerarquía de filtros

**Dado** que los filtros territoriales están relacionados, **cuando** cambia Región u Oficina Local, **entonces** los filtros inferiores incompatibles deben actualizarse o limpiarse.

##### CA-07 — Consultar información

**Dado** que existe una actividad visible, **cuando** se consulta, **entonces** deben mostrarse sus datos principales.

##### CA-08 — Solo lectura

**Dado** que Oficina Local es responsable de la programación, **cuando** Nacional la consulta, **entonces** no debe poder crearla ni modificarla.

---

### HU-047 — Consultar información mediante asistente conversacional

**Prioridad:** P2  
**Estimación:** Pendiente  
**Estado:** EXPLORATORIO / DESEABLE — ETAPA POSTERIOR 2027  
**Alcance de la práctica 2026:** FUERA DEL ALCANCE DE IMPLEMENTACIÓN

#### Historia de Usuario

**Como** usuario autorizado de SIA-CENCINAI, **quiero** realizar consultas en lenguaje natural sobre la información institucional disponible para mi rol y ámbito, **para** obtener respuestas comprensibles sin construir manualmente consultas, filtros o consolidaciones complejas.

#### Criterios de aceptación

##### CA-01 — Consulta en lenguaje natural

**Dado** que el usuario tiene acceso al asistente, **cuando** formula una pregunta, **entonces** el sistema debe interpretar la intención antes de consultar los datos.

##### CA-02 — Aplicar contexto autorizado

**Dado** que el usuario posee un rol y ámbito institucional, **cuando** se procesa una consulta, **entonces** deben aplicarse las mismas restricciones de autorización existentes en SIA-CENCINAI.

##### CA-03 — Seleccionar únicamente datos autorizados

**Dado** que la consulta requiere información institucional, **cuando** se determinan las fuentes necesarias, **entonces** únicamente deben utilizarse datos autorizados y habilitados para el asistente.

##### CA-04 — Generar consulta de solo lectura

**Dado** que se identificaron los datos requeridos, **cuando** se construye o ejecuta la consulta, **entonces** debe ser exclusivamente de lectura.

##### CA-05 — Respuesta basada en resultados obtenidos

**Dado** que se obtuvieron resultados válidos, **cuando** se genera la respuesta, **entonces** debe utilizar únicamente dichos resultados autorizados.

##### CA-06 — Información insuficiente o sin resultados

**Dado** que los datos no permiten responder adecuadamente, **cuando** se procesa la consulta, **entonces** debe informarse al usuario en lugar de inventar información.

##### CA-07 — Mantener restricciones frente a solicitudes del usuario

**Dado** que una pregunta solicita información fuera del ámbito autorizado, **cuando** se procesa, **entonces** el asistente no debe ampliar ni evadir las restricciones existentes.

##### CA-08 — Contextualizar la respuesta

**Dado** que una respuesta depende de período, ámbito o filtros, **cuando** se presenta, **entonces** debe proporcionar contexto suficiente para interpretar el resultado.

##### CA-09 — Sin acciones operativas

**Dado** que la funcionalidad se plantea inicialmente como mecanismo de consulta, **cuando** se utiliza, **entonces** no debe crear, modificar, cerrar, trasladar ni eliminar registros operativos. 

##### CA-10 — Consultar seguimiento autorizado

Dado que los datos están disponibles y autorizados para el rol y ámbito, cuando se pregunta por cantidades o nombres de casos por prioridad, persona encargada, contacto, programación, referencias, últimas atenciones o casos sin atención en un período, entonces el asistente debe responder exclusivamente con la información permitida y sin ejecutar acciones operativas.

---

---

# 9. Requerimientos funcionales

Los requerimientos funcionales especifican las capacidades que deberá ofrecer SIA-CENCINAI, los actores involucrados, su prioridad y la relación con las historias de usuario consolidadas.

La estructura utilizada es: **ID · Requerimiento funcional · Actor(es) involucrado(s) · Prioridad · HU relacionada(s)**.

## 9.1 Identidad, acceso, ámbito y consulta de clientes/beneficiarias

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-001** | El sistema deberá mantener una identidad única por cliente/beneficiaria y evitar la creación de registros duplicados cuando la persona ya exista en las fuentes institucionales disponibles. | Sistema; todos los niveles | **P0** | HU-005 a HU-012 |
| **RF-002** | El sistema deberá controlar el acceso por rol y ámbito institucional. ASC2 y ASC3 compartirán las mismas capacidades de Atención Interdisciplinaria autorizadas para Establecimiento, sin diferencias no definidas institucionalmente. | Todos los niveles; Sistema | **P0** | HU-001 a HU-012; HU-023 a HU-035; HU-038 a HU-049 HU-050 |
| **RF-003** | El sistema deberá mostrar de forma visible el rol activo y el ámbito institucional bajo el cual opera el usuario, por ejemplo establecimiento, Oficina Local, Región o Costa Rica, según corresponda. | Todos los niveles | **P1** | HU-001 a HU-004 |
| **RF-004** | El sistema deberá mostrar al profesional, ASC2 o ASC3 con acceso de nivel Establecimiento un resumen operativo limitado a su ámbito, incluyendo al menos referencias registradas y clientes/beneficiarias vinculados con Atención Interdisciplinaria, con accesos directos a las funciones permitidas. | Establecimiento (Profesional / ASC2 / ASC3) | **P1** | HU-001 |
| **RF-005** | El sistema mostrará a Oficina Local un resumen operativo de su ámbito, priorizando: 1) posibles referencias pendientes cuando esté disponible su detección, con acceso a su sección independiente; 2) referencias nuevas o pendientes; 3) casos activos; 4) próximas sesiones; 5) actividades programadas vencidas. Se conservan próximas acciones y otras capacidades válidas. No se mostrarán traslados pendientes de continuidad. | Oficina Local (Profesional EE.II. / Jefatura) | **P1** | HU-002; HU-049 |
| **RF-006** | El sistema deberá mostrar al usuario Regional un resumen de la actividad de Atención Interdisciplinaria de su Región, incluyendo clientes/beneficiarias, casos activos, atenciones y programación de las Oficinas Locales bajo su ámbito. | Regional (ATE / Dirección Regional) | **P1** | HU-003 |
| **RF-007** | El sistema deberá mostrar al usuario Nacional un resumen de la actividad de Atención Interdisciplinaria del país, incluyendo clientes/beneficiarias, casos activos, atenciones y programación, con acceso a la consulta analítica nacional. | Nacional (UIVCD / UNAT) | **P1** | HU-004 |
| **RF-008** | El sistema deberá permitir buscar clientes/beneficiarias principalmente por número de identificación y secundariamente por nombre, restringiendo los resultados al ámbito institucional autorizado del usuario. La búsqueda es contextual en referencias, sesiones, consulta de casos, atenciones y otros flujos autorizados; no requiere pantalla general Personas/Clientes. | Todos los niveles | **P0** | HU-005 a HU-008 |
| **RF-009** | Cuando exista una coincidencia exacta por número de identificación, el sistema deberá darle precedencia sobre coincidencias aproximadas por nombre; una búsqueda por nombre podrá devolver múltiples resultados con información suficiente para distinguir a las personas. | Todos los niveles; Sistema | **P0** | HU-005 a HU-008 |
| **RF-010** | El sistema no deberá depender de listas desplegables masivas para seleccionar clientes/beneficiarias o casos; en los flujos con grandes volúmenes deberá utilizar mecanismos de búsqueda por identificación o nombre. Se elimina la pantalla principal Personas/Clientes con listado general de CAH/SIDINACC y se evitan cargas masivas innecesarias. | Establecimiento; Oficina Local | **P0** | HU-005; HU-006; HU-013; HU-019; HU-036; HU-037 |
| **RF-011** | El sistema deberá reutilizar los datos maestros disponibles de cada cliente/beneficiaria y conservar, cuando corresponda, la procedencia de dichos datos para evitar redigitación innecesaria. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013 |
| **RF-012** | La consulta de clientes/beneficiarias deberá respetar el rol, ámbito institucional y establecimientos autorizados para el usuario. Para acceso de nivel Establecimiento, únicamente podrán consultarse clientes/beneficiarias pertenecientes a los establecimientos autorizados para ese usuario; Oficina Local podrá consultar los establecimientos pertenecientes a su Oficina Local; Regional únicamente los correspondientes a su Región; y Nacional podrá consultar el ámbito nacional permitido. | Todos los niveles; Sistema | **P0** | HU-005 a HU-012; HU-023 |
| **RF-013** | La consulta de clientes/beneficiarias deberá permitir filtros territoriales acordes con el nivel de acceso y limitar sus opciones al ámbito autorizado. Cuando un usuario de nivel Establecimiento tenga un único establecimiento autorizado, este deberá aplicarse automáticamente; cuando disponga de varios, podrá filtrar exclusivamente entre ellos. Oficina Local podrá filtrar por sus establecimientos; Regional por Oficina Local y establecimiento; y Nacional por Región, Oficina Local y establecimiento. | Establecimiento; Oficina Local; Regional; Nacional | **P0** | HU-005 a HU-008; HU-023 |
| **RF-014** | Los filtros territoriales deberán ser dependientes entre sí: al cambiar una Región se deberán actualizar o limpiar las Oficinas Locales y establecimientos incompatibles, y al cambiar una Oficina Local se deberá actualizar o limpiar el establecimiento seleccionado. | Regional; Nacional; Sistema | **P0** | HU-007; HU-008; HU-032; HU-034; HU-040; HU-042; HU-045; HU-046 |
| **RF-015** | El sistema deberá mostrar la cantidad de resultados obtenidos respecto del total disponible cuando el usuario aplique búsquedas o filtros en los listados que correspondan. | Todos los niveles | **P1** | HU-005 a HU-008; HU-015; HU-018; HU-023; HU-024; HU-032; HU-034; HU-044 a HU-046 |
| **RF-016** | El sistema deberá permitir consultar el perfil de un cliente/beneficiaria mostrando únicamente los datos y relaciones autorizados para el rol, incluyendo ubicación institucional, servicios o modalidades disponibles, información contextual autorizada y casos asociados cuando corresponda. El acceso al perfil es contextual desde los flujos autorizados, conservando consulta de identidad, casos e historial; no implica un módulo general Personas/Clientes. | Todos los niveles | **P0** | HU-009 a HU-012 |
| **RF-017** | El perfil de Establecimiento mostrará datos básicos, estado, prioridad A.I. y fechas autorizadas del caso. No expondrá valoración completa, factores detallados, nivel de riesgo, nivel de protección, plan interno, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo. | Establecimiento (Profesional / ASC2 / ASC3) | **P0** | HU-009; HU-023 |
| **RF-018** | El perfil visible para Oficina Local deberá permitir consultar los datos básicos, casos asociados e historial autorizado del cliente/beneficiaria, con acceso al detalle operativo de los casos dentro de su ámbito. | Oficina Local (Profesional EE.II. / Jefatura) | **P0** | HU-010; HU-024; HU-025 |
| **RF-019** | Los niveles Regional y Nacional deberán poder consultar la información individual permitida y los casos asociados en modo de solo lectura, sin crear, modificar ni eliminar información operativa y respetando las restricciones aplicables a datos sensibles. | Regional; Nacional | **P0** | HU-011; HU-012; HU-033; HU-035 |
| **RF-020** | PENDIENTE DE REVISIÓN: la exportación masiva de personas que dependía exclusivamente de la pantalla general Personas/Clientes retirada no es exigible desde esa pantalla. No se define una pantalla sustituta ni se eliminan exportaciones autorizadas de otros flujos vigentes; se conserva el identificador y la trazabilidad. | Oficina Local; Regional; Nacional | **P1** | HU-006; HU-007; HU-008 |
| **RF-112** | Cuando la información se encuentre disponible en las fuentes institucionales autorizadas, el sistema deberá poder reutilizar y visualizar, según el rol y el flujo correspondiente, al menos fecha de nacimiento, edad calculada, sexo, modalidades o servicios, establecimiento, Oficina Local, Región, persona encargada del menor, relación disponible con la persona encargada, datos de contacto disponibles y dirección registrada, sin exigir su redigitación en SIA-CENCINAI. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013; HU-016; HU-025 |
| **RF-113** | La persona encargada, madre, padre, familiar o representante se manejará como contexto asociado al cliente/beneficiaria, sin incorporarse automáticamente como cliente/beneficiaria A.I. ni generar un caso independiente. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013 |
| **RF-124** | Dentro del ámbito e información que cada rol esté autorizado a consultar, el sistema deberá ofrecer mecanismos de búsqueda y filtrado suficientemente amplios para localizar y organizar los registros visibles. La disponibilidad de filtros no deberá ampliar el ámbito ni permitir inferir información restringida. Para personas, se mantiene búsqueda contextual por identificación o nombre en flujos autorizados sin listado general masivo. | Todos los niveles; Sistema | **P1** | HU-005; HU-009; HU-015; HU-023; HU-024; HU-032; HU-034 |

## 9.2 Detección y referencia

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-021** | El sistema deberá permitir que un usuario autorizado de Establecimiento u Oficina Local cree una referencia estructurada de Atención Interdisciplinaria únicamente para un cliente/beneficiaria comprendido dentro de su ámbito de acceso. Para nivel Establecimiento podrán disponer de esta función, según autorización institucional, profesionales, ASC2 y ASC3. Antes de registrar una nueva referencia se comprobará si la persona posee un caso A.I. activo en cualquier establecimiento u Oficina Local; si existe se bloqueará la referencia incompatible y se informará sin revelar detalles internos no autorizados. Las referencias pendientes no equivalen a casos activos y se permiten nuevas referencias cuando los casos anteriores estén cerrados. | Establecimiento; Oficina Local | **P0** | HU-013; HU-014; HU-021; HU-022; HU-049 |
| **RF-022** | La referencia deberá registrar como mínimo fecha, **Vía de Atención**, origen y responsable que realiza la referencia. La Vía de Atención deberá diferenciar al menos `Urgencia` y `No inmediata`. Los orígenes vigentes deberán contemplar `Vigilancia / tamizaje`, `Observación`, `Información aportada por la familia u otros` y `Referencia externa`. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-023** | El responsable de la referencia será automáticamente la identidad institucional autenticada, tanto en captura directa como desde plantilla. No se permitirá seleccionarlo, escribirlo ni sustituirlo manualmente; se conservará históricamente y se mostrará en solo lectura. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-014; HU-016; HU-017 |
| **RF-024** | La referencia deberá permitir seleccionar múltiples motivos o hallazgos según los catálogos vigentes. Para la versión funcional actual, Crecimiento deberá contemplar `Condición de malnutrición` y `Malnutrición con necesidades especiales`; Desarrollo deberá contemplar únicamente `EDIN II: riesgo de retraso (rojo)` y `EVADE: riesgo de rezago (0,1 sin logro de edad anterior)`; Salud podrá conservar `Otra condición de salud`; y Factores de riesgo deberá distinguir los ámbitos individual, hogar-familiar y comunitario sin una opción genérica `Otro factor de riesgo`. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-025** | El sistema deberá permitir registrar una especificación textual para cada motivo o elemento seleccionado en la referencia cuando se requiera contextualización adicional. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-026** | Si un elemento seleccionado posee una especificación asociada y posteriormente se elimina de la selección, el sistema deberá eliminar o invalidar también la especificación vinculada para evitar información huérfana. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013 |
| **RF-027** | La referencia dispondrá de campos diferenciados para acciones realizadas previo a la referencia, resultados obtenidos previo a la referencia e Información complementaria asociada al motivo de referencia. Este último recogerá contexto útil del motivo sin exigir una historia narrativa extensa del niño o su familia. | Establecimiento; Oficina Local | **P0** | HU-013; HU-016; HU-017 |
| **RF-028** | El flujo de creación de referencia deberá organizar la captura en etapas comprensibles, permitir regresar a etapas anteriores o cancelar y exigir la selección de un cliente/beneficiaria válido antes de continuar. Mientras se realiza la captura, la interfaz deberá priorizar el formulario y evitar mostrar simultáneamente bandejas o detalles no necesarios para completar la referencia. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-029** | Antes de confirmar el envío, el sistema mostrará una revisión con los datos capturados y reutilizados disponibles. Después de la identificación principal de la persona se presentará el contexto territorial en orden Región → Oficina Local → Establecimiento; el responsable será de solo lectura. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-030** | Al confirmar el envío digital, el sistema registrará la referencia y la asociará con cliente/beneficiaria, Región, Oficina Local y establecimiento. Quedará inmediatamente disponible para Oficina Local en estado Pendiente de revisión; un borrador no constituirá una referencia enviada. El registro y envío están sujetos a la comprobación global de caso activo de RF-021; se bloquea la nueva referencia incompatible y se protege la información interna. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-014; HU-018 |
| **RF-031** | El sistema deberá permitir al nivel Establecimiento consultar una bandeja de referencias limitada a sus establecimientos autorizados y a Oficina Local consultar las referencias de todos los establecimientos comprendidos dentro de su ámbito. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-032** | Los listados de referencias a Atención Interdisciplinaria mostrarán consecutivo institucional, cliente/beneficiaria, identificación, establecimiento, responsable, fecha y hora de envío, estado y Vía de Atención dentro del ámbito autorizado. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-033** | El detalle de referencia mostrará, según permisos, consecutivo, fecha de referencia, fecha y hora de envío, usuario remitente, estado, Vía de Atención, origen, identificación y contexto histórico, motivos y especificaciones, acciones previas, resultados e información complementaria asociada al motivo. Responsable y datos de envío serán históricos y de solo lectura. | Establecimiento; Oficina Local | **P0** | HU-016; HU-018 |
| **RF-034** | El envío digital constituirá la entrega y disponibilidad inmediata de la referencia en Oficina Local, sin recibido, sello, traslado de papel ni confirmación manual de recepción obligatorios. Quedará Pendiente de revisión y, tras el análisis, conservará el resultado Admitida a A.I. al confirmar la admisión o No requiere A.I. con justificación, sin estados manuales redundantes de recepción. | Oficina Local; Sistema | **P0** | HU-013; HU-018; HU-021; HU-022 |
| **RF-035** | La versión imprimible de referencia incluirá, según disponibilidad, título, consecutivo, fecha de referencia, fecha y hora de envío, responsable, identificación, nombre, fecha de nacimiento, edad de la referencia, sexo, modalidades/servicios, Región → Oficina Local → Establecimiento, persona encargada, relación, contacto, dirección, Vía de Atención, origen, motivos, especificaciones, acciones previas, resultados e información complementaria asociada al motivo. La generación/impresión tendrá trazabilidad diferenciada del envío cuando se conserve. Al existir diseño institucional aprobado se aplicarán logo, encabezado, paginación y demás elementos autorizados. | Establecimiento; Oficina Local | **P1** | HU-017 |
| **RF-036** | El sistema deberá permitir descargar una plantilla estandarizada de referencia, cargar posteriormente un archivo compatible, validar su estructura, precargar los datos disponibles y exigir revisión humana antes del guardado definitivo. La plantilla no deberá permitir sustituir manualmente la identidad institucional de la persona usuaria que realiza la referencia. La validación y el registro desde plantilla aplicarán la misma comprobación global y bloqueo por caso A.I. activo de RF-021. | Establecimiento; Oficina Local | **P1** | HU-014 |
| **RF-037** | La referencia precargada desde plantilla permitirá corregir datos funcionales antes de confirmar, sin editar al responsable autenticado, y cumplirá las mismas reglas de catálogos, validación, contexto histórico, consecutivo, asociación territorial y envío digital que la captura directa, incluyendo disponibilidad inmediata y registro automático no editable de fecha, hora y usuario del envío. Incluye comprobación global de caso A.I. activo y bloqueo de la referencia incompatible conforme a RF-021, sin equiparar pendiente con activo. | Establecimiento; Oficina Local; Sistema | **P1** | HU-014; HU-013 |
| **RF-114** | Toda referencia dispondrá de un consecutivo institucional único bajo el patrón DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX, por ejemplo DNCC-DRCS-OL101-1010102-REF-001-2026. Los códigos regionales identificados son CS, HN, CH, HC, BR, CN, PC, CO y CE; Oficina Local y establecimiento procederán de la codificación institucional autorizada del cliente/beneficiaria. Podrá coexistir un identificador técnico interno. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-015; HU-016; HU-017; HU-018 |
| **RF-115** | El consecutivo institucional de la referencia deberá construirse o validarse utilizando el establecimiento asociado al cliente/beneficiaria y no la ubicación o identidad de la persona que confecciona la referencia. Cuando la referencia genere un caso A.I., dicho consecutivo deberá conservarse como identificador institucional de trazabilidad del caso de origen. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-018; HU-022; HU-025 |
| **RF-116** | Al registrar la referencia se preservará su contexto histórico: persona encargada, relación, contacto, dirección, modalidades/servicios, Región, Oficina Local, establecimiento y edad al momento de la referencia, cuando estén disponibles mediante fuentes institucionales autorizadas. Los cambios maestros posteriores no modificarán retroactivamente esos valores; el caso mantendrá el contexto de su referencia de origen. | Sistema; Establecimiento; Oficina Local | **P0** | HU-013; HU-016; HU-017; HU-022; HU-025 |
| **RF-117** | La bandeja de referencias deberá permitir buscar y filtrar los registros visibles, respetando siempre el ámbito del usuario, al menos por nombre o identificación del cliente/beneficiaria, consecutivo, estado, Vía de Atención, origen y categoría o motivo cuando corresponda. | Establecimiento; Oficina Local | **P1** | HU-015; HU-018 |
| **RF-127** | El sistema ofrecerá Posibles referencias como sección independiente de la bandeja ordinaria de Referencias para personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local, con paginación, búsqueda por identificación y nombre y filtros por establecimiento, fecha de detección y criterio o categoría, según ámbito y permisos. Permitirá consultar contexto de detección (persona, establecimiento, criterio y fecha disponibles) e iniciar una referencia con revisión humana. Evitará referencias equivalentes duplicadas y comprobará el caso activo conforme a RF-021; ante intentos concurrentes desde la misma sugerencia solo una operación válida podrá confirmarse, conservando trazabilidad de detección y gestión. La sección y su experiencia funcional están validadas; la detección automática depende de integración con fuentes autorizadas y coordinación con UTIC, sin declararse productiva ni imponer tecnología o periodicidad. Reutilizará resultados que cumplan criterios vigentes y carezcan de gestión equivalente, resolviendo el pendiente al gestionarlo. No recapturará variables, recalculará EDIN II/EVADE, decidirá profesionalmente ni abrirá casos automáticamente. | Personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local; Sistema | P1 — sección y experiencia validadas; detección automática dependiente de integración autorizada / UTIC | HU-049 |

## 9.3 Sesión y valoración interdisciplinaria

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-038** | El sistema deberá permitir al Equipo Interdisciplinario de Oficina Local crear y consultar sesiones interdisciplinarias, registrando fecha, hora de inicio, hora de finalización, lugar y disciplinas participantes. Las Disciplinas participantes se registrarán mediante selector múltiple convencional y compacto, con búsqueda opcional, sin chips/globitos como mecanismo principal de selección; se mantienen catálogo y reglas vigentes. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019 |
| **RF-039** | Una sesión interdisciplinaria podrá registrarse inicialmente sin casos asociados y deberá permitir incorporar casos posteriormente. | Equipo Interdisciplinario de Oficina Local | **P1** | HU-019 |
| **RF-040** | Para incorporar casos a una sesión, el sistema deberá permitir buscar referencias o casos por identificación o nombre dentro de la Oficina Local, asociar múltiples casos y evitar que una misma referencia se agregue más de una vez a la sesión. También permitirá incorporar un caso A.I. activo a una nueva sesión para revaloración ante situaciones nuevas, sin abrir otro caso ni duplicarlo dentro de la misma sesión. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019; HU-020; HU-022; HU-025 |
| **RF-041** | El sistema deberá permitir registrar una valoración situacional independiente para cada referencia o situación analizada en una sesión interdisciplinaria. Un mismo caso activo puede tener múltiples valoraciones en sesiones posteriores; cada una conservará sesión, fecha y responsables, sin sobrescribir las anteriores. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020; HU-019; HU-025 |
| **RF-042** | La valoración organizará factores protectores, factores de riesgo y signos de alerta en Individual, Hogar/Familiar y Comunitario conforme al instrumento vigente. El equipo registrará profesionalmente riesgo global Alto, Moderado o Bajo y protección Alta, Moderada o Baja, independientes entre sí; los checkboxes no determinarán automáticamente esos niveles. Cada categoría de Factores se presentará inicialmente compacta y podrá expandirse al hacer clic y volver a contraerse mediante presentación colapsable, tipo acordeón o equivalente, conservando selecciones al cerrar/reabrir y sin exigir mostrar todos los factores simultáneamente. No se modifica la clasificación funcional ni el significado institucional de las categorías. En revaloraciones del caso activo podrán incorporarse nuevos factores y actualizarse profesionalmente los niveles de riesgo y protección; la nueva valoración y su prioridad calculada se conservarán con fecha y responsable junto con las anteriores. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020; HU-025 |
| **RF-043** | La valoración deberá permitir seleccionar múltiples factores y registrar una especificación textual para cualquier elemento seleccionado que requiera contexto adicional. Los campos abiertos o alternativas equivalentes a `Otro` podrán conservarse en la valoración profesional cuando el instrumento vigente los contemple. Para cada categoría requerida según la definición funcional vigente se exigirá uno o más factores aplicables o la respuesta explícita Ninguno, conforme a RN-008. Si queda alguna sin respuesta, el sistema identificará las categorías pendientes, mostrará un mensaje comprensible y bloqueará continuar/finalizar la etapa correspondiente. Ninguno es mutuamente excluyente con los demás factores de su categoría; al seleccionar otro factor deberá retirarse Ninguno o exigirse su desmarcado. Se utilizarán controles de selección múltiple estructurados conforme a RNF-009. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-044** | La valoración situacional no deberá exigir como campos obligatorios intensidad, frecuencia ni persistencia para los factores registrados. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-045** | El sistema deberá permitir al Equipo Interdisciplinario registrar explícitamente la resolución `Sí requiere A.I.` o `No requiere A.I.` y conservar la relación de la decisión con la referencia y la sesión donde se tomó. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-021 |
| **RF-046** | Cuando la resolución sea `No requiere A.I.`, el sistema deberá exigir y conservar una **justificación de la decisión**, mantener el resultado de la valoración y no abrir un caso activo de Atención Interdisciplinaria. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-021 |
| **RF-047** | Cuando la resolución sea Sí requiere A.I., el sistema utilizará los niveles profesionales de riesgo y protección, calculará prioridad conforme a RN-009 y exigirá propósitos, estrategias, disciplinas vigentes y frecuencia planificada antes de abrir el caso. La frecuencia conservará las alternativas vigentes e incorporará Trimestral y Semestral, manteniendo Según necesidad; expresa periodicidad ideal o planificada, sin garantizar intervalos exactos ni definir las reuniones institucionales del equipo. En un caso ya activo, una nueva sesión podrá revalorar y actualizar el abordaje o plan cuando corresponda, conservando la evolución; no se ejecutará una nueva apertura por situaciones nuevas. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-022; HU-020; HU-025 |
| **RF-048** | Al confirmar la apertura, el sistema deberá crear un caso A.I. activo vinculado con el cliente/beneficiaria y la referencia de origen, conservar el consecutivo institucional y el contexto histórico relevante de dicha referencia, actualizar su estado según corresponda y registrar un evento de admisión en la línea de tiempo. Inmediatamente al confirmar se verificará nuevamente, para evitar duplicados por concurrencia, que la persona no tenga otro caso A.I. activo en ningún establecimiento u Oficina Local. Nunca se confirmarán dos activos simultáneos; se informará el bloqueo sin detalles internos no autorizados. Se permiten varios casos históricos y nuevas aperturas cuando los anteriores estén cerrados; una referencia pendiente no constituye caso activo. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-022; HU-013; HU-014; HU-021 |
| **RF-118** | El sistema calculará prioridad A.I. aplicando exclusivamente la matriz de RN-009 a los niveles de riesgo y protección registrados por el equipo, sin selección manual de prioridad. Mostrará Alto en rojo, Moderado en ámbar/amarillo y Bajo en verde, acompañados de denominación textual. Se aplicará también en cada revaloración posterior del caso activo, recalculando al actualizar profesionalmente riesgo o protección y conservando prioridades anteriores con fecha y responsable, sin edición manual ni sobrescritura del pasado. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-020; HU-022; HU-025 |
| **RF-119** | El sistema deberá distinguir conceptualmente la **Vía de Atención** de una referencia de la **prioridad de Atención Interdisciplinaria**. `Urgencia` y `No inmediata` corresponden a Vía de Atención; la prioridad resultante de la valoración deberá utilizar únicamente los niveles `Alto`, `Moderado` y `Bajo`. | Sistema; Establecimiento; Oficina Local; Regional; Nacional | **P0** | HU-013; HU-022; HU-024; HU-032; HU-034; HU-038; HU-040; HU-042 |
| **RF-120** | El catálogo vigente de disciplinas utilizado para sesiones, valoración, planes y atenciones deberá utilizar las disciplinas expresamente definidas por el proceso institucional y no incluir una alternativa genérica `Otra`, salvo que una modificación posterior del procedimiento vuelva a incorporarla formalmente. Cuando se admitan múltiples Disciplinas, su entrada utilizará un selector múltiple convencional y compacto conforme a RNF-009, preservando exactamente opciones y reglas funcionales. | Equipo Interdisciplinario de Oficina Local; Sistema | **P1** | HU-019; HU-022; HU-036; HU-037 |

## 9.4 Gestión y seguimiento del caso A.I.

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-049** | La Lista de A.I. simplificada de Establecimiento se restringirá a sus establecimientos autorizados, mostrará estado y prioridad A.I. y permitirá búsqueda por identificación/nombre y filtros por estado y prioridad Alto, Moderado o Bajo. Aplicará automáticamente el único establecimiento autorizado o permitirá filtrar entre los varios autorizados. | Establecimiento (Profesional / ASC2 / ASC3) | **P0** | HU-023 |
| **RF-050** | La Lista de A.I. de Establecimiento permitirá consultar estado y prioridad A.I., sin acceso a valoración completa, factores detallados, riesgo, protección, plan interno, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo. Los filtros no expondrán información restringida y la lista no permitirá exportación. | Establecimiento (Profesional / ASC2 / ASC3) | **P0** | HU-023 |
| **RF-051** | Oficina Local deberá poder buscar y filtrar los casos A.I. de su ámbito por identificación o nombre, establecimiento, estado y prioridad, combinando dichos criterios y mostrando la cantidad de resultados obtenidos. | Oficina Local | **P0** | HU-024 |
| **RF-052** | Nivel Regional deberá poder buscar y filtrar los casos A.I. de su Región por identificación o nombre, Oficina Local, establecimiento, estado y prioridad, sin acceder a casos de otras Regiones. | Regional (ATE / Dirección Regional) | **P0** | HU-032 |
| **RF-053** | Nivel Nacional deberá poder buscar y filtrar los casos A.I. del país por identificación o nombre, Región, Oficina Local, establecimiento, estado y prioridad, aplicando filtros jerárquicos dependientes. | Nacional (UIVCD / UNAT) | **P0** | HU-034 |
| **RF-054** | El sistema deberá permitir exportar los listados de casos autorizados para Oficina Local, Regional y Nacional, respetando la búsqueda, los filtros aplicados y el ámbito institucional del usuario. | Oficina Local; Regional; Nacional | **P1** | HU-024; HU-032; HU-034 |
| **RF-055** | Oficina Local consultará el detalle integral del caso con identificador técnico, consecutivo de referencia de origen, cliente/beneficiaria, establecimiento, apertura, estado, riesgo, protección, prioridad calculada, resumen, línea de tiempo, plan y contexto histórico de ingreso disponible. Mostrará fecha de última atención o Sin atención registrada cuando no exista, conforme a RF-126. El detalle mostrará valoración y prioridad vigentes y permitirá consultar valoraciones y prioridades históricas, fechas, sesiones y responsables. El historial de un caso cerrado por Traslado se conserva según permisos, sin continuidad automática ni vínculo obligatorio a un caso posterior. | Oficina Local | **P0** | HU-025; HU-048 |
| **RF-056** | Regional y Nacional deberán poder consultar el detalle permitido de un caso en modo de solo lectura, incluyendo resumen, línea de tiempo y plan vigente, sin ejecutar acciones de gestión operativa reservadas a Oficina Local. | Regional; Nacional | **P0** | HU-033; HU-035 |
| **RF-057** | El sistema deberá mantener una línea de tiempo longitudinal por caso que integre los eventos relevantes de la atención, tales como admisión, atenciones individuales, atenciones grupales, coordinaciones cuando corresponda, traslados, reportes y cierre. Incluye sesiones de revaloración, valoraciones y prioridades históricas con fechas y responsables, y cierre por Traslado; conserva historial sin generar ingreso pendiente, continuidad automática ni vinculación obligatoria a un caso de destino. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-025; HU-033; HU-035; HU-036; HU-037 |
| **RF-058** | Oficina Local deberá poder cargar y consultar documentos vinculados con un caso A.I., conservando como mínimo tipo, fecha, responsable y demás metadatos necesarios para su identificación. | Oficina Local | **P1** | HU-026 |
| **RF-059** | Oficina Local deberá poder registrar y consultar coordinaciones interinstitucionales asociadas a un caso, indicando institución, profesional responsable, motivo, fecha y estado de la coordinación. | Oficina Local | **P1** | HU-027 |
| **RF-060** | El sistema deberá permitir que el profesional responsable de una coordinación sea diferente del usuario que realiza la digitación y deberá conservar la trazabilidad correspondiente. | Oficina Local; Sistema | **P1** | HU-027 |
| **RF-061** | Cuando una persona cambia de establecimiento con un caso A.I. activo, Oficina Local de origen podrá registrar el cambio con los datos institucionales de destino disponibles, fecha y responsable, y cerrar el caso con motivo estructurado Traslado, conservando su historial consultable según permisos. No se genera caso ni ingreso pendiente de continuidad en destino. Cuando CAH/SIDINACC asocie a la persona al nuevo establecimiento, el personal autorizado podrá crear una referencia completamente nueva con consecutivo propio y abrir un caso por el procedimiento normal si requiere A.I., sin vinculación obligatoria entre casos. | Oficina Local de origen | **P1** | HU-028; HU-031 |
| **RF-062** | RETIRADO — validación con Alina del 2 de noviembre de 2026. Se elimina la generación de ingreso pendiente de continuidad y el vínculo obligatorio entre origen y destino. Identificador reservado para trazabilidad histórica; no reutilizar. Comportamiento vigente: RF-061 y RF-066. | Oficina Local de origen; Oficina Local de destino; Sistema | Retirado — sin prioridad vigente | Relación histórica retirada: HU-028; HU-029. Sin dependencia funcional vigente. |
| **RF-063** | RETIRADO — validación con Alina del 2 de noviembre de 2026. No existe confirmación de continuidad en destino ni apertura derivada de ella. Identificador reservado; no reutilizar. Una eventual nueva referencia y apertura siguen RF-021/RF-030/RF-048. | Oficina Local de destino; Sistema | Retirado — sin prioridad vigente | Relación histórica retirada: HU-029. Sin dependencia funcional vigente. |
| **RF-064** | Oficina Local deberá poder generar un reporte de un caso activo sin cerrarlo, indicando al menos tipo o propósito, fecha, responsable y motivo, reutilizando la información registrada en el expediente lógico y conservando el reporte en el historial del caso. | Oficina Local | **P0** | HU-030 |
| **RF-065** | La generación de un reporte y el cierre de un caso deberán ser acciones independientes; generar un reporte no deberá modificar automáticamente el estado activo del caso. | Oficina Local; Sistema | **P0** | HU-030; HU-031 |
| **RF-066** | Oficina Local podrá cerrar un caso A.I. registrando fecha, responsable y motivo estructurado: Cierre satisfactorio (objetivos de Atención Interdisciplinaria alcanzados), Traslado u Otro. Otro exige explicación textual. Al confirmar, el estado cambia a Cerrado y se conserva el evento y estos datos en el historial. El traslado no genera caso ni continuidad en destino y no se clasifica automáticamente como cierre satisfactorio. El catálogo será configurable/versionable cuando corresponda, preservando la interpretación histórica y motivos utilizables para reportería posterior; el texto de Otro se conserva para eventual análisis de palabras frecuentes, según las visualizaciones 9 y 10 de 15.3 / RF-128. | Oficina Local; Sistema | **P0** | HU-031; HU-028 |
| **RF-125** | El sistema deberá permitir al Equipo Interdisciplinario de Oficina Local seleccionar un período o año e identificar los casos activos de su ámbito sin atenciones registradas en ese intervalo, aunque no tengan actividad programada, con identificación suficiente para localizar el caso. Regional y Nacional podrán analizar esta información únicamente según sus permisos. | Equipo Interdisciplinario de Oficina Local; Regional; Nacional | **P1** | HU-048; HU-038; HU-040; HU-042 |
| **RF-126** | La consulta de casos sin atención y el detalle autorizado deberán mostrar la fecha de última atención registrada de cada caso cuando exista o Sin atención registrada cuando nunca exista. La evaluación utilizará atenciones efectivamente registradas y asistencia en grupales, sin confundir programación con atención realizada. | Equipo Interdisciplinario de Oficina Local; Sistema | **P1** | HU-048; HU-025 |

## 9.5 Atenciones y seguimiento

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-067** | Oficina Local deberá permitir registrar una atención individual únicamente sobre casos activos de su ámbito, localizando el caso por identificación o nombre del cliente/beneficiaria. | Oficina Local | **P0** | HU-036 |
| **RF-068** | La atención individual deberá registrar como mínimo fecha real de atención, disciplina, tipo o estrategia, acciones realizadas, recomendaciones, profesional responsable y, cuando corresponda, próxima acción y fecha prevista. | Oficina Local | **P0** | HU-036 |
| **RF-069** | Al guardar una atención individual, el sistema deberá incorporarla automáticamente como un evento en la línea de tiempo del caso correspondiente, conservando la fecha real de atención separada de la fecha de digitación. | Oficina Local; Sistema | **P0** | HU-036 |
| **RF-070** | Oficina Local registrará una atención grupal A.I. mediante un único registro base con fecha, tipo vigente, tema u objetivo, lugar, disciplinas, profesionales, acciones y recomendaciones generales. Las sesiones educativas generales no se incorporarán automáticamente como atenciones A.I.; la delimitación definitiva se mantiene en las decisiones pendientes. | Oficina Local | **P0** | HU-037 |
| **RF-071** | El sistema deberá permitir agregar múltiples clientes/beneficiarias participantes a una atención grupal mediante búsqueda por identificación o nombre dentro del ámbito de la Oficina Local, evitando duplicar a una misma persona en la actividad. | Oficina Local | **P0** | HU-037 |
| **RF-072** | La atención grupal deberá permitir registrar la asistencia individual de cada participante y deberá exigir como mínimo un tema u objetivo y al menos un participante antes de guardarse. | Oficina Local | **P0** | HU-037 |
| **RF-073** | Al guardar una atención grupal, el sistema deberá conservar un único registro de la actividad y reflejar la participación en el historial de cada participante que posea un caso A.I. activo, sin duplicar físicamente toda la atención. | Oficina Local; Sistema | **P0** | HU-037 |
| **RF-074** | Cuando una persona participe en una actividad grupal sin poseer un caso A.I. activo, el sistema podrá conservar su participación en el registro grupal sin crear un evento en una línea de tiempo de A.I. inexistente, sujeto a la definición funcional definitiva sobre actividades educativas y comunitarias. | Oficina Local; Sistema | **P1** | HU-037 |

## 9.6 Programación

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-075** | El sistema deberá permitir a Oficina Local crear actividades programadas con fecha, tipo vigente, título o propósito, establecimiento cuando corresponda y observaciones. Sesión interdisciplinaria comprenderá análisis, priorización, valoración y decisiones del equipo sin un tipo separado para ese mismo trabajo. Las visitas específicas se denominarán Visita a establecimiento para Atención Interdisciplinaria; se conservarán otros tipos vigentes no cuestionados, como visita domiciliaria cuando exista. La asociación con clientes/beneficiarias o casos específicos será explícita; sin personas asociadas será una actividad general sin programar implícitamente a todos los casos del establecimiento. | Oficina Local | **P0** | HU-044 |
| **RF-076** | Toda actividad nueva deberá iniciar en estado Programada y el sistema deberá permitir actualizarla posteriormente a Realizada, Reprogramada o Cancelada. | Oficina Local | **P0** | HU-044 |
| **RF-077** | Cuando una actividad se marque como Reprogramada, el sistema deberá exigir una nueva fecha y un motivo antes de guardar el cambio. | Oficina Local | **P0** | HU-044 |
| **RF-078** | Al marcar una actividad Cancelada se exigirá y conservará el motivo y se mantendrá el registro para trazabilidad y análisis, sin borrarlo como gestión normal. El motivo podrá describir falta de vehículo, dificultades de desplazamiento o acceso y otras circunstancias operativas. | Oficina Local | **P0** | HU-044 |
| **RF-079** | Oficina Local deberá poder consultar y filtrar su programación por establecimiento y estado, mostrando la información principal de cada actividad y la cantidad de resultados obtenidos. | Oficina Local | **P1** | HU-044 |
| **RF-080** | El sistema identificará como vencida una actividad que permanece Programada después de su fecha prevista, alertará a Oficina Local y la destacará con indicación roja acompañada de texto para resolverla como Realizada, Reprogramada o Cancelada. | Oficina Local; Sistema | **P1** | HU-002; HU-044 |
| **RF-081** | Regional consultará programación de las Oficinas Locales de su Región y filtrará por Oficina Local, establecimiento y estado exclusivamente en lectura; no podrá crear, modificar, cancelar, reprogramar ni marcar actividades como realizadas. | Regional (ATE / Dirección Regional) | **P1** | HU-045 |
| **RF-082** | Nivel Nacional deberá poder consultar, sin editar, la programación del país y filtrarla jerárquicamente por Región, Oficina Local, establecimiento y estado. | Nacional (UIVCD / UNAT) | **P1** | HU-046 |

## 9.7 Reportería, analítica y consolidaciones

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-083** | La reportería de Oficina Local se limitará a su ámbito y sus establecimientos, o al establecimiento filtrado, con las mismas definiciones funcionales del catálogo principal de doce visualizaciones de RF-128 / 15.3. Ofrecerá filtros pertinentes de año/período, establecimiento, estado Activo/Cerrado/Todos, prioridad, sexo, edad, tipo de atención, disciplina y profesional. La cobertura seguirá RF-129, sin modificar su universo por el estado general. | Oficina Local (Profesional / Jefatura) | **P1** | HU-038 HU-050 |
| **RF-084** | La reportería Regional se limitará a su Región, con filtros dependientes por Oficina Local y establecimiento, y filtros pertinentes de año/período, estado Activo/Cerrado/Todos, prioridad, sexo, edad, tipo de atención, disciplina y profesional. Utilizará las mismas definiciones y doce visualizaciones de RF-128 que Oficina Local, cambiando únicamente el universo institucional y filtros autorizados; cobertura según RF-129. | Regional (ATE / Dirección Regional) | **P0** | HU-040 HU-050 |
| **RF-085** | La reportería Nacional permitirá todo el ámbito nacional autorizado o un subconjunto permitido mediante filtros dependientes por Región, Oficina Local y establecimiento, además de año/período, estado Activo/Cerrado/Todos, prioridad, sexo, edad, tipo de atención, disciplina y profesional según pertinencia. Aplicará las mismas definiciones y doce visualizaciones de RF-128; cobertura según RF-129, sin alterar su universo con el estado general. | Nacional (UIVCD / UNAT) | **P0** | HU-042 HU-050 |
| **RF-086** | Filtros disponibles según ámbito, permiso y pertinencia: año/período, Región, Oficina Local, establecimiento, estado, prioridad, sexo, edad, tipo de atención, disciplina y profesional. Los territoriales son jerárquicos y dependientes y nunca amplían el ámbito: Establecimiento solo sus establecimientos autorizados, sin unidades superiores; Oficina Local su ámbito y establecimientos; Regional su Región con Oficina Local/establecimiento; Nacional el universo nacional autorizado con Región/Oficina Local/establecimiento. Esto no concede Reportería a Establecimiento: sus visualizaciones y KPI permitidos requieren validación específica y se mantienen las restricciones vigentes. Cada filtro identifica las visualizaciones que afecta; los incompatibles se deshabilitan o no se aplican, sin cambios silenciosos de universo. Los cambios de niveles superiores actualizarán o limpiarán los inferiores incompatibles. Al cambiar filtros se actualizan reactivamente los gráficos y KPI con datos operativos vigentes y un corte consistente autorizado. Los filtros activos se destacan de forma clara, se enumeran y pueden restablecerse; no basta cambiar discretamente un ícono. Los títulos se actualizan dinámicamente, por ejemplo «Casos activos por establecimiento — Prioridad alta — Año 2026», identificando el evento/corte que corresponda. Títulos y filtros relevantes se conservan al incorporar la visualización en un informe. | Regional; Nacional; Sistema | **P0** | HU-040; HU-042 HU-050 |
| **RF-087** | La reportería mantendrá las métricas válidas de referencias a A.I. registradas/enviadas, analizadas, admitidas y No requiere A.I.; casos por establecimiento, estado, prioridad, sexo y edad actual; personas únicas atendidas y total de atenciones efectivas por tipos vigentes; frecuencias de motivos de referencia y cancelación; casos activos sin atención en el período; motivos de cierre y palabras frecuentes de Otro; y cobertura de personas con caso activo actual. El catálogo principal contiene exactamente las doce visualizaciones y formatos de RF-128 / 15.3; otras consultas válidas son complementarias, sin agregarse al catálogo de doce del asistente. Cada métrica identifica evento temporal, fecha/corte y filtros aplicables; una referencia analizada puede concluir Admitida o No requiere A.I. No se generan indicadores propios de vigilancia, nutrición, EDIN II o EVADE. El KPI porcentual y de cantidad sigue exclusivamente RF-129. | Oficina Local; Regional; Nacional | **P0** | HU-038; HU-040; HU-042; HU-048 |
| **RF-088** | La reportería diferenciará clientes/beneficiarias únicos atendidos y total de atenciones: una persona atendida cinco veces representa una persona única y cinco atenciones. La atención grupal tendrá un registro base; las personas atendidas se contabilizarán según asistencia sin multiplicar el registro base por participantes. Las atenciones deben ser efectivas con fecha real; programación no ejecutada, actividades reprogramadas/canceladas y asistencia no confirmada no cuentan. Para los KPI 11/12 se usa exclusivamente el mismo universo de casos activos actuales definido en RF-129, excluyendo atenciones de casos anteriores cerrados. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 |
| **RF-089** | Las distribuciones de casos por establecimiento, sexo, edad actual, prioridad Alto/Moderado/Bajo y estado Activo/Cerrado se mostrarán dentro del ámbito autorizado con filtro general Activo/Cerrado/Todos para visualizaciones compatibles. La edad es actual al corte de consulta, con agrupaciones analíticas adecuadas y sin grupos etarios institucionales inventados. Los formatos serán los de RF-128 / 15.3. El filtro general de estado no cambia los KPI 11/12 basados siempre en casos activos actuales; motivos de cierre utilizan sus propios eventos de casos cerrados. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-090** | La reportería comparará clientes/beneficiarias únicos atendidos y total de atenciones por disciplina y analizará total y distribución de atenciones por tipos realmente vigentes y personas únicas por tipo cuando aplique. No se asumirán tipos o disciplinas mutuamente excluyentes cuando existan múltiples asociaciones. La distribución principal por tipo usa solo atenciones REALIZADAS/efectivas, fecha real y tipos institucionales vigentes, excluyendo programación sin ejecutar, reprogramaciones y cancelaciones; en grupales las personas cuentan con asistencia efectiva. La comparación por disciplina se conserva como capacidad complementaria, sin agregar una decimotercera opción al catálogo principal de doce. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-091** | Cada filtro afectará únicamente las métricas funcionalmente relacionadas e identificará explícitamente su alcance según 15.1. Los motivos de referencia son múltiples/no excluyentes: se cuentan por aparición en referencias, pueden superar el total y se representan en nube de palabras con tamaño según frecuencia. Los principales motivos de cancelación se muestran en tabla Top-N. Cierres se distribuyen en gráfico circular por Cierre satisfactorio, Traslado y Otro; Traslado no equivale automáticamente a satisfactorio. Las explicaciones de Otro alimentan su nube de palabras frecuentes. Se destacan y enumeran filtros activos con opción de restablecer, se actualizan títulos dinámicos y se conservan títulos/filtros relevantes en los informes. Los filtros semánticamente incompatibles no se aplican silenciosamente; cobertura conserva N y D de RF-129. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 HU-050 |
| **RF-092** | Oficina Local deberá poder generar una consolidación dinámica de su ámbito o de un establecimiento seleccionado, utilizando el período y filtros vigentes. Las definiciones del catálogo principal y cobertura serán RF-128/RF-129; títulos, filtros, universo y corte se conservarán. Generar reporte analítico con interpretación humana es un flujo independiente de HU-050 / CU-38, sin sustituir esta consolidación. | Oficina Local (Profesional / Jefatura) | **P1** | HU-039 |
| **RF-093** | Nivel Regional deberá poder generar consolidaciones dinámicas de su Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. Usará RF-128/RF-129 con títulos, filtros, universo y corte conservados. El informe analítico formal se genera independientemente mediante HU-050 / CU-38. | Regional (ATE / Dirección Regional) | **P1** | HU-041 |
| **RF-094** | Nivel Nacional deberá poder generar consolidaciones dinámicas del país, de una Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. Usará RF-128/RF-129 con títulos, filtros, universo y corte conservados. El informe analítico formal se genera independientemente mediante HU-050 / CU-38. | Nacional (UIVCD / UNAT) | **P1** | HU-043 |
| **RF-095** | Regional y Nacional deberán poder obtener consolidaciones directamente a partir de la información a la que tienen acceso, sin exigir un flujo manual de remisión, aprobación o devolución de archivos entre niveles institucionales. La generación de informes analíticos tampoco incorpora aprobaciones, remisiones obligatorias ni periodicidad semestral/anual. | Regional; Nacional; Sistema | **P1** | HU-041; HU-043 |
| **RF-096** | El sistema deberá permitir descargar las consolidaciones autorizadas en un formato compatible con herramientas ofimáticas, respetando los filtros aplicados e identificando al menos el período y el ámbito utilizados para generar la salida. Esta descarga tabular de consolidaciones es distinta del informe analítico formal de RF-130/RF-131; el formato definitivo de este último sigue pendiente de confirmación y PDF es solo una posibilidad. Ambos preservan títulos, filtros pertinentes y trazabilidad del contexto/corte. | Oficina Local; Regional; Nacional | **P1** | HU-039; HU-041; HU-043 HU-050 |
| **RF-122** | Las exportaciones tabulares deberán estructurar la información mediante encabezados y columnas diferenciadas, de forma que cada atributo relevante sea utilizable directamente para consulta o análisis y se evite concentrar múltiples datos independientes en una sola columna o representación no estructurada. Esta regla aplica a salidas tabulares y no fija el formato del informe analítico formal. Cuando una visualización se incorpora al informe, se conservan título dinámico y filtros relevantes y su análisis directamente asociado, según RF-131. | Oficina Local; Regional; Nacional; Sistema | **P1** | HU-006 a HU-008; HU-024; HU-032; HU-034; HU-039; HU-041; HU-043 HU-050 |
| **RF-123** | Los documentos o reportes destinados a impresión deberán utilizar plantillas visualmente consistentes y contener los identificadores, fecha, contexto institucional y secciones necesarias para interpretar el documento. Cuando los lineamientos gráficos institucionales estén disponibles, deberán aplicarse los logotipos, encabezados y demás elementos autorizados correspondientes. En el informe analítico formal de HU-050/CU-38 se incluyen título, fecha/hora de generación, responsable, rol/ámbito y unidad institucional correspondiente, período, filtros y cada visualización con su análisis asociado. Se conserva trazabilidad del corte/datos y, cuando sea técnicamente viable, instantánea histórica reproducible. Formato pendiente (PDF posible, no obligatorio); no se confunde con el reporte individual HU-030/CU-22. | Establecimiento; Oficina Local; Sistema | **P1** | HU-017; HU-030 HU-050 |
| RF-128 | La reportería ofrecerá exactamente el catálogo principal de doce visualizaciones de 15.3, con sus formatos: 1) casos por establecimiento/barras; 2) casos por sexo/distribución; 3) casos por edad actual/distribución con agrupaciones analíticas; 4) casos por prioridad Alto/Moderado/Bajo; 5) casos por estado Activo/Cerrado y filtro Activo/Cerrado/Todos; 6) motivos de cancelación/tabla Top-N; 7) motivos de referencia a A.I./nube por frecuencia; 8) atenciones REALIZADAS por tipos vigentes/distribución; 9) motivos de cierre/gráfico circular Cierre satisfactorio, Traslado, Otro; 10) palabras frecuentes de explicaciones de cierre Otro/nube; 11) porcentaje de niños atendidos en año seleccionado/KPI progresivo rojo–verde y porcentaje; 12) cantidad de niños atendidos en año seleccionado/KPI numérico de personas únicas. KPI 11/12 según RF-129. Se mantienen catálogos validados, motivos de referencia no excluyentes y la diferencia personas/atenciones, sin inventar tipos, grupos etarios institucionales ni umbrales de cumplimiento. | Oficina Local; Regional; Nacional; Sistema | P1 | HU-038; HU-040; HU-042; HU-039; HU-041; HU-043; HU-050 |
| RF-129 | Definición operativa provisional vigente para el trabajo, pendiente únicamente de ratificación posterior con Alina: D es la cantidad de personas únicas con un caso A.I. activo actualmente, al momento de la consulta, dentro del ámbito autorizado y filtros pertinentes. N es la cantidad de personas de ese mismo D con al menos una atención efectiva durante el año seleccionado, vinculada a su caso actualmente activo. Porcentaje = (N / D) × 100; el KPI de cantidad muestra N personas únicas, no registros de atención. Se usa fecha real de atención; una grupal cuenta solo con participación efectiva/asistencia. Se excluyen programación sin ejecutar, asistencia no confirmada y atenciones pertenecientes únicamente a casos anteriores cerrados. El año delimita las atenciones; Activo se evalúa actualmente, sin convertirlo en activo histórico del año seleccionado. El filtro general Activo/Cerrado/Todos no cambia el denominador de este KPI: siempre usa casos activos actuales y debe indicarlo expresamente. Los filtros pertinentes y el ámbito efectivo se aplican consistentemente a N y D; los incompatibles no se aplican ni se presentan como aplicados. Con D = 0 se muestra Sin casos activos o No aplica sin dividir entre cero. Se identifican universo, año y corte/fecha de consulta; valores altos se ven progresivamente más verdes y bajos más rojos, con porcentaje numérico y sin umbrales institucionales de cumplimiento. Ejemplo: 25 niños con caso activo actualmente, de los cuales 10 recibieron atención efectiva en 2026 vinculada a su caso actual: 10 / 25 × 100 = 40 %; KPI porcentual 40 % y KPI de cantidad 10. El ámbito efectivo es: Establecimiento únicamente sus casos autorizados si su acceso específico llega a validarse; Oficina Local sus casos o establecimiento filtrado; Regional su Región o unidades inferiores seleccionadas; Nacional el universo nacional o subconjunto territorial permitido. Esta definición no concede Reportería a Establecimiento. | Usuarios con autorización vigente de Reportería; Sistema | P1 — definición operativa provisional; ratificación con Alina pendiente | HU-038; HU-040; HU-042; HU-039; HU-041; HU-043; HU-050 |
| RF-130 | Reportería tendrá un botón visible Generar reporte en la parte superior para iniciar un asistente guiado emergente, modal o equivalente, independiente de la exploración interactiva. Paso 1: mostrar «Seleccione al menos 5 visualizaciones de las siguientes para incluir en su reporte» y las doce opciones de RF-128; permitir cinco a doce autorizadas y realmente disponibles, bloquear Siguiente con menos de cinco y no contar opciones no disponibles ni ampliar permisos. Paso 2: mostrar las seleccionadas una por una con gráfico/KPI, título dinámico y filtros relevantes; mostrar «Por favor, redacte su análisis asociado a la visualización mostrada» y campo multilínea. Exigir análisis no vacío ni solo espacios en cada una para avanzar; conservar textos al navegar Anterior/Siguiente y completar todas. No generar análisis automáticamente como sustituto de la interpretación humana. Si no hay cinco visualizaciones seleccionables, informar y bloquear el avance. | Oficina Local; Regional; Nacional autorizados; Sistema | P1 | HU-050; HU-038; HU-040; HU-042 |
| RF-131 | Paso 3 del asistente: exigir título y obtener automáticamente de la sesión y contexto fecha/hora de generación, identidad responsable, rol y ámbito, establecimiento/Oficina Local/Región/Nivel Nacional correspondiente, período y filtros, sin redigitación de datos disponibles, con revisión antes de confirmar. Paso 4: descargar documento con título, fecha/hora, responsable, área/ámbito, período y filtros, seguido de cada visualización seleccionada con título y filtros relevantes y su análisis directamente asociado, en orden revisado. Conservar trazabilidad del contexto, corte, filtros y datos usados; cuando sea técnicamente viable, preservar instantánea histórica reproducible para no alterar el significado por cambios posteriores de datos. Formato definitivo pendiente; PDF posible, no obligatorio. Sin aprobaciones, remisiones obligatorias ni periodicidad semestral/anual. Flujo distinto del reporte individual HU-030/CU-22 y de la descarga tabular de consolidaciones. | Oficina Local; Regional; Nacional autorizados; Sistema | P1 | HU-050; HU-039; HU-041; HU-043 |

## 9.8 Requerimientos funcionales transversales e integración

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-097** | El sistema conservará usuario ejecutor, responsable profesional cuando corresponda, fecha real del evento y fecha de digitación cuando difieran. En referencias, el responsable será la identidad autenticada; fecha, hora y usuario del envío digital se registrarán automáticamente como comprobante no editable, disponible en detalle, impresión, trazabilidad y consultas autorizadas, separado de la fecha/hora de generación o impresión. | Sistema; Establecimiento; Oficina Local | **P0** | HU-013; HU-014; HU-016; HU-017; HU-018; HU-027; HU-030; HU-031; HU-036; HU-037 |
| **RF-098** | Los formularios extensos de captura deberán permitir autoguardar y recuperar borradores para reducir la pérdida de información ante interrupciones, siempre que el flujo y las reglas de seguridad lo permitan. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-019; HU-020; HU-036; HU-037 |
| **RF-099** | El sistema deberá utilizar catálogos y reglas configurables para elementos sujetos a evolución institucional, tales como motivos, factores, estrategias, disciplinas, frecuencias, instituciones, tipos de actividad, niveles de riesgo, niveles de protección y reglas de priorización, evitando valores rígidos cuando sea técnicamente viable. | Sistema; administración técnica por definir | **P1** | Transversal |
| **RF-100** | El sistema deberá permitir versionar formularios, catálogos o reglas cuando cambien con el tiempo, preservando la interpretación de los registros históricos creados bajo versiones anteriores. Esto deberá contemplar especialmente instrumentos de valoración, factores y reglas de priorización que puedan evolucionar junto con el procedimiento institucional. | Sistema; administración técnica por definir | **P1** | Transversal |
| **RF-101** | El sistema deberá contemplar mecanismos controlados de importación o migración de información histórica cuando existan datos institucionales previos que deban incorporarse al módulo, validando su estructura y evitando duplicados. | Sistema; equipo técnico | **P1** | Transversal |
| **RF-102** | SIA-CENCINAI no duplicará vigilancia, nutrición, EDIN II, EVADE, SIDINACC/CAH ni Infoservicios, recapturará sus variables ni recalculará sus resultados o indicadores. Reutilizará datos institucionales autorizados cuando estén disponibles como contexto o entrada para A.I.; la detección de posibles referencias pendientes se regirá por RF-127, sin admisión automática ni sustitución del criterio profesional. | Sistema; Establecimiento; Oficina Local | **P0** | HU-013; HU-049 |
| **RF-103** | La implementación deberá aplicar permisos reforzados a información o acciones sensibles según las reglas institucionales de acceso, de manera complementaria al control general por rol y ámbito. | Sistema; Oficina Local; Regional; Nacional | **P0** | HU-011; HU-012; HU-033; HU-035 |
| **RF-104** | El sistema deberá obtener y respetar, mediante el mecanismo institucional de autorización vigente, los establecimientos previamente autorizados para cada usuario con acceso de nivel Establecimiento, incluidos profesionales, ASC2 y ASC3, sin mantener en SIA-CENCINAI una asignación paralela. Cuando exista un único establecimiento autorizado deberá aplicarse automáticamente; cuando existan varios, las vistas que requieran desagregación deberán limitar sus opciones exclusivamente a dichos establecimientos. | Establecimiento (Profesional / ASC2 / ASC3); Sistema | **P0** | HU-005; HU-023 |
| **RF-105** **(EXPLORATORIO / POSTERIOR 2027)** | Como funcionalidad futura, el asistente conversacional permitirá consultas de solo lectura sobre datos autorizados por rol y ámbito: cantidades y nombres de casos por prioridad, persona encargada, contacto, programación, referencias, última atención y casos sin atención en un período, entre otros datos expresamente permitidos. Establecimiento mantendrá las restricciones de detalle interno. | Todos los niveles autorizados; Sistema | **P2** | HU-047 |
| **RF-106** **(EXPLORATORIO / POSTERIOR 2027)** | Antes de resolver una consulta conversacional, el sistema deberá determinar y aplicar el rol, ámbito institucional, establecimientos autorizados cuando corresponda y demás restricciones de acceso vigentes para el usuario, de forma que el asistente no pueda ampliar los permisos disponibles mediante la interacción en lenguaje natural. | Todos los niveles autorizados; Sistema | **P0 para una eventual implementación** | HU-047; RF-002; RF-103; RF-104 |
| **RF-107** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente conversacional deberá identificar y utilizar únicamente las fuentes, entidades, tablas, vistas, campos o servicios de datos previamente habilitados para esta funcionalidad y compatibles con el contexto autorizado del usuario. La selección de datos deberá realizarse después de establecer el contexto de autorización y antes de construir o ejecutar la consulta correspondiente. | Sistema | **P0 para una eventual implementación** | HU-047 |
| **RF-108** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente ejecutará exclusivamente consultas de lectura validadas sobre fuentes autorizadas. No creará referencias o casos, modificará registros, cerrará casos, trasladará, reprogramará, cancelará, borrará ni realizará acciones operativas. | Sistema | **P0 para una eventual implementación** | HU-047 |
| **RF-109** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente deberá generar la respuesta en lenguaje natural a partir de los resultados efectivamente obtenidos de las fuentes autorizadas para la consulta. Cuando los resultados sean inexistentes, insuficientes, ambiguos o no permitan sustentar una respuesta, el sistema deberá informarlo al usuario y no presentar información no respaldada por los datos consultados. | Todos los niveles autorizados; Sistema | **P1** | HU-047 |
| **RF-110** **(EXPLORATORIO / POSTERIOR 2027)** | Cuando resulte relevante para interpretar el resultado, el asistente deberá indicar el ámbito, período, filtros o criterios principales utilizados para resolver la consulta, sin revelar información técnica o sensible que el usuario no esté autorizado a conocer. | Todos los niveles autorizados; Sistema | **P1** | HU-047 |
| **RF-111** **(EXPLORATORIO / POSTERIOR 2027)** | El sistema deberá conservar trazabilidad suficiente de las consultas realizadas mediante el asistente conversacional para permitir su revisión técnica y funcional, incluyendo al menos el usuario, fecha y hora, contexto de autorización utilizado, consulta realizada y resultado general de su procesamiento, conforme a las reglas institucionales de seguridad y privacidad que se definan para esta funcionalidad. | Sistema; Administrador autorizado | **P0 para una eventual implementación** | HU-047 |

---

# 11. Matriz de trazabilidad RF ↔ CU

La matriz relaciona los casos de uso con requerimientos funcionales e historias de usuario textuales. Incluye dependencias transversales de consulta, ámbito y datos históricos cuando corresponda; las relaciones gráficas existentes se conservan.

| Caso de uso | Requerimientos funcionales relacionados |
| --- | --- |
| **CU-01 — Consultar resumen de A.I. según rol** | RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-080. HU relacionadas: HU-001, HU-002, HU-003, HU-004. RF-127; HU-049. Inicio prioriza los indicadores operativos de HU-002, sin continuidad por traslado. |
| **CU-02 — Buscar y seleccionar un cliente/beneficiaria** | RF-001, RF-002, RF-008, RF-009, RF-010, RF-012, RF-013, RF-014, RF-015, RF-020, RF-104, RF-122, RF-124. HU relacionadas: HU-005, HU-006, HU-007, HU-008. RF-020 queda pendiente de revisión para exportación masiva dependiente exclusivamente de la pantalla retirada; búsqueda contextual vigente mediante RF-008/RF-010/RF-124. |
| **CU-03 — Consultar perfil según nivel de acceso** | RF-001, RF-002, RF-011, RF-012, RF-016, RF-017, RF-018, RF-019, RF-103, RF-112, RF-113, RF-124. HU relacionadas: HU-009, HU-010, HU-011, HU-012. |
| **CU-04 — Crear manualmente una referencia** | RF-010, RF-011, RF-021, RF-022, RF-023, RF-024, RF-025, RF-026, RF-027, RF-028, RF-029, RF-030, RF-034, RF-037, RF-097, RF-098, RF-102, RF-112, RF-113, RF-114, RF-115, RF-116, RF-119. HU relacionadas: HU-013. RF-048; RN-002. Control de caso activo antes del registro y revalidación posterior en apertura. |
| **CU-05 — Cargar referencia desde plantilla estandarizada** | RF-022, RF-023, RF-024, RF-027, RF-030, RF-034, RF-036, RF-037, RF-097, RF-114, RF-115, RF-116. HU relacionadas: HU-014. RF-021, RF-048; RN-002. Plantilla sujeta a las mismas restricciones globales. |
| **CU-06 — Consultar y gestionar referencias según ámbito** | RF-015, RF-023, RF-027, RF-030, RF-031, RF-032, RF-033, RF-034, RF-035, RF-097, RF-112, RF-114, RF-115, RF-116, RF-117, RF-123, RF-124. HU relacionadas: HU-015, HU-016, HU-017, HU-018. |
| **CU-07 — Gestionar una sesión interdisciplinaria** | RF-010, RF-038, RF-039, RF-040, RF-098, RF-120. HU relacionadas: HU-019. RF-041, RF-042, RF-047, RF-118; HU-020, HU-022, HU-025; RN-007, RN-009. Incluye sesiones de revaloración sin otro caso. |
| **CU-08 — Registrar valoración situacional** | RF-041, RF-042, RF-043, RF-044, RF-098, RF-118, RF-120. HU relacionadas: HU-020. RF-040, RF-047, RF-055; HU-019, HU-022, HU-025; RN-007, RN-009. Conserva valoraciones y prioridades históricas. |
| **CU-09 — Resolver si requiere A.I.** | RF-034, RF-045, RF-046. HU relacionadas: HU-021. RF-021, RF-048; RN-002. La decisión positiva no autoriza dos casos activos. |
| **CU-10 — Definir abordaje inicial y abrir caso** | RF-034, RF-047, RF-048, RF-097, RF-114, RF-115, RF-116, RF-118, RF-119, RF-120. HU relacionadas: HU-022. RF-021, RF-040, RF-041, RF-042, RF-055; HU-019, HU-020, HU-025; RN-002, RN-007, RN-009. Unicidad al confirmar y actualización del abordaje del caso activo. |
| **CU-11 — Consultar lista simplificada de A.I. desde Establecimiento** | RF-002, RF-012, RF-013, RF-015, RF-017, RF-049, RF-050, RF-104, RF-124. HU relacionadas: HU-023. |
| **CU-12 — Consultar y filtrar casos de Oficina Local** | RF-002, RF-015, RF-018, RF-051, RF-054, RF-119, RF-122, RF-124, RF-125, RF-126. HU relacionadas: HU-024. |
| **CU-13 — Consultar detalle integral en Oficina Local** | RF-002, RF-018, RF-055, RF-057, RF-103, RF-112, RF-115, RF-116, RF-126. HU relacionadas: HU-025. RF-040, RF-041, RF-042, RF-047, RF-061, RF-066, RF-118; HU-019, HU-020, HU-022, HU-028, HU-031; RN-007, RN-009, RN-012. Evolución e historial conservados. |
| **CU-14 — Consultar y filtrar casos Regionales** | RF-002, RF-014, RF-015, RF-052, RF-054, RF-119, RF-122, RF-124. HU relacionadas: HU-032. |
| **CU-15 — Consultar detalle desde Regional** | RF-002, RF-019, RF-056, RF-057, RF-103. HU relacionadas: HU-033. |
| **CU-16 — Consultar y filtrar casos Nacionales** | RF-002, RF-014, RF-015, RF-053, RF-054, RF-119, RF-122, RF-124. HU relacionadas: HU-034. |
| **CU-17 — Consultar detalle desde Nacional** | RF-002, RF-019, RF-056, RF-057, RF-103. HU relacionadas: HU-035. |
| **CU-18 — Gestionar documentos** | RF-002, RF-058, RF-103. HU relacionadas: HU-026. |
| **CU-19 — Registrar coordinación interinstitucional** | RF-002, RF-059, RF-060, RF-097, RF-103. HU relacionadas: HU-027. |
| **CU-20 — Trasladar caso** | RF-002, RF-061, RF-066, RF-097, RF-115; HU relacionadas: HU-028, HU-031; RN-012, RN-013, RN-014. RF-062 retirado; no es dependencia funcional vigente. |
| CU-21 — Confirmar continuidad por traslado — RETIRADO | RETIRADO. RF-062, RF-063 y HU-029 retirados; relaciones históricas únicamente, sin ejecución vigente. Identificadores reservados y diagrama conservado. Sustituyen los comportamientos vigentes de CU-20/CU-23 y eventual nueva referencia por CU-04/CU-05/CU-10. |
| **CU-22 — Generar reporte sin cerrar** | RF-002, RF-064, RF-065, RF-097, RF-123. HU relacionadas: HU-030. |
| **CU-23 — Cerrar caso A.I.** | RF-002, RF-065, RF-066, RF-097. HU relacionadas: HU-031. RF-061, RF-099, RF-100; HU-028; RN-003, RN-011, RN-012. Motivos estructurados y Otro explicado; reportería de motivos según 15.3 / RF-128. |
| **CU-24 — Registrar atención individual** | RF-010, RF-057, RF-067, RF-068, RF-069, RF-097, RF-098, RF-120, RF-126. HU relacionadas: HU-036. |
| **CU-25 — Registrar atención grupal** | RF-010, RF-057, RF-070, RF-071, RF-072, RF-073, RF-074, RF-097, RF-098, RF-120, RF-126. HU relacionadas: HU-037. |
| **CU-26 — Gestionar programación de Oficina Local** | RF-002, RF-015, RF-075, RF-076, RF-077, RF-078, RF-079, RF-080. HU relacionadas: HU-044. |
| **CU-27 — Consultar programación Regional** | RF-002, RF-014, RF-015, RF-081. HU relacionadas: HU-045. |
| **CU-28 — Consultar programación Nacional** | RF-002, RF-014, RF-015, RF-082. HU relacionadas: HU-046. |
| **CU-29 — Consultar reportería de Oficina Local** | RF-002, RF-083, RF-086, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126, RF-128, RF-129, RF-130, RF-131. HU relacionadas: HU-038; HU-050. RN-040/RN-041; informe formal independiente mediante CU-38; catálogo de doce y cobertura en 15.1 a 15.4. |
| **CU-30 — Consultar reportería Regional** | RF-002, RF-014, RF-084, RF-086, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126, RF-128, RF-129, RF-130, RF-131. HU relacionadas: HU-040; HU-050. RN-040/RN-041; informe formal independiente mediante CU-38; catálogo de doce y cobertura en 15.1 a 15.4. |
| **CU-31 — Consultar reportería Nacional** | RF-002, RF-014, RF-085, RF-086, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126, RF-128, RF-129, RF-130, RF-131. HU relacionadas: HU-042; HU-050. RN-040/RN-041; informe formal independiente mediante CU-38; catálogo de doce y cobertura en 15.1 a 15.4. |
| **CU-32 — Generar y descargar consolidación dinámica** | RF-002, RF-087, RF-088, RF-089, RF-090, RF-091, RF-092, RF-093, RF-094, RF-095, RF-096, RF-122, RF-125, RF-128, RF-129, RF-130, RF-131. HU relacionadas: HU-039; HU-041; HU-043; HU-050. RN-040/RN-041; informe formal independiente mediante CU-38; catálogo de doce y cobertura en 15.1 a 15.4. |
| **CU-33 — Administrar catálogos y versiones** | RF-099, RF-100, RF-118, RF-119, RF-120. HU relacionadas: Transversal a catálogos, formularios y reglas de las HU aplicables. |
| **CU-34 — Importar o migrar información histórica** | RF-001, RF-101. HU relacionadas: Transversal a identidad e información histórica de las HU aplicables. |
| **CU-35 — Consultar información mediante asistente conversacional — Usuario autorizado** | RF-002, RF-103, RF-104, RF-105, RF-106, RF-107, RF-108, RF-109, RF-110, RF-111. HU relacionadas: HU-047. |
| CU-36 — Identificar casos activos sin atención en un período | RF-002, RF-055, RF-087, RF-125, RF-126. HU relacionadas: HU-048. |
| CU-37 — Consultar posibles referencias pendientes desde fuentes institucionales | RF-002, RF-102, RF-104, RF-127. HU relacionadas: HU-049. RF-021, RF-030, RF-048; RN-002, RN-037; CU-04, CU-05. Sección independiente validada; detección automática dependiente de integración autorizada/UTIC. |

## 11.1 Requerimientos transversales o pendientes de un CU exclusivo

| Requerimiento | Aplicación |
| --- | --- |
| **RF-002** | Control de acceso por rol y ámbito; aplica transversalmente a los casos de uso ejecutados por usuarios del sistema. |
| **RF-097** | Trazabilidad de autor, responsable, fecha de evento y fecha de digitación; aplica a los flujos que crean o modifican información operativa. |
| **RF-098** | Autoguardado y recuperación; aplica a capturas extensas como referencia, sesión, valoración y atenciones. |
| **RF-102** | Reutilización de datos autorizados sin duplicar vigilancia, nutrición ni EDIN II/EVADE. Se relaciona con CU-04 y la detección explícita de RF-127/HU-049/CU-37; el mecanismo técnico de integración se define con UTIC. |
| **RF-103** | Permisos reforzados sobre información sensible; aplica a consultas y gestiones que involucren datos sujetos a restricciones adicionales. |
| **RF-104** | Obtención y aplicación de los establecimientos autorizados mediante el mecanismo institucional vigente, sin mantener una asignación paralela en SIA-CENCINAI. Aplica a las funcionalidades de nivel Establecimiento que dependen del ámbito autorizado y, de forma directa, a CU-02 y CU-11. |
| **RF-106 / RF-107 / RF-108** | Controles transversales del futuro asistente conversacional relativos a autorización previa, selección restringida de datos y ejecución exclusiva de consultas validadas de solo lectura. |
| CU-38 — Generar y descargar informe analítico con análisis por visualización | RF-002, RF-083 a RF-096, RF-122, RF-123, RF-128, RF-129, RF-130, RF-131. HU-050; HU-038 a HU-043; RN-040/RN-041. Explorar, consolidar y generar informe son actividades independientes; no depende de HU-030/CU-22 ni funcionalidades retiradas. |

---

---

# 12. Modelo conceptual de datos actualizado

```
Cliente/beneficiaria (persona maestra)
├── Identificadores
├── Datos maestros
├── Ámbito institucional
│   ├── Región
│   ├── Oficina Local
│   └── Establecimiento
├── Referencias A.I. [0..N]
└── Casos A.I. [0..N]
    ├── Referencia de origen
    ├── Valoraciones [0..N]
    ├── Plan de atención / abordaje vigente
    ├── Eventos de línea de tiempo [0..N]
    ├── Atenciones individuales [0..N]
    ├── Participaciones en atenciones grupales [0..N]
    ├── Documentos [0..N]
    ├── Coordinaciones interinstitucionales [0..N]
    ├── Traslados [0..N]
    ├── Reportes [0..N]
    └── Cierre [0..1]

Sesión interdisciplinaria
├── Fecha
├── Horario
├── Lugar
├── Disciplinas participantes
└── Casos/referencias analizados [0..N]

Atención grupal
├── Fecha
├── Tipo
├── Tema/objetivo
├── Lugar
├── Profesionales
├── Disciplinas
├── Participantes [1..N]
└── Asistencia por participante

Programación
├── Tipo de actividad
├── Fecha
├── Oficina Local
├── Establecimiento [0..1]
├── Estado
├── Motivo [según estado]
├── Nueva fecha [si se reprograma]
└── Observaciones

Configuración
├── Catálogos
├── Formularios
└── Versiones/reglas

Salida de reportería
├── Período
├── Ámbito
├── Filtros
├── Indicadores
└── Exportación
```

El modelo conceptual no implica que todos estos elementos deban almacenarse en una única base de datos. La arquitectura prevista debe permitir reutilizar datos maestros institucionales y almacenar en la base propia de SIA-CENCINAI la información específica de Atención Interdisciplinaria que corresponda.

---

La referencia preserva consecutivo, responsable autenticado, contexto histórico y fecha/hora/usuario de envío. La programación podrá relacionarse explícitamente con clientes/beneficiarias o casos específicos; su ausencia indica actividad general. La consulta de seguimiento obtiene última atención y ausencia de atenciones del período a partir de registros efectivos. Las situaciones de posible referencia pendiente reutilizan resultados institucionales autorizados sin reconstruir sus registros fuente. Precisiones textuales de la validación con Alina del 2 de noviembre de 2026 (el diagrama se conserva sin cambios): Persona mantiene relación con múltiples casos históricos, con un máximo de un caso A.I. activo global entre establecimientos y Oficinas Locales. Referencia pendiente y caso activo son entidades/estados distintos. El registro de una referencia comprueba y bloquea el caso activo incompatible, y la apertura revalida la unicidad al confirmar para evitar concurrencia, sin divulgar detalles no autorizados. Caso se relaciona con múltiples valoraciones y sesiones; cada valoración conserva factores, niveles profesionales de riesgo/protección, prioridad calculada por RN-009, fecha y responsables. Las revaloraciones preservan valores y prioridades anteriores y la evolución del abordaje o plan sin sobrescribir el pasado ni crear otro caso. Cierre conserva fecha, responsable, evento, motivo estructurado (Cierre satisfactorio, Traslado, Otro) y explicación obligatoria de Otro, con versión de catálogo cuando corresponda; Traslado no es automáticamente satisfactorio. El traslado cierra el origen sin generar caso, ingreso pendiente ni confirmación o estado Pendiente de continuidad; no hay relación obligatoria entre casos de origen y destino. Una vez asociada la persona al nuevo establecimiento en CAH/SIDINACC, una eventual referencia es nueva, con consecutivo propio y apertura normal. Posible referencia conserva detección y gestión, evita equivalentes duplicadas y admite solo una confirmación válida concurrente desde la misma sugerencia, según permisos; su detección depende de integración autorizada/UTIC. La identidad e historial siguen disponibles por búsqueda contextual; no existe pantalla ni listado general Personas/Clientes. Complemento conceptual de Reportería v0.7: Informe analítico se relaciona con usuario responsable y su rol/ámbito/unidad institucional, título, fecha/hora de generación, período, filtros y corte/datos utilizados. Contiene de cinco a doce elementos seleccionados del catálogo de doce; cada elemento conserva la visualización, su título dinámico, filtros relevantes, orden y análisis humano obligatorio asociado. Cuando sea técnicamente viable se preserva instantánea histórica reproducible. Los KPI referencian el universo de personas con caso activo actual y las atenciones efectivas del año del caso actual, según RN-040; no usan casos históricos cerrados para el numerador. Se distinguen informe analítico, consolidación tabular y reporte individual del caso. Es una precisión conceptual textual; el diagrama permanece sin cambios y no se define diseño físico ni DDL.

---

# 13. Reglas de negocio actualizadas

| ID | Regla | Estado |
| --- | --- | --- |
| **RN-001** | Una detección o hallazgo no abre automáticamente un caso de Atención Interdisciplinaria. | Confirmado |
| **RN-002** | La decisión de si un caso requiere Atención Interdisciplinaria corresponde al Equipo Interdisciplinario de Oficina Local. Una persona puede tener varios casos históricos, pero nunca dos A.I. activos simultáneamente, aun entre establecimientos u Oficinas Locales distintos. Antes de registrar una referencia se comprueba globalmente el caso activo y se bloquea la referencia incompatible; al confirmar apertura se verifica nuevamente para evitar duplicados por concurrencia. Se informa sin detalles internos no autorizados. Una referencia pendiente no equivale a caso activo; con los anteriores cerrados puede abrirse un nuevo caso. Trazabilidad: HU-013/HU-014/HU-021/HU-022; RF-021/RF-030/RF-036/RF-037/RF-048; CU-04/CU-05/CU-09/CU-10. | Confirmado / modelo objetivo |
| **RN-003** | El cierre de un caso A.I. no equivale automáticamente al egreso del cliente/beneficiaria de un servicio o modalidad institucional. El cierre utilizará motivos estructurados Cierre satisfactorio (objetivos de A.I. alcanzados), Traslado u Otro; Otro exige explicación textual. Fecha, responsable, motivo y evento se conservan en el historial, con catálogo configurable/versionable cuando corresponda para interpretación y reportería posterior. Traslado no se considera automáticamente satisfactorio; se conserva el texto de Otro para posterior análisis de palabras frecuentes. La reportería de motivos y palabras frecuentes se especifica en 15.3 / RF-128. | Confirmado |
| **RN-004** | DAF no constituye una ruta paralela de Atención Interdisciplinaria; sus particularidades deben integrarse al abordaje del caso cuando corresponda. | Confirmado |
| **RN-005** | La coincidencia exacta por identificación tiene precedencia sobre la coincidencia por nombre en los procesos de búsqueda y conciliación. | Confirmado |
| **RN-006** | La selección de clientes/beneficiarias y casos no debe depender de listas masivas; se prioriza la búsqueda por identificación o nombre. Se retira la pantalla principal Personas/Clientes y el listado general de CAH/SIDINACC; se conserva búsqueda contextual por identificación o nombre en referencias, sesiones, consulta de casos, atenciones y otros flujos autorizados, con ámbito institucional y sin cargas masivas innecesarias. | Confirmado |
| **RN-007** | Cualquier factor protector, factor de riesgo, signo de alerta u otro elemento seleccionado puede incorporar una especificación textual adicional. Ante situaciones nuevas durante un caso activo, el Equipo Interdisciplinario puede realizar otra sesión y registrar una nueva valoración, factores protectores, de riesgo o signos de alerta, actualizar profesionalmente riesgo y protección y recalcular prioridad según RN-009 sin selección manual. Se actualiza abordaje o plan cuando corresponda, sin otro caso y conservando valoraciones, prioridades históricas, fechas y responsables sin sobrescribir el pasado. Trazabilidad: HU-019/HU-020/HU-022/HU-025; RF-040/RF-041/RF-042/RF-047/RF-055/RF-118; CU-07/CU-08/CU-10/CU-13. | Confirmado |
| **RN-008** | Intensidad, frecuencia y persistencia no son campos obligatorios de la valoración situacional. Para cada categoría/grupo de Factores requerido en la Valoración situacional según la definición funcional vigente, debe registrarse al menos un factor aplicable o la opción explícita Ninguno; una categoría sin respuesta se considera incompleta e impide continuar o completar la etapa correspondiente. El sistema identifica las categorías pendientes con un mensaje comprensible. Ninguno significa categoría revisada sin factores aplicables, no dato faltante, pendiente, no revisado ni desconocido. Es mutuamente excluyente con los demás factores de esa misma categoría: al seleccionar un factor debe retirarse Ninguno o exigirse su desmarcado. Esta regla no declara obligatorias todas las categorías del sistema. Trazabilidad: HU-020 CA-13/CA-14 → RF-043 → CU-08. | Confirmado post-validación |
| **RN-009** | El equipo determina profesionalmente riesgo y protección; los checkboxes no fijan sus niveles globales. La prioridad A.I. se calcula, sin selección manual, por la siguiente matriz única: Alto + Baja = Alto; Alto + Moderada = Alto; Moderado + Baja = Alto; Alto + Alta = Moderado; Moderado + Moderada = Moderado; Moderado + Alta = Moderado; Bajo + Baja = Moderado; Bajo + Moderada = Bajo; Bajo + Alta = Bajo. Se presenta Alto/rojo, Moderado/ámbar o amarillo y Bajo/verde con texto. | Confirmado |
| **RN-010** | Una atención grupal se registra una sola vez como actividad base y se asocia a múltiples participantes. | Confirmado |
| **RN-011** | La generación de un reporte no implica el cierre del caso y no debe modificar automáticamente su estado. El cierre es una acción independiente que conserva fecha, responsable, motivo estructurado y evento conforme a RN-003 y RF-066; no exige generar un informe salvo decisión institucional posterior. | Confirmado |
| **RN-012** | Cuando una persona cambia de establecimiento y posee un caso A.I. activo, el caso de origen se cierra con motivo Traslado, conservando fecha, responsable, motivo y evento en su historial consultable según permisos. No se genera automáticamente otro caso ni ingreso pendiente de continuidad, y no equivale a Cierre satisfactorio. | Confirmado — validación con Alina 02-11-2026 |
| **RN-013** | Se retiran el ingreso pendiente y el estado Pendiente de continuidad, la confirmación de continuidad en destino y la vinculación obligatoria entre casos de origen y destino. HU-029, RF-062, RF-063 y CU-21 quedan retirados, con sus identificadores reservados y el diagrama de CU-21 conservado. | Confirmado — validación con Alina 02-11-2026 |
| **RN-014** | Cuando la persona aparece asociada al nuevo establecimiento en CAH/SIDINACC, el personal autorizado puede crear una referencia completamente nueva con consecutivo propio. Si requiere A.I., se abre un nuevo caso por el procedimiento normal y con control de unicidad de caso activo. La recepción del expediente físico no crea caso ni activa continuidad automática. | Confirmado — validación con Alina 02-11-2026 |
| **RN-015** | Una actividad marcada como Reprogramada debe registrar una nueva fecha y el motivo de la reprogramación. | Confirmado |
| **RN-016** | Una actividad Cancelada conserva registro y motivo para trazabilidad y análisis; no se borra como mecanismo normal de gestión. Una actividad vencida permanece Programada hasta resolverse como Realizada, Reprogramada o Cancelada. | Confirmado |
| **RN-017** | Oficina Local crea y modifica la programación; Regional y Nacional la consultan sin editarla. | Confirmado |
| **RN-018** | El ámbito de consulta y los filtros disponibles dependen del rol institucional del usuario. En Reportería las mismas métricas mantienen su definición y solo varía el universo institucional permitido. Los filtros dependientes no permiten ascender fuera del ámbito. No se concede automáticamente acceso de Establecimiento a Reportería; visualizaciones y KPI permitidos para ese nivel quedan pendientes de validación. | Confirmado |
| **RN-019** | El consolidado es una salida dinámica de reportería y no requiere un proceso obligatorio de remisión o aprobación entre niveles. | Confirmado post-validación |
| **RN-020** | Toda exportación debe respetar el ámbito, los filtros y los permisos vigentes del usuario. | Confirmado |
| **RN-021** | La información cargada desde la plantilla Excel estandarizada debe ser revisada antes de confirmarse y, una vez aceptada, seguir las mismas reglas de una referencia digitada manualmente. | Propuesta de diseño validada |
| **RN-022** | El digitador y responsable profesional pueden diferir cuando el flujo lo admite, como en coordinaciones. En referencias, el responsable es siempre la identidad institucional autenticada que la realiza, no editable ni seleccionable, también al cargar plantillas. | Confirmado |
| **RN-023** | Regional y Nacional no modifican la gestión operativa de los casos dentro del alcance actual; su acceso individual es de consulta según permisos. | Confirmado |
| **RN-024** | Establecimiento, incluidos ASC2 y ASC3 con las mismas capacidades autorizadas, consulta estado y prioridad A.I. y filtra por prioridad. No accede a valoración completa, factores detallados, riesgo/protección, plan, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo. | Confirmado |
| **RN-025** | Personas únicas atendidas y total de atenciones son métricas diferentes: una persona atendida cinco veces representa una persona única y cinco atenciones. Una atención grupal representa un registro base y sus personas atendidas se cuentan según asistencia, sin multiplicar el registro por participantes. Los KPI 11 y 12 de cobertura usan N y D de RN-040; no son conteos generales de todas las personas históricamente atendidas ni incluyen atenciones de casos anteriores cerrados. | Confirmado |
| **RN-026** | Los filtros de disciplina o profesional deben afectar únicamente los indicadores funcionalmente relacionados o identificar claramente cuáles métricas se encuentran filtradas. Aplican también sexo, edad y tipo de atención según pertinencia: cada filtro identifica las visualizaciones afectadas, se destacan/enumeran los activos con opción de restablecer y se actualizan títulos dinámicos. No se aplican filtros incompatibles ni se altera silenciosamente el universo de cobertura de RN-040; títulos y filtros se conservan en informes. | Confirmado / definición funcional |
| **RN-027** | Vía de Atención utiliza Urgencia o No inmediata y es distinta de prioridad A.I., cuyos valores son Alto, Moderado y Bajo. | Confirmado |
| **RN-028** | La referencia enviada digitalmente queda inmediatamente disponible para Oficina Local como Pendiente de revisión; no requiere recibido manual. El resultado del análisis será Admitida a A.I. al confirmar admisión o No requiere A.I., con justificación obligatoria y sin abrir caso activo en este último resultado. | Confirmado |
| **RN-029** | Fecha, hora y usuario de envío se registran automáticamente, no son editables y constituyen comprobante de entrega digital; son distintos de fecha/hora de generación o impresión documental. | Confirmado |
| **RN-030** | El consecutivo institucional se vincula al establecimiento del cliente/beneficiaria, no al lugar de trabajo del digitador, y acompaña al caso como trazabilidad de la referencia de origen conforme a RF-114 y RF-115. | Confirmado |
| **RN-031** | El contexto histórico de referencia, incluida edad de ese momento y datos institucionales disponibles, se preserva sin cambios retroactivos de fuentes maestras y se conserva al abrir el caso. | Confirmado |
| **RN-032** | La frecuencia del abordaje es planificación ideal, incluye Trimestral, Semestral y Según necesidad junto con alternativas vigentes y no determina la periodicidad institucional de reuniones. | Confirmado |
| **RN-033** | La atención grupal A.I. se asocia al niño/cliente beneficiario; los acompañantes no forman parte de su registro en el alcance actual. La identificación adulta o parentesco para asistencia educativa se atiende mediante mecanismos documentales/procedimentales correspondientes, sin definir integración con Infoservicios. | Confirmado |
| **RN-034** | Una actividad dirigida a personas o casos específicos requiere asociación explícita. Una actividad general del establecimiento/equipo no programa ni acredita atención a todos los niños de ese establecimiento. | Confirmado |
| **RN-035** | Un caso activo sin atenciones registradas en un período se identifica aunque no tenga programación; se muestra última fecha de atención o Sin atención registrada cuando nunca exista, utilizando atenciones efectivas y asistencia grupal. | Confirmado |
| **RN-036** | Una referencia admite múltiples motivos. Su análisis cuenta frecuencia de cada motivo, cuyos conteos pueden superar el total de referencias y no deben sumarse como categorías excluyentes. La visualización principal utiliza nube de palabras con tamaño según frecuencia conforme a RF-128; la suma no es una partición del total de referencias. | Confirmado |
| **RN-037** | Posibles referencias es una sección independiente de Referencias, validada para personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local, con paginación, búsqueda por identificación y nombre y filtros por establecimiento, fecha de detección y criterio o categoría según ámbito y permisos. La detección automática depende de integración con fuentes autorizadas y coordinación con UTIC; no se declara productiva. Requiere criterio vigente y ausencia de referencia equivalente gestionada; solo una operación válida podrá confirmarse ante intentos concurrentes desde la misma sugerencia, aplicando además el bloqueo por caso activo incompatible de RN-002. Se inicia referencia con revisión humana y se conserva trazabilidad de detección y gestión al resolver el pendiente, sin recalcular vigilancia ni abrir casos automáticamente. Trazabilidad: HU-049; RF-127; CU-37. | Confirmado |
| **RN-038** | El asistente conversacional es exploratorio y de solo lectura: aplica rol, ámbito y permisos existentes sin crear, modificar, cerrar, trasladar, reprogramar, cancelar ni borrar registros. | Confirmado |
| **RN-039** | SIA gestiona Atención Interdisciplinaria y reutiliza datos institucionales disponibles; no sustituye CAH/SIDINACC o Infoservicios ni mantiene vigilancia, nutrición, EDIN II o EVADE paralelos. | Confirmado |
| RN-040 | Definición operativa provisional vigente para el trabajo, pendiente únicamente de ratificación posterior con Alina: D es la cantidad de personas únicas con un caso A.I. activo actualmente, al momento de la consulta, dentro del ámbito autorizado y filtros pertinentes. N es la cantidad de personas de ese mismo D con al menos una atención efectiva durante el año seleccionado, vinculada a su caso actualmente activo. Porcentaje = (N / D) × 100; el KPI de cantidad muestra N personas únicas, no registros de atención. Se usa fecha real de atención; una grupal cuenta solo con participación efectiva/asistencia. Se excluyen programación sin ejecutar, asistencia no confirmada y atenciones pertenecientes únicamente a casos anteriores cerrados. El año delimita las atenciones; Activo se evalúa actualmente, sin convertirlo en activo histórico del año seleccionado. El filtro general Activo/Cerrado/Todos no cambia el denominador de este KPI: siempre usa casos activos actuales y debe indicarlo expresamente. Los filtros pertinentes y el ámbito efectivo se aplican consistentemente a N y D; los incompatibles no se aplican ni se presentan como aplicados. Con D = 0 se muestra Sin casos activos o No aplica sin dividir entre cero. Se identifican universo, año y corte/fecha de consulta; valores altos se ven progresivamente más verdes y bajos más rojos, con porcentaje numérico y sin umbrales institucionales de cumplimiento. Ejemplo: 25 niños con caso activo actualmente, de los cuales 10 recibieron atención efectiva en 2026 vinculada a su caso actual: 10 / 25 × 100 = 40 %; KPI porcentual 40 % y KPI de cantidad 10. El alcance territorial es el ámbito efectivo autorizado: Oficina Local y sus establecimientos, Región y unidades inferiores seleccionadas o Nacional y cualquier subconjunto territorial permitido. Establecimiento solo sus casos autorizados si su acceso específico se valida; esta regla no le concede acceso. Trazabilidad: RF-129; HU-038/HU-040/HU-042/HU-050 y consolidaciones HU-039/HU-041/HU-043; CU-29 a CU-32/CU-38. | Operativa provisional vigente — ratificación posterior con Alina pendiente |
| RN-041 | Explorar Reportería y generar informe analítico formal son actividades independientes. Generar reporte, visible arriba, inicia asistente: seleccionar cinco a doce de las doce visualizaciones de 15.3, solo autorizadas y realmente disponibles; menos de cinco bloquea Siguiente. Cada visualización se presenta una por una con título/filtros y análisis humano multilínea obligatorio, no vacío ni solo espacios, conservado al navegar; no se sustituye con generación automática. Se exige título y se obtienen automáticamente fecha/hora, responsable, rol/ámbito/unidad, período y filtros; revisión antes de confirmar. Documento: metadatos y cada visualización seguida directamente de su análisis, títulos/filtros conservados y trazabilidad de corte/datos, con instantánea histórica reproducible cuando sea técnicamente viable. Formato pendiente (PDF posible, no obligatorio); sin aprobaciones, remisiones obligatorias ni periodicidad semestral/anual. No se confunde con HU-030/CU-22 ni con consolidación tabular. Trazabilidad: HU-050; RF-128/RF-129/RF-130/RF-131; CU-38. | Confirmado funcionalmente — validación con Alina 02-11-2026; formato pendiente |

---

---

# 14. Requerimientos no funcionales

Los requerimientos no funcionales definen las condiciones de calidad, seguridad, integridad, usabilidad, rendimiento y mantenibilidad que deberá cumplir la solución SIA-CENCINAI. A diferencia de los requerimientos funcionales, estos requisitos no describen una operación específica de un actor, sino las propiedades que deben mantenerse de forma transversal en el sistema.

| ID | Categoría | Requerimiento no funcional | Prioridad |
| --- | --- | --- | --- |
| **RNF-001** | Seguridad y autorización | El sistema deberá aplicar control de acceso basado en rol y ámbito institucional en todas las consultas y operaciones. Las restricciones no deberán depender únicamente de ocultar opciones en la interfaz: la capa de servicio/datos deberá impedir que un usuario consulte o modifique información fuera de su Establecimiento, Oficina Local, Región o ámbito Nacional autorizado. En Reportería los permisos se aplican desde las consultas de datos y agregaciones, incluidas selección de visualizaciones y generación/descarga de informes; los filtros no amplían el universo autorizado ni conceden acceso nuevo a Establecimiento. | **P0** |
| **RNF-002** | Principio de mínimo privilegio | Cada rol deberá disponer únicamente de las capacidades necesarias para su función. Establecimiento tendrá acceso limitado a la información mínima de A.I.; Oficina Local concentrará la gestión operativa; Regional y Nacional accederán a la información permitida en modo de consulta cuando corresponda, sin habilitar acciones de edición reservadas a niveles operativos. | **P0** |
| **RNF-003** | Auditoría | El sistema deberá registrar de forma trazable los accesos y cambios relevantes sobre información de A.I., incluyendo como mínimo usuario, rol, fecha y hora, acción realizada y entidad afectada. Cuando exista modificación de información sensible o de estado, la auditoría deberá permitir identificar qué cambió y quién ejecutó la acción. La generación de informes analíticos conserva responsable, rol/ámbito, fecha/hora, período, filtros, corte temporal y trazabilidad de los datos utilizados. | **P0** |
| **RNF-004** | Privacidad por diseño | La solución deberá minimizar la exposición de datos personales y sensibles en pantallas, listados, consultas y exportaciones. Cada vista deberá mostrar únicamente la información necesaria para el rol y propósito de uso, aplicando restricciones adicionales cuando existan datos sensibles sujetos a permisos reforzados. | **P0** |
| **RNF-005** | Integridad histórica | El sistema deberá preservar la historia de cada caso sin sobrescribir ni eliminar silenciosamente eventos anteriores. Aperturas, atenciones, cambios de estado, traslados, reportes, cierres y demás eventos relevantes deberán conservar su secuencia histórica; cualquier corrección posterior deberá mantener trazabilidad suficiente para reconstruir la evolución del caso. Se conservan también cada revaloración y prioridad histórica con sus fechas y responsables, sin sobrescribir el pasado. Los informes analíticos preservan su significado histórico mediante contexto, filtros y corte/datos utilizados y, cuando sea técnicamente viable, una instantánea histórica reproducible, sin reinterpretarse silenciosamente al actualizar datos. | **P0** |
| **RNF-006** | Trazabilidad y proveniencia de datos | Los registros relevantes deberán conservar, cuando aplique, la fuente de los datos, el usuario que digitó la información, el profesional responsable de la acción, la fecha real del evento y la fecha de digitación. Estas fechas y responsabilidades no deberán asumirse como equivalentes cuando correspondan a personas o momentos distintos. | **P0** |
| **RNF-007** | Consistencia transaccional | Las operaciones que modifican varias entidades relacionadas se ejecutarán consistentemente: apertura de caso, cierre por Traslado, registro grupal o cierre no dejarán estados parciales. Se garantiza un solo caso A.I. activo por persona entre todos los ámbitos, revalidando al confirmar la apertura para evitar duplicados por concurrencia. Antes de registrar una referencia se bloquea la incompatible con un caso activo. Al crear referencias desde una misma sugerencia concurrentemente, solo una operación válida podrá confirmarse y se evitarán equivalentes duplicadas. No existe confirmación de continuidad por traslado. Si una operación no puede completarse se evitan cambios incompletos o se deja evidencia controlada del error. La actualización de Reportería mantendrá gráficos, KPI, títulos, filtros y corte consistentes entre sí; la confirmación del informe no mezclará resultados de cortes diferentes. | **P0** |
| **RNF-008** | Recuperabilidad de captura | Los formularios extensos de captura deberán reducir el riesgo de pérdida de información mediante autoguardado o mecanismos equivalentes de borrador. Tras una interrupción, el usuario deberá poder recuperar una captura no finalizada sin duplicar registros ya confirmados ni confundir un borrador con información definitiva. | **P0** |
| **RNF-009** | Usabilidad y mínima redigitación | La interfaz deberá priorizar la reutilización de datos maestros existentes y evitar solicitar nuevamente información ya disponible. Para seleccionar clientes/beneficiarias o casos se deberán utilizar búsquedas por identificación o nombre en lugar de listas masivas, y los datos recuperados deberán precargarse en los flujos que los requieran. Para reducir carga cognitiva y evitar formularios saturados, se utilizará presentación progresiva/colapsable en conjuntos extensos de opciones. Los controles de entrada para selección múltiple, incluidas Disciplinas y Factores cuando aplique, serán claros, compactos y estructurados (lista, desplegable multiselección o equivalente; búsqueda opcional), sin chips, pills, tags o globitos como mecanismo principal de selección. Se preservan opciones, reglas y búsquedas vigentes; se mantienen badges/chips destinados solo a estados, etiquetas informativas, resultados seleccionados o indicadores visuales. No se impone tecnología frontend. | **P0** |
| **RNF-010** | Consistencia terminológica y de interacción | Los mismos conceptos deberán utilizar nombres, estados, etiquetas y patrones de interacción consistentes en todos los módulos. Términos como cliente/beneficiaria, referencia, caso A.I., prioridad, estado, Oficina Local y establecimiento no deberán variar entre pantallas salvo que exista una diferencia funcional real. Los componentes equivalentes deberán conservar también una presentación, jerarquía y comportamiento visual consistentes conforme a la Especificación de Diseño, Identidad Visual y Accesibilidad vigente. | **P0** |
| **RNF-011** | Ayuda contextual | Cada módulo o pantalla principal deberá incluir una ayuda breve y contextual que explique su propósito, el alcance del rol y las acciones disponibles, utilizando lenguaje institucional comprensible y evitando instrucciones técnicas o mensajes propios del entorno de desarrollo. | **P1** |
| **RNF-012** | Diseño responsive | La interfaz deberá poder utilizarse de forma funcional en equipos de escritorio, tabletas y dispositivos móviles empleados en escenarios de campo. Los controles, formularios, tablas y navegación deberán adaptarse al tamaño de pantalla sin ocultar información crítica ni obligar a desplazamientos horizontales innecesarios para completar tareas esenciales. La adaptación de la interfaz no deberá impedir la ampliación del contenido mediante las funciones estándar del navegador ni eliminar funcionalidades esenciales. | **P1** |
| **RNF-013** | Eficiencia de búsquedas y filtros | Las búsquedas por identificación o nombre y los filtros por ámbito, estado, prioridad, disciplina, profesional y período deberán responder de forma eficiente aun cuando aumente el volumen de registros. El sistema deberá evitar recorridos o cargas innecesarias de datos que no pertenecen al corte solicitado. Las agregaciones y doce visualizaciones deben calcularse eficientemente en ámbitos locales, regionales y nacionales, evitando transferencias, consultas y cálculos innecesarios, con actualización reactiva consistente ante filtros; no se fija tecnología ni umbral de rendimiento sin validación. | **P0** |
| **RNF-014** | Paginación y carga incremental | Los listados potencialmente extensos de clientes/beneficiarias, casos, referencias, programación y otros registros deberán utilizar paginación, carga incremental o un mecanismo equivalente, evitando presentar o transferir al cliente el universo completo de registros cuando no sea necesario. Reportería y sus tablas Top-N utilizarán tratamiento acotado de grandes volúmenes y paginación cuando corresponda, sin cargar todos los registros nacionales al navegador. | **P0** |
| **RNF-015** | Procesamiento de filtros en la capa de datos | En la implementación productiva con backend, las búsquedas, filtros jerárquicos, paginación, conteos y consultas sobre conjuntos potencialmente grandes deberán resolverse preferentemente en la capa de servicio o datos. El cliente deberá recibir únicamente el conjunto necesario para la vista y los permisos del usuario. Las agregaciones analíticas y KPI se resuelven sobre datos autorizados antes de transferir los resultados necesarios al navegador, evitando cálculos o transferencias masivas innecesarias. WebSockets, cachés específicos, streaming, vistas materializadas y diseño físico/DDL no se prescriben; la solución se decidirá en diseño de implementación. | **P1** |
| **RNF-016** | Escalabilidad | La arquitectura deberá soportar el crecimiento progresivo de clientes/beneficiarias, casos, atenciones, documentos, programación y registros históricos desde un ámbito local hasta consultas nacionales, sin requerir rediseñar los flujos funcionales ni cargar todos los datos en memoria del cliente. | **P1** |
| **RNF-017** | Consistencia de exportaciones | Toda exportación deberá respetar exactamente el ámbito, filtros y permisos vigentes al momento de generarse. Los archivos no deberán incluir registros o campos que el usuario no pueda consultar en pantalla y deberán identificar, cuando corresponda, el período y ámbito utilizados para producir el corte. El informe analítico conserva títulos dinámicos, filtros relevantes, universo, período y corte temporal utilizados; cada análisis queda asociado directamente a su visualización, con trazabilidad de datos y contexto de generación. Su formato definitivo permanece pendiente. | **P1** |
| **RNF-018** | Configurabilidad | Los elementos sujetos a evolución institucional —como motivos, factores, prioridades, estrategias, disciplinas, frecuencias, instituciones y tipos de actividad— deberán administrarse mediante catálogos configurables cuando sea técnicamente viable, evitando dependencias innecesarias de cambios de código para ajustes de contenido. | **P1** |
| **RNF-019** | Versionamiento funcional | Cuando cambien formularios, catálogos o reglas de negocio, el sistema deberá identificar la versión vigente y conservar la información necesaria para interpretar correctamente los registros históricos creados bajo versiones anteriores. | **P1** |
| **RNF-020** | Interoperabilidad con SIDINACC/CAH | La solución deberá diseñarse para interoperar con las fuentes institucionales existentes mediante identificadores estables y mecanismos de integración definidos, reutilizando datos maestros cuando estén disponibles. La integración no deberá exigir duplicar información institucional salvo que exista una necesidad técnica o histórica justificada. | **P1** |
| **RNF-021** | Validación e integridad de datos | El sistema deberá validar obligatoriedad, formato, relaciones jerárquicas y coherencia básica antes de confirmar operaciones. No deberá permitir, por ejemplo, asociar una Oficina Local a una Región incorrecta, un establecimiento a una Oficina Local incompatible o finalizar un flujo con datos obligatorios faltantes. En Valoración situacional aplica RN-008: cada categoría requerida debe responderse con factor(es) o Ninguno, sin coexistencia entre ambos, antes de continuar/finalizar la etapa. Se validan la unicidad global de caso activo y la concurrencia al confirmar apertura, sin equiparar referencia pendiente con caso activo; se valida la explicación obligatoria de Otro en cierres. | **P0** |
| **RNF-022 ** | Manejo de errores | Ante fallos de validación, integración, almacenamiento o procesamiento, el sistema deberá informar al usuario de manera clara qué ocurrió y qué acción puede realizar, sin exponer detalles técnicos sensibles. Los errores no deberán producir pérdida silenciosa de información ni dejar al usuario suponiendo que una operación fue confirmada cuando no lo fue. Reportería muestra estados legibles de carga, error y ausencia de datos, distinguiendo cero válido, Sin casos activos y resultado no disponible; no presenta resultados incompletos ni mezcla cortes como si fueran vigentes. El asistente conserva la captura permitida y no confirma un documento incompleto. | **P0** |
| **RNF-023** | Identidad gráfica institucional | El sistema deberá mantener coherencia con los lineamientos vigentes de identidad gráfica de CEN-CINAI. Las interfaces y documentos generados deberán utilizar únicamente variantes autorizadas del logotipo, respetar sus proporciones y área de protección, y utilizar la paleta institucional como base de identidad visual. No se deberán deformar, recolorear, reconstruir ni generar variantes no autorizadas de los elementos oficiales de marca. | P0 |
| **RNF-024** | Accesibilidad digital | Las interfaces de SIA-CENCINAI deberán diseñarse e implementarse tomando como referencia los criterios aplicables de **WCAG 2.2 nivel AA** y los lineamientos institucionales vigentes de accesibilidad digital, procurando que el contenido sea perceptible, operable, comprensible y robusto para personas que utilicen diferentes dispositivos o tecnologías de asistencia. | P0 |
| **RNF-025** | Navegación mediante teclado | Todas las funcionalidades esenciales del sistema deberán poder utilizarse mediante teclado sin requerir obligatoriamente el uso de mouse. El orden de navegación deberá ser lógico y los elementos interactivos deberán presentar un indicador de foco visible durante la navegación. | P0 |
| **RNF-026** | Semántica y tecnologías de asistencia | Las interfaces deberán utilizar elementos y controles con semántica adecuada, incluyendo etiquetas asociadas a campos, encabezados jerárquicos, botones, enlaces y estructuras tabulares interpretables por tecnologías de asistencia. Cuando un control no disponga de texto visible suficiente, deberá proporcionar un nombre accesible equivalente. | P0 |
| **RNF-027** | Contraste y uso del color | La información, los estados y las acciones no deberán comunicarse exclusivamente mediante color. Los textos, controles, iconos y demás elementos funcionales deberán mantener contraste suficiente con respecto al fondo y utilizar, cuando corresponda, texto, iconografía, patrones u otros mecanismos adicionales para transmitir significado. El KPI de cobertura muestra porcentaje numérico además de una escala progresiva rojo–verde; no comunica cumplimiento mediante umbrales institucionales inventados. | P0 |
| **RNF-028** | Legibilidad y ampliación | La interfaz deberá mantener legibilidad y funcionalidad al utilizar las herramientas estándar de ampliación del navegador. El aumento del contenido no deberá provocar pérdida de información, superposición de controles, texto cortado o desaparición de acciones esenciales. | P1 |
| **RNF-029** | Accesibilidad de imágenes y visualizaciones | Toda imagen, gráfico, diagrama o elemento visual que comunique información deberá disponer de una alternativa textual adecuada. Las visualizaciones analíticas deberán incluir títulos, etiquetas y leyendas comprensibles y no depender únicamente de diferencias cromáticas para distinguir series, estados o categorías. Las doce visualizaciones, incluidas nubes de palabras, gráfico circular, tabla Top-N y KPI, mantendrán legibilidad, títulos/filtros visibles, etiquetas y alternativa textual de la información analítica; carga/error/sin datos también serán comprensibles. | P1 |
| **RNF-030** | Accesibilidad de documentos generados | Los documentos y reportes electrónicos generados por SIA-CENCINAI deberán, cuando el formato y las herramientas utilizadas lo permitan, conservar una estructura accesible mediante títulos, orden lógico de lectura, texto seleccionable, tablas estructuradas, enlaces descriptivos y alternativas textuales para contenido no textual. En el informe analítico cada gráfica/KPI mantiene título y filtros y se ubica junto a su análisis humano, conservando orden de lectura, legibilidad y metadatos sin imponer PDF u otro formato aún pendiente. | P1 |
| **RNF-031** | Validación de accesibilidad | Las interfaces y documentos electrónicos relevantes deberán someterse, antes de considerarse terminados, a verificaciones de accesibilidad mediante una combinación de herramientas automáticas y revisión manual. Como mínimo deberán comprobarse navegación por teclado, foco visible, contraste, etiquetas, orden lógico, alternativas textuales y ausencia de dependencia exclusiva del color. | P0 |
| **RNF-032** | Sistema de diseño y reutilización de componentes | Los elementos visuales e interactivos recurrentes deberán implementarse mediante componentes reutilizables y criterios centralizados de diseño. Colores, tipografías, espaciados, bordes, tamaños y estados comunes deberán gestionarse mediante variables, temas o *design tokens* equivalentes, evitando valores visuales arbitrarios distribuidos entre distintas pantallas. | P1 |

---

---

# 15. Reportería inicial

## 15.1 Filtros principales

Los filtros respetan rol, ámbito y relación con cada indicador: Filtros disponibles según ámbito, permiso y pertinencia: año/período, Región, Oficina Local, establecimiento, estado, prioridad, sexo, edad, tipo de atención, disciplina y profesional. Los territoriales son jerárquicos y dependientes y nunca amplían el ámbito: Establecimiento solo sus establecimientos autorizados, sin unidades superiores; Oficina Local su ámbito y establecimientos; Regional su Región con Oficina Local/establecimiento; Nacional el universo nacional autorizado con Región/Oficina Local/establecimiento. Esto no concede Reportería a Establecimiento: sus visualizaciones y KPI permitidos requieren validación específica y se mantienen las restricciones vigentes. Cada filtro identifica las visualizaciones que afecta; los incompatibles se deshabilitan o no se aplican, sin cambios silenciosos de universo.

- Oficina Local: año/período, establecimiento, estado, prioridad A.I., disciplina y profesional.
- Regional: año/período, Oficina Local, establecimiento, estado, prioridad A.I., disciplina y profesional dentro de su Región.
- Nacional: año/período, Región, Oficina Local, establecimiento, estado, prioridad A.I., disciplina y profesional dentro del ámbito permitido.
- Análisis aplicable por tipo vigente de atención, sexo y edad mediante filtros, rangos configurables o agrupaciones analíticas, sin grupos etarios únicos obligatorios.

Los filtros territoriales son dependientes. Cada indicador identifica su período, evento temporal y filtros aplicables; prioridad A.I. utiliza Alto, Moderado y Bajo, diferenciada de Vía de Atención. Aplicabilidad: los filtros territoriales restringen las 12 visualizaciones a su ámbito autorizado. Estado Activo/Cerrado/Todos y prioridad se aplican a distribuciones de casos cuando sean pertinentes (1 a 5); sexo y edad actual delimitan los casos/personas de las distribuciones compatibles y los KPI 11/12 cuando correspondan. La visualización 9 y la 10 usan cierres y Otro respectivamente; no se les aplica un estado incompatible que convierta su universo en casos activos. Año/período utiliza el evento temporal pertinente identificado en cada visualización: cancelación en 6, referencia en 7, fecha real de atención en 8, cierre en 9/10; en 11/12 el año corresponde a atenciones del caso activo actual. En 1 a 5 se debe identificar el corte/fecha de consulta y cualquier evento temporal aplicable, sin hacer pasar automáticamente el estado actual por estado histórico del año. Tipo, disciplina y profesional delimitan métricas de atención funcionalmente relacionadas; no filtran motivos de referencia/cancelación/cierre sin relación definida ni se aplican solo al numerador de cobertura alterando silenciosamente su universo. Si no hay una aplicación coherente a N y D, esos filtros se muestran no aplicables al KPI. La interfaz indica siempre el alcance efectivo de cada filtro. Al cambiar filtros se actualizan reactivamente los gráficos y KPI con datos operativos vigentes y un corte consistente autorizado. Los filtros activos se destacan de forma clara, se enumeran y pueden restablecerse; no basta cambiar discretamente un ícono. Los títulos se actualizan dinámicamente, por ejemplo «Casos activos por establecimiento — Prioridad alta — Año 2026», identificando el evento/corte que corresponda. Títulos y filtros relevantes se conservan al incorporar la visualización en un informe.

## 15.2 Indicadores principales

- Referencias a Atención Interdisciplinaria registradas/enviadas, analizadas, admitidas a A.I. y No requiere A.I., distinguiendo el evento y fecha correspondientes al corte.
- Casos por establecimiento, sexo, edad actual, prioridad Alto/Moderado/Bajo y estado Activo/Cerrado, dentro del ámbito autorizado y corte identificado, con filtro general Activo/Cerrado/Todos para visualizaciones compatibles. Este filtro no modifica los KPI de cobertura definidos sobre casos activos actuales.
- Clientes/beneficiarias únicos atendidos y total de atenciones realizadas, por tipo vigente y disciplina cuando aplique.
- Frecuencia de los motivos de referencia a Atención Interdisciplinaria.
- Principales motivos de cancelación de actividades programadas en el período.
- Casos activos sin atención en el período/año, independientemente de programación; última fecha de atención o Sin atención registrada para la consulta operativa autorizada.

Una referencia analizada puede concluir admitida o No requiere A.I. Los motivos de referencia son múltiples y no excluyentes; sus frecuencias pueden superar el total de referencias y no se suman como partición de ese total. No se incorporan indicadores propios de vigilancia, estado/recuperación nutricional ni resultados detallados EDIN II/EVADE. Los KPI de cobertura 11 y 12 se definen así: Definición operativa provisional vigente para el trabajo, pendiente únicamente de ratificación posterior con Alina: D es la cantidad de personas únicas con un caso A.I. activo actualmente, al momento de la consulta, dentro del ámbito autorizado y filtros pertinentes. N es la cantidad de personas de ese mismo D con al menos una atención efectiva durante el año seleccionado, vinculada a su caso actualmente activo. Porcentaje = (N / D) × 100; el KPI de cantidad muestra N personas únicas, no registros de atención. Se usa fecha real de atención; una grupal cuenta solo con participación efectiva/asistencia. Se excluyen programación sin ejecutar, asistencia no confirmada y atenciones pertenecientes únicamente a casos anteriores cerrados. El año delimita las atenciones; Activo se evalúa actualmente, sin convertirlo en activo histórico del año seleccionado. El filtro general Activo/Cerrado/Todos no cambia el denominador de este KPI: siempre usa casos activos actuales y debe indicarlo expresamente. Los filtros pertinentes y el ámbito efectivo se aplican consistentemente a N y D; los incompatibles no se aplican ni se presentan como aplicados. Con D = 0 se muestra Sin casos activos o No aplica sin dividir entre cero. Se identifican universo, año y corte/fecha de consulta; valores altos se ven progresivamente más verdes y bajos más rojos, con porcentaje numérico y sin umbrales institucionales de cumplimiento. Ejemplo: 25 niños con caso activo actualmente, de los cuales 10 recibieron atención efectiva en 2026 vinculada a su caso actual: 10 / 25 × 100 = 40 %; KPI porcentual 40 % y KPI de cantidad 10.

## 15.3 Visualizaciones iniciales

- 1\. Casos por establecimiento — gráfico de barras.
- 2\. Casos por sexo — gráfico de distribución.
- 3\. Casos por edad actual — distribución por edad, con agrupaciones analíticas adecuadas, sin inventar grupos etarios institucionales.
- 4\. Casos por prioridad — Alto, Moderado y Bajo.
- 5\. Casos por estado — Activo y Cerrado, con filtro general Activo/Cerrado/Todos.
- 6\. Principales motivos de cancelación de actividades programadas — tabla Top-N.
- 7\. Principales motivos de referencia a A.I. — nube de palabras; tamaño según frecuencia. Una referencia puede aportar varios motivos no excluyentes.
- 8\. Atenciones REALIZADAS por tipo — distribución por tipos institucionales vigentes; excluye actividades simplemente programadas, reprogramadas o canceladas.
- 9\. Motivos de cierre de casos A.I. — gráfico circular: Cierre satisfactorio, Traslado y Otro.
- 10\. Palabras más frecuentes en cierres con motivo Otro — nube de palabras basada en sus explicaciones textuales.
- 11\. Porcentaje de niños atendidos en el año seleccionado — KPI visual con escala progresiva rojo–verde y porcentaje numérico, conforme a la definición operativa provisional de 15.2 / RN-040.
- 12\. Cantidad de niños atendidos en el año seleccionado — KPI numérico de personas únicas; es el numerador del KPI porcentual de 15.2 / RN-040.

El catálogo principal contiene exactamente estas doce visualizaciones, con los formatos indicados; no amplía permisos. Las métricas válidas adicionales de 15.2 y la consulta de casos sin atención se conservan como capacidades complementarias y no agregan opciones al catálogo de doce del asistente. Se mantienen los catálogos institucionales y la diferencia entre personas únicas y total de atenciones: una persona atendida cinco veces equivale a una persona única y cinco atenciones; una grupal conserva un registro base y cuenta personas según asistencia efectiva. No se inventan tipos, grupos etarios institucionales ni umbrales de cumplimiento.

## 15.4 Consolidaciones

- Oficina Local puede consolidar su ámbito o un establecimiento.
- Regional puede consolidar su Región, una Oficina Local o un establecimiento.
- Nacional puede consolidar el país, una Región, una Oficina Local o un establecimiento.
- La consolidación utiliza los filtros vigentes y puede descargarse en formato compatible con Excel.
- No se requiere un proceso manual de remisión entre niveles para obtener estos cortes. Explorar información interactivamente y generar un informe analítico formal son actividades independientes. Las consolidaciones y su descarga tabular vigente se conservan; el informe guiado se especifica en HU-050, RF-130/RF-131 y CU-38, sin confundirse con HU-030/CU-22 ni imponer su formato final.

  **Generar reporte — informe analítico formal.** La parte superior de Reportería presenta un botón visible Generar reporte, que inicia un asistente guiado emergente, modal o equivalente.

  **Paso 1 — seleccionar visualizaciones.** Se muestra «Seleccione al menos 5 visualizaciones de las siguientes para incluir en su reporte» y las doce opciones de 15.3. Se permiten de cinco a doce; Siguiente permanece bloqueado con menos de cinco. Solo son seleccionables las autorizadas y realmente disponibles; las no disponibles no cuentan. Si no hay cinco seleccionables, no se puede continuar ni ampliar permisos para cumplir el mínimo.

  **Paso 2 — análisis humano obligatorio por visualización.** Se presentan las seleccionadas una por una, cada una con gráfico o KPI, título dinámico y filtros relevantes. Se muestra «Por favor, redacte su análisis asociado a la visualización mostrada» y un campo multilínea. Anterior/Siguiente permite revisar conservando textos; se bloquea avanzar con texto vacío o solo espacios. Se repite para todas las seleccionadas, sin generar automáticamente análisis como sustituto de la interpretación humana.

  **Paso 3 — título e identificación institucional.** Se solicita un título obligatorio y se obtienen automáticamente fecha/hora de generación, identidad responsable, rol y ámbito institucional, establecimiento, Oficina Local, Región o Nivel Nacional correspondiente, período y filtros. No se redigitan datos disponibles de la sesión. Se permite revisar el contenido completo antes de confirmar.

  **Paso 4 — descarga.** Se genera un documento con título, fecha/hora, responsable, área/ámbito, período y filtros, seguido de cada visualización seleccionada con su título y filtros relevantes y, directamente asociado, su análisis, en el orden revisado. Se conserva trazabilidad de contexto, filtros, corte y datos utilizados. Cuando sea técnicamente viable, se preserva una instantánea histórica reproducible para mantener el significado del informe ante actualizaciones futuras. Formato de descarga pendiente de confirmación; PDF es una posibilidad, no obligatorio. No se incorporan aprobaciones, remisiones obligatorias ni periodicidad semestral/anual.

---

---

# 16. Integraciones y captura alternativa

| Elemento | Situación actual |
| --- | --- |
| **SIDINACC/CAH** | La interoperabilidad y reutilización de datos maestros son una necesidad del diseño; el mecanismo técnico definitivo depende del acceso y arquitectura institucional disponibles. |
| **Vigilancia / tamizajes** | Se reutilizarán resultados disponibles de fuentes institucionales autorizadas para detectar posibles referencias pendientes conforme a RF-127/HU-049/CU-37. No se recapturarán variables, recalcularán EDIN II/EVADE ni abrirán casos automáticamente. UTIC definirá el mecanismo y las fuentes/campos efectivos, sin fijar periodicidad técnica. La sección independiente Posibles referencias y su experiencia funcional están validadas para personal autorizado de Establecimiento y Oficina Local; ello no acredita una integración productiva. La detección automática depende de fuentes autorizadas y coordinación con UTIC. |
| **Plantilla Excel estandarizada** | Capacidad incorporada en el diseño para descargar, completar, cargar, revisar y confirmar referencias bajo las mismas reglas de la captura manual. |
| **Migración histórica** | Se contempla un proceso controlado de validación, mapeo, detección de duplicados, importación y registro de errores. |
| **SINIRUBE** | Dependencia existente en el ecosistema institucional; el alcance directo de integración con SIA-CENCINAI debe definirse técnicamente. |
| **SNOMED CT** | Se utiliza únicamente como referencia/exploración terminológica; no constituye una integración formal del alcance actual. |
| **OCR** | Fuera del alcance funcional consolidado actual. |
| **Modo offline avanzado / sincronización** | Fuera del alcance funcional consolidado actual. |

---

---

# 17. Preguntas abiertas y decisiones pendientes

## 17.1 Traslado — decisiones resueltas

- Resuelto por validación con Alina del 2 de noviembre de 2026: el cambio de establecimiento cierra el caso activo de origen con motivo Traslado. Se retiran los pendientes sobre nombre de estado o acción de continuidad en destino.
- No se genera ingreso pendiente ni caso automático; que la persona o familia llegue al destino no activa continuidad. Una nueva referencia solo se inicia por el flujo normal cuando CAH/SIDINACC la asocia al nuevo establecimiento.
- No aplica plazo de permanencia de un ingreso pendiente de continuidad: dicho ingreso y estado se retiran del alcance vigente.
- La recepción del expediente físico no crea ni confirma un caso. El historial de origen se conserva según permisos; no se exige vínculo entre el caso anterior y uno nuevo.

## 17.2 Vigilancia → A.I.

- Definición con UTIC del mecanismo institucional de detección e intercambio, fuentes y campos realmente disponibles, sin periodicidad técnica impuesta.
- Formalización de criterios vigentes de equivalencia y resolución de pendientes para evitar duplicados, incluidos los resultados institucionales que ameriten referencia.
- Resuelto funcionalmente: personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local accede a Posibles referencias como sección independiente, con paginación, búsqueda por identificación/nombre y filtros por establecimiento, fecha de detección y criterio/categoría. Se mantienen ámbito, permisos y revisión humana; la detección automática sigue dependiendo de integración autorizada coordinada con UTIC.

La necesidad funcional de detección de posibles referencias pendientes queda cubierta en RF-127; no implica recaptura de vigilancia ni apertura automática de casos. La experiencia funcional de la sección está validada; quedan pendientes la integración de detección automática y la formalización de criterios de equivalencia. Debe evitar duplicados y confirmar solo una operación válida concurrente desde la misma sugerencia.

## 17.3 Reportes

- Informe analítico formal: el flujo, selección mínima de cinco entre doce, análisis humano por visualización, título, metadatos, revisión y trazabilidad están definidos por HU-050/RF-130/RF-131/CU-38; no son decisiones abiertas. Pendiente: formato definitivo de descarga; PDF es una posibilidad, no una obligación.
- Pendiente únicamente de ratificación posterior con Alina: fórmula operativa de cobertura de RN-040 / RF-129, vigente provisionalmente para el trabajo (casos activos actuales y atenciones efectivas del año vinculadas al caso actual). Pendiente de validación institucional: visualizaciones y KPI exactos de Reportería permitidos para Establecimiento, manteniendo restricciones vigentes.
- Se conservan por definir los tipos y plantillas definitivos del reporte individual de caso HU-030/CU-22, separados del informe analítico. No se incorporan al informe analítico aprobaciones, remisiones obligatorias ni periodicidad semestral/anual.

## 17.4 Seguridad

- Información individual exacta que Regional y Nacional podrán consultar en producción.
- Tipos de documentos o datos que requieren permisos reforzados.
- Reglas institucionales aplicables a exportaciones sensibles o anonimizadas. Pendiente de confirmación: rótulo visual definitivo de ASC2 / ASC3, sin diferencias de permisos inventadas. Pendiente de revisión: exportaciones masivas de personas dependientes exclusivamente de la pantalla general Personas/Clientes retirada (RF-020), sin pantalla sustituta.

## 17.5 Programación

- Datos obligatorios particulares para cada tipo vigente de actividad programada.
- Vista alternativa lista/calendario como P2, mejora futura exploratoria, sin considerarla funcionalidad esencial inmediata.

El catálogo actual se rige por RF-075: Sesión interdisciplinaria comprende el trabajo del equipo y se utiliza Visita a establecimiento para Atención Interdisciplinaria, conservando los demás tipos vigentes no cuestionados. Los catálogos institucionales sujetos a formalización conservan ese pendiente, con configuración/versionamiento cuando corresponda.

## 17.6 Plantilla Excel

- Estructura final de la plantilla.
- Una referencia por archivo versus múltiples referencias.
- Estrategia de versionamiento y compatibilidad de plantillas.

## 17.7 Arquitectura e integraciones

- Mecanismo definitivo de consulta de datos maestros desde SIDINACC/CAH.
- Identificadores institucionales que se utilizarán como referencias estables. Incluye la llave institucional definitiva de persona para identidad única y conciliación; no se fija aquí una decisión técnica.
- Alcance real de integraciones con servicios institucionales existentes.

---

## 17.8 Atención grupal y sesiones educativas

Permanece por definir institucionalmente la delimitación según el objetivo entre atención grupal A.I., sesión educativa, actividad educativa general y apoyo de profesionales de Oficina Local a sesiones educativas. Las sesiones educativas generales no se incorporan automáticamente como atención A.I.; se conserva la funcionalidad vigente compatible sin cerrar nuevas clasificaciones o flujos. Permanece pendiente la clasificación final de los tipos de atención y la formalización de los catálogos institucionales aún no aprobados/formalizados; se usan los vigentes, sin inventar categorías ni grupos etarios institucionales.

## 17.9 Asistente conversacional y mejoras futuras

La conservación del chat al cambiar de pantalla y la opción Borrar chat permanecen exploratorias y por definir, sin requerimiento P0/P1. El asistente conversacional mantiene su clasificación P2 y consulta exclusiva de datos autorizados. No se incorpora un asistente para grabación, transcripción o generación de minutas; la documentación propia de sesiones y minutas permanece conforme al procedimiento vigente.

**Sugerencia orientativa de Nivel de riesgo y Nivel de protección — EXPLORATORIO / REQUIERE INVESTIGACIÓN Y VALIDACIÓN INSTITUCIONAL (NEEDS\_VALIDATION).** En la Sesión de validación funcional del prototipo —  se planteó explorar que, después de seleccionar los Factores de la Valoración situacional, pudiera mostrarse una sugerencia orientativa de ambos niveles. La persona profesional conservaría control completo del selector y podría aceptar, modificar o ignorar la sugerencia. No es una funcionalidad confirmada, RF obligatorio ni criterio de aceptación exigible. La decisión final sigue siendo profesional según [P-04](#), incluidos riesgo, protección, ingreso, abordaje y cierre.

Requiere investigación adicional porque los Factores pueden ser altamente subjetivos o contextuales; una alternativa de ponderación exigiría definir y justificar pesos; una alternativa basada en IA/agentes introduciría exigencias de explicabilidad, sesgos, reproducibilidad, gobernanza, seguridad y responsabilidad profesional. No existe todavía evidencia institucional confirmada para establecer un mecanismo. No se define fórmula ni pesos ni se selecciona IA, agente o LLM como solución.

La evaluación de esta funcionalidad exploratoria requiere sustento mediante revisión de literatura/documentación sobre modelos de valoración de riesgo y protección, instrumentos de apoyo a decisiones profesionales, ponderación de factores, decision support, explicabilidad, sesgos, uso responsable de IA en apoyo a decisiones profesionales y experiencias comparables sociales, de salud o interdisciplinarias. Ese sustento y la validación institucional son necesarios para decidir si se incorpora la capacidad. Relación conceptual: HU-020 / P-04; sin nuevo HU/RF/RN/CU ni compromiso de implementación.

La eventual sugerencia de niveles es distinta del cálculo vigente de Prioridad A.I.: este último aplica RN-009 después de que el equipo profesional ha definido Nivel de riesgo y Nivel de protección. La matriz de prioridad permanece intacta.

---

---

# 18. Priorización revisada

## P0 — Núcleo

- Control de acceso por rol y ámbito.
- Búsqueda por identificación o nombre.
- Consulta de clientes/beneficiarias según nivel.
- Referencias manuales.
- Disponibilidad inmediata de referencias enviadas digitalmente y revisión en Oficina Local.
- Sesiones interdisciplinarias.
- Valoración situacional.
- Resolución sobre requerimiento de A.I.
- Definición de abordaje y apertura de casos.
- Consulta y gestión de casos en Oficina Local.
- Lista simplificada de A.I. en Establecimiento.
- Atenciones individuales.
- Atenciones grupales.
- Línea de tiempo longitudinal.
- Generación de reportes independiente del cierre.
- Cierre de casos.
- Programación operativa en Oficina Local.
- Reportería básica. Catálogo principal de doce visualizaciones según RF-128 y ámbitos autorizados, manteniendo la definición operativa provisional del KPI de RF-129/RN-040 y sus pendientes.
- Trazabilidad, integridad histórica y auditoría.
- Recuperabilidad de capturas extensas.

## P1 — Segunda capa

- Impresión de referencias.
- Carga de referencias mediante Excel estandarizado.
- Documentos asociados.
- Coordinaciones interinstitucionales.
- Cierre por Traslado al cambiar de establecimiento, con historial conservado y eventual nueva referencia independiente en destino.
- Exportación de listados y consolidaciones.
- Consulta Regional y Nacional de programación.
- Reporterías jerárquicas.
- Consolidaciones dinámicas.
- Configuración de catálogos y versionamiento.
- Migración histórica.
- Interoperabilidad con fuentes institucionales.
- Identificación de casos activos sin atención en un período y consulta de última atención (RF-125 y RF-126).
- Detección de posibles referencias pendientes desde fuentes institucionales autorizadas, dependiente de integración (RF-127). La experiencia funcional de Posibles referencias está validada, pero su detección automática no se presume implementada.
- P1 — Informe analítico guiado de HU-050 / CU-38: cinco a doce visualizaciones autorizadas, análisis humano obligatorio y contexto trazable; formato pendiente y sin ampliación automática de permisos de Establecimiento.

## Evolución futura / fuera del compromiso funcional actual

- Automatización de decisiones profesionales o apertura de casos desde vigilancia/tamizaje, fuera del alcance actual.
- Exportaciones anonimizadas sujetas a gobernanza.
- OCR.
- Modo offline avanzado con sincronización.
- Integración formal con SNOMED CT.
- Analítica longitudinal avanzada.
- P2 — Asistente conversacional de solo lectura, vista lista/calendario e historial o borrado del chat, exploratorios según sus definiciones vigentes.

---

---

# 19. Fuentes de descubrimiento

| Fuente | Aporte principal |
| --- | --- |
| **PRO-D-AI-P-01 — borrador 2026** | Modelo objetivo del proceso de Atención Interdisciplinaria. |
| **Instrumentos operativos de A.I.** | Variables, campos y necesidades de registro. |
| **Reuniones y validaciones funcionales de septiembre y octubre de 2026** | Ajustes de roles, acceso, referencias, valoración, programación, traslados, reportería y simplificación de flujos. |
| **Prototipo navegable SIA-CENCINAI** | Validación de navegación, permisos, jerarquía, filtros y alcance funcional por rol. |
| **Documentación técnica de SIDINACC/CAH** | Referencia para datos maestros, jerarquía institucional e integración futura. |
| **SNOMED CT en español** | Referencia terminológica exploratoria; no implica integración formal. |
| **Sesión de validación funcional del prototipo — ** | Presentación colapsable de Factores; sustitución de controles tipo chips como entrada de selección múltiple, con Disciplinas como caso explícito; respuesta obligatoria por categoría requerida y Ninguno excluyente; exploración de sugerencia de riesgo/protección.Trazabilidad: HU-019 → RF-038/RF-120 → CU-07; HU-020 → RF-042/RF-043 → RN-008 → CU-08; UX: RNF-009/RNF-021. Impacto esperado en prototipo: selector múltiple, categorías colapsables, persistencia de selecciones y validaciones. Esta actualización es documental y no certifica su implementación. Funcionalidad exploratoria y sustento necesario para su evaluación: 17.9. |
| **Sesión de validación funcional con Alina — ** | Acuerdos de traslado sin continuidad automática, unicidad global de caso activo, revaloraciones históricas, búsqueda contextual sin pantalla general Personas/Clientes, nomenclatura ASC2 / ASC3, Posibles referencias independiente, Inicio y cierre estructurado; catálogo de doce visualizaciones, filtros/títulos dinámicos e informe analítico guiado con interpretación humana. KPI de cobertura operativo provisional sujeto a ratificación posterior con Alina; formato del informe, permisos específicos de Reportería de Establecimiento e integración autorizada/UTIC pendientes. Actualización documental v0.7 en dos partes; no certifica implementación ni aprobaciones formales. |

---

---

# 20. Registro de cambios

| Versión | Fecha | Cambio |
| --- | --- | --- |
| **0.1** | 09-09-2026 | Primera versión de consolidación funcional. |
| **0.2** | 15-09-2026 | Ampliación de atenciones grupales, reportería, trazabilidad y líneas exploratorias de continuidad operativa. |
| **0.3** | 16-09-2026 | Refinamiento post-validación: eliminación de Control de Calidad Regional, incorporación del rol Establecimiento, acceso jerárquico, búsqueda en lugar de selectores masivos, valoración simplificada, separación Reportes/Cierre, Programación, traslado refinado, reportería filtrable, consolidación dinámica, exportación Excel y carga de referencias desde plantilla. |
| **0.4** | 25-09-2026 | Consolidación integral y limpieza documental: 46 historias de usuario uniformes, 103 requerimientos funcionales especificados por actor, 34 casos de uso con estructura completa, 22 requerimientos no funcionales detallados, actualización de reglas de negocio, trazabilidad RF↔CU. |
| 0.5 | 29-10-2026 | Actualización de requerimientos funcionales, historias de usuario, casos de uso, reglas de negocio y trazabilidad posterior a las dos validaciones funcionales recientes del prototipo. Consolidación de roles y permisos, referencia digital, valoración y prioridad, programación, seguimiento y reportería; incorporación de casos sin atención y detección de posibles referencias pendientes mediante integración institucional. |
| 0.6 |  | Incorporación de hallazgos de una nueva sesión de validación funcional del prototipo: Factores colapsables, Disciplinas mediante selector múltiple y respuesta explícita por categoría requerida con Ninguno mutuamente excluyente. Actualización de HU-019/HU-020, RF-038/RF-042/RF-043/RF-120, RN-008, CU-07/CU-08 y RNF-009/RNF-021; refuerzo de P-04. Sugerencia de riesgo/protección y sustento necesario para su evaluación registrados como exploratorios en 17.9. Se conservan las decisiones anteriores y los diagramas. |
| **0.7** |  | Consolidación de las dos partes de la validación funcional con Alina del 02/11/2026: cierre por Traslado sin continuidad automática; HU-029, RF-062/RF-063 y CU-21 retirados con identificadores y diagrama conservados; un solo caso A.I. activo por persona entre ámbitos, control en referencia y revalidación concurrente de apertura; revaloraciones sucesivas con prioridades históricas; búsqueda contextual sin pantalla general Personas/Clientes; ASC2 / ASC3 equivalentes autorizados; Posibles referencias como sección independiente con prevención de duplicados y concurrencia, detección dependiente de integración/UTIC; Inicio refinado y cierre satisfactorio/Traslado/Otro explicado. Reportería por ámbito con doce visualizaciones, filtros visibles/dependientes/restablecibles, títulos dinámicos y KPI de cobertura según casos activos actuales y atenciones efectivas del año, provisional y pendiente de ratificación con Alina. Nuevo informe analítico guiado: cinco a doce visualizaciones con análisis humano obligatorio, metadatos y trazabilidad; formato pendiente. Se añaden HU-050, RF-128 a RF-131, CU-38 y RN-040/RN-041; se actualizan trazabilidad, modelo conceptual textual y RNF afectados. Se preservan los diagramas y recursos, RN-009, sección 17.9, historial y reglas de mantenimiento; no certifica implementación. |

---

---

# 21. Regla de mantenimiento

Cada cambio futuro deberá registrar, cuando corresponda:

1. Fuente de la necesidad.
2. Descripción de la necesidad.
3. Actor o actores involucrados.
4. Historia de usuario afectada o nueva.
5. Requerimiento funcional afectado o nuevo.
6. Caso de uso afectado o nuevo.
7. Regla de negocio relacionada.
8. Nivel de certeza o validación.
9. Impacto en el prototipo.
10. Decisión final una vez validada.
