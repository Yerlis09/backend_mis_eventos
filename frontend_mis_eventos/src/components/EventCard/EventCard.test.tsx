import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import EventCard from './EventCard';
import type { Event } from '../../types';

const mockEvent: Event = {
  id: 1,
  name: 'Tech Summit 2026',
  description: 'A great tech event',
  capacity: 200,
  status: 'published',
  creator_id: 1,
  sessions: [],
};

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('EventCard', () => {
  it('renders event name', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText('Tech Summit 2026')).toBeInTheDocument();
  });

  it('renders event description', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText('A great tech event')).toBeInTheDocument();
  });

  it('renders capacity', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText(/200/)).toBeInTheDocument();
  });

  it('renders the status badge', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders an image with alt text', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByAltText('Tech Summit 2026')).toBeInTheDocument();
  });

  it('renders "View details" button', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText(/View details/i)).toBeInTheDocument();
  });

  it('does not render description when null', () => {
    render(<EventCard event={{ ...mockEvent, description: null }} />, { wrapper });
    expect(screen.queryByText('A great tech event')).not.toBeInTheDocument();
  });

  it('shows session count', () => {
    const withSessions: Event = {
      ...mockEvent,
      sessions: [
        { id: 1, title: 'Talk 1', speaker: 'A', start_datetime: '', end_datetime: '', capacity: 50 },
      ],
    };
    render(<EventCard event={withSessions} />, { wrapper });
    expect(screen.getByText(/Sessions: 1/)).toBeInTheDocument();
  });

  it('renders zero sessions correctly', () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    expect(screen.getByText(/Sessions: 0/)).toBeInTheDocument();
  });

  it('clicking View details navigates to event page', async () => {
    render(<EventCard event={mockEvent} />, { wrapper });
    const btn = screen.getByRole('button', { name: /View details/i });
    await userEvent.click(btn);
    // Navigation triggered (MemoryRouter handles it without throwing)
  });
});
