import { Router } from 'express';
import { RecipeController } from '../controllers/recipeController';
import { authenticate, optionalAuthenticate } from '../middleware/auth';
import { isAdmin, isMemberOrAdmin } from '../middleware/authorize';
import { validateRequest } from '../middleware/validateRequest';
import { createRecipeValidator, updateRecipeValidator } from '../validators/recipeValidators';

const router = Router();

// Public/authenticated routes
router.get('/', optionalAuthenticate, RecipeController.getAll);
router.get('/my-recipes', authenticate, isMemberOrAdmin, RecipeController.getMyRecipes);
router.get('/:id', optionalAuthenticate, RecipeController.getById);

// Member and Admin routes
router.post(
  '/',
  authenticate,
  isMemberOrAdmin,
  createRecipeValidator,
  validateRequest,
  RecipeController.create
);
router.patch(
  '/:id',
  authenticate,
  isMemberOrAdmin,
  updateRecipeValidator,
  validateRequest,
  RecipeController.update
);
router.delete('/:id', authenticate, isMemberOrAdmin, RecipeController.delete);

// Admin-only routes
router.patch('/:id/approve', authenticate, isAdmin, RecipeController.approve);
router.patch('/:id/reject', authenticate, isAdmin, RecipeController.reject);

export default router;
