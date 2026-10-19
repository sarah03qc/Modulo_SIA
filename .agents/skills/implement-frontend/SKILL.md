---
name: implement-frontend
description: Implement authorized UI changes using source-backed design and accessibility requirements.
---

# implement-frontend

## When to use
When confirmed behavior requires frontend work.

## Inputs
Task, HU/RF/CU, contracts, design sources and actual frontend tooling.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Confirm Gate 1 and design sources.
2. Inspect reusable components/tokens and preserve contracts.
3. Implement specified interaction, loading, empty and error states.
4. Check keyboard, focus, semantics and available tests; hand off API issues.

## Restrictions
Frontend only; do not patch backend behavior from UI. Hidden controls do not enforce authorization. Missing branding details remain NEEDS_VALIDATION.

## Expected output
UI diff and handoff with criteria, source-backed decisions and checks.

## Exit checks
Applicable Gate 2 evidence present; no unsupported accessibility compliance claim.
