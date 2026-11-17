# Entrega de práctica — estado funcional

Fecha de esta actualización: 2026-11-16. Responsable: Sarah Priscilla Quesada Chaves.
La verificación del 2026-11-14 queda conservada al final. No se reescribe como si no hubiera ocurrido.
La reportería Regional y Nacional está en la sección siguiente a la consulta de casos.
Las verificaciones anteriores de Oficina Local y Establecimiento se conservan.

Esta entrega no es la versión institucional definitiva ni está autorizada para producción.
La sesión productiva de SIDINACC sigue `NEEDS_VALIDATION`. En local se usa una identidad
sintética que el servidor ya asoció a un ámbito. El cliente no elige el rol.

## Cómo iniciar y demostrar

1. Tener Node.js 22 o superior y las bases locales ya migradas. No ejecutar migraciones desde la API.
2. Desde la raíz: `npm ci`. Copiar `apps/api/.env.example` a `apps/api/.env` y completar las contraseñas locales. No versionar ese archivo.
3. `npm run verify:config` y `npm run dev`. Abrir `http://127.0.0.1:5174`, no `localhost`, para que coincida el origen CORS.
4. Entrar con **Establecimiento de demostración**, **Oficina Local de demostración**, **Nivel regional, Región Central Sur**, **Nivel regional, Región Brunca** o **Nivel nacional**. Regional y Nacional consultan casos y reportería. No registran atenciones, no cierran casos y no generan el informe HU-050.
5. Recorrido: Buscar persona → Nueva referencia → validar → confirmar el envío → en Oficina Local abrir Pendientes → Sesiones → asociar la referencia → valorar → decidir → abrir el caso → Casos → expediente → Atenciones → Sin atención. En el expediente, Oficina Local registra coordinaciones, reportes y cierre. El script `050` ya fue aplicado manualmente en este desarrollo local; no volver a ejecutarlo.
6. Reportería, solo con Oficina Local de demostración: abrir Reportería, revisar las doce visualizaciones, cambiar año, estado o establecimiento y descargar la consolidación. Generar reporte abre el asistente de HU-050. Exige al menos cinco visualizaciones, un análisis redactado y un título, muestra la revisión y descarga `informe-analitico-oficina-local.html`. No descarga la consolidación ni el reporte individual.
7. Consulta Regional: entrar como Región Central Sur, abrir Casos, filtrar por Oficina Local Hatillo y abrir un expediente. La vista dice que es de solo lectura. Región Brunca sirve para comprobar que un caso de Central Sur no se abre.
8. Consulta Nacional: entrar como Nivel nacional, abrir Casos, filtrar Región y luego Oficina Local. Al cambiar la Región, la Oficina Local y el establecimiento se restablecen.
9. Reportería regional: con Región Central Sur, abrir Reportería. Deben verse las doce visualizaciones y la región de la sesión, sin selector de otra región. Filtrar Oficina Local Hatillo. La cobertura de 2026 queda en 8 de 18, igual que la Oficina Local. Descargar la consolidación `consolidacion-region.xlsx`. No aparece Generar reporte.
10. Reportería nacional: con Nivel nacional, abrir Reportería, dejar el ámbito nacional y luego elegir Región Central Sur. Ese corte coincide con el regional: cobertura 45 de 135. Al cambiar la región, la oficina y el establecimiento se limpian. Descargar `consolidacion-nacional.xlsx`.

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

## Reportería Regional y Nacional, HU-040 a HU-043, 2026-11-16

No hubo migración, script de permisos ni otro motor estadístico. Se reutilizan las doce
visualizaciones, RN-040, RF-129 y el corte de HU-038. La región de una sesión regional sale
del servidor. Nacional puede estrechar Región, Oficina Local y establecimiento, y al cambiar
un nivel superior se limpian los inferiores. La cobertura usa el numerador y el denominador
del universo consultado. No suma porcentajes regionales.

HU-050 no se extendió. Su conservación histórica sigue anclada a Oficina Local. Duplicarla
para Regional o Nacional exigía otro esquema. Queda pendiente.

| Historia | Estado | Evidencia | Pendiente |
| --- | --- | --- | --- |
| HU-040 | PASS en el alcance confirmado | Doce visualizaciones, filtros y aislamiento. Año 2026 | HU-050 en este nivel |
| HU-041 | PASS en el alcance tabular | `consolidacion-region.xlsx`, 22844 bytes, mismo corte | Informe analítico distinto |
| HU-042 | PASS en el alcance confirmado | Universo nacional y desagregación jerárquica. Año 2026 | Sexo y edad si las personas superan 2000 |
| HU-043 | PASS en el alcance tabular | `consolidacion-nacional.xlsx`, 46218 bytes | El mismo límite de 2000 filas de casos sin atención |

Contraste del 2026-11-16, año 2026. La prueba SQL comprobó el denominador de casos activos
distintos. La API de Regional filtrada a Hatillo coincidió con Oficina Local.

| Corte | D | N | Personas únicas | Atenciones | Individuales | Grupales | Referencias |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Región 1, Central Sur | 135 | 45 | 61 | 89 | 81 | 8 | 150 |
| Región 5, Brunca | 130 | 46 | 64 | 87 | 78 | 9 | 156 |
| Nacional | 1009 | 333 | 407 | 655 | 620 | 35 | 1158 |
| Nacional filtrado a región 1 | 135 | 45 | 61 | 89 | | | |
| Región 1 filtrada a oficina 101 | 18 | 8 | 15 | 17 | 13 | 4 | 25 |
| Oficina Local 101, ruta propia | 18 | 8 | 15 | 17 | 13 | 4 | 25 |

Una región no puede enviar `regionId`. Esa consulta respondió 400 y no leyó el corte.
Región en `/api/reporteria/oficina` respondió 403. Nacional con región 1 y oficina 501
respondió 400. Establecimiento en `/api/reporteria/consulta` respondió 403.
No hay ruta de escritura en la consulta superior: un POST respondió 404.
El asistente quedó `disponible: false` en Regional y Nacional, y `true` en Oficina Local.

Filtros de Regional: año, Oficina Local, establecimiento, estado, prioridad, disciplina,
profesional, sexo y edad. La región se muestra y no se elige.
Filtros de Nacional: los mismos, más la región. Oficina y establecimiento esperan el nivel anterior.

No se modificó RN-040, la zona `America/Costa_Rica`, `SIDINACC_LOCAL`, las semillas ni las
rutas operativas de Oficina Local.

El mismo día, `npm run verify:config`, `npm run lint`, `npm test`, `npm run build` y
`npm run health` terminaron sin error. La API reportó 206 pruebas aprobadas y 7 omitidas.
La web reportó 15 pruebas aprobadas. `/ready` quedó en `ready`, con `SIDINACC_LOCAL` en
solo lectura. En el navegador, Región Central Sur mostró 45 de 135 y, al filtrar Hatillo,
8 de 18. Nacional mostró 333 de 1009; al elegir Central Sur coincidió con la región, y al
pasar a Brunca la oficina quedó vacía y la cobertura pasó a 46 de 130.

## Consulta Regional y Nacional, HU-032 a HU-035, 2026-11-16

No hubo migración ni script de permisos. La sesión productiva de SIDINACC sigue `NEEDS_VALIDATION`.
Las identidades `dev-region-central-sur` (región 1), `dev-region-brunca` (región 5) y `dev-nacional`
ya existían en el registro de desarrollo. Este incremento habilita su consulta de casos.
No se añadieron credenciales reales.

| Historia | Estado | Evidencia | Pendiente |
| --- | --- | --- | --- |
| HU-032 | PASS | API, SQL y navegador | Ninguno funcional de este alcance |
| HU-033 | PARTIAL | API, SQL de ámbito y navegador | Texto clínico y permisos sensibles, `NEEDS_VALIDATION` |
| HU-034 | PASS | API, SQL y navegador | Ninguno funcional de este alcance |
| HU-035 | PARTIAL | API y navegador | El mismo recorte de HU-033 |

Contraste de solo lectura contra `dbo.caso_lista_establecimiento`, 2026-11-16:

| Corte | SQL | API |
| --- | ---: | ---: |
| Región 1, Central Sur | 259 | 259 |
| Región 5, Brunca | 220 | 220 |
| Nacional | 1793 | 1793 |
| Región 1, activo y prioridad Alto | 39 | 39, y la exportación tuvo 39 filas |
| Oficina Local 101, Hatillo, dentro de la región 1 | 40 | 40 |

El filtro regional por el establecimiento 1100102 y la lista del perfil Establecimiento
devolvieron 6 casos cada una. Ese corte no se contrastó con una consulta SQL aparte.

La exportación regional rechazó `regionId=5` con 403 y no entregó archivo.
La paginación con tamaño 1 devolvió el total completo, no el tamaño de la página.
Una combinación Región 1 con Oficina Local 501 respondió 400.
El expediente de otra región respondió 404. Nacional y Regional recibieron `modo: CONSULTA`.
Abrir caso, registrar atención y cerrar caso respondieron 403 en el servidor.
Oficina Local de Hatillo siguió en 40 casos. Establecimiento no pudo exportar.

El expediente superior muestra identificador, consecutivo, establecimiento, oficina, región,
apertura, estado, prioridad, frecuencia, estrategias y disciplinas de catálogo, y la línea de
tiempo por tipo de evento y fecha. No muestra factores, riesgo, protección, contacto, notas,
acciones, recomendaciones ni propósitos en texto libre. Esos campos siguen `NEEDS_VALIDATION`.

No se modificó RN-040, la zona `America/Costa_Rica`, las semillas de demostración ni los
flujos ya verificados de referencia, sesión, atención, cierre, programación o reportería.

El 2026-11-16, después del cambio, `npm run verify:config`, `npm run lint`, `npm test`,
`npm run build` y `npm run health` terminaron sin error. La API reportó 202 pruebas aprobadas
y 7 omitidas en 2 suites. La web reportó 14 pruebas aprobadas. `/ready` quedó en `ready`,
con `SIDINACC_LOCAL` en solo lectura. El límite de exportación sigue en 2000 filas: si el
corte lo supera, la API rechaza la salida y no entrega una página parcial.

## Historias de este lote

| HU | Estado | Evidencia | Dependencia o bloqueo |
| --- | --- | --- | --- |
| HU-001 | Implementada | `GET /api/proceso/resumen`. Inicio de Establecimiento muestra referencias y personas con caso del ámbito | Posibles referencias no están en este lote |
| HU-002 | Parcial | Inicio de Oficina Local, 2026-11-16 por la noche: alerta «Vencida» con texto y color, 6 actividades, enlace a Programación, 4 próximas acciones y apertura del caso 10089. El conteo siguió en 6 después de crear y resolver actividades futuras | La detección automática sigue `NEEDS_VALIDATION`. No se resolvieron las seis vencidas de la semilla. La zona horaria institucional sigue pendiente |
| HU-044 | Verificada en el alcance confirmado | Alta, realizada, reprogramada y cancelada persistidas en SQL el 2026-11-16 por la noche. Actividades 10033 a 10039. Historial, personas, idempotencia y concurrencia comprobados. El navegador creó la 10039 y, tras recargar, la marcó realizada | Una reprogramada no vuelve a `PROGRAMADA`: `NEEDS_VALIDATION`. La etiqueta vigente del catálogo es «Visita a establecimiento de A.I.» y no se sustituyó. HU-045 y HU-046 no entran en este ciclo |
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
| HU-038 | Implementada en el alcance confirmado | Las doce visualizaciones, filtros, cobertura, ámbito y el asistente de CA-21. Oficina 101, año 2026: 15 personas únicas, 17 atenciones y cobertura 8 de 18 (44.4 %). La fecha local de consulta quedó 2026-11-16 | RN-040 sigue pendiente de ratificación con Alina. La atención individual no tiene `TIPO_ATENCION` |
| HU-039 | Implementada en el alcance tabular | `GET /api/reporteria/oficina/consolidacion` entrega el corte filtrado en columnas. Con estado Cerrado conservó D 18 y N 8. No descarga una página parcial | El informe analítico es otro archivo y otro endpoint |
| HU-050 | Implementada en Oficina Local | CA-01 a CA-10 en ese ámbito. El informe 10005 quedó en SQL y se relee desde su instantánea. El navegador registró el 10008 | El formato definitivo sigue pendiente. Regional y Nacional no reciben la ruta |

Quedan fuera de este avance, sin cifras ficticias: HU-003, HU-004, HU-040 a HU-043,
HU-045, HU-046, reportería regional y nacional y las posibles
referencias automáticas. El incremento posterior del 2026-11-16 cubre
HU-040 a HU-043; esa sección no reescribe este lote.

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
- `GET /api/programacion/catalogos`, `GET /api/programacion/actividades`
- `POST /api/programacion/actividades`, `POST /api/programacion/actividades/:actividadId/resoluciones`
- `GET /api/reporteria/oficina`, `GET /api/reporteria/oficina/consolidacion`
- `POST /api/reporteria/oficina/informe`, `GET /api/reporteria/oficina/informe/:informeId`

## Pantallas

Inicio, Buscar persona, Nueva referencia, Referencias, Pendientes, Sesiones, Casos,
Atenciones, Sin atención, Programación y Reportería. El expediente de Oficina Local
incluye coordinación, reporte y cierre. Establecimiento no ve Sesiones, Atenciones,
Sin atención, Programación, Reportería ni el expediente.

## Pendientes

- Autenticación productiva SIDINACC: `NEEDS_VALIDATION`.
- Nombres institucionales definitivos de disciplinas, estrategias, tipos y factores. Hoy solo se usan filas ya almacenadas.
- El script `040` ya está aplicado en este desarrollo local. No volver a ejecutarlo sin revisar permisos.
- Clasificación de actividades educativas generales: `NEEDS_VALIDATION`.
- Directorio de profesionales distintos de la sesión actual: `NEEDS_VALIDATION`.
- El script `050` ya está aplicado en este desarrollo local. No volver a ejecutarlo. No concede `DELETE` sobre casos ni `INSERT` directo sobre `caso_cierre`; el cierre entra por `ops.cerrar_caso`.
- El script `060` ya está aplicado en este desarrollo local. No volver a ejecutarlo. Permite insertar la actividad, el cambio y la persona, y actualizar `fecha_vigente`, `estado` y `motivo_vigente`. No concede `DELETE` ni cambia `fecha_prevista`.
- Las seis actividades vencidas de la semilla, 1, 597, 602, 625, 672 y 677, siguen programadas. No se usaron para demostrar la resolución.
- Catálogos vigentes de institución y estado de coordinación, y plantilla oficial del reporte: `NEEDS_VALIDATION`. Por eso HU-030 no queda completa.
- No se preparó un índice único de `aud_evento.codigo_cambio`. La concurrencia observada dejó una sola auditoría. Un plan que no tome el bloqueo de rango no se observó.
- La zona horaria operativa usada para la fecha calendario es `America/Costa_Rica`. La zona institucional definitiva sigue `NEEDS_VALIDATION`. No se reescribieron fechas almacenadas.
- RN-040 y RF-129 siguen `NEEDS_VALIDATION` hasta la ratificación con Alina. La fórmula operativa ya se calcula y se identifica como provisional.
- El formato definitivo del informe de HU-050 sigue `NEEDS_VALIDATION`. La salida actual es HTML provisional.
- La migración `071` y el permiso `070` del informe ya fueron aplicados manualmente. No volver a ejecutarlos. La cuenta puede leer e insertar `inf_informe`, `inf_visualizacion` e `inf_agregado`. No puede actualizar ni borrar.
- La atención individual no tiene tipo institucional. La visualización 8 no le asigna uno.
- `ate_grupal` no tiene región. La grupal se limita por la oficina de la sesión.
- RF-083 nombra un filtro de tipo de atención. No se agregó como control: solo aplica a la visualización 8 y la atención individual no es clasificable.
- No se preparó un script de permisos para reportería. La cuenta ya podía leer el corte.

## Validación de programación posterior al script 060, 2026-11-16

Los scripts `030`, `040`, `050` y `060` no se volvieron a ejecutar. No se borraron filas
ni se reiniciaron las bases. `SIA_CENCINAI` y `SIDINACC_LOCAL` respondieron en
`127.0.0.1:1433`. La réplica siguió en solo lectura: un intento de escritura fue
rechazado por el filtro antes de llegar al motor. La cuenta de aplicación no es
`sysadmin`, `db_owner`, `db_datawriter` ni `db_datareader`. Puede insertar
`prog_actividad`, `prog_cambio` y `prog_persona`, y actualizar `estado`,
`fecha_vigente` y `motivo_vigente`. No puede borrar la actividad ni cambiar
`fecha_prevista` o el título.

Antes de escribir: 943 actividades, 380 cambios y 931 personas. La oficina 101 tenía
19 actividades y 6 vencidas. Después: 950, 392 y 934. La oficina quedó en 26 y las
vencidas siguieron en 6. Las originales 1, 597, 602, 625, 672 y 677 permanecen
`PROGRAMADA` con su fecha vigente. El caso 89, del establecimiento 1010321, solo se
asoció; no se modificó. Los casos reservados de demostración no se usaron.

| Flujo | Estado | Evidencia SQL/API/navegador | Pendiente |
| --- | --- | --- | --- |
| Crear actividad | PASS | API 201 para 10033, caso 89, estado `PROGRAMADA`. Reintento 200 de la misma clave. El navegador creó 10039; al recargar seguía en la lista | Ninguno de este flujo |
| Marcar realizada | PASS | 10034 y 10039 pasaron a `REALIZADA`. La fecha prevista se conservó. Hay dos cambios y una auditoría. Otro efecto respondió 409. El navegador mostró el estado al recargar la lista | Ninguno de este flujo |
| Reprogramar | PASS | 10035 conservó `fecha_prevista` 2026-12-22 y quedó `fecha_vigente` 2027-01-20, con motivo e historial. No entra en vencidas. Volver a realizada respondió 409 | Volver de reprogramada a programada sigue `NEEDS_VALIDATION` |
| Cancelar | PASS | 10036 quedó `CANCELADA` con motivo, sin borrarse. El filtro del navegador mostró 4 de 26 e incluyó esa fila. Una resolución posterior respondió 409 | Ninguno de este flujo |
| Historial e idempotencia | PASS | Cada clave dejó una auditoría. Dos altas simultáneas con la misma clave dejaron la 10038. Dos resoluciones simultáneas de la 10037 dejaron un estado y dos cambios. Los negativos no aumentaron los conteos | No se agregó un índice único. La prueba observada no duplicó filas |
| Inicio y vencidas | PASS | El resumen y la pantalla siguieron en 6, con el texto «Vencida». Las nuevas no entraron porque su fecha vigente es futura o su estado ya no es `PROGRAMADA`. Cuatro próximas acciones abrieron el caso 10089 | No se produjo una baja del conteo: las seis de la semilla se conservaron y una actividad nueva no admite fecha pasada |

Establecimiento recibió 403 al listar y al crear. Otra Oficina Local recibió 403 al
usar el establecimiento 1100102, no vio las actividades de validación y recibió 404
al resolver la 10033. La actividad inexistente respondió 404. Fecha inválida, fecha
pasada, título vacío, tipo no vigente, casos repetidos, territorio o estado enviados
por el cliente, persona de otra oficina y la misma fecha al reprogramar respondieron
400. La 10038 no cambió.

Se corrigieron dos defectos. El formulario anunciaba el alta aunque enviaba la
consulta: el cliente de la API espera `metodo` y `json`, y la pantalla usaba otros
nombres. Ahora el alta y la resolución usan ese contrato. El listado muestra la
cantidad filtrada respecto del total del ámbito, por ejemplo 4 de 26.

No hizo falta otro permiso ni otra migración. Una próxima acción no se convierte en
actividad. La frecuencia del plan no se consulta para crear programación. Posibles
referencias siguen sin fuente. La zona horaria institucional de la fecha de consulta
sigue pendiente: hoy la consulta usa la fecha UTC del servidor.

Al cierre, `npm run verify:config`, `npm run lint`, `npm test`, `npm run build` y
`npm run health` terminaron bien. La API sumó 161 pruebas aprobadas y 7 omitidas;
la web, 12. Salud y preparación respondieron 200, con `SIDINACC_LOCAL` en solo lectura.

HU-038 y HU-039 no forman parte de este avance de programación. La sección
siguiente, de la misma fecha, documenta la reportería que sí se incorporó después.

## Reportería de Oficina Local, 2026-11-16

No se ejecutaron los scripts `030`, `040`, `050` ni `060`. No se borraron
registros ni se modificó `SIDINACC_LOCAL`. No hizo falta un permiso nuevo:
la cuenta de aplicación ya podía leer las tablas del corte.

La actividad 10037 sigue en `REALIZADA` y tiene dos cambios. El primero pasa
de sin estado a `PROGRAMADA`, con auditoría `CREAR` sobre `prog_actividad` y
clave `val-prog-e-crear-01`. El segundo pasa de `PROGRAMADA` a `REALIZADA`,
con auditoría `REALIZADA` sobre `prog_resolucion` y clave `val-prog-e-real-01`.
No son dos resoluciones. No se cambió Programación. Las actividades 1, 597,
602, 625, 672 y 677 siguen `PROGRAMADA`. El inicio de Oficina Local seguía
en 6 vencidas.

El corte de la oficina 101 y la región 1, año 2026, mostró 15 personas únicas
atendidas y 17 atenciones: 13 individuales y 4 grupales. La cobertura quedó
en 8 de 18, 44.4 %. Las referencias del año fueron 25 enviadas, 10 analizadas,
8 admitidas y 2 que no requieren Atención Interdisciplinaria. Diez casos
activos no tuvieron atención efectiva en el año. Las doce visualizaciones
respondieron con datos. La 8 muestra el tipo grupal vigente y deja aparte las
13 individuales. Los cierres del año separan satisfactorio 2, traslado 2 y
otro 1.

El filtro Cerrado dejó la visualización 5 en 22 casos y la cobertura siguió
en 8 de 18, tanto en pantalla como en el libro. El año 2000 informó ausencia
de registros en motivos y atenciones; la cobertura quedó en 0 de 18, con
numerador cero y denominador conservado. El establecimiento 1011009 mostró
una sola barra. En este ámbito cada establecimiento listado tiene al menos
un caso; la prueba automatizada cubre el establecimiento sin casos.

La descarga `consolidacion-oficina-local.xlsx` usa el mismo corte y no entrega
un archivo parcial. Con estado Cerrado conservó D 18, N 8, 15 personas y 17
atenciones. Incluye corte, indicadores, las doce visualizaciones y los casos
sin atención. Establecimiento y Región recibieron 403. Un parámetro de otra
oficina recibió 400. El menú de Establecimiento no incluye Reportería.
Generar reporte abre el aviso de HU-050 / CU-38 y no descarga la consolidación
ni el reporte individual del caso.

HU-038 queda parcial por el asistente de CA-21. HU-039 queda implementada en
la consolidación tabular. RN-040 sigue `NEEDS_VALIDATION`.

Al cierre, `npm run verify:config`, `npm run lint`, `npm test`, `npm run build`
y `npm run health` terminaron bien. La API sumó 184 pruebas aprobadas, 7
omitidas y 2 suites omitidas que ya existían. La web sumó 13. Salud y
preparación respondieron 200, con `SIDINACC_LOCAL` en solo lectura.
Esa comprobación es anterior al asistente. El resultado posterior está en
«Informe analítico HU-050».

## Informe analítico HU-050, 2026-11-16

La fecha de consulta que esa tarde apareció como 2026-11-17 se calculaba con
UTC. La presentación de la fecha calendario usa ahora `America/Costa_Rica`
(`UTC-6`, sin horario de verano) mediante `FechaCalendarioLocal` y
`FechaHoraLocal`. El mismo criterio quedó en «hoy» de programación, proceso y
cierre, para no adelantar ni atrasar el día. Las fechas ya almacenadas no se
convirtieron. `corte_en` y `generado_en` siguen siendo el instante UTC. La
zona institucional definitiva permanece `NEEDS_VALIDATION`.

Generar reporte abre el asistente. En el navegador, con Oficina Local, cuatro
visualizaciones dejaron Siguiente bloqueado y cinco lo habilitaron. El análisis
vacío no avanzó. Anterior y Siguiente conservaron el texto. El título vacío no
avanzó. La revisión mostró el título, `dev-oficina-hatillo`, Oficina Local, el
período 2026, la fecha 2026-11-16 y los cinco análisis. Confirmar descargó
`informe-analitico-oficina-local.html`, con las categorías del corte (entre
ellas Colonia 15 de Setiembre) y el análisis inmediatamente después. No es el
libro de HU-039 ni el reporte individual de HU-030. El formato HTML es
provisional: el proyecto no tiene una biblioteca PDF y la especificación no
obliga a PDF.

El cuerpo solo acepta título, clave de operación, huella del corte y el número
con su análisis. La identidad, el ámbito y las cifras salen del servidor. Un
cambio de filtro descarta la selección para no mezclar cortes. Regional,
Nacional y Establecimiento recibieron 403 en `POST /api/reporteria/oficina/informe`.
Una oficina enviada en la consulta recibió 400. El menú de Establecimiento no
incluye Reportería. El año 2000 dejó los eventos sin registros y la cobertura
en 0 de 18, con denominador conservado. Un análisis con `<script>` salió
escapado. El denominador cero, «Sin casos activos. No aplica.», quedó cubierto
por la prueba automatizada; esta oficina tiene 18 casos activos.

CA-09 no está completo. `schema_migracion` tiene `070_documents_and_reporting`,
así que las tablas `inf_informe`, `inf_visualizacion` e `inf_agregado` ya
existen. La cuenta `sia_cencinai_app` no puede leerlas ni escribirlas: la
respuesta fue `PENDIENTE_PERMISO` y el archivo lo dice. No se ejecutó
`database/sia-cencinai/security/070_grant_analytical_report_to_app.sql` ni
`database/sia-cencinai/migrations/071_informe_clave_unica.sql`. El reintento
sin duplicar está probado con un repositorio simulado, no contra SQL. No hay
una fila histórica que se pueda reabrir.

Al cierre de este incremento, `npm run verify:config`, `npm run lint`,
`npm test`, `npm run build` y `npm run health` terminaron bien. La API sumó
195 pruebas aprobadas y 7 omitidas; las 2 suites omitidas ya existían. La web
sumó 14. Salud y preparación respondieron 200, con `SIDINACC_LOCAL` en solo
lectura. No se ejecutaron los scripts `030`, `040`, `050` ni `060`, ni se
modificaron los datos sintéticos de demostración.
Esa comprobación es anterior al permiso de escritura. La conservación real está
en «Conservación histórica del informe».

## Conservación histórica del informe, 2026-11-16

La migración `071` y `security/070_grant_analytical_report_to_app.sql` ya
estaban aplicadas. No se volvieron a ejecutar, ni los scripts `030`, `040`,
`050` o `060`. `SIA_CENCINAI` respondió. `SIDINACC_LOCAL` rechazó una escritura
en el filtro de solo lectura, antes de llegar al motor. El índice
`UQ_inf_informe_clave` está único, activo y filtrado. `INSERT` y `SELECT`
responden permitido en las tres tablas del informe. `UPDATE` y `DELETE` sobre
`inf_informe` devolvieron el error 229.

Al empezar había 10 informes. No se modificaron. Esta validación agregó tres.

El informe 10005, título «Validacion historica HU-050 2026-11-16», oficina 101,
región 1, período 2026, responsable `dev-oficina-hatillo`. El resumen guardó
la hora local `2026-11-16T19:05:22` y el instante UTC `2026-11-17T01:05:23`.
Cinco visualizaciones, en el orden 1 a 5, con su análisis. La primera tiene 15
agregados; la mayor categoría persistida es Colonia 15 de Setiembre con 8, la
misma cifra del HTML. El reintento con otro título y otro análisis respondió
200, el mismo identificador, el texto original y una sola fila.

Dos solicitudes simultáneas con la clave `validacion-hu050-20261116-b`
devolvieron el informe 10006. Quedó una fila. El valor de identidad 10007 no
existe: lo consumió la transacción revertida por el índice único. No hay
visualizaciones ni agregados huérfanos.

`GET /api/reporteria/oficina/informe/10005` reconstruye el HTML desde las
tablas, con `X-Origen-Informe: INSTANTANEA` y sin volver a calcular el corte.
La oficina 501 recibió 404. Establecimiento recibió 403. Un cuerpo con
responsable falso recibió 400.

En el navegador, el asistente descargó el informe 10008 y mostró «El informe
quedó registrado con el identificador 10008». El encabezado fue `REGISTRADO`,
no `PENDIENTE_PERMISO`. La fecha del corte siguió en 2026-11-16. La
consolidación de HU-039 respondió 200 con el libro de 19467 bytes.

Al cierre, `npm run verify:config`, `npm run lint`, `npm test`, `npm run build`
y `npm run health` terminaron bien. La API sumó 196 pruebas aprobadas y 7
omitidas; las 2 suites omitidas ya existían. La web sumó 14. Salud y
preparación respondieron 200, con `SIDINACC_LOCAL` en solo lectura.

## Programación operativa, 2026-11-16

No se ejecutaron los scripts `030`, `040`, `050` ni `060`. No se borraron actividades
ni se resolvió la programación vencida de la semilla.

La consulta de Oficina Local devolvió 19 actividades. Seis siguen `PROGRAMADA` con
fecha vigente anterior al 2026-11-16 y la API las marca `vencida` con el texto
«Vencida». Una reprogramada no entra en ese conteo. El establecimiento recibió 403.
Cuatro próximas acciones salen de la última atención individual que tiene acción y
fecha. La frecuencia del plan no se consulta ni crea una fila de programación.

Crear una actividad futura respondió 503: la cuenta puede leer `prog_actividad`,
pero no insertarla ni leer `prog_cambio` o `prog_persona`. El script `060` queda
preparado y sin ejecutar. Hasta aplicarlo, realizada, reprogramada y cancelada
no persisten. La reprogramación prevista no borra la fila: actualiza la fecha
vigente y agrega el cambio. Solo una actividad `PROGRAMADA` puede cambiar. La
misma clave de operación no debe duplicar el alta ni la resolución.

En el navegador, Inicio mostró la alerta con texto y color, el acceso a Programación
y las próximas acciones. La pantalla de programación mostró las 19 actividades y
la nota de que la próxima acción no es la frecuencia del plan.

Las pruebas de este cambio: API 161 aprobadas y 7 omitidas; web 11. El lint de los
archivos nuevos no reportó errores.

`NEEDS_VALIDATION`: una actividad reprogramada no vuelve a `PROGRAMADA`. La
especificación no confirma esa transición. Tampoco se convierte sola una próxima
acción en actividad, para no duplicarla en un reintento.

HU-038 y HU-039 no forman parte de este avance.

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
