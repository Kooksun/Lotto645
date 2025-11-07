import type { DrawStatus } from '../../services/realtimeListeners';

interface RouletteWheelProps {
  status: DrawStatus;
  activeNumber: number | null;
  countdownSeconds: number | null;
  totalNumbers: number;
  drawnCount: number;
}

const STATUS_LABELS: Record<DrawStatus, string> = {
  idle: '대기 중',
  in_progress: '추첨 중',
  completed: '완료',
  error: '오류'
};

function formatCountdown(seconds: number | null): string {
  if (seconds === null) {
    return '대기 중';
  }
  if (seconds === 0) {
    return '곧 추첨';
  }
  return `${seconds}초 후 다음 추첨`;
}

function RouletteWheel({ status, activeNumber, countdownSeconds, totalNumbers, drawnCount }: RouletteWheelProps): JSX.Element {
  const progress = Math.min(100, Math.round((drawnCount / totalNumbers) * 100));
  const statusLabel = STATUS_LABELS[status] ?? STATUS_LABELS.idle;
  const displayNumber = typeof activeNumber === 'number' ? activeNumber.toString().padStart(2, '0') : '--';

  return (
    <div className="roulette" data-status={status} data-testid="roulette-wheel" role="region" aria-live="polite">
      <div className="roulette__ring">
        <div className="roulette__ring-gradient" aria-hidden="true" />
        <div className="roulette__ring-core">
          <p className="roulette__status">{statusLabel}</p>
          <strong className="roulette__number" data-testid="roulette-active-number">
            {displayNumber}
          </strong>
          <p className="roulette__countdown" data-testid="roulette-countdown">
            {formatCountdown(countdownSeconds)}
          </p>
        </div>
        <span className="roulette__pointer" aria-hidden="true" />
      </div>

      <div className="roulette__progress" aria-label="추첨 진행률">
        <div className="roulette__progress-track">
          <div className="roulette__progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <span>
          {drawnCount}/{totalNumbers}
        </span>
      </div>
    </div>
  );
}

export default RouletteWheel;
