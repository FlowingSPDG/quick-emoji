import { Hono } from 'hono';
import { getLeaderboard } from '../lib/kv';
import { checkGlobalRateLimit } from '../lib/validation';
import type { LeaderboardResponse } from '@quick-emoji/shared';
import type { HonoType } from '../types';

const app = new Hono<HonoType>();

// GET /api/leaderboard - Get leaderboard
app.get('/', async (c) => {
  try {
    // Rate limiting
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (!checkGlobalRateLimit(clientIP)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    // Parse query parameters
    const limit = c.req.query('limit') ? parseInt(c.req.query('limit')!) : 50;
    const platform = c.req.query('platform') || undefined;

    // Get leaderboard from KV
    let leaderboard = await getLeaderboard(c.env, limit);

    // Filter by platform if specified
    if (platform) {
      leaderboard = leaderboard.filter(entry =>
        entry.platforms.includes(platform as any)
      );
    }

    const response: LeaderboardResponse = { leaderboard };

    return c.json(response);
  } catch (error) {
    console.error('Failed to get leaderboard:', error);
    return c.json({ error: 'Failed to retrieve leaderboard' }, 500);
  }
});

export default app;