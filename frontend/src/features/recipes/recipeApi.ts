import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/app/store';
import { API_URL } from '@/utils/constants';
import type {
  Recipe,
  CreateRecipeRequest,
  UpdateRecipeRequest,
  ApiResponse,
  RecipeStatus,
} from '@/types';

export const recipeApi = createApi({
  reducerPath: 'recipeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: `${API_URL}/recipes`,
    credentials: 'include',
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Recipe', 'MyRecipes'],
  endpoints: (builder) => ({
    getRecipes: builder.query<
      ApiResponse<{
        recipes: Recipe[];
        pagination: {
          page: number;
          limit: number;
          total: number;
          totalPages: number;
        };
      }>,
      { page?: number; limit?: number; status?: RecipeStatus }
    >({
      query: ({ page = 1, limit = 20, status }) => {
        const params = new URLSearchParams({
          page: page.toString(),
          limit: limit.toString(),
        });
        if (status) {
          params.append('status', status);
        }
        return `?${params.toString()}`;
      },
      providesTags: (result) =>
        result?.data?.recipes
          ? [
              ...result.data.recipes.map(({ id }) => ({ type: 'Recipe' as const, id })),
              { type: 'Recipe', id: 'LIST' },
            ]
          : [{ type: 'Recipe', id: 'LIST' }],
    }),
    getRecipeById: builder.query<ApiResponse<Recipe>, string>({
      query: (id) => `/${id}`,
      providesTags: (_result, _error, id) => [{ type: 'Recipe', id }],
    }),
    getMyRecipes: builder.query<ApiResponse<Recipe[]>, void>({
      query: () => '/my-recipes',
      providesTags: ['MyRecipes'],
    }),
    createRecipe: builder.mutation<ApiResponse<Recipe>, CreateRecipeRequest>({
      query: (recipe) => ({
        url: '/',
        method: 'POST',
        body: recipe,
      }),
      invalidatesTags: [{ type: 'Recipe', id: 'LIST' }, 'MyRecipes'],
    }),
    updateRecipe: builder.mutation<
      ApiResponse<Recipe>,
      { id: string; data: UpdateRecipeRequest }
    >({
      query: ({ id, data }) => ({
        url: `/${id}`,
        method: 'PATCH',
        body: data,
      }),
      invalidatesTags: (_result, _error, { id }) => [
        { type: 'Recipe', id },
        { type: 'Recipe', id: 'LIST' },
        'MyRecipes',
      ],
    }),
    deleteRecipe: builder.mutation<void, string>({
      query: (id) => ({
        url: `/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: [{ type: 'Recipe', id: 'LIST' }, 'MyRecipes'],
    }),
    approveRecipe: builder.mutation<ApiResponse<Recipe>, string>({
      query: (id) => ({
        url: `/${id}/approve`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Recipe', id },
        { type: 'Recipe', id: 'LIST' },
      ],
    }),
    rejectRecipe: builder.mutation<ApiResponse<Recipe>, string>({
      query: (id) => ({
        url: `/${id}/reject`,
        method: 'PATCH',
      }),
      invalidatesTags: (_result, _error, id) => [
        { type: 'Recipe', id },
        { type: 'Recipe', id: 'LIST' },
      ],
    }),
  }),
});

export const {
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useGetMyRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useApproveRecipeMutation,
  useRejectRecipeMutation,
} = recipeApi;
