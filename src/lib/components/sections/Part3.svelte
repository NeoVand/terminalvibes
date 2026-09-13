<script lang="ts">
	import { FolderTree, Copy, MoveRight, Trash2, Hash } from 'lucide-svelte';
	import { base, resolve } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
</script>

<section id="part-3" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={FolderTree}
			partLabel="Part 3"
			title="Copy, Move, and Delete with Confidence"
		/>
		<p class="lead">
			Your notebook has a draft, some photographs, and a few files you no longer need. Let’s
			organize them, one small change at a time.
		</p>
		<p>
			There are three different actions to keep separate. <Code code="cp" /> makes a copy. <Code
				code="mv"
			/> moves or renames the original. <Code code="rm" /> removes a name without putting it in the Trash.
			We’ll inspect the result after each action.
		</p>

		<div id="section-3-1" class="lesson-section">
			<SectionHeader level="section" icon={Copy} title="3.1 Copying: Keep the Original" />
			<p>
				Before changing a note, make a second copy you can return to. Read this command as “copy
				plan.md to plan-original.md.” The source comes first; the destination comes last.
			</p>
			<CodeBlock
				code={'cp plan.md plan-original.md\nls\ncat plan-original.md'}
				title="In a folder containing plan.md · copy, list, read"
			/>
			<p>
				The first command normally prints nothing. The listing should now contain both names, and
				cat should print the copied text. Editing <Code code="plan.md" /> afterward does not update this
				separate copy.
			</p>
			<ExpandableImage
				src="{base}/images/copying.webp"
				alt="A file copied into a second file while the original remains."
				caption="A copy gives you a second file; it does not move the first one."
			/>
			<h4>The destination can be a new name or an existing folder</h4>
			<CodeBlock
				code={'mkdir copies\ncp plan.md copies/\nls copies'}
				title="Copy into an existing folder, keeping the filename"
			/>
			<p>
				Here the copied file is <Code code="copies/plan.md" />. The final slash makes your intention
				easy to read. The destination folder must exist; cp does not create missing parent folders.
			</p>
			<p>
				<strong>Check the destination first.</strong> A normal copy can replace an existing
				destination file. On your own computer, <Code code="cp -i plan.md copies/" /> asks before overwriting.
				Answer <kbd>n</kbd> if you are unsure. In this sandbox, -i refuses an overwrite and explains the
				prompt rather than running a yes/no conversation.
			</p>
			<h4>Copy a folder and what is inside it</h4>
			<CodeBlock
				code={'cp -R notes notes-copy\nls notes-copy'}
				title="Create notes-copy when that destination does not already exist"
			/>
			<p>
				The capital <Code code="-R" /> means copy recursively: include the folder’s contents and its subfolders.
				<Code code="-r" /> also works for these examples. Without a recursive option, cp normally refuses
				a directory.
			</p>
			<p>
				Whether the destination already exists matters. If <Code code="notes-copy" /> is absent, the command
				creates it as the copy. If it is already a directory, the source may be copied
				<em>inside</em>
				it, producing <Code code="notes-copy/notes" />. Check with ls before repeating a folder-copy
				command.
			</p>
			<p>
				<strong>Try a variation:</strong> copy one short note, edit only the copy with the file editor,
				and read both names with cat. You should see two different versions.
			</p>
			<details>
				<summary>What makes a useful backup?</summary>
				<div class="detail-content">
					<p>
						A nearby copy is useful before an edit. It does not protect you from losing the disk, or
						from deleting both copies together. Keep important work in a backup system with separate
						storage and retained versions. A filename ending in .bak is only a convention; the name
						itself does not protect the file.
					</p>
				</div>
			</details>
		</div>

		<div id="section-3-2" class="lesson-section">
			<SectionHeader level="section" icon={MoveRight} title="3.2 Moving and Renaming" />
			<p>
				Renaming a file is a move to a new name in the same folder. Moving it to another folder uses
				the same command:
			</p>
			<CodeBlock
				code={'mv rough-notes.txt planting-plan.txt\nmkdir finished\nmv planting-plan.txt finished/\nls\nls finished'}
				title="Rename, then move · start with a disposable rough-notes.txt"
			/>
			<p>
				After the rename, the original name is gone. After the move, the file is inside finished.
				Its text has not been rewritten. This makes mv different from cp: you have relocated the
				file, not created a second independent copy.
			</p>
			<ExpandableImage
				src="{base}/images/moving-renaming.webp"
				alt="A file changing its label and then moving into another folder."
				caption="Source first. Destination last. Check both places afterward."
			/>
			<p>You can move several sources into one existing folder:</p>
			<CodeBlock code="mv basil.jpg mint.jpg photos/" title="Two files, one destination folder" />
			<p>
				With several sources, the final argument must be a directory that already exists. If you see
				“No such file or directory,” check both sides: a source may be misspelled, or the
				destination’s parent may be missing.
			</p>
			<p>
				<Code code="mv -i" /> asks before overwriting an existing destination file on a real terminal.
				Our sandbox refuses that overwrite instead. Choose a new destination name when you want to preserve
				both versions.
			</p>
			<p>
				Moving a whole folder does not require -R. A move within one filesystem is often quick
				because the system changes its location rather than copying all its contents. Moving between
				disks requires copying data and removing the source after that succeeds; let it finish and
				inspect the result.
			</p>
			<p>
				To undo a simple rename or move, move the file back—provided nothing else has taken its old
				place. If a move overwrote another file, renaming it back does not recover the overwritten
				contents. That is what a backup or version history is for.
			</p>
		</div>

		<div id="section-3-3" class="lesson-section">
			<SectionHeader level="section" icon={Trash2} title="3.3 Deleting: Choose the Exact Target" />
			<p>
				<Code code="rm" /> removes files without moving them to your file manager’s Trash. Treat deletion
				as permanent unless you have a separate backup. The playground’s Undo button is a learning feature;
				an ordinary shell does not provide it.
			</p>
			<p>
				Start with a disposable file you made yourself. This sequence creates one, shows it, removes
				it, then checks the folder:
			</p>
			<CodeBlock
				code={'touch practice-scrap.txt\nls practice-scrap.txt\nrm practice-scrap.txt\nls'}
				title="One deliberately disposable file"
			/>
			<p>
				The last listing should no longer include practice-scrap.txt. You did not need a force
				option or a wildcard to remove one known file.
			</p>
			<ExpandableImage
				src="{base}/images/deleting.webp"
				alt="A carefully selected file being removed from a folder."
				caption="Choose the name, inspect it, then remove only that target."
			/>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Task</th><th>Command shape</th><th>What to expect</th></tr></thead><tbody>
						<tr
							><td>Remove one file</td><td><Code code="rm scrap.txt" /></td><td
								>It removes the named file.</td
							></tr
						>
						<tr
							><td>Remove an empty folder</td><td><Code code="rmdir empty-folder" /></td><td
								>It refuses if the folder is not empty.</td
							></tr
						>
						<tr
							><td>Remove a folder and its contents</td><td><Code code="rm -r old-drafts" /></td><td
								>Inspect the folder first; its contents are targets too.</td
							></tr
						>
						<tr
							><td>Ask before removing (real terminal)</td><td><Code code="rm -i scrap.txt" /></td
							><td>Read the question and answer y or n. The sandbox leaves it untouched.</td></tr
						>
					</tbody>
				</table>
			</div>
			<h4>A short routine before removing a folder</h4>
			<CodeBlock
				code={'pwd\nls -la old-drafts\nls -R old-drafts'}
				title="Inspection only · choose your actual disposable folder"
			/>
			<p>
				Confirm where you are and what is inside the intended folder, including hidden names. If you
				are undecided, move it to a clearly named review folder instead of deleting it today. When
				you have decided to remove it, use the same explicit path in <Code
					code="rm -r old-drafts"
				/>.
			</p>
			<p>
				The option <Code code="-f" /> suppresses questions and ignores missing-file errors. It does not
				grant permission and does not make a command correct. The common combination <Code
					code="rm -rf"
				/> asks for recursive removal without questions; there is no reason to make that your default
				for a single scrap file.
			</p>
			<details>
				<summary>If a filename starts with a dash</summary>
				<div class="detail-content">
					<p>
						A name such as <Code code="-old.txt" /> can look like options. An explicit path avoids that
						ambiguity: <Code code="rm ./-old.txt" /> names a file in this folder. Commands such as rm
						also accept <Code code="--" /> to end options: <Code code="rm -- -old.txt" />. Check a
						tool’s help before assuming it supports that convention.
					</p>
				</div>
			</details>
			<h4 id="tidy-up">Try it: sort the downloads</h4>
			<p>
				Move the photos and invoices into their destination folders. Read the filenames before
				deciding which installer is no longer needed. Check both the source and destination after
				each move.
			</p>
			<LessonActivity title="Clean the Downloads Mess" scenarioId="tidy-up" id="tidy-up" />
		</div>

		<div id="section-3-4" class="lesson-section">
			<SectionHeader level="section" icon={Hash} title="3.4 Wildcards: Select a Group of Names" />
			<p>
				Sometimes you want every photo with a certain name, not one photo at a time. A <strong
					>wildcard pattern</strong
				>, also called a glob, selects matching filenames.
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Pattern</th><th>Matches</th><th>Does not match</th></tr></thead><tbody>
						<tr><td><Code code="*.txt" /></td><td>notes.txt, plan.txt</td><td>photo.jpg</td></tr><tr
							><td><Code code="photo-?.jpg" /></td><td>photo-1.jpg, photo-a.jpg</td><td
								>photo-12.jpg</td
							></tr
						><tr
							><td><Code code="note-[12].txt" /></td><td>note-1.txt, note-2.txt</td><td
								>note-3.txt</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				<Code code="*" /> matches any number of characters within a path component, including none. <Code
					code="?"
				/> matches one character. Brackets choose one character from a set. The pattern is about names;
				it does not inspect what the files contain.
			</p>
			<ExpandableImage
				src="{base}/images/wildcards.webp"
				alt="Several filename patterns selecting different groups of files."
				caption="A pattern selects names. Preview the selection before acting on it."
			/>
			<div id="glob-expansion" class="steps">
				<span><code>echo *.txt</code><small>You type a pattern</small></span><span
					><code>echo notes.txt plan.txt</code><small>The shell supplies matching names</small
					></span
				><span><code>notes.txt plan.txt</code><small>echo prints its arguments</small></span>
			</div>
			<CommandTranscript
				command="echo *.txt"
				output="notes.txt plan.txt"
				title="A simple preview · example matching names"
			/>
			<p>
				The shell expands the unquoted pattern <em>before</em> running the command. So echo can show a
				simple selection without changing those files. For names containing spaces, a one-name-per-line
				preview is easier to read:
			</p>
			<CodeBlock code="printf '%s\n' ./*.txt" title="Show each matching name on its own line" />
			<p>
				<Code code="printf" /> is another printing command. Here, <Code code="%s" /> means print one supplied
				string and <Code code="\n" /> means start a new line. The format repeats for each matching name.
				The <Code code="./" /> prefix makes the names explicit paths in the current folder.
			</p>
			<p>
				After inspecting a selection, you can use it with a copying or moving command. For example, <Code
					code="cp ./*.txt copies/"
				/> copies matching text files into an existing copies folder. Rerun the preview if the directory
				or its files have changed.
			</p>
			<h4>Two differences to recognize</h4>
			<p>
				By default, a star does not include names beginning with a dot. Use <Code code="ls -a" /> to inspect
				hidden names separately. Also, <Code code="photos/*.jpg" /> selects files directly inside photos,
				not inside every subfolder. Recursive glob features exist, but differ by shell and settings;
				<a href="{resolve('/')}#section-4-5">find</a> gives us an explicit way to search a whole tree.
			</p>
			<p>
				<strong>If nothing matches:</strong> Bash normally leaves the pattern unchanged, so a
				command may receive the literal text <Code code="*.txt" />. zsh normally stops with “no
				matches found.” Neither message means the files were deleted. List the folder, check the
				pattern, and try again. Our sandbox uses the Bash-style default.
			</p>
			<details>
				<summary>Braces make words; globs find existing names</summary>
				<div class="detail-content">
					<p>
						In Bash and zsh, <Code code={'mkdir -p notes/{spring,summer}'} /> expands to two folder names
						even if neither exists. Braces generate words; globs match names already present. The longer
						form <Code code="mkdir -p notes/spring notes/summer" /> is equally valid and often easier
						to read.
					</p>
				</div>
			</details>
			<h4 id="glob-practice">Try it: choose exactly the right files</h4>
			<p>
				Preview each pattern before using it to move or remove anything. Some similar names are
				deliberate distractions. It is fine to list them several times while you decide.
			</p>
			<LessonActivity
				title="Select Exactly the Right Files"
				scenarioId="glob-practice"
				id="glob-practice"
			/>
			<ChallengeActivity title="Clean Up After the Agent" part={3} id="ch-3-after-the-agent" />
			<p class="next-lesson">
				Check your understanding: what changes if the last argument to cp is an existing directory
				instead of a new filename? Next, we’ll work with the text inside files.
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
	.chapter a {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
	}
	kbd {
		font: 0.8rem var(--font-mono);
		border: 1px solid var(--color-border);
		border-radius: 0.25rem;
		background: var(--color-bg-tertiary);
		color: var(--color-text);
		padding: 0.12rem 0.3rem;
		white-space: nowrap;
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
