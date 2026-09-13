<script lang="ts">
	import { Compass, MapPin, Route, MoveRight, FolderPlus, Eye } from 'lucide-svelte';
	import { base, resolve } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
</script>

<section id="part-2" class="py-10">
	<div class="chapter mx-auto max-w-4xl px-6">
		<SectionHeader icon={Compass} partLabel="Part 2" title="Moving Around: Find Your Files" />
		<p class="lead">
			Let’s make a home for a little garden notebook. Before we create anything, we need to know
			where it will go.
		</p>
		<p>
			A terminal has a <strong>current folder</strong>. Commands that use a short name, such as <Code
				code="notes.txt"
			/>, look for that name there. In terminal instructions, a folder is also called a
			<strong>directory</strong>. The two words mean the same thing here.
		</p>
		<div id="moving-around-overview" class="steps">
			<span><code>pwd</code><small>Find your location</small></span><span
				><code>ls</code><small>Look around</small></span
			><span><code>cd</code><small>Choose a folder</small></span>
		</div>

		<div id="section-2-1" class="lesson-section">
			<SectionHeader level="section" icon={MapPin} title="2.1 Where Am I?" />
			<p>
				Imagine opening a file manager. It shows a folder’s name and what is inside. In a terminal,
				we ask those two questions separately.
			</p>
			<CommandTranscript command="pwd" output="/home/vibe" title="Where am I working?" />
			<p>
				<Code code="pwd" /> means “print working directory.” This answer is the location of your current
				folder. Here, it is the home folder of an account named <Code code="vibe" />. Your own
				computer may show something like <Code code="/Users/sam" /> or <Code code="/home/sam" /> instead.
			</p>
			<CommandTranscript
				command="ls"
				output="documents  notes.txt  projects"
				title="What is in this folder? · example result"
			/>
			<p>
				<Code code="ls" /> lists names. A name might belong to a file or to a folder containing more names.
				Colors can help distinguish them, but colors depend on the terminal’s settings. We won’t rely
				on color alone.
			</p>
			<ExpandableImage
				src="{base}/images/where-am-i.webp"
				alt="A folder map and a terminal showing the current location."
				caption="pwd tells you where you are; ls tells you what is there."
			/>
			<h4>Find names that a normal listing leaves out</h4>
			<p>
				A name starting with a dot is usually omitted by <Code code="ls" />. Add the option <Code
					code="-a"
				/> to include it:
			</p>
			<CommandTranscript
				command="ls -a"
				output=".  ..  .bashrc  .config  documents  notes.txt  projects"
			/>
			<p>
				These hidden names often hold settings. Hidden does <em>not</em> mean locked or secret; it
				is a display convention. The special entries <Code code="." /> and <Code code=".." /> mean “this
				folder” and “its parent.” We will use them shortly.
			</p>
			<details>
				<summary>Read a longer listing</summary>
				<div class="detail-content">
					<CommandTranscript
						command="ls -l notes.txt"
						output="-rw-r--r-- 1 vibe staff 118 Jul 12 08:30 notes.txt"
					/>
					<p>
						Start at the right: the name, then the date, then the size in bytes. A byte is a unit of
						stored data; one written character can use more than one byte. The first character is <Code
							code="-"
						/> for a regular file or <Code code="d" /> for a directory. Part 5 explains the other permission
						letters.
					</p>
					<p>
						<Code code="ls -lh" /> formats larger sizes as values such as <Code code="4.2K" />. <Code
							code="ls -la"
						/> combines the long listing with hidden names. For this command, <Code code="-la" /> is shorthand
						for <Code code="-l -a" />; option letters belong to each individual command.
					</p>
				</div>
			</details>
		</div>

		<div id="section-2-2" class="lesson-section">
			<SectionHeader level="section" icon={Route} title="2.2 Paths: Addresses for Files" />
			<p>
				A <strong>path</strong> tells a command where to find something. Read the slashes as steps between
				folders. Here is a small example tree:
			</p>
			<pre
				id="filesystem-tree"
				class="diagram"
				aria-label="Example folder tree: home contains vibe, which contains garden, with notes.txt and a photos folder">{'/\n└── home/\n    └── vibe/\n        └── garden/\n            ├── notes.txt\n            └── photos/'}</pre>
			<p>
				The full address of the note is <Code code="/home/vibe/garden/notes.txt" />. Start at the
				first slash, called the <strong>root directory</strong>, then follow <Code code="home" />, <Code
					code="vibe"
				/>, and <Code code="garden" /> to the file.
			</p>
			<ExpandableImage
				src="{base}/images/paths.webp"
				alt="Paths shown as routes through a branching garden."
				caption="A path can start at the root or at your current folder."
			/>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Kind of path</th><th>Example</th><th>Where it starts</th></tr></thead
					><tbody>
						<tr
							><td>Absolute</td><td><Code code="/home/vibe/garden/notes.txt" /></td><td
								>The root, regardless of your current folder</td
							></tr
						>
						<tr
							><td>Relative</td><td><Code code="garden/notes.txt" /></td><td
								>Your current folder; correct here if you are in <Code code="/home/vibe" /></td
							></tr
						>
						<tr
							><td>Relative</td><td><Code code="notes.txt" /></td><td
								>Your current folder; correct here if you are in <Code
									code="/home/vibe/garden"
								/></td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				<strong>A useful prediction:</strong> if you move into <Code code="photos" />, will <Code
					code="notes.txt"
				/> still name the note? No: that short name now refers to something inside photos. Use <Code
					code="../notes.txt"
				/> to go up one level before choosing the file.
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Shortcut</th><th>Meaning</th><th>Example</th></tr></thead><tbody>
						<tr
							><td><Code code="/" /></td><td>The root directory</td><td
								><Code code="/home/vibe" /></td
							></tr
						>
						<tr
							><td><Code code="~" /></td><td>Your home directory</td><td
								><Code code="~/garden" /></td
							></tr
						>
						<tr
							><td><Code code="." /></td><td>Your current directory</td><td
								><Code code="./notes.txt" /></td
							></tr
						>
						<tr
							><td><Code code=".." /></td><td>The parent directory</td><td
								><Code code="../notes.txt" /></td
							></tr
						>
					</tbody>
				</table>
			</div>
			<h4>One name can contain a space</h4>
			<p>
				The shell normally uses spaces to separate the pieces of a command. To keep <Code
					code="My Notes"
				/> together as one name, put quotes around it:
			</p>
			<CodeBlock code="cd &quot;My Notes&quot;" title="One folder name, including its space" />
			<p>
				<Code code="cd My Notes" /> supplies two separate names. The quotes are instructions to the shell;
				they are not part of the folder’s name. A backslash can protect a single space too: <Code
					code="cd My\ Notes"
				/>.
			</p>
			<p>
				Try typing the first few letters of a name, then pressing <kbd>Tab</kbd>. In many shells,
				completion fills in a matching name. If several names match, type another letter or press
				Tab again to see choices. The
				<a href="{resolve('/')}#keyboard-workshop">keyboard workshop</a> gives you a place to practise
				this without a long command to manage.
			</p>
			<details>
				<summary>Single quotes, double quotes, and literal text</summary>
				<div class="detail-content">
					<p>
						Both <Code code="'My Notes'" /> and <Code code="&quot;My Notes&quot;" /> keep the space inside
						the name. Single quotes preserve their contents literally. Double quotes also allow variable
						values such as <Code code="$HOME" /> to expand; we will use variables in Part 5.
					</p>
					<p>
						Keep the home shortcut outside quotes: <Code code="~/&quot;My Notes&quot;" /> works. <Code
							code="&quot;~/My Notes&quot;"
						/> treats the tilde as an ordinary character in a real shell. Later, <Code
							code="&quot;$HOME/My Notes&quot;"
						/> will give you a convenient quoted form.
					</p>
				</div>
			</details>
		</div>

		<div id="section-2-3" class="lesson-section">
			<SectionHeader level="section" icon={MoveRight} title="2.3 Changing Directories" />
			<p>
				<Code code="cd" /> changes your current folder. It does not move the files themselves. Try a move,
				then ask <Code code="pwd" /> where you landed:
			</p>
			<CodeBlock
				code={'cd garden\npwd\nls'}
				title="In the example tree above · run one line at a time"
			/>
			<p>
				After this move, <Code code="pwd" /> would show <Code code="/home/vibe/garden" />. If a
				folder called garden does not exist in your current practice, choose a name you can see with <Code
					code="ls"
				/> instead.
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Command</th><th>What changes</th></tr></thead><tbody>
						<tr><td><Code code="cd .." /></td><td>Go to the parent folder.</td></tr><tr
							><td><Code code="cd ~" /></td><td>Go home. Plain <Code code="cd" /> does this too.</td
							></tr
						><tr><td><Code code="cd -" /></td><td>Return to the previous working folder.</td></tr
						><tr
							><td><Code code="ls photos" /></td><td
								>Look inside photos without changing your location.</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				If <Code code="cd" /> reports “No such file or directory,” your location has not changed. Check
				<Code code="pwd" />, list the names, then correct the path. If it says “Not a directory,”
				you may have chosen a file. If it says “Permission denied,” the folder exists but your
				account cannot enter it; Part 5 explains that case.
			</p>
			<p>
				Each shell has its own current folder. Moving in one terminal tab does not move another tab.
				This is why checking your location is useful even when you were “just there.”
			</p>
			<ExpandableImage
				src="{base}/images/changing-directories.webp"
				alt="A crab moving between folders while their contents stay in place."
				caption="cd changes your point of view; pwd confirms it."
			/>
			<h4 id="navigation">Try it: find the hidden garden note</h4>
			<p>
				Explore the seeded folders below with <Code code="pwd" />, <Code code="ls" />, and <Code
					code="cd"
				/>. Use <Code code="ls -a" /> if a clue seems missing. When you find the note, <Code
					code="cat"
				/> followed by its filename prints its contents—we’ll practise reading files in more detail below.
			</p>
			<LessonActivity title="Find the Hidden Garden Note" scenarioId="navigation" id="navigation" />
		</div>

		<div id="section-2-4" class="lesson-section">
			<SectionHeader level="section" icon={FolderPlus} title="2.4 Make a Place for Your Notes" />
			<p>
				<Code code="mkdir" /> makes a directory. <Code code="touch" /> creates an empty file if that name
				does not already exist. Start with one folder, then put one file inside it:
			</p>
			<CodeBlock
				code={'mkdir garden-notebook\ncd garden-notebook\ntouch plan.md\nls'}
				title="A notebook folder and its first empty file"
			/>
			<p>
				The final listing should include <Code code="plan.md" />. The <Code code=".md" /> ending is a
				common name for a Markdown text file. It is still a text file; the ending does not put anything
				inside it.
			</p>
			<p>Now make a few places to organize the notebook:</p>
			<CodeBlock
				code={'mkdir notes recipes photos\ntouch notes/seeds.txt notes/weather.txt\nls notes'}
				title="Create names, then check where they landed"
			/>
			<p>
				These commands usually print nothing when they finish successfully. That is why we use <Code
					code="ls"
				/> to inspect the result. Silence alone is not the check.
			</p>
			<ExpandableImage
				src="{base}/images/making-things.webp"
				alt="New folders and empty files appearing in a garden workspace."
				caption="Create a little, then inspect what you made."
			/>
			<h4>Create missing parent folders</h4>
			<p>
				<Code code="mkdir photos/spring/week-1" /> fails if photos/spring does not exist. <Code
					code="mkdir -p photos/spring/week-1"
				/> creates the missing parents too. The <Code code="-p" /> form also accepts a directory that
				already exists. It can still fail if you lack permission or a file is blocking the path.
			</p>
			<p>
				Running <Code code="touch plan.md" /> again keeps the file’s contents and updates its timestamps.
				It does not empty the file. To inspect a whole small tree, try <Code
					code="ls -R garden-notebook"
				/> from its parent; the capital R asks for a listing inside subfolders too.
			</p>
			<h4 id="quoting">Try it: keep a name with a space together</h4>
			<p>
				The next sandbox contains <Code code="My Projects" />. Enter that folder with a quoted path,
				create an empty file called <Code code="shipped.txt" />, and list the folder to check.
				“Shipped” is just the chosen filename; no software is being published.
			</p>
			<LessonActivity title="Mind the Gap" scenarioId="quoting" id="quoting" />
		</div>

		<div id="section-2-5" class="lesson-section">
			<SectionHeader level="section" icon={Eye} title="2.5 Read, Edit, and Save a File" />
			<p>
				<Code code="cat" /> prints a file and gives your prompt back. Use it for something short:
			</p>
			<CommandTranscript
				command="cat notes.txt"
				output={'Water the seedlings.\nCheck the sunny windowsill.'}
				title="Example: a note with two lines"
			/>
			<p>
				Reading an empty file prints nothing. It has no text yet. Reading a photograph with cat is
				not useful: image files are not ordinary text. A filename is a clue, not proof of its
				contents.
			</p>
			<h4 id="edit-notes">Try it: add a seed to the notebook</h4>
			<p>
				In the next practice, run <Code code="cat notes/seeds.txt" /> to read the list. Choose
				<strong>Edit a file</strong>, open <Code code="notes/seeds.txt" />, and add
				<strong>thyme</strong> on a new line after basil and mint. Save the file, then run cat again to
				check the saved result.
			</p>
			<LessonActivity title="Add to Your Seed List" scenarioId="edit-notes" id="edit-notes" />
			<p>
				The editor and this terminal share the same simulated files. Typing in the editor changes
				the draft; saving changes the file. Reading it with cat confirms what the terminal will
				actually see.
			</p>
			<h4>Write a note on your own computer</h4>
			<p>
				This is a <strong>real-terminal practice</strong>; the embedded sandbox does not provide
				nano. In a practice folder you created on your computer, run:
			</p>
			<CodeBlock code="nano plan.md" title="Open or create a text file in nano" />
			<ol>
				<li>Type <strong>Plant basil by the window.</strong></li>
				<li>Hold <kbd>Ctrl</kbd> and press <kbd>O</kbd> to save (“Write Out”).</li>
				<li>Check that the filename says <Code code="plan.md" />, then press <kbd>Enter</kbd>.</li>
				<li>Press <kbd>Ctrl+X</kbd> to leave the editor.</li>
				<li>Run <Code code="cat plan.md" /> and check that your sentence is there.</li>
			</ol>
			<p>
				In nano’s help bar, <Code code="^O" /> means Ctrl+O. If nano asks whether to save changed text
				when you exit, <kbd>Y</kbd> saves and <kbd>N</kbd> discards those unsaved edits. If nano is unavailable,
				use your usual editor in plain-text mode and save into the same practice folder.
			</p>
			<p>
				<strong>Try a variation:</strong> open the note again, add a second line, save, exit, and read
				it back. The skill is the complete loop, including checking the saved file.
			</p>
			<ExpandableImage
				src="{base}/images/looking-inside.webp"
				alt="Different tools for examining a short note and a longer text file."
				caption="Choose how much text to read, and know how to return to your prompt."
			/>
			<h4>Read longer text without losing your place</h4>
			<p>
				On your own computer, <Code code="less notes.txt" /> opens a reader. Use <kbd>Space</kbd>
				for the next page, <kbd>b</kbd> for the previous page, and <kbd>/</kbd> followed by a word
				and Enter to search. <kbd>n</kbd> finds the next match. Press <kbd>q</kbd> to leave. Our sandbox
				prints less output directly rather than opening a full-screen reader.
			</p>
			<div class="table-scroll">
				<table>
					<thead><tr><th>Need</th><th>Use</th></tr></thead><tbody>
						<tr><td>The whole short file</td><td><Code code="cat notes.txt" /></td></tr><tr
							><td>The first three lines</td><td><Code code="head -n 3 notes.txt" /></td></tr
						><tr><td>The last three lines</td><td><Code code="tail -n 3 notes.txt" /></td></tr><tr
							><td>A live view as a log grows (real terminal)</td><td
								><Code code="tail -f app.log" />; stop with Ctrl+C</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<details>
				<summary>If you accidentally opened Vim</summary>
				<div class="detail-content">
					<p>
						Press <kbd>Esc</kbd>, type <Code code=":q!" />, then press Enter to leave without saving
						your changes. To save and leave, use <Code code=":wq" /> instead. These are instructions
						<em>inside Vim</em>, not commands to type at an ordinary shell prompt.
					</p>
				</div>
			</details>
			<h4 id="workspace-setup">Try it: build your notebook workspace</h4>
			<p>
				Make the folders and empty files described in the practice below. Inspect each folder before
				continuing. These files start empty. Open one with Edit a file if you want to add a note,
				then read it back with cat. Part 4 will show another way to write files: saving a command’s
				output.
			</p>
			<LessonActivity
				title="Build Your Notebook Workspace"
				scenarioId="workspace-setup"
				id="workspace-setup"
			/>
			<ChallengeActivity title="Scaffold It From Here" part={2} id="ch-2-scaffold" />
			<p class="next-lesson">
				Before moving on, explain this in your own words: why can the same <Code code="notes.txt" /> command
				name a different file after <Code code="cd" />? Next, we will copy, rename, and organize the
				files you can now find.
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
	.diagram {
		overflow-x: auto;
		padding: 1.2rem;
		border-radius: 0.7rem;
		background: var(--color-bg-secondary);
		color: var(--color-text);
		font: 0.86rem/1.7 var(--font-mono);
		white-space: pre;
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
