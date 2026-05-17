import { create } from 'zustand';
import type { Event, Page } from '../types';

interface EventsState {
  eventsPage: Page<Event> | null;
  currentEvent: Event | null;
  searchQuery: string;
  currentPage: number;

  setEventsPage: (page: Page<Event>) => void;
  setCurrentEvent: (event: Event | null) => void;
  setSearchQuery: (query: string) => void;
  setCurrentPage: (page: number) => void;
  reset: () => void;
}

export const useEventsStore = create<EventsState>()((set) => ({
  eventsPage: null,
  currentEvent: null,
  searchQuery: '',
  currentPage: 1,

  setEventsPage: (eventsPage) => set({ eventsPage }),
  setCurrentEvent: (currentEvent) => set({ currentEvent }),
  setSearchQuery: (searchQuery) => set({ searchQuery, currentPage: 1 }),
  setCurrentPage: (currentPage) => set({ currentPage }),
  reset: () => set({ eventsPage: null, currentEvent: null, searchQuery: '', currentPage: 1 }),
}));
