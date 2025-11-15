import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import { UserRole, ThemePreference, RecipeDifficulty } from '@/types';
import {
  recipeApi,
  useGetRecipesQuery,
  useGetRecipeByIdQuery,
  useGetMyRecipesQuery,
  useCreateRecipeMutation,
  useUpdateRecipeMutation,
  useDeleteRecipeMutation,
  useApproveRecipeMutation,
  useRejectRecipeMutation,
  useUploadRecipeImageMutation,
  useUpdateRecipeImageMutation,
  useDeleteRecipeImageMutation,
} from './recipeApi';

describe('recipeApi', () => {
  it('defines getRecipes endpoint', () => {
    expect(recipeApi.endpoints.getRecipes).toBeDefined();
  });

  it('defines getRecipeById endpoint', () => {
    expect(recipeApi.endpoints.getRecipeById).toBeDefined();
  });

  it('defines getMyRecipes endpoint', () => {
    expect(recipeApi.endpoints.getMyRecipes).toBeDefined();
  });

  it('defines createRecipe endpoint', () => {
    expect(recipeApi.endpoints.createRecipe).toBeDefined();
  });

  it('defines updateRecipe endpoint', () => {
    expect(recipeApi.endpoints.updateRecipe).toBeDefined();
  });

  it('defines deleteRecipe endpoint', () => {
    expect(recipeApi.endpoints.deleteRecipe).toBeDefined();
  });

  it('defines approveRecipe endpoint', () => {
    expect(recipeApi.endpoints.approveRecipe).toBeDefined();
  });

  it('defines rejectRecipe endpoint', () => {
    expect(recipeApi.endpoints.rejectRecipe).toBeDefined();
  });

  it('defines uploadRecipeImage endpoint', () => {
    expect(recipeApi.endpoints.uploadRecipeImage).toBeDefined();
  });

  it('defines updateRecipeImage endpoint', () => {
    expect(recipeApi.endpoints.updateRecipeImage).toBeDefined();
  });

  it('defines deleteRecipeImage endpoint', () => {
    expect(recipeApi.endpoints.deleteRecipeImage).toBeDefined();
  });

  it('exports useGetRecipesQuery hook', () => {
    expect(useGetRecipesQuery).toBeDefined();
    expect(typeof useGetRecipesQuery).toBe('function');
  });

  it('exports useGetRecipeByIdQuery hook', () => {
    expect(useGetRecipeByIdQuery).toBeDefined();
    expect(typeof useGetRecipeByIdQuery).toBe('function');
  });

  it('exports useGetMyRecipesQuery hook', () => {
    expect(useGetMyRecipesQuery).toBeDefined();
    expect(typeof useGetMyRecipesQuery).toBe('function');
  });

  it('exports useCreateRecipeMutation hook', () => {
    expect(useCreateRecipeMutation).toBeDefined();
    expect(typeof useCreateRecipeMutation).toBe('function');
  });

  it('exports useUpdateRecipeMutation hook', () => {
    expect(useUpdateRecipeMutation).toBeDefined();
    expect(typeof useUpdateRecipeMutation).toBe('function');
  });

  it('exports useDeleteRecipeMutation hook', () => {
    expect(useDeleteRecipeMutation).toBeDefined();
    expect(typeof useDeleteRecipeMutation).toBe('function');
  });

  it('exports useApproveRecipeMutation hook', () => {
    expect(useApproveRecipeMutation).toBeDefined();
    expect(typeof useApproveRecipeMutation).toBe('function');
  });

  it('exports useRejectRecipeMutation hook', () => {
    expect(useRejectRecipeMutation).toBeDefined();
    expect(typeof useRejectRecipeMutation).toBe('function');
  });

  it('exports useUploadRecipeImageMutation hook', () => {
    expect(useUploadRecipeImageMutation).toBeDefined();
    expect(typeof useUploadRecipeImageMutation).toBe('function');
  });

  it('exports useUpdateRecipeImageMutation hook', () => {
    expect(useUpdateRecipeImageMutation).toBeDefined();
    expect(typeof useUpdateRecipeImageMutation).toBe('function');
  });

  it('exports useDeleteRecipeImageMutation hook', () => {
    expect(useDeleteRecipeImageMutation).toBeDefined();
    expect(typeof useDeleteRecipeImageMutation).toBe('function');
  });

  it('has correct reducer path', () => {
    expect(recipeApi.reducerPath).toBe('recipeApi');
  });

  it('has reducerPath as a string', () => {
    expect(typeof recipeApi.reducerPath).toBe('string');
  });

  it('has reducer function', () => {
    expect(recipeApi.reducer).toBeDefined();
    expect(typeof recipeApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(recipeApi.middleware).toBeDefined();
  });

  it('has endpoints object', () => {
    expect(recipeApi.endpoints).toBeDefined();
    expect(typeof recipeApi.endpoints).toBe('object');
  });

  it('has util object', () => {
    expect(recipeApi.util).toBeDefined();
  });

  describe('useGetRecipesQuery', () => {
    it('fetches recipes successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetRecipesQuery({ page: 1, limit: 10 }), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.data?.recipes).toBeDefined();
    });
  });

  describe('useGetRecipeByIdQuery', () => {
    it('fetches recipe by id successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetRecipeByIdQuery('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.data).toBeDefined();
    });
  });

  describe('useGetMyRecipesQuery', () => {
    it('fetches user recipes successfully', async () => {
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

      const { result } = renderHook(() => useGetMyRecipesQuery(), { wrapper });

      // Wait for loading to finish
      await waitFor(
        () => {
          expect(result.current.isLoading).toBe(false);
        },
        { timeout: 3000 }
      );

      // Log error details if the query failed for debugging
      if (result.current.isError) {
        console.error('Query error:', result.current.error);
      }

      // Check for success (if it errors, the test will fail here which is correct)
      expect(result.current.isSuccess).toBe(true);
      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.data).toBeDefined();
    });
  });

  describe('useUpdateRecipeMutation', () => {
    it('updates recipe successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateRecipeMutation(), { wrapper });

      const updatePayload = {
        id: '1',
        data: {
          title: 'Updated Recipe',
          description: 'Updated description',
          prep_time: 20,
          cook_time: 40,
          servings: 6,
          difficulty: RecipeDifficulty.MEDIUM,
          ingredients: [{ name: 'Flour', quantity: '2', unit: 'cups', order_index: 0 }],
          instructions: [{ step_number: 1, description: 'Mix' }],
          category_ids: ['1'],
        },
      };

      await act(async () => {
        await result.current[0](updatePayload).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteRecipeMutation', () => {
    it('deletes recipe successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useDeleteRecipeMutation(), { wrapper });

      await act(async () => {
        await result.current[0]('1').unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useApproveRecipeMutation', () => {
    it('approves recipe successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useApproveRecipeMutation(), { wrapper });

      await act(async () => {
        await result.current[0]('2').unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useRejectRecipeMutation', () => {
    it('rejects recipe successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useRejectRecipeMutation(), { wrapper });

      await act(async () => {
        await result.current[0]('2').unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useUploadRecipeImageMutation', () => {
    it('hook renders and returns mutation tuple', () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUploadRecipeImageMutation(), { wrapper });

      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('function');
    });
  });

  describe('useUpdateRecipeImageMutation', () => {
    it('hook renders and returns mutation tuple', () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateRecipeImageMutation(), { wrapper });

      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('function');
    });
  });

  describe('useDeleteRecipeImageMutation', () => {
    it('hook renders and returns mutation tuple', () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useDeleteRecipeImageMutation(), { wrapper });

      expect(result.current).toBeDefined();
      expect(Array.isArray(result.current)).toBe(true);
      expect(result.current).toHaveLength(2);
      expect(typeof result.current[0]).toBe('function');
    });
  });

});
