# SIA-CENCINAI — Especificación Funcional

**Versión:** 0.4  
**Fecha:** 25 de septiembre de 2026  
**Estado:** Descubrimiento / refinamiento funcional / validación mediante prototipo  
**Producto:** Sistema de apoyo a la Atención Interdisciplinaria (SIA-CENCINAI)


> [!IMPORTANT]
> Este documento es la fuente funcional principal del proyecto. Contiene alcance, actores, principios, épicas, historias de usuario, criterios de aceptación, requerimientos funcionales, casos de uso, modelo conceptual, reglas de negocio, requerimientos no funcionales, reportería, integraciones y decisiones pendientes.
>
> La matriz RF ↔ CU se mantiene separada en [`TRACEABILITY_MATRIX.md`](./TRACEABILITY_MATRIX.md).

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

# 2. Cambios de alcance consolidados

Esta versión integra las decisiones funcionales obtenidas mediante el análisis del proceso, la documentación disponible y las validaciones del prototipo realizadas durante septiembre de 2026.

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
- Creación, consulta, impresión y recepción de referencias.
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

- Sustituir completamente SIDINACC/CAH.
- Rediseñar la selección de hogares o modalidades institucionales.
- Automatizar decisiones profesionales de ingreso, priorización o cierre.
- Implementar un flujo de aprobación Regional de los registros de Oficina Local.
- Adoptar SNOMED CT como integración formal.
- Implementar OCR como dependencia del producto.
- Implementar un modo offline avanzado con sincronización como dependencia del producto.
- Definir automáticamente el flujo vigilancia/tamizaje → A.I. mientras no exista una decisión institucional sobre el punto de entrada y el actor responsable.
- Exportaciones anonimizadas sin una política institucional de gobernanza previamente definida.

---

# 4. Actores y alcance de acceso

| Código | Actor | Alcance principal |
| --- | --- | --- |
| **ACT-01** | Profesional del establecimiento / Asistente 3 | Crear y consultar referencias de su establecimiento; consultar clientes/beneficiarias de su ámbito y una lista simplificada de A.I. con información mínima. |
| **ACT-02** | Profesional del EE.II. de Oficina Local | Gestionar referencias, sesiones, casos, atenciones, documentos, coordinaciones, traslados, reportes, cierre, programación y reportería dentro de su Oficina Local. |
| **ACT-03** | Equipo Interdisciplinario de Oficina Local | Analizar casos, registrar valoración situacional, decidir si requieren A.I., establecer prioridad y definir el abordaje inicial. |
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

Puede:

- buscar clientes/beneficiarias de su establecimiento;
- crear referencias;
- consultar referencias de su establecimiento;
- consultar información básica del cliente/beneficiaria;
- consultar una lista simplificada de A.I.;
- visualizar estado general y fechas de apertura/cierre del caso;
- utilizar la plantilla estandarizada de referencia.

No debe visualizar, desde la gestión del caso:

- prioridad;
- valoración situacional;
- plan de atención;
- estrategias;
- disciplinas;
- frecuencia;
- detalle de atenciones;
- documentos;
- coordinaciones;
- traslados;
- reportes internos;
- cierre operativo.

## 5.2 Oficina Local

Es el nivel operativo principal. Puede:

- buscar clientes/beneficiarias de todos sus establecimientos;
- consultar y recibir referencias;
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

Las decisiones profesionales de ingreso, prioridad, abordaje y cierre no se automatizan.

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
| **EP-02** | Detección y referencia | Crear, consultar, imprimir y recibir referencias a Atención Interdisciplinaria. |
| **EP-03** | Sesión y valoración interdisciplinaria | Organizar sesiones, valorar casos, resolver ingreso y definir el abordaje inicial. |
| **EP-04** | Gestión del caso A.I. | Consultar y gestionar casos, documentos, coordinaciones, traslados, reportes y cierre. |
| **EP-05** | Atenciones y seguimiento | Registrar atenciones individuales y grupales y mantener su trazabilidad longitudinal. |
| **EP-08** | Reportería y analítica | Consultar, filtrar, visualizar, consolidar y exportar información. |
| **EP-14** | Programación | Planificar actividades en Oficina Local y permitir su consulta en niveles superiores. |

---

# 8. Historias de usuario

## EP-01 — Identidad y expediente lógico

### HU-001 — Consultar resumen operativo del establecimiento

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional o Asistente 3 de un establecimiento, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi establecimiento, **para** identificar rápidamente las referencias y clientes/beneficiarias relacionados con A.I. que requieren mi atención o consulta.

**Criterios de aceptación**

#### CA-01 — Restringir el resumen al establecimiento

**Dado** que el usuario pertenece a un establecimiento determinado, **cuando** ingresa a la página de inicio, **entonces** el sistema debe mostrar únicamente información correspondiente a ese establecimiento.

#### CA-02 — Mostrar referencias

**Dado** que existen referencias asociadas al establecimiento, **cuando** el usuario consulta el inicio, **entonces** debe visualizar la cantidad de referencias correspondientes a su ámbito.

#### CA-03 — Mostrar clientes/beneficiarias asociados a A.I.

**Dado** que existen clientes/beneficiarias del establecimiento con casos de A.I., **cuando** el usuario consulta el inicio, **entonces** debe visualizar un contador de clientes/beneficiarias asociados a Atención Interdisciplinaria.

#### CA-04 — Acceso rápido a referencia

**Dado** que el usuario se encuentra en Inicio, **cuando** selecciona la acción de nueva referencia, **entonces** el sistema debe llevarlo al flujo de creación de una referencia.

#### CA-05 — Acceso rápido a lista de A.I.

**Dado** que el usuario se encuentra en Inicio, **cuando** selecciona la lista de A.I., **entonces** debe poder consultar la vista simplificada correspondiente a su establecimiento.

---

### HU-002 — Consultar el resumen operativo de la Oficina Local

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi Oficina Local, **para** identificar rápidamente referencias, casos, sesiones, traslados y actividades que requieren atención.

**Criterios de aceptación**

#### CA-01 — Restringir información al ámbito

**Dado** que el usuario pertenece a una Oficina Local, **cuando** ingresa al sistema, **entonces** el resumen debe mostrar únicamente información correspondiente a esa Oficina Local y sus establecimientos.

#### CA-02 — Mostrar referencias pendientes

**Dado** que existen referencias pendientes de gestión, **cuando** el usuario consulta Inicio, **entonces** debe visualizar su cantidad y poder acceder a ellas.

#### CA-03 — Mostrar casos activos

**Dado** que existen casos activos, **cuando** se muestra el resumen, **entonces** debe visualizarse su cantidad y permitir navegar al listado de casos.

#### CA-04 — Mostrar sesiones próximas

**Dado** que existen sesiones interdisciplinarias programadas, **cuando** el usuario consulta el resumen, **entonces** debe visualizar las próximas sesiones y poder acceder a su gestión.

#### CA-05 — Mostrar traslados pendientes

**Dado** que existen ingresos por traslado destinados a la Oficina Local, **cuando** todavía no se ha confirmado su continuidad, **entonces** el sistema debe mostrarlos como pendientes de atención.

#### CA-06 — Mostrar actividades programadas pendientes

**Dado** que una actividad programada alcanzó o superó su fecha sin registrar resultado, **cuando** el usuario consulta Inicio, **entonces** debe visualizarse como pendiente de actualización.

#### CA-07 — Mostrar próximas acciones

**Dado** que existen casos con próximas acciones registradas, **cuando** el usuario consulta Inicio, **entonces** debe poder visualizar esas acciones y acceder al caso correspondiente.

---

### HU-003 — Consultar el resumen regional de Atención Interdisciplinaria

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** consultar un resumen de la actividad de Atención Interdisciplinaria correspondiente a mi Región, **para** conocer de forma rápida la situación general de los casos, personas atendidas, atenciones y programación de las Oficinas Locales bajo mi ámbito.

**Criterios de aceptación**

#### CA-01 — Restringir el resumen a la Región

**Dado** que el usuario pertenece a una Región determinada, **cuando** ingresa al sistema, **entonces** el resumen debe mostrar únicamente información correspondiente a esa Región y sus Oficinas Locales y establecimientos.

#### CA-02 — Mostrar clientes/beneficiarias del ámbito

**Dado** que existen clientes/beneficiarias registrados dentro de la Región, **cuando** se consulta el Inicio, **entonces** debe mostrarse la cantidad correspondiente al ámbito regional.

#### CA-03 — Mostrar casos activos

**Dado** que existen casos A.I. activos dentro de la Región, **cuando** se consulta el resumen, **entonces** debe mostrarse su cantidad.

#### CA-04 — Mostrar actividad de atención

**Dado** que se han registrado atenciones en casos pertenecientes a la Región, **cuando** se consulta el resumen, **entonces** debe mostrarse una medida resumida de la actividad registrada.

#### CA-05 — Mostrar programación

**Dado** que las Oficinas Locales de la Región poseen actividades programadas, **cuando** se consulta el resumen, **entonces** debe mostrarse la cantidad correspondiente y permitir acceder a Programación.

#### CA-06 — Acceso a analítica

**Dado** que el usuario necesita profundizar en la información regional, **cuando** selecciona el acceso a reportería, **entonces** debe navegar a la sección analítica manteniendo su ámbito regional.

---

### HU-004 — Consultar el resumen nacional de Atención Interdisciplinaria

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar un resumen general de la actividad de Atención Interdisciplinaria en el país, **para** obtener una visión rápida de la cantidad de clientes/beneficiarias, casos, atenciones y actividades programadas a nivel nacional.

**Criterios de aceptación**

#### CA-01 — Utilizar el ámbito nacional

**Dado** que el usuario posee acceso de Nivel Nacional, **cuando** ingresa al sistema, **entonces** el resumen debe considerar la información disponible de todas las Regiones, Oficinas Locales y establecimientos permitidos.

#### CA-02 — Mostrar clientes/beneficiarias

**Dado** que existen clientes/beneficiarias registrados en el sistema, **cuando** se consulta el Inicio, **entonces** debe mostrarse la cantidad correspondiente al ámbito nacional.

#### CA-03 — Mostrar casos activos

**Dado** que existen casos A.I. activos, **cuando** se consulta el resumen nacional, **entonces** debe mostrarse la cantidad total correspondiente.

#### CA-04 — Mostrar actividad de atención

**Dado** que existen atenciones registradas, **cuando** se consulta el Inicio, **entonces** debe mostrarse una medida resumida de la actividad realizada.

#### CA-05 — Mostrar programación

**Dado** que las Oficinas Locales poseen actividades programadas, **cuando** el usuario consulta el resumen, **entonces** debe visualizar una medida de la programación existente y poder acceder a su consulta.

#### CA-06 — Acceder a reportería

**Dado** que el usuario necesita profundizar en los datos nacionales, **cuando** selecciona el acceso a reportería, **entonces** debe poder continuar hacia la sección analítica sin perder su ámbito de acceso.

---

### HU-005 — Buscar un cliente/beneficiaria del establecimiento

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

#### Historia de Usuario

Como profesional o Asistente 3 con acceso de nivel Establecimiento, quiero buscar clientes/beneficiarias principalmente por identificación y secundariamente por nombre dentro de los establecimientos autorizados para mi usuario, para localizar rápidamente a la persona correcta sin recorrer listados extensos ni acceder a información correspondiente a establecimientos fuera de mi ámbito.

#### Criterios de aceptación

##### CA-01 — Búsqueda por identificación

**Dado** que el usuario conoce la identificación del cliente/beneficiaria, **cuando** la ingresa en el buscador, **entonces** el sistema debe devolver únicamente las coincidencias correspondientes a los establecimientos autorizados para ese usuario.

##### CA-02 — Prioridad de coincidencia exacta

**Dado** que existe una coincidencia exacta por identificación, **cuando** se ejecuta la búsqueda, **entonces** esa coincidencia debe tener precedencia sobre coincidencias aproximadas por nombre.

##### CA-03 — Búsqueda por nombre

**Dado** que el usuario no dispone de la identificación, **cuando** ingresa parte o totalidad del nombre, **entonces** el sistema debe mostrar únicamente las coincidencias existentes dentro de los establecimientos autorizados para ese usuario.

##### CA-04 — Varias coincidencias

**Dado** que una búsqueda por nombre encuentra varias personas, **cuando** el sistema muestra los resultados, **entonces** debe presentar información suficiente para que el usuario pueda distinguir y seleccionar correctamente al cliente/beneficiaria.

##### CA-05 — Restricción de ámbito

**Dado** que el usuario posee acceso de nivel Establecimiento, **cuando** realiza una búsqueda, **entonces** el sistema no debe mostrar ni permitir seleccionar clientes/beneficiarias pertenecientes exclusivamente a establecimientos que no estén autorizados para ese usuario.

##### CA-06 — Conteo de resultados

**Dado** que se ejecuta una búsqueda, **cuando** existen coincidencias, **entonces** el sistema debe indicar la cantidad de registros que cumplen con el criterio y ámbito aplicado.

##### CA-07 — Múltiples establecimientos autorizados

**Dado** que el usuario tiene más de un establecimiento autorizado, **cuando** accede a la búsqueda de clientes/beneficiarias, **entonces** el sistema debe habilitar un filtro por establecimiento cuyas opciones se limiten exclusivamente a los establecimientos autorizados para ese usuario.

**Y dado** que el usuario selecciona uno de dichos establecimientos, **cuando** ejecuta una búsqueda, **entonces** los resultados deben limitarse al establecimiento seleccionado.

##### CA-08 — Único establecimiento autorizado

**Dado** que el usuario tiene un único establecimiento autorizado, **cuando** accede a la búsqueda de clientes/beneficiarias, **entonces** el sistema debe aplicar dicho establecimiento automáticamente y no mostrar un filtro de establecimiento innecesario.

##### CA-09 — Sin coincidencias

**Dado** que la búsqueda no encuentra clientes/beneficiarias dentro del ámbito y establecimientos autorizados aplicables, **cuando** finaliza la consulta, **entonces** el sistema debe informar que no existen coincidencias sin ampliar automáticamente la búsqueda hacia establecimientos no autorizados.

---


### HU-006 — Consultar y localizar clientes/beneficiarias de la Oficina Local

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** buscar y consultar clientes/beneficiarias pertenecientes a los establecimientos de mi Oficina Local, **para** localizar rápidamente a la persona correcta y acceder a la información permitida para gestionar Atención Interdisciplinaria.

**Criterios de aceptación**

#### CA-01 — Buscar por identificación

**Dado** que el usuario conoce la identificación, **cuando** la ingresa en el buscador, **entonces** el sistema debe priorizar la coincidencia exacta.

#### CA-02 — Buscar por nombre

**Dado** que el usuario no conoce la identificación, **cuando** busca por nombre, **entonces** el sistema debe mostrar las coincidencias existentes en su Oficina Local.

#### CA-03 — Restringir ámbito

**Dado** que el usuario pertenece a una Oficina Local, **cuando** realiza una búsqueda, **entonces** no debe recibir resultados de Oficinas Locales fuera de su ámbito.

#### CA-04 — Filtrar por establecimiento

**Dado** que la Oficina Local contiene múltiples establecimientos, **cuando** el usuario selecciona uno, **entonces** el listado debe limitarse a clientes/beneficiarias de ese establecimiento.

#### CA-05 — Mostrar conteo

**Dado** que existe una búsqueda o filtro activo, **cuando** cambian los resultados, **entonces** el sistema debe indicar la cantidad encontrada respecto del total disponible.

#### CA-06 — Exportar listado

**Dado** que el usuario ha aplicado una búsqueda o filtros, **cuando** selecciona exportar, **entonces** el sistema debe generar un archivo Excel únicamente con los registros visibles dentro de su ámbito.

---

### HU-007 — Buscar y consultar clientes/beneficiarias de la Región

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** buscar y consultar clientes/beneficiarias pertenecientes a las Oficinas Locales y establecimientos de mi Región, **para** localizar personas específicas y consultar la información permitida dentro de mi ámbito institucional.

**Criterios de aceptación**

#### CA-01 — Buscar por identificación

**Dado** que el usuario conoce la identificación del cliente/beneficiaria, **cuando** la ingresa en el buscador, **entonces** el sistema debe priorizar la coincidencia exacta dentro de su Región.

#### CA-02 — Buscar por nombre

**Dado** que el usuario no conoce la identificación, **cuando** ingresa un nombre total o parcial, **entonces** el sistema debe mostrar las coincidencias existentes dentro de su Región.

#### CA-03 — Restringir ámbito

**Dado** que el usuario pertenece a una Región, **cuando** realiza una búsqueda, **entonces** no debe recibir resultados pertenecientes a otras Regiones.

#### CA-04 — Filtrar por Oficina Local

**Dado** que una Región contiene varias Oficinas Locales, **cuando** el usuario selecciona una Oficina Local, **entonces** el listado debe limitarse a clientes/beneficiarias de esa unidad.

#### CA-05 — Filtrar por establecimiento

**Dado** que existen varios establecimientos dentro del ámbito seleccionado, **cuando** el usuario selecciona uno, **entonces** el listado debe limitarse a clientes/beneficiarias de ese establecimiento.

#### CA-06 — Filtros dependientes

**Dado** que el usuario cambia la Oficina Local seleccionada, **cuando** existe un establecimiento previamente seleccionado que no pertenece a la nueva OL, **entonces** el sistema debe limpiar o actualizar ese filtro para evitar combinaciones inconsistentes.

#### CA-07 — Mostrar conteo

**Dado** que existe una búsqueda o filtro activo, **cuando** se actualizan los resultados, **entonces** el sistema debe mostrar la cantidad encontrada respecto del total disponible en el ámbito correspondiente.

#### CA-08 — Exportar listado

**Dado** que el usuario ha aplicado criterios de búsqueda o filtrado, **cuando** selecciona exportar, **entonces** debe generarse un archivo Excel con los registros visibles y dentro de su Región.

---

### HU-008 — Buscar y consultar clientes/beneficiarias a nivel nacional

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** buscar y consultar clientes/beneficiarias de cualquier Región, Oficina Local o establecimiento del país, **para** localizar personas específicas y acceder a la información permitida independientemente de su ubicación institucional.

**Criterios de aceptación**

#### CA-01 — Buscar por identificación

**Dado** que el usuario conoce la identificación del cliente/beneficiaria, **cuando** la ingresa en el buscador, **entonces** el sistema debe priorizar la coincidencia exacta.

#### CA-02 — Buscar por nombre

**Dado** que el usuario no conoce la identificación, **cuando** ingresa un nombre total o parcial, **entonces** el sistema debe mostrar las coincidencias disponibles dentro del ámbito nacional.

#### CA-03 — Consultar todo el país

**Dado** que no existe ningún filtro territorial aplicado, **cuando** el usuario consulta clientes/beneficiarias, **entonces** debe poder visualizar resultados correspondientes a todo el país.

#### CA-04 — Filtrar por Región

**Dado** que el usuario necesita restringir la consulta territorialmente, **cuando** selecciona una Región, **entonces** el listado debe limitarse a clientes/beneficiarias pertenecientes a esa Región.

#### CA-05 — Filtrar por Oficina Local

**Dado** que se seleccionó una Región o se desea consultar una unidad específica, **cuando** el usuario selecciona una Oficina Local, **entonces** el listado debe limitarse a personas pertenecientes a esa OL.

#### CA-06 — Filtrar por establecimiento

**Dado** que se requiere un nivel territorial más específico, **cuando** el usuario selecciona un establecimiento, **entonces** deben mostrarse únicamente clientes/beneficiarias pertenecientes a ese establecimiento.

#### CA-07 — Mantener jerarquía de filtros

**Dado** que los filtros territoriales dependen entre sí, **cuando** el usuario cambia una Región, **entonces** el sistema debe actualizar o limpiar las Oficinas Locales y establecimientos incompatibles.

#### CA-08 — Cambiar Oficina Local

**Dado** que existe un establecimiento previamente seleccionado, **cuando** cambia la Oficina Local, **entonces** el sistema debe limpiar o actualizar el establecimiento si ya no corresponde.

#### CA-09 — Mostrar conteo

**Dado** que existe una búsqueda o filtro activo, **cuando** se actualizan los resultados, **entonces** debe indicarse la cantidad encontrada respecto del universo correspondiente.

#### CA-10 — Exportar resultados

**Dado** que el usuario posee un conjunto de resultados visible, **cuando** selecciona exportar, **entonces** debe generarse un archivo Excel respetando la búsqueda, filtros y permisos actuales.

---

### HU-009 — Consultar información básica de un cliente/beneficiaria

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional o Asistente 3 de un establecimiento, **quiero** consultar la información básica y el estado general de A.I. de un cliente/beneficiaria de mi establecimiento, **para** identificarlo correctamente y conocer si está o ha estado vinculado con Atención Interdisciplinaria sin acceder a información restringida del caso.

**Criterios de aceptación**

#### CA-01 — Mostrar identificación básica

**Dado** que el usuario selecciona un cliente/beneficiaria, **cuando** abre su información, **entonces** debe visualizar al menos nombre, identificación, edad y establecimiento.

#### CA-02 — Mostrar ubicación institucional

**Dado** que se consulta un cliente/beneficiaria, **cuando** existe información institucional asociada, **entonces** el sistema debe mostrar establecimiento y Oficina Local correspondientes.

#### CA-03 — Mostrar procedencia del dato

**Dado** que un dato fue reutilizado desde una fuente institucional, **cuando** se muestra en pantalla, **entonces** el sistema debe poder identificar su fuente o procedencia cuando corresponda.

#### CA-04 — Mostrar estado básico de A.I.

**Dado** que el cliente/beneficiaria posee uno o más casos A.I., **cuando** se consulta su información, **entonces** debe mostrarse únicamente información básica de esos casos: identificador, estado, fecha de apertura y fecha de cierre cuando exista.

#### CA-05 — Persona sin caso A.I.

**Dado** que el cliente/beneficiaria no posee casos de Atención Interdisciplinaria, **cuando** el usuario consulta su información, **entonces** el sistema debe indicarlo claramente.

#### CA-06 — Protección de información interna

**Dado** que el usuario pertenece al nivel Establecimiento, **cuando** consulta un cliente/beneficiaria, **entonces** no debe poder acceder desde esta vista a valoración situacional, prioridad, plan, disciplinas, atenciones, documentos sensibles ni demás información interna del expediente A.I.

---

### HU-010 — Consultar la información integral disponible de un cliente/beneficiaria

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** consultar los datos básicos, casos e historial de un cliente/beneficiaria, **para** comprender su situación dentro de Atención Interdisciplinaria sin volver a recopilar información ya disponible.

**Criterios de aceptación**

#### CA-01 — Datos básicos

**Dado** que el usuario selecciona un cliente/beneficiaria, **cuando** abre su perfil, **entonces** debe visualizar al menos identificación, nombre, fecha de nacimiento, edad, sexo, establecimiento, Oficina Local, Región y modalidades disponibles.

#### CA-02 — Procedencia de datos

**Dado** que la información proviene de una fuente institucional existente, **cuando** se muestra al usuario, **entonces** el sistema debe poder conservar la procedencia del dato.

#### CA-03 — Casos asociados

**Dado** que la persona posee uno o más casos A.I., **cuando** el usuario consulta su perfil, **entonces** debe visualizar los casos asociados y poder acceder a su detalle según permisos.

#### CA-04 — Historial

**Dado** que la persona posee eventos registrados, **cuando** se consulta su historial, **entonces** deben visualizarse cronológicamente los eventos correspondientes.

#### CA-05 — Evitar redigitación

**Dado** que un dato maestro ya se encuentra registrado, **cuando** la persona se utilice en otro flujo, **entonces** el sistema debe reutilizarlo en lugar de solicitarlo nuevamente.

---

### HU-011 — Consultar la información disponible de un cliente/beneficiaria en modo lectura

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** consultar la información permitida de un cliente/beneficiaria y sus casos de Atención Interdisciplinaria, **para** dar seguimiento técnico a la situación sin modificar la gestión realizada por la Oficina Local.

**Criterios de aceptación**

#### CA-01 — Consultar datos básicos

**Dado** que el usuario selecciona un cliente/beneficiaria, **cuando** abre su perfil, **entonces** debe visualizar los datos básicos permitidos, incluyendo identificación y ubicación institucional.

#### CA-02 — Mostrar pertenencia institucional

**Dado** que la persona pertenece a un establecimiento determinado, **cuando** se consulta su perfil, **entonces** deben visualizarse establecimiento, Oficina Local y Región correspondientes.

#### CA-03 — Consultar casos asociados

**Dado** que el cliente/beneficiaria posee uno o más casos A.I., **cuando** se consulta su perfil, **entonces** deben mostrarse los casos visibles para Regional.

#### CA-04 — Acceder al caso permitido

**Dado** que el usuario selecciona un caso visible, **cuando** abre su detalle, **entonces** debe poder consultarlo en modo lectura según sus permisos.

#### CA-05 — Consultar historial permitido

**Dado** que existen eventos asociados al caso, **cuando** Regional consulta el historial, **entonces** debe poder visualizar los eventos permitidos sin modificarlos.

#### CA-06 — Solo lectura

**Dado** que la gestión operativa corresponde a Oficina Local, **cuando** Regional consulta la información individual, **entonces** no debe poder crear, modificar ni eliminar información operativa del caso.

#### CA-07 — Protección de información sensible

**Dado** que determinados datos o documentos pueden requerir permisos adicionales, **cuando** el usuario Regional consulta un expediente, **entonces** el sistema debe limitar la información mostrada según las reglas de acceso institucional definidas.

---

### HU-012 — Consultar la información disponible de un cliente/beneficiaria en modo lectura

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar la información permitida de un cliente/beneficiaria y sus casos de Atención Interdisciplinaria, **para** dar seguimiento institucional y técnico sin modificar la gestión realizada por los niveles operativos.

**Criterios de aceptación**

#### CA-01 — Consultar datos básicos

**Dado** que el usuario selecciona un cliente/beneficiaria, **cuando** abre su perfil, **entonces** debe visualizar los datos básicos permitidos para su rol.

#### CA-02 — Consultar ubicación institucional

**Dado** que la persona está asociada a un establecimiento, **cuando** se consulta su perfil, **entonces** deben visualizarse establecimiento, Oficina Local y Región.

#### CA-03 — Consultar casos asociados

**Dado** que la persona posee uno o más casos A.I., **cuando** se consulta su perfil, **entonces** deben mostrarse los casos accesibles para Nivel Nacional.

#### CA-04 — Acceder al detalle permitido

**Dado** que el usuario selecciona un caso, **cuando** lo abre, **entonces** debe acceder a la información individual permitida en modo lectura.

#### CA-05 — Consultar historial permitido

**Dado** que existen eventos asociados al caso, **cuando** se consulta su historial, **entonces** deben mostrarse los eventos permitidos según el nivel de acceso.

#### CA-06 — Impedir modificación operativa

**Dado** que el usuario pertenece al Nivel Nacional, **cuando** consulta información individual, **entonces** no debe poder crear, modificar ni eliminar registros propios de la gestión de Oficina Local.

#### CA-07 — Restringir información sensible

**Dado** que determinados datos pueden estar sujetos a permisos adicionales, **cuando** el usuario accede a un expediente, **entonces** el sistema debe aplicar las restricciones correspondientes antes de mostrar dicha información.

---

## EP-02 — Detección y referencia

### HU-013 — Crear manualmente una referencia a Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de un Establecimiento u Oficina Local,  
**quiero** registrar una referencia estructurada a Atención Interdisciplinaria para un cliente/beneficiaria dentro de mi ámbito,  
**para** documentar y remitir la información necesaria para valorar una posible necesidad de apoyo especializado.

**Criterios de aceptación**

#### CA-01 — Seleccionar cliente/beneficiaria mediante búsqueda

**Dado** que el usuario inicia una referencia,  
**cuando** debe identificar al cliente/beneficiaria,  
**entonces** debe buscarlo por identificación o nombre y no mediante una lista desplegable masiva.

#### CA-02 — Restringir selección según ámbito

**Dado** que el usuario crea una referencia,  
**cuando** busca al cliente/beneficiaria,  
**entonces** el sistema debe limitar los resultados a su ámbito autorizado: el propio establecimiento para el nivel Establecimiento y los establecimientos de su Oficina Local para el nivel Oficina Local.

#### CA-03 — Precargar datos existentes

**Dado** que el cliente/beneficiaria ya posee datos institucionales,  
**cuando** es seleccionado,  
**entonces** el sistema debe reutilizar la información disponible y evitar solicitar nuevamente datos maestros.

#### CA-04 — Registrar trazabilidad de la referencia

**Dado** que se está creando una referencia,  
**cuando** el usuario completa la información inicial,  
**entonces** debe registrar fecha, tipo de referencia, origen de detección y profesional responsable.

#### CA-05 — Responsable diferente al digitador

**Dado** que quien registra la información no necesariamente realizó la referencia,  
**cuando** se completa el campo de responsable,  
**entonces** debe poder indicarse una persona profesional diferente al usuario conectado.

#### CA-06 — Tipo de referencia

**Dado** que se crea una referencia,  
**cuando** se define su tipo,  
**entonces** el sistema debe permitir seleccionar al menos `Urgencia` o `No inmediata`, según el modelo vigente.

#### CA-07 — Origen de detección

**Dado** que debe registrarse cómo se identificó la necesidad,  
**cuando** se completa la referencia,  
**entonces** debe poder seleccionarse al menos:

- Vigilancia/tamizaje.
- Observación directa.
- Información aportada por la familia.
- Referencia externa.
- Otro.

#### CA-08 — Seleccionar múltiples motivos

**Dado** que una referencia puede originarse por más de una condición,  
**cuando** se registran los motivos,  
**entonces** el usuario debe poder seleccionar múltiples elementos relacionados con crecimiento, desarrollo, salud y otros factores aplicables.

#### CA-09 — Especificar cualquier elemento seleccionado

**Dado** que un motivo, factor protector, factor de riesgo, signo de alerta u otro elemento seleccionado requiere contextualización,  
**cuando** el usuario necesita ampliar la información,  
**entonces** el sistema debe permitir registrar una especificación textual asociada específicamente a ese elemento.

#### CA-10 — Mantener relación selección-detalle

**Dado** que un elemento seleccionado posee una especificación asociada,  
**cuando** el usuario elimina ese elemento de la selección,  
**entonces** el sistema debe eliminar o invalidar también la especificación asociada para evitar información huérfana.

#### CA-11 — Información relevante

**Dado** que existen antecedentes o contexto no cubiertos por los campos estructurados,  
**cuando** se completa la referencia,  
**entonces** debe existir un campo para registrar información relevante u observaciones.

#### CA-12 — Navegación estructurada

**Dado** que el usuario está completando una referencia,  
**cuando** avanza por el formulario,  
**entonces** el sistema debe organizar la captura en etapas comprensibles y permitir regresar a etapas anteriores antes de guardar.

#### CA-13 — Cliente/beneficiaria obligatorio

**Dado** que no se ha seleccionado ningún cliente/beneficiaria,  
**cuando** el usuario intenta continuar con la referencia,  
**entonces** el sistema debe impedir el avance hasta seleccionar un registro válido.

#### CA-14 — Revisión antes del guardado

**Dado** que se completaron los datos de la referencia,  
**cuando** el usuario llega al paso final,  
**entonces** debe visualizar un resumen completo de la información antes de confirmar.

#### CA-15 — Guardar referencia

**Dado** que la información fue revisada,  
**cuando** el usuario confirma el registro,  
**entonces** la referencia debe almacenarse y quedar asociada al cliente/beneficiaria, establecimiento, Oficina Local y Región correspondientes.

#### CA-16 — Estado inicial

**Dado** que una nueva referencia fue registrada,  
**cuando** finaliza el proceso,  
**entonces** debe quedar con el estado inicial definido para referencias pendientes de gestión por Oficina Local.

---

### HU-014 — Cargar una referencia desde una plantilla estandarizada

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** PROPUESTA DE DISEÑO VALIDADA

**Historia de Usuario**

**Como** profesional autorizado de un Establecimiento u Oficina Local,  
**quiero** cargar una plantilla estandarizada previamente completada,  
**para** precargar una referencia en el sistema sin transcribir nuevamente la información capturada fuera del sistema.

**Criterios de aceptación**

#### CA-01 — Descargar plantilla

**Dado** que el usuario necesita capturar una referencia mediante la plantilla estandarizada,  
**cuando** selecciona la opción correspondiente,  
**entonces** debe poder descargar una plantilla compatible.

#### CA-02 — Cargar archivo

**Dado** que el usuario completó la plantilla,  
**cuando** vuelve al sistema,  
**entonces** debe poder seleccionar el archivo para iniciar la precarga.

#### CA-03 — Validar estructura

**Dado** que se carga un archivo,  
**cuando** el sistema lo procesa,  
**entonces** debe comprobar que corresponde a la estructura esperada antes de utilizar sus datos.

#### CA-04 — Precargar formulario

**Dado** que la plantilla es válida,  
**cuando** finaliza su procesamiento,  
**entonces** los valores compatibles deben precargarse en el formulario de referencia.

#### CA-05 — Revisión humana

**Dado** que los datos fueron precargados,  
**cuando** el usuario continúa el flujo,  
**entonces** debe poder revisar y modificar cualquier valor antes de guardar.

#### CA-06 — Aplicar las mismas reglas de una referencia manual

**Dado** que la información precargada fue revisada,  
**cuando** el usuario confirma la referencia,  
**entonces** debe almacenarse bajo las mismas reglas funcionales que una referencia creada manualmente.

---

### HU-015 — Consultar las referencias del establecimiento

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional o Asistente 3 de un establecimiento, **quiero** consultar las referencias a Atención Interdisciplinaria correspondientes a mi establecimiento, **para** conocer cuáles han sido registradas y revisar su estado e información principal.

**Criterios de aceptación**

#### CA-01 — Restringir referencias por establecimiento

**Dado** que el usuario pertenece a un establecimiento, **cuando** abre la bandeja de referencias, **entonces** debe visualizar únicamente las referencias pertenecientes a ese establecimiento.

#### CA-02 — Información resumida

**Dado** que existen referencias visibles, **cuando** se presenta el listado, **entonces** debe mostrar al menos cliente/beneficiaria, identificación, establecimiento, responsable, estado y tipo de referencia.

#### CA-03 — Seleccionar referencia

**Dado** que existe una referencia en el listado, **cuando** el usuario la selecciona, **entonces** debe poder acceder a su información detallada permitida.

---

### HU-016 — Consultar el detalle de una referencia

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de un Establecimiento u Oficina Local,  
**quiero** consultar el detalle de una referencia previamente registrada dentro de mi ámbito,  
**para** verificar la información remitida, su estado y la persona profesional responsable de la referencia.

**Criterios de aceptación**

#### CA-01 — Información general

**Dado** que el usuario abre una referencia,  
**cuando** se carga su detalle,  
**entonces** debe visualizar cliente/beneficiaria, identificación, fecha, estado, tipo y origen.

#### CA-02 — Motivos y especificaciones

**Dado** que la referencia posee motivos o factores seleccionados,  
**cuando** se consulta su detalle,  
**entonces** deben mostrarse los elementos seleccionados y la especificación registrada para cada uno cuando exista.

#### CA-03 — Información relevante

**Dado** que se registraron observaciones o información relevante,  
**cuando** se abre la referencia,  
**entonces** esta información debe estar disponible para consulta.

#### CA-04 — Responsable

**Dado** que una persona profesional fue indicada como responsable de la referencia,  
**cuando** se consulta su detalle,  
**entonces** debe mostrarse quién realizó la referencia aunque sea diferente de quien la digitó.

#### CA-05 — Respetar ámbito

**Dado** que el usuario consulta referencias,  
**cuando** intenta acceder a una referencia,  
**entonces** el sistema debe permitir únicamente aquellas correspondientes a su ámbito autorizado.

---

### HU-017 — Imprimir una referencia

**Prioridad:** P1  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de un Establecimiento u Oficina Local,  
**quiero** generar una versión imprimible de una referencia registrada,  
**para** utilizarla como respaldo documental o incorporarla al expediente físico cuando sea necesario.

**Criterios de aceptación**

#### CA-01 — Generar versión imprimible

**Dado** que existe una referencia registrada,  
**cuando** el usuario selecciona imprimir,  
**entonces** el sistema debe generar una versión preparada para impresión.

#### CA-02 — Contenido mínimo

**Dado** que se genera la versión imprimible,  
**cuando** se presenta el documento,  
**entonces** debe incluir al menos:

- cliente/beneficiaria;
- identificación;
- fecha;
- establecimiento;
- tipo;
- origen;
- profesional responsable;
- motivos;
- especificaciones;
- información relevante.

#### CA-03 — Trazabilidad

**Dado** que el documento puede incorporarse al expediente físico,  
**cuando** se imprime,  
**entonces** debe conservar información suficiente para identificar su procedencia y quién realizó la referencia.

---

### HU-018 — Consultar y recibir referencias de Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local,  
**quiero** consultar las referencias remitidas por los establecimientos de mi ámbito y registrar su recepción,  
**para** identificar los casos que deben incorporarse al proceso de análisis interdisciplinario.

**Criterios de aceptación**

#### CA-01 — Bandeja de referencias

**Dado** que existen referencias dentro de la Oficina Local,  
**cuando** el usuario abre Referencias,  
**entonces** debe visualizar el listado correspondiente a su ámbito.

#### CA-02 — Información resumida

**Dado** que una referencia aparece en el listado,  
**cuando** se presenta al usuario,  
**entonces** debe mostrar como mínimo cliente/beneficiaria, identificación, establecimiento, responsable, estado y tipo.

#### CA-03 — Registrar recepción

**Dado** que una referencia ha sido remitida a Oficina Local,  
**cuando** el profesional confirma que fue recibida,  
**entonces** el sistema debe actualizar su estado de manera trazable.

#### CA-04 — Mantener origen

**Dado** que la referencia proviene de un establecimiento,  
**cuando** Oficina Local la consulta,  
**entonces** debe conservarse la trazabilidad del establecimiento y profesional que la originaron.

---

## EP-03 — Sesión y valoración interdisciplinaria

### HU-019 — Gestionar una sesión interdisciplinaria

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** integrante del Equipo Interdisciplinario de Oficina Local, **quiero** crear y gestionar una sesión interdisciplinaria con múltiples casos, **para** organizar el análisis conjunto de las referencias que requieren valoración.

**Criterios de aceptación**

#### CA-01 — Crear sesión

**Dado** que el EE.II. necesita registrar una sesión, **cuando** la crea, **entonces** debe poder registrar fecha, horario y lugar.

#### CA-02 — Registrar disciplinas participantes

**Dado** que participan diferentes perfiles profesionales, **cuando** se configura la sesión, **entonces** deben poder indicarse una o varias disciplinas.

#### CA-03 — Permitir sesión sin casos iniciales

**Dado** que una sesión puede programarse antes de definir todos sus casos, **cuando** se crea, **entonces** no debe ser obligatorio incorporar casos de inmediato.

#### CA-04 — Buscar casos/referencias

**Dado** que se desea incorporar un caso, **cuando** el usuario lo busca, **entonces** debe poder localizarlo por identificación o nombre sin utilizar un selector masivo.

#### CA-05 — Múltiples casos

**Dado** que una sesión puede analizar múltiples situaciones, **cuando** se agregan referencias, **entonces** el sistema debe permitir asociar varias a una misma sesión.

#### CA-06 — Evitar duplicados

**Dado** que una referencia ya está incluida en la sesión, **cuando** vuelve a encontrarse en una búsqueda, **entonces** no debe permitirse agregarla nuevamente.

---

### HU-020 — Registrar la valoración situacional de un caso

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** MODELO OBJETIVO / VALIDADO FUNCIONALMENTE

**Historia de Usuario**

**Como** integrante del Equipo Interdisciplinario de Oficina Local, **quiero** registrar factores protectores, factores de riesgo y signos de alerta en los ámbitos individual, hogar-familiar y comunitario, **para** disponer de una valoración estructurada que apoye la decisión interdisciplinaria.

**Criterios de aceptación**

#### CA-01 — Ámbito individual

**Dado** que el equipo analiza un caso, **cuando** registra la valoración individual, **entonces** debe poder seleccionar factores protectores, riesgos y signos de alerta.

#### CA-02 — Ámbito hogar-familiar

**Dado** que se analiza el contexto familiar, **cuando** se completa ese ámbito, **entonces** debe poder registrar factores protectores, riesgos y signos de alerta.

#### CA-03 — Ámbito comunitario

**Dado** que se analiza el entorno comunitario, **cuando** se completa ese ámbito, **entonces** debe poder registrar factores protectores, riesgos y signos de alerta.

#### CA-04 — Múltiples factores

**Dado** que pueden coexistir varios factores, **cuando** se realiza la valoración, **entonces** el sistema debe permitir seleccionar múltiples elementos dentro de cada ámbito.

#### CA-05 — Especificación individual

**Dado** que cualquier factor seleccionado requiere contexto adicional, **cuando** el usuario lo registra, **entonces** debe poder incorporar una especificación textual asociada a ese factor concreto.

#### CA-06 — Otro

**Dado** que una situación no está contemplada en el catálogo, **cuando** el usuario necesita registrarla, **entonces** debe disponer de una opción `Otro` acompañada de su especificación.

#### CA-07 — No exigir intensidad/frecuencia/persistencia

**Dado** que estos valores fueron considerados excesivamente subjetivos, **cuando** se realiza la valoración, **entonces** el sistema no debe exigir su registro como parte obligatoria del proceso.

---

### HU-021 — Resolver si un caso requiere Atención Interdisciplinaria

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / MODELO OBJETIVO

**Historia de Usuario**

**Como** Equipo Interdisciplinario de Oficina Local, **quiero** registrar la decisión sobre si un caso requiere Atención Interdisciplinaria, **para** formalizar el resultado del análisis y determinar cómo debe continuar el proceso.

**Criterios de aceptación**

#### CA-01 — Decisión explícita

**Dado** que un caso fue analizado, **cuando** el equipo concluye su valoración, **entonces** debe registrar `Sí requiere A.I.` o `No requiere A.I.`.

#### CA-02 — No requiere A.I.

**Dado** que se selecciona `No requiere A.I.`, **cuando** se confirma la decisión, **entonces** la referencia debe conservar el resultado de la valoración sin abrir un caso activo.

#### CA-03 — Requiere A.I.

**Dado** que se selecciona `Sí requiere A.I.`, **cuando** continúa el flujo, **entonces** deben habilitarse los datos necesarios para definir el abordaje.

#### CA-04 — Mantener trazabilidad

**Dado** que se registra una decisión, **cuando** se guarda, **entonces** debe conservarse su relación con la referencia y sesión en que fue tomada.

---

### HU-022 — Definir el abordaje inicial y abrir el caso de A.I.

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / MODELO OBJETIVO

**Historia de Usuario**

**Como** Equipo Interdisciplinario de Oficina Local, **quiero** definir la prioridad, propósitos, estrategias, disciplinas y frecuencia inicial de un caso que requiere A.I., **para** abrir formalmente el caso con un plan de atención estructurado.

**Criterios de aceptación**

#### CA-01 — Registrar prioridad

**Dado** que se determinó que el caso requiere A.I., **cuando** se define su abordaje, **entonces** debe poder asignarse la prioridad correspondiente según el modelo vigente.

#### CA-02 — Registrar propósitos

**Dado** que el caso requiere atención, **cuando** se define el abordaje, **entonces** debe poder registrarse uno o más propósitos de intervención.

#### CA-03 — Seleccionar estrategias

**Dado** que el equipo define cómo abordar el caso, **cuando** configura el plan inicial, **entonces** debe poder seleccionar múltiples estrategias.

#### CA-04 — Seleccionar disciplinas

**Dado** que el caso puede requerir distintas áreas profesionales, **cuando** se configura el plan, **entonces** debe poder asociarse una o varias disciplinas.

#### CA-05 — Registrar frecuencia

**Dado** que se define la periodicidad esperada, **cuando** se abre el caso, **entonces** debe poder registrarse la frecuencia prevista de atención.

#### CA-06 — Abrir caso

**Dado** que el abordaje inicial está completo, **cuando** el equipo confirma la apertura, **entonces** el sistema debe crear un caso A.I. activo vinculado a la referencia y persona correspondientes.

#### CA-07 — Registrar evento inicial

**Dado** que el caso fue abierto, **cuando** se crea, **entonces** debe incorporarse el evento de admisión a su historial longitudinal.

---

## EP-04 — Gestión del caso A.I.

HU-023 — Consultar una lista simplificada de Atención Interdisciplinaria

**Prioridad:** P0  
**Estimación:** Pendiente  
**Estado:** CONFIRMADO

Historia de Usuario

Como profesional o Asistente 3 con acceso de nivel Establecimiento, quiero consultar una lista simplificada de los clientes/beneficiarias de mis establecimientos autorizados que poseen o han poseído un caso de Atención Interdisciplinaria, para conocer su vinculación general con A.I. sin acceder a información interna que corresponde a Oficina Local.

Criterios de aceptación

CA-01 — Restringir ámbito

**Dado** que el usuario posee acceso de nivel Establecimiento, **cuando** consulta la Lista de A.I., **entonces** únicamente debe visualizar casos correspondientes a clientes/beneficiarias de los establecimientos autorizados para ese usuario.

CA-02 — Buscar en la lista

**Dado** que existen múltiples casos visibles, **cuando** el usuario busca por identificación o nombre, **entonces** la lista debe mostrar únicamente las coincidencias existentes dentro del ámbito y establecimientos autorizados aplicables.

CA-03 — Mostrar conteo

**Dado** que se muestra la Lista de A.I. o se aplica una búsqueda, **cuando** cambian los registros visibles, **entonces** el sistema debe mostrar la cantidad de casos encontrados dentro del ámbito y filtros vigentes.

CA-04 — Información permitida

**Dado** que el usuario consulta un caso desde Establecimiento, **cuando** se muestra en la lista, **entonces** únicamente debe visualizar:

- cliente/beneficiaria;
- identificación;
- establecimiento;
- estado general;
- fecha de apertura;
- fecha de cierre cuando corresponda.

CA-05 — Ocultar prioridad

**Dado** que la prioridad es información propia de la gestión interna de A.I., **cuando** un usuario de Establecimiento consulta la lista, **entonces** no debe visualizar la prioridad del caso.

CA-06 — Impedir acceso al expediente interno

**Dado** que el usuario posee acceso de nivel Establecimiento, **cuando** consulta o selecciona un caso, **entonces** no debe poder acceder al detalle interno ni a funciones de gestión relacionadas con:

- valoración situacional;
- plan de atención;
- línea de tiempo interna;
- estrategias;
- disciplinas;
- frecuencia;
- atenciones detalladas;
- documentos sensibles;
- coordinaciones;
- traslados;
- reportes internos;
- detalle o función de cierre del caso.

La visualización de la **fecha de cierre**, cuando exista, no implica acceso al detalle interno del cierre.

CA-07 — Múltiples establecimientos autorizados

**Dado** que el usuario tiene más de un establecimiento autorizado, **cuando** consulta la Lista de A.I., **entonces** el sistema debe habilitar un filtro por establecimiento cuyas opciones se limiten exclusivamente a dichos establecimientos.

**Y dado** que el usuario selecciona uno de sus establecimientos autorizados, **cuando** se actualiza la lista, **entonces** únicamente deben mostrarse los casos correspondientes al establecimiento seleccionado.

CA-08 — Único establecimiento autorizado

**Dado** que el usuario tiene un único establecimiento autorizado, **cuando** consulta la Lista de A.I., **entonces** el sistema debe aplicar dicho establecimiento automáticamente y no mostrar un filtro de establecimiento innecesario.

CA-09 — Sin coincidencias

**Dado** que una búsqueda no encuentra casos dentro de los establecimientos autorizados y filtros aplicados, **cuando** finaliza la consulta, **entonces** el sistema debe informar que no existen coincidencias sin ampliar la búsqueda hacia ámbitos no autorizados.

CA-10 — No permitir exportación

**Dado** que el usuario posee acceso de nivel Establecimiento, **cuando** consulta la Lista de A.I., **entonces** el sistema no debe habilitar una función de exportación de dicha lista.

---

### HU-024 — Consultar, buscar y filtrar los casos de la Oficina Local

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** consultar y filtrar los casos A.I. de los establecimientos de mi ámbito, **para** localizar casos específicos y organizar el trabajo del equipo.

**Criterios de aceptación**

#### CA-01 — Buscar persona

**Dado** que el usuario necesita localizar un caso, **cuando** busca por identificación o nombre, **entonces** el sistema debe mostrar las coincidencias de su Oficina Local.

#### CA-02 — Filtrar por establecimiento

**Dado** que la OL atiende múltiples establecimientos, **cuando** selecciona uno, **entonces** deben mostrarse únicamente sus casos.

#### CA-03 — Filtrar por estado

**Dado** que existen casos con distintos estados, **cuando** se selecciona uno, **entonces** la lista debe actualizarse.

#### CA-04 — Filtrar por prioridad

**Dado** que existen diferentes prioridades, **cuando** el usuario selecciona una, **entonces** solo deben mostrarse los casos correspondientes.

#### CA-05 — Combinar filtros

**Dado** que se requieren varios criterios simultáneamente, **cuando** el usuario combina búsqueda, establecimiento, estado y prioridad, **entonces** el sistema debe aplicar todos los filtros.

#### CA-06 — Mostrar cantidad

**Dado** que existen filtros activos, **cuando** se actualizan los resultados, **entonces** debe indicarse cuántos casos coinciden respecto del total del ámbito.

#### CA-07 — Exportar

**Dado** que existe un listado filtrado, **cuando** el usuario selecciona exportar, **entonces** debe generarse un Excel respetando el ámbito y filtros actuales.

---

### HU-025 — Consultar el detalle integral de un caso A.I.

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** consultar en un único espacio el resumen, historial y plan de atención de un caso, **para** comprender rápidamente su situación actual y evolución.

**Criterios de aceptación**

#### CA-01 — Encabezado del caso

**Dado** que el usuario abre un caso, **cuando** carga su detalle, **entonces** debe visualizar persona, identificación, establecimiento, identificador del caso, apertura, estado y prioridad.

#### CA-02 — Resumen

**Dado** que existe información vigente del caso, **cuando** se consulta Resumen, **entonces** debe mostrarse información derivada de los registros existentes sin exigir redigitación.

#### CA-03 — Línea de tiempo

**Dado** que el caso posee eventos, **cuando** se consulta su historial, **entonces** deben visualizarse cronológicamente admisiones, atenciones, actividades grupales, coordinaciones, traslados, reportes, cierre y demás eventos aplicables.

#### CA-04 — Plan de atención

**Dado** que existe un plan vigente, **cuando** se consulta, **entonces** deben mostrarse estrategias, disciplinas y frecuencia.

---

### HU-026 — Gestionar documentos asociados a un caso

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** cargar y consultar documentos relacionados con un caso A.I., **para** mantener la documentación pertinente vinculada al expediente lógico de la persona.

**Criterios de aceptación**

#### CA-01 — Consultar documentos

**Dado** que existen documentos asociados al caso, **cuando** el usuario entra a Documentos, **entonces** debe visualizar sus metadatos principales.

#### CA-02 — Cargar documento

**Dado** que se requiere incorporar un archivo, **cuando** el usuario lo selecciona, **entonces** debe poder asociarlo al caso.

#### CA-03 — Registrar metadatos

**Dado** que se incorpora un documento, **cuando** se guarda, **entonces** debe conservar tipo, fecha, responsable y demás metadatos requeridos.

#### CA-04 — Mantener vinculación

**Dado** que el documento fue registrado, **cuando** se consulta posteriormente, **entonces** debe mantenerse vinculado al caso correspondiente.

---

### HU-027 — Registrar una coordinación interinstitucional

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** registrar las coordinaciones realizadas con instituciones externas, **para** conservar trazabilidad de las acciones efectuadas fuera de CEN-CINAI.

**Criterios de aceptación**

#### CA-01 — Institución destino

**Dado** que se realiza una coordinación, **cuando** se registra, **entonces** debe poder indicarse la institución correspondiente.

#### CA-02 — Responsable

**Dado** que quien digita puede ser diferente de quien realizó la coordinación, **cuando** se registra el profesional responsable, **entonces** debe permitirse indicar otra persona.

#### CA-03 — Motivo y estado

**Dado** que la coordinación requiere seguimiento, **cuando** se registra, **entonces** deben conservarse motivo, fecha y estado.

#### CA-04 — Relación con el caso

**Dado** que la coordinación forma parte del abordaje, **cuando** se guarda, **entonces** debe quedar vinculada al caso.

---

### HU-028 — Registrar el traslado de un caso hacia otra Oficina Local

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO CON DETALLES PENDIENTES

**Historia de Usuario**

**Como** profesional autorizado de la Oficina Local de origen, **quiero** registrar el traslado de un caso hacia otra Oficina Local, **para** finalizar la responsabilidad de mi unidad sin perder la continuidad histórica de la Atención Interdisciplinaria.

**Criterios de aceptación**

#### CA-01 — Datos de destino

**Dado** que se traslada un caso, **cuando** se registra la acción, **entonces** deben indicarse Oficina Local destino, establecimiento destino y Región.

#### CA-02 — Fecha y motivo

**Dado** que el traslado debe quedar documentado, **cuando** se confirma, **entonces** deben registrarse fecha y motivo.

#### CA-03 — Cierre por traslado

**Dado** que la OL origen deja de ser responsable, **cuando** confirma el traslado, **entonces** su caso debe cerrarse utilizando un motivo específico de traslado.

#### CA-04 — Conservar historial

**Dado** que la necesidad de A.I. puede continuar, **cuando** el caso se traslada, **entonces** no debe eliminarse ni perderse su historial previo.

#### CA-05 — Generar ingreso en destino

**Dado** que el traslado fue registrado, **cuando** se confirma, **entonces** la OL destino debe disponer de un ingreso pendiente de continuidad.

---

### HU-029 — Confirmar la continuidad de un caso recibido por traslado

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** NECESIDAD CONFIRMADA / DETALLE PENDIENTE

**Historia de Usuario**

**Como** profesional autorizado de la Oficina Local de destino, **quiero** consultar un ingreso por traslado y confirmar si la atención continuará en mi Oficina Local, **para** asumir formalmente la gestión del caso cuando la persona efectivamente llegue al nuevo ámbito.

**Criterios de aceptación**

#### CA-01 — Mostrar ingreso pendiente

**Dado** que otra OL registró un traslado hacia mi ámbito, **cuando** consulto los casos pendientes, **entonces** debe aparecer como ingreso por traslado pendiente de continuidad.

#### CA-02 — Mostrar origen

**Dado** que el caso proviene de otra Oficina Local, **cuando** se consulta el ingreso, **entonces** debe identificarse la OL de origen y el destino indicado.

#### CA-03 — Confirmar continuidad

**Dado** que se verificó que la persona continuará siendo atendida, **cuando** el usuario confirma la continuidad, **entonces** debe generarse un caso activo bajo la nueva Oficina Local.

#### CA-04 — Conservar historia previa

**Dado** que existe información generada en la OL origen, **cuando** se activa la continuidad, **entonces** el historial previo debe mantenerse accesible según las reglas institucionales.

---

### HU-030 — Generar un reporte de un caso sin cerrarlo

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** generar un reporte sobre un caso en cualquier momento de su atención, **para** responder a solicitudes institucionales sin tener que cerrar el caso.

**Criterios de aceptación**

#### CA-01 — Caso activo

**Dado** que un caso continúa activo, **cuando** se genera un reporte, **entonces** su estado no debe cambiar.

#### CA-02 — Seleccionar tipo

**Dado** que pueden existir diferentes necesidades de reporte, **cuando** se genera uno, **entonces** el usuario debe poder indicar su tipo o propósito.

#### CA-03 — Reutilizar historial

**Dado** que el sistema ya posee información del caso, **cuando** se prepara un reporte, **entonces** debe reutilizar esa información para reducir redigitación.

#### CA-04 — Conservar historial de reportes

**Dado** que un reporte fue generado, **cuando** se consulta posteriormente el caso, **entonces** debe existir trazabilidad de su fecha, tipo, responsable y motivo.

---

### HU-031 — Cerrar un caso de Atención Interdisciplinaria

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** registrar el cierre de un caso A.I. cuando corresponda, **para** dejar constancia de que la gestión activa de Atención Interdisciplinaria ha finalizado.

**Criterios de aceptación**

#### CA-01 — Registrar motivo

**Dado** que se decide cerrar un caso, **cuando** se confirma el cierre, **entonces** debe registrarse el motivo correspondiente.

#### CA-02 — Registrar fecha

**Dado** que el cierre forma parte del historial, **cuando** se ejecuta, **entonces** debe conservarse la fecha.

#### CA-03 — Cambiar estado

**Dado** que el cierre fue confirmado, **cuando** finaliza la operación, **entonces** el caso debe quedar en estado Cerrado.

#### CA-04 — Registrar evento

**Dado** que el caso fue cerrado, **cuando** se consulta su línea de tiempo, **entonces** debe aparecer el evento de cierre.

#### CA-05 — No confundir con reporte

**Dado** que Reporte y Cierre son acciones distintas, **cuando** se cierra un caso, **entonces** no debe asumirse que generar un reporte es requisito para ejecutar el cierre, salvo que una regla institucional futura lo establezca.

---

### HU-032 — Consultar y filtrar casos A.I. de la Región

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** buscar, filtrar y consultar los casos de Atención Interdisciplinaria pertenecientes a mi Región, **para** dar seguimiento a la situación de las distintas Oficinas Locales y establecimientos.

**Criterios de aceptación**

#### CA-01 — Restringir casos a la Región

**Dado** que el usuario pertenece a una Región, **cuando** abre Casos de A.I., **entonces** solo debe visualizar casos correspondientes a esa Región.

#### CA-02 — Buscar por identificación o nombre

**Dado** que se desea localizar un caso específico, **cuando** el usuario busca por identificación o nombre del cliente/beneficiaria, **entonces** deben mostrarse las coincidencias correspondientes.

#### CA-03 — Filtrar por Oficina Local

**Dado** que existen múltiples Oficinas Locales, **cuando** se selecciona una, **entonces** deben mostrarse únicamente sus casos.

#### CA-04 — Filtrar por establecimiento

**Dado** que una Oficina Local contiene varios establecimientos, **cuando** se selecciona un establecimiento, **entonces** deben mostrarse únicamente sus casos.

#### CA-05 — Filtrar por estado

**Dado** que los casos pueden encontrarse en distintos estados, **cuando** se selecciona un estado, **entonces** el listado debe actualizarse según ese criterio.

#### CA-06 — Filtrar por prioridad

**Dado** que los casos poseen diferentes prioridades, **cuando** se selecciona una prioridad, **entonces** deben mostrarse únicamente los casos correspondientes.

#### CA-07 — Combinar filtros

**Dado** que el usuario necesita un subconjunto específico, **cuando** combina búsqueda, Oficina Local, establecimiento, estado y prioridad, **entonces** el sistema debe aplicar todos los criterios simultáneamente.

#### CA-08 — Mostrar conteo

**Dado** que existen filtros aplicados, **cuando** se actualizan los resultados, **entonces** debe mostrarse cuántos casos coinciden respecto del total disponible en la Región.

#### CA-09 — Exportar resultados

**Dado** que existe un listado filtrado, **cuando** el usuario selecciona exportar, **entonces** debe generarse un Excel respetando todos los filtros y el ámbito regional.

---

### HU-033 — Consultar el detalle de un caso A.I. en modo lectura

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** consultar el resumen, evolución y plan vigente de un caso A.I. perteneciente a mi Región, **para** comprender su situación y brindar seguimiento técnico sin intervenir directamente en su gestión operativa.

**Criterios de aceptación**

#### CA-01 — Información general

**Dado** que el usuario abre un caso permitido, **cuando** carga su detalle, **entonces** debe visualizar al menos cliente/beneficiaria, identificación, establecimiento, identificador del caso, fecha de apertura, estado y prioridad.

#### CA-02 — Consultar resumen

**Dado** que el caso contiene información vigente, **cuando** se abre la sección Resumen, **entonces** deben mostrarse la valoración/resumen permitido, propósitos y próxima acción cuando exista.

#### CA-03 — Consultar línea de tiempo

**Dado** que el caso posee eventos registrados, **cuando** se consulta la línea de tiempo, **entonces** deben visualizarse los eventos permitidos en orden cronológico.

#### CA-04 — Consultar plan de atención

**Dado** que existe un plan vigente, **cuando** el usuario consulta esa sección, **entonces** deben mostrarse las estrategias, disciplinas y frecuencia permitidas.

#### CA-05 — Prohibir edición

**Dado** que el usuario pertenece al Nivel Regional, **cuando** consulta el detalle, **entonces** no debe poder modificar estado, prioridad, valoración, plan, línea de tiempo ni demás datos operativos.

#### CA-06 — No ejecutar acciones propias de OL

**Dado** que funciones como registrar atenciones, gestionar traslados, cerrar casos o registrar coordinaciones corresponden a Oficina Local, **cuando** Regional consulta un caso, **entonces** esas acciones no deben estar disponibles.

---

### HU-034 — Consultar y filtrar casos de Atención Interdisciplinaria a nivel nacional

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** buscar, filtrar y consultar los casos de Atención Interdisciplinaria existentes en el país, **para** analizar la situación desde el nivel nacional y profundizar progresivamente hasta Región, Oficina Local o establecimiento.

**Criterios de aceptación**

#### CA-01 — Consultar todos los casos nacionales

**Dado** que no existen filtros territoriales aplicados, **cuando** el usuario abre Casos de A.I., **entonces** debe poder consultar los casos pertenecientes a todo el país dentro de sus permisos.

#### CA-02 — Buscar por identificación o nombre

**Dado** que se necesita localizar un caso específico, **cuando** el usuario busca por identificación o nombre, **entonces** deben mostrarse las coincidencias correspondientes.

#### CA-03 — Filtrar por Región

**Dado** que se desea reducir el ámbito territorial, **cuando** se selecciona una Región, **entonces** deben mostrarse únicamente sus casos.

#### CA-04 — Filtrar por Oficina Local

**Dado** que se desea consultar una Oficina Local específica, **cuando** se selecciona, **entonces** deben mostrarse únicamente los casos pertenecientes a esa OL.

#### CA-05 — Filtrar por establecimiento

**Dado** que se requiere consultar un establecimiento específico, **cuando** se selecciona, **entonces** deben mostrarse únicamente sus casos.

#### CA-06 — Filtrar por estado

**Dado** que los casos poseen distintos estados, **cuando** se selecciona uno, **entonces** el listado debe actualizarse según ese criterio.

#### CA-07 — Filtrar por prioridad

**Dado** que existen diferentes prioridades, **cuando** el usuario selecciona una, **entonces** deben mostrarse los casos correspondientes.

#### CA-08 — Aplicar filtros jerárquicos dependientes

**Dado** que Oficina Local y establecimiento dependen de niveles superiores, **cuando** cambia Región u Oficina Local, **entonces** los filtros inferiores incompatibles deben actualizarse o limpiarse automáticamente.

#### CA-09 — Combinar filtros

**Dado** que el usuario necesita analizar un subconjunto específico, **cuando** combina ámbito territorial, búsqueda, estado y prioridad, **entonces** el sistema debe aplicar todos los criterios simultáneamente.

#### CA-10 — Mostrar conteo

**Dado** que existen filtros activos, **cuando** cambian los resultados, **entonces** debe mostrarse la cantidad de casos coincidentes respecto del universo aplicable.

#### CA-11 — Exportar resultados

**Dado** que existe un conjunto filtrado de casos, **cuando** el usuario selecciona exportar, **entonces** debe generarse un Excel respetando búsqueda, filtros territoriales, estado, prioridad y permisos.

---

### HU-035 — Consultar el detalle de un caso A.I. en modo lectura

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar el resumen, evolución y plan vigente de un caso A.I., **para** comprender su situación y brindar seguimiento institucional sin intervenir en la gestión operativa realizada por Oficina Local.

**Criterios de aceptación**

#### CA-01 — Información general

**Dado** que el usuario abre un caso permitido, **cuando** carga su detalle, **entonces** debe visualizar como mínimo cliente/beneficiaria, identificación, establecimiento, identificador del caso, fecha de apertura, estado y prioridad.

#### CA-02 — Consultar resumen

**Dado** que existe información vigente del caso, **cuando** se consulta Resumen, **entonces** deben mostrarse los datos permitidos sobre valoración, propósitos y próxima acción cuando exista.

#### CA-03 — Consultar línea de tiempo

**Dado** que el caso posee eventos, **cuando** se consulta su línea de tiempo, **entonces** deben mostrarse cronológicamente los eventos accesibles para Nivel Nacional.

#### CA-04 — Consultar plan

**Dado** que existe un plan vigente, **cuando** se consulta, **entonces** deben mostrarse las estrategias, disciplinas y frecuencia permitidas.

#### CA-05 — Solo lectura

**Dado** que la gestión directa corresponde a Oficina Local, **cuando** Nacional consulta un caso, **entonces** no debe poder modificar valoración, estado, prioridad, línea de tiempo ni plan de atención.

#### CA-06 — No ejecutar funciones operativas

**Dado** que acciones como registrar atenciones, realizar valoraciones, trasladar o cerrar casos corresponden a niveles operativos, **cuando** Nacional consulta el expediente, **entonces** esas acciones no deben estar habilitadas.

---

## EP-05 — Atenciones y seguimiento

### HU-036 — Registrar una atención individual

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional de Atención Interdisciplinaria de Oficina Local, **quiero** registrar cada atención individual realizada a un cliente/beneficiaria, **para** conservar una historia cronológica de las acciones y recomendaciones brindadas.

**Criterios de aceptación**

#### CA-01 — Buscar caso activo

**Dado** que se desea registrar una atención, **cuando** el usuario busca por identificación o nombre, **entonces** solo debe poder seleccionar casos activos de su ámbito.

#### CA-02 — Registrar fecha real

**Dado** que la fecha de atención puede diferir de la fecha de digitación, **cuando** se registra el evento, **entonces** ambas deben poder diferenciarse.

#### CA-03 — Registrar disciplina y tipo

**Dado** que una atención pertenece a una disciplina y estrategia, **cuando** se captura, **entonces** deben registrarse esos datos.

#### CA-04 — Registrar acciones y recomendaciones

**Dado** que la atención produjo acciones o indicaciones, **cuando** se registra, **entonces** deben poder documentarse.

#### CA-05 — Registrar próxima acción

**Dado** que la atención requiere continuidad, **cuando** se define una próxima acción, **entonces** debe almacenarse junto con su fecha cuando corresponda.

#### CA-06 — Incorporar al historial

**Dado** que la atención fue guardada, **cuando** se consulta el caso, **entonces** debe aparecer automáticamente en su línea de tiempo.

---

### HU-037 — Registrar una atención grupal para múltiples participantes

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional de Atención Interdisciplinaria de Oficina Local, **quiero** registrar una atención grupal una sola vez y asociarla a múltiples clientes/beneficiarias, **para** evitar duplicar la misma información en cada expediente individual.

**Criterios de aceptación**

#### CA-01 — Registrar información común

**Dado** que se realiza una atención grupal, **cuando** se crea, **entonces** deben registrarse fecha, tipo, tema/objetivo, lugar, disciplinas, profesional(es), acciones y recomendaciones generales.

#### CA-02 — Buscar participantes

**Dado** que deben incorporarse participantes, **cuando** el usuario los agrega, **entonces** debe buscarlos por identificación o nombre y no mediante una lista masiva.

#### CA-03 — Múltiples participantes

**Dado** que una misma actividad atiende a varias personas, **cuando** se registran participantes, **entonces** debe permitirse asociar múltiples clientes/beneficiarias.

#### CA-04 — Evitar duplicados

**Dado** que una persona ya está asociada a la actividad, **cuando** vuelve a buscarse, **entonces** no debe poder agregarse una segunda vez.

#### CA-05 — Registrar asistencia

**Dado** que no todas las personas convocadas necesariamente asisten, **cuando** se completa la atención, **entonces** debe registrarse la asistencia individual.

#### CA-06 — Registro único

**Dado** que la actividad grupal es una sola, **cuando** se guarda, **entonces** el sistema debe conservar un único registro base.

#### CA-07 — Historial individual

**Dado** que una persona participó de la atención y posee un caso A.I. correspondiente, **cuando** se guarda la actividad, **entonces** su participación debe aparecer en el historial individual del caso sin duplicar físicamente toda la atención.

---

## EP-08 — Reportería y analítica

### HU-038 — Consultar reportería analítica de la Oficina Local

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional o jefatura autorizada de Oficina Local, **quiero** consultar indicadores y visualizaciones de Atención Interdisciplinaria aplicando filtros sobre mi ámbito, **para** analizar la actividad, carga de trabajo y distribución de los casos de la Oficina Local.

**Criterios de aceptación**

#### CA-01 — Filtrar por año/período

**Dado** que se requiere analizar un corte temporal, **cuando** el usuario selecciona un año o período, **entonces** todas las métricas aplicables deben actualizarse.

#### CA-02 — Filtrar por establecimiento

**Dado** que la Oficina Local contiene múltiples establecimientos, **cuando** el usuario selecciona uno, **entonces** las métricas deben limitarse a ese establecimiento.

#### CA-03 — Filtrar por estado y prioridad

**Dado** que se requiere analizar subconjuntos de casos, **cuando** se aplican esos filtros, **entonces** deben actualizarse las visualizaciones correspondientes.

#### CA-04 — Filtrar por disciplina/profesional

**Dado** que se desea analizar carga de atención, **cuando** se selecciona una disciplina o profesional, **entonces** deben ajustarse las métricas de atención correspondientes.

#### CA-05 — Casos por estado

**Dado** que existen casos dentro del corte, **cuando** se consulta reportería, **entonces** debe poder visualizarse su distribución por estado.

#### CA-06 — Casos por prioridad

**Dado** que existen prioridades registradas, **cuando** se consulta reportería, **entonces** debe mostrarse su distribución.

#### CA-07 — Personas únicas atendidas

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula esta métrica, **entonces** cada cliente/beneficiaria debe contabilizarse una sola vez dentro del corte definido.

#### CA-08 — Total de atenciones

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula la actividad profesional, **entonces** debe contabilizarse cada atención realizada.

#### CA-09 — Diferenciar ambas métricas

**Dado** que personas atendidas y atenciones realizadas representan conceptos distintos, **cuando** se muestran, **entonces** deben presentarse separadamente y sin ambigüedad.

---

### HU-039 — Generar y descargar una consolidación según filtros

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

**Historia de Usuario**

**Como** profesional o jefatura autorizada de Oficina Local, **quiero** generar una salida consolidada basada en los filtros de reportería aplicados, **para** disponer de un resumen del período y ámbito requerido sin realizar consolidaciones manuales.

**Criterios de aceptación**

#### CA-01 — Respetar filtros

**Dado** que el usuario aplicó un conjunto de filtros, **cuando** genera la consolidación, **entonces** los datos deben corresponder exactamente al corte visible.

#### CA-02 — Determinar ámbito

**Dado** que no se seleccionó un establecimiento, **cuando** se genera el consolidado, **entonces** el ámbito debe corresponder a la Oficina Local.

#### CA-03 — Consolidado por establecimiento

**Dado** que se seleccionó un establecimiento, **cuando** se genera la salida, **entonces** el consolidado debe representar ese establecimiento.

#### CA-04 — Mostrar métricas principales

**Dado** que se genera el consolidado, **cuando** se presenta, **entonces** debe incluir las métricas definidas para el corte, como casos, referencias, personas atendidas, atenciones y distribución por prioridad cuando corresponda.

#### CA-05 — Descargar

**Dado** que el usuario necesita utilizar la información fuera del sistema, **cuando** selecciona descargar, **entonces** debe poder obtener un archivo Excel con el consolidado correspondiente.

---

Sí. Y acá Regional se puede destilar bastante más que Oficina Local, porque su función es principalmente **consulta, seguimiento y analítica**, no operación directa.

---

### HU-040 — Consultar reportería analítica de la Región

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** consultar indicadores y visualizaciones de Atención Interdisciplinaria aplicando filtros dentro de mi Región, **para** analizar la situación regional y comparar la actividad de sus Oficinas Locales y establecimientos.

**Criterios de aceptación**

#### CA-01 — Ámbito regional implícito

**Dado** que el usuario pertenece a una Región, **cuando** abre Reportería, **entonces** el sistema debe utilizar automáticamente esa Región como límite superior de consulta.

#### CA-02 — Filtrar por año o período

**Dado** que se desea analizar un corte temporal, **cuando** el usuario selecciona el período correspondiente, **entonces** las métricas aplicables deben actualizarse.

#### CA-03 — Filtrar por Oficina Local

**Dado** que se necesita analizar una Oficina Local específica, **cuando** el usuario la selecciona, **entonces** todas las métricas territoriales correspondientes deben limitarse a esa OL.

#### CA-04 — Filtrar por establecimiento

**Dado** que se desea profundizar hasta un establecimiento, **cuando** el usuario lo selecciona, **entonces** la reportería debe limitarse a ese ámbito.

#### CA-05 — Filtrar por estado y prioridad

**Dado** que se necesita analizar un subconjunto de casos, **cuando** se aplican esos filtros, **entonces** deben actualizarse los indicadores relacionados con casos.

#### CA-06 — Filtrar por disciplina y profesional

**Dado** que se desea analizar la actividad de atención, **cuando** se selecciona una disciplina o profesional, **entonces** deben ajustarse las métricas relacionadas con atenciones según la definición funcional establecida.

#### CA-07 — Consultar cantidad de casos

**Dado** que existe un corte seleccionado, **cuando** se visualiza la reportería, **entonces** debe mostrarse la cantidad de casos correspondiente.

#### CA-08 — Consultar cantidad de referencias

**Dado** que existen referencias dentro del período y ámbito seleccionados, **cuando** se consulta la reportería, **entonces** debe mostrarse su cantidad.

#### CA-09 — Consultar personas únicas atendidas

**Dado** que una misma persona puede recibir múltiples atenciones, **cuando** se calcula este indicador, **entonces** cada cliente/beneficiaria debe contabilizarse una sola vez dentro del corte.

#### CA-10 — Consultar total de atenciones

**Dado** que una persona puede recibir varias atenciones, **cuando** se calcula este indicador, **entonces** debe contabilizarse cada atención registrada.

#### CA-11 — Diferenciar personas y atenciones

**Dado** que ambas métricas representan conceptos diferentes, **cuando** se presentan al usuario, **entonces** deben mostrarse separadamente y con etiquetas inequívocas.

#### CA-12 — Visualizar casos por prioridad

**Dado** que existen casos en diferentes niveles de prioridad, **cuando** se consulta la reportería, **entonces** debe mostrarse su distribución.

#### CA-13 — Visualizar casos por estado

**Dado** que existen casos con distintos estados, **cuando** se consulta la reportería, **entonces** debe mostrarse su distribución.

#### CA-14 — Comparar actividad por disciplina

**Dado** que diferentes disciplinas realizan atenciones, **cuando** se consulta esa visualización, **entonces** debe permitir comparar personas únicas atendidas y cantidad total de atenciones por disciplina.

#### CA-15 — Mantener consistencia de filtros

**Dado** que distintos indicadores pueden responder a dimensiones diferentes, **cuando** se aplican filtros de disciplina o profesional, **entonces** la interfaz debe dejar claro qué indicadores son afectados por esos filtros y aplicar reglas consistentes.

---

### HU-041 — Generar y descargar consolidaciones dinámicas del ámbito regional

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** generar consolidaciones dinámicas de mi Región, de una Oficina Local o de un establecimiento según los filtros seleccionados, **para** obtener resúmenes de información sin realizar consolidaciones manuales ni depender de una remisión interna de datos.

**Criterios de aceptación**

#### CA-01 — Consolidado regional

**Dado** que no existe un filtro territorial inferior, **cuando** se genera el consolidado, **entonces** debe representar toda la Región del usuario.

#### CA-02 — Consolidado por Oficina Local

**Dado** que el usuario seleccionó una Oficina Local, **cuando** genera el consolidado, **entonces** debe representar únicamente esa OL.

#### CA-03 — Consolidado por establecimiento

**Dado** que el usuario seleccionó un establecimiento, **cuando** genera el consolidado, **entonces** debe representar ese establecimiento.

#### CA-04 — Respetar corte temporal

**Dado** que el usuario seleccionó un año o período, **cuando** genera el consolidado, **entonces** los datos deben corresponder a ese corte.

#### CA-05 — Respetar filtros funcionales

**Dado** que existen filtros de estado, prioridad u otras dimensiones aplicables, **cuando** se genera el consolidado, **entonces** sus métricas deben responder a los filtros correspondientes.

#### CA-06 — Mostrar métricas principales

**Dado** que se genera el consolidado, **cuando** se presenta al usuario, **entonces** debe incluir los principales indicadores definidos, tales como casos, referencias, personas únicas atendidas, total de atenciones y distribución por prioridad cuando corresponda.

#### CA-07 — Descargar consolidado

**Dado** que el usuario necesita utilizar la información fuera del sistema, **cuando** selecciona descargar, **entonces** debe generarse un archivo Excel correspondiente al consolidado actual.

#### CA-08 — Sin flujo de remisión

---

### HU-042 — Consultar reportería analítica nacional con desagregación jerárquica

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar indicadores y visualizaciones de Atención Interdisciplinaria para todo el país y desagregarlos por Región, Oficina Local o establecimiento, **para** analizar la situación nacional y comparar la actividad entre los distintos niveles institucionales.

**Criterios de aceptación**

#### CA-01 — Consultar el país completo

**Dado** que no existen filtros territoriales aplicados, **cuando** el usuario abre Reportería, **entonces** los indicadores deben representar el ámbito nacional.

#### CA-02 — Filtrar por año o período

**Dado** que se requiere un corte temporal, **cuando** el usuario selecciona un año o período, **entonces** los indicadores aplicables deben actualizarse.

#### CA-03 — Filtrar por Región

**Dado** que se desea analizar una Región, **cuando** se selecciona, **entonces** la reportería debe limitarse a ese ámbito.

#### CA-04 — Filtrar por Oficina Local

**Dado** que se desea profundizar en una OL, **cuando** se selecciona, **entonces** los indicadores deben limitarse a dicha unidad.

#### CA-05 — Filtrar por establecimiento

**Dado** que se requiere el nivel territorial más específico, **cuando** se selecciona un establecimiento, **entonces** la reportería debe limitarse a ese ámbito.

#### CA-06 — Mantener filtros jerárquicos consistentes

**Dado** que Región, Oficina Local y establecimiento tienen una relación jerárquica, **cuando** el usuario modifica un nivel superior, **entonces** los filtros inferiores incompatibles deben actualizarse o limpiarse.

#### CA-07 — Filtrar casos por estado

**Dado** que existen casos en distintos estados, **cuando** se selecciona uno, **entonces** los indicadores de casos aplicables deben actualizarse.

#### CA-08 — Filtrar casos por prioridad

**Dado** que existen diferentes prioridades, **cuando** se selecciona una, **entonces** los indicadores correspondientes deben reflejar ese subconjunto.

#### CA-09 — Filtrar actividad por disciplina

**Dado** que se requiere analizar la participación de una disciplina, **cuando** se selecciona, **entonces** las métricas de atención relacionadas deben actualizarse.

#### CA-10 — Filtrar actividad por profesional

**Dado** que se desea analizar la actividad de una persona profesional, **cuando** se selecciona, **entonces** las métricas correspondientes deben actualizarse.

#### CA-11 — Consultar cantidad de casos

**Dado** que existe un corte seleccionado, **cuando** se visualiza la reportería, **entonces** debe mostrarse la cantidad de casos correspondiente.

#### CA-12 — Consultar referencias

**Dado** que existen referencias dentro del período y ámbito, **cuando** se consulta la reportería, **entonces** debe mostrarse su cantidad.

#### CA-13 — Consultar personas únicas atendidas

**Dado** que una misma persona puede recibir varias atenciones, **cuando** se calcula este indicador, **entonces** cada cliente/beneficiaria debe contabilizarse una sola vez dentro del corte correspondiente.

#### CA-14 — Consultar total de atenciones

**Dado** que una persona puede recibir múltiples atenciones, **cuando** se calcula la actividad realizada, **entonces** debe contabilizarse cada atención registrada.

#### CA-15 — Diferenciar indicadores

**Dado** que personas atendidas y atenciones realizadas miden conceptos distintos, **cuando** se presentan, **entonces** deben mostrarse separadamente y con etiquetas claras.

#### CA-16 — Visualizar casos por prioridad

**Dado** que los casos poseen distintos niveles de prioridad, **cuando** se consulta la reportería, **entonces** debe poder visualizarse su distribución.

#### CA-17 — Visualizar casos por estado

**Dado** que los casos poseen diferentes estados, **cuando** se consulta la reportería, **entonces** debe visualizarse su distribución.

#### CA-18 — Comparar actividad por disciplina

**Dado** que distintas disciplinas realizan atenciones, **cuando** se consulta esa visualización, **entonces** debe permitir comparar personas únicas atendidas y cantidad total de atenciones.

#### CA-19 — Claridad semántica de filtros

**Dado** que algunos filtros afectan únicamente determinadas métricas, **cuando** se utilizan disciplina o profesional, **entonces** el sistema debe dejar claro qué indicadores son afectados y aplicar esa regla consistentemente.

---

### HU-043 — Generar y descargar consolidaciones dinámicas para cualquier ámbito institucional

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO / PROPUESTA DE DISEÑO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** generar consolidaciones dinámicas del país, de una Región, de una Oficina Local o de un establecimiento según los filtros seleccionados, **para** obtener la información consolidada que necesito sin depender de procesos manuales de remisión entre niveles institucionales.

**Criterios de aceptación**

#### CA-01 — Consolidado nacional

**Dado** que no se ha seleccionado ningún filtro territorial inferior, **cuando** el usuario genera la consolidación, **entonces** debe representar el ámbito nacional.

#### CA-02 — Consolidado Regional

**Dado** que se seleccionó una Región, **cuando** se genera la consolidación, **entonces** debe representar únicamente esa Región.

#### CA-03 — Consolidado de Oficina Local

**Dado** que se seleccionó una Oficina Local, **cuando** se genera la consolidación, **entonces** debe representar únicamente dicha OL.

#### CA-04 — Consolidado de establecimiento

**Dado** que se seleccionó un establecimiento, **cuando** se genera la consolidación, **entonces** debe representar únicamente ese establecimiento.

#### CA-05 — Respetar período

**Dado** que el usuario seleccionó un año o período, **cuando** genera la consolidación, **entonces** la información debe corresponder al corte seleccionado.

#### CA-06 — Respetar filtros funcionales

**Dado** que se aplicaron filtros adicionales como estado, prioridad u otras dimensiones válidas, **cuando** se genera el consolidado, **entonces** las métricas correspondientes deben respetar dichos filtros.

#### CA-07 — Mostrar métricas principales

**Dado** que se genera un consolidado, **cuando** se presenta al usuario, **entonces** debe incluir los principales indicadores definidos para ese corte, como:

- casos;
- referencias;
- personas únicas atendidas;
- total de atenciones;
- distribución por prioridad cuando corresponda.

#### CA-08 — Descargar a Excel

**Dado** que el usuario necesita utilizar la información externamente, **cuando** selecciona descargar, **entonces** debe generarse un archivo Excel correspondiente al consolidado actual.

#### CA-09 — No requerir remisión entre niveles

**Dado** que Nivel Nacional posee acceso a los datos según permisos, **cuando** necesita información de una Región, OL o establecimiento, **entonces** debe poder generar directamente la consolidación sin esperar que un nivel inferior prepare y remita manualmente el mismo conjunto de datos.

#### CA-10 — Mantener trazabilidad del corte

**Dado** que una consolidación depende de filtros específicos, **cuando** se genera o descarga, **entonces** debe ser posible identificar al menos el período y ámbito utilizados para producirla.

---

## EP-14 — Programación

### HU-044 — Gestionar la programación operativa de la Oficina Local

**Prioridad:** P0 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** profesional autorizado de Oficina Local, **quiero** programar y actualizar sesiones y atenciones del equipo, **para** organizar el trabajo futuro y conservar trazabilidad de las actividades realizadas, reprogramadas o canceladas.

**Criterios de aceptación**

#### CA-01 — Crear actividad

**Dado** que se planifica una actividad futura, **cuando** el usuario la registra, **entonces** debe poder definir fecha, tipo, propósito, establecimiento cuando corresponda y observaciones.

#### CA-02 — Tipos de actividad

**Dado** que la programación comprende diferentes tareas, **cuando** se crea una actividad, **entonces** debe permitir tipos como sesión interdisciplinaria, sesión de trabajo, atención por establecimiento, visita domiciliar u otra atención autorizada.

#### CA-03 — Estado inicial

**Dado** que una actividad futura fue creada, **cuando** se guarda, **entonces** debe iniciar como Programada.

#### CA-04 — Marcar realizada

**Dado** que la actividad se ejecutó, **cuando** el usuario actualiza su estado, **entonces** debe poder marcarla como Realizada.

#### CA-05 — Reprogramar

**Dado** que una actividad no pudo realizarse en la fecha original, **cuando** se marca como Reprogramada, **entonces** el sistema debe exigir nueva fecha y motivo.

#### CA-06 — Cancelar

**Dado** que una actividad no se realizará, **cuando** se marca como Cancelada, **entonces** el sistema debe exigir el motivo.

#### CA-07 — Filtrar programación

**Dado** que existen múltiples actividades, **cuando** el usuario aplica filtros, **entonces** debe poder consultar al menos por establecimiento y estado.

#### CA-08 — Actividad vencida

**Dado** que una actividad permanece Programada después de su fecha prevista, **cuando** el usuario ingresa al sistema, **entonces** debe recibir una indicación para resolver si fue realizada, reprogramada o cancelada.

---

### HU-045 — Consultar la programación de las Oficinas Locales de la Región

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Regional, **quiero** consultar la programación registrada por las Oficinas Locales de mi Región, **para** dar seguimiento a la planificación de sesiones y atenciones sin modificar la programación operativa local.

**Criterios de aceptación**

#### CA-01 — Restringir programación a la Región

**Dado** que el usuario pertenece a una Región, **cuando** abre Programación, **entonces** solo debe visualizar actividades correspondientes a las Oficinas Locales de esa Región.

#### CA-02 — Filtrar por Oficina Local

**Dado** que la Región contiene varias Oficinas Locales, **cuando** el usuario selecciona una, **entonces** deben mostrarse únicamente sus actividades.

#### CA-03 — Filtrar por establecimiento

**Dado** que existen actividades asociadas a establecimientos específicos, **cuando** el usuario selecciona uno, **entonces** deben mostrarse únicamente las actividades correspondientes.

#### CA-04 — Filtrar por estado

**Dado** que una actividad puede encontrarse Programada, Realizada, Reprogramada o Cancelada, **cuando** se selecciona un estado, **entonces** el listado debe actualizarse.

#### CA-05 — Combinar filtros

**Dado** que el usuario necesita revisar una parte específica de la programación, **cuando** combina Oficina Local, establecimiento y estado, **entonces** deben aplicarse todos los criterios simultáneamente.

#### CA-06 — Consultar información de la actividad

**Dado** que existe una actividad visible, **cuando** se presenta en el listado, **entonces** debe poder consultarse su fecha, tipo, propósito, Oficina Local, establecimiento, estado y motivo cuando corresponda.

#### CA-07 — Solo lectura

**Dado** que la creación y actualización de programación corresponde a Oficina Local, **cuando** un usuario Regional consulta una actividad, **entonces** no debe poder crearla, modificarla, reprogramarla, cancelarla ni marcarla como realizada.

---

### HU-046 — Consultar la programación de Atención Interdisciplinaria a nivel nacional

**Prioridad:** P1 **Estimación:** Pendiente **Estado:** CONFIRMADO

**Historia de Usuario**

**Como** usuario autorizado de Nivel Nacional, **quiero** consultar la programación registrada por las Oficinas Locales de todo el país y desagregarla territorialmente, **para** conocer la planificación de sesiones y atenciones sin modificar la programación operativa.

**Criterios de aceptación**

#### CA-01 — Consultar programación nacional

**Dado** que no existen filtros territoriales, **cuando** el usuario abre Programación, **entonces** debe visualizar actividades correspondientes a todo el ámbito nacional permitido.

#### CA-02 — Filtrar por Región

**Dado** que se desea consultar una Región específica, **cuando** se selecciona, **entonces** deben mostrarse únicamente sus actividades.

#### CA-03 — Filtrar por Oficina Local

**Dado** que se requiere analizar la planificación de una OL, **cuando** se selecciona, **entonces** deben mostrarse sus actividades.

#### CA-04 — Filtrar por establecimiento

**Dado** que algunas actividades pertenecen a establecimientos determinados, **cuando** se selecciona uno, **entonces** deben mostrarse únicamente las actividades correspondientes.

#### CA-05 — Filtrar por estado

**Dado** que las actividades pueden estar Programadas, Realizadas, Reprogramadas o Canceladas, **cuando** se selecciona un estado, **entonces** el listado debe actualizarse.

#### CA-06 — Mantener jerarquía de filtros

**Dado** que los filtros territoriales están relacionados, **cuando** se cambia Región u Oficina Local, **entonces** los filtros dependientes incompatibles deben limpiarse o actualizarse.

#### CA-07 — Consultar información de la actividad

**Dado** que existe una actividad visible, **cuando** se consulta el listado, **entonces** deben mostrarse al menos fecha, tipo, propósito, Región/OL según corresponda, establecimiento, estado y motivo cuando exista.

#### CA-08 — Solo lectura

**Dado** que Oficina Local es responsable de gestionar su programación, **cuando** Nacional consulta una actividad, **entonces** no debe poder crearla, modificarla, reprogramarla, cancelarla ni marcarla como realizada.


## HU-047 — Consultar información mediante asistente conversacional

**Prioridad:** P2  
**Estimación:** Pendiente  
**Estado:** EXPLORATORIO / DESEABLE — ETAPA POSTERIOR 2027  
**Alcance de la práctica 2026:** FUERA DEL ALCANCE DE IMPLEMENTACIÓN

### Historia de Usuario

Como usuario autorizado de SIA-CENCINAI, quiero realizar consultas en lenguaje natural sobre la información institucional disponible para mi rol y ámbito, para obtener respuestas comprensibles sin tener que construir manualmente filtros, consultas o consolidaciones complejas.

### Criterios de aceptación

#### CA-01 — Consulta en lenguaje natural

**Dado** que el usuario tiene acceso al asistente conversacional, **cuando** formula una pregunta en lenguaje natural, **entonces** el sistema debe interpretar la intención de la consulta antes de acceder a los datos necesarios para responderla.

#### CA-02 — Aplicar contexto autorizado

**Dado** que el usuario posee un rol y ámbito institucional determinados, **cuando** el asistente procesa una consulta, **entonces** debe aplicar previamente las mismas reglas de autorización, ámbito territorial y restricciones de acceso utilizadas por las demás funcionalidades de SIA-CENCINAI.

#### CA-03 — Seleccionar únicamente datos autorizados

**Dado** que la consulta requiere información institucional, **cuando** el sistema determina las fuentes, entidades o datos necesarios para responder, **entonces** únicamente debe utilizar aquellos autorizados para el usuario y habilitados para el asistente.

#### CA-04 — Generar consulta de solo lectura

**Dado** que el asistente ha identificado los datos necesarios, **cuando** construye o ejecuta una consulta sobre las fuentes institucionales, **entonces** esta debe ser exclusivamente de lectura y mantenerse restringida al contexto autorizado del usuario.

#### CA-05 — Respuesta basada en resultados obtenidos

**Dado** que la consulta devuelve información válida, **cuando** el asistente genera la respuesta, **entonces** debe formularla en lenguaje natural utilizando únicamente los datos obtenidos y autorizados para esa consulta.

#### CA-06 — Información insuficiente o sin resultados

**Dado** que la información disponible no permite responder adecuadamente la pregunta, **cuando** el asistente procesa la consulta, **entonces** debe indicarlo al usuario en lugar de completar la respuesta con información no sustentada por los datos disponibles.

#### CA-07 — Mantener restricciones frente a solicitudes del usuario

**Dado** que una pregunta solicita directa o indirectamente información fuera del ámbito autorizado, **cuando** el asistente la procesa, **entonces** no debe ampliar, omitir ni modificar las restricciones de acceso existentes para intentar responderla.

#### CA-08 — Contextualizar la respuesta

**Dado** que una respuesta depende de filtros, período, ámbito territorial u otros criterios relevantes, **cuando** el asistente presenta el resultado, **entonces** debe proporcionar al usuario contexto suficiente para comprender bajo qué alcance fue obtenida la respuesta.

#### CA-09 — Sin acciones operativas

**Dado** que esta funcionalidad se plantea inicialmente como mecanismo de consulta, **cuando** el usuario interactúa con el asistente, **entonces** este no debe crear, modificar, cerrar, trasladar ni eliminar registros operativos. 

---

# 9. Requerimientos funcionales

Los requerimientos funcionales especifican las capacidades que deberá ofrecer SIA-CENCINAI, los actores involucrados, su prioridad y la relación con las historias de usuario consolidadas.

La estructura utilizada es: **ID · Requerimiento funcional · Actor(es) involucrado(s) · Prioridad · HU relacionada(s)**.

## 9.1 Identidad, acceso, ámbito y consulta de clientes/beneficiarias

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-001** | El sistema deberá mantener una identidad única por cliente/beneficiaria y evitar la creación de registros duplicados cuando la persona ya exista en las fuentes institucionales disponibles. | Sistema; todos los niveles | **P0** | HU-005 a HU-012 |
| **RF-002** | El sistema deberá aplicar control de acceso por rol y ámbito institucional, diferenciando al menos Establecimiento, Oficina Local, Nivel Regional y Nivel Nacional, de forma que cada usuario solo pueda consultar o ejecutar las funciones autorizadas para su nivel. | Todos los niveles; Sistema | **P0** | HU-001 a HU-012; HU-023 a HU-035; HU-038 a HU-046 |
| **RF-003** | El sistema deberá mostrar de forma visible el rol activo y el ámbito institucional bajo el cual opera el usuario, por ejemplo establecimiento, Oficina Local, Región o Costa Rica, según corresponda. | Todos los niveles | **P1** | HU-001 a HU-004 |
| **RF-004** | El sistema deberá mostrar al profesional o Asistente 3 de Establecimiento un resumen operativo limitado a su establecimiento, incluyendo al menos referencias registradas y clientes/beneficiarias vinculados con Atención Interdisciplinaria, con accesos directos a las funciones permitidas. | Establecimiento (Profesional / Asistente 3) | **P1** | HU-001 |
| **RF-005** | El sistema deberá mostrar al personal autorizado de Oficina Local un resumen operativo de su ámbito, incluyendo referencias pendientes, casos activos, sesiones próximas, traslados pendientes de continuidad, actividades vencidas y próximas acciones registradas. | Oficina Local (Profesional EE.II. / Jefatura) | **P1** | HU-002 |
| **RF-006** | El sistema deberá mostrar al usuario Regional un resumen de la actividad de Atención Interdisciplinaria de su Región, incluyendo clientes/beneficiarias, casos activos, atenciones y programación de las Oficinas Locales bajo su ámbito. | Regional (ATE / Dirección Regional) | **P1** | HU-003 |
| **RF-007** | El sistema deberá mostrar al usuario Nacional un resumen de la actividad de Atención Interdisciplinaria del país, incluyendo clientes/beneficiarias, casos activos, atenciones y programación, con acceso a la consulta analítica nacional. | Nacional (UIVCD / UNAT) | **P1** | HU-004 |
| **RF-008** | El sistema deberá permitir buscar clientes/beneficiarias principalmente por número de identificación y secundariamente por nombre, restringiendo los resultados al ámbito institucional autorizado del usuario. | Todos los niveles | **P0** | HU-005 a HU-008 |
| **RF-009** | Cuando exista una coincidencia exacta por número de identificación, el sistema deberá darle precedencia sobre coincidencias aproximadas por nombre; una búsqueda por nombre podrá devolver múltiples resultados con información suficiente para distinguir a las personas. | Todos los niveles; Sistema | **P0** | HU-005 a HU-008 |
| **RF-010** | El sistema no deberá depender de listas desplegables masivas para seleccionar clientes/beneficiarias o casos; en los flujos con grandes volúmenes deberá utilizar mecanismos de búsqueda por identificación o nombre. | Establecimiento; Oficina Local | **P0** | HU-005; HU-006; HU-013; HU-019; HU-036; HU-037 |
| **RF-011** | El sistema deberá reutilizar los datos maestros disponibles de cada cliente/beneficiaria y conservar, cuando corresponda, la procedencia de dichos datos para evitar redigitación innecesaria. | Sistema; Establecimiento; Oficina Local | **P0** | HU-009; HU-010; HU-013 |
| **RF-012** | La consulta de clientes/beneficiarias deberá respetar el rol, ámbito institucional y establecimientos autorizados para el usuario. Para acceso de nivel Establecimiento, únicamente podrán consultarse clientes/beneficiarias pertenecientes a los establecimientos autorizados para ese usuario; Oficina Local podrá consultar los establecimientos pertenecientes a su Oficina Local; Regional únicamente los correspondientes a su Región; y Nacional podrá consultar el ámbito nacional permitido. | Todos los niveles; Sistema | **P0** | HU-005 a HU-012; HU-023 |
| **RF-013** | La consulta de clientes/beneficiarias deberá permitir filtros territoriales acordes con el nivel de acceso y limitar sus opciones al ámbito autorizado del usuario: - **Establecimiento:** si el usuario posee un único establecimiento autorizado, el sistema deberá aplicarlo automáticamente sin mostrar un filtro innecesario; si posee más de uno, deberá habilitar un filtro que permita seleccionar únicamente entre sus establecimientos autorizados. - **Oficina Local:** podrá filtrar por los establecimientos pertenecientes a su Oficina Local. - **Regional:** podrá filtrar por Oficina Local y establecimiento dentro de su Región. - **Nacional:** podrá filtrar por Región, Oficina Local y establecimiento dentro del ámbito nacional autorizado. | Establecimiento,Oficina Local; Regional; Nacional | **P0** | HU-005; HU-006; HU-007; HU-008; HU-023 |
| **RF-014** | Los filtros territoriales deberán ser dependientes entre sí: al cambiar una Región se deberán actualizar o limpiar las Oficinas Locales y establecimientos incompatibles, y al cambiar una Oficina Local se deberá actualizar o limpiar el establecimiento seleccionado. | Regional; Nacional; Sistema | **P0** | HU-007; HU-008; HU-032; HU-034; HU-040; HU-042; HU-045; HU-046 |
| **RF-015** | El sistema deberá mostrar la cantidad de resultados obtenidos respecto del total disponible cuando el usuario aplique búsquedas o filtros en listados de clientes/beneficiarias, casos o programación. | Todos los niveles | **P1** | HU-005 a HU-008; HU-023; HU-024; HU-032; HU-034; HU-044 a HU-046 |
| **RF-016** | El sistema deberá permitir consultar el perfil de un cliente/beneficiaria mostrando únicamente los datos y relaciones autorizados para el rol, incluyendo ubicación institucional y casos asociados cuando corresponda. | Todos los niveles | **P0** | HU-009 a HU-012 |
| **RF-017** | El perfil visible para Establecimiento deberá limitar la información de Atención Interdisciplinaria a datos básicos del caso y no deberá exponer prioridad, valoración situacional, plan de atención, atenciones detalladas, documentos, coordinaciones, traslados, reportes ni cierre. | Establecimiento (Profesional / Asistente 3) | **P0** | HU-009; HU-023 |
| **RF-018** | El perfil visible para Oficina Local deberá permitir consultar los datos básicos, casos asociados e historial autorizado del cliente/beneficiaria, con acceso al detalle operativo de los casos dentro de su ámbito. | Oficina Local (Profesional EE.II. / Jefatura) | **P0** | HU-010; HU-024; HU-025 |
| **RF-019** | Los niveles Regional y Nacional deberán poder consultar la información individual permitida y los casos asociados en modo de solo lectura, sin crear, modificar ni eliminar información operativa y respetando las restricciones aplicables a datos sensibles. | Regional; Nacional | **P0** | HU-011; HU-012; HU-033; HU-035 |
| **RF-020** | El sistema deberá permitir a Oficina Local, Regional y Nacional exportar listados de clientes/beneficiarias a Excel cuando el rol lo autorice, respetando el ámbito, la búsqueda y los filtros aplicados. | Oficina Local; Regional; Nacional | **P1** | HU-006; HU-007; HU-008 |

## 9.2 Detección y referencia

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-021** | El sistema deberá permitir que un profesional autorizado de Establecimiento u Oficina Local cree una referencia estructurada de Atención Interdisciplinaria únicamente para un cliente/beneficiaria comprendido dentro de su ámbito de acceso. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-022** | La referencia deberá registrar como mínimo fecha, tipo de referencia, origen de detección y profesional responsable, permitiendo distinguir entre una referencia de Urgencia y una No inmediata según el modelo vigente. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-023** | El sistema deberá permitir indicar como responsable de la referencia a una persona profesional diferente del usuario que realiza la digitación, conservando ambas trazabilidades cuando corresponda. | Establecimiento; Oficina Local | **P0** | HU-013; HU-016; HU-017 |
| **RF-024** | La referencia deberá permitir seleccionar múltiples motivos o hallazgos relacionados con crecimiento, desarrollo, salud y otros factores aplicables según los catálogos vigentes. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-025** | El sistema deberá permitir registrar una especificación textual para cada motivo, factor protector, factor de riesgo, signo de alerta u otro elemento seleccionado cuando se requiera contextualización adicional. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-026** | Si un elemento seleccionado posee una especificación asociada y posteriormente se elimina de la selección, el sistema deberá eliminar o invalidar también la especificación vinculada para evitar información huérfana. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013 |
| **RF-027** | La referencia deberá disponer de un espacio para registrar información relevante u observaciones que no queden representadas por los campos estructurados. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-028** | El flujo de creación de referencia deberá organizar la captura en etapas comprensibles, permitir regresar a etapas anteriores o cancelar y exigir la selección de un cliente/beneficiaria válido antes de continuar. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-029** | Antes de guardar una referencia, el sistema deberá mostrar un resumen completo de la información capturada para que el usuario pueda revisarla y corregirla. | Establecimiento; Oficina Local | **P0** | HU-013 |
| **RF-030** | Al guardar una referencia, el sistema deberá asociarla automáticamente con el cliente/beneficiaria, establecimiento, Oficina Local y Región correspondientes y asignarle el estado inicial definido para referencias pendientes de gestión. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013 |
| **RF-031** | El sistema deberá permitir al Establecimiento consultar una bandeja de referencias limitada a su establecimiento y a Oficina Local consultar las referencias de todos los establecimientos de su ámbito. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-032** | Los listados de referencias deberán mostrar información suficiente para identificarlas y gestionar su seguimiento, incluyendo al menos cliente/beneficiaria, identificación, establecimiento, responsable, estado y tipo. | Establecimiento; Oficina Local | **P0** | HU-015; HU-018 |
| **RF-033** | El sistema deberá permitir consultar el detalle de una referencia mostrando fecha, estado, tipo, origen, motivos, especificaciones, información relevante y profesional responsable, según los permisos del usuario. | Establecimiento; Oficina Local | **P0** | HU-016; HU-018 |
| **RF-034** | Oficina Local deberá poder registrar la recepción de una referencia remitida por un establecimiento, actualizando su estado de forma trazable sin requerir una validación previa del Nivel Regional para continuar el proceso. | Oficina Local; Sistema | **P0** | HU-018 |
| **RF-035** | El sistema deberá permitir generar una versión imprimible de la referencia que incluya la información esencial y la trazabilidad del profesional responsable para su uso como respaldo documental cuando corresponda. | Establecimiento; Oficina Local | **P1** | HU-017 |
| **RF-036** | El sistema deberá permitir descargar una plantilla estandarizada de referencia, cargar posteriormente un archivo compatible, validar su estructura, precargar los datos disponibles y exigir revisión humana antes del guardado definitivo. | Establecimiento; Oficina Local | **P1** | HU-014 |
| **RF-037** | Una referencia precargada desde plantilla deberá poder corregirse antes de confirmarse y, una vez revisada, deberá cumplir las mismas reglas de validación, asociación territorial y almacenamiento que una referencia digitada directamente en el sistema. | Establecimiento; Oficina Local; Sistema | **P1** | HU-014; HU-013 |

## 9.3 Sesión y valoración interdisciplinaria

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-038** | El sistema deberá permitir al Equipo Interdisciplinario de Oficina Local crear y consultar sesiones interdisciplinarias, registrando fecha, hora de inicio, hora de finalización, lugar y disciplinas participantes. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019 |
| **RF-039** | Una sesión interdisciplinaria podrá registrarse inicialmente sin casos asociados y deberá permitir incorporar casos posteriormente. | Equipo Interdisciplinario de Oficina Local | **P1** | HU-019 |
| **RF-040** | Para incorporar casos a una sesión, el sistema deberá permitir buscar referencias o casos por identificación o nombre dentro de la Oficina Local, asociar múltiples casos y evitar que una misma referencia se agregue más de una vez a la sesión. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-019 |
| **RF-041** | El sistema deberá permitir registrar una valoración situacional independiente para cada caso analizado en una sesión interdisciplinaria. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-042** | La valoración situacional deberá organizar los factores por los ámbitos Individual, Hogar/Familiar y Comunitario, permitiendo registrar en cada uno factores protectores, factores de riesgo y signos de alerta. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-043** | La valoración deberá permitir seleccionar múltiples factores, utilizar una opción «Otro» cuando el catálogo no cubra la situación y registrar una especificación textual para cualquier factor seleccionado que requiera contexto adicional. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-044** | La valoración situacional no deberá exigir como campos obligatorios intensidad, frecuencia ni persistencia para los factores registrados. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-020 |
| **RF-045** | El sistema deberá permitir al Equipo Interdisciplinario registrar explícitamente la resolución «Sí requiere A.I.» o «No requiere A.I.» y conservar la relación de la decisión con la referencia y la sesión donde se tomó. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-021 |
| **RF-046** | Cuando la resolución sea «No requiere A.I.», el sistema deberá conservar el resultado de la valoración sin abrir un caso activo de Atención Interdisciplinaria. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-021 |
| **RF-047** | Cuando la resolución sea «Sí requiere A.I.», el sistema deberá permitir definir prioridad, uno o más propósitos, estrategias, disciplinas y frecuencia inicial de atención antes de confirmar la apertura del caso. | Equipo Interdisciplinario de Oficina Local | **P0** | HU-022 |
| **RF-048** | Al confirmar la apertura, el sistema deberá crear un caso A.I. activo vinculado con el cliente/beneficiaria y la referencia de origen, conservar su ubicación institucional, actualizar el estado de la referencia según corresponda y registrar un evento de admisión en la línea de tiempo. | Equipo Interdisciplinario de Oficina Local; Sistema | **P0** | HU-022 |

## 9.4 Gestión y seguimiento del caso A.I.

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-049** | El sistema deberá ofrecer al usuario con acceso de nivel Establecimiento una **Lista de A.I. simplificada y restringida exclusivamente a sus establecimientos autorizados**, con búsqueda por identificación o nombre y únicamente con la información básica autorizada de cada caso.Cuando el usuario tenga un único establecimiento autorizado, el sistema deberá aplicarlo automáticamente; cuando tenga más de uno, deberá habilitar un filtro por establecimiento limitado exclusivamente a dichos establecimientos. | Establecimiento (Profesional / Asistente 3) | **P0** | HU-023 |
| **RF-050** | La Lista de A.I. del Establecimiento no deberá mostrar prioridad ni permitir el acceso al detalle interno del caso, la valoración situacional, el plan de atención, la línea de tiempo detallada, documentos, coordinaciones, traslados, reportes o cierre. | Establecimiento (Profesional / Asistente 3) | **P0** | HU-023 |
| **RF-051** | Oficina Local deberá poder buscar y filtrar los casos A.I. de su ámbito por identificación o nombre, establecimiento, estado y prioridad, combinando dichos criterios y mostrando la cantidad de resultados obtenidos. | Oficina Local | **P0** | HU-024 |
| **RF-052** | Nivel Regional deberá poder buscar y filtrar los casos A.I. de su Región por identificación o nombre, Oficina Local, establecimiento, estado y prioridad, sin acceder a casos de otras Regiones. | Regional (ATE / Dirección Regional) | **P0** | HU-032 |
| **RF-053** | Nivel Nacional deberá poder buscar y filtrar los casos A.I. del país por identificación o nombre, Región, Oficina Local, establecimiento, estado y prioridad, aplicando filtros jerárquicos dependientes. | Nacional (UIVCD / UNAT) | **P0** | HU-034 |
| **RF-054** | El sistema deberá permitir exportar a Excel los listados de casos autorizados para Oficina Local, Regional y Nacional, respetando la búsqueda, los filtros aplicados y el ámbito institucional del usuario. | Oficina Local; Regional; Nacional | **P1** | HU-024; HU-032; HU-034 |
| **RF-055** | Oficina Local deberá poder consultar el detalle integral de un caso A.I., incluyendo como mínimo identificación del caso, cliente/beneficiaria, establecimiento, fecha de apertura, estado, prioridad, resumen vigente, línea de tiempo y plan de atención. | Oficina Local | **P0** | HU-025 |
| **RF-056** | Regional y Nacional deberán poder consultar el detalle permitido de un caso en modo de solo lectura, incluyendo resumen, línea de tiempo y plan vigente, sin ejecutar acciones de gestión operativa reservadas a Oficina Local. | Regional; Nacional | **P0** | HU-033; HU-035 |
| **RF-057** | El sistema deberá mantener una línea de tiempo longitudinal por caso que integre los eventos relevantes de la atención, tales como admisión, atenciones individuales, atenciones grupales, coordinaciones cuando corresponda, traslados, reportes y cierre. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-025; HU-033; HU-035; HU-036; HU-037 |
| **RF-058** | Oficina Local deberá poder cargar y consultar documentos vinculados con un caso A.I., conservando como mínimo tipo, fecha, responsable y demás metadatos necesarios para su identificación. | Oficina Local | **P1** | HU-026 |
| **RF-059** | Oficina Local deberá poder registrar y consultar coordinaciones interinstitucionales asociadas a un caso, indicando institución, profesional responsable, motivo, fecha y estado de la coordinación. | Oficina Local | **P1** | HU-027 |
| **RF-060** | El sistema deberá permitir que el profesional responsable de una coordinación sea diferente del usuario que realiza la digitación y deberá conservar la trazabilidad correspondiente. | Oficina Local; Sistema | **P1** | HU-027 |
| **RF-061** | La Oficina Local de origen deberá poder registrar el traslado de un caso indicando Oficina Local destino, establecimiento destino, Región, fecha y motivo, cerrando su responsabilidad mediante un cierre específico por traslado sin eliminar el historial previo. | Oficina Local de origen | **P1** | HU-028 |
| **RF-062** | Al registrar un traslado, el sistema deberá generar para la Oficina Local destino un ingreso pendiente de continuidad vinculado con el caso de origen y conservar la relación histórica entre ambos ámbitos. | Oficina Local de origen; Oficina Local de destino; Sistema | **P1** | HU-028; HU-029 |
| **RF-063** | La Oficina Local de destino deberá poder consultar un ingreso por traslado y confirmar la continuidad cuando la persona efectivamente sea atendida en el nuevo ámbito; al confirmarla, el sistema deberá crear el caso activo correspondiente sin reabrir ni modificar retroactivamente el caso cerrado de origen. | Oficina Local de destino; Sistema | **P1** | HU-029 |
| **RF-064** | Oficina Local deberá poder generar un reporte de un caso activo sin cerrar el caso, indicando al menos tipo o propósito, fecha, responsable y motivo, y conservando el registro del reporte en el historial del caso. | Oficina Local | **P0** | HU-030 |
| **RF-065** | La generación de un reporte y el cierre de un caso deberán ser acciones independientes; generar un reporte no deberá modificar automáticamente el estado activo del caso. | Oficina Local; Sistema | **P0** | HU-030; HU-031 |
| **RF-066** | Oficina Local deberá poder cerrar un caso A.I. registrando fecha y motivo de cierre; al confirmarse, el sistema deberá cambiar el estado a Cerrado y agregar el evento correspondiente a la línea de tiempo. | Oficina Local; Sistema | **P0** | HU-031 |

## 9.5 Atenciones y seguimiento

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-067** | Oficina Local deberá permitir registrar una atención individual únicamente sobre casos activos de su ámbito, localizando el caso por identificación o nombre del cliente/beneficiaria. | Oficina Local | **P0** | HU-036 |
| **RF-068** | La atención individual deberá registrar como mínimo fecha real de atención, disciplina, tipo o estrategia, acciones realizadas, recomendaciones, profesional responsable y, cuando corresponda, próxima acción y fecha prevista. | Oficina Local | **P0** | HU-036 |
| **RF-069** | Al guardar una atención individual, el sistema deberá incorporarla automáticamente como un evento en la línea de tiempo del caso correspondiente, conservando la fecha real de atención separada de la fecha de digitación. | Oficina Local; Sistema | **P0** | HU-036 |
| **RF-070** | Oficina Local deberá poder registrar una atención grupal mediante un único registro base que incluya fecha, tipo de actividad, tema u objetivo, lugar, disciplinas, profesional o profesionales, acciones y recomendaciones generales. | Oficina Local | **P0** | HU-037 |
| **RF-071** | El sistema deberá permitir agregar múltiples participantes a una atención grupal mediante búsqueda por identificación o nombre dentro del ámbito de la Oficina Local, evitando duplicar a una misma persona en la actividad. | Oficina Local | **P0** | HU-037 |
| **RF-072** | La atención grupal deberá permitir registrar la asistencia individual de cada participante y deberá exigir como mínimo un tema u objetivo y al menos un participante antes de guardarse. | Oficina Local | **P0** | HU-037 |
| **RF-073** | Al guardar una atención grupal, el sistema deberá conservar un único registro de la actividad y reflejar la participación en el historial de cada participante que posea un caso A.I. activo, sin duplicar físicamente toda la atención. | Oficina Local; Sistema | **P0** | HU-037 |
| **RF-074** | Cuando una persona participe en una actividad grupal sin poseer un caso A.I. activo, el sistema podrá conservar su participación en el registro grupal sin crear un evento en una línea de tiempo de A.I. inexistente. | Oficina Local; Sistema | **P1** | HU-037 |

## 9.6 Programación

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-075** | Oficina Local deberá poder crear actividades programadas registrando fecha, tipo de actividad, título o propósito, establecimiento cuando corresponda y observaciones. | Oficina Local | **P0** | HU-044 |
| **RF-076** | Toda actividad nueva deberá iniciar en estado Programada y el sistema deberá permitir actualizarla posteriormente a Realizada, Reprogramada o Cancelada. | Oficina Local | **P0** | HU-044 |
| **RF-077** | Cuando una actividad se marque como Reprogramada, el sistema deberá exigir una nueva fecha y un motivo antes de guardar el cambio. | Oficina Local | **P0** | HU-044 |
| **RF-078** | Cuando una actividad se marque como Cancelada, el sistema deberá exigir un motivo antes de guardar el cambio. | Oficina Local | **P0** | HU-044 |
| **RF-079** | Oficina Local deberá poder consultar y filtrar su programación por establecimiento y estado, mostrando la información principal de cada actividad y la cantidad de resultados obtenidos. | Oficina Local | **P1** | HU-044 |
| **RF-080** | El sistema deberá alertar a Oficina Local cuando una actividad permanezca en estado Programada después de su fecha prevista, para que pueda resolverse como Realizada, Reprogramada o Cancelada. | Oficina Local; Sistema | **P1** | HU-002; HU-044 |
| **RF-081** | Nivel Regional deberá poder consultar, sin editar, la programación de las Oficinas Locales de su Región y filtrarla por Oficina Local, establecimiento y estado. | Regional (ATE / Dirección Regional) | **P1** | HU-045 |
| **RF-082** | Nivel Nacional deberá poder consultar, sin editar, la programación del país y filtrarla jerárquicamente por Región, Oficina Local, establecimiento y estado. | Nacional (UIVCD / UNAT) | **P1** | HU-046 |

## 9.7 Reportería, analítica y consolidaciones

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-083** | La reportería de Oficina Local deberá limitarse a su ámbito y permitir filtrar por año o período, establecimiento, estado del caso, prioridad, disciplina y profesional, según aplique a cada indicador. | Oficina Local (Profesional / Jefatura) | **P1** | HU-038 |
| **RF-084** | La reportería Regional deberá limitarse a la Región del usuario y permitir filtrar por año o período, Oficina Local, establecimiento, estado del caso, prioridad, disciplina y profesional. | Regional (ATE / Dirección Regional) | **P0** | HU-040 |
| **RF-085** | La reportería Nacional deberá permitir consultar el país completo y desagregar la información por Región, Oficina Local y establecimiento, además de aplicar filtros por año o período, estado, prioridad, disciplina y profesional. | Nacional (UIVCD / UNAT) | **P0** | HU-042 |
| **RF-086** | Los filtros territoriales utilizados en reportería deberán funcionar jerárquicamente y actualizar o limpiar los niveles inferiores cuando cambie un nivel superior. | Regional; Nacional; Sistema | **P0** | HU-040; HU-042 |
| **RF-087** | La reportería deberá mostrar, según el ámbito y corte seleccionado, al menos cantidad de casos, cantidad de referencias, personas únicas atendidas y total de atenciones realizadas. | Oficina Local; Regional; Nacional | **P0** | HU-038; HU-040; HU-042 |
| **RF-088** | El sistema deberá diferenciar explícitamente entre «personas únicas atendidas» y «total de atenciones»: una persona se contará una sola vez en la primera métrica y cada atención realizada se contabilizará en la segunda. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 |
| **RF-089** | La reportería deberá permitir visualizar la distribución de casos por estado y por prioridad para el corte seleccionado. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-090** | La reportería deberá permitir comparar por disciplina la cantidad de clientes/beneficiarias únicos atendidos y la cantidad total de atenciones realizadas. | Oficina Local; Regional; Nacional | **P1** | HU-038; HU-040; HU-042 |
| **RF-091** | Cuando se utilicen filtros de disciplina o profesional, el sistema deberá aplicar dichos filtros únicamente a los indicadores funcionalmente relacionados o dejar claramente identificado qué métricas están siendo afectadas, evitando interpretaciones ambiguas del corte. | Oficina Local; Regional; Nacional; Sistema | **P0** | HU-038; HU-040; HU-042 |
| **RF-092** | Oficina Local deberá poder generar una consolidación dinámica de su ámbito o de un establecimiento seleccionado, utilizando el período y filtros vigentes. | Oficina Local (Profesional / Jefatura) | **P1** | HU-039 |
| **RF-093** | Nivel Regional deberá poder generar consolidaciones dinámicas de su Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. | Regional (ATE / Dirección Regional) | **P1** | HU-041 |
| **RF-094** | Nivel Nacional deberá poder generar consolidaciones dinámicas del país, de una Región, de una Oficina Local o de un establecimiento, utilizando el período y filtros vigentes. | Nacional (UIVCD / UNAT) | **P1** | HU-043 |
| **RF-095** | Regional y Nacional deberán poder obtener consolidaciones directamente a partir de la información a la que tienen acceso, sin exigir un flujo manual de remisión, aprobación o devolución de archivos entre niveles institucionales. | Regional; Nacional; Sistema | **P1** | HU-041; HU-043 |
| **RF-096** | El sistema deberá permitir descargar las consolidaciones autorizadas en un archivo compatible con Excel, respetando los filtros aplicados e identificando al menos el período y el ámbito utilizados para generar la salida. | Oficina Local; Regional; Nacional | **P1** | HU-039; HU-041; HU-043 |

## 9.8 Requerimientos funcionales transversales e integración

| ID | Requerimiento funcional | Actor(es) involucrado(s) | Prioridad | HU relacionada(s) |
| --- | --- | --- | --- | --- |
| **RF-097** | El sistema deberá conservar trazabilidad de las acciones relevantes, diferenciando al menos el autor o responsable de la acción, la fecha real del evento y la fecha de digitación cuando estas no coincidan. | Sistema; Establecimiento; Oficina Local | **P0** | HU-013; HU-027; HU-030; HU-031; HU-036; HU-037 |
| **RF-098** | Los formularios extensos de captura deberán permitir autoguardar y recuperar borradores para reducir la pérdida de información ante interrupciones, siempre que el flujo y las reglas de seguridad lo permitan. | Establecimiento; Oficina Local; Sistema | **P0** | HU-013; HU-019; HU-020; HU-036; HU-037 |
| **RF-099** | El sistema deberá utilizar catálogos configurables para elementos sujetos a evolución institucional, tales como motivos, factores, prioridades, estrategias, disciplinas, frecuencias, instituciones y tipos de actividad, evitando valores rígidos cuando sea técnicamente viable. | Sistema; administración técnica por definir | **P1** | Transversal |
| **RF-100** | El sistema deberá permitir versionar formularios, catálogos o reglas cuando cambien con el tiempo, preservando la interpretación de los registros históricos creados bajo versiones anteriores. | Sistema; administración técnica por definir | **P1** | Transversal |
| **RF-101** | El sistema deberá contemplar mecanismos controlados de importación o migración de información histórica cuando existan datos institucionales previos que deban incorporarse al módulo, validando su estructura y evitando duplicados. | Sistema; equipo técnico | **P1** | Transversal |
| **RF-102** | Cuando exista integración con resultados de vigilancia o tamizaje, el sistema deberá reutilizar los datos disponibles para evitar redigitación; el punto exacto de entrada de esos hallazgos al flujo de A.I. deberá definirse antes de automatizar decisiones. | Sistema; Establecimiento; Oficina Local | **P1** | HU-013; transversal |
| **RF-103** | La implementación deberá aplicar permisos reforzados a información o acciones sensibles según las reglas institucionales de acceso, de manera complementaria al control general por rol y ámbito. | Sistema; Oficina Local; Regional; Nacional | **P0** | HU-011; HU-012; HU-033; HU-035 |
| **RF-104** | El sistema deberá obtener y respetar, mediante el mecanismo institucional de autorización vigente, los establecimientos previamente autorizados para cada usuario con acceso de nivel Establecimiento, sin mantener en SIA-CENCINAI una asignación paralela de establecimientos.Cuando el usuario posea un único establecimiento autorizado, el sistema deberá aplicarlo automáticamente en las vistas que requieran contexto de establecimiento y no deberá mostrar un filtro de selección innecesario.Cuando el usuario posea más de un establecimiento autorizado, las vistas que requieran desagregación por establecimiento deberán habilitar un filtro cuyas opciones se limiten exclusivamente a dichos establecimientos. | Establecimiento (Profesional / Asistente 3); Sistema | **P0** | HU-005; HU-023 |
| **RF-105 **(EXPLORATORIO / POSTERIOR 2027) | El sistema deberá contemplar, como funcionalidad futura, un asistente conversacional que permita a usuarios autorizados formular consultas en lenguaje natural sobre la información disponible en SIA-CENCINAI y recibir respuestas en lenguaje natural. | Todos los niveles autorizados; Sistema | **P2** | HU-047 |
| **RF-106** (EXPLORATORIO / POSTERIOR 2027) | Antes de resolver una consulta conversacional, el sistema deberá determinar y aplicar el rol, ámbito institucional, establecimientos autorizados cuando corresponda y demás restricciones de acceso vigentes para el usuario, de forma que el asistente no pueda ampliar los permisos disponibles mediante la interacción en lenguaje natural. | Todos los niveles autorizados; Sistema | P0 para una eventual implementación | HU-047; RF-002; RF-103; RF-104 |
| **RF-107** (EXPLORATORIO / POSTERIOR 2027) | El asistente conversacional deberá identificar y utilizar únicamente las fuentes, entidades, tablas, vistas, campos o servicios de datos previamente habilitados para esta funcionalidad y compatibles con el contexto autorizado del usuario.La selección de datos deberá realizarse después de establecer el contexto de autorización y antes de construir o ejecutar la consulta correspondiente. | Sistema | P0 para una eventual implementación | HU-047 |
| **RF-108** (EXPLORATORIO / POSTERIOR 2027) | Las consultas generadas o ejecutadas por el asistente deberán ser exclusivamente de lectura, validarse antes de su ejecución y restringirse a las fuentes y datos autorizados.El asistente no deberá ejecutar mediante esta funcionalidad operaciones de creación, actualización, eliminación, traslado, cierre u otras modificaciones sobre información operativa. | Sistema | P0 para una eventual implementación | HU-047 |
| **RF-109** (EXPLORATORIO / POSTERIOR 2027) | El asistente deberá generar la respuesta en lenguaje natural a partir de los resultados efectivamente obtenidos de las fuentes autorizadas para la consulta.Cuando los resultados sean inexistentes, insuficientes, ambiguos o no permitan sustentar una respuesta, el sistema deberá informarlo al usuario y no presentar información no respaldada por los datos consultados. | Todos los niveles autorizados; Sistema | P1 | HU-047 |
| **RF-110** (EXPLORATORIO / POSTERIOR 2027) | Cuando resulte relevante para interpretar el resultado, el asistente deberá indicar el ámbito, período, filtros o criterios principales utilizados para resolver la consulta, sin revelar información técnica o sensible que el usuario no esté autorizado a conocer. | Todos los niveles autorizados; Sistema | P1 | HU-047 |
| **RF-111** (EXPLORATORIO / POSTERIOR 2027) | El sistema deberá conservar trazabilidad suficiente de las consultas realizadas mediante el asistente conversacional para permitir su revisión técnica y funcional, incluyendo al menos el usuario, fecha y hora, contexto de autorización utilizado, consulta realizada y resultado general de su procesamiento, conforme a las reglas institucionales de seguridad y privacidad que se definan para esta funcionalidad. | Sistema; Administrador autorizado | P0 para una eventual implementación | HU-047 |

---

# 10. Casos de Uso

Los casos de uso describen las interacciones funcionales entre los actores institucionales y SIA-CENCINAI. Cada caso representa un objetivo funcional completo y mantiene una estructura uniforme para facilitar su revisión y su posterior representación mediante diagramas.

Todos los casos de uso incluyen: **Nombre, Autor, Fecha, Descripción, Actores, Precondiciones, Flujo Normal, Flujo Alternativo y Poscondiciones**.

## 10.0 Índice de casos de uso

| ID | Caso de uso | Actor principal / ámbito |
| --- | --- | --- |
| **CU-01** | Consultar resumen de Atención Interdisciplinaria según rol | Todos los niveles |
| **CU-02** | Buscar y seleccionar un cliente/beneficiaria | Todos los niveles |
| **CU-03** | Consultar perfil de un cliente/beneficiaria según nivel de acceso | Todos los niveles |
| **CU-04** | Crear manualmente una referencia a Atención Interdisciplinaria | Establecimiento / OL |
| **CU-05** | Cargar una referencia desde plantilla estandarizada | Establecimiento / OL |
| **CU-06** | Consultar y gestionar referencias según ámbito | Establecimiento / OL |
| **CU-07** | Gestionar una sesión interdisciplinaria | EE.II. — OL |
| **CU-08** | Registrar valoración situacional de un caso | EE.II. — OL |
| **CU-09** | Resolver si un caso requiere Atención Interdisciplinaria | EE.II. — OL |
| **CU-10** | Definir abordaje inicial y abrir un caso de Atención Interdisciplinaria | EE.II. — OL |
| **CU-11** | Consultar lista simplificada de A.I. desde Establecimiento | Establecimiento |
| **CU-12** | Consultar y filtrar casos A.I. de la Oficina Local | Oficina Local |
| **CU-13** | Consultar detalle integral de un caso A.I. en Oficina Local | Oficina Local |
| **CU-14** | Consultar y filtrar casos A.I. de la Región | Regional |
| **CU-15** | Consultar detalle de un caso A.I. desde Nivel Regional | Regional |
| **CU-16** | Consultar y filtrar casos A.I. a Nivel Nacional | Nacional |
| **CU-17** | Consultar detalle de un caso A.I. desde Nivel Nacional | Nacional |
| **CU-18** | Gestionar documentos asociados a un caso A.I. | Oficina Local |
| **CU-19** | Registrar una coordinación interinstitucional | Oficina Local |
| **CU-20** | Trasladar un caso a otra Oficina Local | OL origen |
| **CU-21** | Confirmar continuidad de un caso recibido por traslado | OL destino |
| **CU-22** | Generar un reporte de un caso sin cerrarlo | Oficina Local |
| **CU-23** | Cerrar un caso de Atención Interdisciplinaria | Oficina Local |
| **CU-24** | Registrar una atención individual | Oficina Local |
| **CU-25** | Registrar una atención grupal para múltiples participantes | Oficina Local |
| **CU-26** | Gestionar la programación operativa de Oficina Local | Oficina Local |
| **CU-27** | Consultar programación desde Nivel Regional | Regional |
| **CU-28** | Consultar programación desde Nivel Nacional | Nacional |
| **CU-29** | Consultar reportería analítica de Oficina Local | Oficina Local |
| **CU-30** | Consultar reportería analítica Regional | Regional |
| **CU-31** | Consultar reportería analítica Nacional | Nacional |
| **CU-32** | Generar y descargar una consolidación dinámica | OL / Regional / Nacional |
| **CU-33** | Administrar catálogos y versiones funcionales | Administrador autorizado |
| **CU-34** | Importar o migrar información histórica | Equipo técnico autorizado |
| **CU-35** | Consultar información mediante asistente conversacional | Usuario autorizado de SIA-CENCINAI; Sistema / Asistente conversacional |

## 10.1 Identidad, acceso y consulta de clientes/beneficiarias

### CU-01 — Consultar resumen de Atención Interdisciplinaria según rol

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-01 — Consultar resumen de Atención Interdisciplinaria según rol |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite que un usuario autorizado consulte, desde la página de inicio, un resumen de la actividad de Atención Interdisciplinaria correspondiente a su ámbito institucional y acceda a las funciones de seguimiento habilitadas para su rol. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El sistema conoce el rol y ámbito institucional del usuario. |
| **Flujo Normal** | 1. **Usuario:** Ingresa a la página de Inicio. 2. **Sistema:** Identifica el rol activo y determina el ámbito autorizado. 3. **Sistema:** Muestra el contexto institucional correspondiente al usuario. 4. **Sistema:** Calcula y presenta los indicadores disponibles para el rol. 5. **Usuario:** Selecciona un indicador o acceso rápido. 6. **Sistema:** Abre la sección correspondiente conservando el ámbito y permisos del usuario. |
| **Flujo Alternativo** | **FA-01 — Establecimiento** — El sistema muestra únicamente información del establecimiento, incluyendo referencias y clientes/beneficiarias relacionados con A.I., además de accesos a las funciones permitidas. **FA-02 — Oficina Local** — El sistema muestra referencias pendientes, casos activos, sesiones próximas, traslados pendientes de continuidad, actividades vencidas y próximas acciones, según disponibilidad. **FA-03 — Regional** — El sistema resume clientes/beneficiarias, casos activos, atenciones y programación exclusivamente de la Región asignada. **FA-04 — Nacional** — El sistema resume la actividad disponible a nivel país y permite acceder a la consulta analítica y de programación nacional. **FA-05 — Sin datos** — Si no existen registros para un indicador, el sistema muestra valor cero o un mensaje equivalente sin ampliar el ámbito del usuario. |
| **Poscondiciones** | 1. El usuario visualiza un resumen coherente con su rol y ámbito. 2. Si seleccionó una acción, queda ubicado en la sección correspondiente sin alterar datos operativos. |

*Figura 1: Diagrama de procesos de Caso de Uso CU-01*

### CU-02 — Buscar y seleccionar un cliente/beneficiaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-02 — Buscar y seleccionar un cliente/beneficiaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite localizar un cliente/beneficiaria por identificación o nombre dentro del ámbito autorizado del usuario y seleccionarlo para consulta o para continuar un flujo que requiera asociar una persona. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El usuario tiene acceso a una función que requiere localizar un cliente/beneficiaria. |
| **Flujo Normal** | 1. **Usuario:** Ingresa un número de identificación o un nombre en el buscador. 2. **Sistema:** Determina el ámbito institucional autorizado para el usuario. 3. **Sistema:** Busca coincidencias únicamente dentro de ese ámbito. 4. **Sistema:** Da precedencia a una coincidencia exacta por identificación y muestra las coincidencias por nombre cuando corresponda. 5. **Sistema:** Presenta resultados con información suficiente para distinguir a las personas. 6. **Usuario:** Selecciona el cliente/beneficiaria requerido. 7. **Sistema:** Carga la selección y reutiliza los datos maestros disponibles para continuar el flujo. |
| **Flujo Alternativo** | **FA-01 — Sin resultados** — El sistema informa que no existen coincidencias dentro del ámbito autorizado y no permite crear silenciosamente un duplicado. **FA-02 — Varias coincidencias por nombre** — El sistema muestra todas las coincidencias permitidas para que el usuario seleccione la correcta. **FA-03 — Resultado fuera de ámbito** — El sistema no muestra ni permite seleccionar registros que estén fuera del ámbito autorizado. **FA-04 — Cambio de selección** — Antes de guardar el flujo dependiente, el usuario puede retirar la selección y realizar una nueva búsqueda.**FA-05 — Múltiples establecimientos autorizados** — Cuando un usuario con acceso de nivel Establecimiento posee más de un establecimiento autorizado, el sistema habilita un filtro por establecimiento y limita sus opciones exclusivamente a los establecimientos autorizados para ese usuario.**FA-06 — Único establecimiento autorizado** — Cuando un usuario con acceso de nivel Establecimiento posee un único establecimiento autorizado, el sistema aplica dicho establecimiento automáticamente y no muestra el filtro de establecimiento. |
| **Poscondiciones** | 1. Queda seleccionado un cliente/beneficiaria válido dentro del ámbito autorizado. 2. Los datos maestros disponibles quedan listos para ser reutilizados en el flujo invocante. |

*Figura 2: Diagrama de procesos de Caso de Uso CU-02*

### CU-03 — Consultar perfil de un cliente/beneficiaria según nivel de acceso

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-03 — Consultar perfil de un cliente/beneficiaria según nivel de acceso |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite consultar la información disponible de un cliente/beneficiaria y sus relaciones con Atención Interdisciplinaria, aplicando una vista diferente según el nivel institucional y los permisos de acceso. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El cliente/beneficiaria fue localizado dentro del ámbito autorizado. |
| **Flujo Normal** | 1. **Usuario:** Selecciona un cliente/beneficiaria. 2. **Sistema:** Valida el rol y ámbito del usuario. 3. **Sistema:** Muestra los datos básicos permitidos y la ubicación institucional de la persona. 4. **Sistema:** Consulta los casos A.I. asociados que el usuario está autorizado a conocer. 5. **Usuario:** Selecciona la sección de resumen, casos o historial disponible para su rol. 6. **Sistema:** Presenta la información permitida sin exponer datos restringidos. 7. **Usuario:** Opcionalmente selecciona un caso cuando su rol permite acceder a su detalle. |
| **Flujo Alternativo** | **FA-01 — Establecimiento** — El sistema muestra únicamente información básica y una vista limitada de los casos; no permite abrir el detalle interno del caso ni visualizar información sensible de A.I. **FA-02 — Oficina Local** — El sistema permite consultar datos básicos, casos asociados e historial autorizado y navegar al detalle operativo de los casos de su OL. **FA-03 — Regional** — El sistema permite consulta dentro de la Región en modo solo lectura y aplica restricciones adicionales sobre información sensible. **FA-04 — Nacional** — El sistema permite consulta a nivel país en modo solo lectura y aplica las reglas institucionales de acceso a información sensible. **FA-05 — Sin casos A.I.** — El sistema informa que la persona no posee casos A.I. visibles para el usuario. **FA-06 — Exportación autorizada** — Oficina Local, Regional o Nacional pueden exportar el listado visible de clientes/beneficiarias respetando filtros, búsqueda y ámbito. Establecimiento no dispone de esta exportación. |
| **Poscondiciones** | 1. La información consultada no se modifica. 2. El usuario mantiene el mismo ámbito y nivel de permisos durante toda la consulta. |

*Figura 3: Diagrama de procesos de Caso de Uso CU-03*

## 10.2 Detección y referencia

### CU-04 — Crear manualmente una referencia a Atención Interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-04 — Crear manualmente una referencia a Atención Interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a un profesional autorizado de Establecimiento u Oficina Local registrar una referencia estructurada para un cliente/beneficiaria de su ámbito, documentando la trazabilidad, los motivos y la información relevante para su posterior análisis interdisciplinario. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado con permiso para crear referencias. 2. El cliente/beneficiaria existe y pertenece al ámbito autorizado. |
| **Flujo Normal** | 1. **Usuario:** Inicia la creación de una nueva referencia y elige la captura manual. 2. **Usuario:** Busca y selecciona al cliente/beneficiaria por identificación o nombre. 3. **Sistema:** Reutiliza los datos maestros disponibles y determina establecimiento, Oficina Local y Región. 4. **Usuario:** Registra la fecha y selecciona el tipo de referencia. 5. **Usuario:** Selecciona el origen de detección e indica el profesional responsable. 6. **Usuario:** Selecciona uno o varios motivos, hallazgos o factores aplicables. 7. **Usuario:** Agrega una especificación textual a cualquier elemento seleccionado que requiera contexto adicional. 8. **Usuario:** Registra información relevante u observaciones complementarias. 9. **Sistema:** Presenta un resumen completo de la referencia antes de guardar.  10. **Usuario:** Revisa la información y confirma el registro. 11. **Sistema:** Valida los campos obligatorios, guarda la referencia, la asocia con la jerarquía institucional del cliente/beneficiaria y asigna el estado inicial correspondiente. |
| **Flujo Alternativo** | **FA-01 — Persona no seleccionada** — El sistema impide avanzar hasta que exista un cliente/beneficiaria válido. **FA-02 — Responsable distinto del digitador** — El usuario selecciona al profesional que realizó la referencia; el sistema conserva la trazabilidad del digitador y del responsable cuando corresponda. **FA-03 — Elemento «Otro»** — El usuario selecciona «Otro» y registra la especificación necesaria. **FA-04 — Desmarcar elemento** — Si se elimina un motivo o factor que tenía detalle asociado, el sistema elimina o invalida también esa especificación. **FA-05 — Corrección antes de guardar** — El usuario regresa a una etapa anterior, modifica la información y vuelve al resumen. **FA-06 — Cancelación** — El usuario cancela la captura y el sistema no crea la referencia definitiva. **FA-07 — Interrupción de captura** — Si existe un borrador autoguardado, el usuario puede recuperarlo al regresar al flujo, sujeto a las reglas de seguridad definidas. |
| **Poscondiciones** | 1. La referencia queda registrada y vinculada con el cliente/beneficiaria y su ámbito institucional. 2. La referencia queda disponible en las bandejas autorizadas para su seguimiento. |

*Figura 4: Diagrama de procesos de Caso de Uso CU-04*

### CU-05 — Cargar una referencia desde plantilla estandarizada

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-05 — Cargar una referencia desde plantilla estandarizada |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite cargar una referencia previamente capturada en una plantilla estandarizada, precargar el formulario y exigir revisión humana antes de registrar la referencia definitiva. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado con permiso para crear referencias. 2. Existe una plantilla estandarizada disponible para descarga o un archivo previamente completado. |
| **Flujo Normal** | 1. **Usuario:** Inicia una nueva referencia y selecciona la opción de cargar plantilla estandarizada. 2. **Sistema:** Permite descargar la plantilla vigente si el usuario la necesita. 3. **Usuario:** Selecciona el archivo completado. 4. **Sistema:** Valida que el archivo corresponda con la estructura esperada. 5. **Sistema:** Lee los datos compatibles y precarga el formulario de referencia. 6. **Sistema:** Indica que la información precargada debe ser revisada antes de guardarse. 7. **Usuario:** Revisa y corrige los valores precargados. 8. **Sistema:** Aplica las mismas validaciones utilizadas en la captura manual. 9. **Usuario:** Confirma el registro.  10. **Sistema:** Guarda la referencia y la vincula con la jerarquía institucional correspondiente. |
| **Flujo Alternativo** | **FA-01 — Archivo inválido** — El sistema informa el problema de estructura o formato y no crea la referencia. **FA-02 — Cliente/beneficiaria no localizado** — El sistema solicita resolver la identificación de la persona antes de permitir el guardado definitivo. **FA-03 — Datos incompletos** — El sistema mantiene los campos pendientes para que el usuario los complete manualmente. **FA-04 — Corrección de datos** — El usuario modifica cualquier dato precargado antes de confirmar. **FA-05 — Cancelación** — El usuario cancela el proceso y no se registra una referencia definitiva. |
| **Poscondiciones** | 1. La referencia queda registrada bajo las mismas reglas que una referencia digitada manualmente. 2. Se conserva la trazabilidad de la captura y del profesional responsable según corresponda. |

*Figura 5: Diagrama de procesos de Caso de Uso CU-05*

### CU-06 — Consultar y gestionar referencias según ámbito

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-06 — Consultar y gestionar referencias según ámbito |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Establecimiento consultar las referencias de su propio establecimiento y a Oficina Local consultar las referencias de todos sus establecimientos, revisar su detalle y, en el caso de Oficina Local, registrar la recepción de una referencia remitida. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. Existen referencias dentro de su ámbito o el sistema puede mostrar una bandeja vacía. |
| **Flujo Normal** | 1. **Usuario:** Abre la sección Referencias. 2. **Sistema:** Determina el ámbito autorizado según el rol. 3. **Sistema:** Muestra la bandeja de referencias con cliente/beneficiaria, identificación, establecimiento, responsable, estado y tipo. 4. **Usuario:** Selecciona una referencia. 5. **Sistema:** Muestra fecha, estado, origen, motivos, especificaciones, información relevante y responsable. 6. **Usuario:** Consulta la información y decide si requiere una acción adicional permitida. |
| **Flujo Alternativo** | **FA-01 — Establecimiento** — El usuario únicamente consulta sus referencias y su detalle; no puede registrar su recepción en Oficina Local. **FA-02 — Oficina Local recibe referencia** — El usuario selecciona la acción de recepción; el sistema valida el estado, actualiza la referencia de forma trazable y permite continuar el proceso sin validación Regional previa. **FA-03 — Imprimir referencia** — El usuario solicita una versión imprimible; el sistema genera un resumen con identificación, fecha, establecimiento, tipo, origen, responsable, motivos, especificaciones e información relevante. **FA-04 — Sin referencias** — El sistema muestra la bandeja vacía sin ampliar el ámbito del usuario. |
| **Poscondiciones** | 1. La consulta no modifica la referencia salvo cuando Oficina Local registra formalmente su recepción. 2. Si se imprimió la referencia, se genera una representación documental sin alterar el registro original. |

*Figura 6: Diagrama de procesos de Caso de Uso CU-06*

## 10.3 Sesión y valoración interdisciplinaria

### CU-07 — Gestionar una sesión interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-07 — Gestionar una sesión interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario de Oficina Local crear una sesión, registrar sus datos generales e incorporar múltiples referencias o casos para analizarlos individualmente. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. El usuario pertenece a Oficina Local y tiene permiso para gestionar sesiones. 2. Las referencias que se incorporen pertenecen al ámbito de la Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Sesiones interdisciplinarias. 2. **Sistema:** Muestra las sesiones existentes de la Oficina Local. 3. **Usuario:** Crea una nueva sesión. 4. **Usuario:** Registra fecha, hora de inicio, hora de finalización, lugar y disciplinas participantes. 5. **Usuario:** Guarda la sesión. 6. **Sistema:** Registra la sesión con su estado inicial. 7. **Usuario:** Busca referencias o casos por identificación o nombre. 8. **Sistema:** Muestra únicamente candidatos permitidos dentro de la Oficina Local. 9. **Usuario:** Agrega uno o varios casos a la sesión.  10. **Sistema:** Asocia los casos evitando duplicados. 11. **Usuario:** Selecciona individualmente los casos de la sesión para continuar con su valoración. |
| **Flujo Alternativo** | **FA-01 — Sesión sin casos iniciales** — El usuario guarda la sesión sin casos y los incorpora posteriormente. **FA-02 — Caso ya agregado** — El sistema evita que la misma referencia se agregue nuevamente. **FA-03 — Sin coincidencias** — El sistema informa que no existen referencias o casos que cumplan la búsqueda dentro del ámbito. **FA-04 — Interrupción de captura** — Si existe un borrador válido, el sistema permite recuperar los datos de la sesión antes de su confirmación definitiva. |
| **Poscondiciones** | 1. La sesión queda registrada dentro de la Oficina Local. 2. Los casos incorporados quedan disponibles para su análisis individual en la sesión. |

*Figura 7: Diagrama de procesos de Caso de Uso CU-07*

### CU-08 — Registrar valoración situacional de un caso

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-08 — Registrar valoración situacional de un caso |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario registrar de forma estructurada los factores protectores, factores de riesgo y signos de alerta identificados en los ámbitos Individual, Hogar/Familiar y Comunitario para un caso analizado. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. Existe una sesión interdisciplinaria accesible. 2. El caso o referencia fue incorporado a la sesión. |
| **Flujo Normal** | 1. **Usuario:** Selecciona un caso dentro de la sesión. 2. **Sistema:** Muestra la información disponible de la referencia y el formulario de valoración. 3. **Usuario:** Revisa el ámbito Individual y selecciona los factores protectores, de riesgo y signos de alerta que correspondan. 4. **Usuario:** Repite el análisis para el ámbito Hogar/Familiar. 5. **Usuario:** Repite el análisis para el ámbito Comunitario. 6. **Usuario:** Agrega una especificación textual a cualquier factor seleccionado que requiera contexto adicional. 7. **Usuario:** Registra los comentarios o resumen de valoración que correspondan. 8. **Sistema:** Conserva la valoración asociada al caso analizado. |
| **Flujo Alternativo** | **FA-01 — Factor no catalogado** — El usuario selecciona «Otro» y registra la especificación correspondiente. **FA-02 — Múltiples factores** — El sistema permite registrar varios factores simultáneamente dentro de un mismo ámbito y categoría. **FA-03 — Factor desmarcado** — Si se elimina un factor seleccionado, el sistema elimina o invalida el detalle asociado. **FA-04 — Campos no requeridos** — El sistema no exige intensidad, frecuencia ni persistencia como parte obligatoria de la valoración. **FA-05 — Interrupción** — Si existe un borrador válido de la valoración, el usuario puede recuperarlo antes de confirmar. |
| **Poscondiciones** | 1. La valoración situacional queda vinculada con el caso analizado. 2. La valoración queda disponible para sustentar la resolución sobre si requiere A.I. |

*Figura 8: Diagrama de procesos de Caso de Uso CU-08*

### CU-09 — Resolver si un caso requiere Atención Interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-09 — Resolver si un caso requiere Atención Interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario registrar la decisión formal de si una referencia requiere o no Atención Interdisciplinaria una vez concluido el análisis del caso. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. Existe una referencia o caso analizado en una sesión interdisciplinaria. 2. La información necesaria para la decisión ha sido revisada por el equipo. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso analizado dentro de la sesión. 2. **Sistema:** Muestra la referencia y la valoración situacional disponible. 3. **Usuario:** Selecciona la resolución «Sí requiere A.I.» o «No requiere A.I.». 4. **Sistema:** Solicita confirmación de la resolución. 5. **Usuario:** Confirma la decisión. 6. **Sistema:** Registra la resolución y conserva su relación con la referencia y la sesión. |
| **Flujo Alternativo** | **FA-01 — No requiere A.I.** — El sistema registra el resultado sin abrir un caso activo de Atención Interdisciplinaria. **FA-02 — Sí requiere A.I.** — El sistema habilita el flujo para definir prioridad y abordaje inicial antes de abrir el caso. **FA-03 — Decisión pendiente** — Mientras no se confirme una resolución, el caso permanece pendiente de decisión y no se abre un caso activo. |
| **Poscondiciones** | 1. La decisión interdisciplinaria queda registrada y trazable. 2. Si la decisión es positiva, el caso queda listo para definir su abordaje inicial; si es negativa, no se crea un caso A.I. activo. |

*Figura 9: Diagrama de procesos de Caso de Uso CU-09*

### CU-10 — Definir abordaje inicial y abrir un caso de Atención Interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-10 — Definir abordaje inicial y abrir un caso de Atención Interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario definir el abordaje inicial de un caso que sí requiere A.I. y formalizar la apertura del caso activo. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. La resolución «Sí requiere A.I.» fue confirmada. 2. La referencia y valoración situacional están vinculadas con el análisis interdisciplinario. |
| **Flujo Normal** | 1. **Usuario:** Accede al abordaje inicial del caso. 2. **Usuario:** Selecciona la prioridad aplicable. 3. **Usuario:** Registra uno o más propósitos de intervención. 4. **Usuario:** Selecciona una o varias estrategias de atención. 5. **Usuario:** Selecciona las disciplinas responsables. 6. **Usuario:** Define la frecuencia inicial prevista. 7. **Usuario:** Revisa el resumen del abordaje. 8. **Usuario:** Confirma la apertura del caso. 9. **Sistema:** Crea el caso A.I. en estado Activo y lo vincula con el cliente/beneficiaria, referencia y ámbito institucional.  10. **Sistema:** Actualiza el estado de la referencia según corresponda. 11. **Sistema:** Registra un evento de admisión en la línea de tiempo del nuevo caso. |
| **Flujo Alternativo** | **FA-01 — Información obligatoria incompleta** — El sistema impide confirmar la apertura hasta completar los datos requeridos. **FA-02 — Corrección antes de abrir** — El usuario modifica prioridad, propósitos, estrategias, disciplinas o frecuencia antes de confirmar. **FA-03 — Cancelación** — El usuario sale del flujo sin abrir el caso; la resolución positiva permanece registrada conforme a la regla definida. |
| **Poscondiciones** | 1. Existe un caso A.I. activo con su abordaje inicial registrado. 2. La referencia y el evento de admisión quedan vinculados al nuevo caso. |

*Figura 10: Diagrama de procesos de Caso de Uso CU-10*

## 10.4 Consulta y gestión de casos A.I.

### CU-11 — Consultar lista simplificada de A.I. desde Establecimiento

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-11 — Consultar lista simplificada de A.I. desde Establecimiento |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al profesional o Asistente 3 con acceso de nivel Establecimiento consultar una lista mínima de los casos A.I. correspondientes a sus establecimientos autorizados, sin exponer el detalle interno de la gestión interdisciplinaria. |
| **Actores** | - Profesional / Asistente 3 — Establecimiento |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso de nivel Establecimiento y el sistema dispone de sus establecimientos autorizados. |
| **Flujo Normal** | 1. **Usuario:** Abre Lista de A.I. 2. **Sistema:** Restringe los casos a los establecimientos autorizados del usuario. 3. **Usuario:** Busca por identificación o nombre cuando lo requiere. 4. **Sistema:** Muestra la cantidad de casos visibles y presenta nombre, identificación, establecimiento, fecha de apertura, fecha de cierre cuando exista y estado general. 5. **Usuario:** Consulta la información permitida. |
| **Flujo Alternativo** | **FA-01 — Sin coincidencias** — El sistema informa que no existen casos que coincidan con la búsqueda. **FA-02 — Intento de acceso a detalle** — El sistema no ofrece acceso al detalle interno del caso ni a prioridad, valoración, plan, documentos, coordinaciones, traslados, reportes o cierre. **FA-03 — Exportación** — La lista simplificada no permite exportación desde el rol Establecimiento.**FA-04 — Múltiples establecimientos autorizados** — Si el usuario tiene más de un establecimiento autorizado, el sistema habilita un filtro por establecimiento limitado exclusivamente a dichos establecimientos.**FA-05 — Único establecimiento autorizado** — Si el usuario tiene un único establecimiento autorizado, el sistema lo aplica automáticamente y no muestra un filtro de establecimiento. |
| **Poscondiciones** | 1. No se modifica ningún caso. 2. El usuario solo accede a la información mínima autorizada correspondiente a sus establecimientos autorizados. |

*Figura 11: Diagrama de procesos de Caso de Uso CU-11*

### CU-12 — Consultar y filtrar casos A.I. de la Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-12 — Consultar y filtrar casos A.I. de la Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local localizar, filtrar y exportar casos A.I. pertenecientes a cualquiera de los establecimientos de su ámbito. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado y tiene una Oficina Local asignada. |
| **Flujo Normal** | 1. **Usuario:** Abre Casos de A.I. 2. **Sistema:** Carga únicamente los casos de la Oficina Local. 3. **Usuario:** Opcionalmente busca por identificación o nombre. 4. **Usuario:** Aplica filtros por establecimiento, estado y/o prioridad. 5. **Sistema:** Combina los criterios y actualiza el listado. 6. **Sistema:** Muestra la cantidad de resultados respecto del total visible de la OL. 7. **Usuario:** Selecciona un caso para consultar su detalle o exporta el listado filtrado. |
| **Flujo Alternativo** | **FA-01 — Sin filtros** — El sistema muestra todos los casos visibles de la Oficina Local. **FA-02 — Sin resultados** — El sistema muestra una lista vacía y conserva los filtros para que el usuario pueda modificarlos. **FA-03 — Exportación** — El sistema genera un archivo Excel respetando búsqueda, establecimiento, estado, prioridad y ámbito. |
| **Poscondiciones** | 1. El listado refleja únicamente los casos que cumplen los criterios aplicados. 2. Si se exportó, el archivo corresponde al mismo corte visible. |

*Figura 12: Diagrama de procesos de Caso de Uso CU-12*

### CU-13 — Consultar detalle integral de un caso A.I. en Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-13 — Consultar detalle integral de un caso A.I. en Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local consultar la información integral de un caso A.I. bajo su ámbito y acceder a las operaciones de gestión disponibles. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El caso pertenece a la Oficina Local del usuario y fue seleccionado desde un listado o perfil autorizado. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso A.I. 2. **Sistema:** Muestra cliente/beneficiaria, identificación, establecimiento, identificador del caso, fecha de apertura, estado y prioridad. 3. **Usuario:** Consulta el Resumen. 4. **Sistema:** Muestra valoración vigente, propósitos y próxima acción cuando exista. 5. **Usuario:** Consulta la Línea de tiempo. 6. **Sistema:** Muestra cronológicamente los eventos registrados con su fecha, disciplina, profesional y detalle disponible. 7. **Usuario:** Consulta el Plan de atención. 8. **Sistema:** Muestra estrategias, disciplinas y frecuencia vigentes. 9. **Usuario:** Navega a las funciones adicionales disponibles: documentos, coordinaciones, traslado, reportes o cierre. |
| **Flujo Alternativo** | **FA-01 — Caso cerrado** — El sistema mantiene disponible la consulta histórica y restringe las acciones que ya no correspondan. **FA-02 — Sin próxima acción** — El sistema indica expresamente que no existe una próxima acción registrada. **FA-03 — Información restringida** — El sistema aplica permisos adicionales antes de mostrar información sensible. |
| **Poscondiciones** | 1. La consulta no modifica el caso por sí misma. 2. El usuario puede iniciar únicamente las acciones operativas para las que tenga permiso. |

*Figura 13: Diagrama de procesos de Caso de Uso CU-13*

### CU-14 — Consultar y filtrar casos A.I. de la Región

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-14 — Consultar y filtrar casos A.I. de la Región |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Regional consultar los casos A.I. de su Región, desagregarlos por Oficina Local y establecimiento y aplicar filtros de seguimiento sin modificar su gestión. |
| **Actores** | - ATE / Dirección Regional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con una Región asignada. |
| **Flujo Normal** | 1. **Usuario:** Abre Casos de A.I. 2. **Sistema:** Carga únicamente los casos pertenecientes a la Región del usuario. 3. **Usuario:** Opcionalmente busca por identificación o nombre. 4. **Usuario:** Aplica filtros por Oficina Local, establecimiento, estado y/o prioridad. 5. **Sistema:** Actualiza de forma dependiente los filtros territoriales y aplica todos los criterios. 6. **Sistema:** Muestra la cantidad de resultados respecto del total regional. 7. **Usuario:** Selecciona un caso para consultarlo en modo lectura o exporta el listado filtrado. |
| **Flujo Alternativo** | **FA-01 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento seleccionado si deja de ser compatible. **FA-02 — Sin filtros inferiores** — El sistema muestra todos los casos de la Región. **FA-03 — Exportación** — El sistema genera un Excel restringido a la Región y respetando todos los filtros. **FA-04 — Sin resultados** — El sistema muestra una lista vacía sin ampliar el ámbito. |
| **Poscondiciones** | 1. El usuario obtiene un corte de casos limitado a su Región. 2. No se modifica información operativa. |

*Figura 14: Diagrama de procesos de Caso de Uso CU-14*

### CU-15 — Consultar detalle de un caso A.I. desde Nivel Regional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-15 — Consultar detalle de un caso A.I. desde Nivel Regional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Regional consultar, en modo de solo lectura, el resumen, evolución y plan vigente de un caso perteneciente a su Región. |
| **Actores** | - ATE / Dirección Regional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El caso pertenece a la Región asignada y fue localizado mediante un flujo autorizado. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso seleccionado. 2. **Sistema:** Valida que el caso pertenezca a la Región autorizada. 3. **Sistema:** Muestra la información general del caso y señala que la vista es de consulta. 4. **Usuario:** Consulta el Resumen. 5. **Usuario:** Consulta la Línea de tiempo. 6. **Usuario:** Consulta el Plan de atención. 7. **Sistema:** Presenta únicamente la información permitida para el nivel Regional. |
| **Flujo Alternativo** | **FA-01 — Información sensible restringida** — El sistema oculta o limita los elementos que requieran permisos adicionales. **FA-02 — Acción de edición** — Las funciones de modificación de estado, prioridad, valoración, plan, documentos, coordinaciones, traslado, reportes o cierre no se encuentran disponibles. **FA-03 — Caso fuera de Región** — El sistema deniega el acceso. |
| **Poscondiciones** | 1. No se modifica el caso. 2. El usuario Regional mantiene acceso de solo lectura dentro de su Región. |

*Figura 15: Diagrama de procesos de Caso de Uso CU-15*

### CU-16 — Consultar y filtrar casos A.I. a Nivel Nacional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-16 — Consultar y filtrar casos A.I. a Nivel Nacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Nacional consultar casos A.I. de todo el país y desagregarlos jerárquicamente por Región, Oficina Local y establecimiento, además de aplicar filtros de estado y prioridad. |
| **Actores** | - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso Nacional. |
| **Flujo Normal** | 1. **Usuario:** Abre Casos de A.I. 2. **Sistema:** Carga el universo nacional de casos permitido. 3. **Usuario:** Opcionalmente busca por identificación o nombre. 4. **Usuario:** Aplica filtros por Región, Oficina Local, establecimiento, estado y/o prioridad. 5. **Sistema:** Mantiene la dependencia jerárquica entre los filtros territoriales. 6. **Sistema:** Aplica todos los criterios y muestra la cantidad de resultados. 7. **Usuario:** Selecciona un caso para consulta o exporta el listado filtrado. |
| **Flujo Alternativo** | **FA-01 — Cambio de Región** — El sistema actualiza o limpia Oficina Local y establecimiento incompatibles. **FA-02 — Cambio de Oficina Local** — El sistema actualiza o limpia el establecimiento incompatible. **FA-03 — Sin filtros territoriales** — El sistema muestra todos los casos nacionales permitidos. **FA-04 — Exportación** — El sistema genera un Excel correspondiente al mismo corte visible. **FA-05 — Sin resultados** — El sistema muestra una lista vacía y conserva los filtros. |
| **Poscondiciones** | 1. El usuario obtiene el conjunto nacional o territorial solicitado. 2. No se modifica información operativa. |

*Figura 16: Diagrama de procesos de Caso de Uso CU-16*

### CU-17 — Consultar detalle de un caso A.I. desde Nivel Nacional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-17 — Consultar detalle de un caso A.I. desde Nivel Nacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Nacional consultar, en modo de solo lectura, el resumen, evolución y plan vigente de un caso de cualquier ámbito autorizado del país. |
| **Actores** | - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso Nacional. 2. El caso fue localizado mediante un flujo autorizado. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso seleccionado. 2. **Sistema:** Verifica los permisos de acceso a la información individual. 3. **Sistema:** Muestra la información general del caso en modo de consulta. 4. **Usuario:** Consulta el Resumen. 5. **Usuario:** Consulta la Línea de tiempo. 6. **Usuario:** Consulta el Plan de atención. 7. **Sistema:** Aplica las restricciones institucionales de información sensible. |
| **Flujo Alternativo** | **FA-01 — Información sensible restringida** — El sistema oculta o limita los elementos sujetos a permisos adicionales. **FA-02 — Acción operativa** — El sistema no ofrece funciones para modificar valoración, estado, prioridad, plan, documentos, coordinaciones, traslados, reportes o cierre. **FA-03 — Acceso no permitido** — El sistema deniega el acceso cuando el usuario no cumple una regla adicional de seguridad. |
| **Poscondiciones** | 1. No se modifica el caso. 2. El acceso queda limitado a la información autorizada en modo lectura. |

*Figura 17: Diagrama de procesos de Caso de Uso CU-17*

### CU-18 — Gestionar documentos asociados a un caso A.I.

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-18 — Gestionar documentos asociados a un caso A.I. |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local consultar documentos existentes y asociar nuevos documentos al expediente lógico de un caso A.I. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario tiene acceso operativo al caso. 2. El caso pertenece a la Oficina Local del usuario. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso y accede a Documentos. 2. **Sistema:** Muestra los documentos ya asociados con sus metadatos principales. 3. **Usuario:** Selecciona el tipo de documento. 4. **Usuario:** Selecciona el archivo que desea adjuntar. 5. **Sistema:** Valida que exista un archivo y los metadatos mínimos requeridos. 6. **Usuario:** Confirma la carga. 7. **Sistema:** Asocia el documento al caso y registra tipo, fecha, responsable y demás metadatos definidos. |
| **Flujo Alternativo** | **FA-01 — Sin archivo** — El sistema impide confirmar la carga hasta que se seleccione un archivo. **FA-02 — Archivo no válido** — El sistema rechaza el archivo e informa la causa conforme a las reglas técnicas establecidas. **FA-03 — Permiso insuficiente** — El sistema no permite la carga ni la consulta de elementos restringidos. |
| **Poscondiciones** | 1. El documento queda vinculado con el caso y disponible conforme a los permisos institucionales. 2. La acción queda trazable. |

*Figura 18: Diagrama de procesos de Caso de Uso CU-18*

### CU-19 — Registrar una coordinación interinstitucional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-19 — Registrar una coordinación interinstitucional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local registrar y consultar coordinaciones realizadas con instituciones externas como parte del abordaje de un caso A.I. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario tiene acceso operativo al caso. 2. El caso pertenece a su Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso y accede a Coordinaciones. 2. **Sistema:** Muestra las coordinaciones previamente registradas. 3. **Usuario:** Inicia una nueva coordinación. 4. **Usuario:** Selecciona la institución correspondiente. 5. **Usuario:** Indica el profesional responsable. 6. **Usuario:** Registra el motivo, fecha y estado de la coordinación. 7. **Usuario:** Confirma el registro. 8. **Sistema:** Guarda la coordinación vinculada al caso y conserva su trazabilidad. |
| **Flujo Alternativo** | **FA-01 — Responsable distinto del digitador** — El usuario selecciona al profesional que efectuó la coordinación y el sistema conserva la trazabilidad correspondiente. **FA-02 — Institución no catalogada** — El usuario utiliza la opción «Otra» y registra la identificación necesaria. **FA-03 — Datos obligatorios incompletos** — El sistema solicita completar la información requerida antes de guardar. |
| **Poscondiciones** | 1. La coordinación queda vinculada al caso. 2. Su estado y datos principales quedan disponibles para seguimiento posterior. |

*Figura 19: Diagrama de procesos de Caso de Uso CU-19*

### CU-20 — Trasladar un caso a otra Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-20 — Trasladar un caso a otra Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a la Oficina Local de origen finalizar su responsabilidad sobre un caso mediante un cierre por traslado y generar un ingreso pendiente de continuidad para la Oficina Local de destino, sin perder el historial previo. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local de origen - Oficina Local de destino (actor receptor posterior) |
| **Precondiciones** | 1. El caso se encuentra bajo responsabilidad de la Oficina Local de origen. 2. El usuario tiene permiso para ejecutar el traslado. 3. El caso no se encuentra cerrado por otra causa. |
| **Flujo Normal** | 1. **Usuario origen:** Abre el caso y accede a Traslado. 2. **Usuario origen:** Selecciona la Oficina Local destino y el establecimiento destino. 3. **Usuario origen:** Registra Región, fecha y motivo del traslado. 4. **Sistema:** Valida que los datos de destino sean coherentes. 5. **Usuario origen:** Confirma la acción Cerrar por traslado. 6. **Sistema:** Cierra el caso de origen con el motivo específico de traslado. 7. **Sistema:** Conserva intacto el historial generado por la Oficina Local de origen. 8. **Sistema:** Crea el registro de traslado con estado Pendiente de continuidad para la Oficina Local destino. 9. **Sistema:** Agrega el evento de traslado a la línea de tiempo. |
| **Flujo Alternativo** | **FA-01 — Destino incompleto o inconsistente** — El sistema impide confirmar hasta que exista una combinación válida de Región, OL y establecimiento destino. **FA-02 — Caso ya cerrado** — El sistema deshabilita el cierre por traslado. **FA-03 — Cancelación** — El usuario abandona el flujo y el caso permanece sin cambios. |
| **Poscondiciones** | 1. El caso de origen queda cerrado por traslado. 2. Existe un ingreso pendiente de continuidad en la Oficina Local destino. 3. El historial de origen se conserva y el traslado queda trazable. |

*Figura 20: Diagrama de procesos de Caso de Uso CU-20*

### CU-21 — Confirmar continuidad de un caso recibido por traslado

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-21 — Confirmar continuidad de un caso recibido por traslado |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a la Oficina Local de destino confirmar que un cliente/beneficiaria trasladado continuará su Atención Interdisciplinaria en el nuevo ámbito y crear el caso activo correspondiente. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local de destino |
| **Precondiciones** | 1. Existe un traslado dirigido a la Oficina Local del usuario con estado Pendiente de continuidad. 2. El caso de origen permanece cerrado por traslado. |
| **Flujo Normal** | 1. **Usuario destino:** Consulta los ingresos por traslado pendientes de continuidad. 2. **Sistema:** Muestra cliente/beneficiaria, Oficina Local origen, destino, establecimiento destino y estado. 3. **Usuario destino:** Selecciona el ingreso correspondiente. 4. **Usuario destino:** Verifica que la persona continuará siendo atendida en el nuevo ámbito. 5. **Usuario destino:** Confirma la continuidad. 6. **Sistema:** Actualiza el traslado como continuidad confirmada. 7. **Sistema:** Crea un nuevo caso A.I. activo bajo la Oficina Local y establecimiento destino. 8. **Sistema:** Conserva la relación con el caso de origen y registra el evento de continuidad en la línea de tiempo. |
| **Flujo Alternativo** | **FA-01 — Continuidad aún no confirmada** — El ingreso permanece Pendiente de continuidad y no se crea un caso activo en destino. **FA-02 — Traslado no pertenece a la OL** — El sistema no permite que el usuario confirme un traslado dirigido a otra Oficina Local. |
| **Poscondiciones** | 1. Existe un nuevo caso activo en el ámbito destino. 2. El caso de origen permanece cerrado y no se modifica retroactivamente. 3. La relación entre ambos casos queda trazable. |

*Figura 21: Diagrama de procesos de Caso de Uso CU-21*

### CU-22 — Generar un reporte de un caso sin cerrarlo

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-22 — Generar un reporte de un caso sin cerrarlo |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local registrar o generar un reporte sobre un caso A.I. sin modificar su estado activo. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario tiene acceso operativo al caso. 2. El caso existe y puede encontrarse activo al momento de generar el reporte. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso y accede a Reportes. 2. **Sistema:** Muestra los reportes previamente registrados. 3. **Usuario:** Inicia un nuevo reporte. 4. **Usuario:** Selecciona o registra el tipo o propósito del reporte. 5. **Usuario:** Indica el motivo correspondiente. 6. **Sistema:** Reutiliza la información disponible del caso conforme al formato de reporte definido. 7. **Usuario:** Revisa y confirma la generación o registro del reporte. 8. **Sistema:** Conserva fecha, responsable, tipo y motivo del reporte. 9. **Sistema:** Mantiene sin cambios el estado operativo del caso. |
| **Flujo Alternativo** | **FA-01 — Caso activo** — El reporte se genera sin cerrar el caso. **FA-02 — Información insuficiente** — El sistema solicita completar la información requerida antes de confirmar. **FA-03 — Cancelación** — El usuario abandona el flujo y no se registra un nuevo reporte. |
| **Poscondiciones** | 1. El reporte queda asociado al caso y trazable. 2. El caso mantiene su estado previo salvo que se ejecute posteriormente un cierre independiente. |

*Figura 22: Diagrama de procesos de Caso de Uso CU-22*

### CU-23 — Cerrar un caso de Atención Interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-23 — Cerrar un caso de Atención Interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al personal autorizado de Oficina Local finalizar formalmente la gestión activa de un caso A.I., registrando la fecha y el motivo de cierre sin confundir esta acción con la generación de reportes. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario tiene permiso para cerrar el caso. 2. El caso no se encuentra previamente cerrado. |
| **Flujo Normal** | 1. **Usuario:** Abre el caso y accede a Cierre. 2. **Sistema:** Muestra el estado actual del caso. 3. **Usuario:** Registra la fecha de cierre. 4. **Usuario:** Selecciona o registra el motivo de cierre. 5. **Usuario:** Confirma el cierre. 6. **Sistema:** Cambia el estado del caso a Cerrado. 7. **Sistema:** Guarda la fecha y motivo. 8. **Sistema:** Agrega el evento de cierre a la línea de tiempo. |
| **Flujo Alternativo** | **FA-01 — Caso ya cerrado** — El sistema no permite ejecutar un segundo cierre. **FA-02 — Datos obligatorios incompletos** — El sistema impide confirmar hasta registrar la información requerida. **FA-03 — Reporte** — La existencia o generación de un reporte no sustituye el cierre ni modifica automáticamente el estado del caso. **FA-04 — Traslado** — Si la finalización corresponde a un traslado, se utiliza el flujo específico de Cerrar por traslado. |
| **Poscondiciones** | 1. El caso queda en estado Cerrado con fecha y motivo trazables. 2. La línea de tiempo conserva el evento de cierre. |

*Figura 23: Diagrama de procesos de Caso de Uso CU-23*

## 10.5 Atenciones y seguimiento

### CU-24 — Registrar una atención individual

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-24 — Registrar una atención individual |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a un profesional autorizado de Oficina Local documentar una atención individual realizada sobre un caso A.I. activo y reflejarla en la línea de tiempo del caso. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. Existe un caso A.I. activo dentro de la Oficina Local. 2. El usuario tiene permiso para registrar atenciones. |
| **Flujo Normal** | 1. **Usuario:** Abre Atenciones y selecciona Atención individual. 2. **Usuario:** Busca el caso activo por identificación o nombre. 3. **Sistema:** Muestra únicamente casos activos de la Oficina Local. 4. **Usuario:** Selecciona el caso correcto. 5. **Usuario:** Registra la fecha real de atención. 6. **Usuario:** Selecciona disciplina y tipo o estrategia de atención. 7. **Usuario:** Registra acciones realizadas y recomendaciones. 8. **Usuario:** Registra una próxima acción y su fecha cuando corresponda. 9. **Usuario:** Confirma el registro.  10. **Sistema:** Guarda la atención con el profesional responsable y la fecha de digitación. 11. **Sistema:** Agrega automáticamente el evento a la línea de tiempo del caso. |
| **Flujo Alternativo** | **FA-01 — Caso no activo** — El sistema no ofrece el caso como candidato para registrar una nueva atención individual. **FA-02 — Sin coincidencias** — El sistema informa que no existen casos activos que coincidan con la búsqueda. **FA-03 — Datos requeridos incompletos** — El sistema solicita completar la información obligatoria antes de guardar. **FA-04 — Interrupción** — Si existe un borrador autoguardado, el usuario puede recuperarlo según las reglas establecidas. |
| **Poscondiciones** | 1. La atención queda registrada y vinculada al caso. 2. La línea de tiempo refleja el nuevo evento con fecha real, disciplina, responsable y detalle correspondiente. |

*Figura 24: Diagrama de procesos de Caso de Uso CU-24*

### CU-25 — Registrar una atención grupal para múltiples participantes

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-25 — Registrar una atención grupal para múltiples participantes |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite registrar una única actividad grupal, asociarla a múltiples clientes/beneficiarias, registrar su asistencia y reflejar la participación en los historiales de quienes tengan un caso A.I. activo. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario tiene permiso para registrar atenciones grupales. 2. Los participantes que se busquen pertenecen al ámbito de la Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Atenciones y selecciona Atención grupal. 2. **Usuario:** Registra fecha, tipo de actividad, tema u objetivo y lugar. 3. **Usuario:** Selecciona una o varias disciplinas y el profesional o profesionales responsables. 4. **Usuario:** Busca participantes por identificación o nombre. 5. **Sistema:** Muestra personas del ámbito que aún no han sido agregadas. 6. **Usuario:** Agrega uno o varios participantes. 7. **Usuario:** Registra la asistencia individual de cada participante. 8. **Usuario:** Registra acciones o contenidos comunes y recomendaciones generales. 9. **Usuario:** Confirma el registro.  10. **Sistema:** Guarda un único registro base de la atención grupal. 11. **Sistema:** Para cada participante con caso A.I. activo, agrega un evento asociado en la línea de tiempo correspondiente. |
| **Flujo Alternativo** | **FA-01 — Participante duplicado** — El sistema impide agregar a la misma persona más de una vez. **FA-02 — Retirar participante** — Antes de guardar, el usuario elimina a un participante de la actividad. **FA-03 — Participante sin caso activo** — El sistema conserva su participación en la actividad grupal, pero no crea un evento en una línea de tiempo A.I. inexistente. **FA-04 — Sin tema u objetivo** — El sistema impide guardar la actividad. **FA-05 — Sin participantes** — El sistema impide guardar hasta que exista al menos un participante. **FA-06 — Interrupción** — Si existe un borrador válido, el usuario puede recuperarlo antes de confirmar. |
| **Poscondiciones** | 1. Existe un único registro de la atención grupal. 2. La asistencia queda registrada por participante. 3. Los casos A.I. activos de los participantes reflejan la actividad en su historial sin duplicar el registro base. |

*Figura 25: Diagrama de procesos de Caso de Uso CU-25*

## 10.6 Programación

### CU-26 — Gestionar la programación operativa de Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-26 — Gestionar la programación operativa de Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Oficina Local crear y actualizar la programación de sesiones y atenciones, incluyendo el registro de resultados, reprogramaciones, cancelaciones y el seguimiento de actividades vencidas. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado con permiso para gestionar programación en su Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Programación. 2. **Sistema:** Muestra únicamente las actividades de su Oficina Local. 3. **Usuario:** Crea una nueva actividad. 4. **Usuario:** Registra fecha, tipo, título o propósito, establecimiento cuando corresponda y observaciones. 5. **Usuario:** Confirma la creación. 6. **Sistema:** Guarda la actividad con estado Programada. 7. **Usuario:** Posteriormente localiza una actividad y selecciona su nuevo estado. 8. **Sistema:** Valida los datos requeridos para el cambio. 9. **Usuario:** Confirma la actualización.  10. **Sistema:** Guarda el nuevo estado y conserva la trazabilidad del cambio. |
| **Flujo Alternativo** | **FA-01 — Marcar Realizada** — El usuario selecciona Realizada y el sistema registra el nuevo estado. **FA-02 — Reprogramar** — El usuario selecciona Reprogramada; el sistema exige nueva fecha y motivo antes de guardar. **FA-03 — Cancelar** — El usuario selecciona Cancelada; el sistema exige el motivo antes de guardar. **FA-04 — Actividad de Oficina Local** — El establecimiento puede quedar sin seleccionar cuando la actividad corresponda a toda la OL. **FA-05 — Falta título o propósito** — El sistema impide crear la actividad. **FA-06 — Actividad vencida** — Si la fecha ya pasó y la actividad continúa Programada, el sistema muestra una alerta para que Oficina Local resuelva su estado. **FA-07 — Filtrado** — El usuario filtra por establecimiento y/o estado y el sistema actualiza el listado y el conteo. |
| **Poscondiciones** | 1. La actividad queda registrada o actualizada con un estado válido. 2. Las reprogramaciones y cancelaciones conservan el motivo y, cuando corresponda, la nueva fecha. |

*Figura 26: Diagrama de procesos de Caso de Uso CU-26*

### CU-27 — Consultar programación desde Nivel Regional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-27 — Consultar programación desde Nivel Regional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Regional consultar, sin editar, la programación de las Oficinas Locales de su Región y desagregarla por Oficina Local, establecimiento y estado. |
| **Actores** | - ATE / Dirección Regional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con una Región asignada. |
| **Flujo Normal** | 1. **Usuario:** Abre Programación. 2. **Sistema:** Carga únicamente las actividades pertenecientes a la Región. 3. **Usuario:** Aplica filtros por Oficina Local, establecimiento y/o estado. 4. **Sistema:** Mantiene la dependencia de los filtros y actualiza el listado. 5. **Sistema:** Muestra la cantidad de actividades y sus datos principales. 6. **Usuario:** Consulta fechas, tipo, propósito, Oficina Local, establecimiento, estado y motivo cuando exista. |
| **Flujo Alternativo** | **FA-01 — Sin filtros inferiores** — El sistema muestra toda la programación de la Región. **FA-02 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible. **FA-03 — Intento de edición** — Las acciones para crear, modificar, reprogramar, cancelar o marcar una actividad como realizada no están disponibles. |
| **Poscondiciones** | 1. La programación permanece sin cambios. 2. El usuario obtiene una vista de consulta restringida a su Región. |

*Figura 27: Diagrama de procesos de Caso de Uso CU-27*

### CU-28 — Consultar programación desde Nivel Nacional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-28 — Consultar programación desde Nivel Nacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Nacional consultar, sin editar, la programación de todo el país y desagregarla jerárquicamente por Región, Oficina Local, establecimiento y estado. |
| **Actores** | - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso Nacional. |
| **Flujo Normal** | 1. **Usuario:** Abre Programación. 2. **Sistema:** Carga la programación nacional disponible. 3. **Usuario:** Aplica filtros por Región, Oficina Local, establecimiento y/o estado. 4. **Sistema:** Mantiene la jerarquía entre los filtros territoriales. 5. **Sistema:** Actualiza el listado y muestra la cantidad de actividades. 6. **Usuario:** Consulta los datos principales de las actividades resultantes. |
| **Flujo Alternativo** | **FA-01 — Sin filtros territoriales** — El sistema muestra toda la programación nacional disponible. **FA-02 — Cambio de Región** — El sistema limpia o actualiza Oficina Local y establecimiento incompatibles. **FA-03 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible. **FA-04 — Intento de edición** — Las acciones para crear o modificar programación no están disponibles. |
| **Poscondiciones** | 1. La programación permanece sin cambios. 2. El usuario obtiene el corte nacional o territorial solicitado. |

*Figura 28: Diagrama de procesos de Caso de Uso CU-28*

## 10.7 Reportería, analítica y consolidaciones

### CU-29 — Consultar reportería analítica de Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-29 — Consultar reportería analítica de Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Oficina Local analizar la actividad de Atención Interdisciplinaria de su ámbito mediante filtros e indicadores que diferencian casos, referencias, personas únicas atendidas y total de atenciones. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. Existe información analítica disponible dentro de la Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Restringe la información a la Oficina Local. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por establecimiento, estado, prioridad, disciplina y/o profesional. 5. **Sistema:** Aplica cada filtro únicamente a los indicadores funcionalmente relacionados. 6. **Sistema:** Muestra cantidad de casos y referencias. 7. **Sistema:** Muestra personas únicas atendidas y total de atenciones como métricas distintas. 8. **Sistema:** Actualiza las visualizaciones de casos por prioridad, casos por estado y actividad por disciplina. 9. **Usuario:** Modifica los filtros para analizar otros cortes de su ámbito. |
| **Flujo Alternativo** | **FA-01 — Sin establecimiento** — El ámbito analítico corresponde a toda la Oficina Local. **FA-02 — Establecimiento seleccionado** — Las métricas territoriales se restringen al establecimiento seleccionado. **FA-03 — Filtro por disciplina/profesional** — El sistema identifica claramente qué métricas de atención son afectadas para evitar interpretar que todos los indicadores responden al mismo filtro. **FA-04 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías sin ampliar el ámbito. |
| **Poscondiciones** | 1. El usuario visualiza indicadores correspondientes al corte solicitado. 2. No se modifica información operativa. |

*Figura 29: Diagrama de procesos de Caso de Uso CU-29*

### CU-30 — Consultar reportería analítica Regional

| fCampo | Especificación |
| --- | --- |
| **Nombre** | CU-30 — Consultar reportería analítica Regional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Regional analizar la Atención Interdisciplinaria de su Región y desagregarla por Oficina Local y establecimiento mediante filtros e indicadores consistentes. |
| **Actores** | - ATE / Dirección Regional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con una Región asignada. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Restringe automáticamente la información a la Región asignada. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por Oficina Local, establecimiento, estado, prioridad, disciplina y/o profesional. 5. **Sistema:** Mantiene la dependencia de los filtros territoriales. 6. **Sistema:** Actualiza casos, referencias, personas únicas atendidas y total de atenciones según las reglas de cada indicador. 7. **Sistema:** Actualiza las visualizaciones de prioridad, estado y actividad por disciplina. 8. **Usuario:** Compara diferentes cortes dentro de su Región. |
| **Flujo Alternativo** | **FA-01 — Región completa** — Sin filtros inferiores, los indicadores representan toda la Región. **FA-02 — Oficina Local** — Los indicadores territoriales se restringen a la OL seleccionada. **FA-03 — Establecimiento** — Los indicadores territoriales se restringen al establecimiento seleccionado. **FA-04 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible. **FA-05 — Disciplina/profesional** — El sistema deja claro qué métricas son afectadas por esos filtros. **FA-06 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías. |
| **Poscondiciones** | 1. El usuario obtiene un análisis limitado a su Región y al corte seleccionado. 2. No se modifica información operativa. |

*Figura 30: Diagrama de procesos de Caso de Uso CU-30*

### CU-31 — Consultar reportería analítica Nacional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-31 — Consultar reportería analítica Nacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Nacional analizar la Atención Interdisciplinaria del país y desagregarla jerárquicamente por Región, Oficina Local y establecimiento, combinando filtros temporales y funcionales. |
| **Actores** | - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso Nacional. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Carga el ámbito nacional como nivel máximo de consulta. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por Región, Oficina Local, establecimiento, estado, prioridad, disciplina y/o profesional. 5. **Sistema:** Mantiene la dependencia jerárquica de los filtros territoriales. 6. **Sistema:** Actualiza casos, referencias, personas únicas atendidas y total de atenciones conforme a las reglas de cada indicador. 7. **Sistema:** Actualiza las visualizaciones de prioridad, estado y actividad por disciplina. 8. **Usuario:** Compara diferentes cortes nacionales o territoriales. |
| **Flujo Alternativo** | **FA-01 — País completo** — Sin filtros territoriales, los indicadores representan Costa Rica. **FA-02 — Región** — El corte se restringe a la Región seleccionada. **FA-03 — Oficina Local** — El corte se restringe a la OL seleccionada. **FA-04 — Establecimiento** — El corte se restringe al establecimiento seleccionado. **FA-05 — Cambio de Región u OL** — El sistema limpia o actualiza automáticamente los filtros inferiores incompatibles. **FA-06 — Disciplina/profesional** — El sistema identifica las métricas afectadas por esos filtros. **FA-07 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías. |
| **Poscondiciones** | 1. El usuario obtiene el análisis nacional o territorial solicitado. 2. No se modifica información operativa. |

*Figura 31: Diagrama de procesos de Caso de Uso CU-31*

### CU-32 — Generar y descargar una consolidación dinámica

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-32 — Generar y descargar una consolidación dinámica |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Oficina Local, Nivel Regional y Nivel Nacional generar una consolidación del ámbito seleccionado utilizando los filtros vigentes y descargarla sin requerir procesos manuales de remisión entre niveles. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario tiene acceso a Reportería. 2. Existe un corte analítico definido mediante período y, opcionalmente, filtros adicionales. |
| **Flujo Normal** | 1. **Usuario:** Configura el período y los filtros de reportería. 2. **Sistema:** Determina el ámbito máximo permitido por el rol. 3. **Sistema:** Identifica el ámbito efectivo del consolidado según los filtros territoriales. 4. **Sistema:** Calcula las métricas definidas para el corte, incluyendo casos, referencias, personas únicas atendidas, total de atenciones y distribución por prioridad cuando corresponda. 5. **Sistema:** Muestra el consolidado dinámico e identifica al menos período y ámbito. 6. **Usuario:** Solicita la descarga. 7. **Sistema:** Genera un archivo compatible con Excel respetando el mismo corte visible. |
| **Flujo Alternativo** | **FA-01 — Oficina Local** — Sin establecimiento seleccionado, el consolidado representa toda la OL; con establecimiento, representa ese establecimiento. **FA-02 — Regional** — Puede consolidar la Región completa, una Oficina Local o un establecimiento de su Región. **FA-03 — Nacional** — Puede consolidar el país completo, una Región, una Oficina Local o un establecimiento. **FA-04 — Cambio de filtros** — El sistema recalcula el consolidado antes de descargarlo. **FA-05 — Sin datos** — El sistema genera un consolidado vacío o con valores cero, identificando igualmente el corte. **FA-06 — Remisión entre niveles** — Regional y Nacional obtienen el consolidado directamente de la información autorizada; no se requiere que un nivel inferior lo envíe o apruebe manualmente. |
| **Poscondiciones** | 1. Existe una consolidación coherente con el período, ámbito y filtros aplicados. 2. Si se descargó, el archivo representa el mismo corte mostrado en pantalla. |

*Figura 32: Diagrama de procesos de Caso de Uso CU-32*

## 10.8 Administración funcional y migración

### CU-33 — Administrar catálogos y versiones funcionales

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-33 — Administrar catálogos y versiones funcionales |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a un administrador autorizado mantener catálogos y versiones de formularios o reglas que evolucionan con el tiempo, preservando la interpretación de los registros históricos. |
| **Actores** | - Administrador funcional o técnico autorizado |
| **Precondiciones** | 1. El usuario posee permisos administrativos específicos. 2. Existe un catálogo, formulario o regla administrable. |
| **Flujo Normal** | 1. **Administrador:** Selecciona el catálogo, formulario o regla que desea gestionar. 2. **Sistema:** Muestra la versión vigente y el historial disponible. 3. **Administrador:** Crea una nueva versión o modifica los elementos permitidos. 4. **Sistema:** Valida consistencia, obligatoriedad y dependencias. 5. **Administrador:** Revisa los cambios y confirma su publicación. 6. **Sistema:** Activa la nueva versión sin alterar la interpretación de los registros creados bajo versiones anteriores. |
| **Flujo Alternativo** | **FA-01 — Error de validación** — El sistema impide publicar e identifica las inconsistencias. **FA-02 — Cancelación** — El administrador descarta los cambios no publicados. **FA-03 — Consulta histórica** — El administrador consulta versiones previas sin reescribir los registros históricos asociados. |
| **Poscondiciones** | 1. Existe una versión vigente claramente identificada. 2. Las versiones anteriores permanecen disponibles para interpretar registros históricos. |

*Figura 33: Diagrama de procesos de Caso de Uso CU-33*

### CU-34 — Importar o migrar información histórica

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-34 — Importar o migrar información histórica |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al equipo autorizado incorporar al módulo información institucional histórica previamente existente mediante un proceso controlado de validación, mapeo, importación y registro de incidencias. |
| **Actores** | - Equipo de implementación / administrador técnico autorizado |
| **Precondiciones** | 1. Existe una fuente histórica identificada y autorizada para migración. 2. Se dispone de reglas de mapeo y validación aprobadas. |
| **Flujo Normal** | 1. **Equipo técnico:** Selecciona la fuente o lote autorizado. 2. **Sistema:** Valida la estructura general de los datos. 3. **Equipo técnico:** Configura o revisa el mapeo hacia las entidades del módulo. 4. **Sistema:** Verifica identificadores existentes y posibles duplicados. 5. **Equipo técnico:** Ejecuta una validación previa o simulación de importación. 6. **Sistema:** Genera un resultado de validación con registros aceptables y errores. 7. **Equipo técnico:** Corrige o excluye los registros inválidos y confirma la importación. 8. **Sistema:** Importa los registros válidos y conserva trazabilidad de la fuente y de las incidencias. |
| **Flujo Alternativo** | **FA-01 — Duplicado detectado** — El sistema no crea un nuevo registro de persona cuando puede vincularse con una identidad existente según las reglas definidas. **FA-02 — Registro inválido** — El sistema excluye el registro y documenta el error para revisión. **FA-03 — Importación parcial** — El sistema procesa únicamente los registros válidos y conserva el detalle de los rechazados. **FA-04 — Cancelación** — El equipo detiene el proceso antes de la confirmación sin incorporar cambios definitivos. |
| **Poscondiciones** | 1. Los registros válidos quedan incorporados de forma controlada. 2. Se conserva trazabilidad de la fuente, los resultados y los errores de migración. |

*Figura 34: Diagrama de procesos de Caso de Uso CU-34*


## CU-35 — Consultar información mediante asistente conversacional 

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-35 — Consultar información mediante asistente conversacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 15 de octubre de 2026 |
| **Estado** | EXPLORATORIO / DESEABLE — ETAPA POSTERIOR 2027 |
| **Alcance 2026** | FUERA DEL ALCANCE DE IMPLEMENTACIÓN |
| **Descripción** | Permite a un usuario autorizado formular una consulta en lenguaje natural para que el sistema determine su contexto de autorización, identifique los datos permitidos necesarios, ejecute una consulta controlada de solo lectura y genere una respuesta en lenguaje natural basada en los resultados obtenidos. |
| **Actores** | Usuario autorizado de SIA-CENCINAI; Sistema / Asistente conversacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El sistema dispone del rol y ámbito institucional autorizado del usuario. 3. Existen fuentes o conjuntos de datos expresamente habilitados para consulta mediante el asistente. 4. La funcionalidad conversacional se encuentra habilitada para el usuario. |
| **Flujo Normal** | 1. **Usuario:** Ingresa una consulta en lenguaje natural. 2. **Sistema:** Interpreta la intención general de la consulta. 3. **Sistema:** Determina el rol, ámbito institucional, establecimientos autorizados cuando corresponda y demás restricciones aplicables al usuario. 4. **Sistema:** Determina qué información necesita para responder. 5. **Sistema:** Selecciona únicamente fuentes, entidades y datos habilitados y compatibles con el contexto autorizado. 6. **Sistema:** Construye una consulta estructurada de solo lectura. 7. **Sistema:** Valida la consulta antes de ejecutarla. 8. **Sistema:** Ejecuta la consulta dentro del ámbito autorizado. 9. **Sistema:** Obtiene los resultados permitidos.  10. **Sistema:** Genera una respuesta en lenguaje natural sustentada en los resultados obtenidos. 11. **Sistema:** Presenta la respuesta e indica, cuando corresponda, el ámbito, período o filtros relevantes utilizados. 12. **Usuario:** Consulta la respuesta obtenida. |
| **Flujo Alternativo** | **FA-01 — Información fuera de ámbito:** Si la pregunta requiere información que el usuario no está autorizado a consultar, el sistema no accede a dichos datos ni amplía el ámbito de autorización.**FA-02 — Sin resultados:** Si la consulta autorizada no devuelve registros, el sistema informa que no se encontraron datos para los criterios aplicados.**FA-03 — Información insuficiente:** Si los datos obtenidos no permiten sustentar una respuesta adecuada, el asistente informa que no dispone de información suficiente para responder.**FA-04 — Consulta ambigua:** Si no es posible determinar con suficiente precisión qué información solicita el usuario, el asistente solicita una aclaración antes de ejecutar la consulta.**FA-05 — Fuente no habilitada:** Si responder requiere una fuente, tabla, campo o servicio no habilitado para el asistente, el sistema no lo consulta e informa que la solicitud no puede resolverse con las fuentes disponibles.**FA-06 — Consulta no válida o riesgosa:** Si la consulta generada no supera las validaciones establecidas, el sistema no la ejecuta y devuelve un mensaje controlado.**FA-07 — Solicitud de modificación:** Si el usuario solicita mediante el asistente crear, modificar, eliminar, cerrar, trasladar u operar sobre un registro, el sistema no ejecuta la acción y mantiene el asistente en modalidad de consulta. |
| **Poscondiciones** | 1. El usuario recibe una respuesta basada únicamente en información autorizada y disponible. 2. No se modifica información operativa como consecuencia de la consulta. 3. La interacción conserva la trazabilidad definida para el asistente conversacional. |

*Figura 35: Diagrama de procesos de Caso de Uso CU-35*

---

# 11. Matriz de trazabilidad RF ↔ CU

La matriz de trazabilidad se mantiene en el archivo independiente [`TRACEABILITY_MATRIX.md`](./TRACEABILITY_MATRIX.md) para facilitar su consulta y mantenimiento por Cursor y los agentes del proyecto.

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

# 13. Reglas de negocio actualizadas

| ID | Regla | Estado |
| --- | --- | --- |
| **RN-001** | Una detección o hallazgo no abre automáticamente un caso de Atención Interdisciplinaria. | Confirmado |
| **RN-002** | La decisión de si un caso requiere Atención Interdisciplinaria corresponde al Equipo Interdisciplinario de Oficina Local. | Confirmado / modelo objetivo |
| **RN-003** | El cierre de un caso A.I. no equivale automáticamente al egreso del cliente/beneficiaria de un servicio o modalidad institucional. | Confirmado |
| **RN-004** | DAF no constituye una ruta paralela de Atención Interdisciplinaria; sus particularidades deben integrarse al abordaje del caso cuando corresponda. | Confirmado |
| **RN-005** | La coincidencia exacta por identificación tiene precedencia sobre la coincidencia por nombre en los procesos de búsqueda y conciliación. | Confirmado |
| **RN-006** | La selección de clientes/beneficiarias y casos no debe depender de listas masivas; se prioriza la búsqueda por identificación o nombre. | Confirmado |
| **RN-007** | Cualquier factor protector, factor de riesgo, signo de alerta u otro elemento seleccionado puede incorporar una especificación textual adicional. | Confirmado |
| **RN-008** | Intensidad, frecuencia y persistencia no son campos obligatorios de la valoración situacional. | Confirmado post-validación |
| **RN-009** | La prioridad del caso se define mediante criterio profesional e interdisciplinario conforme al modelo vigente. | Confirmado |
| **RN-010** | Una atención grupal se registra una sola vez como actividad base y se asocia a múltiples participantes. | Confirmado |
| **RN-011** | La generación de un reporte no implica el cierre del caso y no debe modificar automáticamente su estado. | Confirmado |
| **RN-012** | Cuando un caso se traslada a otra Oficina Local, la Oficina Local de origen cierra su responsabilidad mediante un cierre por traslado. | Confirmado conceptualmente |
| **RN-013** | La Oficina Local destino mantiene el ingreso por traslado en estado pendiente de continuidad hasta confirmar que la atención continuará en el nuevo ámbito. | Necesidad confirmada / detalle pendiente |
| **RN-014** | La recepción del expediente físico no equivale por sí sola a la confirmación de continuidad del caso en destino. | Confirmado conceptualmente |
| **RN-015** | Una actividad marcada como Reprogramada debe registrar una nueva fecha y el motivo de la reprogramación. | Confirmado |
| **RN-016** | Una actividad marcada como Cancelada debe registrar el motivo de cancelación. | Confirmado |
| **RN-017** | Oficina Local crea y modifica la programación; Regional y Nacional la consultan sin editarla. | Confirmado |
| **RN-018** | El ámbito de consulta y los filtros disponibles dependen del rol institucional del usuario. | Confirmado |
| **RN-019** | El consolidado es una salida dinámica de reportería y no requiere un proceso obligatorio de remisión o aprobación entre niveles. | Confirmado post-validación |
| **RN-020** | Toda exportación debe respetar el ámbito, los filtros y los permisos vigentes del usuario. | Confirmado |
| **RN-021** | La información cargada desde la plantilla Excel estandarizada debe ser revisada antes de confirmarse y, una vez aceptada, seguir las mismas reglas de una referencia digitada manualmente. | Propuesta de diseño validada |
| **RN-022** | El usuario digitador y el profesional responsable de una acción pueden ser personas diferentes; cuando ocurra, ambas responsabilidades deben conservarse de forma trazable. | Confirmado |
| **RN-023** | Regional y Nacional no modifican la gestión operativa de los casos dentro del alcance actual; su acceso individual es de consulta según permisos. | Confirmado |
| **RN-024** | Establecimiento solo puede consultar información mínima de A.I. y no accede al detalle interno de valoración, prioridad, plan, atenciones, documentos, coordinaciones, traslado, reportes o cierre. | Confirmado |
| **RN-025** | Personas únicas atendidas y total de atenciones son métricas distintas: una persona se contabiliza una vez en la primera y cada atención se contabiliza en la segunda. | Confirmado |
| **RN-026** | Los filtros de disciplina o profesional deben afectar únicamente los indicadores funcionalmente relacionados o identificar claramente cuáles métricas se encuentran filtradas. | Confirmado / definición funcional |

---

# 14. Requerimientos no funcionales

Los requerimientos no funcionales definen las condiciones de calidad, seguridad, integridad, usabilidad, rendimiento y mantenibilidad que deberá cumplir la solución SIA-CENCINAI. A diferencia de los requerimientos funcionales, estos requisitos no describen una operación específica de un actor, sino las propiedades que deben mantenerse de forma transversal en el sistema.

| ID | Categoría | Requerimiento no funcional | Prioridad |
| --- | --- | --- | --- |
| **RNF-001** | Seguridad y autorización | El sistema deberá aplicar control de acceso basado en rol y ámbito institucional en todas las consultas y operaciones. Las restricciones no deberán depender únicamente de ocultar opciones en la interfaz: la capa de servicio/datos deberá impedir que un usuario consulte o modifique información fuera de su Establecimiento, Oficina Local, Región o ámbito Nacional autorizado. | **P0** |
| **RNF-002** | Principio de mínimo privilegio | Cada rol deberá disponer únicamente de las capacidades necesarias para su función. Establecimiento tendrá acceso limitado a la información mínima de A.I.; Oficina Local concentrará la gestión operativa; Regional y Nacional accederán a la información permitida en modo de consulta cuando corresponda, sin habilitar acciones de edición reservadas a niveles operativos. | **P0** |
| **RNF-003** | Auditoría | El sistema deberá registrar de forma trazable los accesos y cambios relevantes sobre información de A.I., incluyendo como mínimo usuario, rol, fecha y hora, acción realizada y entidad afectada. Cuando exista modificación de información sensible o de estado, la auditoría deberá permitir identificar qué cambió y quién ejecutó la acción. | **P0** |
| **RNF-004** | Privacidad por diseño | La solución deberá minimizar la exposición de datos personales y sensibles en pantallas, listados, consultas y exportaciones. Cada vista deberá mostrar únicamente la información necesaria para el rol y propósito de uso, aplicando restricciones adicionales cuando existan datos sensibles sujetos a permisos reforzados. | **P0** |
| **RNF-005** | Integridad histórica | El sistema deberá preservar la historia de cada caso sin sobrescribir ni eliminar silenciosamente eventos anteriores. Aperturas, atenciones, cambios de estado, traslados, reportes, cierres y demás eventos relevantes deberán conservar su secuencia histórica; cualquier corrección posterior deberá mantener trazabilidad suficiente para reconstruir la evolución del caso. | **P0** |
| **RNF-006** | Trazabilidad y proveniencia de datos | Los registros relevantes deberán conservar, cuando aplique, la fuente de los datos, el usuario que digitó la información, el profesional responsable de la acción, la fecha real del evento y la fecha de digitación. Estas fechas y responsabilidades no deberán asumirse como equivalentes cuando correspondan a personas o momentos distintos. | **P0** |
| **RNF-007** | Consistencia transaccional | Las operaciones que modifican varias entidades relacionadas deberán ejecutarse de forma consistente. Procesos como apertura de caso, traslado, confirmación de continuidad, registro de atención grupal o cierre no deberán dejar estados parciales; si una operación no puede completarse, el sistema deberá evitar cambios incompletos o dejar evidencia controlada del error. | **P0** |
| **RNF-008** | Recuperabilidad de captura | Los formularios extensos de captura deberán reducir el riesgo de pérdida de información mediante autoguardado o mecanismos equivalentes de borrador. Tras una interrupción, el usuario deberá poder recuperar una captura no finalizada sin duplicar registros ya confirmados ni confundir un borrador con información definitiva. | **P0** |
| **RNF-009** | Usabilidad y mínima redigitación | La interfaz deberá priorizar la reutilización de datos maestros existentes y evitar solicitar nuevamente información ya disponible. Para seleccionar clientes/beneficiarias o casos se deberán utilizar búsquedas por identificación o nombre en lugar de listas masivas, y los datos recuperados deberán precargarse en los flujos que los requieran. | **P0** |
| **RNF-010** | Consistencia terminológica y de interacción | Los mismos conceptos deberán utilizar nombres, estados, etiquetas y patrones de interacción consistentes en todos los módulos. Términos como cliente/beneficiaria, referencia, caso A.I., prioridad, estado, Oficina Local y establecimiento no deberán variar entre pantallas salvo que exista una diferencia funcional real. Los componentes equivalentes deberán conservar también una presentación, jerarquía y comportamiento visual consistentes conforme a la Especificación de Diseño, Identidad Visual y Accesibilidad vigente. | **P0** |
| **RNF-011** | Ayuda contextual | Cada módulo o pantalla principal deberá incluir una ayuda breve y contextual que explique su propósito, el alcance del rol y las acciones disponibles, utilizando lenguaje institucional comprensible y evitando instrucciones técnicas o mensajes propios del entorno de desarrollo. | **P1** |
| **RNF-012** | Diseño responsive | La interfaz deberá poder utilizarse de forma funcional en equipos de escritorio, tabletas y dispositivos móviles empleados en escenarios de campo. Los controles, formularios, tablas y navegación deberán adaptarse al tamaño de pantalla sin ocultar información crítica ni obligar a desplazamientos horizontales innecesarios para completar tareas esenciales. La adaptación de la interfaz no deberá impedir la ampliación del contenido mediante las funciones estándar del navegador ni eliminar funcionalidades esenciales. | **P1** |
| **RNF-013** | Eficiencia de búsquedas y filtros | Las búsquedas por identificación o nombre y los filtros por ámbito, estado, prioridad, disciplina, profesional y período deberán responder de forma eficiente aun cuando aumente el volumen de registros. El sistema deberá evitar recorridos o cargas innecesarias de datos que no pertenecen al corte solicitado. | **P0** |
| **RNF-014** | Paginación y carga incremental | Los listados potencialmente extensos de clientes/beneficiarias, casos, referencias, programación y otros registros deberán utilizar paginación, carga incremental o un mecanismo equivalente, evitando presentar o transferir al cliente el universo completo de registros cuando no sea necesario. | **P0** |
| **RNF-015** | Procesamiento de filtros en la capa de datos | En la implementación productiva con backend, las búsquedas, filtros jerárquicos, paginación, conteos y consultas sobre conjuntos potencialmente grandes deberán resolverse preferentemente en la capa de servicio o datos. El cliente deberá recibir únicamente el conjunto necesario para la vista y los permisos del usuario. | **P1** |
| **RNF-016** | Escalabilidad | La arquitectura deberá soportar el crecimiento progresivo de clientes/beneficiarias, casos, atenciones, documentos, programación y registros históricos desde un ámbito local hasta consultas nacionales, sin requerir rediseñar los flujos funcionales ni cargar todos los datos en memoria del cliente. | **P1** |
| **RNF-017** | Consistencia de exportaciones | Toda exportación deberá respetar exactamente el ámbito, filtros y permisos vigentes al momento de generarse. Los archivos no deberán incluir registros o campos que el usuario no pueda consultar en pantalla y deberán identificar, cuando corresponda, el período y ámbito utilizados para producir el corte. | **P1** |
| **RNF-018** | Configurabilidad | Los elementos sujetos a evolución institucional —como motivos, factores, prioridades, estrategias, disciplinas, frecuencias, instituciones y tipos de actividad— deberán administrarse mediante catálogos configurables cuando sea técnicamente viable, evitando dependencias innecesarias de cambios de código para ajustes de contenido. | **P1** |
| **RNF-019** | Versionamiento funcional | Cuando cambien formularios, catálogos o reglas de negocio, el sistema deberá identificar la versión vigente y conservar la información necesaria para interpretar correctamente los registros históricos creados bajo versiones anteriores. | **P1** |
| **RNF-020** | Interoperabilidad con SIDINACC/CAH | La solución deberá diseñarse para interoperar con las fuentes institucionales existentes mediante identificadores estables y mecanismos de integración definidos, reutilizando datos maestros cuando estén disponibles. La integración no deberá exigir duplicar información institucional salvo que exista una necesidad técnica o histórica justificada. | **P1** |
| **RNF-021** | Validación e integridad de datos | El sistema deberá validar obligatoriedad, formato, relaciones jerárquicas y coherencia básica antes de confirmar operaciones. No deberá permitir, por ejemplo, asociar una Oficina Local a una Región incorrecta, un establecimiento a una Oficina Local incompatible o finalizar un flujo con datos obligatorios faltantes. | **P0** |
| **RNF-022 ** | Manejo de errores | Ante fallos de validación, integración, almacenamiento o procesamiento, el sistema deberá informar al usuario de manera clara qué ocurrió y qué acción puede realizar, sin exponer detalles técnicos sensibles. Los errores no deberán producir pérdida silenciosa de información ni dejar al usuario suponiendo que una operación fue confirmada cuando no lo fue. | **P0** |
| **RNF-023** | Identidad gráfica institucional | El sistema deberá mantener coherencia con los lineamientos vigentes de identidad gráfica de CEN-CINAI. Las interfaces y documentos generados deberán utilizar únicamente variantes autorizadas del logotipo, respetar sus proporciones y área de protección, y utilizar la paleta institucional como base de identidad visual. No se deberán deformar, recolorear, reconstruir ni generar variantes no autorizadas de los elementos oficiales de marca. | P0 |
| **RNF-024** | Accesibilidad digital | Las interfaces de SIA-CENCINAI deberán diseñarse e implementarse tomando como referencia los criterios aplicables de **WCAG 2.2 nivel AA** y los lineamientos institucionales vigentes de accesibilidad digital, procurando que el contenido sea perceptible, operable, comprensible y robusto para personas que utilicen diferentes dispositivos o tecnologías de asistencia. | P0 |
| **RNF-025** | Navegación mediante teclado | Todas las funcionalidades esenciales del sistema deberán poder utilizarse mediante teclado sin requerir obligatoriamente el uso de mouse. El orden de navegación deberá ser lógico y los elementos interactivos deberán presentar un indicador de foco visible durante la navegación. | P0 |
| **RNF-026** | Semántica y tecnologías de asistencia | Las interfaces deberán utilizar elementos y controles con semántica adecuada, incluyendo etiquetas asociadas a campos, encabezados jerárquicos, botones, enlaces y estructuras tabulares interpretables por tecnologías de asistencia. Cuando un control no disponga de texto visible suficiente, deberá proporcionar un nombre accesible equivalente. | P0 |
| **RNF-027** | Contraste y uso del color | La información, los estados y las acciones no deberán comunicarse exclusivamente mediante color. Los textos, controles, iconos y demás elementos funcionales deberán mantener contraste suficiente con respecto al fondo y utilizar, cuando corresponda, texto, iconografía, patrones u otros mecanismos adicionales para transmitir significado. | P0 |
| **RNF-028** | Legibilidad y ampliación | La interfaz deberá mantener legibilidad y funcionalidad al utilizar las herramientas estándar de ampliación del navegador. El aumento del contenido no deberá provocar pérdida de información, superposición de controles, texto cortado o desaparición de acciones esenciales. | P1 |
| **RNF-029** | Accesibilidad de imágenes y visualizaciones | Toda imagen, gráfico, diagrama o elemento visual que comunique información relevante deberá disponer de una alternativa textual adecuada. Las visualizaciones analíticas deberán incluir títulos, etiquetas y leyendas comprensibles y no depender únicamente de diferencias cromáticas para distinguir series, estados o categorías. | P1 |
| **RNF-030** | Accesibilidad de documentos generados | Los documentos y reportes electrónicos generados por SIA-CENCINAI deberán, cuando el formato y las herramientas utilizadas lo permitan, conservar una estructura accesible mediante títulos, orden lógico de lectura, texto seleccionable, tablas estructuradas, enlaces descriptivos y alternativas textuales para contenido no textual. | P1 |
| **RNF-031** | Validación de accesibilidad | Las interfaces y documentos electrónicos relevantes deberán someterse, antes de considerarse terminados, a verificaciones de accesibilidad mediante una combinación de herramientas automáticas y revisión manual. Como mínimo deberán comprobarse navegación por teclado, foco visible, contraste, etiquetas, orden lógico, alternativas textuales y ausencia de dependencia exclusiva del color. | P0 |
| **RNF-032** | Sistema de diseño y reutilización de componentes | Los elementos visuales e interactivos recurrentes deberán implementarse mediante componentes reutilizables y criterios centralizados de diseño. Colores, tipografías, espaciados, bordes, tamaños y estados comunes deberán gestionarse mediante variables, temas o *design tokens* equivalentes, evitando valores visuales arbitrarios distribuidos entre distintas pantallas. | P1 |

---

# 15. Reportería inicial

## 15.1 Filtros principales

Los filtros disponibles dependen del nivel institucional:

- **Oficina Local:** año/período, establecimiento, estado, prioridad, disciplina y profesional.
- **Regional:** año/período, Oficina Local, establecimiento, estado, prioridad, disciplina y profesional.
- **Nacional:** año/período, Región, Oficina Local, establecimiento, estado, prioridad, disciplina y profesional.

Los filtros territoriales deben mantener una relación jerárquica válida.

## 15.2 Indicadores principales

- Cantidad de casos.
- Cantidad de referencias.
- Personas únicas atendidas.
- Total de atenciones.

## 15.3 Visualizaciones iniciales

1. Casos por estado.
2. Casos por prioridad.
3. Personas únicas atendidas versus total de atenciones por disciplina.
4. Distribución territorial según el ámbito seleccionado.
5. Programación por estado cuando aporte valor al seguimiento.
6. Atenciones grupales y participantes cuando aporte valor analítico.

> **Regla analítica:** personas únicas atendidas y total de atenciones son métricas diferentes y deben mostrarse separadamente.

## 15.4 Consolidaciones

- Oficina Local puede consolidar su ámbito o un establecimiento.
- Regional puede consolidar su Región, una Oficina Local o un establecimiento.
- Nacional puede consolidar el país, una Región, una Oficina Local o un establecimiento.
- La consolidación utiliza los filtros vigentes y puede descargarse en formato compatible con Excel.
- No se requiere un proceso manual de remisión entre niveles para obtener estos cortes.

---

# 16. Integraciones y captura alternativa

| Elemento | Situación actual |
| --- | --- |
| **SIDINACC/CAH** | La interoperabilidad y reutilización de datos maestros son una necesidad del diseño; el mecanismo técnico definitivo depende del acceso y arquitectura institucional disponibles. |
| **Vigilancia / tamizajes** | Se busca reutilizar información existente y evitar redigitación; el punto exacto de entrada al flujo de A.I. y el actor responsable de revisión permanecen pendientes. |
| **Plantilla Excel estandarizada** | Capacidad incorporada en el diseño para descargar, completar, cargar, revisar y confirmar referencias bajo las mismas reglas de la captura manual. |
| **Migración histórica** | Se contempla un proceso controlado de validación, mapeo, detección de duplicados, importación y registro de errores. |
| **SINIRUBE** | Dependencia existente en el ecosistema institucional; el alcance directo de integración con SIA-CENCINAI debe definirse técnicamente. |
| **SNOMED CT** | Se utiliza únicamente como referencia/exploración terminológica; no constituye una integración formal del alcance actual. |
| **OCR** | Fuera del alcance funcional consolidado actual. |
| **Modo offline avanzado / sincronización** | Fuera del alcance funcional consolidado actual. |

---

# 17. Preguntas abiertas y decisiones pendientes

## 17.1 Traslado

- Nombre final del estado y de la acción de continuidad en destino.
- Tratamiento del traslado cuando la persona o familia no llega al ámbito destino.
- Tiempo durante el cual un ingreso permanece pendiente de continuidad.
- Relación exacta entre el flujo digital y el expediente físico.

## 17.2 Vigilancia → A.I.

- Punto institucional de entrada del hallazgo: establecimiento u Oficina Local.
- Actor responsable de revisar el hallazgo.
- Hallazgos que deben generar una alerta o candidato a referencia.
- Forma de reutilizar los datos sin perder contexto ni automatizar la decisión profesional.

## 17.3 Reportes

- Tipos definitivos de reporte.
- Estructura y contenido de cada reporte.
- Requisitos de firma, validación o aprobación cuando correspondan.

## 17.4 Seguridad

- Información individual exacta que Regional y Nacional podrán consultar en producción.
- Tipos de documentos o datos que requieren permisos reforzados.
- Reglas institucionales aplicables a exportaciones sensibles o anonimizadas.

## 17.5 Programación

- Catálogo definitivo de tipos de actividad.
- Datos obligatorios para cada tipo de atención programada.

## 17.6 Plantilla Excel

- Estructura final de la plantilla.
- Una referencia por archivo versus múltiples referencias.
- Estrategia de versionamiento y compatibilidad de plantillas.

## 17.7 Arquitectura e integraciones

- Mecanismo definitivo de consulta de datos maestros desde SIDINACC/CAH.
- Identificadores institucionales que se utilizarán como referencias estables.
- Alcance real de integraciones con servicios institucionales existentes.

---

# 18. Priorización revisada

## P0 — Núcleo

- Control de acceso por rol y ámbito.
- Búsqueda por identificación o nombre.
- Consulta de clientes/beneficiarias según nivel.
- Referencias manuales.
- Recepción de referencias en Oficina Local.
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
- Reportería básica.
- Trazabilidad, integridad histórica y auditoría.
- Recuperabilidad de capturas extensas.

## P1 — Segunda capa

- Impresión de referencias.
- Carga de referencias mediante Excel estandarizado.
- Documentos asociados.
- Coordinaciones interinstitucionales.
- Traslado y continuidad entre Oficinas Locales.
- Exportación de listados y consolidaciones.
- Consulta Regional y Nacional de programación.
- Reporterías jerárquicas.
- Consolidaciones dinámicas.
- Configuración de catálogos y versionamiento.
- Migración histórica.
- Interoperabilidad con fuentes institucionales.

## Evolución futura / fuera del compromiso funcional actual

- Automatización del punto de entrada vigilancia/tamizaje → A.I.
- Exportaciones anonimizadas sujetas a gobernanza.
- OCR.
- Modo offline avanzado con sincronización.
- Integración formal con SNOMED CT.
- Analítica longitudinal avanzada.

---

# 19. Fuentes de descubrimiento

| Fuente | Aporte principal |
| --- | --- |
| **PRO-D-AI-P-01 — borrador 2026** | Modelo objetivo del proceso de Atención Interdisciplinaria. |
| **Instrumentos operativos de A.I.** | Variables, campos y necesidades de registro. |
| **Reuniones y validaciones funcionales de septiembre de 2026** | Ajustes de roles, acceso, referencias, valoración, programación, traslados, reportería y simplificación de flujos. |
| **Prototipo navegable SIA-CENCINAI** | Validación de navegación, permisos, jerarquía, filtros y alcance funcional por rol. |
| **Documentación técnica de SIDINACC/CAH** | Referencia para datos maestros, jerarquía institucional e integración futura. |
| **SNOMED CT en español** | Referencia terminológica exploratoria; no implica integración formal. |

---

# 20. Registro de cambios

| Versión | Fecha | Cambio |
| --- | --- | --- |
| **0.1** | 09-09-2026 | Primera versión de consolidación funcional. |
| **0.2** | 15-09-2026 | Ampliación de atenciones grupales, reportería, trazabilidad y líneas exploratorias de continuidad operativa. |
| **0.3** | 16-09-2026 | Refinamiento post-validación: eliminación de Control de Calidad Regional, incorporación del rol Establecimiento, acceso jerárquico, búsqueda en lugar de selectores masivos, valoración simplificada, separación Reportes/Cierre, Programación, traslado refinado, reportería filtrable, consolidación dinámica, exportación Excel y carga de referencias desde plantilla. |
| **0.4** | 25-09-2026 | Consolidación integral y limpieza documental: 46 historias de usuario uniformes, 103 requerimientos funcionales especificados por actor, 34 casos de uso con estructura completa, 22 requerimientos no funcionales detallados, actualización de reglas de negocio, trazabilidad RF↔CU. |

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
