import type { CustomColors, ModuleId, Palette, PromptDesign } from './types';

/** Build a per-module text-color map from a small set of role colors. */
function text(roles: {
	dir: string;
	git: string;
	runtime: string;
	meta: string;
	user: string;
}): Record<ModuleId, string> {
	return {
		username: roles.user,
		hostname: roles.user,
		directory: roles.dir,
		git_branch: roles.git,
		git_status: roles.git,
		nodejs: roles.runtime,
		python: roles.runtime,
		rust: roles.runtime,
		golang: roles.runtime,
		package: roles.runtime,
		docker_context: roles.runtime,
		java: roles.runtime,
		ruby: roles.runtime,
		php: roles.runtime,
		aws: roles.meta,
		kubernetes: roles.meta,
		cmd_duration: roles.meta,
		time: roles.meta,
		battery: roles.meta
	};
}

export const PALETTES: Palette[] = [
	{
		id: 'tokyonight',
		name: 'Tokyo Night',
		bg: '#1a1b26',
		fg: '#c0caf5',
		ring: ['#7aa2f7', '#bb9af7', '#7dcfff', '#9ece6a', '#e0af68', '#f7768e'],
		onRing: '#1a1b26',
		text: text({
			dir: '#7aa2f7',
			git: '#bb9af7',
			runtime: '#7dcfff',
			meta: '#565f89',
			user: '#9ece6a'
		}),
		charOk: '#9ece6a',
		charErr: '#f7768e'
	},
	{
		id: 'gruvbox',
		name: 'Gruvbox Rainbow',
		bg: '#282828',
		fg: '#ebdbb2',
		ring: ['#d65d0e', '#d79921', '#98971a', '#689d6a', '#458588', '#b16286'],
		onRing: '#282828',
		text: text({
			dir: '#83a598',
			git: '#d3869b',
			runtime: '#8ec07c',
			meta: '#928374',
			user: '#b8bb26'
		}),
		charOk: '#b8bb26',
		charErr: '#fb4934'
	},
	{
		id: 'catppuccin',
		name: 'Catppuccin Powerline',
		bg: '#1e1e2e',
		fg: '#cdd6f4',
		ring: ['#f38ba8', '#fab387', '#f9e2af', '#a6e3a1', '#89b4fa', '#cba6f7'],
		onRing: '#11111b',
		text: text({
			dir: '#89b4fa',
			git: '#cba6f7',
			runtime: '#a6e3a1',
			meta: '#6c7086',
			user: '#f9e2af'
		}),
		charOk: '#a6e3a1',
		charErr: '#f38ba8'
	},
	{
		id: 'pastel',
		name: 'Pastel',
		bg: '#292c3c',
		fg: '#eceff4',
		ring: ['#DA627D', '#FCA17D', '#86BBD8', '#06969A', '#33658A'],
		onRing: '#0f1117',
		text: text({
			dir: '#86BBD8',
			git: '#DA627D',
			runtime: '#06969A',
			meta: '#8892a6',
			user: '#FCA17D'
		}),
		charOk: '#a6e3a1',
		charErr: '#DA627D'
	},
	{
		id: 'nord',
		name: 'Nord',
		bg: '#2e3440',
		fg: '#d8dee9',
		ring: ['#5e81ac', '#81a1c1', '#88c0d0', '#8fbcbb', '#a3be8c', '#b48ead'],
		onRing: '#2e3440',
		text: text({
			dir: '#88c0d0',
			git: '#b48ead',
			runtime: '#8fbcbb',
			meta: '#616e88',
			user: '#a3be8c'
		}),
		charOk: '#a3be8c',
		charErr: '#bf616a'
	},
	{
		id: 'dracula',
		name: 'Dracula',
		bg: '#282a36',
		fg: '#f8f8f2',
		ring: ['#bd93f9', '#ff79c6', '#8be9fd', '#50fa7b', '#f1fa8c', '#ffb86c'],
		onRing: '#282a36',
		text: text({
			dir: '#8be9fd',
			git: '#ff79c6',
			runtime: '#50fa7b',
			meta: '#6272a4',
			user: '#f1fa8c'
		}),
		charOk: '#50fa7b',
		charErr: '#ff5555'
	},
	{
		id: 'rosepine',
		name: 'Rosé Pine',
		bg: '#191724',
		fg: '#e0def4',
		ring: ['#eb6f92', '#f6c177', '#ebbcba', '#31748f', '#9ccfd8', '#c4a7e7'],
		onRing: '#191724',
		text: text({
			dir: '#9ccfd8',
			git: '#c4a7e7',
			runtime: '#ebbcba',
			meta: '#6e6a86',
			user: '#f6c177'
		}),
		charOk: '#9ccfd8',
		charErr: '#eb6f92'
	},
	{
		id: 'onedark',
		name: 'One Dark',
		bg: '#282c34',
		fg: '#abb2bf',
		ring: ['#61afef', '#c678dd', '#56b6c2', '#98c379', '#e5c07b', '#e06c75'],
		onRing: '#282c34',
		text: text({
			dir: '#61afef',
			git: '#c678dd',
			runtime: '#98c379',
			meta: '#5c6370',
			user: '#e5c07b'
		}),
		charOk: '#98c379',
		charErr: '#e06c75'
	},
	{
		id: 'solarized',
		name: 'Solarized Dark',
		bg: '#002b36',
		fg: '#93a1a1',
		ring: ['#268bd2', '#6c71c4', '#2aa198', '#859900', '#b58900', '#cb4b16'],
		onRing: '#002b36',
		text: text({
			dir: '#268bd2',
			git: '#6c71c4',
			runtime: '#2aa198',
			meta: '#586e75',
			user: '#859900'
		}),
		charOk: '#859900',
		charErr: '#dc322f'
	},
	{
		id: 'everforest',
		name: 'Everforest',
		bg: '#2d353b',
		fg: '#d3c6aa',
		ring: ['#7fbbb3', '#d699b6', '#83c092', '#a7c080', '#dbbc7f', '#e67e80'],
		onRing: '#2d353b',
		text: text({
			dir: '#7fbbb3',
			git: '#d699b6',
			runtime: '#a7c080',
			meta: '#859289',
			user: '#dbbc7f'
		}),
		charOk: '#a7c080',
		charErr: '#e67e80'
	},
	{
		id: 'monokai',
		name: 'Monokai',
		bg: '#272822',
		fg: '#f8f8f2',
		ring: ['#66d9ef', '#ae81ff', '#a6e22e', '#fd971f', '#f92672', '#e6db74'],
		onRing: '#272822',
		text: text({
			dir: '#66d9ef',
			git: '#f92672',
			runtime: '#a6e22e',
			meta: '#75715e',
			user: '#e6db74'
		}),
		charOk: '#a6e22e',
		charErr: '#f92672'
	},
	{
		id: 'terminal',
		name: 'Terminal Green',
		bg: '#0c0f0c',
		fg: '#d6e6d0',
		ring: ['#3e6f3a', '#4b7f46', '#67b177', '#5a8f6a', '#7ee787', '#4d7ea8'],
		onRing: '#0c0f0c',
		text: text({
			dir: '#7ee787',
			git: '#67b177',
			runtime: '#86efac',
			meta: '#5c6a5c',
			user: '#a7e0a0'
		}),
		charOk: '#7ee787',
		charErr: '#e06c75'
	}
];

export function getPalette(id: string): Palette {
	return PALETTES.find((p) => p.id === id) ?? PALETTES[0];
}

/** Sensible starting point for a hand-built theme (Tokyo Night's roles). */
export const DEFAULT_CUSTOM: CustomColors = {
	dir: '#7aa2f7',
	git: '#bb9af7',
	runtime: '#7dcfff',
	meta: '#565f89',
	user: '#9ece6a',
	bg: '#1a1b26'
};

/** Read the five role colors back out of an existing palette, so entering
 *  "custom" mode starts from whatever theme you were already on. */
export function rolesOf(pal: Palette): CustomColors {
	return {
		dir: pal.text.directory,
		git: pal.text.git_branch,
		runtime: pal.text.nodejs,
		meta: pal.text.time,
		user: pal.text.username,
		bg: pal.bg
	};
}

/** Turn a learner's five role colors into a full Palette. The powerline ring
 *  cycles the role colors; text is dark-on-color for powerline (onRing = bg). */
export function buildCustomPalette(c: CustomColors): Palette {
	return {
		id: 'custom',
		name: 'Custom',
		bg: c.bg,
		fg: '#e6e6e6',
		ring: [c.dir, c.git, c.runtime, c.user, c.meta],
		onRing: c.bg,
		text: text({ dir: c.dir, git: c.git, runtime: c.runtime, meta: c.meta, user: c.user }),
		charOk: c.runtime,
		charErr: '#f7768e'
	};
}

/** The palette a design should render with: a custom one if the learner built
 *  it, otherwise the named preset palette. Used by both the preview and TOML. */
export function resolvePalette(design: PromptDesign): Palette {
	return design.palette === 'custom' && design.customColors
		? buildCustomPalette(design.customColors)
		: getPalette(design.palette);
}
