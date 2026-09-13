<script lang="ts">
	import { tick } from 'svelte';
	import { FilePenLine, Save, X } from 'lucide-svelte';

	export interface EditorFile {
		path: string;
		content: string;
		isNew: boolean;
	}

	let {
		cwd,
		initialPath = '',
		loadFile,
		saveFile,
		onclose
	}: {
		cwd: string;
		initialPath?: string;
		loadFile: (path: string) => EditorFile;
		saveFile: (path: string, content: string) => Promise<string>;
		onclose: () => void;
	} = $props();

	const id = $props.id();
	// Each opening starts a new editor; later typing belongs to the learner.
	// svelte-ignore state_referenced_locally
	let filename = $state(initialPath);
	let openedPath = $state('');
	let content = $state('');
	let savedContent = $state('');
	let isNew = $state(false);
	let status = $state('');
	let error = $state('');
	let saving = $state(false);
	let pendingAction = $state<(() => void) | null>(null);
	let textarea: HTMLTextAreaElement | undefined = $state();
	let keepButton: HTMLButtonElement | undefined = $state();
	let filenameInput: HTMLInputElement | undefined = $state();
	const dirty = $derived(content !== savedContent);

	/** Also used by the playground before reset, scenario change, or close. */
	export function requestLeave(action: () => void) {
		if (saving) return;
		if (!dirty) {
			action();
			return;
		}
		pendingAction = action;
		tick().then(() => keepButton?.focus());
	}

	export function focusFilename() {
		filenameInput?.focus();
	}

	function openFile(event: SubmitEvent) {
		event.preventDefault();
		error = '';
		try {
			// Read first: an invalid path must not throw away a useful draft.
			const next = loadFile(filename);
			requestLeave(() => {
				openedPath = next.path;
				filename = next.path;
				content = next.content;
				savedContent = next.content;
				isNew = next.isNew;
				status = next.isNew ? 'New file. Save when you are ready.' : `Opened ${next.path}.`;
				tick().then(() => textarea?.focus());
			});
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		}
	}

	async function save() {
		if (!openedPath || saving) return;
		saving = true;
		error = '';
		try {
			const message = await saveFile(openedPath, content);
			savedContent = content;
			isNew = false;
			status = message;
		} catch (err) {
			error = err instanceof Error ? err.message : String(err);
		} finally {
			saving = false;
		}
	}

	function keepEditing() {
		pendingAction = null;
		tick().then(() => textarea?.focus());
	}

	function discard() {
		const action = pendingAction;
		pendingAction = null;
		action?.();
	}

	function handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			event.preventDefault();
			event.stopPropagation();
			if (pendingAction) keepEditing();
			else requestLeave(onclose);
		} else if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
			event.preventDefault();
			event.stopPropagation();
			if (!pendingAction) save();
		}
	}
</script>

<!-- This is an inline region, not a modal: Tab and Shift+Tab remain native. -->
<!-- Bubbled shortcuts belong to the controls in this region, not a new focus stop. -->
<!-- svelte-ignore a11y_no_noninteractive_element_interactions -->
<section class="file-editor" aria-label="Practice file editor" onkeydown={handleKeydown}>
	<div class="editor-heading">
		<FilePenLine size={15} aria-hidden="true" />
		<h3>Practice file editor</h3>
		<button
			type="button"
			class="close-editor"
			onclick={() => requestLeave(onclose)}
			disabled={saving}
			aria-label="Close file editor"><X size={16} /></button
		>
	</div>
	<p class="editor-help">
		Edits stay in this playground. On your computer, use an editor such as nano.
	</p>
	<form class="open-file" onsubmit={openFile}>
		<label for={id + '-path'}>File path</label>
		<div class="path-controls">
			<input
				id={id + '-path'}
				bind:this={filenameInput}
				bind:value={filename}
				placeholder="notes.txt"
				autocomplete="off"
				spellcheck="false"
				disabled={saving || !!pendingAction}
				aria-describedby={id + '-path-help'}
			/>
			<button type="submit" disabled={saving || !!pendingAction}>Open or create</button>
		</div>
		<p id={id + '-path-help'} class="editor-help">
			Starting folder: <code>{cwd}</code>. No shell quotes needed.
		</p>
	</form>
	{#if openedPath}
		<div class="document-heading">
			<label for={id + '-content'}>File contents</label>
			<span>{dirty ? 'Unsaved changes' : isNew ? 'Not saved yet' : 'Saved contents'}</span>
		</div>
		<p class="opened-path"><code>{openedPath}</code></p>
		<textarea
			id={id + '-content'}
			bind:this={textarea}
			bind:value={content}
			rows="8"
			spellcheck="false"
			autocapitalize="off"
			disabled={saving || !!pendingAction}
		></textarea>
		<div class="save-controls">
			<button type="button" onclick={save} disabled={saving || !!pendingAction}>
				<Save size={14} aria-hidden="true" />{saving ? 'Saving…' : 'Save file'}
			</button>
			<span class="editor-help">Ctrl+S / ⌘S saves · Escape closes</span>
		</div>
	{/if}
	{#if pendingAction}
		<div class="discard-warning" role="alert">
			<p>You have unsaved changes in <code>{openedPath}</code>. Discard them to continue?</p>
			<div class="discard-controls">
				<button type="button" bind:this={keepButton} onclick={keepEditing}>Keep editing</button>
				<button type="button" onclick={discard}>Discard changes and continue</button>
			</div>
		</div>
	{/if}
	{#if error}<p class="editor-error" role="alert">{error}</p>{/if}
	<p class="editor-status" role="status">{dirty ? 'Your changes have not been saved.' : status}</p>
</section>

<style>
	.file-editor {
		display: flex;
		min-height: 0;
		min-width: 0;
		flex: 1;
		flex-direction: column;
		gap: 0.6rem;
		overflow-y: auto;
		padding: 1rem;
		background: var(--color-playground-bg);
		color: var(--color-text-secondary);
		font-size: 0.8125rem;
	}
	.editor-heading,
	.path-controls,
	.save-controls,
	.document-heading,
	.discard-controls {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}
	.editor-heading h3 {
		font-weight: 650;
		color: var(--color-text);
	}
	.editor-heading .close-editor {
		margin-left: auto;
		padding: 0.5rem;
	}
	.editor-help {
		font-size: 0.6875rem;
		line-height: 1.6;
		color: var(--color-text-muted);
	}
	.open-file {
		display: grid;
		gap: 0.35rem;
	}
	label {
		font-weight: 600;
		color: var(--color-text);
	}
	input,
	textarea {
		min-width: 0;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-secondary);
		color: var(--color-text);
		padding: 0.6rem;
		font-family: var(--font-mono);
		font-size: 0.8125rem;
	}
	input {
		width: 100%;
		flex: 1;
	}
	textarea {
		width: 100%;
		min-height: 7rem;
		flex: 1 0 7rem;
		resize: vertical;
		line-height: 1.6;
	}
	button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-surface);
		color: var(--color-text);
		padding: 0.6rem 0.7rem;
		font-size: 0.75rem;
		cursor: pointer;
	}
	button:disabled {
		cursor: default;
		opacity: 0.5;
	}
	button:focus-visible,
	input:focus-visible,
	textarea:focus-visible {
		outline: 2px solid var(--color-important);
		outline-offset: 2px;
	}
	.document-heading {
		flex-wrap: wrap;
		justify-content: space-between;
	}
	.document-heading span {
		font-size: 0.6875rem;
		color: var(--color-text-muted);
	}
	.opened-path,
	.editor-status,
	.editor-error,
	.discard-warning {
		overflow-wrap: anywhere;
	}
	.opened-path {
		font-size: 0.6875rem;
	}
	.save-controls,
	.discard-controls {
		flex-wrap: wrap;
	}
	.editor-status {
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}
	.editor-status:empty {
		display: none;
	}
	.editor-error {
		color: var(--color-warning);
	}
	.discard-warning {
		border: 1px solid var(--color-warning);
		border-radius: 0.4rem;
		padding: 0.75rem;
	}
	.discard-warning p {
		margin-bottom: 0.6rem;
	}
</style>
