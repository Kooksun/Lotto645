import type { NumberSelectionState } from '../../hooks/useNumberSelection';

interface SelectionSummaryProps {
  selection: Pick<NumberSelectionState, 'selectedNumbers'>;
  helperText?: string;
  errorMessage?: string | null;
  placeholderText?: string;
}

export function SelectionSummary({
  selection,
  helperText,
  errorMessage,
  placeholderText = '번호를 선택해주세요.'
}: SelectionSummaryProps): JSX.Element {
  const hasNumbers = selection.selectedNumbers.length > 0;

  return (
    <section className="selection-summary" aria-live="polite" data-testid="number-selection-summary">
      <p className="selection-summary__label">선택된 번호 :</p>
      <div className="selection-summary__box">
        {hasNumbers ? (
          selection.selectedNumbers.map((number) => (
            <span key={number} className="selection-summary__number" data-testid="selected-number-chip">
              {number}
            </span>
          ))
        ) : (
          <span className="selection-summary__placeholder">{placeholderText}</span>
        )}
      </div>
      {helperText ? <p className="selection-summary__helper">{helperText}</p> : null}
      {errorMessage ? <p className="selection-summary__error">{errorMessage}</p> : null}
    </section>
  );
}

export default SelectionSummary;
