---
name: implement-backend
description: Implement authorized backend changes with service-layer authorization and traceability.
---

# implement-backend

## When to use
When a confirmed task requires backend work.

## Inputs
Task, HU/RF/CU, contracts, assigned files and actual tooling.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Confirm Gate 1 and inspect service/data authorization and error contracts.
2. Implement the smallest assigned backend change.
3. Add meaningful criteria, error and denied-access tests when applicable.
4. Run available checks and hand off cross-layer impacts.

## Restrictions
Backend only. Do not alter other layers without an updated task, bypass permissions, use sensitive real data or automate professional decisions.

## Expected output
Backend diff and handoff with criteria, files, tests and permission evidence.

## Exit checks
Applicable Gate 2 evidence recorded; independent QA/review still required.
