<script lang="ts">
	import { tokenizeShellCommand } from '$lib/data/bash-syntax';

	/**
	 * An inline code mention, syntax-highlighted the same way the terminal and
	 * code blocks are — so `chmod +x` reads with its command and flag colored,
	 * not as one flat grey word. Used everywhere the prose names a command.
	 */
	let { code }: { code: string } = $props();

	let tokens = $derived(tokenizeShellCommand(code));
</script>

<code class="tv-code"
	>{#each tokens as t, i (i)}<span class="tok tok-{t.type}">{t.text}</span>{/each}</code
>

<style>
	.tv-code {
		border-radius: 0.25rem;
		padding: 0.125rem 0.375rem;
		font-family: var(--font-mono);
		font-size: 0.8em;
		background: var(--color-code-bg);
	}
</style>
