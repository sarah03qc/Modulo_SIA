# CEN-CINAI — Estructura territorial oficial para SIDINACC_LOCAL

**Propósito:** referencia institucional normalizada para poblar la réplica local `SIDINACC_LOCAL` con la jerarquía real de CEN-CINAI.

**Importante:** este archivo no reemplaza la fuente institucional original. Debe utilizarse junto con el Excel oficial de establecimientos publicado por CEN-CINAI.

## 1. Fuentes institucionales canónicas

### Fuente A — Listado oficial de establecimientos

Página institucional:

https://www.cen-cinai.go.cr/bienes-y-gastos-fijos/

Archivo oficial:

https://www.cen-cinai.go.cr/wp-content/uploads/2025/08/Listado-de-establecimientos.xlsx

La propia institución indica que cuenta con **639 establecimientos** distribuidos en todo el país y que el Excel contiene el listado de establecimientos, la región de salud, provincia, cantón, distrito, dirección y teléfono.

**Uso en SIDINACC_LOCAL:** fuente canónica primaria para nombres y códigos de establecimientos y su región territorial.

### Fuente B — Direcciones Regionales y Oficinas Locales

Página índice:

https://www.cen-cinai.go.cr/direcciones-regionales/

La institución publica nueve Direcciones Regionales y, dentro de cada una, las Oficinas Locales y sus códigos.

### Fuente C — Páginas oficiales de establecimientos por cantón

Índice:

https://www.cen-cinai.go.cr/establecimientos/

Las páginas de cada cantón muestran, por establecimiento:

- nombre;
- código de establecimiento;
- ubicación;
- tipo;
- Oficina Local y código;
- Región y código.

**Uso en SIDINACC_LOCAL:** fuente de verificación para la relación exacta `Establecimiento -> Oficina Local -> Región` cuando dicha relación no esté disponible directamente en el Excel.

---

## 2. Jerarquía institucional confirmada

| Código Región | Dirección Regional | Código OL | Oficina Local |
|---:|---|---:|---|
| 1 | Central Sur | 101 | Hatillo |
| 1 | Central Sur | 102 | Ciudad Colón |
| 1 | Central Sur | 103 | Tibás |
| 1 | Central Sur | 104 | Curridabat-Desamparados |
| 1 | Central Sur | 105 | Aserrí-Acosta |
| 1 | Central Sur | 106 | Guadalupe |
| 2 | Huetar Norte | 201 | Ciudad Quesada |
| 2 | Huetar Norte | 202 | La Fortuna |
| 2 | Huetar Norte | 203 | Santa Rosa |
| 2 | Huetar Norte | 204 | San Rafael de Guatuso |
| 3 | Chorotega | 301 | Liberia |
| 3 | Chorotega | 302 | Santa Cruz |
| 3 | Chorotega | 303 | Nicoya |
| 3 | Chorotega | 304 | Nandayure |
| 3 | Chorotega | 305 | Cañas |
| 4 | Huetar Caribe | 401 | Limón-Matina |
| 4 | Huetar Caribe | 402 | Pococí 1 |
| 4 | Huetar Caribe | 403 | Siquirres |
| 4 | Huetar Caribe | 404 | Pococí 2 |
| 4 | Huetar Caribe | 405 | Talamanca |
| 5 | Brunca | 501 | Pérez Zeledón 1 |
| 5 | Brunca | 502 | Buenos Aires |
| 5 | Brunca | 503 | Osa-Palmar Norte |
| 5 | Brunca | 504 | San Vito |
| 5 | Brunca | 505 | Golfito-Corredores |
| 5 | Brunca | 506 | Pérez Zeledón 2 |
| 6 | Central Norte | 601 | Heredia |
| 6 | Central Norte | 602 | Flores |
| 6 | Central Norte | 603 | Alajuela |
| 6 | Central Norte | 604 | Grecia |
| 6 | Central Norte | 605 | Sarapiquí |
| 7 | Pacífico Central | 701 | Puntarenas |
| 7 | Pacífico Central | 702 | Orotina |
| 7 | Pacífico Central | 703 | Jicaral |
| 8 | Central Occidente | 801 | San Ramón |
| 8 | Central Occidente | 802 | Naranjo |
| 8 | Central Occidente | 803 | Palmares |
| 9 | Central Este | 901 | Tejar del Guarco |
| 9 | Central Este | 902 | Cartago |
| 9 | Central Este | 903 | Oreamuno |
| 9 | Central Este | 904 | Turrialba |

**Totales confirmados:** 9 Direcciones Regionales y 41 Oficinas Locales.

---

## 3. Direcciones Regionales — URLs oficiales

- Central Sur: https://www.cen-cinai.go.cr/central-sur/
- Huetar Norte: https://www.cen-cinai.go.cr/huetar-norte/
- Chorotega: https://www.cen-cinai.go.cr/chorotega/
- Central Norte: https://www.cen-cinai.go.cr/central-norte/
- Huetar Caribe: https://www.cen-cinai.go.cr/huetar-caribe/
- Brunca: https://www.cen-cinai.go.cr/brunca/
- Pacífico Central: https://www.cen-cinai.go.cr/pacifico-central/
- Central Occidente: https://www.cen-cinai.go.cr/central-occidente/
- Central Este: https://www.cen-cinai.go.cr/central-este/

---

## 4. Reglas para poblar SIDINACC_LOCAL

### `CAF_CAT_REGION`

Utilizar los códigos institucionales 1–9 y los nombres anteriores.

### `CAF_CAT_OFICINA_LOCAL`

Utilizar los códigos institucionales de tres dígitos publicados por CEN-CINAI.

No generar IDs locales alternativos si el esquema permite conservar estos códigos.

### `RCS_ESTABLECIMIENTO`

Para cada fila del Excel oficial:

- utilizar el código de establecimiento publicado por CEN-CINAI como `EST_idEstablecimiento` cuando sea compatible con el tipo del esquema;
- utilizar el nombre oficial como `EST_descripcion`;
- resolver `CAT_idOficinaLocal` únicamente mediante evidencia institucional;
- no inferir una Oficina Local solo por provincia, cantón o cercanía geográfica.

Cuando el Excel no incluya la Oficina Local, verificarla en la página oficial del cantón correspondiente. Las páginas oficiales de establecimiento publican explícitamente `Oficina Local` y `Región`.

---

## 5. Ejemplos de verificación de la relación Establecimiento -> OL -> Región

Los siguientes ejemplos demuestran la estructura publicada por CEN-CINAI:

- `1100102` — Alajuelita -> Oficina Local Hatillo (`101`) -> Central Sur (`1`).
- `2010105` — El Erizo, Alajuela -> Oficina Local Alajuela (`603`) -> Central Norte (`6`).
- `2080103` — San Pedro de Poás -> Oficina Local Grecia (`604`) -> Central Norte (`6`).
- `7020104` — Guápiles/Pococí -> Oficina Local Pococí 1 (`402`) -> Huetar Caribe (`4`).
- `7020318` — Zota 1 de Rita -> Oficina Local Pococí 2 (`404`) -> Huetar Caribe (`4`).
- `6100103` — Ciudad Neilly -> Oficina Local Golfito-Corredores (`505`) -> Brunca (`5`).
- `1170103` — Santa María de Dota -> Oficina Local Tejar del Guarco (`901`) -> Central Este (`9`).

Estos ejemplos son de validación; el seed final debe utilizar **todos** los establecimientos del Excel oficial.

---

## 6. Regla de autoridad de datos

Orden para resolver contradicciones:

1. Excel oficial de establecimientos más reciente.
2. Página oficial actual del establecimiento/cantón.
3. Página oficial de la Dirección Regional/Oficina Local.
4. Directorio telefónico institucional.

Nunca inferir silenciosamente una Oficina Local.

Cuando dos fuentes oficiales difieran:

- conservar el código/nombre de la fuente más reciente que pueda identificarse;
- registrar la diferencia en `DATASET_SUMMARY.md`;
- marcar `TODO-UTIC` si afecta la relación territorial.

---

## 7. Datos reales vs sintéticos

### Se conservan reales

- nombre de la Región;
- código de Región;
- nombre de Oficina Local;
- código de Oficina Local;
- nombre de establecimiento;
- código de establecimiento.

### Deben ser sintéticos

- personas;
- identificaciones de personas;
- nombres de personas;
- fechas de nacimiento;
- familias;
- asignaciones de servicios;
- historial 2025/2026 generado para pruebas.

No utilizar datos reales de clientes o beneficiarios.

---

## 8. Ubicación recomendada en el repositorio

Este documento:

`docs/institutional/CEN_CINAI_TERRITORIAL_STRUCTURE.md`

Excel institucional original:

`reference/source-documents/Listado-de-establecimientos-CEN-CINAI-2025.xlsx`

La aplicación no debe depender en runtime de estos archivos. Son fuentes de referencia para construir el seed local.
