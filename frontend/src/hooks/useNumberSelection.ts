import { useCallback, useMemo, useState } from 'react';
import { LOTTO_MAX_NUMBER, LOTTO_MIN_NUMBER, LOTTO_SELECTION_SIZE } from '../constants/lotto';

export const MAX_SELECTION = LOTTO_SELECTION_SIZE;
export const MIN_NUMBER = LOTTO_MIN_NUMBER;
export const MAX_NUMBER = LOTTO_MAX_NUMBER;

export interface NumberSelectionState {
  selectedNumbers: number[];
  remainingSlots: number;
  canSelectMore: boolean;
  isComplete: boolean;
  toggleNumber(value: number): void;
  isSelected(value: number): boolean;
  reset(): void;
  setSelection(values: number[]): void;
}

function clampToRange(values: Iterable<number>): number[] {
  const unique = new Set<number>();
  for (const value of values) {
    const numeric = Number(value);
    if (!Number.isInteger(numeric)) {
      continue;
    }
    if (numeric < MIN_NUMBER || numeric > MAX_NUMBER) {
      continue;
    }
    unique.add(numeric);
    if (unique.size >= MAX_SELECTION) {
      break;
    }
  }
  return Array.from(unique).sort((a, b) => a - b);
}

export function useNumberSelection(): NumberSelectionState {
  const [selection, setSelection] = useState<number[]>([]);

  const remainingSlots = MAX_SELECTION - selection.length;
  const canSelectMore = remainingSlots > 0;
  const isComplete = selection.length === MAX_SELECTION;

  const toggleNumber = useCallback((value: number) => {
    setSelection((current) => {
      if (!Number.isInteger(value) || value < MIN_NUMBER || value > MAX_NUMBER) {
        return current;
      }

      if (current.includes(value)) {
        return current.filter((entry) => entry !== value);
      }

      if (current.length >= MAX_SELECTION) {
        return current;
      }

      return clampToRange([...current, value]);
    });
  }, []);

  const handleSetSelection = useCallback((values: number[]) => {
    setSelection(clampToRange(values));
  }, []);

  const reset = useCallback(() => {
    setSelection([]);
  }, []);

  const isSelected = useCallback((value: number) => selection.includes(value), [selection]);

  return useMemo(
    () => ({
      selectedNumbers: selection,
      remainingSlots,
      canSelectMore,
      isComplete,
      toggleNumber,
      isSelected,
      reset,
      setSelection: handleSetSelection
    }),
    [selection, remainingSlots, canSelectMore, isComplete, toggleNumber, isSelected, reset, handleSetSelection]
  );
}
