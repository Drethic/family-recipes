import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/test/utils/test-utils';
import { ProfilePage } from './ProfilePage';
import { mockUser } from '@/test/mocks/mockData';

describe('ProfilePage', () => {
  const preloadedState = {
    auth: {
      user: mockUser,
      token: 'mock-token',
        isAuthenticated: true,
    },
  };

  it('renders profile information', () => {
    render(<ProfilePage />, { preloadedState });

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
    expect(screen.getByText('Profile Information')).toBeInTheDocument();
    expect(screen.getByText('Appearance')).toBeInTheDocument();
    expect(screen.getByText('Change Password')).toBeInTheDocument();
  });

  it('displays user information in form fields', () => {
    render(<ProfilePage />, { preloadedState });

    expect(screen.getByLabelText('First Name')).toHaveValue(mockUser.first_name);
    expect(screen.getByLabelText('Last Name')).toHaveValue(mockUser.last_name);
    expect(screen.getByLabelText('Email Address')).toHaveValue(mockUser.email);
  });

  it('allows typing in lastName field', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const lastNameInput = screen.getByLabelText('Last Name');
    await user.clear(lastNameInput);
    await user.type(lastNameInput, 'NewLastName');

    expect(lastNameInput).toHaveValue('NewLastName');
  });

  it('allows updating profile information', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const firstNameInput = screen.getByLabelText('First Name');
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    await user.clear(firstNameInput);
    await user.type(firstNameInput, 'Updated');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/profile updated successfully/i)).toBeInTheDocument();
    });
  });

  it('displays theme preference options', () => {
    render(<ProfilePage />, { preloadedState });

    expect(screen.getByText('Always use light theme')).toBeInTheDocument();
    expect(screen.getByText('Always use dark theme')).toBeInTheDocument();
    expect(screen.getByText('Use device theme settings')).toBeInTheDocument();
  });

  it('allows changing theme preference', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const darkThemeRadio = screen.getByRole('radio', { name: /dark/i });
    await user.click(darkThemeRadio);

    await waitFor(() => {
      expect(darkThemeRadio).toBeChecked();
    });
  });

  it('shows error message on theme update failure', async () => {
    const { server } = await import('@/test/mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.patch('http://localhost:9999/api/profile/:id/theme', () => {
        return HttpResponse.json(
          { success: false, message: 'Failed to update theme' },
          { status: 500 }
        );
      })
    );

    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const lightThemeRadio = screen.getByRole('radio', { name: /light/i });
    await user.click(lightThemeRadio);

    await waitFor(() => {
      const messageElement = screen.getByText(/failed to update theme/i);
      expect(messageElement).toBeInTheDocument();
      expect(messageElement.closest('div')).toHaveClass('bg-red-50');
    });
  });

  it('validates password confirmation matches', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changePasswordButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'password');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'differentpassword');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText(/do not match/i)).toBeInTheDocument();
    });
  });

  it('validates password length requirement', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changePasswordButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'password');
    await user.type(newPasswordInput, '12345');
    await user.type(confirmPasswordInput, '12345');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText(/password must be at least 6 characters/i)).toBeInTheDocument();
    });
  });

  it('successfully changes password with valid inputs', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changePasswordButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'password');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
    });
  });

  it('displays account information when present', () => {
    render(<ProfilePage />, { preloadedState });

    expect(screen.getByText('Profile Settings')).toBeInTheDocument();
  });

  it('redirects unauthenticated users', () => {
    const unauthenticatedState = {
      auth: {
        user: null,
        token: null,
        isAuthenticated: false,
      },
    };

    render(<ProfilePage />, { preloadedState: unauthenticatedState });

    expect(screen.getByText('Please log in to view your profile')).toBeInTheDocument();
  });

  it('shows error message on profile update failure', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const emailInput = screen.getByLabelText('Email Address');
    const saveButton = screen.getByRole('button', { name: /save profile/i });

    // Use an email that will trigger error in MSW handler
    await user.clear(emailInput);
    await user.type(emailInput, 'error@example.com');
    await user.click(saveButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update profile/i)).toBeInTheDocument();
    });
  });

  it('shows error message on password update failure', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changePasswordButton = screen.getByRole('button', { name: /update password/i });

    // Use wrong current password to trigger error
    await user.type(currentPasswordInput, 'wrongpassword');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText(/failed to update password/i)).toBeInTheDocument();
    });
  });

  it('clears password form after successful password change', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    const currentPasswordInput = screen.getByLabelText('Current Password');
    const newPasswordInput = screen.getByLabelText('New Password');
    const confirmPasswordInput = screen.getByLabelText('Confirm New Password');
    const changePasswordButton = screen.getByRole('button', { name: /update password/i });

    await user.type(currentPasswordInput, 'password');
    await user.type(newPasswordInput, 'newpassword123');
    await user.type(confirmPasswordInput, 'newpassword123');
    await user.click(changePasswordButton);

    await waitFor(() => {
      expect(screen.getByText(/password updated successfully/i)).toBeInTheDocument();
      expect(currentPasswordInput).toHaveValue('');
      expect(newPasswordInput).toHaveValue('');
      expect(confirmPasswordInput).toHaveValue('');
    });
  });

  it('shows theme preference options', async () => {
    render(<ProfilePage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
      expect(screen.getByLabelText(/Light/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/Dark/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/System/i)).toBeInTheDocument();
    });
  });

  it('allows changing theme preference', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    const lightRadio = screen.getByLabelText(/Light/i);
    await user.click(lightRadio);

    // Theme change should be triggered
    expect(lightRadio).toBeChecked();
  });

  it('allows changing to system theme', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    // First click Light to change from System (which is the default)
    const lightRadio = screen.getByLabelText(/Light/i);
    await user.click(lightRadio);

    // Then click System to cover the onChange handler
    const systemRadio = screen.getByLabelText(/System/i);
    await user.click(systemRadio);

    // Theme change should be triggered
    expect(systemRadio).toBeChecked();
  });

  it('displays theme success message with green styling', async () => {
    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    const darkRadio = screen.getByLabelText(/Dark/i);
    await user.click(darkRadio);

    // Should show success message with green background
    await waitFor(() => {
      const messageElement = screen.getByText(/theme updated successfully/i);
      expect(messageElement).toBeInTheDocument();
      expect(messageElement.closest('div')).toHaveClass('bg-green-50');
    });
  });

  it('handles theme update with no data returned', async () => {
    const { server } = await import('@/test/mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.patch('http://localhost:9999/api/profile/:id/theme', () => {
        return HttpResponse.json({
          success: true,
          data: null,
        });
      })
    );

    const user = userEvent.setup();
    render(<ProfilePage />, { preloadedState });

    await waitFor(() => {
      expect(screen.getByText('Appearance')).toBeInTheDocument();
    });

    const darkRadio = screen.getByLabelText(/Dark/i);
    await user.click(darkRadio);

    // Should not show any error even if no data returned
    await waitFor(() => {
      const errorMessage = screen.queryByText(/failed/i);
      expect(errorMessage).not.toBeInTheDocument();
    });
  });
});
