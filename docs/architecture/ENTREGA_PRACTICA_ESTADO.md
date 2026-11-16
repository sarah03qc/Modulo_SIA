# Entrega de práctica — estado funcional

Fecha de esta actualización: 2026-11-16. Responsable: Sarah Priscilla Quesada Chaves.
La verificación del 2026-11-14 queda conservada al final. No se reescribe como si no hubiera ocurrido.

Esta entrega no es la versión institucional definitiva ni está autorizada para producción.
La sesión productiva de SIDINACC sigue `NEEDS_VALIDATION`. En local se usa una identidad
sintética que el servidor ya asoció a un ámbito. El cliente no elige el rol.

## Cómo iniciar y demostrar

1. Tener Node.js 22 o superior y las bases locales ya migradas. No ejecutar migraciones desde la API.
2. Desde la raíz: `npm ci`. Copiar `apps/api/.env.example` a `apps/api/.env` y completar las contraseñas locales. No versionar ese archivo.
3. `npm run verify:config` y `npm run dev`. Abrir `http://127.0.0.1:5174`, no `localhost`, para que coincida el origen CORS.
4. Entrar con **Establecimiento de demostración** o **Oficina Local de demostración**.
5. Recorrido: Buscar persona → Nueva referencia → validar → confirmar el envío → en Oficina Local abrir Pendientes → Sesiones → asociar la referencia → valorar → decidir → abrir el caso → Casos → expediente → Atenciones → Sin atención.

Los datos de demostración son los de `database/sia-cencinai/seeds/`. No se ejecutan al arrancar
y esta entrega no los borra ni los vuelve a cargar. Las referencias nuevas se crean por la aplicación.

El script `database/sia-cencinai/security/030_grant_process_writes_to_app.sql` ya fue aplicado
manualmente en el ambiente local de desarrollo. No forma parte del arranque y no debe ejecutarse
otra vez sin una revisión de permisos. El 2026-11-16 la cuenta `sia_cencinai_app` pudo consultar
sesiones (2883 filas), insertarlas según el permiso, leer el instrumento vigente (1 versión,
2 categorías, 2 factores) y la matriz RN-009 (9 combinaciones). La creación de sesiones ya había
sido probada desde la aplicación.

El script `database/sia-cencinai/security/040_grant_attention_and_plan_versions_to_app.sql`
ya fue aplicado manualmente en el desarrollo local, después de la verificación de la mañana.
No es una migración y no debe ejecutarse otra vez sin revisar permisos. No concede borrado
ni un rol amplio. La cuenta de aplicación no es `sysadmin` ni `db_owner`.

El 2026-11-16, después de ese script, la misma cuenta pudo:

- insertar y leer `dbo.ate_individual`;
- insertar y leer la atención grupal y sus participantes;
- actualizar solo la columna `dbo.caso_plan.es_vigente`;
- leer programación, documentos y coordinaciones.

`HAS_PERMS_BY_NAME` sobre el objeto `caso_plan` sigue en cero para `UPDATE`.
El permiso es de columna. Una actualización de prueba se revirtió dentro de una transacción.

Si el instrumento, las disciplinas o las estrategias no están en el catálogo vigente, la pantalla
lo dice y no inventa factores ni opciones. La semilla sintética trae valores marcados como sintéticos.
La clasificación entre atención grupal de A.I. y sesiones educativas generales sigue `NEEDS_VALIDATION`.

## Historias de este lote

| HU | Estado | Evidencia | Dependencia o bloqueo |
| --- | --- | --- | --- |
| HU-001 | Implementada | `GET /api/proceso/resumen`. Inicio de Establecimiento muestra referencias y personas con caso del ámbito | Posibles referencias no están en este lote |
| HU-002 | Parcial | Inicio de Oficina Local, después del script `040`: 13 pendientes, 22 casos activos, 83 atenciones individuales, 6 actividades vencidas y 3 próximas acciones | Posibles referencias siguen `NO_DISPONIBLE`. Las actividades vencidas se consultan, pero resolverlas como realizada, reprogramada o cancelada no está implementado |
| HU-005 a HU-009 | Implementada | APIs institucionales ya existentes y pantalla Buscar persona | Réplica `SIDINACC_LOCAL` y periodo configurado |
| HU-013 a HU-014 | Implementada | `POST /api/references/validation`, `POST /api/references`, borradores y plantilla | Catálogo de motivos ya sembrado |
| HU-015 a HU-017 | Implementada | Listado, detalle y documento de referencia | El diseño documental de la impresión sigue el pendiente previo |
| HU-018 | Implementada | Bandeja Pendientes; el estado cambia al resolver o abrir | Mismo ámbito que referencias |
| HU-019 | Implementada | `POST/GET /api/proceso/sesiones`, disciplinas del catálogo, búsqueda y asociación de referencia o caso activo, duplicado rechazado | HU-019 no exige borrador de sesión. Las disciplinas genéricas `Otra` se excluyen |
| HU-020 | Implementada | `POST /api/proceso/valoraciones`. Ninguno no convive con factores. La revaloración del caso 1305 conservó la valoración 2170 y dejó vigente la 10161, instrumento 1 | La prioridad salió de la matriz: riesgo Moderado y protección Alta producen Moderado. No es editable |
| HU-021 | Implementada | `POST /api/proceso/resoluciones`. No abre el caso sola | `No requiere A.I.` exige justificación y actualiza la referencia |
| HU-022 | Implementada | `POST /api/proceso/casos`, transacción y unicidad del caso activo | Reabrir la referencia 2977 respondió 404 y la persona siguió con un solo caso activo. En toda la base hay 0 personas con dos activos |
| HU-023 | Implementada | `GET /api/proceso/casos` sin detalle, riesgo, protección ni exportación | Solo Establecimiento. El 2026-11-16 esa ruta respondió 200 con `detallePermitido: false` |
| HU-024 | Implementada con tope técnico | Filtros combinados, paginación y `GET /api/proceso/casos/exportacion` | La exportación devuelve el corte filtrado completo. Si supera 2000 filas, se rechaza y no se entrega una página parcial. En vivo, la Oficina Local exportó 40 filas mientras la pantalla mostraba 20 de 40 |
| HU-025 | Parcial | Expediente con valoración, plan, versiones, línea de tiempo, atenciones y participaciones. Documentos y coordinaciones responden el conteo real | Traslados y reportes internos no están en este incremento. El establecimiento no abre el expediente |
| HU-036 | Implementada | `POST /api/atenciones/individuales` y pantalla Atenciones | Atención 10172 por API y 10173 desde el navegador. La fecha real quedó distinta de la de registro. El establecimiento recibe 403 |
| HU-037 | Implementada en el alcance confirmado | Una actividad 10009, dos participantes y asistencia individual. El duplicado respondió 400 | La clasificación frente a sesiones educativas generales sigue `NEEDS_VALIDATION`. No se admite una persona sin caso activo ni hay directorio institucional de profesionales |
| HU-048 | Implementada | `GET /api/proceso/seguimiento/sin-atencion`. El total de la API coincidió con SQL: 12 y, tras la atención del navegador, 11 en pantalla | No hay umbral de inactividad. La asistencia nula no cuenta. El establecimiento recibe 403 |

Quedan fuera, sin cifras ficticias: HU-003, HU-004, reportería regional y nacional,
asistente conversacional, posibles referencias automáticas y la resolución de la programación.

## Endpoints de este incremento

- `GET/POST /api/proceso/sesiones`, `GET /api/proceso/sesiones/:id`, `POST /api/proceso/sesiones/:id/situaciones`
- `GET /api/proceso/catalogos`, `POST /api/proceso/prioridad`, `POST /api/proceso/valoraciones`
- `POST /api/proceso/resoluciones`, `POST /api/proceso/casos`
- `GET /api/proceso/casos`, `GET /api/proceso/casos/exportacion`, `GET /api/proceso/casos/:casoId`
- `GET /api/proceso/seguimiento/sin-atencion`
- `GET /api/atenciones/catalogos`, `POST /api/atenciones/individuales`, `POST /api/atenciones/grupales`
- `GET /api/proceso/resumen`, `GET /api/proceso/contexto`

## Pantallas

Inicio, Buscar persona, Nueva referencia, Referencias, Pendientes, Sesiones, Casos,
Atenciones y Sin atención. Establecimiento no ve Sesiones, Atenciones, Sin atención ni el expediente.

## Pendientes

- Autenticación productiva SIDINACC: `NEEDS_VALIDATION`.
- Nombres institucionales definitivos de disciplinas, estrategias, tipos y factores. Hoy solo se usan filas ya almacenadas.
- El script `040` ya está aplicado en este desarrollo local. No volver a ejecutarlo sin revisar permisos.
- Clasificación de actividades educativas generales: `NEEDS_VALIDATION`.
- Directorio de profesionales distintos de la sesión actual: `NEEDS_VALIDATION`.
- Programación operativa para resolver una actividad vencida.
- Traslados y reportes internos.
- Zona horaria institucional de las fechas de resumen.

## Validación posterior al script 040

El script no se volvió a ejecutar. Las escrituras usaron casos sintéticos activos de la
Oficina Local 101 y no borraron filas. `SIDINACC_LOCAL` respondió en solo lectura.

- Atención individual 10172, caso 1776: fecha real 2026-11-10 y digitación 2026-11-16.
  El establecimiento recibió 403, otra oficina 404, la fecha inválida 400 y una estrategia
  ajena 400. El navegador guardó la 10173 en el caso 1304; después de recargar, el expediente
  mostró 2026-11-12 con registro 2026-11-16.
- Actividad grupal 10009: una fila, dos participantes, una asistencia, una disciplina
  y un profesional, el de la sesión.
  Quien asistió salió del seguimiento de 2026. Quien no asistió permaneció, con última
  atención 2025-09-12. La clasificación educativa quedó `NEEDS_VALIDATION`.
- Seguimiento 2026: la API y SQL devolvieron 12. La otra oficina devolvió 23 de su ámbito
  y no incluyó estos casos. El establecimiento recibió 403. En el navegador, después de la
  atención 10173, la pantalla mostró 11 de 11 y abrió el expediente del caso elegido.
- Revaloración del caso 1305: sesión 10545, situación 10391 y valoración 10161. La 2170
  quedó histórica. Riesgo Moderado y protección Alta calcularon prioridad Moderado, igual
  que la matriz. El plan pasó de una versión vigente a la versión 2 vigente y la 1 histórica.
  La persona conservó un solo caso activo. Combinar Ninguno con factores respondió 400 y
  no agregó una valoración.
- La última atención del expediente ahora considera la asistencia grupal. El caso 1775
  quedó en 2026-11-10. El caso 5, con participación sin asistencia, sigue en
  «Sin atención registrada».
- Dos atenciones individuales de los intentos interrumpidos por el reinicio del servidor
  de desarrollo también quedaron guardadas. No se eliminaron.
- El expediente del caso 1305, abierto en el navegador, mostró la valoración anterior,
  la valoración vigente del 2026-11-16, el plan versión 1 histórico y la versión 2 vigente.
  El caso siguió activo.
- `npm run lint`, `npm test`, `npm run build`, `npm run verify:config` y `npm run health`
  pasaron después de estas correcciones. Las pruebas de API fueron 128 aprobadas y 7 omitidas
  en dos suites de escritura viva, porque `SIA_TEST_ENABLE_SQL_WRITES` no se activó.
  La web aprobó 11. `/health` y `/ready` respondieron 200, con `SIDINACC_LOCAL` en solo lectura.

## Verificación del 2026-11-16 por la mañana

Contra las bases locales, sin ejecutar migraciones ni el script `040`, y sin borrar datos:

- Lectura SQL: 1 instrumento vigente, 2 categorías, 2 factores, 9 filas de matriz y 2883 sesiones.
  Permiso de inserción de sesión: sí. Inserción individual, lectura grupal, actualización de plan
  y lectura de programación: no.
- `GET /api/proceso/sesiones` de Oficina Local: `DISPONIBLE`, 50 sesiones de ese ámbito. La tabla completa tiene 2883.
- `GET /api/proceso/resumen`: 13 referencias pendientes, 22 casos activos y atenciones individuales reales del ámbito.
- `GET /api/atenciones/catalogos`: dos disciplinas sintéticas, una estrategia y un tipo de taller. El establecimiento recibió 403.
- `POST /api/atenciones/individuales` con caso activo y catálogo vigente: 503. El conteo de `ate_individual` permaneció en 4129.
- `GET /api/proceso/seguimiento/sin-atencion?anio=2026`: bloqueado, total nulo.
- `GET /api/proceso/casos/exportacion`: 40 filas de datos, no las 20 de la primera página.
- Navegador en `http://127.0.0.1:5174`: Inicio, Atenciones, Sin atención y el expediente del caso 10089 mostraron valoración, plan, línea de tiempo y los bloqueos anteriores.
- `npm test`: 128 pruebas de API y 11 de web pasaron. Dos suites de escritura viva siguieron omitidas porque `SIA_TEST_ENABLE_SQL_WRITES` no está habilitado. `npm run lint` y `npm run build` pasaron en esta actualización.

## Verificación del 2026-11-14

El 2026-11-14 se recorrió la aplicación en `http://127.0.0.1:5174` contra las bases locales.
En ese momento el script `030` todavía no estaba aplicado.

- Establecimiento: el inicio mostró 5 referencias consultables y 2 personas con caso activo.
  Posibles referencias, actividades vencidas y próximas acciones quedaron como no disponibles.
- La búsqueda de `SYN-1100102-01` devolvió una persona sintética y su contexto.
- La validación de una referencia nueva bloqueó el envío porque esa persona ya tiene un caso activo.
  No se guardó esa referencia.
- La lista y el detalle de referencias, y la lista de casos sin botón de detalle, respondieron.
- Oficina Local: 14 pendientes, coincidentes con la bandeja, y 21 casos activos.
  Sesiones y próximas sesiones informaban que la cuenta técnica no podía consultarlas.
- `npm run verify:config`, `npm run lint`, las pruebas de API y web, y `npm run build` se ejecutaron.
  Las pruebas de escritura en vivo quedaron omitidas. El script `030` no se ejecutó ese día.
