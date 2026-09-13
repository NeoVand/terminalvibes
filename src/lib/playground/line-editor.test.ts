import { describe, expect, it } from 'vitest';
import {
	actionForKey,
	applyCompletion,
	completionContext,
	editLine,
	longestCommonPrefix,
	navigateHistory,
	type LineState
} from './line-editor';

const line = (value: string, cursor = value.length): LineState => ({
	value,
	start: cursor,
	end: cursor,
	killBuffer: ''
});

describe('Readline editing', () => {
	it('moves without changing the line and kills only the suffix at the cursor', () => {
		const state = line('echo hello garden', 11);
		expect(editLine(state, 'start')).toMatchObject({ value: state.value, start: 0, end: 0 });
		expect(editLine(state, 'end')).toMatchObject({ start: 17, end: 17 });
		const cut = editLine(state, 'killEnd');
		expect(cut).toMatchObject({ value: 'echo hello ', removed: 'garden', killBuffer: 'garden' });
		expect(editLine(cut, 'yank')).toMatchObject({ value: state.value, start: 17 });
	});
	it('distinguishes Bash Ctrl+U from zsh Emacs Ctrl+U', () => {
		expect(editLine(line('echo hello', 5), 'killStart')).toMatchObject({
			value: 'hello',
			start: 0,
			removed: 'echo '
		});
		expect(editLine(line('echo hello', 5), 'killStart', 'zsh')).toMatchObject({
			value: '',
			removed: 'echo hello'
		});
	});
	it('removes a whitespace-delimited word with Ctrl+W, including trailing spaces', () => {
		expect(editLine(line('cat notes/day-one.txt   '), 'killWord')).toMatchObject({
			value: 'cat ',
			killBuffer: 'notes/day-one.txt   '
		});
	});
	it('accumulates consecutive backwards kills in their original order', () => {
		const first = editLine(line('echo red blue'), 'killWord');
		const second = editLine(first, 'killWord');
		expect(second).toMatchObject({ value: 'echo ', killBuffer: 'red blue' });
		expect(editLine(second, 'yank').value).toBe('echo red blue');
	});
	it('uses word boundaries for Alt gestures and preserves Unicode characters', () => {
		expect(editLine(line('cat notes/day-one.txt'), 'wordBackward').start).toBe(18);
		expect(editLine(line('echo hello world', 5), 'killNextWord').value).toBe('echo  world');
		expect(editLine(line('echo 🦀garden'), 'wordBackward').start).toBe(7);
	});
	it('cancels a draft without adding it to the kill buffer; clear preserves the draft', () => {
		const original = { ...line('unfinished'), killBuffer: 'saved' };
		expect(editLine(original, 'cancel')).toMatchObject({
			value: '',
			cancelled: true,
			killBuffer: 'saved'
		});
		expect(editLine(original, 'clearScreen')).toMatchObject({ value: 'unfinished', cleared: true });
	});
	it('leaves system and text-composition shortcuts alone', () => {
		const key = {
			key: 'k',
			ctrlKey: true,
			altKey: false,
			metaKey: false,
			shiftKey: false,
			isComposing: false
		};
		expect(actionForKey(key)).toBe('killEnd');
		expect(actionForKey({ ...key, metaKey: true })).toBeNull();
		expect(actionForKey({ ...key, isComposing: true })).toBeNull();
	});
});

describe('command history', () => {
	it('restores an unfinished draft after browsing history', () => {
		const history = ['pwd', 'echo hello'];
		let position = navigateHistory(history, { index: -1, draft: '' }, 'echo unfinished', 'older');
		expect(position.value).toBe('echo hello');
		position = navigateHistory(history, position, position.value, 'older');
		expect(position.value).toBe('pwd');
		position = navigateHistory(history, position, position.value, 'newer');
		position = navigateHistory(history, position, position.value, 'newer');
		expect(position).toEqual({ value: 'echo unfinished', index: -1, draft: 'echo unfinished' });
	});
	it('does not erase a draft when Down is pressed outside history', () => {
		expect(navigateHistory(['pwd'], { index: -1, draft: '' }, 'my draft', 'newer').value).toBe(
			'my draft'
		);
	});
});

describe('cursor-aware shell completion', () => {
	it('completes the word under the cursor without replacing later arguments', () => {
		const value = 'cat rea notes.txt';
		const context = completionContext(value, 7);
		expect(context).toMatchObject({ start: 4, end: 7, prefix: 'rea', isCommand: false });
		expect(applyCompletion(value, context, 'readme.md', true).value).toBe(
			'cat readme.md notes.txt'
		);
	});
	it('completes inside a word and inside quoted filenames', () => {
		const value = 'cat "garden no" later.txt';
		const context = completionContext(value, 14);
		expect(context.prefix).toBe('garden no');
		expect(applyCompletion(value, context, 'garden notes.txt', true).value).toBe(
			'cat "garden notes.txt" later.txt'
		);
		expect(
			applyCompletion('ecXX hello', completionContext('ecXX hello', 2), 'echo', true).value
		).toBe('echo hello');
	});
	it('escapes spaces and metacharacters instead of making extra arguments', () => {
		const value = 'cat garden\\ n';
		const context = completionContext(value, value.length);
		expect(context.prefix).toBe('garden n');
		expect(applyCompletion(value, context, 'garden notes $1.txt', true).value).toBe(
			'cat garden\\ notes\\ \\$1.txt '
		);
	});
	it('keeps an unfinished directory quote open and closes a finished file', () => {
		expect(
			applyCompletion('cd "gar', completionContext('cd "gar', 7), 'garden notes/', true).value
		).toBe('cd "garden notes/');
		expect(
			applyCompletion("cat 'gar", completionContext("cat 'gar", 8), "garden's notes.txt", true)
				.value
		).toBe("cat 'garden'\\''s notes.txt' ");
	});
	it('offers files after an empty argument and commands after a pipe', () => {
		expect(completionContext('cat ', 4)).toMatchObject({ prefix: '', isCommand: false });
		expect(completionContext('echo hi | gr', 12)).toMatchObject({ prefix: 'gr', isCommand: true });
	});
	it('extends only a shared prefix when more than one candidate exists', () => {
		expect(longestCommonPrefix(['garden-one', 'garden-two'])).toBe('garden-');
	});
});
