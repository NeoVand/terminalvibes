import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import manifest from './timeline-manifest.json';

/**
 * The sidebar is a DISPLAY index — hand-maintained, and therefore free to drift
 * from the page it claims to describe. It did: `quoting` ("Mind the Gap") sat
 * after `navigation` ("Find the Lost API Key") in Part 2, while the rendered
 * page has it two anchors earlier. A reader following the contents list met the
 * playgrounds in the wrong order with no way to know the list was lying.
 *
 * `timeline-manifest.json` is generated from the section components by
 * scripts/build-timeline.mjs, so it IS document order by construction. Assert
 * the hand-written list against the generated one and the drift cannot come
 * back silently.
 *
 * Ids are read out of the source text rather than imported: sidebar-nav.ts
 * imports lucide components that this node-environment test can't evaluate.
 * Same trick keys.test.ts and scripts/build-course-index.mjs use.
 */

const source = readFileSync(new URL('./sidebar-nav.ts', import.meta.url), 'utf8');

/** Every `id: '…'` in the file, in the order the sidebar renders them. */
const navIds = [...source.matchAll(/id:\s*'([a-z0-9][a-z0-9-]*)'/g)].map((m) => m[1]);

const docIndex = new Map((manifest as { id: string }[]).map((it, i) => [it.id, i]));

describe('sidebar navigation', () => {
	it('found ids to check', () => {
		// Guards the regex: a refactor that changes the quoting style would
		// otherwise leave every assertion below vacuously true.
		expect(navIds.length).toBeGreaterThan(90);
	});

	it('lists every entry in true document order', () => {
		const known = navIds.filter((id) => docIndex.has(id));
		const violations: string[] = [];
		for (let i = 1; i < known.length; i++) {
			const prev = docIndex.get(known[i - 1])!;
			const cur = docIndex.get(known[i])!;
			if (cur < prev) {
				violations.push(
					`"${known[i]}" (doc #${cur}) is listed after "${known[i - 1]}" (doc #${prev})`
				);
			}
		}
		expect(violations).toEqual([]);
	});

	it('references only anchors that exist on the page', () => {
		expect(navIds.filter((id) => !docIndex.has(id))).toEqual([]);
	});

	it('omits no playground or challenge the page actually renders', () => {
		const rendered = (manifest as { id: string; kind: string }[])
			.filter((it) => it.kind === 'playground' || it.kind === 'challenge')
			.map((it) => it.id);
		const listed = new Set(navIds);
		expect(rendered.filter((id) => !listed.has(id))).toEqual([]);
	});
});
