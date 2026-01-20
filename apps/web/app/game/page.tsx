'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Emoji, GameSettings, Answer } from '@quick-emoji/shared';
import { apiClient, handleApiError } from '../../lib/api';
import { gameStorage } from '../../lib/utils';
import Loading from '../../components/Loading';

interface GameState {
  sessionId: string | null;
  currentEmoji: Emoji | null;
  currentQuestion: number;
  totalQuestions: number;
  timeLeft: number;
  score: number;
  answer: string;
  feedback: { type: 'correct' | 'incorrect' | null; message: string };
  gameStarted: boolean;
  gameEnded: boolean;
}

export default function GamePage() {
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    sessionId: null,
    currentEmoji: null,
    currentQuestion: 0,
    totalQuestions: 0,
    timeLeft: 30,
    score: 0,
    answer: '',
    feedback: { type: null, message: '' },
    gameStarted: false,
    gameEnded: false
  });

  const [emojis, setEmojis] = useState<Emoji[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load settings and start game
  useEffect(() => {
    const startGame = async () => {
      const settings = gameStorage.getSettings();
      if (!settings) {
        router.push('/settings');
        return;
      }

      setLoading(true);
      try {
        const response = await apiClient.session.start({ settings });

        setGameState(prev => ({
          ...prev,
          sessionId: response.sessionId,
          totalQuestions: response.emojis.length,
          gameStarted: true
        }));

        setEmojis(response.emojis);
        gameStorage.saveSession({ sessionId: response.sessionId, settings });

      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    startGame();
  }, [router]);

  // Timer effect
  useEffect(() => {
    if (!gameState.gameStarted || gameState.gameEnded || gameState.timeLeft <= 0) return;

    const timer = setInterval(() => {
      setGameState(prev => {
        if (prev.timeLeft <= 1) {
          // Time's up - submit empty answer
          handleSubmitAnswer('');
          return { ...prev, timeLeft: 0 };
        }
        return { ...prev, timeLeft: prev.timeLeft - 1 };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameState.gameStarted, gameState.gameEnded, gameState.timeLeft]);

  // Move to next question
  const nextQuestion = useCallback(() => {
    setGameState(prev => {
      const nextIndex = prev.currentQuestion + 1;
      if (nextIndex >= prev.totalQuestions) {
        // Game ended
        endGame();
        return { ...prev, gameEnded: true };
      }

      return {
        ...prev,
        currentQuestion: nextIndex,
        currentEmoji: emojis[nextIndex],
        timeLeft: 30, // Reset timer
        answer: '',
        feedback: { type: null, message: '' }
      };
    });
  }, [emojis]);

  // Submit answer
  const handleSubmitAnswer = useCallback(async (answerText: string = gameState.answer) => {
    if (!gameState.sessionId || !gameState.currentEmoji) return;

    const timeSpent = 30 - gameState.timeLeft;

    try {
      const response = await apiClient.session.answer({
        sessionId: gameState.sessionId,
        emoji: gameState.currentEmoji.emoji,
        answer: answerText.trim(),
        timeSpent
      });

      setGameState(prev => ({
        ...prev,
        score: response.currentScore,
        feedback: {
          type: response.correct ? 'correct' : 'incorrect',
          message: response.correct
            ? `正解！ (+${response.currentScore - prev.score}点)`
            : `不正解。正解: ${response.correctAnswers.join(', ')}`
        }
      }));

      // Auto-advance after showing feedback
      setTimeout(nextQuestion, 2000);

    } catch (err) {
      setError(handleApiError(err));
    }
  }, [gameState.sessionId, gameState.currentEmoji, gameState.answer, gameState.timeLeft, nextQuestion]);

  // End game
  const endGame = useCallback(async () => {
    if (!gameState.sessionId) return;

    try {
      const response = await apiClient.session.end({ sessionId: gameState.sessionId });
      gameStorage.clearSession();

      // Navigate to results
      router.push(`/result?sessionId=${gameState.sessionId}`);
    } catch (err) {
      setError(handleApiError(err));
    }
  }, [gameState.sessionId, router]);

  // Handle answer input
  const handleAnswerChange = (value: string) => {
    setGameState(prev => ({ ...prev, answer: value }));
  };

  // Handle key press
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && gameState.answer.trim()) {
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
        <button className="btn btn-primary" onClick={() => router.push('/settings')}>
          設定に戻る
        </button>
      </div>
    );
  }

  if (!gameState.gameStarted) {
    return <div className="loading">ゲームを開始しています...</div>;
  }

  const currentEmoji = gameState.currentEmoji || emojis[0];
  const progress = ((gameState.currentQuestion + 1) / gameState.totalQuestions) * 100;

  return (
    <div className="game-container">
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', maxWidth: '600px' }}>
        <div className="score-display">スコア: {gameState.score}</div>
        <div className="timer-display">{gameState.timeLeft}</div>
        <div>問題 {gameState.currentQuestion + 1}/{gameState.totalQuestions}</div>
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
        {currentEmoji?.emoji}
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
          onClick={() => handleSubmitAnswer()}
          disabled={!gameState.answer.trim() || !!gameState.feedback.type}
        >
          回答
        </button>
        <button
          className="btn btn-secondary"
          onClick={() => router.push('/settings')}
        >
          終了
        </button>
      </div>
    </div>
  );
}