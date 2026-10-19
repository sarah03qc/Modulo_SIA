# SIA-CENCINAI

Repositorio de la nueva implementación de apoyo a Atención Interdisciplinaria.
Estado actual: infraestructura de agentes y workflow; no existe producto ejecutable.

Leer [AGENTS.md](AGENTS.md), el [workflow](docs/agent-workflow/workflow.md),
los [quality gates](docs/agent-workflow/quality-gates.md) y las
[fuentes pendientes](docs/agent-workflow/sources-and-validation.md).
Para delegar usar las plantillas [TASK](docs/agent-workflow/templates/task.md)
y [HANDOFF](docs/agent-workflow/templates/handoff.md).

Comprobación local sin dependencias adicionales:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1
```

El resultado comprueba estructura y metadatos; no certifica funcionalidad,
seguridad completa ni descubrimiento real en Cursor. Las fuentes institucionales
y funcionales deben incorporarse antes de iniciar historias de producto.

Inventario, árbol y resultados: [informe de bootstrap](docs/agent-workflow/bootstrap-report.md).

