#!/usr/bin/env node
/**
 * REAL-MODEL CLI-agent smoke — not part of CI (CI never downloads weights).
 *
 * Boots the dev server, opens Chromium with the persistent profile under
 * .smoke-cache/ (share the chat smoke's cache via SMOKE_PROFILE to skip the
 * ~760 MB download), activates the LFM2.5 1.2B model in the Agent panel,
 * then opens the PLAYGROUND panel and runs a real CLI session:
 *
 *   agent "create a notes folder with three dated files"
 *
 * Every proposal the model makes is approved with a real `y` keystroke, and
 * the script reports: device, proposals seen, whether done fired, the final
 * summary line, and whether ~/notes actually materialized in the file tree.
 *
 * Usage: SMOKE_PROFILE=/path/to/.smoke-cache/profile node scripts/smoke-cli-agent.mjs
 */
import { spawn } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { chromium } from '@playwright/test';

const PORT = Number(process.env.SMOKE_PORT) || 4293;
const BASE = `http://localhost:${PORT}`;
const PROFILE =
	process.env.SMOKE_PROFILE ?? new URL('../.smoke-cache/profile', import.meta.url).pathname;
const TASK = 'agent "create a notes folder with three dated files"';

function log(...args) {
	console.log('[smoke-cli]', ...args);
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
			args: ['--enable-unsafe-webgpu', '--enable-gpu', '--use-angle=metal']
		});
		const page = await context.newPage();
		page.on('console', (msg) => {
			const t = msg.text();
			if (/error|failed|webgpu|wasm|onnx/i.test(t)) log(`console: ${t.slice(0, 200)}`);
		});

		await page.goto(BASE);

		// ── Stage 1: get the local model live (cache-warm or download). ──
		log('opening Agent panel to activate the model');
		await page.getByRole('button', { name: 'Open Agent' }).click();
		const panel = page.locator('aside[aria-label="Agent"]');
		const modeRow = panel.locator('.agent-mode-row');
		const btn = panel
			.locator('.agent-model-tan')
			.getByRole('button', { name: /Download · 760 MB/ });
		const t0 = Date.now();
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
					.waitFor({ state: 'visible', timeout: 8_000 })
					.then(() => 'button')
					.catch(() => null),
				modeRow
					.waitFor({ state: 'visible', timeout: 8_000 })
					.then(() => 'mode')
					.catch(() => null),
				panel
					.locator('.agent-status')
					.waitFor({ state: 'visible', timeout: 8_000 })
					.then(() => 'warming')
					.catch(() => null)
			]);
			if (!first) {
				await panel
					.getByRole('button', { name: 'Agent settings' })
					.click()
					.catch(() => {});
				const gearUse = page
					.getByRole('dialog', { name: 'Agent settings' })
					.locator('.agent-model-tan')
					.getByRole('button', { name: /Use this model|Download · 760 MB/ });
				if (await gearUse.isVisible().catch(() => false)) {
					log('activating the default model from the gear settings');
					await gearUse.click();
					first = 'gear';
				}
				await page
					.getByRole('button', { name: 'Close settings' })
					.click()
					.catch(() => {});
			}
		}
		if (first === 'button') {
			log('clicking the LFM2.5 1.2B download button');
			await btn.click();
		}
		log('waiting for the model to go live…');
		await modeRow.waitFor({ state: 'visible', timeout: 20 * 60_000 });
		const device = await page.evaluate(() => window.__tvAgentDevice ?? null);
		log(`model live after ${((Date.now() - t0) / 1000).toFixed(0)}s · device: ${device}`);

		// ── Stage 2: the CLI session in the playground terminal. ──
		log('opening the Terminal Playground panel');
		await page.getByRole('button', { name: 'Open Terminal Playground' }).click();
		const pg = page.locator('aside[aria-label="Terminal Playground"]');
		const input = pg.getByLabel('Shell command');
		await input.waitFor({ state: 'visible', timeout: 30_000 });
		const terminal = pg.locator('.pg-terminal');

		log(`running: ${TASK}`);
		await input.fill(TASK);
		const s0 = Date.now();
		await input.press('Enter');

		const approval = pg.locator('[data-testid="agent-approval"]');
		const proposals = [];
		let outcome = 'timeout';
		while (Date.now() - s0 < 10 * 60_000) {
			const text = (await terminal.textContent().catch(() => '')) ?? '';
			if (text.includes('✔ agent:')) {
				outcome = 'done';
				break;
			}
			if (/caught SIGINT|agent: .*(error|failed)/i.test(text)) {
				outcome = 'ended-early';
				break;
			}
			if (await approval.isVisible().catch(() => false)) {
				const cmd = (
					await pg
						.locator('[data-testid="agent-proposal"]')
						.last()
						.textContent()
						.catch(() => '')
				)?.trim();
				log(`proposal: ${cmd} → y`);
				proposals.push(cmd ?? '');
				await input.press('y');
				await page.waitForTimeout(400);
				continue;
			}
			await page.waitForTimeout(300);
		}
		const secs = ((Date.now() - s0) / 1000).toFixed(0);

		const finalText = (await terminal.textContent().catch(() => '')) ?? '';
		const summary = finalText.match(/✔ agent:[^\n]*/)?.[0] ?? '(no summary line)';
		const treeText =
			(await pg
				.locator('.pg-graph-body')
				.textContent()
				.catch(() => '')) ?? '';
		const notesInTree = /notes/.test(treeText);

		log('──────────────────────────────────────────');
		log(`outcome:   ${outcome} after ${secs}s`);
		log(`device:    ${device}`);
		log(`proposals: ${proposals.length}`);
		for (const p of proposals) log(`   · ${p}`);
		log(`summary:   ${summary}`);
		log(`~/notes in file tree: ${notesInTree}`);
		log('──────────────────────────────────────────');

		await context.close();
		process.exitCode = outcome === 'done' && notesInTree ? 0 : 1;
	} finally {
		killServer();
	}
}

main().catch((e) => {
	console.error('[smoke-cli] FAILED:', e);
	process.exit(1);
});
