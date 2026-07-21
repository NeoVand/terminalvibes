/**
 * Challenges — the graded, unhinted counterpart to a PlaygroundScenario.
 *
 * A scenario teaches: it shows a hint and a pool of commands that, clicked in
 * order, walk you to the answer. A challenge tests: no hint, an overcomplete
 * and deliberately salted pool, and a score. One challenge per Part.
 *
 * DESTINATION: src/lib/playground/challenges.ts
 * This file is the shared machinery. The fourteen per-part challenges live in
 * src/lib/playground/challenges/part-NN.ts and are re-exported from here.
 */

import type { FsSeed, ShellEngine } from './shell-engine';
import { commandWordOf, splitSegments } from './challenge-parsing';

export { commandWordOf, splitSegments };
import type { PlaygroundScenario } from './scenarios';

/* ── the pool ──────────────────────────────────────────────────────── */

/**
 * Why a distractor is wrong. The taxonomy is closed on purpose: fourteen
 * authors picking from the same seven kinds is what makes fourteen challenges
 * feel like one system. See the spec for a worked example of each.
 */
export type DistractorKind =
	| 'typo' //  grpe, -fr, catt — the shell's answer is "command not found"
	| 'misconception' //  > where >> is meant; a real belief a beginner holds
	| 'wrong-target' //  right command, aimed at the rotated log / the parent dir
	| 'works-but-wrong' //  exits 0, produces the wrong artifact — the nastiest kind
	| 'destructive' //  succeeds and costs you work you have to redo
	| 'overreach' //  a glob or -r that catches more than intended
	| 'forward-reference'; //  a tool from a later Part: it may even work, but it is not yours yet

export interface PoolEntry {
	/** Exactly as it appears on the chip, and exactly as it runs. */
	command: string;
	role: 'solution' | 'distractor';
	/** Required when role === 'distractor'. */
	kind?: DistractorKind;
	/**
	 * Required when role === 'distractor'. One sentence, second person, shown
	 * as a post-mortem after a failed or expensive attempt. It must name what
	 * the command actually did — not just that it was wrong.
	 */
	trap?: string;
	/**
	 * Required when role === 'distractor'. The section id whose prose warns
	 * about this exact mistake, e.g. 'section-4-1'. A distractor the course
	 * never warns about is noise, not instruction — drop it.
	 */
	teaches?: string;
}

/* ── solutions ─────────────────────────────────────────────────────── */

export interface SolutionPath {
	/** One string per Enter press, in order. Runnable verbatim in the sandbox. */
	lines: string[];
	/** One sentence naming the move that makes this path what it is. */
	note: string;
	/**
	 * Author-asserted counts, cross-checked by the shared test against
	 * scoreHistory(). They are redundant on purpose: a mismatch means the
	 * author's mental model of the scoring diverged, and that is exactly the
	 * drift this spec exists to prevent.
	 */
	expect: { enters: number; elements: number; cost: number };
}

export interface ChallengeScoring {
	/** The economical path. Uses the Part's signature lever. */
	great: SolutionPath;
	/**
	 * Other paths the author judges equally economical — a pipe where the
	 * canonical route used a flag, say. greatCost is the MAX cost across
	 * `great` and every alternate, so no equally-good route is punished.
	 * Enumerating these is mandatory thinking, not optional polish: if you
	 * cannot name a second good route, the challenge is probably too narrow.
	 */
	greatAlternates?: SolutionPath[];
	/** The beginner's honest path: one command per line, no cleverness. */
	acceptable: SolutionPath;
}

/* ── the challenge ─────────────────────────────────────────────────── */

export interface Challenge {
	/** Stable id, kebab-case, prefixed by part: 'ch-4-triage'. */
	id: string;
	/** The anchor id of the owning Part: 'part-4'. */
	partId: `part-${number}`;
	/** 1..14, matching partId. Used for the forward-reference audit. */
	part: number;
	title: string;
	/**
	 * The brief. Replaces the hint — this is ALL the learner gets. State the
	 * situation and the goal state precisely enough that success is
	 * unambiguous, and say nothing about which commands to use.
	 */
	description: string;
	/** One line naming the goal state, shown when the check passes. */
	goal: string;
	/**
	 * Overcomplete and salted. Authored order is the display order — do not
	 * randomize, or screenshots and tests stop being reproducible. Interleave
	 * distractors among solution entries; never group them at the end.
	 */
	pool: PoolEntry[];
	seed: FsSeed;
	/** Mandatory here (it is optional on PlaygroundScenario). */
	check: (engine: ShellEngine) => Promise<boolean>;
	scoring: ChallengeScoring;
	/**
	 * Commands from FREE_COMMANDS that this challenge counts anyway, because
	 * they ARE its signature skill. A Part 2 navigation challenge sets
	 * ['cd', 'ls']; a Part 10 disk challenge sets ['du']. Keep it minimal.
	 */
	notFree?: string[];
}

/* ── the free list ─────────────────────────────────────────────────── */

/**
 * Recon is free.
 *
 * The course says it in Part 3 and never stops saying it: look before you
 * touch, `echo *.tmp` is a free preview of what `rm *.tmp` would delete,
 * measure with `du` before you `rm -r`. A score that charged for looking
 * would teach the opposite of the course. So a line that only inspects costs
 * nothing, and economy is measured purely in the commands that CHANGE things.
 *
 * A line is free only if BOTH hold:
 *   1. it contains no unquoted redirection operator (> >> < 2> 2>&1), and
 *   2. every segment's command word is in the effective free set.
 * Redirection is the tell: `echo 'x' >> script.sh` is authoring a file, not
 * looking at one, and the rule catches that without special-casing.
 *
 * Anything not on this list counts — including aliases and unknown words.
 * Counting the unknown is the safe direction.
 */
export const FREE_COMMANDS: ReadonlySet<string> = new Set([
	'cat',
	'cd',
	'clear',
	'date',
	'df',
	'du',
	'echo',
	'file',
	'head',
	'help',
	'history',
	'id',
	'jobs',
	'less',
	'ls',
	'lsof',
	'man',
	'more',
	'ps',
	'pwd',
	'stat',
	'tail',
	'type',
	'which',
	'whoami'
]);

export function effectiveFreeSet(challenge: Challenge): ReadonlySet<string> {
	if (!challenge.notFree?.length) return FREE_COMMANDS;
	const set = new Set(FREE_COMMANDS);
	for (const name of challenge.notFree) set.delete(name);
	return set;
}

/* ── parsing ───────────────────────────────────────────────────────── */

/** Does the line redirect, outside quotes? `>` `>>` `<` `2>` `2>&1` all count. */
export function hasRedirection(line: string): boolean {
	let quote: '' | "'" | '"' = '';
	for (let i = 0; i < line.length; i++) {
		const ch = line[i];
		if (quote) {
			if (ch === quote) quote = '';
			continue;
		}
		if (ch === "'" || ch === '"') {
			quote = ch;
			continue;
		}
		if (ch === '#' && (i === 0 || /\s/.test(line[i - 1]))) return false;
		if (ch === '>' || ch === '<') return true;
	}
	return false;
}

/* ── scoring ───────────────────────────────────────────────────────── */

export interface AttemptScore {
	/** Counted Enter presses — history lines that were not free. */
	enters: number;
	/** Counted elements — simple commands inside those lines. */
	elements: number;
	/** enters + elements. Lower is better. */
	cost: number;
}

export type ChallengeGrade = 'great' | 'acceptable' | 'failure';

/**
 * Score a history log. This is the ONLY measurement; `engine.historyLog` is
 * the only durable record of an attempt (shell-commands.ts pushes exactly one
 * trimmed entry per non-empty Enter, before running it, including failures).
 * Clicking a pool chip merely fills the input box — it is not observable — so
 * "pool elements used" is measured as simple commands in the history, which is
 * the same number for anyone who clicks their way through.
 */
export function scoreHistory(
	history: readonly string[],
	free: ReadonlySet<string> = FREE_COMMANDS
): AttemptScore {
	let enters = 0;
	let elements = 0;
	for (const raw of history) {
		const line = raw.trim();
		if (!line || line.startsWith('#')) continue;
		const segments = splitSegments(line);
		if (!segments.length) continue;
		const isFree = !hasRedirection(line) && segments.every((s) => free.has(commandWordOf(s)));
		if (isFree) continue;
		enters += 1;
		elements += segments.length;
	}
	return { enters, elements, cost: enters + elements };
}

/** The cost a learner must meet or beat to score GREAT. Derived, never typed. */
export function greatCostOf(challenge: Challenge): number {
	const free = effectiveFreeSet(challenge);
	const paths = [challenge.scoring.great, ...(challenge.scoring.greatAlternates ?? [])];
	return Math.max(...paths.map((p) => scoreHistory(p.lines, free).cost));
}

/**
 * The verdict. Call it the FIRST time `check()` returns true and freeze the
 * result — a learner who keeps poking around after succeeding must not be
 * demoted for it. Until check() has ever passed, the grade is 'failure'.
 */
export function gradeAttempt(
	challenge: Challenge,
	history: readonly string[],
	goalReached: boolean
): ChallengeGrade {
	if (!goalReached) return 'failure';
	const cost = scoreHistory(history, effectiveFreeSet(challenge)).cost;
	return cost <= greatCostOf(challenge) ? 'great' : 'acceptable';
}

/* ── adapter ───────────────────────────────────────────────────────── */

/**
 * Render a Challenge through the existing playground UI with zero changes to
 * it: the chips come from the pool, and `hint` — which the UI renders above
 * the terminal — carries the challenge description instead of a hint. That
 * substitution is the whole "no lightbulb" rule, enforced in one place.
 */
export function toScenario(challenge: Challenge): PlaygroundScenario {
	return {
		id: challenge.id,
		title: challenge.title,
		description: challenge.description,
		hint: challenge.description,
		suggestedCommands: challenge.pool.map((entry) => entry.command),
		seed: challenge.seed,
		goal: challenge.goal,
		check: challenge.check
	};
}

/* ── the fourteen ──────────────────────────────────────────────────── */

import { challengePart1 } from './challenges/part-01';
import { challengePart2 } from './challenges/part-02';
import { challengePart3 } from './challenges/part-03';
import { challengePart4 } from './challenges/part-04';
import { challengePart5 } from './challenges/part-05';
import { challengePart6 } from './challenges/part-06';
import { challengePart7 } from './challenges/part-07';
import { challengePart8 } from './challenges/part-08';
import { challengePart9 } from './challenges/part-09';
import { challengePart10 } from './challenges/part-10';
import { challengePart11 } from './challenges/part-11';
import { challengePart12 } from './challenges/part-12';
import { challengePart13 } from './challenges/part-13';
import { challengePart14 } from './challenges/part-14';

/**
 * One challenge per Part, in course order. The rail's challenge lane and the
 * sidebar both read this, so the order here IS the order they render in.
 */
export const allChallenges: readonly Challenge[] = [
	challengePart1,
	challengePart2,
	challengePart3,
	challengePart4,
	challengePart5,
	challengePart6,
	challengePart7,
	challengePart8,
	challengePart9,
	challengePart10,
	challengePart11,
	challengePart12,
	challengePart13,
	challengePart14
];

/** Anchor ids, for cross-checking against sections.ts and the timeline manifest. */
export const challengeIds: readonly string[] = allChallenges.map((c) => c.id);

/** The challenge belonging to a Part number (1..14), or undefined. */
export function challengeForPart(part: number): Challenge | undefined {
	return allChallenges.find((c) => c.part === part);
}
