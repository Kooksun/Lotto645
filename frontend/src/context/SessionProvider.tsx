import { createContext, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { getSessionKey } from '../services/firebaseClient';
import {
  subscribeToDraw,
  subscribeToTickets,
  type DrawState,
  type TicketsMap,
  type TicketRecord
} from '../services/realtimeListeners';

interface SessionErrors {
  tickets?: unknown;
  draw?: unknown;
}

export type TicketWithId = TicketRecord & { id: string };

export interface SessionContextValue {
  sessionKey: string;
  clientId: string;
  ticketsMap: TicketsMap;
  tickets: TicketWithId[];
  draw: DrawState | null;
  isTicketsLoading: boolean;
  isDrawLoading: boolean;
  errors: SessionErrors;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

function createClientId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `client-${Math.random().toString(16).slice(2)}-${Date.now()}`;
}

function sortTickets(entries: Array<[string, TicketRecord]>): TicketWithId[] {
  return entries
    .map(([id, ticket]) => ({ ...ticket, id }))
    .sort((a, b) => {
      if (a.createdAt && b.createdAt) {
        return b.createdAt.localeCompare(a.createdAt);
      }
      if (a.createdAt) {
        return -1;
      }
      if (b.createdAt) {
        return 1;
      }
      return a.name.localeCompare(b.name);
    });
}

export function SessionProvider({ children }: { children: ReactNode }): JSX.Element {
  const sessionKey = getSessionKey();
  const clientIdRef = useRef<string>();
  const [ticketsMap, setTicketsMap] = useState<TicketsMap>({});
  const [drawState, setDrawState] = useState<DrawState | null>(null);
  const [ticketsLoading, setTicketsLoading] = useState(true);
  const [drawLoading, setDrawLoading] = useState(true);
  const [errors, setErrors] = useState<SessionErrors>({});

  if (!clientIdRef.current) {
    clientIdRef.current = createClientId();
  }

  useEffect(() => {
    setTicketsLoading(true);
    setErrors((prev) => ({ ...prev, tickets: undefined }));

    const unsubscribe = subscribeToTickets({
      sessionKey,
      clientId: clientIdRef.current,
      onData: (tickets) => {
        setTicketsMap(tickets);
        setTicketsLoading(false);
      },
      onError: (error) => {
        setErrors((prev) => ({ ...prev, tickets: error }));
        setTicketsLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionKey]);

  useEffect(() => {
    setDrawLoading(true);
    setErrors((prev) => ({ ...prev, draw: undefined }));

    const unsubscribe = subscribeToDraw({
      sessionKey,
      onData: (state) => {
        setDrawState(state);
        setDrawLoading(false);
      },
      onError: (error) => {
        setErrors((prev) => ({ ...prev, draw: error }));
        setDrawLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, [sessionKey]);

  const tickets = useMemo(() => sortTickets(Object.entries(ticketsMap)), [ticketsMap]);

  const value = useMemo<SessionContextValue>(
    () => ({
      sessionKey,
      clientId: clientIdRef.current as string,
      ticketsMap,
      tickets,
      draw: drawState,
      isTicketsLoading: ticketsLoading,
      isDrawLoading: drawLoading,
      errors
    }),
    [sessionKey, ticketsMap, tickets, drawState, ticketsLoading, drawLoading, errors]
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionContextValue {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
