/**
 * The gate-to-engine bridge: connects the agent's bash tool to a private
 * ShellEngine sandbox and records everything into a terminal transcript the
 * panel renders. Pure orchestration — the approval decision itself comes
 * from gate.ts, the execution from the playground's runShellCommand, so the
 * agent's terminal behaves exactly like the learner's.
 */
import { ShellEngine } from '../playground/shell-engine';
import { runShellCommand } from '../playground/shell-commands';
import { createGate, type Gate, type GateResolution } from './gate';

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
		// A fresh, empty home — the agent demonstrates from a blank slate.
		await engine.reset();
	}
	const gate = opts.gate ?? createGate();
	const onLine = opts.onLine ?? (() => {});

	return {
		gate,
		engine,
		propose: (cmd: string) => gate.propose(cmd),
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
