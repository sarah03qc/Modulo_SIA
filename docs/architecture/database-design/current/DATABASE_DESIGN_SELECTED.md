# Diseño seleccionado de SIA_CENCINAI

**Estado:** PROPUESTO. Arquitectura candidata con los cambios de la evaluación y el endurecimiento de integridad del 2026-11-03. No es aprobación institucional ni DDL ejecutado.
**Veredicto que la origina:** `APPROVED_WITH_CHANGES` de A-02 sobre la propuesta A, más las condiciones de A-09 y A-07. Ver `SIA_DATABASE_EVALUATION.md`.
**Endurecimiento:** participante, cierre, prioridad y concurrencia. El registro de la decisión está en `DATABASE_DESIGN_HARDENING.md`. No reabre la comparación A/B/C.
**Motor:** Microsoft SQL Server. Base lógica `SIA_CENCINAI`, esquema `dbo`.
**No incluye:** tablas de `SIDINACC_LOCAL`, caso sucesor, estado Pendiente de continuidad, EDIN II, EVADE, vigilancia paralela ni asignación de establecimientos.

## 1. Justificación

Se adopta el expediente operativo con estado vigente e historial explícito. La fila del caso responde bandejas y el índice único filtrado impide dos activos. Valoraciones, planes, cierres y snapshots no se reescriben.

No se adoptó el modelo de hechos inmutables: su ancla y la ausencia de cierre no son la misma regla, y una consulta puede contar un caso cerrado como activo. No se adoptó el instrumento genérico con proyección: concentra texto clínico y puede mostrar dos cifras de cobertura.

Los cambios posteriores a la evaluación cierran la prioridad por clave foránea, la exclusión de `Ninguno` por clave foránea, la persona de la atención individual, la autoridad del vigente, el borrador fuera de auditoría y la lista mínima de Establecimiento. El endurecimiento quita la caché de prioridad, ata el caso cerrado a su fila de cierre y extiende la FK compuesta de persona a la participación grupal cuando el caso viene informado.

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
| DD-03 | El consecutivo lo digita la persona usuaria. Se valida y se guarda al enviar. Un borrador no lo reserva. La normalización es recortar extremos y pasar a mayúsculas, sin quitar ceros ni rellenar. | Aclaración de Alina, 2026-11-05. RN-028: un borrador no es referencia enviada. La normalización evita dos filas por la misma cadena y no añade correlatividad. | Confirmado en la captura. Normalización definida con la aclaración |
| DD-04 | Los borradores viven solo en `bor_captura`. Las tablas operativas nacen confirmadas o enviadas. | H-01 y H-05. Evita que un motivo en borrador entre en la visualización 7. | PROPUESTO |
| DD-05 | No se persisten `riesgo_vigente`, `proteccion_vigente` ni `prioridad_vigente`. Cada valoración guarda sus tres códigos. El caso solo apunta `valoracion_vigente_id`. | La lectura oficial ya era el puntero. La caché podía divergir y la bandeja resuelve la prioridad con un lookup por la PK de la valoración. | PROPUESTO |
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

Una fila ya referenciada no cambia `codigo`, `codigo_catalogo`, `etiqueta` ni `requiere_texto`. Una versión nueva inserta ítems nuevos. `ON DELETE NO ACTION`. `ON UPDATE NO ACTION`.

Única de uso: (`cat_item_id`, `codigo_catalogo`). Única ampliada, destino de las FK que copian código o bandera: (`cat_item_id`, `codigo_catalogo`, `codigo`, `requiere_texto`). Cada FK de negocio apunta a una de esas únicas y la columna de catálogo del hijo tiene `CHECK` con un solo código. Así un motivo de cierre no puede guardarse como vía de atención ni una disciplina como estrategia. La relación del diagrama hacia `cat_item` representa esa FK compuesta. Ejemplo: `ref_referencia.via_item_id` más `via_catalogo` con `CHECK (via_catalogo = N'VIA_ATENCION')`.

El mismo patrón, con las dos columnas informadas o las dos nulas, aplica a:

| Uso | Código de catálogo |
| --- | --- |
| Vía y origen de la referencia | `VIA_ATENCION`, `ORIGEN_REFERENCIA` |
| Motivo de referencia | `MOTIVO_REFERENCIA` |
| Disciplina de sesión, plan, atención individual y grupal | `DISCIPLINA` |
| Estrategia o tipo de la atención individual | `ESTRATEGIA` |
| Frecuencia del plan | `FRECUENCIA` |
| Tipo de la atención grupal | `TIPO_ATENCION` |
| Tipo de la actividad programada | `TIPO_ACTIVIDAD_PROGRAMADA` |
| Motivo de cierre | `MOTIVO_CIERRE` |
| Tipo documental, institución y estado de coordinación, cuando el ítem viene informado | `TIPO_DOCUMENTO`, `INSTITUCION_COORDINACION`, `ESTADO_COORDINACION` |

Si el ítem es opcional, el identificador y el código de catálogo son los dos nulos o los dos informados. Un código constante con identificador nulo no sirve: SQL Server no comprobaría la FK y el `CHECK` del código fallaría. No hay FK filtrada.

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

`region_id` int PK, `codigo` nvarchar(2) único. Semilla confirmada de RF-114: CS, HN, CH, HC, BR, CN, PC, CO, CE. El servicio usa el conjunto de códigos para aceptar o rechazar el segmento DR digitado. No asigna números y no exige que ese código coincida con la región de la persona: el mapa `region_id` → código sigue NEEDS_VALIDATION y no bloquea un consecutivo cuyo DR ya está en los nueve.

## 6. Vínculo de persona

### `vinculo_persona`

| Columna | Tipo | Nulo | Restricción |
| --- | --- | --- | --- |
| `per_id_persona` | nvarchar(20) | no | PK. Igual a `CAF_PERSONA.PER_idPersona`. Sin FK externa. |
| `primera_operacion_en` | datetime2(0) | no | |
| `fila_version` | rowversion | no | |

Categoría: SYSTEM_OWNED, ancla técnica. Toda referencia, caso, posible referencia, participante y persona programada tiene FK a esta PK. La fila se crea o se bloquea en la misma transacción, antes del hecho, con el protocolo de la sección 16. No se usa `MERGE`.

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
| `consecutivo` | nvarchar(80) | no | Único. Captura manual. Se guarda la cadena canónica al enviar. |
| `establecimiento_id` | int | no | Del niño |
| `oficina_local_id` | int | no | Snapshot |
| `region_id` | int | no | Snapshot |
| `enviada_en` | datetime2(0) | no | Inmutable |
| `enviada_por` | nvarchar(128) | no | Inmutable |
| `creada_en` | datetime2(0) | no | |
| `creada_por` | nvarchar(128) | no | En referencia coincide con el responsable |
| `fila_version` | rowversion | no | |

Índices: único de `consecutivo`; `(oficina_local_id, estado, enviada_en)`; `(establecimiento_id, estado)`; `(per_id_persona, estado)`.

La validación de formato está en la sección siguiente. El índice único es la garantía de duplicado, también si dos envíos usan la misma cadena a la vez. No hay tabla de secuencia.

Después del envío no se actualizan motivos, textos, responsable, consecutivo, ámbito ni comprobante de envío. El único cambio de la fila es `estado`, cuando la resolución admite o rechaza el ingreso. Corregir el consecutivo ya enviado queda en NV-CORRECCION: no hay modificación libre.

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

### Consecutivo digitado

No existe `ref_consecutivo_control`. El sistema no incrementa una serie, no reserva un número y no exige que el número de la serie sea el siguiente de otro.

La persona usuaria entrega la cadena completa. El servicio la normaliza y la valida antes del `INSERT`. El formulario puede advertir; no sustituye al servicio. `referencia_id` sigue siendo `bigint IDENTITY` y no depende de esa cadena. `caso_ai.consecutivo_origen` copia la cadena canónica al abrir el caso y no se actualiza.

Normalización técnica, explícita. No es una regla de numeración institucional:

1. Recortar espacios al inicio y al final.
2. Rechazar espacios internos, tabuladores y saltos de línea.
3. Pasar las letras a mayúsculas ASCII.
4. No quitar ceros, no rellenar, no reordenar segmentos y no sustituir el guion.
5. Guardar y comparar esa cadena. Dos capturas que solo difieren en mayúsculas o en espacios extremos son el mismo valor y chocan con el índice único.

Lectura del patrón ya escrito en RF-114 y del ejemplo `DNCC-DRCS-OL101-1010102-REF-001-2026`. No añade correlatividad, reserva ni reutilización:

| Segmento | Regla de formato | Correspondencia |
| --- | --- | --- |
| `DNCC` | Literal | |
| `DR` y dos letras | Una de CS, HN, CH, HC, BR, CN, PC, CO, CE | No se exige que coincida con la región de la persona. El mapa `region_id` → código sigue NEEDS_VALIDATION y no rechaza un código ya incluido en los nueve |
| `OL` y tres dígitos | Ancho del patrón `XXX` y del ejemplo `OL101` | No se exige que coincida con la Oficina Local de la persona. RF-115 no lo confirma. Si un código institucional real no tuviera tres dígitos, esa lectura del patrón quedaría NEEDS_VALIDATION; no se acepta otro ancho por inferencia |
| Establecimiento | Solo dígitos | Igual al identificador institucional del establecimiento de la persona referida, sin relleno. La longitud es la de ese identificador. Esta es la correspondencia confirmada por RF-115 |
| `REF` | Literal | |
| Tres dígitos | Ancho del patrón `XXX` y del ejemplo `001` | No se exige que siga a otro consecutivo. `001` y `1` no son equivalentes: el segundo no cumple el ancho |
| Año | `20` y dos dígitos | No se exige que coincida con el año de la fecha de envío |

Separador único: un guion ASCII entre segmentos. Caracteres admitidos después de normalizar: `A-Z`, `0-9` y ese guion.

Mensajes del servicio, sin datos de otra referencia ni de otro caso:

- Prefijo o segmento distinto del patrón.
- Segmento faltante o separador de más.
- Carácter no admitido.
- Año que no cumple `20` y dos dígitos.
- Establecimiento distinto del de la persona referida.
- Consecutivo ya registrado.

Un borrador en `bor_captura` puede guardar el texto tecleado. No lo reserva: la unicidad se aplica al insertar `ref_referencia`. Dos envíos simultáneos del mismo valor canónico no se serializan en un contador. Uno confirma. El otro recibe 2601 o 2627 del índice único, se informa como consecutivo ya registrado y no se reintenta con otro número.

El `CHECK` de motor no sustituye esta validación: el establecimiento depende de la persona. El índice único y la columna no nula sí quedan en el motor.

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

PK (`valoracion_id`, `categoria_id`). `respuesta` nvarchar(20) CHECK `NINGUNO` o `FACTORES`. `instrumento_version_id` bigint no nulo, igual al de la valoración.
Única (`valoracion_id`, `categoria_id`, `respuesta`), necesaria para la FK hija.
Única de `ses_valoracion`: (`valoracion_id`, `instrumento_version_id`). Única de `cat_instrumento_categoria`: (`categoria_id`, `instrumento_version_id`).

FK (`valoracion_id`, `instrumento_version_id`) hacia la valoración. FK (`categoria_id`, `instrumento_version_id`) hacia la categoría. Una valoración no puede responder una categoría de otra versión del instrumento.

Al confirmar, cada categoría con `es_requerida = 1` tiene exactamente una fila. Una categoría sin fila no es `Ninguno`. Las no requeridas pueden no tener fila. Qué categorías son requeridas: NEEDS_VALIDATION, leído de `cat_instrumento_categoria`. Un `CHECK` de cabecera no cuenta hijas; esa presencia se exige en la transacción de confirmación.

### `ses_valoracion_factor`

`valoracion_factor_id` PK, `valoracion_id`, `categoria_id`, `factor_id` FK `cat_instrumento_factor`, `especificacion` nvarchar(1000) null, `respuesta_enlace` nvarchar(20) no nulo con CHECK `FACTORES` y valor por defecto `FACTORES`.

FK:

```text
(valoracion_id, categoria_id, respuesta_enlace)
  -> ses_valoracion_categoria (valoracion_id, categoria_id, respuesta)
```

Si la categoría está en `NINGUNO`, no existe la clave `FACTORES` y el factor no entra. Único (`valoracion_id`, `factor_id`).

`cat_instrumento_factor` añade la única (`factor_id`, `categoria_id`). `factor_id` ya es PK; la única existe para que la FK tenga destino. No es un índice filtrado. `ses_valoracion_factor` referencia (`factor_id`, `categoria_id`) con las dos columnas no nulas. Si `categoria_id` fuera nulo, SQL Server no comprobaría el factor. `ON UPDATE NO ACTION` impide mover el factor de categoría cuando ya hay valoraciones. Esta FK no sustituye la de `FACTORES`: las dos se aplican. No comprueba por sí sola que la categoría pertenezca a la versión; eso lo hace la FK de `ses_valoracion_categoria`.

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
| `consecutivo_origen` | nvarchar(80) | no | Copia inmutable del consecutivo digitado y validado |
| `valoracion_vigente_id` | bigint | no | FK `ses_valoracion`. Única lectura de riesgo, protección y prioridad. |
| `plan_vigente_id` | bigint | sí | FK `caso_plan`. Nulo solo en la sentencia intermedia de la apertura. |
| `cierre_caso_id` | bigint | sí | FK `caso_cierre`. Nulo si `ACTIVO`. Igual a `caso_id` si `CERRADO`. |
| `fila_version` | rowversion | no | |

Única (`caso_id`, `per_id_persona`) para la FK de la atención individual, de la participación grupal y de la persona programada.
Índice único filtrado `UX_caso_activo` sobre `per_id_persona` donde `estado = ACTIVO`. Ese índice no es destino de una FK.

Índices de bandeja: `(oficina_local_id, estado)`, `(establecimiento_id, estado)` y `(region_id, estado)`, los tres con `INCLUDE (valoracion_vigente_id)`.

CHECK:

```text
(estado = N'ACTIVO' AND cierre_caso_id IS NULL)
OR (estado = N'CERRADO' AND cierre_caso_id = caso_id)
```

`cierre_caso_id = caso_id` impide apuntar al cierre de otro caso. `ON DELETE NO ACTION` y `ON UPDATE NO ACTION` en las dos direcciones de la FK circular. No hay reapertura en el modelo: el rol de aplicación no tiene `UPDATE` de `estado` ni de `cierre_caso_id`. Esas dos columnas las escribe solo la operación de cierre.

La valoración se inserta antes que el caso, con `caso_id` aún nulo, y el `INSERT` del caso ya trae `valoracion_vigente_id`. Por eso el puntero no admite nulos. `plan_vigente_id` sigue anulable porque el plan necesita el caso ya insertado. La lectura de prioridad, riesgo y protección para bandeja, lista, detalle, visualización 4 y la vista de Establecimiento entra a `ses_valoracion` por esa PK. La fila apuntada debe ser `es_vigente = 1`. No se sustituye el puntero por `MAX(numero)`. No hay columnas de caché.

Conciliación de vigente y de plan, debe devolver cero filas:

```sql
SELECT c.caso_id
FROM dbo.caso_ai AS c
JOIN dbo.ses_valoracion AS v
  ON v.valoracion_id = c.valoracion_vigente_id
WHERE v.es_vigente <> 1
   OR v.caso_id <> c.caso_id
   OR (c.estado = N'ACTIVO' AND c.plan_vigente_id IS NULL);
```

### `caso_estado_historial`

`historial_id` PK, `caso_id` FK, `estado` CHECK `ACTIVO` o `CERRADO`, `ocurrido_en` datetime2(0), `usuario` nvarchar(128), `motivo_item_id` bigint null. La apertura inserta `ACTIVO`. El cierre inserta `CERRADO`. Append-only. Sin `UPDATE` ni `DELETE` para el rol de aplicación.

Única (`caso_id`, `historial_id`, `estado`). Es el destino de la FK del cierre. No sirve una única filtrada: una FK no puede apuntar a un filtro. Si `motivo_item_id` viene informado, lleva `motivo_catalogo = N'MOTIVO_CIERRE'` y la FK compuesta de catálogo. El motivo autoritativo del cierre es el de `caso_cierre`; el del historial se escribe en la misma operación y la conciliación compara las dos copias.

### `caso_cierre`

PK = FK `caso_id`. Relación 1:0..1. Un caso `CERRADO` sin esta fila no pasa el `CHECK` de `caso_ai`.

| Columna | Tipo | Nulo | Notas |
| --- | --- | --- | --- |
| `caso_id` | bigint | no | PK y FK a `caso_ai` |
| `motivo_item_id` | bigint | no | Parte de la FK de catálogo |
| `motivo_catalogo` | nvarchar(40) | no | CHECK `MOTIVO_CIERRE` |
| `motivo_codigo` | nvarchar(80) | no | Copia del ítem. Parte de la FK |
| `motivo_requiere_texto` | bit | no | Copia del ítem. Parte de la FK |
| `explicacion` | nvarchar(2000) | sí | Obligatoria si `motivo_requiere_texto = 1` |
| `fecha_cierre` | date | no | |
| `responsable_usuario` | nvarchar(128) | no | |
| `registrado_en` | datetime2(0) | no | |
| `historial_id` | bigint | no | Parte de la FK al historial |
| `historial_estado` | nvarchar(20) | no | CHECK `CERRADO` |
| `destino_establecimiento_id` | int | sí | Documental. No es un caso |
| `destino_oficina_local_id` | int | sí | Documental |
| `destino_region_id` | int | sí | Documental |
| `destino_nombre` | nvarchar(200) | sí | Texto institucional disponible |

FK (`motivo_item_id`, `motivo_catalogo`, `motivo_codigo`, `motivo_requiere_texto`) hacia la única ampliada de `cat_item`. Las cuatro columnas son no nulas: si alguna fuera nula, el `CHECK` de explicación podría quedar en `UNKNOWN` y SQL Server lo dejaría pasar.

FK (`caso_id`, `historial_id`, `historial_estado`) hacia `caso_estado_historial` (`caso_id`, `historial_id`, `estado`). Incluir `caso_id` impide colgar el cierre del historial de otro caso.

No existe `caso_destino_id`, `caso_origen_id` ni estado `PENDIENTE_CONTINUIDAD`. La operación de cierre no inserta otro caso ni copia valoraciones ni planes.

CHECK de explicación. El `IS NOT NULL` es necesario: `LEN` de un nulo no es falso, y un `CHECK` solo rechaza lo que evalúa a falso.

```text
motivo_requiere_texto = 0
OR (
  explicacion IS NOT NULL
  AND LEN(LTRIM(RTRIM(explicacion))) > 0
)
```

CHECK de destino. Prohíbe destino cuando el motivo no es traslado. No exige las cuatro columnas cuando sí es traslado: la especificación pide los datos disponibles, no un juego obligatorio. `TRASLADO` con destinos nulos sigue permitido.

```text
motivo_codigo = N'TRASLADO'
OR (
  destino_establecimiento_id IS NULL
  AND destino_oficina_local_id IS NULL
  AND destino_region_id IS NULL
  AND destino_nombre IS NULL
)
```

La semilla de `OTRO` nace con `requiere_texto = 1`. Esa fila no se actualiza. Una versión nueva inserta ítems nuevos.

El `CHECK` de `caso_ai` impide confirmar `CERRADO` sin `cierre_caso_id`, y la FK de ese puntero impide un puntero sin fila. La PK impide un segundo cierre. No hay trigger ni vista indexada: SQL Server no difiere constraints y una vista indexada no puede expresar la ausencia de la fila.

Lo que el `CHECK` no impide es un caso `ACTIVO` que ya tenga fila en `caso_cierre` si alguien confirma el `INSERT` y no ejecuta el `UPDATE`. La operación autorizada no hace ese `COMMIT` intermedio. El rol de aplicación no tiene `INSERT` directo sobre `caso_cierre`. La conciliación siguiente debe devolver cero filas y sigue siendo el detector de una sesión privilegiada:

```sql
SELECT c.caso_id
FROM dbo.caso_ai AS c
LEFT JOIN dbo.caso_cierre AS z
  ON z.caso_id = c.caso_id
WHERE (c.estado = N'CERRADO' AND (z.caso_id IS NULL OR c.cierre_caso_id IS NULL))
   OR (c.estado = N'ACTIVO' AND z.caso_id IS NOT NULL);
```

También debe devolver cero filas un historial `CERRADO` que ninguna fila de cierre referencia, y un motivo de historial distinto del motivo de su cierre. Esas dos consultas detectan; no corrigen ni borran.

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

FK (`caso_id`, `per_id_persona`) → `caso_ai` (`caso_id`, `per_id_persona`). La persona contada no puede ser otra que la del caso. `per_id_persona` es no nulo. `ON DELETE NO ACTION` y `ON UPDATE NO ACTION`.

Solo se inserta si el caso está `ACTIVO` en esa transacción, con el caso bloqueado. La FK no exige `ACTIVO`: si lo exigiera, el cierre posterior tendría que reescribir o invalidar la atención ya guardada. La fila histórica permanece cuando el caso se cierra. No hay estado borrador aquí. No hay `UPDATE` de fecha, textos, disciplina ni persona después de confirmar. Corrección posterior: NEEDS_VALIDATION.

Índice `(caso_id, fecha_atencion)` y `(fecha_atencion, caso_id)`.

### `ate_grupal`

`atencion_grupal_id` PK, `oficina_local_id` int, `establecimiento_id` int null, `fecha_atencion` date, `tipo_item_id` bigint FK, `tema` nvarchar(500) no nulo, `lugar` nvarchar(200) null, `acciones` nvarchar(2000), `recomendaciones` nvarchar(2000), `digitador_usuario`, `digitada_en`. Sin `caso_id`. Una fila por actividad.

`ate_grupal_disciplina`: PK (`atencion_grupal_id`, `disciplina_item_id`).
`ate_grupal_profesional`: `profesional_id` PK, FK grupal, `profesional_usuario` nvarchar(128). Único (`atencion_grupal_id`, `profesional_usuario`).

### `ate_grupal_participante`

`participante_id` PK, `atencion_grupal_id` FK, `per_id_persona` nvarchar(20) no nulo FK `vinculo_persona`, `caso_id` bigint null, `asistio` bit null.

Único (`atencion_grupal_id`, `per_id_persona`).

FK (`caso_id`, `per_id_persona`) → `caso_ai` (`caso_id`, `per_id_persona`). `ON DELETE NO ACTION`. `ON UPDATE NO ACTION`.

SQL Server solo implementa `MATCH SIMPLE`. Si `caso_id` es nulo, no comprueba esa FK compuesta y la persona sigue sostenida por la FK al vínculo. Si `caso_id` viene informado, las dos columnas tienen que coincidir con un caso de esa persona. `per_id_persona` no puede ser nulo: si lo fuera, un `caso_id` informado tampoco se comprobaría. La FK no exige `ACTIVO` y no apunta a `UX_caso_activo`. Una participación guardada sigue enlazada después del cierre.

`asistio` NULL = no confirmada, no cuenta. 1 = efectiva. 0 = no asistió, no cuenta. Al menos un participante al guardar. El tema ya es obligatorio en la cabecera. Los acompañantes no se insertan.

En el alta, la transacción de la sección 16 resuelve el caso así:

- Si la persona tiene un caso `ACTIVO` dentro del ámbito autorizado del actor, `caso_id` es ese caso. No es un caso cerrado ni el caso de otra persona.
- Si no lo tiene dentro de ese ámbito, `caso_id` queda NULL. No se crea caso ni línea de tiempo.
- No se consulta ni se copia el identificador de un caso activo que esté fuera del ámbito. Si más adelante se valida que esa participación debe verse en el expediente del otro ámbito, la misma columna anulable puede llenarse. Hasta entonces es NEEDS_VALIDATION (`NV-GRUPAL-AMBITO`).
- Qué tipos de actividad admiten participante sin caso activo también queda NEEDS_VALIDATION (HU-037 CA-09, 17.8). La columna anulable no cierra esa definición y no impide al participante legítimo sin caso.

`caso_id` se asigna en el `INSERT`. El rol de aplicación no lo actualiza después. Así un alta no se reengancha más tarde a un caso cerrado.

Índice `(caso_id)` filtrado donde `caso_id` no es nulo y `asistio = 1`.

No hay trigger que copie la grupal a varias atenciones individuales ni que convierta una actividad programada en atención.

La conciliación de persona distinta debe devolver cero filas. Con la FK activa es redundante; sirve si alguien desactiva la constraint:

```sql
SELECT p.participante_id
FROM dbo.ate_grupal_participante AS p
JOIN dbo.caso_ai AS c
  ON c.caso_id = p.caso_id
WHERE p.caso_id IS NOT NULL
  AND p.per_id_persona <> c.per_id_persona;
```

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

PK (`actividad_id`, `per_id_persona`). `per_id_persona` no nulo, FK `vinculo_persona`. `caso_id` bigint null.

FK (`caso_id`, `per_id_persona`) → `caso_ai` (`caso_id`, `per_id_persona`), con la misma semántica `MATCH SIMPLE` de la participación grupal. Si `caso_id` es nulo, la persona queda programada sin caso. Si viene informado, el caso es de esa persona. La FK no exige `ACTIVO`: el inventario no dice que la programación quede inválida al cerrar el caso, y exigirlo sería una regla no confirmada.

Cero filas = actividad general. No programa a todos los casos del establecimiento. La asociación puede corregirse mientras la actividad sigue `PROGRAMADA`, mediante inserción o borrado de estas filas y una fila en `prog_cambio` que lo registre.

`REALIZADA` no inserta `ate_individual` ni `ate_grupal`. Vencida no es un valor de `estado`.

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
| Un activo por persona | `UX_caso_activo` | Bloqueo del vínculo antes de referir o abrir. El índice es el respaldo |
| Prioridad = RN-009 | FK de cuatro columnas a la matriz | El servicio calcula el código. El usuario no lo envía. No hay columna de prioridad en el caso |
| `Ninguno` sin factores | FK del factor hacia respuesta `FACTORES` | Categorías requeridas presentes al confirmar |
| Factor de su categoría | FK (`factor_id`, `categoria_id`) | |
| Categoría de la misma versión | FK de versión en la respuesta | |
| Persona de la atención individual, de la grupal y de la programación | FK compuesta al caso. En grupal y programación, `caso_id` nulo no la dispara | El alta exige `ACTIVO` y ámbito. La FK no exige `ACTIVO` |
| Una referencia, un caso | Único de `referencia_id` | |
| Una referencia, una resolución | Único de `referencia_id` | Justificación si no requiere A.I. |
| Referencia una vez por sesión | Únicos filtrados de situación | |
| Una sugerencia, una referencia | Único filtrado de `ref_posible.referencia_id` | Bloqueo de la fila y `fila_version` |
| Consecutivo único | Único de `ref_referencia.consecutivo` | El servicio valida el formato antes del `INSERT`. No hay fila de control |
| Un plan vigente y una valoración vigente | Únicos filtrados | Apagar la anterior y después insertar la nueva en 1 |
| Caso cerrado con su fila | `CHECK` de `cierre_caso_id` y FK a `caso_cierre` | Una sola sentencia de `UPDATE` dentro de la transacción de cierre |
| Un solo cierre | PK de `caso_cierre` | |
| Cierre con historial `CERRADO` del mismo caso | FK (`caso_id`, `historial_id`, `historial_estado`) | |
| Caso activo con fila de cierre ya confirmada | No lo impide el `CHECK` | Sin `COMMIT` intermedio. Sin `INSERT` directo. Conciliación en cero |
| Explicación de Otro | `CHECK` con copia no nula de `requiere_texto` | |
| Destino solo si el motivo es traslado | `CHECK` sobre `motivo_codigo` | No obliga las cuatro columnas de destino |
| Borrador excluido | No está en las tablas operativas | `bor_captura` aparte |
| Ámbito | No hay RLS | Predicado en servicio. Vista solo de columnas |
| Sin caso sucesor | Esas columnas no existen | La operación de cierre no inserta `caso_ai` |
| Programación no crea atención | No hay trigger | |

Aislamiento: `READ COMMITTED` explícito. Los protocolos no dependen de lecturas bloqueantes sin hint. `UPDLOCK` y `HOLDLOCK` siguen tomados si la base usa `READ_COMMITTED_SNAPSHOT`. No se usa `SERIALIZABLE` de sesión ni `MERGE`.

### 16.0 Orden de bloqueos

Dentro de la transacción, y solo hasta el `COMMIT` o el `ROLLBACK`:

1. `vinculo_persona` por `per_id_persona`, con `UPDLOCK, HOLDLOCK`. Si la operación toca varias personas, todas se bloquean al inicio, ordenadas por `per_id_persona`.
2. `caso_ai` por `caso_id`, con `UPDLOCK, HOLDLOCK`, solo cuando la operación ya tiene ese caso. Varios casos se bloquean por `caso_id` ascendente.
3. `ref_posible` por `posible_id`, con `UPDLOCK`, solo al gestionar una sugerencia.
4. Inserciones y actualizaciones de hijos. Si el envío borra `bor_captura`, lo hace aquí, nunca antes del vínculo. El consecutivo digitado se inserta con la referencia. No hay fila de secuencia que bloquear.

La lectura al adaptador de SIDINACC termina antes del `BEGIN TRAN`. No se llama mientras estos bloqueos siguen abiertos.

Alta o bloqueo del vínculo, en el paso 1:

1. `SELECT` de la PK con `UPDLOCK, HOLDLOCK`.
2. Si no hay fila, `INSERT` de `per_id_persona` y `primera_operacion_en`, todavía dentro de la misma transacción. El rango tomado por `HOLDLOCK` hace esperar a la otra sesión en el `SELECT`, no en una carrera de dos `INSERT`.
3. Si aun así aparece el error 2627 y `XACT_STATE()` sigue en 1, se repite el `SELECT` con los mismos hints y se continúa. Si la transacción quedó inconclusa, `ROLLBACK` y reintento completo. No se usa `MERGE` ni `OUTPUT` para decidir quién ganó.

El perdedor no recibe 2627 cuando el ganador revierte: su `INSERT` sigue y crea la fila. El 2627 aparece cuando la fila conflictiva ya estaba confirmada. El 2601 no es el error de esta PK.

Reintento: solo error 1205, o un 2627 del vínculo que dejó la transacción inconclusa. Se revierte todo y se empieza en el paso 1. Máximo tres intentos, contados juntos. No se reintentan el caso activo, la sugerencia ya confirmada, el caso que ya no está activo, el 2601 de `UX_caso_activo`, el 2601 o 2627 del consecutivo ya registrado, el 2601 de la valoración vigente ni el timeout 1222. Un consecutivo duplicado no se sustituye por otro número.

Permisos del rol de aplicación, además de los `SELECT` ya acotados por ámbito:

- Puede insertar `caso_ai` en estado `ACTIVO`, con `cierre_caso_id` nulo.
- Puede actualizar en `caso_ai` solo `valoracion_vigente_id` y `plan_vigente_id`.
- No puede actualizar `estado` ni `cierre_caso_id`.
- No puede insertar, actualizar ni borrar `caso_cierre`.
- No puede borrar `caso_ai` ni `caso_estado_historial`.
- Puede insertar historial de apertura. No hay permiso de SQL Server que limite ese `INSERT` al valor `ACTIVO`. El historial `CERRADO` huérfano lo detecta la conciliación.

La operación de cierre es el único módulo cuyo texto actualiza `estado` y `cierre_caso_id` e inserta `caso_cierre`. Un procedimiento con encadenamiento de propiedad puede saltarse el permiso de columna: la apertura y la revaloración no incluyen esas columnas en su `UPDATE`. Un rol con `UPDATE` de tabla amplia anula esta separación. Eso sigue siendo condición de despliegue, no una tabla nueva.

### 16.1 Referencia y apertura

1. `BEGIN TRAN` y paso 1 del vínculo.
2. Comprobar caso activo con `EXISTS` sobre `per_id_persona` y `estado = ACTIVO`. No se usa `UPDLOCK` sobre el caso ajeno ni se devuelven sus columnas. Si existe, `ROLLBACK`.
3. Mensaje único: «No es posible continuar porque la persona ya tiene un caso de Atención Interdisciplinaria activo.» No se leen oficina, establecimiento, profesional, prioridad ni identificador del otro caso para armar el error ni para el evento visible al actor. El 2601 de `UX_caso_activo` se traduce al mismo texto.
4. Envío: validar el consecutivo ya digitado e insertar la referencia `PENDIENTE_REVISION`, el contexto y los motivos. Dos referencias pendientes de la misma persona pueden confirmarse si sus consecutivos canónicos son distintos. La regla confirmada bloquea el caso activo, no la segunda pendiente.
5. Apertura: la valoración confirmada ya existe con `caso_id` nulo. Insertar el caso `ACTIVO` con `valoracion_vigente_id` informado, `plan_vigente_id` nulo y `cierre_caso_id` nulo. Insertar el plan y actualizar solo `plan_vigente_id`. Completar `caso_id` de la valoración donde estaba nulo. Pasar la referencia a `ADMITIDA_AI`. Insertar historial `ACTIVO`.
6. `COMMIT`.

No se inserta una segunda valoración al abrir. La misma fila pasa de referencia a caso. El plan nace después del caso. Una segunda apertura espera el vínculo, observa el activo y termina en el mensaje del punto 3.

### 16.2 Cierre y traslado

Una transacción. Pasos 1 y 2 de bloqueo. El actor tiene que estar autorizado sobre el ámbito del caso; si no lo está, `ROLLBACK` sin motivo, explicación ni destino.

1. El caso bloqueado está `ACTIVO` y `cierre_caso_id` es nulo. Si no, `ROLLBACK` con el aviso de que el caso ya no está activo. No es un error del otro expediente.
2. Validar el motivo contra `MOTIVO_CIERRE` y la explicación cuando `requiere_texto = 1`.
3. Insertar historial `CERRADO`.
4. Insertar `caso_cierre`, con `historial_id` de esa fila y `historial_estado = CERRADO`.
5. Un solo `UPDATE` de `caso_ai` que escribe `estado = CERRADO` y `cierre_caso_id = caso_id`. Una sentencia anterior que deje `CERRADO` con puntero nulo, o el puntero con `ACTIVO`, falla por el `CHECK`.
6. `COMMIT`.

Si cualquier sentencia falla, `ROLLBACK` del conjunto. El registro de SQL Server no conserva un cierre a medias de una transacción revertida. No se copia valoración ni plan. No se inserta caso nuevo. No se crea estado de continuidad. Una referencia posterior en el destino usa el protocolo 16.1 cuando ya no hay activo.

Dos cierres quedan en serie sobre el vínculo y después sobre el caso. El segundo observa `CERRADO` y es rechazo de negocio. Si el bloqueo se omite, la PK de `caso_cierre` sigue impidiendo la segunda fila.

### 16.3 Revaloración

1. Pasos 1 y 2. Volver a leer `valoracion_vigente_id` y la fila `es_vigente = 1` con el caso ya bloqueado. El identificador leído antes del bloqueo no se usa.
2. Actualizar la anterior a `es_vigente = 0`.
3. Insertar la valoración nueva con el `numero` siguiente, `es_vigente = 1`, `caso_id` conocido y la FK de matriz. El usuario no envía `prioridad_codigo`.
4. Actualizar solo `valoracion_vigente_id`.
5. Si cambia el abordaje, insertar otra versión de plan, apagar la vigente anterior y mover `plan_vigente_id`.
6. No insertar otro caso ni modificar factores, riesgo, protección, prioridad ni responsable de una valoración ya confirmada.

El único filtrado responde 2601 si el orden se invierte. Ese 2601 no se reintenta. Dos revaloraciones pueden confirmarse en serie; cada una parte de la vigente que observa bajo el bloqueo.

### 16.4 Posible referencia

1. Pasos 1 y 3. Si `estado` ya no es `PENDIENTE`, `ROLLBACK` antes de insertar la referencia.
2. Ejecutar el protocolo 16.1 para crear la referencia.
3. `UPDATE ref_posible SET estado = REFERENCIA_CREADA, referencia_id = @id WHERE posible_id = @id AND fila_version = @version AND estado = N'PENDIENTE'`.
4. Si no afecta filas, `ROLLBACK`. No queda una segunda referencia confirmada.

El único filtrado de `referencia_id` es el respaldo. La equivalencia institucional de dos sugerencias distintas sigue NEEDS_VALIDATION.

### 16.5 Atención grupal

Atención grupal, una transacción:

1. Ordenar los `per_id_persona` y tomar el paso 1 para todos.
2. Para cada persona, buscar el caso `ACTIVO` solo dentro del ámbito autorizado. Si existe, reservar ese `caso_id`. Si no, reservar nulo. No leer un caso fuera de ámbito.
3. Bloquear por `caso_id` ascendente los casos reservados y comprobar que siguen `ACTIVO`. Si uno se cerró, `ROLLBACK`.
4. Insertar la cabecera, disciplinas, profesionales y participantes. `caso_id` nulo no crea caso.
5. `COMMIT`.

No hay protocolo de incremento. Dos envíos con consecutivos distintos no se esperan entre sí por el número. Dos envíos con el mismo valor canónico chocan en el índice único de `ref_referencia.consecutivo`.

### 16.6 Errores, recuperación y conciliación

| Situación | Efecto |
| --- | --- |
| Caso activo al referir o abrir | `ROLLBACK`. Mensaje fijo de 16.1. Sin reintento |
| Caso ya cerrado al cerrar | `ROLLBACK`. Aviso de estado, sin texto clínico |
| Otro sin explicación, o destino con un motivo que no es traslado | La sentencia falla por `CHECK`. `ROLLBACK` |
| Segundo cierre | PK. `ROLLBACK` |
| Interbloqueo 1205 | `ROLLBACK` y reintento completo, máximo tres |
| Fallo de cualquier sentencia del cierre, la apertura o la revaloración | `ROLLBACK` del conjunto. No hay cierre, caso ni valoración a medias |
| Caída del proceso antes de `COMMIT` | La transacción no confirmada revierte con el registro. No queda un caso `CERRADO` sin fila |
| Consecutivo duplicado | `ROLLBACK`. Mensaje de consecutivo ya registrado. No se genera otro valor y no se reintenta |

No hay reparación automática que borre o reescriba hechos clínicos. Las conciliaciones de las secciones 9 y 10, más la del historial `CERRADO` no referenciado, se ejecutan en prueba y en operación y deben devolver cero filas. Esta sección no afirma que esas consultas ya se hayan ejecutado.

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
    denominador = (SELECT COUNT(DISTINCT per_id_persona) FROM d),
    numerador = (SELECT COUNT(*) FROM n);
```

`UNION` ya deja personas únicas en N. D cuenta personas distintas, no filas de caso. `UX_caso_activo` hace que hoy coincidan; el `DISTINCT` conserva la definición si ese índice se desactiva. El porcentaje nacional usa el N y el D de la consulta nacional, con el mismo predicado de ámbito y sin techo territorial. No se calcula promediando porcentajes regionales: es la misma fórmula sobre el universo nacional. RN-040 sigue provisional hasta ratificación con Alina. Si el denominador es 0, el servicio muestra «Sin casos activos» y no divide. El filtro Activo/Cerrado/Todos no se aplica aquí. El año limita la atención, no convierte el activo en un activo histórico. Filtros de disciplina o profesional no entran si no pueden aplicarse igual a N y a D. Una atención ligada solo a un caso ya cerrado no entra, porque D exige `ACTIVO` ahora y N exige el `caso_id` de ese mismo caso.

### 17.2 Las otras diez

| # | Consulta |
| --- | --- |
| 1 | Casos del ámbito y del filtro de estado, agrupados por `establecimiento_id`. El nombre sale del adaptador o del snapshot de la referencia de origen, no de una copia viva. |
| 2 | Personas del conjunto, sexo pedido al adaptador al corte. No usa `ref_contexto`. |
| 3 | Fecha de nacimiento del adaptador y edad al corte de consulta. Grupos analíticos, no un catálogo institucional. |
| 4 | Prioridad de `ses_valoracion` por `valoracion_vigente_id`. Alto, Moderado, Bajo. No hay columna de prioridad en `caso_ai`. |
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
| Conflicto de caso activo | Mensaje fijo de la sección 16.1. El evento visible al actor usa `CONFLICTO_CASO_ACTIVO` y no guarda el identificador del expediente ajeno. |
| Estado y cierre | El rol de aplicación no actualiza `estado` ni inserta `caso_cierre`. La operación de cierre es el único módulo que lo hace. |
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
| `caso_ai (oficina_local_id, estado)` INCLUDE `valoracion_vigente_id` | Lista local. La prioridad se lee por la PK de la valoración |
| `caso_ai (region_id, estado)` INCLUDE `valoracion_vigente_id` | Consulta regional |
| `caso_ai (establecimiento_id, estado)` INCLUDE `valoracion_vigente_id` | Lista y visualización 1 |
| `ses_valoracion (caso_id) WHERE es_vigente = 1` | Único filtrado y lectura del vigente |
| `ate_individual (caso_id, fecha_atencion)` | Cobertura, última atención, sin atención |
| `ate_grupal (fecha_atencion, oficina_local_id)` | Visualización 8 |
| `ate_grupal_participante (caso_id) WHERE asistio = 1 AND caso_id IS NOT NULL` | Cobertura |
| `prog_actividad (oficina_local_id, estado, fecha_vigente)` | Vencidas y bandeja |
| `caso_cierre (motivo_item_id, fecha_cierre)` | Visualizaciones 9 y 10 |
| `aud_evento (entidad, entidad_id, ocurrido_en)` | Trazabilidad |

No se indexa cada FK por reflejo. No se indexa `bor_captura.contenido`.

## 22. Riesgos residuales

- Un caso `ACTIVO` con fila de cierre ya confirmada no lo impide el `CHECK`. Lo impiden la transacción sin `COMMIT` intermedio, la ausencia de `INSERT` directo y la conciliación. Un rol con `UPDATE` de tabla amplia puede saltarse esa separación.
- Un historial `CERRADO` no referenciado por `caso_cierre` no lo impide un permiso de `INSERT`. Lo detecta la conciliación. No se borra solo.
- La atención nueva sobre un caso ya cerrado la rechaza la transacción, no la FK. La FK no puede exigir `ACTIVO` sin invalidar el historial al cerrar.
- Un participante grupal sin caso dentro del ámbito no guarda el identificador de un caso activo de otro ámbito. Si la validación posterior exige ese enlace, la columna ya admite el valor. Hasta entonces el historial de ese otro ámbito no muestra la participación.
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
