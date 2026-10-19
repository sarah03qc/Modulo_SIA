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

Responsable de cierre: revisión humana institucional/técnica según tema.
Cada cierre debe añadir fuente, versión, decisión y alcance afectado; no basta
cambiar una etiqueta. Estos pendientes no impiden completar infraestructura.

## Referencias técnicas consultadas

- https://cursor.com/docs/rules — Project Rules y frontmatter.
- https://cursor.com/docs/subagents — agentes de proyecto y metadatos.
- https://cursor.com/docs/skills — ambas raíces de skills, búsqueda recursiva,
  name coincidente con carpeta y description.

Consulta: 2026-10-15. No son fuentes de reglas institucionales.
