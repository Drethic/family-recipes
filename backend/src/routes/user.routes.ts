import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { authenticate } from '../middleware/auth';
import { isAdmin } from '../middleware/authorize';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validateRequest';

const router = Router();

// All user routes require admin authentication
router.use(authenticate, isAdmin);

router.get('/', UserController.getAll);
router.get('/:id', UserController.getById);
router.patch(
  '/:id/role',
  [body('role').notEmpty().withMessage('Role is required')],
  validateRequest,
  UserController.updateRole
);
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
router.post('/:id/approve', UserController.approveUser);
router.post('/:id/reject', UserController.rejectUser);
router.delete('/:id', UserController.delete);

export default router;
