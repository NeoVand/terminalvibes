/**
 * The Agent panel's reactive store. Owns the conversation, the backend
 * selection (mock ↔ local Qwen), the download/activation state machine, and
 * abort plumbing. The local backend is dynamically imported on activation so
 * transformers.js + langgraph never weigh down the initial bundle.
 */
import { MockBackend } from './mock-backend';
import type { AgentBackend, ChatMessage, RuntimeStatus } from './types';
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

	#mock: AgentBackend = new MockBackend();
	#local: LocalBackend | null = null;
	#abort: AbortController | null = null;
	#warmAbort: AbortController | null = null;
	#initDone = false;

	get backend(): AgentBackend {
		return this.backendName === 'local' && this.#local ? this.#local : this.#mock;
	}

	/** Label for the header badge: model when local, honest mock note otherwise. */
	get badgeLabel(): string {
		if (this.backendName === 'local' && this.localModelId) {
			return `${getModelSpec(this.localModelId)?.label ?? 'local model'} · local`;
		}
		return 'local · in your browser';
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

		try {
			await this.backend.generate(history, {
				tools: false,
				signal: this.#abort.signal,
				onEvent: (event) => {
					if (event.type === 'token') {
						this.activity = null;
						reply.content += event.text;
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
		this.#abort?.abort();
	}

	clear(): void {
		this.stop();
		this.messages = [];
	}
}

export const agentRuntime = new AgentRuntime();
