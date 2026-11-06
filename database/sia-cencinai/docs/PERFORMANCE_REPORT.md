# Rendimiento medido de SIA_CENCINAI

Medición con `SET STATISTICS TIME ON` en el contenedor `sidinacc-local-sql`, SQL Server 16.0.4305.5 Developer Edition, después de la escala `large` y antes de insertar la referencia de concurrencia.

## Tamaño del conjunto

| Dato | Valor |
| --- | ---: |
| Vínculos | 4695 |
| Casos | 1713, de ellos 933 activos |
| Referencias | 2960 |
| Atenciones individuales | 4050 |
| Datos en archivos | 72 MB |
| Archivos de la base, datos e índice | 144 MB |

No se capturó un plan XML. Todas las consultas de esta lista terminaron en menos de 5 ms de reloj, así que no hubo una consulta lenta que corregir.

## Tiempos

El tiempo es el `elapsed time` que imprimió el motor para la sentencia. CPU y reloj vienen de esa misma salida. Una consulta que devuelve cientos de filas sigue en este rango; el conteo por establecimiento devolvió una fila por establecimiento y el motor reportó 1 ms.

| Consulta | CPU | Reloj |
| --- | ---: | ---: |
| Bandeja de la Oficina Local 101, conteo por estado | 4 ms | 0 ms |
| Lista de casos activos de la Oficina Local 101, con prioridad vigente | 0 ms | 0 ms |
| Historial de una persona con caso activo | 4 ms | 4 ms |
| Valoración vigente de esa persona | 0 ms | 1 ms |
| Búsqueda por un consecutivo existente | 0 ms | 0 ms |
| Conteo de casos activos por establecimiento | 4 ms | 1 ms |
| Prioridad vigente de la región 1 | 3 ms | 3 ms |
| Casos activos por región, ámbito nacional | 0 ms | 0 ms |
| Atenciones individuales con fecha en 2026 | 0 ms | 0 ms |
| Conteo del denominador nacional de casos activos | 5 ms | 3 ms |
| Programaciones en estado `PROGRAMADA` con fecha vigente anterior al 2026-11-05 | 0 ms | 0 ms |

El resultado de la bandeja en la Oficina Local 101 fue 35 referencias admitidas, 11 que no requieren caso y 15 pendientes. Las programaciones vencidas por fecha, sin un estado `VENCIDA`, fueron 191. El denominador nacional fue 933.

Estos tiempos son de una base local de desarrollo, en caliente, sin carga concurrente de la aplicación. No se extrapolaron a un servidor institucional.
