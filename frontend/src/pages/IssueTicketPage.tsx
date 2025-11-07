import { useMemo, useState } from 'react';
import type { FormEvent } from 'react';
import NumberGrid from '../components/issue/NumberGrid';
import SelectionSummary from '../components/issue/SelectionSummary';
import { useNumberSelection } from '../hooks/useNumberSelection';
import { useAutoSelect } from '../hooks/useAutoSelect';
import { issueTicket, type TicketSource } from '../services/ticketService';
import { useSession } from '../context/SessionProvider';
import '../styles/issue-ticket.css';

interface ToastState {
  type: 'success' | 'error';
  message: string;
}

function IssueTicketPage(): JSX.Element {
  const selection = useNumberSelection();
  const session = useSession();
  const [playerName, setPlayerName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [toast, setToast] = useState<ToastState | null>(null);
  const [ticketSource, setTicketSource] = useState<TicketSource>('manual');

  const autoSelectState = useAutoSelect(selection, {
    onComplete: () => {
      setTicketSource('auto');
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : '자동 선택을 완료할 수 없습니다.';
      setFormError(message);
      setToast({ type: 'error', message });
    }
  });

  const { selectedNumbers, canSelectMore, isSelected, toggleNumber } = selection;
  const { autoSelect, isAutoSelecting, canAutoSelect, error: autoSelectError, resetError } = autoSelectState;

  const numberGridSelection = useMemo(
    () => ({
      selectedNumbers,
      canSelectMore,
      isSelected,
      toggleNumber(value: number) {
        setTicketSource('manual');
        resetError();
        toggleNumber(value);
      }
    }),
    [selectedNumbers, canSelectMore, isSelected, toggleNumber, resetError]
  );

  const summaryHelperText = `현재 ${selection.selectedNumbers.length} / 6개 선택`;
  const summaryError = autoSelectError instanceof Error ? autoSelectError.message : null;

  const canSubmit = selection.isComplete && playerName.trim().length > 0 && !isSubmitting;

  const handleAutoSelect = (): void => {
    setFormError(null);
    setToast(null);
    try {
      autoSelect();
    } catch {
      // handled via error state
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    if (!canSubmit) {
      return;
    }

    setIsSubmitting(true);
    setFormError(null);
    setToast(null);

    try {
      await issueTicket({
        name: playerName.trim(),
        numbers: selection.selectedNumbers,
        source: ticketSource,
        clientId: session.clientId,
        sessionKey: session.sessionKey
      });
      setToast({ type: 'success', message: '발행이 완료되었습니다.' });
      selection.reset();
      resetError();
      setPlayerName('');
      setTicketSource('manual');
    } catch (error) {
      const message = error instanceof Error ? error.message : '티켓 발행에 실패했습니다.';
      setFormError(message);
      setToast({ type: 'error', message: '발행에 실패했습니다.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <section className="issue-ticket issue-ticket--reference">
      <div className="issue-ticket__header">
        <div className="issue-ticket__name">
          <label htmlFor="player-name-input">이름</label>
          <input
            id="player-name-input"
            data-testid="player-name-input"
            className="issue-ticket__name-input"
            type="text"
            maxLength={40}
            placeholder="이름을 입력해주세요"
            value={playerName}
            disabled={isSubmitting}
            onChange={(event) => {
              setPlayerName(event.target.value);
              setFormError(null);
              setToast(null);
            }}
          />
        </div>
        <button
          type="button"
          className="issue-ticket__auto-select"
          onClick={handleAutoSelect}
          disabled={!canAutoSelect || isAutoSelecting || isSubmitting}
          data-testid="auto-select-button"
        >
          {isAutoSelecting ? '자동선택 중…' : '자동선택'}
        </button>
      </div>

      {formError ? <p className="issue-ticket__form-error">{formError}</p> : null}

      <div className="issue-ticket__grid-wrapper">
        <NumberGrid selection={numberGridSelection} disabled={isSubmitting} />
      </div>

      <SelectionSummary selection={selection} helperText={summaryHelperText} errorMessage={summaryError} />

      <form className="issue-ticket__actions" onSubmit={handleSubmit}>
        <button
          type="submit"
          className="issue-ticket__submit"
          data-testid="issue-ticket-button"
          disabled={!canSubmit}
        >
          {isSubmitting ? '발행 중…' : '발행하기'}
        </button>
      </form>

      {toast ? (
        <p className={`issue-ticket__toast issue-ticket__toast--${toast.type}`} data-testid="ticket-issue-toast" role="status">
          {toast.message}
        </p>
      ) : null}
    </section>
  );
}

export default IssueTicketPage;
