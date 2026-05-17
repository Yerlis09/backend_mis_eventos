import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useEventsList, useEventDetail } from './useEvents';
import { useEventsStore } from '../store/eventsStore';

beforeEach(() => {
  useEventsStore.getState().reset();
});

describe('useEventDetail', () => {
  it('fetches event by id', async () => {
    const { result } = renderHook(() => useEventDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.event).not.toBeNull();
    expect(result.current.event?.id).toBe(1);
    expect(result.current.event?.name).toBe('Tech Summit 2026');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useEventDetail(1));
    expect(result.current.loading).toBe(true);
  });

  it('error is null on success', async () => {
    const { result } = renderHook(() => useEventDetail(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:8000/api/v1/events/:id', () =>
        HttpResponse.json({ detail: 'Not found' }, { status: 404 }),
      ),
    );
    const { result } = renderHook(() => useEventDetail(99));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBe('Evento no encontrado.');
  });

  it('does not fetch when id is 0', () => {
    const { result } = renderHook(() => useEventDetail(0));
    expect(result.current.loading).toBe(false);
    expect(result.current.event).toBeNull();
  });
});

describe('useEventsList', () => {
  it('fetches events page on mount', async () => {
    const { result } = renderHook(() => useEventsList());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.eventsPage).not.toBeNull();
    expect(result.current.eventsPage!.items[0].name).toBe('Tech Summit 2026');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useEventsList());
    expect(result.current.loading).toBe(true);
  });

  it('sets error when fetch fails', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:8000/api/v1/events', () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 }),
      ),
    );
    const { result } = renderHook(() => useEventsList());
    await waitFor(() => expect(result.current.error).toBeTruthy());
    expect(result.current.error).toBe('No se pudieron cargar los eventos.');
  });

  it('exposes setSearchQuery', async () => {
    const { result } = renderHook(() => useEventsList());
    expect(typeof result.current.setSearchQuery).toBe('function');
  });
});
