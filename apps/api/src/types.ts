import type { Hono } from 'hono';
import type { GameRoom } from './durable-objects/GameRoom';

// Cloudflare Workers environment
export interface Env {
  EMOJI_DATA: KVNamespace;
  GAME_ROOM: DurableObjectNamespace<GameRoom>;
}

// Hono context with environment
export type HonoType = { Bindings: Env };

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

// Validation helpers
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}