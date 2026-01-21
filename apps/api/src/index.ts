import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { globalRateLimit } from './lib/rate-limit';

// Routes
import emojisRoute from './routes/emojis';

// Types
import type { HonoType } from './types';
import { GameRoom } from './durable-objects/GameRoom';

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

// WebSocket endpoint
app.get('/ws/:roomCode?', async (c) => {
  const roomCode = c.req.param('roomCode') || 'temp';

  // Get or create DurableObject instance for the room
  // For new rooms, use a temporary ID and the room code will be generated inside GameRoom
  const id = c.env.GAME_ROOM.idFromName(roomCode);
  const stub = c.env.GAME_ROOM.get(id);

  // Forward WebSocket upgrade request to DurableObject
  return stub.fetch(c.req.raw);
});

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
export { GameRoom };