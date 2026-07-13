<script lang="ts">
	import { Cog, Gamepad2, ScrollText, HelpCircle, History, Laptop, Terminal } from 'lucide-svelte';
	import { base } from '$app/paths';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import Callout from '../ui/Callout.svelte';

	let {
		onOpenPlayground
	}: {
		onOpenPlayground?: () => void;
	} = $props();

	let activeTab = $state<'mac' | 'windows' | 'linux'>('mac');

	const stats = ['8 parts', '15 playgrounds', '100% free', 'No signup'];

	const shellTimeline = [
		{
			year: '1969',
			text: 'At Bell Labs, Ken Thompson and Dennis Ritchie start building Unix on a spare PDP-7 — and with it, the idea of typing commands at a shell.'
		},
		{
			year: '1971',
			text: 'The first Unix shell ships: Thompson’s "sh". Pipes arrive two years later, and small tools start composing into big ones.'
		},
		{
			year: '1979',
			text: 'Stephen Bourne’s shell becomes the Unix standard. Its syntax — the one you’ll learn here — is still what shells speak today.'
		},
		{
			year: '1989',
			text: 'Brian Fox releases bash, the "Bourne Again SHell", as free software for the GNU project. Linux adopts it, and it spreads everywhere.'
		},
		{
			year: '2019',
			text: 'macOS Catalina switches the default shell to zsh — a bash-compatible cousin. For everything in this course, they behave the same.'
		},
		{
			year: 'Today',
			text: 'Every server, CI pipeline, Docker container, and AI coding agent speaks bash. "Bash-compatible" is the lingua franca of computing.'
		}
	];
</script>

<section id="hero" class="px-6 py-16">
	<h1 class="sr-only">TerminalVibes — The Terminal for Vibe Coders</h1>

	<!-- Hero image -->
	<div class="mx-auto mb-12 max-w-4xl">
		<ExpandableImage
			src="{base}/images/Hero.webp"
			alt="TerminalVibes — The Terminal for Vibe Coders"
			class="w-full rounded-xl shadow-2xl"
			loading="eager"
		/>
	</div>

	<!-- Welcome + quick links -->
	<div class="mx-auto mb-16 max-w-4xl">
		<p class="mb-5 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
			<strong style="color: var(--color-text);">Welcome!</strong> Your AI assistant keeps proposing
			shell commands — this guide teaches you to read, verify, and run them with confidence. From
			your very first
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">echo</code
			> to auditing an agent's script, every concept is explained visually, then practiced hands-on. Two
			companions will follow you through all eight parts:
		</p>

		<div class="mb-5 flex flex-wrap gap-2">
			{#each stats as stat (stat)}
				<span
					class="rounded-full px-3.5 py-1.5 text-[12px] font-semibold"
					style="background: var(--color-surface); color: var(--color-primary-text); border: 1px solid var(--color-border);"
				>
					{stat}
				</span>
			{/each}
		</div>

		<div class="space-y-3">
			<div
				class="flex items-start gap-3 rounded-lg px-5 py-4 text-left"
				style="background: var(--color-important-bg);"
			>
				<Gamepad2 size={18} class="mt-0.5 flex-shrink-0" style="color: var(--color-important);" />
				<p class="text-[13px] leading-relaxed" style="color: var(--color-text-secondary);">
					<strong style="color: var(--color-text);">Try it now:</strong> Open the
					<button
						type="button"
						onclick={onOpenPlayground}
						class="cursor-pointer font-medium underline underline-offset-2"
						style="color: var(--color-important);">Terminal Playground</button
					>
					— a simulated bash sandbox that runs entirely in your browser. Type anything; nothing here can
					touch your real files. No install required.
				</p>
			</div>

			<div
				class="flex items-start gap-3 rounded-lg px-5 py-4 text-left"
				style="background: var(--color-surface);"
			>
				<ScrollText size={18} class="mt-0.5 flex-shrink-0" style="color: var(--color-primary);" />
				<p class="text-[13px] leading-relaxed" style="color: var(--color-text-secondary);">
					<strong style="color: var(--color-text);">Quick reference:</strong> Need a command fast?
					Hit
					<kbd
						class="mx-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium"
						style="background: var(--color-bg-tertiary); color: var(--color-text);">⌘K</kbd
					>
					/
					<kbd
						class="mx-0.5 rounded px-1.5 py-0.5 text-[11px] font-medium"
						style="background: var(--color-bg-tertiary); color: var(--color-text);">Ctrl+K</kbd
					>
					to search, or open the
					<strong style="color: var(--color-text);">Terminal Cheat Sheet</strong>
					from the header for a complete command reference.
				</p>
			</div>
		</div>
	</div>

	<!-- What is the Terminal? -->
	<div id="section-intro-what" class="mx-auto mb-16 max-w-4xl">
		<div class="mb-6 flex items-center gap-2.5">
			<HelpCircle size={20} style="color: var(--color-primary);" strokeWidth={2.5} />
			<h2 class="text-xl font-bold" style="color: var(--color-text);">What Is the Terminal?</h2>
		</div>

		<div class="my-6">
			<ExpandableImage
				src="{base}/images/what-is-terminal.webp"
				alt="What Is the Terminal? — a text conversation with your computer"
				caption="No buttons, no menus — you type a command, the machine answers, and everything is possible"
			/>
		</div>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			The terminal is a <strong style="color: var(--color-text);"
				>text conversation with your computer</strong
			>. Instead of clicking icons, you type a command, press Enter, and the machine answers in
			text. That's the whole interaction model — and it hasn't fundamentally changed in fifty years,
			because it doesn't need to.
		</p>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Three words get used almost interchangeably, but they name different layers:
		</p>

		<div class="mb-4 grid gap-3 sm:grid-cols-3">
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">Terminal</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					The <em>window</em> — an app that draws text on screen and sends your keystrokes onward. Terminal.app,
					iTerm2, and Windows Terminal are all terminals.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">Shell</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					The <em>program inside</em> the window that reads your command, runs it, and prints the
					result. <strong>bash</strong> and <strong>zsh</strong> are shells — the language this course
					teaches.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">Console</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					An older word from the days when the "terminal" was a physical desk of keyboard and
					screen. Today it's mostly a synonym for terminal.
				</p>
			</div>
		</div>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			If you build with AI assistants, the terminal is <em>more</em> relevant to you, not less.
			Every major AI lab now ships a
			<strong style="color: var(--color-text);">terminal-native coding agent</strong> — Anthropic's Claude
			Code, OpenAI's Codex CLI, Google's CLI agents, Block's Goose, Sourcegraph's Amp. The command line
			is the execution layer where those agents actually work: install this package, run these tests,
			move those files. The agents speak fluent bash. With the terminal, you can:
		</p>

		<ul
			class="mb-4 space-y-2 pl-5 text-[14px] leading-relaxed"
			style="color: var(--color-text-secondary);"
		>
			<li class="list-disc">
				<strong style="color: var(--color-text);">Read</strong> every command an AI proposes before it
				runs — instead of approving blind
			</li>
			<li class="list-disc">
				<strong style="color: var(--color-text);">Verify</strong> what actually happened afterwards, with
				your own eyes
			</li>
			<li class="list-disc">
				<strong style="color: var(--color-text);">Compose</strong> small tools into pipelines that do
				exactly what you want
			</li>
			<li class="list-disc">
				<strong style="color: var(--color-text);">Automate</strong> anything you do twice — a saved command
				is a script
			</li>
		</ul>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			This isn't a niche skill anymore — it's literally measured. <a
				href="https://www.tbench.ai/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium underline underline-offset-2"
				style="color: var(--color-primary);">Terminal-Bench</a
			>, a Stanford × Laude Institute benchmark now at v2.1, exists to score how well AI agents do
			real work in a terminal. And
			<a
				href="https://survey.stackoverflow.co/2025/ai/"
				target="_blank"
				rel="noopener noreferrer"
				class="font-medium underline underline-offset-2"
				style="color: var(--color-primary);">Stack Overflow's 2025 survey</a
			>
			found that 84% of developers use or plan to use AI tools — but only 29% trust their output. The
			gap between those two numbers is exactly why you need to be able to <em>read</em> what the agent
			runs.
		</p>

		<p class="text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			A 50-year-old interface turns out to be the AI-native one: text in, text out is exactly how
			language models think. Learning to read that text is the difference between supervising your
			agents and hoping for the best. But where did this interface come from? The story is worth two
			minutes of your time.
		</p>
	</div>

	<!-- A Brief History -->
	<div id="section-intro-history" class="mx-auto mb-16 max-w-4xl">
		<div class="mb-6 flex items-center gap-2.5">
			<History size={20} style="color: var(--color-primary);" strokeWidth={2.5} />
			<h2 class="text-xl font-bold" style="color: var(--color-text);">A Brief History</h2>
		</div>

		<div class="my-6">
			<ExpandableImage
				src="{base}/images/terminal-history.webp"
				alt="A Brief History — from teletypes at Bell Labs to a shell in every machine"
				caption="From a spare PDP-7 in 1969 to every server, laptop, and AI agent on Earth"
			/>
		</div>

		<div class="mb-6 flex flex-col gap-6 sm:flex-row sm:items-start">
			<div class="min-w-0 flex-1">
				<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
					In 1969 at <strong style="color: var(--color-text);">Bell Labs</strong>, a giant
					operating-system project called Multics had just been cancelled. Two researchers —
					<strong style="color: var(--color-text);">Ken Thompson</strong> and
					<strong style="color: var(--color-text);">Dennis Ritchie</strong> — salvaged the good
					ideas and rebuilt them small on a spare PDP-7 minicomputer. They called it
					<strong style="color: var(--color-text);">Unix</strong>, partly as a joke on Multics.
				</p>
				<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
					Unix came with a radical idea: the operating system shouldn't decide what you can do.
					Instead it gives you dozens of small, sharp tools — each doing one thing well — and a <strong
						style="color: var(--color-text);">shell</strong
					> to combine them. Type a sentence, press Enter, and the machine obeys. That design won so completely
					that macOS, Linux, and Android are all Unix descendants.
				</p>
				<p class="text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
					The shell itself kept evolving: Thompson's original, then <strong
						style="color: var(--color-text);">Stephen Bourne's</strong
					>
					1979 shell whose syntax became the standard, then
					<strong style="color: var(--color-text);">bash</strong> in 1989 — a free rewrite that
					conquered the world on the back of Linux. Your Mac's default
					<strong style="color: var(--color-text);">zsh</strong> is a bash-compatible cousin; everything
					in this course works the same in both.
				</p>
			</div>
			<div class="mx-auto w-72 flex-shrink-0 sm:mx-0 sm:w-80">
				<ExpandableImage
					src="{base}/images/thompson-ritchie.webp"
					alt="Ken Thompson and Dennis Ritchie at a PDP-11 running Unix at Bell Labs"
					caption="Ken Thompson (seated) and Dennis Ritchie at Bell Labs, creators of Unix — an illustrated homage"
					width={1122}
					height={1402}
				/>
			</div>
		</div>

		<div class="mb-5 rounded-lg p-5" style="background: var(--color-bg-secondary);">
			{#each shellTimeline as entry (entry.year)}
				<div class="flex gap-4 py-2">
					<span
						class="w-12 flex-shrink-0 text-right text-[12px] font-semibold"
						style="color: var(--color-primary-text); font-family: var(--font-mono);"
					>
						{entry.year}
					</span>
					<span
						class="border-l pl-4 text-[13px] leading-relaxed"
						style="border-color: var(--color-border); color: var(--color-text-secondary);"
					>
						{entry.text}
					</span>
				</div>
			{/each}
		</div>

		<Callout type="note" title="Why 'bash'?">
			It stands for <em>Bourne Again SHell</em> — a triple pun. It's a free-software rebirth of Stephen
			Bourne's classic shell, written by Brian Fox for the GNU project in 1989. Programmers have never
			been able to resist a good name: Unix itself started as a joke on Multics.
		</Callout>

		<p class="text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Why does this history matter to you? Because a design from 1969 — small tools, plain text,
			composable commands — is <em>exactly</em> the interface AI agents use to act on your machine. The
			terminal isn't legacy technology you're forced to learn; it's the control panel that was already
			waiting for the AI era.
		</p>
	</div>

	<!-- Your Machine's Terminal -->
	<div id="section-intro-shells" class="mx-auto mb-16 max-w-4xl">
		<div class="mb-6 flex items-center gap-2.5">
			<Laptop size={20} style="color: var(--color-primary);" strokeWidth={2.5} />
			<h2 class="text-xl font-bold" style="color: var(--color-text);">Your Machine's Terminal</h2>
		</div>

		<div class="mb-6">
			<ExpandableImage
				src="{base}/images/your-machines-terminal.webp"
				alt="Your Machine's Terminal — every operating system ships one"
				caption="Whatever machine you're on, a bash-compatible shell is minutes away"
			/>
		</div>

		<p class="mb-5 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			You already own everything you need — every operating system ships a terminal. Pick yours:
		</p>

		<!-- OS Tabs -->
		<div class="mb-1 flex gap-1 rounded-lg p-1" style="background: var(--color-bg-tertiary);">
			<button
				onclick={() => (activeTab = 'mac')}
				class="flex-1 cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
				style="color: {activeTab === 'mac'
					? 'var(--color-text)'
					: 'var(--color-text-muted)'}; background: {activeTab === 'mac'
					? 'var(--color-surface)'
					: 'transparent'};"
			>
				macOS
			</button>
			<button
				onclick={() => (activeTab = 'windows')}
				class="flex-1 cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
				style="color: {activeTab === 'windows'
					? 'var(--color-text)'
					: 'var(--color-text-muted)'}; background: {activeTab === 'windows'
					? 'var(--color-surface)'
					: 'transparent'};"
			>
				Windows
			</button>
			<button
				onclick={() => (activeTab = 'linux')}
				class="flex-1 cursor-pointer rounded-md px-4 py-2 text-[13px] font-medium transition-colors"
				style="color: {activeTab === 'linux'
					? 'var(--color-text)'
					: 'var(--color-text-muted)'}; background: {activeTab === 'linux'
					? 'var(--color-surface)'
					: 'transparent'};"
			>
				Linux
			</button>
		</div>

		<!-- Tab content -->
		<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
			{#if activeTab === 'mac'}
				<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
					You're in the best position: macOS <em>is</em> Unix. The built-in
					<strong style="color: var(--color-text);">Terminal.app</strong> (in
					Applications&nbsp;→&nbsp;Utilities) is all you need — and it's better than its reputation:
					macOS 26 "Tahoe" (2025) gave it its first real modernization in about 24 years, with
					24-bit true color, Powerline font support, and new themes. There's nothing to install on
					day one. Many developers later upgrade to
					<strong style="color: var(--color-text);">iTerm2</strong> for extra comfort — same shell inside,
					nicer window around it.
				</p>
				<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
					Since macOS Catalina (2019) the default shell is <strong style="color: var(--color-text);"
						>zsh</strong
					>. For this entire course, zsh and bash behave identically — every command works in both.
					You can check what you're running:
				</p>
				<CodeBlock
					code={`echo $SHELL
# /bin/zsh`}
					title="Which shell am I in?"
				/>
			{:else if activeTab === 'windows'}
				<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
					Windows needs one extra step, because its native shells don't speak bash. The recommended
					path is <strong style="color: var(--color-text);">WSL</strong> (Windows Subsystem for
					Linux) — a real Ubuntu running inside Windows, and open source since May 2025. Open
					<strong style="color: var(--color-text);">PowerShell as Administrator</strong>, run one
					command (it installs Ubuntu by default), and restart:
				</p>
				<CodeBlock code="wsl --install" title="Install WSL (one time)" />
				<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
					A lighter alternative is <strong style="color: var(--color-text);">Git Bash</strong>,
					which comes free with
					<a
						href="https://git-scm.com/download/win"
						target="_blank"
						rel="noopener noreferrer"
						class="font-medium underline underline-offset-2"
						style="color: var(--color-primary);">Git for Windows</a
					> — a bash shell without the full Linux system. Great for this course, and it earns its keep
					in the AI era too: coding agents like Claude Code use Git Bash as their bash on native Windows,
					so if you skip WSL, installing Git for Windows is the prerequisite instead.
				</p>
				<p class="text-[14px]" style="color: var(--color-text-secondary);">
					The window around it is already sorted: <strong style="color: var(--color-text);"
						>Windows Terminal</strong
					> has been the default console since Windows 11 22H2 (2022) — opening PowerShell or WSL lands
					in it automatically, with tabs, panes, and profiles for every shell on your machine. Nothing
					to install.
				</p>
			{:else}
				<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
					You're home — Linux and the terminal grew up together. Press <kbd
						class="rounded border px-1 py-0.5 text-[11px]"
						style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
						>Ctrl+Alt+T</kbd
					>
					on most desktops (GNOME Terminal, Konsole, and friends), and
					<strong style="color: var(--color-text);">bash</strong> is almost certainly your default shell
					already.
				</p>
				<CodeBlock
					code={`echo $SHELL
# /bin/bash`}
					title="Confirm your shell"
				/>
				<p class="text-[14px]" style="color: var(--color-text-secondary);">
					Everything in this course runs unmodified on your machine.
				</p>
			{/if}
		</div>

		<Callout type="warning" title="PowerShell is a different language">
			Windows also ships <strong>PowerShell</strong> and the old <strong>cmd</strong>. They are real
			shells — but they speak a <em>different language</em> (<code
				class="rounded px-1 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">dir</code
			>
			instead of
			<code
				class="rounded px-1 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
			>,
			<code
				class="rounded px-1 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">Remove-Item</code
			>
			instead of
			<code
				class="rounded px-1 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
			>). This course teaches <strong>bash</strong>, the language of macOS, Linux, servers, and AI
			agents. On Windows, always make sure you're in a WSL or Git Bash window before following
			along.
		</Callout>

		<p class="mt-4 text-[14px]" style="color: var(--color-text-secondary);">
			And for now, you don't even need that: the <button
				type="button"
				onclick={onOpenPlayground}
				class="cursor-pointer font-medium underline underline-offset-2"
				style="color: var(--color-important);">Terminal Playground</button
			> built into this site is a simulated bash sandbox that runs in your browser — identical commands,
			zero risk.
		</p>
	</div>

	<!-- Anatomy of a Prompt -->
	<div id="section-intro-anatomy" class="mx-auto mb-16 max-w-4xl">
		<div class="mb-6 flex items-center gap-2.5">
			<Terminal size={20} style="color: var(--color-primary);" strokeWidth={2.5} />
			<h2 class="text-xl font-bold" style="color: var(--color-text);">Anatomy of a Prompt</h2>
		</div>

		<div class="my-6">
			<ExpandableImage
				src="{base}/images/prompt-anatomy.webp"
				alt="Anatomy of a Prompt — who you are, where you are, and whose turn it is"
				caption="The prompt answers three questions before you type a single letter: who, where, and whose turn"
			/>
		</div>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Open a terminal and you're greeted by a line of cryptic text ending in a blinking cursor. That
			line is the <strong style="color: var(--color-text);">prompt</strong> — the shell saying "your turn."
			It looks intimidating, but it's just three answers packed into one line:
		</p>

		<div
			class="mb-4 overflow-x-auto rounded-lg p-5"
			style="background: var(--color-terminal-bg); border: 1px solid var(--color-terminal-border);"
		>
			<p class="text-[15px] whitespace-nowrap" style="font-family: var(--font-mono);">
				<span style="color: var(--color-terminal-prompt);">vibe</span><span
					style="color: var(--color-terminal-output);">@</span
				><span style="color: var(--color-terminal-prompt);">sandbox</span><span
					style="color: var(--color-terminal-output);">:</span
				><span style="color: var(--color-primary-text);">~/projects</span><span
					style="color: var(--color-terminal-command);">$</span
				>
				<span
					class="inline-block h-[1.1em] w-[0.55em] translate-y-[0.2em] animate-pulse"
					style="background: var(--color-terminal-text);"
				></span>
			</p>
		</div>

		<div class="mb-4 grid gap-3 sm:grid-cols-2">
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p
					class="mb-1.5 text-[13px] font-semibold"
					style="color: var(--color-text); font-family: var(--font-mono);"
				>
					vibe@sandbox
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					<strong>Who and where:</strong> you're logged in as user <em>vibe</em> on a machine named
					<em>sandbox</em>. Mostly ignorable — until you're SSH'd into a server and it saves you
					from typing a command on the wrong machine.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p
					class="mb-1.5 text-[13px] font-semibold"
					style="color: var(--color-text); font-family: var(--font-mono);"
				>
					~/projects
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					<strong>Your current directory</strong> — where commands will act. The
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">~</code
					> is shorthand for your home folder. Part 2 is all about moving this around.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p
					class="mb-1.5 text-[13px] font-semibold"
					style="color: var(--color-text); font-family: var(--font-mono);"
				>
					$
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					<strong>"Your turn":</strong> the shell is ready for a command. A
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">$</code
					>
					means you're a normal user; a
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">#</code
					> means you're root — the all-powerful admin. Docs use a leading $ to mean "type this"; don't
					copy the $ itself.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">
					The blinking cursor
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					<strong>Where your typing goes.</strong> Nothing runs until you press
					<strong>Enter</strong> — you can type, stare, and edit as long as you like. Press the
					<strong>up arrow</strong> to recall previous commands instead of retyping them.
				</p>
			</div>
		</div>

		<p class="mb-5 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Every interaction with the shell follows the same loop — you'll run it thousands of times, and
			your AI agents run exactly the same one:
		</p>

		<MermaidDiagram
			definition={`flowchart LR
  A(["Prompt appears"]) -->|"you type"| B(["Command"])
  B -->|"Enter"| C(["Shell runs it"])
  C -->|"prints"| D(["Output"])
  D --> A`}
			id="prompt-loop"
		/>
		<p class="mt-2 px-1 text-xs" style="color: var(--color-text-muted);">
			Prompt, command, Enter, output, new prompt. Master this loop and the rest of the course is
			just vocabulary.
		</p>

		<Callout type="tip">
			Prompts vary from machine to machine — yours might show a different name, extra colors, or
			even a git branch. The parts are always the same: <em>who@where:directory$</em>. In Part 7
			you'll learn to customize it yourself.
		</Callout>
	</div>

	<!-- Under the Hood -->
	<div id="section-intro-under-the-hood" class="mx-auto max-w-4xl">
		<div class="mb-6 flex items-center gap-2.5">
			<Cog size={20} style="color: var(--color-primary);" strokeWidth={2.5} />
			<h2 class="text-xl font-bold" style="color: var(--color-text);">Under the Hood</h2>
		</div>

		<div class="my-6">
			<ExpandableImage
				src="{base}/images/under-the-hood.webp"
				alt="Under the Hood — how the terminal actually works"
				caption="Keyboard to PTY to shell to kernel and back — the machinery behind every prompt"
			/>
		</div>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Everything you need to start typing is behind you — Part 1 is one scroll away, and nothing
			there depends on this section. But if you've ever wondered why it's called a
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">tty</code
			>, why arrow keys sometimes print
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">^[[A</code
			>
			instead of moving, or what Ctrl+C <em>actually</em> does, stay a while. This is deliberately the
			most technical section of the course — and it repays the effort with a working mental model of the
			machine you're about to drive.
		</p>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			In the beginning, the terminal was furniture. A <strong style="color: var(--color-text);"
				>teletypewriter</strong
			>
			— a keyboard fused to a printer — sat at the end of a serial cable, and the computer at the other
			end typed its replies onto rolling paper. Unix, born in that world, abbreviated the device to
			<strong style="color: var(--color-text);">tty</strong>, and the abbreviation outlived the
			hardware by half a century. The paper is gone, the cables are gone, but every terminal window
			on your machine still checks in with the kernel as a tty device — ask it yourself:
		</p>

		<CodeBlock
			code={`tty
# /dev/ttys004        (macOS)
# /dev/pts/0          (Linux)`}
			title="Your window's device name"
		/>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			No real teletype has been wired to a computer in decades — so today, software impersonates
			one. Three players stand in for that vanished machine:
		</p>

		<div class="mb-4 grid gap-3 sm:grid-cols-3">
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">
					Terminal emulator
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					The app you actually open — Terminal.app, iTerm2, Windows Terminal. It draws a grid of
					character cells, turns your keystrokes into bytes, and paints the bytes that come back. It
					<em>emulates</em> the old hardware — hence the name.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">
					The PTY pair
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					A <strong>pseudo-terminal</strong>: two connected endpoints the kernel provides on
					request. The emulator holds the <em>master</em> end; whatever runs inside the window is
					attached to the <em>slave</em> end (newer docs say <em>primary/secondary</em>). It's a
					pipe wearing a teletype costume.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">The shell</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					Just a process. bash reads bytes from the slave end and writes bytes back — it can't tell
					whether a human, a 1970s teletype, or an AI agent sits on the other side. That
					indifference is why the same shell works everywhere.
				</p>
			</div>
		</div>

		<MermaidDiagram
			definition={`flowchart LR
  A(["Terminal emulator"]) <-->|"bytes"| B(["PTY master"])
  B <-->|"line discipline"| C(["PTY slave"])
  C <-->|"read / write"| D(["Shell"])
  D -->|"fork + exec"| E(["Your command"])
  E -->|"output"| C`}
			id="under-the-hood-chain"
		/>
		<p class="mt-2 mb-6 px-1 text-xs" style="color: var(--color-text-muted);">
			Keystrokes travel left to right, output travels right to left — and every hop is plain bytes.
		</p>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			One hop in that diagram does more than ferry bytes. Between the two ends of the PTY lives a
			slice of kernel code called the <strong style="color: var(--color-text);"
				>line discipline</strong
			> — a tiny line editor that decides how much of your typing to hold back and when to hand it over.
			It has two personalities:
		</p>

		<div class="mb-4 grid gap-3 sm:grid-cols-2">
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">
					Cooked mode (canonical)
				</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					The default. The kernel buffers your keystrokes, handles Backspace itself, and delivers
					nothing until you press Enter — then the program receives one finished line. This is why
					the shell never sees your typos: you edit the line before it exists.
				</p>
			</div>
			<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
				<p class="mb-1.5 text-[13px] font-semibold" style="color: var(--color-text);">Raw mode</p>
				<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
					Every keystroke is delivered immediately, unedited. Programs that react key by key —
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">vim</code
					>,
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">less</code
					>, the arrow-key line editor inside bash itself — switch the terminal into raw mode while
					they run, and back on exit. (A crash that skips the "back" is how terminals end up garbled
					—
					<code
						class="rounded px-1 py-0.5 text-[11px]"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">reset</code
					> fixes it.)
				</p>
			</div>
		</div>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			That split personality explains a small mystery. Arrow keys don't send a character — there is
			no "up" letter — they send a short byte sequence beginning with the Escape character: up arrow
			is
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ESC [ A</code
			>. A raw-mode program recognizes the sequence and moves the cursor. Hand it to a program
			reading cooked input — press up while
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">cat</code
			>
			is waiting — and it echoes as the literal
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">^[[A</code
			>. Now you know exactly what that gibberish means: the terminal spoke arrow, and nobody
			translated. You can inspect your own line discipline's settings any time:
		</p>

		<CodeBlock
			code={`stty -a
# speed 38400 baud; rows 24; columns 80;
# intr = ^C; erase = ^?; kill = ^U; eof = ^D;
# icanon iexten echo echoe echok ...`}
			title="Peek at the line discipline"
		/>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">icanon</code
			>
			is cooked mode's official name,
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">erase = ^?</code
			>
			is the kernel handling your Backspace — and
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">intr = ^C</code
			> is a promise we'll cash in a moment.
		</p>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Escape sequences run in the other direction too — they're how programs <em>draw</em>. A
			program attached to a tty can only send bytes, so color, bold, and cursor movement travel
			<strong style="color: var(--color-text);">in-band</strong>, mixed right into the text: byte 27
			(<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ESC</code
			>, written
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">\e</code
			>) announces "the next few bytes are instructions, not text", and the emulator obeys them
			instead of printing them. The vocabulary was standardized around DEC's VT100 terminal in 1978
			— your gleaming modern emulator is still, at heart, impersonating it. Watch it obey:
		</p>

		<CodeBlock
			code={`printf '\\e[32mgreen\\e[0m\\n'
# green        (printed in actual green)`}
			title="Color is just bytes"
		/>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">\e[32m</code
			>
			means "switch the pen to green";
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">\e[0m</code
			>
			means "back to normal". Every colorful
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
			>, every fancy prompt, every full-screen dashboard is built from sequences like these — and
			the colored output in this site's playground works the same way in spirit: the text carries
			its own formatting, and whatever paints the glyphs interprets it.
		</p>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			One last piece of magic to demystify: <strong style="color: var(--color-text);">Ctrl+C</strong
			>. It feels like input, but it never reaches the program as text. When Ctrl+C's byte arrives
			at the line discipline, the kernel intercepts it — that's the
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">intr = ^C</code
			>
			setting you just saw — and instead of passing it along, sends the foreground program a
			<strong style="color: var(--color-text);">signal</strong> called
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">SIGINT</code
			>
			("interrupt"). The program can catch it and tidy up, or die on the spot. Either way, you get your
			prompt back.
		</p>

		<Callout type="note" title="Why the panic button works">
			The cheat sheet's panic row promises Ctrl+C will interrupt a stuck command, and now you know
			why it's reliable: it isn't input the program must get around to reading — it's the kernel
			tapping the program on the shoulder. That's why it works even when a program is too busy to
			look at the keyboard. (A few programs catch <code
				class="rounded px-1 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">SIGINT</code
			> and ask questions first — that's them trapping the signal, not you failing to send it.)
		</Callout>

		<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			Put the whole chain together, and you can narrate the few milliseconds after you press Enter
			on
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
			>:
		</p>

		<ol
			class="mb-4 space-y-2 pl-5 text-[14px] leading-relaxed"
			style="color: var(--color-text-secondary);"
		>
			<li class="list-decimal">
				The <strong style="color: var(--color-text);">emulator</strong> turns Enter into a carriage-return
				byte and writes it to the PTY master — same as any other key.
			</li>
			<li class="list-decimal">
				The <strong style="color: var(--color-text);">line discipline</strong> recognizes the end of a
				line, converts it to a newline, and releases the whole buffered line to the slave end.
			</li>
			<li class="list-decimal">
				The <strong style="color: var(--color-text);">shell</strong>, which has been blocked reading
				the slave, wakes up holding
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				> and parses it — expanding any $VARIABLES, ~, and globs first.
			</li>
			<li class="list-decimal">
				It <strong style="color: var(--color-text);">forks</strong> a copy of itself and
				<strong style="color: var(--color-text);">execs</strong> ls inside the copy, with the copy's input
				and output still wired to the same tty.
			</li>
			<li class="list-decimal">
				ls does its work and writes its results — text plus color escape sequences — to the slave
				end.
			</li>
			<li class="list-decimal">
				The bytes flow back through the PTY to the master; the <strong
					style="color: var(--color-text);">emulator</strong
				> reads them, obeys the escapes, and paints glyphs into its character grid.
			</li>
			<li class="list-decimal">
				ls exits; the shell collects its exit code (you'll meet it as <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$?</code
				> in Part 6) and prints a fresh prompt. Your turn.
			</li>
		</ol>

		<p class="text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
			That's the entire machine: an app impersonating 1970s furniture, a kernel pipe in costume, a
			tiny in-kernel line editor, and a shell that just reads and writes bytes. None of it is
			required for the parts ahead — but from here on, nothing the terminal does will look like
			magic. You now know more about the terminal than most people who use it every day. Time to go
			use it.
		</p>
	</div>
</section>
