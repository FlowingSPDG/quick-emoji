import { Hono } from 'hono';
import { getEmojis } from '../lib/kv';
import { checkGlobalRateLimit } from '../lib/validation';
import type { GetEmojisRequest, GetEmojisResponse, Platform } from '@quick-emoji/shared';
import type { HonoType } from '../types';

const app = new Hono<HonoType>();

// GET /api/emojis - Get emojis with optional filtering
app.get('/', async (c) => {
  try {
    // Rate limiting
    const clientIP = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
    if (!checkGlobalRateLimit(clientIP)) {
      return c.json({ error: 'Rate limit exceeded' }, 429);
    }

    // Parse query parameters
    const platformsParam = c.req.query('platforms')?.split(',');
    const platforms: Platform[] | undefined = platformsParam?.filter((p): p is Platform => 
      ['github', 'slack', 'discord', 'unicode'].includes(p as Platform)
    );
    const count = c.req.query('count') ? parseInt(c.req.query('count')!) : undefined;

    const request: GetEmojisRequest = {
      platforms,
      count
    };

    // Get emojis from KV
    const emojis = await getEmojis(c.env, request);

    const response: GetEmojisResponse = { emojis };

    return c.json(response);
  } catch (error) {
    console.error('Failed to get emojis:', error);
    return c.json({ error: 'Failed to retrieve emojis' }, 500);
  }
});

export default app;