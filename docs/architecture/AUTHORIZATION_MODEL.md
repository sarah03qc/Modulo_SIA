# Modelo de autorización — SIA-CENCINAI

Consolidación posterior al Lote 01. Decisión: `docs/decisions/0002-authorization-model.md`.

El objetivo es declarar una capacidad y exigirla en la ruta y en el servicio, sin rediseñar el ámbito territorial que ya resuelve Establecimiento, Oficina Local, Región y Nacional.

## Separación

| Pieza | Módulo | Responsabilidad |
| --- | --- | --- |
| Proveedor de identidad | `identity-provider.js` | Decide la fuente según `NODE_ENV`. No asigna roles |
| Identidad sintética | `development-identity-provider.js` y `development-access.js` | Solo `development` y `test`. El Bearer selecciona un registro del servidor |
| Contrato SIDINACC | `sidinacc-session-contract.js` | Frontera futura. No acepta credenciales ni inventa identificadores |
| Adaptador institucional | `institutional-identity-adapter.js` | Pasa de la identidad autenticada al contexto interno. Rechaza una fuente no sintética |
| Contexto interno | `user-context.js` | Roles, concesiones, capacidades y ancla territorial |
| Políticas | `authorization-policy.js` | Denegación por defecto. Exige una capacidad conocida |
| Ámbito | `territorial-scope.js` | Filtros sobre el ancla ya concedida |
| Campos | `field-policy.js` | Retira campos que la capacidad no permite |
| Aplicación | Rutas de `institutional-routes.js` y métodos de `person-query-service.js` | La ruta y el servicio exigen la misma capacidad |

`req.access` conserva `principalId`, `accessLevel`, `regionId`, `localOfficeId` y `establishmentIds` para el Lote 01. Agrega `roles`, `grants`, `capabilities` e `identitySource`.

## Capacidades

Los códigos son internos. No son nombres de perfil de SIDINACC.

| Capacidad | Establecimiento | Oficina Local | Región | Nacional | Situación |
| --- | --- | --- | --- | --- | --- |
| `person.search` | sí | sí | sí | sí | Exigida por la búsqueda del Lote 01 |
| `person.profile.read` | sí | sí | sí | sí | Exigida por la ficha del Lote 01 |
| `territory.options.read` | sí | sí | sí | sí | Exigida por las opciones territoriales |
| `case.summary.read` | sí | sí | sí | sí | Resumen con identificador, estado, prioridad y fechas |
| `referral.create`, `referral.read` | sí | sí | no | no | Declaradas. Sin ruta en este incremento |
| `session.manage` | no | sí | no | no | Declarada. Sin ruta |
| `assessment.read`, `assessment.write` | no | sí | no | no | Declaradas. Sin ruta |
| `case.open`, `case.close` | no | sí | no | no | Declaradas. Sin ruta |
| `case.read` | no | sí | sí | sí | Consulta de caso distinta del resumen mínimo. Sin ruta |
| `case.risk.read`, `case.protection.read`, `case.closure.read` | no | sí | no | no | Solo proyectan campos si una respuesta ya los trae |
| `plan.read`, `attention.detail.read`, `attention.write` | no | sí | no | no | Igual que la fila anterior |
| `document.read`, `coordination.read`, `transfer.read` | no | sí | no | no | Igual que la fila anterior |
| `scheduling.read` | no | sí | sí | sí | Declarada. Sin ruta |
| `scheduling.manage` | no | sí | no | no | Declarada. Sin ruta |
| `reporting.read`, `reporting.export` | no | sí | sí | sí | Declaradas. Sin ruta. RF-020 sigue pendiente |
| `catalog.manage` | no | no | no | no | ACT-07. Ningún rol la tiene |

## Actores

| Actor | Rol interno |
| --- | --- |
| ACT-01 Profesional, ASC2 y ASC3 | `ESTABLECIMIENTO`. ASC2 y ASC3 no tienen capacidades distintas |
| ACT-02, ACT-03 y ACT-04 | `OFICINA_LOCAL`. Mismas capacidades. Decisión `docs/decisions/0003-local-office-actors.md` |
| ACT-05 | `REGION` |
| ACT-06 | `NACIONAL` |
| ACT-07 | Sin rol. `catalog.manage` no está concedida |
| ACT-08 | Sin acceso |
| ACT-09 | Fuera de la autorización funcional de A.I. |

Varios establecimientos del rol Establecimiento se unen. Es la regla de RF-104. Dos concesiones o una sola lista producen el mismo ancla.

Roles de distinto nivel, o dos oficinas, o dos regiones, no se convierten en una consulta más amplia. El contexto conserva la lista de capacidades de esos roles, pero `scopeConfirmed` queda en falso. `hasCapability` y `requireCapability` no las conceden. La operación responde `403` antes de consultar. Esa composición queda en `NEEDS_VALIDATION`.

## Cómo agregar una capacidad

1. Declarar el código en `CAPABILITY`.
2. Concederlo solo en los roles que la especificación confirmada autoriza.
3. Exigirlo con `createCapabilityGuard` en la ruta y con `requireCapability` en el servicio.
4. Si la respuesta puede incluir un campo sensible, registrarlo en `RESTRICTED_FIELDS`.
5. Reutilizar `resolveTerritorialScope` para el ámbito. No leer rol ni establecimiento desde la solicitud.
6. Agregar una prueba que concede la operación y otra que la rechaza, incluida la ausencia de la capacidad.

## Entorno sintético

- El registro vive en código del servidor, no en una tabla de SIA ni en `SIDINACC_LOCAL`.
- No sustituye la asignación institucional de establecimientos. RF-104 sigue dependiendo del mecanismo vigente.
- El cliente solo presenta el identificador. No puede enviarse a sí mismo un rol, una capacidad ni un establecimiento.
- `NODE_ENV` distinto de `development` o `test` no consulta ese registro.
- La configuración sigue rechazando el arranque con `NODE_ENV=production`.
- Los identificadores de prueba no son secretos ni credenciales institucionales.

Identidades agregadas para las pruebas de este modelo:

| principalId | Uso |
| --- | --- |
| `dev-establecimientos-por-rol` | Dos concesiones de Establecimiento, `1100102` y `1010320` |
| `dev-roles-heterogeneos` | Establecimiento `1100102` más Nacional. La consulta se rechaza |
| `dev-sin-capacidades` | Identidad conocida sin concesiones. Las operaciones responden `403` |

## Pendiente con UTIC

- Mecanismo de sesión, formato de credencial e identificador de usuario.
- Dónde se obtienen el perfil y los establecimientos autorizados, incluidos ASC2 y ASC3.
- Correspondencia de ese perfil con un rol interno. El adaptador no la inventa.
- Si una persona puede reunir niveles distintos y cómo se consulta esa unión.
- Si la consulta regional o nacional incluye valoración, riesgo, protección, plan y atenciones.
- El rótulo visual de ASC2 y ASC3, y las visualizaciones de Reportería para Establecimiento.
- Los valores de `usuario` y `rol` que la auditoría productiva deberá registrar. RNF-003 sigue sin `INSERT` en `aud_evento`.

Hasta esa definición, `resolveSidinaccSession` responde que la autenticación no está configurada y no lee la credencial.
