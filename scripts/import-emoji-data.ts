#!/usr/bin/env tsx

import fs from 'fs';
import path from 'path';
import type { Emoji } from '../packages/shared/src/types';

async function importEmojiData() {
  try {
    // Read emoji data
    const emojiDataPath = path.join(__dirname, '../data/emojis-clean.json');
    const emojiData = fs.readFileSync(emojiDataPath, 'utf-8');
    const emojis: Emoji[] = JSON.parse(emojiData);

    console.log(`Found ${emojis.length} emojis to import`);

    // Validate data structure
    const invalidEmojis = emojis.filter(emoji => {
      return !emoji.emoji ||
             !emoji.platforms ||
             typeof emoji.difficulty !== 'number' ||
             emoji.difficulty < 1 ||
             emoji.difficulty > 3;
    });

    if (invalidEmojis.length > 0) {
      console.error(`Found ${invalidEmojis.length} invalid emojis:`);
      invalidEmojis.forEach(emoji => console.error(`- ${emoji.emoji}: missing or invalid data`));
      process.exit(1);
    }

    // Check for duplicates
    const emojiMap = new Map<string, number>();
    emojis.forEach((emoji, index) => {
      const count = emojiMap.get(emoji.emoji) || 0;
      emojiMap.set(emoji.emoji, count + 1);
    });

    const duplicates = Array.from(emojiMap.entries())
      .filter(([, count]) => count > 1)
      .map(([emoji]) => emoji);

    if (duplicates.length > 0) {
      console.error('Found duplicate emojis:');
      duplicates.forEach(emoji => console.error(`- ${emoji}`));
      process.exit(1);
    }

    console.log('✅ Data validation passed');

    // Group by difficulty for statistics
    const difficultyStats = emojis.reduce((acc, emoji) => {
      acc[emoji.difficulty] = (acc[emoji.difficulty] || 0) + 1;
      return acc;
    }, {} as Record<number, number>);

    console.log('📊 Difficulty distribution:');
    console.log(`  Easy (1): ${difficultyStats[1] || 0} emojis`);
    console.log(`  Medium (2): ${difficultyStats[2] || 0} emojis`);
    console.log(`  Hard (3): ${difficultyStats[3] || 0} emojis`);

    // Count total shortcodes
    const totalShortcodes = emojis.reduce((sum, emoji) => {
      const platformCodes = Object.values(emoji.platforms).flat();
      return sum + platformCodes.length;
    }, 0);

    console.log(`📝 Total shortcodes: ${totalShortcodes}`);

    // Platform statistics
    const platformStats = emojis.reduce((acc, emoji) => {
      Object.keys(emoji.platforms).forEach(platform => {
        acc[platform] = (acc[platform] || 0) + 1;
      });
      return acc;
    }, {} as Record<string, number>);

    console.log('🏷️  Platform coverage:');
    Object.entries(platformStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([platform, count]) => {
        console.log(`  ${platform}: ${count} emojis`);
      });

    // Note: In a real deployment, you would upload this data to Cloudflare KV
    // For now, we'll just validate and show statistics

    console.log('\n🚀 Import simulation completed successfully!');
    console.log('\nTo deploy to Cloudflare KV:');
    console.log('1. Set up your Cloudflare account and create KV namespaces');
    console.log('2. Update wrangler.toml with your KV namespace IDs');
    console.log('3. Run: npm run deploy:api');

    // Save processed data for API to use
    const processedData = {
      emojis,
      metadata: {
        totalEmojis: emojis.length,
        totalShortcodes,
        difficultyStats,
        platformStats,
        lastUpdated: new Date().toISOString()
      }
    };

    const outputPath = path.join(__dirname, '../apps/api/src/data/emojis-processed.json');
    fs.writeFileSync(outputPath, JSON.stringify(processedData, null, 2));
    console.log(`💾 Processed data saved to: ${outputPath}`);

  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  }
}

// Run if called directly
if (require.main === module) {
  importEmojiData();
}

export { importEmojiData };