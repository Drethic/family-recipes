import { render, screen, waitFor } from '@testing-library/react';
import { Provider } from 'react-redux';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { AuthRestoration } from './AuthRestoration';
import { setupStore } from '@/test/utils/test-utils';
import { useRefreshMutation } from './authApi';

// Mock the useRefreshMutation hook
vi.mock('./authApi', async () => {
  const actual = await vi.importActual('./authApi');
  return {
    ...actual,
    useRefreshMutation: vi.fn(),
  };
});

describe('AuthRestoration', () => {
  let store: ReturnType<typeof setupStore>;
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    store = setupStore();
    // Suppress console errors during tests
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.clearAllMocks();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it('should render children', () => {
    const mockRefresh = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('No token')),
    });
    vi.mocked(useRefreshMutation).mockReturnValue([mockRefresh, {} as never]);

    render(
      <Provider store={store}>
        <AuthRestoration>
          <div>Test Child</div>
        </AuthRestoration>
      </Provider>
    );

    expect(screen.getByText('Test Child')).toBeInTheDocument();
  });

  it('should call refresh mutation on mount', async () => {
    const mockRefresh = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('No refresh token')),
    });
    vi.mocked(useRefreshMutation).mockReturnValue([mockRefresh, {} as never]);

    render(
      <Provider store={store}>
        <AuthRestoration>
          <div>Test Child</div>
        </AuthRestoration>
      </Provider>
    );

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });
  });

  it('should handle refresh failure silently', async () => {
    const mockRefresh = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('No refresh token')),
    });
    vi.mocked(useRefreshMutation).mockReturnValue([mockRefresh, {} as never]);

    render(
      <Provider store={store}>
        <AuthRestoration>
          <div>Test Child</div>
        </AuthRestoration>
      </Provider>
    );

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    // Verify no error was logged to console
    expect(consoleErrorSpy).not.toHaveBeenCalled();

    // Verify user stays logged out
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });

  it('should not call refresh more than once on mount', async () => {
    const mockRefresh = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockRejectedValue(new Error('No token')),
    });
    vi.mocked(useRefreshMutation).mockReturnValue([mockRefresh, {} as never]);

    render(
      <Provider store={store}>
        <AuthRestoration>
          <div>Test Child</div>
        </AuthRestoration>
      </Provider>
    );

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalledTimes(1);
    });

    // Wait a bit more to ensure it's not called again
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(mockRefresh).toHaveBeenCalledTimes(1);
  });

  it('should not set credentials when refresh returns no access token', async () => {
    const mockRefresh = vi.fn().mockReturnValue({
      unwrap: vi.fn().mockResolvedValue({
        success: true,
        data: {}, // No accessToken
      }),
    });
    vi.mocked(useRefreshMutation).mockReturnValue([mockRefresh, {} as never]);

    render(
      <Provider store={store}>
        <AuthRestoration>
          <div>Test Child</div>
        </AuthRestoration>
      </Provider>
    );

    await waitFor(() => {
      expect(mockRefresh).toHaveBeenCalled();
    });

    // Verify user stays logged out
    const state = store.getState();
    expect(state.auth.isAuthenticated).toBe(false);
    expect(state.auth.user).toBeNull();
    expect(state.auth.token).toBeNull();
  });
});
