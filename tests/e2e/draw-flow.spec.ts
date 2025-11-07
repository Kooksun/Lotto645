import { expect, test } from '@playwright/test';

const ISSUE_URL = '/issue';
const DRAW_URL = '/draw';

const COVERAGE_TICKETS = [
  [1, 2, 3, 4, 5, 6],
  [7, 8, 9, 10, 11, 12],
  [13, 14, 15, 16, 17, 18],
  [19, 20, 21, 22, 23, 24],
  [25, 26, 27, 28, 29, 30],
  [31, 32, 33, 34, 35, 36],
  [37, 38, 39, 40, 41, 42],
  [43, 44, 45, 1, 2, 3]
];

async function issueTicket(page, name: string, numbers: number[]): Promise<void> {
  await page.goto(ISSUE_URL);
  await page.getByTestId('player-name-input').fill(name);

  for (const number of numbers) {
    const button = page.getByTestId(`number-button-${number}`);
    const pressed = await button.getAttribute('aria-pressed');
    if (pressed !== 'true') {
      await button.click();
    }
  }

  await expect(page.getByTestId('issue-ticket-button')).toBeEnabled();
  await page.getByTestId('issue-ticket-button').click();
  await expect(page.getByTestId('ticket-issue-toast')).toContainText('발행');
}

test.describe('Draw flow (spec)', () => {
  test('runs draw, highlights numbers, and resets the session', async ({ browser }) => {
    const context = await browser.newContext();
    const hostPage = await context.newPage();
    await hostPage.goto(DRAW_URL);

    const initialResetButton = hostPage.getByTestId('draw-reset-button');
    if (await initialResetButton.isEnabled()) {
      await initialResetButton.click();
      await expect(hostPage.getByTestId('ticket-board-empty')).toBeVisible({ timeout: 20000 });
    }

    const issuerPage = await context.newPage();

    for (const [index, numbers] of COVERAGE_TICKETS.entries()) {
      await issueTicket(issuerPage, `draw-${index}`, numbers);
    }

    const consoleMessages: string[] = [];
    hostPage.on('console', (message) => {
      consoleMessages.push(message.text());
    });

    await hostPage.bringToFront();
    await expect(hostPage.getByTestId('draw-start-button')).toBeEnabled();
    await hostPage.getByTestId('draw-start-button').click();

    const controllerLabel = hostPage.getByTestId('draw-controller-label');
    await expect(controllerLabel).not.toHaveText('—', { timeout: 15000 });

    await expect(hostPage.getByTestId('roulette-wheel')).toHaveAttribute('data-status', /in_progress|completed/, {
      timeout: 10000
    });

    const nextButton = hostPage.getByTestId('draw-next-button');
    for (let step = 0; step < 6; step += 1) {
      await expect(nextButton).toBeEnabled({ timeout: 15000 });
      await nextButton.click();
    }

    await expect(nextButton).toBeDisabled();

    const timelineEntries = hostPage.getByTestId('draw-timeline-entry');
    await expect(timelineEntries).toHaveCount(6);
    await expect(timelineEntries.nth(5)).toHaveAttribute('data-status', /complete|active/);

    await expect
      .poll(async () => hostPage.locator('[data-testid="ticket-number-chip"] .is-matched').count())
      .toBeGreaterThan(0);

    const resetButton = hostPage.getByTestId('draw-reset-button');
    await expect(resetButton).toBeEnabled();
    await resetButton.click();

    await expect(hostPage.getByTestId('ticket-board-empty')).toBeVisible({ timeout: 20000 });

    await expect
      .poll(() => consoleMessages.some((message) => message.includes('[Lotto645][draw:start]')))
      .toBe(true);
    await expect
      .poll(() => consoleMessages.some((message) => message.includes('[Lotto645][draw:complete]')))
      .toBe(true);

    await context.close();
  });
});
