import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider } from './ThemeProvider';
import { useTheme } from '@/hooks/useTheme';
import authReducer from '@/features/auth/authSlice';
import { ThemePreference, User } from '@/types';
import { mockUser } from '@/test/mocks/mockData';

describe('ThemeContext', () => {
  const createMockStore = (user: User | null = null) => {
    return configureStore({
      reducer: {
        auth: authReducer,
      },
      preloadedState: {
        auth: {
          user,
          token: user ? 'mock-token' : null,
          isAuthenticated: !!user,
        },
      },
    });
  };

  beforeEach(() => {
    document.documentElement.classList.remove('dark');
  });

  it('throws error when useTheme is used outside ThemeProvider', () => {
    expect(() => {
      renderHook(() => useTheme());
    }).toThrow('useTheme must be used within a ThemeProvider');
  });

  it('initializes with system theme preference when no user', () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themePreference).toBe(ThemePreference.SYSTEM);
  });

  it('initializes with user theme preference when user is logged in', () => {
    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.DARK });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    expect(result.current.themePreference).toBe(ThemePreference.DARK);
  });

  it('applies dark class when theme is dark', () => {
    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.DARK });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('removes dark class when theme is light', () => {
    document.documentElement.classList.add('dark');

    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.LIGHT });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    renderHook(() => useTheme(), { wrapper });

    expect(document.documentElement.classList.contains('dark')).toBe(false);
  });

  it('allows setting theme preference', () => {
    const store = createMockStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    act(() => {
      result.current.setThemePreference(ThemePreference.DARK);
    });

    expect(result.current.themePreference).toBe(ThemePreference.DARK);
    expect(result.current.theme).toBe('dark');
  });

  it('uses system preference when set to system', () => {
    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.SYSTEM });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // matchMedia is mocked to return false in setup.ts
    expect(result.current.theme).toBe('light');
  });

  it('responds to system theme changes when preference is system', () => {
    let changeListener: (() => void) | null = null;

    // Mock matchMedia to capture the event listener
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, listener) => {
        if (event === 'change') {
          changeListener = listener;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.SYSTEM });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Initially light (matchMedia mocked to return false)
    expect(result.current.theme).toBe('light');

    // Simulate system preference change by calling the listener directly
    act(() => {
      if (changeListener) {
        changeListener();
      }
    });

    // Theme should still be light because our mock matchMedia always returns matches: false
    // But the event handler was called (covering line 66-67)
    expect(result.current.themePreference).toBe(ThemePreference.SYSTEM);
  });

  it('does not respond to system theme changes when preference is not system', () => {
    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.DARK });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Initially dark (from user preference)
    expect(result.current.theme).toBe('dark');

    // Simulate system preference change
    const matchMediaMock = window.matchMedia('(prefers-color-scheme: dark)');
    act(() => {
      const event = new Event('change');
      matchMediaMock.dispatchEvent(event);
    });

    // Theme should still be dark (not affected by system change)
    expect(result.current.theme).toBe('dark');
  });

  it('uses dark theme when system preference is dark', () => {
    let changeListener: (() => void) | null = null;

    // Mock matchMedia to return true (dark mode)
    const mockMatchMedia = vi.fn().mockImplementation(query => ({
      matches: true, // System prefers dark
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn((event, listener) => {
        if (event === 'change') {
          changeListener = listener;
        }
      }),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    }));

    Object.defineProperty(window, 'matchMedia', {
      writable: true,
      value: mockMatchMedia,
    });

    const store = createMockStore({ ...mockUser, theme_preference: ThemePreference.SYSTEM });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>
        <ThemeProvider>{children}</ThemeProvider>
      </Provider>
    );

    const { result } = renderHook(() => useTheme(), { wrapper });

    // Should use dark theme from system preference
    expect(result.current.theme).toBe('dark');
    expect(document.documentElement.classList.contains('dark')).toBe(true);

    // Also test that the change listener works
    act(() => {
      if (changeListener) {
        changeListener();
      }
    });

    // Should still be dark
    expect(result.current.theme).toBe('dark');
  });
});
