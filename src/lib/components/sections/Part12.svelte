<script lang="ts">
	import {
		Gauge,
		Palette,
		History,
		Layout,
		SplitSquareHorizontal,
		Type,
		Ghost,
		Bot,
		ArrowUp,
		ScrollText,
		Repeat,
		Search,
		PanelTop,
		Columns2
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import OsIcon from '../ui/OsIcon.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import StarshipDesigner from '../starship/StarshipDesigner.svelte';
</script>

<section id="part-12" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Gauge}
			partLabel="Part 12"
			title="Your Cockpit: Making the Terminal a Place You Like"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"If you're going to live in this window, you might as well like it: readable fonts, a prompt
			that helps, history that finds last Tuesday's command."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			You have the skills. This short part is about the <em>room</em> — turning the default terminal into
			a cockpit: colors and a prompt you actually like, history tricks that recall any command in two
			keystrokes, the integrated terminal in VS Code where vibe coders live, and running several terminals
			at once without losing your mind.
		</p>

		<MermaidDiagram
			definition={`flowchart TD
  A(["Your Cockpit"]) --> B(["Looks & Prompt"])
  A --> C(["History Recall"])
  A --> D(["VS Code Terminal"])
  A --> E(["Tabs & Splits"])`}
			id="cockpit-overview"
		/>

		<!-- 12.1 Make It Yours -->
		<div id="section-12-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Palette}
				title="12.1 Make It Yours"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/make-it-yours.webp"
					alt="Make It Yours — a terminal window dressed up with a custom theme and prompt"
					caption="Same shell underneath — but a window you chose is a window you'll open more often"
				/>
			</div>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				The default white-on-black is fine, but "fine" is not what you want from a tool you'll live
				in. Every terminal app ships with themes, font settings, and transparency — five minutes of
				setup pays off every day after:
			</p>

			<div class="mb-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<span class="inline-flex" style="color: var(--color-primary);"
							><OsIcon os="macos" size={14} /></span
						>
						macOS: Terminal.app got good again
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						macOS 26 Tahoe gave the stock Terminal.app its first real overhaul in roughly 24 years —
						24-bit true color (~16.7 million shades, where older terminals were stuck with 16 or
						256), Powerline font support, and a batch of fresh themes. Settings → Profiles (a
						profile is one saved bundle of font, colors and behavior): pick one, hit "Default" to
						keep it. As a beginner you genuinely don't need to install anything. <a
							href="https://iterm2.com"
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-2"
							style="color: var(--color-primary);">iTerm2</a
						> remains the solid power-user choice — hundreds of importable color schemes, better splits,
						better search — and its AI features are an optional, separate plugin, off by default.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<span class="inline-flex" style="color: var(--color-primary);"
							><OsIcon os="windows" size={14} /></span
						>
						Windows: Windows Terminal
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Already the default on Windows 11, and the host for your WSL and Git Bash sessions.
						Settings → Color schemes ships with One Half, Solarized, and Tango out of the box, and
						each profile (Ubuntu, Git Bash, PowerShell) can have its own theme — a handy visual cue
						for which shell you're in.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<span class="inline-flex" style="color: var(--color-primary);"
							><OsIcon os="linux" size={14} /></span
						>
						Linux: GNOME Terminal &amp; friends
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						GNOME Terminal → Preferences → Profiles: colors, fonts, transparency. Konsole (KDE) and
						others offer the same. Profiles are cheap — make a garish red one for any terminal
						that's SSH'd into something important.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Type size={14} style="color: var(--color-primary);" />
						Everywhere: the font matters
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Monospaced means every character takes the same width — the only reason columns of
						output line up, so the choice is less taste than it looks. Pick one with a legible
						<Code code="0" />-vs-<Code code="O" /> and a size you don't squint at. JetBrains Mono, Fira
						Code, and Cascadia Code are free favorites.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Ghost size={14} style="color: var(--color-primary);" />
						The upgrade pick: Ghostty
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						<a
							href="https://ghostty.org"
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-2"
							style="color: var(--color-primary);">Ghostty</a
						> (v1.3, 2026; macOS &amp; Linux) is the current favorite when you outgrow the stock app:
						extremely fast, native-feeling, free and open source, and deliberately AI-free. Your shell,
						prompt, and everything in this course carry over unchanged.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Bot size={14} style="color: var(--color-primary);" />
						The AI-first one: Warp
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Warp builds an AI agent directly into the terminal. Know what you're choosing: it went
						open source in 2026, but it wants an account, and its AI runs on a paid, metered credit
						system — an AI-first terminal with a subscription posture, not a free tool. Nothing it
						offers replaces being able to read the commands yourself.
					</p>
				</div>
			</div>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				A taste of prompt customization
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The prompt itself — that <Code code="user@host:~$" />
				from the intro — is just a variable named
				<Code code="PS1" />, short for prompt string 1, and you set it the way you set any variable
				(<CourseLink to="section-5-4" />):
			</p>

			<CodeBlock
				title="PS1 exists (try it, it only lasts until you close the window)"
				code={`PS1="\\w > "
# ~/projects >              <- your prompt is now the current directory

PS1="🌲 \\W $ "
# 🌲 projects $             <- yes, emoji work`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The name implies a <Code code="PS2" />, and there is one: the continuation prompt — the bare
				<Code code=">" /> you get if you press Enter with a quote still hanging open. That's the shell
				asking you to finish the line, not an error.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Hand-rolling a fancy <Code code="PS1" />
				with colors and git status is a classic rabbit hole. The modern shortcut is
				<a
					href="https://starship.rs"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">Starship</a
				>
				— a fast, cross-shell prompt that works in bash, zsh, and every OS in this course. One install,
				one line in your shell config (<CourseLink to="section-5-5" />,
				<Code code=".bashrc" />
				/
				<Code code=".zshrc" />), and your prompt shows the current directory, git branch, language
				versions, and whether the last command failed — the useful stuff, with zero maintenance.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Pair it with a couple of small zsh <strong style="color: var(--color-text);">plugins</strong
				>
				— extra files your shell config loads at startup, the same mechanism as the aliases you added
				there yourself, only someone else wrote the file. Two earn their place:
				<Code code="zsh-autosuggestions" /> greys in the rest of a command as you start typing it, and
				<Code code="zsh-syntax-highlighting" /> turns a command red before you press Enter if the shell
				can't find it. A framework like oh-my-zsh bundles hundreds instead, and charges you startup time
				for the ones you'll never use.
			</p>

			<Callout type="tip">
				<strong>Practice the audit from <CourseLink to="section-11-1" /> here.</strong> Starship's
				install command is a <Code code="curl ... | sh" /> one-liner — the red-flag pattern, with one
				detail worth catching: it ends in <Code code="sh" />, not <Code code="bash" />. <Code
					code="sh"
				/> is an older, more minimal shell that on many systems isn't bash at all — a quiet swap of what
				runs the script, and the kind of detail an audit is for. Perfect low-stakes rehearsal: download
				the script first, skim it (or ask your AI to), then run it. Trusted source, verified anyway —
				that's the habit.
			</Callout>

			<VibeBox
				prompts={[
					'Help me install starship and add it to my shell config — explain each step before we run it',
					'Set up a terminal color scheme and font that are easy on the eyes for long sessions on my OS'
				]}
			/>

			<h4
				id="prompt-designer"
				class="mt-8 mb-2 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Design Your Prompt
			</h4>
			<p class="mb-5 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Enough talk — build one. Pick a design, make it yours, and take the real
				<Code code="starship.toml" /> home. This is a genuine config for
				<a
					href="https://starship.rs/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">Starship</a
				>, the cross-shell prompt — nothing here touches your machine until you choose to install
				it.
			</p>
			<StarshipDesigner />
		</div>

		<!-- 12.2 History Superpowers -->
		<div id="section-12-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={History}
				title="12.2 History Superpowers"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/history-superpowers.webp"
					alt="History Superpowers — recalling past commands with up-arrow, !!, and Ctrl+R"
					caption="You almost never type a command twice — you recall it"
				/>
			</div>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Watch someone fluent in the terminal and you'll notice they barely type. The shell writes
				down every command you run in a file it keeps between sessions — that record is your
				<strong style="color: var(--color-text);">history</strong>, and it is not the same thing as
				<strong style="color: var(--color-text);">scrollback</strong>, the output still sitting in
				the window above your prompt. Scrollback is what a screenshot captures, and it dies with the
				window; history outlives it. The recall tools built on that record are the biggest speed
				unlock in this course:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<ArrowUp size={14} style="color: var(--color-primary);" />
						Up-arrow — the one you know
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Each press steps one command back through history; Enter re-runs, or edit first. Perfect
						for the last two or three commands — clumsy for anything older. That's what the rest of
						this section is for.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<ScrollText size={14} style="color: var(--color-primary);" />
						<span><Code code="history" /> — the full ledger</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Prints your numbered command history — and because it's just text output, all of <CourseLink
							to="part-4"
						/>
						applies: <Code code="history | grep ssh" /> finds every ssh command you've ever run. Your
						history is a searchable log of how you did everything.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Repeat size={14} style="color: var(--color-primary);" />
						<span><Code code="!!" /> — the last command, verbatim</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="!!" />
						expands to your previous command. Its one legendary use: you run something, it fails with
						"permission denied," and
						<Code code="sudo !!" /> re-runs it elevated — no retyping. (Every bit of the sudo caution
						in
						<CourseLink to="section-5-3" /> still applies; the shell prints the expanded command, so you
						see what's about to run.)
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Search size={14} style="color: var(--color-primary);" />
						Ctrl+R — reverse search, the crown jewel
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Press <kbd
							class="rounded border px-1 py-0.5 text-[11px]"
							style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
							>Ctrl+R</kbd
						>
						and start typing any fragment — the shell live-searches backward through history for the most
						recent match. Press
						<kbd
							class="rounded border px-1 py-0.5 text-[11px]"
							style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
							>Ctrl+R</kbd
						>
						again for older matches, Enter to run, arrow keys to edit first,
						<kbd
							class="rounded border px-1 py-0.5 text-[11px]"
							style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
							>Ctrl+C</kbd
						> to bail. That 40-character command from last Tuesday? Three letters and it's back.
					</p>
				</div>
			</div>

			<CodeBlock
				title="A history session"
				code={`history | grep backup
#  212  ./backup.sh notes
#  340  ./backup.sh recipes

npm run deploy
# Error: permission denied
sudo !!
# sudo npm run deploy       <- the shell shows what !! became

# (reverse-i-search)\`dep': npm run deploy     <- Ctrl+R, then "dep"`}
			/>

			<Callout type="tip">
				<strong>Make Ctrl+R the habit.</strong> The rule of thumb: up-arrow for the last couple of
				commands,
				<kbd
					class="rounded border px-1 py-0.5 text-[11px]"
					style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
					>Ctrl+R</kbd
				>
				for everything else. If you catch yourself pressing up-arrow more than three times, stop — reverse
				search would have had it already. And for commands you recall <em>constantly</em>, promote
				them to an alias (<CourseLink to="section-5-5" />) and stop searching altogether.
			</Callout>

			<h4
				id="history-recall"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Retrace Your Steps
			</h4>
			<PlaygroundNote>
				Ctrl+R lives at a real prompt, but you can practice the other half here: run a couple of
				commands, then pipe <Code code="history" /> into
				<Code code="grep" /> to dig one back out — and save the line you found.
			</PlaygroundNote>
			<LessonActivity title="Retrace Your Steps" scenarioId="history-recall" id="history-recall" />

			<VibeBox
				prompts={[
					'Search my shell history for every command I ran involving npm and summarize what they did',
					'Teach me the Ctrl+R workflow with three practice rounds using commands from this session'
				]}
			/>
		</div>

		<!-- 12.3 Terminal in VS Code -->
		<div id="section-12-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Layout}
				title="12.3 Terminal in VS Code"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/vscode-terminal.webp"
					alt="Terminal in VS Code — the integrated terminal panel beneath the editor"
					caption="Editor above, terminal below — one window, and it's the same bash you've been learning"
				/>
			</div>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Here's where all of this lands in daily life. VS Code has a full terminal built into the
				editor — toggle it with <kbd
					class="rounded border px-1 py-0.5 text-[11px]"
					style="border-color: var(--color-border); background: var(--color-bg-tertiary);">⌃`</kbd
				>
				(Control + backtick, same keys on every OS), and it slides up as a panel beneath your code. It's
				not a lookalike or a simulation — it runs your real shell, with your
				<Code code=".bashrc" />, your aliases, your PATH, your history. Everything from this course
				works in it unchanged.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Two conveniences make it better than a separate window: it <strong
					style="color: var(--color-text);"
					>opens already <Code code="cd" />'d into your project folder</strong
				>
				(no navigating to where your code lives — you're there), and the
				<strong style="color: var(--color-text);">+</strong> button in the panel spawns extra terminals
				in the same place, with a dropdown to pick which shell (bash, zsh, or on Windows: WSL, Git Bash,
				PowerShell).
			</p>

			<Callout type="important">
				<strong>This is where a lot of AI coding actually lands.</strong> When a coding agent in VS
				Code — Copilot, Claude Code, Cursor's agent — runs a command, it usually runs in this
				integrated terminal:
				<em>the same panel you can read, scroll, and type into</em>. The agent proposes
				<Code code="npm test" />, you watch it execute, you scroll back through the failures, you
				run your own
				<Code code="grep" /> on the log — human and AI, sharing one shell. Every skill in this course
				is what lets you be a participant in that terminal instead of a spectator.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				That shared visibility is the practical payoff of <CourseLink to="part-11" />: when the
				agent asks permission to run a command, you audit it first; when it writes a <Code
					code="setup.sh"
				/>, you read it line by line; when it says "tests failed," you can see the exit code it saw.
				The integrated terminal is the one place code, agent, and shell meet — all in a single
				window.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				VS Code even builds the red-flag mental model from <CourseLink to="section-11-1" /> into settings.
				Copilot's agent mode runs terminal commands
				<strong style="color: var(--color-text);">with per-command approval</strong>, and you can
				maintain an allowlist and denylist of which commands auto-approve — let
				<Code code="git status" />
				through without asking, always stop on
				<Code code="rm -rf" />
				and
				<Code code="sudo" />. Claude Code ships a VS Code extension that drives the same CLI from a
				panel in the editor — same terminal, same approval moments, same skills.
			</p>

			<Callout type="note">
				One habit worth stealing: keep <strong>one terminal for the agent and one for you</strong>.
				Click <strong>+</strong> to add yours. The agent's commands and output stay in its terminal
				where you can audit the transcript; your exploring (<Code code="ls" />, <Code code="cat" />,
				<Code code="grep" />) doesn't tangle with its work. Which is the perfect segue to the next
				section.
			</Callout>

			<VibeBox
				prompts={[
					'Run the test suite in the integrated terminal and walk me through the output you see',
					'Before you run any command in this terminal, tell me what it does and wait for my okay'
				]}
			/>
		</div>

		<!-- 12.4 Many Terminals at Once -->
		<div id="section-12-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={SplitSquareHorizontal}
				title="12.4 Many Terminals at Once"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/many-terminals.webp"
					alt="Many Terminals at Once — tabs and split panes, one job per pane"
					caption="One terminal per job: server here, logs there, you in the middle"
				/>
			</div>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Sooner or later one terminal isn't enough: a dev server occupies one (it runs until you stop
				it, holding the prompt hostage), <Code code="tail -f" />
				follows a log in another (<CourseLink to="part-2" />), and you still need a free prompt to
				actually work. The answer is never "quit the server" — it's
				<strong style="color: var(--color-text);">more terminals</strong>, and every modern terminal
				app makes that cheap:
			</p>

			<div class="mb-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<PanelTop size={14} style="color: var(--color-primary);" />
						Tabs
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Like browser tabs: <kbd
							class="rounded border px-1 py-0.5 text-[11px]"
							style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
							>⌘T</kbd
						>
						on macOS,
						<kbd
							class="rounded border px-1 py-0.5 text-[11px]"
							style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
							>Ctrl+Shift+T</kbd
						> in Windows Terminal and GNOME Terminal. Each tab is a fresh, independent shell — new history
						position, own working directory. Best for separate contexts: one tab per project.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Columns2 size={14} style="color: var(--color-primary);" />
						Split panes
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Two or more shells visible side by side in one window — best for things you watch <em
							>while</em
						> you work (server output, a followed log). iTerm2, Windows Terminal, and VS Code's terminal
						panel all split with a keystroke or the pane's context menu.
					</p>
				</div>
			</div>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				A classic three-pane cockpit for a coding session: the dev server in one pane, <Code
					code="tail -f server.log"
				/>
				in a second, and a free prompt in the third — with your agent's terminal from 12.3 alongside.
				Every shell is independent: its own working directory, its own
				<Code code="cd" />, its own foreground command. Nothing you do in one pane disturbs another.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				And here's the 2026 twist that turned splits from a power-user nicety into standard
				practice: <strong style="color: var(--color-text);"
					>people now run multiple AI agents in parallel</strong
				> — one agent per pane or tab, each pointed at its own copy of the project (git calls that a worktree)
				so they never collide. The split layout stops being "server here, logs there" and becomes several
				agents, each in its own pane: three panes, three agents on three tasks, and you sweeping your
				eyes across all of them, approving and course-correcting. Every pane is just a shell — which is
				why everything in this course scales from one terminal to ten.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				One name to file away for later: <strong style="color: var(--color-text);">tmux</strong>, a
				terminal multiplexer that does tabs and splits <em>inside</em> the terminal itself — and whose
				sessions survive the window closing, your laptop sleeping, even an SSH connection dropping. You
				log back in, reattach, and every pane is exactly where you left it (agents included — which is
				why people running several at once tend to live in it).
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Careful with that word, though — everywhere else in this course a session is one shell's
				lifetime, and it dies with its window. A tmux session is a named collection of panes living
				in a process of its own, which is how it survives yours closing. Its keybindings feel arcane
				for one reason: every one of them starts with the same two keys, Ctrl+B, pressed and
				released
				<em>before</em> the key that does the work — so splitting a pane is Ctrl+B, then
				<Code code="%" />.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				<strong style="color: var(--color-text);">Zellij</strong> is the friendlier modern multiplexer,
				with its shortcuts printed on screen. Overkill for today; indispensable the day you work on remote
				servers. It'll be waiting.
			</p>

			<VibeBox
				prompts={[
					'Set up my layout: dev server in one terminal, log tail in a second, and a free shell for me',
					'The dev server is hogging my only terminal — what are my options, and which do you recommend?'
				]}
			/>
		</div>

		<ChallengeActivity title="Hand Over the Cockpit" part={12} id="ch-12-handover" />
	</div>
</section>
