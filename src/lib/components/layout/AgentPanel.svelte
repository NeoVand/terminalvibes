<script lang="ts">
	import { tick } from 'svelte';
	import { Bot, X, ArrowUp, Square, ChevronRight, ArrowRight } from 'lucide-svelte';
	import { autohideScroll } from '$lib/actions/autohide-scroll';
	import { agentRuntime } from '$lib/ai/runtime.svelte';
	import { titleForId } from '$lib/ai/retrieval';

	let {
		open = false,
		onToggle,
		onNavigate
	}: {
		open: boolean;
		onToggle: () => void;
		onNavigate?: (id: string) => void;
	} = $props();

	let hasOpened = $state(false);
	let noticeDismissed = $state(false);
	let input = $state('');
	let taEl: HTMLTextAreaElement | undefined = $state(undefined);
	let messagesEl: HTMLDivElement | undefined = $state(undefined);

	const starters = [
		'What does chmod +x do?',
		'Is rm -rf build/ safe to approve?',
		'How do pipes work?'
	];

	$effect(() => {
		if (open) {
			hasOpened = true;
			// Autofocus on desktop only — on mobile the keyboard would cover
			// the panel before the user has read anything.
			if (window.innerWidth >= 768) {
				tick().then(() => taEl?.focus());
			}
		}
	});

	// Follow the streaming answer.
	$effect(() => {
		const last = agentRuntime.messages.at(-1);
		void last?.content;
		if (messagesEl) {
			messagesEl.scrollTop = messagesEl.scrollHeight;
		}
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onToggle();
		}
	}

	function send() {
		const question = input.trim();
		if (!question || agentRuntime.status === 'generating') return;
		input = '';
		if (taEl) taEl.style.height = 'auto';
		void agentRuntime.ask(question);
	}

	/** The composer grows with the draft, up to a few lines. */
	function autoGrow() {
		if (!taEl) return;
		taEl.style.height = 'auto';
		taEl.style.height = `${Math.min(taEl.scrollHeight, 128)}px`;
	}

	function onComposerKey(e: KeyboardEvent) {
		if (e.key === 'Enter' && !e.shiftKey) {
			e.preventDefault();
			send();
		}
	}

	function askStarter(question: string) {
		if (agentRuntime.status === 'generating') return;
		void agentRuntime.ask(question);
	}

	function navigateTo(id: string) {
		if (onNavigate) {
			onNavigate(id);
		} else {
			window.location.hash = id;
		}
	}

	type Segment =
		| { kind: 'text'; value: string }
		| { kind: 'code'; value: string }
		| { kind: 'cite'; id: string; label: string };

	/** Split assistant text into plain text, `code` spans, and [[id]] cites. */
	function segments(content: string): Segment[] {
		const out: Segment[] = [];
		const pattern = /\[\[([a-z0-9-]+)\]\]|`([^`]+)`/g;
		let cursor = 0;
		for (const match of content.matchAll(pattern)) {
			if (match.index > cursor) {
				out.push({ kind: 'text', value: content.slice(cursor, match.index) });
			}
			if (match[1] !== undefined) {
				const title = titleForId(match[1]);
				if (title) {
					out.push({ kind: 'cite', id: match[1], label: title });
				}
				// Unknown ids (or cheat-sheet domains without an anchor) render
				// nothing rather than a dead link.
			} else {
				out.push({ kind: 'code', value: match[2] });
			}
			cursor = match.index + match[0].length;
		}
		if (cursor < content.length) {
			out.push({ kind: 'text', value: content.slice(cursor) });
		}
		return out;
	}

	/** Cheat-sheet chunks have no page anchor — only sections get link chips. */
	function isAnchor(id: string): boolean {
		return !id.startsWith('cheat-');
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<button
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
		onclick={onToggle}
		aria-label="Close agent"
	></button>
{/if}

<aside
	class="agent-panel fixed top-0 right-0 bottom-0 z-40 flex w-full flex-col border-l shadow-2xl transition-transform duration-200 ease-out md:w-[min(40vw,36rem)]"
	style="padding-top: var(--header-height); border-color: var(--color-border);"
	class:translate-x-0={open}
	class:translate-x-full={!open}
	aria-hidden={!open}
	aria-label="Agent"
>
	{#if hasOpened}
		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<header
				class="flex shrink-0 items-center gap-2 px-3 py-2 sm:gap-2.5 sm:px-5 sm:py-3"
				style="background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent); border-bottom: 1px solid var(--color-border);"
			>
				<Bot size={14} style="color: var(--color-important);" />
				<span class="text-sm font-semibold" style="color: var(--color-text);">Agent</span>
				<span class="agent-badge hidden sm:inline">local · in your browser</span>

				<div class="ml-auto flex items-center gap-1.5 sm:gap-2">
					<button type="button" onclick={onToggle} class="agent-icon-btn" aria-label="Close agent">
						<X size={14} />
					</button>
				</div>
			</header>

			{#if !noticeDismissed}
				<div
					class="relative shrink-0 px-3 py-2.5 text-[11px] leading-relaxed sm:px-5 sm:text-xs"
					style="color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-important) 6%, transparent);"
				>
					Right now I'm a <strong style="color: var(--color-text);">scripted guide</strong> — I
					answer strictly from the course lessons, with links to the source. The real local model
					(~450 MB, runs entirely in your browser) arrives soon.
					<button
						type="button"
						onclick={() => (noticeDismissed = true)}
						class="absolute top-2 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-opacity hover:opacity-70"
						style="color: var(--color-text-muted);"
						aria-label="Dismiss notice"
					>
						<X size={12} />
					</button>
				</div>
			{/if}

			<div
				bind:this={messagesEl}
				class="autohide-scrollbar min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5"
				use:autohideScroll
				data-testid="agent-messages"
			>
				{#if agentRuntime.messages.length === 0}
					<div class="flex h-full flex-col items-center justify-center gap-4 text-center">
						<Bot size={28} style="color: var(--color-important); opacity: 0.7;" />
						<p class="max-w-xs text-sm" style="color: var(--color-text-secondary);">
							Ask anything about the terminal — answers come straight from the course, with links to
							the right section.
						</p>
						<div class="flex flex-col items-stretch gap-2">
							{#each starters as starter (starter)}
								<button type="button" class="agent-chip" onclick={() => askStarter(starter)}>
									<span class="truncate">{starter}</span>
									<ChevronRight size={12} class="shrink-0" />
								</button>
							{/each}
						</div>
					</div>
				{:else}
					<div class="flex flex-col gap-3">
						{#each agentRuntime.messages as message, i (i)}
							{#if message.role === 'user'}
								<div class="flex justify-end">
									<div
										class="agent-msg-user max-w-[85%] rounded-xl rounded-br-sm px-3 py-2 text-[13px] leading-relaxed"
									>
										{message.content}
									</div>
								</div>
							{:else if message.role === 'assistant'}
								<div
									class="agent-msg-assistant max-w-full text-[13.5px] leading-relaxed"
									data-role="assistant"
								>
									{#each segments(message.content) as segment, j (j)}
										{#if segment.kind === 'text'}
											{segment.value}
										{:else if segment.kind === 'code'}
											<code class="agent-code">{segment.value}</code>
										{:else if isAnchor(segment.id)}
											<a
												href="#{segment.id}"
												class="agent-cite"
												onclick={(e) => {
													e.preventDefault();
													navigateTo(segment.id);
												}}
											>
												<ArrowRight size={10} />
												{segment.label}
											</a>
										{:else}
											<span class="agent-cite agent-cite-static">{segment.label}</span>
										{/if}
									{/each}
									{#if agentRuntime.status === 'generating' && i === agentRuntime.messages.length - 1}
										<span class="agent-cursor" aria-hidden="true"></span>
									{/if}
								</div>
							{/if}
						{/each}
					</div>
				{/if}
			</div>

			<!-- Seamless composer: a label so clicking anywhere focuses the field;
			     the send affordance floats in the corner over the same surface.
			     No box around the typing area — just a hairline separator. -->
			<label class="agent-composer shrink-0">
				<textarea
					bind:this={taEl}
					bind:value={input}
					rows="1"
					class="agent-text-in"
					placeholder="Ask about a command…"
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					enterkeyhint="send"
					aria-label="Ask the agent"
					oninput={autoGrow}
					onkeydown={onComposerKey}
				></textarea>
				{#if agentRuntime.status === 'generating'}
					<button
						type="button"
						onclick={() => agentRuntime.stop()}
						class="agent-send"
						aria-label="Stop generating"
					>
						<Square size={12} />
					</button>
				{:else}
					<button
						type="button"
						onclick={send}
						class="agent-send"
						disabled={!input.trim()}
						aria-label="Send question"
					>
						<ArrowUp size={16} strokeWidth={2.5} />
					</button>
				{/if}
			</label>
		</div>
	{/if}
</aside>

<style>
	.agent-panel {
		background: color-mix(in srgb, var(--color-bg-secondary) 62%, transparent);
		backdrop-filter: blur(24px) saturate(1.4);
		-webkit-backdrop-filter: blur(24px) saturate(1.4);
	}

	.agent-badge {
		border-radius: 9999px;
		padding: 0.175rem 0.5rem;
		font-size: 10px;
		font-weight: 600;
		color: var(--color-important);
		background: color-mix(in srgb, var(--color-important) 12%, var(--color-bg-tertiary));
	}

	.agent-icon-btn {
		display: inline-flex;
		height: 1.875rem;
		width: 1.875rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.agent-icon-btn:hover {
		border-color: var(--color-important);
		color: var(--color-important);
	}

	.agent-chip {
		display: inline-flex;
		cursor: pointer;
		align-items: center;
		gap: 0.375rem;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: 0.375rem 0.625rem;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-secondary);
		transition:
			border-color 0.15s ease,
			color 0.15s ease;
	}

	.agent-chip:hover {
		border-color: var(--color-important);
		color: var(--color-important);
	}

	.agent-msg-user {
		background: color-mix(in srgb, var(--color-important) 10%, var(--color-surface));
		border: 1px solid color-mix(in srgb, var(--color-important) 25%, transparent);
		color: var(--color-text);
	}

	.agent-msg-assistant {
		color: var(--color-text-secondary);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}

	.agent-code {
		border-radius: 0.25rem;
		background: var(--color-code-bg);
		padding: 0.1rem 0.3rem;
		font-family: var(--font-mono);
		font-size: 12px;
		color: var(--color-code-text);
	}

	.agent-cite {
		display: inline-flex;
		align-items: center;
		gap: 0.2rem;
		margin: 0 0.15rem;
		border-radius: 9999px;
		border: 1px solid color-mix(in srgb, var(--color-primary) 35%, transparent);
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
		padding: 0.05rem 0.5rem;
		font-size: 11px;
		font-weight: 600;
		color: var(--color-primary-text);
		text-decoration: none;
		transition:
			border-color 0.15s ease,
			background 0.15s ease;
		vertical-align: baseline;
	}

	.agent-cite:hover {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.agent-cite-static {
		cursor: default;
	}

	/* ── Composer: flat, no box, LangX-lesson style ─────────────────────── */
	.agent-composer {
		position: relative;
		display: block;
		margin: 0;
		border: none;
		border-top: 1px solid var(--color-border);
		border-radius: 0;
		background: transparent;
		padding: 0.75rem 3rem 0.75rem 1.25rem;
		cursor: text;
	}

	/* Seamless field: strip every surface the browser or the forms plugin
	   would paint (border, ring, shadow, background) — the composer itself
	   is the surface, so focus shows only the caret. Same treatment as the
	   playground's .pg-input. */
	.agent-text-in,
	.agent-text-in:focus {
		display: block;
		width: 100%;
		min-height: 1.5rem;
		max-height: 8rem;
		padding: 0;
		border: none;
		border-radius: 0;
		outline: none;
		box-shadow: none;
		background: transparent;
		appearance: none;
		-webkit-appearance: none;
		resize: none;
		font-family: var(--font-mono);
		font-size: 13px;
		line-height: 1.5;
		color: var(--color-text);
		caret-color: var(--color-important);
	}

	.agent-text-in::placeholder {
		color: var(--color-text-muted);
		opacity: 0.55;
	}

	.agent-send {
		position: absolute;
		right: 0.75rem;
		bottom: 0.6rem;
		display: inline-flex;
		height: 1.75rem;
		width: 1.75rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		border: none;
		background: var(--color-important);
		color: var(--color-text-inverse);
		transition:
			opacity 0.15s ease,
			transform 0.15s ease;
	}

	.agent-send:hover:not(:disabled) {
		transform: translateY(-1px);
	}

	.agent-send:disabled {
		opacity: 0.35;
		cursor: default;
	}

	/* Streaming caret, borrowed from the playground's idle cursor. */
	.agent-cursor {
		display: inline-block;
		width: 0.55em;
		height: 1em;
		margin-left: 2px;
		vertical-align: text-bottom;
		background: var(--color-important);
		animation: agent-blink 1s steps(1) infinite;
	}

	@keyframes agent-blink {
		50% {
			opacity: 0;
		}
	}
</style>
