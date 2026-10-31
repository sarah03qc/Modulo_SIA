# SIA-CENCINAI — Historias de Usuario y Requerimientos

**Versión:** 0.6  
**Fecha:** 30 de octubre de 2026  
**Estado:** Descubrimiento / refinamiento funcional / validación mediante prototipo  
**Producto:** Sistema de apoyo a la Atención Interdisciplinaria (SIA-CENCINAI)

> [!IMPORTANT]
> Documento funcional separado de la especificación consolidada v0.6. Contiene el contexto funcional necesario, las Historias de Usuario y los Requerimientos Funcionales vigentes. No contiene Casos de Uso, matriz de trazabilidad, modelo conceptual de datos, reglas de negocio, RNF, reportería ni otras secciones auxiliares.

---

# 1. Objetivo del documento

Consolidar el contexto funcional vigente necesario para interpretar e implementar las **Historias de Usuario (HU)** y los **Requerimientos Funcionales (RF)** de SIA-CENCINAI.

Este documento incluye:

1. Alcance funcional vigente.
2. Actores y alcance de acceso.
3. Modelo jerárquico de consulta y operación.
4. Principios de diseño.
5. Épicas.
6. Historias de Usuario.
7. Requerimientos Funcionales.

Los Casos de Uso se mantienen en un documento separado (`USE_CASES.md`). La matriz de trazabilidad y las demás especificaciones auxiliares se mantienen fuera de este archivo.

La trazabilidad conceptual continúa siendo:

**Proceso institucional → flujograma → instrumentos/variables → historias de usuario → requerimientos → casos de uso → prototipo → implementación.**

---

# 2. Cambios de alcance consolidados

Esta versión consolida las decisiones funcionales del proceso, la documentación disponible y las dos validaciones funcionales recientes del prototipo. La versión 0.6 incorpora hallazgos de una nueva Sesión de validación funcional del prototipo — : presentación colapsable de Factores, selección múltiple estructurada y respuesta explícita en categorías requeridas. La posible sugerencia de Nivel de riesgo y Nivel de protección permanece exploratoria en 17.9.

## 2.1 Simplificaciones adoptadas

- Se elimina del alcance actual el módulo independiente de **Control de Calidad Regional**.
- Se elimina el flujo artificial de **Regional valida → devuelve → Oficina Local corrige → reenvía**.
- La reportería se concibe como una capa de consulta y analítica sobre los datos operativos, no como un proceso paralelo de aprobación.
- Se eliminan de la valoración situacional los campos obligatorios de **intensidad, frecuencia y persistencia**.
- Se sustituyen selectores masivos de personas y casos por búsqueda mediante **identificación o nombre**.
- La gestión operativa se concentra en **Oficina Local**; Regional y Nacional disponen principalmente de consulta y analítica.
- **Reportes** y **Cierre** se mantienen como acciones independientes.
- La continuidad por traslado se separa del cierre del caso de origen.
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
- Traslado entre Oficinas Locales con cierre en origen y confirmación de continuidad en destino.
- Diferenciación entre **personas únicas atendidas** y **cantidad total de atenciones**.
- Reporterías con filtros temporales, territoriales y funcionales.

---

# 3. Alcance funcional actual

SIA-CENCINAI deberá apoyar el proceso de Atención Interdisciplinaria desde la referencia y análisis interdisciplinario hasta el seguimiento, traslado, reportería y cierre del caso, procurando reducir redigitación y reutilizar información institucional existente.

## 3.1 Incluido en el alcance funcional consolidado

- Búsqueda e identificación de clientes/beneficiarias.
- Consulta de información según rol y ámbito institucional.
- Creación, envío digital, consulta e impresión de referencias a Atención Interdisciplinaria.
- Carga de referencias desde plantilla Excel estandarizada.
- Sesiones interdisciplinarias.
- Valoración situacional por ámbitos.
- Resolución de si un caso requiere A.I.
- Priorización y definición del abordaje inicial.
- Apertura y gestión del caso A.I.
- Línea de tiempo longitudinal.
- Plan de atención.
- Atenciones individuales.
- Atenciones grupales con múltiples participantes.
- Documentos asociados al caso.
- Coordinaciones interinstitucionales.
- Traslado entre Oficinas Locales.
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

- Sustituir SIDINACC/CAH o Infoservicios, o mantener registros paralelos de vigilancia, nutrición, EDIN II o EVADE.
- Rediseñar la selección de hogares o modalidades institucionales.
- Automatizar decisiones profesionales de ingreso, valoración de riesgo/protección o cierre.
- Implementar un flujo de aprobación Regional de los registros de Oficina Local.
- Adoptar SNOMED CT como integración formal.
- Implementar OCR como dependencia del producto.
- Implementar un modo offline avanzado con sincronización como dependencia del producto.
- Capturar nuevamente vigilancia, nutrición, EDIN II o EVADE, recalcular sus resultados o abrir automáticamente casos A.I. a partir de hallazgos institucionales.
- Exportaciones anonimizadas sin una política institucional de gobernanza previamente definida.

---

# 4. Actores y alcance de acceso

| Código | Actor | Alcance principal |
| --- | --- | --- |
| **ACT-01** | Profesional del establecimiento / Asistente 2 / Asistente 3 | Crear y consultar referencias de sus establecimientos autorizados; consultar clientes/beneficiarias de su ámbito y una Lista de A.I. simplificada con estado y prioridad A.I., y filtrar por prioridad. Asistente 2 y Asistente 3 comparten las mismas capacidades autorizadas para Establecimiento. |
| **ACT-02** | Profesional del EE.II. de Oficina Local | Gestionar referencias, sesiones, casos, atenciones, documentos, coordinaciones, traslados, reportes, cierre, programación y reportería dentro de su Oficina Local. |
| **ACT-03** | Equipo Interdisciplinario de Oficina Local | Analizar casos, registrar valoración situacional y niveles profesionales de riesgo y protección, decidir si requieren A.I., consultar la prioridad calculada y definir el abordaje inicial. |
| **ACT-04** | Jefatura / Nivel Local | Consultar y acompañar la operación del ámbito local de acuerdo con los permisos definidos para Oficina Local. |
| **ACT-05** | ATE / Dirección Regional | Consultar clientes/beneficiarias, casos, programación y reportería de su Región; realizar seguimiento técnico sin modificar la gestión operativa de Oficina Local. |
| **ACT-06** | UIVCD / UNAT / Nivel Nacional | Consultar información nacional y desagregarla por Región, Oficina Local y establecimiento; acceder a programación, reportería y consolidaciones en modo de consulta. |
| **ACT-07** | Administrador funcional/técnico autorizado | Gestionar catálogos, versiones y configuraciones autorizadas. |
| **ACT-08** | Persona usuaria / familia | Fuente o receptora de información; no dispone de acceso directo al módulo de A.I. en el alcance actual. |
| **ACT-09** | Equipo de implementación / soporte | Ejecutar migraciones, configuraciones e integraciones técnicas autorizadas. |

---

# 5. Modelo jerárquico de acceso

```
Nivel Nacional
└── Región
    └── Oficina Local
        └── Establecimiento
```

## 5.1 Establecimiento

El profesional, Asistente 2 y Asistente 3 comparten las mismas capacidades autorizadas de Atención Interdisciplinaria para este nivel.

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

La Oficina Local de origen cierra por traslado; la Oficina Local destino confirma posteriormente la continuidad cuando corresponda.

### P-17 — Filtros jerárquicos consistentes

Región, Oficina Local y establecimiento deben mantener relaciones válidas; al cambiar un nivel superior, los filtros inferiores incompatibles se actualizan o se limpian.

### P-18 — Personas únicas y atenciones son métricas distintas

Una misma persona se contabiliza una sola vez como persona atendida dentro de un corte, aunque pueda tener múltiples atenciones.

---

# 7. Épicas

Se conservan los identificadores históricos utilizados por las historias de usuario para mantener trazabilidad.

| Épica | Nombre | Objetivo |
| --- | --- | --- |
| **EP-01** | Identidad y expediente lógico | Buscar, consultar y reutilizar información de clientes/beneficiarias según rol y ámbito. |
| **EP-02** | Detección y referencia | Crear, enviar digitalmente, consultar e imprimir referencias a Atención Interdisciplinaria. |
| **EP-03** | Sesión y valoración interdisciplinaria | Organizar sesiones, valorar casos, resolver ingreso y definir el abordaje inicial. |
| **EP-04** | Gestión del caso A.I. | Consultar y gestionar casos, documentos, coordinaciones, traslados, reportes y cierre. |
| **EP-05** | Atenciones y seguimiento | Registrar atenciones individuales y grupales y mantener su trazabilidad longitudinal. |
| **EP-08** | Reportería y analítica | Consultar, filtrar, visualizar, consolidar y exportar información. |
| **EP-14** | Programación | Planificar actividades en Oficina Local y permitir su consulta en niveles superiores. |

---

# 8. Historias de usuario

## EP-01 — Identidad y expediente lógico

### HU-001 — Consultar resumen operativo del establecimiento

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi establecimiento, **para** identificar rápidamente las referencias y clientes/beneficiarias relacionados con A.I. que requieren mi atención o consulta.

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

Dado que el usuario es profesional, Asistente 2 o Asistente 3 autorizado, cuando accede desde el resumen a la Lista de A.I., entonces debe poder consultar estado y prioridad A.I. y filtrar por prioridad sin acceder al detalle interno.

---

### HU-002 — Consultar el resumen operativo de la Oficina Local

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional autorizado de Oficina Local, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi Oficina Local, **para** identificar rápidamente referencias, casos, sesiones, traslados y actividades que requieren atención.

#### Criterios de aceptación

##### CA-01 — Restringir información al ámbito

**Dado** que el usuario pertenece a una Oficina Local, **cuando** ingresa al sistema, **entonces** el resumen debe mostrar únicamente información correspondiente a esa Oficina Local y sus establecimientos.

##### CA-02 — Mostrar referencias pendientes

**Dado** que existen referencias pendientes de gestión, **cuando** el usuario consulta Inicio, **entonces** debe visualizar su cantidad y poder acceder a ellas.

##### CA-03 — Mostrar casos activos

**Dado** que existen casos activos, **cuando** se muestra el resumen, **entonces** debe visualizarse su cantidad y permitir navegar al listado correspondiente.

##### CA-04 — Mostrar sesiones próximas

**Dado** que existen sesiones interdisciplinarias programadas, **cuando** el usuario consulta el resumen, **entonces** debe visualizar las próximas sesiones y poder acceder a su gestión.

##### CA-05 — Mostrar traslados pendientes

**Dado** que existen ingresos por traslado destinados a la Oficina Local, **cuando** todavía no se ha confirmado su continuidad, **entonces** deben mostrarse como pendientes de atención.

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

**Como** profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento, **quiero** buscar clientes/beneficiarias principalmente por identificación y secundariamente por nombre dentro de mis establecimientos autorizados, **para** localizar rápidamente a la persona correcta sin acceder a información fuera de mi ámbito.

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

##### CA-06 — Exportar listado

**Dado** que existe un listado visible, **cuando** se selecciona exportar, **entonces** el archivo debe contener únicamente los registros del corte actual.

##### CA-07 — Estructurar exportación

**Dado** que se genera una exportación tabular, **cuando** se abre en una herramienta compatible, **entonces** los atributos deben organizarse en encabezados y columnas diferenciadas.

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

##### CA-08 — Exportar listado

**Dado** que existe un conjunto visible, **cuando** se exporta, **entonces** el archivo debe respetar ámbito y filtros.

##### CA-09 — Estructurar exportación

**Dado** que se genera la exportación, **cuando** se abre externamente, **entonces** sus atributos deben encontrarse distribuidos en columnas claramente identificadas.

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

##### CA-03 — Consultar todo el país

**Dado** que no existen filtros territoriales, **cuando** se consulta el listado, **entonces** debe utilizarse el ámbito nacional permitido.

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

##### CA-09 — Exportar resultados

**Dado** que existe un conjunto visible, **cuando** se exporta, **entonces** debe respetar búsqueda, filtros y permisos.

##### CA-10 — Estructurar exportación

**Dado** que se genera una salida tabular, **cuando** se utiliza externamente, **entonces** debe contener encabezados y columnas diferenciadas.

---

### HU-009 — Consultar información básica de un cliente/beneficiaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento, **quiero** consultar la información básica y el estado general de A.I. de un cliente/beneficiaria de mi ámbito, **para** identificarlo correctamente sin acceder a información restringida del caso.

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

**Dado** que el usuario posee autorización de nivel Establecimiento como profesional, Asistente 2 o Asistente 3, o autorización operativa de Oficina Local, **cuando** inicia una referencia, **entonces** debe poder crearla dentro de su ámbito.

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

---

### HU-015 — Consultar las referencias del establecimiento

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento, **quiero** consultar las referencias correspondientes a mis establecimientos autorizados, **para** conocer cuáles han sido registradas y revisar su estado e información principal.

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
**Estado:** NECESIDAD CONFIRMADA / DISTRIBUCIÓN OPERATIVA E INTEGRACIÓN PENDIENTES

#### Historia de Usuario

**Como** personal autorizado según el ámbito y la distribución operativa definida institucionalmente, **quiero** consultar situaciones institucionales que cumplen criterios de referencia A.I. y carecen de gestión equivalente en SIA, **para** revisar e iniciar la gestión correspondiente sin duplicar la información fuente.

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

---

## EP-04 — Gestión del caso A.I.

### HU-023 — Consultar una lista simplificada de Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

**Como** profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento, **quiero** consultar una lista simplificada de los clientes/beneficiarias de mis establecimientos que poseen o han poseído un caso A.I., **para** conocer su vinculación general sin acceder al expediente interno de Oficina Local.

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

Dado que el usuario es profesional, Asistente 2 o Asistente 3 autorizado de Establecimiento, cuando consulta la lista, entonces debe visualizar la prioridad A.I. y poder filtrar por ella sin acceder a nivel de riesgo, nivel de protección ni valoración interna.

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

##### CA-03 — Riesgo, protección y prioridad

**Dado** que la apertura se sustentó en una valoración, **cuando** se consulta el resumen, **entonces** deben poder visualizarse nivel de riesgo, nivel de protección y prioridad resultante.

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
**Estado:** CONFIRMADO CON DETALLES PENDIENTES

#### Historia de Usuario

**Como** profesional autorizado de la Oficina Local de origen, **quiero** registrar el traslado de un caso hacia otra Oficina Local, **para** finalizar la responsabilidad de mi unidad sin perder la continuidad histórica de la Atención Interdisciplinaria.

#### Criterios de aceptación

##### CA-01 — Datos de destino

**Dado** que se traslada un caso, **cuando** se registra, **entonces** deben indicarse Oficina Local destino, establecimiento destino y Región.

##### CA-02 — Fecha y motivo

**Dado** que el traslado debe quedar documentado, **cuando** se confirma, **entonces** deben registrarse fecha y motivo.

##### CA-03 — Cierre por traslado

**Dado** que la OL de origen deja de ser responsable, **cuando** confirma el traslado, **entonces** su caso debe cerrarse por traslado.

##### CA-04 — Conservar historial

**Dado** que la necesidad puede continuar, **cuando** se traslada el caso, **entonces** no debe perderse el historial previo.

##### CA-05 — Conservar trazabilidad de origen

**Dado** que el caso deriva de una referencia y trayectoria previa, **cuando** se traslada, **entonces** deben preservarse sus relaciones históricas y el consecutivo de referencia de origen.

##### CA-06 — Generar ingreso en destino

**Dado** que el traslado fue registrado, **cuando** se confirma, **entonces** la OL destino debe disponer de un ingreso pendiente de continuidad.

---

### HU-029 — Confirmar la continuidad de un caso recibido por traslado

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** NECESIDAD CONFIRMADA / DETALLE PENDIENTE

#### Historia de Usuario

**Como** profesional autorizado de la Oficina Local de destino, **quiero** consultar un ingreso por traslado y confirmar si la atención continuará en mi Oficina Local, **para** asumir formalmente la gestión cuando corresponda.

#### Criterios de aceptación

##### CA-01 — Mostrar ingreso pendiente

**Dado** que otra OL registró un traslado hacia mi ámbito, **cuando** consulto pendientes, **entonces** debe aparecer como ingreso por traslado.

##### CA-02 — Mostrar origen

**Dado** que proviene de otra Oficina Local, **cuando** se consulta, **entonces** deben identificarse origen y destino.

##### CA-03 — Confirmar continuidad

**Dado** que se verificó la continuidad, **cuando** el usuario la confirma, **entonces** debe generarse un caso activo en la nueva Oficina Local.

##### CA-04 — Conservar historia previa

**Dado** que existe información de origen, **cuando** se activa la continuidad, **entonces** debe mantenerse accesible según permisos.

##### CA-05 — No modificar retroactivamente el caso anterior

**Dado** que el caso de origen fue cerrado por traslado, **cuando** se confirma la continuidad, **entonces** debe generarse la responsabilidad del nuevo ámbito sin reabrir ni alterar retroactivamente el caso anterior.

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

##### CA-01 — Registrar motivo

**Dado** que se decide cerrar un caso, **cuando** se confirma, **entonces** debe registrarse el motivo.

##### CA-02 — Registrar fecha

**Dado** que el cierre forma parte del historial, **cuando** se ejecuta, **entonces** debe conservarse la fecha.

##### CA-03 — Cambiar estado

**Dado** que el cierre fue confirmado, **cuando** finaliza la operación, **entonces** el caso debe quedar Cerrado.

##### CA-04 — Registrar evento

**Dado** que el caso fue cerrado, **cuando** se consulta su línea de tiempo, **entonces** debe aparecer el evento correspondiente.

##### CA-05 — No confundir con reporte

**Dado** que Reporte y Cierre son acciones independientes, **cuando** se cierra un caso, **entonces** no debe asumirse que generar un reporte sea requisito para hacerlo salvo decisión institucional posterior.

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

##### CA-12 — Casos activos por establecimiento, sexo y edad

Dado que se consulta el ámbito autorizado, cuando se analizan casos activos, entonces debe poder desagregarse por establecimiento, sexo y edad con filtros, rangos configurables o agrupaciones analíticas, sin imponer grupos etarios únicos.

##### CA-13 — Atenciones por tipo vigente

Dado que existen atenciones en el período, cuando se analizan por tipo del proceso vigente, entonces deben mostrarse total, distribución y clientes/beneficiarias únicos atendidos por tipo cuando aplique, sin inventar categorías.

##### CA-14 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-15 — Motivos de cancelación

Dado que se conservan actividades Canceladas y sus motivos, cuando se analiza un período, entonces debe poder identificarse los principales motivos de cancelación sin imponer una visualización concreta.

##### CA-16 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-17 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

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

##### CA-17 — Casos activos por establecimiento, sexo y edad

Dado que se consulta el ámbito autorizado, cuando se analizan casos activos, entonces debe poder desagregarse por establecimiento, sexo y edad con filtros, rangos configurables o agrupaciones analíticas, sin imponer grupos etarios únicos.

##### CA-18 — Atenciones por tipo vigente

Dado que existen atenciones en el período, cuando se analizan por tipo del proceso vigente, entonces deben mostrarse total, distribución y clientes/beneficiarias únicos atendidos por tipo cuando aplique, sin inventar categorías.

##### CA-19 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-20 — Motivos de cancelación

Dado que se conservan actividades Canceladas y sus motivos, cuando se analiza un período, entonces debe poder identificarse los principales motivos de cancelación sin imponer una visualización concreta.

##### CA-21 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-22 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

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

##### CA-21 — Casos activos por establecimiento, sexo y edad

Dado que se consulta el ámbito autorizado, cuando se analizan casos activos, entonces debe poder desagregarse por establecimiento, sexo y edad con filtros, rangos configurables o agrupaciones analíticas, sin imponer grupos etarios únicos.

##### CA-22 — Atenciones por tipo vigente

Dado que existen atenciones en el período, cuando se analizan por tipo del proceso vigente, entonces deben mostrarse total, distribución y clientes/beneficiarias únicos atendidos por tipo cuando aplique, sin inventar categorías.

##### CA-23 — Motivos de referencia no excluyentes

Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.

##### CA-24 — Motivos de cancelación

Dado que se conservan actividades Canceladas y sus motivos, cuando se analiza un período, entonces debe poder identificarse los principales motivos de cancelación sin imponer una visualización concreta.

##### CA-25 — Casos sin atención en el período

Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.

##### CA-26 — Métricas grupales y límites de integración

Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.

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

---

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

# 9. Requerimientos funcionales

Los requerimientos funcionales especifican las capacidades que deberá ofrecer SIA-CENCINAI, los actores involucrados, su prioridad y la relación con las historias de usuario consolidadas.

La estructura utilizada es: **ID · Requerimiento funcional · Actor(es) involucrado(s) · Prioridad · HU relacionada(s)**.

## 9.1 Identidad, acceso, ámbito y consulta de clientes/beneficiarias

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-001** | El sistema deberá mantener una identidad única por cliente/beneficiaria y evitar la creación de registros duplicados cuando la persona ya exista en las fuentes institucionales disponibles. | Sistema; todos los niveles | **P0** | HU-005 a HU-012 |
| **RF-002** | El sistema deberá controlar el acceso por rol y ámbito institucional. Asistente 2 y Asistente 3 compartirán las mismas capacidades de Atención Interdisciplinaria autorizadas para Establecimiento, sin diferencias no definidas institucionalmente. | Todos los niveles; Sistema | **P0** | HU-001 a HU-012; HU-023 a HU-035; HU-038 a HU-049 |
| **RF-003** | El sistema deberá mostrar de forma visible el rol activo y el ámbito institucional bajo el cual opera el usuario, por ejemplo establecimiento, Oficina Local, Región o Costa Rica, según corresponda. | Todos los niveles | **P1** | HU-001 a HU-004 |
| **RF-004** | El sistema deberá mostrar al profesional, Asistente 2 o Asistente 3 con acceso de nivel Establecimiento un resumen operativo limitado a su ámbito, incluyendo al menos referencias registradas y clientes/beneficiarias vinculados con Atención Interdisciplinaria, con accesos directos a las funciones permitidas. | Establecimiento (Profesional / Asistente 2 / Asistente 3) | **P1** | HU-001 |
| **RF-005** | El sistema deberá mostrar al personal autorizado de Oficina Local un resumen operativo de su ámbito, incluyendo referencias pendientes, casos activos, sesiones próximas, traslados pendientes de continuidad, actividades vencidas y próximas acciones registradas. | Oficina Local (Profesional EE.II. / Jefatura) | **P1** | HU-002 |
| **RF-006** | El sistema deberá mostrar al usuario Regional un resumen de la actividad de Atención Interdisciplinaria de su Región, incluyendo clientes/beneficiarias, casos activos, atenciones y programación de las Oficinas Locales bajo su ámbito. | Regional (ATE / Dirección Regional) | **P1** | HU-003 |
| **RF-007** | El sistema deberá mostrar al usuario Nacional un resumen de la actividad de Atención Interdisciplinaria del país, incluyendo clientes/beneficiarias, casos activos, atenciones y programación, con acceso a la consulta analítica nacional. | Nacional (UIVCD / UNAT) | **P1** | HU-004 |
| **RF-008** | El sistema deberá permitir buscar clientes/beneficiarias principalmente por número de identificación y secundariamente por nombre, restringiendo los resultados al ámbito institucional autorizado del usuario. | Todos los niveles | **P0** | HU-005 a HU-008 |
| **RF-009** | Cuando exista una coincidencia exacta por número de identificación, el sistema deberá darle precedencia sobre coincidencias aproximadas por nombre; una búsqueda por nombre podrá devolver múltiples resultados con información suficiente para distinguir a las personas. | Todos los niveles; Sistema | **P0** | HU-005 a HU-008 |
| **RF-010** | El sistema no deberá depender de listas desplegables masivas para seleccionar clientes/beneficiarias o casos; en los flujos con grandes volúmenes deberá utilizar mecanismos de búsqueda por identificación o nombre. | Establecimiento; Oficina Local | **P0** | HU-005; HU-006; HU-013; HU-019; HU-036; HU-037 |
| **RF-011** | El sistema deberá reutilizar los datos maestros disponibles de cada cliente/beneficiaria y conservar, cuando corresponda, la procedencia de dichos datos para evitar redigitación innecesaria. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013 |
| **RF-012** | La consulta de clientes/beneficiarias deberá respetar el rol, ámbito institucional y establecimientos autorizados para el usuario. Para acceso de nivel Establecimiento, únicamente podrán consultarse clientes/beneficiarias pertenecientes a los establecimientos autorizados para ese usuario; Oficina Local podrá consultar los establecimientos pertenecientes a su Oficina Local; Regional únicamente los correspondientes a su Región; y Nacional podrá consultar el ámbito nacional permitido. | Todos los niveles; Sistema | **P0** | HU-005 a HU-012; HU-023 |
| **RF-013** | La consulta de clientes/beneficiarias deberá permitir filtros territoriales acordes con el nivel de acceso y limitar sus opciones al ámbito autorizado. Cuando un usuario de nivel Establecimiento tenga un único establecimiento autorizado, este deberá aplicarse automáticamente; cuando disponga de varios, podrá filtrar exclusivamente entre ellos. Oficina Local podrá filtrar por sus establecimientos; Regional por Oficina Local y establecimiento; y Nacional por Región, Oficina Local y establecimiento. | Establecimiento; Oficina Local; Regional; Nacional | **P0** | HU-005 a HU-008; HU-023 |
| **RF-014** | Los filtros territoriales deberán ser dependientes entre sí: al cambiar una Región se deberán actualizar o limpiar las Oficinas Locales y establecimientos incompatibles, y al cambiar una Oficina Local se deberá actualizar o limpiar el establecimiento seleccionado. | Regional; Nacional; Sistema | **P0** | HU-007; HU-008; HU-032; HU-034; HU-040; HU-042; HU-045; HU-046 |
| **RF-015** | El sistema deberá mostrar la cantidad de resultados obtenidos respecto del total disponible cuando el usuario aplique búsquedas o filtros en los listados que correspondan. | Todos los niveles | **P1** | HU-005 a HU-008; HU-015; HU-018; HU-023; HU-024; HU-032; HU-034; HU-044 a HU-046 |
| **RF-016** | El sistema deberá permitir consultar el perfil de un cliente/beneficiaria mostrando únicamente los datos y relaciones autorizados para el rol, incluyendo ubicación institucional, servicios o modalidades disponibles, información contextual autorizada y casos asociados cuando corresponda. | Todos los niveles | **P0** | HU-009 a HU-012 |
| **RF-017** | El perfil de Establecimiento mostrará datos básicos, estado, prioridad A.I. y fechas autorizadas del caso. No expondrá valoración completa, factores detallados, nivel de riesgo, nivel de protección, plan interno, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo. | Establecimiento (Profesional / Asistente 2 / Asistente 3) | **P0** | HU-009; HU-023 |
| **RF-018** | El perfil visible para Oficina Local deberá permitir consultar los datos básicos, casos asociados e historial autorizado del cliente/beneficiaria, con acceso al detalle operativo de los casos dentro de su ámbito. | Oficina Local (Profesional EE.II. / Jefatura) | **P0** | HU-010; HU-024; HU-025 |
| **RF-019** | Los niveles Regional y Nacional deberán poder consultar la información individual permitida y los casos asociados en modo de solo lectura, sin crear, modificar ni eliminar información operativa y respetando las restricciones aplicables a datos sensibles. | Regional; Nacional | **P0** | HU-011; HU-012; HU-033; HU-035 |
| **RF-020** | El sistema deberá permitir a Oficina Local, Regional y Nacional exportar listados de clientes/beneficiarias cuando el rol lo autorice, respetando el ámbito, la búsqueda y los filtros aplicados. | Oficina Local; Regional; Nacional | **P1** | HU-006; HU-007; HU-008 |
| **RF-112** | Cuando la información se encuentre disponible en las fuentes institucionales autorizadas, el sistema deberá poder reutilizar y visualizar, según el rol y el flujo correspondiente, al menos fecha de nacimiento, edad calculada, sexo, modalidades o servicios, establecimiento, Oficina Local, Región, persona encargada del menor, relación disponible con la persona encargada, datos de contacto disponibles y dirección registrada, sin exigir su redigitación en SIA-CENCINAI. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013; HU-016; HU-025 |
| **RF-113** | La persona encargada, madre, padre, familiar o representante se manejará como contexto asociado al cliente/beneficiaria, sin incorporarse automáticamente como cliente/beneficiaria A.I. ni generar un caso independiente. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013 |
| **RF-124** | Dentro del ámbito e información que cada rol esté autorizado a consultar, el sistema deberá ofrecer mecanismos de búsqueda y filtrado suficientemente amplios para localizar y organizar los registros visibles. La disponibilidad de filtros no deberá ampliar el ámbito ni permitir inferir información restringida. | Todos los niveles; Sistema | **P1** | HU-005; HU-009; HU-015; HU-023; HU-024; HU-032; HU-034 |

## 9.2 Detección y referencia

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-021** | El sistema deberá permitir que un usuario autorizado de Establecimiento u Oficina Local cree una referencia estructurada de Atención Interdisciplinaria únicamente para un cliente/beneficiaria comprendido dentro de su ámbito de acceso. Para nivel Establecimiento podrán disponer de esta función, según autorización institucional, profesionales, Asistentes 2 y Asistentes 3. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-022** | La referencia deberá registrar como mínimo fecha, **Vía de Atención**, origen y responsable que realiza la referencia. La Vía de Atención deberá diferenciar al menos `Urgencia` y `No inmediata`. Los orígenes vigentes deberán contemplar `Vigilancia / tamizaje`, `Observación`, `Información aportada por la familia u otros` y `Referencia externa`. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-023** | El responsable de la referencia será automáticamente la identidad institucional autenticada, tanto en captura directa como desde plantilla. No se permitirá seleccionarlo, escribirlo ni sustituirlo manualmente; se conservará históricamente y se mostrará en solo lectura. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-014; HU-016; HU-017 |
| **RF-024** | La referencia deberá permitir seleccionar múltiples motivos o hallazgos según los catálogos vigentes. Para la versión funcional actual, Crecimiento deberá contemplar `Condición de malnutrición` y `Malnutrición con necesidades especiales`; Desarrollo deberá contemplar únicamente `EDIN II: riesgo de retraso (rojo)` y `EVADE: riesgo de rezago (0,1 sin logro de edad anterior)`; Salud podrá conservar `Otra condición de salud`; y Factores de riesgo deberá distinguir los ámbitos individual, hogar-familiar y comunitario sin una opción genérica `Otro factor de riesgo`. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-025** | El sistema deberá permitir registrar una especificación textual para cada motivo o elemento seleccionado en la referencia cuando se requiera contextualización adicional. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-026** | Si un elemento seleccionado posee una especificación asociada y posteriormente se elimina de la selección, el sistema deberá eliminar o invalidar también la especificación vinculada para evitar información huérfana. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013 |
| **RF-027** | La referencia dispondrá de campos diferenciados para acciones realizadas previo a la referencia, resultados obtenidos previo a la referencia e Información complementaria asociada al motivo de referencia. Este último recogerá contexto útil del motivo sin exigir una historia narrativa extensa del niño o su familia. | Establecimiento; Oficina Local | **P0** | HU-013; HU-016; HU-017 |
| **RF-028** | El flujo de creación de referencia deberá organizar la captura en etapas comprensibles, permitir regresar a etapas anteriores o cancelar y exigir la selección de un cliente/beneficiaria válido antes de continuar. Mientras se realiza la captura, la interfaz deberá priorizar el formulario y evitar mostrar simultáneamente bandejas o detalles no necesarios para completar la referencia. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-029** | Antes de confirmar el envío, el sistema mostrará una revisión con los datos capturados y reutilizados disponibles. Después de la identificación principal de la persona se presentará el contexto territorial en orden Región → Oficina Local → Establecimiento; el responsable será de solo lectura. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-030** | Al confirmar el envío digital, el sistema registrará la referencia y la asociará con cliente/beneficiaria, Región, Oficina Local y establecimiento. Quedará inmediatamente disponible para Oficina Local en estado Pendiente de revisión; un borrador no constituirá una referencia enviada. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-014; HU-018 |
| **RF-031** | El sistema deberá permitir al nivel Establecimiento consultar una bandeja de referencias limitada a sus establecimientos autorizados y a Oficina Local consultar las referencias de todos los establecimientos comprendidos dentro de su ámbito. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-032** | Los listados de referencias a Atención Interdisciplinaria mostrarán consecutivo institucional, cliente/beneficiaria, identificación, establecimiento, responsable, fecha y hora de envío, estado y Vía de Atención dentro del ámbito autorizado. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-033** | El detalle de referencia mostrará, según permisos, consecutivo, fecha de referencia, fecha y hora de envío, usuario remitente, estado, Vía de Atención, origen, identificación y contexto histórico, motivos y especificaciones, acciones previas, resultados e información complementaria asociada al motivo. Responsable y datos de envío serán históricos y de solo lectura. | Establecimiento; Oficina Local | **P0** | HU-016; HU-018 |
| **RF-034** | El envío digital constituirá la entrega y disponibilidad inmediata de la referencia en Oficina Local, sin recibido, sello, traslado de papel ni confirmación manual de recepción obligatorios. Quedará Pendiente de revisión y, tras el análisis, conservará el resultado Admitida a A.I. al confirmar la admisión o No requiere A.I. con justificación, sin estados manuales redundantes de recepción. | Oficina Local; Sistema | **P0** | HU-013; HU-018; HU-021; HU-022 |
| **RF-035** | La versión imprimible de referencia incluirá, según disponibilidad, título, consecutivo, fecha de referencia, fecha y hora de envío, responsable, identificación, nombre, fecha de nacimiento, edad de la referencia, sexo, modalidades/servicios, Región → Oficina Local → Establecimiento, persona encargada, relación, contacto, dirección, Vía de Atención, origen, motivos, especificaciones, acciones previas, resultados e información complementaria asociada al motivo. La generación/impresión tendrá trazabilidad diferenciada del envío cuando se conserve. Al existir diseño institucional aprobado se aplicarán logo, encabezado, paginación y demás elementos autorizados. | Establecimiento; Oficina Local | **P1** | HU-017 |
| **RF-036** | El sistema deberá permitir descargar una plantilla estandarizada de referencia, cargar posteriormente un archivo compatible, validar su estructura, precargar los datos disponibles y exigir revisión humana antes del guardado definitivo. La plantilla no deberá permitir sustituir manualmente la identidad institucional de la persona usuaria que realiza la referencia. | Establecimiento; Oficina Local | **P1** | HU-014 |
| **RF-037** | La referencia precargada desde plantilla permitirá corregir datos funcionales antes de confirmar, sin editar al responsable autenticado, y cumplirá las mismas reglas de catálogos, validación, contexto histórico, consecutivo, asociación territorial y envío digital que la captura directa, incluyendo disponibilidad inmediata y registro automático no editable de fecha, hora y usuario del envío. | Establecimiento; Oficina Local; Sistema | **P1** | HU-014; HU-013 |
| **RF-114** | Toda referencia dispondrá de un consecutivo institucional único bajo el patrón DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX, por ejemplo DNCC-DRCS-OL101-1010102-REF-001-2026. Los códigos regionales identificados son CS, HN, CH, HC, BR, CN, PC, CO y CE; Oficina Local y establecimiento procederán de la codificación institucional autorizada del cliente/beneficiaria. Podrá coexistir un identificador técnico interno. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-015; HU-016; HU-017; HU-018 |
| **RF-115** | El consecutivo institucional de la referencia deberá construirse o validarse utilizando el establecimiento asociado al cliente/beneficiaria y no la ubicación o identidad de la persona que confecciona la referencia. Cuando la referencia genere un caso A.I., dicho consecutivo deberá conservarse como identificador institucional de trazabilidad del caso de origen. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-018; HU-022; HU-025 |
| **RF-116** | Al registrar la referencia se preservará su contexto histórico: persona encargada, relación, contacto, dirección, modalidades/servicios, Región, Oficina Local, establecimiento y edad al momento de la referencia, cuando estén disponibles mediante fuentes institucionales autorizadas. Los cambios maestros posteriores no modificarán retroactivamente esos valores; el caso mantendrá el contexto de su referencia de origen. | Sistema; Establecimiento; Oficina Local | **P0** | HU-013; HU-016; HU-017; HU-022; HU-025 |
| **RF-117** | La bandeja de referencias deberá permitir buscar y filtrar los registros visibles, respetando siempre el ámbito del usuario, al menos por nombre o identificación del cliente/beneficiaria, consecutivo, estado, Vía de Atención, origen y categoría o motivo cuando corresponda. | Establecimiento; Oficina Local | **P1** | HU-015; HU-018 |
| **RF-127** | El sistema deberá detectar y mostrar posibles referencias pendientes a partir de resultados disponibles en fuentes institucionales autorizadas que cumplan criterios vigentes de referencia A.I. y no posean una referencia equivalente gestionada en SIA. Mostrará cliente/beneficiaria, establecimiento, motivo/criterio y fecha o período del resultado cuando estén disponibles, dentro del ámbito autorizado de la persona usuaria a la que institucionalmente se asigne esta función. Permitirá localizar a la persona o iniciar la referencia, evitará duplicados y resolverá la alerta al gestionarse la referencia correspondiente. No recapturará variables ni recalculará EDIN II/EVADE, no decidirá profesionalmente ni abrirá automáticamente casos. El mecanismo institucional se definirá con UTIC, sin imponer tecnología ni periodicidad. | Personal autorizado según ámbito y distribución operativa institucional; Sistema | **P1** — dependiente de integración institucional | HU-049 |

## 9.3 Sesión y valoración interdisciplinaria

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-038** | El sistema deberá permitir al Equipo Interdisciplinario de Oficina Local crear y consultar sesiones interdisciplinarias, registrando fecha, hora de inicio, hora de finalización, lugar y disciplinas participantes. Las Disciplinas participantes se registrarán mediante selector múltiple convencional y compacto, con búsqueda opcional, sin chips/globitos como mecanismo principal de selección; se mantienen catálogo y reglas vigentes. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019 |
| **RF-039** | Una sesión interdisciplinaria podrá registrarse inicialmente sin casos asociados y deberá permitir incorporar casos posteriormente. | Equipo Interdisciplinario de Oficina Local | **P1** | HU-019 |
| **RF-040** | Para incorporar casos a una sesión, el sistema deberá permitir buscar referencias o casos por identificación o nombre dentro de la Oficina Local, asociar múltiples casos y evitar que una misma referencia se agregue más de una vez a la sesión. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019 |
| **RF-041** | El sistema deberá permitir registrar una valoración situacional independiente para cada referencia o situación analizada en una sesión interdisciplinaria. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-042** | La valoración organizará factores protectores, factores de riesgo y signos de alerta en Individual, Hogar/Familiar y Comunitario conforme al instrumento vigente. El equipo registrará profesionalmente riesgo global Alto, Moderado o Bajo y protección Alta, Moderada o Baja, independientes entre sí; los checkboxes no determinarán automáticamente esos niveles. Cada categoría de Factores se presentará inicialmente compacta y podrá expandirse al hacer clic y volver a contraerse mediante presentación colapsable, tipo acordeón o equivalente, conservando selecciones al cerrar/reabrir y sin exigir mostrar todos los factores simultáneamente. No se modifica la clasificación funcional ni el significado institucional de las categorías. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-043** | La valoración deberá permitir seleccionar múltiples factores y registrar una especificación textual para cualquier elemento seleccionado que requiera contexto adicional. Los campos abiertos o alternativas equivalentes a `Otro` podrán conservarse en la valoración profesional cuando el instrumento vigente los contemple. Para cada categoría requerida según la definición funcional vigente se exigirá uno o más factores aplicables o la respuesta explícita Ninguno, conforme a RN-008. Si queda alguna sin respuesta, el sistema identificará las categorías pendientes, mostrará un mensaje comprensible y bloqueará continuar/finalizar la etapa correspondiente. Ninguno es mutuamente excluyente con los demás factores de su categoría; al seleccionar otro factor deberá retirarse Ninguno o exigirse su desmarcado. Se utilizarán controles de selección múltiple estructurados conforme a RNF-009. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-044** | La valoración situacional no deberá exigir como campos obligatorios intensidad, frecuencia ni persistencia para los factores registrados. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-045** | El sistema deberá permitir al Equipo Interdisciplinario registrar explícitamente la resolución `Sí requiere A.I.` o `No requiere A.I.` y conservar la relación de la decisión con la referencia y la sesión donde se tomó. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-021 |
| **RF-046** | Cuando la resolución sea `No requiere A.I.`, el sistema deberá exigir y conservar una **justificación de la decisión**, mantener el resultado de la valoración y no abrir un caso activo de Atención Interdisciplinaria. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-021 |
| **RF-047** | Cuando la resolución sea Sí requiere A.I., el sistema utilizará los niveles profesionales de riesgo y protección, calculará prioridad conforme a RN-009 y exigirá propósitos, estrategias, disciplinas vigentes y frecuencia planificada antes de abrir el caso. La frecuencia conservará las alternativas vigentes e incorporará Trimestral y Semestral, manteniendo Según necesidad; expresa periodicidad ideal o planificada, sin garantizar intervalos exactos ni definir las reuniones institucionales del equipo. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-022 |
| **RF-048** | Al confirmar la apertura, el sistema deberá crear un caso A.I. activo vinculado con el cliente/beneficiaria y la referencia de origen, conservar el consecutivo institucional y el contexto histórico relevante de dicha referencia, actualizar su estado según corresponda y registrar un evento de admisión en la línea de tiempo. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-022 |
| **RF-118** | El sistema calculará prioridad A.I. aplicando exclusivamente la matriz de RN-009 a los niveles de riesgo y protección registrados por el equipo, sin selección manual de prioridad. Mostrará Alto en rojo, Moderado en ámbar/amarillo y Bajo en verde, acompañados de denominación textual. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-020; HU-022 |
| **RF-119** | El sistema deberá distinguir conceptualmente la **Vía de Atención** de una referencia de la **prioridad de Atención Interdisciplinaria**. `Urgencia` y `No inmediata` corresponden a Vía de Atención; la prioridad resultante de la valoración deberá utilizar únicamente los niveles `Alto`, `Moderado` y `Bajo`. | Sistema; Establecimiento; Oficina Local; Regional; Nacional | **P0** | HU-013; HU-022; HU-024; HU-032; HU-034; HU-038; HU-040; HU-042 |
| **RF-120** | El catálogo vigente de disciplinas utilizado para sesiones, valoración, planes y atenciones deberá utilizar las disciplinas expresamente definidas por el proceso institucional y no incluir una alternativa genérica `Otra`, salvo que una modificación posterior del procedimiento vuelva a incorporarla formalmente. Cuando se admitan múltiples Disciplinas, su entrada utilizará un selector múltiple convencional y compacto conforme a RNF-009, preservando exactamente opciones y reglas funcionales. | Equipo Interdisciplinario de Oficina Local; Sistema | **P1** | HU-019; HU-022; HU-036; HU-037 |

## 9.4 Gestión y seguimiento del caso A.I.

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-049** | La Lista de A.I. simplificada de Establecimiento se restringirá a sus establecimientos autorizados, mostrará estado y prioridad A.I. y permitirá búsqueda por identificación/nombre y filtros por estado y prioridad Alto, Moderado o Bajo. Aplicará automáticamente el único establecimiento autorizado o permitirá filtrar entre los varios autorizados. | Establecimiento (Profesional / Asistente 2 / Asistente 3) | **P0** | HU-023 |
| **RF-050** | La Lista de A.I. de Establecimiento permitirá consultar estado y prioridad A.I., sin acceso a valoración completa, factores detallados, riesgo, protección, plan interno, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo. Los filtros no expondrán información restringida y la lista no permitirá exportación. | Establecimiento (Profesional / Asistente 2 / Asistente 3) | **P0** | HU-023 |
| **RF-051** | Oficina Local deberá poder buscar y filtrar los casos A.I. de su ámbito por identificación o nombre, establecimiento, estado y prioridad, combinando dichos criterios y mostrando la cantidad de resultados obtenidos. | Oficina Local | **P0** | HU-024 |
| **RF-052** | Nivel Regional deberá poder buscar y filtrar los casos A.I. de su Región por identificación o nombre, Oficina Local, establecimiento, estado y prioridad, sin acceder a casos de otras Regiones. | Regional (ATE / Dirección Regional) | **P0** | HU-032 |
| **RF-053** | Nivel Nacional deberá poder buscar y filtrar los casos A.I. del país por identificación o nombre, Región, Oficina Local, establecimiento, estado y prioridad, aplicando filtros jerárquicos dependientes. | Nacional (UIVCD / UNAT) | **P0** | HU-034 |
| **RF-054** | El sistema deberá permitir exportar los listados de casos autorizados para Oficina Local, Regional y Nacional, respetando la búsqueda, los filtros aplicados y el ámbito institucional del usuario. | Oficina Local; Regional; Nacional | **P1** | HU-024; HU-032; HU-034 |
| **RF-055** | Oficina Local consultará el detalle integral del caso con identificador técnico, consecutivo de referencia de origen, cliente/beneficiaria, establecimiento, apertura, estado, riesgo, protección, prioridad calculada, resumen, línea de tiempo, plan y contexto histórico de ingreso disponible. Mostrará fecha de última atención o Sin atención registrada cuando no exista, conforme a RF-126. | Oficina Local | **P0** | HU-025; HU-048 |
| **RF-056** | Regional y Nacional deberán poder consultar el detalle permitido de un caso en modo de solo lectura, incluyendo resumen, línea de tiempo y plan vigente, sin ejecutar acciones de gestión operativa reservadas a Oficina Local. | Regional; Nacional | **P0** | HU-033; HU-035 |
| **RF-057** | El sistema deberá mantener una línea de tiempo longitudinal por caso que integre los eventos relevantes de la atención, tales como admisión, atenciones individuales, atenciones grupales, coordinaciones cuando corresponda, traslados, reportes y cierre. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-025; HU-033; HU-035; HU-036; HU-037 |
| **RF-058** | Oficina Local deberá poder cargar y consultar documentos vinculados con un caso A.I., conservando como mínimo tipo, fecha, responsable y demás metadatos necesarios para su identificación. | Oficina Local | **P1** | HU-026 |
| **RF-059** | Oficina Local deberá poder registrar y consultar coordinaciones interinstitucionales asociadas a un caso, indicando institución, profesional responsable, motivo, fecha y estado de la coordinación. | Oficina Local | **P1** | HU-027 |
| **RF-060** | El sistema deberá permitir que el profesional responsable de una coordinación sea diferente del usuario que realiza la digitación y deberá conservar la trazabilidad correspondiente. | Oficina Local; Sistema | **P1** | HU-027 |
| **RF-061** | La Oficina Local de origen deberá poder registrar el traslado de un caso indicando Oficina Local destino, establecimiento destino, Región, fecha y motivo, cerrando su responsabilidad mediante un cierre específico por traslado sin eliminar el historial previo. | Oficina Local de origen | **P1** | HU-028 |
| **RF-062** | Al registrar un traslado, el sistema deberá generar para la Oficina Local destino un ingreso pendiente de continuidad vinculado con el caso de origen y conservar la relación histórica entre ambos ámbitos. | Oficina Local de origen; Oficina Local de destino; Sistema | **P1** | HU-028; HU-029 |
| **RF-063** | La Oficina Local de destino deberá poder consultar un ingreso por traslado y confirmar la continuidad cuando la persona efectivamente sea atendida en el nuevo ámbito; al confirmarla, el sistema deberá crear el caso activo correspondiente sin reabrir ni modificar retroactivamente el caso cerrado de origen. | Oficina Local de destino; Sistema | **P1** | HU-029 |
| **RF-064** | Oficina Local deberá poder generar un reporte de un caso activo sin cerrarlo, indicando al menos tipo o propósito, fecha, responsable y motivo, reutilizando la información registrada en el expediente lógico y conservando el reporte en el historial del caso. | Oficina Local | **P0** | HU-030 |
| **RF-065** | La generación de un reporte y el cierre de un caso deberán ser acciones independientes; generar un reporte no deberá modificar automáticamente el estado activo del caso. | Oficina Local; Sistema | **P0** | HU-030; HU-031 |
| **RF-066** | Oficina Local deberá poder cerrar un caso A.I. registrando fecha y motivo de cierre; al confirmarse, el sistema deberá cambiar el estado a Cerrado y agregar el evento correspondiente a la línea de tiempo. | Oficina Local; Sistema | **P0** | HU-031 |
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
| **RF-083** | La reportería de Oficina Local deberá limitarse a su ámbito y permitir filtrar por año o período, establecimiento, estado del caso, prioridad, disciplina y profesional, según aplique a cada indicador. | Oficina Local (Profesional / Jefatura) | **P1** | HU-038 |
| **RF-084** | La reportería Regional deberá limitarse a la Región del usuario y permitir filtrar por año o período, Oficina Local, establecimiento, estado del caso, prioridad, disciplina y profesional. | Regional (ATE / Dirección Regional) | **P0** | HU-040 |
| **RF-085** | La reportería Nacional deberá permitir consultar el país completo y desagregar la información por Región, Oficina Local y establecimiento, además de aplicar filtros por año o período, estado, prioridad, disciplina y profesional. | Nacional (UIVCD / UNAT) | **P0** | HU-042 |
| **RF-086** | Los filtros territoriales utilizados en reportería deberán funcionar jerárquicamente y actualizar o limpiar los niveles inferiores cuando cambie un nivel superior. | Regional; Nacional; Sistema | **P0** | HU-040; HU-042 |
| **RF-087** | La reportería analizará según ámbito y período: referencias a Atención Interdisciplinaria registradas/enviadas, analizadas, admitidas y con resultado No requiere A.I.; casos activos por establecimiento, estado, prioridad, sexo y edad; clientes/beneficiarias únicos atendidos; total de atenciones y distribución por tipos vigentes; frecuencia de motivos de referencia; principales motivos de cancelación; y casos activos sin atención en el período. Una referencia analizada puede terminar admitida o No requiere A.I.; cada métrica identificará el evento y fecha del corte para distinguir envío, análisis y resultado. | Oficina Local; Regional; Nacional | **P0** | HU-038; HU-040; HU-042; HU-048 |
| **RF-088** | La reportería diferenciará clientes/beneficiarias únicos atendidos y total de atenciones: una persona atendida cinco veces representa una persona única y cinco atenciones. La atención grupal tendrá un registro base; las personas atendidas se contabilizarán según asistencia sin multiplicar el registro base por participantes. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 |
| **RF-089** | La reportería analizará casos activos por establecimiento, estado, prioridad Alto/Moderado/Bajo, sexo y edad dentro del ámbito autorizado. Permitirá filtros por edad, rangos configurables o agrupaciones según criterio analítico, sin fijar una clasificación etaria institucional única obligatoria. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-090** | La reportería comparará clientes/beneficiarias únicos atendidos y total de atenciones por disciplina y analizará total y distribución de atenciones por tipos realmente vigentes y personas únicas por tipo cuando aplique. No se asumirán tipos o disciplinas mutuamente excluyentes cuando existan múltiples asociaciones. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-091** | Los filtros afectarán únicamente indicadores funcionalmente relacionados y mostrarán su alcance. Los motivos de referencia a Atención Interdisciplinaria se analizarán como frecuencia de aparición: una referencia puede tener varios, sus conteos pueden superar el total de referencias y no debe interpretarse que su suma equivale a ese total. Los motivos de cancelación de programación se analizarán por período sin imponer una visualización concreta. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 |
| **RF-092** | Oficina Local deberá poder generar una consolidación dinámica de su ámbito o de un establecimiento seleccionado, utilizando el período y filtros vigentes. | Oficina Local (Profesional / Jefatura) | **P1** | HU-039 |
| **RF-093** | Nivel Regional deberá poder generar consolidaciones dinámicas de su Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. | Regional (ATE / Dirección Regional) | **P1** | HU-041 |
| **RF-094** | Nivel Nacional deberá poder generar consolidaciones dinámicas del país, de una Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. | Nacional (UIVCD / UNAT) | **P1** | HU-043 |
| **RF-095** | Regional y Nacional deberán poder obtener consolidaciones directamente a partir de la información a la que tienen acceso, sin exigir un flujo manual de remisión, aprobación o devolución de archivos entre niveles institucionales. | Regional; Nacional; Sistema | **P1** | HU-041; HU-043 |
| **RF-096** | El sistema deberá permitir descargar las consolidaciones autorizadas en un formato compatible con herramientas ofimáticas, respetando los filtros aplicados e identificando al menos el período y el ámbito utilizados para generar la salida. | Oficina Local; Regional; Nacional | **P1** | HU-039; HU-041; HU-043 |
| **RF-122** | Las exportaciones tabulares deberán estructurar la información mediante encabezados y columnas diferenciadas, de forma que cada atributo relevante sea utilizable directamente para consulta o análisis y se evite concentrar múltiples datos independientes en una sola columna o representación no estructurada. | Oficina Local; Regional; Nacional; Sistema | **P1** | HU-006 a HU-008; HU-024; HU-032; HU-034; HU-039; HU-041; HU-043 |
| **RF-123** | Los documentos o reportes destinados a impresión deberán utilizar plantillas visualmente consistentes y contener los identificadores, fecha, contexto institucional y secciones necesarias para interpretar el documento. Cuando los lineamientos gráficos institucionales estén disponibles, deberán aplicarse los logotipos, encabezados y demás elementos autorizados correspondientes. | Establecimiento; Oficina Local; Sistema | **P1** | HU-017; HU-030 |

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
| **RF-104** | El sistema deberá obtener y respetar, mediante el mecanismo institucional de autorización vigente, los establecimientos previamente autorizados para cada usuario con acceso de nivel Establecimiento, incluidos profesionales, Asistentes 2 y Asistentes 3, sin mantener en SIA-CENCINAI una asignación paralela. Cuando exista un único establecimiento autorizado deberá aplicarse automáticamente; cuando existan varios, las vistas que requieran desagregación deberán limitar sus opciones exclusivamente a dichos establecimientos. | Establecimiento (Profesional / Asistente 2 / Asistente 3); Sistema | **P0** | HU-005; HU-023 |
| **RF-105** **(EXPLORATORIO / POSTERIOR 2027)** | Como funcionalidad futura, el asistente conversacional permitirá consultas de solo lectura sobre datos autorizados por rol y ámbito: cantidades y nombres de casos por prioridad, persona encargada, contacto, programación, referencias, última atención y casos sin atención en un período, entre otros datos expresamente permitidos. Establecimiento mantendrá las restricciones de detalle interno. | Todos los niveles autorizados; Sistema | **P2** | HU-047 |
| **RF-106** **(EXPLORATORIO / POSTERIOR 2027)** | Antes de resolver una consulta conversacional, el sistema deberá determinar y aplicar el rol, ámbito institucional, establecimientos autorizados cuando corresponda y demás restricciones de acceso vigentes para el usuario, de forma que el asistente no pueda ampliar los permisos disponibles mediante la interacción en lenguaje natural. | Todos los niveles autorizados; Sistema | **P0 para una eventual implementación** | HU-047; RF-002; RF-103; RF-104 |
| **RF-107** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente conversacional deberá identificar y utilizar únicamente las fuentes, entidades, tablas, vistas, campos o servicios de datos previamente habilitados para esta funcionalidad y compatibles con el contexto autorizado del usuario. La selección de datos deberá realizarse después de establecer el contexto de autorización y antes de construir o ejecutar la consulta correspondiente. | Sistema | **P0 para una eventual implementación** | HU-047 |
| **RF-108** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente ejecutará exclusivamente consultas de lectura validadas sobre fuentes autorizadas. No creará referencias o casos, modificará registros, cerrará casos, trasladará, reprogramará, cancelará, borrará ni realizará acciones operativas. | Sistema | **P0 para una eventual implementación** | HU-047 |
| **RF-109** **(EXPLORATORIO / POSTERIOR 2027)** | El asistente deberá generar la respuesta en lenguaje natural a partir de los resultados efectivamente obtenidos de las fuentes autorizadas para la consulta. Cuando los resultados sean inexistentes, insuficientes, ambiguos o no permitan sustentar una respuesta, el sistema deberá informarlo al usuario y no presentar información no respaldada por los datos consultados. | Todos los niveles autorizados; Sistema | **P1** | HU-047 |
| **RF-110** **(EXPLORATORIO / POSTERIOR 2027)** | Cuando resulte relevante para interpretar el resultado, el asistente deberá indicar el ámbito, período, filtros o criterios principales utilizados para resolver la consulta, sin revelar información técnica o sensible que el usuario no esté autorizado a conocer. | Todos los niveles autorizados; Sistema | **P1** | HU-047 |
| **RF-111** **(EXPLORATORIO / POSTERIOR 2027)** | El sistema deberá conservar trazabilidad suficiente de las consultas realizadas mediante el asistente conversacional para permitir su revisión técnica y funcional, incluyendo al menos el usuario, fecha y hora, contexto de autorización utilizado, consulta realizada y resultado general de su procesamiento, conforme a las reglas institucionales de seguridad y privacidad que se definan para esta funcionalidad. | Sistema; Administrador autorizado | **P0 para una eventual implementación** | HU-047 |
