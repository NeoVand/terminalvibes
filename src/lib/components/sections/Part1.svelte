<script lang="ts">
	import { Terminal, Monitor, Sparkles, HelpCircle } from 'lucide-svelte';
	import { base, resolve } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
</script>

<section id="part-1" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Terminal}
			partLabel="Part 1"
			title="First Contact"
			color="var(--color-primary)"
		/>
		<p class="lead">
			You can already make the terminal say something. Now let’s get comfortable with the
			conversation: give an instruction, read the reply, and ask for help when you need it.
		</p>
		<p>
			If you landed here first, <a href="{resolve('/')}#hero">try the opening command</a>. The
			<a href="{resolve('/')}#keyboard-workshop">keyboard workshop</a> shows how to move around a line,
			remove a word, and start again without retyping everything.
		</p>

		<div id="section-1-1" class="lesson-section">
			<SectionHeader
				level="section"
				icon={Monitor}
				title="1.1 Opening Your Terminal"
				color="var(--color-primary)"
			/>
			<p>
				You can do this lesson in the practice terminal below. When you are ready to repeat it on
				your own computer, choose your system here. On a phone or tablet, keep using the browser
				practice.
			</p>
			<details>
				<summary>macOS: open the Terminal app</summary>
				<div class="detail-content">
					<ol>
						<li>Hold <kbd>Command</kbd> and tap <kbd>Space</kbd> to open Spotlight.</li>
						<li>Type <strong>Terminal</strong>, then press <kbd>Enter</kbd>.</li>
						<li>
							A window opens with some text and a cursor. Click in it and try the same <Code
								code="echo"
							/> command you used here.
						</li>
					</ol>
					<p>
						You can also find Terminal in Applications → Utilities. It usually opens a shell called
						zsh. These first commands work in both zsh and Bash; we’ll point out differences where
						they matter.
					</p>
				</div>
			</details>
			<details>
				<summary>Linux: find Terminal in your apps</summary>
				<div class="detail-content">
					<p>
						Open your application menu and search for <strong>Terminal</strong> or
						<strong>Console</strong>. On many desktops, <kbd>Ctrl+Alt+T</kbd> opens it directly.
						Click in the window and try your <Code code="echo" /> command.
					</p>
				</div>
			</details>
			<details>
				<summary>Windows: choose a Bash terminal</summary>
				<div class="detail-content">
					<p>
						<strong>Already have Ubuntu or another WSL distribution?</strong> Open it from Start, or
						choose it from Windows Terminal’s tab menu. If you installed Git for Windows instead,
						open <strong>Git Bash</strong> from Start.
					</p>
					<p>
						<strong>Neither installed?</strong> You can keep learning in this browser and do setup
						later. WSL adds a Linux environment to Windows. The
						<a
							href="https://learn.microsoft.com/en-us/windows/wsl/install"
							target="_blank"
							rel="noopener noreferrer">official WSL installation guide</a
						> explains the requirements, installation, restart, and first-time username setup.
					</p>
					<p>
						The usual installation command is below. It is a one-time setup step in <strong
							>PowerShell opened as administrator</strong
						>, not a command to practise in our sandbox:
					</p>
					<CodeBlock
						title="Optional Windows setup · PowerShell as administrator"
						code="wsl --install"
					/>
					<p>
						After setup, open the Linux terminal for the rest of this course. PowerShell and Command
						Prompt are useful shells too, but their commands follow different rules.
					</p>
				</div>
			</details>
			<p class="small-note">
				A real terminal works with real files. The embedded practice terminals use their own
				simulated files. Keep track of which window you are using; this lesson’s commands only ask
				questions or print text.
			</p>
		</div>

		<div id="section-1-2" class="lesson-section">
			<SectionHeader
				level="section"
				icon={Sparkles}
				title="1.2 Your First Commands"
				color="var(--color-primary)"
			/>
			<p>
				Type one command at a time. Press <kbd>Enter</kbd> to run it, then read what appeared. The
				line where you type is called the <strong>prompt</strong>. A new prompt means the shell is
				ready for another instruction.
			</p>
			<p>Start with a message you choose. Change the words between the quotes:</p>
			<CommandTranscript
				command="echo &quot;My garden notebook&quot;"
				output="My garden notebook"
			/>
			<p>
				<Code code="echo" /> prints text. The message above is the computer’s reply to the command, so
				you do not type that second line yourself.
			</p>

			<div class="command-pair">
				<div>
					<h4>Ask for your username</h4>
					<CodeBlock code="whoami" title="You type" />
					<p>
						It prints the name of the account running the command. Here that name is <Code
							code="vibe"
						/>. On your computer it may be different.
					</p>
				</div>
				<div>
					<h4>Ask for the date and time</h4>
					<CodeBlock code="date" title="You type" />
					<p>
						It prints a date and time. The format and time zone depend on the computer, so your
						result need not match someone else’s.
					</p>
				</div>
			</div>

			<p>
				One more question will matter throughout the course: <strong>where am I working?</strong>
				Type <Code code="pwd" />. It prints your current folder’s location. In this sandbox it
				begins as <Code code="/home/vibe" />. <CourseLink to="part-2" /> will make that location concrete
				with a folder map.
			</p>
			<h4 id="first-steps">Try it: a short conversation</h4>
			<p>
				Try a message, your username, the time, and your location below. You can change the
				examples. The file tree is a picture of this practice terminal’s files; you do not need to
				use it yet.
			</p>
			<LessonActivity title="Say Hello to the Machine" scenarioId="first-steps" id="first-steps" />

			<h4>A typo is something you can repair</h4>
			<CommandTranscript
				command="ecoh &quot;hello&quot;"
				output="bash: ecoh: command not found"
				error
			/>
			<p>
				This message names <Code code="ecoh" /> because the shell could not find a command with that spelling.
				It did not run <Code code="echo" />. Press <kbd>↑</kbd> to recall the line, fix the
				spelling, and press <kbd>Enter</kbd> again.
			</p>
			<p>
				If you want to abandon a line before running it, press <kbd>Ctrl+C</kbd>. If the screen is
				crowded, run <Code code="clear" />. Clearing the display does not delete your files or your
				command history. How much older output remains available depends on the terminal.
			</p>
			<ExpandableImage
				src="{base}/images/first-commands.webp"
				alt="A hermit crab asks small questions at a terminal and sees their replies."
				caption="Type one instruction. Read its result. Then decide what to do next."
			/>
		</div>

		<div id="section-1-3" class="lesson-section">
			<SectionHeader
				level="section"
				icon={HelpCircle}
				title="1.3 Getting Help"
				color="var(--color-primary)"
			/>
			<p>
				You do not need to memorize every command. A useful skill is finding just the piece of help
				you need.
			</p>
			<p>
				Imagine a notebook with many lines. You want to see only the beginning. A command named <Code
					code="head"
				/> does that. Before using it, look up its instructions:
			</p>
			<CodeBlock code="man head" title="Open the manual for head" />
			<p>
				<Code code="man" /> is short for manual. Read the description, then look for <Code
					code="-n"
				/>: it chooses how many lines to show. This extra setting is called an
				<strong>option</strong>. We want three lines, so we write <Code code="-n 3" />.
			</p>
			<div
				class="command-anatomy"
				aria-label="head is the command, -n 3 asks for three lines, and garden-notes.txt is the file"
			>
				<div><code>head</code><span>What to do</span></div>
				<div><code>-n 3</code><span>How many lines</span></div>
				<div><code>garden-notes.txt</code><span>Which file</span></div>
			</div>
			<p>
				On your own computer, a manual usually opens in a reader: use the arrow keys to move, then
				press <kbd>q</kbd> to return to your prompt. In this sandbox, the manual prints directly into
				the terminal.
			</p>
			<h4 id="help-lookup">Try it: find one useful option</h4>
			<p>
				The practice terminal has a file called <Code code="garden-notes.txt" /> ready for you. Read <Code
					code="man head"
				/>, then display its first three lines. The file stays unchanged.
			</p>
			<LessonActivity title="Read the Manual First" scenarioId="help-lookup" id="help-lookup" />

			<details>
				<summary>What if a command has no manual?</summary>
				<div class="detail-content">
					<p>
						Many programs accept <Code code="--help" /> to print a shorter guide. It is common, but not
						universal. For example, some versions of <Code code="ls" /> accept it and others do not.
					</p>
					<p>
						Bash also has commands built into the shell. For those, try <Code code="help" /> followed
						by the name, such as <Code code="help cd" />. In zsh, built-in help works differently.
						The course cheatsheet and a program’s official documentation are useful alternatives.
					</p>
					<p>
						In <em>this sandbox</em>, <Code code="help" /> on its own lists the commands it supports.
						If an otherwise valid command is missing here, that is a simulator limitation, not a mistake
						you made.
					</p>
				</div>
			</details>

			<h4>Try looking something up with less help</h4>
			<p>
				The closing practice uses <Code code="ls" />, a command that lists names in a folder. Some
				names begin with a dot and are usually hidden. Read <Code code="man ls" /> to find how to include
				them. You can inspect, read, and retry as often as you need.
			</p>
			<ChallengeActivity title="Look It Up First" part={1} id="ch-1-read-the-flags" />
			<p class="next-lesson">
				You now have a way to try a command, repair a typo, and look up an option. <a
					href="{resolve('/')}#part-2">Next: find your way around folders →</a
				>
			</p>
		</div>
	</div>
</section>

<style>
	.chapter p {
		color: var(--color-text-secondary);
		font-size: 0.93rem;
		line-height: 1.8;
		margin-bottom: 1rem;
	}
	.chapter .lead {
		font-size: 1.04rem;
		color: var(--color-text);
	}
	.lesson-section {
		margin-top: 2.6rem;
		scroll-margin-top: 90px;
	}
	h4 {
		font-size: 1.05rem;
		line-height: 1.5;
		font-weight: 650;
		color: var(--color-text);
		margin: 1.6rem 0 0.7rem;
		scroll-margin-top: 90px;
	}
	.chapter a {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	kbd {
		font: 0.8rem var(--font-mono);
		padding: 0.12rem 0.3rem;
		border-radius: 0.25rem;
		background: var(--color-bg-tertiary);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		white-space: nowrap;
	}
	details {
		border-top: 1px solid var(--color-border);
	}
	summary {
		padding: 0.9rem 0;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
		cursor: pointer;
	}
	.detail-content {
		padding: 0.2rem 0.3rem 0.7rem;
	}
	ol {
		list-style: decimal;
		padding-left: 1.4rem;
		color: var(--color-text-secondary);
		font-size: 0.9rem;
		line-height: 1.8;
		margin-bottom: 1rem;
	}
	li {
		padding-left: 0.15rem;
		margin-bottom: 0.4rem;
	}
	.chapter .small-note {
		font-size: 0.8rem;
		color: var(--color-text-muted);
		margin-top: 1rem;
	}
	.command-pair {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.3rem;
	}
	.command-pair h4 {
		margin-top: 1rem;
	}
	.command-pair p {
		font-size: 0.86rem;
	}
	.command-anatomy {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin: 1.4rem 0;
	}
	.command-anatomy div {
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.6rem;
		padding: 0.8rem 1rem;
	}
	.command-anatomy code {
		display: block;
		font: 0.95rem var(--font-mono);
		color: var(--color-text);
	}
	.command-anatomy span {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	.next-lesson {
		padding: 1.1rem;
		background: var(--color-bg-secondary);
		border-radius: 0.7rem;
	}
	@media (max-width: 600px) {
		.command-pair {
			grid-template-columns: 1fr;
			gap: 0;
		}
	}
</style>
