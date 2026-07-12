<script lang="ts">
	import { Gamepad2, ScrollText, HelpCircle, History, Laptop, Terminal } from 'lucide-svelte';
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
			<div class="mx-auto w-48 flex-shrink-0 sm:mx-0 sm:w-52">
				<ExpandableImage
					src="{base}/images/thompson-ritchie.jpg"
					alt="Ken Thompson and Dennis Ritchie at a PDP-11 running Unix at Bell Labs"
					caption="Ken Thompson (seated) and Dennis Ritchie at Bell Labs, creators of Unix. Photo: Wikimedia Commons"
					width={720}
					height={1080}
				/>
			</div>
		</div>

		<div class="mb-5 rounded-lg p-5" style="background: var(--color-bg-secondary);">
			{#each shellTimeline as entry (entry.year)}
				<div class="flex gap-4 py-2">
					<span
						class="w-20 flex-shrink-0 text-right text-[12px] font-semibold"
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
	<div id="section-intro-anatomy" class="mx-auto max-w-4xl">
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
			definition={`graph LR
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
</section>
