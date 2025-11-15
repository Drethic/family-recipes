import { Request } from 'express';

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
  password_hash: string;
  first_name: string;
  last_name: string;
  role: UserRole;
  is_approved: boolean;
  approved_at?: Date | null;
  approved_by_id?: string | null;
  theme_preference: ThemePreference;
  created_at: Date;
  updated_at: Date;
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
  created_at: Date;
  updated_at: Date;
}

export interface Ingredient {
  id: string;
  recipe_id: string;
  quantity: string;
  unit: string;
  name: string;
  order_index: number;
}

export interface Instruction {
  id: string;
  recipe_id: string;
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

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
    role: UserRole;
  };
}

export interface TokenPayload {
  id: string;
  email: string;
  role: UserRole;
}

export interface RecipeWithDetails extends Recipe {
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

export interface ValidationError {
  field: string;
  message: string;
}

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  errors?: ValidationError[];
}

export interface PaginationParams {
  page: number;
  limit: number;
  offset: number;
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
