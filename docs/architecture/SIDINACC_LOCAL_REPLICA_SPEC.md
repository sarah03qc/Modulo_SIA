# Replicación de BD relevante a SIA\-CENCINAI

# SIDINACC\_LOCAL\_REPLICA\_SPEC.md

**Proyecto:** SIA-CENCINAI  
**Documento:** Especificación técnica ejecutable de la réplica local de SIDINACC/CAH  
**Uso:** fuente de verdad para Cursor durante la implementación local  
**Estado:** v0.1 — desarrollo / pendiente de validación contra DDL real de UTIC  
**Fecha:** octubre 2026

---

## 1. Objetivo

Construir `SIDINACC_LOCAL`, una réplica **mínima y deliberadamente parcial** de la base institucional SIDINACC/CAH que contenga **exactamente la superficie de datos que SIA-CENCINAI necesita consumir en la primera implementación**.

No se pretende clonar SIDINACC completo. La réplica debe reproducir nombres institucionales, relaciones y semántica de los objetos que SIA consume, usando exclusivamente datos sintéticos, de forma que el código pueda desarrollarse ahora y luego sustituir el origen local por la integración institucional real sin reescribir la lógica de negocio.

```
SIDINACC_LOCAL                    SIA_CENCINAI
(datos institucionales mock)      (datos propios de A.I.)
          │                               ▲
          │ solo lectura                  │ lectura/escritura
          ▼                               │
   SidinaccReader / Adapter ───────────────┘
```

### Regla arquitectónica

- `SIDINACC_LOCAL` = fuente maestra institucional simulada.
- `SIA_CENCINAI` = persistencia propia de Atención Interdisciplinaria.
- SIA **NO** debe modificar `SIDINACC_LOCAL`.
- SIA **NO** debe copiar innecesariamente datos maestros a su propia BD.
- La unión entre ambos dominios se hace mediante identificadores institucionales.
- El código de dominio de SIA no debe conocer tablas `CAF_*` ni `RCS_*`; debe consumir un adaptador.

---

## 2. Fuentes utilizadas

Esta especificación se deriva de:

1. **Manual Técnico — Módulo Caracterización del Ambiente del Hogar (CAH)**, DNCC-DI-UTIC-M-00X-2021, con registro de cambio de 06/06/2023.
2. Análisis técnico filtrado de SIDINACC/CAH elaborado para el proyecto SIA-CENCINAI en Confluence.
3. Especificación funcional vigente de SIA-CENCINAI, principalmente:
    - búsqueda de cliente/beneficiaria;
    - reutilización de datos maestros;
    - perfil básico;
    - jerarquía Región → Oficina Local → Establecimiento;
    - servicios/modalidades disponibles;
    - restricciones por ámbito;
    - establecimientos autorizados;
    - futura reutilización de vigilancia/tamizaje.

### Regla de fidelidad ante inconsistencias del manual

El manual contiene diferencias entre fichas de tabla, diagramas y SQL ejecutable. Para esta réplica se usa el siguiente orden:

1. **SQL de vistas/SP documentado**, cuando demuestra cómo se usa realmente un campo.
2. **Ficha de tabla** para nombre, tipo, nulabilidad, PK/FK e Identity.
3. **Diagrama ER** como evidencia de existencia/relación.
4. Si el tipo exacto no puede determinarse, se marca `PROVISIONAL_TYPE` y se deberá sustituir cuando UTIC facilite el DDL real o acceso a `INFORMATION_SCHEMA`.

No corregir silenciosamente discrepancias institucionales.

---

## 3. Alcance final

### 3.1 Objetos que SÍ se crean en `SIDINACC_LOCAL`

| Objeto | Razón exacta para SIA | Rol |
| --- | --- | --- |
| `CAF_PERSONA` | identificación, nombre, fecha de nacimiento, sexo, vínculo con familia | directo |
| `CAF_CAT_SEXO` | traducir `CAT_idSexo` a descripción | directo |
| `CAF_FAMILIA` | puente institucional Persona → Familia | soporte |
| `CAF_FAMILIA_DETALLE` | establecimiento actual de la familia por período | directo |
| `RCS_PERIODO` | mantener la dimensión temporal del CAH | directo |
| `RCS_ESTABLECIMIENTO` | establecimiento y vínculo con Oficina Local | directo |
| `CAF_CAT_OFICINA_LOCAL` | Oficina Local y vínculo con Región | directo |
| `CAF_CAT_REGION` | Región institucional | directo |
| `CAF_SERVICIO` | descripción del servicio/modalidad | directo |
| `CAF_CAT_TIPO_CLIENTE` | descripción del tipo de cliente del servicio | soporte |
| `CAF_SERVICIO_CLIENTE` | servicios de una persona por período/mes | directo |
| `CAF_PERSONA_DETALLE` | compatibilidad con el patrón histórico por período y con la lectura institucional de clientes/servicios | soporte |

### 3.2 Objetos que NO se crean en esta primera réplica

| Objeto / grupo | Decisión |
| --- | --- |
| `CAF_EVALUACION_MENOR` | diferido; RF-102 aún no define el punto exacto de entrada de vigilancia/tamizaje |
| `CAF_INDICADOR_ANTROPOMETRICO` | diferido junto con `CAF_EVALUACION_MENOR` |
| `CAF_MENOR` | no requerido por las pantallas P0 actuales |
| `CAF_NACIONALIDAD` y demás catálogos demográficos | no requeridos por el perfil mínimo actual |
| `RCS_PROVINCIA`, `RCS_CANTON`, `RCS_DISTRITO`, `RCS_POBLADO` | SIA filtra actualmente por Región → OL → Establecimiento |
| `CAF_DETALLE_TRASLADO`, `CAF_GENERACION_CLAVE`, `CAF_CAT_TIPO_TRASLADO` | el traslado de expediente CAH no equivale al traslado/continuidad del caso A.I. |
| `CAF_PAR_PRIORIDAD` | prioridad CAH ≠ prioridad A.I. |
| `CAF_CAT_REFERENCIA` | referencia a servicios CEN-CINAI ≠ referencia A.I. |
| `CAF_SALUD` | el manual indica que contiene histórico pero no está habilitada en la versión documentada |
| tablas PMS | fuera del flujo A.I. actual |
| `RCS_TOKEN` | token de SINIRUBE; no representa autenticación/sesión SIDINACC |
| triggers, jobs y SP de mantenimiento | SIA solo necesita lectura de la réplica |

---

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

### 5.8 `CAF_FAMILIA_DETALLE`

**Fuente:** Manual CAH, ficha pág. 41; vista `uV_ListarClientesServicios`, págs. 68–70.

Esta es la fuente preferida para determinar el **establecimiento actual por período**, porque la propia vista institucional utiliza `FD.EST_idEstablecimientoActual` para derivar establecimiento, Oficina Local y Región.

```sql
CREATE TABLE dbo.CAF_FAMILIA_DETALLE (
    FAD_idFamiliaDetalle        int IDENTITY(1,1) NOT NULL PRIMARY KEY,
    FAM_idFamilia               int NOT NULL,
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

## 8. Adapter obligatorio

El dominio SIA no debe ejecutar SQL institucional directamente.

```typescript
export interface SidinaccReader {
  searchPersons(
    query: string,
    scope: InstitutionalUserContext
  ): Promise<PersonSummary[]>;

  getPersonProfile(
    personId: string,
    scope: InstitutionalUserContext
  ): Promise<PersonProfile | null>;

  getPersonServices(
    personId: string,
    periodId: number
  ): Promise<InstitutionalService[]>;

  listEstablishmentsForScope(
    scope: InstitutionalUserContext
  ): Promise<InstitutionalEstablishment[]>;
}
```

DTO mínimo:

```typescript
export interface PersonSummary {
  institutionalPersonId: string; // PER_idPersona
  fullName: string;
  birthDate: string | null;
  age: number | null;             // calcular en aplicación
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

### Regla de persistencia en SIA

Cuando una entidad A.I. necesite vincularse a una persona:

```
guardar PER_idPersona
```

No copiar permanentemente nombre, sexo, región, OL o establecimiento salvo que se trate deliberadamente de:

- snapshot histórico;
- dato denormalizado con justificación;
- caché explícito con estrategia de invalidez.

---

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

## 12. Vigilancia / tamizaje

No implementar todavía.

La extensión futura esperada del adapter podrá consumir:

```
CAF_EVALUACION_MENOR
CAF_INDICADOR_ANTROPOMETRICO
```

para fecha, edad, peso, talla y resultados PE/PT/TE/IMC.

Pero RF-102 todavía establece que el punto exacto donde estos hallazgos ingresan al flujo A.I. debe definirse antes de automatizarlo.

Por tanto:

```typescript
// FUTURE — no implementar en v0.1
interface SidinaccSurveillanceReader {
  getLatestAnthropometricEvaluation(personId: string): Promise<unknown>;
}
```

No crear tablas “por si acaso”.

---

## 13. Seed sintético obligatorio

### Jerarquía mínima

```
Región Demo Norte
  ├─ OL Demo A
  │   ├─ EST 1001001
  │   └─ EST 1001002
  └─ OL Demo B
      └─ EST 1002001

Región Demo Sur
  └─ OL Demo C
      ├─ EST 2001001
      └─ EST 2001002
```

### Personas mínimas

Crear al menos 12 personas sintéticas que incluyan:

- 2 nombres muy similares;
- 1 identificación exacta fácil de localizar;
- 1 persona sin servicios en 2026;
- 1 persona con dos servicios;
- 1 persona con `BIT_eliminado = 1`;
- 1 familia con establecimiento distinto en 2025 y 2026;
- personas distribuidas entre los cinco establecimientos.

IDs sintéticos:

```
SYN-000001
SYN-000002
...
```

### Períodos

```
2025
2026
```

La familia trasladada debe tener:

```
2025 -> EST 1001001
2026 -> EST 2001001
```

para demostrar que SIA toma el establecimiento correspondiente al período configurado.

**Prohibido:** usar nombres, identificaciones, expedientes u otros datos reales de CEN-CINAI.

---

## 14. Usuario SQL de solo lectura

La app SIA no debe conectarse a `SIDINACC_LOCAL` con un usuario con permisos de escritura.

Ejemplo:

```
USE SIDINACC_LOCAL;
GO

CREATE USER sia_sidinacc_reader WITHOUT LOGIN;
GO

ALTER ROLE db_datareader ADD MEMBER sia_sidinacc_reader;
GO

DENY INSERT, UPDATE, DELETE TO sia_sidinacc_reader;
GO
```

En Docker/desarrollo real usar un login separado y mapearlo a este rol/usuario según la configuración del entorno.

---

## 15. Estructura esperada del repositorio

```
database/
  sidinacc-local/
    001_create_database.sql
    010_schema_core.sql
    020_seed_catalogs.sql
    030_seed_synthetic.sql
    090_smoke_tests.sql
    README.md

src/
  integrations/
    sidinacc/
      SidinaccReader.ts
      SqlSidinaccReader.ts
      types.ts

    auth/
      InstitutionalAuthProvider.ts
      MockInstitutionalAuthProvider.ts
      fixtures/
        users.json
```

No mezclar scripts `SIDINACC_LOCAL` con migraciones de `SIA_CENCINAI`.

---

## 16. Smoke tests obligatorios

`090_smoke_tests.sql` debe verificar al menos:

```
T01  2 regiones existen
T02  3 OL existen
T03  5 establecimientos activos existen
T04  12+ personas sintéticas existen
T05  no hay personas cuyo ID no empiece por SYN-
T06  persona SYN-000001 se resuelve por identificación
T07  búsqueda por apellido devuelve múltiples candidatos
T08  una persona eliminada no aparece
T09  familia histórica resuelve EST distinto en 2025 y 2026
T10  persona con dos servicios devuelve ambos
T11  persona sin servicios devuelve lista vacía
T12  todos los servicios referencian personas/períodos válidos
```

Las pruebas de ámbito se ejecutan a nivel de adapter porque la autorización local vive fuera de la BD.

---

## 17. Criterios de aceptación

La réplica se considera lista cuando:

- `SIDINACC_LOCAL` y `SIA_CENCINAI` son bases separadas.
- Todos los datos de `SIDINACC_LOCAL` son sintéticos.
- SIA posee acceso de lectura únicamente.
- Se puede buscar una persona por `PER_idPersona`.
- Se puede buscar por nombre parcial.
- La coincidencia exacta por ID aparece primero.
- Ninguna búsqueda retorna personas fuera del ámbito.
- El perfil devuelve establecimiento, Oficina Local y Región.
- El establecimiento se resuelve para el período configurado.
- El usuario de un establecimiento lo recibe automáticamente.
- El usuario multiestablecimiento solo puede usar los establecimientos autorizados.
- Oficina Local resuelve sus establecimientos.
- Regional resuelve establecimientos a través de sus OL.
- Nacional puede resolver todos los establecimientos activos.
- El perfil puede devolver servicios/modalidades del período.
- El caso 2025/2026 demuestra que no se usa un establecimiento histórico incorrecto.
- La lógica de dominio depende de `SidinaccReader`, no de SQL institucional.
- La autorización depende de `InstitutionalAuthProvider`, no de tablas inventadas.
- No existe ningún dato real de clientes/beneficiarias.

---

## 18. Instrucciones explícitas para Cursor

Cursor **NO DEBE**:

1. clonar las 57 tablas del manual;
2. crear datos reales o seudonimizados a partir de registros reales;
3. crear una tabla institucional ficticia de `usuario -> establecimientos` y tratarla como fuente oficial;
4. usar `RCS_TOKEN` como sesión/autenticación SIDINACC;
5. usar `CAF_PAR_PRIORIDAD` como prioridad A.I.;
6. usar `CAF_CAT_REFERENCIA` como referencia A.I.;
7. implementar traslado A.I. reutilizando directamente el traslado CAH;
8. implementar `CAF_EVALUACION_MENOR`/vigilancia en v0.1;
9. acceder a `CAF_*`/`RCS_*` desde controladores o servicios de dominio;
10. persistir copias de datos maestros sin justificar snapshot/caché/histórico;
11. corregir silenciosamente tipos o nombres inconsistentes del manual;
12. inventar el mecanismo de período activo o de autorizaciones institucionales.

Cursor **SÍ DEBE**:

- mantener `SIDINACC_LOCAL` desacoplada;
- implementar `SidinaccReader`;
- implementar `MockInstitutionalAuthProvider`;
- aplicar scope antes de devolver resultados;
- conservar `PER_idPersona` como identificador de integración v0.1;
- registrar como `TODO-UTIC` todo punto que dependa del esquema institucional real.

---

## 19. TODO-UTIC antes de integración real

Estos puntos bloquean integración institucional, pero **no bloquean el mock local**:

1. obtener DDL real de las tablas consumidas;
2. confirmar `PER_idPersona` vs `RCS_idPersona` como clave oficial de interoperabilidad;
3. confirmar mecanismo real de autenticación/sesión;
4. confirmar dónde vive `usuario -> perfil/rol -> establecimientos autorizados`;
5. confirmar cómo se determina el período vigente;
6. confirmar si la integración será por tablas, vistas o API/servicio;
7. confirmar tipos reales de `REG_nombre` y `OFL_nombre`;
8. confirmar restricciones adicionales para datos sensibles;
9. obtener ambiente de pruebas y credenciales de solo lectura;
10. confirmar si `CAF_SERVICIO` corresponde exactamente a la modalidad que SIA debe mostrar.

Cuando estas respuestas existan, actualizar esta especificación antes de tocar el dominio de SIA.

---

## 20. Decisión final

La primera réplica local queda limitada a:

```
PERSONA
  CAF_PERSONA
  CAF_CAT_SEXO
  CAF_PERSONA_DETALLE

FAMILIA / UBICACIÓN
  CAF_FAMILIA
  CAF_FAMILIA_DETALLE

JERARQUÍA
  RCS_ESTABLECIMIENTO
  CAF_CAT_OFICINA_LOCAL
  CAF_CAT_REGION

TIEMPO
  RCS_PERIODO

SERVICIOS
  CAF_SERVICIO
  CAF_CAT_TIPO_CLIENTE
  CAF_SERVICIO_CLIENTE
```

Todo lo demás queda fuera hasta que un requerimiento o flujo ejecutable de SIA demuestre que realmente lo necesita.

Esto permite que la implementación local sea pequeña, auditable y reemplazable, sin convertir la simulación en una falsa reconstrucción de SIDINACC completo.
