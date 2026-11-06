# Revisión del esquema para SQL Server

Revisión estática de `database/sia-cencinai/migrations` contra el diseño seleccionado. No se ejecutó SQL y no hubo conexión a una instancia.

## Hallazgos críticos

Ninguno después de las correcciones de esta revisión.

## Hallazgos importantes

Estos ya quedaron corregidos en los scripts:

1. `rol_lectura_regional` y `rol_lectura_nacional` tenían `SELECT` de toda `inf_informe`, incluida `clave_archivo`. El diseño retiene las claves de archivo mientras 17.4 siga abierto. El `GRANT` ahora omite esa columna.
2. Esos mismos roles leían `acciones_previas`, `resultados_previos`, `informacion_complementaria` y `ref_motivo.especificacion`. El diseño les deja resumen, estado, prioridad, fechas y plan vigente, no esas narrativas. El `GRANT` quedó por columna.
3. `UX_cat_instrumento_version_vigente` imponía una sola versión de instrumento vigente. El diseño solo exige `numero_version` único. El índice se retiró. No es una incompatibilidad de SQL Server.

## Mejoras opcionales

- Las pruebas negativas no leen el nombre del constraint en `ERROR_MESSAGE()`. Con la semilla actual cada rechazo tiene una sola causa.
- `prog_actividad.observaciones` sigue legible para Regional y Nacional. La visualización 6 sí usa el motivo de cancelación. No hay regla de contenido para observaciones.
- El borrador lo lee todo `rol_aplicacion`. El filtro por autor es del servicio. No se codificó un lector de oficina.
- La carrera de dos sesiones no está ejecutada.

## Decisión

```text
APPROVED
```

La decisión cubre el diseño estático ya corregido. No autoriza crear la base. La sintaxis frente al motor queda `NOT_RUN`.

## Cambios aplicados

- `GRANT` por columna en `ref_referencia`, `ref_motivo` e `inf_informe`.
- Eliminación de `UX_cat_instrumento_version_vigente`.
- La prueba del segundo cierre acepta solo 2627.
- Pruebas de permiso, todavía no ejecutadas, para `UPDATE` de `estado` (230) y para la lectura regional de `clave_archivo` y `acciones_previas` (230).

## Criterios revisados

- PK: sustituta `bigint IDENTITY` en los hechos; `per_id_persona nvarchar(20)` como clave natural del vínculo; el consecutivo es índice único, no PK.
- FK: 73, todas `NO ACTION`. Las circulares se crean en `090` con un lado anulable. Ninguna apunta a un índice filtrado ni a otra base.
- Tipos: `nvarchar`, `date`, `time(0)`, `datetime2(0)`, `decimal(18,4)`, `bit`, `int`, `bigint`, `smallint`, `rowversion`. Sin `float`, `text`, `ntext`, `image`, `datetime` legado ni `uniqueidentifier`. `nvarchar(max)` solo en el borrador.
- Historia: valoraciones, factores, planes y cierres no se reescriben. No hay caché de prioridad.
- Concurrencia: `rowversion` en filas mutables, índice único filtrado del caso activo, contratos con `UPDLOCK, HOLDLOCK` y sin `MERGE`.
- Seguridad: el cierre no es DML directo del rol de aplicación. El ámbito institucional no lo decide el `GRANT`.
