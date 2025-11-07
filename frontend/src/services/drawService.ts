import { runTransaction, type Database } from 'firebase/database';
import { LOTTO_SELECTION_SIZE } from '../constants/lotto';
import { createDrawSeed, drawNextNumber } from './drawRng';
import { getDrawRef, getRealtimeDatabase, getSessionKey } from './firebaseClient';
import { logger } from './logger';
import type { DrawState } from './realtimeListeners';

export interface StartDrawOptions {
  sessionKey?: string;
  database?: Database;
  seed?: string;
  clientId?: string;
}

export interface DrawStepOptions {
  sessionKey?: string;
  database?: Database;
  clientId?: string;
}

export interface DrawStepResult {
  number: number;
  numbers: number[];
  completed: boolean;
}

const log = logger.scoped('draw');

function normalizeDrawState(snapshotValue: unknown): DrawState {
  if (!snapshotValue || typeof snapshotValue !== 'object') {
    return {
      numbers: [],
      seed: null,
      startedAt: null,
      completedAt: null,
      status: 'idle',
      error: null
    };
  }

  const value = snapshotValue as Record<string, unknown>;

  const rawNumbers = Array.isArray(value.numbers) ? (value.numbers as unknown[]) : [];
  const numbers = rawNumbers
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry));

  const status = value.status;
  const normalizedStatus: DrawState['status'] =
    status === 'in_progress' || status === 'completed' || status === 'error' ? status : 'idle';

  return {
    numbers,
    seed: typeof value.seed === 'string' ? value.seed : null,
    startedAt: typeof value.startedAt === 'string' ? value.startedAt : null,
    completedAt: typeof value.completedAt === 'string' ? value.completedAt : null,
    status: normalizedStatus,
    controllerId: typeof value.controllerId === 'string' ? value.controllerId : null,
    error: (value.error as DrawState['error']) ?? null
  };
}

export async function startDraw(options: StartDrawOptions = {}): Promise<void> {
  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const seed = options.seed ?? createDrawSeed();
  const drawRef = getDrawRef(database, sessionKey);
  const startedAt = new Date().toISOString();

  try {
    const result = await runTransaction(
      drawRef,
      (current) => {
        const state = normalizeDrawState(current);
        if (state.status === 'in_progress' || state.numbers.length > 0) {
          return undefined;
        }

        return {
          numbers: [],
          seed,
          startedAt,
          completedAt: null,
          status: 'in_progress',
          controllerId: options.clientId ?? null,
          error: null
        };
      },
      {
        applyLocally: false
      }
    );

    if (!result.committed) {
      throw new Error('[drawService] Draw already in progress or requires reset');
    }

    log.info('start', {
      payload: {
        sessionKey,
        seed,
        clientId: options.clientId
      }
    });
  } catch (error) {
    log.error('error', {
      error,
      payload: {
        sessionKey,
        stage: 'start'
      }
    });
    throw error;
  }
}

export async function appendDrawNumber(options: DrawStepOptions = {}): Promise<DrawStepResult> {
  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const drawRef = getDrawRef(database, sessionKey);

  try {
    const result = await runTransaction(
      drawRef,
      (current) => {
        const state = normalizeDrawState(current);

        if (
          state.status !== 'in_progress' ||
          state.numbers.length >= LOTTO_SELECTION_SIZE ||
          (state.controllerId && options.clientId && state.controllerId !== options.clientId)
        ) {
          return undefined;
        }

        const nextNumber = drawNextNumber(state.numbers);
        const numbers = [...state.numbers, nextNumber];
        const completed = numbers.length >= LOTTO_SELECTION_SIZE;

        return {
          ...state,
          numbers,
          status: completed ? 'completed' : 'in_progress',
          completedAt: completed ? new Date().toISOString() : null,
          error: null
        };
      },
      {
        applyLocally: false
      }
    );

    if (!result.committed) {
      throw new Error('[drawService] Draw step rejected');
    }

    const committedState = normalizeDrawState(result.snapshot.val());
    const numbers = committedState.numbers;
    const latestNumber = numbers[numbers.length - 1];

    if (typeof latestNumber !== 'number') {
      throw new Error('[drawService] Transaction did not yield a drawn number');
    }

    const completed = numbers.length >= LOTTO_SELECTION_SIZE;

    log.info('step', {
      payload: {
        sessionKey,
        number: latestNumber,
        stepIndex: numbers.length
      }
    });

    if (completed) {
      log.info('complete', {
        payload: {
          sessionKey,
          numbers
        }
      });
    }

    return {
      number: latestNumber,
      numbers,
      completed
    };
  } catch (error) {
    log.error('error', {
      error,
      payload: {
        sessionKey,
        stage: 'step'
      }
    });
    throw error;
  }
}
