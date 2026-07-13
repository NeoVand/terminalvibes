import { defineConfig } from '@playwright/test';

// vite.config.ts routes PORT through to `vite preview`, so overriding PORT
// here moves the whole e2e stack off a busy 4173 without further changes.
const PORT = Number(process.env.PORT) || 4173;

export default defineConfig({
	webServer: {
		command: 'npm run build && npm run preview',
		port: PORT,
		env: { PORT: String(PORT) },
		// The production build alone can take over Playwright's default 60s
		// on a loaded machine; give the build + preview combo real headroom.
		timeout: 180_000
	},
	testMatch: '**/*.e2e.{ts,js}',
	// Agent worktrees under .claude/ ship their own node_modules copy of
	// Playwright; collecting their specs loads two Playwright versions at once.
	testIgnore: '**/.claude/**',
	// CI runners are slow enough that parallel workers make the
	// playground's timing-sensitive tests flaky
	workers: process.env.CI ? 1 : undefined
});
