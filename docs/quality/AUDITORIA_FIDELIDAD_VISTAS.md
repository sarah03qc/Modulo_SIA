# Auditoría de fidelidad de vistas — SIA-CENCINAI

Responsable: Sarah Priscilla Quesada Chaves.
Fecha: 2026-11-17.

Fuente de comparación: `docs/quality/GUIA_AJUSTE_FIDELIDAD_VISTAS_SIA_CENCINAI.md`,
contrastada con `FUNCTIONAL_SPEC_v0.7.md`, `USE_CASES_v0.7.md` y el código vigente.
No se consultó el repositorio del prototipo.

Precedencia aplicada: decisión institucional posterior documentada, luego HU/RF/RN/CU
de v0.7, luego etiquetas y disposición del prototipo, y al final las sugerencias
visuales. Una vista no se declara conforme si sus campos, términos, opciones o
comportamiento no fueron revisados.

## 1. Matriz de discrepancias

| ID | Vista | Diferencia | Clasificación | Corrección |
|---|---|---|---|---|
| D-001 | Valoración | El selector decía «Riesgo profesional». El nombre aprobado es «Nivel de riesgo». Los códigos ALTO, MODERADO y BAJO no cambian. | ERROR_CONFIRMADO | Corregido en `SituacionTrabajo.jsx` y en el detalle de caso. Comprobado en navegador. |
| D-002 | Valoración | El selector decía «Protección profesional». El nombre aprobado es «Nivel de protección». Los códigos ALTA, MODERADA y BAJA no cambian. | ERROR_CONFIRMADO | Corregido. Comprobado en navegador. |
| D-003 | Nueva referencia | Los motivos se mostraban en lista plana. Deben agruparse en Crecimiento, Desarrollo, Salud y Factores de riesgo. | ERROR_CONFIRMADO | Corregido en el formulario. La clasificación sale de `MOTIVE_CATEGORY_BY_CODE`. Comprobado con el catálogo vivo. |
| D-004 | Nueva referencia | RF-024, HU-013 CA-13 y CU-04 FA-03 distinguen factor individual, hogar-familiar y comunitario. La semilla `010_confirmed_catalogs.sql` no los inserta. | OMISION_FUNCIONAL | El grupo se muestra. El API ya clasifica esos códigos. El alta está en `pending/100_motivos_factor_riesgo.sql` y no se ejecutó. |
| D-005 | Nueva referencia | Las narrativas usaban nombres abreviados. Deben decir «Acciones realizadas previo a la referencia», «Resultados obtenidos previo a la referencia» e «Información complementaria asociada al motivo de referencia». | ERROR_CONFIRMADO | Corregido en formulario y documento. El contrato interno no cambió. Comprobado en navegador. |
| D-006 | Valoración | RF-042 exige tres ámbitos por tres ejes. El instrumento vigente de `020_synthetic_dataset.sql` tiene dos categorías sintéticas. | OMISION_FUNCIONAL | La interfaz agrupa los tres ámbitos y avisa «2 de 9». No inventa factores. El texto del prototipo está en `pending/101_instrumento_valoracion_v2.sql` y no se ejecutó. |
| D-007 | Personas | El prototipo tenía un catálogo general de clientes. v0.7 lo retiró. | CAMBIO_APROBADO | No se reintrodujo. La búsqueda sigue siendo contextual. |
| D-008 | Traslado | El prototipo proponía confirmar recepción y continuidad automática. v0.7 cierra el caso origen y no abre un caso destino. | CAMBIO_APROBADO | Se conserva el texto de `CicloCaso.jsx`: el traslado no crea un caso en el destino. |
| D-009 | Calidad regional, laboratorio y chat | Esas pantallas están en el prototipo y v0.7 las deja fuera. | CAMBIO_APROBADO | No se agregaron. |
| D-010 | Nueva referencia | La captura estaba en un solo formulario. La guía pide cuatro etapas y revisión. | OMISION_FUNCIONAL | Corregido: persona y trazabilidad, motivo, narrativas y revisar. Motivo y narrativas se recorrieron en navegador. La referencia no se envió. |
| D-011 | Reportería HU-050 | El asistente de 5 a 12 visualizaciones está en Oficina Local. Regional y Nacional no deben anunciarlo como habilitado. | CAMBIO_APROBADO | Se conserva el aviso de solo lectura y de que HU-050 sigue en Oficina Local. |
| D-012 | Nueva referencia | Salud del prototipo tiene trece opciones. La semilla solo trae «Otra condición de salud». La ausencia en v0.7 no retira el prototipo aprobado. | APROBADO EN PROTOTIPO | Script `102_motivos_salud_completos.sql` preparado, sin ejecutar. La API ya clasifica los trece códigos. El formulario los muestra cuando el catálogo vigente los devuelve. |
| D-013 | Valoración | La guía escribe «Hogar-Familiar». RF-042 y los casos de uso escriben «Hogar/Familiar». | CAMBIO_APROBADO | Se conserva «Hogar/Familiar». |
| D-014 | Valoración | «Ninguno» debe excluir factores, y un factor abierto debe pedir especificación. | ERROR_CONFIRMADO | Ya estaba en servicio y formulario. Comprobado en prueba y, para Ninguno, en la sesión abierta. |
| D-015 | Bandeja de referencias | Faltaban el título, el bloque de bandeja y filtros de vía, origen y categoría. | OMISION_FUNCIONAL | Corregido en `ListaReferencias.jsx`. No se recorrió de nuevo en navegador en este cierre. |
| D-016 | Casos | El título de Oficina Local y los filtros no usaban los nombres de la guía. | ERROR_CONFIRMADO | Título «Casos de Atención Interdisciplinaria», contexto «Gestión del caso», «Estado del caso» y «Prioridad del caso». Comprobado en navegador. |
| D-017 | Casos Regional y Nacional | Esas vistas usan «Casos de la Región» y «Casos nacionales». | MEJORA_COMPATIBLE | Se conservan para distinguir el ámbito. No se igualaron al título de Oficina Local. |
| D-018 | Atenciones | Faltaba el contexto «Atención y seguimiento». La asistencia decía «Asistió». | ERROR_CONFIRMADO | Contexto corregido y comprobado. La casilla dice «Presente» o «Ausente». La lista de participantes estaba vacía, así que ese control no se accionó. |
| D-019 | Atenciones grupales | La frontera con sesiones educativas generales no está cerrada. | NEEDS_VALIDATION | Se conserva el aviso. No se inventó una equivalencia de tipos. |
| D-020 | Programación | El encabezado decía «Programación de la Oficina Local». | ERROR_CONFIRMADO | Título «Programación» y contexto «Planificación operativa». Estados Programada, Realizada, Reprogramada y Cancelada. «Vencida» sigue como alerta. No se recorrió en navegador en este cierre. |
| D-021 | Reportería | Cinco títulos no coincidían con §15.3. | ERROR_CONFIRMADO | Títulos alineados en `definiciones-analiticas.js`. Los códigos no cambiaron. La pantalla no se recorrió en este cierre. |
| D-022 | Reportería | El título visible distingue Oficina Local, región y país. La guía usa «Reportería». | MEJORA_COMPATIBLE | Se conserva el ámbito en el título. |
| D-023 | Inicio | «Posibles referencias» no tiene fuente verificada. | NEEDS_VALIDATION | Sigue como indicador que consume la disponibilidad del API. No hay pantalla ni conteo inventado. |
| D-024 | Posibles referencias | HU-049 pide una sección independiente. No hay fuente SIDINACC autorizada para detectar candidatos. | NEEDS_VALIDATION | No se creó la pantalla. |
| D-025 | Coordinación | El prototipo lista instituciones de comparación. El catálogo institucional vigente debe confirmarse antes de sustituir opciones. | NEEDS_VALIDATION | El formulario usa el catálogo que devuelve el API. No se copió la lista del prototipo. |
| D-026 | Diseño transversal | La guía sugiere barra lateral y paneles lado a lado. | MEJORA_COMPATIBLE | No se reconstruyó el frontend. La navegación superior y los cuatro ámbitos se conservan. |
| D-027 | Casillas | La regla global `input { width: 100% }` separaba la casilla de su texto. | ERROR_CONFIRMADO | Corregido para motivos y categorías de valoración. Comprobado en el paso Motivo. |

## 2. Correcciones implementadas

Referencias:

- Cuatro etapas, con responsable de solo lectura tomado de la sesión.
- Motivos agrupados y detalle opcional por motivo seleccionado.
- Nombres completos de las tres narrativas.
- Bandeja con título, filtros de estado, identificación, nombre, consecutivo,
  Vía de Atención, origen y categoría, y acción «Imprimir referencia».
- El API clasifica los tres códigos de factor de riesgo cuando existan en SQL.
  Si no existen, `riskFactors` queda en `NEEDS_VALIDATION` y el formulario muestra
  ese mensaje.

Valoración y casos:

- Etiquetas «Nivel de riesgo» y «Nivel de protección».
- Tres regiones: Individual, Hogar/Familiar y Comunitario.
- Aviso cuando el instrumento vigente no trae las nueve categorías.
- «Ninguno» excluye factores. Un factor marcado puede especificarse.
- La prioridad sigue calculada. No es un campo editable.
- Lista de casos de Oficina Local con el título y los filtros de la guía.

Atenciones y programación:

- Contexto «Atención y seguimiento» y asistencia «Presente» / «Ausente».
- Encabezado «Programación» y contexto «Planificación operativa».

Reportería:

- Los cinco títulos de §15.3 quedaron así, sin cambiar códigos ni cálculos:
  «Principales motivos de cancelación de actividades programadas»,
  «Principales motivos de referencia a A.I.»,
  «Atenciones REALIZADAS por tipo»,
  «Motivos de cierre de casos A.I.» y
  «Palabras más frecuentes en cierres con motivo Otro».

No se modificaron rutas HTTP, códigos de catálogo, la matriz RN-009,
los cuatro niveles de acceso ni las restricciones territoriales.
No se envió la referencia de prueba ni se registró una valoración.

## 3. Catálogos aprobados frente a SQL

Motivos de referencia en `database/sia-cencinai/seeds/010_confirmed_catalogs.sql`:

| Código | Etiqueta confirmada | Grupo en la interfaz |
|---|---|---|
| CONDICION_MALNUTRICION | Condición de malnutrición | Crecimiento |
| MALNUTRICION_NECESIDADES_ESPECIALES | Malnutrición con necesidades especiales | Crecimiento |
| EDIN_II_RIESGO_RETRASO_ROJO | EDIN II: riesgo de retraso (rojo) | Desarrollo |
| EVADE_RIESGO_REZAGO_0_1 | EVADE: riesgo de rezago (0,1 sin logro de edad anterior) | Desarrollo |
| OTRA_CONDICION_SALUD | Otra condición de salud | Salud |

El navegador, con la sesión de establecimiento, mostró exactamente esas cinco
opciones. El grupo Factores de riesgo mostró el aviso de catálogo incompleto.

También están confirmados y se siguen usando: Vía de Atención Urgencia y
No inmediata; orígenes Vigilancia / tamizaje, Observación, Información aportada
por la familia u otros y Referencia externa; cierre Cierre satisfactorio,
Traslado y Otro.

Instrumento de valoración vigente en la semilla sintética `020`:

| Versión | Categorías | Factores |
|---|---|---|
| 1, vigente en la base usada | Protector individual y riesgo individual | SYN_PROT_01 y SYN_RIESGO_01 |

La sesión 10544, referencia 737, mostró esas dos categorías, los ámbitos
Hogar/Familiar y Comunitario vacíos, y el aviso de 2 de 9. No se agregaron
factores en el cliente.

El script 101 transcribe 74 factores del apartado 5 de la guía, en nueve
categorías, como versión 2. Ese texto no es todavía un instrumento institucional
vigente.

## 4. Capturas

Quedaron en `docs/quality/capturas/`:

- `referencia-motivos.png`: cuatro grupos, detalle del factor y aviso de
  factores de riesgo.
- `referencia-narrativas.png`: nombres completos de las tres narrativas.
- `valoracion-ambitos.png`: tres ámbitos, aviso de cobertura, Nivel de riesgo
  y Nivel de protección.
- `atenciones-contexto.png`: contexto y campos de atención individual.

La lista de casos se comprobó en navegador. Su captura muestra identificaciones
del conjunto sintético, así que no se guardó en el repositorio. El título,
«Gestión del caso», «Estado del caso» y «Prioridad del caso» sí se vieron.

## 5. Pruebas

Ejecutadas el 2026-11-17, sin aplicar scripts SQL:

- `@sia/web`: 6 suites, 17 pruebas, resultado correcto. Incluye
  `tests/fidelidad-vistas.test.jsx`.
- `@sia/api`: `reference-rules.test.js`, `reference-service.test.js` y
  `proceso-servicio.test.js`: 3 suites, 41 pruebas, resultado correcto.
- ESLint sobre formulario de referencia, valoración, atenciones, casos y la
  prueba de fidelidad: terminó sin hallazgos.

No se ejecutó la cadena de migraciones. No se modificaron bases de identidad
ni casos reservados de demostración. La API de verificación escuchó en el
puerto 4000 porque el puerto 3001 está dentro de un rango excluido de Windows.
Ese puerto no se escribió en `.env` ni en el código.

## 6. Scripts pendientes

No forman parte de la cadena `001` a `090`. `@permitir` queda en 0 y el script
lanza un error si se ejecuta así. No insertan fila en `dbo.schema_migracion`
ni reescriben referencias, valoraciones ni historial.

- `database/sia-cencinai/pending/100_motivos_factor_riesgo.sql`
  Inserta, en la versión vigente de `MOTIVO_REFERENCIA`, tres ítems si faltan:
  FACTOR_RIESGO_INDIVIDUAL, FACTOR_RIESGO_HOGAR_FAMILIAR y
  FACTOR_RIESGO_COMUNITARIO.
- `database/sia-cencinai/pending/101_instrumento_valoracion_v2.sql`
  Crea la versión 2 con nueve categorías y 74 factores, la marca vigente y
  deja de marcar vigente a las demás versiones. Las valoraciones ya emitidas
  conservan su `instrumento_version_id`.

Hasta una autorización explícita, los ítems de ambos scripts siguen en
`NEEDS_VALIDATION`.

## 7. Validación institucional que sigue abierta

- Ejecutar o no los tres motivos de factor de riesgo y la versión 2 del
  instrumento. La interfaz ya está preparada para leerlos cuando existan.
- Confirmar si las alternativas de Salud del prototipo, distintas de
  «Otra condición de salud», forman parte del catálogo vigente.
- Confirmar el catálogo de instituciones de coordinación antes de sustituir
  opciones.
- Cerrar la frontera entre atención grupal de A.I. y sesiones educativas
  generales.
- Decidir la fuente de Posibles referencias antes de crear esa sección.
- Recorrer en navegador, en un siguiente pase, la bandeja de referencias,
  programación, reportería, inicio por los cuatro ámbitos y el expediente
  Regional o Nacional. Esas vistas se revisaron en código y no se declaran
  conformes por ese solo medio.

## 8. Conformidad

| Vista | Estado de esta auditoría |
|---|---|
| Nueva referencia | Campos, grupos, opciones vivas y narrativas comprobados. No conforme del todo: faltan en SQL los factores de riesgo y queda abierta la lista ampliada de Salud. |
| Valoración | Etiquetas, ámbitos, Ninguno y aviso comprobados. No conforme del todo: el instrumento vigente sigue siendo el sintético de dos categorías. |
| Bandeja de referencias | Corregida en código. Falta recorrido de navegador. |
| Búsqueda contextual | Se usa dentro de la referencia. No se reintrodujo el catálogo general. |
| Casos de Oficina Local | Título, contexto y filtros comprobados. El expediente completo no se recorrió. |
| Atenciones | Contexto y campos individuales comprobados. La asistencia Presente/Ausente no se accionó porque no había participantes. |
| Programación | Encabezado y estados revisados en código. Falta recorrido. |
| Reportería | Títulos de definición alineados a §15.3. Falta recorrido de las doce visualizaciones. |
| Inicio, Regional y Nacional | Revisados en código. Falta recorrido con cada identidad. |
| Posibles referencias, calidad, laboratorio y chat | Fuera de implementación, por falta de fuente o por decisión v0.7. |

## 9. Validación previa de los scripts 100 y 101

Fecha: 2026-11-18. No se ejecutaron y `@permitir` sigue en 0.

| Script | Veredicto |
|---|---|
| `pending/100_motivos_factor_riesgo.sql` | `APTO_PARA_DESARROLLO`. Orden ajustado a 18, 19 y 20 antes de cualquier ejecución, para quedar después de Salud. |
| `pending/101_instrumento_valoracion_v2.sql` | `APTO_PARA_DESARROLLO` |
| `pending/102_motivos_salud_completos.sql` | Preparado el 2026-11-18. Completa las doce opciones de Salud y exige los 20 motivos. No ejecutado. |

Los 74 factores del script 101 coinciden, uno por uno, con la sección 5 de la
guía: etiqueta, orden y factor abierto. Los tres motivos del script 100
coinciden con RF-024 y con la sección 3.4. Ninguno de los dos modifica filas
históricas. Activar la versión 2 en desarrollo no equivale a una aprobación
institucional del instrumento.

La comprobación de solo lectura está en
`database/sia-cencinai/pending/comprobacion_catalogos_100_101.sql`.
El contraste automatizado está en
`apps/api/tests/catalogos-fidelidad-pendientes.test.js`.

## 10. Catálogo aprobado del prototipo — 2026-11-18

La guía, sección 3.4, es la transcripción del prototipo aprobado. Que v0.7 no
repita las doce condiciones de Salud no las retira. Los veinte motivos quedan
clasificados en la API, en este orden, y las filas nuevas están en los scripts
100 y 102. Esos scripts no se ejecutaron.

| Orden | Código | Grupo |
|---|---|---|
| 1 | CONDICION_MALNUTRICION | Crecimiento |
| 2 | MALNUTRICION_NECESIDADES_ESPECIALES | Crecimiento |
| 3 | EDIN_II_RIESGO_RETRASO_ROJO | Desarrollo |
| 4 | EVADE_RIESGO_REZAGO_0_1 | Desarrollo |
| 5 | ALTERACION_VISUAL | Salud |
| 6 | ALTERACION_AUDITIVA | Salud |
| 7 | ALTERACION_DEL_LENGUAJE | Salud |
| 8 | ALTERACION_MOTORA | Salud |
| 9 | ALTERACION_SALUD_ORAL | Salud |
| 10 | ALERGIA_ALIMENTARIA | Salud |
| 11 | ENFERMEDAD_CRONICA | Salud |
| 12 | LACTANCIA_MATERNA_ALIMENTACION_COMPLEMENTARIA | Salud |
| 13 | TRASTORNO_ESPECIFICO_APRENDIZAJE | Salud |
| 14 | SOSPECHA_O_DIAGNOSTICO_TRASTORNO_NEURODESARROLLO | Salud |
| 15 | ALTERACIONES_EMOCIONALES | Salud |
| 16 | ALTERACIONES_CONDUCTUALES | Salud |
| 17 | OTRA_CONDICION_SALUD | Salud |
| 18 | FACTOR_RIESGO_INDIVIDUAL | Factores de riesgo |
| 19 | FACTOR_RIESGO_HOGAR_FAMILIAR | Factores de riesgo |
| 20 | FACTOR_RIESGO_COMUNITARIO | Factores de riesgo |

La base de desarrollo sigue con los cinco motivos de la semilla hasta que se
autorice la ejecución. React no tiene una segunda lista: lee el catálogo de la
API. La prueba de interfaz confirma que, cuando ese catálogo trae los veinte,
el formulario muestra los cuatro grupos, las trece opciones de Salud y una
especificación por motivo seleccionado.

El instrumento de valoración sigue en el script 101: nueve categorías y 74
factores, sin ejecutar. La pantalla vigente sigue avisando que el instrumento
sintético trae 2 de 9.

### Vistas revisadas en esta pasada

| Vista | Estado |
|---|---|
| Nueva referencia | IMPLEMENTADO el agrupamiento y la clasificación de 20 códigos. VERIFICADO en prueba de componente. PENDIENTE DE IMPLEMENTACIÓN en la base: faltan las filas de los scripts 100 y 102. |
| Valoración | IMPLEMENTADA la estructura de nueve categorías. PENDIENTE DE IMPLEMENTACIÓN el instrumento de 74 factores hasta ejecutar el script 101. |
| Bandeja | IMPLEMENTADO el título, los filtros y el detalle. Falta recorrido de navegador en esta pasada. |
| Casos | IMPLEMENTADO el título «Casos de Atención Interdisciplinaria» también para Región y Nacional. El establecimiento conserva la lista mínima. |
| Reportería | IMPLEMENTADO el título «Reportería» y el contexto «Analítica operativa». El alcance territorial queda en el texto de la pantalla. |
| Atenciones, programación, sesiones, inicio y búsqueda | Revisados en código. Los nombres ya alineados en la auditoría anterior se conservan. No se declara verificación de navegador en esta pasada. |
| Posibles referencias | PENDIENTE DE IMPLEMENTACIÓN como pantalla. No hay fuente de detección que pueda mostrarse sin inventar candidatos. |
| Calidad regional, laboratorio y chat | CAMBIO POSTERIOR APROBADO: v0.7 los retira. No se reintroducen. |
| Continuidad automática por traslado | CAMBIO POSTERIOR APROBADO. El caso origen se cierra y no se abre un caso destino. |
