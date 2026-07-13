/**
 * The deterministic mock backend: a scripted guide that answers by quoting
 * the course itself. No model, no weights, no network — retrieval picks the
 * sections, fixed templates compose the reply, and every claim carries a
 * `[[section-x-y]]` citation the panel renders as a link chip.
 *
 * The real transformers.js local backend lands next phase behind the same
 * `AgentBackend` interface; nothing above this file will change.
 */
import type { AgentBackend, ChatMessage, GenerateOptions, ToolCall } from './types';
import { retrieve, type RetrievalHit } from './retrieval';

/** Below this score the mock refuses to bluff and says so. */
const CONFIDENT_SCORE = 3;

interface ToolPlan {
	/** The proposal matches when every keyword appears in the goal. */
	keywords: string[];
	cmds: string[];
	summary: string;
}

/** Tiny goal → script table for the tool loop (Phase 1 placeholder). */
const TOOL_PLANS: ToolPlan[] = [
	{
		keywords: ['backup'],
		cmds: ['mkdir -p backups', 'cp -r notes/ backups/'],
		summary: 'Created backups/ and copied notes/ into it.'
	},
	{
		keywords: ['clean', 'log'],
		cmds: ['ls *.log', 'rm -i *.log'],
		summary: 'Listed the log files, then removed them interactively.'
	},
	{
		keywords: ['workspace'],
		cmds: ['mkdir -p projects/demo', 'cd projects/demo', 'touch README.md'],
		summary: 'Set up projects/demo with a fresh README.md.'
	}
];

function sleep(ms: number): Promise<void> {
	return new Promise((resolve) => setTimeout(resolve, ms));
}

function lastUserMessage(messages: ChatMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') return messages[i].content;
	}
	return '';
}

/** Tool results appended since the last user message = completed steps. */
function completedSteps(messages: ChatMessage[]): number {
	let count = 0;
	for (let i = messages.length - 1; i >= 0; i--) {
		if (messages[i].role === 'user') break;
		if (messages[i].role === 'tool') count++;
	}
	return count;
}

/**
 * Curated lessons for the sections learners actually ask about: each one
 * answers the QUESTION first — concrete explanation, runnable example,
 * gotcha — instead of pointing at where the answer lives. Distilled from the
 * course sections they cite.
 */
interface Lesson {
	explain: string;
	example?: string;
	gotcha?: string;
}

const SECTION_LESSONS: Record<string, Lesson> = {
	'section-4-2': {
		explain:
			'A pipe (`|`) connects two commands: whatever the first command prints becomes the input of the second. Each tool does one small job, and the pipe hands the data along — no temporary files, no copy-paste. Chain as many stages as you like and read the line left to right, one stage at a time.',
		example: 'cat server.log | grep ERROR | wc -l',
		gotcha:
			'That line reads "print the log, keep only the ERROR lines, count them". Reading pipelines stage by stage is also exactly how you audit one an AI proposes.'
	},
	'section-4-4': {
		explain:
			'`sort` puts identical lines next to each other, and `uniq -c` collapses each run of duplicates into one line with a count. Together they turn any list into a frequency table — `uniq` only works on adjacent duplicates, which is why the `sort` comes first.',
		example: 'sort names.txt | uniq -c | sort -rn',
		gotcha: 'The final `sort -rn` orders the table biggest-first — instant "top offenders" list.'
	},
	'section-5-2': {
		explain:
			'`chmod` changes who may read (r=4), write (w=2), and execute (x=1) a file. Each digit of `755` is one audience — owner, group, everyone else — and is just those numbers added up: 7 = rwx for you, 5 = r-x for the other two. The everyday case is simpler: `chmod +x` flips the execute bit so a script can run.',
		example: 'chmod +x deploy.sh\n./deploy.sh',
		gotcha:
			'Files are never executable by default — "Permission denied" on a fresh script almost always means it just needs its x bit.'
	},
	'section-3-3': {
		explain:
			'`rm` deletes files, and the terminal has no trash can: there is no undo. Plain `rm file` is fine once you are sure; `rm -i` asks before each deletion, and `rm -r` is needed for directories. The dangerous shape is `rm -rf` with a glob or a variable — it deletes recursively, without asking, whatever the pattern expands to.',
		example: 'rm -i old-notes.txt',
		gotcha:
			'Before any destructive glob, preview it: `echo *.tmp` shows exactly what would be deleted — make that a reflex.'
	},
	'section-6-1': {
		explain:
			'Read a command before you run it — especially one an AI wrote. Identify the verb (what command is it?), the flags (do any of them force or recurse?), and the target (what paths does it touch?). If any part is unfamiliar, look it up or preview it with a harmless variant first.',
		example: 'echo build/*.tmp    # preview what a glob matches before deleting',
		gotcha:
			'The riskiest commands combine force + recursion + a wide target: `rm -rf`, `chmod -R`, `sudo` anything. Slow down on those.'
	},
	'section-5-4': {
		explain:
			'"command not found" means the shell searched every directory in your `$PATH` and none of them contained a program by that name. It is one of exactly three things: a typo, a tool that is not installed, or a tool installed somewhere `$PATH` does not cover.',
		example: 'echo $PATH\nwhich python3',
		gotcha:
			'`which <name>` shows where (or whether) the shell finds a command — the fastest way to tell "not installed" from "not on PATH".'
	},
	'section-4-1': {
		explain:
			"Redirection points a command's output somewhere other than the screen: `>` writes it to a file (replacing what was there), `>>` appends instead, and `<` feeds a file in as input. The command itself never knows the difference.",
		example: 'echo "hello" > greeting.txt\ncat greeting.txt',
		gotcha: '`>` silently overwrites an existing file — use `>>` when you mean "add to the end".'
	},
	'section-3-4': {
		explain:
			'Wildcards (globs) are patterns the SHELL expands into filenames before the command even runs: `*` matches anything, `?` one character. `rm *.log` never sees the star — it sees the actual list of matching files.',
		example: 'echo *.log    # free, safe preview of exactly what the glob matches',
		gotcha:
			'`*` does not match hidden dotfiles, and a glob that matches nothing is passed through literally — both surprises are caught by the `echo` preview.'
	},
	'section-1-3': {
		explain:
			'Every command documents itself: `man <command>` opens the full manual, and `<command> --help` prints a quick summary. The manual opens in a pager that takes over the screen — scroll with the arrow keys and press `q` to get your prompt back.',
		example: 'man ls',
		gotcha: 'Everyone gets "stuck" in a pager exactly once. The way out is just `q`.'
	},
	'cheat-panic-button': {
		explain:
			'A "frozen" terminal is almost always just a program waiting for you. Work through the exits in order: `q` quits a pager, `Ctrl+C` cancels a running command, `Ctrl+D` sends end-of-input, and if you are trapped in vim, press `Esc` then type `:q!` and Enter to leave without saving.',
		example:
			'q          # quits less/man\n# Ctrl+C   cancels the running command\n# Esc :q!  escapes vim without saving',
		gotcha:
			'Nothing you type executes until you press Enter — a scary half-typed line is discarded by `Ctrl+C`.'
	}
};

/** Scripted terminal demonstrations, driven through the real approval gate. */
interface Demo {
	match: RegExp;
	intro: string;
	cmds: string[];
	wrap: string;
	citations: string[];
}

const DEMOS: Demo[] = [
	{
		match: /^demo:\s*pipes?\b/i,
		intro:
			"Let me show you in my terminal below — I'll write a few lines to a file, then count the duplicates with a pipeline. You approve each command before it runs.",
		cmds: ["printf 'a\\nb\\na\\n' > letters.txt", 'sort letters.txt | uniq -c'],
		wrap: 'That second line is the whole idea of pipes: `sort` groups the identical lines together, then `|` hands them straight to `uniq -c`, which counts each group. Small tools, chained.',
		citations: ['section-4-2', 'section-4-4']
	},
	{
		match: /^demo:\s*redirect/i,
		intro: "Watch the terminal — I'll write a file with `>` and read it back.",
		cmds: ['echo "hello, terminal" > greeting.txt', 'cat greeting.txt'],
		wrap: '`>` sent the output into `greeting.txt` instead of the screen, and `cat` read it back. `>>` would have appended instead of replacing.',
		citations: ['section-4-1']
	}
];

/** Compose a teaching answer: explanation first, example, gotcha — then cite. */
function composeAnswer(question: string, hits: RetrievalHit[]): string {
	if (hits.length === 0) {
		return (
			"That topic isn't covered in the course, and I won't guess — " +
			'right now I answer strictly from the lessons. Try asking about ' +
			'a command from the cheat sheet, like `chmod`, `grep`, or pipes.'
		);
	}

	const [top, ...rest] = hits;
	if (top.score < CONFIDENT_SCORE) {
		return (
			"That one isn't really covered in the course, so I won't make " +
			`something up. The closest lesson is "${top.title}" [[${top.id}]] — ` +
			'it may still point you in the right direction.'
		);
	}

	const related = rest.filter((h) => h.score >= top.score * 0.35).slice(0, 2);

	// Part intros often outrank their own child sections ("how do pipes
	// work" → part-4 before section-4-2); the curated lesson may live on any
	// of the strong hits, so pick the first one that has it.
	const strong = [top, ...related];
	const lessonHit = strong.find((h) => SECTION_LESSONS[h.id]) ?? top;
	const citations = [lessonHit.id, ...strong.filter((h) => h.id !== lessonHit.id).map((h) => h.id)];
	const citationLine = citations.map((id) => `[[${id}]]`).join(' ');

	const lesson = SECTION_LESSONS[lessonHit.id];
	if (lesson) {
		const parts = [lesson.explain];
		if (lesson.example) parts.push('```bash\n' + lesson.example + '\n```');
		if (lesson.gotcha) parts.push(`**Heads up:** ${lesson.gotcha}`);
		parts.push(citationLine);
		return parts.join('\n\n');
	}

	// No curated lesson: teach from the chunk itself — its own sentences,
	// never a "the course covers this in…" meta-line.
	return `${top.snippet}\n\n${citationLine}`;
}

export class MockBackend implements AgentBackend {
	readonly name = 'mock';

	async generate(messages: ChatMessage[], opts: GenerateOptions): Promise<void> {
		const { onEvent, signal } = opts;
		const instant = opts.instant || import.meta.env.MODE === 'test';

		if (signal?.aborted) return;

		if (opts.tools) {
			this.#generateToolStep(messages, opts);
			return;
		}

		const question = lastUserMessage(messages);

		// Scripted terminal demonstrations: the deterministic harness for the
		// full propose → gate → execute → result loop (drives the e2e tests).
		const demo = opts.bash ? DEMOS.find((d) => d.match.test(question)) : null;
		if (demo && opts.bash) {
			await this.#runDemo(demo, opts, instant);
			return;
		}

		const answer = composeAnswer(question, retrieve(question, 3));
		await this.#stream(answer, opts, instant);
		if (signal?.aborted) return;
		onEvent({ type: 'doneTurn' });
	}

	async #stream(text: string, opts: GenerateOptions, instant: boolean): Promise<void> {
		// Stream word by word, keeping whitespace (incl. newlines) attached.
		for (const word of text.match(/\S+\s*/g) ?? []) {
			if (opts.signal?.aborted) return;
			opts.onEvent({ type: 'token', text: word });
			if (!instant) await sleep(14);
		}
	}

	/** Propose each scripted command through the gate, run what's approved. */
	async #runDemo(demo: Demo, opts: GenerateOptions, instant: boolean): Promise<void> {
		const { onEvent, signal } = opts;
		const bash = opts.bash!;

		await this.#stream(`${demo.intro}\n\n`, opts, instant);

		let ran = 0;
		for (const cmd of demo.cmds) {
			if (signal?.aborted) return;
			onEvent({
				type: 'toolCall',
				call: { id: `call-${ran + 1}`, name: 'bash', args: { cmd } }
			});
			const verdict = await bash.propose(cmd);
			if (signal?.aborted) return;
			if (verdict.decision === 'deny') {
				await this.#stream(
					`Skipping \`${cmd}\` — you said no${verdict.reason ? ` (${verdict.reason})` : ''}. `,
					opts,
					instant
				);
				continue;
			}
			await bash.run(verdict.cmd);
			ran++;
		}

		const wrap =
			ran > 0
				? `${demo.wrap}\n\n${demo.citations.map((id) => `[[${id}]]`).join(' ')}`
				: `No problem — nothing was run. Whenever you're curious, ask again and approve the commands to watch them work. ${demo.citations.map((id) => `[[${id}]]`).join(' ')}`;
		await this.#stream(`\n\n${wrap}`, opts, instant);
		if (signal?.aborted) return;
		onEvent({ type: 'doneTurn' });
	}

	/**
	 * One step of the standard tool loop per generate() call: emit the next
	 * bash call and yield; the caller runs it (through the approval gate),
	 * appends the tool result, and re-invokes generate. When the script is
	 * exhausted, emit `done` with a summary.
	 */
	#generateToolStep(messages: ChatMessage[], opts: GenerateOptions): void {
		const { onEvent, signal } = opts;
		const goal = lastUserMessage(messages).toLowerCase();
		const plan = TOOL_PLANS.find((p) => p.keywords.every((k) => goal.includes(k)));

		const emit = (call: ToolCall) => {
			if (signal?.aborted) return;
			onEvent({ type: 'toolCall', call });
			onEvent({ type: 'doneTurn' });
		};

		if (!plan) {
			emit({
				id: 'call-done',
				name: 'done',
				args: { summary: "I don't have a scripted plan for that goal yet (mock runtime)." }
			});
			return;
		}

		const step = completedSteps(messages);
		if (step < plan.cmds.length) {
			emit({ id: `call-${step + 1}`, name: 'bash', args: { cmd: plan.cmds[step] } });
		} else {
			emit({ id: 'call-done', name: 'done', args: { summary: plan.summary } });
		}
	}
}
