# Recipe Family Website - Project Instructions for Claude

## Project Overview
Full-stack family recipe sharing application with user authentication, recipe management, and admin approval system. This document provides essential context for Claude Code sessions.

## Quick Reference
- **Frontend**: React 18 + TypeScript + Vite + TailwindCSS + Redux Toolkit
- **Testing**: Vitest + React Testing Library + MSW
- **Current Coverage**: 99.81% lines, 99.82% statements, 100% functions, 94.44% branches ✅
- **Total Tests**: 429 (all passing ✓)
- **Status**: ✅ **FRONTEND COMPLETE** - Ready for backend testing phase

## Critical Requirements

### 0. STRICT TYPING - NO `any` TYPE ALLOWED
**CRITICAL - HIGHEST PRIORITY**: The use of TypeScript's `any` type is **EXPRESSLY FORBIDDEN** in both frontend and backend code.

**ESLint Configuration Requirements:**
- `@typescript-eslint/no-explicit-any`: **MUST** be set to `'error'` (never `'warn'` or `'off'`)
- `@typescript-eslint/no-unused-vars`: **MUST** be set to `'error'` (never `'warn'` or `'off'`)
- `curly`: **MUST** be set to `['error', 'all']` (no inline if statements)
- **NO OVERRIDES**: These rules must NEVER be disabled for any files, including test files

**Before ANY code changes:**
1. Verify ESLint config files have strict rules (no `any`, no unused vars, curly braces required)
2. Run `npm run lint` to check for violations
3. Run `npm run type-check` to verify TypeScript compilation
4. Fix ALL errors before proceeding

**Proper Type Usage:**
```typescript
// ❌ FORBIDDEN - Never use any
function getData(param: any) { }
const result: any = getValue();

// ✅ CORRECT - Use proper types
function getData(param: string | number) { }
const result: User | null = getValue();
interface Unknown { [key: string]: unknown }
```

**TypeScript Configuration:**
- `strict: true` in tsconfig.json
- All strict type checking options enabled
- No suppressions or type assertions without proper justification

### 1. Test Coverage: 90% Minimum
**Every source file must have ≥90% coverage in ALL categories:**
- ✓ Lines ≥ 90%
- ✓ Statements ≥ 90%
- ✓ Functions ≥ 90%
- ✓ Branches ≥ 90%

Check coverage with:
```bash
cd frontend && npm run test:coverage
```

### 2. Zero Console Output
**CRITICAL**: No warnings or errors allowed during test execution.

Common issues to fix:
- React Testing Library `act()` warnings → Wrap mutations in `act()`
- MSW unhandled requests → Add handlers in `frontend/src/test/mocks/handlers.ts`
- React Router warnings → Add v7 future flags to BrowserRouter

### 3. Never Remove Failing Tests
- If a test fails, **fix it** - never delete it
- Research solutions if needed
- Removing tests is strictly forbidden

### 4. All Files Must Have Tests
Every `.ts` and `.tsx` file (except test files) must have a corresponding `.test.ts` or `.test.tsx` file.

### 5. Temporary File Management
**CRITICAL**: All temporary files must be stored in `.claude/temp/` and cleaned up regularly.

**Rules**:
- **Never** create temporary files in the project root or any source directories
- **Always** use `.claude/temp/` for temporary files (coverage outputs, logs, JSON dumps, etc.)
- **Clean up** at the end of each session or when files are no longer needed
- `.claude/temp/` is already git-ignored

**Common temporary files to watch for**:
- `coverage-*.json`, `coverage-*.txt`
- `*-temp.*`, `*.tmp`, `*.log`
- Test output files
- Debug dumps

**Cleanup command**:
```bash
# Run at the end of each session
rm -rf .claude/temp/*
```

**Before creating any file**, ask yourself:
1. Is this a temporary file? → Use `.claude/temp/`
2. Is this project source code? → Use appropriate `src/` directory
3. Is this documentation? → Use `.claude/` or project root

## Current Status

### Frontend - ✅ COMPLETE (All Files 90%+)

**Coverage by Directory:**
- src/app: 100% all categories
- src/contexts: 100% statements/functions/lines, 92.85% branch
- src/features/auth: 100% statements/functions/lines, 96.15% branch
- src/pages: 99.65% statements/lines, 100% functions, 93.33% branch
- src/types: 100% all categories
- src/utils: 100% statements/functions/lines, 87.5% branch*

*Note: constants.ts has untestable import.meta.env fallbacks (documented and approved)

**Key Achievements:**
- 429 passing tests (up from 317)
- Zero console warnings/errors
- All act() warnings resolved
- Comprehensive MSW mocking
- Full RTK Query integration testing
- Clean test output configuration (works in Bash and PowerShell)

See [.claude/progress.md](.claude/progress.md) for detailed completion tracking.

### Backend - Not Yet Started
**Status**: Ready to begin backend test infrastructure setup.

**Next Steps After Frontend Completion**:
1. Set up testing framework (Jest or Vitest)
2. Configure ESLint for backend TypeScript/JavaScript
3. Add test coverage reporting
4. Create test files for all backend routes/controllers
5. Target 90% coverage on backend as well

## Testing Patterns

### RTK Query API Integration Test
```typescript
import { renderHook, waitFor, act } from '@testing-library/react';
import { Provider } from 'react-redux';
import { setupStore } from '@/test/utils/test-utils';

// Query Test
const store = setupStore();
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <Provider store={store}>{children}</Provider>
);

const { result } = renderHook(() => useGetDataQuery(), { wrapper });

await waitFor(() => {
  expect(result.current.isSuccess).toBe(true);
});

// Mutation Test
await act(async () => {
  await result.current[0](payload).unwrap();
});

await waitFor(() => {
  expect(result.current[1].isSuccess).toBe(true);
});
```

### MSW Handler Pattern
```typescript
// In frontend/src/test/mocks/handlers.ts
http.post(`${API_URL}/resource`, async ({ request }) => {
  const body = await request.json();

  // Test error scenario
  if (body.name === 'ERROR') {
    return HttpResponse.json(
      { success: false, error: 'Failed' },
      { status: 400 }
    );
  }

  return HttpResponse.json({ success: true, data: newItem }, { status: 201 });
}),
```

## Common Tasks

### Add Integration Tests for RTK Query API
1. Read the API file to understand endpoints
2. Rename test file from `.test.ts` to `.test.tsx`
3. Import: `renderHook`, `waitFor`, `act`, `Provider`, `setupStore`
4. Write tests that actually call the hooks
5. Add MSW handlers for all endpoints
6. Ensure zero console warnings

### Fix HTML5 Validation Conflicts
If JS validation never runs because HTML5 validation blocks submission:
```bash
cd frontend/src/pages
sed -i '/^[[:space:]]*required$/d' ComponentName.tsx
```

### Add Missing MSW Handlers
Check `frontend/src/test/mocks/handlers.ts` and add handlers for:
- GET, POST, PATCH, DELETE for each resource
- Error scenarios (404, 400, 500)
- Edge cases (empty data, etc.)

## File Locations
```
Recipes/
├── .claude/               # Project configuration (you are here)
│   ├── project.md        # Full project documentation
│   ├── coding-standards.md  # Development standards
│   ├── progress.md       # Session progress tracker
│   └── commands/         # Custom slash commands
├── frontend/
│   └── src/
│       ├── features/     # RTK Query APIs (categoryApi, recipeApi, etc.)
│       ├── pages/        # Page components
│       ├── components/   # Reusable components
│       └── test/
│           ├── mocks/    # MSW handlers
│           └── utils/    # Test utilities
└── CLAUDE.md            # This file
```

## Workflow for New Sessions

1. **Check progress**: Read `.claude/progress.md` for current status
2. **Review requirements**: Reference `.claude/project.md` for rules
3. **Check standards**: Use `.claude/coding-standards.md` for patterns
4. **Run coverage**: `cd frontend && npm run test:coverage`
5. **Pick next file**: Start with highest priority from progress.md
6. **Write tests**: Follow patterns, ensure zero warnings
7. **Verify**: Confirm 90%+ coverage, all tests pass
8. **Update progress**: Document what was completed

## Key Achievements This Session
- Improved 8 files to 90%+ coverage
- Added 33 new tests (284 → 317)
- Fixed all act() warnings
- Created comprehensive MSW handlers
- Removed HTML5 validation conflicts
- Added React Router v7 compatibility
- Zero console warnings achieved

## Next Priorities

### ✅ Phase 1: Complete Frontend - DONE!
All frontend files now have ≥90% coverage in all categories.

### Phase 2: Backend Setup (CURRENT PRIORITY)
1. **Assess backend structure**
   - Identify backend technology (Express, Nest.js, etc.)
   - Check if TypeScript or JavaScript
   - Review existing code organization

2. **Set up testing infrastructure**
   - Install testing framework (Jest recommended for Node.js)
   - Install coverage tools (istanbul/nyc or jest --coverage)
   - Configure test environment
   - Set up test database (if needed)

3. **Configure linting**
   - Install ESLint for backend
   - Configure TypeScript ESLint if using TypeScript
   - Set up similar rules as frontend (curly braces, etc.)
   - Add lint scripts to package.json

4. **Add test coverage**
   - Create test files for all routes
   - Create test files for all controllers
   - Create test files for all services/models
   - Create test files for middleware
   - Create test files for utilities
   - Target: 90% coverage in all categories

5. **Set up CI/CD checks**
   - Add test and lint checks to CI pipeline
   - Require 90% coverage on PRs
   - Enforce zero ESLint errors

## Resources
- Full documentation: `.claude/project.md`
- Coding standards: `.claude/coding-standards.md`
- Session progress: `.claude/progress.md`
- Test coverage: `npm run test:coverage`
- Run tests: `npm test`

## Need Help?
- Check `.claude/coding-standards.md` for testing patterns
- Review `.claude/progress.md` for what's been completed
- Search `.claude/project.md` for specific requirements
