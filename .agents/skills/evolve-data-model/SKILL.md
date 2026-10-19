---
name: evolve-data-model
description: Control authorized schema and migration changes with integrity and reversibility.
---

# evolve-data-model

## When to use
When a confirmed task affects persistence.

## Inputs
HU/RF/CU, dictionary, schema, consumers and migration tooling.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Confirm Gate 1; inspect constraints and consumers.
2. Preserve NULL, PENDING, NOT_APPLICABLE, UNKNOWN and relevant history.
3. Design compatibility, ordering and rollback/recovery evidence.
4. Verify integrity with synthetic data in an authorized nonproduction environment.

## Restrictions
Never infer institutional rules from tables or assume SQL Server configured. Destructive migrations, DROP/TRUNCATE, production changes and historical overwrites need explicit human authorization before execution.

## Expected output
Data diff or migration plan with integrity and compatibility evidence.

## Exit checks
Applicable data gates evidenced; destructive actions unexecuted without approval; uncertain semantics NEEDS_VALIDATION.
