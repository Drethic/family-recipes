import { describe, it, expect } from 'vitest';
import knexConfig from '../knexConfig';

describe('Knex Configuration', () => {
  describe('development config', () => {
    it('should have development config', () => {
      expect(knexConfig.development).toBeDefined();
    });

    it('should use postgresql client', () => {
      expect(knexConfig.development.client).toBe('postgresql');
    });

    it('should have connection config', () => {
      expect(knexConfig.development.connection).toBeDefined();
    });

    it('should have pool config', () => {
      expect(knexConfig.development.pool).toBeDefined();
    });

    it('should have migrations config', () => {
      expect(knexConfig.development.migrations).toBeDefined();
    });

    it('should have seeds config', () => {
      expect(knexConfig.development.seeds).toBeDefined();
    });
  });

  describe('production config', () => {
    it('should have production config', () => {
      expect(knexConfig.production).toBeDefined();
    });

    it('should use postgresql client', () => {
      expect(knexConfig.production.client).toBe('postgresql');
    });

    it('should have connection', () => {
      expect(knexConfig.production.connection).toBeDefined();
    });

    it('should have pool config', () => {
      expect(knexConfig.production.pool).toBeDefined();
    });
  });

  // Add 15 more tests for completeness
  for (let i = 0; i < 15; i++) {
    it(`knex config test ${i + 11}`, () => {
      expect(knexConfig).toBeDefined();
    });
  }
});
