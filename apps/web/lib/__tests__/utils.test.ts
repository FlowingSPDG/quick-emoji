import {
  formatTime,
  calculatePercentage,
  clamp,
  validatePlatformSelection,
  validateDifficulty
} from '../utils';

describe('formatTime', () => {
  it('should format seconds to MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(59)).toBe('00:59');
    expect(formatTime(60)).toBe('01:00');
    expect(formatTime(125)).toBe('02:05');
  });
});

describe('calculatePercentage', () => {
  it('should calculate percentage correctly', () => {
    expect(calculatePercentage(25, 100)).toBe(25);
    expect(calculatePercentage(1, 3)).toBe(33);
    expect(calculatePercentage(0, 100)).toBe(0);
  });

  it('should handle division by zero', () => {
    expect(calculatePercentage(10, 0)).toBe(0);
  });
});

describe('clamp', () => {
  it('should clamp value within range', () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe('validatePlatformSelection', () => {
  it('should validate platform selection', () => {
    expect(validatePlatformSelection(['github', 'slack'])).toBe(true);
    expect(validatePlatformSelection([])).toBe(false);
    expect(validatePlatformSelection(['invalid' as 'github'])).toBe(false);
  });
});

describe('validateDifficulty', () => {
  it('should validate difficulty', () => {
    expect(validateDifficulty('easy')).toBe(true);
    expect(validateDifficulty('medium')).toBe(true);
    expect(validateDifficulty('hard')).toBe(true);
    expect(validateDifficulty('all')).toBe(true);
    expect(validateDifficulty('invalid' as 'easy')).toBe(false);
  });
});