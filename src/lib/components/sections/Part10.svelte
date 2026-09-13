<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
</script>

<section id="part-10" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 10"
			title="The toolshed: useful tools for everyday work"
		/>
		<p class="lead">
			You can already work with the tools that ship with a typical Unix-like system. Now build a
			small kit around tasks you actually repeat: find a note, read it comfortably, unpack a
			delivery, and understand where your disk space went.
		</p>
		<p>
			Install one tool when it solves a real annoyance. Try it on familiar files. You do not need a
			long setup ritual before you are allowed to use the terminal.
		</p>
		<div id="section-10-1" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="10.1 Add a tool, then use it for one small job"
			/>
			<p>
				A package manager installs and updates software from configured sources. Homebrew is one
				option on macOS; Linux distributions have their own managers, such as apt or dnf. Their
				commands, package names, and permissions differ. Use instructions for your actual system.
			</p>
			<ExpandableImage
				src="{base}/images/package-managers.webp"
				alt="A storekeeper selects a labeled tin from a collection of tools."
				caption="Choose a tool for a job. Check which package and command your system provides."
			/>

			<p>
				Before installing, ask whether the command is already available: <Code
					code="command -v jq"
				/>. A printed path tells you how this shell resolves that name. No result means it did not
				find that command; it does not prove the software is absent everywhere.
			</p>
			<p>
				The browser activity simulates installing jq. It does not install software on your computer
				or make a real network request. Once installed in the activity, use the tool on a small
				piece of JSON so “installed” connects to something useful.
			</p>
			<h4 id="summon-a-tool">Try it: Install a tool</h4>
			<LessonActivity title="Install a tool" scenarioId="summon-a-tool" id="summon-a-tool" />
			<p class="native">
				<strong>On your own machine:</strong> consult the chosen tool's official installation
				instructions. If you already use Homebrew, <Code code="brew install ripgrep" /> installs the package
				that provides <Code code="rg" />. Confirm it with <Code code="rg --version" />. Do not paste
				an installation command for a different operating system, and do not add sudo to an
				unexplained failure.
			</p>
			<h4>Find text with ripgrep</h4>
			<p>
				Suppose you keep a folder named notes and want the lines mentioning watering. Your familiar
				baseline is <Code code="grep -R -n -F 'watering' notes" />. Recursive search looks through
				folders; line numbers tell you where to open a result; fixed-string mode treats your search
				as ordinary text.
			</p>
			<CodeBlock title="Your terminal, after installing ripgrep" code="rg -n -F 'watering' notes" />
			<p>
				rg searches file contents. Its defaults skip many hidden, ignored, and binary files, which
				is helpful in projects but matters when a result seems missing. <Code
					code="rg --hidden -n -F 'watering' notes"
				/> includes hidden files; ignore rules are a separate setting. The
				<a href="https://github.com/BurntSushi/ripgrep">ripgrep guide</a> explains those choices.
			</p>
			<h4>Find a name with fd</h4>
			<p>
				To find a Markdown filename with standard tools, use <Code
					code="find notes -type f -name '*.md'"
				/>. With fd installed, try <Code code="fd -e md . notes" />. The extension option narrows
				the files; the dot is a pattern matching a name; notes is the folder to search.
			</p>
			<p>
				fd's default search is a regular expression and normally omits hidden and ignored paths. Use <Code
					code="fd -g '*.md' notes"
				/> when you want a shell-style name pattern instead. Some distributions install it as <Code
					code="fdfind"
				/>. Read the <a href="https://github.com/sharkdp/fd">fd guide</a> before deciding a missing result
				means the file is gone.
			</p>
			<h4>Choose from a list with fzf</h4>
			<p>
				Sometimes you recognize a name when you see it. <Code code="fzf" /> lets you narrow a list interactively.
				Try <Code code="rg --files notes | fzf" />: type part of a name, use the arrow keys, and
				press Enter. The selected filename is printed. It is not automatically opened or executed.
				Press Esc to leave.
			</p>
			<p>
				This small example connects two jobs: one tool lists files; another helps you choose. The <a
					href="https://github.com/junegunn/fzf">fzf guide</a
				> shows optional shell integration. You can learn that later; do not assume an installation has
				already configured its shortcuts.
			</p>
			<h4>Return to a familiar folder with zoxide</h4>
			<p>
				Tab completion helps with a path you are typing. zoxide learns folders you visit and can
				help you return to one by name. After installation and the setup for your shell, visit a
				folder normally; later <Code code="z notes" /> can jump to a matching remembered location. Run
				<Code code="pwd" /> afterwards so you know where it chose.
			</p>
			<p>
				Setup adds shell initialization code, and differs for Bash and zsh. Follow the <a
					href="https://github.com/ajeetdsouza/zoxide">zoxide instructions</a
				>; it is optional, and ordinary cd always remains available. A short name is convenient, but
				two folders can have similar names.
			</p>
			<h4>Read comfortably with bat</h4>
			<p>
				<Code code="cat notes.txt" /> prints a file. <Code code="less notes.txt" /> lets you scroll. <Code
					code="bat notes.txt"
				/> can add syntax highlighting and line numbers, and may open a pager; press q to leave that pager.
				It reads the file rather than editing it.
			</p>
			<p>
				Use <Code code="bat --paging=never notes.txt" /> if you want it to print and finish. Some distributions
				call the command batcat. Check the
				<a href="https://github.com/sharkdp/bat">bat documentation</a>. Choose a readable theme, and
				keep plain cat in mind when copying exact text or working on a minimal machine.
			</p>
			<p class="reflection">
				<strong>Choose one:</strong> find a word with rg, find a filename with fd, select a result with
				fzf, revisit a folder with zoxide, or read a file with bat. Repeat the same task with its standard-tool
				baseline. What improved for you?
			</p>
		</div>
		<div id="section-10-2" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="10.2 Inspect an archive before unpacking it"
			/>
			<p>
				An archive bundles files into one file. Compression reduces the size of data. They often
				come together: a tar archive collects files, and gzip compresses the archive into a name
				ending in <Code code=".tar.gz" />.
			</p>
			<ExpandableImage
				src="{base}/images/archives.webp"
				alt="A wooden archive crate contains several smaller named files."
				caption="List the contents first. Choose a fresh destination before unpacking."
			/>
			<WorkflowSteps
				title="Unpack a delivery deliberately"
				steps={[
					{ label: 'List', detail: 'See the archive’s names before extracting.' },
					{ label: 'Choose a place', detail: 'Use a fresh folder so existing work is separate.' },
					{ label: 'Inspect', detail: 'Check the extracted files before using them.' }
				]}
			/>
			<p>
				Start by listing the archive. With <Code code="tar -tzf release.tar.gz" />, t means list, z
				selects gzip, and f says the next argument is the archive filename. Nothing is unpacked by
				that command.
			</p>
			<CodeBlock title="Inspect the delivery" code="tar -tzf release.tar.gz" />
			<p>
				Look for the folder names you expect. Is everything under one top-level folder? Does the
				archive contain configuration or executable files? A listing helps you make a destination
				choice; it is not proof that an untrusted archive is safe.
			</p>
			<p class="native">
				<strong>On your own machine:</strong> create a fresh empty folder with <Code
					code="mkdir unpacked-release"
				/>, then run <Code code="tar -xzf release.tar.gz -C unpacked-release" />. x means extract; C
				chooses the destination. If the folder already exists, inspect it or choose a different
				name. Unpacking into existing work can replace files.
			</p>
			<h4 id="open-the-crate">Try it: Peek, then unpack</h4>
			<LessonActivity title="Peek, then unpack" scenarioId="open-the-crate" id="open-the-crate" />
			<p>
				To package your own notes folder, use <Code code="tar -czf notes.tar.gz notes" /> from its parent.
				Here c means create. The output archive should be outside the folder you are archiving. Choose
				a new archive name if an existing one matters.
			</p>
			<details>
				<summary>Other formats and verification</summary>
				<p>
					<Code code="unzip -l delivery.zip" /> lists a ZIP archive. To extract in your terminal, choose
					a fresh destination with <Code code="unzip delivery.zip -d unpacked-zip" />. Consult the
					local manual for options your installed version supports.
				</p>
				<p>
					For downloaded releases, compare a checksum or signature using the publisher's documented
					method and trusted reference value. A checksum from the same untrusted message as the file
					does not establish who published it. Treat unfamiliar executables inside archives with the
					same care as unfamiliar install scripts.
				</p>
			</details>
		</div>
		<div id="section-10-3" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="10.3 Make a signpost, not another copy"
			/>
			<p>
				A symbolic link is a small filesystem entry that points to another path. It can give a
				stable name to a changing location without duplicating the files.
			</p>
			<ExpandableImage
				src="{base}/images/symlinks.webp"
				alt="A signpost named current points to a lit release folder; another signpost has no destination."
				caption="A symbolic link stores a path. The target can move or disappear."
			/>
			<CodeBlock
				title="In a fresh practice folder"
				code={`mkdir notes
ln -s notes favorite
ls -l favorite`}
			/>
			<p>
				<Code code="ln -s notes favorite" /> creates a link named favorite pointing to notes. Read the
				arguments as <strong>target, then new link name</strong>. If a path already has that name,
				stop and inspect it instead of adding force options.
			</p>
			<p>
				A relative target is interpreted from the link's containing folder. It is not interpreted
				from whichever directory you happen to occupy later. Move the link or its target and that
				relationship may break.
			</p>
			<p>
				<Code code="rm favorite" /> removes this link itself. It does not remove the target folder. Avoid
				adding a trailing slash or recursive flags when you only mean to remove a link. Inspect a path
				with ls -l before deciding what kind of thing you are changing.
			</p>
		</div>
		<div id="section-10-4" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="10.4 Measure disk usage before deleting anything"
			/>
			<p>
				Use <Code code="df -h" /> for a filesystem's overall capacity and free space. Use <Code
					code="du -sh notes"
				/> for the space attributed to a particular folder. They answer different questions.
			</p>
			<ExpandableImage
				src="{base}/images/disk-detective.webp"
				alt="A magnifying glass compares barrels labeled with their storage sizes."
				caption="Find the large folder, then understand what is in it."
			/>
			<p>
				For a broad first look, <Code code="du -sh ." /> measures the current folder, including hidden
				entries beneath it. <Code code="du -sh ./*" /> shows separate entries matched by that glob; ordinary
				star expansion usually omits dotfiles. Check a relevant hidden folder explicitly rather than assuming
				it uses no space.
			</p>
			<p>
				Large does not mean disposable. A folder might hold original photographs, generated build
				output, or a package cache. Find out which before removing it. Prefer a tool's own
				documented cleanup command for its managed caches.
			</p>
			<h4 id="space-hog">Try it: Find the space hog</h4>
			<LessonActivity title="Find the space hog" scenarioId="space-hog" id="space-hog" />
			<details>
				<summary>When the numbers do not agree</summary>
				<p>
					df measures the filesystem; du walks names and accounts for files it can access.
					Permissions, snapshots, shared storage, and files still held open by programs can make the
					totals differ. Do not keep deleting unrelated files to force the numbers to match. Read
					errors, check the correct filesystem, and investigate what is actually occupying it.
				</p>
			</details>
			<p class="reflection">
				Explain the difference between “this folder is large” and “this folder is safe to remove.”
				What evidence would you collect before crossing that gap?
			</p>
		</div>
		<ChallengeActivity title="Hand over the useful files" part={10} id="ch-10-handover" />
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
