/**
 * Part 13 · Under the Hood — the challenge.
 *
 * DESTINATION: src/lib/playground/challenges/part-13.ts
 *
 * Part 13 introduces no new commands, so its challenge is a synthesis over
 * Parts 1..12 and its signature skill is judgement. The judgement it tests is
 * the one 13.2 states outright: an agent (or a human) reading a terminal
 * through OSC 133 markers "doesn't have to guess where your prompt ends and
 * the output begins, or grep the scrollback for the word 'error' — it knows
 * the exact command, the exact output, and the exact exit code".
 *
 * So the seed is a captured session whose prose lies in BOTH directions:
 *
 *  - three lines contain the word "error" and every one of them belongs to a
 *    command that exited 0 (a lint summary reading "0 errors", a test FILE
 *    named error-handling, a passing test case about a 500 response);
 *  - the two commands that actually failed say "Killed" and "rolled back to
 *    previous release" — neither contains the word error, or fail, or ERROR.
 *
 * Read the scrollback and you get three wrong answers. Read the `133;D;`
 * markers and you get two right ones. That is the whole lesson, and the pool
 * puts the wrong route on a chip so it can be learned by consequence.
 *
 * The transcript writes its control characters in caret notation — `^[` for
 * Escape, `^G` for the BEL that terminates an OSC — which is exactly the
 * convention 13.1 teaches ("a caret is how a terminal writes a control
 * character on paper"). It also sets up the sharpest distractor in the pool:
 * typing the caret you see straight into a regex, where `^` means start-of-line
 * and `[]` is an empty character class, so the pattern matches nothing at all.
 */

import type { Challenge } from '../challenges';

/**
 * Last night's unattended deploy, as the terminal captured it: six command
 * blocks, each fenced by the shell-integration markers from 13.2 — 133;A at
 * the prompt, 133;C where output begins, 133;D;N carrying the exit code.
 * Two blocks failed (137 and 1) and neither says so in words.
 */
const DEPLOY_LOG = [
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm ci',
	'^[]133;C^G',
	'added 214 packages in 6s',
	'^[]133;D;0^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm run lint',
	'^[]133;C^G',
	'checked 118 files',
	'0 errors, 3 warnings',
	'^[]133;D;0^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm test',
	'^[]133;C^G',
	'PASS  src/parse.test.ts',
	'PASS  src/error-handling.test.ts',
	'  ok  returns 500 on upstream error',
	'12 passing',
	'^[]133;D;0^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm run build',
	'^[]133;C^G',
	'transforming modules ...',
	'Killed',
	'^[]133;D;137^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ ./scripts/deploy.sh staging',
	'^[]133;C^G',
	'uploading bundle ...',
	'rolled back to previous release',
	'^[]133;D;1^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ curl -s -o health.json https://api.vibecloud.dev/health',
	'^[]133;C^G',
	'^[]133;D;0^G',
	''
].join('\n');

/**
 * Last week's capture, kept for comparison. Three failures, all different —
 * so aiming at the wrong file, or globbing across both, is visibly wrong
 * rather than subtly wrong.
 */
const DEPLOY_LOG_1 = [
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm ci',
	'^[]133;C^G',
	'added 214 packages in 5s',
	'^[]133;D;0^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm test',
	'^[]133;C^G',
	'2 failing',
	'^[]133;D;1^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ npm run build',
	'^[]133;C^G',
	'out of memory',
	'^[]133;D;137^G',
	'^[]133;A^G',
	'vibe@sandbox ~/app $ ./scripts/deploy.sh staging',
	'^[]133;C^G',
	'refused: build artifact missing',
	'^[]133;D;2^G',
	''
].join('\n');

/** The two end-of-command markers that did not carry a zero. */
const FAILED_MARKERS = ['^[]133;D;137^G', '^[]133;D;1^G'];

export const challengePart13: Challenge = {
	id: 'ch-13-exit-codes',
	partId: 'part-13',
	part: 13,
	title: 'The transcript knows what the output will not tell you',

	description:
		"You left a deploy running overnight and the terminal saved everything to ~/session/deploy.log. Your shell integration fenced every command block with the markers from this part: one where the prompt starts, one where output begins, and one at the end carrying that command's exit code. Something failed, and the human-readable output is no help — it says the reassuring thing where it went wrong and the alarming thing where it went fine. Produce verdict.txt in ~/session: the end-of-command marker line of every command that did not exit zero, in the order they ran, and then — as the last line, on its own — how many there were. Only deploy.log; deploy.log.1 is last week's run, and deploy.log itself must survive untouched.",

	goal: 'verdict.txt holds the two non-zero end-of-command markers and ends with the count',

	seed: {
		cwd: '~/session',
		files: {
			'~/session/deploy.log': DEPLOY_LOG,
			'~/session/deploy.log.1': DEPLOY_LOG_1
		}
	},

	/**
	 * Sixteen entries for a two-line job. The five lines of the beginner's
	 * staged route are all here and clickable in order, so a learner who only
	 * clicks chips finishes — that is the non-negotiable rule, and it is met
	 * with grep and grep -v alone, no character class required.
	 *
	 * The great lines are NOT on chips. They cannot be: every pattern in this
	 * challenge contains a semicolon, because that is how an OSC marker is
	 * punctuated, and the conformance suite treats a semicolon in a great line
	 * as a pre-assembled multi-step answer. That constraint turned out to suit
	 * the challenge: the ingredients are all visible — `133;D;` on a solution
	 * chip, `[1-9]` and `grep -c` on distractor chips, one of which hands you
	 * the great second line with the wrong redirect on it — but assembling
	 * them is the expert's work, which is exactly where the split belongs.
	 *
	 * Distractors are interleaved in authored order, and the two that matter
	 * most — grepping the scrollback for "error", and typing the caret you can
	 * see straight into a regex — are mistakes 13.2 and 13.1 name outright.
	 */
	pool: [
		{ command: 'cat deploy.log', role: 'solution' },
		{
			command: "grep 'error' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-13-2',
			trap: 'This is the exact habit 13.2 says the markers abolish: grepping the scrollback for the word "error". It filed three lines — a lint summary reading "0 errors", a test filename, and a passing test about a 500 response — and all three belong to commands that exited 0. The two that actually failed said "Killed" and "rolled back", and it missed both.'
		},
		{ command: "grep '133;D;' deploy.log", role: 'solution' },
		{
			command: "grep '^[]133;D;[1-9]' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-13-1',
			trap: 'You typed what the transcript shows you. But the caret in ^[ is how a terminal PRINTS the Escape character on paper — it is not part of the bytes you are matching. In a pattern, ^ anchors to the start of the line and [] is an empty set that matches nothing, so this matched not one line, and > had already emptied verdict.txt. Match the part of the marker that really is ordinary text: 133;D;.'
		},
		{ command: "grep '133;D;' deploy.log > codes.txt", role: 'solution' },
		{
			command: "grep 'Killed' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-13-1',
			trap: 'You found the one the kernel killed — 137 is how a shell reports SIGKILL — but you filed its output line instead of its exit-code marker, and you never saw deploy.sh, which failed quietly with 1. Reading the words is guessing; reading the exit code is knowing.'
		},
		{ command: "grep -v '133;D;0' codes.txt > failures.txt", role: 'solution' },
		{
			command: "grep -c '133;D;' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-4-3',
			trap: 'That is 6 — every command block in the capture, because every block ends with a 133;D marker whether it succeeded or not. It exits 0 and writes a plausible number, which is what makes it worth catching: you counted the commands, not the failures.'
		},
		{ command: 'cat failures.txt > verdict.txt', role: 'solution' },
		{
			command: "grep '133;D;[1-9]' deploy.log.1 > verdict.txt",
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-4-3',
			trap: "Right idea, wrong capture: deploy.log.1 is last week's run. You just filed three failures that were fixed days ago and said nothing at all about last night."
		},
		{ command: "grep -v '133;D;0' codes.txt | wc -l > count.txt", role: 'solution' },
		{
			command: "grep '133;D;[1-9]' deploy.log* > verdict.txt",
			role: 'distractor',
			kind: 'overreach',
			teaches: 'section-3-4',
			trap: 'deploy.log* matches deploy.log AND deploy.log.1, so grep searched both — and once it has two files it prefixes every line with the filename. Five markers from two different nights, every one of them mislabelled.'
		},
		{ command: 'cat count.txt >> verdict.txt', role: 'solution' },
		{
			command: "gerp '133;D;[1-9]' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'gerp is not a command — but the shell set up the redirection before it went looking for the command, so verdict.txt had already been created and emptied by the time you saw the error.'
		},
		{
			command: "grep -c '133;D;[1-9]' deploy.log > verdict.txt",
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-4-1',
			trap: '> replaces, >> appends. The count is right and the way you wrote it is wrong: it wiped the two marker lines you had just saved and left verdict.txt holding the number 2 and nothing else.'
		},
		{
			command: 'rm deploy.log.1',
			role: 'distractor',
			kind: 'destructive',
			teaches: 'section-3-3',
			trap: "Tidying up was not the assignment. rm has no trash can, and last week's capture was the only record of how this deploy behaved before last night."
		}
	],

	/**
	 * Strict about the thing Part 13 teaches — the two marker lines, in the
	 * order they ran, taken from last night's capture — and tolerant of the
	 * one place the sandbox is cosmetically ambiguous: `grep -c` prints "2"
	 * while `wc -l` pads to "      2", so the count is compared trimmed.
	 */
	check: async (engine) => {
		const verdict = engine.readFile('~/session/verdict.txt');
		if (!verdict) return false;

		const lines = verdict.split('\n').filter((l) => l.trim() !== '');
		if (lines.length !== 3) return false;

		for (let i = 0; i < 2; i++) {
			if (lines[i].trim() !== FAILED_MARKERS[i]) return false;
		}
		if (lines[2].trim() !== '2') return false;

		// The capture survived, and last week's evidence was not "tidied".
		const source = engine.readFile('~/session/deploy.log');
		return source === DEPLOY_LOG && engine.isFile('~/session/deploy.log.1');
	},

	scoring: {
		great: {
			lines: [
				"grep '133;D;[1-9]' deploy.log > verdict.txt",
				"grep -c '133;D;[1-9]' deploy.log >> verdict.txt"
			],
			note: 'Ask the structured part of the stream, not the prose. One character class over the exit-code marker answers both halves of the question, and > then >> keeps them in one file.',
			expect: { enters: 2, elements: 2, cost: 4 }
		},
		greatAlternates: [
			{
				lines: [
					"grep '133;D;[1-9]' deploy.log > verdict.txt",
					"grep '133;D;[1-9]' deploy.log | wc -l >> verdict.txt"
				],
				note: 'Same reading of the transcript, counting with a pipe instead of a flag. One element dearer than grep -c, and not one bit worse an answer.',
				expect: { enters: 2, elements: 3, cost: 5 }
			},
			{
				lines: [
					"grep '133;D;' deploy.log | grep -v '133;D;0' > verdict.txt",
					"grep -c '133;D;[1-9]' deploy.log >> verdict.txt"
				],
				note: 'Every end-of-command marker, minus the ones that carried a zero. Two greps in a pipe instead of one character class — the same idea reached from the other side, for one extra element.',
				expect: { enters: 2, elements: 3, cost: 5 }
			}
		],
		acceptable: {
			lines: [
				"grep '133;D;' deploy.log > codes.txt",
				"grep -v '133;D;0' codes.txt > failures.txt",
				'cat failures.txt > verdict.txt',
				"grep -v '133;D;0' codes.txt | wc -l > count.txt",
				'cat count.txt >> verdict.txt'
			],
			note: 'One thought per line, staged through two scratch files. Nothing here is wrong — it reads the markers rather than the prose, which is the lesson — it just pays five Enters and two files for something that needed two Enters and none.',
			expect: { enters: 5, elements: 6, cost: 11 }
		}
	}
};
