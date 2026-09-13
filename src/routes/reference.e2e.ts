import { expect, test, type Page } from '@playwright/test';

async function ready(page: Page, path = '/') {
	await page.goto(path);
	await expect(page.getByLabel('Your command', { exact: true })).toBeEnabled();
}

async function watchClipboard(page: Page) {
	await page.addInitScript(() => {
		const writes: string[] = [];
		Object.defineProperty(window, '__referenceCopies', { value: writes });
		Object.defineProperty(navigator, 'clipboard', {
			value: {
				writeText: async (value: string) => {
					writes.push(value);
				}
			}
		});
	});
}

async function clipboardWrites(page: Page): Promise<string[]> {
	return page.evaluate(
		() => (window as unknown as { __referenceCopies: string[] }).__referenceCopies
	);
}

test('the first reference contains only the first lesson’s commands', async ({ page }) => {
	await ready(page);
	const panel = page.getByRole('complementary', { name: 'Terminal cheat sheet' });
	await expect(panel).toHaveCount(0);
	const opener = page.getByRole('button', { name: 'Terminal Cheat Sheet', exact: true });
	await opener.click();
	await expect(panel.getByLabel('Find a command or shortcut')).toBeFocused();
	await expect(panel.locator('[data-reference-id]')).toHaveCount(3);
	expect(
		await panel
			.locator('[data-reference-id]')
			.evaluateAll((rows) => rows.map((row) => row.getAttribute('data-reference-id')).sort())
	).toEqual(['key-cancel', 'key-history', 'say-hello']);
	await page.keyboard.press('Escape');
	await expect(panel).toHaveCount(0);
	await expect(opener).toBeFocused();
});

test('placeholder commands must be completed before they can be copied', async ({ page }) => {
	await watchClipboard(page);
	await ready(page);
	await page.getByRole('button', { name: 'Terminal Cheat Sheet', exact: true }).click();
	const panel = page.getByRole('complementary', { name: 'Terminal cheat sheet' });
	await panel.getByLabel('Find a command or shortcut').fill('cat');
	await panel.locator('[data-reference-id="read-file"]').click();
	const draft = panel.getByLabel('Your completed command');
	await expect(draft).toBeFocused();
	await expect(draft).toHaveValue('cat <file>');
	await expect(panel.getByRole('button', { name: 'Copy command', exact: true })).toBeDisabled();
	expect(await clipboardWrites(page)).toEqual([]);
	await draft.fill('cat "my garden notes.txt"');
	await panel.getByRole('button', { name: 'Copy command', exact: true }).click();
	await expect(panel.getByRole('status')).toHaveText('Copied your completed command.');
	expect(await clipboardWrites(page)).toEqual(['cat "my garden notes.txt"']);
});

test('expanded reference contains keyboard focus and returns it on Escape', async ({ page }) => {
	await ready(page);
	await page.getByRole('button', { name: 'Terminal Cheat Sheet', exact: true }).click();
	const expander = page.getByRole('button', { name: 'Expand cheat sheet' });
	await expander.click();
	const modal = page.getByRole('dialog', { name: 'Terminal cheat sheet' });
	await expect(modal.getByLabel('Find a command or shortcut')).toBeFocused();
	await modal.getByLabel('Find a command or shortcut').fill('no such command xyzzy');
	await expect(modal.getByText('No commands match your search.')).toBeVisible();
	await page.keyboard.press('Tab');
	await expect(
		modal.getByRole('button', { name: "Show only this exercise's commands" })
	).toBeFocused();
	await page.keyboard.press('Shift+Tab');
	await expect(modal.getByLabel('Find a command or shortcut')).toBeFocused();
	await page.keyboard.press('Escape');
	await expect(modal).toHaveCount(0);
	await expect(expander).toBeFocused();
	await expect(page.getByRole('complementary', { name: 'Terminal cheat sheet' })).toBeVisible();
});

for (const width of [1440, 390]) {
	test(`intent search opens keyboard practice without copying shortcuts at ${width}px`, async ({
		page
	}) => {
		await page.setViewportSize({ width, height: 900 });
		await watchClipboard(page);
		await ready(page);
		await page.getByRole('button', { name: 'Terminal Cheat Sheet', exact: true }).click();
		const panel = page.getByRole('complementary', { name: 'Terminal cheat sheet' });
		await panel.getByLabel('Find a command or shortcut').fill('delete a whole line');
		const result = panel.locator('[data-reference-id="key-whole-line"]');
		await expect(result).toBeVisible();
		await expect(panel.locator('[data-reference-kind]')).toHaveCount(1);
		await result.click();
		await expect(page).toHaveURL(/#keyboard-workshop$/);
		await expect(page.locator('#keyboard-workshop')).toBeFocused();
		await expect(panel).toHaveCount(0);
		await expect(page.getByRole('button', { name: 'Close cheat sheet', exact: true })).toHaveCount(
			0
		);
		expect(await clipboardWrites(page)).toEqual([]);
	});
}

test('deep links, sidebar and search reveal optional explanations', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await ready(page, '/#prompt-loop');
	await expect(page.locator('#section-intro-anatomy')).toHaveAttribute('open', '');
	await expect(page.locator('#prompt-loop')).toBeInViewport();
	await ready(page);
	await expect(page.locator('#section-intro-history')).not.toHaveAttribute('open');
	await page.getByRole('button', { name: 'Start Here sections', exact: true }).click();
	await page
		.locator('.sidebar-panel')
		.getByRole('button', { name: 'Why Written Commands?', exact: true })
		.click();
	await expect(page.locator('#section-intro-history')).toHaveAttribute('open', '');
	await expect(page.locator('#section-intro-history')).toBeInViewport();
	await expect(page.locator('#section-intro-history')).toBeFocused();
	const search = page.getByRole('textbox', { name: 'Search commands', exact: true });
	await search.fill('dollar sign');
	await expect(page.getByRole('listbox', { name: 'Search results' })).toBeVisible();
	await search.press('Enter');
	await expect(page.locator('#section-intro-anatomy')).toHaveAttribute('open', '');
	await expect(page.locator('#section-intro-anatomy')).toBeFocused();
	await expect(page.getByRole('listbox', { name: 'Search results' })).toHaveCount(0);
});

test('mobile course search accepts a plain-language keyboard question', async ({ page }) => {
	await page.setViewportSize({ width: 390, height: 844 });
	await ready(page);
	await page.locator('.search-input-wrapper').click();
	const search = page.getByRole('textbox', { name: 'Search commands', exact: true });
	await search.fill('delete a whole line');
	await expect(page.getByRole('listbox', { name: 'Search results' })).toBeVisible();
	await search.press('Enter');
	await expect(page).toHaveURL(/#keyboard-workshop$/);
	await expect(page.locator('#keyboard-workshop')).toBeFocused();
});

test('native page-scrolling keys resume reading context after a section jump', async ({ page }) => {
	await page.setViewportSize({ width: 1440, height: 900 });
	await ready(page, '/#section-intro-history');
	await expect(page.locator('#section-intro-history')).toBeInViewport();
	await page.keyboard.press('Home');
	await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
	await page.getByRole('button', { name: 'Terminal Cheat Sheet', exact: true }).click();
	const panel = page.getByRole('complementary', { name: 'Terminal cheat sheet' });
	await expect(panel.locator('[data-reference-id]')).toHaveCount(3);
	await expect(panel.locator('[data-reference-id="say-hello"]')).toBeVisible();
});
