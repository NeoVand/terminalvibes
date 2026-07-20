<script lang="ts">
	import { Shield, ScrollText, KeyRound, Lock, AtSign, FileText, Play } from 'lucide-svelte';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import { base } from '$app/paths';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-5" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Shield}
			partLabel="Part 5"
			title="Permissions &amp; Environment: How the Machine Decides"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"'Permission denied' and 'command not found' aren't errors. They're the system explaining its
			rules — once you can read them."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			Every terminal novice hits the same two walls: a script that refuses to run, and a command the
			shell claims doesn't exist. Both have one-line fixes — but only if you understand the two
			systems behind them. This part decodes <strong style="color: var(--color-text);"
				>permissions</strong
			>
			(who may read, write, and run each file) and the
			<strong style="color: var(--color-text);">environment</strong> (the invisible settings every command
			inherits). After this, those two error messages become friendly signposts.
		</p>

		<Callout type="note">
			Unix was built for many people sharing one computer, so every file carries a tiny rulebook
			about who can do what. Fifty years later you're probably the only human on your laptop — but
			the AI agents running commands on it are "users" too, which makes these rules more relevant
			than ever.
		</Callout>

		<!-- 5.1 Reading ls -l -->
		<div id="section-5-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={ScrollText}
				title="5.1 Reading `ls -l` — The 10-Character Rulebook"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You met <Code code="ls -l" />
				back in <CourseLink to="part-2" /> and politely ignored the cryptic string at the start of each
				line. Time to decode it — those 10 characters are the entire permission system in miniature.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/reading-ls-l.webp"
					alt="Reading ls -l — decoding the 10-character permission string"
					caption="Ten characters, three audiences: the file's complete rulebook at a glance"
				/>
			</div>

			<CodeBlock
				title="A long listing, line by line"
				code={`ls -l
-rw-r--r--  1 vibe  staff   214 Jul 10 09:12 notes.txt
-rwxr-xr-x  1 vibe  staff   512 Jul 10 09:30 deploy.sh
drwxr-xr-x  4 vibe  staff   128 Jul  9 18:02 projects`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Take <Code code="-rwxr-xr-x" />
				apart and it's four pieces: one type character, then three groups of three —
				<strong style="color: var(--color-text);"
					>the same three questions asked of three audiences</strong
				>:
			</p>

			<div class="my-6 rounded-lg p-5" style="background: var(--color-bg-secondary);">
				<div class="flex flex-wrap items-stretch justify-center gap-2">
					<div class="flex flex-col items-center gap-2">
						<span
							class="rounded-md px-3 py-2 text-lg font-bold"
							style="font-family: var(--font-mono); background: var(--color-bg-tertiary); color: var(--color-text-muted);"
							>-</span
						>
						<span class="text-[11px]" style="color: var(--color-text-muted);"
							>type<br /><Code code="-" /> file,
							<Code code="d" /> dir</span
						>
					</div>
					<div class="flex flex-col items-center gap-2">
						<span
							class="rounded-md px-3 py-2 text-lg font-bold"
							style="font-family: var(--font-mono); background: var(--color-tip-bg); color: var(--color-tip);"
							>rwx</span
						>
						<span class="text-center text-[11px]" style="color: var(--color-text-muted);"
							><strong style="color: var(--color-tip);">user</strong><br />the owner (you)</span
						>
					</div>
					<div class="flex flex-col items-center gap-2">
						<span
							class="rounded-md px-3 py-2 text-lg font-bold"
							style="font-family: var(--font-mono); background: var(--color-note-bg); color: var(--color-note);"
							>r-x</span
						>
						<span class="text-center text-[11px]" style="color: var(--color-text-muted);"
							><strong style="color: var(--color-note);">group</strong><br />your team</span
						>
					</div>
					<div class="flex flex-col items-center gap-2">
						<span
							class="rounded-md px-3 py-2 text-lg font-bold"
							style="font-family: var(--font-mono); background: var(--color-warning-bg); color: var(--color-warning);"
							>r-x</span
						>
						<span class="text-center text-[11px]" style="color: var(--color-text-muted);"
							><strong style="color: var(--color-warning);">other</strong><br />everyone else</span
						>
					</div>
				</div>
				<p class="mt-4 text-center text-[12px]" style="color: var(--color-text-secondary);">
					In each triad: <Code code="r" /> = read,
					<Code code="w" /> = write,
					<Code code="x" /> = execute, and
					<Code code="-" /> = "no, this one's off."
				</p>
			</div>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				So <Code code="-rwxr-xr-x" />
				reads as: a regular file; the owner can read, write, and run it; the group can read and run it;
				everyone else can read and run it. And
				<Code code="-rw-r--r--" />
				is a typical document: only the owner can edit, everyone can read, nobody can execute.
			</p>

			<Callout type="tip">
				For a <strong>directory</strong>, the letters shift meaning slightly:
				<Code code="r" />
				= list its contents,
				<Code code="w" />
				= create or delete files inside it, and
				<Code code="x" />
				= enter it with
				<Code code="cd" />. That's why directories almost always carry the
				<Code code="x" />.
			</Callout>

			<VibeBox
				prompts={[
					'Run ls -l in this folder and explain what each permission string allows',
					"What does -rw-r--r-- mean, and why can't I execute a file with those permissions?"
				]}
			/>
		</div>

		<!-- 5.2 chmod -->
		<div id="section-5-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={KeyRound}
				title="5.2 chmod — Changing the Rules"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Here's the classic novice moment: you save a script, try to run it, and the terminal snaps
				back <strong style="color: var(--color-text);">"Permission denied."</strong> Nothing is
				broken. The file simply doesn't have its
				<Code code="x" />
				bit yet — files are never executable by default.
				<Code code="chmod" /> ("change mode") flips the switch.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/chmod.webp"
					alt="chmod — granting a script the execute permission it needs to run"
					caption="chmod +x flips the execute switch — the one-line fix for 'Permission denied'"
				/>
			</div>

			<Callout type="note">
				<strong>The situation:</strong> You (or your AI) created
				<Code code="backup.sh" />, but running it fails with
				<Code code="permission denied" />.
			</Callout>

			<CodeBlock
				title="The fix, start to finish"
				code={`./backup.sh
bash: ./backup.sh: Permission denied

ls -l backup.sh
-rw-r--r--  1 vibe  staff  164 Jul 11 10:04 backup.sh   # no x anywhere

chmod +x backup.sh          # Grant execute permission
ls -l backup.sh
-rwxr-xr-x  1 vibe  staff  164 Jul 11 10:04 backup.sh   # x appears

./backup.sh                 # Now it runs
Backing up projects/ ... done.`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You'll also see chmod used with <strong style="color: var(--color-text);">numbers</strong> —
				<Code code="chmod 755" />,
				<Code code="chmod 644" />
				— in every tutorial and AI suggestion. Each digit is one audience (user, group, other), built
				from
				<Code code="r=4" />,
				<Code code="w=2" />,
				<Code code="x=1" />. But you don't need the arithmetic — in practice there are exactly two
				recipes worth knowing:
			</p>

			<div class="mb-4 grid gap-4 sm:grid-cols-2">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-important);"
					>
						<Play size={14} />
						<span><Code code="755" /> — scripts &amp; directories</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="rwxr-xr-x" />: you do everything, others read and run. The standard for
						anything executable.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-note);"
					>
						<FileText size={14} />
						<span><Code code="644" /> — regular files</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="rw-r--r--" />: you edit, others read, nobody executes. The standard for
						documents, configs, and code.
					</p>
				</div>
			</div>

			<Callout type="caution">
				If a tutorial or an AI ever suggests <Code code="chmod 777" />
				— everyone may read, write, <em>and</em> execute — treat it as a red flag, not a fix. It
				"solves" permission errors by turning the rulebook off entirely, and
				<Code code="chmod -R 777" />
				does it to a whole tree. There is almost always a narrower fix — usually
				<Code code="+x" /> on one file.
			</Callout>

			<h4
				id="fix-permissions"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: The Script Won't Run
			</h4>
			<PlaygroundNote>
				A <Code code="deploy.sh" />
				script is sitting in the playground refusing to run. Diagnose it with
				<Code code="ls -l" />, grant the missing permission with
				<Code code="chmod +x" />, then run it with
				<Code code="./deploy.sh" />.
			</PlaygroundNote>
			<LessonActivity
				title="The Script Won't Run"
				scenarioId="fix-permissions"
				id="fix-permissions"
			/>

			<VibeBox
				prompts={[
					"My script says permission denied when I run it — what's wrong and what's the safest fix?",
					'Make setup.sh executable and run it, but show me its contents first'
				]}
			/>
		</div>

		<!-- 5.3 sudo -->
		<div id="section-5-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Lock}
				title="5.3 sudo — Borrowed Superpowers"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Some things your everyday account simply may not touch: installing system-wide software,
				editing files outside your home folder, managing services. For those, there's <Code
					code="sudo"
				/>
				— "superuser do." It runs <strong style="color: var(--color-text);">one command</strong> as
				<strong style="color: var(--color-text);">root</strong>, the administrator account that no
				rule applies to.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/sudo.webp"
					alt="sudo — temporarily borrowing administrator powers for a single command"
					caption="sudo lends you root's powers for exactly one command — handle with respect"
				/>
			</div>

			<CodeBlock
				title="What sudo looks like in the wild"
				code={`apt install htop                 # Linux: install software system-wide
E: Permission denied

sudo apt install htop            # Same command, run as root
[sudo] password for vibe:        # Type your password — nothing appears. Normal!
Setting up htop ... done.`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two things to know before you ever need it. First, <strong style="color: var(--color-text);"
					>the password prompt shows nothing while you type</strong
				>
				— no dots, no asterisks. Every beginner assumes their keyboard broke; it's just a privacy habit
				from 1970 that stuck. Second, you need sudo far less than the internet implies: everything inside
				your home folder is already yours, and macOS users installing via Homebrew usually don't need
				it at all. If a command fails inside
				<Code code="~" />, the answer is almost never
				<Code code="sudo" />
				— it's a wrong path or a missing
				<Code code="+x" />.
			</p>

			<Callout type="note">
				<strong>Windows note:</strong> Windows 11 (24H2 and later) now ships a real built-in
				<Code code="sudo" />
				command — turn it on under Settings → System → For developers → "Enable sudo". So everything in
				this section transfers to native Windows too, not just WSL; inside WSL, sudo has always worked
				exactly as described here.
			</Callout>

			<Callout type="caution">
				<strong>Never sudo a command you don't understand — especially one an AI wrote.</strong>
				Every safety net you've learned assumes the system can say "no" to you. sudo removes the "no."
				An AI-suggested
				<Code code="sudo rm -rf" />
				with the wrong path doesn't delete your project — it can delete your
				<em>operating system</em>. This isn't hypothetical: 2025 and 2026 saw repeated,
				well-documented incidents of AI coding agents running destructive commands on real systems —
				<CourseLink to="part-11" /> dissects them. The rule: when a command fails with "permission denied,"
				don't reflexively re-run it with sudo. First ask <em>why</em> it was denied — read the command,
				check the path, ask your AI to explain each flag. Escalate only when you can narrate what the
				command does.
			</Callout>

			<Callout type="note">
				The playground deliberately has no real <Code code="sudo" /> — try it there and it will politely
				explain itself. Everything in this course's sandbox already runs inside your own pretend home
				folder, where you don't need superpowers. Exactly like real life.
			</Callout>

			<VibeBox
				prompts={[
					'This install command failed with permission denied — explain why before suggesting sudo',
					'You proposed a command with sudo in it. Walk me through every flag and what could go wrong'
				]}
			/>
		</div>

		<!-- 5.4 Environment Variables -->
		<div id="section-5-4" class="mb-14">
			<SectionHeader
				level="section"
				icon={AtSign}
				title="5.4 Environment Variables — The Invisible Settings"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every command you run inherits a set of named values called the <strong
					style="color: var(--color-text);">environment</strong
				>: your username, your home folder, your preferred editor, and — most importantly — where
				the shell should look for commands. You've been using them all along without noticing;
				<Code code="cd" />
				with no arguments reads
				<Code code="$HOME" /> to know where to take you.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/env-vars.webp"
					alt="Environment variables — named values every command inherits from the shell"
					caption="The environment: a backpack of named values every command carries"
				/>
			</div>

			<CodeBlock
				title="Reading and setting variables"
				code={`echo $HOME                # $NAME reads a variable
/home/vibe

echo $USER
vibe

env | head -4             # env lists everything currently set
HOME=/home/vibe
USER=vibe
PATH=/usr/local/bin:/usr/bin:/bin
SHELL=/bin/bash

export EDITOR=nano        # Set one (this shell session only!)
echo $EDITOR
nano`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Note the asymmetry: you write <Code code="export EDITOR=nano" />
				with no dollar sign, but read it back as
				<Code code="$EDITOR" />. And exported variables evaporate when you close the terminal —
				making them permanent is the next section's job.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The variable that explains a thousand error messages is <strong
					style="color: var(--color-text);">PATH</strong
				>: a colon-separated list of directories. When you type
				<Code code="python" />, the shell walks that list in order, looking in each directory for an
				executable file with that name. First match wins; no match anywhere means the infamous:
			</p>

			<CodeBlock
				title="'command not found', demystified"
				code={`echo $PATH
/usr/local/bin:/usr/bin:/bin

pyhton --version
bash: pyhton: command not found      # 1. Or it's just a typo...

python --version
bash: python: command not found      # 2. ...or it's not installed...
                                     # 3. ...or it's installed somewhere
                                     #    that isn't on PATH.

which ls                             # 'which' shows where a command lives
/bin/ls
which python                         # Silence/nothing = not on PATH`}
			/>

			<Callout type="tip">
				"Command not found" always means exactly one of three things: a <strong>typo</strong>, a
				tool that's <strong>not installed</strong>, or a tool installed
				<strong>outside PATH</strong>. Check them in that order —
				<Code code="which" />
				and
				<Code code="echo $PATH" />
				settle it in seconds. This is also why installers keep telling you to "add something to your PATH":
				they put the tool in a folder your shell doesn't search yet.
			</Callout>

			<Callout type="caution">
				<strong>One kind of variable needs extra care: secrets.</strong> API keys are usually handed
				to programs as environment variables, and the tempting move — typing
				<Code code="export API_KEY=sk-..." /> straight into your terminal — writes the key into your shell
				history, where it stays. <CourseLink to="part-9" />.4 covers the safe pattern: keep keys in
				a
				<Code code=".env" /> file, lock it with <Code code="chmod 600" />, and reference
				<Code code="$API_KEY" /> instead of the value.
			</Callout>

			<h4
				id="path-repair"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: command not found
			</h4>
			<PlaygroundNote>
				A tool called <Code code="greet" />
				is installed somewhere in the playground, but typing
				<Code code="greet" />
				only gets you "command not found." Inspect
				<Code code="echo $PATH" />, hunt the executable down with
				<Code code="find" />, and run it — by its full path, or by fixing PATH.
			</PlaygroundNote>
			<LessonActivity title="command not found" scenarioId="path-repair" id="path-repair" />

			<VibeBox
				prompts={[
					'I installed a tool but the terminal says command not found — diagnose it step by step',
					'Show me my PATH as a readable list and tell me which directory each command I use comes from'
				]}
			/>
		</div>

		<!-- 5.5 Your Shell Config -->
		<div id="section-5-5" class="mb-8">
			<SectionHeader
				level="section"
				icon={FileText}
				title="5.5 Your Shell Config — Make It Stick"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Everything you've customized so far — exported variables, the aliases you're about to meet —
				dies with the terminal window. The fix is the <strong style="color: var(--color-text);"
					>shell config file</strong
				>: a plain text file of commands your shell runs automatically every time it starts. It's
				<Code code="~/.bashrc" />
				if your shell is bash, and
				<Code code="~/.zshrc" />
				for zsh — the macOS default. (A hidden dotfile, which is why
				<Code code="ls -a" /> from <CourseLink to="part-2" /> is how you spot it.)
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/shell-config.webp"
					alt="Shell config — the .bashrc or .zshrc file that runs every time a shell starts"
					caption="Your .bashrc / .zshrc runs at every shell startup — customizations live here"
				/>
			</div>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The customization you'll use most is the <strong style="color: var(--color-text);"
					>alias</strong
				> — a personal shorthand for a longer command:
			</p>

			<CodeBlock
				title="Aliases: your own shorthand"
				code={`alias ll='ls -lh'         # Define it
ll                        # Use it — the shell expands ll to ls -lh
-rw-r--r--  1 vibe staff 1.2K Jul 11 09:14 notes.txt
-rwxr-xr-x  1 vibe staff  512 Jul 10 09:30 deploy.sh

alias                     # List every alias currently defined`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Typed at the prompt, an alias lasts only for that session — put it in your config file to
				keep it forever. Here's a battle-tested starter set to paste into <Code code="~/.zshrc" />
				(or
				<Code code="~/.bashrc" />):
			</p>

			<CodeBlock
				title="Starter aliases for your config file"
				code={`# --- TerminalVibes starter aliases ---
alias ll='ls -lh'               # Detailed listing, human-readable sizes
alias la='ls -lah'              # ...including hidden dotfiles
alias ..='cd ..'                # Hop up one level
alias ...='cd ../..'            # Hop up two
alias gs='git status'           # You will type this constantly
alias grep='grep --color=auto'  # Highlight what matched`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One last piece: the config file only runs at <em>startup</em>, so a freshly edited file
				changes nothing in your current terminal. Either open a new window — or reload it in place
				with
				<Code code="source" />:
			</p>

			<CodeBlock
				title="Apply config changes to the current shell"
				code={`source ~/.zshrc     # Re-run the config file right here, right now
# (bash users: source ~/.bashrc)`}
			/>

			<Callout type="tip">
				Your shell config is just a shell script — every line in it is a command you could type by
				hand. That means everything in this course applies to it: read it with <Code code="cat" />,
				search it with
				<Code code="grep" />, and when an installer says "we added a line to your .zshrc," you can
				open it and see exactly what changed. No magic, ever.
			</Callout>

			<h4
				id="alias-workshop"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Make Your Shortcuts
			</h4>
			<PlaygroundNote>
				Time to build your own shorthand. Define an alias with <Code code="alias" />, use it, list
				your aliases, and append your favorite to
				<Code code="~/.bashrc" />
				with
				<Code code="echo >>" /> so it would survive a restart.
			</PlaygroundNote>
			<LessonActivity title="Make Your Shortcuts" scenarioId="alias-workshop" id="alias-workshop" />

			<VibeBox
				prompts={[
					'Suggest five aliases based on the commands I run most, and add them to my .zshrc',
					'Something in my shell config is slowing down my terminal startup — help me find it'
				]}
			/>
		</div>
	</div>
</section>
