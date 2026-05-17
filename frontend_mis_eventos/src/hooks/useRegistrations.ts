import { useState, useEffect } from 'react';
import { registrationsApi } from '../api/registrations';
import { toast } from '../store/toastStore';
import type { Registration, Page } from '../types';

export function useMyRegistrations(page = 1, size = 10) {
  const [data, setData] = useState<Page<Registration> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    registrationsApi.myRegistrations({ page, size })
      .then(setData)
      .catch(() => setError('No se pudieron cargar tus registros.'))
      .finally(() => setLoading(false));
  }, [page, size]);

  return { data, loading, error };
}

export function useRegisterEvent(eventId: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const register = async () => {
    setLoading(true);
    setError(null);
    try {
      await registrationsApi.register(eventId);
      setSuccess(true);
      toast.success('¡Registro exitoso! Ya tienes tu lugar en el evento.');
    } catch (err: unknown) {
      const msg = extractDetail(err) ?? 'No se pudo registrar al evento.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const unregister = async () => {
    setLoading(true);
    setError(null);
    try {
      await registrationsApi.unregister(eventId);
      setSuccess(false);
      toast.info('Registro cancelado correctamente.');
    } catch {
      const msg = 'No se pudo cancelar el registro.';
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return { register, unregister, loading, error, success };
}

function extractDetail(err: unknown): string | null {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const detail = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
    return detail ?? null;
  }
  return null;
}
