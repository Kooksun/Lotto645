import type { NumberSelectionState } from '../../hooks/useNumberSelection';
import NumberGrid from './NumberGrid';
import SelectionSummary from './SelectionSummary';

interface TicketSetProps {
    index: number;
    selection: NumberSelectionState;
    onAutoSelect: () => void;
    isAutoSelecting: boolean;
    disabled: boolean;
    autoSelectError?: string | null;
}

function TicketSet({
    index,
    selection,
    onAutoSelect,
    isAutoSelecting,
    disabled,
    autoSelectError
}: TicketSetProps): JSX.Element {
    const summaryHelperText = `현재 ${selection.selectedNumbers.length} / 6개 선택`;

    // Wrap selection to intercept toggleNumber if needed, or pass directly.
    // In IssueTicketPage, we reset error on toggle. We might need to handle that here or pass a wrapper.
    // For now, assuming the parent handles error resetting or we just pass the raw selection.
    // Actually, NumberGrid calls selection.toggleNumber.

    return (
        <div className="ticket-set">
            <div className="ticket-set__header">
                <span className="ticket-set__label">{index + 1}번 세트</span>
                <button
                    type="button"
                    className="ticket-set__auto-select"
                    onClick={onAutoSelect}
                    disabled={!selection.canSelectMore || isAutoSelecting || disabled}
                    data-testid={`auto-select-button-${index}`}
                >
                    {isAutoSelecting ? '선택 중…' : '자동선택'}
                </button>
            </div>

            <div className="ticket-set__grid-wrapper">
                <NumberGrid selection={selection} disabled={disabled} />
            </div>

            <SelectionSummary
                selection={selection}
                helperText={summaryHelperText}
                errorMessage={autoSelectError ?? undefined}
            />
        </div>
    );
}

export default TicketSet;
