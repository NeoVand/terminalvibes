<script lang="ts">
	import { Cpu, ListTree, Ban, Anchor, Layers } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-8" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Cpu}
			partLabel="Part 8"
			title="Processes &amp; Ports: When Things Won't Stop"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"Port 3000 is already in use." — every web developer, weekly
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			Until now every command you ran started, did its job, and finished. But some programs are
			meant to <em>keep going</em>: dev servers, watchers, builds — and your AI agent starts them
			constantly. This part is about the programs that are still running: how to see them, how to
			stop them, and how to fix the single most common error in modern web development, when
			yesterday's server is still squatting on the port today's server needs.
		</p>

		<Callout type="important">
			This is the part that turns "I'll just restart my laptop" into a ten-second fix. Every
			technique here is the same three-beat move: <strong
				>find the process, get its number, act on that number</strong
			>.
		</Callout>

		<!-- 8.1 Everything Is a Process -->
		<div id="section-8-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={ListTree}
				title="8.1 Everything Is a Process"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every running program on your machine — the dev server, your editor, the shell you're typing
				into, the agent itself — is a <strong style="color: var(--color-text);">process</strong>,
				and every process has a number: its <strong style="color: var(--color-text);">PID</strong>.
				That number is the handle you use to do anything to it. <Code code="ps" /> lists them:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/everything-is-a-process.webp"
					alt="A glass apiary of process cells, each with its PID and command nameplate"
					caption="Every running program is a row with a number"
				/>
			</div>

			<CodeBlock
				title="Reading the census"
				code={`ps aux
USER       PID %CPU %MEM START   COMMAND
vibe      1024  0.0  0.1 09:10   bash
vibe       400  0.4  1.8 08:41   node server.js
vibe       437 97.4  0.6 09:07   spinner.sh --forever`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Three columns matter. <Code code="PID" /> is the number you'll pass to
				<Code code="kill" />. <Code code="%CPU" /> is how hard it's working — a runaway sits near 100
				and your fans tell you before <Code code="ps" /> does. <Code code="COMMAND" /> is what it actually
				is. Notice <Code code="bash" /> in that list: the shell you're typing into is just another process,
				no more special than the rest.
			</p>

			<Callout type="tip">
				<strong>ps output is just text</strong> — which means Part 4 and Part 7 already taught you
				how to search it. <Code code="ps aux | grep node" /> finds a process by name, and
				<Code code={`awk '{print $2}'`} /> pulls the PID column out of the result. This is why the column-shaped
				output of old Unix tools is worth putting up with: every tool composes. There's a shortcut for
				the common case too — <Code code="pgrep node" /> prints matching PIDs directly.
			</Callout>

			<VibeBox
				prompts={[
					"What's using all my CPU right now? Show me how to check, and explain the columns",
					'Find the process id of my running dev server without me having to read the whole ps output'
				]}
			/>
		</div>

		<!-- 8.2 Stopping Things -->
		<div id="section-8-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Ban}
				title="8.2 Stopping Things — Ask Nicely, Then Insist"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="kill" /> has a violent name and a polite default. Plain
				<Code code="kill PID" /> sends <strong style="color: var(--color-text);">SIGTERM</strong> — a
				signal that means "please finish up and stop." The program gets to react: save its work, close
				its files, remove its lock, and exit cleanly. It's a letter, not a bullet.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/stopping-things.webp"
					alt="A green-wax SIGTERM letter on a brass scale beside a red-wax SIGKILL envelope under glass"
					caption="SIGTERM asks. SIGKILL removes the floor. Ask first."
				/>
			</div>

			<CodeBlock
				title="The escalation, in order"
				code={`kill 437                 # SIGTERM — "please stop when you can"
(no response — spinner.sh --forever is still running)

kill -9 437              # SIGKILL — the floor opens, no cleanup
[killed] spinner.sh --forever (PID 437)`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A program can <em>catch</em> SIGTERM and decide to ignore it — that's a feature, not a bug:
				it's how servers finish serving the request they're mid-way through instead of dropping it.
				But it also means a polite kill can bounce. <Code code="kill -9" /> sends
				<strong style="color: var(--color-text);">SIGKILL</strong>, which no program can catch,
				refuse, or prepare for. The kernel simply removes it. Nothing gets saved, no cleanup runs,
				and any lock files it was holding stay behind.
			</p>

			<Callout type="caution">
				<strong><Code code="kill -9" /> is a last resort, not a default.</strong> Plenty of guides
				(and plenty of AI answers) reach for it first because it always works. It always works the
				way an axe always opens a door. Ask nicely, give it a second, and escalate only if it
				refuses — and add <Code code="kill -9" /> to your Part 6 red-flag list when an agent proposes
				it without trying the polite version first.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One thing you already knew, renamed: <Code code="Ctrl+C" /> is a signal too —
				<strong style="color: var(--color-text);">SIGINT</strong>, "interrupt" — sent to whatever is
				running in the foreground. That's why it stops a stuck command but does nothing to a server
				running in another window; that one needs its PID. Part 12 opens up the machinery underneath
				all three signals.
			</p>

			<VibeBox
				prompts={[
					'A process is ignoring kill — walk me through what to try, in order, and what each step costs',
					'What actually happens to unsaved work when I use kill -9 versus a plain kill?'
				]}
			/>
			<h4
				id="runaway-process"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Stop the Runaway
			</h4>
			<PlaygroundNote>
				Your fans are screaming. Find the process burning 97% of a core with <Code code="ps aux" />,
				try <Code code="kill" /> first and read what happens — then escalate. Leave the innocent server
				running.
			</PlaygroundNote>
			<LessonActivity title="Stop the Runaway" scenarioId="runaway-process" id="runaway-process" />
		</div>

		<!-- 8.3 Who's on Port 3000 -->
		<div id="section-8-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Anchor}
				title="8.3 Who's on Port 3000?"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A <strong style="color: var(--color-text);">port</strong> is a numbered door on your
				machine. A server opens one and waits there for visitors; your browser knocks on it when you
				visit <Code code="localhost:3000" />. The rule that generates all the pain is simple:
				<strong style="color: var(--color-text);">one program per port</strong>. Try to open a door
				someone's already standing in and you get the error:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/port-3000.webp"
					alt="A night harbor: one steamship moored at pier 3000, a second boat flying an EADDRINUSE flag"
					caption="One ship per pier — that's the whole rule"
				/>
			</div>

			<CodeBlock
				title="The error, and the fix"
				code={`serve
Error: listen EADDRINUSE: address already in use :::3000

lsof -i :3000            # who's holding the door?
COMMAND    PID  USER   TYPE NODE NAME
node       400  vibe   IPv4 TCP  *:3000 (LISTEN)

kill 400                 # ask yesterday's server to leave
serve                    # the pier is free
serve: listening on http://localhost:3000`}
			/>

			<MermaidDiagram
				definition={`flowchart LR
  A["EADDRINUSE"] --> B["lsof -i :3000"]
  B -->|"PID"| C["kill PID"]
  C --> D(["start yours"])`}
				id="port-ritual"
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Memorize that four-beat ritual — read the error, find the PID, stop the squatter, start
				yours — and one of the most common blockers in web development becomes routine.
				<Code code="lsof" /> stands for "list open files"; the <Code code="-i" /> flag narrows it to network
				connections. Silence from <Code code="lsof" /> means the port is free.
			</p>

			<Callout type="tip">
				Where do stale servers come from? Usually a terminal window you closed without stopping the
				server, or an agent that started one in a background shell you never saw. When a port is
				mysteriously busy right after an AI session, that's the first suspect — and
				<Code code="lsof -i :3000" /> tells you its name.
			</Callout>

			<VibeBox
				prompts={[
					'My dev server says EADDRINUSE on port 5173 — give me the exact commands to find and stop what is holding it',
					'How do I start my app on a different port instead of killing what is already there?'
				]}
			/>
			<h4
				id="free-the-port"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Free Port 3000
			</h4>
			<PlaygroundNote>
				Yesterday's server never died. Run <Code code="serve" /> to meet the error, then work the ritual:
				<Code code="lsof -i :3000" /> for the PID, <Code code="kill" /> it, and start your own.
			</PlaygroundNote>
			<LessonActivity title="Free Port 3000" scenarioId="free-the-port" id="free-the-port" />
		</div>

		<!-- 8.4 Background & Foreground -->
		<div id="section-8-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={Layers}
				title="8.4 Background &amp; Foreground"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A dev server holds your terminal hostage: it runs until you stop it, and the prompt never
				comes back. One answer is more terminals (Part 11's tabs and splits). The other is
				<strong style="color: var(--color-text);">job control</strong> — telling this shell to keep
				the program running <em>backstage</em> while you get your prompt back.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/background-jobs.webp"
					alt="A theater stage: one process in the spotlight, two working backstage behind the curtain"
					caption="& sends it backstage · jobs lists it · fg brings it into the spotlight"
				/>
			</div>

			<CodeBlock
				title="Backstage and back"
				code={`./slowbuild.sh &         # & = start it, give me my prompt back
[1] 400                  # job number, then PID

jobs                     # who's backstage?
[1]  Running    ./slowbuild.sh

fg %1                    # bring job 1 into the spotlight`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two numbers appear here and they're easy to confuse: the
				<strong style="color: var(--color-text);">job number</strong> in <Code code="[1]" /> is small
				and belongs to <em>this shell</em> — you use it as <Code code="%1" />. The
				<strong style="color: var(--color-text);">PID</strong> is large and belongs to the whole
				machine. <Code code="kill %1" /> and <Code code="kill 400" /> stop the same program here.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				There's one more move, and it's the rescue you'll actually reach for: you started something
				long, forgot the <Code code="&" />, and now you're stuck watching it.
				<Code code="Ctrl+Z" /> pauses it and hands your prompt back; <Code code="bg" /> resumes it backstage.
				Same place you'd have been with <Code code="&" />, arrived at the hard way.
			</p>

			<Callout type="tip">
				<strong>Honest advice: use tabs.</strong> Job control is a genuinely useful escape hatch —
				and mostly a rescue for the terminal you're already in. For an everyday setup (server in one
				pane, logs in another, a free shell for you), the split terminals in Part 11 are nicer to
				live with than juggling <Code code="%1" /> and <Code code="%2" />.
			</Callout>

			<VibeBox
				prompts={[
					'I started a long command and forgot the & — how do I get my prompt back without losing the work?',
					"What's the difference between a job number and a PID, and when does each one matter?"
				]}
			/>
			<h4
				id="backstage-jobs"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Two Things at Once
			</h4>
			<PlaygroundNote>
				Send the slow build backstage with <Code code="&" />, confirm it's there with
				<Code code="jobs" />, then bring it forward with <Code code="fg %1" /> and check what it left
				behind.
			</PlaygroundNote>
			<LessonActivity title="Two Things at Once" scenarioId="backstage-jobs" id="backstage-jobs" />

			<p class="mt-10 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You can now see what's running, stop it politely or firmly, and free a port that's been
				taken hostage — the three moves that unstick a machine. Next: the server you just started is
				waiting on port 3000. Time to talk to it.
			</p>
		</div>
	</div>
</section>
