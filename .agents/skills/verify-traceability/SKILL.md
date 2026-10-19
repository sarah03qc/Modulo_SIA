---
name: verify-traceability
description: Audit HU → RF → CU → code → tests and identify unsupported or missing links.
---

# verify-traceability

## When to use
Before planning, independent review or human review.

## Inputs
Functional sources, task/handoff, diff and tests.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Locate HU/RF and applicable CU in authoritative sources.
2. Map criteria and explicit RN to files and meaningful tests.
3. Check for unsupported changes and missing implementation/tests.
4. Report gaps and conflicts with references.

## Restrictions
Read-only unless documentation changes assigned. Do not manufacture IDs; justify NOT_APPLICABLE.

## Expected output
Traceability findings, evidence, gaps and gate verdicts.

## Exit checks
Minimum chain reconstructible or gaps explicit; no invented references.
