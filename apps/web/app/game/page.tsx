'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { Emoji, ServerMessage, Platform } from '@quick-emoji/shared';
import { GameWebSocket } from '../../lib/websocket';
import Loading from '../../components/Loading';

interface GameState {
  currentEmoji: Emoji | null;
  currentQuestion: number;
  totalQuestions: number;
  answer: string;
  feedback: { type: 'correct' | 'incorrect' | null; message: string };
  gameStarted: boolean;
  gameEnded: boolean;
  stats: {
    totalQuestions: number;
    correctAnswers: number;
  } | null;
}

export default function GamePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const roomCode = searchParams.get('roomCode');

  const [gameState, setGameState] = useState<GameState>({
    currentEmoji: null,
    currentQuestion: 0,
    totalQuestions: 0,
    answer: '',
    feedback: { type: null, message: '' },
    gameStarted: false,
    gameEnded: false,
    stats: null,
  });

  const [ws, setWs] = useState<GameWebSocket | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [platforms, setPlatforms] = useState<Platform[]>(['github', 'slack']);

  useEffect(() => {
    if (!roomCode) {
      router.push('/lobby');
      return;
    }

    const connectWebSocket = async () => {
      try {
        const gameWs = new GameWebSocket(roomCode);
        await gameWs.connect();
        setWs(gameWs);

        // メッセージハンドラーを設定
        gameWs.onMessage('joined', (message: ServerMessage) => {
          if (message.type === 'joined') {
            setGameState(prev => ({
              ...prev,
              totalQuestions: message.emojis.length,
              gameStarted: true,
            }));
            setLoading(false);
          }
        });

        gameWs.onMessage('room_created', (message: ServerMessage) => {
          if (message.type === 'room_created') {
            setGameState(prev => ({
              ...prev,
              totalQuestions: message.emojis.length,
              gameStarted: true,
            }));
            setLoading(false);
          }
        });

        gameWs.onMessage('emoji', (message: ServerMessage) => {
          if (message.type === 'emoji') {
            setGameState(prev => ({
              ...prev,
              currentEmoji: message.emoji,
              currentQuestion: prev.currentQuestion + (prev.currentEmoji ? 1 : 0),
              answer: '',
              feedback: { type: null, message: '' },
              gameStarted: true,
            }));
          }
        });

        gameWs.onMessage('answer_result', (message: ServerMessage) => {
          if (message.type === 'answer_result') {
            setGameState(prev => ({
              ...prev,
              feedback: {
                type: message.correct ? 'correct' : 'incorrect',
                message: message.correct
                  ? '正解！'
                  : `不正解。正解: ${message.correctAnswers.join(', ')}`,
              },
            }));
          }
        });

        gameWs.onMessage('game_end', (message: ServerMessage) => {
          if (message.type === 'game_end') {
            setGameState(prev => ({
              ...prev,
              gameEnded: true,
              stats: message.stats,
            }));
            // 結果ページに遷移
            setTimeout(() => {
              router.push(`/result?total=${message.stats.totalQuestions}&correct=${message.stats.correctAnswers}`);
            }, 2000);
          }
        });

        gameWs.onError((err) => {
          setError(err.message);
          setLoading(false);
        });

        // ルームに参加（既にルームが作成されている場合）
        const saved = sessionStorage.getItem('gameWs');
        if (saved) {
          const { roomCode: savedRoomCode } = JSON.parse(saved);
          if (savedRoomCode === roomCode) {
            // 既に参加済みの場合は絵文字を待つだけ
            setLoading(false);
          } else {
            await gameWs.joinRoom(roomCode);
          }
        } else {
          await gameWs.joinRoom(roomCode);
        }

      } catch (err: any) {
        setError(err.message || 'WebSocket接続に失敗しました。');
        setLoading(false);
      }
    };

    connectWebSocket();

    // クリーンアップ
    return () => {
      if (ws) {
        ws.disconnect();
      }
    };
  }, [roomCode, router]);

  // 回答送信
  const handleSubmitAnswer = useCallback(() => {
    if (!ws || !gameState.currentEmoji || !gameState.answer.trim()) return;

    // プラットフォームを取得（最初の選択されたプラットフォームを使用）
    const platform = platforms[0] || 'github';

    ws.sendAnswer(
      gameState.currentEmoji.emoji,
      gameState.answer.trim(),
      platform
    );

    // フィードバック表示後、次の問題へ（サーバーから絵文字メッセージが来るまで待つ）
  }, [ws, gameState.currentEmoji, gameState.answer, platforms]);

  // 回答入力変更
  const handleAnswerChange = (value: string) => {
    setGameState(prev => ({ ...prev, answer: value }));
  };

  // キー入力処理
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.answer.trim() && !gameState.feedback.type) {
      handleSubmitAnswer();
    }
  };

  if (loading) {
    return <Loading message="ゲームを準備しています..." size="large" />;
  }

  if (error) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="error">{error}</div>
        <button className="btn btn-primary" onClick={() => router.push('/lobby')}>
          ロビーに戻る
        </button>
      </div>
    );
  }

  if (!gameState.gameStarted) {
    return <div className="loading">ゲームを開始しています...</div>;
  }

  if (gameState.gameEnded) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ゲーム終了</h1>
        {gameState.stats && (
          <div style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>
            正解数: {gameState.stats.correctAnswers}/{gameState.stats.totalQuestions}
          </div>
        )}
        <p>結果ページに移動しています...</p>
      </div>
    );
  }

  const progress = gameState.totalQuestions > 0
    ? ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100
    : 0;

  return (
    <div className="game-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
        <div>問題 {gameState.currentQuestion + 1}/{gameState.totalQuestions}</div>
        <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>ルーム: {roomCode}</div>
      </div>

      {/* Progress Bar */}
      <div style={{ width: '100%', maxWidth: '600px', height: '8px', backgroundColor: 'var(--border-color)', borderRadius: '4px', overflow: 'hidden' }}>
        <div
          style={{
            width: `${progress}%`,
            height: '100%',
            backgroundColor: 'var(--primary-color)',
            transition: 'width 0.3s ease'
          }}
        />
      </div>

      {/* Emoji Display */}
      <div className="emoji-display">
        {gameState.currentEmoji?.emoji}
      </div>

      {/* Answer Input */}
      <input
        type="text"
        className="answer-input"
        placeholder="shortcodeを入力..."
        value={gameState.answer}
        onChange={(e) => handleAnswerChange(e.target.value)}
        onKeyPress={handleKeyPress}
        autoFocus
        disabled={!!gameState.feedback.type}
      />

      {/* Feedback */}
      {gameState.feedback.type && (
        <div className={`feedback ${gameState.feedback.type}`}>
          {gameState.feedback.message}
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <button
          className="btn btn-primary"
          onClick={handleSubmitAnswer}
          disabled={!gameState.answer.trim() || !!gameState.feedback.type}
        >
          回答
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => router.push('/lobby')}
        >
          終了
        </button>
      </div>
    </div>
  );
}
