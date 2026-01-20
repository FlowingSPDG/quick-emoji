# Quick Emoji

絵文字を見て瞬時にそのshortcodeを入力する早押しクイズゲームです。GitHub、Slack、Discord、Unicodeのshortcodeに対応しており、難易度を選んでプレイできます。回答時間と難易度に応じてスコアが計算され、グローバルリーダーボードで他のプレイヤーと競い合えます。

## システム概要

フロントエンドとバックエンドが分離された構成です。フロントエンドはNext.jsで構築され、ゲーム画面やリーダーボードを表示します。バックエンドはCloudflare Workers上で動作するAPIサーバーで、ゲームセッション管理、回答判定、スコア計算、リーダーボード管理を担当します。データはCloudflare KVに保存され、絵文字データ、ゲームセッション、リーダーボード情報が格納されます。

## インフラ構成

フロントエンドはCloudflare Pagesにデプロイされます。バックエンドAPIはCloudflare Workersとして動作し、エッジコンピューティングにより低レイテンシで応答します。データストアにはCloudflare KVを使用し、絵文字データ、ゲームセッション、リーダーボードの3つのKVネームスペースで管理しています。プレビュー環境はGitHub Actionsのワークフローで自動的に構築され、プルリクエストごとにプレビュー用のWorkers環境が作成されます。

## 技術スタック

### フロントエンド
- Next.js 15.0.0 (App Router)
- React 18.3.1
- TypeScript 5.3.3

### バックエンド
- Hono 4.0.0
- Cloudflare Workers
- TypeScript 5.3.3

### データストア
- Cloudflare KV

### デプロイ
- Cloudflare Pages (フロントエンド)
- Cloudflare Workers (バックエンド)

### 開発環境
- npm workspaces
- Wrangler 3.19.0

## ライセンス

MIT License
