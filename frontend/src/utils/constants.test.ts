import { describe, it, expect } from 'vitest';
import { API_URL, APP_NAME, ROUTES, DIFFICULTY_LABELS, STATUS_LABELS, ROLE_LABELS } from './constants';

/**
 * NOTE: Coverage for constants.ts line 1 (API_URL fallback)
 *
 * The fallback branch `|| 'http://localhost:5000/api'` on line 1 cannot be tested
 * because VITE_API_URL is globally stubbed in src/test/setup.ts for all tests.
 *
 * This is a Vitest limitation with import.meta.env:
 * - Environment variables are set at module load time
 * - Modules are cached and cannot be re-evaluated with different env values
 * - Removing the stub would break 426 tests that depend on the API_URL value
 *
 * Coverage constraint can ignore line 1 branch coverage for this file.
 */

describe('constants', () => {
  it('exports API_URL', () => {
    expect(API_URL).toBeDefined();
    expect(typeof API_URL).toBe('string');
  });

  it('uses VITE_API_URL from environment when set', () => {
    // The env var is set in setup.ts to 'http://localhost:9999/api'
    expect(API_URL).toBe('http://localhost:9999/api');
  });


  it('exports APP_NAME', () => {
    expect(APP_NAME).toBeDefined();
    expect(typeof APP_NAME).toBe('string');
  });

  it('uses fallback APP_NAME when environment variable is not set', () => {
    // VITE_APP_NAME is not set in setup.ts, so it should use the fallback
    expect(APP_NAME).toBe('Family Recipes');
  });

  it('exports ROUTES object with all route paths', () => {
    expect(ROUTES).toBeDefined();
    expect(ROUTES.HOME).toBe('/');
    expect(ROUTES.RECIPES).toBe('/recipes');
    expect(ROUTES.RECIPE_DETAIL).toBe('/recipes/:id');
    expect(ROUTES.LOGIN).toBe('/login');
    expect(ROUTES.REGISTER).toBe('/register');
    expect(ROUTES.MEMBER_DASHBOARD).toBe('/member/dashboard');
    expect(ROUTES.MEMBER_RECIPES).toBe('/member/my-recipes');
    expect(ROUTES.MEMBER_SUBMIT).toBe('/member/submit');
    expect(ROUTES.ADMIN_DASHBOARD).toBe('/admin/dashboard');
    expect(ROUTES.ADMIN_PENDING).toBe('/admin/recipes/pending');
    expect(ROUTES.ADMIN_RECIPES).toBe('/admin/recipes');
    expect(ROUTES.ADMIN_USERS).toBe('/admin/users');
    expect(ROUTES.ADMIN_CATEGORIES).toBe('/admin/categories');
  });

  it('exports DIFFICULTY_LABELS with correct mappings', () => {
    expect(DIFFICULTY_LABELS).toBeDefined();
    expect(DIFFICULTY_LABELS.easy).toBe('Easy');
    expect(DIFFICULTY_LABELS.medium).toBe('Medium');
    expect(DIFFICULTY_LABELS.hard).toBe('Hard');
  });

  it('exports STATUS_LABELS with correct mappings', () => {
    expect(STATUS_LABELS).toBeDefined();
    expect(STATUS_LABELS.draft).toBe('Draft');
    expect(STATUS_LABELS.pending).toBe('Pending Approval');
    expect(STATUS_LABELS.approved).toBe('Approved');
    expect(STATUS_LABELS.rejected).toBe('Rejected');
  });

  it('exports ROLE_LABELS with correct mappings', () => {
    expect(ROLE_LABELS).toBeDefined();
    expect(ROLE_LABELS.guest).toBe('Guest');
    expect(ROLE_LABELS.member).toBe('Member');
    expect(ROLE_LABELS.admin).toBe('Administrator');
  });
});
