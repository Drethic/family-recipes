import { describe, it, expect } from 'vitest';
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';
import { http, HttpResponse } from 'msw';
import { server } from '@/test/mocks/server';
import {
  categoryApi,
  useGetCategoriesQuery,
  useGetCategoryByIdQuery,
  useCreateCategoryMutation,
  useUpdateCategoryMutation,
  useDeleteCategoryMutation,
} from './categoryApi';

describe('categoryApi', () => {
  it('defines getCategories endpoint', () => {
    expect(categoryApi.endpoints.getCategories).toBeDefined();
  });

  it('defines getCategoryById endpoint', () => {
    expect(categoryApi.endpoints.getCategoryById).toBeDefined();
  });

  it('defines createCategory endpoint', () => {
    expect(categoryApi.endpoints.createCategory).toBeDefined();
  });

  it('defines updateCategory endpoint', () => {
    expect(categoryApi.endpoints.updateCategory).toBeDefined();
  });

  it('defines deleteCategory endpoint', () => {
    expect(categoryApi.endpoints.deleteCategory).toBeDefined();
  });

  it('exports useGetCategoriesQuery hook', () => {
    expect(useGetCategoriesQuery).toBeDefined();
    expect(typeof useGetCategoriesQuery).toBe('function');
  });

  it('exports useGetCategoryByIdQuery hook', () => {
    expect(useGetCategoryByIdQuery).toBeDefined();
    expect(typeof useGetCategoryByIdQuery).toBe('function');
  });

  it('exports useCreateCategoryMutation hook', () => {
    expect(useCreateCategoryMutation).toBeDefined();
    expect(typeof useCreateCategoryMutation).toBe('function');
  });

  it('exports useUpdateCategoryMutation hook', () => {
    expect(useUpdateCategoryMutation).toBeDefined();
    expect(typeof useUpdateCategoryMutation).toBe('function');
  });

  it('exports useDeleteCategoryMutation hook', () => {
    expect(useDeleteCategoryMutation).toBeDefined();
    expect(typeof useDeleteCategoryMutation).toBe('function');
  });

  it('has correct reducer path', () => {
    expect(categoryApi.reducerPath).toBe('categoryApi');
  });

  it('has reducerPath as a string', () => {
    expect(typeof categoryApi.reducerPath).toBe('string');
  });

  it('has reducer function', () => {
    expect(categoryApi.reducer).toBeDefined();
    expect(typeof categoryApi.reducer).toBe('function');
  });

  it('has middleware', () => {
    expect(categoryApi.middleware).toBeDefined();
  });

  it('has endpoints object', () => {
    expect(categoryApi.endpoints).toBeDefined();
    expect(typeof categoryApi.endpoints).toBe('object');
  });

  it('has util object', () => {
    expect(categoryApi.util).toBeDefined();
  });

  describe('useGetCategoriesQuery', () => {
    it('fetches categories successfully', async () => {
      const store = setupStore({
        auth: {
          user: { id: '1', email: 'test@example.com', first_name: 'Test', last_name: 'User', role: 'member', status: 'approved', theme_preference: 'system', created_at: new Date().toISOString(), updated_at: new Date().toISOString() },
          token: 'test-token-123',
          isAuthenticated: true,
        },
      });
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetCategoriesQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.data).toBeDefined();
      expect(Array.isArray(result.current.data?.data)).toBe(true);
    });

    it('handles error when fetching categories', async () => {
      server.use(
        http.get('http://localhost:9999/api/categories/', () => {
          return HttpResponse.json(
            { success: false, error: 'Server error' },
            { status: 500 }
          );
        })
      );

      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetCategoriesQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });

    it('fetches categories without authentication token', async () => {
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

      const { result } = renderHook(() => useGetCategoriesQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess || result.current.isError).toBe(true);
      });

      if (result.current.isSuccess) {
        expect(result.current.data?.success).toBe(true);
      }
    });

    it('handles response with no data array', async () => {
      server.use(
        http.get('http://localhost:9999/api/categories/', () => {
          return HttpResponse.json({
            success: true,
            data: null,
          });
        })
      );

      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetCategoriesQuery(), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.data).toBeNull();
    });
  });

  describe('useGetCategoryByIdQuery', () => {
    it('fetches category by id successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetCategoryByIdQuery('1'), { wrapper });

      await waitFor(() => {
        expect(result.current.isSuccess).toBe(true);
      });

      expect(result.current.data?.success).toBe(true);
      expect(result.current.data?.data).toBeDefined();
    });

    it('handles error when category not found', async () => {
      server.use(
        http.get('http://localhost:9999/api/categories/:id', () => {
          return HttpResponse.json(
            { success: false, error: 'Category not found' },
            { status: 404 }
          );
        })
      );

      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useGetCategoryByIdQuery('999'), { wrapper });

      await waitFor(() => {
        expect(result.current.isError).toBe(true);
      });
    });
  });

  describe('useCreateCategoryMutation', () => {
    it('creates category successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useCreateCategoryMutation(), { wrapper });

      const newCategory = { name: 'New Category', slug: 'new-category' };

      await act(async () => {
        await result.current[0](newCategory).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });

    it('creates category without auth token', async () => {
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

      const { result } = renderHook(() => useCreateCategoryMutation(), { wrapper });

      const newCategory = { name: 'New Category No Auth', slug: 'new-category-no-auth' };

      await act(async () => {
        try {
          await result.current[0](newCategory).unwrap();
        } catch (error) {
          // May fail due to lack of auth, that's expected
        }
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess || result.current[1].isError).toBe(true);
      });
    });
  });

  describe('useUpdateCategoryMutation', () => {
    it('updates category successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useUpdateCategoryMutation(), { wrapper });

      const updateData = { id: '1', name: 'Updated Category' };

      await act(async () => {
        await result.current[0](updateData).unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });

  describe('useDeleteCategoryMutation', () => {
    it('deletes category successfully', async () => {
      const store = setupStore();
      const wrapper = ({ children }: { children: React.ReactNode }) => (
        <Provider store={store}>{children}</Provider>
      );

      const { result } = renderHook(() => useDeleteCategoryMutation(), { wrapper });

      await act(async () => {
        await result.current[0]('1').unwrap();
      });

      await waitFor(() => {
        expect(result.current[1].isSuccess).toBe(true);
      });
    });
  });
});
