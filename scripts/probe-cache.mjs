#!/usr/bin/env node
/**
 * Cache-persistence probe (diagnosis for "re-downloads every reload"):
 * reuses the smoke profile, BLOCKS all huggingface/cdn traffic, and checks
 * whether the previously downloaded model still activates purely from
 * Cache Storage. Also dumps caches.keys(), entry URLs, and the storage
 * estimate for the origin.
 */
import { spawn } from 'node:child_process';
import { chromium } from '@playwright/test';

const PORT = Number(process.env.SMOKE_PORT) || 4293;
const BASE = `http://localhost:${PORT}`;
const PROFILE = new URL('../.smoke-cache/profile', import.meta.url).pathname;

const log = (...a) => console.log('[probe]', ...a);

async function waitForServer(url, timeoutMs = 120_000) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			/* not up */
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error('dev server did not come up');
}

const server = spawn('npm', ['run', 'dev'], {
	env: { ...process.env, PORT: String(PORT) },
	stdio: ['ignore', 'pipe', 'pipe']
});
process.on('exit', () => {
	try {
		server.kill('SIGTERM');
	} catch {
		/* gone */
	}
});

try {
	await waitForServer(BASE);
	const context = await chromium.launchPersistentContext(PROFILE, {
		headless: true,
		args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal']
	});

	// Count weight fetches instead of blocking: zero .onnx network requests
	// on a warm cache is the "no re-download" proof; blocking would conflate
	// a slow warm with a cache miss.
	let onnxFetches = 0;
	let hfRequests = 0;
	await context.route(/huggingface\.co|hf\.co|cdn-lfs/, (route) => {
		hfRequests++;
		if (/\.onnx/.test(route.request().url())) onnxFetches++;
		void route.continue();
	});

	const page = await context.newPage();
	await page.goto(BASE);

	const cacheInfo = await page.evaluate(async () => {
		const keys = await caches.keys();
		const detail = {};
		for (const key of keys) {
			const cache = await caches.open(key);
			const reqs = await cache.keys();
			detail[key] = reqs.map((r) => r.url);
		}
		const estimate = await navigator.storage.estimate();
		return { keys, detail, usageMb: Math.round((estimate.usage ?? 0) / 1e6) };
	});
	log('caches.keys():', JSON.stringify(cacheInfo.keys));
	log('storage usage:', cacheInfo.usageMb, 'MB');
	for (const [key, urls] of Object.entries(cacheInfo.detail)) {
		log(`cache "${key}": ${urls.length} entries`);
		for (const url of urls) log('   ', url.slice(0, 140));
	}

	const panel = page.locator('aside[aria-label="Agent"]');
	const modeRow = panel.locator('.agent-mode-row');
	// The service worker may churn (install/claim) on first load; retry the
	// open until the panel actually reacts.
	for (let i = 0; i < 6; i++) {
		if ((await panel.getAttribute('aria-hidden').catch(() => 'true')) === 'false') break;
		await page
			.getByRole('button', { name: 'Open Agent' })
			.click({ timeout: 5000 })
			.catch(() => {});
		await page.waitForTimeout(1500);
	}

	log('panel aria-hidden:', await panel.getAttribute('aria-hidden').catch(() => '?'));

	// Activate: auto-warm, or via the gear if idle.
	const status = panel.locator('.agent-status');
	const warming = await Promise.race([
		status
			.waitFor({ state: 'visible', timeout: 8000 })
			.then(() => 'status-line')
			.catch(() => null),
		modeRow
			.waitFor({ state: 'visible', timeout: 8000 })
			.then(() => 'mode-row')
			.catch(() => null)
	]);
	log('activation signal:', warming ?? 'none — trying the gear');
	if (!warming) {
		await page
			.getByRole('button', { name: 'Agent settings' })
			.click({ timeout: 10_000 })
			.catch((e) => log('gear click failed:', String(e).slice(0, 120)));
		await page
			.getByRole('dialog', { name: 'Agent settings' })
			.locator('.agent-model-tan')
			.getByRole('button', { name: /Use this model|Download · 760 MB/ })
			.click({ timeout: 10_000 })
			.catch((e) => log('gear activate failed:', String(e).slice(0, 120)));
	}

	const live = await modeRow
		.waitFor({ state: 'visible', timeout: 8 * 60_000 })
		.then(() => true)
		.catch(() => false);

	log(`HF requests this session: ${hfRequests} · .onnx weight fetches: ${onnxFetches}`);
	if (live && onnxFetches === 0) {
		log('RESULT: model LIVE with ZERO .onnx network fetches — weights served from Cache Storage.');
	} else if (live) {
		log(`RESULT: model live but ${onnxFetches} .onnx fetches hit the network — cache MISS.`);
	} else {
		const err = await panel
			.locator('.agent-status-err, .agent-card-title')
			.first()
			.textContent()
			.catch(() => null);
		log(
			'RESULT: model did not come up; panel state:',
			await panel.getAttribute('aria-hidden').catch(() => '?')
		);
		if (err) log('        error surfaced:', err.trim().slice(0, 200));
	}

	await context.close();
	process.exit(live && onnxFetches === 0 ? 0 : 1);
} catch (e) {
	console.error('[probe] error:', e);
	process.exit(1);
}
