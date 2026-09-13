<script lang="ts">
	import CodeBlock from './CodeBlock.svelte';
	let {
		command,
		output,
		title = 'You type',
		error = false
	}: {
		command: string;
		output: string;
		title?: string;
		error?: boolean;
	} = $props();
</script>

<div class="transcript">
	<CodeBlock code={command} {title} />
	<div class="reply">
		<p>{error ? 'The terminal reports an error' : 'The terminal prints'}</p>
		<pre class:error>{output || '(No text printed.)'}</pre>
	</div>
</div>

<style>
	.transcript {
		margin: 1rem 0 1.4rem;
	}
	.reply {
		border-left: 2px solid var(--color-border);
		margin: -0.3rem 0 0 1rem;
		padding: 0.3rem 0.85rem;
	}
	p {
		margin: 0 0 0.35rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}
	pre {
		margin: 0;
		color: var(--color-text-secondary);
		font: 0.87rem/1.6 var(--font-mono);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	pre.error {
		color: var(--color-diff-del);
	}
</style>
