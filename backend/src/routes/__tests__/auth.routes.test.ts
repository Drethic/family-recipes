import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import express, { Application } from 'express';
import authRoutes from '../auth.routes';
import { AuthController } from '../../controllers/authController';
import { authenticate } from '../../middleware/auth';

// Type for Express route layer with methods property
interface RouteLayer {
  route?: {
    path: string;
    stack: unknown[];
    methods: Record<string, boolean>;
  };
}

vi.mock('../../controllers/authController');
vi.mock('../../middleware/auth');

describe('Auth Routes', () => {
  let app: Application;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use('/api/auth', authRoutes);

    vi.mocked(authenticate).mockImplementation((_req, _res, next) => next());
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /api/auth/register', () => {
    it('should call register controller', async () => {
      vi.mocked(AuthController.register).mockImplementation((req, res) => {
        res.status(201).json({ success: true });
        return Promise.resolve();
      });

      await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(AuthController.register).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'invalid-email',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should require firstName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should require lastName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty email', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: '',
          password: 'password123',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: '',
          firstName: 'John',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty firstName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: '',
          lastName: 'Doe',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty lastName', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          email: 'test@example.com',
          password: 'password123',
          firstName: 'John',
          lastName: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/login', () => {
    it('should call login controller', async () => {
      vi.mocked(AuthController.login).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        });

      expect(AuthController.login).toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'invalid',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should require password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
    });

    it('should require email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty email', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: '',
          password: 'password123',
        });

      expect(response.status).toBe(400);
    });

    it('should reject empty password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          email: 'test@example.com',
          password: '',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should call refresh controller', async () => {
      vi.mocked(AuthController.refresh).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      await request(app)
        .post('/api/auth/refresh')
        .set('Cookie', ['refreshToken=test_token']);

      expect(AuthController.refresh).toHaveBeenCalled();
    });

    it('should not require authentication', async () => {
      vi.mocked(AuthController.refresh).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).not.toBe(401);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should call logout controller', async () => {
      vi.mocked(AuthController.logout).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      await request(app)
        .post('/api/auth/logout');

      expect(AuthController.logout).toHaveBeenCalled();
    });

    it('should not require authentication', async () => {
      vi.mocked(AuthController.logout).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).not.toBe(401);
    });
  });

  describe('GET /api/auth/me', () => {
    it('should call getMe controller', async () => {
      vi.mocked(AuthController.getMe).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
        return Promise.resolve();
      });

      await request(app)
        .get('/api/auth/me');

      expect(AuthController.getMe).toHaveBeenCalled();
    });

    it('should require authentication', async () => {
      vi.mocked(authenticate).mockImplementationOnce((req, res) => {
        res.status(401).json({ success: false, message: 'Unauthorized' });
      });

      await request(app)
        .get('/api/auth/me');

      expect(authenticate).toHaveBeenCalled();
    });
  });

  describe('Route configuration', () => {
    it('should have POST /register route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const registerRoute = routes.find((layer) => layer.route?.path === '/register');
      expect(registerRoute).toBeDefined();
      expect((registerRoute as RouteLayer)?.route?.methods.post).toBe(true);
    });

    it('should have POST /login route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const loginRoute = routes.find((layer) => layer.route?.path === '/login');
      expect(loginRoute).toBeDefined();
      expect((loginRoute as RouteLayer)?.route?.methods.post).toBe(true);
    });

    it('should have POST /refresh route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const refreshRoute = routes.find((layer) => layer.route?.path === '/refresh');
      expect(refreshRoute).toBeDefined();
      expect((refreshRoute as RouteLayer)?.route?.methods.post).toBe(true);
    });

    it('should have POST /logout route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const logoutRoute = routes.find((layer) => layer.route?.path === '/logout');
      expect(logoutRoute).toBeDefined();
      expect((logoutRoute as RouteLayer)?.route?.methods.post).toBe(true);
    });

    it('should have GET /me route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const meRoute = routes.find((layer) => layer.route?.path === '/me');
      expect(meRoute).toBeDefined();
      expect((meRoute as RouteLayer)?.route?.methods.get).toBe(true);
    });

    it('should have exactly 5 routes', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      expect(routes).toHaveLength(5);
    });

    it('should apply validators to register route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const registerRoute = routes.find((layer) => layer.route?.path === '/register');
      expect(registerRoute?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should apply validators to login route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const loginRoute = routes.find((layer) => layer.route?.path === '/login');
      expect(loginRoute?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should apply authenticate middleware to /me route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const meRoute = routes.find((layer) => layer.route?.path === '/me');
      expect(meRoute?.route?.stack.length).toBeGreaterThan(1);
    });

    it('should not have GET /register route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const registerRoute = routes.find((layer) => layer.route?.path === '/register');
      expect((registerRoute as RouteLayer)?.route?.methods.get).toBeUndefined();
    });

    it('should not have GET /login route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const loginRoute = routes.find((layer) => layer.route?.path === '/login');
      expect((loginRoute as RouteLayer)?.route?.methods.get).toBeUndefined();
    });

    it('should not have GET /logout route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const logoutRoute = routes.find((layer) => layer.route?.path === '/logout');
      expect((logoutRoute as RouteLayer)?.route?.methods.get).toBeUndefined();
    });

    it('should not have GET /refresh route', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const refreshRoute = routes.find((layer) => layer.route?.path === '/refresh');
      expect((refreshRoute as RouteLayer)?.route?.methods.get).toBeUndefined();
    });

    it('should not have PUT routes', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const putRoutes = routes.filter((layer) => (layer as RouteLayer).route?.methods.put);
      expect(putRoutes).toHaveLength(0);
    });

    it('should not have DELETE routes', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const deleteRoutes = routes.filter((layer) => (layer as RouteLayer).route?.methods.delete);
      expect(deleteRoutes).toHaveLength(0);
    });

    it('should not have PATCH routes', () => {
      const routes = authRoutes.stack.filter((layer) => layer.route);
      const patchRoutes = routes.filter((layer) => (layer as RouteLayer).route?.methods.patch);
      expect(patchRoutes).toHaveLength(0);
    });
  });
});
