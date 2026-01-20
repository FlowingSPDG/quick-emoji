#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

try {
  console.log('Fetching KV namespace IDs...');

  // Get list of KV namespaces
  const output = execSync('npx wrangler kv:namespace list --format=json', { encoding: 'utf8' });
  const namespaces = JSON.parse(output);

  // Map namespace titles to IDs
  const kvMap = {};
  namespaces.forEach(ns => {
    kvMap[ns.title] = ns.id;
  });

  // Read wrangler.toml
  const wranglerPath = path.join(__dirname, '../apps/api/wrangler.toml');
  let wranglerContent = fs.readFileSync(wranglerPath, 'utf8');

  // Update namespace IDs
  wranglerContent = wranglerContent.replace(
    /kv_namespaces = \[[^\]]+\]/s,
    `kv_namespaces = [
  { binding = "EMOJI_DATA", id = "${kvMap.EMOJI_DATA || 'your-emoji-data-namespace-id'}", preview_id = "${kvMap.EMOJI_DATA || 'your-emoji-data-preview-id'}" },
  { binding = "GAME_SESSIONS", id = "${kvMap.GAME_SESSIONS || 'your-game-sessions-namespace-id'}", preview_id = "${kvMap.GAME_SESSIONS || 'your-game-sessions-preview-id'}" },
  { binding = "LEADERBOARD", id = "${kvMap.LEADERBOARD || 'your-leaderboard-namespace-id'}", preview_id = "${kvMap.LEADERBOARD || 'your-leaderboard-preview-id'}" }
]`
  );

  // Write back to file
  fs.writeFileSync(wranglerPath, wranglerContent);

  console.log('✅ wrangler.toml updated with KV namespace IDs');
} catch (error) {
  console.error('❌ Failed to update KV IDs:', error.message);
  console.log('Please manually update the KV namespace IDs in apps/api/wrangler.toml');
}