---
name: plan-feature
description: Route legacy plan-feature requests to plan-implementation.
---

# plan-feature

## When to use
When existing references invoke plan-feature.

## Inputs
Requirement and task sources.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Read .agents/skills/plan-implementation/SKILL.md.
2. Execute its procedure and return its handoff.

## Restrictions
Preserve canonical scope and source constraints.

## Expected output
Canonical implementation plan and handoff.

## Exit checks
Canonical exit checks evaluated; missing evidence visible.
