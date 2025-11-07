# Research: Lotto Ticket Issuance & Draw Experience

## Firebase Realtime Data Shape & Sync
- **Decision**: Use a single active session node with child collections for tickets and draw metadata (`/sessions/current/tickets` and `/sessions/current/draw`).
- **Rationale**: Keeps compliance with constitution’s single source of truth, simplifies reset logic (single delete), and allows both pages to subscribe to focused paths.
- **Alternatives considered**:
  - `tickets` and `draws` at root level: rejected to avoid manual cleanup scatter and to support potential future multi-session support via different keys.
  - Cloud Firestore: unnecessary complexity; Realtime Database already mandated and offers simpler listener semantics.

## Ticket Issuance Number Selection UX
- **Decision**: Implement a controlled selection grid in React with local state capped at six numbers plus an auto-fill helper using deterministic shuffling backed by `crypto.getRandomValues`.
- **Rationale**: Ensures responsive UX, easy validation, and compliance with fairness/audit principles by using cryptographically strong randomness even client-side.
- **Alternatives considered**:
  - Server-generated numbers: conflicts with client-only constraint and would add latency.
  - Math.random-based selection: insufficient randomness quality for fairness messaging.

## Roulette Animation Implementation
- **Decision**: Use CSS-driven rotation on an SVG wheel component with React state controlling active segment, synchronized to a five-second interval timer.
- **Rationale**: SVG + CSS animations perform well across evergreen browsers, allow theming, and avoid external dependencies while enabling reduced-motion fallbacks.
- **Alternatives considered**:
  - Canvas animation: more code and harder to style; unnecessary for simple rotation.
  - Third-party animation libraries: increase bundle size; conflict with simplicity principle.

## Real-time Ticket Board Scalability
- **Decision**: Render ticket list with lightweight virtualization (e.g., custom windowing) once count exceeds threshold, and rely on Firebase `onValue` listener with incremental diff handling.
- **Rationale**: Prevents performance degradation when the session accumulates hundreds of tickets and ensures consistent updates without full rerender.
- **Alternatives considered**:
  - Always render full list: acceptable for small sets but risks jank beyond a few hundred tickets.
  - Using Firestore with pagination: violates constraint to stay within Realtime Database.

## Logging & Observability Strategy
- **Decision**: Centralize logging via a `logger` helper that prefixes `[Lotto645]` and enforces structured payloads (stage, entityId, metadata), invoked across services and components.
- **Rationale**: Guarantees constitution compliance, keeps console output uniform for QA, and simplifies future redirection to external telemetry.
- **Alternatives considered**:
  - Ad-hoc `console.log` calls: risk inconsistent format and missing contexts.
  - External logging SDK: unnecessary for current scope and adds dependency overhead.
