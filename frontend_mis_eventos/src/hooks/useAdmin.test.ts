import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { useAdminUsers } from './useAdmin';

describe('useAdminUsers', () => {
  it('fetches users and sets data', async () => {
    const { result } = renderHook(() => useAdminUsers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).not.toBeNull();
    expect(result.current.data!.items).toHaveLength(1);
    expect(result.current.data!.items[0].email).toBe('test@test.com');
  });

  it('starts in loading state', () => {
    const { result } = renderHook(() => useAdminUsers(1));
    expect(result.current.loading).toBe(true);
  });

  it('error is null on successful fetch', async () => {
    const { result } = renderHook(() => useAdminUsers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeNull();
  });

  it('sets error when fetch fails', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:8000/api/v1/admin/users', () =>
        HttpResponse.json({ detail: 'Forbidden' }, { status: 403 }),
      ),
    );
    const { result } = renderHook(() => useAdminUsers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.error).toBeTruthy();
  });

  it('updateRole updates user role in state', async () => {
    const { result } = renderHook(() => useAdminUsers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.updateRole(1, 'organizer');
    });
    expect(result.current.data!.items[0].role).toBe('organizer');
  });

  it('toggleActive updates user active state', async () => {
    const { result } = renderHook(() => useAdminUsers(1));
    await waitFor(() => expect(result.current.loading).toBe(false));
    await act(async () => {
      await result.current.toggleActive(1, false);
    });
    expect(result.current.data!.items[0].is_active).toBe(false);
  });
});
