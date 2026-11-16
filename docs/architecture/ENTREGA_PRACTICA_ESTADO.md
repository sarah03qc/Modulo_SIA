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
5. Recorrido: Buscar persona → Nueva referencia → validar → confirmar el envío → en Oficina Local abrir Pendientes → Sesiones → asociar la referencia → valorar → decidir → abrir el caso → Casos → expediente → Atenciones → Sin atención. En el expediente, Oficina Local registra coordinaciones, reportes y cierre. El script `050` ya fue aplicado manualmente en este desarrollo local; no volver a ejecutarlo.

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
| HU-002 | Parcial | Inicio de Oficina Local, después del script `040`: 13 pendientes, 83 atenciones individuales, 6 actividades vencidas y 3 próximas acciones. Tras esta validación, Inicio mostró 18 casos activos | Posibles referencias siguen `NO_DISPONIBLE`. Las actividades vencidas se consultan, pero resolverlas como realizada, reprogramada o cancelada no está implementado. Los 22 activos de la mañana bajaron a 18 por cuatro cierres sintéticos aislados |
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
| HU-025 | Implementada en el alcance confirmado | Expediente de Oficina Local con coordinaciones, reportes, cierre y traslado leídos de SQL. Los casos 1434, 1171 y 1120 siguieron consultables después del cierre. Establecimiento ve la lista y no el detalle | El establecimiento no tiene «Ver detalle». `GET` del expediente interno respondió 403. La plantilla oficial del reporte pertenece a HU-030 |
| HU-036 | Implementada | `POST /api/atenciones/individuales` y pantalla Atenciones | Atención 10172 por API y 10173 desde el navegador. La fecha real quedó distinta de la de registro. El establecimiento recibe 403 |
| HU-037 | Implementada en el alcance confirmado | Una actividad 10009, dos participantes y asistencia individual. El duplicado respondió 400 | La clasificación frente a sesiones educativas generales sigue `NEEDS_VALIDATION`. No se admite una persona sin caso activo ni hay directorio institucional de profesionales |
| HU-048 | Implementada | `GET /api/proceso/seguimiento/sin-atencion`. El total de la API coincidió con SQL: 12 y, tras la atención del navegador, 11 en pantalla. El cierre del caso 1171 dejó ese corte de 2026 en 10 | No hay umbral de inactividad. La asistencia nula no cuenta. El establecimiento recibe 403 |
| HU-027 | Implementada en el alcance confirmado | Caso 1777: coordinación persistida, consulta posterior, expediente y línea de tiempo. Reintento y ráfaga con la misma clave dejaron una auditoría. Entrada inválida 400, Establecimiento 403 y otra oficina 404. El navegador registró una coordinación y la mostró al recargar | No hay catálogo vigente de instituciones ni de estados (`NEEDS_VALIDATION`); se registra el texto |
| HU-028 | Implementada en el alcance confirmado | Caso 1120: destino 5010104, oficina 301 y región 3 leídos de la réplica. Origen `CERRADO` por Traslado, con referencia 1516 y el mismo consecutivo. No se creó caso de destino ni ingreso de continuidad. El navegador mostró el destino y el historial | HU-029 sigue retirada y no se implementa. La oficina o región enviadas por el cliente se rechazan |
| HU-030 | Parcial | Caso 1777: se conservó «Informe de avance» con su propósito y el estado siguió `ACTIVO`. La vista provisional se consultó e imprimió desde el navegador. El reintento no duplicó el metadato | No está satisfecha por completo: no se conserva el documento emitido y la plantilla oficial sigue `NEEDS_VALIDATION`. La vista se regenera con el expediente vigente |
| HU-031 | Implementada en el alcance confirmado | Caso 1434, cierre satisfactorio sin reporte previo. Caso 1377, dos cierres simultáneos y una sola fila. Caso 1171, Otro con explicación obligatoria. Otro intento con otra clave respondió 409. La atención posterior respondió 404 y no insertó fila. El expediente histórico siguió consultable | No hay regla institucional para reabrir. No se cerraron los casos de demostración 1, 5, 1092, 1304, 1305, 1435, 1775, 1776, 1817 ni 10089 |

Quedan fuera, sin cifras ficticias: HU-003, HU-004, reportería regional y nacional,
asistente conversacional, posibles referencias automáticas y la resolución de la programación.

## Endpoints de este incremento

- `GET/POST /api/proceso/sesiones`, `GET /api/proceso/sesiones/:id`, `POST /api/proceso/sesiones/:id/situaciones`
- `GET /api/proceso/catalogos`, `POST /api/proceso/prioridad`, `POST /api/proceso/valoraciones`
- `POST /api/proceso/resoluciones`, `POST /api/proceso/casos`
- `GET /api/proceso/casos`, `GET /api/proceso/casos/exportacion`, `GET /api/proceso/casos/:casoId`
- `GET /api/proceso/seguimiento/sin-atencion`
- `GET /api/atenciones/catalogos`, `POST /api/atenciones/individuales`, `POST /api/atenciones/grupales`
- `GET /api/ciclo/catalogos`, `POST /api/ciclo/coordinaciones`, `POST /api/ciclo/reportes`
- `GET /api/ciclo/casos/:casoId/vista-reporte`, `POST /api/ciclo/cierres`
- `GET /api/proceso/resumen`, `GET /api/proceso/contexto`

## Pantallas

Inicio, Buscar persona, Nueva referencia, Referencias, Pendientes, Sesiones, Casos,
Atenciones y Sin atención. El expediente de Oficina Local incluye coordinación, reporte y cierre.
Establecimiento no ve Sesiones, Atenciones, Sin atención ni el expediente.

## Pendientes

- Autenticación productiva SIDINACC: `NEEDS_VALIDATION`.
- Nombres institucionales definitivos de disciplinas, estrategias, tipos y factores. Hoy solo se usan filas ya almacenadas.
- El script `040` ya está aplicado en este desarrollo local. No volver a ejecutarlo sin revisar permisos.
- Clasificación de actividades educativas generales: `NEEDS_VALIDATION`.
- Directorio de profesionales distintos de la sesión actual: `NEEDS_VALIDATION`.
- Programación operativa para resolver una actividad vencida.
- El script `050` ya está aplicado en este desarrollo local. No volver a ejecutarlo. No concede `DELETE` sobre casos ni `INSERT` directo sobre `caso_cierre`; el cierre entra por `ops.cerrar_caso`.
- Catálogos vigentes de institución y estado de coordinación, y plantilla oficial del reporte: `NEEDS_VALIDATION`. Por eso HU-030 no queda completa.
- No se preparó un índice único de `aud_evento.codigo_cambio`. La concurrencia observada dejó una sola auditoría. Un plan que no tome el bloqueo de rango no se observó.
- Zona horaria institucional de las fechas de resumen.

## Validación posterior al script 050, 2026-11-16

Los scripts `030`, `040` y `050` no se volvieron a ejecutar. No se reinició la base ni se
borraron registros anteriores. Los casos de demostración 1, 5, 1092, 1304, 1305, 1435,
1775, 1776, 1817 y 10089 siguieron `ACTIVO`. El caso 1166 también quedó `ACTIVO`: un
traslado anterior falló antes de corregir el adaptador y no se usó para otro cierre.

La cuenta `sia_cencinai_app` pudo ejecutar `ops.cerrar_caso`, leer `caso_cierre` e insertar
coordinaciones, eventos y reportes. No pudo borrar casos. No es `sysadmin`, `db_owner`,
`db_datawriter` ni `db_datareader`. El cierre escribe por el procedimiento y el encadenamiento
de propiedad, no por `UPDATE` o `INSERT` directo de la cuenta sobre `caso_ai` o `caso_cierre`.

Casos sintéticos aislados de la Oficina Local 101:

- 1777, activo. Coordinación 2, reintento con la misma clave, ráfaga de seis solicitudes
  con una auditoría, coordinación paralela y rechazo de la misma clave en otro caso.
  Reporte «Informe de avance»; el estado siguió `ACTIVO`. El navegador registró otra
  coordinación y mostró la vista provisional, con la nota de que el reporte conservado
  no guarda el texto de la vista.
- 1434, cierre satisfactorio el 2026-11-16, sin reporte previo. La misma clave repitió
  el cierre; otra clave respondió 409. Una atención posterior respondió 404 y no agregó
  fila. Referencia y consecutivo no cambiaron. El navegador mostró el motivo, el historial
  y que el caso no admite nuevas escrituras.
- 1377, dos cierres simultáneos con la misma clave: respuestas 200 y 201, una fila de
  cierre y una auditoría.
- 1171, Otro. Sin explicación y con explicación en un motivo que no la exige respondieron
  400. Con explicación se cerró. Este caso estaba en el corte de 2026 sin atención
  individual, así que ese seguimiento pasó de 11 a 10. No se reabrió.
- 1120, traslado al establecimiento 5010104. La réplica devolvió oficina 301 y región 3.
  El origen quedó `CERRADO` por Traslado, con referencia 1516 y consecutivo
  `DNCC-DRCS-OL101-1100401-REF-001-2026`. La persona conservó un caso y una referencia.
  `casoDestinoCreado` fue falso. El navegador mostró el destino y que no se creó un caso.

Entradas inválidas respondieron 400. Establecimiento recibió 403 en el expediente y en
las escrituras. Otra Oficina Local recibió 404. Una transacción de auditoría interrumpida
no dejó la marca `INTERRUPCION-CICLO-VAL-20261116`. `UX_caso_activo` siguió sin personas
con dos casos activos.

Dos defectos quedaron corregidos. El módulo de ciclo no tomaba el adaptador que arma la
aplicación, así que un traslado con establecimiento respondía 503 aunque la réplica
estuviera disponible. Al cambiar de caso, la vista provisional anterior seguía visible y
la línea de tiempo reutilizaba claves iguales, por lo que mostraba coordinaciones de otro
caso. La vista se limpia al cambiar de caso y cada evento recibe una clave distinta.
Ambos comportamientos se revisaron de nuevo en el navegador.

Con Establecimiento de demostración, la lista mostró 6 casos del establecimiento 1100102
y no ofreció «Ver detalle», coordinaciones, línea de tiempo, reporte ni cierre.

HU-027, HU-028 y HU-031 quedan verificadas en el alcance confirmado. HU-030 permanece
parcial. HU-029 no se implementa. La sesión productiva de SIDINACC sigue
`NEEDS_VALIDATION`.

Al cierre, `npm run verify:config`, `npm run lint`, `npm test`, `npm run build` y
`npm run health` terminaron bien. La API sumó 153 pruebas aprobadas y 7 omitidas; la web,
11. Salud y preparación respondieron 200, con `SIDINACC_LOCAL` en solo lectura.

## Ciclo del expediente antes de confirmar el script 050, 2026-11-16

Esta sección conserva la evidencia anterior. En ese momento las escrituras del ciclo
seguían bloqueadas. La validación de arriba es la vigente.

No se ejecutaron de nuevo los scripts `030` ni `040`. No se creó un caso de destino
ni un ingreso de continuidad. HU-029 permanece fuera de alcance.

La cuenta técnica puede leer `doc_coordinacion` e insertar auditoría. No puede insertar
coordinaciones ni eventos, ni leer o insertar reportes, ni leer `caso_cierre`, ni ejecutar
`ops.cerrar_caso`. No es `sysadmin` ni `db_owner`. Los esquemas `dbo` y `ops` pertenecen a `dbo`,
así que el script `050` concede `EXECUTE` y las lecturas e inserciones directas, sin `UPDATE`
amplio de `caso_ai`.

El catálogo vigente de cierre tiene Cierre satisfactorio, Traslado y Otro. No hay ítems
vigentes de institución ni de estado de coordinación. Esos datos se registran como texto.

En SQL local, el índice `UX_caso_activo` existe y hay 0 personas con dos casos activos.
Una auditoría de prueba se insertó dentro de una transacción que se interrumpió; después
no quedó ninguna fila con esa marca. Coordinación, reporte y cierre devolvieron el bloqueo
de permiso y el caso de prueba siguió activo, con el mismo número de coordinaciones.
El establecimiento recibió 403 y la otra oficina 404.

En el navegador, con Oficina Local, el caso 1092 seguía activo. Registrar una coordinación
mostró que la escritura no está disponible y la lista continuó vacía. Preparar la vista del
reporte indicó que faltan reportes y cierre. Traslado mostró el destino y Otro exigió
explicación. No se confirmó un cierre.

La misma clave de operación, guardada en `aud_evento.codigo_cambio`, evita un segundo insert
si el cliente reintenta. Esa protección quedó probada con el repositorio simulado, no con
una escritura confirmada. No se intentó insertar un segundo caso activo: la cuenta no debe
recibir ese permiso solo para la prueba.

Al cierre de este incremento, `npm run lint`, `npm test`, `npm run build`,
`npm run verify:config` y `npm run health` terminaron bien. La API sumó 152 pruebas
aprobadas y 7 omitidas; la web, 11. Salud y preparación respondieron 200.

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
