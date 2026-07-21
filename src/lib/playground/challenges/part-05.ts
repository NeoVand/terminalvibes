/**
 * Part 5 · Permissions & Config — "Nothing in the kit will run".
 *
 * DESTINATION: src/lib/playground/challenges/part-05.ts
 *
 * Design notes, in the shape of the reference challenge:
 *
 *  - The goal needs TWO things that Part 5 teaches and nothing else does: a
 *    permission bit on several files at once, and a setting that is live in
 *    THIS shell *and* survives the next one. That second half is 5.5's whole
 *    lesson — the config file only runs at startup, so writing it changes
 *    nothing here until you either export it too or reload it in place.
 *  - Part 5's signature economy lever (per the format spec) is "chmod over a
 *    glob". So the seed puts four scripts in one folder — and beside them two
 *    files that must NOT become executable, which is what stops the glob from
 *    being a free lunch. `chmod +x *.sh` is the move; `chmod +x *` is the trap
 *    one character away from it, and `chmod 777 *` is the trap the course
 *    explicitly calls a red flag.
 *  - && is Part 6, so GREAT cannot chain. GREAT is three Enters; the beginner's
 *    honest path is six, because each script costs its own line.
 *  - Looking is free: `ls -l`, `cat ~/.bashrc` and `echo *.sh` cost nothing,
 *    which is the point — you cannot fix a permission you have not read.
 *
 * SANDBOX GAP — do not "fix" this with a distractor. 5.5 teaches that `bash
 * file` starts a child shell and takes its exports with it, while `source`
 * runs the lines here. The sandbox does not model that: cmdBash and cmdSource
 * both call runScriptContent against the SAME ShellEngine, so `export` inside
 * a bash-run script still lands in engine.env. `bash ~/.bashrc` therefore
 * passes this check exactly like `source ~/.bashrc` does. A `bash ~/.bashrc`
 * chip would be a trap that does not spring — worse than no chip at all — so
 * there isn't one, and there must not be one until the engine gives `bash` its
 * own env scope. Verified by execution, not by reading.
 */

import type { Challenge } from '../challenges';

/** The four scripts. None is seeded executable — that is the situation. */
const SCRIPTS = ['build.sh', 'migrate.sh', 'publish.sh', 'rollback.sh'] as const;

const BUILD_SH = [
	'#!/usr/bin/env bash',
	"echo 'Building the site into dist/...'",
	'mkdir -p dist',
	"echo 'Build finished.'",
	''
].join('\n');

const MIGRATE_SH = [
	'#!/usr/bin/env bash',
	'echo "Running migrations against $DEPLOY_TARGET..."',
	"echo 'Migrations up to date.'",
	''
].join('\n');

const PUBLISH_SH = [
	'#!/usr/bin/env bash',
	'echo "Publishing to $DEPLOY_TARGET..."',
	"echo 'Published.'",
	''
].join('\n');

const ROLLBACK_SH = [
	'#!/usr/bin/env bash',
	'echo "Rolling $DEPLOY_TARGET back to the previous release..."',
	"echo 'Rolled back.'",
	''
].join('\n');

/** Not a script. Holds a key. Has no business carrying an execute bit. */
const SECRETS_ENV = [
	'API_KEY=sk-live-4f9c2a77b1e0',
	'DB_URL=postgres://localhost:5432/app',
	''
].join('\n');

const README_MD = [
	'# deploy-kit',
	'',
	'build.sh     compile the site into dist/',
	'migrate.sh   bring the database up to date',
	'publish.sh   push dist/ to whatever DEPLOY_TARGET names',
	'rollback.sh  undo the last publish',
	'',
	'Every script reads $DEPLOY_TARGET. Set it before you run anything.',
	''
].join('\n');

/**
 * The config that was already there. The check insists ONE of its lines is
 * still there, so `echo ... > ~/.bashrc` (one character from the right answer)
 * is a real loss of work rather than a harmless variation — but a recoverable
 * one: a single append puts it back. No distractor may strand a learner.
 */
const BASHRC_ANCHOR = "alias ll='ls -lh'";

/**
 * The line ~/.bashrc must carry for the setting to survive the next shell.
 * Optional quotes around the value, optional trailing comment, no space
 * around the `=` — the three variations the sandbox treats as identical, and
 * the one it does not.
 */
const PERSISTED_LINE = /^\s*export\s+DEPLOY_TARGET=(staging|"staging"|'staging')\s*(#.*)?$/;

const BASHRC = [
	'# ~/.bashrc — runs at the start of every new shell session.',
	"alias ll='ls -lh'",
	"alias gs='git status'",
	'export EDITOR=nano',
	''
].join('\n');

export const challengePart5: Challenge = {
	id: 'ch-5-deploy-kit',
	partId: 'part-5',
	part: 5,
	title: 'Nothing in the kit will run',

	description:
		'You pulled down the team\'s deploy-kit and not one thing in it works: every script answers "Permission denied", and the scripts themselves are all reading a DEPLOY_TARGET that nobody has set. Make all four .sh files in ~/deploy-kit runnable. secrets.env holds a live API key and README.md is documentation — neither has any business being executable, so make sure neither of them ends up with an execute bit. Then get DEPLOY_TARGET to staging: set here, in this shell, right now, and still set tomorrow morning in a brand-new terminal — which means ~/.bashrc has to carry it too, without losing anything already in there.',

	goal: 'The four scripts are executable, secrets.env is not, and DEPLOY_TARGET=staging is live here and saved in ~/.bashrc',

	seed: {
		cwd: '~/deploy-kit',
		files: {
			'~/.bashrc': BASHRC,
			'~/deploy-kit/README.md': README_MD,
			'~/deploy-kit/build.sh': BUILD_SH,
			'~/deploy-kit/migrate.sh': MIGRATE_SH,
			'~/deploy-kit/publish.sh': PUBLISH_SH,
			'~/deploy-kit/rollback.sh': ROLLBACK_SH,
			'~/deploy-kit/secrets.env': SECRETS_ENV
		},
		// The aliases the seeded ~/.bashrc would have defined at startup, so the
		// shell state and the file on disk agree the way they would on a real
		// machine. It is also what `echo ... > ~/.bashrc` silently destroys.
		aliases: {
			ll: 'ls -lh',
			gs: 'git status'
		}
	},

	/**
	 * 18 entries for a three-line job. A beginner who only clicks chips can
	 * finish — four per-file chmods, one export, one append — and lands on
	 * ACCEPTABLE. The glob, the append and `source` are all here too; seeing
	 * which of the three `*` lines is the right one is the expert's work, and
	 * two of the three are wrong in ways the course names out loud.
	 */
	pool: [
		{ command: 'ls -l', role: 'solution' },
		{
			command: 'chmod +w *.sh',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-5-1',
			trap: 'w is write, x is execute. This exits 0, changes all four files, and leaves every one of them exactly as unrunnable as before — you granted the permission nobody was missing.'
		},
		{ command: 'chmod +x build.sh', role: 'solution' },
		{
			command: 'chmod 644 *.sh',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-5-2',
			trap: '644 is the recipe for documents — rw-r--r--, nobody executes. You just spelled out, in octal, the exact permissions the scripts already had.'
		},
		{ command: 'chmod +x migrate.sh', role: 'solution' },
		{
			command: 'chmod +x *',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: 'The shell expands * before chmod sees it, and in this folder * is six files: your four scripts plus README.md and secrets.env. A file holding a live API key is now marked executable. Echoing the glob first would have shown you that.'
		},
		{ command: 'chmod +x publish.sh', role: 'solution' },
		{
			command: 'chmod 777 *',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-5-2',
			trap: '777 does not fix permissions, it switches them off: every file in the kit is now readable, writable and executable by everyone — including secrets.env. When a fix makes the rulebook say yes to everything, it is not a fix.'
		},
		{ command: 'chmod +x rollback.sh', role: 'solution' },
		{
			command: 'sudo chmod +x *.sh',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-5-3',
			trap: "Nothing was chmod'd — sudo refused, printed a short lecture, and handed your own command back with the sudo stripped off. Everything under ~ is already yours; a failure inside your own home folder is never a missing superpower, it's a missing +x or a wrong path."
		},
		{ command: 'chmod +x *.sh', role: 'solution' },
		{
			command: 'chmod +x ~/deploy-kit',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-5-1',
			trap: 'That is the folder, not the files. On a directory x means "you may cd into it" — which deploy-kit already allowed. The four scripts inside are untouched.'
		},
		{ command: 'export DEPLOY_TARGET=staging', role: 'solution' },
		{
			command: 'DEPLOY_TARGET=staging',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-5-4',
			trap: 'No export, so this stays a shell variable: echo $DEPLOY_TARGET prints staging and every program the shell launches still sees nothing. export is the word that hands a value down.'
		},
		{ command: "echo 'export DEPLOY_TARGET=staging' >> ~/.bashrc", role: 'solution' },
		{
			command: "echo 'export DEPLOY_TARGET=staging' > ~/.bashrc",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-1',
			trap: '> replaces, >> appends. The right line, written the wrong way: .bashrc is now one line long. ll still works, because the alias is already loaded in this shell — it just will not come back in the next one, which is the whole reason the file exists.'
		},
		{
			command: "echo 'export DEPLOY_TARGET = staging' >> ~/.bashrc",
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-5-4',
			trap: 'Spaces around the = break an assignment: bash reads this as the command export with three separate arguments. The junk line is now in your config, and every new shell will trip over it.'
		},
		{ command: 'source ~/.bashrc', role: 'solution' },
		{ command: 'cat ~/.bashrc', role: 'solution' }
	],

	/**
	 * Strict about the two things Part 5 teaches — the execute bit on exactly
	 * the right files, and a setting that is both live and persisted — and
	 * tolerant about everything else. The .bashrc test is a per-line regex
	 * rather than a substring so a half-written or spaced-out assignment cannot
	 * pass, and the seeded config must still be present, which is what makes
	 * `>` a genuine loss.
	 *
	 * PERSISTED_LINE is deliberately wider than the one spelling the great path
	 * happens to use. `export DEPLOY_TARGET="staging"` and the single-quoted
	 * form are ordinary config style — 5.4's own prose quotes values — and the
	 * sandbox sources all three to exactly the same value, so rejecting two of
	 * them would fail a learner for a cosmetic choice and teach that the
	 * terminal is arbitrary. A trailing `#` comment is allowed for the same
	 * reason: annotating your own config is good practice, not a mistake.
	 *
	 * What it still rejects, all confirmed by execution: `export DEPLOY_TARGET
	 * = staging` (spaces break the assignment — the typo distractor), a
	 * commented-out `# export ...` line (it never runs), a bare
	 * `DEPLOY_TARGET=staging` with no export, and any value that is not
	 * exactly `staging`. Case included: `Staging` fails, because the shell
	 * never guessed at a value in its life.
	 */
	check: async (engine) => {
		for (const name of SCRIPTS) {
			if (!engine.isExecutable(`~/deploy-kit/${name}`)) return false;
		}
		// The two files that were never scripts must still not be executable.
		if (engine.isExecutable('~/deploy-kit/secrets.env')) return false;
		if (engine.isExecutable('~/deploy-kit/README.md')) return false;

		// Live in this shell, and exported — not merely a shell variable.
		if (engine.env.DEPLOY_TARGET !== 'staging') return false;

		const bashrc = engine.readFile('~/.bashrc');
		if (bashrc === null) return false;
		// What was already in the config survived a careless `>`.
		if (!bashrc.includes(BASHRC_ANCHOR)) return false;
		// And the setting is there for the next shell to read.
		return bashrc.split('\n').some((line) => PERSISTED_LINE.test(line));
	},

	scoring: {
		great: {
			lines: [
				'chmod +x *.sh',
				"echo 'export DEPLOY_TARGET=staging' >> ~/.bashrc",
				'source ~/.bashrc'
			],
			note: 'One glob for all four scripts, then write the setting once and load the file you just wrote — the config becomes the single source of truth instead of something typed twice.',
			expect: { enters: 3, elements: 3, cost: 6 }
		},
		greatAlternates: [
			{
				lines: [
					'chmod +x *.sh',
					'export DEPLOY_TARGET=staging',
					"echo 'export DEPLOY_TARGET=staging' >> ~/.bashrc"
				],
				note: 'Same cost, different reading of 5.5: set it here, then save it for next time. It says the value twice, which is exactly why the source route exists — but it is not a worse answer.',
				expect: { enters: 3, elements: 3, cost: 6 }
			},
			{
				lines: [
					'chmod 755 build.sh migrate.sh publish.sh rollback.sh',
					"echo 'export DEPLOY_TARGET=staging' >> ~/.bashrc",
					'source ~/.bashrc'
				],
				note: 'The other economy lever from Part 3: one chmod, four operands, no glob at all. Costs the same and never risks catching secrets.env.',
				expect: { enters: 3, elements: 3, cost: 6 }
			}
		],
		acceptable: {
			lines: [
				'chmod +x build.sh',
				'chmod +x migrate.sh',
				'chmod +x publish.sh',
				'chmod +x rollback.sh',
				'export DEPLOY_TARGET=staging',
				"echo 'export DEPLOY_TARGET=staging' >> ~/.bashrc"
			],
			note: 'One file per line, one thought per line. Nothing here is wrong — it is paying six Enters for something four of which the shell would have written for you from a five-character pattern.',
			expect: { enters: 6, elements: 6, cost: 12 }
		}
	}
};
