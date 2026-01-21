# Quick Emoji - 絵文字早押しクイズゲーム

絵文字を見てshortcode（略称）を入力する早押しクイズゲーム。

## 特徴

- 複数プラットフォーム対応: GitHub, Slack, Discord, Unicodeのshortcodeに対応
- 難易度調整: イージー、ミディアム、ハードの3段階
- リアルタイム判定: 即座に正誤を表示
- スコアリングシステム: 時間ボーナスと難易度ボーナス
- リーダーボード: スコアランキング表示
- Cloudflare対応: Pages + Workers + KVで構成

## 技術スタック

- Frontend: Next.js 15 (App Router), React 18, TypeScript
- Backend: Hono (Cloudflare Workers), TypeScript
- Database: Cloudflare KV
- Testing: Jest, Vitest
- CI/CD: GitHub Actions
- Deployment: Cloudflare Pages + Workers

## セットアップ

### 必要条件
- Node.js 18+
- npm
- Cloudflare アカウント

### インストール
```bash
git clone <repository-url>
cd quick-emoji
npm install
npm run import-data
```

### 開発サーバー起動
```bash
npm run dev          # Frontend (http://localhost:3000)
npm run dev:api      # API (http://localhost:8787)
```

### テスト実行
```bash
npm test             # 全テスト
npm run test:watch   # Frontendテスト (Watch)
npm run test:api     # APIテスト
npm run type-check   # 型チェック
npm run lint         # リンティング
```

## ゲームルール

1. 設定: プラットフォーム、難易度、問題数、制限時間を選択
2. ゲーム開始: 絵文字が表示される
3. 回答: 絵文字のshortcodeを入力（例: `:smile:`）
4. 判定: 正誤を表示


## ライセンス

MIT License
