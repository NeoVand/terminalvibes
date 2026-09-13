<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
</script>

<section id="part-13" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 13"
			title="Useful machinery, dependable scripts"
		/>
		<p class="lead">
			You can use a terminal well without knowing every part inside it. A little of the machinery is
			useful when something behaves strangely. After that optional tour, we will make scripts easier
			to trust by teaching them to check their work.
		</p>
		<p>
			If you want to keep building practical skills, jump to <a href="#section-13-2"
				>scripts that make decisions</a
			>. Come back to the machinery when you are curious. Both paths build on what you have already
			done.
		</p>
		<div id="section-13-1" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="13.1 A small map of the machinery" />
			<ExpandableImage
				src="{base}/images/under-the-hood.webp"
				alt="A cutaway diagram connects the keyboard, terminal, shell, and operating system."
				caption="Several cooperating parts turn a keypress into a command and a reply."
			/>
			<WorkflowSteps
				title="One command, several cooperating parts"
				steps={[
					{ label: 'Terminal', detail: 'Displays text and carries your input.' },
					{ label: 'Shell or program', detail: 'Interprets input and requests work.' },
					{ label: 'Operating system', detail: 'Provides process, file, and device services.' },
					{ label: 'Visible reply', detail: 'The program’s output returns to the display.' }
				]}
			/>

			<p>
				The <strong>terminal application</strong> displays text and sends your input. The
				<strong>shell</strong> reads command language and starts work. A program such as cat reads files
				using services supplied by the operating system. Its output travels back to the terminal to be
				displayed.
			</p>
			<p>
				That separation explains a familiar surprise: closing one terminal window is not the same
				operation as deleting the files you were working on. The window, running processes, and
				saved files have different lifetimes.
			</p>
			<div id="under-the-hood-chain">
				<p>
					<strong>The useful chain:</strong> your input → terminal connection → shell or foreground program
					→ operating-system services → program output → terminal display.
				</p>
			</div>
			<details>
				<summary>What connects a terminal to a shell?</summary>
				<p>
					On Unix-like systems, a pseudoterminal, or PTY, commonly provides the connection. It gives
					programs a terminal-like interface even though there is no physical teleprinter attached.
					This is why a shell can run in a desktop terminal, an editor panel, or an SSH session.
				</p>
				<p>
					The operating system's terminal settings can process input, echo typed characters, and
					turn some control characters into signals. Programs can change those settings. In
					canonical mode, input is commonly assembled into lines. Full-screen editors and
					interactive shells often use other modes so they can react to individual keys.
				</p>
				<p>
					There is no universal rule that the shell never sees individual keypresses. Modern
					line-editing libraries often read them to implement completion and history. The behavior
					you experience depends on the foreground program and the terminal settings it chose.
				</p>
				<p>
					This also explains why Ctrl+C has context. At a shell prompt it usually discards
					unfinished input. While a job runs, it commonly produces an interrupt for the foreground
					process group. Inside another application it may be handled differently. Check which
					program currently owns your attention.
				</p>
			</details>
			<div id="osc-markers">
				<details>
					<summary>Why output can move the cursor or change a title</summary>
					<p>
						Some output bytes are control sequences rather than printable letters. A terminal can
						interpret them as color, cursor movement, or a title change. Full-screen tools use these
						sequences to redraw a view instead of printing a new line for every update.
					</p>
					<p>
						Some shells and terminals also cooperate through markers that identify the prompt,
						command start, or command end. Those features depend on integration; they are not
						supplied by every terminal or every remote shell.
					</p>
					<p>
						When a display becomes confusing, first stop or exit the foreground program normally if
						you can. A fresh terminal window gives you a separate working shell. Native commands
						such as reset or stty sane can help with some changed terminal settings, but they are
						repair tools to learn in context, not commands to type blindly into every application.
					</p>
				</details>
			</div>
			<p class="reflection">
				If a program prints no text but creates a file, which parts of the chain changed? If a
				terminal changes color, does that mean a file changed?
			</p>
		</div>
		<div id="section-13-2" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="13.2 Write scripts that make decisions"
			/>
			<p>
				A useful script needs more than a list of commands. It must decide what to do when a file is
				missing, a destination already exists, or a command fails. We will add those decisions one
				at a time.
			</p>
			<ExpandableImage
				src="{base}/images/terminal-evolving.webp"
				alt="An old terminal connects to newer tools and branching workflows."
				caption="The tools change. Clear inputs, observable results, and explicit checks still help."
			/>
			<p class="native">
				<strong>This workshop uses Bash in your own terminal.</strong> The course sandbox supports a limited
				shell language; it is not a full Bash implementation. Use its Edit a file panel for the earlier
				first-script and script-args exercises. The conditionals, loops, temporary directories, and traps
				below belong in a native Bash practice folder.
			</p>
			<h4>First make a file you can save and run</h4>
			<p>
				Create a new practice folder and a notes.txt containing a sentence. Open <Code
					code="nano check-notes.sh"
				/> or your usual editor. Paste the small script below, save the file, and return to the terminal.
				With nano: Ctrl+O, Enter, then Ctrl+X.
			</p>
			<CodeBlock
				title="Save as check-notes.sh"
				code={`#!/usr/bin/env bash
if [ -f notes.txt ]; then
  printf 'Found notes.txt\\n'
else
  printf 'Create notes.txt first.\\n' >&2
  exit 1
fi`}
			/>
			<p>
				<Code code="if" /> runs a test and chooses a branch. <Code code="[ -f notes.txt ]" /> tests whether
				that path is a regular file. The spaces around the brackets matter: this is command syntax, not
				decorative punctuation. then starts the success branch; else starts the other branch; fi closes
				the decision.
			</p>
			<p>
				Run <Code code="bash check-notes.sh" />. This explicitly asks Bash to read the file; it does
				not require execute permission. Rename the practice notes file and run again. You should get
				the helpful error instead of a misleading success message. Put the file back when finished.
			</p>
			<p>
				<Code code="printf" /> formats output. In this example, backslash-n ends the line. <Code
					code="&gt;&amp;2"
				/> sends the message to standard error. <Code code="exit 1" /> reports a failing status to the
				caller. Inspect <Code code="echo $?" /> immediately afterwards; another command replaces the last
				status.
			</p>
			<h4>Give the script a filename</h4>
			<p>
				A script argument lets the caller choose the input. Read <Code code={`\${1:-notes.txt}`} /> as
				“use the first argument, or notes.txt if it is unset or empty.” Quote the variable when using
				it as a path so a space stays inside one filename.
			</p>
			<CodeBlock
				title="Replace the contents of check-notes.sh"
				code={`#!/usr/bin/env bash
source_file=\${1:-notes.txt}
if [ -f "$source_file" ]; then
  printf 'Found: %s\\n' "$source_file"
else
  printf 'Missing file: %s\\n' "$source_file" >&2
  exit 1
fi`}
			/>
			<p>
				Try <Code code="bash check-notes.sh 'garden notes.txt'" /> with a file of that name. The shell
				passes one argument, even though its name contains a space. Then try a missing name. Both paths
				through the script deserve testing.
			</p>
			<h4>Report success only after the work succeeds</h4>
			<p>
				A file can exist while a copy still fails: the destination may be unwritable, for example.
				Check the command that performs the work. This version also refuses to replace an existing
				destination in an ordinary single-user practice run.
			</p>
			<CodeBlock
				title="Save as backup-notes.sh — Bash on macOS/Linux"
				code={`#!/usr/bin/env bash
source_file=\${1:-notes.txt}
destination=\${2:-notes-backup.txt}

if [ ! -f "$source_file" ]; then
  printf 'Missing file: %s\\n' "$source_file" >&2
  exit 1
fi
if [ -e "$destination" ] || [ -L "$destination" ]; then
  printf 'Destination already exists: %s\\n' "$destination" >&2
  exit 1
fi
if cp -- "$source_file" "$destination"; then
  printf 'Saved a copy to %s\\n' "$destination"
else
  printf 'Copy failed. The original is still the source.\\n' >&2
  exit 1
fi`}
			/>
			<p>
				Run it once, inspect the copy, and run it again. The second run should refuse the existing
				name. Then try a missing source. This is a small practice script, not a locking system:
				another process could change a destination between the check and the copy. Work that needs
				concurrency guarantees requires stronger file-handling design.
			</p>
			<h4>Repeat a small operation with a loop</h4>
			<p>
				A for loop assigns one value at a time to a variable and repeats its body. Start with a
				read-only loop so you can see what it selects before adding changes.
			</p>
			<CodeBlock
				title="Save as list-notes.sh"
				code={`#!/usr/bin/env bash
for file in ./*.txt; do
  [ -f "$file" ] || continue
  printf 'Would inspect: %s\\n' "$file"
done`}
			/>
			<p>
				<Code code="./*.txt" /> asks the shell for matching entries here. Bash normally leaves an unmatched
				glob unchanged, so the regular-file check skips it when there are no matches. continue moves to
				the next iteration. Each quoted value remains one argument, including a filename with spaces.
				This is why a loop over filenames is preferable to splitting the output of ls.
			</p>
			<p>
				Try a folder with two text files, a filename with a space, and no text files. Explain each
				result. Once selection is correct, replace the printed preview with the operation you
				actually need and check that operation's status.
			</p>
			<h4>Let ShellCheck review the details</h4>
			<p>
				After installing ShellCheck, run <Code code="shellcheck backup-notes.sh" />. It points out
				common shell mistakes, including quoting and variable problems. Read each explanation; a
				warning is a chance to understand a rule. <Code code="bash -n backup-notes.sh" /> checks Bash
				syntax without running the script.
			</p>
			<p>
				Neither check proves that you chose the correct files or that a backup can be restored. Test
				missing inputs, existing outputs, spaces, and command failures in disposable folders. The <a
					href="https://www.shellcheck.net/">ShellCheck project</a
				> provides the tool and its explanations.
			</p>
			<details>
				<summary>Optional depth: strict mode and cleanup</summary>
				<p>
					You will see <Code code="set -euo pipefail" /> in Bash scripts. These are useful options when
					you understand their behavior. They are not required boilerplate for every script, and they
					do not replace explicit error handling.
				</p>
				<ul>
					<li>
						<Code code="-e" /> can exit after a failing command, but has exceptions for tests, lists,
						and other contexts. It does not simply mean “stop at every error.”
					</li>
					<li>
						<Code code="-u" /> reports many uses of unset variables. Use intentional defaults for optional
						inputs.
					</li>
					<li>
						<Code code="pipefail" /> changes a pipeline's status to the rightmost failing stage's status,
						if one failed. Without it, the final stage normally determines the status.
					</li>
				</ul>
				<p>
					When you create temporary work, arrange cleanup around that specific resource. This
					example creates a fresh directory before registering its cleanup. An EXIT handler covers
					ordinary exits; separate signal handlers exit intentionally so cleanup follows.
				</p>
				<CodeBlock
					title="Optional Bash example: one owned temporary directory"
					code={`#!/usr/bin/env bash
scratch=$(mktemp -d) || exit 1
cleanup() {
  rm -rf -- "$scratch"
}
trap cleanup EXIT
trap 'exit 130' INT
trap 'exit 143' TERM

printf 'Temporary work lives in %s\\n' "$scratch"`}
				/>
				<p>
					Keep the directory variable private to this job and do not reassign it to valuable work. A
					cleanup trap cannot handle a power loss or SIGKILL. Test normal completion, failure, and
					interruption before relying on a script unattended. The <a
						href="https://tiswww.case.edu/php/chet/bash/bashref.html">Bash reference manual</a
					> explains the precise rules.
				</p>
			</details>
			<ChallengeActivity title="What the transcript knows" part={13} id="ch-13-exit-codes" />
			<p class="reflection">
				<strong>Your next automation:</strong> choose one boring task you already perform correctly by
				hand. Save those steps, accept a clearly named input, check failure cases, and verify the output.
				Add scheduling only after you can trust an individual run.
			</p>
		</div>
	</div>
</section>

<style>
	.chapter-copy {
		color: var(--color-text-secondary);
		font-size: 1rem;
		line-height: 1.85;
	}
	.chapter-copy p {
		margin: 1rem 0;
	}
	.chapter-copy .lead {
		font-size: 1.1rem;
	}
	.lesson {
		margin: 3rem 0;
		scroll-margin-top: 6rem;
	}
	.chapter-copy h4 {
		color: var(--color-text);
		font: 600 1.1rem/1.5 var(--font-heading);
		margin: 1.8rem 0 0.7rem;
		scroll-margin-top: 6rem;
	}
	.chapter-copy strong {
		color: var(--color-text);
	}
	.chapter-copy ul {
		padding-left: 1.5rem;
		margin: 1rem 0;
	}
	.chapter-copy ul {
		list-style: disc;
	}
	.chapter-copy li {
		margin: 0.55rem 0;
	}
	.chapter-copy a {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	.chapter-copy details {
		border: 1px solid var(--color-border);
		border-radius: 0.75rem;
		padding: 1rem;
		margin: 1.5rem 0;
	}
	.chapter-copy summary {
		cursor: pointer;
		font-weight: 600;
		color: var(--color-text);
	}
	.chapter-copy .native {
		border-left: 3px solid var(--color-primary);
		padding-left: 1rem;
	}
	.chapter-copy .reflection {
		background: var(--color-bg-secondary);
		padding: 1rem;
		border-radius: 0.6rem;
	}
</style>
