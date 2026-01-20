#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

async function importEmojiData() {
  try {
    console.log('📦 Importing emoji data to Cloudflare KV...');

    // Read processed emoji data
    const dataPath = path.join(__dirname, '../apps/api/src/data/emojis-processed.json');
    const emojiData = fs.readFileSync(dataPath, 'utf8');
    const processed = JSON.parse(emojiData);

    // Write to KV using wrangler
    console.log('Uploading emoji data...');
    execSync(`echo '${JSON.stringify(processed.emojis)}' | npx wrangler kv:key put --binding=EMOJI_DATA "emojis" -`, {
      stdio: 'inherit'
    });

    console.log('✅ Emoji data imported successfully!');
    console.log(`📊 Imported ${processed.metadata.totalEmojis} emojis with ${processed.metadata.totalShortcodes} shortcodes`);

  } catch (error) {
    console.error('❌ Failed to import emoji data:', error.message);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importEmojiData();
}

module.exports = { importEmojiData };