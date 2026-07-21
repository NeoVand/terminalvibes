/**
 * Part 12 · Your Cockpit — "Hand over the cockpit".
 *
 * DESTINATION: src/lib/playground/challenges/part-12.ts
 *
 * Part 12's signature economy lever (spec §4.2) is `history | grep` instead of
 * scrolling, and a config line that collapses a command you keep retyping. Both
 * are load-bearing here, and neither is decoration:
 *
 *  - The runbook cannot be typed from memory. Its lines must be REAL entries
 *    from `engine.historyLog`, numbered the way the shell numbers them, so the
 *    only sane route to it is asking your history. That is 12.2 as a goal state.
 *  - The alias has to land in `~/.bashrc`, not just in the session — 12.1 and
 *    5.5 both say a config line that dies with the window did nothing.
 *  - Because the runbook is a snapshot of history AT THE MOMENT YOU TAKE IT,
 *    order matters: do the work, then record it. A learner who takes the
 *    snapshot first gets an empty runbook and learns what a history is.
 *
 * The filter is self-consistent in a way that does the teaching for free:
 * `history | grep deploy.log > runbook.txt` is itself a line mentioning
 * deploy.log, so it belongs in its own output — while the unfiltered
 * `history > runbook.txt` writes a line about runbook.txt that is not about
 * deploy.log, and fails. Dump vs filter, decided by the artifact.
 *
 * There is deliberately NO forward-reference distractor: Parts 13 and 14
 * introduce no new commands (spec §4.3), so at Part 12 there is nothing to
 * reach forward to. Six of the remaining kinds are used instead.
 */

import type { Challenge } from '../challenges';

/** This morning: three deploy attempts, three FAILED lines among the OKs. */
const DEPLOY_LOG = [
	'09:12:03 OK      build: 214 modules bundled in 6.1s',
	'09:12:44 OK      upload: 38 files to staging',
	'09:13:02 FAILED  smoke: /api/health returned 502',
	'09:13:05 OK      rollback: staging back on build 812',
	'09:41:17 OK      build: 214 modules bundled in 5.8s',
	'09:41:58 FAILED  smoke: /api/health returned 502',
	'09:42:01 OK      rollback: staging back on build 812',
	'10:20:30 OK      build: 215 modules bundled in 5.9s',
	'10:21:11 FAILED  upload: token expired mid-transfer',
	''
].join('\n');

/** Yesterday's rotated log. Different failures — so aiming wrong is visibly wrong. */
const DEPLOY_LOG_1 = [
	'17:02:10 OK      build: 209 modules bundled in 6.4s',
	'17:03:00 FAILED  smoke: /api/health returned 500',
	'17:03:40 FAILED  smoke: /api/health returned 500',
	'17:04:12 OK      rollback: staging back on build 806',
	''
].join('\n');

/**
 * A config file with something already in it — which is what makes `>` over
 * `>>` a real loss rather than a shrug, and what the check asserts survived.
 */
const BASHRC = [
	'# ~/.bashrc — read every time a new shell starts',
	'export EDITOR=nano',
	"alias ll='ls -la'",
	''
].join('\n');

const FAILED_LINES = [
	'09:13:02 FAILED  smoke: /api/health returned 502',
	'09:41:58 FAILED  smoke: /api/health returned 502',
	'10:21:11 FAILED  upload: token expired mid-transfer'
];

export const challengePart12: Challenge = {
	id: 'ch-12-handover',
	partId: 'part-12',
	part: 12,
	title: 'Hand over the cockpit',

	description:
		"You have spent the morning babysitting the same flaky deploy, and now you are handing this terminal to someone else — a teammate, or the agent in the next pane. Leave three things behind. In ~/site: failures.txt, holding every FAILED line from deploy.log, in order. Also in ~/site: runbook.txt, holding the lines of this session's command history that mention deploy.log — numbered exactly the way the shell numbers them, nothing else in the file, and every line a command you really ran. And ~/.bashrc must end up with one new line defining an alias named failcheck that runs the failure check, so nobody retypes it tomorrow. Everything already in ~/.bashrc stays, deploy.log stays untouched, and the rotated deploy.log.1 stays where it is.",

	goal: 'failures.txt, a runbook recalled from your own history, and a failcheck alias that survives the window',

	seed: {
		cwd: '~/site',
		files: {
			'~/site/deploy.log': DEPLOY_LOG,
			'~/site/deploy.log.1': DEPLOY_LOG_1,
			'~/.bashrc': BASHRC
		}
	},

	/**
	 * 17 entries for a job that needs 2 or 3 lines. Both halves of the beginner's
	 * staged route are here (scratch file to the config, history to a file then
	 * grepped), and so is every ingredient of the economical one — but nothing is
	 * pre-assembled. Composing that is the expert's work.
	 *
	 * `history | grep deploy.log > runbook.txt` used to be a chip. It is the
	 * whole of this Part's signature lever and the whole of the great path's
	 * second line, so clicking it bought the lesson outright. What is offered
	 * now is `history | grep deploy.log` — the SEARCH, which is the idea — and
	 * the learner supplies the arrow and the filename. Same for the typo
	 * distractor beside it: `histroy > session.txt` teaches exactly what the
	 * pipelined version taught (the redirection is set up before the shell goes
	 * looking for the command) without handing over the composed line with one
	 * letter out of place.
	 *
	 * The two chips that differ by a single character —
	 *   echo "alias failcheck=..." >  ~/.bashrc
	 *   echo "alias failcheck=..." >> ~/.bashrc
	 * — sit apart in the list on purpose. You have to read them.
	 */
	pool: [
		{ command: 'cat deploy.log', role: 'solution' },
		{
			command: 'grep FAILED deploy.log.1 > failures.txt',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-4-3',
			trap: "Right command, wrong file: deploy.log.1 is yesterday's rotated log. You filed two 500s from last night instead of this morning's three failures — and nothing about it looks broken."
		},
		{ command: 'grep FAILED deploy.log > failures.txt', role: 'solution' },
		{
			command: 'grep FAILED deploy.log* > failures.txt',
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: 'deploy.log* matches deploy.log AND deploy.log.1, so grep searched both — and the moment it has two files it prefixes every line with the filename. Five lines, all wearing a filename you did not ask for.'
		},
		{ command: 'history', role: 'solution' },
		{
			command: 'history > runbook.txt',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-12-2',
			trap: 'Exits 0, writes a full-looking file — and dumps every command you have typed instead of the ones about the deploy. Note what it wrote about itself: a line mentioning runbook.txt and nothing else. History is a searchable log, and 12.2 is about the search half.'
		},
		{ command: 'history > session.txt', role: 'solution' },
		{ command: 'grep deploy.log session.txt > runbook.txt', role: 'solution' },
		{
			command: 'histroy > session.txt',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'histroy is not a command — but the shell set up the redirection before it went looking, so session.txt already exists and is empty, and the grep you run against it next will find nothing and tell you nothing about why. The typo cost you nothing; the > that ran ahead of it did.'
		},
		{ command: 'history | grep deploy.log', role: 'solution' },
		{
			command: "alias failcheck='grep FAILED deploy.log'",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-5-5',
			trap: 'The alias works — for exactly as long as this window is open. An alias typed at the prompt lives in the session and dies with it; the whole point of a cockpit is that it is still there tomorrow, which means the line has to live in the config file.'
		},
		{ command: 'cat ~/.bashrc', role: 'solution' },
		{
			command: 'echo "alias failcheck=\'grep FAILED deploy.log\'" > ~/.bashrc',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-1',
			trap: '> replaces, >> appends. The alias line is perfect and it is now the ONLY line in ~/.bashrc — your editor setting and your ll alias were overwritten by it. One extra character was the difference between adding to your config and replacing it.'
		},
		{
			command: 'echo "alias failcheck=\'grep FAILED deploy.log\'" > line.txt',
			role: 'solution'
		},
		{ command: 'cat line.txt >> ~/.bashrc', role: 'solution' },
		{
			command: 'echo "alias failcheck=\'grep FAILED deploy.log\'" >> ~/.bashrc',
			role: 'solution'
		},
		{
			command: 'rm deploy.log.1',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-3-3',
			trap: "Tidying was not the assignment. rm has no trash can, and the rotated log was the only record of last night's run — the one the person you are handing this to will ask about first."
		}
	],

	/**
	 * Three assertions, each about a different half of Part 12, plus a survival
	 * check. Strict where the lesson lives, tolerant where the sandbox is
	 * cosmetically ambiguous: the runbook's leading whitespace and numbering are
	 * stripped before comparison (history pads the number to width 5), and the
	 * alias line is matched by shape rather than by exact quoting.
	 *
	 * The runbook rule is the interesting one — every line must be a REAL entry
	 * of engine.historyLog. That is what makes "recalled from history" a fact
	 * about the artifact rather than a request, and it is deterministic and
	 * side-effect free: historyLog is already there, and nothing here writes.
	 */
	check: async (engine) => {
		// 1. The failure check ran against the right file, and only it.
		const failures = engine.readFile('~/site/failures.txt');
		if (!failures) return false;
		const failureLines = failures.split('\n').filter((l) => l.trim() !== '');
		if (failureLines.length !== FAILED_LINES.length) return false;
		for (let i = 0; i < FAILED_LINES.length; i++) {
			if (failureLines[i].trim() !== FAILED_LINES[i]) return false;
		}

		// 2. The runbook is your own history, filtered — not typed from memory.
		const runbook = engine.readFile('~/site/runbook.txt');
		if (!runbook) return false;
		const runbookLines = runbook.split('\n').filter((l) => l.trim() !== '');
		if (runbookLines.length === 0) return false;
		const ran = new Set(engine.historyLog.map((l) => l.trim()));
		let sawTheCheck = false;
		for (const line of runbookLines) {
			const match = /^\s*\d+\s+(.*)$/.exec(line);
			if (!match) return false;
			const command = match[1].trim();
			if (!ran.has(command)) return false;
			if (!command.includes('deploy.log')) return false;
			if (command.includes('FAILED')) sawTheCheck = true;
		}
		if (!sawTheCheck) return false;

		// 3. The alias outlives the window, and the config it joined survived.
		const bashrc = engine.readFile('~/.bashrc');
		if (!bashrc) return false;
		if (!bashrc.includes('export EDITOR=nano')) return false;
		if (!bashrc.includes("alias ll='ls -la'")) return false;
		const aliased = bashrc
			.split('\n')
			.some((l) => /^\s*alias\s+failcheck=/.test(l) && l.includes('grep FAILED deploy.log'));
		if (!aliased) return false;

		// 4. Both logs are still there for whoever picks this up.
		return (
			engine.readFile('~/site/deploy.log') === DEPLOY_LOG && engine.isFile('~/site/deploy.log.1')
		);
	},

	scoring: {
		great: {
			lines: [
				'grep FAILED deploy.log > failures.txt && echo "alias failcheck=\'grep FAILED deploy.log\'" >> ~/.bashrc',
				'history | grep deploy.log > runbook.txt'
			],
			note: 'Do the work in one line, then let history write the record of it in the next. The runbook costs one grep instead of one act of remembering — and it catches the line that made it, because that line is about deploy.log too.',
			expect: { enters: 2, elements: 4, cost: 6 }
		},
		greatAlternates: [
			{
				lines: [
					'grep FAILED deploy.log > failures.txt',
					'echo "alias failcheck=\'grep FAILED deploy.log\'" >> ~/.bashrc',
					'history | grep deploy.log > runbook.txt'
				],
				note: 'The same three moves without the chain. && saves an Enter, not work — so this is one point dearer and not one bit worse.',
				expect: { enters: 3, elements: 4, cost: 7 }
			},
			{
				lines: [
					'cat deploy.log | grep FAILED > failures.txt && echo "alias failcheck=\'grep FAILED deploy.log\'" >> ~/.bashrc',
					'history | grep deploy.log > runbook.txt'
				],
				note: 'The useless-cat route. Costs exactly one element more, which is the honest price of the habit.',
				expect: { enters: 2, elements: 5, cost: 7 }
			}
		],
		acceptable: {
			lines: [
				'grep FAILED deploy.log > failures.txt',
				'history > session.txt',
				'grep deploy.log session.txt > runbook.txt',
				'echo "alias failcheck=\'grep FAILED deploy.log\'" > line.txt',
				'cat line.txt >> ~/.bashrc'
			],
			note: 'One thought per line: park the history in a file and grep the file, write the config line to a scratch file and pour that into ~/.bashrc. Every step is correct and nothing here is a bad habit — it is just five Enters and two scratch files for something that needed two Enters and none.',
			expect: { enters: 5, elements: 5, cost: 10 }
		}
	}
};
