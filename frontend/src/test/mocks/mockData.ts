import { User, Recipe, UserRole, RecipeStatus, ThemePreference, RecipeDifficulty } from '@/types';

export const mockUser: User = {
  id: '1',
  email: 'test@example.com',
  first_name: 'Test',
  last_name: 'User',
  role: UserRole.MEMBER,
  is_approved: true,
  theme_preference: ThemePreference.SYSTEM,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
};

export const mockAdmin: User = {
  id: '2',
  email: 'admin@example.com',
  first_name: 'Admin',
  last_name: 'User',
  role: UserRole.ADMIN,
  is_approved: true,
  theme_preference: ThemePreference.DARK,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
};

export const mockUnapprovedUser: User = {
  id: '3',
  email: 'pending@example.com',
  first_name: 'Pending',
  last_name: 'User',
  role: UserRole.GUEST,
  is_approved: false,
  theme_preference: ThemePreference.LIGHT,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
};

export const mockRecipe: Recipe = {
  id: '1',
  title: 'Test Recipe',
  description: 'A delicious test recipe',
  ingredients: [
    { name: 'Flour', quantity: '2 cups', unit: '', order_index: 0 },
    { name: 'Sugar', quantity: '1 cup', unit: '', order_index: 1 },
  ],
  instructions: [
    { step_number: 1, description: 'Mix flour and sugar' },
    { step_number: 2, description: 'Bake at 350F' },
  ],
  prep_time: 15,
  cook_time: 30,
  servings: 4,
  difficulty: 'medium' as RecipeDifficulty,
  categories: [],
  author_id: '1',
  approved_by_id: null,
  status: RecipeStatus.APPROVED,
  is_private: false,
  created_at: new Date('2024-01-01').toISOString(),
  updated_at: new Date('2024-01-01').toISOString(),
};

export const mockPendingRecipe: Recipe = {
  id: '2',
  title: 'Pending Recipe',
  description: 'A recipe awaiting approval',
  ingredients: [{ name: 'Water', quantity: '1 cup', unit: '', order_index: 0 }],
  instructions: [{ step_number: 1, description: 'Boil water' }],
  prep_time: 5,
  cook_time: 10,
  servings: 2,
  difficulty: 'easy' as RecipeDifficulty,
  categories: [],
  author_id: '1',
  approved_by_id: null,
  status: RecipeStatus.PENDING,
  is_private: true,
  created_at: new Date('2024-01-02').toISOString(),
  updated_at: new Date('2024-01-02').toISOString(),
};

export const mockPrivateRecipe: Recipe = {
  id: '3',
  title: 'Private Recipe',
  description: 'A private family recipe',
  ingredients: [{ name: 'Secret ingredient', quantity: '1 tbsp', unit: '', order_index: 0 }],
  instructions: [{ step_number: 1, description: 'Mix secretly' }],
  prep_time: 10,
  cook_time: 20,
  servings: 4,
  difficulty: 'hard' as RecipeDifficulty,
  categories: [],
  author_id: '1',
  approved_by_id: null,
  status: RecipeStatus.APPROVED,
  is_private: true,
  created_at: new Date('2024-01-03').toISOString(),
  updated_at: new Date('2024-01-03').toISOString(),
};

export const mockAuthResponse = {
  user: mockUser,
  accessToken: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
};

export const mockCategories = [
  { id: '1', name: 'Breakfast', slug: 'breakfast' },
  { id: '2', name: 'Lunch', slug: 'lunch' },
  { id: '3', name: 'Dinner', slug: 'dinner' },
  { id: '4', name: 'Dessert', slug: 'dessert' },
  { id: '5', name: 'Snacks', slug: 'snacks' },
];

export const mockUsers: User[] = [mockUser, mockAdmin, mockUnapprovedUser];
export const mockRecipes: Recipe[] = [mockRecipe, mockPendingRecipe, mockPrivateRecipe];
