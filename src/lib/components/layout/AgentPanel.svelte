<script lang="ts">
	import { tick } from 'svelte';
	import {
		Bot,
		X,
		ArrowUp,
		Square,
		ChevronRight,
		ArrowRight,
		Check,
		Download,
		RotateCcw,
		Search,
		Settings
	} from 'lucide-svelte';
	import { autohideScroll } from '$lib/actions/autohide-scroll';
	import { agentRuntime } from '$lib/ai/runtime.svelte';
	import {
		canRunModel,
		DEFAULT_MODEL_ID,
		getModelSpec,
		QUALITY_MODEL_ID,
		type LocalModelSpec
	} from '$lib/ai/local/models';
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
	let modelCardDismissed = $state(false);
	let settingsOpen = $state(false);
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
			// Capability sniff + auto-warm of a previously downloaded model
			// (from Cache Storage — never a fresh download without a click).
			agentRuntime.initLocal();
			// Autofocus on desktop only — on mobile the keyboard would cover
			// the panel before the user has read anything.
			if (window.innerWidth >= 768) {
				tick().then(() => taEl?.focus());
			}
		}
	});

	const defaultSpec = getModelSpec(DEFAULT_MODEL_ID)!;
	const qualitySpec = getModelSpec(QUALITY_MODEL_ID)!;
	const busyPhases = ['downloading', 'loading', 'probing'] as const;
	let localBusy = $derived((busyPhases as readonly string[]).includes(agentRuntime.localPhase));
	let activeLocalId = $derived(
		agentRuntime.backendName === 'local' ? agentRuntime.localModelId : null
	);

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

{#snippet modelCard(spec: LocalModelSpec, tint: 'tan' | 'amber')}
	{@const gate = canRunModel(spec, agentRuntime.caps)}
	{@const downloaded = agentRuntime.downloaded.includes(spec.id)}
	{@const active = activeLocalId === spec.id}
	{@const busy = localBusy && agentRuntime.localModelId === spec.id}
	{@const sizeLabel =
		spec.sizeMb >= 1000 ? `${(spec.sizeMb / 1000).toFixed(1)} GB` : `${spec.sizeMb} MB`}
	<div
		class="agent-model-card agent-model-{tint}"
		class:active
		class:dimmed={!gate.ok || (!downloaded && !busy)}
	>
		<span class="agent-model-name">{spec.label}</span>
		<span class="agent-model-meta">
			~{sizeLabel} · {spec.requiresWebGpu ? 'better answers · needs WebGPU' : 'runs anywhere'}
		</span>
		{#if active}
			<span class="agent-model-active"><Check size={9} /> active</span>
		{/if}
		{#if busy}
			<div class="agent-model-progress" role="status" aria-live="polite">
				{#if agentRuntime.localPhase === 'downloading'}
					<span class="agent-model-pct">
						{agentRuntime.download.percent}% · {Math.round(
							(spec.sizeMb * agentRuntime.download.percent) / 100
						)} / {spec.sizeMb} MB
					</span>
				{:else if agentRuntime.localPhase === 'loading'}
					<span class="agent-model-pct">loading into memory…</span>
				{:else}
					<span class="agent-model-pct">warming up…</span>
				{/if}
				<button
					type="button"
					class="agent-model-cancel"
					onclick={() => agentRuntime.cancelActivation()}
				>
					Cancel
				</button>
				<div class="agent-model-track" aria-hidden="true">
					{#if agentRuntime.localPhase === 'downloading'}
						<div class="agent-model-fill" style:width="{agentRuntime.download.percent}%"></div>
					{:else}
						<div class="agent-model-fill indeterminate"></div>
					{/if}
				</div>
			</div>
		{:else if !downloaded}
			<!-- Download gates activation: until the weights are local, the only
			     live affordance is the download itself (and not even that when
			     the device can't run the model — no 1.3 GB bricks). -->
			<button
				type="button"
				class="agent-model-dl"
				disabled={!gate.ok || localBusy}
				onclick={() => agentRuntime.activateLocal(spec.id)}
			>
				<Download size={11} />
				Download · {sizeLabel}
			</button>
		{:else if !active}
			<button
				type="button"
				class="agent-model-use"
				disabled={!gate.ok || localBusy}
				onclick={() => agentRuntime.activateLocal(spec.id)}
			>
				Use this model
			</button>
		{/if}
		{#if !gate.ok}
			<span class="agent-model-reason">{gate.reason}</span>
		{/if}
	</div>
{/snippet}

{#snippet modelPicker()}
	<!-- The two local models, side by side: tan 0.8B, amber 2B — clearly
	     siblings, each carrying its own download / activate lifecycle. -->
	<div class="agent-model-grid">
		{@render modelCard(defaultSpec, 'tan')}
		{@render modelCard(qualitySpec, 'amber')}
	</div>
{/snippet}

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
				<span class="agent-badge hidden sm:inline">{agentRuntime.badgeLabel}</span>

				<div class="ml-auto flex items-center gap-1.5 sm:gap-2">
					<button
						type="button"
						onclick={() => (settingsOpen = !settingsOpen)}
						class="agent-icon-btn"
						class:agent-icon-btn-on={settingsOpen}
						aria-label="Agent settings"
						aria-expanded={settingsOpen}
					>
						<Settings size={14} />
					</button>
					<button type="button" onclick={onToggle} class="agent-icon-btn" aria-label="Close agent">
						<X size={14} />
					</button>
				</div>
			</header>

			{#if settingsOpen}
				<button
					class="agent-settings-backdrop"
					type="button"
					aria-label="Close settings"
					onclick={() => (settingsOpen = false)}
				></button>
				<div class="agent-settings" role="dialog" aria-label="Agent settings">
					<!-- A tiny settings list — future entries (generation speed,
					     clear conversation, …) append as further .agent-setting rows. -->
					<div class="agent-setting">
						<p class="agent-setting-label">Model</p>
						{@render modelPicker()}
					</div>
					<div class="agent-setting">
						<p class="agent-setting-label">Mode</p>
						{#if agentRuntime.backendName === 'local'}
							<button type="button" class="agent-mode-link" onclick={() => agentRuntime.useMock()}>
								use scripted mode
							</button>
						{:else}
							<p class="agent-card-note">Scripted guide (answers come from the course index).</p>
						{/if}
					</div>
				</div>
			{/if}

			{#if agentRuntime.backendName !== 'local'}
				{#if agentRuntime.localPhase === 'error'}
					<div class="agent-card relative shrink-0">
						<p class="agent-card-title">
							The local model couldn't start: <span style="color: var(--color-caution);"
								>{agentRuntime.localError}</span
							>
						</p>
						<div class="mt-2 flex items-center gap-2">
							<button
								type="button"
								class="agent-dl-btn"
								onclick={() =>
									agentRuntime.activateLocal(agentRuntime.localModelId ?? DEFAULT_MODEL_ID)}
							>
								<RotateCcw size={12} />
								Retry
							</button>
							<span class="agent-card-note"
								>Meanwhile I'll keep answering as the scripted guide.</span
							>
						</div>
					</div>
				{:else if !modelCardDismissed}
					<div class="agent-card relative shrink-0">
						<p class="agent-card-title">
							Right now I'm a <strong>scripted guide</strong> answering strictly from the lessons. Want
							the real thing? Download a model once — it runs entirely in your browser.
						</p>
						<div class="mt-2">
							{@render modelPicker()}
						</div>
						<button
							type="button"
							onclick={() => (modelCardDismissed = true)}
							class="absolute top-2 right-2 flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-opacity hover:opacity-70"
							style="color: var(--color-text-muted);"
							aria-label="Use scripted mode"
						>
							<X size={12} />
						</button>
					</div>
				{/if}
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
										<span class="agent-caret terminal-caret" aria-hidden="true"></span>
									{/if}
								</div>
							{/if}
						{/each}
						{#if agentRuntime.activity}
							<div class="agent-activity" role="status">
								<Search size={11} class="shrink-0" />
								{agentRuntime.activity}
							</div>
						{/if}
					</div>
				{/if}
			</div>

			{#if agentRuntime.backendName === 'local'}
				<div class="agent-mode-row shrink-0">
					<span
						>{agentRuntime.badgeLabel}{agentRuntime.localDevice
							? ` · ${agentRuntime.localDevice}`
							: ''}</span
					>
					<button type="button" class="agent-mode-link" onclick={() => agentRuntime.useMock()}>
						use scripted mode
					</button>
				</div>
			{/if}

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
		background: var(--panel-glass);
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

	/* The shared .terminal-caret (layout.css) supplies size, phosphor color,
	   and the 1.1s step blink — identical to the playground's idle cursor.
	   Here it only needs to sit inline at the streaming text tip. */
	.agent-caret {
		display: inline-block;
		margin-left: 2px;
		vertical-align: text-bottom;
	}

	/* ── Local-model card (download offer / progress / error) ───────────── */
	.agent-card {
		padding: 0.625rem 0.75rem 0.75rem;
		border-bottom: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-important) 6%, transparent);
	}

	@media (min-width: 640px) {
		.agent-card {
			padding-left: 1.25rem;
			padding-right: 1.25rem;
		}
	}

	.agent-card-title {
		font-size: 11.5px;
		line-height: 1.5;
		color: var(--color-text-secondary);
	}

	.agent-card-title strong {
		color: var(--color-text);
	}

	.agent-card-note {
		font-size: 10.5px;
		color: var(--color-text-muted);
	}

	.agent-dl-btn {
		display: inline-flex;
		cursor: pointer;
		align-items: center;
		gap: 0.4rem;
		border-radius: 0.5rem;
		border: 1px solid color-mix(in srgb, var(--color-important) 45%, transparent);
		background: color-mix(in srgb, var(--color-important) 12%, var(--color-surface));
		padding: 0.375rem 0.625rem;
		text-align: left;
		font-size: 11px;
		font-weight: 600;
		line-height: 1.4;
		color: var(--color-important);
		transition: border-color 0.15s ease;
	}

	.agent-dl-btn:hover {
		border-color: var(--color-important);
	}

	@keyframes agent-dl-slide {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(320%);
		}
	}

	@media (prefers-reduced-motion: reduce) {
		.agent-model-fill.indeterminate {
			animation: none;
			width: 100%;
			opacity: 0.5;
		}
	}

	/* Live "searching the course…" note while the agent uses a tool. */
	.agent-activity {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		font-family: var(--font-mono);
		font-size: 11px;
		font-style: italic;
		color: var(--color-text-muted);
	}

	/* Slim mode row above the composer when the real model is active. */
	.agent-mode-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 0.5rem;
		padding: 0.25rem 1.25rem;
		font-size: 10px;
		color: var(--color-text-muted);
		border-top: 1px solid var(--color-border-light);
	}

	.agent-mode-link {
		cursor: pointer;
		border: none;
		background: transparent;
		padding: 0;
		font-size: 10px;
		color: var(--color-text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.agent-mode-link:hover {
		color: var(--color-important);
	}

	/* ── Settings popover (gear in the header) ──────────────────────────── */
	.agent-icon-btn-on {
		border-color: var(--color-important);
		color: var(--color-important);
	}

	.agent-settings-backdrop {
		position: fixed;
		inset: 0;
		z-index: 45;
		border: 0;
		padding: 0;
		background: transparent;
		cursor: default;
	}

	.agent-settings {
		position: absolute;
		top: calc(var(--header-height) + 3rem);
		right: 0.75rem;
		z-index: 46;
		width: min(22rem, calc(100% - 1.5rem));
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
		padding: 0.75rem;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 14px 36px -16px rgba(0, 0, 0, 0.5);
	}

	.agent-setting {
		display: flex;
		flex-direction: column;
		gap: 0.375rem;
	}

	.agent-setting-label {
		font-size: 10px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-muted);
	}

	/* ── Side-by-side model cards: tan 0.8B / amber 2B ──────────────────── */
	.agent-model-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.5rem;
	}

	@media (max-width: 420px) {
		.agent-model-grid {
			grid-template-columns: 1fr;
		}
	}

	.agent-model-card {
		position: relative;
		display: flex;
		flex-direction: column;
		align-items: flex-start;
		gap: 0.3rem;
		overflow: hidden;
		padding: 0.5rem 0.625rem 0.625rem;
		border-radius: 0.625rem;
		text-align: left;
	}

	/* Not yet downloaded (and not busy): the card body reads as inert — the
	   download button is the only live affordance. */
	.agent-model-card.dimmed > .agent-model-name,
	.agent-model-card.dimmed > .agent-model-meta {
		opacity: 0.6;
	}

	.agent-model-name {
		font-size: 12px;
		font-weight: 700;
		color: var(--color-text);
	}

	.agent-model-meta {
		font-size: 10.5px;
		line-height: 1.4;
		color: var(--color-text-secondary);
	}

	.agent-model-active {
		position: absolute;
		top: 0.4rem;
		right: 0.5rem;
		display: inline-flex;
		align-items: center;
		gap: 0.15rem;
		border-radius: 9999px;
		padding: 0.05rem 0.4rem;
		font-size: 9px;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--color-primary-text);
		background: color-mix(in srgb, var(--color-primary) 15%, transparent);
	}

	.agent-model-reason {
		font-size: 9.5px;
		font-style: italic;
		color: var(--color-text-muted);
	}

	/* In-card download / activate buttons */
	.agent-model-dl,
	.agent-model-use {
		display: inline-flex;
		cursor: pointer;
		align-items: center;
		gap: 0.3rem;
		border-radius: 0.4rem;
		padding: 0.25rem 0.5rem;
		font-size: 10.5px;
		font-weight: 700;
		transition:
			border-color 0.15s ease,
			opacity 0.15s ease;
	}

	.agent-model-dl:disabled,
	.agent-model-use:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	/* In-card progress (download percent / load / warm-up) */
	.agent-model-progress {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		width: 100%;
	}

	.agent-model-pct {
		font-family: var(--font-mono);
		font-size: 10px;
		font-weight: 600;
	}

	.agent-model-cancel {
		margin-left: auto;
		cursor: pointer;
		border: none;
		background: transparent;
		padding: 0;
		font-size: 10px;
		color: var(--color-text-muted);
		text-decoration: underline;
		text-underline-offset: 2px;
	}

	.agent-model-cancel:hover {
		color: var(--color-caution);
	}

	.agent-model-track {
		position: absolute;
		left: 0;
		right: 0;
		bottom: 0;
		height: 2px;
		overflow: hidden;
	}

	.agent-model-fill {
		height: 100%;
		transition: width 0.25s ease;
	}

	.agent-model-fill.indeterminate {
		width: 35%;
		animation: agent-dl-slide 1.1s ease-in-out infinite;
	}

	/* Sibling tints: same structure, different family. The active model gets
	   a stronger wash of its own tint. */
	.agent-model-tan {
		border: 1px solid color-mix(in srgb, var(--color-vibe) 35%, transparent);
		background: color-mix(in srgb, var(--color-vibe) 6%, var(--color-surface));
	}

	.agent-model-tan.active {
		border: 2px solid var(--color-vibe);
		background: color-mix(in srgb, var(--color-vibe) 16%, var(--color-surface));
		padding: calc(0.5rem - 1px) calc(0.625rem - 1px) calc(0.625rem - 1px);
	}

	.agent-model-tan .agent-model-dl,
	.agent-model-tan .agent-model-use {
		border: 1px solid color-mix(in srgb, var(--color-vibe) 45%, transparent);
		background: color-mix(in srgb, var(--color-vibe) 12%, var(--color-surface));
		color: var(--color-vibe-text);
	}

	.agent-model-tan .agent-model-dl:hover:not(:disabled),
	.agent-model-tan .agent-model-use:hover:not(:disabled) {
		border-color: var(--color-vibe);
	}

	.agent-model-tan .agent-model-pct {
		color: var(--color-vibe-text);
	}

	.agent-model-tan .agent-model-fill {
		background: var(--color-vibe);
	}

	.agent-model-amber {
		border: 1px solid color-mix(in srgb, var(--color-important) 35%, transparent);
		background: color-mix(in srgb, var(--color-important) 6%, var(--color-surface));
	}

	.agent-model-amber.active {
		border: 2px solid var(--color-important);
		background: color-mix(in srgb, var(--color-important) 16%, var(--color-surface));
		padding: calc(0.5rem - 1px) calc(0.625rem - 1px) calc(0.625rem - 1px);
	}

	.agent-model-amber .agent-model-dl,
	.agent-model-amber .agent-model-use {
		border: 1px solid color-mix(in srgb, var(--color-important) 45%, transparent);
		background: color-mix(in srgb, var(--color-important) 12%, var(--color-surface));
		color: var(--color-important);
	}

	.agent-model-amber .agent-model-dl:hover:not(:disabled),
	.agent-model-amber .agent-model-use:hover:not(:disabled) {
		border-color: var(--color-important);
	}

	.agent-model-amber .agent-model-pct {
		color: var(--color-important);
	}

	.agent-model-amber .agent-model-fill {
		background: var(--color-important);
	}
</style>
