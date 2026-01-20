'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Platform, Difficulty, GameSettings } from '@quick-emoji/shared';
import { PLATFORM_LABELS, DIFFICULTY_LABELS, DEFAULT_SETTINGS } from '@quick-emoji/shared';
import { gameStorage, validatePlatformSelection, validateDifficulty } from '../../lib/utils';
import Loading from '../../components/Loading';

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<GameSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load saved settings on mount
  useEffect(() => {
    const saved = gameStorage.getSettings();
    if (saved) {
      setSettings(saved);
    }
  }, []);

  const handlePlatformChange = (platform: Platform, checked: boolean) => {
    setSettings(prev => ({
      ...prev,
      platforms: checked
        ? [...prev.platforms, platform]
        : prev.platforms.filter(p => p !== platform)
    }));
  };

  const handleDifficultyChange = (difficulty: Difficulty) => {
    setSettings(prev => ({ ...prev, difficulty }));
  };

  const handleQuestionCountChange = (count: number) => {
    setSettings(prev => ({ ...prev, questionCount: count }));
  };

  const handleTimeLimitChange = (time: number) => {
    setSettings(prev => ({ ...prev, timeLimit: time }));
  };

  const handleStartGame = async () => {
    // Validate settings
    if (!validatePlatformSelection(settings.platforms)) {
      setError('少なくとも1つのプラットフォームを選択してください。');
      return;
    }

    if (!validateDifficulty(settings.difficulty)) {
      setError('無効な難易度が選択されています。');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      // Save settings
      gameStorage.saveSettings(settings);

      // Navigate to game page
      router.push('/game');
    } catch (err) {
      setError('設定の保存に失敗しました。');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ゲーム設定</h1>

      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Platform Selection */}
      <div className="form-group">
        <label className="form-label">プラットフォーム</label>
        <p style={{ fontSize: '0.9rem', color: 'var(--text-color)', marginBottom: '1rem' }}>
          絵文字の略称（shortcode）のソースとなるプラットフォームを選択してください。
        </p>
        <div className="checkbox-group">
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map(platform => (
            <label key={platform} className="checkbox-item">
              <input
                type="checkbox"
                checked={settings.platforms.includes(platform)}
                onChange={(e) => handlePlatformChange(platform, e.target.checked)}
              />
              <span>{PLATFORM_LABELS[platform]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Difficulty Selection */}
      <div className="form-group">
        <label className="form-label">難易度</label>
        <div className="radio-group">
          {(Object.keys(DIFFICULTY_LABELS) as Difficulty[]).map(difficulty => (
            <label key={difficulty} className="radio-item">
              <input
                type="radio"
                name="difficulty"
                value={difficulty}
                checked={settings.difficulty === difficulty}
                onChange={(e) => handleDifficultyChange(e.target.value as Difficulty)}
              />
              <span>{DIFFICULTY_LABELS[difficulty]}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Question Count */}
      <div className="form-group">
        <label className="form-label">
          問題数: {settings.questionCount}問
        </label>
        <div className="slider-container">
          <input
            type="range"
            min={DEFAULT_SETTINGS.minQuestionCount}
            max={DEFAULT_SETTINGS.maxQuestionCount}
            value={settings.questionCount}
            onChange={(e) => handleQuestionCountChange(parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-value">
            {DEFAULT_SETTINGS.minQuestionCount} - {DEFAULT_SETTINGS.maxQuestionCount} 問
          </div>
        </div>
      </div>

      {/* Time Limit */}
      <div className="form-group">
        <label className="form-label">
          制限時間: {settings.timeLimit}秒
        </label>
        <div className="slider-container">
          <input
            type="range"
            min={DEFAULT_SETTINGS.minTimeLimit}
            max={DEFAULT_SETTINGS.maxTimeLimit}
            value={settings.timeLimit}
            onChange={(e) => handleTimeLimitChange(parseInt(e.target.value))}
            className="slider"
          />
          <div className="slider-value">
            {DEFAULT_SETTINGS.minTimeLimit} - {DEFAULT_SETTINGS.maxTimeLimit} 秒
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <button
          className="btn btn-primary"
          onClick={handleStartGame}
          disabled={loading}
          style={{ flex: 1, maxWidth: '200px' }}
        >
          {loading ? '読み込み中...' : 'ゲーム開始'}
        </button>
        <Link href="/" className="btn btn-secondary" style={{ flex: 1, maxWidth: '200px' }}>
          戻る
        </Link>
      </div>
    </div>
  );
}