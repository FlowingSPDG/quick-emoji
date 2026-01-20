import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { globalRateLimit } from './lib/rate-limit';

// Routes
import emojisRoute from './routes/emojis';
import sessionRoute from './routes/session';
import leaderboardRoute from './routes/leaderboard';

// Types
import type { HonoType } from './types';

const app = new Hono<HonoType>();

// Middleware
app.use('*', cors({
  origin: ['http://localhost:3000', 'https://*.pages.dev', 'https://quick-emoji.pages.dev'],
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE'],
}));

app.use('*', logger());
app.use('*', globalRateLimit);

// Health check
app.get('/health', (c) => c.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.route('/api/emojis', emojisRoute);
app.route('/api/session', sessionRoute);
app.route('/api/leaderboard', leaderboardRoute);

// Error handling
app.onError((err, c) => {
  console.error(`${err}`);
  return c.json({ error: 'Internal Server Error' }, 500);
});

// 404 handler
app.notFound((c) => {
  return c.json({ error: 'Not Found' }, 404);
});

export default app;