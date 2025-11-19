import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { render as rtlRender } from '@testing-library/react';
import { render, setupStore } from '@/test/utils/test-utils';
import { ProtectedRoute } from './ProtectedRoute';
import { mockUser, mockAdmin } from '@/test/mocks/mockData';
import { UserRole } from '@/types';
import { Route, Routes, MemoryRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
import { ThemeProvider } from '@/contexts/ThemeProvider';

describe('ProtectedRoute', () => {
  it('renders children when user is authenticated and has required role', () => {
    const preloadedState = {
      auth: {
        user: mockUser,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={[UserRole.MEMBER]} />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
      </Routes>,
      { preloadedState }
    );

    expect(screen.getByText('Protected Content')).toBeInTheDocument();
  });

  it('renders children when user has admin role and any role is required', () => {
    const preloadedState = {
      auth: {
        user: mockAdmin,
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    render(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN, UserRole.MEMBER]} />}>
          <Route path="/" element={<div>Admin Content</div>} />
        </Route>
      </Routes>,
      { preloadedState }
    );

    expect(screen.getByText('Admin Content')).toBeInTheDocument();
  });

  it('redirects when user is not authenticated', () => {
    const preloadedState = {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      },
    };

    render(
      <Routes>
        <Route element={<ProtectedRoute allowedRoles={[UserRole.MEMBER]} />}>
          <Route path="/" element={<div>Protected Content</div>} />
        </Route>
        <Route path="/login" element={<div>Login Page</div>} />
      </Routes>,
      { preloadedState }
    );

    expect(screen.queryByText('Protected Content')).not.toBeInTheDocument();
  });

  it('redirects when user does not have required role', () => {
    const preloadedState = {
      auth: {
        user: { ...mockUser, role: UserRole.GUEST },
        token: 'mock-token',
        isAuthenticated: true,
      },
    };

    const store = setupStore(preloadedState);

    rtlRender(
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter
            initialEntries={['/admin']}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              <Route path="/" element={<div>Home Page</div>} />
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route path="/admin" element={<div>Admin Only Content</div>} />
              </Route>
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );

    expect(screen.queryByText('Admin Only Content')).not.toBeInTheDocument();
    expect(screen.getByText('Home Page')).toBeInTheDocument();
  });
});
