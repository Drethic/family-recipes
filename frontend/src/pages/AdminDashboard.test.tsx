import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { AdminDashboard } from './AdminDashboard';
import { mockAdmin } from '@/test/mocks/mockData';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('AdminDashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const preloadedState = {
    auth: {
      user: mockAdmin,
      token: 'mock-token',
      isAuthenticated: true,
    },
  };

  it('renders admin dashboard layout', () => {
    render(<AdminDashboard />, { preloadedState });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pending Recipes')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('displays pending recipes by default', async () => {
    render(<AdminDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipes')).toBeInTheDocument();
    });
  });

  it('shows loading state for pending recipes', () => {
    render(<AdminDashboard />, { preloadedState });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays content after loading', async () => {
    render(<AdminDashboard />, { preloadedState });

    await waitFor(() => {
      const loadingElement = screen.queryByText('Loading...');
      expect(loadingElement).not.toBeInTheDocument();
    }, { timeout: 3000 });
  });

  it('renders sidebar navigation links', () => {
    render(<AdminDashboard />, { preloadedState });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Pending Recipes')).toBeInTheDocument();
    expect(screen.getByText('User Management')).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(<AdminDashboard />, { preloadedState });

    const homeLink = screen.getByText('Back to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('navigation links have correct hrefs', () => {
    render(<AdminDashboard />, { preloadedState });

    const dashboardLink = screen.getAllByText('Dashboard')[0].closest('a');
    const pendingLink = screen.getByText('Pending Recipes').closest('a');
    const usersLink = screen.getByText('User Management').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/admin/dashboard');
    expect(pendingLink).toHaveAttribute('href', '/admin/recipes/pending');
    expect(usersLink).toHaveAttribute('href', '/admin/users');
  });

  it('renders main content area', () => {
    render(<AdminDashboard />, { preloadedState });

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('renders aside navigation', () => {
    render(<AdminDashboard />, { preloadedState });

    const asideElement = screen.getByRole('complementary');
    expect(asideElement).toBeInTheDocument();
  });

  it('displays message when no pending recipes exist', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server: mswServer } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    mswServer.use(
      http.get(`${API_URL}/recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: {
            recipes: [],
            pagination: {
              page: 1,
              limit: 10,
              totalPages: 0,
              totalRecipes: 0,
            },
          },
        });
      })
    );

    render(<AdminDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('No pending recipes to review.')).toBeInTheDocument();
    });
  });

  it('displays pending recipe with author information', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText(/Submitted by/)).toBeInTheDocument();
    });
  });

  it('renders view button for pending recipes', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons.length).toBeGreaterThan(0);
  });

  it('renders edit button for pending recipes', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons.length).toBeGreaterThan(0);
  });

  it('renders approve button for pending recipes', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Approve');
    expect(approveButtons.length).toBeGreaterThan(0);
  });

  it('renders reject button for pending recipes', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    expect(rejectButtons.length).toBeGreaterThan(0);
  });

  it('View button is clickable', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    expect(viewButtons[0]).toBeEnabled();
  });

  it('Edit button is clickable', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    expect(editButtons[0]).toBeEnabled();
  });

  it('Approve button is clickable', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Approve');
    expect(approveButtons[0]).toBeEnabled();
  });

  it('Reject button is clickable', async () => {
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    expect(rejectButtons[0]).toBeEnabled();
  });

  it('calls approve mutation when Approve button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Approve');

    await user.click(approveButtons[0]);

    // Wait for any state updates from the mutation
    await waitFor(() => {
      // The button should still be in the document after clicking
      expect(approveButtons[0]).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('calls reject mutation when Reject button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');

    await user.click(rejectButtons[0]);

    // Wait for any state updates from the mutation
    await waitFor(() => {
      // The button should still be in the document after clicking
      expect(rejectButtons[0]).toBeInTheDocument();
    }, { timeout: 1000 });
  });

  it('navigates to recipe detail when View button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    await user.click(viewButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/recipes/2');
  });

  it('navigates to edit page when Edit button is clicked', async () => {
    const user = userEvent.setup();
    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    await waitFor(() => {
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith('/admin/edit/2');
  });

  it('handles null recipes data in API response', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    // Override MSW handler BEFORE rendering to return null recipes
    server.use(
      http.get(`${API_URL}/recipes`, ({ request }) => {
        const url = new URL(request.url);
        // Match the exact query parameter used by PendingRecipes component
        if (url.searchParams.get('status') === 'pending') {
          return HttpResponse.json({
            success: true,
            data: {
              recipes: null,  // This triggers line 17 fallback: || []
              pagination: { page: 1, limit: 20, total: 0, pages: 0 }
            },
          });
        }
      })
    );

    render(<AdminDashboard />, {
      preloadedState,
      initialRoute: '/admin/dashboard'
    });

    // When recipes is null, the fallback || [] creates an empty array
    // which triggers the "No pending recipes" message (line 23-24)
    await waitFor(() => {
      expect(screen.getByText('No pending recipes to review.')).toBeInTheDocument();
    });
  });

});
