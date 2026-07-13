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

	test('gated demo: DENY runs nothing, ALLOW executes into the agent terminal', async ({
		page
	}) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');
		const input = page.getByLabel('Ask the agent');
		const terminal = panel.locator('[data-testid="agent-terminal"]');
		const card = panel.locator('[data-testid="approval-card"]');

		// ── Turn 1: deny everything — the sandbox must stay untouched. ──
		await input.fill('demo: pipes');
		await input.press('Enter');
		await expect(card).toBeVisible({ timeout: 15000 });
		await expect(panel.locator('[data-testid="approval-cmd"]')).toContainText('printf');
		await card.getByRole('button', { name: /Deny/ }).click();
		await expect(panel.locator('[data-testid="approval-cmd"]')).toContainText('sort', {
			timeout: 15000
		});
		await card.getByRole('button', { name: /Deny/ }).click();
		await expect(panel.getByText(/nothing was run/i)).toBeVisible({ timeout: 15000 });
		await expect(terminal).toHaveCount(0);

		// ── Turn 2: approve everything — commands + output land in the terminal. ──
		await panel.getByRole('button', { name: 'Send question' }).waitFor({ timeout: 15000 });
		await input.fill('demo: pipes');
		await input.press('Enter');
		await expect(card).toBeVisible({ timeout: 15000 });
		await card.getByRole('button', { name: /Allow/ }).click();
		await expect(card.locator('[data-testid="approval-cmd"]')).toContainText('sort', {
			timeout: 15000
		});
		await card.getByRole('button', { name: /Allow/ }).click();

		await expect(terminal).toBeVisible({ timeout: 15000 });
		await expect(terminal).toContainText('sort letters.txt | uniq -c');
		await expect(terminal).toContainText('2 a');
		await expect(terminal).toContainText('1 b');

		// The wrap-up answer carries a Sources row of chips.
		const sources = panel.locator('.agent-sources').last();
		await expect(sources).toBeVisible({ timeout: 15000 });
		await expect(sources).toContainText('Sources');
		await expect(sources.locator('a[href="#section-4-2"]')).toBeVisible();
	});

	test('teaching answers render markdown with a code block and a sources row', async ({ page }) => {
		await page.goto('/');
		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');

		await panel.getByRole('button', { name: 'How do pipes work?' }).click();
		const answer = panel.locator('[data-role="assistant"]').first();
		// The fenced example renders as a real code block, tokenized.
		await expect(answer.locator('pre.agent-md-code')).toBeVisible({ timeout: 15000 });
		await expect(answer.locator('pre.agent-md-code')).toContainText('grep ERROR');
		// Citations live in the sources row, not mid-sentence.
		await expect(answer).not.toContainText('[[section');
		await expect(answer.locator('.agent-sources')).toContainText('Sources');
	});

	test('downloaded flag means chat — no intro banner, no cards in the chat area', async ({
		page
	}) => {
		// First run: the intro banner + model cards ARE the chat area's empty state.
		await page.goto('/');
		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');
		await expect(panel.locator('[data-testid="agent-intro"]')).toBeVisible();

		// Downloaded (flag only, nothing selected → no auto-warm, no network):
		// the banner and cards never render again; models live behind the gear.
		await page.evaluate(() =>
			localStorage.setItem(
				'tv-agent-downloaded',
				JSON.stringify(['onnx-community/Qwen3.5-0.8B-Text-ONNX'])
			)
		);
		await page.reload();
		await page.getByRole('button', { name: 'Open Agent' }).click();
		await expect(panel.locator('[data-testid="agent-intro"]')).toHaveCount(0);
		await expect(panel.locator('.agent-model-card')).toHaveCount(0);

		// The gear still offers the model management.
		await panel.getByRole('button', { name: 'Agent settings' }).click();
		const settings = page.getByRole('dialog', { name: 'Agent settings' });
		await expect(settings.locator('.agent-model-card')).toHaveCount(2);
		await expect(
			settings.locator('.agent-model-tan').getByRole('button', { name: 'Use this model' })
		).toBeVisible();
	});
});
