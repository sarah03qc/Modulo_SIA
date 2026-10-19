---
name: plan-implementation
description: Plan a bounded technical change from confirmed HU, RF and CU.
---

# plan-implementation

## When to use
Before implementation planning.

## Inputs
Confirmed HU/RF/CU, acceptance criteria, sources and related code.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Evaluate Gate 1.
2. With Architecture, inspect contracts, dependencies, risks and reversible alternatives.
3. Assign one concrete technical objective and explicit file ownership per necessary agent.
4. Map criteria to planned files and tests; order dependencies.

## Restrictions
Do not implement code or invent institutional rules; conflicts block affected behavior.

## Expected output
Technical plan, tasks, dependencies, risks and traceability.

## Exit checks
Gate 1 evidenced; critical unresolved behavior excluded from implementation.
