import { describe, expect, it } from 'vitest';
import { retrieve, titleForId } from './retrieval';

describe('retrieval routing', () => {
	it('routes "what does chmod 755 mean" to section 5.2', () => {
		const hits = retrieve('what does chmod 755 mean');
		expect(hits[0]?.id).toBe('section-5-2');
	});

	it('routes "quit vim / frozen terminal" to 1.3 or the panic domain', () => {
		const hits = retrieve('quit vim / frozen terminal');
		expect(['section-1-3', 'cheat-panic-button']).toContain(hits[0]?.id);
	});

	it('routes "rm -rf safe?" to deleting-carefully or read-before-you-run', () => {
		const hits = retrieve('rm -rf safe?');
		expect(['section-3-3', 'section-6-1']).toContain(hits[0]?.id);
	});

	it('routes "pipe sort uniq" to section 4.4', () => {
		const hits = retrieve('pipe sort uniq');
		expect(hits[0]?.id).toBe('section-4-4');
	});

	it('routes "command not found" to section 5.4', () => {
		const hits = retrieve('command not found');
		expect(hits[0]?.id).toBe('section-5-4');
	});

	it('returns hits with titles, positive scores, and snippets', () => {
		const hits = retrieve('how do pipes work', 3);
		expect(hits.length).toBeGreaterThan(0);
		expect(hits.length).toBeLessThanOrEqual(3);
		for (const hit of hits) {
			expect(hit.title).toBeTruthy();
			expect(hit.score).toBeGreaterThan(0);
			expect(hit.snippet).toBeTruthy();
		}
	});

	it('deduplicates hits by section id', () => {
		const hits = retrieve('chmod permissions', 5);
		const ids = hits.map((h) => h.id);
		expect(new Set(ids).size).toBe(ids.length);
	});

	it('returns nothing for an empty query', () => {
		expect(retrieve('')).toEqual([]);
		expect(retrieve('   ')).toEqual([]);
	});

	it('returns nothing for stopword-only queries', () => {
		expect(retrieve('what is the how why')).toEqual([]);
	});

	it('returns nothing for garbage tokens', () => {
		expect(retrieve('xyzzyqwlkj blorptastic zzyzx9000')).toEqual([]);
	});

	it('looks up pretty titles by id', () => {
		expect(titleForId('section-5-2')).toBe('5.2 chmod');
		expect(titleForId('no-such-id')).toBeNull();
	});
});
