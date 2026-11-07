# Lote backend 01 — resultado

Fecha de verificación: 2026-11-06.

Resultado: `BACKEND_BATCH_01_PASS`.

El cierre aplicó, con la credencial administrativa local y solo en `SIA_CENCINAI`, el `GRANT SELECT` de `database/sia-cencinai/security/010_grant_case_list_to_app.sql`. HU-009 CA-06 y CA-07 quedaron verificados contra filas sintéticas existentes. La exportación de personas de HU-006, HU-007 y HU-008 queda `NOT_APPLICABLE_CURRENT_SCOPE`: RF-020 la deja pendiente de revisión y no es exigible desde la pantalla retirada.

## Alcance ejecutado

Historias: HU-005, HU-006, HU-007, HU-008 y HU-009. Casos de uso: CU-02 y CU-03.

Requisitos usados: RF-001, RF-008, RF-009, RF-010, RF-011, RF-012, RF-013, RF-014, RF-015, RF-016, RF-017, RF-104, RF-112, RF-113 y RF-124. RF-020 y RF-122 quedan fuera por la revisión pendiente de la exportación. No se implementaron HU-010, HU-011 ni HU-012.

No hay frontend, migraciones nuevas ni cambios de datos. El único cambio de permiso es el `SELECT` sobre `dbo.caso_lista_establecimiento` para `sia_cencinai_app`.

## Diseño

Un servicio, `createPersonQueryService`, atiende los cuatro niveles. La diferencia está en `resolveTerritorialScope` y en los predicados SQL, no en cuatro búsquedas copiadas.

Capas: rutas, validación, servicio, política territorial, presentador, adaptador SIDINACC y lector de casos. El adaptador solo lee. El período no entra en la petición. La autorización no entra en encabezados de rol.

La ubicación institucional sigue la cadena de la réplica: persona, detalle familiar del período configurado, establecimiento, Oficina Local y Región. Las personas de contexto sin familia no entran en la búsqueda.

## Archivos principales

- `apps/api/src/modules/institutional/`
- `apps/api/src/infrastructure/integrations/sidinacc-person-reader.js`
- `apps/api/src/infrastructure/integrations/sidinacc-adapter.js`
- `apps/api/src/infrastructure/persistence/case-summary-reader.js`
- `apps/api/src/infrastructure/auth/development-access.js`
- `apps/api/src/infrastructure/auth/institutional-session.js`
- `apps/api/tests/institutional-policy.test.js`
- `apps/api/tests/institutional-http.test.js`
- `apps/api/tests/institutional-live.test.js`
- `database/sia-cencinai/security/010_grant_case_list_to_app.sql`
- `docs/architecture/INSTITUTIONAL_PERSON_API.md`

## Quality gates

| Comando | Resultado |
| --- | --- |
| `npm run verify:config` | PASS. Entorno `development`, bases separadas, `sidinaccPeriodId` 2026, usuarios distintos |
| `npm test` | PASS. API 9 suites y 53 pruebas. Web 2 suites y 8 pruebas. Total 61. Sin `--forceExit` |
| `npm run lint` | PASS. ESLint sin hallazgos |
| `npm run build` | PASS. Vite, módulo web, sin errores |

Arranque local en `127.0.0.1:3001`: `/health` 200, `/ready` 200 con SIDINACC de solo lectura, búsqueda sin credencial `401`, búsqueda exacta `200` con un resultado, y cierre ordenado de las conexiones.

La suite de API no usa `--forceExit`. Las pruebas vivas cierran el pool en `afterAll`. No se desactivaron pruebas existentes.

## Trazabilidad

| HU | Criterio | Implementación | Prueba | Estado |
| --- | --- | --- | --- | --- |
| HU-005 | CA-01 Identificación en el ámbito | `person-query-service`, modo `identification` | `institutional-live` establecimiento único | PASS |
| HU-005 | CA-02 Precedencia exacta | La coincidencia exacta no continúa por nombre | `institutional-policy` | PASS |
| HU-005 | CA-03 Nombre en el ámbito | Modo `name` con el mismo ámbito | `institutional-live` Oficina Local | PASS |
| HU-005 | CA-04 Varias coincidencias distinguibles | Nombre, identificación, nacimiento, sexo y establecimiento | `institutional-policy` y página viva | PASS |
| HU-005 | CA-05 Sin personas fuera de ámbito | Política y `404` uniforme | Política, HTTP y viva | PASS |
| HU-005 | CA-06 Conteo | `result.total` y `result.returned` | Política y viva | PASS |
| HU-005 | CA-07 Varios establecimientos | Filtro solo entre los autorizados | Política y viva | PASS |
| HU-005 | CA-08 Único establecimiento | `establishmentAppliedAutomatically` | Viva | PASS |
| HU-005 | CA-09 Sin coincidencias | Mensaje y ámbito intacto | Política y viva | PASS |
| HU-005 | CA-10 Sin listado general | `q` obligatorio y página máxima 25 | Validación y viva | PASS |
| HU-006 | CA-01 Identificación | Mismo servicio, ámbito de oficina | Viva, Región y oficina | PASS |
| HU-006 | CA-02 Nombre de la oficina | Filtro `localOfficeId` del principal | Viva, `Campos` | PASS |
| HU-006 | CA-03 Otras oficinas excluidas | `403` o cero resultados | Política y viva | PASS |
| HU-006 | CA-04 Filtro de establecimiento | Predicado después de comprobar la oficina | Viva, múltiple y oficina | PASS |
| HU-006 | CA-05 Conteo | `total` respecto de la página | Viva | PASS |
| HU-006 | CA-06 Exportación pendiente | RF-020 no exigible en este lote | No hay endpoint ni pantalla sustituta | NOT_APPLICABLE_CURRENT_SCOPE |
| HU-006 | CA-07 Exportación tabular | Depende de CA-06 | No hay salida | NOT_APPLICABLE_CURRENT_SCOPE |
| HU-006 | CA-08 Sin pantalla general | Igual que HU-005 CA-10 | Validación | PASS |
| HU-007 | CA-01 a CA-03 Región | Ámbito regional fijo | Viva, Central Sur y Brunca | PASS |
| HU-007 | CA-04 y CA-05 Filtros | Oficina y establecimiento dependientes | Opciones vivas y política | PASS |
| HU-007 | CA-06 Filtros dependientes | Combinación incompatible `400` | Política y viva | PASS |
| HU-007 | CA-07 Conteo | Mismo contrato | Viva | PASS |
| HU-007 | CA-08 y CA-09 Exportación | RF-020 no exigible en este lote | No hay endpoint | NOT_APPLICABLE_CURRENT_SCOPE |
| HU-007 | CA-10 Sin pantalla general | `q` obligatorio | Validación | PASS |
| HU-008 | CA-01 y CA-02 Búsqueda nacional | Mismo servicio | Viva, dos regiones | PASS |
| HU-008 | CA-03 Sin listado masivo | Sin `q` la ruta responde `400` | HTTP | PASS |
| HU-008 | CA-04 a CA-07 Filtros y jerarquía | Política nacional | Política y viva | PASS |
| HU-008 | CA-08 Conteo | Mismo contrato | Viva | PASS |
| HU-008 | CA-09 y CA-10 Exportación | RF-020 no exigible en este lote | No hay endpoint | NOT_APPLICABLE_CURRENT_SCOPE |
| HU-008 | CA-11 Sin pantalla general | `q` obligatorio | Validación | PASS |
| HU-009 | CA-01 Identidad básica | Ficha con nombre, identificación, nacimiento, edad, sexo y establecimiento | Viva, `SYN-1100102-01` | PASS |
| HU-009 | CA-02 Ubicación y servicios | Oficina, Región y servicios del período | Viva. La modalidad queda `NEEDS_VALIDATION` | PASS |
| HU-009 | CA-03 Persona encargada | Contexto familiar cuando `CAF_MENOR` tiene fila | Viva, madre, padre y encargada distinta | PASS |
| HU-009 | CA-04 No es cliente A.I. | `contextOnly`, sin recurso propio | Política y viva: la encargada no se busca ni tiene ficha | PASS |
| HU-009 | CA-05 Procedencia | `provenance.source` y `integrationStatus` | Viva | PASS |
| HU-009 | CA-06 Estado y prioridad | Lector de `caso_lista_establecimiento` | Viva: `SYN-1100102-01`, caso `1`, `ACTIVO`, `BAJO`, apertura `2026-02-01`, cierre nulo | PASS |
| HU-009 | CA-07 Sin caso visible | Arreglo vacío y mensaje | Viva: `SYN-1100102-04` en el establecimiento 1100102. El doble de `institutional-policy` se conserva | PASS |
| HU-009 | CA-08 Sin gestión interna | SQL y DTO sin riesgo, factores, plan ni atenciones | Política y claves de la ficha viva | PASS |
| HU-009 | CA-09 Sin pantalla general | Consulta por identificador ya acotado | HTTP y viva | PASS |

## Seguridad comprobada

- Sin credencial y con credencial desconocida.
- Encabezados de rol o establecimiento ignorados.
- Filtros fuera de ámbito en `403`, sin devolver la persona.
- Persona fuera de ámbito y persona inexistente comparten `404`.
- El criterio `SYN-1100102-01' OR '1'='1` no cambia el conteo de `CAF_PERSONA` y la consulta siguiente sigue encontrando el registro.
- Las sentencias del adaptador SIDINACC pasan el filtro de una sola lectura. El pool de SIA no aplica ese filtro. La sentencia de la vista es un `SELECT` parametrizado y `institutional-policy` la pasa por `assertInstitutionalRead`.
- Las conexiones siguen separadas. La ficha lee la vista con `sia_cencinai_app`. La credencial administrativa solo aplicó el `GRANT` y no queda en la API.
- Los registros de error no incluyen la contraseña. La respuesta `503` no incluye el código del driver.

## Permiso SQL

Ejecución local, 2026-11-06, con el principal administrativo del contenedor `sidinacc-local-sql`, sobre `SIA_CENCINAI` únicamente. La API no ejecutó el script.

Objeto y cuenta: `GRANT SELECT ON dbo.caso_lista_establecimiento TO sia_cencinai_app`.

La vista está enlazada al esquema, su propietario es `dbo` y sus columnas son `caso_id`, `per_id_persona`, `establecimiento_id`, `oficina_local_id`, `region_id`, `estado`, `prioridad_codigo`, `fecha_apertura` y `fecha_cierre`. La definición no nombra riesgo, protección, factores, plan, atenciones ni documentos. El `JOIN` a `ses_valoracion` solo aporta `prioridad_codigo`.

Permisos efectivos de `sia_cencinai_app` después del script: `CONNECT`, `SELECT` sobre `dbo.schema_migracion` y `SELECT` sobre `dbo.caso_lista_establecimiento`. `HAS_PERMS_BY_NAME` devuelve 0 para `INSERT`, `UPDATE` y `DELETE` de la vista, para `SELECT` de `ses_valoracion`, `caso_ai`, `caso_plan`, `ate_individual` y `doc_documento`, para `INSERT` de `aud_evento` y para `HAS_DBACCESS('SIDINACC_LOCAL')`. Las tablas base no aparecen en `sys.tables` para esa cuenta. `sia_sidinacc_app` sigue sin acceso a `SIA_CENCINAI`.

Conteos antes y después de las pruebas: `caso_ai` 1792, vista 1792, `schema_migracion` 10, `aud_evento` 1791, `CAF_PERSONA` 4708. No se insertó ni alteró ninguna fila.

## Pendientes

1. Sustituir las identidades sintéticas por la sesión institucional de SIDINACC. UTIC. `NEEDS_VALIDATION`.
2. Confirmar si `CAF_SERVICIO` es la modalidad que SIA debe mostrar y cuál es la zona de la edad. `NEEDS_VALIDATION`.
3. Confirmar el identificador definitivo de persona. `PER_idPersona` sigue siendo el de la réplica v0.1.
4. RF-020: exportación de personas pendiente de revisión institucional. `NOT_APPLICABLE_CURRENT_SCOPE` para este lote. No hay pantalla sustituta.
5. HU-010, HU-011 y HU-012: historial y vistas de Oficina Local, Región y Nivel Nacional sobre el caso. `OUT_OF_SCOPE`.
6. Auditoría de la consulta, RNF-003. La infraestructura actual no permite a `sia_cencinai_app` insertar en `dbo.aud_evento`. El permiso que faltaría, y que este cierre no concede, es exactamente `GRANT INSERT ON dbo.aud_evento TO sia_cencinai_app`. No se mezcló con el `SELECT` de la vista. La sesión productiva que debería quedar en `usuario` y `rol` sigue en `NEEDS_VALIDATION`.

## Revisión independiente

La revisión de este cierre, posterior al `GRANT` y a las pruebas vivas, quedó en `APROBADO_CON_NOTAS` en código y en seguridad. No hubo hallazgo bloqueante. Las notas conservadas son: el pool de SIA no usa el filtro de lectura de la réplica, aunque la sentencia de la vista sí se comprueba en la prueba de política; el `SELECT` de la vista vive fuera del libro de migraciones; RNF-003 sigue sin `INSERT` en `aud_evento`; y la vista no tiene predicado de fila, de modo que el ámbito permanece en el servicio.

## Convenciones

JavaScript del API en CommonJS, nombres de operación en el servicio y SQL institucional con columnas explícitas. No se renombraron objetos de `SIA_CENCINAI` ni de `SIDINACC_LOCAL`. Los comentarios cubren precedencia de identificación, ámbito, ubicación ambigua, procedencia familiar del contacto y el límite de la vista de casos.
