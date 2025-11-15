import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import {
  userApi,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useUpdateUserProfileMutation,
  useApproveUserMutation,
  useRejectUserMutation,
  useDeleteUserMutation,
} from './userApi';
import { UserRole } from '@/types';

describe('userApi', () => {
  it('defines getUsers endpoint', () => {
    expect(userApi.endpoints.getUsers).toBeDefined();
  });

  it('defines getUserById endpoint', () => {
    expect(userApi.endpoints.getUserById).toBeDefined();
  });

  it('defines updateUserRole endpoint', () => {
    expect(userApi.endpoints.updateUserRole).toBeDefined();
  });

  it('defines updateUserProfile endpoint', () => {
    expect(userApi.endpoints.updateUserProfile).toBeDefined();
  });

  it('defines approveUser endpoint', () => {
    expect(userApi.endpoints.approveUser).toBeDefined();
  });

  it('defines rejectUser endpoint', () => {
    expect(userApi.endpoints.rejectUser).toBeDefined();
  });

  it('defines deleteUser endpoint', () => {
    expect(userApi.endpoints.deleteUser).toBeDefined();
  });

  it('exports useGetUsersQuery hook', () => {
    expect(useGetUsersQuery).toBeDefined();
    expect(typeof useGetUsersQuery).toBe('function');
  });

  it('exports useGetUserByIdQuery hook', () => {
    expect(useGetUserByIdQuery).toBeDefined();
    expect(typeof useGetUserByIdQuery).toBe('function');
  });

  it('exports useUpdateUserRoleMutation hook', () => {
    expect(useUpdateUserRoleMutation).toBeDefined();
    expect(typeof useUpdateUserRoleMutation).toBe('function');
  });

  it('exports useUpdateUserProfileMutation hook', () => {
    expect(useUpdateUserProfileMutation).toBeDefined();
    expect(typeof useUpdateUserProfileMutation).toBe('function');
  });

  it('exports useApproveUserMutation hook', () => {
    expect(useApproveUserMutation).toBeDefined();
    expect(typeof useApproveUserMutation).toBe('function');
  });

  it('exports useRejectUserMutation hook', () => {
    expect(useRejectUserMutation).toBeDefined();
    expect(typeof useRejectUserMutation).toBe('function');
  });

  it('exports useDeleteUserMutation hook', () => {
    expect(useDeleteUserMutation).toBeDefined();
    expect(typeof useDeleteUserMutation).toBe('function');
  });

  it('has correct reducer path', () => {
    expect(userApi.reducerPath).toBe('userApi');
  });

  it('has reducer function', () => {
    expect(userApi.reducer).toBeDefined();
    expect(typeof userApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(userApi.middleware).toBeDefined();
  });

  it('has endpoints object', () => {
    expect(userApi.endpoints).toBeDefined();
    expect(typeof userApi.endpoints).toBe('object');
  });
});

describe('useGetUsersQuery', () => {
  it('fetches users successfully with default pagination', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useGetUsersQuery({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.data?.users).toBeDefined();
    expect(result.current.data?.data?.pagination).toBeDefined();
    expect(result.current.data?.data?.pagination.page).toBe(1);
    expect(result.current.data?.data?.pagination.limit).toBe(20);
  });

  it('fetches users with custom pagination', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(
      () => useGetUsersQuery({ page: 2, limit: 10 }),
      { wrapper }
    );

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.data?.pagination.page).toBe(2);
    expect(result.current.data?.data?.pagination.limit).toBe(10);
  });

  it('handles error state for getUsers', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    // Override MSW handler to return error
    const { server } = await import('@/test/mocks/server');
    const { http, HttpResponse } = await import('msw');

    server.use(
      http.get('http://localhost:9999/api/users', () => {
        return HttpResponse.json(
          { success: false, error: 'Server error' },
          { status: 500 }
        );
      })
    );

    const { result } = renderHook(() => useGetUsersQuery({}), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useGetUserByIdQuery', () => {
  it('fetches user by ID successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useGetUserByIdQuery('1'), { wrapper });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.success).toBe(true);
    expect(result.current.data?.data).toBeDefined();
    expect(result.current.data?.data?.id).toBe('1');
  });

  it('handles user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useGetUserByIdQuery('999'), { wrapper });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error).toBeDefined();
  });
});

describe('useUpdateUserRoleMutation', () => {
  it('updates user role successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useUpdateUserRoleMutation(), { wrapper });

    const payload = { id: '1', role: UserRole.ADMIN };

    await act(async () => {
      await result.current[0](payload).unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.role).toBe('admin');
  });

  it('handles error when user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useUpdateUserRoleMutation(), { wrapper });

    const payload = { id: '999', role: UserRole.ADMIN };

    await act(async () => {
      try {
        await result.current[0](payload).unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useUpdateUserProfileMutation', () => {
  it('updates user profile successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useUpdateUserProfileMutation(), { wrapper });

    const payload = {
      id: '1',
      firstName: 'Updated',
      lastName: 'User',
      email: 'updated@example.com',
    };

    await act(async () => {
      await result.current[0](payload).unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.first_name).toBe('Updated');
  });

  it('handles error when user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useUpdateUserProfileMutation(), { wrapper });

    const payload = { id: '999', firstName: 'Test' };

    await act(async () => {
      try {
        await result.current[0](payload).unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useApproveUserMutation', () => {
  it('approves user successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useApproveUserMutation(), { wrapper });

    await act(async () => {
      await result.current[0]('1').unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });

    expect(result.current[1].data?.success).toBe(true);
    expect(result.current[1].data?.data?.is_approved).toBe(true);
  });

  it('handles error when user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useApproveUserMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current[0]('999').unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useRejectUserMutation', () => {
  it('rejects user successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useRejectUserMutation(), { wrapper });

    await act(async () => {
      await result.current[0]('1').unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('handles error when user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useRejectUserMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current[0]('999').unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});

describe('useDeleteUserMutation', () => {
  it('deletes user successfully', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useDeleteUserMutation(), { wrapper });

    await act(async () => {
      await result.current[0]('1').unwrap();
    });

    await waitFor(() => {
      expect(result.current[1].isSuccess).toBe(true);
    });
  });

  it('handles error when user not found', async () => {
    const store = setupStore();
    const wrapper = ({ children }: { children: React.ReactNode }) => (
      <Provider store={store}>{children}</Provider>
    );

    const { result } = renderHook(() => useDeleteUserMutation(), { wrapper });

    await act(async () => {
      try {
        await result.current[0]('999').unwrap();
      } catch (_error) {
        // Expected error
      }
    });

    await waitFor(() => {
      expect(result.current[1].isError).toBe(true);
    });
  });
});
