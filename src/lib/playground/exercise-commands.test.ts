import { describe, expect, it } from 'vitest';
import { commandWordsOf, exerciseFocusOf, rowUsesWords } from './exercise-commands';

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
		expect(exerciseFocusOf('hero')).toBeNull();
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
