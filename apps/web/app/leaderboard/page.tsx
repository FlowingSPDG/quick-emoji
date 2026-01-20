'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { LeaderboardEntry, Platform } from '@quick-emoji/shared';
import { PLATFORM_LABELS } from '@quick-emoji/shared';
import { apiClient, handleApiError } from '../../lib/api';
import Loading from '../../components/Loading';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPlatform, setSelectedPlatform] = useState<Platform | 'all'>('all');

  const loadLeaderboard = async (platform?: Platform) => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.leaderboard.getLeaderboard(50, platform === 'all' ? undefined : platform);
      setLeaderboard(response.leaderboard);
    } catch (err) {
      setError(handleApiError(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaderboard(selectedPlatform === 'all' ? undefined : selectedPlatform);
  }, [selectedPlatform]);

  const handlePlatformFilter = (platform: Platform | 'all') => {
    setSelectedPlatform(platform);
  };

  const formatTime = (seconds: number): string => {
    return `${seconds.toFixed(1)}秒`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('ja-JP');
  };

  if (loading && leaderboard.length === 0) {
    return <Loading message="リーダーボードを読み込み中..." size="large" />;
  }

  return (
    <div className="card" style={{ maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1 style={{ margin: 0 }}>リーダーボード</h1>
        <Link href="/" className="btn btn-secondary">
          ホームに戻る
        </Link>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Platform Filter */}
      <div style={{ marginBottom: '2rem' }}>
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label className="form-label">プラットフォームでフィルタ</label>
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          <button
            className={`btn ${selectedPlatform === 'all' ? 'btn-primary' : 'btn-secondary'}`}
            onClick={() => handlePlatformFilter('all')}
          >
            すべて
          </button>
          {(Object.keys(PLATFORM_LABELS) as Platform[]).map(platform => (
            <button
              key={platform}
              className={`btn ${selectedPlatform === platform ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => handlePlatformFilter(platform)}
            >
              {PLATFORM_LABELS[platform]}
            </button>
          ))}
        </div>
      </div>

      {/* Leaderboard Table */}
      {leaderboard.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-color)' }}>
          <p>まだスコアがありません。</p>
          <p>最初のプレイヤーになってみましょう！</p>
          <Link href="/settings" className="btn btn-primary" style={{ marginTop: '1rem' }}>
            ゲーム開始
          </Link>
        </div>
      ) : (
        <div className="leaderboard-table-container">
          <table className="leaderboard-table">
            <thead>
              <tr>
                <th>順位</th>
                <th>プレイヤー</th>
                <th>スコア</th>
                <th>平均時間</th>
                <th>プラットフォーム</th>
                <th>日付</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((entry, index) => (
                <tr key={`${entry.userId}-${entry.timestamp}`}>
                  <td>
                    <div className="leaderboard-rank">
                      {index + 1}
                    </div>
                  </td>
                  <td style={{ fontWeight: '500' }}>
                    {entry.username}
                  </td>
                  <td style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                    {entry.score.toLocaleString()}点
                  </td>
                  <td>
                    {formatTime(entry.avgTime)}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '0.25rem', flexWrap: 'wrap' }}>
                      {entry.platforms.map(platform => (
                        <span
                          key={platform}
                          style={{
                            fontSize: '0.8rem',
                            padding: '0.25rem 0.5rem',
                            backgroundColor: 'var(--border-color)',
                            borderRadius: '4px',
                            color: 'var(--text-color)'
                          }}
                        >
                          {PLATFORM_LABELS[platform]}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>
                    {formatDate(entry.timestamp)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Stats Summary */}
      {leaderboard.length > 0 && (
        <div style={{ marginTop: '2rem', padding: '1.5rem', backgroundColor: 'var(--bg-color)', border: '1px solid var(--border-color)', borderRadius: '8px' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.25rem' }}>統計情報</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {leaderboard[0]?.score.toLocaleString() || 0}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>最高スコア</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
                {leaderboard.length}
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>総プレイ回数</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
                {leaderboard.length > 0 ? (leaderboard.reduce((sum, entry) => sum + entry.avgTime, 0) / leaderboard.length).toFixed(1) : 0}秒
              </div>
              <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>平均回答時間</div>
            </div>
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', marginTop: '2rem' }}>
        <Link href="/settings" className="btn btn-primary">
          チャレンジする
        </Link>
        <button
          className="btn btn-secondary"
          onClick={() => loadLeaderboard(selectedPlatform === 'all' ? undefined : selectedPlatform)}
          disabled={loading}
        >
          {loading ? '更新中...' : '更新'}
        </button>
      </div>
    </div>
  );
}