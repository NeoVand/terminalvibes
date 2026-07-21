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
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
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
				— hold Command and tap Space — to open Spotlight, the macOS search bar. Type
				<strong style="color: var(--color-text);">Terminal</strong>, press Enter. That's it. (The
				long way: Applications&nbsp;→ Utilities&nbsp;→ Terminal.app.) The stock app is a genuinely
				good place to start — since macOS 26 "Tahoe" it has true color and modern themes, so there's
				nothing to install today. Pin it to your Dock while it's running (right-click its icon →
				Options → Keep in Dock) — you'll be back.
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
				Start with a question the machine can't get wrong — who are you? In every code block from
				here on, the first line is what you type and the <Code code="#" /> lines are the machine's reply
				(<CourseLink to="hero" /> has the full legend).
			</p>

			<CodeBlock
				title="Ask who you are"
				code={`whoami
# vibe`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The shell answered with your username. Now make it say something — <Code code="echo" /> repeats
				whatever you give it, and the quotes hold the two words together as one message instead of two
				separate ones (<CourseLink to="section-2-2" /> has the rule):
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
# The screen empties - the text is still there, just scrolled out of sight`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The screen went blank but nothing was deleted: that's the terminal's <strong
					style="color: var(--color-text);">scrollback</strong
				>, and scrolling up brings every answer back. The shell also keeps its own record of the
				commands you typed (<CourseLink to="section-12-2" />) — a separate list, and
				<Code code="clear" /> leaves that alone too.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Now the important experiment: type something wrong <em>on purpose</em>. Misspell a command
				and press Enter:
			</p>

			<CodeBlock
				title="Break it (you can't)"
				code={`ecoh "hello"
# bash: ecoh: command not found`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Read that reply back like a sentence in three parts: <Code code="bash" /> is who's complaining
				— the shell, not your command — <Code code="ecoh" /> is the word it choked on, and
				<Code code="command not found" /> is the complaint. Every error you meet from here on has that
				shape; only the complainer changes.
			</p>

			<Callout type="tip" title="Errors are feedback, not failure">
				Nothing broke. The shell didn't recognise the word, said so, and gave you a fresh prompt.
				Error messages in the terminal are answers. Typos cost you nothing but a retry (press the
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
					'What does the echo command do, and where would I actually use it?',
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
					caption="Every command carries its own manual — you're never more than a man page away from an answer"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You've met a command you don't understand — maybe one your AI
				assistant just proposed — and you need to know what it does <em>before</em> you run it.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two ways in, and you'll use both. <Code code="--help" /> prints a compact summary of what a command
				does and which flags it accepts, straight to your terminal.
				<Code code="man" /> opens the full manual. Which one answers you depends a little on your machine
				— we'll get to that — but between them, nothing stays a mystery for long.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Flags first, because that summary is mostly a list of them. A command line is a sentence.
				The first word is the program. Everything after it is either a
				<strong style="color: var(--color-text);">flag</strong> — a request to behave differently —
				or an <strong style="color: var(--color-text);">argument</strong>, the thing to act on. The
				shell tells them apart by one character: a leading dash. <Code code="ls -a" /> means "run
				<Code code="ls" />, and switch on the <Code code="a" /> behaviour". <Code code="ls a" /> means
				"run
				<Code code="ls" /> on something called <Code code="a" />", which is a different question
				entirely and usually an error. That dash is doing real work; it is not decoration.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The shell chops your line at the spaces and hands over the pieces one at a time, which is
				why a filename with a space in it needs quoting. Four rules cover almost everything else
				you'll meet:
			</p>

			<ul
				class="mb-4 space-y-2 pl-5 text-[14px] leading-relaxed"
				style="color: var(--color-text-secondary);"
			>
				<li class="list-disc">
					<strong style="color: var(--color-text);">One dash, one letter.</strong>
					<Code code="-a" />, <Code code="-l" />. Short, fast, and what you type day to day.
				</li>
				<li class="list-disc">
					<strong style="color: var(--color-text);">Two dashes, a whole word.</strong>
					<Code code="--all" />, <Code code="--help" />, <Code code="--version" />. Longer to type,
					far easier to read six months later in a script.
				</li>
				<li class="list-disc">
					<strong style="color: var(--color-text);"
						>A comma joins two spellings of the same flag.</strong
					>
					When help output or a manual page prints <Code code="-a, --all" />, that is <em>one</em> flag
					with two names. Use either. Never both.
				</li>
				<li class="list-disc">
					<strong style="color: var(--color-text);">Single letters cluster.</strong>
					<Code code="ls -la" /> is <Code code="ls -a -l" /> written faster; add a
					<Code code="t" /> — <Code code="ls -lat" /> — and you've asked for them sorted newest first
					as well. Only single letters cluster this way; <Code code="--all --long" /> doesn't squash into
					anything.
				</li>
			</ul>

			<Callout type="important" title="A flag letter belongs to its command, not to the terminal">
				Every command decides for itself what its own flag letters mean. There is no master list,
				and the shell never consults one — so the same letter means different things depending on
				the word in front of it. <Code code="-r" /> means <em>recursive</em> to <Code code="cp" /> but
				<em>reversed</em> to <Code code="sort" />. <Code code="-i" /> means
				<em>ask me first</em> to <Code code="rm" /> but <em>edit the file in place, no undo</em> to
				<Code code="sed" />. Capitals are separate flags again — <Code code="-r" /> and
				<Code code="-R" /> are two different requests. So "look it up" is a skill rather than an admission:
				the only thing that settles what a letter means here is <Code code="--help" /> or
				<Code code="man" /> for <em>this</em> command.
			</Callout>

			<CodeBlock
				title="The quick summary — on Linux, WSL and Git Bash"
				code={`ls --help
# Usage: ls [OPTION]... [FILE]...
# List information about the FILEs (the current directory by default).
#   -a, --all        do not ignore entries starting with .
#   -l               use a long listing format
# ...`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That <Code code="Usage:" /> line has a shorthand of its own: square brackets mean optional, ALL-CAPS
				words are placeholders you swap for your own, and a trailing <Code code="..." />
				means "as many of these as you like". <Code code="OPTION" /> is the older word for a flag and
				you'll see both, often on the same page. So <Code code="ls [OPTION]... [FILE]..." /> reads: any
				number of flags, then any number of files, none of it required. Nothing in brackets is ever typed
				literally.
			</p>

			<h4 class="mt-5 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				On a Mac, that same command is an error — and that's fine
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Mac and Linux carry two different lineages of the same veteran tools.
				<span class="inline-flex items-center gap-1"><OsIcon os="macos" size={13} /> macOS</span>
				ships BSD's versions;
				<span class="inline-flex items-center gap-1"><OsIcon os="linux" size={13} /> Linux</span> —
				and WSL and Git Bash with it — ships GNU's. GNU tools nearly all answer to
				<Code code="--help" />. Most of the BSD ones have never heard of it, and say so:
			</p>

			<CodeBlock
				title="The same command on macOS"
				code={`ls --help
# ls: unrecognized option \`--help'
# usage: ls [-@ABCFGHILOPRSTUWXabcdefghiklmnopqrstuvwxy1%,] [--color=when] [file ...]`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Same three parts as <Code code="ecoh" /> earlier, and the same reassurance: nothing broke, and
				you weren't punished for trying. Here the complainer is <Code code="ls" /> rather than the shell
				— it names the one thing it didn't understand, then prints its usage line anyway — so you still
				got the flag list, just terser and stripped of the descriptions. That's the shape of most terminal
				errors. Read the words; they usually say precisely what tripped them up.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="ls" />, <Code code="du" />, <Code code="head" />, <Code code="cut" />,
				<Code code="wc" />, <Code code="stat" /> and <Code code="date" /> all behave this way on a Mac.
				So does <Code code="grep" />, which quietly prints its usage line without even calling it an
				error. The tools you install yourself later —
				<Code code="curl" />, <Code code="git" />, <Code code="tar" />, <Code code="jq" />,
				<Code code="brew" /> — take <Code code="--help" /> everywhere, Macs included. For everything else
				on a Mac, the answer is the manual.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				This course uses angle brackets for the same job — when you see <Code
					code="man <command>"
				/>, you type <Code code="man ls" />, never the brackets. That matters more in a shell than
				elsewhere: <Code code="<" /> is a real operator in its own right, so typing the brackets produces
				an error that points nowhere near your mistake.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				For the full story — and, on a Mac, for most of the built-in commands — there's <Code
					code="man"
				/> — the manual, installed with your system since before the web existed. It comes in numbered
				sections, because one name can mean two things:
				<Code code="crontab" /> is both a command you run and a file format that command reads, so
				<Code code="man 1 crontab" /> and <Code code="man 5 crontab" /> are two different pages. Section
				1 is commands, section 5 is file formats. Leave the number off and you get the first match, which
				is nearly always the one you meant:
			</p>

			<CodeBlock
				title="The full manual"
				code={`man ls
# Opens the complete manual page for ls

man -k download
# wget(1) - The non-interactive network downloader.
# ...`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The second is for when you don't know the command's name yet. <Code code="-k" /> is for
				<em>keyword</em>: it searches every manual page's one-line description and prints each match
				with its section number in brackets. Your machine will list many more than this one.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Worth knowing where that search stops, though, because it will bite you. It reads only that
				one-line description, not the page. <Code code="curl" /> downloads files for a living, and
				<Code code="man -k download" /> does not find it — its description reads
				<em>transfer a URL</em>, and the word "download" appears nowhere in it. So a
				<Code code="-k" /> search that comes back thin means your keyword didn't match anyone's phrasing,
				not that no such command exists. Try a synonym before you conclude anything.
			</p>

			<Callout type="important" title="Press q to quit">
				<Code code="man" />
				opens in a <em>pager</em> — a full-screen reader that takes over your terminal, and the one
				you'll get is <Code code="less" /> (<CourseLink to="section-2-5" />). Scroll with the arrow
				keys or Space, search by typing <Code code="/word" /> and pressing Enter, and press
				<Code code="q" /> to get your prompt back. Everyone gets "stuck" in a pager once — now you won't.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Man pages are thorough but dense. For a friendlier take, the community-written <strong
					style="color: var(--color-text);">tldr pages</strong
				>
				— <em>too long; didn't read</em> — show each command as a handful of practical examples.
				<Code code="tldr" /> doesn't come with your system, though: it's a third-party command you install
				first (<CourseLink to="section-10-1" />). Nothing to install to read it, happily — the web
				version is at
				<a
					href="https://tldr.inbrowser.app"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline underline-offset-2"
					style="color: var(--color-primary);">tldr.inbrowser.app</a
				>, which is where the output below comes from.
			</p>

			<CodeBlock
				title="`tldr`: examples first"
				code={`tldr tar
# tar
#   Archiving utility.
#   - Create an archive from files:
#     tar cf target.tar file1 file2 file3
#   - Extract an archive to the current directory:
#     tar xf source.tar
# ...`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Those <Code code="cf" /> and <Code code="xf" /> look like they've lost their dash, and they haven't:
				<Code code="tar" /> is old enough to accept its letters bare, so <Code code="tar cf" /> and
				<Code code="tar -cf" /> are the same command. It's one of the few commands in this course that
				gets away with it — assume the dash everywhere else.
			</p>

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

			<Callout type="tip" title="Ask the AI, verify with the manual">
				Let the assistant explain the command in plain English, then skim the man page (or <Code
					code="--help"
				/>, where it works) to confirm the flags do what it claimed. Explanation from the AI,
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
				<Code code="man head" />, then use what it taught you to save the first three lines of a log
				file — the running record a program writes as it works (<CourseLink to="section-4-3" />).
			</PlaygroundNote>
			<LessonActivity title="Read the Manual First" scenarioId="help-lookup" id="help-lookup" />

			<VibeBox
				prompts={[
					'Explain this command flag by flag: ls -laht',
					'What is crontab, and why does man 5 crontab show something different from man 1 crontab?'
				]}
			/>
		</div>

		<ChallengeActivity title="Look It Up First" part={1} id="ch-1-read-the-flags" />
	</div>
</section>
