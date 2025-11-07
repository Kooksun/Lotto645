# Feature Specification: Lotto Ticket Issuance & Draw Experience

**Feature Branch**: `001-lotto-ticketing`  
**Created**: 2025-11-06  
**Status**: Draft  
**Input**: User description: "1. 로또 티켓 발행 페이지 - UI는 issue_ticket.png를 참고 - 45개 번호를 표시하며, 선택된 번호는 하단에 표시한다. 선택은 토글 가능. - 선택은 6개까지 가능하다. 6개가 되지 않으면 발행할 수 없다. - 자동선택 버튼을 누르면 사용자가 선택한 번호를 포함하여 전체 6개의 숫자를 랜덤하게 선택해준다. 즉, 사용자가 선택한 번호가 하나도 없다면 6개 번호를 자동으로 선택하고, 사용자가 3개를 선택한 상태라면 나머지 3개를 자동으로 선택한다. - 발행하기 버튼을 누르면 파이어베이스로 이름과 선택번호들을 저장한다. 2. 로또 추첨 페이지 - UI는 lotto_main.png를 참고 - 티켓 발급 리스트에는 발행된 로또 티켓들의 목록이 나열되며, 목록이 길어지면 세로 스크롤바를 표시한다. - 티켓 하나의 UI는 one_ticket_and_sample.png를 참고 - 초기화 버튼: 발급된 티켓들을 모두 제거한다 - 추첨시작 버튼: 5초에 한번씩 룰렛을 통해 1~45 사이의 숫자를 랜덤으로 추첨한다. 총 6개의 숫자를 추첨하며 숫자들은 중복되지 않는다. - 추첨번호 리스트: 추첨된 번호가 나열된다. - 추첨이 진행되면 동일한 번호를 갖고 있는 티켓의 숫자를 다른색으로 표현하여 구분될 수 있게한다. 색상등 세부적인 사항은 기능개발 이후 지정한다. - 추첨을 위한 룰렛은 숫자가 그려져 있고, 회전하는 애니메이션이 필요하다. 3. 파이어베이스 연동 - 파이어베이스에 프로젝트를 만들어 둘것이고 개발 단계에서 에뮬레이터를 사용하지 않고 직접 서버로 연동한다. - 데이터는 한개의 세션만 유지하여 발급된 티켓의 정보를 담고 있는다. 즉, 티켓 발급은 하나의 세션 데이터에 누적되고 추첨 페이지에서 초기화 버튼을 누르면 모두 제거 된다. - 로또 추첨 페이지의 티켓 발급리스트 영역은 실시간으로 반영되어야 한다."

> 참고 이미지 경로(레포 상대경로)
> - 발행 페이지 레이아웃: `specs/001-lotto-ticketing/assets/issue_ticket.png`
> - 추첨 대시보드 전체 레이아웃: `specs/001-lotto-ticketing/assets/lotto_main.png`
> - 단일 티켓 카드 시안: `specs/001-lotto-ticketing/assets/one_ticket_and_sample.png`

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Issue a Lotto Ticket (Priority: P1)

Players need to select their Lotto645 numbers, optionally use auto-complete, and submit the ticket with their name so they can participate in the draw. The UI must follow the structure shown in `specs/001-lotto-ticketing/assets/issue_ticket.png`.

**Why this priority**: Without the ability to issue tickets the experience has no participants, making all other functionality irrelevant.

**Independent Test**: QA can open the issuance page, toggle numbers, auto-complete a partial selection, provide a name, and confirm the ticket is saved and acknowledged without the draw page.

**Acceptance Scenarios**:

1. **Given** a player on the issuance page, **When** they toggle numbers on a 1–45 grid, **Then** selected numbers appear in a summary list and remain highlighted until deselected.
2. **Given** a player with fewer than six numbers selected, **When** they press Auto Select, **Then** the system fills remaining slots with random non-duplicate numbers and preserves the player’s earlier picks.
3. **Given** a player with six numbers selected and a name entered, **When** they press Issue Ticket, **Then** the system stores name and numbers, shows success messaging, and prevents further input until completion.

---

### User Story 2 - Monitor Ticket Board (Priority: P2)

Hosts need a live board that lists all issued tickets with scroll support so they can supervise participation before and during the draw. The layout should mirror `specs/001-lotto-ticketing/assets/lotto_main.png`, and each card should align with `specs/001-lotto-ticketing/assets/one_ticket_and_sample.png`.

**Why this priority**: Real-time visibility assures organizers that tickets were captured correctly and provides transparency ahead of the draw.

**Independent Test**: QA can issue tickets from one browser, observe them appear and update instantly on the draw page in another browser, and scroll through a long list.

**Acceptance Scenarios**:

1. **Given** the draw page open, **When** new tickets are issued elsewhere, **Then** the ticket list updates within the session without manual refresh.
2. **Given** more tickets than fit vertically, **When** the host scrolls, **Then** the list displays a vertical scrollbar and retains sticky headers for context.

---

### User Story 3 - Conduct Lotto Draw (Priority: P3)

Hosts must run an animated roulette that draws six unique numbers every five seconds, highlight matching tickets, and reset the session when done.

**Why this priority**: The draw completes the simulation and provides the excitement and outcome users expect from the product.

**Independent Test**: QA can trigger the draw, watch the roulette animation produce six non-duplicate numbers at five-second intervals, observe matching ticket numbers highlight, and confirm the reset button clears all tickets and draw data.

**Acceptance Scenarios**:

1. **Given** the host has active tickets, **When** they press Start Draw, **Then** the system begins the roulette animation, emits console logs for each stage, and appends a drawn number every five seconds until six numbers exist.
2. **Given** drawn numbers in progress, **When** a ticket shares a drawn value, **Then** that number is visually distinguished on that ticket and in the draw list, avoiding duplicate highlights for other values.
3. **Given** the draw and ticket board populated, **When** the host chooses Reset, **Then** all tickets and drawn numbers disappear from the interface and the Firebase session clears.

---

### Edge Cases

- Attempting to select more than six numbers must leave the seventh tap ignored with explanatory feedback.
- Auto Select pressed when six numbers are already chosen must re-roll the entire set only after explicit confirmation from the player.
- If the ticket issuance fails to save (e.g., connectivity loss), the player must see an error and retain their selections locally until retried.
- Draw restart requested before six numbers complete must confirm cancellation to avoid orphaned states.
- Reset invoked while a draw is running must stop timers and roulette animation cleanly.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The issuance page MUST display 45 selectable numbers, reflect selection state visually, and show the chosen numbers as a list below the grid.
- **FR-002**: The system MUST prevent issuing a ticket until exactly six unique numbers are selected and a player name (or agreed identifier) is provided.
- **FR-003**: The Auto Select control MUST fill any remaining slots with random, non-duplicate numbers while preserving numbers the player already selected.
- **FR-004**: Successful ticket issuance MUST persist the player name, six numbers, timestamp, and console log with `[Lotto645][issue:success]` before the confirmation UI appears.
- **FR-005**: All tickets MUST be stored in a single active session dataset; the draw page MUST subscribe to this dataset and reflect additions, edits, and deletions in real time.
- **FR-006**: The ticket list on the draw page MUST support vertical scrolling once the list exceeds the viewport and keep each ticket’s name and numbers legible.
- **FR-007**: The Reset control MUST delete all tickets and drawn numbers from the session dataset, emit `[Lotto645][reset:start|success]` logs, and refresh both pages automatically.
- **FR-008**: Starting a draw MUST trigger six unique numbers between 1 and 45 at five-second intervals, with the sequence and draw timestamp stored for audit.
- **FR-009**: Matching numbers on tickets MUST receive a distinct visual state the moment a drawn number matches, without altering non-matching numbers.
- **FR-010**: The roulette component MUST display a numbered wheel animation that visibly spins between draws and pauses on the winning number each interval.
- **FR-011**: Errors during issuance, draw, or reset MUST surface user-facing messages and emit `[Lotto645][<stage>:error]` logs with contextual details.

### Key Entities *(include if feature involves data)*

- **Ticket**: One player’s submission containing name, six unique numbers, creation timestamp, and optional status such as highlighted matches.
- **DrawResult**: Stores the ordered list of six drawn numbers, draw timestamp, and metadata required to replay or audit the draw.
- **SessionState**: Represents the single active dataset that aggregates tickets and draw results for the current event and is cleared by Reset.

## Assumptions

- Player identity for ticket issuance is captured via a free-text name field; no authentication system is in scope.
- Visual styling (colors, animations, typography) will align with referenced mockups; precise color codes for highlights will be finalized during UI review.
- A dedicated Firebase Realtime Database project exists with security rules that allow this application to read/write the single session path during events.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 95% of players can issue a ticket (manual or auto-complete) and receive confirmation within 10 seconds of selecting their sixth number.
- **SC-002**: Newly issued tickets appear on the draw page across concurrent clients within 1 second in at least 9 out of 10 QA trials.
- **SC-003**: Each draw completes six unique numbers within 30 seconds, with no duplicate numbers recorded across 100 simulated draws.
- **SC-004**: Reset clears all tickets and draw results in under 2 seconds and leaves both pages ready for a new session without stale highlights.
