<script lang="ts">
	import { onDestroy } from 'svelte';
	import { agentRuntime } from '$lib/ai/runtime.svelte';
	import catalog from '$lib/ai/cloud/model-catalog.json';
	import type { CloudProvider } from '$lib/ai/cloud/backend';
	let provider = $state<CloudProvider>('openai');
	let selected = $state('');
	let customId = $state('');
	let key = $state('');
	let error = $state('');
	const models = $derived(catalog.models.filter((model) => model.provider === provider));
	const modelId = $derived(
		selected === 'custom' ? customId.trim() : selected || models[0]?.id || ''
	);
	function chooseProvider(event: Event) {
		provider = (event.currentTarget as HTMLSelectElement).value as CloudProvider;
		selected = '';
		customId = '';
		key = '';
		error = '';
	}
	function connect(event: SubmitEvent) {
		event.preventDefault();
		try {
			agentRuntime.connectCloud(provider, modelId, key);
			key = '';
			error = '';
		} catch (cause) {
			error = cause instanceof Error ? cause.message : 'Could not connect.';
		}
	}
	onDestroy(() => {
		key = '';
	});
</script>

<svelte:window
	onpagehide={() => {
		key = '';
	}}
/>

<section class="cloud-settings" aria-label="Connect an AI provider">
	<h3>Use your own AI</h3>
	<p>
		Optional. Your questions and any shared practice transcript go directly to your provider. API
		usage is billed to your account.
	</p>
	{#if agentRuntime.backendName === 'cloud'}
		<div class="connected" role="status">
			<strong>{agentRuntime.badgeLabel}</strong>
			<span>Key held for this page session. Access is checked when you send a question.</span>
			<button type="button" onclick={() => agentRuntime.useMock()}>Disconnect and clear key</button>
		</div>
	{/if}
	<form onsubmit={connect}>
		<label
			>Provider
			<select
				value={provider}
				onchange={chooseProvider}
				disabled={agentRuntime.status === 'generating'}
			>
				<option value="openai">OpenAI</option>
				<option value="anthropic">Anthropic</option>
			</select>
		</label>
		<label
			>Model
			<select bind:value={selected} disabled={agentRuntime.status === 'generating'}>
				<option value="">Choose a model</option>
				{#each models as model (model.id)}<option value={model.id}>{model.label}</option>{/each}
				<option value="custom">Enter an exact model ID…</option>
			</select>
		</label>
		{#if selected === 'custom'}
			<label
				>Exact API model ID
				<input
					bind:value={customId}
					placeholder="Model ID from your provider"
					autocomplete="off"
					spellcheck="false"
					maxlength="160"
					required
				/>
			</label>
		{/if}
		<p class="note">
			Catalog updated {catalog.updated}. Monthly pull requests keep these public choices current;
			your account may have different access.
		</p>
		<label
			>API key
			<input
				bind:value={key}
				type="password"
				autocomplete="off"
				spellcheck="false"
				autocapitalize="off"
				placeholder="Paste your provider API key"
				required
			/>
		</label>
		<p class="note">
			Kept in memory only; reload to forget it. Browser extensions or compromised page code could
			read it. Use a restricted key and your provider’s spending controls.
		</p>
		{#if error}<p role="alert" class="error">{error}</p>{/if}
		<button
			class="connect"
			type="submit"
			disabled={!key.trim() ||
				!selected ||
				!modelId ||
				agentRuntime.localBusy ||
				agentRuntime.status === 'generating'}>Use this provider and model</button
		>
		<p class="note">
			Switching starts a fresh conversation. No request is sent until you ask a question. To switch
			later, enter your key again.
		</p>
	</form>
</section>

<style>
	.cloud-settings {
		display: grid;
		gap: 0.75rem;
		color: var(--color-text-secondary);
	}
	h3 {
		color: var(--color-text);
		font-size: 0.9rem;
		font-weight: 650;
	}
	p,
	.connected span {
		font-size: 0.75rem;
		line-height: 1.6;
		margin: 0;
	}
	form,
	label,
	.connected {
		display: grid;
		gap: 0.45rem;
	}
	form {
		gap: 0.75rem;
	}
	label {
		font-size: 0.75rem;
		font-weight: 600;
	}
	input,
	select {
		width: 100%;
		min-width: 0;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		padding: 0.55rem;
		background: var(--color-bg-secondary);
		color: var(--color-text);
		font-size: 0.8rem;
	}
	input:focus-visible,
	select:focus-visible,
	button:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 2px;
	}
	button {
		cursor: pointer;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		padding: 0.55rem 0.7rem;
		font-size: 0.75rem;
		color: var(--color-text);
		background: var(--color-surface);
	}
	.connect {
		color: var(--color-primary-text);
		border-color: var(--color-primary);
	}
	button:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}
	.note {
		font-size: 0.7rem;
		color: var(--color-text-muted);
	}
	.connected {
		padding: 0.7rem;
		border: 1px solid var(--color-primary);
		border-radius: 0.5rem;
		overflow-wrap: anywhere;
	}
	.connected strong {
		font-size: 0.75rem;
		color: var(--color-text);
	}
	.error {
		color: var(--color-warning);
	}
</style>
