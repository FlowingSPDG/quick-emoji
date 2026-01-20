import { test, expect } from '@playwright/test';

test.describe('Game Flow', () => {
  test('should complete full game flow', async ({ page }) => {
    // Start from home page
    await page.goto('/');
    await expect(page).toHaveTitle(/絵文字早押しクイズ/);

    // Navigate to settings
    await page.getByRole('link', { name: 'ゲーム開始' }).click();
    await expect(page).toHaveURL(/\/settings/);

    // Configure game settings
    await page.getByLabel('プラットフォーム').check();
    await page.getByLabel('問題数').fill('5');
    await page.getByLabel('制限時間').fill('20');

    // Start game
    await page.getByRole('button', { name: 'ゲーム開始' }).click();
    await expect(page).toHaveURL(/\/game/);

    // Wait for game to load
    await page.waitForSelector('.emoji-display');

    // Game should show emoji and timer
    const emojiElement = page.locator('.emoji-display');
    await expect(emojiElement).toBeVisible();

    const timerElement = page.locator('.timer-display');
    await expect(timerElement).toBeVisible();

    // Answer input should be focused
    const answerInput = page.locator('.answer-input');
    await expect(answerInput).toBeFocused();

    // Enter an answer
    await answerInput.fill('test');
    await answerInput.press('Enter');

    // Should show feedback
    await expect(page.locator('.feedback')).toBeVisible();

    // Game should continue or end
    // (This depends on the game logic - adjust based on implementation)
  });

  test('should navigate to leaderboard', async ({ page }) => {
    await page.goto('/');
    await page.getByRole('link', { name: 'リーダーボード' }).click();
    await expect(page).toHaveURL(/\/leaderboard/);

    // Should show leaderboard title
    await expect(page.getByText('リーダーボード')).toBeVisible();
  });

  test('should handle settings validation', async ({ page }) => {
    await page.goto('/settings');

    // Try to start without selecting platforms
    await page.getByRole('button', { name: 'ゲーム開始' }).click();

    // Should show error message
    await expect(page.getByText(/プラットフォーム.*選択/)).toBeVisible();
  });
});