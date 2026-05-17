import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/authStore';
import type { LoginCredentials, RegisterCredentials } from '../types';

export function useLogin() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { setAuth } = useAuthStore();
  const navigate = useNavigate();

  const login = async (credentials: LoginCredentials) => {
    setLoading(true);
    setError(null);
    try {
      const token = await authApi.login(credentials);
      // Guarda el token antes de llamar /me (el interceptor lo adjuntará)
      localStorage.setItem('access_token', token.access_token);
      const me = await authApi.me();
      setAuth(token.access_token, me);
      navigate('/events');
    } catch (err: unknown) {
      localStorage.removeItem('access_token');
      const msg = extractErrorMessage(err, 'Credenciales incorrectas.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { login, loading, error };
}

export function useRegister() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const register = async (credentials: RegisterCredentials) => {
    setLoading(true);
    setError(null);
    try {
      await authApi.register(credentials);
      navigate('/login');
    } catch (err: unknown) {
      const msg = extractErrorMessage(err, 'Error al registrar. Intenta de nuevo.');
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return { register, loading, error };
}

function extractErrorMessage(err: unknown, fallback: string): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const resp = (err as { response?: { data?: { detail?: string } } }).response;
    if (resp?.data?.detail) return resp.data.detail;
  }
  return fallback;
}
