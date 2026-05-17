import { apiClient } from './client';
import type { User, UserRoleUpdate, UserActiveUpdate, Page, PaginationParams } from '../types';

export const adminApi = {
  listUsers: async (params: PaginationParams = {}): Promise<Page<User>> => {
    const { data } = await apiClient.get<Page<User>>('/admin/users', { params });
    return data;
  },

  getUserById: async (id: number): Promise<User> => {
    const { data } = await apiClient.get<User>(`/admin/users/${id}`);
    return data;
  },

  updateRole: async (id: number, payload: UserRoleUpdate): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}/role`, payload);
    return data;
  },

  updateActive: async (id: number, payload: UserActiveUpdate): Promise<User> => {
    const { data } = await apiClient.patch<User>(`/admin/users/${id}/active`, payload);
    return data;
  },
};
