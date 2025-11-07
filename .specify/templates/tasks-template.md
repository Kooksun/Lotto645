---

description: "Task list template for feature implementation"
---

# Tasks: [FEATURE NAME]

**Input**: Design documents from `/specs/[###-feature-name]/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: The examples below include test tasks. Tests are OPTIONAL - only include them if explicitly requested in the feature specification.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- Frontend source: `frontend/src/`
- Shared services: `frontend/src/services/`
- Pages: `frontend/src/pages/`
- Playwright tests: `tests/e2e/`
- Vitest suites: `frontend/src/**/__tests__/`
- Update paths when the implementation plan specifies deviations

<!--
  ============================================================================
  IMPORTANT: The tasks below are SAMPLE TASKS for illustration purposes only.

  The /speckit.tasks command MUST replace these with actual tasks based on:
  - User stories from spec.md (with their priorities P1, P2, P3...)
  - Feature requirements from plan.md
  - Entities from data-model.md
  - Endpoints from contracts/

  Tasks MUST be organized by user story so each story can be:
  - Implemented independently
  - Tested independently
  - Delivered as an MVP increment

  DO NOT keep these sample tasks in the generated tasks.md file.
  ============================================================================
-->

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Bootstrap Vite + React + TypeScript project in `frontend/`
- [ ] T002 Install Firebase Web SDK, Vitest, Playwright, ESLint, and Prettier dependencies
- [ ] T003 [P] Configure linting, formatting, and CI scripts for `pnpm lint`, `pnpm test`, and `pnpm test:e2e`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Document Firebase Realtime Database schema and security rules in `docs/firebase.md`
- [ ] T005 [P] Implement `frontend/src/services/firebaseClient.ts` to wrap database reads and writes
- [ ] T006 [P] Create shared logging utility in `frontend/src/services/logger.ts` enforcing `[Lotto645]` prefix formatting
- [ ] T007 [P] Build randomness helper in `frontend/src/services/drawRng.ts` using `crypto.getRandomValues`
- [ ] T008 Configure `.env.example` with Firebase credentials and document setup in `docs/quickstart.md`

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Issue Tickets (Priority: P1) 🎯 MVP

**Goal**: Users can issue a Lotto645 ticket with six unique numbers and receive confirmation.

**Independent Test**: QA can issue a ticket, observe success logs, and confirm persistence in Firebase without relying on other stories.

### Tests for User Story 1 (OPTIONAL - only if tests requested) ⚠️

> **NOTE: Write these tests FIRST, ensure they FAIL before implementation**

- [ ] T010 [P] [US1] Playwright test `tests/e2e/issue-ticket.spec.ts` validating issuance flow
- [ ] T011 [P] [US1] Vitest unit test `frontend/src/services/__tests__/ticketService.test.ts` covering Firebase writes

### Implementation for User Story 1

- [ ] T012 [P] [US1] Implement `frontend/src/services/ticketService.ts` with ticket creation logic
- [ ] T013 [P] [US1] Build `frontend/src/pages/IssueTicketPage.tsx` UI with number picker and validation
- [ ] T014 [US1] Wire Firebase persistence with `[Lotto645][issue:start|success|error]` logs and optimistic UI
- [ ] T015 [US1] Persist issuance metadata (timestamp, optional user alias) and display confirmation state
- [ ] T016 [US1] Document issuance flow and logging checkpoints in `docs/user-stories.md`

**Checkpoint**: At this point, User Story 1 should be fully functional and testable independently

---

## Phase 4: User Story 2 - List Tickets (Priority: P2)

**Goal**: Users can view all issued tickets with live updates sourced from Firebase.

**Independent Test**: QA can open the list view, observe real-time updates after issuing tickets, and see required logs without other stories.

### Tests for User Story 2 (OPTIONAL - only if tests requested) ⚠️

- [ ] T018 [P] [US2] Playwright test `tests/e2e/list-tickets.spec.ts` validating realtime updates
- [ ] T019 [P] [US2] Vitest unit test `frontend/src/services/__tests__/ticketSubscription.test.ts` covering listeners

### Implementation for User Story 2

- [ ] T020 [P] [US2] Implement `frontend/src/services/ticketSubscription.ts` for Firebase listeners
- [ ] T021 [US2] Build `frontend/src/pages/TicketListPage.tsx` with live table and status indicators
- [ ] T022 [US2] Emit `[Lotto645][list:subscribe|update|error]` logs for subscription lifecycle events
- [ ] T023 [US2] Ensure navigation between Issue and List pages refreshes Firebase state before rendering

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently

---

## Phase 5: User Story 3 - Draw Results (Priority: P3)

**Goal**: Users can execute a draw, review winning numbers, and audit persisted metadata.

**Independent Test**: QA can execute a draw, confirm stored metadata in Firebase, and review console logs without other stories.

### Tests for User Story 3 (OPTIONAL - only if tests requested) ⚠️

- [ ] T024 [P] [US3] Playwright test `tests/e2e/draw-results.spec.ts` validating draw flow and display
- [ ] T025 [P] [US3] Vitest unit test `frontend/src/services/__tests__/drawService.test.ts` covering randomness and persistence

### Implementation for User Story 3

- [ ] T026 [P] [US3] Implement `frontend/src/services/drawService.ts` persisting draw payload with seed metadata
- [ ] T027 [US3] Build `frontend/src/pages/DrawResultsPage.tsx` with result visualization and audit details
- [ ] T028 [US3] Emit `[Lotto645][draw:start|complete|error]` logs and surface stored seed/timestamp in the UI

**Checkpoint**: All user stories should now be independently functional

---

## Phase N: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] TXXX [P] Documentation updates in `docs/` with latest Firebase schema and logging checkpoints
- [ ] TXXX Code cleanup, shared component refactors, and bundle size tracking
- [ ] TXXX Performance profiling for ticket subscription throughput and draw execution time
- [ ] TXXX [P] Additional unit tests in `frontend/src/**/__tests__/`
- [ ] TXXX Security review of Firebase rules and environment handling
- [ ] TXXX Validate `docs/quickstart.md` setup steps end to end

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - User stories can then proceed in parallel (if staffed)
  - Or sequentially in priority order (P1 -> P2 -> P3)
- **Polish (Final Phase)**: Depends on all desired user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2); no dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2); may observe tickets issued by US1 but remains independently testable
- **User Story 3 (P3)**: Can start after Foundational (Phase 2); consumes tickets from Firebase but must not rely on US2 UI

### Within Each User Story

- Tests (if included) MUST be written and FAIL before implementation
- Services and Firebase interactions MUST be completed before wiring pages
- Pages/UI layers must integrate logging checkpoints before review
- Story complete before moving to next priority

### Parallel Opportunities

- All Setup tasks marked [P] can run in parallel
- Foundational tasks marked [P] can run in parallel once dependencies clarified
- After Foundational completion, user stories can be staffed independently
- Playwright and Vitest suites marked [P] can execute concurrently
- Shared utilities can be developed in parallel when touching separate files

---

## Parallel Example: User Story 1

```bash
# Launch all tests for User Story 1 together (if tests requested):
Task: "Playwright test for issuance in tests/e2e/issue-ticket.spec.ts"
Task: "Vitest unit test for ticket service in frontend/src/services/__tests__/ticketService.test.ts"

# Launch all core work for User Story 1 together:
Task: "Implement ticketService.ts in frontend/src/services/ticketService.ts"
Task: "Build IssueTicketPage.tsx UI in frontend/src/pages/IssueTicketPage.tsx"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL - blocks all stories)
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Test User Story 1 independently with Firebase write verification and console log capture
5. Deploy/demo if ready

### Incremental Delivery

1. Complete Setup + Foundational -> Foundation ready
2. Add User Story 1 -> Test independently -> Deploy/Demo (MVP)
3. Add User Story 2 -> Test independently -> Deploy/Demo
4. Add User Story 3 -> Test independently -> Deploy/Demo
5. Each story adds value without breaking previous stories

### Parallel Team Strategy

With multiple developers:

1. Team completes Setup + Foundational together
2. Once Foundational is done:
   - Developer A: User Story 1
   - Developer B: User Story 2
   - Developer C: User Story 3
3. Stories complete and integrate independently

---

## Notes

- [P] tasks = different files, no dependencies
- [Story] label maps task to specific user story for traceability
- Each user story should be independently completable and testable
- Verify tests fail before implementing
- Commit after each task or logical group
- Capture console logs during QA to prove compliance with the constitution
- Avoid: vague tasks, same file conflicts, cross-story dependencies that break independence
