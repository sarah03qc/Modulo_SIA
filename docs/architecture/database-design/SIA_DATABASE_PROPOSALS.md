# Tres arquitecturas candidatas para SIA_CENCINAI

**Estado:** PROPUESTO. Documento de comparación, conservado como fue entregado a la evaluación. No autoriza DDL.

**Nota posterior a la evaluación:** el dictamen está en `SIA_DATABASE_EVALUATION.md`. Este texto no se reescribió para favorecer una propuesta. La frase de más abajo, «Las tres cumplen los requisitos confirmados», quedó matizada por la revisión independiente: la propuesta B no cierra con un solo constraint la equivalencia entre el ancla de activo y la ausencia de cierre. El diseño seleccionado, con los cambios exigidos, está en `current/DATABASE_DESIGN_SELECTED.md`.
**Insumo:** `SIA_DATABASE_REQUIREMENTS.md`.
**Motor de comparación:** Microsoft SQL Server. Sin tablas temporales, triggers, event sourcing general, vistas materializadas ni GUID como clave por defecto.
**Independencia:** no se reutilizó un diseño anterior de base propia.

Las tres cumplen los requisitos confirmados. Difieren en cómo representan el presente, cómo conservan el pasado, cómo versionan el instrumento y cómo responden a la reportería.

Convenciones comunes, para que la comparación no dependa de renombres:

- Clave sustituta `bigint IDENTITY` en hechos propios de SIA. El volumen previsto de participaciones, factores y auditoría no justifica GUID. La clave natural institucional de persona sigue siendo `nvarchar(20)`.
- `PER_idPersona` se almacena sin FK hacia `SIDINACC_LOCAL`.
- Identificadores territoriales snapshot: `int`, alineados a `EST_idEstablecimiento`. Región y Oficina Local también `int` en SIA, aunque la réplica tenga un desajuste `tinyint`/`int`. No se copia ese desajuste.
- Fechas de hecho: `date`. Instante de registro, envío o auditoría: `datetime2(0)`.
- Textos en español: `nvarchar` con longitud acotada. `nvarchar(max)` solo si un texto clínico no tiene límite confirmado; en estas propuestas se usa `nvarchar(2000)` o `nvarchar(4000)` y el excedente queda NEEDS_VALIDATION.
- Sin `ON DELETE CASCADE` en historia clínica.
- Borrado físico solo de borradores no confirmados.
- Ninguna propuesta crea caso sucesor, estado `Pendiente de continuidad` ni tablas EDIN II / EVADE.
- La línea de tiempo se consulta. No se duplica el cuerpo de la atención en otra tabla.
- La prioridad se calcula con la matriz RN-009 versionada. Se guarda junto con riesgo, protección y versión. No hay forma de escribir la prioridad sin esos insumos.
- ASC2 y ASC3 no tienen tablas propias.

---

# Propuesta A — Expediente operativo con estado vigente e historial explícito

## A. Concepto y filosofía

Cada agregado operativo guarda el estado que la pantalla y la bandeja necesitan ahora, y las decisiones que no pueden perderse viven en filas hijas que no se reescriben.

Es un modelo relacional de transacciones en línea. Sirve porque Oficina Local trabaja sobre el caso vigente, la lista y la programación, mientras auditoría, revaloración y reportería histórica necesitan el rastro. El compromiso es disciplina de transacción: quien actualiza el puntero vigente tiene que insertar la fila histórica en la misma transacción. A cambio, las consultas de bandeja no reconstruyen el presente con subconsultas.

No es un almacén de eventos ni un motor genérico de formularios.

## B. Dominios

Un solo esquema `dbo`. El prefijo agrupa responsabilidades.

| Prefijo | Responsabilidad |
| --- | --- |
| `vinculo_` | Ancla de persona y bloqueo. Sin demografía maestra. |
| `cat_` | Catálogos versionados y matriz. |
| `ref_` | Referencia, snapshot, motivos, impresión, posible referencia. |
| `ses_` | Sesión, situación, valoración, resolución. |
| `caso_` | Caso, historial de estado, cierre, plan. |
| `ate_` | Atención individual y grupal. |
| `prog_` | Programación. |
| `doc_` | Documento, coordinación, reporte individual. |
| `inf_` | Informe analítico. |
| `aud_` | Auditoría, borrador, migración. |

## C. Modelo relacional

### C.1 Ancla y catálogos

`vinculo_persona`

| Columna | Tipo | Nulo | Clave / restricción |
| --- | --- | --- | --- |
| `per_id_persona` | nvarchar(20) | no | PK. Solo el identificador institucional. |
| `primera_operacion_en` | datetime2(0) | no | |
| `fila_version` | rowversion | no | Bloqueo optimista del ancla. |

No hay nombre, sexo, nacimiento ni establecimiento vivo.

`cat_version`

| Columna | Restricción |
| --- | --- |
| `cat_version_id` bigint PK | |
| `codigo_catalogo` nvarchar(40) | no. Ejemplos estables: `VIA_ATENCION`, `ORIGEN_REFERENCIA`, `MOTIVO_CIERRE`, `DISCIPLINA`, `ESTRATEGIA`, `FRECUENCIA`, `TIPO_ACTIVIDAD_PROGRAMADA`, `TIPO_ATENCION`. |
| `numero_version` int | único junto con `codigo_catalogo`. |
| `vigente` bit | un solo vigente por código, índice filtrado. |
| `vigente_desde` date | no |

`cat_item`

| Columna | Restricción |
| --- | --- |
| `cat_item_id` bigint PK | La fila usada por un hecho histórico no se reetiqueta. |
| `cat_version_id` FK | |
| `codigo` nvarchar(80) | único por versión. |
| `etiqueta` nvarchar(300) | |
| `orden` int | |
| `requiere_texto` bit | Cierre `OTRO`. |
| `ambito` nvarchar(40) null | Individual, hogar-familiar o comunitario cuando el catálogo lo usa. |
| `activo` bit | Desactivar no borra. |

Semilla confirmada, no exhaustiva: vía `URGENCIA` y `NO_INMEDIATA`; orígenes de RF-022; motivos de crecimiento y desarrollo de RF-024; `OTRA_CONDICION_SALUD`; cierres `CIERRE_SATISFACTORIO`, `TRASLADO`, `OTRO`; frecuencias `TRIMESTRAL`, `SEMESTRAL`, `SEGUN_NECESIDAD`; programación `SESION_INTERDISCIPLINARIA` y `VISITA_ESTABLECIMIENTO_AI`. Disciplinas, factores completos y otros tipos quedan sin ítems inventados.

`cat_matriz_prioridad`

PK (`cat_version_id`, `riesgo_codigo`, `proteccion_codigo`). `prioridad_codigo` no nulo. Nueve filas de RN-009 en la versión 1. Códigos de riesgo `ALTO|MODERADO|BAJO`. Protección `ALTA|MODERADA|BAJA`. Prioridad `ALTO|MODERADO|BAJO`.

`cat_instrumento_version` identifica la versión del instrumento de valoración. `cat_instrumento_categoria` tiene eje (`PROTECTOR`, `RIESGO`, `SIGNO_ALERTA`), ámbito y `es_requerida`. `cat_instrumento_factor` pertenece a una categoría, con `es_ninguno` y `es_abierto`. Un factor `Ninguno` por categoría requerida. Los demás factores se cargan cuando exista fuente. No hay columnas de intensidad, frecuencia ni persistencia.

`cat_codigo_region_referencia` guarda el código documental CS, HN, CH, HC, BR, CN, PC, CO, CE asociado al `region_id` institucional. Es configuración de consecutivo, no el maestro de Región.

### C.2 Referencia

`ref_referencia`

| Columna | Nulo | Notas |
| --- | --- | --- |
| `referencia_id` bigint PK | no | |
| `per_id_persona` nvarchar(20) | no | Sin FK a SIDINACC. Índice. |
| `estado` nvarchar(30) | no | CHECK `BORRADOR`, `PENDIENTE_REVISION`, `ADMITIDA_AI`, `NO_REQUIERE_AI`. |
| `fecha_referencia` date | no | |
| `via_item_id` bigint FK | no | |
| `origen_item_id` bigint FK | no | |
| `responsable_usuario` nvarchar(128) | no | Identidad autenticada. |
| `acciones_previas` nvarchar(2000) | sí | |
| `resultados_previos` nvarchar(2000) | sí | |
| `informacion_complementaria` nvarchar(2000) | sí | Distinta de las dos anteriores. |
| `origen_captura` nvarchar(20) | no | CHECK `MANUAL`, `PLANTILLA`. |
| `plantilla_version` nvarchar(40) | sí | Obligatoria si el origen es plantilla. |
| `consecutivo` nvarchar(80) | sí | Único filtrado donde no es nulo. Nulo solo en borrador. |
| `establecimiento_id` int | no | Del niño, para ámbito y consecutivo. |
| `oficina_local_id` int | no | |
| `region_id` int | no | |
| `enviada_en` datetime2(0) | sí | Nula en borrador. Inmutable tras el envío: la aplicación no la actualiza. |
| `enviada_por` nvarchar(128) | sí | |
| `creada_en` datetime2(0) | no | |
| `creada_por` nvarchar(128) | no | Digitador, que en referencia coincide con el responsable. |
| `fila_version` rowversion | no | |

Índice filtrado único de consecutivo. Índice `(oficina_local_id, estado, enviada_en)` y `(establecimiento_id, estado)`.

`ref_contexto` 1:1 con la referencia enviada. PK = FK `referencia_id`. Columnas snapshot, todas anulables porque la fuente puede no traer el dato: `encargado_nombre`, `relacion_encargado`, `contacto`, `direccion`, `servicios_texto`, `region_nombre`, `oficina_local_nombre`, `establecimiento_nombre`, `edad_anios` smallint, `fecha_nacimiento_informada` date. Esta última solo documenta la edad congelada. No es el maestro. CHECK `edad_anios` entre 0 y 120 si viene informada.

`ref_motivo`: PK identidad, FK `referencia_id`, FK `cat_item_id`, `especificacion` nvarchar(1000) nula. Único (`referencia_id`, `cat_item_id`). Al quitar el motivo se elimina la fila, especificación incluida, antes de confirmar. Después del envío el conjunto queda congelado.

`ref_impresion`: `referencia_id`, usuario, `impresa_en`. No modifica el envío.

`ref_posible`

| Columna | Notas |
| --- | --- |
| `posible_id` bigint PK | |
| `per_id_persona` | no |
| `establecimiento_id`, `oficina_local_id`, `region_id` | ámbito de la detección |
| `criterio_codigo` nvarchar(80) | señal, no diagnóstico |
| `fecha_deteccion` date | |
| `id_externo` nvarchar(80) null | Cuando UTIC lo entregue. |
| `sistema_origen` nvarchar(40) null | |
| `estado` | CHECK `PENDIENTE`, `REFERENCIA_CREADA`. No se inventa un descarte institucional. |
| `referencia_id` FK null | Único filtrado donde no es nulo: una sugerencia, una referencia. |
| `fila_version` | |

Índice único filtrado PROPUESTO, no confirmado como regla de equivalencia: (`per_id_persona`, `criterio_codigo`, `establecimiento_id`) donde `estado = PENDIENTE`. Sirve para no mostrar dos pendientes idénticos. NV-EQUIV puede cambiar la clave.

`ref_consecutivo_control`: PK (`establecimiento_id`, `anio`). `ultimo_numero` int. Se incrementa bajo `UPDLOCK` al enviar.

### C.3 Sesión y valoración

`ses_sesion`: PK, `oficina_local_id`, `fecha`, `hora_inicio` time(0), `hora_fin` time(0), `lugar` nvarchar(200), `creada_en`, `creada_por`, `fila_version`. CHECK `hora_fin > hora_inicio` cuando ambas existan. La sesión puede guardarse sin situaciones.

`ses_disciplina`: PK (`sesion_id`, `disciplina_item_id`).

`ses_situacion`: PK, FK `sesion_id`, `referencia_id` nula, `caso_id` nula. CHECK exactamente uno de los dos identificadores. Único (`sesion_id`, `referencia_id`) filtrado. Único (`sesion_id`, `caso_id`) filtrado.

`ses_valoracion`

| Columna | Notas |
| --- | --- |
| `valoracion_id` PK | |
| `situacion_id` FK | La sesión se alcanza por la situación. |
| `caso_id` FK null | Se completa al abrir el caso. Pasa de nulo a valor una sola vez. |
| `referencia_id` FK | Siempre la referencia analizada. En revaloración sigue siendo la referencia de origen del caso. |
| `instrumento_version_id` FK | |
| `numero` int | Único por caso cuando `caso_id` no es nulo. También único por referencia mientras no hay caso. |
| `es_vigente` bit | Índice único filtrado por `caso_id` donde `es_vigente = 1` y `caso_id` no es nulo. |
| `riesgo_codigo` | CHECK de tres valores. Nulo solo en borrador. |
| `proteccion_codigo` | CHECK. Nulo solo en borrador. |
| `prioridad_codigo` | CHECK. Debe coincidir con la matriz de su versión. |
| `matriz_version_id` FK | |
| `estado` | CHECK `BORRADOR`, `CONFIRMADA`. |
| `responsable_usuario` | Profesional. En sesión puede coincidir con quien digita. |
| `fecha_valoracion` date | |
| `confirmada_en` datetime2(0) null | |
| `fila_version` | |

`ses_valoracion_categoria`: PK (`valoracion_id`, `categoria_id`), `respuesta` CHECK `NINGUNO` o `FACTORES`. Obligatoria, al confirmar, para cada categoría con `es_requerida`. No se inserta fila "vacía" interpretada como ninguno.

`ses_valoracion_factor`: PK, FK a la categoría de la valoración, FK al factor, `especificacion` nvarchar(1000) null. Único (`valoracion_id`, `factor_id`). El factor `es_ninguno` no se guarda aquí: `Ninguno` es la respuesta de la categoría. Así una categoría sin filas de factor y sin respuesta no parece `Ninguno`.

`ses_resolucion`: PK, FK `referencia_id` única, FK `sesion_id`, FK `valoracion_id`, `decision` CHECK `REQUIERE_AI` o `NO_REQUIERE_AI`, `justificacion` nvarchar(2000) null, responsable, fecha. CHECK: si la decisión es negativa, la justificación no está vacía.

### C.4 Caso y plan

`caso_ai`

| Columna | Notas |
| --- | --- |
| `caso_id` PK | |
| `per_id_persona` | Índice único filtrado `UX_caso_activo` donde `estado = ACTIVO`. |
| `referencia_id` FK única | Una referencia abre como máximo un caso. |
| `estado` | CHECK `ACTIVO`, `CERRADO`. |
| `abierto_en` datetime2(0) | |
| `fecha_apertura` date | |
| `abierto_por` | |
| `establecimiento_id`, `oficina_local_id`, `region_id` | Snapshot de origen. No se mueven en un traslado. |
| `consecutivo_origen` | Copia del consecutivo de la referencia, inmutable. |
| `riesgo_vigente`, `proteccion_vigente`, `prioridad_vigente` | Punteros del presente. Se actualizan solo al confirmar otra valoración. |
| `valoracion_vigente_id` FK | |
| `plan_vigente_id` FK | |
| `fila_version` | |

`caso_estado_historial`: `caso_id`, `estado`, `ocurrido_en`, `usuario`, `motivo_item_id` null. La apertura inserta `ACTIVO`. El cierre inserta `CERRADO`. No reemplaza al cierre estructurado.

`caso_cierre`: PK = FK `caso_id`. Una fila, relación 1:0..1. `motivo_item_id`, `explicacion` nvarchar(2000) null, `fecha_cierre` date, `responsable_usuario`, `registrado_en`. CHECK explicación obligatoria si el ítem tiene `requiere_texto`. Destino solo documental, todo nulo si el motivo no es traslado: `destino_establecimiento_id`, `destino_oficina_local_id`, `destino_region_id`, `destino_nombre` nvarchar(200). No hay `caso_destino_id`.

`caso_plan`: `plan_id` PK, `caso_id`, `numero_version`, `es_vigente` bit, `frecuencia_item_id`, `responsable`, `fecha`, `fila_version`. Único (`caso_id`, `numero_version`). Único filtrado de vigente por caso.

`caso_plan_proposito`: `plan_id`, `orden`, `texto` nvarchar(1000). Al menos uno por plan confirmado, regla de transacción.

`caso_plan_estrategia`: `plan_id`, `estrategia_item_id`. Único compuesto.

`caso_plan_disciplina`: `plan_id`, `disciplina_item_id`. Único compuesto.

### C.5 Atenciones

`ate_individual`

| Columna | Notas |
| --- | --- |
| `atencion_individual_id` PK | |
| `caso_id` FK | Solo caso activo al guardar. |
| `per_id_persona` | Redundancia controlada del caso, para contar personas sin join extra. Debe ser la persona del caso. |
| `fecha_atencion` date | Fecha real. |
| `disciplina_item_id` | Una. |
| `estrategia_item_id` | Tipo o estrategia. |
| `acciones` nvarchar(2000) | |
| `recomendaciones` nvarchar(2000) | |
| `profesional_usuario` | |
| `proxima_accion` nvarchar(500) null | |
| `fecha_proxima` date null | |
| `digitador_usuario` | Puede diferir del profesional. |
| `digitada_en` datetime2(0) | |
| `estado` | CHECK `BORRADOR`, `CONFIRMADA`. |

`ate_grupal`: PK, `oficina_local_id`, `establecimiento_id` null, `fecha_atencion`, `tipo_item_id`, `tema` nvarchar(500), `lugar` nvarchar(200), `acciones`, `recomendaciones`, `digitador`, `digitada_en`, `estado`. Un registro por actividad. No tiene `caso_id`.

`ate_grupal_disciplina` y `ate_grupal_profesional`: N:M. El profesional es `nvarchar(128)`, no un catálogo de personas.

`ate_grupal_participante`

| Columna | Notas |
| --- | --- |
| PK identidad | |
| `atencion_grupal_id` FK | |
| `per_id_persona` | Único con la grupal. |
| `caso_id` FK null | El caso activo en el momento, si existía. No se crea caso. |
| `asistio` bit null | NULL = no confirmada. 1 = efectiva. 0 = no asistió. Solo 1 cuenta para cobertura y para "sin atención". |

No existe tabla que multiplique la grupal por persona.

### C.6 Programación, documentos, informe, auditoría

`prog_actividad`: PK, `oficina_local_id`, `establecimiento_id` null, `tipo_item_id`, `titulo` nvarchar(300), `fecha_prevista` date, `fecha_vigente` date, `estado` CHECK `PROGRAMADA`, `REALIZADA`, `REPROGRAMADA`, `CANCELADA`, `observaciones` nvarchar(1000), `motivo_transicion` nvarchar(500) null, `fila_version`. CHECK: si `REPROGRAMADA`, hay motivo y `fecha_vigente` distinta de la prevista original guardada en historial; si `CANCELADA`, hay motivo. Vencida no es valor de `estado`.

`prog_cambio`: historial append-only de cada transición, con estado anterior, estado nuevo, fechas y usuario.

`prog_persona`: `actividad_id`, `per_id_persona`, `caso_id` null. Único (`actividad_id`, `per_id_persona`). Cero filas significa actividad general.

`doc_documento`: PK, `caso_id`, `tipo_item_id` null mientras el catálogo no esté validado, `tipo_texto` nvarchar(120) como respaldo solo si no hay ítem, `fecha_documento` date, `responsable_usuario`, `nombre_original` nvarchar(260), `clave_almacen` nvarchar(200) que apunta fuera de la base, `tamano_bytes` bigint, `creado_en`. Sin `varbinary`.

`doc_coordinacion`: PK, `caso_id`, `institucion_item_id` null, `institucion_texto` nvarchar(200), `profesional_responsable` nvarchar(200), `digitador_usuario`, `motivo` nvarchar(1000), `fecha` date, `estado_item_id` null, `estado_texto` nvarchar(80), `fila_version`. El texto existe porque los catálogos institucionales no están confirmados. Cuando el ítem exista, el texto se conserva como etiqueta histórica y no se reinterpreta.

`doc_coordinacion_evento`: transiciones de estado. Append-only.

`doc_reporte_caso`: PK, `caso_id`, `tipo_proposito` nvarchar(200), `fecha` date, `responsable`, `motivo` nvarchar(1000), `creado_en`. Sin columna que toque `caso_ai.estado`.

`inf_informe`: PK, `titulo` nvarchar(300), `responsable_usuario`, `rol_codigo` nvarchar(40), `ambito_nivel` CHECK `OFICINA_LOCAL`, `REGION`, `NACIONAL`, `region_id` null, `oficina_local_id` null, `establecimiento_id` null, `periodo_anio` int, `filtros_resumen` nvarchar(2000), `corte_en` datetime2(0), `generado_en`, `clave_archivo` nvarchar(200) null. CHECK de coherencia del ámbito: nacional puede llevar filtros inferiores; regional exige `region_id`; oficina exige `oficina_local_id`.

`inf_visualizacion`: PK, FK informe, `codigo_visualizacion` tinyint CHECK 1 a 12, `orden` int, `titulo` nvarchar(400), `filtros` nvarchar(1000), `analisis` nvarchar(4000). Único (`informe_id`, `codigo_visualizacion`) y único (`informe_id`, `orden`). CHECK de cantidad: la transacción exige entre 5 y 12 filas. Un CHECK de tabla no cuenta hijas; queda como regla de transacción.

`inf_agregado`: FK a la visualización, `orden`, `etiqueta` nvarchar(300), `valor_numerico` decimal(18,4) null, `valor_texto` nvarchar(500) null. Guarda barras, porciones, top-N o palabras ya calculadas. No guarda identificadores de niños. Es el snapshot reproducible del gráfico.

`aud_evento`: `evento_id` bigint PK, `ocurrido_en`, `usuario`, `rol`, `accion` nvarchar(40), `entidad` nvarchar(80), `entidad_id` nvarchar(40), `ambito` nvarchar(200), `resumen` nvarchar(500). El resumen no copia factores ni explicaciones clínicas. Índice por entidad y por usuario/fecha.

`aud_borrador`: PK, `usuario`, `flujo` nvarchar(40), `clave_negocio` nvarchar(80) null, `contenido` nvarchar(max), `actualizado_en`, `fila_version`. El `nvarchar(max)` se acepta solo aquí: el borrador es captura incompleta, no el modelo de registro. Al confirmar se borra. Las consultas operativas no leen esta tabla.

`aud_migracion_lote` y `aud_migracion_error`: lote, fuente, usuario, conteos, mensaje y clave externa rechazada. No son hechos clínicos.

## D. Integridad

**INV-01.** `UX_caso_activo` impide dos filas `ACTIVO` de la misma persona aunque las Oficinas Locales sean distintas. La carrera de dos `INSERT` termina en error de clave duplicada para la segunda. El servicio traduce ese error al mensaje seguro.

**INV-02 e INV-03.** No salen del índice, porque una referencia no inserta un caso. Protocolo obligatorio en la misma transacción, aislamiento `READ COMMITTED`:

1. Asegurar la fila de `vinculo_persona` con `MERGE ... WITH (HOLDLOCK)`.
2. Tomar `UPDLOCK` de esa fila y mantenerlo hasta el `COMMIT`.
3. Leer si existe caso `ACTIVO`.
4. Si existe, `ROLLBACK` y mensaje seguro, sin datos del otro expediente.
5. Si el flujo es apertura, insertar el caso `ACTIVO`. El índice único es la red de fondo si otra sesión saltó el protocolo.
6. Si el flujo es envío de referencia, insertar la referencia `PENDIENTE_REVISION` solo después del paso 3.

Cerrar y abrir en paralelo se serializan en la misma fila de persona. No se usa `SERIALIZABLE` de tabla completa ni `sp_getapplock`.

**INV-05.** No hay FK de caso a caso. El destino del traslado son columnas de `caso_cierre`, anulables y sin referencia a otro `caso_id`.

**INV-07.** Una valoración `CONFIRMADA` no admite `UPDATE` de factores, riesgo, protección ni prioridad. La revaloración inserta número nuevo, pone `es_vigente = 0` en la anterior y `1` en la nueva, y actualiza los punteros del caso. Si la transacción falla, no queda vigente doble: el índice filtrado lo impide.

**INV-08.** La prioridad escrita debe ser la de `cat_matriz_prioridad` para esa versión, riesgo y protección. La comprobación de igualdad es de transacción, porque un CHECK no puede leer otra tabla sin un mecanismo adicional que estas propuestas evitan. Los tres códigos quedan guardados para poder rehacer la cuenta.

**INV-09.** Confirmación de valoración: cada categoría requerida tiene exactamente una respuesta. Si la respuesta es `NINGUNO`, no hay filas en `ses_valoracion_factor` de esa categoría. Si es `FACTORES`, hay al menos una y ninguna es el ítem ninguno. Esta exclusión cruza tablas. La garantiza la transacción de confirmación. Una escritura SQL directa podría violarla. Es un límite consciente de no usar triggers. Las pruebas de dominio tendrán que cubrirla.

**INV-10.** La grupal no tiene FK de caso en su cabecera. Insertar participantes no inserta más cabeceras.

**INV-14.** El CHECK de explicación depende de `requiere_texto` del ítem. También es regla de transacción al resolver el ítem, más un control de que `OTRO` nace con esa bandera.

**INV-15.** `ref_consecutivo_control` con `UPDLOCK` asigna el número. El índice único rechaza un consecutivo repetido.

**INV-16.** Únicos filtrados de `ses_situacion`.

**INV-17.** La transición de `ref_posible` a `REFERENCIA_CREADA` actualiza con `fila_version`. Si dos sesiones leyeron la misma versión, la segunda no actualiza ninguna fila y se aborta. El único filtrado de `referencia_id` impide dos referencias hijas.

**INV-12.** No hay trigger ni columna que genere `ate_*` desde `prog_actividad`.

**Cierre y traslado.** Una transacción: validar estado `ACTIVO`, insertar `caso_cierre`, insertar historial `CERRADO`, actualizar `caso_ai.estado`, soltar el índice filtrado. Si el motivo es traslado, llenar destino. No se copian planes ni valoraciones.

**Concurrencia optimista.** `rowversion` en caso, referencia, actividad, coordinación, valoración borrador y ancla. Sirve para dos ediciones de la misma ficha. No sustituye el bloqueo de persona del caso activo.

## E. Consultas y reportería

Ámbito de un caso: `caso_ai.establecimiento_id`, `oficina_local_id`, `region_id`. No se usa la ubicación viva de SIDINACC, porque el caso cerrado por traslado debe seguir contando en el origen.

1. `COUNT(*)` de casos agrupado por `establecimiento_id`, con el filtro de estado que aplique.
2. Los `per_id_persona` del conjunto se enriquecen con sexo en el adaptador. SIA no agrupa sexo sola.
3. Igual con fecha de nacimiento. La edad es la del corte de consulta. Los grupos de barras son analíticos, no un catálogo institucional de edades.
4. `GROUP BY prioridad_vigente`.
5. `GROUP BY estado`.
6. `prog_actividad` con `estado = CANCELADA` y fecha de la transición en el año. Top-N sobre el motivo textual. NV-CANCELACION: sin catálogo confirmado, dos redacciones distintas no se fusionan.
7. `COUNT(*)` de `ref_motivo` por ítem, no `COUNT(DISTINCT referencia_id)`.
8. Individuales `CONFIRMADA` en el año, más una fila por `ate_grupal` confirmada. El tipo sale del catálogo. No se cuenta `prog_actividad`.
9. `caso_cierre` agrupado por motivo. Tres categorías. Traslado no se suma a satisfactorio.
10. `explicacion` donde el motivo requiere texto. La tokenización es de servicio sobre ese conjunto, no una tabla de palabras operativa. El informe guarda el top ya mostrado en `inf_agregado`.
11 y 12. Consulta conceptual:

```sql
WITH d AS (
    SELECT c.caso_id, c.per_id_persona
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND c.region_id = @region_id          -- o el predicado del ámbito efectivo
),
n AS (
    SELECT DISTINCT d.per_id_persona
    FROM d
    JOIN dbo.ate_individual AS i
      ON i.caso_id = d.caso_id
     AND i.estado = N'CONFIRMADA'
     AND i.fecha_atencion >= @inicio_anio
     AND i.fecha_atencion < @fin_anio
    UNION
    SELECT DISTINCT d.per_id_persona
    FROM d
    JOIN dbo.ate_grupal_participante AS p
      ON p.caso_id = d.caso_id
     AND p.asistio = 1
    JOIN dbo.ate_grupal AS g
      ON g.atencion_grupal_id = p.atencion_grupal_id
     AND g.estado = N'CONFIRMADA'
     AND g.fecha_atencion >= @inicio_anio
     AND g.fecha_atencion < @fin_anio
)
SELECT
    denominador = (SELECT COUNT(*) FROM d),
    numerador = (SELECT COUNT(*) FROM n);
```

Hay un activo por persona, así que el conteo de casos activos en el ámbito es el de personas. Una persona no puede sumar en dos regiones a la vez. El porcentaje nacional usa el N y el D nacionales. No promedia porcentajes. El filtro general Activo/Cerrado/Todos no entra a esta consulta. Si D es 0, el servicio responde "Sin casos activos" y no divide.

Casos sin atención en un período: activos del ámbito cuyo `caso_id` no aparece en individual confirmada ni en participación con `asistio = 1` dentro del intervalo. La última fecha es el máximo de esas fechas, o ausencia si no hay ninguna histórica.

Inicio: conteos por estado de referencia, casos activos, sesiones con fecha futura y actividades `PROGRAMADA` con `fecha_vigente <` hoy. La posible referencia pendiente es otro conteo. No se lee un estado de continuidad.

El establecimiento, para su lista, consulta una proyección de columnas limitada: persona, establecimiento, estado, prioridad vigente, apertura y cierre. Riesgo, protección, plan y factores no están en esa consulta.

Sexo y edad pueden exigir una segunda llamada al adaptador. Es el costo de no copiar maestros. Para un ámbito nacional, el servicio pide demografía por lotes de identificadores ya filtrados, no la población completa.

## F. Integración

SIA lee persona, ubicación vigente, servicios y contexto familiar por el adaptador en el momento de crear la referencia, y escribe el snapshot. Después no mantiene esos campos sincronizados.

La posible referencia no copia PE/PT/TE/IMC. Guarda criterio, fecha, persona, establecimiento e `id_externo` opcional.

No hay vista ni sinónimo hacia `SIDINACC_LOCAL` dentro del modelo de SIA. El adaptador puede consultar la réplica por otro canal.

## G. Seguridad

El riesgo principal es una consulta de caso sin predicado de ámbito, o una lista de establecimiento que seleccione `ses_valoracion`.

Mitigación de modelo: tablas separadas. La lista mínima no necesita join a valoración si usa `prioridad_vigente`. Aun así, el permiso se exige en el servicio. Una vista `caso_lista_establecimiento` con solo esas columnas es defensa adicional propuesta, no un sustituto.

Snapshots familiares y explicaciones de cierre son los textos más sensibles. No entran a `aud_evento.resumen` ni a `inf_agregado`.

Documentos: la base guarda la clave de almacenamiento. Quien no pase la autorización de caso no recibe la clave.

Informes: agregados. Un ámbito pequeño puede hacer identificable una barra de una sola persona. Eso se documenta como riesgo residual; no se guardan identificadores en el agregado. Exportaciones anonimizadas siguen fuera de alcance.

No hay tabla de autorización que pueda divergir del mecanismo institucional.

## H. Evolución

- Un factor nuevo es un `cat_instrumento_factor` de una versión nueva. Las valoraciones viejas siguen apuntando a sus ítems.
- Un cambio de RN-009 es otra versión de matriz. Las prioridades ya guardadas no se recalculan solas.
- El asistente, si se confirma, lee las mismas tablas bajo el ámbito ya aplicado y agrega `aud_evento` de consulta. No necesita otro expediente.
- Una sugerencia exploratoria de riesgo podría insertarse en una tabla nueva `ses_sugerencia` sin columnas en `ses_valoracion`. No se crea ahora.
- Tipos de atención o de programación aún no nombrados entran por catálogo.
- La corrección administrativa de un hecho confirmado, si se valida, sería una fila de rectificación que apunta al hecho. Hoy no existe y no se simula con `UPDATE`.

## I. Costos y riesgos

Desarrollo y mantenimiento son los más directos de las tres: el estado vigente está en la fila del caso. El riesgo es desactualizar `prioridad_vigente` o `es_vigente`. El índice filtrado y la transacción única reducen ese riesgo; no lo eliminan si alguien escribe SQL suelto.

Rendimiento de bandejas es bueno. Cobertura y motivos son joins cortos con índices por caso, fecha y ámbito. Sexo y edad dependen del adaptador.

Migraciones futuras son aditivas mientras no se cambie la clave de persona.

La exclusión `Ninguno` no es un CHECK. Es el hueco de integridad más claro de esta propuesta.

---

# Propuesta B — Hechos profesionales inmutables y ancla de caso activo

## A. Concepto y filosofía

Lo que un profesional confirma no se actualiza. Cada decisión es una inserción. El presente se obtiene de la última fila confirmada o de la ausencia de un hecho de cierre.

El único mutable de integridad es el ancla `persona_caso_activo`: una fila por persona con caso abierto. Se inserta al abrir y se elimina al cerrar, en la misma transacción del hecho. No hay columna `estado` en el caso ni punteros `prioridad_vigente`.

Esto conviene cuando el riesgo que más importa es perder o reescribir historia. El compromiso es que cada bandeja y cada gráfico deben definir con precisión cuál es "el último" hecho. Una consulta mal escrita puede mostrar una valoración vieja como si fuera la vigente.

No es event sourcing. No hay un log genérico ni reconstrucción de estado por reproceso de eventos. Hay tablas de hechos por tipo, con esquema propio.

## B. Dominios

Esquema único `dbo`, prefijo `h_` para hechos confirmados y `b_` para borradores. Los borradores no se promueven con `UPDATE`: al confirmar se inserta el hecho y se borra el borrador.

| Grupo | Contenido |
| --- | --- |
| Ancla | `persona_vinculo`, `persona_caso_activo` |
| Catálogo | Igual que A en estructura. Los hechos guardan `cat_item_id`. |
| Hechos | Referencia, contexto, motivo, sesión, valoración, resolución, apertura, plan, atención, programación, cierre, documento, coordinación, reporte, informe |
| Borrador | Tablas paralelas mínimas, no el hecho |
| Auditoría | Igual intención que A |

## C. Modelo relacional

### C.1 Ancla

`persona_vinculo`: igual que A. PK `per_id_persona`. Sirve de fila de bloqueo.

`persona_caso_activo`

| Columna | Restricción |
| --- | --- |
| `per_id_persona` nvarchar(20) PK | Como máximo un activo. |
| `caso_id` bigint UNIQUE | Un caso está activo una sola vez. |
| `abierto_en` datetime2(0) | |

No hay estado que filtrar. La PK es la invariante. Al cerrar, la fila se elimina. El caso histórico permanece en `h_caso_apertura` y `h_caso_cierre`.

### C.2 Referencia

`h_referencia` no tiene columna de estado. Columnas de contenido iguales a la referencia enviada de A, todas obligatorias en el insert de envío. No existe fila de referencia enviada en borrador. El borrador vive en `b_referencia`.

`h_referencia_transicion`: `referencia_id`, `numero` único por referencia, `transicion` CHECK `ENVIADA`, `ADMITIDA_AI`, `NO_REQUIERE_AI`, `ocurrido_en`, `usuario`. La primera fila es `ENVIADA` y se inserta junto con la referencia. El resultado posterior es otra fila. No se actualiza la primera. La transición vigente es la de mayor `numero`.

Índice único (`referencia_id`, `numero`).

Contexto, motivos e impresión: iguales a A, hijos inmutables.

`h_posible` es inmutable en su detección. `h_posible_gestion` append-only: `PENDIENTE` al crear y `REFERENCIA_CREADA` al confirmar, con `referencia_id`. La gestión vigente es la última. Un índice único filtrado impide dos gestiones `REFERENCIA_CREADA` de la misma sugerencia. La fila de detección no se actualiza.

### C.3 Sesión, valoración, resolución

`h_sesion` y `h_sesion_disciplina`: inmutables. Corregir el lugar o la hora, si algún día se permite, sería `h_sesion_rectificacion` apuntando a la sesión. Esa tabla no se crea hasta NV-CORRECCION. Mientras tanto no hay `UPDATE`.

`h_sesion_situacion`: igual unicidad que A.

`h_valoracion`: no tiene `es_vigente` ni `estado`. Solo existen valoraciones confirmadas. Borrador en `b_valoracion`, `b_valoracion_categoria`, `b_valoracion_factor`. Al confirmar se insertan las filas `h_` y se borra el borrador. `numero` único por `caso_id` o, si aún no hay caso, por `referencia_id`. La vigente es `numero` máximo del caso. Riesgo, protección, prioridad, matriz, instrumento, responsable y fecha van en la fila. Categorías y factores iguales que A.

`h_resolucion`: una por referencia, única. Inmutable. Justificación obligatoria si `NO_REQUIERE_AI`.

### C.4 Caso y plan

`h_caso_apertura`: PK `caso_id`, `per_id_persona`, `referencia_id` única, fecha, usuario, snapshot territorial, consecutivo. No tiene estado ni prioridad.

Un caso está activo si existe apertura, no existe `h_caso_cierre` y existe fila en `persona_caso_activo`. Las tres condiciones se escriben juntas. Si una consulta necesita el estado:

```sql
SELECT a.caso_id,
       estado = CASE WHEN c.caso_id IS NULL THEN N'ACTIVO' ELSE N'CERRADO' END
FROM dbo.h_caso_apertura AS a
LEFT JOIN dbo.h_caso_cierre AS c ON c.caso_id = a.caso_id;
```

`h_caso_cierre`: igual contenido que `caso_cierre` de A, sin puntero a caso destino.

`h_plan` con `numero_version`. Sin `es_vigente`. Vigente = máximo `numero_version` del caso. Propósitos, estrategias y disciplinas son hijos inmutables de esa versión. Cambiar el plan inserta otra versión completa. No se editan filas de la versión anterior.

### C.5 Atenciones y programación

`h_atencion_individual` y `h_atencion_grupal` solo contienen hechos confirmados. No hay `estado`. El borrador está en `b_atencion_*`. Participación, disciplinas y profesionales iguales que A. `asistio` es `bit NOT NULL` en el hecho confirmado: hay que resolverlo antes de insertar. NULL solo existe en el borrador y no cuenta.

`h_programacion` guarda la creación: fecha prevista, tipo, título, ámbito, observaciones. No guarda el estado actual.

`h_programacion_transicion`: `numero`, `estado` CHECK `PROGRAMADA`, `REALIZADA`, `REPROGRAMADA`, `CANCELADA`, `fecha_vigente`, `motivo` null, usuario, instante. La primera transición es `PROGRAMADA`. Reprogramar y cancelar exigen motivo por CHECK condicional: `motivo` no nulo si el estado no es `PROGRAMADA` ni `REALIZADA`. La transición vigente es la de mayor número. Vencida = vigente `PROGRAMADA` y `fecha_vigente <` hoy.

`h_programacion_persona`: asociación explícita, inmutable. Cambiar participantes sería una transición de contenido no especificada. NEEDS_VALIDATION. Hasta entonces, la asociación se fija al crear. Es más rígido que A y evita un update silencioso. Si la operación real necesita corregir participantes antes de ejecutar, habría que ampliar el hecho. Se deja visible como rigidez, no se disimula.

### C.6 Resto

Documentos, coordinaciones, reportes e informes siguen el mismo criterio. La coordinación no se actualiza: `h_coordinacion` es el alta y `h_coordinacion_transicion` cambia el estado.

El informe y sus agregados son inserciones únicas. No se versionan en esta propuesta. Un informe confirmado no se edita. Corregir un análisis implica un informe nuevo. Eso coincide con RN-041: el documento conserva el corte. No hay estado de aprobación.

Auditoría igual que A. No se audita un `UPDATE` de contenido clínico porque el modelo no lo ofrece. La auditoría registra el insert del hecho.

## D. Integridad

**INV-01.** PK de `persona_caso_activo`. Dos aperturas concurrentes: la segunda falla al insertar la misma persona. No depende de un valor de estado que alguien pueda escribir mal.

**Cierre.** Transacción: insertar `h_caso_cierre`, borrar `persona_caso_activo` donde `caso_id` coincide, soltar el bloqueo de `persona_vinculo`. Si se inserta el cierre y no se borra el ancla, la persona queda bloqueada para siempre. La transacción única es obligatoria. No hay índice de estado que se corrija solo. Este es el riesgo operativo propio de B.

**INV-02.** Bajo el mismo `UPDLOCK` de `persona_vinculo`, la existencia de `persona_caso_activo` bloquea el envío. No hace falta interpretar estados de caso.

**INV-07.** No hay sentencia de actualización de valoración. La historia es el conjunto de inserts. La vigente se define por `numero`, no por una bandera que pueda quedar en dos filas.

**INV-08.** Igual que A: prioridad guardada y recomputable. Sigue sin ser editable.

**INV-09.** Igual límite: la transacción que copia el borrador al hecho rechaza `NINGUNO` con factores. Una vez insertado el hecho, la ausencia de `UPDATE` evita la mezcla posterior. El hueco es solo durante la escritura inicial, no durante la vida del registro.

**INV-10 e INV-11.** Igual cardinalidad. `asistio` obligatorio en el hecho elimina la ambigüedad de NULL en reportería.

**INV-05.** Igual ausencia de sucesor.

**Concurrencia de posible referencia.** Insertar dos transiciones `REFERENCIA_CREADA` choca con el índice único. No se usa `rowversion` porque la detección no se actualiza.

**Consecutivo.** Igual tabla de control con `UPDLOCK`.

**Sesión y caso.** Únicos de situación iguales.

El estado actual no está redundante con el historial, así que no pueden contradecirse. Ese es el argumento de integridad de B. El costo es la definición dispersa de "vigente".

## E. Consultas y reportería

Estado del caso: `NOT EXISTS` cierre, o join al ancla si solo interesan activos. Los activos nacionales son exactamente las filas de `persona_caso_activo`, join apertura para el ámbito snapshot. Esa tabla es pequeña y favorece el KPI.

Prioridad vigente:

```sql
SELECT v.caso_id, v.prioridad_codigo
FROM dbo.h_valoracion AS v
JOIN (
    SELECT caso_id, numero = MAX(numero)
    FROM dbo.h_valoracion
    WHERE caso_id IS NOT NULL
    GROUP BY caso_id
) AS u
  ON u.caso_id = v.caso_id AND u.numero = v.numero;
```

Las visualizaciones 4 y el semáforo de la lista usan esa definición. Un índice `(caso_id, numero DESC)` INCLUDE `prioridad_codigo` la cubre.

Cobertura: D = `persona_caso_activo` unido a apertura filtrada por ámbito. N = esas personas con individual del `caso_id` en el año, o participación `asistio = 1` de ese `caso_id` en el año. Misma semántica que A. El ancla impide contar dos casos activos de la misma persona. Tampoco se promedian porcentajes.

Visualización 5: activos = sin cierre; cerrados = con cierre. El filtro "todos" es la unión. No hay columna que pueda decir `ACTIVO` cuando ya existe cierre, salvo que la transacción de cierre haya fallado a medias. Por eso el cierre y el borrado del ancla van juntos, y un control posterior puede buscar aperturas sin cierre y sin ancla, o cierres que aún tienen ancla. Esa consulta de conciliación forma parte del diseño.

Visualización 6: última transición `CANCELADA`.

Visualización 8: hechos de atención, no transiciones `REALIZADA` de programación.

El resto de los doce gráficos usa los mismos recorridos que A, cambiando punteros por "máximo número" o "existencia de cierre".

Sexo y edad siguen en el adaptador.

Casos sin atención: personas del ancla sin hechos efectivos en el intervalo. Última atención: `MAX` de fechas de sus hechos, no una columna del caso.

Inicio: referencias cuya última transición es `ENVIADA`; activos = ancla; sesiones futuras; programación cuya última transición es `PROGRAMADA` y la fecha ya pasó.

## F. Integración

Igual frontera que A. El snapshot sigue siendo un hecho inmutable, que encaja mejor con esta filosofía: nadie lo "actualiza" cuando CAH corrija un teléfono.

La caché demográfica no se introduce. Cada consulta de sexo o edad vuelve al adaptador.

## G. Seguridad

Igual separación de tablas y de columnas sensibles.

Ventaja: no existe un `UPDATE` amplio sobre valoración o plan que un permiso mal dado pueda usar para reescribir historia. El permiso de escritura de esos agregados es de inserción.

Riesgo: borrar `persona_caso_activo` fuera de la transacción de cierre dejaría abrir un segundo caso con el anterior aún sin cierre. El permiso de `DELETE` sobre esa tabla debe existir solo en el servicio de cierre. Se documenta como control de privilegios de base, además del servicio.

Los borradores en tablas `b_` pueden contener el mismo texto sensible. Deben quedar fuera de reportería, de exportaciones y del rol de lectura regional.

## H. Evolución

Una regla nueva que necesite corregir un hecho obliga a diseñar un hecho de rectificación, no a alterar columnas. Eso es más trabajo y evita migraciones que reescriban historia.

El instrumento versionado cabe igual. No hace falta un motor EAV.

El asistente lee hechos y el ancla. Una sugerencia exploratoria sería otro hecho, nunca un campo de la valoración.

Si la operación necesita corregir participantes de una programación ya creada, el modelo se queda corto hasta añadir un hecho de reemplazo. Es una extensión prevista, no una tabla especulativa.

## I. Costos y riesgos

Más tablas de transición y más cuidado en cada consulta de "vigente". El error típico es usar `TOP 1` sin `ORDER BY` o agrupar mal y duplicar personas en un gráfico. La cobertura, bien escrita, es sólida; mal escrita, puede contar una valoración intermedia.

Desarrollo inicial más lento que A. Pruebas de conciliación del ancla son obligatorias.

Rendimiento: el ancla de activos es barata. La prioridad vigente de todo un país es un agregado sobre valoraciones, indexable, pero más caro que leer una columna. Sigue siendo razonable para el volumen de un módulo nacional de A.I., no de un transaccional masivo de vigilancia.

Mantenimiento: menos estados contradictorios, más convención de consulta. La rigidez de la programación es el riesgo funcional más concreto.

---

# Propuesta C — Módulos por esquema, instrumento de respuestas y proyección analítica reconstruible

## A. Concepto y filosofía

El núcleo operativo se parece al estado vigente de A, con dos diferencias de fondo.

Primera: referencia y valoración no tienen tablas de detalle hechas a mano para cada bloque del formulario. Comparten un instrumento versionado. Cada versión declara secciones, ítems y el tipo de respuesta. Los hechos guardan respuestas. Así un cambio del instrumento no altera el esquema de tablas. El límite es no convertir eso en un EAV libre: cada ítem tiene un tipo cerrado y la fila de respuesta solo llena la columna de ese tipo.

Segunda: las doce visualizaciones pueden leer una proyección estrecha, escrita en la misma transacción que el hecho y reconstruible por completo desde las tablas operativas. La proyección no es la fuente de verdad. Si no cuadra, se reconstruye. No es vista materializada del motor ni un proceso asíncrono.

El compromiso es doble escritura dentro de la transacción y un lenguaje de instrumento que hay que entender antes de consultar un factor. A cambio, reportería nacional y evolución del formulario no dependen de seguir agregando columnas.

## B. Dominios

Esquemas SQL Server, sin FK entre bases y sin encadenar borrados a través de dominios. Las FK internas de un caso sí existen: son integridad, no acoplamiento accidental.

| Esquema | Dueño |
| --- | --- |
| `cfg` | Catálogos, instrumento, matriz, códigos de consecutivo. |
| `idn` | Ancla de persona. |
| `ref` | Referencia, snapshot, posible referencia. |
| `ses` | Sesión, respuestas de valoración, resolución. |
| `cas` | Caso, cierre, plan. |
| `ate` | Atenciones. |
| `prg` | Programación. |
| `doc` | Documento, coordinación, reporte individual. |
| `anl` | Proyección reconstruible e informe. |
| `aud` | Auditoría, borrador, migración. |

## C. Modelo relacional

### C.1 Instrumento

`cfg.instrumento`: PK, `codigo` único `REFERENCIA` o `VALORACION`.

`cfg.instrumento_version`: PK, FK instrumento, `numero`, `vigente`.

`cfg.seccion`: PK, versión, `codigo`, `eje` null, `ambito` null, `es_requerida` bit, `orden`.

`cfg.item`: PK, `seccion_id`, `codigo`, `etiqueta`, `tipo_respuesta` CHECK `SELECCION`, `NINGUNO`, `TEXTO`, `NIVEL`, `es_abierto` bit, `orden`, `activo`.

`cfg.item_opcion`: para ítems `SELECCION` o `NIVEL`. Aquí viven Urgencia, orígenes, motivos confirmados, Alto/Moderado/Bajo y Alta/Moderada/Baja.

`cfg.matriz_prioridad`: igual que A.

La valoración no tiene `ses_valoracion_factor` como tabla de negocio con nombres de columnas clínicos. Tiene:

`ses.valoracion`: cabecera. Caso, referencia, situación, versión de instrumento, número, vigente, responsable, fecha, estado, `fila_version`. Riesgo, protección y prioridad no son columnas sueltas: son respuestas de ítems `NIVEL` más una fila de prioridad calculada marcada `origen_calculo = MATRIZ` y `matriz_version_id`. La prioridad no tiene `origen_calculo = PROFESIONAL`. CHECK de ese origen.

`ses.respuesta`: PK, `valoracion_id`, `item_id`, `opcion_id` null, `texto` nvarchar(1000) null, `nivel_codigo` nvarchar(20) null. CHECK de exclusividad: según `tipo_respuesta` del ítem, solo una de las tres columnas viene informada. Ese CHECK no puede ver el ítem sin un mecanismo extra; se valida en la transacción y se documenta. Índice único (`valoracion_id`, `item_id`, `opcion_id`) para selecciones múltiples, con `opcion_id` nulo permitido una sola vez por ítem de texto o nivel.

`Ninguno` es un ítem de tipo `NINGUNO` por sección requerida. Confirmar con ese ítem elegido prohíbe otras respuestas de la misma sección. Confirmar una sección requerida sin ítem `NINGUNO` y sin otra respuesta es inválido. Ausencia total no se lee como `Ninguno`.

La referencia usa el mismo `ref.respuesta` contra el instrumento `REFERENCIA`: vía, origen y motivos son ítems. Acciones previas, resultados e información complementaria son ítems `TEXTO`, no tres columnas obligatorias de una sola forma. La cabecera `ref.referencia` conserva persona, estado, consecutivo, ámbito, responsable, envío y captura, porque eso no es parte del instrumento clínico: es control del trámite.

Esta es la diferencia real con A. A modela motivos y factores como entidades nombradas. C los modela como respuestas de un instrumento con tipos cerrados.

### C.2 Operación

`idn.persona` igual al ancla de A.

`ref.referencia`, `ref.contexto`, `ref.posible`, `ref.consecutivo_control`, `ref.impresion`: igual papel que A. Los motivos no tienen tabla propia; están en `ref.respuesta`.

`ses.sesion`, `ses.disciplina`, `ses.situacion`, `ses.resolucion`: igual que A.

`cas.caso`, `cas.estado_historial`, `cas.cierre`, `cas.plan` y sus hijos de propósito, estrategia y disciplina: igual que A, incluidos punteros vigentes y el índice único filtrado de caso activo. El plan no pasa por el instrumento. Propósitos y estrategias tienen semántica propia y ya están normalizados. Meterlos en el instrumento mezclaría trámite clínico con formulario de referencia sin ganancia.

`ate.individual`, `ate.grupal`, participación, disciplinas y profesionales: igual que A. El tipo de atención es catálogo `cfg`, no un ítem del instrumento de valoración. Evita que una atención grupal se vuelva "una respuesta más".

`prg.actividad`, cambios y personas: igual que A.

`doc.*`: igual que A.

`aud.borrador`: igual que A, `nvarchar(max)` solo en borrador.

### C.3 Proyección

`anl.caso_resumen`, una fila por caso, PK `caso_id`.

| Columna | Uso |
| --- | --- |
| `per_id_persona` | Persona única. |
| `establecimiento_id`, `oficina_local_id`, `region_id` | Ámbito snapshot. |
| `estado` | Activo o cerrado. |
| `prioridad_codigo` | Vigente. |
| `motivo_cierre_codigo` null | |
| `tiene_explicacion_otro` bit | No guarda el texto. La nube se calcula del cierre operativo. |
| `fecha_apertura`, `fecha_cierre` null | |
| `reconstruido_en` datetime2(0) | |

No guarda sexo ni nacimiento. Esas dimensiones siguen en el adaptador, también en C. Copiarlas en la proyección reintroduciría maestros externos en una tabla de consulta y envejecería la edad. Se rechaza dentro de esta misma propuesta.

`anl.atencion_efectiva`: una fila por atención individual confirmada y una fila por participación grupal con `asistio = 1`. Columnas: `caso_id`, `per_id_persona`, `fecha_atencion`, `tipo_codigo`, `origen` CHECK `INDIVIDUAL` o `GRUPAL`, `origen_id`. Único (`origen`, `origen_id`, `per_id_persona`). La grupal aporta varias filas de persona y un solo `origen_id`. Contar actividades es `COUNT(DISTINCT origen_id)` o, para individuales, una fila por actividad. Contar personas del KPI es `COUNT(DISTINCT per_id_persona)` unido al caso activo.

`anl.motivo_referencia`: `referencia_id`, `item_id`, ámbito territorial y `fecha_referencia`. Una fila por motivo seleccionado.

`anl.cancelacion`: `actividad_id`, `fecha`, ámbito, `motivo` nvarchar(500).

Estas cuatro tablas se escriben en la misma transacción que el hecho. No hay job. Si la transacción revierte, la proyección también.

`anl.reconciliacion` no es una tabla permanente. El procedimiento de reconstrucción, futuro y explícito, borra la proyección de un ámbito o de un caso y la vuelve a llenar desde `cas`, `ate`, `ref` y `prg`. No se crea ahora como objeto ejecutable. El diseño lo exige como capacidad: la proyección es derivada y desechable.

`anl.informe`, `anl.visualizacion`, `anl.agregado`: igual que A.

## D. Integridad

INV-01, INV-02 e INV-03 usan el mismo índice filtrado y el mismo `UPDLOCK` sobre `idn.persona` que la propuesta A.

INV-05, INV-10, INV-12 e INV-14 iguales que A.

INV-07: las respuestas de una valoración confirmada no se actualizan. Una revaloración es otra cabecera. El instrumento no autoriza a "editar el formulario histórico".

INV-08: la fila de prioridad tiene `origen_calculo = MATRIZ` y la versión. El servicio solo la inserta después de leer `cfg.matriz_prioridad`. No hay ítem que permita a la persona usuaria elegir Alto, Moderado o Bajo como si fuera un motivo.

INV-09: regla de transacción sobre secciones. Más fácil de expresar mal que en A, porque `Ninguno` es un ítem entre otros. La regla tiene que conocer `cfg.seccion` y `tipo_respuesta`. Se compensa con pruebas por versión de instrumento, no con un CHECK trivial.

INV-17: igual `rowversion` de la posible referencia.

Integridad de la proyección: no se considera violada si está vacía, porque la consulta operativa sigue siendo válida. Se considera incidente si existe y no cuadra con el operativo. Por eso ningún KPI puede leer solo la proyección sin poder citar la consulta de reconstrucción. La implementación futura debe poder ejecutar las dos y comparar N y D en prueba.

La doble escritura puede olvidarse en un camino nuevo, por ejemplo un cierre por traslado que actualice `cas.cierre` y no `anl.caso_resumen`. El diseño obliga a que el cierre pase por una sola operación de dominio, no por dos repositorios independientes. Es una regla de arquitectura de aplicación, no un constraint.

## E. Consultas y reportería

Camino preferente de los gráficos 1, 4, 5, 6, 7 y 8: proyección, siempre filtrada por ámbito.

Camino de verdad, el que debe poder repetirse:

1. `cas.caso` agrupado por establecimiento.
2 y 3. Adaptador, igual que A y B. La proyección no los acelera.
4. `cas.caso.prioridad_vigente`.
5. `cas.caso.estado`.
6. `prg` canceladas, o `anl.cancelacion` si se demuestra igual.
7. `ref.respuesta` de ítems motivo, o `anl.motivo_referencia`.
8. Cabeceras `ate`, no filas de participante. La proyección cuenta personas con `DISTINCT per_id_persona` y actividades con `DISTINCT origen + origen_id`.
9. `cas.cierre`.
10. Texto en `cas.cierre`, no en la proyección.
11 y 12. La consulta autoritativa es la de A, sobre `cas.caso` y `ate`. La proyección equivalente es:

```sql
WITH d AS (
    SELECT caso_id, per_id_persona
    FROM anl.caso_resumen
    WHERE estado = N'ACTIVO'
      AND region_id = @region_id
),
n AS (
    SELECT DISTINCT e.per_id_persona
    FROM anl.atencion_efectiva AS e
    JOIN d ON d.caso_id = e.caso_id
    WHERE e.fecha_atencion >= @inicio_anio
      AND e.fecha_atencion < @fin_anio
)
SELECT
    denominador = (SELECT COUNT(*) FROM d),
    numerador = (SELECT COUNT(*) FROM n);
```

Si esta cuenta y la operativa difieren, manda la operativa y la proyección se reconstruye. Así se evita la ambigüedad eliminatoria de un KPI que solo viva en una tabla derivada.

El porcentaje se calcula una vez por ámbito efectivo. Sumar N y D de las Oficinas Locales de una región reproduce el D regional solo porque INV-01 impide que la misma persona tenga dos casos activos en dos oficinas. La proyección no cambia esa propiedad.

Filtros de disciplina o profesional: no están en `anl.caso_resumen`. Esas visualizaciones vuelven al detalle `ate` para no ampliar columnas "por si acaso". Si el filtro no aplica a motivos de cierre o a cobertura, no se usa.

Inicio y casos sin atención leen operación o proyección de activos más `NOT EXISTS` sobre `anl.atencion_efectiva`. Misma regla de autoridad.

## F. Integración

Igual que A. El instrumento de referencia no guarda el payload de CAH. El snapshot sigue siendo `ref.contexto`, columnas explícitas, porque impresión y edad histórica son un contrato fijo de RF-116, no un formulario extensible. Poner el teléfono familiar como "respuesta de instrumento" ocultaría un dato sensible dentro de un EAV. Se mantiene columna nombrada.

La señal de posible referencia tampoco entra al instrumento.

## G. Seguridad

El instrumento concentra texto clínico en `ses.respuesta.texto` y `ref.respuesta.texto`. Un permiso de lectura grosero sobre esa tabla expone factores, motivos y especificaciones juntos. Hace falta autorización por tipo de instrumento y por ámbito del hecho padre, no un rol de lectura del esquema `ses` entero.

La proyección omite texto de cierre y demografía. Es más segura para reportería agregada que leer el expediente. Sigue sin ser control de acceso: el servicio aplica el ámbito antes de leer `anl`.

Vistas por rol, propuestas: `cas.lista_establecimiento` sin joins a `ses.respuesta`. Regional puede leer informe e historia según RF-056; el detalle de factores sigue siendo sensible y RF-103 no lista aún qué queda excluido. NEEDS_VALIDATION. Hasta entonces, regional ve lo que RF-056 confirma: resumen, línea de tiempo y plan vigente, no un volcado de respuestas.

Borradores y claves de archivo iguales que A.

## H. Evolución

Es la propuesta mejor preparada para un instrumento nuevo: sección e ítems, no `ALTER TABLE`. También es la más fácil de usar mal, si un ítem `TEXTO` sustituye un dato que ya tenía regla.

Exploratorios:

- Sugerencia de niveles: ítem con `origen_calculo = SUGERENCIA` en una tabla `ses.sugerencia_respuesta`, nunca en la respuesta profesional. No se crea la tabla ahora. El CHECK futuro impediría copiarla a `origen_calculo = MATRIZ` o a la respuesta de nivel profesional.
- Asistente: vistas de `anl` ya acotadas, más auditoría. Sin acceso directo a `ses.respuesta` salvo campos permitidos explícitamente.
- Nuevos tipos de atención: catálogo, no instrumento.

No se deja FK de continuidad "apagada".

## I. Costos y riesgos

Mayor costo de comprensión. Quien consulte motivos debe saber el `codigo` del ítem, no el nombre de una tabla `ref_motivo`. Hace falta un diccionario de códigos de instrumento junto al modelo. Sin ese diccionario, la propuesta es frágil.

Doble escritura: riesgo de proyección vieja. Mitigado porque no es fuente de verdad, pero dos caminos de lectura pueden mostrar cifras distintas hasta reconciliar. Hay que enseñar cuál manda.

Rendimiento nacional de los gráficos 1, 4, 5, 7 y 8 mejora si la proyección está sana. Sexo y edad no mejoran.

Implementación más larga que A y similar o algo menor que B en reglas de estado, mayor que ambas en instrumento.

Migración de una versión de instrumento es inserción de catálogo. Migración de la proyección es reconstrucción, reversible si las tablas operativas están bien.

El riesgo de error más serio es tratar `Ninguno` como "no hay filas" dentro del instrumento genérico. La propuesta lo prohíbe, y las pruebas tienen que demostrarlo con una sección requerida vacía.

---

# Comparación estructural

| Eje | A. Expediente vigente | B. Hechos inmutables | C. Instrumento y proyección |
| --- | --- | --- | --- |
| Presente del caso | Columnas de estado y prioridad | Ausencia de cierre y máximo número | Igual que A |
| Unicidad del activo | Índice filtrado más bloqueo de persona | PK de `persona_caso_activo` | Igual que A |
| Valoraciones | Filas con bandera vigente | Solo inserts, vigente por número | Cabeceras como A, detalle por instrumento |
| Plan | Versiones con bandera | Versiones, vigente por número | Igual que A |
| Motivos y factores | Tablas propias | Tablas propias inmutables | Respuestas tipadas |
| Atención grupal | Una cabecera, N participantes | Igual, asistencia obligatoria al confirmar | Igual que A, más proyección |
| Programación | Fila mutable más historial | Transiciones; participantes fijos al crear | Igual que A |
| Reportería | Consulta operativa | Consulta con "último hecho" | Proyección reconstruible; manda la operativa |
| Sexo y edad | Adaptador | Adaptador | Adaptador |
| Continuidad de traslado | No existe | No existe | No existe |
| JSON / trigger / temporal | No, salvo borrador `nvarchar(max)` | No | No, salvo borrador |
| Hueco principal | `Ninguno` entre tablas | Ancla que debe borrarse al cerrar; consultas de vigente | Instrumento mal leído y proyección olvidada |

Las tres pueden calcular los doce gráficos y el KPI sin promediar porcentajes. Las tres separan programación de atención. Las tres congelan el snapshot de referencia y dejan el maestro en SIDINACC.

La selección no se hace en este documento.
