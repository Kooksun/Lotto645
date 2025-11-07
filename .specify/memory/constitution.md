<!--
Sync Impact Report
- Version change: 0.0.0 -> 1.0.0
- Modified principles:
  - Template Principle 1 -> I. Simplicity-First Delivery
  - Template Principle 2 -> II. Dual-View Separation
  - Template Principle 3 -> III. Firebase Realtime Source of Truth
  - Template Principle 4 -> IV. Transparent Simulation Logging
  - Template Principle 5 -> V. Fair Draw & Auditability
- Added sections: Platform Constraints & Stack; Delivery Workflow & Quality Gates
- Removed sections: None
- Templates requiring updates:
  - ✅ .specify/templates/plan-template.md
  - ✅ .specify/templates/spec-template.md
  - ✅ .specify/templates/tasks-template.md
- Follow-up TODOs: None
-->

# Lotto645 Web App Constitution

## Core Principles

### I. Simplicity-First Delivery
Rules:
- Implementation MUST cover only the ticket issuance page, the issued-ticket listing, and the draw/result display defined in approved specifications.
- UX flows MUST minimize user steps and avoid introducing unapproved auxiliary features, background jobs, or administrative screens.
- Feature work MUST include acceptance criteria demonstrating that added behaviors do not expand scope beyond the two core views.

Rationale: Concentrating on the essential flow prevents scope drift and keeps the lottery simulation approachable for users and maintainers.

### II. Dual-View Separation
Rules:
- The ticket issuance page and the draw/results page MUST exist as distinct routes or components with isolated UI state.
- Shared data between views MUST flow through Firebase subscriptions or fetches; direct cross-view mutations in local memory are prohibited.
- Navigation logic MUST trigger Firebase refreshes to guarantee the latest tickets and draw outcomes are shown to users.

Rationale: Maintaining a clean separation of concerns keeps complexities contained and eliminates stale or hidden coupling between experiences.

### III. Firebase Realtime Source of Truth
Rules:
- Ticket creation, updates, and draw records MUST persist to Firebase Realtime Database before those events are confirmed to users.
- Firebase data paths, validation rules, and security rules MUST be version-controlled or documented alongside feature deliveries.
- Local caches MUST treat Firebase as authoritative; offline fallbacks require explicit governance approval before implementation.

Rationale: Using a single, audited data source preserves integrity for draws and simplifies synchronizing ticket states across sessions.

### IV. Transparent Simulation Logging
Rules:
- Each user action and asynchronous workflow MUST emit console logging with a `[Lotto645]` prefix, a stage identifier, and related ticket or draw identifiers.
- Error states MUST log context and stack information before being surfaced to the UI or retry handlers.
- Feature specifications MUST enumerate the logging checkpoints that the implementation will produce prior to coding.

Rationale: Rich console telemetry provides traceability for debugging, QA sign-off, and user support without external monitoring systems.

### V. Fair Draw & Auditability
Rules:
- Draw routines MUST use a reproducible, unbiased random number source (e.g., `crypto.getRandomValues`) and capture the seed or timestamp used for the run.
- Winning numbers and associated ticket identifiers MUST be saved to Firebase alongside draw metadata to enable replay and auditing.
- Manual adjustments to draw outcomes are prohibited unless an approved incident runbook documents the justification and remediation steps.

Rationale: Enforcing transparent draw mechanics ensures player trust and protects the project from accusations of manipulation.

## Platform Constraints & Stack

- The frontend MUST be implemented as a lightweight web application using modern JavaScript or TypeScript; introducing additional backend services requires governance approval.
- Firebase Web SDK (modular) MUST be the sole integration point for persistence, with credentials stored in environment configuration excluded from source control.
- Build tooling MUST support local development with hot reload and produce deployment bundles under 1 MB (gzipped) to keep the experience responsive.

## Delivery Workflow & Quality Gates

- Implementation plans MUST describe how each principle is satisfied, including view separation, Firebase data paths, and logging checkpoints.
- Code reviews MUST verify console logging coverage, Firebase interactions, and persisted audit trails before approval.
- Releases MUST include a dry-run simulation demonstrating ticket issuance, listing, draw execution, and captured console logs in QA notes.

## Governance

- This constitution supersedes other workflow guidance for Lotto645; any conflicts must be resolved in favor of these principles.
- Amendments require a documented rationale, updates to dependent templates, and maintainer approval before merging.
- Versioning follows semantic rules: MAJOR for principle removals or replacements, MINOR for new principles or governance sections, PATCH for clarifications.
- Compliance reviews occur at feature planning and pre-release checkpoints; non-compliant work MUST be remediated before release.

**Version**: 1.0.0 | **Ratified**: 2025-11-06 | **Last Amended**: 2025-11-06
