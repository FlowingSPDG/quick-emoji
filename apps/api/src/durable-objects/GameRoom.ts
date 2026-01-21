import { checkAnswer } from '../lib/scoring';
import { getEmojis } from '../lib/kv';
import type {
  ClientMessage,
  ServerMessage,
  CreateRoomMessage,
  JoinRoomMessage,
  AnswerMessage,
  Emoji,
  Platform,
} from '@quick-emoji/shared';

export interface Env {
  EMOJI_DATA: KVNamespace;
}

// ゲームルームの状態
interface GameRoomState {
  roomCode: string;
  platforms: Platform[];
  emojis: Emoji[];
  currentEmojiIndex: number;
  answers: Array<{
    emoji: string;
    correct: boolean;
  }>;
  started: boolean;
  ended: boolean;
}

export class GameRoom {
  private state: DurableObjectState;
  private env: Env;
  private sessions: Map<WebSocket, string> = new Map(); // WebSocket -> clientId
  private gameState: GameRoomState | null = null;

  constructor(state: DurableObjectState, env: Env) {
    this.state = state;
    this.env = env;
  }

  async fetch(request: Request): Promise<Response> {
    // WebSocket接続の処理
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.handleSession(server);

      return new Response(null, {
        status: 101,
        webSocket: client,
      });
    }

    return new Response('Expected WebSocket', { status: 400 });
  }

  private handleSession(ws: WebSocket) {
    ws.accept();

    ws.addEventListener('message', async (event) => {
      try {
        const message: ClientMessage = JSON.parse(event.data as string);
        await this.handleMessage(ws, message);
      } catch (error) {
        console.error('Error handling message:', error);
        this.sendError(ws, 'Invalid message format');
      }
    });

    ws.addEventListener('close', () => {
      this.sessions.delete(ws);
    });

    ws.addEventListener('error', () => {
      this.sessions.delete(ws);
    });
  }

  private async handleMessage(ws: WebSocket, message: ClientMessage) {
    switch (message.type) {
      case 'create':
        await this.handleCreateRoom(ws, message);
        break;
      case 'join':
        await this.handleJoinRoom(ws, message);
        break;
      case 'answer':
        await this.handleAnswer(ws, message);
        break;
      default:
        this.sendError(ws, 'Unknown message type');
    }
  }

  private async handleCreateRoom(ws: WebSocket, message: CreateRoomMessage) {
    if (this.gameState) {
      this.sendError(ws, 'Room already exists');
      return;
    }

    // DurableObjectのIDからルームコードを生成（一意性を保証）
    const id = this.state.id.toString();
    // IDから一意のルームコードを生成（6桁）
    const roomCode = this.generateRoomCodeFromId(id);

    // 絵文字を抽選（デフォルト10個）
    const emojis = await getEmojis(this.env, {
      platforms: message.platforms,
      count: 10,
    });

    if (emojis.length === 0) {
      this.sendError(ws, 'No emojis found for the selected platforms');
      return;
    }

    // ゲーム状態を初期化
    this.gameState = {
      roomCode,
      platforms: message.platforms,
      emojis,
      currentEmojiIndex: 0,
      answers: [],
      started: false,
      ended: false,
    };

    // セッションを追加
    this.sessions.set(ws, `client_${Date.now()}`);

    // ルーム作成メッセージを送信
    const response: ServerMessage = {
      type: 'room_created',
      roomCode,
      emojis,
    };
    this.send(ws, response);

    // 最初の絵文字を送信
    if (emojis.length > 0) {
      this.gameState.started = true;
      const emojiMessage: ServerMessage = {
        type: 'emoji',
        emoji: emojis[0],
      };
      this.send(ws, emojiMessage);
    }
  }

  private async handleJoinRoom(ws: WebSocket, message: JoinRoomMessage) {
    if (!this.gameState || this.gameState.roomCode !== message.roomCode) {
      this.sendError(ws, 'Room not found');
      return;
    }

    if (this.gameState.ended) {
      this.sendError(ws, 'Game has already ended');
      return;
    }

    // セッションを追加
    this.sessions.set(ws, `client_${Date.now()}`);

    // 参加メッセージを送信
    const response: ServerMessage = {
      type: 'joined',
      emojis: this.gameState.emojis,
    };
    this.send(ws, response);

    // 現在の絵文字を送信
    if (this.gameState.started && this.gameState.currentEmojiIndex < this.gameState.emojis.length) {
      const emojiMessage: ServerMessage = {
        type: 'emoji',
        emoji: this.gameState.emojis[this.gameState.currentEmojiIndex],
      };
      this.send(ws, emojiMessage);
    }
  }

  private async handleAnswer(ws: WebSocket, message: AnswerMessage) {
    if (!this.gameState || !this.gameState.started || this.gameState.ended) {
      this.sendError(ws, 'Game is not active');
      return;
    }

    const currentEmoji = this.gameState.emojis[this.gameState.currentEmojiIndex];
    if (!currentEmoji || currentEmoji.emoji !== message.emoji) {
      this.sendError(ws, 'Invalid emoji');
      return;
    }

    // 回答をチェック
    const answerResult = checkAnswer(message.answer, currentEmoji, this.gameState.platforms);

    // 回答を記録
    this.gameState.answers.push({
      emoji: message.emoji,
      correct: answerResult.correct || false,
    });

    // 回答結果を送信
    const response: ServerMessage = {
      type: 'answer_result',
      correct: answerResult.correct || false,
      acceptedPlatform: (answerResult.acceptedPlatform as Platform) || null,
      correctAnswers: answerResult.correctAnswers || [],
    };
    this.send(ws, response);

    // 次の絵文字へ進む
    this.gameState.currentEmojiIndex++;

    if (this.gameState.currentEmojiIndex >= this.gameState.emojis.length) {
      // ゲーム終了
      this.gameState.ended = true;
      const correctCount = this.gameState.answers.filter((a) => a.correct).length;

      const endMessage: ServerMessage = {
        type: 'game_end',
        stats: {
          totalQuestions: this.gameState.emojis.length,
          correctAnswers: correctCount,
        },
      };
      this.broadcast(endMessage);
    } else {
      // 次の絵文字を送信
      const emojiMessage: ServerMessage = {
        type: 'emoji',
        emoji: this.gameState.emojis[this.gameState.currentEmojiIndex],
      };
      this.send(ws, emojiMessage);
    }
  }

  private send(ws: WebSocket, message: ServerMessage) {
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private broadcast(message: ServerMessage) {
    for (const ws of this.sessions.keys()) {
      this.send(ws, message);
    }
  }

  private sendError(ws: WebSocket, error: string) {
    // エラーメッセージはServerMessage型に含まれていないので、独自の形式で送信
    // 必要に応じてエラーメッセージ型を追加可能
    if (ws.readyState === WebSocket.READY_STATE_OPEN) {
      ws.send(JSON.stringify({ type: 'error', error }));
    }
  }

  private generateRoomCodeFromId(id: string): string {
    // DurableObjectのIDから一意のルームコードを生成（6桁）
    // IDをハッシュ化して英数字コードに変換
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      hash = ((hash << 5) - hash) + id.charCodeAt(i);
      hash = hash & hash; // Convert to 32bit integer
    }
    hash = Math.abs(hash);
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(hash % chars.length);
      hash = Math.floor(hash / chars.length);
    }
    return code;
  }

  private generateRoomCode(): string {
    // 6桁の英数字コードを生成（フォールバック用）
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }
}
