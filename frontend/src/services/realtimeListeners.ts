import {
  onValue,
  type Database,
  type DataSnapshot,
  type Unsubscribe,
  type DatabaseReference
} from 'firebase/database';
import { getDrawRef, getRealtimeDatabase, getSessionKey, getTicketsRef } from './firebaseClient';
import { logger } from './logger';

export interface TicketRecord {
  name: string;
  numbers: number[];
  matchedNumbers: number[];
  createdAt?: string;
  source?: 'manual' | 'auto';
  metadata?: Record<string, unknown>;
}

export type TicketsMap = Record<string, TicketRecord>;

export interface DrawErrorState {
  code?: string;
  message?: string;
  timestamp?: string;
}

export type DrawStatus = 'idle' | 'in_progress' | 'completed' | 'error';

export interface DrawState {
  numbers: number[];
  seed: string | null;
  startedAt: string | null;
  completedAt: string | null;
  status: DrawStatus;
  controllerId: string | null;
  error?: DrawErrorState | null;
}

interface TicketsListenerOptions {
  onData: (tickets: TicketsMap) => void;
  onError?: (error: unknown) => void;
  database?: Database;
  sessionKey?: string;
  clientId?: string;
}

interface DrawListenerOptions {
  onData: (state: DrawState | null) => void;
  onError?: (error: unknown) => void;
  database?: Database;
  sessionKey?: string;
}

function ensureNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value
    .map((entry) => Number(entry))
    .filter((entry) => Number.isFinite(entry))
    .sort((a, b) => a - b);
}

function ensureUnsortedNumberArray(value: unknown): number[] {
  if (!Array.isArray(value)) {
    return [];
  }
  return value.map((entry) => Number(entry)).filter((entry) => Number.isFinite(entry));
}

function normalizeTicketEntry(rawTicket: unknown): TicketRecord | undefined {
  if (!rawTicket || typeof rawTicket !== 'object') {
    return undefined;
  }

  const record = rawTicket as Record<string, unknown>;
  const numbers = ensureNumberArray(record.numbers);

  return {
    name: typeof record.name === 'string' ? record.name : '',
    numbers,
    matchedNumbers: ensureNumberArray(record.matchedNumbers),
    createdAt: typeof record.createdAt === 'string' ? record.createdAt : undefined,
    source: record.source === 'manual' || record.source === 'auto' ? record.source : undefined,
    metadata: typeof record.metadata === 'object' && record.metadata !== null ? (record.metadata as Record<string, unknown>) : undefined
  };
}

function ticketsFromSnapshot(snapshot: DataSnapshot): TicketsMap {
  const value = snapshot.val();
  if (!value || typeof value !== 'object') {
    return {};
  }

  const entries = Object.entries(value as Record<string, unknown>);
  const tickets: TicketsMap = {};

  for (const [ticketId, ticketPayload] of entries) {
    const normalized = normalizeTicketEntry(ticketPayload);
    if (normalized) {
      tickets[ticketId] = normalized;
    }
  }

  return tickets;
}

function normalizeDrawState(snapshot: DataSnapshot): DrawState | null {
  const value = snapshot.val();
  if (!value || typeof value !== 'object') {
    return null;
  }

  const record = value as Record<string, unknown>;

  const status = record.status;
  const drawStatus: DrawStatus =
    status === 'idle' || status === 'in_progress' || status === 'completed' || status === 'error' ? status : 'idle';

  const error = record.error;
  const normalizedError: DrawErrorState | null =
    error && typeof error === 'object'
      ? {
          code: typeof (error as Record<string, unknown>).code === 'string' ? (error as Record<string, unknown>).code : undefined,
          message:
            typeof (error as Record<string, unknown>).message === 'string'
              ? (error as Record<string, unknown>).message
              : undefined,
          timestamp:
            typeof (error as Record<string, unknown>).timestamp === 'string'
              ? (error as Record<string, unknown>).timestamp
              : undefined
        }
      : null;

  return {
    numbers: ensureUnsortedNumberArray(record.numbers),
    seed: typeof record.seed === 'string' ? record.seed : null,
    startedAt: typeof record.startedAt === 'string' ? record.startedAt : null,
    completedAt: typeof record.completedAt === 'string' ? record.completedAt : null,
    status: drawStatus,
    controllerId: typeof record.controllerId === 'string' ? record.controllerId : null,
    error: normalizedError
  };
}

function attachListener(ref: DatabaseReference, callback: Parameters<typeof onValue>[1], onError?: (error: unknown) => void): Unsubscribe {
  return onValue(
    ref,
    callback,
    (error) => {
      onError?.(error);
    }
  );
}

export function subscribeToTickets(options: TicketsListenerOptions): Unsubscribe {
  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const log = logger.scoped('list');

  log.info('subscribe', {
    payload: {
      sessionKey,
      clientId: options.clientId
    }
  });

  const unsubscribe = attachListener(
    getTicketsRef(database, sessionKey),
    (snapshot) => {
      const tickets = ticketsFromSnapshot(snapshot);
      log.info('update', {
        payload: {
          sessionKey,
          ticketCount: Object.keys(tickets).length
        }
      });
      options.onData(tickets);
    },
    (error) => {
      log.error('error', {
        error,
        payload: {
          sessionKey
        }
      });
      options.onError?.(error);
    }
  );

  return unsubscribe;
}

export function subscribeToDraw(options: DrawListenerOptions): Unsubscribe {
  const database = options.database ?? getRealtimeDatabase();
  const sessionKey = options.sessionKey ?? getSessionKey();
  const log = logger.scoped('draw');

  log.info('subscribe', {
    payload: {
      sessionKey
    }
  });

  const unsubscribe = attachListener(
    getDrawRef(database, sessionKey),
    (snapshot) => {
      const drawState = normalizeDrawState(snapshot);
      log.info('update', {
        payload: {
          sessionKey,
          status: drawState?.status ?? 'missing',
          numbers: drawState?.numbers.length ?? 0
        }
      });
      options.onData(drawState);
    },
    (error) => {
      log.error('error', {
        error,
        payload: {
          sessionKey
        }
      });
      options.onError?.(error);
    }
  );

  return unsubscribe;
}

export type { TicketsListenerOptions, DrawListenerOptions };
