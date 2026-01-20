'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { apiClient, handleApiError } from '../../lib/api';
import Loading from '../../components/Loading';

interface ResultData {
  finalScore: number;
  totalQuestions: number;
  correctAnswers: number;
  avgTime: number;
  leaderboardRank: number | null;
}

export default function ResultPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('sessionId');

  const [result, setResult] = useState<ResultData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      router.push('/');
      return;
    }

    const loadResult = async () => {
      try {
        // Note: In a real implementation, you'd fetch result data from the API
        // For now, we'll simulate with some data
        const mockResult: ResultData = {
          finalScore: 850,
          totalQuestions: 10,
          correctAnswers: 8,
          avgTime: 12.5,
          leaderboardRank: 15
        };

        setResult(mockResult);
      } catch (err) {
        setError(handleApiError(err));
      } finally {
        setLoading(false);
      }
    };

    loadResult();
  }, [sessionId, router]);

  if (loading) {
    return <Loading message="結果を読み込み中..." size="large" />;
  }

  if (error || !result) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <div className="error">{error || '結果の読み込みに失敗しました'}</div>
        <Link href="/" className="btn btn-primary">
          ホームに戻る
        </Link>
      </div>
    );
  }

  const accuracy = Math.round((result.correctAnswers / result.totalQuestions) * 100);

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ゲーム結果</h1>

      {/* Final Score */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', marginBottom: '0.5rem' }}>
          {result.finalScore}点
        </div>
        {result.leaderboardRank && (
          <div style={{ fontSize: '1.25rem', color: 'var(--success-color)' }}>
            リーダーボード {result.leaderboardRank}位
          </div>
        )}
      </div>

      {/* Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>統計</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
              {result.correctAnswers}/{result.totalQuestions}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>正解数</div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>正答率</div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--warning-color)' }}>
              {result.avgTime.toFixed(1)}秒
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>平均回答時間</div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--secondary-color)' }}>
              {result.totalQuestions - result.correctAnswers}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>不正解数</div>
          </div>
        </div>
      </div>

      {/* Performance Message */}
      <div style={{ marginBottom: '2rem' }}>
        {accuracy >= 90 && (
          <div style={{ color: 'var(--success-color)', fontWeight: 'bold' }}>
            🎉 素晴らしい成績です！
          </div>
        )}
        {accuracy >= 70 && accuracy < 90 && (
          <div style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
            👍 良い成績です！
          </div>
        )}
        {accuracy >= 50 && accuracy < 70 && (
          <div style={{ color: 'var(--warning-color)', fontWeight: 'bold' }}>
            🤔 もう少し練習してみましょう！
          </div>
        )}
        {accuracy < 50 && (
          <div style={{ color: 'var(--danger-color)', fontWeight: 'bold' }}>
            💪 次は頑張りましょう！
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        <Link href="/settings" className="btn btn-primary">
          もう一度プレイ
        </Link>
        <Link href="/leaderboard" className="btn btn-secondary">
          リーダーボード
        </Link>
        <Link href="/" className="btn btn-secondary">
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}