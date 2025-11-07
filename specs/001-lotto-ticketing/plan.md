# Implementation Plan: Lotto Ticket Issuance & Draw Experience

**Branch**: `001-lotto-ticketing` | **Date**: 2025-11-06 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-lotto-ticketing/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. Consult project automation docs for the latest execution workflow.

## Summary

- Deliver a two-view Lotto web experience: a ticket issuance page supporting manual and assisted number selection and a draw dashboard presenting a real-time ticket board plus roulette-based draw animation.
- Persist all ticket and draw data to Firebase Realtime Database under a single active session node so both views remain synchronized without manual refresh.
- Instrument every critical pathway (issue, list updates, draw start/step/finish, reset, error) with `[Lotto645]` console logs to comply with the transparency principle.

## Technical Context

**Language/Version**: TypeScript 5.x targeting evergreen browsers  
**Primary Dependencies**: React 18, Vite, Firebase Web SDK (modular)  
**Storage**: Firebase Realtime Database  
**Testing**: Vitest for units, Playwright for end-to-end simulation  
**Target Platform**: Chromium, WebKit, and Gecko browsers (desktop + mobile)  
**Project Type**: Single-page web application  
**Performance Goals**: First load bundle <= 1 MB gzipped, interactive < 2s on mid-tier devices  
**Constraints**: Client-only runtime; all persistence and sync via Firebase; no server-side logic without approval  
**Scale/Scope**: Up to 1,000 concurrent simulated users observing synchronized draws

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] Feature scope limited to ticket issuance, ticket listing, and draw/result presentation unless governance waiver attached.
- [x] Plan documents distinct issuance and results view components/routes and how Firebase synchronizes shared data.
- [x] Firebase data model, validation rules, and configuration management steps captured for this work.
- [x] Logging checkpoints enumerated with `[Lotto645]` prefixes covering user flows and async operations.
- [x] Draw algorithm describes randomness source, persisted metadata (seed/timestamp), and audit verification steps.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
frontend/
├── public/
└── src/
    ├── components/
    ├── pages/
    ├── services/
    ├── hooks/
    └── styles/

tests/
└── e2e/
```

**Structure Decision**: Single-page React app served from `frontend/` with end-to-end coverage in `tests/e2e/`; feature plans MUST call out any deviations.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| _Fill if applicable_ |  |  |

## Implementation Strategy

### View Composition
- `IssueTicketPage` renders a 45-button grid, selected-number tray, player name input, Auto Select, and Issue Ticket controls.
- `DrawDashboardPage` contains three regions: live ticket list (virtualized with scrollbar), roulette animation surface, and draw results timeline.
- Navigation managed via client-side router with shared providers for Firebase context and animation timing.

### Data Flow & Session Handling
- Firebase RTDB structure:  
  `/sessions/current/tickets/{ticketId}` → `{ name, numbers[], createdAt }`  
  `/sessions/current/draw` → `{ numbers[], startedAt, completedAt, seed }`
- Issuance writes derive `ticketId` from Firebase push keys to avoid collisions; draw writes update the `draw` node atomically per step.
- Reset action deletes `/sessions/current` and recreates empty nodes, triggered only from the draw dashboard.

### Logging & Telemetry
- Mandatory checkpoints (prefixed `[Lotto645]`):
  - `[issue:start|success|error]` with ticket payload metadata.
  - `[list:subscribe|update|error]` for real-time listeners.
  - `[draw:start|step|complete|error]` including drawn number, step index, and seed reference.
  - `[reset:start|success|error]` capturing counts removed.
- Errors bubble stack traces in console while user-facing toasts provide friendly guidance.

### Randomness & Auditability
- Use `crypto.getRandomValues` for auto-selection and draw routines to ensure unbiased distribution.
- Seed recorded as ISO timestamp + random salt stored in draw metadata for replay during QA.
- Draw loop enforces uniqueness via in-memory set; duplicates trigger immediate reroll with logged notice.

### Animation & UX Considerations
- Roulette wheel implemented with CSS/SVG animation advancing every five seconds aligned with draw cadence.
- Highlighting uses dedicated color tokens defined in theme and applied simultaneously to draw list chips and ticket numbers.
- Accessibility: keyboard selection in issuance grid, aria-live updates for draw results.

### Testing Strategy
- Unit tests (Vitest) for selection reducers, RNG utilities, Firebase service wrappers, and logging helpers.
- Component tests verifying grid selection limits, auto-select behavior, and reset confirmation flow.
- Playwright journeys covering ticket issuance (manual + auto), draw execution with multi-browser sync, and reset.
- Manual QA checklist ensures console log coverage and animation timing tolerance.

### Configuration & Environment
- Firebase API keys stored in `.env.local`; template `.env.example` issued with placeholder values.
- Firebase security rules documented to restrict writes to `/sessions/current` namespace.
- CI pipeline ensures lint/test job gating before deployment bundling.

### Risks & Mitigations
- **Realtime desync**: Mitigated via Firebase listeners with retry/backoff and visual stale-state indicator.
- **Animation performance on low-end devices**: Provide reduced-motion fallback, test on throttled conditions.
- **Accidental multi-session overlap**: Hard-code single session key and log warning if more than one active session detected.
- **Network failures during draw**: Implement state machine that pauses on failure, surfaces toast, and allows resume after connectivity restored.

### Milestones
1. **Foundation**: Firebase configuration, logging utilities, RNG helpers.
2. **Issuance MVP**: Manual selection, auto-complete, Firebase persistence, console logs.
3. **Draw Dashboard**: Real-time ticket board, roulette animation, draw logic with logging.
4. **Reset + Polish**: Session reset workflow, accessibility tuning, performance checks, release notes.
