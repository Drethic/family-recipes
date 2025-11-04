import { describe, it, expect } from 'vitest';
import { UserRole, RecipeStatus, RecipeDifficulty, ThemePreference } from './index';

describe('types/index', () => {
  describe('UserRole enum', () => {
    it('has GUEST role', () => {
      expect(UserRole.GUEST).toBe('guest');
    });

    it('has MEMBER role', () => {
      expect(UserRole.MEMBER).toBe('member');
    });

    it('has ADMIN role', () => {
      expect(UserRole.ADMIN).toBe('admin');
    });
  });

  describe('RecipeStatus enum', () => {
    it('has DRAFT status', () => {
      expect(RecipeStatus.DRAFT).toBe('draft');
    });

    it('has PENDING status', () => {
      expect(RecipeStatus.PENDING).toBe('pending');
    });

    it('has APPROVED status', () => {
      expect(RecipeStatus.APPROVED).toBe('approved');
    });

    it('has REJECTED status', () => {
      expect(RecipeStatus.REJECTED).toBe('rejected');
    });
  });

  describe('RecipeDifficulty enum', () => {
    it('has EASY difficulty', () => {
      expect(RecipeDifficulty.EASY).toBe('easy');
    });

    it('has MEDIUM difficulty', () => {
      expect(RecipeDifficulty.MEDIUM).toBe('medium');
    });

    it('has HARD difficulty', () => {
      expect(RecipeDifficulty.HARD).toBe('hard');
    });
  });

  describe('ThemePreference enum', () => {
    it('has LIGHT preference', () => {
      expect(ThemePreference.LIGHT).toBe('light');
    });

    it('has DARK preference', () => {
      expect(ThemePreference.DARK).toBe('dark');
    });

    it('has SYSTEM preference', () => {
      expect(ThemePreference.SYSTEM).toBe('system');
    });
  });
});
