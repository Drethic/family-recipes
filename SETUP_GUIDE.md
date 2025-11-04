# Setup Guide - Family Recipe Website

## Quick Start with Docker

The easiest way to run the entire stack:

```bash
# 1. Create environment files
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env

# 2. Start all services
docker-compose up -d

# 3. Run database migrations
docker-compose exec backend npm run migrate:latest

# 4. (Optional) Seed database with sample data
docker-compose exec backend npm run seed:run
```

The application will be available at:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5000
- **Database**: localhost:5432

## Manual Setup (Without Docker)

### Backend

```bash
cd backend
npm install
cp .env.example .env

# Edit .env and set your database connection

# Run migrations
npm run migrate:latest

# Seed database (optional)
npm run seed:run

# Start development server
npm run dev
```

### Frontend

```bash
cd frontend
npm install
cp .env.example .env

# Edit .env if needed (default should work)

# Start development server
npm run dev
```

### Database

Make sure you have PostgreSQL installed and running:

```bash
# Create database
createdb recipedb

# Or using psql
psql -U postgres
CREATE DATABASE recipedb;
```

## Default Test Users

After seeding the database:

- **Admin**: admin@recipes.com / admin123
- **Member**: member@recipes.com / member123

## Production Build

### Backend

```bash
cd backend
npm run build
npm start
```

### Frontend

```bash
cd frontend
npm run build
# Files will be in dist/ directory
```

## Deployment

### Railway (Recommended Cheap Option)

1. **Create Railway Account**: https://railway.app

2. **Create New Project**

3. **Add PostgreSQL Database**:
   - Click "New"
   - Select "Database" → "PostgreSQL"

4. **Add Backend Service**:
   - Click "New" → "GitHub Repo"
   - Select your repository
   - Set root directory: `backend`
   - Add environment variables from `.env.example`
   - Set `DATABASE_URL` to the Railway PostgreSQL connection string

5. **Run Migrations**:
   - In Railway dashboard, go to backend service
   - Open terminal and run: `npm run migrate:latest`

6. **Deploy Frontend to AWS Amplify**:
   - Go to AWS Amplify Console
   - Connect GitHub repository
   - Set build settings:
     ```yaml
     version: 1
     frontend:
       phases:
         preBuild:
           commands:
             - cd frontend
             - npm ci
         build:
           commands:
             - npm run build
       artifacts:
         baseDirectory: frontend/dist
         files:
           - '**/*'
       cache:
         paths:
           - frontend/node_modules/**/*
     ```
   - Set environment variable:
     - `VITE_API_URL`: Your Railway backend URL + `/api`

## Environment Variables

### Backend (.env)

```
NODE_ENV=production
PORT=5000
DATABASE_URL=your_railway_postgres_url
JWT_SECRET=generate-a-random-secret-key
JWT_REFRESH_SECRET=generate-another-random-secret-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
CORS_ORIGIN=your_amplify_url
```

### Frontend (.env)

```
VITE_API_URL=your_railway_backend_url/api
VITE_APP_NAME=Family Recipes
```

## Troubleshooting

### Database Connection Issues

```bash
# Check if PostgreSQL is running
docker-compose ps

# View backend logs
docker-compose logs backend

# Restart services
docker-compose restart
```

### Port Already in Use

```bash
# Stop all services
docker-compose down

# Or manually kill processes
# On Windows:
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# On Linux/Mac:
lsof -ti:5000 | xargs kill -9
```

### Migrations Not Running

```bash
# Check migration status
docker-compose exec backend npm run migrate:status

# Rollback and re-run
docker-compose exec backend npm run migrate:rollback
docker-compose exec backend npm run migrate:latest
```

## Development Tips

### Adding New Migrations

```bash
docker-compose exec backend npm run migrate:make migration_name
# Edit the migration file in backend/migrations/
docker-compose exec backend npm run migrate:latest
```

### Testing API Endpoints

Use the test users to get JWT tokens:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@recipes.com","password":"admin123"}'

# Use the returned accessToken in subsequent requests
curl -X GET http://localhost:5000/api/recipes \
  -H "Authorization: Bearer YOUR_TOKEN"
```

## Cost Estimate (Railway + AWS Amplify)

- Railway (Backend + Database): $10/month
- AWS Amplify (Frontend): $15/month
- **Total**: ~$25-30/month

## Next Steps

1. Customize the styling and branding
2. Add image upload functionality (integrate with AWS S3)
3. Implement email notifications for recipe approvals
4. Add search and filtering features
5. Create recipe import/export functionality
6. Add print-friendly recipe views
7. Implement recipe ratings and comments

## Support

For issues or questions:
- Check the logs: `docker-compose logs -f`
- Review the API documentation in `backend/README.md`
- Ensure all environment variables are set correctly
