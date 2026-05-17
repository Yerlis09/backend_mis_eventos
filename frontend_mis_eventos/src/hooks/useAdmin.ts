import { useState, useEffect } from 'react';
import { adminApi } from '../api/admin';
import type { User, Page, UserRole } from '../types';

export function useAdminUsers(page = 1, size = 10) {
  const [data, setData] = useState<Page<User> | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = () => {
    setLoading(true);
    setError(null);
    adminApi.listUsers({ page, size })
      .then(setData)
      .catch(() => setError('No se pudieron cargar los usuarios.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, size]);

  const updateRole = async (id: number, role: UserRole) => {
    await adminApi.updateRole(id, { role });
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((u) => (u.id === id ? { ...u, role } : u)) } : prev,
    );
  };

  const toggleActive = async (id: number, is_active: boolean) => {
    await adminApi.updateActive(id, { is_active });
    setData((prev) =>
      prev ? { ...prev, items: prev.items.map((u) => (u.id === id ? { ...u, is_active } : u)) } : prev,
    );
  };

  return { data, loading, error, updateRole, toggleActive };
}
