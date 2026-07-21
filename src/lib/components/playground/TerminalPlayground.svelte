<script lang="ts">
	import { onDestroy, onMount, tick } from 'svelte';
	import {
		FolderTree,
		Terminal,
		RotateCcw,
		Gamepad2,
		Puzzle,
		ChevronRight,
		ChevronDown,
		X,
		ArrowLeft
	} from 'lucide-svelte';
	import FsTreeView from '$lib/components/playground/FsTreeView.svelte';
	import RichHint from '$lib/components/playground/RichHint.svelte';
	import { tokenizeShellCommand } from '$lib/data/bash-syntax';
	import { autohideScroll } from '$lib/actions/autohide-scroll';
	import { ShellEngine, BIN_COMMANDS } from '$lib/playground/shell-engine';
	import { runShellCommand } from '$lib/playground/shell-commands';
	import { snapshotFsTree, type FsTreeNode } from '$lib/playground/fs-tree';
	import {
		playgroundScenarios,
		getScenario,
		loadScenarioSeed,
		type PlaygroundScenario
	} from '$lib/playground/scenarios';
	import { activityKindOf, type ActivityKind } from '$lib/data/sidebar-nav';
	import {
		progress,
		markScenarioComplete,
		markScenarioAttempted,
		staleCompletions
	} from '$lib/data/progress';
	import { shareUrl, type SharedSession } from '$lib/playground/share';
	import { get } from 'svelte/store';
	import { agentRuntime } from '$lib/ai/runtime.svelte';
	import { downloadedModels } from '$lib/ai/local/models';
	import { CliSession, type CliEvent, type CliPhase } from '$lib/ai/cli/session';
	import {
		parseAgentInvocation,
		type AgentInvocation,
		AGENT_USAGE,
		AGENT_NO_MODEL,
		AGENT_BUSY,
		AGENT_WAKING,
		AGENT_MOCK_NOTE,
		AGENT_TRY_TASK
	} from '$lib/ai/cli/parse';

	interface HistoryLine {
		/** 'agent' = the CLI agent's dim prose; 'agent-cmd' = a proposal. */
		type: 'input' | 'output' | 'system' | 'agent' | 'agent-cmd';
		text: string;
		error?: boolean;
		colored?: boolean;
		/** For input lines: the cwd shown in the prompt when this was typed. */
		promptCwd?: string;
	}

	let {
		scenarioId = 'first-steps',
		embedded = false,
		panel = false,
		showScenarioPicker = !embedded,
		hideHeader = false,
		onClose,
		onResetReady,
		// Part of the public props API (callers pass unique ids); unused here
		// since the engine keys state internally.
		// eslint-disable-next-line @typescript-eslint/no-unused-vars
		id = 'playground',
		shared = null,
		kind,
		customScenario = null,
		onProgress
	}: {
		scenarioId?: string;
		embedded?: boolean;
		panel?: boolean;
		showScenarioPicker?: boolean;
		hideHeader?: boolean;
		onClose?: () => void;
		onResetReady?: (reset: () => void) => void;
		id?: string;
		shared?: SharedSession | null;
		kind?: ActivityKind;
		/**
		 * Run a scenario OBJECT rather than an id from `playgroundScenarios`.
		 * Challenges live in their own registry and reach the UI through
		 * `toScenario()`, so there is nothing for `getScenario` to look up.
		 */
		customScenario?: PlaygroundScenario | null;
		/**
		 * Fired after every command (and once per load/reset) with the engine's
		 * durable history and whether `check()` currently passes. ChallengeActivity
		 * scores off this; it is the only way out of the sandbox, and it is
		 * read-only — the caller cannot steer the terminal with it.
		 */
		onProgress?: (state: { history: readonly string[]; solved: boolean }) => void;
	} = $props();

	// One-shot: a shared session (from a #pg= link) replays once on first load.
	// Capturing the initial prop value is intentional — later prop changes
	// must NOT re-trigger a replay.
	// svelte-ignore state_referenced_locally
	let pendingShared: SharedSession | null = shared;

	let graphCollapsed = $state(false);

	// Capturing the initial value is intentional: the picker owns the state
	// afterwards, and the $effect below syncs later prop changes for embedded
	// playgrounds.
	// svelte-ignore state_referenced_locally
	let activeScenarioId = $state(scenarioId);
	let engine = $state<ShellEngine | null>(null);
	let history = $state<HistoryLine[]>([]);
	let input = $state('');
	let tree = $state<FsTreeNode | null>(null);
	let promptCwd = $state('~');
	let loading = $state(true);
	let historyIndex = $state(-1);
	let inputEl: HTMLInputElement | undefined = $state(undefined);
	let terminalEl: HTMLDivElement | undefined = $state(undefined);
	let inputFocused = $state(false);
	/** First focus dismisses the type-here hint for good. */
	let hasInteracted = $state(false);

	let scenario = $derived(customScenario ?? getScenario(activeScenarioId));

	/* ── what kind of activity is this card? ────────────────────────────────
	   The slot above the terminal used to be "the hint", marked with a
	   lightbulb. It is now the activity's TYPE marker, because the two kinds
	   of card put different things in it: a playground shows a hint that walks
	   you toward the answer, a challenge shows its brief — the whole of what
	   the learner gets — and a lightbulb over a challenge brief would promise
	   help that is deliberately not coming. Same icon as the sidebar row, so
	   card and TOC agree on what a thing is. */
	const activityKind = $derived<ActivityKind>(kind ?? activityKindOf(activeScenarioId));
	const isChallenge = $derived(activityKind === 'challenge');
	const TypeIcon = $derived(isChallenge ? Puzzle : Gamepad2);
	/** Earth-red for challenges; playgrounds keep the card's existing accent. */
	const typeAccent = $derived(isChallenge ? 'var(--color-challenge)' : 'var(--color-important)');
	const typeLabel = $derived(isChallenge ? 'Challenge brief:' : 'Playground hint:');
	/* A playground's chips are a walkthrough — clicked in order they reach the
	   answer, and "Try these commands" is the honest name for that. A
	   challenge's pool is overcomplete and salted: some of these chips are
	   wrong, and saying so is the difference between offering a kit and
	   offering a solution. */
	const chipsLabel = $derived(
		isChallenge ? 'Your kit — more than you need, and not all of it right' : 'Try these commands'
	);

	$effect(() => {
		if (!customScenario && scenarioId !== activeScenarioId && embedded) {
			activeScenarioId = scenarioId;
			loadScenario(getScenario(scenarioId));
		}
	});

	function refreshDiagram() {
		if (!engine) return;
		tree = snapshotFsTree(engine);
		promptCwd = engine.pretty(engine.cwd);
	}

	// Guards against interleaved loads (rapid scenario switches): only the
	// newest load may publish its results.
	let loadGeneration = 0;

	async function loadScenario(next: PlaygroundScenario) {
		// A scenario switch/reset pulls the rug out — end any agent session.
		cliSession?.interrupt();
		const generation = ++loadGeneration;
		loading = true;
		try {
			// Reuse one engine per playground — every load rebuilds the in-memory
			// filesystem from the scenario seed.
			engine ??= new ShellEngine();
			await loadScenarioSeed(engine, next);
			if (generation !== loadGeneration) return;
			checkArmed = true;
			commandLog = [];
			redoStack = [];
			// A fresh seed is a fresh attempt: tell the caller so a frozen grade
			// from the previous run can be cleared. An empty history IS the signal.
			onProgress?.({ history: [], solved: false });
			// A fresh scenario (or a reset) starts with an empty prompt and no
			// half-typed command lingering from before.
			input = '';
			historyIndex = -1;
			// A CHALLENGE'S BRIEF IS PRINTED ONCE, and the slot above the terminal
			// is where it is printed (see the `TypeIcon` note). Echoing
			// `description` into the scrollback as well put the same paragraph on
			// screen twice, a few pixels apart — so a challenge opens on the
			// how-to-drive line alone. A playground's `description` is a different
			// string from its hint, so it still earns its line.
			history = embedded
				? [
						...(isChallenge ? [] : [{ type: 'system' as const, text: next.description }]),
						{
							type: 'system',
							text: 'Type shell commands below. Enter "help" for supported commands.'
						}
					]
				: panel
					? [
							{ type: 'system', text: next.description },
							{
								type: 'system',
								text: 'Type shell commands below. Enter "help" for supported commands.'
							},
							...refresherNudge(next.id)
						]
					: [
							{ type: 'system', text: `Scenario: ${next.title}` },
							{ type: 'system', text: next.description },
							{
								type: 'system',
								text: 'Type shell commands below. Enter "help" for supported commands.'
							}
						];
			// A shared #pg= link: replay the captured commands onto the fresh seed
			if (pendingShared && pendingShared.scenarioId === next.id && engine) {
				const toReplay = pendingShared.commands;
				pendingShared = null;
				for (const cmd of toReplay) {
					await runShellCommand(engine, cmd).catch(() => {});
				}
				commandLog = [...toReplay];
				await recalibrateCheck(); // no award for someone else's commands
				history = [
					...history,
					{
						type: 'system',
						text: `▶ Restored a shared session: ${toReplay.length} command${toReplay.length === 1 ? '' : 's'} replayed. Type "undo" to step back through them.`
					}
				];
			}
			refreshDiagram();
		} catch (err) {
			if (generation !== loadGeneration) return;
			const message = err instanceof Error ? err.message : String(err);
			history = [{ type: 'output', text: `Failed to initialize sandbox: ${message}`, error: true }];
		} finally {
			if (generation === loadGeneration) {
				loading = false;
				// Embedded playgrounds load as the reader scrolls; autofocusing them
				// would steal focus and yank the page scroll to the input.
				if (!embedded) inputEl?.focus();
			}
		}
	}

	onMount(() => {
		loadScenario(customScenario ?? getScenario(activeScenarioId));
		onResetReady?.(resetScenario);
		// If a model was downloaded in a past session, warm it from cache so the
		// agent becomes available in the playground too — not just the panel.
		// initLocal is idempotent and never triggers a fresh download.
		if (downloadedModels().length > 0) agentRuntime.initLocal();
	});

	onDestroy(() => {
		cliSession?.interrupt();
	});

	// Undo is replay-based: rebuild the seed and re-run every command except
	// the undone one. Commands are deterministic, so the resulting state is
	// equivalent — and it's immune to every kind of engine state.
	let commandLog: string[] = [];
	let redoStack: string[] = [];

	async function rebuildFromLog() {
		if (!engine) return;
		loading = true;
		try {
			await loadScenarioSeed(engine, scenario);
			for (const cmd of commandLog) {
				await runShellCommand(engine, cmd).catch(() => {});
			}
			await recalibrateCheck();
		} finally {
			loading = false;
		}
		refreshDiagram();
	}

	/**
	 * After a rebuild/replay, only stay armed if the goal ISN'T already met —
	 * re-reaching a previously-earned state shouldn't re-award it, but future
	 * genuine progress should still complete.
	 */
	async function recalibrateCheck() {
		if (!engine || !scenario.check) {
			checkArmed = false;
			return;
		}
		try {
			checkArmed = !(await scenario.check(engine));
		} catch {
			checkArmed = true;
		}
	}

	async function handleUndo() {
		if (commandLog.length === 0) {
			history = [...history, { type: 'system', text: 'Nothing to undo yet.' }];
			return;
		}
		const undone = commandLog.pop()!;
		redoStack.push(undone);
		await rebuildFromLog();
		history = [...history, { type: 'system', text: `↩ Undid: ${undone}` }];
	}

	async function handleRedo() {
		const cmd = redoStack.pop();
		if (!cmd) {
			history = [...history, { type: 'system', text: 'Nothing to redo.' }];
			return;
		}
		await executeCommand(cmd, { fromRedo: true });
	}

	function handleShare() {
		const url = shareUrl({ scenarioId: activeScenarioId, commands: commandLog });
		navigator.clipboard?.writeText(url).catch(() => {});
		history = [
			...history,
			{
				type: 'system',
				text: `🔗 Share link (copied to clipboard):\n${url}\nAnyone opening it gets this scenario with your ${commandLog.length} command${commandLog.length === 1 ? '' : 's'} replayed.`
			}
		];
	}

	async function executeCommand(command: string, opts: { fromRedo?: boolean } = {}) {
		if (!engine) {
			history = [
				...history,
				{
					type: 'output',
					text: 'Sandbox still initializing. Try again in a moment.',
					error: true
				}
			];
			return;
		}

		// Stateless display commands don't belong in the undo/share log
		const stateless = command === 'clear' || command === 'help';
		if (!stateless) {
			if (!opts.fromRedo) redoStack = [];
			commandLog.push(command);
		}

		try {
			const result = await runShellCommand(engine, command);

			if (result.output === '__CLEAR__') {
				history = [];
			} else if (result.output) {
				history = [
					...history,
					{ type: 'output', text: result.output, error: result.error, colored: result.colored }
				];
			}

			refreshDiagram();
			await runScenarioCheck();
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			history = [...history, { type: 'output', text: `error: ${message}`, error: true }];
		}
	}

	/* ── the CLI agent: `agent "<task>"` runs the deep agent HERE ────────
	 * The interpreter stays pure and synchronous, so `agent` is intercepted
	 * at this layer (like undo/redo/share) before runShellCommand — the
	 * session machine lives in $lib/ai/cli/session, this component only
	 * renders its events and feeds it keystrokes. */

	let cliSession: CliSession | null = null;
	let cliPhase = $state<CliPhase>('idle');
	let cliEditing = $state(false);
	// The `agent "…"` chip appears the moment a model is available — reactively,
	// in every playground (the runtime is one shared singleton, and the mount
	// hook below populates `downloaded` + warms a cached model). The header
	// status chip reports the finer lifecycle (waking up / active).
	let agentChip = $derived(agentRuntime.downloaded.length > 0);
	let cliActive = $derived(
		cliPhase === 'generating' || cliPhase === 'awaiting-approval' || cliPhase === 'executing'
	);

	/** The header chip: the live model lifecycle, not a static "bash" label. */
	let modelStatus = $derived.by(() => {
		const r = agentRuntime;
		if (r.localPhase === 'downloading') {
			return {
				label: r.download.percent ? `downloading ${r.download.percent}%` : 'downloading…',
				tone: 'warm' as const
			};
		}
		if (r.localPhase === 'loading' || r.localPhase === 'probing') {
			return { label: 'agent waking up…', tone: 'warm' as const };
		}
		if (r.backendName === 'local' && r.localPhase === 'ready') {
			return { label: 'agent active', tone: 'active' as const };
		}
		return { label: 'sandboxed bash', tone: 'idle' as const };
	});
	/** True while the last history line is a streaming agent-prose block. */
	let proseOpen = false;

	function pushLine(line: HistoryLine) {
		history = [...history, line];
		scrollTerminal();
	}

	function handleCliEvent(event: CliEvent) {
		if (event.type === 'prose') {
			const last = history[history.length - 1];
			if (proseOpen && last?.type === 'agent') {
				last.text += event.text;
				history = [...history];
			} else {
				proseOpen = true;
				history = [...history, { type: 'agent', text: event.text }];
			}
			scrollTerminal();
			return;
		}
		proseOpen = false;
		if (event.type === 'proposal') {
			pushLine({ type: 'agent-cmd', text: event.cmd });
		} else if (event.type === 'verdict') {
			if (event.decision === 'deny' && event.reason !== 'SIGINT') {
				pushLine({ type: 'system', text: '✗ denied — the agent will adjust' });
			}
		} else if (event.type === 'notice') {
			pushLine({
				type: event.tone === 'error' ? 'output' : 'system',
				text: event.text,
				error: event.tone === 'error'
			});
		} else if (event.type === 'end') {
			if (event.reason === 'done') {
				if (event.ranCount > 0) {
					pushLine({ type: 'system', text: `✔ agent: ${event.summary ?? 'done.'}` });
				} else if (event.summary) {
					// Nothing ran, but the agent explained why (e.g. every command was
					// denied) — show that, no false checkmark.
					pushLine({ type: 'system', text: `agent: ${event.summary}` });
				} else {
					// The model wrapped up without proposing anything — say so plainly
					// instead of a hollow success line.
					pushLine({
						type: 'system',
						text: 'agent: finished without running any commands. Try rephrasing the task, or switch to the higher-quality model in the Agent panel settings.'
					});
				}
			} else if (event.reason === 'interrupted') {
				pushLine({
					type: 'system',
					text: 'agent: caught SIGINT — session interrupted. (Ctrl+C stops the foreground process, exactly as the course teaches.)'
				});
			}
		}
	}

	/** Approved commands run against THIS terminal: normal history lines,
	 *  same VFS, live file tree, scenario checks — and into the undo log. */
	async function runForAgent(cmd: string): Promise<{ output: string; error?: boolean }> {
		if (!engine) return { output: 'Sandbox still initializing.', error: true };
		history = [...history, { type: 'input', text: cmd, promptCwd }];
		redoStack = [];
		commandLog.push(cmd);
		try {
			const result = await runShellCommand(engine, cmd);
			if (result.output === '__CLEAR__') {
				history = [];
			} else if (result.output) {
				history = [
					...history,
					{ type: 'output', text: result.output, error: result.error, colored: result.colored }
				];
			}
			refreshDiagram();
			await runScenarioCheck();
			scrollTerminal();
			return { output: result.output === '__CLEAR__' ? '' : result.output, error: result.error };
		} catch (err) {
			const message = err instanceof Error ? err.message : String(err);
			history = [...history, { type: 'output', text: `error: ${message}`, error: true }];
			scrollTerminal();
			return { output: message, error: true };
		}
	}

	async function handleAgentCommand(inv: AgentInvocation) {
		if (inv.kind === 'help') {
			pushLine({ type: 'output', text: AGENT_USAGE });
			return;
		}
		if (inv.kind === 'error') {
			pushLine({ type: 'output', text: inv.message, error: true });
			return;
		}
		// Wake a previously downloaded model from cache (never a download).
		agentRuntime.initLocal();
		if (agentRuntime.downloaded.length === 0) {
			pushLine({ type: 'output', text: AGENT_NO_MODEL });
			return;
		}
		if (agentRuntime.localBusy) {
			pushLine({ type: 'output', text: AGENT_WAKING });
			return;
		}
		const backend = agentRuntime.backend;
		if (!backend.generateCli) {
			pushLine({
				type: 'output',
				text: 'agent: this backend cannot run CLI sessions.',
				error: true
			});
			return;
		}
		const session = new CliSession({
			backend,
			run: runForAgent,
			emit: handleCliEvent,
			onUpdate: (s) => {
				cliPhase = s.phase;
				cliEditing = s.editing;
			}
		});
		// One generation at a time across the chat panel and every terminal:
		// refuse (one line) instead of queueing behind an invisible turn.
		if (!agentRuntime.beginCliSession(() => session.interrupt())) {
			pushLine({ type: 'output', text: AGENT_BUSY, error: true });
			return;
		}
		if (backend.name === 'mock') {
			pushLine({ type: 'system', text: AGENT_MOCK_NOTE });
		}
		cliSession = session;
		proseOpen = false;
		try {
			await session.start(inv.task);
		} finally {
			agentRuntime.endCliSession();
			cliSession = null;
			cliEditing = false;
			inputEl?.focus();
		}
	}

	/** Session keystrokes: y/Enter allow · e edit · n deny · Ctrl+C/Esc SIGINT. */
	function handleCliKey(e: KeyboardEvent): boolean {
		const session = cliSession;
		if (!session) return false;
		// Ctrl+C is SIGINT — unless text is selected (then it's a copy).
		if (e.ctrlKey && !e.metaKey && e.key.toLowerCase() === 'c') {
			if (window.getSelection()?.toString()) return true;
			e.preventDefault();
			history = [...history, { type: 'output', text: '^C' }];
			session.interrupt();
			return true;
		}
		if (e.key === 'Escape') {
			e.preventDefault();
			session.interrupt();
			return true;
		}
		if (cliEditing) return false; // normal typing; Enter submits the edit
		if (e.metaKey || e.ctrlKey || e.altKey) return true; // browser chords pass
		e.preventDefault(); // a foreground program owns the keyboard
		if (cliPhase !== 'awaiting-approval') return true;
		const key = e.key.toLowerCase();
		if (key === 'y' || e.key === 'Enter') {
			session.approve();
		} else if (key === 'n') {
			session.deny();
		} else if (key === 'e') {
			const cmd = session.beginEdit();
			if (cmd !== null) {
				input = cmd;
				tick().then(() => {
					inputEl?.focus();
					inputEl?.setSelectionRange(cmd.length, cmd.length);
				});
			}
		}
		return true;
	}

	async function handleSubmit(e: Event) {
		e.preventDefault();
		if (cliActive) {
			// Enter while awaiting approval is handled in keydown (= allow);
			// the form only submits here for the edited command.
			if (cliEditing) {
				const edited = input.trim();
				if (!edited) return;
				input = '';
				cliSession?.submitEdit(edited);
			}
			return;
		}
		const command = input.trim();
		if (!command) return;

		// ENGAGEMENT, recorded at the one place every learner-submitted command
		// passes through — including undo/redo/share and `agent "…"`, all of which
		// are the learner doing something in this scenario. Not recorded for the
		// #pg= shared-session replay, which runs commands through the engine
		// directly and, for the same reason it earns no completion, is not this
		// learner's work.
		markScenarioAttempted(scenario.id);

		history = [...history, { type: 'input', text: command, promptCwd }];
		input = '';
		historyIndex = -1;

		const agentInv = parseAgentInvocation(command);
		if (command === 'undo') {
			await handleUndo();
		} else if (command === 'redo') {
			await handleRedo();
		} else if (command === 'share') {
			handleShare();
		} else if (agentInv) {
			await handleAgentCommand(agentInv);
		} else {
			await executeCommand(command);
		}
		scrollTerminal();
	}

	// Completion fires once per scenario load; resetting the scenario arms it
	// again so learners can re-earn the check (and the practice count goes up).
	let checkArmed = $state(true);

	async function runScenarioCheck() {
		if (!engine || !scenario.check) return;
		// Without a listener there is nothing to report, so keep the original
		// short-circuit: a disarmed check must not re-run every command.
		if (!checkArmed && !onProgress) return;
		let passed = false;
		try {
			passed = await scenario.check(engine);
		} catch {
			passed = false;
		}
		onProgress?.({ history: [...engine.historyLog], solved: passed });
		if (!passed || !checkArmed) return;
		checkArmed = false;
		markScenarioComplete(scenario.id);
		history = [
			...history,
			{
				type: 'system',
				text: `✔ Scenario complete — ${scenario.goal ?? 'goal state reached'}. Nice work! (Reset to practice again.)`
			}
		];
	}

	function scrollTerminal() {
		requestAnimationFrame(() => {
			if (terminalEl) terminalEl.scrollTop = terminalEl.scrollHeight;
		});
	}

	function handleKeydown(e: KeyboardEvent) {
		if (cliActive && handleCliKey(e)) return;
		if (e.key === 'ArrowUp') {
			e.preventDefault();
			const inputs = history.filter((h) => h.type === 'input').map((h) => h.text);
			if (inputs.length === 0) return;
			historyIndex = Math.min(historyIndex + 1, inputs.length - 1);
			input = inputs[inputs.length - 1 - historyIndex] ?? '';
		} else if (e.key === 'ArrowDown') {
			e.preventDefault();
			if (historyIndex <= 0) {
				historyIndex = -1;
				input = '';
				return;
			}
			historyIndex -= 1;
			const inputs = history.filter((h) => h.type === 'input').map((h) => h.text);
			input = inputs[inputs.length - 1 - historyIndex] ?? '';
		} else if (e.key === 'Tab') {
			e.preventDefault();
			completeInput();
		}
	}

	const EXTRA_COMMANDS = ['undo', 'redo', 'share'];

	function longestCommonPrefix(values: string[]): string {
		let prefix = values[0] ?? '';
		for (const value of values.slice(1)) {
			while (!value.startsWith(prefix)) prefix = prefix.slice(0, -1);
		}
		return prefix;
	}

	/**
	 * TAB completion, the real thing in miniature: first word completes from
	 * the command list, later words complete as paths against the sandbox
	 * filesystem (directories gain a trailing slash so you can keep drilling).
	 */
	function completeInput() {
		if (!engine || loading) return;
		const tokens = input.split(/(\s+)/);
		const last = tokens[tokens.length - 1] ?? '';
		if (!last || /\s/.test(last)) return;

		const words = input.trim().split(/\s+/);
		let candidates: string[];
		if (words.length === 1) {
			candidates = [...BIN_COMMANDS, ...EXTRA_COMMANDS, ...engine.aliases.keys()];
		} else {
			const slash = last.lastIndexOf('/');
			const dirPart = slash === -1 ? '' : last.slice(0, slash + 1);
			const baseDir = engine.resolve(dirPart || '.');
			const entries = engine.listDir(baseDir) ?? [];
			candidates = entries.map((name) => {
				const full = dirPart + name;
				return engine!.isDir(`${baseDir}/${name}`) ? `${full}/` : full;
			});
		}

		const matches = candidates.filter((c) => c.startsWith(last));
		if (matches.length === 0) return;
		const completion = matches.length === 1 ? matches[0] : longestCommonPrefix(matches);
		if (completion.length <= last.length) return;
		const done = matches.length === 1 && !completion.endsWith('/');
		tokens[tokens.length - 1] = completion + (done ? ' ' : '');
		input = tokens.join('');
	}

	async function resetScenario() {
		await loadScenario(customScenario ?? getScenario(activeScenarioId));
	}

	/**
	 * Spaced repetition, the honest local version: if a scenario was completed
	 * a while ago, suggest re-running it when the panel opens. Skills fade —
	 * muscle memory for the shell fastest of all.
	 */
	function refresherNudge(currentId: string): HistoryLine[] {
		const stale = staleCompletions(get(progress)).filter((s) => s.id !== currentId);
		if (stale.length === 0) return [];
		const target = getScenario(stale[0].id);
		if (target.id !== stale[0].id) return [];
		return [
			{
				type: 'system',
				text: `🔁 Refresher suggested: you completed "${target.title}" ${stale[0].daysAgo} days ago — pick it from the dropdown for a 2-minute rerun.`
			}
		];
	}

	async function changeScenario(nextId: string) {
		activeScenarioId = nextId;
		await loadScenario(getScenario(nextId));
	}

	/**
	 * A chip click loads the command into the prompt rather than running it, so
	 * the learner still presses Enter. It is engagement all the same — they
	 * reached into this playground and chose something — so it counts as an
	 * attempt here rather than waiting for the submit.
	 */
	function runSuggested(command: string) {
		markScenarioAttempted(scenario.id);
		input = command;
		inputEl?.focus();
	}

	/** Clicking terminal whitespace focuses the prompt — unless the user is
	 *  selecting output text to copy it. */
	function focusIfIdle() {
		if (window.getSelection()?.toString()) return;
		inputEl?.focus();
	}
</script>

{#snippet scenarioSelect()}
	{#if showScenarioPicker}
		<div class="pg-select-wrap">
			<select
				value={activeScenarioId}
				onchange={(e) => changeScenario(e.currentTarget.value)}
				class="pg-select"
				disabled={loading}
				aria-label="Scenario"
			>
				{#each playgroundScenarios as s (s.id)}
					<option value={s.id}>{$progress.scenarios[s.id] ? '✔ ' : ''}{s.title}</option>
				{/each}
			</select>
			<span class="pg-select-icon" aria-hidden="true">
				<ChevronDown size={12} />
			</span>
		</div>
	{/if}
{/snippet}

{#snippet commandLabel(command: string)}
	{#each tokenizeShellCommand(command) as token, ti (ti)}<span class="tok tok-{token.type}"
			>{token.text}</span
		>{/each}
{/snippet}

{#snippet terminalHistory()}
	{#each history as line, i (i)}
		{#if line.type === 'input'}
			<div class="pg-line mb-1.5" style="font-family: var(--font-mono); font-size: 12.5px;">
				{@render promptLabel(line.promptCwd ?? '~')}<span
					style="color: var(--color-terminal-command);"
					>&nbsp;{@render commandLabel(line.text)}</span
				>
			</div>
		{:else if line.type === 'output'}
			{#if line.colored}
				<!-- eslint-disable svelte/no-at-html-tags -- our formatters HTML-escape all command output before colorizing -->
				<pre
					class="mb-2.5 pl-5 text-[11.5px] leading-relaxed break-all whitespace-pre-wrap"
					style="font-family: var(--font-mono);">{@html line.text}</pre>
				<!-- eslint-enable svelte/no-at-html-tags -->
			{:else}
				<pre
					class="mb-2.5 pl-5 text-[11.5px] leading-relaxed break-all whitespace-pre-wrap"
					style="color: {line.error
						? 'var(--color-warning)'
						: 'var(--color-terminal-output)'}; font-family: var(--font-mono);">{line.text}</pre>
			{/if}
		{:else if line.type === 'agent'}
			<pre class="pg-agent-prose mb-1.5 whitespace-pre-wrap">{line.text}</pre>
		{:else if line.type === 'agent-cmd'}
			<div class="pg-agent-cmd mb-1.5" data-testid="agent-proposal">
				<span class="pg-agent-cmd-label">agent →</span>
				<span>{@render commandLabel(line.text)}</span>
			</div>
		{:else}
			<p
				class="mb-1.5 text-[11.5px] italic"
				style="color: var(--color-text-muted); font-family: var(--font-mono);"
			>
				# {line.text}
			</p>
		{/if}
	{/each}
	{#if loading}
		<p class="text-xs" style="color: var(--color-text-muted); font-family: var(--font-mono);">
			Initializing sandbox...
		</p>
	{/if}
{/snippet}

{#snippet statusBadge()}
	<span class="pg-status pg-status-{modelStatus.tone}">
		<span class="pg-status-dot"></span>{modelStatus.label}
	</span>
{/snippet}

{#snippet promptLabel(cwd: string)}
	<span class="pg-prompt" aria-hidden="true"
		><span class="pp-user">vibe@sandbox</span><span class="pp-sep">:</span><span class="pp-path"
			>{cwd}</span
		><span class="pp-dollar">$</span></span
	>
{/snippet}

{#snippet promptForm()}
	<!-- A real, visible input (native cursor, selection, editing, quotes) laid
	     out on a flex-wrap line: when the cwd makes the prompt long, the input
	     wraps onto its own full-width line instead of being squeezed. During a
	     CLI agent session the prompt swaps for the approval / working / edit
	     line. -->
	<form onsubmit={handleSubmit} class="pg-prompt-line">
		{#if cliActive && !cliEditing}
			{#if cliPhase === 'awaiting-approval'}
				<span class="pg-cli-ask" data-testid="agent-approval"
					>allow? <b>[y]</b> yes · <b>[e]</b> edit · <b>[n]</b> no</span
				>
			{:else}
				<span class="pg-cli-busy" data-testid="agent-working"
					>agent is working… Ctrl+C to interrupt</span
				>
			{/if}
		{:else if cliActive && cliEditing}
			<span class="pg-cli-edit" data-testid="agent-edit">edit ↵</span>
		{:else}
			{@render promptLabel(promptCwd)}
		{/if}
		<span class="pg-input-wrap">
			<!-- Empty-and-unfocused: a block caret sits right after the prompt
			     (a real terminal blinks before you click), with the one-time
			     hint. Both come BEFORE the input so they never get pushed to the
			     right edge by the input filling the line. -->
			{#if !inputFocused && !input}
				<span class="pg-caret terminal-caret" aria-hidden="true"></span>
			{/if}
			{#if !hasInteracted && !loading && !input}
				<span class="pg-type-hint" aria-hidden="true">
					<ArrowLeft size={10} />
					type here
				</span>
			{/if}
			<input
				bind:this={inputEl}
				bind:value={input}
				onkeydown={handleKeydown}
				onfocus={() => {
					inputFocused = true;
					hasInteracted = true;
				}}
				onblur={() => (inputFocused = false)}
				disabled={loading}
				placeholder={!cliActive && inputFocused ? 'ls' : ''}
				class="pg-input"
				autocomplete="off"
				spellcheck="false"
				enterkeyhint="send"
				aria-label="Shell command"
			/>
		</span>
	</form>
{/snippet}

{#snippet suggestedCommands()}
	<div class="flex flex-wrap gap-1.5">
		{#each scenario.suggestedCommands as command, i (i)}
			<button type="button" onclick={() => runSuggested(command)} class="pg-chip">
				{@render commandLabel(command)}
				<ChevronRight size={11} />
			</button>
		{/each}
		{#if agentChip}
			<button
				type="button"
				onclick={() => runSuggested(AGENT_TRY_TASK)}
				class="pg-chip pg-chip-agent"
				data-testid="agent-try-chip"
			>
				{@render commandLabel(AGENT_TRY_TASK)}
				<ChevronRight size={11} />
			</button>
		{/if}
	</div>
{/snippet}

{#if panel}
	<div class="pg-shell pg-container flex min-h-0 flex-1 flex-col overflow-hidden">
		<header
			class="flex min-w-0 shrink-0 flex-nowrap items-center gap-2 px-3 py-2 sm:gap-2.5 sm:px-5 sm:py-3"
			style="background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent); border-bottom: 1px solid var(--color-border);"
			data-fabric
		>
			<Terminal size={14} class="shrink-0" style="color: var(--color-important);" />
			<span class="shrink-0 text-sm font-semibold" style="color: var(--color-text);"
				>Playground</span
			>
			<!-- `shrink-0`: this never truncates. A clipped pill reading "sandboxed ba"
			     looks broken in a way an ellipsised dropdown does not, because a pill
			     is a fixed label rather than variable content. The select absorbs all
			     the shrinkage instead — it can ellipsise honestly, and its full text
			     is in the popup. -->
			<span class="hidden shrink-0 sm:inline">{@render statusBadge()}</span>

			<div class="ml-auto flex min-w-0 flex-nowrap items-center gap-1.5 sm:gap-2">
				{@render scenarioSelect()}
				<button
					type="button"
					onclick={resetScenario}
					disabled={loading}
					class="pg-icon-btn"
					aria-label="Reset scenario"
				>
					<RotateCcw size={13} />
				</button>
				{#if onClose}
					<button type="button" onclick={onClose} class="pg-icon-btn" aria-label="Close playground">
						<X size={14} />
					</button>
				{/if}
			</div>
		</header>

		<p
			class="shrink-0 px-3 py-2 text-[11px] leading-snug sm:px-5 sm:py-2.5 sm:text-xs sm:leading-relaxed"
			style="color: var(--color-text-secondary); border-bottom: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-bg-secondary) 45%, transparent);"
		>
			<RichHint text={scenario.hint} />
		</p>

		<div class="flex min-h-0 flex-1 flex-col overflow-hidden">
			<section class="shrink-0" style="border-bottom: 1px solid var(--color-border);">
				<button
					type="button"
					class="flex w-full cursor-pointer items-center gap-2 px-5 py-2"
					style="background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent);"
					onclick={() => (graphCollapsed = !graphCollapsed)}
					aria-expanded={!graphCollapsed}
					aria-label="Toggle file tree"
				>
					<FolderTree size={13} style="color: var(--color-important);" />
					<span class="text-xs font-medium" style="color: var(--color-text-secondary);">
						File Tree
					</span>
					<ChevronDown
						size={12}
						class="ml-auto transition-transform duration-150"
						style="color: var(--color-text-muted); transform: rotate({graphCollapsed
							? '-90deg'
							: '0deg'});"
					/>
				</button>
				{#if !graphCollapsed}
					<div
						class="pg-graph-body max-h-56 overflow-y-auto px-3 py-1"
						style="background: color-mix(in srgb, var(--color-bg-secondary) 45%, transparent);"
						use:autohideScroll
					>
						<FsTreeView {tree} />
					</div>
				{/if}
			</section>

			<section class="flex min-h-0 flex-1 flex-col overflow-hidden">
				<div
					class="flex items-center gap-2 px-5 py-2"
					style="background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent); border-bottom: 1px solid var(--color-border);"
				>
					<Terminal size={13} style="color: var(--color-text-muted);" />
					<span class="text-xs font-medium" style="color: var(--color-text-secondary);">
						Terminal
					</span>
				</div>

				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<div
					bind:this={terminalEl}
					use:autohideScroll
					class="pg-terminal min-h-0 flex-1 cursor-text overflow-y-auto px-4 py-3"
					onclick={focusIfIdle}
				>
					{@render terminalHistory()}
					{@render promptForm()}
				</div>
			</section>

			<section
				class="pg-suggestions shrink-0 px-4 py-2"
				style="border-top: 1px solid var(--color-border); background: color-mix(in srgb, var(--color-bg-tertiary) 55%, transparent);"
			>
				<p
					class="mb-1.5 text-[10px] font-semibold tracking-widest uppercase"
					style="color: var(--color-text-muted);"
				>
					{chipsLabel}
				</p>
				{@render suggestedCommands()}
			</section>
		</div>
	</div>
{:else}
	<div class="overflow-hidden rounded-xl" style="background: var(--color-bg-secondary);">
		{#if !hideHeader}
			<div
				class="flex flex-wrap items-center justify-between gap-3 px-5 py-3"
				style="background: var(--color-bg-tertiary); border-bottom: 1px solid var(--color-border);"
			>
				<div class="flex items-center gap-2">
					<Terminal size={16} style="color: var(--color-important);" />
					<span class="text-sm font-semibold" style="color: var(--color-text);">
						{embedded ? 'Try it yourself' : 'Terminal Playground'}
					</span>
					{@render statusBadge()}
				</div>
				<div class="flex flex-wrap items-center gap-2">
					{@render scenarioSelect()}
					<button
						type="button"
						onclick={resetScenario}
						disabled={loading}
						class="flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-xs font-medium transition-opacity hover:opacity-80 disabled:opacity-40"
						style="color: var(--color-text-muted); border: 1px solid var(--color-border);"
					>
						<RotateCcw size={13} />
						Reset
					</button>
				</div>
			</div>
		{/if}

		<div
			class="flex items-start gap-2 px-5 py-2.5 text-xs"
			style="background: color-mix(in srgb, {typeAccent} 5%, var(--color-bg-secondary)); border-bottom: 1px solid var(--color-border); color: var(--color-text-secondary);"
		>
			<TypeIcon size={14} class="mt-0.5 flex-shrink-0" style="color: {typeAccent};" />
			<span><span class="sr-only">{typeLabel}</span><RichHint text={scenario.hint} /></span>
		</div>

		<div
			class="grid grid-cols-1 {embedded ? 'lg:grid-cols-[minmax(0,1fr)_17rem]' : 'lg:grid-cols-2'}"
			style="min-height: {embedded ? '340px' : '420px'};"
		>
			<div
				class="order-2 flex flex-col border-t lg:order-1 lg:border-t-0 lg:border-r"
				style="border-top-color: var(--color-playground-border); border-right-color: var(--color-border);"
			>
				<div
					class="flex items-center gap-2 px-4 py-2"
					style="background: var(--color-playground-bg);"
				>
					<Terminal size={13} style="color: var(--color-important);" />
					<span class="text-xs font-medium" style="color: var(--color-text-secondary);"
						>Terminal</span
					>
				</div>

				<!-- svelte-ignore a11y_no_static_element_interactions, a11y_click_events_have_key_events -->
				<div
					bind:this={terminalEl}
					use:autohideScroll
					class="pg-terminal flex-1 cursor-text overflow-y-auto p-4"
					style="min-height: {embedded ? '220px' : '280px'}; max-height: {embedded
						? '300px'
						: '360px'};"
					onclick={focusIfIdle}
				>
					{@render terminalHistory()}
					{@render promptForm()}
				</div>
			</div>

			<div class="order-1 flex flex-col lg:order-2">
				<div class="flex items-center gap-2 px-4 py-2">
					<FolderTree size={13} style="color: var(--color-important);" />
					<span class="text-xs font-medium" style="color: var(--color-text-secondary);"
						>File Tree</span
					>
				</div>
				<div class="max-h-80 flex-1 overflow-y-auto px-3 py-1" use:autohideScroll>
					<FsTreeView {tree} />
				</div>
			</div>
		</div>

		<div class="px-5 py-3" style="border-top: 1px solid var(--color-border);">
			<p class="mb-2 text-xs font-medium" style="color: var(--color-text-muted);">
				{chipsLabel}
			</p>
			<div class="flex flex-wrap gap-2">
				{#each scenario.suggestedCommands as command, i (i)}
					<button
						type="button"
						onclick={() => runSuggested(command)}
						class="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-opacity hover:opacity-80"
						style="background: var(--color-surface); color: var(--color-text-secondary); border: 1px solid var(--color-border); font-family: var(--font-mono);"
					>
						{@render commandLabel(command)}
						<ChevronRight size={12} />
					</button>
				{/each}
				{#if agentChip}
					<button
						type="button"
						onclick={() => runSuggested(AGENT_TRY_TASK)}
						class="flex items-center gap-1 rounded-md px-2.5 py-1 text-xs transition-opacity hover:opacity-80"
						style="background: color-mix(in srgb, var(--color-btn-agent) 14%, var(--color-surface)); color: var(--color-btn-agent); border: 1px solid color-mix(in srgb, var(--color-btn-agent) 40%, transparent); font-family: var(--font-mono);"
						data-testid="agent-try-chip"
					>
						{@render commandLabel(AGENT_TRY_TASK)}
						<ChevronRight size={12} />
					</button>
				{/if}
			</div>
		</div>
	</div>
{/if}

<style>
	.pg-shell {
		background: var(--color-bg-secondary);
	}

	/* The header status chip: reflects the AI agent's live lifecycle so the
	   playground shows what the Agent panel already makes clear. */
	.pg-status {
		display: inline-flex;
		align-items: center;
		gap: 0.45ch;
		border-radius: 9999px;
		padding: 0.175rem 0.55rem;
		font-size: 10px;
		font-weight: 600;
		white-space: nowrap;
	}

	.pg-status-dot {
		width: 6px;
		height: 6px;
		border-radius: 9999px;
		background: currentColor;
	}

	.pg-status-idle {
		color: var(--color-important);
		background: color-mix(in srgb, var(--color-important) 12%, var(--color-bg-tertiary));
	}

	.pg-status-active {
		color: var(--color-btn-agent);
		background: color-mix(in srgb, var(--color-btn-agent) 15%, var(--color-bg-tertiary));
	}

	.pg-status-warm {
		color: var(--color-warning);
		background: color-mix(in srgb, var(--color-warning) 14%, var(--color-bg-tertiary));
	}

	/* A gentle pulse while the model is downloading or warming. */
	.pg-status-warm .pg-status-dot {
		animation: pg-status-pulse 1.4s ease-in-out infinite;
	}

	@keyframes pg-status-pulse {
		0%,
		100% {
			opacity: 1;
		}
		50% {
			opacity: 0.3;
		}
	}

	/* `min-width: 0` is the whole fix. A <select> sizes itself to its WIDEST
	   option — "Say hello to the machine" and friends — and as a flex item its
	   auto min-width refuses to go below that, so the header had no choice but
	   to wrap. Allowing it to shrink, and ellipsising the label inside, keeps the
	   row on one line at every panel width. The full title is still in the popup,
	   which is where you read it. */
	/* The panel's width is set by its own layout, not the viewport, so a media
	   query is the wrong instrument — at 800px of viewport this panel is 336px,
	   and `sm:` had long since decided the pill should show. A container query
	   asks the question that actually matters. */
	.pg-container {
		container-type: inline-size;
	}

	@container (max-width: 30rem) {
		.pg-status {
			display: none;
		}
	}

	.pg-select-wrap {
		position: relative;
		display: inline-flex;
		align-items: center;
		min-width: 0;
		flex: 0 1 auto;
	}

	.pg-select {
		appearance: none;
		-webkit-appearance: none;
		cursor: pointer;
		/* A floor, not zero. Shrinking to fit was collapsing this to ~42px — a
		   chevron with no label, which is worse than no picker at all. Below this
		   the STATUS PILL yields instead (see the container query), because a
		   label the prompt already repeats is cheaper to lose than the only
		   control for switching scenario. */
		min-width: 8.5rem;
		max-width: 100%;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: 0.4rem 1.75rem 0.4rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 11px;
		line-height: 1.3;
		color: var(--color-text);
		transition:
			border-color 0.15s ease,
			background 0.15s ease,
			box-shadow 0.15s ease;
	}

	.pg-select:hover:not(:disabled) {
		border-color: var(--color-important);
	}

	.pg-select:focus {
		outline: none;
		border-color: var(--color-important);
		box-shadow: 0 0 0 2px color-mix(in srgb, var(--color-important) 18%, transparent);
	}

	.pg-select:disabled {
		opacity: 0.45;
		cursor: not-allowed;
	}

	.pg-select-icon {
		position: absolute;
		right: 0.5rem;
		display: inline-flex;
		pointer-events: none;
		color: var(--color-text-muted);
		opacity: 0.7;
	}

	.pg-icon-btn {
		display: inline-flex;
		height: 1.875rem;
		width: 1.875rem;
		cursor: pointer;
		align-items: center;
		justify-content: center;
		border-radius: 0.5rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		color: var(--color-text-secondary);
		transition:
			border-color 0.15s ease,
			color 0.15s ease,
			opacity 0.15s ease;
	}

	.pg-icon-btn:hover:not(:disabled) {
		border-color: var(--color-important);
		color: var(--color-important);
	}

	.pg-icon-btn:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	/* The terminal follows the theme: a pale sage surface in light mode
	   (matching CodeBlock) and a crisp near-black forest in dark mode. All
	   text and token colors resolve through the theme's terminal variables. */
	.pg-terminal {
		background-color: var(--color-terminal-bg);
		color: var(--color-terminal-text);
	}

	/* The prompt is part of the terminal itself, exactly like a real shell:
	   the last line of the scrollback is where you type. It's a normal
	   flowing block (pre-wrap + break-all) so long commands wrap instead of
	   scrolling off — the real <input> is hidden inside it. */
	/* Match the live prompt to a submitted command (history is 12.5px) so
	   typing and pressing Enter never changes the text size. The app's
	   viewport is maximum-scale=1, so a sub-16px input never triggers the
	   iOS focus-zoom — no oversized-input workaround needed. */
	.pg-prompt-line {
		display: flex;
		flex-wrap: wrap;
		align-items: baseline;
		column-gap: 0.6ch;
		row-gap: 0.15rem;
		font-family: var(--font-mono);
		font-size: 12.5px;
		line-height: 1.4;
		padding: 0;
		background: transparent;
	}

	/* Prompt allowed to wrap on a very deep path rather than overflow. */
	.pg-prompt {
		word-break: break-all;
	}

	/* The input takes the rest of the line; when the prompt is long it wraps
	   onto its own full-width row (flex-wrap on the parent). */
	.pg-input-wrap {
		display: inline-flex;
		flex: 1 1 12ch;
		align-items: baseline;
		min-width: 12ch;
	}

	/* Echoed prompt+command history lines wrap the same way. */
	.pg-line {
		white-space: pre-wrap;
		word-break: break-all;
	}

	/* Block cursor shown only before first focus (an empty, unfocused prompt
	   still blinks, like a real terminal). Once focused, the input's native
	   caret takes over. Size, phosphor color, and blink come from the shared
	   .terminal-caret class in layout.css. */
	.pg-caret {
		display: inline-block;
		vertical-align: text-bottom;
	}

	/* One-time, whisper-quiet nudge toward the prompt. Gone after first focus. */
	.pg-type-hint {
		margin-left: 0.75ch;
		vertical-align: middle;
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-family: var(--font-mono);
		font-size: 10px;
		font-style: italic;
		color: var(--color-text-muted);
		opacity: 0.55;
		animation: pg-beckon 1.6s ease-in-out infinite alternate;
		pointer-events: none;
		user-select: none;
		white-space: nowrap;
	}

	@keyframes pg-beckon {
		from {
			transform: translateX(0);
		}
		to {
			transform: translateX(4px);
		}
	}

	.pg-prompt {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 12.5px;
		font-weight: 600;
		user-select: none;
	}

	.pp-user,
	.pp-dollar {
		color: var(--color-terminal-prompt);
	}

	.pp-sep {
		color: var(--color-terminal-output);
		font-weight: 400;
	}

	.pp-path {
		color: var(--color-vibe-text);
		/* Deep paths would squeeze the input off the line */
		max-width: 11rem;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
		display: inline-block;
		vertical-align: bottom;
	}

	.pp-dollar {
		margin-left: 0.15rem;
	}

	/* A real, visible input: native caret, selection, and editing. Transparent
	   background and inherited mono font make it read as part of the terminal
	   line; the phosphor caret-color matches the prompt. */
	.pg-input {
		flex: 1 1 auto;
		min-width: 6ch;
		padding: 0;
		border: none;
		outline: none;
		box-shadow: none;
		background: transparent;
		appearance: none;
		-webkit-appearance: none;
		color: var(--color-terminal-command);
		caret-color: var(--color-terminal-prompt);
		font-family: var(--font-mono);
		font-size: inherit;
		line-height: inherit;
	}

	.pg-input::placeholder {
		color: color-mix(in srgb, var(--color-terminal-output) 55%, transparent);
	}

	.pg-chip {
		display: inline-flex;
		align-items: center;
		gap: 0.25rem;
		border-radius: 9999px;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		padding: 0.3rem 0.75rem;
		font-family: var(--font-mono);
		font-size: 11px;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			border-color 0.15s ease,
			color 0.15s ease,
			background 0.15s ease;
	}

	/* The agent chip wears the accent gold — it IS the special one. */
	.pg-chip-agent {
		border-color: color-mix(in srgb, var(--color-important) 45%, transparent);
		background: color-mix(in srgb, var(--color-important) 8%, var(--color-surface));
	}

	/* ── CLI agent session (`agent "<task>"`) ─────────────────────────── */

	/* The agent's thinking-out-loud: dim, unmistakably not command output. */
	.pg-agent-prose {
		font-family: var(--font-mono);
		font-size: 11.5px;
		line-height: 1.6;
		font-style: italic;
		color: var(--color-text-muted);
		overflow-wrap: anywhere;
	}

	.pg-agent-cmd {
		display: flex;
		align-items: baseline;
		gap: 0.6ch;
		font-family: var(--font-mono);
		font-size: 12.5px;
		padding: 0.25rem 0.5rem;
		border-radius: 0.375rem;
		border: 1px solid color-mix(in srgb, var(--color-important) 35%, transparent);
		background: color-mix(in srgb, var(--color-important) 6%, transparent);
		overflow-x: auto;
		white-space: pre;
	}

	.pg-agent-cmd-label {
		flex-shrink: 0;
		font-size: 10px;
		font-weight: 700;
		letter-spacing: 0.04em;
		color: var(--color-important);
		user-select: none;
	}

	/* The approval prompt replaces the shell prompt — same line, same rhythm. */
	.pg-cli-ask,
	.pg-cli-edit {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 12.5px;
		font-weight: 600;
		color: var(--color-important);
		user-select: none;
	}

	.pg-cli-ask b {
		font-weight: 800;
	}

	.pg-cli-busy {
		flex-shrink: 0;
		font-family: var(--font-mono);
		font-size: 11.5px;
		font-style: italic;
		color: var(--color-text-muted);
		user-select: none;
	}

	.pg-chip:hover {
		border-color: var(--color-important);
		color: var(--color-important);
		background: color-mix(in srgb, var(--color-important) 8%, var(--color-surface));
	}

	@media (max-width: 639px) {
		.pg-graph-body {
			padding-top: 0.5rem;
			padding-bottom: 0.5rem;
		}

		.pg-suggestions {
			padding: 0.375rem 0.75rem;
		}

		.pg-suggestions .pg-chip {
			font-size: 10px;
			padding: 0.2rem 0.5rem;
		}

		.pg-chip {
			font-size: 10px;
			padding: 0.2rem 0.5rem;
		}
	}
</style>
