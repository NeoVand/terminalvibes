import { describe, it, expect } from 'vitest';
import { encodeDesign, decodeDesign } from './share';
import { getPreset } from './presets';
import type { PromptDesign } from './types';

describe('share codec', () => {
	it('round-trips a preset design', () => {
		const d: PromptDesign = { ...getPreset('gruvbox') };
		const back = decodeDesign(encodeDesign(d));
		expect(back).not.toBeNull();
		expect(back!.palette).toBe(d.palette);
		expect(back!.separator).toBe(d.separator);
		expect(back!.symbols).toBe(d.symbols);
		expect(back!.twoLine).toBe(d.twoLine);
		expect(back!.charSymbol).toBe(d.charSymbol);
		expect(back!.modules).toEqual(d.modules);
	});

	it('round-trips a custom palette design', () => {
		const d: PromptDesign = {
			palette: 'custom',
			separator: 'round',
			symbols: 'plain',
			twoLine: true,
			charSymbol: '➜',
			modules: ['directory', 'git_branch', 'git_status', 'nodejs'],
			addNewline: true,
			truncation: 0,
			customColors: {
				dir: '#aabbcc',
				git: '#112233',
				runtime: '#445566',
				meta: '#778899',
				user: '#ddeeff',
				bg: '#000000'
			}
		};
		const back = decodeDesign(encodeDesign(d));
		expect(back!.palette).toBe('custom');
		expect(back!.customColors).toEqual(d.customColors);
		expect(back!.truncation).toBe(0);
		expect(back!.addNewline).toBe(true);
	});

	it('returns null for unparseable input', () => {
		expect(decodeDesign('not-base64!!!')).toBeNull();
		expect(decodeDesign('')).toBeNull();
		expect(decodeDesign(btoa('42'))).toBeNull(); // valid b64, not an object
	});

	it('sanitises a prompt character that tries to break out of CSS/TOML', () => {
		const evil = encodeDesign({
			...getPreset('tokyonight'),
			charSymbol: `'](fg:red)\n[x`
		} as PromptDesign);
		const back = decodeDesign(evil);
		expect(back!.charSymbol).not.toContain("'");
		expect(back!.charSymbol).not.toContain('\n');
		expect(back!.charSymbol).not.toContain('(');
		// falls back to the default glyph when nothing safe remains
		expect(back!.charSymbol).toBe('❯');
	});

	it('drops invalid custom colors and falls back off custom', () => {
		// Hand-craft a wire object with a CSS-injection color.
		const wire = {
			p: 'custom',
			s: 'powerline',
			y: 'nerd',
			t: 0,
			c: '$',
			m: ['directory'],
			n: 0,
			r: 3,
			cc: {
				dir: 'red;background:url(x)',
				git: '#fff',
				runtime: '#fff',
				meta: '#fff',
				user: '#fff',
				bg: '#000'
			}
		};
		const enc = btoa(JSON.stringify(wire))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		const back = decodeDesign(enc);
		expect(back!.customColors).toBeUndefined();
		expect(back!.palette).toBe('tokyonight');
	});

	it('filters unknown modules and dedupes', () => {
		const wire = {
			p: 'nord',
			s: 'plain',
			y: 'nerd',
			t: 0,
			c: '$',
			m: ['directory', 'directory', 'evil_module', 'nodejs'],
			n: 0,
			r: 99
		};
		const enc = btoa(JSON.stringify(wire))
			.replace(/\+/g, '-')
			.replace(/\//g, '_')
			.replace(/=+$/, '');
		const back = decodeDesign(enc);
		expect(back!.modules).toEqual(['directory', 'nodejs']);
		expect(back!.truncation).toBe(10); // clamped
	});
});
