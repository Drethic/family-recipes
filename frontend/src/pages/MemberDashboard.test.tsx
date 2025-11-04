import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { MemberDashboard } from './MemberDashboard';
import { mockUser } from '@/test/mocks/mockData';
import { UserRole } from '@/types';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('MemberDashboard', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  const preloadedState = {
    auth: {
      user: { ...mockUser, role: UserRole.MEMBER },
      token: 'mock-token',
      isAuthenticated: true,
    },
  };

  it('renders member dashboard layout', () => {
    render(<MemberDashboard />, { preloadedState });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Recipes')).toBeInTheDocument();
    expect(screen.getByText('Submit Recipe')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Back to Home')).toBeInTheDocument();
  });

  it('displays my recipes by default', async () => {
    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('My Recipes')).toBeInTheDocument();
    });
  });

  it('shows loading state for recipes', () => {
    render(<MemberDashboard />, { preloadedState });

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('displays recipes when they exist', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe, mockPendingRecipe, mockPrivateRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe, mockPendingRecipe, mockPrivateRecipe]
        });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test Recipe')).toBeInTheDocument();
      expect(screen.getByText('Pending Recipe')).toBeInTheDocument();
      expect(screen.getByText('Private Recipe')).toBeInTheDocument();
    });
  });

  it('displays approved status badge', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe, mockPendingRecipe, mockPrivateRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe, mockPendingRecipe, mockPrivateRecipe]
        });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      const approvedBadges = screen.getAllByText('Approved');
      expect(approvedBadges.length).toBeGreaterThan(0);
      expect(approvedBadges[0].className).toContain('bg-green-100');
    });
  });

  it('displays pending status badge', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe, mockPendingRecipe, mockPrivateRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe, mockPendingRecipe, mockPrivateRecipe]
        });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      const pendingBadge = screen.getByText('Pending Approval');
      expect(pendingBadge).toBeInTheDocument();
      expect(pendingBadge.className).toContain('bg-yellow-100');
    });
  });

  it('displays rejected status badge', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe, mockUser } = await import('@/test/mocks/mockData');

    const rejectedRecipe = {
      ...mockRecipe,
      id: '999',
      title: 'Rejected Recipe',
      status: 'rejected',
      author_id: mockUser.id,
    };

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({ success: true, data: [rejectedRecipe] });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      const rejectedBadge = screen.getByText('Rejected');
      expect(rejectedBadge).toBeInTheDocument();
      expect(rejectedBadge.className).toContain('bg-red-100');
    });
  });

  it('displays message when no recipes exist', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({ success: true, data: [] });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText("You haven't created any recipes yet.")).toBeInTheDocument();
    });
  });

  it('renders sidebar navigation links', () => {
    render(<MemberDashboard />, { preloadedState });

    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Recipes')).toBeInTheDocument();
    expect(screen.getByText('Submit Recipe')).toBeInTheDocument();
    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('renders back to home link', () => {
    render(<MemberDashboard />, { preloadedState });

    const homeLink = screen.getByText('Back to Home');
    expect(homeLink).toBeInTheDocument();
    expect(homeLink.closest('a')).toHaveAttribute('href', '/');
  });

  it('navigation links have correct hrefs', () => {
    render(<MemberDashboard />, { preloadedState });

    const dashboardLink = screen.getAllByText('Dashboard')[0].closest('a');
    const recipesLink = screen.getAllByText('My Recipes')[0].closest('a');
    const submitLink = screen.getByText('Submit Recipe').closest('a');
    const profileLink = screen.getByText('Profile Settings').closest('a');

    expect(dashboardLink).toHaveAttribute('href', '/member/dashboard');
    expect(recipesLink).toHaveAttribute('href', '/member/my-recipes');
    expect(submitLink).toHaveAttribute('href', '/member/submit');
    expect(profileLink).toHaveAttribute('href', '/member/profile');
  });

  it('renders main content area', () => {
    render(<MemberDashboard />, { preloadedState });

    const mainElement = screen.getByRole('main');
    expect(mainElement).toBeInTheDocument();
  });

  it('renders aside navigation', () => {
    render(<MemberDashboard />, { preloadedState });

    const asideElement = screen.getByRole('complementary');
    expect(asideElement).toBeInTheDocument();
  });

  it('renders View and Edit buttons for recipes', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe, mockPendingRecipe, mockPrivateRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe, mockPendingRecipe, mockPrivateRecipe]
        });
      })
    );

    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      const viewButtons = screen.getAllByText('View');
      const editButtons = screen.getAllByText('Edit');

      expect(viewButtons.length).toBeGreaterThan(0);
      expect(editButtons.length).toBeGreaterThan(0);
    });
  });

  it('navigates to recipe detail when View button is clicked', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe]
        });
      })
    );

    const user = userEvent.setup();
    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(mockRecipe.title)).toBeInTheDocument();
    });

    const viewButtons = screen.getAllByText('View');
    await user.click(viewButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(`/recipes/${mockRecipe.id}`);
  });

  it('navigates to edit page when Edit button is clicked', async () => {
    const { http, HttpResponse } = await import('msw');
    const { server } = await import('@/test/mocks/server');
    const { API_URL } = await import('@/utils/constants');
    const { mockRecipe } = await import('@/test/mocks/mockData');

    server.use(
      http.get(`${API_URL}/recipes/my-recipes`, () => {
        return HttpResponse.json({
          success: true,
          data: [mockRecipe]
        });
      })
    );

    const user = userEvent.setup();
    render(<MemberDashboard />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(mockRecipe.title)).toBeInTheDocument();
    });

    const editButtons = screen.getAllByText('Edit');
    await user.click(editButtons[0]);

    expect(mockNavigate).toHaveBeenCalledWith(`/member/edit/${mockRecipe.id}`);
  });
});
