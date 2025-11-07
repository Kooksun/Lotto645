import { useMemo } from 'react';
import type { NumberSelectionState } from '../../hooks/useNumberSelection';

const GRID_ROWS = 5;
const GRID_COLUMNS = 9;

interface NumberGridProps {
  selection: Pick<NumberSelectionState, 'selectedNumbers' | 'toggleNumber' | 'isSelected' | 'canSelectMore'>;
  disabled?: boolean;
  minNumber?: number;
}

function buildMatrix(minNumber: number): number[][] {
  const matrix: number[][] = [];

  for (let rowIndex = 0; rowIndex < GRID_ROWS; rowIndex += 1) {
    const row: number[] = [];
    for (let columnIndex = 0; columnIndex < GRID_COLUMNS; columnIndex += 1) {
      row.push(minNumber + rowIndex + GRID_ROWS * columnIndex);
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
