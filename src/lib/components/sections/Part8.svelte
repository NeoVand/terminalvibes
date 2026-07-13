<script lang="ts">
	import { Cog, Sprout, Wrench, AppWindow, Cable, Shell, CookingPot, Zap } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-8" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Cog}
			partLabel="Part 8"
			title="Under the Hood: The Machine You've Been Driving"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"Fifty years of bytes through a pipe — and the machine has never been more alive."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			For seven parts you've driven this machine without once opening the hood. Now you've earned
			the wrench. This part is the victory-lap deep dive: first <em
				>how the terminal actually works</em
			> — ttys, PTYs, escape sequences, and what Ctrl+C really does — and then what that machinery is
			becoming in the AI era, and the genuinely advanced things you can build now that you understand
			it. Nothing here is required to use the terminal. All of it makes you dangerous in the best way.
		</p>

		<!-- 8.1 How the Terminal Works -->
		<div id="section-8-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Wrench}
				title="8.1 How the Terminal Works"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/under-the-hood.webp"
					alt="How the Terminal Works — the machinery behind every prompt"
					caption="Keyboard to PTY to shell to kernel and back — the machinery behind every prompt"
				/>
			</div>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				You've used every piece of this machine for seven parts — typed at prompts, piped bytes,
				interrupted stuck commands, read exit codes. Time to see inside. If you've ever wondered why
				it's called a
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">tty</code
				>, why arrow keys sometimes print
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">^[[A</code
				>
				instead of moving, or what Ctrl+C <em>actually</em> does, this is where those mysteries get solved.
				It's deliberately the most technical section of the course — and it repays the effort with a working
				mental model of the machine you've been driving all along.
			</p>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				In the beginning, the terminal was furniture. A <strong style="color: var(--color-text);"
					>teletypewriter</strong
				>
				— a keyboard fused to a printer — sat at the end of a serial cable, and the computer at the other
				end typed its replies onto rolling paper. Unix, born in that world, abbreviated the device to
				<strong style="color: var(--color-text);">tty</strong>, and the abbreviation outlived the
				hardware by half a century. The paper is gone, the cables are gone, but every terminal
				window on your machine still checks in with the kernel as a tty device — ask it yourself:
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
					<p
						class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<AppWindow size={14} style="color: var(--color-primary);" />
						Terminal emulator
					</p>
					<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
						The app you actually open — Terminal.app, iTerm2, Windows Terminal. It draws a grid of
						character cells, turns your keystrokes into bytes, and paints the bytes that come back.
						It
						<em>emulates</em> the old hardware — hence the name.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Cable size={14} style="color: var(--color-primary);" />
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
					<p
						class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Shell size={14} style="color: var(--color-primary);" />
						The shell
					</p>
					<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
						Just a process. bash reads bytes from the slave end and writes bytes back — it can't
						tell whether a human, a 1970s teletype, or an AI agent sits on the other side. That
						indifference is why the same shell works everywhere.
					</p>
				</div>
			</div>

			<MermaidDiagram
				definition={`flowchart TD
  A(["Terminal emulator"]) <-->|"bytes"| B(["PTY master"])
  B <-->|"line discipline"| C(["PTY slave"])
  C <-->|"read / write"| D(["Shell"])
  D -->|"fork + exec"| E(["Your command"])
  E -->|"output"| C`}
				id="under-the-hood-chain"
			/>
			<p class="mt-2 mb-6 px-1 text-xs" style="color: var(--color-text-muted);">
				Keystrokes travel down the chain, output travels back up — and every hop is plain bytes.
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
					<p
						class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<CookingPot size={14} style="color: var(--color-primary);" />
						Cooked mode (canonical)
					</p>
					<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
						The default. The kernel buffers your keystrokes, handles Backspace itself, and delivers
						nothing until you press Enter — then the program receives one finished line. This is why
						the shell never sees your typos: you edit the line before it exists.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1.5 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<Zap size={14} style="color: var(--color-primary);" />
						Raw mode
					</p>
					<p class="text-xs leading-relaxed" style="color: var(--color-text-secondary);">
						Every keystroke is delivered immediately, unedited. Programs that react key by key —
						<code
							class="rounded px-1 py-0.5 text-[11px]"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">vim</code
						>,
						<code
							class="rounded px-1 py-0.5 text-[11px]"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">less</code
						>, the arrow-key line editor inside bash itself — switch the terminal into raw mode
						while they run, and back on exit. (A crash that skips the "back" is how terminals end up
						garbled —
						<code
							class="rounded px-1 py-0.5 text-[11px]"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">reset</code
						> fixes it.)
					</p>
				</div>
			</div>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				That split personality explains a small mystery. Arrow keys don't send a character — there
				is no "up" letter — they send a short byte sequence beginning with the Escape character: up
				arrow is
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
				<strong style="color: var(--color-text);">in-band</strong>, mixed right into the text: byte
				27 (<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ESC</code
				>, written
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">\e</code
				>) announces "the next few bytes are instructions, not text", and the emulator obeys them
				instead of printing them. The vocabulary was standardized around DEC's VT100 terminal in
				1978 — your gleaming modern emulator is still, at heart, impersonating it. Watch it obey:
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
				One last piece of magic to demystify: <strong style="color: var(--color-text);"
					>Ctrl+C</strong
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
					The <strong style="color: var(--color-text);">line discipline</strong> recognizes the end of
					a line, converts it to a newline, and releases the whole buffered line to the slave end.
				</li>
				<li class="list-decimal">
					The <strong style="color: var(--color-text);">shell</strong>, which has been blocked
					reading the slave, wakes up holding
					<code
						class="rounded px-1.5 py-0.5 text-xs"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
					> and parses it — expanding any $VARIABLES, ~, and globs first.
				</li>
				<li class="list-decimal">
					It <strong style="color: var(--color-text);">forks</strong> a copy of itself and
					<strong style="color: var(--color-text);">execs</strong> ls inside the copy, with the copy's
					input and output still wired to the same tty.
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
					ls exits; the shell collects its exit code (the <code
						class="rounded px-1.5 py-0.5 text-xs"
						style="background: var(--color-code-bg); font-family: var(--font-mono);">$?</code
					> you met in Part 6) and prints a fresh prompt. Your turn.
				</li>
			</ol>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				That's the entire machine: an app impersonating 1970s furniture, a kernel pipe in costume, a
				tiny in-kernel line editor, and a shell that just reads and writes bytes. From here on,
				nothing the terminal does will look like magic — you now know more about it than most people
				who use it professionally.
			</p>

			<p class="text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				And here's the part the museum plaque leaves out: the byte protocol didn't stop evolving in
				1978. Modern terminals are still quietly minting new escape sequences — <strong
					style="color: var(--color-text);">OSC 8</strong
				>
				makes text in a terminal a real clickable hyperlink, and a family of
				<strong style="color: var(--color-text);">shell-integration markers</strong> lets the shell whisper
				structure into the byte stream itself. That second one turns out to be the quiet foundation of
				the whole AI-terminal era — and it's exactly where we're headed next.
			</p>
		</div>

		<!-- 8.2 The Terminal, Evolving -->
		<div id="section-8-2" class="mb-8">
			<SectionHeader
				level="section"
				icon={Sprout}
				title="8.2 The Terminal, Evolving"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/terminal-evolving.webp"
					alt="The Terminal, Evolving — fifty years old and just getting started"
					caption="Fifty years old — and just getting started: new protocols, agent-aware terminals, and intelligence in the pipeline"
				/>
			</div>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Knowing how the machine works is satisfying. Knowing what people are <em
					>building on it right now</em
				> is useful — because the terminal is in the middle of its biggest growth spurt since the VT100,
				and everything driving it is a payoff of something you just learned. This section is the tour:
				the invisible protocol that lets editors and agents read the terminal, the new generation of terminals
				built around agents, and the advanced automation you can write yourself now that pipes, signals,
				and exit codes are yours.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The shell and the terminal are talking behind your back
			</h4>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Remember the trick from 8.1 — instructions traveling <em>in-band</em>, mixed into the text?
				Modern shells and terminals use the same trick to talk
				<em>about the conversation itself</em>. A standard called
				<strong style="color: var(--color-text);">OSC 133</strong>
				(born in the FinalTerm terminal, now adopted almost everywhere) has the shell emit invisible escape
				sequences that mark the seams of every command: <em>here the prompt starts</em>,
				<em>here the command starts</em>, <em>here the output begins</em>,
				<em>here it ended — with this exit code</em>. VS Code's terminal adds its own richer
				dialect,
				<strong style="color: var(--color-text);">OSC 633</strong>, which also carries the command
				line itself. You never see any of it — the emulator swallows the markers like it swallows
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">\e[32m</code
				> — but the byte stream is now structured:
			</p>

			<MermaidDiagram
				definition={`flowchart TD
  A(["133;A · prompt starts"]) --> B(["133;B · command starts"])
  B -->|"you press Enter"| C(["133;C · output begins"])
  C --> D(["command output"])
  D --> E(["133;D;0 · exit code"])
  classDef success stroke:#67b177,stroke-width:2px;
  class E success;`}
				id="osc-markers"
			/>
			<p class="mt-2 mb-6 px-1 text-xs" style="color: var(--color-text-muted);">
				Invisible bookmarks in the byte stream: every command arrives pre-labeled with where it
				began, what it was, and how it went.
			</p>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Those bookmarks are why VS Code's integrated terminal (the one from 7.3) can paint a little
				<strong style="color: var(--color-text);">success or failure dot</strong> next to every
				command you run, let you jump between commands with a keystroke, and pin the running command
				to the top of the panel while output scrolls. And they matter double in the AI era: an agent
				watching a terminal through OSC markers doesn't have to <em>guess</em> where your prompt ends
				and the output begins, or grep the scrollback for the word "error" — it knows the exact command,
				the exact output, and the exact exit code, machine-readably. The read-before-you-run contract
				from Part 6 works in both directions now: you can read what the agent runs, and the agent can
				reliably read what happened.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The terminals being built around agents
			</h4>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				In 7.1 you picked a window to live in. Step back and you can see the whole landscape
				splitting in two. On one side, the classic emulators keep competing on speed and standards:
				<strong style="color: var(--color-text);">Ghostty</strong> 1.3 (March 2026) restructured
				itself so its entire terminal core is a reusable library,
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">libghostty</code
				>
				— the machinery of 8.1, packaged for any app that wants to embed a real terminal. On the other
				side, a new generation is being designed <em>around</em> agents:
				<strong style="color: var(--color-text);">Warp</strong> now calls itself an "agentic
				development environment" and open-sourced its core (dual MIT/AGPL) — its pitch is
				orchestrating whole fleets of local and cloud agents from one window, the 7.4 split-pane
				fleet promoted to a first-class product. And
				<strong style="color: var(--color-text);">cmux</strong> builds terminal panes that agents
				can drive <em>programmatically</em>, through a Unix socket — panes as an API, not just a
				view.
			</p>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Here's the through-line, and it's the whole reason 8.1 was worth your time: every one of
				these — the speed demons, the agent fleets, the socket-driven panes — still speaks the same
				protocol. Bytes through a PTY, escape sequences in-band, signals from the line discipline. A
				fifty-year-old interface turned out to be so simple, so universal, and so
				automation-friendly that when AI agents needed a body, they moved into the terminal. The
				machinery didn't get replaced by the AI era; it got <em>adopted</em> by it.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The agent is a shell command now
			</h4>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				The adoption runs deeper than windows and panes. Headless agent CLIs make the agent itself a
				<strong style="color: var(--color-text);">composable Unix tool</strong>: run
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">claude -p</code
				>
				("print mode") and the agent reads stdin, writes stdout, and sets an exit code — the exact contract
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">grep</code
				>
				and
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">sort</code
				> have honored since 1973. Which means everything you learned in Part 4 and Part 5 applies, unchanged,
				to intelligence itself:
			</p>

			<CodeBlock
				title="An AI agent in a pipeline — Part 4 rules apply"
				code={`# Pipe a diff in, get a review out — stdin to stdout, like any tool
git diff main | claude -p "review this diff; list issues as filename:line"

# JSON output makes it pipeline-friendly: hand it to jq like anything else
git log --oneline -20 \\
  | claude -p "summarize this week's work in one paragraph" --output-format json \\
  | jq -r '.result'`}
			/>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Read that first line again with Part 4 eyes: a program's output flowing through <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">|</code
				>
				into another program's input. The second program just happens to be a language model. It sorts
				into pipelines, redirects into files, chains with
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">&amp;&amp;</code
				>, and reports success through
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$?</code
				> — the Unix philosophy, now with a very well-read tool in the toolbox.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Writing scripts that deserve the word "automation"
			</h4>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				And that unlocks the last upgrade: scripts that orchestrate agents need to be sturdier than
				the five-liners from 6.2, and you finally know enough to write the grown-up kind. Every
				robust bash script starts with the same three lines of armor — each one cashing in a lesson
				from this part:
			</p>

			<CodeBlock
				title="The grown-up script preamble"
				code={`#!/usr/bin/env bash
set -euo pipefail
# -e  stop at the first failing command (no barreling on after an error)
# -u  treat unset variables as errors (catches $TYPO before it deletes ~)
# -o pipefail  a pipeline fails if ANY stage fails, not just the last

scratch=$(mktemp -d)             # private scratch dir, unique every run
cleanup() { rm -rf "$scratch"; }
trap cleanup EXIT INT            # runs on normal exit AND on Ctrl+C`}
			/>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				That <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">trap</code
				>
				line is 8.1's SIGINT lesson cashed in: Ctrl+C sends a signal, signals can be caught, and
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">trap</code
				>
				is how a script catches one — so your temp files get cleaned up even when you interrupt it mid-run.
				Put the armor on a real job and you get something like this: a script that runs an agent review
				over every file you've changed and collects the results —
			</p>

			<CodeBlock
				title="review-changes.sh — an agent over every changed file"
				code={`#!/usr/bin/env bash
set -euo pipefail

scratch=$(mktemp -d)
cleanup() { rm -rf "$scratch"; }
trap cleanup EXIT INT

git diff --name-only main > "$scratch/changed.txt"

while read -r file; do
  echo "reviewing $file ..."
  claude -p "review this file; list issues as line: problem" \\
    < "$file" > "$scratch/$(basename "$file").review"
done < "$scratch/changed.txt"

cat "$scratch"/*.review > review-report.txt
echo "done: $(wc -l < "$scratch/changed.txt") files reviewed -> review-report.txt"`}
			/>

			<p class="mb-4 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Count the course in that script: redirection and pipes (Part 4), a loop feeding on a file
				(the <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">while read</code
				>
				pattern — each line of
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">changed.txt</code
				>
				lands in
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$file</code
				>), scripting and variables (Part 6), signals and cleanup (this part), and an AI agent doing
				the reading — supervised by a script <em>you</em> can read line by line. If it fails
				halfway,
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">set -e</code
				>
				stops it; if you Ctrl+C it, the trap tidies up. This is what "advanced automation" actually looks
				like: not longer commands — stronger habits.
			</p>

			<VibeBox
				prompts={[
					'Write me a bash script that runs claude -p over every file changed since main and collects the output into one report — with set -euo pipefail and a cleanup trap',
					'Take my deploy script and harden it: strict mode, a trap that cleans up temp files on Ctrl+C, and mktemp instead of fixed /tmp paths — explain each change'
				]}
			/>

			<Callout type="tip">
				<strong>Take stock of where you're standing.</strong> You can narrate a keystroke's journey
				through the kernel, read the invisible protocol your terminal speaks to your editor, pipe a
				language model like it's <code style="font-family: var(--font-mono);">grep</code>, and write
				scripts that clean up after themselves when signals fly. That's a deeper understanding of
				the terminal than most working professionals carry — and the tour is nearly over. One part
				to go: the send-off.
			</Callout>
		</div>
	</div>
</section>
