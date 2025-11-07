// @vitest-environment jsdom
import { renderHook, act } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useNumberSelection, MAX_SELECTION } from '../useNumberSelection';

describe('useNumberSelection (spec)', () => {
  it('starts with empty selection and open slots', () => {
    const { result } = renderHook(() => useNumberSelection());

    expect(result.current.selectedNumbers).toEqual([]);
    expect(result.current.remainingSlots).toBe(MAX_SELECTION);
    expect(result.current.canSelectMore).toBe(true);
    expect(result.current.isComplete).toBe(false);
  });

  it('toggles numbers, maintains order, and enforces the max cap', () => {
    const { result } = renderHook(() => useNumberSelection());

    act(() => {
      result.current.toggleNumber(12);
      result.current.toggleNumber(4);
      result.current.toggleNumber(30);
      result.current.toggleNumber(12); // removing should work
    });

    expect(result.current.selectedNumbers).toEqual([4, 30]);
    expect(result.current.remainingSlots).toBe(MAX_SELECTION - 2);
    expect(result.current.isSelected(4)).toBe(true);
    expect(result.current.isSelected(12)).toBe(false);

    act(() => {
      for (let i = 1; i <= 10; i += 1) {
        result.current.toggleNumber(i);
      }
    });

    expect(result.current.selectedNumbers.length).toBe(MAX_SELECTION);
    expect(result.current.canSelectMore).toBe(false);
    expect(result.current.isComplete).toBe(true);
  });

  it('setSelection replaces selection with sanitized, sorted values', () => {
    const { result } = renderHook(() => useNumberSelection());

    act(() => {
      result.current.setSelection([45, 3, 3, 77, -10, 6, 12]);
    });

    expect(result.current.selectedNumbers).toEqual([3, 6, 12, 45]);
    expect(result.current.remainingSlots).toBe(MAX_SELECTION - 4);

    act(() => {
      result.current.reset();
    });

    expect(result.current.selectedNumbers).toEqual([]);
    expect(result.current.remainingSlots).toBe(MAX_SELECTION);
  });
});
