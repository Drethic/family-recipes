import { describe, it, expect } from 'vitest';
import { store } from './store';
import { authApi } from '@/features/auth/authApi';
import { recipeApi } from '@/features/recipes/recipeApi';
import { userApi } from '@/features/admin/userApi';
import { profileApi } from '@/features/profile/profileApi';
import { categoryApi } from '@/features/categories/categoryApi';

describe('store', () => {
  it('is defined', () => {
    expect(store).toBeDefined();
  });

  it('has auth reducer', () => {
    expect(store.getState().auth).toBeDefined();
  });

  it('has authApi reducer', () => {
    expect(store.getState()[authApi.reducerPath]).toBeDefined();
  });

  it('has recipeApi reducer', () => {
    expect(store.getState()[recipeApi.reducerPath]).toBeDefined();
  });

  it('has userApi reducer', () => {
    expect(store.getState()[userApi.reducerPath]).toBeDefined();
  });

  it('has profileApi reducer', () => {
    expect(store.getState()[profileApi.reducerPath]).toBeDefined();
  });

  it('has categoryApi reducer', () => {
    expect(store.getState()[categoryApi.reducerPath]).toBeDefined();
  });

  it('has dispatch method', () => {
    expect(store.dispatch).toBeDefined();
    expect(typeof store.dispatch).toBe('function');
  });

  it('has getState method', () => {
    expect(store.getState).toBeDefined();
    expect(typeof store.getState).toBe('function');
  });

  it('has subscribe method', () => {
    expect(store.subscribe).toBeDefined();
    expect(typeof store.subscribe).toBe('function');
  });

  it('initializes auth state correctly', () => {
    const state = store.getState();
    expect(state.auth).toEqual({
      user: null,
      token: null,
      isAuthenticated: false,
    });
  });
});
