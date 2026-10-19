# Legacy skill location

Active procedure: `.agents/skills/workflow/refine-requirement/SKILL.md`. This ordinary reference is not a discoverable skill; use the canonical procedure to avoid duplicate skill names.

## Preserved previous content (historical, non-authoritative)

﻿---
name: refine-requirement
description: Refine a SIA-CENCINAI requirement, user story, use case or institutional need before technical design or implementation. Use when requirements are new, ambiguous, changed or require validation.
---

# Refine Requirement

Refine functional behavior before technical implementation.

## Objective

Transform an institutional need, HU, RF, use case, validation comment or process change into a clear and traceable functional definition.

## Agent involvement

Delegate the functional analysis to:

A-01 — Requirements & Traceability Agent

The Orchestrator remains responsible for coordinating the result.

## Inputs

Use the most authoritative available sources:

1. confirmed functional requirements;
2. validated process flow;
3. current annexes;
4. institutional instruments;
5. validation records;
6. technical decisions;
7. existing code or prototype only as secondary evidence.

## Process

### Step 1 — Identify the request

Determine:

- What behavior is being requested?
- Who performs it?
- In what institutional scope?
- What triggers it?
- What result is expected?

### Step 2 — Locate traceability

Identify when available:

- HU
- RF
- RNF
- RN
- Caso de Uso
- Institutional source
- Validation decision

### Step 3 — Determine certainty

Classify each relevant behavior as:

- CONFIRMED
- DRAFT
- PROPOSED
- NEEDS_VALIDATION

Never promote a proposal to CONFIRMED without evidence.

### Step 4 — Check consistency

Look for contradictions involving:

- roles;
- permissions;
- required fields;
- sequence;
- statuses;
- transitions;
- institutional responsibility;
- scope;
- terminology.

### Step 5 — Define acceptance behavior

Describe:

- preconditions;
- main behavior;
- validations;
- relevant alternatives;
- expected result;
- permission constraints.

Do not invent edge-case business rules not supported by sources.

### Step 6 — Identify unresolved items

Use:

`NEEDS_VALIDATION`

for institutional uncertainty.

Use:

`OUT_OF_SCOPE`

for useful work that does not belong to the current requirement.

## Output

Return:

### Objective

### Actors and scope

### Sources reviewed

### Traceability
HU:
RF:
RNF:
RN:
CU:

### Confirmed behavior

### Acceptance criteria

### Alternative / error behavior

### Permissions

### Data involved

### NEEDS_VALIDATION

### OUT_OF_SCOPE

### Ready for technical planning?
YES / NO

Do not implement code.
