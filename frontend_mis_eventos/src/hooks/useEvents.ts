import { useState, useEffect, useCallback } from 'react';
import { eventsApi } from '../api/events';
import { useEventsStore } from '../store/eventsStore';
import { useDebounce } from './useDebounce';
import type { Event } from '../types';

export function useEventsList() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { eventsPage, searchQuery, currentPage, setEventsPage, setSearchQuery, setCurrentPage } = useEventsStore();

  const debouncedSearch = useDebounce(searchQuery, 400);

  const fetchEvents = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const page = await eventsApi.list({
        page: currentPage,
        size: 6,
        search: debouncedSearch || undefined,
      });
      setEventsPage(page);
    } catch {
      setError('No se pudieron cargar los eventos.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, debouncedSearch, setEventsPage]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearch, setCurrentPage]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  return { eventsPage, loading, error, searchQuery, currentPage, setSearchQuery, setCurrentPage };
}

export function useEventDetail(id: number) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [event, setEvent] = useState<Event | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    eventsApi.getById(id)
      .then(setEvent)
      .catch(() => setError('Evento no encontrado.'))
      .finally(() => setLoading(false));
  }, [id]);

  return { event, loading, error };
}
