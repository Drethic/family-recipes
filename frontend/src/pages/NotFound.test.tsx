import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, renderWithRouter } from '@/test/utils/test-utils';
import { NotFound } from './NotFound';

describe('NotFound', () => {
  it('renders 404 page', () => {
    render(<NotFound />);

    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();
  });

  it('navigates to home page when "Go back home" is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter({ initialEntries: ['/non-existent-page'] });

    // Verify we're on 404 page
    expect(screen.getByText('404')).toBeInTheDocument();
    expect(screen.getByText('Page not found')).toBeInTheDocument();

    // Click the "Go back home" link
    const homeLink = screen.getByText('Go back home');
    await user.click(homeLink);

    // Verify navigation to home page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome to Our Family Recipe Collection', level: 2 })).toBeInTheDocument();
    });
  });
});
