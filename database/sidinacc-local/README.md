# SIDINACC_LOCAL — réplica local sintética

## 1. Propósito

`SIDINACC_LOCAL` es una réplica **mínima, parcial y 100 % sintética** de la superficie
de datos SIDINACC/CAH que SIA-CENCINAI v0.1 necesita consumir.

Contrato fuente: [`docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md`](../../docs/architecture/SIDINACC_LOCAL_REPLICA_SPEC.md)
(v0.1, **pendiente de validación contra el DDL real de UTIC**). Ante cualquier diferencia
entre este README y la especificación, prevalece la especificación.

## 2. Qué representa y qué NO representa

Representa una **fuente institucional simulada de solo lectura** para desarrollo local.

NO es:

- SIDINACC completo (no replica las 57 tablas del manual, solo 12 proyecciones mínimas);
- la base `SIA_CENCINAI` (persistencia propia de A.I.; bases separadas);
- una fuente de autorización institucional: la relación usuario → perfil → establecimientos
  autorizados vive **fuera** de esta BD (spec §7);
- un contenedor de lógica: no hay procedimientos almacenados, triggers, jobs, vistas ni funciones.

## 3. Tablas incluidas (12)

Agrupadas según spec §20. Todas en esquema `dbo`, definidas en `010_schema_core.sql`.

| Grupo | Tabla | Rol |
| --- | --- | --- |
| PERSONA | `CAF_PERSONA` | Identificación (`PER_idPersona`), nombre, nacimiento, sexo y familia. |
| PERSONA | `CAF_CAT_SEXO` | Traduce `CAT_idSexo` a descripción. |
| PERSONA | `CAF_PERSONA_DETALLE` | Patrón histórico por período; **no** se usa para ubicación. |
| FAMILIA / UBICACIÓN | `CAF_FAMILIA` | Puente Persona → Familia. |
| FAMILIA / UBICACIÓN | `CAF_FAMILIA_DETALLE` | Establecimiento actual de la familia por período (fuente de ubicación). |
| JERARQUÍA | `RCS_ESTABLECIMIENTO` | Establecimiento y su Oficina Local. |
| JERARQUÍA | `CAF_CAT_OFICINA_LOCAL` | Oficina Local y su Región. |
| JERARQUÍA | `CAF_CAT_REGION` | Región institucional. |
| TIEMPO | `RCS_PERIODO` | Dimensión temporal del CAH. |
| SERVICIOS | `CAF_SERVICIO` | Descripción del servicio/modalidad. |
| SERVICIOS | `CAF_CAT_TIPO_CLIENTE` | Tipo de cliente del servicio. |
| SERVICIOS | `CAF_SERVICIO_CLIENTE` | Servicios de una persona por período/mes. |

## 4. Tablas y objetos excluidos

De spec §3.2: `CAF_EVALUACION_MENOR`, `CAF_INDICADOR_ANTROPOMETRICO`, `CAF_MENOR`,
`CAF_NACIONALIDAD` y demás catálogos demográficos, `RCS_PROVINCIA`/`RCS_CANTON`/`RCS_DISTRITO`/`RCS_POBLADO`,
`CAF_DETALLE_TRASLADO`/`CAF_GENERACION_CLAVE`/`CAF_CAT_TIPO_TRASLADO`, `CAF_PAR_PRIORIDAD`,
`CAF_CAT_REFERENCIA`, `CAF_SALUD`, tablas PMS, `RCS_TOKEN`, triggers, jobs y SP de mantenimiento.

Además, no se crean: tablas de A.I. (pertenecen a `SIA_CENCINAI`), tablas inventadas de
usuario/establecimiento, auditoría institucional ni vistas. T14 y T37 verifican las 12 tablas
permitidas; T39 verifica la ausencia de vistas, procedimientos, funciones y triggers.

## 5. Relaciones sin FK física

Estas relaciones son **solo lógicas** (según spec) y se verifican en el smoke test T13:

| Columna | Destino lógico | Motivo |
| --- | --- | --- |
| `CAF_CAT_OFICINA_LOCAL.CAT_idRegion` | `CAF_CAT_REGION.CAT_idRegion` | `tinyint` vs `int` en el manual. |
| `CAF_PERSONA_DETALLE.EST_idEstablecimientoActual` | `RCS_ESTABLECIMIENTO.EST_idEstablecimiento` | `numeric(18,0)` vs `int`. |
| `RCS_ESTABLECIMIENTO.CAT_idOficinaLocal` | `CAF_CAT_OFICINA_LOCAL.CAT_idOficinaLocal` | El DDL de la spec no define FK. |

El resto de relaciones (familia, sexo, período, servicio, tipo de cliente, persona) sí tienen FK física.

## 6. Orden de ejecución

1. `001_create_database.sql`
2. `010_schema_core.sql`
3. `020_seed_catalogs.sql` (periodo, sexo, tipo de cliente, servicio sintético)
4. `030_seed_institutional_structure.sql` (Región, Oficina Local, establecimiento)
5. `040_seed_synthetic_population.sql` (familias, personas y servicios sintéticos)
6. `090_smoke_tests.sql`

`030_seed_institutional_structure.sql` y `data/cen_cinai_territorial_catalog.csv` son artefactos **derivados**. Se regeneran con:

```powershell
python database/sidinacc-local/tools/generate_territorial_seed.py
python database/sidinacc-local/tools/generate_territorial_seed.py --check
```

Fuente institucional del catálogo: `docs/reference/source_docs/Listado-de-establecimientos.xlsx` (hoja `ESTABL_ACTr`, que sí incluye código de establecimiento, Oficina Local y Región). El path citado en `docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md` (`reference/source-documents/Listado-de-establecimientos-CEN-CINAI-2025.xlsx`) no está presente en el repositorio.

## 7. Cómo ejecutar

Rutas relativas a la raíz del repositorio. `-b` hace que `sqlcmd` termine con código distinto
de cero ante un error; `-I` activa `QUOTED_IDENTIFIER`.

Autenticación de Windows:

```powershell
sqlcmd -S <servidor> -E -b -I -i database/sidinacc-local/001_create_database.sql
```

Se prefiere la autenticación de Windows (`-E`). Si se requiere autenticación SQL, **no** pasar
la contraseña con `-P` ni con `-v`: definir `SQLCMDPASSWORD` solo en la sesión actual de
PowerShell (no persistida en el perfil, en archivos ni en el repositorio) y omitir `-P`:

```powershell
$env:SQLCMDPASSWORD = Read-Host 'Contraseña SQL'   # solo en la sesión actual
sqlcmd -S <servidor> -U <usuario_admin_local> -b -I -i database/sidinacc-local/001_create_database.sql
Remove-Item Env:SQLCMDPASSWORD                      # al terminar
```

**Motor mínimo:** SQL Server 2017 o superior (`090_smoke_tests.sql` usa `STRING_AGG`); objetivo
de prueba: 2019 o superior. La versión del motor institucional no se conoce (TODO-UTIC).

Los seis scripts en orden, deteniéndose en el primer fallo:

```powershell
$server = '<servidor>'
$files = '001_create_database.sql', '010_schema_core.sql', '020_seed_catalogs.sql',
         '030_seed_institutional_structure.sql', '040_seed_synthetic_population.sql',
         '090_smoke_tests.sql'
foreach ($f in $files) {
    sqlcmd -S $server -E -b -I -i "database/sidinacc-local/$f"
    if ($LASTEXITCODE -ne 0) { throw "Fallo en $f (exit code $LASTEXITCODE)" }
}
```

La cuenta que ejecuta los scripts necesita permisos para crear la base, tablas, rol y usuario,
y para `EXECUTE AS USER` (usado por T38).

**SSMS:** abrir y ejecutar cada archivo en el orden anterior. Los scripts 010, 020, 030, 040 y 090
comienzan con `USE SIDINACC_LOCAL`, una guarda `IF DB_NAME() <> N'SIDINACC_LOCAL' THROW 50001`
y un respaldo `SET NOEXEC ON`, de modo que si la base activa no es `SIDINACC_LOCAL` el resto de
los lotes no se ejecuta. Cada script termina con `SET NOEXEC OFF`.

### Opcional: SQL Server 2022 en Docker (desarrollo)

**El repositorio no incluye infraestructura Docker** (ni Dockerfile ni compose). Lo siguiente es un
comando puntual documentado; la contraseña se lee de una variable de entorno del host.

Advertencia: los valores pasados con `-e` quedan visibles mediante `docker inspect` (y en el
historial del proceso). Esto es aceptable **solo** para un contenedor local desechable de
desarrollo, con una contraseña generada localmente para ese contenedor y **nunca reutilizada**
en otro entorno.

```powershell
$env:MSSQL_SA_PASSWORD = Read-Host 'Contraseña SA local'
docker run -d --name sidinacc-local-sql -p 1433:1433 `
  -e "ACCEPT_EULA=Y" -e "MSSQL_SA_PASSWORD=$env:MSSQL_SA_PASSWORD" `
  mcr.microsoft.com/mssql/server:2022-latest

docker cp database/sidinacc-local sidinacc-local-sql:/tmp/sidinacc-local
docker exec -e "SQLCMDPASSWORD=$env:MSSQL_SA_PASSWORD" sidinacc-local-sql `
  /opt/mssql-tools18/bin/sqlcmd -S localhost -U sa -C -b -I -i /tmp/sidinacc-local/001_create_database.sql
```

Repetir el `docker exec` para cada script en el orden de la sección 6. `-C` confía en el
certificado autofirmado del contenedor (solo desarrollo).

## 8. Idempotencia y no destrucción

- 001 crea la base solo si `DB_ID(N'SIDINACC_LOCAL') IS NULL`; si existe, la deja intacta.
- 010 protege cada `CREATE TABLE`/`CREATE INDEX`/rol/usuario/membresía con comprobaciones de
  existencia y no modifica la estructura de tablas existentes. En cada ejecución reaplica el
  `DENY` del rol de lectura (idempotente) y agrega membresías solo si faltan.
- Las guardas de existencia **no verifican la forma** de una tabla o índice ya existente. Si la
  estructura difiere de la spec, una persona recrea la base manualmente (ver abajo).
- 020, 030 y 040 verifican sus precondiciones **antes de abrir la transacción** y lanzan `THROW 50002`
  si faltan las tablas de 010, los catálogos de 020 (030/040) o la estructura territorial de 030 (040).
  030 y 040 lanzan `THROW 50003` si el contenido existente no coincide con la fuente (p. ej. catálogo DEMO anterior).
- 020, 030 y 040 solo usan `INSERT ... WHERE NOT EXISTS` por clave primaria, dentro de una transacción
  con `XACT_ABORT ON` y `ROLLBACK` en caso de error.
- Ningún script contiene `DROP`, `UPDATE` ni `DELETE`. 090 solo escribe en variables de tabla.
- Reejecutar es seguro. Los seeds **no sobrescriben** filas modificadas manualmente; si los
  datos se alteran, los smoke tests pueden fallar.
- Para restablecer: una persona elimina **manualmente** la base `SIDINACC_LOCAL` y vuelve a
  ejecutar los seis scripts. Esta acción no está automatizada en ningún script y no afecta `SIA_CENCINAI`.
  Un login de servidor creado manualmente (sección 15) sobrevive a la eliminación de la base;
  tras recrearla hay que volver a mapearlo (`CREATE USER ... FOR LOGIN` + `ALTER ROLE`).

## 9. Datos territoriales reales y población sintética

Los nombres e identificadores de **Región, Oficina Local y establecimiento** son datos
institucionales públicos tomados del Excel oficial y de
`docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md`. No se copian teléfonos, direcciones,
ni ningún dato de personas reales.

La población (personas, familias, fechas de nacimiento, servicios) es 100 % sintética.
Todos los `PER_idPersona` usan `SYN-<ESTID>-<NN>` (T05/T25). Semilla fija:
`SIDINACC_SYNTHETIC_SEED = 20261019`. Solo los establecimientos **activos**
(`EST_inActivo = 1` y no eliminados) reciben población sintética: 5–10 personas
activas en 2026 (T23). Los 31 inactivos/cerrados se conservan en el catálogo
territorial con 0 personas activas en 2026 (T41). Detalle cuantitativo:
`DATASET_SUMMARY.md` (totales de personas, familias y servicios = **PROJECTION**,
no conteos runtime de esta corrección).

**Jerarquía institucional** (`030_seed_institutional_structure.sql`):

- 9 Direcciones Regionales (códigos 1–9).
- 41 Oficinas Locales (códigos 101, 102, …, 904).
- Establecimientos = filas con código de la hoja `ESTABL_ACTr` del Excel oficial (hoy 661:
  630 `ACTIVO` → `EST_inActivo = 1`; 23 `CERRADO` y 8 `INACTIVO` → `EST_inActivo = 0`).

**Escenarios sintéticos** (`040_seed_synthetic_population.sql`):

| Persona | Escenario |
| --- | --- |
| `SYN-1100102-01` | Identificación exacta (Ana Campos Jimenez); 2 servicios en 2026. |
| `SYN-1100102-02` | Sin servicios en 2026. |
| `SYN-1100102-03` | Familia con EST 1010320 en 2025 y EST 1100102 en 2026. |
| `SYN-1100102-99` | `BIT_eliminado = 1`; no cuenta en el rango 5–10. |
| `SYN-1010320-01` / `SYN-1010321-01` | Lucia Mora Campos / Campo, misma OL Hatillo (101). |
| `SYN-1010202-01` / `SYN-1190108-01` | Mateo Vargas Rojas en Central Sur y Brunca. |

## 10. Período configurado y regla de ubicación

- Períodos sembrados: `2025` y `2026` (`RCS_periodoAnterior` de 2026 = 2025).
- La app debe configurar explícitamente `SIDINACC_PERIOD_ID=2026`; los smoke tests usan
  `@periodId = 2026` como equivalente.
- No se infiere el período vigente (TODO-UTIC).
- Regla de ubicación (spec §6): usar `CAF_FAMILIA_DETALLE` del período configurado y no eliminado.
  Si no existe, la ubicación es `null`; **no** hay fallback a otros períodos. T09 demuestra el caso 2025/2026.

## 11. PROVISIONAL_TYPE

- `CAF_CAT_REGION.REG_nombre` y `CAF_CAT_OFICINA_LOCAL.OFL_nombre` son `varchar(200)`. La ficha del
  manual indica `tinyint` o es inconsistente, pero el SQL institucional los usa como texto.

## 12. LOCAL_COMPATIBILITY_DECISION

Solo para el mock, los IDs de catálogo se fijan iguales al `SNB_codigo` documentado (vía `IDENTITY_INSERT`):

| Tabla | ID / SNB_codigo | Descripción |
| --- | --- | --- |
| `CAF_CAT_SEXO` | 1 / 1 | Hombre |
| `CAF_CAT_SEXO` | 2 / 2 | Mujer |
| `CAF_CAT_SEXO` | 3 / 3 | Intersex |
| `CAF_CAT_TIPO_CLIENTE` | 1 / 1 | Niño menor 13 años |
| `CAF_CAT_TIPO_CLIENTE` | 2 / 2 | Gestante / Lactante |

Los IDs/códigos reales deben verificarse con UTIC.

## 13. NEEDS_VALIDATION

- `CAF_PERSONA.PER_beneficiario` y `CAF_FAMILIA_DETALLE.FAD_inActiva` quedan en `NULL` en todas las
  filas: su semántica no está documentada y no se inventan valores 0/1 (verificado por T40).
- `CAF_SERVICIO` contiene valores sintéticos de relleno (`Servicio Demo 1..3 (SINTETICO)`); no es el
  catálogo institucional ni define semántica de modalidad.
- La "ñ" de `Niño menor 13 años` se construye con `NCHAR(241)` y se almacena en `varchar(100)`; se
  conserva correctamente solo si la intercalación de la base usa una página de códigos Latin1
  (p. ej. 1252) o UTF-8. 001 usa la intercalación predeterminada del servidor. T03 lo detecta
  mediante una comparación `nvarchar` binaria.

## 14. TODO-UTIC

1. DDL real de las tablas consumidas.
2. `PER_idPersona` vs `RCS_idPersona`: `PER_idPersona` es la clave de integración v0.1; cambiarla solo mediante ADR.
3. Mecanismo real de autenticación/sesión.
4. Dónde vive usuario → perfil/rol → establecimientos autorizados.
5. Mecanismo para determinar el período vigente.
6. Integración por tablas, vistas o API/servicio.
7. Tipos reales de `REG_nombre` y `OFL_nombre`.
8. `tinyint` vs `int` en `CAT_idRegion`.
9. `numeric(18,0)` vs `int` en `CAF_PERSONA_DETALLE.EST_idEstablecimientoActual`.
10. `CAF_SERVICIO_CLIENTE.BIT_eliminado` como `tinyint` (no `bit`).
11. Si `CAF_SERVICIO` corresponde exactamente a la modalidad que SIA debe mostrar.
12. IDs/códigos reales de sexo y tipo de cliente.
13. Semántica de `EST_inActivo`: el mock interpreta `1` como "activo", según las consultas de spec §9;
    el nombre de la columna admite la lectura contraria.
14. Semántica de `RCS_periodoAnterior`: el mock interpreta `2025` como período anterior de `2026`.
15. Versión del motor SQL Server institucional (el mock requiere 2017+).
16. Restricciones adicionales para datos sensibles.
17. Ambiente de pruebas y credenciales de solo lectura.

## 15. Regla de solo lectura

`010_schema_core.sql` crea:

- el rol `sia_sidinacc_reader_role`, miembro de `db_datareader`, con
  `DENY INSERT, UPDATE, DELETE, ALTER`. El `DENY ALTER` es un requisito explícito de esta tarea,
  adicional a spec §14;
- el usuario `sia_sidinacc_reader` **WITHOUT LOGIN**, miembro del rol. T38 verifica SELECT = 1,
  INSERT/UPDATE/DELETE/ALTER = 0 y las 4 filas `DENY`.

La app solo ejecuta `SELECT`. Para un login local real, una persona ejecuta el siguiente ejemplo
**de forma interactiva** en SSMS o en una sesión `sqlcmd`, escribiendo la contraseña en el momento
de la ejecución en lugar del marcador. No guardar el texto con la contraseña en ningún archivo ni
en el repositorio, ni pasarla con `sqlcmd -v`:

```sql
USE master;
GO
CREATE LOGIN sia_sidinacc_app WITH PASSWORD = N'<PASSWORD_LOCAL_NO_VERSIONAR>';
GO
USE SIDINACC_LOCAL;
GO
CREATE USER sia_sidinacc_app FOR LOGIN sia_sidinacc_app;
ALTER ROLE sia_sidinacc_reader_role ADD MEMBER sia_sidinacc_app;
GO
```

Precauciones de comillas: una comilla simple dentro de la contraseña debe duplicarse (`''`); en
`sqlcmd`, la secuencia `$(` se interpreta como variable de script, por lo que conviene evitarla o
usar SSMS. No dejar la contraseña en el historial de consultas ni en archivos guardados.

El login es un objeto del servidor: **sobrevive** a la eliminación manual de `SIDINACC_LOCAL`.
Tras recrear la base, repetir solo `CREATE USER ... FOR LOGIN` y `ALTER ROLE ... ADD MEMBER`.

No hay contraseñas, cadenas de conexión ni archivos `.env` reales en el repositorio.

## 16. Smoke tests (`090_smoke_tests.sql`)

T01–T14 cubren catálogos no territoriales, búsqueda y escenarios sintéticos. T15–T37 cubren
la jerarquía territorial real y la población (T23 solo sobre EST **activos**). T38–T40
conservan rol de solo lectura, ausencia de objetos extra y `NULL` no documentados. T41
verifica 0 personas activas en 2026 en cada EST inactivo/cerrado. Ámbito nacional
(establecimientos activos y no eliminados) y período 2026, salvo las pruebas que
inspeccionan 2025.

| Test | Verifica |
| --- | --- |
| T01 | Períodos 2025 y 2026. |
| T02 | Sexo: 3 valores documentados. |
| T03 | Tipo de cliente: 2 valores documentados (incl. "ñ"). |
| T04 | Servicios 1–3 marcados `(SINTETICO)`. |
| T05 | Ningún ID de persona sin prefijo `SYN-`. |
| T06 | `SYN-1100102-01` se resuelve por identificación y aparece primero. |
| T07 | `Lucia Mora Camp` devuelve `SYN-1010320-01` y `SYN-1010321-01`. |
| T08 | `SYN-1100102-99` existe eliminada y no aparece. |
| T09 | Familia de `SYN-1100102-03`: 2025 = 1010320, 2026 = 1100102. |
| T10 | `SYN-1100102-01` tiene servicios 1 y 2 en 2026. |
| T11 | `SYN-1100102-02` existe, se resuelve y no tiene servicios 2026. |
| T12 | Servicio-cliente y persona-detalle sin huérfanos. |
| T13 | Todo EST resuelve OL y Región; EST de persona-detalle existen. |
| T14 | Exactamente las 12 tablas permitidas. |
| T15 | Exactamente las 9 Regiones esperadas. |
| T16 | Exactamente las 41 Oficinas Locales esperadas. |
| T17 | Cada OL referencia una Región válida. |
| T18 | El número de establecimientos coincide con el catálogo derivado (`@expEstTotal` / checksum). |
| T19 | Cada establecimiento posee una Oficina Local válida. |
| T20 | Cada establecimiento resuelve hasta una Región. |
| T21 | No hay establecimientos duplicados por código. |
| T22 | No hay establecimientos huérfanos. |
| T23 | Cada establecimiento **ACTIVO** tiene entre 5 y 10 personas activas en 2026. |
| T24 | Todas las personas activas tienen `PER_idPersona` sintético. |
| T25 | Formato `SYN-<ESTID>-<NN>` y longitud ≤ 20. |
| T26 | No hay `PER_idPersona` duplicados. |
| T27 | Todas las personas activas tienen familia válida. |
| T28 | Todas las familias usadas en 2026 tienen `CAF_FAMILIA_DETALLE` válido. |
| T29 | Todas las Regiones tienen población sintética. |
| T30 | Todas las Oficinas Locales tienen población sintética. |
| T31 | Al menos una persona sin servicios. |
| T32 | Al menos una persona con 2+ servicios. |
| T33 | Al menos una familia con establecimiento distinto en 2025 y 2026. |
| T34 | Al menos una persona `BIT_eliminado = 1`. |
| T35 | La persona eliminada no entra en el rango 5–10. |
| T36 | Todos los servicios referencian persona, servicio, tipo y período válidos. |
| T37 | No hay tablas fuera de las 12 permitidas. |
| T38 | `sia_sidinacc_reader` solo lee. |
| T39 | Sin vistas, procedimientos, funciones ni triggers de usuario. |
| T40 | `PER_beneficiario` y `FAD_inActiva` permanecen `NULL`. |
| T41 | Cada establecimiento **INACTIVO/CERRADO** tiene 0 personas activas en 2026. |

Reporte: el script devuelve un result set (`test`, `descripcion`, `resultado`, `detalle`). Si alguna
prueba no es `PASS` lanza `THROW 50090`; si no se evaluaron exactamente 41 pruebas lanza
`THROW 50091`. Con `sqlcmd -b` ambos producen un código de salida distinto de cero. En éxito
imprime `SIDINACC_LOCAL smoke tests PASSED (41/41)`. Ese `41/41` es el contrato del script,
no un resultado runtime de esta corrección (ver §18).

Las pruebas de ámbito por usuario (Establecimiento, multiestablecimiento, OL, Regional) pertenecen
al futuro adapter, porque la autorización local vive fuera de la BD (spec §16).

## 17. Relación futura con SIA_CENCINAI

- `SIDINACC_LOCAL` y `SIA_CENCINAI` son bases separadas; estos scripts no tocan `SIA_CENCINAI`.
- SIA guardará solo `PER_idPersona` para vincular entidades A.I.; no copiará datos maestros
  salvo snapshot, denormalización o caché justificados (spec §8).
- El acceso será mediante un futuro adaptador `SidinaccReader`.

**No implementado todavía:** `SidinaccReader`, `SqlSidinaccReader`, `MockInstitutionalAuthProvider`,
`users.json`, backend ni frontend. Este directorio solo contiene los scripts SQL de `SIDINACC_LOCAL`,
el catálogo territorial derivado, el generador y este README.

## 18. Estado de validación

- Primera ejecución runtime (seed anterior): **PASS** 40/40, 661 establecimientos, población
  también en inactivos. Los totales 4952/4946 de esa corrida quedan **obsoletos**.
- Tras restringir la población a `EST_inActivo = 1` (el script ahora evalúa **41** pruebas;
  se añadió T41): **NOT_RUN**. No se modificó la instancia SQL existente. Los seeds no
  borran filas ya insertadas; hace falta recrear `SIDINACC_LOCAL` y volver a ejecutar
  los seis scripts.
