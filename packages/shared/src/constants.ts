import type { Platform } from "./types";

// プラットフォーム名の表示ラベル
export const PLATFORM_LABELS: Record<Platform, string> = {
  github: "GitHub",
  slack: "Slack",
  discord: "Discord",
  unicode: "Unicode Official",
};

// 難易度の表示ラベル
export const DIFFICULTY_LABELS: Record<string, string> = {
  easy: "Easy",
  medium: "Medium",
  hard: "Hard",
  all: "All",
};

// 難易度の数値マッピング
export const DIFFICULTY_VALUES = {
  easy: 1 as const,
  medium: 2 as const,
  hard: 3 as const,
};

// デフォルト設定
export const DEFAULT_SETTINGS = {
  platforms: ["github", "slack"] as Platform[],
  difficulty: "all" as const,
  timeLimit: 30,
  questionCount: 10,
  minQuestionCount: 5,
  maxQuestionCount: 50,
  minTimeLimit: 15,
  maxTimeLimit: 60,
};

// スコアリング定数
export const SCORING = {
  BASE_SCORE: 10,
  TIME_BONUS_MULTIPLIER: 0.5,
  DIFFICULTY_BONUS_MULTIPLIER: 5,
};

// セッションTTL（1時間）
export const SESSION_TTL = 3600;

// レート制限
export const RATE_LIMITS = {
  IP_REQUESTS_PER_MINUTE: 100,
  SESSION_ANSWERS_PER_SECOND: 1,
};

// Shortcodeのバリデーション
export const SHORTCODE = {
  MIN_LENGTH: 1,
  MAX_LENGTH: 50,
  PATTERN: /^[a-zA-Z0-9_]+$/,
};
