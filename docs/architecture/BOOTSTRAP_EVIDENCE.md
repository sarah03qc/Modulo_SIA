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
| `npm test` | PASS | Corrida anterior del bootstrap: API 16/16 y web 7/7. La corrida vigente está en «Cuentas separadas y suite sin credencial de despliegue». |
| `npm run lint` | PASS | ESLint sin avisos. |
| `npm run build` | PASS | Vite 8.3.6. Salida en `apps/web/dist`, ignorada por Git. |
| API `/health` | PASS | HTTP 200. `status: ok`, entorno `development`. |
| API `/ready` | PASS | Corrida anterior del bootstrap. HTTP 200. `readOnly: false` porque las dos conexiones usaban la credencial de despliegue. El resultado vigente está en «Cuentas separadas y suite sin credencial de despliegue». |
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
- `sia_cencinai_app` no tiene todavía la escritura funcional de `rol_aplicacion`. No se concede para estabilizar el entorno.

## Acceso institucional de solo lectura — 2026-11-06

Se cerró el pendiente de mapear un login de lectura. No se reinstaló SQL Server ni se recreó `sidinacc-local-sql`. Las filas de esta tabla describen aquella corrida. La suite de entonces todavía preparaba una tabla con la credencial de despliegue. No describen la suite actual.

| Check | Resultado | Evidencia |
| --- | --- | --- |
| Identidad | CREADA | Login y usuario `sia_sidinacc_app`. No se reutilizó `cencinai_reader` ni se alteró `sia_sidinacc_reader` (`WITHOUT LOGIN`). |
| Ámbito | PASS | Histórico. Sin roles de servidor. Permiso registrado entonces: `CONNECT SQL`. La medición vigente añade `VIEW ANY DATABASE`, heredado de `public`. Sin usuario en `SIA_CENCINAI`. |
| Permisos | PASS | Miembro de `sia_sidinacc_reader_role`. Ese rol sigue en `db_datareader` y conserva `DENY INSERT`, `UPDATE`, `DELETE` y `ALTER`. No se agregaron `DENY` nuevos. |
| `SELECT` | PASS | `SELECT TOP (0)` sobre `dbo.CAF_CAT_SEXO` devolvió cero filas. |
| `INSERT` / `UPDATE` / `DELETE` | PASS | Error 229. Las sentencias tenían `WHERE 1 = 0`. |
| `CREATE TABLE` | PASS | Histórico. Error 262. La suite actual no ejecuta `CREATE`; comprueba el permiso efectivo. |
| `ALTER` | PASS | Histórico. Error 1088 sobre `CAF_CAT_SEXO`. La columna de prueba no quedó creada. La suite actual no ejecuta `ALTER`. |
| `DROP` | PASS | Histórico. Error 3701 sobre una tabla desechable. Aquella corrida la eliminó con la credencial de despliegue. La suite actual no crea ni elimina esa tabla. |
| `SIA_CENCINAI` | PASS | `HAS_DBACCESS` = 0. `SELECT` e `INSERT` de tres partes devolvieron 916. `guest` sin `CONNECT`. Encadenamiento de bases en 0. |
| Backend | PASS | `sameDatabaseUser: false`. `/ready` respondió `readOnly: true`. El filtro de consultas sigue activo. |
| Pruebas | PASS | Histórico. API 17/17, incluida `sidinacc-reader-permissions.test.js`. Web 8/8. Lint y build en 0. |
| Datos | PASS | Histórico, con un principal que veía más catálogo. 15 tablas, 3 filas en `CAF_CAT_SEXO`, 4708 en `CAF_PERSONA`, 10 migraciones. Las 1305 columnas y las 47 tablas de `SIA_CENCINAI` no las reproducen las cuentas de aplicación; ver la sección siguiente. |

`readOnly` es la sonda de permisos del login. `writeFilterEnabled` solo describe el filtro del adaptador.

El texto original de esta sección atribuía revisiones independientes a aquella corrida. Esta comprobación no las repite. La suite actual no retira `__sia_reader_create_probe`: ya no crea esa tabla. Las revisiones de la separación de cuentas están en la sección siguiente.

## Cuentas separadas y suite sin credencial de despliegue — 2026-11-06

`apps/api/.env` usa `sia_cencinai_app` para `SIA_CENCINAI` y `sia_sidinacc_app` para `SIDINACC_LOCAL`. `sameDatabaseUser` es `false`. El archivo sigue ignorado por Git. La suite `sidinacc-reader-permissions.test.js` ya no abre un pool administrativo, no se conecta a `master` para preparar datos y no crea tablas. Las comprobaciones de DDL usan permisos efectivos. Las escrituras de prueba llevan `WHERE 1 = 0` y el motor las rechaza con el error 229. El acceso cruzado responde 916. No se ampliaron permisos.

| Check | Resultado | Evidencia |
| --- | --- | --- |
| `npm run verify:config` | PASS | `status: ok`. `sameDatabaseUser: false`. Bases `SIA_CENCINAI` y `SIDINACC_LOCAL`. |
| `npm test` | PASS | API 6 suites y 18 pruebas. Web 2 suites y 8 pruebas. Cero fallos. Jest terminó con código 0, sin `--forceExit` y sin aviso de recursos abiertos. La corrida focalizada usó `--detectOpenHandles` y tampoco reportó handles. Tras ajustar el predicado que omite la suite, la prueba de permisos volvió a pasar 2/2 y QA independiente repitió `npm test` con el mismo 18/18 y 8/8. |
| `npm run lint` | PASS | ESLint sin avisos. |
| `npm run build` | PASS | Vite 8.3.6. Salida en `apps/web/dist`. |
| Node y npm | PASS | Node.js 24.20.0 y npm 11.19.0. Compatibles con `engines` (`node >= 22`, `npm >= 10`). |
| Lockfile | PASS | No se modificó `package-lock.json` ni se actualizaron paquetes. |
| `npm audit` | PASS_WITH_NOTES | 19 avisos: 3 bajos y 16 moderados, todos en el árbol de Jest. El arreglo forzado bajaría Jest a 25. No se aplicó. |
| `npm outdated` | PASS_WITH_NOTES | ESLint 10 está publicado. La versión fijada sigue en 9.39.5 porque `eslint-plugin-react` no la declara. No se actualizó. |
| `/health` | PASS | HTTP 200. `{"status":"ok","service":"sia-cencinai-api","environment":"development"}`. |
| `/ready` | PASS | HTTP 200. `sia` `up` en `SIA_CENCINAI`. `sidinacc` `up`, `readOnly: true`. CORS `http://127.0.0.1:5174`. |
| Web | PASS | `http://127.0.0.1:5174/` mostró el título, el ambiente Desarrollo y «API en ejecución y dependencias disponibles». «Volver a comprobar» volvió a ese estado. |
| Puertos | PASS | Tras `npm run stop` no quedó listener en 3001 ni 5174. 1433 sigue siendo `sidinacc-local-sql`. 5173 no estaba en escucha y no se detuvo ningún Vite ajeno. El cierre del proceso de desarrollo fue intencional y terminó con código 0. |
| Secretos | PASS | `.env` no está en Git. Las respuestas, el log de arranque y este informe no contienen contraseñas. |
| Agentes | PASS | `scripts/validate-agent-infrastructure.ps1`: 10 reglas, 11 agentes, 15 skills. El descubrimiento dentro de Cursor queda NOT_RUN. |

### Permisos efectivos

`sia_sidinacc_app` entra a `SIDINACC_LOCAL`. No pertenece a roles fijos de servidor. En el servidor solo tiene `CONNECT SQL` y `VIEW ANY DATABASE`, este último heredado de `public`. Su único rol de base directo es `sia_sidinacc_reader_role`, que le da `db_datareader`. `SELECT` sobre `dbo.CAF_CAT_SEXO` es 1. `INSERT`, `UPDATE`, `DELETE` y `ALTER` son 0 y las tres sentencias con `WHERE 1 = 0` fallan con 229. `CREATE TABLE` es 0. `HAS_DBACCESS('SIA_CENCINAI')` es 0. La consulta de tres partes y la conexión a esa base se rechazan (916 y `ELOGIN`).

`sia_cencinai_app` entra a `SIA_CENCINAI` como usuario del mismo nombre. No es `sysadmin` ni miembro de `db_owner`, `db_datawriter`, `db_ddladmin`, `db_datareader` ni de los roles funcionales del expediente. No ejecuta `ops.cerrar_caso`. El permiso de base es `CONNECT`, más las dos vistas de claves de cifrado que `public` ya trae. El único objeto visible es `dbo.schema_migracion`, con `SELECT` y sin `INSERT`, `UPDATE`, `DELETE` ni `ALTER`. Esas tres sentencias fallan con 229. `HAS_DBACCESS('SIDINACC_LOCAL')` es 0. La consulta de tres partes y la conexión a la réplica se rechazan. La sonda del gateway informa `readOnly: true`.

`VIEW ANY DATABASE` y la entrada a `master` como `guest` son el predeterminado del motor. No se revocaron: afectan a `public` y no conceden acceso a la otra base. No se otorgó escritura funcional.

### Bases, solo lectura

| Dato | Antes de la corrección | Después de las pruebas |
| --- | ---: | ---: |
| Tablas de `SIDINACC_LOCAL` | 15 | 15 |
| Columnas de esas tablas | 82 | 82 |
| Claves foráneas, deshabilitadas, sin confianza | 18, 0, 0 | 18, 0, 0 |
| `CAF_CAT_SEXO` | 3 | 3 |
| `CAF_PERSONA` | 4708 | 4708 |
| Regiones, oficinas, establecimientos | 9, 41, 661 | 9, 41, 661 |
| Objetos de prueba en la réplica | 0 | 0 |
| Migraciones `APLICADA` visibles para `sia_cencinai_app` | 10 | 10 |
| Tablas visibles para `sia_cencinai_app` | 1 (`schema_migracion`) | 1 |
| Objetos de prueba visibles en `SIA_CENCINAI` | 0 | 0 |

Las diez migraciones siguen aplicadas, de `001_database_prerequisites` a `090_constraints_and_indexes`. No se ejecutaron migraciones ni se modificaron filas.

El informe anterior citaba 1305 columnas en `SIDINACC_LOCAL`. Esa cifra no se reproduce: `sys.columns` unido a las 15 tablas da 82, `INFORMATION_SCHEMA.COLUMNS` da 82 y `sys.all_columns` da 11310. Las 15 tablas del script siguen presentes y los conteos de filas que aquel informe nombraba, 3 y 4708, coinciden. No hay señal de tablas eliminadas.

`sia_cencinai_app` no puede ver las 47 tablas, las claves foráneas ni los conteos de casos y referencias. Esos datos quedan fuera de su `SELECT`. Confirmarlos exigiría un principal con más lectura. No se concedió ese permiso en esta tarea. El libro de migraciones, que sí puede leer, permanece intacto.

### Revisiones independientes

| Revisión | Resultado |
| --- | --- |
| Código | PASS_WITH_NOTES. La suite ya no usa administrador ni crea tablas. Pidió nombrar los permisos heredados de `public`. Quedó corregido en la documentación. |
| Seguridad y privacidad | PASS_WITH_NOTES. No hay `GRANT` en el diff. No ejecutó SQL. Las dos notas de redacción quedaron corregidas. |
| QA | PASS_WITH_NOTES. Repitió `npm test` con código 0. Señaló que el `DELETE` del gateway lo corta el filtro antes de SQL; el comentario de la prueba lo deja explícito. La denegación del motor sigue en el error 229. |
| Datos | PASS_WITH_NOTES. `SELECT` con las dos cuentas. 1305 columnas no se reproduce y no indica pérdida de las 15 tablas. |
| Integración | PASS_WITH_NOTES. Leyó el código. No arrancó la API. La frontera de las dos cuentas queda en la configuración y en la suite. |
| Backend | PASS_WITH_NOTES. La suite aprueba solo con las dos cuentas de aplicación. El cierre de `connect()` fallido está en la suite. El hueco de dos pools simultáneos en `sql-client.js` es anterior y no se cambió: esta corrida no lo reprodujo. |
| Documentación | CHANGES_REQUESTED, ya aplicado. Las filas de la corrida anterior quedaron marcadas como históricas y los permisos de `public` quedaron en el texto vigente. |

Ninguna revisión es aceptación humana.

### Pendiente de esta comprobación

- La escritura de expediente sigue sin asignarse a `sia_cencinai_app`.
- El recuento completo del esquema y de los datos sintéticos de `SIA_CENCINAI` no es visible para la cuenta de ejecución.
- Los avisos de `npm audit` siguen en el árbol de Jest. No justifican bajar de versión.
- `OUT_OF_SCOPE`: `getPool` no conserva el pool si `connect()` falla y dos consultas simultáneas pueden abrir dos pools. No se observó en Jest.
