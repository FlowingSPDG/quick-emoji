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
5. スコア: 時間ボーナス + 難易度ボーナスで計算
6. 結果: 最終スコアと統計、リーダーボード順位を表示

スコア計算式: `基本スコア(10) + 時間ボーナス + 難易度ボーナス`

## API エンドポイント

### 絵文字関連
- `GET /api/emojis` - 絵文字一覧取得（フィルタリング対応）

### セッション関連
- `POST /api/session/start` - ゲームセッション開始
- `POST /api/session/answer` - 回答送信・判定
- `POST /api/session/end` - セッション終了・スコア計算

### リーダーボード関連
- `GET /api/leaderboard` - リーダーボード取得

## デプロイ

### GitHub Actions CI/CD

GitHub Actionsを使用して自動デプロイを設定。

#### ワークフロー概要

- CIワークフロー (`ci.yml`): すべてのPRとpushでテスト実行
- プレビューデプロイ (`deploy-preview.yml`): PRごとにプレビュー環境をデプロイ
- 本番デプロイ (`deploy-production.yml`): mainブランチにpushで本番環境にデプロイ
- 開発環境デプロイ (`deploy-development.yml`): developブランチにpushで開発環境にデプロイ

#### 必要なGitHub Secrets設定

以下のSecretsをリポジトリに設定:

1. Cloudflare認証情報:
   - `CLOUDFLARE_API_TOKEN`: Cloudflare API Token
   - `CLOUDFLARE_ACCOUNT_ID`: Cloudflare Account ID

2. KV Namespace ID:
   - `EMOJI_DATA_ID`: EMOJI_DATA Namespace ID
   - `GAME_SESSIONS_ID`: GAME_SESSIONS Namespace ID
   - `LEADERBOARD_ID`: LEADERBOARD Namespace ID

3. Pagesプロジェクト (開発環境用):
   - `CLOUDFLARE_PROJECT_NAME`: Cloudflare Pagesプロジェクト名

##### Secrets設定手順

1. Cloudflareダッシュボード → Account → API Tokens
2. 「Create Token」→「Edit Cloudflare Workers」テンプレートを使用
3. 必要な権限を設定（Workers:Edit, Pages:Edit, Account:Read）
4. GitHubリポジトリ → Settings → Secrets and variables → Actions
5. Secretsを追加

#### KV Namespace作成

```bash
# Cloudflare WorkersでKV Namespaceを作成
npx wrangler kv:namespace create "EMOJI_DATA"
npx wrangler kv:namespace create "GAME_SESSIONS"
npx wrangler kv:namespace create "LEADERBOARD"

# 作成されたNamespace IDを確認
npx wrangler kv:namespace list
```

#### 手動デプロイ

GitHub Actionsが利用できない場合:
```bash
npm run deploy
```

### 環境変数の設定

`NEXT_PUBLIC_API_URL`は、デプロイされたCloudflare Workers APIのURLを指定。

自動設定:
- GitHub Actionsのワークフローで自動設定
- APIデプロイ後、URLが自動取得されビルド時に使用

手動設定:
Cloudflare Pagesダッシュボードで設定:
```
NEXT_PUBLIC_API_URL=https://quick-emoji-api.{your-account-subdomain}.workers.dev
```

ローカル開発時:
- デフォルト: `http://localhost:8787`
- API起動: `npm run dev:api`

## セキュリティ

- レート制限: IPベースおよびセッションベースのレート制限
- 入力バリデーション: すべてのユーザー入力の検証
- CORS設定: 許可されたオリジンのみアクセス可能
- エラーハンドリング: エラーログとエラーメッセージ

## 貢献

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Add tests (`npm test`)
5. Commit your changes (`git commit -m 'Add amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## 開発フロー

### ブランチ戦略
- `main`: 本番環境
- `develop`: 開発環境
- `feature/*`: 新機能開発
- `hotfix/*`: 緊急修正

### コミットメッセージ
```
feat: 新機能の追加
fix: バグ修正
docs: ドキュメント更新
style: スタイル修正
refactor: リファクタリング
test: テスト追加
chore: その他の変更
```

## テストカバレッジ

### Frontendテスト
- コンポーネントテスト (Jest + React Testing Library)
- ユーティリティ関数テスト
- APIクライアントテスト

### Backendテスト
- スコアリングロジックテスト (Vitest)
- バリデーションテスト
- APIレスポンステスト

## プロジェクト構造

```
quick-emoji/
├── apps/
│   ├── web/                    # Next.js フロントエンド
│   │   ├── app/               # App Router pages
│   │   ├── components/        # React components
│   │   ├── lib/               # Utilities & API client
│   │   └── __tests__/         # Unit tests
│   └── api/                   # Hono API (Workers)
│       ├── src/
│       │   ├── routes/        # API route handlers
│       │   ├── lib/          # Utilities & helpers
│       │   └── __tests__/    # Unit tests
├── scripts/                   # Deployment & utility scripts
├── data/                     # Emoji data
├── .github/workflows/        # CI/CD pipelines
└── package.json              # Workspace config
```

## ライセンス

MIT License
