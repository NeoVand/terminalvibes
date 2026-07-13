/**
 * Tool roster + system prompt for CLI sessions (`agent "<task>"` in a
 * playground terminal). Two tools only: bash, bound to the INVOKING
 * terminal's engine and gated by the human at every call, and done, which
 * ends the session with a summary. `done` is declared interruptOn alongside
 * bash — the session loop reads the interrupt and simply never resumes, so
 * calling done truly ends the run without a wasted model round (its invoke
 * body never executes).
 */
import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import type { AgentBash } from '../types';
import type { AnyTool } from './deepagent';

/**
 * The course-agent persona, re-cut for CLI mode: terse and act-oriented.
 * One command at a time, never invent output, end with done.
 */
export const CLI_SYSTEM_PROMPT = [
	"You are the TerminalVibes agent, a CLI assistant running inside the learner's",
	'sandboxed playground terminal, entirely in their browser. You are given one',
	'task; complete it by running bash commands.',
	'',
	'HOW YOU WORK:',
	'- Call the bash tool with ONE small command at a time. Read its real output',
	'  before deciding the next step.',
	'- NEVER invent, predict, or paraphrase command output — only trust what the',
	'  tool actually returned.',
	'- Every bash call pauses for the human to allow, edit, or deny it. A denial',
	'  is feedback: change your approach instead of repeating the same command.',
	'- Keep prose to at most one short line before each action. No markdown, no',
	'  essays — this is a terminal.',
	'- The sandbox is a small in-memory filesystem (home is ~). Available:',
	'  ls cd pwd mkdir touch cp mv rm cat echo printf grep find sort head tail',
	'  chmod wc. No network, no sudo, no package managers.',
	'- When the task is complete — or truly impossible — call the done tool with',
	'  a one-line summary. ALWAYS end by calling done.'
].join('\n');

/** Gated bash bound to the invoking terminal (see tools.ts for the pattern). */
function createCliBashTool(bash: AgentBash) {
	return tool(
		async ({ cmd }: { cmd: string }) => {
			const result = await bash.run(cmd);
			if (!result.output) return result.error ? '(command failed with no output)' : '(no output)';
			return result.error ? `[stderr]\n${result.output}` : result.output;
		},
		{
			name: 'bash',
			description:
				"Run one bash command in the learner's terminal. The human approves every " +
				'command before it runs, and the real output comes back to you. One small ' +
				'command per call.',
			schema: z.object({
				cmd: z.string().describe('The bash command to run, e.g. mkdir -p notes')
			})
		}
	);
}

function createDoneTool() {
	return tool(async ({ summary }: { summary: string }) => summary || 'done', {
		name: 'done',
		description:
			'End the session. Call this exactly once, when the task is complete (or ' +
			'impossible), with a one-line summary of what happened.',
		schema: z.object({
			summary: z.string().describe('One line: what was accomplished.')
		})
	});
}

/** The CLI tool roster: bash (gated, terminal-bound) + done. */
export function buildCliTools(opts: { bash: AgentBash }): AnyTool[] {
	return [
		createCliBashTool(opts.bash) as unknown as AnyTool,
		createDoneTool() as unknown as AnyTool
	];
}
