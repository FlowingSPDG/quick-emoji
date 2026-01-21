import type { Emoji } from '@quick-emoji/shared';
import type { Env } from '../types';

// Emoji data operations
export const getEmojis = async (env: Env, options?: {
  platforms?: string[];
  count?: number;
}): Promise<Emoji[]> => {
  const { platforms, count } = options || {};

  try {
    // Try to get from KV first
    let allEmojis: Emoji[] = [];

    const kvData = await env.EMOJI_DATA.get('emojis');
    if (kvData) {
      allEmojis = JSON.parse(kvData);
    } else {
      // Fallback to processed data file (for development)
      try {
        // @ts-ignore - Node.js specific code for development
        const fs = require('fs');
        // @ts-ignore - Node.js specific code for development
        const path = require('path');
        // @ts-ignore - Node.js specific code for development
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

    // Shuffle and limit (default 10 if not specified)
    const shuffled = filtered.sort(() => Math.random() - 0.5);
    return count ? shuffled.slice(0, count) : shuffled.slice(0, 10);
  } catch (error) {
    console.error('Failed to get emojis:', error);
    return [];
  }
};