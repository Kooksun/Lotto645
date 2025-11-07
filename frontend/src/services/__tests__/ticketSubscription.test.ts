import { describe, expect, it } from 'vitest';
import { diffTicketMaps, projectTickets } from '../ticketSubscription';
import type { TicketRecord, TicketsMap } from '../realtimeListeners';

function buildTicket(overrides: Partial<TicketRecord> = {}): TicketRecord {
  return {
    name: overrides.name ?? 'Tester',
    numbers: overrides.numbers ?? [1, 2, 3, 4, 5, 6],
    matchedNumbers: overrides.matchedNumbers ?? [],
    createdAt: overrides.createdAt ?? '2025-01-01T00:00:00.000Z',
    source: overrides.source ?? 'manual',
    metadata: overrides.metadata ?? { clientId: 'local' }
  };
}

describe('ticketSubscription diffing', () => {
  it('detects added, updated, and removed tickets between snapshots', () => {
    const previous: TicketsMap = {
      alpha: buildTicket({ name: 'Alpha', createdAt: '2025-01-01T00:00:00.000Z' }),
      bravo: buildTicket({ name: 'Bravo', createdAt: '2025-01-01T01:00:00.000Z', matchedNumbers: [1] })
    };

    const next: TicketsMap = {
      bravo: buildTicket({ name: 'Bravo', createdAt: '2025-01-01T01:00:00.000Z', matchedNumbers: [1, 45] }),
      charlie: buildTicket({ name: 'Charlie', createdAt: '2025-01-02T10:00:00.000Z', source: 'auto' })
    };

    const diff = diffTicketMaps(previous, next);

    expect(diff.added).toHaveLength(1);
    expect(diff.added[0].id).toBe('charlie');
    expect(diff.added[0].name).toBe('Charlie');

    expect(diff.updated).toHaveLength(1);
    expect(diff.updated[0].id).toBe('bravo');
    expect(diff.updated[0].matchedNumbers).toEqual([1, 45]);

    expect(diff.removed).toEqual(['alpha']);
  });

  it('treats metadata mutations as updates to preserve audit fidelity', () => {
    const previous: TicketsMap = {
      alpha: buildTicket({ metadata: { clientId: 'one', issuedBy: 'host' } })
    };

    const next: TicketsMap = {
      alpha: buildTicket({ metadata: { clientId: 'one', issuedBy: 'super-host' } })
    };

    const diff = diffTicketMaps(previous, next);
    expect(diff.added).toHaveLength(0);
    expect(diff.removed).toHaveLength(0);
    expect(diff.updated.map((ticket) => ticket.id)).toEqual(['alpha']);
  });
});

describe('ticketSubscription projections', () => {
  it('sorts projected tickets by createdAt descending with fallback to name', () => {
    const map: TicketsMap = {
      beta: buildTicket({ name: 'Beta', createdAt: '2025-01-04T12:00:00.000Z' }),
      alpha: buildTicket({ name: 'Alpha', createdAt: '2025-01-01T08:00:00.000Z' }),
      delta: buildTicket({ name: 'Delta' }),
      gamma: buildTicket({ name: 'Gamma', createdAt: '2025-01-04T09:30:00.000Z' })
    };

    const projected = projectTickets(map);
    expect(projected.map((ticket) => ticket.id)).toEqual(['beta', 'gamma', 'alpha', 'delta']);
  });
});
