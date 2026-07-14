import type { Preset } from './types';

/**
 * Twelve starter designs. Selecting one loads its structured config into the
 * designer; every field stays editable afterward. Names/looks are inspired by
 * Starship's official presets (starship.rs/presets) and popular editor themes.
 */
export const PRESETS: Preset[] = [
	{
		id: 'tokyonight',
		name: 'Tokyo Night',
		description: 'Powerline segments in the beloved Tokyo Night palette. Bold and colorful.',
		nerdFont: true,
		palette: 'tokyonight',
		separator: 'powerline',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'python', 'cmd_duration']
	},
	{
		id: 'gruvbox',
		name: 'Gruvbox Rainbow',
		description: 'Warm retro powerline — every segment a different earthy hue.',
		nerdFont: true,
		palette: 'gruvbox',
		separator: 'powerline',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: [
			'username',
			'directory',
			'git_branch',
			'git_status',
			'nodejs',
			'golang',
			'rust',
			'time'
		]
	},
	{
		id: 'catppuccin',
		name: 'Catppuccin Powerline',
		description: 'Soft pastel powerline from the Catppuccin Mocha palette.',
		nerdFont: true,
		palette: 'catppuccin',
		separator: 'powerline',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'python', 'cmd_duration']
	},
	{
		id: 'pastel',
		name: 'Pastel Powerline',
		description: 'Rounded pastel segments — friendly and easy on the eyes.',
		nerdFont: true,
		palette: 'pastel',
		separator: 'round',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'cmd_duration']
	},
	{
		id: 'nord',
		name: 'Nord',
		description: 'Calm arctic blues in a clean powerline layout.',
		nerdFont: true,
		palette: 'nord',
		separator: 'powerline',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'python', 'rust']
	},
	{
		id: 'dracula',
		name: 'Dracula',
		description: 'High-contrast neon on near-black. Loud in the best way.',
		nerdFont: true,
		palette: 'dracula',
		separator: 'powerline',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'cmd_duration']
	},
	{
		id: 'rosepine',
		name: 'Rosé Pine',
		description: 'Muted, moody rounded segments with a soho-vibe palette.',
		nerdFont: true,
		palette: 'rosepine',
		separator: 'round',
		symbols: 'nerd',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'python']
	},
	{
		id: 'pure',
		name: 'Pure',
		description: 'The classic two-line minimalist prompt. No colors on the segments, just clarity.',
		nerdFont: false,
		palette: 'tokyonight',
		separator: 'plain',
		symbols: 'plain',
		twoLine: true,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'cmd_duration']
	},
	{
		id: 'jetpack',
		name: 'Jetpack',
		description: 'Pseudo-minimalist, geometry-inspired. Quiet until you need it.',
		nerdFont: false,
		palette: 'rosepine',
		separator: 'plain',
		symbols: 'plain',
		twoLine: true,
		charSymbol: '▶',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs']
	},
	{
		id: 'brackets',
		name: 'Bracketed Segments',
		description: 'Every module wrapped in [brackets]. Legible anywhere, no special font.',
		nerdFont: false,
		palette: 'terminal',
		separator: 'brackets',
		symbols: 'plain',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'python', 'cmd_duration']
	},
	{
		id: 'plaintext',
		name: 'Plain Text',
		description: 'Text labels instead of icons — perfect for a machine without a Nerd Font.',
		nerdFont: false,
		palette: 'nord',
		separator: 'plain',
		symbols: 'plain',
		twoLine: false,
		charSymbol: '$',
		modules: ['directory', 'git_branch', 'git_status', 'nodejs', 'python']
	},
	{
		id: 'minimal',
		name: 'Minimal',
		description: 'Just where you are and a prompt to type. Nothing else.',
		nerdFont: false,
		palette: 'terminal',
		separator: 'plain',
		symbols: 'plain',
		twoLine: false,
		charSymbol: '❯',
		modules: ['directory']
	}
];

export function getPreset(id: string): Preset {
	return PRESETS.find((p) => p.id === id) ?? PRESETS[0];
}
