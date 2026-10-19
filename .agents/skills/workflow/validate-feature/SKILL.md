---
name: validate-feature
description: Route legacy validation to traceability verification and quality gates.
---

# validate-feature

## When to use
When existing references invoke validate-feature.

## Inputs
Task, diff, handoffs and test evidence.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Execute .agents/skills/verify-traceability/SKILL.md.
2. Execute .agents/skills/run-quality-gates/SKILL.md.
3. Include review-accessibility for applicable UI scope.

## Restrictions
Do not mark absent evidence as passed or substitute for human review.

## Expected output
Traceability findings and gate report.

## Exit checks
Canonical checks evaluated; outstanding findings explicit.
