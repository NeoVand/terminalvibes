/**
 * Encode a PromptDesign into a short, URL-safe string and back, so a learner
 * can bookmark or share the exact prompt they built (`?sp=…` on the page URL).
 *
 * SECURITY: the decoded design is applied to the live preview (inline CSS) and
 * to the generated starship.toml, so a shared link is untrusted input. Every
 * field is validated and sanitised on the way in — unknown palettes fall back,
 * colors must be `#rrggbb`, and the prompt character is stripped of anything
 * that could break out of a CSS or TOML string.
 */

import { MODULE_IDS, type CustomColors, type ModuleId, type PromptDesign } from './types';
import { PALETTES } from './palettes';

const SEPARATORS = new Set(['powerline', 'round', 'plain', 'brackets']);
const SYMBOLS = new Set(['nerd', 'plain']);
const PALETTE_IDS = new Set<string>([...PALETTES.map((p) => p.id), 'custom']);
const HEX6 = /^#[0-9a-fA-F]{6}$/;
const MODULE_SET = new Set<string>(MODULE_IDS);

/** Compact wire form — short keys keep the URL small. */
interface Wire {
	p: string; // palette
	s: string; // separator
	y: string; // symbols
	t: 0 | 1; // twoLine
	c: string; // charSymbol
	m: string[]; // modules
	n: 0 | 1; // addNewline
	r: number; // truncation
	cc?: CustomColors; // custom colors
}

function b64urlEncode(s: string): string {
	const bytes = new TextEncoder().encode(s);
	let bin = '';
	for (const b of bytes) bin += String.fromCharCode(b);
	return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function b64urlDecode(s: string): string {
	const padded = s.replace(/-/g, '+').replace(/_/g, '/');
	const bin = atob(padded);
	const bytes = Uint8Array.from(bin, (ch) => ch.charCodeAt(0));
	return new TextDecoder().decode(bytes);
}

export function encodeDesign(d: PromptDesign): string {
	const wire: Wire = {
		p: d.palette,
		s: d.separator,
		y: d.symbols,
		t: d.twoLine ? 1 : 0,
		c: d.charSymbol,
		m: d.modules,
		n: d.addNewline ? 1 : 0,
		r: d.truncation ?? 3,
		...(d.palette === 'custom' && d.customColors ? { cc: d.customColors } : {})
	};
	return b64urlEncode(JSON.stringify(wire));
}

/** A prompt character we'll accept: a few printable glyphs, no quotes, angle
 *  brackets, backslashes or control chars (which could escape CSS/TOML). */
function safeChar(v: unknown): string {
	if (typeof v !== 'string') return '❯';
	const cleaned = v.replace(/["'<>\\\n\r\t]/g, '').trim();
	return cleaned.length >= 1 && cleaned.length <= 3 ? cleaned : '❯';
}

function safeColors(v: unknown): CustomColors | undefined {
	if (!v || typeof v !== 'object') return undefined;
	const o = v as Record<string, unknown>;
	const keys: (keyof CustomColors)[] = ['dir', 'git', 'runtime', 'meta', 'user', 'bg'];
	const out = {} as CustomColors;
	for (const k of keys) {
		const c = o[k];
		if (typeof c !== 'string' || !HEX6.test(c)) return undefined;
		out[k] = c;
	}
	return out;
}

/**
 * Decode a share string into a valid PromptDesign, or null if it isn't
 * parseable at all. Individual bad fields are repaired to safe defaults rather
 * than rejecting the whole thing.
 */
export function decodeDesign(raw: string): PromptDesign | null {
	let wire: unknown;
	try {
		wire = JSON.parse(b64urlDecode(raw));
	} catch {
		return null;
	}
	if (!wire || typeof wire !== 'object') return null;
	const w = wire as Record<string, unknown>;

	let palette = typeof w.p === 'string' && PALETTE_IDS.has(w.p) ? w.p : 'tokyonight';
	const customColors = safeColors(w.cc);
	// A 'custom' palette with no usable colors is meaningless — fall back.
	if (palette === 'custom' && !customColors) palette = 'tokyonight';

	const modules: ModuleId[] = Array.isArray(w.m)
		? w.m.filter((id, i, a): id is ModuleId => MODULE_SET.has(id as string) && a.indexOf(id) === i)
		: [];

	const rNum = typeof w.r === 'number' && Number.isFinite(w.r) ? Math.round(w.r) : 3;

	return {
		palette,
		separator: (typeof w.s === 'string' && SEPARATORS.has(w.s)
			? w.s
			: 'powerline') as PromptDesign['separator'],
		symbols: (typeof w.y === 'string' && SYMBOLS.has(w.y)
			? w.y
			: 'nerd') as PromptDesign['symbols'],
		twoLine: w.t === 1 || w.t === true,
		charSymbol: safeChar(w.c),
		modules,
		addNewline: w.n === 1 || w.n === true,
		truncation: Math.min(Math.max(rNum, 0), 10),
		...(palette === 'custom' && customColors ? { customColors } : {})
	};
}
