import { apiClient } from './client';
import type { Registration, Page, PaginationParams } from '../types';

export const registrationsApi = {
  register: async (eventId: number): Promise<Registration> => {
    const { data } = await apiClient.post<Registration>(`/events/${eventId}/register`);
    return data;
  },

  unregister: async (eventId: number): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/unregister`);
  },

  myRegistrations: async (params: PaginationParams = {}): Promise<Page<Registration>> => {
    const { data } = await apiClient.get<Page<Registration>>('/my-registrations', { params });
    return data;
  },
};
