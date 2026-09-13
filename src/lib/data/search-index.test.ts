import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { searchEntries, searchIndex } from './search-index';
import { cheatSheet } from './cheat-sheet';

describe('learner-intent search', () => {
	it('finds early keyboard practice for plain-language editing requests', () => {
		for (const query of ['delete whole line', 'beginning of line', 'replace a word', 'Ctrl+K']) {
			expect(searchEntries(query)[0]?.sectionId, query).toBe('keyboard-workshop');
		}
	});

	it('finds a first action, file editing, and practical advanced tools', () => {
		expect(
			searchEntries('first command').some((entry) => entry.sectionId === 'hello-first-command')
		).toBe(true);
		expect(searchEntries('edit notes').some((entry) => entry.sectionId === 'edit-notes')).toBe(
			true
		);
		expect(searchEntries('tmux').some((entry) => entry.sectionId === 'section-12-4')).toBe(true);
		expect(searchEntries('shellcheck').some((entry) => entry.sectionId === 'section-13-2')).toBe(
			true
		);
	});

	it('honors curated destinations rather than inferring a lesson from a shared command word', () => {
		for (const entry of cheatSheet.flatMap((category) => category.commands)) {
			if (!entry.id || (!entry.lessonId && entry.kind !== 'shortcut')) continue;
			const result = searchIndex.find((result) => result.id === `reference-${entry.id}`);
			expect(result?.sectionId, entry.command).toBe(
				entry.kind === 'shortcut' ? 'keyboard-workshop' : entry.lessonId
			);
		}
	});

	it('has unique result identities and only current chapter destinations', () => {
		expect(new Set(searchIndex.map((entry) => entry.id)).size).toBe(searchIndex.length);
		const course = Array.from({ length: 14 }, (_, index) =>
			readFileSync(
				new URL(`../components/sections/Part${index + 1}.svelte`, import.meta.url),
				'utf8'
			)
		).join('\n');
		const ids = new Set([...course.matchAll(/\bid="([^"]+)"/g)].map((match) => match[1]));
		for (const entry of searchIndex.filter((entry) => /^section-\d+-\d+$/.test(entry.sectionId))) {
			expect(ids.has(entry.sectionId), entry.sectionId).toBe(true);
		}
	});
});
