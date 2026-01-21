import type {
  ClientMessage,
  ServerMessage,
  CreateRoomMessage,
  JoinRoomMessage,
  AnswerMessage,
} from '@quick-emoji/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787';

export class WebSocketError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'WebSocketError';
  }
}

export class GameWebSocket {
  private ws: WebSocket | null = null;
  private url: string;
  private messageHandlers: Map<string, Set<(message: ServerMessage) => void>> = new Map();
  private errorHandlers: Set<(error: Error) => void> = new Set();
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectDelay = 1000;

  constructor(roomCode?: string) {
    // WebSocket URLを構築
    const protocol = API_BASE_URL.startsWith('https') ? 'wss' : 'ws';
    const baseUrl = API_BASE_URL.replace(/^https?:\/\//, '');
    // roomCodeがない場合は空文字列で接続（ルーム作成時）
    this.url = roomCode
      ? `${protocol}://${baseUrl}/ws/${roomCode}`
      : `${protocol}://${baseUrl}/ws/temp`;
  }

  connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url);

        this.ws.onopen = () => {
          console.log('WebSocket connected');
          this.reconnectAttempts = 0;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const message: ServerMessage = JSON.parse(event.data);
            this.handleMessage(message);
          } catch (error) {
            console.error('Error parsing message:', error);
            this.handleError(new WebSocketError('Invalid message format'));
          }
        };

        this.ws.onerror = (error) => {
          console.error('WebSocket error:', error);
          this.handleError(new WebSocketError('WebSocket connection error'));
          reject(new WebSocketError('WebSocket connection failed'));
        };

        this.ws.onclose = () => {
          console.log('WebSocket closed');
          this.ws = null;

          // 自動再接続（エラーによる切断の場合）
          if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
              console.log(`Reconnecting... (attempt ${this.reconnectAttempts})`);
              this.connect().catch(() => {
                // 再接続失敗時はエラーハンドラーに通知
                this.handleError(new WebSocketError('Failed to reconnect'));
              });
            }, this.reconnectDelay * this.reconnectAttempts);
          } else {
            this.handleError(new WebSocketError('Max reconnection attempts reached'));
          }
        };
      } catch (error) {
        reject(new WebSocketError(`Failed to create WebSocket: ${error}`));
      }
    });
  }

  private handleMessage(message: ServerMessage) {
    const handlers = this.messageHandlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }

  private handleError(error: Error) {
    this.errorHandlers.forEach((handler) => handler(error));
  }

  onMessage(type: ServerMessage['type'], handler: (message: ServerMessage) => void) {
    if (!this.messageHandlers.has(type)) {
      this.messageHandlers.set(type, new Set());
    }
    this.messageHandlers.get(type)!.add(handler);
  }

  offMessage(type: ServerMessage['type'], handler: (message: ServerMessage) => void) {
    const handlers = this.messageHandlers.get(type);
    if (handlers) {
      handlers.delete(handler);
    }
  }

  onError(handler: (error: Error) => void) {
    this.errorHandlers.add(handler);
  }

  offError(handler: (error: Error) => void) {
    this.errorHandlers.delete(handler);
  }

  send(message: ClientMessage) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new WebSocketError('WebSocket is not connected');
    }
    this.ws.send(JSON.stringify(message));
  }

  createRoom(platforms: string[]): Promise<void> {
    return new Promise((resolve, reject) => {
      const message: CreateRoomMessage = {
        type: 'create',
        platforms: platforms as any,
      };

      // ルーム作成完了を待つ
      const handler = (msg: ServerMessage) => {
        if (msg.type === 'room_created') {
          this.offMessage('room_created', handler);
          resolve();
        }
      };

      this.onMessage('room_created', handler);

      // エラーハンドラーを一時的に追加
      const errorHandler = (error: Error) => {
        this.offError(errorHandler);
        this.offMessage('room_created', handler);
        reject(error);
      };
      this.onError(errorHandler);

      try {
        this.send(message);
      } catch (error) {
        this.offMessage('room_created', handler);
        this.offError(errorHandler);
        reject(error);
      }
    });
  }

  joinRoom(roomCode: string): Promise<void> {
    return new Promise((resolve, reject) => {
      const message: JoinRoomMessage = {
        type: 'join',
        roomCode,
      };

      // 参加完了を待つ
      const handler = (msg: ServerMessage) => {
        if (msg.type === 'joined') {
          this.offMessage('joined', handler);
          resolve();
        }
      };

      this.onMessage('joined', handler);

      // エラーハンドラーを一時的に追加
      const errorHandler = (error: Error) => {
        this.offError(errorHandler);
        this.offMessage('joined', handler);
        reject(error);
      };
      this.onError(errorHandler);

      try {
        this.send(message);
      } catch (error) {
        this.offMessage('joined', handler);
        this.offError(errorHandler);
        reject(error);
      }
    });
  }

  sendAnswer(emoji: string, answer: string, platform: string) {
    const message: AnswerMessage = {
      type: 'answer',
      emoji,
      answer,
      platform: platform as any,
    };
    this.send(message);
  }

  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    this.messageHandlers.clear();
    this.errorHandlers.clear();
    this.reconnectAttempts = 0;
  }

  get readyState(): number {
    return this.ws?.readyState ?? WebSocket.CLOSED;
  }

  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }
}
