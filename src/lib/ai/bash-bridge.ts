/**
 * The gate-to-engine bridge: connects the agent's bash tool to a private
 * ShellEngine sandbox and records everything into a terminal transcript the
 * panel renders. Pure orchestration — the approval decision itself comes
 * from gate.ts, the execution from the playground's runShellCommand, so the
 * agent's terminal behaves exactly like the learner's.
 */
import { ShellEngine, type FsSeed } from '../playground/shell-engine';
import { runShellCommand } from '../playground/shell-commands';
import { snapshotFsTree, type FsTreeNode } from '../playground/fs-tree';
import { createGate, type Gate, type GateResolution } from './gate';

/**
 * The agent's demo-friendly home: a few small files that reward `cat`, `grep`
 * and pipes, plus one script deliberately missing its executable bit so a
 * `chmod +x` demonstration works on a file that actually exists. Everything
 * the agent might operate on lives here — no more errors from demonstrating
 * commands against an empty sandbox.
 */
export const AGENT_HOME_SEED: FsSeed = {
	files: {
		'~/todo.txt': [
			'[ ] water the terminal cactus',
			'[ ] finish part 5 of the course',
			"[ ] stop running commands I haven't read",
			''
		].join('\n'),
		'~/notes/monday.md': [
			'# Monday',
			'- standup at 10',
			"- review the AI's pull request CAREFULLY",
			'- ship the tiny fix, not the big rewrite',
			''
		].join('\n'),
		'~/notes/ideas.md': [
			'# Ideas',
			'- a shell alias that says good morning',
			'- teach the rubber duck to use grep',
			'- pipe the todo list into sort and call it progress',
			''
		].join('\n'),
		'~/projects/hello/hello.sh': [
			'#!/bin/bash',
			'echo "Hello from the sandbox!"',
			'echo "You just ran your first script."',
			''
		].join('\n'),
		'~/projects/hello/README.md': [
			'# hello',
			'A tiny script that greets whoever runs it.',
			'Run it with: ./hello.sh   (hint: it may need chmod +x first)',
			''
		].join('\n'),
		'~/.secret-of-the-sandbox':
			'You found the hidden file! Dotfiles hide from plain ls — try ls -a.\n'
	}
	// No `executables`: hello.sh ships WITHOUT its x bit, on purpose.
};

/** Keeps the per-turn system-prompt injection cheap (~60 tokens seeded). */
const MAX_LISTING_LINES = 25;

/**
 * Compact one-path-per-line tree of the sandbox (~), for the system prompt.
 * Dirs end in `/`, executables in `*`; capped at MAX_LISTING_LINES with an
 * honest "… and N more" tail so a busy sandbox never floods the context.
 */
export function listingFor(engine: ShellEngine): string {
	const lines: string[] = [`cwd: ${engine.pretty(engine.cwd)}`];
	let hidden = 0;
	const walk = (node: FsTreeNode, depth: number) => {
		const mark = node.kind === 'dir' ? '/' : node.executable ? '*' : '';
		if (lines.length < MAX_LISTING_LINES) {
			lines.push(`${'  '.repeat(depth)}${node.name}${mark}`);
		} else {
			hidden++;
		}
		hidden += node.hidden ?? 0;
		for (const child of node.children ?? []) walk(child, depth + 1);
	};
	walk(snapshotFsTree(engine), 0);
	if (hidden > 0) lines.push(`… and ${hidden} more`);
	return lines.join('\n');
}

export interface TerminalLine {
	type: 'input' | 'output';
	text: string;
	error?: boolean;
	/** Colored lines carry pre-escaped HTML from runShellCommand. */
	colored?: boolean;
	/** For input lines: the prompt cwd at the time the command ran. */
	promptCwd?: string;
}

export interface BashRunResult {
	output: string;
	error: boolean;
}

export interface BashBridge {
	gate: Gate;
	engine: ShellEngine;
	/** Execute a command in the sandbox, recording prompt + output lines. */
	run(cmd: string): Promise<BashRunResult>;
	/** Convenience: gate.propose (what backends await before running). */
	propose(cmd: string): Promise<GateResolution>;
	/** Compact current-file tree of the sandbox, for the system prompt. */
	listing(): string;
}

export interface BashBridgeOptions {
	engine?: ShellEngine;
	gate?: Gate;
	/** Called for every transcript line (the panel appends to its state). */
	onLine?: (line: TerminalLine) => void;
}

export async function createBashBridge(opts: BashBridgeOptions = {}): Promise<BashBridge> {
	const engine = opts.engine ?? new ShellEngine();
	if (!opts.engine) {
		// The demo-friendly home — the agent demonstrates on files that exist.
		await engine.reset(AGENT_HOME_SEED);
	}
	const gate = opts.gate ?? createGate();
	const onLine = opts.onLine ?? (() => {});

	return {
		gate,
		engine,
		propose: (cmd: string) => gate.propose(cmd),
		listing: () => listingFor(engine),
		async run(cmd: string): Promise<BashRunResult> {
			onLine({ type: 'input', text: cmd, promptCwd: engine.pretty(engine.cwd) });
			const result = await runShellCommand(engine, cmd);
			if (result.output) {
				onLine({
					type: 'output',
					text: result.output,
					error: result.error,
					colored: result.colored
				});
			}
			return { output: result.output, error: result.error ?? false };
		}
	};
}
