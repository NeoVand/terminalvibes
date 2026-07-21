/**
 * Part 1 · First Contact — the challenge.
 *
 * DESTINATION: src/lib/playground/challenges/part-01.ts
 *
 * Part 1 is the hardest Part to build a challenge for, because nothing it
 * teaches changes the filesystem. Its vocabulary is `whoami pwd date echo clear
 * cal ls man man -k help --help` — no `cd`, no `mkdir`, no `>`, no `|`, no `&&`.
 * So there is no artifact to check; like `first-steps` and `audit-the-agent`,
 * the goal state lives in `engine.historyLog`.
 *
 * What makes it a challenge rather than a checklist is the scoring, which is
 * built directly on §4.2's Part 1 lever — *look it up once instead of guessing
 * three times; economy here is not running the failed guesses*:
 *
 *   `notFree: ['ls']`, and `man` / `man -k` / `help` stay free.
 *
 * Reading the manual costs you nothing. Running the command costs you every
 * time, and a wrong run costs exactly as much as a right one. That is the whole
 * of 1.3 expressed as a number: there is no excuse not to look it up first.
 *
 * The goal needs three facets of one directory — the hidden entries, the long
 * view, and sizes in K/M/G. A beginner gets each with its own run (four Enters,
 * four chips, all present in the pool). Section 1.3's "single letters cluster"
 * collapses all three into one Enter — and that clustered line is deliberately
 * NOT in the pool, so composing it is the expert's work.
 */

import type { Challenge } from '../challenges';

/** Big enough that -l prints 5 digits and -h prints "27K" — so -h visibly earns its letter. */
const COVERS = '{"issue":7,"cover":"neon-city.png","w":1400,"h":2100,"bytes":184320}\n'.repeat(400);

const MAIN_PY = [
	'import json',
	'from pathlib import Path',
	'',
	'COVERS = Path("covers.jsonl")',
	'',
	'def load():',
	'    with COVERS.open() as fh:',
	'        return [json.loads(line) for line in fh]',
	'',
	'if __name__ == "__main__":',
	'    print(f"{len(load())} covers ready")',
	''
].join('\n');

/** The flag letters this sandbox's ls actually accepts (shell-commands.ts: flagSplit(args, 'laFRht', 'ls')). */
const LS_FLAGS = 'laFRht';

/** The three facets the brief asks for. */
const REQUIRED = ['a', 'l', 'h'] as const;

export const challengePart1: Challenge = {
	id: 'ch-1-read-the-flags',
	partId: 'part-1',
	part: 1,
	title: 'Read before you run',

	description:
		"Your coding assistant has offered to 'tidy up' this project folder and pasted a one-liner at you. You cannot read it — you do not know what its flags mean — and Part 1's habit is to find that out before you press Enter, not after. So start with the folder itself. Open the built-in manual for the tool that lists a directory, and use what it teaches you to see all three things a plain listing will not show you: the entries it hides, the full details of every entry (permissions, owner, size, date), and those sizes written for a human — K and M, not raw bytes. This directory, not one inside it. Every wrong guess is an Enter you did not have to press; the manual is free.",

	goal: 'You looked it up first, then saw this folder in full: hidden entries, long details, human sizes',

	seed: {
		cwd: '~/projects/zine-bot',
		files: {
			'~/projects/zine-bot/README.md':
				'# zine-bot\n\nAssembles a weekend zine from the covers in uploads/.\nRun: python main.py\n',
			'~/projects/zine-bot/main.py': MAIN_PY,
			'~/projects/zine-bot/requirements.txt': 'pillow==10.4.0\nrequests==2.32.3\n',
			'~/projects/zine-bot/covers.jsonl': COVERS,
			// The two entries a plain listing hides — and the reason -a is not optional here.
			'~/projects/zine-bot/.env': 'ZINE_API_KEY=sk-vibe-4b1e77a0\nSMTP_PASSWORD=hunter2\n',
			'~/projects/zine-bot/.gitignore': '.env\nuploads/\n__pycache__/\n',
			// What the assistant's one-liner was aimed at. Not yours to delete.
			'~/projects/zine-bot/uploads/neon-city.png': '<png data>\n',
			'~/projects/zine-bot/uploads/paper-moon.png': '<png data>\n'
		}
	},

	/**
	 * Overcomplete: 14 entries for a job that needs 2. Every chip a beginner
	 * needs to finish is here — `ls`, `ls -a`, `ls -l`, `ls -h`, `man ls` — but
	 * the clustered `ls -lah` is not, because clustering is what 1.3 asks you to
	 * learn and clicking it would hand it over. The distractors are the four
	 * mistakes 1.3 spends its prose warning about (a missing dash, a capital, two
	 * spellings of one flag, an argument where a flag was meant), 1.2's
	 * command-not-found, and the assistant's own line.
	 */
	pool: [
		{ command: 'ls', role: 'solution' },
		{
			command: 'ls a',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-1-3',
			trap: "The dash is not decoration. Without it, `a` stopped being a request to behave differently and became the thing to act on — so ls went looking for a file called 'a' and told you it could not find one."
		},
		{ command: 'man ls', role: 'solution' },
		{
			command: 'sl -lah',
			role: 'distractor',
			kind: 'typo',
			teaches: 'section-1-2',
			trap: 'bash: sl: command not found — read it back in three parts: bash is who is complaining, sl is the word it choked on, command not found is the complaint. Two letters transposed, nothing broken, and you paid an Enter for it.'
		},
		{ command: 'ls -a', role: 'solution' },
		{
			command: 'ls -A',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-1-3',
			trap: '-a and -A are two different requests: capitals are separate flags, and this ls has never heard of -A. It refused the whole line, so you did not even get the listing you would have got from plain ls.'
		},
		{ command: 'ls -l', role: 'solution' },
		{
			command: 'ls -a --all',
			role: 'distractor',
			kind: 'misconception',
			teaches: 'section-1-3',
			trap: 'When a manual prints "-a, --all", the comma means one flag with two names — use either, never both. Here it means neither: this ls only speaks the short spelling, and it rejected the line rather than guessing what you meant.'
		},
		{ command: 'ls -h', role: 'solution' },
		{
			command: 'man -k hidden',
			role: 'distractor',
			kind: 'works-but-wrong',
			teaches: 'section-1-3',
			trap: "It ran, it looked like homework, and it told you nothing. -k searches every page's one-line description and never reads the page itself — so it cannot find a flag, only a command. A thin -k result means your keyword did not match anyone's phrasing, not that no such thing exists."
		},
		{ command: 'ls --help', role: 'solution' },
		{
			command: 'ls -lah uploads',
			role: 'distractor',
			kind: 'wrong-target',
			teaches: 'section-1-3',
			trap: 'Exactly the right flags, pointed one folder too deep. Everything after the program that does not start with a dash is an argument — the thing to act on — so you described uploads/ and never looked at the folder you were asked about.'
		},
		{ command: 'man -k list', role: 'solution' },
		{
			command: 'rm -rf uploads',
			role: 'distractor',
			kind: 'forward-reference',
			teaches: 'section-3-3',
			trap: "This is the assistant's line, run without reading it. It worked. rm is Part 3, where you learn it has no trash can — and -rf meant 'recursively, and do not ask'. The zine covers are gone, and you still do not know what the flags did."
		}
	],

	/**
	 * History-based, because Part 1 changes nothing on disk. Two conditions,
	 * both drawn straight from 1.3: you consulted the documentation, and the ls
	 * runs you made between them cover all three facets the brief asked for.
	 *
	 * Flag letters are only counted from a line this sandbox would actually
	 * accept — a line carrying an unsupported letter, a long option, or an
	 * operand other than `.` errored out or described somewhere else, and an
	 * error teaches you nothing about this folder. That is what makes `ls -A`,
	 * `ls -a --all` and `ls -lah uploads` genuinely wrong rather than merely
	 * clumsy.
	 */
	check: async (engine) => {
		const history = engine.historyLog.map((line) => line.trim()).filter(Boolean);

		const consulted = history.some(
			(line) =>
				/^man\s+(\d+\s+)?ls$/.test(line) ||
				(/^ls(\s|$)/.test(line) && /(^|\s)--help(\s|$)/.test(line))
		);
		if (!consulted) return false;

		const seen = new Set<string>();
		for (const line of history) {
			const tokens = line.split(/\s+/).filter(Boolean);
			if (tokens[0] !== 'ls') continue;
			const letters: string[] = [];
			let usable = true;
			for (const token of tokens.slice(1)) {
				if (token === '.') continue; // this directory, spelled out
				if (!token.startsWith('-') || token.length < 2 || token.startsWith('--')) {
					usable = false; // an operand, or a long option this ls rejects
					break;
				}
				for (const ch of token.slice(1)) {
					if (!LS_FLAGS.includes(ch)) {
						usable = false; // the sandbox threw "invalid option"; nothing was listed
						break;
					}
					letters.push(ch);
				}
				if (!usable) break;
			}
			if (usable) for (const ch of letters) seen.add(ch);
		}

		return REQUIRED.every((flag) => seen.has(flag));
	},

	scoring: {
		great: {
			lines: ['man ls', 'ls -lah'],
			note: 'Read the page once — free — and the three requests collapse into one Enter, because single letters cluster (1.3). One lookup, one command, nothing guessed.',
			expect: { enters: 1, elements: 1, cost: 2 }
		},
		greatAlternates: [
			{
				lines: ['man ls', 'ls -a -l -h'],
				note: 'The same line before clustering. It costs exactly the same, which is the honest price: clustering saves keystrokes, not Enters.',
				expect: { enters: 1, elements: 1, cost: 2 }
			},
			{
				lines: ['ls --help', 'ls -lah'],
				note: 'The other door into the documentation. It costs an Enter that `man ls` does not, because --help is ls running itself — and on a Mac this is the route that answers with an error instead. Listed here so it is never the wrong answer.',
				expect: { enters: 2, elements: 2, cost: 4 }
			}
		],
		acceptable: {
			lines: ['man ls', 'ls', 'ls -a', 'ls -l', 'ls -h'],
			note: 'One flag at a time — see what is here, then what is hidden, then the details, then the sizes. Nothing here is wrong; it is four Enters for something one Enter covers, and `ls -h` on its own quietly shows you nothing, because -h has no sizes to reformat until -l is there too.',
			expect: { enters: 4, elements: 4, cost: 8 }
		}
	},

	/**
	 * The whole scoring model of this challenge. `man`, `man -k` and `help` stay
	 * free — looking it up must never cost — while every `ls` run is charged,
	 * including the failed guesses. That is §4.2's Part 1 lever stated as a
	 * price list.
	 */
	notFree: ['ls']
};
