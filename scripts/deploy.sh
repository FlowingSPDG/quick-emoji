#!/bin/bash

# Quick Emoji Deployment Script
# This script deploys both the frontend (Cloudflare Pages) and backend (Cloudflare Workers)

set -e

echo "🚀 Starting Quick Emoji deployment..."

# Check if wrangler is authenticated
echo "Checking Wrangler authentication..."
if ! npx wrangler auth status >/dev/null 2>&1; then
    echo "❌ Please authenticate with Wrangler first:"
    echo "   npx wrangler auth login"
    exit 1
fi

# Check if KV namespaces exist
echo "Checking KV namespaces..."
if ! npx wrangler kv:namespace list | grep -q "EMOJI_DATA"; then
    echo "Creating EMOJI_DATA KV namespace..."
    npx wrangler kv:namespace create "EMOJI_DATA"
fi

if ! npx wrangler kv:namespace list | grep -q "GAME_SESSIONS"; then
    echo "Creating GAME_SESSIONS KV namespace..."
    npx wrangler kv:namespace create "GAME_SESSIONS"
fi

if ! npx wrangler kv:namespace list | grep -q "LEADERBOARD"; then
    echo "Creating LEADERBOARD KV namespace..."
    npx wrangler kv:namespace create "LEADERBOARD"
fi

# Update wrangler.toml with actual namespace IDs
echo "Updating wrangler.toml with KV namespace IDs..."
node scripts/update-kv-ids.js

# Deploy the API first
echo "📦 Deploying API (Cloudflare Workers)..."
cd apps/api
npm run deploy
cd ../..

# Deploy the frontend
echo "🌐 Deploying frontend (Cloudflare Pages)..."
cd apps/web
npm run build

# Deploy to Cloudflare Pages
echo "Deploying to Cloudflare Pages..."
npx wrangler pages deploy out --compatibility-date=2024-01-20

cd ../..

echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Update your DNS to point to the deployed Pages URL"
echo "2. Set up environment variables in Cloudflare Pages dashboard:"
echo "   - NEXT_PUBLIC_API_URL: https://your-worker-subdomain.your-account.workers.dev"
echo "3. Import emoji data: npm run import-data"
echo ""
echo "🎉 Your Quick Emoji game is now live!"