import { describe, expect, it } from 'vitest';
import { cheatSheet, searchReferences } from './cheat-sheet';

describe('reference intent search', () => {
	it('finds deleting a command line without unrelated disk-usage results', () => {
		const hits = searchReferences('delete a whole line');
		expect(hits.map((hit) => hit.id)).toEqual(['key-whole-line']);
		expect(hits.some((hit) => hit.command.startsWith('du '))).toBe(false);
	});

	it('accepts the same question with different capitalization, spaces, and punctuation', () => {
		expect(searchReferences('  DELETE  A WHOLE LINE? ').map((hit) => hit.id)).toEqual([
			'key-whole-line'
		]);
	});

	it('still finds commands and descriptions without a curated phrase', () => {
		expect(searchReferences('cat').map((hit) => hit.id)).toContain('read-file');
		expect(searchReferences('manual page').map((hit) => hit.id)).toContain('command-help');
		expect(searchReferences('not-a-command-xyzzy')).toEqual([]);
		expect(searchReferences('')).toHaveLength(
			cheatSheet.flatMap((category) => category.commands).length
		);
	});
});
