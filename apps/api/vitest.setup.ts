import { beforeEach, vi } from 'vitest';

// Mock Cloudflare Workers environment
const mockKV = {
  get: vi.fn(),
  put: vi.fn(),
  delete: vi.fn(),
};

const mockEnv = {
  EMOJI_DATA: mockKV,
  GAME_SESSIONS: mockKV,
  LEADERBOARD: mockKV,
};

vi.mock('./src/types', () => ({
  mockEnv,
}));

// Global test setup
beforeEach(() => {
  vi.clearAllMocks();
});