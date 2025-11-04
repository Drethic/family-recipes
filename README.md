# Family Recipe Website

A full-stack family recipe management system with role-based access control, recipe submissions, and admin approval workflow.

## Tech Stack

### Frontend
- React 19 with TypeScript
- Redux Toolkit + RTK Query for state management
- Tailwind CSS 4 for styling
- React Router v6 for routing
- Vite as build tool

### Backend
- Node.js with Express.js
- TypeScript
- PostgreSQL database
- Knex.js for migrations and query building
- JWT authentication
- bcrypt for password hashing

### DevOps
- Docker & Docker Compose for local development
- AWS Amplify for frontend hosting
- Railway for backend API and PostgreSQL database
- AWS S3 for image storage

## Features

- **Public Access**: Browse public recipes without authentication
- **Member Role**:
  - View all recipes (public and private)
  - Submit new recipes (requires admin approval)
  - Manage own recipes
- **Admin Role**:
  - Full CRUD operations on all recipes
  - Approve/reject member-submitted recipes
  - User management
  - Category management

## Project Structure

```
recipe-website/
├── frontend/          # React frontend application
├── backend/           # Express API server
├── docker-compose.yml # Docker orchestration for local dev
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 20+
- Docker & Docker Compose
- Git

### Local Development Setup

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd Recipes
   ```

2. **Set up environment variables**

   Backend:
   ```bash
   cd backend
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Frontend:
   ```bash
   cd frontend
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Start all services with Docker Compose**
   ```bash
   docker-compose up -d
   ```

4. **Run database migrations**
   ```bash
   docker-compose exec backend npm run migrate:latest
   ```

5. **Seed the database (optional)**
   ```bash
   docker-compose exec backend npm run seed:run
   ```

6. **Access the application**
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:5000
   - Database: localhost:5432

### Without Docker (Manual Setup)

**Backend:**
```bash
cd backend
npm install
npm run migrate:latest
npm run dev
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

## Database Migrations

```bash
# Create a new migration
npm run migrate:make <migration_name>

# Run all pending migrations
npm run migrate:latest

# Rollback last migration
npm run migrate:rollback

# Rollback all migrations
npm run migrate:rollback --all
```

## Deployment

### Frontend (AWS Amplify)

1. Connect your GitHub repository to AWS Amplify
2. Configure build settings:
   - Build command: `npm run build`
   - Output directory: `dist`
   - Base directory: `frontend`
3. Set environment variables in Amplify console
4. Deploy

### Backend (Railway)

1. Create a new project on Railway
2. Add PostgreSQL database service
3. Add backend service from GitHub repository
4. Set environment variables
5. Configure build settings:
   - Build command: `npm run build`
   - Start command: `npm start`
   - Root directory: `backend`
6. Deploy

### Environment Variables

See `.env.example` files in each directory for required environment variables.

## API Documentation

API endpoints are documented in [backend/README.md](backend/README.md)

## Contributing

1. Create a feature branch
2. Make your changes
3. Submit a pull request

## License

Private family project
