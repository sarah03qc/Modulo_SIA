# SIDINACC_LOCAL Synthetic Dataset Summary

## Institutional sources

- Excel utilizado: `docs/reference/source_docs/Listado-de-establecimientos.xlsx`
  - hojas: `ESTABL_ACT` (listado sin código de establecimiento ni Oficina Local) y `ESTABL_ACTr` (listado con código, Oficina Local y Región)
  - autoridad para el seed: hoja `ESTABL_ACTr` (única que publica `COD_ESTABLECIMIENTO` y `COD_OFICINA_LOCAL`)
  - el path citado en `docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md` (`reference/source-documents/Listado-de-establecimientos-CEN-CINAI-2025.xlsx`) **no está en el repositorio**
- Documento territorial: `docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md` (sección 2: 9 Direcciones Regionales y 41 Oficinas Locales)
- Fecha de las fuentes: Excel institucional publicado por CEN-CINAI (archivo en el repositorio: `Listado-de-establecimientos.xlsx`); documento territorial del proyecto, octubre 2026

La hoja `ESTABL_ACTr` contiene de forma **explícita**:

`Establecimiento → Oficina Local → Región`

No se infirió Oficina Local por provincia, cantón, distrito ni proximidad.

## Territorial coverage

Catálogo territorial (sin cambio): **661** establecimientos únicos en `ESTABL_ACTr`.

- 630 `ACTIVO` → `EST_inActivo = 1`
- 31 `CERRADO`/`INACTIVO` → `EST_inActivo = 0` (8 `INACTIVO` + 23 `CERRADO`)

La población sintética de 2026 se genera **solo** para establecimientos activos
(`EST_inActivo = 1` y no eliminados). Los 31 inactivos/cerrados se conservan en
`RCS_ESTABLECIMIENTO` con **0 personas activas en 2026**. No se simula histórico
sobre ellos: no hay fecha institucional de cierre.

Personas de la tabla siguiente: **PROJECTION** (fórmulas de `040` + semilla `20261019`).
No son conteos leídos de SQL Server después de esta corrección.

| Región | Oficinas Locales | Establecimientos (total) | Activos | Personas activas 2026 (PROJECTION) |
| ---: | ---: | ---: | ---: | ---: |
| 1 Central Sur | 6 | 92 | 90 | 655 |
| 2 Huetar Norte | 4 | 76 | 76 | 569 |
| 3 Chorotega | 5 | 102 | 90 | 682 |
| 4 Huetar Caribe | 5 | 81 | 75 | 557 |
| 5 Brunca | 6 | 78 | 75 | 581 |
| 6 Central Norte | 5 | 69 | 64 | 458 |
| 7 Pacífico Central | 3 | 43 | 41 | 294 |
| 8 Central Occidente | 3 | 33 | 32 | 247 |
| 9 Central Este | 4 | 87 | 87 | 652 |

Nombres de Región y Oficina Local: documento territorial (no los alias del Excel). Ejemplo: Excel `HUETAR ATLÁNTICA` / documento y seed `Huetar Caribe`.

`EST_inActivo`: 1 si `DESC_ESTADO = ACTIVO`; 0 si `CERRADO` o `INACTIVO` (evidencia explícita en la fuente).

## Totals

**PROJECTION** determinista del seed corregido (solo establecimientos activos). Los conteos
4952/4946 de la primera validación runtime corresponden al seed anterior (población también
en inactivos) y quedan **obsoletos**. Sustituir estas cifras por SQL Server en la próxima
recreación limpia de `SIDINACC_LOCAL`.

Regions: 9
Local Offices: 41
Establishments: 661 (630 active, 31 inactive/closed)
Families: 3474 (3469 con personas activas; 5 solo con la persona eliminada `n=99`) — PROJECTION
Synthetic persons: 4700 — PROJECTION
Active persons: 4695 — PROJECTION
Deleted synthetic persons: 5 — PROJECTION
Service assignments: 5470 — PROJECTION

Persons per **active** establishment (activas, 2026) — PROJECTION:
Min: 5
Max: 10
Mean: 7.452
Median: 7

Persons per **inactive/closed** establishment (activas, 2026): **0** (regla del mock)

Service mix (personas activas, PROJECTION): 14.0 % sin servicio (657), 60.5 % con 1 (2840), 20.5 % con 2 (964), 5.0 % con 3 (234).

Family size (personas activas, PROJECTION): 2541 familias de 1, 630 de 2, 298 de 3.

## Historical simulation

Families with 2025 → 2026 location changes: 50 (~1.4 % de 3474) — PROJECTION
Los destinos históricos se eligen solo entre establecimientos **activos** de la misma OL.

Cambio documentado para prueba manual:

- Persona `SYN-1100102-03`
- 2025 → establecimiento `1010320` (BARRIO CUBA, OL Hatillo / 101)
- 2026 → establecimiento `1100102` (ALAJUELITA S.J., OL Hatillo / 101)
- A ≠ B; ambos existen; misma Oficina Local

El resto de cambios usa el siguiente establecimiento de la misma OL (cíclico). No representa traslado de caso A.I.

## Synthetic scenarios

- homónimos (mismo nombre, regiones distintas):
  - `SYN-1010202-01` Mateo Vargas Rojas — BARRIO CLARET DE S.J. / OL Tibás / Central Sur
  - `SYN-1190108-01` Mateo Vargas Rojas — SAN ISIDRO DEL GENERAL / OL Pérez Zeledón 1 / Brunca
- nombres similares (misma Oficina Local Hatillo):
  - `SYN-1010320-01` Lucia Mora Campos
  - `SYN-1010321-01` Lucia Mora Campo
- coincidencia exacta de ID:
  - `SYN-1100102-01` Ana Campos Jimenez (ALAJUELITA S.J., OL 101, Región 1)
- persona sin servicio: `SYN-1100102-02`
- persona multiservicio: `SYN-1100102-01` (servicios sintéticos 1 y 2 en 2026)
- persona eliminada: `SYN-1100102-99` (`BIT_eliminado = 1`; no cuenta en el 5–10)
- familia con cambio territorial: `SYN-1100102-03` (ver Historical simulation)
- apellidos repetidos: el pool sintético reutiliza Rojas, Vargas, Mora, Campos, Jimenez, etc. en múltiples establecimientos

IDs adicionales eliminados (también sintéticos, PROJECTION): `SYN-1190130-99`, `SYN-2140404-99`, `SYN-6010406-99`, `SYN-7030503-99`.
`SYN-5020308-99` ya no se genera: el establecimiento `5020308` está `CERRADO`.

`CAF_SERVICIO` permanece como catálogo DEMO/SINTETICO (`Servicio Demo 1..3 (SINTETICO)`); no son nombres oficiales de modalidad CEN-CINAI.

## Validation

Territorial catalog: PASS
- 661/661 establecimientos de `ESTABL_ACTr` con `COD_OFICINA_LOCAL` y `COD_REGION` explícitos
- códigos OL idénticos a los 41 del documento territorial
- 0 filas `NEEDS_VALIDATION` en el catálogo derivado

Referential integrity: por construcción del seed (T12/T13/T17/T19–T22/T27/T28/T36 lo
verificarán en la próxima recreación). Esta corrección: **NOT_RUN**.

Synthetic ID validation: formato `SYN-<7 dígitos>-<2 dígitos>`, longitud 14 ≤ 20, por
construcción del seed (T24–T26). Esta corrección: **NOT_RUN**.

PII review: PASS
- Permitido y presente: nombres y códigos de Región, Oficina Local y establecimiento
- Ausente: beneficiarios reales, cédulas, DIMEX, teléfonos personales, correos, direcciones particulares, información médica o expedientes
- El generador territorial no lee las columnas `TELEFONO`, `FAX` ni `DIRECCION` del Excel

Smoke tests (script `090`): **41** (T01–T41; se añadió T41: 0 personas activas 2026 en
cada EST inactivo/cerrado). Runtime de esta corrección: **NOT_RUN**.

Runtime validation:
- Primera ejecución (seed anterior, población también en inactivos): **PASS**
  (9 regiones / 41 OL / 661 EST; 630 activos; 31 inactivos/cerrados; 4952/4946 personas;
  smoke **40/40**; idempotencia). Esos totales 4952/4946 quedan **obsoletos**.
- Tras esta corrección semántica: **NOT_RUN**. Los seeds son insert-only; no se modificó
  la instancia SQL existente. Hace falta recrear `SIDINACC_LOCAL` y volver a ejecutar 001→090.

## TODO-UTIC

1. El path documentado `reference/source-documents/Listado-de-establecimientos-CEN-CINAI-2025.xlsx` no existe; el archivo disponible es `docs/reference/source_docs/Listado-de-establecimientos.xlsx`.
2. `ESTABL_ACT` tiene 639 filas `ACTIVO` sin código; `ESTABL_ACTr` tiene 661 códigos (630 `ACTIVO`). La institución publica 639 establecimientos; el seed usa los 661 códigos únicos porque `RCS_ESTABLECIMIENTO.EST_idEstablecimiento` exige el código.
3. Nombres Excel vs documento territorial (el seed usa el documento):
   - Región 4: Excel `HUETAR ATLÁNTICA` vs `Huetar Caribe`
   - OL 501/506: Excel `PERÉZ ZELEDON 501/506` vs `Pérez Zeledón 1/2`
   - OL 203: Excel `SANTA ROSA POCOSOL` vs `Santa Rosa`
4. Cruce por nombre entre hojas: varios establecimientos `ACTIVO` en `ESTABL_ACT` aparecen `CERRADO`/`INACTIVO` en `ESTABL_ACTr`; hay nombres que no cruzan de forma exacta (`ZOTA 1 DE RITA (EL Porvenir)`, `LA MARAVILLA`, `CANDELARIA PALMARES ALAJ.`, etc.).
5. Confirmar con UTIC el DDL real, `PER_idPersona` vs `RCS_idPersona`, semántica de `EST_inActivo`, `PER_beneficiario`, `FAD_inActiva` y si `CAF_SERVICIO` es la modalidad que SIA debe mostrar.
