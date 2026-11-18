# Diseño y verificación visual

## Fuentes y skills del proyecto

Aplica primero [la especificación de identidad y accesibilidad](../institutional/DESIGN_ACCESSIBILITY_SPEC.md), la funcionalidad aprobada y los [quality gates](quality-gates.md). Los criterios de esta guía sirven al rediseño gradual, bajo revisión humana. Evalúa WCAG 2.2 AA con pruebas automáticas y revisión manual. Los tokens CSS de la demostración son propuestas técnicas locales.

| Skill en `apps/web/.agents/skills/` | Procedencia consultada | Recurso práctico |
| --- | --- | --- |
| [`design-institutional-ui`](../../apps/web/.agents/skills/design-institutional-ui/SKILL.md) | [Frontend Design de Anthropic](https://github.com/anthropics/skills/tree/main/skills/frontend-design) (Apache-2.0) y [UI/UX Pro Max v2.15.0](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/releases/tag/v2.15.0) (MIT) | Matriz de navegación, formularios, filtros, tablas y estados con pruebas de aceptación. |
| [`audit-rendered-ui`](../../apps/web/.agents/skills/audit-rendered-ui/SKILL.md) | [Web Design Guidelines de Vercel 1.0.0](https://github.com/vercel-labs/agent-skills/tree/main/skills/web-design-guidelines) y su [lista de revisión MIT](https://github.com/vercel-labs/web-interface-guidelines/blob/main/command.md) | Protocolo de foco, semántica, contraste, reflujo y reproducción de hallazgos. |
| [`review-react-vite`](../../apps/web/.agents/skills/review-react-vite/SKILL.md) | [React Best Practices de Vercel 1.0.0](https://github.com/vercel-labs/agent-skills/tree/main/skills/react-best-practices) (MIT) | Matriz priorizada para React 19 y Vite con controles de efectos, carga y renderizado. |
| [`design-reporting-visuals`](../../apps/web/.agents/skills/design-reporting-visuals/SKILL.md) | [Quick Reference de UI/UX Pro Max v2.15.0](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill/blob/a38d04c3d5c298c851dbe5e6ee1965ee3de42cb5/.claude/skills/ui-ux-pro-max/references/quick-reference.md), [manual de ECharts](https://echarts.apache.org/handbook/en/basics/import/) y especificaciones SIA | Elección de gráfico por pregunta, semántica de datos y verificación de equivalencia tabular. |

Las fichas y sus referencias son adaptaciones locales con redacción y ejemplos propios. Funcionan mediante lectura de archivos locales y conservan las reglas institucionales como autoridad sobre cualquier recomendación externa.

Blobs consultados, en orden Anthropic, UI/UX Pro Max, Vercel Web y Vercel React: `a5333457c414d20d625f307df945842c0952ecc3`, `41f8e2fd7f8c568228d0b55186ebe3f7b4007377`, `ceae92ab319216a68274168fba9b63b998b65997` y `237988de4a66dd8a71d30a2c24ebe1a86b58d04e`. La lista de auditoría de Vercel corresponde al blob `3eb3a212b7b89493922ea418489d4c6f67ae8bd5`.

### Descubrimiento

- **Cursor.** Abre `modulo`, activa un archivo de `apps/web/` y abre un chat nuevo. Revisa Customize → Skills o escribe `/design-institutional-ui` en el selector de Agent. El alcance de la carpeta anidada es el frontend. [Documentación de Cursor](https://cursor.com/docs/skills).
- **Codex.** Desde la raíz ejecuta `codex -C apps/web` y abre `/skills`. En la app inicia una sesión con `modulo/apps/web` como directorio de trabajo. Desde una sesión de raíz, los roles abren los `SKILL.md` por los enlaces anteriores. [Documentación de Codex](https://learn.chatgpt.com/docs/build-skills).

### Selección por rol

| Rol | Cuándo abrir las fichas del catálogo |
| --- | --- |
| A-00 | Identifica entregable y área de UI. Asigna a A-04 la ficha de diseño, React o gráficos según el cambio. Pasa a A-08 la ruta de auditoría y el resultado esperado aprobado. |
| A-04 | Abre `design-institutional-ui` para flujos, `review-react-vite` para componentes y `design-reporting-visuals` para decisiones de gráficos y tablas. Aplica los recursos locales antes de proponer cambios. |
| A-08 | Abre `audit-rendered-ui` y deriva primero los pasos desde la fuente funcional. Añade `design-reporting-visuals` cuando deba comprobar paridad entre gráfico y tabla. Documenta evidencia independiente. |

## Iteración por pantalla

1. **A-00** identifica la tarea, ruta, perfiles, fuentes, criterios y comportamiento que se debe conservar. Delimita el cambio y separa cualquier conflicto que requiera validación.
2. **A-04** abre la pantalla funcional con datos sintéticos y registra el punto de partida. Prioriza problemas observables de navegación, jerarquía, legibilidad, densidad, acciones o estados.
3. **A-04** consulta los lineamientos, propone el patrón e implementa un cambio acotado. Reutiliza componentes, conserva terminología y usa la presentación de datos aprobada.
4. **A-04** abre el resultado, examina la captura real y el árbol accesible, comprueba consola, fallos de recursos, teclado, contraste y reflujo. Corrige los problemas y repite. Explica con evidencia qué mejoró y qué queda pendiente.
5. **A-08** reproduce la tarea independientemente en los tamaños y roles pertinentes. Combina Playwright, axe y revisión manual. Devuelve hallazgos con ruta, datos sintéticos, pasos, resultado esperado y observado.
6. **A-00** consolida resultados, diferencias visuales y estado de los gates. Presenta la evidencia para aceptación humana y registra cualquier referencia visual que reciba aprobación.

## Instalación y ejecución

Desde la raíz, usa Node 24 LTS y npm en PATH. El lockfile fija ECharts, Playwright Test y axe para navegador.

```powershell
npm ci
npm ls echarts @playwright/test @axe-core/playwright --all
npx playwright install chromium
npm run test:visual
```

La primera instalación requiere acceso al registro de npm y la descarga de Chromium requiere acceso a la distribución de navegadores de Playwright. Si npm devuelve `ENOTFOUND`, registra la instalación como bloqueada y conserva las versiones del lockfile. Para ejecutar Playwright localmente se necesita acceso al servidor Vite en `127.0.0.1:5175`.

Playwright y axe complementan a Jest, React Testing Library y `jest-axe`. La verificación de interfaz usa datos sintéticos y no depende del API ni de SQL Server. Revisa `.local/playwright/` para capturas candidatas y resultados. Una captura candidata solo se incorpora a `tests/visual/baselines/` después de revisar el contenido y obtener aceptación humana para esa plataforma y viewport.

La aplicación operativa usa la misma paleta en `apps/web/src/estilos/global.css`: navegación lateral por grupos de trabajo, barra de ámbito, tarjetas de inicio y gráficos de reportería. El demo `.sia-visual` sigue fuera de la entrada productiva. Los doce formatos analíticos no cambian; la presentación elige barras horizontales, barras verticales, donut, tabla o KPI según la pregunta de cada código.

La ruta de cada referencia es `tests/visual/baselines/<proyecto>/<plataforma>/<archivo-spec>/<captura>.png`. Usa el Chromium fijado por Playwright para referencias comparables. En Windows, `$env:SIA_VISUAL_CHROME = '1'` permite ejecutar la inspección con Chrome instalado y generar capturas candidatas. Esa ejecución omite las comparaciones con baselines de Chromium.

`npm run dev:web` sirve [la demostración sintética](http://127.0.0.1:5174/demos/ui-visual/index.html). Los tokens y patrones en `apps/web/src/estilos/` se activan con `.sia-visual`. La demostración queda fuera de la entrada productiva. La capa en `apps/web/src/componentes/visualizacion/` prepara perfiles de presentación para los seis formatos existentes. La elección final depende de la semántica aprobada de cada visualización.

ECharts 6.1.0 (Apache-2.0) ofrece ESM y API DOM independientes de React. El componente gestiona su instancia con React e importa solo los módulos registrados desde `echarts/core`. La [distribución completa minificada](https://cdn.jsdelivr.net/npm/echarts@6.1.0/dist/) pesa alrededor de 1,07 MB. Esa cifra corresponde al archivo completo y la compilación de la aplicación no incluye la demostración. El [aviso de seguridad de Apache ECharts](https://github.com/advisories/GHSA-fgmj-fm8m-jvvx) identifica 6.1.0 como versión corregida. Usa tooltip `richText` y etiquetas como texto. Antes de activar cada ruta, mide su bundle emitido y compara los datos, etiquetas, unidad, corte, filtros y denominador con la alternativa tabular. Ejecuta `npm audit` al actualizar el lockfile.

## Navegadores MCP

Cursor usa [`.cursor/mcp.json`](../../.cursor/mcp.json). Comprueba los dos servidores en Customize → MCPs. Chrome DevTools MCP necesita Chrome estable y Node según su versión. Ambos servidores usan Chrome o su canal local con un perfil de navegación aislado.

En un proyecto de confianza, integra estos bloques en `.codex/config.toml` sin duplicar claves. Si gestionas MCP de forma personal, puedes agregarlos al archivo de usuario existente. Abre una sesión nueva y revisa `/mcp` o `codex mcp list`.

```toml
[mcp_servers.sia-chrome-devtools]
command = "npx"
args = ["--yes", "--ignore-scripts", "chrome-devtools-mcp@1.13.0", "--headless", "--isolated", "--no-usage-statistics", "--no-performance-crux"]
env = { CHROME_DEVTOOLS_MCP_NO_UPDATE_CHECKS = "1" }
startup_timeout_sec = 60
env_vars = ["SystemRoot", "PROGRAMFILES", "LOCALAPPDATA", "APPDATA"]

[mcp_servers.sia-playwright]
command = "npx"
args = ["--yes", "--ignore-scripts", "@playwright/mcp@0.0.86", "--browser", "chrome", "--headless", "--isolated", "--caps", "vision"]
startup_timeout_sec = 60
env_vars = ["SystemRoot", "PROGRAMFILES", "LOCALAPPDATA", "APPDATA"]
```

En Windows, si el cliente no resuelve el shim, usa `command = "cmd.exe"` y antepone `"/d", "/c", "npx"` a los argumentos. Para verificar, inicia la demo y usa cada servidor contra su URL local con datos sintéticos. En Chrome DevTools ejecuta `navigate_page`, `take_snapshot`, `list_console_messages` y `take_screenshot`. En Playwright ejecuta `browser_navigate`, `browser_snapshot`, `browser_console_messages` y `browser_take_screenshot`. Registra contenido renderizado, mensajes y una imagen guardada en `.local/`. La aparición del servidor en la lista confirma únicamente el registro de la configuración.

Referencias de configuración: [Cursor](https://cursor.com/docs/context/mcp), [Codex](https://learn.chatgpt.com/docs/extend/mcp?surface=cli), [Chrome DevTools MCP](https://github.com/ChromeDevTools/chrome-devtools-mcp/releases/tag/chrome-devtools-mcp-v1.13.0) y [Playwright MCP](https://github.com/microsoft/playwright-mcp/releases/tag/v0.0.86).
