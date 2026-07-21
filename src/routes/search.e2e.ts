import { expect, test } from '@playwright/test';

/**
 * Scope every option lookup to the search dropdown by name. The header's
 * Thread rail is also a listbox, and its bars carry the section titles — so a
 * bare getByRole('option', { name: /grep/i }) resolves to the rail's "4.3
 * Searching Text — grep" bar, not to a search result.
 */
const results = (page: import('@playwright/test').Page) =>
	page.getByRole('listbox', { name: 'Search results' });

test.describe('Command search', () => {
	test('finds chmod commands instead of chapter titles', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search');
		await search.focus();
		await search.fill('chmod');

		await expect(results(page).getByRole('option', { name: /chmod/i }).first()).toBeVisible();
	});

	test('navigates to the grep lesson from search', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search');
		await search.fill('grep');
		await results(page).getByRole('option', { name: /grep/i }).first().click();

		await expect(page).toHaveURL(/#section-4-/, { timeout: 5000 });
	});

	test('shows empty state for nonsense queries', async ({ page }) => {
		await page.goto('/');

		const search = page.getByPlaceholder('Search');
		await search.fill('xyzzynotacommand');
		await expect(page.getByText(/No commands match/)).toBeVisible();
	});
});
