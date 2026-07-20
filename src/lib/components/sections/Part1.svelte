<script lang="ts">
	import { Terminal, Monitor, Sparkles, HelpCircle } from 'lucide-svelte';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import { base } from '$app/paths';
	import OsIcon from '../ui/OsIcon.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
</script>

<section id="part-1" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Terminal}
			partLabel="Part 1"
			title="First Contact"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"Every conversation with a computer begins the same way: a prompt, a command, and <Code
				code="Enter"
			/>."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			Time to actually touch the thing. In this part you'll open a terminal on your own machine, run
			your first real commands, and learn how to ask for help when a command confuses you — three
			skills that carry you through everything else. Nothing in this part can harm your computer,
			and we'll prove it as we go.
		</p>

		<!-- 1.1 Opening Your Terminal -->
		<div id="section-1-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Monitor}
				title="1.1 Opening Your Terminal"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				The terminal has a fearsome reputation, so let's start by deflating it: it's just an app. It
				sits next to your browser and your music player, it opens like them, and it closes like
				them. Here's where to find yours.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/opening-terminal.webp"
					alt="Opening Your Terminal — it's just an app, sitting next to all the others"
					caption="Behind the intimidating black window is an ordinary application — open it like any other"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You've decided to learn the terminal, but you've never deliberately
				opened one. Where does it even live?
			</Callout>

			<h4
				class="mt-5 mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
				style="color: var(--color-text);"
			>
				<OsIcon os="macos" size={14} />
				macOS
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Press <kbd
					class="rounded border px-1 py-0.5 text-[11px]"
					style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
					>⌘ Space</kbd
				>
				to open Spotlight, type <strong style="color: var(--color-text);">Terminal</strong>, and
				press Enter. That's it. (The long way: Applications&nbsp;→ Utilities&nbsp;→ Terminal.app.)
				The stock app is a genuinely good place to start — since macOS 26 "Tahoe" it has true color
				and modern themes, so there's nothing to install today. Pin it to your Dock — you'll be
				back.
			</p>

			<h4
				class="mt-5 mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
				style="color: var(--color-text);"
			>
				<OsIcon os="linux" size={14} />
				Linux
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Press <kbd
					class="rounded border px-1 py-0.5 text-[11px]"
					style="border-color: var(--color-border); background: var(--color-bg-tertiary);"
					>Ctrl+Alt+T</kbd
				>
				on most desktops, or find <strong style="color: var(--color-text);">Terminal</strong> /
				<strong style="color: var(--color-text);">Console</strong> in your application menu.
			</p>

			<h4
				class="mt-5 mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
				style="color: var(--color-text);"
			>
				<OsIcon os="windows" size={14} />
				Windows
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Open <strong style="color: var(--color-text);">Windows Terminal</strong> from the Start menu
				— it's been the default console since Windows 11 22H2, so it's already there — then pick
				your <strong style="color: var(--color-text);">Ubuntu (WSL)</strong>
				profile from the dropdown next to the new-tab button. If you chose Git Bash instead, open
				<strong style="color: var(--color-text);">Git Bash</strong> from the Start menu. Either way, make
				sure you're in a bash window — not PowerShell — before following along (the intro explains the
				difference).
			</p>

			<Callout type="tip" title="It's just an app">
				Opening a terminal does nothing to your computer. Closing the window does nothing either (it
				just ends that conversation). You can open five of them side by side. The terminal only acts
				when you type a command <em>and</em> press Enter — and you haven't typed anything yet.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Whatever you opened, you should now be looking at a mostly-empty window with a prompt and a
				blinking cursor — the shell, waiting for your first words.
			</p>

			<VibeBox
				prompts={[
					'How do I open a terminal on my machine, and which shell is it running?',
					'Set up Windows Terminal so it opens my WSL Ubuntu shell by default'
				]}
			/>
		</div>

		<!-- 1.2 Your First Commands -->
		<div id="section-1-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Sparkles}
				title="1.2 Your First Commands"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A command is a word — sometimes followed by more words — typed at the prompt. Nothing
				happens while you type. Nothing happens while you hesitate. The shell only acts when you
				press <strong style="color: var(--color-text);">Enter</strong>. Let's have your first
				conversation.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/first-commands.webp"
					alt="Your First Commands — the machine answers when you press Enter"
					caption="Ask a question, press Enter, get an answer — your first commands are pure conversation"
				/>
			</div>

			<Callout type="note">
				<strong>The moment:</strong> A blinking cursor is waiting for you, and you have no idea what the
				machine will understand — or what's safe to try.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Start with a question the machine can't get wrong — who are you?
			</p>

			<CodeBlock
				title="Ask who you are"
				code={`whoami
# vibe`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The shell answered with your username. Now make it say something — <Code code="echo" /> repeats
				whatever you give it (it's also the workhorse of scripts, as you'll see later):
			</p>

			<CodeBlock
				title="Make it talk"
				code={`echo "Hello, terminal"
# Hello, terminal`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Ask for the time, and then wipe the slate clean:
			</p>

			<CodeBlock
				title="Two more essentials"
				code={`date
# Sat Jul 12 10:15:42 PDT 2026

clear
# The screen empties - your history is still there, just scrolled away`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Now the important experiment: type something wrong <em>on purpose</em>. Misspell a command
				and press Enter:
			</p>

			<CodeBlock
				title="Break it (you can't)"
				code={`ecoh "hello"
# bash: ecoh: command not found`}
			/>

			<Callout type="tip" title="Errors are feedback, not failure">
				Nothing broke. The shell simply told you it doesn't know a command called <Code
					code="ecoh"
				/>, and gave you a fresh prompt. Error messages in the terminal are answers — read them,
				they usually say exactly what's wrong. Typos cost you nothing but a retry (press the
				<strong>up arrow</strong>, fix the spelling, Enter).
			</Callout>

			<h4
				id="first-steps"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Say Hello to the Machine
			</h4>
			<PlaygroundNote>
				Run these commands in a simulated bash sandbox right here in your browser. Type <Code
					code="help"
				/> in the terminal for the full command list.
			</PlaygroundNote>
			<LessonActivity title="Say Hello to the Machine" scenarioId="first-steps" id="first-steps" />

			<VibeBox
				prompts={[
					'What does the echo command do, and what are quotes for in the shell?',
					'Give me five more harmless commands I can try to explore my terminal'
				]}
			/>
		</div>

		<!-- 1.3 Getting Help -->
		<div id="section-1-3" class="mb-8">
			<SectionHeader
				level="section"
				icon={HelpCircle}
				title="1.3 Getting Help"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You will never memorize every command — nobody does. What experienced people memorize
				instead is <em>how to look things up</em>. The terminal ships with its own documentation,
				and it's always three keystrokes away.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/getting-help.webp"
					alt="Getting Help — the manual is built in, always three keystrokes away"
					caption="Every command carries its own manual — you're never more than --help away from an answer"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You've met a command you don't understand — maybe one your AI
				assistant just proposed — and you need to know what it does <em>before</em> you run it.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Almost every command answers to <Code code="--help" />: a compact summary of what it does
				and which flags it accepts, printed straight to your terminal.
			</p>

			<CodeBlock
				title="The quick summary"
				code={`ls --help
# Usage: ls [OPTION]... [FILE]...
# List information about the FILEs (the current directory by default).
#   -a, --all        do not ignore entries starting with .
#   -l               use a long listing format
# ...`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				For the full story, there's <Code code="man" />
				— the manual, one page per command, installed with your system since before the web existed:
			</p>

			<CodeBlock
				title="The full manual"
				code={`man ls
# Opens the complete manual page for ls`}
			/>

			<Callout type="important" title="Press q to quit">
				<Code code="man" />
				opens in a <em>pager</em> — a full-screen reader that takes over your terminal. Scroll with
				the arrow keys or Space, search by typing
				<Code code="/word" />, and press <strong>q</strong> to get your prompt back. Everyone gets "stuck"
				in a pager exactly once — now you won't.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Man pages are thorough but dense. For a friendlier take, the community-written <strong
					style="color: var(--color-text);">tldr pages</strong
				>
				show each command as a handful of practical examples — the project is very much alive (its client
				spec hit v2.2 in March 2026). Try them at
				<a
					href="https://tldr.inbrowser.app"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline underline-offset-2"
					style="color: var(--color-primary);">tldr.inbrowser.app</a
				> before installing anything.
			</p>

			<CodeBlock
				title="tldr: examples first"
				code={`tldr tar
# tar
#   Archiving utility.
#   - Create an archive from files:
#     tar cf target.tar file1 file2 file3
#   - Extract an archive to the current directory:
#     tar xf source.tar
# ...`}
			/>

			<h4 class="mt-5 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				A third way to get help
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You have a third source of help the man-page authors never imagined: paste any command into
				your AI assistant and ask <em>"what does this do, flag by flag?"</em> It's the fastest
				explanation you'll get — and it works in reverse too, when the AI is the one
				<em>proposing</em> the command. The AI vendors know it: Anthropic's Claude Code docs now
				ship their own
				<a
					href="https://code.claude.com/docs/en/terminal-guide"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline underline-offset-2"
					style="color: var(--color-primary);">"never opened a terminal before" guide</a
				> — if you use a coding agent, being able to read its commands is part of using it safely. But
				language models can be confidently wrong about flags, so close the loop:
			</p>

			<Callout type="tip" title="Ask the AI, verify with --help">
				Let the assistant explain the command in plain English, then skim <Code code="--help" />
				or the man page to confirm the flags do what it claimed. Explanation from the AI,
				<em>ground truth from the machine</em> — that habit is the heart of <CourseLink
					to="part-6"
				/>, and you can start it today.
			</Callout>

			<h4
				id="help-lookup"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Read the Manual First
			</h4>
			<PlaygroundNote>
				Before you run an unfamiliar command, look it up. Open <Code code="head" />'s manual with
				<Code code="man head" />, then use what it taught you to save the first three lines of a
				log.
			</PlaygroundNote>
			<LessonActivity title="Read the Manual First" scenarioId="help-lookup" id="help-lookup" />

			<VibeBox
				prompts={[
					'Explain this command flag by flag: ls -laht',
					'What does man 5 crontab mean - why the number in the middle?'
				]}
			/>
		</div>
	</div>
</section>
