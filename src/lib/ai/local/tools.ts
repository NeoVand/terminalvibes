/**
 * The agent's tool registry: search_course (agentic RAG over the committed
 * course index) and the gated bash tool (demonstrations in the agent's own
 * ShellEngine sandbox — every call pauses at the human approval gate via the
 * deepagent's interruptOn machinery before this tool ever executes).
 */
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { retrieve } from '../retrieval';
import type { AgentBash } from '../types';
import type { AnyTool } from './deepagent';

/**
 * Persona + citation + demonstration contract. Verbose and beginner-warm on
 * purpose: the answer must TEACH — direct answer, concrete explanation, a
 * runnable example, the classic gotcha — with citations at the end (the
 * panel renders them as a "Sources" chip row, outside the sentence flow).
 */
export const TUTOR_SYSTEM_PROMPT = [
	'You are the TerminalVibes tutor: a friendly, patient guide to the bash terminal,',
	"embedded in the TerminalVibes course. You run entirely in the learner's browser.",
	'Your learners are beginners — often developers who use AI coding tools and want',
	'to actually understand the commands scrolling past them.',
	'',
	'MANDATORY WORKFLOW — no exceptions:',
	'1. For EVERY question, your FIRST action is calling the search_course tool with',
	'   2-4 keywords (e.g. "chmod 755 permissions"). NEVER answer from memory alone.',
	'2. Ground your answer in the returned lesson excerpts.',
	'3. Cite the sections you used by copying their [[id]] tokens at the END of your',
	'   answer, e.g. [[section-5-2]]. Only cite ids search_course returned.',
	'',
	'HOW TO ANSWER — every answer teaches:',
	'- Answer the actual question directly in the first sentence, then explain the',
	'  concept concretely: what happens, why, what the learner will see.',
	'- Include at least one runnable example in a fenced code block:',
	'  ```bash',
	'  cat server.log | grep ERROR | wc -l',
	'  ```',
	'- Mention the common gotcha or safety note when there is one.',
	'- Put every command, flag, and filename in `backticks`. Use **bold** for the',
	'  one key term. Short paragraphs and simple bullet lists over dense prose.',
	'',
	'YOUR TERMINAL — show, then explain:',
	'- You have a bash tool that runs commands in your own sandboxed terminal,',
	'  visible to the learner. When they ask HOW something works, or ask you to',
	'  create/change/show something, prefer to DEMONSTRATE: call bash with one',
	'  small command at a time, then explain what just happened.',
	'- IMPORTANT: to actually run a command you must CALL the bash tool — just',
	'  printing a code block does NOT run anything.',
	'- Every bash call pauses for the learner to approve, edit, or deny it — that',
	'  is part of the lesson. Keep commands small, safe, and readable.',
	'- The sandbox is yours alone: a small home directory pre-stocked with demo',
	'  files, nothing to break. A "FILES IN YOUR SANDBOX" listing at the end of',
	'  this message is refreshed before every one of your turns — it is the',
	'  ground truth. When demonstrating, use files from that listing. If you',
	'  need a file that is not listed, CREATE it first (echo/printf/touch).',
	'  NEVER run a command against a path that does not appear in the listing.',
	'',
	'BOUNDARIES:',
	'- You teach bash and the terminal. For unrelated topics, say the course does',
	'  not cover them and steer back to the terminal.',
	'- Never invent flags — only use what appears in the lesson excerpts or is',
	'  standard, and say so explicitly when a command is risky (rm -rf, sudo).',
	'- If search_course returns nothing relevant, say the course does not cover it.'
].join('\n');

/**
 * The per-round system prompt: the tutor contract plus a live snapshot of the
 * agent's sandbox. Rebuilt for EVERY model call (deepagent accepts a function)
 * so the listing stays truthful after the agent's own commands mutate the VFS.
 */
export function tutorSystemPrompt(listing?: string | null): string {
	if (!listing) return TUTOR_SYSTEM_PROMPT;
	return [
		TUTOR_SYSTEM_PROMPT,
		'',
		'FILES IN YOUR SANDBOX RIGHT NOW (~ = /home/vibe; dirs end in /, executables in *):',
		listing,
		'Anything not listed above does not exist yet.'
	].join('\n');
}

/** Format retrieval hits the way the system prompt teaches the model to cite. */
export function formatCourseHits(query: string, k = 4): string {
	const hits = retrieve(query, k);
	if (hits.length === 0) {
		return 'No course sections matched that query. Tell the learner the course does not cover it.';
	}
	return hits
		.map((h) => `[[${h.id}]] "${h.title}" (relevance ${h.score.toFixed(1)}):\n${h.snippet}`)
		.join('\n\n');
}

export function createSearchCourseTool() {
	return tool(async ({ query }: { query: string }) => formatCourseHits(query), {
		name: 'search_course',
		description:
			'Search the TerminalVibes course lessons. Returns the most relevant lesson excerpts, ' +
			'each tagged with its [[section-id]] citation token. Call this before answering any ' +
			'question about the terminal, bash commands, or the course.',
		schema: z.object({
			query: z.string().describe('Short search query, e.g. "chmod 755 permissions"')
		})
	});
}

/**
 * The gated bash tool. Execution reaches this function only AFTER the human
 * approved (or edited) the call — the deepagent's `interruptOn: ['bash']`
 * pass gates it first, and a denial is answered with a synthesized
 * ToolMessage without ever executing. Output (stdout/stderr) becomes the
 * ToolMessage the model reads next round.
 */
export function createBashTool(bash: AgentBash) {
	return tool(
		async ({ cmd }: { cmd: string }) => {
			const result = await bash.run(cmd);
			if (!result.output) return result.error ? '(command failed with no output)' : '(no output)';
			return result.error ? `[stderr]\n${result.output}` : result.output;
		},
		{
			name: 'bash',
			description:
				'Run one bash command in your own sandboxed terminal, visible to the learner. ' +
				'Use it to demonstrate concepts live ("show, then explain"). The learner approves ' +
				'every command before it runs. Keep each call to a single small command.',
			schema: z.object({
				cmd: z.string().describe("The bash command to run, e.g. echo 'hi' > note.txt")
			})
		}
	);
}

export interface AgentToolOptions {
	/** The gated sandbox; when present the bash tool joins the roster. */
	bash?: AgentBash;
}

/** The tool roster for the course agent. */
export function buildAgentTools(opts: AgentToolOptions = {}): AnyTool[] {
	const tools: AnyTool[] = [createSearchCourseTool() as unknown as AnyTool];
	if (opts.bash) {
		tools.push(createBashTool(opts.bash) as unknown as AnyTool);
	}
	return tools;
}
