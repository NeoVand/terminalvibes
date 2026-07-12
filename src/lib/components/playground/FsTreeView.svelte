<script lang="ts">
	import { FileCog, FileText, Folder, FolderOpen, Home } from 'lucide-svelte';
	import type { FsTreeNode } from '$lib/playground/fs-tree';

	let { tree }: { tree: FsTreeNode | null } = $props();
</script>

{#snippet row(node: FsTreeNode, isRoot: boolean)}
	<div class="fst-row" class:fst-cwd={node.isCwd} class:fst-dot={node.dotfile}>
		<span class="fst-icon" aria-hidden="true">
			{#if isRoot}
				<Home size={13} />
			{:else if node.kind === 'dir'}
				{#if node.isCwd || node.onCwdPath}
					<FolderOpen size={13} />
				{:else}
					<Folder size={13} />
				{/if}
			{:else if node.executable}
				<FileCog size={13} />
			{:else}
				<FileText size={13} />
			{/if}
		</span>
		<span class="fst-name" class:fst-name-dir={node.kind === 'dir'} class:fst-exec={node.executable}
			>{node.name}{node.kind === 'dir' && !isRoot ? '/' : ''}</span
		>
		{#if node.isCwd}
			<span class="fst-you">you are here</span>
		{/if}
	</div>
{/snippet}

{#snippet branch(node: FsTreeNode, isRoot: boolean)}
	{@render row(node, isRoot)}
	{#if node.children && node.children.length > 0}
		<ul class="fst-children" class:fst-root-children={isRoot}>
			{#each node.children as child (child.name)}
				<li>
					{@render branch(child, false)}
				</li>
			{/each}
			{#if node.hidden}
				<li>
					<div class="fst-row fst-more">+ {node.hidden} more</div>
				</li>
			{/if}
		</ul>
	{/if}
{/snippet}

<div class="fst" role="tree" aria-label="Sandbox file tree">
	{#if tree}
		{@render branch(tree, true)}
	{:else}
		<p class="fst-loading">Loading tree…</p>
	{/if}
</div>

<style>
	.fst {
		width: 100%;
		padding: 0.35rem 0.25rem;
		font-family: var(--font-mono);
		font-size: 12px;
		line-height: 1.35;
		color: var(--color-text-secondary);
	}

	.fst-children {
		list-style: none;
		margin: 0;
		padding-left: 1.1rem;
		border-left: 1px solid color-mix(in srgb, var(--color-border) 80%, transparent);
		margin-left: 0.45rem;
	}

	.fst-row {
		display: flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.14rem 0.45rem;
		border-radius: 0.375rem;
		width: fit-content;
		max-width: 100%;
	}

	.fst-icon {
		display: inline-flex;
		flex-shrink: 0;
		color: var(--color-primary);
		opacity: 0.85;
	}

	.fst-name {
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.fst-name-dir {
		font-weight: 600;
		color: var(--color-text);
	}

	.fst-exec {
		color: var(--color-important);
	}

	.fst-row .fst-icon :global(svg) {
		display: block;
	}

	.fst-dot {
		opacity: 0.55;
	}

	.fst-dot .fst-icon {
		color: var(--color-text-muted);
	}

	.fst-cwd {
		background: color-mix(in srgb, var(--color-primary) 14%, transparent);
		outline: 1px solid color-mix(in srgb, var(--color-primary) 45%, transparent);
	}

	.fst-cwd .fst-name {
		color: var(--color-primary-text);
	}

	.fst-you {
		flex-shrink: 0;
		margin-left: 0.2rem;
		border-radius: 9999px;
		padding: 0.05rem 0.45rem;
		font-size: 9.5px;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--color-text-inverse);
		background: var(--color-primary);
	}

	.fst-more {
		color: var(--color-text-muted);
		font-style: italic;
	}

	.fst-loading {
		font-size: 11.5px;
		color: var(--color-text-muted);
		font-style: italic;
		padding: 0.25rem 0.5rem;
	}
</style>
