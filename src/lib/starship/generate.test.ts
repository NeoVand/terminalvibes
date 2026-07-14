import { describe, expect, it } from 'vitest';
import { PRESETS } from './presets';
import { PALETTES } from './palettes';
import { toToml, toSegments } from './generate';

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
});
