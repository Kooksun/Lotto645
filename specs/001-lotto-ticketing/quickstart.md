# Quickstart: Lotto Ticket Issuance & Draw Experience

## Prerequisites
- Node.js 20.x + pnpm (preferred) installed locally.
- Access to Firebase Realtime Database project provisioned for Lotto645.
- Browser supporting ES2020 and Web Crypto APIs.

## Environment Configuration
1. Copy `.env.example` to `.env.local` in the project root.
2. Populate Firebase credentials:
   ```
   VITE_FIREBASE_API_KEY=...
   VITE_FIREBASE_AUTH_DOMAIN=...
   VITE_FIREBASE_DATABASE_URL=...
   VITE_FIREBASE_PROJECT_ID=...
   VITE_FIREBASE_APP_ID=...
   ```
3. Set `VITE_LOTTO_SESSION_KEY=current` to align with single-session expectation.
4. (Optional) Provide `VITE_HOST_SECRET` for gated reset/draw actions.

## Install & Run
```bash
pnpm install
pnpm dev
```
- Dev server defaults to `http://localhost:5173`.
- Open two browser windows: one on `/issue`, another on `/draw` to observe real-time sync.

## Firebase Setup Checklist
- Enable Realtime Database in production mode.
- Import security rules file (`firebase/database.rules.json`) ensuring:
  - Ticket creation requires numbers array length 6 with unique entries.
  - Reset/draw updates require host role or secret key.
- Verify database URL referenced in `.env.local` matches project.

## Verifying Core Flows
1. **Manual Ticket**: Select six numbers manually, enter name, issue ticket. Confirm `[Lotto645][issue:*]` logs and ticket appears on draw page.
2. **Auto Select**: Choose two numbers, trigger auto select. Ensure remaining four numbers autofill without duplicates.
3. **Draw Simulation**: Start draw on dashboard; confirm roulette animation advances every five seconds and matching numbers highlight across tickets.
4. **Reset**: Trigger reset; both pages should clear and logs show `[reset:*]`.

## Testing Commands
- `pnpm test` → Vitest unit suite (selection logic, services, logging).
- `pnpm test:e2e` → Playwright scenarios covering issuance, draw, reset.
- `pnpm lint` → ESLint + formatting checks.

## Logging Expectations
- Console output must include `[Lotto645][issue]`, `[list]`, `[draw]`, `[reset]` events with structured payloads.
- QA should capture console transcript during dry run for release evidence.

## Troubleshooting
- **Tickets not appearing**: Verify Firebase Database URL and rules; check console for `[list:error]`.
- **Draw stalls**: Investigate `[draw:error]` logs; ensure client retains network connectivity.
- **Animations sluggish**: Enable reduced motion mode or throttle draw interval via feature flag for QA.
