import { defineConfig } from '@playwright/test';

// vite.config.ts routes PORT through to `vite preview`, so overriding PORT
// here moves the whole e2e stack off a busy 4173 without further changes.
const PORT = Number(process.env.PORT) || 4173;

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: PORT,
		env: { PORT: String(PORT) }
	},
	testMatch: '**/*.e2e.{ts,js}',
	// CI runners are slow enough that parallel workers make the
	// playground's timing-sensitive tests flaky
	workers: process.env.CI ? 1 : undefined
});
