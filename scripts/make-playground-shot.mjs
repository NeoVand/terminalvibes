import { chromium } from 'playwright';
import sharp from 'sharp';

const base = process.argv[2] ?? 'http://localhost:54981';
const browser = await chromium.launch();
const page = await browser.newPage({
	viewport: { width: 1600, height: 1000 },
	colorScheme: 'dark'
});
await page.goto(`${base}/?playground`, { waitUntil: 'networkidle' });
const panel = page.getByRole('complementary', { name: 'Terminal Playground' });
const select = panel.locator('select');
await select.selectOption('log-detective');
const input = panel.locator('input[placeholder="ls"]');
await input.waitFor({ state: 'visible' });
for (const cmd of [
	'cd logs',
	'grep -n ERROR server.log',
	'grep ERROR server.log > error-report.txt'
]) {
	await input.fill(cmd);
	await input.press('Enter');
	await page.waitForTimeout(400);
}
await page.waitForTimeout(1200); // let the mermaid tree settle
await panel.screenshot({ path: 'docs/images/playground.png' });
await browser.close();
await sharp('docs/images/playground.png')
	.webp({ quality: 85 })
	.toFile('docs/images/playground.webp');
const { unlinkSync, statSync } = await import('node:fs');
unlinkSync('docs/images/playground.png');
console.log(
	`playground.webp: ${(statSync('docs/images/playground.webp').size / 1024).toFixed(0)}KB`
);
