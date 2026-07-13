import { describe, expect, it } from 'vitest';
import { AGENT_HOME_SEED, createBashBridge, type TerminalLine } from './bash-bridge';

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

describe('agent sandbox seed (demo-friendly home)', () => {
	it('ls shows the seeded files and folders', async () => {
		const bridge = await createBashBridge({});
		const { output, error } = await bridge.run('ls');
		expect(error).toBe(false);
		expect(output).toContain('notes');
		expect(output).toContain('projects');
		expect(output).toContain('todo.txt');
	});

	it('the seed rewards cat/grep/pipes demos', async () => {
		const bridge = await createBashBridge({});
		const cat = await bridge.run('cat todo.txt');
		expect(cat.output).toContain('water the terminal cactus');
		const grep = await bridge.run('grep CAREFULLY notes/monday.md');
		expect(grep.error).toBe(false);
		expect(grep.output).toContain("review the AI's pull request");
	});

	it('hello.sh exists WITHOUT its executable bit — chmod demos work naturally', async () => {
		const bridge = await createBashBridge({});
		expect(bridge.engine.isFile('~/projects/hello/hello.sh')).toBe(true);
		expect(bridge.engine.isExecutable('~/projects/hello/hello.sh')).toBe(false);
		await bridge.run('chmod +x projects/hello/hello.sh');
		expect(bridge.engine.isExecutable('~/projects/hello/hello.sh')).toBe(true);
	});

	it('ships the hidden dotfile for the ls -a moment', async () => {
		const bridge = await createBashBridge({});
		const plain = await bridge.run('ls');
		expect(plain.output).not.toContain('.secret-of-the-sandbox');
		const all = await bridge.run('ls -a');
		expect(all.output).toContain('.secret-of-the-sandbox');
	});

	it('every seeded path stays small and charming (sanity on the seed itself)', () => {
		const paths = Object.keys(AGENT_HOME_SEED.files ?? {});
		expect(paths).toContain('~/notes/monday.md');
		expect(paths).toContain('~/notes/ideas.md');
		expect(paths).toContain('~/projects/hello/hello.sh');
		expect(paths).toContain('~/projects/hello/README.md');
		expect(paths).toContain('~/todo.txt');
		expect(paths).toContain('~/.secret-of-the-sandbox');
		// No executables in the seed: the x bit is the chmod lesson.
		expect(AGENT_HOME_SEED.executables ?? []).toEqual([]);
	});
});

describe('sandbox listing (system-prompt injection)', () => {
	it('lists every seeded path, dirs marked with a trailing slash', async () => {
		const bridge = await createBashBridge({});
		const listing = bridge.listing();
		expect(listing.split('\n')[0]).toBe('cwd: ~');
		expect(listing).toContain('notes/');
		expect(listing).toContain('monday.md');
		expect(listing).toContain('hello.sh');
		expect(listing).toContain('.secret-of-the-sandbox');
	});

	it('stays fresh: the listing reflects the agent’s own mutations', async () => {
		const bridge = await createBashBridge({});
		expect(bridge.listing()).not.toContain('brand-new.txt');
		await bridge.run('touch brand-new.txt');
		expect(bridge.listing()).toContain('brand-new.txt');
		await bridge.run('cd projects');
		expect(bridge.listing().split('\n')[0]).toBe('cwd: ~/projects');
	});

	it('marks executables with a star once chmod grants the bit', async () => {
		const bridge = await createBashBridge({});
		expect(bridge.listing()).not.toContain('hello.sh*');
		await bridge.run('chmod +x projects/hello/hello.sh');
		expect(bridge.listing()).toContain('hello.sh*');
	});

	it('caps at ~25 lines with an honest tail — never floods the context', async () => {
		const bridge = await createBashBridge({});
		for (let i = 0; i < 40; i++) {
			await bridge.run(`touch file-${String(i).padStart(2, '0')}.txt`);
		}
		const lines = bridge.listing().split('\n');
		expect(lines.length).toBeLessThanOrEqual(26);
		expect(lines.at(-1)).toMatch(/… and \d+ more/);
	});
});
