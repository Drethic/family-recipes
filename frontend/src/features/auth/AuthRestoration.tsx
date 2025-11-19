import { useEffect, ReactNode } from 'react';
import { useAppDispatch } from '@/app/hooks';
import { useRefreshMutation } from './authApi';
import { setCredentials, setToken } from './authSlice';
import { authApi } from './authApi';

interface AuthRestorationProps {
  children: ReactNode;
}

/**
 * AuthRestoration Component
 *
 * Attempts to restore user authentication on app load by:
 * 1. Calling the refresh endpoint (which uses httpOnly cookie)
 * 2. If successful, getting a new access token
 * 3. Fetching user data with the new token
 * 4. Updating Redux state to restore the user session
 *
 * This ensures users stay logged in across page refreshes.
 */
export const AuthRestoration = ({ children }: AuthRestorationProps) => {
  const dispatch = useAppDispatch();
  const [refresh] = useRefreshMutation();

  useEffect(() => {
    const restoreAuth = async () => {
      try {
        console.log('[AuthRestoration] Starting auth restoration...');
        // Try to refresh the access token using the httpOnly cookie
        const refreshResult = await refresh().unwrap();
        console.log('[AuthRestoration] Refresh result:', {
          hasData: !!refreshResult.data,
          hasAccessToken: !!refreshResult.data?.accessToken
        });

        if (refreshResult.data?.accessToken) {
          const accessToken = refreshResult.data.accessToken;

          // Temporarily set token in Redux so getMe can use it
          dispatch(setToken(accessToken));

          // Fetch user data using the new access token
          const meResult = await dispatch(
            authApi.endpoints.getMe.initiate()
          ).unwrap();
          console.log('[AuthRestoration] User data fetched:', {
            hasData: !!meResult.data,
            userEmail: meResult.data?.email
          });

          if (meResult.data) {
            // Set full credentials (user + token + isAuthenticated)
            dispatch(setCredentials({
              user: meResult.data,
              accessToken: accessToken,
            }));
            console.log('[AuthRestoration] ✅ Auth restored successfully for:', meResult.data.email);
          }
        }
      } catch (_error) {
        // No valid refresh token or error occurred
        // User stays logged out - this is expected for new/logged-out users
        // We don't dispatch logout() here to avoid clearing cookies unnecessarily
        console.log('[AuthRestoration] ℹ️ No valid session to restore (this is normal for logged-out users)');
      }
    };

    restoreAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

  return <>{children}</>;
};
