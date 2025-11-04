# Recipe Backend API

RESTful API for the Family Recipe Website built with Node.js, Express, TypeScript, and PostgreSQL.

## API Endpoints

### Authentication

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| POST | `/api/auth/register` | Register new user | No |
| POST | `/api/auth/login` | Login user | No |
| POST | `/api/auth/refresh` | Refresh access token | No (refresh token cookie) |
| POST | `/api/auth/logout` | Logout user | No |
| GET | `/api/auth/me` | Get current user | Yes |

### Recipes

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/recipes` | List all recipes | Optional | - |
| GET | `/api/recipes/:id` | Get recipe by ID | Optional | - |
| GET | `/api/recipes/my-recipes` | Get current user's recipes | Yes | Member/Admin |
| POST | `/api/recipes` | Create new recipe | Yes | Member/Admin |
| PATCH | `/api/recipes/:id` | Update recipe | Yes | Owner/Admin |
| DELETE | `/api/recipes/:id` | Delete recipe | Yes | Owner/Admin |
| PATCH | `/api/recipes/:id/approve` | Approve recipe | Yes | Admin |
| PATCH | `/api/recipes/:id/reject` | Reject recipe | Yes | Admin |

### Users

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/users` | List all users | Yes | Admin |
| GET | `/api/users/:id` | Get user by ID | Yes | Admin |
| PATCH | `/api/users/:id/role` | Update user role | Yes | Admin |
| DELETE | `/api/users/:id` | Delete user | Yes | Admin |

### Categories

| Method | Endpoint | Description | Auth Required | Role |
|--------|----------|-------------|---------------|------|
| GET | `/api/categories` | List all categories | No | - |
| GET | `/api/categories/:id` | Get category by ID | No | - |
| POST | `/api/categories` | Create category | Yes | Admin |
| PATCH | `/api/categories/:id` | Update category | Yes | Admin |
| DELETE | `/api/categories/:id` | Delete category | Yes | Admin |

## Request/Response Examples

### Register User

**Request:**
```json
POST /api/auth/register
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123",
  "firstName": "John",
  "lastName": "Doe"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully",
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com",
      "first_name": "John",
      "last_name": "Doe",
      "role": "member",
      "created_at": "2025-01-01T00:00:00.000Z"
    },
    "accessToken": "jwt_token"
  }
}
```

### Create Recipe

**Request:**
```json
POST /api/recipes
Authorization: Bearer {accessToken}
Content-Type: application/json

{
  "title": "Chocolate Chip Cookies",
  "description": "Delicious homemade cookies",
  "prepTime": 15,
  "cookTime": 12,
  "servings": 24,
  "difficulty": "easy",
  "isPrivate": false,
  "ingredients": [
    {
      "quantity": "2",
      "unit": "cups",
      "name": "flour",
      "order_index": 1
    }
  ],
  "instructions": [
    {
      "step_number": 1,
      "description": "Preheat oven to 375°F"
    }
  ],
  "categoryIds": ["category-uuid"]
}
```

**Response:**
```json
{
  "success": true,
  "message": "Recipe created successfully",
  "data": {
    "id": "recipe-uuid",
    "title": "Chocolate Chip Cookies",
    "status": "approved",
    "ingredients": [...],
    "instructions": [...],
    "categories": [...]
  }
}
```

## Database Migrations

```bash
# Create a new migration
npm run migrate:make migration_name

# Run all pending migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Rollback all migrations
npm run migrate:rollback:all
```

## Database Seeds

```bash
# Create a new seed
npm run seed:make seed_name

# Run all seeds
npm run seed:run
```

## Environment Variables

See `.env.example` for all required environment variables.

## Development

```bash
# Install dependencies
npm install

# Run migrations
npm run migrate:latest

# Seed database (optional)
npm run seed:run

# Start development server
npm run dev
```

## Production

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## Default Test Users

After running seeds:

- **Admin**: admin@recipes.com / admin123
- **Member**: member@recipes.com / member123
