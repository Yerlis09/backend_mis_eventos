import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ToastContainer from './ToastContainer';
import { useToastStore } from '../../store/toastStore';

beforeEach(() => {
  useToastStore.setState({ toasts: [] });
});

describe('ToastContainer', () => {
  it('renders container with aria-live', () => {
    const { container } = render(<ToastContainer />);
    expect(container.querySelector('[aria-live="polite"]')).toBeInTheDocument();
  });

  it('renders nothing inside container when no toasts', () => {
    const { container } = render(<ToastContainer />);
    const live = container.querySelector('[aria-live="polite"]')!;
    expect(live.children).toHaveLength(0);
  });

  it('renders a toast message', () => {
    useToastStore.getState().push('Operation successful', 'success');
    render(<ToastContainer />);
    expect(screen.getByText('Operation successful')).toBeInTheDocument();
  });

  it('renders multiple toasts', () => {
    useToastStore.getState().push('First', 'info');
    useToastStore.getState().push('Second', 'error');
    render(<ToastContainer />);
    expect(screen.getByText('First')).toBeInTheDocument();
    expect(screen.getByText('Second')).toBeInTheDocument();
  });

  it('removes toast when close button is clicked', async () => {
    useToastStore.getState().push('Closeable', 'info');
    render(<ToastContainer />);
    await userEvent.click(screen.getByLabelText('Cerrar'));
    expect(screen.queryByText('Closeable')).not.toBeInTheDocument();
  });

  it('renders success icon for success type', () => {
    useToastStore.getState().push('Done', 'success');
    render(<ToastContainer />);
    expect(screen.getByText('check_circle')).toBeInTheDocument();
  });

  it('renders error icon for error type', () => {
    useToastStore.getState().push('Fail', 'error');
    render(<ToastContainer />);
    expect(screen.getByText('error')).toBeInTheDocument();
  });

  it('renders info icon for info type', () => {
    useToastStore.getState().push('FYI', 'info');
    render(<ToastContainer />);
    expect(screen.getByText('info')).toBeInTheDocument();
  });

  it('renders warning icon for warning type', () => {
    useToastStore.getState().push('Watch out', 'warning');
    render(<ToastContainer />);
    expect(screen.getByText('warning')).toBeInTheDocument();
  });
});
