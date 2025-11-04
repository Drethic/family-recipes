# Quick Start Guide

## Your Application is Now Running!

All services are up and running successfully:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Database**: PostgreSQL on port 5432

## Test Accounts

You can login with these pre-seeded accounts:

1. **Admin Account**
   - Email: `admin@recipes.com`
   - Password: `admin123`
   - Access: Full admin privileges, can approve recipes, manage users

2. **Member Account**
   - Email: `member@recipes.com`
   - Password: `member123`
   - Access: Can submit recipes (pending admin approval), view private recipes

## What's Already Set Up

- Database migrations have been run (7 tables created)
- Sample data has been seeded:
  - 2 test users (admin + member)
  - 10 recipe categories
  - 1 sample recipe (Chocolate Chip Cookies)

## Next Steps

1. **Open your browser** to http://localhost:5173

2. **Try logging in**:
   - Click "Login"
   - Use admin@recipes.com / admin123
   - You should see your name in the header

3. **Browse recipes**:
   - Click "Browse Recipes"
   - You should see the Chocolate Chip Cookies recipe

4. **Test admin features**:
   - Login as admin
   - Go to "Admin Dashboard"
   - You can approve/reject recipes here

5. **Test member features**:
   - Logout
   - Login as member@recipes.com / member123
   - Go to "My Recipes"

## Useful Commands

```bash
# View logs
docker-compose logs -f backend
docker-compose logs -f frontend

# Stop all services
docker-compose down

# Start all services
docker-compose up -d

# Run migrations (if needed)
docker-compose exec backend npm run migrate:latest

# Seed database again (will reset data)
docker-compose exec backend npm run seed:run

# Rollback last migration
docker-compose exec backend npm run migrate:rollback
```

## API Testing

Test the API directly:

```bash
# Health check
curl http://localhost:5000/health

# Get recipes (public)
curl http://localhost:5000/api/recipes

# Login (get token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@recipes.com","password":"admin123"}'
```

## Troubleshooting

### Container won't start
```bash
docker-compose down
docker-compose up -d
```

### Database connection errors
```bash
# Check if database is healthy
docker-compose ps

# Restart database
docker-compose restart db
```

### Frontend can't connect to backend
- Make sure both containers are running: `docker-compose ps`
- Check backend logs: `docker-compose logs backend`

### Need to reset everything
```bash
# Stop and remove all containers, volumes
docker-compose down -v

# Start fresh
docker-compose up -d
docker-compose exec backend npm run migrate:latest
docker-compose exec backend npm run seed:run
```

## Project Structure

```
Recipes/
├── backend/          # Node.js + Express API
│   ├── src/         # Source code
│   ├── migrations/  # Database migrations
│   └── seeds/       # Sample data
├── frontend/        # React application
│   └── src/        # Source code
├── docker-compose.yml
└── README.md
```

## Development

The containers are set up with hot-reload:
- **Frontend**: Changes to files in `frontend/src/` will auto-reload
- **Backend**: Changes to files in `backend/src/` will auto-reload

Just edit the files and see your changes immediately!

## Support

- See [README.md](README.md) for full project documentation
- See [SETUP_GUIDE.md](SETUP_GUIDE.md) for detailed setup instructions
- See [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md) for complete feature list
- See [backend/README.md](backend/README.md) for API documentation

## What Was Fixed

During setup, we:
1. Changed Dockerfiles from `npm ci` to `npm install` (no package-lock.json)
2. Removed obsolete `version` field from docker-compose.yml
3. Converted TypeScript migration files to JavaScript for Knex compatibility
4. Converted TypeScript seed files to JavaScript
5. Fixed SQL query issue in RecipeService for proper counting

Everything is now working perfectly!

---

**Enjoy building your Family Recipe Website!** 🍳
