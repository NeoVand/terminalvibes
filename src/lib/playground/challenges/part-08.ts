/**
 * Part 8 · Processes & Ports — "Clean up after the agent".
 *
 * DESTINATION: src/lib/playground/challenges/part-08.ts
 *
 * The design, and why it is shaped this way:
 *
 *  - Part 8's whole part is one three-beat move: find the process, get its
 *    number, act on that number. Beats one and two are `ps aux` and
 *    `lsof -i :3000`, which are FREE under the scoring model — so the score
 *    measures only beat three. That is the right thing to measure here: the
 *    course never charges you for looking, and Part 8 is the part where
 *    looking first is the entire discipline.
 *  - The signature economy lever (spec §4.2) is "several PIDs in one kill".
 *    `kill` takes operands the same way `mkdir src tests docs` (Part 2) and
 *    `mv a b c dest/` (Part 3) do — nobody in Part 8 says so out loud, and
 *    noticing it is exactly the "now take it to the next level" moment.
 *    Three targets is the smallest number that makes it worth noticing.
 *  - One of the three ignores SIGTERM, so the escalation of 8.2 is forced —
 *    but only for the one that actually refused.
 *  - THE HOLE THIS CHALLENGE HAD TO CLOSE: `kill -9 400 437 474` clears the
 *    board in one element and would otherwise outscore every honest route,
 *    teaching precisely the reflex the 8.2 Callout calls a red flag. So the
 *    check asserts two things about *how* it was done, in the shape §4.3
 *    blesses for Part 11: no SIGKILL at a process that never refused, and the
 *    stubborn one was asked politely at least once before the axe came out.
 *    Everything else in the check is plain goal state.
 */

import type { Challenge } from '../challenges';
import { splitSegments } from '../challenge-parsing';

/**
 * The seed roster, hoisted so the pids below are DERIVED from it rather than
 * typed twice. The goal half of the check matches processes by name and the
 * behavioural half has to match them by number — if those two halves are
 * allowed to drift apart, a one-line seed reorder silently makes the polite
 * -kill assertion unsatisfiable and the challenge unwinnable with no error.
 */
const SEED_PROCESSES = [
	{ command: 'node server.js', cpu: 0.4, mem: 1.8, start: '02:14', port: 3000 },
	{ command: 'vite --port 5173', cpu: 1.1, mem: 2.6, start: '02:16', port: 5173 },
	{ command: 'node scrape.js --loop', cpu: 98.6, mem: 0.7, start: '02:19', ignoresTerm: true },
	{ command: 'code --watch src/', cpu: 0.3, mem: 1.2, start: '09:41' }
];

/** The engine assigns pids from 400 in steps of 37, in seed order. */
const pidOf = (name: string): string =>
	String(400 + 37 * SEED_PROCESSES.findIndex((p) => p.command.includes(name)));

/**
 * What the agent left behind, in its own words. This is what makes the three
 * targets identifiable by NAME (from the log) while their NUMBERS still have
 * to come from `ps aux` / `lsof` — the three-beat move, split across two
 * sources on purpose. The 09:41 editor watcher is deliberately absent: it is
 * not the agent's, and the START column says so.
 */
const SESSION_LOG = [
	'02:11  session started  (task: "wire up the preview server")',
	'02:14  started   node server.js          -> port 3000',
	'02:16  started   vite --port 5173        -> port 5173',
	'02:19  started   node scrape.js --loop   (no port)',
	'02:31  session ended',
	'02:31  note: 3 processes still running, not stopped',
	''
].join('\n');

/** The agent's leavings, matched by name so the check survives any pid drift. */
const AGENT_PROCESSES = ['server.js', 'vite', 'scrape.js'];

/** 400 and 437: they never refuse, so they never have grounds to be axed. */
const POLITE_PIDS = [pidOf('server.js'), pidOf('vite')];
/** 474: the one that catches SIGTERM, and the only legitimate target for -9. */
const STUBBORN_PID = pidOf('scrape.js');

/** `-9`, `-KILL`, `-SIGKILL` — every spelling cmdKill's SIGNALS table accepts. */
const SIGKILL_FLAG = /^-(9|kill|sigkill)$/i;

/**
 * Every `kill` invocation in the history, in the order it was issued, split out
 * of pipelines and chains. Pure string work over engine.historyLog — no engine
 * state is touched, so the check stays cheap and side-effect free even though it
 * looks at behaviour.
 *
 * Splitting is delegated to the shared `splitSegments` rather than a local
 * regex, and that is load-bearing, not tidiness: a naive split on /[|;]/ reads
 * the inside of quotes and comments as shell syntax, so `ls  # ; kill 474`
 * scores as a polite kill. It costs nothing (both `ls` and the comment are
 * free), which made it the cheapest possible run and a total defeat of the
 * audit below. splitSegments respects quotes and stops at an unquoted `#`.
 *
 * Order is preserved across the flattened list — the chained one-liner
 * `kill 400 437 474 && kill -9 474` is two calls in the right sequence, so the
 * "asked before insisted" test works within a line as well as between lines.
 */
function killCalls(history: readonly string[]): { nine: boolean; targets: string[] }[] {
	const calls: { nine: boolean; targets: string[] }[] = [];
	for (const raw of history) {
		for (const segment of splitSegments(raw)) {
			const tokens = segment.split(/\s+/).filter(Boolean);
			if (tokens[0] !== 'kill') continue;
			calls.push({
				nine: tokens.some((t) => SIGKILL_FLAG.test(t)),
				targets: tokens.slice(1).filter((t) => !t.startsWith('-'))
			});
		}
	}
	return calls;
}

export const challengePart8: Challenge = {
	id: 'ch-8-agent-cleanup',
	partId: 'part-8',
	part: 8,
	title: 'Clean up after the agent',

	description:
		"Your agent worked overnight and left the lights on. agent-session.log names the three programs it started and never stopped — one of them is pinning a CPU core, another is squatting on the port you need this morning. Clear out all three, then get your own dev server listening on port 3000. Two things this must not cost you: the editor watcher you started at 09:41 is yours, not the agent's, and it has to still be running when you are done — and nothing here gets the axe before it has been asked to leave.",

	goal: "the agent's three processes are gone, your editor watcher survived, and your own server holds port 3000",

	seed: {
		cwd: '~',
		files: {
			'~/agent-session.log': SESSION_LOG
		},
		/**
		 * Seed order fixes the pids: 400, 437, 474, 511 (the engine steps by 37).
		 * scrape.js is the runaway AND the one that catches SIGTERM, so the CPU
		 * column and the escalation point at the same row.
		 */
		processes: [
			{ command: 'node server.js', cpu: 0.4, mem: 1.8, start: '02:14', port: 3000 },
			{ command: 'vite --port 5173', cpu: 1.1, mem: 2.6, start: '02:16', port: 5173 },
			{
				command: 'node scrape.js --loop',
				cpu: 98.6,
				mem: 0.7,
				start: '02:19',
				ignoresTerm: true
			},
			{ command: 'code --watch src/', cpu: 0.3, mem: 1.2, start: '09:41' }
		]
	},

	/**
	 * 14 entries for a job that needs two lines. The five chips of the
	 * ACCEPTABLE path are all here (kill 400 / kill 437 / kill 474 / kill -9 474
	 * / serve), so a beginner who only clicks can finish. What is NOT here is
	 * any line that puts more than one pid after `kill` — that composition is
	 * the expert's work, and it is the only thing separating cost 10 from
	 * cost 5.
	 */
	pool: [
		{ command: 'ps aux', role: 'solution' },
		{
			command: 'ps -aux',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-8-1',
			trap: 'ps takes its options in an older style that predates the dash convention — it is ps aux, not ps -aux. The playground rejects it outright; a real machine would quietly read it as something else and hand you a different list.'
		},
		{ command: 'lsof -i :3000', role: 'solution' },
		{
			command: 'kill 3000',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-8-3',
			trap: 'No such process: 3000 is the door number, not the number of whoever is standing in it. lsof prints both on the same line — the port under NAME, and the PID you actually need in the second column.'
		},
		{ command: 'kill 400', role: 'solution' },
		{
			command: 'kill %1',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-8-4',
			trap: 'No such job. %1 addresses a background job of THIS shell, and you have none — the agent started these from a session you never saw, so the only handle you have on them is the machine-wide PID.'
		},
		{ command: 'kill 437', role: 'solution' },
		{
			command: 'kill -9 400',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-8-2',
			trap: 'It worked, and that is the problem: 400 would have shut down cleanly if you had asked. SIGKILL cannot be caught, so nothing was saved and no lock file was cleaned up. Ask first, escalate only when refused — an axe swung before the question does not count as a solved problem here.'
		},
		{ command: 'kill 474', role: 'solution' },
		{
			command: 'curl localhost:3000',
			role: 'distractor',
			kind: 'forward-reference',
			teaches: 'section-9-1',
			trap: 'This does prove someone is home on 3000 — but curl is Part 9, and it answers "is anything listening", never "which process, and what is its number". lsof -i :3000 already had the one field you need.'
		},
		{ command: 'kill -9 474', role: 'solution' },
		{
			command: 'kill 511',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-8-1',
			trap: "That is your editor's file watcher, started at 09:41 — the START column is exactly how you tell this morning's processes from last night's. Killing a process has no trash can either: whatever it had not written out is gone."
		},
		{ command: 'serve', role: 'solution' },
		{
			command: 'serve 3001',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-8-3',
			trap: 'Exits 0 and your server really is up — on the wrong door. The agent\'s server still holds 3000, the runaway is still burning a core, and you have added a fourth process to the mess. Moving to another port is a legitimate answer to "EADDRINUSE", just not to this brief.'
		}
	],

	/**
	 * Goal state first, then the two behavioural assertions that stop
	 * `kill -9 400 437 474` from being the cheapest correct answer. Matched by
	 * command NAME rather than pid so any route that reaches the same state
	 * passes, and the SIGKILL audit accepts -9, -KILL and -SIGKILL alike.
	 */
	check: async (engine) => {
		for (const name of AGENT_PROCESSES) {
			if (engine.processes.some((p) => p.command.includes(name))) return false;
		}

		// Your editor watcher is still there.
		if (!engine.processes.some((p) => p.command.startsWith('code'))) return false;

		// Your own server — not the agent's — holds port 3000.
		const holder = engine.findByPort(3000);
		if (!holder || !holder.command.startsWith('serve')) return false;

		const calls = killCalls(engine.historyLog);

		// 8.2: no axe for a process that never refused.
		if (calls.some((c) => c.nine && c.targets.some((t) => POLITE_PIDS.includes(t)))) return false;

		// 8.2: the stubborn one was asked BEFORE it was insisted on. The ordering
		// is the whole assertion, not decoration — a membership test alone lets a
		// learner axe 474 unasked and then type a `kill 474` at the corpse, which
		// fails with "No such process" but still lands in the history and buys
		// absolution after the fact. That route reached GREAT.
		const asked = calls.findIndex((c) => !c.nine && c.targets.includes(STUBBORN_PID));
		const axed = calls.findIndex((c) => c.nine && c.targets.includes(STUBBORN_PID));
		if (asked === -1) return false;
		if (axed !== -1 && axed < asked) return false;

		return true;
	},

	scoring: {
		great: {
			lines: ['kill 400 437 474', 'kill -9 474 && serve'],
			note: 'One kill, three operands — the same habit as mkdir src tests docs, applied to processes. The sweep also discovers which one refuses, so the escalation is aimed at exactly one pid.',
			expect: { enters: 2, elements: 3, cost: 5 }
		},
		greatAlternates: [
			{
				lines: ['kill 400 437 474 && kill -9 474 && serve'],
				note: 'The whole ritual on one line. kill exits 0 even when a target ignores SIGTERM, so && carries through — and the floor of this challenge is cost 4.',
				expect: { enters: 1, elements: 3, cost: 4 }
			},
			{
				lines: ['kill 400 437 474', 'kill -9 474', 'serve'],
				note: 'The multi-pid sweep without the chaining. && saves Enters, not work, so this is the same answer priced one Enter at a time — listed here so nobody is punished for keeping the three beats visible.',
				expect: { enters: 3, elements: 3, cost: 6 }
			}
		],
		acceptable: {
			lines: ['kill 400', 'kill 437', 'kill 474', 'kill -9 474', 'serve'],
			note: 'One process per line, exactly as ps aux listed them. Nothing here is wrong — it is the honest three-beat move done five times, and it costs ten where the same result costs five.',
			expect: { enters: 5, elements: 5, cost: 10 }
		}
	}
};
