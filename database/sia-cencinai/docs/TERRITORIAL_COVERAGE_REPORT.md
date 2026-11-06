# Cobertura territorial del dataset sintético

Fecha de la medición: 2026-11-06. Motor: SQL Server local del contenedor `sidinacc-local-sql`. Bases: `SIDINACC_LOCAL` (solo lectura) y `SIA_CENCINAI`.

Esto mide la cobertura del dataset de prueba. No es una cifra de atención institucional.

## Veredicto

`FULL_TERRITORIAL_TEST_COVERAGE`

Los 630 establecimientos activos que tienen al menos una persona sintética elegible tienen al menos un caso de Atención Interdisciplinaria. Las relaciones comprobadas Región → Oficina Local → Establecimiento → persona ubicada en 2026 → referencia → caso coinciden con `SIDINACC_LOCAL`. No quedaron referencias ni casos en una Oficina Local o región distinta de la del establecimiento.

Quedan notas de validación, no huecos de cobertura entre los establecimientos activos elegibles. Están en la sección correspondiente. Los 31 establecimientos inactivos no tienen personas elegibles ni casos; no se fabricaron identidades para cubrirlos.

## Qué se consideró elegible

Se reutilizó la definición ya documentada del generador. No se creó una regla nueva de elegibilidad:

- identificador `SYN-` de 14 caracteres;
- persona no eliminada, con familia;
- último detalle de familia del período 2026, no eliminado, con establecimiento;
- establecimiento con `EST_inActivo = 1`;
- Oficina Local entre 100 y 999;
- `region_id` presente en `cat_codigo_region_referencia`.

`EST_inActivo = 1` se lee como activo porque la réplica local cargó `DESC_ESTADO = ACTIVO` en ese valor. La semántica del DDL institucional sigue `NEEDS_VALIDATION` (`TODO-UTIC` en la réplica). No se invirtió el bit.

## Jerarquía usada

La jerarquía autoritativa es la de la réplica:

`CAF_CAT_REGION` → `CAF_CAT_OFICINA_LOCAL.CAT_idRegion` → `RCS_ESTABLECIMIENTO.CAT_idOficinaLocal` → detalle de familia 2026 → `CAF_PERSONA`.

SIA guarda la foto `region_id`, `oficina_local_id` y `establecimiento_id` en la referencia y en el caso. No hay FK hacia la réplica. La auditoría comparó esa foto con la jerarquía, fila por fila.

El identificador numérico de región no se trató como código DR. Los códigos DR válidos del patrón (CS, HN, CH, HC, BR, CN, PC, CO, CE) están en RF-114. Qué `region_id` corresponde a cada código está solo en `cat_codigo_region_referencia`, cargado por la semilla 010 con el orden de la réplica (Central Sur = 1 … Central Este = 9). Ese mapa sigue `NEEDS_VALIDATION`. Los consecutivos nuevos usan ese catálogo ya existente; no se inventó otra equivalencia. La comprobación contra el catálogo dio 0 diferencias, y eso no confirma el mapa institucional.

## Antes y después

| Medida | Antes | Después |
| --- | ---: | ---: |
| Regiones en la réplica | 9 | 9 |
| Oficinas Locales | 41 | 41 |
| Establecimientos | 661 | 661 |
| Activos / inactivos | 630 / 31 | 630 / 31 |
| Personas elegibles | 4695 | 4695 |
| Establecimientos activos con al menos una persona elegible | 630 | 630 |
| Establecimientos activos sin persona elegible | 0 | 0 |
| Establecimientos con al menos una referencia | 621 | 630 |
| Establecimientos con al menos un caso | 551 | 630 |
| Establecimientos con al menos un caso activo | 501 | 580 |
| Activos elegibles sin ningún caso | 79 | 0 |
| Inactivos con algún caso | 0 | 0 |
| Referencias | 2961 | 3040 |
| Casos | 1713 | 1792 |
| Casos activos | 933 | 1012 |
| Casos cerrados | 780 | 780 |
| Personas con dos casos activos | 0 | 0 |
| Regiones representadas en casos | 9 | 9 |
| Oficinas Locales representadas en casos | 41 | 41 |

Cobertura de establecimientos activos: 551 de 630 (87,46 %) antes; 630 de 630 (100 %) después.

En los 630 activos, los casos por establecimiento quedan entre 1 y 8. La suma es 1792. Los 31 inactivos siguen en 0.

De los 630 activos, 580 tienen al menos un caso activo y 50 solo tienen casos cerrados. Esos 50 ya estaban cubiertos antes del pase. No se les abrió otro caso: el objetivo era un caso por establecimiento, no un caso activo adicional, y no se modificaron casos válidos.

## Lo que se insertó

`seeds/040_territorial_coverage.sql`, semilla `20261105`, lote `SYN-COVERAGE:seed:20261105`.

| Hecho | Cantidad |
| --- | ---: |
| Referencias nuevas | 79 |
| Casos nuevos, todos `ACTIVO`, apertura 2025-04-18 | 79 |
| Atenciones individuales nuevas, fecha 2025-05-09 | 79 |
| Casos cerrados tocados | 0 |
| Personas inventadas | 0 |

Cada expediente usa una persona `SYN-` ya ubicada en ese establecimiento, sin caso activo. Lleva referencia `ADMITIDA_AI`, sesión, valoración vigente tomada de una fila de `cat_matriz_prioridad`, resolución `REQUIERE_AI`, caso, historial `ACTIVO`, plan vigente y una atención posterior a la apertura. El consecutivo es un fixture: continúa el sufijo de tres dígitos ya guardado para ese establecimiento en 2025. No hay tabla contador y el producto no genera el consecutivo.

La segunda ejecución, también dos veces en la misma sesión, respondió `Cobertura territorial ya completa. No se inserta.` Los conteos siguieron en 1792 casos, 3040 referencias y un solo lote de cobertura.

Los 79 establecimientos que no tenían caso, por región y Oficina Local:

- Central Sur 101: 1011009, 1011102, 1011107, 1030107
- Central Sur 103: 1010205, 1130103, 1130203
- Central Sur 104: 1010506
- Central Sur 105: 1060404
- Central Sur 106: 1080106, 1150107
- Huetar Norte 201: 2101119
- Huetar Norte 202: 2100202
- Huetar Norte 203: 2140114, 2140205
- Huetar Norte 204: 2150105
- Chorotega 301: 5010202, 5040202, 5100202
- Chorotega 302: 5030104, 5030306, 5030603
- Chorotega 303: 5020108, 5020109, 5020112, 5020114, 5020129, 5020309
- Chorotega 304: 5090603, 5110105
- Chorotega 305: 5080103
- Huetar Caribe 401: 7010203, 7050303
- Huetar Caribe 402: 7060107
- Huetar Caribe 403: 7030120, 7030204, 7030206, 7030602
- Huetar Caribe 404: 7020317, 7020505
- Huetar Caribe 405: 7040103, 7040205
- Brunca 501: 1190308, 1190405
- Brunca 502: 6030111, 6030202, 6030404
- Brunca 503: 6050103
- Brunca 504: 6080203, 6080404
- Brunca 505: 6070103
- Brunca 506: 1190305
- Central Norte 601: 4030103
- Central Norte 602: 4040502
- Central Norte 603: 2010304, 2010604
- Central Norte 604: 2050103
- Pacífico Central 701: 6010603, 6010605, 6011203, 6040103
- Pacífico Central 702: 2090103, 6060105, 6060203
- Pacífico Central 703: 6010408, 6010503, 6011103
- Central Occidente 802: 2060104
- Central Este 901: 1050103, 1050303
- Central Este 902: 3010503
- Central Este 903: 3020104, 3020113, 3040109, 3060201
- Central Este 904: 3040204, 3050105, 3051201, 3051203

## Relaciones inconsistentes

Después del pase, estas comprobaciones devolvieron 0 filas:

| Comprobación | Filas |
| --- | ---: |
| Referencia con Oficina Local distinta de la del establecimiento | 0 |
| Referencia con región distinta de la de esa Oficina Local | 0 |
| Caso con Oficina Local distinta de la del establecimiento | 0 |
| Caso con región distinta de la de esa Oficina Local | 0 |
| Caso o referencia cuyo establecimiento no existe en la réplica | 0 |
| Caso o referencia de una persona elegible en un establecimiento distinto de su ubicación 2026 | 0 |
| Caso con persona, ámbito o consecutivo distintos de su referencia de origen | 0 |
| Segmento DR del consecutivo distinto del catálogo provisional de su `region_id` | 0 |
| Segmento de Oficina Local del consecutivo distinto de `oficina_local_id` | 0 |
| Segmento de establecimiento del consecutivo distinto de `establecimiento_id` | 0 |
| Consecutivo fuera del patrón RF-114 | 0 |
| Dos casos activos de la misma persona | 0 |
| Atención de cobertura en o antes de la apertura | 0 |

La coincidencia del segmento de Oficina Local es consistencia del fixture. RF-115 no exige que ese segmento sea el de la persona; sí exige que el código de establecimiento corresponda al establecimiento de la persona referida. Esa correspondencia se cumple.

`queries/020_reconciliation.sql` se ejecutó con el guardián activado solo en la copia de runtime. Las siete consultas volvieron sin filas: valoración o plan vigente desalineados, plan no vigente, cierre contra estado, historial `CERRADO` sin cierre, motivo de cierre distinto, participante grupal de otra persona y programación de otra persona.

## Cobertura anual de prueba, 2026

La fórmula es la de `queries/010_reporting_reference.sql`: denominador = personas distintas con caso activo en el ámbito; numerador = esas personas con una atención individual en 2026 o con asistencia grupal en 2026, unidas por persona. No ratifica RN-040.

| Ámbito | Denominador antes | Denominador después | Numerador |
| --- | ---: | ---: | ---: |
| Nacional | 933 | 1012 | 330 |
| Región 1 Central Sur | 127 | 138 | 42 |
| Región 2 Huetar Norte | 115 | 120 | 35 |
| Región 3 Chorotega | 126 | 141 | 50 |
| Región 4 Huetar Caribe | 105 | 116 | 38 |
| Región 5 Brunca | 120 | 130 | 46 |
| Región 6 Central Norte | 93 | 98 | 32 |
| Región 7 Pacífico Central | 45 | 55 | 19 |
| Región 8 Central Occidente | 59 | 60 | 20 |
| Región 9 Central Este | 143 | 154 | 48 |

El denominador nacional subió 79, exactamente los casos activos nuevos. La suma de los denominadores regionales es 1012. El numerador no cambió: la atención nueva es del 2025-05-09, fuera de 2026. La suma de los numeradores regionales sigue en 330. El aumento es el del denominador y no una tasa institucional.

## Réplica intacta

Conteos de `SIDINACC_LOCAL` iguales al baseline anterior a este pase:

| Tabla | Filas |
| --- | ---: |
| `CAF_PERSONA` | 4708 |
| `CAF_FAMILIA` | 3474 |
| `CAF_FAMILIA_DETALLE` | 3524 |
| `CAF_PERSONA_DETALLE` | 4768 |
| `CAF_MENOR` | 5 |
| `CAF_EVALUACION_MENOR` | 4 |
| `CAF_SERVICIO_CLIENTE` | 5470 |
| `RCS_ESTABLECIMIENTO` | 661 |
| `CAF_CAT_OFICINA_LOCAL` | 41 |
| `CAF_CAT_REGION` | 9 |

No se modificó el esquema de `SIA_CENCINAI`. El guardián del script en el repositorio permanece en 0.

## Cobertura por Oficina Local

Estado posterior. En todas las filas, establecimientos con caso = establecimientos activos, así que la cobertura de establecimientos es 100 %. Los casos de oficinas que no recibieron el pase no cambiaron.

| Región | Oficina Local | Activos | Con caso | Casos activos | Cerrados | Total | Cobertura |
| --- | --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Central Sur | 101 Hatillo | 14 | 14 | 21 | 18 | 39 | 100 % |
| Central Sur | 102 Ciudad Colón | 17 | 17 | 20 | 27 | 47 | 100 % |
| Central Sur | 103 Tibás | 12 | 12 | 18 | 12 | 30 | 100 % |
| Central Sur | 104 Curridabat-Desamparados | 14 | 14 | 23 | 20 | 43 | 100 % |
| Central Sur | 105 Aserrí-Acosta | 18 | 18 | 32 | 27 | 59 | 100 % |
| Central Sur | 106 Guadalupe | 15 | 15 | 24 | 16 | 40 | 100 % |
| Huetar Norte | 201 Ciudad Quesada | 21 | 21 | 33 | 17 | 50 | 100 % |
| Huetar Norte | 202 La Fortuna | 16 | 16 | 27 | 21 | 48 | 100 % |
| Huetar Norte | 203 Santa Rosa | 34 | 34 | 54 | 47 | 101 | 100 % |
| Huetar Norte | 204 San Rafael de Guatuso | 5 | 5 | 6 | 5 | 11 | 100 % |
| Chorotega | 301 Liberia | 17 | 17 | 25 | 14 | 39 | 100 % |
| Chorotega | 302 Santa Cruz | 25 | 25 | 35 | 27 | 62 | 100 % |
| Chorotega | 303 Nicoya | 20 | 20 | 31 | 19 | 50 | 100 % |
| Chorotega | 304 Nandayure | 12 | 12 | 20 | 12 | 32 | 100 % |
| Chorotega | 305 Cañas | 16 | 16 | 30 | 16 | 46 | 100 % |
| Huetar Caribe | 401 Limón-Matina | 20 | 20 | 33 | 28 | 61 | 100 % |
| Huetar Caribe | 402 Pococí 1 | 14 | 14 | 21 | 22 | 43 | 100 % |
| Huetar Caribe | 403 Siquirres | 17 | 17 | 26 | 20 | 46 | 100 % |
| Huetar Caribe | 404 Pococí 2 | 14 | 14 | 23 | 12 | 35 | 100 % |
| Huetar Caribe | 405 Talamanca | 10 | 10 | 13 | 11 | 24 | 100 % |
| Brunca | 501 Pérez Zeledón 1 | 19 | 19 | 33 | 30 | 63 | 100 % |
| Brunca | 502 Buenos Aires | 11 | 11 | 17 | 10 | 27 | 100 % |
| Brunca | 503 Osa-Palmar Norte | 5 | 5 | 7 | 2 | 9 | 100 % |
| Brunca | 504 San Vito | 13 | 13 | 27 | 20 | 47 | 100 % |
| Brunca | 505 Golfito-Corredores | 8 | 8 | 11 | 11 | 22 | 100 % |
| Brunca | 506 Pérez Zeledón 2 | 19 | 19 | 35 | 17 | 52 | 100 % |
| Central Norte | 601 Heredia | 14 | 14 | 25 | 15 | 40 | 100 % |
| Central Norte | 602 Flores | 14 | 14 | 16 | 20 | 36 | 100 % |
| Central Norte | 603 Alajuela | 15 | 15 | 23 | 21 | 44 | 100 % |
| Central Norte | 604 Grecia | 14 | 14 | 21 | 17 | 38 | 100 % |
| Central Norte | 605 Sarapiquí | 7 | 7 | 13 | 12 | 25 | 100 % |
| Pacífico Central | 701 Puntarenas | 18 | 18 | 22 | 23 | 45 | 100 % |
| Pacífico Central | 702 Orotina | 14 | 14 | 22 | 21 | 43 | 100 % |
| Pacífico Central | 703 Jicaral | 9 | 9 | 11 | 11 | 22 | 100 % |
| Central Occidente | 801 San Ramón | 12 | 12 | 22 | 17 | 39 | 100 % |
| Central Occidente | 802 Naranjo | 12 | 12 | 19 | 12 | 31 | 100 % |
| Central Occidente | 803 Palmares | 8 | 8 | 19 | 12 | 31 | 100 % |
| Central Este | 901 Tejar del Guarco | 20 | 20 | 36 | 28 | 64 | 100 % |
| Central Este | 902 Cartago | 19 | 19 | 30 | 27 | 57 | 100 % |
| Central Este | 903 Oreamuno | 20 | 20 | 33 | 23 | 56 | 100 % |
| Central Este | 904 Turrialba | 28 | 28 | 55 | 40 | 95 | 100 % |

## Detalle por establecimiento

`territorial_coverage_by_establishment.csv`, 661 filas más el encabezado. Columnas: región, Oficina Local, establecimiento, activo según la réplica, personas elegibles, referencias, casos, casos activos y casos cerrados. No incluye nombres, identificadores de persona, fechas de nacimiento, direcciones ni teléfonos.

## Pendiente de validación

- Mapa `region_id` → código DR de `cat_codigo_region_referencia`. Los nueve códigos son los de RF-114; la asignación a cada región de la réplica no está confirmada por una fuente institucional. No se usó para decidir la Oficina Local ni el establecimiento.
- Semántica institucional definitiva de `EST_inActivo`. En esta réplica, 1 corresponde a `DESC_ESTADO = ACTIVO`.
- RN-040. La fórmula de prueba quedó consistente; eso no la ratifica.
- `PER_idPersona` frente a `RCS_idPersona` sigue fuera de este pase. No se hizo una equivalencia nueva.

## Limitación que no se forzó

Los 31 establecimientos con `EST_inActivo = 0` no tienen una persona sintética elegible en 2026. Siguen sin casos. Inventar una persona o abrir un caso activo ahí lo presentaría como actividad vigente de un establecimiento que la réplica no marca como activo. Quedó como límite de cobertura, no como error territorial.
