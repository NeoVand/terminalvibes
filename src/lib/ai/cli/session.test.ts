/**
 * CliSession driven end-to-end with the deterministic MockBackend and a real
 * ShellEngine — the same wiring TerminalPlayground uses, minus the DOM. Each
 * test scripts the human's keystroke verdicts by reacting to session events.
 */
import { beforeEach, describe, expect, it } from 'vitest';
import { CliSession, type CliEvent, type CliPhase } from './session';
import { MockBackend } from '../mock-backend';
import { ShellEngine } from '../../playground/shell-engine';
import { runShellCommand } from '../../playground/shell-commands';
import type { AgentBackend } from '../types';

const NOTES_TASK = 'create a notes folder with three dated files';

interface Harness {
	session: CliSession;
	events: CliEvent[];
	phases: CliPhase[];
	engine: ShellEngine;
	ran: string[];
}

function makeHarness(onEvent?: (e: CliEvent, s: CliSession) => void): Harness {
	const engine = new ShellEngine();
	const events: CliEvent[] = [];
	const phases: CliPhase[] = [];
	const ran: string[] = [];
	const session: CliSession = new CliSession({
		backend: new MockBackend(),
		instant: true,
		run: async (cmd) => {
			ran.push(cmd);
			const result = await runShellCommand(engine, cmd);
			return { output: result.output, error: result.error };
		},
		emit: (e) => {
			events.push(e);
			onEvent?.(e, session);
		},
		onUpdate: (s) => {
			if (phases[phases.length - 1] !== s.phase) phases.push(s.phase);
		}
	});
	return { session, events, phases, engine, ran };
}

function endEvent(events: CliEvent[]) {
	return events.find((e) => e.type === 'end') as Extract<CliEvent, { type: 'end' }> | undefined;
}

describe('CliSession', () => {
	let harness: Harness;

	beforeEach(async () => {
		harness = makeHarness();
		await harness.engine.reset();
	});

	it('propose → allow → execute mutates the VFS, then ends via done', async () => {
		const h = makeHarness((e, s) => {
			if (e.type === 'proposal') queueMicrotask(() => s.approve());
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);

		expect(h.ran).toEqual([
			'mkdir -p notes',
			'touch notes/2026-07-01.txt notes/2026-07-02.txt notes/2026-07-03.txt'
		]);
		// The invoking terminal's engine really changed.
		expect(h.engine.isDir('~/notes')).toBe(true);
		expect(h.engine.listDir('~/notes')).toEqual([
			'2026-07-01.txt',
			'2026-07-02.txt',
			'2026-07-03.txt'
		]);
		const end = endEvent(h.events);
		expect(end?.reason).toBe('done');
		expect(end?.summary).toContain('three dated files');
		expect(h.session.phase).toBe('done');
		// The canonical phase walk: generating → awaiting → executing → … → done.
		expect(h.phases).toEqual([
			'generating',
			'awaiting-approval',
			'generating',
			'executing',
			'generating',
			'awaiting-approval',
			'generating',
			'executing',
			'generating',
			'done'
		]);
	});

	it('deny lets the agent continue: nothing runs, the session still ends', async () => {
		const h = makeHarness((e, s) => {
			if (e.type === 'proposal') queueMicrotask(() => s.deny());
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);

		expect(h.ran).toEqual([]);
		expect(h.engine.exists('~/notes')).toBe(false);
		// Two proposals were made and denied; the agent kept going both times.
		expect(h.events.filter((e) => e.type === 'proposal')).toHaveLength(2);
		const end = endEvent(h.events);
		expect(end?.reason).toBe('done');
		expect(end?.summary).toContain('Nothing was run');
	});

	it('mixed verdicts: deny the first, allow the second', async () => {
		let first = true;
		const h = makeHarness((e, s) => {
			if (e.type !== 'proposal') return;
			const mine = first;
			first = false;
			queueMicrotask(() => (mine ? s.deny() : s.approve()));
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);

		expect(h.ran).toEqual(['touch notes/2026-07-01.txt notes/2026-07-02.txt notes/2026-07-03.txt']);
		expect(endEvent(h.events)?.reason).toBe('done');
	});

	it('edit rewrites the command before it runs', async () => {
		const h = makeHarness((e, s) => {
			if (e.type !== 'proposal') return;
			queueMicrotask(() => {
				if (e.cmd === 'mkdir -p notes') {
					const prefill = s.beginEdit();
					expect(prefill).toBe('mkdir -p notes');
					expect(s.editing).toBe(true);
					s.submitEdit('mkdir -p journal');
				} else {
					s.deny();
				}
			});
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);

		expect(h.ran).toEqual(['mkdir -p journal']);
		expect(h.engine.isDir('~/journal')).toBe(true);
		expect(h.engine.exists('~/notes')).toBe(false);
		const verdicts = h.events.filter((e) => e.type === 'verdict');
		expect(verdicts[0]).toMatchObject({ decision: 'edit', cmd: 'mkdir -p journal' });
	});

	it('submitting an unchanged edit counts as a plain allow', async () => {
		const h = makeHarness((e, s) => {
			if (e.type !== 'proposal') return;
			queueMicrotask(() => {
				const prefill = s.beginEdit();
				s.submitEdit(prefill ?? '');
			});
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);
		const verdicts = h.events.filter((e) => e.type === 'verdict');
		expect(verdicts.every((v) => v.type === 'verdict' && v.decision === 'allow')).toBe(true);
		expect(h.ran).toHaveLength(2);
	});

	it('cancelEdit returns to the approval prompt without a verdict', async () => {
		const h = makeHarness((e, s) => {
			if (e.type !== 'proposal') return;
			queueMicrotask(() => {
				s.beginEdit();
				s.cancelEdit();
				expect(s.editing).toBe(false);
				expect(s.phase).toBe('awaiting-approval');
				s.approve();
			});
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);
		expect(h.ran).toHaveLength(2);
	});

	it('interrupt at the approval prompt is SIGINT: nothing runs, session ends', async () => {
		const h = makeHarness((e, s) => {
			if (e.type === 'proposal') queueMicrotask(() => s.interrupt());
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);

		expect(h.ran).toEqual([]);
		expect(h.session.phase).toBe('interrupted');
		const end = endEvent(h.events);
		expect(end?.reason).toBe('interrupted');
		// Exactly one end event, even though the backend also unwinds.
		expect(h.events.filter((e) => e.type === 'end')).toHaveLength(1);
	});

	it('a task with no scripted plan still ends cleanly (demo mode)', async () => {
		const h = makeHarness();
		await h.engine.reset();
		await h.session.start('fold my laundry');
		const end = endEvent(h.events);
		expect(end?.reason).toBe('done');
		expect(end?.summary).toContain('No scripted plan');
		expect(h.ran).toEqual([]);
	});

	it('streams the agent prose as events', async () => {
		const h = makeHarness((e, s) => {
			if (e.type === 'proposal') queueMicrotask(() => s.approve());
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);
		const prose = h.events
			.filter((e) => e.type === 'prose')
			.map((e) => (e.type === 'prose' ? e.text : ''))
			.join('');
		expect(prose).toContain('2 steps');
	});

	it('start() is one-shot', async () => {
		const h = makeHarness((e, s) => {
			if (e.type === 'proposal') queueMicrotask(() => s.approve());
		});
		await h.engine.reset();
		await h.session.start(NOTES_TASK);
		await expect(h.session.start(NOTES_TASK)).rejects.toThrow(/only be called once/);
	});

	it('a backend without generateCli ends with an error', async () => {
		const backend: AgentBackend = {
			name: 'bare',
			generate: async () => {}
		};
		const events: CliEvent[] = [];
		const session = new CliSession({
			backend,
			run: async () => ({ output: '' }),
			emit: (e) => events.push(e)
		});
		await session.start('anything');
		expect(session.phase).toBe('error');
		expect(endEvent(events)?.reason).toBe('error');
	});
});
