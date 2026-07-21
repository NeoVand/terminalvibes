/**
 * Part 10 · The Toolshed — "Hand it over, not the bloat".
 *
 * DESTINATION: src/lib/playground/challenges/part-10.ts
 *
 * Design notes for the other authors:
 *
 *  - Part 10's signature levers (spec §4.2) are `du -sh *` once instead of
 *    per-folder, and tar's one-line multi-operand pack. Both are levers of the
 *    same shape: NAME SEVERAL THINGS IN ONE COMMAND. So the challenge needs two
 *    hogs and three keepers, and the whole GREAT/ACCEPTABLE gap is "did you
 *    collapse the repeated line, or run it once per folder".
 *  - The second hog is `.cache`. 10.4 says it outright: `*` never matches a
 *    name that starts with a dot, so the biggest thing in the folder can be
 *    invisible to the very command you measure with. That single sentence is
 *    the trap the whole seed is built around — `du -sh *` is in the pool, and
 *    it is a distractor.
 *  - `notFree: ['du', 'df']`. Measuring IS the skill here; if it were free the
 *    scoring model would collapse to "one tar and one rm" and the Part's
 *    headline command would be worth nothing.
 *  - Both `tar -czf` and `zip -r` are declared great: 10.2's point is that they
 *    are two spellings of one idea, and greatCost being the MAX means neither
 *    is punished.
 *  - `vendor-backup.tar.gz` sits in the seed with no peek chip on purpose. It
 *    exists so `tar -xzf` on an unexamined archive can scatter files across the
 *    project root, exactly as the 10.2 Callout warns. Note the honest tension:
 *    `tar -tzf` is NOT on FREE_COMMANDS, so peeking always costs — a Part 10
 *    challenge cannot price economy and also reward the peek habit. The lesson
 *    therefore lands in the post-mortem rather than in the solution.
 */

import type { Challenge } from '../challenges';

/** Bulk, so du's numbers make the two hogs unmistakable next to the source. */
const DEP = (name: string) => `// ${name}\nmodule.exports = {};\n${'x'.repeat(40000)}\n`;
const CHUNK = (name: string) => `/* ${name} */\n${'y'.repeat(30000)}\n`;

/**
 * A real archive is a file whose content is a manifest — same format
 * readArchive() in shell-commands.ts parses. This one is deliberately
 * badly built: every entry is at the top level, so extracting it sprays
 * four files across whatever folder you happen to be standing in.
 */
const VENDOR_BACKUP =
	'#!tv-archive\n' +
	JSON.stringify({
		format: 'tar.gz',
		entries: {
			'config.json': '{ "vendor": "stripe", "mode": "test" }\n',
			LICENSE: 'MIT\n',
			'vendor-notes.txt': 'Rotate the test keys before the handover.\n',
			'CHANGELOG.md': '# vendor sdk\n- 3.2.0 initial import\n'
		}
	}) +
	'\n';

export const challengePart10: Challenge = {
	id: 'ch-10-handover',
	partId: 'part-10',
	part: 10,
	title: 'Hand it over, not the bloat',

	description:
		"You are handing the vibecafe project to a teammate this afternoon, and the disk is complaining. Two things must be true before you close the laptop. First, ~/vibecafe holds one archive called handover.tar.gz — or handover.zip, whichever format you prefer — containing README.md, docs and src, and nothing a rebuild would put back. Second, the space is genuinely reclaimed: both of this project's two regenerable folders are gone from disk, and one of them will not show up in a casual listing. Nothing gets deleted before you have measured it — the source has to survive, and guessing which folder is big is how people delete the wrong thing.",

	goal: 'handover archive packed from the source only, both regenerable folders measured then removed',

	seed: {
		cwd: '~/vibecafe',
		files: {
			'~/vibecafe/README.md': '# vibecafe\n\nA small ordering app. Run `npm run dev` to start.\n',
			'~/vibecafe/src/main.js': 'import { menu } from "./api.js";\nconsole.log(menu());\n',
			'~/vibecafe/src/api.js': 'export const menu = () => ["flat white", "cortado"];\n',
			'~/vibecafe/docs/guide.md': '# Guide\n\nEndpoints, config and the deploy checklist.\n',
			// Hog one: visible to a glob.
			'~/vibecafe/node_modules/react/index.js': DEP('react'),
			'~/vibecafe/node_modules/lodash/index.js': DEP('lodash'),
			'~/vibecafe/node_modules/left-pad/index.js': DEP('left-pad'),
			// So `rm -r node_modules/*` visibly leaves something behind: a glob
			// skips dot-names inside the folder just as it does outside it.
			'~/vibecafe/node_modules/.package-lock.json': '{ "lockfileVersion": 3 }\n',
			// Hog two: invisible to a glob. This is the whole of 10.4's last paragraph.
			'~/vibecafe/.cache/vite/deps.json': '{ "hash": "9c2f10ab" }\n',
			'~/vibecafe/.cache/vite/chunk-a.js': CHUNK('chunk-a'),
			'~/vibecafe/.cache/vite/chunk-b.js': CHUNK('chunk-b'),
			// A crate nobody asked you to open.
			'~/vibecafe/vendor-backup.tar.gz': VENDOR_BACKUP
		}
	},

	/**
	 * 14 entries for a job that needs three lines. The ACCEPTABLE path is
	 * clickable end to end (measure each hog, pack, remove each hog); the
	 * collapsed forms — `du -sh * .cache`, `rm -r node_modules .cache` — are
	 * deliberately absent, because composing them out of the per-folder chips
	 * is the expert's work and the entire beginner/expert split.
	 */
	pool: [
		{ command: 'ls -a', role: 'solution' },
		{
			command: 'du -sh *',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-10-4',
			trap: '`*` never matches a name that starts with a dot. The list you just read looks complete and is missing .cache — which is the second-biggest thing in this folder. You have to name a dot-folder yourself before du will ever weigh it.'
		},
		{ command: 'du -sh node_modules', role: 'solution' },
		{
			command: 'df -h',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-10-4',
			trap: 'df answers "how full is the whole disk", not "what is filling it". It told you nothing about vibecafe — and in this sandbox those numbers are simulated anyway. du is the per-folder question.'
		},
		{ command: 'du -sh .cache', role: 'solution' },
		{
			command: 'tar -xzf vendor-backup.tar.gz',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-10-2',
			trap: 'That crate was badly built: every file in it sits at the top level, so it just sprayed config.json, LICENSE, CHANGELOG.md and vendor-notes.txt across your project root. Nothing warned you because you never listed it first — and now they are sitting there waiting to be swept into your handover archive.'
		},
		{ command: 'tar -czf handover.tar.gz README.md docs src', role: 'solution' },
		{
			command: 'tar -czf handover.tar.gz *',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: '`*` swept up node_modules and vendor-backup.tar.gz along with your source. You have just compressed the exact folder you were about to delete for taking too much space — and, being a glob, it still missed .cache.'
		},
		{ command: 'zip -r handover.zip README.md docs src', role: 'solution' },
		{
			command: 'tar -xzf handover.tar.gz README.md docs src',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-10-2',
			trap: 'One letter is the entire verb: x extracts, c creates. You asked tar to open a crate you have not packed yet, so it could only tell you the file does not exist.'
		},
		{ command: 'rm -r node_modules', role: 'solution' },
		{
			command: 'tar -czf handover.tar.gz node_modules',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-10-4',
			trap: 'Exit code 0, a real archive, and completely the wrong contents: you have carefully preserved the one folder that regenerates itself from package.json, and none of the code your teammate actually needs.'
		},
		{ command: 'rm -r .cache', role: 'solution' },
		{
			command: 'rm -r node_modules/*',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-3-3',
			trap: 'The glob emptied the folder but the folder is still there — and a glob skips dot-names, so anything hidden inside survived too. `rm -r` takes the directory itself; you do not have to hollow it out first.'
		}
	],

	/**
	 * Strict about the lesson, tolerant about the route. The archive may be tar
	 * or zip, and entry paths are matched by suffix so a learner who staged the
	 * files into a folder first is not failed for the extra prefix. What is not
	 * negotiable: the source survives, the archive carries no regenerable bulk,
	 * both hogs are actually off the disk, and a measurement happened before the
	 * first deletion — 10.4's Callout, enforced.
	 */
	check: async (engine) => {
		const archivePath = ['~/vibecafe/handover.tar.gz', '~/vibecafe/handover.zip'].find((p) =>
			engine.isFile(p)
		);
		if (!archivePath) return false;

		const content = engine.readFile(archivePath);
		if (!content || !content.startsWith('#!tv-archive')) return false;

		let names: string[];
		try {
			const manifest = JSON.parse(content.slice(content.indexOf('\n') + 1)) as {
				entries?: Record<string, string>;
			};
			names = Object.keys(manifest.entries ?? {});
		} catch {
			return false;
		}
		if (!names.length) return false;

		const packed = (suffix: string) => names.some((n) => n === suffix || n.endsWith('/' + suffix));
		if (!['README.md', 'src/main.js', 'src/api.js', 'docs/guide.md'].every(packed)) return false;
		if (names.some((n) => n.includes('node_modules') || n.includes('.cache'))) return false;

		// The space is genuinely reclaimed, and the source is still here.
		if (engine.exists('~/vibecafe/node_modules') || engine.exists('~/vibecafe/.cache'))
			return false;
		if (!engine.isFile('~/vibecafe/src/main.js') || !engine.isFile('~/vibecafe/docs/guide.md'))
			return false;

		// Measure, then delete — in that order.
		const isDu = (l: string) => /(^|[|&;]\s*)du(\s|$)/.test(l.trim());
		const isRm = (l: string) => /(^|[|&;]\s*)rm(\s|$)/.test(l.trim());
		const firstDu = engine.historyLog.findIndex(isDu);
		const firstRm = engine.historyLog.findIndex(isRm);
		return firstDu !== -1 && firstRm !== -1 && firstDu < firstRm;
	},

	notFree: ['du', 'df'],

	scoring: {
		great: {
			lines: [
				'du -sh * .cache',
				'tar -czf handover.tar.gz README.md docs src',
				'rm -r node_modules .cache'
			],
			note: 'One measurement covering both hogs — the glob for what it can see, the dot-name spelled out because it never will — then one pack and one removal, each naming everything it touches.',
			expect: { enters: 3, elements: 3, cost: 6 }
		},
		greatAlternates: [
			{
				lines: [
					'du -sh * .cache',
					'tar -czf handover.tar.gz README.md docs src && rm -r node_modules .cache'
				],
				note: 'The same three moves with && doing the ordering: the deletion cannot run unless the archive was written. Saves an Enter, not work — which is the truth about &&.',
				expect: { enters: 2, elements: 3, cost: 5 }
			},
			{
				lines: [
					'du -sh * .cache',
					'zip -r handover.zip README.md docs src',
					'rm -r node_modules .cache'
				],
				note: 'zip instead of tar. 10.2 calls them two spellings of one idea, so it costs exactly the same and is listed here so the scoring agrees.',
				expect: { enters: 3, elements: 3, cost: 6 }
			}
		],
		acceptable: {
			lines: [
				'du -sh node_modules',
				'du -sh .cache',
				'tar -czf handover.tar.gz README.md docs src',
				'rm -r node_modules',
				'rm -r .cache'
			],
			note: 'One folder per line, twice over. Nothing here is wrong — it is just paying five Enters for something that takes three, because du and rm both take as many names as you care to give them.',
			expect: { enters: 5, elements: 5, cost: 10 }
		}
	}
};
