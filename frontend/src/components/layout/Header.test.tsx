import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render, renderWithRouter } from '@/test/utils/test-utils';
import { Header } from './Header';
import { mockUser, mockAdmin } from '@/test/mocks/mockData';

describe('Header Component', () => {

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

    renderWithRouter({ preloadedState, initialEntries: ['/'] });

    const logoutButton = screen.getByText('Logout');
    await user.click(logoutButton);

    // After logout, user should be redirected to home and see login/register links
    await waitFor(() => {
      expect(screen.getByText('Login')).toBeInTheDocument();
      expect(screen.getByText('Register')).toBeInTheDocument();
    });
  });

  it('navigates to recipes page when Browse Recipes is clicked', async () => {
    const user = userEvent.setup();
    renderWithRouter({ initialEntries: ['/'] });

    // Verify we start on home page
    expect(screen.getByText('Welcome to Our Family Recipe Collection')).toBeInTheDocument();

    // Click Browse Recipes link in header (first occurrence)
    const browseLinks = screen.getAllByText('Browse Recipes');
    await user.click(browseLinks[0]);

    // Verify navigation to recipes page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
    });
  });

  it('navigates to home page when site title is clicked', async () => {
    const user = userEvent.setup();
    // Start from home, then go to recipes, then back to home
    renderWithRouter({ initialEntries: ['/'] });

    // Navigate to recipes first
    const browseLinks = screen.getAllByText('Browse Recipes');
    await user.click(browseLinks[0]);

    // Wait for recipes page to load
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'All Recipes' })).toBeInTheDocument();
    });

    // Click Family Recipes title in header to go back home
    const homeLinks = screen.getAllByText('Family Recipes');
    await user.click(homeLinks[0]);

    // Verify navigation back to home page
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Welcome to Our Family Recipe Collection', level: 2 })).toBeInTheDocument();
    });
  });

  it('navigates to My Recipes when clicked (authenticated member)', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    renderWithRouter({ preloadedState, initialEntries: ['/'] });

    // Click My Recipes link in header
    const myRecipesLinks = screen.getAllByText('My Recipes');
    await user.click(myRecipesLinks[0]);

    // Verify navigation to member dashboard - check for the h2 heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'My Recipes', level: 2 })).toBeInTheDocument();
    });
  });

  it('navigates to Submit Recipe when clicked (authenticated member)', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    renderWithRouter({ preloadedState, initialEntries: ['/'] });

    // Click Submit Recipe link
    const submitLink = screen.getByText('Submit Recipe');
    await user.click(submitLink);

    // Verify navigation to submit page
    await waitFor(() => {
      expect(screen.getByText('Submit a New Recipe')).toBeInTheDocument();
    });
  });

  it('navigates to Profile when clicked (authenticated member)', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    renderWithRouter({ preloadedState, initialEntries: ['/'] });

    // Click Profile link
    const profileLink = screen.getByText('Profile');
    await user.click(profileLink);

    // Verify navigation to profile page
    await waitFor(() => {
      expect(screen.getByText('Profile Information')).toBeInTheDocument();
    });
  });

  it('navigates to Admin Dashboard when clicked (authenticated admin)', async () => {
    const user = userEvent.setup();
    const preloadedState = {
      auth: {
        user: mockAdmin,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    renderWithRouter({ preloadedState, initialEntries: ['/'] });

    // Click Admin Dashboard link
    const adminLink = screen.getByText('Admin Dashboard');
    await user.click(adminLink);

    // Verify navigation to admin dashboard - check for Pending Recipes heading
    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Pending Recipes' })).toBeInTheDocument();
    });
  });
});
