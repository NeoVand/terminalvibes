<script lang="ts">
	import {
		Workflow,
		MoveRight,
		Search,
		ListOrdered,
		FileSearch,
		CaseSensitive,
		Hash,
		FilterX,
		Sigma,
		FolderTree,
		TextSearch
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-4" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Workflow}
			partLabel="Part 4"
			title="Text &amp; Pipes: How Small Tools Combine"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"Every command speaks plain text. Pipes let them talk to each other."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			So far you've run one command at a time and read its output on screen. Here you'll capture
			output into files, feed one command's output into another, and search, count, and reshape text
			the way experienced people do. This is where the terminal stops feeling like a museum piece:
			once output can move into files and into other commands, small tools multiply — and you'll
			recognize the same style in a lot of AI-suggested one-liners.
		</p>

		<Callout type="important">
			The big idea of this whole part: in the terminal, <strong>everything is text</strong>. Logs,
			file listings, error messages, command output — all plain text. Once you can redirect text and
			pipe text, every small tool you know multiplies every other one.
		</Callout>

		<!-- 4.1 Redirection -->
		<div id="section-4-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={MoveRight}
				title="4.1 Redirection — Point the Output Somewhere Else"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every command writes its results to something called <strong
					style="color: var(--color-text);">standard output</strong
				>
				— which is normally your screen. Redirection says: "don't print that, put it in a file instead."
				One character does it:
				<Code code=">" />.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/redirection.webp"
					alt="Redirection — sending a command's output into a file with > and >>"
					caption="Redirection reroutes a command's output from the screen into a file"
				/>
			</div>

			<CodeBlock
				title="Write, overwrite, append"
				code={`echo "hello" > greeting.txt      # Create the file (or OVERWRITE it!)
cat greeting.txt
hello

echo "hello again" >> greeting.txt   # >> APPENDS to the end
cat greeting.txt
hello
hello again`}
			/>

			<Callout type="caution">
				<strong><Code code=">" /> truncates.</strong>
				The instant you press Enter, the target file is emptied — <em>before</em> the command even
				runs. Redirect into an existing file and its old contents are gone, no confirmation, no
				trash can. When in doubt, use
				<Code code=">>" />
				(append) or redirect to a <em>new</em> filename. And when an AI hands you a command
				containing
				<Code code=">" />, check what's on the right side of the arrow before you run it.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Commands actually have <strong style="color: var(--color-text);">two</strong> output
				streams: standard output for results, and
				<strong style="color: var(--color-text);">standard error</strong>
				for complaints. A plain
				<Code code=">" />
				only captures the results — errors still land on your screen. To capture the errors, redirect
				stream number 2:
			</p>

			<CodeBlock
				title="Capturing errors with `2>`"
				code={`ls reports/ missing/ > listing.txt 2> errors.txt

cat listing.txt      # The successful part
q1-summary.md
q2-summary.md

cat errors.txt       # The complaint went to its own file
ls: missing/: No such file or directory`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You'll also meet <Code code="> all.log 2>&1" />
				in AI-generated commands — it means "send errors to the same place as the output." You don't need
				to write it yet; you just need to recognize it. Finally, the arrow points the other way too:
				<Code code="<" />
				feeds a file <em>into</em> a command as its input, as in
				<Code code="sort < names.txt" />. It's rarer — most commands happily take a filename
				argument — but it completes the picture:
				<strong style="color: var(--color-text);">arrows move text in and out of files</strong>.
			</p>

			<VibeBox
				prompts={[
					'Run the build and save all output — including errors — to build.log so I can read it later',
					"Append today's date and a one-line status to my notes.txt without overwriting what's there"
				]}
			/>
			<h4
				id="capture-errors"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Catch the Red Text
			</h4>
			<PlaygroundNote>
				List one real file and one missing one, then split the streams — the useful listing into
				<Code code="found.txt" />, the scary error into <Code code="errors.txt" /> — with
				<Code code=">" /> and <Code code="2>" />.
			</PlaygroundNote>
			<LessonActivity title="Catch the Red Text" scenarioId="capture-errors" id="capture-errors" />
		</div>

		<!-- 4.2 Pipes -->
		<div id="section-4-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Workflow}
				title="4.2 Pipes — Small Tools, Composed"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Redirection sends output into a <em>file</em>. The pipe —
				<Code code="|" />
				— sends it into <em>another command</em>. Whatever the left command prints becomes the right
				command's input, no temporary file needed. This one character is the reason terminal users
				never left.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/pipes.webp"
					alt="Pipes — the output of one command flowing directly into the next"
					caption="A pipe connects the output of one command to the input of the next"
				/>
			</div>

			<CodeBlock
				title="Your first pipes"
				code={`ls ~/Downloads | wc -l        # How many things are in Downloads?
        47

history | tail -5             # The last 5 commands you ran

cat server.log | grep "ERROR" | wc -l   # How many errors in the log?
        12`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Read a pipeline left to right, like an assembly line: the text flows through each station
				and comes out transformed. Here's the last example as a picture:
			</p>

			<MermaidDiagram
				definition={`flowchart LR
  A[("server.log")] --> B["grep ERROR"]
  B -->|"matching lines"| C["wc -l"]
  C -->|"count"| D(["12"])`}
				id="pipe-flow"
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				This is the <strong style="color: var(--color-text);">Unix philosophy</strong>, and it's
				older than most programming languages you know: "Write programs that do one thing and do it
				well," as Doug McIlroy — the inventor of the pipe — put it.
				<Code code="grep" />
				only searches.
				<Code code="wc" />
				only counts.
				<Code code="sort" />
				only sorts. None of them is impressive alone — but because they all speak plain text, any of them
				can feed any other, and a handful of tiny tools becomes thousands of combinations.
			</p>

			<Callout type="tip">
				<strong>Build pipelines one stage at a time.</strong> Run the first command alone and look
				at its output. Then add one
				<Code code="|" />
				and look again. This isn't just how you <em>write</em> pipelines — it's how you
				<em>audit</em> the ones your AI writes. A five-stage pipeline you can't follow is really five
				one-stage commands you haven't run yet.
			</Callout>

			<VibeBox
				prompts={[
					'Explain this pipeline stage by stage before I run it: cat access.log | grep POST | wc -l',
					'Write me a pipeline that counts how many files in this folder end in .png'
				]}
			/>
		</div>

		<!-- 4.3 Searching Text -->
		<div id="section-4-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Search}
				title="4.3 Searching Text — grep"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A server just crashed and the log is 10,000 lines long. Nobody scrolls that. <Code
					code="grep"
				/>
				prints only the lines that match a pattern — it's the terminal's search box, and probably the
				single most-used tool in this entire course.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/grep.webp"
					alt="grep — filtering thousands of lines down to just the ones that match"
					caption="grep keeps only the lines that match — the haystack goes in, the needles come out"
				/>
			</div>

			<CodeBlock
				title="grep basics"
				code={`grep "ERROR" server.log          # Lines containing ERROR
2026-07-11 14:02:11 ERROR db connection refused
2026-07-11 14:02:15 ERROR retry limit reached

grep -r "TODO" src/              # Search every file under src/
src/app.js:14:  // TODO: handle empty cart
src/utils.js:3: // TODO: remove this hack`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Five flags cover 95% of real-world grep:
			</p>

			<div class="mb-4 grid gap-3 sm:grid-cols-2">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-tip);"
					>
						<CaseSensitive size={14} />
						<span><Code code="-i" /> — ignore case</span>
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Matches <Code code="error" />,
						<Code code="Error" />, and
						<Code code="ERROR" />. Use it by default when hunting in logs.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-note);"
					>
						<Hash size={14} />
						<span><Code code="-n" /> — line numbers</span>
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Prefixes each match with where it lives — essential when you're about to open the file
						and fix it.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-warning);"
					>
						<FilterX size={14} />
						<span><Code code="-v" /> — invert</span>
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Keep the lines that <em>don't</em> match. Perfect for filtering noise out:
						<Code code="grep -v &quot;DEBUG&quot;" />.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-important);"
					>
						<Sigma size={14} />
						<span><Code code="-c" /> — count</span>
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Print how many lines matched instead of the lines themselves — a built-in
						<Code code="| wc -l" />.
					</p>
				</div>
				<div class="rounded-lg p-4 sm:col-span-2" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-caution);"
					>
						<FolderTree size={14} />
						<span><Code code="-r" /> — recursive</span>
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Search a whole directory tree instead of one file. <Code
							code="grep -rn &quot;api_key&quot; ."
						/> is how developers answer "where in this codebase is that used?"
					</p>
				</div>
			</div>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				And because <Code code="grep" /> reads standard input, it slots into any pipeline as a filter.
				This is the pattern you'll type every single day:
			</p>

			<CodeBlock
				title="grep as a pipeline filter"
				code={`history | grep "cd"              # Every cd you've ever run
tail -50 server.log | grep -i "error"   # Only recent errors
grep "ERROR" server.log | grep -v "retry"  # Errors, minus the noisy ones`}
			/>

			<h4
				id="log-detective"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Find the Crash
			</h4>
			<PlaygroundNote>
				A server died last night and <Code code="server.log" />
				has hundreds of lines. Use
				<Code code="grep" />
				— with
				<Code code="-i" />,
				<Code code="-n" />, and
				<Code code="-v" />
				to cut the noise — and pipes to
				<Code code="wc -l" /> to pin down exactly when and why it crashed.
			</PlaygroundNote>
			<LessonActivity title="Find the Crash" scenarioId="log-detective" id="log-detective" />

			<VibeBox
				prompts={[
					'Search server.log for errors, ignoring case, and show me the line numbers',
					"Find every file in this project that still mentions the old function name 'fetchUser'"
				]}
			/>
		</div>

		<!-- 4.4 Counting & Shaping -->
		<div id="section-4-4" class="mb-14">
			<SectionHeader
				level="section"
				icon={ListOrdered}
				title="4.4 Counting &amp; Shaping — wc, sort, uniq, cut"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="grep" />
				finds lines. These four tools <em>reshape</em> them: count them, order them, de-duplicate them,
				and slice out columns. Individually they're almost boring — together they answer real questions,
				like "who's hammering my website?"
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/counting-shaping.webp"
					alt="wc, sort, uniq, and cut — four small tools that count and reshape text"
					caption="Four tiny tools: count with wc, order with sort, collapse with uniq, slice with cut"
				/>
			</div>

			<CodeBlock
				title="The cast, one line each"
				code={`wc -l server.log        # Count lines (-w words, -c bytes)
     843 server.log

sort names.txt          # Alphabetical order (-n numeric, -r reversed)

uniq names.txt          # Collapse REPEATED ADJACENT lines into one

cut -d',' -f2 users.csv # Slice column 2, using ',' as the delimiter`}
			/>

			<Callout type="warning">
				<strong>The uniq gotcha:</strong>
				<Code code="uniq" />
				only collapses duplicates that are <em>next to each other</em>. Given
				<Code code="a b a" />, it removes nothing. That's why it practically always appears as
				<Code code="sort | uniq" />
				— sort herds the duplicates together first, then uniq collapses them.
			</Callout>

			<h4
				id="count-lines"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Count Before You Fix
			</h4>
			<PlaygroundNote>
				Before ranking anything, answer the simplest question: how many? Pipe
				<Code code="grep ERROR server.log" /> into
				<Code code="wc -l" /> to count the error lines, and save the total to a file.
			</PlaygroundNote>
			<LessonActivity title="Count Before You Fix" scenarioId="count-lines" id="count-lines" />

			<p class="mt-6 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Now the payoff. Your web server writes one line per visit to <Code code="access.log" />, and
				you want to know your top visitors. This is the most famous pipeline in Unix history, and
				we'll build it one stage at a time — exactly the way you should build every pipeline.
			</p>

			<CodeBlock
				title="Stage 0 — look at the raw material"
				code={`head -4 access.log
203.0.113.9 GET /home
198.51.100.4 GET /pricing
203.0.113.9 GET /docs
192.0.2.55 GET /home`}
			/>

			<CodeBlock
				title="Stage 1 — `cut`: keep only the IP column"
				code={`cut -d' ' -f1 access.log
203.0.113.9
198.51.100.4
203.0.113.9
192.0.2.55
...

# -d' ' = columns are separated by spaces; -f1 = give me field 1`}
			/>

			<CodeBlock
				title="Stage 2 — `sort`: herd the duplicates together"
				code={`cut -d' ' -f1 access.log | sort
192.0.2.55
198.51.100.4
198.51.100.4
203.0.113.9
203.0.113.9
203.0.113.9
...`}
			/>

			<CodeBlock
				title="Stage 3 — `uniq -c`: collapse and count"
				code={`cut -d' ' -f1 access.log | sort | uniq -c
   1 192.0.2.55
   2 198.51.100.4
   3 203.0.113.9
...`}
			/>

			<CodeBlock
				title="Stage 4 — `sort -n`: rank by the count"
				code={`cut -d' ' -f1 access.log | sort | uniq -c | sort -n
   1 192.0.2.55
   2 198.51.100.4
   3 203.0.113.9

# Biggest number last — your top visitor is 203.0.113.9`}
			/>

			<Callout type="tip">
				Read the finished pipeline aloud and it's a sentence: "take column one, group the
				duplicates, count each group, rank by count." When you can narrate a pipeline like that, you
				own it — whether you wrote it or an AI did.
			</Callout>

			<h4
				id="pipeline-practice"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Build a Pipeline
			</h4>
			<PlaygroundNote>
				<Code code="access.log" />
				is waiting in the playground. Build the classic pipeline stage by stage —
				<Code code="cut" />, then
				<Code code="| sort" />, then
				<Code code="| uniq -c" />, then
				<Code code="| sort -n" /> — and identify your site's top visitor. Run each stage before adding
				the next.
			</PlaygroundNote>
			<LessonActivity
				title="Build a Pipeline"
				scenarioId="pipeline-practice"
				id="pipeline-practice"
			/>

			<VibeBox
				prompts={[
					'From access.log, show me the top 5 most-requested pages with their counts',
					'How many unique visitors are in this log file? Walk me through the pipeline you use'
				]}
			/>
		</div>

		<!-- 4.5 Finding Files -->
		<div id="section-4-5" class="mb-8">
			<SectionHeader
				level="section"
				icon={FileSearch}
				title="4.5 Finding Files — find"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="grep" />
				searches <em>inside</em> files. But sometimes the question is "where <em>is</em> that file?"
				— a config you know exists, every Markdown file in a project, that one script you wrote last
				month.
				<Code code="find" /> walks an entire directory tree and prints every path that matches your criteria.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/finding-files.webp"
					alt="find — walking a directory tree to locate files by name and type"
					caption="find walks the whole tree and reports every path that matches"
				/>
			</div>

			<CodeBlock
				title="find essentials"
				code={`find . -name '*.md'            # Every Markdown file below here
./README.md
./docs/setup.md
./docs/notes/ideas.md

find . -name '*.md' -type f    # -type f: files only
find . -type d -name 'test*'   # -type d: directories only
find ~ -name '.zshrc'          # Start the search from your home folder`}
			/>

			<Callout type="caution">
				<strong>Quote the pattern.</strong> Write
				<Code code="'*.md'" />
				with quotes, not bare
				<Code code="*.md" />. Remember <CourseLink to="part-3" />: the <em>shell</em> expands
				wildcards before the command ever runs. Unquoted,
				<Code code="*.md" />
				becomes a list of the Markdown files in your <em>current</em> folder — and find receives that
				list instead of the pattern, searching for the wrong thing entirely. The quotes deliver the pattern
				to find intact, so find can apply it at every level of the tree.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Keep the two search tools straight — they're a team, not rivals:
			</p>

			<div class="mb-4 grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-note);"
					>
						<FileSearch size={14} />
						<span>find — searches <em>filenames</em></span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						"Where are the files called <Code code="*.md" />?" It never opens a file; it only looks
						at names, types, and locations.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-important);"
					>
						<TextSearch size={14} />
						<span>grep — searches <em>contents</em></span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						"Which lines contain <Code code="TODO" />?" It reads inside files but doesn't care what
						they're named.
					</p>
				</div>
			</div>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				And naturally, they compose. Find the files by name, then grep inside exactly those:
			</p>

			<CodeBlock
				title="find + grep, together"
				code={`find . -name '*.js' | xargs grep -n "TODO"
./src/app.js:14:  // TODO: handle empty cart
./src/utils.js:3: // TODO: remove this hack

# xargs turns the list of paths into arguments for grep.
# (For a whole tree, grep -rn "TODO" . is the simpler everyday version.)`}
			/>

			<h4
				id="find-files"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Hunt Down Every TODO
			</h4>
			<PlaygroundNote>
				A project tree is scattered with leftover TODOs. Use <Code
					code="find . -name '*.js' -type f"
				/>
				to locate the source files (quote that glob!), then combine with
				<Code code="grep" /> to list every TODO with its file and line number.
			</PlaygroundNote>
			<LessonActivity title="Hunt Down Every TODO" scenarioId="find-files" id="find-files" />

			<VibeBox
				prompts={[
					'Find every Markdown file in this project, including ones in nested folders',
					'List all the TODO comments left anywhere in src/ with their file names and line numbers'
				]}
			/>

			<p class="mt-10 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Notice what all of these have in common: they <em>find</em> and <em>count</em> — none of
				them changes a single character. That's deliberate, and it's why they're safe to experiment
				with. When you're ready to make text
				<em>different</em> — swap a word across a file, drop every DEBUG line, pull one column out
				of a table — that's <Code code="sed" /> and <Code code="awk" />, waiting in <CourseLink
					to="part-7"
				/>.
			</p>
		</div>
	</div>
</section>
