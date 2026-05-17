import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Pagination from './Pagination';

describe('Pagination', () => {
  it('renders nothing when totalPages is 1', () => {
    const { container } = render(
      <Pagination currentPage={1} totalPages={1} onPageChange={vi.fn()} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders page buttons for small page counts', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('calls onPageChange with next page when next button clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={2} totalPages={5} onPageChange={onPageChange} />);
    const nextBtn = screen.getByLabelText('Página siguiente');
    await userEvent.click(nextBtn);
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('calls onPageChange with prev page when prev button clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={3} totalPages={5} onPageChange={onPageChange} />);
    const prevBtn = screen.getByLabelText('Página anterior');
    await userEvent.click(prevBtn);
    expect(onPageChange).toHaveBeenCalledWith(2);
  });

  it('disables prev button on first page', () => {
    render(<Pagination currentPage={1} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Página anterior')).toBeDisabled();
  });

  it('disables next button on last page', () => {
    render(<Pagination currentPage={5} totalPages={5} onPageChange={vi.fn()} />);
    expect(screen.getByLabelText('Página siguiente')).toBeDisabled();
  });

  it('calls onPageChange when a page number is clicked', async () => {
    const onPageChange = vi.fn();
    render(<Pagination currentPage={1} totalPages={4} onPageChange={onPageChange} />);
    await userEvent.click(screen.getByText('3'));
    expect(onPageChange).toHaveBeenCalledWith(3);
  });

  it('shows ellipsis for large page counts', () => {
    render(<Pagination currentPage={5} totalPages={20} onPageChange={vi.fn()} />);
    const dots = screen.getAllByText('...');
    expect(dots.length).toBeGreaterThan(0);
  });
});
