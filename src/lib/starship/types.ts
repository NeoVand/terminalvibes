/**
 * Model for the Starship prompt designer. A `PromptDesign` is the structured,
 * editable state; both the live preview and the generated `starship.toml`
 * derive from it, so what you see is what you get.
 *
 * Starship is a real, cross-shell prompt (starship.rs). The designer produces
 * a genuine config file for the learner's own machine — the in-app preview is
 * a faithful approximation drawn with CSS + icons (no Nerd Font needed here),
 * while the exported TOML uses Starship's real symbols and palette syntax.
 */

export const MODULE_IDS = [
	'username',
	'hostname',
	'directory',
	'git_branch',
	'git_status',
	'nodejs',
	'python',
	'rust',
	'golang',
	'package',
	'docker_context',
	'java',
	'ruby',
	'php',
	'aws',
	'kubernetes',
	'cmd_duration',
	'time',
	'battery'
] as const;

export type ModuleId = (typeof MODULE_IDS)[number];

/** How segments are joined visually (and in the generated format string). */
export type Separator = 'powerline' | 'round' | 'plain' | 'brackets';

/** Nerd Font glyphs vs plain ASCII/Unicode that renders in any terminal. */
export type SymbolSet = 'nerd' | 'plain';

export interface PromptDesign {
	/** id of the palette in PALETTES */
	palette: string;
	separator: Separator;
	symbols: SymbolSet;
	/** put the prompt character on its own second line */
	twoLine: boolean;
	/** the character module's success symbol, e.g. '❯' */
	charSymbol: string;
	/** enabled modules, in display order (subset of MODULE_IDS) */
	modules: ModuleId[];
	/** blank line above the prompt (Starship add_newline). Default false. */
	addNewline?: boolean;
	/** directory truncation length; 0 = full path. Default 3. */
	truncation?: number;
}

export interface Preset extends PromptDesign {
	id: string;
	name: string;
	description: string;
	/** true if the design leans on Nerd Font glyphs to look its best */
	nerdFont: boolean;
}

/**
 * A color theme. `ring` supplies the segment background colors used by
 * powerline/round styles (cycled across segments); `text.*` are the per-module
 * foreground colors used by plain/brackets styles. `bg`/`fg` set the preview
 * terminal's own colors so each theme previews in its native look.
 */
export interface Palette {
	id: string;
	name: string;
	/** terminal background in the preview */
	bg: string;
	/** default terminal foreground in the preview */
	fg: string;
	/** segment background ring for powerline/round segments */
	ring: string[];
	/** foreground drawn on top of the ring colors */
	onRing: string;
	/** per-module text color for plain/brackets styles */
	text: Record<ModuleId, string>;
	/** prompt character colors */
	charOk: string;
	charErr: string;
}

/** One rendered chunk of the preview prompt. */
export interface PreviewSegment {
	id: ModuleId | 'char';
	/** lucide icon name to draw, if any */
	icon?: string;
	/** literal glyph/text prefix (used when no icon) */
	glyph?: string;
	text: string;
	/** background color (powerline/round); undefined = transparent */
	bg?: string;
	fg: string;
}
