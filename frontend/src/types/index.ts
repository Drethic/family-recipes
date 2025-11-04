export enum UserRole {
  GUEST = 'guest',
  MEMBER = 'member',
  ADMIN = 'admin',
}

export enum RecipeStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  APPROVED = 'approved',
  REJECTED = 'rejected',
}

export enum RecipeDifficulty {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard',
}

export enum ThemePreference {
  LIGHT = 'light',
  DARK = 'dark',
  SYSTEM = 'system',
}

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_approved: boolean;
  theme_preference: ThemePreference;
  created_at: string;
  updated_at: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
}

export interface Ingredient {
  id?: string;
  recipe_id?: string;
  quantity: string;
  unit: string;
  name: string;
  order_index: number;
}

export interface Instruction {
  id?: string;
  recipe_id?: string;
  step_number: number;
  description: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface RecipeImage {
  id: string;
  recipe_id: string;
  url: string;
  alt_text: string;
  is_primary: boolean;
  order_index: number;
}

export interface Recipe {
  id: string;
  title: string;
  description: string;
  prep_time: number;
  cook_time: number;
  servings: number;
  difficulty: RecipeDifficulty;
  is_private: boolean;
  status: RecipeStatus;
  author_id: string;
  approved_by_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    id: string;
    first_name: string;
    last_name: string;
    email: string;
  };
  approved_by?: {
    id: string;
    first_name: string;
    last_name: string;
  };
  ingredients?: Ingredient[];
  instructions?: Instruction[];
  categories?: Category[];
  images?: RecipeImage[];
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CreateRecipeRequest {
  title: string;
  description: string;
  prepTime: number;
  cookTime: number;
  servings: number;
  difficulty: RecipeDifficulty;
  isPrivate: boolean;
  ingredients: Omit<Ingredient, 'id' | 'recipe_id'>[];
  instructions: Omit<Instruction, 'id' | 'recipe_id'>[];
  categoryIds?: string[];
}

export interface UpdateRecipeRequest {
  title?: string;
  description?: string;
  prepTime?: number;
  cookTime?: number;
  servings?: number;
  difficulty?: RecipeDifficulty;
  isPrivate?: boolean;
  ingredients?: Omit<Ingredient, 'id' | 'recipe_id'>[];
  instructions?: Omit<Instruction, 'id' | 'recipe_id'>[];
  categoryIds?: string[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}
