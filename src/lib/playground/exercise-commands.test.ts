import { cheatSheet, matchesReference } from '../data/cheat-sheet';
import { describe, expect, it } from 'vitest';
import {
	commandWordsOf,
	exerciseFocusOf,
	referenceMatchesExercise,
	rowUsesWords
} from './exercise-commands';

describe('commandWordsOf', () => {
	it('takes the first word of a simple command', () => {
		expect(commandWordsOf('ls -la')).toEqual(['ls']);
	});

	it('yields one word per pipeline segment', () => {
		expect(commandWordsOf('cat access.log | sort | uniq -c')).toEqual(['cat', 'sort', 'uniq']);
	});

	it('unwraps sudo, keeping both words', () => {
		expect(commandWordsOf('sudo chown neo notes.txt')).toEqual(['sudo', 'chown']);
	});

	it('skips VAR=value prefixes', () => {
		expect(commandWordsOf('PORT=3000 node server.js')).toEqual(['node']);
	});

	it('does not split on pipes inside quotes', () => {
		expect(commandWordsOf("sed 's/a|b/c/' notes.txt")).toEqual(['sed']);
	});
});

describe('exerciseFocusOf', () => {
	it('resolves a playground anchor to its suggested command words', () => {
		const focus = exerciseFocusOf('first-steps');
		expect(focus?.kind).toBe('playground');
		expect(focus?.title).toBe('Say hello to the machine');
		for (const word of ['whoami', 'pwd', 'date', 'echo']) {
			expect(focus?.words.has(word)).toBe(true);
		}
	});

	it('resolves a challenge anchor to its pool command words', () => {
		const focus = exerciseFocusOf('ch-3-after-the-agent');
		expect(focus?.kind).toBe('challenge');
		expect(focus?.words.size).toBeGreaterThan(0);
	});

	it('returns null for ordinary sections and null input', () => {
		expect(exerciseFocusOf('section-3-2')).toBeNull();
		expect(exerciseFocusOf('hero')?.references?.has('say-hello')).toBe(true);
		expect(exerciseFocusOf(null)).toBeNull();
	});
});

describe('rowUsesWords', () => {
	const words = new Set(['ls', 'grep']);

	it('matches a row whose command word is in the set', () => {
		expect(rowUsesWords('ls -a', words)).toBe(true);
		expect(rowUsesWords('grep -r "<text>" .', words)).toBe(true);
	});

	it('rejects rows outside the set, including key chords', () => {
		expect(rowUsesWords('mkdir <folder>', words)).toBe(false);
		expect(rowUsesWords('Ctrl+C', words)).toBe(false);
	});
});

describe('beginner reference focus', () => {
	const entries = cheatSheet.flatMap((category) => category.commands);
	it('all curated references resolve to an actual row', () => {
		for (const id of [
			'hero',
			'hello-first-command',
			'keyboard-workshop',
			'first-steps',
			'help-lookup',
			'navigation',
			'workspace-setup',
			'edit-notes'
		]) {
			const focus = exerciseFocusOf(id)!;
			for (const reference of focus.references ?? [])
				expect(
					entries.some((entry) => entry.id === reference),
					`${id}: ${reference}`
				).toBe(true);
		}
	});
	it('hello focuses on printing, recall, and cancel, without unrelated echo examples', () => {
		const focus = exerciseFocusOf('hero')!;
		expect(
			entries.filter((entry) => referenceMatchesExercise(entry, focus)).map((entry) => entry.id)
		).toEqual(['key-history', 'key-cancel', 'say-hello']);
	});
	it('finds a shortcut by a learner’s problem rather than its key name', () => {
		expect(
			entries
				.filter((entry) => matchesReference(entry, 'delete a whole line'))
				.map((entry) => entry.id)
		).toContain('key-whole-line');
		expect(
			entries.filter((entry) => matchesReference(entry, 'replace word')).map((entry) => entry.id)
		).toContain('key-word');
	});
});
