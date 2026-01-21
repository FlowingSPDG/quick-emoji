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