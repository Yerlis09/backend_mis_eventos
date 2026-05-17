import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from './Badge';

describe('Badge', () => {
  it('renders "Published" for published status', () => {
    render(<Badge status="published" />);
    expect(screen.getByText('Published')).toBeInTheDocument();
  });

  it('renders "Draft" for draft status', () => {
    render(<Badge status="draft" />);
    expect(screen.getByText('Draft')).toBeInTheDocument();
  });

  it('renders "Cancelled" for cancelled status', () => {
    render(<Badge status="cancelled" />);
    expect(screen.getByText('Cancelled')).toBeInTheDocument();
  });

  it('applies the status class', () => {
    const { container } = render(<Badge status="published" />);
    const span = container.querySelector('span');
    expect(span?.className).toMatch(/published/);
  });
});
