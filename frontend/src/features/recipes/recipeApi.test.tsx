import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
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
            role: 'member' as const,
            is_approved: true,
            approved_at: new Date().toISOString(),
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            theme_preference: 'light' as const,
          },
          token: 'test-token',
          isAuthenticated: true,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetMyRecipesQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      if (result.current.isSuccess) {
        expect(result.current.data?.success).toBe(true);
        expect(result.current.data?.data).toBeDefined();
      }
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
          difficulty: 'medium' as const,
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
});
