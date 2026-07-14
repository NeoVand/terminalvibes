<script lang="ts">
	import { Folder, GitBranch, Package, Timer, Clock, BatteryMedium } from 'lucide-svelte';
	import type { PromptDesign } from '$lib/starship/types';
	import { toSegments } from '$lib/starship/generate';
	import { resolvePalette } from '$lib/starship/palettes';

	let { design, mini = false }: { design: PromptDesign; mini?: boolean } = $props();

	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	const ICONS: Record<string, any> = { Folder, GitBranch, Package, Timer, Clock, BatteryMedium };

	let pal = $derived(resolvePalette(design));
	let parts = $derived(toSegments(design));
	let powerline = $derived(design.separator === 'powerline' || design.separator === 'round');
	let round = $derived(design.separator === 'round');
	let brackets = $derived(design.separator === 'brackets');
</script>

<div
	class="ppv"
	class:ppv-mini={mini}
	style="background: {pal.bg}; color: {pal.fg};"
	aria-hidden="true"
>
	{#if !mini}
		<div class="ppv-scrollback">
			<span style="color: {pal.fg}; opacity: 0.5;"># your terminal, restyled</span>
		</div>
	{/if}

	<!-- add_newline: a blank line separating this prompt from what came before -->
	{#if design.addNewline}
		<div class="ppv-newline"></div>
	{/if}

	<div class="ppv-line">
		{#if powerline}
			{#each parts.line as seg, i (i)}
				<span
					class="ppv-seg"
					class:ppv-seg-first={i === 0 && round}
					style="background: {seg.bg}; color: {seg.fg};"
				>
					{#if seg.icon && ICONS[seg.icon]}{@const Icon = ICONS[seg.icon]}<Icon
							size={mini ? 10 : 13}
							strokeWidth={2.4}
						/>{:else if seg.glyph}<span class="ppv-glyph">{seg.glyph}</span>{/if}<span
						class="ppv-txt">{seg.text}</span
					>
				</span>
				{#if i < parts.line.length - 1}
					<span
						class="ppv-arrow"
						style="background: {parts.line[i + 1].bg}; --from: {seg.bg};"
						class:ppv-arrow-round={round}
					></span>
				{:else}
					<span
						class="ppv-arrow ppv-arrow-end"
						style="--from: {seg.bg};"
						class:ppv-arrow-round={round}
					></span>
				{/if}
			{/each}
		{:else}
			{#each parts.line as seg, i (i)}
				<span class="ppv-plain" style="color: {seg.fg};">
					{#if seg.icon && ICONS[seg.icon]}{@const Icon = ICONS[seg.icon]}<Icon
							size={mini ? 10 : 13}
							strokeWidth={2.4}
						/>{:else if seg.glyph}<span class="ppv-glyph">{seg.glyph}</span>{/if}{#if brackets}<span
							>[{seg.text}]</span
						>{:else}<span>{seg.text}</span>{/if}
				</span>{#if i < parts.line.length - 1}<span class="ppv-gap"></span>{/if}
			{/each}
		{/if}

		{#if design.twoLine}
			<div class="ppv-break"></div>
		{/if}
		<span class="ppv-char" style="color: {parts.char.fg};">{parts.char.text}</span>
		{#if !mini}<span class="ppv-cursor" style="background: {pal.fg};"></span>{/if}
	</div>
</div>

<style>
	.ppv {
		border-radius: 10px;
		padding: 0.9rem 1rem;
		font-family: var(--font-mono);
		font-size: 14px;
		line-height: 1.6;
		overflow-x: auto;
		box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.06);
	}
	.ppv-mini {
		padding: 0.5rem 0.6rem;
		font-size: 11px;
		border-radius: 7px;
		line-height: 1.4;
	}
	.ppv-scrollback {
		font-size: 12px;
		margin-bottom: 0.4rem;
		font-style: italic;
	}
	.ppv-newline {
		height: 1.4em;
	}
	.ppv-line {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		white-space: nowrap;
	}
	/* Powerline segment: a colored block with its contents. */
	.ppv-seg {
		display: inline-flex;
		align-items: center;
		gap: 0.35ch;
		padding: 0.05rem 0.5ch;
		font-weight: 600;
	}
	.ppv-txt {
		white-space: nowrap;
	}
	/* The arrow between segments: a triangle of the previous color pointing
	   into the next segment's background — the classic powerline look, drawn
	   in pure CSS so no Nerd Font is needed here. */
	.ppv-arrow {
		display: inline-block;
		width: 0.75em;
		align-self: stretch;
		position: relative;
	}
	.ppv-arrow::before {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--from);
		clip-path: polygon(0 0, 0 100%, 100% 50%);
	}
	.ppv-arrow-end {
		background: transparent !important;
	}
	.ppv-arrow-round::before {
		clip-path: none;
		border-radius: 0 999px 999px 0;
	}
	.ppv-seg-first {
		border-radius: 999px 0 0 999px;
		padding-left: 0.8ch;
	}
	/* Plain / brackets styles: colored text, no backgrounds. */
	.ppv-plain {
		display: inline-flex;
		align-items: center;
		gap: 0.35ch;
		font-weight: 600;
	}
	.ppv-gap {
		width: 0.7ch;
		display: inline-block;
	}
	.ppv-glyph {
		font-size: 0.95em;
	}
	.ppv-char {
		font-weight: 700;
		margin-left: 0.6ch;
	}
	.ppv-break {
		flex-basis: 100%;
		height: 0.2rem;
	}
	.ppv-cursor {
		display: inline-block;
		width: 0.55ch;
		height: 1.05em;
		margin-left: 0.4ch;
		vertical-align: text-bottom;
		animation: ppv-blink 1.1s steps(1) infinite;
	}
	@keyframes ppv-blink {
		50% {
			opacity: 0;
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.ppv-cursor {
			animation: none;
		}
	}
</style>
