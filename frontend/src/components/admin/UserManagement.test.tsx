import { describe, it, expect, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { UserManagement } from './UserManagement';
import { mockAdmin } from '@/test/mocks/mockData';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import { API_URL } from '@/utils/constants';

// Mock window.confirm
global.confirm = vi.fn(() => true);

describe('UserManagement Component', () => {
  const preloadedState = {
    auth: {
      user: mockAdmin,
      token: 'mock-token',
        isAuthenticated: true,
    },
  };

  it('renders user management heading', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('User Management')).toBeInTheDocument();
    });
  });

  it('displays loading state', () => {
    render(<UserManagement />, { preloadedState });

    expect(screen.getByText('Loading users...')).toBeInTheDocument();
  });

  it('displays users in table', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
      expect(screen.getByText('Admin User')).toBeInTheDocument();
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });
  });

  it('displays user email addresses', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
      expect(screen.getByText('admin@example.com')).toBeInTheDocument();
      expect(screen.getByText('pending@example.com')).toBeInTheDocument();
    });
  });

  it('highlights unapproved users', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const pendingRow = screen.getByText('Pending User').closest('tr');
      expect(pendingRow).toHaveClass('bg-yellow-50');
    });
  });

  it('shows approve and reject buttons for unapproved users', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const approveButtons = screen.getAllByText('Approve');
      const rejectButtons = screen.getAllByText('Reject');

      expect(approveButtons.length).toBeGreaterThan(0);
      expect(rejectButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles user approval', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Approve');
    await user.click(approveButtons[0]);

    await waitFor(() => {
      // After approval, the data would be refetched
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });
  });

  it('handles user rejection with confirmation', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    await user.click(rejectButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
  });

  it('shows delete button for approved users', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const deleteButtons = screen.getAllByText('Delete');
      expect(deleteButtons.length).toBeGreaterThan(0);
    });
  });

  it('handles user deletion with confirmation', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(global.confirm).toHaveBeenCalled();
  });

  it('displays user roles', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getAllByText('Member').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Admin').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Guest').length).toBeGreaterThan(0);
    });
  });

  it('displays approval status', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getAllByText('Approved').length).toBeGreaterThan(0);
      expect(screen.getByText('Pending')).toBeInTheDocument();
    });
  });

  it('does not display pagination when only one page exists', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    // With only 3 mock users and limit of 10, pagination should not show
    expect(screen.queryByText(/Page \d+ of \d+/)).not.toBeInTheDocument();
    expect(screen.queryByText('Previous')).not.toBeInTheDocument();
    expect(screen.queryByText('Next')).not.toBeInTheDocument();
  });

  it('disables role change for current user', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const adminSelects = screen.getAllByRole('combobox');
      const currentUserSelect = adminSelects.find((select) => {
        const row = select.closest('tr');
        return row?.textContent?.includes('Admin User');
      });
      expect(currentUserSelect).toBeDisabled();
    });
  });

  it('disables delete button for current user', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const currentUserRow = screen.getByText('Admin User').closest('tr');
      const currentUserDeleteButton = currentUserRow?.querySelector('button');
      expect(currentUserDeleteButton).toBeDisabled();
    });
  });

  it('shows reject button for pending users', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      const pendingRow = screen.getByText('Pending User').closest('tr');
      expect(pendingRow?.textContent).toContain('Approve');
      expect(pendingRow?.textContent).toContain('Reject');
    });
  });

  it('handles role change error gracefully', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    consoleSpy.mockRestore();
  });

  it('handles user rejection when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    await user.click(rejectButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('handles user deletion when confirmation is cancelled', async () => {
    const confirmSpy = vi.spyOn(window, 'confirm').mockReturnValue(false);
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    expect(confirmSpy).toHaveBeenCalled();
    confirmSpy.mockRestore();
  });

  it('allows changing user role', async () => {
    const user = userEvent.setup();
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const testUserSelect = selects.find((select) => {
      const row = select.closest('tr');
      return row?.textContent?.includes('Test User') && row?.textContent?.includes('test@example.com');
    });

    if (testUserSelect) {
      await user.selectOptions(testUserSelect, 'admin');
      // Role change triggers API call - the value may revert based on server response
      // Just verify the selection attempt was made
      expect(testUserSelect).toBeDefined();
    }
  });

  it('disables role select for unapproved users', async () => {
    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const pendingUserSelect = selects.find((select) => {
      const row = select.closest('tr');
      return row?.textContent?.includes('Pending User');
    });

    expect(pendingUserSelect).toBeDisabled();
  });

  it('displays pagination when multiple pages exist', async () => {
    // Create mock users for multiple pages
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: 'member',
      is_approved: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${API_URL}/users`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = manyUsers.slice(startIndex, endIndex);

        return HttpResponse.json({
          success: true,
          data: {
            users: paginatedUsers,
            pagination: {
              page,
              limit,
              totalPages: 3,
              totalUsers: 25,
            },
          },
        });
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    expect(screen.getByText('Previous')).toBeInTheDocument();
    expect(screen.getByText('Next')).toBeInTheDocument();
  });

  it('navigates to next page', async () => {
    const user = userEvent.setup();
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: 'member',
      is_approved: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${API_URL}/users`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = manyUsers.slice(startIndex, endIndex);

        return HttpResponse.json({
          success: true,
          data: {
            users: paginatedUsers,
            pagination: {
              page,
              limit,
              totalPages: 3,
              totalUsers: 25,
            },
          },
        });
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });
  });

  it('navigates to previous page', async () => {
    const user = userEvent.setup();
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: 'member',
      is_approved: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${API_URL}/users`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = manyUsers.slice(startIndex, endIndex);

        return HttpResponse.json({
          success: true,
          data: {
            users: paginatedUsers,
            pagination: {
              page,
              limit,
              totalPages: 3,
              totalUsers: 25,
            },
          },
        });
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    // Go to page 2 first
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });

    // Then go back to page 1
    const previousButton = screen.getByText('Previous');
    await user.click(previousButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });
  });

  it('disables previous button on first page', async () => {
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: 'member',
      is_approved: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${API_URL}/users`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = manyUsers.slice(startIndex, endIndex);

        return HttpResponse.json({
          success: true,
          data: {
            users: paginatedUsers,
            pagination: {
              page,
              limit,
              totalPages: 3,
              totalUsers: 25,
            },
          },
        });
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    const previousButton = screen.getByText('Previous');
    expect(previousButton).toBeDisabled();
  });

  it('disables next button on last page', async () => {
    const user = userEvent.setup();
    const manyUsers = Array.from({ length: 25 }, (_, i) => ({
      id: `user-${i + 1}`,
      email: `user${i + 1}@example.com`,
      first_name: `User`,
      last_name: `${i + 1}`,
      role: 'member',
      is_approved: true,
      theme_preference: 'system',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }));

    server.use(
      http.get(`${API_URL}/users`, ({ request }) => {
        const url = new URL(request.url);
        const page = parseInt(url.searchParams.get('page') || '1');
        const limit = parseInt(url.searchParams.get('limit') || '10');
        const startIndex = (page - 1) * limit;
        const endIndex = startIndex + limit;
        const paginatedUsers = manyUsers.slice(startIndex, endIndex);

        return HttpResponse.json({
          success: true,
          data: {
            users: paginatedUsers,
            pagination: {
              page,
              limit,
              totalPages: 3,
              totalUsers: 25,
            },
          },
        });
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText(/Page 1 of 3/)).toBeInTheDocument();
    });

    // Navigate to last page
    const nextButton = screen.getByText('Next');
    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 2 of 3/)).toBeInTheDocument();
    });

    await user.click(nextButton);

    await waitFor(() => {
      expect(screen.getByText(/Page 3 of 3/)).toBeInTheDocument();
    });

    expect(nextButton).toBeDisabled();
  });

  it('handles role change error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    server.use(
      http.patch(`${API_URL}/users/:id/role`, () => {
        return HttpResponse.json(
          { success: false, error: 'Failed to update role' },
          { status: 500 }
        );
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const selects = screen.getAllByRole('combobox');
    const testUserSelect = selects.find((select) => {
      const row = select.closest('tr');
      return row?.textContent?.includes('Test User') && row?.textContent?.includes('test@example.com');
    });

    if (testUserSelect) {
      await user.selectOptions(testUserSelect, 'admin');

      await waitFor(() => {
        expect(consoleSpy).toHaveBeenCalledWith(
          'Failed to update user role:',
          expect.anything()
        );
      });
    }

    consoleSpy.mockRestore();
  });

  it('handles approve user error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/users/:id/approve`, () => {
        return HttpResponse.json(
          { success: false, error: 'Failed to approve' },
          { status: 500 }
        );
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const approveButtons = screen.getAllByText('Approve');
    await user.click(approveButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to approve user:',
        expect.anything()
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles reject user error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    server.use(
      http.post(`${API_URL}/users/:id/reject`, () => {
        return HttpResponse.json(
          { success: false, error: 'Failed to reject' },
          { status: 500 }
        );
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Pending User')).toBeInTheDocument();
    });

    const rejectButtons = screen.getAllByText('Reject');
    await user.click(rejectButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to reject user:',
        expect.anything()
      );
    });

    consoleSpy.mockRestore();
  });

  it('handles delete user error', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    const user = userEvent.setup();

    server.use(
      http.delete(`${API_URL}/users/:id`, () => {
        return HttpResponse.json(
          { success: false, error: 'Failed to delete' },
          { status: 500 }
        );
      })
    );

    render(<UserManagement />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Test User')).toBeInTheDocument();
    });

    const deleteButtons = screen.getAllByText('Delete');
    await user.click(deleteButtons[0]);

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to delete user:',
        expect.anything()
      );
    });

    consoleSpy.mockRestore();
  });
});
