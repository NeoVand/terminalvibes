import { expect, test } from '@playwright/test';

async function runCommand(
	page: import('@playwright/test').Page,
	input: import('@playwright/test').Locator,
	command: string
) {
	await input.fill(command);
	await input.press('Enter');
}

async function openPlaygroundPanel(page: import('@playwright/test').Page) {
	await page.goto('/');
	await page.getByLabel('Open Terminal Playground').click();
	await expect(page.getByRole('complementary', { name: 'Terminal Playground' })).toBeVisible();
}

function playgroundPanel(page: import('@playwright/test').Page) {
	return page.getByRole('complementary', { name: 'Terminal Playground' });
}

test.describe('Terminal Playground', () => {
	test('opens in sidebar and runs pwd', async ({ page }) => {
		await openPlaygroundPanel(page);

		const panel = playgroundPanel(page);
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });

		await runCommand(page, input, 'pwd');
		await expect(panel.getByText('/home/vibe').first()).toBeVisible();
	});

	test('navigates directories and reflects the cwd in the prompt', async ({ page }) => {
		await openPlaygroundPanel(page);
		const panel = playgroundPanel(page);
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });

		await runCommand(page, input, 'mkdir demo');
		await runCommand(page, input, 'cd demo');
		await runCommand(page, input, 'pwd');
		await expect(panel.getByText('/home/vibe/demo').first()).toBeVisible();
	});

	test('pipes and redirection work', async ({ page }) => {
		await openPlaygroundPanel(page);
		const panel = playgroundPanel(page);
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });

		const terminal = panel.locator('.pg-terminal');
		await runCommand(page, input, 'echo hello > greeting.txt');
		await runCommand(page, input, 'cat greeting.txt');
		await expect(terminal.getByText('hello').first()).toBeVisible();

		await runCommand(page, input, 'echo one two | wc -w');
		await expect(terminal.getByText('2').first()).toBeVisible();
	});

	test('scenario switch resets terminal', async ({ page }) => {
		await openPlaygroundPanel(page);
		const panel = playgroundPanel(page);
		const select = panel.locator('select');
		await expect(select).toBeEnabled({ timeout: 15000 });

		await select.selectOption('navigation');
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });
		await runCommand(page, input, 'pwd');
		await expect(panel.getByText('/home/vibe').first()).toBeVisible();
	});

	test('help lists core commands', async ({ page }) => {
		await openPlaygroundPanel(page);
		const panel = playgroundPanel(page);
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });

		await runCommand(page, input, 'help');
		await expect(panel.getByText(/grep/).first()).toBeVisible();
		await expect(panel.getByText(/mkdir/).first()).toBeVisible();
	});

	test('unknown commands teach instead of crash', async ({ page }) => {
		await openPlaygroundPanel(page);
		const panel = playgroundPanel(page);
		const input = panel.getByLabel('Shell command');
		await expect(input).toBeEnabled({ timeout: 15000 });

		await runCommand(page, input, 'frobnicate');
		// Scoped to the terminal: "command not found" is also a scenario title
		// in the (hidden) picker options.
		await expect(
			panel
				.locator('.pg-terminal')
				.getByText(/command not found/)
				.first()
		).toBeVisible();
	});

	test('legacy /playground URL opens sidebar on home', async ({ page }) => {
		await page.goto('/playground');
		await expect(page).toHaveURL(/\/$/);
		await expect(playgroundPanel(page)).toBeVisible({ timeout: 15000 });
	});
});

test.describe('Tutorial', () => {
	test('homepage loads with hero', async ({ page }) => {
		await page.goto('/');
		await expect(
			page.getByRole('heading', { name: /TerminalVibes/, level: 1 }).first()
		).toBeVisible();
	});

	test('playground link in header', async ({ page }) => {
		await page.goto('/');
		await expect(page.getByLabel('Open Terminal Playground')).toBeVisible();
	});

	test('hash deep link scrolls to section', async ({ page }) => {
		await page.goto('/#part-2');
		await expect(page.locator('#part-2')).toBeInViewport({ timeout: 5000 });
	});

	// Lesson playgrounds initialize when scrolled into view, and the page's own
	// deep-link scroll can race a programmatic scroll during hydration — so
	// keep re-scrolling until the playground materializes.
	async function scrollActivityIntoView(
		activity: import('@playwright/test').Locator,
		input: import('@playwright/test').Locator
	) {
		await expect(async () => {
			await activity.scrollIntoViewIfNeeded();
			await expect(input).toBeEnabled({ timeout: 2000 });
		}).toPass({ timeout: 20000 });
	}

	test('lesson activity loads embedded playground', async ({ page }) => {
		await page.goto('/#section-1-2');
		const activity = page.locator('[data-lesson-activity="first-steps"]');
		const input = activity.getByLabel('Shell command');
		await scrollActivityIntoView(activity, input);

		await input.fill('whoami');
		await input.press('Enter');
		await expect(activity.getByText('vibe', { exact: true }).first()).toBeVisible();
	});

	test('log-detective lesson activity loads in part 4', async ({ page }) => {
		await page.goto('/#section-4-3');
		const activity = page.locator('[data-lesson-activity="log-detective"]');
		const input = activity.getByLabel('Shell command');
		await scrollActivityIntoView(activity, input);

		await input.fill('ls');
		await input.press('Enter');
		await expect(input).toBeEnabled();
	});
});
