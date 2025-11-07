import { set, type Database } from 'firebase/database';
import { getRealtimeDatabase, getSessionKey, getSessionRef } from './firebaseClient';
import { logger } from './logger';

export interface ResetSessionOptions {
  sessionKey?: string;
  database?: Database;
  ticketCount?: number;
  drawNumbers?: number[];
}

const log = logger.scoped('reset');

export async function resetSession(options: ResetSessionOptions = {}): Promise<void> {
  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const ticketCount = options.ticketCount ?? 0;
  const drawNumbers = Array.isArray(options.drawNumbers) ? options.drawNumbers : [];

  log.info('start', {
    payload: {
      sessionKey,
      ticketCount,
      drawNumbers
    }
  });

  try {
    await set(getSessionRef(database, sessionKey), {
      draw: {
        numbers: [],
        seed: null,
        startedAt: null,
        completedAt: null,
        status: 'idle',
        controllerId: null,
        error: null
      },
      tickets: {}
    });

    log.info('success', {
      payload: {
        sessionKey
      }
    });
  } catch (error) {
    log.error('error', {
      error,
      payload: {
        sessionKey
      }
    });
    throw error;
  }
}
