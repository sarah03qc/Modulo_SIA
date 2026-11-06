# Datos sintéticos de SIA_CENCINAI

Distribución de prueba para desarrollo. No es una prevalencia institucional ni una equivalencia clínica con la réplica.

## Estrategia

`seeds/020_synthetic_dataset.sql` carga el expediente pequeño que las pruebas funcionales ya conocen.

`seeds/030_synthetic_scale.sql` agrega personas. Lee `SIDINACC_LOCAL` y escribe solo en `SIA_CENCINAI`. Acepta identificadores `SYN-` de 14 caracteres, no eliminados, con familia y establecimiento activo en el período 2026, Oficina Local de tres dígitos y código DR de `cat_codigo_region_referencia`. No copia nombres, direcciones ni teléfonos. La edad del contexto es un entero derivado de la fecha de nacimiento. Las etiquetas territoriales del contexto son `Region`, `OL` y `EST` más el identificador.

La semilla aleatoria es `20261105`. El orden de selección es `CHECKSUM` de esa semilla y el identificador. Volver a ejecutar la misma escala no inserta otra vez: el cupo ya cubierto termina sin escribir. No hay limpieza automática. Vaciar la base exigiría una decisión humana sobre `SIA_CENCINAI`; este generador no lo hace y no toca `SIDINACC_LOCAL`.

El consecutivo de ejemplo lo arma el generador. Cumple el patrón de RF-114, usa el código de establecimiento de la persona y el código DR de la región. El sufijo de tres dígitos sigue al máximo ya almacenado para ese establecimiento y año. No hay tabla contador y el producto no quedó con generación automática.

## Escalas

El techo de identidad son las 4695 personas ubicadas en 2026.

| Escala | Cupo acumulado de personas de escala | Insertadas en la corrida |
| --- | ---: | ---: |
| `small` | 120 | 120 personas, 76 referencias |
| `medium` | 940 | 820 personas, 528 referencias |
| `large` | todas las elegibles restantes | 3748 personas, 2348 referencias |

120 + 820 + 3748 = 4688 personas de escala. Las 7 de la semilla pequeña completan las 4695 vinculadas.

La distribución por persona usa el residuo del `CHECKSUM` y está hecha para recorrer flujos, no para imitar una tasa institucional:

| Residuo | Perfil |
| --- | --- |
| 0–49 | Solo vínculo |
| 50–61 | Una referencia pendiente |
| 62–69 | Referencia que no abre caso |
| 70–81 | Un caso activo |
| 82–88 | Uno o dos casos cerrados, sin activo |
| 89–94 | Un caso cerrado por traslado y, después, una referencia nueva con caso activo |
| 95–97 | Una referencia que no abre caso y otra pendiente |
| 98–99 | Caso activo con más atenciones y revaloración |

La prioridad sale de las nueve filas de `cat_matriz_prioridad`. Una categoría protectora puede quedar en `NINGUNO`; en ese caso no se le cargan factores. El cierre pasa por `ops.cerrar_caso`. El traslado no crea un caso sucesor. La segunda referencia es independiente.

## Volumen insertado

Inventario de `sys.partitions` al terminar `large` y antes de la prueba de concurrencia. Después de esa prueba, `ref_referencia` quedó en 2961 por la fila `REF-900-2026`. El resto de esta tabla es el inventario previo. La suma de esas filas era 62592; con la referencia de concurrencia, 62593.

| Tabla | Filas |
| --- | ---: |
| `vinculo_persona` | 4695 |
| `ref_referencia` | 2960 |
| `ref_contexto` | 2954 |
| `ref_motivo` | 2960 |
| `ref_impresion` | 1709 |
| `ref_posible` | 1234 |
| `caso_ai` | 1713 |
| `caso_cierre` | 780 |
| `caso_estado_historial` | 2493 |
| `caso_plan` | 1947 |
| `ses_valoracion` | 2808 |
| `ate_individual` | 4050 |
| `ate_grupal` | 84 |
| `ate_grupal_participante` | 410 |
| `prog_actividad` | 943 |
| `prog_cambio` | 380 |
| `prog_persona` | 931 |
| `inf_informe` | 10 |
| `inf_visualizacion` | 80 |
| `inf_agregado` | 83 |
| `aud_evento` | 1712 |
| `aud_migracion_lote` | 3 |

Casos: 933 activos y 780 cerrados. Nadie tenía dos activos. No hubo atenciones anteriores a la apertura ni en la fecha de cierre o después.

Cierres: 267 satisfactorios, 471 por traslado y 42 con motivo Otro y justificación de prueba.

Prioridad vigente: 562 alto, 773 moderado y 378 bajo. Esas tres salen de la matriz; no se asignó una pareja incompatible.

## Territorio y tiempo

Casos activos por región: 127, 115, 126, 105, 120, 93, 45, 59 y 143, de la región 1 a la 9.

Aperturas por año: 2022 = 521, 2023 = 269, 2024 = 375, 2025 = 237, 2026 = 311.

Atenciones individuales por año: 2022 = 1084, 2023 = 663, 2024 = 1130, 2025 = 557, 2026 = 616.

Programación: 381 programadas, de las cuales 191 tienen fecha vigente anterior al 2026-11-05 y siguen en estado `PROGRAMADA`. También hay 186 realizadas, 189 canceladas y 187 reprogramadas. No existe un estado `VENCIDA`.

Las cabeceras grupales son 84. Los participantes son 410. La cabecera no se multiplicó por persona. Hay asistencias, ausencias y asistencia nula. Quien no tiene caso activo puede participar con `caso_id` nulo.

## Informes

Cada escala dejó un informe nacional de 12 visualizaciones, uno regional de 8 y uno de oficina de 5. El texto de análisis empieza por `[PRUEBA SINTETICA]`. El agregado de cobertura nacional guarda el denominador y el numerador calculados en la misma carga. Esos números son de prueba.

## Comparación con la réplica

| Referencia | Réplica | SIA |
| --- | ---: | ---: |
| Personas | 4708 | 4695 vínculos, las ubicadas en 2026 |
| Hecho más grande de la réplica | 5470 servicios | 4050 atenciones individuales y 2960 referencias |
| Regiones / oficinas / establecimientos activos | 9 / 41 / 630 | Los casos activos usan esas nueve regiones |

No se inventaron personas fuera de la réplica para inflar el volumen.

## Limitaciones

- El mapa `region_id` 1..9 hacia CS, HN, CH, HC, BR, CN, PC, CO y CE sigue `NEEDS_VALIDATION`.
- `CAF_MENOR` y las evaluaciones nutricionales de la réplica son pocas. El generador no las convirtió en casos.
- La edad del contexto no ajusta el cumpleaños dentro del año.
- Las etiquetas de lugar del contexto no son el nombre institucional del establecimiento.
- El instrumento, las disciplinas y la estrategia sintéticos salen de la semilla `020`. Sin esa semilla, la escala se detiene.
- La prueba de concurrencia dejó confirmada la referencia `DNCC-DRCS-OL101-1100102-REF-900-2026`.
