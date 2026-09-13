<script lang="ts">
	import { Workflow, MoveRight, Search, ListOrdered, FileSearch } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
</script>

<section id="part-4" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Workflow}
			partLabel="Part 4"
			title="Text and Pipes: Turn a List into an Answer"
		/>
		<p class="lead">
			A folder full of notes is useful. Being able to ask “which notes mention basil?” or “how many
			times did this happen?” is more useful still.
		</p>
		<p>
			We’ll start by saving one message into a file. Then we’ll send text through small tools: one
			finds matching lines, another counts them, another sorts them. Build each step separately so
			you can see what changes.
		</p>

		<div id="section-4-1" class="lesson-section">
			<SectionHeader level="section" icon={MoveRight} title="4.1 Save a Command’s Output" />
			<p>
				So far, echo has printed to the terminal. Put <Code code=">" /> and a filename after it to send
				that text into a file instead:
			</p>
			<CommandTranscript command="echo &quot;Water the basil&quot; > garden-tasks.txt" output="" />
			<p>No message appeared because the text went into garden-tasks.txt. Check the saved file:</p>
			<CommandTranscript command="cat garden-tasks.txt" output="Water the basil" />
			<p>
				This is <strong>redirection</strong>: choosing where output goes. If the named file does not
				exist, the shell creates it. If it already exists, <Code code=">" /> normally empties it before
				the command runs. Use a new filename when you want to preserve the earlier contents.
			</p>
			<ExpandableImage
				src="{base}/images/redirection.webp"
				alt="A command’s output going into a file instead of the terminal display."
				caption="The destination is the filename after the arrow."
			/>
			<h4>Add another line without replacing the first</h4>
			<CodeBlock
				code={'echo "Check the mint" >> garden-tasks.txt\ncat garden-tasks.txt'}
				title="Append a task, then read both lines"
			/>
			<p>
				The double arrow <Code code=">>" /> appends. You should now see Water the basil followed by Check
				the mint. Try a third task of your own.
			</p>
			<p>
				<strong>Pause and predict:</strong> what would happen if you used a single arrow for the third
				task? The earlier tasks would be replaced. A longer symbol is not “more powerful” here; it is
				a different instruction.
			</p>
			<h4>Keep normal results and errors separate</h4>
			<p>
				A command can print useful results and an error in the same run. Those messages travel
				through two channels: <strong>standard output</strong> for results and
				<strong>standard error</strong>
				for diagnostics. A normal <Code code=">" /> redirects only standard output.
			</p>
			<p>
				The next example names a file that exists and one that does not. First run it without
				redirection so you can see both kinds of reply:
			</p>
			<CodeBlock
				code="ls garden-tasks.txt missing.txt"
				title="One existing file, one deliberately missing file"
			/>
			<p>
				Now keep the replies in different files. <Code code="2>" /> redirects the error channel, numbered
				2:
			</p>
			<CodeBlock
				code={'ls garden-tasks.txt missing.txt > found.txt 2> errors.txt\ncat found.txt\ncat errors.txt'}
				title="Separate the listing from the error"
			/>
			<p>
				The listing belongs in found.txt; the missing-file message belongs in errors.txt. The error
				is still a real failure. Saving the message did not fix its cause.
			</p>
			<h4 id="capture-errors">Try it: capture both replies</h4>
			<p>
				In this practice, app.log exists and ghost.log does not. List both, save the normal listing
				as found.txt and the diagnostic as errors.txt, then read both files.
			</p>
			<LessonActivity title="Catch the Red Text" scenarioId="capture-errors" id="capture-errors" />
			<details>
				<summary>Input redirection and merging the two output channels</summary>
				<div class="detail-content">
					<p>
						<strong>Standard input</strong>, numbered 0, is where a program reads incoming data. <Code
							code="sort < names.txt"
						/> makes a file that input. The other channels are standard output (1) and standard error
						(2).
					</p>
					<p>
						<Code code="> all.log 2>&1" /> first directs normal output to all.log, then directs errors
						to the same destination. Order matters: the redirections are applied left to right. <Code
							code="2>&1 > all.log"
						/> sends errors to the output’s <em>earlier</em> destination, so it is different.
					</p>
					<p>
						Do not read a file and redirect into that same file in one command. For example, <Code
							code="sort names.txt > names.txt"
						/> can empty the source before sort reads it. Write to a different filename, inspect the result,
						then deliberately replace the original if needed.
					</p>
				</div>
			</details>
		</div>

		<div id="section-4-2" class="lesson-section">
			<SectionHeader
				level="section"
				icon={Workflow}
				title="4.2 Pipes: Give the Text to Another Tool"
			/>
			<p>
				An arrow sends output to a file. A <strong>pipe</strong>, written <Code code="|" />, sends
				one command’s standard output to the next command’s standard input.
			</p>
			<p>Try this small example. printf prints three lines; sort arranges them alphabetically:</p>
			<CommandTranscript
				command="printf '%s\n' mint basil thyme | sort"
				output={'basil\nmint\nthyme'}
			/>
			<div id="pipe-flow" class="steps">
				<span><code>printf</code><small>Produces the lines</small></span><span
					><code>|</code><small>Passes the text along</small></span
				><span><code>sort</code><small>Reads and orders the lines</small></span>
			</div>
			<p>
				Without the pipe, printf would print to your terminal. With it, sort receives the text and
				prints the final result. The left command’s output is not automatically also shown on
				screen.
			</p>
			<ExpandableImage
				src="{base}/images/pipes.webp"
				alt="Text moving from one small command to the next through a pipeline."
				caption="The output of one stage becomes the input of the next."
			/>
			<p>Add one more stage to ask how many lines remain:</p>
			<CommandTranscript command="printf '%s\n' mint basil thyme | sort | wc -l" output="3" />
			<p>
				<Code code="wc -l" /> counts newline characters. Here each item ends in a newline, so the answer
				is three lines. A pipe passes text, not the name of a temporary file. That distinction will matter
				when we combine file-finding tools later.
			</p>
			<h4>Watch output and save a copy</h4>
			<p>
				<Code code="tee" /> copies its input into a file while also passing it onward. Use it when you
				want to see the answer and keep it:
			</p>
			<CodeBlock
				code="cat garden-tasks.txt | tee saved-tasks.txt"
				title="Print the tasks and write the same text into another file"
			/>
			<p>
				tee replaces an existing destination unless you use <Code code="tee -a" /> to append. Like an
				ordinary pipe, it receives standard output; errors only join the stream if you explicitly redirect
				them there.
			</p>
			<p>
				<strong>Try a variation:</strong> reverse the ordering with <Code code="sort -r" />. The
				count should remain three. A useful check asks what should change and what should stay the
				same.
			</p>
		</div>

		<div id="section-4-3" class="lesson-section">
			<SectionHeader level="section" icon={Search} title="4.3 Search Inside Files with grep" />
			<p>
				<Code code="grep" /> prints matching lines. To search for text exactly as written, start with
				<Code code="-F" />, meaning fixed text:
			</p>
			<CommandTranscript command="grep -F 'basil' garden-tasks.txt" output="Water the basil" />
			<p>
				This finds lines containing basil anywhere. It does not mean “only the word basil,” and it
				does not include Basil unless you add <Code code="-i" /> to ignore case. No matches normally means
				no printed lines, not that the file was changed.
			</p>
			<ExpandableImage
				src="{base}/images/grep.webp"
				alt="A search highlighting relevant lines within a larger text file."
				caption="Search the contents; leave the original file as it is."
			/>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Need</th><th>Example</th></tr></thead><tbody>
						<tr
							><td>Ignore letter case</td><td><Code code="grep -Fi 'basil' garden-tasks.txt" /></td
							></tr
						>
						<tr
							><td>Include line numbers</td><td
								><Code code="grep -Fn 'basil' garden-tasks.txt" /></td
							></tr
						>
						<tr
							><td>Keep lines without that text</td><td
								><Code code="grep -Fv 'mint' garden-tasks.txt" /></td
							></tr
						>
						<tr
							><td>Count matching lines</td><td
								><Code code="grep -Fc 'basil' garden-tasks.txt" /></td
							></tr
						>
						<tr
							><td>Search files under a folder</td><td><Code code="grep -Frn 'basil' notes/" /></td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				A log is a record a program writes as it runs. Many logs label entries INFO, WARN, or ERROR.
				Searching those words can help you find a problem without reading the whole file.
			</p>
			<CodeBlock
				code={"grep -Fn 'ERROR' server.log\ngrep -F 'ERROR' server.log | grep -Fv 'retry'"}
				title="Find error lines, then remove a known repeated message"
			/>
			<p>
				The second command keeps error lines that do not contain retry. Inspect what you excluded as
				well as what you kept; filtering a message out of a report does not make the problem
				disappear.
			</p>
			<h4>When you need a pattern instead of literal text</h4>
			<p>
				Without -F, grep uses a <strong>regular expression</strong>. This is a pattern language for
				text, different from the filename globs in Part 3. Begin with just two anchors:
			</p>
			<CodeBlock
				code={"grep '^Water' garden-tasks.txt\ngrep 'basil$' garden-tasks.txt"}
				title="First: lines starting with Water. Second: lines ending with basil."
			/>
			<p>
				<Code code="^" /> marks the beginning of a line; <Code code="$" /> marks its end. A dot in a regular
				expression matches a character. A star repeats the pattern item before it. To search for a literal
				filename such as <Code code="plan.md" />, <Code code="grep -F 'plan.md' file.txt" /> avoids treating
				the dot as a wildcard.
			</p>
			<p>
				Keep the pattern in quotes so the shell passes it intact. <Code code="grep '*.txt'" /> is not
				the way to select text files: grep’s pattern is for <em>contents</em>. A filename glob goes
				where the filenames go, for example <Code code="grep -F 'basil' ./*.txt" />.
			</p>
			<h4 id="log-detective">Try it: read the story of a crash</h4>
			<p>
				Search the supplied server.log. Start with one useful word, include line numbers, then
				narrow the result. Read the nearby text before deciding what caused the failure.
			</p>
			<LessonActivity title="Find the Crash" scenarioId="log-detective" id="log-detective" />
		</div>

		<div id="section-4-4" class="lesson-section">
			<SectionHeader level="section" icon={ListOrdered} title="4.4 Count, Group, and Rank" />
			<p>
				A search gives you matching lines. Now we can turn those lines into a count or a short
				report.
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Tool</th><th>Job</th><th>Detail that matters</th></tr></thead><tbody>
						<tr
							><td><Code code="wc -l" /></td><td>Count newline characters</td><td
								>A final line without a newline is not counted by -l.</td
							></tr
						>
						<tr
							><td><Code code="sort" /></td><td>Order lines</td><td
								>Use -n for numeric order, -r to reverse it.</td
							></tr
						>
						<tr
							><td><Code code="uniq -c" /></td><td>Count adjacent equal lines</td><td
								>Sort first if equal lines are scattered.</td
							></tr
						>
						<tr
							><td><Code code="cut" /></td><td>Choose fields separated by one character</td><td
								>It does not understand quoted CSV fields.</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<ExpandableImage
				src="{base}/images/counting-shaping.webp"
				alt="Text lines being counted, sorted, grouped, and separated into columns."
				caption="Choose a tool by the shape of the text you actually have."
			/>
			<h4 id="count-lines">Try it: get one reliable count</h4>
			<p>
				Find the ERROR lines, pipe them into <Code code="wc -l" />, and save the count to the
				requested file. Check the count against the matching lines themselves.
			</p>
			<LessonActivity title="Count Before You Fix" scenarioId="count-lines" id="count-lines" />
			<h4>Build a small report one stage at a time</h4>
			<p>
				Suppose this is the entire content of a tiny access.log. Each line is a request to a
				website. The first field identifies a network address; GET is the request’s action, and the
				last field is the requested web path.
			</p>
			<CodeBlock
				lang="text"
				title="Example access.log · four requests"
				code={'203.0.113.9 GET /home\n198.51.100.4 GET /about\n203.0.113.9 GET /garden\n192.0.2.55 GET /home'}
			/>
			<p>
				<Code code="cut -d ' ' -f 1" /> says: separate fields at spaces and keep field one. For this deliberately
				simple format, that field is the address:
			</p>
			<CommandTranscript
				command="cut -d ' ' -f 1 access.log"
				output={'203.0.113.9\n198.51.100.4\n203.0.113.9\n192.0.2.55'}
			/>
			<p>Sort those lines to put equal addresses beside one another:</p>
			<CommandTranscript
				command="cut -d ' ' -f 1 access.log | sort"
				output={'192.0.2.55\n198.51.100.4\n203.0.113.9\n203.0.113.9'}
			/>
			<p>Count each adjacent group with uniq -c:</p>
			<CommandTranscript
				command="cut -d ' ' -f 1 access.log | sort | uniq -c"
				output={'1 192.0.2.55\n1 198.51.100.4\n2 203.0.113.9'}
			/>
			<p>
				Then order by the leading number. <Code code="sort -n" /> puts the largest count last; <Code
					code="sort -nr"
				/> puts it first. Output may have extra alignment spaces.
			</p>
			<CodeBlock
				code="cut -d ' ' -f 1 access.log | sort | uniq -c | sort -n"
				title="Select the field, group equal values, count, rank"
			/>
			<p>
				The totals should add up to four requests. An address is not necessarily a person: several
				people can share one network address, and a person can use several addresses. Name the
				report accurately.
			</p>
			<h4 id="pipeline-practice">Try it: build the report yourself</h4>
			<p>
				This practice contains a longer log. Run each stage before adding the next. Save the final
				report as top-visitors.txt and check that the busiest address appears at the bottom.
			</p>
			<LessonActivity
				title="Build a Pipeline"
				scenarioId="pipeline-practice"
				id="pipeline-practice"
			/>
			<details>
				<summary>Why a comma is not always a column boundary</summary>
				<div class="detail-content">
					<p>
						A simple table such as <Code code="basil,green,3" /> is easy to split at commas. Real CSV
						can quote a value that contains a comma, a quote, or even a newline. Neither plain cut nor
						<Code code="awk -F," /> parses those CSV rules. Use a CSV-aware tool or library for a general
						spreadsheet export. Part 7 practises simple tables and explains the boundary.
					</p>
				</div>
			</details>
		</div>

		<div id="section-4-5" class="lesson-section">
			<SectionHeader level="section" icon={FileSearch} title="4.5 Find Files by Name" />
			<p>
				grep asks “which lines contain this text?” <Code code="find" /> can ask “where are the files with
				these names?” It searches a folder and its descendants.
			</p>
			<CodeBlock
				code="find . -type f -name '*.md'"
				title="Find Markdown filenames under the current folder"
			/>
			<p>
				Read the pieces in order: start at <Code code="." />, keep regular files with <Code
					code="-type f"
				/>, and match their names against <Code code="'*.md'" />. The quotes stop the shell from
				expanding the star before find sees it.
			</p>
			<ExpandableImage
				src="{base}/images/finding-files.webp"
				alt="A search following branches of a folder tree to matching filenames."
				caption="Choose where to start, then say which names or types you want."
			/>
			<CodeBlock
				code={"find notes -type f -name '*.txt'\nfind . -type d -name 'photos'"}
				title="One search for text files; another for folders named photos"
			/>
			<p>
				Start with the smallest sensible folder. Searching your whole computer creates unnecessary
				output and permission errors. If nothing matches, check the starting folder, capitalization,
				and pattern.
			</p>
			<h4>Searching paths is different from searching their contents</h4>
			<p>
				<Code code="find . -name '*.py' | grep TODO" /> searches the <em>printed path names</em> for
				TODO. It does not open each Python file. To search contents recursively, use <Code
					code="grep -rn TODO ."
				/>; to limit the file set on a real terminal, find can pass each filename as an argument:
			</p>
			<CodeBlock
				code={"find . -type f -name '*.py' -exec grep -n 'TODO' /dev/null {} +"}
				title="Real terminal · search only the Python files find selected"
			/>
			<p>
				<Code code="-exec" /> runs the following command. <Code code={'{}'} /> marks where the found paths
				go, and <Code code="+" /> groups paths into batches. The harmless empty file <Code
					code="/dev/null"
				/> ensures grep sees multiple file arguments and includes filenames in its results. The sandbox
				does not implement find -exec.
			</p>
			<p>
				Do not use a plain line-based <Code code="find ... | xargs ..." /> recipe for arbitrary filenames.
				Spaces, quotes, and newlines can be part of a filename. On a real terminal, <Code
					code="-exec"
				/> passes the names directly. A null-delimited <Code code="find -print0 | xargs -0" /> pipeline
				is another approach, but those options are outside this sandbox.
			</p>
			<h4 id="find-files">Try it: collect the remaining TODOs</h4>
			<p>
				The sample project uses Python files ending in .py. Locate them with find, then use grep’s
				recursive search to collect the TODO lines with their file and line numbers. Save the report
				as the activity requests. No source files need to change.
			</p>
			<LessonActivity title="Hunt Down Every TODO" scenarioId="find-files" id="find-files" />
			<ChallengeActivity title="Who Is Actually Visiting?" part={4} id="ch-4-top-visitors" />
			<p class="next-lesson">
				Explain one pipeline from this part aloud: what does each stage receive, and what does it
				produce? If one stage is unclear, run it separately. That habit scales to much larger jobs.
			</p>
		</div>
	</div>
</section>

<style>
	.chapter p {
		max-width: 76ch;
		color: var(--color-text-secondary);
		font-size: 0.94rem;
		line-height: 1.8;
		margin: 0 0 1rem;
	}
	.chapter .lead {
		color: var(--color-text);
		font-size: 1.06rem;
	}
	.lesson-section {
		margin-top: 3rem;
		scroll-margin-top: 90px;
	}
	h4 {
		color: var(--color-text);
		font-size: 1.06rem;
		font-weight: 650;
		line-height: 1.5;
		margin: 1.7rem 0 0.7rem;
		scroll-margin-top: 90px;
	}
	details {
		border-top: 1px solid var(--color-border);
		margin: 1.1rem 0;
	}
	summary {
		padding: 0.9rem 0;
		cursor: pointer;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--color-text);
	}
	.detail-content {
		padding: 0.2rem 0.3rem 0.7rem;
	}
	.table-scroll {
		overflow-x: auto;
		margin: 1.2rem 0;
	}
	table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.84rem;
		line-height: 1.65;
		color: var(--color-text-secondary);
	}
	th {
		color: var(--color-text);
		text-align: left;
		font-weight: 650;
	}
	th,
	td {
		padding: 0.7rem 0.65rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}
	.steps {
		display: flex;
		flex-wrap: wrap;
		gap: 0.8rem;
		margin: 1.5rem 0;
	}
	.steps span {
		flex: 1;
		padding: 0.9rem;
		background: var(--color-bg-secondary);
		border: 1px solid var(--color-border);
		border-radius: 0.6rem;
		color: var(--color-text);
	}
	.steps code {
		font: 1rem var(--font-mono);
	}
	.steps small {
		display: block;
		margin-top: 0.4rem;
		font-size: 0.75rem;
		color: var(--color-text-muted);
	}
	.next-lesson {
		padding: 1.1rem;
		border-radius: 0.7rem;
		background: var(--color-bg-secondary);
	}
</style>
