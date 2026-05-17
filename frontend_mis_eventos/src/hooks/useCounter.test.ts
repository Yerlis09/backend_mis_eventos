import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useCounter } from './useCounter';

const stubIntersectionObserver = () =>
  vi.stubGlobal('IntersectionObserver', vi.fn(() => ({
    observe: vi.fn(),
    unobserve: vi.fn(),
    disconnect: vi.fn(),
    takeRecords: () => [],
    root: null,
    rootMargin: '',
    thresholds: [],
  })));

beforeEach(stubIntersectionObserver);
afterEach(() => vi.unstubAllGlobals());

describe('useCounter — shape', () => {
  it('returns a numeric count and a ref', () => {
    const { result } = renderHook(() => useCounter(100));
    expect(typeof result.current.count).toBe('number');
    expect('current' in result.current.ref).toBe(true);
  });

  it('starts at 0 when startOnVisible is true (no real DOM node)', () => {
    const { result } = renderHook(() => useCounter(100, 1800, true));
    expect(result.current.count).toBe(0);
  });

  it('accepts target=0 without throwing', () => {
    expect(() => renderHook(() => useCounter(0))).not.toThrow();
  });
});

describe('useCounter — animation (startOnVisible=false)', () => {
  let rafCallbacks: FrameRequestCallback[];

  beforeEach(() => {
    rafCallbacks = [];
    vi.stubGlobal('requestAnimationFrame', (cb: FrameRequestCallback) => {
      rafCallbacks.push(cb);
      return rafCallbacks.length;
    });
    vi.stubGlobal('cancelAnimationFrame', vi.fn());
    vi.spyOn(performance, 'now').mockReturnValue(0);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const flush = (time: number) => {
    const pending = rafCallbacks.splice(0);
    pending.forEach((cb) => cb(time));
  };

  it('starts at 0 on first RAF tick (t=0)', () => {
    const { result } = renderHook(() => useCounter(100, 1000, false));
    act(() => flush(0));
    expect(result.current.count).toBe(0);
  });

  it('reaches target when time >= duration', () => {
    const { result } = renderHook(() => useCounter(100, 1000, false));
    act(() => flush(0));
    act(() => flush(1000));
    expect(result.current.count).toBe(100);
  });

  it('is at an intermediate value mid-animation', () => {
    const { result } = renderHook(() => useCounter(100, 1000, false));
    act(() => flush(0));
    act(() => flush(500));
    // At t=500/1000, eased = 1-(1-0.5)^4 ≈ 0.9375 → count ≈ 94
    expect(result.current.count).toBeGreaterThan(0);
    expect(result.current.count).toBeLessThan(100);
  });

  it('clamps progress at 1 when time overshoots duration', () => {
    const { result } = renderHook(() => useCounter(50, 500, false));
    act(() => flush(0));
    act(() => flush(99999));
    expect(result.current.count).toBe(50);
  });
});
