import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { API_URL } from '@/utils/constants';
import type { User, UserRole, ApiResponse } from '@/types';

export const userApi = createApi({
  reducerPath: 'userApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/users`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['User'],
  endpoints: (builder) => ({
    getUsers: builder.query<
      ApiResponse<{
        users: User[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>,
      { page?: number; limit?: number }
    >({
      query: ({ page = 1, limit = 20 } = {}) => `?page=${page}&limit=${limit}`,
      providesTags: (result) =>
        result?.data?.users
          ? [
              ...result.data.users.map(({ id }) => ({ type: 'User' as const, id })),
              { type: 'User', id: 'LIST' },
            ]
          : [{ type: 'User', id: 'LIST' }],
    }),
    getUserById: builder.query<ApiResponse<User>, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'User', id }],
    }),
    updateUserRole: builder.mutation<
      ApiResponse<User>,
      { id: string; role: UserRole }
    >({
      query: ({ id, role }) => ({
        url: `/${id}/role`,
        method: 'PATCH',
        body: { role },
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
    updateUserProfile: builder.mutation<
      ApiResponse<User>,
      { id: string; firstName?: string; lastName?: string; email?: string }
    >({
      query: ({ id, ...data }) => ({
        url: `/${id}/profile`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
    approveUser: builder.mutation<ApiResponse<User>, string>({
      query: (id) => ({
        url: `/${id}/approve`,
        method: 'POST',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'User', id },
        { type: 'User', id: 'LIST' },
      ],
    }),
    rejectUser: builder.mutation<ApiResponse<null>, string>({
      query: (id) => ({
        url: `/${id}/reject`,
        method: 'POST',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
    deleteUser: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'User', id: 'LIST' }],
    }),
  }),
});

export const {
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserRoleMutation,
  useUpdateUserProfileMutation,
  useApproveUserMutation,
  useRejectUserMutation,
  useDeleteUserMutation,
} = userApi;
