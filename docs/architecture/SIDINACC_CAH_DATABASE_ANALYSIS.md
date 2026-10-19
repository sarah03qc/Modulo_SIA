# Análisis del esquema de Base de Datos SIDINACC / Módulo CAH

**Versión:** 0.1  
**Fecha:** 17 de septiembre de 2026  
**Tipo:** Documento técnico para Confluence  
**Fuente principal:** *Manual Técnico — Módulo de Caracterización del Ambiente del Hogar (CAH)*, DNCC-DI-UTIC-M-00X-2021, documento actualizado con registro de cambio de 06/06/2023.

> \[!IMPORTANT\]  
> Este documento describe **lo que el manual técnico documenta**. Cuando el manual presenta inconsistencias, duplicidades o información incompleta, se señalan explícitamente; no se corrigen silenciosamente. Las secciones “Implicaciones para SIA-CENCINAI” son análisis del proyecto y no forman parte del esquema oficial documentado.

---

pregunta para hacerle a utic:

¿Cómo se almacena o consulta actualmente en SIDINACC la relación entre un usuario, su perfil o rol y los establecimientos a los que tiene acceso? Particularmente, necesitamos identificar cómo se determina la lista de establecimientos autorizados para una Asistente 3 que atiende más de un establecimiento. ¿Esta relación se encuentra en tablas de SIDINACC, en otro esquema/base de datos o en la capa de autenticación/autorización de la aplicación?



# 1. Objetivo

Construir una lectura exhaustiva y utilizable del esquema de datos que rodea al módulo CAH/SIDINACC, incluyendo:

- arquitectura técnica;
- distribución física y lógica de la base;
- tablas, campos, tipos, nulos, PK/FK e Identity;
- relaciones documentadas;
- catálogos y tablas de parámetros;
- vistas;
- triggers y auditoría;
- restricciones especiales;
- funciones y Stored Procedures;
- tareas programadas;
- política de respaldos;
- dependencias externas;
- inconsistencias relevantes del manual;
- elementos reutilizables para SIA-CENCINAI;
- base para construir posteriormente una réplica de desarrollo con datos sintéticos y una BD separada del módulo A.I.

---

# 2. Resumen ejecutivo del esquema

El manual contiene **57 fichas de tablas** en su sección 5.6. De ellas, **23 son catálogos CAF**, **4 parámetros CAF**, **14 tablas CAF de núcleo/detalle**, **11 recursos RCS** y **5 tablas PMS**. Además, los diagramas de las páginas 13-14 muestran varios objetos relacionados que no reciben una ficha completa en la sección 5.6.

El patrón de arquitectura de datos puede resumirse así:

```
Región
  ↓
Oficina Local
  ↓
Establecimiento
  ↓
Familia / Expediente
  ↓
Persona
  ├── Detalle de persona por período
  ├── Menor
  │    └── Evaluaciones antropométricas/nutricionales
  ├── Mujer gestante/lactante
  └── Servicios recibidos por período/mes
```

Alrededor de ese núcleo existen:

- catálogos (`CAF_CAT_*`);
- parámetros (`CAF_PAR_*`);
- recursos (`RCS_*`);
- proyección/metas (`PMS_*`);
- vistas de consulta (`uV_*`);
- procedimientos almacenados (`SP_*`);
- triggers de auditoría;
- dependencias con bases externas como **PADRON**, **COMITES** y **BINNACLE**.

Para SIA-CENCINAI, las piezas más relevantes son `CAF_PERSONA`, `CAF_PERSONA_DETALLE`, `CAF_MENOR`, `CAF_EVALUACION_MENOR`, `CAF_FAMILIA`, `CAF_FAMILIA_DETALLE`, `RCS_ESTABLECIMIENTO`, `CAF_CAT_OFICINA_LOCAL`, `CAF_CAT_REGION`, `RCS_PERIODO`, `CAF_SERVICIO_CLIENTE` y las tablas territoriales. El manual también documenta un mecanismo de traslado de expedientes que debe estudiarse antes de diseñar el traslado propio de A.I.

---

# 3. Diagramas existentes en el manual

Sí existen diagramas y vale la pena colocar capturas en Confluence.

## 3.1 Arquitectura general — página 10

La **página 10** muestra una arquitectura conceptual de SIDINACC: librerías de homologación SQL, funciones generales y manejo de interfaz Web sobre Base de Datos SQL + servidor Web IIS + sistema operativo.

**Recomendación:** colocar una captura después de esta sección como contexto técnico general.

## 3.2 Diagrama Entidad-Relación — página 13

La **página 13** contiene el diagrama de relaciones de SIDINACC/CAH. Es el diagrama oficial incluido en el manual, pero está extremadamente comprimido y resulta difícil leer nombres/campos incluso al ampliar.

**Recomendación:** colocar la captura como evidencia del modelo oficial, pero no utilizarla como único diagrama de trabajo. Para desarrollo conviene reconstruir un ER limpio a partir del esquema documentado.

## 3.3 Parámetros y variables de entorno — página 14

La **página 14** contiene un segundo diagrama mucho más legible con tablas de parámetros y entorno (`RCS_VARIABLES_ENTORNO`, `RCS_USUARIOS`, prioridad, proyección, período, catálogos, etc.).

**Recomendación:** esta captura sí es muy útil en Confluence.

> Para la futura réplica local conviene generar un nuevo ER propio, limpio y navegable. El manual ya aporta la fuente oficial; nuestra versión puede separar “núcleo reutilizado de SIDINACC” y “BD propia SIA-CENCINAI”.

---

# 4. Plataforma e infraestructura documentada

| Elemento | Especificación del manual |
| --- | --- |
| Plataforma | Microsoft / Web |
| .NET Framework | 4.8 o superior |
| IIS | 10.0 / 1709 o superior |
| Windows Server | 2019 o superior indicado en texto |
| C# | 10.0 o superior |
| <http://ASP.NET> | 7.0.9 o superior |
| <http://ASP.NET>  MVC | 5.2 o superior |
| HTML | 5 |
| CSS | 3 |
| Bootstrap | 5 o superior |
| jQuery | 3.6.0 o superior |
| Motor BD | Microsoft SQL Server 2017 (14.0.2042.3 X64) o superior según el manual |

El manual insiste además en cinco principios: **liviano, práctico, económico, escalable y soportable**, con separación de ambientes de desarrollo/pruebas/producción y estándares comunes de codificación/documentación.

---

# 5. Distribución física y lógica de la BD

## 5.1 Base de datos

- Base física principal: **SIDINACC**.
- Archivo de datos: `SIDINACC.mdf`.
- Archivo de log: `SIDINACC_log.ldf`.
- Ruta documentada: `B:\Microsoft SQL Server\MSSQL14.MSSQLSERVER\MSSQL\DATA`.

## 5.2 Nombres lógicos de archivos

| Nombre lógico | Tipo | Nombre físico | Tamaño mostrado | Crecimiento |
| --- | --- | --- | --- | --- |
| `WebCAF` | ROWS Data / PRIMARY | `SIDINACC.mdf` | 123 MB | 1 MB, ilimitado |
| `WebCAF_log` | LOG | `SIDINACC_log.ldf` | 814 MB | 10%, máximo mostrado 2,097,152 MB |

El contraste entre el nombre lógico **WebCAF** y el nombre de base/archivo **SIDINACC** es importante al recrear el entorno: no deben asumirse equivalentes sin revisar scripts/metadata reales.

---

# 6. Convenciones estructurales observadas

## 6.1 Prefijos

| Prefijo | Uso observado |
| --- | --- |
| `CAF_CAT_` | Catálogos del CAH |
| `CAF_PAR_` | Parámetros/reglas CAH |
| `CAF_` | Datos operativos/detalle del CAH |
| `RCS_` | Recursos compartidos/institucionales |
| `PMS_` | Proyección de Metas Sustantivas |
| `uV_` | Vistas de usuario |
| `SP_` | Stored Procedures |
| `tr_` | Triggers reales del módulo (aunque la metodología general propone `TR_`) |
| `BIT_` | Campos comunes de eliminación/modificación/fecha en muchas tablas |

## 6.2 Patrón de eliminación lógica

Muchas tablas incluyen `BIT_eliminado` y los Stored Procedures de mantenimiento realizan “eliminación lógica” en vez de borrar físicamente. Es un patrón estructural importante para SIA.

## 6.3 Patrón temporal

Varias tablas que pueden cambiar año con año se relacionan con `RCS_PERIODO`, en especial `CAF_PERSONA_DETALLE`, `CAF_FAMILIA_DETALLE`, `CAF_EVALUACION_MENOR` y `CAF_SERVICIO_CLIENTE`. El sistema conserva histórico por período en lugar de sobrescribir todos los datos.

---

# 7. Inventario de tablas documentadas

| Grupo | Cantidad |
| --- | --- |
| Catálogos CAF | 23 |
| Parámetros CAF | 4 |
| Núcleo/detalle CAF | 14 |
| Recursos RCS | 11 |
| PMS / proyección | 5 |
| **Total con ficha en 5.6** | **57** |

## 7.1 Catálogos CAF

`CAF_CAT_AREA_ATRACCION`, `CAF_CAT_ASEGURAMIENTO`, `CAF_CAT_CONDICION_MIGRATORIA`, `CAF_CAT_CONDICION_NACER`, `CAF_CAT_Estado_Civil`, `CAF_CAT_ESTADO_FISIOLOGICO`, `CAF_CAT_ETNIA`, `CAF_CAT_JORNADA_LABORAL`, `CAF_CAT_MIDEPLAN`, `CAF_CAT_NIVEL_EDUCATIVO`, `CAF_CAT_OFICINA_LOCAL`, `CAF_CAT_POBLACION`, `CAF_CAT_POBREZA`, `CAF_CAT_REFERENCIA`, `CAF_CAT_REGION`, `CAF_CAT_SEXO`, `CAF_CAT_TIPO_CLIENTE`, `CAF_CAT_TIPO_DISCAPACIDAD`, `CAF_CAT_TIPO_ESTABLECIMIENTO`, `CAF_CAT_TIPO_HOGAR`, `CAF_CAT_TIPO_IDENTIFICACION`, `CAF_CAT_TIPO_OCUPACION`, `CAF_CAT_TIPO_TRASLADO`.

## 7.2 Parámetros CAF

`CAF_PAR_PERCAPITA`, `CAF_PAR_PRIORIDAD`, `CAF_PAR_PUNTAJE_MAXIMO`, `CAF_PAR_ULTIMO_DIA`.

## 7.3 Núcleo/detalle CAF

`CAF_DETALLE_TRASLADO`, `CAF_EVALUACION_MENOR`, `CAF_FAMILIA`, `CAF_FAMILIA_DETALLE`, `CAF_GENERACION_CLAVE`, `CAF_INDICADOR_ANTROPOMETRICO`, `CAF_MENOR`, `CAF_MUJER`, `CAF_NACIONALIDAD`, `CAF_PERSONA`, `CAF_PERSONA_DETALLE`, `CAF_SALUD`, `CAF_SERVICIO`, `CAF_SERVICIO_CLIENTE`.

## 7.4 Recursos RCS

`RCS_CANTON`, `RCS_CATALOGO`, `RCS_COSTOS_SERVICIOS`, `RCS_DISTRITO`, `RCS_ESTABLECIMIENTO`, `RCS_ESTABLECIMIENTO_CARACTERISTICA`, `RCS_MES_ANUAL`, `RCS_PERIODO`, `RCS_POBLADO`, `RCS_PROVINCIA`, `RCS_TOKEN`.

## 7.5 PMS / proyección

`PMS_ESTRATEGIA`, `PMS_NIVEL_PRIMARIO`, `PMS_NIVEL_SECUNDARIO`, `PMS_PROYECCION`, `PMS_VARIABLE_PROYECCION`.

---

# 8. Núcleo relacional y lectura funcional

## 8.1 Jerarquía institucional

La jerarquía se representa principalmente mediante:

```
CAF_CAT_REGION
   ↓
CAF_CAT_OFICINA_LOCAL
   ↓
RCS_ESTABLECIMIENTO
```

Esto coincide directamente con los filtros y ámbitos que necesita SIA-CENCINAI: Región → Oficina Local → Establecimiento.

## 8.2 Expediente/familia/persona

```
RCS_ESTABLECIMIENTO
   ↓
CAF_FAMILIA
   ↓
CAF_FAMILIA_DETALLE
   ↓
CAF_PERSONA
   ├── CAF_PERSONA_DETALLE
   ├── CAF_MENOR
   ├── CAF_MUJER
   ├── CAF_EVALUACION_MENOR
   └── CAF_SERVICIO_CLIENTE
```

### Observación clave para SIA

`CAF_PERSONA.PER_idPersona` es `nvarchar(20)` y figura como PK. También existe `RCS_idPersona` autoincremental. El texto dice que `RCS_idPersona` sirve para identificar internamente a la persona, pero muchas relaciones del manual siguen usando `PER_idPersona`. Por lo tanto, **la clave de integración definitiva debe verificarse contra el esquema real cuando tengamos acceso a la BD de pruebas**, no inferirse solo del PDF.

## 8.3 Vigilancia/antropometría reutilizable

`CAF_EVALUACION_MENOR` almacena fecha, edad, peso, talla y cuatro resultados nutricionales (PE, PT, TE e IMC). `CAF_INDICADOR_ANTROPOMETRICO` contiene las categorías/nomenclaturas. Esto puede servir como fuente de información existente para A.I., evitando redigitación cuando el dato requerido ya exista.

## 8.4 Servicios

`CAF_SERVICIO_CLIENTE` relaciona persona, servicio, tipo de cliente, período y mes. `CAF_SERVICIO` define el servicio. La vista `uV_ListarClientesServicios` construye una lectura extensa combinando persona, familia, establecimiento y servicio.

## 8.5 Traslados ya existentes

El esquema documenta `CAF_CAT_TIPO_TRASLADO`, `CAF_DETALLE_TRASLADO` y `CAF_GENERACION_CLAVE`, además del `SP_Traslado_Persona_Expediente`. Esto demuestra que SIDINACC ya contempla traslado de expedientes/personas entre establecimientos, OL o regiones.

> Para SIA no debemos asumir que “traslado de expediente” equivale al flujo de “continuidad del caso A.I.”. Debemos reutilizar identificadores/eventos cuando sea útil, pero mantener clara la semántica propia de A.I.

---

# 9. Objetos visibles en diagramas pero sin ficha completa en 5.6

El modelo gráfico incluye más objetos que los detallados como tablas en el diccionario. Esto importa si se pretende recrear la estructura.

| Objeto | Fuente | Campos visibles / evidencia | Función aparente |
| --- | --- | --- | --- |
| `RCS_VARIABLES_ENTORNO` | Diagrama pág. 14 | VAE\_idRegistro; VAE\_periodoActual; VAE\_periodoAnterior; VAE\_directorioNacional (visibles en el diagrama). | Parámetros globales/entorno. |
| `RCS_USUARIOS` | Diagrama pág. 14 | RCS\_idUsuario; RCS\_login; RCS\_nombre; RCS\_clave. | Usuarios del entorno. |
| `CAF_PAR_OTROS_CRITERIOS_PRIORIDAD` | Diagrama pág. 14 | OCP\_Codigo; RCS\_idPeriodo; OCP\_Descripcion. | Criterios adicionales de prioridad CAH. |
| `CAF_PAR_RANGO_PRIORIDAD` | Diagrama pág. 14 | PAR\_idRegistro; PAR\_idPrioridad; RCS\_idPeriodo; PAR\_rangoIni; PAR\_rangoFin. | Rangos de prioridad CAH. |
| `CAF_CAT_CLASIFICACION` | Diagramas págs. 13-14 / SP catálogos | CAT\_idClasificacion; SNB\_codigo; SNB\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Catálogo usado por establecimientos. |
| `CAF_CAT_PROYECCION` | Diagrama pág. 14 / SP catálogos | CAT\_idProyeccion; SNB\_codigo; SNB\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Catálogo de proyección. |
| `CAF_CAT_ESTATUS_FAMILIAR` | Diagrama pág. 13 | CAT\_idEstatus; SNB\_codigo; SNB\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Aparece en ER, sin ficha propia en 5.6. |
| `CAF_CAT_JORNADA_ESTABLECIMIENTO` | Diagrama pág. 13 | CAT\_idJornadaEstablecimiento; SNB\_codigo; SNB\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Aparece vinculada a PMS/Aula. |
| `PMS_AULA_ETARIO` | Diagrama pág. 13 | AUE\_idRegistro; ESC\_idRegistro; CAT\_idGrupoEtario; CAT\_idJornadaEstablecimiento; AUE\_Cantidad; RCS\_idPeriodo; BIT\_eliminado. | PMS, distribución por grupo etario/aula. |
| `PMS_GRUPO_ETARIO_RANGO` | Diagrama pág. 13 | GER\_idRegistro; GER\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Rangos de grupo etario. |
| `PMS_CAT_META` | Diagrama pág. 13 | CAT\_idMeta; SNB\_codigo; SNB\_descripcion; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Catálogo PMS. |
| `PMS_VARIABLE_META` | Diagrama pág. 13 | VAM\_idVariable; CAT\_idMeta; VAM\_descripcion; VAM\_tipo. | Variables de meta. |
| `PMS_DETALLE_META` | Diagrama pág. 13 | DEM\_idDetalle; VAM\_idVariable; DEM\_anno; CAT\_idRegion; DEM\_cantidad; BIT\_eliminado; BIT\_usuarioModifica; BIT\_fechaCreacion. | Detalle anual/regional de metas. |
| `RCS_PROGRAMA` | Diagrama pág. 13 | INS\_idCodigo; PRO\_idPrograma; PRO\_descripcion. | Programa institucional. |
| `RCS_INSTITUCION` | Diagrama pág. 13 | INS\_idCodigo; INS\_descripcion. | Instituciones. |
| `RCS_BENEFICIOS` | Diagrama pág. 13 | INS\_idCodigo; PRO\_idPrograma; BEN\_idBeneficio; BEN\_descripcion. | Beneficios por programa/institución. |

Estos objetos deben considerarse en una réplica “fiel” aunque el manual no documente todos sus tipos, PK/FK o métodos. En esos casos, el PDF por sí solo no permite reconstruir DDL exacto; el esquema real/backup de pruebas será la fuente final.

---

# 10. Vistas

El manual documenta **10 nombres funcionales de vistas** (con una repetición de `uV_ListarPadron` y una inconsistencia singular/plural en la vista PMS).

| Vista | Página(s) | Propósito | Dependencias principales |
| --- | --- | --- | --- |
| `uV_ListaMenor` | 65-66 | Lista datos del menor, madre, padre, encargado, población, condición al nacer, rezago, madre adolescente, referencia, período y auditoría. | CAF\_MENOR; CAF\_PERSONA; CAF\_CAT\_POBLACION; CAF\_CAT\_CONDICION\_NACER; CAF\_CAT\_REFERENCIA |
| `uV_ListarPadron` | 66-67 y nuevamente 75 | Búsqueda de persona contra base externa de Padrón/Registro Nacional por identificación o apellidos/nombre. | PADRON.dbo.Nacionales |
| `uV_COMITES_ListarComitesActivos` | 67-68 | Comités activos, vencimiento, establecimiento y vigencia. | COMITES.dbo.COM\_COMITE; COMITES.dbo.COM\_JUNTA\_DIRECTIVA; F\_CALCULA\_VIGENCIA |
| `uV_ListarClientesServicios` | 68-70 aprox. | Vista amplia para clientes menores con servicio: datos personales, familia, establecimiento, ubicación, período, pobreza, prioridad derivada, servicio, edad y otros datos. | CAF\_SERVICIO\_CLIENTE; CAF\_PERSONA; CAF\_PERSONA\_DETALLE; CAF\_FAMILIA; CAF\_FAMILIA\_DETALLE; CAF\_MENOR; CAF\_SERVICIO; RCS\_ESTABLECIMIENTO; catálogos |
| `uV_ListarEstablecimiento` | 71-72 aprox. | Información consolidada del establecimiento y su jerarquía/ubicación. | RCS\_ESTABLECIMIENTO; CAF\_CAT\_OFICINA\_LOCAL; CAF\_CAT\_REGION; CAF\_CAT\_TIPO\_ESTABLECIMIENTO; RCS\_PROVINCIA/CANTON/DISTRITO/POBLADO |
| `uV_ListarEstablecimientoIntranet` | 72-73 aprox. | Versión de establecimientos consumida desde Excel/Intranet vía ODBC. | RCS\_ESTABLECIMIENTO y catálogos/recursos territoriales |
| `uV_ListarFamilia` | 74 aprox. | Datos resumidos de expediente familiar: establecimiento, familia, año, folder y estado. | CAF\_FAMILIA; CAF\_FAMILIA\_DETALLE; RCS\_ESTABLECIMIENTO |
| `uV_ListarMenor` | 74-75 aprox. | Otra vista/listado del menor con relaciones familiares y catálogos. | CAF\_MENOR; CAF\_PERSONA; CAF\_CAT\_POBLACION; CAF\_CAT\_CONDICION\_NACER; CAF\_CAT\_REFERENCIA |
| `uV_ListarPersona` | 75-76 | Lista persona con nombre, expediente/familia, estado y establecimiento/año/folder derivados. | CAF\_PERSONA; CAF\_FAMILIA |
| `uV_SUM_VariablesProyeccion` | 76 | Estructura agregable para PMS: establecimiento, variable, cantidad, año, OL y región. El encabezado del manual aparece en singular `uV_SUM_VariableProyeccion`, pero el SQL crea el nombre plural. | PMS\_PROYECCION; RCS\_ESTABLECIMIENTO; CAF\_CAT\_OFICINA\_LOCAL |

## 10.1 Dependencias externas reveladas por las vistas

- `uV_ListarPadron` consulta `PADRON.dbo.Nacionales`, una base externa al SIDINACC alojada en el mismo servidor SQL según el manual.
- `uV_COMITES_ListarComitesActivos` consulta la base **COMITES** y una función `F_CALCULA_VIGENCIA`.
- `uV_ListarEstablecimientoIntranet` está pensada para consumo mediante **ODBC + Excel**.

Estas dependencias demuestran que SIDINACC ya utiliza integración entre bases dentro del mismo servidor y consumos externos vía vistas.

---

# 11. Triggers y auditoría

El manual documenta siete triggers sobre tablas centrales:

| Trigger | Tabla | Eventos |
| --- | --- | --- |
| `tr_Familia` | `CAF_FAMILIA` | INSERT / UPDATE / DELETE |
| `tr_Detalle_Familia` | `CAF_FAMILIA_DETALLE` | INSERT / UPDATE / DELETE |
| `tr_Menor` | `CAF_MENOR` | INSERT / UPDATE / DELETE |
| `tr_Mujer` | `CAF_MUJER` | INSERT / UPDATE / DELETE |
| `tr_servicioCliente` | `CAF_SERVICIO_CLIENTE` | INSERT / UPDATE / DELETE |
| `tr_Persona` | `CAF_PERSONA` | INSERT / UPDATE / DELETE |
| `tr_PersonaDetalle` | `CAF_PERSONA_DETALLE` | INSERT / UPDATE / DELETE |

Todos comparten el mismo código base. El trigger:

1. identifica si la operación es Insert, Update o Delete;
2. determina la PK de la tabla mediante `INFORMATION_SCHEMA`;
3. recorre las columnas modificadas;
4. genera un registro por cada campo afectado;
5. escribe el resultado en `BINNACLE..LOGTRANSACCIONES`.

Los datos de auditoría descritos incluyen:

- tipo de transacción;
- tabla;
- llave primaria;
- campo modificado;
- valor original;
- valor nuevo;
- fecha de transacción;
- usuario.

### Implicación para SIA

La auditoría a nivel de campo es un patrón institucional existente. El módulo A.I. debería conservar al menos trazabilidad equivalente para sus entidades sensibles, aunque la implementación concreta de auditoría pueda diseñarse de manera más moderna.

---

# 12. Restricciones especiales e índices

## 12.1 Restricciones especiales

La sección 5.9 indica explícitamente que **no existen restricciones especiales disparadas por triggers o constraints que ejecuten rollback ante inclusiones/errores**.

Esto no significa que no existan PK/FK: el diccionario sí documenta muchas relaciones referenciales. Significa que el manual no describe reglas adicionales de negocio implementadas como constraints/triggers de validación.

## 12.2 Índices

El manual menciona la nomenclatura institucional de índices dentro de la estandarización, pero **no incluye un inventario de índices ni scripts **`CREATE INDEX` para esta base. Por tanto, no podemos reconstruir los índices reales a partir de este PDF.

Para una réplica de desarrollo se pueden crear primero PK/FK y, posteriormente, definir índices de búsqueda según los patrones de SIA (identificación, nombre, ámbito, estado, fechas), sin afirmar que sean los mismos de producción.

---

# 13. Funciones y Stored Procedures

La sección 5.10 documenta **1 función principal + 21 procedimientos almacenados/objetos SP de operación y reporte** listados abajo.

| Objeto | Tipo | Entradas principales | Propósito | Dependencias principales |
| --- | --- | --- | --- | --- |
| `F_CALCULA_EDAD` | Función | Nacimiento, unidad A/M/D y período | Calcula edad al último día del período utilizando `CAF_PAR_ULTIMO_DIA`. | CAF\_PAR\_ULTIMO\_DIA |
| `SP_Calcula_Edad` | SP | PER\_idPersona, período, tipo de retorno | Obtiene fecha de nacimiento de la persona y retorna edad en años/meses/días. | CAF\_PERSONA |
| `SP_Calcula_Tipo_Persona` | SP | PER\_idPersona, período | Clasifica tipo de persona según edad/sexo mediante reglas del módulo. | CAF\_PERSONA |
| `SP_Desactiva_Meses` | SP | Mes | Desactiva meses transcurridos para impedir asignación de servicios en meses cerrados. | RCS\_MES\_ANUAL |
| `SP_Evaluaciones_Menor` | SP | Persona, fecha, período, edad, peso, talla, estados nutricionales, operación, usuario | CRUD lógico de evaluaciones del menor. | CAF\_EVALUACION\_MENOR |
| `SP_In_Activa_Mes` | SP | Mes | Modifica/activa-desactiva control mensual. El manual lo asocia con ejecución el primer día de mes. | RCS\_MES\_ANUAL |
| `SP_Mantenimiento_Catalogos` | SP | Operación, tabla catálogo, id, código, descripción, usuario | CRUD genérico para múltiples catálogos CAF. | Más de 20 tablas `CAF_CAT_*` |
| `SP_Mantenimiento_Establecimiento` | SP | Datos completos de establecimiento + operación | CRUD lógico de establecimientos. | RCS\_ESTABLECIMIENTO |
| `SP_Mantenimiento_Establecimiento_Caracteristica` | SP | Establecimiento, aula, características, jornadas + operación | CRUD de características/aulas del establecimiento. | RCS\_ESTABLECIMIENTO\_CARACTERISTICA |
| `SP_Mantenimiento_Familia` | SP | Establecimiento, año, folder, familia, usuario, operación | CRUD lógico de expediente/familia y retorno de identidad. | CAF\_FAMILIA |
| `SP_Mantenimiento_Familia_Detalle` | SP | Familia, geografía, dirección, teléfonos, hogar, área, ingresos, miembros, per cápita, fechas, establecimiento, período, pobreza, usuario, operación | CRUD lógico del detalle familiar. | CAF\_FAMILIA\_DETALLE |
| `SP_Mantenimiento_Menor` | SP | Persona, madre/padre/encargado, población, condición al nacer, rezago, madre adolescente, referencia, período, usuario, operación | CRUD lógico de menor. | CAF\_MENOR |
| `SP_Mantenimiento_Mujer` | SP | Persona, estado fisiológico, adolescente, control prenatal, alto riesgo, período, usuario, operación | CRUD lógico de mujeres gestantes/lactantes. | CAF\_MUJER |
| `SP_Mantenimiento_Persona` | SP | Identificación, beneficiario, nombres, nacionalidad, nacimiento, etnia, migración, familia, sexo, usuario, operación | CRUD lógico de persona. | CAF\_PERSONA |
| `SP_Mantenimiento_Persona_Detalle` | SP | Persona, educación, ocupación, jornada, seguro, ingresos, beneficiario, establecimiento, fumador, período, estado civil, discapacidad, usuario, operación | CRUD lógico de detalle cambiante por período. | CAF\_PERSONA\_DETALLE |
| `SP_Mantenimiento_Region_Oficina_Local` | SP | Operación, tipo catálogo, ids, contacto, ubicación, descripción, usuario | CRUD de regiones y oficinas locales. | CAF\_CAT\_REGION; CAF\_CAT\_OFICINA\_LOCAL |
| `SP_Mantenimiento_Servicio_Cliente` | SP | Persona + lista XML de servicios | Administra servicios de clientes; usa XML para lista de servicios. | CAF\_SERVICIO\_CLIENTE |
| `SP_Siguiente_Consecutivo` | SP | Establecimiento | Calcula siguiente consecutivo para nuevo establecimiento. | RCS\_ESTABLECIMIENTO |
| `SP_Token` | SP | Token, operación | Inserta/gestiona token proveniente de SINIRUBE. | RCS\_TOKEN |
| `SP_Traslado_Persona_Expediente` | SP | Establecimiento, año, folder, persona, usuario | Reactiva persona eliminada lógicamente y la traslada a otro expediente activo. | CAF\_FAMILIA; CAF\_PERSONA; CAF\_PERSONA\_DETALLE |
| `SP_Verifica_TOKEN` | SP | Sin parámetros | Calcula edad del token y elimina de `RCS_TOKEN` si supera 23 horas. | RCS\_TOKEN |
| `SPrpt_ListarServicioClientes` | SP de reporte | Mes, período, establecimiento | Lista clientes con servicio activo para reportería. | uV\_ListarClientesServicios; RCS\_ESTABLECIMIENTO |

## 13.1 Patrón de los SP de mantenimiento

Varios procedimientos siguen un patrón común:

- `@pTipo_Operacion` define inserción/modificación/eliminación;
- eliminación suele ser lógica (`BIT_eliminado`);
- se pasa usuario que modifica;
- se usan transacciones/validaciones de error;
- se retorna identidad o `-1` en varios flujos;
- la aplicación concentra bastante lógica de persistencia en Stored Procedures.

## 13.2 SP referenciados pero no desarrollados completamente en 5.10

En las fichas PMS aparecen dependencias como:

- `SP_PMS_Nivel_Primario`;
- `SP_PMS_Nivel_Secundario`;
- `SP_PMS_Proyeccion`;
- `SP_PMS_Variable_Proyeccion`;
- `SP_PMS_frmVariableProyeccion`.

El manual los menciona como métodos/dependencias, pero no presenta su código completo dentro de la sección 5.10 analizada.

---

# 14. Tareas programadas

## 14.1 Back UP Database – SIDINACC

- Tipo: backup FULL.
- Horario: **todos los días a las 5:00 a.m.**
- Destino documentado: `C:\Backup_Data_Base\BAK_SIDINACC.bak`.
- Consecuencia documentada si falla: pérdida potencial de información de **24 a 48 horas**.
- Consideración de ejecución manual: no deberían existir transacciones en ejecución.

## 14.2 SP\_Verifica\_Token\_Vencido

- Frecuencia: **cada 30 minutos**.
- Finalidad: invalidar/eliminar token de SINIRUBE cuando supera su vida útil para forzar obtención de uno nuevo.
- El manual indica una ejecución `EXEC SP_Verifica_Token_Vencido`.

## 14.3 Control mensual mencionado fuera de 5.11

`RCS_MES_ANUAL` y `SP_In_Activa_Mes` describen además una ejecución automática el **día 1 de cada mes a las 12:05 a.m.** para desactivar el mes vencido. Sin embargo, esa tarea no aparece como ficha independiente en 5.11.

---

# 15. Respaldo

- Servidor de BD documentado: `172.17.1.24` / `Cen-Cinai-MS`.
- Directorio de backups: `C:\Backup_Data_Base`.
- Base a respaldar: `SIDINACC`.
- Extensión: `.bak`.
- Convención: `BAK_<nombre lógico BD>.bak`; ejemplo `BAK_SIDINACC.bak`.

Para el desarrollo local del proyecto no necesitamos reproducir la infraestructura física, pero sí conviene adoptar una política reproducible de respaldo/seed/migraciones para las dos bases de desarrollo.

---

# 16. Inconsistencias y puntos de calidad detectados en el manual

Estas observaciones son importantes para no copiar errores documentales a nuestra réplica:

1. **Versión del manual:** los encabezados muestran “Versión 1”, pero el registro de cambios incluye una “Versión 2” del 06/06/2023 para versiones SQL/programación.
2. **Windows Server:** el texto prescribe Windows Server 2019 o superior, mientras una captura de infraestructura muestra Windows Server 2016 Datacenter.
3. `CAF_MUJER`**:** su ficha de tabla reproduce descripción y campos de `CAF_MENOR`. En cambio, `SP_Mantenimiento_Mujer` revela campos propios de mujer (`MUJ_idRegistroMujer`, estado fisiológico, control prenatal, embarazo de alto riesgo, etc.). La ficha de tabla debe considerarse corrupta/incompleta.
4. `RCS_PROVINCIA`**:** la ficha de la página 59 repite los campos/explicación de `RCS_POBLADO`, mientras el ER de la página 13 muestra `COD_PROVINCIA` y `NOM_PROVINCIA`. Es un error evidente de documentación.
5. `CAF_CAT_CONDICION_MIGRATORIA`**:** la descripción textual habla de tipo de centro/establecimiento, pero los valores son condición migratoria. Parece texto copiado de otro catálogo.
6. `CAF_CAT_REGION.REG_nombre`**:** la ficha indica `Tinyint`, aunque el propio catálogo muestra nombres de región. Debe verificarse en el esquema real.
7. `RCS_ESTABLECIMIENTO.COD_provincia`**:** aparece como `char(1)`, mientras otros objetos territoriales usan códigos de longitud 2. Debe verificarse en la BD real.
8. `uV_ListarPadron`**:** aparece documentada dos veces en la sección de vistas.
9. **Vista PMS:** el encabezado dice `uV_SUM_VariableProyeccion`, pero el script crea `uV_SUM_VariablesProyeccion`.
10. **Token job:** 5.11 llama `SP_Verifica_Token_Vencido`, mientras el procedimiento documentado es `SP_Verifica_TOKEN`. Puede tratarse de un job que llama otro SP o de una inconsistencia de nombre.
11. **Triggers:** la metodología general prescribe prefijo `TR_`, pero los objetos reales usan `tr_`/nombres mixtos.
12. **Metadatos de tipo/longitud:** existen filas con combinaciones extrañas (por ejemplo longitudes para `datetime`/`tinyint`). Para una réplica exacta hay que obtener DDL o consultar `INFORMATION_SCHEMA`, no confiar ciegamente en cada celda del PDF.
13. **Explicación de **`CAF_FAMILIA_DETALLE`**:** repite parte de la explicación de `CAF_FAMILIA`, por lo que la semántica debe tomarse de sus campos/relaciones y no solo del texto.

---

# 17. Qué reutilizar para SIA-CENCINAI

## 17.1 Fuente institucional / lectura

| Necesidad SIA | Fuente probable en SIDINACC/CAH | Observación |
| --- | --- | --- |
| Identificación y nombre | `CAF_PERSONA` / `uV_ListarPersona` / `uV_ListarPadron` | Base de búsqueda por cédula/nombre. |
| Fecha nacimiento / sexo / nacionalidad | `CAF_PERSONA` | Datos maestros. |
| Familia/expediente | `CAF_FAMILIA`, `CAF_FAMILIA_DETALLE` | Contexto familiar y establecimiento. |
| Encargado/madre/padre | `CAF_MENOR` + `CAF_PERSONA` | Reutilizable para contexto del menor. |
| Educación/ocupación/seguro/discapacidad | `CAF_PERSONA_DETALLE` | Historizado por período. |
| Peso/talla/estado nutricional | `CAF_EVALUACION_MENOR`, `CAF_INDICADOR_ANTROPOMETRICO` | Posible fuente para vigilancia y alertas. |
| Servicio activo | `CAF_SERVICIO_CLIENTE` | Permite saber servicios/mes/período. |
| Región | `CAF_CAT_REGION` | Ámbito jerárquico. |
| Oficina Local | `CAF_CAT_OFICINA_LOCAL` | Ámbito jerárquico. |
| Establecimiento | `RCS_ESTABLECIMIENTO` | Ámbito jerárquico y filtros. |
| Provincia/cantón/distrito/poblado | `RCS_PROVINCIA`, `RCS_CANTON`, `RCS_DISTRITO`, `RCS_POBLADO` | Geografía. |
| Período institucional | `RCS_PERIODO` | Historial anual. |
| Traslado institucional | `CAF_DETALLE_TRASLADO`, `CAF_GENERACION_CLAVE`, `SP_Traslado_Persona_Expediente` | Referencia para analizar continuidad, no equivalencia automática con A.I. |

## 17.2 Datos que no debemos confundir con conceptos A.I.

- `CAF_PAR_PRIORIDAD`** / prioridad CAH:** corresponde a criterios de selección/características familiares; no es la prioridad A.I. Urgencia/Alto/Moderado/Bajo.
- `CAF_CAT_REFERENCIA`**:** registra institución que refiere a servicios CEN-CINAI; no debe asumirse igual a la nueva referencia interna de A.I.
- `CAF_CAT_TIPO_TRASLADO`**:** describe traslado de expediente institucional; el caso A.I. tiene reglas propias de cierre/continuidad.
- `CAF_SALUD`**:** el manual dice expresamente que conserva datos históricos pero no está habilitada en la versión actual. No conviene basar la integración nueva en esa tabla.

---

# 18. Arquitectura de datos de trabajo propuesta para el proyecto

Esta sección es **propuesta de proyecto**, no descripción del manual.

```
┌─────────────────────────────────────┐
│ BD SIDINACC simulada / espejo local │
│ - estructura institucional relevante│
│ - datos 100% sintéticos             │
└──────────────────┬──────────────────┘
                   │ lectura/referencia
                   ▼
┌─────────────────────────────────────┐
│            SIA-CENCINAI             │
│ capa de integración / servicios     │
└──────────────────┬──────────────────┘
                   │
                   ▼
┌─────────────────────────────────────┐
│      BD propia SIA-CENCINAI         │
│ casos, sesiones, valoraciones,      │
│ atenciones, planes, documentos,     │
│ programación, reportes, traslados   │
└─────────────────────────────────────┘
```

## 18.1 Principios

1. La réplica SIDINACC sirve como **placeholder de integración** y fuente de datos maestros.
2. Se llena exclusivamente con datos sintéticos.
3. El módulo A.I. no debe modificar tablas institucionales simuladas salvo que el flujo de integración real así lo requiera en el futuro.
4. Los datos propios de A.I. se guardan en una BD separada bajo nuestro control.
5. La relación entre ambas debe hacerse mediante identificadores institucionales estables.
6. Evitar duplicar información maestra; si se duplica, documentar si es caché, snapshot o valor histórico.
7. Diseñar el acceso de forma desacoplada para reemplazar la BD simulada por la conexión/integración de pruebas cuando esté disponible.

---

# 19. Qué podemos reconstruir exactamente y qué no solo con este PDF

## Podemos reconstruir con alto nivel de fidelidad

- nombres de las 57 tablas documentadas;
- campos, tipos/longitudes según el manual;
- nulabilidad indicada;
- PK/FK indicadas;
- Identity indicadas;
- relaciones nombradas;
- vistas con su SQL;
- triggers documentados;
- función y SP documentados;
- jobs documentados;
- estructura lógica general;
- catálogos/valores principales;
- patrones de auditoría y eliminación lógica.

## No podemos garantizar únicamente desde el PDF

- índice real completo;
- todos los defaults/check constraints;
- DDL exacto de objetos que solo aparecen en diagramas;
- permisos/roles SQL;
- estadísticas;
- cantidad real de registros;
- triggers/objetos que existan en producción pero no estén documentados;
- corrección de las fichas inconsistentes;
- versión exacta del esquema actualmente desplegado en 2026.

Para la réplica local, la estrategia correcta será: **crear primero desde este manual y corregir/afinar cuando podamos inspeccionar el entorno de pruebas real**.

---

# 20. Próximos pasos técnicos

1. Convertir este inventario a scripts `CREATE TABLE` para una BD local de simulación.
2. Separar objetos “necesarios para SIA” de objetos “solo necesarios para fidelidad total del espejo”.
3. Crear seed sintético para Región → OL → Establecimiento → Familia → Persona → Menor/Servicios/Evaluaciones.
4. Construir un ER limpio de la réplica institucional.
5. Diseñar el ER propio de SIA-CENCINAI a partir de HU/RF/CU v0.3.
6. Definir el contrato de integración entre ambas bases (identificadores, consultas y DTOs/servicios).
7. Implementar acceso a datos detrás de una capa desacoplada para poder sustituir el mirror local por el ambiente institucional de pruebas más adelante.

---

# 21. Anexo A — Diccionario estructural completo de tablas documentadas

> Las siguientes fichas reproducen la estructura **según el manual**. Cualquier anomalía del documento fuente se conserva y, cuando es importante, se comenta en la sección 16.

## A.1 `CAF_CAT_AREA_ATRACCION`

**Página fuente:** 15  
**Descripción del manual:** Tabla Catálogo que nos permite identificar el área de atracción a la que pertenece la familia

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idAreaAtraccion` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_AREA_ATRACCION`

## A.2 `CAF_CAT_ASEGURAMIENTO`

**Página fuente:** 16  
**Descripción del manual:** Tabla Catálogo que nos permite identificar el aseguramiento por medio de la CCSS que posee la persona

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idAseguramiento` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_ASEGURAMIENTO`

## A.3 `CAF_CAT_CONDICION_MIGRATORIA`

**Página fuente:** 15  
**Descripción del manual:** Tabla Catálogo que permite identificar el tipo de centro o establecimiento, su clasificación según el servicio que brinda.

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idCondicionMigratoria` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_CAF_CAT_CONDICION_MIGRATORIA`

## A.4 `CAF_CAT_CONDICION_NACER`

**Página fuente:** 17  
**Descripción del manual:** Tabla Catálogo que nos permite identificar condición en la que el cliente nació

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idCondicionNacer` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_MENORES_CAF_CAT_CONDICION_NACER`

## A.5 `CAF_CAT_Estado_Civil`

**Página fuente:** 17  
**Descripción del manual:** Tabla Catálogo que nos permite asignar un estado civil a una persona

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idEstadoCivil` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_ESTADO_CIVIL`

## A.6 `CAF_CAT_ESTADO_FISIOLOGICO`

**Página fuente:** 18  
**Descripción del manual:** Tabla Catálogo que nos permite asignar un estado fisiológico

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idEstadoFisiologico` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_MUJERES_CAF_CAT_ESTADO_FISIOLOGICO`

## A.7 `CAF_CAT_ETNIA`

**Página fuente:** 18  
**Descripción del manual:** Tabla Catálogo que nos permite asignar una Etnia a la persona

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idEtnia` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos Dirección Nacional de CEN-CINAI DIRECCIÓN DE INFORMACIÓN / UNIDAD DE TECNOLOGÍAS DE                     Fecha: 19/02/2021    Versión: 1 INFORMACIÓN Y COMUNICACIÓN

**Relaciones documentadas:**

- `FK_CAF_PERSONA_CAF_CAT_ETNIA`

## A.8 `CAF_CAT_JORNADA_LABORAL`

**Página fuente:** 19  
**Descripción del manual:** Tabla Catálogo que nos permite asignar e identificar la jornada laboral de la persona

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idJornadaLaboral` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_JORNADA_LABORAL`

## A.9 `CAF_CAT_MIDEPLAN`

**Página fuente:** 20  
**Descripción del manual:** Tabla Catálogo que nos permite asignar según la región por medio de la división territorial de MIDEPLAN

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idMideplan` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.10 `CAF_CAT_NIVEL_EDUCATIVO`

**Página fuente:** 20  
**Descripción del manual:** Tabla Catálogo que permite registrar todos los niveles educativos que existen

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idNivelEducativo` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_CAT_OTRO_NIVEL_EDUCATIVO_CAF_CAT_NIVEL_EDUCATIVO`

## A.11 `CAF_CAT_OFICINA_LOCAL`

**Página fuente:** 22  
**Descripción del manual:** Tabla Catálogo que nos registrar las oficinas locales con que cuenta CEN CINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idOficinaLocal` | `Int` | No | PK | Si +1 |
| `CAT_idRegion` | `Tinyint` | No | — | — |
| `OFL_telefono` | `varchar (100)` | Si | — | — |
| `OFL_fax` | `numeric (18, 0)` | Si | — | — |
| `OFL_correo` | `Varchar (50)` | Si | — | — |
| `COD_PROVINCIA` | `Char (2)` | Si | FK | — |
| `COD_CANTON` | `Char (2)` | Si | FK | — |
| `COD_DISTRITO` | `Char (2)` | Si | FK | — |
| `OFL_avenida` | `Char (4)` | Si | — | — |
| `OFL_calle` | `Char (4)` | Si | — | — |
| `OFL_coordenadaX` | `Varchar (50)` | Si | — | — |
| `OFL_coordenadaY` | `Varchar (50)` | Si | — | — |
| `OFL_descripcion` | `Varchar (200)` | Si | — | — |
| `OFL_observaciones` | `Varchar (200)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Region\_Oficina\_Local

**Relaciones documentadas:**

- `FK_CAF_CAT_OFICINA_LOCAL_CAF_CAT_REGION`
- `FK_RCS_ESTABLECIMIENTO_CAF_CAT_OFICINA_LOCAL`

## A.12 `CAF_CAT_POBLACION`

**Página fuente:** 23  
**Descripción del manual:** Tabla Catálogo que permite identificar a que población pertenece el niño

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idPoblacion` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_MENORES_CAF_CAT_POBLACION`

## A.13 `CAF_CAT_POBREZA`

**Página fuente:** 13  
**Descripción del manual:** Tabla Catálogo que permite identificar los tipos de pobreza que están habilitados

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idPobreza` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_POBREZA`

## A.14 `CAF_CAT_REFERENCIA`

**Página fuente:** 24  
**Descripción del manual:** Tabla Catálogo que permite identificar las diferentes instituciones que puede referir a una persona a los servicios de CEN CINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idReferial` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_MENORES_CAF_CAT_REFERENCIA`

## A.15 `CAF_CAT_REGION`

**Página fuente:** 25  
**Descripción del manual:** Tabla Catálogo que nos permite registrar las regiones disponibles en CEN CINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idRegion` | `Int` | No | PK | Si +1 |
| `REG_nombre` | `Tinyint` | No | — | — |
| `REG_telefono` | `varchar (100)` | Si | — | — |
| `REG_fax` | `numeric (18, 0)` | Si | — | — |
| `REG_correo` | `Varchar (50)` | Si | — | — |
| `COD_PROVINCIA` | `Char (2)` | Si | FK | — |
| `COD_CANTON` | `Char (2)` | Si | FK | — |
| `COD_DISTRITO` | `Char (2)` | Si | FK | — |
| `REG_avenida` | `Char (4)` | Si | — | — |
| `REG_calle` | `Char (4)` | Si | — | — |
| `REG_coordenadaX` | `Varchar (50)` | Si | — | — |
| `REG_coordenadaY` | `Varchar (50)` | Si | — | — |
| `REG_descripcion` | `Varchar (200)` | Si | — | — |
| `REG_observaciones` | `Varchar (200)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Region\_Oficina\_Local

**Relaciones documentadas:**

- `FK_CAF_CAT_OFICINA_LOCAL_CAF_CAT_REGION`

## A.16 `CAF_CAT_SEXO`

**Página fuente:** 26  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de sexo registrados

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idSexo` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_CAF_CAT_SEXO`

## A.17 `CAF_CAT_TIPO_CLIENTE`

**Página fuente:** 26  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de clientes que maneja CEN CINAI en sus servicios

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoCliente` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_SERVICIOS_CLIENTES_CAF_CAT_TIPO_CLIENTE`

## A.18 `CAF_CAT_TIPO_DISCAPACIDAD`

**Página fuente:** 27  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de discapacidad registrados por SINIRUBE

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoDiscapacidad` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_TIPO_DISCAPACIDAD`

## A.19 `CAF_CAT_TIPO_ESTABLECIMIENTO`

**Página fuente:** 28  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de establecimientos registrados por CENCINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoEstablecimiento` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_RCS_ESTABLECIMIENTO_CAF_CAT_TIPO_ESTABLECIMIENTO`

## A.20 `CAF_CAT_TIPO_HOGAR`

**Página fuente:** 28  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de hogar registrados por CENCINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoHogar` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_TIPO_HOGAR`

## A.21 `CAF_CAT_TIPO_IDENTIFICACION`

**Página fuente:** 29  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de identificación registrados por SINIRUBE

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoIdentificacion` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.22 `CAF_CAT_TIPO_OCUPACION`

**Página fuente:** 29  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de Ocupación registrados por SINIRUBE

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoOcupacion` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_TIPO_OCUPACION`

## A.23 `CAF_CAT_TIPO_TRASLADO`

**Página fuente:** 38  
**Descripción del manual:** Tabla Catálogo que nos permite identificar los tipos de traslado registrados por CENCINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idTipoTraslado` | `Int` | No | PK | Si +1 |
| `SNB_codigo` | `Tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:**

- `FK_CAF_BOLETA_TRASLADO_CAF_CAT_TIPO_TRASLADO`

## A.24 `CAF_DETALLE_TRASLADO`

**Página fuente:** 39  
**Descripción del manual:** Tabla Detalle que nos permite registrar información de traslados de los expedientes entre oficinas y regiones

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `BOT_idBoleta` | `Int` | No | PK | — |
| `DET_usuarioCreacion` | `nvarchar (50)` | Si | — | — |
| `DET_usuarioVbProcede` | `nvarchar (50)` | Si | — | — |
| `GEC_idClaveProcede` | `nchar (10)` | Si | FK | — |
| `DET_fechaVbProcede` | `datetime (50)` | Si | — | — |
| `DET_hostVbProcede` | `nvarchar (50)` | Si | — | — |
| `DET_usuarioVbDestino` | `nvarchar (50)` | Si | — | — |
| `GEC_idClaveDestino` | `nchar (10)` | Si | FK | — |
| `DET_fechaVbDestino` | `datetime` | Si | — | — |
| `DET_hostVbDestino` | `nvarchar (50)` | Si | — | — |
| `DET_aprobadoProcede` | `bit` | Si | — | — |
| `DET_aprobadoDestino` | `bit` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar

**Relaciones documentadas:**

- `FK_CAF_DETALLE_TRASLADO_CAF_BOLETA_TRASLADO`

## A.25 `CAF_EVALUACION_MENOR`

**Página fuente:** 40  
**Descripción del manual:** Tabla Detalle que nos permite registrar información referente a la primera o variables evaluaciones que el niño debe tener registrada en el sistema.

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PER_idPersona` | `nvarchar (20)` | No | PK | — |
| `EVM_fechaEvaluacion` | `datetime (50)` | No | — | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | — | — |
| `EVM_edad` | `tinyint (10)` | Si | — | — |
| `EVM_peso` | `decimal (12,2)` | Si | — | — |
| `EVM_talla` | `decimal (12,2)` | Si | — | — |
| `EVM_estadoNutricionalPe` | `tinyint (50)` | Si | — | — |
| `EVM_estadoNutricionalPt` | `tinyint (10)` | Si | — | — |
| `EVM_estadoNutricionalTe` | `tinyint` | Si | — | — |
| `EVM_estadoNutricionalImc` | `tinyint (50)` | Si | — | — |
| `EVM_idEvaluacionMenor` | `int` | No | — | Si+1 |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | — | — | — |

**Método(s):** Insertar, modificar y eliminar

**Relaciones documentadas:**

- `FK_CAF_EVALUACION_MENOR_RCS_PERIODO`
- `FK_CAF_EVALUACION_MENORES_CAF_PERSONA`

## A.26 `CAF_FAMILIA`

**Página fuente:** 40  
**Descripción del manual:** Tabla Detalle que nos permite registrar información inicial de una familia.

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `EST_idEstablecimiento` | `nvarchar (20)` | No | — | — |
| `FAM_anno` | `datetime (50)` | No | — | — |
| `FAM_folder` | `numeric (18,0)` | No | — | — |
| `FAM_idFamilia` | `int` | No | PK | Si+1 |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del StoreProcedure: SP\_Mantenimiento\_Familia

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_CAF_FAMILIA`
- `FK_CAF_FAMILIA_RCS_ESTABLECIMIENTO`
- `FK_CAF_PERSONA_CAF_FAMILIA`

## A.27 `CAF_FAMILIA_DETALLE`

**Página fuente:** 13  
**Descripción del manual:** Tabla Detalle que nos permite registrar información completa referente a una familia.

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `FAD_idFamiliaDetalle` | `int` | No | PK | Si+1 |
| `FAM_idFamilia` | `int` | No | FK | — |
| `COD_provincia` | `char (2)` | Si | FK | — |
| `COD_canton` | `char (2)` | Si | FK | — |
| `COD_distrito` | `char (2)` | Si | FK | — |
| `FAD_direccion` | `varchar (100)` | Si | — | — |
| `FAD_telefonoUno` | `numeric (18,0)` | Si | — | — |
| `FAD_telefonoDos` | `numeric (18,0)` | Si | — | — |
| `CAT_idTipoHogar` | `int` | No | FK | — |
| `CAT_idAreaAtraccion` | `int` | No | FK | — |
| `FAD_totalIngresos` | `float` | Si | — | — |
| `FAD_totalMiembros` | `int` | Si | — | — |
| `FAD_ingresoPerCapita` | `float` | Si | — | — |
| `FAD_fechaSolicitud` | `datetime` | Si | — | — |
| `FAD_inActiva` | `bit` | Si | — | — |
| `EST_idEstablecimientoActual` | `int` | Si | — | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | — | — |
| `CAT_idPobreza` | `int` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del StoreProcedure: SP\_Mantenimiento\_Familia\_Detalle Dirección Nacional de CEN-CINAI DIRECCIÓN DE INFORMACIÓN / UNIDAD DE TECNOLOGÍAS DE                 Fecha: 19/02/2021       Versión: 1 INFORMACIÓN Y COMUNICACIÓN

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_AREA_ATRACCION`
- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_POBREZA`
- `FK_CAF_FAMILIA_DETALLE_CAF_CAT_TIPO_HOGAR`
- `FK_CAF_FAMILIA_DETALLE_CAF_FAMILIA`
- `FK_CAF_FAMILIA_DETALLE_RCS_DISTRITO`
- `FK_CAF_FAMILIA_DETALLE_RCS_PERIODO`

## A.28 `CAF_GENERACION_CLAVE`

**Página fuente:** 42  
**Descripción del manual:** Tabla de recurso de procesos.

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `GEC_fuente` | `tinyint` | No | PK | — |
| `BOT_idBoleta` | `int` | No | PK | — |
| `GEC_idClave` | `nchar (10)` | Si | — | — |
| `GEC_usuario` | `nvarchar (50)` | Si | — | — |
| `GEC_fecha` | `datetime` | Si | — | — |
| `GEC_host` | `nvarchar (50)` | Si | — | — |
| `GEC_ip` | `nchar (15)` | SI | — | — |

**Método(s):** Insertar por medio del StoreProcedure:

**Relaciones documentadas:**

- `FK_CAF_GENERACION_CLAVE_CAF_DETALLE_TRASLADO`

## A.29 `CAF_INDICADOR_ANTROPOMETRICO`

**Página fuente:** 43  
**Descripción del manual:** Tabla que contiene los indicadores según el estudio de CEN CINAI

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `ANT_id` | `int` | No | PK | Si+1 |
| `ANT_area` | `char (3)` | Si | — | — |
| `ANT_clasificacion` | `nvarchar (50)` | Si | — | — |
| `ANT_nomenclatura` | `nchar (6)` | Si | — | — |
| `BIT_eliminado` | `bit` | Si | — | — |

**Método(s):** Insertar por medio del StoreProcedure:

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.30 `CAF_MENOR`

**Página fuente:** 44  
**Descripción del manual:** Tabla que contiene los datos del niño que están recibiendo algún servicio por parte de CEN CINAI y son menores a 13 años

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `MEN_idRegistroMenor` | `int` | No | PK | Si+1 |
| `PER_idPersona` | `nvarchar (20)` | No | Fk | — |
| `MEN_idMadre` | `nvarchar (20)` | Si | Fk | — |
| `MEN_idPadre` | `nvarchar (20)` | Si | Fk | — |
| `MEN_idEncargado` | `nvarchar (20)` | No | Fk | — |
| `CAT_idPoblacion` | `int` | No | Fk | — |
| `CAT_idCondicionNacer` | `int` | No | Fk | — |
| `MEN_rezagoDesarrollo` | `bit` | Si | — | — |
| `MEN_hijoMadreAdolescente` | `bit` | Si | — | — |
| `CAT_idReferencia` | `int` | No | Fk | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | Fk | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modifica y elimina por medio del StoreProcedure: SP\_Mantenimiento\_Menor

**Relaciones documentadas:**

- `FK_CAF_MENORES_CAF_CAT_CONDICION_NACER`
- `FK_CAF_MENORES_CAF_CAT_POBLACION`
- `FK_CAF_MENORES_CAF_CAT_REFERENCIA`
- `FK_CAF_MENORES_CAF_PERSONA`

## A.31 `CAF_MUJER`

**Página fuente:** 44  
**Descripción del manual:** Tabla que contiene los datos del niño que están recibiendo algún servicio por parte de CEN CINAI y son menores a 13 años

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `MEN_idRegistroMenor` | `int` | No | PK | Si+1 |
| `PER_idPersona` | `nvarchar (20)` | No | Fk | — |
| `MEN_idMadre` | `nvarchar (20)` | Si | Fk | — |
| `MEN_idPadre` | `nvarchar (20)` | Si | Fk | — |
| `MEN_idEncargado` | `nvarchar (20)` | No | Fk | — |
| `CAT_idPoblacion` | `int` | No | Fk | — |
| `CAT_idCondicionNacer` | `int` | No | Fk | — |
| `MEN_rezagoDesarrollo` | `bit` | Si | — | — |
| `MEN_hijoMadreAdolescente` | `bit` | Si | — | — |
| `CAT_idReferencia` | `int` | No | Fk | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | Fk | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modifica y elimina por medio del StoreProcedure: SP\_Mantenimiento\_Menor

**Relaciones documentadas:**

- `FK_CAF_MENORES_CAF_CAT_CONDICION_NACER`
- `FK_CAF_MENORES_CAF_CAT_POBLACION`
- `FK_CAF_MENORES_CAF_CAT_REFERENCIA`
- `FK_CAF_MENORES_CAF_PERSONA`

## A.32 `CAF_NACIONALIDAD`

**Página fuente:** 45  
**Descripción del manual:** Tabla que contiene las nacionalidades disponibles a nivel mundial

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `NAC_idNacionalidad` | `int` | No | PK | — |
| `NAC_orden` | `int` | No | — | — |
| `COD_alfa2Pais` | `varchar (3)` | Si | — | — |
| `NAC_descripcion` | `varchar (50)` | Si | — | — |

**Método(s):** Inserción directa en base de datos

**Relaciones documentadas:**

- `FK_CAF_PERSONA_CAF_NACIONALIDAD`

## A.33 `CAF_PAR_PERCAPITA`

**Página fuente:** 46  
**Descripción del manual:** Tabla que contiene los rangos según los parámetros para identificar en que nivel de pobreza se encuentra, estos datos son actualizados por año por el INEC

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PER_idRegistro` | `int` | No | PK | Si+1 |
| `PER_geografia` | `char (1)` | No | — | — |
| `POB_idPobreza` | `int` | Si | FK | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | FK | — |
| `PER_MONTO_UNO` | `decimal (18,2)` | Si | — | — |
| `PER_MONTO_DOS` | `decimal (18,2)` | Si | — | — |
| `PER_inActivo` | `bit` | No | — | — |

**Método(s):** Inserción directa en base de datos

**Relaciones documentadas:**

- `FK_CAF_PAR_PERCAPITA_CAF_CAT_POBREZA`
- `FK_CAF_PAR_PERCAPITA_RCS_PERIODO`

## A.34 `CAF_PAR_PRIORIDAD`

**Página fuente:** 46  
**Descripción del manual:** Tabla parámetro que contiene los puntos a evaluar según el criterio técnico para identificar donde la familia logra obtener puntaje para calcular la prioridad

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PRI_seccion` | `nchar (3)` | No | PK | — |
| `PRI_codigo` | `tinyint` | No | PK | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | PK | — |
| `PRI_puntaje` | `tinyint` | Si | — | — |
| `PRI_posicion` | `tinyint (18,2)` | Si | — | — |
| `PRI_descripcion` | `varchar (50)` | Si | — | — |
| `PRI_nivel` | `nchar (3)` | Si | — | — |

**Método(s):** Inserción directa en base de datos

**Relaciones documentadas:**

- `FK_CAF_PAR_PRIORIDAD_RCS_PERIODO`

## A.35 `CAF_PAR_PUNTAJE_MAXIMO`

**Página fuente:** 47  
**Descripción del manual:** Tabla parámetro

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PUM_nivel` | `nchar (3)` | No | PK | — |
| `RCS_idPeriodo` | `numeric` | No | PK | — |
| `PUM_descripcion` | `nchar (100)` | Si | — | — |
| `PUM_puntajeMaximo` | `int` | Si | — | — |
| `PUM_posicion` | `int` | Si | — | — |

**Método(s):** Inserción directa en base de datos.

**Relaciones documentadas:**

- `FK_CAF_PAR_PUNTAJE_MAXIMO_RCS_PERIODO`

## A.36 `CAF_PAR_ULTIMO_DIA`

**Página fuente:** 48  
**Descripción del manual:** Tabla parámetro

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `RCS_idPeriodo` | `numeric (18,0)` | No | PK | — |
| `ULD_fecha` | `date` | No | — | — |

**Método(s):** Inserción directa en base de datos

**Relaciones documentadas:**

- `FK_RCS_PERIODO_CAF_PAR_ULTIMO_DIA`

## A.37 `CAF_PERSONA`

**Página fuente:** 49  
**Descripción del manual:** Tabla que almacena información de persona

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PER_idPersona` | `nvarchar(20) (18,0)` | No | PK | — |
| `PER_beneficiario` | `varchar(2)` | Si | — | — |
| `PER_apellidoUno` | `varchar(50)` | Si | — | — |
| `PER_apellidoDos` | `varchar(50)` | Si | — | — |
| `PER_nombre` | `varchar(50)` | Si | — | — |
| `NAC_idNacionalidad` | `int` | Si | FK | — |
| `PER_fechaNacimiento` | `datetime` | Si | — | — |
| `CAT_idEtnia` | `int` | No | FK | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `RCS_idPersona` | `int` | No | — | Si+1 |
| `CAT_idCondicionMigratoria` | `int` | Si | FK | — |
| `FAM_idFamilia` | `int` | Si | FK | — |
| `CAT_idSexo` | `int` | Si | FK | — |

**Método(s):** Insertar, modifica y elimina por medio del StoreProcedure: SP\_Mantenimiento\_Persona

**Relaciones documentadas:**

- `FK_CAF_DETALLE_OTROS_NIVELES_EDUCATIVOS_CAF_PERSONA`
- `FK_CAF_EVALUACION_MENORES_CAF_PERSONA`
- `FK_CAF_MENORES_CAF_PERSONA`
- `FK_CAF_MUJERES_CAF_PERSONA`
- `FK_CAF_PERSONA_CAF_CAT_CONDICION_MIGRATORIA`
- `FK_CAF_PERSONA_CAF_CAT_ETNIA`
- `FK_CAF_PERSONA_CAF_CAT_SEXO`
- `FK_CAF_PERSONA_CAF_FAMILIA`
- `FK_CAF_PERSONA_CAF_NACIONALIDAD`
- `FK_CAF_PERSONA_DETALLE_CAF_PERSONA`
- `FK_CAF_SALUD_CAF_PERSONA`
- `FK_CAF_SERVICIOS_CLIENTES_CAF_PERSONA`

## A.38 `CAF_PERSONA_DETALLE`

**Página fuente:** 50  
**Descripción del manual:** Tabla registra información

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `RCS_RCS_idRegistro` | `int (18,0)` | No | PK | Si+1 |
| `PER_idPersona` | `nvarchar (20)` | No | Fk | — |
| `CAT_idNivelEducativo` | `int` | Si | Fk | — |
| `CAT_idTipoOcupacion` | `int` | Si | Fk | — |
| `CAT_idJornadaLaboral` | `int` | Si | Fk | — |
| `CAT_idAseguramiento` | `int` | Si | — | — |
| `PED_ultimoAnniAprobado` | `tinyint` | Si | — | — |
| `PED_totalMensual` | `decimal (18,2)` | Si | — | — |
| `PED_habitual` | `bit` | Si | — | — |
| `PED_annoRegistro` | `numeric (18,0)` | Si | — | — |
| `PED_esBeneficiario` | `tinyint` | Si | — | — |
| `PED_observaciones` | `varchar (MAX)` | Si | — | — |
| `EST_idEstablecimientoActual` | `numeric (18,0)` | Si | Fk | — |
| `PED_fumador` | `bit` | Si | — | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | Fk | — |
| `CAT_idEstadoCivil` | `int` | No | Fk | — |
| `CAT_idTipoDiscapacidad` | `int` | No | Fk | — |
| `BIT_eliminado` | `bit (1)` | No | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | No | — | — |
| `BIT_fechaCreacion` | `datetime` | No | — | — |

**Método(s):** Insertar, modifica y elimina por medio del StoreProcedure: SP\_Mantenimiento\_Persona\_Detalle

**Relaciones documentadas:**

- `FK_CAF_PERSONA_DETALLE_CAF_CAT_ASEGURAMIENTO`
- `FK_CAF_PERSONA_DETALLE_CAF_CAT_ESTADO_CIVIL`
- `FK_CAF_PERSONA_DETALLE_CAF_CAT_JORNADA_LABORAL`
- `FK_CAF_PERSONA_DETALLE_CAF_CAT_NIVEL_EDUCATIVO`
- `FK_CAF_PERSONA_DETALLE_CAF_CAT_TIPO_DISCAPACIDAD`
- `FK_CAF_PERSONA_DETALLE_CAF_CAT_TIPO_OCUPACION`
- `FK_CAF_PERSONA_DETALLE_CAF_PERSONA`
- `FK_CAF_PERSONA_DETALLE_RCS_PERIODO`

## A.39 `CAF_SALUD`

**Página fuente:** 51  
**Descripción del manual:** Tabla registra información referente a la Salud del Niño

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `SAL_idRegistro` | `int (18,0)` | No | PK | Si+1 |
| `PER_idPersona` | `nvarchar (20)` | No | Fk | — |
| `RCS_idPeriodo` | `int` | Si | Fk | — |
| `SAL_lactanciaExclusiva` | `int` | Si | Fk | — |
| `SAL_ablactacion` | `int` | Si | Fk | — |
| `SAL_atencionEspecialista` | `int` | Si | — | — |
| `SAL_violencia` | `tinyint` | Si | — | — |
| `SAL_vacunacion` | `decimal (18,2)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | No | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | No | — | — |
| `BIT_fechaCreacion` | `datetime` | No | — | — |

**Método(s):** No hay método relacionado

**Relaciones documentadas:**

- `FK_CAF_SALUD_CAF_PERSONA`

## A.40 `CAF_SERVICIO`

**Página fuente:** 51  
**Descripción del manual:** Tabla de datos que contiene los servicios

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `SER_idServicio` | `int` | No | PK | — |
| `SER_descripcion` | `nvarchar (100)` | No | — | — |

**Método(s):** Inserción directa en la base de datos

**Relaciones documentadas:**

- `FK_CAF_SERVICIOS_CLIENTES_CAF_SERVICIOS`

## A.41 `CAF_SERVICIO_CLIENTE`

**Página fuente:** 52  
**Descripción del manual:** Tabla de datos que contiene los servicios

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `SEC_idRegistro` | `int` | No | PK | Si+1 |
| `SER_idServicio` | `int` | No | FK | — |
| `PER_idPersona` | `nvarchar (20)` | No | FK | — |
| `CAT_idTipoCliente` | `int` | No | FK | — |
| `RCS_idPeriodo` | `numeric (18,0)` | No | FK | — |
| `SEC_mes` | `tinyint` | No | — | — |
| `BIT_eliminado` | `tinyint` | Si | — | — |
| `BIT_usuarioModifica` | `varchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modifica y elimina por medio del StoreProcedure: SP\_Mantenimiento\_Servicio\_Cliente

**Relaciones documentadas:**

- `FK_CAF_SERVICIO_CLIENTE_RCS_PERIODO`
- `FK_CAF_SERVICIOS_CLIENTES_CAF_CAT_TIPO_CLIENTE`
- `FK_CAF_SERVICIOS_CLIENTES_CAF_PERSONA`
- `FK_CAF_SERVICIOS_CLIENTES_CAF_SERVICIOS`

## A.42 `PMS_ESTRATEGIA`

**Página fuente:** 61

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `EST_idEstrategia` | `int` | No | PK | Si+1 |
| `SNB_codigo` | `Tinyint (18)` | Si | — | — |
| `SNB_descripcion` | `Varchar (18,2)` | Si | — | — |
| `BIT_eliminado` | `Bit` | Si | — | — |
| `BIT_usuarioModifica` | `Nvarchar` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directamente a la Base de Dato.

**Relaciones documentadas:**

- `FK_PMS_NIVEL_PRIMARIO_PMS_MODALIDAD`

## A.43 `PMS_NIVEL_PRIMARIO`

**Página fuente:** 61  
**Descripción del manual:** EXPLICACIÓN Y VALORES Esta tabla contiene las 2 modalidades que se imparten en los servicios de CEN CINAI. ST\_idEstrategia       SNB\_codigo   SNB\_descripcion 1             1         Intramuros 2             2         Extramuros PMS\_NIVEL\_PRIMARIO

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `NIP_idNivel` | `int` | No | PK | Si+1 |
| `NIP_descripcion` | `nvarchar (250)` | Si | — | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `EST_idEstrategia` | `int` | No | FK | — |

**Método(s):** Insertar, modificar y eliminar utilizando el Stored Procedure: SP\_PMS\_Nivel\_Primario

**Relaciones documentadas:**

- `FK_PMS_NIVEL_PRIMARIO_PMS_MODALIDAD`
- `FK_PMS_NIVEL_SECUNDARIO_PMS_NIVEL_PRIMARIO`

## A.44 `PMS_NIVEL_SECUNDARIO`

**Página fuente:** 62  
**Descripción del manual:** SP\_PMS\_Nivel\_Primario EXPLICACIÓN Y VALORES Esta tabla contiene los valores del primer Nivel según los documentos que la Dirección Técnica administra. PMS\_NIVEL\_SECUNDARIO

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `NIS_idNivel` | `int` | No | PK | Si+1 |
| `NIS_descripcion` | `nvarchar (250)` | Si | — | — |
| `NIP_idNivel` | `int` | No | FK | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar utilizando el Stored Procedure: SP\_PMS\_Nivel\_Secundario

**Relaciones documentadas:**

- `FK_PMS_NIVEL_SECUNDARIO_PMS_NIVEL_PRIMARIO`
- `FK_PMS_VARIABLE_PROYECCION_PMS_NIVEL_SECUNDARIO`

## A.45 `PMS_PROYECCION`

**Página fuente:** 13

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `PRO_idRegistro` | `int` | No | PK | Si+1 |
| `EST_idEstablecimiento` | `int` | No | FK | — |
| `PRO_anno` | `int` | Si | — | — |
| `VAP_idVariable` | `int` | No | FK | — |
| `PRO_cantidad` | `int (50)` | Si | — | — |
| `PRO_usuarioCrea` | `nvarchar` | Si | — | — |
| `PRO_aprobadoRevisa` | `bit` | Si | — | — |
| `PRO_usuarioRevisa` | `nvarchar` | Si | — | — |
| `PRO_aprobadoJOF` | `bit` | Si | — | — |
| `PRO_usuarioJOL` | `nvarchar` | Si | — | — |
| `PRO_aprobadoAteReg` | `bit` | Si | — | — |
| `PRO_usuarioAteReg` | `nvarchar` | Si | — | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `Nvarchar` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `PRO_texto` | `varchar` | Si | — | — |
| `PRO_estado` | `bit` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar utilizando el Stored Procedure: SP\_PMS\_Proyeccion

**Relaciones documentadas:**

- `FK_PMS_PROYECCION_PMS_VARIABLE_PROYECCION`
- `FK_PMS_PROYECCION_RCS_ESTABLECIMIENTO`

## A.46 `PMS_VARIABLE_PROYECCION`

**Página fuente:** 62

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `VAP_idVariable` | `int` | No | PK | Si+1 |
| `VAP_descripcion` | `nvarchar (250)` | Si | — | — |
| `NIS_idNivel` | `int` | No | FK | — |
| `BIT_eliminado` | `Bit` | No | — | — |
| `BIT_usuarioModifica` | `Nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `VAP_tipoVariable` | `char (1)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar utilizando el Stored Procedure: SP\_PMS\_Variable\_Proyeccion

**Relaciones documentadas:**

- `FK_PMS_PROYECCION_PMS_VARIABLE_PROYECCION`
- `FK_PMS_VARIABLE_PROYECCION_PMS_NIVEL_SECUNDARIO`

## A.47 `RCS_CANTON`

**Página fuente:** 13  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `COD_CANTON` | `char (2)` | No | PK | — |
| `COD_PROVINCIA` | `char (2)` | No | FK | — |
| `NOM_CANTON` | `varchar (30)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directa en la base de datos.

**Relaciones documentadas:**

- `FK_RCS_CANTON_RCS_PROVINCIA1`
- `FK_RCS_DISTRITO_RCS_CANTON1`

## A.48 `RCS_CATALOGO`

**Página fuente:** 53  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `CAT_idCatalogo` | `int (2)` | No | PK | Si+1 |
| `RCS_nombreDB` | `varchar (100)` | No | — | — |
| `RCS_descripcion` | `varchar (100)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar utilizando el StoreProcedure: SP\_Mantenimiento\_Catalogos

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.49 `RCS_COSTOS_SERVICIOS`

**Página fuente:** 57

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `SER_idServicio` | `tinyint` | No | PK | — |
| `RCS_idPeriodo` | `numerico (18)` | No | PK | — |
| `COS_COSTO` | `numerico (18,2)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directamente a la Base de Dato.

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.50 `RCS_DISTRITO`

**Página fuente:** 54  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `COD_PROVINCIA` | `char (2)` | No | PK | — |
| `COD_CANTON` | `char (2)` | No | PK | — |
| `COD_DISTRITO` | `char (2)` | No | PK | — |
| `NOM_DISTRITO` | `varchar (30)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directa en la base de datos.

**Relaciones documentadas:**

- `FK_CAF_FAMILIA_DETALLE_RCS_DISTRITO`
- `FK_RCS_DISTRITO_RCS_CANTON1`
- `FK_RCS_POBLADOS_RCS_DISTRITO`

## A.51 `RCS_ESTABLECIMIENTO`

**Página fuente:** 55

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `EST_idEstablecimiento` | `int (2)` | No | PK | — |
| `EST_descripcion` | `varchar (250)` | Si | — | — |
| `EST_tipoPoblacion` | `bit` | Si | — | — |
| `EST_nombreMideplan` | `varchar (250)` | Si | — | — |
| `EST_ids` | `int` | No | — | — |
| `EST_telefono` | `numeric (18,0)` | Si | — | — |
| `EST_fax` | `numeric (18,0)` | Si | — | — |
| `CAT_idOficinaLocal` | `int` | No | FK | — |
| `COD_provincia` | `char (1)` | Si | FK | — |
| `COD_canton` | `char (2)` | Si | FK | — |
| `COD_distrito` | `char (2)` | Si | FK | — |
| `COD_poblado` | `Numeric (18,0)` | Si | — | — |
| `EST_avenida` | `char (4)` | Si | — | — |
| `EST_calle` | `char (4)` | Si | — | — |
| `EST_coordenadaX` | `varchar (50)` | Si | — | — |
| `EST_coordenadaY` | `varchar (50)` | Si | — | — |
| `EST_direccion` | `varchar (250)` | Si | — | — |
| `EST_inActivo` | `bit` | No | — | — |
| `CAT_idProyeccion` | `int` | Si | FK | — |
| `CAT_idTipoEstablecimiento` | `int` | No | FK | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `EST_observaciones` | `nvarchar (500)` | Si | — | — |
| `CAT_idClasificacion` | `int` | Si | FK | — |
| `RCS_idEstablecimiento` | `int` | No | — | Si+1 |

**Método(s):** Insertar, modificar y eliminar por medio del StoreProcedure: SP\_Mantenimiento\_Establecimiento.

**Relaciones documentadas:**

- `FK_CAF_BOLETA_TRASLADO_RCS_ESTABLECIMIENTO`
- `FK_CAF_FAMILIA_RCS_ESTABLECIMIENTO`
- `FK_CAF_HISTORICO_ESTABLECIMIENTO_RCS_ESTABLECIMIENTO`
- `FK_RCS_ESTABLECIMIENTO_CAF_CAT_CLASIFICACION`
- `FK_RCS_ESTABLECIMIENTO_CAF_CAT_OFICINA_LOCAL`
- `FK_RCS_ESTABLECIMIENTO_CAF_CAT_TIPO_ESTABLECIMIENTO`
- `FK_PMS_PROYECCION_RCS_ESTABLECIMIENTO`
- `FK_RCS_ESTABLECIMIENTO_CARACTERISTICA_RCS_ESTABLECIMIENTO`

## A.52 `RCS_ESTABLECIMIENTO_CARACTERISTICA`

**Página fuente:** 56

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `ESC_idRegistro` | `int` | No | PK | Si+1 |
| `EST_idEstablecimiento` | `int` | Si | FK | — |
| `ESC_nombre` | `varchar (50)` | Si | — | — |
| `ESC_area` | `decimal (18,2)` | Si | — | — |
| `ESC_maximaOcupacion` | `tinyint` | Si | — | — |
| `ESC_jornadaCompleta` | `bit (1)` | Si | — | — |
| `ESC_jornadaParcial` | `bit (1)` | Si | — | — |
| `ESC_jornadaNocturna` | `bit (1)` | Si | — | — |
| `BIT_eliminado` | `bit (1)` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |
| `ESC_idAula` | `tinyint` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar por medio del StoreProcedure: SP\_Mantenimiento\_Establecimiento\_Caracteristica

**Relaciones documentadas:**

- `FK_RCS_ESTABLECIMIENTO_CARACTERISTICA_RCS_ESTABLECIMIENTO`

## A.53 `RCS_MES_ANUAL`

**Página fuente:** 57  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `RCS_idMes` | `int` | No | PK | Si+1 |
| `SNB_codigo` | `tinyint` | No | — | — |
| `SNB_descripcion` | `varchar (100)` | Si | — | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar directo a la base de datos. Modificar por medio del SP SP\_Desactiva\_Meses el cual se ejecuta por medio de una tarea programa el primer día de cada mes: SP\_In\_Activa\_Mes

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

## A.54 `RCS_PERIODO`

**Página fuente:** 58  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `RCS_idPeriodo` | `numeric (18,0)` | No | PK | Si+1 |
| `RCS_descripcion` | `varchar (100)` | No | — | — |
| `RCS_periodoAnterior` | `numeric (18,0)` | Si | — | — |
| `BIT_eliminado` | `bit` | Si | — | — |
| `BIT_usuarioModifica` | `nvarchar (50)` | Si | — | — |
| `BIT_fechaCreacion` | `datetime` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directo a la base de datos.

**Relaciones documentadas:**

- `FK_CAF_EVALUACION_MENOR_RCS_PERIODO`
- `FK_CAF_FAMILIA_DETALLE_RCS_PERIODO`
- `FK_CAF_MUJER_RCS_PERIODO`
- `FK_CAF_PERSONA_DETALLE_RCS_PERIODO`
- `FK_CAF_SERVICIO_CLIENTE_RCS_PERIODO`

## A.55 `RCS_POBLADO`

**Página fuente:** 13  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `COD_poblado` | `int` | No | PK | Si+1 |
| `COD_provincia` | `char (2)` | No | PK | — |
| `COD_canton` | `Char (2)` | No | PK | — |
| `COD_distrito` | `Char (2)` | No | PK | — |
| `POB_Descripcion` | `nvarchar (50)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directo a la base de datos.

**Relaciones documentadas:**

- `FK_RCS_POBLADOS_RCS_DISTRITO`

## A.56 `RCS_PROVINCIA`

**Página fuente:** 59  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `COD_poblado` | `int` | No | PK | Si+1 |
| `COD_provincia` | `char (2)` | No | PK | — |
| `COD_canton` | `Char (2)` | No | PK | — |
| `COD_distrito` | `Char (2)` | No | PK | — |
| `POB_Descripcion` | `nvarchar (50)` | Si | — | — |

**Método(s):** Insertar, modificar y eliminar directo a la base de datos.

**Relaciones documentadas:**

- `FK_RCS_POBLADOS_RCS_DISTRITO`

## A.57 `RCS_TOKEN`

**Página fuente:** 60  
**Descripción del manual:** Tabla de Recurso

| Campo | Tipo según manual | Nulos | PK/FK | Identity |
| --- | --- | --- | --- | --- |
| `TOK_idRegistro` | `int` | No | PK | Si+1 |
| `TOK_token` | `varchar (max)` | No | — | — |
| `TOK_fechaHora` | `datetime` | No | — | — |

**Método(s):** Ejecución del Store Procedure SP\_Token. Solamente Inserta a base de datos.

**Relaciones documentadas:** no se indican relaciones de integridad referencial en la ficha, o la ficha declara que no existen.

---

# 22. Anexo B — Catálogos y datos semilla

El manual incluye valores concretos para numerosos catálogos. Para una réplica local estos valores pueden convertirse posteriormente en scripts `INSERT`/seed. Los grupos más relevantes incluyen:

- condición migratoria;
- aseguramiento;
- condición al nacer;
- estado civil;
- estado fisiológico;
- etnia;
- jornada laboral;
- nivel educativo;
- oficinas locales;
- población;
- pobreza;
- referencia;
- regiones;
- sexo;
- tipo de cliente;
- discapacidad;
- tipo de establecimiento;
- tipo de hogar;
- identificación;
- ocupación;
- tipo de traslado;
- indicadores antropométricos;
- parámetros per cápita/prioridad/puntaje máximo;
- períodos;
- división territorial.

`CAF_CAT_TIPO_OCUPACION` contiene un catálogo especialmente extenso (varias páginas del manual). Para Confluence conviene no copiar cientos de filas dentro de esta página; para la réplica se debe extraer como **seed técnico separado** para evitar errores manuales.

---

# 23. Conclusión

El manual CAH ofrece suficiente información para construir una **réplica estructural de desarrollo bastante fiel** y, más importante, deja claro dónde se encuentran los datos maestros que SIA-CENCINAI necesitará consultar.

La arquitectura institucional ya separa conceptos de persona, familia, menor, detalle por período, servicios, establecimientos, oficinas y regiones, por lo que no debemos volver a inventar esos datos dentro de A.I. El nuevo módulo debe concentrarse en almacenar lo que hoy no existe de forma estructurada: **referencias de A.I., sesiones, valoración situacional, decisión, caso, plan, atenciones, documentos, coordinaciones, programación, reportes, traslado/continuidad y cierre**.

La siguiente pieza técnica natural es construir el **modelo de datos SIA-CENCINAI y el esquema de réplica local**, manteniendo ambos claramente separados pero relacionados.
