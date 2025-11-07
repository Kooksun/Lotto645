---

description: "Task list for Lotto Ticket Issuance & Draw Experience"
---

# Tasks: Lotto Ticket Issuance & Draw Experience

**Input**: Design documents from `/specs/001-lotto-ticketing/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: End-to-end and unit tests are explicitly called for in the implementation plan. Include them where noted and ensure they precede related feature work.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend source: `frontend/src/`
- Shared services: `frontend/src/services/`
- Pages: `frontend/src/pages/`
- Components: `frontend/src/components/`
- Hooks: `frontend/src/hooks/`
- Styles: `frontend/src/styles/`
- Playwright tests: `tests/e2e/`
- Vitest suites: `frontend/src/**/__tests__/`
- Documentation: `docs/`, `specs/001-lotto-ticketing/`

<!--
  ============================================================================
  Tasks below are generated for this feature. Do NOT treat them as samples.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and baseline tooling

- [X] T001 Bootstrap Vite + React + TypeScript project in `frontend/` with routing scaffold (`pnpm create vite`)
- [X] T002 Install Firebase, React Router, Vitest, Playwright, ESLint, Prettier dependencies in `package.json`
- [X] T003 Configure project scripts for `pnpm dev`, `pnpm lint`, `pnpm test`, and `pnpm test:e2e` in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Draft Firebase schema and security guidance in `docs/firebase.md` per data-model
- [X] T005 Create `.env.example` with Firebase keys, `VITE_LOTTO_SESSION_KEY`, and host secret placeholders
- [X] T006 [P] Implement Firebase client wrapper in `frontend/src/services/firebaseClient.ts`
- [X] T007 [P] Build Lotto logger utility enforcing `[Lotto645]` prefixes in `frontend/src/services/logger.ts`
- [X] T008 [P] Implement draw randomness helper using `crypto.getRandomValues` in `frontend/src/services/drawRng.ts`
- [X] T009 [P] Create session context provider for tickets/draw data in `frontend/src/context/SessionProvider.tsx`
- [X] T010 [P] Add realtime listener helpers for tickets and draw nodes in `frontend/src/services/realtimeListeners.ts`
- [X] T011 Configure global styling tokens and reduced-motion support in `frontend/src/styles/theme.css`

**Checkpoint**: Foundation ready – user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Issue a Lotto Ticket (Priority: P1) 🎯 MVP

**Goal**: Players select Lotto645 numbers (manual or auto) and issue a ticket stored in Firebase with confirmation.

**Independent Test**: QA issues a ticket from `/issue`, sees `[Lotto645][issue:*]` logs, and confirms the ticket persists in Firebase without opening the draw dashboard.

### Tests for User Story 1 ⚠️

- [X] T012 [P] [US1] Author Vitest suite for selection logic in `frontend/src/hooks/__tests__/useNumberSelection.test.ts`
- [X] T013 [P] [US1] Create Playwright journey `tests/e2e/issue-ticket.spec.ts` covering manual and auto selection

### Implementation for User Story 1

- [X] T014 [P] [US1] Implement number selection hook with six-slot cap in `frontend/src/hooks/useNumberSelection.ts`
- [X] T015 [P] [US1] Build number grid component with toggle visuals in `frontend/src/components/issue/NumberGrid.tsx`
- [X] T016 [P] [US1] Create selection summary tray component in `frontend/src/components/issue/SelectionSummary.tsx`
- [X] T017 [US1] Implement auto-select helper integrating RNG in `frontend/src/hooks/useAutoSelect.ts`
- [X] T018 [US1] Implement ticket service write + logging in `frontend/src/services/ticketService.ts`
- [X] T019 [US1] Compose `IssueTicketPage` with validation and disabled state in `frontend/src/pages/IssueTicketPage.tsx`
- [X] T020 [US1] Add scoped styles and responsive layout in `frontend/src/styles/issue-ticket.css`

**Checkpoint**: User Story 1 fully functional and testable independently

---

## Phase 4: User Story 2 - Monitor Ticket Board (Priority: P2)

**Goal**: Hosts monitor a live ticket board with scrolling support and structured display.

**Independent Test**: QA opens `/draw` in a second browser, issues tickets elsewhere, and observes near real-time updates with readable layout and `[list:*]` logs.

### Tests for User Story 2 ⚠️

- [X] T021 [P] [US2] Add Vitest suite for ticket subscription diffing in `frontend/src/services/__tests__/ticketSubscription.test.ts`
- [X] T022 [P] [US2] Extend Playwright suite `tests/e2e/ticket-board.spec.ts` to verify realtime updates and scrollbar

### Implementation for User Story 2

- [X] T023 [P] [US2] Implement ticket subscription service using Firebase listeners in `frontend/src/services/ticketSubscription.ts`
- [X] T024 [P] [US2] Build virtualized ticket list component in `frontend/src/components/draw/TicketList.tsx`
- [X] T025 [P] [US2] Add ticket list item component with number badges in `frontend/src/components/draw/TicketListItem.tsx`
- [X] T026 [US2] Integrate ticket board into draw dashboard shell in `frontend/src/pages/DrawDashboardPage.tsx`
- [X] T027 [US2] Style board container with scrollbar affordances in `frontend/src/styles/draw-dashboard.css`

**Checkpoint**: User Stories 1 and 2 both independently testable

---

## Phase 5: User Story 3 - Conduct Lotto Draw (Priority: P3)

**Goal**: Hosts run roulette-based draws every five seconds, highlight matching ticket numbers, and reset the session when finished.

**Independent Test**: QA triggers the draw, observes six non-duplicate numbers with animation, sees ticket highlights, and executes reset clearing data and logs.

### Tests for User Story 3 ⚠️

- [X] T028 [P] [US3] Create Vitest suite for draw state machine in `frontend/src/hooks/__tests__/useDrawController.test.ts`
- [X] T029 [P] [US3] Expand Playwright coverage `tests/e2e/draw-flow.spec.ts` for roulette animation, highlighting, and reset

### Implementation for User Story 3

- [X] T030 [P] [US3] Implement draw controller hook with five-second cadence in `frontend/src/hooks/useDrawController.ts`
- [X] T031 [P] [US3] Build roulette wheel SVG animation in `frontend/src/components/draw/RouletteWheel.tsx`
- [X] T032 [P] [US3] Implement draw service transactions + logging in `frontend/src/services/drawService.ts`
- [X] T033 [P] [US3] Add ticket highlight synchronizer updating matched numbers in `frontend/src/services/matchHighlighter.ts`
- [X] T034 [US3] Implement reset service with session wipe + logging in `frontend/src/services/resetService.ts`
- [X] T035 [US3] Wire draw controls, timeline, and reset flow into `frontend/src/pages/DrawDashboardPage.tsx`
- [X] T036 [US3] Provide draw result styles and reduced-motion fallback in `frontend/src/styles/draw-results.css`

**Checkpoint**: All user stories independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Hardening tasks that affect multiple stories

- [ ] T037 [P] Document console logging checkpoints and QA checklist in `docs/logging.md`
- [ ] T038 [P] Add accessibility pass (ARIA labels, keyboard focus) in `frontend/src/pages/IssueTicketPage.tsx` and `frontend/src/pages/DrawDashboardPage.tsx`
- [ ] T039 [P] Tune performance toggles for reduced-motion mode in `frontend/src/components/draw/RouletteWheel.tsx`
- [ ] T040 [P] Update quickstart instructions with validation steps in `specs/001-lotto-ticketing/quickstart.md`
- [ ] T041 Capture release notes with dry-run screenshots in `docs/release-notes/001-lotto-ticketing.md`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Must complete before Firebase configuration or code generation starts.
- **Foundational (Phase 2)**: Depends on Setup; blocks all user story phases until Firebase client, logging, RNG, and session context are available.
- **User Story 1 (Phase 3)**: Starts after Foundational; delivers MVP issuance flow.
- **User Story 2 (Phase 4)**: May begin once Foundational is done but relies on tickets created by US1 for verification.
- **User Story 3 (Phase 5)**: Requires Foundational completion and benefits from US1/US2 outputs to exercise draw logic.
- **Polish (Final Phase)**: Runs after targeted user stories reach acceptable quality.

### User Story Dependencies

- **US1 (P1)**: Independent after foundational; produces tickets for later stories.
- **US2 (P2)**: Consumes tickets issued in US1; UI depends on subscription services from Foundational.
- **US3 (P3)**: Uses tickets from US1 and board structure from US2 to highlight matches while ensuring draw/reset logic stays isolated.

### Within Each User Story

- Tests precede implementation to enable TDD-style validation.
- Hooks/services build before page composition.
- Styling tasks finalize after structural components exist.
- Logging instrumentation accompanies service integration.

### Parallel Opportunities

- Setup tasks T001–T003 can run concurrently with clear ownership (tooling vs scripts).
- Foundational helpers T006–T011 operate on distinct files and can proceed in parallel after docs/env prep.
- Within each story, tasks marked `[P]` touch separate modules (hooks vs components vs services) and can be split across contributors.
- Tests across different directories (`__tests__` vs `tests/e2e`) are isolated and runnable in parallel CI jobs.

---

## Parallel Example: User Story 1

```bash
# Parallel test scaffolds (developers A & B)
Task: "T012 [US1] Author Vitest suite in frontend/src/hooks/__tests__/useNumberSelection.test.ts"
Task: "T013 [US1] Create Playwright journey in tests/e2e/issue-ticket.spec.ts"

# Parallel implementation streams
Task: "T014 [US1] Implement selection hook in frontend/src/hooks/useNumberSelection.ts"
Task: "T015 [US1] Build number grid component in frontend/src/components/issue/NumberGrid.tsx"
Task: "T018 [US1] Implement ticket service in frontend/src/services/ticketService.ts"
```

---

## Implementation Strategy

### MVP First (User Story 1 only)

1. Complete Setup + Foundational phases.
2. Deliver US1 issuance flow with manual and auto selection plus Firebase persistence.
3. Validate with Vitest and Playwright tests, capturing console logs for audit.
4. Deploy/demo issuance-only experience if incremental delivery is needed.

### Incremental Delivery

1. Release US1 (ticket issuance) as MVP.
2. Add US2 (live ticket board) for operational visibility.
3. Layer in US3 (draw + reset) to complete end-to-end simulation.
4. Execute polish tasks for compliance, accessibility, and documentation.

### Parallel Team Strategy

- Developer A: Firebase services, hooks, and logging infrastructure.
- Developer B: Issuance UI + Playwright coverage.
- Developer C: Draw dashboard components, animation, and reset workflow.
- QA/Support: Owns Playwright suites and manual validation per quickstart guide.

---

## Notes

- [P] tasks use distinct files or modules and can be owned independently.
- [USx] labels trace work to user stories for clarity during reviews and testing.
- Keep console logging consistent with `[Lotto645][stage:status]` convention across implementations and tests.
- Ensure Firebase security rules are validated before promoting to staging or production.
