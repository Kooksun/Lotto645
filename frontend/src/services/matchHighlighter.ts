import { update, type Database } from 'firebase/database';
import { getRealtimeDatabase, getSessionKey, getSessionRef } from './firebaseClient';
import { logger } from './logger';
import type { TicketsMap } from './realtimeListeners';

export interface MatchHighlighterOptions {
  ticketsMap: TicketsMap;
  drawnNumbers: number[];
  sessionKey?: string;
  database?: Database;
}

const log = logger.scoped('draw');

function arraysEqual(a: number[], b: number[]): boolean {
  if (a.length !== b.length) {
    return false;
  }
  for (let index = 0; index < a.length; index += 1) {
    if (a[index] !== b[index]) {
      return false;
    }
  }
  return true;
}

export async function syncMatchedNumbers(options: MatchHighlighterOptions): Promise<void> {
  const ticketsEntries = Object.entries(options.ticketsMap ?? {});
  if (ticketsEntries.length === 0) {
    return;
  }

  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const drawnNumbers = [...options.drawnNumbers].filter((number) => Number.isFinite(number));
  const drawnSet = new Set(drawnNumbers);
  const updates: Record<string, number[]> = {};

  for (const [ticketId, ticket] of ticketsEntries) {
    const ticketNumbers = Array.isArray(ticket.numbers) ? ticket.numbers : [];
    const matches = ticketNumbers.filter((number) => drawnSet.has(number)).sort((a, b) => a - b);
    const currentMatches = Array.isArray(ticket.matchedNumbers) ? ticket.matchedNumbers.slice().sort((a, b) => a - b) : [];

    if (!arraysEqual(matches, currentMatches)) {
      updates[`tickets/${ticketId}/matchedNumbers`] = matches;
    }
  }

  if (Object.keys(updates).length === 0) {
    return;
  }

  try {
    await update(getSessionRef(database, sessionKey), updates);
    log.info('highlight', {
      payload: {
        sessionKey,
        ticketsUpdated: Object.keys(updates).length
      }
    });
  } catch (error) {
    log.error('error', {
      error,
      payload: {
        sessionKey,
        stage: 'highlight'
      }
    });
    throw error;
  }
}
