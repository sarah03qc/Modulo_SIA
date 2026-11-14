# Auditoría de cumplimiento institucional de SIA-CENCINAI

**Fecha:** 14 de noviembre de 2026 (Costa Rica)  
**Autora y responsable del proyecto:** Sarah Priscilla Quesada Chaves  
**Base de revisión:** `main`, commit `f289a6c`.

## A. Resumen ejecutivo

Se revisaron API Express, frontend React, pruebas, configuración, scripts y persistencia en
`SIA_CENCINAI` y `SIDINACC_LOCAL`. Al inicio había cambios locales en 26 archivos de
aplicación y una reconstrucción Markdown de la metodología. El trabajo partió de ese estado
y preservó esos cambios. No se ejecutaron migraciones ni concesiones de permisos.

Se adelantó la autorización respecto a la lectura del cuerpo de referencias, se retiraron
identificadores de los registros de errores HTTP, se endureció la validación de planillas,
se normalizó la nomenclatura web y parte de la API, y se corrigieron dos scripts de permisos.
El monolito modular y sus contratos HTTP, de ejecución y de integración mantienen sus límites.
El cumplimiento sigue siendo parcial. Las diferencias más relevantes afectan el acceso SQL
por objetos programáticos, la auditoría por triggers, los tipos físicos de datos y la
adopción completa de convenciones de código. La verificación de integración depende del entorno.

### Fuentes y alcance de su evidencia

- **Institucional verificada.** DNCC-DI-MET-02, versión 1 (2022), PDF original, secciones
  7.3.4 y 7.4 a 7.7. La reconstrucción local permitió ubicar los pasajes. Se cotejaron
  directamente los apartados de código y SQL con el PDF. La regla escrita y su aplicación
  vigente a un stack o esquema existente son cuestiones distintas.
- **Institucional descriptiva.** [Manual Técnico CAH](../reference/source_docs/Manual_Tecnico_CAH.pdf),
  pp. 10, 13, 40 y 44–45. Documenta SQL Server, campos y tipos históricos de CAH. El manual
  no acredita el DDL productivo vigente ni una dispensa normativa para SIA.
- **Lineamientos del proyecto.** [Guía de desarrollo](../institutional/DEVELOPMENT_GUIDELINES_DNCC_DI_MET_02.md),
  especificación y casos de uso v0.7, ADR 0001 a 0003, y convenciones del repositorio.
  La indicación de nomenclatura en español procede de la reunión con UTIC informada por
  el equipo. No se tuvo acta de esa reunión para verificar su formulación literal.
- **Síntesis de NotebookLM.** Se revisaron sus 37 puntos como índice de auditoría.
  No se dispuso de los originales del Manual de Usuario CAH v4 ni de
  `20260423_Esquema UIVCD.pdf`. Las afirmaciones que dependan solo de esos documentos
  no se usan aquí para declarar obligaciones verificadas.
- **Buenas prácticas de ingeniería.** Autorización previa al procesamiento, registros
  minimizados, pruebas con activación explícita para escrituras, permisos atómicos
  y conservación de contratos. Se aplicaron por su efecto técnico verificable.

## B. Matriz de cumplimiento

| ID | Fuente | Requisito y evidencia | Estado | Acción o alcance |
| --- | --- | --- | --- | --- |
| COD-01 | UTIC, indicación reportada; DNCC 7.3.4, convenciones | Español para código propio, verbo y sustantivo para operaciones. | PARCIAL | Web, controles de capacidad, entrada de plantilla y colaboradores internos de Express en español. Subsisten nombres propios en inglés en la API, repositorios, scripts y pruebas. Los DTO HTTP, las APIs de terceros y las variables de entorno conservan sus nombres. |
| COD-02 | DNCC 7.3.4, comentarios; guía del proyecto | Documentar propósito, parámetros, salida y decisiones no evidentes. | PARCIAL | Revisados flujos críticos de autorización, plantillas y permisos. El servicio de referencias conserva trazabilidad por HU/RF y hay cobertura documental desigual en otros módulos. |
| COD-03 | DNCC 7.3.4, comentarios; 7.4; guía del proyecto | Identificar autoría, fechas y modificaciones. | PARCIAL | Los archivos principales de API y web intervenidos y los dos scripts SQL consignan responsable, evidencia inicial Git y fecha de modificación. Falta confirmar el formato exigible en JS/JSX y cómo se representa una autoría histórica no documentada. |
| COD-04 | DNCC 7.3.4, formato | Límite de 100 caracteres, sangría, llaves, espacios y formato SQL. | PARCIAL | Convención explícita en `.cursor/rules/08-code-conventions.mdc`. El inventario detectó líneas largas en API, pruebas y SQL. No toda línea larga constituye una excepción de sintaxis. ESLint no fiscaliza este límite globalmente. |
| ARQ-01 | ADR 0001; guía del proyecto | Monolito modular y límites entre presentación, HTTP, servicios y persistencia. | CUMPLE | `apps/web` solo consume HTTP. `apps/api/src/modules/references` mantiene rutas, DTO, reglas, servicio y repositorio. La composición se conserva en `app.js`. |
| ARQ-02 | Ingeniería; guía del proyecto | Validar y manejar errores según la responsabilidad del módulo. | CORREGIDO | `reference-routes.js` asocia validación de tamaño y tipo a la ruta, después de comprobar capacidad. `http-error-handler.js` registra patrones de rutas. |
| REF-01 | HU-014, RF-036 / CU-04 | Precargar la plantilla y verificar su estructura antes del envío. | CORREGIDO | `LeerLibroPlantilla` en `reference-template.js` recorre el contenido fuera de filas y columnas admitidas. Regresiones en `reference-service.test.js`. Se conserva el formato y la confirmación humana. |
| REF-02 | HU-013, RF-114/115, RN-030 / CU-04 | Consecutivo manual, canónico y único. | CUMPLE | `reference-rules.js`, restricción única y `reference-rules.test.js`. La coincidencia del establecimiento se verifica sin asignar un número automático. |
| VAL-01 | HU-020 y HU-025, RF-042 / CU-08 | Factores configurables y valoraciones históricas. | PARCIAL | Migración 020 modela instrumento, versión, categorías y factores. La 040 vincula cada valoración a una versión y guarda factores en filas. El frontend de valoración aún no existe. Tipos de respuesta y ejes arbitrarios exceden la parametrización actual. |
| VAL-02 | Especificación v0.7, RF-022/024 y RF-042 | Distinguir motivos de referencia de factores de valoración. | PARCIAL | Catálogo de referencias informa los factores de riesgo no confirmados como `NEEDS_VALIDATION`. Incorporar los valores requiere un instrumento o catálogo confirmado. |
| SEG-01 | ADR 0002 y 0003; guía del proyecto | Separar sesión, capacidad, territorio y filtros de campos; impedir sesión sintética productiva. | CUMPLE | `load-config.js`, `identity-provider.js`, `authorization-policy.js`, `field-policy.js`, políticas de territorio y consultas parametrizadas. El alcance del estado es el mecanismo local, no la autenticación productiva. |
| SEG-02 | Ingeniería; instrucciones de privacidad | No registrar valores de ruta ni procesar archivos de solicitudes sin capacidad. | CORREGIDO | Registro por plantilla de ruta o `SIN_RUTA`; regresiones en `http.test.js` y `reference-http.test.js`. CORS declara `Vary: Origin` aun cuando el origen no coincide. |
| SEG-03 | Ingeniería; configuración local | Proteger el entorno de pruebas contra escrituras implícitas. | CORREGIDO | `escrituras-sql-locales.js` exige consentimiento explícito, modo de desarrollo/pruebas y loopback en ambas conexiones. La limpieza de referencias depende de comprobar primero la conexión. |
| BD-01 | DNCC 7.3.4, diseño de BD | 3NF, PK, FK, orden y prefijos físicos. | PARCIAL | Hay PK, FK, restricciones, vínculos normalizados e historial. Hay snapshots deliberados y convenciones físicas divergentes, entre ellas PK `bigint` y objetos como `ops.cerrar_caso` y `dbo.caso_lista_establecimiento`. No se certifica globalmente 3NF. |
| BD-02 | DNCC 7.3.4, tabla de tipos; Manual Técnico CAH pp. 13, 40 y 44 | Uso de `NVARCHAR` frente a requisitos de compatibilidad y Unicode. | REQUIERE VALIDACIÓN | La metodología lo excluye y el manual histórico lo usa, incluso en `PER_idPersona`. El esquema actual lo usa. Cambiarlo requiere inventario, revisión de colación, prueba de caracteres y migración controlada. |
| BD-03 | DNCC 7.3.4, uso de nulos; AGENTS.md y diseño de datos vigente | Manejar ausencia con semántica explícita y conservar el historial. | REQUIERE VALIDACIÓN | Las migraciones usan NULL en atributos opcionales. Sustituirlo globalmente podría confundir ausencia, desconocido, pendiente y no aplicable. |
| BD-04 | DNCC 7.3.4, programación de BD | Acceso a tablas mediante objetos programáticos. | NO CUMPLE | El repositorio de referencias ejecuta SQL directo parametrizado y transaccional; el cliente institucional consulta tablas de réplica con permisos delimitados. La parametrización no satisface por sí sola este requisito. |
| BD-05 | DNCC 7.3.4, auditoría | Auditoría mínima transversal mediante triggers. | NO CUMPLE | `080_audit_and_security.sql` y el repositorio de referencias dan auditoría por eventos. No cubren la exigencia de triggers de cada tabla. |
| BD-06 | Ingeniería; guías de seguridad y ADR 0002 | Separar cuentas, aplicar privilegio mínimo y evitar concesiones parciales. | CORREGIDO | Scripts de concesión 010/020: guardas y concesiones en el mismo lote. 020 añade verificación de `db_datareader` y aplica los permisos en una sola transacción. El resultado efectivo requiere prueba en SQL Server. |
| BD-07 | DNCC 7.3.4, anexos 3 y 5 | Diagramas y diccionario actualizados para evaluar impactos de objetos programáticos. | PARCIAL | Hay ER y diseño físico en `database-design/current`. No se acreditó el conjunto completo de diagramas por objeto ni el registro tripartito de cambios que pide la metodología. |
| OPE-01 | DNCC 7.5–7.7; guía del proyecto | Ambiente, verificación con usuarios y liberación aprobada. | PARCIAL | Existen comandos de validación y ambiente local sintético. No se acredita separación efectiva de entornos, aceptación firmada, liberación ni respaldos productivos en esta revisión. |
| OPE-02 | DNCC 7.3.1; Manual CAH p. 10; ADR 0001 y stack vigente | Compatibilidad institucional del stack y herramientas. | REQUIERE VALIDACIÓN | Se conservan React, Express, Node.js y SQL Server. Las referencias históricas a .NET, IIS y Rational Rose no prueban por sí solas qué herramientas acepta hoy UTIC. |

## C. Modificaciones aplicadas

- API: `app.js`, `common/http-error-handler.js`, `infrastructure/auth/authorization-policy.js`,
  `infrastructure/auth/field-policy.js`, rutas institucionales y de referencias, servicio
  de referencias y `reference-template.js`. Cambios en autorización previa, registros de
  errores, encabezados CORS, nomenclatura y validación de la plantilla. Se actualizaron
  importaciones, consumidores y pruebas.
- Web: `main.jsx`, `aplicacion/`, `componentes/`, `funcionalidades/`, `servicios/`,
  `estilos/` y pruebas equivalentes. Nombres internos en español, manejo de respuestas
  inválidas y prevalencia de la consulta de estado más reciente.
- Persistencia: `security/010_grant_case_list_to_app.sql`,
  `security/020_grant_reference_writes_to_app.sql` y README de la réplica. Se preserva el
  conjunto de concesiones y los scripts de migración. El README identifica la estructura
  vigente de la réplica sin atribuirle equivalencia productiva.
- Verificación y mantenimiento: protección de las suites SQL con escritura, regresiones
  de esa protección y actualización de la guía de desarrollo, convenciones y documentación
  activa de arquitectura y autorización.

## D. Mejoras de mantenibilidad

La validación HTTP de entradas quedó junto al endpoint que la necesita. Los contratos del
servicio y del cliente externo se conservan. Las páginas web comparten un único adaptador
de estado técnico y no propagan detalles del parser a la interfaz.

El catálogo de factores puede añadir ítems mediante filas de una nueva versión del
instrumento. Las relaciones compuestas de la migración 040 verifican que el factor pertenezca
a la categoría y que la categoría corresponda a la versión de la valoración. El cambio de
vigencia no necesita modificar valoraciones anteriores. La forma de respuesta, las reglas de
prioridad y el juicio del equipo mantienen su autoridad funcional. Una interfaz futura debe
leer la versión aplicable y sus opciones desde un contrato validado. El incremento actual
carece de un consumidor de valoración que justifique introducir ese contrato.

## E. Verificación

| Comprobación | Resultado |
| --- | --- |
| `npm run verify:config` | Aprobada, con cuentas de aplicación diferentes en la configuración local. |
| `npm run lint` | Aprobada. |
| `npm run build` | Aprobada. Vite compiló 19 módulos. |
| `npm test` | Código 1. API: 74 aprobadas, 31 fallidas y 7 omitidas. HTTP con Supertest falló por `EACCES` al conectar por loopback y SQL Server en el puerto 1433 no respondió. Jest web quedó en cero pruebas con la configuración ordinaria porque SWC no pudo cargar su caché nativa en Windows. |
| Jest API focalizado sin servicios externos | 62 pruebas aprobadas en siete suites, incluidas las de activación explícita de escrituras y validación de plantillas. Dos pruebas adicionales del control de errores también pasaron. |
| Jest web con transformador temporal | Diez pruebas aprobadas en dos suites con Rolldown. Se mantuvieron los casos y la configuración restante de Jest. No se modificó la configuración versionada. |
| HTTP en memoria con Node, Express y dependencias sintéticas | Ocho solicitudes aprobadas: salud/CORS, disponibilidad, rechazos de plantilla sin sesión y sin capacidad, 404 sin registrar la ruta solicitada, envío autorizado, rechazo del JSON inválido y precarga autorizada. El alcance excluye sockets y SQL. |
| `python database/sidinacc-local/tools/generate_territorial_seed.py --check` | Aprobada. 661 filas, 630 activas, 8 inactivas y 23 cerradas, checksum `2365392756`. |
| `git diff --check` y revisión independiente | Aprobados en el alcance revisado. La revisión detectó la necesidad de limitar el destino SQL a loopback y actualizar documentación de autorización. Se incorporaron ambos cambios. |
| Pruebas SQL del motor | Bloqueadas por falta de conexión local y por denegación de acceso a Docker. No se ejecutaron DDL, DML, limpieza ni cambios de permisos. |

La ejecución inicial de la suite, antes de introducir la activación explícita, intentó
conectar con SQL y la limpieza de referencias falló al acceder a Docker. No se acreditó
ninguna escritura. Después del cambio, esas suites quedaron omitidas por defecto.

## F. Pendientes para UTIC

1. **Código moderno.** ¿Se mantiene el encabezado histórico completo por archivo JS/JSX
   y PascalCase para todas las funciones, o se acepta Git con encabezados en puntos
   de entrada y objetos SQL? ¿Qué excepciones de formato se aceptan para SQL embebido,
   JSX y literales de contratos?
2. **Compatibilidad SQL y nombres físicos.** ¿Se admite `NVARCHAR`, `bigint` y NULL
   semántico en SIA y en el límite de integración? ¿Se aplican prefijos institucionales
   solo a objetos nuevos o también a objetos desplegados mediante migración por etapas?
3. **Acceso y auditoría.** ¿Qué operaciones deben migrar a procedimientos o vistas de
   seguridad y qué campos debe poblar cada trigger? ¿Qué formato de diccionario y
   diagramas debe mantenerse junto al DDL? Validar permisos por objeto y mantener
   el historial al introducir cualquier cambio.
4. **Integración.** ¿Cuál es la fuente autorizada de sesión, identidad, roles y
   territorio? ¿Qué campos y objetos productivos de SIDINACC se habilitan para el
   módulo? Ratificar la política de visibilidad de información sensible y la
   combinación de ámbitos documentadas en `AUTHORIZATION_MODEL.md`.
5. **Instrumento.** ¿Qué versión y códigos vigentes deben publicarse como motivos de
   referencia por ámbito, y qué tipos de respuesta debe admitir la valoración? Mantener
   separadas las selecciones del instrumento y la calificación profesional.
6. **Operación institucional.** ¿Qué stack, herramientas de modelado y evidencias de
   pruebas, pase a producción y respaldo están vigentes para este módulo?

## G. Riesgos residuales

- La identidad productiva, las asignaciones territoriales y el esquema real de SIDINACC
  siguen pendientes de validación. El manual CAH y la réplica no prueban su equivalencia.
- Sin SQL Server disponible, quedan pendientes permisos efectivos, transacciones,
  concurrencia y ejecución de los scripts corregidos. El filtro territorial de la
  consulta y el filtro por autor de borradores dependen de la capa de servicio y SQL
  parametrizado, sin políticas RLS por usuario final en el motor.
- El límite de 1 MiB de la plantilla controla el tamaño recibido. El costo al procesar
  un XLSX descomprimido queda pendiente de medir y acotar.
- El formato y los nombres internos de API requieren una transición adicional. Renombrar
  objetos desplegados o endurecer tipos y nulos requiere comprobar dependencias y datos.
