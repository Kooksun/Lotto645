# Data Model: Lotto Ticket Issuance & Draw Experience

## Overview
- Single active session stored under `/sessions/current` in Firebase Realtime Database.
- Tickets and draw metadata live as child collections to simplify reset operations.
- All write operations include ISO 8601 timestamps for auditing and replay.

## Entities

### Ticket (`/sessions/current/tickets/{ticketId}`)
- **ticketId**: string (Firebase push key); immutable.
- **name**: string (1–40 chars); trimmed; required.
- **numbers**: array<int> (length 6); values 1–45; strictly ascending when stored.
- **createdAt**: string (ISO 8601 timestamp); generated client-side at persistence moment.
- **matchedNumbers**: array<int>; subset of `numbers`; updated during draws.
- **source**: string enum {`manual`, `auto`} to support analytics.
- **metadata**: object
  - **clientId**: optional string unique per browser session for debugging.
  - **issuedBy**: optional string for host tracking if issuance done by admin.

**Validation Rules**
- `numbers` MUST contain six unique values; reject writes otherwise.
- `matchedNumbers` MUST always be subset of `numbers`; writes enforcing set inclusion.
- Names empty after trimming cause write rejection.

### DrawResult (`/sessions/current/draw`)
- **numbers**: array<int> (0–6 entries); appended sequentially during draw.
- **seed**: string combining ISO timestamp + random salt; set at draw start, immutable thereafter.
- **startedAt**: string (ISO 8601); set when draw begins.
- **completedAt**: string (ISO 8601); populated when sixth number stored.
- **status**: string enum {`idle`, `in_progress`, `completed`, `error`}; aids UI state machine.
- **error**: optional object describing last error (`code`, `message`, `timestamp`).

**Validation Rules**
- No duplicate numbers allowed; server-side rule enforces uniqueness via transaction.
- `completedAt` requires `numbers.length === 6`.
- `status` transitions allowed: `idle -> in_progress -> completed` or `idle -> in_progress -> error`.

### SessionState (`/sessions/current`)
- Parent container to keep aggregated metadata.
- **updatedAt**: string (ISO 8601); touched on every mutation via cloud function hook (future) or client write.
- **ticketCount**: number; maintained transactionally for quick display (optional optimization).

## Relationships
- `DrawResult.numbers` drive updates to `Ticket.matchedNumbers`.
- `SessionState.ticketCount` equals number of children in `tickets`.
- Reset operation deletes `/sessions/current` node and recreates skeleton: empty `tickets` object, `draw` object with status `idle`.

## Derived Views & Indexing
- Firebase rule to index `tickets` by `createdAt` for chronological ordering.
- Client-side derived view sorts tickets by `createdAt` descending for display.
- Highlight mapping computed client-side by comparing `DrawResult.numbers` with each ticket’s `numbers`.

## Security & Access Considerations
- Write rules restrict modifications to `/sessions/current` namespace; read allowed to all connected clients for simulation.
- Reset action limited to privileged host channel (e.g., write allowed only if `auth.token.role == 'host'` or via secret key).
- Realtime listeners subscribe to `tickets` and `draw` separately to keep payloads small and minimize UI recompute.
