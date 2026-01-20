# 絵文字早押しクイズゲーム 技術仕様書

## プロジェクト概要
絵文字を見て瞬時にその略称（shortcode）を入力する早押しゲーム。
プラットフォーム別（GitHub、Slack、Discord等）のshortcodeに対応し、ユーザーが設定可能。

## アーキテクチャ

### 技術スタック
- **フロントエンド**: Next.js 15.0.0 (App Router) + React 18.3.1 + TypeScript 5.3.3
- **バックエンド**: Hono 4.0.0 + Cloudflare Workers + TypeScript 5.3.3
- **データストレージ**: Cloudflare KV (Key-Value Store)
- **CDN**: Cloudflare Pages
- **ドメイン管理**: Cloudflare DNS
- **開発環境**: npm workspaces + Wrangler 3.19.0

### システム構成図
```
[ユーザー]
    ↓
[Cloudflare Pages (Next.js フロントエンド)]
    ↓
[Cloudflare Workers (Hono API)]
    ↓
[Cloudflare KV (絵文字データ + スコアボード)]
```

## データモデル

### 絵文字データ構造
```json
{
  "emoji": "🙏",
  "platforms": {
    "github": ["pray", "folded_hands"],
    "slack": ["pray", "praying_hands"],
    "discord": ["pray"],
    "unicode": ["folded_hands"]
  },
  "category": "People & Body",
  "difficulty": 2
}
```

### ゲームセッション
```json
{
  "sessionId": "uuid-v4",
  "userId": "anonymous-user-id",
  "settings": {
    "platforms": ["github", "slack"],
    "difficulty": "all",
    "timeLimit": 30,
    "questionCount": 10
  },
  "score": 0,
  "answers": [
    {
      "emoji": "🙏",
      "userAnswer": "pray",
      "correctAnswers": ["pray", "folded_hands"],
      "platform": "github",
      "timeSpent": 1.2,
      "correct": true
    }
  ],
  "startTime": "2026-01-20T10:00:00Z",
  "endTime": null
}
```

### グローバルリーダーボード
```json
{
  "leaderboard": [
    {
      "userId": "user-123",
      "username": "Player1",
      "score": 95,
      "avgTime": 1.5,
      "platforms": ["github", "slack"],
      "timestamp": "2026-01-20T10:00:00Z"
    }
  ]
}
```

## Cloudflare Workers API エンドポイント

### ベースURL
- 開発環境: `http://localhost:8787`
- 本番環境: Cloudflare Workers のデプロイURL

### 1. GET /api/emojis
絵文字データの取得（フィルタリング可能）

**Query Parameters:**
- `platforms`: カンマ区切りのプラットフォームリスト (例: `github,slack`)
- `difficulty`: `easy`, `medium`, `hard`, `all`
- `count`: 取得する絵文字の数（デフォルト: 10）

**Response:**
```json
{
  "emojis": [
    {
      "emoji": "🙏",
      "platforms": { ... },
      "difficulty": 2
    }
  ]
}
```

### 2. POST /api/session/start
ゲームセッション開始

**Request Body:**
```json
{
  "settings": {
    "platforms": ["github", "slack"],
    "difficulty": "all",
    "timeLimit": 30,
    "questionCount": 10
  }
}
```

**Response:**
```json
{
  "sessionId": "uuid-v4",
  "emojis": [ ... ]
}
```

### 3. POST /api/session/answer
回答の送信

**Request Body:**
```json
{
  "sessionId": "uuid-v4",
  "emoji": "🙏",
  "answer": "pray",
  "timeSpent": 1.2
}
```

**Response:**
```json
{
  "correct": true,
  "acceptedPlatform": "github",
  "correctAnswers": ["pray", "folded_hands"],
  "currentScore": 10
}
```

### 4. POST /api/session/end
ゲームセッション終了

**Request Body:**
```json
{
  "sessionId": "uuid-v4"
}
```

**Response:**
```json
{
  "finalScore": 95,
  "totalQuestions": 10,
  "correctAnswers": 9,
  "avgTime": 1.5,
  "leaderboardRank": 5
}
```

### 5. GET /api/leaderboard
リーダーボード取得

**Query Parameters:**
- `platform`: プラットフォームフィルタ（単一プラットフォーム）
- `limit`: 取得件数（デフォルト: 50）

**Response:**
```json
{
  "leaderboard": [ ... ]
}
```

### 6. GET /health
ヘルスチェック

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2026-01-20T10:00:00Z"
}
```

## Cloudflare KV ストレージ設計

### KV Namespace: EMOJI_DATA
絵文字マスターデータ

**Key構造:**
- `emojis` - 全絵文字データ（JSON配列として保存）

### KV Namespace: GAME_SESSIONS
ゲームセッションデータ（TTL: 1時間）

**Key構造:**
- `session:{sessionId}` - セッションデータ

### KV Namespace: LEADERBOARD
リーダーボードデータ

**Key構造:**
- `leaderboard` - リーダーボードデータ（24時間キャッシュ）

## フロントエンド構成

### ディレクトリ構造
```
apps/web/
├── app/
│   ├── page.tsx              # メインゲーム画面（初期画面）
│   ├── game/
│   │   └── page.tsx          # ゲーム画面
│   ├── settings/
│   │   └── page.tsx          # 設定画面
│   ├── leaderboard/
│   │   └── page.tsx          # リーダーボード画面
│   ├── result/
│   │   └── page.tsx          # 結果画面
│   ├── layout.tsx            # レイアウト
│   └── globals.css           # グローバルスタイル
├── components/
│   ├── ErrorBoundary.tsx     # エラーバウンダリ
│   └── Loading.tsx           # ローディングコンポーネント
├── lib/
│   ├── api.ts                # API通信クライアント
│   └── utils.ts              # ユーティリティ関数
└── next.config.js            # Next.js設定
```

### 主要機能

#### ゲーム画面 (app/game/page.tsx)
- 絵文字の表示（大きく中央に）
- 入力フォーム（自動フォーカス）
- タイマー表示
- スコア表示
- 即座のフィードバック（正解/不正解）
- 進捗バー

#### 設定画面 (app/settings/page.tsx)
- プラットフォーム選択（複数選択可能）
  - [ ] GitHub
  - [ ] Slack
  - [ ] Discord
  - [ ] Unicode Official
- 難易度選択
  - ラジオボタン: Easy / Medium / Hard / All
- 問題数選択
  - スライダー: 5〜50問
- 制限時間設定
  - スライダー: 15〜60秒/問

#### リーダーボード画面 (app/leaderboard/page.tsx)
- グローバルランキング表示
- プラットフォームフィルタ
- 詳細統計（平均回答時間、正答率等）

#### 結果画面 (app/result/page.tsx)
- 最終スコア表示
- 統計情報表示
- 順位表示

## ゲームフロー

### 1. 初期画面
```
[ゲーム開始] → 設定画面へ
[リーダーボード] → リーダーボード画面へ
```

### 2. 設定画面
```
プラットフォーム選択
難易度選択
問題数選択
制限時間設定
↓
[開始] → ゲーム画面へ
```

### 3. ゲーム画面
```
絵文字表示
↓
ユーザー入力
↓
即座に判定
↓
- 正解: スコア加算 + 次の問題
- 不正解: 正解表示 + 次の問題
↓
全問終了 → 結果画面
```

### 4. 結果画面
```
最終スコア表示
統計情報表示
順位表示
↓
[もう一度] → 設定画面へ
[リーダーボード] → リーダーボード画面へ
```

## スコアリングシステム

### 基本スコア計算
```javascript
// 基本ポイント: 10点
// 時間ボーナス: 残り時間 × 0.5点
// 難易度ボーナス: easy=0, medium=5, hard=10
score = 10 + (remainingTime * 0.5) + difficultyBonus
```

### 難易度判定基準
- **Easy (1)**: よく使われる絵文字（😂❤️👍等）、短いshortcode
- **Medium (2)**: 一般的な絵文字、通常の長さのshortcode
- **Hard (3)**: 珍しい絵文字、長いまたは複雑なshortcode

## デプロイ手順

### 1. Cloudflare Workers セットアップ
```bash
npm install -g wrangler
wrangler login
cd apps/api
wrangler deploy
```

### 2. KV Namespace 作成
```bash
wrangler kv:namespace create "EMOJI_DATA"
wrangler kv:namespace create "GAME_SESSIONS"
wrangler kv:namespace create "LEADERBOARD"
```

### 3. wrangler.toml 設定
```toml
name = "quick-emoji-api"
main = "src/index.ts"
compatibility_date = "2024-01-20"

kv_namespaces = [
  { binding = "EMOJI_DATA", id = "${EMOJI_DATA_ID}" },
  { binding = "GAME_SESSIONS", id = "${GAME_SESSIONS_ID}" },
  { binding = "LEADERBOARD", id = "${LEADERBOARD_ID}" }
]
```

### 4. 絵文字データの初期投入
```bash
npm run import-data
```

### 5. フロントエンドデプロイ
```bash
cd apps/web
npm run build
# Cloudflare Pagesにデプロイ
```

## パフォーマンス最適化

### キャッシング戦略
1. **絵文字データ**: Cloudflare KVで永続化
2. **静的アセット**: Cloudflare Pages CDNで配信
3. **API応答**: 適切なCache-Controlヘッダー設定

### 負荷対策
- KV読み込みの最小化（バッチ取得）
- セッションデータにTTL設定（1時間）
- リーダーボードの更新頻度制限（24時間キャッシュ）

## セキュリティ考慮事項

### レート制限
- IP単位: 100リクエスト/分
- セッション単位: 1回答/秒

### 入力バリデーション
- Shortcodeの長さ制限（1〜50文字）
- 英数字とアンダースコアのみ許可
- 正規表現パターン: `/^[a-zA-Z0-9_]+$/`

### 不正防止
- セッションIDの検証
- タイムスタンプチェック（明らかに速すぎる回答の排除）
- 同一IPからの連続ハイスコア投稿制限

## 開発環境

### モノレポ構成
- **ルート**: npm workspaces
- **フロントエンド**: `apps/web`
- **バックエンド**: `apps/api`
- **共有パッケージ**: `packages/shared`

### 開発コマンド
```bash
# フロントエンド開発サーバー起動
npm run dev

# バックエンド開発サーバー起動
npm run dev:api

# 型チェック
npm run type-check

# テスト実行
npm run test

# ビルド
npm run build
```

## 今後の拡張案

1. **マルチプレイヤーモード**
   - Cloudflare Durable Objectsを使用したリアルタイム対戦

2. **カスタムプラクティス**
   - 特定カテゴリのみの練習モード
   - 間違えた絵文字の復習機能

3. **統計ダッシュボード**
   - 個人の成長グラフ
   - よく間違える絵文字の分析

4. **ソーシャル機能**
   - スコア共有機能
   - フレンド対戦

5. **モバイルアプリ化**
   - PWA対応
   - オフライン練習モード

## コスト見積もり

### Cloudflare Workers
- 無料プラン: 100,000リクエスト/日
- 有料プラン: $5/月 〜 (10M リクエスト含む)

### Cloudflare KV
- 無料プラン: 100,000 read/日、1,000 write/日
- 有料プラン: $0.50/月 (1M read, 100K write含む)

### 想定コスト（小〜中規模）
- 月間100万リクエスト程度まで: **無料**
- それ以上: **$5〜10/月程度**

---

このドキュメントは実際の実装に基づいて作成されています。
