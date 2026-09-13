<script lang="ts">
	import { asset } from '$app/paths';
	import { tick, untrack } from 'svelte';

	// The pre-generated PDF (scripts/make-cheatsheet-pdf.mjs) shipped in static/
	const pdfHref = asset('/terminalvibes-cheatsheet.pdf');
	import { autohideScroll } from '$lib/actions/autohide-scroll';
	import {
		X,
		Search,
		ChevronRight,
		AtSign,
		Compass,
		Cpu,
		Eye,
		FileCode,
		FolderPlus,
		Gamepad2,
		Globe,
		LifeBuoy,
		ListFilter,
		Lock,
		Package,
		Puzzle,
		Route,
		Scissors,
		Workflow,
		Check,
		Copy,
		Maximize2,
		Download
	} from 'lucide-svelte';
	import { SvelteSet } from 'svelte/reactivity';
	import {
		cheatSheet,
		searchReferences,
		cheatSheetLegend,
		type CheatSheetCategory,
		type CheatSheetCommand
	} from '$lib/data/cheat-sheet';
	import { tokenizeShellCommand } from '$lib/data/bash-syntax';
	import { readingContext } from '$lib/ai/reading-context.svelte';
	import { exerciseFocusOf, referenceMatchesExercise } from '$lib/playground/exercise-commands';
	import { focusAnchor, revealAnchor } from '$lib/navigation/reveal-anchor';

	let {
		open = false,
		onToggle,
		onNavigate
	}: {
		open: boolean;
		onToggle: () => void;
		onNavigate?: (id: string) => void;
	} = $props();

	let searchQuery = $state('');
	let expandedCategories = new SvelteSet<string>(cheatSheet.map((c) => c.label));
	let copiedCommand = $state<string | null>(null);
	let modalOpen = $state(false);
	let editingCommand = $state<string | null>(null);
	let commandDraft = $state('');
	let copyError = $state('');
	let panelEl: HTMLElement | undefined = $state();
	let panelSearch: HTMLInputElement | undefined = $state();
	let expandButton: HTMLButtonElement | undefined = $state();
	let navigating = false;
	let copiedTimer: ReturnType<typeof setTimeout>;
	function needsArguments(command: string) {
		return /<[^<>\s]+>|\b(?:FILE|PID|NAME|URL|VAR)\b/.test(command);
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape' && open && !modalOpen && !event.defaultPrevented) {
			event.preventDefault();
			event.stopPropagation();
			onToggle();
		}
	}

	function openModal(node: HTMLDialogElement) {
		node.showModal();
		node.querySelector<HTMLInputElement>('input')?.focus();
		return {
			destroy() {
				node.close();
			}
		};
	}

	function containModalFocus(event: KeyboardEvent) {
		if (event.key !== 'Tab') return;
		const dialog = event.currentTarget as HTMLDialogElement;
		const controls = Array.from(
			dialog.querySelectorAll<HTMLElement>(
				'a[href], button:not([disabled]), input:not([disabled]), textarea:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
			)
		).filter((node) => node.getClientRects().length > 0);
		const first = controls[0];
		const last = controls[controls.length - 1];
		if (
			(!event.shiftKey && document.activeElement === last) ||
			(event.shiftKey && document.activeElement === first)
		) {
			event.preventDefault();
			(event.shiftKey ? last : first)?.focus();
		}
	}

	async function closeModal() {
		modalOpen = false;
		await tick();
		if (!navigating) expandButton?.focus();
	}

	async function chooseReference(cmd: CheatSheetCommand) {
		copyError = '';
		if (cmd.kind === 'shortcut') {
			// A chord describes keys to press; it must never become shell input.
			if (!cmd.lessonId) return;
			navigating = true;
			modalOpen = false;
			if (open) onToggle();
			await tick();
			if (onNavigate) onNavigate(cmd.lessonId);
			else {
				const target = revealAnchor(cmd.lessonId);
				if (target) {
					target.scrollIntoView({ behavior: 'smooth' });
					focusAnchor(target);
				}
			}
			navigating = false;
		} else if (needsArguments(cmd.command)) {
			editingCommand = cmd.command;
			commandDraft = cmd.command;
			await tick();
			const surface = document.querySelector('dialog.cheat-modal[open]') ?? panelEl;
			surface?.querySelector<HTMLTextAreaElement>('textarea')?.focus();
		} else {
			await copyCommand(cmd.command);
		}
	}

	// Hidden drawers are inert. Opening a reference starts in its search field;
	// closing returns to the control used to open it, unless a lesson was chosen.
	$effect(() => {
		if (!open || !panelSearch) return;
		const previous = document.activeElement;
		panelSearch.focus({ preventScroll: true });
		return () => {
			if (
				!navigating &&
				previous instanceof HTMLElement &&
				(document.activeElement === document.body ||
					untrack(() => panelEl)?.contains(document.activeElement))
			) {
				previous.focus({ preventScroll: true });
			}
		};
	});

	$effect(() => () => clearTimeout(copiedTimer));

	// Map icon string names (from cheat-sheet.ts categories) to lucide components
	const iconMap: Record<string, typeof Compass> = {
		compass: Compass,
		cpu: Cpu,
		globe: Globe,
		package: Package,
		route: Route,
		'folder-plus': FolderPlus,
		eye: Eye,
		workflow: Workflow,
		scissors: Scissors,
		search: Search,
		lock: Lock,
		'at-sign': AtSign,
		'file-code': FileCode,
		'life-buoy': LifeBuoy
	};

	/* ── exercise focus ──────────────────────────────────────────────────
	   When the learner is AT a playground or challenge — the scroll-spy
	   anchor resolves to one, or the panel opened on one — the sheet can
	   narrow itself to the commands that exercise actually reaches for.
	   The lightbulb-free ListFilter toggle in the toolbar turns it off and
	   on; it only appears while there is an exercise to focus on. */
	let focusEnabled = $state(true);

	const exercise = $derived(exerciseFocusOf(readingContext.scenarioId ?? readingContext.sectionId));

	/** The sheet narrowed to the exercise's commands — null when that would
	 *  leave nothing to show (an exercise whose commands the sheet lacks). */
	const focusedCategories = $derived.by(() => {
		if (!exercise) return null;
		const result: CheatSheetCategory[] = [];
		for (const category of cheatSheet) {
			const commands = category.commands.filter((cmd) => referenceMatchesExercise(cmd, exercise));
			if (commands.length > 0) result.push({ ...category, commands });
		}
		return result.length > 0 ? result : null;
	});

	const focusActive = $derived(focusEnabled && focusedCategories !== null && !searchQuery.trim());
	const focusAccent = $derived(
		exercise?.kind === 'challenge' ? 'var(--color-challenge)' : 'var(--color-important)'
	);
	const FocusIcon = $derived(exercise?.kind === 'challenge' ? Puzzle : Gamepad2);

	let filteredCategories = $derived.by(() => {
		const base =
			!searchQuery.trim() && focusActive && focusedCategories ? focusedCategories : cheatSheet;
		const query = searchQuery.toLowerCase().trim();
		if (!query) return base;
		const hits = new Set(searchReferences(query));

		const result: CheatSheetCategory[] = [];
		for (const category of base) {
			const matchingCommands = category.commands.filter((cmd) => hits.has(cmd));
			if (matchingCommands.length > 0) {
				result.push({ ...category, commands: matchingCommands });
			}
		}
		return result;
	});
	const showLegend = $derived(
		!focusActive &&
			filteredCategories.some((category) =>
				category.commands.some((cmd) => cmd.kind !== 'shortcut' && needsArguments(cmd.command))
			)
	);

	function toggleCategory(label: string) {
		if (expandedCategories.has(label)) expandedCategories.delete(label);
		else expandedCategories.add(label);
	}

	async function copyCommand(command: string) {
		copyError = '';
		if (!command.trim() || needsArguments(command)) return;
		try {
			await navigator.clipboard.writeText(command);
			copiedCommand = command;
			clearTimeout(copiedTimer);
			copiedTimer = setTimeout(() => {
				copiedCommand = null;
			}, 1500);
		} catch {
			copyError =
				'Copy is unavailable here. Select the command text and copy it with your keyboard.';
		}
	}

	// When searching, expand all categories that have results
	$effect(() => {
		if (searchQuery.trim()) {
			expandedCategories.clear();
			for (const category of filteredCategories) expandedCategories.add(category.label);
		}
	});

	// A focused sheet is short; a collapsed category inside it hides half of
	// an already-small kit. Expand what the focus surfaces (never collapse).
	$effect(() => {
		if (focusActive && focusedCategories) {
			for (const category of focusedCategories) expandedCategories.add(category.label);
		}
	});
</script>

<svelte:window onkeydown={handleKeydown} />

{#snippet focusToggle()}
	<!-- Only rendered while an exercise is in view AND the sheet has rows for
	     it — a filter that could only produce an empty list never appears. -->
	{#if exercise && focusedCategories}
		<button
			onclick={() => (focusEnabled = !focusEnabled)}
			class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
			style="color: {focusActive
				? focusAccent
				: 'var(--color-text-muted)'}; background: {focusActive
				? `color-mix(in srgb, ${focusAccent} 14%, transparent)`
				: 'transparent'};"
			aria-pressed={focusActive}
			aria-label="Show only this exercise's commands"
			title={focusActive
				? 'Showing this exercise’s commands — click for all'
				: 'Show only this exercise’s commands'}
		>
			<ListFilter size={14} />
		</button>
	{/if}
{/snippet}

{#snippet focusStrip()}
	<!-- Names what the filter is doing, so a suddenly-short list reads as a
	     feature rather than as missing content. -->
	{#if focusActive && exercise}
		<div
			class="flex items-center gap-2 px-4 py-1.5"
			style="background: color-mix(in srgb, {focusAccent} 7%, transparent);"
		>
			<FocusIcon size={12} style="color: {focusAccent}; flex-shrink: 0;" />
			<p class="min-w-0 truncate text-[11px]" style="color: var(--color-text-secondary);">
				Commands for <strong style="font-weight: 600;">{exercise.title}</strong>
			</p>
		</div>
	{/if}
{/snippet}

{#snippet legend()}
	<!-- Placeholder key. Sits above the list rather than inside a category:
	     it explains how to read every row, so it must be seen before them. -->
	<div
		class="mb-2 rounded-md border px-2.5 py-2"
		style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-bg-tertiary) 45%, transparent);"
	>
		<p class="text-[11px] leading-snug" style="color: var(--color-text-secondary);">
			{cheatSheetLegend.lead}
		</p>
		<ul class="mt-1.5 space-y-1">
			{#each cheatSheetLegend.entries as entry (entry.notation)}
				<li class="text-[11px] leading-snug" style="color: var(--color-text-muted);">
					<code
						class="rounded px-1 py-0.5 text-[10px]"
						style="background: var(--color-code-bg); color: var(--color-code-text); font-family: var(--font-mono);"
						>{entry.notation}</code
					>
					{@render chipText(entry.meaning)}
				</li>
			{/each}
		</ul>
	</div>
{/snippet}

{#snippet chipText(text: string)}
	<!-- Command mentions sit in `backticks`; render those segments as the same
	     syntax-highlighted chips the command column wears. -->
	{#each text.split('`') as seg, si (si)}{#if si % 2 === 1}<code class="cs-ic"
				>{#each tokenizeShellCommand(seg) as token, ti (ti)}<span class="tok tok-{token.type}"
						>{token.text}</span
					>{/each}</code
			>{:else}{seg}{/if}{/each}
{/snippet}

{#snippet commandRow(cmd: CheatSheetCommand, showDetail: boolean = false)}
	{@const isCopied = copiedCommand === cmd.command}
	<!-- The copy affordance overlays on hover instead of reserving a column —
	     in the 336px panel that width is the difference between commands
	     fitting on one line and wrapping -->
	<button
		onclick={() => void chooseReference(cmd)}
		data-reference-id={cmd.id}
		data-reference-kind={cmd.kind ?? 'command'}
		class="group relative block w-full cursor-pointer rounded-md px-1.5 py-[6px] text-left transition-colors"
		style="background: transparent;"
		title={cmd.kind === 'shortcut'
			? 'Open the lesson'
			: needsArguments(cmd.command)
				? 'Fill in your command'
				: 'Click to copy'}
	>
		<code
			class="block w-fit max-w-full rounded px-1 py-0.5 text-xs leading-relaxed break-all"
			style="background: var(--color-code-bg); color: var(--color-code-text); font-family: var(--font-mono);"
			>{#each tokenizeShellCommand(cmd.command) as token, ti (ti)}<span class="tok tok-{token.type}"
					>{token.text}</span
				>{/each}</code
		>
		<span
			class="absolute top-[7px] right-1 rounded p-0.5 opacity-0 transition-opacity group-hover:opacity-100"
			style="color: {isCopied
				? 'var(--color-tip)'
				: 'var(--color-text-muted)'}; background: var(--color-bg-secondary);"
		>
			{#if cmd.kind === 'shortcut'}<ChevronRight size={11} />
			{:else if isCopied}
				<Check size={11} />
			{:else}
				<Copy size={11} />
			{/if}
		</span>
		<p class="mt-0.5 text-xs leading-relaxed" style="color: var(--color-text-secondary);">
			{@render chipText(cmd.description)}
		</p>
		{#if showDetail && cmd.detail}
			<p class="mt-1 text-xs leading-relaxed" style="color: var(--color-text-secondary);">
				{@render chipText(cmd.detail)}
			</p>
		{/if}
		{#if isCopied}
			<span class="mt-0.5 inline-block text-[10px] font-medium" style="color: var(--color-tip);">
				Copied!
			</span>
		{/if}
	</button>
	{#if editingCommand === cmd.command}
		<form
			class="command-builder"
			onsubmit={(event) => {
				event.preventDefault();
				if (commandDraft.trim() && !needsArguments(commandDraft)) void copyCommand(commandDraft);
			}}
		>
			<label
				>Replace the placeholders
				<textarea
					bind:value={commandDraft}
					rows="3"
					spellcheck="false"
					aria-label="Your completed command"
				></textarea>
			</label>
			<p>Use your own filename or value. Put quotes around a filename with spaces.</p>
			<div>
				<button type="submit" disabled={!commandDraft.trim() || needsArguments(commandDraft)}
					>Copy command</button
				>
				<button type="button" onclick={() => (editingCommand = null)}>Close</button>
			</div>
			{#if copiedCommand === commandDraft}<p role="status">Copied your completed command.</p>{/if}
		</form>
	{/if}
{/snippet}

<!-- Backdrop on mobile -->
{#if open}
	<button
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
		onclick={onToggle}
		aria-label="Close cheat sheet"
	></button>
{/if}

<!-- Right-side sliding panel -->
<aside
	class="cheat-panel fixed top-0 right-0 bottom-0 z-40 flex w-full flex-col border-l transition-transform duration-200 ease-out sm:w-[var(--cheatsheet-width)]"
	style="padding-top: var(--header-height); border-color: var(--color-border);"
	class:translate-x-0={open}
	class:translate-x-full={!open}
	data-fabric
	bind:this={panelEl}
	aria-label="Terminal cheat sheet"
	aria-hidden={!open || modalOpen}
	inert={!open || modalOpen}
>
	<!-- Header -->
	<div
		class="flex items-center justify-between border-b px-4 py-3"
		style="border-color: var(--color-border);"
	>
		<span
			class="text-xs font-semibold tracking-wider uppercase"
			style="color: var(--color-text-muted); letter-spacing: 0.08em;"
		>
			Cheat Sheet
		</span>
		<div class="flex items-center gap-0.5">
			{@render focusToggle()}
			<a
				href={pdfHref}
				download="terminalvibes-cheatsheet.pdf"
				class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
				style="color: var(--color-text-muted);"
				aria-label="Download as PDF"
				title="Download as PDF"
			>
				<Download size={14} />
			</a>
			<button
				onclick={() => (modalOpen = true)}
				bind:this={expandButton}
				class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
				style="color: var(--color-text-muted);"
				aria-label="Expand cheat sheet"
				title="Expand"
			>
				<Maximize2 size={13} />
			</button>
			<button
				onclick={onToggle}
				class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
				style="color: var(--color-text-muted);"
				aria-label="Close cheat sheet"
			>
				<X size={15} />
			</button>
		</div>
	</div>

	<!-- Search -->
	<div
		class="flex items-center gap-2 px-4 py-2.5"
		style="background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent);"
	>
		<Search size={13} style="color: var(--color-text-muted); flex-shrink: 0;" />
		<input
			type="text"
			placeholder="Find a command or describe what you need..."
			aria-label="Find a command or shortcut"
			bind:this={panelSearch}
			bind:value={searchQuery}
			class="w-full border-none bg-transparent text-xs shadow-none outline-none focus:border-none focus:shadow-none focus:ring-0 focus:outline-none"
			style="color: var(--color-text); font-family: var(--font-sans);"
		/>
	</div>

	{@render focusStrip()}

	{#if copyError}<p role="status" class="px-4 py-2 text-xs">{copyError}</p>{/if}

	<!-- Scrollable command list. The legend rests while the sheet is focused
	     on an exercise: a learner mid-exercise is copying commands, not
	     decoding notation, and the short list should read at a glance. -->
	<div class="flex-1 overflow-y-auto px-2 py-2.5" use:autohideScroll>
		{#if showLegend}
			{@render legend()}
		{/if}
		{#each filteredCategories as category (category.label)}
			{@const IconComponent = iconMap[category.icon]}
			{@const isExpanded = expandedCategories.has(category.label)}
			<div class="mb-1">
				<!-- Category header -->
				<button
					onclick={() => toggleCategory(category.label)}
					aria-expanded={isExpanded}
					class="flex w-full cursor-pointer items-center gap-2 rounded-md px-2.5 py-[7px] text-left text-[13px] font-semibold transition-colors"
					style="color: var(--color-text-secondary);"
				>
					{#if IconComponent}
						<IconComponent size={14} strokeWidth={2} />
					{/if}
					<span class="flex-1">{category.label}</span>
					<span class="text-[10px] font-normal" style="color: var(--color-text-muted);">
						{category.commands.length}
					</span>
					<ChevronRight
						size={12}
						class="transition-transform duration-150"
						style="transform: rotate({isExpanded ? '90deg' : '0deg'}); opacity: 0.5;"
					/>
				</button>

				<!-- Commands: no guide line, minimal indent — the 320px panel
				     needs every pixel to keep commands on one line -->
				{#if isExpanded}
					<div class="mt-0.5 ml-1 space-y-px">
						{#each category.commands as cmd (cmd.command)}
							{@render commandRow(cmd)}
						{/each}
					</div>
				{/if}
			</div>
		{/each}

		{#if filteredCategories.length === 0}
			<div class="px-2 py-8 text-center">
				<p class="text-xs" style="color: var(--color-text-muted);">
					No commands match your search.
				</p>
			</div>
		{/if}
	</div>
</aside>

<!-- ───── EXPANDED MODAL ───── -->
{#if modalOpen}
	<dialog
		class="cheat-modal fixed inset-0 m-auto flex max-h-[88vh] w-[calc(100%-2rem)] max-w-5xl flex-col overflow-hidden rounded-2xl border p-0 shadow-2xl sm:w-[calc(100%-4rem)]"
		style="border-color: var(--color-border); color: var(--color-text);"
		aria-label="Terminal cheat sheet"
		use:openModal
		onkeydown={containModalFocus}
		oncancel={(event) => {
			event.preventDefault();
			void closeModal();
		}}
		onclick={(event) => {
			if (event.target !== event.currentTarget) return;
			const bounds = event.currentTarget.getBoundingClientRect();
			if (
				event.clientX < bounds.left ||
				event.clientX > bounds.right ||
				event.clientY < bounds.top ||
				event.clientY > bounds.bottom
			)
				void closeModal();
		}}
	>
		<div
			class="flex shrink-0 items-center justify-between border-b px-5 py-3"
			style="border-color: var(--color-border);"
		>
			<span
				class="text-xs font-semibold tracking-wider uppercase"
				style="color: var(--color-text-muted); letter-spacing: 0.08em;"
			>
				Cheat Sheet
			</span>
			<div class="flex items-center gap-1">
				{@render focusToggle()}
				<a
					href={pdfHref}
					download="terminalvibes-cheatsheet.pdf"
					class="flex h-7 cursor-pointer items-center gap-1.5 rounded-md border px-2.5 text-[11px] font-medium transition-colors hover:opacity-80"
					style="color: var(--color-text-secondary); border-color: var(--color-border);"
					aria-label="Download as PDF"
				>
					<Download size={12} />
					PDF
				</a>
				<button
					onclick={() => void closeModal()}
					class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
					style="color: var(--color-text-muted);"
					aria-label="Close expanded cheat sheet"
				>
					<X size={15} />
				</button>
			</div>
		</div>

		<div
			class="flex shrink-0 items-center gap-2 border-b px-5 py-2.5"
			style="border-color: var(--color-border); background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent);"
		>
			<Search size={13} style="color: var(--color-text-muted); flex-shrink: 0;" />
			<input
				type="text"
				placeholder="Find a command or describe what you need..."
				aria-label="Find a command or shortcut"
				bind:value={searchQuery}
				class="w-full border-none bg-transparent text-xs shadow-none outline-none focus:border-none focus:shadow-none focus:ring-0 focus:outline-none"
				style="color: var(--color-text); font-family: var(--font-sans);"
			/>
		</div>

		{@render focusStrip()}
		{#if copyError}<p role="status" class="px-5 py-2 text-xs">{copyError}</p>{/if}

		<div class="min-h-0 flex-1 overflow-y-auto px-5 py-4" use:autohideScroll>
			{#if showLegend}
				{@render legend()}
			{/if}
			<div class="cheat-modal-columns">
				{#each filteredCategories as category (category.label)}
					{@const IconComponent = iconMap[category.icon]}
					<section class="cheat-modal-category mb-4">
						<h3
							class="mb-1.5 flex items-center gap-2 px-1 pb-1.5 text-[13px] font-semibold"
							style="color: var(--color-text); border-bottom: 1px solid var(--color-border);"
						>
							{#if IconComponent}
								<IconComponent size={14} strokeWidth={2} />
							{/if}
							<span class="flex-1">{category.label}</span>
							<span class="text-[10px] font-normal" style="color: var(--color-text-muted);">
								{category.commands.length}
							</span>
						</h3>
						{#each category.commands as cmd (cmd.command)}
							{@render commandRow(cmd, true)}
						{/each}
					</section>
				{/each}
			</div>

			{#if filteredCategories.length === 0}
				<div class="px-2 py-8 text-center">
					<p class="text-xs" style="color: var(--color-text-muted);">
						No commands match your search.
					</p>
				</div>
			{/if}
		</div>
	</dialog>
{/if}

<style>
	.command-builder {
		margin: 0.25rem 0.4rem 0.75rem;
		padding: 0.7rem;
		background: var(--color-bg-tertiary);
		border-radius: 0.5rem;
		font-size: 0.75rem;
	}
	.command-builder label {
		display: block;
		font-weight: 600;
	}
	.command-builder textarea {
		display: block;
		width: 100%;
		margin: 0.4rem 0;
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		background: var(--color-bg);
		color: var(--color-text);
		font: 0.75rem/1.5 var(--font-mono);
		padding: 0.4rem;
	}
	.command-builder p {
		margin: 0.4rem 0;
		color: var(--color-text-muted);
	}
	.command-builder div {
		display: flex;
		gap: 0.5rem;
	}
	.command-builder button {
		border: 1px solid var(--color-border);
		border-radius: 0.35rem;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
	}
	.command-builder button:disabled {
		opacity: 0.5;
		cursor: default;
	}

	/* Frosted glass, matching the header and sidebar */
	.cheat-panel {
		background: var(--panel-glass);
		backdrop-filter: blur(24px) saturate(1.4);
		-webkit-backdrop-filter: blur(24px) saturate(1.4);
	}

	.cheat-modal {
		background: color-mix(in srgb, var(--color-bg-secondary) 78%, transparent);
		backdrop-filter: blur(28px) saturate(1.5);
		-webkit-backdrop-filter: blur(28px) saturate(1.5);
	}

	.cheat-modal::backdrop {
		background: rgb(0 0 0 / 50%);
		backdrop-filter: blur(4px);
	}

	/* Categories flow through balanced columns; each stays whole */
	.cheat-modal-columns {
		column-count: 1;
		column-gap: 1.5rem;
	}

	@media (min-width: 640px) {
		.cheat-modal-columns {
			column-count: 2;
		}
	}

	@media (min-width: 1024px) {
		.cheat-modal-columns {
			column-count: 3;
		}
	}

	.cheat-modal-category {
		break-inside: avoid;
	}

	/* Inline command mention inside a description — the chip look, sized to
	   sit within 11px muted text without shouting. */
	.cs-ic {
		font-family: var(--font-mono);
		font-size: 0.95em;
		background: var(--color-code-bg);
		border-radius: 0.2rem;
		padding: 0 0.25em;
	}
</style>
