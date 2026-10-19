# Especificaciones de Diseño, Identidad Visual y Accesibilidad

# SIA-CENCINAI — Especificaciones de Diseño, Identidad Visual y Accesibilidad

**Versión:** 0.1  
**Estado:** Borrador para validación  
**Fecha:** Octubre 2026  
**Producto:** SIA-CENCINAI — Sistema de apoyo a la Atención Interdisciplinaria  
**Responsable:** Sarah Priscilla Quesada Chaves

---

## 1. Propósito

El presente documento establece los criterios de diseño visual, interacción, accesibilidad y consistencia que deberán utilizarse en el desarrollo de las interfaces de SIA-CENCINAI.

Su objetivo es convertir los lineamientos institucionales de identidad gráfica y accesibilidad digital en criterios aplicables al diseño de una aplicación web, manteniendo coherencia con la imagen institucional de CEN-CINAI y procurando que las interfaces puedan ser utilizadas por personas con diferentes capacidades, dispositivos y tecnologías de asistencia.

Este documento funcionará como referencia transversal para:

- diseño de interfaces;
- implementación frontend;
- generación de componentes reutilizables;
- definición de requerimientos no funcionales;
- validación de accesibilidad;
- revisión de calidad de interfaz;
- generación de documentos y reportes electrónicos;
- futuras ampliaciones del módulo.

No sustituye los documentos institucionales originales. Cuando exista una actualización oficial de dichos lineamientos, este documento deberá revisarse y versionarse.

---

## 2. Fuentes institucionales

La presente especificación se deriva principalmente de los siguientes documentos:

**Lineamientos para la Identidad Gráfica de la Dirección Nacional de CEN-CINAI**, documento que establece los elementos gráficos institucionales, incluyendo logotipo, paleta de colores, tipografías, elementos iconográficos, usos autorizados y restricciones de marca. El lineamiento busca mantener una imagen institucional uniforme tanto para público interno como externo. 20261002\_Lineamiento identidad …

**AP-GIT-GD-LI-001 — Lineamientos para la producción y publicación de documentos electrónicos accesibles**, versión 1, emitido en septiembre de 2026. El documento establece como referencia las WCAG 2.2 nivel AA y organiza la accesibilidad alrededor de los principios perceptible, operable, comprensible y robusto. 20260902\_AP-GIT-GD-LI-001 Produ…

### 2.1 Regla de aplicación para SIA-CENCINAI

Los lineamientos institucionales fueron creados para distintos tipos de productos gráficos y documentos electrónicos, por lo que no todas sus disposiciones pueden trasladarse literalmente a una aplicación web.

Por esta razón, en este documento se distinguen dos tipos de criterios:

**Criterio institucional:** proviene directamente de los documentos oficiales de CEN-CINAI.

**Decisión de diseño SIA:** adaptación técnica realizada para convertir el criterio institucional en una regla aplicable a una interfaz web.

Cuando un criterio visual entre en conflicto con un criterio de accesibilidad, **SIA-CENCINAI priorizará la accesibilidad y legibilidad de la interfaz**, conservando la identidad institucional mediante aquellos elementos que puedan aplicarse sin afectar su utilización.

---

# 3. Principios generales de diseño

Las interfaces de SIA-CENCINAI deberán seguir los siguientes principios:

### DS-GEN-01 — Consistencia

Una misma operación deberá representarse de la misma forma en las diferentes áreas del sistema.

Botones, campos, estados, tablas, filtros, mensajes y acciones equivalentes deberán reutilizar patrones comunes.

### DS-GEN-02 — Claridad

La interfaz deberá mostrar únicamente la información y acciones necesarias para el contexto en que se encuentra la persona usuaria.

Se evitará saturar las pantallas con opciones, decoraciones o información secundaria.

### DS-GEN-03 — Jerarquía visual

Cada pantalla deberá permitir distinguir fácilmente:

1. ubicación dentro del sistema;
2. título de la vista;
3. información principal;
4. acciones primarias;
5. acciones secundarias;
6. información complementaria.

### DS-GEN-04 — Diseño centrado en la tarea

La estructura de la interfaz deberá corresponder con el trabajo institucional y no con la estructura técnica interna de la aplicación.

### DS-GEN-05 — Accesibilidad desde el diseño

La accesibilidad no será tratada como una corrección posterior. Los componentes deberán diseñarse desde el inicio para funcionar con teclado, lectores de pantalla, ampliación de contenido y otros mecanismos de asistencia.

### DS-GEN-06 — Adaptación por rol y ámbito

La interfaz podrá variar según el rol y ámbito institucional de la persona usuaria.

La ocultación visual de una función **no constituye por sí misma un mecanismo de autorización**. Las restricciones deberán ser aplicadas también por backend y acceso a datos.

### DS-GEN-07 — Responsividad

Las vistas deberán adaptarse a diferentes tamaños de pantalla sin perder las funciones esenciales.

El diseño será prioritariamente orientado a equipos de escritorio utilizados institucionalmente, pero deberá mantenerse funcional en tablets y dispositivos de menor tamaño cuando la operación lo permita.

---

# 4. Identidad visual institucional

## 4.1 Logotipo

SIA-CENCINAI deberá utilizar exclusivamente versiones oficiales del logotipo de CEN-CINAI.

No se permitirá:

- deformar el logotipo;
- estirarlo horizontal o verticalmente;
- rotarlo;
- modificar sus proporciones;
- reemplazar sus colores;
- alterar sus personajes;
- reconstruir manualmente sus elementos;
- generar variantes no autorizadas.

El lineamiento institucional establece además un área libre alrededor del logotipo y prohíbe alteraciones que comprometan su proporcionalidad. 20261002\_Lineamiento identidad …

### Aplicación en SIA-CENCINAI

El logotipo podrá utilizarse principalmente en:

- encabezado general;
- menú lateral;
- pantalla de acceso cuando corresponda;
- reportes institucionales;
- documentos generados;
- pantallas institucionales o informativas.

No será necesario repetir el logotipo dentro de cada tarjeta, formulario o sección interna.

En tamaños reducidos únicamente podrá emplearse una versión alternativa si esta se encuentra oficialmente autorizada. **No se creará una versión compacta propia del logotipo.**

---

## 4.2 Área de protección del logotipo

Se deberá conservar espacio visual alrededor del logotipo para evitar que otros elementos compitan con él.

El lineamiento institucional establece un área reservada alrededor de la marca y una reducción mínima para piezas gráficas. Para la aplicación web estos valores físicos no serán convertidos automáticamente a píxeles; se conservará el principio de **legibilidad, separación y proporcionalidad**.

---

# 5. Paleta de colores

La identidad gráfica institucional define tres colores principales:

| Color institucional | RGB oficial | Hexadecimal de referencia |
| --- | --- | --- |
| Morado | RGB(102, 51, 102) | `#663366` |
| Anaranjado | RGB(255, 102, 51) | `#FF6633` |
| Verde agua | RGB(0, 153, 153) | `#009999` |

El documento institucional establece estos colores como parte de la línea gráfica oficial y permite utilizarlos en materiales digitales. 20261002\_Lineamiento identidad …

## 5.1 Uso propuesto en la aplicación

Los colores institucionales funcionarán principalmente como **colores de identidad y acento**, no como únicos colores posibles de toda la interfaz.

### Morado

Uso propuesto:

- encabezados institucionales;
- navegación seleccionada;
- títulos destacados;
- botones primarios cuando el contraste resulte adecuado;
- elementos de énfasis.

### Verde agua

Uso propuesto:

- elementos secundarios;
- indicadores;
- elementos gráficos;
- estados visuales cuando su significado no dependa exclusivamente del color.

### Anaranjado

Uso propuesto:

- acentos;
- indicadores secundarios;
- elementos gráficos puntuales;
- llamadas de atención no críticas.

No deberá utilizarse indiscriminadamente como fondo de grandes áreas de contenido.

## 5.2 Colores neutros

La aplicación podrá utilizar colores neutros adicionales para mantener legibilidad:

- blanco;
- fondos grises muy claros;
- texto gris oscuro o negro;
- bordes neutros;
- superficies diferenciadas.

Estos colores no sustituyen la paleta institucional, sino que permiten construir una interfaz funcional alrededor de ella.

## 5.3 Colores semánticos

Estados como:

- éxito;
- advertencia;
- error;
- información;
- pendiente;
- inactivo;

podrán disponer de colores semánticos propios.

Sin embargo, **ningún estado deberá transmitirse únicamente mediante color**. Deberá acompañarse con texto, iconografía, etiqueta u otra señal perceptible. El lineamiento de accesibilidad establece expresamente que el color no debe ser el único identificador de información. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 6. Contraste

Todos los textos, controles, iconos y estados deberán disponer de contraste suficiente entre primer plano y fondo.

SIA-CENCINAI deberá validarse tomando como referencia **WCAG 2.2 nivel AA**. 20260902\_AP-GIT-GD-LI-001 Produ…

La pertenencia de un color a la paleta institucional **no garantiza automáticamente que cualquier combinación sea accesible**.

Por esta razón:

- deberán comprobarse las combinaciones antes de incorporarlas al sistema;
- se evitará texto claro sobre fondos claros;
- se evitará texto oscuro sobre fondos con contraste insuficiente;
- las gráficas no dependerán únicamente de diferencias de color;
- los estados deberán incluir información textual o iconográfica adicional.

---

# 7. Tipografía

El lineamiento de identidad institucional recomienda tipografías sans-serif para productos digitales y menciona Arial y Myriad Pro como ejemplos. El lineamiento de accesibilidad también establece el uso de tipografías sin adornos como Arial, Tahoma, Verdana, Helvetica, Montserrat o Century Gothic. 20260902\_AP-GIT-GD-LI-001 Produ…

## 7.1 Fuente principal de SIA-CENCINAI

Se define inicialmente:

**Arial** como tipografía principal de interfaz.

Fallback:

`Arial, Helvetica, sans-serif`

La decisión permite utilizar una fuente consistente, disponible de forma amplia y alineada con ambos lineamientos institucionales.

Myriad Pro y Bauhaus 93 forman parte de elementos específicos de la identidad y del logotipo institucional, pero **no serán utilizadas como fuentes generales de la interfaz**.

## 7.2 Jerarquía tipográfica inicial

Se utilizará una jerarquía limitada:

- título principal de pantalla;
- títulos de sección;
- subtítulos;
- texto normal;
- etiquetas de formulario;
- información secundaria.

El tamaño deberá poder escalar mediante las funciones de ampliación del navegador sin que se pierda información o funcionalidad.

No se utilizarán:

- textos decorativos difíciles de leer;
- sombras en texto;
- brillos;
- relieves;
- versalitas como recurso visual;
- mayúsculas sostenidas en bloques extensos.

El lineamiento de accesibilidad recomienda además limitar efectos decorativos y mantener una jerarquía tipográfica clara. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 8. Lenguaje de interfaz

Los contenidos deberán utilizar español claro, directo y comprensible.

Se procurará:

- utilizar oraciones breves;
- explicar términos técnicos cuando sean necesarios;
- evitar abreviaturas innecesarias;
- presentar el nombre completo antes de un acrónimo;
- utilizar terminología institucional validada;
- emplear lenguaje centrado en la persona;
- evitar expresiones ambiguas.

Los títulos deberán ser descriptivos y suficientemente breves.

El lineamiento institucional establece explícitamente el uso de lenguaje claro, conciso y centrado en la persona. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 9. Estructura general de pantalla

Como patrón general, las vistas podrán organizarse en:

1. **Navegación global**

Permite cambiar entre los principales módulos disponibles para el rol.

1. **Encabezado de pantalla**

Incluye:

- título;
- contexto institucional cuando corresponda;
- acciones principales.

1. **Área de filtros o búsqueda**

Se utiliza cuando la cantidad de información requiere localizar registros.

1. **Área principal**

Presenta tablas, formularios, tarjetas, indicadores o información del proceso.

1. **Acciones**

Se diferenciarán acciones primarias y secundarias.

1. **Mensajes y estados**

Presentan confirmaciones, errores, advertencias o información de contexto.

---

# 10. Navegación

La navegación deberá ser consistente y predecible.

Una persona usuaria deberá poder reconocer:

- dónde se encuentra;
- cómo regresar;
- qué acciones puede realizar;
- qué área institucional está consultando.

## 10.1 Navegación mediante teclado

Todas las operaciones esenciales deberán poder realizarse sin mouse.

Esto incluye:

- navegación principal;
- botones;
- enlaces;
- pestañas;
- formularios;
- filtros;
- tablas interactivas;
- diálogos;
- controles de selección.

El orden de navegación deberá seguir una secuencia lógica.

Los elementos interactivos deberán mostrar claramente cuando reciben foco.

La capacidad de operar interfaces mediante teclado y tecnologías de asistencia forma parte del principio institucional de accesibilidad **Operable**. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 11. Botones y acciones

Cada botón deberá utilizar un texto que describa claramente su acción.

Ejemplos:

**Recomendado**

- Guardar referencia
- Registrar atención
- Confirmar traslado
- Cancelar
- Descargar reporte

**Evitar**

- OK
- Ir
- Sí
- Hacer
- Continuar

cuando el contexto no sea suficientemente claro.

## 11.1 Jerarquía

Por vista deberá existir preferiblemente una única acción principal claramente reconocible.

Las acciones destructivas deberán diferenciarse visualmente y requerir confirmación cuando puedan producir pérdida o cambio irreversible de información.

Los botones que contengan únicamente iconos deberán contar con un nombre accesible comprensible para tecnologías de asistencia.

---

# 12. Formularios

Los formularios constituyen una parte crítica del sistema debido a la cantidad y sensibilidad de la información registrada.

Cada campo deberá poseer:

- etiqueta visible;
- estado requerido u opcional;
- instrucciones cuando sean necesarias;
- mensaje de validación específico;
- valor previamente ingresado cuando exista.

## 12.1 Campos obligatorios

No deberán identificarse únicamente mediante color.

Cuando se utilice `*`, deberá acompañarse de una explicación como:

*“ Campo obligatorio”*\*

## 12.2 Errores

Los mensajes deberán explicar:

1. qué ocurrió;
2. dónde ocurrió;
3. cómo corregirlo.

Ejemplo:

**No recomendado:**  
“Error.”

**Recomendado:**  
“La fecha de atención es obligatoria. Seleccione una fecha para continuar.”

Los campos con error deberán diferenciarse visualmente mediante más de una señal: texto, icono, borde u otro elemento, además del color.

## 12.3 Datos extensos

Cuando un proceso requiera mucha información:

- podrá dividirse en pasos;
- deberá conservarse el contexto;
- podrá utilizar autoguardado;
- deberá evitarse solicitar dos veces información que ya exista institucionalmente.

---

# 13. Selección y búsqueda de registros

Para conjuntos pequeños pueden utilizarse controles de selección convencionales.

Para conjuntos grandes, como:

- personas;
- establecimientos;
- Oficinas Locales;
- profesionales;
- instituciones;

se priorizarán mecanismos de **búsqueda** sobre listas desplegables extensas.

La búsqueda deberá indicar claramente:

- criterio utilizado;
- cantidad de resultados cuando sea útil;
- ausencia de resultados;
- filtros aplicados.

---

# 14. Tablas

Las tablas se utilizarán para información genuinamente tabular.

Se evitarán tablas utilizadas únicamente para posicionar visualmente componentes.

Toda tabla deberá:

- poseer encabezados claramente identificables;
- mantener una estructura simple;
- permitir una lectura lógica;
- evitar celdas combinadas cuando sea posible;
- permitir distinguir columnas sin depender del color;
- presentar acciones de fila de forma consistente.

Los lineamientos institucionales recomiendan tablas simples, encabezados significativos y evitar estructuras anidadas o celdas combinadas. 20260902\_AP-GIT-GD-LI-001 Produ… 20260902\_AP-GIT-GD-LI-001 Produ…

## 14.1 Tablas extensas

Cuando una tabla contenga gran cantidad de registros se utilizará:

- paginación;
- filtros;
- búsqueda;
- ordenamiento cuando corresponda;
- encabezados persistentes o repetidos cuando resulte necesario.

No se deberá resolver la cantidad de información reduciendo excesivamente el tamaño del texto.

---

# 15. Pestañas y agrupación de información

Las pestañas podrán utilizarse cuando representen distintas perspectivas de una misma entidad.

Ejemplo en un caso A.I.:

- Resumen
- Plan
- Línea de tiempo
- Atenciones
- Documentos
- Coordinaciones
- Reportes
- Traslado
- Cierre

No deberán utilizarse pestañas para ocultar etapas obligatorias de un proceso secuencial.

En esos casos deberá emplearse un flujo paso a paso.

---

# 16. Estados y etiquetas

Los estados se mostrarán mediante etiquetas consistentes.

Ejemplos:

- Activo
- Cerrado
- Pendiente
- Programada
- Realizada
- Reprogramada
- Cancelada

Cada estado deberá incluir siempre su texto.

El color funcionará únicamente como apoyo visual.

---

# 17. Iconografía

Los iconos deberán representar acciones o conceptos reconocibles.

No deberán utilizarse únicamente como decoración.

Cuando un icono represente una acción sin texto visible deberá disponer de:

- nombre accesible;
- ayuda contextual cuando resulte necesaria.

Los personajes institucionales establecidos en la identidad gráfica podrán utilizarse únicamente cuando su uso sea adecuado y no interfiera con la lectura o funcionalidad.

No deberán utilizarse como decoración repetitiva dentro de formularios operativos.

---

# 18. Imágenes

Toda imagen informativa deberá disponer de una alternativa textual.

Las imágenes puramente decorativas deberán marcarse como tales para que puedan ser ignoradas por tecnologías de asistencia.

El texto alternativo deberá:

- describir el propósito;
- ser breve;
- evitar repetir el texto cercano;
- no comenzar con expresiones innecesarias como “imagen de”.

Estas disposiciones están explícitamente establecidas en el lineamiento institucional de accesibilidad. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 19. Gráficos y visualizaciones

Los gráficos utilizados en reportería deberán contar con:

- título;
- etiquetas comprensibles;
- leyenda cuando corresponda;
- unidades claramente identificadas;
- contraste suficiente;
- alternativa textual;
- información disponible también mediante valores o tabla cuando sea necesario.

No se deberá diferenciar información únicamente mediante colores.

Cuando varias series sean visualmente similares podrán incorporarse:

- patrones;
- formas;
- etiquetas;
- marcadores.

Los lineamientos institucionales requieren que gráficos, diagramas e infografías dispongan de títulos claros, diferenciación adicional al color y texto alternativo o descripción extensa cuando sea necesario. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 20. Hipervínculos

El texto de un enlace deberá indicar su destino.

**Evitar:**

- Haga clic aquí
- Ver más
- Más información

**Preferir:**

- Consultar expediente
- Descargar reporte del caso
- Abrir lineamientos institucionales
- Consultar detalle de referencia

Cuando un enlace:

- descargue un archivo;
- abra una nueva pestaña;
- conduzca fuera del sistema;

deberá comunicarse cuando sea relevante.

Estas reglas se encuentran expresamente incluidas en el lineamiento institucional de accesibilidad. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 21. Modales y diálogos

Los diálogos deberán utilizarse únicamente cuando la interacción necesite interrumpir temporalmente la vista principal.

Ejemplos apropiados:

- confirmación de cierre;
- confirmación de traslado;
- eliminación;
- acciones irreversibles.

Cuando se abra un diálogo:

- el foco deberá trasladarse al diálogo;
- la navegación mediante teclado deberá mantenerse dentro de este mientras permanezca abierto;
- deberá existir una forma clara de cerrarlo;
- al cerrarse deberá devolverse el contexto de navegación a la vista original.

---

# 22. Mensajes del sistema

Los mensajes deberán clasificarse funcionalmente.

### Éxito

Confirma que una operación terminó correctamente.

> Referencia registrada correctamente.

### Información

Comunica un dato relevante.

> Esta persona ya cuenta con un caso activo.

### Advertencia

Advierte sobre una situación que requiere atención.

> Este caso contiene cambios sin guardar.

### Error

Indica que una operación no pudo completarse.

> No fue posible guardar la atención. Verifique los campos indicados e intente nuevamente.

Los mensajes deberán ser comprensibles sin depender del color o icono.

---

# 23. Carga y estados de procesamiento

Cuando una operación tarde lo suficiente como para que la persona usuaria pueda interpretar que el sistema dejó de responder, se deberá mostrar un indicador de procesamiento.

Se evitará permitir múltiples envíos accidentales de la misma operación.

Cuando una tarea pueda tardar considerablemente, deberá indicarse que continúa en proceso.

---

# 24. Diseño responsivo

SIA-CENCINAI deberá adaptarse progresivamente al ancho disponible.

### Escritorio

Diseño principal para operación institucional.

Podrá utilizar:

- menú lateral;
- múltiples columnas;
- tablas completas;
- paneles simultáneos.

### Tablet

Los paneles podrán reorganizarse verticalmente y los menús compactarse.

### Pantallas pequeñas

Se priorizará:

- lectura;
- búsquedas;
- consulta;
- operaciones sencillas.

Formularios y tablas deberán reorganizarse evitando pérdida de campos o acciones.

No se deberán ocultar funciones esenciales únicamente porque el ancho de pantalla sea menor.

---

# 25. Zoom y ampliación

La interfaz deberá permitir utilizar las funciones estándar de ampliación del navegador sin:

- superposición de contenido;
- pérdida de controles;
- texto cortado;
- desaparición de acciones;
- necesidad injustificada de desplazamiento horizontal.

---

# 26. Movimiento y animaciones

No se utilizarán:

- destellos;
- elementos parpadeantes;
- animaciones automáticas innecesarias;
- carruseles automáticos;
- movimiento decorativo continuo.

El lineamiento institucional recomienda evitar contenido parpadeante o con movimiento automático por las dificultades de lectura y posibles efectos sobre algunas personas usuarias. 20260902\_AP-GIT-GD-LI-001 Produ…

Las animaciones que se utilicen para comunicar transición o estado deberán ser discretas y funcionales.

---

# 27. Multimedia

Si en una futura iteración se incorporan audio o video:

### Audio

Deberá contar con:

- transcripción textual;
- identificación de sonidos relevantes;
- controles de reproducción accesibles.

### Video

Deberá considerar:

- subtítulos;
- narración clara;
- contraste;
- ausencia de destellos;
- alternativa o apoyo en LESCO cuando corresponda según el lineamiento institucional.

El documento institucional contiene criterios específicos de accesibilidad para audio, subtítulos, contenido audiovisual e interpretación en LESCO. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 28. Documentos generados por SIA-CENCINAI

Los reportes o documentos electrónicos generados desde el sistema deberán procurar conservar los mismos principios de accesibilidad.

Cuando el sistema genere un PDF institucional deberá utilizarse, cuando técnicamente sea posible:

- PDF etiquetado;
- estructura de títulos;
- texto seleccionable;
- orden lógico;
- tablas accesibles;
- texto alternativo;
- hipervínculos descriptivos.

El lineamiento institucional reconoce como formatos accesibles PDF etiquetado, HTML y Word accesible y exige compatibilidad con tecnologías de asistencia. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 29. Exportaciones tabulares

Las exportaciones destinadas a análisis, por ejemplo Excel, deberán:

- utilizar encabezados claros;
- evitar celdas combinadas;
- mantener una fila por registro cuando sea aplicable;
- conservar tipos de datos consistentes;
- evitar que el significado dependa exclusivamente de colores;
- incluir únicamente la información autorizada para el usuario.

La accesibilidad no deberá introducir información que no corresponda al ámbito de permisos.

---

# 30. Privacidad visual

Debido a que SIA-CENCINAI procesa información sensible, las interfaces deberán evitar exponer información innecesaria.

Entre las medidas de diseño se incluyen:

- mostrar únicamente los campos requeridos para la tarea;
- evitar colocar datos sensibles en títulos de páginas cuando no sean necesarios;
- limitar previews o resúmenes según rol;
- evitar incorporar información real en demostraciones o capturas de documentación;
- no incluir datos sensibles en mensajes de error técnicos.

---

# 31. Diseño según rol

La estructura general del sistema se mantendrá consistente, pero la cantidad de información disponible dependerá del perfil y ámbito.

### Establecimiento

Interfaz simplificada orientada a:

- referencias;
- búsqueda necesaria;
- consulta limitada del estado de A.I.

### Oficina Local

Interfaz operativa completa para:

- valoración;
- sesiones;
- casos;
- atenciones;
- programación;
- traslado;
- documentos;
- coordinaciones;
- cierre.

### Nivel Regional

Interfaz predominantemente de consulta, seguimiento y análisis del ámbito regional.

### Nivel Nacional

Interfaz orientada a consulta consolidada, análisis y reportería nacional.

Las restricciones deberán aplicarse desde servicios y datos, no únicamente mediante diferencias visuales.

---

# 32. Consistencia entre vistas

Los siguientes elementos deberán provenir de componentes reutilizables:

- botones;
- inputs;
- selects;
- buscadores;
- filtros;
- etiquetas de estado;
- tarjetas;
- diálogos;
- tablas;
- paginación;
- mensajes;
- encabezados;
- breadcrumbs;
- pestañas;
- indicadores;
- tooltips.

Una modificación al patrón común deberá propagarse a las vistas que utilicen el componente.

---

# 33. Design tokens

La implementación frontend deberá centralizar las principales decisiones visuales mediante variables o *design tokens*.

Como mínimo:

```
colors
typography
font sizes
font weights
spacing
border radius
borders
shadows
breakpoints
focus styles
z-index levels
```

No deberán distribuirse valores visuales arbitrarios entre múltiples componentes cuando puedan formar parte del sistema de diseño.

---

# 34. Tokens iniciales de color

Ejemplo conceptual:

```
brand-purple
brand-orange
brand-aqua

background-primary
background-secondary

text-primary
text-secondary
text-disabled

border-default
border-strong

status-success
status-warning
status-error
status-info

focus
```

Los valores finales de los colores semánticos deberán validarse mediante criterios de contraste antes de consolidarse.

---

# 35. Accesibilidad semántica

La estructura HTML deberá utilizar controles y elementos semánticos nativos siempre que sea posible.

Ejemplos:

- `button` para botones;
- `a` para enlaces;
- `label` para campos;
- encabezados jerárquicos;
- `table` para datos tabulares;
- listas reales para conjuntos ordenados o no ordenados.

Se evitará simular controles mediante elementos visuales que no proporcionen semántica equivalente.

Las tecnologías de asistencia deberán poder interpretar correctamente la estructura, alineándose con el principio institucional de robustez. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 36. Orden lógico de lectura

La estructura visual y la estructura disponible para tecnologías de asistencia deberán coincidir.

El flujo general será:

**izquierda → derecha**  
**arriba → abajo**

cuando corresponda al idioma y disposición de la interfaz.

Los lineamientos institucionales utilizan este mismo principio para el orden de contenido y elementos visuales. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 37. Validación del diseño

Antes de considerar una pantalla terminada deberá validarse en tres niveles.

## 37.1 Validación visual

Comprobar:

- alineación;
- jerarquía;
- espaciado;
- tipografía;
- colores;
- marca;
- responsividad.

## 37.2 Validación funcional

Comprobar:

- flujo esperado;
- permisos;
- mensajes;
- estados;
- validaciones;
- acciones disponibles.

## 37.3 Validación de accesibilidad

Comprobar al menos:

- navegación completa mediante teclado;
- foco visible;
- contraste;
- etiquetas de campos;
- estructura de encabezados;
- textos alternativos;
- errores comprensibles;
- enlaces descriptivos;
- ausencia de dependencia exclusiva del color;
- orden lógico;
- ampliación;
- compatibilidad básica con lector de pantalla.

La normativa institucional establece que la revisión de accesibilidad debe combinar comprobaciones del equipo responsable, herramientas automáticas y revisión humana, especialmente en contenidos complejos. 20260902\_AP-GIT-GD-LI-001 Produ…

---

# 38. Herramientas de validación

Durante desarrollo podrán utilizarse herramientas automatizadas de apoyo para detectar problemas de accesibilidad.

La aprobación de una herramienta automática **no sustituye la revisión manual**.

La validación deberá incluir igualmente:

- uso real mediante teclado;
- inspección visual;
- prueba de ampliación;
- revisión de textos;
- prueba de estados y errores;
- revisión de componentes dinámicos.

---

# 39. Criterios mínimos de aceptación de una pantalla

Una pantalla no deberá considerarse lista si incumple alguno de los siguientes criterios:

- no puede utilizarse completamente mediante teclado;
- presenta texto ilegible o de contraste insuficiente;
- comunica información únicamente por color;
- posee controles sin etiqueta;
- utiliza iconos sin nombre accesible cuando representan acciones;
- presenta imágenes informativas sin alternativa;
- pierde contenido durante ampliación;
- contiene estados o errores sin explicación;
- presenta acciones no permitidas para el rol;
- modifica o deforma elementos oficiales de identidad;
- utiliza patrones visuales diferentes para la misma acción sin justificación.

---

# 40. Excepciones

Cuando exista una razón técnica o institucional para incumplir temporalmente una regla de este documento:

1. deberá documentarse;
2. deberá indicarse el criterio afectado;
3. deberá explicarse la causa;
4. deberá proponerse una alternativa o corrección futura;
5. si afecta accesibilidad, deberá evaluarse su impacto antes de aprobarse.

---

# 41. Gestión de cambios

Cualquier cambio significativo en:

- identidad gráfica;
- navegación;
- tipografía;
- colores;
- estructura de componentes;
- accesibilidad;
- interacción;

deberá revisarse contra este documento.

Cuando una modificación afecte también una regla funcional o no funcional, se deberá actualizar su trazabilidad hacia las Historias de Usuario, Requerimientos y Casos de Uso correspondientes.

---

# 42. Relación con la especificación funcional

Este documento contiene criterios de diseño más detallados de lo que resulta conveniente repetir dentro de cada HU o RF.

Por ello, la especificación funcional deberá incorporar posteriormente únicamente aquellos requisitos que deban ser:

- verificables;
- trazables;
- exigibles a nivel del producto.

Ejemplo:

**Este documento:**

> Las interfaces deben utilizar la identidad gráfica institucional y mantener la paleta, logotipo y tipografía definidos en los lineamientos vigentes.

**Requerimiento no funcional derivado:**

> RNF-XXX — El sistema deberá mantener coherencia con los lineamientos vigentes de identidad gráfica de CEN-CINAI, incluyendo uso autorizado del logotipo, paleta institucional y tipografía digital definida.

Otro ejemplo:

**Este documento:**

> Todas las operaciones esenciales deben poder realizarse mediante teclado.

**Requerimiento derivado:**

> RNF-XXX — La interfaz deberá cumplir los criterios aplicables de WCAG 2.2 nivel AA y permitir la ejecución de las funcionalidades esenciales mediante teclado sin requerir el uso de mouse.

---

# 43. Pendientes de validación

Los siguientes elementos deberán confirmarse durante el desarrollo o con la institución:

**PD-DES-01.** Confirmar si existe un imagotipo o variante específica autorizada para sistemas de información que deba utilizar SIA-CENCINAI.

**PD-DES-02.** Confirmar con el área responsable de comunicación si existen archivos oficiales del logotipo optimizados para aplicaciones web.

**PD-DES-03.** Validar la propuesta inicial de utilización de Arial como tipografía principal del módulo.

**PD-DES-04.** Confirmar si existen otros lineamientos institucionales específicos para sistemas web o interfaces internas.

**PD-DES-05.** Definir la paleta semántica de éxito, advertencia, error e información una vez validados los contrastes correspondientes.

**PD-DES-06.** Validar con usuarios institucionales las principales decisiones de responsividad y densidad de información.

---

# 44. Definición de terminado de interfaz

Una funcionalidad frontend podrá considerarse terminada cuando:

- corresponde al comportamiento definido en HU/RF/CU;
- respeta el rol y ámbito institucional;
- utiliza componentes reutilizables;
- sigue la identidad institucional;
- cumple los criterios aplicables de este documento;
- funciona mediante teclado;
- presenta estados de foco;
- no depende únicamente del color;
- tiene textos y mensajes comprensibles;
- funciona en los tamaños de pantalla definidos;
- supera la validación automática de accesibilidad aplicable;
- supera una revisión manual básica;
- no utiliza datos personales reales en pruebas o capturas;
- cuenta con pruebas cuando el componente o flujo las requiera.

---

# 45. Resumen de decisiones iniciales

| Área | Decisión inicial |
| --- | --- |
| Identidad | Mantener identidad gráfica oficial CEN-CINAI |
| Logo | Utilizar únicamente archivos y variantes oficiales |
| Color | Morado, anaranjado y verde agua como paleta de marca |
| Accesibilidad | WCAG 2.2 nivel AA como referencia |
| Tipografía | Arial como fuente principal propuesta |
| Layout | Interfaz web responsiva |
| Navegación | Operable mediante teclado |
| Información | No transmitir significado únicamente mediante color |
| Formularios | Etiquetas visibles y errores específicos |
| Tablas | Estructura simple, encabezados claros |
| Imágenes | Texto alternativo cuando aporten información |
| Gráficos | Color + forma/textura/etiqueta y alternativa textual |
| Lenguaje | Claro, institucional y centrado en la persona |
| Componentes | Reutilizables y centralizados |
| Roles | Interfaz adaptada, autorización aplicada además en backend |
| Validación | Automática + revisión manual |
| Documentos | Generación accesible cuando el formato lo permita |

---

## 46. Regla general

> **SIA-CENCINAI deberá sentirse visualmente parte de CEN-CINAI, pero ninguna decisión de marca deberá implementarse de una forma que reduzca la accesibilidad, legibilidad, seguridad o capacidad de uso del sistema.**
> 
>
