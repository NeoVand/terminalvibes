/**
 * The Agent panel's reactive store. Owns the conversation, the backend
 * selection (mock ↔ local Qwen), the download/activation state machine, and
 * abort plumbing. The local backend is dynamically imported on activation so
 * transformers.js + langgraph never weigh down the initial bundle.
 */
import { MockBackend } from './mock-backend';
import { createGate, type Gate, type GateDecision } from './gate';
import { createBashBridge, type BashBridge, type TerminalLine } from './bash-bridge';
import type { AgentBackend, AgentBash, ChatMessage, RuntimeStatus } from './types';
import {
	detectCaps,
	downloadedModels,
	forgetSelectedModel,
	getModelSpec,
	markDownloaded,
	rememberSelectedModel,
	selectedModel,
	type DeviceCaps
} from './local/models';
import type { LocalBackend } from './local/local-backend';

export type LocalPhase = 'idle' | 'downloading' | 'loading' | 'probing' | 'ready' | 'error';

export interface DownloadProgress {
	file: string | null;
	percent: number;
	status: string | null;
}

export class AgentRuntime {
	status = $state<RuntimeStatus>('idle');
	backendName = $state<'mock' | 'local'>('mock');
	messages = $state<ChatMessage[]>([]);
	/** Live note while the agent works: "searching the course for …". */
	activity = $state<string | null>(null);

	/* ── local model lifecycle ── */
	localPhase = $state<LocalPhase>('idle');
	localModelId = $state<string | null>(null);
	localDevice = $state<'webgpu' | 'wasm' | null>(null);
	localError = $state<string | null>(null);
	download = $state<DownloadProgress>({ file: null, percent: 0, status: null });
	caps = $state<DeviceCaps>({ webgpu: false, ramGb: null });
	/** Reactive mirror of the localStorage downloaded-models flags. */
	downloaded = $state<string[]>([]);

	/* ── the agent's own terminal + approval gate ── */
	terminal = $state<TerminalLine[]>([]);
	terminalOpen = $state(false);
	/** Command awaiting a human verdict (renders the inline approval card). */
	pendingCmd = $state<string | null>(null);

	#mock: AgentBackend = new MockBackend();
	#local: LocalBackend | null = null;
	#abort: AbortController | null = null;
	#warmAbort: AbortController | null = null;
	#initDone = false;
	#gate: Gate = createGate();
	#bridge: BashBridge | null = null;

	constructor() {
		this.#gate.subscribe((pending) => {
			this.pendingCmd = pending;
		});
	}

	get backend(): AgentBackend {
		return this.backendName === 'local' && this.#local ? this.#local : this.#mock;
	}

	/**
	 * Label for the header badge. NEVER the generic line while a model is
	 * active or waking — the badge tells the truth about the actual state.
	 */
	get badgeLabel(): string {
		if (this.localModelId) {
			const label = getModelSpec(this.localModelId)?.label ?? 'local model';
			if (this.backendName === 'local') return `${label} · local`;
			if (this.localBusy) return `${label} · waking…`;
		}
		return 'local · in your browser';
	}

	/** A model download/load/probe is in flight. */
	get localBusy(): boolean {
		return (
			this.localPhase === 'downloading' ||
			this.localPhase === 'loading' ||
			this.localPhase === 'probing'
		);
	}

	/** Nothing downloaded yet — the only state that shows the intro banner. */
	get firstRun(): boolean {
		return this.downloaded.length === 0;
	}

	/** Resolve the pending approval card (allow / edit / deny). */
	decide(decision: GateDecision, opts?: { cmd?: string; reason?: string }): void {
		if (this.pendingCmd === null) return;
		this.#gate.resolve(decision, opts);
	}

	/** Lazily build the sandbox bridge (browser only). */
	async #ensureBash(): Promise<AgentBash | undefined> {
		if (typeof window === 'undefined') return undefined;
		if (!this.#bridge) {
			this.#bridge = await createBashBridge({
				gate: this.#gate,
				onLine: (line) => {
					this.terminal.push(line);
					// First activity auto-expands the agent's terminal strip.
					this.terminalOpen = true;
				}
			});
		}
		return {
			propose: (cmd) => this.#bridge!.propose(cmd),
			run: (cmd) => this.#bridge!.run(cmd)
		};
	}

	/**
	 * Called when the panel first opens (browser only): sniff capabilities and,
	 * if a model was downloaded + selected before, warm it from Cache Storage —
	 * never a fresh download without an explicit click.
	 */
	initLocal(): void {
		if (this.#initDone) return;
		this.#initDone = true;
		this.caps = detectCaps();
		this.downloaded = downloadedModels();
		const remembered = selectedModel();
		if (remembered && downloadedModels().includes(remembered) && getModelSpec(remembered)) {
			void this.activateLocal(remembered);
		}
	}

	/** Explicit activation (download button, retry, model switch, revisit warm). */
	async activateLocal(modelId: string): Promise<void> {
		if (
			this.localPhase === 'downloading' ||
			this.localPhase === 'loading' ||
			this.localPhase === 'probing'
		) {
			return;
		}
		const cached = downloadedModels().includes(modelId);
		this.localError = null;
		this.localModelId = modelId;
		this.localPhase = cached ? 'loading' : 'downloading';
		this.download = { file: null, percent: 0, status: null };

		this.#warmAbort = new AbortController();
		const cancelled = new Promise<never>((_, reject) => {
			this.#warmAbort!.signal.addEventListener('abort', () =>
				reject(new Error('activation cancelled'))
			);
		});

		try {
			const { LocalBackend } = await import('./local/local-backend');
			this.#local?.dispose();
			this.#local = null;
			const backend = new LocalBackend(modelId);
			const result = await Promise.race([
				backend.warm({
					onProgress: (p) => {
						if (p.file) this.download.file = p.file;
						if (p.status) this.download.status = p.status;
						if (typeof p.progress === 'number') this.download.percent = Math.round(p.progress);
					},
					onPhase: (phase) => {
						if (phase.startsWith('warming')) this.localPhase = 'probing';
					}
				}),
				cancelled
			]);
			this.#local = backend;
			this.localDevice = result.device;
			// Breadcrumbs for the real-model smoke test (harmless in production).
			(globalThis as { __tvAgentDevice?: string }).__tvAgentDevice = result.device;
			(globalThis as { __tvAgentProbeMs?: number }).__tvAgentProbeMs = backend.probeMs ?? -1;
			markDownloaded(modelId);
			this.downloaded = downloadedModels();
			rememberSelectedModel(modelId);
			this.backendName = 'local';
			this.localPhase = 'ready';
			if (this.status === 'idle') this.status = 'ready';
		} catch (e) {
			if (e instanceof Error && e.message === 'activation cancelled') {
				// User pressed Cancel: tear down whatever was mid-flight and go
				// back to the offer state — no error banner for a chosen exit.
				const { disposeHost } = await import('./local/transformers-js');
				disposeHost();
				this.localPhase = 'idle';
				this.localModelId = null;
			} else {
				this.localPhase = 'error';
				this.localError = e instanceof Error ? e.message : String(e);
			}
			this.backendName = 'mock';
		} finally {
			this.#warmAbort = null;
		}
	}

	/** Cancel an in-flight download/warm (the Cancel affordance on the card). */
	cancelActivation(): void {
		this.#warmAbort?.abort();
	}

	/** Fall back to the scripted guide (keeps the downloaded weights cached). */
	useMock(): void {
		this.backendName = 'mock';
		forgetSelectedModel();
		if (this.localPhase === 'ready') this.localPhase = 'idle';
	}

	/** Chat entry point: append the question, stream the answer. */
	async ask(question: string): Promise<void> {
		const trimmed = question.trim();
		if (!trimmed || this.status === 'generating') return;

		this.messages.push({ role: 'user', content: trimmed });
		this.messages.push({ role: 'assistant', content: '' });
		const reply = this.messages[this.messages.length - 1];
		const history = this.messages.slice(0, -1);

		this.status = 'generating';
		this.activity = null;
		this.#abort = new AbortController();
		const bash = await this.#ensureBash();

		try {
			await this.backend.generate(history, {
				tools: false,
				signal: this.#abort.signal,
				bash,
				onEvent: (event) => {
					if (event.type === 'token') {
						this.activity = null;
						reply.content += event.text;
					} else if (event.type === 'toolCall' && event.call.name === 'bash') {
						this.activity = 'wants to run a command — see the approval card';
					} else if (event.type === 'toolCall' && event.call.name === 'search_course') {
						this.activity = event.call.args.query
							? `searching the course for “${event.call.args.query}”`
							: 'searching the course';
						(globalThis as { __tvAgentSearches?: string[] }).__tvAgentSearches?.push(
							event.call.args.query ?? ''
						);
					} else if (event.type === 'error') {
						reply.content += `${reply.content ? '\n\n' : ''}Something went wrong: ${event.message}`;
					}
				}
			});
		} catch (error) {
			reply.content += `${reply.content ? '\n\n' : ''}Something went wrong: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			if (reply.content === '') {
				// Aborted before the first token — drop the empty bubble.
				this.messages.pop();
			}
			this.activity = null;
			this.status = 'ready';
			this.#abort = null;
		}
	}

	/** Stop the in-flight generation, keeping whatever already streamed. */
	stop(): void {
		// A generation paused at the approval gate would otherwise hang the
		// abort — resolve the pending proposal as a denial first.
		if (this.pendingCmd !== null) {
			this.#gate.resolve('deny', { reason: 'generation stopped' });
		}
		this.#abort?.abort();
	}

	clear(): void {
		this.stop();
		this.messages = [];
	}
}

export const agentRuntime = new AgentRuntime();
