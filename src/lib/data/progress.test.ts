/**
 * The state-semantics contract for activity marks.
 *
 * The bug this pins down: the scroll-spy in +page.svelte calls
 * markSectionVisited() for whatever anchor it picks, and once it was fixed to
 * sort anchors into true document order it began picking PLAYGROUND anchors for
 * the first time. Every playground the reader scrolled over was recorded as
 * "read", and the rail and sidebar — which keyed activity marks off read state —
 * lit it up as though the exercise had been done.
 *
 * So the invariant is not "attempts get recorded"; it is that reading and doing
 * are separate records, and no amount of scrolling can move an activity off
 * 'untouched'. These tests assert both directions.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { get } from 'svelte/store';
import {
	progress,
	resetProgress,
	markSectionVisited,
	markScenarioAttempted,
	markScenarioComplete,
	activityStateOf,
	migrateSections,
	type ProgressState
} from './progress';
import { playgroundIds, readableIds, summarizeParts } from '$lib/timeline/summary';

const PG = playgroundIds[0];
const OTHER_PG = playgroundIds[1];

beforeEach(() => resetProgress());

const state = (): ProgressState => get(progress);

describe('scrolling is not doing', () => {
	it('leaves a playground untouched when the scroll-spy visits its anchor', () => {
		markSectionVisited(PG);
		expect(activityStateOf(state(), PG)).toBe('untouched');
	});

	it('never adds a scroll-visited playground to the completed count', () => {
		// Simulate a reader scrolling the whole course without doing anything.
		for (const id of [...readableIds, ...playgroundIds]) markSectionVisited(id);

		const done = new Set(Object.keys(state().scenarios));
		expect(done.size).toBe(0);

		const read = new Set(Object.keys(state().sections).filter((id) => !playgroundIds.includes(id)));
		const parts = summarizeParts(read, done);
		expect(parts.reduce((a, p) => a + p.playgroundsDone, 0)).toBe(0);
		// …while prose still counts as read, which is the half that must NOT change.
		expect(parts.reduce((a, p) => a + p.sectionsRead, 0)).toBe(readableIds.length);
	});

	it('does not let a scroll visit undo or downgrade real progress', () => {
		markScenarioComplete(PG);
		markSectionVisited(PG);
		expect(activityStateOf(state(), PG)).toBe('completed');
	});
});

describe('the three activity states', () => {
	it('walks untouched → attempted → completed', () => {
		expect(activityStateOf(state(), PG)).toBe('untouched');
		markScenarioAttempted(PG);
		expect(activityStateOf(state(), PG)).toBe('attempted');
		markScenarioComplete(PG);
		expect(activityStateOf(state(), PG)).toBe('completed');
	});

	it('keeps an attempt to the scenario it happened in', () => {
		markScenarioAttempted(PG);
		expect(activityStateOf(state(), OTHER_PG)).toBe('untouched');
	});

	it('records first touch only, so repeat commands do not rewrite the stamp', () => {
		markScenarioAttempted(PG);
		const first = state().attempts[PG];
		markScenarioAttempted(PG);
		expect(state().attempts[PG]).toBe(first);
	});

	it('holds completed ⊆ attempted even when completion comes first', () => {
		// The agent path can satisfy a goal without markScenarioAttempted having
		// run first; the mark must still not read as merely "started".
		markScenarioComplete(OTHER_PG);
		expect(state().attempts[OTHER_PG]).toBeTruthy();
		expect(activityStateOf(state(), OTHER_PG)).toBe('completed');
	});

	it('wipes attempts on reset, like every other recording', () => {
		markScenarioAttempted(PG);
		resetProgress();
		expect(state().attempts).toEqual({});
		expect(activityStateOf(state(), PG)).toBe('untouched');
	});
});

describe('storage shape', () => {
	it('leaves scenario ids alone across the section migration chain', () => {
		// Attempts are keyed by stable scenario names, so they are deliberately
		// outside migrateSections. This guards the assumption that a scenario id
		// is not also a positional section id that a migration would rewrite.
		const asSections = Object.fromEntries(playgroundIds.map((id) => [id, 'ts']));
		expect(Object.keys(migrateSections(asSections, 0)).sort()).toEqual([...playgroundIds].sort());
	});
});
