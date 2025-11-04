# Backend Testing Plan

## Overview
Set up comprehensive test coverage for the Express.js + TypeScript backend with the same 90% coverage requirement as the frontend.

## Technology Stack
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL + Knex
- **Linting**: ESLint (already configured)
- **Testing Framework**: Jest (recommended for Node.js)
- **HTTP Testing**: Supertest
- **Current Test Coverage**: 0% (no tests exist)

## Backend Structure Analysis

```
backend/src/
├── app.ts                    # Express app configuration
├── server.ts                 # Server entry point
├── config/
│   ├── database.ts          # Database connection
│   └── env.ts               # Environment configuration
├── controllers/             # Request handlers
│   ├── authController.ts
│   ├── categoryController.ts
│   ├── recipeController.ts
│   └── userController.ts
├── middleware/              # Custom middleware
│   ├── auth.ts             # Authentication
│   ├── authorize.ts        # Authorization
│   ├── errorHandler.ts     # Error handling
│   └── validateRequest.ts  # Request validation
├── routes/                  # Route definitions
│   ├── auth.routes.ts
│   ├── category.routes.ts
│   ├── profile.routes.ts
│   ├── recipe.routes.ts
│   └── user.routes.ts
└── services/                # Business logic
    ├── authService.ts
    ├── recipeService.ts
    └── userService.ts
```

## Phase 1: Setup Testing Infrastructure

### 1.1 Install Testing Dependencies

```bash
cd backend
npm install -D \
  jest \
  ts-jest \
  @types/jest \
  supertest \
  @types/supertest \
  jest-mock-extended
```

### 1.2 Create Jest Configuration

**File**: `backend/jest.config.js`

```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src'],
  testMatch: ['**/__tests__/**/*.ts', '**/?(*.)+(spec|test).ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/**/*.test.ts',
    '!src/**/*.spec.ts',
    '!src/server.ts',       // Entry point, hard to test
    '!src/migrations/**',
    '!src/seeds/**',
  ],
  coverageThresholds: {
    global: {
      lines: 90,
      statements: 90,
      functions: 90,
      branches: 90,
    },
  },
  coverageReporters: ['text', 'json', 'html'],
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
};
```

### 1.3 Update package.json Scripts

```json
{
  "scripts": {
    "test": "jest --no-color --verbose",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage --no-color --verbose",
    "test:ci": "jest --coverage --ci --maxWorkers=2"
  }
}
```

### 1.4 Create Test Setup File

**File**: `backend/src/test/setup.ts`

```typescript
// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/recipes_test';

// Increase timeout for database operations
jest.setTimeout(10000);

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  // Keep error for important messages
};
```

### 1.5 Create Test Database Configuration

**File**: `backend/src/test/testDb.ts`

```typescript
import knex, { Knex } from 'knex';

let testDb: Knex;

export const setupTestDb = async (): Promise<Knex> => {
  if (testDb) {
    return testDb;
  }

  testDb = knex({
    client: 'pg',
    connection: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/recipes_test',
    migrations: {
      directory: './migrations',
    },
    seeds: {
      directory: './seeds',
    },
  });

  // Run migrations
  await testDb.migrate.latest();

  return testDb;
};

export const teardownTestDb = async (): Promise<void> => {
  if (testDb) {
    await testDb.migrate.rollback({}, true);
    await testDb.destroy();
  }
};

export const clearTestDb = async (): Promise<void> => {
  if (!testDb) {
    return;
  }

  // Delete all records from tables (in correct order to respect foreign keys)
  await testDb('recipe_ingredients').del();
  await testDb('recipe_instructions').del();
  await testDb('recipe_categories').del();
  await testDb('recipes').del();
  await testDb('categories').del();
  await testDb('users').del();
};

export const getTestDb = (): Knex => testDb;
```

### 1.6 Create Mock Data Factory

**File**: `backend/src/test/factories.ts`

```typescript
import { faker } from '@faker-js/faker';

export const mockUser = (overrides = {}) => ({
  id: faker.string.uuid(),
  email: faker.internet.email(),
  first_name: faker.person.firstName(),
  last_name: faker.person.lastName(),
  role: 'member',
  is_approved: true,
  password_hash: '$2b$10$abcdefghijklmnopqrstuv', // bcrypt hash of 'password'
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockRecipe = (authorId: string, overrides = {}) => ({
  id: faker.string.uuid(),
  title: faker.lorem.words(3),
  description: faker.lorem.paragraph(),
  author_id: authorId,
  status: 'pending',
  difficulty: 'medium',
  prep_time_minutes: faker.number.int({ min: 10, max: 60 }),
  cook_time_minutes: faker.number.int({ min: 15, max: 120 }),
  servings: faker.number.int({ min: 2, max: 8 }),
  is_private: false,
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});

export const mockCategory = (overrides = {}) => ({
  id: faker.string.uuid(),
  name: faker.lorem.word(),
  created_at: new Date(),
  updated_at: new Date(),
  ...overrides,
});
```

### 1.7 Create Test Utilities

**File**: `backend/src/test/utils.ts`

```typescript
import jwt from 'jsonwebtoken';
import { mockUser } from './factories';

export const generateTestToken = (userId: string, role: string = 'member'): string => {
  return jwt.sign(
    { userId, role },
    process.env.JWT_SECRET || 'test-secret',
    { expiresIn: '1h' }
  );
};

export const createAuthHeader = (userId: string, role: string = 'member'): string => {
  const token = generateTestToken(userId, role);
  return `Bearer ${token}`;
};

export const createTestUser = async (db: any, overrides = {}) => {
  const user = mockUser(overrides);
  await db('users').insert(user);
  return user;
};

export const createTestRecipe = async (db: any, authorId: string, overrides = {}) => {
  const recipe = mockRecipe(authorId, overrides);
  await db('recipes').insert(recipe);
  return recipe;
};
```

## Phase 2: Test Routes/Controllers (Integration Tests)

### Priority: HIGH
**Goal**: Test all API endpoints with supertest

### 2.1 Auth Routes

**File**: `backend/src/routes/__tests__/auth.routes.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';
import { setupTestDb, clearTestDb, teardownTestDb } from '../../test/testDb';
import { createTestUser } from '../../test/utils';

describe('Auth Routes', () => {
  let db: any;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();
  });

  describe('POST /api/auth/register', () => {
    it('registers a new user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data.user.email).toBe('test@example.com');
    });

    it('returns 400 for duplicate email', async () => {
      await createTestUser(db, { email: 'test@example.com' });

      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'Password123!',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it('returns 400 for invalid email format', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'Password123!',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);
    });

    it('returns 400 for weak password', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          first_name: 'Test',
          last_name: 'User',
        })
        .expect(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('logs in with valid credentials', async () => {
      await createTestUser(db, {
        email: 'test@example.com',
        is_approved: true,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('token');
    });

    it('returns 401 for invalid credentials', async () => {
      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });

    it('returns 403 for unapproved user', async () => {
      await createTestUser(db, {
        email: 'test@example.com',
        is_approved: false,
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password',
        })
        .expect(403);

      expect(response.body.message).toContain('approved');
    });
  });
});
```

### 2.2 Recipe Routes

**File**: `backend/src/routes/__tests__/recipe.routes.test.ts`

```typescript
import request from 'supertest';
import app from '../../app';
import { setupTestDb, clearTestDb, teardownTestDb } from '../../test/testDb';
import { createTestUser, createTestRecipe, createAuthHeader } from '../../test/utils';

describe('Recipe Routes', () => {
  let db: any;
  let memberUser: any;
  let adminUser: any;
  let memberToken: string;
  let adminToken: string;

  beforeAll(async () => {
    db = await setupTestDb();
  });

  afterAll(async () => {
    await teardownTestDb();
  });

  beforeEach(async () => {
    await clearTestDb();

    memberUser = await createTestUser(db, { role: 'member' });
    adminUser = await createTestUser(db, { role: 'admin' });

    memberToken = createAuthHeader(memberUser.id, 'member');
    adminToken = createAuthHeader(adminUser.id, 'admin');
  });

  describe('GET /api/recipes', () => {
    it('returns approved recipes for unauthenticated users', async () => {
      await createTestRecipe(db, memberUser.id, { status: 'approved' });
      await createTestRecipe(db, memberUser.id, { status: 'pending' });

      const response = await request(app)
        .get('/api/recipes')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.recipes).toHaveLength(1);
      expect(response.body.data.recipes[0].status).toBe('approved');
    });

    it('returns paginated results', async () => {
      // Create 25 recipes
      for (let i = 0; i < 25; i++) {
        await createTestRecipe(db, memberUser.id, { status: 'approved' });
      }

      const response = await request(app)
        .get('/api/recipes?page=1&limit=10')
        .expect(200);

      expect(response.body.data.recipes).toHaveLength(10);
      expect(response.body.data.pagination.total).toBe(25);
      expect(response.body.data.pagination.pages).toBe(3);
    });

    it('filters by status for admin users', async () => {
      await createTestRecipe(db, memberUser.id, { status: 'approved' });
      await createTestRecipe(db, memberUser.id, { status: 'pending' });

      const response = await request(app)
        .get('/api/recipes?status=pending')
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.data.recipes).toHaveLength(1);
      expect(response.body.data.recipes[0].status).toBe('pending');
    });
  });

  describe('POST /api/recipes', () => {
    it('creates a recipe for authenticated members', async () => {
      const response = await request(app)
        .post('/api/recipes')
        .set('Authorization', memberToken)
        .send({
          title: 'Test Recipe',
          description: 'Test Description',
          difficulty: 'easy',
          prep_time_minutes: 10,
          cook_time_minutes: 20,
          servings: 4,
          ingredients: [
            { name: 'Flour', quantity: '2', unit: 'cups', order_index: 1 }
          ],
          instructions: [
            { step_number: 1, instruction: 'Mix ingredients' }
          ],
        })
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.title).toBe('Test Recipe');
      expect(response.body.data.status).toBe('pending');
    });

    it('returns 401 for unauthenticated users', async () => {
      await request(app)
        .post('/api/recipes')
        .send({ title: 'Test' })
        .expect(401);
    });

    it('returns 400 for invalid data', async () => {
      await request(app)
        .post('/api/recipes')
        .set('Authorization', memberToken)
        .send({ title: '' }) // Missing required fields
        .expect(400);
    });
  });

  describe('PATCH /api/recipes/:id/approve', () => {
    it('allows admin to approve a recipe', async () => {
      const recipe = await createTestRecipe(db, memberUser.id, { status: 'pending' });

      const response = await request(app)
        .patch(`/api/recipes/${recipe.id}/approve`)
        .set('Authorization', adminToken)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');
    });

    it('returns 403 for non-admin users', async () => {
      const recipe = await createTestRecipe(db, memberUser.id, { status: 'pending' });

      await request(app)
        .patch(`/api/recipes/${recipe.id}/approve`)
        .set('Authorization', memberToken)
        .expect(403);
    });
  });

  describe('DELETE /api/recipes/:id', () => {
    it('allows author to delete their own recipe', async () => {
      const recipe = await createTestRecipe(db, memberUser.id);

      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .set('Authorization', memberToken)
        .expect(200);
    });

    it('allows admin to delete any recipe', async () => {
      const recipe = await createTestRecipe(db, memberUser.id);

      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .set('Authorization', adminToken)
        .expect(200);
    });

    it('returns 403 for non-owner members', async () => {
      const otherUser = await createTestUser(db);
      const recipe = await createTestRecipe(db, otherUser.id);

      await request(app)
        .delete(`/api/recipes/${recipe.id}`)
        .set('Authorization', memberToken)
        .expect(403);
    });
  });
});
```

## Phase 3: Test Services (Unit Tests)

### Priority: MEDIUM
**Goal**: Test business logic with mocked database

### 3.1 Auth Service

**File**: `backend/src/services/__tests__/authService.test.ts`

```typescript
import { authService } from '../authService';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';

// Mock dependencies
jest.mock('bcrypt');
jest.mock('jsonwebtoken');

const mockDb = {
  select: jest.fn().mockReturnThis(),
  where: jest.fn().mockReturnThis(),
  first: jest.fn(),
  insert: jest.fn(),
  update: jest.fn(),
  from: jest.fn().mockReturnThis(),
};

describe('AuthService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('register', () => {
    it('hashes password and creates user', async () => {
      const mockHash = 'hashed_password';
      (bcrypt.hash as jest.Mock).mockResolvedValue(mockHash);
      mockDb.insert.mockResolvedValue([{ id: '123' }]);

      const result = await authService.register(mockDb, {
        email: 'test@example.com',
        password: 'password123',
        first_name: 'Test',
        last_name: 'User',
      });

      expect(bcrypt.hash).toHaveBeenCalledWith('password123', 10);
      expect(mockDb.insert).toHaveBeenCalledWith(
        expect.objectContaining({
          email: 'test@example.com',
          password_hash: mockHash,
        })
      );
    });

    it('throws error for duplicate email', async () => {
      mockDb.insert.mockRejectedValue({ code: '23505' }); // Postgres unique violation

      await expect(
        authService.register(mockDb, {
          email: 'test@example.com',
          password: 'password123',
          first_name: 'Test',
          last_name: 'User',
        })
      ).rejects.toThrow();
    });
  });

  describe('login', () => {
    it('returns token for valid credentials', async () => {
      const mockUser = {
        id: '123',
        email: 'test@example.com',
        password_hash: 'hashed',
        is_approved: true,
        role: 'member',
      };

      mockDb.first.mockResolvedValue(mockUser);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      (jwt.sign as jest.Mock).mockReturnValue('token123');

      const result = await authService.login(mockDb, {
        email: 'test@example.com',
        password: 'password123',
      });

      expect(result.token).toBe('token123');
      expect(jwt.sign).toHaveBeenCalledWith(
        expect.objectContaining({ userId: '123', role: 'member' }),
        expect.any(String),
        expect.any(Object)
      );
    });

    it('throws error for invalid password', async () => {
      mockDb.first.mockResolvedValue({
        id: '123',
        password_hash: 'hashed',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      await expect(
        authService.login(mockDb, {
          email: 'test@example.com',
          password: 'wrong',
        })
      ).rejects.toThrow();
    });
  });
});
```

## Phase 4: Test Middleware

### Priority: MEDIUM
**Goal**: Test authentication, authorization, validation, error handling

### 4.1 Auth Middleware

**File**: `backend/src/middleware/__tests__/auth.test.ts`

```typescript
import { auth } from '../auth';
import jwt from 'jsonwebtoken';
import { Request, Response, NextFunction } from 'express';

jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      headers: {},
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('calls next() for valid token', () => {
    const mockPayload = { userId: '123', role: 'member' };
    mockReq.headers = { authorization: 'Bearer valid_token' };
    (jwt.verify as jest.Mock).mockReturnValue(mockPayload);

    auth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
    expect(mockReq.user).toEqual(mockPayload);
  });

  it('returns 401 for missing token', () => {
    auth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockRes.json).toHaveBeenCalledWith(
      expect.objectContaining({ success: false })
    );
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 for invalid token', () => {
    mockReq.headers = { authorization: 'Bearer invalid_token' };
    (jwt.verify as jest.Mock).mockImplementation(() => {
      throw new Error('Invalid token');
    });

    auth(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
    expect(mockNext).not.toHaveBeenCalled();
  });
});
```

### 4.2 Authorize Middleware

**File**: `backend/src/middleware/__tests__/authorize.test.ts`

```typescript
import { authorize } from '../authorize';
import { Request, Response, NextFunction } from 'express';

describe('Authorize Middleware', () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      user: { userId: '123', role: 'member' },
    };
    mockRes = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    mockNext = jest.fn();
  });

  it('calls next() when user has required role', () => {
    const middleware = authorize(['member', 'admin']);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockNext).toHaveBeenCalled();
  });

  it('returns 403 when user lacks required role', () => {
    const middleware = authorize(['admin']);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(403);
    expect(mockNext).not.toHaveBeenCalled();
  });

  it('returns 401 when user is not authenticated', () => {
    mockReq.user = undefined;
    const middleware = authorize(['admin']);

    middleware(mockReq as Request, mockRes as Response, mockNext);

    expect(mockRes.status).toHaveBeenCalledWith(401);
  });
});
```

## Phase 5: Configuration & Utilities

### Priority: LOW
**Goal**: Test configuration files, utilities, helpers

### 5.1 Environment Config

**File**: `backend/src/config/__tests__/env.test.ts`

```typescript
import { config } from '../env';

describe('Environment Config', () => {
  it('exports required config values', () => {
    expect(config.port).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(config.databaseUrl).toBeDefined();
  });

  it('has sensible defaults', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
  });
});
```

## Testing Checklist

### Setup
- [ ] Install Jest, ts-jest, supertest, @types/jest, @types/supertest
- [ ] Create jest.config.js with 90% thresholds
- [ ] Create test setup file
- [ ] Create test database utilities
- [ ] Create mock data factories
- [ ] Create test utilities (auth helpers, etc.)
- [ ] Update package.json with test scripts

### Routes (Integration Tests) - 20 files
- [ ] auth.routes.test.ts (register, login, logout, refresh, getMe)
- [ ] recipe.routes.test.ts (CRUD + approve/reject)
- [ ] category.routes.test.ts (CRUD)
- [ ] user.routes.test.ts (list, approve, update role)
- [ ] profile.routes.test.ts (update profile, update password)

### Controllers - 4 files
- [ ] authController.test.ts
- [ ] recipeController.test.ts
- [ ] categoryController.test.ts
- [ ] userController.test.ts

### Services - 3 files
- [ ] authService.test.ts
- [ ] recipeService.test.ts
- [ ] userService.test.ts

### Middleware - 4 files
- [ ] auth.test.ts
- [ ] authorize.test.ts
- [ ] errorHandler.test.ts
- [ ] validateRequest.test.ts

### Config/Utils - 2 files
- [ ] env.test.ts
- [ ] database.test.ts

### Total: ~33 test files needed

## Success Criteria

- ✅ All backend files have test files
- ✅ 90%+ coverage in all categories (lines, statements, functions, branches)
- ✅ Zero ESLint errors
- ✅ All tests passing
- ✅ No console warnings/errors (except test output)
- ✅ Test database properly configured
- ✅ CI-ready (can run in GitHub Actions, etc.)

## Estimated Timeline

- **Phase 1 - Setup**: 1 session (2-3 hours)
- **Phase 2 - Routes**: 2-3 sessions (all integration tests)
- **Phase 3 - Services**: 1-2 sessions (unit tests)
- **Phase 4 - Middleware**: 1 session
- **Phase 5 - Config/Utils**: 1 session
- **Total**: 6-10 sessions depending on complexity

## Notes

- Test database should be separate from development database
- Use transactions and rollback in tests to keep DB clean
- Follow AAA pattern: Arrange, Act, Assert
- Mock external dependencies (email, file uploads, etc.)
- Test both success and error paths
- Test authorization (who can access what)
- Test validation (what input is accepted/rejected)

---

**Next Action**: Begin Phase 1 - Setup Testing Infrastructure
