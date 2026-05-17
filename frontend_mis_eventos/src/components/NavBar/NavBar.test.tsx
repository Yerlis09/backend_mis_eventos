import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import NavBar from './NavBar';
import { useAuthStore } from '../../store/authStore';

const mockUser = {
  id: 1,
  email: 'test@test.com',
  full_name: 'Test User',
  is_active: true,
  role: 'admin' as const,
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

const renderNavBar = (initialEntry = '/events') =>
  render(
    <MemoryRouter initialEntries={[initialEntry]}>
      <NavBar />
    </MemoryRouter>,
  );

describe('NavBar', () => {
  it('renders the logo link', () => {
    renderNavBar();
    expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
  });

  it('renders Events link', () => {
    renderNavBar();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('shows Login link when not authenticated', () => {
    renderNavBar();
    expect(screen.getByText('Login')).toBeInTheDocument();
  });

  it('shows user avatar when authenticated', () => {
    useAuthStore.setState({ token: 'tok', user: mockUser, isAuthenticated: true });
    renderNavBar();
    expect(screen.getByTitle('Test User')).toBeInTheDocument();
  });

  it('shows My Registrations link when authenticated', () => {
    useAuthStore.setState({ token: 'tok', user: mockUser, isAuthenticated: true });
    renderNavBar();
    expect(screen.getByText('My Registrations')).toBeInTheDocument();
  });

  it('shows Admin Panel link for admin users', () => {
    useAuthStore.setState({ token: 'tok', user: mockUser, isAuthenticated: true });
    renderNavBar();
    expect(screen.getByText('Admin Panel')).toBeInTheDocument();
  });

  it('hides Admin Panel for non-admin users', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { ...mockUser, role: 'attendee' },
      isAuthenticated: true,
    });
    renderNavBar();
    expect(screen.queryByText('Admin Panel')).not.toBeInTheDocument();
  });

  it('shows Create Event button for organizer and admin', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { ...mockUser, role: 'organizer' },
      isAuthenticated: true,
    });
    renderNavBar();
    expect(screen.getByText('Create Event')).toBeInTheDocument();
  });

  it('hides Create Event button for attendees', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { ...mockUser, role: 'attendee' },
      isAuthenticated: true,
    });
    renderNavBar();
    expect(screen.queryByText('Create Event')).not.toBeInTheDocument();
  });

  it('avatar shows first letter of full name', () => {
    useAuthStore.setState({ token: 'tok', user: mockUser, isAuthenticated: true });
    renderNavBar();
    expect(screen.getByTitle('Test User').textContent).toBe('T');
  });

  it('logout is called on avatar click', async () => {
    useAuthStore.setState({ token: 'tok', user: mockUser, isAuthenticated: true });
    renderNavBar();
    await userEvent.click(screen.getByTitle('Test User'));
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
  });
});
