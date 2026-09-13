<script lang="ts">
	import { base } from '$app/paths';
	import { Bot, Gamepad2, ArrowRight } from 'lucide-svelte';
	import FirstCommand from '../playground/FirstCommand.svelte';
	import KeyboardWorkshop from '../playground/KeyboardWorkshop.svelte';
	import Code from '../ui/Code.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import CourseMap from '../ui/CourseMap.svelte';

	let {
		onOpenPlayground,
		onOpenAgent
	}: {
		onOpenPlayground?: () => void;
		onOpenAgent?: () => void;
	} = $props();
</script>

<section id="hero" class="hero">
	<div class="opening">
		<p class="eyebrow">TerminalVibes · learn by doing</p>
		<h1>Your first command.<br />Right here.</h1>
		<p class="welcome">
			A terminal is a place to give your computer written instructions. Let’s try one. No install,
			account, or experience needed.
		</p>
		<div class="opening-grid">
			<FirstCommand />
			<figure class="opening-art">
				<img
					src="{base}/images/Hero.webp"
					alt="TerminalVibes: an illustrated garden of terminal tools, with a hermit crab guide."
					width="2560"
					height="1440"
					fetchpriority="high"
				/>
				<figcaption>A small instruction. A visible result. We’ll build from there.</figcaption>
			</figure>
		</div>
	</div>

	<div class="workshop-wrap">
		<KeyboardWorkshop />
	</div>

	<div class="intro-reference">
		<div class="continue-row">
			<div>
				<p class="eyebrow">Keep going</p>
				<h2>Small skills, useful things.</h2>
				<p>
					Next, get comfortable reading a reply and asking for help. Then we’ll find folders, make a
					notebook, and work with your files.
				</p>
			</div>
			<a class="continue" href="#part-1">Continue to Part 1 <ArrowRight size={17} /></a>
		</div>

		<p class="optional-label">
			Curious about the words and the tools? Open any of these. You can come back later.
		</p>

		<details id="section-intro-what">
			<summary>What are the terminal and the shell?</summary>
			<div class="detail-content">
				<p>
					The <strong>terminal</strong> is the window you type in. The <strong>shell</strong> is the program
					that reads your command and arranges for it to run.
				</p>
				<p>
					You just used <Code code="echo" /> to print a message. Later, a command might list files, search
					a notebook, or start a program. Some commands print a reply. Others change something without
					printing text; we’ll learn how to check what happened.
				</p>
				<div
					class="flow"
					aria-label="You type a command, the shell runs it, and the terminal shows the result"
				>
					<span>You type<br /><strong>A command</strong></span><span aria-hidden="true">→</span
					><span>The shell runs it<br /><strong>An action</strong></span><span aria-hidden="true"
						>→</span
					><span>You see<br /><strong>The result</strong></span>
				</div>
				<p>
					<strong>Bash</strong> and <strong>zsh</strong> are two common shells. They share many commands,
					but some rules and shortcuts differ. This site’s practice terminals simulate part of Bash. They
					don’t run programs on your computer.
				</p>
				<p>
					You may also hear <strong>command line</strong>, meaning this way of working by typing
					instructions, or <strong>CLI</strong>, short for command-line interface. You do not need
					to memorize the labels to keep going.
				</p>
				<ExpandableImage
					src="{base}/images/what-is-terminal.webp"
					alt="An illustrated view of the terminal window and the shell that reads commands."
					caption="The window, the program inside it, and the words you type have different jobs."
				/>
			</div>
		</details>

		<details id="section-intro-anatomy">
			<summary>What is a prompt? Which text do I type?</summary>
			<div class="detail-content">
				<p>
					The <strong>prompt</strong> marks the place where you can type your next command. In the
					practice terminal, it is the small arrow beside the input. Your own terminal may show your
					name, a folder, and a symbol such as <Code code="$" /> or <Code code="%" />.
				</p>
				<p>
					The prompt is already there. You do not type or copy it. In this course, command examples
					and results are labeled separately:
				</p>
				<CommandTranscript command="echo &quot;Hello, world!&quot;" output="Hello, world!" />
				<p>
					The Copy button copies only the command in this example. The text beneath it is the result
					to look for, not another instruction.
				</p>
				<div
					id="prompt-loop"
					class="flow"
					aria-label="The command loop: type, run, read the result, try again"
				>
					<span>Type</span><span aria-hidden="true">→</span><span>Press Enter</span><span
						aria-hidden="true">→</span
					><span>Read the result</span><span aria-hidden="true">→</span><span>Try again</span>
				</div>
				<p>
					A <Code code="#" /> inside a shell example can introduce a <strong>comment</strong>: a
					note for the reader that the shell ignores. It does not mean “the computer’s reply.” We
					will introduce other symbols when you need them.
				</p>
			</div>
		</details>

		<details id="section-intro-shells">
			<summary>Can I use the terminal on my own computer?</summary>
			<div class="detail-content">
				<p>
					Yes. You can also complete the first lessons entirely in this browser. When you want to
					try a real terminal, <a href="#section-1-1">Part 1 walks through opening yours</a>.
				</p>
				<p>
					<strong>On a Mac,</strong> Terminal is already in Applications → Utilities. It usually
					starts zsh. <strong>On Linux,</strong> look for Terminal in your application menu; the shell
					depends on your setup.
				</p>
				<p>
					<strong>On Windows,</strong> this course’s commands need a Bash environment such as WSL or Git
					Bash. Windows Terminal is the window; its PowerShell tab uses a different command language.
					You can postpone setup and keep practising here.
				</p>
				<p>
					The browser playground is a learning model, not a complete operating system. Commands such
					as package installs and network requests use simulated data here. Later lessons identify
					the steps to repeat on your own computer.
				</p>
			</div>
		</details>

		<details id="section-intro-history">
			<summary>Why do people still type commands?</summary>
			<div class="detail-content">
				<p>
					A written instruction can be repeated, changed, shared, or connected to another
					instruction. That is useful when you need to rename many files, find one line in a large
					log, or repeat a task tomorrow.
				</p>
				<p>
					Modern shells grew out of Unix, developed at Bell Labs starting in 1969. People connected
					small programs so that the result from one became the input to the next. You will try this
					idea yourself when we reach <a href="#part-4">pipes</a>.
				</p>
				<p>
					You do not have to replace your everyday apps. Use the terminal when it makes a task
					easier. The aim is to gain another useful way to work.
				</p>
				<ExpandableImage
					src="{base}/images/terminal-history.webp"
					alt="An illustrated timeline showing how text terminals and shells developed."
					caption="The tools changed, but small, repeatable instructions remain useful."
				/>
			</div>
		</details>

		<div class="companions">
			<button type="button" onclick={onOpenPlayground}
				><Gamepad2 size={17} /><span
					><strong>Open practice terminal</strong><small>Experiment with simulated files.</small
					></span
				></button
			>
			<button type="button" onclick={onOpenAgent}
				><Bot size={17} /><span
					><strong>Ask the course helper</strong><small>Get a hint or a smaller explanation.</small
					></span
				></button
			>
		</div>
		<details>
			<summary>Explore the course map</summary>
			<div class="detail-content"><CourseMap /></div>
		</details>
	</div>
</section>

<style>
	.hero {
		padding: 2rem 1.5rem 1rem;
	}
	.opening,
	.workshop-wrap,
	.intro-reference {
		max-width: 1040px;
		margin: 0 auto;
	}
	.eyebrow {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.09em;
		text-transform: uppercase;
		color: var(--color-primary-text);
	}
	h1 {
		font-family: var(--font-heading);
		color: var(--color-text);
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		line-height: 1.07;
		margin: 0.65rem 0 0.85rem;
	}
	.welcome {
		max-width: 610px;
		font-size: 1rem;
		color: var(--color-text-secondary);
		line-height: 1.65;
		margin-bottom: 1.3rem;
	}
	.opening-grid {
		display: grid;
		grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr);
		gap: 1.3rem;
		align-items: start;
	}
	.opening-art {
		margin: 0;
	}
	.opening-art img {
		display: block;
		width: 100%;
		height: auto;
		aspect-ratio: 16 / 9;
		object-fit: contain;
		border-radius: 1rem;
	}
	figcaption {
		font-size: 0.75rem;
		color: var(--color-text-muted);
		line-height: 1.5;
		margin-top: 0.65rem;
	}
	.workshop-wrap {
		margin-top: 3rem;
	}
	.intro-reference {
		padding-top: 2rem;
	}
	.continue-row {
		display: flex;
		align-items: center;
		gap: 1.5rem;
		justify-content: space-between;
		padding: 1.5rem 0;
	}
	h2 {
		font: 650 1.5rem/1.3 var(--font-heading);
		color: var(--color-text);
		margin: 0.4rem 0 0.6rem;
	}
	p {
		color: var(--color-text-secondary);
		font-size: 0.93rem;
		line-height: 1.75;
	}
	.continue-row p:not(.eyebrow) {
		max-width: 600px;
	}
	.continue {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.5rem;
		flex-shrink: 0;
		border-radius: 0.65rem;
		padding: 0.85rem 1rem;
		background: var(--color-primary);
		color: var(--color-bg);
		font-size: 0.85rem;
		font-weight: 700;
	}
	.optional-label {
		margin: 1rem 0;
		font-size: 0.8rem;
		color: var(--color-text-muted);
	}
	details {
		border-top: 1px solid var(--color-border);
		scroll-margin-top: 90px;
	}
	summary {
		cursor: pointer;
		font-size: 0.93rem;
		font-weight: 600;
		padding: 1rem 0.15rem;
		color: var(--color-text);
	}
	.detail-content {
		padding: 0 0.15rem 1.2rem;
		max-width: 850px;
	}
	.detail-content p {
		margin-bottom: 0.9rem;
	}
	a:not(.continue) {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.flow {
		display: flex;
		flex-wrap: wrap;
		gap: 0.7rem;
		align-items: center;
		justify-content: space-between;
		padding: 1.2rem;
		border-radius: 0.7rem;
		background: var(--color-bg-tertiary);
		margin: 1rem 0;
		color: var(--color-text-secondary);
		font-size: 0.8rem;
	}
	.flow strong {
		color: var(--color-text);
	}
	.companions {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 0.8rem;
		margin: 1.5rem 0;
	}
	.companions button {
		display: flex;
		align-items: center;
		gap: 0.8rem;
		padding: 1rem;
		border: 1px solid var(--color-border);
		border-radius: 0.65rem;
		color: var(--color-primary-text);
		text-align: left;
		cursor: pointer;
	}
	.companions strong {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
	}
	.companions small {
		display: block;
		margin-top: 0.2rem;
		color: var(--color-text-muted);
		font-size: 0.75rem;
	}
	@media (max-width: 700px) {
		.hero {
			padding: 1.25rem 1rem 1rem;
		}
		.opening-grid {
			grid-template-columns: 1fr;
		}
		.opening-art {
			max-width: 520px;
		}
		.opening-art img {
			max-height: 240px;
		}
		.welcome {
			font-size: 0.9rem;
			margin-bottom: 1rem;
		}
		.continue-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 1rem;
		}
		.companions {
			grid-template-columns: 1fr;
		}
	}
</style>
