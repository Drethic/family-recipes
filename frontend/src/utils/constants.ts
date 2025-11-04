export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
export const APP_NAME = import.meta.env.VITE_APP_NAME || 'Family Recipes';

export const ROUTES = {
  HOME: '/',
  RECIPES: '/recipes',
  RECIPE_DETAIL: '/recipes/:id',
  LOGIN: '/login',
  REGISTER: '/register',
  MEMBER_DASHBOARD: '/member/dashboard',
  MEMBER_RECIPES: '/member/my-recipes',
  MEMBER_SUBMIT: '/member/submit',
  ADMIN_DASHBOARD: '/admin/dashboard',
  ADMIN_PENDING: '/admin/recipes/pending',
  ADMIN_RECIPES: '/admin/recipes',
  ADMIN_USERS: '/admin/users',
  ADMIN_CATEGORIES: '/admin/categories',
} as const;

export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
};

export const STATUS_LABELS: Record<string, string> = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  rejected: 'Rejected',
};

export const ROLE_LABELS: Record<string, string> = {
  guest: 'Guest',
  member: 'Member',
  admin: 'Administrator',
};
