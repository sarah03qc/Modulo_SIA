# Huecos de implementación

No se convirtieron en reglas SQL. El esquema puede instalarse en desarrollo sin cerrarlos.

## UTIC

- Llave definitiva `PER_idPersona` o `RCS_idPersona`. Hoy `per_id_persona` es `nvarchar(20)`, sin FK externa.
- Mapa institucional `region_id` → código DR. La semilla usa 1..9 como la réplica local y el servicio no debe exigir que coincida con la región de la persona.
- `id_externo` de la posible referencia, hasta el contrato de intercambio.
- Collation y zona horaria si UTIC fija un estándar distinto de `Latin1_General_100_CI_AS` y de la hora que envía el servicio.
- Motor de producto. SQL Server es el motor de este diseño, no una decisión de stack ya aprobada en `sources-and-validation.md`.

## Validación con Alina

- RN-040 sigue provisional. La consulta usa la fórmula del diseño y no la da por ratificada.
- Corrección de un consecutivo ya enviado (`NV-CORRECCION`). No hay `UPDATE` de esa columna.

## Catálogos y campos no confirmados

No se sembraron como norma: disciplinas, estrategias, tipos de atención restantes, factores del instrumento, categorías requeridas, factores de riesgo de la referencia, visita domiciliaria, instituciones, estados de coordinación y tipos documentales.

La semilla sintética inserta códigos `SYN_*` para poder probar. No son catálogo oficial.

`fecha_coordinacion` y `motivo` de coordinación quedaron anulables porque el diseño no los marcó obligatorios.

Qué actividades grupales admiten participante sin caso, y si un activo fuera del ámbito debe enlazarse (`NV-GRUPAL-AMBITO`), siguen abiertos. `caso_id` nulo sigue siendo válido.

Si solo una versión del instrumento puede estar vigente, el diseño seleccionado no lo escribió. El motor no lo impone. `numero_version` sí es único.

## Aplazado

- EDIN II, EVADE y resultados nutricionales. No hay tablas ni columnas.
- Binario del archivo, formato y retención del informe.
- Padrón nominal de la sesión.
- Corrección de un hecho ya confirmado. No hay `UPDATE` de contenido clínico.
- Umbral de supresión del agregado pequeño.
- RLS y tabla de establecimientos autorizados.

## Contrato que todavía es del servicio

El esquema no abre, cierra ni revalora solo, salvo el procedimiento de cierre, que igual exige que el servicio abra la transacción y compruebe el ámbito.

Siguen en el servicio: formato fino junto con RF-115, mensaje fijo de caso activo, categorías requeridas, mínimo de disciplinas, participantes y visualizaciones, tokenización de Otro, sexo y edad desde el adaptador, y la prohibición de consultar SIDINACC dentro de la transacción.

## Residuos técnicos

- Caso `ACTIVO` con fila de cierre confirmada por una sesión que no usa `ops.cerrar_caso`.
- Historial `CERRADO` no referenciado. El rol de aplicación puede insertarlo; la conciliación lo ve.
- Atención sobre un caso ya cerrado, rechazada por la transacción y no por la FK.
- Un rol SQL con escritura amplia anula los permisos de columna.
- La prueba de dos sesiones no está ejecutada.
- La sintaxis no pasó por un motor ni por `sqlcmd`.
