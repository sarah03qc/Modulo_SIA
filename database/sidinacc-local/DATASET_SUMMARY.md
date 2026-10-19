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

Cifras de catálogo: 661 establecimientos únicos con código en `ESTABL_ACTr` (630 `ACTIVO`, 8 `INACTIVO`, 23 `CERRADO`). Personas activas proyectadas con la semilla `20261019` (runtime: ver sección Validation).

| Región | Oficinas Locales | Establecimientos | Personas activas |
| ---: | ---: | ---: | ---: |
| 1 Central Sur | 6 | 92 | 671 |
| 2 Huetar Norte | 4 | 76 | 569 |
| 3 Chorotega | 5 | 102 | 780 |
| 4 Huetar Caribe | 5 | 81 | 609 |
| 5 Brunca | 6 | 78 | 604 |
| 6 Central Norte | 5 | 69 | 496 |
| 7 Pacífico Central | 3 | 43 | 312 |
| 8 Central Occidente | 3 | 33 | 253 |
| 9 Central Este | 4 | 87 | 652 |

Nombres de Región y Oficina Local: documento territorial (no los alias del Excel). Ejemplo: Excel `HUETAR ATLÁNTICA` / documento y seed `Huetar Caribe`.

`EST_inActivo`: 1 si `DESC_ESTADO = ACTIVO`; 0 si `CERRADO` o `INACTIVO` (evidencia explícita en la fuente).

## Totals

Proyección determinista del seed (fórmulas de `040_seed_synthetic_population.sql`). Sustituir por conteos de SQL Server cuando exista runtime.

Regions: 9
Local Offices: 41
Establishments: 661 (630 active, 31 inactive/closed)
Families: 3653 (3647 con personas activas; 6 solo con la persona eliminada `n=99`)
Synthetic persons: 4952
Active persons: 4946
Deleted synthetic persons: 6
Service assignments: 5753

Persons per establishment (activas, 2026):
Min: 5
Max: 10
Mean: 7.483
Median: 7

Service mix (personas activas): 14.1 % sin servicio (696), 60.5 % con 1 (2992), 20.5 % con 2 (1013), 5.0 % con 3 (245).

Family size (personas activas): 2667 familias de 1, 661 de 2, 319 de 3.

## Historical simulation

Families with 2025 → 2026 location changes: 56 (~1.5 % de 3653)

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

IDs adicionales eliminados (también sintéticos): `SYN-1190130-99`, `SYN-2140404-99`, `SYN-5020308-99`, `SYN-6010406-99`, `SYN-7030503-99`.

`CAF_SERVICIO` permanece como catálogo DEMO/SINTETICO (`Servicio Demo 1..3 (SINTETICO)`); no son nombres oficiales de modalidad CEN-CINAI.

## Validation

Territorial catalog: PASS
- 661/661 establecimientos de `ESTABL_ACTr` con `COD_OFICINA_LOCAL` y `COD_REGION` explícitos
- códigos OL idénticos a los 41 del documento territorial
- 0 filas `NEEDS_VALIDATION` en el catálogo derivado

Referential integrity: PASS (por construcción del seed + T12/T13/T17/T19–T22/T27/T28/T36). Runtime: ver abajo.

Synthetic ID validation: PASS (formato `SYN-<7 dígitos>-<2 dígitos>`, longitud 14 ≤ 20). Runtime: T24–T26.

PII review: PASS
- Permitido y presente: nombres y códigos de Región, Oficina Local y establecimiento
- Ausente: beneficiarios reales, cédulas, DIMEX, teléfonos personales, correos, direcciones particulares, información médica o expedientes
- El generador territorial no lee las columnas `TELEFONO`, `FAX` ni `DIRECCION` del Excel

Runtime validation: NOT_RUN (no había SQL Server disponible en el entorno de autoría al generar este resumen). Los totales de población son proyección de las fórmulas del seed, no conteos leídos de `SIDINACC_LOCAL`.

## TODO-UTIC

1. El path documentado `reference/source-documents/Listado-de-establecimientos-CEN-CINAI-2025.xlsx` no existe; el archivo disponible es `docs/reference/source_docs/Listado-de-establecimientos.xlsx`.
2. `ESTABL_ACT` tiene 639 filas `ACTIVO` sin código; `ESTABL_ACTr` tiene 661 códigos (630 `ACTIVO`). La institución publica 639 establecimientos; el seed usa los 661 códigos únicos porque `RCS_ESTABLECIMIENTO.EST_idEstablecimiento` exige el código.
3. Nombres Excel vs documento territorial (el seed usa el documento):
   - Región 4: Excel `HUETAR ATLÁNTICA` vs `Huetar Caribe`
   - OL 501/506: Excel `PERÉZ ZELEDON 501/506` vs `Pérez Zeledón 1/2`
   - OL 203: Excel `SANTA ROSA POCOSOL` vs `Santa Rosa`
4. Cruce por nombre entre hojas: varios establecimientos `ACTIVO` en `ESTABL_ACT` aparecen `CERRADO`/`INACTIVO` en `ESTABL_ACTr`; hay nombres que no cruzan de forma exacta (`ZOTA 1 DE RITA (EL Porvenir)`, `LA MARAVILLA`, `CANDELARIA PALMARES ALAJ.`, etc.).
5. Confirmar con UTIC el DDL real, `PER_idPersona` vs `RCS_idPersona`, semántica de `EST_inActivo`, `PER_beneficiario`, `FAD_inActiva` y si `CAF_SERVICIO` es la modalidad que SIA debe mostrar.
