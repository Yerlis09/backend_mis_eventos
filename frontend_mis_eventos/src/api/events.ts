import { apiClient } from './client';
import type { Event, EventCreatePayload, EventUpdatePayload, Page, PaginationParams } from '../types';

interface EventsQueryParams extends PaginationParams {
  search?: string;
}

export const eventsApi = {
  list: async (params: EventsQueryParams = {}): Promise<Page<Event>> => {
    const { data } = await apiClient.get<Page<Event>>('/events', { params });
    return data;
  },

  getById: async (id: number): Promise<Event> => {
    const { data } = await apiClient.get<Event>(`/events/${id}`);
    return data;
  },

  create: async (payload: EventCreatePayload): Promise<Event> => {
    const { data } = await apiClient.post<Event>('/events', payload);
    return data;
  },

  update: async (id: number, payload: EventUpdatePayload): Promise<Event> => {
    const { data } = await apiClient.put<Event>(`/events/${id}`, payload);
    return data;
  },

  remove: async (id: number): Promise<void> => {
    await apiClient.delete(`/events/${id}`);
  },
};
