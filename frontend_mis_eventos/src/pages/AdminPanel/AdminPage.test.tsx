import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import AdminPage from './AdminPage';
import { useAuthStore } from '../../store/authStore';

const adminUser = {
  id: 1,
  email: 'admin@test.com',
  full_name: 'Admin User',
  is_active: true,
  role: 'admin' as const,
};

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
});

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <MemoryRouter>{children}</MemoryRouter>
);

describe('AdminPage', () => {
  it('shows access restricted for non-admin users', () => {
    useAuthStore.setState({
      token: 'tok',
      user: { ...adminUser, role: 'attendee' },
      isAuthenticated: true,
    });
    render(<AdminPage />, { wrapper });
    expect(screen.getByText(/Access restricted/i)).toBeInTheDocument();
  });

  it('shows user management table for admin', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('User Management')).toBeInTheDocument());
  });

  it('renders user email in table', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    await waitFor(() => expect(screen.getByText('test@test.com')).toBeInTheDocument());
  });

  it('renders total users badge', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    await waitFor(() => expect(screen.getByText(/total users/i)).toBeInTheDocument());
  });

  it('renders role select for each user', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
  });

  it('updates role when select changes', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    await waitFor(() => expect(screen.getByRole('combobox')).toBeInTheDocument());
    const select = screen.getByRole('combobox');
    await userEvent.selectOptions(select, 'organizer');
    await waitFor(() => expect((select as HTMLSelectElement).value).toBe('organizer'));
  });

  it('shows loading state initially', () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    expect(screen.getByText(/Loading users/i)).toBeInTheDocument();
  });

  it('renders search input', async () => {
    useAuthStore.setState({ token: 'tok', user: adminUser, isAuthenticated: true });
    render(<AdminPage />, { wrapper });
    expect(screen.getByPlaceholderText(/Search by email/i)).toBeInTheDocument();
  });
});
