import { apiClient } from './client';
import type { LoginCredentials, RegisterCredentials, TokenResponse, User } from '../types';

export const authApi = {
  login: async (credentials: LoginCredentials): Promise<TokenResponse> => {
    const { data } = await apiClient.post<TokenResponse>('/auth/login', credentials);
    return data;
  },

  register: async (credentials: RegisterCredentials): Promise<User> => {
    const { data } = await apiClient.post<User>('/auth/register', credentials);
    return data;
  },

  me: async (): Promise<User> => {
    const { data } = await apiClient.get<User>('/auth/me');
    return data;
  },
};
