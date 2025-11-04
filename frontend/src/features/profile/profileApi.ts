import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { API_URL } from '@/utils/constants';
import type { User, ThemePreference, ApiResponse } from '@/types';

interface UpdateProfileRequest {
  id: string;
  firstName?: string;
  lastName?: string;
  email?: string;
}

interface UpdateThemeRequest {
  id: string;
  themePreference: ThemePreference;
}

interface UpdatePasswordRequest {
  id: string;
  currentPassword?: string;
  newPassword: string;
}

export const profileApi = createApi({
  reducerPath: 'profileApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/profile`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Profile'],
  endpoints: (builder) => ({
    updateProfile: builder.mutation<ApiResponse<User>, UpdateProfileRequest>({
      query: ({ id, ...data }) => ({
        url: `/${id}/profile`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: ['Profile'],
    }),
    updateTheme: builder.mutation<ApiResponse<User>, UpdateThemeRequest>({
      query: ({ id, themePreference }) => ({
        url: `/${id}/theme`,
        method: 'PATCH',
        body: { themePreference },
      }),
      invalidatesTags: ['Profile'],
    }),
    updatePassword: builder.mutation<ApiResponse<null>, UpdatePasswordRequest>({
      query: ({ id, ...data }) => ({
        url: `/${id}/password`,
        method: 'PATCH',
        body: data,
      }),
    }),
  }),
});

export const {
  useUpdateProfileMutation,
  useUpdateThemeMutation,
  useUpdatePasswordMutation,
} = profileApi;
