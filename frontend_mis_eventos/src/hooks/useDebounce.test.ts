import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useDebounce } from './useDebounce';

beforeEach(() => vi.useFakeTimers());
afterEach(() => vi.useRealTimers());

describe('useDebounce', () => {
  it('returns the initial value immediately', () => {
    const { result } = renderHook(() => useDebounce('hello', 400));
    expect(result.current).toBe('hello');
  });

  it('does not update before the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'changed' });
    act(() => { vi.advanceTimersByTime(300); });
    expect(result.current).toBe('initial');
  });

  it('updates after the delay elapses', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'initial' },
    });
    rerender({ value: 'changed' });
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toBe('changed');
  });

  it('resets timer when value changes rapidly', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 400), {
      initialProps: { value: 'a' },
    });
    rerender({ value: 'b' });
    act(() => { vi.advanceTimersByTime(200); });
    rerender({ value: 'c' });
    act(() => { vi.advanceTimersByTime(400); });
    expect(result.current).toBe('c');
  });

  it('works with numbers', () => {
    const { result, rerender } = renderHook(({ value }) => useDebounce(value, 200), {
      initialProps: { value: 0 },
    });
    rerender({ value: 42 });
    act(() => { vi.advanceTimersByTime(200); });
    expect(result.current).toBe(42);
  });
});
