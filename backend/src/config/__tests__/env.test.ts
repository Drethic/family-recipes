import { describe, it, expect } from 'vitest';
import config from '../env';

describe('Environment Config', () => {
  it('exports a config object', () => {
    expect(config).toBeDefined();
    expect(typeof config).toBe('object');
  });

  it('has required config values', () => {
    expect(config.nodeEnv).toBeDefined();
    expect(config.port).toBeDefined();
    expect(config.databaseUrl).toBeDefined();
    expect(config.jwtSecret).toBeDefined();
    expect(config.jwtRefreshSecret).toBeDefined();
    expect(config.jwtExpiresIn).toBeDefined();
    expect(config.jwtRefreshExpiresIn).toBeDefined();
    expect(config.corsOrigin).toBeDefined();
    expect(config.maxFileSize).toBeDefined();
    expect(config.uploadDir).toBeDefined();
  });

  it('has valid port number', () => {
    expect(config.port).toBeGreaterThan(0);
    expect(config.port).toBeLessThan(65536);
    expect(Number.isInteger(config.port)).toBe(true);
  });

  it('has valid max file size', () => {
    expect(config.maxFileSize).toBeGreaterThan(0);
    expect(Number.isInteger(config.maxFileSize)).toBe(true);
  });

  it('sets test environment correctly', () => {
    expect(config.nodeEnv).toBe('test');
  });

  it('has test JWT secret from setup', () => {
    expect(config.jwtSecret).toBe('test-secret-key-for-testing');
  });
});
