---
name: implement-feature
description: Route legacy feature tasks to necessary layer-specific procedures.
---

# implement-feature

## When to use
When existing references invoke implement-feature.

## Inputs
Confirmed task, plan and layer ownership.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Confirm readiness through plan-implementation.
2. Select only relevant .agents/skills/implement-backend/SKILL.md, implement-frontend/SKILL.md or evolve-data-model/SKILL.md.
3. Assign needed integration work to A-06 with a common task.
4. Collect handoffs and run-quality-gates.

## Restrictions
Do not execute irrelevant layers or assign unbounded ownership. No product implementation during bootstrap.

## Expected output
Layer handoffs and gate report.

## Exit checks
Canonical checks evaluated; independent QA/review and human acceptance visible.
