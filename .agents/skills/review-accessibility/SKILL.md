---
name: review-accessibility
description: Review source-backed UI accessibility and institutional design requirements.
---

# review-accessibility

## When to use
When UI changes or accessibility review requested.

## Inputs
UI scope, design sources, accessibility requirements and executable UI if available.

## Shared references
Read `docs/agent-workflow/workflow.md`, `docs/agent-workflow/sources-and-validation.md` and `docs/agent-workflow/quality-gates.md`. Use `docs/agent-workflow/templates/task.md` and `docs/agent-workflow/templates/handoff.md` for assignments and results.

## Steps
1. Locate authority; distinguish confirmed requirements from proposed checks.
2. Review applicable keyboard navigation, visible focus, semantics, labels, contrast, color-independent meaning, zoom and responsive behavior.
3. Check ARIA where needed and WCAG 2.2 AA criteria when applicability established.
4. Record reproducible evidence and unexecuted checks.

## Restrictions
Do not invent palette, logo usage, tokens or policy. Missing sources NEEDS_VALIDATION; automated tests alone do not prove WCAG conformance.

## Expected output
Design/accessibility findings with sources and manual/automated evidence.

## Exit checks
Criteria and findings traceable; untested behavior visible; no blanket compliance assertion.
