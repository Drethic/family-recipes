import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render } from '@/test/utils/test-utils';
import { Home } from './Home';
import { mockUser } from '@/test/mocks/mockData';
import { UserRole } from '@/types';

describe('Home', () => {
  it('renders home page with title', () => {
    render(<Home />);

    expect(screen.getByText('Family Recipes')).toBeInTheDocument();
    expect(screen.getByText('Welcome to Our Family Recipe Collection')).toBeInTheDocument();
  });

  it('shows login and register links when not authenticated', () => {
    render(<Home />);

    expect(screen.getByText('Login')).toBeInTheDocument();
    expect(screen.getByText('Register')).toBeInTheDocument();
    expect(screen.getByText('Join Now')).toBeInTheDocument();
  });

  it('shows welcome message when authenticated', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Home />, { preloadedState });

    expect(screen.getByText(`Welcome, ${mockUser.first_name}!`)).toBeInTheDocument();
    expect(screen.queryByText('Join Now')).not.toBeInTheDocument();
  });

  it('shows admin dashboard link for admin users', () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    const preloadedState = {
      auth: {
        user: adminUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Home />, { preloadedState });

    expect(screen.getByText('Admin Dashboard')).toBeInTheDocument();
  });

  it('shows my recipes link for member users', () => {
    const memberUser = { ...mockUser, role: UserRole.MEMBER };
    const preloadedState = {
      auth: {
        user: memberUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Home />, { preloadedState });

    expect(screen.getByText('My Recipes')).toBeInTheDocument();
  });

  it('shows my recipes link for admin users', () => {
    const adminUser = { ...mockUser, role: UserRole.ADMIN };
    const preloadedState = {
      auth: {
        user: adminUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(<Home />, { preloadedState });

    expect(screen.getByText('My Recipes')).toBeInTheDocument();
  });

  it('shows browse recipes button', () => {
    render(<Home />);

    expect(screen.getByText('Browse Recipes')).toBeInTheDocument();
  });

  it('renders main content area', () => {
    render(<Home />);

    expect(screen.getByText('Discover, share, and preserve family recipes for generations to come')).toBeInTheDocument();
  });
});
