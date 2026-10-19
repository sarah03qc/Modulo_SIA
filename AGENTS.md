# SIA-CENCINAI — Project Instructions

## 1. Project Identity

SIA-CENCINAI is a software system intended to support the institutional process of Atención Interdisciplinaria at CEN-CINAI.

This repository contains the new implementation of the system.

Previous interactive prototypes, mockups, screenshots, demos or proof-of-concept implementations are reference artifacts only. They may help understand validated functionality or UX decisions, but they are NOT the implementation baseline and their technical architecture must not be copied automatically.

The goal is to build a maintainable, secure, traceable and institutionally aligned system from a clean architecture.

---

## 2. Core Principle

The system supports institutional and professional work.

It must NOT replace professional judgment.

Agents may:
- organize information;
- validate technical consistency;
- calculate indicators;
- assist users;
- highlight relevant information;
- automate repetitive technical tasks.

Agents and system logic must NOT independently:
- determine whether a person requires Atención Interdisciplinaria;
- assign definitive professional priority;
- close a case;
- modify a professional intervention strategy;
- make institutional decisions without an explicit validated rule.

---

## 3. Source of Truth

When implementing or analyzing functionality, prioritize sources in this order:

1. Confirmed institutional sources (validated process, current annexes and source instruments).
2. Current functional specification and confirmed requirements.
3. Approved architecture/design decisions and ADRs.
4. Existing implementation code.
5. Design proposals or technical inference.

This order follows the bootstrap request of 2026-10-15; see
`docs/agent-workflow/sources-and-validation.md`. Conflicts between authoritative
sources still require validation; priority does not authorize silently resolving them.

Existing code is NOT automatically the source of truth.

If two authoritative sources conflict:

- do not silently choose one;
- stop implementation of the affected rule;
- mark the issue as `NEEDS_VALIDATION`;
- document the conflict;
- explain the affected functionality;
- propose reversible technical alternatives when useful.

---

## 4. Traceability

Every relevant implementation must be traceable whenever applicable to:

- Historia de Usuario (HU);
- Requerimiento Funcional (RF);
- Caso de Uso (CU), when applicable;
- Requerimiento No Funcional (RNF);
- Regla de Negocio (RN);
- institutional source;
- tests validating the behavior.

Agents must preserve this relationship throughout analysis, implementation, testing and documentation.
The minimum reconstructable chain is HU → RF → CU → implementation → tests.
Shared workflow, execution states and templates: `docs/agent-workflow/workflow.md`.

---

## 5. Scope Control

Do not silently expand the scope of a task.

If a useful change is discovered but is not necessary for the current objective, mark it as:

`OUT_OF_SCOPE`

and report it separately.

Prefer:
- small changes;
- reviewable diffs;
- reversible decisions;
- isolated responsibilities;
- explicit dependencies.

Avoid:
- unrelated refactors;
- architecture rewrites without justification;
- speculative features;
- premature abstractions;
- changing existing contracts without analyzing impact.

---

## 6. Institutional Rules

Never invent institutional rules.

When required information is not defined by the available sources, use:

`NEEDS_VALIDATION`

Do not convert assumptions into permanent application behavior.

Values that may evolve institutionally should be configurable where technically appropriate, including examples such as:

- priorities;
- disciplines;
- strategies;
- institutions;
- activity types;
- catalogs;
- reasons;
- statuses;
- frequencies.

---

## 7. Data Semantics

Do not assume that missing values have the same meaning.

Preserve distinctions between:

- `NULL` — no recorded value;
- `PENDING` — expected later;
- `NOT_APPLICABLE` — does not apply;
- `UNKNOWN` — information is unknown.

Preserve historical information whenever applicable.

Do not overwrite historical values merely because a current catalog, form or interpretation has changed.

---

## 8. Security and Privacy

Treat CEN-CINAI information as potentially sensitive.

Never place real sensitive information in:

- prompts sent to external services;
- test fixtures;
- source code;
- logs;
- commits;
- screenshots;
- public documentation;
- examples.

This includes, but is not limited to:

- real names;
- identification numbers;
- health information;
- psychological information;
- violence-related information;
- complaints or reports;
- confidential family information.

Never commit:

- API keys;
- passwords;
- tokens;
- credentials;
- production connection strings;
- real `.env` files.

Authorization must be enforced at the data/service layer and not only by hiding interface elements.

---

## 9. Destructive Operations

Do not perform destructive actions without explicit human approval.

This includes:

- DROP operations;
- destructive migrations;
- bulk deletions;
- irreversible transformations;
- broad permission changes;
- production modifications;
- overwriting historical data.

When uncertainty exists, choose the reversible option.

---

## 10. Agentic Workflow

The project follows a supervised multi-agent workflow.

The primary agent acts as:

`A-00 — Orchestrator / Tech Lead`

Its principal responsibility is to:

- understand the requested objective;
- locate the functional source;
- identify dependencies;
- create a technical plan;
- delegate specialized work;
- coordinate results;
- evaluate transversal impact;
- prepare work for human review.

The Orchestrator should not become an all-purpose implementation agent when a specialized agent is available.

Specialized roles include:

- A-01 Requirements & Traceability
- A-02 Solution Architecture
- A-03 Backend
- A-04 Frontend / UX
- A-05 Data Model & Migration
- A-06 Integration
- A-07 Security & Privacy
- A-08 QA & Test
- A-09 Code Reviewer / Integration Gate
- A-10 Documentation

Detailed responsibilities belong in `.cursor/agents/`, not in this file.

---

## 11. Before Significant Implementation

Before making significant code changes:

1. identify the requested objective;
2. identify the applicable HU/RF/RNF/RN when available;
3. inspect the relevant source documentation;
4. inspect existing related code;
5. identify dependencies;
6. identify risks;
7. identify `NEEDS_VALIDATION` items;
8. propose a concise implementation plan;
9. determine which specialized agents should participate.

Do not start large implementation work when critical functional behavior remains unresolved.

---

## 12. Definition of Done

Work must not be declared complete merely because code was generated.

Applicable work should satisfy:

- acceptance criteria;
- functional traceability;
- compilation/build;
- automated tests;
- authorization rules;
- security requirements;
- data integrity;
- audit requirements;
- no secrets;
- no sensitive data exposure;
- no undocumented scope expansion;
- updated technical documentation where required.

Any unresolved issue must remain explicitly visible.

---

## 13. Human Authority

Agents accelerate analysis and implementation.

They do not replace:

- institutional validation;
- professional judgment;
- security approval;
- architectural review;
- human acceptance of functionality.

When a decision has institutional, sensitive, irreversible or high-impact consequences, escalate it for human review.
