<script lang="ts">
	import { Gauge, Palette, History, Layout, SplitSquareHorizontal } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-7" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Gauge}
			partLabel="Part 7"
			title="Your Cockpit: Making the Terminal a Place You Like"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"You'll spend thousands of hours in this window. Make it fast, make it comfortable, make it
			yours."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			You have the skills. This short part is about the <em>room</em> — turning the default terminal into
			a cockpit: colors and a prompt you actually like, history tricks that recall any command in two
			keystrokes, the integrated terminal in VS Code where vibe coders live, and running several terminals
			at once without losing your mind.
		</p>

		<MermaidDiagram
			definition={`graph TD
  A(["Your Cockpit"]) --> B(["Looks & Prompt"])
  A --> C(["History Recall"])
  A --> D(["Terminal in VS Code"])
  A --> E(["Tabs & Splits"])
  B --> F(["themes, PS1, starship"])
  C --> G(["up-arrow, !!, Ctrl+R"])
  D --> H(["one window: code + agent + shell"])
  E --> I(["one terminal per job"])`}
			id="cockpit-overview"
		/>

		<!-- 7.1 Make It Yours -->
		<div id="section-7-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Palette}
				title="7.1 Make It Yours"
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
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
						macOS: Terminal.app got good again
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						macOS 26 Tahoe gave the stock Terminal.app its first real overhaul in roughly 24 years —
						24-bit color, Powerline font support, and a batch of fresh themes. Settings → Profiles:
						pick one, hit "Default" to keep it — as a beginner you genuinely don't need to install
						anything. <a
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
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
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
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
						Linux: GNOME Terminal &amp; friends
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						GNOME Terminal → Preferences → Profiles: colors, fonts, transparency. Konsole (KDE) and
						others offer the same. Profiles are cheap — make a garish red one for any terminal
						that's SSH'd into something important.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
						Everywhere: the font matters
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						A good monospaced font with a legible <code
							class="text-xs"
							style="font-family: var(--font-mono);">0</code
						>-vs-<code class="text-xs" style="font-family: var(--font-mono);">O</code> and a size you
						don't squint at. JetBrains Mono, Fira Code, and Cascadia Code are free favorites.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
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
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
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
				The prompt itself — that <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>user@host:~$</code
				>
				from the intro — is just a variable named
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">PS1</code
				>, and you can set it like any other variable from Part 5:
			</p>

			<CodeBlock
				title="PS1 exists (try it, it only lasts until you close the window)"
				code={`PS1="\\w > "
# ~/projects >              <- your prompt is now the current directory

PS1="🌲 \\W $ "
# 🌲 projects $             <- yes, emoji work`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Hand-rolling a fancy <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">PS1</code
				>
				with colors and git status is a classic rabbit hole. The modern shortcut is
				<a
					href="https://starship.rs"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">Starship</a
				>
				— a fast, cross-shell prompt that works in bash, zsh, and every OS in this course. One install,
				one line in your shell config (Part 5's
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.bashrc</code
				>
				/
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.zshrc</code
				>), and your prompt shows the current directory, git branch, language versions, and whether
				the last command failed — the useful stuff, with zero maintenance. It's also where the
				current consensus landed: 2026 setup guides recommend Starship plus one or two small zsh
				plugins over the heavyweight all-in-one frameworks (oh-my-zsh) that used to be the default
				advice.
			</p>

			<Callout type="tip">
				<strong>Practice the 6.1 audit here.</strong> Starship's install command is a
				<code style="font-family: var(--font-mono);">curl ... | sh</code> one-liner — exactly the red-flag
				pattern from last chapter. Perfect low-stakes rehearsal: download the script first, skim it (or
				ask your AI to), then run it. Trusted source, verified anyway — that's the habit.
			</Callout>

			<VibeBox
				prompts={[
					'Help me install starship and add it to my shell config — explain each step before we run it',
					'Set up a terminal color scheme and font that are easy on the eyes for long sessions on my OS'
				]}
			/>
		</div>

		<!-- 7.2 History Superpowers -->
		<div id="section-7-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={History}
				title="7.2 History Superpowers"
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
				Watch someone fluent in the terminal and you'll notice they barely type. The shell remembers
				every command you've ever run, and the recall tools are the single biggest speed unlock in
				this entire course:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						Up-arrow — the one you know
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Each press steps one command back through history; Enter re-runs, or edit first. Perfect
						for the last two or three commands — clumsy for anything older. That's what the rest of
						this section is for.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">history</code
						> — the full ledger
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Prints your numbered command history — and because it's just text output, all of Part 4
						applies: <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>history | grep ssh</code
						> finds every ssh command you've ever run. Your history is a searchable log of how you did
						everything.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">!!</code
						> — the last command, verbatim
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">!!</code
						>
						expands to your previous command. Its one legendary use: you run something, it fails with
						"permission denied," and
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">sudo !!</code
						> re-runs it elevated — no retyping. (All of section 5.3's sudo caution still applies; the
						shell prints the expanded command so you see exactly what's about to run.)
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
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
				them to an alias (section 5.5) and stop searching altogether.
			</Callout>

			<VibeBox
				prompts={[
					'Search my shell history for every command I ran involving npm and summarize what they did',
					'Teach me the Ctrl+R workflow with three practice rounds using commands from this session'
				]}
			/>
		</div>

		<!-- 7.3 Terminal in VS Code -->
		<div id="section-7-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Layout}
				title="7.3 Terminal in VS Code"
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
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.bashrc</code
				>, your aliases, your PATH, your history. Everything from this course works in it unchanged.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Two conveniences make it better than a separate window: it <strong
					style="color: var(--color-text);"
					>opens already <code>cd</code>'d into your project folder</strong
				>
				(no navigating to where your code lives — you're there), and the
				<strong style="color: var(--color-text);">+</strong> button in the panel spawns extra terminals
				in the same place, with a dropdown to pick which shell (bash, zsh, or on Windows: WSL, Git Bash,
				PowerShell).
			</p>

			<Callout type="important">
				<strong>This is where vibe coding actually happens.</strong> When a coding agent in VS Code
				— Copilot, Claude Code, Cursor's agent — runs a command, it runs in this integrated
				terminal:
				<em>the same panel you can read, scroll, and type into</em>. The agent proposes
				<code style="font-family: var(--font-mono);">npm test</code>, you watch it execute, you
				scroll back through the failures, you run your own
				<code style="font-family: var(--font-mono);">grep</code> on the log — human and AI, sharing one
				shell. Every skill in this course is what lets you be a participant in that terminal instead of
				a spectator.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				That shared visibility is the practical payoff of Part 6: when the agent asks permission to
				run a command, you audit it (6.1); when it writes a <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">setup.sh</code
				>, you read it (6.2); when it says "tests failed," you can see the exit code it saw (6.3).
				The integrated terminal is the glass cockpit where all of that happens in one place — code,
				agent, and shell in a single window.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				VS Code even builds the red-flag mental model from 6.1 into settings. Copilot's agent mode
				runs terminal commands <strong style="color: var(--color-text);"
					>with per-command approval</strong
				>, and you can maintain an allowlist and denylist of which commands auto-approve — let
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">git status</code
				>
				through without asking, always stop on
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -rf</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">sudo</code
				>. Claude Code ships a GA VS Code extension that drives the same CLI from a panel in the
				editor — same terminal, same approval moments, same skills.
			</p>

			<Callout type="note">
				One habit worth stealing: keep <strong>one terminal for the agent and one for you</strong>.
				Click <strong>+</strong> to add yours. The agent's commands and output stay in its terminal
				where you can audit the transcript; your exploring (<code
					style="font-family: var(--font-mono);">ls</code
				>, <code style="font-family: var(--font-mono);">cat</code>,
				<code style="font-family: var(--font-mono);">grep</code>) doesn't tangle with its work.
				Which is the perfect segue to the next section.
			</Callout>

			<VibeBox
				prompts={[
					'Run the test suite in the integrated terminal and walk me through the output you see',
					'Before you run any command in this terminal, tell me what it does and wait for my okay'
				]}
			/>
		</div>

		<!-- 7.4 Many Terminals at Once -->
		<div id="section-7-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={SplitSquareHorizontal}
				title="7.4 Many Terminals at Once"
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
				it, holding the prompt hostage), <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">tail -f</code
				>
				follows a log in another (Part 2), and you still need a free prompt to actually work. The answer
				is never "quit the server" — it's
				<strong style="color: var(--color-text);">more terminals</strong>, and every modern terminal
				app makes that cheap:
			</p>

			<div class="mb-6 grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">Tabs</p>
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
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-text);">
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
				A classic three-pane cockpit for a coding session: the dev server in one pane, <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>tail -f server.log</code
				>
				in a second, and a free prompt in the third — with your agent's terminal from 7.3 alongside. Every
				shell is independent: its own working directory, its own
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>, its own foreground command. Nothing you do in one pane disturbs another.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				And here's the 2026 twist that turned splits from a power-user nicety into standard
				practice: <strong style="color: var(--color-text);"
					>people now run multiple AI agents in parallel</strong
				> — one agent per pane or tab, each pointed at its own copy of the project (its own git worktree)
				so they never collide. The split layout stops being "server here, logs there" and becomes an agent-fleet
				dashboard: three panes, three agents on three tasks, and you sweeping your eyes across all of
				them, approving and course-correcting. Every pane is just a shell — which is why everything in
				this course scales from one terminal to ten.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				One name to file away for later: <strong style="color: var(--color-text);">tmux</strong>, a
				terminal multiplexer that does tabs and splits <em>inside</em> the terminal itself — and
				whose sessions survive the window closing, your laptop sleeping, even an SSH connection
				dropping. You log back in, reattach, and every pane is exactly where you left it (agents
				included — which is exactly why the agent-fleet crowd lives in it). If tmux's keybindings
				feel arcane,
				<strong style="color: var(--color-text);">Zellij</strong> is the friendlier modern multiplexer
				with the shortcuts printed on screen. Overkill for today; indispensable the day you work on remote
				servers. It'll be waiting.
			</p>

			<VibeBox
				prompts={[
					'Set up my layout: dev server in one terminal, log tail in a second, and a free shell for me',
					'The dev server is hogging my only terminal — what are my options, and which do you recommend?'
				]}
			/>
		</div>
	</div>
</section>
