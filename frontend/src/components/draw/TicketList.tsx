import { useEffect, useMemo, useRef, useState } from 'react';
import TicketListItem from './TicketListItem';
import type { TicketBoardEntry } from '../../services/ticketSubscription';

const ITEM_HEIGHT = 152;
const OVERSCAN = 4;
const DEFAULT_VIEWPORT_HEIGHT = 480;

interface TicketListProps {
  tickets: TicketBoardEntry[];
  isLoading: boolean;
  error?: unknown | null;
  emptyMessage?: string;
}

interface VirtualizationWindow {
  visible: TicketBoardEntry[];
  totalHeight: number;
  offset: number;
}

function useVirtualizationWindow(
  tickets: TicketBoardEntry[],
  scrollTop: number,
  viewportHeight: number
): VirtualizationWindow {
  if (tickets.length === 0) {
    return {
      visible: [],
      totalHeight: 0,
      offset: 0
    };
  }

  const safeViewport = viewportHeight || DEFAULT_VIEWPORT_HEIGHT;
  const startIndex = Math.max(0, Math.floor(scrollTop / ITEM_HEIGHT) - OVERSCAN);
  const visibleCount = Math.ceil(safeViewport / ITEM_HEIGHT) + OVERSCAN * 2;
  const endIndex = Math.min(tickets.length, startIndex + visibleCount);

  return {
    visible: tickets.slice(startIndex, endIndex),
    totalHeight: tickets.length * ITEM_HEIGHT,
    offset: startIndex * ITEM_HEIGHT
  };
}

function TicketList({ tickets, isLoading, error, emptyMessage = '발행된 티켓이 없습니다.' }: TicketListProps): JSX.Element {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);

  useEffect(() => {
    const viewport = viewportRef.current;
    if (!viewport) {
      return;
    }

    const handleScroll = (): void => {
      setScrollTop(viewport.scrollTop);
    };

    const updateHeight = (): void => {
      setViewportHeight(viewport.clientHeight || DEFAULT_VIEWPORT_HEIGHT);
    };

    viewport.addEventListener('scroll', handleScroll, { passive: true });
    updateHeight();

    let resizeObserver: ResizeObserver | null = null;

    if (typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === viewport) {
            setViewportHeight(entry.contentRect.height || DEFAULT_VIEWPORT_HEIGHT);
          }
        }
      });
      resizeObserver.observe(viewport);
    } else {
      window.addEventListener('resize', updateHeight);
    }

    return () => {
      viewport.removeEventListener('scroll', handleScroll);
      if (resizeObserver) {
        resizeObserver.disconnect();
      } else {
        window.removeEventListener('resize', updateHeight);
      }
    };
  }, []);

  useEffect(() => {
    setScrollTop((current) => {
      const maxScroll = Math.max(0, tickets.length * ITEM_HEIGHT - viewportHeight);
      return Math.min(current, maxScroll);
    });
  }, [tickets.length, viewportHeight]);

  const virtualization = useMemo(() => useVirtualizationWindow(tickets, scrollTop, viewportHeight), [tickets, scrollTop, viewportHeight]);

  if (isLoading) {
    return (
      <div className="ticket-list__state" data-testid="ticket-board-loading" role="status">
        실시간 보드를 불러오는 중입니다…
      </div>
    );
  }

  if (error) {
    return (
      <div className="ticket-list__state ticket-list__state--error" data-testid="ticket-board-error" role="alert">
        티켓 보드를 불러오지 못했습니다. 잠시 후 다시 시도해주세요.
      </div>
    );
  }

  if (tickets.length === 0) {
    return (
      <div className="ticket-list__state" data-testid="ticket-board-empty">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="ticket-list" role="region" aria-live="polite">
      <div className="ticket-list__viewport" ref={viewportRef} data-testid="ticket-board-viewport">
        <div className="ticket-list__spacer" style={{ height: `${virtualization.totalHeight}px` }}>
          <div className="ticket-list__items" style={{ transform: `translateY(${virtualization.offset}px)` }} role="list">
            {virtualization.visible.map((ticket) => (
              <TicketListItem key={ticket.id} ticket={ticket} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default TicketList;
