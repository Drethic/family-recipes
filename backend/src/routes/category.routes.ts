import { Router } from 'express';
import { CategoryController } from '../controllers/categoryController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/authorize';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// Public routes
router.get('/', CategoryController.getAll);
router.get('/:id', CategoryController.getById);

// Admin-only routes
router.post(
  '/',
  authenticate,
  isAdmin,
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('slug').trim().notEmpty().withMessage('Slug is required').isSlug().withMessage('Invalid slug format'),
  ],
  validateRequest,
  CategoryController.create
);

router.patch(
  '/:id',
  authenticate,
  isAdmin,
  [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('slug').optional().trim().notEmpty().withMessage('Slug cannot be empty').isSlug().withMessage('Invalid slug format'),
  ],
  validateRequest,
  CategoryController.update
);

router.delete('/:id', authenticate, isAdmin, CategoryController.delete);

export default router;
