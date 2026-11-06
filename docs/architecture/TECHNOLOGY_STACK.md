# Stack tecnológico de SIA-CENCINAI

**Estado:** decisión del equipo de proyecto para el desarrollo. No es una aprobación formal de UTIC.

Este archivo faltaba aunque `.cursor/rules/06-approved-technology-stack.mdc` lo cita como fuente principal. Registra el stack ya seleccionado en esa regla y en el encargo de bootstrap del 2026-11-06. `TECHNOLOGY_STACK_PROPOSAL.md` conserva la solicitud previa dirigida a la institución; no sustituye esta decisión ni acredita una respuesta de UTIC.

| Componente | Tecnología |
| --- | --- |
| Frontend web | React con JavaScript |
| Backend | Node.js con Express y JavaScript |
| Base de datos propia | Microsoft SQL Server (`SIA_CENCINAI`) |
| Fuente institucional simulada | Microsoft SQL Server (`SIDINACC_LOCAL`), acceso previsto de solo lectura |
| Contenedores | Docker, limitado al SQL Server local ya existente |
| Pruebas JavaScript | Jest |
| Control de versiones | Git y GitHub |
| IDE documentado | Visual Studio Code; Cursor puede usarse como entorno de desarrollo |
| Autenticación | Integración futura con la sesión institucional de SIDINACC |

El mecanismo exacto de esa sesión sigue `NEEDS_VALIDATION`. No se implementa un inicio de sesión propio.

Versiones de ejecución y dependencias auxiliares: `DEPENDENCY_DECISIONS.md`. Arquitectura de aplicación: `SOFTWARE_ARCHITECTURE.md`.
