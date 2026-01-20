import { describe, it, expect } from 'vitest';
import {
  validateShortcode,
  validateSessionId,
  validateGameSettings
} from '../validation';

describe('validateShortcode', () => {
  it('should validate correct shortcodes', () => {
    expect(validateShortcode('smile').isValid).toBe(true);
    expect(validateShortcode('test_123').isValid).toBe(true);
    expect(validateShortcode('a').isValid).toBe(true);
  });

  it('should reject invalid shortcodes', () => {
    expect(validateShortcode('').isValid).toBe(false);
    expect(validateShortcode('a'.repeat(51)).isValid).toBe(false); // Too long
    expect(validateShortcode('test!@#').isValid).toBe(false); // Invalid characters
    expect(validateShortcode(undefined as any).isValid).toBe(false);
  });
});

describe('validateSessionId', () => {
  it('should validate correct session IDs', () => {
    expect(validateSessionId('session_1234567890_abc123').isValid).toBe(true);
  });

  it('should reject invalid session IDs', () => {
    expect(validateSessionId('').isValid).toBe(false);
    expect(validateSessionId('invalid_session').isValid).toBe(false);
    expect(validateSessionId('session').isValid).toBe(false);
  });
});

describe('validateGameSettings', () => {
  it('should validate correct settings', () => {
    const settings = {
      platforms: ['github', 'slack'],
      difficulty: 'easy',
      timeLimit: 30,
      questionCount: 10
    };

    expect(validateGameSettings(settings).isValid).toBe(true);
  });

  it('should reject invalid platforms', () => {
    const settings = {
      platforms: [],
      difficulty: 'easy',
      timeLimit: 30,
      questionCount: 10
    };

    expect(validateGameSettings(settings).isValid).toBe(false);
  });

  it('should reject invalid difficulty', () => {
    const settings = {
      platforms: ['github'],
      difficulty: 'invalid',
      timeLimit: 30,
      questionCount: 10
    };

    expect(validateGameSettings(settings).isValid).toBe(false);
  });

  it('should reject invalid time limit', () => {
    const settings = {
      platforms: ['github'],
      difficulty: 'easy',
      timeLimit: 10, // Too low
      questionCount: 10
    };

    expect(validateGameSettings(settings).isValid).toBe(false);
  });

  it('should reject invalid question count', () => {
    const settings = {
      platforms: ['github'],
      difficulty: 'easy',
      timeLimit: 30,
      questionCount: 100 // Too high
    };

    expect(validateGameSettings(settings).isValid).toBe(false);
  });
});