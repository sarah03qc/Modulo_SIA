# Pruebas ejecutadas sobre SIA_CENCINAI

Los interruptores quedaron en 0 en el repositorio. La corrida usó copias con el interruptor de desarrollo. Una prueba no se marca como pasada si solo se leyó el script.

## Esquema, semillas y pruebas funcionales

| Prueba | Resultado | Evidencia |
| --- | --- | --- |
| Migraciones 001 a 090 | Aplicadas | Diez filas `APLICADA` |
| `010_schema_validation` | Pass | `RESUMEN OK` |
| Semilla confirmada | Pass | Nueve filas de matriz y nueve códigos DR |
| `020_integrity_positive` | Pass | `PASS integridad positiva del conjunto sintetico.` |
| `030_integrity_negative` | Pass | Los `PASS` listados abajo |
| `040_transaction_tests` | Pass | Tres rollbacks y la nota de una sola sesión |
| `050_reporting_tests` | Pass, antes de escalar | `PASS reporteria del conjunto sintetico.` |
| Conciliación, antes y después de escalar | Pass | Las siete consultas devolvieron cero filas |
| `060` y `061` | Ejecutadas | Sesión B recibió 2601 |

`050` comprueba el expediente pequeño: oficina 101 con D=2 y N=1, nacional D=3 y N=2. Se ejecutó antes de `medium` y `large`. Esas cifras ya no describen la base escalada. La fórmula de cobertura se volvió a medir sobre el volumen grande; ver más abajo.

### Negativas observadas

2601 en consecutivo duplicado, en segundo caso activo y en segunda valoración vigente. 547 en consecutivo no canónico, atención de otra persona, participación cruzada, programación cruzada, catálogo incorrecto, prioridad incompatible, Otro sin explicación, destino fuera de traslado y persona inexistente. 2627 en el segundo cierre. 229 al insertar `caso_cierre` con `rol_aplicacion`. 230 al actualizar `estado` y al leer `clave_archivo` o `acciones_previas` como rol regional.

La prueba deja escrita la nota de que un `CHECK` no impide, por sí solo, un caso `ACTIVO` que ya tenga fila de cierre. La conciliación sí lo ve y la transacción de la prueba revirtió ese caso. No apareció en la conciliación posterior.

## Invariantes después de la carga

| Comprobación | Resultado |
| --- | --- |
| Más de un caso activo por persona | 0 |
| Atenciones fuera de la vigencia del caso | 0 |
| Columna de caso sucesor | 0 |
| Claves foráneas deshabilitadas o sin confianza | 0 de 73 |
| `CHECK` deshabilitados o sin confianza | 0 de 112 |
| Conciliación | 0 filas en las siete consultas |
| `REF-900-2026` después de la concurrencia | 1 fila |

## Cobertura 2026

Denominador: personas con caso activo ahora. Numerador: de esas personas, las que tienen atención individual de ese caso en 2026 o participación grupal con `asistio = 1` de ese caso en 2026. Una persona cuenta una vez.

| Ámbito | Denominador | Numerador |
| --- | ---: | ---: |
| Región 1 | 127 | 42 |
| Región 2 | 115 | 35 |
| Región 3 | 126 | 50 |
| Región 4 | 105 | 38 |
| Región 5 | 120 | 46 |
| Región 6 | 93 | 32 |
| Región 7 | 45 | 19 |
| Región 8 | 59 | 20 |
| Región 9 | 143 | 48 |
| Nacional | 933 | 330 |

La suma de los numeradores regionales es 330 y la de los denominadores es 933. El nacional es ese conjunto, no el promedio de los nueve porcentajes. Los porcentajes regionales no son iguales, así que su media no ponderada sería otra cifra. Esto no ratifica RN-040. La regla sigue provisional.

## Concurrencia

Dos procesos `sqlcmd` distintos. La sesión A inserta `DNCC-DRCS-OL101-1100102-REF-900-2026` y espera 20 segundos antes de confirmar. La sesión B se lanzó 4 segundos después de A, dentro de esa espera. A confirmó la fila. B imprimió `Error 2601` y no creó otro consecutivo. Los dos procesos terminaron con código 0.

No se midió el tiempo de espera de bloqueo en `sys.dm_os_waiting_tasks`. La evidencia de solapamiento es el orden de lanzamiento frente a `WAITFOR DELAY '00:00:20'`. El archivo de B dice que un 2601 posterior a la confirmación también demuestra el índice. Aquí el lanzamiento ocurrió durante la espera.

Las otras carreras descritas en `TEST_PLAN.md` (dos aperturas, dos cierres, dos revaloraciones, dos gestiones de la misma posible referencia) no están escritas como segundo par de archivos. Siguen sin ejecutarse. No se marcan como pasadas.

## Permisos

La prueba negativa comprobó en el motor que `rol_aplicacion` no inserta `caso_cierre` (229) ni actualiza `caso_ai.estado` (230), y que el rol regional no lee `clave_archivo` ni `acciones_previas` (230). La revisión estática de permisos no encontró un camino para cerrar el caso sin `ops.cerrar_caso`.

## SIDINACC_LOCAL

Conteo por tabla antes de crear `SIA_CENCINAI` y después de la carga, la medición y la concurrencia. Las 15 tablas devolvieron los mismos números: 4708, 4768, 3474, 3524, 5470, 3, 5, 4, 2, 661, 41, 9, 3, 2 y 2, en el orden del documento de volumen. El generador solo tiene `SELECT` hacia esa base. Los scripts de migración no la nombran para escribir.

## Pendientes de esta corrida

- Las cuatro carreras de `TEST_PLAN.md` que no tienen par de archivos.
- Repetir `050` no sirve como contrato del volumen grande: sus cifras son las del expediente pequeño.
- RN-040 no queda ratificada.
