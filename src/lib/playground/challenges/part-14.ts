/**
 * Part 14 · Conclusion — the capstone challenge.
 *
 * DESTINATION: src/lib/playground/challenges/part-14.ts
 *
 * Part 14 introduces no new commands, so its signature lever is judgement:
 * every lever from Parts 1–13 is on the table at once, and the whole skill is
 * seeing that four unrelated chores collapse into two Enters.
 *
 * The design:
 *  - FOUR independent chores (archive, purge, extract, lock down) that a
 *    beginner will naturally do as eight lines and a competent person will do
 *    as two. Nothing here is hard on its own — the difficulty is entirely in
 *    noticing that a glob replaces three named files and that `&&` replaces a
 *    line break.
 *  - The minimum number of *elements* is fixed at five (mkdir, mv, rm, grep,
 *    chmod), so the only thing a learner can economise is Enters. That makes
 *    the score legible: GREAT is "you stopped pressing Enter between things
 *    that belong together".
 *  - A rotated log, a presentation deck that must survive, and a world-readable
 *    .env give every careless glob, every wrong target and every "just make it
 *    work" chmod somewhere real to land.
 *  - No `forward-reference` distractor exists at Part 14 — there is no later
 *    Part to borrow from. The kinds available are the other six.
 */

import type { Challenge } from '../challenges';

const BUILD_LOG = [
	'09:41:02 INFO  build: started (commit 4f21a9c)',
	'09:41:03 INFO  deps: 412 packages resolved',
	'09:41:58 WARN  bundler: chunk "vendor" is 1.8 MB',
	'09:42:11 ERROR typecheck: src/lib/cart.ts(88,3) Type "string" is not assignable',
	'09:42:11 INFO  build: continuing after non-fatal step',
	'09:42:40 ERROR test: checkout.spec.ts "applies discount" failed',
	'09:43:02 WARN  bundler: sourcemaps disabled in production',
	'09:43:19 ERROR deploy: refused, 2 checks did not pass',
	'09:43:20 INFO  build: exit 1',
	''
].join('\n');

/** Last week's rotated build. Four ERRORs — so aiming wrong is visibly wrong. */
const BUILD_LOG_1 = [
	'23:10:00 INFO  build: started (commit 0be7714)',
	'23:10:44 ERROR deps: registry timeout',
	'23:11:02 ERROR deps: registry timeout',
	'23:11:30 ERROR deps: gave up after 3 retries',
	'23:11:31 ERROR build: exit 1',
	''
].join('\n');

const ERROR_LINES = [
	'09:42:11 ERROR typecheck: src/lib/cart.ts(88,3) Type "string" is not assignable',
	'09:42:40 ERROR test: checkout.spec.ts "applies discount" failed',
	'09:43:19 ERROR deploy: refused, 2 checks did not pass'
];

const ENV_FILE = 'API_KEY=sk-vibe-9c2f10ab\nSTRIPE_KEY=sk_live_7d31\n';

export const challengePart14: Challenge = {
	id: 'ch-14-desk-clear',
	partId: 'part-14',
	part: 14,
	title: 'Clear the desk before the demo',

	description:
		"Six months of drift, and the demo starts in ten minutes. Four things are wrong with your home folder. The three invoice PDFs in ~/downloads belong in ~/archive/invoices, which does not exist yet. The two browser cache scratch files in ~/downloads belong nowhere — but the presentation deck sitting beside them stays exactly where it is. Every ERROR line from ~/logs/build.log, in order and nothing else, has to end up in ~/archive/errors.txt; the rotated ~/logs/build.log.1 is last week's problem, and neither log may be moved, edited or deleted. And ~/.env is still readable by every account on this machine — lock it down so that only you can read and write it. Any order you like. The clock is the only thing keeping score.",

	goal: 'Invoices archived, junk gone, errors extracted, .env locked to you alone',

	seed: {
		cwd: '~',
		files: {
			'~/downloads/invoice-jan.pdf': '<pdf: invoice 2026-01, Vibe Cloud, $240.00>\n',
			'~/downloads/invoice-feb.pdf': '<pdf: invoice 2026-02, Vibe Cloud, $240.00>\n',
			'~/downloads/invoice-mar.pdf': '<pdf: invoice 2026-03, Vibe Cloud, $312.00>\n',
			'~/downloads/demo-slides.key': '<keynote: "Shipping with agents" — 24 slides>\n',
			'~/downloads/chrome-cache-1.tmp': 'scratch buffer\n',
			'~/downloads/chrome-cache-2.tmp': 'scratch buffer\n',
			'~/logs/build.log': BUILD_LOG,
			'~/logs/build.log.1': BUILD_LOG_1,
			'~/.env': ENV_FILE,
			'~/notes/ideas.md': '# Ideas\n- zine issue #4: the day the pipe clicked\n'
		}
	},

	/**
	 * 18 entries for a job that needs 2 lines. Every rung of the beginner's
	 * eight-line ladder is clickable, and every ingredient of the two-line
	 * route is present — but nothing is pre-chained, because assembling the
	 * chain is precisely the thing being tested.
	 */
	pool: [
		{ command: 'ls -la', role: 'solution' },
		{
			command: 'mkdri -p ~/archive/invoices',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'mkdri is not a command, so nothing was created — and if you chained a mv onto it with &&, the mv never ran either, which is exactly what && is for.'
		},
		{ command: 'mkdir -p ~/archive/invoices', role: 'solution' },
		{ command: 'mv ~/downloads/invoice-jan.pdf ~/archive/invoices', role: 'solution' },
		{ command: 'mv ~/downloads/invoice-feb.pdf ~/archive/invoices', role: 'solution' },
		{
			command: 'mv ~/downloads/* ~/archive/invoices',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: '* means everything, not "the ones I was thinking of": the presentation deck and both cache files went into the invoices folder too. Echo a glob before you trust it.'
		},
		{ command: 'mv ~/downloads/invoice-mar.pdf ~/archive/invoices', role: 'solution' },
		{ command: 'mv ~/downloads/invoice-*.pdf ~/archive/invoices', role: 'solution' },
		{
			command: 'mv ~/logs/build.log ~/archive',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-3-2',
			trap: 'mv moves, it does not copy — the build log is no longer in ~/logs at all. You were asked to take the error lines out of it, not to take the log itself.'
		},
		{ command: 'rm ~/downloads/chrome-cache-1.tmp', role: 'solution' },
		{ command: 'rm ~/downloads/chrome-cache-2.tmp', role: 'solution' },
		{ command: 'rm ~/downloads/*.tmp', role: 'solution' },
		{
			command: 'grep ERROR ~/logs/build.log.1 > ~/archive/errors.txt',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-4-3',
			trap: "Right command, wrong file. build.log.1 is last week's rotated build — you just filed four registry timeouts that have nothing to do with today's failure."
		},
		{ command: 'grep ERROR ~/logs/build.log > ~/archive/errors.txt', role: 'solution' },
		{
			command: 'grep -v ERROR ~/logs/build.log > ~/archive/errors.txt',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-4-3',
			trap: '-v inverts the match, so errors.txt now holds every line that is NOT an error. It exits 0 and the file looks reassuringly full, which is why this one gets shipped.'
		},
		{ command: 'ls -l ~/.env', role: 'solution' },
		{
			command: 'chmod 777 ~/.env',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-5-2',
			trap: 'You did change the permissions — to the worst possible ones. 777 hands read, write and execute to every account on the machine, which is the opposite of locking a file that holds two live API keys.'
		},
		{ command: 'chmod 600 ~/.env', role: 'solution' }
	],

	/**
	 * Strict about the four things asked for, and about the two things that had
	 * to survive. `.trim()` on the error lines because a learner may reach them
	 * through a pipe; everything else is exact — the deck still in ~/downloads,
	 * both logs untouched in ~/logs, and .env at exactly rw-------.
	 */
	check: async (engine) => {
		// 1. The three invoices archived, under their own names.
		for (const name of ['invoice-jan.pdf', 'invoice-feb.pdf', 'invoice-mar.pdf']) {
			if (!engine.isFile(`~/archive/invoices/${name}`)) return false;
		}

		// 2. downloads holds the deck and nothing else.
		const downloads = engine.listDir('~/downloads');
		if (!downloads) return false;
		if (downloads.length !== 1 || downloads[0] !== 'demo-slides.key') return false;

		// 3. errors.txt is exactly today's three ERROR lines, in order.
		const report = engine.readFile('~/archive/errors.txt');
		if (!report) return false;
		const lines = report.split('\n').filter((l) => l.trim() !== '');
		if (lines.length !== ERROR_LINES.length) return false;
		for (let i = 0; i < ERROR_LINES.length; i++) {
			if (lines[i].trim() !== ERROR_LINES[i]) return false;
		}

		// 4. .env locked to the owner alone.
		if (engine.modeOf('~/.env') !== 'rw-------') return false;

		// Both logs survived, unedited, where they were.
		return (
			engine.readFile('~/logs/build.log') === BUILD_LOG &&
			engine.readFile('~/logs/build.log.1') === BUILD_LOG_1
		);
	},

	scoring: {
		great: {
			lines: [
				'mkdir -p ~/archive/invoices && mv ~/downloads/invoice-*.pdf ~/archive/invoices && rm ~/downloads/*.tmp',
				'grep ERROR ~/logs/build.log > ~/archive/errors.txt && chmod 600 ~/.env'
			],
			note: 'Four chores, five moves, two Enters. One glob stands in for three filenames, another for two, and && stands in for every line break that was only there out of habit — the whole course in two lines.',
			expect: { enters: 2, elements: 5, cost: 7 }
		},
		greatAlternates: [
			{
				lines: [
					'cd ~/downloads',
					'mkdir -p ~/archive/invoices && mv invoice-*.pdf ~/archive/invoices && rm *.tmp',
					'grep ERROR ~/logs/build.log > ~/archive/errors.txt && chmod 600 ~/.env'
				],
				note: 'Stand where the work is first, then the globs need no directory prefix at all. The cd is free — looking around and positioning yourself never costs anything.',
				expect: { enters: 2, elements: 5, cost: 7 }
			},
			{
				lines: [
					'mkdir -p ~/archive/invoices && mv ~/downloads/invoice-*.pdf ~/archive/invoices && rm ~/downloads/*.tmp && chmod 600 ~/.env',
					'grep ERROR ~/logs/build.log > ~/archive/errors.txt'
				],
				note: 'Same two Enters, split differently: the four chores that touch no redirection ride one chain, and the one that does gets its own line where its arrow is easy to count.',
				expect: { enters: 2, elements: 5, cost: 7 }
			}
		],
		acceptable: {
			lines: [
				'mkdir -p ~/archive/invoices',
				'mv ~/downloads/invoice-jan.pdf ~/archive/invoices',
				'mv ~/downloads/invoice-feb.pdf ~/archive/invoices',
				'mv ~/downloads/invoice-mar.pdf ~/archive/invoices',
				'rm ~/downloads/chrome-cache-1.tmp',
				'rm ~/downloads/chrome-cache-2.tmp',
				'grep ERROR ~/logs/build.log > ~/archive/errors.txt',
				'chmod 600 ~/.env'
			],
			note: 'One chore per Enter, every filename typed out. Nothing here is wrong and everything here is safe — it is simply eight Enters and five typed filenames for a job that needed two and none.',
			expect: { enters: 8, elements: 8, cost: 16 }
		}
	}
};
