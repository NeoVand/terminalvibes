<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { ArrowUp, CornerDownLeft } from 'lucide-svelte';
	import type { ShellEngine } from '$lib/playground/shell-engine';
	import type { runShellCommand } from '$lib/playground/shell-commands';
	import { markScenarioAttempted, markScenarioComplete } from '$lib/data/progress';
	import { learnerContext } from '$lib/ai/learner-context.svelte';
	import { actionForKey, editLine, navigateHistory } from '$lib/playground/line-editor';

	interface Turn {
		id: number;
		command: string;
		output: string;
		error?: boolean;
	}
	const steps = [
		{
			title: 'Make it say hello',
			instruction: 'Type this command, then press Enter.',
			example: 'echo "Hello, world!"'
		},
		{
			title: 'Make it yours',
			instruction: 'Keep echo and the quotes. Change the message to anything you like.',
			example: 'echo "I am growing something"'
		},
		{
			title: 'Try a small typo',
			instruction: 'Type ech instead of echo. Let’s see how the terminal tells us what happened.',
			example: 'ech "Hello again"'
		},
		{
			title: 'Repair your command',
			instruction: 'Press ↑ to bring back your command. Fix ech to echo, then press Enter.',
			example: 'echo "Hello again"'
		},
		{
			title: 'Change your mind',
			instruction:
				'Type a new command, but do not run it. Press Ctrl+C to discard that unfinished line.',
			example: 'echo "I changed my mind"'
		},
		{
			title: 'You can start, edit, and try again',
			instruction:
				'You ran a command, changed its message, fixed a typo, and discarded a draft. Keep exploring here, or try the keyboard workshop below.',
			example: ''
		}
	];
	let engine: ShellEngine | undefined;
	let execute: typeof runShellCommand | undefined;
	let ready = $state(false);
	let loadingError = $state(false);
	let busy = $state(false);
	let input = $state('');
	let step = $state(0);
	let feedback = $state('');
	let turns = $state<Turn[]>([]);
	let inputEl: HTMLInputElement | undefined;
	let resultsEl = $state<HTMLDivElement>();
	let historyPosition = { index: -1, draft: '' };
	let killBuffer = '';
	let lastKill = false;
	let turnId = 0;
	let disposed = false;
	const current = $derived(steps[step]);

	async function initialize() {
		loadingError = false;
		try {
			const [shell, commands] = await Promise.all([
				import('$lib/playground/shell-engine'),
				import('$lib/playground/shell-commands')
			]);
			if (disposed) return;
			engine = new shell.ShellEngine();
			await engine.reset();
			execute = commands.runShellCommand;
			ready = true;
		} catch {
			loadingError = true;
		}
	}

	onMount(() => {
		void initialize();
		return () => {
			disposed = true;
			learnerContext.clear('hello-first-command');
		};
	});

	async function submit(event: SubmitEvent) {
		event.preventDefault();
		if (!ready || busy || !engine || !execute || !input.trim()) return;
		const command = input;
		lastKill = false;
		input = '';
		busy = true;
		historyPosition = { index: -1, draft: '' };
		markScenarioAttempted('hello-first-command');
		try {
			const result = await execute(engine, command);
			const output = result.colored
				? (new DOMParser().parseFromString(result.output, 'text/html').body.textContent ?? '')
				: result.output;
			learnerContext.record({
				sandboxId: 'hello-first-command',
				title: 'Your first command',
				goal: current.instruction,
				cwd: engine.cwd,
				command,
				output: output === '__CLEAR__' ? '(Display cleared.)' : output,
				exitCode: engine.lastExitCode
			});
			if (output === '__CLEAR__') {
				turns = [];
				feedback = 'The display is clear. Your commands are still available with ↑.';
			} else {
				turns = [...turns, { id: ++turnId, command, output, error: result.error }].slice(-5);
				checkStep(command, output, !!result.error);
			}
		} catch {
			feedback = 'The practice terminal could not finish that command. Try again.';
		} finally {
			busy = false;
			await tick();
			if (resultsEl) resultsEl.scrollTop = resultsEl.scrollHeight;
			inputEl?.focus({ preventScroll: true });
		}
	}

	async function restart() {
		if (!engine || busy) return;
		ready = false;
		await engine.reset();
		step = 0;
		input = '';
		feedback = '';
		turns = [];
		killBuffer = '';
		lastKill = false;
		historyPosition = { index: -1, draft: '' };
		learnerContext.clear('hello-first-command');
		ready = true;
		await tick();
		inputEl?.focus({ preventScroll: true });
	}

	function checkStep(command: string, output: string, error: boolean) {
		const isEcho = /^echo\s/.test(command.trim());
		if (step === 0 && isEcho && !error && output.trim() === 'Hello, world!') {
			step = 1;
			feedback =
				'That was a command: an instruction you typed. echo prints your text. The quote marks hold the message together; they are not printed.';
		} else if (
			step === 1 &&
			isEcho &&
			!error &&
			output.trim() &&
			output.trim() !== 'Hello, world!'
		) {
			step = 2;
			feedback = 'You changed the instruction, and the result changed with it.';
		} else if (step === 2 && /^ech(?:\s|$)/.test(command.trim()) && error) {
			step = 3;
			feedback =
				'“Command not found” means it did not recognize ech. This typo did not change any files. We can fix it.';
		} else if (step === 3 && isEcho && !error) {
			step = 4;
			feedback =
				'The corrected command ran. You can edit an earlier command instead of starting over.';
		} else if (error) {
			feedback =
				'Read the error below. Check the command’s spelling and its quote marks, then try again. There is no score to lose.';
		} else {
			feedback =
				step === 5
					? 'Keep experimenting. This practice terminal uses a simulated filesystem.'
					: 'Your command ran. Try the small task above when you are ready.';
		}
	}

	async function recall(direction: 'older' | 'newer' = 'older') {
		if (!engine) return;
		lastKill = false;
		const next = navigateHistory(engine.historyLog, historyPosition, input, direction);
		historyPosition = { index: next.index, draft: next.draft };
		input = next.value;
		await tick();
		inputEl?.focus({ preventScroll: true });
		inputEl?.setSelectionRange(input.length, input.length);
	}

	function discard() {
		const hadDraft = input.length > 0;
		lastKill = false;
		input = '';
		historyPosition = { index: -1, draft: '' };
		if (step === 4 && hadDraft) {
			step = 5;
			markScenarioComplete('hello-first-command');
		}
		feedback = hadDraft
			? 'Draft discarded. It was not run. The empty input is ready for your next command.'
			: 'You already have an empty prompt, ready for a command.';
		inputEl?.focus({ preventScroll: true });
	}

	async function handleKey(event: KeyboardEvent) {
		if (event.isComposing) return;
		if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
			event.preventDefault();
			await recall(event.key === 'ArrowUp' ? 'older' : 'newer');
			return;
		}
		const action = actionForKey(event);
		if (!action || !inputEl) {
			lastKill = false;
			return;
		}
		if (action === 'cancel' && inputEl.selectionStart !== inputEl.selectionEnd) return;
		event.preventDefault();
		event.stopPropagation();
		const next = editLine(
			{
				value: input,
				start: inputEl.selectionStart ?? input.length,
				end: inputEl.selectionEnd ?? input.length,
				killBuffer,
				lastKill
			},
			action
		);
		killBuffer = next.killBuffer;
		lastKill = !!next.lastKill;
		if (next.cancelled) {
			discard();
			return;
		}
		if (next.cleared) {
			turns = [];
			feedback = 'The display is clear. Your commands are still available with ↑.';
			return;
		}
		input = next.value;
		await tick();
		inputEl?.setSelectionRange(next.start, next.end);
	}
</script>

<div id="hello-first-command" class="first-command" data-testid="first-command">
	<div class="lesson-step">
		<span class="step-count">{step < 5 ? `Step ${step + 1} of 5` : 'First steps complete'}</span>
		<h2>{current.title}</h2>
		<p id="first-command-instruction">{current.instruction}</p>
		{#if current.example}<code class="example">{current.example}</code>{/if}
	</div>
	<div class="terminal-surface">
		{#if turns.length}
			<div
				class="results"
				bind:this={resultsEl}
				role="log"
				aria-label="First command results"
				aria-live="polite"
			>
				{#each turns as turn (turn.id)}
					<div class="turn">
						<p class="typed">You typed <code>{turn.command}</code></p>
						<span class="result-label">{turn.error ? 'Error' : 'The terminal printed'}</span>
						<pre class:error={turn.error}>{turn.output || '(No text printed.)'}</pre>
					</div>
				{/each}
			</div>
		{/if}
		<form onsubmit={submit}>
			<label for="first-command-input">Your command</label>
			<div class="input-row">
				<span class="prompt" aria-hidden="true">❯</span>
				<input
					id="first-command-input"
					bind:this={inputEl}
					bind:value={input}
					oninput={() => {
						lastKill = false;
					}}
					onkeydown={handleKey}
					data-terminal-input
					aria-describedby="first-command-instruction"
					disabled={!ready || busy}
					autocomplete="off"
					autocapitalize="off"
					spellcheck="false"
					placeholder={ready ? 'Type here…' : 'Opening practice terminal…'}
				/>
				<button
					class="run"
					type="submit"
					disabled={!ready || busy || !input.trim()}
					aria-label="Run your first command"><CornerDownLeft size={16} /><span>Run</span></button
				>
			</div>
		</form>
		<div class="editing-buttons">
			<button type="button" onclick={() => recall()} disabled={!ready || busy || !turns.length}
				><ArrowUp size={13} /> Recall</button
			>
			<button type="button" onclick={discard} disabled={!ready || busy || !input}
				>Discard draft <kbd>Ctrl+C</kbd></button
			>
		</div>
	</div>
	{#if loadingError}<p class="feedback" role="alert">
			The practice terminal could not load. <button type="button" onclick={initialize}
				>Try loading again</button
			>
		</p>{/if}
	{#if feedback}<p class="feedback" role="status">{feedback}</p>{/if}
	{#if step === 5}<a class="next" href="#keyboard-workshop"
			>Next: get comfortable with the keyboard →</a
		>
		<button class="restart" type="button" onclick={restart}>Practise these first steps again</button
		>{/if}
	<p class="sandbox-note">Practice in your browser. Your computer’s files stay untouched.</p>
</div>

<style>
	.first-command {
		border: 1px solid var(--color-border);
		border-radius: 1rem;
		overflow: hidden;
		background: var(--color-bg-secondary);
	}
	.lesson-step {
		padding: 1.15rem 1.25rem 0.9rem;
	}
	.step-count {
		color: var(--color-primary-text);
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		text-transform: uppercase;
	}
	h2 {
		margin: 0.3rem 0 0.45rem;
		color: var(--color-text);
		font-size: 1.2rem;
		font-weight: 650;
	}
	.lesson-step p {
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.6;
		margin: 0;
	}
	.example {
		display: block;
		margin-top: 0.65rem;
		font: 0.92rem/1.5 var(--font-mono);
		color: var(--color-text);
		overflow-wrap: anywhere;
	}
	.terminal-surface {
		padding: 0.9rem 1.1rem;
		background: var(--color-terminal-bg);
		color: var(--color-terminal-text);
	}
	label {
		display: block;
		margin-bottom: 0.45rem;
		font-size: 0.7rem;
		color: var(--color-terminal-output);
	}
	.input-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		border: 1px solid var(--color-border);
		border-radius: 0.4rem;
		padding: 0.25rem 0.35rem 0.25rem 0.65rem;
	}
	.input-row:focus-within {
		outline: 2px solid var(--color-primary);
		outline-offset: 3px;
	}
	.prompt {
		color: var(--color-terminal-prompt);
	}
	input {
		width: 100%;
		min-width: 0;
		border: 0;
		outline: 0;
		box-shadow: none;
		padding: 0.55rem 0;
		color: inherit;
		background: transparent;
		font: 16px/1.4 var(--font-mono);
	}
	input:focus {
		outline: none;
		box-shadow: none;
	}
	input::placeholder {
		color: var(--color-text-muted);
		font-size: 0.82rem;
	}
	button {
		cursor: pointer;
	}
	button:disabled {
		opacity: 0.4;
		cursor: default;
	}
	.run {
		display: flex;
		align-items: center;
		gap: 0.3rem;
		padding: 0.65rem 0.5rem;
		font-size: 0.75rem;
		color: var(--color-terminal-prompt);
	}
	.editing-buttons {
		display: flex;
		flex-wrap: wrap;
		gap: 0.9rem;
		margin-top: 0.6rem;
	}
	.editing-buttons button {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		font-size: 0.7rem;
		color: var(--color-terminal-output);
		padding: 0.25rem 0;
	}
	kbd {
		font-size: 0.65rem;
		opacity: 0.8;
	}
	.results {
		max-height: 160px;
		overflow-y: auto;
		margin-bottom: 0.9rem;
	}
	.turn + .turn {
		margin-top: 1rem;
		padding-top: 0.65rem;
		border-top: 1px solid var(--color-border);
	}
	.typed {
		font-size: 0.68rem;
		color: var(--color-text-muted);
		margin-bottom: 0.35rem;
	}
	.typed code {
		color: var(--color-terminal-text);
		font-family: var(--font-mono);
		overflow-wrap: anywhere;
	}
	.result-label {
		font-size: 0.65rem;
		color: var(--color-terminal-output);
	}
	pre {
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		margin: 0.2rem 0 0;
		font: 0.87rem/1.5 var(--font-mono);
		color: var(--color-terminal-output);
	}
	pre.error {
		color: var(--color-diff-del);
	}
	.feedback {
		margin: 0.9rem 1.25rem 0;
		color: var(--color-text-secondary);
		font-size: 0.85rem;
		line-height: 1.6;
	}
	.feedback button,
	.next {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.next {
		display: block;
		margin: 0.75rem 1.25rem 0;
		font-size: 0.85rem;
	}
	.restart {
		margin: 0.65rem 1.25rem 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.sandbox-note {
		font-size: 0.7rem;
		line-height: 1.5;
		margin: 0.8rem 1.25rem;
		color: var(--color-text-muted);
	}
	@media (max-width: 420px) {
		.lesson-step {
			padding: 0.9rem 1rem 0.75rem;
		}
		.terminal-surface {
			padding: 0.8rem;
		}
		.run span {
			display: none;
		}
	}
</style>
