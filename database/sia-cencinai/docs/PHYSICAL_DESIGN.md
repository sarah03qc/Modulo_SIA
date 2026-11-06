# Diseño físico de SIA_CENCINAI

Fuente lógica: `docs/architecture/database-design/current/DATABASE_DESIGN_SELECTED.md` y su endurecimiento. No se reabrió la comparación de propuestas.

Motor previsto: Microsoft SQL Server 2016 SP1 o posterior. Collation de la base: `Latin1_General_100_CI_AS`. Esquema de tablas: `dbo`. Esquema del procedimiento de cierre: `ops`.

Los conteos de esta página salen de los scripts, no de `sys.objects`. No se ejecutó SQL.

## Inventario

46 tablas de dominio, la tabla técnica `dbo.schema_migracion`, la vista `dbo.caso_lista_establecimiento` y el procedimiento `ops.cerrar_caso`.

| Dominio | Tablas |
| --- | --- |
| Vínculo | `vinculo_persona` |
| Configuración | `cat_version`, `cat_item`, `cat_matriz_prioridad`, `cat_instrumento_version`, `cat_instrumento_categoria`, `cat_instrumento_factor`, `cat_codigo_region_referencia` |
| Referencia | `ref_referencia`, `ref_contexto`, `ref_motivo`, `ref_impresion`, `ref_posible` |
| Sesión y valoración | `ses_sesion`, `ses_disciplina`, `ses_situacion`, `ses_valoracion`, `ses_valoracion_categoria`, `ses_valoracion_factor`, `ses_resolucion` |
| Caso y plan | `caso_ai`, `caso_estado_historial`, `caso_cierre`, `caso_plan`, `caso_plan_proposito`, `caso_plan_estrategia`, `caso_plan_disciplina` |
| Atención | `ate_individual`, `ate_grupal`, `ate_grupal_disciplina`, `ate_grupal_profesional`, `ate_grupal_participante` |
| Programación | `prog_actividad`, `prog_cambio`, `prog_persona` |
| Documentos | `doc_documento`, `doc_coordinacion`, `doc_coordinacion_evento`, `doc_reporte_caso` |
| Informe | `inf_informe`, `inf_visualizacion`, `inf_agregado` |
| Borrador y auditoría | `bor_captura`, `aud_evento`, `aud_migracion_lote`, `aud_migracion_error` |

`caso_lista_establecimiento` es vista, no tabla. No hay caso sucesor, continuidad ni secuencia de consecutivos.

## Tipos

Identificadores SIA: `bigint IDENTITY(1,1)`. Persona: `nvarchar(20)`. Usuario: `nvarchar(128)`. Códigos: `nvarchar` acotado. Hechos: `date`. Hora de sesión: `time(0)`. Registro: `datetime2(0)`. Concurrencia de filas mutables: `rowversion`. Indicadores: `bit`. Edad congelada: `smallint`. Valores de gráfico: `decimal(18,4)`.

`nvarchar(max)` solo está en `bor_captura.contenido`. No hay `float`, `text`, `ntext`, `image`, `datetime` legado ni `uniqueidentifier`.

Unicode: columnas de texto en `nvarchar`. La comparación general es `CI_AS`. El consecutivo exige mayúsculas con una comparación `Latin1_General_100_BIN2`, porque una igualdad `CI` trataría la minúscula como ya canónica y el `CHECK` no la rechazaría. Los espacios de los extremos se rechazan con `DATALENGTH`, porque SQL Server ignora los espacios finales en una igualdad normal. El índice único, con la collation de la base, sigue tratando dos cadenas que solo difieren en mayúsculas o en espacios finales como el mismo consecutivo.

`NULL` es ausencia o no aplicabilidad de esa columna, dicha en el `CHECK` o en el contrato. `Ninguno` es la respuesta `NINGUNO`, no un nulo. La asistencia no confirmada es `asistio` nulo y no cuenta. No se usaron cadenas `PENDING`, `UNKNOWN` ni `NOT_APPLICABLE`: el diseño lógico ya resolvió esos casos con nulos, códigos o filas.

Los `datetime2(0)` de negocio los envía el servicio. La base no les pone `GETDATE()`. No se guarda desplazamiento horario. La hora institucional de Costa Rica queda como interpretación pendiente de UTIC; el motor no convierte zonas. El libro `schema_migracion` sí guarda el instante UTC del despliegue, porque es metadato técnico y no un hecho del expediente.

No hay valores por defecto institucionales. El único `DEFAULT` es `ses_valoracion_factor.respuesta_enlace = FACTORES`, que ya estaba en el diseño.

## Claves y constraints

Conteo estático de los scripts de migración:

| Objeto | Cantidad |
| --- | --- |
| `PRIMARY KEY` | 47, incluida `schema_migracion` |
| `FOREIGN KEY` | 73, todas `ON DELETE NO ACTION` y `ON UPDATE NO ACTION` |
| `UNIQUE` de constraint | 31 |
| `CHECK` | 112 |
| `DEFAULT` | 1 |
| Índices únicos explícitos | 12, varios filtrados |
| Índices no únicos explícitos | 17 |

`per_id_persona` es la PK natural del vínculo y la FK interna de los hechos. No es `IDENTITY`. La PK de cada hecho SIA es sustituta. El consecutivo no es PK: es un índice único sobre la cadena canónica, así el duplicado devuelve 2601.

`UX_caso_activo` es un índice único filtrado sobre `per_id_persona` donde `estado = ACTIVO`. No es destino de una FK. El duplicado devuelve 2601.

La matriz tiene la PK de riesgo y protección y la única de cuatro columnas que usa la valoración. Una prioridad distinta de RN-009 no entra.

Cada uso de `cat_item` lleva el código de catálogo, un `CHECK` de un solo valor y una FK compuesta. Un motivo de cierre no puede guardarse como vía de atención. Si el ítem es opcional, las dos columnas van nulas o las dos informadas.

## Dependencias y orden

No hay FK hacia otra base. Las relaciones obligatorias son las columnas `NOT NULL` con FK. Las opcionales que el motor no comprueba cuando el extremo es nulo, por `MATCH SIMPLE`, son `plan_vigente_id`, `cierre_caso_id`, `ses_valoracion.caso_id`, `ses_situacion.caso_id`, `ate_grupal_participante.caso_id`, `prog_persona.caso_id` y los ítems opcionales de documento y coordinación.

Circulares, creadas en `090` después de que las dos tablas existen:

| Ida | Vuelta | Por qué la inserción es válida |
| --- | --- | --- |
| `caso_ai.valoracion_vigente_id` → valoración | `ses_valoracion.caso_id` → caso, anulable | La valoración se inserta antes, con `caso_id` nulo. El caso apunta a ella. Después se completa `caso_id` |
| `caso_plan.caso_id` → caso | `caso_ai.plan_vigente_id` → plan, anulable | El caso nace con el plan nulo. El plan se inserta. Luego se mueve el puntero |
| `caso_cierre.caso_id` → caso | `caso_ai.cierre_caso_id` → cierre, anulable | Historial `CERRADO`, fila de cierre y un `UPDATE` que escribe estado y puntero juntos |

`cierre_caso_id = caso_id` cuando el estado es `CERRADO`. Un caso no puede apuntar al cierre de otro. La PK de `caso_cierre` impide dos cierres.

La secuencia de apertura y la de cierre están en `TRANSACTION_CONTRACTS.md`. `valoracion_vigente_id` permanece `NOT NULL`. No hizo falta debilitarlo: la valoración existe antes del `INSERT` del caso.

## Índices de consulta

Además de las PK, las únicas y los filtrados de vigencia, quedan los índices de bandeja de referencia, el de motivos, el de posibles referencias, los tres de caso con `INCLUDE (valoracion_vigente_id)`, los de atención individual por caso y fecha, el de grupal por fecha y oficina, el filtrado de participación efectiva, el de programación por oficina, estado y fecha vigente, el de cierre por motivo y fecha, y los dos de auditoría. No se creó un índice por cada FK. No se indexa `bor_captura.contenido`.

## Decisiones físicas mínimas

No cambian el modelo seleccionado. Quedan visibles para no parecer reglas nuevas.

1. `dbo.schema_migracion` es el libro técnico de versiones. No es una entidad de expediente.
2. `ops.cerrar_caso` es la frontera de escritura del cierre. El diseño ya pedía que el rol de aplicación no insertara `caso_cierre` ni actualizara el estado.
3. Las columnas compañeras de catálogo (`via_catalogo`, `motivo_catalogo`, `frecuencia_catalogo` y las demás) materializan la FK compuesta de la sección 5.2 donde el detalle de la tabla solo nombraba el identificador del ítem.
4. `cat_matriz_prioridad.codigo_catalogo` obliga a que la versión sea `MATRIZ_PRIORIDAD`.
5. `caso_ai (caso_id, plan_vigente_id)` apunta a `caso_plan (caso_id, plan_id)`. El puntero no puede caer en el plan de otro caso. Es el mismo recurso que el cierre usa con el historial. La apertura sigue dejando el puntero nulo hasta que el plan existe.
6. `CK_ref_posible_referencia_estado` exige referencia informada solo cuando el estado es `REFERENCIA_CREADA`, y nula cuando es `PENDIENTE`.
7. `CK_ref_referencia_plantilla` exige versión cuando el origen es `PLANTILLA`.
8. `CK_ref_referencia_consecutivo` cubre el patrón de RF-114, los nueve códigos DR, el ancho `OL` de tres dígitos, `REF` de tres dígitos y el año `20` más dos dígitos. No compara el establecimiento con la persona: esa correspondencia es de servicio, porque depende del identificador institucional autorizado.
9. Los identificadores territoriales, cuando vienen informados, son mayores que cero. No son un catálogo local.
10. `prog_actividad.region_id` es el snapshot que el diseño ya añadió para no consultar el adaptador en cada lista.
11. `fecha_coordinacion` y `motivo` de coordinación quedan anulables: el diseño no los marcó obligatorios.
12. `clave_almacen` y `tamano_bytes` quedan obligatorios en un documento ya guardado. El binario sigue fuera de la base.

## Lo que el motor no cierra

- Un caso `ACTIVO` con una fila de `caso_cierre` ya confirmada. Lo evitan la transacción única, la ausencia de `INSERT` directo y la conciliación.
- Un historial `CERRADO` que ningún cierre referencia.
- Una atención nueva sobre un caso ya cerrado. La rechaza la transacción, no la FK.
- Categorías requeridas, al menos una disciplina al confirmar la sesión, al menos un participante y de cinco a doce visualizaciones. Un `CHECK` no cuenta hijas.
- La correspondencia del establecimiento en el consecutivo.
- El ámbito de la persona usuaria.
- Una sola versión de instrumento marcada `vigente`. El modelo solo exige `numero_version` único. Un índice filtrado de un solo vigente sería una regla que el diseño seleccionado no escribió, así que no está en el motor.

## Reportería

Las consultas de `queries/010_reporting_reference.sql` cubren las doce visualizaciones con el reparto del diseño: establecimiento, sexo y edad vía adaptador, prioridad por la valoración vigente, estado actual, cancelaciones por texto, motivos de referencia, atenciones sin contar participantes, cierres por motivo, explicación de Otro solo para el rol que puede tokenizarla, y la cobertura.

El denominador son personas distintas con caso activo ahora, dentro del mismo predicado de ámbito. El numerador es el subconjunto con al menos una atención efectiva de ese mismo caso en el año. `UNION` deja personas únicas. El nacional usa la misma fórmula sobre el universo nacional. No promedia porcentajes regionales. RN-040 sigue provisional.
