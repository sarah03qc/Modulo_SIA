# SIA-CENCINAI — Casos de Uso — v0.7

> **Origen canónico:** documento adjunto `Historias de Usuario y Requerimientos-updated.md`, versión 0.7, validación funcional con Alina del 02/11/2026. Los contenidos normativos de las secciones reproducidas abajo se conservan íntegramente de esa fuente. Las fechas vacías del encabezado o del historial de cambios de origen se mantienen sin inventar valores.
> **Uso:** insumo de contexto funcional para Cursor/Codex; no confundir especificación objetivo con código implementado en la maqueta.

**Archivos complementarios:** [`FUNCTIONAL_SPEC_v0.7.md`](FUNCTIONAL_SPEC_v0.7.md) · [`USE_CASES_v0.7.md`](USE_CASES_v0.7.md). El primero contiene íntegramente las secciones 1–9 y 11–21; el segundo contiene íntegramente la sección 10, incluidos el índice y los flujos de los casos de uso.

## Contexto mínimo de interpretación

- La jerarquía de acceso es **Establecimiento → Oficina Local → Región → Nivel Nacional**, según roles y permisos descritos en la sección 5 del archivo funcional.
- **HU-029 / CU-21 y RF-062 / RF-063** están retirados; sus identificadores se reservan por trazabilidad. El traslado cierra el caso de origen y no genera continuidad automática.
- **Un solo caso A.I. activo por persona** en cualquier ámbito. Las revaloraciones se registran dentro del caso vigente, sin sobrescribir su historial.
- **RN-009** determina la prioridad a partir de riesgo/protección definidos profesionalmente.
- El catálogo principal de Reportería contiene doce visualizaciones. La cobertura anual de atención sigue la definición operativa provisional de **RN-040**. El informe analítico de **HU-050 / CU-38** exige al menos cinco visualizaciones y un análisis humano por cada una.
- Consultar `FUNCTIONAL_SPEC_v0.7.md` para los textos completos de HU, RF, RN, RNF, alcance, trazabilidad, modelo conceptual y pendientes; este resumen es solo orientación y no sustituye esas definiciones.

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
| **CU-21** | Confirmar continuidad de un caso recibido por traslado — RETIRADO; identificador reservado, diagrama conservado | OL destino |
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
| CU-36 | Identificar casos activos sin atención en un período | Equipo Interdisciplinario — Oficina Local |
| CU-37 | Consultar posibles referencias pendientes detectadas desde fuentes institucionales | Personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local, según ámbito y permisos |
| CU-38 | Generar y descargar informe analítico con análisis por visualización | Oficina Local / Regional / Nacional con autorización vigente de Reportería |

## 10.1 Identidad, acceso y consulta de clientes/beneficiarias

### CU-01 — Consultar resumen de Atención Interdisciplinaria según rol

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-01 — Consultar resumen de Atención Interdisciplinaria según rol |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite que un usuario autorizado consulte, desde la página de inicio, un resumen de la actividad de Atención Interdisciplinaria correspondiente a su ámbito institucional y acceda a las funciones de seguimiento habilitadas para su rol. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El sistema conoce el rol y ámbito institucional del usuario. |
| **Flujo Normal** | 1. **Usuario:** Ingresa a la página de Inicio. 2. **Sistema:** Identifica el rol activo y determina el ámbito autorizado. 3. **Sistema:** Muestra el contexto institucional correspondiente al usuario. 4. **Sistema:** Calcula y presenta los indicadores disponibles para el rol. 5. **Usuario:** Selecciona un indicador o acceso rápido. 6. **Sistema:** Abre la sección correspondiente conservando el ámbito y permisos del usuario. |
| **Flujo Alternativo** | **FA-01 — Establecimiento** — El sistema muestra únicamente información del establecimiento, incluyendo referencias y clientes/beneficiarias relacionados con A.I., además de accesos a las funciones permitidas.FA-02 — Oficina Local — Se priorizan: 1) posibles referencias pendientes cuando su detección esté disponible, con acceso a su sección independiente; 2) referencias nuevas o pendientes; 3) casos activos; 4) próximas sesiones; 5) actividades programadas vencidas. Se conservan próximas acciones y otras capacidades válidas, sin indicadores de traslados pendientes de continuidad.**FA-03 — Regional** — El sistema resume clientes/beneficiarias, casos activos, atenciones y programación exclusivamente de la Región asignada.**FA-04 — Nacional** — El sistema resume la actividad disponible a nivel país y permite acceder a la consulta analítica y de programación nacional.**FA-05 — Sin datos** — Si no existen registros para un indicador, el sistema muestra valor cero o un mensaje equivalente sin ampliar el ámbito del usuario. |
| **Poscondiciones** | 1. El usuario visualiza un resumen coherente con su rol y ámbito. 2. Si seleccionó una acción, queda ubicado en la sección correspondiente sin alterar datos operativos. |
| **Trazabilidad** | RF-002, RF-003, RF-004, RF-005, RF-006, RF-007, RF-080; HU relacionadas: HU-001, HU-002, HU-003, HU-004 RF-127; HU-049. Inicio prioriza los indicadores operativos de HU-002, sin continuidad por traslado. |

*Figura 1: Diagrama de procesos de Caso de Uso CU-01*

### CU-02 — Buscar y seleccionar un cliente/beneficiaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-02 — Buscar y seleccionar un cliente/beneficiaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite localizar un cliente/beneficiaria por identificación o nombre dentro del ámbito autorizado del usuario y seleccionarlo para consulta o para continuar un flujo que requiera asociar una persona. La búsqueda es contextual en referencias, sesiones, casos, atenciones y otros flujos autorizados; no existe pantalla principal Personas/Clientes ni se carga un listado general de CAH/SIDINACC. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El usuario tiene acceso a una función que requiere localizar un cliente/beneficiaria. |
| **Flujo Normal** | 1. **Usuario:** Ingresa un número de identificación o un nombre en el buscador. 2. **Sistema:** Determina el ámbito institucional autorizado para el usuario. 3. **Sistema:** Busca coincidencias únicamente dentro de ese ámbito. 4. **Sistema:** Da precedencia a una coincidencia exacta por identificación y muestra las coincidencias por nombre cuando corresponda. 5. **Sistema:** Presenta resultados con información suficiente para distinguir a las personas. 6. **Usuario:** Selecciona el cliente/beneficiaria requerido. 7. **Sistema:** Carga la selección y reutiliza los datos maestros disponibles para continuar el flujo. |
| **Flujo Alternativo** | **FA-01 — Sin resultados** — El sistema informa que no existen coincidencias dentro del ámbito autorizado y no permite crear silenciosamente un duplicado.**FA-02 — Varias coincidencias por nombre** — El sistema muestra todas las coincidencias permitidas para que el usuario seleccione la correcta.**FA-03 — Resultado fuera de ámbito** — El sistema no muestra ni permite seleccionar registros que estén fuera del ámbito autorizado.**FA-04 — Cambio de selección** — Antes de guardar el flujo dependiente, el usuario puede retirar la selección y realizar una nueva búsqueda.**FA-05 — Múltiples establecimientos autorizados** — Cuando un usuario con acceso de nivel Establecimiento posee más de un establecimiento autorizado, el sistema habilita un filtro por establecimiento y limita sus opciones exclusivamente a los establecimientos autorizados para ese usuario.**FA-06 — Único establecimiento autorizado** — Cuando un usuario con acceso de nivel Establecimiento posee un único establecimiento autorizado, el sistema aplica dicho establecimiento automáticamente y no muestra el filtro de establecimiento. |
| **Poscondiciones** | 1. Queda seleccionado un cliente/beneficiaria válido dentro del ámbito autorizado. 2. Los datos maestros disponibles quedan listos para ser reutilizados en el flujo invocante. |
| **Trazabilidad** | RF-001, RF-002, RF-008, RF-009, RF-010, RF-012, RF-013, RF-014, RF-015, RF-020, RF-104, RF-122, RF-124; HU relacionadas: HU-005, HU-006, HU-007, HU-008 RF-020 queda pendiente de revisión para exportación masiva dependiente exclusivamente de la pantalla retirada; búsqueda contextual vigente mediante RF-008/RF-010/RF-124. |

*Figura 2: Diagrama de procesos de Caso de Uso CU-02*

### CU-03 — Consultar perfil de un cliente/beneficiaria según nivel de acceso

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-03 — Consultar perfil de un cliente/beneficiaria según nivel de acceso |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite consultar la información disponible de un cliente/beneficiaria y sus relaciones con Atención Interdisciplinaria, aplicando una vista diferente según el nivel institucional y los permisos de acceso. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. El cliente/beneficiaria fue localizado dentro del ámbito autorizado. La consulta se invoca desde un flujo contextual autorizado, manteniendo identidad, relaciones e historial según permisos, sin módulo general Personas/Clientes. |
| **Flujo Normal** | 1. **Usuario:** Selecciona un cliente/beneficiaria. 2. **Sistema:** Valida el rol y ámbito del usuario. 3. **Sistema:** Muestra los datos básicos permitidos y la ubicación institucional de la persona. 4. **Sistema:** Consulta los casos A.I. asociados que el usuario está autorizado a conocer. 5. **Usuario:** Selecciona la sección de resumen, casos o historial disponible para su rol. 6. **Sistema:** Presenta la información permitida sin exponer datos restringidos. 7. **Usuario:** Opcionalmente selecciona un caso cuando su rol permite acceder a su detalle. |
| **Flujo Alternativo** | FA-01 — Establecimiento — Se muestran datos básicos y contexto autorizado, identificador, estado, prioridad A.I. y fechas de apertura/cierre; no se permite abrir valoración completa, factores detallados, nivel de riesgo/protección ni gestión interna.FA-02 — Oficina Local — Se consultan datos básicos, casos e historial autorizado y se accede al detalle operativo del ámbito.FA-03 — Regional/Nacional — Consulta de su ámbito en solo lectura, aplicando restricciones de información sensible.FA-04 — Sin casos — Se informa ausencia de casos visibles sin ampliar permisos.FA-05 — Exportación de personas — Si dependía exclusivamente de la pantalla general Personas/Clientes retirada, queda PENDIENTE DE REVISIÓN conforme a RF-020, sin pantalla sustituta. Otras exportaciones autorizadas de flujos vigentes se conservan. |
| **Poscondiciones** | 1. La información consultada no se modifica. 2. El usuario mantiene el mismo ámbito y nivel de permisos durante toda la consulta. |
| **Trazabilidad** | RF-001, RF-002, RF-011, RF-012, RF-016, RF-017, RF-018, RF-019, RF-103, RF-112, RF-113, RF-124; HU relacionadas: HU-009, HU-010, HU-011, HU-012 |

*Figura 3: Diagrama de procesos de Caso de Uso CU-03*

## 10.2 Detección y referencia

### CU-04 — Crear manualmente una referencia a Atención Interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-04 — Crear manualmente una referencia a Atención Interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a personal autorizado de Establecimiento u Oficina Local registrar y enviar digitalmente una referencia estructurada a Atención Interdisciplinaria, preservando identidad responsable, contexto histórico, consecutivo y comprobante de envío para su análisis. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado con permiso para crear referencias. 2. El cliente/beneficiaria existe y pertenece al ámbito autorizado. |
| **Flujo Normal** | 1. Usuario: Inicia una referencia y selecciona captura manual. 2. Usuario: Busca y selecciona al cliente/beneficiaria por identificación o nombre dentro de su ámbito. 3. Sistema: Reutiliza datos disponibles mediante fuentes institucionales autorizadas y presenta identificación y contexto en orden Región → Oficina Local → Establecimiento, junto con modalidades/servicios y persona encargada, relación, contacto y dirección cuando existan. 4. Sistema: Obtiene la identidad institucional autenticada como responsable de solo lectura. 5. Usuario: Registra fecha de referencia y selecciona Vía de Atención Urgencia o No inmediata, diferenciada de prioridad A.I. 6. Usuario: Selecciona origen entre Vigilancia / tamizaje, Observación, Información aportada por la familia u otros o Referencia externa. 7. Usuario: Selecciona uno o varios motivos del catálogo vigente de RF-024 y registra especificaciones asociadas cuando corresponda. 8. Usuario: Registra separadamente acciones previas, resultados previos e información complementaria asociada al motivo de referencia. 9. Sistema: Presenta el resumen para revisión y valida campos y asociación territorial. 10. Usuario: Revisa y confirma el envío digital. 11. Sistema: Registra la referencia con consecutivo conforme a RF-114/RF-115 y contexto histórico conforme a RF-116, incluyendo edad de referencia disponible. 12. Sistema: Registra automáticamente fecha, hora y usuario del envío como comprobante no editable, conserva responsable y deja la referencia disponible inmediatamente en Oficina Local como Pendiente de revisión. Sistema: Antes de registrar la referencia comprueba globalmente si la persona posee un caso A.I. activo, aun en otro establecimiento u Oficina Local. Si existe, bloquea la referencia incompatible e informa sin revelar detalles internos no autorizados; una referencia pendiente no equivale a caso activo y los casos anteriores cerrados permiten una nueva referencia. |
| **Flujo Alternativo** | FA-01 — Persona o datos obligatorios inválidos — El sistema solicita corregir antes del envío.FA-02 — Responsable — No se permite seleccionar ni escribir otro responsable, aunque la captura provenga de plantilla.FA-03 — Motivos — Crecimiento utiliza Condición de malnutrición y Malnutrición con necesidades especiales; Desarrollo únicamente EDIN II: riesgo de retraso (rojo) y EVADE: riesgo de rezago (0,1 sin logro de edad anterior); Salud conserva Otra condición de salud cuando exista; Factores de riesgo utiliza individual, hogar-familiar y comunitario, sin Otro genérico.FA-04 — Desmarcar motivo — Se elimina o invalida su especificación asociada.FA-05 — Corrección o cancelación — Antes de enviar se permite regresar y corregir o cancelar sin referencia enviada.FA-06 — Interrupción — Se recupera el borrador cuando las reglas de seguridad lo permiten; un borrador no acredita envío.FA-07 — Datos institucionales no disponibles — Se informa su disponibilidad sin afirmar integración productiva ni exigir redigitación de datos que sí estén disponibles. Caso A.I. activo existente: no se registra la nueva referencia incompatible; se informa del bloqueo con protección de detalles internos no autorizados. |
| **Poscondiciones** | - La referencia enviada queda vinculada a cliente/beneficiaria y contexto histórico institucional, con consecutivo y responsable preservados. - La referencia queda Pendiente de revisión e inmediatamente disponible en Oficina Local, sin recepción manual ni traslado físico obligatorio. - Fecha, hora y usuario de envío quedan como comprobante inalterable y diferenciados de generación o impresión documental. El registro confirmado respeta el control global de caso activo de RF-021; no se confunde una referencia pendiente con un caso activo. |
| **Trazabilidad** | RF-010, RF-011, RF-021, RF-022, RF-023, RF-024, RF-025, RF-026, RF-027, RF-028, RF-029, RF-030, RF-034, RF-037, RF-097, RF-098, RF-102, RF-112, RF-113, RF-114, RF-115, RF-116, RF-119; HU relacionadas: HU-013 RF-048; RN-002. Control de caso activo antes del registro y revalidación posterior en apertura. |

*Figura 4: Diagrama de procesos de Caso de Uso CU-04*

### CU-05 — Cargar una referencia desde plantilla estandarizada

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-05 — Cargar una referencia desde plantilla estandarizada |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite cargar una referencia previamente capturada en una plantilla estandarizada, precargar el formulario y exigir revisión humana antes de registrar la referencia definitiva. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado con permiso para crear referencias. 2. Existe una plantilla estandarizada disponible para descarga o un archivo previamente completado. |
| **Flujo Normal** | 1. **Usuario:** Inicia una nueva referencia y selecciona la opción de cargar plantilla estandarizada. 2. **Sistema:** Permite descargar la plantilla vigente si el usuario la necesita. 3. **Usuario:** Selecciona el archivo completado. 4. **Sistema:** Valida que el archivo corresponda con la estructura esperada. 5. **Sistema:** Lee los datos compatibles y precarga el formulario de referencia. 6. **Sistema:** Indica que la información precargada debe ser revisada antes de guardarse. 7. **Usuario:** Revisa y corrige los valores precargados. 8. **Sistema:** Aplica las mismas validaciones utilizadas en la captura manual. 9. **Usuario:** Confirma el registro. 10. **Sistema:** Guarda la referencia y la vincula con la jerarquía institucional correspondiente. 11. **Sistema:** Antes de confirmar el envío obtiene el responsable de la sesión autenticada y aplica los catálogos, campos diferenciados, consecutivo y contexto histórico de CU-04. Al confirmar registra automáticamente fecha, hora y usuario de envío y deja la referencia inmediatamente disponible en Oficina Local como Pendiente de revisión. Sistema: Antes de registrar la referencia comprueba globalmente si la persona posee un caso A.I. activo, aun en otro establecimiento u Oficina Local. Si existe, bloquea la referencia incompatible e informa sin revelar detalles internos no autorizados; una referencia pendiente no equivale a caso activo y los casos anteriores cerrados permiten una nueva referencia. |
| **Flujo Alternativo** | FA-01 — Archivo inválido — No se crea referencia y se informa el problema.FA-02 — Persona no localizada o datos incompletos — Se requiere resolver la identificación y completar datos antes de confirmar.FA-03 — Corrección — Se corrigen datos precargados permitidos; responsable autenticado y trazabilidad de envío no son editables ni sustituibles desde la plantilla.FA-04 — Cancelación — No se registra una referencia enviada. Caso A.I. activo existente: no se registra la nueva referencia incompatible; se informa del bloqueo con protección de detalles internos no autorizados. |
| **Poscondiciones** | - La referencia enviada cumple las mismas reglas de captura directa, contexto histórico, consecutivo, campos diferenciados y catálogos de CU-04. - Se conserva al responsable autenticado y el comprobante automático de fecha, hora y usuario del envío; Oficina Local dispone inmediatamente de la referencia sin recibido manual. El registro confirmado respeta el control global de caso activo de RF-021; no se confunde una referencia pendiente con un caso activo. |
| **Trazabilidad** | RF-022, RF-023, RF-024, RF-027, RF-030, RF-034, RF-036, RF-037, RF-097, RF-114, RF-115, RF-116; HU relacionadas: HU-014 RF-021, RF-048; RN-002. Plantilla sujeta a las mismas restricciones globales. |

*Figura 5: Diagrama de procesos de Caso de Uso CU-05*

### CU-06 — Consultar y gestionar referencias según ámbito

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-06 — Consultar y gestionar referencias según ámbito |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite consultar y buscar referencias a Atención Interdisciplinaria dentro del ámbito de Establecimiento u Oficina Local, revisar detalle, estado y comprobante de envío y generar su versión imprimible. El envío digital constituye la entrega sin recepción manual. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. Existen referencias dentro de su ámbito o el sistema puede mostrar una bandeja vacía. |
| **Flujo Normal** | 1. Usuario: Abre Referencias. 2. Sistema: Restringe la bandeja a los establecimientos autorizados o a la Oficina Local del usuario. 3. Sistema: Presenta consecutivo, cliente/beneficiaria, identificación, establecimiento, responsable, fecha/hora de envío, estado y Vía de Atención. 4. Usuario: Busca por identificación, nombre o consecutivo y filtra por estado, Vía de Atención, origen, categoría o motivo vigente. 5. Usuario: Selecciona una referencia. 6. Sistema: Muestra identificación y contexto histórico en orden Región → Oficina Local → Establecimiento, fecha de referencia, comprobante de envío no editable, origen, motivos y especificaciones, acciones previas, resultados e información complementaria asociada al motivo. 7. Usuario: Consulta la información o solicita impresión conforme a permisos. |
| **Flujo Alternativo** | FA-01 — Referencia recién enviada — Está inmediatamente disponible en Oficina Local como Pendiente de revisión; no se solicita recibido manual.FA-02 — Análisis interdisciplinario — Oficina Local continúa mediante CU-07 a CU-10; el resultado es Admitida a A.I. al confirmar admisión o No requiere A.I. con justificación, sin Rechazada ni estado manual Recibida.FA-03 — Impresión — Se genera la salida de RF-035 con título, consecutivo, fecha de referencia, fecha/hora de envío, responsable, identificación, nombre, nacimiento, edad histórica, sexo, modalidades, Región → Oficina Local → Establecimiento, persona encargada, relación, contacto, dirección, Vía de Atención, origen, motivos, especificaciones, acciones previas, resultados e información complementaria según disponibilidad. Se distinguen fecha/hora de generación o impresión y envío; se aplica logo, encabezado y paginación cuando exista diseño aprobado.FA-04 — Sin registros o fuera de ámbito — Se muestra bandeja vacía o se deniega el acceso sin ampliar permisos. |
| **Poscondiciones** | - La consulta e impresión no modifican el registro de referencia. - La referencia conserva contexto histórico, responsable y comprobante de envío. - El análisis y la admisión se realizan exclusivamente mediante los flujos autorizados de Oficina Local. |
| **Trazabilidad** | RF-015, RF-023, RF-027, RF-030, RF-031, RF-032, RF-033, RF-034, RF-035, RF-097, RF-112, RF-114, RF-115, RF-116, RF-117, RF-123, RF-124; HU relacionadas: HU-015, HU-016, HU-017, HU-018 |

*Figura 6: Diagrama de procesos de Caso de Uso CU-06*

### CU-37 — Consultar posibles referencias pendientes detectadas desde fuentes institucionales

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-37 — Consultar posibles referencias pendientes detectadas desde fuentes institucionales |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 29 de octubre de 2026 |
| **Descripción** | Permite consultar Posibles referencias como sección independiente de la bandeja ordinaria de Referencias e iniciar una referencia con revisión humana, dentro del ámbito autorizado. La sección y su experiencia funcional están validadas; la detección automática depende de integración con fuentes autorizadas y coordinación con UTIC, sin declararse implementada en producción. |
| **Actores** | - Principal: Personal autorizado de Establecimiento (profesional, ASC2 / ASC3) y Oficina Local, según ámbito y permisos. - Secundarios: Sistema y fuentes institucionales autorizadas. |
| **Precondiciones** | 1. Usuario autenticado con permiso y ámbito autorizados para consultar posibles referencias pendientes. 2. Mecanismo de integración institucional habilitado y criterios vigentes definidos para la detección. |
| **Flujo Normal** | 1. Usuario: Accede a la sección independiente Posibles referencias. 2. Sistema: Consulta las situaciones disponibles de fuente institucional autorizada que cumplen criterios vigentes y no tienen referencia equivalente gestionada en SIA. 3. Sistema: Restringe resultados al ámbito del usuario y evita duplicados. 4. Sistema: Muestra cliente/beneficiaria, establecimiento, motivo o criterio de detección y fecha o período del resultado cuando estén disponibles. Usuario: Utiliza paginación, búsqueda por identificación y nombre y filtros por establecimiento, fecha de detección y criterio o categoría; el sistema mantiene ámbito y permisos. 5. Usuario: Revisa una situación y localiza al cliente/beneficiaria o inicia la creación autorizada de referencia. 6. Sistema: Continúa mediante CU-04 o CU-05, con revisión humana y envío digital. 7. Sistema: Al gestionarse la referencia correspondiente, deja de mostrar la situación como pendiente y conserva trazabilidad. Sistema: Antes de confirmar la referencia comprueba que no exista equivalente duplicada ni caso A.I. activo incompatible. Si hay intentos concurrentes desde la misma sugerencia, solo confirma una operación válida y conserva trazabilidad de detección y gestión. |
| **Flujo Alternativo** | FA-01 — Referencia equivalente existente — Se excluye el pendiente y se evita duplicar referencia.FA-02 — Sin datos o integración no disponible — Se informa la disponibilidad sin inventar resultados ni solicitar recaptura de variables de vigilancia.FA-03 — Criterio no vigente — No se presenta como pendiente bajo ese criterio.FA-04 — Fuera de ámbito — Se deniega el acceso sin exponer información interna.FA-05 — Usuario no confirma referencia — No se abre caso ni se da por realizada una gestión inexistente. Intento concurrente o duplicado equivalente: solo una creación válida puede confirmarse; los demás intentos no crean duplicados y reciben información sin detalles internos no autorizados. Caso activo incompatible: se bloquea la referencia conforme a RF-021. |
| **Poscondiciones** | - Se consultaron únicamente situaciones pendientes dentro del ámbito autorizado. - La referencia, si se gestiona, sigue el flujo normal de revisión profesional; no se abre automáticamente un caso. - El pendiente gestionado se resuelve sin duplicar datos fuente. |
| **Reglas de negocio** | Se reutilizan resultados autorizados, sin recalcular EDIN II/EVADE ni reconstruir vigilancia. Los criterios pueden considerar malnutrición que amerita referencia, EDIN II rojo y EVADE 0/1 bajo definición institucional vigente. UTIC definirá el mecanismo de integración sin periodicidad impuesta. Aplican RN-037 y el control global de caso activo de RN-002. La sección está validada; la detección automática no se considera productiva hasta disponer de la integración autorizada coordinada con UTIC. |
| **Trazabilidad** | HU-049; RF-127; RF-102; RF-002; RF-104; CU-04; CU-05. RF-021, RF-030, RF-048; RN-002, RN-037; CU-04, CU-05. Sección independiente validada; detección automática dependiente de integración autorizada/UTIC. |

---

## 10.3 Sesión y valoración interdisciplinaria

### CU-07 — Gestionar una sesión interdisciplinaria

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-07 — Gestionar una sesión interdisciplinaria |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario de Oficina Local crear una sesión, registrar sus datos generales e incorporar múltiples referencias o casos para analizarlos individualmente. También permite otra sesión para revalorar situaciones nuevas de un caso activo del ámbito, sin crear otro caso. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. El usuario pertenece a Oficina Local y tiene permiso para gestionar sesiones. 2. Las referencias que se incorporen pertenecen al ámbito de la Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Sesiones interdisciplinarias. 2. **Sistema:** Muestra las sesiones existentes de la Oficina Local. 3. **Usuario:** Crea una nueva sesión. 4. **Usuario:** Registra fecha, hora de inicio, hora de finalización, lugar y disciplinas participantes. Selecciona las Disciplinas mediante selector múltiple convencional y compacto, preservando el catálogo vigente. 5. **Usuario:** Guarda la sesión. 6. **Sistema:** Registra la sesión con su estado inicial. 7. **Usuario:** Busca referencias o casos por identificación o nombre. 8. **Sistema:** Muestra únicamente candidatos permitidos dentro de la Oficina Local. 9. **Usuario:** Agrega uno o varios casos a la sesión. 10. **Sistema:** Asocia los casos evitando duplicados. 11. **Usuario:** Selecciona individualmente los casos de la sesión para continuar con su valoración. La Valoración situacional continúa en CU-08, con categorías de Factores colapsables y validación de respuesta explícita antes de avanzar en la etapa correspondiente. 12. **Sistema:** Utiliza únicamente disciplinas vigentes sin opción genérica Otra; la sesión interdisciplinaria comprende análisis de casos, priorización, valoración y toma de decisiones del equipo. Usuario: Incorpora un caso A.I. activo localizado por identificación o nombre para revalorarlo en esta nueva sesión; el sistema evita duplicarlo dentro de la sesión y continúa mediante CU-08. |
| **Flujo Alternativo** | **FA-01 — Sesión sin casos iniciales** — El usuario guarda la sesión sin casos y los incorpora posteriormente.**FA-02 — Caso ya agregado** — El sistema evita que la misma referencia se agregue nuevamente.**FA-03 — Sin coincidencias** — El sistema informa que no existen referencias o casos que cumplan la búsqueda dentro del ámbito.**FA-04 — Interrupción de captura** — Si existe un borrador válido, el sistema permite recuperar los datos de la sesión antes de su confirmación definitiva. |
| **Poscondiciones** | 1. La sesión queda registrada dentro de la Oficina Local. 2. Los casos incorporados quedan disponibles para su análisis individual en la sesión. |
| **Trazabilidad** | RF-010, RF-038, RF-039, RF-040, RF-098, RF-120; HU relacionadas: HU-019 HU-019 CA-02/CA-08; RNF-009; valoración de Factores y RN-008 mediante CU-08. Fuente: Sesión de validación funcional del prototipo — 30 de octubre de 2026. Impacto esperado en prototipo: selector múltiple de Disciplinas y acceso a valoración actualizada. RF-041, RF-042, RF-047, RF-118; HU-020, HU-022, HU-025; RN-007, RN-009. Incluye sesiones de revaloración sin otro caso. |

*Figura 7: Diagrama de procesos de Caso de Uso CU-07*

### CU-08 — Registrar valoración situacional de un caso

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-08 — Registrar valoración situacional de un caso |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al Equipo Interdisciplinario registrar de forma estructurada los factores protectores, factores de riesgo y signos de alerta identificados en los ámbitos Individual, Hogar/Familiar y Comunitario para un caso analizado. Admite valoraciones posteriores a la apertura en una nueva sesión del caso activo, sin sobrescribir valoraciones anteriores. |
| **Actores** | - Equipo Interdisciplinario (EE.II.) — Oficina Local |
| **Precondiciones** | 1. Existe una sesión interdisciplinaria accesible. 2. El caso o referencia fue incorporado a la sesión. |
| **Flujo Normal** | 1. **Usuario:** Selecciona un caso dentro de la sesión. 2. **Sistema:** Muestra la información disponible de la referencia y el formulario de valoración. Presenta cada categoría de Factores inicialmente compacta, sin mostrar obligatoriamente todos los factores a la vez. 3. **Usuario:** Revisa el ámbito Individual y selecciona los factores protectores, de riesgo y signos de alerta que correspondan. Abre cada categoría al hacer clic; el sistema muestra sus factores. Selecciona uno o más factores aplicables o Ninguno cuando la categoría fue revisada sin identificar factores aplicables, mediante controles estructurados de selección múltiple. Puede cerrar y reabrir la categoría; el sistema conserva sus selecciones. 4. **Usuario:** Repite el análisis para el ámbito Hogar/Familiar. Aplica la misma revisión por categoría y respuesta explícita con factor(es) o Ninguno. 5. **Usuario:** Repite el análisis para el ámbito Comunitario. Aplica la misma revisión por categoría y respuesta explícita con factor(es) o Ninguno. 6. **Usuario:** Agrega una especificación textual a cualquier factor seleccionado que requiera contexto adicional. 7. **Usuario:** Registra los comentarios o resumen de valoración que correspondan. 8. Sistema: Al intentar continuar o finalizar la etapa correspondiente, valida que cada categoría requerida según la definición funcional vigente tenga factor(es) o Ninguno y que Ninguno no coexista con otros factores de esa categoría (RN-008). Si las respuestas son válidas, conserva la valoración asociada al caso y permite continuar; de lo contrario aplica FA-06/FA-07. 9. **Usuario:** Establece profesionalmente el nivel global de riesgo Alto, Moderado o Bajo y el nivel de protección Alta, Moderada o Baja. 10. **Sistema:** Conserva ambos valores independientes; los checkboxes no los determinan automáticamente. Usuario: En la nueva sesión del caso activo registra otra valoración e incorpora nuevos factores protectores, de riesgo o signos de alerta; actualiza profesionalmente riesgo y protección. Sistema: Recalcula prioridad por RN-009 sin selección manual y conserva valoración, prioridad, sesión, fecha y responsables junto con la historia anterior. Usuario: Actualiza abordaje o plan cuando corresponda, sin abrir otro caso. |
| **Flujo Alternativo** | FA-01 — Elemento abierto — Solo cuando el instrumento vigente lo contemple se utiliza Otro o Entre otros con especificación; esta regla no reincorpora motivos genéricos de referencia.FA-02 — Múltiples factores — Se permiten varios por ámbito y categoría.FA-03 — Factor desmarcado — Se elimina o invalida el detalle asociado.FA-04 — Campos no obligatorios — No se exige intensidad, frecuencia ni persistencia.FA-05 — Interrupción — Se recupera un borrador válido antes de confirmar.**FA-06 — Categoría requerida sin respuesta** — El sistema identifica cuáles categorías están pendientes, muestra una validación comprensible y no permite continuar/finalizar la etapa hasta registrar factor(es) o Ninguno. La opción Ninguno no representa pendiente ni desconocido.**FA-07 — Ninguno incompatible con otros factores** — Ninguno y otro factor de la misma categoría no son una combinación válida. Al seleccionar un factor deberá retirarse Ninguno o exigirse que la persona lo desmarque antes de continuar, sin imponer un comportamiento visual específico. |
| **Poscondiciones** | 1. La valoración situacional queda vinculada con el caso analizado. 2. La valoración queda disponible para sustentar la resolución sobre si requiere A.I. En una revaloración, se conserva el mismo caso activo y quedan disponibles valoraciones y prioridades históricas, fechas y responsables sin sobrescribir el pasado. |
| **Trazabilidad** | RF-041, RF-042, RF-043, RF-044, RF-098, RF-118, RF-120; HU relacionadas: HU-020 RN-008; HU-020 CA-12 a CA-14; RNF-009 y RNF-021. Fuente: Sesión de validación funcional del prototipo — 30 de octubre de 2026. Impacto esperado en prototipo: categorías colapsables, persistencia al cerrar/reabrir y validación de respuesta/exclusividad. RF-040, RF-047, RF-055; HU-019, HU-022, HU-025; RN-007, RN-009. Conserva valoraciones y prioridades históricas. |

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
| **Flujo Alternativo** | FA-01 — No requiere A.I. — El sistema exige justificación antes de confirmar, conserva valoración y resolución, actualiza el resultado de la referencia como No requiere A.I. y no abre caso activo.FA-02 — Sí requiere A.I. — Continúa en CU-10 con riesgo, protección, prioridad calculada, propósito, estrategias, disciplinas y frecuencia.FA-03 — Decisión pendiente o justificación faltante — No se confirma la resolución ni se abre caso activo hasta completar los datos necesarios. Caso activo existente: una resolución positiva no autoriza abrir otro caso simultáneo en ningún ámbito. Si surgen situaciones nuevas durante el caso activo, se continúa por nueva sesión y revaloración del mismo caso mediante CU-07/CU-08, según permisos. |
| **Poscondiciones** | 1. La decisión interdisciplinaria queda registrada y trazable. 2. Si la decisión es positiva, el caso queda listo para definir su abordaje inicial; si es negativa, no se crea un caso A.I. activo. |
| **Trazabilidad** | RF-034, RF-045, RF-046; HU relacionadas: HU-021 RF-021, RF-048; RN-002. La decisión positiva no autoriza dos casos activos. |

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
| **Flujo Normal** | 1. Usuario: Accede al abordaje de una situación con resolución Sí requiere A.I. 2. Usuario: Revisa o completa los niveles profesionales de riesgo y protección. 3. Sistema: Calcula prioridad conforme a RN-009, sin selección manual, y muestra Alto/rojo, Moderado/ámbar o Bajo/verde con denominación textual. 4. Usuario: Registra propósitos y selecciona estrategias y disciplinas del catálogo vigente, sin Otra genérica. 5. Usuario: Define frecuencia planificada utilizando las alternativas vigentes, incluyendo Trimestral, Semestral y Según necesidad. 6. Usuario: Revisa y confirma la apertura. 7. Sistema: Crea caso Activo vinculado con cliente/beneficiaria, referencia, consecutivo institucional, contexto histórico de origen y ámbito. 8. Sistema: Actualiza la referencia a Admitida a A.I. y registra admisión en la línea de tiempo. Sistema: Inmediatamente al confirmar y antes de crear el caso, verifica nuevamente que la persona no posea otro A.I. activo en ningún establecimiento u Oficina Local; solo confirma una apertura válida para evitar duplicados por concurrencia. |
| **Flujo Alternativo** | FA-01 — Datos incompletos — Se impide la apertura hasta completar los requeridos.FA-02 — Corrección — Se corrigen riesgo/protección, propósitos, estrategias, disciplinas o frecuencia; la prioridad se recalcula por RN-009 y no se edita directamente.FA-03 — Cancelación — No se abre caso; la resolución positiva se conserva conforme al flujo vigente.FA-04 — Frecuencia — Expresa periodicidad ideal o planificada del abordaje, sin garantizar cada intervalo ni determinar la periodicidad institucional de reuniones. Caso activo o apertura concurrente: se bloquea la apertura adicional y se informa sin detalles internos no autorizados. Los casos históricos cerrados no impiden abrir uno nuevo; las referencias pendientes no son casos activos. Revaloración de caso activo: se recalcula prioridad por RN-009 y se actualiza abordaje o plan cuando corresponda, conservando historia y sin ejecutar otra apertura. |
| **Poscondiciones** | - Existe caso A.I. activo con riesgo, protección, prioridad calculada y abordaje inicial. - Se conservan referencia, consecutivo y contexto histórico de ingreso, sin cambios retroactivos por actualización de fuentes maestras. - La referencia queda Admitida a A.I. y se conserva el evento de admisión. Nunca hay dos casos A.I. activos simultáneos de una persona entre ámbitos; una revaloración conserva el mismo caso y las prioridades y abordajes históricos. |
| **Trazabilidad** | RF-034, RF-047, RF-048, RF-097, RF-114, RF-115, RF-116, RF-118, RF-119, RF-120; HU relacionadas: HU-022 RF-021, RF-040, RF-041, RF-042, RF-055; HU-019, HU-020, HU-025; RN-002, RN-007, RN-009. Unicidad al confirmar y actualización del abordaje del caso activo. |

*Figura 10: Diagrama de procesos de Caso de Uso CU-10*

## 10.4 Consulta y gestión de casos A.I.

### CU-11 — Consultar lista simplificada de A.I. desde Establecimiento

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-11 — Consultar lista simplificada de A.I. desde Establecimiento |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al profesional, ASC2 o ASC3 con acceso de nivel Establecimiento consultar una lista mínima de los casos A.I. correspondientes a sus establecimientos autorizados, sin exponer el detalle interno de la gestión interdisciplinaria. |
| **Actores** | - Profesional / ASC2 / ASC3 — Establecimiento |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso de nivel Establecimiento y el sistema dispone de sus establecimientos autorizados. |
| **Flujo Normal** | 1. Usuario: Abre Lista de A.I. 2. Sistema: Restringe los casos a los establecimientos autorizados del profesional, ASC2 o ASC3. 3. Usuario: Busca por identificación o nombre y filtra por estado o prioridad Alto, Moderado o Bajo. 4. Sistema: Combina los filtros y muestra cantidad, nombre, identificación, establecimiento, estado, prioridad A.I. y fechas de apertura/cierre aplicables. 5. Usuario: Consulta la información permitida sin acceder al detalle interno. |
| **Flujo Alternativo** | FA-01 — Sin coincidencias — Se informa sin ampliar el ámbito.FA-02 — Intento de acceso interno — No se permite valoración completa, factores, nivel de riesgo/protección, plan, estrategias, disciplinas, frecuencia, línea de tiempo o atenciones detalladas, documentos, coordinaciones, traslados, reportes internos ni cierre operativo.FA-03 — Exportación — La lista no permite exportación para Establecimiento.FA-04 — Varios establecimientos — Se filtra exclusivamente entre los autorizados.FA-05 — Único establecimiento — Se aplica automáticamente. |
| **Poscondiciones** | 1. No se modifica ningún caso. 2. El usuario solo accede a la información mínima autorizada correspondiente a sus establecimientos autorizados. |
| **Trazabilidad** | RF-002, RF-012, RF-013, RF-015, RF-017, RF-049, RF-050, RF-104, RF-124; HU relacionadas: HU-023 |

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
| **Flujo Alternativo** | **FA-01 — Sin filtros** — El sistema muestra todos los casos visibles de la Oficina Local.**FA-02 — Sin resultados** — El sistema muestra una lista vacía y conserva los filtros para que el usuario pueda modificarlos.**FA-03 — Exportación** — El sistema genera un archivo Excel respetando búsqueda, establecimiento, estado, prioridad y ámbito.**FA-04 — Casos sin atención** — El usuario selecciona la consulta CU-36 para evaluar casos activos sin atención en un período o año, independientemente de la programación, y consultar la última atención. |
| **Poscondiciones** | 1. El listado refleja únicamente los casos que cumplen los criterios aplicados. 2. Si se exportó, el archivo corresponde al mismo corte visible. |
| **Trazabilidad** | RF-002, RF-015, RF-018, RF-051, RF-054, RF-119, RF-122, RF-124, RF-125, RF-126; HU relacionadas: HU-024 |

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
| **Flujo Normal** | 1. **Usuario:** Abre el caso A.I. 2. **Sistema:** Muestra cliente/beneficiaria, identificación, establecimiento, identificador del caso, fecha de apertura, estado y prioridad. 3. **Usuario:** Consulta el Resumen. 4. **Sistema:** Muestra valoración vigente, propósitos y próxima acción cuando exista. 5. **Usuario:** Consulta la Línea de tiempo. 6. **Sistema:** Muestra cronológicamente los eventos registrados con su fecha, disciplina, profesional y detalle disponible. 7. **Usuario:** Consulta el Plan de atención. 8. **Sistema:** Muestra estrategias, disciplinas y frecuencia vigentes. 9. **Usuario:** Navega a las funciones adicionales disponibles: documentos, coordinaciones, traslado, reportes o cierre. 10. **Sistema:** Muestra el consecutivo de la referencia de origen, su contexto histórico disponible, nivel de riesgo, nivel de protección, prioridad calculada y fecha de última atención o Sin atención registrada cuando nunca exista. Sistema: Permite consultar valoraciones y prioridades históricas con sesiones, fechas y responsables, mostrando las vigentes en el resumen. Usuario: Ante situaciones nuevas de un caso activo, inicia la nueva sesión y revaloración autorizada de CU-07/CU-08, con actualización de abordaje o plan cuando corresponda, sin crear otro caso. |
| **Flujo Alternativo** | **FA-01 — Caso cerrado** — El sistema mantiene disponible la consulta histórica y restringe las acciones que ya no correspondan.**FA-02 — Sin próxima acción** — El sistema indica expresamente que no existe una próxima acción registrada.**FA-03 — Información restringida** — El sistema aplica permisos adicionales antes de mostrar información sensible. Cierre por Traslado: el historial anterior permanece conservado y consultable según permisos, sin ingreso pendiente, confirmación de continuidad ni vinculación obligatoria a un caso posterior. |
| **Poscondiciones** | 1. La consulta no modifica el caso por sí misma. 2. El usuario puede iniciar únicamente las acciones operativas para las que tenga permiso. |
| **Trazabilidad** | RF-002, RF-018, RF-055, RF-057, RF-103, RF-112, RF-115, RF-116, RF-126; HU relacionadas: HU-025 RF-040, RF-041, RF-042, RF-047, RF-061, RF-066, RF-118; HU-019, HU-020, HU-022, HU-028, HU-031; RN-007, RN-009, RN-012. Evolución e historial conservados. |

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
| **Flujo Alternativo** | **FA-01 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento seleccionado si deja de ser compatible.**FA-02 — Sin filtros inferiores** — El sistema muestra todos los casos de la Región.**FA-03 — Exportación** — El sistema genera un Excel restringido a la Región y respetando todos los filtros.**FA-04 — Sin resultados** — El sistema muestra una lista vacía sin ampliar el ámbito. |
| **Poscondiciones** | 1. El usuario obtiene un corte de casos limitado a su Región. 2. No se modifica información operativa. |
| **Trazabilidad** | RF-002, RF-014, RF-015, RF-052, RF-054, RF-119, RF-122, RF-124; HU relacionadas: HU-032 |

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
| **Flujo Alternativo** | **FA-01 — Información sensible restringida** — El sistema oculta o limita los elementos que requieran permisos adicionales.**FA-02 — Acción de edición** — Las funciones de modificación de estado, prioridad, valoración, plan, documentos, coordinaciones, traslado, reportes o cierre no se encuentran disponibles.**FA-03 — Caso fuera de Región** — El sistema deniega el acceso. |
| **Poscondiciones** | 1. No se modifica el caso. 2. El usuario Regional mantiene acceso de solo lectura dentro de su Región. |
| **Trazabilidad** | RF-002, RF-019, RF-056, RF-057, RF-103; HU relacionadas: HU-033 |

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
| **Flujo Alternativo** | **FA-01 — Cambio de Región** — El sistema actualiza o limpia Oficina Local y establecimiento incompatibles.**FA-02 — Cambio de Oficina Local** — El sistema actualiza o limpia el establecimiento incompatible.**FA-03 — Sin filtros territoriales** — El sistema muestra todos los casos nacionales permitidos.**FA-04 — Exportación** — El sistema genera un Excel correspondiente al mismo corte visible.**FA-05 — Sin resultados** — El sistema muestra una lista vacía y conserva los filtros. |
| **Poscondiciones** | 1. El usuario obtiene el conjunto nacional o territorial solicitado. 2. No se modifica información operativa. |
| **Trazabilidad** | RF-002, RF-014, RF-015, RF-053, RF-054, RF-119, RF-122, RF-124; HU relacionadas: HU-034 |

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
| **Flujo Alternativo** | **FA-01 — Información sensible restringida** — El sistema oculta o limita los elementos sujetos a permisos adicionales.**FA-02 — Acción operativa** — El sistema no ofrece funciones para modificar valoración, estado, prioridad, plan, documentos, coordinaciones, traslados, reportes o cierre.**FA-03 — Acceso no permitido** — El sistema deniega el acceso cuando el usuario no cumple una regla adicional de seguridad. |
| **Poscondiciones** | 1. No se modifica el caso. 2. El acceso queda limitado a la información autorizada en modo lectura. |
| **Trazabilidad** | RF-002, RF-019, RF-056, RF-057, RF-103; HU relacionadas: HU-035 |

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
| **Flujo Alternativo** | **FA-01 — Sin archivo** — El sistema impide confirmar la carga hasta que se seleccione un archivo.**FA-02 — Archivo no válido** — El sistema rechaza el archivo e informa la causa conforme a las reglas técnicas establecidas.**FA-03 — Permiso insuficiente** — El sistema no permite la carga ni la consulta de elementos restringidos. |
| **Poscondiciones** | 1. El documento queda vinculado con el caso y disponible conforme a los permisos institucionales. 2. La acción queda trazable. |
| **Trazabilidad** | RF-002, RF-058, RF-103; HU relacionadas: HU-026 |

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
| **Flujo Alternativo** | **FA-01 — Responsable distinto del digitador** — El usuario selecciona al profesional que efectuó la coordinación y el sistema conserva la trazabilidad correspondiente.**FA-02 — Institución no catalogada** — El usuario utiliza la opción «Otra» y registra la identificación necesaria.**FA-03 — Datos obligatorios incompletos** — El sistema solicita completar la información requerida antes de guardar. |
| **Poscondiciones** | 1. La coordinación queda vinculada al caso. 2. Su estado y datos principales quedan disponibles para seguimiento posterior. |
| **Trazabilidad** | RF-002, RF-059, RF-060, RF-097, RF-103; HU relacionadas: HU-027 |

*Figura 19: Diagrama de procesos de Caso de Uso CU-19*

### CU-20 — Trasladar un caso a otra Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-20 — Trasladar un caso a otra Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite cerrar con motivo estructurado Traslado el caso A.I. activo de una persona que cambia de establecimiento, conservando historial, fecha y responsable. No genera caso, ingreso pendiente ni confirmación de continuidad en destino. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local de origen, según autorización - Personal autorizado del nuevo establecimiento u Oficina Local: únicamente para una eventual referencia nueva por CU-04/CU-05, sin recepción de ingreso pendiente. |
| **Precondiciones** | 1. El caso se encuentra bajo responsabilidad de la Oficina Local de origen. 2. El usuario tiene permiso para ejecutar el traslado. 3. El caso no se encuentra cerrado por otra causa. |
| **Flujo Normal** | 1. **Usuario origen:** Abre el caso y accede a Traslado. 2. Usuario origen: Documenta el cambio de establecimiento con los datos institucionales de destino disponibles. 3. Usuario origen: Registra fecha, responsable y motivo estructurado Traslado. 4. **Sistema:** Valida que los datos de destino sean coherentes. 5. **Usuario origen:** Confirma la acción Cerrar por traslado. 6. **Sistema:** Cierra el caso de origen con el motivo específico de traslado. 7. **Sistema:** Conserva intacto el historial generado por la Oficina Local de origen. 8. Sistema: No genera automáticamente otro caso ni ingreso pendiente; no existe estado Pendiente de continuidad, confirmación en destino ni vinculación obligatoria entre casos. 9. **Sistema:** Agrega el evento de traslado a la línea de tiempo. |
| **Flujo Alternativo** | FA-01 — Nueva referencia en destino — Cuando CAH/SIDINACC asocie a la persona al nuevo establecimiento, el personal autorizado puede registrar una referencia completamente nueva con consecutivo propio y abrir un caso por el procedimiento normal si requiere A.I., respetando unicidad global de caso activo. No se exige vínculo con el caso anterior.**FA-02 — Caso ya cerrado** — El sistema deshabilita el cierre por traslado.**FA-03 — Cancelación** — El usuario abandona el flujo y el caso permanece sin cambios. |
| **Poscondiciones** | 1. El caso de origen queda cerrado por traslado. 2. No existe ingreso pendiente ni continuidad automática en destino. Una eventual referencia nueva y apertura siguen CU-04/CU-05/CU-09/CU-10. 3. El historial de origen se conserva y el traslado queda trazable. |
| **Trazabilidad** | RF-002, RF-061, RF-066, RF-097, RF-115; HU relacionadas: HU-028, HU-031; RN-012, RN-013, RN-014. RF-062 retirado; no es dependencia funcional vigente. |

*Figura 20: Diagrama de procesos de Caso de Uso CU-20*

### CU-21 — Confirmar continuidad de un caso recibido por traslado — RETIRADO

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-21 — Confirmar continuidad de un caso recibido por traslado — RETIRADO; identificador reservado |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | **RETIRADO — contenido histórico no vigente.** Permite a la Oficina Local de destino confirmar que un cliente/beneficiaria trasladado continuará su Atención Interdisciplinaria en el nuevo ámbito y crear el caso activo correspondiente. Retirado por validación con Alina del 2 de noviembre de 2026. Identificador reservado; no reutilizar. No existe ingreso pendiente ni confirmación de continuidad; aplican CU-20/CU-23 y una eventual nueva referencia por CU-04/CU-05. El diagrama se conserva sin modificaciones. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local de destino |
| **Precondiciones** | 1. **RETIRADO — contenido histórico no vigente.** Existe un traslado dirigido a la Oficina Local del usuario con estado Pendiente de continuidad. 2. **RETIRADO — contenido histórico no vigente.** El caso de origen permanece cerrado por traslado. |
| **Flujo Normal** | 1. **RETIRADO — contenido histórico no vigente.** **Usuario destino:** Consulta los ingresos por traslado pendientes de continuidad. 2. **RETIRADO — contenido histórico no vigente.** **Sistema:** Muestra cliente/beneficiaria, Oficina Local origen, destino, establecimiento destino y estado. 3. **RETIRADO — contenido histórico no vigente.** **Usuario destino:** Selecciona el ingreso correspondiente. 4. **RETIRADO — contenido histórico no vigente.** **Usuario destino:** Verifica que la persona continuará siendo atendida en el nuevo ámbito. 5. **RETIRADO — contenido histórico no vigente.** **Usuario destino:** Confirma la continuidad. 6. **RETIRADO — contenido histórico no vigente.** **Sistema:** Actualiza el traslado como continuidad confirmada. 7. **RETIRADO — contenido histórico no vigente.** **Sistema:** Crea un nuevo caso A.I. activo bajo la Oficina Local y establecimiento destino. 8. **RETIRADO — contenido histórico no vigente.** **Sistema:** Conserva la relación con el caso de origen y registra el evento de continuidad en la línea de tiempo. |
| **Flujo Alternativo** | **RETIRADO — contenido histórico no vigente.** **FA-01 — Continuidad aún no confirmada** — El ingreso permanece Pendiente de continuidad y no se crea un caso activo en destino.**RETIRADO — contenido histórico no vigente.** **FA-02 — Traslado no pertenece a la OL** — El sistema no permite que el usuario confirme un traslado dirigido a otra Oficina Local. |
| **Poscondiciones** | 1. **RETIRADO — contenido histórico no vigente.** Existe un nuevo caso activo en el ámbito destino. 2. **RETIRADO — contenido histórico no vigente.** El caso de origen permanece cerrado y no se modifica retroactivamente. 3. **RETIRADO — contenido histórico no vigente.** La relación entre ambos casos queda trazable. |
| **Trazabilidad** | RETIRADO. RF-062, RF-063 y HU-029 retirados; relaciones históricas únicamente, sin ejecución vigente. Identificadores reservados y diagrama conservado. Sustituyen los comportamientos vigentes de CU-20/CU-23 y eventual nueva referencia por CU-04/CU-05/CU-10. |

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
| **Flujo Alternativo** | **FA-01 — Caso activo** — El reporte se genera sin cerrar el caso.**FA-02 — Información insuficiente** — El sistema solicita completar la información requerida antes de confirmar.**FA-03 — Cancelación** — El usuario abandona el flujo y no se registra un nuevo reporte. |
| **Poscondiciones** | 1. El reporte queda asociado al caso y trazable. 2. El caso mantiene su estado previo salvo que se ejecute posteriormente un cierre independiente. |
| **Trazabilidad** | RF-002, RF-064, RF-065, RF-097, RF-123; HU relacionadas: HU-030 |

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
| **Flujo Normal** | 1. **Usuario:** Abre el caso y accede a Cierre. 2. **Sistema:** Muestra el estado actual del caso. 3. **Usuario:** Registra la fecha de cierre. 4. Usuario: Selecciona Cierre satisfactorio (objetivos de Atención Interdisciplinaria alcanzados), Traslado u Otro; si elige Otro registra explicación textual obligatoria. 5. **Usuario:** Confirma el cierre. 6. **Sistema:** Cambia el estado del caso a Cerrado. 7. Sistema: Conserva fecha, responsable, motivo estructurado y explicación de Otro cuando corresponda, con el evento de cierre en el historial. 8. **Sistema:** Agrega el evento de cierre a la línea de tiempo. |
| **Flujo Alternativo** | **FA-01 — Caso ya cerrado** — El sistema no permite ejecutar un segundo cierre.**FA-02 — Datos obligatorios incompletos** — El sistema impide confirmar hasta registrar la información requerida.**FA-03 — Reporte** — La existencia o generación de un reporte no sustituye el cierre ni modifica automáticamente el estado del caso.**FA-04 — Traslado** — Si la finalización corresponde a un traslado, se utiliza el flujo específico de Cerrar por traslado. Otro sin explicación: se impide confirmar hasta completarla. Traslado: se cierra el caso de origen sin generar caso ni ingreso pendiente o continuidad en destino y no se clasifica automáticamente como Cierre satisfactorio. |
| **Poscondiciones** | 1. El caso queda en estado Cerrado con fecha y motivo trazables. 2. La línea de tiempo conserva el evento de cierre. Los motivos conservan su interpretación mediante catálogo configurable/versionable cuando corresponda y son utilizables para reportería posterior. El texto de Otro queda disponible para eventual análisis de palabras frecuentes; la reportería de estos motivos se rige por 15.3 / RF-128. |
| **Trazabilidad** | RF-002, RF-065, RF-066, RF-097; HU relacionadas: HU-031 RF-061, RF-099, RF-100; HU-028; RN-003, RN-011, RN-012. Motivos estructurados y Otro explicado; reportería de motivos según 15.3 / RF-128. |

*Figura 23: Diagrama de procesos de Caso de Uso CU-23*

### CU-36 — Identificar casos activos sin atención en un período

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-36 — Identificar casos activos sin atención en un período |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 29 de octubre de 2026 |
| **Descripción** | Permite identificar casos activos de Oficina Local sin atenciones registradas en un período o año y consultar su última atención para organizar seguimiento, independientemente de programación. |
| **Actores** | - Principal: Equipo Interdisciplinario de Oficina Local. - Secundario: Sistema. |
| **Precondiciones** | 1. El usuario está autenticado y autorizado para consultar casos de su Oficina Local. 2. Existen casos activos y el sistema dispone de los registros de atención autorizados. |
| **Flujo Normal** | 1. Usuario: Accede a la consulta de casos sin atención. 2. Usuario: Selecciona un período o año y, cuando corresponda, un establecimiento de su ámbito. 3. Sistema: Restringe la consulta a casos activos de la Oficina Local. 4. Sistema: Identifica los casos sin atenciones registradas en el período, independientemente de actividades programadas. 5. Sistema: Muestra identificación, nombre, establecimiento y fecha de última atención o Sin atención registrada. 6. Usuario: Selecciona un resultado. 7. Sistema: Permite localizar y consultar el caso bajo los permisos vigentes. |
| **Flujo Alternativo** | FA-01 — Sin programación — El caso se incluye si no tiene atención en el período aunque nunca haya sido programado.FA-02 — Nunca atendido — Se muestra Sin atención registrada; si hubo atención anterior al período, se muestra su fecha y se mantiene Sin atención en el período.FA-03 — Grupal — Solo se considera atención para el participante con asistencia registrada.FA-04 — Sin resultados — Se informa sin ampliar el ámbito.FA-05 — Período inválido o acceso no autorizado — Se requiere corregir el corte o se deniega acceso. |
| **Poscondiciones** | - El equipo obtiene casos activos sin atención y su última fecha disponible sin modificar registros. - El corte respeta Oficina Local, período y permisos. |
| **Reglas de negocio** | La programación no acredita atención. Se utilizan atenciones efectivas y asistencia grupal conforme a RN-025 y RN-035. |
| **Trazabilidad** | HU-048; HU-025; RF-125; RF-126; RF-055. El análisis permitido en reportería se relaciona con HU-038/HU-040/HU-042 y CU-29 a CU-31. |

---

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
| **Flujo Normal** | 1. **Usuario:** Abre Atenciones y selecciona Atención individual. 2. **Usuario:** Busca el caso activo por identificación o nombre. 3. **Sistema:** Muestra únicamente casos activos de la Oficina Local. 4. **Usuario:** Selecciona el caso correcto. 5. **Usuario:** Registra la fecha real de atención. 6. **Usuario:** Selecciona disciplina y tipo o estrategia de atención. 7. **Usuario:** Registra acciones realizadas y recomendaciones. 8. **Usuario:** Registra una próxima acción y su fecha cuando corresponda. 9. **Usuario:** Confirma el registro. 10. **Sistema:** Guarda la atención con el profesional responsable y la fecha de digitación. 11. **Sistema:** Agrega automáticamente el evento a la línea de tiempo del caso. 12. **Sistema:** Utiliza disciplinas vigentes sin Otra genérica y considera la fecha real registrada para la última atención y el seguimiento de casos sin atención, independientemente de actividades programadas. |
| **Flujo Alternativo** | **FA-01 — Caso no activo** — El sistema no ofrece el caso como candidato para registrar una nueva atención individual.**FA-02 — Sin coincidencias** — El sistema informa que no existen casos activos que coincidan con la búsqueda.**FA-03 — Datos requeridos incompletos** — El sistema solicita completar la información obligatoria antes de guardar.**FA-04 — Interrupción** — Si existe un borrador autoguardado, el usuario puede recuperarlo según las reglas establecidas. |
| **Poscondiciones** | 1. La atención queda registrada y vinculada al caso. 2. La línea de tiempo refleja el nuevo evento con fecha real, disciplina, responsable y detalle correspondiente. |
| **Trazabilidad** | RF-010, RF-057, RF-067, RF-068, RF-069, RF-097, RF-098, RF-120, RF-126; HU relacionadas: HU-036 |

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
| **Flujo Normal** | 1. **Usuario:** Abre Atenciones y selecciona Atención grupal. 2. **Usuario:** Registra fecha, tipo de actividad, tema u objetivo y lugar. 3. **Usuario:** Selecciona una o varias disciplinas y el profesional o profesionales responsables. 4. **Usuario:** Busca participantes por identificación o nombre. 5. **Sistema:** Muestra personas del ámbito que aún no han sido agregadas. 6. **Usuario:** Agrega uno o varios participantes. 7. **Usuario:** Registra la asistencia individual de cada participante. 8. **Usuario:** Registra acciones o contenidos comunes y recomendaciones generales. 9. **Usuario:** Confirma el registro. 10. **Sistema:** Guarda un único registro base de la atención grupal. 11. **Sistema:** Para cada participante con caso A.I. activo, agrega un evento asociado en la línea de tiempo correspondiente. |
| **Flujo Alternativo** | **FA-01 — Participante duplicado** — El sistema impide agregar a la misma persona más de una vez.**FA-02 — Retirar participante** — Antes de guardar, el usuario elimina a un participante de la actividad.**FA-03 — Participante sin caso activo** — El sistema conserva su participación en la actividad grupal, pero no crea un evento en una línea de tiempo A.I. inexistente.**FA-04 — Sin tema u objetivo** — El sistema impide guardar la actividad.**FA-05 — Sin participantes** — El sistema impide guardar hasta que exista al menos un participante.**FA-06 — Interrupción** — Si existe un borrador válido, el usuario puede recuperarlo antes de confirmar.**FA-07 — Alcance de actividad** — La atención grupal se vincula al niño/cliente beneficiario; las sesiones educativas generales no se registran automáticamente como A.I. y la clasificación definitiva se mantiene en decisiones pendientes. Se utilizan disciplinas vigentes sin Otra genérica. |
| **Poscondiciones** | 1. Existe un único registro de la atención grupal. 2. La asistencia queda registrada por participante. 3. Los casos A.I. activos de los participantes reflejan la actividad en su historial sin duplicar el registro base. Para analítica y seguimiento se considera participación efectiva según asistencia: una grupal representa un registro base y sus asistentes se contabilizan como personas atendidas sin multiplicar el registro de atención. |
| **Trazabilidad** | RF-010, RF-057, RF-070, RF-071, RF-072, RF-073, RF-074, RF-097, RF-098, RF-120, RF-126; HU relacionadas: HU-037 |

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
| **Flujo Normal** | 1. Usuario: Abre Programación de su Oficina Local e inicia una actividad. 2. Usuario: Registra fecha, tipo vigente, título/propósito, establecimiento cuando corresponda y observaciones. 3. Sistema: Ofrece Sesión interdisciplinaria para análisis, priorización, valoración y decisiones, y Visita a establecimiento para Atención Interdisciplinaria; conserva otros tipos vigentes no cuestionados. 4. Usuario: Asocia explícitamente clientes/beneficiarias o casos cuando la actividad se dirige a personas específicas. 5. Sistema: Sin personas asociadas, interpreta actividad general del establecimiento/equipo, sin programar a todos sus niños. 6. Usuario: Confirma creación. 7. Sistema: Guarda estado Programada. 8. Usuario: Localiza posteriormente la actividad, selecciona Realizada, Reprogramada o Cancelada, completa los datos requeridos y confirma. 9. Sistema: Conserva el cambio de estado y su trazabilidad, manteniendo el registro. |
| **Flujo Alternativo** | FA-01 — Realizada — Se registra el estado, sin inferir atención individual para personas no asociadas ni sustituir el registro de atención.FA-02 — Reprogramada — Se exige y conserva nueva fecha y motivo.FA-03 — Cancelada — Se exige y conserva motivo y registro, sin borrarlo como gestión normal; permite analizar circunstancias operativas de cancelación.FA-04 — Actividad general — Sin personas especificadas no se presume que todos los casos del establecimiento estén programados.FA-05 — Datos requeridos incompletos — Se solicita completarlos antes de confirmar.FA-06 — Vencida — Si permanece Programada después de la fecha, se alerta y destaca en rojo con texto para resolver como Realizada, Reprogramada o Cancelada.FA-07 — Filtros — Se filtra por establecimiento y estado y se actualiza el conteo. |
| **Poscondiciones** | - La actividad conserva un estado válido y la asociación explícita a personas cuando corresponda. - Las cancelaciones mantienen registro y motivo; las reprogramaciones conservan motivo y nueva fecha. - La programación general no equivale a atención ni a programación individual de todos los casos del establecimiento. |
| **Trazabilidad** | RF-002, RF-015, RF-075, RF-076, RF-077, RF-078, RF-079, RF-080; HU relacionadas: HU-044 |

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
| **Flujo Alternativo** | **FA-01 — Sin filtros inferiores** — El sistema muestra toda la programación de la Región.**FA-02 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible.**FA-03 — Intento de edición** — Las acciones para crear, modificar, reprogramar, cancelar o marcar una actividad como realizada no están disponibles. |
| **Poscondiciones** | 1. La programación permanece sin cambios. 2. El usuario obtiene una vista de consulta restringida a su Región. |
| **Trazabilidad** | RF-002, RF-014, RF-015, RF-081; HU relacionadas: HU-045 |

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
| **Flujo Alternativo** | **FA-01 — Sin filtros territoriales** — El sistema muestra toda la programación nacional disponible.**FA-02 — Cambio de Región** — El sistema limpia o actualiza Oficina Local y establecimiento incompatibles.**FA-03 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible.**FA-04 — Intento de edición** — Las acciones para crear o modificar programación no están disponibles. |
| **Poscondiciones** | 1. La programación permanece sin cambios. 2. El usuario obtiene el corte nacional o territorial solicitado. |
| **Trazabilidad** | RF-002, RF-014, RF-015, RF-082; HU relacionadas: HU-046 |

*Figura 28: Diagrama de procesos de Caso de Uso CU-28*

## 10.7 Reportería, analítica y consolidaciones

### CU-29 — Consultar reportería analítica de Oficina Local

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-29 — Consultar reportería analítica de Oficina Local |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Oficina Local analizar la actividad de Atención Interdisciplinaria de su ámbito mediante filtros e indicadores que diferencian casos, referencias a Atención Interdisciplinaria, personas únicas atendidas y total de atenciones. La exploración interactiva usa exactamente el catálogo principal de doce visualizaciones de 15.3 / RF-128, con las mismas definiciones entre ámbitos; generar un informe formal es la actividad independiente de HU-050 / CU-38. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local |
| **Precondiciones** | 1. El usuario se encuentra autenticado. 2. Existe información analítica disponible dentro de la Oficina Local. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Restringe la información a la Oficina Local. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por establecimiento, estado, prioridad, disciplina y/o profesional. También utiliza sexo, edad y tipo de atención cuando sean pertinentes, conforme a 15.1 / RF-086/RF-091, sin aplicar filtros incompatibles. 5. **Sistema:** Aplica cada filtro únicamente a los indicadores funcionalmente relacionados. 6. **Sistema:** Muestra cantidad de casos y referencias a Atención Interdisciplinaria. 7. **Sistema:** Muestra personas únicas atendidas y total de atenciones como métricas distintas. 8. Sistema: Actualiza reactivamente las doce visualizaciones autorizadas de RF-128 y las consultas complementarias válidas, con títulos dinámicos, filtros activos destacados/enumerados y opción de restablecer. Indica qué filtros afectan cada visualización y conserva títulos y filtros al incluirla en un informe. 9. **Usuario:** Modifica los filtros para analizar otros cortes de su ámbito. 10. **Sistema:** Analiza referencias a Atención Interdisciplinaria enviadas, analizadas, admitidas y No requiere A.I. según el evento y fecha aplicados al período; casos activos por establecimiento, estado, prioridad, sexo y edad flexible; personas únicas y total de atenciones por tipo vigente y disciplina; principales motivos de referencia y cancelación; y casos activos sin atención en el período, conforme a RF-087 a RF-091 y RF-125/RF-126. Sistema: Calcula los KPI 11/12 según RF-129/RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año seleccionado y en su caso actual; porcentaje N/D × 100 y cantidad N. Usa fecha real/asistencia efectiva, excluye programación, asistencia no confirmada y atenciones solo de casos anteriores cerrados. Identifica universo/corte y definición operativa provisional pendiente de ratificación con Alina. Usuario: Puede iniciar independientemente Generar reporte con el botón visible superior para continuar por CU-38. |
| **Flujo Alternativo** | **FA-01 — Sin establecimiento** — El ámbito analítico corresponde a toda la Oficina Local.**FA-02 — Establecimiento seleccionado** — Las métricas territoriales se restringen al establecimiento seleccionado.**FA-03 — Filtro por disciplina/profesional** — El sistema identifica claramente qué métricas de atención son afectadas para evitar interpretar que todos los indicadores responden al mismo filtro.**FA-04 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías sin ampliar el ámbito.Reglas analíticas: Una referencia analizada puede concluir Admitida a A.I. o No requiere A.I. Los motivos son múltiples y no excluyentes: su frecuencia puede superar el total de referencias y no se interpreta como partición del total. Una atención grupal conserva un registro base y cuenta personas efectivamente asistentes. No se generan indicadores propios de vigilancia, nutrición, EDIN II o EVADE. Se aplican filtros de edad o rangos analíticos configurables sin clasificación etaria única. La ausencia de atención no depende de la programación. Filtro general de estado: Activo/Cerrado/Todos solo altera visualizaciones compatibles, sin cambiar cobertura basada siempre en activos actuales. Denominador cero: muestra Sin casos activos o No aplica, sin división por cero. Datos en carga o error: muestra el estado, no mezcla cortes ni presenta datos desactualizados como vigentes. Visualización no autorizada o no disponible: no se ofrece como seleccionable en CU-38 y no se amplían permisos. |
| **Poscondiciones** | 1. El usuario visualiza indicadores correspondientes al corte solicitado. 2. No se modifica información operativa. Las visualizaciones respetan su ámbito, corte, evento temporal y filtros pertinentes; títulos y filtros activos son claros. El KPI de cobertura mantiene su universo actual y el de cantidad muestra el mismo numerador de personas únicas. |
| **Trazabilidad** | RF-002, RF-083, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126; HU relacionadas: HU-038 RF-086, RF-128, RF-129, RF-130, RF-131; RN-040, RN-041; HU-050; CU-38. Las capacidades complementarias no incrementan el catálogo principal de doce. |

*Figura 29: Diagrama de procesos de Caso de Uso CU-29*

### CU-30 — Consultar reportería analítica Regional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-30 — Consultar reportería analítica Regional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Regional analizar la Atención Interdisciplinaria de su Región y desagregarla por Oficina Local y establecimiento mediante filtros e indicadores consistentes. La exploración interactiva usa exactamente el catálogo principal de doce visualizaciones de 15.3 / RF-128, con las mismas definiciones entre ámbitos; generar un informe formal es la actividad independiente de HU-050 / CU-38. |
| **Actores** | - ATE / Dirección Regional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con una Región asignada. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Restringe automáticamente la información a la Región asignada. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por Oficina Local, establecimiento, estado, prioridad, disciplina y/o profesional. También utiliza sexo, edad y tipo de atención cuando sean pertinentes, conforme a 15.1 / RF-086/RF-091, sin aplicar filtros incompatibles. 5. **Sistema:** Mantiene la dependencia de los filtros territoriales. 6. **Sistema:** Actualiza casos, referencias a Atención Interdisciplinaria, personas únicas atendidas y total de atenciones según las reglas de cada indicador. 7. Sistema: Actualiza reactivamente las doce visualizaciones autorizadas de RF-128 y las consultas complementarias válidas, con títulos dinámicos, filtros activos destacados/enumerados y opción de restablecer. Indica qué filtros afectan cada visualización y conserva títulos y filtros al incluirla en un informe. 8. **Usuario:** Compara diferentes cortes dentro de su Región. 9. **Sistema:** Analiza referencias a Atención Interdisciplinaria enviadas, analizadas, admitidas y No requiere A.I. según el evento y fecha aplicados al período; casos activos por establecimiento, estado, prioridad, sexo y edad flexible; personas únicas y total de atenciones por tipo vigente y disciplina; principales motivos de referencia y cancelación; y casos activos sin atención en el período, conforme a RF-087 a RF-091 y RF-125/RF-126. Sistema: Calcula los KPI 11/12 según RF-129/RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año seleccionado y en su caso actual; porcentaje N/D × 100 y cantidad N. Usa fecha real/asistencia efectiva, excluye programación, asistencia no confirmada y atenciones solo de casos anteriores cerrados. Identifica universo/corte y definición operativa provisional pendiente de ratificación con Alina. Usuario: Puede iniciar independientemente Generar reporte con el botón visible superior para continuar por CU-38. |
| **Flujo Alternativo** | **FA-01 — Región completa** — Sin filtros inferiores, los indicadores representan toda la Región.**FA-02 — Oficina Local** — Los indicadores territoriales se restringen a la OL seleccionada.**FA-03 — Establecimiento** — Los indicadores territoriales se restringen al establecimiento seleccionado.**FA-04 — Cambio de Oficina Local** — El sistema limpia o actualiza el establecimiento incompatible.**FA-05 — Disciplina/profesional** — El sistema deja claro qué métricas son afectadas por esos filtros.**FA-06 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías.Reglas analíticas: Una referencia analizada puede concluir Admitida a A.I. o No requiere A.I. Los motivos son múltiples y no excluyentes: su frecuencia puede superar el total de referencias y no se interpreta como partición del total. Una atención grupal conserva un registro base y cuenta personas efectivamente asistentes. No se generan indicadores propios de vigilancia, nutrición, EDIN II o EVADE. Se aplican filtros de edad o rangos analíticos configurables sin clasificación etaria única. La ausencia de atención no depende de la programación. Filtro general de estado: Activo/Cerrado/Todos solo altera visualizaciones compatibles, sin cambiar cobertura basada siempre en activos actuales. Denominador cero: muestra Sin casos activos o No aplica, sin división por cero. Datos en carga o error: muestra el estado, no mezcla cortes ni presenta datos desactualizados como vigentes. Visualización no autorizada o no disponible: no se ofrece como seleccionable en CU-38 y no se amplían permisos. |
| **Poscondiciones** | 1. El usuario obtiene un análisis limitado a su Región y al corte seleccionado. 2. No se modifica información operativa. Las visualizaciones respetan su ámbito, corte, evento temporal y filtros pertinentes; títulos y filtros activos son claros. El KPI de cobertura mantiene su universo actual y el de cantidad muestra el mismo numerador de personas únicas. |
| **Trazabilidad** | RF-002, RF-014, RF-084, RF-086, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126; HU relacionadas: HU-040 RF-086, RF-128, RF-129, RF-130, RF-131; RN-040, RN-041; HU-050; CU-38. Las capacidades complementarias no incrementan el catálogo principal de doce. |

*Figura 30: Diagrama de procesos de Caso de Uso CU-30*

### CU-31 — Consultar reportería analítica Nacional

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-31 — Consultar reportería analítica Nacional |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite al usuario Nacional analizar la Atención Interdisciplinaria del país y desagregarla jerárquicamente por Región, Oficina Local y establecimiento, combinando filtros temporales y funcionales. La exploración interactiva usa exactamente el catálogo principal de doce visualizaciones de 15.3 / RF-128, con las mismas definiciones entre ámbitos; generar un informe formal es la actividad independiente de HU-050 / CU-38. |
| **Actores** | - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario se encuentra autenticado con acceso Nacional. |
| **Flujo Normal** | 1. **Usuario:** Abre Reportería. 2. **Sistema:** Carga el ámbito nacional como nivel máximo de consulta. 3. **Usuario:** Selecciona el año o período. 4. **Usuario:** Opcionalmente filtra por Región, Oficina Local, establecimiento, estado, prioridad, disciplina y/o profesional. También utiliza sexo, edad y tipo de atención cuando sean pertinentes, conforme a 15.1 / RF-086/RF-091, sin aplicar filtros incompatibles. 5. **Sistema:** Mantiene la dependencia jerárquica de los filtros territoriales. 6. **Sistema:** Actualiza casos, referencias a Atención Interdisciplinaria, personas únicas atendidas y total de atenciones conforme a las reglas de cada indicador. 7. Sistema: Actualiza reactivamente las doce visualizaciones autorizadas de RF-128 y las consultas complementarias válidas, con títulos dinámicos, filtros activos destacados/enumerados y opción de restablecer. Indica qué filtros afectan cada visualización y conserva títulos y filtros al incluirla en un informe. 8. **Usuario:** Compara diferentes cortes nacionales o territoriales. 9. **Sistema:** Analiza referencias a Atención Interdisciplinaria enviadas, analizadas, admitidas y No requiere A.I. según el evento y fecha aplicados al período; casos activos por establecimiento, estado, prioridad, sexo y edad flexible; personas únicas y total de atenciones por tipo vigente y disciplina; principales motivos de referencia y cancelación; y casos activos sin atención en el período, conforme a RF-087 a RF-091 y RF-125/RF-126. Sistema: Calcula los KPI 11/12 según RF-129/RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año seleccionado y en su caso actual; porcentaje N/D × 100 y cantidad N. Usa fecha real/asistencia efectiva, excluye programación, asistencia no confirmada y atenciones solo de casos anteriores cerrados. Identifica universo/corte y definición operativa provisional pendiente de ratificación con Alina. Usuario: Puede iniciar independientemente Generar reporte con el botón visible superior para continuar por CU-38. |
| **Flujo Alternativo** | **FA-01 — País completo** — Sin filtros territoriales, los indicadores representan Costa Rica.**FA-02 — Región** — El corte se restringe a la Región seleccionada.**FA-03 — Oficina Local** — El corte se restringe a la OL seleccionada.**FA-04 — Establecimiento** — El corte se restringe al establecimiento seleccionado.**FA-05 — Cambio de Región u OL** — El sistema limpia o actualiza automáticamente los filtros inferiores incompatibles.**FA-06 — Disciplina/profesional** — El sistema identifica las métricas afectadas por esos filtros.**FA-07 — Sin datos** — El sistema muestra valores cero o visualizaciones vacías.Reglas analíticas: Una referencia analizada puede concluir Admitida a A.I. o No requiere A.I. Los motivos son múltiples y no excluyentes: su frecuencia puede superar el total de referencias y no se interpreta como partición del total. Una atención grupal conserva un registro base y cuenta personas efectivamente asistentes. No se generan indicadores propios de vigilancia, nutrición, EDIN II o EVADE. Se aplican filtros de edad o rangos analíticos configurables sin clasificación etaria única. La ausencia de atención no depende de la programación. Filtro general de estado: Activo/Cerrado/Todos solo altera visualizaciones compatibles, sin cambiar cobertura basada siempre en activos actuales. Denominador cero: muestra Sin casos activos o No aplica, sin división por cero. Datos en carga o error: muestra el estado, no mezcla cortes ni presenta datos desactualizados como vigentes. Visualización no autorizada o no disponible: no se ofrece como seleccionable en CU-38 y no se amplían permisos. |
| **Poscondiciones** | 1. El usuario obtiene el análisis nacional o territorial solicitado. 2. No se modifica información operativa. Las visualizaciones respetan su ámbito, corte, evento temporal y filtros pertinentes; títulos y filtros activos son claros. El KPI de cobertura mantiene su universo actual y el de cantidad muestra el mismo numerador de personas únicas. |
| **Trazabilidad** | RF-002, RF-014, RF-085, RF-086, RF-087, RF-088, RF-089, RF-090, RF-091, RF-119, RF-125, RF-126; HU relacionadas: HU-042 RF-086, RF-128, RF-129, RF-130, RF-131; RN-040, RN-041; HU-050; CU-38. Las capacidades complementarias no incrementan el catálogo principal de doce. |

*Figura 31: Diagrama de procesos de Caso de Uso CU-31*

### CU-32 — Generar y descargar una consolidación dinámica

| Campo | Especificación |
| --- | --- |
| **Nombre** | CU-32 — Generar y descargar una consolidación dinámica |
| **Autor** | Sarah Quesada Chaves |
| **Fecha** | 24 de septiembre de 2026 |
| **Descripción** | Permite a Oficina Local, Nivel Regional y Nivel Nacional generar una consolidación del ámbito seleccionado utilizando los filtros vigentes y descargarla sin requerir procesos manuales de remisión entre niveles. La consolidación tabular conserva su flujo vigente; el botón Generar reporte inicia un informe analítico formal independiente de CU-38, con análisis obligatorio por visualización, sin confundirlo con CU-22. |
| **Actores** | - Profesional EE.II. / Jefatura — Oficina Local - ATE / Dirección Regional - UIVCD / UNAT — Nivel Nacional |
| **Precondiciones** | 1. El usuario tiene acceso a Reportería. 2. Existe un corte analítico definido mediante período y, opcionalmente, filtros adicionales. |
| **Flujo Normal** | 1. **Usuario:** Configura el período y los filtros de reportería. 2. **Sistema:** Determina el ámbito máximo permitido por el rol. 3. **Sistema:** Identifica el ámbito efectivo del consolidado según los filtros territoriales. 4. **Sistema:** Calcula las métricas definidas para el corte, incluyendo casos, referencias a Atención Interdisciplinaria, personas únicas atendidas, total de atenciones y distribución por prioridad cuando corresponda. 5. **Sistema:** Muestra el consolidado dinámico e identifica al menos período y ámbito. 6. **Usuario:** Solicita la descarga. 7. **Sistema:** Genera un archivo compatible con Excel respetando el mismo corte visible. 8. **Sistema:** Conserva en el consolidado las definiciones y métricas aplicables de RF-087 a RF-091 y RF-125: referencias a A.I. por envío, análisis y resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, frecuencia no excluyente de motivos, motivos de cancelación y casos sin atención; identifica el corte de cada indicador sin duplicar indicadores de vigilancia. Sistema: Mantiene las definiciones RF-128/RF-129, los títulos dinámicos, filtros pertinentes, universo y corte en el consolidado. Usuario: Si necesita un informe interpretativo, inicia Generar reporte y continúa por CU-38, sin imponer a ese informe el formato Excel del consolidado. |
| **Flujo Alternativo** | **FA-01 — Oficina Local** — Sin establecimiento seleccionado, el consolidado representa toda la OL; con establecimiento, representa ese establecimiento.**FA-02 — Regional** — Puede consolidar la Región completa, una Oficina Local o un establecimiento de su Región.**FA-03 — Nacional** — Puede consolidar el país completo, una Región, una Oficina Local o un establecimiento.**FA-04 — Cambio de filtros** — El sistema recalcula el consolidado antes de descargarlo.**FA-05 — Sin datos** — El sistema genera un consolidado vacío o con valores cero, identificando igualmente el corte.**FA-06 — Remisión entre niveles** — Regional y Nacional obtienen el consolidado directamente de la información autorizada; no se requiere que un nivel inferior lo envíe o apruebe manualmente. Informe analítico: se sigue CU-38 con cinco a doce visualizaciones y análisis humano obligatorio por cada una, metadatos y trazabilidad; su formato definitivo queda pendiente (PDF posible, no obligatorio). |
| **Poscondiciones** | 1. Existe una consolidación coherente con el período, ámbito y filtros aplicados. 2. Si se descargó, el archivo representa el mismo corte mostrado en pantalla. |
| **Trazabilidad** | RF-002, RF-087, RF-088, RF-089, RF-090, RF-091, RF-092, RF-093, RF-094, RF-095, RF-096, RF-122, RF-125; HU relacionadas: HU-039, HU-041, HU-043 RF-128, RF-129, RF-130, RF-131; RN-040, RN-041; HU-050; CU-38. |

*Figura 32: Diagrama de procesos de Caso de Uso CU-32*

### CU-38 — Generar y descargar un informe analítico con análisis por visualización

| Campo | Especificación |
| --- | --- |
| Nombre | CU-38 — Generar y descargar un informe analítico con análisis por visualización |
| Autor | No consignado en esta actualización documental. |
| Fecha | 03/11/2026; fuente funcional: sesión con Alina del 02/11/2026. |
| Descripción | Permite a un usuario autorizado de Reportería generar un informe analítico formal desde un asistente guiado, con cinco a doce visualizaciones y análisis humano obligatorio de cada una, metadatos y contexto trazables. Es independiente de explorar información, consolidar tablas y generar el reporte individual de un caso (HU-030/CU-22). |
| Actores | Principal: usuario con autorización vigente de Reportería de Oficina Local, Regional o Nacional. Secundario: Sistema. No concede acceso nuevo a Establecimiento; sus visualizaciones/KPI permanecen pendientes de validación. |
| Precondiciones | Usuario autenticado y autorizado en su ámbito. Contexto de período, filtros pertinentes y datos disponibles identificado. El catálogo de doce visualizaciones de RF-128 está disponible según permisos; para continuar debe haber al menos cinco opciones autorizadas y realmente disponibles. KPI de cobertura según definición operativa provisional RF-129/RN-040. |
| Flujo Normal | 1. Usuario: Pulsa Generar reporte, visible en la parte superior de Reportería. Sistema: Abre asistente emergente, modal o equivalente. 2. Sistema: Muestra «Seleccione al menos 5 visualizaciones de las siguientes para incluir en su reporte» y las doce opciones de RF-128 / 15.3, indicando las no disponibles/no autorizadas como no seleccionables. Usuario: Selecciona entre cinco y doce válidas. Sistema: Solo habilita Siguiente cuando hay al menos cinco. 3. Sistema: Presenta la primera seleccionada con gráfico o KPI, título dinámico y filtros relevantes, la instrucción «Por favor, redacte su análisis asociado a la visualización mostrada» y campo de texto multilínea. 4. Usuario: Redacta su análisis. Sistema: Valida que no esté vacío ni formado solo por espacios. Permite Anterior/Siguiente conservando cada texto y repite una por una hasta completar todas las visualizaciones seleccionadas, sin sustituir el análisis humano con generación automática. 5. Usuario: Registra un título obligatorio. Sistema: Obtiene automáticamente fecha/hora, identidad responsable, rol y ámbito institucional y unidad correspondiente (establecimiento, Oficina Local, Región o Nivel Nacional), período y filtros, sin redigitación de datos disponibles en la sesión. 6. Sistema: Presenta la revisión del título, identificación, contexto y todas las visualizaciones con sus análisis. Usuario: Revisa y confirma. 7. Sistema: Genera y permite descargar el documento con título, fecha/hora, responsable, área/ámbito, período y filtros; después incluye cada visualización seleccionada y directamente su análisis en el orden revisado, conservando título dinámico y filtros relevantes. 8. Sistema: Conserva trazabilidad del contexto, corte, filtros y datos utilizados y, cuando sea técnicamente viable, una instantánea histórica reproducible para mantener el significado del informe ante actualizaciones futuras. |
| Flujo Alternativo | 1. FA-01 — Menos de cinco seleccionadas o disponibles: bloquea Siguiente e informa; no cuenta una no disponible ni amplía permisos. 2. FA-02 — Análisis vacío o solo espacios: impide avanzar en esa visualización. Volver con Anterior conserva los textos ya escritos; todas requieren interpretación humana. 3. FA-03 — Título ausente o solo espacios: no permite confirmar generación hasta completarlo con contenido. 4. FA-04 — Carga, error, ausencia de datos o cambio de disponibilidad/permisos: informa el estado, conserva la captura permitida y no presenta como válida una visualización realmente no disponible ni mezcla cortes; requiere revisión del contexto antes de confirmar. 5. FA-05 — KPI sin casos activos: presenta Sin casos activos o No aplica con universo y corte; no divide entre cero ni cambia el denominador por el filtro general de estado. 6. FA-06 — Cancelación: no se declara generado un informe sin confirmación. Formato de descarga pendiente: PDF es una posibilidad, no una exigencia. 7. FA-07 — Independencia institucional: no incorpora aprobaciones, remisiones obligatorias ni periodicidad semestral/anual. |
| Poscondiciones | El informe generado incluye entre cinco y doce visualizaciones autorizadas/disponibles y análisis humano no vacío por cada una, título y metadatos automáticos, filtros, universo y corte trazables. Los datos operativos y estados de casos no se modifican por generar el informe. Su contexto histórico mantiene significado mediante trazabilidad y, cuando sea técnicamente viable, instantánea reproducible. |
| Reglas de negocio | RN-040 (cobertura operativa provisional, ratificación con Alina pendiente); RN-041 (informe analítico guiado); RN-018/RN-020/RN-023/RN-026 (ámbito, filtros y lectura); no modifica RN-009. |
| Trazabilidad | HU-050; HU-038 a HU-043; RF-002, RF-083 a RF-096, RF-122, RF-123, RF-128, RF-129, RF-130, RF-131; RN-040, RN-041; CU-29, CU-30, CU-31, CU-32. HU-030/CU-22 solo distinguen el reporte individual, no son dependencia activa del informe analítico. |

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
| **Flujo Alternativo** | **FA-01 — Error de validación** — El sistema impide publicar e identifica las inconsistencias.**FA-02 — Cancelación** — El administrador descarta los cambios no publicados.**FA-03 — Consulta histórica** — El administrador consulta versiones previas sin reescribir los registros históricos asociados.**FA-04 — Catálogos vigentes** — La versión actual mantiene Vía de Atención, orígenes y motivos de RF-022/RF-024; disciplinas sin Otra; frecuencias incluyendo Trimestral, Semestral y Según necesidad; programación conforme a RF-075; y matriz única de RN-009. Las opciones abiertas del instrumento de valoración se conservan cuando correspondan. Una nueva versión no altera los registros históricos. |
| **Poscondiciones** | 1. Existe una versión vigente claramente identificada. 2. Las versiones anteriores permanecen disponibles para interpretar registros históricos. |
| **Trazabilidad** | RF-099, RF-100, RF-118, RF-119, RF-120; HU relacionadas: Transversal a catálogos, formularios y reglas de las HU aplicables. |

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
| **Flujo Alternativo** | **FA-01 — Duplicado detectado** — El sistema no crea un nuevo registro de persona cuando puede vincularse con una identidad existente según las reglas definidas.**FA-02 — Registro inválido** — El sistema excluye el registro y documenta el error para revisión.**FA-03 — Importación parcial** — El sistema procesa únicamente los registros válidos y conserva el detalle de los rechazados.**FA-04 — Cancelación** — El equipo detiene el proceso antes de la confirmación sin incorporar cambios definitivos. |
| **Poscondiciones** | 1. Los registros válidos quedan incorporados de forma controlada. 2. Se conserva trazabilidad de la fuente, los resultados y los errores de migración. |
| **Trazabilidad** | RF-001, RF-101; HU relacionadas: Transversal a identidad e información histórica de las HU aplicables. |

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
| **Flujo Normal** | 1. **Usuario:** Ingresa una consulta en lenguaje natural. 2. **Sistema:** Interpreta la intención general de la consulta. 3. **Sistema:** Determina el rol, ámbito institucional, establecimientos autorizados cuando corresponda y demás restricciones aplicables al usuario. 4. **Sistema:** Determina qué información necesita para responder. 5. **Sistema:** Selecciona únicamente fuentes, entidades y datos habilitados y compatibles con el contexto autorizado. 6. **Sistema:** Construye una consulta estructurada de solo lectura. 7. **Sistema:** Valida la consulta antes de ejecutarla. 8. **Sistema:** Ejecuta la consulta dentro del ámbito autorizado. 9. **Sistema:** Obtiene los resultados permitidos. 10. **Sistema:** Genera una respuesta en lenguaje natural sustentada en los resultados obtenidos. 11. **Sistema:** Presenta la respuesta e indica, cuando corresponda, el ámbito, período o filtros relevantes utilizados. 12. **Usuario:** Consulta la respuesta obtenida. |
| **Flujo Alternativo** | **FA-01 — Información fuera de ámbito:** Si la pregunta requiere información que el usuario no está autorizado a consultar, el sistema no accede a dichos datos ni amplía el ámbito de autorización.**FA-02 — Sin resultados:** Si la consulta autorizada no devuelve registros, el sistema informa que no se encontraron datos para los criterios aplicados.**FA-03 — Información insuficiente:** Si los datos obtenidos no permiten sustentar una respuesta adecuada, el asistente informa que no dispone de información suficiente para responder.**FA-04 — Consulta ambigua:** Si no es posible determinar con suficiente precisión qué información solicita el usuario, el asistente solicita una aclaración antes de ejecutar la consulta.**FA-05 — Fuente no habilitada:** Si responder requiere una fuente, tabla, campo o servicio no habilitado para el asistente, el sistema no lo consulta e informa que la solicitud no puede resolverse con las fuentes disponibles.**FA-06 — Consulta no válida o riesgosa:** Si la consulta generada no supera las validaciones establecidas, el sistema no la ejecuta y devuelve un mensaje controlado.**FA-07 — Solicitud de modificación:** Si el usuario solicita mediante el asistente crear, modificar, eliminar, cerrar, trasladar u operar sobre un registro, el sistema no ejecuta la acción y mantiene el asistente en modalidad de consulta.FA-08 — Consultas de seguimiento — Según rol, ámbito y fuentes habilitadas se consultan cantidades y nombres de casos por prioridad, persona encargada/contacto, programación, referencias, última atención y casos sin atención en un período. No se infiere atención para todos los casos de un establecimiento por una actividad general. Establecimiento no obtiene detalle interno, riesgo ni protección. El asistente no crea referencias/casos, reprograma, cancela, cierra ni realiza otras operaciones. |
| **Poscondiciones** | 1. El usuario recibe una respuesta basada únicamente en información autorizada y disponible. 2. No se modifica información operativa como consecuencia de la consulta. 3. La interacción conserva la trazabilidad definida para el asistente conversacional. |
| **Trazabilidad** | RF-002, RF-103, RF-104, RF-105, RF-106, RF-107, RF-108, RF-109, RF-110, RF-111; HU relacionadas: HU-047 |

*Figura 35: Diagrama de procesos de Caso de Uso CU-35*

---
