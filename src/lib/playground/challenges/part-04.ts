/**
 * Part 4 · Text & Pipes — the graded challenge.
 *
 * DESTINATION: src/lib/playground/challenges/part-04.ts
 *
 * Design notes for reviewers:
 *
 *  - Part 4's signature lever is "a pipe instead of an intermediate file"
 *    (spec §4.2). So the goal is deliberately a FIVE-stage transform: filter,
 *    slice a column, group, tally, rank. Done honestly one command at a time it
 *    costs five Enters and four scratch files; done as one pipeline it costs one
 *    Enter. That is the widest that gap gets anywhere in the course, and it is
 *    exactly the lesson 4.2 teaches ("build pipelines one stage at a time" —
 *    then keep them as one line).
 *  - The judgement the challenge actually tests is NOT remembering the four
 *    stages — 4.4 walks the learner through those stage by stage. It is
 *    noticing that the uptime monitor's health pings are not visitors, and
 *    filtering them out. That is why the un-filtered classic pipeline sits in
 *    the pool as a works-but-wrong distractor: it exits 0, it produces a
 *    plausible-looking file, and it answers the wrong question.
 *  - The tallies are chosen so that ranking by count is NOT the same as ranking
 *    by address. Without that, the final `sort -n` would be a no-op and a
 *    learner could skip a stage and still pass.
 *  - The monitor's tally is deliberately NEITHER the smallest nor the largest.
 *    It has to sit in the middle of the ranking, because if it sorted to one
 *    end the whole challenge could be beaten positionally — rank everything
 *    including the robot, then `head -n 4` the robot off the end. That answers
 *    the question by luck of position rather than by filtering, which is the
 *    one skill this challenge exists to test. With the monitor in the middle
 *    the four correct rows are non-contiguous, so no `head`/`tail` slice can
 *    produce them and the only route is an actual filter.
 *  - A rotated log sits beside the live one, so every careless glob and every
 *    careless filename has somewhere wrong to land.
 */

import type { Challenge } from '../challenges';

/**
 * One line per request: address, method, path, status. The shape Part 4.4 uses
 * when it teaches `cut -d' ' -f1`.
 *
 * Tallies (deliberate): 192.0.2.55 8, 10.0.0.7 the monitor 6, 203.0.113.77 3,
 * 203.0.113.9 2, 198.51.100.4 1.
 *
 * Two properties are load-bearing and must survive any edit to this array:
 *
 *  1. Alphabetical order by address is 192.0.2.55, 198.51.100.4, 203.0.113.77,
 *     203.0.113.9 — a different order from 1, 2, 3, 8. That is what stops the
 *     closing `sort -n` from being a no-op a learner could skip.
 *  2. The monitor's 6 sits between 3 and 8, so in a ranking of ALL five
 *     addresses the robot lands fourth of five and the four correct rows are
 *     positions 1, 2, 3 and 5. They are non-contiguous, so no `head -n N` or
 *     `tail -n N` slice of the unfiltered ranking can produce the answer.
 *     If the monitor were the busiest, `... | sort -n | head -n 4` would score
 *     GREAT without ever filtering anything.
 */
const VISITS_LOG = [
	'10.0.0.7 GET /health 200',
	'192.0.2.55 GET / 200',
	'10.0.0.7 GET /health 200',
	'203.0.113.77 GET /pricing 200',
	'198.51.100.4 GET / 200',
	'192.0.2.55 GET /pricing 200',
	'10.0.0.7 GET /health 200',
	'203.0.113.9 GET /blog 200',
	'192.0.2.55 GET /docs 200',
	'203.0.113.77 GET /signup 200',
	'10.0.0.7 GET /health 200',
	'192.0.2.55 GET /about 200',
	'203.0.113.9 POST /signup 302',
	'192.0.2.55 GET /docs/cli 200',
	'10.0.0.7 GET /health 200',
	'203.0.113.77 GET /docs 404',
	'192.0.2.55 POST /signup 302',
	'192.0.2.55 GET /docs/install 200',
	'10.0.0.7 GET /health 200',
	'192.0.2.55 GET /pricing 200',
	''
].join('\n');

/** Yesterday's rotated log — a different, smaller crowd. Aiming here is visibly wrong. */
const VISITS_LOG_1 = [
	'10.0.0.7 GET /health 200',
	'198.51.100.4 GET /blog 200',
	'10.0.0.7 GET /health 200',
	'203.0.113.9 GET / 200',
	'198.51.100.4 GET /blog 200',
	'10.0.0.7 GET /health 200',
	''
].join('\n');

/** What `uniq -c | sort -n` must produce, whitespace-normalised. */
const RANKED = ['1 198.51.100.4', '2 203.0.113.9', '3 203.0.113.77', '8 192.0.2.55'];

export const challengePart4: Challenge = {
	id: 'ch-4-top-visitors',
	partId: 'part-4',
	part: 4,
	title: 'Who is actually visiting?',

	description:
		"Your landing page has been up a week and visits.log has the whole story. Produce top-visitors.txt in ~/analytics: one line per visiting address, each showing how many requests that address made and then the address itself, ranked so the busiest one is last. One catch — 10.0.0.7 is your own uptime monitor pinging /health on a schedule, and a robot is not a visitor, so it must not appear at all. It is not the busiest thing in the log and it is not the quietest, so you will have to actually take it out rather than trim an end off the list. Only the live log counts; visits.log.1 is last week's, and visits.log itself must survive untouched.",

	goal: 'top-visitors.txt ranks the four real visitors by request count, monitor excluded',

	seed: {
		cwd: '~/analytics',
		files: {
			'~/analytics/visits.log': VISITS_LOG,
			'~/analytics/visits.log.1': VISITS_LOG_1
		}
	},

	/**
	 * Sixteen entries for a job that needs one line. Every stage of the honest
	 * five-line path is clickable, so a beginner can finish without composing
	 * anything; the one-line route has to be assembled by hand. That gap is the
	 * beginner/expert split.
	 */
	pool: [
		{ command: 'head -n 4 visits.log', role: 'solution' },
		{ command: "cut -d' ' -f1 visits.log", role: 'solution' },
		{
			command: "cut -d' ' -f1 visits.log | uniq -c",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-4',
			trap: 'uniq only collapses duplicates that are NEXT TO EACH OTHER, and your addresses are scattered through the log in visit order. It counted runs of one, so 10.0.0.7 shows up six separate times. sort has to herd them together first.'
		},
		{ command: 'grep -v 10.0.0.7 visits.log > real.txt', role: 'solution' },
		{
			command: 'grep 10.0.0.7 visits.log > real.txt',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-3',
			trap: 'Without -v you kept exactly the lines you meant to throw away: real.txt is now six health pings and no humans. -v inverts the match, and this is the flag people forget under pressure.'
		},
		{ command: "cut -d' ' -f1 real.txt > ips.txt", role: 'solution' },
		{
			command: "cut -d' ' -f1 visits.log | sort | uniq -c | sort -n > top-visitors.txt",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-4-3',
			trap: 'The famous pipeline, run without reading the raw material first. It exits 0 and the file looks perfect — five tidy rows — and the fourth of them is 10.0.0.7, your own monitor, counted as one of your top visitors. Nothing is broken; the answer is just wrong.'
		},
		{
			command: "cut -d' ' -f1 visits.log | sort | uniq -c | sort -n | head -n 4 > top-visitors.txt",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-3',
			trap: 'Ranking everything and then slicing four rows off the end is not the same as removing the robot. The monitor is mid-pack, not top or bottom, so head kept it and threw away your busiest real visitor instead. Trimming a position is a guess about where the row landed; grep -v is a statement about which rows belong.'
		},
		{ command: 'sort ips.txt > sorted.txt', role: 'solution' },
		{
			command:
				"cut -d' ' -f1 visits.log* | grep -v 10.0.0.7 | sort | uniq -c | sort -n > top-visitors.txt",
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: "visits.log* matches visits.log AND visits.log.1, so cut read both and glued them together. The addresses are right and every count is inflated by last week's traffic — the hardest kind of wrong to spot."
		},
		{ command: 'uniq -c sorted.txt > counts.txt', role: 'solution' },
		{
			command:
				"cut -d' ' -f1 visits.log.1 | grep -v 10.0.0.7 | sort | uniq -c | sort -n > top-visitors.txt",
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-4-3',
			trap: "Right pipeline, wrong file: visits.log.1 is last week's rotated log. You just ranked two visitors who are not the ones you were asked about."
		},
		{ command: 'sort -n counts.txt > top-visitors.txt', role: 'solution' },
		{
			command:
				"cut -d' ' -f1 visits.log | grep -v 10.0.0.7 | sort | unqi -c | sort -n > top-visitors.txt",
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'unqi is not a command, so the pipeline dies in the middle — but > had already emptied top-visitors.txt before any of it ran, because redirection is set up first and the command runs second. A typo cost you the file you were building.'
		},
		{
			command: "awk '{print $1}' visits.log | sort | uniq -c | sort -n > top-visitors.txt",
			role: 'distractor',
			kind: 'forward-reference',
			teaches: 'section-7-4',
			trap: "It runs — awk really does pull column one, and it is a fine tool. But awk is Part 7, and reaching past what you know did not save you from the actual mistake: no filter, so the monitor is still sitting in your results. A fancier way to do the step you already had right does not fix the step you got wrong, and cut -d' ' -f1 is the right size for this job today."
		},
		{
			command: 'rm visits.log.1',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-3-3',
			trap: "Tidying up was not the assignment. rm has no trash can, and last week's log was the only thing you could have compared this week against."
		}
	],

	/**
	 * Strict about the thing Part 4 teaches — the right rows, the right tallies,
	 * in count order, with the robot gone — and tolerant of the one cosmetic
	 * difference the sandbox forces: `uniq -c` pads its counts to width 7, so
	 * every line is compared with its whitespace collapsed rather than exactly.
	 * The source log must also have survived; several plausible wrong moves
	 * redirect on top of it.
	 */
	check: async (engine) => {
		const report = engine.readFile('~/analytics/top-visitors.txt');
		if (!report) return false;

		const lines = report
			.split('\n')
			.map((l) => l.trim().replace(/\s+/g, ' '))
			.filter((l) => l !== '');
		if (lines.length !== RANKED.length) return false;
		for (let i = 0; i < RANKED.length; i++) {
			if (lines[i] !== RANKED[i]) return false;
		}

		return engine.readFile('~/analytics/visits.log') === VISITS_LOG;
	},

	scoring: {
		great: {
			lines: [
				"grep -v 10.0.0.7 visits.log | cut -d' ' -f1 | sort | uniq -c | sort -n > top-visitors.txt"
			],
			note: 'Five stages, one Enter, no scratch files: drop the robot, keep column one, group, tally, rank. The whole of 4.2 and 4.4 in a single line.',
			expect: { enters: 1, elements: 5, cost: 6 }
		},
		greatAlternates: [
			{
				lines: [
					"cut -d' ' -f1 visits.log | grep -v 10.0.0.7 | sort | uniq -c | sort -n > top-visitors.txt"
				],
				note: 'The same five stages with the filter moved after the slice — grep -v works just as well on a column of bare addresses. Genuinely equal, not second-best.',
				expect: { enters: 1, elements: 5, cost: 6 }
			},
			{
				lines: [
					"cat visits.log | grep -v 10.0.0.7 | cut -d' ' -f1 | sort | uniq -c | sort -n > top-visitors.txt"
				],
				note: 'The useless-cat route. One element more than feeding grep the filename directly, which is the honest price of the habit — not a reason to fail it.',
				expect: { enters: 1, elements: 6, cost: 7 }
			}
		],
		acceptable: {
			lines: [
				'grep -v 10.0.0.7 visits.log > real.txt',
				"cut -d' ' -f1 real.txt > ips.txt",
				'sort ips.txt > sorted.txt',
				'uniq -c sorted.txt > counts.txt',
				'sort -n counts.txt > top-visitors.txt'
			],
			note: 'One stage per line, each parked in its own scratch file. Every step is correct and nothing here is bad practice for a beginner — it is just paying five Enters and four files for what a pipe does in one.',
			expect: { enters: 5, elements: 5, cost: 10 }
		}
	}
};
