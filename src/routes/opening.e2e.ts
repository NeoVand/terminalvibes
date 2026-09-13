import { expect, test } from '@playwright/test';

for (const viewport of [
	{ width: 1440, height: 900 },
	{ width: 390, height: 844 },
	{ width: 360, height: 640 }
]) {
	test(`first command is visible without scrolling at ${viewport.width}px`, async ({ page }) => {
		await page.setViewportSize(viewport);
		await page.goto('/');
		const input = page.getByLabel('Your command', { exact: true });
		await expect(input).toBeEnabled();
		const box = await input.boundingBox();
		expect(box).not.toBeNull();
		expect(box!.y).toBeGreaterThan(0);
		expect(box!.y + box!.height).toBeLessThan(viewport.height);
		const hero = await page
			.locator('#hero')
			.evaluate((el) => ({ width: el.clientWidth, scrollWidth: el.scrollWidth }));
		expect(hero.scrollWidth).toBeLessThanOrEqual(hero.width);
	});
}

test('first lesson runs real commands, repairs a typo, and discards an unrun draft', async ({
	page
}) => {
	await page.goto('/');
	const lesson = page.getByTestId('first-command');
	const input = lesson.getByLabel('Your command', { exact: true });
	await expect(input).toBeEnabled();
	await input.fill('echo "Hello, world!"');
	await input.press('Enter');
	await expect(lesson.getByRole('heading', { name: 'Make it yours' })).toBeVisible();
	await expect(lesson.locator('pre').last()).toHaveText('Hello, world!');

	await input.fill('echo "My sunflower notebook"');
	await input.press('Enter');
	await expect(lesson.getByRole('heading', { name: 'Try a small typo' })).toBeVisible();
	await expect(lesson.locator('pre').last()).toHaveText('My sunflower notebook');

	await input.fill('ech "Hello again"');
	await input.press('Enter');
	await expect(lesson.getByRole('heading', { name: 'Repair your command' })).toBeVisible();
	await expect(lesson.locator('pre').last()).toContainText('command not found');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('ech "Hello again"');
	await input.press('Control+a');
	await input.press('ArrowRight');
	await input.press('ArrowRight');
	await input.press('ArrowRight');
	await input.press('o');
	await input.press('Enter');
	await expect(lesson.getByRole('heading', { name: 'Change your mind' })).toBeVisible();
	await expect(lesson.locator('pre').last()).toHaveText('Hello again');

	await input.fill('echo "This must never run"');
	await input.press('Control+c');
	await expect(input).toHaveValue('');
	await expect(lesson.getByText('First steps complete', { exact: true })).toBeVisible();
	await expect(lesson.getByRole('log')).not.toContainText('This must never run');
	await expect(lesson.getByRole('link', { name: /Next: get comfortable/ })).toHaveAttribute(
		'href',
		'#keyboard-workshop'
	);
	await lesson.getByRole('button', { name: 'Practise these first steps again' }).click();
	await expect(lesson.getByRole('heading', { name: 'Make it say hello' })).toBeVisible();
	await expect(input).toHaveValue('');
	await expect(lesson.getByRole('log')).toHaveCount(0);
});

test('line editing keeps focus, preserves a draft, and does not trap Tab', async ({ page }) => {
	await page.goto('/');
	const input = page.getByLabel('Your command', { exact: true });
	await expect(input).toBeEnabled();
	await input.fill('echo old');
	await input.press('Enter');
	await expect(input).toBeEnabled();
	await input.fill('unfinished draft');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('echo old');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('unfinished draft');
	await input.press('Control+a');
	await input.press('Control+k');
	await expect(input).toHaveValue('');
	await expect(input).toBeFocused();
	await input.press('Control+y');
	await expect(input).toHaveValue('unfinished draft');
	await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(0, 10));
	await input.press('Control+c');
	await expect(input).toHaveValue('unfinished draft');
	await input.press('Shift+Tab');
	await expect(input).not.toBeFocused();
});
