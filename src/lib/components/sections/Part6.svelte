<script lang="ts">
	import {
		FileCode2,
		Braces,
		DollarSign,
		Quote,
		CircleCheck,
		CircleX,
		CircleEqual
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-6" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={FileCode2}
			partLabel="Part 6"
			title="Scripts &amp; Automation: Teach the Machine Your Routine"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"Anything you have typed twice is something the machine should be doing for you."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			You have been writing one-line programs since <CourseLink to="part-4" /> without calling them that.
			A script is only the next step: those same commands, saved in a file, run whenever you like. This
			part turns you from someone who <em>types</em> commands into someone who
			<em>keeps</em>
			them — and teaches the exit-code logic that decides whether the next command runs at all. It is
			also the part that makes agent-written scripts stop being mysterious, because you will have written
			the same shapes yourself.
		</p>

		<Callout type="note">
			This is the last piece of ordinary bash you need. Everything after it is a specific toolkit —
			text surgery, processes, the network — and every one of those parts assumes you can read a
			small script and follow a <Code code="&amp;&amp;" /> chain.
		</Callout>

		<!-- 6.1 Your First Script -->
		<div id="section-6-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={FileCode2}
				title="6.1 Your First Script"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/first-script.webp"
					alt="Your First Script — commands saved into a file, made executable, and run with ./"
					caption="A script is just commands you saved — teach the file once, run it forever"
				/>
			</div>

			<Callout type="note">
				<strong>The chore:</strong> You keep typing the same three commands to back up your notes.
				And your AI agents keep leaving mysterious <Code code=".sh" /> files in your projects. Both problems
				have the same answer: a shell script is nothing more than commands saved in a file.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				That's the idea. Everything you've typed at the prompt this entire course could be pasted
				into a file and replayed. Let's build one — a tiny backup script — and hit every ingredient
				along the way.
			</p>

			<CodeBlock
				title="backup.sh"
				code={`#!/usr/bin/env bash
# Back up the notes folder with today's date in the name.

BACKUP_NAME="notes-backup-$(date +%F)"

mkdir -p backups
cp -r notes "backups/$BACKUP_NAME"
echo "Backed up notes to backups/$BACKUP_NAME"`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Three new things in eight lines:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<FileCode2 size={14} style="color: var(--color-primary);" />
						<span>The shebang: <Code code="#!/usr/bin/env bash" /></span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The first line of every script tells the system which program should interpret the rest
						of the file. <Code code="#!/usr/bin/env bash" />
						means "run this with bash, wherever bash lives on this machine" — which is why it's preferred
						over hard-coding a path like
						<Code code="/bin/bash" />. There's no magic in it:
						<Code code="env" /> is itself a program — the one that printed your variables in
						<CourseLink to="section-5-4" /> — and handed a name, it looks that name up on
						<Code code="PATH" /> and runs it. Everything after that first line is what you'd type at the
						prompt, and the
						<Code code="#" /> lines are notes to yourself, using the comment character from
						<CourseLink to="hero" />.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<DollarSign size={14} style="color: var(--color-primary);" />
						Variables
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="BACKUP_NAME=&quot;...&quot;" />
						creates a variable (no spaces around the
						<Code code="=" />
						— bash is strict about that), and
						<Code code="$BACKUP_NAME" /> uses it — the same dollar-sign expansion you met with environment
						variables in <CourseLink to="section-5-4" />. There's no
						<Code code="export" /> in front of it, so this one stays inside the script and no program
						the script launches will ever see it.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Quote size={14} style="color: var(--color-primary);" />
						Quoted paths
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="&quot;backups/$BACKUP_NAME&quot;" />
						— double quotes, by the rule in <CourseLink to="section-2-2" />: the variable still
						expands, and any spaces stay put. Quoting variables is the habit that separates scripts
						that work from scripts that work
						<em>until</em> a filename has a space in it.
					</p>
				</div>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Now make it runnable. Two steps, both from <CourseLink to="section-5-2" />: give the file
				execute permission, then run it with the explicit <Code code="./" /> path. The
				<Code code=".sh" /> on the end is convention for humans and editors — the execute bit and that
				first line are what actually run it.
			</p>

			<CodeBlock
				title="Make it executable, then run it"
				code={`chmod +x backup.sh
./backup.sh
# Backed up notes to backups/notes-backup-2026-07-12`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The <Code code="./" /> is there for the reason that section gave: a bare
				<Code code="backup.sh" /> sends the shell hunting through <Code code="PATH" />, and this
				folder deliberately isn't on it. Running it this way also starts a child shell, so the
				script's variables and any
				<Code code="cd" /> inside it are gone the moment it exits — exactly the distinction
				<CourseLink to="section-5-5" /> drew.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Arguments: <Code code="$1" /> makes it reusable
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Inside a script, <Code code="$1" />
				is the first argument the script was handed — the words after its name (<CourseLink
					to="section-1-3"
				/>), numbered in the order they arrived, so
				<Code code="$2" /> is the second. One change turns our notes-only script into a back-up-anything
				script:
			</p>

			<CodeBlock
				title="backup.sh, take two — back up anything"
				code={`#!/usr/bin/env bash
# Usage: ./backup.sh <folder>

TARGET="$1"
BACKUP_NAME="$TARGET-backup-$(date +%F)"

mkdir -p backups
cp -r "$TARGET" "backups/$BACKUP_NAME"
echo "Backed up $TARGET to backups/$BACKUP_NAME"`}
			/>

			<CodeBlock
				title="Same script, any folder"
				code={`./backup.sh notes
# Backed up notes to backups/notes-backup-2026-07-12

./backup.sh recipes
# Backed up recipes to backups/recipes-backup-2026-07-12`}
			/>

			<Callout type="note">
				<strong>What's <Code code="$(date +%F)" />?</strong> The
				<Code code="$( ... )" /> around a command means "run this, and drop its output right here" — command
				substitution. So
				<Code code="$(date +%F)" /> becomes today's date, and the backup name carries it. Agents lean
				on this constantly, so it's worth recognizing on sight. One caveat for the sandbox just below:
				this in-browser playground doesn't run <Code code="$( ... )" /> yet, so build your
				<Code code="backup.sh" /> there with a plain fixed name (the audit habit is the point). On your
				real machine, the dated version works exactly as shown.
			</Callout>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				How agents deliver a file: the here-doc
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Watch a coding agent create a file and you'll see one shape over and over — a whole file,
				delivered in a single command:
			</p>

			<CodeBlock
				title="A file in one command"
				code={`cat <<'EOF' > backup.sh
#!/usr/bin/env bash
mkdir -p backups
cp -r notes "backups/notes-$(date +%F)"
EOF`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Read the first line in three parts. <Code code="cat" /> you know. <Code code="<<'EOF'" />
				is a <strong style="color: var(--color-text);">here-document</strong>: "feed the lines that
				follow straight in as input, until a line that says exactly
				<Code code="EOF" />." And <Code code="> backup.sh" /> is the redirection from
				<CourseLink to="part-4" />, catching all of it in a file. The delimiter is any word you like
				— <Code code="EOF" /> ("end of file") is convention, not a keyword. The quotes around it are the
				single-quote rule from <CourseLink to="section-2-2" /> in a new costume: quoted, every <Code
					code="$"
				/> between the markers travels into the file
				<em>literally</em> — which is what you want when the script's own
				<Code code="$(date +%F)" /> should run later, not now. Unquoted, the shell expands them all before
				the file is even written. One habit to take from this: the lines between the markers
				<em>are</em> the file — audit them exactly the way you'd audit the script they're about to become.
				(The playground doesn't speak here-docs; this one is for reading agent transcripts, and for your
				real machine.)
			</p>

			<Callout type="important">
				<strong>Agents write scripts constantly.</strong> Ask an AI to "set up the project" or
				"automate the deploy" and odds are it produces a
				<Code code=".sh" />
				file. Until today that file was a black box you ran on trust. Now it's a short text file you can
				<Code code="cat" />, read line by line, and audit the way you would any command: name it,
				read every flag, check what it touches, ask whether it's reversible. That routine gets its
				own section in <CourseLink to="section-11-1" /> — because a script is just commands, and you read
				commands now.
			</Callout>

			<Callout type="tip">
				<strong>A script has a shape, and it reads in that order.</strong> The shebang tells you the
				language, the variables tell you the moving parts, and the verbs tell you the risk —
				<Code code="cp" /> copies,
				<Code code="rm" /> deletes, and
				<Code code="curl" /> fetches something off the network to run on your machine.
			</Callout>

			<h4
				id="first-script"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Automate the Backup
			</h4>
			<PlaygroundNote>
				Build <Code code="backup.sh" />
				right in the sandbox — write it line by line with
				<Code code="echo >>" />
				(this playground has no full-screen editor), then
				<Code code="chmod +x" />
				it and run it with
				<Code code="./backup.sh" />. Check your work with
				<Code code="cat" />
				and
				<Code code="ls backups" />.
			</PlaygroundNote>
			<LessonActivity title="Automate the Backup" scenarioId="first-script" id="first-script" />

			<p class="mt-6 mb-3 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				Now make it reusable. A hard-coded path backs up one folder; <Code code="$1" /> backs up whatever
				you name. Same audit habit applies — read the script before you run it.
			</p>
			<h4
				id="script-args"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: One Script, Any Folder
			</h4>
			<LessonActivity title="One Script, Any Folder" scenarioId="script-args" id="script-args" />

			<VibeBox
				prompts={[
					'Write a bash script that backs up a folder I pass as $1, and explain every line before I run it',
					'Here is a script an agent generated — walk me through what each line does and flag anything risky'
				]}
			/>
		</div>

		<!-- 6.2 Exit Codes & Chaining -->
		<div id="section-6-2" class="mb-8">
			<SectionHeader
				level="section"
				icon={Braces}
				title="6.2 Exit Codes &amp; Chaining"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/exit-codes.webp"
					alt="Exit Codes & Chaining — every command reports success or failure, and && listens"
					caption="Every command files a report when it finishes — 0 means success, anything else means trouble"
				/>
			</div>

			<Callout type="note">
				<strong>The goal:</strong> You want "run the tests, and deploy
				<em>only if they pass</em>" — but you've been eyeballing the output and deciding by hand.
				The shell has a built-in way for commands to report success or failure, and a grammar for
				acting on it.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Every command, when it finishes, hands the shell a number called its <strong
					style="color: var(--color-text);">exit code</strong
				>: <strong style="color: var(--color-text);">0 means success</strong>, and anything else (1
				to 255) means some flavor of failure. Which number it picks is each command's own business
				and means nothing outside that command, so there's no master table to go hunting for — only
				zero-or-not-zero travels between commands. You never see it unless you ask — the special
				variable
				<Code code="$?" /> holds the exit code of the last command:
			</p>

			<CodeBlock
				title="Asking how the last command went"
				code={`ls notes
# recipes.md  todo.md
echo $?
# 0            <- found it, success

ls no-such-folder
# ls: cannot access 'no-such-folder': No such file or directory
echo $?
# 2            <- non-zero: it failed, and it said so`}
			/>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				On its own that's a curiosity. It earns its keep with the three <strong
					style="color: var(--color-text);">chaining operators</strong
				>, which decide whether the next command runs based on the last one's exit code:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<CircleCheck size={14} style="color: var(--color-tip);" />
						<span><Code code="a && b" /> — "and then" (only on success)</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <Code code="b" />
						only if
						<Code code="a" /> exited 0. The workhorse: "do this, and if it worked, do that."
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<CircleX size={14} style="color: var(--color-warning);" />
						<span><Code code="a || b" /> — "or else" (only on failure)</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <Code code="b" />
						only if
						<Code code="a" /> failed. The fallback: "try this, or else do that."
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<CircleEqual size={14} style="color: var(--color-text-muted);" />
						<span><Code code="a ; b" /> — "and regardless"</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <Code code="b" />
						no matter what happened to
						<Code code="a" />. Just two commands on one line — no safety logic at all.
					</p>
				</div>
			</div>

			<CodeBlock
				title="The truth table, live"
				code={`true && echo "ran"        # ran        (true exits 0)
false && echo "ran"       #            (nothing - && skips after failure)
true || echo "ran"        #            (nothing - || skips after success)
false || echo "ran"       # ran

# The pattern you'll use every day:
npm test && npm run deploy
# tests pass  -> deploy runs
# tests fail  -> deploy never happens

# And the three-operator shape, read left to right:
npm test && npm run deploy || echo "something failed"`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="true" /> and <Code code="false" /> in the first four lines are real little programs
				whose entire job is to exit 0 and 1 — which is what makes that truth table runnable rather than
				illustrative. The last line has a catch. The chain runs left to right and neither operator outranks
				the other, so the <Code code="||" /> is not paired off against the
				<Code code="&amp;&amp;" /> — it fires whenever the command immediately before it failed. Tests
				pass, deploy fails, and the message prints anyway. Useful here, but it is not the one-branch-or-the-other
				shape it looks like. (<CourseLink to="section-10-1" /> covers what
				<Code code="npm run deploy" /> is running.)
			</p>

			<MermaidDiagram
				definition={`flowchart TD
  A(["npm test"]) --> B{"exit code?"}
  B -->|"0 — success"| C(["npm run deploy"])
  B -->|"non-zero — failure"| D(["echo 'something failed'"])
  classDef success stroke:#67b177,stroke-width:2px;
  classDef danger stroke:#9a3412,stroke-width:2px;
  class C success;
  class D danger;`}
				id="exit-code-chaining"
			/>
			<p class="mt-2 px-1 text-xs" style="color: var(--color-text-muted);">
				One number decides which branch runs — the same mechanism behind every CI pipeline
				(continuous integration: servers that build and test your code for you, automatically).
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The classic horror story: <Code code=";" />
				where
				<Code code="&&" /> belonged
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Why does the choice of connector matter so much? Because of lines like this one, which has
				genuinely destroyed home directories. The target sits in <Code code="/tmp" />, the machine's
				shared scratch space (<CourseLink to="section-2-2" />), so emptying a folder inside it is a
				perfectly ordinary thing to want:
			</p>

			<CodeBlock
				title="Two characters between routine and disaster"
				code={`# THE TRAP - a semicolon runs the rm NO MATTER WHAT:
cd /tmp/build ; rm -rf *
# If /tmp/build doesn't exist, cd FAILS... and rm -rf * runs
# anyway - in whatever directory you were standing in. Maybe ~.

# THE SAFE VERSION - && only deletes if the cd succeeded:
cd /tmp/build && rm -rf *
# cd fails -> the chain stops -> nothing is deleted.`}
			/>

			<Callout type="caution">
				<strong>Audit the connectors, not just the commands.</strong> When an AI proposes a chained
				one-liner, add a fifth question to those four:
				<em>what happens if the first command fails?</em>
				A
				<Code code=";" /> says "I don't care" — which is almost never true when the next command is destructive.
				If you see
				<Code code="cd <anywhere> ; rm" />, send it back and ask for <Code code="&&" />.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				And here's why this little number matters beyond one-liners: <strong
					style="color: var(--color-text);">the entire automated world runs on exit codes</strong
				>. CI pipelines decide pass-or-fail by the exit code of your test command — and GitHub,
				which stores projects and runs those tests every time someone sends up new code, draws its
				green checkmark to mean "everything exited 0." Coding agents watch exit codes the same way:
				run a command, read
				<Code code="$?" />, and decide whether to continue, retry, or fix. When your agent says "the
				tests failed, let me look" — it didn't read your mind. It read an exit code. Scripts join
				the same game: a script's own exit code is that of its last command, so scripts can chain
				scripts, and the whole tower stands on one convention. Zero means go.
			</p>

			<h4
				id="exit-codes"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Deploy Only on Green
			</h4>
			<PlaygroundNote>
				The tests here fail on the first run. Use <Code code="$?" />,
				<Code code="&&" />, and
				<Code code="||" /> to build a one-liner that deploys only when the tests pass — then fix the failing
				check and watch the same line take the other branch.
			</PlaygroundNote>
			<LessonActivity title="Deploy Only on Green" scenarioId="exit-codes" id="exit-codes" />

			<VibeBox
				prompts={[
					'Rewrite this chained command so the destructive step only runs if everything before it succeeded',
					'Explain what this one-liner does if the first command fails — trace it connector by connector'
				]}
			/>
		</div>

		<ChallengeActivity title="Ship All Three" part={6} id="ch-6-ship-all-three" />
	</div>
</section>
