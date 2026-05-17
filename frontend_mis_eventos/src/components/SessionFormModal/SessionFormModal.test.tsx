import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SessionFormModal from './SessionFormModal';
import { useToastStore } from '../../store/toastStore';
import type { EventSession } from '../../types';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

const mockSession: EventSession = {
  id: 1,
  title: 'Opening Keynote',
  speaker: 'Ana Martínez',
  start_datetime: '2026-06-01T09:00:00Z',
  end_datetime: '2026-06-01T10:00:00Z',
  capacity: 200,
};

const defaultProps = {
  eventId: 1,
  session: null,
  onClose: vi.fn(),
  onSaved: vi.fn(),
};

describe('SessionFormModal — create mode', () => {
  it('renders "Nueva sesión" heading', () => {
    render(<SessionFormModal {...defaultProps} />);
    expect(screen.getByText('Nueva sesión')).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<SessionFormModal {...defaultProps} />);
    expect(screen.getByLabelText(/Título/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Ponente/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Inicio/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Fin/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Capacidad/i)).toBeInTheDocument();
  });

  it('calls onClose when cancel button clicked', async () => {
    const onClose = vi.fn();
    render(<SessionFormModal {...defaultProps} onClose={onClose} />);
    await userEvent.click(screen.getByText('Cancelar'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onClose when Escape key pressed', async () => {
    const onClose = vi.fn();
    render(<SessionFormModal {...defaultProps} onClose={onClose} />);
    await userEvent.keyboard('{Escape}');
    expect(onClose).toHaveBeenCalled();
  });

  it('shows error when end date is before start date', async () => {
    render(<SessionFormModal {...defaultProps} />);
    await userEvent.type(screen.getByLabelText(/Título/i), 'My Talk');
    await userEvent.type(screen.getByLabelText(/Ponente/i), 'John');
    await userEvent.type(screen.getByLabelText(/Capacidad/i), '50');

    const startInput = screen.getByLabelText(/Inicio/i);
    const endInput = screen.getByLabelText(/Fin/i);
    await userEvent.type(startInput, '2026-06-01T10:00');
    await userEvent.type(endInput, '2026-06-01T09:00');

    await userEvent.click(screen.getByText('Crear sesión'));
    await waitFor(() =>
      expect(screen.getByText(/inicio debe ser anterior/i)).toBeInTheDocument(),
    );
  });

  it('submits and calls onSaved on success', async () => {
    const onSaved = vi.fn();
    render(<SessionFormModal {...defaultProps} onSaved={onSaved} />);
    await userEvent.type(screen.getByLabelText(/Título/i), 'New Talk');
    await userEvent.type(screen.getByLabelText(/Ponente/i), 'John Doe');
    await userEvent.type(screen.getByLabelText(/Capacidad/i), '100');

    const startInput = screen.getByLabelText(/Inicio/i);
    const endInput = screen.getByLabelText(/Fin/i);
    await userEvent.type(startInput, '2026-06-01T09:00');
    await userEvent.type(endInput, '2026-06-01T10:00');

    await userEvent.click(screen.getByText('Crear sesión'));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(useToastStore.getState().toasts.some((t) => t.type === 'success')).toBe(true);
  });
});

describe('SessionFormModal — edit mode', () => {
  it('renders "Editar sesión" heading', () => {
    render(<SessionFormModal {...defaultProps} session={mockSession} />);
    expect(screen.getByText('Editar sesión')).toBeInTheDocument();
  });

  it('pre-fills form with session data', () => {
    render(<SessionFormModal {...defaultProps} session={mockSession} />);
    expect(screen.getByLabelText<HTMLInputElement>(/Título/i).value).toBe('Opening Keynote');
    expect(screen.getByLabelText<HTMLInputElement>(/Ponente/i).value).toBe('Ana Martínez');
    expect(screen.getByLabelText<HTMLInputElement>(/Capacidad/i).value).toBe('200');
  });

  it('renders "Guardar cambios" submit button', () => {
    render(<SessionFormModal {...defaultProps} session={mockSession} />);
    expect(screen.getByText('Guardar cambios')).toBeInTheDocument();
  });
});
