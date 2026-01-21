'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Suspense } from 'react';

function ResultContent() {
  const searchParams = useSearchParams();
  const total = parseInt(searchParams.get('total') || '0');
  const correct = parseInt(searchParams.get('correct') || '0');

  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0;

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ゲーム結果</h1>

      {/* Statistics */}
      <div style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', textAlign: 'left' }}>
          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--success-color)' }}>
              {correct}/{total}
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>正解数</div>
          </div>

          <div className="card" style={{ padding: '1rem', textAlign: 'center' }}>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--primary-color)' }}>
              {accuracy}%
            </div>
            <div style={{ fontSize: '0.9rem', color: 'var(--text-color)' }}>正答率</div>
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
        <Link href="/lobby" className="btn btn-primary">
          もう一度プレイ
        </Link>
        <Link href="/" className="btn btn-secondary">
          ホームに戻る
        </Link>
      </div>
    </div>
  );
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="loading">結果を読み込み中...</div>}>
      <ResultContent />
    </Suspense>
  );
}
