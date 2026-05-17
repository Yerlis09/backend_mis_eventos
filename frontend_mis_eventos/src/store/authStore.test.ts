import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from './authStore';

const mockUser = {
  id: 1,
  email: 'test@test.com',
  full_name: 'Test User',
  is_active: true,
  role: 'admin' as const,
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  localStorage.clear();
});

describe('useAuthStore', () => {
  it('initial state is unauthenticated', () => {
    const { token, user, isAuthenticated } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
  });

  it('setAuth updates state and localStorage', () => {
    useAuthStore.getState().setAuth('token123', mockUser);
    const { token, user, isAuthenticated } = useAuthStore.getState();
    expect(token).toBe('token123');
    expect(user).toEqual(mockUser);
    expect(isAuthenticated).toBe(true);
    expect(localStorage.getItem('access_token')).toBe('token123');
  });

  it('setUser updates user without touching token', () => {
    useAuthStore.getState().setAuth('tok', mockUser);
    useAuthStore.getState().setUser({ ...mockUser, role: 'organizer' });
    const { token, user } = useAuthStore.getState();
    expect(token).toBe('tok');
    expect(user?.role).toBe('organizer');
  });

  it('logout clears state and localStorage', () => {
    useAuthStore.getState().setAuth('tok', mockUser);
    useAuthStore.getState().logout();
    const { token, user, isAuthenticated } = useAuthStore.getState();
    expect(token).toBeNull();
    expect(user).toBeNull();
    expect(isAuthenticated).toBe(false);
    expect(localStorage.getItem('access_token')).toBeNull();
  });
});
