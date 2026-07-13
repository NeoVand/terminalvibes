/**
 * The agent's tool registry. Phase 2 ships exactly one tool — search_course,
 * the agentic-RAG entry point over the committed course index — plus the
 * typed seam where the gated bash tool plugs in next phase.
 */
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { retrieve } from '../retrieval';
import type { Gate } from '../gate';
import type { AnyTool } from './deepagent';

/** Persona + citation contract. The chip renderer already parses [[id]]. */
export const TUTOR_SYSTEM_PROMPT = [
	'You are the TerminalVibes tutor: a friendly, precise guide to the bash terminal,',
	"embedded in the TerminalVibes course. You run entirely in the learner's browser.",
	'',
	'MANDATORY WORKFLOW — no exceptions:',
	'1. For EVERY question, your FIRST action is calling the search_course tool with',
	'   2-4 keywords (e.g. "chmod 755 permissions"). NEVER answer from memory alone.',
	'2. Read the returned lesson excerpts and answer ONLY from them.',
	'3. End your answer by copying the [[id]] token of each section you used,',
	'   e.g. "chmod changes permissions [[section-5-2]]". Only cite ids that',
	'   search_course returned.',
	'',
	'Style rules:',
	'- You teach bash and the terminal. For unrelated topics, say the course does not',
	'  cover them and steer back to the terminal.',
	'- Keep answers to 2-5 short sentences. Put commands and flags in `backticks`.',
	'- Only mention commands and flags that appear in the lesson excerpts — never',
	'  invent flags. When a command is risky (rm -rf, sudo), say so explicitly.',
	'- If search_course returns nothing relevant, say the course does not cover it.'
].join('\n');

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

export interface AgentToolOptions {
	/**
	 * TODO(phase 3): the gated bash tool. When a `gate` and a shell engine are
	 * provided, register a `bash` tool whose execution awaits
	 * `gate.propose(cmd)` and routes allow/edit into the sandboxed
	 * shell-engine, deny into a synthesized refusal ToolMessage. The
	 * deepagent's `interruptOn: ['bash']` machinery is already in place.
	 */
	gate?: Gate;
}

/** The tool roster for the course agent (architected for the bash seam above). */
export function buildAgentTools(opts: AgentToolOptions = {}): AnyTool[] {
	// The gate stays unused until the bash tool lands (see AgentToolOptions).
	void opts.gate;
	return [createSearchCourseTool() as unknown as AnyTool];
}
