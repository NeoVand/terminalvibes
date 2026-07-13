<script lang="ts">
	import TerminalPlayground from '$lib/components/playground/TerminalPlayground.svelte';
	import { readingContext } from '$lib/ai/reading-context.svelte';
	import type { SharedSession } from '$lib/playground/share';

	let {
		open = false,
		onToggle,
		shared = null
	}: {
		open: boolean;
		onToggle: () => void;
		shared?: SharedSession | null;
	} = $props();

	let hasOpened = $state(false);

	$effect(() => {
		if (open) {
			hasOpened = true;
		}
	});

	// While the panel is open, the Agent's suggested questions are about the
	// scenario it opened on (the panel's own prop — in-panel scenario switches
	// stay internal to TerminalPlayground).
	$effect(() => {
		readingContext.scenarioId = open ? (shared?.scenarioId ?? 'first-steps') : null;
	});

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && open) {
			onToggle();
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

{#if open}
	<button
		class="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
		onclick={onToggle}
		aria-label="Close playground"
	></button>
{/if}

<aside
	class="pg-panel fixed top-0 right-0 bottom-0 z-40 flex w-full flex-col border-l shadow-2xl transition-transform duration-200 ease-out md:w-[min(42vw,40rem)]"
	style="padding-top: var(--header-height); border-color: var(--color-border);"
	class:translate-x-0={open}
	class:translate-x-full={!open}
	aria-hidden={!open}
	aria-label="Terminal Playground"
>
	{#if hasOpened}
		<TerminalPlayground
			panel
			id="global-playground"
			onClose={onToggle}
			scenarioId={shared?.scenarioId ?? 'first-steps'}
			{shared}
		/>
	{/if}
</aside>

<style>
	.pg-panel {
		background: var(--panel-glass);
		backdrop-filter: blur(24px) saturate(1.4);
		-webkit-backdrop-filter: blur(24px) saturate(1.4);
	}
</style>
