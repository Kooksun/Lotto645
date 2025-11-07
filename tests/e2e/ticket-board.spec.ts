import { expect, test } from '@playwright/test';

const ISSUE_URL = '/issue';
const DRAW_URL = '/draw';
const NUMBER_PICK_SEQUENCE = [1, 6, 11, 16, 21, 26];

async function issueTicket(page, name: string): Promise<void> {
  await page.goto(ISSUE_URL);
  await page.getByTestId('player-name-input').fill(name);

  for (const value of NUMBER_PICK_SEQUENCE) {
    const button = page.getByTestId(`number-button-${value}`);
    const isPressed = await button.getAttribute('aria-pressed');
    if (isPressed !== 'true') {
      await button.click();
    }
  }

  await expect(page.getByTestId('issue-ticket-button')).toBeEnabled();
  await page.getByTestId('issue-ticket-button').click();
  await expect(page.getByTestId('ticket-issue-toast')).toContainText('발행');
}

test.describe('Ticket board (spec)', () => {
  test('reflects new tickets in realtime and exposes a scrollbar when overflowing', async ({ browser }) => {
    const context = await browser.newContext();
    const boardPage = await context.newPage();
    const issuePage = await context.newPage();

    const boardConsole: string[] = [];
    boardPage.on('console', (message) => {
      boardConsole.push(message.text());
    });

    await boardPage.goto(DRAW_URL);
    await expect(boardPage.getByTestId('ticket-board-heading')).toBeVisible();

    const issuedNames = Array.from({ length: 4 }, (_, index) => `보드테스트-${Date.now()}-${index}`);

    for (const name of issuedNames) {
      await issueTicket(issuePage, name);
      await expect(boardPage.getByTestId('ticket-board-item').filter({ hasText: name })).toBeVisible({ timeout: 15000 });
    }

    const viewport = boardPage.getByTestId('ticket-board-viewport');
    await expect.poll(async () => viewport.evaluate((node) => node.scrollHeight > node.clientHeight)).toBe(true);

    expect(boardConsole.some((msg) => msg.includes('[Lotto645][list:subscribe]'))).toBe(true);
    expect(boardConsole.some((msg) => msg.includes('[Lotto645][list:update]'))).toBe(true);

    await context.close();
  });
});
