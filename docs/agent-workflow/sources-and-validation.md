# Fuentes y pendientes — 2026-10-15

Fuente de este bootstrap: solicitud adjunta del usuario del 2026-10-15.
Es una decisión de configuración, no una especificación funcional del producto.
HU/RF/CU/RN/RNF del bootstrap: NOT_APPLICABLE; no se inventan identificadores.

La solicitud actual actualiza expresamente el orden previo de AGENTS.md:
fuente institucional confirmada → especificación funcional vigente → decisiones
aprobadas → implementación → suposiciones técnicas. Se alinea AGENTS.md y
las instrucciones activas. Una contradicción real entre fuentes exige
NEEDS_VALIDATION, evidencia, impacto y alternativas reversibles; no se resuelve
solo por aplicar esta jerarquía.

Los ámbitos Establecimiento → Oficina Local → Región → Nivel Nacional y la
prohibición de asignación paralela de establecimientos provienen de la solicitud.
No se han acreditado aún contra documentos institucionales del repositorio.

## NEEDS_VALIDATION

- NV-01: docs/functional y docs/institutional están vacíos; incorporar versión,
  responsable de validación, fecha y ubicación de especificación, flujo, anexos
  e instrumentos. Bloquea implementar comportamiento funcional sin respaldo.
- NV-02: faltan perfiles, permisos y contratos SIDINACC/CAH; no inferir acceso,
  fallback permisivo ni mecanismo de asignación de establecimientos.
- NV-03: faltan manual de identidad, permiso de logo, paleta y tokens aprobados.
  No crear identidad institucional por inferencia.
- NV-04: falta fuente institucional de WCAG 2.2 AA; la solicitud fija objetivo
  de revisión, no certifica adopción ni cumplimiento del producto.
- NV-05: no hay stack ni comandos de compilación/lint/tests aprobados;
  documentarlos con la futura decisión técnica. No seleccionar SQL Server u
  otra tecnología como decisión aprobada solo porque aparezca en un rol.
- NV-06: descubrimiento real en la versión instalada de Cursor pendiente de
  revisión humana en Customize. Validación estática no prueba carga en runtime.

## NEEDS_VALIDATION — autorización interna, 2026-11-06

La consolidación no cierra estos puntos. El comportamiento entregado los deja
denegados o sin mecanismo, no los resuelve por suposición.

- NV-AUTH-01: mecanismo de sesión SIDINACC, formato de credencial, identificador
  de usuario y lugar del que se leen perfil y establecimientos. Responsable: UTIC.
- NV-AUTH-02: correspondencia entre un perfil institucional y un rol interno de
  SIA. El adaptador rechaza una fuente distinta del registro sintético.
- NV-AUTH-03: si una misma persona puede tener roles de distinto nivel y cómo se
  consulta la unión de esos ámbitos. Hoy esa combinación responde 403.
- NV-AUTH-04: si dos oficinas o dos regiones del mismo rol se consultan juntas.
  Hoy tampoco se colapsan en una sola consulta.
- NV-AUTH-05: si Regional y Nacional ven valoración, riesgo, protección, plan,
  atenciones y documentos al consultar casos. Hoy esos campos se retiran.
- NV-AUTH-07: visualizaciones y KPI de Reportería para Establecimiento. No se
  concede `reporting.read` a ese rol.
- NV-AUTH-08: operaciones concretas de ACT-07. `catalog.manage` existe y ningún
  rol interno la tiene.
- NV-AUTH-09: exportación masiva de RF-020. La capacidad `reporting.export`
  está declarada para Oficina Local, Región y Nacional, y no tiene ruta.

Responsable de cierre: revisión humana institucional/técnica según tema.
Cada cierre debe añadir fuente, versión, decisión y alcance afectado; no basta
cambiar una etiqueta. Estos pendientes no impiden completar infraestructura.

## Decisión funcional — actores de Oficina Local, 2026-11-06

NV-AUTH-06 queda cerrado. No se reutiliza ese identificador.

Aclaración del proyecto: ACT-02, ACT-03 y ACT-04 comparten las mismas
capacidades y permisos en SIA-CENCINAI. ACT-03 es el equipo formado por esos
profesionales, no un rol adicional. La jefatura, ACT-04, no recibe permisos
distintos por su liderazgo. El rol interno sigue siendo `OFICINA_LOCAL`.

Fuente: aclaración funcional del 2026-11-06. Registro:
`docs/decisions/0003-local-office-actors.md`. Alcance: autorización del módulo.
No cierra la integración con UTIC ni los demás NV-AUTH.

## Referencias técnicas consultadas

- https://cursor.com/docs/rules — Project Rules y frontmatter.
- https://cursor.com/docs/subagents — agentes de proyecto y metadatos.
- https://cursor.com/docs/skills — ambas raíces de skills, búsqueda recursiva,
  name coincidente con carpeta y description.

Consulta: 2026-10-15. No son fuentes de reglas institucionales.
