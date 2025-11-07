// @vitest-environment jsdom
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { DrawState, TicketsMap } from '../../services/realtimeListeners';
import { useDrawController, type UseDrawControllerOptions } from '../useDrawController';

vi.mock('../../services/drawService', () => ({
  startDraw: vi.fn(() => Promise.resolve()),
  appendDrawNumber: vi.fn(() =>
    Promise.resolve({
      number: 18,
      numbers: [18],
      completed: false
    })
  )
}));

vi.mock('../../services/matchHighlighter', () => ({
  syncMatchedNumbers: vi.fn(() => Promise.resolve())
}));

vi.mock('../../services/resetService', () => ({
  resetSession: vi.fn(() => Promise.resolve())
}));

const { startDraw, appendDrawNumber } = await import('../../services/drawService');
const { resetSession } = await import('../../services/resetService');

function buildDrawState(overrides: Partial<DrawState> = {}): DrawState {
  return {
    numbers: overrides.numbers ?? [],
    seed: overrides.seed ?? null,
    startedAt: overrides.startedAt ?? null,
    completedAt: overrides.completedAt ?? null,
    status: overrides.status ?? 'idle',
    controllerId: overrides.controllerId ?? null,
    error: overrides.error ?? null
  };
}

function buildOptions(
  overrides: Partial<UseDrawControllerOptions & { ticketsMap: TicketsMap }> = {}
): UseDrawControllerOptions {
  return {
    drawState: overrides.drawState ?? buildDrawState(),
    ticketsMap: overrides.ticketsMap ?? {},
    sessionKey: overrides.sessionKey ?? 'current',
    clientId: overrides.clientId ?? 'host-client',
    intervalMs: overrides.intervalMs ?? 250
  };
}

describe('useDrawController (spec)', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllTimers();
    vi.clearAllMocks();
  });

  it('starts a draw when idle and exposes loading flags', async () => {
    const { result } = renderHook((props: UseDrawControllerOptions) => useDrawController(props), {
      initialProps: buildOptions()
    });

    expect(result.current.canStart).toBe(true);

    await act(async () => {
      await result.current.startDraw();
    });

    expect(startDraw).toHaveBeenCalledTimes(1);
  });

  it('forces the next number when draw is in progress', async () => {
    const initial = buildOptions({
      drawState: buildDrawState({ status: 'in_progress', numbers: [4, 12], controllerId: 'host-client' })
    });

    const { result } = renderHook((props: UseDrawControllerOptions) => useDrawController(props), {
      initialProps: initial
    });

    expect(result.current.canForceNext).toBe(true);

    await act(async () => {
      await result.current.forceNext();
    });

    expect(appendDrawNumber).toHaveBeenCalledTimes(1);
  });

  it('automatically advances draw steps after the configured interval', async () => {
    const { result, rerender } = renderHook(
      (props: UseDrawControllerOptions) => useDrawController(props),
      {
        initialProps: buildOptions({
          drawState: buildDrawState({ status: 'in_progress', numbers: [7], controllerId: 'host-client' }),
          intervalMs: 200
        })
      }
    );

    expect(result.current.countdownSeconds).not.toBeNull();

    await vi.advanceTimersByTimeAsync(220);
    await act(async () => Promise.resolve());

    expect(appendDrawNumber).toHaveBeenCalledTimes(1);

    rerender(
      buildOptions({
        drawState: buildDrawState({ status: 'in_progress', numbers: [7, 19], controllerId: 'host-client' }),
        intervalMs: 200
      })
    );

    await vi.advanceTimersByTimeAsync(220);
    await act(async () => Promise.resolve());

    expect(appendDrawNumber).toHaveBeenCalledTimes(2);
  });

  it('resets session via resetService with derived counts', async () => {
    const ticketsMap: TicketsMap = {
      alpha: { name: 'Alpha', numbers: [1, 2, 3, 4, 5, 6], matchedNumbers: [], createdAt: '', source: 'manual' },
      beta: { name: 'Beta', numbers: [7, 8, 9, 10, 11, 12], matchedNumbers: [], createdAt: '', source: 'manual' }
    };

    const { result } = renderHook((props: UseDrawControllerOptions) => useDrawController(props), {
      initialProps: buildOptions({
        drawState: buildDrawState({
          status: 'completed',
          numbers: [3, 9, 12, 27, 40, 44],
          controllerId: 'host-client'
        }),
        ticketsMap
      })
    });

    await act(async () => {
      await result.current.resetSession();
    });

    expect(resetSession).toHaveBeenCalledWith(
      expect.objectContaining({
        ticketCount: 2,
        drawNumbers: [3, 9, 12, 27, 40, 44]
      })
    );
  });

  it('projects a six-slot timeline so the UI can render placeholders', () => {
    const { result } = renderHook((props: UseDrawControllerOptions) => useDrawController(props), {
      initialProps: buildOptions({
        drawState: buildDrawState({ status: 'in_progress', numbers: [1, 2, 3], controllerId: 'host-client' })
      })
    });

    expect(result.current.timeline).toHaveLength(6);
    expect(result.current.timeline[0].status).toBe('complete');
    expect(result.current.timeline[3].status).toBe('active');
    expect(result.current.timeline[5].status).toBe('pending');
  });
  it('does not run auto cadence when another client controls the draw', async () => {
    const { result } = renderHook((props: UseDrawControllerOptions) => useDrawController(props), {
      initialProps: buildOptions({
        drawState: buildDrawState({ status: 'in_progress', numbers: [10], controllerId: 'other-client' }),
        clientId: 'host-client',
        intervalMs: 200
      })
    });

    expect(result.current.canForceNext).toBe(false);

    await vi.advanceTimersByTimeAsync(500);
    await act(async () => Promise.resolve());

    expect(appendDrawNumber).not.toHaveBeenCalled();
  });
});
