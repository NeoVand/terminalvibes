<script lang="ts">
	import { Scissors, Replace, PenLine, Columns3 } from 'lucide-svelte';
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

<section id="part-7" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Scissors}
			partLabel="Part 7"
			title="Text Surgery: Find, Change, Extract"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"grep asks: which lines? sed answers: make them different."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			Part 4 taught you to <em>find</em> text — grep it, count it, sort it. This part teaches you to
			<em>change</em> it. <Code code="sed" /> is the single most common file-mutating command AI agents
			propose — "let me just update that config" is almost always a sed one-liner — and
			<Code code="awk" /> is how you pull one column out of anything shaped like a table. Learn to read
			these two and a huge class of agent-suggested commands stops being line noise.
		</p>

		<Callout type="important">
			The idea that makes sed safe to learn: <strong>it edits the stream, not the file</strong>.
			Like every Part 4 tool, sed reads text, transforms it, and prints the result — the input file
			is untouched unless you explicitly say otherwise (that's 7.3, and it has a safety rule). You
			can experiment freely: the original survives every mistake.
		</Callout>

		<!-- 7.1 Find & Replace -->
		<div id="section-7-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Replace}
				title="7.1 Find &amp; Replace — the s Command"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every editor has find-and-replace. sed is find-and-replace <em>unplugged from the editor</em
				>
				— it works on anything that flows: files, pipes, command output. One tiny script does it all,
				and it reads like a sentence once you know the grammar:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/find-replace.webp"
					alt="sed 's/mango/kiwi/g' — the substitute command anatomy, stamped onto a stream of text"
					caption="s/old/new/g — substitute, find this, replace with this, every match on the line"
				/>
			</div>

			<CodeBlock
				title="Your first substitution"
				code={`cat menu.txt
mango smoothie — mango, ice, lime

sed 's/mango/kiwi/' menu.txt      # replace the FIRST match on each line
kiwi smoothie — mango, ice, lime

sed 's/mango/kiwi/g' menu.txt     # g = every match on the line
kiwi smoothie — kiwi, ice, lime`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Read <Code code="s/mango/kiwi/g" /> in four beats: <Code code="s" /> means
				<strong style="color: var(--color-text);">substitute</strong>; <Code code="mango" /> is
				<strong style="color: var(--color-text);">find this</strong>; <Code code="kiwi" /> is
				<strong style="color: var(--color-text);">replace with this</strong>; <Code code="g" /> means
				<strong style="color: var(--color-text);">every match on the line</strong>, not just the
				first. Two more pieces complete the grammar: <Code code="I" /> ignores case, and the slashes are
				just delimiters — any character works, which saves you from escaping paths:
			</p>

			<CodeBlock
				title="Delimiters are your choice; & echoes the match"
				code={`sed 's|/usr/local|/opt|' paths.txt     # | instead of / — no escaping
sed 's/error/[&]/I' app.log            # & = whatever matched; I = any case
[ERROR] payment timeout                # "error", "Error", "ERROR" all wrapped`}
			/>

			<Callout type="tip">
				<strong>Preview to the screen, then redirect.</strong> The same habit as echo-the-glob from
				Part 3: run the sed command bare and read its output. Happy? Add
				<Code code="> new-file.txt" /> and run it again. Because sed doesn't touch the input file, the
				preview is always free.
			</Callout>

			<VibeBox
				prompts={[
					'Write me a sed one-liner that replaces every "staging" with "production" in deploy.txt — preview only, no file changes',
					"Explain what sed 's|http://|https://|g' does, character by character"
				]}
			/>
			<h4
				id="sed-rename"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Rebrand the Menu
			</h4>
			<PlaygroundNote>
				Marketing renamed the mango everything. Rewrite <Code code="menu.txt" /> with
				<Code code="s/mango/kiwi/g" /> into <Code code="kiwi-menu.txt" /> — and notice the original survives
				untouched. Line 1 has two mangos: you'll need <Code code="g" />.
			</PlaygroundNote>
			<LessonActivity title="Rebrand the Menu" scenarioId="sed-rename" id="sed-rename" />
		</div>

		<!-- 7.2 Line Surgery -->
		<div id="section-7-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Scissors}
				title="7.2 Line Surgery — Addresses, d and p"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Substitution is only one of sed's commands. Picture your file as a film strip: every line
				passes through sed, one frame at a time, and a
				<strong style="color: var(--color-text);">command decides its fate</strong> — keep, drop, or
				print. An <strong style="color: var(--color-text);">address</strong> in front of the command selects
				which frames it applies to:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/line-surgery.webp"
					alt="sed as an editor's light table — cutting DEBUG frames out of a film strip of log lines"
					caption="Every line passes through; addresses pick the frames, commands decide their fate"
				/>
			</div>

			<CodeBlock
				title="d drops lines; addresses choose them"
				code={`sed '/DEBUG/d' app.log        # drop every line matching DEBUG
sed '3d' notes.txt            # drop line 3
sed '2,5d' notes.txt          # drop lines 2 through 5
sed '$d' notes.txt            # drop the last line`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The mirror image of dropping is <strong style="color: var(--color-text);"
					>printing only what you ask for</strong
				>. That's the <Code code="p" /> command paired with
				<Code code="-n" />, which silences sed's default echo. It's the precision tool for "show me
				lines 40 through 55 of that huge log" — no pager, no scrolling:
			</p>

			<CodeBlock
				title="-n + p — print only the selection"
				code={`sed -n '40,55p' server.log     # just lines 40–55
sed -n '/ERROR/p' server.log   # only ERROR lines (like grep!)
sed -n '/start/,/stop/p' run.log   # from a /start/ match to a /stop/ match`}
			/>

			<MermaidDiagram
				definition={`flowchart LR
  A[("app.log")] --> B{"address match?"}
  B -->|"/DEBUG/"| C["d — dropped"]
  B -->|"everything else"| D(["printed on through"])`}
				id="sed-line-flow"
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Addresses compose with <em>any</em> command — <Code code="'2s/beta/B/'" /> substitutes on line
				2 only, <Code code="'/alpha/s/a/A/'" /> substitutes only on lines matching alpha. One grammar,
				every combination. That's the Unix philosophy again, folded inside a single tool.
			</p>

			<VibeBox
				prompts={[
					'Show me lines 100 to 120 of build.log without opening an editor',
					'Write a sed command that strips every blank comment line starting with # from config.txt — preview first'
				]}
			/>
			<h4
				id="log-surgery"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Silence the Debug Noise
			</h4>
			<PlaygroundNote>
				<Code code="app.log" /> is drowning in DEBUG chatter. Drop those lines with
				<Code code="'/DEBUG/d'" /> and save the readable story as <Code code="clean.log" /> — the original
				stays intact for the postmortem.
			</PlaygroundNote>
			<LessonActivity title="Silence the Debug Noise" scenarioId="log-surgery" id="log-surgery" />
		</div>

		<!-- 7.3 Editing in Place -->
		<div id="section-7-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={PenLine}
				title="7.3 Editing in Place — the -i Footgun and the .bak Rule"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Everything so far printed to the screen or a new file. But the command agents actually
				propose is usually <Code code="sed -i" /> —
				<strong style="color: var(--color-text);">edit the file in place</strong>. Same
				substitution, except now it rewrites the real file, silently, with no preview and no undo.
				This is the one sed flag that deserves the Part 6 treatment.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/edit-in-place.webp"
					alt="sed -i.bak rewriting config.yml while a copy slides into a drawer labeled .bak"
					caption="-i rewrites the real file — .bak keeps the original in the drawer"
				/>
			</div>

			<Callout type="caution">
				<strong><Code code="sed -i" /> with no backup is a red-flag pattern.</strong> Add it to your
				Part 6 audit list next to <Code code="rm -rf" /> and <Code code="curl | bash" />. But unlike
				those, the fix isn't refusing — it's <em>amending</em>: one suffix turns the risky command
				into a safe one.
			</Callout>

			<CodeBlock
				title="The house rule: -i.bak"
				code={`sed -i.bak 's/http:/https:/g' config.yml
                    # config.yml      — rewritten
                    # config.yml.bak  — the original, untouched

cat config.yml.bak  # your diff, your undo button
mv config.yml.bak config.yml   # instant rollback if it went wrong`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The suffix goes <em>directly</em> after the flag — <Code code="-i.bak" />, no space — and
				sed saves each original as <Code code="file.bak" /> before rewriting. It costs nothing, it works
				on many files at once (<Code code="sed -i.bak 's/…/…/' *.yml" /> backs up every one), and it converts
				"I hope that was right" into "let me check the diff." When an agent proposes a bare <Code
					code="-i"
				/>, don't approve or reject —
				<strong style="color: var(--color-text);">edit the command and add the .bak</strong>.
				Supervising means improving, not just gatekeeping.
			</p>

			<VibeBox
				prompts={[
					"You proposed sed -i without a backup — rewrite that command with -i.bak and tell me how I'd undo it",
					'Mass-rename a function across all .py files here, with backups, and show me how to verify the change afterwards'
				]}
			/>
			<h4
				id="in-place-audit"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: The Agent's Mass Edit
			</h4>
			<PlaygroundNote>
				The agent's plan switches the site to https — good idea, but its
				<Code code="sed -i" /> keeps no backup. Read <Code code="agent-plan.txt" />, amend the
				command to <Code code="-i.bak" />, run it on both config files, then open a
				<Code code=".bak" /> to admire your safety net.
			</PlaygroundNote>
			<LessonActivity
				title="The Agent's Mass Edit"
				scenarioId="in-place-audit"
				id="in-place-audit"
			/>
		</div>

		<!-- 7.4 Columns & awk -->
		<div id="section-7-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={Columns3}
				title="7.4 Columns &amp; awk — Pull the Field You Need"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A lot of terminal output is secretly a table: log lines, CSV exports, process listings.
				<Code code="awk" /> splits every line into numbered
				<strong style="color: var(--color-text);">fields</strong>
				and prints the ones you name — <Code code="$1" /> is the first column, <Code code="$2" /> the
				second, <Code code="$0" /> the whole line:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/columns-awk.webp"
					alt="awk print-field-two — a loom pulling the second column of threads out of a glowing table"
					caption="Tables are just text — awk pulls the column you ask for"
				/>
			</div>

			<CodeBlock
				title="Fields, separators, guards"
				code={`awk '{print $2}' table.txt          # second column (splits on spaces)
awk -F, '{print $1, $3}' data.csv    # -F, = split on commas; comma joins with a space
awk '/error/ {print $1}' app.log     # /pattern/ runs the action on matching lines only`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You already know <Code code="cut" /> from Part 4 — so which one? Honest answer:
				<Code code="cut" /> for clean single-character delimiters (CSV, colon-separated), <Code
					code="awk"
				/> when the spacing is <em>ragged</em>. awk's default split treats any run of spaces as one
				separator, which is exactly what column-aligned output needs — cut would see every space as
				its own empty field and hand you garbage. Later in the course, when you meet process
				listings, awk is the tool that reads them.
			</p>

			<Callout type="tip">
				Real awk is an entire programming language — BEGIN blocks, variables, printf. What you've
				just learned is the <strong>field-printing dialect</strong>, and it covers the vast majority
				of awk you'll ever see an agent propose. When one shows up wearing more syntax than this,
				that's not a reading failure — that's your cue to ask the agent to explain it line by line.
			</Callout>

			<VibeBox
				prompts={[
					'This CSV has columns name,email,plan — give me just the emails, using awk and using cut, and tell me when each tool is the better pick',
					"Explain this command an agent suggested: awk '/FAIL/ {print $3}' test-output.log"
				]}
			/>
			<h4
				id="column-pull"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Pull the Column
			</h4>
			<PlaygroundNote>
				<Code code="signups.csv" /> has three columns; the launch email needs one. Pull the email column
				with <Code code="awk -F," /> or <Code code="cut -d," /> — your choice — and save it as <Code
					code="emails.txt"
				/>.
			</PlaygroundNote>
			<LessonActivity title="Pull the Column" scenarioId="column-pull" id="column-pull" />

			<p class="mt-10 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Your text toolbox is complete: <Code code="grep" /> finds, <Code code="sed" /> changes,
				<Code code="awk" /> extracts — and pipes chain them into anything. Every one of them previews
				to the screen before it touches a file, which means every one of them rewards the habit this course
				keeps drilling: <strong style="color: var(--color-text);">read first, run second</strong>.
			</p>
		</div>
	</div>
</section>
