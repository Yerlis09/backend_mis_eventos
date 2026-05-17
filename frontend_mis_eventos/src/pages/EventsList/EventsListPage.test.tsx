import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventsListPage from './EventsListPage';
import { useEventsStore } from '../../store/eventsStore';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

beforeEach(() => {
  useEventsStore.getState().reset();
});

describe('EventsListPage', () => {
  it('shows loading state initially', () => {
    render(<EventsListPage />, { wrapper });
    expect(screen.getByText(/Loading events/i)).toBeInTheDocument();
  });

  it('renders event cards after loading', async () => {
    render(<EventsListPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('Tech Summit 2026')).toBeInTheDocument());
  });

  it('renders search input', () => {
    render(<EventsListPage />, { wrapper });
    expect(screen.getByPlaceholderText(/Search events/i)).toBeInTheDocument();
  });

  it('shows empty state when no events match', async () => {
    const { server } = await import('../../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:8000/api/v1/events', () =>
        HttpResponse.json({ items: [], total: 0, page: 1, size: 10, pages: 0 }),
      ),
    );
    render(<EventsListPage />, { wrapper });
    await waitFor(() => expect(screen.getByText(/No events found/i)).toBeInTheDocument());
  });

  it('shows error when fetch fails', async () => {
    const { server } = await import('../../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.get('http://localhost:8000/api/v1/events', () =>
        HttpResponse.json({ detail: 'Server error' }, { status: 500 }),
      ),
    );
    render(<EventsListPage />, { wrapper });
    await waitFor(
      () => expect(screen.getByText(/No se pudieron cargar los eventos/i)).toBeInTheDocument(),
      { timeout: 5000 },
    );
  });

  it('updates search query on input change', async () => {
    render(<EventsListPage />, { wrapper });
    const input = screen.getByPlaceholderText(/Search events/i);
    await userEvent.type(input, 'Tech');
    expect(input).toHaveValue('Tech');
  });

  it('renders only the search input in the toolbar', () => {
    render(<EventsListPage />, { wrapper });
    expect(screen.queryByText(/All Types/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Date Range/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Location/i)).not.toBeInTheDocument();
  });
});
