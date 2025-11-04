# Frontend Type Fixing Plan

## Overview
- **TypeScript Errors**: 36
- **ESLint Errors**: 20
- **Files to Fix**: 3 main files + test files

## Phase 1: Fix TypeScript Errors (tsc --noEmit)

### Step 1: Identify all TypeScript errors
```bash
cd frontend && npm run type-check > ../.claude/temp/frontend-tsc-errors.txt 2>&1
```

### Step 2: Categorize errors by type
- Implicit `any` types
- Missing type definitions
- Type mismatches
- Unsafe assignments

### Step 3: Fix errors file by file
Priority order:
1. Source files (non-test)
2. Test utility files
3. Test files

## Phase 2: Fix ESLint Errors (npm run lint)

### Files with ESLint Errors:
1. **src/test/mocks/handlers.ts** - 12 `any` types
   - HTTP request handlers using `any` for request bodies
   - Need to type each request/response properly

2. **src/contexts/ThemeContext.test.tsx** - `any` types
   - Test setup using `any`
   - Need proper mock types

3. **src/pages/RecipesPage.test.tsx** - Unused imports ✅ FIXED

### Fixing Strategy:

#### handlers.ts
Each MSW handler needs proper typing:
```typescript
// Before (WRONG):
http.post(url, async ({ request }) => {
  const body = await request.json() as any;
})

// After (CORRECT):
interface LoginRequest {
  email: string;
  password: string;
}

http.post<never, LoginRequest>(url, async ({ request }) => {
  const body = await request.json() as LoginRequest;
})
```

#### ThemeContext.test.tsx
Mock objects need proper typing:
```typescript
// Before (WRONG):
const mockLocalStorage: any = {
  getItem: vi.fn(),
  setItem: vi.fn(),
};

// After (CORRECT):
const mockLocalStorage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem' | 'clear' | 'key' | 'length'> = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
  key: vi.fn(),
  length: 0,
};
```

## Phase 3: Verification

### Step 1: Run TypeScript compiler
```bash
cd frontend && npm run type-check
```
Expected: No errors

### Step 2: Run ESLint
```bash
cd frontend && npm run lint
```
Expected: No errors

### Step 3: Run tests
```bash
cd frontend && npm test
```
Expected: All 429 tests passing

### Step 4: Run tests with coverage
```bash
cd frontend && npm run test:coverage
```
Expected: All categories ≥90%

## Success Criteria
- ✅ `npm run type-check` passes with 0 errors
- ✅ `npm run lint` passes with 0 errors
- ✅ All tests pass (429/429)
- ✅ Coverage remains ≥90% in all categories
- ✅ Zero console warnings during tests
