/**
 * The gated bash loop end to end with a scripted fake model and a REAL
 * ShellEngine sandbox: propose → allow → output ToolMessage → done;
 * propose → deny → synthesized rejection; edit rewrites the command.
 */
import { describe, expect, it } from 'vitest';
import { AsyncLocalStorage } from 'node:async_hooks';
import { AsyncLocalStorageProviderSingleton } from '@langchain/core/singletons';
import { BaseChatModel, type BindToolsInput } from '@langchain/core/language_models/chat_models';
import { AIMessage, ToolMessage, type BaseMessage } from '@langchain/core/messages';
import type { ChatResult } from '@langchain/core/outputs';
import { createCourseAgent } from './deepagent';
import { buildAgentTools, TUTOR_SYSTEM_PROMPT, tutorSystemPrompt } from './tools';
import { createBashBridge, type TerminalLine } from '../bash-bridge';
import type { AgentBash } from '../types';

AsyncLocalStorageProviderSingleton.initializeGlobalInstance(new AsyncLocalStorage());

class FakeChatModel extends BaseChatModel {
	calls: BaseMessage[][] = [];
	#script: AIMessage[];
	constructor(script: AIMessage[]) {
		super({});
		this.#script = script;
	}
	_llmType() {
		return 'fake';
	}
	override bindTools(tools: BindToolsInput[]) {
		void tools;
		return this as never;
	}
	async _generate(messages: BaseMessage[]): Promise<ChatResult> {
		this.calls.push(messages);
		const message = this.#script.shift();
		if (!message) throw new Error('FakeChatModel script exhausted');
		return { generations: [{ text: String(message.content), message }] };
	}
}

function bashCall(cmd: string, id: string): AIMessage {
	return new AIMessage({
		content: '',
		tool_calls: [{ name: 'bash', args: { cmd }, id, type: 'tool_call' }]
	});
}

async function makeHarness(script: AIMessage[]) {
	const lines: TerminalLine[] = [];
	const bridge = await createBashBridge({ onLine: (l) => lines.push(l) });
	const bash: AgentBash = {
		propose: (cmd) => bridge.propose(cmd),
		run: (cmd) => bridge.run(cmd)
	};
	const agent = createCourseAgent({
		model: new FakeChatModel(script) as unknown as BaseChatModel,
		tools: buildAgentTools({ bash }),
		systemPrompt: TUTOR_SYSTEM_PROMPT,
		interruptOn: ['bash']
	});
	return { agent, bridge, lines };
}

describe('deepagent gated bash loop', () => {
	it('propose → allow → engine output as ToolMessage → done', async () => {
		const { agent, lines } = await makeHarness([
			bashCall('echo hello from the agent', 'call_b1'),
			new AIMessage('I just printed a greeting — that is `echo` at work.')
		]);

		const paused = await agent.start('show me echo');
		expect(paused.status).toBe('interrupted');
		if (paused.status !== 'interrupted') throw new Error('unreachable');
		expect(paused.interrupt.tool).toBe('bash');
		expect(paused.interrupt.args.cmd).toBe('echo hello from the agent');

		const done = await agent.resume({ type: 'approve' });
		expect(done.status).toBe('done');
		const tms = done.messages.filter((m): m is ToolMessage => m instanceof ToolMessage);
		expect(tms).toHaveLength(1);
		expect(tms[0].tool_call_id).toBe('call_b1');
		expect(String(tms[0].content)).toContain('hello from the agent');

		// The command actually ran in the sandbox transcript.
		expect(lines[0]).toMatchObject({ type: 'input', text: 'echo hello from the agent' });
		expect(lines[1].text).toContain('hello from the agent');
	});

	it('propose → deny → synthesized rejection, nothing executed', async () => {
		const { agent, lines } = await makeHarness([
			bashCall('rm -rf /', 'call_b2'),
			new AIMessage('Understood — I will not run that.')
		]);

		const paused = await agent.start('wipe everything');
		expect(paused.status).toBe('interrupted');
		const done = await agent.resume({ type: 'reject', message: 'never' });
		expect(done.status).toBe('done');

		const tms = done.messages.filter((m): m is ToolMessage => m instanceof ToolMessage);
		expect(tms).toHaveLength(1);
		expect(String(tms[0].content)).toContain('REJECTED');
		expect(String(tms[0].content)).toContain('never');
		expect(lines).toEqual([]);
	});

	it('edit rewrites the command before execution', async () => {
		const { agent, lines } = await makeHarness([
			bashCall('echo before', 'call_b3'),
			new AIMessage('Done.')
		]);

		const paused = await agent.start('demo');
		expect(paused.status).toBe('interrupted');
		const done = await agent.resume({ type: 'edit', args: { cmd: 'echo after' } });
		expect(done.status).toBe('done');
		expect(lines[0].text).toBe('echo after');
		const tms = done.messages.filter((m): m is ToolMessage => m instanceof ToolMessage);
		expect(String(tms[0].content)).toContain('after');
	});

	it('multi-step demo: two approvals, engine state carries over', async () => {
		const { agent } = await makeHarness([
			bashCall("printf 'a\\nb\\na\\n' > letters.txt", 'call_s1'),
			bashCall('sort letters.txt | uniq -c', 'call_s2'),
			new AIMessage('`sort` grouped the lines and `uniq -c` counted them.')
		]);

		let result = await agent.start('demo pipes');
		expect(result.status).toBe('interrupted');
		result = await agent.resume({ type: 'approve' });
		expect(result.status).toBe('interrupted');
		result = await agent.resume({ type: 'approve' });
		expect(result.status).toBe('done');

		const tms = result.messages.filter((m): m is ToolMessage => m instanceof ToolMessage);
		expect(tms).toHaveLength(2);
		expect(String(tms[1].content)).toMatch(/2\s+a/);
		expect(String(tms[1].content)).toMatch(/1\s+b/);
	});

	it('injects a FRESH sandbox listing into the system prompt on every round', async () => {
		// The exact wiring local-backend.ts uses: a callable systemPrompt that
		// snapshots the bridge's listing at each model call.
		const model = new FakeChatModel([
			bashCall('touch minted-this-turn.txt', 'call_f1'),
			new AIMessage('There it is — `touch` created the file.')
		]);
		const bridge = await createBashBridge({});
		const bash: AgentBash = {
			propose: (cmd) => bridge.propose(cmd),
			run: (cmd) => bridge.run(cmd),
			listing: () => bridge.listing()
		};
		const agent = createCourseAgent({
			model: model as unknown as BaseChatModel,
			tools: buildAgentTools({ bash }),
			systemPrompt: () => tutorSystemPrompt(bash.listing?.() ?? null),
			interruptOn: ['bash']
		});

		const paused = await agent.start('make me a file');
		expect(paused.status).toBe('interrupted');
		const done = await agent.resume({ type: 'approve' });
		expect(done.status).toBe('done');

		expect(model.calls).toHaveLength(2);
		const sys1 = String(model.calls[0][0].content);
		const sys2 = String(model.calls[1][0].content);
		// Both rounds carry the seeded home…
		expect(sys1).toContain('FILES IN YOUR SANDBOX RIGHT NOW');
		expect(sys1).toContain('todo.txt');
		expect(sys1).toContain('hello.sh');
		// …but only round 2 sees the file the agent just created.
		expect(sys1).not.toContain('minted-this-turn.txt');
		expect(sys2).toContain('minted-this-turn.txt');
	});
});
