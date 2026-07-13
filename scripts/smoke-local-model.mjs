#!/usr/bin/env node
/**
 * REAL-MODEL smoke test — not part of CI (CI never downloads weights).
 *
 * Boots the dev server, opens Chromium with a persistent profile under
 * .smoke-cache/ (so the ~450 MB download happens once), clicks the actual
 * download button in the Agent panel, waits for the model to go live, asks
 * "What does chmod 755 mean?", and reports:
 *   - which device ran (webgpu or wasm) + warm-up probe latency
 *   - bytes observed from huggingface.co (download size check)
 *   - TTFT, total answer time, rough chars/sec
 *   - whether search_course was called, and the full answer text
 *
 * Flags:
 *   --check-2b   additionally probe the 2B multimodal repo init and report
 *                which files transformers.js requests (vision skipped or not),
 *                aborting before the big shards finish.
 *
 * Usage: node scripts/smoke-local-model.mjs [--check-2b]
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = Number(process.env.SMOKE_PORT) || 4293;
const BASE = `http://localhost:${PORT}`;
const PROFILE = new URL('../.smoke-cache/profile', import.meta.url).pathname;
const CHECK_2B = process.argv.includes('--check-2b');

function log(...args) {
	console.log('[smoke]', ...args);
}

async function waitForServer(url, timeoutMs = 120_000) {
	const started = Date.now();
	while (Date.now() - started < timeoutMs) {
		try {
			const res = await fetch(url);
			if (res.ok) return;
		} catch {
			/* not up yet */
		}
		await new Promise((r) => setTimeout(r, 500));
	}
	throw new Error(`dev server did not come up on ${url}`);
}

async function main() {
	mkdirSync(PROFILE, { recursive: true });

	log(`starting dev server on :${PORT}`);
	const server = spawn('npm', ['run', 'dev'], {
		env: { ...process.env, PORT: String(PORT) },
		stdio: ['ignore', 'pipe', 'pipe']
	});
	server.stderr.on('data', (d) => process.stderr.write(`[vite] ${d}`));
	const killServer = () => {
		try {
			server.kill('SIGTERM');
		} catch {
			/* already gone */
		}
	};
	process.on('exit', killServer);

	try {
		await waitForServer(BASE);
		log('dev server up');

		const context = await chromium.launchPersistentContext(PROFILE, {
			headless: true,
			viewport: { width: 1400, height: 950 },
			// WebGPU in headless Chromium wants these; if the adapter still
			// refuses, the app's warm-up probe cascades to wasm on its own.
			args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal']
		});
		const page = await context.newPage();
		page.on('console', (msg) => {
			const t = msg.text();
			if (/error|failed|webgpu|wasm|onnx/i.test(t)) log(`console: ${t.slice(0, 200)}`);
		});

		// Tally the actual bytes that come off huggingface.co.
		let hfBytes = 0;
		const hfFiles = new Set();
		page.on('response', (res) => {
			const url = res.url();
			if (!/huggingface\.co|hf\.co|cdn-lfs/.test(url)) return;
			const file = url.split('?')[0].split('/').slice(-1)[0];
			hfFiles.add(file);
			const len = Number(res.headers()['content-length'] ?? 0);
			if (len > 0) hfBytes += len;
		});

		await page.goto(BASE);
		await page.evaluate(() => {
			window.__tvAgentSearches = [];
		});

		log('opening Agent panel');
		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');

		// On a fresh profile the offer card shows the per-card download button;
		// on a revisit the app auto-warms from Cache Storage instead (no button,
		// no download). vite dev may also reload the page once while optimizing
		// new deps, closing the panel — so retry the open until content shows.
		const modeRow = panel.locator('.agent-mode-row');
		const btn = panel
			.locator('.agent-model-tan')
			.getByRole('button', { name: /Download · 450 MB/ });
		// Downloaded on a previous run but not the remembered selection: the
		// tan card offers activation instead of a download.
		const useBtn = panel
			.locator('.agent-model-tan')
			.getByRole('button', { name: 'Use this model' });
		const downloadStart = Date.now();
		// Panel-open stage: only the download button needs an explicit click.
		// Anything else (in-card progress, mode row) means an auto-warm is
		// already running — fall through to the long wait either way.
		let first = null;
		for (let attempt = 0; attempt < 6 && !first; attempt++) {
			if ((await panel.getAttribute('aria-hidden')) !== 'false') {
				await page
					.getByRole('button', { name: 'Open Agent' })
					.click()
					.catch(() => {});
			}
			first = await Promise.race([
				btn
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => 'button')
					.catch(() => null),
				modeRow
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => 'mode')
					.catch(() => null),
				panel
					.locator('.agent-model-progress')
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => 'warming')
					.catch(() => null),
				useBtn
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => 'use')
					.catch(() => null),
				panel
					.getByText(/couldn't start/)
					.waitFor({ state: 'visible', timeout: 10_000 })
					.then(() => 'error')
					.catch(() => null)
			]);
			if (!first) {
				log(`panel content not visible yet (attempt ${attempt + 1}), retrying…`);
				const cardText = await panel
					.locator('.agent-card')
					.first()
					.textContent()
					.catch(() => null);
				if (cardText) log(`  card says: ${cardText.trim().slice(0, 160)}`);
			}
		}
		if (first === 'button') {
			log('clicking the 0.8B card download button (q4f16)');
			await btn.click();
		} else if (first === 'use') {
			log('weights already cached — clicking "Use this model" (warm from Cache Storage)');
			await useBtn.click();
		} else if (first === 'error') {
			const errText = await panel.locator('.agent-card').first().textContent();
			log(`local model errored on auto-warm: ${errText?.trim().slice(0, 200)} — clicking Retry`);
			await panel.getByRole('button', { name: 'Retry' }).click();
		} else {
			log(`no download click needed (${first ?? 'still settling'}) — auto-warm path`);
		}

		log('waiting for the model to go live (download + load + warm-up probe)…');
		await modeRow.waitFor({ state: 'visible', timeout: 20 * 60_000 });
		const modeText = (await modeRow.textContent())?.trim();
		const setupSecs = ((Date.now() - downloadStart) / 1000).toFixed(0);
		log(`model live after ${setupSecs}s — mode row: "${modeText}"`);
		log(`observed from huggingface: ${(hfBytes / 1e6).toFixed(0)} MB across ${hfFiles.size} files`);
		log(`files: ${[...hfFiles].join(', ')}`);

		const device = await page.evaluate(() => window.__tvAgentDevice ?? null);
		const probeMs = await page.evaluate(() => window.__tvAgentProbeMs ?? null);
		log(`device: ${device} · warm-up probe: ${probeMs} ms`);

		// ── Ask the real question ──
		const question = 'What does chmod 755 mean?';
		log(`asking: "${question}"`);
		const input = page.getByLabel('Ask the agent');
		await input.fill(question);
		const t0 = Date.now();
		await input.press('Enter');

		const assistant = panel.locator('[data-role="assistant"]').last();
		await assistant.waitFor({ state: 'attached', timeout: 60_000 });
		// TTFT: first visible content in the assistant bubble.
		await page.waitForFunction(
			(el) => (el?.textContent ?? '').trim().length > 0,
			await assistant.elementHandle(),
			{ timeout: 10 * 60_000, polling: 100 }
		);
		const ttftMs = Date.now() - t0;

		// Done when the send button returns (status left 'generating').
		await panel
			.getByRole('button', { name: 'Send question' })
			.waitFor({ state: 'visible', timeout: 10 * 60_000 });
		const totalMs = Date.now() - t0;

		const answer = (await assistant.textContent())?.trim() ?? '';
		const searches = await page.evaluate(() => window.__tvAgentSearches ?? []);
		const chars = answer.length;
		const genSecs = Math.max(0.001, (totalMs - ttftMs) / 1000);
		// The final answer streams to the UI after generation; approximate
		// throughput over the whole turn instead (chars/sec of wall time).
		const wallCps = (chars / (totalMs / 1000)).toFixed(1);

		log('──────── SMOKE RESULT ────────');
		log(`device:          ${device}`);
		log(`probe (tiny gen):${probeMs} ms`);
		log(`setup:           ${setupSecs}s (download+load+probe)`);
		log(`hf bytes:        ${(hfBytes / 1e6).toFixed(0)} MB`);
		log(`TTFT:            ${(ttftMs / 1000).toFixed(1)}s`);
		log(`total turn:      ${(totalMs / 1000).toFixed(1)}s`);
		log(
			`answer chars:    ${chars} (~${wallCps} chars/s wall, stream window ${genSecs.toFixed(1)}s)`
		);
		log(
			`search_course:   ${searches.length ? `called with ${JSON.stringify(searches)}` : 'NOT called'}`
		);
		log(`answer: ${answer}`);
		log('──────────────────────────────');

		if (!answer) throw new Error('SMOKE FAIL: empty answer');
		if (!device) throw new Error('SMOKE FAIL: no device recorded');

		// ── Optional: 2B multimodal prototype check ──
		if (CHECK_2B) {
			log('2B prototype check: watching which files the 2B init requests…');
			const page2 = await context.newPage();
			const files2 = new Map(); // file -> content-length
			page2.on('response', (res) => {
				const url = res.url();
				if (!/huggingface\.co|hf\.co|cdn-lfs/.test(url)) return;
				const file = url.split('?')[0].split('/').slice(-1)[0];
				files2.set(file, Number(res.headers()['content-length'] ?? 0));
			});
			await page2.goto(BASE);
			// Clear the remembered 0.8B so the offer card shows, then pick the 2B.
			await page2.evaluate(() => localStorage.removeItem('tv-agent-model'));
			await page2.reload();
			await page2.getByRole('button', { name: 'Open Agent' }).click();
			// The amber 2B card carries its own download button (disabled with a
			// reason when WebGPU is missing).
			await page2.getByRole('button', { name: 'Agent settings' }).click();
			const secondary = page2
				.locator('.agent-model-amber')
				.getByRole('button', { name: /Download · 1\.3 GB/ });
			await secondary.waitFor({ state: 'visible', timeout: 15_000 }).catch(() => {});
			if ((await secondary.isVisible().catch(() => false)) && (await secondary.isEnabled())) {
				await secondary.click();
				// Long enough for transformers.js to request every file it intends to.
				await page2.waitForTimeout(45_000);
				const names = [...files2.keys()];
				const vision = names.filter((n) => /vision/i.test(n));
				log(`2B requested files: ${names.join(', ') || '(none yet)'}`);
				log(
					vision.length
						? `2B CHECK: vision files WERE requested (${vision.join(', ')}) — text pipeline does NOT skip them`
						: '2B CHECK: no vision files requested — text-generation pipeline skips the vision encoder'
				);
			} else {
				log('2B CHECK: 2B download not offered/enabled (no WebGPU in this browser) — skipped');
			}
			await page2.close();
		}

		await context.close();
		log('smoke test PASSED');
	} finally {
		killServer();
	}
}

main().catch((e) => {
	console.error('[smoke] FAILED:', e);
	process.exitCode = 1;
});
