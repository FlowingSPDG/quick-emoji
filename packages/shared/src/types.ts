// プラットフォームタイプ
export type Platform = "github" | "slack" | "discord" | "unicode";

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

// 回答データ（簡素化）
export interface Answer {
  emoji: string;
  userAnswer: string;
  correctAnswers: string[];
  platform: Platform | null;
  correct: boolean;
}

// 絵文字取得リクエスト
export interface GetEmojisRequest {
  platforms?: Platform[];
  count?: number;
}

// 絵文字取得レスポンス
export interface GetEmojisResponse {
  emojis: Emoji[];
}

// WebSocketメッセージ型

// クライアント→サーバー
export interface JoinRoomMessage {
  type: 'join';
  roomCode: string;
}

export interface AnswerMessage {
  type: 'answer';
  emoji: string;
  answer: string;
  platform: Platform;
}

export interface CreateRoomMessage {
  type: 'create';
  platforms: Platform[];
}

export type ClientMessage = JoinRoomMessage | AnswerMessage | CreateRoomMessage;

// サーバー→クライアント
export interface RoomCreatedMessage {
  type: 'room_created';
  roomCode: string;
  emojis: Emoji[];
}

export interface JoinedMessage {
  type: 'joined';
  emojis: Emoji[];
}

export interface EmojiMessage {
  type: 'emoji';
  emoji: Emoji;
}

export interface AnswerResultMessage {
  type: 'answer_result';
  correct: boolean;
  acceptedPlatform: Platform | null;
  correctAnswers: string[];
}

export interface GameEndMessage {
  type: 'game_end';
  stats: {
    totalQuestions: number;
    correctAnswers: number;
  };
}

export type ServerMessage = RoomCreatedMessage | JoinedMessage | EmojiMessage | AnswerResultMessage | GameEndMessage;
