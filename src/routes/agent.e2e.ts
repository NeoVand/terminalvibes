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

	test('offers the local model download with the size disclosed (never auto-starts)', async ({
		page
	}) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');

		// Both models offered side by side, sizes disclosed on the cards.
		const smallCard = panel.locator('.agent-model-tan');
		const bigCard = panel.locator('.agent-model-amber');
		await expect(smallCard).toBeVisible();
		await expect(smallCard).toContainText('Qwen3.5 0.8B');
		await expect(smallCard).toContainText('~450 MB');
		await expect(bigCard).toBeVisible();
		await expect(bigCard).toContainText('Qwen3.5 2B');
		await expect(bigCard).toContainText('1.3 GB');

		// Each card carries its OWN download button with the size on it —
		// download gates activation, and only an explicit click starts it
		// (which CI must never do).
		const smallDl = smallCard.getByRole('button', { name: /Download · 450 MB/ });
		await expect(smallDl).toBeVisible();
		await expect(bigCard.getByRole('button', { name: /Download · 1\.3 GB/ })).toBeVisible();
		await expect(panel.getByText('runs entirely in your browser')).toBeVisible();

		// Dismissing keeps the scripted guide working.
		await panel.getByRole('button', { name: 'Use scripted mode' }).click();
		await expect(smallDl).not.toBeVisible();
	});

	test('header gear opens the settings popover with the model picker', async ({ page }) => {
		await page.goto('/');

		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');

		await panel.getByRole('button', { name: 'Agent settings' }).click();
		const settings = page.getByRole('dialog', { name: 'Agent settings' });
		await expect(settings).toBeVisible();
		await expect(settings.getByText('Model')).toBeVisible();
		await expect(settings.locator('.agent-model-tan')).toContainText('Qwen3.5 0.8B');
		await expect(settings.locator('.agent-model-amber')).toContainText('Qwen3.5 2B');
		await expect(
			settings.locator('.agent-model-tan').getByRole('button', { name: /Download · 450 MB/ })
		).toBeVisible();

		await page.getByRole('button', { name: 'Close settings' }).click();
		await expect(settings).not.toBeVisible();
	});
});
