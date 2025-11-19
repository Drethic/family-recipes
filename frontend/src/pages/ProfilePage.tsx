import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/app/hooks';
import { updateUser } from '@/features/auth/authSlice';
import {
  useUpdateProfileMutation,
  useUpdateThemeMutation,
  useUpdatePasswordMutation,
} from '@/features/profile/profileApi';
import { ThemePreference } from '@/types';
import { useTheme } from '@/hooks/useTheme';

export const ProfilePage = () => {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.auth.user);
  const { themePreference, setThemePreference } = useTheme();

  const [updateProfile, { isLoading: isUpdatingProfile }] = useUpdateProfileMutation();
  const [updateTheme, { isLoading: isUpdatingTheme }] = useUpdateThemeMutation();
  const [updatePassword, { isLoading: isUpdatingPassword }] = useUpdatePasswordMutation();

  // Profile form state
  const [profileForm, setProfileForm] = useState({
    firstName: user?.first_name || '',
    lastName: user?.last_name || '',
    email: user?.email || '',
  });

  // Password form state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  // Messages
  const [profileMessage, setProfileMessage] = useState('');
  const [passwordMessage, setPasswordMessage] = useState('');
  const [themeMessage, setThemeMessage] = useState('');

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileMessage('');

    try {
      const result = await updateProfile({
        id: user!.id,
        firstName: profileForm.firstName,
        lastName: profileForm.lastName,
        email: profileForm.email,
      }).unwrap();

      if (result.data) {
        dispatch(updateUser(result.data));
        setProfileMessage('Profile updated successfully!');
      }
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setProfileMessage(error?.data?.message || 'Failed to update profile');
    }
  };

  const handleThemeChange = async (newTheme: ThemePreference) => {
    setThemeMessage('');

    try {
      const result = await updateTheme({
        id: user!.id,
        themePreference: newTheme,
      }).unwrap();

      if (result.data) {
        dispatch(updateUser(result.data));
        setThemePreference(newTheme);
        setThemeMessage('Theme updated successfully!');
        setTimeout(() => setThemeMessage(''), 3000);
      }
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setThemeMessage(error?.data?.message || 'Failed to update theme');
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordMessage('New passwords do not match');
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      setPasswordMessage('Password must be at least 6 characters');
      return;
    }

    try {
      await updatePassword({
        id: user!.id,
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      }).unwrap();

      setPasswordMessage('Password updated successfully!');
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
    } catch (err) {
      const error = err as { data?: { message?: string } };
      setPasswordMessage(error?.data?.message || 'Failed to update password');
    }
  };

  if (!user) {
    return <div>Please log in to view your profile</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile Settings</h1>

      <div className="space-y-6">
        {/* Profile Information */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>

          {profileMessage && (
            <div className={`mb-4 rounded-md p-4 ${
              profileMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{profileMessage}</p>
            </div>
          )}

          <form onSubmit={handleProfileSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                  First Name
                </label>
                <input
                  type="text"
                  id="firstName"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={profileForm.firstName}
                  onChange={(e) => setProfileForm({ ...profileForm, firstName: e.target.value })}
                />
              </div>

              <div>
                <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                  Last Name
                </label>
                <input
                  type="text"
                  id="lastName"
                  className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                  value={profileForm.lastName}
                  onChange={(e) => setProfileForm({ ...profileForm, lastName: e.target.value })}
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                id="email"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={profileForm.email}
                onChange={(e) => setProfileForm({ ...profileForm, email: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingProfile}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isUpdatingProfile ? 'Saving...' : 'Save Profile'}
              </button>
            </div>
          </form>
        </div>

        {/* Theme Settings */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Appearance</h2>

          {themeMessage && (
            <div className={`mb-4 rounded-md p-4 ${
              themeMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{themeMessage}</p>
            </div>
          )}

          <div className="space-y-3">
            <p className="text-sm text-gray-600 mb-3">Choose how the site appears to you</p>

            <div className="space-y-2">
              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="theme"
                  value={ThemePreference.LIGHT}
                  checked={themePreference === ThemePreference.LIGHT}
                  onChange={() => handleThemeChange(ThemePreference.LIGHT)}
                  disabled={isUpdatingTheme}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">Light</span>
                  <span className="block text-sm text-gray-500">Always use light theme</span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="theme"
                  value={ThemePreference.DARK}
                  checked={themePreference === ThemePreference.DARK}
                  onChange={() => handleThemeChange(ThemePreference.DARK)}
                  disabled={isUpdatingTheme}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">Dark</span>
                  <span className="block text-sm text-gray-500">Always use dark theme</span>
                </div>
              </label>

              <label className="flex items-center p-3 border rounded-lg cursor-pointer hover:bg-gray-50">
                <input
                  type="radio"
                  name="theme"
                  value={ThemePreference.SYSTEM}
                  checked={themePreference === ThemePreference.SYSTEM}
                  onChange={() => handleThemeChange(ThemePreference.SYSTEM)}
                  disabled={isUpdatingTheme}
                  className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300"
                />
                <div className="ml-3">
                  <span className="block text-sm font-medium text-gray-900">System</span>
                  <span className="block text-sm text-gray-500">Use device theme settings</span>
                </div>
              </label>
            </div>
          </div>
        </div>

        {/* Password Change */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>

          {passwordMessage && (
            <div className={`mb-4 rounded-md p-4 ${
              passwordMessage.includes('success') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}>
              <p className="text-sm">{passwordMessage}</p>
            </div>
          )}

          <form onSubmit={handlePasswordSubmit} className="space-y-4">
            <div>
              <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700">
                Current Password
              </label>
              <input
                type="password"
                id="currentPassword"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={passwordForm.currentPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
              />
            </div>

            <div>
              <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                New Password
              </label>
              <input
                type="password"
                id="newPassword"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={passwordForm.newPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
              />
              <p className="mt-1 text-sm text-gray-500">Must be at least 6 characters</p>
            </div>

            <div>
              <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                Confirm New Password
              </label>
              <input
                type="password"
                id="confirmPassword"
                className="mt-1 block w-full px-3 py-2 rounded-md border border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500"
                value={passwordForm.confirmPassword}
                onChange={(e) => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isUpdatingPassword}
                className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 disabled:opacity-50"
              >
                {isUpdatingPassword ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </form>
        </div>

        {/* Account Info */}
        <div className="bg-white shadow rounded-lg p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Account Information</h2>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-medium">Role:</span> {user.role.charAt(0).toUpperCase() + user.role.slice(1)}</p>
            <p><span className="font-medium">Member since:</span> {new Date(user.created_at).toLocaleDateString()}</p>
          </div>
        </div>
      </div>
    </div>
  );
};
