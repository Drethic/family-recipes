import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All profile routes require authentication
router.use(authenticate);

router.patch(
  '/:id/profile',
  [
    body('firstName').optional().isString().withMessage('First name must be a string'),
    body('lastName').optional().isString().withMessage('Last name must be a string'),
    body('email').optional().isEmail().withMessage('Invalid email address'),
  ],
  validateRequest,
  UserController.updateProfile
);

router.patch(
  '/:id/theme',
  [body('themePreference').notEmpty().withMessage('Theme preference is required')],
  validateRequest,
  UserController.updateTheme
);

router.patch(
  '/:id/password',
  [
    body('currentPassword').optional().isString(),
    body('newPassword').isString().isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  ],
  validateRequest,
  UserController.updatePassword
);

export default router;
