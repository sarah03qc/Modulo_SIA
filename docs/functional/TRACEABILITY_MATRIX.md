# SIA-CENCINAI — Matriz de trazabilidad RF ↔ CU

**Versión:** 0.4  
**Fecha:** 25 de septiembre de 2026  
**Estado:** Descubrimiento / refinamiento funcional / validación mediante prototipo  
**Producto:** Sistema de apoyo a la Atención Interdisciplinaria (SIA-CENCINAI)


> [!IMPORTANT]
> Este archivo forma parte de la especificación funcional y debe mantenerse sincronizado con [`FUNCTIONAL_SPEC.md`](./FUNCTIONAL_SPEC.md).
>
> La trazabilidad objetivo del proyecto es:
> **Proceso institucional → flujograma → instrumentos/variables → HU → RF → CU → prototipo → implementación → pruebas.**

---

## Matriz RF ↔ CU

La matriz relaciona cada caso de un indice de CU con los requerimientos funcionales que implementa de forma directa. Los requerimientos transversales se identifican por separado cuando aplican a múltiples casos.

| Caso de uso | Requerimientos funcionales relacionados |
| --- | --- |
| **CU-01 — Consultar resumen de A.I. según rol** | RF-002 a RF-007 |
| **CU-02 — Buscar y seleccionar un cliente/beneficiaria** | RF-001, RF-008 a RF-015, RF-104 |
| **CU-03 — Consultar perfil según nivel de acceso** | RF-012 a RF-020, RF-103 |
| **CU-04 — Crear manualmente una referencia** | RF-021 a RF-030, RF-097, RF-098 |
| **CU-05 — Cargar referencia desde plantilla estandarizada** | RF-036, RF-037 |
| **CU-06 — Consultar y gestionar referencias según ámbito** | RF-031 a RF-035 |
| **CU-07 — Gestionar una sesión interdisciplinaria** | RF-038 a RF-040, RF-098 |
| **CU-08 — Registrar valoración situacional** | RF-041 a RF-044, RF-098 |
| **CU-09 — Resolver si requiere A.I.** | RF-045, RF-046 |
| **CU-10 — Definir abordaje inicial y abrir caso** | RF-047, RF-048, RF-097 |
| **CU-11 — Consultar lista simplificada de A.I. desde Establecimiento** | RF-012, RF-013, RF-049, RF-050, RF-104 |
| **CU-12 — Consultar y filtrar casos de Oficina Local** | RF-051, RF-054 |
| **CU-13 — Consultar detalle integral en Oficina Local** | RF-055, RF-057, RF-103 |
| **CU-14 — Consultar y filtrar casos Regionales** | RF-052, RF-054 |
| **CU-15 — Consultar detalle desde Regional** | RF-056, RF-057, RF-103 |
| **CU-16 — Consultar y filtrar casos Nacionales** | RF-053, RF-054 |
| **CU-17 — Consultar detalle desde Nacional** | RF-056, RF-057, RF-103 |
| **CU-18 — Gestionar documentos** | RF-058, RF-103 |
| **CU-19 — Registrar coordinación interinstitucional** | RF-059, RF-060, RF-097, RF-103 |
| **CU-20 — Trasladar caso** | RF-061, RF-062, RF-097 |
| **CU-21 — Confirmar continuidad por traslado** | RF-062, RF-063, RF-097 |
| **CU-22 — Generar reporte sin cerrar** | RF-064, RF-065, RF-097 |
| **CU-23 — Cerrar caso A.I.** | RF-065, RF-066, RF-097 |
| **CU-24 — Registrar atención individual** | RF-067 a RF-069, RF-097, RF-098 |
| **CU-25 — Registrar atención grupal** | RF-070 a RF-074, RF-097, RF-098 |
| **CU-26 — Gestionar programación de Oficina Local** | RF-075 a RF-080 |
| **CU-27 — Consultar programación Regional** | RF-081 |
| **CU-28 — Consultar programación Nacional** | RF-082 |
| **CU-29 — Consultar reportería de Oficina Local** | RF-083, RF-087 a RF-091 |
| **CU-30 — Consultar reportería Regional** | RF-084, RF-086 a RF-091 |
| **CU-31 — Consultar reportería Nacional** | RF-085 a RF-091 |
| **CU-32 — Generar y descargar consolidación dinámica** | RF-092 a RF-096 |
| **CU-33 — Administrar catálogos y versiones** | RF-099, RF-100 |
| **CU-34 — Importar o migrar información histórica** | RF-001, RF-101 |
| **CU-35 — Consultar información mediante asistente conversacional — Usuario autorizado** | RF-002, RF-103, RF-104 cuando corresponda, RF-105 a RF-111 |

## Requerimientos transversales o pendientes de un CU exclusivo

| Requerimiento | Aplicación |
| --- | --- |
| **RF-002** | Control de acceso por rol y ámbito; aplica transversalmente a los casos de uso ejecutados por usuarios del sistema. |
| **RF-097** | Trazabilidad de autor, responsable, fecha de evento y fecha de digitación; aplica a los flujos que crean o modifican información operativa. |
| **RF-098** | Autoguardado y recuperación; aplica a capturas extensas como referencia, sesión, valoración y atenciones. |
| **RF-102** | Reutilización futura de resultados de vigilancia/tamizaje; no posee todavía un CU exclusivo porque el punto de entrada y el actor revisor permanecen pendientes de definición. |
| **RF-103** | Permisos reforzados sobre información sensible; aplica a consultas y gestiones que involucren datos sujetos a restricciones adicionales. |
| **RF-104** | Obtención y aplicación de los establecimientos autorizados mediante el mecanismo institucional vigente, sin mantener una asignación paralela en SIA-CENCINAI. Aplica a las funcionalidades de nivel Establecimiento que dependen del ámbito autorizado y, de forma directa, a CU-02 y CU-11. |
| **RF-106 / RF-107 / RF-108** | Controles transversales del futuro asistente conversacional relativos a autorización previa, selección restringida de datos y ejecución exclusiva de consultas validadas de solo lectura. |
