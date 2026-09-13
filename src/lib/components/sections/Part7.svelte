<script lang="ts">
	import { Scissors, Replace, PenLine, Columns3 } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
</script>

<section id="part-7" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Scissors}
			partLabel="Part 7"
			title="Text Surgery: Change a Word, Keep the Original"
		/>
		<p class="lead">
			The café has run out of mango. Its menu needs kiwi instead. Let’s make that change without
			rewriting the whole file—or losing the original while we experiment.
		</p>
		<p>
			<Code code="sed" /> transforms text as it reads it. The basic commands here print the changed text
			while leaving the input file alone. Later, we’ll deliberately save a new file or edit an existing
			one. <Code code="awk" /> will help when the text is arranged into fields.
		</p>

		<div id="section-7-1" class="lesson-section">
			<SectionHeader level="section" icon={Replace} title="7.1 Find and Replace with sed" />
			<p>Suppose menu.txt contains this one line:</p>
			<CodeBlock lang="text" code="mango smoothie — mango, ice, lime" title="Example menu.txt" />
			<p>Ask sed to substitute kiwi for mango:</p>
			<CommandTranscript
				command="sed 's/mango/kiwi/' menu.txt"
				output="kiwi smoothie — mango, ice, lime"
			/>
			<p>
				Only the first mango on the line changed. Add <Code code="g" /> to replace every match on each
				line:
			</p>
			<CommandTranscript
				command="sed 's/mango/kiwi/g' menu.txt"
				output="kiwi smoothie — kiwi, ice, lime"
			/>
			<div class="steps">
				<span><code>s</code><small>Substitute</small></span><span
					><code>mango</code><small>Find this pattern</small></span
				><span><code>kiwi</code><small>Replace with this</small></span><span
					><code>g</code><small>Every match on the line</small></span
				>
			</div>
			<ExpandableImage
				src="{base}/images/find-replace.webp"
				alt="The word mango becoming kiwi in a menu while the original is preserved."
				caption="Read the result before choosing where to save it."
			/>
			<p>
				Now run <Code code="cat menu.txt" />. The file should still say mango. sed printed a
				different version; it did not save that version over your input.
			</p>
			<p>To keep the result as a separate file, add redirection:</p>
			<CodeBlock
				code={"sed 's/mango/kiwi/g' menu.txt > kiwi-menu.txt\ncat kiwi-menu.txt\ncat menu.txt"}
				title="Save a new version, then inspect both files"
			/>
			<p>
				Choose a destination different from the source. <Code code="sed ... menu.txt > menu.txt" /> can
				empty menu.txt before sed reads it. Redirection is handled by the shell, so that mistake happens
				before the text transformation.
			</p>
			<h4>Know what the pattern means</h4>
			<p>
				The find part is a regular expression, like grep without -F. It can match inside a larger
				word. The g means all matches <em>on each line</em>; sed already processes every line by
				default. Neither option means “only complete words.”
			</p>
			<p>
				A dot has a special pattern meaning. To match the literal text plan.md, use <Code
					code="plan\.md"
				/> in a sed pattern. The replacement has special characters too: <Code code="&" /> inserts the
				matched text. Do not assume arbitrary search and replacement strings can be pasted into this syntax
				unchanged.
			</p>
			<details>
				<summary>A different delimiter can make paths easier to read</summary>
				<div class="detail-content">
					<CodeBlock
						code="sed 's|/old/garden|/new/garden|g' paths.txt"
						title="Use a vertical bar as sed’s separator"
					/>
					<p>
						The vertical bars here are inside quotes, so they belong to sed’s substitution syntax. A
						vertical bar outside quotes is the shell’s pipe. Changing the delimiter makes paths more
						readable; it does not make the search pattern literal.
					</p>
					<p>
						Case-insensitive sed flags vary between implementations. For portable simple matching,
						spell out the needed alternatives or inspect your system’s sed manual before using
						extensions such as I.
					</p>
				</div>
			</details>
			<h4 id="sed-rename">Try it: make the kiwi menu</h4>
			<p>
				The playground’s menu has several lines, and one has two mangos. Create kiwi-menu.txt with
				every intended substitution. Inspect the new menu and confirm menu.txt still contains the
				original.
			</p>
			<LessonActivity title="Rebrand the Menu" scenarioId="sed-rename" id="sed-rename" />
		</div>

		<div id="section-7-2" class="lesson-section">
			<SectionHeader level="section" icon={Scissors} title="7.2 Choose Which Lines to Keep" />
			<p>
				A noisy log can be easier to read if you leave out routine DEBUG messages. In this command, <Code
					code="/DEBUG/"
				/> chooses matching lines and <Code code="d" /> drops them from the output:
			</p>
			<CodeBlock code="sed '/DEBUG/d' app.log" title="Preview the log without DEBUG lines" />
			<p>
				The original log stays unchanged. To retain this filtered version, redirect it into a
				different name such as clean.log.
			</p>
			<ExpandableImage
				src="{base}/images/line-surgery.webp"
				alt="Some lines passing through a text filter while selected lines are omitted."
				caption="A line selection tells sed where to apply its action."
			/>
			<div id="sed-line-flow" class="steps">
				<span><code>One input line</code><small>Read the next line</small></span><span
					><code>/DEBUG/</code><small>Does the pattern match?</small></span
				><span><code>d</code><small>If yes, omit it; otherwise print it</small></span>
			</div>
			<p>
				The selection before an action is called an <strong>address</strong>. It can be a line
				number, a range, or a pattern:
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Command</th><th>What is omitted from the output</th></tr></thead><tbody>
						<tr><td><Code code="sed '3d' notes.txt" /></td><td>Line 3</td></tr><tr
							><td><Code code="sed '2,5d' notes.txt" /></td><td>Lines 2 through 5, inclusive</td
							></tr
						><tr><td><Code code="sed '$d' notes.txt" /></td><td>The last line</td></tr><tr
							><td><Code code="sed '/DEBUG/d' app.log" /></td><td
								>Lines matching the regular expression DEBUG</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<h4>Print only a selected range</h4>
			<CodeBlock code="sed -n '2,5p' notes.txt" title="Show only lines 2 through 5" />
			<p>
				<Code code="-n" /> turns off sed’s automatic printing; <Code code="p" /> explicitly prints the
				selected lines. Without -n, those selected lines would normally be printed twice. The options
				and the little sed program have different jobs.
			</p>
			<p>
				You can also limit a substitution: <Code code="sed '2s/mango/kiwi/g' menu.txt" /> changes matches
				on line 2 only. <Code code="sed '/smoothie/s/mango/kiwi/g' menu.txt" /> changes matches only on
				lines containing smoothie.
			</p>
			<p>
				<strong>Try a variation:</strong> print one numbered line, then a three-line range. Compare each
				result with the original. A precise selection is more useful than a shorter-looking command.
			</p>
			<h4 id="log-surgery">Try it: keep the useful log</h4>
			<p>
				Save a clean.log without DEBUG lines. Check that INFO and ERROR lines remain and that
				app.log has not changed. A filtered report is not a replacement for the original diagnostic
				record.
			</p>
			<LessonActivity title="Silence the Debug Noise" scenarioId="log-surgery" id="log-surgery" />
		</div>

		<div id="section-7-3" class="lesson-section">
			<SectionHeader
				level="section"
				icon={PenLine}
				title="7.3 Save an Edit and Check the Difference"
			/>
			<p>
				Sometimes you want the existing file to contain the new text. The option <Code code="-i" /> asks
				sed to edit a file in place. That changes the file you named, rather than merely printing a result.
			</p>
			<p>
				Begin with one file and preview the transformation without -i. Check that the chosen backup
				name does not already contain a version you need. Then the form <Code code="-i.bak" /> edits while
				saving a copy under a .bak name:
			</p>
			<CodeBlock
				code={"sed 's/http:/https:/g' config.yml\nls -a\nsed -i.bak 's/http:/https:/g' config.yml\ndiff config.yml.bak config.yml"}
				title="Preview, check the backup name, edit, compare"
			/>
			<p>
				Here config.yml contains the edited text, and config.yml.bak contains the text from just
				before this edit. Repeating the command can replace that .bak file. It is one saved version,
				not an unlimited undo history.
			</p>
			<ExpandableImage
				src="{base}/images/edit-in-place.webp"
				alt="An edited file beside its earlier version, with their differences compared."
				caption="A saved original is useful only if you inspect the result and preserve the version you need."
			/>
			<h4>Read the diff before deciding the edit is finished</h4>
			<p>
				<Code code="diff" /> compares two files. In its normal output, lines beginning <Code
					code="&lt;"
				/> came from the first file, and lines beginning <Code code="&gt;" /> came from the second. On
				a real terminal, <Code code="diff -u" /> gives a common format with surrounding context.
			</p>
			<p>
				No differences normally means no output and status 0. Status 1 means differences were found;
				that is not itself a broken comparison. A higher status indicates trouble comparing. This is
				a useful example of why an exit status belongs to the command’s own rules.
			</p>
			<p>
				If you want to restore the original, inspect the backup, then deliberately copy it back with <Code
					code="cp config.yml.bak config.yml"
				/>. This replaces the edited version. Keep a separate copy of either version if you may need
				both later.
			</p>
			<p>
				The joined backup form <Code code="-i.bak" /> works with the common GNU and BSD sed versions used
				in this course. Bare <Code code="-i" /> behaves differently: GNU sed permits it without a backup,
				while BSD sed expects a following backup suffix, which may be an empty string. macOS does not
				force you to keep a backup.
			</p>
			<p>
				If a file contains a secret, a .bak copy may still contain that secret. Removing it from the
				edited file does not remove every copy. Review what the backup actually holds before sharing
				the folder.
			</p>
			<h4 id="in-place-audit">Try it: review a proposed edit</h4>
			<p>
				The activity proposes replacing http: with https: in two configuration files. Read them,
				preview the result, and keep their originals using the requested backup suffix. A text
				change alone does not configure encryption on a server or prove that the new address works;
				this exercise checks the edit itself.
			</p>
			<LessonActivity
				title="The Agent's Mass Edit"
				scenarioId="in-place-audit"
				id="in-place-audit"
			/>
		</div>

		<div id="section-7-4" class="lesson-section">
			<SectionHeader level="section" icon={Columns3} title="7.4 Choose Fields with awk" />
			<p>A plain text table might separate its values with spaces. For example:</p>
			<CodeBlock
				lang="text"
				code={'basil   3   sunny\nmint    5   shade\nthyme   2   sunny'}
				title="Example plants.txt · name, quantity, location"
			/>
			<p>
				awk normally separates each line into fields at runs of whitespace. <Code code="$1" /> is the
				first field, <Code code="$2" /> the second, and <Code code="$0" /> the whole line.
			</p>
			<CommandTranscript command={"awk '{print $1}' plants.txt"} output={'basil\nmint\nthyme'} />
			<CommandTranscript
				command={"awk '{print $1, $3}' plants.txt"}
				output={'basil sunny\nmint shade\nthyme sunny'}
			/>
			<p>
				The braces contain an action. <Code code="print" /> prints the fields you name; the comma between
				fields inserts an output separator, a space by default. The shell’s single quotes keep the awk
				program intact.
			</p>
			<ExpandableImage
				src="{base}/images/columns-awk.webp"
				alt="A text table divided into numbered fields and selected output columns."
				caption="First inspect the table’s separators; then choose the fields."
			/>
			<p>
				The <Code code="$1" /> here belongs to <strong>awk</strong>, not to the shell script
				argument from <CourseLink to="part-6" />. Double-quoting this program can let the shell
				replace $1 before awk sees it. Keep these awk programs in single quotes.
			</p>
			<h4>Select rows as well as fields</h4>
			<CommandTranscript command={"awk '/sunny/ {print $1}' plants.txt"} output={'basil\nthyme'} />
			<p>
				The pattern before the braces selects matching lines; the action only runs for those lines.
				This pattern matches sunny anywhere on the line. It is not yet a condition saying “the third
				field is exactly sunny.”
			</p>
			<h4>Choose a different separator</h4>
			<p>
				<Code code="-F," /> tells awk to split fields at commas. That is useful for a deliberately simple
				table with no quoted commas or embedded newlines:
			</p>
			<CodeBlock
				code={"awk -F, '{print $2}' signups.csv\ncut -d, -f2 signups.csv"}
				title="Two ways to select field two from a simple unquoted comma table"
			/>
			<p>
				These agree for the practice file. They do <strong>not</strong> implement general CSV
				parsing. A value such as <Code code="&quot;Lovelace, Ada&quot;" /> contains a comma inside one
				quoted field; a plain split treats it as two. Use a CSV-aware tool or library for such data instead
				of adding guesses to this pipeline.
			</p>
			<p>
				For aligned text with varying numbers of spaces, awk’s default whitespace splitting is often
				convenient. cut is useful when a specific single character is truly the separator. Inspect
				the actual input before choosing.
			</p>
			<details>
				<summary>Real awk: add up a numeric field</summary>
				<div class="detail-content">
					<CodeBlock
						code={"awk '{total += $2} END {print total}' plants.txt"}
						title="Real terminal · the quantities above total 10"
					/>
					<p>
						This adds field two into a variable named total for every line. The END action runs once
						after the input ends and prints the total. It assumes field two contains valid numbers
						and there is no header row. The sandbox’s awk models basic field printing and pattern
						filters, not the full awk language.
					</p>
				</div>
			</details>
			<h4 id="column-pull">Try it: extract the email field</h4>
			<p>
				Read signups.csv, choose the separator, and save its second field as emails.txt. This
				practice includes the header name email in the output; a real mailing workflow would handle
				the header and validate addresses separately. No messages are sent.
			</p>
			<LessonActivity title="Pull the Column" scenarioId="column-pull" id="column-pull" />
			<ChallengeActivity title="Promote the Stack" part={7} id="ch-7-promote-the-stack" />
			<p class="next-lesson">
				You can now search a file, preview a transformation, save a separate result, and inspect a
				deliberate edit. When a command gets harder to read, slow it down into those same steps.
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
