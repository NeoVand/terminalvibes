import { describe, expect, it } from 'vitest';
import { MockBackend } from './mock-backend';
import type { AgentEvent, ChatMessage } from './types';

async function collect(
	backend: MockBackend,
	messages: ChatMessage[],
	opts: { tools?: boolean; signal?: AbortSignal } = {}
): Promise<AgentEvent[]> {
	const events: AgentEvent[] = [];
	await backend.generate(messages, { ...opts, onEvent: (e) => events.push(e) });
	return events;
}

function streamedText(events: AgentEvent[]): string {
	return events
		.filter((e): e is Extract<AgentEvent, { type: 'token' }> => e.type === 'token')
		.map((e) => e.text)
		.join('');
}

describe('mock backend — chat mode', () => {
	it('answers the chmod question with a section 5.2 citation', async () => {
		const events = await collect(new MockBackend(), [
			{ role: 'user', content: 'what does chmod 755 mean' }
		]);
		const text = streamedText(events);
		expect(text).toContain('[[section-5-2]]');
		expect(events.at(-1)).toEqual({ type: 'doneTurn' });
	});

	it('cites every marker from the retrieved set only', async () => {
		const events = await collect(new MockBackend(), [
			{ role: 'user', content: 'how do pipes work' }
		]);
		const text = streamedText(events);
		const cited = [...text.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map((m) => m[1]);
		expect(cited.length).toBeGreaterThan(0);
		for (const id of cited) {
			expect(id).toMatch(/^(section-|part-|cheat-|hero)/);
		}
	});

	it('is honest about topics the course does not cover', async () => {
		const events = await collect(new MockBackend(), [
			{ role: 'user', content: 'xyzzyqwlkj blorptastic zzyzx9000' }
		]);
		const text = streamedText(events);
		expect(text).toMatch(/isn't covered in the course/i);
		expect(text).not.toContain('[[');
	});

	it('is deterministic: same question, same answer', async () => {
		const backend = new MockBackend();
		const messages: ChatMessage[] = [{ role: 'user', content: 'is rm -rf safe?' }];
		const first = streamedText(await collect(backend, messages));
		const second = streamedText(await collect(backend, messages));
		expect(first).toBe(second);
		expect(first.length).toBeGreaterThan(0);
	});

	it('abort stops the event flow', async () => {
		const backend = new MockBackend();
		const controller = new AbortController();
		const events: AgentEvent[] = [];
		await backend.generate([{ role: 'user', content: 'what does chmod 755 mean' }], {
			signal: controller.signal,
			onEvent: (e) => {
				events.push(e);
				if (events.length === 3) controller.abort();
			}
		});
		expect(events.length).toBe(3);
		expect(events.every((e) => e.type === 'token')).toBe(true);
	});

	it('emits nothing when already aborted', async () => {
		const controller = new AbortController();
		controller.abort();
		const events = await collect(new MockBackend(), [{ role: 'user', content: 'pipes?' }], {
			signal: controller.signal
		});
		expect(events).toEqual([]);
	});
});

describe('mock backend — tool mode', () => {
	it('walks the backup plan one bash call at a time, then done', async () => {
		const backend = new MockBackend();
		const messages: ChatMessage[] = [
			{ role: 'user', content: 'back up my notes with a backup folder' }
		];
		const calls: string[] = [];

		for (let guard = 0; guard < 10; guard++) {
			const events = await collect(backend, messages, { tools: true });
			const toolEvents = events.filter(
				(e): e is Extract<AgentEvent, { type: 'toolCall' }> => e.type === 'toolCall'
			);
			expect(toolEvents.length).toBe(1);
			expect(events.at(-1)).toEqual({ type: 'doneTurn' });

			const call = toolEvents[0].call;
			if (call.name === 'done') {
				expect(call.args.summary).toBeTruthy();
				break;
			}
			expect(call.name).toBe('bash');
			expect(call.args.cmd).toBeTruthy();
			calls.push(call.args.cmd as string);
			// The standard loop: feed the tool result back and re-invoke.
			messages.push({ role: 'tool', content: 'ok', toolCallId: call.id });
		}

		expect(calls).toEqual(['mkdir -p backups', 'cp -r notes/ backups/']);
	});

	it('ends with done immediately for goals it has no plan for', async () => {
		const events = await collect(
			new MockBackend(),
			[{ role: 'user', content: 'refactor my kubernetes cluster' }],
			{ tools: true }
		);
		const toolEvents = events.filter(
			(e): e is Extract<AgentEvent, { type: 'toolCall' }> => e.type === 'toolCall'
		);
		expect(toolEvents.length).toBe(1);
		expect(toolEvents[0].call.name).toBe('done');
	});

	it('abort suppresses tool events', async () => {
		const controller = new AbortController();
		controller.abort();
		const events = await collect(new MockBackend(), [{ role: 'user', content: 'backup please' }], {
			tools: true,
			signal: controller.signal
		});
		expect(events).toEqual([]);
	});
});

describe('mock backend — teaching answers', () => {
	it('the pipes question explains pipes and shows a runnable pipeline', async () => {
		const events = await collect(new MockBackend(), [
			{ role: 'user', content: 'How do pipes work?' }
		]);
		const text = streamedText(events);
		// It teaches — never the old "the course covers this in…" meta-line.
		expect(text).not.toMatch(/course covers this/i);
		expect(text).toMatch(/pipe/i);
		expect(text).toContain('input of the second');
		// A fenced, runnable example.
		expect(text).toContain('```bash\ncat server.log | grep ERROR | wc -l\n```');
		// Citations still present (rendered as the Sources row).
		expect(text).toMatch(/\[\[section-4-2\]\]/);
	});

	it('the chmod question leads with the explanation and a code block', async () => {
		const events = await collect(new MockBackend(), [
			{ role: 'user', content: 'what does chmod 755 mean' }
		]);
		const text = streamedText(events);
		expect(text).not.toMatch(/course covers this/i);
		expect(text).toMatch(/read.*write.*execute/i);
		expect(text).toContain('```bash');
		expect(text).toContain('[[section-5-2]]');
	});
});

describe('mock backend — gated demo flow (the e2e harness)', () => {
	function autoGate(decisions: ('allow' | 'deny')[]) {
		const proposed: string[] = [];
		const ran: string[] = [];
		const bash = {
			propose: async (cmd: string) => {
				proposed.push(cmd);
				const d = decisions[proposed.length - 1] ?? 'allow';
				return { decision: d, cmd } as const;
			},
			run: async (cmd: string) => {
				ran.push(cmd);
				return { output: `ran:${cmd}` };
			}
		};
		return { bash, proposed, ran };
	}

	it('demo: pipes proposes each command through the gate, runs approved ones', async () => {
		const { bash, proposed, ran } = autoGate(['allow', 'allow']);
		const events: AgentEvent[] = [];
		await new MockBackend().generate([{ role: 'user', content: 'demo: pipes' }], {
			bash,
			onEvent: (e) => events.push(e)
		});

		expect(proposed).toEqual(["printf 'a\\nb\\na\\n' > letters.txt", 'sort letters.txt | uniq -c']);
		expect(ran).toEqual(proposed);
		const toolEvents = events.filter((e) => e.type === 'toolCall');
		expect(toolEvents).toHaveLength(2);
		const text = streamedText(events);
		expect(text).toMatch(/sort|pipe/i);
		expect(text).toContain('[[section-4-2]]');
		expect(events.at(-1)).toEqual({ type: 'doneTurn' });
	});

	it('denied commands are skipped and acknowledged', async () => {
		const { bash, ran } = autoGate(['deny', 'deny']);
		const events: AgentEvent[] = [];
		await new MockBackend().generate([{ role: 'user', content: 'demo: pipes' }], {
			bash,
			onEvent: (e) => events.push(e)
		});
		expect(ran).toEqual([]);
		const text = streamedText(events);
		expect(text).toMatch(/nothing was run/i);
	});

	it('without a sandbox the demo prompt falls back to a normal answer', async () => {
		const events = await collect(new MockBackend(), [{ role: 'user', content: 'demo: pipes' }]);
		const toolEvents = events.filter((e) => e.type === 'toolCall');
		expect(toolEvents).toHaveLength(0);
	});
});
