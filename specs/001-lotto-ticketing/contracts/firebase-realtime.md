# Firebase Realtime Contracts: Lotto Ticket Issuance & Draw Experience

## Overview
- All data exists under `/sessions/current`.
- Requests are client-side SDK interactions; this contract formalizes expected payloads and logging events to guarantee consistency across clients.

## 1. Create Ticket
- **Path**: `/sessions/current/tickets/{ticketId}`
- **Method**: `set` (new push key generated via `push()`)
- **Request Payload**:
  ```json
  {
    "name": "string (1-40 chars)",
    "numbers": [n1, n2, n3, n4, n5, n6],
    "createdAt": "ISO 8601 string",
    "matchedNumbers": [],
    "source": "manual|auto",
    "metadata": {
      "clientId": "optional string",
      "issuedBy": "optional string"
    }
  }
  ```
- **Response**: Promise resolves with generated `ticketId`.
- **Errors**:
  - `validation/too-many-numbers`: numbers length != 6 or duplicates.
  - `validation/empty-name`: sanitized name empty.
  - `permission-denied`: security rules reject.
- **Logging**:
  - `[Lotto645][issue:start]{ name, numbers, source }`
  - `[Lotto645][issue:success]{ ticketId }`
  - `[Lotto645][issue:error]{ code, message }`

## 2. Subscribe to Ticket Board
- **Path**: `/sessions/current/tickets`
- **Method**: `onValue` listener
- **Response Shape**:
  ```json
  {
    "{ticketId}": {
      "name": "...",
      "numbers": [...],
      "matchedNumbers": [...],
      "createdAt": "...",
      "source": "...",
      "metadata": {...}
    }
  }
  ```
- **Behavior**: Listener emits full snapshot on initial subscription and incremental updates thereafter.
- **Logging**:
  - `[Lotto645][list:subscribe]{ clientId }`
  - `[Lotto645][list:update]{ ticketCount }`
  - `[Lotto645][list:error]{ code, message }`

## 3. Start Draw Session
- **Path**: `/sessions/current/draw`
- **Method**: `update`
- **Request Payload**:
  ```json
  {
    "numbers": [],
    "seed": "timestamp+salt",
    "startedAt": "ISO 8601",
    "status": "in_progress",
    "completedAt": null,
    "error": null
  }
  ```
- **Logging**:
  - `[Lotto645][draw:start]{ seed }`

## 4. Append Draw Number
- **Path**: `/sessions/current/draw`
- **Method**: Transaction to enforce uniqueness
- **Transaction Input**: existing `draw` object
- **Transaction Output**:
  ```json
  {
    "numbers": [ ...existing, newNumber ],
    "status": "in_progress|completed",
    "completedAt": "ISO 8601 or null",
    "error": null
  }
  ```
- **Side-effects**:
  - Update each matched ticket’s `matchedNumbers` array using multi-location `update` call.
- **Logging**:
  - `[Lotto645][draw:step]{ number, stepIndex }`
  - `[Lotto645][draw:complete]{ numbers }`
  - `[Lotto645][draw:error]{ code, message }`

## 5. Reset Session
- **Path**: `/sessions/current`
- **Method**: multi-location `update` or `set(null)` followed by skeleton seed
- **Sequence**:
  1. `[Lotto645][reset:start]{ ticketCount, drawNumbers }`
  2. Delete `/sessions/current`.
  3. Recreate:
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
  4. `[Lotto645][reset:success]{}`  
- **Errors**: permission denied, transient network failure; log via `[reset:error]`.

## 6. Auto Select Helper (Client-only)
- Generates supplemental numbers locally then relies on **Create Ticket** contract.
- Must persist `source: "auto"` and include the combined manual + auto numbers in ascending order.

## Security Rule Summary (Non-executable Outline)
- Only authenticated clients flagged `role: "host"` may call Reset or start draws; general participants may only create tickets and subscribe.
- Validation ensures tickets cannot be overwritten once created except for system-managed `matchedNumbers`.
- Draw transaction enforces `numbers.length <= 6`.
