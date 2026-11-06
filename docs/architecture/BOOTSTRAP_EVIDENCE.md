# Evidencia del bootstrap de aplicación — 2026-11-06

La comprobación de agentes no sustituye estas pruebas. Node.js 24.20.0 y npm 11.19.0. No se modificaron esquemas, migraciones ni filas de `SIA_CENCINAI` o `SIDINACC_LOCAL`.

## Gate 1 — Diseño

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Stack seleccionado | PASS | React 19.3.1, Express 5.3.0, Jest 30.5.2, `mssql` 12.7.14. Sin TypeScript, ORM ni otro motor. |
| Arquitectura y fronteras | PASS | `docs/architecture/SOFTWARE_ARCHITECTURE.md` y `docs/decisions/0001-modular-monolith.md`. |
| Fuentes funcionales | PASS | Especificación v0.7 localizada. Este bootstrap no implementa una HU. |
| Dependencias justificadas | PASS | `docs/architecture/DEPENDENCY_DECISIONS.md`. |
| Reglas institucionales inventadas | PASS | La sesión SIDINACC sigue `NEEDS_VALIDATION`. No hay login propio. |
| HU / RF / CU del producto | NOT_APPLICABLE | El encargo es infraestructura de desarrollo, no una historia. |

## Gate 2 — Ejecución

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `npm ci` | PASS | 725 paquetes desde `package-lock.json`. Código de salida 0. |
| `npm test` | PASS | API 16/16. Web 7/7. Incluye lectura real a las dos bases y conteos iguales antes y después. |
| `npm run lint` | PASS | ESLint sin avisos. |
| `npm run build` | PASS | Vite 8.3.6. Salida en `apps/web/dist`, ignorada por Git. |
| API `/health` | PASS | HTTP 200. `status: ok`, entorno `development`. |
| API `/ready` | PASS | HTTP 200. `SIA_CENCINAI` y `SIDINACC_LOCAL` en `up`. `readOnly: false`. |
| Web | PASS | Vite en `http://127.0.0.1:5174`. El navegador mostró el título, el ambiente Desarrollo y «API en ejecución y dependencias disponibles». El botón «Volver a comprobar» volvió a ese estado. |
| CORS | PASS | `Access-Control-Allow-Origin: http://127.0.0.1:5174`. |
| Datos existentes | PASS | La prueba de conectividad compara conteos de lectura y no escribe. |
| Secretos en respuestas | PASS | `/health`, `/ready` y la comprobación de arranque no contienen contraseña ni cadena de conexión. |
| Agentes | PASS | `scripts/validate-agent-infrastructure.ps1`: 10 reglas, 11 agentes, 15 skills. El descubrimiento dentro de Cursor queda NOT_RUN. |

`npm run check:runtime` arrancó ambos procesos, hizo las comprobaciones y los detuvo. El puerto 5173 ya lo usaba otro Vite local; esta aplicación usa 5174. Ese otro proceso no se detuvo.

## Gate 3 — Revisión

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Documentación | PASS | README, arquitectura, dependencias y entorno. |
| Trazabilidad de producto | NOT_APPLICABLE | No hay HU implementada. Los módulos futuros quedan nombrados por épica, sin comportamiento. |
| Aislamiento SQL de la réplica | PASS_WITH_NOTES | El código separa los clientes y bloquea escrituras en el adaptador. El login local no es de solo lectura. `/ready` lo informa. No se cambiaron permisos. |
| Auditoría de dependencias | PASS_WITH_NOTES | 3 bajas y 16 moderadas, todas en el árbol de Jest. Sin altas ni críticas. No se aplicó el descenso a Jest 25. |
| QA independiente | NOT_RUN | Las pruebas las ejecutó el agente coordinador. No hubo un pase separado de A-08. |
| Revisión de seguridad independiente | PASS_WITH_NOTES | Sin hallazgos altos ni medios. Dos notas bajas quedaron corregidas: `npm run health` no imprime una respuesta que contenga material sensible, y la prueba de conexión ya no trata como solo lectura a cualquier usuario distinto de `sa`. |
| Code review independiente | PASS_WITH_NOTES | El informe pidió cambios en el filtro SQL. Quedó rechazada una segunda sentencia sin punto y coma, y también `CREATE`, `USE`, `DENY`, `DBCC` y `alias.*`. El aviso de escucha ocupada ahora termina el proceso. La pantalla técnica muestra cuando el permiso de solo lectura no está verificado. |

## Pendientes

- Mapear un login de solo lectura a `SIDINACC_LOCAL` sin inventar la contraseña ni alterar permisos desde este bootstrap.
- Mecanismo de sesión SIDINACC.
- ESLint 10 cuando `eslint-plugin-react` lo declare.
- Logotipo oficial y certificación de accesibilidad. `jest-axe` pasó en la pantalla técnica y no certifica WCAG.
