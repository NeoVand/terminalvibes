<script lang="ts">
	import { onMount } from 'svelte';
	import { RotateCcw } from 'lucide-svelte';
	import type { LessonScenarioId } from '$lib/playground/scenarios';
	import { activityKindOf, type ActivityKind } from '$lib/data/sidebar-nav';

	let {
		title,
		scenarioId,
		id,
		kind
	}: {
		title: string;
		scenarioId: LessonScenarioId;
		id: string;
		/** Omit and the anchor id decides — `ch-N-…` is a challenge. */
		kind?: ActivityKind;
	} = $props();

	/* The card's chrome follows its type, so a challenge is earth-red from the
	   header rule down to the icon in the brief rather than wearing the
	   playground's accent around a challenge-coloured interior. One custom
	   property carries it; the rules below never name a token directly. */
	const activityKind = $derived<ActivityKind>(kind ?? activityKindOf(id));
	const accent = $derived(
		activityKind === 'challenge' ? 'var(--color-challenge)' : 'var(--color-important)'
	);

	let retryKey = $state(0);
	let resetFn = $state<(() => void) | null>(null);

	// Each playground seeds and renders its own sandbox filesystem; doing
	// that for every activity at page load starves whichever one the user is
	// actually looking at, so wait until the activity is near the viewport.
	let visible = $state(false);
	let rootEl: HTMLElement | undefined = $state(undefined);

	onMount(() => {
		if (!rootEl || typeof IntersectionObserver === 'undefined') {
			visible = true;
			return;
		}
		const observer = new IntersectionObserver(
			(entries) => {
				if (entries.some((entry) => entry.isIntersecting)) {
					visible = true;
					observer.disconnect();
				}
			},
			{ rootMargin: '200px' }
		);
		observer.observe(rootEl);
		return () => observer.disconnect();
	});
</script>

<div
	class="my-6"
	data-lesson-activity={id}
	data-activity-kind={activityKind}
	style="--activity-accent: {accent};"
	bind:this={rootEl}
>
	<!-- `data-fabric` is what actually puts the twinkling pixels under this.
	     BackgroundPixels paints its overlay canvas ABOVE the content and clips
	     it to [data-fabric] surfaces, so an unmarked element gets no pixels no
	     matter how transparent it is — which is why tuning blur and alpha here
	     changed nothing visible. The callout above this card carries the same
	     marker; that is the whole difference. -->
	<div class="activity-header" data-fabric>
		<span class="text-sm font-semibold" style="color: var(--activity-accent);">{title}</span>
		<button
			type="button"
			onclick={() => resetFn?.()}
			disabled={!resetFn}
			class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
			style="color: var(--color-text-muted);"
			aria-label="Reset playground"
		>
			<RotateCcw size={13} />
			Reset
		</button>
	</div>

	<div class="activity-panel">
		{#if !visible}
			<div
				class="placeholder flex items-center justify-center p-8"
				style="color: var(--color-text-muted);"
			>
				<p class="text-sm">Loading playground...</p>
			</div>
		{:else}
			{#key retryKey}
				{#await import('$lib/components/playground/TerminalPlayground.svelte')}
					<div
						class="placeholder flex items-center justify-center p-8"
						style="color: var(--color-text-muted);"
					>
						<p class="text-sm">Loading playground...</p>
					</div>
				{:then { default: TerminalPlayground }}
					<div class="[&>div]:rounded-none">
						<TerminalPlayground
							{scenarioId}
							embedded
							hideHeader
							{id}
							kind={activityKind}
							showScenarioPicker={false}
							onResetReady={(fn) => (resetFn = fn)}
						/>
					</div>
				{:catch error}
					<div class="p-6 text-center">
						<p class="text-sm" style="color: var(--color-warning);">
							Failed to load playground: {error?.message ?? 'Unknown error'}
						</p>
						<button
							type="button"
							onclick={() => retryKey++}
							class="mt-2 cursor-pointer rounded-md px-3 py-1.5 text-xs font-medium"
							style="background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid var(--color-border);"
						>
							Retry
						</button>
					</div>
				{/await}
			{/key}
		{/if}
	</div>
</div>

<style>
	.activity-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0.625rem 1.25rem;
		border: 1px solid color-mix(in srgb, var(--activity-accent) 55%, var(--color-border));
		border-bottom: none;
		border-radius: 0.75rem 0.75rem 0 0;
		/* Matched to the CALLOUT, not to the side panels.

		   `--panel-glass` is 93% opaque in light — right for a panel that floats
		   over the whole article and has to stay readable, wrong for a lid sitting
		   inside the prose, where it reads as a solid slab and the animated pixel
		   fabric behind it disappears. The callout runs 55% at blur(28px), and a
		   card embedded in a chapter belongs to that family: enough veil to
		   separate the header from the terminal, enough transparency that the
		   texture still shows through. */
		background: color-mix(in srgb, var(--color-bg-secondary) 55%, transparent);
		backdrop-filter: blur(28px) saturate(1.5);
		-webkit-backdrop-filter: blur(28px) saturate(1.5);
	}

	.activity-panel {
		overflow: hidden;
		border-radius: 0 0 0.75rem 0.75rem;
		border: 1px solid color-mix(in srgb, var(--activity-accent) 55%, var(--color-border));
		border-top: none;
	}

	/* Match the loaded playground's height so materializing it doesn't
	   shift everything below (which breaks in-flight scrolls). */
	.placeholder {
		min-height: 500px;
	}
</style>
