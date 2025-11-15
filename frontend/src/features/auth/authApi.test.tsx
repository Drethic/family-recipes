import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import {
  authApi,
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetMeQuery,
  useRefreshMutation,
} from './authApi';

describe('authApi', () => {
  it('defines login endpoint', () => {
    expect(authApi.endpoints.login).toBeDefined();
  });

  it('defines register endpoint', () => {
    expect(authApi.endpoints.register).toBeDefined();
  });

  it('defines logout endpoint', () => {
    expect(authApi.endpoints.logout).toBeDefined();
  });

  it('defines getMe endpoint', () => {
    expect(authApi.endpoints.getMe).toBeDefined();
  });

  it('defines refresh endpoint', () => {
    expect(authApi.endpoints.refresh).toBeDefined();
  });

  it('exports useLoginMutation hook', () => {
    expect(useLoginMutation).toBeDefined();
    expect(typeof useLoginMutation).toBe('function');
  });

  it('exports useRegisterMutation hook', () => {
    expect(useRegisterMutation).toBeDefined();
    expect(typeof useRegisterMutation).toBe('function');
  });

  it('exports useLogoutMutation hook', () => {
    expect(useLogoutMutation).toBeDefined();
    expect(typeof useLogoutMutation).toBe('function');
  });

  it('exports useGetMeQuery hook', () => {
    expect(useGetMeQuery).toBeDefined();
    expect(typeof useGetMeQuery).toBe('function');
  });

  it('exports useRefreshMutation hook', () => {
    expect(useRefreshMutation).toBeDefined();
    expect(typeof useRefreshMutation).toBe('function');
  });

  it('has correct reducer path', () => {
    expect(authApi.reducerPath).toBe('authApi');
  });

  it('has reducer function', () => {
    expect(authApi.reducer).toBeDefined();
    expect(typeof authApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(authApi.middleware).toBeDefined();
  });

  it('has endpoints object', () => {
    expect(authApi.endpoints).toBeDefined();
    expect(typeof authApi.endpoints).toBe('object');
  });
});

describe('useLoginMutation', () => {
  it('logs in successfully with valid credentials', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    const loginData = {
      email: 'test@example.com',
      password: 'password',
    };

    await act(async () => {
      await result.current[0](loginData).unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.user).toBeDefined();
    expect(result.current[1].data?.data?.accessToken).toBeDefined();
  });

  it('handles invalid credentials error', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    const loginData = {
      email: 'wrong@example.com',
      password: 'wrongpassword',
    };

    await act(async () => {
      try {
        await result.current[0](loginData).unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });

  it('handles pending approval error', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLoginMutation(), { wrapper });

    const loginData = {
      email: 'pending@example.com',
      password: 'password',
    };

    await act(async () => {
      try {
        await result.current[0](loginData).unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useRegisterMutation', () => {
  it('registers a new user successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    const registerData = {
      email: 'newuser@example.com',
      password: 'password123',
      firstName: 'New',
      lastName: 'User',
    };

    await act(async () => {
      await result.current[0](registerData).unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.user).toBeDefined();
  });

  it('handles existing email error', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useRegisterMutation(), { wrapper });

    const registerData = {
      email: 'existing@example.com',
      password: 'password123',
      firstName: 'Existing',
      lastName: 'User',
    };

    await act(async () => {
      try {
        await result.current[0](registerData).unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useLogoutMutation', () => {
  it('logs out successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLogoutMutation(), { wrapper });

    await act(async () => {
      await result.current[0]().unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
  });

  it('handles logout error', async () => {
    const store = setupStore({
      auth: {
        user: null,
        token: 'error-token',
        isAuthenticated: true,
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useLogoutMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current[0]().unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useGetMeQuery', () => {
  it('fetches current user successfully', async () => {
    const store = setupStore({
      auth: {
        user: null,
        token: 'valid-token',
        isAuthenticated: true,
      },
    });
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useGetMeQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.data).toBeDefined();
  });

  it('handles unauthorized error', async () => {
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

    const { result } = renderHook(() => useGetMeQuery(), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });
  });
});

describe('useRefreshMutation', () => {
  it('refreshes token successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useRefreshMutation(), { wrapper });

    await act(async () => {
      await result.current[0]().unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.accessToken).toBeDefined();
  });
});
