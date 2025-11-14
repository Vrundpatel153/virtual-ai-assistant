import { test, expect } from '@playwright/test';

const DEV_URL = process.env.VITE_DEV_URL || 'http://localhost:5173/chat';
const MESSAGE = 'Hello from Playwright e2e';
const USER = {
  id: 'playwright-user',
  email: 'playwright@example.com',
  name: 'Playwright User',
  loginMethod: 'email',
};

test('chat assistant sends message via backend and shows Groq reply', async ({ page }) => {
  await page.addInitScript((user) => {
    localStorage.setItem('ai_assistant_user', JSON.stringify(user));
    localStorage.setItem('ai_assistant_users', JSON.stringify([{ ...user, password: 'password123' }]));
  }, USER);

  await page.goto(DEV_URL, { waitUntil: 'networkidle' });

  const input = page.getByPlaceholder('Type your message...');
  await expect(input).toBeVisible();

  const messageLocator = page.locator('pre');
  const initialCount = await messageLocator.count();

  await input.click();
  await input.fill(MESSAGE);
  await input.press('Enter');

  await expect(messageLocator).toHaveCount(initialCount + 2, { timeout: 60_000 });

  const replyText = (await messageLocator.last().textContent())?.trim() ?? '';
  expect(replyText.length).toBeGreaterThan(0);
  expect(replyText.toLowerCase()).not.toContain('api key');
});
