import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatFullName, getTotalTime } from './formatters';

describe('formatters', () => {
  describe('formatDate', () => {
    it('formats ISO date string to readable format', () => {
      const date = '2024-01-15T12:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toBe('January 15, 2024');
    });

    it('formats another date correctly', () => {
      const date = '2024-12-25T12:00:00Z';
      const formatted = formatDate(date);
      expect(formatted).toBe('December 25, 2024');
    });
  });

  describe('formatTime', () => {
    it('formats time in minutes to hours and minutes', () => {
      expect(formatTime(90)).toBe('1 hr 30 min');
    });

    it('formats time less than an hour', () => {
      expect(formatTime(45)).toBe('45 min');
    });

    it('formats time exactly one hour', () => {
      expect(formatTime(60)).toBe('1 hr');
    });

    it('formats zero time', () => {
      expect(formatTime(0)).toBe('0 min');
    });

    it('formats large times', () => {
      expect(formatTime(150)).toBe('2 hr 30 min');
    });

    it('formats 2 hours exactly', () => {
      expect(formatTime(120)).toBe('2 hr');
    });
  });

  describe('formatFullName', () => {
    it('concatenates first and last name', () => {
      expect(formatFullName('John', 'Doe')).toBe('John Doe');
    });

    it('handles single character names', () => {
      expect(formatFullName('A', 'B')).toBe('A B');
    });

    it('handles empty strings', () => {
      expect(formatFullName('', '')).toBe(' ');
    });
  });

  describe('getTotalTime', () => {
    it('adds prep and cook time', () => {
      expect(getTotalTime(20, 40)).toBe(60);
    });

    it('handles zero values', () => {
      expect(getTotalTime(0, 30)).toBe(30);
      expect(getTotalTime(15, 0)).toBe(15);
    });

    it('handles both zero', () => {
      expect(getTotalTime(0, 0)).toBe(0);
    });
  });
});
