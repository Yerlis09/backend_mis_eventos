import { apiClient } from './client';
import type { EventSession, SessionCreatePayload, SessionUpdatePayload, Page, PaginationParams } from '../types';

export const sessionsApi = {
  list: async (eventId: number, params: PaginationParams = {}): Promise<Page<EventSession>> => {
    const { data } = await apiClient.get<Page<EventSession>>(`/events/${eventId}/sessions`, { params });
    return data;
  },

  create: async (eventId: number, payload: SessionCreatePayload): Promise<EventSession> => {
    const { data } = await apiClient.post<EventSession>(`/events/${eventId}/sessions`, payload);
    return data;
  },

  update: async (eventId: number, sessionId: number, payload: SessionUpdatePayload): Promise<EventSession> => {
    const { data } = await apiClient.put<EventSession>(`/events/${eventId}/sessions/${sessionId}`, payload);
    return data;
  },

  remove: async (eventId: number, sessionId: number): Promise<void> => {
    await apiClient.delete(`/events/${eventId}/sessions/${sessionId}`);
  },
};
