# Modelo de seguridad SQL

Los permisos de esta base no sustituyen el rol institucional ni el establecimiento autorizado. El servicio sigue aplicando el ámbito en cada operación. No hay tabla de asignaciones ni RLS.

Un inicio de sesión no debe pertenecer a la vez a `rol_aplicacion` y a `rol_establecimiento`. No se usó `DENY`, porque un `DENY` de un rol bloquearía al otro si se combinan. La separación es de inicio de sesión.

## Roles

| Rol | Uso | Escritura |
| --- | --- | --- |
| `rol_aplicacion` | Servicio de Oficina Local que opera el expediente | DML acotado y `EXECUTE` de `ops.cerrar_caso` |
| `rol_establecimiento` | Lista de columnas permitida | Solo `SELECT` de `caso_lista_establecimiento` |
| `rol_lectura_regional` | Lectura agregada y de seguimiento | Sin textos de atención, factores, explicación, destino ni clave de archivo |
| `rol_lectura_nacional` | Igual que regional mientras 17.4 siga abierto | Igual |
| `rol_catalogo` | Publicar versiones | `INSERT` y pocos `UPDATE` (`vigente`, `activo`) |
| `rol_auditoria` | Lectura de `aud_*` | Ninguna |

Los usuarios `usuario_*` se crean `WITHOUT LOGIN` para las pruebas de permiso. No son cuentas institucionales y no tienen contraseña.

Las migraciones las ejecuta un principal de despliegue. No hay un usuario de migración guardado en el script.

## Frontera del cierre

`rol_aplicacion` puede insertar un caso `ACTIVO` y actualizar solo `valoracion_vigente_id` y `plan_vigente_id`. No puede actualizar `estado` ni `cierre_caso_id`. No puede insertar `caso_cierre`.

`ops.cerrar_caso` vive en el esquema `ops`, con el mismo dueño que `dbo`. El encadenamiento de propiedad le permite escribir esas columnas sin conceder el `UPDATE` de tabla. La apertura y la revaloración no nombran `estado` ni `cierre_caso_id`.

Un inicio de sesión con `db_owner`, `db_datawriter` o `UPDATE` de tabla sobre `caso_ai` anula esa separación. Eso es una condición de despliegue, no una tabla nueva.

## Datos sensibles

| Dato | Quién lo lee en SQL |
| --- | --- |
| Factores, riesgo, protección, textos de atención, snapshot familiar, explicación y destino | `rol_aplicacion` |
| Prioridad en Establecimiento | Solo la vista, junto con estado, ámbito y fechas |
| Clave de archivo | `rol_aplicacion`. Regional y Nacional no tienen `SELECT` de `doc_documento`, de `clave_almacen` ni de `inf_informe.clave_archivo` |
| Narrativa de referencia | `rol_aplicacion`. Regional y Nacional no leen `acciones_previas`, `resultados_previos`, `informacion_complementaria` ni `ref_motivo.especificacion` |
| Borrador | `rol_aplicacion`, sin filtro de autor en SQL. El servicio filtra por autor. El `GRANT` no abre el borrador a la misma oficina: esa pregunta sigue abierta y un lector de oficina no se codificó |
| Auditoría | Códigos, entidad e identificador. No hay columna de texto clínico |
| Informe | Agregados ya calculados, sin `per_id_persona` |

Regional y Nacional reciben de `ses_valoracion` la prioridad y no las columnas de riesgo y protección. Reciben de `caso_cierre` el código de motivo y la fecha, no la explicación ni el destino. Reciben de la referencia el consecutivo, el estado, el ámbito y los ítems, no los textos libres. Reciben el informe sin `clave_archivo`. El servicio de Oficina tokeniza Otro antes de guardar el agregado.

La vista no filtra filas. Un `SELECT` nacional de `caso_lista_establecimiento` seguiría siendo un error de servicio.

## Lo que el permiso no decide

- Si la persona usuaria puede ver un borrador de otra persona de la misma oficina.
- El permiso reforzado de documentos para Regional y Nacional.
- El umbral de supresión de un agregado pequeño. No se inventó.
- El mecanismo real de establecimientos autorizados.

Esos puntos siguen `NEEDS_VALIDATION` y no amplían los `GRANT`.
