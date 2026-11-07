# SIA-CENCINAI

Sistema de apoyo a la Atención Interdisciplinaria de CEN-CINAI.

El repositorio contiene la especificación funcional, la arquitectura de datos implementada en SQL Server y dos aplicaciones ejecutables: la API Express en `apps/api` y la aplicación React en `apps/web`. Las historias de usuario todavía no están implementadas. La pantalla inicial solo comprueba que la infraestructura de desarrollo arranca.

## Empezar

Requisitos, variables, comandos y SQL Server: [entorno de desarrollo](docs/architecture/DEVELOPMENT_SETUP.md).

```powershell
npm ci
npm run dev
npm test
```

La API escucha en `http://127.0.0.1:3001` y la web en `http://127.0.0.1:5174`. Hacen falta `apps/api/.env`, creado fuera de Git a partir de `apps/api/.env.example`, y el contenedor existente `sidinacc-local-sql`.

## Documentación

- [Instrucciones del proyecto](AGENTS.md)
- [Especificación funcional v0.7](docs/functional/FUNCTIONAL_SPEC_v0.7.md)
- [Casos de uso v0.7](docs/functional/USE_CASES_v0.7.md)
- [Arquitectura de software](docs/architecture/SOFTWARE_ARCHITECTURE.md)
- [API de consulta contextual](docs/architecture/INSTITUTIONAL_PERSON_API.md)
- [Resultado del lote backend 01](docs/architecture/BACKEND_BATCH_01_RESULTS.md)
- [Stack tecnológico](docs/architecture/TECHNOLOGY_STACK.md)
- [Dependencias](docs/architecture/DEPENDENCY_DECISIONS.md)
- [Diseño de datos vigente](docs/architecture/database-design/current/DATABASE_DESIGN_SELECTED.md)
- [Réplica SIDINACC_LOCAL](database/sidinacc-local/README.md)
- [Base SIA_CENCINAI](database/sia-cencinai/README.md)
- [Workflow de agentes](docs/agent-workflow/workflow.md)
- [Quality gates](docs/agent-workflow/quality-gates.md)
- [Fuentes y validación](docs/agent-workflow/sources-and-validation.md)

## Comprobación de agentes

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1
```

Ese script revisa reglas, agentes y skills. No sustituye las pruebas de la aplicación.
