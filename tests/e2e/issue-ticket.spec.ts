import { test, expect } from '@playwright/test';

const ISSUE_URL = '/issue';

test.describe('Issue Ticket Page (spec)', () => {
  test('allows manual selection of six numbers and issues ticket', async ({ page }) => {
    await page.goto(ISSUE_URL);

    await expect(page.getByTestId('player-name-input')).toBeVisible();

    await page.getByTestId('player-name-input').fill('Manual Tester');

    const numbersToPick = [1, 6, 11, 16, 21, 26];
    for (const number of numbersToPick) {
      await page.getByTestId(`number-button-${number}`).click();
    }

    const summary = page.getByTestId('number-selection-summary');
    await expect(summary).toContainText('선택된 번호');
    await expect(summary.getByTestId('selected-number-chip')).toHaveCount(6);
    await expect(page.getByTestId('issue-ticket-button')).toBeEnabled();

    const consoleMessages: string[] = [];
    page.on('console', (message) => {
      consoleMessages.push(message.text());
    });

    await page.getByTestId('issue-ticket-button').click();

    await expect(page.getByTestId('ticket-issue-toast')).toContainText('발행');
    expect(consoleMessages.some((msg) => msg.includes('[Lotto645][issue:start]'))).toBe(true);
    expect(consoleMessages.some((msg) => msg.includes('[Lotto645][issue:success]'))).toBe(true);
  });

  test('auto-select fills remaining numbers without duplicates', async ({ page }) => {
    await page.goto(ISSUE_URL);

    await page.getByTestId('player-name-input').fill('Auto Tester');

    await page.getByTestId('number-button-1').click();
    await page.getByTestId('number-button-2').click();

    await page.getByTestId('auto-select-button').click();

    const selectedChips = page.getByTestId('selected-number-chip');
    const selectedCount = await selectedChips.count();
    expect(selectedCount).toBe(6);

    const numbers = [];
    for (let i = 0; i < selectedCount; i += 1) {
      numbers.push(Number(await selectedChips.nth(i).innerText()));
    }
    const uniques = new Set(numbers);
    expect(uniques.size).toBe(6);

    await expect(page.getByTestId('issue-ticket-button')).toBeEnabled();
  });
});
