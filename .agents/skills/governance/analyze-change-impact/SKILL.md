---
name: analyze-change-impact
description: Assess change impact across requirements, contracts, data, permissions and tests.
---

# analyze-change-impact

## When to use
When requirements, functional sources or contracts change.

## Inputs
Change request, sources, HU/RF/CU and affected artifacts.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Compare request with authoritative sources.
2. Trace affected modules, contracts, history, permissions and tests.
3. Identify owners, dependency order, risks and reversible options.
4. Mark conflicts NEEDS_VALIDATION and unrelated improvements OUT_OF_SCOPE.

## Restrictions
Read-only unless documentation changes assigned; do not expand scope or resolve institutional conflicts by assumption.

## Expected output
Impact assessment and handoff to plan-implementation.

## Exit checks
Affected layers, evidence and validation owners explicit.
