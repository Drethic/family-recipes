# Coding Standards for Recipe Family Website

## Testing Standards

### Coverage Requirements
- **Minimum 90% coverage required** for all metrics per file:
  - Lines ≥ 90%
  - Statements ≥ 90%
  - Functions ≥ 90%
  - Branches ≥ 90%
- Every source file must have a corresponding test file
- Test coverage is measured on source files, not test files

### Zero Console Output Policy
**CRITICAL**: No warnings or errors allowed during test execution.

#### Common Issues to Fix:
1. **React Testing Library act() warnings**
   - Solution: Wrap state-changing operations in `act()`
   ```typescript
   await act(async () => {
     await result.current[0](data).unwrap();
   });
   ```

2. **MSW unhandled request warnings**
   - Solution: Ensure all API endpoints have MSW handlers
   - Add handlers in `/frontend/src/test/mocks/handlers.ts`

3. **React Router warnings**
   - Solution: Add v7 future flags:
   ```typescript
   <BrowserRouter
     future={{
       v7_startTransition: true,
       v7_relativeSplatPath: true,
     }}
   >
   ```

4. **Redux middleware warnings**
   - These are acceptable in dev mode (performance warnings)
   - Only shown when state/actions are large

### Test Writing Guidelines

#### Never Remove Failing Tests
- If a test fails, **fix the test or the code**, never delete it
- Removing tests to improve coverage is strictly forbidden
- Research solutions using web search if needed

#### RTK Query API Testing Pattern
```typescript
// Import required dependencies
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';

// Setup Redux store and wrapper
const store = setupStore();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

// Test Query Hook
const { result } = renderHook(() => useGetDataQuery(), { wrapper });

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});

expect(result.current.data?.success).toBe(true);

// Test Mutation Hook
const { result } = renderHook(() => useCreateMutation(), { wrapper });

await act(async () => {
  await result.current[0](payload).unwrap();
});

await waitFor(() => {
  expect(result.current[1].isSuccess).toBe(true);
});
```

#### MSW Handler Pattern
```typescript
// In /frontend/src/test/mocks/handlers.ts

// GET endpoint
http.get(`${API_URL}/resource/:id`, ({ params }) => {
  const item = mockData.find((d) => d.id === params.id);

  if (!item) {
    return HttpResponse.json(
      { success: false, error: 'Not found' },
      { status: 404 }
    );
  }

  return HttpResponse.json({ success: true, data: item });
}),

// POST endpoint
http.post(`${API_URL}/resource`, async ({ request }) => {
  const body = await request.json() as ResourceType;

  // Simulate error for testing
  if (body.name === 'ERROR') {
    return HttpResponse.json(
      { success: false, error: 'Creation failed' },
      { status: 400 }
    );
  }

  const newItem = { id: 'new-id', ...body };
  return HttpResponse.json({ success: true, data: newItem }, { status: 201 });
}),
```

### Component Testing Guidelines

#### Form Testing Pattern
1. Remove HTML5 `required` attributes if they conflict with JS validation
2. Test form field interactions
3. Test validation messages
4. Test successful submission
5. Test error handling
6. Use `userEvent` for realistic interactions

```typescript
const user = userEvent.setup();

// Type in input
await user.type(screen.getByLabelText('Field Label'), 'value');

// Click button
await user.click(screen.getByRole('button', { name: /submit/i }));

// Wait for async validation
expect(await screen.findByText('Error message')).toBeInTheDocument();
```

## Code Quality Standards

### ESLint Rules
- All ESLint errors must be fixed
- **Curly braces required** for all if statements (no inline if)
- No unused variables
- Proper TypeScript typing (no `any` without justification)

### TypeScript Standards
- Use strict typing
- Define proper interfaces/types
- Avoid `any` type unless absolutely necessary
- Use const assertions where appropriate

### File Organization
```
frontend/src/
├── app/              # Redux store, hooks
├── components/       # Reusable components
├── contexts/         # React contexts
├── features/         # Feature-based modules (with RTK Query APIs)
├── pages/            # Page components
├── test/
│   ├── mocks/        # MSW handlers, mock data
│   └── utils/        # Test utilities
├── types/            # TypeScript types
└── utils/            # Utility functions
```

## Git Practices

### Commit Messages
- Follow conventional commits format
- Always include Claude Code signature:
```
feat: add user authentication

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Pre-commit Checklist
- [ ] All tests pass (`npm test`)
- [ ] Coverage meets 90% threshold (`npm run test:coverage`)
- [ ] No ESLint errors (`npm run lint`)
- [ ] No TypeScript errors (`npm run type-check`)
- [ ] No console warnings/errors during test runs

## Common Patterns

### Removing HTML5 Required Attributes
When HTML5 validation conflicts with JS validation:
```bash
cd frontend/src/pages
sed -i '/^[[:space:]]*required$/d' ComponentName.tsx
```

### Testing with Different MSW Responses
```typescript
// Override handler for specific test
server.use(
  http.get('http://localhost:9999/api/endpoint', () => {
    return HttpResponse.json(
      { success: false, error: 'Server error' },
      { status: 500 }
    );
  })
);
```

## Best Practices

1. **Read before you write**: Always read source file before creating/editing tests
2. **Test behavior, not implementation**: Focus on what users experience
3. **Test edge cases**: Success, error, loading states, empty data, etc.
4. **Keep tests isolated**: Each test should be independent
5. **Use meaningful test descriptions**: Describe what the test verifies
6. **DRY principle**: Extract common setup to helper functions
7. **Maintain test data**: Keep mock data realistic and consistent
