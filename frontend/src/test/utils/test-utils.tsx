import { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { recipeApi } from '@/features/recipes/recipeApi';
import { userApi } from '@/features/admin/userApi';
import { profileApi } from '@/features/profile/profileApi';
import { categoryApi } from '@/features/categories/categoryApi';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import type { RootState } from '@/app/store';

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
}

export function setupStore(preloadedState?: Partial<RootState>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      [authApi.reducerPath]: authApi.reducer,
      [recipeApi.reducerPath]: recipeApi.reducer,
      [userApi.reducerPath]: userApi.reducer,
      [profileApi.reducerPath]: profileApi.reducer,
      [categoryApi.reducerPath]: categoryApi.reducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(
        authApi.middleware,
        recipeApi.middleware,
        userApi.middleware,
        profileApi.middleware,
        categoryApi.middleware
      ),
    preloadedState: preloadedState as RootState,
  });
}

export function renderWithProviders(
  ui: ReactElement,
  {
    preloadedState = {},
    store = setupStore(preloadedState),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <BrowserRouter
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            {children}
          </BrowserRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...rtlRender(ui, { wrapper: Wrapper, ...renderOptions }) };
}

// Re-export commonly used testing utilities explicitly
export {
  screen,
  waitFor,
  within,
  fireEvent,
  act,
  cleanup,
  renderHook,
  waitForElementToBeRemoved,
} from '@testing-library/react';

// Export our custom render as the default render
export { renderWithProviders as render };
