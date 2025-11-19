import { describe, it, expect } from 'vitest';
import { renderHook } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import { useAppDispatch, useAppSelector } from './hooks';
import { setCredentials } from '@/features/auth/authSlice';
import { UserRole, ThemePreference } from '@/types';

describe('Redux Hooks', () => {
  describe('useAppDispatch', () => {
    it('returns dispatch function', () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      expect(result.current).toBeDefined();
      expect(typeof result.current).toBe('function');
    });

    it('can dispatch actions', () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppDispatch(), { wrapper });

      const mockUser = {
        id: '1',
        email: 'test@example.com',
        first_name: 'Test',
        last_name: 'User',
        role: UserRole.MEMBER,
        is_approved: true,
        approved_at: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        theme_preference: ThemePreference.LIGHT,
      };

      result.current(setCredentials({ user: mockUser, accessToken: 'test-token' }));

      expect(store.getState().auth.isAuthenticated).toBe(true);
      expect(store.getState().auth.user).toEqual(mockUser);
      expect(store.getState().auth.token).toBe('test-token');
    });
  });

  describe('useAppSelector', () => {
    it('returns selected state', () => {
      const store = setupStore({
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: UserRole.MEMBER,
            is_approved: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            theme_preference: ThemePreference.LIGHT,
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppSelector((state) => state.auth), {
        wrapper,
      });

      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.email).toBe('test@example.com');
      expect(result.current.token).toBe('test-token');
    });

    it('selects nested state properties', () => {
      const store = setupStore({
        auth: {
          user: {
            id: '1',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User',
            role: UserRole.ADMIN,
            is_approved: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            theme_preference: ThemePreference.DARK,
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      });

      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useAppSelector((state) => state.auth.user), {
        wrapper,
      });

      expect(result.current?.role).toBe('admin');
      expect(result.current?.theme_preference).toBe('dark');
    });
  });
});
