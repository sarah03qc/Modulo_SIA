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
| `npm test` | PASS | Corrida anterior del bootstrap: API 16/16 y web 7/7. La corrida vigente, con la prueba de permisos, está en la sección de acceso de solo lectura. |
| `npm run lint` | PASS | ESLint sin avisos. |
| `npm run build` | PASS | Vite 8.3.6. Salida en `apps/web/dist`, ignorada por Git. |
| API `/health` | PASS | HTTP 200. `status: ok`, entorno `development`. |
| API `/ready` | PASS | Corrida anterior del bootstrap. HTTP 200. `readOnly: false` porque las dos conexiones usaban la credencial de despliegue. El resultado vigente está en «Acceso institucional de solo lectura — 2026-11-06». |
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
| Aislamiento SQL de la réplica | PASS_WITH_NOTES | Corrida anterior del bootstrap. El código ya separaba los clientes, pero el login local todavía no era de solo lectura. El cierre está en «Acceso institucional de solo lectura — 2026-11-06». |
| Auditoría de dependencias | PASS_WITH_NOTES | 3 bajas y 16 moderadas, todas en el árbol de Jest. Sin altas ni críticas. No se aplicó el descenso a Jest 25. |
| QA independiente | NOT_RUN | Las pruebas las ejecutó el agente coordinador. No hubo un pase separado de A-08. |
| Revisión de seguridad independiente | PASS_WITH_NOTES | Sin hallazgos altos ni medios. Dos notas bajas quedaron corregidas: `npm run health` no imprime una respuesta que contenga material sensible, y la prueba de conexión ya no trata como solo lectura a cualquier usuario distinto de `sa`. |
| Code review independiente | PASS_WITH_NOTES | El informe pidió cambios en el filtro SQL. Quedó rechazada una segunda sentencia sin punto y coma, y también `CREATE`, `USE`, `DENY`, `DBCC` y `alias.*`. El aviso de escucha ocupada ahora termina el proceso. La pantalla técnica muestra cuando el permiso de solo lectura no está verificado. |

## Pendientes

- Mecanismo de sesión SIDINACC.
- ESLint 10 cuando `eslint-plugin-react` lo declare.
- Logotipo oficial y certificación de accesibilidad. `jest-axe` pasó en la pantalla técnica y no certifica WCAG.
- La conexión de `SIA_CENCINAI` sigue usando la credencial de despliegue. El login de lectura no cubre esa base.

## Acceso institucional de solo lectura — 2026-11-06

Se cerró el pendiente de mapear un login de lectura. No se reinstaló SQL Server ni se recreó `sidinacc-local-sql`.

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Identidad | CREADA | Login y usuario `sia_sidinacc_app`. No se reutilizó `cencinai_reader` ni se alteró `sia_sidinacc_reader` (`WITHOUT LOGIN`). |
| Ámbito | PASS | Base predeterminada `SIDINACC_LOCAL`. Sin roles de servidor. Permiso de servidor: `CONNECT SQL`. Sin usuario en `SIA_CENCINAI`. |
| Permisos | PASS | Miembro de `sia_sidinacc_reader_role`. Ese rol sigue en `db_datareader` y conserva `DENY INSERT`, `UPDATE`, `DELETE` y `ALTER`. No se agregaron `DENY` nuevos. |
| `SELECT` | PASS | `SELECT TOP (0)` sobre `dbo.CAF_CAT_SEXO` devolvió cero filas. |
| `INSERT` / `UPDATE` / `DELETE` | PASS | Error 229. Las sentencias tenían `WHERE 1 = 0`. |
| `CREATE TABLE` | PASS | Error 262. |
| `ALTER` | PASS | Error 1088 sobre `CAF_CAT_SEXO`. La columna de prueba no quedó creada. |
| `DROP` | PASS | Error 3701 sobre una tabla desechable que seguía existiendo. La tabla se eliminó después con la credencial de despliegue. |
| `SIA_CENCINAI` | PASS | `HAS_DBACCESS` = 0. `SELECT` e `INSERT` de tres partes devolvieron 916. `guest` sin `CONNECT`. Encadenamiento de bases en 0. |
| Backend | PASS | `sameDatabaseUser: false`. `/ready` respondió `readOnly: true`. El filtro de consultas sigue activo. |
| Pruebas | PASS | API 17/17, incluida `sidinacc-reader-permissions.test.js`. Web 8/8. Lint y build en 0. |
| Datos | PASS | Conteos finales iguales a los iniciales: 15 tablas y 1305 columnas en `SIDINACC_LOCAL`, 3 filas en `CAF_CAT_SEXO`, 4708 en `CAF_PERSONA`, 10 migraciones y 47 tablas en `SIA_CENCINAI`. |

`readOnly` es la sonda de permisos del login. `writeFilterEnabled` solo describe el filtro del adaptador.

Revisiones independientes de esta sección: datos, integración, seguridad, QA y código quedan en `READ_ONLY_ACCESS_PASS_WITH_NOTES` o `PASS_WITH_NOTES`. QA repitió pruebas, lint, build y `/ready`. El ajuste posterior marca las filas históricas del bootstrap y retira también `__sia_reader_create_probe` si un `CREATE` inesperado llegara a ejecutarse.
