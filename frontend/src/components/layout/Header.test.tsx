import { describe, it, expect, vi, beforeEach } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { Header } from './Header';
import { mockUser, mockAdmin } from '@/test/mocks/mockData';

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

describe('Header Component', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
    vi.clearAllMocks();
  });

  it('renders the site title', () => {
    render(<Header />);
    expect(screen.getByText('Family Recipes')).toBeInTheDocument();
  });

  it('shows login and register links when not authenticated', () => {
    const preloadedState = {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      },
    };

    render(<Header />, { preloadedState });

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.queryByText('Logout')).not.toBeInTheDocument();
  });

  it('shows user menu when authenticated as member', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    expect(screen.getByText(`Welcome, ${mockUser.first_name}!`)).toBeInTheDocument();
    expect(screen.getByText('My Recipes')).toBeInTheDocument();
    expect(screen.getByText('Submit Recipe')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
    expect(screen.getByText('Logout')).toBeInTheDocument();
    expect(screen.queryByText('Admin Dashboard')).not.toBeInTheDocument();
  });

  it('shows admin dashboard link when authenticated as admin', () => {
    const preloadedState = {
      auth: {
        user: mockAdmin,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
    expect(screen.getByText('My Recipes')).toBeInTheDocument();
    expect(screen.getByText('Submit Recipe')).toBeInTheDocument();
    expect(screen.getByText('Profile')).toBeInTheDocument();
  });

  it('handles logout successfully', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });

  it('has correct navigation links', () => {
    render(<Header />);

    const browseLink = screen.getByText('Browse Recipes');
    expect(browseLink).toHaveAttribute('href', '/recipes');

    const homeLink = screen.getByText('Family Recipes');
    expect(homeLink).toHaveAttribute('href', '/');
  });

  it('has correct member navigation links', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    expect(screen.getByText('My Recipes')).toHaveAttribute('href', '/member/my-recipes');
    expect(screen.getByText('Submit Recipe')).toHaveAttribute('href', '/member/submit');
    expect(screen.getByText('Profile')).toHaveAttribute('href', '/member/profile');
  });

  it('has correct admin navigation link', () => {
    const preloadedState = {
      auth: {
        user: mockAdmin,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    expect(screen.getByText('Admin Dashboard')).toHaveAttribute('href', '/admin/dashboard');
  });

  it('handles logout error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'error-token',
        isAuthenticated: true,
      },
    };

    render(<Header />, { preloadedState });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalled();
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });

    consoleSpy.mockRestore();
  });
});
