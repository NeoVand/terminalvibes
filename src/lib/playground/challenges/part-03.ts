/**
 * Part 3 · Copy, Move, Delete — the challenge.
 *
 * DESTINATION: src/lib/playground/challenges/part-03.ts
 *
 * Design notes, for the reviewer:
 *
 *  - Part 3's signature lever (§4.2) is "a glob instead of four filenames;
 *    `mv a b c dest/` in one call". So the job is deliberately shaped as two
 *    homogeneous groups — three files to file, three files to destroy — which
 *    is the smallest shape where one pattern beats six names and where the
 *    beginner's honest route is genuinely six Enters, not two.
 *  - `&&` is Part 6, `>` is Part 4. Neither solution chains or redirects.
 *  - The pool does NOT contain `mv *.csv data/` or `rm *.tmp`. It contains
 *    `echo *.csv` and `echo *.tmp` instead. That is the entire beginner/expert
 *    split, and it is exactly the ritual 3.4 teaches: preview the pattern with
 *    a harmless command, then swap the harmless command for the real one. A
 *    chip-clicker lands on ACCEPTABLE; the learner who makes that swap lands
 *    on GREAT having performed the habit rather than been told it.
 *  - `archive/` exists so wrong-target has somewhere to land, and it doubles as
 *    the demonstration that a glob never crosses a `/` — `*.csv` in the project
 *    root leaves `archive/results-2023.csv` alone (3.4).
 *  - `.env` is seeded because `*` does not match dotfiles (verified in the
 *    sandbox: after `mv * data/`, `.env` is still in the root). It is the small
 *    mercy 3.4's closing warning promises, and the check asserts it.
 */

import type { Challenge } from '../challenges';
import type { ShellEngine } from '../shell-engine';

const SCRAPE_PY = [
	'import csv, sys',
	'',
	'# scrapes the monthly listings and writes results-<month>.csv',
	'def main(month):',
	'    rows = fetch(month)',
	'    write(f"results-{month}.csv", rows)',
	''
].join('\n');

const CONFIG_YAML = ['source: listings', 'months: [jan, feb, mar]', 'out_dir: data', ''].join('\n');

const README_MD = ['# scraper', '', 'Monthly listing scraper. Results belong in data/.', ''].join(
	'\n'
);

const ENV_FILE = ['SCRAPER_TOKEN=sk-live-8f2a1c', ''].join('\n');

/** The three files that must end up in data/, content-checked so a clobber shows. */
const RESULTS: Record<'jan' | 'feb' | 'mar', string> = {
	jan: ['listing,price,sold', 'a-101,340,yes', 'a-102,290,no', ''].join('\n'),
	feb: ['listing,price,sold', 'b-201,410,yes', 'b-202,395,yes', ''].join('\n'),
	mar: ['listing,price,sold', 'c-301,255,no', 'c-302,610,yes', ''].join('\n')
};

/** Already filed, last year, by someone else. It is not yours to touch. */
const RESULTS_2023 = ['listing,price,sold', 'z-001,180,yes', ''].join('\n');

const SCRATCH = 'partial write, interrupted\n';

/** Every file path in the sandbox, so "gone" can be checked to mean gone. */
function allFiles(engine: ShellEngine, dir = '/', out: string[] = []): string[] {
	for (const name of engine.listDir(dir) ?? []) {
		const path = dir === '/' ? `/${name}` : `${dir}/${name}`;
		if (engine.isDir(path)) allFiles(engine, path, out);
		else out.push(path);
	}
	return out;
}

export const challengePart3: Challenge = {
	id: 'ch-3-after-the-agent',
	partId: 'part-3',
	part: 3,
	title: 'Clean up after the agent',

	description:
		"The scraping agent finished its run and left ~/scraper in a state. The three monthly result files belong in data/ — that folder already exists and is empty — and they belong there only, not in two places at once. The three scratch files the run left behind are junk: they should be gone for good, not stashed somewhere else. Everything else stays exactly where and as it is: the script, config.yaml, the README, the hidden .env, and last year's results already filed away in archive/.",

	goal: 'The three monthly results are filed in data/, the scratch files are gone, and nothing else moved',

	seed: {
		cwd: '~/scraper',
		dirs: ['~/scraper/data', '~/scraper/archive'],
		files: {
			'~/scraper/scrape.py': SCRAPE_PY,
			'~/scraper/config.yaml': CONFIG_YAML,
			'~/scraper/README.md': README_MD,
			'~/scraper/.env': ENV_FILE,
			'~/scraper/results-jan.csv': RESULTS.jan,
			'~/scraper/results-feb.csv': RESULTS.feb,
			'~/scraper/results-mar.csv': RESULTS.mar,
			'~/scraper/cache-01.tmp': SCRATCH,
			'~/scraper/cache-02.tmp': SCRATCH,
			'~/scraper/scratch.tmp': SCRATCH,
			'~/scraper/archive/results-2023.csv': RESULTS_2023
		}
	},

	/**
	 * 15 entries for a job that needs 2. The six chips of the ACCEPTABLE path are
	 * all here and clickable in order; the GREAT lines are not here at all, only
	 * their two patterns, wearing `echo` in front of them.
	 */
	pool: [
		{ command: 'ls', role: 'solution' },
		{
			command: 'cp *.csv data/',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-3-1',
			trap: 'cp never touches the original — that is the whole point of it (3.1). So data/ is now correct and the project root is exactly as messy as it was: three result files sitting in both places, and you cannot tell from the output that anything is wrong.'
		},
		{ command: 'echo *.csv', role: 'solution' },
		{
			command: 'mv *.csv archive/',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-3-2',
			trap: "Right command, right pattern, wrong destination — and nothing complained, because the names did not collide: archive/ now holds last year's results and this year's mixed together, and data/ is still empty. Silently-wrong is the expensive kind. `ls` the destination first when in doubt."
		},
		{ command: 'mv results-jan.csv data/', role: 'solution' },
		{ command: 'mv results-feb.csv data/', role: 'solution' },
		{
			command: 'mv * data/',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-3',
			trap: '`*` is not "the files I was thinking about", it is everything here — the script, config.yaml, the README, the scratch files and archive/ all went into data/, and mv only stopped to complain that it could not move data/ into itself. (Your .env survived: `*` does not match dotfiles.)'
		},
		{ command: 'mv results-mar.csv data/', role: 'solution' },
		{ command: 'echo *.tmp', role: 'solution' },
		{
			command: 'rm *.tpm',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-3-4',
			trap: "Transposed letters. A pattern that matches nothing is handed to the command literally, star and all, so rm reports `cannot remove '*.tpm'` — the baffling error 3.4 warns about, and one echo would have shown you the pattern was dead before you ran it."
		},
		{ command: 'rm cache-01.tmp', role: 'solution' },
		{
			command: 'rm cache-?.tmp',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-3-4',
			trap: '`?` is exactly one character, not "a number" — the same reason page?.html misses page12.html. The scratch files are cache-01 and cache-02, two digits, so this pattern matches nothing and deletes nothing.'
		},
		{ command: 'rm cache-02.tmp', role: 'solution' },
		{
			command: 'mv results-feb.csv results-jan.csv',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-3-2',
			trap: 'The overwrite danger, part two: mv replaced results-jan.csv without asking and results-feb.csv no longer exists under its old name. You have lost both versions of the story — January is gone and February is wearing its name. This one needs a reset.'
		},
		{ command: 'rm scratch.tmp', role: 'solution' }
	],

	/**
	 * Content-compared, not just existence-checked: `mv results-feb.csv
	 * results-jan.csv` leaves a file called results-jan.csv holding February's
	 * rows, and the whole point of 3.2's warning is that nothing about that
	 * looks wrong from the outside. The absence check on the project root is
	 * what separates mv from cp.
	 *
	 * "Gone" is checked across the WHOLE filesystem, not just the project root.
	 * That is not pedantry: 3.3 explicitly recommends relocating to a scrap
	 * folder instead of deleting ("the calmer move is often mv"), so `mv *.tmp
	 * data/` is a move a learner reaches for honestly — and it costs exactly
	 * what `rm *.tmp` costs, so a root-only absence test would hand out GREAT
	 * for stashing the junk one folder deeper. The brief rules it out in so
	 * many words; the check has to agree with the brief. Content is compared
	 * as well as name, so renaming the junk does not launder it either.
	 */
	check: async (engine) => {
		for (const month of ['jan', 'feb', 'mar'] as const) {
			if (engine.readFile(`~/scraper/data/results-${month}.csv`) !== RESULTS[month]) return false;
			// Moved, not copied: it must not still be in the project root.
			if (engine.exists(`~/scraper/results-${month}.csv`)) return false;
		}

		// data/ holds those three and nothing else — not a dumping ground.
		if ((engine.listDir('~/scraper/data') ?? []).length !== 3) return false;

		// Destroyed, not relocated and not renamed — anywhere on the disk.
		const JUNK = ['cache-01.tmp', 'cache-02.tmp', 'scratch.tmp'];
		for (const path of allFiles(engine)) {
			if (JUNK.includes(path.slice(path.lastIndexOf('/') + 1))) return false;
			if (engine.readFile(path) === SCRATCH) return false;
		}

		// Everything else stayed put, and stayed itself.
		return (
			engine.readFile('~/scraper/scrape.py') === SCRAPE_PY &&
			engine.readFile('~/scraper/config.yaml') === CONFIG_YAML &&
			engine.readFile('~/scraper/README.md') === README_MD &&
			engine.readFile('~/scraper/.env') === ENV_FILE &&
			engine.readFile('~/scraper/archive/results-2023.csv') === RESULTS_2023
		);
	},

	scoring: {
		great: {
			lines: ['mv *.csv data/', 'rm *.tmp'],
			note: 'Two patterns instead of six filenames. The glob does not cross a /, so archive/results-2023.csv is never in range — and `echo *.csv` / `echo *.tmp` cost nothing, so there is no reason not to have looked first.',
			expect: { enters: 2, elements: 2, cost: 4 }
		},
		greatAlternates: [
			{
				lines: [
					'mv results-jan.csv results-feb.csv results-mar.csv data/',
					'rm cache-01.tmp cache-02.tmp scratch.tmp'
				],
				note: 'The other Part 3 lever: several sources in one call with the folder last. Costs exactly the same as the glob and is arguably safer, because you named what you were aiming at.',
				expect: { enters: 2, elements: 2, cost: 4 }
			},
			{
				lines: ['mv results-*.csv data/', 'rm cache-0?.tmp scratch.tmp'],
				note: 'Narrower patterns, mixed with a literal name. Same price as the broad glob — precision is free here, which is the argument for using it.',
				expect: { enters: 2, elements: 2, cost: 4 }
			}
		],
		acceptable: {
			lines: [
				'mv results-jan.csv data/',
				'mv results-feb.csv data/',
				'mv results-mar.csv data/',
				'rm cache-01.tmp',
				'rm cache-02.tmp',
				'rm scratch.tmp'
			],
			note: 'One file per line, every name typed out. Nothing here is wrong — and with six files it is only tedious. The lesson is what happens at forty, which is the number 3.4 opens with.',
			expect: { enters: 6, elements: 6, cost: 12 }
		}
	}
};
