import type { ModuleId, PromptDesign, PreviewSegment } from './types';
import { getPalette } from './palettes';

/** Per-module metadata: sample values for the preview, and the real symbols
 *  (Nerd Font glyph vs plain text) used in the generated config. */
interface ModuleMeta {
	sample: string;
	/** lucide icon name for the preview (clean, always renders) */
	icon?: string;
	/** unicode/emoji fallback in the preview when there's no icon */
	glyph?: string;
	/** Starship symbol when Nerd Font glyphs are on (real E0xx codepoints) */
	nerd: string;
	/** Starship symbol when plain (renders in any font) */
	plain: string;
}

const META: Record<ModuleId, ModuleMeta> = {
	username: { sample: 'vibe', nerd: '', plain: '' },
	hostname: { sample: 'macbook', glyph: '@', nerd: '', plain: '@' },
	directory: { sample: '~/projects/app', icon: 'Folder', nerd: ' ', plain: '' },
	git_branch: { sample: 'main', icon: 'GitBranch', nerd: ' ', plain: 'on ' },
	git_status: { sample: '', nerd: '', plain: '' },
	nodejs: { sample: 'v20.11', glyph: '⬢', nerd: ' ', plain: 'node ' },
	python: { sample: '3.12', glyph: '🐍', nerd: ' ', plain: 'py ' },
	rust: { sample: '1.78', glyph: '🦀', nerd: ' ', plain: 'rs ' },
	golang: { sample: '1.22', glyph: '🐹', nerd: ' ', plain: 'go ' },
	package: { sample: 'v1.0.0', icon: 'Package', nerd: ' ', plain: 'pkg ' },
	cmd_duration: { sample: '2s', icon: 'Timer', nerd: ' ', plain: 'took ' },
	time: { sample: '14:30', icon: 'Clock', nerd: ' ', plain: '@' },
	battery: { sample: '82%', icon: 'BatteryMedium', nerd: ' ', plain: 'bat ' }
};

/** Powerline / round separator glyphs (Nerd Font private-use area). */
const PL = { right: '', roundL: '', roundR: '', fade: '░▒▓' };

/** Collapse the module list into display order, merging git_branch/git_status
 *  into a single 'git' visual segment (as real Starship prompts show them). */
function normalized(modules: ModuleId[]): { key: ModuleId | 'git'; hasStatus: boolean }[] {
	const out: { key: ModuleId | 'git'; hasStatus: boolean }[] = [];
	let gitPushed = false;
	for (const id of modules) {
		if (id === 'git_branch' || id === 'git_status') {
			if (!gitPushed) {
				out.push({ key: 'git', hasStatus: modules.includes('git_status') });
				gitPushed = true;
			}
		} else {
			out.push({ key: id, hasStatus: false });
		}
	}
	return out;
}

/** Build the preview segments (what the fake terminal renders). */
export function toSegments(design: PromptDesign): {
	line: PreviewSegment[];
	char: PreviewSegment;
} {
	const pal = getPalette(design.palette);
	const powerline = design.separator === 'powerline' || design.separator === 'round';
	const line: PreviewSegment[] = [];
	let ring = 0;
	for (const { key, hasStatus } of normalized(design.modules)) {
		if (key === 'git') {
			line.push({
				id: 'git_branch',
				icon: 'GitBranch',
				text: 'main' + (hasStatus ? ' ✱' : ''),
				bg: powerline ? pal.ring[ring % pal.ring.length] : undefined,
				fg: powerline ? pal.onRing : pal.text.git_branch
			});
		} else {
			const meta = META[key];
			line.push({
				id: key,
				icon: meta.icon,
				glyph: meta.icon ? undefined : meta.glyph,
				text: meta.sample,
				bg: powerline ? pal.ring[ring % pal.ring.length] : undefined,
				fg: powerline ? pal.onRing : pal.text[key]
			});
		}
		ring++;
	}
	return { line, char: { id: 'char', text: design.charSymbol, fg: pal.charOk } };
}

function sym(design: PromptDesign, id: ModuleId): string {
	return design.symbols === 'nerd' ? META[id].nerd : META[id].plain;
}

/** Generate a real, valid `starship.toml` from the design. */
export function toToml(design: PromptDesign): string {
	const pal = getPalette(design.palette);
	const powerline = design.separator === 'powerline' || design.separator === 'round';
	const round = design.separator === 'round';
	const brackets = design.separator === 'brackets';
	const norm = normalized(design.modules);

	// Assign a ring color per visual segment.
	const segColor = new Map<ModuleId | 'git', string>();
	norm.forEach((n, i) => segColor.set(n.key, pal.ring[i % pal.ring.length]));

	const lines: string[] = [];
	lines.push('"$schema" = \'https://starship.rs/config-schema.json\'', '');
	lines.push('add_newline = false', '');

	// ── format string ───────────────────────────────────────────────
	const fmt: string[] = [];
	if (powerline) {
		const first = segColor.get(norm[0]?.key ?? 'directory')!;
		fmt.push(round ? `[${PL.roundL}](fg:${first})\\` : `[${PL.fade}](fg:${first})\\`);
		norm.forEach((n, i) => {
			const refs = n.key === 'git' ? '$git_branch$git_status' : `$${n.key}`;
			fmt.push(`${refs}\\`);
			const cur = segColor.get(n.key)!;
			const next = norm[i + 1] ? segColor.get(norm[i + 1].key)! : null;
			if (next) fmt.push(`[${PL.right}](fg:${cur} bg:${next})\\`);
			else fmt.push(`[${round ? PL.roundR : PL.right}](fg:${cur})\\`);
		});
	} else {
		norm.forEach((n) => fmt.push(n.key === 'git' ? '$git_branch$git_status\\' : `$${n.key}\\`));
	}
	// The character must sit flush against the closing """ (no trailing newline,
	// which TOML would keep and render as a blank line). Two-line uses a literal
	// \n before it.
	fmt.push(design.twoLine ? '\\n$character' : '$character');
	lines.push('format = """', fmt.join('\n') + '"""', '');

	// ── character ───────────────────────────────────────────────────
	lines.push('[character]');
	lines.push(`success_symbol = '[${design.charSymbol}](bold fg:${pal.charOk})'`);
	lines.push(`error_symbol = '[${design.charSymbol}](bold fg:${pal.charErr})'`, '');

	// ── each module section ─────────────────────────────────────────
	const styleOf = (id: ModuleId, seg: ModuleId | 'git') =>
		powerline ? `fg:${pal.onRing} bg:${segColor.get(seg) ?? pal.ring[0]}` : `fg:${pal.text[id]}`;

	const pad = (inner: string) => {
		if (powerline) return `'[ ${inner} ]($style)'`;
		if (brackets) return `'\\[[${inner}]($style)\\] '`;
		return `'[${inner} ]($style)'`;
	};

	/** One module section: header, options, symbol, style, format — no dupes. */
	const emit = (
		id: ModuleId,
		seg: ModuleId | 'git',
		body: string,
		opts: { symbol?: string; extra?: string[] } = {}
	) => {
		lines.push(`[${id}]`);
		for (const e of opts.extra ?? []) lines.push(e);
		if (opts.symbol !== undefined) lines.push(`symbol = '${opts.symbol}'`);
		lines.push(`style = "${styleOf(id, seg)}"`);
		lines.push(`format = ${body}`, '');
	};

	for (const { key } of norm) {
		if (key === 'git') {
			emit('git_branch', 'git', pad('$symbol$branch'), { symbol: sym(design, 'git_branch') });
			if (design.modules.includes('git_status')) {
				emit(
					'git_status',
					'git',
					powerline
						? `'[ $all_status$ahead_behind]($style)'`
						: `'([$all_status$ahead_behind]($style) )'`
				);
			}
			continue;
		}
		if (key === 'directory') {
			emit('directory', 'directory', pad('$path'), {
				extra: ['truncation_length = 3', "truncation_symbol = '…/'"]
			});
			continue;
		}
		if (key === 'username') {
			emit('username', 'username', pad('$user'), { extra: ['show_always = true'] });
			continue;
		}
		if (key === 'cmd_duration') {
			emit('cmd_duration', 'cmd_duration', pad(`${sym(design, 'cmd_duration')}$duration`), {
				extra: ['min_time = 500']
			});
			continue;
		}
		if (key === 'time') {
			emit('time', 'time', pad(`${sym(design, 'time')}$time`), {
				extra: ['disabled = false', "time_format = '%R'"]
			});
			continue;
		}
		// language/runtime + package + hostname + battery
		emit(key, key, pad('$symbol($version)'), { symbol: sym(design, key) });
	}

	return (
		lines
			.join('\n')
			.replace(/\n{3,}/g, '\n\n')
			.trimEnd() + '\n'
	);
}

/** The shell init lines shown in the install instructions. */
export const INIT_LINES: Record<string, { file: string; line: string }> = {
	bash: { file: '~/.bashrc', line: 'eval "$(starship init bash)"' },
	zsh: { file: '~/.zshrc', line: 'eval "$(starship init zsh)"' },
	fish: { file: '~/.config/fish/config.fish', line: 'starship init fish | source' }
};
