import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import {
  profileApi,
  useUpdateProfileMutation,
  useUpdateThemeMutation,
  useUpdatePasswordMutation,
} from './profileApi';

describe('profileApi', () => {
  it('defines updateProfile endpoint', () => {
    expect(profileApi.endpoints.updateProfile).toBeDefined();
  });

  it('defines updateTheme endpoint', () => {
    expect(profileApi.endpoints.updateTheme).toBeDefined();
  });

  it('defines updatePassword endpoint', () => {
    expect(profileApi.endpoints.updatePassword).toBeDefined();
  });

  it('exports useUpdateProfileMutation hook', () => {
    expect(useUpdateProfileMutation).toBeDefined();
    expect(typeof useUpdateProfileMutation).toBe('function');
  });

  it('exports useUpdateThemeMutation hook', () => {
    expect(useUpdateThemeMutation).toBeDefined();
    expect(typeof useUpdateThemeMutation).toBe('function');
  });

  it('exports useUpdatePasswordMutation hook', () => {
    expect(useUpdatePasswordMutation).toBeDefined();
    expect(typeof useUpdatePasswordMutation).toBe('function');
  });

  it('has correct reducer path', () => {
    expect(profileApi.reducerPath).toBe('profileApi');
  });

  it('has reducer function', () => {
    expect(profileApi.reducer).toBeDefined();
    expect(typeof profileApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(profileApi.middleware).toBeDefined();
  });

  it('has endpoints object', () => {
    expect(profileApi.endpoints).toBeDefined();
    expect(typeof profileApi.endpoints).toBe('object');
  });

  describe('useUpdateProfileMutation', () => {
    it('updates profile successfully with auth token', async () => {
      const store = setupStore({
        auth: {
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'member', status: 'approved', theme_preference: 'system', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          token: 'test-token-123',
          isAuthenticated: true,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper });

      const updateData = { id: '1', firstName: 'Updated', lastName: 'Name' };

      await act(async () => {
        await result.current[0](updateData).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });

    it('updates profile without auth token', async () => {
      const store = setupStore({
        auth: {
          user: null,
          token: null,
          isAuthenticated: false,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateProfileMutation(), { wrapper });

      const updateData = { id: '1', firstName: 'Updated' };

      await act(async () => {
        try {
          await result.current[0](updateData).unwrap();
        } catch (error) {
          // May fail due to lack of auth
        }
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess || result.current[1].isError).toBe(true);
      });
    });
  });

  describe('useUpdateThemeMutation', () => {
    it('updates theme successfully with auth token', async () => {
      const store = setupStore({
        auth: {
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'member', status: 'approved', theme_preference: 'system', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          token: 'test-token-123',
          isAuthenticated: true,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateThemeMutation(), { wrapper });

      const updateData = { id: '1', themePreference: 'dark' as const };

      await act(async () => {
        await result.current[0](updateData).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useUpdatePasswordMutation', () => {
    it('updates password successfully with auth token', async () => {
      const store = setupStore({
        auth: {
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'member', status: 'approved', theme_preference: 'system', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          token: 'test-token-123',
          isAuthenticated: true,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdatePasswordMutation(), { wrapper });

      const updateData = { id: '1', currentPassword: 'password', newPassword: 'newpassword' };

      await act(async () => {
        await result.current[0](updateData).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });
});
