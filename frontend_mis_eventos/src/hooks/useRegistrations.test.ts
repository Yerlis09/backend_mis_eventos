import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useMyRegistrations, useRegisterEvent } from './useRegistrations';
import { useToastStore } from '../store/toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('useMyRegistrations', () => {
  it('fetches registrations and sets data', async () => {
    const { result } = renderHook(() => useMyRegistrations(1, 10));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.items).toHaveLength(1);
    expect(result.current.data!.items[0].event_id).toBe(1);
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useMyRegistrations(1, 10));
    expect(result.current.loading).toBe(true);
  });
});

describe('useRegisterEvent', () => {
  it('register calls api and sets success', async () => {
    const { result } = renderHook(() => useRegisterEvent(1));
    await act(async () => { await result.current.register(); });
    expect(result.current.success).toBe(true);
    expect(result.current.error).toBeNull();
  });

  it('register adds success toast', async () => {
    const { result } = renderHook(() => useRegisterEvent(1));
    await act(async () => { await result.current.register(); });
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === 'success')).toBe(true);
  });

  it('unregister resets success and adds info toast', async () => {
    const { result } = renderHook(() => useRegisterEvent(1));
    await act(async () => { await result.current.register(); });
    await act(async () => { await result.current.unregister(); });
    expect(result.current.success).toBe(false);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === 'info')).toBe(true);
  });

  it('register sets error toast on api failure', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8000/api/v1/events/:eventId/register', () =>
        HttpResponse.json({ detail: 'Already registered' }, { status: 400 }),
      ),
    );
    const { result } = renderHook(() => useRegisterEvent(1));
    await act(async () => { await result.current.register(); });
    expect(result.current.success).toBe(false);
    const toasts = useToastStore.getState().toasts;
    expect(toasts.some((t) => t.type === 'error')).toBe(true);
  });
});
