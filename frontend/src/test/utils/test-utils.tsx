import { ReactElement, ReactNode } from 'react';
import { render as rtlRender, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter, Routes, Route } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/features/auth/authSlice';
import { authApi } from '@/features/auth/authApi';
import { recipeApi } from '@/features/recipes/recipeApi';
import { userApi } from '@/features/admin/userApi';
import { profileApi } from '@/features/profile/profileApi';
import { categoryApi } from '@/features/categories/categoryApi';
import { ThemeProvider } from '@/contexts/ThemeProvider';
import type { RootState } from '@/app/store';
import { ProtectedRoute } from '@/features/auth/ProtectedRoute';
import { UserRole } from '@/types';

// Import all pages for routing
import { Home } from '@/pages/Home';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { RecipesPage } from '@/pages/RecipesPage';
import { RecipeDetailPage } from '@/pages/RecipeDetailPage';
import { RecipeEditPage } from '@/pages/RecipeEditPage';
import { RecipeSubmitPage } from '@/pages/RecipeSubmitPage';
import { MemberDashboard } from '@/pages/MemberDashboard';
import { AdminDashboard } from '@/pages/AdminDashboard';
import { NotFound } from '@/pages/NotFound';

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

interface RouterRenderOptions {
  preloadedState?: Partial<RootState>;
  store?: ReturnType<typeof setupStore>;
  initialEntries?: string[];
}

/**
 * Renders the full app with routing for integration tests.
 * This allows tests to navigate between pages just like a real user would.
 *
 * @example
 * ```typescript
 * renderWithRouter({ initialEntries: ['/'] });
 *
 * const loginLink = screen.getByRole('link', { name: 'Login' });
 * await user.click(loginLink);
 *
 * expect(screen.getByText('Sign in to your account')).toBeInTheDocument();
 * ```
 */
export function renderWithRouter({
  preloadedState = {},
  store = setupStore(preloadedState),
  initialEntries = ['/'],
}: RouterRenderOptions = {}) {
  function AppWrapper() {
    return (
      <Provider store={store}>
        <ThemeProvider>
          <MemoryRouter
            initialEntries={initialEntries}
            future={{
              v7_startTransition: true,
              v7_relativeSplatPath: true,
            }}
          >
            <Routes>
              {/* Public routes */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/recipes" element={<RecipesPage />} />

              {/* Member routes */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.MEMBER, UserRole.ADMIN]} />}>
                <Route path="/member/*" element={<MemberDashboard />} />
                <Route path="/recipes/submit" element={<RecipeSubmitPage />} />
                <Route path="/recipes/:id/edit" element={<RecipeEditPage />} />
              </Route>

              {/* Public recipe detail - MUST come after /recipes/submit */}
              <Route path="/recipes/:id" element={<RecipeDetailPage />} />

              {/* Admin routes */}
              <Route element={<ProtectedRoute allowedRoles={[UserRole.ADMIN]} />}>
                <Route path="/admin/*" element={<AdminDashboard />} />
              </Route>

              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...rtlRender(<AppWrapper />) };
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
