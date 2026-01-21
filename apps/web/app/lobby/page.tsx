'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Platform } from '@quick-emoji/shared';
import { PLATFORM_LABELS } from '@quick-emoji/shared';
import { GameWebSocket } from '../../lib/websocket';
import type { ServerMessage } from '@quick-emoji/shared';
import Loading from '../../components/Loading';

export default function LobbyPage() {
  const router = useRouter();
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [platforms, setPlatforms] = useState<Platform[]>(['github', 'slack']);
  const [roomCode, setRoomCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [createdRoomCode, setCreatedRoomCode] = useState<string | null>(null);

  const handlePlatformChange = (platform: Platform, checked: boolean) => {
    setPlatforms(prev =>
      checked
        ? [...prev, platform]
        : prev.filter(p => p !== platform)
    );
  };

  const handleCreateRoom = async () => {
    if (platforms.length === 0) {
      setError('少なくとも1つのプラットフォームを選択してください。');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const ws = new GameWebSocket();
      await ws.connect();

      // ルーム作成メッセージのハンドラー
      let receivedRoomCode: string | null = null;

      ws.onMessage('room_created', (message: ServerMessage) => {
        if (message.type === 'room_created') {
          receivedRoomCode = message.roomCode;
          setCreatedRoomCode(message.roomCode);
          // WebSocketインスタンスを保存（次のページで使用するため）
          sessionStorage.setItem('gameWs', JSON.stringify({ roomCode: message.roomCode }));
          setLoading(false);
        }
      });

      ws.onError((err) => {
        setError(err.message);
        setLoading(false);
      });

      await ws.createRoom(platforms);

      // 絵文字メッセージを待つ（ゲーム開始の合図）
      ws.onMessage('emoji', () => {
        // ゲームページに遷移
        if (receivedRoomCode) {
          router.push(`/game?roomCode=${receivedRoomCode}`);
        }
      });

    } catch (err: any) {
      setError(err.message || 'ルーム作成に失敗しました。');
      setLoading(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomCode.trim()) {
      setError('ルームコードを入力してください。');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const ws = new GameWebSocket(roomCode.trim());
      await ws.connect();

      // 参加完了を待つ
      ws.onMessage('joined', () => {
        // WebSocketインスタンスを保存
        sessionStorage.setItem('gameWs', JSON.stringify({ roomCode: roomCode.trim() }));
        // ゲームページに遷移
        router.push(`/game?roomCode=${roomCode.trim()}`);
      });

      ws.onError((err) => {
        setError(err.message);
        setLoading(false);
      });

      await ws.joinRoom(roomCode.trim());

    } catch (err: any) {
      setError(err.message || 'ルームへの参加に失敗しました。');
      setLoading(false);
    }
  };

  if (loading) {
    return <Loading message={mode === 'create' ? 'ルームを作成しています...' : 'ルームに参加しています...'} size="large" />;
  }

  if (createdRoomCode) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>ルームが作成されました</h1>
        <div style={{ marginBottom: '2rem' }}>
          <div style={{ fontSize: '1.5rem', marginBottom: '0.5rem' }}>ルームコード</div>
          <div style={{ fontSize: '3rem', fontWeight: 'bold', color: 'var(--primary-color)', letterSpacing: '0.5rem' }}>
            {createdRoomCode}
          </div>
        </div>
        <p style={{ marginBottom: '2rem', color: 'var(--secondary-color)' }}>
          このコードを他のプレイヤーに共有してください。
        </p>
        <button
          className="btn btn-primary"
          onClick={() => router.push(`/game?roomCode=${createdRoomCode}`)}
          style={{ fontSize: '1.25rem', padding: '1rem 2rem' }}
        >
          ゲームを開始
        </button>
      </div>
    );
  }

  return (
    <div className="card" style={{ maxWidth: '600px', margin: '0 auto' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '2rem' }}>ロビー</h1>

      {error && (
        <div className="error" style={{ marginBottom: '1rem' }}>
          {error}
        </div>
      )}

      {/* Mode Selection */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '2rem' }}>
        <button
          className={`btn ${mode === 'create' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('create')}
          style={{ flex: 1 }}
        >
          ルーム作成
        </button>
        <button
          className={`btn ${mode === 'join' ? 'btn-primary' : 'btn-secondary'}`}
          onClick={() => setMode('join')}
          style={{ flex: 1 }}
        >
          ルーム参加
        </button>
      </div>

      {mode === 'create' ? (
        <>
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
                    checked={platforms.includes(platform)}
                    onChange={(e) => handlePlatformChange(platform, e.target.checked)}
                  />
                  <span>{PLATFORM_LABELS[platform]}</span>
                </label>
              ))}
            </div>
          </div>

          <button
            className="btn btn-primary"
            onClick={handleCreateRoom}
            style={{ width: '100%', marginTop: '2rem' }}
          >
            ルームを作成
          </button>
        </>
      ) : (
        <>
          {/* Room Code Input */}
          <div className="form-group">
            <label className="form-label">ルームコード</label>
            <input
              type="text"
              className="form-input"
              placeholder="ルームコードを入力"
              value={roomCode}
              onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
              style={{ fontSize: '2rem', textAlign: 'center', letterSpacing: '0.5rem' }}
              maxLength={6}
            />
          </div>

          <button
            className="btn btn-primary"
            onClick={handleJoinRoom}
            disabled={!roomCode.trim()}
            style={{ width: '100%', marginTop: '2rem' }}
          >
            ルームに参加
          </button>
        </>
      )}

      <Link href="/" className="btn btn-secondary" style={{ width: '100%', marginTop: '1rem' }}>
        戻る
      </Link>
    </div>
  );
}
