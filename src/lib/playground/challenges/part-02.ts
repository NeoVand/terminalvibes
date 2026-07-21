/**
 * Part 2 · Moving Around — "Scaffold it from where you stand".
 *
 * DESTINATION: src/lib/playground/challenges/part-02.ts
 *
 * The design, and why it is shaped this way:
 *
 *  - Part 2's signature economy lever (spec §4.2) is `mkdir -p`, multiple
 *    operands, and ONE `~/`-anchored path instead of a chain of `cd`. So the
 *    challenge parks the learner three folders deep somewhere irrelevant and
 *    asks for a tree somewhere else entirely. The beginner walks there; the
 *    expert never moves.
 *  - Nothing is removed from FREE_COMMANDS here, and `cd` in particular stays
 *    free. An earlier draft set `notFree: ['cd']` on the theory that the tiers
 *    would otherwise collapse. Measured against the real scorer, they do not:
 *    with `cd` free the paths come out 4 / 4 / 6 great and 12 acceptable, a gap
 *    of 6 against a required 3. The tiers are carried by how many things each
 *    command creates — `mkdir -p` with three operands versus six separate
 *    commands — which is 2.4's lesson and the actual lever, not by charging
 *    tolls for walking. Charging for `cd` would also have contradicted 2.3 in
 *    as many words ("You can't fall off the map. cd never creates, changes, or
 *    deletes anything — it only moves your point of view") and the scoring
 *    model's own premise that cost is measured in commands that CHANGE things.
 *    Concretely: it graded a learner who typed the perfect two-line answer but
 *    explored first as `acceptable`, in the one Part whose whole point is that
 *    exploring is safe.
 *  - `&&` is Part 6 and globs are Part 3, so neither tier may chain or glob.
 *    The only levers left are exactly the ones this Part teaches.
 *  - One of the three files is `.env`. A dotfile in the goal state means plain
 *    `ls` cannot confirm the job is done — 2.1's lesson, enforced by the
 *    artifact rather than by prose.
 */

import type { Challenge } from '../challenges';

const BRIEF = [
	'client: Nordwind Studio',
	'deliverable: one-page portfolio site',
	'deadline: friday',
	''
].join('\n');

const OLD_INDEX = [
	'<!doctype html>',
	'<title>portfolio 2024</title>',
	'<h1>Under construction since 2024</h1>',
	''
].join('\n');

/** Every directory the finished skeleton must contain, under ~/projects/portfolio. */
const REQUIRED_DIRS = ['', '/src', '/src/components', '/tests', '/docs'];
/** Every file it must contain. `.env` is hidden — plain `ls` will not show it. */
const REQUIRED_FILES = ['/README.md', '/.env', '/src/main.js'];

export const challengePart2: Challenge = {
	id: 'ch-2-scaffold',
	partId: 'part-2',
	part: 2,
	title: 'Scaffold it from where you stand',

	description:
		"You went digging for a logo and your terminal is still parked three folders deep in ~/Downloads/Client Assets/2024. The new site starts now, and it lives at ~/projects/portfolio. Build its skeleton: inside portfolio there must be a src folder with a components folder inside it, plus tests and docs sitting beside src, and three empty files — README.md and .env at the top of portfolio, and main.js inside src. Last year's site is next door in ~/projects/portfolio-old and none of it belongs to you.",

	goal: '~/projects/portfolio holds src/components, tests, docs, README.md, .env and src/main.js',

	seed: {
		cwd: '~/Downloads/Client Assets/2024',
		files: {
			'~/Downloads/Client Assets/2024/brief.txt': BRIEF,
			'~/Downloads/Client Assets/2024/logo-final-FINAL.png': 'PNG (not really)\n',
			'~/Downloads/Client Assets/2024/logo-final-FINAL-v2.png': 'PNG (not really)\n',
			'~/projects/portfolio-old/index.html': OLD_INDEX,
			'~/projects/portfolio-old/.env': 'API_KEY=nordwind-2024-do-not-commit\n',
			'~/notes.txt': 'call the client back\n',
			'~/.bashrc': '# your shell settings live here\n'
		}
	},

	/**
	 * 19 entries for a two-line job. The whole ACCEPTABLE path is clickable, so
	 * a beginner who only clicks chips finishes — one folder at a time, from
	 * inside the folder, exactly as 2.4 demonstrates it.
	 *
	 * Exactly ONE absolute-path chip is offered (the `mkdir -p ~/...` one). It
	 * shows the pattern without handing over the answer: the other five things
	 * the GREAT path creates have no absolute chip, so reaching two lines means
	 * composing the operand lists yourself. That gap is the beginner/expert
	 * split, and it is why no multi-operand absolute line appears here.
	 */
	pool: [
		{ command: 'pwd', role: 'solution' },
		{
			command: 'mkdir ~/projects/portfolio/src/components',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-2-4',
			trap: "Plain mkdir has one rule: the parent must already exist. portfolio and src do not, so it refused the whole path with 'No such file or directory' and created nothing at all — not even portfolio. That is the entire reason -p exists."
		},
		{ command: 'ls ~/projects', role: 'solution' },
		{
			command: 'mkdir -p projects/portfolio/src/components',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-2-2',
			trap: 'No leading ~/, so this is a relative path: it built its tree starting from wherever you happen to be standing, and said nothing about it, because in the shell silence means success. Run it from the Downloads folder you started in and you have grown a stray projects/portfolio there; run it after a `cd ~` and it is exactly right. Same characters, different result — which is the whole difference between a relative and an absolute path. Check `pwd` before you trust a path with no ~/ or / in front of it.'
		},
		{ command: 'cd ~/projects', role: 'solution' },
		{
			command: 'cd ~/projects/portfolio',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-2-3',
			trap: 'cd only moves your point of view — it never creates anything. The folder does not exist yet, so you got a harmless "no such file or directory" and stayed exactly where you were. Make it first, then walk into it.'
		},
		{ command: 'mkdir portfolio', role: 'solution' },
		{
			command: 'mkdri -p ~/projects/portfolio/src/components',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'mkdri is not a command, so bash answered "command not found" and nothing happened. Typos here cost you nothing but a retry — press the up arrow, fix the spelling, Enter.'
		},
		{ command: 'cd portfolio', role: 'solution' },
		{ command: 'mkdir -p ~/projects/portfolio/src/components', role: 'solution' },
		{ command: 'mkdir src tests docs', role: 'solution' },
		{
			command: 'mkdir -p ~/projects/portfolio/src/components/tests/docs',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-2-4',
			trap: 'It exited 0 and printed nothing, so it looks like it worked — but slashes nest and spaces make siblings. You built docs inside tests inside components, five levels down, instead of tests and docs beside src.'
		},
		{ command: 'mkdir src/components', role: 'solution' },
		{
			command: 'touch ~/projects/portfolio/env',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-2-1',
			trap: 'Once portfolio exists, this quietly creates a file called env. The one that was asked for is .env, with a leading dot — and that dot is exactly what makes it hidden, which is also why plain ls will not show the real one once you do create it. Run it before portfolio exists and touch refuses outright: it will not invent the folder for you.'
		},
		{ command: 'touch README.md', role: 'solution' },
		{ command: 'touch .env', role: 'solution' },
		{
			command: 'rm -r ~/projects/portfolio-old',
			role: 'distractor',
			kind: 'forward-reference',
			teaches: 'section-3-3',
			trap: "rm is Part 3, and this is why it waits until then: it worked, it asked nothing, and last year's site is gone — including the .env holding the client's API key. Nothing in this job asked you to tidy up next door."
		},
		{ command: 'touch src/main.js', role: 'solution' },
		{ command: 'ls -a', role: 'solution' }
	],

	/**
	 * Existence only, and deliberately so: no distractor here can be undone
	 * (rm is Part 3), so the check must not forbid the stray folders that
	 * `mkdir -p projects/...` and the over-nested variant leave behind. It
	 * asserts the shape that was asked for and nothing about what else is on
	 * disk, which keeps every wrong turn recoverable without the reset button.
	 */
	check: async (engine) => {
		const root = '~/projects/portfolio';
		for (const dir of REQUIRED_DIRS) {
			if (!engine.isDir(root + dir)) return false;
		}
		for (const file of REQUIRED_FILES) {
			if (!engine.isFile(root + file)) return false;
		}
		return true;
	},

	/**
	 * Walking is free; making things one at a time is what costs. The beginner
	 * pays six mutating commands to the expert's two, and the two `cd`s in the
	 * acceptable path are not what separates them — the six-versus-two is.
	 */
	scoring: {
		great: {
			lines: [
				'mkdir -p ~/projects/portfolio/src/components ~/projects/portfolio/tests ~/projects/portfolio/docs',
				'touch ~/projects/portfolio/README.md ~/projects/portfolio/.env ~/projects/portfolio/src/main.js'
			],
			note: 'Never moves. One ~/-anchored path per thing, -p to grow the whole chain, and the spaces between operands doing the work a second command would otherwise do.',
			expect: { enters: 2, elements: 2, cost: 4 }
		},
		greatAlternates: [
			{
				lines: [
					'cd ~/projects',
					'mkdir -p portfolio/src/components portfolio/tests portfolio/docs',
					'touch portfolio/README.md portfolio/.env portfolio/src/main.js'
				],
				note: 'One jump to the right neighbourhood, then short relative paths. Walking there costs nothing — 2.3 is explicit that cd only moves your point of view — so this ties the never-move route exactly. That is the honest verdict: both did the same two pieces of work.',
				expect: { enters: 2, elements: 2, cost: 4 }
			},
			{
				lines: [
					'mkdir -p ~/projects/portfolio/src/components',
					'mkdir ~/projects/portfolio/tests ~/projects/portfolio/docs',
					'touch ~/projects/portfolio/README.md ~/projects/portfolio/.env ~/projects/portfolio/src/main.js'
				],
				note: 'Deep chain first with -p, then the two siblings with plain mkdir — legal now that their parent exists. One element more than the single-line version, and it reads more clearly to most people.',
				expect: { enters: 3, elements: 3, cost: 6 }
			}
		],
		acceptable: {
			lines: [
				'cd ~/projects',
				'mkdir portfolio',
				'cd portfolio',
				'mkdir src tests docs',
				'mkdir src/components',
				'touch README.md',
				'touch .env',
				'touch src/main.js'
			],
			note: 'The tourist route: walk there, then build one thing at a time from inside. The walking is not the problem and costs nothing — it is making six things with six commands where three operands on one line would have done it.',
			expect: { enters: 6, elements: 6, cost: 12 }
		}
	}

	/**
	 * No notFree. pwd → ls → cd is the rhythm this Part teaches and none of the
	 * three changes anything on disk, so none of them costs. What costs is
	 * mkdir and touch — the commands that actually build the thing being asked
	 * for — and that is where the two tiers separate on their own.
	 */
};
