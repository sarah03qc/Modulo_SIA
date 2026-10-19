# Workflow supervisado

Leer AGENTS.md y sources-and-validation.md. Un agente tiene un objetivo técnico
concreto y archivos propios por iteración. No revertir trabajo ajeno; coordinar
contratos antes de cambiar otra capa. Los roles están en .cursor/agents/.

1. REQUIREMENT REFINEMENT: A-01 localiza fuente y HU/RF/CU, RN/RNF,
   criterios y conflictos. Ejecutar Gate 1 antes de implementar.
2. TECHNICAL PLANNING: A-00 + A-02 acotan archivos, dependencias, riesgos,
   contratos, pruebas y decisiones reversibles. Usar templates/task.md.
3. IMPLEMENTATION: delegar solo etapas pertinentes a Data, Backend, Frontend
   e Integration. Omitir las irrelevantes con motivo. Entregar templates/handoff.md.
4. QA: A-08 verifica criterios, bordes, errores, permisos y regresión de forma
   adversarial. No modifica implementación para pasar pruebas. Gate 2.
5. SECURITY REVIEW: A-07 cuando hay permisos, datos sensibles, integraciones
   o cambios relevantes; registrar evidencia o no aplicabilidad justificada.
6. CODE REVIEW: A-09 independiente revisa diff y archivos nuevos, contratos,
   alcance, trazabilidad, datos y pruebas. Hallazgos vuelven al propietario.
7. DOCUMENTATION: A-10 registra estado real, trazabilidad y decisiones.
8. HUMAN REVIEW: Gate 3 prepara evidencia; solo revisión humana acepta la historia.

Estados funcionales: CONFIRMADO / DRAFT / PROPOSED / NEEDS_VALIDATION /
EXPLORATORIO / OUT_OF_SCOPE. No confundir con ejecución.
Estados de ejecución: COMPLETED / BLOCKED / NEEDS_CHANGES / NOT_APPLICABLE /
PENDING_USER_APPROVAL / NEEDS_VALIDATION. COMPLETED de una subtarea no es DONE
de una historia. Los veredictos de revisión pueden ser específicos, pero el
handoff siempre usa uno de estos estados y registra hallazgos separados.

No implementar reglas ambiguas: registrar fuentes, conflicto, impacto y opción
reversible en sources-and-validation.md o registro de validación de la historia.
Trabajo útil ajeno al objetivo se reporta OUT_OF_SCOPE y no se ejecuta.

## Descubrimiento y mantenimiento

Rules: .cursor/rules/*.mdc. Agentes: .cursor/agents/*.md.
Skills canónicos: .agents/skills/**/SKILL.md; no duplicar nombres entre raíces.
Las antiguas copias de .cursor/skills quedan como LEGACY.md no ejecutable.
Las tres configuraciones .codex/agents son adaptadores locales a roles canónicos,
no roles adicionales; revisar su compatibilidad en el cliente que las consume.

Ejecutar `powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1`.
En Cursor abrir Customize y comprobar reglas, los once roles y skills por nombre;
invocar refine-requirement sobre una solicitud sintética sin fuente: debe
devolver NEEDS_VALIDATION y no generar producto. Si el cliente no descubre un
artefacto, registrar versión y error, sin inventar soporte ni duplicar carpetas.

