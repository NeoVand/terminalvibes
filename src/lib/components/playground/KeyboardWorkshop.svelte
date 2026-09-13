<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { base } from '$app/paths';
	import { ArrowRight, Check, RotateCcw, Keyboard } from 'lucide-svelte';
	import { actionForKey, editLine, type LineAction } from '$lib/playground/line-editor';

	const steps: {
		title: string;
		instruction: string;
		keys: string;
		action: LineAction;
		value: string;
		cursor: number;
		buffer?: string;
		reply: string;
	}[] = [
		{
			title: 'Jump to the beginning',
			instruction:
				'Click the line below. Hold Ctrl and tap A. The cursor jumps before the first letter.',
			keys: 'Ctrl + A',
			action: 'start',
			value: 'echo hello garden',
			cursor: 17,
			reply: 'At the beginning. Anything you type now goes before echo.'
		},
		{
			title: 'Jump to the end',
			instruction: 'Now hold Ctrl and tap E. You can cross a long line in one move.',
			keys: 'Ctrl + E',
			action: 'end',
			value: 'echo hello garden',
			cursor: 0,
			reply: 'At the end. You are ready to add something.'
		},
		{
			title: 'Replace the last word',
			instruction: 'Hold Ctrl and tap W to remove blue. Then type green and press Enter.',
			keys: 'Ctrl + W',
			action: 'killWord',
			value: 'echo blue',
			cursor: 9,
			reply: 'You replaced a word without retyping the whole command.'
		},
		{
			title: 'Keep the beginning',
			instruction:
				'The cursor is after tea. Hold Ctrl and tap K to remove everything to its right.',
			keys: 'Ctrl + K',
			action: 'killEnd',
			value: 'echo tea and cake',
			cursor: 8,
			reply: 'Only the part after the cursor was removed. echo tea is still there.'
		},
		{
			title: 'Bring that text back',
			instruction: 'Hold Ctrl and tap Y to put the removed text back at the cursor.',
			keys: 'Ctrl + Y',
			action: 'yank',
			value: 'echo tea',
			cursor: 8,
			buffer: ' and cake',
			reply:
				'The removed text is back. This restores text you cut from a command, not deleted files.'
		},
		{
			title: 'Remove the whole line',
			instruction:
				'This cursor is already at the end. Hold Ctrl and tap U. From any other position, use Ctrl+E first.',
			keys: 'Ctrl + U',
			action: 'killStart',
			value: 'echo start again',
			cursor: 16,
			reply: 'An empty line, ready for a fresh start. Ctrl+Y could bring the removed text back.'
		},
		{
			title: 'Change your mind',
			instruction: 'You have not run this unfinished command. Hold Ctrl and tap C to cancel it.',
			keys: 'Ctrl + C',
			action: 'cancel',
			value: 'echo I changed my mind',
			cursor: 22,
			reply: 'Cancelled. Nothing ran. Ctrl+C is your way back when a command is running, too.'
		}
	];

	let ready = $state(false);
	onMount(() => {
		ready = true;
	});
	let current = $state(0);
	let value = $state(steps[0].value);
	let cursor = $state(steps[0].cursor);
	let inputEl = $state<HTMLInputElement>();
	let killBuffer = '';
	let lastKill = false;
	let removed = $state('');
	let usedGesture = $state(false);
	let finished = $state(false);
	let feedback = $state('');
	let demonstration = $state(false);
	let explored = $state<number[]>([]);
	let shell = $state<'bash' | 'zsh'>('bash');
	let screenNote = $state('');
	let escapePrefix = false;
	const step = $derived(steps[current]);

	function placeCursor(position: number) {
		cursor = position;
		tick().then(() => {
			inputEl?.focus({ preventScroll: true });
			inputEl?.setSelectionRange(position, position);
		});
	}

	function load(index: number) {
		current = index;
		value = steps[index].value;
		killBuffer = steps[index].buffer ?? '';
		lastKill = false;
		removed = '';
		finished = false;
		usedGesture = false;
		feedback = '';
		demonstration = false;
		placeCursor(steps[index].cursor);
	}

	function complete() {
		finished = true;
		feedback = step.reply;
		if (!explored.includes(current)) explored = [...explored, current];
	}

	function apply(action: LineAction, demo = false) {
		const result = editLine(
			{ value, start: cursor, end: inputEl?.selectionEnd ?? cursor, killBuffer, lastKill },
			action,
			shell
		);
		value = result.value;
		killBuffer = result.killBuffer;
		lastKill = result.lastKill ?? false;
		removed = result.removed ?? '';
		if (action === step.action) {
			usedGesture = true;
			demonstration = demo;
			if (current === 2)
				feedback =
					'blue is gone. Type green, then press Enter. The letters you type appear at the cursor.';
			else complete();
		}
		placeCursor(result.start);
	}

	function handleKey(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (event.key === 'Escape') {
			escapePrefix = true;
			return;
		}
		if (event.key === 'Tab') {
			escapePrefix = false;
			return;
		}
		let action = actionForKey(event);
		if (escapePrefix && !event.ctrlKey && !event.metaKey && !event.altKey) {
			const words: Record<string, LineAction> = {
				b: 'wordBackward',
				f: 'wordForward',
				d: 'killNextWord'
			};
			action = words[event.key.toLowerCase()] ?? action;
		}
		escapePrefix = false;
		if (!action) {
			lastKill = false;
			return;
		}
		if (action === 'cancel' && inputEl?.selectionStart !== inputEl?.selectionEnd) return;
		event.preventDefault();
		if (action === 'clearScreen') {
			screenNote =
				'Ctrl+L redraws your terminal view. It does not delete files or command history. Here we keep the lesson visible.';
			return;
		}
		apply(action);
	}

	function submit(event: SubmitEvent) {
		event.preventDefault();
		if (current === 2 && usedGesture && value === 'echo green') complete();
		else if (current === 2)
			feedback =
				'Aim for echo green, with one space between the words. You can reset this step and try again.';
		else
			feedback =
				'This workshop edits text without running it. Try the shortcut above, or use Show me.';
	}

	function syncCursor() {
		cursor = inputEl?.selectionStart ?? value.length;
	}
</script>

<section id="keyboard-workshop" class="keyboard-workshop" aria-labelledby="keyboard-workshop-title">
	<div class="workshop-heading">
		<div>
			<p class="eyebrow"><Keyboard size={15} aria-hidden="true" /> Your next small superpower</p>
			<h2 id="keyboard-workshop-title">Fix a line. Keep your flow.</h2>
			<p>
				You do not have to erase a command one letter at a time. Try these little moves. Nothing
				here changes your files.
			</p>
		</div>
		<img
			src={`${base}/images/history-superpowers.webp`}
			width="2560"
			height="1440"
			loading="lazy"
			alt="A hermit crab follows a ribbon of earlier commands. Command history lets you return to something you typed."
		/>
	</div>

	<div class="workshop-card">
		<div class="step-meta">
			<span>Move {current + 1} of {steps.length}</span><span>{explored.length} explored</span>
		</div>
		<div class="step-progress" aria-hidden="true">
			{#each steps as item, index (item.title)}<span
					class:visited={explored.includes(index)}
					class:current={index === current}
				></span>{/each}
		</div>
		<h3>{step.title}</h3>
		<p class="instruction">{step.instruction}</p>
		<p class="key-note">
			Use the <strong>Control</strong> key, including on a Mac. Keep it held while you tap the letter,
			then let go.
		</p>

		<form onsubmit={submit}>
			<label for="keyboard-practice-input">Try here — this is an editable practice line</label>
			<div class="practice-input-wrap">
				<span aria-hidden="true">$</span><input
					id="keyboard-practice-input"
					disabled={!ready}
					bind:this={inputEl}
					bind:value
					onkeydown={handleKey}
					oninput={() => {
						lastKill = false;
						syncCursor();
					}}
					onselect={syncCursor}
					onclick={syncCursor}
					onkeyup={syncCursor}
					data-terminal-input
					spellcheck="false"
					autocomplete="off"
					autocapitalize="off"
					aria-describedby="keyboard-practice-help"
				/>
			</div>
		</form>
		<p id="keyboard-practice-help" class="key-note">
			Click before trying a shortcut. Tab or Shift+Tab leaves this practice line. On a phone, use
			Show me.
		</p>

		<div class="cursor-view" aria-hidden="true">
			<span class="view-label">Cursor close-up</span>
			<div class="cursor-line">
				<span>{value.slice(0, cursor)}</span><span class="visible-cursor">▏</span><span
					>{value.slice(cursor)}</span
				><span class="empty-space"> </span>
			</div>
		</div>
		<div class="removed-text">
			<span>Removed text</span>{#if removed}<code>{removed}</code>{:else}<span class="muted"
					>{step.action === 'yank'
						? 'Saved from the previous move: “ and cake”'
						: 'Nothing removed in this move.'}</span
				>{/if}
		</div>

		<div class="workshop-actions">
			<button
				class="show-key"
				disabled={!ready}
				type="button"
				onclick={() => apply(step.action, true)}>Show me <kbd>{step.keys}</kbd></button
			><button class="reset-step" type="button" onclick={() => load(current)}
				><RotateCcw size={14} aria-hidden="true" /> Reset this move</button
			>
		</div>
		<div class="step-feedback" role="status" aria-live="polite">
			{#if finished}<Check size={17} aria-hidden="true" />{/if}
			<p>
				{feedback}{#if finished && demonstration}<span class="demo-note">
						You watched a demonstration. Reset to try the keys yourself when you have a keyboard.</span
					>{/if}
			</p>
		</div>
		{#if finished && current < steps.length - 1}<button
				type="button"
				class="next-move"
				onclick={() => load(current + 1)}
				>Next small move <ArrowRight size={16} aria-hidden="true" /></button
			>{:else if finished}<div class="workshop-done">
				<strong>You have a way forward when a line goes wrong.</strong>
				<p>
					You can come back to these moves whenever you need them. There is no timer and nothing to
					memorize today.
				</p>
				<button type="button" class="reset-step" onclick={() => load(0)}>Practise again</button>
			</div>{/if}
	</div>

	<details class="keyboard-more">
		<summary>A few more useful moves, when you need them</summary>
		<p>
			These are common Bash and zsh shortcuts in their default Emacs editing mode. Custom keyboard
			settings can change them.
		</p>
		<div class="reference-scroll">
			<table>
				<thead><tr><th>What you want</th><th>Try this</th><th>What happens</th></tr></thead><tbody>
					<tr
						><td>Recall a command</td><td><kbd>↑</kbd> / <kbd>↓</kbd></td><td
							>Browse commands you already ran, then edit before pressing Enter. Try this in the
							playground above.</td
						></tr
					>
					<tr
						><td>Move a word at a time</td><td><kbd>Alt+B</kbd> / <kbd>Alt+F</kbd></td><td
							>Move backward / forward by a word. Esc, then B or F is another way; on a Mac, Option
							may need terminal configuration.</td
						></tr
					>
					<tr
						><td>Remove the next word</td><td><kbd>Alt+D</kbd></td><td
							>Remove the word after the cursor. Esc, then D also works in this workshop.</td
						></tr
					>
					<tr
						><td>Finish a name</td><td><kbd>Tab</kbd></td><td
							>The playground completes command or file names and shows choices when more than one
							matches.</td
						></tr
					>
					<tr
						><td>Find an older command</td><td><kbd>Ctrl+R</kbd></td><td
							>In your terminal, type a remembered piece; press Ctrl+R again for an older match,
							Enter to run, or Ctrl+C to cancel. Browsers may take this key to reload the page.</td
						></tr
					>
					<tr
						><td>Clear the view</td><td><kbd>Ctrl+L</kbd></td><td
							>Redraw the terminal. Files and command history stay. Browsers may take this key for
							the address bar; try the clear command in a playground instead.</td
						></tr
					>
				</tbody>
			</table>
		</div>
		<p class="native-note">
			<strong>One difference worth knowing:</strong> Bash normally uses Ctrl+U to remove text before the
			cursor. zsh normally removes the whole line. Ctrl+E, then Ctrl+U works for a single line in both.
		</p>
		<label class="shell-choice" for="keyboard-shell"
			>Compare Ctrl+U here <select id="keyboard-shell" bind:value={shell}
				><option value="bash">Bash default</option><option value="zsh">zsh default</option></select
			></label
		>
		<p class="key-note">
			Ctrl+D has a different job: it can close a shell at an empty prompt. It is not the shortcut
			for cancelling a command.
		</p>
		<p class="native-note">
			<strong>Try it in your own terminal later:</strong> type <code>echo blue</code> without
			pressing Enter. Use Ctrl+W, type <code>green</code>, then press Enter. You should see
			<code>green</code>. Repeat once with the guide closed. A browser demonstration is useful; your
			own keyboard is where the habit grows.
		</p>
	</details>
	{#if screenNote}<p role="status" class="key-note">{screenNote}</p>{/if}
</section>

<style>
	.keyboard-workshop {
		margin: 3rem 0;
		scroll-margin-top: 6rem;
	}
	.workshop-heading {
		display: grid;
		grid-template-columns: 1.3fr 0.8fr;
		gap: 1.5rem;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	.workshop-heading img {
		width: 100%;
		height: auto;
		border-radius: 1rem;
	}
	.eyebrow {
		display: flex;
		align-items: center;
		gap: 0.45rem;
		color: var(--color-text);
		font-size: 0.78rem;
		letter-spacing: 0.04em;
	}
	h2 {
		font-family: var(--font-heading);
		color: var(--color-text);
		font-size: clamp(1.7rem, 3vw, 2.25rem);
		line-height: 1.2;
		margin: 0.55rem 0 0.8rem;
	}
	p {
		line-height: 1.75;
		margin: 0.5rem 0;
	}
	.workshop-card {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		padding: 1.5rem;
	}
	.step-meta {
		display: flex;
		justify-content: space-between;
		color: var(--color-text-secondary);
		font: 0.75rem var(--font-mono);
	}
	.step-progress {
		display: flex;
		gap: 0.3rem;
		margin: 0.75rem 0 1.5rem;
	}
	.step-progress span {
		height: 4px;
		flex: 1;
		background: var(--color-border);
		border-radius: 2px;
	}
	.step-progress span.current {
		background: var(--color-text-muted);
	}
	.step-progress span.visited {
		background: var(--color-primary);
	}
	h3 {
		margin: 0 0 0.5rem;
		font-size: 1.4rem;
		color: var(--color-text);
	}
	.instruction {
		font-size: 1rem;
	}
	.key-note {
		font-size: 0.78rem;
		color: var(--color-text-secondary);
	}
	form {
		margin-top: 1.25rem;
	}
	label {
		display: block;
		font-size: 0.8rem;
		margin-bottom: 0.5rem;
	}
	.practice-input-wrap {
		display: flex;
		gap: 0.65rem;
		align-items: center;
		background: var(--color-terminal-bg);
		border: 1px solid var(--color-border);
		border-radius: 0.6rem;
		padding: 0.8rem;
	}
	.practice-input-wrap:focus-within {
		outline: 2px solid var(--color-primary);
		outline-offset: 3px;
	}
	.practice-input-wrap > span {
		color: var(--color-primary);
		font-family: var(--font-mono);
	}
	input {
		background: transparent;
		border: 0;
		padding: 0;
		min-width: 0;
		width: 100%;
		color: var(--color-text);
		font: 1rem var(--font-mono);
		outline: none;
		box-shadow: none;
	}
	.cursor-view {
		border-left: 2px solid var(--color-primary);
		padding: 0.65rem 0.9rem;
		margin: 1.25rem 0 0.75rem;
		overflow-x: auto;
	}
	.view-label {
		display: block;
		font-size: 0.7rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--color-text-secondary);
		margin-bottom: 0.4rem;
	}
	.cursor-line {
		white-space: pre;
		font: 1.15rem/1.8 var(--font-mono);
		color: var(--color-text);
	}
	.visible-cursor {
		display: inline-block;
		width: 0;
		position: relative;
		left: -0.13em;
		font-weight: bold;
		color: var(--color-primary);
	}
	.empty-space {
		display: inline-block;
		width: 0.25rem;
	}
	.removed-text {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		font-size: 0.8rem;
		align-items: baseline;
		min-height: 2rem;
	}
	.removed-text code {
		padding: 0.1rem 0.4rem;
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
		color: var(--color-warning);
		white-space: pre-wrap;
		overflow-wrap: anywhere;
	}
	.muted {
		color: var(--color-text-secondary);
	}
	.workshop-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 0.6rem;
		margin-top: 1rem;
	}
	button {
		cursor: pointer;
	}
	button:focus-visible,
	select:focus-visible,
	summary:focus-visible {
		outline: 2px solid var(--color-primary);
		outline-offset: 4px;
	}
	.show-key,
	.reset-step,
	.next-move {
		display: inline-flex;
		gap: 0.6rem;
		align-items: center;
		justify-content: center;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.65rem 0.85rem;
		font-size: 0.8rem;
		min-height: 44px;
	}
	.show-key {
		background: var(--color-bg-tertiary);
		color: var(--color-text);
	}
	.reset-step {
		background: transparent;
		color: var(--color-text-secondary);
	}
	kbd {
		display: inline-block;
		border: 1px solid var(--color-border);
		border-bottom-width: 2px;
		border-radius: 0.25rem;
		padding: 0.1rem 0.35rem;
		font: 0.75rem var(--font-mono);
		white-space: nowrap;
	}
	.step-feedback {
		display: flex;
		align-items: flex-start;
		gap: 0.5rem;
		margin-top: 0.8rem;
		font-size: 0.88rem;
		color: var(--color-text);
	}
	.step-feedback :global(svg) {
		flex-shrink: 0;
		margin-top: 0.85rem;
	}
	.demo-note {
		display: block;
		color: var(--color-text-secondary);
		font-size: 0.78rem;
	}
	.next-move {
		margin-top: 0.75rem;
		background: var(--color-primary);
		color: var(--color-bg);
		font-weight: 600;
	}
	.workshop-done {
		border-top: 1px solid var(--color-border);
		padding-top: 1rem;
		margin-top: 1rem;
	}
	.workshop-done p {
		font-size: 0.9rem;
	}
	.keyboard-more {
		margin-top: 1rem;
		border-bottom: 1px solid var(--color-border);
		padding: 0.8rem 0 1rem;
		font-size: 0.88rem;
	}
	summary {
		cursor: pointer;
		color: var(--color-text);
		font-weight: 600;
		padding: 0.4rem 0;
	}
	.reference-scroll {
		overflow-x: auto;
		margin: 1rem 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}
	th,
	td {
		text-align: left;
		padding: 0.75rem;
		vertical-align: top;
		border-bottom: 1px solid var(--color-border);
		line-height: 1.65;
	}
	th {
		color: var(--color-text);
	}
	.native-note {
		margin: 1rem 0;
	}
	.shell-choice {
		display: flex;
		align-items: center;
		flex-wrap: wrap;
		gap: 0.6rem;
	}
	select {
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		background: var(--color-bg-secondary);
		color: var(--color-text);
		padding: 0.55rem 1.75rem 0.55rem 0.6rem;
	}
	@media (max-width: 600px) {
		.workshop-heading {
			grid-template-columns: 1fr;
			gap: 0.5rem;
		}
		.workshop-heading img {
			max-height: 210px;
			object-fit: cover;
		}
		.workshop-card {
			padding: 1rem;
		}
		.workshop-actions > button {
			flex: 1;
		}
		th,
		td {
			padding: 0.5rem;
		}
	}
</style>
