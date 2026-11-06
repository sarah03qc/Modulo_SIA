# SIDINACC_LOCAL_REPLICA_SPEC.md

# Especificación técnica de la réplica institucional mínima — SIA-CENCINAI

**Proyecto:** SIA-CENCINAI  
**Documento:** Especificación técnica ejecutable de la réplica local de SIDINACC/CAH  
**Uso:** fuente de verdad para Cursor durante la implementación local  
**Versión documental:** 0.2  
**Fecha de revisión:** 03/11/2026  
**Estado:** especificación de la réplica local implementada, pendiente de validación frente al DDL y la integración real de UTIC  
**Alcance funcional de contraste:** SIA-CENCINAI v0.7  
**Base local:** `SIDINACC_LOCAL` (solo lectura desde SIA)

---

## 1. Objetivo

Definir y mantener `SIDINACC_LOCAL` como una **réplica institucional mínima y deliberadamente parcial** para desarrollar SIA-CENCINAI sin depender todavía del acceso al ambiente real de SIDINACC/CAH. El contrato se actualiza desde la propuesta inicial de 12 tablas hacia las **15 tablas ya presentes** en los scripts del repositorio, sin reconstruir ni ampliar indiscriminadamente la base.

La réplica es una **proyección compatible, no un clon exacto**: nombres institucionales relevantes, relaciones demostradas, tipos provisionales donde el manual es ambiguo, y datos de personas 100 % sintéticos. Sirve para pruebas de integración y puede sustituirse posteriormente por un lector institucional validado.

```text
SIDINACC_LOCAL (simulación de lectura)        SIA_CENCINAI (futuro dominio A.I.)
              |                                      ^
              | solo lectura                         | operaciones A.I.
              v                                      |
  SidinaccReader + InstitutionalAuthProvider -------+
       contratos desacoplados
```

### Regla arquitectónica

- `SIDINACC_LOCAL` aporta identidad, territorio vigente por período, familia, persona encargada, servicios y una proyección de antecedentes nutricionales **solo para simulación/consulta autorizada**.
- `SIA_CENCINAI` será titular de referencias A.I., casos, sesiones, revaloraciones, prioridad A.I., planes, atenciones, programación, cierres, posibles referencias e informes. El diseño de esa base se revisará por separado contra v0.7.
- SIA **no escribe** en `SIDINACC_LOCAL`, no crea allí tablas propias de A.I. y evita duplicar datos maestros salvo snapshots históricos explícitos.
- El dominio SIA no accede directamente a objetos `CAF_*`/`RCS_*`; consume adaptadores y contratos autorizados.
- Roles institucionales, ámbitos y establecimientos autorizados se obtienen por un proveedor de autorización separado, **no** mediante una tabla institucional inventada en la réplica.
- La supresión de la pantalla general de Personas/Clientes **no suprime** búsquedas contextuales ni relaciones de identidad.

### Alcance de esta revisión

Esta versión **no ejecuta SQL**, no afirma haber validado el servidor local ni redefine el diseño de `SIA_CENCINAI`. Registra lo documentado en GitHub, lo respaldado por los manuales y lo pendiente de comprobación con UTIC.

## 2. Fuentes utilizadas, autoridad y diferencias conocidas

1. **Fuente institucional histórica:** *Manual Técnico — Módulo Caracterización del Ambiente del Hogar (CAH)*, DNCC-DI-UTIC-M-00X-2021, registro 06/06/2023, especialmente fichas, vistas y SP.
2. **Manual de Usuario CAH:** edición revisada el 09/01/2026; contexto de personas, expedientes, servicios, búsqueda, período y traslados de expedientes CAH.
3. **Análisis técnico del CAH:** `docs/architecture/SIDINACC_CAH_DATABASE_ANALYSIS.md` y documento fuente equivalente de Confluence.
4. **Especificación funcional vigente de SIA:** `docs/functional/FUNCTIONAL_SPEC_v0.7.md` y `USE_CASES_v0.7.md`; acuerdos con Alina del 02/11/2026.
5. **Realidad implementada en el repositorio:** `database/sidinacc-local/010_schema_core.sql`, semillas `020`, `030`, `040`, `090_smoke_tests.sql`, `README.md`, `DATASET_SUMMARY.md` y catálogo territorial CSV.

### Jerarquía de evidencia

- Para describir **lo que efectivamente define la réplica local**, prevalecen los scripts SQL versionados y sus anotaciones, frente a la especificación v0.1 desactualizada.
- Para afirmar **lo que existe realmente en SIDINACC institucional**, las fichas, vistas y SP de los manuales solo son evidencia documental histórica, **no** un DDL certificado vigente en 2026.
- La documentación v0.7 define el comportamiento propio de SIA, sin autorizar la creación de nuevas columnas o tablas ficticias en CAH.
- Ante ambigüedad en manuales: SQL de vistas/SP documentados → ficha de tabla → ER, con `PROVISIONAL_TYPE`, `PROVISIONAL_KEY`, `LOCAL_COMPATIBILITY_DECISION` o `TODO-UTIC`, según corresponda.
- La fuente territorial pública aporta nombres, códigos y relaciones de establecimientos para el *seed*; **no** se importan datos reales de personas.

### Desfase corregido

La antigua v0.1 decía que `CAF_MENOR`, `CAF_EVALUACION_MENOR` y `CAF_INDICADOR_ANTROPOMETRICO` estaban excluidas y que `CAF_FAMILIA_DETALLE` no incluía contacto/dirección. Esto ya no describe `010_schema_core.sql`. **La v0.2 las incorpora como extensiones efectivamente implementadas, sin declararlas integraciones productivas.**

## 3. Alcance y catálogo real de las 15 tablas

### 3.1 Tablas incluidas en `SIDINACC_LOCAL`

| # | Tabla | Datos útiles para SIA | Decisión / fuente |
|---:|---|---|---|
| 1 | `CAF_PERSONA` | Identidad (`PER_idPersona`), nombre, nacimiento, sexo, familia | Núcleo de identidad |
| 2 | `CAF_CAT_SEXO` | Descripción del sexo registrado | Catálogo de apoyo |
| 3 | `CAF_FAMILIA` | Vínculo persona–expediente familiar | Estructura soporte |
| 4 | `CAF_FAMILIA_DETALLE` | Ubicación por período, dirección y teléfonos familiares | Fuente preferida de establecimiento por período; **contacto familiar, no de persona encargada** |
| 5 | `RCS_PERIODO` | Referencia a período institucional | Evita mezclar estados anuales |
| 6 | `RCS_ESTABLECIMIENTO` | Establecimiento, estado y Oficina Local | Jerarquía/ámbito |
| 7 | `CAF_CAT_OFICINA_LOCAL` | Oficina Local y Región | Jerarquía/ámbito |
| 8 | `CAF_CAT_REGION` | Región institucional | Jerarquía/ámbito |
| 9 | `CAF_SERVICIO` | Catálogo de servicio/modalidad | **Semántica de modalidad por confirmar** |
| 10 | `CAF_CAT_TIPO_CLIENTE` | Tipo de cliente asociado al servicio | Catálogo soporte |
| 11 | `CAF_SERVICIO_CLIENTE` | Servicios de persona por mes y período | Consulta de modalidades |
| 12 | `CAF_PERSONA_DETALLE` | Proyección temporal por persona | Compatibilidad con patrón institucional |
| 13 | `CAF_MENOR` | Relaciones con madre, padre y persona encargada por período | Ampliación implementada; contexto del menor |
| 14 | `CAF_EVALUACION_MENOR` | Fecha y estados nutricionales PE/PT/TE/IMC por período | Ampliación implementada; `PROVISIONAL_KEY` |
| 15 | `CAF_INDICADOR_ANTROPOMETRICO` | Catálogo auxiliar de clasificación/nomenclatura | Ampliación implementada; códigos de seed `MOCK_ONLY` |

El archivo normativo del **DDL local ejecutable** es `database/sidinacc-local/010_schema_core.sql`. Las secciones SQL de este documento son **proyección de referencia**, no sustituyen el DDL implementado ni garantizan conformidad con producción.

### 3.2 Campos añadidos de `CAF_FAMILIA_DETALLE`

- `FAD_direccion varchar(100) NULL`.
- `FAD_telefonoUno numeric(18,0) NULL`.
- `FAD_telefonoDos numeric(18,0) NULL`.

Se interpretan como información familiar **correspondiente al período**, no como datos personales exclusivos de madre, padre o persona encargada. La semántica, tipo y formato real del teléfono requieren confirmación de UTIC.

### 3.3 Objetos fuera de la réplica actual

| Objeto/grupo | Motivo |
|---|---|
| `CAF_DETALLE_TRASLADO`, `CAF_GENERACION_CLAVE`, `CAF_CAT_TIPO_TRASLADO` | El movimiento de expediente CAH no es el proceso de cierre del caso A.I.; v0.7 **eliminó la continuidad automática** y no requiere copiarlo |
| `CAF_PAR_PRIORIDAD` | Prioridad de selección CAH **distinta** de la prioridad A.I. definida por RN-009 |
| `CAF_CAT_REFERENCIA` | Catálogo de remisión institucional CAH **distinto** de referencia interna A.I. |
| `CAF_SALUD` | El manual técnico no demuestra una fuente activa adecuada para SIA |
| Tablas EDIN II / EVADE | Ubicación y contrato técnico **no identificados**; prohibido inventarlos |
| PMS, catálogos geográficos extendidos y recursos no consumidos | No hacen falta al contrato de consulta mínima |
| `RCS_TOKEN` | Token SINIRUBE; no es mecanismo de autenticación de SIA |
| Triggers, jobs, procedimientos de mantenimiento y vistas institucionales completas | El mock consume proyecciones de lectura, no replica SIDINACC entero |
| Cualquier tabla `SIA_*` de casos, cierres, sesiones, atenciones o informes | Propiedad exclusiva de la BD SIA, no del espejo CAH |

### 3.4 Traducción de cambios v0.7 a la réplica

- **Pantalla general Personas/Clientes retirada:** conservar búsqueda por ID/nombre en referencias, sesiones, casos y atenciones, siempre autorizada; no crear listados indiscriminados.
- **Caso A.I. único activo por persona:** se valida y persiste en SIA, no en CAF; `PER_idPersona` permite comprobar identidad global mediante adaptador.
- **Traslado:** usar establecimiento vigente institucional para determinar ámbito, cerrar el caso A.I. de origen y, cuando corresponda, gestionar una referencia nueva en destino desde SIA; no crear mecanismo CAH de continuidad.
- **Revaloración y cierres estructurados:** información del dominio SIA, sin nuevas tablas institucionales.
- **Posibles referencias:** preparar una frontera de integración futura; la tabla de evaluación nutricional existente puede aportar antecedentes **no equivale** a un detector clínico/institucional validado.
- **Reportería e Inicio:** nacimiento, sexo y jerarquía institucional ya cubiertos; indicadores operativos, casos, atenciones, porcentajes y análisis residen en SIA. El contexto institucional nunca autoriza acceso fuera del ámbito.

## 4. Decisión de clave de persona

Para la réplica y el contrato inicial se usa:

```
CAF_PERSONA.PER_idPersona
```

como identificador institucional de persona.

El manual también define `RCS_idPersona` autoincremental. Sin embargo, las relaciones y vistas documentadas utilizan repetidamente `PER_idPersona`.

Por tanto:

```typescript
type InstitutionalPersonId = string; // CAF_PERSONA.PER_idPersona
```

**Pendiente UTIC:** confirmar si en el esquema vigente de 2026 la clave recomendada de interoperabilidad sigue siendo `PER_idPersona` o debe utilizarse `RCS_idPersona`.

No cambiar esta decisión en código sin registrar una ADR.

---

## 5. DDL mínimo de compatibilidad

> Este DDL reproduce la **proyección consumida por SIA**, no todas las columnas de las tablas institucionales.

### 5.1 Base

```
CREATE DATABASE SIDINACC_LOCAL;
GO

USE SIDINACC_LOCAL;
GO
```

---

### 5.2 `CAF_CAT_REGION`

**Fuente:** Manual CAH, ficha pág. 25; SQL de `SP_Mantenimiento_Region_Oficina_Local`, págs. 142–144.

La ficha marca `REG_nombre` como `tinyint`, pero el SP institucional inserta `@pTC_nombre` textual y las vistas muestran nombres de región. Para el mock se conserva el nombre de columna con un tipo textual provisional.

```sql
CREATE TABLE dbo.CAF_CAT_REGION (
    CAT_idRegion      int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    REG_nombre        varchar(200) NOT NULL, -- PROVISIONAL_TYPE
    REG_descripcion   varchar(200) NULL,
    BIT_eliminado     bit NULL
);
```

---

### 5.3 `CAF_CAT_OFICINA_LOCAL`

**Fuente:** Manual CAH, ficha pág. 22; SQL de `SP_Mantenimiento_Region_Oficina_Local`, págs. 143–144.

El SQL institucional usa `OFL_nombre`, aunque la ficha tabular del manual es inconsistente.

```sql
CREATE TABLE dbo.CAF_CAT_OFICINA_LOCAL (
    CAT_idOficinaLocal int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    CAT_idRegion       tinyint NOT NULL,
    OFL_nombre         varchar(200) NOT NULL, -- PROVISIONAL_TYPE
    OFL_descripcion    varchar(200) NULL,
    BIT_eliminado      bit NULL
);
```

No crear todavía una FK física `CAT_idRegion -> CAF_CAT_REGION`, porque el manual documenta `tinyint` en la OL e `int` en Región. La relación lógica sí es obligatoria.

---

### 5.4 `RCS_ESTABLECIMIENTO`

**Fuente:** Manual CAH, ficha pág. 55; vista `uV_ListarEstablecimiento`, págs. 70–71.

```sql
CREATE TABLE dbo.RCS_ESTABLECIMIENTO (
    EST_idEstablecimiento int NOT NULL PRIMARY KEY,
    EST_descripcion       varchar(250) NULL,
    CAT_idOficinaLocal    int NOT NULL,
    EST_inActivo          bit NOT NULL,
    BIT_eliminado         bit NULL
);

CREATE INDEX IX_RCS_ESTABLECIMIENTO_Oficina
ON dbo.RCS_ESTABLECIMIENTO (
    CAT_idOficinaLocal,
    EST_inActivo,
    BIT_eliminado
);
```

No se replican dirección, teléfono, geografía, coordenadas, clasificación, proyección ni características físicas porque SIA no las consume actualmente.

---

### 5.5 `RCS_PERIODO`

**Fuente:** Manual CAH, ficha pág. 58.

```sql
CREATE TABLE dbo.RCS_PERIODO (
    RCS_idPeriodo        numeric(18,0) NOT NULL PRIMARY KEY,
    RCS_descripcion      varchar(100) NOT NULL,
    RCS_periodoAnterior  numeric(18,0) NULL,
    BIT_eliminado        bit NULL
);
```

Para desarrollo local se configurará explícitamente:

```
SIDINACC_PERIOD_ID=2026
```

No inferir silenciosamente el período vigente hasta que UTIC confirme el mecanismo institucional real.

---

### 5.6 `CAF_CAT_SEXO`

**Fuente:** Manual CAH, ficha pág. 26.

```sql
CREATE TABLE dbo.CAF_CAT_SEXO (
    CAT_idSexo        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SNB_codigo        tinyint NOT NULL,
    SNB_descripcion   varchar(100) NULL,
    BIT_eliminado     bit NULL
);
```

Seed documentado:

```
1 | Hombre
2 | Mujer
3 | Intersex
```

---

### 5.7 `CAF_FAMILIA`

**Fuente:** Manual CAH, ficha pág. 40.

Para el flujo consumido por SIA solo se requiere conservar el identificador al que apunta `CAF_PERSONA.FAM_idFamilia`.

```sql
CREATE TABLE dbo.CAF_FAMILIA (
    FAM_idFamilia  int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    BIT_eliminado  bit NULL
);
```

---

### 5.8 `CAF_FAMILIA_DETALLE` (incluye contacto familiar por período)

**Fuente:** Manual CAH, ficha pág. 41; vista `uV_ListarClientesServicios`, págs. 68–70.

Esta es la fuente preferida para determinar el **establecimiento actual por período**, porque la propia vista institucional utiliza `FD.EST_idEstablecimientoActual` para derivar establecimiento, Oficina Local y Región.

```sql
CREATE TABLE dbo.CAF_FAMILIA_DETALLE (
    FAD_idFamiliaDetalle        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FAM_idFamilia               int NOT NULL,
    FAD_direccion               varchar(100) NULL, -- ampliación ya implementada
    FAD_telefonoUno             numeric(18,0) NULL, -- familia / período
    FAD_telefonoDos             numeric(18,0) NULL, -- familia / período
    FAD_inActiva                bit NULL,
    EST_idEstablecimientoActual int NULL,
    RCS_idPeriodo               numeric(18,0) NOT NULL,
    BIT_eliminado               bit NULL,

    CONSTRAINT FK_LOCAL_FAD_FAMILIA
        FOREIGN KEY (FAM_idFamilia)
        REFERENCES dbo.CAF_FAMILIA(FAM_idFamilia),

    CONSTRAINT FK_LOCAL_FAD_ESTABLECIMIENTO
        FOREIGN KEY (EST_idEstablecimientoActual)
        REFERENCES dbo.RCS_ESTABLECIMIENTO(EST_idEstablecimiento),

    CONSTRAINT FK_LOCAL_FAD_PERIODO
        FOREIGN KEY (RCS_idPeriodo)
        REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
);

CREATE INDEX IX_CAF_FAMILIA_DETALLE_Periodo
ON dbo.CAF_FAMILIA_DETALLE (
    FAM_idFamilia,
    RCS_idPeriodo,
    FAD_inActiva,
    BIT_eliminado
);
```

---

### 5.9 `CAF_PERSONA`

**Fuente:** Manual CAH, ficha pág. 49.

```sql
CREATE TABLE dbo.CAF_PERSONA (
    PER_idPersona       nvarchar(20) NOT NULL PRIMARY KEY,
    PER_beneficiario    varchar(2) NULL,
    PER_apellidoUno     varchar(50) NULL,
    PER_apellidoDos     varchar(50) NULL,
    PER_nombre          varchar(50) NULL,
    PER_fechaNacimiento datetime NULL,
    FAM_idFamilia       int NULL,
    CAT_idSexo          int NULL,
    BIT_eliminado       bit NULL,
    RCS_idPersona       int IDENTITY(1,1) NOT NULL,

    CONSTRAINT UQ_LOCAL_CAF_PERSONA_RCS
        UNIQUE (RCS_idPersona),

    CONSTRAINT FK_LOCAL_PERSONA_FAMILIA
        FOREIGN KEY (FAM_idFamilia)
        REFERENCES dbo.CAF_FAMILIA(FAM_idFamilia),

    CONSTRAINT FK_LOCAL_PERSONA_SEXO
        FOREIGN KEY (CAT_idSexo)
        REFERENCES dbo.CAF_CAT_SEXO(CAT_idSexo)
);

CREATE INDEX IX_CAF_PERSONA_Nombre
ON dbo.CAF_PERSONA (
    PER_apellidoUno,
    PER_apellidoDos,
    PER_nombre
);
```

No se replican nacionalidad, etnia ni condición migratoria en v0.1 porque no son necesarios para el perfil mínimo actual de SIA.

---

### 5.10 `CAF_PERSONA_DETALLE`

**Fuente:** Manual CAH, ficha pág. 50.

Se conserva una proyección mínima porque CAH historiza atributos de persona por período y `uV_ListarClientesServicios` exige una fila `CAF_PERSONA_DETALLE` del mismo período.

```sql
CREATE TABLE dbo.CAF_PERSONA_DETALLE (
    RCS_RCS_idRegistro          int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    PER_idPersona               nvarchar(20) NOT NULL,
    EST_idEstablecimientoActual numeric(18,0) NULL,
    RCS_idPeriodo               numeric(18,0) NOT NULL,
    BIT_eliminado               bit NOT NULL DEFAULT 0,

    CONSTRAINT FK_LOCAL_PD_PERSONA
        FOREIGN KEY (PER_idPersona)
        REFERENCES dbo.CAF_PERSONA(PER_idPersona),

    CONSTRAINT FK_LOCAL_PD_PERIODO
        FOREIGN KEY (RCS_idPeriodo)
        REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
);
```

No crear FK física para `EST_idEstablecimientoActual` mientras el manual mantenga la discrepancia `numeric(18,0)` vs `RCS_ESTABLECIMIENTO.EST_idEstablecimiento int`.

**Importante:** para ubicación institucional del perfil SIA se usa `CAF_FAMILIA_DETALLE.EST_idEstablecimientoActual`, no este campo.

---

### 5.11 `CAF_SERVICIO`

**Fuente:** Manual CAH, ficha pág. 51.

```sql
CREATE TABLE dbo.CAF_SERVICIO (
    SER_idServicio   int NOT NULL PRIMARY KEY,
    SER_descripcion  nvarchar(100) NOT NULL
);
```

La vista institucional hace referencia adicional a un `SNB_codigo` que no aparece en la ficha. Como SIA no consume ese código, no se agrega al mock.

---

### 5.12 `CAF_CAT_TIPO_CLIENTE`

**Fuente:** Manual CAH, ficha págs. 26–27.

```sql
CREATE TABLE dbo.CAF_CAT_TIPO_CLIENTE (
    CAT_idTipoCliente int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SNB_codigo        tinyint NOT NULL,
    SNB_descripcion   varchar(100) NULL,
    BIT_eliminado     bit NULL
);
```

Valores documentados:

```
1 | Niño menor 13 años
2 | Gestante / Lactante
```

---

### 5.13 `CAF_SERVICIO_CLIENTE`

**Fuente:** Manual CAH, ficha pág. 52.

```sql
CREATE TABLE dbo.CAF_SERVICIO_CLIENTE (
    SEC_idRegistro     int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    SER_idServicio     int NOT NULL,
    PER_idPersona      nvarchar(20) NOT NULL,
    CAT_idTipoCliente  int NOT NULL,
    RCS_idPeriodo      numeric(18,0) NOT NULL,
    SEC_mes            tinyint NOT NULL,
    BIT_eliminado      tinyint NULL,

    CONSTRAINT FK_LOCAL_SC_SERVICIO
        FOREIGN KEY (SER_idServicio)
        REFERENCES dbo.CAF_SERVICIO(SER_idServicio),

    CONSTRAINT FK_LOCAL_SC_PERSONA
        FOREIGN KEY (PER_idPersona)
        REFERENCES dbo.CAF_PERSONA(PER_idPersona),

    CONSTRAINT FK_LOCAL_SC_TIPO
        FOREIGN KEY (CAT_idTipoCliente)
        REFERENCES dbo.CAF_CAT_TIPO_CLIENTE(CAT_idTipoCliente),

    CONSTRAINT FK_LOCAL_SC_PERIODO
        FOREIGN KEY (RCS_idPeriodo)
        REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
);

CREATE INDEX IX_CAF_SERVICIO_CLIENTE_PersonaPeriodo
ON dbo.CAF_SERVICIO_CLIENTE (
    PER_idPersona,
    RCS_idPeriodo,
    SEC_mes,
    BIT_eliminado
);
```

---

### 5.14 `CAF_MENOR` — ampliación existente

**Propósito:** identificar para cada menor la persona registrada como madre, padre y encargada en el período consultado. No crea una entidad adicional de persona; los identificadores referencian `CAF_PERSONA`.

**Proyección del script local vigente:**

```sql
CREATE TABLE dbo.CAF_MENOR (
    MEN_idRegistroMenor int NOT NULL PRIMARY KEY, -- TODO-UTIC: manual indica identity
    PER_idPersona       nvarchar(20) NOT NULL,
    MEN_idMadre         nvarchar(20) NULL,
    MEN_idPadre         nvarchar(20) NULL,
    MEN_idEncargado     nvarchar(20) NOT NULL,
    RCS_idPeriodo       numeric(18,0) NOT NULL,
    BIT_eliminado       bit NULL,
    CONSTRAINT FK_LOCAL_MENOR_PERSONA FOREIGN KEY (PER_idPersona) REFERENCES dbo.CAF_PERSONA(PER_idPersona),
    CONSTRAINT FK_LOCAL_MENOR_MADRE FOREIGN KEY (MEN_idMadre) REFERENCES dbo.CAF_PERSONA(PER_idPersona),
    CONSTRAINT FK_LOCAL_MENOR_PADRE FOREIGN KEY (MEN_idPadre) REFERENCES dbo.CAF_PERSONA(PER_idPersona),
    CONSTRAINT FK_LOCAL_MENOR_ENCARGADO FOREIGN KEY (MEN_idEncargado) REFERENCES dbo.CAF_PERSONA(PER_idPersona),
    CONSTRAINT FK_LOCAL_MENOR_PERIODO FOREIGN KEY (RCS_idPeriodo) REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
);
CREATE INDEX IX_CAF_MENOR_PersonaPeriodo ON dbo.CAF_MENOR(PER_idPersona, RCS_idPeriodo);
```

El script ejecutable usa guardas de existencia/idempotencia no repetidas en el fragmento. La relación del encargado con el menor se deduce de la correspondencia de IDs (`Madre`, `Padre` u `Otra persona encargada`), **no** de un rol institucional inventado. No incluir `MEN_rezagoDesarrollo`; no es sinónimo de EDIN II/EVADE.

### 5.15 `CAF_EVALUACION_MENOR` — ampliación existente

**Propósito:** lectura histórica de resultados nutricionales ya calculados en CAH. SIA no recalcula indicadores ni establece por sí sola criterios de referencia.

```sql
CREATE TABLE dbo.CAF_EVALUACION_MENOR (
    EVM_idEvaluacionMenor    int NOT NULL PRIMARY KEY, -- PROVISIONAL_KEY / TODO-UTIC
    PER_idPersona            nvarchar(20) NOT NULL,
    EVM_fechaEvaluacion      datetime NOT NULL,
    RCS_idPeriodo            numeric(18,0) NOT NULL,
    EVM_estadoNutricionalPe  tinyint NULL,
    EVM_estadoNutricionalPt  tinyint NULL,
    EVM_estadoNutricionalTe  tinyint NULL,
    EVM_estadoNutricionalImc tinyint NULL,
    BIT_eliminado            bit NULL,
    CONSTRAINT FK_LOCAL_EVM_PERSONA FOREIGN KEY (PER_idPersona) REFERENCES dbo.CAF_PERSONA(PER_idPersona),
    CONSTRAINT FK_LOCAL_EVM_PERIODO FOREIGN KEY (RCS_idPeriodo) REFERENCES dbo.RCS_PERIODO(RCS_idPeriodo)
);
CREATE INDEX IX_CAF_EVALUACION_MENOR_PersonaPeriodoFecha
    ON dbo.CAF_EVALUACION_MENOR(PER_idPersona, RCS_idPeriodo, EVM_fechaEvaluacion);
```

**Diferencia crítica:** la ficha del manual parece marcar `PER_idPersona` como PK y `EVM_idEvaluacionMenor` como campo identidad no-PK, incompatibles con varias evaluaciones por persona. El mock usa `EVM_idEvaluacionMenor` como **PK local provisional** para representar historial. No afirmar que esa es la PK institucional. No se replican peso, talla, edad ni auditoría en esta superficie implementada.

### 5.16 `CAF_INDICADOR_ANTROPOMETRICO` — ampliación existente

```sql
CREATE TABLE dbo.CAF_INDICADOR_ANTROPOMETRICO (
    ANT_id             int NOT NULL PRIMARY KEY, -- TODO-UTIC: manual indica identity
    ANT_area           char(3) NULL,
    ANT_clasificacion  nvarchar(50) NULL,
    ANT_nomenclatura   nchar(6) NULL,
    BIT_eliminado      bit NULL
);
```

**No está documentada una FK comprobada** desde los códigos PE/PT/TE/IMC a este catálogo. No inventar JOIN, reglas clínicas ni traducciones oficiales de sus códigos. Los registros sembrados son de prueba y deben identificarse como `MOCK_ONLY`.

### 5.17 Relación entre este documento y el SQL implementado

- `010_schema_core.sql` incorpora guardas, índices, roles de lectura y adiciones no destructivas a `CAF_FAMILIA_DETALLE`.
- La documentación conserva diferencias de tipo/clave cuando el manual oficial no es concluyente.
- No ejecutar los `CREATE TABLE` ilustrativos de esta sección sobre una réplica ya creada: usar exclusivamente los scripts idempotentes existentes en orden.
- Para diferencias entre un fragmento de esta especificación y el código local, comprobar el script versionado antes de cualquier migración; registrar la divergencia en lugar de aplicar un arreglo silencioso.

---

## 6. Resolución de ubicación institucional

Cadena canónica de SIA:

```
CAF_PERSONA.FAM_idFamilia
        │
        ▼
CAF_FAMILIA_DETALLE
  - mismo RCS_idPeriodo configurado
  - no eliminado
  - EST_idEstablecimientoActual
        │
        ▼
RCS_ESTABLECIMIENTO.CAT_idOficinaLocal
        │
        ▼
CAF_CAT_OFICINA_LOCAL.CAT_idRegion
        │
        ▼
CAF_CAT_REGION
```

### Regla

Para `SIDINACC_PERIOD_ID`:

- si existe detalle familiar del período, usar su establecimiento actual;
- si no existe, devolver `institutionalLocation = null`;
- **no** buscar automáticamente otro período;
- **no** ampliar el ámbito del usuario;
- **no** inferir el establecimiento desde un registro histórico sin señalizarlo.

### Caso de traslado dentro de un mismo período — pendiente específico v0.7

Los datos locales demuestran el cambio 2025 → 2026, pero **no comprueban** cómo resuelve SIDINACC una reasignación que ocurre dos veces dentro de 2026. Antes de elegir una fila de `CAF_FAMILIA_DETALLE` debe confirmarse con UTIC si existe una sola fila vigente, historial de filas por período o una regla de desempate. **No usar `TOP 1` arbitrario ni resolver silenciosamente por orden de inserción**. Para el mock, un caso de coexistencia ambigua debe fallar de manera controlada y quedar `NEEDS_VALIDATION`, sin ampliar el ámbito.

No confundir el movimiento de expediente CAH con el cierre por traslado del caso A.I. o con la generación de una nueva referencia A.I.

---

## 7. Autenticación y establecimientos autorizados

### 7.1 Lo que sí está confirmado

SIA debe obtener y respetar el ámbito institucional y los establecimientos previamente autorizados.

En nivel Establecimiento:

- 1 establecimiento autorizado → aplicar automáticamente;
- N establecimientos autorizados → permitir filtro solo entre esos N;
- SIA no mantiene una asignación institucional paralela.

### 7.2 Lo que NO está documentado con precisión

El Manual CAH habla de usuarios y perfiles, pero no define de forma suficiente una relación ejecutable:

```
usuario -> perfil/rol -> establecimientos autorizados
```

Por tanto, **NO crear en **`SIDINACC_LOCAL`** una tabla inventada de autorización haciéndola pasar por estructura real**.

### 7.3 Contrato desacoplado

```typescript
export type InstitutionalRole =
  | "ESTABLECIMIENTO"
  | "OFICINA_LOCAL"
  | "REGIONAL"
  | "NACIONAL";

export interface InstitutionalUserContext {
  username: string;
  role: InstitutionalRole;

  // ESTABLECIMIENTO
  authorizedEstablishmentIds?: number[];

  // OFICINA_LOCAL
  officeLocalId?: number;

  // REGIONAL
  regionId?: number;
}

export interface InstitutionalAuthProvider {
  getCurrentUserContext(): Promise<InstitutionalUserContext>;
}
```

En v0.7, `ASC2` y `ASC3` deben compartir las capacidades de Establecimiento **cuando estén autorizados**; esta equivalencia de negocio no crea roles físicos CAH ni permisos globales. El proveedor entrega `authorizedEstablishmentIds` y el backend debe hacer cumplir los límites de acceso. Reportería general de Establecimiento sigue pendiente de validación institucional.

En local:

```
MockInstitutionalAuthProvider
```

con fixture independiente de la BD:

```json
{
  "users": [
    {
      "username": "demo.est.single",
      "role": "ESTABLECIMIENTO",
      "authorizedEstablishmentIds": [1001001]
    },
    {
      "username": "demo.est.multi",
      "role": "ESTABLECIMIENTO",
      "authorizedEstablishmentIds": [1001001, 1001002]
    },
    {
      "username": "demo.ol",
      "role": "OFICINA_LOCAL",
      "officeLocalId": 101
    },
    {
      "username": "demo.regional",
      "role": "REGIONAL",
      "regionId": 1
    },
    {
      "username": "demo.nacional",
      "role": "NACIONAL"
    }
  ]
}
```

Este fixture:

- **no pertenece a SIDINACC\_LOCAL**;
- **no representa una tabla institucional**;
- existe únicamente para probar RF-104 hasta que UTIC confirme el mecanismo real.

---

## 8. Adaptador obligatorio y contratos de consumo

El dominio SIA no debe ejecutar SQL institucional directamente. Se conserva el contrato anterior y se documentan **extensiones propuestas**, no implementaciones certificadas. Las nuevas operaciones no deben atribuirse a una API real de SIDINACC.

```typescript
export interface SidinaccReader {
  searchPersons(query: string, scope: InstitutionalUserContext): Promise<PersonSummary[]>;
  getPersonProfile(personId: string, scope: InstitutionalUserContext): Promise<PersonProfile | null>;
  getPersonServices(personId: string, periodId: number): Promise<InstitutionalService[]>;
  listEstablishmentsForScope(scope: InstitutionalUserContext): Promise<InstitutionalEstablishment[]>;
}

export interface PersonSummary {
  institutionalPersonId: string; // CAF_PERSONA.PER_idPersona (provisional)
  fullName: string;
  birthDate: string | null;
  age: number | null;       // derivada, no persistida
  sex: string | null;
  establishmentId: number | null;
  establishmentName: string | null;
  officeLocalId: number | null;
  officeLocalName: string | null;
  regionId: number | null;
  regionName: string | null;
  source: "SIDINACC";
}

export interface InstitutionalService {
  serviceId: number;
  description: string;
  clientType: string | null;
  periodId: number;
  month: number;
}
```

### 8.1 Propuestas de extensión de lectura para v0.7

```typescript
// CONTRATO PROPUESTO. Confirmar alcance y fuente con UTIC antes de integrar en producción.
export interface InstitutionalFamilyContext {
  personId: string;
  periodId: number;
  guardianPersonId: string | null;
  guardianName: string | null;
  guardianRelationship: "MADRE" | "PADRE" | "OTRA_PERSONA" | null;
  familyAddress: string | null;    // domicilio familiar, no domicilio individual del encargado
  familyPhonePrimary: string | null;
  familyPhoneSecondary: string | null;
}

export interface InstitutionalNutritionResult {
  personId: string;
  periodId: number;
  evaluationDate: string;
  // códigos registrados por CAH; traducción y criterio institucional pendientes
  peCode: number | null;
  ptCode: number | null;
  teCode: number | null;
  imcCode: number | null;
  source: "CAH";
}

export interface SidinaccReaderV02Extensions {
  getCurrentInstitutionalLocation(
    personId: string, periodId: number, scope: InstitutionalUserContext
  ): Promise<{ establishmentId: number; officeLocalId: number; regionId: number } | null>;
  getFamilyContext(
    personId: string, periodId: number, scope: InstitutionalUserContext
  ): Promise<InstitutionalFamilyContext | null>;
  listNutritionResults(
    personId: string, periodId: number, scope: InstitutionalUserContext
  ): Promise<InstitutionalNutritionResult[]>;
}
```

- Los IDs de madre/padre/encargado se interpretan desde `CAF_MENOR` del mismo período; sus nombres se consultan mediante `CAF_PERSONA` con autorización.
- Contacto/dirección proceden del **detalle familiar del período**, no de `CAF_MENOR`.
- La información de sexo, edad y ubicación debe resolverse dentro del ámbito del usuario. Ninguna de estas operaciones concede permiso adicional.
- Para nuevas referencias A.I., la BD SIA guarda el identificador institucional y, cuando sea necesario, un snapshot histórico **justificado** de datos visibles al envío.
- Si no existe información autorizada, devolver `null` o lista vacía. Nunca recuperar unilateralmente expedientes históricos ni saltarse ámbitos.

### 8.2 Frontera futura de posibles referencias

La sección **Posibles referencias** de v0.7 es parte del dominio SIA. La generación automática de señales institucionales requiere contrato de integración independiente, acordado con UTIC. Un lector de nutrición **no es** un servicio de detección. No inferir fuentes EDIN II/EVADE ni usar un código sintético de prueba como diagnóstico real.

### 8.3 Regla de persistencia

En SIA se guarda `PER_idPersona` como identificador de integración **provisional**. No copiar como dato maestro permanente nombre, sexo, establecimiento o teléfono; solo snapshots históricos, cachés declaradas o datos denormalizados con justificación documentada. Cualquier cambio futuro de clave requiere ADR y migración controlada.

## 9. Reglas de ámbito

### Establecimiento

```
visibleEstablishments = auth.authorizedEstablishmentIds
```

No derivar autorizaciones desde los datos de persona.

### Oficina Local

```sql
SELECT EST_idEstablecimiento
FROM dbo.RCS_ESTABLECIMIENTO
WHERE CAT_idOficinaLocal = @officeLocalId
  AND EST_inActivo = 1
  AND ISNULL(BIT_eliminado, 0) = 0;
```

### Regional

```sql
SELECT E.EST_idEstablecimiento
FROM dbo.RCS_ESTABLECIMIENTO E
JOIN dbo.CAF_CAT_OFICINA_LOCAL OL
  ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
WHERE OL.CAT_idRegion = @regionId
  AND E.EST_inActivo = 1
  AND ISNULL(E.BIT_eliminado, 0) = 0
  AND ISNULL(OL.BIT_eliminado, 0) = 0;
```

### Nacional

Todos los establecimientos activos y no eliminados.

---

## 10. Búsqueda de persona

Reglas:

1. coincidencia exacta por `PER_idPersona` tiene precedencia;
2. luego búsqueda por nombre/apellidos;
3. aplicar ámbito antes de devolver resultados;
4. usar establecimiento actual del período configurado;
5. ignorar personas y detalles eliminados lógicamente;
6. una búsqueda sin resultados **no** amplía el ámbito.

SQL de referencia:

```sql
SELECT
    P.PER_idPersona,
    LTRIM(RTRIM(CONCAT(
        COALESCE(P.PER_nombre, ''), ' ',
        COALESCE(P.PER_apellidoUno, ''), ' ',
        COALESCE(P.PER_apellidoDos, '')
    ))) AS Nombre,
    P.PER_fechaNacimiento,
    SX.SNB_descripcion AS Sexo,
    E.EST_idEstablecimiento,
    E.EST_descripcion,
    OL.CAT_idOficinaLocal,
    OL.OFL_nombre,
    R.CAT_idRegion,
    R.REG_nombre
FROM dbo.CAF_PERSONA P
JOIN dbo.CAF_FAMILIA_DETALLE FD
  ON FD.FAM_idFamilia = P.FAM_idFamilia
 AND FD.RCS_idPeriodo = @periodId
 AND ISNULL(FD.BIT_eliminado, 0) = 0
LEFT JOIN dbo.CAF_CAT_SEXO SX
  ON SX.CAT_idSexo = P.CAT_idSexo
LEFT JOIN dbo.RCS_ESTABLECIMIENTO E
  ON E.EST_idEstablecimiento = FD.EST_idEstablecimientoActual
LEFT JOIN dbo.CAF_CAT_OFICINA_LOCAL OL
  ON OL.CAT_idOficinaLocal = E.CAT_idOficinaLocal
LEFT JOIN dbo.CAF_CAT_REGION R
  ON R.CAT_idRegion = OL.CAT_idRegion
WHERE ISNULL(P.BIT_eliminado, 0) = 0
  AND E.EST_idEstablecimiento IN (/* IDs autorizados/resueltos */)
  AND (
       P.PER_idPersona = @query
       OR CONCAT(
            COALESCE(P.PER_nombre, ''), ' ',
            COALESCE(P.PER_apellidoUno, ''), ' ',
            COALESCE(P.PER_apellidoDos, '')
          ) LIKE '%' + @query + '%'
  )
ORDER BY
  CASE WHEN P.PER_idPersona = @query THEN 0 ELSE 1 END,
  P.PER_apellidoUno,
  P.PER_apellidoDos,
  P.PER_nombre;
```

---

## 11. Servicios / modalidades

El perfil integral de SIA necesita mostrar modalidades/servicios disponibles cuando existan.

```sql
SELECT DISTINCT
    SC.SER_idServicio,
    S.SER_descripcion,
    TC.SNB_descripcion AS TipoCliente,
    SC.RCS_idPeriodo,
    SC.SEC_mes
FROM dbo.CAF_SERVICIO_CLIENTE SC
JOIN dbo.CAF_SERVICIO S
  ON S.SER_idServicio = SC.SER_idServicio
LEFT JOIN dbo.CAF_CAT_TIPO_CLIENTE TC
  ON TC.CAT_idTipoCliente = SC.CAT_idTipoCliente
WHERE SC.PER_idPersona = @personId
  AND SC.RCS_idPeriodo = @periodId
  AND ISNULL(SC.BIT_eliminado, 0) = 0
ORDER BY SC.SEC_mes DESC, S.SER_descripcion;
```

Si la UI solo necesita la lista de modalidades del período, deduplicar por `SER_idServicio` en el adapter.

**Pendiente UTIC:** confirmar que el concepto `CAF_SERVICIO` es la fuente correcta para la “modalidad” que SIA debe mostrar o si existe otra traducción institucional.

---

## 12. Vigilancia, nutrición y posibles referencias

**Estado real de la réplica:** `CAF_EVALUACION_MENOR` y `CAF_INDICADOR_ANTROPOMETRICO` **ya existen** en el SQL local; no deben volver a considerarse excluidas. Se conservan como **proyección sintética de antecedentes registrados**, no como motor de detección ni fuente clínica validada.

### Qué puede demostrarse ahora

- Consultar múltiples evaluaciones de la misma persona por período y fecha.
- Leer códigos PE/PT/TE/IMC existentes, sin recalcular resultados.
- Mostrar fechas y separar evaluaciones eliminadas lógicamente.
- Registrar escenarios `MOCK_ONLY` para probar transporte de datos y presentación, sin convertirlos en reglas oficiales.

### Qué NO queda autorizado

- Inferir malnutrición, EDIN II o EVADE a partir de códigos inventados o del campo `MEN_rezagoDesarrollo`.
- Crear tablas de supuestos sistemas EDIN II/EVADE en `SIDINACC_LOCAL`.
- Generar referencias A.I. automáticamente desde una evaluación nutricional.
- Tomar el catálogo de indicadores como FK confirmada de los estados nutricionales.
- Recalcular PE/PT/TE/IMC o sustituir criterio institucional/profesional.

### Integración posterior

Solicitar a UTIC la fuente, definición de códigos, estructura/servicio, semántica temporal, autorización de consulta y criterios institucionales para señales. La detección automática validada formará un servicio desacoplado del lector CAH y el registro de la sugerencia gestionada pertenecerá al dominio SIA.

### Separación entre dato y prueba

Un ejemplo sintético como `código 9 = señal demo MOCK_ONLY` únicamente prueba un escenario técnico; **no es un umbral nutricional ni una regla de remisión oficial**.

## 13. Semillas actuales, datos sintéticos y pruebas temporales

El seed local **ya no se limita** al escenario mínimo de 2 Regiones, 3 Oficinas Locales y 5 establecimientos descrito en la v0.1. Se conserva la estructura real implementada:

| Archivo | Contenido |
|---|---|
| `020_seed_catalogs.sql` | Períodos, sexo, tipo de cliente, servicios de prueba y catálogos auxiliares |
| `030_seed_institutional_structure.sql` | Jerarquía territorial generada desde catálogo institucional público |
| `040_seed_synthetic_population.sql` | Población totalmente sintética y escenarios familiares/nutricionales |
| `data/cen_cinai_territorial_catalog.csv` | Fuente de preparación del catálogo territorial derivado |
| `tools/generate_territorial_seed.py` | Herramienta para regenerar/controlar la semilla territorial desde fuente autorizada |
| `DATASET_SUMMARY.md` | Justificación, distribución y conteos **proyectados** del seed |

### 13.1 Estructura territorial base

- **9 Direcciones Regionales**.
- **41 Oficinas Locales**.
- **661 establecimientos** registrados en la fuente territorial: **630 activos**, **23 cerrados** y **8 inactivos**, según el catálogo versionado en el repositorio.
- Solo los establecimientos activos y no eliminados reciben población sintética activa en 2026, con **5 a 10 personas por establecimiento** según las reglas de seed.
- Los códigos y nombres de territorio proceden de un listado institucional público; **las personas, familias, fechas, servicios y evaluaciones se simulan**. No importar datos sensibles reales.

### 13.2 Identidades y períodos

- Identificadores de persona siguen `SYN-<ESTID>-<NN>` con longitud compatible con `PER_idPersona nvarchar(20)`.
- Semilla determinística documentada: `SIDINACC_SYNTHETIC_SEED = 20261019`.
- Períodos: **2025 y 2026**. Configurar explícitamente `SIDINACC_PERIOD_ID=2026` en el entorno de demostración. No asumir que 2026 seguirá siendo el período actual en otras fechas.
- Ejemplo de cambio entre períodos: `SYN-1100102-03`, establecimiento **1010320** en 2025 y **1100102** en 2026.
- Identidades de personas encargadas, madres y padres se encuentran en `CAF_PERSONA` y **no se tratan como beneficiarias** ni se incluyen indiscriminadamente en búsquedas de clientes.

### 13.3 Escenarios especiales existentes

- `SYN-1100102-01`: búsqueda exacta y dos servicios en 2026; persona encargada = madre en 2026 y padre en 2025.
- `SYN-1100102-02`: persona sin servicios en 2026; encargado = padre.
- `SYN-1100102-03`: familia con cambio de establecimiento entre períodos; encargado distinto de madre/padre.
- `SYN-1100102-04`: madre encargada y padre no registrado.
- `SYN-1100102-99`: persona eliminada lógicamente.
- Personas con nombres similares para búsqueda por texto y con evaluaciones nutricionales repetidas, fechadas, de períodos distintos y eliminadas lógicamente.
- Servicios nombrados `Servicio Demo 1..3 (SINTETICO)`; **no** representan modalidades institucionales reales.

### 13.4 Escenarios nuevos recomendados por v0.7 (NO existentes por el solo hecho de documentarlos)

1. Cambio de establecimiento **dentro del mismo período**, con mecanismo real de fila vigente pendiente de UTIC. No agregar filas ambiguas sin acordar la lectura canónica.
2. Acceso contextual ASC2/ASC3 a uno y varios establecimientos autorizados a través del proveedor de autenticación mock, no a través de tablas nuevas.
3. Consulta de antecedentes nutricionales sin fabricar hallazgos cuando no existe evaluación.
4. Aislamiento de ámbitos al consultar ubicación, encargado y evaluaciones.
5. Flujo de cierre de caso A.I. por traslado y posterior nueva referencia **probado en la BD SIA/integración**, nunca añadiendo columnas A.I. a CAH.

Los casos y porcentajes de cobertura, cierres, revaloraciones y gráficos de A.I. requieren semillas de **SIA_CENCINAI**, que no forman parte de esta réplica.

## 14. Usuario SQL de solo lectura

El repositorio implementa un **rol** `sia_sidinacc_reader_role` y un usuario de solo lectura `sia_sidinacc_reader`; los scripts protegen su creación con verificaciones de existencia. Los logins del entorno se deben configurar fuera del repositorio, sin contraseñas incluidas.

La aplicación de SIA **no** debe usar una cuenta propietaria ni permiso de escritura sobre `SIDINACC_LOCAL`. La política incorpora denegación explícita de operaciones mutadoras, según el script actual.

```sql
-- Esquema conceptual de permisos, NO reemplaza las guardas de 010_schema_core.sql.
USE SIDINACC_LOCAL;
GO
-- Rol de lectura controlada (ya gestionado por script real):
-- sia_sidinacc_reader_role
-- usuario local: sia_sidinacc_reader
-- logins por entorno: se provisionan/mapean de forma separada.
```

En el entorno local, la aplicación usa el login `sia_sidinacc_app`, creado fuera del repositorio y mapeado únicamente a `sia_sidinacc_reader_role`. La comprobación de 2026-11-06 ejecutó `SELECT` y recibió denegación del motor para `INSERT`, `UPDATE`, `DELETE`, `CREATE TABLE`, `ALTER`, `DROP` y para abrir `SIA_CENCINAI`. La contraseña no forma parte de esta especificación. `sia_sidinacc_reader` permanece `WITHOUT LOGIN`.

## 15. Archivos existentes y fronteras de implementación

```text
docs/architecture/
  SIDINACC_CAH_DATABASE_ANALYSIS.md
  SIDINACC_LOCAL_REPLICA_SPEC.md       <- este documento v0.2

database/sidinacc-local/
  001_create_database.sql
  010_schema_core.sql
  020_seed_catalogs.sql
  030_seed_institutional_structure.sql
  040_seed_synthetic_population.sql
  090_smoke_tests.sql
  README.md
  DATASET_SUMMARY.md
  data/cen_cinai_territorial_catalog.csv
  tools/generate_territorial_seed.py
```

El contrato de aplicación continúa **pendiente de implementación/verificación**, según el README actual, para:

```text
src/integrations/sidinacc/
  SidinaccReader.ts
  SqlSidinaccReader.ts
  types.ts
src/integrations/auth/
  InstitutionalAuthProvider.ts
  MockInstitutionalAuthProvider.ts
  fixtures/users.json
```

No declarar estos componentes como existentes por aparecer en esta propuesta. No mezclar scripts de `SIDINACC_LOCAL` con migraciones de la futura base `SIA_CENCINAI`. `DATASET_SUMMARY.md` contiene cifras de proyección calculada, **no un acta de ejecución de SQL Server**.

## 16. Pruebas de humo de la réplica

`database/sidinacc-local/090_smoke_tests.sql` define **61 verificaciones (T01–T61)**, no únicamente las 12 de la especificación inicial. El script imprime `SIDINACC_LOCAL smoke tests PASSED (61/61)` **si se ejecuta y se cumplen sus controles**; el repositorio por sí solo no prueba ejecución en un servidor.

### Cobertura actual documentada

| Grupo | IDs | Verificaciones |
|---|---|---|
| Períodos, catálogos y personas sintéticas | T01–T12 | Períodos, sexos/tipos, búsquedas, eliminadas, servicios, historia familiar |
| Integridad territorial y volumen sintético | T13–T41 | 15 tablas, 9 Regiones, 41 OL, establecimientos, ámbito, ausencia de huérfanos, lecturas, estructura y conteos por estado |
| Encargado y contacto familiar | T42–T50 | Madre/padre/encargado por período, dirección y teléfonos, no reutilizar dato familiar de otro año |
| Evaluaciones e indicadores demo | T51–T61 | Varias evaluaciones, fecha, período, eliminado, códigos `MOCK_ONLY`, ausencia EDIN/EVADE, índices y PK provisional |

### Nuevas pruebas de integración recomendadas para v0.7

Las siguientes **NO forman parte de T01–T61 hasta que se agreguen realmente**:

- `IT-01`: aislamiento del ámbito en búsqueda por identificación y por nombre para Establecimiento, OL, Región y Nacional.
- `IT-02`: usuario ASC2/ASC3 con varios establecimientos autorizados, suministrados por `InstitutionalAuthProvider`.
- `IT-03`: historial y ubicación vigente con traslado **dentro del mismo período**, sujeto a definición UTIC.
- `IT-04`: si existen múltiples detalles familiares en un mismo período, rechazar/no inventar el vigente ante ambigüedad.
- `IT-05`: ausencia de contacto o encargado no produce un dato falso ni revela familiares de otro ámbito.
- `IT-06`: no se convierte una evaluación nutricional en referencia A.I. automáticamente; solo simulación identificada.
- `IT-07`: un caso activo A.I. global por persona y nueva referencia independiente tras cierre: **se comprueba en SIA/integración**, no como constraint en SIDINACC_LOCAL.

### Evidencias de ejecución

Ejecutar scripts en ambiente local de pruebas y conservar fecha, versión de SQL Server, salida de cada test y conteos reales. No confundir evidencia de `README.md` con salida comprobada en tiempo de ejecución.

## 17. Criterios de aceptación de SIDINACC_LOCAL v0.2

### Criterios de estructura

- `SIDINACC_LOCAL` y `SIA_CENCINAI` son dominios/bases separados; no se ha creado modelo SIA dentro del espejo CAH.
- La réplica incluye **exactamente 15 tablas locales**, con ampliaciones y restricciones provisionales documentadas.
- No se ejecutan automáticamente scripts de recreación destructiva ni se clonan todas las tablas del manual.
- Se mantienen fuentes territoriales públicas y población de clientes/encargados/evaluaciones enteramente sintética.
- La aplicación utiliza solo lectura y contratos desacoplados.

### Criterios de lectura e integración

- Búsqueda por `PER_idPersona` exacta y nombre parcial, con límite de ámbito antes de responder.
- Perfil básico con nacimiento, sexo y ubicación por período, sin asumir una ubicación de otro año si falta la del actual.
- Familia y contexto de persona encargada por período, distinguiendo dirección/teléfono **familiar** de contacto particular.
- Servicios/modalidades disponibles por persona, con descripción institucional definitiva pendiente de UTIC.
- Evaluaciones nutricionales históricas consultables **solo para demostración y lectura autorizada**, sin significado de detección automática.
- No hay identificación real, nombres de niños reales ni datos personales institucionales importados.

### Evidencia de pruebas

- Ejecutar y registrar T01–T61 en SQL Server local; **no declarar PASS por el mero hecho de existir el archivo**.
- Agregar pruebas de adaptador, autorización y cambio territorial intraperíodo antes de depender de estos casos funcionalmente.
- Documentar diferencias entre el esquema simulado y el DDL institucional entregado por UTIC.

### Límites v0.7

- Unicidad del caso activo, cierre por traslado, revaloraciones, cierre estructurado, registros de posibles referencias y reportería se implementarán **exclusivamente en SIA**, nunca como extensiones artificiales de `SIDINACC_LOCAL`.
- La detección automática depende de fuentes autorizadas y no queda habilitada por la sola presencia de `CAF_EVALUACION_MENOR`.

## 18. Instrucciones explícitas para Cursor

Cursor **NO DEBE**:

1. Reconstruir las 57 tablas del manual ni recrear sin necesidad las 15 ya existentes.
2. Importar registros reales ni pseudonimizados; las personas son sintéticas.
3. Crear tablas ficticias de usuario → establecimientos, EDIN II/EVADE, casos o referencias A.I. dentro del espejo.
4. Tratar `RCS_TOKEN` como sesión institucional, ni `CAF_PAR_PRIORIDAD` como prioridad A.I., ni `CAF_CAT_REFERENCIA` como referencia A.I.
5. Implementar continuidad automática por traslado o reutilizar directamente los SP de traslado CAH para cerrar/crear casos A.I.
6. Aplicar a `CAF_EVALUACION_MENOR` reglas clínicas de un código demo `MOCK_ONLY`, ni asumir claves foráneas no documentadas.
7. Ejecutar SQL `CAF_*` desde la capa de dominio de SIA, ni copiar maestros sin justificar cache/snapshot.
8. Inferir la relación de autorización o el período vigente sin evidencia.
9. Dar por completadas las integraciones, adaptadores o pruebas sin haberlos implementado/ejecutado.
10. Actualizar `SIA_CENCINAI` como parte de una tarea exclusiva de validación de esta réplica.

Cursor **SÍ DEBE**:

- Mantener y revisar la réplica de 15 tablas, siguiendo `database/sidinacc-local/README.md` y los scripts ejecutables.
- Preservar `PER_idPersona` como identificador provisional y registrar `TODO-UTIC` sobre su sustitución.
- Implementar `SidinaccReader` y el proveedor de autorización desacoplado cuando se indique expresamente, siempre con filtrado por ámbito.
- Incluir el contexto del menor/familia y nutrición existente dentro de los contratos de lectura cuando sean necesarios, sin convertirlo en lógica automática de referencias.
- Documentar/registrar discrepancias con el manual y decisiones `PROVISIONAL_TYPE`, `PROVISIONAL_KEY`, `LOCAL_COMPATIBILITY_DECISION` y `MOCK_ONLY`.
- Mantener scripts y semillas idempotentes, pruebas verificables y separación de entornos.

## 19. TODO-UTIC y validaciones pendientes

Los puntos siguientes **no impiden el mock local**, pero sí condicionan la integración productiva o los criterios de lectura:

1. Obtener DDL real, vistas autorizadas y metadatos de tablas consumidas en el entorno vigente.
2. Confirmar la clave de interoperabilidad `PER_idPersona` frente a `RCS_idPersona`.
3. Confirmar autenticación/sesión institucional y dónde se obtienen usuario → perfil → establecimientos autorizados (incluido ASC2/ASC3).
4. Confirmar mecanismo oficial de período actual y selección de períodos históricos.
5. Confirmar si la integración será por tablas/vistas/servicios/API y qué permisos de lectura se autorizarán.
6. Validar tipos y PK reales de Región, OL, establecimiento, persona, menor y evaluación nutricional; incluido el `PROVISIONAL_KEY` de `EVM_idEvaluacionMenor`.
7. Validar `EST_inActivo`, `FAD_inActiva`, `PER_beneficiario`, `BIT_eliminado` de servicio-cliente, y los códigos sexo/tipo de cliente.
8. Validar el origen institucional de la modalidad de servicio frente a `CAF_SERVICIO` y sus códigos reales.
9. Confirmar fuente y semántica de `FAD_direccion`, `FAD_telefonoUno` y `FAD_telefonoDos`, además de identificación y relación del encargado.
10. **Traslado dentro del mismo período:** confirmar cómo se selecciona el detalle familiar vigente y cómo resolver duplicados/versiones intraperíodo.
11. Confirmar correspondencia oficial entre códigos de estado nutricional PE/PT/TE/IMC y catálogos, y si se autoriza su consulta por SIA.
12. Identificar **las fuentes reales de EDIN II y EVADE**, disponibilidad de API/vistas, estructura y criterios autorizados de detección.
13. Definir contrato de las **Posibles referencias** (origen, fecha de detección, criterio, restricciones, trazabilidad), sin asumir que reside dentro de CAH.
14. Confirmar restricciones adicionales de confidencialidad, seguridad, logs y alcance de reportes de Establecimiento.
15. Solicitar ambiente de pruebas y credenciales segregadas de solo lectura.
16. Confirmar versión real y compatibilidad de SQL Server, intercalación y tipos provisionales; en local los scripts requieren SQL Server 2017+.
17. Verificar los resultados reales de `090_smoke_tests.sql` en el ambiente local y registrar cualquier divergencia antes de afirmar conformidad.

### Decisiones locales provisionales que no se deben presentar como institucionales

- `PER_idPersona` como llave principal de integración para v0.2.
- `EVM_idEvaluacionMenor` como PK física local.
- Catálogo nutricional demo y código de señal `MOCK_ONLY`.
- `EST_inActivo=1` como activo según convención del seed público.
- Tipos textuales `REG_nombre` y `OFL_nombre` y compatibilidades de claves enteras.
- Período `2026` como configuración de ejemplo, no como período institucional permanente.

## 20. Decisión final y control de cambios

**Decisión:** preservar **15 tablas** en `SIDINACC_LOCAL`, sin recrearlas ni reducirlas. La v0.7 **no exige nuevas tablas institucionales inmediatas**. La actualización principal recae en la documentación y los contratos de lectura contextual por período y ámbito. Antes de implementar Posibles referencias mediante datos reales deben conocerse las fuentes y criterios autorizados.

```text
IDENTIDAD: CAF_PERSONA, CAF_CAT_SEXO, CAF_PERSONA_DETALLE
FAMILIA / UBICACIÓN: CAF_FAMILIA, CAF_FAMILIA_DETALLE
TERRITORIO: RCS_ESTABLECIMIENTO, CAF_CAT_OFICINA_LOCAL, CAF_CAT_REGION
PERÍODO: RCS_PERIODO
SERVICIOS: CAF_SERVICIO, CAF_CAT_TIPO_CLIENTE, CAF_SERVICIO_CLIENTE
CONTEXTO DEL MENOR: CAF_MENOR
ANTECEDENTES NUTRICIONALES DEMO: CAF_EVALUACION_MENOR, CAF_INDICADOR_ANTROPOMETRICO
```

### Registro de cambios

| Versión | Fecha | Descripción |
|---|---|---|
| 0.1 | Octubre 2026 | Especificación inicial de 12 tablas, contratos mínimos y pruebas base. |
| **0.2** | **03/11/2026** | Conciliación documental con los 15 objetos del SQL existente; ampliación de menor/encargado, contacto familiar, evaluación e indicador nutricional; semillas territoriales vigentes; 61 pruebas definidas; adaptación conceptual a SIA v0.7, sin continuidad automática y con integración de detección pendiente. |

### Estado de cumplimiento de la revisión

- **Documentado:** inventario de 15 tablas, SQL local de referencia, separación de dominios, fuentes y limitaciones.
- **Implementado según scripts versionados:** estructura, seeds, índices y `090_smoke_tests.sql`.
- **No verificado en esta revisión:** ejecución en SQL Server real, resultados de pruebas, adaptador de aplicación y proveedor de autorización.
- **Pendiente institucional:** validaciones `TODO-UTIC` de este documento.

### Próximo trabajo independiente

Rediseñar después la **BD propia de SIA-CENCINAI** de conformidad con v0.7, eliminando continuidad automática, definiendo unicidad global de caso activo, revaloraciones históricas, cierre estructurado y persistencia de informes analíticos. **Ese rediseño no debe alterar las tablas de este espejo.**
