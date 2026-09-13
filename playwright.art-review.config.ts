import { defineConfig } from '@playwright/test';

// This suite deliberately runs Vite development mode: production cannot load
// the gallery or its manifest. The ordinary suite tests the published notice.
process.env.ART_REVIEW_DEV = '1';
const port = Number(process.env.ART_REVIEW_PORT) || 5198;

export default defineConfig({
	testMatch: '**/art-review/art-review.e2e.ts',
	workers: 1,
	use: { baseURL: `http://127.0.0.1:${port}` },
	webServer: {
		command: `npm run dev -- --host 127.0.0.1 --port ${port}`,
		port,
		timeout: 60_000
	}
});
