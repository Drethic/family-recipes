# Backend Type Fixing Plan

## Overview
- **TypeScript Errors**: 33
- **ESLint Errors**: 70
- **Main Issue**: Controllers and services use `any` for error handling and request parameters

## Phase 1: Fix TypeScript Errors (tsc --noEmit)

### Step 1: Identify all TypeScript errors
```bash
cd backend && npm run type-check > ../.claude/temp/backend-tsc-errors.txt 2>&1
```

### Step 2: Categorize errors by type
- Implicit `any` types in catch blocks
- Missing type definitions for Express Request/Response
- Type mismatches in database operations
- Unsafe assignments

### Step 3: Fix errors by category

#### Category 1: Error Handler Types
All catch blocks use `any`:
```typescript
// Before (WRONG):
catch (error: any) {
  sendError(res, error.message);
}

// After (CORRECT):
catch (error) {
  if (error instanceof Error) {
    sendError(res, error.message);
  } else {
    sendError(res, 'An unknown error occurred');
  }
}
```

#### Category 2: Express Handler Types
Controllers use `any` for error parameter:
```typescript
// Before (WRONG):
export const getRecipes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ...
  } catch (error: any) {
    sendServerError(res, error.message);
  }
};

// After (CORRECT):
export const getRecipes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // ...
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    sendServerError(res, message);
  }
};
```

#### Category 3: Database Operation Types
```typescript
// Use proper Knex types or create interfaces for database rows
interface UserRow {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  is_approved: boolean;
  password_hash: string;
  created_at: Date;
  updated_at: Date;
}
```

## Phase 2: Fix ESLint Errors (npm run lint)

### Files with ESLint Errors:

1. **src/controllers/authController.ts** - 4 `any` types
   - Lines: 28, 54, 90, 116
   - All in catch blocks

2. **src/controllers/categoryController.ts** - 6 `any` types + 2 curly brace errors ✅ FIXED
   - Lines: 12, 29, 54, 81, 90, 109
   - Curly braces fixed ✅

3. **src/controllers/recipeController.ts** - 8 `any` types
   - Lines: 30, 47, 62, 84, 110, 136, 158, 173
   - All in catch blocks

4. **src/controllers/userController.ts** - 10 `any` types + 2 curly brace errors ✅ FIXED
   - Lines: 33, 53, 83, 108, 131, 154, 187, 207, 238, 280
   - Curly braces fixed ✅

5. **src/middleware/errorHandler.ts** - 1 `any` type
   - Line: 5
   - Error parameter in function signature

6. **src/config/database.ts** - 1 @ts-ignore
   - Line: 2
   - Should use @ts-expect-error instead

### Fixing Strategy:

#### Pattern 1: Replace all catch block `any` types
```typescript
// Find and replace pattern:
// FROM: catch (error: any)
// TO: catch (error)
// Then add proper type guards
```

#### Pattern 2: Error handler middleware
```typescript
// Before (WRONG):
export const errorHandler = (err: any, req: Request, res: Response, next: NextFunction)

// After (CORRECT):
export const errorHandler = (err: Error | unknown, req: Request, res: Response, next: NextFunction)
```

#### Pattern 3: Update data construction
```typescript
// Before (WRONG):
const updateData: any = {};

// After (CORRECT):
interface UpdateData {
  name?: string;
  slug?: string;
}
const updateData: UpdateData = {};
```

## Phase 3: Verification

### Step 1: Run TypeScript compiler
```bash
cd backend && npm run type-check
```
Expected: No errors

### Step 2: Run ESLint
```bash
cd backend && npm run lint
```
Expected: No errors

### Step 3: Run tests
```bash
cd backend && npm test
```
Expected: All 72 tests passing

### Step 4: Run tests with coverage
```bash
cd backend && npm run test:coverage
```
Expected: All categories ≥90%

## Success Criteria
- ✅ `npm run type-check` passes with 0 errors
- ✅ `npm run lint` passes with 0 errors
- ✅ All tests pass (72/72)
- ✅ Coverage remains ≥90% in all categories
- ✅ Zero console warnings during tests

## Files to Modify
1. src/controllers/authController.ts
2. src/controllers/categoryController.ts
3. src/controllers/recipeController.ts
4. src/controllers/userController.ts
5. src/middleware/errorHandler.ts
6. src/config/database.ts
7. src/services/*.ts (if needed)
