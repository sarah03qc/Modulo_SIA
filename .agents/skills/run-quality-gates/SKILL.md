---
name: run-quality-gates
description: Evaluate three project gates using actual tooling and independent review evidence.
---

# run-quality-gates

## When to use
At readiness for development, implementation completion or human review.

## Inputs
Task, handoffs, diff, traceability, tooling and reviews.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Read docs/agent-workflow/quality-gates.md and select applicable checks.
2. From repository root run powershell -NoProfile -ExecutionPolicy Bypass -File scripts/validate-agent-infrastructure.ps1 for infrastructure validation.
3. Discover actual project tooling before build/lint/tests; do not invent commands or treat missing tooling as passing.
4. Collect QA, security when applicable, independent code review and documentation evidence.
5. Return per-gate verdicts with failures and justified nonapplicability.

## Restrictions
Do not modify implementation to force passing tests or declare human acceptance. Missing evidence remains pending; institutional uncertainty NEEDS_VALIDATION. No destructive/production checks without approval.

## Expected output
Gate report with commands, outcomes, applicability, blockers and handoff.

## Exit checks
Applicable checks evidenced; infrastructure validation separate from product tests; human acceptance explicit.

