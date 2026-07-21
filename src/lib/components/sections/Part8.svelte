<script lang="ts">
	import { Cpu, ListTree, Ban, Anchor, Layers } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
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
				into, the agent itself — is a <strong style="color: var(--color-text);">process</strong>:
				one copy of some code, loaded into memory and kept alive by the operating system. Open three
				terminal windows and you have three shell processes, each with its own idea of where it's
				standing. Each one gets a <strong style="color: var(--color-text);">PID</strong> — short for process
				ID — the moment it starts, a number unique on this machine for as long as it lives. That number
				is the handle you use to do anything to it.
			</p>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="ps" /> on its own lists only the processes attached to <em>this</em> terminal —
				usually two or three, and never the dev server you're hunting. Add
				<Code code="aux" /> and you get the whole machine:
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
				The three letters earn their place: <Code code="a" /> widens the list to every user's processes,
				<Code code="u" /> adds the human-readable columns you're about to read, and
				<Code code="x" /> includes the ones with no terminal attached — which is precisely where background
				servers hide. (They carry no dash: <Code code="ps" /> takes its options in an older style that
				predates the convention, the same reason <Code code="tar cf" /> works without one.) Your real
				output is wider than this too — macOS and Linux both add memory sizes, a terminal name and a state
				column. Ignore those; the ones that matter are here.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="USER" /> is the account that owns the process — <Code code="vibe" /> is you, which
				is why you can stop your own dev server and get <Code code="Operation not permitted" /> on one
				of the system's. <Code code="PID" /> is the number you'll pass to <Code code="kill" />.
				<Code code="%CPU" /> is how hard it's working, measured against <em>one</em>
				<strong style="color: var(--color-text);">core</strong>, and your machine has several:
				separate workers that genuinely run at the same time, so a process using three of them
				honestly reads 340%. A runaway of yours sits near 100, and your fans tell you before <Code
					code="ps"
				/> does.
				<Code code="%MEM" /> is the share of the machine's memory it's holding, the column to check when
				everything goes sluggish rather than hot.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="START" /> is the wall-clock time it launched, the one column that separates the server
				you started a minute ago from yesterday's, still running. <Code code="COMMAND" /> is what it actually
				is — though that's the <em>interpreter's</em> name, not your project's: a JavaScript server
				shows up as <Code code="node" />, a Python one as <Code code="python" />, and that's what
				you grep for. Notice <Code code="bash" /> in that list too: the shell you're typing into is just
				another process, no more special than the rest.
			</p>

			<Callout type="tip">
				<strong>ps output is just text</strong> — which means <CourseLink to="part-4" /> and <CourseLink
					to="part-7"
				/> already taught you how to search it. <Code code="ps aux | grep node" /> finds a process by
				name, and
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
				<Code code="kill PID" /> sends <strong style="color: var(--color-text);">SIGTERM</strong> —
				a
				<strong style="color: var(--color-text);">signal</strong>, which is a short fixed message
				the operating system delivers to a running process from outside, nothing to do with whatever
				the program normally reads. They come in a small vocabulary and all share a prefix: SIG for
				signal, then what it asks for, so SIGTERM is "terminate" — please finish up and stop. The
				program gets to react: save its work, close its files, remove its lock, and exit cleanly.
				It's a letter, not a bullet.
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
				code={`kill 437                 # SIGTERM, signal 15 — "please stop when you can"
(no response — spinner.sh --forever is still running)

kill -9 437              # SIGKILL, signal 9 — the floor opens, no cleanup
[killed] spinner.sh --forever (PID 437)`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The <Code code="9" /> is a signal number, not a count: every signal has one,
				<Code code="kill -N" /> means "send signal N", and a bare <Code code="kill" /> is
				<Code code="kill -15" />. That's how you read <Code code="kill -HUP" /> or
				<Code code="kill -2" /> in an agent's command — same verb, different message.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A program can <em>catch</em> SIGTERM and decide to ignore it — that's a feature, not a bug:
				it's how servers finish serving the request they're mid-way through instead of dropping it.
				But it also means a polite kill can bounce. <Code code="kill -9" /> sends
				<strong style="color: var(--color-text);">SIGKILL</strong>, which no program can catch,
				refuse, or prepare for. The <strong style="color: var(--color-text);">kernel</strong> — the
				core of the operating system, the part that owns the hardware and creates every process,
				including your shell — simply removes it. Nothing gets saved and no cleanup runs, so any
				<strong style="color: var(--color-text);">lock file</strong> it was holding stays behind: the
				marker a program leaves to say "I'm already running". The next copy finds it, believes it, and
				refuses to start.
			</p>

			<Callout type="caution">
				<strong><Code code="kill -9" /> is a last resort, not a default.</strong> Plenty of guides
				(and plenty of AI answers) reach for it first because it always works. It always works the
				way an axe always opens a door. Ask nicely, give it a second, and escalate only if it
				refuses — and treat <Code code="kill -9" /> as a red flag when an agent reaches for it without
				trying the polite version first — one more entry for the audit routine in <CourseLink
					to="part-11"
				/>.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One thing you already knew, renamed: <Code code="Ctrl+C" /> is a signal too —
				<strong style="color: var(--color-text);">SIGINT</strong>, "interrupt" — sent to whatever is
				running in the <strong style="color: var(--color-text);">foreground</strong> — the process
				attached to this terminal right now, the one your keystrokes reach and the reason your
				prompt hasn't come back. That's why it stops a stuck command but does nothing to a server
				running in another window; that one needs its PID. <CourseLink to="section-13-1" /> opens up the
				machinery underneath all three signals.
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
				visit <Code code="localhost:3000" /> — <Code code="localhost" /> being your machine's name for
				itself (<CourseLink to="section-9-1" />). The numbers themselves are convention rather than
				law: 3000 and 5173 are what particular tools happen to pick, and everything here works the
				same for 8080.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				The rule that generates all the pain is simple:
				<strong style="color: var(--color-text);">one program per port</strong>. Try to open a door
				someone's already standing in — here with <Code code="serve" />, a tiny dev server you
				install with npm, playing the part of whatever starts your project — and you meet the error:
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
				That's the same three beats from the start of this part, with the error that sent you
				looking at the front and your own server at the end: read the error, find the PID, stop the
				squatter, start yours. Memorize it and one of the most common blockers in web development
				becomes routine.
				<Code code="lsof" /> stands for "list open files"; the <Code code="-i" /> flag narrows it to network
				connections. Silence from <Code code="lsof" /> means the port is free.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That one output line is worth reading properly. <Code code="node" /> is the program and
				<Code code="400" /> is its PID — the only field you actually need. The rest describes the connection
				it's holding, and a real <Code code="lsof" /> prints a few more of those columns than you see
				here. <Code code="IPv4 TCP" /> says what kind of connection it is;
				<Code code="*:3000" /> is the door number with a wildcard host, where <Code code="*" /> means
				"any address on this machine" rather than the filename glob from <CourseLink
					to="section-3-4"
				/> — and the <Code code=":::3000" /> in the error above is that same wildcard, spelled the IPv6
				way.
				<Code code="(LISTEN)" /> is the confirmation: that process is sitting at the door waiting for
				visitors, which is exactly why yours can't have it.
			</p>

			<Callout type="tip">
				Where do stale servers come from? Usually an agent that started one in a
				<strong>background shell</strong> — a whole separate session you never saw, which is not the
				same thing as the background <em>jobs</em> in 8.4 below. When a port is mysteriously busy
				right after an AI session, that's the first suspect — and
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
				comes back. One answer is more terminals (the tabs and splits in <CourseLink
					to="section-12-4"
				/>). The other is
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
				A <strong style="color: var(--color-text);">background job</strong> is still yours and still tied
				to this shell: close the window and it goes with it, unless you take extra steps. Backstage is
				not the same as somewhere safe — don't send a long build back there and then walk away from the
				terminal.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				There's one more move, and it's the rescue you'll actually reach for: you started something
				long, forgot the <Code code="&" />, and now you're stuck watching it.
				<Code code="Ctrl+Z" /> <em>suspends</em> it and hands your prompt back — suspended meaning
				stopped dead, making no progress at all, which is why <Code code="jobs" /> reports it as
				<Code code="Stopped" /> rather than <Code code="Running" />. <Code code="bg" /> is what resumes
				it, backstage: the place you'd have been with <Code code="&" />, arrived at the hard way.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Four ampersands, no relation. <Code code="2>&1" /> is a reference to a stream (<CourseLink
					to="section-4-1"
				/>). <Code code="&&" /> runs the next thing only if this one worked (<CourseLink
					to="section-6-2"
				/>). <Code code="&" /> inside a <Code code="sed" /> replacement means whatever was just matched
				(<CourseLink to="section-7-1" />). And a bare <Code code="&" /> at the end of a line is the one
				this section is about — reading <Code code="npm run build &" /> as a half-typed
				<Code code="&&" /> is a mistake worth not making.
			</p>

			<Callout type="tip">
				<strong>Honest advice: use tabs.</strong> Job control is a genuinely useful escape hatch —
				and mostly a rescue for the terminal you're already in. For an everyday setup (server in one
				pane, logs in another, a free shell for you), the split terminals in <CourseLink
					to="section-12-4"
				/> are nicer to live with than juggling <Code code="%1" /> and <Code code="%2" />.
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

		<ChallengeActivity title="Clear the Agent&#39;s Processes" part={8} id="ch-8-agent-cleanup" />
	</div>
</section>
