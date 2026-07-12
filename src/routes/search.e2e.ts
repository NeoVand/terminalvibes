import { expect, test } from '@playwright/test';

test.describe('Command search', () => {
	test('finds chmod commands instead of chapter titles', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search commands...');
		await search.focus();
		await search.fill('chmod');

		await expect(page.getByRole('option', { name: /chmod/i }).first()).toBeVisible();
	});

	test('navigates to the grep lesson from search', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search commands...');
		await search.fill('grep');
		await page.getByRole('option', { name: /grep/i }).first().click();

		await expect(page).toHaveURL(/#section-4-/, { timeout: 5000 });
	});

	test('shows empty state for nonsense queries', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search commands...');
		await search.fill('xyzzynotacommand');
		await expect(page.getByText(/No commands match/)).toBeVisible();
	});
});
