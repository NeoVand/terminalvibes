/**
 * Shared contracts for the Agent runtime. Every backend — the deterministic
 * mock shipping now, the transformers.js local model landing next phase —
 * implements `AgentBackend`, so the UI and the approval gate never know
 * which one is talking.
 */

export interface ChatMessage {
	role: 'user' | 'assistant' | 'system' | 'tool';
	content: string;
	/** Links a `role: 'tool'` result back to the ToolCall that produced it. */
	toolCallId?: string;
}

export interface ToolCall {
	id: string;
	name: 'bash' | 'done' | 'search_course';
	args: { cmd?: string; summary?: string; query?: string };
}

export type AgentEvent =
	| { type: 'token'; text: string }
	| { type: 'toolCall'; call: ToolCall }
	| { type: 'doneTurn' }
	| { type: 'error'; message: string };

export interface GenerateOptions {
	/** Enable the bash/done tool loop instead of plain chat. */
	tools?: boolean;
	/** Skip streaming delays (tests, prefetch). Test mode always skips. */
	instant?: boolean;
	onEvent: (e: AgentEvent) => void;
	signal?: AbortSignal;
}

export interface AgentBackend {
	readonly name: string;
	generate(messages: ChatMessage[], opts: GenerateOptions): Promise<void>;
}

export type RuntimeStatus = 'unavailable' | 'idle' | 'ready' | 'generating';
