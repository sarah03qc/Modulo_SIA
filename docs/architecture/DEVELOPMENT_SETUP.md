# Entorno de desarrollo

## Requisitos

- Node.js 22 o superior. Verificado con 24.20.0.
- npm 10 o superior. Verificado con 11.19.0.
- Docker con el contenedor existente `sidinacc-local-sql` publicado en `127.0.0.1:1433`.
- Bases `SIA_CENCINAI` y `SIDINACC_LOCAL` ya creadas. Este entorno no las migra ni las vacía.

No hace falta un segundo SQL Server. La API y la web se ejecutan con Node en el host, no dentro de un contenedor.

## Instalación

Desde la raíz del repositorio:

```powershell
npm ci
```

`npm install` también resuelve el workspace la primera vez y actualiza el lockfile. Para repetir exactamente lo ya fijado, usar `npm ci`.

## Variables

```powershell
Copy-Item apps\api\.env.example apps\api\.env
Copy-Item apps\web\.env.example apps\web\.env
```

Completar `apps/api/.env` fuera de Git. `apps/web/.env` solo tiene la URL pública de la API; si no existe, la web usa `http://127.0.0.1:3001`.

La API exige las dos bases, puertos, CORS y contraseñas distintas del valor `CHANGE_ME`. Si falta algo, el proceso termina con `INVALID_CONFIGURATION` y no intenta otro servidor. `NODE_ENV=production` se rechaza.

Comprobar sin imprimir contraseñas:

```powershell
npm run verify:config
```

El resumen muestra entorno, puertos, nombres de base y si los dos usuarios coinciden. No muestra secretos.

### Conexión desde el host o desde un contenedor

| Proceso | Dirección de SQL Server |
| --- | --- |
| Node en el host | `127.0.0.1`, puerto `1433` |
| Node dentro de un contenedor futuro, en Docker Desktop | `host.docker.internal`, puerto `1433` |

`localhost` dentro de un contenedor no es el SQL Server del host. Este bootstrap no crea ese contenedor de Node.

### Lectura institucional

`SIDINACC_DB_USER` debe ser `sia_sidinacc_app`. La API lo conecta a `SIDINACC_LOCAL`. No pertenece a roles de servidor. Sus permisos efectivos de servidor son `CONNECT SQL` y `VIEW ANY DATABASE`; el segundo lo hereda de `public` y no concede acceso a `SIA_CENCINAI`. En `SIDINACC_LOCAL` el usuario del mismo nombre es miembro de `sia_sidinacc_reader_role`. Ese rol ya era miembro de `db_datareader` y ya tenía `DENY` de `INSERT`, `UPDATE`, `DELETE` y `ALTER`. No se agregaron denegaciones nuevas.

La contraseña se genera en el entorno y queda solo en `apps/api/.env`, que Git ignora. `SIA_DB_USER` debe ser `sia_cencinai_app`, la cuenta de ejecución del módulo. No es la credencial de despliegue: no pertenece a roles administrativos ni a los roles funcionales de expediente, y hoy solo puede consultar `dbo.schema_migracion`. La credencial de despliegue queda fuera de la API y de la suite cotidiana. Si ambas variables usan el mismo usuario, la API avisa que el aislamiento no está verificado.

`cencinai_reader` sigue sin usuario mapeado y no se reutilizó. El usuario `sia_sidinacc_reader` permanece `WITHOUT LOGIN`; las pruebas de la réplica dependen de ese contrato. No hay usuario `sia_sidinacc_app` en `SIA_CENCINAI`.

## Comandos

Todos desde la raíz.

| Comando | Efecto |
| --- | --- |
| `npm ci` | Instala según el lockfile |
| `npm run dev:api` | API en `http://127.0.0.1:3001` |
| `npm run dev:web` | Web en `http://127.0.0.1:5174` |
| `npm run dev` | Las dos. `Ctrl+C` cierra el árbol de procesos registrado |
| `npm run stop` | Detiene los procesos registrados por `npm run dev` |
| `npm test` | Jest de API y web |
| `npm run lint` | ESLint |
| `npm run build` | Build de producción de la web |
| `npm run verify:config` | Valida `apps/api/.env` |
| `npm run health` | Consulta `/health` y `/ready` de una API que ya está en ejecución |
| `npm run check:runtime` | Arranca API y web, comprueba ambas y las detiene |

Abrir la web en `http://127.0.0.1:5174`. Si se usa `localhost`, el origen no coincide con `CORS_ORIGIN` y el navegador bloquea la llamada. El puerto 5174 evita chocar con otro Vite que ya escuchaba en 5173 en esta máquina. No se detuvo ese proceso.

`/health` en 200 indica que la API escucha. `/ready` en 200 indica que las dos bases respondieron. Un código de salida `2` de `npm run health` significa que la API vive y alguna dependencia no.

## Docker

No cambiar `sidinacc-local-sql` para arrancar la aplicación. Si el contenedor está detenido, iniciarlo por su nombre; no crear otro.

```powershell
docker start sidinacc-local-sql
```

## Pruebas

Las pruebas de HTTP, configuración y clientes SQL no escriben en las bases. La prueba de conectividad solo corre cuando `apps/api/.env` existe y compara dos conteos de lectura antes y después. La prueba de permisos usa solo `sia_sidinacc_app` y `sia_cencinai_app`. Comprueba permisos efectivos y sentencias de escritura con `WHERE 1 = 0`, que el motor rechaza. No crea ni elimina tablas y no usa la credencial de despliegue. No repuebla datos.

## Problemas frecuentes

| Síntoma | Revisión |
| --- | --- |
| `INVALID_CONFIGURATION` | Variable ausente, `CHANGE_ME`, base distinta o `NODE_ENV=production` |
| `/ready` en 503 | Contenedor detenido, puerto, usuario o cifrado. El cuerpo no trae la cadena de conexión |
| La web queda en error de conexión | API detenida, URL distinta o página abierta por `localhost` en vez de `127.0.0.1` |
| Puerto ocupado | `npm run stop` y volver a iniciar. No deja otro listener a propósito |
| `npm run dev` pide `.env` | Falta `apps/api/.env` |

## Infraestructura de agentes

Sigue siendo independiente de la aplicación:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1
```
