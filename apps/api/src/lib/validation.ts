import type { ValidationResult } from '../types';
import { SHORTCODE, RATE_LIMITS } from '@quick-emoji/shared';

// Validate shortcode input
export const validateShortcode = (shortcode: string): ValidationResult => {
  const errors: string[] = [];

  if (!shortcode || typeof shortcode !== 'string') {
    errors.push('Shortcode is required');
  } else {
    if (shortcode.length < SHORTCODE.MIN_LENGTH) {
      errors.push(`Shortcode must be at least ${SHORTCODE.MIN_LENGTH} characters`);
    }
    if (shortcode.length > SHORTCODE.MAX_LENGTH) {
      errors.push(`Shortcode must be at most ${SHORTCODE.MAX_LENGTH} characters`);
    }
    if (!SHORTCODE.PATTERN.test(shortcode)) {
      errors.push('Shortcode can only contain letters, numbers, and underscores');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate session ID
export const validateSessionId = (sessionId: string): ValidationResult => {
  const errors: string[] = [];

  if (!sessionId || typeof sessionId !== 'string') {
    errors.push('Session ID is required');
  } else if (!sessionId.startsWith('session_')) {
    errors.push('Invalid session ID format');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validate game settings
export const validateGameSettings = (settings: any): ValidationResult => {
  const errors: string[] = [];

  if (!settings || typeof settings !== 'object') {
    errors.push('Game settings are required');
    return { isValid: false, errors };
  }

  const { platforms, difficulty, timeLimit, questionCount } = settings;

  // Validate platforms
  if (!Array.isArray(platforms) || platforms.length === 0) {
    errors.push('At least one platform must be selected');
  } else {
    const validPlatforms = ['github', 'slack', 'discord', 'unicode'];
    const invalidPlatforms = platforms.filter(p => !validPlatforms.includes(p));
    if (invalidPlatforms.length > 0) {
      errors.push(`Invalid platforms: ${invalidPlatforms.join(', ')}`);
    }
  }

  // Validate difficulty
  const validDifficulties = ['easy', 'medium', 'hard', 'all'];
  if (!difficulty || !validDifficulties.includes(difficulty)) {
    errors.push('Invalid difficulty level');
  }

  // Validate time limit
  if (typeof timeLimit !== 'number' || timeLimit < 15 || timeLimit > 60) {
    errors.push('Time limit must be between 15 and 60 seconds');
  }

  // Validate question count
  if (typeof questionCount !== 'number' || questionCount < 5 || questionCount > 50) {
    errors.push('Question count must be between 5 and 50');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Rate limiting helpers
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

export const checkRateLimit = (key: string, maxRequests: number, windowMs: number): boolean => {
  const now = Date.now();
  const windowKey = `${key}_${Math.floor(now / windowMs)}`;

  const current = rateLimitStore.get(windowKey) || { count: 0, resetTime: now + windowMs };

  if (now > current.resetTime) {
    rateLimitStore.set(windowKey, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= maxRequests) {
    return false;
  }

  current.count++;
  rateLimitStore.set(windowKey, current);
  return true;
};

export const checkAnswerRateLimit = (sessionId: string): boolean => {
  return checkRateLimit(`answer_${sessionId}`, RATE_LIMITS.SESSION_ANSWERS_PER_SECOND, 1000);
};

export const checkGlobalRateLimit = (ip: string): boolean => {
  return checkRateLimit(`ip_${ip}`, RATE_LIMITS.IP_REQUESTS_PER_MINUTE, 60000);
};