import { expect, test, type Locator, type Page } from '@playwright/test';

async function openPlayground(page: Page) {
	await page.goto('/');
	await expect(page.getByLabel('Your command', { exact: true })).toBeEnabled();
	await page.getByLabel('Open Terminal Playground').click();
	const panel = page.getByRole('complementary', { name: 'Terminal Playground' });
	await expect(panel.getByLabel('Shell command')).toBeEnabled();
	return panel;
}

async function command(panel: Locator, text: string) {
	const input = panel.getByLabel('Shell command');
	await input.fill(text);
	await input.press('Enter');
	await expect(input).toHaveValue('');
}

async function openFile(panel: Locator, path: string) {
	await panel.getByRole('button', { name: 'Edit a file', exact: true }).click();
	const editor = panel.getByRole('region', { name: 'Practice file editor' });
	await editor.getByLabel('File path', { exact: true }).fill(path);
	await editor.getByRole('button', { name: 'Open or create' }).click();
	return editor;
}

test('graded challenges do not offer direct file editing', async ({ page }) => {
	await page.goto('/#ch-1-read-the-flags');
	const challenge = page.locator('#ch-1-read-the-flags');
	await challenge.scrollIntoViewIfNeeded();
	await expect(challenge.getByLabel('Shell command')).toBeEnabled({ timeout: 15000 });
	await expect(challenge.getByRole('button', { name: 'Edit a file', exact: true })).toHaveCount(0);
});

test('the editing lesson opens the intended file and requires checking the saved result', async ({
	page
}) => {
	const panel = await openPlayground(page);
	await panel.getByLabel('Scenario', { exact: true }).selectOption('edit-notes');
	await expect(panel.getByLabel('Shell command')).toBeEnabled();
	await panel.getByRole('button', { name: 'Edit a file', exact: true }).click();
	const editor = panel.getByRole('region', { name: 'Practice file editor' });
	await expect(editor.getByLabel('File path', { exact: true })).toHaveValue('notes/seeds.txt');
	await editor.getByRole('button', { name: 'Open or create' }).click();
	await expect(editor.getByLabel('File contents')).toHaveValue('basil\nmint\n');
	await editor.getByLabel('File contents').fill('basil\nmint\nthyme\n');
	await editor.getByRole('button', { name: 'Save file', exact: true }).click();
	await expect(editor.getByRole('status')).toContainText('Saved ~/garden-notebook/notes/seeds.txt');
	await editor.getByRole('button', { name: 'Close file editor' }).click();
	await expect(panel.getByText(/Scenario complete/)).toHaveCount(0);
	await command(panel, 'cat notes/seeds.txt');
	await expect(panel.getByText(/Scenario complete/)).toBeVisible();
});

test('file saves share the live filesystem, preserve literal text, and participate in undo/redo', async ({
	page
}) => {
	const panel = await openPlayground(page);
	const editor = await openFile(panel, 'garden notes.txt');
	const text = 'basil\nmint\n$HOME stays literal; "quotes" and \'apostrophes\' too.\n';
	await editor.getByLabel('File contents').fill(text);
	await editor.getByRole('button', { name: 'Save file', exact: true }).click();
	await expect(editor.getByRole('status')).toContainText('Saved ~/garden notes.txt');
	await expect(panel.getByText('garden notes.txt', { exact: true })).toBeVisible();
	await editor.getByRole('button', { name: 'Close file editor' }).click();
	await command(panel, 'cat "garden notes.txt"');
	await expect(panel.locator('.pg-terminal pre').last()).toHaveText(text.trimEnd());
	await command(panel, 'undo'); // Undo the cat inspection first, then the save.
	await command(panel, 'undo');
	await expect(panel.getByText('garden notes.txt', { exact: true })).toHaveCount(0);
	await command(panel, 'redo');
	await command(panel, 'cat "garden notes.txt"');
	await expect(panel.locator('.pg-terminal pre').last()).toHaveText(text.trimEnd());
	await command(panel, 'history');
	await expect(panel.locator('.pg-terminal pre').last()).not.toContainText('$HOME stays literal');
	await command(panel, 'share');
	await expect(
		panel.getByText(/Share links currently replay terminal commands only/)
	).toBeVisible();
});

for (const viewport of [
	{ width: 1440, height: 900 },
	{ width: 390, height: 844 }
]) {
	test(`unsaved drafts survive cancelled close and reset at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		const panel = await openPlayground(page);
		const editor = await openFile(panel, 'notes.txt');
		const contents = editor.getByLabel('File contents');
		await contents.fill('Keep this draft.');
		await contents.press('Escape');
		await expect(editor.getByRole('alert')).toContainText('You have unsaved changes');
		await editor.getByRole('button', { name: 'Keep editing' }).click();
		await expect(contents).toHaveValue('Keep this draft.');
		await expect(contents).toBeFocused();
		await panel.getByRole('button', { name: 'Reset scenario' }).click();
		await editor.getByRole('button', { name: 'Keep editing' }).click();
		await expect(contents).toHaveValue('Keep this draft.');
		await contents.press('Control+s');
		await expect(editor.getByRole('status')).toContainText('Saved ~/notes.txt');
		await contents.fill('Throw away this later change.');
		await editor.getByRole('button', { name: 'Close file editor' }).click();
		await editor.getByRole('button', { name: 'Discard changes and continue' }).click();
		await command(panel, 'cat notes.txt');
		await expect(panel.locator('.pg-terminal pre').last()).toHaveText('Keep this draft.');
		const again = await openFile(panel, 'notes.txt');
		await again.getByLabel('File contents').fill('Another unsaved draft.');
		await panel.getByRole('button', { name: 'Reset scenario' }).click();
		await again.getByRole('button', { name: 'Discard changes and continue' }).click();
		await expect(again).toHaveCount(0);
		await command(panel, 'cat notes.txt');
		await expect(panel.locator('.pg-terminal pre').last()).toContainText('No such file');
	});
}

test('editor errors preserve drafts and respect folders and displayed owner permissions', async ({
	page
}) => {
	const panel = await openPlayground(page);
	await command(panel, 'echo original > locked.txt');
	await command(panel, 'chmod 400 locked.txt');
	const editor = await openFile(panel, 'locked.txt');
	const contents = editor.getByLabel('File contents');
	await expect(contents).toHaveValue('original\n');
	await contents.fill('must not save');
	await editor.getByRole('button', { name: 'Save file', exact: true }).click();
	await expect(editor.getByRole('alert')).toContainText('not writable');
	await expect(contents).toHaveValue('must not save');
	await editor.getByLabel('File path', { exact: true }).fill('missing/notes.txt');
	await editor.getByRole('button', { name: 'Open or create' }).click();
	await expect(editor.getByRole('alert')).toContainText('does not exist');
	await expect(contents).toHaveValue('must not save');
	await editor.getByLabel('File path', { exact: true }).fill('~');
	await editor.getByRole('button', { name: 'Open or create' }).click();
	await expect(editor.getByRole('alert')).toContainText('is a folder');
	await editor.getByRole('button', { name: 'Close file editor' }).click();
	await editor.getByRole('button', { name: 'Discard changes and continue' }).click();
	await command(panel, 'cat locked.txt');
	await expect(panel.locator('.pg-terminal pre').last()).toHaveText('original');
});
