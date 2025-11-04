# Recipe Family Website - Project Configuration

## Project Overview
A full-stack family recipe sharing website with user authentication, recipe management, and admin approval system.

## Technology Stack
- **Frontend**: React 18, TypeScript, Vite, TailwindCSS, Redux Toolkit, RTK Query
- **Testing**: Vitest, React Testing Library, MSW (Mock Service Worker)
- **Backend**: Node.js, Express, PostgreSQL (separate repository)

## Project Requirements

### Code Quality Standards
1. **No ESLint Errors**: All ESLint rules must pass, including:
   - No inline if statements (curly braces required)
   - Proper TypeScript typing
   - No unused variables

2. **Test Coverage Requirements**:
   - **Every file must have at least 90% coverage** in ALL categories:
     - Lines: ≥90%
     - Statements: ≥90%
     - Functions: ≥90%
     - Branches: ≥90%
   - All TypeScript/TSX files must have corresponding test files
   - Test files themselves are not measured for coverage

3. **Zero Console Output**:
   - **NO warnings or errors** during test runs
   - No `act()` warnings from React Testing Library
   - No MSW unhandled request warnings
   - No React Router warnings
   - All console output must be suppressed or fixed

4. **Test Standards**:
   - Never remove failing tests - always fix them
   - Use MSW to mock API responses with different outcomes
   - Use `act()` properly for state updates in tests
   - Integration tests for RTK Query hooks (not just structural tests)
   - Tests must be deterministic and pass consistently

## Current Status

### Overall Test Coverage
- **Current**: 88.74% lines, 89.2% statements, 80.64% functions, 80.68% branches
- **Target**: 90% in all categories
- **Test Count**: 317 tests (all passing)
- **Test Files**: 30 files

### Files Above 90% Coverage
- App.tsx: 100%
- hooks.ts: 100%
- store.ts: 100%
- Header.tsx: 100%
- RecipeSubmitPage.tsx: 100%
- RecipesPage.tsx: 100%
- RecipeDetailPage.tsx: 94.11%
- categoryApi.ts: 93.75%
- recipeApi.ts: 91.66%
- Plus many other utility and type files at 100%

### Files Below 90% (Need Improvement)
1. **userApi.ts**: 70% lines, 71.42% branch, 60% functions
2. **authApi.ts**: 83.33% lines, 71.42% functions
3. **authSlice.ts**: 75% functions
4. **ThemeContext.tsx**: 78.57% branch, 87.5% functions
5. **Login.tsx**: 87.5% branch
6. **ProtectedRoute.tsx**: 87.5% statements, 83.33% branch, 85.71% lines
7. **Register.tsx**: 90% branch (borderline)
8. **profileApi.ts**: 50% branch
9. **ProfilePage.tsx**: 88.7% statements, 81.57% branch, 80% functions, 88.33% lines
10. **RecipeEditPage.tsx**: 88.88% statements, 70.83% branch, 88.09% functions, 88.04% lines
11. **AdminDashboard.tsx**: 75% all categories, 62.5% branch, 42.85% functions
12. **MemberDashboard.tsx**: 75% lines, 50% branch, 40% functions
13. **UserManagement.tsx**: 76.92% statements, 78.94% branch, 69.23% functions, 76.31% lines
14. **RecipeSubmitPage.tsx**: 88.88% branch (borderline)
15. **constants.ts**: 75% branch

## Development Practices

### When Adding Tests
1. Read the source file first to understand implementation
2. Create integration tests that actually use the hooks/components
3. Use MSW to provide varied server responses (success, error, edge cases)
4. Wrap mutations in `act()` to avoid warnings
5. Use `waitFor()` for async assertions
6. Ensure all tests pass with zero console output

### When Testing RTK Query APIs
- Don't just test structure (endpoint definitions)
- Create actual integration tests using `renderHook` with Redux Provider
- Mock different server responses with MSW
- Test success cases, error cases, and edge cases
- Use proper `act()` wrapping for mutations

### Common Patterns
```typescript
// RTK Query Hook Test Pattern
const store = setupStore();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const { result } = renderHook(() => useSomeQuery(), { wrapper });

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});
```

```typescript
// RTK Query Mutation Test Pattern
await act(async () => {
  await result.current[0](payload).unwrap();
});

await waitFor(() => {
  expect(result.current[1].isSuccess).toBe(true);
});
```

## Key Fixes Applied
1. Removed HTML5 `required` attributes that conflicted with JS validation
2. Added React Router v7 future flags to eliminate warnings
3. Created comprehensive MSW handlers for all API endpoints
4. Fixed all act() warnings in mutation tests
5. Added proper error handling tests for edge cases

## File Locations
- Frontend: `/frontend/`
- Tests: `/frontend/src/**/*.test.tsx` or `*.test.ts`
- MSW Mocks: `/frontend/src/test/mocks/`
- Test Utils: `/frontend/src/test/utils/`

## Commands
```bash
# Run all tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test -- <filename> --run

# Run linter
npm run lint

# Run type checker
npm run type-check
```

## Next Steps

### Phase 1: Frontend Completion (Current Priority)
1. Complete userApi.ts coverage (currently 70%)
2. Complete authApi.ts coverage (currently 83.33%)
3. Improve all component files below 90%
4. Final verification that all files meet 90% threshold
5. Ensure zero console warnings/errors across all tests

### Phase 2: Backend Testing & Linting (After Frontend)
**Goal**: Apply same quality standards to backend as frontend

1. **Assessment**
   - Locate backend directory/repository
   - Identify framework (Express, Nest.js, etc.)
   - Check existing test infrastructure
   - Review current ESLint configuration

2. **Setup Testing Infrastructure**
   - Install Jest or Vitest
   - Install supertest for API testing
   - Configure test environment and test database
   - Set up coverage reporting (90% threshold)

3. **Setup ESLint**
   - Install ESLint and TypeScript plugins
   - Configure rules (match frontend standards)
   - Fix all existing errors
   - Add to CI/CD pipeline

4. **Create Comprehensive Tests**
   - Routes/Controllers: All endpoints, auth, validation, errors
   - Services: Business logic, database interactions
   - Models: Validations, relationships, queries
   - Middleware: Auth, error handling, CORS
   - Utilities: Helpers, validators, formatters
   - Target: 90% coverage on all files

5. **Documentation**
   - Backend testing guide
   - API testing patterns
   - Database testing strategies
   - Backend coding standards

### Success Criteria
- ✅ Frontend: 90%+ coverage, zero errors/warnings
- ✅ Backend: 90%+ coverage, zero ESLint errors
- ✅ All files have test files
- ✅ CI/CD enforces quality checks
- ✅ Complete documentation
