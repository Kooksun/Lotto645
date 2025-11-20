import { useMemo } from 'react';
import type { NumberSelectionState } from '../../hooks/useNumberSelection';

const GRID_ROWS = 7; // Will be dynamic based on columns, but for 45 numbers / 7 cols = 7 rows (last one partial)
const GRID_COLUMNS = 7;

interface NumberGridProps {
  selection: Pick<NumberSelectionState, 'selectedNumbers' | 'toggleNumber' | 'isSelected' | 'canSelectMore'>;
  disabled?: boolean;
  minNumber?: number;
  maxNumber?: number;
}

function buildMatrix(minNumber: number, maxNumber: number = 45): number[][] {
  const matrix: number[][] = [];
  let currentNumber = minNumber;

  while (currentNumber <= maxNumber) {
    const row: number[] = [];
    for (let i = 0; i < GRID_COLUMNS; i++) {
      if (currentNumber <= maxNumber) {
        row.push(currentNumber);
        currentNumber++;
      }
    }
    matrix.push(row);
  }

  return matrix;
}

export function NumberGrid({ selection, disabled = false, minNumber = 1 }: NumberGridProps): JSX.Element {
  const rows = useMemo(() => buildMatrix(minNumber), [minNumber]);

  return (
    <table className="number-grid" role="grid" aria-label="번호를 선택하세요">
      <tbody>
        {rows.map((row, rowIndex) => (
          <tr key={`row-${rowIndex}`} role="row">
            {row.map((value) => {
              const isSelected = selection.isSelected(value);
              const isDisabled = disabled || (!isSelected && !selection.canSelectMore);

              return (
                <td key={value}>
                  <button
                    type="button"
                    role="gridcell"
                    className={`number-grid__button${isSelected ? ' is-selected' : ''}`}
                    aria-pressed={isSelected}
                    aria-disabled={isDisabled}
                    disabled={isDisabled}
                    onClick={() => {
                      if (isDisabled) {
                        return;
                      }
                      selection.toggleNumber(value);
                    }}
                    data-testid={`number-button-${value}`}
                  >
                    {value}
                  </button>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default NumberGrid;
