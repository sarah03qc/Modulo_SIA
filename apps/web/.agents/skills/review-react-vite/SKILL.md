---
name: review-react-vite
description: Revisar componentes React 19 con Vite cuando cambien carga de datos, efectos, renderizado, listas, dependencias o tamaño del bundle.
---

# Revisión de React y Vite

1. Lee `AGENTS.md`, `docs/architecture/TECHNOLOGY_STACK.md` y el contrato de la funcionalidad. Identifica entrada, efectos, usuarios existentes y restricciones de ámbito.
2. Usa la [matriz de revisión React y Vite](references/revision-react.md). Examina primero esperas encadenadas y tamaño de carga, luego efectos, renderizado y JavaScript. Registra evidencia y criterio que permite medir la mejora.
3. Conserva los límites de funcionalidad, la autorización y el cliente API existente. Si hay implementación autorizada, conserva las pruebas Jest pertinentes y mide el cambio en la misma ruta y condiciones.
4. Entrega archivo y línea, observación, impacto, alternativa y método de comprobación. Cualquier recomendación para Next.js, Server Components o SSR requiere un stack que la implemente.

Consulta [las fuentes y revisiones](../../../../../docs/agent-workflow/visual-ui.md).
