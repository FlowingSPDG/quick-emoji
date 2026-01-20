/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Cloudflare Pages対応
  output: 'standalone',

  images: {
    unoptimized: true,
  },

  // 環境変数の設定
  env: {
    // API URL設定（デプロイ時に動的に上書きされる）
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8787',
  },

  // ビルド時の環境変数検証
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // 開発環境以外ではAPI URLが設定されていることを確認
    if (!dev && !process.env.NEXT_PUBLIC_API_URL) {
      console.warn('⚠️  NEXT_PUBLIC_API_URL is not set. Make sure to set it during deployment.');
    }

    return config;
  },

  // 実験的機能（必要に応じて有効化）
  experimental: {
    // App Routerの最適化
    optimizeCss: true,
  },

  // コンパイラ設定
  compiler: {
    // 開発環境でのみ有効
    removeConsole: process.env.NODE_ENV === 'production',
  },
};

module.exports = nextConfig;
