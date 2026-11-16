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
5. Recorrido: Buscar persona → Nueva referencia → validar → confirmar el envío → en Oficina Local abrir Pendientes → Sesiones → asociar la referencia → valorar → decidir → abrir el caso → Casos → expediente. Atenciones y seguimiento quedan visibles; su escritura o consulta grupal depende del script `040`.

Los datos de demostración son los de `database/sia-cencinai/seeds/`. No se ejecutan al arrancar
y esta entrega no los borra ni los vuelve a cargar. Las referencias nuevas se crean por la aplicación.

El script `database/sia-cencinai/security/030_grant_process_writes_to_app.sql` ya fue aplicado
manualmente en el ambiente local de desarrollo. No forma parte del arranque y no debe ejecutarse
otra vez sin una revisión de permisos. El 2026-11-16 la cuenta `sia_cencinai_app` pudo consultar
sesiones (2883 filas), insertarlas según el permiso, leer el instrumento vigente (1 versión,
2 categorías, 2 factores) y la matriz RN-009 (9 combinaciones). La creación de sesiones ya había
sido probada desde la aplicación.

Sigue sin concederse, y por eso no se simula un cero:

- `INSERT` en `dbo.ate_individual`.
- `SELECT` e `INSERT` de la atención grupal.
- `UPDATE` de `dbo.caso_plan` para cerrar la versión vigente.
- `SELECT` de programación, documentos y coordinaciones.

El script preparado, y no ejecutado, es
`database/sia-cencinai/security/040_grant_attention_and_plan_versions_to_app.sql`.
No es una migración de esquema. No concede borrado ni un rol amplio.

Si el instrumento, las disciplinas o las estrategias no están en el catálogo vigente, la pantalla
lo dice y no inventa factores ni opciones. La semilla sintética trae valores marcados como sintéticos.
La clasificación entre atención grupal de A.I. y sesiones educativas generales sigue `NEEDS_VALIDATION`.

## Historias de este lote

| HU | Estado | Evidencia | Dependencia o bloqueo |
| --- | --- | --- | --- |
| HU-001 | Implementada | `GET /api/proceso/resumen`. Inicio de Establecimiento muestra referencias y personas con caso del ámbito | Posibles referencias no están en este lote |
| HU-002 | Parcial | Inicio de Oficina Local: 13 pendientes, 22 casos activos, sesión próxima real y 80 atenciones individuales del ámbito | Posibles referencias siguen `NO_DISPONIBLE`. Actividades vencidas quedan bloqueadas hasta el script `040`. Resolverlas como realizada, reprogramada o cancelada no está implementado |
| HU-005 a HU-009 | Implementada | APIs institucionales ya existentes y pantalla Buscar persona | Réplica `SIDINACC_LOCAL` y periodo configurado |
| HU-013 a HU-014 | Implementada | `POST /api/references/validation`, `POST /api/references`, borradores y plantilla | Catálogo de motivos ya sembrado |
| HU-015 a HU-017 | Implementada | Listado, detalle y documento de referencia | El diseño documental de la impresión sigue el pendiente previo |
| HU-018 | Implementada | Bandeja Pendientes; el estado cambia al resolver o abrir | Mismo ámbito que referencias |
| HU-019 | Implementada | `POST/GET /api/proceso/sesiones`, disciplinas del catálogo, búsqueda y asociación de referencia o caso activo, duplicado rechazado | HU-019 no exige borrador de sesión. Las disciplinas genéricas `Otra` se excluyen |
| HU-020 | Implementada en código | `POST /api/proceso/valoraciones` y `POST /api/proceso/prioridad`. Categorías del instrumento, Ninguno exclusivo, especificación por factor, prioridad no editable | La nueva versión del plan, si el equipo la pide en la revaloración, necesita el `UPDATE` del script `040` |
| HU-021 | Implementada | `POST /api/proceso/resoluciones`. No abre el caso sola | `No requiere A.I.` exige justificación y actualiza la referencia |
| HU-022 | Parcial | `POST /api/proceso/casos`, transacción, unicidad del caso activo y auditoría | La prioridad sale de RN-009. Versionar el plan en una revaloración queda bloqueado hasta el script `040` |
| HU-023 | Implementada | `GET /api/proceso/casos` sin detalle, riesgo, protección ni exportación | Solo Establecimiento. El 2026-11-16 esa ruta respondió 200 con `detallePermitido: false` |
| HU-024 | Implementada con tope técnico | Filtros combinados, paginación y `GET /api/proceso/casos/exportacion` | La exportación devuelve el corte filtrado completo. Si supera 2000 filas, se rechaza y no se entrega una página parcial. En vivo, la Oficina Local exportó 40 filas mientras la pantalla mostraba 20 de 40 |
| HU-025 | Parcial | `GET /api/proceso/casos/:casoId` con valoración, plan, versiones, línea de tiempo y atenciones individuales | Grupales, documentos y coordinaciones informan bloqueo de permiso. Traslados y reportes no están en este incremento. Establecimiento recibe 403 |
| HU-036 | Parcial | `POST /api/atenciones/individuales` y pantalla Atenciones | El establecimiento recibe 403. Una escritura sintética de Oficina Local respondió 503 y no aumentó el conteo (4129 antes y después) porque falta `INSERT` |
| HU-037 | Parcial | `POST /api/atenciones/grupales`. Un solo registro, participantes y asistencia | Misma falta de permiso. No se admiten personas sin caso activo mientras la clasificación educativa siga `NEEDS_VALIDATION`. No hay directorio institucional de profesionales |
| HU-048 | Parcial | `GET /api/proceso/seguimiento/sin-atencion` y pantalla Sin atención | El año 2026 respondió bloqueo de permiso, no una lista vacía inventada. La consulta usa atención individual y asistencia grupal; sin leer la grupal no se publica un resultado incompleto |

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
- Aplicar manualmente el script `040` si se quiere registrar atenciones, versionar el plan y consultar seguimiento, grupales, documentos, coordinaciones y actividades vencidas.
- Clasificación de actividades educativas generales: `NEEDS_VALIDATION`.
- Directorio de profesionales distintos de la sesión actual: `NEEDS_VALIDATION`.
- Programación operativa para resolver una actividad vencida.
- Traslados y reportes internos.
- Zona horaria institucional de las fechas de resumen.

## Verificación del 2026-11-16

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
