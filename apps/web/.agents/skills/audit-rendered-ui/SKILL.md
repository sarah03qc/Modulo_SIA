---
name: audit-rendered-ui
description: Auditar interfaces de SIA-CENCINAI mediante revisión estática o renderizada, teclado, foco, reflujo, WCAG 2.2 AA y evidencia reproducible.
---

# Auditoría de interfaz renderizada

1. Define ruta, roles, datos sintéticos, estado inicial y expectativa independiente. Usa `AGENTS.md`, la fuente funcional y `docs/institutional/DESIGN_ACCESSIBILITY_SPEC.md`.
2. Ejecuta el [protocolo](references/protocolo.md). Usa DOM y árbol accesible cuando estén disponibles. Complementa el escaneo automático con interacción manual.
3. Registra archivo y línea para evidencia de fuente o ruta, tamaño y pasos para evidencia de navegador. Añade resultado esperado, observado, criterio e impacto. Declara `NOT_RUN` cuando falte el medio de comprobación.
4. A-08 reproduce de forma independiente y devuelve hallazgos a A-04. Compara capturas con referencias aprobadas del mismo navegador, plataforma y viewport. La captura candidata espera aceptación humana.

Consulta [las fuentes y revisiones](../../../../../docs/agent-workflow/visual-ui.md).
