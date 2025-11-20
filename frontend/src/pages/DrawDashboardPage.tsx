import { useEffect, useMemo, useState } from 'react';
import TicketList from '../components/draw/TicketList';
import RouletteWheel from '../components/draw/RouletteWheel';
import { useSession } from '../context/SessionProvider';
import { subscribeToTicketBoard, type TicketBoardDiff, type TicketBoardEntry } from '../services/ticketSubscription';
import { useDrawController } from '../hooks/useDrawController';
import '../styles/draw-dashboard.css';
import '../styles/draw-results.css';

interface TicketBoardState {
  tickets: TicketBoardEntry[];
  total: number;
  diff: TicketBoardDiff | null;
  isLoading: boolean;
  error: unknown | null;
  lastUpdatedAt: string | null;
}

const INITIAL_STATE: TicketBoardState = {
  tickets: [],
  total: 0,
  diff: null,
  isLoading: true,
  error: null,
  lastUpdatedAt: null
};

const DRAW_STATUS_LABELS: Record<string, string> = {
  idle: '대기 중',
  in_progress: '추첨 진행 중',
  completed: '추첨 완료',
  error: '오류 발생'
};

function formatControllerLabel(controllerId: string | null): string {
  if (!controllerId) {
    return '—';
  }
  return controllerId.length > 8 ? `${controllerId.slice(0, 8)}…` : controllerId;
}

function formatTimestamp(value: string | null, fallback = '—'): string {
  if (!value) {
    return fallback;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return fallback;
  }
  return new Intl.DateTimeFormat('ko-KR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  }).format(date);
}

function DrawDashboardPage(): JSX.Element {
  const session = useSession();
  const [boardState, setBoardState] = useState<TicketBoardState>(INITIAL_STATE);
  const drawController = useDrawController({
    drawState: session.draw,
    ticketsMap: session.ticketsMap,
    sessionKey: session.sessionKey,
    clientId: session.clientId
  });

  useEffect(() => {
    setBoardState((previous) => ({ ...previous, isLoading: true, error: null }));

    const unsubscribe = subscribeToTicketBoard({
      sessionKey: session.sessionKey,
      clientId: session.clientId,
      onUpdate: (update) => {
        setBoardState({
          tickets: update.tickets,
          total: update.total,
          diff: update.diff,
          isLoading: false,
          error: null,
          lastUpdatedAt: new Date().toISOString()
        });
      },
      onError: (error) => {
        setBoardState((previous) => ({ ...previous, error, isLoading: false }));
      }
    });

    return () => {
      unsubscribe();
    };
  }, [session.sessionKey, session.clientId]);

  const diffSummary = useMemo(() => {
    return {
      added: boardState.diff?.added.length ?? 0,
      updated: boardState.diff?.updated.length ?? 0,
      removed: boardState.diff?.removed.length ?? 0
    };
  }, [boardState.diff]);

  const drawStatusLabel = DRAW_STATUS_LABELS[drawController.status] ?? DRAW_STATUS_LABELS.idle;
  const isControlLocked = Boolean(drawController.controllerId && !drawController.isController);

  return (
    <section className="draw-dashboard">
      {/* Header removed as requested */}

      <div className="draw-dashboard__layout">
        <main className="draw-dashboard__main">
          <div className="draw-panel draw-panel--wheel">
            <div className="draw-panel__header-row">
              <div className="draw-panel__heading">
                <h3>룰렛 추첨</h3>
                <p>5초 간격으로 자동 추첨됩니다.</p>
              </div>
              <div className="draw-controls">
                <button
                  type="button"
                  className="draw-controls__button draw-controls__button--primary"
                  onClick={() => {
                    void drawController.startDraw();
                  }}
                  disabled={!drawController.canStart}
                  data-testid="draw-start-button"
                  title={drawController.isStarting ? '준비 중...' : '추첨 시작'}
                >
                  {drawController.isStarting ? '...' : '시작'}
                </button>
                <button
                  type="button"
                  className="draw-controls__button"
                  onClick={() => {
                    void drawController.forceNext();
                  }}
                  disabled={!drawController.canForceNext}
                  data-testid="draw-next-button"
                  title={drawController.isStepping ? '추첨 중...' : '즉시 추첨'}
                >
                  {drawController.isStepping ? '...' : '즉시'}
                </button>
                <button
                  type="button"
                  className="draw-controls__button draw-controls__button--danger"
                  onClick={() => {
                    void drawController.resetSession();
                  }}
                  disabled={!drawController.canReset}
                  data-testid="draw-reset-button"
                  title={drawController.isResetting ? '초기화 중...' : '초기화'}
                >
                  {drawController.isResetting ? '...' : '리셋'}
                </button>
              </div>
            </div>

            <RouletteWheel
              status={drawController.status}
              activeNumber={drawController.activeNumber}
              countdownSeconds={drawController.countdownSeconds}
              drawnCount={drawController.numbers.length}
              totalNumbers={6}
            />

            {drawController.error ? (
              <p className="draw-panel__error" role="alert" data-testid="draw-error-banner">
                {drawController.error}
              </p>
            ) : null}

            <div className="draw-panel__timeline">
              <ol className="draw-timeline" data-testid="draw-timeline">
                {drawController.timeline.map((entry) => (
                  <li key={entry.index} data-status={entry.status} data-testid="draw-timeline-entry">
                    <span>#{entry.index}</span>
                    <strong>{entry.number ?? '--'}</strong>
                  </li>
                ))}
              </ol>
            </div>

            <dl className="draw-meta">
              <div>
                <dt>Seed</dt>
                <dd>{drawController.seed ?? '—'}</dd>
              </div>
              <div>
                <dt>시작</dt>
                <dd>{formatTimestamp(drawController.startedAt)}</dd>
              </div>
              <div>
                <dt>완료</dt>
                <dd>{formatTimestamp(drawController.completedAt)}</dd>
              </div>
            </dl>
          </div>
        </main>

        <aside className="draw-dashboard__side">
          <section className="ticket-board" aria-labelledby="ticket-board-heading">
            <div className="ticket-board__heading">
              <div>
                <p className="ticket-board__eyebrow">실시간 티켓 스트림</p>
                <h2 id="ticket-board-heading" data-testid="ticket-board-heading">
                  발급 티켓 보드 ({boardState.total})
                </h2>
              </div>
              <ul className="ticket-board__diff" aria-label="최근 동기화 현황">
                <li>+{diffSummary.added} 신규</li>
                <li>{diffSummary.updated} 업데이트</li>
                <li>-{diffSummary.removed} 제거</li>
              </ul>
            </div>

            <TicketList tickets={boardState.tickets} isLoading={boardState.isLoading} error={boardState.error} />
          </section>
        </aside>
      </div>
    </section>
  );
}

export default DrawDashboardPage;
