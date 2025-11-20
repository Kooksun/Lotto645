import { useEffect, useState } from 'react';
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

  // Rapid cycling state
  const [displayNumber, setDisplayNumber] = useState<string>('--');
  const [isPulsing, setIsPulsing] = useState(false);

  useEffect(() => {
    if (status !== 'in_progress') {
      if (activeNumber !== null) {
        setDisplayNumber(activeNumber.toString().padStart(2, '0'));
      } else {
        setDisplayNumber('--');
      }
      return;
    }

    // If we have a stable active number (meaning a draw just happened or is holding), show it.
    // But "in_progress" covers the whole duration.
    // We want to cycle when waiting for the next number?
    // Actually, `activeNumber` updates when a number is drawn.
    // Between draws, `activeNumber` holds the last drawn number.
    // We want to cycle *before* a number is drawn?
    // The current `useDrawController` doesn't explicitly signal "rolling".
    // It just updates `activeNumber` every 5 seconds.
    // Let's simulate rolling if `countdownSeconds` is small (e.g. < 2) or just always roll if we want "dynamic"?
    // Better: Trigger a short roll effect when `activeNumber` changes?
    // Or roll continuously?
    // Let's try: Roll continuously, but stop on `activeNumber` update for a moment?
    // Simpler approach:
    // If `status` is `in_progress`, we can cycle numbers randomly.
    // When `activeNumber` changes (new draw), we stop cycling and show the new number with a pulse.

    // However, `activeNumber` persists.
    // Let's use a local effect that triggers on `activeNumber` change.

  }, [status, activeNumber]);

  // New approach for visual flair:
  // When `activeNumber` changes and is not null, trigger a "success" pulse.
  useEffect(() => {
    if (activeNumber !== null) {
      setDisplayNumber(activeNumber.toString().padStart(2, '0'));
      setIsPulsing(true);
      const timer = setTimeout(() => setIsPulsing(false), 1000);
      return () => clearTimeout(timer);
    }
  }, [activeNumber]);

  // Rolling effect:
  // If status is in_progress and we are waiting (e.g. countdown > 0), maybe roll?
  // But we want to see the last drawn number too.
  // Let's just add a subtle "active" animation to the ring instead of changing the number,
  // and pulse the number when it updates.

  return (
    <div className="roulette" data-status={status} data-testid="roulette-wheel" role="region" aria-live="polite">
      <div className="roulette__ring">
        <div className="roulette__ring-gradient" aria-hidden="true" />
        <div className="roulette__ring-core">
          <p className="roulette__status">{statusLabel}</p>
          <strong
            className={`roulette__number${isPulsing ? ' is-pulsing' : ''}`}
            data-testid="roulette-active-number"
          >
            {displayNumber}
          </strong>
          <p className="roulette__countdown" data-testid="roulette-countdown">
            {formatCountdown(countdownSeconds)}
          </p>
        </div>
      </div>

    </div>
  );
}

export default RouletteWheel;
