/**
 * Which commands does the exercise under the learner's cursor reach for?
 *
 * The cheat sheet's focus filter reads this. The scroll-spy anchor of every
 * inline activity IS its scenario id (LessonActivity passes the same string
 * to both props), and a challenge's anchor IS its challenge id — so one
 * lookup against both registries resolves "where the learner is" into an
 * exercise. Playgrounds contribute their `suggestedCommands` walkthrough;
 * challenges contribute the whole kit, distractors included — the cheat
 * sheet explains what each command does, which is exactly the audit a salted
 * pool invites, and it never reveals which pool entries are the solution.
 */
import type { CheatSheetCommand } from '$lib/data/cheat-sheet';
import { playgroundScenarios } from './scenarios';
import { allChallenges } from './challenges';
import { commandWordOf, splitSegments } from './challenge-parsing';

export interface ExerciseFocus {
	/** Anchor/scenario id ('tidy-up', 'ch-3-after-the-agent'). */
	id: string;
	title: string;
	kind: 'playground' | 'challenge';
	/** Command words the exercise's command lines use ('ls', 'grep', …). */
	words: ReadonlySet<string>;
	references?: ReadonlySet<string>;
}

/**
 * Every command word on one command line: one per pipeline segment, with a
 * `sudo` prefix contributing both itself and the command it wraps.
 */
export function commandWordsOf(line: string): string[] {
	const words: string[] = [];
	for (const segment of splitSegments(line)) {
		let word = commandWordOf(segment);
		if (word === 'sudo') {
			words.push('sudo');
			word = commandWordOf(segment.replace(/^\s*sudo\s+/, ''));
		}
		if (word) words.push(word);
	}
	return words;
}

function toFocus(
	id: string,
	title: string,
	kind: ExerciseFocus['kind'],
	lines: readonly string[]
): ExerciseFocus {
	const words = new Set<string>();
	for (const line of lines) for (const word of commandWordsOf(line)) words.add(word);
	return {
		id,
		title,
		kind,
		words,
		references: REFERENCES[id] ? new Set(REFERENCES[id]) : undefined
	};
}

const REFERENCES: Record<string, string[]> = {
	hero: ['say-hello', 'key-history', 'key-cancel'],
	'hello-first-command': ['say-hello', 'key-history', 'key-cancel'],
	'keyboard-workshop': [
		'key-start',
		'key-end',
		'key-whole-line',
		'key-kill-end',
		'key-word',
		'key-yank',
		'key-history',
		'key-cancel',
		'key-redraw',
		'key-search',
		'key-complete'
	],
	'first-steps': [
		'say-hello',
		'my-user',
		'where-am-i',
		'current-date',
		'clear-screen',
		'key-history',
		'key-cancel'
	],
	'help-lookup': ['command-help', 'file-start'],
	navigation: [
		'where-am-i',
		'list-files',
		'hidden-files',
		'change-folder',
		'parent-folder',
		'home-folder',
		'read-file'
	],
	'workspace-setup': [
		'make-folder',
		'make-parent-folders',
		'make-file',
		'list-files',
		'change-folder'
	],
	'edit-notes': ['read-file', 'edit-file', 'key-cancel']
};

export function referenceMatchesExercise(entry: CheatSheetCommand, focus: ExerciseFocus): boolean {
	if (focus.references) return Boolean(entry.id && focus.references.has(entry.id));
	const words = commandWordsOf(entry.command);
	return words.length > 0 && words.every((word) => focus.words.has(word));
}

/** The exercise an anchor id points at, or null for ordinary sections. */
export function exerciseFocusOf(anchorId: string | null): ExerciseFocus | null {
	if (!anchorId) return null;
	if (['hero', 'hello-first-command', 'keyboard-workshop'].includes(anchorId))
		return toFocus(
			anchorId,
			anchorId === 'keyboard-workshop' ? 'Keyboard workshop' : 'Your first command',
			'playground',
			['echo']
		);
	const challenge = allChallenges.find((c) => c.id === anchorId);
	if (challenge) {
		return toFocus(
			challenge.id,
			challenge.title,
			'challenge',
			challenge.pool.map((entry) => entry.command)
		);
	}
	const scenario = playgroundScenarios.find((s) => s.id === anchorId);
	if (scenario) {
		return toFocus(scenario.id, scenario.title, 'playground', scenario.suggestedCommands);
	}
	return null;
}

/** Does a cheat-sheet row's command column use any of the exercise's words? */
export function rowUsesWords(rowCommand: string, words: ReadonlySet<string>): boolean {
	return commandWordsOf(rowCommand).some((word) => words.has(word));
}
