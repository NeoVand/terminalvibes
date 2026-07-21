const THEME_KEY = 'terminalvibes-theme';

export type ThemePreference = 'light' | 'dark' | 'system';

export function loadThemePreference(): ThemePreference {
	// Dark is the default, not `system`. This app is a terminal course — the
	// dark theme is the designed-for, photographed-for look, and a visitor whose
	// OS happens to be in light mode should still land in it. `system` stays a
	// real choice, but only once the reader picks it: absent a stored value we
	// return 'dark', never 'system'.
	if (typeof window === 'undefined') return 'dark';
	const stored = localStorage.getItem(THEME_KEY);
	if (stored === 'light' || stored === 'dark' || stored === 'system') return stored;
	return 'dark';
}

export function saveThemePreference(theme: ThemePreference) {
	if (typeof window === 'undefined') return;
	localStorage.setItem(THEME_KEY, theme);
}

export function getEffectiveTheme(theme: ThemePreference): 'light' | 'dark' {
	if (theme !== 'system') return theme;
	if (typeof window === 'undefined') return 'dark';
	return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

export function applyTheme(theme: ThemePreference) {
	if (typeof document === 'undefined') return;
	const root = document.documentElement;
	root.classList.remove('light', 'dark');
	if (theme !== 'system') {
		root.classList.add(theme);
	}
}
