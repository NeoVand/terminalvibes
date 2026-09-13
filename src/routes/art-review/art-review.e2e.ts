import { test, expect, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import sharp from 'sharp';

const devReview = !!process.env.ART_REVIEW_DEV;
const originalImage = readFileSync('static/images/Hero.webp');
const hash = createHash('sha256').update(originalImage).digest('hex');

async function candidates(page: Page, conceptIds = ['keyboard-line-editing']) {
	const metadata = await sharp(originalImage).metadata();
	const files = conceptIds.flatMap((conceptId) =>
		Array.from({ length: 5 }, (_, index) => ({
			path: `art-candidates/${conceptId}/0${index + 1}.webp`,
			sha256: hash,
			bytes: originalImage.length,
			width: metadata.width,
			height: metadata.height
		}))
	);
	await page.route('**/art-candidates/availability.json', (route) =>
		route.fulfill({ json: { schemaVersion: 1, files } })
	);
	// Existing art is a test fixture only. No fake candidate is written to the project.
	await page.route('**/art-candidates/*/*.webp?*', (route) =>
		route.fulfill({ contentType: 'image/webp', body: originalImage })
	);
	return files;
}

test('published artwork route contains only the local-workspace notice', async ({ page }) => {
	test.skip(devReview, 'This assertion is for the static production build.');
	await page.goto('/art-review');
	await expect(page.getByRole('heading', { name: 'Artwork review is local' })).toBeVisible();
	await expect(page.getByRole('link', { name: 'Return to the course' })).toHaveAttribute(
		'href',
		'/'
	);
	await expect(page.getByRole('group', { name: 'Compare five alternatives' })).toHaveCount(0);
});

test.describe('local artwork review', () => {
	test.skip(
		!devReview,
		'The gallery is intentionally absent from production; run with ART_REVIEW_DEV=1 on a dev server.'
	);
	test('missing alternatives are explicit, disabled, and filterable', async ({ page }) => {
		await page.route('**/art-candidates/availability.json', (route) =>
			route.fulfill({ status: 404 })
		);
		await page.goto('/art-review');
		await expect(page.getByRole('group', { name: 'Compare five alternatives' })).toBeVisible();
		await expect(page.getByText('Not generated', { exact: true })).toHaveCount(5);
		for (let index = 1; index <= 5; index++)
			await expect(page.getByRole('button', { name: `Choose 0${index}` })).toBeDisabled();
		await page.getByRole('searchbox', { name: 'Find a concept' }).fill('draft');
		await expect(page.getByRole('heading', { name: 'Edit, save, read it back' })).toBeVisible();
		await expect(page.getByRole('link', { name: 'Read this lesson' })).toHaveAttribute(
			'href',
			'/#edit-notes'
		);
	});
	test('an explicit choice survives reload and exports its exact file hash and notes', async ({
		page
	}) => {
		await candidates(page);
		await page.goto('/art-review');
		await expect(page.getByRole('button', { name: 'Choose 03' })).toBeEnabled();
		await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(0);
		await page.getByRole('button', { name: 'Choose 03' }).click();
		await page
			.getByRole('textbox', { name: 'Your notes' })
			.fill('Keep this palette and the complete frame.');
		await page.reload();
		await expect(page.getByRole('button', { name: '✓ Chosen' })).toHaveAttribute(
			'aria-pressed',
			'true'
		);
		await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue(
			'Keep this palette and the complete frame.'
		);
		const download = page.waitForEvent('download');
		await page.getByRole('button', { name: 'Export choices' }).click();
		const path = await (await download).path();
		const exported = JSON.parse(readFileSync(path!, 'utf8'));
		expect(exported.selections).toHaveLength(1);
		expect(exported.selections[0]).toMatchObject({
			variant: '03',
			sha256: hash,
			verifiedAgainstCurrentFile: true,
			candidatePath: 'art-candidates/keyboard-line-editing/03.webp'
		});
	});
	test('requests changes without approving and clears local decisions', async ({ page }) => {
		await candidates(page);
		await page.goto('/art-review');
		await page.getByRole('button', { name: 'Request changes' }).click();
		await expect(page.getByRole('textbox', { name: 'Your notes' })).toBeFocused();
		await page
			.getByRole('textbox', { name: 'Your notes' })
			.fill('Alternative 02 needs a clearer cursor.');
		await page.getByRole('button', { name: 'Request changes' }).click();
		await expect(page.locator('.status-badge')).toHaveText('Changes requested');
		await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(0);
		await page.getByRole('button', { name: 'Clear choice & notes' }).click();
		await expect(page.getByRole('textbox', { name: 'Your notes' })).toHaveValue('');
		await expect(page.locator('.status-badge')).toHaveText('Not chosen');
	});
	test('mobile preview keeps the whole frame and Escape returns focus; replaced bytes invalidate a choice', async ({
		page
	}) => {
		const files = await candidates(page);
		await page.setViewportSize({ width: 390, height: 844 });
		await page.goto('/art-review');
		const opener = page.getByRole('button', {
			name: 'Preview Alternative 1: Fix a line without starting over'
		});
		await opener.click();
		await expect(page.getByRole('dialog')).toBeVisible();
		await expect(page.getByRole('dialog').locator('img')).toHaveCSS('object-fit', 'contain');
		await page.keyboard.press('Escape');
		await expect(page.getByRole('dialog')).not.toBeVisible();
		await expect(opener).toBeFocused();
		expect(
			await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)
		).toBe(true);
		await page.getByRole('button', { name: 'Choose 01' }).click();
		files[0].sha256 = 'b'.repeat(64);
		await page.getByRole('button', { name: 'Refresh images' }).click();
		await expect(page.getByRole('alert')).toContainText('chosen file has changed or is missing');
		await expect(page.locator('button[aria-pressed="true"]')).toHaveCount(0);
	});
	test('preview arrows cycle alternatives without changing choices and skip missing images', async ({
		page
	}) => {
		const files = await candidates(page);
		await page.goto('/art-review');
		await page.getByRole('button', { name: 'Choose 03' }).click();
		const saved = await page.evaluate(() => localStorage.getItem('tv-art-review-selections-v1'));
		const opener = page.getByRole('button', {
			name: 'Preview Alternative 1: Fix a line without starting over'
		});
		const dialog = page.getByRole('dialog');
		const image = dialog.locator('img');
		await opener.click();
		await page.keyboard.press('ArrowRight');
		await expect(image).toHaveAttribute('src', /\/02\.webp\?/);
		await expect(dialog.getByRole('status')).toContainText('2 of 5');
		await page.keyboard.press('ArrowLeft');
		await expect(image).toHaveAttribute('src', /\/01\.webp\?/);
		await page.keyboard.press('ArrowLeft');
		await expect(image).toHaveAttribute('src', /\/05\.webp\?/);
		await page.keyboard.press('ArrowRight');
		await expect(image).toHaveAttribute('src', /\/01\.webp\?/);
		await dialog.getByRole('button', { name: 'Next image' }).click();
		await expect(image).toHaveAttribute('src', /\/02\.webp\?/);
		await dialog.getByRole('button', { name: 'Previous image' }).click();
		await expect(image).toHaveAttribute('src', /\/01\.webp\?/);
		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
		await expect(opener).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(dialog).not.toBeVisible();
		expect(await page.evaluate(() => localStorage.getItem('tv-art-review-selections-v1'))).toBe(
			saved
		);

		files.splice(1, 1);
		await page.getByRole('button', { name: 'Refresh images' }).click();
		await expect(page.getByRole('button', { name: 'Choose 02' })).toBeDisabled();
		await opener.click();
		await page.keyboard.press('ArrowRight');
		await expect(image).toHaveAttribute('src', /\/03\.webp\?/);
		await expect(dialog.getByRole('status')).toContainText('2 of 4');
		await page.keyboard.press('Escape');

		await page.getByText('Current artwork and source references', { exact: true }).click();
		await page.getByRole('button', { name: 'Preview current artwork:' }).click();
		const originalSrc = await image.getAttribute('src');
		await page.keyboard.press('ArrowRight');
		await expect(image).toHaveAttribute('src', originalSrc!);
		await expect(dialog.getByRole('navigation')).toHaveCount(0);
		await expect(dialog.getByRole('button', { name: 'Choose this image' })).toHaveCount(0);
	});
	test('choose and advance keeps the preview open, saves exact choices, and finishes with export', async ({
		page
	}) => {
		// Leave the editor batch unavailable to verify that it is skipped.
		await candidates(page, ['keyboard-line-editing', 'script-arguments', 'script-conditions']);
		await page.goto('/art-review');
		await page.getByRole('textbox', { name: 'Your notes' }).fill('Keep the cursor labels.');
		await page
			.getByRole('combobox', { name: 'Review status', exact: true })
			.selectOption('unreviewed');
		await page
			.getByRole('button', {
				name: 'Preview Alternative 1: Fix a line without starting over'
			})
			.click();
		const dialog = page.getByRole('dialog');
		await page.keyboard.press('ArrowRight');
		await dialog
			.getByRole('button', { name: 'Choose this image and move to the next', exact: true })
			.click();
		await expect(dialog).toBeVisible();
		await expect(dialog.locator('img')).toHaveAttribute('src', /script-arguments\/01\.webp\?/);
		await expect(dialog.getByRole('heading')).toBeFocused();
		await page.keyboard.press('ArrowLeft');
		await dialog
			.getByRole('button', { name: 'Choose this image and move to the next', exact: true })
			.click();
		await expect(dialog.locator('img')).toHaveAttribute('src', /script-conditions\/01\.webp\?/);
		await dialog.getByRole('button', { name: 'Choose this image and finish', exact: true }).click();
		await expect(dialog.getByRole('heading', { name: 'End of this review' })).toBeFocused();
		await page.keyboard.press('ArrowRight');
		await expect(dialog.getByRole('heading', { name: 'End of this review' })).toBeVisible();
		const download = page.waitForEvent('download');
		await dialog.getByRole('button', { name: 'Export choices' }).click();
		const exported = JSON.parse(readFileSync((await (await download).path())!, 'utf8'));
		expect(exported.selections).toHaveLength(3);
		expect(exported.selections[0]).toMatchObject({
			candidatePath: 'art-candidates/keyboard-line-editing/02.webp',
			variant: '02',
			sha256: hash,
			note: 'Keep the cursor labels.',
			verifiedAgainstCurrentFile: true
		});
		expect(exported.selections[1].candidatePath).toBe('art-candidates/script-arguments/05.webp');
		expect(exported.selections[2].candidatePath).toBe('art-candidates/script-conditions/01.webp');
		await page.keyboard.press('Escape');
		await expect(dialog).not.toBeVisible();
		await expect(page.locator('#art-concept-picker')).toBeFocused();
		await page.reload();
		await expect(page.getByLabel('Review progress')).toContainText('3 chosen');
	});
});
