import { body } from 'express-validator';

export const createRecipeValidator = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Title is required')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Description is required'),
  body('prepTime')
    .isInt({ min: 0 })
    .withMessage('Prep time must be a positive number'),
  body('cookTime')
    .isInt({ min: 0 })
    .withMessage('Cook time must be a positive number'),
  body('servings')
    .isInt({ min: 1 })
    .withMessage('Servings must be at least 1'),
  body('difficulty')
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('ingredients')
    .isArray({ min: 1 })
    .withMessage('At least one ingredient is required'),
  body('ingredients.*.quantity')
    .trim()
    .notEmpty()
    .withMessage('Ingredient quantity is required'),
  body('ingredients.*.unit')
    .trim()
    .notEmpty()
    .withMessage('Ingredient unit is required'),
  body('ingredients.*.name')
    .trim()
    .notEmpty()
    .withMessage('Ingredient name is required'),
  body('ingredients.*.order_index')
    .isInt({ min: 0 })
    .withMessage('Ingredient order_index must be a positive number'),
  body('instructions')
    .isArray({ min: 1 })
    .withMessage('At least one instruction is required'),
  body('instructions.*.step_number')
    .isInt({ min: 1 })
    .withMessage('Step number must be at least 1'),
  body('instructions.*.description')
    .trim()
    .notEmpty()
    .withMessage('Instruction description is required'),
  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('Category IDs must be an array'),
];

export const updateRecipeValidator = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Title cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Title must not exceed 255 characters'),
  body('description')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Description cannot be empty'),
  body('prepTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Prep time must be a positive number'),
  body('cookTime')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Cook time must be a positive number'),
  body('servings')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Servings must be at least 1'),
  body('difficulty')
    .optional()
    .isIn(['easy', 'medium', 'hard'])
    .withMessage('Difficulty must be easy, medium, or hard'),
  body('isPrivate')
    .optional()
    .isBoolean()
    .withMessage('isPrivate must be a boolean'),
  body('ingredients')
    .optional()
    .isArray()
    .withMessage('Ingredients must be an array'),
  body('instructions')
    .optional()
    .isArray()
    .withMessage('Instructions must be an array'),
  body('categoryIds')
    .optional()
    .isArray()
    .withMessage('Category IDs must be an array'),
];
