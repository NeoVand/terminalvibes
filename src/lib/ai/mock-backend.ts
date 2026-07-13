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

/** Compose a 2–4 sentence answer from retrieved chunks, one citation each. */
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

	const sentences: string[] = [];
	sentences.push(
		`The course covers this in "${top.title}". ${endWithPeriod(top.snippet)} [[${top.id}]]`
	);

	const related = rest.filter((h) => h.score >= top.score * 0.35).slice(0, 2);
	if (related.length === 1) {
		sentences.push(`Related reading: "${related[0].title}" [[${related[0].id}]].`);
	} else if (related.length === 2) {
		sentences.push(
			`Related reading: "${related[0].title}" [[${related[0].id}]] and ` +
				`"${related[1].title}" [[${related[1].id}]].`
		);
	}

	return sentences.join(' ');
}

function endWithPeriod(text: string): string {
	return /[.!?…]$/.test(text) ? text : `${text}.`;
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
		const answer = composeAnswer(question, retrieve(question, 3));

		// Stream word by word, keeping whitespace attached to each token.
		for (const word of answer.match(/\S+\s*/g) ?? []) {
			if (signal?.aborted) return;
			onEvent({ type: 'token', text: word });
			if (!instant) await sleep(14);
		}
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
