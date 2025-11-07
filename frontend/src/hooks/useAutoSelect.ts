import { useCallback, useState } from 'react';
import { completeSelection } from '../services/drawRng';
import type { NumberSelectionState } from './useNumberSelection';
import { MAX_SELECTION } from './useNumberSelection';

interface UseAutoSelectOptions {
  onComplete?: (numbers: number[]) => void;
  onError?: (error: unknown) => void;
}

export interface AutoSelectState {
  isAutoSelecting: boolean;
  canAutoSelect: boolean;
  error: unknown | null;
  autoSelect(): number[];
  resetError(): void;
}

export function useAutoSelect(
  selection: Pick<NumberSelectionState, 'selectedNumbers' | 'setSelection'>,
  options?: UseAutoSelectOptions
): AutoSelectState {
  const { selectedNumbers, setSelection } = selection;
  const [isAutoSelecting, setIsAutoSelecting] = useState(false);
  const [error, setError] = useState<unknown | null>(null);
  const canAutoSelect = selectedNumbers.length < MAX_SELECTION;

  const autoSelect = useCallback(() => {
    if (!canAutoSelect) {
      return selectedNumbers;
    }

    setIsAutoSelecting(true);
    try {
      const completed = completeSelection(selectedNumbers, MAX_SELECTION);
      setSelection(completed);
      setError(null);
      options?.onComplete?.(completed);
      return completed;
    } catch (err) {
      setError(err);
      options?.onError?.(err);
      throw err;
    } finally {
      setIsAutoSelecting(false);
    }
  }, [canAutoSelect, options, selectedNumbers, setSelection]);

  const resetError = useCallback(() => {
    setError(null);
  }, []);

  return {
    isAutoSelecting,
    canAutoSelect,
    error,
    autoSelect,
    resetError
  };
}
