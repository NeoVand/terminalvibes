import { describe, expect, it } from 'vitest';
import { PRESETS } from './presets';
import { PALETTES } from './palettes';
import { toToml, toSegments, toOneLiner } from './generate';

describe('starship generator', () => {
	it('every preset generates a non-trivial, well-formed starship.toml', () => {
		for (const preset of PRESETS) {
			const toml = toToml(preset);
			// core pieces present
			expect(toml, preset.id).toContain('format = """');
			expect(toml, preset.id).toContain('[character]');
			expect(toml, preset.id).toContain(preset.charSymbol);
			// no section header appears twice (would be invalid / clobbering)
			const headers = [...toml.matchAll(/^\[([a-z_]+)\]$/gm)].map((m) => m[1]);
			const dupes = headers.filter((h, i) => headers.indexOf(h) !== i);
			expect(dupes, `${preset.id} duplicate sections: ${dupes}`).toHaveLength(0);
			// every enabled module is referenced in the format layout
			for (const mod of preset.modules) {
				expect(toml, `${preset.id} refs ${mod}`).toContain(`$${mod}`);
			}
			// balanced triple-quote block
			expect((toml.match(/"""/g) ?? []).length).toBe(2);
		}
	});

	it('powerline designs emit a palette-less inline color scheme with bg transitions', () => {
		const tn = PRESETS.find((p) => p.id === 'tokyonight')!;
		const toml = toToml(tn);
		expect(toml).toMatch(/bg:#[0-9a-f]{6}/i); // colored segments, bare hex (no quotes)
		expect(toml).not.toMatch(/fg:'#/); // Starship rejects quoted hex
		expect(toml).toContain('add_newline = false');
		// $character sits flush against the closing """ (no blank trailing line)
		expect(toml).toMatch(/\$character"""/);
	});

	it('plain/brackets designs use foreground colors, not backgrounds', () => {
		const plain = PRESETS.find((p) => p.id === 'plaintext')!;
		const toml = toToml(plain);
		expect(toml).not.toContain('bg:'); // no powerline backgrounds
	});

	it('two-line designs put the character on its own line', () => {
		const pure = PRESETS.find((p) => p.id === 'pure')!;
		expect(toToml(pure)).toContain('\\n$character');
		const oneLine = PRESETS.find((p) => p.id === 'tokyonight')!;
		expect(toToml(oneLine)).not.toContain('\\n$character');
	});

	it('toSegments returns one segment per visual module (git merged) plus the character', () => {
		for (const preset of PRESETS) {
			const { line, char } = toSegments(preset);
			expect(char.text).toBe(preset.charSymbol);
			// git_branch + git_status collapse to one segment
			const gitCount = preset.modules.filter(
				(m) => m === 'git_branch' || m === 'git_status'
			).length;
			const expected = preset.modules.length - Math.max(0, gitCount - 1);
			expect(line.length, preset.id).toBe(expected);
		}
	});

	it('every palette defines a color for every module', () => {
		for (const pal of PALETTES) {
			expect(Object.keys(pal.text).length).toBeGreaterThanOrEqual(13);
			expect(pal.ring.length).toBeGreaterThanOrEqual(4);
		}
	});

	describe('one-liner install', () => {
		const tn = PRESETS.find((p) => p.id === 'tokyonight')!;
		const toml = toToml(tn);

		it('bash/zsh embed the exact TOML in a quoted heredoc and append the init line', () => {
			for (const shell of ['bash', 'zsh'] as const) {
				const cmd = toOneLiner(toml, shell);
				// The heredoc body between the markers must be the TOML verbatim.
				const body = cmd.slice(
					cmd.indexOf("<<'STARSHIP_TOML'\n") + "<<'STARSHIP_TOML'\n".length,
					cmd.indexOf('\nSTARSHIP_TOML\n')
				);
				expect(body).toBe(toml.trimEnd());
				expect(cmd).toContain(`starship init ${shell}`);
				expect(cmd).toContain(shell === 'bash' ? '~/.bashrc' : '~/.zshrc');
				expect(cmd.trimEnd().endsWith(`exec ${shell}`)).toBe(true);
				// idempotent guard present
				expect(cmd).toContain('grep -qF');
			}
		});

		it('never runs a stranger’s script — no curl|sh, config is inline', () => {
			const cmd = toOneLiner(toml, 'zsh');
			expect(cmd).not.toMatch(/curl|wget|\bsh\b\s*$/m);
		});

		it('fish avoids heredocs and single-quote-escapes the body', () => {
			const cmd = toOneLiner(toml, 'fish');
			expect(cmd).not.toContain("<<'STARSHIP_TOML'");
			expect(cmd).toContain('printf');
			expect(cmd).toContain('starship init fish');
			expect(cmd.trimEnd().endsWith('exec fish')).toBe(true);
			// The escaped body must not contain a bare single quote that would
			// terminate the fish string early.
			const inner = cmd.slice(cmd.indexOf("printf '%s\\n' '") + "printf '%s\\n' '".length);
			const bodyEnd = inner.indexOf("' > ~/.config/starship.toml");
			const escapedBody = inner.slice(0, bodyEnd);
			expect(escapedBody).not.toMatch(/(^|[^\\])'/);
		});
	});
});
