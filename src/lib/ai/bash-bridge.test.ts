import { describe, expect, it } from 'vitest';
import { createBashBridge, type TerminalLine } from './bash-bridge';

describe('bash bridge (gate → engine transcript)', () => {
	it('runs an approved command and records prompt + output lines', async () => {
		const lines: TerminalLine[] = [];
		const bridge = await createBashBridge({ onLine: (l) => lines.push(l) });

		const pending = bridge.propose('echo hello');
		expect(bridge.gate.pending).toBe('echo hello');
		bridge.gate.resolve('allow');
		const verdict = await pending;
		expect(verdict.decision).toBe('allow');

		const result = await bridge.run(verdict.cmd);
		expect(result.output).toContain('hello');
		expect(result.error).toBe(false);

		expect(lines[0]).toMatchObject({ type: 'input', text: 'echo hello', promptCwd: '~' });
		expect(lines[1].type).toBe('output');
		expect(lines[1].text).toContain('hello');
	});

	it('a denied proposal runs nothing — the transcript stays empty', async () => {
		const lines: TerminalLine[] = [];
		const bridge = await createBashBridge({ onLine: (l) => lines.push(l) });

		const pending = bridge.propose('rm -rf /');
		bridge.gate.resolve('deny', { reason: 'absolutely not' });
		const verdict = await pending;
		expect(verdict.decision).toBe('deny');
		expect(lines).toEqual([]);
	});

	it('edit rewrites the command before it reaches the engine', async () => {
		const lines: TerminalLine[] = [];
		const bridge = await createBashBridge({ onLine: (l) => lines.push(l) });

		const pending = bridge.propose('echo original');
		bridge.gate.resolve('edit', { cmd: 'echo edited' });
		const verdict = await pending;
		await bridge.run(verdict.cmd);
		expect(lines[0].text).toBe('echo edited');
		expect(lines[1].text).toContain('edited');
	});

	it('state persists across commands (files created stay created)', async () => {
		const bridge = await createBashBridge({});
		await bridge.run("printf 'a\\nb\\na\\n' > letters.txt");
		const { output } = await bridge.run('sort letters.txt | uniq -c');
		expect(output).toMatch(/2\s+a/);
		expect(output).toMatch(/1\s+b/);
		const ls = await bridge.run('ls');
		expect(ls.output).toContain('letters.txt');
	});

	it('command errors come back as error output, not exceptions', async () => {
		const lines: TerminalLine[] = [];
		const bridge = await createBashBridge({ onLine: (l) => lines.push(l) });
		const result = await bridge.run('cat no-such-file.txt');
		expect(result.error).toBe(true);
		expect(result.output).toContain('No such file');
	});
});
