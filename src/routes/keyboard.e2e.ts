import { expect, test } from '@playwright/test';

async function openTerminal(page: import('@playwright/test').Page) {
	await page.goto('/');
	// Wait for hydration before clicking a header control rendered by SSR.
	await expect(page.locator('#keyboard-practice-input')).toBeEnabled({ timeout: 15000 });
	await page.getByLabel('Open Terminal Playground').click();
	const panel = page.getByRole('complementary', { name: 'Terminal Playground' });
	const input = panel.getByLabel('Shell command');
	await expect(input).toBeEnabled({ timeout: 15000 });
	return { panel, input };
}

test('terminal editing shortcuts do not trigger global search or trap focus', async ({ page }) => {
	const { input } = await openTerminal(page);
	await input.fill('echo draft');
	await input.press('Control+c');
	await expect(input).toHaveValue('');
	await input.fill('echo tea and cake');
	await input.press('Control+a');
	await input.press('ArrowRight');
	await input.press('Control+k');
	await expect(input).toHaveValue('e');
	await expect(input).toBeFocused();
	await input.press('Control+y');
	await expect(input).toHaveValue('echo tea and cake');
	await input.press('Control+u');
	await expect(input).toHaveValue('');
	await input.press('Shift+Tab');
	await expect(input).not.toBeFocused();
	await input.focus();
	await input.press('Escape');
	await input.press('Tab');
	await expect(input).not.toBeFocused();
});

test('history retains drafts and completion handles spaces, cursor position, and choices', async ({
	page
}) => {
	const { input, panel } = await openTerminal(page);
	await input.fill('echo first');
	await input.press('Enter');
	await input.fill('unfinished');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('echo first');
	await input.press('ArrowDown');
	await expect(input).toHaveValue('unfinished');
	await input.fill('clear');
	await input.press('Enter');
	await input.press('ArrowUp');
	await expect(input).toHaveValue('clear');
	await input.fill('touch "garden notes.txt" "garden story.txt"');
	await input.press('Enter');
	await input.fill('cat "garden n');
	await input.press('Tab');
	await expect(input).toHaveValue('cat "garden notes.txt" ');
	await input.fill('cat gar');
	await input.press('Tab');
	await expect(panel.getByRole('status').filter({ hasText: 'More than one match' })).toBeVisible();
	await input.fill('echo hi | ec extra');
	await input.evaluate((el: HTMLInputElement) => el.setSelectionRange(12, 12));
	await input.press('Tab');
	await expect(input).toHaveValue('echo hi | echo extra');
});

test('keyboard workshop teaches all seven moves and identifies demonstrations honestly', async ({
	page
}) => {
	await page.goto('/#keyboard-workshop');
	const workshop = page.locator('#keyboard-workshop');
	const input = workshop.getByLabel('Try here — this is an editable practice line');
	await expect(input).toBeEnabled({ timeout: 15000 });
	await input.focus();
	await input.press('Control+a');
	await expect(workshop.getByText('At the beginning.', { exact: false })).toBeVisible();
	await workshop.getByRole('button', { name: 'Next small move' }).click();
	await input.press('Control+e');
	await workshop.getByRole('button', { name: 'Next small move' }).click();
	await input.press('Control+w');
	await expect(input).toHaveValue('echo ');
	await input.pressSequentially('green');
	await input.press('Enter');
	await expect(workshop.getByText('You replaced a word', { exact: false })).toBeVisible();
	for (let i = 0; i < 4; i++) {
		await workshop.getByRole('button', { name: 'Next small move' }).click();
		await workshop.getByRole('button', { name: /^Show me/ }).click();
	}
	await expect(workshop.getByText('7 explored')).toBeVisible();
	await expect(workshop.getByText('You watched a demonstration.', { exact: false })).toBeVisible();
	await expect(workshop.getByText('You have a way forward', { exact: false })).toBeVisible();
});
