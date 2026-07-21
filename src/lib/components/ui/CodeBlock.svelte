<script lang="ts">
	import { Copy, Check, Terminal } from 'lucide-svelte';
	import { tokenizeCodeBlock, tokenizeShellCommand } from '$lib/data/bash-syntax';

	let {
		code,
		lang = 'bash',
		title = ''
	}: { code: string; lang?: string; title?: string } = $props();

	const SHELL_LANGS = ['bash', 'sh', 'shell', 'zsh'];
	const lines = $derived(
		tokenizeCodeBlock(
			code,
			lang === 'gitignore'
				? 'gitignore'
				: lang === 'toml'
					? 'toml'
					: SHELL_LANGS.includes(lang)
						? 'shell'
						: 'plain'
		)
	);

	// A raw newline in the <pre> template would render its indentation too
	const NEWLINE = '\n';

	// A title may name a command in `backticks`; those segments render as
	// highlighted code, the same way SectionHeader titles do.
	let titleParts = $derived((title || lang).split('`'));

	let copied = $state(false);

	async function copyCode() {
		try {
			await navigator.clipboard.writeText(code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			// Clipboard API not available
		}
	}
</script>

<div
	class="group relative my-4 overflow-hidden rounded-lg"
	style="background: var(--color-terminal-bg);"
	data-fabric
>
	<div class="flex items-center justify-between px-4 py-2">
		<span
			class="flex items-center gap-1.5 text-xs font-medium"
			style="color: var(--color-text-muted);"
		>
			<Terminal size={13} strokeWidth={2} />
			<span
				>{#each titleParts as part, i (i)}{#if i % 2 === 1}<code class="cb-code"
							>{#each tokenizeShellCommand(part) as t, j (j)}<span class="tok tok-{t.type}"
									>{t.text}</span
								>{/each}</code
						>{:else}{part}{/if}{/each}</span
			>
		</span>
		<button
			onclick={copyCode}
			class="flex cursor-pointer items-center gap-1.5 rounded px-2 py-0.5 text-xs transition-opacity {copied
				? 'opacity-100'
				: 'opacity-0 group-hover:opacity-100'}"
			style="color: var(--color-text-muted);"
			aria-label="Copy code"
		>
			{#if copied}
				<Check size={14} />
				<span>Copied</span>
			{:else}
				<Copy size={14} />
				<span>Copy</span>
			{/if}
		</button>
	</div>
	<pre
		class="overflow-x-auto p-4 text-sm leading-relaxed"
		style="color: var(--color-terminal-text); font-family: var(--font-mono); margin: 0;"><code
			>{#each lines as line, li (li)}{#if li > 0}{NEWLINE}{/if}{#each line as token, ti (ti)}<span
						class="tok tok-{token.type}">{token.text}</span
					>{/each}{/each}</code
		></pre>
</div>

<style>
	.cb-code {
		font-family: var(--font-mono);
		font-size: 0.95em;
		background: var(--color-code-bg);
		border-radius: 0.25rem;
		padding: 0.05em 0.32em;
	}
</style>
