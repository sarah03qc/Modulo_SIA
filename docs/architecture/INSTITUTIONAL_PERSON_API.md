# API de consulta contextual de personas

Lote backend 01. HU-005, HU-006, HU-007, HU-008 y HU-009. CU-02 y CU-03.

No es un CRUD de personas ni una pantalla general. La búsqueda exige identificación o nombre. El período de la réplica sale de `SIDINACC_PERIOD_ID` y la solicitud no puede cambiarlo.

## Autenticación local

La sesión productiva de SIDINACC sigue en `NEEDS_VALIDATION`. No hay login del módulo.

Sin encabezado `Authorization`, la respuesta es `401` `AUTHENTICATION_NOT_CONFIGURED`.

En `development` y `test` el servidor acepta `Authorization: Bearer <principalId>` solo si ese identificador está declarado en `apps/api/src/infrastructure/auth/development-access.js`. Un encabezado `X-Access-Level`, `X-Establishment-Id` o un parámetro `accessLevel` no selecciona rol ni ámbito. Una credencial desconocida responde `401` `UNAUTHORIZED`.

Esas identidades son sintéticas, de alcance local, y no deben presentarse como integración con UTIC. Fuera de `development` y `test` la vía queda cerrada. El proceso tampoco arranca con `NODE_ENV=production`.

| principalId | Ámbito |
| --- | --- |
| `dev-establecimiento-unico` | Establecimiento `1100102` |
| `dev-establecimiento-multiple` | Establecimientos `1100102` y `1010320` |
| `dev-oficina-hatillo` | Oficina Local `101`, Región `1` |
| `dev-oficina-perez-zeledon` | Oficina Local `501`, Región `5` |
| `dev-region-central-sur` | Región `1` |
| `dev-region-brunca` | Región `5` |
| `dev-nacional` | Ámbito nacional de la réplica |

Los identificadores territoriales son del catálogo público ya cargado en la réplica. No son datos de personas reales.

## Rutas

Todas son `GET` bajo `/api/institutional`.

| Ruta | Uso |
| --- | --- |
| `/persons/search` | Búsqueda contextual compartida por los cuatro niveles |
| `/persons/:personId` | Ficha básica de una persona ya localizable en el ámbito |
| `/territory/options` | Opciones de filtro que el ámbito autoriza |

### Búsqueda

Parámetros: `q` (obligatorio, 2 a 80 caracteres), `page` (predeterminado 1), `pageSize` (predeterminado 20, máximo 25), `regionId`, `localOfficeId`, `establishmentId`.

La página no puede superar un desplazamiento de 500 filas. No se devuelve el texto buscado.

Precedencia, RF-009: si hay coincidencia exacta de `PER_idPersona` dentro del ámbito, la respuesta usa `matchMode: "identification"` y no mezcla coincidencias por nombre. Si no la hay, busca por nombre o apellido, total o parcial, y usa `matchMode: "name"`.

`result.total` es el total de coincidencias. `result.returned` es el tamaño de la página. Sin coincidencias, `result.message` lo indica y el ámbito no se amplía.

Cada ítem trae identificación, nombre, fecha de nacimiento, edad, sexo, establecimiento, Oficina Local y Región. No trae dirección, teléfonos ni persona encargada.

### Filtros

| Nivel | Comportamiento |
| --- | --- |
| Establecimiento | Solo filtra por sus establecimientos. Si tiene uno, se aplica solo y `establishmentAppliedAutomatically` es verdadero. Región u Oficina Local en la solicitud es `400`. Un establecimiento ajeno es `403`. |
| Oficina Local | Queda fijada la oficina autorizada. Puede filtrar por un establecimiento de esa oficina. Otra oficina o región es `403`. |
| Región | Queda fijada la región. Puede filtrar por Oficina Local y establecimiento. Otra región es `403`. Oficina y establecimiento de la región que no se contienen es `400`. |
| Nacional | Puede filtrar por Región, Oficina Local y establecimiento. Una combinación que no respeta la jerarquía, o una unidad inactiva o desconocida, es `400`. Sin filtros territoriales la búsqueda sigue exigiendo `q`. |

La jerarquía se lee de `RCS_ESTABLECIMIENTO`, `CAF_CAT_OFICINA_LOCAL` y `CAF_CAT_REGION`. No está copiada como tabla paralela en SIA.

`/territory/options` repite esas reglas. En Regional y Nacional, los establecimientos se listan después de elegir Oficina Local. La respuesta no incluye personas.

Cambiar un nivel superior y conservar un hijo incompatible no limpia el hijo en silencio: la API rechaza la combinación. El cliente debe limpiar los niveles inferiores. Eso cubre en backend la dependencia de RF-014.

### Ficha

`personId` admite letras, dígitos y guion, hasta 20 caracteres.

Incluye la identidad de la búsqueda, dirección y teléfonos del detalle familiar del período, servicios de `CAF_SERVICIO_CLIENTE` y, si existe una fila de `CAF_MENOR`, la persona encargada.

La relación solo se informa como `MADRE` o `PADRE` cuando el identificador del encargado coincide con `MEN_idMadre` o `MEN_idPadre`. Otro encargado queda con relación nula. No hay catálogo de otras relaciones en la réplica (`NEEDS_VALIDATION`).

Dirección y teléfonos pertenecen al detalle familiar del período, no son un teléfono personal exclusivo del encargado.

`guardian.contextOnly` es verdadero. La respuesta no crea un cliente de Atención Interdisciplinaria para esa persona. Las personas sin familia, como las encargadas de la réplica, no aparecen en la búsqueda ni tienen ficha propia.

`services.interpretationStatus` y `provenance.integrationStatus` quedan en `NEEDS_VALIDATION`: `CAF_SERVICIO` todavía no está confirmado por UTIC como la modalidad institucional, y la réplica no es la fuente productiva.

Si el período tiene más de un detalle familiar, aunque solo uno esté dentro del ámbito, la ficha responde `409` `INSTITUTIONAL_LOCATION_AMBIGUOUS` y no elige una fila. La búsqueda omite a esa persona. El otro establecimiento no se devuelve. Un traslado repetido dentro del mismo período sigue en `NEEDS_VALIDATION`.

Una persona inexistente y una persona fuera de ámbito reciben el mismo `404`. No se confirma si el identificador existe.

### Casos de Atención Interdisciplinaria

La ficha lee `dbo.caso_lista_establecimiento`: identificador, estado, prioridad, fecha de apertura y fecha de cierre, limitados al ámbito del principal. No lee valoración, factores, riesgo, protección, plan, atenciones ni documentos. El permiso SQL de la vista no sustituye ese filtro.

En el ambiente local, `sia_cencinai_app` tiene `SELECT` sobre esa vista por `database/sia-cencinai/security/010_grant_case_list_to_app.sql`. Con un caso visible la respuesta queda:

```json
{
  "availability": "AVAILABLE",
  "reasonCode": null,
  "source": "SIA_CENCINAI",
  "visibleCaseCount": 1,
  "message": null,
  "items": [
    {
      "caseId": "1",
      "status": "ACTIVO",
      "priority": "BAJO",
      "openedOn": "2026-02-01",
      "closedOn": null
    }
  ]
}
```

Si la persona está en el ámbito y no hay casos visibles, `availability` es `AVAILABLE`, `items` es un arreglo vacío, `visibleCaseCount` es 0 y `message` indica que no hay casos visibles. No se inventan casos.

Si el motor niega el `SELECT`, la ficha no cierra el pool y responde `availability` `BLOCKED`, `reasonCode` `PERMISSION_PENDING` e `items` nulo. Un fallo de infraestructura distinto responde `503` y no se presenta como ausencia de casos.

## Errores

`{ "error": { "code": "...", "message": "..." } }`

| HTTP | Código | Situación |
| --- | --- | --- |
| 400 | `VALIDATION_ERROR` | Criterio, página o combinación territorial inválida |
| 401 | `AUTHENTICATION_NOT_CONFIGURED` | No hay credencial ni sesión institucional |
| 401 | `UNAUTHORIZED` | La credencial local no está registrada |
| 403 | `FORBIDDEN` | Filtro fuera del ámbito, o no hay contexto de acceso |
| 404 | `NOT_FOUND` | La persona no está disponible en el ámbito |
| 409 | `INSTITUTIONAL_LOCATION_AMBIGUOUS` | Más de un detalle familiar del período dentro del ámbito |
| 503 | `INFRASTRUCTURE_UNAVAILABLE` | La base no respondió. El cuerpo no incluye el error del motor |

## Fuera de este contrato

Exportación de personas (RF-020, pendiente de revisión), historial, valoración, apertura de casos, referencias, sesiones, atenciones y reportería. HU-010, HU-011 y HU-012 no están implementadas. La edad usa la fecha local del proceso; la zona institucional sigue en `NEEDS_VALIDATION`.
