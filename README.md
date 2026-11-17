# SIA-CENCINAI

Sistema de apoyo a la Atención Interdisciplinaria de CEN-CINAI.

Esta copia es la **versión de práctica** para la entrega universitaria del 2026-11-17.
No es la versión institucional productiva ni está autorizada para producción.
La sesión de SIDINACC sigue pendiente de validación. En local, el servidor asocia
una identidad sintética a un ámbito. El navegador no elige el rol.

La aplicación de práctica incluye consulta de personas, referencias, el ciclo de
Oficina Local, programación, seguimiento y reportería de Oficina Local, Regional
y Nacional. El detalle vigente está en
[estado de la entrega](docs/architecture/ENTREGA_PRACTICA_ESTADO.md).
El recorrido corto está en
[guía de demostración](docs/architecture/GUIA_DEMOSTRACION.md).

## Empezar en Windows

Requisitos, variables y comandos:
[entorno de desarrollo](docs/architecture/DEVELOPMENT_SETUP.md).

```powershell
npm ci
Copy-Item apps\api\.env.example apps\api\.env
npm run verify:config
npm run dev
```

Completar las contraseñas solo en `apps/api/.env`. Ese archivo no se versiona.
Abrir `http://127.0.0.1:5174`. La API escucha en `http://127.0.0.1:3001`.
Usar `127.0.0.1`, no `localhost`, para que el origen coincida con CORS.

Las bases `SIA_CENCINAI` y `SIDINACC_LOCAL` ya deben existir. El arranque no
migra, no siembra y no vacía datos. `SIDINACC_LOCAL` se consulta en solo lectura.

## Comprobación

```powershell
npm run verify:config
npm run lint
npm test
npm run build
npm run health
```

`npm run health` exige que la API ya esté en ejecución.

## Documentación

- [Guía de demostración](docs/architecture/GUIA_DEMOSTRACION.md)
- [Estado funcional de la práctica](docs/architecture/ENTREGA_PRACTICA_ESTADO.md)
- [Entorno de desarrollo](docs/architecture/DEVELOPMENT_SETUP.md)
- [Arquitectura de software](docs/architecture/SOFTWARE_ARCHITECTURE.md)
- [Autorización](docs/architecture/AUTHORIZATION_MODEL.md)
- [Instrucciones del proyecto](AGENTS.md)
- [Especificación funcional v0.7](docs/functional/FUNCTIONAL_SPEC_v0.7.md)
- [Casos de uso v0.7](docs/functional/USE_CASES_v0.7.md)
- [Stack tecnológico](docs/architecture/TECHNOLOGY_STACK.md)
- [Base SIA_CENCINAI](database/sia-cencinai/README.md)
- [Réplica SIDINACC_LOCAL](database/sidinacc-local/README.md)
- [Diseño de datos vigente](docs/architecture/database-design/current/DATABASE_DESIGN_SELECTED.md)
- [Workflow de agentes](docs/agent-workflow/workflow.md)

## Comprobación de agentes

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1
```

Ese script revisa reglas, agentes y skills. No sustituye las pruebas de la aplicación.
