import { describe, expect, it } from 'vitest';
import {
	allChallenges,
	challengeForPart,
	challengeIds,
	effectiveFreeSet,
	gradeAttempt,
	greatCostOf,
	scoreHistory,
	toScenario
} from './challenges';
import { challengeAnchorIds } from '../data/sections';

/**
 * The challenges reach the page through three hand-maintained lists that have
 * to say the same thing: `allChallenges` here, `challengeAnchorIds` in
 * sections.ts (which is what the timeline manifest is generated from), and the
 * `<ChallengeActivity>` tags in the Part components. The third is checked by
 * build-timeline.mjs, which refuses to write a manifest missing any declared
 * challenge. This file checks the first two against each other.
 */
describe('the fourteen', () => {
	it('is one per Part, in course order', () => {
		expect(allChallenges).toHaveLength(14);
		expect(allChallenges.map((c) => c.part)).toEqual(Array.from({ length: 14 }, (_, i) => i + 1));
		for (const c of allChallenges) {
			expect(c.partId).toBe(`part-${c.part}`);
			expect(challengeForPart(c.part)).toBe(c);
		}
	});

	it('agrees with the anchor list in sections.ts, order included', () => {
		// Order matters as well as membership: `anchorIds` feeds the deep-link
		// router and the manifest, and a challenge listed under the wrong Part
		// would deep-link into the wrong chapter.
		expect([...challengeAnchorIds]).toEqual([...challengeIds]);
	});

	it('uses ids the sidebar can classify without importing this module', () => {
		// sidebar-nav's `activityKindOf` recognises a challenge by its id shape
		// alone, precisely so the nav bundle does not pull in fourteen sandbox
		// seeds. That shortcut is only safe while every id matches.
		for (const c of allChallenges) expect(c.id).toMatch(/^ch-\d+-[a-z0-9-]+$/);
	});
});

describe('scoring', () => {
	it('matches every author-asserted cost', () => {
		// The redundancy is the point: `expect` is what the author believed the
		// path costs, and scoreHistory is what it actually costs. A mismatch means
		// the author's model of the scoring has drifted from the scoring.
		for (const c of allChallenges) {
			const free = effectiveFreeSet(c);
			const paths = [c.scoring.great, ...(c.scoring.greatAlternates ?? []), c.scoring.acceptable];
			for (const path of paths) {
				expect(scoreHistory(path.lines, free), `${c.id}: ${path.lines.join(' ; ')}`).toEqual(
					path.expect
				);
			}
		}
	});

	it('grades the canonical paths the way they are named', () => {
		for (const c of allChallenges) {
			expect(gradeAttempt(c, c.scoring.great.lines, true), c.id).toBe('great');
			for (const alt of c.scoring.greatAlternates ?? []) {
				// greatCost is the MAX across great and its alternates, so no
				// equally-good route may be graded down.
				expect(gradeAttempt(c, alt.lines, true), `${c.id} alternate`).toBe('great');
			}
			// An unsolved attempt is a failure however cheap it was.
			expect(gradeAttempt(c, c.scoring.great.lines, false), c.id).toBe('failure');
		}
	});

	it('leaves the beginner a gap to close', () => {
		// If the honest one-command-at-a-time path already scored 'great', the
		// challenge would not be teaching an economy at all.
		for (const c of allChallenges) {
			expect(
				scoreHistory(c.scoring.acceptable.lines, effectiveFreeSet(c)).cost,
				`${c.id} acceptable`
			).toBeGreaterThan(greatCostOf(c));
			expect(gradeAttempt(c, c.scoring.acceptable.lines, true), c.id).toBe('acceptable');
		}
	});
});

describe('the adapter', () => {
	it('puts the brief where the UI expects a hint, and offers no second hint', () => {
		// The whole "no lightbulb" rule, enforced in one place: the card has one
		// prose slot and the brief is what goes in it.
		for (const c of allChallenges) {
			const s = toScenario(c);
			expect(s.id).toBe(c.id);
			expect(s.hint).toBe(c.description);
			expect(s.suggestedCommands).toEqual(c.pool.map((e) => e.command));
			expect(s.check).toBe(c.check);
		}
	});

	it('ships a pool that is overcomplete and salted', () => {
		for (const c of allChallenges) {
			const distractors = c.pool.filter((e) => e.role === 'distractor');
			expect(distractors.length, `${c.id} has no distractors`).toBeGreaterThan(0);
			for (const d of distractors) {
				// A distractor with no post-mortem, no taxonomy entry and no section
				// that warns about it is noise, not instruction.
				expect(d.kind, `${c.id}: ${d.command}`).toBeTruthy();
				expect(d.trap, `${c.id}: ${d.command}`).toBeTruthy();
				expect(d.teaches, `${c.id}: ${d.command}`).toBeTruthy();
			}
			// Never grouped at the end — a block of wrong answers is a giveaway.
			const lastSolution = c.pool.map((e) => e.role).lastIndexOf('solution');
			expect(lastSolution, `${c.id} groups its distractors`).toBeGreaterThan(0);
		}
	});
});
