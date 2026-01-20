import type { Answer, GameSession, LeaderboardEntry } from '@quick-emoji/shared';
import { SCORING } from '@quick-emoji/shared';

// Calculate score for a single answer
export const calculateAnswerScore = (
  timeSpent: number,
  timeLimit: number,
  difficulty: number
): number => {
  const baseScore = SCORING.BASE_SCORE;
  const remainingTime = Math.max(0, timeLimit - timeSpent);
  const timeBonus = remainingTime * SCORING.TIME_BONUS_MULTIPLIER;
  const difficultyBonus = difficulty * SCORING.DIFFICULTY_BONUS_MULTIPLIER;

  return Math.round(baseScore + timeBonus + difficultyBonus);
};

// Calculate final session score
export const calculateSessionScore = (answers: Answer[]): number => {
  return answers.reduce((total, answer) => {
    if (answer.correct) {
      return total + calculateAnswerScore(
        answer.timeSpent,
        30, // Default time limit, could be made configurable
        answer.emoji ? 2 : 1 // Default difficulty
      );
    }
    return total;
  }, 0);
};

// Calculate session statistics
export const calculateSessionStats = (answers: Answer[]) => {
  const totalQuestions = answers.length;
  const correctAnswers = answers.filter(a => a.correct).length;
  const totalTime = answers.reduce((sum, a) => sum + a.timeSpent, 0);
  const avgTime = totalTime / totalQuestions;

  return {
    totalQuestions,
    correctAnswers,
    accuracy: totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0,
    avgTime: Math.round(avgTime * 100) / 100, // Round to 2 decimal places
    totalTime: Math.round(totalTime * 100) / 100
  };
};

// Check if answer is correct for any platform
export const checkAnswer = (
  userAnswer: string,
  emoji: any,
  platforms: string[]
): { correct: boolean; acceptedPlatform?: string; correctAnswers?: string[] } => {
  const normalizedAnswer = userAnswer.toLowerCase().trim();

  for (const platform of platforms) {
    const platformAnswers = emoji.platforms[platform];
    if (platformAnswers && Array.isArray(platformAnswers)) {
      const normalizedCorrect = platformAnswers.map(ans => ans.toLowerCase().trim());
      if (normalizedCorrect.includes(normalizedAnswer)) {
        return {
          correct: true,
          acceptedPlatform: platform,
          correctAnswers: platformAnswers
        };
      }
    }
  }

  // If no exact match, return all possible correct answers for feedback
  const allCorrectAnswers: string[] = [];
  for (const platform of platforms) {
    const platformAnswers = emoji.platforms[platform];
    if (platformAnswers && Array.isArray(platformAnswers)) {
      allCorrectAnswers.push(...platformAnswers);
    }
  }

  return {
    correct: false,
    correctAnswers: [...new Set(allCorrectAnswers)] // Remove duplicates
  };
};

// Create leaderboard entry from session
export const createLeaderboardEntry = (
  session: GameSession,
  userId: string,
  username?: string
): LeaderboardEntry => {
  const stats = calculateSessionStats(session.answers);

  return {
    userId,
    username: username || `Player_${userId.slice(-6)}`,
    score: session.score,
    avgTime: stats.avgTime,
    platforms: session.settings.platforms,
    timestamp: new Date().toISOString()
  };
};

// Get leaderboard rank for a score
export const getLeaderboardRank = async (
  score: number,
  getLeaderboardFn: () => Promise<LeaderboardEntry[]>
): Promise<number | null> => {
  try {
    const leaderboard = await getLeaderboardFn();
    const rank = leaderboard.findIndex(entry => entry.score <= score) + 1;
    return rank > 0 ? rank : leaderboard.length + 1;
  } catch (error) {
    console.error('Failed to calculate leaderboard rank:', error);
    return null;
  }
};