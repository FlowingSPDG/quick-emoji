import type { Emoji, GameSession, LeaderboardEntry } from '@quick-emoji/shared';
import type { Env } from '../types';

// Emoji data operations
export const getEmojis = async (env: Env, options?: {
  platforms?: string[];
  difficulty?: string;
  count?: number;
}): Promise<Emoji[]> => {
  const { platforms, difficulty, count } = options || {};

  try {
    // Try to get from KV first
    let allEmojis: Emoji[] = [];

    const kvData = await env.EMOJI_DATA.get('emojis');
    if (kvData) {
      allEmojis = JSON.parse(kvData);
    } else {
      // Fallback to processed data file (for development)
      try {
        const fs = require('fs');
        const path = require('path');
        const dataPath = path.join(__dirname, '../data/emojis-processed.json');
        const fileData = fs.readFileSync(dataPath, 'utf-8');
        const processed = JSON.parse(fileData);
        allEmojis = processed.emojis;
        console.log('Loaded emoji data from file (development mode)');
      } catch (fileError) {
        console.error('Failed to load emoji data from file:', fileError);
        return [];
      }
    }

    let filtered = allEmojis;

    // Filter by platforms
    if (platforms && platforms.length > 0) {
      filtered = filtered.filter(emoji =>
        platforms.some(platform =>
          emoji.platforms[platform as keyof typeof emoji.platforms]
        )
      );
    }

    // Filter by difficulty
    if (difficulty && difficulty !== 'all') {
      if (difficulty === 'easy') {
        filtered = filtered.filter(emoji => emoji.difficulty === 1);
      } else if (difficulty === 'medium') {
        filtered = filtered.filter(emoji => emoji.difficulty === 2);
      } else if (difficulty === 'hard') {
        filtered = filtered.filter(emoji => emoji.difficulty === 3);
      }
    }

    // Shuffle and limit
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return count ? shuffled.slice(0, count) : shuffled;
  } catch (error) {
    console.error('Failed to get emojis:', error);
    return [];
  }
};

// Session operations
export const saveSession = async (env: Env, session: GameSession): Promise<void> => {
  try {
    await env.GAME_SESSIONS.put(
      `session:${session.sessionId}`,
      JSON.stringify(session),
      { expirationTtl: 3600 } // 1 hour TTL
    );
  } catch (error) {
    console.error('Failed to save session:', error);
    throw new Error('Failed to save game session');
  }
};

export const getSession = async (env: Env, sessionId: string): Promise<GameSession | null> => {
  try {
    const data = await env.GAME_SESSIONS.get(`session:${sessionId}`);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

export const deleteSession = async (env: Env, sessionId: string): Promise<void> => {
  try {
    await env.GAME_SESSIONS.delete(`session:${sessionId}`);
  } catch (error) {
    console.error('Failed to delete session:', error);
  }
};

// Leaderboard operations
export const getLeaderboard = async (env: Env, limit = 100): Promise<LeaderboardEntry[]> => {
  try {
    const data = await env.LEADERBOARD.get('leaderboard');
    if (!data) return [];

    const leaderboard: LeaderboardEntry[] = JSON.parse(data);
    return leaderboard
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return [];
  }
};

export const saveLeaderboardEntry = async (env: Env, entry: LeaderboardEntry): Promise<void> => {
  try {
    const currentLeaderboard = await getLeaderboard(env, 1000); // Get more entries to properly rank
    const newLeaderboard = [...currentLeaderboard, entry]
      .sort((a, b) => b.score - a.score)
      .slice(0, 1000); // Keep top 1000

    await env.LEADERBOARD.put('leaderboard', JSON.stringify(newLeaderboard));
  } catch (error) {
    console.error('Failed to save leaderboard entry:', error);
    throw new Error('Failed to save leaderboard entry');
  }
};

// User ID generation
export const generateUserId = (): string => {
  return `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

// Session ID generation
export const generateSessionId = (): string => {
  return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};