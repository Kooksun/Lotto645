# Firebase Realtime Database Guidance

## Session Structure
- Root node: `/sessions/current`
- Tickets: `/sessions/current/tickets/{ticketId}`
- Draw metadata: `/sessions/current/draw`

## Ticket Document
```json
{
  "name": "Player display name",
  "numbers": [1, 7, 18, 23, 34, 42],
  "createdAt": "2025-11-06T12:00:00.000Z",
  "matchedNumbers": [],
  "source": "manual",
  "metadata": {
    "clientId": "optional browser identifier",
    "issuedBy": "optional host identifier"
  }
}
```
- `numbers` MUST be unique, length 6, each between 1 and 45.
- `matchedNumbers` is derived; enforce subset of `numbers`.
- Names are trimmed; reject empty values.

## Draw Document
```json
{
  "numbers": [12, 6],
  "seed": "2025-11-06T12:10:00.000Z#b1d93",
  "startedAt": "2025-11-06T12:10:00.000Z",
  "completedAt": null,
  "status": "in_progress",
  "error": null
}
```
- Enforce unique entries when appending draw numbers.
- Transition rules: `idle -> in_progress -> completed` (or `error`).
- Set `completedAt` only after six numbers.

## Security Rules Outline
```txt
- Restrict write access to `/sessions/current`.
- Allow ticket creation if `numbers` validates.
- Allow draw updates only for host role (`auth.token.role == "host"`) or secret key.
- Allow reads for all authenticated users during event.
- Deny writes to `matchedNumbers` except via Cloud Function or host draw logic.
```

## Indexing
```
"rules": {
  "sessions": {
    "current": {
      "tickets": {
        ".indexOn": ["createdAt"]
      }
    }
  }
}
```

## Reset Procedure
1. Host triggers reset.
2. Delete `/sessions/current` using multi-location update.
3. Recreate empty structure:
```json
{
  "draw": {
    "numbers": [],
    "status": "idle",
    "seed": null,
    "startedAt": null,
    "completedAt": null,
    "error": null
  },
  "tickets": {}
}
```
4. Log `[Lotto645][reset:success]`.

## Operational Notes
- Capture seed timestamp + salt for every draw for auditing.
- Monitor console logs for `[issue:*]`, `[list:*]`, `[draw:*]`, `[reset:*]` events.
- Backup database before live demos when practical.
