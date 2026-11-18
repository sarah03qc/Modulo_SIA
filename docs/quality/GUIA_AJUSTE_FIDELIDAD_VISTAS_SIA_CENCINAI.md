# SIA-CENCINAI — Guía maestra de fidelidad funcional, terminológica y visual de interfaces

> **Documento operativo para Cursor / Codex — 17 de noviembre de 2026.**  
> **Objetivo:** revisar y ajustar la aplicación actual `Modulo_SIA` tomando como referencia los elementos verificables del prototipo institucional aprobado, la especificación funcional **v0.7** y los casos de uso **v0.7**, SIN necesitar abrir el repositorio `Prototipo`.  
> **Naturaleza:** especificación de contraste y aceptación, **no autorización para inventar catálogos o ejecutar migraciones**.  
> **Estado del sistema:** versión de práctica demostrable; conservar datos, seguridad, permisos y recorridos que ya funcionan.

---

## 0. Criterios de lectura y fuentes de autoridad

### 0.1 Fuentes de donde se extrajeron las definiciones

1. Código inspeccionado del prototipo de referencia, repositorio `sarah03qc/Prototipo`, ruta raíz `sia-cencinai-demo/src/`. Los archivos de mayor relevancia son `data/catalogs.js`, `utils/valuation.js`, `pages/ReferencesPage.jsx`, `pages/SessionsPage.jsx`, `components/ValuationFields.jsx`, `components/FactorCategory.jsx`, `pages/CasesPage.jsx`, `pages/AttentionsPage.jsx`, `pages/SchedulePage.jsx`, `pages/ReportingPage.jsx`, `components/ReportWizard.jsx`, `pages/DashboardPage.jsx`, `pages/PeoplePage.jsx`, `pages/PossibleReferencesPage.jsx` y `components/CaseSpecialPanels.jsx`.
2. Especificación **`FUNCTIONAL_SPEC_v0.7.md`**: fuentes vigentes detalladas que deben prevalecer en cambios posteriores documentados. Ver especialmente §2, §3, §5, HU-001 a HU-050, §15.1–15.4.
3. **`USE_CASES_v0.7.md`**: CU-01 a CU-38, con estados de aplicación y restricciones.
4. Evidencia técnica más reciente de `Modulo_SIA`: formularios actuales `apps/web/src/funcionalidades/referencias/FormularioReferencia.jsx` y `apps/web/src/funcionalidades/sesiones/SituacionTrabajo.jsx`; constantes `apps/api/src/modules/references/reference-constants.js`; servicio `apps/api/src/modules/proceso-interdisciplinario/servicio-proceso.js`.

**Importante:** No se ha ejecutado aquí una comparación visual en navegador de *todas* las vistas ni una consulta de todos los catálogos reales de SQL Server. Las referencias de prototipo y las reglas v0.7 sí son verificables; la correspondencia exhaustiva con el frontend actual y las filas reales de base de datos son **tareas que Cursor debe verificar**, no conclusiones adelantadas.

### 0.2 Orden de precedencia para resolver contradicciones

- **P1 — decisión institucional posterior y documentada, si existe**; por ejemplo, la versión 0.7 retiró la pantalla general de Personas/Clientes y el proceso de continuidad automática por traslado.
- **P2 — HU/RF/RN/CU vigentes de v0.7**, incluidas sus restricciones.
- **P3 — etiquetas, distribución, controles y comportamiento del prototipo de referencia**, cuando siguen siendo compatibles con P1/P2.
- **P4 — detalles visuales sugeridos en esta guía**, que pueden adaptarse sin alterar semántica.

No considerar un nombre nuevo como aprobado simplemente porque está en React, en la semilla SQL o en una prueba automatizada. No reintroducir elementos **retirados** solo porque aparecen en el prototipo.

### 0.3 Claves de obligatoriedad

- **[EXACTO]** cadena, catálogo o regla confirmada; reproducir sin reinterpretación semántica.
- **[OBLIGATORIO]** comportamiento vigente que debe verificarse en UI, API y datos cuando corresponda.
- **[DISEÑO]** recomendación visual compatible, no norma institucional.
- **[COMPROBAR]** observación que requiere inspección de la aplicación o SQL; no presumir fallo.
- **[NO COPIAR]** elemento antiguo del prototipo reemplazado en v0.7.
- **[VALIDACIÓN]** no introducir como obligación funcional hasta que exista aprobación.

### 0.4 Reglas transversales de corrección

1. Un fallo de etiquetas no autoriza reescribir el backend. Corregir el nivel mínimo de intervención y añadir regresión.
2. Para catálogos incompletos, determinar primero si faltan opciones en SQL, API, componentes o validación; conservar identificadores/versiones e historial.
3. Nunca sustituir valores vigentes por una traducción “más técnica”, “más profesional” o más corta sin respaldo.
4. Las respuestas históricas almacenadas mantienen su interpretación original: no reescribir registros ya emitidos ni documentos históricos.
5. Los permisos se comprueban en servidor; ocultar botones por rol no sustituye la autorización.
6. La demo usa datos sintéticos y una réplica de identidad de solo lectura. No modificar `SIDINACC_LOCAL`, reinicializar bases ni tocar casos reservados.
7. Al trabajar en varios cambios, preferir correcciones pequeñas, pruebas específicas, y compuertas de calidad tras cada bloque.
8. Distinguir **equivalencia funcional** de igualdad píxel por píxel. No copiar nombres de establecimientos, fechas ni cifras sintéticas del prototipo.

---

## 1. Inventario priorizado de vistas y mapa de cobertura

| Prioridad | Vista / flujo | Referencia del prototipo | Lugar de la aplicación actual que debe inspeccionarse | Resultado a comprobar |
|---|---|---|---|---|
| P0 | Nueva referencia | `pages/ReferencesPage.jsx`, `data/catalogs.js`, `components/ReferenceContext.jsx` | `funcionalidades/referencias/FormularioReferencia.jsx`; API de referencias | Cuatro grupos de motivos, opciones completas, especificaciones, pasos, términos y revisión |
| P0 | Sesión + valoración situacional | `pages/SessionsPage.jsx`, `components/ValuationFields.jsx`, `components/FactorCategory.jsx`, `utils/valuation.js` | `funcionalidades/sesiones/SituacionTrabajo.jsx`; API de proceso, instrumento SQL | Nueve categorías, factores íntegros, «Nivel de riesgo/protección», selección y Ninguno |
| P0 | Resolución y abordaje inicial | `pages/SessionsPage.jsx` | `SituacionTrabajo.jsx` + servicios de casos | Decisión humana, prioridad calculada, estructura de plan |
| P1 | Búsqueda contextual | `pages/PeoplePage.jsx`, `components/PersonSearch.jsx` | `funcionalidades/personas/BusquedaContextual.jsx` | Identificación/nombre, datos reutilizados, ámbito y contexto; **sin pantalla general** |
| P1 | Bandeja y detalle de referencias | `pages/ReferencesPage.jsx` | `ListaReferencias.jsx` | Estados, orden, campos de detalle, impresión |
| P1 | Casos y expediente | `pages/CasesPage.jsx`, `components/CaseValuations.jsx` | `CasosPagina.jsx`, `CicloCaso.jsx`, `ExpedienteConsulta.jsx` | Filtros, pestañas, plan, línea de tiempo, controles según rol |
| P1 | Atención individual y grupal | `pages/AttentionsPage.jsx`, `pages/InterventionsPage.jsx` | `AtencionesPagina.jsx` | Campos, participantes, asistencia, fecha efectiva |
| P1 | Programación | `pages/SchedulePage.jsx` | `ProgramacionPagina.jsx` | Estados exactos, motivo para cancelación/reprogramación, vencidas como alerta |
| P1 | Reportería y consolidaciones | `pages/ReportingPage.jsx`, `components/ReportWizard.jsx` | `ReporteriaPagina.jsx`, `GraficosReporteria.jsx`, `AsistenteInforme.jsx` | Doce visualizaciones v0.7, filtros, título, exportaciones y reporte |
| P1 | Inicio por rol | `pages/DashboardPage.jsx` | `InicioOperativo.jsx`, `Aplicacion.jsx` | Indicadores y acciones según ámbito, sin métricas inventadas |
| P2 | Posibles referencias | `pages/PossibleReferencesPage.jsx` | Ubicación real de la vista / rutas | Sección separada, filtros y creación contextual; datos solo de fuente verificable |
| P2 | Coordinación/traslado/cierre/reporte | `pages/CasesPage.jsx`, `components/CaseSpecialPanels.jsx` | `CicloCaso.jsx`, API de ciclo de caso | Traspaso del historial, cierre separado de informe; **sin continuidad automática** |
| Excluido | Control de calidad regional y remisiones | `pages/QualityPage.jsx` | No añadir | **[NO COPIAR]** retirado por v0.7 |
| Excluido | Laboratorio experimental / OCR/offline | `pages/LabPage.jsx` | No añadir | **[NO COPIAR]** no forma parte del producto confirmado |
| Excluido | Chat experimental | `pages/AssistantPage.jsx` | No añadir | **[NO COPIAR]** exploratorio, no confundir con informes HU-050 |

---

## 2. Diseño transversal de las interfaces

### 2.1 Distribución y navegación

**[DISEÑO]** Mantener una barra lateral consistente con nombre del módulo, sección activa y menú contextual al rol; encabezado de pantalla con título inequívoco, breve subtítulo funcional y acción primaria alineada a la derecha. Agrupar elementos por secciones con encabezados legibles y espacio vertical suficiente; en formularios extensos usar pasos o grupos colapsables y dejar visible la acción de regreso. En pantallas anchas utilizar lista/filtros a la izquierda y detalle a la derecha cuando el contenido no requiera dedicación completa; en captura/valoración enfocarse en el formulario sin mostrar paneles que distraigan.

**[OBLIGATORIO]** No revelar controles que el rol no pueda ejecutar. La consulta de Establecimiento es mínima; Oficina Local concentra la operación; Regional y Nacional principalmente listados, expedientes permitidos y analítica. Lo anterior no concede automáticamente funciones adicionales a ningún rol.

### 2.2 Convenciones de texto

**[EXACTO, cuando corresponde]** «Clientes/beneficiarias» en textos de dominio, «Atención Interdisciplinaria» (o «A.I.»), «Oficina Local», «Establecimiento», «Región», «Vía de Atención», «Origen», «Nivel de riesgo», «Nivel de protección», «Factores protectores», «Factores de riesgo», «Signos de alerta», «Hogar-Familiar», «Comunitario», «No requiere A.I.», «Pendiente de revisión», «Reprogramada», «Cancelada», «Traslado». Evitar términos inventados como «Riesgo profesional» o «Protección profesional» para etiquetas de selectores: que la *determinación* sea profesional no cambia el nombre del campo aprobado.

**[COMPROBAR]** Mayúsculas, tildes, singular/plural, presencia de puntos en «A.I.» y nombres de catálogo deben seguir la cadena vigente del instrumento correspondiente. No usar sinónimos libres en campos institucionales.

### 2.3 Formularios y validaciones

- Campo obligatorio: identificación clara y mensaje contextual, no solo fallo de servidor.
- Selección múltiple: casillas separadas; no resolver como `select` de una sola opción.
- «Ninguno» es respuesta explícita revisada; es mutuamente excluyente con factores seleccionados.
- Detalle por factor: asociado al factor concreto, nunca una sola observación global que borre la vinculación.
- Paso de revisión: ver contenido y contexto antes de enviar, con «Atrás» sin pérdida de datos.
- Errores: indicar qué grupo/campo falló; mantener el contenido introducido por el usuario.
- Historial: diferenciar fecha de evento de fecha de digitación, responsable de usuario digitador cuando aplique.
- Datos sin fuente: comunicar «No disponible», no simular confirmación ni inventar cero.

### 2.4 Pautas visuales (sugerencias, no especificación rígida)

- Controles con etiquetas arriba; tarjetas suaves para grupos; títulos y ayudas breves; márgenes suficientes; máximo dos columnas en formularios largos.
- En valoración usar encabezados por ámbito y grupos plegables con resumen de seleccionado/ninguno/pendiente.
- Etiquetas y alertas de estado con color más texto; nunca depender solo del color.
- Listados con búsqueda visible, conteo filtrado versus total, y detalle contextual.
- Reportería con filtros arriba, títulos dinámicos y gráficos legibles.
- En móvil, apilar columnas y evitar recortar selectores, nombres largos y pies de gráfico.

---

## 3. Vista: nueva referencia a Atención Interdisciplinaria — P0

**Correspondencia:** prototipo `pages/ReferencesPage.jsx`; v0.7 HU-013, HU-014, CU-04 y CU-05. **Punto de divergencia real confirmado:** actual `FormularioReferencia.jsx` presenta una lista plana de `catalogos.motives`, mientras el prototipo agrupa motivos en cuatro secciones. La constante `MOTIVE_CATEGORY_BY_CODE` actual solo tipifica un subconjunto de códigos y no incluye explícitamente las tres modalidades de factores de riesgo. No inferir sin consulta SQL cuáles están realmente disponibles.

### 3.1 Encabezado y entrada

- Título recomendado según prototipo: **«Referencias a Atención Interdisciplinaria»** en lista y **«Nueva referencia»** en captura.
- Etiqueta contextual: «Detección y referencia».
- Botón primario: **«Nueva referencia»** para perfiles autorizados.
- **[OBLIGATORIO]** Al comenzar creación, mostrar un flujo enfocado, sin bandeja y detalle abiertos simultáneamente.
- Captura alternativa por plantilla: puede existir «Digitar en el sistema» y «Cargar Excel estandarizado»; toda precarga requiere revisión humana, no envío automático.

### 3.2 Etapas del formulario

El prototipo usa cuatro etapas con estas etiquetas exactas:

1. **Cliente/beneficiaria y trazabilidad**.
2. **Motivo**.
3. **Información complementaria asociada al motivo de referencia**.
4. **Revisar**.

**[OBLIGATORIO]** Conservar navegación atrás/continuar; bloquear avance sin persona válida; revisar antes de «Confirmar y enviar referencia». La selección de persona debe ser búsqueda contextual por identificación o nombre, dentro del ámbito autorizado; no lista masiva. Puede conservarse un campo de consecutivo institucional digitado/validado según v0.7 RF-114; la presentación precisa del campo debe alinearse con la validación vigente (no inventar autonumeración).

### 3.3 Campos de etapa 1

- **Fecha** / «Fecha de la referencia».
- **Vía de Atención**: **Urgencia** y **No inmediata**; no confundir con prioridad Alto/Moderado/Bajo.
- **Origen**: **Vigilancia / tamizaje**, **Observación**, **Información aportada por la familia u otros**, **Referencia externa**.
- **Quién realiza la referencia:** proviene de la sesión; mostrar en modo lectura cuando corresponde, **sin editar manualmente**.
- **Consecutivo institucional:** formato `DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX`, digitación manual completa y validación de unicidad según RF-114; **no** crear serie automática ni contador. El código de establecimiento corresponde a la ubicación de la persona referida, no a la del autor de la referencia.
- Datos de identificación y contexto reutilizados, con dirección territorial **Región → Oficina Local → Establecimiento** y, cuando existan, encargada/o, relación, contacto, dirección, servicios/modalidades, sexo, fecha de nacimiento y edad al corte de la referencia.

### 3.4 Etapa 2 — agrupación y nombres **exactos** de motivos

**[EXACTO]** Cuatro bloques separados, con sus títulos y opciones del catálogo aprobado:

**A. Crecimiento**
- Condición de malnutrición
- Malnutrición con necesidades especiales

**B. Desarrollo**
- EDIN II: riesgo de retraso (rojo)
- EVADE: riesgo de rezago (0,1 sin logro de edad anterior)

**C. Salud**
- Alteración visual
- Alteración auditiva
- Alteración del lenguaje
- Alteración motora
- Alteración de salud oral
- Alergia alimentaria
- Enfermedad crónica
- Lactancia materna / alimentación complementaria
- Trastorno específico del aprendizaje
- Sospecha o diagnóstico de trastorno del neurodesarrollo
- Alteraciones emocionales
- Alteraciones conductuales
- Otra condición de salud

**D. Factores de riesgo**
- Factor de riesgo individual
- Factor de riesgo hogar-familiar
- Factor de riesgo comunitario

**[OBLIGATORIO]** Permitir varias selecciones de diferentes categorías; cada motivo seleccionado presenta un **«Detalle del factor (opcional)»** o especificación asociada al ítem. Al desmarcar un motivo, descartar/inactivar el detalle correspondiente para no guardar contexto huérfano. No agregar «Otro factor de riesgo» genérico: v0.7 exige distinguir los tres ámbitos. No confundir estos *motivos de referencia* con la matriz detallada de *valoración situacional* (sección 5).

**[COMPROBAR]** Comparar cada opción con SQL (`MOTIVO_REFERENCIA`), endpoint `/api/references/catalogs`, semilla/versión, validación y persistencia. No insertar opciones ficticias solo en React. Si hay ausencia real, preparar migración de catálogo versionado, sin ejecutar ni romper referencias históricas.

### 3.5 Etapa 3 — tres narrativas diferenciadas

**[EXACTO]** Mantener tres campos **separados**:

1. **Acciones realizadas previo a la referencia**.
2. **Resultados obtenidos previo a la referencia**.
3. **Información complementaria asociada al motivo de referencia**.

No reemplazarlos por «Acciones previas», «Resultados previos» e «Información complementaria» si la referencia validada pide nombres completos. La versión actual usa esos nombres abreviados: corregir etiquetas visuales conservando el contrato interno si procede.

### 3.6 Etapa 4 — revisión y envío

Mostrar en bloques: consecutivo, contexto de persona, fecha de referencia, responsable, vía y origen, motivos agrupados con sus detalles, acciones/resultados previos e información complementaria. Botones **«Atrás»** y **«Confirmar y enviar referencia»**. Al confirmar, estado **«Pendiente de revisión»** y metadatos de fecha/hora/usuario de envío no editables; no inventar una aceptación manual «Recibida». Bloquear nueva referencia si la persona tiene caso A.I. activo **a nivel nacional**; una referencia pendiente no equivale a caso activo.

### 3.7 Diseño sugerido

Paso 2: tarjetas verticales «Crecimiento», «Desarrollo», «Salud», «Factores de riesgo», cada una con dos columnas de checkboxes en escritorio y una columna en móvil; mostrar texto de especificación justo debajo del factor seleccionado. Paso 4: tarjetas compactas de «Datos de la persona», «Trazabilidad», «Motivos y detalle», «Información complementaria». No mostrar todo en una sola lista sin jerarquía.

### 3.8 Pruebas obligatorias

R-01 cuatro grupos presentes con conteos 2/2/13/3; R-02 etiquetas exactas; R-03 múltiples motivos; R-04 especificación independiente; R-05 deselección elimina detalle; R-06 responsable no editable; R-07 búsqueda y ámbito; R-08 bloqueo global de caso activo; R-09 validación del consecutivo RF-114; R-10 revisión coincide con payload; R-11 plantillas respetan las mismas reglas; R-12 refresco y detalle histórico; R-13 errores de catálogo no producen alternativas inventadas.

---

## 4. Vista: sesiones interdisciplinarias y decisión — P0

**Prototipo:** `pages/SessionsPage.jsx`, `components/ValuationFields.jsx`, `components/FactorCategory.jsx`. **Actual:** `funcionalidades/sesiones/SesionesPagina.jsx` y `SituacionTrabajo.jsx`; API `proceso-interdisciplinario`.

### 4.1 Pantalla de sesiones

- Encabezado **«Sesiones interdisciplinarias»**, contexto **«Equipo Interdisciplinario»**.
- Acción **«Nueva sesión»**. Captura: **Fecha**, **Inicio**, **Fin**, **Lugar**, **Disciplinas participantes**, «Guardar sesión».
- Lista de sesiones separada del panel de análisis. La sesión puede contener varias referencias/situaciones; no duplicar la sesión por persona.
- Búsqueda de referencias por identificación/nombre, selección de una situación y acceso a su valoración.
- Mostrar fecha y ámbito de la sesión; impedir que el rol sin permiso registre o resuelva.

### 4.2 Orden lógico de la valoración

1. Seleccionar referencia/situación válida.
2. Revisar factores protectores/riesgo/alerta por ámbito.
3. Establecer **Nivel de riesgo** y **Nivel de protección** de manera profesional y explícita.
4. Calcular prioridad mediante matriz vigente; **no editar prioridad manualmente**.
5. Registrar y conservar valoración; cada revaloración mantiene historial.
6. Decidir **¿Requiere Atención Interdisciplinaria?** (Sí/No).
7. Si Sí, completar abordaje inicial y abrir caso como operación diferenciada; si No, justificar y registrar sin abrir caso.

**[EXACTO]** Los campos que el prototipo llama **«Nivel de riesgo»** y **«Nivel de protección»** deben mantenerse así. **No** «Riesgo profesional» ni «Protección profesional». La regla de negocio sí dice que el *juicio* es profesional, pero no cambia el rótulo.

### 4.3 Reglas de categorías

- **Tres ámbitos**: Individual, Hogar-Familiar y Comunitario.
- **Tres categorías por ámbito**: Factores protectores, Factores de riesgo, Signos de alerta.
- Total: **nueve categorías** requeridas, sujetas al instrumento/versionamiento vigente.
- **[DISEÑO]** Por cada ámbito usar título de sección; por debajo, acordeones plegables. En resumen del acordeón indicar «Pendiente», «Ninguno» o «N seleccionados».
- Cada categoría contiene casillas independientes y una casilla **«Ninguno»**.
- «Ninguno» significa categoría revisada sin factores; no representa ausencia de información.
- No permitir «Ninguno» junto con un factor; corregir automáticamente o bloquear e indicar qué ocurre.
- Al pasar a otro paso/guardar, informar categorías faltantes, no aprobar automáticamente.
- Permitir **especificación opcional para cualquier factor** y obligatoria en ítems abiertos cuando lo exija el instrumento. No pedir intensidad, frecuencia y persistencia obligatorias.
- No sustituir catálogos por grupos genéricos; conservar nombres de ítems y áreas.

### 4.4 Niveles y cálculo

- **Nivel de riesgo:** Alto, Moderado, Bajo.
- **Nivel de protección:** Alta, Moderada, Baja.
- Prioridad resultante: Alto, Moderado, Bajo de acuerdo con matriz RN-009; no sugerir que el número de checkboxes determina automáticamente el nivel profesional.
- Mostrar prioridad calculada con texto, no solo color. Permitir revisión humana de los factores y conservar ambos niveles por separado.
- La priorización se ejecuta cuando el equipo estableció los niveles; no introducir un selector libre para prioridad.

### 4.5 Decisión, abordaje y revaloración

- Decisión **Sí requiere Atención Interdisciplinaria** / **No requiere Atención Interdisciplinaria**; una decisión negativa obliga justificación y conserva valoración, pero no genera caso.
- Apertura con **Propósitos**, **Estrategias**, **Disciplinas**, **Frecuencia** y confirmación del operador; el flujo de apertura debe referenciar la resolución positiva.
- Caso activo: revaloración desde sesión nueva, sin abrir otro caso; conservar cambios de prioridad y versiones del plan. Nunca sobrescribir valoraciones anteriores.
- Un caso activo por persona a nivel país; verificar al abrir.

### 4.6 Pruebas

S-01 aparecen exactamente tres ámbitos y nueve categorías; S-02 ningún ámbito solo contiene factores individuales; S-03 todas las opciones por grupo cargan desde fuente correcta; S-04 nombres de los dos niveles exactos; S-05 «Ninguno» exclusivo; S-06 factor y especificación; S-07 bloqueo si falta categoría; S-08 cálculo RN-009 (nueve combinaciones); S-09 negativa exige justificación; S-10 positiva permite abordaje; S-11 revaloración histórica; S-12 no hay casos activos duplicados.

---

## 5. Catálogo de referencia del prototipo para la VALORACIÓN situacional

**Procedencia:** transcripción fiel de los textos verificados en `sia-cencinai-demo/src/data/catalogs.js` (`RISK_MATRIX`). **No confundir con `REFERENCE_MOTIVES` de la sección 3.** Este listado funciona como línea base de comparación del prototipo; cuando un instrumento institucional posterior con versión documentada haya sustituido explícitamente un ítem, mantener la versión vigente y registrar la discrepancia como `CAMBIO_APROBADO`.

### 5.1 Ámbito Individual

**Factores protectores (9):**
1. Autoestima positiva y habilidades sociales
2. Buen manejo emocional y autocontrol
3. Vínculos positivos
4. Adecuado estado nutricional
5. Controles de salud al día
6. Logros del desarrollo acordes con su condición
7. Participación en actividades deportivas o culturales
8. Apertura y receptividad para recibir ayuda
9. Otro factor protector

**Factores de riesgo (10):**
1. Baja autoestima
2. Dificultades en el control de impulsos
3. Rezago o riesgo de retraso en el desarrollo
4. Condición de malnutrición
5. Enfermedad crónica
6. Discapacidad sin apoyos suficientes
7. Dificultades de lenguaje
8. Exposición a violencia
9. Alteraciones emocionales o conductuales
10. Otro factor de riesgo

**Signos de alerta (9):**
1. Resultado rojo o amarillo en EDIN II
2. Hallazgo relevante en EVADE
3. Conductas agresivas o regresivas
4. Cambios emocionales importantes
5. Alteración persistente del desarrollo
6. Dificultades de comunicación o interacción
7. Cambios importantes de apetito o peso
8. Enfermedades recurrentes
9. Otro signo de alerta

### 5.2 Ámbito Hogar-Familiar

**Factores protectores (8):**
1. Figuras cuidadoras positivas
2. Crianza respetuosa
3. Vínculos afectivos seguros
4. Redes de apoyo familiares
5. Participación activa en el proceso de atención
6. Seguridad económica básica y empleo
7. Acceso a vivienda y servicios básicos
8. Otro factor protector

**Factores de riesgo (10):**
1. Sobrecarga de la persona cuidadora
2. Crianza rígida o excesivamente permisiva
3. Ausencia de vínculos afectivos seguros
4. Antecedentes o presencia de maltrato, negligencia o abandono
5. Conflictos familiares
6. Ausencia de redes de apoyo
7. Violencia intrafamiliar
8. Pobreza o inestabilidad económica
9. Hacinamiento
10. Otro factor de riesgo

**Signos de alerta (7):**
1. Necesidades básicas insatisfechas
2. Ausencias reiteradas a salud o educación
3. Ambiente familiar tenso
4. Gritos, golpes u otras manifestaciones de violencia
5. Consumo problemático de sustancias
6. Vivienda en malas condiciones
7. Otro signo de alerta

### 5.3 Ámbito Comunitario

**Factores protectores (7):**
1. Entorno comunitario seguro e inclusivo
2. Disponibilidad de transporte público
3. Acceso a servicios de educación, salud y cuidado
4. Centros recreativos
5. Presencia de instituciones sociales y de seguridad
6. Redes de apoyo comunal
7. Otro factor protector

**Factores de riesgo (8):**
1. Alta inseguridad ciudadana
2. Dificultad de acceso a transporte público
3. Pocos o nulos servicios de educación, salud y cuidado
4. Acceso limitado a agua potable, electricidad o saneamiento
5. Pocos o nulos centros recreativos
6. Presencia de riesgos sociales
7. Riesgo por fenómenos naturales
8. Otro factor de riesgo

**Signos de alerta (6):**
1. Limitación para movilizarse de manera segura
2. Poca o nula presencia de servicios esenciales
3. Problemas graves de higiene o habitabilidad
4. Exposición recurrente a violencia comunitaria
5. Interrupción de servicios por fenómenos naturales
6. Otro signo de alerta

**Nota de control editorial:** los conteos se han ajustado a los ítems transcritos: Hogar-Familiar / riesgo **10** y Comunitario / protectores **7**. **El conteo verdadero es el de las líneas literales enumeradas.** Cursor debe contar los ítems reales, no confiar en números auxiliares. Las opciones «Otro factor ...» son ítems válidos del instrumento de **valoración**; la prohibición de `Otro factor de riesgo` genérico indicada para motivos de **referencia** es distinta y no debe aplicarse erróneamente aquí.

### 5.4 Diseño de comparación de los catálogos

Comparar por tupla `(versión, ámbito, categoría, código, etiqueta, orden, requerido, abierto)`. Reportar explícitamente faltantes, adicionales, renombrados y reordenados. No forzar un ajuste destructivo de IDs: usar nuevas versiones o scripts idempotentes sujetos a autorización. Confirmar que respuestas antiguas sigan consultables después de cualquier ampliación.

---

## 6. Vistas de personas y búsqueda contextual

**Prototipo:** `PeoplePage.jsx`, `PersonSearch.jsx`. **v0.7:** HU-005 a HU-012 y simplificación §2.1.

- **[NO COPIAR]** No reintroducir la antigua pantalla principal «Clientes/beneficiarias» como catálogo general ni exportación masiva de la réplica. La versión 0.7 la retiró expresamente.
- **[OBLIGATORIO]** Usar buscador contextual en formularios: identificación primero, nombre como alternativa; resultados limitados al ámbito. Seleccionar una persona abre resumen de identidad y contexto sin redigitación.
- **[DISEÑO]** Campo «Buscar por identificación o nombre» con panel de resultados, cada resultado con nombre + identificación + establecimiento cuando exista; aviso de cero resultados, carga y selección. En referencia, el resumen de persona debe ser visible antes de confirmar.
- **[OBLIGATORIO]** No exponer listados masivos nacionales por defecto; no confundir persona con referencia o caso. Un mismo niño puede tener varios casos históricos pero uno solo activo a la vez.
- **[OBLIGATORIO]** Establecimiento recibe datos básicos y señal mínima del estado de A.I. según permisos; no prioridad ni expediente clínico interno.
- **[COMPROBAR]** En cada módulo (referencias, atenciones, casos), que el buscador reutilice el contexto sin permitir seleccionar personas ajenas.

---

## 7. Bandejas y detalles de referencias

- Título prototipo: **«Referencias a Atención Interdisciplinaria»**; bloque **«Bandeja de referencias»** y **«Detalle de referencia»**.
- **[DISEÑO]** Lista y detalle lado a lado cuando no se está creando; en móvil, navegar entre ambos. Búsqueda por nombre, identificación o consecutivo; filtros por **Estado**, **Vía de Atención**, **Origen**, **Categoría**.
- En lista: consecutivo, persona, identificación, establecimiento, autor/responsable, vía, estado y fecha.
- En detalle: fecha de referencia, fecha/hora de envío, estado, origen, vía, datos reutilizados al registrar, motivos con detalles, acciones/resultados previos e información complementaria.
- Acción autorizada de **«Imprimir referencia»**, cuando exista el documento vigente; no confundir generación/impresión con reenvío ni cambiar el estado.
- Estados: «Pendiente de revisión», «Admitida a A.I.» y «No requiere A.I.» según transición aplicable. No crear «Recibida» como acción manual.
- **[OBLIGATORIO]** Bandeja de Oficina Local muestra referencias pendientes conforme al ámbito; la de Establecimiento no permite valorar ni admitir casos. Una referencia puede tener varios motivos no excluyentes.
- **[COMPROBAR]** Que el API de lista y detalle presente las etiquetas correctas y no desplace códigos técnicos crudos a la interfaz.

---

## 8. Casos de Atención Interdisciplinaria y expediente

**Prototipo:** `CasesPage.jsx` y `CaseValuations.jsx`. **Vigente:** HU-023 a HU-035, HU-048, CU-11 a CU-23, CU-36.

### 8.1 Lista, búsqueda y filtros

- Título **«Casos de Atención Interdisciplinaria»**; contexto **«Gestión del caso»**.
- Buscador **«Identificación o nombre»**; filtros **«Estado del caso»**, **«Prioridad del caso»**, filtros territoriales pertinentes y consulta de casos sin atención en período.
- Mostrar nombre/identificación, establecimiento, estado, prioridad (solo roles permitidos), fecha o referencia de apertura, y acceso «Ver expediente».
- Diferenciar total del ámbito de total filtrado. Exportación a Excel incluye el corte completo autorizado o rechaza expresamente cuando supera el límite; no exportar silenciosamente una sola página.
- **[EXACTO]** Prioridad A.I.: **Alto**, **Moderado**, **Bajo**; estado: **Activo** y **Cerrado** donde aplique.

### 8.2 Expediente de Oficina Local

El prototipo muestra información distribuida entre «Resumen», «Línea de tiempo», «Plan de atención», «Documentos», «Coordinaciones», «Traslado», «Reportes» y «Cierre». No es necesario copiar la estructura exacta de pestañas, pero **sí la separación funcional**:

- **Resumen:** contexto de ingreso, estado, prioridad vigente, próxima acción y fechas.
- **Línea de tiempo:** admisión/apertura, atenciones individuales y grupales efectivas, documentos, coordinaciones, reportes y cierre/traslado; orden cronológico claro.
- **Plan de atención:** propósitos, estrategias, disciplinas, frecuencia y, si corresponde, historial/versiones de plan.
- **Documentos:** lista de archivos asociados, metadatos y capacidad de consulta permitida; no confundir con reportes de cierre.
- **Coordinaciones:** institución, responsable, motivo, fecha, estado y observaciones.
- **Reportes:** generación independiente del cierre; no cerrar un caso al descargar un reporte.
- **Cierre:** motivo estructurado, explicación cuando aplique y confirmación, preservando historial.
- **Traslado:** destino/fecha/motivo y cierre por traslado del caso origen.

### 8.3 Restricciones importantes

- No duplicar caso activo nacional de una persona.
- No permitir atenciones sobre caso cerrado como si estuviera activo.
- No crear automáticamente nuevo caso o referencia de destino al trasladar; el caso origen se **cierra por Traslado**. **[NO COPIAR]** el panel antiguo del prototipo que proponía «Confirmar recepción» y continuidad automática.
- No equiparar «Reporte» a «Cierre»; impresión/descarga de reporte no cambia estado.
- No eliminar eventos antiguos ni sobrescribir valoraciones pasadas.
- El expediente visible para **Regional/Nacional** debe ser una proyección autorizada de **solo lectura**, no el payload íntegro de Oficina Local; textos clínicos sensibles requieren autorización explícita.
- Establecimiento solo ve señal mínima de existencia/estado general; no prioridad, planes, valoración ni atenciones internas.
- No confundir «Cierre de A.I.» con egreso de CEN-CINAI u otros servicios.

### 8.4 Diseño y aceptación

**[DISEÑO]** Columna izquierda: lista/búsqueda. Principal: encabezado con caso, estado, prioridad y pestañas/secciones. Agrupar acciones de alto impacto (Traslado/Cierre) separadas de consulta. Confirmación antes de operación irreversible. En modo Regional/Nacional, etiqueta «Solo consulta» y ninguna acción de escritura.

**Pruebas:** expediente desde lista, estados/roles, evento al registrar atención, cierre sin borrar historial, reporte independiente, consulta Regional limitada por región, consulta Nacional no editable, intento directo API de escritura 403.

---

## 9. Atenciones individuales, grupales y seguimiento

**Prototipo:** `AttentionsPage.jsx` y `InterventionsPage.jsx`. **Vigente:** HU-036/HU-037, CU-24/CU-25.

### 9.1 Atención individual

- Contexto **«Atención y seguimiento»**, título **«Atenciones»**.
- Buscar **caso activo** por identificación o nombre; mostrar **«Caso seleccionado»**.
- Campos prototipo: **Fecha**, **Disciplina**, **Tipo / estrategia**, **Próxima acción**, **Acciones realizadas**, **Recomendaciones**. Preservar fecha *real* de la atención separada de fecha de digitación.
- Botón **«Registrar atención»**, con validaciones y resultado persistido. No permitir registrar una atención sobre un caso ajeno o cerrado.
- Mostrar recientes y permitir ver que una misma persona tiene múltiples atenciones sin generar casos duplicados.

### 9.2 Atención grupal

- Una sola actividad base por sesión/actividad, con **Fecha**, **Tipo**, **Tema / objetivo**, **Lugar**, **Disciplinas**, **Participantes**, **Acciones / contenidos**, **Recomendaciones generales**.
- Participantes se agregan por **identificación o nombre**, en lista clara. Cada participante tiene control de **Presente** / **Ausente**, sin convertir asistencia ausente en atención efectiva.
- Permitir retirar participante antes de confirmar; no registrar múltiples actividades base por participante. Asociar al caso activo cuando existe, sin inventar un caso para quien no lo tiene.
- Evitar mezclar categorías de intervención grupal con atención individual. Los tipos de atención deben provenir de catálogo vigente; no inventar equivalencias.

### 9.3 Seguimiento

- Mostrar próxima acción, fecha prevista y estado de la planificación como conceptos distintos.
- Una próxima acción anotada dentro de una atención no equivale automáticamente a una actividad programada formal.
- Casos activos sin atención efectiva en el período: indicador separado de actividades programadas/vencidas.

### 9.4 Diseño y pruebas

**[DISEÑO]** Pestañas o selector «Individual»/«Grupal», mostrar campos pertinentes a cada modalidad; asistentes de selección con búsqueda y resumen de caso/persona. Tabla de participantes accesible, con asistencia visible.

**Pruebas:** individual persiste fecha/responsable; grupal única con múltiples asistentes; ausente no cuenta para cobertura; participantes no duplicados; permisos por Oficina Local; reporte cuenta eventos vs personas correctamente.

---

## 10. Programación operativa

**Prototipo:** `SchedulePage.jsx`. **Vigente:** HU-044/045/046, CU-26/27/28.

### 10.1 Lista y filtros

- Encabezado **«Programación»**, contexto **«Planificación operativa»**.
- Acceso Oficina Local a **«Programar actividad»** y **«Nueva actividad programada»**.
- Campos: **Fecha**, **Tipo**, **Título / propósito**, **Establecimiento** cuando corresponda, **Observaciones**. Vincular caso/personas si aplica y está autorizado.
- Panel **«Filtros»** y **«Listado cronológico»**, con Fecha, Actividad, Ámbito, Estado y Acción.
- Estados: **Programada**, **Realizada**, **Reprogramada**, **Cancelada**.
- **«Vencida»** es alerta derivada de la fecha y estado: **NO** estado persistido adicional.

### 10.2 Transiciones

- Reprogramar: nueva fecha vigente + motivo; conservar fecha originalmente prevista y auditoría.
- Cancelar: motivo obligatorio, sin borrar actividad.
- Realizada: dejar constancia del cambio, sin alterar retrospectivamente fecha originalmente prevista.
- No inventar transición de Reprogramada a Programada ni de Reprogramada a Realizada sin validación del contrato vigente.
- Rechazar resoluciones inválidas repetidas sin doble modificación histórica.
- Oficina Local escribe; Regional y Nacional consultan únicamente cuando HU-045/046 estén realmente implementadas/autorizadas.

### 10.3 Diseño y pruebas

**[DISEÑO]** Tabla con señal visual de «⚠ Vencida», panel lateral o modal «Actualizar» con Nuevo estado, Nueva fecha y Motivo condicional; contexto territorial visible. Recuento «filtradas de total».

**Pruebas:** alta, realizada, reprogramada, cancelada, historial, idempotencia, filtros y seis vencidas de semilla intactas; no usar casos reservados.

---

## 11. Inicio operativo diferenciado por rol

**Prototipo:** `DashboardPage.jsx`; **v0.7** HU-001 a HU-004, §5.

### 11.1 Establecimiento

El prototipo utiliza métricas como **«Referencias generadas»**, **«Referencias pendientes de revisión»** y entradas a nuevas referencias. Mostrar solamente resumen autorizado del establecimiento, sin detalles de valoración/expediente. Si «Posibles referencias» carece de fuente de datos, no mostrar un número inventado.

### 11.2 Oficina Local

El prototipo contiene «Referencias pendientes», «Casos activos», «Próximas sesiones», «Actividades vencidas» y acciones rápidas. Los acuerdos v0.7 añaden indicadores personales posibles referencias/nuevas/casos/sesiones/programación según el origen de datos disponible. El panel debe abrir los módulos filtrados coherentemente: un clic en vencidas lleva a Programación y no cambia el estado del registro.

### 11.3 Regional

Resumen de su región, casos activos, atenciones del período, casos por Oficina Local, cobertura por Oficina Local y enlace a Reportería. **No** acciones operativas de Oficina Local.

### 11.4 Nacional

Resumen nacional, casos activos, referencias, atenciones, distribuciones por Región y cobertura. Filtros jerárquicos cuando corresponda; no agregar herramientas de escritura.

### 11.5 Pruebas

Contadores consistentes con consultas API de rol; enlaces correctos; datos no disponibles mostrados explícitamente; cero fugas territoriales; el cambio de ámbito no conserva filtros inválidos.

---

## 12. Posibles referencias (sección independiente)

**Prototipo:** `PossibleReferencesPage.jsx`; **v0.7:** HU-049 / CU-37.

- Ubicación como opción independiente «Posibles referencias», no mezclar con la bandeja de referencias ya enviadas.
- Elementos: búsqueda **«Nombre o identificación»**, **«Fecha de detección»**, paginación y acción **«Crear referencia»** contextual para perfiles autorizados.
- Diferenciar candidato a referencia de referencia enviada/analizada y caso abierto.
- No crear automáticamente una referencia a partir de un indicador de vigilancia ni suponer que los datos de SIDINACC existen si no se leen de fuente autorizada.
- Si no hay fuente, estado vacío informativo, no un conteo falso. No declarar la detección automatizada como implementada solo porque la pantalla existe.

---

## 13. Coordinaciones, reportes, cierre y traslado

**Prototipo:** `CasesPage.jsx`, `CaseSpecialPanels.jsx`; **decisiones vigentes** HU-027/028/030/031 y v0.7 §2.

### 13.1 Coordinación interinstitucional

Campos de referencia: **Tipo**, **Institución**, **Profesional responsable**, **Motivo**, **Estado** y fecha según instrumento vigente. El catálogo de instituciones del prototipo incluye `CCSS`, `MEP`, `PANI`, `INAMU`, `INA`, `IAFA`, `IMAS`, `MTSS`, `OAPVD`, `Otra`, **solo como referencia de comparación**. Validar con catálogo institucional actual antes de ajustar.

### 13.2 Reporte individual

Acción **«Generar reporte»** desde caso, independiente del cierre; documento emitido/registrado sin modificar estado de caso. No confundir con informe analítico HU-050 ni consolidación Excel HU-039.

### 13.3 Cierre

Motivos vigentes **satisfactorio / traslado / otro con explicación** de acuerdo con v0.7, con confirmación, fecha y auditoría. En cierre «Otro», explicación requerida. No reducir los motivos a una observación libre sin clasificación.

### 13.4 Traslado

Origen cierra caso actual con motivo Traslado; conserva su historia. No activar «Confirmar recepción», «Pendiente de continuidad», ni alta automática en destino. La atención posterior, si corresponde, entra por el procedimiento normal con nueva referencia y nuevo consecutivo.

---

## 14. Reportería, doce visualizaciones, consolidaciones e informe analítico

**Prototipo:** `ReportingPage.jsx`, `ReportWizard.jsx`; **versión vinculante:** §15 y HU-038 a HU-043 + HU-050.

### 14.1 Cabecera y filtros

Título **«Reportería»**, contexto **«Analítica operativa»**. Filtros visibles: año/período, ámbito territorial, estado, prioridad, disciplina, profesional, sexo, edad y tipo de atención cuando sean pertinentes al indicador. Filtros territoriales jerárquicos; Estado y prioridad de caso no equivalen a tipo de atención. Botones «Limpiar filtros», «Descargar consolidado» / Excel y «Generar reporte» únicamente en ámbito autorizado y donde el flujo esté implementado. Mostrar chips/lista de filtros efectivos; indicar filtros no aplicables a un KPI.

### 14.2 Doce visualizaciones *exactas* de v0.7

1. **Casos por establecimiento** — gráfico de barras.
2. **Casos por sexo** — distribución.
3. **Casos por edad actual** — distribución por edad, sin inventar grupos etarios institucionales.
4. **Casos por prioridad** — Alto / Moderado / Bajo.
5. **Casos por estado** — Activo / Cerrado.
6. **Principales motivos de cancelación de actividades programadas** — tabla Top-N.
7. **Principales motivos de referencia a A.I.** — nube de palabras por frecuencia, motivos no excluyentes.
8. **Atenciones REALIZADAS por tipo** — distribución de tipos institucionales vigentes.
9. **Motivos de cierre de casos A.I.** — circular: Cierre satisfactorio / Traslado / Otro.
10. **Palabras más frecuentes en cierres con motivo Otro** — nube de palabras.
11. **Porcentaje de niños atendidos en el año seleccionado** — KPI porcentaje N/D, escala rojo–verde progresiva sin umbral de cumplimiento inventado.
12. **Cantidad de niños atendidos en el año seleccionado** — N personas únicas, no total de atenciones.

No agregar opciones 13–14 al catálogo principal del asistente aunque existan otros KPI complementarios.

### 14.3 Cobertura y contadores

Denominador **D**: personas únicas con **caso A.I. activo actualmente** dentro del ámbito. Numerador **N**: personas de D con atención efectiva durante el año seleccionado **ligada a su caso activo actual**. La atención grupal requiere asistencia efectiva. N/D × 100, con D=0 mostrar «Sin casos activos» / «No aplica»; no inventar 0 %. El filtro general de estado no altera D; personas únicas ≠ eventos de atención. RN-040 es una **definición operativa provisional**, indicarlo sin inventar aprobación definitiva.

### 14.4 Corte y temporalidad

- Motivos de cancelación: fecha de cancelación.
- Motivos de referencia: fecha de referencia.
- Atención: fecha real de atención.
- Cierre: fecha de cierre.
- Cobertura: estado activo **actual** + atención del año.
- Las cifras de Oficina Local filtrada desde Regional/Nacional deben coincidir con la ruta de Oficina Local, manteniendo el mismo ámbito.
- No sumar porcentajes para obtener una cobertura regional/nacional.

### 14.5 Consolidaciones

Oficina Local: su ámbito o establecimiento. Regional: su región/oficina/establecimiento. Nacional: país/región/oficina/establecimiento. Exportaciones aplican mismos filtros de la pantalla; si superan límite técnico, rechazar completo con explicación (no exportar datos truncados como completos). Las salidas de Excel no deben exponer datos personales no autorizados ni fórmulas inyectadas.

### 14.6 HU-050 — informe analítico guiado

El prototipo incluye botón «Generar reporte» y asistente con título obligatorio, selección de al menos **cinco** visualizaciones, análisis escrito por cada una y navegación «Anterior»/«Siguiente». La versión v0.7 confirma elegir de **5 a 12**, análisis humano obligatorio, revisión, responsable/ámbito/corte y descarga/registro histórico donde esté implementado. No generar análisis por IA ni cambiarlo por consolidación Excel o reporte de un caso. **[COMPROBAR]** Actualmente en Oficina Local existe historial SQL; Regional/Nacional no se deben anunciar con HU-050 habilitada si no lo están.

---

## 15. Filtros y vistas de consulta Regional/Nacional

- Regional consulta únicamente su Región autorizada; filtros por Oficina Local, establecimiento, año/estado/prioridad y dimensiones analíticas pertinentes. No selector libre de otra Región.
- Nacional puede seleccionar Región → Oficina Local → establecimiento; cambiar Región limpia Oficina y establecimiento incompatibles.
- Expediente de consulta Regional/Nacional: metadatos básicos de caso, fecha, estado, prioridad y planes/estrategias de catálogo permitidos; no exponer automáticamente textos clínicos, factores o contactos sensibles.
- Sin operaciones de apertura, atención, cambio de plan, cierre o traslado; API rechaza escrituras aun si se manipulan solicitudes.
- Listas/Excel deben respetar ámbito y filtros; evitar duplicación de personas a escala regional/nacional.
- **[DISEÑO]** Mostrar «Solo consulta» en expediente superior y no dibujar botones deshabilitados que sugieran permiso de edición.

---

## 16. Matriz inicial de divergencias y su tratamiento

| ID | Pantalla/elemento | Prototipo o especificación vigente | Aplicación actual observada en código | Estado | Acción segura |
|---|---|---|---|---|---|
| D-001 | Valoración: riesgo | «Nivel de riesgo» (`ValuationFields.jsx`) | «Riesgo profesional» (`SituacionTrabajo.jsx`) | **ERROR_CONFIRMADO** | Cambiar la **etiqueta visible**, sin alterar códigos internos ni matriz |
| D-002 | Valoración: protección | «Nivel de protección» | «Protección profesional» | **ERROR_CONFIRMADO** | Cambiar la **etiqueta visible** |
| D-003 | Referencia: agrupación de motivos | Crecimiento/Desarrollo/Salud/Factores de riesgo | `FormularioReferencia.jsx` usa lista plana | **ERROR_CONFIRMADO visual** | Agrupar por categoría en API/UI sin alterar IDs ni historial |
| D-004 | Referencia: motivos riesgo por ámbito | Individual/Hogar-Familiar/Comunitario | Mapa `MOTIVE_CATEGORY_BY_CODE` no incluye explícitamente estos códigos | **COMPROBAR SQL y API** | Auditar valores reales; preparar migración de catálogo si faltan |
| D-005 | Referencia: textos de tres narrativas | Textos completos, incluido «...previo a la referencia» | Campos abreviados «Acciones previas», «Resultados previos», «Información complementaria» | **ERROR_CONFIRMADO de etiqueta** | Recuperar etiquetas completas sin cambiar contrato |
| D-006 | Valoración: matriz de nueve categorías | 3 ámbitos × 3 grupos | UI recorre categorías recibidas desde SQL | **COMPROBAR** | Comparar instrumento SQL vigente con 9 grupos y sus listas completas |
| D-007 | Pantalla Personas/Clientes | Aparece en prototipo | v0.7 la retira del menú principal | **CAMBIO_APROBADO** | **No** reintroducir pantalla masiva |
| D-008 | Continuidad por traslado | Prototipo contiene «Confirmar recepción» | v0.7 elimina continuidad automática | **CAMBIO_APROBADO** | Mantener cierre en origen y nueva referencia regular en destino |
| D-009 | Control de Calidad regional | Existe en prototipo | v0.7 elimina módulo independiente | **CAMBIO_APROBADO** | No implementarlo |
| D-010 | UI de captura de referencia | Prototipo en cuatro pasos y revisión | Formulario actual presenta campos en un mismo `<form>` y revisión al final | **OMISIÓN/UX A REVISAR** | Aplicar flujo guiado compatible sin romper validaciones ni borradores |
| D-011 | Reportería HU-050 | Guía en prototipo; v0.7 actualiza 5–12, historial | Oficina Local implementado; superior no | **ALCANCE DIFERENCIADO** | No habilitar opciones inexistentes |

**Nota:** La tabla distingue hechos directamente observados de hipótesis sobre filas SQL. La auditoría debe extenderla con evidencia por archivo, pantalla, consulta y captura.

---

## 17. Procedimiento que debe ejecutar Cursor en `Modulo_SIA`

### Etapa A — línea base no destructiva

1. Leer `AGENTS.md`, `.cursor/rules/`, `FUNCTIONAL_SPEC_v0.7.md`, `USE_CASES_v0.7.md`, `docs/architecture/ENTREGA_PRACTICA_ESTADO.md` y **este documento**.
2. Registrar rama/commit y estado; realizar referencia recuperable sin sobrescribir cambios.
3. Mapear rutas de React, componentes, APIs, catálogos y tablas que nutren cada vista. Si un componente de prototipo no existe aquí, usar sus instrucciones contenidas en esta guía, no pedir acceso externo.
4. Tomar muestras de API/SQL solo lectura de catálogos de referencia e instrumento de valoración. Registrar versiones e ítems; no alterar BD.

### Etapa B — comparación sistemática

Por cada vista del inventario, completar:

| Campo | Contenido obligatorio |
|---|---|
| ID y vista | Pantalla/flujo identificable |
| Fuente | Sección exacta de esta guía + HU/CA/RF/CU vigente |
| Diferencia | Texto/ítem/control/validación/orden/restricción/etc. |
| Evidencia actual | Archivo:línea, API y/o captura, SQL cuando aplique |
| Clasificación | ERROR_CONFIRMADO / OMISION_FUNCIONAL / CAMBIO_APROBADO / MEJORA_COMPATIBLE / NEEDS_VALIDATION |
| Prioridad | P0 / P1 / P2 |
| Impacto | Solo etiqueta, UI + API, catálogo SQL, historial o autorización |
| Corrección | Cambio mínimo propuesto/realizado; prueba asociada |

Crear `docs/quality/AUDITORIA_FIDELIDAD_VISTAS.md` con una fila por diferencia, no una fila genérica por módulo.

### Etapa C — corrección por riesgo

- **P0 inmediato** si es inequívoco y no requiere datos/migración: etiquetas D-001/D-002, textos D-005, organización visual D-003 respetando respuesta API.
- **P0 condicionado a datos**: motivos faltantes e instrumento (D-004/D-006). Preparar migración/versionado, justificar y pedir ejecución manual; no declarar corregido hasta verificar SQL/API/UI.
- **P1**: pasos de referencia, revisión, orden de controles, mensajes y coherencia visual.
- **P2**: espaciados, pequeños detalles de jerarquía y refinamiento cosmético.
- Evitar cambios masivos de estilos mientras existan etiquetas/catálogos incompletos.

### Etapa D — pruebas funcionales y visuales

1. Tests específicos de nombres exactos y jerarquía de grupos.
2. Tests de API que verifican catálogos por versiones y rechazo de datos inválidos.
3. Pruebas reales de selección múltiple/Ninguno/especificación y serialización.
4. Pruebas de permisos por rol y ámbito.
5. Screenshots en navegador de formularios con grupos expandidos, estados validados, revisión y listados.
6. Compuertas `npm run verify:config`, `npm run lint`, `npm test`, `npm run build`, `npm run health`.
7. Revisión visual final de las capturas. No marcar PASS por verificación superficial.

### Etapa E — resultado y control de regresión

Entregar matriz completa, cambios por archivo, catálogos comparados, scripts pendientes, pruebas ejecutadas/omitidas, screenshots, y una tabla de **conformidad por vista**: conforme / ajustada / pendiente con detalle. Asegurar que el código original sigue arrancando y los informes históricos, la programación, los cuatro roles y los datos de demostración permanecen intactos.

---

## 18. Condiciones de NO realización

**No** solicitar a Cursor clonar `Prototipo` ni convertirlo en dependencia de ejecución. **No** reinsertar pantallas retiradas. **No** añadir OCR/offline/chat/calidad regional. **No** hacer aprobación institucional ficticia. **No** usar información real de menores para capturas. **No** simular tener datos de catálogos que el SQL no contiene. **No** cambiar versiones de instrumento histórico ni recalcular documentos emitidos. **No** activar escritura para Regional/Nacional. **No** tocar casos reservados de la demo. **No** ejecutar `migrations` ni `security` sin autorización manual.

---

## 19. Criterios de aceptación global de la auditoría

Se considerará verificada la fidelidad cuando:

- Los **cuatro grupos de motivos** y sus ítems aprobados estén representados correctamente en las referencias, o su ausencia esté diagnosticada con evidencia y un script de ajuste pendiente.
- Las **nueve categorías de valoración**, la lista de sus ítems, «Ninguno», sus detalles y las dos etiquetas globales estén conformes o justificadas por instrumento posterior.
- Todas las vistas principales tengan registro de revisión y diferencias clasificadas, no solo las dos detectadas inicialmente.
- El cambio visual no haya debilitado control de rol/ámbito ni borrado contexto histórico.
- El frontend y la API sean coherentes sobre campos obligatorios, enumeraciones y errores.
- Los módulos descartados en v0.7 permanezcan fuera del alcance.
- Los tests automatizados y pruebas reales de navegador sigan funcionando.

---

## 20. Anexo: índice de fuentes locales a contrastar en Cursor

| Fuente | Qué verificar |
|---|---|
| `apps/web/src/funcionalidades/referencias/FormularioReferencia.jsx` | Flujo, grupos, nombres, detalle por factor, revisión y plantilla |
| `apps/web/src/funcionalidades/referencias/ListaReferencias.jsx` | Bandeja, filtros, etiquetas, detalle e impresión |
| `apps/api/src/modules/references/reference-constants.js` | Categorías y códigos de motivos reconocidos |
| `apps/api/src/modules/references/reference-service.js` | Catálogo efectivo, persistencia y validación de motivos |
| `apps/web/src/funcionalidades/sesiones/SituacionTrabajo.jsx` | 9 grupos, etiquetas de riesgo/protección, Ninguno, prioridad y abordaje |
| `apps/api/src/modules/proceso-interdisciplinario/servicio-proceso.js` | Instrumento/versión, agrupaciones, validación de factores, RN-009 |
| `apps/web/src/funcionalidades/casos/CasosPagina.jsx` | Listado, filtros, expediente y exportación |
| `apps/web/src/funcionalidades/casos/CicloCaso.jsx` | Cierre, traslado, coordinaciones, reporte, trazabilidad |
| `apps/web/src/funcionalidades/atenciones/AtencionesPagina.jsx` | Atención individual/grupal, participantes y asistencia |
| `apps/web/src/funcionalidades/programacion/ProgramacionPagina.jsx` | Estados, vencidas, resolución e historial |
| `apps/web/src/funcionalidades/reporteria/ReporteriaPagina.jsx` | Filtros, doce visualizaciones, ámbitos |
| `apps/web/src/funcionalidades/reporteria/AsistenteInforme.jsx` | Informe de 5–12, revisión, análisis y descarga |
| `apps/web/src/funcionalidades/inicio/InicioOperativo.jsx` | Tarjetas, enlaces, contadores y permisos |
| `apps/web/src/aplicacion/Aplicacion.jsx` | Menú y rutas por rol, retiro de pantallas obsoletas |
| `apps/api/src/infrastructure/auth/authorization-policy.js` | Autorización real, no solo ocultación de botones |
| `database/sia-cencinai/` | Catálogos, instrumento de valoración, semilla, versiones y migraciones existentes |

**Fin de la parte interpretativa y normativa. El siguiente anexo reproduce, de forma agrupada, criterios de aceptación textuales de la especificación v0.7 para que Cursor no dependa de un enlace ni de la memoria del asistente.**

---

# ANEXO A — Extractos abreviados y trazables de criterios de aceptación de `FUNCTIONAL_SPEC_v0.7.md`

La siguiente sección se construye a partir del documento funcional vigente aportado al proyecto: se preservan identificadores, encabezados y el sentido de los criterios, pero algunas descripciones se **abrevian** para facilitar la consulta. No sustituyen el texto completo de cada CA. Se incluye para que la revisión sea **autocontenida y trazable**. Los elementos que exigen fuentes externas o validación no se convierten por ello en permiso de implementación. En caso de contradicción prevalece el propio documento v0.7 actualizado que Cursor encuentre en su repositorio.

### HU-001 — Consultar resumen operativo del establecimiento

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir el resumen al establecimiento**: Dado que el usuario posee acceso a uno o más establecimientos autorizados, cuando ingresa a la página de inicio, entonces el sistema debe mostrar únicamente información correspondiente a ese ámbito.
- **CA-02 — Mostrar referencias**: Dado que existen referencias asociadas al ámbito autorizado, cuando el usuario consulta Inicio, entonces debe visualizar la cantidad de referencias correspondientes.
- **CA-03 — Mostrar clientes/beneficiarias asociados a A.I.**: Dado que existen clientes/beneficiarias del ámbito con casos de A.I., cuando el usuario consulta Inicio, entonces debe visualizar un contador correspondiente.
- **CA-04 — Acceso rápido a referencia**: Dado que el usuario se encuentra en Inicio y posee permiso para crear referencias, cuando selecciona la acción de nueva referencia, entonces el sistema debe llevarlo al flujo correspondiente.
- **CA-05 — Acceso rápido a lista de A.I.**: Dado que el usuario consulta Inicio, cuando selecciona la Lista de A.I., entonces debe acceder a la vista simplificada correspondiente a su ámbito.
- **CA-06 — Consultar estado y prioridad autorizados**: Dado que el usuario es profesional, ASC2 o ASC3 autorizado, cuando accede desde el resumen a la Lista de A.I., entonces debe poder consultar estado y prioridad A.I. y filtrar por prioridad sin acceder al detalle interno.

### HU-002 — Consultar el resumen operativo de la Oficina Local

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir información al ámbito**: Dado que el usuario pertenece a una Oficina Local, cuando ingresa al sistema, entonces el resumen debe mostrar únicamente información correspondiente a esa Oficina Local y sus establecimientos.
- **CA-02 — Mostrar referencias pendientes**: Dado que existen referencias pendientes de gestión, cuando el usuario consulta Inicio, entonces debe visualizar su cantidad y poder acceder a ellas.
- **CA-03 — Mostrar casos activos**: Dado que existen casos activos, cuando se muestra el resumen, entonces debe visualizarse su cantidad y permitir navegar al listado correspondiente.
- **CA-04 — Mostrar sesiones próximas**: Dado que existen sesiones interdisciplinarias programadas, cuando el usuario consulta el resumen, entonces debe visualizar las próximas sesiones y poder acceder a su gestión.
- **CA-05 — Mostrar posibles referencias pendientes**: Dado que la detección de posibles referencias está disponible, cuando se consulta Inicio de Oficina Local, entonces se prioriza su cantidad pendiente y el acceso a la sección independiente, sin indicadores de traslados pendientes de continuidad.
- **CA-06 — Mostrar actividades programadas vencidas**: Dado que una actividad permanece Programada después de su fecha prevista, cuando se consulta Inicio, entonces debe mostrarse como vencida con alerta e indicación roja acompañada de texto para resolverla como Realizada, Reprogramada o Cancelada.
- **CA-07 — Mostrar próximas acciones**: Dado que existen casos con próximas acciones registradas, cuando el usuario consulta Inicio, entonces debe poder visualizarlas y acceder al caso correspondiente.

### HU-003 — Consultar el resumen regional de Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir el resumen a la Región**: Dado que el usuario pertenece a una Región, cuando ingresa al sistema, entonces el resumen debe mostrar únicamente información correspondiente a esa Región y sus unidades dependientes.
- **CA-02 — Mostrar clientes/beneficiarias del ámbito**: Dado que existen clientes/beneficiarias dentro de la Región, cuando se consulta Inicio, entonces debe mostrarse la cantidad correspondiente.
- **CA-03 — Mostrar casos activos**: Dado que existen casos A.I. activos dentro de la Región, cuando se consulta el resumen, entonces debe mostrarse su cantidad.
- **CA-04 — Mostrar actividad de atención**: Dado que existen atenciones registradas dentro de la Región, cuando se consulta el resumen, entonces debe mostrarse una medida resumida de la actividad.
- **CA-05 — Mostrar programación**: Dado que existen actividades programadas, cuando se consulta el resumen, entonces debe mostrarse la cantidad correspondiente y permitir acceder a Programación.
- **CA-06 — Acceso a analítica**: Dado que el usuario necesita profundizar en la información regional, cuando accede a Reportería, entonces debe conservarse su ámbito regional.

### HU-004 — Consultar el resumen nacional de Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Utilizar el ámbito nacional**: Dado que el usuario posee acceso de Nivel Nacional, cuando ingresa al sistema, entonces el resumen debe considerar toda la información nacional permitida.
- **CA-02 — Mostrar clientes/beneficiarias**: Dado que existen clientes/beneficiarias registrados, cuando se consulta Inicio, entonces debe mostrarse la cantidad correspondiente.
- **CA-03 — Mostrar casos activos**: Dado que existen casos A.I. activos, cuando se consulta el resumen nacional, entonces debe mostrarse su cantidad.
- **CA-04 — Mostrar actividad de atención**: Dado que existen atenciones registradas, cuando se consulta Inicio, entonces debe mostrarse una medida resumida de la actividad realizada.
- **CA-05 — Mostrar programación**: Dado que existen actividades programadas, cuando el usuario consulta el resumen, entonces debe poder visualizar una medida de la programación y acceder a su consulta.
- **CA-06 — Acceder a reportería**: Dado que el usuario necesita profundizar en los datos, cuando accede a Reportería, entonces debe conservar su ámbito nacional.

### HU-005 — Buscar un cliente/beneficiaria del establecimiento

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Búsqueda por identificación**: Dado que el usuario conoce la identificación, cuando la ingresa, entonces el sistema debe devolver únicamente coincidencias del ámbito autorizado.
- **CA-02 — Prioridad de coincidencia exacta**: Dado que existe una coincidencia exacta por identificación, cuando se ejecuta la búsqueda, entonces esta debe tener precedencia sobre coincidencias aproximadas por nombre.
- **CA-03 — Búsqueda por nombre**: Dado que no se dispone de la identificación, cuando se ingresa un nombre total o parcial, entonces deben mostrarse únicamente coincidencias del ámbito autorizado.
- **CA-04 — Varias coincidencias**: Dado que existen varias coincidencias, cuando se muestran los resultados, entonces deben presentarse datos suficientes para distinguir a las personas.
- **CA-05 — Restricción de ámbito**: Dado que el usuario posee acceso de nivel Establecimiento, cuando realiza una búsqueda, entonces no debe poder localizar ni seleccionar personas fuera de sus establecimientos autorizados.
- **CA-06 — Conteo de resultados**: Dado que se ejecuta una búsqueda, cuando existen resultados, entonces debe indicarse la cantidad de registros encontrados.
- **CA-07 — Múltiples establecimientos autorizados**: Dado que el usuario posee más de un establecimiento autorizado, cuando accede a la búsqueda, entonces debe poder filtrar exclusivamente entre dichos establecimientos.
- **CA-08 — Único establecimiento autorizado**: Dado que existe un único establecimiento autorizado, cuando se accede a la búsqueda, entonces el sistema debe aplicarlo automáticamente sin mostrar un filtro innecesario.
- **CA-09 — Sin coincidencias**: Dado que la búsqueda no encuentra resultados, cuando finaliza, entonces el sistema debe informarlo sin ampliar el ámbito autorizado.
- **CA-10 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-006 — Consultar y localizar clientes/beneficiarias de la Oficina Local

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Buscar por identificación**: Dado que el usuario conoce la identificación, cuando la ingresa, entonces el sistema debe priorizar la coincidencia exacta.
- **CA-02 — Buscar por nombre**: Dado que no conoce la identificación, cuando busca por nombre, entonces debe obtener las coincidencias de su Oficina Local.
- **CA-03 — Restringir ámbito**: Dado que pertenece a una Oficina Local, cuando realiza la búsqueda, entonces no debe recibir resultados de otras Oficinas Locales.
- **CA-04 — Filtrar por establecimiento**: Dado que existen múltiples establecimientos, cuando selecciona uno, entonces el listado debe limitarse a ese establecimiento.
- **CA-05 — Mostrar conteo**: Dado que existe una búsqueda o filtro activo, cuando cambian los resultados, entonces debe mostrarse su cantidad respecto del total disponible.
- **CA-06 — Exportación de personas pendiente de revisión**: Dado que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, cuando se revisa esta capacidad, entonces queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.
- **CA-07 — Estructurar exportación**: Dado que se genera una exportación tabular, cuando se abre en una herramienta compatible, entonces los atributos deben organizarse en encabezados y columnas diferenciadas.
- **CA-08 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-007 — Buscar y consultar clientes/beneficiarias de la Región

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Buscar por identificación**: Dado que el usuario conoce la identificación, cuando la ingresa, entonces debe priorizarse la coincidencia exacta dentro de la Región.
- **CA-02 — Buscar por nombre**: Dado que no conoce la identificación, cuando ingresa un nombre, entonces deben mostrarse las coincidencias de la Región.
- **CA-03 — Restringir ámbito**: Dado que pertenece a una Región, cuando realiza una búsqueda, entonces no debe recibir resultados de otras Regiones.
- **CA-04 — Filtrar por Oficina Local**: Dado que existen varias Oficinas Locales, cuando selecciona una, entonces deben mostrarse únicamente sus clientes/beneficiarias.
- **CA-05 — Filtrar por establecimiento**: Dado que existen varios establecimientos en el ámbito seleccionado, cuando selecciona uno, entonces debe limitarse el listado.
- **CA-06 — Filtros dependientes**: Dado que cambia la Oficina Local seleccionada, cuando un establecimiento previo deja de ser compatible, entonces debe actualizarse o limpiarse.
- **CA-07 — Mostrar conteo**: Dado que se aplican filtros, cuando se actualizan los resultados, entonces debe indicarse la cantidad encontrada.
- **CA-08 — Exportación de personas pendiente de revisión**: Dado que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, cuando se revisa esta capacidad, entonces queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.
- **CA-09 — Estructurar exportación**: Dado que se genera la exportación, cuando se abre externamente, entonces sus atributos deben encontrarse distribuidos en columnas claramente identificadas.
- **CA-10 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-008 — Buscar y consultar clientes/beneficiarias a nivel nacional

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Buscar por identificación**: Dado que se conoce la identificación, cuando se ingresa, entonces debe priorizarse la coincidencia exacta.
- **CA-02 — Buscar por nombre**: Dado que no se conoce la identificación, cuando se busca por nombre, entonces deben mostrarse las coincidencias permitidas.
- **CA-03 — Búsqueda contextual en ámbito nacional**: Dado que no se aplicaron filtros territoriales, cuando se ejecuta una búsqueda contextual por identificación o nombre, entonces se utiliza el ámbito nacional permitido sin cargar el listado general de personas.
- **CA-04 — Filtrar por Región**: Dado que se selecciona una Región, cuando se actualiza el listado, entonces deben mostrarse únicamente sus registros.
- **CA-05 — Filtrar por Oficina Local**: Dado que se selecciona una Oficina Local, cuando se actualiza el listado, entonces deben mostrarse únicamente sus registros.
- **CA-06 — Filtrar por establecimiento**: Dado que se selecciona un establecimiento, cuando se actualiza el listado, entonces deben mostrarse únicamente sus clientes/beneficiarias.
- **CA-07 — Mantener jerarquía de filtros**: Dado que los filtros son dependientes, cuando cambia un nivel superior, entonces deben actualizarse o limpiarse los niveles inferiores incompatibles.
- **CA-08 — Mostrar conteo**: Dado que existen filtros activos, cuando se actualizan los resultados, entonces debe indicarse su cantidad.
- **CA-09 — Exportación de personas pendiente de revisión**: Dado que la exportación masiva dependía exclusivamente de la pantalla general Personas/Clientes retirada, cuando se revisa esta capacidad, entonces queda PENDIENTE DE REVISIÓN y no exigible desde esa pantalla, sin definir una pantalla sustituta; se conservan las exportaciones autorizadas de otros flujos vigentes.
- **CA-10 — Estructurar exportación**: Dado que se genera una salida tabular, cuando se utiliza externamente, entonces debe contener encabezados y columnas diferenciadas.
- **CA-11 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-009 — Consultar información básica de un cliente/beneficiaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Mostrar identificación básica**: Dado que se selecciona un cliente/beneficiaria, cuando se abre su información, entonces debe visualizar al menos nombre, identificación, fecha de nacimiento o edad cuando esté disponible, sexo y establecimiento.
- **CA-02 — Mostrar ubicación y servicios**: Dado que existe información institucional disponible, cuando se consulta el perfil, entonces podrá mostrarse establecimiento, Oficina Local, Región y modalidades o servicios aplicables.
- **CA-03 — Mostrar información contextual disponible**: Dado que las fuentes institucionales contienen información relacionada con la persona encargada, cuando resulte pertinente para el flujo y el rol, entonces podrá mostrarse de forma compacta la persona encargada, relación, contacto y dirección disponibles.
- **CA-04 — No convertir al encargado en cliente A.I.**: Dado que se muestra información de la persona encargada, cuando se consulta el perfil, entonces esta debe manejarse como contexto relacionado con el cliente/beneficiaria y no como un cliente A.I. independiente.
- **CA-05 — Mostrar procedencia del dato**: Dado que un dato fue reutilizado desde una fuente institucional, cuando corresponda, entonces el sistema debe poder conservar su procedencia.
- **CA-06 — Mostrar estado y prioridad de A.I.**: Dado que existen casos A.I. asociados, cuando se consulta el perfil, entonces deben mostrarse identificador, estado, prioridad A.I. y fechas de apertura/cierre autorizadas para Establecimiento.
- **CA-07 — Persona sin caso A.I.**: Dado que no existen casos visibles, cuando se consulta el perfil, entonces debe indicarse claramente.
- **CA-08 — Protección de información interna**: Dado que el usuario pertenece a Establecimiento, cuando consulta el perfil, entonces no debe acceder a valoración completa, factores detallados, nivel de riesgo, nivel de protección, plan interno, atenciones detalladas, documentos sensibles ni demás gestión interna restringida.
- **CA-09 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-010 — Consultar la información integral disponible de un cliente/beneficiaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Datos básicos**: Dado que se selecciona una persona, cuando se abre su perfil, entonces debe visualizar al menos identificación, nombre, fecha de nacimiento, edad, sexo, establecimiento, Oficina Local, Región y modalidades o servicios disponibles.
- **CA-02 — Información de persona encargada**: Dado que existe información institucional disponible, cuando se consulta el perfil, entonces podrá visualizarse de forma contextual la persona encargada, relación, contacto y dirección registrados.
- **CA-03 — Procedencia de datos**: Dado que la información proviene de otra fuente institucional, cuando se utiliza en SIA-CENCINAI, entonces debe conservarse su procedencia cuando corresponda.
- **CA-04 — Casos asociados**: Dado que la persona posee casos A.I., cuando se consulta el perfil, entonces deben mostrarse y permitir acceso según permisos.
- **CA-05 — Historial**: Dado que existen eventos registrados, cuando se consulta el historial, entonces deben mostrarse cronológicamente.
- **CA-06 — Evitar redigitación**: Dado que un dato maestro ya existe, cuando se utiliza la persona en otro flujo, entonces el sistema debe reutilizarlo en lugar de solicitarlo nuevamente.
- **CA-07 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-011 — Consultar información de un cliente/beneficiaria desde Nivel Regional

**Estado en v0.7:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

- **CA-01 — Consultar datos básicos**: Dado que se selecciona una persona, cuando se abre su perfil, entonces deben mostrarse únicamente los datos permitidos.
- **CA-02 — Mostrar pertenencia institucional**: Dado que la persona pertenece a un establecimiento, cuando se consulta, entonces deben mostrarse establecimiento, Oficina Local y Región.
- **CA-03 — Consultar casos asociados**: Dado que existen casos A.I., cuando se consulta el perfil, entonces deben mostrarse los casos visibles para Regional.
- **CA-04 — Acceder al caso permitido**: Dado que se selecciona un caso, cuando se abre, entonces debe mostrarse en modo lectura según permisos.
- **CA-05 — Consultar historial permitido**: Dado que existen eventos, cuando se consulta el historial, entonces deben mostrarse únicamente los autorizados.
- **CA-06 — Solo lectura**: Dado que la gestión corresponde a Oficina Local, cuando Regional consulta información individual, entonces no debe poder modificarla.
- **CA-07 — Protección de información sensible**: Dado que existen datos sujetos a permisos adicionales, cuando se consulta el expediente, entonces deben aplicarse las restricciones institucionales correspondientes.
- **CA-08 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-012 — Consultar información de un cliente/beneficiaria desde Nivel Nacional

**Estado en v0.7:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

- **CA-01 — Consultar datos básicos**: Dado que se selecciona una persona, cuando se abre su perfil, entonces deben mostrarse únicamente los datos permitidos.
- **CA-02 — Consultar ubicación institucional**: Dado que la persona está asociada a un establecimiento, cuando se consulta, entonces deben visualizarse establecimiento, Oficina Local y Región.
- **CA-03 — Consultar casos asociados**: Dado que existen casos A.I., cuando se consulta el perfil, entonces deben mostrarse los casos accesibles para Nivel Nacional.
- **CA-04 — Acceder al detalle permitido**: Dado que se selecciona un caso, cuando se abre, entonces debe consultarse en modo lectura.
- **CA-05 — Consultar historial permitido**: Dado que existen eventos, cuando se consulta el historial, entonces deben mostrarse únicamente los autorizados.
- **CA-06 — Impedir modificación operativa**: Dado que el usuario pertenece al Nivel Nacional, cuando consulta información individual, entonces no debe poder modificar registros operativos.
- **CA-07 — Restringir información sensible**: Dado que existen restricciones adicionales, cuando se accede al expediente, entonces deben aplicarse antes de mostrar la información.
- **CA-08 — Acceso contextual sin pantalla general**: Dado que se requiere localizar o consultar una persona, cuando se utiliza un flujo autorizado como referencias, sesiones interdisciplinarias, consulta de casos o registro de atenciones, entonces se mantiene la búsqueda por identificación o nombre y la consulta de identidad e historial según ámbito y permisos, sin pantalla principal Personas/Clientes ni carga de un listado general de CAH/SIDINACC.

### HU-013 — Crear manualmente una referencia a Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

- **CA-01 — Seleccionar cliente/beneficiaria mediante búsqueda**: Dado que se inicia una referencia, cuando debe identificarse al cliente/beneficiaria, entonces debe buscarse por identificación o nombre y no mediante una lista masiva.
- **CA-02 — Restringir selección según ámbito**: Dado que el usuario crea una referencia, cuando busca al cliente/beneficiaria, entonces los resultados deben limitarse a su ámbito autorizado.
- **CA-03 — Reutilizar datos existentes**: Dado que existen datos institucionales disponibles, cuando se selecciona al cliente/beneficiaria, entonces el sistema debe reutilizarlos y evitar solicitar su redigitación.
- **CA-04 — Permitir creación según rol autorizado**: Dado que el usuario posee autorización de nivel Establecimiento como profesional, ASC2 o ASC3, o autorización operativa de Oficina Local, cuando inicia una referencia, entonces debe poder crearla dentro de su ámbito.
- **CA-05 — Registrar fecha**: Dado que se crea una referencia, cuando se completa su información inicial, entonces debe registrarse la fecha correspondiente.
- **CA-06 — Registrar Vía de Atención**: Dado que se crea una referencia, cuando se define la Vía de Atención, entonces debe poder seleccionarse `Urgencia` o `No inmediata`.
- **CA-07 — Registrar origen**: Dado que debe registrarse cómo se identificó la situación, cuando se define el origen, entonces debe seleccionarse una de las opciones vigentes:
- **CA-08 — Determinar automáticamente quién realiza la referencia**: Dado que el usuario se encuentra autenticado, cuando crea una referencia, entonces el sistema debe obtener automáticamente su identidad y conservarla como responsable de la referencia.
- **CA-09 — Impedir edición del responsable**: Dado que la identidad del responsable proviene de la sesión institucional, cuando se completa la referencia, entonces no debe existir un campo editable para sustituir manualmente a quien realiza la referencia.
- **CA-10 — Motivos de Crecimiento**: Dado que se selecciona la categoría Crecimiento, cuando se muestran sus motivos, entonces deben contemplarse `Condición de malnutrición` y `Malnutrición con necesidades especiales`, sin una opción genérica de otra alteración.
- **CA-11 — Motivos de Desarrollo**: Dado que se selecciona Desarrollo, cuando se muestran sus motivos, entonces deben existir únicamente:
- **CA-12 — Motivos de Salud**: Dado que la categoría Salud puede contener situaciones no previstas, cuando se muestran sus motivos, entonces podrá mantenerse la opción `Otra condición de salud` junto con las alternativas estructuradas vigentes.
- **CA-13 — Factores de riesgo**: Dado que se seleccionan factores de riesgo como motivo de referencia, cuando se muestran las opciones, entonces deben distinguirse al menos los ámbitos individual, hogar-familiar y comunitario y no debe existir un `Otro factor de riesgo` genérico.
- **CA-14 — Seleccionar múltiples motivos**: Dado que pueden coexistir diferentes condiciones, cuando se registran los motivos, entonces debe poder seleccionarse más de uno.
- **CA-15 — Especificar un motivo seleccionado**: Dado que un motivo requiere contextualización, cuando se selecciona, entonces debe poder registrarse un detalle textual asociado.
- **CA-16 — Mantener relación selección-detalle**: Dado que un motivo posee detalle asociado, cuando se elimina de la selección, entonces el sistema debe eliminar o invalidar también su detalle.
- **CA-17 — Registrar acciones realizadas previamente**: Dado que se han realizado acciones antes de referir, cuando se completa la referencia, entonces debe existir un campo para documentarlas.
- **CA-18 — Registrar resultados previos**: Dado que las acciones previas produjeron resultados, cuando se completa la referencia, entonces debe existir un campo diferenciado para documentarlos.
- **CA-19 — Registrar información complementaria asociada al motivo de referencia**: Dado que existe contexto útil relacionado con el motivo, cuando se completa la referencia, entonces debe poder registrarse en un campo diferenciado de información complementaria asociada al motivo de referencia, sin exigir una historia narrativa extensa del niño o su familia.
- **CA-20 — Navegación estructurada**: Dado que el usuario completa una referencia, cuando avanza por el formulario, entonces la captura debe organizarse en etapas y permitir regresar antes de guardar.
- **CA-21 — Enfocar la interfaz durante la creación**: Dado que el usuario se encuentra confeccionando una referencia, cuando está dentro del flujo de creación, entonces la interfaz no debe mostrar simultáneamente la bandeja y detalle de referencias existentes cuando estos no sean necesarios para completar la tarea.
- **CA-22 — Cliente/beneficiaria obligatorio**: Dado que no se seleccionó una persona válida, cuando se intenta avanzar, entonces el sistema debe impedirlo.
- **CA-23 — Mostrar datos reutilizados en la revisión**: Dado que se llega al paso final, cuando se revisa la referencia, entonces deben mostrarse compactamente los datos disponibles de identificación, nombre, fecha de nacimiento, edad, sexo y modalidades/servicios, seguidos del contexto territorial en orden Región → Oficina Local → Establecimiento y los datos disponibles de persona encargada, relación, contacto y dirección.
- **CA-24 — Mostrar responsable en modo lectura**: Dado que el sistema conoce quién realiza la referencia, cuando se presenta la revisión final, entonces esta persona debe mostrarse como información no editable.
- **CA-25 — Asignar consecutivo institucional**: Dado que la referencia se registra, cuando se identifica documentalmente, entonces debe disponer del consecutivo DNCC-DRXX-OLXXX-{código de establecimiento}-REF-XXX-20XX conforme a RF-114, que puede coexistir con un identificador técnico interno.
- **CA-26 — Vincular consecutivo con el establecimiento del niño**: Dado que el consecutivo contiene información territorial, cuando se construye o valida, entonces el código de establecimiento debe corresponder al establecimiento asociado al cliente/beneficiaria y no a la ubicación de quien confecciona la referencia.
- **CA-27 — Preservar contexto histórico**: Dado que los datos institucionales pueden cambiar, cuando se registra la referencia, entonces deben preservarse persona encargada, relación, contacto, dirección, modalidades/servicios, Región, Oficina Local, establecimiento y edad al momento de la referencia, cuando estén disponibles, sin actualización retroactiva por cambios maestros.
- **CA-28 — Registrar y enviar referencia**: Dado que la información fue revisada, cuando el usuario confirma el envío, entonces la referencia debe quedar registrada y asociada al cliente/beneficiaria y a su contexto institucional, disponible inmediatamente para Oficina Local.
- **CA-29 — Estado después del envío**: Dado que la referencia fue enviada, cuando finaliza el proceso, entonces debe quedar Pendiente de revisión en Oficina Local, sin confirmación manual de recepción ni estado manual Recibida.
- **CA-30 — Conservar comprobante de envío**: Dado que se confirma el envío digital, cuando se registra, entonces el sistema debe conservar automáticamente fecha, hora e identidad institucional del usuario que realizó el envío como datos no editables, diferenciados de la generación o impresión del documento.
- **CA-31 — Comprobar caso activo antes del registro**: Dado que se inicia una referencia, cuando se identifica a la persona y antes de registrarla, entonces se comprueba globalmente si posee un caso A.I. activo; si existe se bloquea la referencia incompatible y se informa sin revelar detalles internos no autorizados; una referencia pendiente no equivale a un caso activo.

### HU-014 — Cargar una referencia desde una plantilla estandarizada

**Estado en v0.7:** PROPUESTA DE DISEÑO VALIDADA

- **CA-01 — Descargar plantilla**: Dado que se requiere captura mediante plantilla, cuando se selecciona la opción correspondiente, entonces debe poder descargarse la versión compatible vigente.
- **CA-02 — Cargar archivo**: Dado que existe una plantilla completada, cuando se selecciona el archivo, entonces debe iniciarse la precarga.
- **CA-03 — Validar estructura**: Dado que se carga un archivo, cuando se procesa, entonces debe comprobarse su estructura antes de utilizar los datos.
- **CA-04 — Precargar formulario**: Dado que la plantilla es válida, cuando finaliza su procesamiento, entonces los valores compatibles deben precargarse.
- **CA-05 — Revisión humana**: Dado que los datos fueron precargados, cuando se continúa el flujo, entonces deben poder revisarse y corregirse antes de guardar.
- **CA-06 — Responsable automático**: Dado que la referencia es confirmada por un usuario autenticado, cuando se guarda, entonces el responsable deberá obtenerse de su identidad institucional y no de un valor editable de la plantilla.
- **CA-07 — Aplicar mismas reglas**: Dado que la información fue revisada, cuando se confirma la referencia, entonces debe cumplir las mismas reglas de motivos, Vía de Atención, origen, consecutivo, asociación territorial y contexto histórico que una referencia creada directamente.
- **CA-08 — Confirmar envío digital**: Dado que se revisó la precarga y se confirma su envío, cuando se registra la referencia, entonces debe quedar inmediatamente disponible para Oficina Local como Pendiente de revisión, con fecha, hora y usuario del envío automáticos y no editables.
- **CA-09 — Validar unicidad también desde plantilla**: Dado que una referencia procede de plantilla, cuando se valida y confirma su registro, entonces se aplica el mismo bloqueo por caso A.I. activo que en HU-013, sin revelar información restringida ni equiparar una referencia pendiente con un caso activo.

### HU-015 — Consultar las referencias del establecimiento

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir referencias por ámbito**: Dado que el usuario posee acceso de Establecimiento, cuando abre Referencias, entonces únicamente debe visualizar las correspondientes a sus establecimientos autorizados.
- **CA-02 — Información resumida**: Dado que existen referencias visibles, cuando se presenta el listado, entonces debe mostrar consecutivo, cliente/beneficiaria, identificación, establecimiento, responsable, fecha/hora de envío, estado y Vía de Atención.
- **CA-03 — Buscar referencias**: Dado que existen múltiples referencias, cuando se busca por nombre, identificación o consecutivo, entonces deben mostrarse únicamente las coincidencias del ámbito autorizado.
- **CA-04 — Filtrar referencias**: Dado que el usuario necesita organizar las referencias visibles, cuando aplica filtros autorizados como estado, Vía de Atención, origen o categoría, entonces el listado debe actualizarse sin ampliar su ámbito.
- **CA-05 — Seleccionar referencia**: Dado que existe una referencia visible, cuando se selecciona, entonces debe poder consultarse su detalle permitido.

### HU-016 — Consultar el detalle de una referencia

**Estado en v0.7:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

- **CA-01 — Información general**: Dado que se abre una referencia, cuando se carga su detalle, entonces deben visualizarse consecutivo institucional, cliente/beneficiaria, identificación, fecha, estado, Vía de Atención y origen.
- **CA-02 — Contexto histórico**: Dado que la referencia preservó información contextual al registrarse, cuando se consulta posteriormente, entonces debe mostrar ese contexto histórico y no reemplazarlo retroactivamente por datos maestros actuales.
- **CA-03 — Motivos y especificaciones**: Dado que existen motivos seleccionados, cuando se consulta el detalle, entonces deben mostrarse junto con sus especificaciones.
- **CA-04 — Acciones previas y resultados**: Dado que se registraron acciones y resultados previos, cuando se consulta la referencia, entonces deben mostrarse como datos diferenciados.
- **CA-05 — Información complementaria asociada al motivo**: Dado que se registró información complementaria asociada al motivo de referencia, cuando se consulta el detalle, entonces debe mostrarse separadamente de las acciones previas y sus resultados.
- **CA-06 — Responsable**: Dado que la referencia fue creada por una persona usuaria autenticada, cuando se consulta posteriormente, entonces debe mostrarse quién la realizó y ese dato no debe cambiar por cambios posteriores de sesión o rol.
- **CA-07 — Respetar ámbito**: Dado que el usuario intenta acceder a una referencia, cuando esta no pertenece a su ámbito autorizado, entonces el acceso debe impedirse.
- **CA-08 — Consultar trazabilidad de envío**: Dado que la referencia fue enviada, cuando se consulta su detalle, entonces deben mostrarse fecha y hora de envío y usuario remitente como datos históricos de solo lectura, junto con el estado Pendiente de revisión, Admitida a A.I. o No requiere A.I. que corresponda.

### HU-017 — Imprimir una referencia

**Estado en v0.7:** CONFIRMADO / DISEÑO DOCUMENTAL A REFINAR

- **CA-01 — Generar versión imprimible**: Dado que existe una referencia, cuando se selecciona imprimir, entonces debe generarse una representación preparada para impresión.
- **CA-02 — Identificación documental**: Dado que se genera el documento, cuando se presenta, entonces debe incluir el consecutivo institucional y la fecha.
- **CA-03 — Datos del cliente/beneficiaria**: Dado que la referencia contiene información de identificación y contexto, cuando se imprime, entonces debe incluir al menos nombre, identificación, fecha de nacimiento, edad al momento de la referencia, sexo y los datos institucionales pertinentes disponibles.
- **CA-04 — Datos territoriales**: Dado que la referencia pertenece a un establecimiento, cuando se imprime, entonces deben presentarse después de los datos principales de identificación en orden Región → Oficina Local → Establecimiento.
- **CA-05 — Datos de referencia**: Dado que se genera el documento, cuando se imprime, entonces debe incluir título, consecutivo, fecha de referencia, fecha y hora de envío, responsable, identificación, nombre, fecha de nacimiento, edad de la referencia, sexo, modalidades/servicios, contexto territorial, persona encargada, relación, contacto, dirección, Vía de Atención, origen, motivos, especificaciones, acciones previas, resultados e información complementaria […]
- **CA-06 — Información contextual**: Dado que la referencia preservó datos históricos de contexto, cuando se imprime posteriormente, entonces debe utilizar esos valores preservados.
- **CA-07 — Presentación documental**: Dado que la salida se utiliza como respaldo institucional, cuando exista un diseño aprobado, entonces debe aplicar logo, encabezado, paginación y demás elementos institucionales autorizados sin imponer un diseño gráfico concreto.
- **CA-08 — No alterar el registro**: Dado que se genera una impresión, cuando finaliza el proceso, entonces la referencia original no debe modificarse.
- **CA-09 — Diferenciar envío y generación documental**: Dado que se genera o imprime un comprobante, cuando se presenta su trazabilidad, entonces la fecha y hora de envío deben permanecer inalteradas y distinguirse de la fecha y hora de generación o impresión cuando estas se conserven.

### HU-018 — Consultar referencias de Atención Interdisciplinaria pendientes de revisión

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Bandeja de referencias**: Dado que existen referencias en la Oficina Local, cuando se abre la sección, entonces debe mostrarse el listado correspondiente al ámbito.
- **CA-02 — Información resumida**: Dado que una referencia aparece en la bandeja, cuando se presenta, entonces debe mostrar consecutivo, cliente/beneficiaria, identificación, establecimiento, responsable, fecha/hora de envío, estado y Vía de Atención.
- **CA-03 — Buscar y filtrar**: Dado que existen múltiples referencias, cuando el usuario aplica búsqueda o filtros de estado, Vía de Atención, origen o categoría, entonces deben mostrarse únicamente los registros que correspondan.
- **CA-04 — Disponibilidad inmediata por envío digital**: Dado que un usuario autorizado envió una referencia mediante SIA, cuando finaliza el envío, entonces debe aparecer inmediatamente en la bandeja de Oficina Local como Pendiente de revisión sin registrar un recibido manual.
- **CA-05 — Mantener origen y consecutivo**: Dado que la referencia proviene de un establecimiento, cuando Oficina Local la consulta, entonces deben conservarse su establecimiento de origen, responsable y consecutivo institucional.
- **CA-06 — Distinguir revisión y resultado**: Dado que la referencia está pendiente de revisión, cuando el Equipo Interdisciplinario concluye su análisis, entonces debe conservarse el resultado Admitida a A.I. al confirmar la admisión o No requiere A.I. con justificación, sin utilizar Rechazada como denominación del resultado.

### HU-049 — Consultar posibles referencias pendientes detectadas desde fuentes institucionales

**Estado en v0.7:** SECCIÓN Y EXPERIENCIA FUNCIONAL VALIDADAS / DETECCIÓN AUTOMÁTICA DEPENDIENTE DE INTEGRACIÓN CON FUENTES AUTORIZADAS Y COORDINACIÓN CON UTIC

- **CA-01 — Reutilizar fuente autorizada**: Dado que existe un resultado institucional disponible mediante integración autorizada, cuando cumple un criterio vigente de referencia, entonces podrá detectarse como posible referencia pendiente sin recapturar variables ni recalcular resultados.
- **CA-02 — Aplicar criterios institucionales**: Dado que el criterio vigente lo establece, cuando existe condición de malnutrición que amerita referencia, EDIN II rojo o EVADE 0/1 bajo el criterio definido, entonces el resultado debe contrastarse con la gestión existente en SIA, sin sustituir la decisión profesional.
- **CA-03 — Evitar duplicados**: Dado que existe una referencia equivalente gestionada en SIA, cuando se evalúa el resultado, entonces no debe presentarse como pendiente ni generar una referencia duplicada.
- **CA-04 — Mostrar contexto de detección**: Dado que una situación permanece pendiente, cuando se muestra la lista o alerta, entonces debe incluir cliente/beneficiaria, establecimiento, motivo o criterio y fecha o período del resultado cuando estén disponibles.
- **CA-05 — Respetar permisos**: Dado que la función se asigna institucionalmente a personal autorizado, cuando se presentan situaciones, entonces los resultados deben restringirse al permiso y ámbito autorizados de la persona usuaria que tenga asignada esta función, sin conceder acceso al detalle interno de casos.
- **CA-06 — Iniciar gestión autorizada**: Dado que se selecciona una situación, cuando el usuario actúa, entonces debe poder localizar al cliente/beneficiaria o iniciar el flujo autorizado de referencia con revisión humana.
- **CA-07 — Resolver pendiente**: Dado que se gestiona la referencia correspondiente, cuando se actualiza la detección, entonces la situación debe dejar de mostrarse como pendiente, conservando la trazabilidad pertinente.
- **CA-08 — No abrir casos automáticamente**: Dado que se detecta un resultado o se inicia una referencia, cuando continúa el proceso, entonces no debe abrirse automáticamente un caso A.I. sin valoración y decisión del equipo.
- **CA-09 — Dependencia institucional**: Dado que la detección depende de fuentes autorizadas, cuando se habilita, entonces debe utilizar el mecanismo definido con UTIC y los criterios institucionales vigentes, sin imponer evento, consulta periódica ni periodicidad técnica; se relaciona con RF-127 y CU-37.
- **CA-10 — Sección independiente con búsqueda y paginación**: Dado que el personal autorizado de Establecimiento u Oficina Local accede a Posibles referencias, cuando consulta la sección separada de la bandeja ordinaria de Referencias, entonces dispone de paginación, búsqueda por identificación y nombre y filtros por establecimiento, fecha de detección y criterio o categoría, siempre limitados al ámbito y permisos.
- **CA-11 — Confirmar una sola referencia desde la sugerencia**: Dado que dos personas intentan crear una referencia desde la misma sugerencia, cuando confirman la operación, entonces solo una operación válida puede confirmarse; se comprueba la ausencia de referencia equivalente duplicada y de caso A.I. activo incompatible, se informa sin revelar detalles no autorizados y se conserva trazabilidad de detección y gestión.

### HU-019 — Gestionar una sesión interdisciplinaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Crear sesión**: Dado que el EE.II. necesita registrar una sesión, cuando la crea, entonces debe poder registrar fecha, horario y lugar.
- **CA-02 — Registrar disciplinas participantes**: Dado que participan diferentes perfiles profesionales, cuando se configura la sesión, entonces deben poder indicarse una o varias disciplinas del catálogo vigente. Las Disciplinas se seleccionan mediante un selector múltiple convencional y compacto, como lista o desplegable multiselección con búsqueda opcional, sin chips/globitos como mecanismo principal de entrada y conservando las opciones y reglas vigentes (RF-038, RF-120).
- **CA-03 — No incluir disciplina genérica**: Dado que el catálogo institucional define las disciplinas aplicables, cuando se seleccionan participantes profesionales, entonces no debe existir una disciplina genérica `Otra` salvo que el procedimiento vuelva a incorporarla formalmente.
- **CA-04 — Permitir sesión sin casos iniciales**: Dado que una sesión puede programarse anticipadamente, cuando se crea, entonces no debe ser obligatorio incorporar referencias de inmediato.
- **CA-05 — Buscar referencias**: Dado que se desea incorporar una situación, cuando se busca, entonces debe localizarse por identificación o nombre sin utilizar una lista masiva.
- **CA-06 — Múltiples referencias**: Dado que una sesión puede analizar múltiples situaciones, cuando se agregan referencias, entonces debe permitirse asociar varias a la misma sesión.
- **CA-07 — Evitar duplicados**: Dado que una referencia ya forma parte de la sesión, cuando intenta agregarse nuevamente, entonces el sistema debe impedirlo.
- **CA-08 — Valoración dentro de la Sesión interdisciplinaria**: Dado que se abre la Valoración situacional de una situación de la sesión, cuando se revisan los Factores, entonces se aplican las categorías colapsables, la persistencia de selecciones y las validaciones de HU-020 CA-12 a CA-14 y CU-08, sin alterar la clasificación institucional.
- **CA-09 — Incorporar casos activos para revaloración**: Dado que surgen situaciones nuevas en un caso activo del ámbito, cuando el Equipo Interdisciplinario organiza otra sesión, entonces puede buscarlo por identificación o nombre y asociarlo una sola vez a la sesión para revalorarlo sin abrir otro caso.

### HU-020 — Registrar la valoración situacional de un caso

**Estado en v0.7:** MODELO OBJETIVO / ACTUALIZADO Y VALIDADO FUNCIONALMENTE

- **CA-01 — Ámbito individual**: Dado que el equipo analiza una situación, cuando registra la valoración individual, entonces debe poder seleccionar factores protectores, factores de riesgo y signos de alerta.
- **CA-02 — Ámbito hogar-familiar**: Dado que se analiza el contexto familiar, cuando se completa ese ámbito, entonces deben poder registrarse los factores correspondientes.
- **CA-03 — Ámbito comunitario**: Dado que se analiza el entorno comunitario, cuando se completa ese ámbito, entonces deben poder registrarse los factores correspondientes.
- **CA-04 — Múltiples factores**: Dado que pueden coexistir varios elementos, cuando se realiza la valoración, entonces debe permitirse seleccionar múltiples factores dentro de cada ámbito.
- **CA-05 — Especificación textual**: Dado que un factor seleccionado requiere contexto, cuando el profesional lo considera necesario, entonces debe poder registrar una especificación asociada.
- **CA-06 — Elementos abiertos del instrumento**: Dado que el instrumento vigente contemple opciones abiertas equivalentes a `Otro` o `Entre otros`, cuando la situación no quede adecuadamente representada por los elementos estructurados, entonces podrá registrarse la especificación correspondiente.
- **CA-07 — No exigir intensidad, frecuencia o persistencia**: Dado que dichos campos no forman parte obligatoria del modelo vigente, cuando se completa la valoración, entonces el sistema no debe exigirlos.
- **CA-08 — Registrar nivel de riesgo profesional**: Dado que el equipo concluye el análisis de factores, cuando establece el nivel global de riesgo, entonces debe registrar Alto, Moderado o Bajo mediante valoración profesional; la selección de checkboxes no debe determinarlo automáticamente.
- **CA-09 — Registrar nivel de protección**: Dado que el equipo concluye el análisis de factores protectores, cuando establece el nivel global, entonces debe poder registrar `Alta`, `Moderada` o `Baja`.
- **CA-10 — Conservar ambos niveles**: Dado que riesgo y protección son dimensiones distintas, cuando se guarda la valoración, entonces ambos valores deben conservarse de forma independiente.
- **CA-11 — Utilizar catálogos vigentes**: Dado que factores, riesgos, elementos protectores o signos de alerta pueden evolucionar con el procedimiento, cuando se realiza una valoración, entonces debe utilizarse la versión institucional vigente aplicable.
- **CA-12 — Categorías colapsables**: Dado que se abre la Valoración situacional, cuando se presentan los Factores, entonces cada categoría aparece inicialmente compacta y puede expandirse al hacer clic para mostrar sus factores y volver a contraerse; cerrar y reabrir conserva las selecciones. No es necesario visualizar todos los factores simultáneamente ni cambia su clasificación o significado institucional (RF-042).
- **CA-13 — Respuesta explícita por categoría requerida**: Dado que se intenta continuar o finalizar la etapa correspondiente, cuando alguna categoría requerida no tiene respuesta, entonces el sistema bloquea el avance, identifica las categorías pendientes y muestra una validación comprensible. Es válido seleccionar uno o más factores aplicables o marcar explícitamente Ninguno. Ninguno significa que la categoría fue revisada y no se identificaron factores aplicables; no significa dato […]
- **CA-14 — Exclusividad y selección múltiple**: Dado que una categoría tiene Ninguno, cuando se selecciona otro factor, entonces Ninguno debe retirarse o la persona debe desmarcarlo antes de continuar; la combinación no es válida. Las selecciones múltiples utilizan controles claros y estructurados según RNF-009, manteniendo opciones y reglas vigentes (RF-043, RN-008).
- **CA-15 — Conservar revaloraciones del caso activo**: Dado que existe un caso activo con valoraciones previas, cuando el equipo registra una nueva valoración en otra sesión, entonces puede incorporar nuevos factores protectores, de riesgo o signos de alerta y actualizar profesionalmente riesgo y protección; se recalcula prioridad por RN-009 sin selección manual y se conservan valoraciones, prioridades históricas, fechas y responsables sin sobrescribir el pasado.

### HU-021 — Resolver si un caso requiere Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

- **CA-01 — Decisión explícita**: Dado que una situación fue analizada, cuando concluye la valoración, entonces debe registrarse `Sí requiere A.I.` o `No requiere A.I.`.
- **CA-02 — Exigir justificación cuando no requiere A.I.**: Dado que se selecciona `No requiere A.I.`, cuando se intenta confirmar la decisión, entonces debe ser obligatorio registrar una justificación.
- **CA-03 — No abrir caso**: Dado que se confirmó `No requiere A.I.`, cuando se guarda la resolución, entonces debe conservarse la valoración y su justificación sin crear un caso A.I. activo.
- **CA-04 — Requiere A.I.**: Dado que se selecciona `Sí requiere A.I.`, cuando continúa el flujo, entonces deben habilitarse los datos necesarios para completar el abordaje inicial.
- **CA-05 — Mantener trazabilidad de resolución**: Dado que se registra una decisión, cuando se confirma, entonces debe conservarse su relación con referencia y sesión; No requiere A.I. queda como resultado justificado y Sí requiere A.I. continúa hasta la admisión y apertura mediante HU-022.
- **CA-06 — Respetar el caso activo existente**: Dado que se analiza una situación, cuando se determina que la persona ya tiene un caso A.I. activo en cualquier ámbito, entonces la resolución no habilita otro caso simultáneo; las situaciones nuevas del caso activo se revaloran en ese mismo caso mediante una nueva sesión autorizada.

### HU-022 — Definir el abordaje inicial y abrir el caso de A.I.

**Estado en v0.7:** CONFIRMADO / MODELO OBJETIVO ACTUALIZADO

- **CA-01 — Utilizar riesgo y protección registrados**: Dado que el caso requiere A.I., cuando se completa su abordaje, entonces deben estar disponibles el nivel de riesgo y el nivel de protección establecidos por el equipo.
- **CA-02 — Calcular prioridad automáticamente**: Dado que existen un nivel de riesgo y protección válidos, cuando ambos están definidos, entonces el sistema debe calcular la prioridad sin solicitar su selección manual.
- **CA-03 — Aplicar la matriz institucional**: Dado que riesgo y protección están registrados, cuando se calcula prioridad, entonces debe aplicarse la matriz única de RN-009.
- **CA-04 — Recalcular ante cambios de valoración**: Dado que el equipo corrige riesgo o protección antes de confirmar, cuando cambia la combinación, entonces debe recalcularse la prioridad conforme a RN-009 sin edición manual.
- **CA-05 — Validar dimensiones requeridas**: Dado que falta riesgo o protección, cuando se intenta concluir el abordaje, entonces no debe asignarse una prioridad arbitraria y debe solicitarse completar la valoración profesional.
- **CA-06 — Mostrar semáforo**: Dado que se calculó una prioridad, cuando se presenta al equipo, entonces podrá representarse visualmente como rojo para Alto, ámbar para Moderado y verde para Bajo.
- **CA-07 — Diferenciar prioridad de Vía de Atención**: Dado que la referencia puede tener Vía de Atención `Urgencia`, cuando se calcula la prioridad A.I., entonces `Urgencia` no debe utilizarse como nivel de prioridad; los únicos niveles son Alto, Moderado y Bajo.
- **CA-08 — Registrar propósitos**: Dado que el caso requiere atención, cuando se define el abordaje, entonces deben poder registrarse uno o más propósitos.
- **CA-09 — Seleccionar estrategias**: Dado que el equipo define el abordaje, cuando configura el plan inicial, entonces debe poder seleccionar múltiples estrategias.
- **CA-10 — Seleccionar disciplinas**: Dado que pueden participar diferentes áreas profesionales, cuando se configura el plan, entonces debe poder asociarse una o varias disciplinas vigentes sin utilizar una disciplina genérica `Otra`.
- **CA-11 — Registrar frecuencia planificada**: Dado que se define la periodicidad esperada del abordaje, cuando se abre el caso, entonces deben mantenerse las alternativas vigentes e incluir Trimestral, Semestral y Según necesidad; la frecuencia expresa planificación y no garantiza intervalos exactos ni determina la periodicidad institucional de reuniones del equipo.
- **CA-12 — Abrir caso**: Dado que el abordaje está completo, cuando el equipo confirma, entonces debe crearse un caso A.I. activo vinculado a la persona y referencia de origen.
- **CA-13 — Conservar consecutivo de origen**: Dado que el caso nace de una referencia, cuando se crea, entonces debe mantener asociado el consecutivo institucional de dicha referencia.
- **CA-14 — Conservar contexto histórico**: Dado que la referencia preservó información contextual, cuando se abre el caso, entonces el caso debe poder mantener ese contexto de ingreso sin sustituirlo retroactivamente por cambios futuros de datos maestros.
- **CA-15 — Registrar evento inicial**: Dado que el caso fue abierto, cuando se crea, entonces debe incorporarse el evento de admisión a su historial longitudinal.
- **CA-16 — Revalidar unicidad al confirmar**: Dado que el equipo confirma una apertura, cuando se verifica nuevamente la existencia de un caso A.I. activo de la persona en cualquier establecimiento u Oficina Local, entonces solo se confirma si no existe otro activo, evitando duplicados por concurrencia; se informa del bloqueo sin exponer detalles no autorizados y se permiten nuevos casos si los anteriores están cerrados.
- **CA-17 — Actualizar abordaje tras revaloración**: Dado que un caso ya está activo y se revalora en nueva sesión, cuando cambian profesionalmente riesgo o protección, entonces se recalcula la prioridad por RN-009 y se actualiza el abordaje o plan cuando corresponda, conservando su evolución y sin ejecutar otra apertura.

### HU-023 — Consultar una lista simplificada de Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir ámbito**: Dado que el usuario posee acceso de Establecimiento, cuando consulta la Lista de A.I., entonces debe visualizar únicamente casos correspondientes a sus establecimientos autorizados.
- **CA-02 — Buscar en la lista**: Dado que existen múltiples registros, cuando se busca por identificación o nombre, entonces deben mostrarse únicamente las coincidencias autorizadas.
- **CA-03 — Filtrar información autorizada**: Dado que existen diferentes estados y prioridades A.I., cuando se aplican filtros de estado o prioridad Alto, Moderado o Bajo, entonces la lista debe actualizarse dentro del ámbito autorizado sin exponer información interna.
- **CA-04 — Mostrar conteo**: Dado que se aplica búsqueda o filtros, cuando cambian los registros, entonces debe mostrarse la cantidad visible.
- **CA-05 — Información permitida**: Dado que se muestra un caso, cuando el usuario lo consulta, entonces únicamente debe visualizar:
- **CA-06 — Mostrar y filtrar prioridad A.I.**: Dado que el usuario es profesional, ASC2 o ASC3 autorizado de Establecimiento, cuando consulta la lista, entonces debe visualizar la prioridad A.I. y poder filtrar por ella sin acceder a nivel de riesgo, nivel de protección ni valoración interna.
- **CA-07 — Impedir acceso al expediente interno**: Dado que el usuario posee acceso de Establecimiento, cuando consulta un caso, entonces no debe acceder a valoración, plan, línea de tiempo interna, estrategias, disciplinas, frecuencia, atenciones detalladas, documentos, coordinaciones, traslados, reportes internos o cierre operativo.
- **CA-08 — Múltiples establecimientos autorizados**: Dado que existen varios establecimientos autorizados, cuando se consulta la lista, entonces debe habilitarse un filtro limitado a ellos.
- **CA-09 — Único establecimiento autorizado**: Dado que existe un único establecimiento autorizado, cuando se consulta la lista, entonces debe aplicarse automáticamente.
- **CA-10 — Sin coincidencias**: Dado que no existen casos coincidentes, cuando finaliza la consulta, entonces debe informarse sin ampliar el ámbito.
- **CA-11 — No permitir exportación**: Dado que se utiliza la Lista de A.I. desde Establecimiento, cuando se consulta, entonces no debe habilitarse exportación de dicha lista.

### HU-024 — Consultar, buscar y filtrar los casos de la Oficina Local

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Buscar persona**: Dado que se necesita localizar un caso, cuando se busca por identificación o nombre, entonces deben mostrarse coincidencias de la Oficina Local.
- **CA-02 — Filtrar por establecimiento**: Dado que existen múltiples establecimientos, cuando se selecciona uno, entonces deben mostrarse únicamente sus casos.
- **CA-03 — Filtrar por estado**: Dado que existen distintos estados, cuando se selecciona uno, entonces el listado debe actualizarse.
- **CA-04 — Filtrar por prioridad**: Dado que los casos poseen prioridad `Alto`, `Moderado` o `Bajo`, cuando se selecciona una, entonces deben mostrarse los casos correspondientes.
- **CA-05 — Combinar filtros**: Dado que se aplican varios criterios, cuando se combinan, entonces todos deben aplicarse simultáneamente.
- **CA-06 — Mostrar cantidad**: Dado que existen filtros activos, cuando se actualizan los resultados, entonces debe mostrarse la cantidad coincidente.
- **CA-07 — Exportar**: Dado que existe un listado filtrado, cuando se exporta, entonces debe respetar el mismo corte.
- **CA-08 — Exportación estructurada**: Dado que se genera una salida tabular, cuando se abre externamente, entonces debe utilizar encabezados y columnas diferenciadas para los atributos principales.

### HU-025 — Consultar el detalle integral de un caso A.I.

**Estado en v0.7:** CONFIRMADO / ACTUALIZADO POST VALIDACIÓN

- **CA-01 — Encabezado del caso**: Dado que se abre un caso, cuando carga su detalle, entonces debe visualizar persona, identificación, establecimiento, identificador técnico, consecutivo de la referencia de origen, apertura, estado y prioridad.
- **CA-02 — Contexto de ingreso**: Dado que el caso se originó desde una referencia, cuando se consulta su resumen, entonces debe poder mostrarse el contexto histórico preservado de ingreso, incluyendo cuando corresponda persona encargada, relación, contacto y establecimiento de origen.
- **CA-03 — Riesgo, protección y prioridad vigentes**: Dado que el caso dispone de una valoración inicial y puede tener revaloraciones, cuando se consulta el resumen, entonces se muestran los niveles profesionales y la prioridad calculada vigentes, manteniendo consultables las valoraciones y prioridades anteriores según permisos.
- **CA-04 — Resumen**: Dado que existe información vigente, cuando se consulta Resumen, entonces debe derivarse de los registros existentes sin exigir redigitación.
- **CA-05 — Línea de tiempo**: Dado que existen eventos, cuando se consulta el historial, entonces deben visualizarse cronológicamente admisiones, atenciones, actividades grupales, coordinaciones, traslados, reportes, cierre y demás eventos aplicables.
- **CA-06 — Plan de atención**: Dado que existe un plan vigente, cuando se consulta, entonces deben mostrarse propósitos, estrategias, disciplinas y frecuencia.
- **CA-07 — Preservar contexto histórico**: Dado que posteriormente cambien datos maestros del cliente/beneficiaria, cuando se consulta un caso histórico, entonces el contexto preservado de su referencia de origen no debe modificarse retroactivamente.
- **CA-08 — Mostrar última atención**: Dado que se consulta el detalle autorizado, cuando existen atenciones registradas, entonces debe mostrarse la fecha de la última; si nunca existen, debe indicarse Sin atención registrada.
- **CA-09 — Consultar evolución de valoraciones**: Dado que existen revaloraciones posteriores a la apertura, cuando se consulta el detalle autorizado, entonces se muestran la valoración y prioridad vigentes junto con las valoraciones y prioridades históricas, fechas, sesiones y responsables; el cambio no crea otro caso ni sobrescribe registros anteriores.
- **CA-10 — Conservar historial tras traslado**: Dado que el caso se cerró por Traslado, cuando se consulta el historial según permisos, entonces se conserva la trayectoria anterior sin ingreso pendiente ni confirmación de continuidad o vinculación obligatoria a un caso de destino.

### HU-026 — Gestionar documentos asociados a un caso

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Consultar documentos**: Dado que existen documentos, cuando se accede a la sección, entonces deben mostrarse sus metadatos principales.
- **CA-02 — Cargar documento**: Dado que se requiere incorporar un archivo, cuando se selecciona, entonces debe poder asociarse al caso.
- **CA-03 — Registrar metadatos**: Dado que se incorpora un documento, cuando se guarda, entonces debe conservar tipo, fecha, responsable y demás metadatos requeridos.
- **CA-04 — Mantener vinculación**: Dado que el documento fue registrado, cuando se consulta posteriormente, entonces debe mantenerse vinculado al caso correspondiente.

### HU-027 — Registrar una coordinación interinstitucional

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Institución destino**: Dado que se registra una coordinación, cuando se completa, entonces debe poder indicarse la institución correspondiente.
- **CA-02 — Responsable**: Dado que quien digita puede ser diferente de quien realizó la coordinación, cuando corresponde, entonces debe poder indicarse la persona profesional responsable.
- **CA-03 — Motivo y estado**: Dado que la coordinación requiere seguimiento, cuando se registra, entonces deben conservarse motivo, fecha y estado.
- **CA-04 — Relación con el caso**: Dado que la coordinación forma parte del abordaje, cuando se guarda, entonces debe quedar vinculada al caso.

### HU-028 — Registrar el traslado de un caso hacia otra Oficina Local

**Estado en v0.7:** CONFIRMADO / ACTUALIZADO — VALIDACIÓN CON ALINA 02-11-2026

- **CA-01 — Cambio de establecimiento**: Dado que una persona con caso A.I. activo cambia de establecimiento, cuando se registra el traslado, entonces se documenta el cambio con los datos institucionales de destino disponibles, sin crear ingreso pendiente ni caso de destino.
- **CA-02 — Fecha y motivo**: Dado que el traslado debe quedar documentado, cuando se confirma, entonces deben registrarse fecha y motivo.
- **CA-03 — Cierre por traslado**: Dado que la OL de origen deja de ser responsable, cuando confirma el traslado, entonces su caso debe cerrarse por traslado.
- **CA-04 — Conservar historial**: Dado que la necesidad puede continuar, cuando se traslada el caso, entonces no debe perderse el historial previo.
- **CA-05 — Conservar trazabilidad de origen**: Dado que el caso deriva de una referencia y trayectoria previa, cuando se traslada, entonces deben preservarse sus relaciones históricas y el consecutivo de referencia de origen.
- **CA-06 — Nueva referencia independiente en destino**: Dado que el caso de origen fue cerrado por Traslado, cuando la persona aparece asociada al nuevo establecimiento en CAH/SIDINACC, entonces el personal autorizado puede crear una referencia completamente nueva con consecutivo propio; si requiere A.I., se abre un caso por el procedimiento normal, sin continuidad automática ni vinculación obligatoria con el anterior.

### HU-030 — Generar un reporte de un caso sin cerrarlo

**Estado en v0.7:** CONFIRMADO / DISEÑO DE SALIDAS A REFINAR

- **CA-01 — Caso activo**: Dado que un caso continúa activo, cuando se genera un reporte, entonces su estado no debe cambiar.
- **CA-02 — Seleccionar tipo o propósito**: Dado que pueden existir diferentes necesidades, cuando se genera un reporte, entonces debe poder indicarse su tipo o propósito.
- **CA-03 — Reutilizar historial**: Dado que el sistema ya posee información del caso, cuando se prepara el reporte, entonces debe reutilizarse para reducir redigitación.
- **CA-04 — Generar durante cualquier etapa**: Dado que el caso todavía no ha sido cerrado, cuando existe una necesidad de reporte, entonces debe poder generarse con la información disponible hasta ese momento.
- **CA-05 — Presentación estructurada**: Dado que se genera un documento para consulta o impresión, cuando se presenta, entonces debe organizar la información mediante secciones comprensibles e incluir los identificadores, fecha y contexto necesarios.
- **CA-06 — Aplicar plantilla institucional**: Dado que posteriormente se defina una plantilla institucional autorizada, cuando se genere el reporte, entonces deberá incorporar sus elementos gráficos y documentales correspondientes.
- **CA-07 — Conservar historial de reportes**: Dado que un reporte fue generado, cuando se consulta posteriormente el caso, entonces debe existir trazabilidad de fecha, tipo, responsable y propósito o motivo.

### HU-031 — Cerrar un caso de Atención Interdisciplinaria

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Seleccionar motivo estructurado**: Dado que se decide cerrar un caso, cuando se registra el motivo, entonces se selecciona Cierre satisfactorio (objetivos de Atención Interdisciplinaria alcanzados), Traslado u Otro; Otro exige explicación textual.
- **CA-02 — Registrar fecha**: Dado que el cierre forma parte del historial, cuando se ejecuta, entonces debe conservarse la fecha.
- **CA-03 — Cambiar estado**: Dado que el cierre fue confirmado, cuando finaliza la operación, entonces el caso debe quedar Cerrado.
- **CA-04 — Registrar evento y responsable**: Dado que el caso fue cerrado, cuando se consulta su línea de tiempo, entonces se conservan fecha, responsable, motivo estructurado, explicación de Otro cuando aplique y evento de cierre.
- **CA-05 — No confundir con reporte**: Dado que Reporte y Cierre son acciones independientes, cuando se cierra un caso, entonces no debe asumirse que generar un reporte sea requisito para hacerlo salvo decisión institucional posterior.
- **CA-06 — Distinguir motivos y conservar su interpretación**: Dado que se cierra por Traslado u Otro, cuando se conserva el motivo, entonces no se clasifica automáticamente como Cierre satisfactorio; el catálogo se mantiene configurable y versionable cuando corresponda para reportería posterior y se conserva el texto de Otro para eventual análisis de palabras frecuentes, según las visualizaciones 9 y 10 de 15.3 / RF-128.

### HU-032 — Consultar y filtrar casos A.I. de la Región

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir casos a la Región**: Dado que el usuario pertenece a una Región, cuando abre Casos de A.I., entonces solo debe visualizar casos de ese ámbito.
- **CA-02 — Buscar por identificación o nombre**: Dado que se desea localizar un caso, cuando se busca por identificación o nombre, entonces deben mostrarse las coincidencias correspondientes.
- **CA-03 — Filtrar por Oficina Local**: Dado que existen múltiples Oficinas Locales, cuando se selecciona una, entonces deben mostrarse únicamente sus casos.
- **CA-04 — Filtrar por establecimiento**: Dado que existen varios establecimientos, cuando se selecciona uno, entonces deben mostrarse únicamente sus casos.
- **CA-05 — Filtrar por estado**: Dado que existen distintos estados, cuando se selecciona uno, entonces el listado debe actualizarse.
- **CA-06 — Filtrar por prioridad**: Dado que la prioridad A.I. utiliza `Alto`, `Moderado` y `Bajo`, cuando se selecciona una, entonces deben mostrarse únicamente los casos correspondientes.
- **CA-07 — Combinar filtros**: Dado que se aplican varios criterios, cuando se combinan, entonces todos deben aplicarse simultáneamente.
- **CA-08 — Mostrar conteo**: Dado que existen filtros, cuando cambian los resultados, entonces debe mostrarse la cantidad correspondiente.
- **CA-09 — Exportar resultados**: Dado que existe un listado filtrado, cuando se exporta, entonces debe respetar los filtros y ámbito regional.
- **CA-10 — Estructurar exportación**: Dado que se genera la exportación, cuando se abre externamente, entonces debe contener encabezados y columnas diferenciadas.

### HU-033 — Consultar el detalle de un caso A.I. desde Nivel Regional

**Estado en v0.7:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

- **CA-01 — Información general**: Dado que se abre un caso permitido, cuando carga su detalle, entonces debe mostrar identificación general, establecimiento, identificador/consecutivo aplicable, fecha de apertura, estado y prioridad cuando el permiso lo permita.
- **CA-02 — Consultar resumen**: Dado que existe información vigente, cuando se consulta Resumen, entonces debe mostrarse únicamente la información autorizada.
- **CA-03 — Consultar línea de tiempo**: Dado que existen eventos, cuando se consulta la línea de tiempo, entonces deben mostrarse los permitidos en orden cronológico.
- **CA-04 — Consultar plan**: Dado que existe un plan vigente, cuando se consulta, entonces deben mostrarse estrategias, disciplinas y frecuencia permitidas.
- **CA-05 — Prohibir edición**: Dado que el usuario pertenece al Nivel Regional, cuando consulta un caso, entonces no debe modificar información operativa.
- **CA-06 — No ejecutar acciones propias de Oficina Local**: Dado que registrar atenciones, trasladar, cerrar o modificar el caso corresponde a Oficina Local, cuando Regional consulta el expediente, entonces dichas acciones no deben estar habilitadas.

### HU-034 — Consultar y filtrar casos de Atención Interdisciplinaria a nivel nacional

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Consultar casos nacionales**: Dado que no existen filtros territoriales, cuando se abre Casos de A.I., entonces debe mostrarse el universo nacional permitido.
- **CA-02 — Buscar por identificación o nombre**: Dado que se necesita localizar un caso, cuando se busca por identificación o nombre, entonces deben mostrarse las coincidencias correspondientes.
- **CA-03 — Filtrar por Región**: Dado que se selecciona una Región, cuando se aplica el filtro, entonces deben mostrarse únicamente sus casos.
- **CA-04 — Filtrar por Oficina Local**: Dado que se selecciona una Oficina Local, cuando se aplica, entonces deben mostrarse únicamente sus casos.
- **CA-05 — Filtrar por establecimiento**: Dado que se selecciona un establecimiento, cuando se aplica, entonces deben mostrarse únicamente sus casos.
- **CA-06 — Filtrar por estado**: Dado que existen diferentes estados, cuando se selecciona uno, entonces el listado debe actualizarse.
- **CA-07 — Filtrar por prioridad**: Dado que las prioridades A.I. son `Alto`, `Moderado` y `Bajo`, cuando se selecciona una, entonces deben mostrarse los casos correspondientes.
- **CA-08 — Aplicar filtros jerárquicos**: Dado que los filtros territoriales dependen entre sí, cuando cambia un nivel superior, entonces los niveles inferiores incompatibles deben limpiarse o actualizarse.
- **CA-09 — Combinar filtros**: Dado que existen múltiples criterios, cuando se aplican simultáneamente, entonces todos deben respetarse.
- **CA-10 — Mostrar conteo**: Dado que existen filtros activos, cuando cambian los resultados, entonces debe mostrarse su cantidad.
- **CA-11 — Exportar resultados**: Dado que existe un conjunto filtrado, cuando se exporta, entonces debe respetar búsqueda, filtros y permisos.
- **CA-12 — Estructurar exportación**: Dado que se genera la salida, cuando se abre externamente, entonces debe utilizar encabezados y columnas diferenciadas.

### HU-035 — Consultar el detalle de un caso A.I. desde Nivel Nacional

**Estado en v0.7:** CONFIRMADO / PERMISOS SENSIBLES A REFINAR

- **CA-01 — Información general**: Dado que se abre un caso permitido, cuando carga su detalle, entonces debe mostrarse la información general autorizada.
- **CA-02 — Consultar resumen**: Dado que existe información vigente, cuando se consulta Resumen, entonces deben mostrarse únicamente los datos permitidos.
- **CA-03 — Consultar línea de tiempo**: Dado que existen eventos, cuando se consulta la línea de tiempo, entonces deben mostrarse cronológicamente los autorizados.
- **CA-04 — Consultar plan**: Dado que existe un plan vigente, cuando se consulta, entonces deben mostrarse las estrategias, disciplinas y frecuencia permitidas.
- **CA-05 — Solo lectura**: Dado que la gestión directa corresponde a Oficina Local, cuando Nacional consulta un caso, entonces no debe poder modificarlo.
- **CA-06 — No ejecutar funciones operativas**: Dado que las funciones operativas corresponden a otros niveles, cuando Nacional consulta el expediente, entonces dichas acciones no deben estar habilitadas.

### HU-048 — Identificar casos activos sin atención en un período

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Seleccionar período o año**: Dado que se requiere revisar seguimiento, cuando se selecciona un intervalo o año, entonces el sistema debe evaluar las atenciones registradas en ese período.
- **CA-02 — Restringir a casos activos del ámbito**: Dado que el equipo pertenece a una Oficina Local, cuando consulta, entonces solo deben mostrarse casos activos de su ámbito sin atenciones en el período.
- **CA-03 — Independencia de la programación**: Dado que un caso no tiene actividades programadas, cuando tampoco tiene atenciones registradas en el período, entonces debe identificarse igualmente como Sin atención en el período.
- **CA-04 — Mostrar última atención**: Dado que existen atenciones previas del caso, cuando se presenta el resultado, entonces debe mostrarse la fecha de la última atención registrada.
- **CA-05 — Distinguir ausencia histórica**: Dado que nunca se registró una atención del caso, cuando se presenta, entonces debe indicarse Sin atención registrada, diferenciándolo de un caso atendido fuera del período.
- **CA-06 — Utilizar atenciones efectivas**: Dado que hay programación o convocatorias grupales, cuando se determina atención en el período, entonces solo deben considerarse atenciones registradas y participación con asistencia, sin tomar la programación o convocatoria como atención.
- **CA-07 — Localizar el caso**: Dado que un caso aparece en el resultado, cuando se selecciona, entonces debe poder localizarse y consultarse conforme a los permisos operativos vigentes.
- **CA-08 — Trazabilidad funcional**: Dado que esta capacidad se utiliza operativa o analíticamente, cuando se aplica, entonces debe mantener RF-125 y RF-126 y el flujo CU-36; Regional/Nacional solo accederán al análisis permitido.

### HU-036 — Registrar una atención individual

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Buscar caso activo**: Dado que se desea registrar una atención, cuando se busca por identificación o nombre, entonces solo deben seleccionarse casos activos del ámbito.
- **CA-02 — Registrar fecha real**: Dado que la fecha de atención puede diferir de la fecha de digitación, cuando se registra, entonces ambas deben poder diferenciarse.
- **CA-03 — Registrar disciplina y estrategia**: Dado que la atención pertenece a una disciplina y estrategia, cuando se captura, entonces deben registrarse esos datos utilizando los catálogos vigentes.
- **CA-04 — No utilizar disciplina genérica**: Dado que existe un catálogo definido de disciplinas, cuando se registra la atención, entonces no debe existir una disciplina genérica `Otra` salvo cambio institucional posterior.
- **CA-05 — Registrar acciones y recomendaciones**: Dado que la atención produjo acciones o indicaciones, cuando se registra, entonces deben poder documentarse.
- **CA-06 — Registrar próxima acción**: Dado que se requiere continuidad, cuando se define una próxima acción, entonces debe almacenarse junto con su fecha cuando corresponda.
- **CA-07 — Incorporar al historial**: Dado que la atención fue guardada, cuando se consulta el caso, entonces debe aparecer en su línea de tiempo.

### HU-037 — Registrar una atención grupal para múltiples participantes

**Estado en v0.7:** CONFIRMADO / CLASIFICACIÓN DE ACTIVIDADES PENDIENTE DE REFINAMIENTO

- **CA-01 — Registrar información común**: Dado que se realiza una atención grupal, cuando se crea, entonces deben registrarse fecha, tipo de actividad, tema u objetivo, lugar, disciplinas, profesionales, acciones y recomendaciones generales.
- **CA-02 — Diferenciar objetivos institucionales**: Dado que la atención grupal A.I. y las sesiones educativas generales corresponden a objetivos que requieren delimitación institucional, cuando se registra una actividad, entonces no deben incorporarse automáticamente sesiones educativas generales como atenciones A.I. ni imponerse una clasificación definitiva aún no validada.
- **CA-03 — Buscar participantes**: Dado que deben incorporarse participantes, cuando se agregan, entonces deben buscarse por identificación o nombre y no mediante una lista masiva.
- **CA-04 — Múltiples participantes**: Dado que una actividad puede involucrar varias personas, cuando se registran participantes, entonces debe permitirse asociar múltiples clientes/beneficiarias.
- **CA-05 — Evitar duplicados**: Dado que una persona ya está incluida, cuando vuelve a seleccionarse, entonces no debe agregarse por segunda vez.
- **CA-06 — Registrar asistencia**: Dado que no todas las personas convocadas necesariamente asisten, cuando se completa la atención, entonces debe poder registrarse su asistencia individual.
- **CA-07 — Registro único**: Dado que la actividad grupal es una sola, cuando se guarda, entonces debe conservarse un único registro base.
- **CA-08 — Historial individual**: Dado que un participante posee un caso A.I. activo, cuando se guarda la actividad, entonces su participación debe aparecer en su historial individual sin duplicar físicamente la atención.
- **CA-09 — Participación sin caso activo**: Dado que se permita registrar una persona sin caso A.I. activo dentro de una actividad cuya definición funcional así lo admita, cuando se guarda, entonces su participación podrá conservarse en el registro grupal sin generar una línea de tiempo de A.I. inexistente.

### HU-038 — Consultar reportería analítica de la Oficina Local

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Filtrar por año/período**: Dado que se requiere un corte temporal, cuando se selecciona, entonces deben actualizarse las métricas aplicables.
- **CA-02 — Filtrar por establecimiento**: Dado que existen múltiples establecimientos, cuando se selecciona uno, entonces las métricas deben limitarse a ese ámbito.
- **CA-03 — Filtrar por estado y prioridad**: Dado que se requiere analizar subconjuntos, cuando se aplican estado o prioridad, entonces deben actualizarse los indicadores relacionados.
- **CA-04 — Utilizar prioridades vigentes**: Dado que se analiza la prioridad A.I., cuando se muestran filtros o distribuciones, entonces deben utilizarse únicamente `Alto`, `Moderado` y `Bajo`.
- **CA-05 — Filtrar por disciplina/profesional**: Dado que se analiza actividad profesional, cuando se selecciona una disciplina o profesional, entonces deben actualizarse las métricas relacionadas con atenciones.
- **CA-06 — Casos por estado**: Dado que existen casos en distintos estados, cuando se consulta reportería, entonces debe visualizarse su distribución.
- **CA-07 — Casos por prioridad**: Dado que existen diferentes prioridades, cuando se consulta reportería, entonces debe mostrarse su distribución.
- **CA-08 — Personas únicas atendidas**: Dado que una persona puede recibir múltiples atenciones, cuando se calcula esta métrica, entonces debe contabilizarse una sola vez dentro del corte.
- **CA-09 — Total de atenciones**: Dado que una persona puede recibir múltiples atenciones, cuando se calcula la actividad, entonces cada atención debe contabilizarse.
- **CA-10 — Diferenciar métricas**: Dado que personas atendidas y atenciones realizadas son conceptos distintos, cuando se presentan, entonces deben mostrarse separadamente.
- **CA-11 — Referencias a Atención Interdisciplinaria por resultado**: Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.
- **CA-12 — Casos por establecimiento, sexo y edad actual**: Dado que se consulta el ámbito autorizado, cuando se distribuyen casos por establecimiento, sexo o edad actual, entonces se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.
- **CA-13 — Atenciones REALIZADAS por tipo vigente**: Dado que existen atenciones efectivas, cuando se muestra su distribución por tipo vigente, entonces se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.
- **CA-14 — Motivos de referencia no excluyentes**: Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.
- **CA-15 — Motivos de cancelación — tabla Top-N**: Dado que se conservan actividades Canceladas y sus motivos, cuando se analizan los principales motivos del período autorizado, entonces se muestran en una tabla Top-N.
- **CA-16 — Casos sin atención en el período**: Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.
- **CA-17 — Métricas grupales y límites de integración**: Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.
- **CA-18 — Catálogo principal de doce visualizaciones**: Dado que el usuario posee autorización de Reportería en su ámbito, cuando explora la información, entonces consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.
- **CA-19 — KPI de cobertura sobre casos activos actuales**: Dado que se selecciona un año y ámbito permitido, cuando se consultan los KPI 11 y 12, entonces se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el fil […]
- **CA-20 — Filtros visibles, pertinentes y títulos dinámicos**: Dado que se aplica un filtro autorizado, cuando se actualiza la consulta, entonces se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.
- **CA-21 — Iniciar informe independiente de la exploración**: Dado que el usuario consulta Reportería, cuando selecciona el botón superior visible Generar reporte, entonces se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

### HU-039 — Generar y descargar una consolidación según filtros

**Estado en v0.7:** CONFIRMADO / PROPUESTA DE DISEÑO

- **CA-01 — Respetar filtros**: Dado que se aplicaron filtros, cuando se genera la consolidación, entonces debe corresponder exactamente al corte definido.
- **CA-02 — Determinar ámbito**: Dado que no se seleccionó un establecimiento, cuando se genera el consolidado, entonces debe representar la Oficina Local.
- **CA-03 — Consolidado por establecimiento**: Dado que se seleccionó un establecimiento, cuando se genera, entonces debe representar ese establecimiento.
- **CA-04 — Mostrar métricas principales**: Dado que se genera una consolidación, cuando se presenta, entonces debe incluir las métricas definidas para el corte.
- **CA-05 — Utilizar prioridad vigente**: Dado que se incluye distribución por prioridad, cuando se genera, entonces debe utilizar Alto, Moderado y Bajo.
- **CA-06 — Descargar**: Dado que se necesita utilizar la información externamente, cuando se descarga, entonces debe generarse un archivo compatible con herramientas ofimáticas.
- **CA-07 — Salida estructurada**: Dado que la consolidación se descarga como tabla, cuando se abre externamente, entonces debe contener encabezados claros y atributos distribuidos en columnas independientes.
- **CA-08 — Conservar definiciones analíticas**: Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.
- **CA-09 — Conservar catálogo y definición de cobertura**: Dado que se obtiene una consolidación, cuando incluye métricas del catálogo principal, entonces conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.
- **CA-10 — Distinguir consolidación e informe analítico**: Dado que se necesita un documento con interpretación humana por visualización, cuando se inicia Generar reporte, entonces se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

### HU-040 — Consultar reportería analítica de la Región

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Ámbito regional implícito**: Dado que el usuario pertenece a una Región, cuando abre Reportería, entonces esta debe utilizarse como límite superior.
- **CA-02 — Filtrar por período**: Dado que se selecciona un período, cuando se aplica, entonces deben actualizarse las métricas correspondientes.
- **CA-03 — Filtrar por Oficina Local**: Dado que se selecciona una Oficina Local, cuando se aplica, entonces las métricas deben limitarse a ella.
- **CA-04 — Filtrar por establecimiento**: Dado que se selecciona un establecimiento, cuando se aplica, entonces la reportería debe limitarse a ese ámbito.
- **CA-05 — Filtrar por estado y prioridad**: Dado que se necesita analizar un subconjunto de casos, cuando se aplican dichos filtros, entonces deben actualizarse sus indicadores.
- **CA-06 — Utilizar prioridad vigente**: Dado que se utiliza el criterio de prioridad, cuando se filtra o visualiza, entonces únicamente deben utilizarse Alto, Moderado y Bajo.
- **CA-07 — Filtrar por disciplina y profesional**: Dado que se analiza la actividad de atención, cuando se selecciona una disciplina o profesional, entonces deben ajustarse las métricas aplicables.
- **CA-08 — Consultar casos y referencias a Atención Interdisciplinaria**: Dado que existe un corte seleccionado, cuando se consulta la reportería, entonces deben mostrarse las cantidades correspondientes de casos y referencias a Atención Interdisciplinaria.
- **CA-09 — Consultar personas únicas atendidas**: Dado que una misma persona puede recibir varias atenciones, cuando se calcula el indicador, entonces debe contabilizarse una sola vez.
- **CA-10 — Consultar total de atenciones**: Dado que existen múltiples atenciones, cuando se calcula el indicador, entonces cada atención registrada debe contabilizarse.
- **CA-11 — Diferenciar personas y atenciones**: Dado que ambas métricas son distintas, cuando se presentan, entonces deben mostrarse separadamente.
- **CA-12 — Visualizar casos por prioridad**: Dado que existen diferentes prioridades, cuando se consulta la reportería, entonces debe mostrarse su distribución.
- **CA-13 — Visualizar casos por estado**: Dado que existen diferentes estados, cuando se consulta la reportería, entonces debe mostrarse su distribución.
- **CA-14 — Comparar actividad por disciplina**: Dado que distintas disciplinas realizan atenciones, cuando se consulta dicha visualización, entonces debe permitir comparar personas únicas y total de atenciones.
- **CA-15 — Mantener consistencia de filtros**: Dado que determinados filtros solo afectan ciertas métricas, cuando se aplican, entonces debe indicarse claramente su alcance.
- **CA-16 — Referencias a Atención Interdisciplinaria por resultado**: Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.
- **CA-17 — Casos por establecimiento, sexo y edad actual**: Dado que se consulta el ámbito autorizado, cuando se distribuyen casos por establecimiento, sexo o edad actual, entonces se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.
- **CA-18 — Atenciones REALIZADAS por tipo vigente**: Dado que existen atenciones efectivas, cuando se muestra su distribución por tipo vigente, entonces se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.
- **CA-19 — Motivos de referencia no excluyentes**: Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.
- **CA-20 — Motivos de cancelación — tabla Top-N**: Dado que se conservan actividades Canceladas y sus motivos, cuando se analizan los principales motivos del período autorizado, entonces se muestran en una tabla Top-N.
- **CA-21 — Casos sin atención en el período**: Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.
- **CA-22 — Métricas grupales y límites de integración**: Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.
- **CA-23 — Catálogo principal de doce visualizaciones**: Dado que el usuario posee autorización de Reportería en su ámbito, cuando explora la información, entonces consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.
- **CA-24 — KPI de cobertura sobre casos activos actuales**: Dado que se selecciona un año y ámbito permitido, cuando se consultan los KPI 11 y 12, entonces se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el fil […]
- **CA-25 — Filtros visibles, pertinentes y títulos dinámicos**: Dado que se aplica un filtro autorizado, cuando se actualiza la consulta, entonces se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.
- **CA-26 — Iniciar informe independiente de la exploración**: Dado que el usuario consulta Reportería, cuando selecciona el botón superior visible Generar reporte, entonces se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

### HU-041 — Generar y descargar consolidaciones dinámicas del ámbito regional

**Estado en v0.7:** CONFIRMADO / PROPUESTA DE DISEÑO

- **CA-01 — Consolidado regional**: Dado que no existe un filtro territorial inferior, cuando se genera, entonces debe representar toda la Región.
- **CA-02 — Consolidado por Oficina Local**: Dado que se seleccionó una OL, cuando se genera, entonces debe representar únicamente esa unidad.
- **CA-03 — Consolidado por establecimiento**: Dado que se seleccionó un establecimiento, cuando se genera, entonces debe representar ese ámbito.
- **CA-04 — Respetar corte temporal**: Dado que se seleccionó un período, cuando se genera, entonces los datos deben corresponder al corte.
- **CA-05 — Respetar filtros funcionales**: Dado que existen filtros aplicables, cuando se genera, entonces deben respetarse.
- **CA-06 — Mostrar métricas principales**: Dado que se genera el consolidado, cuando se presenta, entonces debe incluir los indicadores principales definidos.
- **CA-07 — Descargar consolidado**: Dado que se necesita utilizar la información externamente, cuando se descarga, entonces debe generarse una salida compatible con herramientas ofimáticas.
- **CA-08 — Salida estructurada**: Dado que el archivo es tabular, cuando se abre, entonces debe contener encabezados y columnas diferenciadas.
- **CA-09 — Sin flujo de remisión**: Dado que Regional posee acceso autorizado a la información, cuando necesita una consolidación, entonces no debe requerirse que Oficina Local prepare y remita manualmente el mismo conjunto de datos.
- **CA-10 — Conservar definiciones analíticas**: Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.
- **CA-11 — Conservar catálogo y definición de cobertura**: Dado que se obtiene una consolidación, cuando incluye métricas del catálogo principal, entonces conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.
- **CA-12 — Distinguir consolidación e informe analítico**: Dado que se necesita un documento con interpretación humana por visualización, cuando se inicia Generar reporte, entonces se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

### HU-042 — Consultar reportería analítica nacional con desagregación jerárquica

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Consultar el país completo**: Dado que no existen filtros territoriales, cuando se abre Reportería, entonces debe representar el ámbito nacional permitido.
- **CA-02 — Filtrar por período**: Dado que se selecciona un período, cuando se aplica, entonces deben actualizarse los indicadores.
- **CA-03 — Filtrar por Región**: Dado que se selecciona una Región, cuando se aplica, entonces debe limitarse la reportería.
- **CA-04 — Filtrar por Oficina Local**: Dado que se selecciona una OL, cuando se aplica, entonces deben limitarse los indicadores.
- **CA-05 — Filtrar por establecimiento**: Dado que se selecciona un establecimiento, cuando se aplica, entonces debe limitarse el ámbito.
- **CA-06 — Mantener filtros jerárquicos**: Dado que los filtros están relacionados, cuando cambia un nivel superior, entonces los inferiores incompatibles deben limpiarse o actualizarse.
- **CA-07 — Filtrar casos por estado**: Dado que existen diferentes estados, cuando se selecciona uno, entonces deben actualizarse los indicadores relacionados.
- **CA-08 — Filtrar casos por prioridad**: Dado que existen prioridades Alto, Moderado y Bajo, cuando se selecciona una, entonces deben actualizarse los indicadores correspondientes.
- **CA-09 — Filtrar actividad por disciplina**: Dado que se desea analizar una disciplina, cuando se selecciona, entonces deben actualizarse las métricas relacionadas.
- **CA-10 — Filtrar actividad por profesional**: Dado que se desea analizar la actividad de una persona profesional, cuando se selecciona, entonces deben actualizarse las métricas aplicables.
- **CA-11 — Consultar cantidad de casos**: Dado que existe un corte seleccionado, cuando se consulta, entonces debe mostrarse la cantidad de casos.
- **CA-12 — Consultar referencias a Atención Interdisciplinaria**: Dado que existen referencias a Atención Interdisciplinaria dentro del corte, cuando se consulta, entonces debe mostrarse su cantidad.
- **CA-13 — Consultar personas únicas atendidas**: Dado que una persona puede recibir múltiples atenciones, cuando se calcula, entonces debe contabilizarse una sola vez.
- **CA-14 — Consultar total de atenciones**: Dado que existen múltiples atenciones, cuando se calcula, entonces cada una debe contabilizarse.
- **CA-15 — Diferenciar indicadores**: Dado que personas atendidas y atenciones realizadas representan conceptos distintos, cuando se presentan, entonces deben mostrarse separadamente.
- **CA-16 — Visualizar casos por prioridad**: Dado que los casos poseen diferentes prioridades, cuando se consulta, entonces debe mostrarse su distribución.
- **CA-17 — Visualizar casos por estado**: Dado que los casos poseen diferentes estados, cuando se consulta, entonces debe mostrarse su distribución.
- **CA-18 — Comparar actividad por disciplina**: Dado que distintas disciplinas realizan atenciones, cuando se consulta la visualización correspondiente, entonces debe poder compararse personas únicas y total de atenciones.
- **CA-19 — Claridad semántica de filtros**: Dado que algunos filtros afectan únicamente determinadas métricas, cuando se utilizan, entonces debe quedar claro qué indicadores se encuentran afectados.
- **CA-20 — Referencias a Atención Interdisciplinaria por resultado**: Dado que se selecciona un período, cuando se analizan referencias a Atención Interdisciplinaria, entonces deben distinguirse registradas/enviadas, analizadas, admitidas y No requiere A.I., identificando el evento y fecha aplicados al corte; una analizada puede terminar admitida o No requiere A.I.
- **CA-21 — Casos por establecimiento, sexo y edad actual**: Dado que se consulta el ámbito autorizado, cuando se distribuyen casos por establecimiento, sexo o edad actual, entonces se aplican los formatos de 15.3 y el filtro general Activo/Cerrado/Todos cuando corresponda; las agrupaciones por edad son analíticas adecuadas, sin inventar grupos etarios institucionales.
- **CA-22 — Atenciones REALIZADAS por tipo vigente**: Dado que existen atenciones efectivas, cuando se muestra su distribución por tipo vigente, entonces se usa fecha real de atención, se excluyen actividades simplemente programadas, reprogramadas o canceladas y se mantienen catálogos validados y personas únicas diferenciadas del total de atenciones.
- **CA-23 — Motivos de referencia no excluyentes**: Dado que una referencia puede contener varios motivos, cuando se consulta su frecuencia, entonces cada motivo debe contarse por aparición en referencias a A.I. y debe aclararse que sus conteos pueden superar el total de referencias y no constituyen una partición de este.
- **CA-24 — Motivos de cancelación — tabla Top-N**: Dado que se conservan actividades Canceladas y sus motivos, cuando se analizan los principales motivos del período autorizado, entonces se muestran en una tabla Top-N.
- **CA-25 — Casos sin atención en el período**: Dado que se selecciona período o año, cuando se consulta seguimiento, entonces deben identificarse casos activos sin atenciones registradas conforme a RF-125 y RF-126, independientemente de la programación y respetando permisos.
- **CA-26 — Métricas grupales y límites de integración**: Dado que una grupal tiene un registro base con asistencia, cuando se calculan personas atendidas, entonces se contará únicamente la participación efectiva sin multiplicar atenciones por asistentes; no se incorporarán indicadores propios de nutrición, EDIN II, EVADE o vigilancia como indicadores propios de SIA.
- **CA-27 — Catálogo principal de doce visualizaciones**: Dado que el usuario posee autorización de Reportería en su ámbito, cuando explora la información, entonces consulta el catálogo principal de exactamente doce visualizaciones y formatos de 15.3 / RF-128, incluidas las nubes de motivos de referencia y de palabras de Otro, el gráfico circular de motivos de cierre y los KPI de cobertura; se conservan capacidades complementarias válidas sin agregarlas al catálogo principal.
- **CA-28 — KPI de cobertura sobre casos activos actuales**: Dado que se selecciona un año y ámbito permitido, cuando se consultan los KPI 11 y 12, entonces se aplican N y D de 15.2 / RF-129 / RN-040: D personas únicas con caso activo actualmente; N personas del mismo D atendidas efectivamente en el año en su caso actual; porcentaje N/D × 100 y cantidad N, con fecha real, asistencia grupal, exclusión de casos anteriores cerrados y manejo Sin casos activos o No aplica para D cero; el fil […]
- **CA-29 — Filtros visibles, pertinentes y títulos dinámicos**: Dado que se aplica un filtro autorizado, cuando se actualiza la consulta, entonces se destacan y enumeran los filtros activos y se permite restablecerlos, se indica a qué visualizaciones afectan y se actualizan reactivamente títulos, gráficos y KPI conforme a 15.1 / RF-086/RF-091; títulos y filtros se conservan en los informes, sin aplicar filtros incompatibles.
- **CA-30 — Iniciar informe independiente de la exploración**: Dado que el usuario consulta Reportería, cuando selecciona el botón superior visible Generar reporte, entonces se inicia el asistente de HU-050 / CU-38, independiente de la exploración, la consolidación tabular y el reporte individual del caso HU-030 / CU-22.

### HU-043 — Generar y descargar consolidaciones dinámicas para cualquier ámbito institucional

**Estado en v0.7:** CONFIRMADO / PROPUESTA DE DISEÑO

- **CA-01 — Consolidado nacional**: Dado que no se aplicaron filtros territoriales inferiores, cuando se genera, entonces debe representar el ámbito nacional.
- **CA-02 — Consolidado Regional**: Dado que se seleccionó una Región, cuando se genera, entonces debe representar esa Región.
- **CA-03 — Consolidado de Oficina Local**: Dado que se seleccionó una OL, cuando se genera, entonces debe representar dicha unidad.
- **CA-04 — Consolidado de establecimiento**: Dado que se seleccionó un establecimiento, cuando se genera, entonces debe representar dicho establecimiento.
- **CA-05 — Respetar período**: Dado que se seleccionó un período, cuando se genera, entonces la información debe corresponder al corte.
- **CA-06 — Respetar filtros funcionales**: Dado que se aplicaron filtros válidos, cuando se genera, entonces las métricas correspondientes deben respetarlos.
- **CA-07 — Mostrar métricas principales**: Dado que se genera un consolidado, cuando se presenta, entonces debe incluir al menos los principales indicadores definidos, como casos, referencias a Atención Interdisciplinaria, personas únicas atendidas, total de atenciones y distribución por prioridad cuando corresponda.
- **CA-08 — Descargar**: Dado que se necesita utilizar la información externamente, cuando se selecciona descargar, entonces debe generarse una salida compatible.
- **CA-09 — Salida tabular estructurada**: Dado que la salida es tabular, cuando se abre externamente, entonces debe contener encabezados y columnas diferenciadas.
- **CA-10 — No requerir remisión entre niveles**: Dado que Nivel Nacional tiene acceso a la información, cuando necesita una consolidación, entonces debe poder generarla directamente.
- **CA-11 — Mantener trazabilidad del corte**: Dado que una consolidación depende de filtros, cuando se genera o descarga, entonces debe poder identificarse al menos su período y ámbito.
- **CA-12 — Conservar definiciones analíticas**: Dado que se genera una consolidación, cuando se incluyen los indicadores de RF-087 a RF-091 y RF-125, entonces deben conservarse sus definiciones, filtros y permisos: referencias a A.I. por análisis/resultado, casos activos por establecimiento/sexo/edad, personas únicas y atenciones por tipo/disciplina, motivos no excluyentes, cancelaciones y casos sin atención, sin duplicar indicadores de vigilancia.
- **CA-13 — Conservar catálogo y definición de cobertura**: Dado que se obtiene una consolidación, cuando incluye métricas del catálogo principal, entonces conserva las definiciones de las doce visualizaciones de 15.3 / RF-128 y de cobertura de RF-129 / RN-040, con títulos, filtros pertinentes, universo y corte; el estado general no cambia silenciosamente el universo de casos activos actuales de cobertura.
- **CA-14 — Distinguir consolidación e informe analítico**: Dado que se necesita un documento con interpretación humana por visualización, cuando se inicia Generar reporte, entonces se sigue HU-050 / CU-38; la descarga tabular de esta historia permanece válida y no fija el formato definitivo del informe analítico.

### HU-050 — Generar y descargar un informe analítico con análisis por visualización

**Estado en v0.7:** CONFIRMADO FUNCIONALMENTE — validación con Alina 02-11-2026; formato pendiente. Cobertura según definición operativa provisional de RN-040.

- **CA-01 — Seleccionar de cinco a doce visualizaciones**: Dado que el usuario posee autorización de Reportería, cuando pulsa el botón visible Generar reporte en la parte superior, entonces se abre un asistente guiado emergente, modal o equivalente, con «Seleccione al menos 5 visualizaciones de las siguientes para incluir en su reporte» y las doce opciones de 15.3; solo se seleccionan las autorizadas y realmente disponibles.
- **CA-02 — Bloquear selección insuficiente**: Dado que hay menos de cinco visualizaciones válidas seleccionadas, cuando se intenta Siguiente, entonces se bloquea el avance; se permiten de cinco a doce y una opción no disponible no cuenta ni amplía permisos; si hay menos de cinco disponibles se informa la limitación.
- **CA-03 — Mostrar una visualización por paso**: Dado que se seleccionaron cinco o más visualizaciones válidas, cuando se inicia el análisis, entonces se presenta una por una cada gráfica o KPI con título dinámico, filtros relevantes y «Por favor, redacte su análisis asociado a la visualización mostrada», junto con campo multilínea.
- **CA-04 — Exigir interpretación humana**: Dado que se muestra una visualización, cuando se intenta avanzar, entonces se exige análisis no vacío ni compuesto solo por espacios; el sistema no genera análisis automáticamente como sustituto de la interpretación humana.
- **CA-05 — Conservar textos al navegar**: Dado que se escribió un análisis, cuando se utiliza Anterior/Siguiente, entonces se conserva el texto asociado a cada visualización y se repite el análisis obligatorio hasta completar todas las seleccionadas.
- **CA-06 — Solicitar título y obtener metadatos**: Dado que se completaron todos los análisis, cuando se identifica el informe, entonces se exige título y se obtienen automáticamente fecha/hora, usuario responsable, rol, ámbito y unidad institucional correspondiente, período y filtros, sin redigitación de datos disponibles en la sesión.
- **CA-07 — Revisar antes de confirmar**: Dado que el informe tiene título, visualizaciones y análisis, cuando se llega a revisión, entonces se permite verificar el documento, los filtros y metadatos antes de confirmar su generación.
- **CA-08 — Descargar visualizaciones con sus análisis**: Dado que la revisión está confirmada, cuando se genera el documento, entonces se incluyen título, fecha/hora, responsable, área/ámbito, período y filtros, seguidos de cada visualización seleccionada y directamente su análisis en el orden revisado, conservando títulos dinámicos y filtros relevantes.
- **CA-09 — Conservar trazabilidad e interpretación histórica**: Dado que se genera un informe, cuando se conserva su contexto, entonces se registran metadatos, filtros, corte temporal y datos utilizados y, cuando sea técnicamente viable, una instantánea histórica reproducible para que las actualizaciones futuras no alteren su significado.
- **CA-10 — Mantener independencia y formato pendiente**: Dado que se descarga el informe analítico, cuando se utiliza el flujo, entonces el formato definitivo sigue pendiente de confirmación (PDF posible, no obligatorio), sin aprobaciones, remisiones obligatorias ni periodicidad semestral/anual y sin confundirlo con consolidaciones tabulares ni HU-030/CU-22.

### HU-044 — Gestionar la programación operativa de la Oficina Local

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Crear actividad**: Dado que se planifica una actividad futura, cuando se registra, entonces debe poder definirse fecha, tipo, propósito, establecimiento cuando corresponda y observaciones.
- **CA-02 — Tipos de actividad**: Dado que se programa una actividad, cuando se selecciona el tipo, entonces Sesión interdisciplinaria debe comprender análisis, priorización, valoración y decisiones del equipo; las visitas específicas de A.I. deben denominarse Visita a establecimiento para Atención Interdisciplinaria, conservando los demás tipos vigentes no cuestionados sin duplicar la sesión del equipo.
- **CA-03 — Estado inicial**: Dado que una actividad futura fue creada, cuando se guarda, entonces debe iniciar como Programada.
- **CA-04 — Marcar realizada**: Dado que la actividad se ejecutó, cuando se actualiza su estado, entonces debe poder marcarse como Realizada.
- **CA-05 — Reprogramar**: Dado que no pudo realizarse en la fecha prevista, cuando se marca como Reprogramada, entonces debe exigirse nueva fecha y motivo.
- **CA-06 — Cancelar conservando trazabilidad**: Dado que una actividad no se realizará, cuando se marca Cancelada, entonces debe exigirse y conservarse el motivo y mantenerse el registro para consulta y análisis, sin borrarlo como mecanismo normal de gestión.
- **CA-07 — Filtrar programación**: Dado que existen múltiples actividades, cuando se aplican filtros, entonces debe poder consultarse al menos por establecimiento y estado.
- **CA-08 — Identificar actividad vencida**: Dado que una actividad permanece Programada después de su fecha prevista, cuando se consulta la programación o el resumen, entonces debe identificarse como vencida mediante alerta e indicación roja acompañada de texto, y permitir resolverla como Realizada, Reprogramada o Cancelada.
- **CA-09 — Asociar personas explícitamente**: Dado que una actividad está dirigida a uno o más clientes/beneficiarias o casos, cuando se programa, entonces su asociación debe ser explícita; si no se especifican personas, debe tratarse como actividad general del establecimiento o equipo sin inferir que todos sus casos serán atendidos.

### HU-045 — Consultar la programación de las Oficinas Locales de la Región

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Restringir programación a la Región**: Dado que el usuario pertenece a una Región, cuando abre Programación, entonces solo debe visualizar actividades correspondientes a esa Región.
- **CA-02 — Filtrar por Oficina Local**: Dado que existen varias Oficinas Locales, cuando se selecciona una, entonces deben mostrarse únicamente sus actividades.
- **CA-03 — Filtrar por establecimiento**: Dado que existen actividades asociadas a establecimientos, cuando se selecciona uno, entonces deben mostrarse únicamente las correspondientes.
- **CA-04 — Filtrar por estado**: Dado que existen distintos estados, cuando se selecciona uno, entonces el listado debe actualizarse.
- **CA-05 — Combinar filtros**: Dado que se aplican varios criterios, cuando se combinan, entonces todos deben aplicarse simultáneamente.
- **CA-06 — Consultar información**: Dado que existe una actividad visible, cuando se presenta, entonces debe poder consultarse fecha, tipo, propósito, Oficina Local, establecimiento, estado y motivo cuando corresponda.
- **CA-07 — Solo lectura**: Dado que la programación corresponde a Oficina Local, cuando Regional la consulta, entonces no debe poder crear, modificar, cancelar, reprogramar ni marcar actividades como realizadas.

### HU-046 — Consultar la programación de Atención Interdisciplinaria a nivel nacional

**Estado en v0.7:** CONFIRMADO

- **CA-01 — Consultar programación nacional**: Dado que no existen filtros territoriales, cuando se abre Programación, entonces debe mostrarse todo el ámbito nacional permitido.
- **CA-02 — Filtrar por Región**: Dado que se selecciona una Región, cuando se aplica, entonces deben mostrarse únicamente sus actividades.
- **CA-03 — Filtrar por Oficina Local**: Dado que se selecciona una OL, cuando se aplica, entonces deben mostrarse únicamente sus actividades.
- **CA-04 — Filtrar por establecimiento**: Dado que se selecciona un establecimiento, cuando se aplica, entonces deben mostrarse únicamente las actividades correspondientes.
- **CA-05 — Filtrar por estado**: Dado que existen distintos estados, cuando se selecciona uno, entonces el listado debe actualizarse.
- **CA-06 — Mantener jerarquía de filtros**: Dado que los filtros territoriales están relacionados, cuando cambia Región u Oficina Local, entonces los filtros inferiores incompatibles deben actualizarse o limpiarse.
- **CA-07 — Consultar información**: Dado que existe una actividad visible, cuando se consulta, entonces deben mostrarse sus datos principales.
- **CA-08 — Solo lectura**: Dado que Oficina Local es responsable de la programación, cuando Nacional la consulta, entonces no debe poder crearla ni modificarla.

---

# ANEXO B — Contrato resumido de casos de uso v0.7

Este índice es una pista de navegación sobre `USE_CASES_v0.7.md`, no una autorización para implementar todos los procesos. Leer el texto completo del CU del repositorio al ajustar un flujo.

- CU-01 — Consultar resumen de Atención Interdisciplinaria según rol
- CU-02 — Buscar y seleccionar un cliente/beneficiaria
- CU-03 — Consultar perfil de un cliente/beneficiaria según nivel de acceso
- CU-04 — Crear manualmente una referencia a Atención Interdisciplinaria
- CU-05 — Cargar una referencia desde plantilla estandarizada
- CU-06 — Consultar y gestionar referencias según ámbito
- CU-37 — Consultar posibles referencias pendientes detectadas desde fuentes institucionales
- CU-07 — Gestionar una sesión interdisciplinaria
- CU-08 — Registrar valoración situacional de un caso
- CU-09 — Resolver si un caso requiere Atención Interdisciplinaria
- CU-10 — Definir abordaje inicial y abrir un caso de Atención Interdisciplinaria
- CU-11 — Consultar lista simplificada de A.I. desde Establecimiento
- CU-12 — Consultar y filtrar casos A.I. de la Oficina Local
- CU-13 — Consultar detalle integral de un caso A.I. en Oficina Local
- CU-14 — Consultar y filtrar casos A.I. de la Región
- CU-15 — Consultar detalle de un caso A.I. desde Nivel Regional
- CU-16 — Consultar y filtrar casos A.I. a Nivel Nacional
- CU-17 — Consultar detalle de un caso A.I. desde Nivel Nacional
- CU-18 — Gestionar documentos asociados a un caso A.I.
- CU-19 — Registrar una coordinación interinstitucional
- CU-20 — Trasladar un caso a otra Oficina Local
- CU-21 — Confirmar continuidad de un caso recibido por traslado — RETIRADO
- CU-22 — Generar un reporte de un caso sin cerrarlo
- CU-23 — Cerrar un caso de Atención Interdisciplinaria
- CU-36 — Identificar casos activos sin atención en un período
- CU-24 — Registrar una atención individual
- CU-25 — Registrar una atención grupal para múltiples participantes
- CU-26 — Gestionar la programación operativa de Oficina Local
- CU-27 — Consultar programación desde Nivel Regional
- CU-28 — Consultar programación desde Nivel Nacional
- CU-29 — Consultar reportería analítica de Oficina Local
- CU-30 — Consultar reportería analítica Regional
- CU-31 — Consultar reportería analítica Nacional
- CU-32 — Generar y descargar una consolidación dinámica
- CU-38 — Generar y descargar un informe analítico con análisis por visualización
- CU-33 — Administrar catálogos y versiones funcionales
- CU-34 — Importar o migrar información histórica
