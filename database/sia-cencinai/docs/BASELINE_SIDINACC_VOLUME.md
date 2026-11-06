# Volumen observado de SIDINACC_LOCAL

Medición de solo lectura, antes de crear `SIA_CENCINAI`. No se exportaron nombres ni otros datos nominales.

## Entorno

| Dato | Valor |
| --- | --- |
| Contenedor | `sidinacc-local-sql` |
| Imagen | `mcr.microsoft.com/mssql/server:2022-latest` |
| Servidor | `d0587951c363` |
| Motor | SQL Server 16.0.4305.5, Developer Edition (64-bit) |
| Base | `SIDINACC_LOCAL`, `ONLINE` |
| Collation de la réplica | `SQL_Latin1_General_CP1_CI_AS` |

La sesión de medición usó el inicio `sa` del contenedor local. Las sentencias fueron `SELECT`.

## Metodología

1. Conteos de filas con `sys.partitions` (`index_id` 0 y 1) y, en las tablas de hecho, `COUNT(*)`.
2. Objetos de usuario con `sys.objects`.
3. Ubicación de la persona por `CAF_FAMILIA_DETALLE` del período `2026`, unida a establecimiento, Oficina Local y región.
4. Edad por `DATEDIFF` de año entre `PER_fechaNacimiento` y `2026-11-05`, en bandas. No se listaron fechas.
5. Sexo por el catálogo `CAF_CAT_SEXO`, solo como conteo.
6. Patrón de `PER_idPersona`: longitud y coincidencia `SYN-` más dígitos. No se listaron identificadores.

`CAF_MENOR` no se usó como universo de niños. Esa tabla tiene cinco filas de demostración. La edad de `CAF_PERSONA` es otra medición.

## Objetos

15 tablas de usuario, 15 claves primarias, 18 claves foráneas, 1 restricción única y 1 valor predeterminado. No hay vistas, procedimientos, funciones ni triggers de usuario.

## Filas por tabla

| Tabla | Filas |
| --- | ---: |
| `CAF_PERSONA` | 4708 |
| `CAF_PERSONA_DETALLE` | 4768 |
| `CAF_FAMILIA` | 3474 |
| `CAF_FAMILIA_DETALLE` | 3524 |
| `CAF_SERVICIO_CLIENTE` | 5470 |
| `CAF_SERVICIO` | 3 |
| `CAF_MENOR` | 5 |
| `CAF_EVALUACION_MENOR` | 4 |
| `CAF_INDICADOR_ANTROPOMETRICO` | 2 |
| `RCS_ESTABLECIMIENTO` | 661 |
| `CAF_CAT_OFICINA_LOCAL` | 41 |
| `CAF_CAT_REGION` | 9 |
| `CAF_CAT_SEXO` | 3 |
| `CAF_CAT_TIPO_CLIENTE` | 2 |
| `RCS_PERIODO` | 2 |

## Personas e identidad

| Medición | Resultado |
| --- | ---: |
| Personas | 4708 |
| Con `BIT_eliminado = 1` | 5 |
| Identificador con patrón `SYN-` de 14 caracteres | 4708 |
| Longitud mínima y máxima | 14 y 14 |
| Ubicadas en período 2026, no eliminadas, con establecimiento | 4695 |
| Familias de ese conjunto | 3469 |
| Establecimientos de ese conjunto | 630 |
| Personas sin familia, no eliminadas | 8 |
| Personas en `CAF_SERVICIO_CLIENTE` | 4038 |
| Personas en `CAF_EVALUACION_MENOR` | 2 |

Los 630 establecimientos de la ubicación 2026 coinciden con los 630 establecimientos marcados `EST_inActivo = 1`. Hay 31 establecimientos inactivos o cerrados en el total de 661.

Por establecimiento, en 2026, el mínimo fue 5 personas, el máximo 10 y el promedio 7.

## Territorio

Períodos presentes: `2025` y `2026`, ambos descritos como demo.

Oficinas Locales: 41. El identificador mínimo es 101 y el máximo 904. Las 41 caben en tres dígitos. El código de establecimiento tiene 7 dígitos en el mínimo y en el máximo.

| Región | Id | Oficinas | Establecimientos | Personas 2026 |
| --- | ---: | ---: | ---: | ---: |
| Central Sur | 1 | 6 | 92 | 655 |
| Huetar Norte | 2 | 4 | 76 | 569 |
| Chorotega | 3 | 5 | 102 | 682 |
| Huetar Caribe | 4 | 5 | 81 | 557 |
| Brunca | 5 | 6 | 78 | 581 |
| Central Norte | 6 | 5 | 69 | 458 |
| Pacífico Central | 7 | 3 | 43 | 294 |
| Central Occidente | 8 | 3 | 33 | 247 |
| Central Este | 9 | 4 | 87 | 652 |

## Sexo y edad

| Sexo en catálogo | Personas |
| --- | ---: |
| Hombre | 1585 |
| Mujer | 1563 |
| Intersex | 1560 |

| Banda de edad al 2026-11-05 | Personas |
| --- | ---: |
| 1 a 5 años | 1766 |
| 6 a 12 años | 1963 |
| 18 años o más | 979 |

No hubo filas en las bandas `0` ni `SIN_FECHA` con este cálculo.

## Menores y relaciones

`CAF_MENOR` tiene 5 registros, 4 personas distintas, 5 con madre informada, 4 con padre informado, 4 madres distintas, 3 padres distintos y 5 encargados distintos. Esa superficie no representa a los 3729 registros de las bandas de 1 a 12 años.

Evaluaciones nutricionales: 4 filas, 2 personas.

## Uso para la escala de SIA

La población institucional de la réplica y los casos de Atención Interdisciplinaria son universos distintos. El generador de SIA toma como techo de identidad a las 4695 personas sintéticas ubicadas en 2026. No asigna un caso a cada persona. El volumen de hechos de SIA se compara con las tablas grandes de la réplica, en particular `CAF_SERVICIO_CLIENTE` (5470) y `CAF_PERSONA` (4708), como carga de desarrollo, no como prevalencia.
