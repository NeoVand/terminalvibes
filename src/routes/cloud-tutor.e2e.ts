import { expect, test, type Locator, type Page } from '@playwright/test';
import catalog from '../lib/ai/cloud/model-catalog.json' with { type: 'json' };

type Provider = 'openai' | 'anthropic';
interface CapturedRequest {
	url: string;
	method: string;
	headers: Record<string, string>;
	body: string;
	aborted: boolean;
}
interface MockPlan {
	text?: string;
	status?: number;
	hold?: boolean;
	toolCommand?: string;
}
declare global {
	interface Window {
		__cloudMock: {
			requests: CapturedRequest[];
			plans: MockPlan[];
			storageWrites: string[];
			release: (index: number) => void;
		};
	}
}
const fakeKey = 'test-browser-session-key-not-a-real-secret';

async function mockProviders(page: Page) {
	// No request may escape to a paid provider, including an unexpected endpoint.
	await page.route(/https:\/\/api\.(openai|anthropic)\.com\//, (route) => route.abort());
	await page.addInitScript(() => {
		const originalFetch = window.fetch.bind(window);
		const finishers = new Map<number, () => void>();
		const state: Window['__cloudMock'] = {
			requests: [],
			plans: [],
			storageWrites: [],
			release: (index) => finishers.get(index)?.()
		};
		window.__cloudMock = state;
		const originalSet = Storage.prototype.setItem;
		Storage.prototype.setItem = function (key, value) {
			state.storageWrites.push(`${key}=${value}`);
			return originalSet.call(this, key, value);
		};
		window.fetch = async (input, init) => {
			const url = input instanceof Request ? input.url : String(input);
			if (!/^https:\/\/api\.(openai|anthropic)\.com\//.test(url)) return originalFetch(input, init);
			const request: CapturedRequest = {
				url,
				method: init?.method ?? 'GET',
				headers: Object.fromEntries(new Headers(init?.headers)),
				body: String(init?.body ?? ''),
				aborted: false
			};
			const index = state.requests.push(request) - 1;
			const plan = state.plans.shift() ?? {};
			if (plan.status)
				return new Response('Provider response must not be reflected: private diagnostic.', {
					status: plan.status
				});
			const text = plan.text ?? 'Try pwd to see your current folder.';
			const openai = url.includes('openai.com');
			const encoder = new TextEncoder();
			let ended = false;
			const body = new ReadableStream<Uint8Array>({
				start(controller) {
					const emit = (event: unknown) =>
						controller.enqueue(encoder.encode(`data: ${JSON.stringify(event)}\n\n`));
					init?.signal?.addEventListener('abort', () => {
						request.aborted = true;
						if (!ended) {
							ended = true;
							controller.error(new DOMException('Aborted', 'AbortError'));
						}
					});
					const finish = () => {
						if (ended) return;
						if (openai)
							emit({
								type: 'response.completed',
								response: {
									output: plan.toolCommand
										? [
												{
													type: 'function_call',
													call_id: 'demo-call',
													name: 'bash',
													arguments: JSON.stringify({ cmd: plan.toolCommand })
												}
											]
										: [
												{
													type: 'message',
													role: 'assistant',
													content: [{ type: 'output_text', text }]
												}
											],
									usage: { input_tokens: 12, output_tokens: 3 }
								}
							});
						else {
							emit({
								type: 'message_delta',
								delta: { stop_reason: 'end_turn' },
								usage: { output_tokens: 3 }
							});
							emit({ type: 'message_stop' });
						}
						ended = true;
						controller.close();
					};
					finishers.set(index, finish);
					if (openai) emit({ type: 'response.output_text.delta', delta: text });
					else {
						emit({ type: 'message_start', message: { usage: { input_tokens: 12 } } });
						emit({
							type: 'content_block_start',
							index: 0,
							content_block: { type: 'text', text: '' }
						});
						emit({ type: 'content_block_delta', index: 0, delta: { type: 'text_delta', text } });
					}
					if (!plan.hold) finish();
				}
			});
			return new Response(body, { status: 200, headers: { 'Content-Type': 'text/event-stream' } });
		};
	});
}

async function openAgent(page: Page) {
	await page.goto('/');
	await expect(page.getByLabel('Your command', { exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Open Agent', exact: true }).click();
	return page.getByRole('complementary', { name: 'Agent', exact: true });
}

async function connect(page: Page, panel: Locator, provider: Provider, model?: string) {
	await panel.getByRole('button', { name: 'Agent settings', exact: true }).click();
	const settings = page.getByRole('dialog', { name: 'Agent settings' });
	await settings.getByRole('combobox', { name: 'Provider', exact: true }).selectOption(provider);
	if (model) {
		await settings.getByRole('combobox', { name: 'Model', exact: true }).selectOption('custom');
		await settings.getByLabel('Exact API model ID').fill(model);
	} else {
		model = catalog.models.find((item) => item.provider === provider)!.id;
		await settings.getByRole('combobox', { name: 'Model', exact: true }).selectOption(model);
	}
	await settings.getByLabel('API key', { exact: true }).fill(fakeKey);
	await settings.getByRole('button', { name: 'Use this provider and model' }).click();
	await expect(settings.getByRole('status')).toContainText(model);
	await expect(settings.getByLabel('API key', { exact: true })).toHaveValue('');
	await settings.getByRole('button', { name: 'Close settings', exact: true }).click();
	return model;
}

async function ask(panel: Locator, question = 'How do I see my current folder?') {
	await panel.getByLabel('Ask the agent').fill(question);
	await panel.getByLabel('Ask the agent').press('Enter');
	await expect(panel.locator('[data-role="assistant"]').last()).not.toHaveText('');
}

for (const provider of ['openai', 'anthropic'] as const) {
	test(`${provider} connects without requests, sends the selected model only when asked, and never stores the key`, async ({
		page
	}) => {
		await mockProviders(page);
		const panel = await openAgent(page);
		const model = await connect(page, panel, provider);
		expect(await page.evaluate(() => window.__cloudMock.requests)).toEqual([]);
		await ask(panel);
		await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
		const requests = await page.evaluate(() => window.__cloudMock.requests);
		expect(requests).toHaveLength(1);
		expect(requests[0].url).toBe(
			provider === 'openai'
				? 'https://api.openai.com/v1/responses'
				: 'https://api.anthropic.com/v1/messages'
		);
		expect(requests[0].method).toBe('POST');
		expect(JSON.parse(requests[0].body).model).toBe(model);
		expect(requests[0].headers[provider === 'openai' ? 'authorization' : 'x-api-key']).toContain(
			fakeKey
		);
		expect(requests[0].body).not.toContain(fakeKey);
		const stored = await page.evaluate(() =>
			JSON.stringify({
				local: { ...localStorage },
				session: { ...sessionStorage },
				writes: window.__cloudMock.storageWrites,
				url: location.href
			})
		);
		expect(stored).not.toContain(fakeKey);
		await expect(panel.locator('[data-role="assistant"]').last()).toContainText('Try pwd');
	});
}

test('context sharing controls the next request and the preview uses real line breaks', async ({
	page
}) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await panel.getByRole('button', { name: 'Close agent', exact: true }).click();
	const first = page.getByLabel('Your command', { exact: true });
	await first.fill('echo CONTEXT_CACTUS_781');
	await first.press('Enter');
	await page.getByRole('button', { name: 'Open Agent', exact: true }).click();
	await connect(page, panel, 'openai');
	await panel.locator('summary').filter({ hasText: 'view practice context' }).click();
	await expect(panel.locator('details pre')).toHaveText(
		'echo CONTEXT_CACTUS_781\nCONTEXT_CACTUS_781'
	);
	await ask(panel, 'Why did my last command work?');
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	await panel.getByRole('checkbox', { name: /Include my last practice/ }).uncheck();
	await ask(panel, 'Explain the folder command next.');
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	const requests = await page.evaluate(() => window.__cloudMock.requests);
	expect(requests[0].body).toContain('CONTEXT_CACTUS_781');
	expect(requests[1].body).not.toContain('CONTEXT_CACTUS_781');
});

test('disconnect aborts an in-flight answer and late completion cannot enter a new conversation', async ({
	page
}) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await connect(page, panel, 'openai', 'custom-model-alpha-2030');
	await page.evaluate(() =>
		window.__cloudMock.plans.push({ hold: true, text: 'Old unfinished response.' })
	);
	await ask(panel);
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toBeVisible();
	await panel.getByRole('button', { name: 'Disconnect', exact: true }).click();
	await expect(panel.locator('[data-role="assistant"]')).toHaveCount(0);
	expect(await page.evaluate(() => window.__cloudMock.requests[0].aborted)).toBe(true);
	await connect(page, panel, 'anthropic', 'custom-model-beta-2030');
	await page.evaluate(() => {
		window.__cloudMock.release(0);
		window.__cloudMock.plans.push({ text: 'Fresh provider reply.' });
	});
	await ask(panel);
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	await expect(panel.locator('[data-role="assistant"]')).toHaveCount(1);
	await expect(panel.locator('[data-role="assistant"]')).toHaveText('Fresh provider reply.');
	const requests = await page.evaluate(() => window.__cloudMock.requests);
	expect(JSON.parse(requests[1].body).model).toBe('custom-model-beta-2030');
	expect(requests[1].body).not.toContain('Old unfinished response');
});

test('switching providers starts a new demonstration sandbox as well as a new chat', async ({
	page
}) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await connect(page, panel, 'openai');
	await page.evaluate(() =>
		window.__cloudMock.plans.push({ toolCommand: 'touch previous-provider-note.txt' })
	);
	await ask(panel, 'Show a small file demonstration.');
	const approval = panel.getByTestId('approval-card');
	await expect(approval).toBeVisible();
	await approval.getByRole('button', { name: /Allow/ }).click();
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	await expect(panel.getByTestId('agent-terminal')).toContainText('previous-provider-note.txt');
	await connect(page, panel, 'anthropic');
	await expect(panel.getByTestId('agent-terminal')).toHaveCount(0);
	await ask(panel, 'Explain the current folder.');
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	const requests = await page.evaluate(() => window.__cloudMock.requests);
	expect(requests.at(-1)?.url).toContain('anthropic.com');
	expect(requests.at(-1)?.body).not.toContain('previous-provider-note.txt');
});

test('quoted credential values are withheld from the practice preview and provider context', async ({
	page
}) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await panel.getByRole('button', { name: 'Close agent', exact: true }).click();
	const first = page.getByLabel('Your command', { exact: true });
	await first.fill('echo \'API_KEY="fake value with spaces"\'');
	await first.press('Enter');
	await page.getByRole('button', { name: 'Open Agent', exact: true }).click();
	await connect(page, panel, 'openai');
	await panel.locator('summary').filter({ hasText: 'view practice context' }).click();
	await expect(panel.locator('details pre')).toContainText('[withheld]');
	await expect(panel.locator('details pre')).not.toContainText('fake value with spaces');
	await ask(panel, 'Explain the result of my practice command.');
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
	expect(await page.evaluate(() => window.__cloudMock.requests[0].body)).not.toContain(
		'fake value with spaces'
	);
});

test('pagehide clears connected and unfinished input keys, and reload requires reconnecting', async ({
	page
}) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await connect(page, panel, 'openai');
	await panel.getByRole('button', { name: 'Agent settings', exact: true }).click();
	const settings = page.getByRole('dialog', { name: 'Agent settings' });
	await settings.getByLabel('API key', { exact: true }).fill('another-unsent-fake-key');
	await page.evaluate(() =>
		window.dispatchEvent(new PageTransitionEvent('pagehide', { persisted: true }))
	);
	await expect(settings.getByLabel('API key', { exact: true })).toHaveValue('');
	await expect(settings.getByRole('button', { name: 'Disconnect and clear key' })).toHaveCount(0);
	await settings.getByRole('button', { name: 'Close settings', exact: true }).click();
	await connect(page, panel, 'anthropic');
	await page.reload();
	await expect(page.getByLabel('Your command', { exact: true })).toBeEnabled();
	await page.getByRole('button', { name: 'Open Agent', exact: true }).click();
	await panel.getByRole('button', { name: 'Agent settings', exact: true }).click();
	await expect(settings.getByLabel('API key', { exact: true })).toHaveValue('');
	await expect(settings.getByRole('button', { name: 'Disconnect and clear key' })).toHaveCount(0);
	expect(await page.evaluate(() => window.__cloudMock.requests)).toEqual([]);
});

test('provider errors are visible without displaying provider diagnostics', async ({ page }) => {
	await mockProviders(page);
	const panel = await openAgent(page);
	await connect(page, panel, 'anthropic');
	await page.evaluate(() => window.__cloudMock.plans.push({ status: 401 }));
	await ask(panel);
	await expect(panel.locator('[data-role="assistant"]')).toContainText(
		'provider rejected this API key'
	);
	await expect(panel.locator('[data-role="assistant"]')).not.toContainText('private diagnostic');
	await expect(panel.getByRole('button', { name: 'Stop generating' })).toHaveCount(0);
});

for (const viewport of [
	{ width: 1440, height: 900 },
	{ width: 390, height: 844 }
]) {
	test(`settings keep controls reachable and Escape returns to the Agent at ${viewport.width}px`, async ({
		page
	}) => {
		await page.setViewportSize(viewport);
		await mockProviders(page);
		const panel = await openAgent(page);
		await panel.getByRole('button', { name: 'Agent settings', exact: true }).click();
		const settings = page.getByRole('dialog', { name: 'Agent settings' });
		const close = settings.getByRole('button', { name: 'Close settings', exact: true });
		await expect(close).toBeFocused();
		await close.press('Shift+Tab');
		expect(await settings.evaluate((el) => el.contains(document.activeElement))).toBe(true);
		await page.keyboard.press('Tab');
		await expect(close).toBeFocused();
		const dimensions = await settings.evaluate((el) => ({
			width: el.clientWidth,
			scrollWidth: el.scrollWidth,
			bottom: el.getBoundingClientRect().bottom
		}));
		expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.width);
		expect(dimensions.bottom).toBeLessThanOrEqual(viewport.height);
		await page.keyboard.press('Escape');
		await expect(settings).toHaveCount(0);
		await expect(panel).toHaveAttribute('aria-hidden', 'false');
		await expect(panel.getByRole('button', { name: 'Agent settings', exact: true })).toBeFocused();
		await connect(page, panel, 'openai', 'custom-' + 'model'.repeat(25));
		const panelWidth = await panel.evaluate((el) => ({
			width: el.clientWidth,
			scrollWidth: el.scrollWidth
		}));
		expect(panelWidth.scrollWidth).toBeLessThanOrEqual(panelWidth.width);
		await expect(panel.getByRole('button', { name: 'Disconnect', exact: true })).toBeVisible();
	});
}
