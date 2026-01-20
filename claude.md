# Quick Emoji - プロジェクト概要

## プロジェクトの目的
絵文字を見て瞬時にその略称（shortcode）を入力する早押しクイズゲーム。GitHub、Slack、Discord、Unicodeのshortcodeに対応しており、難易度を選んでプレイできます。回答時間と難易度に応じてスコアが計算され、グローバルリーダーボードで他のプレイヤーと競い合えます。

## 技術スタック

### フロントエンド
- **Next.js 15.0.0** (App Router)
- **React 18.3.1**
- **TypeScript 5.3.3**

### バックエンド
- **Hono 4.0.0** (Webフレームワーク)
- **Cloudflare Workers** (エッジコンピューティング)
- **TypeScript 5.3.3**

### データストレージ
- **Cloudflare KV** (Key-Value Store)
  - EMOJI_DATA: 絵文字マスターデータ
  - GAME_SESSIONS: ゲームセッションデータ（TTL: 1時間）
  - LEADERBOARD: リーダーボードデータ

### デプロイ
- **Cloudflare Pages** (フロントエンド)
- **Cloudflare Workers** (バックエンド)

### 開発環境
- **npm workspaces** (モノレポ管理)
- **Wrangler 3.19.0** (Cloudflare Workers開発ツール)

## プロジェクト構成

### モノレポ構造
```
quick-emoji/
├── apps/
│   ├── api/              # Cloudflare Workers API
│   │   ├── src/
│   │   │   ├── routes/   # APIルート
│   │   │   ├── lib/      # ビジネスロジック
│   │   │   └── index.ts  # エントリーポイント
│   │   └── wrangler.toml # Workers設定
│   └── web/              # Next.js フロントエンド
│       ├── app/          # App Router ページ
│       ├── components/   # Reactコンポーネント
│       └── lib/          # ユーティリティ
├── packages/
│   └── shared/           # 共有型定義・定数
└── scripts/              # ビルド・デプロイスクリプト
```

## APIエンドポイント

### ベースURL
- 開発環境: `http://localhost:8787`
- 本番環境: Cloudflare Workers のデプロイURL

### エンドポイント一覧
- `GET /api/emojis` - 絵文字データ取得（フィルタリング対応）
- `POST /api/session/start` - ゲームセッション開始
- `POST /api/session/answer` - 回答送信
- `POST /api/session/end` - セッション終了
- `GET /api/leaderboard` - リーダーボード取得
- `GET /health` - ヘルスチェック

詳細は `SPEC.md` を参照してください。

## データモデル

### 主要な型定義
- `Emoji`: 絵文字データ（emoji, platforms, category, difficulty）
- `GameSession`: ゲームセッション（sessionId, userId, settings, score, answers）
- `GameSettings`: ゲーム設定（platforms, difficulty, timeLimit, questionCount）
- `LeaderboardEntry`: リーダーボードエントリ（userId, username, score, avgTime, platforms）

型定義は `packages/shared/src/types.ts` にあります。

## ゲームフロー

1. **初期画面** (`/`) → ゲーム開始またはリーダーボード表示
2. **設定画面** (`/settings`) → プラットフォーム、難易度、問題数、制限時間を設定
3. **ゲーム画面** (`/game`) → 絵文字を表示し、shortcodeを入力
4. **結果画面** (`/result`) → 最終スコアと統計を表示
5. **リーダーボード** (`/leaderboard`) → グローバルランキング表示

## スコアリングシステム

### 計算式
```javascript
score = BASE_SCORE (10) + (remainingTime * 0.5) + (difficulty * 5)
```

- **基本スコア**: 10点
- **時間ボーナス**: 残り時間 × 0.5点
- **難易度ボーナス**: easy=0, medium=5, hard=10

## セキュリティ

### レート制限
- IP単位: 100リクエスト/分
- セッション単位: 1回答/秒

### 入力バリデーション
- Shortcode: 1〜50文字、英数字とアンダースコアのみ
- 正規表現: `/^[a-zA-Z0-9_]+$/`

## 開発ガイドライン

### コードスタイル
- TypeScript を使用
- 型安全性を重視
- 共有型定義は `packages/shared` に配置

### テスト
- フロントエンド: Jest + React Testing Library
- バックエンド: Vitest

### デプロイ
- プレビュー環境: GitHub Actions で自動デプロイ（PRごと）
- 本番環境: GitHub Actions で自動デプロイ（mainブランチ）

## 重要な注意事項

1. **技術スタックの変更**: 明示的な指示がない限り、技術スタック（Next.js、React、Hono等）のバージョンは変更しないでください。

2. **UI/UXの変更**: レイアウト、色、フォント、間隔などの変更は事前に承認が必要です。

3. **型定義の共有**: フロントエンドとバックエンドで使用する型は `packages/shared` に配置してください。

4. **APIエンドポイント**: エンドポイントの追加・変更は `SPEC.md` にも反映してください。

5. **環境変数**: KV Namespace IDは環境変数から取得します（`wrangler.toml`参照）。

## 関連ドキュメント

- `SPEC.md` - 詳細な技術仕様書
- `README.md` - プロジェクト概要とセットアップ手順

## よくある質問

### Q: 絵文字データはどこから来るの？
A: `data/emojis.json` から読み込み、`scripts/import-emoji-data.ts` で処理してKVに保存します。

### Q: セッションデータはどのくらい保持される？
A: 1時間のTTLが設定されています。終了したセッションは自動的に削除されます。

### Q: リーダーボードの更新頻度は？
A: 24時間キャッシュされています。セッション終了時に更新されます。

---

このドキュメントは開発者向けのガイドです。詳細な仕様は `SPEC.md` を参照してください。
