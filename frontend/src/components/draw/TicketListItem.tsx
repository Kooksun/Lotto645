import type { TicketBoardEntry } from '../../services/ticketSubscription';

const TIME_FORMATTER = typeof Intl !== 'undefined' ? new Intl.DateTimeFormat('ko-KR', {
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit'
}) : null;

function formatIssuedAt(iso?: string | null): string {
  if (!iso) {
    return '발행 시간 미상';
  }

  const date = new Date(iso);
  if (Number.isNaN(date.getTime()) || !TIME_FORMATTER) {
    return '발행 시간 미상';
  }

  return TIME_FORMATTER.format(date);
}

function formatSourceLabel(source?: string): string {
  if (source === 'auto') {
    return 'AUTO';
  }
  return 'MANUAL';
}

function formatSourceDescription(source?: string): string {
  return source === 'auto' ? '자동 선택' : '수동 선택';
}

function padNumber(value: number): string {
  return value.toString().padStart(2, '0');
}

interface TicketListItemProps {
  ticket: TicketBoardEntry;
}

function TicketListItem({ ticket }: TicketListItemProps): JSX.Element {
  const numbers = ticket.numbers ?? [];
  const matchedSet = new Set(ticket.matchedNumbers ?? []);
  const issuedLabel = formatIssuedAt(ticket.createdAt ?? null);
  const sourceLabel = formatSourceLabel(ticket.source);
  const issuedBy = typeof ticket.metadata?.['issuedBy'] === 'string' ? (ticket.metadata?.['issuedBy'] as string) : null;
  const clientId = typeof ticket.metadata?.['clientId'] === 'string' ? (ticket.metadata?.['clientId'] as string) : null;

  return (
    <article className="ticket-card" role="listitem" data-testid="ticket-board-item">
      <header className="ticket-card__header">
        <div>
          <p className="ticket-card__name">{ticket.name}</p>
          <p className="ticket-card__meta">
            {issuedLabel}
            {issuedBy ? ` · ${issuedBy}` : ''}
          </p>
        </div>
        <span className={`ticket-card__badge ticket-card__badge--${ticket.source ?? 'manual'}`}>
          {sourceLabel}
        </span>
      </header>

      <ul className="ticket-card__numbers" aria-label="선택된 번호">
        {numbers.map((number) => (
          <li key={`${ticket.id}-${number}`} className="ticket-card__number" data-testid="ticket-number-chip">
            <span className={matchedSet.has(number) ? 'is-matched' : ''}>{padNumber(number)}</span>
          </li>
        ))}
      </ul>

      <footer className="ticket-card__footer">
        <span className="ticket-card__footer-chip" aria-label="선택 방식">
          {formatSourceDescription(ticket.source)}
        </span>
        <span className="ticket-card__footer-chip" aria-label="적중 개수">
          적중 {matchedSet.size}개
        </span>
        {clientId ? (
          <span className="ticket-card__footer-chip ticket-card__footer-chip--muted" aria-label="클라이언트 식별자">
            {clientId}
          </span>
        ) : null}
      </footer>
    </article>
  );
}

export default TicketListItem;
