import { describe, it, expect } from 'vitest';
import {
  calculateAnswerScore,
  calculateSessionScore,
  calculateSessionStats,
  checkAnswer
} from '../scoring';
import type { Answer } from '@quick-emoji/shared';

describe('calculateAnswerScore', () => {
  it('should calculate score with time bonus', () => {
    const score = calculateAnswerScore(10, 30, 1); // 20 seconds left, easy difficulty
    expect(score).toBe(25); // 10 (base) + 10 (time bonus: 20*0.5) + 5 (difficulty bonus: 1*5)
  });

  it('should calculate score with difficulty bonus', () => {
    const score = calculateAnswerScore(25, 30, 3); // 5 seconds left, hard difficulty
    expect(score).toBe(28); // 10 (base) + 2.5 (time bonus: 5*0.5, rounded to 3) + 15 (difficulty bonus: 3*5)
  });

  it('should not give negative time bonus', () => {
    const score = calculateAnswerScore(35, 30, 1); // 5 seconds over, easy difficulty
    expect(score).toBe(15); // 10 (base) + 0 (time bonus) + 5 (difficulty bonus: 1*5)
  });
});

describe('calculateSessionScore', () => {
  it('should sum all correct answer scores', () => {
    const answers: Answer[] = [
      {
        emoji: '😀',
        userAnswer: 'grinning',
        correctAnswers: ['grinning'],
        platform: 'github',
        timeSpent: 10,
        correct: true
      },
      {
        emoji: '😂',
        userAnswer: 'joy',
        correctAnswers: ['joy'],
        platform: 'github',
        timeSpent: 15,
        correct: true
      },
      {
        emoji: '😢',
        userAnswer: 'wrong',
        correctAnswers: ['cry'],
        platform: 'github',
        timeSpent: 20,
        correct: false
      }
    ];

    const totalScore = calculateSessionScore(answers);
    // First answer: 10 (timeSpent) + 30 (timeLimit) + 2 (difficulty: emoji exists) = 10 + (30-10)*0.5 + 2*5 = 10 + 10 + 10 = 30
    // Second answer: 15 (timeSpent) + 30 (timeLimit) + 2 (difficulty: emoji exists) = 10 + (30-15)*0.5 + 2*5 = 10 + 7.5 + 10 = 28
    // Third answer: incorrect, so 0
    expect(totalScore).toBe(58); // 30 + 28 + 0
  });
});

describe('calculateSessionStats', () => {
  it('should calculate session statistics', () => {
    const answers: Answer[] = [
      {
        emoji: '😀',
        userAnswer: 'grinning',
        correctAnswers: ['grinning'],
        platform: 'github',
        timeSpent: 10,
        correct: true
      },
      {
        emoji: '😂',
        userAnswer: 'joy',
        correctAnswers: ['joy'],
        platform: 'github',
        timeSpent: 15,
        correct: true
      }
    ];

    const stats = calculateSessionStats(answers);

    expect(stats.totalQuestions).toBe(2);
    expect(stats.correctAnswers).toBe(2);
    expect(stats.accuracy).toBe(100);
    expect(stats.avgTime).toBe(12.5);
    expect(stats.totalTime).toBe(25);
  });
});

describe('checkAnswer', () => {
  const mockEmoji = {
    emoji: '😀',
    platforms: {
      github: ['grinning', 'smile'],
      slack: ['smile'],
      discord: ['grinning']
    }
  };

  it('should return correct for valid answer', () => {
    const result = checkAnswer('grinning', mockEmoji, ['github']);
    expect(result.correct).toBe(true);
    expect(result.acceptedPlatform).toBe('github');
  });

  it('should return incorrect for invalid answer', () => {
    const result = checkAnswer('wrong', mockEmoji, ['github']);
    expect(result.correct).toBe(false);
    expect(result.correctAnswers).toEqual(['grinning', 'smile']);
  });

  it('should work across multiple platforms', () => {
    const result = checkAnswer('smile', mockEmoji, ['github', 'slack']);
    expect(result.correct).toBe(true);
    expect(result.acceptedPlatform).toBe('github'); // First matching platform
  });
});