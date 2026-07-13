/**
 * The Agent panel's reactive store. Owns the conversation, the active
 * backend, and abort plumbing. The backend hides behind `AgentBackend`, so
 * swapping the mock for the transformers.js local model next phase is a
 * one-line change here and zero changes in the UI.
 */
import { MockBackend } from './mock-backend';
import type { AgentBackend, ChatMessage, RuntimeStatus } from './types';

export class AgentRuntime {
	status = $state<RuntimeStatus>('idle');
	backendName = $state<'mock' | 'local'>('mock');
	messages = $state<ChatMessage[]>([]);

	#backend: AgentBackend = new MockBackend();
	#abort: AbortController | null = null;

	get backend(): AgentBackend {
		return this.#backend;
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
		this.#abort = new AbortController();

		try {
			await this.#backend.generate(history, {
				tools: false,
				signal: this.#abort.signal,
				onEvent: (event) => {
					if (event.type === 'token') {
						reply.content += event.text;
					} else if (event.type === 'error') {
						reply.content += `\n\nSomething went wrong: ${event.message}`;
					}
				}
			});
		} catch (error) {
			reply.content += `\n\nSomething went wrong: ${error instanceof Error ? error.message : String(error)}`;
		} finally {
			if (reply.content === '') {
				// Aborted before the first token — drop the empty bubble.
				this.messages.pop();
			}
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
