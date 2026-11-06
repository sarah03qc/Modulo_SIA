# Arquitectura de software — SIA-CENCINAI

Bootstrap del 2026-11-06. La arquitectura de datos ya implementada no se modifica. Decisión de modularidad: `docs/decisions/0001-modular-monolith.md`.

## Arquitectura general

Monolito modular. El frontend React y el backend Express son aplicaciones separadas dentro de un workspace npm. No hay microservicios ni una librería compartida: todavía no existe código de dominio usado por las dos aplicaciones.

```mermaid
flowchart LR
  browser["Navegador React"]
  api["API Express"]
  sia["SIA_CENCINAI escritura controlada"]
  replica["SIDINACC_LOCAL lectura"]
  browser -->|"HTTP /health /ready"| api
  api -->|"pool SIA"| sia
  api -->|"pool institucional"| replica
```

El navegador no abre conexiones SQL. Las rutas bajo `/api` quedan cerradas hasta integrar la sesión institucional.

## Frontend

`apps/web` muestra una pantalla técnica de bienvenida. Responsabilidades actuales:

- arranque, variables públicas y estados de carga, éxito, dependencia no disponible y error de conexión;
- presentación accesible, sin datos personales ni flujos institucionales;
- llamada HTTP a la API mediante `loadTechnicalStatus`.

No hay gestor global de estado ni biblioteca de componentes. Los módulos de expediente, referencia, valoración, atención, programación y reportería no tienen pantallas.

La identidad visual usa la paleta documentada en `docs/institutional/DESIGN_ACCESSIBILITY_SPEC.md` solo donde el contraste de texto es suficiente. No se reconstruye el logotipo: el archivo oficial no está en el repositorio (`NEEDS_VALIDATION`). Esta entrega no certifica WCAG 2.2 AA. El objetivo de revisión sigue siendo ese nivel cuando se confirmen los criterios institucionales aplicables.

## Backend

`apps/api` separa:

| Pieza | Responsabilidad actual |
| --- | --- |
| `src/server.js` | Carga de configuración, escucha y cierre |
| `src/app.js` | Express, CORS, cabeceras y contrato de errores |
| `src/config` | Validación de entorno. No hay conexión de respaldo |
| `src/common` | Errores HTTP, registro y errores asíncronos |
| `src/modules/technical` | `GET /health` y `GET /ready` |
| `src/infrastructure/database` | Dos clientes SQL |
| `src/infrastructure/integrations` | Adaptador SIDINACC |
| `src/infrastructure/auth` | Frontera de sesión, sin login propio |

`createApp` no abre el puerto. Las pruebas HTTP usan esa instancia sin escuchar.

Errores distinguibles: validación `400`, no autorizado `401`, prohibido `403`, no encontrado `404`, conflicto `409`, infraestructura `503` e interno `500`. La respuesta interna no incluye la excepción del controlador ni la contraseña. Los registros redactan claves cuyo nombre parece un secreto.

## Módulos previstos

Reservados en este documento hasta la historia que los implemente. No hay carpetas vacías.

| Módulo futuro | Épica de la especificación v0.7 | Notas |
| --- | --- | --- |
| `institutional` | EP-01 | Consulta contextual. No es una pantalla general de personas |
| `references` | EP-02 | |
| `assessments` | EP-03 | |
| `cases` | EP-04 | |
| `attentions` | EP-05 | |
| `scheduling` | EP-14 | |
| `reporting` | EP-08 | |

Las reglas funcionales irán en servicios del módulo, no en controladores ni en componentes React. Un módulo no debe importar el interior de otro; la integración entre ellos queda para el incremento que la necesite.

## SQL Server

Hay dos pools. Cada uno fija servidor, puerto, base, usuario y `appName`. El nombre de base tiene que ser `SIA_CENCINAI` o `SIDINACC_LOCAL`; no se arma con datos de la petición.

| Cliente | Base | Uso en este bootstrap |
| --- | --- | --- |
| `sia` | `SIA_CENCINAI` | Comprobación de disponibilidad. El conteo de `dbo.schema_migracion` pertenece solo a la prueba de conectividad |
| `sidinacc` | `SIDINACC_LOCAL` | Comprobación de disponibilidad. El filtro rechaza una segunda sentencia, con o sin punto y coma, `SELECT *`, `alias.*` y verbos que no son una lectura |

El filtro del cliente institucional es una defensa adicional, no un analizador SQL ni un sustituto del permiso en el motor. `writeFilterEnabled` indica que ese filtro está activo. `readOnly` en `/ready` es otra muestra: permisos de `INSERT`, `UPDATE`, `DELETE` y `sysadmin` del login. El pool reabre la conexión en la consulta siguiente si la anterior falló. Los tiempos de conexión y de solicitud salen de la configuración.

`/ready` informa si cada dependencia respondió y si el login institucional resultó de solo lectura. No devuelve usuario, contraseña, servidor ni el texto del error.

## Adaptador institucional

`createSidinaccAdapter` hoy solo comprueba disponibilidad. Las operaciones futuras —contexto de persona, territorio y relación persona-establecimiento— no están implementadas. `PER_idPersona` es la clave de integración de la réplica v0.1 y no se trata como identificador definitivo (`NEEDS_VALIDATION`, réplica local).

Si la fuente no responde, la API sigue en ejecución y `/ready` queda `unavailable`.

## Autenticación

`NEEDS_VALIDATION`: el mecanismo de sesión SIDINACC no está definido. No hay usuarios, contraseñas ni roles del módulo. `GET /api/*` responde `401` con código `AUTHENTICATION_NOT_CONFIGURED`. Ocultar botones no se usa como autorización. Los endpoints técnicos `/health` y `/ready` son públicos y solo escuchan en `127.0.0.1` o `localhost`.

El arranque con `NODE_ENV=production` se rechaza. No hay configuración productiva.

## Seguridad de la réplica

La conexión institucional usa el login `sia_sidinacc_app`. Su base predeterminada es `SIDINACC_LOCAL`. No es `sysadmin` ni miembro de otros roles de servidor; el único permiso de servidor concedido es `CONNECT SQL`. El usuario de base, con el mismo nombre, pertenece solo a `sia_sidinacc_reader_role`. Ese rol es miembro de `db_datareader` y conserva los `DENY` de `INSERT`, `UPDATE`, `DELETE` y `ALTER` que ya definía el esquema. `SELECT` cubre la superficie de la réplica porque el rol reutiliza `db_datareader`; no se concedió `SELECT` objeto por objeto ni se amplió el rol.

La contraseña no está en el repositorio. `cencinai_reader` continúa sin usuario en la base y no se reutilizó. `sia_sidinacc_reader` sigue siendo `WITHOUT LOGIN`. `sia_sidinacc_app` no tiene usuario en `SIA_CENCINAI`, `HAS_DBACCESS` devuelve 0 y una consulta de tres partes hacia esa base falla con el error 916. El encadenamiento entre bases está desactivado y `guest` no tiene `CONNECT` en `SIA_CENCINAI`.

`readOnly` sale de la sonda de permisos del login. Con esta cuenta es `true`. `writeFilterEnabled` solo indica que el filtro del adaptador está activo; no sustituye esa sonda. Si las dos conexiones comparten usuario, el arranque lo advierte. La sonda deja de informar solo lectura cuando ese login puede escribir o es `sysadmin`.

## Contrato técnico

`GET /health`

```json
{ "status": "ok", "service": "sia-cencinai-api", "environment": "development" }
```

`GET /ready` con dependencias disponibles:

```json
{
  "status": "ready",
  "checks": {
    "sia": { "status": "up", "database": "SIA_CENCINAI" },
    "sidinacc": { "status": "up", "database": "SIDINACC_LOCAL", "readOnly": true }
  }
}
```

Si una dependencia falla, el estado HTTP es `503` y `status` es `unavailable`. Un error de cliente usa `{ "error": { "code": "...", "message": "..." } }`.

El navegador llama a `VITE_API_BASE_URL` o, en su defecto, `http://127.0.0.1:3001`. CORS solo refleja `CORS_ORIGIN`.

## Ejecución

Node corre en el host. SQL Server sigue siendo el contenedor existente `sidinacc-local-sql`, publicado en `1433`. Desde el host la dirección es `127.0.0.1`. Si más adelante la API corriera dentro de otro contenedor, `localhost` apuntaría a ese contenedor y haría falta `host.docker.internal` en Docker Desktop. Este bootstrap no agrega ese contenedor ni modifica el de SQL Server.

## Riesgos y pendientes

- La conexión de `SIA_CENCINAI` todavía usa la credencial de despliegue. El aislamiento verificado corresponde a la réplica, no a un usuario de escritura de mínimo privilegio para el módulo.
- Contrato de sesión SIDINACC.
- Identificador institucional definitivo de persona.
- Logotipo y certificación de accesibilidad.
- Exposición de red, CORS y alojamiento cuando exista un ambiente distinto del equipo local.
- El filtro de SQL institucional puede rechazar una consulta legítima que use una palabra reservada fuera de una cadena. Se ajusta en el incremento que la necesite.
