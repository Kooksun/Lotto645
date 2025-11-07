import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { LOTTO_SELECTION_SIZE } from '../constants/lotto';
import { appendDrawNumber, startDraw } from '../services/drawService';
import { syncMatchedNumbers } from '../services/matchHighlighter';
import { resetSession as resetSessionService } from '../services/resetService';
import type { DrawState, TicketsMap } from '../services/realtimeListeners';

export interface DrawTimelineEntry {
  index: number;
  number: number | null;
  status: 'pending' | 'active' | 'complete';
}

export interface UseDrawControllerOptions {
  drawState: DrawState | null;
  ticketsMap: TicketsMap;
  sessionKey: string;
  clientId: string;
  intervalMs?: number;
}

export interface DrawControllerState {
  status: DrawState['status'];
  numbers: number[];
  activeNumber: number | null;
  countdownSeconds: number | null;
  timeline: DrawTimelineEntry[];
  seed: string | null;
  startedAt: string | null;
  completedAt: string | null;
  controllerId: string | null;
  isController: boolean;
  canStart: boolean;
  canForceNext: boolean;
  canReset: boolean;
  isStarting: boolean;
  isStepping: boolean;
  isResetting: boolean;
  error: string | null;
  startDraw(): Promise<void>;
  forceNext(): Promise<void>;
  resetSession(): Promise<void>;
}

const DEFAULT_INTERVAL_MS = 5000;
const COUNTDOWN_TICK_MS = 250;

function toSeconds(value: number | null): number | null {
  if (value === null || Number.isNaN(value)) {
    return null;
  }
  return Math.max(0, Math.ceil(value / 1000));
}

function formatError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return '알 수 없는 오류가 발생했습니다.';
}

export function useDrawController(options: UseDrawControllerOptions): DrawControllerState {
  const drawState = options.drawState;
  const numbers = drawState?.numbers ?? [];
  const status = drawState?.status ?? 'idle';
  const seed = drawState?.seed ?? null;
  const startedAt = drawState?.startedAt ?? null;
  const completedAt = drawState?.completedAt ?? null;
  const controllerId = drawState?.controllerId ?? null;
  const isController = !controllerId || controllerId === options.clientId;
  const intervalMs = options.intervalMs ?? DEFAULT_INTERVAL_MS;

  const [isStarting, setIsStarting] = useState(false);
  const [isStepping, setIsStepping] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [nextRunAt, setNextRunAt] = useState<number | null>(null);
  const [nowTick, setNowTick] = useState<number>(() => Date.now());

  const autoStepTimeout = useRef<number | null>(null);
  const stepInFlight = useRef(false);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    const id = window.setInterval(() => {
      setNowTick(Date.now());
    }, COUNTDOWN_TICK_MS);

    return () => {
      window.clearInterval(id);
    };
  }, []);

  const clearAutoStepTimeout = useCallback(() => {
    if (autoStepTimeout.current) {
      clearTimeout(autoStepTimeout.current);
      autoStepTimeout.current = null;
    }
  }, []);

  const performStep = useCallback(async () => {
    if (stepInFlight.current || status !== 'in_progress' || numbers.length >= LOTTO_SELECTION_SIZE) {
      return;
    }

    stepInFlight.current = true;
    setIsStepping(true);
    setActionError(null);

    try {
      await appendDrawNumber({
        sessionKey: options.sessionKey,
        clientId: options.clientId
      });
    } catch (error) {
      if (mountedRef.current) {
        setActionError(formatError(error));
      }
    } finally {
      stepInFlight.current = false;
      if (mountedRef.current) {
        setIsStepping(false);
      }
    }
  }, [numbers.length, options.clientId, options.sessionKey, status]);

  useEffect(() => {
    clearAutoStepTimeout();
    if (status !== 'in_progress' || numbers.length >= LOTTO_SELECTION_SIZE || !isController) {
      setNextRunAt(null);
      return;
    }

    setNextRunAt(Date.now() + intervalMs);
    autoStepTimeout.current = window.setTimeout(() => {
      void performStep();
    }, intervalMs);

    return () => {
      clearAutoStepTimeout();
    };
  }, [status, numbers.length, isController, intervalMs, performStep, clearAutoStepTimeout]);

  useEffect(() => {
    return () => {
      clearAutoStepTimeout();
    };
  }, [clearAutoStepTimeout]);

  useEffect(() => {
    let cancelled = false;
    if (!options.ticketsMap) {
      return undefined;
    }

    async function runHighlight(): Promise<void> {
      try {
        await syncMatchedNumbers({
          sessionKey: options.sessionKey,
          ticketsMap: options.ticketsMap,
          drawnNumbers: numbers
        });
      } catch (error) {
        if (!cancelled && mountedRef.current) {
          setActionError((previous) => previous ?? formatError(error));
        }
      }
    }

    void runHighlight();

    return () => {
      cancelled = true;
    };
  }, [numbers, options.sessionKey, options.ticketsMap]);

  const handleStartDraw = useCallback(async () => {
    if (!isController && controllerId) {
      setActionError('다른 호스트가 추첨을 제어 중입니다.');
      return;
    }

    if (isStarting || numbers.length > 0 || status === 'in_progress') {
      return;
    }

    setIsStarting(true);
    setActionError(null);

    try {
      await startDraw({
        sessionKey: options.sessionKey,
        clientId: options.clientId
      });
    } catch (error) {
      if (mountedRef.current) {
        setActionError(formatError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsStarting(false);
      }
    }
  }, [isStarting, numbers.length, options.clientId, options.sessionKey, status]);

  const handleForceNext = useCallback(async () => {
    if (!isController) {
      setActionError('현재 추첨 제어권이 없어 즉시 추첨을 실행할 수 없습니다.');
      return;
    }

    if (status !== 'in_progress' || numbers.length >= LOTTO_SELECTION_SIZE) {
      return;
    }

    clearAutoStepTimeout();
    await performStep();
  }, [clearAutoStepTimeout, numbers.length, performStep, status]);

  const handleReset = useCallback(async () => {
    if (isResetting) {
      return;
    }

    if (!isController && controllerId && status === 'in_progress') {
      setActionError('진행 중에는 제어 중인 호스트만 초기화할 수 있습니다.');
      return;
    }

    setIsResetting(true);
    setActionError(null);
    clearAutoStepTimeout();

    try {
      await resetSessionService({
        sessionKey: options.sessionKey,
        ticketCount: Object.keys(options.ticketsMap ?? {}).length,
        drawNumbers: numbers
      });
    } catch (error) {
      if (mountedRef.current) {
        setActionError(formatError(error));
      }
    } finally {
      if (mountedRef.current) {
        setIsResetting(false);
      }
    }
  }, [clearAutoStepTimeout, isResetting, numbers, options.sessionKey, options.ticketsMap]);

  const countdownSeconds = useMemo(() => {
    if (nextRunAt === null) {
      return null;
    }
    return toSeconds(nextRunAt - nowTick);
  }, [nextRunAt, nowTick]);

  const timeline = useMemo<DrawTimelineEntry[]>(() => {
    return Array.from({ length: LOTTO_SELECTION_SIZE }, (_, index) => {
      const number = numbers[index] ?? null;
      let slotStatus: DrawTimelineEntry['status'] = 'pending';
      if (number !== null) {
        slotStatus = index === numbers.length - 1 && status === 'in_progress' ? 'active' : 'complete';
      } else if (status === 'in_progress' && index === numbers.length) {
        slotStatus = 'active';
      }
      return {
        index: index + 1,
        number,
        status: slotStatus
      };
    });
  }, [numbers, status]);

  const canStart = numbers.length === 0 && status !== 'in_progress' && !isStarting && isController;
  const canForceNext =
    status === 'in_progress' && numbers.length < LOTTO_SELECTION_SIZE && !isStepping && isController;
  const canReset = !isResetting && (isController || !controllerId || status !== 'in_progress');
  const activeNumber = numbers.length > 0 ? numbers[numbers.length - 1] : null;
  const error = actionError ?? drawState?.error?.message ?? null;

  return {
    status,
    numbers,
    activeNumber,
    countdownSeconds,
    timeline,
    seed,
    startedAt,
    completedAt,
    controllerId,
    isController,
    canStart,
    canForceNext,
    canReset,
    isStarting,
    isStepping,
    isResetting,
    error,
    startDraw: handleStartDraw,
    forceNext: handleForceNext,
    resetSession: handleReset
  };
}
