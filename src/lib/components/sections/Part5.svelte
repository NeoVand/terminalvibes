<script lang="ts">
	import { Shield, ScrollText, KeyRound, Lock, AtSign, FileText } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
</script>

<section id="part-5" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Shield}
			partLabel="Part 5"
			title="Permissions and Settings: Understand the Refusal"
		/>
		<p class="lead">
			A file can exist and still refuse to run. A program can be installed and still be hard for
			your shell to find. Let’s separate those two problems.
		</p>
		<p>
			<strong>Permissions</strong> describe what an account may do with a file. The
			<strong>environment</strong> supplies named settings to programs. We’ll inspect each before changing
			it, so a fix has a reason behind it.
		</p>

		<div id="section-5-1" class="lesson-section">
			<SectionHeader level="section" icon={ScrollText} title="5.1 Read a File’s Permissions" />
			<p>
				Ask for a long listing of one file. This example is a small script—a file of commands that
				we will learn to write in Part 6:
			</p>
			<CommandTranscript
				command="ls -l backup.sh"
				output="-rw-r--r-- 1 vibe staff 214 Jul 12 08:30 backup.sh"
			/>
			<p>
				The owner’s account name is vibe. The group is staff: a named collection of accounts. The
				letters at the start describe permissions for the owner, the group, and everyone else.
			</p>
			<div class="steps">
				<span><code>-</code><small>Regular file</small></span><span
					><code>rw-</code><small>Owner: read and write</small></span
				><span><code>r--</code><small>Group: read</small></span><span
					><code>r--</code><small>Others: read</small></span
				>
			</div>
			<p>
				<Code code="r" /> permits reading, <Code code="w" /> permits writing, and <Code code="x" /> permits
				executing a file as a program. A dash in one of those positions means that permission is absent.
				The initial character describes the file type: <Code code="-" /> for a regular file, <Code
					code="d"
				/> for a directory, or <Code code="l" /> for a symbolic link.
			</p>
			<ExpandableImage
				src="{base}/images/reading-ls-l.webp"
				alt="A long file listing divided into file type, owner, group, and other permissions."
				caption="Read the permissions in three groups, not as one mysterious word."
			/>
			<p>
				The owner is not necessarily you. Use <Code code="whoami" /> to check your account and <Code
					code="id"
				/> to see its groups. A process—including an AI agent—usually acts with the account that started
				it. Merely calling a program an “agent” does not give it a separate restricted account.
			</p>
			<h4>Directories use the letters differently</h4>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Permission</th><th>On a directory</th></tr></thead><tbody
						><tr><td>Read (r)</td><td>List the names inside.</td></tr><tr
							><td>Execute (x)</td><td
								>Traverse the directory to access a named entry; cd needs this.</td
							></tr
						><tr
							><td>Write (w)</td><td
								>Change the directory’s entries, usually together with execute permission.</td
							></tr
						></tbody
					>
				</table>
			</div>
			<p>
				Removing a file usually depends on permissions on its containing directory, not just the
				file’s own write bit. That is why making a file read-only is not a complete deletion lock.
				Real systems can also apply access-control lists, sticky bits, and other rules beyond this
				basic view; the sandbox models only a small part of that system.
			</p>
		</div>

		<div id="section-5-2" class="lesson-section">
			<SectionHeader
				level="section"
				icon={KeyRound}
				title="5.2 Change Only the Permission You Need"
			/>
			<p>
				Suppose you try <Code code="./backup.sh" /> and see Permission denied. First read the file with
				cat and inspect it with <Code code="ls -l backup.sh" />. If it is the script you intended to
				run, you own it, and its owner permissions lack x, add that one permission:
			</p>
			<CodeBlock
				code={'cat backup.sh\nls -l backup.sh\nchmod u+x backup.sh\nls -l backup.sh\n./backup.sh'}
				title="Inspect the script, grant owner execution, then try it"
			/>
			<p>
				<Code code="chmod" /> changes a file’s permission mode. <Code code="u+x" /> means “add execute
				for the owner.” It does not mean “make everything readable and writable.” The leading <Code
					code="./"
				/> names a file in your current folder explicitly.
			</p>
			<ExpandableImage
				src="{base}/images/chmod.webp"
				alt="A single execute permission being added to a script."
				caption="A narrow change is easier to understand and verify."
			/>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Form</th><th>Meaning</th></tr></thead><tbody
						><tr
							><td><Code code="chmod u+x backup.sh" /></td><td>Add owner execute permission.</td
							></tr
						><tr
							><td><Code code="chmod go-w notes.txt" /></td><td
								>Remove group and other write permission.</td
							></tr
						><tr
							><td><Code code="chmod 600 private-notes.txt" /></td><td
								>Set owner read/write; no group or other permission.</td
							></tr
						><tr
							><td><Code code="chmod 644 notes.txt" /></td><td
								>Set owner read/write, group/other read.</td
							></tr
						><tr
							><td><Code code="chmod 755 backup.sh" /></td><td
								>Set owner read/write/execute, group/other read/execute.</td
							></tr
						></tbody
					>
				</table>
			</div>
			<p>
				The numeric forms replace the ordinary permission bits rather than just adding one. Each
				digit combines read (4), write (2), and execute (1): 6 is 4+2. Choose the intended access;
				there is no single correct permission for every document or script.
			</p>
			<p>
				You will see <Code code="chmod +x" /> without an audience. On real Unix systems, the current
				<strong>umask</strong>
				influences which permissions may be changed when the audience is omitted. It is not unconditionally
				identical to <Code code="a+x" />. Writing <Code code="u+x" /> makes our intention clear.
			</p>
			<p>
				Permission denied can have other causes, including a parent folder you cannot traverse or a
				filesystem that disallows execution. If the listing does not support the missing-x
				diagnosis, investigate that cause instead. Broad changes such as <Code
					code="chmod -R 777"
				/> give access to many files and rarely explain or correctly fix the underlying problem.
			</p>
			<h4 id="fix-permissions">Try it: diagnose the script that will not run</h4>
			<p>
				Read deploy.sh, inspect its permissions, add owner execution, and run it. “Deploy” here is a
				simulated task; nothing is published to the internet.
			</p>
			<LessonActivity
				title="The Script Won't Run"
				scenarioId="fix-permissions"
				id="fix-permissions"
			/>
		</div>

		<div id="section-5-3" class="lesson-section">
			<SectionHeader
				level="section"
				icon={Lock}
				title="5.3 sudo: Run One Command with More Authority"
			/>
			<p>
				Some tasks require an administrator’s authority. <Code code="sudo" /> runs an allowed command
				as another account, usually the administrator account called root. Your system’s policy decides
				whether you are allowed to use it.
			</p>
			<p>
				A common example is installing a system package on a Debian or Ubuntu machine. This is a
				real-machine example, not a setup step required for this lesson:
			</p>
			<CodeBlock
				code="sudo apt install htop"
				title="Example on Debian/Ubuntu · installs the htop process viewer"
			/>
			<p>
				If sudo asks for your password, the terminal may show no dots or letters while you type.
				That is normal. Type your account password and press Enter. Read any package changes the
				installer proposes before accepting them.
			</p>
			<ExpandableImage
				src="{base}/images/sudo.webp"
				alt="A command temporarily using administrator authority."
				caption="Understand the specific task before granting it more authority."
			/>
			<p>
				Do not add sudo automatically after an error. A misspelled path, a missing program, and a
				missing execute bit are different problems. Running the same mistake with more authority can
				make a larger unwanted change.
			</p>
			<p>
				Before using it, be able to say what the command will change, why your normal account cannot
				do that, and whether the path is correct. Administrative access is powerful, but it does not
				bypass every operating-system protection.
			</p>
			<p>
				The playground does not grant administrator access. Native Windows elevation also follows
				different rules from sudo inside WSL; this section’s Linux command should not be copied into
				a PowerShell tab.
			</p>
		</div>

		<div id="section-5-4" class="lesson-section">
			<SectionHeader
				level="section"
				icon={AtSign}
				title="5.4 Variables and the Places Commands Are Found"
			/>
			<p>
				A variable is a named value. The shell already has one called HOME containing your home
				folder’s path. A dollar sign asks for its value:
			</p>
			<CommandTranscript command="echo &quot;$HOME&quot;" output="/home/vibe" />
			<p>Now try one of your own:</p>
			<CodeBlock
				code={'PLANT="basil"\necho "$PLANT"\necho "Today I planted $PLANT"'}
				title="Name a value, then use it in a message"
			/>
			<p>
				There are no spaces around <Code code="=" /> when assigning a shell variable. The name on the
				left has no dollar sign. The dollar sign is for reading its value later. Double quotes preserve
				spaces in the resulting value.
			</p>
			<ExpandableImage
				src="{base}/images/env-vars.webp"
				alt="Named settings passed from a shell to the programs it starts."
				caption="A variable has a name and a value; export passes a setting to child programs."
			/>
			<p>
				A newly assigned variable is normally local to this shell. <Code code="export" /> includes it
				in the <strong>environment</strong> given to programs started afterward:
			</p>
			<CodeBlock
				code={'export EDITOR=nano\necho "$EDITOR"'}
				title="Set a preferred editor for programs that read this setting"
			/>
			<p>
				This does not install nano or change every program’s editor. A program must actually consult
				EDITOR for it to matter. Assigning a new value to a variable that was already exported keeps
				it exported.
			</p>
			<p>
				Each program receives a copy of the environment. It cannot change its parent shell’s
				variables by changing its own copy. A new terminal does not automatically inherit settings
				you just typed into an unrelated terminal window.
			</p>
			<h4>PATH: the shell’s search list for programs</h4>
			<CodeBlock
				code={'echo "$PATH"\ntype ls\nwhich ls'}
				title="Inspect the search path and how ls is resolved"
			/>
			<p>
				PATH contains directory names separated by colons, for example <Code
					code="/usr/local/bin:/usr/bin:/bin"
				/>. For an external command name without a slash, the shell searches those directories.
				Earlier matches can hide later versions of a program.
			</p>
			<p>
				<Code code="type" /> also helps reveal shell built-ins and aliases. <Code code="which" /> is useful
				for external paths but does not always describe the shell’s full lookup behavior. On a real Bash
				or zsh terminal, <Code code="command -v ls" /> is another useful check.
			</p>
			<p>
				If a command is not found, start with its spelling, then ask whether it is installed and
				whether its directory is on PATH. If you already know the program’s full path, you can run
				that path directly. A command beginning with <Code code="./" /> does not ask PATH to choose a
				file for you.
			</p>
			<CodeBlock
				code="export PATH=&quot;$PATH:$HOME/.local/bin&quot;"
				title="Add one directory to this shell’s existing search list"
			/>
			<p>
				Keep the old <Code code="$PATH" /> on the right. Replacing it with only the new directory can
				hide ordinary commands. Appending searches the new location last; prepending searches it first.
				Add a directory you trust, not a shared folder where someone else can replace commands.
			</p>
			<p>
				Environment variables can contain credentials. Inspect only the setting you need; do not
				paste a full <Code code="env" /> dump into a chat or issue. Use the program’s documented credential
				setup for real keys. Our practice uses ordinary words such as basil, never real secrets.
			</p>
			<h4 id="path-repair">Try it: find the missing command</h4>
			<p>
				A small tool named greet exists in the sandbox. Find where it lives and either run its
				explicit path or add its directory to PATH. Explain why your chosen fix works.
			</p>
			<LessonActivity title="command not found" scenarioId="path-repair" id="path-repair" />
		</div>

		<div id="section-5-5" class="lesson-section">
			<SectionHeader level="section" icon={FileText} title="5.5 Keep a Useful Setting" />
			<p>
				An <strong>alias</strong> is a short name for a command you want to reuse. Try one in the current
				shell before making it permanent:
			</p>
			<CodeBlock
				code={"alias ll='ls -lh'\nll\nalias"}
				title="Create a short listing command, use it, then inspect aliases"
			/>
			<p>
				The quotes keep the longer command together when defining the alias. <Code
					code="unalias ll"
				/> removes this alias from the current shell. A name such as ll is optional shorthand; keep learning
				the underlying command too.
			</p>
			<ExpandableImage
				src="{base}/images/shell-config.webp"
				alt="A short set of personal shell settings saved in a configuration file."
				caption="Try one setting, save it deliberately, then verify a new shell."
			/>
			<p>
				To keep it for future sessions, add its definition to the startup file your shell actually
				reads. On a real machine, inspect the file first, keep a copy if it already exists, and use
				your editor to add one line. Do not replace the entire file with the example below.
			</p>
			<CodeBlock
				code="alias ll='ls -lh'"
				title="One line to add to the appropriate shell startup file"
			/>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Shell session</th><th>Common personal startup file</th></tr></thead><tbody>
						<tr><td>Interactive zsh</td><td><Code code="~/.zshrc" /></td></tr><tr
							><td>Interactive Bash that is not a login shell</td><td><Code code="~/.bashrc" /></td
							></tr
						><tr
							><td>Bash login shell</td><td
								>A profile such as <Code code="~/.bash_profile" />; it often loads .bashrc
								explicitly.</td
							></tr
						><tr
							><td>zsh login shell</td><td
								><Code code="~/.zprofile" /> also runs; interactive sessions still read .zshrc.</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				A new terminal window can start a login or non-login shell, depending on the application’s
				settings. That is why a setting can work in one terminal but not another. Begin with one
				alias and test a new window before adding more configuration.
			</p>
			<h4>What source actually does</h4>
			<p>
				After editing a trusted file, <Code code="source ~/.zshrc" /> runs its commands in the
				<em>current</em>
				zsh shell. Bash users can use <Code code="source ~/.bashrc" /> for that file. Read it before sourcing;
				this executes commands, not just harmless declarations.
			</p>
			<p>
				Running <Code code="bash script.sh" /> starts a child shell. Its variable changes and current
				folder do not alter the parent. But files it creates, changes, or deletes
				<strong>do persist</strong>. A child shell is not a file-safety sandbox. Sourcing instead
				applies commands to your current shell, so changes to variables, aliases, and location
				remain there too.
			</p>
			<p>
				If a new setting breaks your startup, reopen the file in an editor and remove that new line
				or restore your saved copy. Repeatedly adding more PATH lines makes the problem harder to
				inspect.
			</p>
			<h4 id="alias-workshop">Try it: make one useful shortcut</h4>
			<p>
				Define and use an alias. Then add its definition to the sandbox’s .bashrc without discarding
				the existing content. Read the file back. In a real terminal you would finally test a fresh
				shell as well.
			</p>
			<LessonActivity title="Make Your Shortcuts" scenarioId="alias-workshop" id="alias-workshop" />
			<ChallengeActivity title="Nothing in the Kit Will Run" part={5} id="ch-5-deploy-kit" />
			<p class="next-lesson">
				You can now distinguish “the shell did not find it” from “this account cannot do that.” Next
				we will save a small routine as a script and make its success or failure explicit.
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
