import { push, set, type Database } from 'firebase/database';
import { LOTTO_MAX_NUMBER, LOTTO_MIN_NUMBER, LOTTO_SELECTION_SIZE } from '../constants/lotto';
import { getRealtimeDatabase, getSessionKey, getTicketsRef } from './firebaseClient';
import { logger } from './logger';

const log = logger.scoped('issue');

export type TicketSource = 'manual' | 'auto';

export interface IssueTicketInput {
  name: string;
  numbers: number[];
  source?: TicketSource;
  clientId?: string;
  metadata?: Record<string, unknown>;
  sessionKey?: string;
  database?: Database;
}

export interface IssueTicketResult {
  ticketId: string;
}

function sanitizeName(name: string): string {
  return name?.trim() ?? '';
}

function normalizeNumbers(numbers: number[]): number[] {
  const filtered = numbers
    .map((value) => Number(value))
    .filter(
      (value) => Number.isInteger(value) && value >= LOTTO_MIN_NUMBER && value <= LOTTO_MAX_NUMBER
    );
  const unique = Array.from(new Set(filtered)).sort((a, b) => a - b);

  if (unique.length !== LOTTO_SELECTION_SIZE) {
    throw new Error(`[ticketService] Ticket must contain ${LOTTO_SELECTION_SIZE} unique numbers`);
  }

  return unique;
}

export async function issueTicket(input: IssueTicketInput): Promise<IssueTicketResult> {
  const database = input.database ?? getRealtimeDatabase();
  const sessionKey = input.sessionKey ?? getSessionKey();
  const sanitizedName = sanitizeName(input.name);

  if (!sanitizedName) {
    throw new Error('[ticketService] Player name is required');
  }

  const numbers = normalizeNumbers(input.numbers);
  const ticketRef = push(getTicketsRef(database, sessionKey));
  const ticketId = ticketRef.key;

  if (!ticketId) {
    throw new Error('[ticketService] Failed to allocate ticket id');
  }

  const metadata = {
    ...(input.metadata ?? {}),
    ...(input.clientId ? { clientId: input.clientId } : {})
  };

  log.info('start', {
    payload: {
      sessionKey,
      name: sanitizedName,
      source: input.source ?? 'manual'
    }
  });

  const ticketPayload: Record<string, unknown> = {
    name: sanitizedName,
    numbers,
    matchedNumbers: [],
    createdAt: new Date().toISOString(),
    source: input.source ?? 'manual'
  };

  if (Object.keys(metadata).length > 0) {
    ticketPayload.metadata = metadata;
  }

  try {
    await set(ticketRef, ticketPayload);
    log.info('success', {
      payload: {
        ticketId,
        sessionKey
      }
    });
    return { ticketId };
  } catch (error) {
    log.error('error', {
      error,
      payload: {
        sessionKey,
        ticketId
      }
    });
    throw error;
  }
}
