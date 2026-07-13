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
	'embedded in the TerminalVibes course. You run entirely in the learner\'s browser.',
	'',
	'Rules:',
	'- You teach bash and the terminal. For unrelated topics, say the course does not',
	'  cover them and steer back to the terminal.',
	'- Before answering a course question, call the search_course tool with a short',
	'  query to fetch the relevant lesson text. Base your answer on what it returns.',
	'- Keep answers to 2-5 short sentences. Put commands and flags in `backticks`.',
	'- Cite the sections you used by copying their [[id]] token into your answer,',
	'  e.g. "chmod changes permissions [[section-5-2]]". Only cite ids that',
	'  search_course returned.',
	'- If search_course returns nothing relevant, say the course does not cover it.',
	'- Never invent commands that could damage a system; when a command is risky',
	'  (rm -rf, sudo), say so explicitly.'
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
export function buildAgentTools(_opts: AgentToolOptions = {}): AnyTool[] {
	return [createSearchCourseTool() as unknown as AnyTool];
}
