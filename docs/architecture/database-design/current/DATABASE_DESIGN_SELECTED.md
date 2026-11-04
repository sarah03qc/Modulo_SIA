# Diseño seleccionado de SIA_CENCINAI

**Estado:** PROPUESTO. Arquitectura candidata con los cambios de la evaluación. No es aprobación institucional ni DDL ejecutado.
**Veredicto que la origina:** `APPROVED_WITH_CHANGES` de A-02 sobre la propuesta A, más las condiciones de A-09 y A-07. Ver `SIA_DATABASE_EVALUATION.md`.
**Motor:** Microsoft SQL Server. Base lógica `SIA_CENCINAI`, esquema `dbo`.
**No incluye:** tablas de `SIDINACC_LOCAL`, caso sucesor, estado Pendiente de continuidad, EDIN II, EVADE, vigilancia paralela ni asignación de establecimientos.

## 1. Justificación

Se adopta el expediente operativo con estado vigente e historial explícito. La fila del caso responde bandejas y el índice único filtrado impide dos activos. Valoraciones, planes, cierres y snapshots no se reescriben.

No se adoptó el modelo de hechos inmutables: su ancla y la ausencia de cierre no son la misma regla, y una consulta puede contar un caso cerrado como activo. No se adoptó el instrumento genérico con proyección: concentra texto clínico y puede mostrar dos cifras de cobertura.

Los cambios posteriores a la evaluación cierran la prioridad por clave foránea, la exclusión de `Ninguno` por clave foránea, la persona de la atención individual, la autoridad del vigente, el borrador fuera de auditoría y la lista mínima de Establecimiento.

## 2. Dominios

| Dominio | Tablas | Qué no guarda |
| --- | --- | --- |
| Vínculo | `vinculo_persona` | Nombre, sexo, nacimiento, establecimiento vivo. |
| Configuración | `cat_*` | Ítems institucionales no escritos en v0.7. |
| Referencia | `ref_*` | Resultados nutricionales ni variables de tamizaje. |
| Sesión y valoración | `ses_*` | Intensidad, frecuencia y persistencia. Sugerencia automática de niveles. |
| Caso y plan | `caso_*` | Caso destino. Continuidad. |
| Atención | `ate_*` | Copia de la grupal por participante. |
| Programación | `prog_*` | Estado Vencida. Atención generada sola. |
| Documentos y gestión | `doc_*` | Binario del archivo. |
| Informe | `inf_*` | Microdato de cada gráfico. |
| Borrador | `bor_captura` | No es auditoría ni reportería. |
| Auditoría y migración | `aud_*` | Texto clínico y payload de filas rechazadas. |

Vista de columnas, no tabla: `caso_lista_establecimiento`.

## 3. Decisiones de diseño propuestas

Separadas de los requisitos confirmados.

| ID | Decisión | Razón | Estado |
| --- | --- | --- | --- |
| DD-01 | `bigint IDENTITY` como PK de hechos SIA. `nvarchar(20)` para `per_id_persona`. | Volumen de factores y participaciones. Misma longitud que la réplica. Sin GUID. | PROPUESTO |
| DD-02 | Índices territoriales `int`, sin copiar el desajuste `tinyint`/`int` de la réplica. | SIA no hereda un defecto de tipo entre Región y Oficina Local. | PROPUESTO |
| DD-03 | El consecutivo se asigna al enviar, no al abrir el borrador. | Un borrador no es referencia enviada (RN-028). | PROPUESTO |
| DD-04 | Los borradores viven solo en `bor_captura`. Las tablas operativas nacen confirmadas o enviadas. | H-01 y H-05. Evita que un motivo en borrador entre en la visualización 7. | PROPUESTO |
| DD-05 | Se conservan `riesgo_vigente`, `proteccion_vigente` y `prioridad_vigente` como caché de la misma transacción. La lectura oficial es `valoracion_vigente_id`. | Cambio 4 de A-02. La conciliación debe devolver cero filas. | PROPUESTO |
| DD-06 | `Ninguno` y la matriz se garantizan con FK, no con trigger. | Cambios 1 y 2 de A-02. | PROPUESTO |
| DD-07 | Línea de tiempo por consulta, no por tabla de copia. | RF-057 sin duplicar la atención. | PROPUESTO |
| DD-08 | Sexo y edad actual se resuelven en el adaptador en el momento de la consulta. | RF-089. `fecha_nacimiento_informada` solo documenta la edad congelada de la referencia. | PROPUESTO |
| DD-09 | Actividad reprogramada permanece en estado `REPROGRAMADA` sobre la misma fila. No se crea otra actividad. | RF-076 dice actualizar. Si la operación esperara una fila nueva, es NEEDS_VALIDATION. | PROPUESTO |
| DD-10 | Vencida = `estado = PROGRAMADA` y `fecha_vigente <` fecha de consulta. | RN-016. No es un estado. | PROPUESTO |
| DD-11 | Motivo de cancelación es texto. No se siembra un catálogo no escrito. | NV-CANCELACION. El Top-N agrupa el texto exacto. | PROPUESTO |
| DD-12 | Estados e instituciones de coordinación y tipos documentales no se siembran como norma. Hay texto histórico además del ítem opcional. | La estructura está confirmada; los valores no. | PROPUESTO |
| DD-13 | El archivo queda fuera de la base. La columna guarda una clave opaca. | H-09. El repositorio vuelve a autorizar. | PROPUESTO |
| DD-14 | Informe reproducible por agregados ya mostrados, no por copia de expedientes ni por tablas temporales. | RF-131 y el encargo de no guardar todos los microdatos. | PROPUESTO |
| DD-15 | Sin RLS en esta candidatura. El ámbito es predicado de servicio y, donde aporta, concesión de columnas o de vista. | La autorización institucional no está en esta base (RF-104). | PROPUESTO |
| DD-16 | No hay padrón nominal obligatorio de la sesión. Solo disciplinas. | v0.7 obliga disciplinas. El padrón nominal sigue NEEDS_VALIDATION. | PROPUESTO |

## 4. Tipos, nulos y fechas

| Uso | Tipo |
| --- | --- |
| Identificador SIA | `bigint IDENTITY(1,1)` |
| Persona institucional | `nvarchar(20)` |
| Usuario institucional | `nvarchar(128)` |
| Códigos cerrados | `nvarchar(30)` con `CHECK` |
| Etiquetas y títulos | `nvarchar(200)` a `nvarchar(400)` |
| Texto clínico o explicación | `nvarchar(1000)`, `nvarchar(2000)` o `nvarchar(4000)` según la tabla. No `nvarchar(max)` fuera de `bor_captura`. |
| Entero territorial | `int` |
| Fecha de hecho | `date` |
| Hora de sesión | `time(0)` |
| Instante de registro | `datetime2(0)` |
| Concurrencia | `rowversion` |
| Indicador | `bit` |
| Edad congelada | `smallint` |
| Valor de gráfico | `decimal(18,4)` |
| Orden de visualización | `tinyint` o `int` |

`NULL` significa dato no aportado por la fuente o no aplicable al estado, y se dice en cada columna. No se usa `NULL` para `Ninguno`, pendiente de revisión ni desconocido clínico. Esos tienen fila o código.

Toda fila operativa distingue, cuando el hecho lo exige:

- fecha del hecho (`date`);
- instante de registro (`datetime2(0)`);
- usuario responsable y, si puede diferir, digitador.

No se usa `datetime` legado, `float`, `text`, `ntext` ni `image`.

## 5. Catálogos y matriz

### 5.1 `cat_version`

| Columna | Tipo | Nulo | Restricción |
| --- | --- | --- | --- |
| `cat_version_id` | bigint | no | PK |
| `codigo_catalogo` | nvarchar(40) | no | |
| `numero_version` | int | no | Único (`codigo_catalogo`, `numero_version`) |
| `vigente` | bit | no | Índice único filtrado por `codigo_catalogo` donde `vigente = 1` |
| `vigente_desde` | date | no | |

Códigos de catálogo estables: `VIA_ATENCION`, `ORIGEN_REFERENCIA`, `MOTIVO_REFERENCIA`, `DISCIPLINA`, `ESTRATEGIA`, `FRECUENCIA`, `TIPO_ACTIVIDAD_PROGRAMADA`, `TIPO_ATENCION`, `MOTIVO_CIERRE`, `INSTITUCION_COORDINACION`, `ESTADO_COORDINACION`, `TIPO_DOCUMENTO`.

### 5.2 `cat_item`

| Columna | Tipo | Nulo | Restricción |
| --- | --- | --- | --- |
| `cat_item_id` | bigint | no | PK |
| `cat_version_id` | bigint | no | FK `cat_version` |
| `codigo_catalogo` | nvarchar(40) | no | Igual al de su versión. No se actualiza. |
| `codigo` | nvarchar(80) | no | Único (`cat_version_id`, `codigo`) |
| `etiqueta` | nvarchar(300) | no | |
| `orden` | int | no | |
| `requiere_texto` | bit | no | `OTRO` de cierre nace en 1 |
| `ambito` | nvarchar(40) | sí | Solo motivos de riesgo de referencia |
| `activo` | bit | no | Desactivar no borra |

Una fila ya referenciada no cambia `codigo`, `codigo_catalogo` ni `etiqueta`. Una versión nueva inserta ítems nuevos. `ON DELETE NO ACTION`. `ON UPDATE NO ACTION`.

Única (`cat_item_id`, `codigo_catalogo`). Cada FK de negocio apunta a esa pareja y la columna de catálogo del hijo tiene `CHECK` con un solo código. Así un motivo de cierre no puede guardarse como vía de atención ni una disciplina como estrategia. La relación del diagrama hacia `cat_item` representa esa FK compuesta. Ejemplo: `ref_referencia.via_item_id` más `via_catalogo` con `CHECK (via_catalogo = N'VIA_ATENCION')`. El mismo patrón aplica a origen, motivo, disciplina, estrategia, frecuencia, tipo de atención, tipo de programación y motivo de cierre.

Semilla confirmada:

- Vía: `URGENCIA`, `NO_INMEDIATA`.
- Origen: `VIGILANCIA_TAMIZAJE`, `OBSERVACION`, `INFORMACION_FAMILIA_U_OTROS`, `REFERENCIA_EXTERNA`.
- Motivos: `CONDICION_MALNUTRICION`, `MALNUTRICION_NECESIDADES_ESPECIALES`, `EDIN_II_RIESGO_RETRASO_ROJO`, `EVADE_RIESGO_REZAGO_0_1`, `OTRA_CONDICION_SALUD`.
- Cierre: `CIERRE_SATISFACTORIO`, `TRASLADO`, `OTRO` con `requiere_texto = 1`.
- Frecuencia: `TRIMESTRAL`, `SEMESTRAL`, `SEGUN_NECESIDAD`.
- Programación: `SESION_INTERDISCIPLINARIA`, `VISITA_ESTABLECIMIENTO_AI`.

No se siembran disciplinas, factores de riesgo de referencia, estrategias, tipos de atención restantes, visita domiciliaria, instituciones ni estados de coordinación.

### 5.3 `cat_matriz_prioridad`

| Columna | Tipo | Nulo | Restricción |
| --- | --- | --- | --- |
| `matriz_version_id` | bigint | no | FK `cat_version` del catálogo `MATRIZ_PRIORIDAD` |
| `riesgo_codigo` | nvarchar(20) | no | CHECK `ALTO`, `MODERADO`, `BAJO` |
| `proteccion_codigo` | nvarchar(20) | no | CHECK `ALTA`, `MODERADA`, `BAJA` |
| `prioridad_codigo` | nvarchar(20) | no | CHECK `ALTO`, `MODERADO`, `BAJO` |

PK y única de negocio: (`matriz_version_id`, `riesgo_codigo`, `proteccion_codigo`).
Única de comprobación, exigida por la evaluación: (`matriz_version_id`, `riesgo_codigo`, `proteccion_codigo`, `prioridad_codigo`).

La versión 1 contiene exactamente las nueve filas de RN-009. No hay fila que permita elegir la prioridad a mano.

### 5.4 Instrumento de valoración

`cat_instrumento_version`: `instrumento_version_id` PK, `numero_version` int único, `vigente` bit, `vigente_desde` date.

`cat_instrumento_categoria`: `categoria_id` PK, FK a la versión, `eje` CHECK `PROTECTOR`, `RIESGO`, `SIGNO_ALERTA`, `ambito` CHECK `INDIVIDUAL`, `HOGAR_FAMILIAR`, `COMUNITARIO`, `es_requerida` bit, `orden` int. Único (`instrumento_version_id`, `eje`, `ambito`).

`cat_instrumento_factor`: `factor_id` PK, FK `categoria_id`, `codigo`, `etiqueta`, `es_abierto` bit, `orden`, `activo`. Único (`categoria_id`, `codigo`). No hay factor `es_ninguno`: `Ninguno` no es un factor seleccionable. No hay columnas de intensidad, frecuencia ni persistencia.

Los factores concretos y qué categorías son requeridas quedan sin semilla. `es_requerida` es configuración de la versión. NEEDS_VALIDATION.

### 5.5 `cat_codigo_region_referencia`

`region_id` int PK, `codigo` nvarchar(2) único. Semilla confirmada de RF-114: CS, HN, CH, HC, BR, CN, PC, CO, CE, asociada al identificador institucional de Región cuando el mapa esté confirmado. Si un `region_id` de la réplica aún no tiene fila, el envío no inventa el código: falla y queda NEEDS_VALIDATION de ese mapa, no de la existencia de los nueve códigos.

## 6. Vínculo de persona

### `vinculo_persona`

| Columna | Tipo | Nulo | Restricción |
| --- | --- | --- | --- |
| `per_id_persona` | nvarchar(20) | no | PK. Igual a `CAF_PERSONA.PER_idPersona`. Sin FK externa. |
| `primera_operacion_en` | datetime2(0) | no | |
| `fila_version` | rowversion | no | |

Categoría: SYSTEM_OWNED, ancla técnica. Toda referencia, caso, posible referencia, participante y persona programada tiene FK a esta PK. La fila se crea en la misma transacción, antes del hecho, con `MERGE ... WITH (HOLDLOCK)`.

## 7. Referencia

### `ref_referencia`

Estados CHECK: `PENDIENTE_REVISION`, `ADMITIDA_AI`, `NO_REQUIERE_AI`. No hay `BORRADOR` ni `RECIBIDA`.

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `referencia_id` | bigint | no | PK |
| `per_id_persona` | nvarchar(20) | no | FK `vinculo_persona` |
| `estado` | nvarchar(30) | no | CHECK |
| `fecha_referencia` | date | no | Hecho |
| `via_item_id` | bigint | no | FK `cat_item` |
| `origen_item_id` | bigint | no | FK `cat_item` |
| `responsable_usuario` | nvarchar(128) | no | Identidad autenticada. No se actualiza. |
| `acciones_previas` | nvarchar(2000) | sí | NULL = no se registraron acciones |
| `resultados_previos` | nvarchar(2000) | sí | Campo distinto |
| `informacion_complementaria` | nvarchar(2000) | sí | Campo distinto |
| `origen_captura` | nvarchar(20) | no | CHECK `MANUAL`, `PLANTILLA` |
| `plantilla_version` | nvarchar(40) | sí | Obligatoria si `PLANTILLA`, regla de transacción |
| `consecutivo` | nvarchar(80) | no | Único. Se asigna al enviar. |
| `establecimiento_id` | int | no | Del niño |
| `oficina_local_id` | int | no | Snapshot |
| `region_id` | int | no | Snapshot |
| `enviada_en` | datetime2(0) | no | Inmutable |
| `enviada_por` | nvarchar(128) | no | Inmutable |
| `creada_en` | datetime2(0) | no | |
| `creada_por` | nvarchar(128) | no | En referencia coincide con el responsable |
| `fila_version` | rowversion | no | |

Índices: único de `consecutivo`; `(oficina_local_id, estado, enviada_en)`; `(establecimiento_id, estado)`; `(per_id_persona, estado)`.

Después del envío no se actualizan motivos, textos, responsable, consecutivo, ámbito ni comprobante de envío. El único cambio de la fila es `estado`, cuando la resolución admite o rechaza el ingreso.

### `ref_contexto`

PK y FK `referencia_id`. Relación 1:1. Todas las columnas de contenido son anulables porque la fuente puede no traerlas.

`encargado_nombre` nvarchar(200), `relacion_encargado` nvarchar(80), `contacto` nvarchar(80), `direccion` nvarchar(200), `servicios_texto` nvarchar(500), `region_nombre` nvarchar(200), `oficina_local_nombre` nvarchar(200), `establecimiento_nombre` nvarchar(200), `edad_anios` smallint, `fecha_nacimiento_informada` date.

CHECK `edad_anios` entre 0 y 120 si no es nulo. `fecha_nacimiento_informada` solo explica la edad congelada. Las visualizaciones 2 y 3 no la usan. No hay `UPDATE` concedido.

Categoría: SNAPSHOT.

### `ref_motivo`

`motivo_id` bigint PK, `referencia_id` FK, `cat_item_id` FK, `especificacion` nvarchar(1000) null. Único (`referencia_id`, `cat_item_id`). Si en el borrador se quita un motivo, la fila no llega a insertarse. Después del envío no se borran motivos. Categoría: SYSTEM_OWNED.

### `ref_impresion`

`impresion_id` bigint PK, `referencia_id` FK, `usuario` nvarchar(128), `impresa_en` datetime2(0). Append-only. No toca `enviada_en`.

### `ref_posible`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `posible_id` | bigint | no | PK |
| `per_id_persona` | nvarchar(20) | no | FK vínculo |
| `establecimiento_id` | int | no | |
| `oficina_local_id` | int | no | |
| `region_id` | int | no | |
| `criterio_codigo` | nvarchar(80) | no | Señal, no diagnóstico |
| `fecha_deteccion` | date | no | |
| `id_externo` | nvarchar(80) | sí | NULL hasta contrato UTIC |
| `sistema_origen` | nvarchar(40) | sí | |
| `estado` | nvarchar(30) | no | CHECK `PENDIENTE`, `REFERENCIA_CREADA` |
| `referencia_id` | bigint | sí | FK. Único filtrado donde no es nulo |
| `fila_version` | rowversion | no | |

Índice único filtrado PROPUESTO (`per_id_persona`, `criterio_codigo`, `establecimiento_id`) donde `estado = PENDIENTE`. Es prevención técnica de duplicado visible. La regla institucional de equivalencia sigue NEEDS_VALIDATION. No se siembra un descarte.

### `ref_consecutivo_control`

PK (`establecimiento_id`, `anio` smallint). `ultimo_numero` int no nulo. Se incrementa con `UPDLOCK, HOLDLOCK`. El consecutivo armado incluye código de región, Oficina Local, establecimiento, serie y año. La unicidad final la da el índice de `ref_referencia.consecutivo`.

## 8. Sesión, valoración y resolución

### `ses_sesion`

`sesion_id` PK, `oficina_local_id` int no nulo, `fecha` date, `hora_inicio` time(0), `hora_fin` time(0), `lugar` nvarchar(200), `creada_en`, `creada_por`, `fila_version`. CHECK `hora_fin > hora_inicio`. Puede existir sin situaciones. No es atención ni actividad programada. No hay FK obligatoria hacia `prog_actividad`.

### `ses_disciplina`

PK (`sesion_id`, `disciplina_item_id`). FK sesión y `cat_item`. Al menos una disciplina al confirmar la sesión: regla de transacción, porque un CHECK no cuenta hijas.

### `ses_situacion`

`situacion_id` PK, `sesion_id` FK, `referencia_id` bigint null FK, `caso_id` bigint null FK `caso_ai`.

CHECK (`referencia_id IS NOT NULL AND caso_id IS NULL`) OR (`referencia_id IS NULL AND caso_id IS NOT NULL`).

Único filtrado (`sesion_id`, `referencia_id`) donde la referencia no es nula. Único filtrado (`sesion_id`, `caso_id`) donde el caso no es nulo.

La primera valoración de una referencia usa la situación de referencia. La revaloración de un caso activo usa la situación de caso. Una misma referencia no entra dos veces en la sesión.

### `ses_valoracion`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `valoracion_id` | bigint | no | PK |
| `situacion_id` | bigint | no | FK |
| `caso_id` | bigint | sí | FK `caso_ai`. Solo pasa de NULL a valor, una vez. |
| `referencia_id` | bigint | no | FK. En revaloración es la referencia de origen del caso. |
| `instrumento_version_id` | bigint | no | FK |
| `numero` | int | no | |
| `es_vigente` | bit | no | |
| `matriz_version_id` | bigint | no | Parte de la FK a la matriz |
| `riesgo_codigo` | nvarchar(20) | no | Parte de la FK |
| `proteccion_codigo` | nvarchar(20) | no | Parte de la FK |
| `prioridad_codigo` | nvarchar(20) | no | Parte de la FK. No editable por el usuario. |
| `responsable_usuario` | nvarchar(128) | no | |
| `fecha_valoracion` | date | no | |
| `confirmada_en` | datetime2(0) | no | |
| `fila_version` | rowversion | no | |

Único (`referencia_id`, `numero`) donde `caso_id` es nulo.
Único (`caso_id`, `numero`) donde `caso_id` no es nulo.
Único filtrado (`caso_id`) donde `es_vigente = 1` y `caso_id` no es nulo.
Único filtrado (`referencia_id`) donde `es_vigente = 1` y `caso_id` es nulo. Evita dos valoraciones vigentes de la misma referencia antes de abrir el caso.

FK:

```text
(matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo)
  -> cat_matriz_prioridad (matriz_version_id, riesgo_codigo, proteccion_codigo, prioridad_codigo)
```

Una combinación que no esté en RN-009 para esa versión no se inserta. El usuario no escribe `prioridad_codigo`.

No existe estado `BORRADOR` en esta tabla. El borrador está en `bor_captura`. Toda fila de `ses_valoracion` está confirmada.

Concesión de `UPDATE` del rol de aplicación, solo sobre `es_vigente` y `caso_id`. Sin `UPDATE` de factores, categorías, riesgo, protección, prioridad, textos, instrumento ni responsable. `caso_id` solo se asigna donde está NULL.

### `ses_valoracion_categoria`

PK (`valoracion_id`, `categoria_id`). `respuesta` nvarchar(20) CHECK `NINGUNO` o `FACTORES`.
Única (`valoracion_id`, `categoria_id`, `respuesta`), necesaria para la FK hija.

Al confirmar, cada categoría con `es_requerida = 1` tiene exactamente una fila. Una categoría sin fila no es `Ninguno`. Las no requeridas pueden no tener fila. Qué categorías son requeridas: NEEDS_VALIDATION, leído de `cat_instrumento_categoria`.

### `ses_valoracion_factor`

`valoracion_factor_id` PK, `valoracion_id`, `categoria_id`, `factor_id` FK `cat_instrumento_factor`, `especificacion` nvarchar(1000) null, `respuesta_enlace` nvarchar(20) no nulo con CHECK `FACTORES` y valor por defecto `FACTORES`.

FK:

```text
(valoracion_id, categoria_id, respuesta_enlace)
  -> ses_valoracion_categoria (valoracion_id, categoria_id, respuesta)
```

Si la categoría está en `NINGUNO`, no existe la clave `FACTORES` y el factor no entra. Único (`valoracion_id`, `factor_id`). El factor debe pertenecer a esa categoría: regla de transacción, porque el factor ya tiene FK a su categoría y la fila de respuesta apunta a la misma `categoria_id`. Una prueba debe rechazar un factor de otra categoría.

Sin `UPDATE` ni `DELETE` de aplicación sobre factores y categorías confirmados.

### `ses_resolucion`

`resolucion_id` PK, `referencia_id` FK única, `sesion_id` FK, `valoracion_id` FK, `decision` CHECK `REQUIERE_AI` o `NO_REQUIERE_AI`, `justificacion` nvarchar(2000) null, `responsable_usuario`, `fecha_decision` date, `registrada_en` datetime2(0).

CHECK: `decision = NO_REQUIERE_AI` implica `justificacion` con longitud mayor que cero tras recortar espacios. La admisión no exige justificación.

Al confirmar `NO_REQUIERE_AI`, la referencia pasa a `NO_REQUIERE_AI` y no se inserta caso. Al abrir el caso, la referencia pasa a `ADMITIDA_AI`. Una referencia tiene como máximo una resolución.

## 9. Caso, plan, cierre y traslado

### `caso_ai`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `caso_id` | bigint | no | PK |
| `per_id_persona` | nvarchar(20) | no | FK vínculo |
| `referencia_id` | bigint | no | FK única a `ref_referencia` |
| `estado` | nvarchar(20) | no | CHECK `ACTIVO`, `CERRADO` |
| `fecha_apertura` | date | no | |
| `abierto_en` | datetime2(0) | no | |
| `abierto_por` | nvarchar(128) | no | |
| `establecimiento_id` | int | no | Snapshot de origen. No se mueve. |
| `oficina_local_id` | int | no | |
| `region_id` | int | no | |
| `consecutivo_origen` | nvarchar(80) | no | Copia inmutable |
| `valoracion_vigente_id` | bigint | sí | FK `ses_valoracion`. Autoridad de lectura. Nulo solo a mitad de la transacción de apertura. |
| `plan_vigente_id` | bigint | sí | FK `caso_plan`. Igual ventana. |
| `riesgo_vigente` | nvarchar(20) | sí | Caché. No es la lectura oficial. |
| `proteccion_vigente` | nvarchar(20) | sí | Caché. |
| `prioridad_vigente` | nvarchar(20) | sí | Caché. |
| `fila_version` | rowversion | no | |

Única (`caso_id`, `per_id_persona`) para la FK de la atención individual.
Índice único filtrado `UX_caso_activo` sobre `per_id_persona` donde `estado = ACTIVO`.

Índices de bandeja: `(oficina_local_id, estado, prioridad_vigente)`, `(establecimiento_id, estado)`, `(region_id, estado)`.

La lectura de prioridad, riesgo y protección para bandeja, lista, detalle y visualización 4 usa la valoración apuntada por `valoracion_vigente_id`, que debe ser la fila `es_vigente = 1`. La caché se escribe en esa misma transacción. No se sustituye el puntero por `MAX(numero)`.

Conciliación, debe devolver cero filas:

```sql
SELECT c.caso_id
FROM dbo.caso_ai AS c
JOIN dbo.ses_valoracion AS v
  ON v.valoracion_id = c.valoracion_vigente_id
WHERE v.es_vigente <> 1
   OR v.caso_id <> c.caso_id
   OR c.riesgo_vigente <> v.riesgo_codigo
   OR c.proteccion_vigente <> v.proteccion_codigo
   OR c.prioridad_vigente <> v.prioridad_codigo
   OR (c.estado = N'ACTIVO' AND c.valoracion_vigente_id IS NULL)
   OR (c.estado = N'ACTIVO' AND c.plan_vigente_id IS NULL);
```

### `caso_estado_historial`

`historial_id` PK, `caso_id` FK, `estado` CHECK `ACTIVO` o `CERRADO`, `ocurrido_en` datetime2(0), `usuario` nvarchar(128), `motivo_item_id` bigint null FK. La apertura inserta `ACTIVO`. El cierre inserta `CERRADO`. Append-only.

### `caso_cierre`

PK = FK `caso_id`. Relación 1:0..1, pero un caso `CERRADO` sin esta fila es inválido.

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `caso_id` | bigint | no | PK y FK |
| `motivo_item_id` | bigint | no | FK `cat_item` |
| `explicacion` | nvarchar(2000) | sí | Obligatoria si el ítem tiene `requiere_texto = 1` |
| `fecha_cierre` | date | no | |
| `responsable_usuario` | nvarchar(128) | no | |
| `registrado_en` | datetime2(0) | no | |
| `destino_establecimiento_id` | int | sí | Solo traslado |
| `destino_oficina_local_id` | int | sí | Solo traslado |
| `destino_region_id` | int | sí | Solo traslado |
| `destino_nombre` | nvarchar(200) | sí | Texto institucional disponible. No es un caso. |

No existe `caso_destino_id`, `caso_origen_id` ni estado `PENDIENTE_CONTINUIDAD`.

La explicación obligatoria se comprueba en la transacción al leer `requiere_texto`. Un CHECK de tabla no ve el ítem. La semilla de `OTRO` nace con la bandera en 1 y esa fila de catálogo no se actualiza.

Destino no nulo solo si el código del motivo es `TRASLADO`. Si el motivo es otro, las cuatro columnas de destino quedan NULL. Regla de transacción.

Conciliación de estado y cierre, debe devolver cero filas:

```sql
SELECT c.caso_id
FROM dbo.caso_ai AS c
LEFT JOIN dbo.caso_cierre AS z
  ON z.caso_id = c.caso_id
WHERE (c.estado = N'CERRADO' AND z.caso_id IS NULL)
   OR (c.estado = N'ACTIVO' AND z.caso_id IS NOT NULL);
```

No se usa trigger ni vista indexada: SQL Server no permite el outer join necesario en una vista indexada de forma que impida la fila. La garantía es la transacción única más esta consulta en prueba y en operación.

### Plan

`caso_plan`: `plan_id` PK, `caso_id` FK, `numero_version` int, `es_vigente` bit, `frecuencia_item_id` FK, `responsable_usuario`, `fecha_plan` date, `registrado_en`, `fila_version`. Único (`caso_id`, `numero_version`). Único filtrado (`caso_id`) donde `es_vigente = 1`.

`caso_plan_proposito`: `proposito_id` PK, `plan_id` FK, `orden` int, `texto` nvarchar(1000). Único (`plan_id`, `orden`). Al menos uno al confirmar.

`caso_plan_estrategia`: PK (`plan_id`, `estrategia_item_id`).

`caso_plan_disciplina`: PK (`plan_id`, `disciplina_item_id`).

Una revaloración que cambia el abordaje inserta otra versión, apaga `es_vigente` de la anterior y apunta `caso_ai.plan_vigente_id` a la nueva. No se editan textos de la versión anterior. No abre otro caso.

## 10. Atenciones

### `ate_individual`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `atencion_individual_id` | bigint | no | PK |
| `caso_id` | bigint | no | |
| `per_id_persona` | nvarchar(20) | no | |
| `fecha_atencion` | date | no | Fecha real |
| `disciplina_item_id` | bigint | no | Una disciplina |
| `estrategia_item_id` | bigint | no | Tipo o estrategia |
| `acciones` | nvarchar(2000) | no | |
| `recomendaciones` | nvarchar(2000) | no | |
| `profesional_usuario` | nvarchar(128) | no | |
| `proxima_accion` | nvarchar(500) | sí | |
| `fecha_proxima` | date | sí | Solo si hay próxima acción |
| `digitador_usuario` | nvarchar(128) | no | Puede diferir |
| `digitada_en` | datetime2(0) | no | |

FK (`caso_id`, `per_id_persona`) → `caso_ai` (`caso_id`, `per_id_persona`). La persona contada no puede ser otra que la del caso.

Solo se inserta si el caso está `ACTIVO` en esa transacción. No hay estado borrador aquí. No hay `UPDATE` de fecha, textos ni disciplina después de confirmar. Corrección posterior: NEEDS_VALIDATION.

Índice `(caso_id, fecha_atencion)` y `(fecha_atencion, caso_id)`.

### `ate_grupal`

`atencion_grupal_id` PK, `oficina_local_id` int, `establecimiento_id` int null, `fecha_atencion` date, `tipo_item_id` bigint FK, `tema` nvarchar(500) no nulo, `lugar` nvarchar(200) null, `acciones` nvarchar(2000), `recomendaciones` nvarchar(2000), `digitador_usuario`, `digitada_en`. Sin `caso_id`. Una fila por actividad.

`ate_grupal_disciplina`: PK (`atencion_grupal_id`, `disciplina_item_id`).
`ate_grupal_profesional`: `profesional_id` PK, FK grupal, `profesional_usuario` nvarchar(128). Único (`atencion_grupal_id`, `profesional_usuario`).

### `ate_grupal_participante`

`participante_id` PK, `atencion_grupal_id` FK, `per_id_persona` FK vínculo, `caso_id` bigint null FK `caso_ai`, `asistio` bit null.

Único (`atencion_grupal_id`, `per_id_persona`).

`asistio` NULL = no confirmada, no cuenta. 1 = efectiva. 0 = no asistió, no cuenta. Al menos un participante al guardar. El tema ya es obligatorio en la cabecera.

Si hay caso activo de esa persona en el ámbito, `caso_id` se llena con ese caso y no con un caso cerrado. Si no hay caso activo, `caso_id` queda NULL y no se crea caso ni línea de tiempo. Los acompañantes no se insertan.

CHECK de transacción: si `caso_id` no es nulo, su `per_id_persona` es la de la participación. No se modela con la misma FK compuesta de la individual porque el caso es opcional. La prueba lo cubre.

Índice `(caso_id, atencion_grupal_id)` filtrado donde `caso_id` no es nulo y `asistio = 1`.

No hay trigger que copie la grupal a varias atenciones grupales ni que convierta una actividad programada en atención.

## 11. Programación

### `prog_actividad`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `actividad_id` | bigint | no | PK |
| `oficina_local_id` | int | no | |
| `establecimiento_id` | int | sí | NULL = actividad de la oficina, no de un establecimiento |
| `tipo_item_id` | bigint | no | FK |
| `titulo` | nvarchar(300) | no | |
| `fecha_prevista` | date | no | La original. No se pisa. |
| `fecha_vigente` | date | no | Igual a la prevista hasta una reprogramación |
| `estado` | nvarchar(20) | no | CHECK `PROGRAMADA`, `REALIZADA`, `REPROGRAMADA`, `CANCELADA` |
| `motivo_vigente` | nvarchar(500) | sí | Obligatorio si el estado es `REPROGRAMADA` o `CANCELADA` |
| `observaciones` | nvarchar(1000) | sí | |
| `creada_en` | datetime2(0) | no | |
| `creada_por` | nvarchar(128) | no | |
| `fila_version` | rowversion | no | |

CHECK: (`estado` en `REPROGRAMADA`, `CANCELADA` y `motivo_vigente` no vacío) OR (`estado` en `PROGRAMADA`, `REALIZADA`).

Índice `(oficina_local_id, estado, fecha_vigente)` y `(region` no está en la fila: la región se obtiene del catálogo institucional vía adaptador a partir de `oficina_local_id`, o se guarda snapshot). Para no depender del adaptador en cada lista nacional, se añade `region_id` int no nulo, snapshot de la Oficina Local al crear la actividad. Es identificador, no el maestro de Región.

Vencida no es valor de `estado`. Indicador: `estado = PROGRAMADA AND fecha_vigente <` fecha de consulta. Una actividad `REPROGRAMADA` no vuelve sola a `PROGRAMADA`. Si más adelante se exige que la nueva fecha genere otra alerta de vencimiento, será un cambio de regla, no una columna ya reservada.

### `prog_cambio`

Append-only. `cambio_id` PK, `actividad_id` FK, `numero` int único por actividad, `estado_anterior` nvarchar(20) null en el alta, `estado_nuevo`, `fecha_anterior` date null, `fecha_nueva` date null, `motivo` nvarchar(500) null, `usuario`, `ocurrido_en`. La creación inserta la primera fila `PROGRAMADA`.

### `prog_persona`

PK (`actividad_id`, `per_id_persona`). `caso_id` bigint null FK. Cero filas = actividad general. No programa a todos los casos del establecimiento. La asociación puede corregirse mientras la actividad sigue `PROGRAMADA`, mediante inserción o borrado de estas filas y una fila en `prog_cambio` que lo registre. No es el modelo rígido de la propuesta B.

`REALIZADA` no inserta `ate_individual` ni `ate_grupal`.

## 12. Documentos, coordinación y reporte individual

### `doc_documento`

`documento_id` PK, `caso_id` FK, `tipo_item_id` bigint null, `tipo_texto` nvarchar(120) null, `fecha_documento` date, `responsable_usuario` nvarchar(128), `nombre_original` nvarchar(260), `clave_almacen` nvarchar(200), `tamano_bytes` bigint, `creado_en` datetime2(0).

CHECK: `tipo_item_id` o `tipo_texto` no nulos. Sin `varbinary`. La clave no autoriza el archivo por sí sola. Regional y Nacional no la reciben mientras 17.4 no fije el permiso reforzado. Establecimiento no consulta esta tabla.

### `doc_coordinacion`

`coordinacion_id` PK, `caso_id` FK, `institucion_item_id` null, `institucion_texto` nvarchar(200) no nulo, `profesional_responsable` nvarchar(200) no nulo, `digitador_usuario` nvarchar(128) no nulo, `motivo` nvarchar(1000), `fecha_coordinacion` date, `estado_item_id` null, `estado_texto` nvarchar(80) no nulo, `fila_version`.

El responsable puede diferir del digitador. El cambio de estado inserta `doc_coordinacion_evento` y actualiza el texto o el ítem vigente. El evento conserva el valor anterior.

`doc_coordinacion_evento`: `evento_id` PK, FK coordinación, `estado_texto`, `estado_item_id` null, `usuario`, `ocurrido_en`. Append-only.

### `doc_reporte_caso`

`reporte_id` PK, `caso_id` FK, `tipo_proposito` nvarchar(200), `fecha_reporte` date, `responsable_usuario`, `motivo` nvarchar(1000), `creado_en`. Ninguna columna de `caso_ai` cambia en esta operación. No es el informe analítico ni el cierre. Plantillas definitivas: NEEDS_VALIDATION.

## 13. Informe analítico

### `inf_informe`

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `informe_id` | bigint | no | PK |
| `titulo` | nvarchar(300) | no | |
| `responsable_usuario` | nvarchar(128) | no | |
| `rol_codigo` | nvarchar(40) | no | |
| `ambito_nivel` | nvarchar(20) | no | CHECK `OFICINA_LOCAL`, `REGION`, `NACIONAL` |
| `region_id` | int | sí | Obligatorio si el nivel es regional |
| `oficina_local_id` | int | sí | Obligatorio si el nivel es oficina |
| `establecimiento_id` | int | sí | Filtro, no un nivel de informe de Establecimiento |
| `periodo_anio` | int | no | |
| `filtros_resumen` | nvarchar(2000) | no | Sin identificadores de persona ni texto clínico |
| `corte_en` | datetime2(0) | no | |
| `generado_en` | datetime2(0) | no | |
| `clave_archivo` | nvarchar(200) | sí | NULL hasta confirmar formato y retención |

CHECK de ámbito: `REGION` exige `region_id`; `OFICINA_LOCAL` exige `oficina_local_id`; `NACIONAL` puede llevar filtros inferiores nulos. No hay nivel `ESTABLECIMIENTO`. Establecimiento no tiene `SELECT` sobre `inf_*`.

### `inf_visualizacion`

`visualizacion_id` PK, `informe_id` FK, `codigo_visualizacion` tinyint CHECK entre 1 y 12, `orden` int, `titulo` nvarchar(400), `filtros` nvarchar(1000), `analisis` nvarchar(4000) no nulo. Único (`informe_id`, `codigo_visualizacion`). Único (`informe_id`, `orden`).

La transacción rechaza un informe con menos de 5 o más de 12 filas, análisis vacío o solo espacios, y un código repetido. Un CHECK de cabecera no cuenta hijas.

### `inf_agregado`

`agregado_id` PK, `visualizacion_id` FK, `orden` int, `etiqueta` nvarchar(300), `valor_numerico` decimal(18,4) null, `valor_texto` nvarchar(500) null. Guarda la barra, la porción, el top o la palabra ya mostrada. No guarda `per_id_persona`. La visualización 10 guarda tokens ya calculados, no la explicación completa. En un ámbito pequeño el token puede reidentificar. No se inventa umbral de supresión. Riesgo residual.

El informe no se aprueba ni se remite entre niveles. Corregir un análisis crea otro informe. El primero permanece.

## 14. Borrador, auditoría y migración

### `bor_captura`

No pertenece a auditoría.

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `borrador_id` | bigint | no | PK |
| `usuario` | nvarchar(128) | no | Solo el autor lo lee, hasta validar si la oficina puede verlo |
| `ambito_nivel` | nvarchar(20) | no | |
| `oficina_local_id` | int | sí | |
| `establecimiento_id` | int | sí | |
| `flujo` | nvarchar(40) | no | CHECK `REFERENCIA`, `SESION`, `VALORACION`, `ATENCION_INDIVIDUAL`, `ATENCION_GRUPAL` |
| `clave_negocio` | nvarchar(80) | sí | Sesión o caso ya existente, si aplica |
| `contenido` | nvarchar(max) | no | Captura incompleta. Único uso de max. |
| `actualizado_en` | datetime2(0) | no | |
| `fila_version` | rowversion | no | |

Al confirmar el hecho se borra el borrador del autor. No entra en reportería, exportaciones, lista de Establecimiento ni lectura regional o nacional. El evento de auditoría del borrador guarda acción y `borrador_id`, no `contenido`.

### `aud_evento`

`evento_id` PK, `ocurrido_en` datetime2(0), `usuario` nvarchar(128), `rol` nvarchar(40), `accion` nvarchar(40), `entidad` nvarchar(80), `entidad_id` nvarchar(40), `ambito` nvarchar(200), `codigo_cambio` nvarchar(80).

No hay columna de resumen libre. `codigo_cambio` es un código de estado, de catálogo o de acción (`ENVIO`, `APERTURA`, `CIERRE`, `LECTURA_VALORACION`). No se guarda el antes ni el después de factores, snapshot, explicación de Otro, atención ni análisis del informe. Las lecturas de valoración, snapshot, documento, explicación de Otro e informe también insertan evento, con identificador y sin el texto.

Índice `(entidad, entidad_id, ocurrido_en)` y `(usuario, ocurrido_en)`.

### Migración

`aud_migracion_lote`: `lote_id` PK, `fuente` nvarchar(200), `usuario`, `iniciado_en`, `cerrado_en` null, `filas_aceptadas` int, `filas_rechazadas` int.

`aud_migracion_error`: `error_id` PK, `lote_id` FK, `clave_externa` nvarchar(80), `codigo_error` nvarchar(40). Sin texto clínico ni fila de origen.

RF-101 queda preparado. No se ejecuta migración en este entregable.

## 15. Vista de Establecimiento

`caso_lista_establecimiento` expone solo:

- `caso_id`
- `per_id_persona`
- `establecimiento_id`
- `oficina_local_id`
- `region_id`
- `estado`
- `prioridad_codigo` de la valoración vigente
- `fecha_apertura`
- `fecha_cierre`, que puede ser nula

No expone riesgo, protección, factores, plan, atenciones, documentos, coordinaciones, motivo de cierre, explicación, destino ni snapshot familiar. La prioridad sale de `ses_valoracion` por `valoracion_vigente_id`, no de un `SELECT *` de esa tabla.

La vista no filtra filas. El servicio añade el predicado de establecimientos autorizados. El rol de Establecimiento no recibe `SELECT` sobre `caso_ai`, `ses_valoracion`, `caso_cierre`, `caso_plan*`, `ate_*`, `doc_*` ni `inf_*`. ASC2 y ASC3 usan el mismo rol de datos. El rótulo visual sigue pendiente y no crea otro rol.

## 16. Integridad que es constraint y la que es transacción

| Invariante | Constraint | Transacción o permiso |
| --- | --- | --- |
| Un activo por persona | `UX_caso_activo` | `HOLDLOCK` + `UPDLOCK` de `vinculo_persona` antes de referir o abrir |
| Prioridad = RN-009 | FK de cuatro columnas a la matriz | El servicio calcula el código; el usuario no lo envía |
| `Ninguno` sin factores | FK del factor hacia respuesta `FACTORES` | Categorías requeridas presentes al confirmar |
| Persona de la atención individual | FK compuesta al caso | El caso debe estar `ACTIVO` |
| Una referencia, un caso | Único de `referencia_id` | |
| Una referencia, una resolución | Único de `referencia_id` | Justificación si no requiere A.I. |
| Referencia una vez por sesión | Únicos filtrados de situación | |
| Una sugerencia, una referencia | Único filtrado de `ref_posible.referencia_id` | `rowversion` para la carrera |
| Consecutivo único | Único de columna | `UPDLOCK` del control por establecimiento y año |
| Un plan vigente y una valoración vigente | Únicos filtrados | Mover la bandera y el puntero juntos |
| Cierre con fila y estado | No hay constraint cruzado | Misma transacción. Conciliación en cero. |
| Caché de prioridad igual a la valoración | No | Conciliación en cero |
| Factor de la categoría correcta | No | Prueba de transacción |
| Explicación de Otro y destino solo en traslado | No, depende del ítem | Transacción al leer `requiere_texto` y el código |
| Borrador excluido | No está en las tablas operativas | `bor_captura` aparte |
| Ámbito | No hay RLS | Predicado en servicio. Vista solo de columnas. |
| Sin caso sucesor | Esas columnas no existen | |
| Programación no crea atención | No hay trigger | |

Aislamiento de trabajo: `READ COMMITTED`. El bloqueo de persona no exige `SERIALIZABLE` de tabla.

### 16.1 Protocolo de referencia y de apertura

1. `BEGIN TRAN`.
2. `MERGE vinculo_persona WITH (HOLDLOCK)` para la persona.
3. `UPDLOCK` de esa fila hasta el `COMMIT`.
4. Si existe `caso_ai` con esa persona y `estado = ACTIVO`, `ROLLBACK`.
5. Mensaje único, sin más consulta: «No es posible continuar porque la persona ya tiene un caso de Atención Interdisciplinaria activo.» No se leen oficina, establecimiento, profesional, prioridad ni identificador del otro caso para completar el error. El error de índice duplicado se traduce al mismo texto.
6. Envío: asignar consecutivo, insertar referencia `PENDIENTE_REVISION`, contexto y motivos.
7. Apertura: insertar caso `ACTIVO` con punteros aún nulos si hace falta ordenar FK circulares, insertar plan y valoración ya confirmados, actualizar punteros, caché e `es_vigente`, enlazar `caso_id` de la valoración donde estaba NULL, pasar la referencia a `ADMITIDA_AI`, insertar historial `ACTIVO`.
8. `COMMIT`.

Orden ante FK circular: la valoración puede nacer con `caso_id` NULL; el caso apunta a ella; luego se completa `caso_id`. El plan nace después del caso y después se apunta `plan_vigente_id`.

### 16.2 Cierre y traslado

Una transacción, con `UPDLOCK` del caso y de `vinculo_persona`:

1. El caso está `ACTIVO`.
2. Insertar `caso_cierre` con motivo, fecha, responsable y, si es traslado, destino documental.
3. Insertar historial `CERRADO`.
4. Actualizar `estado` a `CERRADO`.
5. Confirmar.

No se copian valoraciones ni planes. No se inserta caso nuevo. Una referencia posterior en el destino usa el protocolo 16.1 cuando ya no hay activo.

### 16.3 Revaloración

1. Bloquear el caso.
2. Insertar valoración nueva con `numero` siguiente, `es_vigente = 1`, FK de matriz y `caso_id` ya conocido.
3. Poner `es_vigente = 0` en la anterior. El único filtrado impide dos vigentes si el orden falla: se apaga la anterior antes de encender la nueva, o se inserta la nueva en 0 y luego se intercambian bajo el mismo bloqueo. Orden seguro: actualizar la anterior a 0, insertar la nueva en 1.
4. Actualizar `valoracion_vigente_id` y la caché.
5. Si cambia el abordaje, insertar otra versión de plan y mover `plan_vigente_id`.
6. No insertar otro caso.

### 16.4 Posible referencia

`UPDATE ref_posible SET estado = REFERENCIA_CREADA, referencia_id = @id WHERE posible_id = @id AND fila_version = @version`. Si no afecta filas, otra sesión ya confirmó. No se inserta una segunda referencia. Además se ejecuta el protocolo 16.1.

## 17. Consultas

El ámbito efectivo es un predicado, no un ejemplo de una sola región:

- Establecimiento: `establecimiento_id` en la lista autorizada del contexto. No se concede reportería.
- Oficina Local: `oficina_local_id = @oficina`.
- Región: `region_id = @region`, y el filtro inferior si viene.
- Nacional: sin techo, más los filtros inferiores elegidos.

El mismo predicado entra en N y en D. No se pide sexo ni edad al adaptador antes de recortar el ámbito.

### 17.1 Cobertura, visualizaciones 11 y 12

```sql
WITH d AS (
    SELECT c.caso_id, c.per_id_persona
    FROM dbo.caso_ai AS c
    WHERE c.estado = N'ACTIVO'
      AND /* predicado de ámbito efectivo, el mismo en todo el CTE */
),
n AS (
    SELECT d.per_id_persona
    FROM d
    JOIN dbo.ate_individual AS i
      ON i.caso_id = d.caso_id
     AND i.fecha_atencion >= @inicio_anio
     AND i.fecha_atencion < @fin_anio
    UNION
    SELECT d.per_id_persona
    FROM d
    JOIN dbo.ate_grupal_participante AS p
      ON p.caso_id = d.caso_id
     AND p.asistio = 1
    JOIN dbo.ate_grupal AS g
      ON g.atencion_grupal_id = p.atencion_grupal_id
     AND g.fecha_atencion >= @inicio_anio
     AND g.fecha_atencion < @fin_anio
)
SELECT
    denominador = (SELECT COUNT(*) FROM d),
    numerador = (SELECT COUNT(*) FROM n);
```

`UNION` ya deja personas únicas. D es el conteo de activos del ámbito. Hay un activo por persona, así que una persona no entra en dos oficinas. El porcentaje nacional usa el N y el D de la consulta nacional. No promedia porcentajes regionales. Si el denominador es 0, el servicio muestra «Sin casos activos» y no divide. El filtro Activo/Cerrado/Todos no se aplica aquí. El año limita la atención, no convierte el activo en un activo histórico. Filtros de disciplina o profesional no entran si no pueden aplicarse igual a N y a D.

### 17.2 Las otras diez

| # | Consulta |
| --- | --- |
| 1 | Casos del ámbito y del filtro de estado, agrupados por `establecimiento_id`. El nombre sale del adaptador o del snapshot de la referencia de origen, no de una copia viva. |
| 2 | Personas del conjunto, sexo pedido al adaptador al corte. No usa `ref_contexto`. |
| 3 | Fecha de nacimiento del adaptador y edad al corte de consulta. Grupos analíticos, no un catálogo institucional. |
| 4 | Prioridad de `ses_valoracion` vigente. Alto, Moderado, Bajo. |
| 5 | `caso_ai.estado`. Activo y Cerrado son el estado de ahora, no el del año. |
| 6 | `prog_actividad` con `estado = CANCELADA` y fecha de la transición en el período. Top-N del texto exacto. |
| 7 | `COUNT(*)` de `ref_motivo` por ítem, solo referencias ya enviadas. Puede superar el número de referencias. |
| 8 | Conteo de `ate_individual` más conteo de `ate_grupal` en el año, por tipo. No se cuentan participantes ni actividades programadas. |
| 9 | `caso_cierre` por motivo. Tres clases. Traslado no se suma a satisfactorio. |
| 10 | Tokenización de servicio sobre `explicacion` donde el motivo requiere texto. El informe guarda el top en `inf_agregado`. |

Casos sin atención: activos del ámbito sin individual ni participación `asistio = 1` en el intervalo. Última atención: máximo de esas fechas en toda la vida del caso, o ausencia.

Inicio de Oficina Local: posibles `PENDIENTE`, referencias `PENDIENTE_REVISION`, casos `ACTIVO`, sesiones con fecha futura, actividades `PROGRAMADA` con fecha vigente ya pasada. No hay bandeja de continuidad.

Línea de tiempo: unión, por caso, de apertura, valoraciones, individuales, participaciones con caso, coordinaciones, reportes, cierre. La grupal aparece una vez en su tabla y como participación en cada caso. Regional y Nacional reciben resumen, estado, prioridad, fechas y plan vigente. No reciben, mientras 17.4 siga abierto, factores, textos de atención, explicación de Otro, destino del traslado ni claves de archivo.

## 18. Seguridad

| Dato | Control |
| --- | --- |
| Factores, riesgo, protección, plan, atenciones, coordinación, explicación | Tablas distintas. Sin `SELECT` para Establecimiento. |
| Prioridad en Establecimiento | Solo la vista de columnas. |
| Snapshot familiar | Lectura junto con la referencia y el ámbito de quien puede ver esa referencia. No va en el DTO de caso ni en la vista. |
| Clave de archivo | Después de ámbito, rol y permiso reforzado cuando exista. El almacén vuelve a comprobar. |
| Auditoría | Códigos. Sin cuerpo clínico. |
| Borrador | Autor y ámbito. Fuera de reportería. |
| Conflicto de caso activo | Mensaje fijo de la sección 16.1. |
| Informe | Lectura solo dentro del ámbito guardado. Establecimiento excluido. |
| Agregado pequeño | Riesgo residual conocido. Sin umbral inventado. |

No hay tabla de usuarios ni de establecimientos autorizados. El contexto institucional llega en cada operación y el servicio lo convierte en predicado. Ocultar un botón no basta.

## 19. Integración

Lectura por adaptador. Sin vista, sinónimo ni FK hacia `SIDINACC_LOCAL`.

Al enviar la referencia se leen, si existen, encargado, relación, contacto, dirección, servicios, nombres territoriales, establecimiento y la edad de ese momento. Se escriben en `ref_contexto` y no se vuelven a sincronizar.

La posible referencia guarda criterio, fecha, persona, ámbito e `id_externo` opcional. No guarda PE, PT, TE, IMC ni ítems EDIN o EVADE.

`per_id_persona` es provisional frente a `RCS_idPersona`. Cambiarlo exige ADR y migración. No se decide aquí.

La reasignación ambigua dentro del mismo período CAH no se resuelve en SIA. El caso usa su snapshot.

## 20. Evolución

| Futuro | Cómo entra | Qué no se crea ahora |
| --- | --- | --- |
| Factor o motivo nuevo | Ítem de una versión nueva | Columnas clínicas |
| Cambio de RN-009 | Otra versión de matriz. Lo ya guardado no se recalcula. | |
| Tipo de atención o de programación | `cat_item` | Sesión educativa automática |
| Asistente de solo lectura | Consultas ya filtradas y `aud_evento` | Tablas de chat |
| Sugerencia de riesgo | Tabla nueva, aparte de `ses_valoracion` | Columnas en la valoración |
| Corrección de un hecho confirmado | Hecho de rectificación, cuando exista regla | `UPDATE` del contenido |
| Formato del informe | `clave_archivo` ya es nula | Binario y PDF obligatorios |
| Permiso de reportería a Establecimiento | Otro rol de lectura, si se valida | No se concede en el modelo |

## 21. Índices

Además de PK, únicos y filtrados ya dichos:

| Índice | Por qué |
| --- | --- |
| `ref_referencia (oficina_local_id, estado, enviada_en)` | Bandeja de Oficina Local |
| `ref_referencia (establecimiento_id, estado)` | Bandeja de Establecimiento |
| `ref_referencia (per_id_persona, estado)` | Bloqueo funcional y búsqueda |
| `ref_motivo (cat_item_id, referencia_id)` | Visualización 7 |
| `ref_posible (oficina_local_id, estado, fecha_deteccion)` | Sección y filtros |
| `caso_ai (oficina_local_id, estado)` INCLUDE prioridad caché | Lista local. La prioridad mostrada igual se confirma con la valoración. |
| `caso_ai (region_id, estado)` | Consulta regional |
| `caso_ai (establecimiento_id, estado)` | Lista y visualización 1 |
| `ses_valoracion (caso_id) WHERE es_vigente = 1` | Único filtrado y lectura del vigente |
| `ate_individual (caso_id, fecha_atencion)` | Cobertura, última atención, sin atención |
| `ate_grupal (fecha_atencion, oficina_local_id)` | Visualización 8 |
| `ate_grupal_participante (caso_id) WHERE asistio = 1 AND caso_id IS NOT NULL` | Cobertura |
| `prog_actividad (oficina_local_id, estado, fecha_vigente)` | Vencidas y bandeja |
| `caso_cierre (motivo_item_id, fecha_cierre)` | Visualizaciones 9 y 10 |
| `aud_evento (entidad, entidad_id, ocurrido_en)` | Trazabilidad |

No se indexa cada FK por reflejo. No se indexa `bor_captura.contenido`.

## 22. Riesgos residuales

- La conciliación de cierre y de caché depende de que alguien la ejecute. No es un constraint.
- Un rol de base con `UPDATE` amplio puede saltarse los permisos de columna previstos. El despliegue tiene que crear el rol de aplicación estrecho.
- Sexo y edad de un corte nacional dependen del adaptador y de lotes de identificadores ya filtrados.
- El Top-N de cancelación no unifica sinónimos.
- La nube de Otro y una barra de una persona pueden reidentificar.
- El mapa de códigos CS…CE hacia `region_id` real puede estar incompleto.
- RN-040 sigue provisional hasta ratificación con Alina. El cálculo usa esa fórmula y no la da por cerrada institucionalmente.
- SQL Server como motor de producto sigue siendo restricción de este diseño, no una decisión de stack ya aprobada en `sources-and-validation.md`.

## 23. Trazabilidad

El detalle HU, RF, CU, RN y RNF está en la sección 10 del inventario. Este diseño cubre esa matriz. No cubre HU-029, RF-062, RF-063 ni CU-21, a propósito. No hay implementación ni pruebas: la cadena se detiene en el diseño.

## 24. Fuera de alcance

Crear la base, ejecutar el DDL de este documento, migrar, modificar `SIDINACC_LOCAL`, cambiar v0.7, implementar servicios y publicar el repositorio.
