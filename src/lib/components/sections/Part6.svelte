<script lang="ts">
	import { FileCode2, Braces } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	const firstBackup = `#!/usr/bin/env bash
mkdir -p "$HOME/backups"
cp "$HOME/notes.txt" "$HOME/backups/notes-backup.txt"`;
	const argumentBackup = `#!/usr/bin/env bash
mkdir -p "$HOME/backups" && cp -R "$1" "$HOME/backups/"`;
	const safeBackup = `#!/usr/bin/env bash
# Usage: ./backup-safe.sh SOURCE_FOLDER NEW_DESTINATION

if [ "$#" -ne 2 ]; then
  printf 'Usage: %s SOURCE_FOLDER NEW_DESTINATION\\n' "$0" >&2
  exit 2
fi

source_folder="$1"
destination="$2"

if [ ! -d "$source_folder" ]; then
  printf 'Source is not a directory: %s\\n' "$source_folder" >&2
  exit 1
fi

if [ -e "$destination" ] || [ -L "$destination" ]; then
  printf 'Destination already exists: %s\\n' "$destination" >&2
  exit 1
fi

if ! cp -R -- "$source_folder" "$destination"; then
  printf 'Copy failed. Inspect the destination before retrying.\\n' >&2
  exit 1
fi

printf 'Copied %s to %s\\n' "$source_folder" "$destination"`;
</script>

<section id="part-6" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={FileCode2}
			partLabel="Part 6"
			title="Scripts: Save a Routine You Understand"
		/>
		<p class="lead">
			You have commands that work. A script lets you save them in a file and run them again. The
			next step is deciding what should happen when one of those commands fails.
		</p>
		<p>
			We’ll begin with a tiny script in the browser, add arguments and success checks, then practise
			conditions and loops in real Bash. The browser sandbox runs the simple command sequences shown
			in its activities; the longer Bash examples are labeled as real-terminal practice.
		</p>

		<div id="section-6-1" class="lesson-section">
			<SectionHeader level="section" icon={FileCode2} title="6.1 Your First Script" />
			<p>
				Create a file named <Code code="hello.sh" /> with the playground’s
				<strong>Edit a file</strong>
				button, or use <Code code="nano hello.sh" /> on your own computer. Put these two lines in it and
				save:
			</p>
			<CodeBlock
				code={'#!/usr/bin/env bash\necho "The garden notebook is ready"'}
				title="Contents of hello.sh · paste into the file editor"
			/>
			<p>
				The second line is the echo command you already know. The first line, beginning <Code
					code="#!"
				/>, is called a <strong>shebang</strong>. It tells the system to use Bash when this file is
				launched directly. <Code code="/usr/bin/env" /> finds Bash using PATH.
			</p>
			<p>Read the saved file before running it, then run it explicitly with Bash:</p>
			<CodeBlock
				code={'cat hello.sh\nbash hello.sh'}
				title="Check the file, then ask Bash to run its commands"
			/>
			<p>
				You should see The garden notebook is ready. To run the file directly with <Code
					code="./hello.sh"
				/>, first add its owner execute permission:
			</p>
			<CodeBlock code={'chmod u+x hello.sh\n./hello.sh'} title="Run the same script directly" />
			<p>
				The <Code code=".sh" /> ending is a helpful filename convention, not what makes it run. Bash can
				read a script without its execute bit when you explicitly use <Code code="bash hello.sh" />;
				launching <Code code="./hello.sh" /> requires execution permission.
			</p>
			<ExpandableImage
				src="{base}/images/first-script.webp"
				alt="A small group of commands saved as a script and run again."
				caption="Write a file, read it back, run it, and check the result."
			/>
			<h4 id="first-script">Try it: save a small copying routine</h4>
			<p>
				The activity contains notes.txt. Create backup.sh with <strong>Edit a file</strong>, paste
				the following contents, and save. This first version copies one fixed file; it can replace
				the same destination on a later run. We will improve that behavior below.
			</p>
			<CodeBlock code={firstBackup} title="Contents of backup.sh · first small version" />
			<p>
				Read backup.sh, add owner execution, and run it. Then read <Code
					code="~/backups/notes-backup.txt"
				/> and compare it with <Code code="~/notes.txt" />. A success message alone would be weaker
				evidence than seeing the right contents in the right place.
			</p>
			<LessonActivity title="Automate the Backup" scenarioId="first-script" id="first-script" />
			<p>
				<strong>Try a variation:</strong> change the source note in the file editor, run the script again,
				and inspect the copied note. This is an update to one copy, not a history of older versions.
			</p>
			<p>
				Running a script starts a child shell. Its local variables and directory changes do not move
				your parent shell. Files it writes remain changed after the script exits. A script is saved
				work, not an automatic safety boundary.
			</p>
		</div>

		<div id="section-6-2" class="lesson-section">
			<SectionHeader level="section" icon={Braces} title="6.2 Know Whether the Work Succeeded" />
			<p>
				A finished command returns a number called its <strong>exit status</strong> or exit code. Zero
				means success according to that command’s rules. A nonzero value means another outcome, often
				failure.
			</p>
			<CodeBlock
				code={'false\necho "$?"\ntrue\necho "$?"'}
				title="Run one line at a time · expect 1, then 0"
			/>
			<p>
				<Code code="false" /> deliberately returns 1, and <Code code="true" /> returns 0. Neither prints
				a message. The special value <Code code="$?" /> gives the status of the command that just finished.
				Ask immediately: running another command replaces that status.
			</p>
			<ExpandableImage
				src="{base}/images/exit-codes.webp"
				alt="A command reporting success or failure before the next step is chosen."
				caption="A quiet command still reports a status."
			/>
			<p>
				Nonzero does not always mean a crash. For example, grep uses 1 when no lines match and a
				different status for an error. Read the command’s documented meanings when that distinction
				matters.
			</p>
			<h4>Choose whether the next command runs</h4>
			<CommandTranscript
				command="true && echo &quot;That succeeded&quot;"
				output="That succeeded"
			/>
			<CommandTranscript command="false && echo &quot;That succeeded&quot;" output="" />
			<CommandTranscript
				command="false || echo &quot;That did not succeed&quot;"
				output="That did not succeed"
			/>
			<div id="exit-code-chaining" class="steps">
				<span><code>a && b</code><small>Run b only if a succeeds</small></span><span
					><code>a || b</code><small>Run b only if a does not succeed</small></span
				><span><code>a ; b</code><small>Run b regardless of a’s status</small></span>
			</div>
			<p>
				A newline usually behaves like the semicolon here: the next command still runs after an
				earlier failure. That is why a script ending with <Code code="echo 'Done'" /> can print a reassuring
				message after a failed copy.
			</p>
			<CodeBlock
				code="mkdir new-folder && cd new-folder"
				title="Only enter the folder if creating it succeeded"
			/>
			<p>
				If mkdir fails because the name already exists, this form will not enter it. That may be
				exactly what you want for a fresh workspace. If existing directories are acceptable, <Code
					code="mkdir -p"
				/> expresses that different intention.
			</p>
			<p>
				<Code code="a && b || c" /> is not a general if/else statement. The fallback can run when either
				a fails <em>or b fails</em>. It can also hide an earlier failure if c succeeds. For more
				than a small chain, an explicit condition is easier to read.
			</p>
			<h4 id="exit-codes">Try it: run the check before the next step</h4>
			<p>
				Start with <Code code="false && ./deploy.sh" />: the simulated deploy should not run. Then
				inspect the supplied scripts and use <Code code="./tests.sh && ./deploy.sh" />. The supplied
				tests succeed. Here “deploy” creates a marker file in the sandbox; it does not upload a
				site.
			</p>
			<LessonActivity title="Deploy Only on Green" scenarioId="exit-codes" id="exit-codes" />

			<h4 id="script-arguments">Arguments: use the same script on another folder</h4>
			<p>
				In <Code code="./backup.sh notes" />, the word notes is an <strong>argument</strong>. Inside
				the script, <Code code="$1" /> holds the first argument. <Code code="$2" /> holds the second.
				Quotes keep an argument with spaces together.
			</p>
			<ExpandableImage
				src="{base}/images/script-arguments.webp"
				srcset="{base}/images/script-arguments-768.webp 768w, {base}/images/script-arguments.webp 1672w"
				sizes="(max-width: 768px) calc(100vw - 3rem), 896px"
				alt="An arrow carries the quoted My Notes argument from ./backup.sh into the script’s $1 value as one folder name."
				caption="Quotes keep My Notes together. The quote characters themselves are not part of the argument."
			/>
			<CodeBlock code={argumentBackup} title="Contents of backup.sh · a small argument exercise" />
			<p>
				This version creates the backup folder and only copies if that step succeeds. The quoted <Code
					code="&quot;$1&quot;"
				/> is the source folder. Try it as <Code code="./backup.sh notes" />; a folder named My
				Notes would be passed as <Code code="./backup.sh &quot;My Notes&quot;" />.
			</p>
			<p>
				This short teaching version assumes one existing source and an appropriate destination. It
				does not check missing arguments or preserve an earlier copy under a new name. Those are the
				next improvements—not details to leave to luck in a reusable script.
			</p>
			<h4 id="script-args">Try it: choose the source when you run the script</h4>
			<p>
				Use the file editor to create backup.sh with the argument version above. Save, read, add
				owner execution, run it on notes, and verify the copied files under backups/notes.
			</p>
			<LessonActivity title="One Script, Any Folder" scenarioId="script-args" id="script-args" />

			<h4 id="script-conditions">Real Bash: make a decision with if</h4>
			<p>
				The following examples use Bash features beyond the browser simulator. Practise them in a
				new folder on your own computer, using only files you created for this exercise.
			</p>
			<CodeBlock
				code={'if [ -f notes.txt ]; then\n  echo "The note exists"\nelse\n  echo "Create notes.txt first"\nfi'}
				title="Real Bash · run one branch according to a file check"
			/>
			<p>
				<Code code="if" /> runs a test command. If it succeeds, Bash runs the commands after then; otherwise
				it runs the else branch. <Code code="fi" /> ends the condition. The spaces inside <Code
					code="[ -f notes.txt ]"
				/> are required: the brackets and their arguments are separate words.
			</p>
			<ExpandableImage
				src="{base}/images/script-conditions.webp"
				srcset="{base}/images/script-conditions-768.webp 768w, {base}/images/script-conditions.webp 1672w"
				sizes="(max-width: 768px) calc(100vw - 3rem), 896px"
				alt="A file test, [ -f notes.txt ], splits into Yes and No branches. Yes prints The note exists; No prints Create notes.txt first."
				caption="Predict the branch, then try the check with and without notes.txt. Only one branch runs."
			/>
			<p>
				<Code code="-f" /> checks for a regular file. <Code code="-d" /> checks for a directory. <Code
					code="!"
				/> negates a result. These tests establish a particular fact; file existence alone does not prove
				that its contents are correct.
			</p>
			<p>
				<strong>Try both branches:</strong> run the example with no notes.txt, create it with touch, then
				run the example again. You should know which branch will run before pressing Enter.
			</p>

			<h4 id="script-loops">Real Bash: repeat a small task with a loop</h4>
			<CodeBlock
				code={'for plant in basil mint thyme; do\n  printf \'Remember to water %s\\n\' "$plant"\ndone'}
				title="Real Bash · one message for each plant"
			/>
			<p>
				<Code code="for" /> takes the values after in one at a time. On each pass, plant holds the next
				value. The commands between do and done run once for that value. The quoted variable remains one
				argument even when the value contains spaces.
			</p>
			<ExpandableImage
				src="{base}/images/script-loops.webp"
				srcset="{base}/images/script-loops-768.webp 768w, {base}/images/script-loops.webp 1672w"
				sizes="(max-width: 768px) calc(100vw - 3rem), 896px"
				alt="A loop visits basil, mint, and thyme. Three arrows lead to three output lines: Remember to water basil, mint, and thyme, one plant per line."
				caption="Each item gets one turn. The same printf command runs with a different value of plant."
			/>
			<p>
				Add <Code code="&quot;lemon balm&quot;" /> to the list and predict how many lines will print.
				It should produce one line for that two-word plant, not two separate plants.
			</p>
			<p>
				Inside a script, <Code code="&quot;$@&quot;" /> means all its arguments, preserving each one as
				a separate word. This is useful when repeating work over filenames:
			</p>
			<CodeBlock
				code={'#!/usr/bin/env bash\nfor path in "$@"; do\n  printf \'You supplied: %s\\n\' "$path"\ndone'}
				title="Real Bash · contents of show-paths.sh"
			/>
			<p>
				Save the file, then try <Code
					code="bash show-paths.sh notes.txt &quot;My Notes.txt&quot;"
				/>. It should print two supplied paths. This demonstration only prints names; add
				file-changing work after you have verified the selection.
			</p>

			<h4 id="script-safe-backup">Real Bash: a copy script that checks its assumptions</h4>
			<p>
				Now combine the pieces into one useful routine. This script accepts a source folder and a <em
					>new</em
				> destination name. It refuses to overwrite an existing destination and only announces completion
				after the copy succeeds.
			</p>
			<ExpandableImage
				src="{base}/images/script-safe-copy.webp"
				srcset="{base}/images/script-safe-copy-768.webp 768w, {base}/images/script-safe-copy.webp 1672w"
				sizes="(max-width: 768px) calc(100vw - 3rem), 896px"
				alt="Check two arguments, an existing source folder, and a new destination; copy with quoted paths; then read the copied seeds.txt and confirm basil."
				caption="Check the inputs, check whether copying succeeded, then inspect the result. The source folder can have any name."
			/>
			<CodeBlock code={safeBackup} title="Real Bash · save as backup-safe.sh" />
			<ol>
				<li>
					<Code code="$#" /> counts arguments. The first condition requires exactly two before reading
					them. <Code code="$0" /> is the script’s name, used in the usage message.
				</li>
				<li>
					The next condition checks that the source is a directory. The destination check rejects
					existing files, folders, and symbolic links.
				</li>
				<li>
					<Code code="exit 1" /> stops with failure; <Code code="exit 2" /> reports incorrect usage in
					this script. <Code code=">&2" /> sends the explanation to the error channel.
				</li>
				<li>
					The final condition checks the copy itself. <Code code="--" /> ends cp’s options so a supplied
					name beginning with a dash is treated as a name.
				</li>
			</ol>
			<p>
				Use a few disposable files to verify its behavior. First read the script, check its syntax,
				then run it with explicit paths:
			</p>
			<CodeBlock
				code={'bash -n backup-safe.sh\nmkdir practice-notes\necho "basil" > practice-notes/seeds.txt\nbash backup-safe.sh practice-notes "practice copy"\ncat "practice copy/seeds.txt"'}
				title="Real terminal · expect the copied file to contain basil"
			/>
			<p>
				<Code code="bash -n" /> checks syntax without executing the script. It does not prove the logic
				is right. Run the same copy again: it should refuse the existing destination. Try a missing source,
				then no arguments: both should return a nonzero status and a helpful message. Check <Code
					code="$?"
				/> immediately after each run.
			</p>
			<p>
				A failed copy can leave a partial destination. Inspect it before retrying; the script
				deliberately does not remove it automatically. Keep the destination outside the source
				folder. For important backups, also consider retained versions, metadata, separate storage,
				and a tested restore process.
			</p>
			<details>
				<summary>Two other script forms you will encounter</summary>
				<div class="detail-content">
					<p>
						<strong>Command substitution:</strong>
						<Code code="TODAY=$(date +%F)" /> runs date and stores its printed date in TODAY. It is useful
						for names, but a date alone is not unique if you run the script twice in one day. Choose and
						check a destination deliberately.
					</p>
					<p>
						<strong>A here-document:</strong> an agent may create a whole file by feeding several lines
						into cat. The quoted delimiter below prevents variables in the body from expanding while the
						file is being written:
					</p>
					<CodeBlock
						code={'cat <<\'EOF\' > greeting.sh\n#!/usr/bin/env bash\necho "Hello from the garden"\nEOF'}
						title="Real Bash · creates greeting.sh, replacing it if it exists"
					/>
					<p>
						The final EOF is the delimiter, not part of the saved file. The body is still code to
						read before running. The sandbox does not implement here-documents or command
						substitution.
					</p>
				</div>
			</details>
			<ChallengeActivity title="Ship All Three" part={6} id="ch-6-ship-all-three" />
			<p class="next-lesson">
				A useful script has a clear input, a clear result, and a clear response to failure. You do
				not need to make it short. Make it understandable enough that tomorrow you can explain each
				step.
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
	ol {
		list-style: decimal;
		padding-left: 1.4rem;
		color: var(--color-text-secondary);
		font-size: 0.93rem;
		line-height: 1.8;
		margin-bottom: 1rem;
	}
	li {
		margin-bottom: 0.5rem;
		padding-left: 0.15rem;
	}
	.next-lesson {
		padding: 1.1rem;
		border-radius: 0.7rem;
		background: var(--color-bg-secondary);
	}
</style>
