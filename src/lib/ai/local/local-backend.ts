/**
 * The real local backend: Qwen3.5 via transformers.js in a Web Worker, driven
 * through the trimmed deep-agents loop with the search_course tool (agentic
 * RAG — the model decides when to search the course). Implements the same
 * `AgentBackend` interface as the mock, so the runtime and panel don't care
 * which is talking.
 */
import { HumanMessage, AIMessage, type BaseMessage } from '@langchain/core/messages';
import type { AgentBackend, AgentBash, ChatMessage, GenerateOptions } from '../types';
import { TransformersJsChatModel, disposeHost, type TjsProgress } from './transformers-js';
import { createCourseAgent, type CourseAgent } from './deepagent';
import { buildAgentTools, TUTOR_SYSTEM_PROMPT } from './tools';
import { attemptCascade, detectCaps, getModelSpec, type LocalModelSpec } from './models';

export interface WarmResult {
	device: 'webgpu' | 'wasm';
	/** Milliseconds the timed tiny generation took on the accepted device. */
	probeMs: number;
}

export interface WarmOptions {
	onProgress?: (p: TjsProgress) => void;
	/** Phase notes for the UI: 'loading (webgpu)…', 'warming up (wasm)…'. */
	onPhase?: (phase: string) => void;
	initTimeoutMs?: number;
	probeTimeoutMs?: number;
}

function withTimeout<T>(p: Promise<T>, ms: number, label: string): Promise<T> {
	return new Promise<T>((resolve, reject) => {
		const timer = setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms);
		p.then(
			(v) => {
				clearTimeout(timer);
				resolve(v);
			},
			(e) => {
				clearTimeout(timer);
				reject(e);
			}
		);
	});
}

export class LocalBackend implements AgentBackend {
	readonly name = 'local';
	readonly spec: LocalModelSpec;
	device: 'webgpu' | 'wasm' | null = null;
	probeMs: number | null = null;
	/** Which devices survived (or failed) the warm-up probe. */
	probed: { webgpu?: boolean; wasm?: boolean } = {};

	#model: TransformersJsChatModel | null = null;
	#agent: CourseAgent | null = null;
	#bash: AgentBash | null = null;
	#thread = `chat-${Date.now()}`;
	#turnsInThread = 0;

	constructor(modelId: string) {
		const spec = getModelSpec(modelId);
		if (!spec) throw new Error(`Unknown local model: ${modelId}`);
		this.spec = spec;
	}

	/**
	 * Load the model with LangX's kokoro-style warm-up guard: walk the device
	 * cascade (webgpu → wasm where allowed), and only accept a device after a
	 * timed tiny generation actually produces text — a pipeline that loads but
	 * can't generate (broken WebGPU adapters do exactly this) falls through to
	 * the next device instead of shipping a dead chatbot.
	 */
	async warm(opts: WarmOptions = {}): Promise<WarmResult> {
		const attempts = attemptCascade(this.spec, detectCaps());
		if (attempts.length === 0) {
			throw new Error(`${this.spec.label} is not supported on this device.`);
		}
		const initTimeout = opts.initTimeoutMs ?? 600_000; // first run downloads weights
		const probeTimeout = opts.probeTimeoutMs ?? 120_000; // first inference compiles kernels

		let lastError: Error | null = null;
		for (const device of attempts) {
			try {
				opts.onPhase?.(`loading (${device})`);
				const model = new TransformersJsChatModel({
					model: this.spec.id,
					dtype: this.spec.dtype,
					device,
					maxNewTokens: 512,
					temperature: 0.2,
					onProgress: opts.onProgress
				});
				await withTimeout(model.warm(opts.onProgress), initTimeout, `${device} init`);

				opts.onPhase?.(`warming up (${device})`);
				const started = performance.now();
				const out = await withTimeout(
					model.host.generate(
						[new HumanMessage('Reply with the single word: ok')],
						undefined,
						false,
						undefined,
						8
					),
					probeTimeout,
					`${device} warm-up generate`
				);
				if (typeof out !== 'string') throw new Error('warm-up produced no text');
				this.probeMs = Math.round(performance.now() - started);
				this.probed[device] = true;
				this.device = device;
				this.#model = model;
				this.#agent = null;
				return { device, probeMs: this.probeMs };
			} catch (e) {
				this.probed[device] = false;
				lastError = e instanceof Error ? e : new Error(String(e));
				// Drop the failed worker before trying the next device.
				disposeHost();
			}
		}
		throw lastError ?? new Error('No usable device for the local model.');
	}

	#ensureAgent(onEvent: GenerateOptions['onEvent']): CourseAgent {
		if (!this.#model) throw new Error('LocalBackend.warm() must succeed before generate().');
		if (!this.#agent) {
			// The bash tool executes through a delegate so the bridge handed to
			// the CURRENT generate() call is always the one that runs — the
			// agent (and its tool closures) is built once per backend.
			const bashDelegate: AgentBash = {
				propose: (cmd) => {
					if (!this.#bash) return Promise.resolve({ decision: 'deny' as const, cmd });
					return this.#bash.propose(cmd);
				},
				run: (cmd) => {
					if (!this.#bash) throw new Error('No sandbox terminal is available right now.');
					return this.#bash.run(cmd);
				}
			};
			this.#agent = createCourseAgent({
				model: this.#model,
				tools: buildAgentTools({ bash: bashDelegate }),
				systemPrompt: TUTOR_SYSTEM_PROMPT,
				// Every bash call pauses for a human verdict BEFORE executing.
				interruptOn: ['bash'],
				hooks: {
					onToolCall: (name, args) => {
						onEvent({
							type: 'toolCall',
							call: {
								id: `call-${Date.now().toString(36)}`,
								name: name === 'search_course' ? 'search_course' : 'bash',
								args: {
									query: typeof args.query === 'string' ? args.query : undefined,
									cmd: typeof args.cmd === 'string' ? args.cmd : undefined
								}
							}
						});
					}
				},
				maxIterations: 12
			});
		}
		return this.#agent;
	}

	async generate(messages: ChatMessage[], opts: GenerateOptions): Promise<void> {
		const { onEvent, signal } = opts;
		if (signal?.aborted) return;

		const question = [...messages].reverse().find((m) => m.role === 'user')?.content ?? '';
		// A fresh conversation (first user turn) gets a fresh checkpointer thread;
		// within a conversation the MemorySaver carries the full agent history.
		const userTurns = messages.filter((m) => m.role === 'user').length;
		if (userTurns <= 1 || userTurns <= this.#turnsInThread) {
			this.#thread = `chat-${Date.now()}`;
			this.#turnsInThread = 0;
		}
		this.#turnsInThread = userTurns;

		this.#bash = opts.bash ?? null;
		const agent = this.#ensureAgent(onEvent);

		try {
			let result = await agent.start(question, this.#thread);

			// The interrupt loop: every gated bash call surfaces as an approval
			// card (gate.propose) and the human's verdict resumes the graph.
			while (result.status === 'interrupted') {
				if (signal?.aborted) return;
				const cmd = String(result.interrupt.args.cmd ?? '');
				if (result.interrupt.tool !== 'bash' || !this.#bash) {
					result = await agent.resume(
						{ type: 'reject', message: 'No sandbox terminal is available right now.' },
						this.#thread
					);
					continue;
				}
				onEvent({
					type: 'toolCall',
					call: { id: `gate-${Date.now().toString(36)}`, name: 'bash', args: { cmd } }
				});
				const verdict = await this.#bash.propose(cmd);
				if (signal?.aborted) return;
				const decision =
					verdict.decision === 'allow'
						? ({ type: 'approve' } as const)
						: verdict.decision === 'edit'
							? ({ type: 'edit', args: { cmd: verdict.cmd } } as const)
							: ({ type: 'reject', message: verdict.reason } as const);
				result = await agent.resume(decision, this.#thread);
			}
			if (signal?.aborted) return;
			const answer = finalAnswer(result.messages);

			// The model generates with tools bound (no token stream from the
			// worker), so stream the finished answer to the panel word-by-word —
			// real model output, panel-side pacing.
			const instant = opts.instant || import.meta.env.MODE === 'test';
			for (const word of answer.match(/\S+\s*/g) ?? []) {
				if (signal?.aborted) return;
				onEvent({ type: 'token', text: word });
				if (!instant) await new Promise((r) => setTimeout(r, 12));
			}
			if (signal?.aborted) return;
			onEvent({ type: 'doneTurn' });
		} catch (e) {
			if (signal?.aborted) return;
			onEvent({ type: 'error', message: e instanceof Error ? e.message : String(e) });
			onEvent({ type: 'doneTurn' });
		}
	}

	dispose() {
		disposeHost();
		this.#model = null;
		this.#agent = null;
		this.device = null;
	}
}

function finalAnswer(messages: BaseMessage[]): string {
	for (let i = messages.length - 1; i >= 0; i--) {
		const m = messages[i];
		if (m instanceof AIMessage) {
			const text = typeof m.content === 'string' ? m.content : JSON.stringify(m.content);
			if (text.trim()) return text.trim();
		}
	}
	return "I couldn't produce an answer for that — try rephrasing your question.";
}
