import type { Unsubscribe } from 'firebase/database';
import { subscribeToTickets, type TicketRecord, type TicketsMap } from './realtimeListeners';

export interface TicketBoardEntry extends TicketRecord {
  id: string;
}

export interface TicketBoardDiff {
  added: TicketBoardEntry[];
  updated: TicketBoardEntry[];
  removed: string[];
}

export interface TicketBoardUpdate {
  tickets: TicketBoardEntry[];
  total: number;
  diff: TicketBoardDiff;
}

export interface TicketBoardSubscriptionOptions {
  sessionKey?: string;
  clientId?: string;
  onUpdate(update: TicketBoardUpdate): void;
  onError?: (error: unknown) => void;
}

const FALLBACK_NAME = '이름 미상';

function cloneNumbers(values?: number[]): number[] {
  return Array.isArray(values) ? [...values] : [];
}

function deepClone<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((entry) => deepClone(entry)) as unknown as T;
  }

  if (value && typeof value === 'object') {
    const clone: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      clone[key] = deepClone(val);
    }
    return clone as T;
  }

  return value;
}

function normalizeName(name?: string): string {
  const trimmed = name?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : FALLBACK_NAME;
}

function createTicketEntry(id: string, record: TicketRecord): TicketBoardEntry {
  return {
    ...record,
    id,
    name: normalizeName(record.name),
    numbers: cloneNumbers(record.numbers),
    matchedNumbers: cloneNumbers(record.matchedNumbers),
    metadata: record.metadata ? (deepClone(record.metadata) as Record<string, unknown>) : undefined
  };
}

function sortTicketsDescending(a: TicketBoardEntry, b: TicketBoardEntry): number {
  if (a.createdAt && b.createdAt && a.createdAt !== b.createdAt) {
    return b.createdAt.localeCompare(a.createdAt);
  }

  if (a.createdAt && !b.createdAt) {
    return -1;
  }

  if (!a.createdAt && b.createdAt) {
    return 1;
  }

  return a.name.localeCompare(b.name);
}

function arraysEqual(first?: number[], second?: number[]): boolean {
  const a = first ?? [];
  const b = second ?? [];

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

function stableSerialize(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableSerialize(entry)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, val]) => `${key}:${stableSerialize(val)}`);
    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value ?? null);
}

function areTicketsEqual(previous?: TicketRecord, next?: TicketRecord): boolean {
  if (!previous || !next) {
    return false;
  }

  if (previous === next) {
    return true;
  }

  return (
    previous.name === next.name &&
    previous.createdAt === next.createdAt &&
    previous.source === next.source &&
    arraysEqual(previous.numbers, next.numbers) &&
    arraysEqual(previous.matchedNumbers, next.matchedNumbers) &&
    stableSerialize(previous.metadata ?? {}) === stableSerialize(next.metadata ?? {})
  );
}

export function projectTickets(map: TicketsMap): TicketBoardEntry[] {
  return Object.entries(map)
    .map(([id, ticket]) => createTicketEntry(id, ticket))
    .sort(sortTicketsDescending);
}

export function diffTicketMaps(previous: TicketsMap, next: TicketsMap): TicketBoardDiff {
  const removed: string[] = [];
  const added: TicketBoardEntry[] = [];
  const updated: TicketBoardEntry[] = [];

  const previousIds = new Set(Object.keys(previous));
  const nextIds = new Set(Object.keys(next));

  for (const id of previousIds) {
    if (!nextIds.has(id)) {
      removed.push(id);
    }
  }

  for (const id of nextIds) {
    if (!previousIds.has(id)) {
      added.push(createTicketEntry(id, next[id]));
      continue;
    }

    if (!areTicketsEqual(previous[id], next[id])) {
      updated.push(createTicketEntry(id, next[id]));
    }
  }

  added.sort(sortTicketsDescending);
  updated.sort(sortTicketsDescending);

  return {
    added,
    updated,
    removed
  };
}

export function subscribeToTicketBoard(options: TicketBoardSubscriptionOptions): Unsubscribe {
  let previousMap: TicketsMap = {};

  return subscribeToTickets({
    sessionKey: options.sessionKey,
    clientId: options.clientId,
    onData: (nextMap) => {
      const diff = diffTicketMaps(previousMap, nextMap);
      previousMap = nextMap;
      const tickets = projectTickets(nextMap);

      options.onUpdate({
        tickets,
        total: tickets.length,
        diff
      });
    },
    onError: options.onError
  });
}
