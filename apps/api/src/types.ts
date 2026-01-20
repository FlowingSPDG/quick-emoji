import type { Hono } from 'hono';

// Cloudflare Workers environment
export interface Env {
  EMOJI_DATA: KVNamespace;
  GAME_SESSIONS: KVNamespace;
  LEADERBOARD: KVNamespace;
}

// Hono context with environment
export type HonoType = Hono<{ Bindings: Env }>;

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