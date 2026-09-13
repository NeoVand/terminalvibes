<script lang="ts">
	let { title, steps }: { title: string; steps: { label: string; detail: string }[] } = $props();
</script>

<figure aria-label={title} class="workflow-steps">
	<figcaption>{title}</figcaption>
	<ol>
		{#each steps as step, index (step.label)}
			<li>
				<span class="step-number" aria-hidden="true">{index + 1}</span>
				<div>
					<strong>{step.label}</strong>
					<p>{step.detail}</p>
				</div>
			</li>
		{/each}
	</ol>
</figure>

<style>
	.workflow-steps {
		margin: 1.5rem 0;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		background: var(--color-bg-secondary);
	}
	figcaption {
		color: var(--color-text);
		font: 600 0.85rem/1.5 var(--font-heading);
		margin-bottom: 0.8rem;
	}
	ol {
		list-style: none;
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
		gap: 0.7rem;
		padding: 0;
		margin: 0;
	}
	li {
		display: flex;
		align-items: flex-start;
		gap: 0.6rem;
		padding: 0.8rem;
		background: var(--color-bg);
		border-radius: 0.5rem;
	}
	.step-number {
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		width: 1.4rem;
		height: 1.4rem;
		background: var(--color-primary);
		color: var(--color-bg);
		border-radius: 50%;
		font: 0.7rem var(--font-mono);
	}
	strong {
		color: var(--color-text);
		font-size: 0.85rem;
		font-weight: 600;
	}
	p {
		color: var(--color-text-secondary);
		font-size: 0.78rem;
		line-height: 1.7;
		margin: 0.35rem 0 0;
	}
	@media (max-width: 500px) {
		ol {
			grid-template-columns: 1fr;
		}
	}
</style>
