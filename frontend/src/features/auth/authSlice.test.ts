import { describe, it, expect } from 'vitest';
import authReducer, {
  setCredentials,
  setToken,
  logout,
  updateUser,
  AuthState,
} from './authSlice';
import { mockUser, mockAuthResponse } from '@/test/mocks/mockData';

describe('authSlice', () => {
  const initialState: AuthState = {
    user: null,
    token: null,
    isAuthenticated: false,
  };

  it('should return the initial state', () => {
    expect(authReducer(undefined, { type: 'unknown' })).toEqual(initialState);
  });

  it('should handle setCredentials', () => {
    const actual = authReducer(
      initialState,
      setCredentials({
        user: mockUser,
        accessToken: mockAuthResponse.accessToken,
      })
    );

    expect(actual.user).toEqual(mockUser);
    expect(actual.token).toEqual(mockAuthResponse.accessToken);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle setToken', () => {
    const authenticatedState: AuthState = {
      user: mockUser,
      token: null,
      isAuthenticated: true,
    };

    const newToken = 'new-access-token';
    const actual = authReducer(authenticatedState, setToken(newToken));

    expect(actual.token).toEqual(newToken);
    expect(actual.user).toEqual(mockUser);
    expect(actual.isAuthenticated).toBe(true);
  });

  it('should handle logout', () => {
    const authenticatedState: AuthState = {
      user: mockUser,
      token: mockAuthResponse.accessToken,
      isAuthenticated: true,
    };

    const actual = authReducer(authenticatedState, logout());

    expect(actual.user).toBeNull();
    expect(actual.token).toBeNull();
    expect(actual.isAuthenticated).toBe(false);
  });

  it('should handle updateUser', () => {
    const authenticatedState: AuthState = {
      user: mockUser,
      token: mockAuthResponse.accessToken,
      isAuthenticated: true,
    };

    const updatedUser = {
      ...mockUser,
      first_name: 'Updated',
      last_name: 'Name',
    };

    const actual = authReducer(authenticatedState, updateUser(updatedUser));

    expect(actual.user).toEqual(updatedUser);
    expect(actual.user?.first_name).toBe('Updated');
    expect(actual.user?.last_name).toBe('Name');
  });

  it('should not update user if user is null', () => {
    const actual = authReducer(
      initialState,
      updateUser({ ...mockUser, first_name: 'Updated' })
    );

    expect(actual.user).toEqual({ ...mockUser, first_name: 'Updated' });
  });
});
