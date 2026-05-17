import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useLogin, useRegister } from './useAuth';
import { useAuthStore } from '../store/authStore';

const wrapper = ({ children }: { children: React.ReactNode }) =>
  React.createElement(MemoryRouter, {}, children);

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  localStorage.clear();
});

describe('useLogin', () => {
  it('sets auth state after successful login', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: '12345678' });
    });
    const { isAuthenticated, token, user } = useAuthStore.getState();
    expect(isAuthenticated).toBe(true);
    expect(token).toBe('fake.jwt.token');
    expect(user?.id).toBe(1);
  });

  it('sets error on failed login', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login', () =>
        HttpResponse.json({ detail: 'Wrong credentials' }, { status: 401 }),
      ),
    );
    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => {
      await result.current.login({ email: 'bad@test.com', password: 'wrong' });
    });
    expect(result.current.error).toBeTruthy();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });

  it('loading is false after login completes', async () => {
    const { result } = renderHook(() => useLogin(), { wrapper });
    await act(async () => {
      await result.current.login({ email: 'test@test.com', password: '12345678' });
    });
    expect(result.current.loading).toBe(false);
  });
});

describe('useRegister', () => {
  it('clears error on successful register', async () => {
    const { result } = renderHook(() => useRegister(), { wrapper });
    await act(async () => {
      await result.current.register({
        email: 'new@test.com',
        password: '12345678',
        full_name: 'New User',
      });
    });
    expect(result.current.error).toBeNull();
  });

  it('sets error on failed register', async () => {
    const { server } = await import('../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8000/api/v1/auth/register', () =>
        HttpResponse.json({ detail: 'Email already exists' }, { status: 400 }),
      ),
    );
    const { result } = renderHook(() => useRegister(), { wrapper });
    await act(async () => {
      await result.current.register({
        email: 'dup@test.com',
        password: '12345678',
        full_name: 'Dup User',
      });
    });
    expect(result.current.error).toBeTruthy();
  });

  it('loading starts false', () => {
    const { result } = renderHook(() => useRegister(), { wrapper });
    expect(result.current.loading).toBe(false);
  });
});
