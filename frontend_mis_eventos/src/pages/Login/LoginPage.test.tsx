import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import LoginPage from './LoginPage';
import { useAuthStore } from '../../store/authStore';

beforeEach(() => {
  useAuthStore.setState({ token: null, user: null, isAuthenticated: false });
  localStorage.clear();
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>,
  );

describe('LoginPage', () => {
  it('renders the brand name', () => {
    renderPage();
    expect(screen.getByText('Mis Eventos')).toBeInTheDocument();
  });

  it('shows login form by default', () => {
    renderPage();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
  });

  it('switches to register form when Register tab clicked', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^Register$/i }));
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
  });

  it('submits login form and sets auth on success', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/Password/i), '12345678');
    await userEvent.click(screen.getByRole('button', { name: /Login to Account/i }));
    await waitFor(() => expect(useAuthStore.getState().isAuthenticated).toBe(true));
  });

  it('shows api error message on failed login', async () => {
    const { server } = await import('../../test/server');
    const { http, HttpResponse } = await import('msw');
    server.use(
      http.post('http://localhost:8000/api/v1/auth/login', () =>
        HttpResponse.json({ detail: 'Bad credentials' }, { status: 401 }),
      ),
    );
    renderPage();
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'bad@test.com');
    await userEvent.type(screen.getByLabelText(/Password/i), 'wrongpass');
    await userEvent.click(screen.getByRole('button', { name: /Login to Account/i }));
    await waitFor(() =>
      expect(screen.getByText('Bad credentials')).toBeInTheDocument(),
    );
  });

  it('login button returns to normal state after resolve', async () => {
    renderPage();
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'test@test.com');
    await userEvent.type(screen.getByLabelText(/Password/i), '12345678');
    await userEvent.click(screen.getByRole('button', { name: /Login to Account/i }));
    await waitFor(() =>
      expect(screen.queryByText('Logging in...')).not.toBeInTheDocument(),
    );
  });

  it('submits register form and returns to login tab on success', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^Register$/i }));
    await userEvent.type(screen.getByLabelText(/Full Name/i), 'New User');
    await userEvent.type(screen.getByLabelText(/Email Address/i), 'new@test.com');
    await userEvent.type(screen.getByLabelText(/Password/i), '12345678');
    await userEvent.click(screen.getByRole('button', { name: /Create Account/i }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: /Login to Account/i })).toBeInTheDocument(),
    );
  });

  it('register form shows all required fields', async () => {
    renderPage();
    await userEvent.click(screen.getByRole('button', { name: /^Register$/i }));
    expect(screen.getByLabelText(/Full Name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Create Account/i })).toBeInTheDocument();
  });
});
