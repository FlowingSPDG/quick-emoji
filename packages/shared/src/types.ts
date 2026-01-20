// プラットフォームタイプ
export type Platform = "github" | "slack" | "discord" | "unicode";

// 難易度タイプ
export type Difficulty = "easy" | "medium" | "hard" | "all";

// 難易度レベル（数値）
export type DifficultyLevel = 1 | 2 | 3;

// 絵文字データ構造
export interface Emoji {
  emoji: string;
  platforms: {
    [key in Platform]?: string[];
  };
  category: string;
  difficulty: DifficultyLevel;
}

// ゲーム設定
export interface GameSettings {
  platforms: Platform[];
  difficulty: Difficulty;
  timeLimit: number; // 秒
  questionCount: number;
}

// 回答データ
export interface Answer {
  emoji: string;
  userAnswer: string;
  correctAnswers: string[];
  platform: Platform;
  timeSpent: number;
  correct: boolean;
}

// ゲームセッション
export interface GameSession {
  sessionId: string;
  userId: string;
  settings: GameSettings;
  score: number;
  answers: Answer[];
  startTime: string;
  endTime: string | null;
}

// セッション開始リクエスト
export interface StartSessionRequest {
  settings: GameSettings;
}

// セッション開始レスポンス
export interface StartSessionResponse {
  sessionId: string;
  emojis: Emoji[];
}

// 回答リクエスト
export interface AnswerRequest {
  sessionId: string;
  emoji: string;
  answer: string;
  timeSpent: number;
}

// 回答レスポンス
export interface AnswerResponse {
  correct: boolean;
  acceptedPlatform: Platform | null;
  correctAnswers: string[];
  currentScore: number;
}

// セッション終了リクエスト
export interface EndSessionRequest {
  sessionId: string;
}

// セッション終了レスポンス
export interface EndSessionResponse {
  finalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  avgTime: number;
  leaderboardRank: number | null;
}

// リーダーボードエントリ
export interface LeaderboardEntry {
  userId: string;
  username: string;
  score: number;
  avgTime: number;
  platforms: Platform[];
  timestamp: string;
}

// リーダーボードレスポンス
export interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
}

// 絵文字取得リクエスト
export interface GetEmojisRequest {
  platforms?: Platform[];
  difficulty?: Difficulty;
  count?: number;
}

// 絵文字取得レスポンス
export interface GetEmojisResponse {
  emojis: Emoji[];
}
