import { expect, test } from '@playwright/test';

test.describe('Agent panel', () => {
	test('opens from the header, answers with a citation chip, closes on ESC', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');
		await expect(panel).toHaveAttribute('aria-hidden', 'false');

		const input = page.getByLabel('Ask the agent');
		await input.fill('what does chmod 755 mean');
		await input.press('Enter');

		// The mock streams word by word; the citation chip is the last thing
		// to render, so waiting for it covers the whole answer.
		const chip = panel.locator('a[href="#section-5-2"]');
		await expect(chip).toBeVisible({ timeout: 15000 });
		await expect(chip).toContainText('5.2 chmod');

		// Citation chips navigate to the section without closing the panel.
		await chip.click();
		await expect(page).toHaveURL(/#section-5-2/);
		await expect(panel).toHaveAttribute('aria-hidden', 'false');

		await page.keyboard.press('Escape');
		await expect(panel).toHaveAttribute('aria-hidden', 'true');
	});

	test('is mutually exclusive with the playground panel', async ({ page }) => {
		await page.goto('/');

		const agentPanel = page.locator('aside[aria-label="Agent"]');
		const playgroundPanel = page.locator('aside[aria-label="Terminal Playground"]');

		await page.getByRole('button', { name: 'Open Terminal Playground' }).click();
		await expect(playgroundPanel).toHaveAttribute('aria-hidden', 'false');

		await page.getByRole('button', { name: 'Open Agent' }).click();
		await expect(agentPanel).toHaveAttribute('aria-hidden', 'false');
		await expect(playgroundPanel).toHaveAttribute('aria-hidden', 'true');

		await page.getByRole('button', { name: 'Open Terminal Playground' }).click();
		await expect(playgroundPanel).toHaveAttribute('aria-hidden', 'false');
		await expect(agentPanel).toHaveAttribute('aria-hidden', 'true');
	});

	test('shows starter chips and the honest scripted-guide notice', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');

		await expect(panel.getByText(/scripted guide/i)).toBeVisible();
		await expect(panel.getByRole('button', { name: 'How do pipes work?' })).toBeVisible();

		await panel.getByRole('button', { name: 'How do pipes work?' }).click();
		await expect(panel.locator('[data-role="assistant"]').first()).toContainText(/pipe/i, {
			timeout: 15000
		});
	});
});
