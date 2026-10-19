---
name: create-adr
description: Document an architectural decision with evidence and reversible alternatives.
---

# create-adr

## When to use
When a cross-cutting technical decision needs an ADR.

## Inputs
Task, sources, HU/RF/CU when applicable, alternatives and existing conventions.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Inspect ADR conventions and sources.
2. Compare options, contract/data/security impact and reversibility.
3. Draft context, status, alternatives, rationale, consequences and traceability.
4. Route approval to the accountable human and distinguish proposed from approved.

## Restrictions
Do not invent approvals or institutional rules; an ADR cannot override confirmed behavior.

## Expected output
ADR draft or authorized documentation change and handoff.

## Exit checks
Status and evidence explicit; conflicts NEEDS_VALIDATION; no product implementation.
