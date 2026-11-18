# Auditoría de fidelidad de vistas — SIA-CENCINAI

Responsable: Sarah Priscilla Quesada Chaves.
Fecha de la comparación inicial: 2026-11-17.
Verificación de catálogos en la base local: 2026-11-18.

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
| D-004 | Nueva referencia | RF-024, HU-013 CA-13 y CU-04 FA-03 distinguen factor individual, hogar-familiar y comunitario. La semilla `010_confirmed_catalogs.sql` no los inserta. | OMISION_FUNCIONAL | Aplicado el 2026-11-18 en la base local con el script 100, órdenes 18, 19 y 20. El formulario los muestra. |
| D-005 | Nueva referencia | Las narrativas usaban nombres abreviados. Deben decir «Acciones realizadas previo a la referencia», «Resultados obtenidos previo a la referencia» e «Información complementaria asociada al motivo de referencia». | ERROR_CONFIRMADO | Corregido en formulario y documento. El contrato interno no cambió. Comprobado en navegador. |
| D-006 | Valoración | RF-042 exige tres ámbitos por tres ejes. La semilla `020_synthetic_dataset.sql` deja la versión 1 con dos categorías sintéticas. | OMISION_FUNCIONAL | Aplicado el 2026-11-18 en la base local con el script 101. La versión 2 quedó vigente: nueve categorías y 74 factores. La versión 1 sigue histórica y no vigente. El aviso de instrumento incompleto no aparece. |
| D-007 | Personas | El prototipo tenía un catálogo general de clientes. v0.7 lo retiró. | CAMBIO_APROBADO | No se reintrodujo. La búsqueda sigue siendo contextual. |
| D-008 | Traslado | El prototipo proponía confirmar recepción y continuidad automática. v0.7 cierra el caso origen y no abre un caso destino. | CAMBIO_APROBADO | Se conserva el texto de `CicloCaso.jsx`: el traslado no crea un caso en el destino. |
| D-009 | Calidad regional, laboratorio y chat | Esas pantallas están en el prototipo y v0.7 las deja fuera. | CAMBIO_APROBADO | No se agregaron. |
| D-010 | Nueva referencia | La captura estaba en un solo formulario. La guía pide cuatro etapas y revisión. | OMISION_FUNCIONAL | Corregido: persona y trazabilidad, motivo, narrativas y revisar. Recorrido en navegador y envío sintético comprobados. |
| D-011 | Reportería HU-050 | El asistente de 5 a 12 visualizaciones está en Oficina Local. Regional y Nacional no deben anunciarlo como habilitado. | CAMBIO_APROBADO | Se conserva el aviso de solo lectura y de que HU-050 sigue en Oficina Local. |
| D-012 | Nueva referencia | Salud del prototipo tiene trece opciones. La semilla solo trae «Otra condición de salud». La ausencia en v0.7 no retira el prototipo aprobado. | APROBADO EN PROTOTIPO | Aplicado el 2026-11-18 en la base local con el script 102. El formulario muestra las trece opciones, incluida «Otra condición de salud». |
| D-013 | Valoración | La guía escribe «Hogar-Familiar». RF-042 y los casos de uso escriben «Hogar/Familiar». | CAMBIO_APROBADO | Se conserva «Hogar/Familiar». |
| D-014 | Valoración | «Ninguno» debe excluir factores, y un factor abierto debe pedir especificación. | ERROR_CONFIRMADO | Ya estaba en servicio y formulario. Comprobado en prueba y, para Ninguno, en la sesión abierta. |
| D-015 | Bandeja de referencias | Faltaban el título, el bloque de bandeja y filtros de vía, origen y categoría. | OMISION_FUNCIONAL | Corregido en `ListaReferencias.jsx`. Recorrido en navegador: filtro por consecutivo, detalle e impresión. |
| D-016 | Casos | El título de Oficina Local y los filtros no usaban los nombres de la guía. | ERROR_CONFIRMADO | Título «Casos de Atención Interdisciplinaria», contexto «Gestión del caso», «Estado del caso» y «Prioridad del caso». Comprobado en navegador. |
| D-017 | Casos Regional y Nacional | Esas vistas usan «Casos de la Región» y «Casos nacionales». | MEJORA_COMPATIBLE | Se conservan para distinguir el ámbito. No se igualaron al título de Oficina Local. |
| D-018 | Atenciones | Faltaba el contexto «Atención y seguimiento». La asistencia decía «Asistió». | ERROR_CONFIRMADO | Contexto corregido y comprobado. La casilla dice «Presente» o «Ausente». La lista de participantes estaba vacía, así que ese control no se accionó. |
| D-019 | Atenciones grupales | La frontera con sesiones educativas generales no está cerrada. | NEEDS_VALIDATION | Se conserva el aviso. No se inventó una equivalencia de tipos. |
| D-020 | Programación | El encabezado decía «Programación de la Oficina Local». | ERROR_CONFIRMADO | El 2026-11-18 la pantalla mostró el filtro de estado, los cuatro estados y el formulario para programar. No se creó una actividad. |
| D-021 | Reportería | Cinco títulos no coincidían con §15.3. | ERROR_CONFIRMADO | Títulos alineados en `definiciones-analiticas.js`. El 2026-11-18 se vieron las doce visualizaciones en Oficina Local, Región y Nacional. |
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
El 2026-11-18 se envió una referencia sintética y se registró una valoración
en una sesión nueva. No se tocaron los casos reservados de demostración.

## 3. Catálogos aprobados frente a SQL

Motivos de referencia en `database/sia-cencinai/seeds/010_confirmed_catalogs.sql`:

| Código | Etiqueta confirmada | Grupo en la interfaz |
|---|---|---|
| CONDICION_MALNUTRICION | Condición de malnutrición | Crecimiento |
| MALNUTRICION_NECESIDADES_ESPECIALES | Malnutrición con necesidades especiales | Crecimiento |
| EDIN_II_RIESGO_RETRASO_ROJO | EDIN II: riesgo de retraso (rojo) | Desarrollo |
| EVADE_RIESGO_REZAGO_0_1 | EVADE: riesgo de rezago (0,1 sin logro de edad anterior) | Desarrollo |
| OTRA_CONDICION_SALUD | Otra condición de salud | Salud |

Esas cinco filas siguen siendo el contenido de la semilla. En la base local,
después de los scripts 100 y 102, el catálogo vigente tiene los veinte motivos
de la sección 10. El navegador los mostró en los cuatro grupos.

También se siguen usando: Vía de Atención Urgencia y No inmediata; orígenes
Vigilancia / tamizaje, Observación, Información aportada por la familia u otros
y Referencia externa; cierre Cierre satisfactorio, Traslado y Otro.

La semilla sintética `020` deja la versión 1 con dos categorías y dos factores.
Después del script 101 esa versión permanece, con `vigente = 0`. La versión 2
es la única vigente: nueve categorías y 74 factores. Activarla en desarrollo
local no oficializa el instrumento ante la institución. Una valoración ya
guardada conserva su `instrumento_version_id`. Un formulario abierto que aún
tenga identificadores de la versión 1 será rechazado al enviarse.

## 4. Capturas

Quedaron en `docs/quality/capturas/`:

- `referencia-motivos.png`: cuatro grupos, detalle del factor y aviso de
  factores de riesgo. Corresponde al catálogo anterior a la activación.
- `referencia-motivos-completos.png`: los cuatro grupos y los veinte motivos
  del catálogo local vigente. No incluye datos de una persona.
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

## 6. Scripts de catálogo

No forman parte de la cadena `001` a `090`. En el repositorio `@permitir`
queda en 0 y el script lanza un error si se ejecuta así. No insertan fila en
`dbo.schema_migracion` ni reescriben referencias, valoraciones ni historial.
La ejecución del 2026-11-18 usó copias temporales con `@permitir = 1`.

- `database/sia-cencinai/pending/100_motivos_factor_riesgo.sql`
  Inserta, en la versión vigente de `MOTIVO_REFERENCIA`, tres ítems si faltan:
  FACTOR_RIESGO_INDIVIDUAL, FACTOR_RIESGO_HOGAR_FAMILIAR y
  FACTOR_RIESGO_COMUNITARIO.
- `database/sia-cencinai/pending/101_instrumento_valoracion_v2.sql`
  Crea la versión 2 con nueve categorías y 74 factores, la marca vigente y
  deja de marcar vigente a las demás versiones. Las valoraciones ya emitidas
  conservan su `instrumento_version_id`.
- `database/sia-cencinai/pending/102_motivos_salud_completos.sql`
  Agrega las doce condiciones de Salud que faltaban, conserva
  «Otra condición de salud» y deja los veinte motivos en los órdenes 1 a 20.

Esos tres scripts quedaron aplicados en la base local de desarrollo.
La activación local no es un acto de oficialización institucional.

## 7. Validación institucional que sigue abierta

- Confirmar el catálogo de instituciones de coordinación antes de sustituir
  opciones.
- Cerrar la frontera entre atención grupal de A.I. y sesiones educativas
  generales.
- Decidir la fuente de Posibles referencias antes de crear esa sección.

## 8. Conformidad

| Vista | Estado de esta auditoría |
|---|---|
| Nueva referencia | Veinte motivos, cuatro grupos, cuatro pasos, especificaciones, revisión y envío comprobados en navegador. |
| Valoración | Nueve categorías, 74 factores, Ninguno, factor abierto, Nivel de riesgo, Nivel de protección y prioridad calculada comprobados. Se registró y recuperó una valoración. |
| Bandeja de referencias | Filtro, detalle e impresión comprobados con la referencia sintética enviada. |
| Búsqueda contextual | Se usa dentro de la referencia. No se reintrodujo el catálogo general. |
| Casos de Oficina Local | Título, contexto, filtros y expediente de un caso no reservado comprobados. |
| Atenciones | Contexto «Atención y seguimiento» y las secciones individual y grupal visibles. La asistencia no se modificó. |
| Programación | Filtros, estados y formulario visibles. No se programó una actividad nueva. |
| Reportería | Doce visualizaciones vistas en Oficina Local, Región y Nacional. El asistente HU-050 no aparece fuera de Oficina Local. |
| Inicio de Establecimiento | Navegación propia del ámbito, conteos y el aviso de posibles referencias. |
| Inicio de Oficina Local | Navegación del ámbito cargada. No se guardó captura porque lista casos reservados. |
| Consulta Regional y Nacional | Navegación reducida, consulta de solo lectura y doce visualizaciones. No se abrió un expediente de esos ámbitos. |
| Posibles referencias, calidad, laboratorio y chat | Fuera de implementación, por falta de fuente o por decisión v0.7. |

## 9. Validación previa de los scripts 100 y 101

Fecha: 2026-11-18, antes de la ejecución. `@permitir` sigue en 0 en el repositorio.
La ejecución local quedó en la sección 11.

| Script | Veredicto |
|---|---|
| `pending/100_motivos_factor_riesgo.sql` | `APTO_PARA_DESARROLLO`. Orden ajustado a 18, 19 y 20 antes de cualquier ejecución, para quedar después de Salud. |
| `pending/101_instrumento_valoracion_v2.sql` | `APTO_PARA_DESARROLLO` |
| `pending/102_motivos_salud_completos.sql` | `APTO_PARA_DESARROLLO`. Completa las doce opciones de Salud y exige los 20 motivos. |

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
clasificados en la API, en este orden. Las filas nuevas quedaron en la base
local con los scripts 100 y 102.

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

React no tiene una segunda lista: lee el catálogo de la API. Con el catálogo
local vigente, el formulario muestra los cuatro grupos, las trece opciones de
Salud y una especificación por motivo seleccionado.

El instrumento vigente es la versión 2: nueve categorías y 74 factores.
La pantalla ya no avisa que el instrumento trae 2 de 9.

### Vistas revisadas en esta pasada

| Vista | Estado |
|---|---|
| Nueva referencia | VERIFICADO en navegador con los veinte motivos y un envío sintético. |
| Valoración | VERIFICADO en navegador: nueve categorías, 74 factores y un registro nuevo. |
| Bandeja | VERIFICADO el filtro, el detalle y la impresión de esa referencia. |
| Casos | VERIFICADO el título y el expediente de un caso no reservado en Oficina Local. Región y Nacional muestran la consulta de solo lectura. |
| Reportería | VERIFICADO el título y las doce visualizaciones en Oficina Local, Región y Nacional. |
| Atenciones, programación, sesiones e inicio | Recorridos en navegador. No se creó una atención, una actividad ni un caso. |
| Posibles referencias | PENDIENTE DE IMPLEMENTACIÓN como pantalla. No hay fuente de detección que pueda mostrarse sin inventar candidatos. |
| Calidad regional, laboratorio y chat | CAMBIO POSTERIOR APROBADO: v0.7 los retira. No se reintroducen. |
| Continuidad automática por traslado | CAMBIO POSTERIOR APROBADO. El caso origen se cierra y no se abre un caso destino. |

## 11. Ejecución local del 2026-11-18

Instancia: contenedor local `sidinacc-local-sql`, SQL Server 2022 Developer,
puerto local 1433. Base `SIA_CENCINAI`. `SIDINACC_LOCAL` no se modificó.
No había otra base de aplicación en esa instancia. La cadena
`dbo.schema_migracion` seguía en las once migraciones `001` a `090`, todas
aplicadas. Los scripts 100, 101 y 102 no estaban aplicados.

Respaldo previo: `SIA_CENCINAI_20261118_catalogos.bak`, 30 531 584 bytes,
copiado fuera del repositorio. `RESTORE VERIFYONLY` informó que el conjunto
de respaldo es válido. No se restauró.

Los archivos del repositorio conservan `@permitir = 0`. La ejecución usó
copias temporales y `sqlcmd -b`, en este orden: 100, 101 y 102. Cada uno
terminó sin error de SQL y los siguientes solo se lanzaron después de revisar
los conteos.

| Elemento | Antes | Después de los scripts |
|---|---|---|
| Motivos de referencia activos | 5 | 20 |
| Crecimiento / Desarrollo / Salud / Factores de riesgo | 2 / 2 / 1 / 0 | 2 / 2 / 13 / 3 |
| Versión vigente del instrumento | 1 | 2 |
| Categorías y factores vigentes | 2 y 2 | 9 y 74 |
| Versiones vigentes simultáneas | 1 | 1 |
| Versión 1 | vigente, 2 categorías y 2 factores | histórica, los mismos 2 y 2 |
| Referencias / motivos guardados | 3040 / 3039 | 3040 / 3039 |
| Valoraciones / factores guardados | 2889 / 5450 | 2889 / 5450 |

No hubo códigos ni órdenes duplicados. La versión 1 no se reescribió.

La prueba funcional, después de esos conteos, agregó una referencia y una
valoración sintéticas. No se abrió un caso ni se modificó un caso reservado.

- Referencia 20695, consecutivo `DNCC-DRCS-OL101-1100102-REF-991-2026`,
  estado pendiente de revisión, persona `SYN-1100102-05`. Tres motivos con
  especificación propia. El documento HTML de impresión respondió 200.
- Sesión 20544 y valoración 20160, instrumento versión 2, riesgo Alto,
  protección Baja y prioridad Alto. Un factor abierto quedó guardado.
  Las 2889 valoraciones anteriores siguen en la versión 1.
- La precarga Excel de `ALTERACION_VISUAL` y `FACTOR_RIESGO_COMUNITARIO`
  respondió `PRELOAD`, válida y sin envío. El consecutivo de esa fila no
  quedó reservado.

La API de esta verificación escuchó en `127.0.0.1:4000` porque el puerto 3001
de `.env` cae en un rango excluido de Windows. Ese valor no se escribió en
`.env` ni en el código. Vite siguió en `5174`.

Diferencias que siguen abiertas: instituciones de coordinación, frontera entre
atención grupal y sesiones educativas generales, y la pantalla de posibles
referencias. La asistencia Presente/Ausente no se accionó. No se abrió un
expediente regional ni nacional. Región Brunca no se recorrió en este pase.
