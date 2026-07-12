<script lang="ts">
	import { Compass, MapPin, Route, MoveRight, FolderPlus, Eye } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-2" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Compass}
			partLabel="Part 2"
			title="Moving Around: Your Mental Map of the Machine"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"In the terminal you are always standing somewhere. The first skill is knowing where."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			Every command you run — and every command an AI suggests — executes <em>somewhere</em>: inside
			one specific folder on your machine. Half of all beginner terminal confusion is really just
			location confusion: the command was fine, but you were standing in the wrong place. This part
			builds your mental map. You'll learn to ask where you are, read a path like an address, move
			around freely, and create and inspect files — all without touching a mouse.
		</p>

		<MermaidDiagram
			definition={`graph TD
  A(["pwd — Where am I?"]) --> B(["ls — What's here?"])
  B --> C(["cd — Go somewhere"])
  C --> A
  C --> D(["mkdir / touch — Make things"])
  D --> E(["cat / less — Look inside"])
  E --> B`}
			id="moving-around-overview"
		/>

		<Callout type="important">
			This three-beat rhythm — <strong>pwd &rarr; ls &rarr; cd</strong> — is the terminal equivalent
			of looking up from your phone to check the street signs. Run it any time you feel lost, and
			<em>always</em> before running a command an AI wrote for you: most AI-suggested commands quietly
			assume you're standing in the project folder.
		</Callout>

		<!-- 2.1 Where Am I? -->
		<div id="section-2-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={MapPin}
				title="2.1 Where Am I?"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				A fresh terminal window is quiet: a prompt, a blinking cursor, and no other clues. But
				you're not floating in a void — the shell has already placed you inside a folder, called
				your <strong>working directory</strong>. Two commands turn the void into a map.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/where-am-i.webp"
					alt="pwd and ls — getting your bearings in the terminal"
					caption="pwd tells you where you're standing; ls shows what's around you"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> Your AI assistant says "run
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">npm install</code
				> in the project folder." Which folder is your terminal actually in right now? Guessing is how
				dependencies end up installed in your home directory.
			</Callout>

			<p class="mb-4" style="color: var(--color-text-secondary);">
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">pwd</code
				>
				("print working directory") answers the question in one line:
			</p>

			<CodeBlock
				title="Ask the shell where you are"
				code={`pwd
# /home/vibe`}
			/>

			<p class="mt-4 mb-4" style="color: var(--color-text-secondary);">
				That answer — <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">/home/vibe</code
				>
				— is a <strong>path</strong>, the full address of the folder you're standing in (paths get
				their own section next). Now look around with
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				> ("list"):
			</p>

			<CodeBlock
				title="See what's in the current directory"
				code={`ls
# documents  notes.txt  projects`}
			/>

			<div class="mb-6 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-tip);">pwd</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"Where am I?" — prints the full path of your working directory. Instant, harmless, run
						it constantly.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-tip);">ls</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"What's here?" — lists the files and folders in the current directory (or any path you
						give it).
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-tip);">ls -l</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"Tell me more" — one file per line with sizes, dates, and permissions. Your detail view.
					</p>
				</div>
			</div>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Hidden Layer: Dotfiles
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Plain <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				>
				is holding out on you. Any file or folder whose name starts with a dot — a
				<strong>dotfile</strong> — is hidden by default. That's where configuration lives:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.bashrc</code
				>,
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.gitignore</code
				>, the
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.env</code
				>
				file holding your API keys. Add
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-a</code
				> ("all") to see them:
			</p>

			<CodeBlock
				title="Reveal hidden files"
				code={`ls -a
# .  ..  .bashrc  .config  documents  notes.txt  projects`}
			/>

			<Callout type="tip">
				Notice the first two entries: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">..</code
				>. They're not files — they're built-in nicknames for "this directory" and "the parent
				directory," and they show up in <em>every</em> folder. They're about to become very useful in
				the next section.
			</Callout>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				A First Peek at ls -l
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The long listing packs a lot into each line. For now, read just three things: the leading
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">d</code
				>
				means "directory," the number before the date is the size in bytes, and the name is at the end.
				The rest of that cryptic string is a permissions code — we decode it fully in Part 5.
			</p>

			<CodeBlock
				title="The long listing — details per file"
				code={`ls -l
# total 12
# drwxr-xr-x  3 vibe vibe 4096 Jul 10 09:14 documents
# -rw-r--r--  1 vibe vibe  118 Jul 12 08:30 notes.txt
# drwxr-xr-x  4 vibe vibe 4096 Jul 11 17:02 projects`}
			/>

			<Callout type="note">
				Flags stack: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls -la</code
				>
				means "long listing, including hidden files" — the single most common
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				>
				invocation in the wild. (On Windows,
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">dir</code
				>
				is the cmd/PowerShell cousin of
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				> — but inside WSL or Git Bash, ls works exactly as shown.)
			</Callout>

			<VibeBox
				prompts={[
					'What directory is my terminal in right now, and what project files are here?',
					'List everything in this folder including hidden files, and explain what each dotfile is for'
				]}
			/>
		</div>

		<!-- 2.2 Paths -->
		<div id="section-2-2" class="mb-14">
			<SectionHeader level="section" icon={Route} title="2.2 Paths" color="var(--color-primary)" />

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every file on your machine has an address, and that address is called a
				<strong>path</strong>. Learn to read paths and the whole filesystem snaps into focus — it's
				one big upside-down tree, and you can point at any leaf from anywhere.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/paths.webp"
					alt="Paths — every file has an address in the filesystem tree"
					caption="The filesystem is a tree growing down from / — a path is directions through its branches"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> Your AI says "add your key to
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>~/projects/app/.env</code
				>". Is that a file? A folder? Where <em>is</em> it? You can't follow directions written in a language
				you can't read.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Everything starts at the <strong>root</strong>, written as a single slash
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">/</code
				>. Every other folder hangs somewhere beneath it, and a path is simply the walk from one
				point to another, with
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">/</code
				> between each step:
			</p>

			<MermaidDiagram
				definition={`graph TD
  ROOT(["/  (root)"]) --> HOME(["home"])
  ROOT --> USR(["usr"])
  ROOT --> ETC(["etc"])
  HOME --> VIBE(["vibe  — your home, a.k.a. ~"])
  VIBE --> DOCS(["documents"])
  VIBE --> PROJ(["projects"])
  PROJ --> APP(["app"])
  APP --> ENV["  .env  "]
  APP --> README["  README.md  "]`}
				id="filesystem-tree"
			/>
			<p class="mt-2 px-1 text-xs" style="color: var(--color-text-muted);">
				Reading the tree: the file <code>.env</code> lives at
				<code>/home/vibe/projects/app/.env</code>
				— root, then home, then vibe, then projects, then app.
			</p>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Absolute vs. Relative
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				An <strong>absolute path</strong> starts at the root with
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">/</code
				>
				and works from anywhere — a full street address. A <strong>relative path</strong> starts from
				wherever you're currently standing — "two doors down." Both name the same file:
			</p>

			<CodeBlock
				title="Same file, two addresses"
				code={`# Absolute: works no matter where you are
cat /home/vibe/projects/app/README.md

# Relative: works if you're standing in /home/vibe
cat projects/app/README.md`}
			/>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Four Shortcuts Every Path Uses
			</h4>

			<div class="my-4 overflow-hidden rounded-lg" style="background: var(--color-bg-secondary);">
				<table class="w-full text-[13px]">
					<thead>
						<tr style="background: var(--color-bg-tertiary);">
							<th class="px-4 py-2 text-left font-semibold" style="color: var(--color-text);"
								>Symbol</th
							>
							<th class="px-4 py-2 text-left font-semibold" style="color: var(--color-text);"
								>Means</th
							>
							<th class="px-4 py-2 text-left font-semibold" style="color: var(--color-text);"
								>Example</th
							>
						</tr>
					</thead>
					<tbody style="color: var(--color-text-secondary);">
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);">/</code
								></td
							>
							<td class="px-4 py-2">The root — the very top of the tree</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);">/etc/hosts</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);">~</code
								></td
							>
							<td class="px-4 py-2">Your home directory (here, /home/vibe)</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);"
								>~/projects/app</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);">.</code
								></td
							>
							<td class="px-4 py-2">The current directory — "right here"</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);">./script.sh</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);">..</code
								></td
							>
							<td class="px-4 py-2">The parent directory — one level up</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);"
								>../other-project</td
							>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				And they compose. Standing in <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>~/projects/app</code
				>, the path
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>../../documents</code
				>
				means "up two levels, then into documents." Now you can re-read the AI's instruction:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>~/projects/app/.env</code
				>
				is a hidden file named .env, inside app, inside projects, inside your home directory.
			</p>

			<Callout type="important">
				<strong>TAB completion is not optional.</strong> Type the first few letters of any path and
				press <strong>TAB</strong>: the shell finishes the name for you. Nothing happens? Press TAB
				twice to see every possible completion. This is THE typo-prevention habit — a completed path
				is a path that <em>exists</em>, spelled exactly right, with spaces and special characters
				escaped for you. Professionals never type a full path by hand, and after this section,
				neither do you. Try it:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd pro</code
				>, TAB, watch it become
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cd projects/</code
				>.
			</Callout>

			<Callout type="tip">
				Spaces are the classic path trap: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cd My Projects</code
				>
				tells the shell to cd into "My" and hands it a mystery second word. Wrap it in quotes (<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cd "My Projects"</code
				>) — or just TAB-complete, which escapes the space automatically. Better yet, name your own
				folders with dashes:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">my-projects</code
				>.
			</Callout>

			<VibeBox
				prompts={[
					'Explain this path to me piece by piece: ~/projects/app/.env',
					'Give me the absolute path to my current directory and a relative path from here to my home folder'
				]}
			/>
		</div>

		<!-- 2.3 Changing Directories -->
		<div id="section-2-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={MoveRight}
				title="2.3 Changing Directories"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You can read the map; now walk it. <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>
				("change directory") moves you to any path you can name — and since you just learned to name every
				path on the machine, you can now go anywhere.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/changing-directories.webp"
					alt="cd — walking the filesystem tree from directory to directory"
					caption="cd moves you through the tree; cd - is the 'back' button"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> Your project lives at
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>~/projects/app</code
				>
				but your terminal opens in
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">~</code
				>. Every command the AI gives you assumes you've made the trip.
			</Callout>

			<CodeBlock
				title="The moves you'll use every day"
				code={`cd projects/app   # Walk down into a folder (relative path)
pwd               # /home/vibe/projects/app — always verify
cd ..             # Up one level, to projects
cd ~              # Jump home from anywhere (plain 'cd' does the same)
cd -              # Bounce back to wherever you just were`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That last one is a gem most tutorials skip: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd -</code
				>
				toggles between your two most recent locations — perfect when you're hopping between a project
				and a config folder. And remember the habit from 2.2: type
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>, a few letters, then TAB your way down the tree.
			</p>

			<Callout type="tip">
				<strong>You can't fall off the map.</strong>
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>
				never creates, changes, or deletes anything — it only moves your point of view. Mistype a name
				and the worst you get is
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>no such file or directory</code
				>, a completely harmless error. Genuinely lost?
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd ~</code
				> teleports you home from anywhere. Wander boldly.
			</Callout>

			<Callout type="note">
				One subtlety worth knowing early: your location belongs to <em>this</em> terminal window. Each
				tab or window keeps its own working directory, and where you are affects nothing outside the shell
				— your editor, your files, and other terminals don't move when you do.
			</Callout>

			<h4
				id="navigation"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Find the Lost API Key
			</h4>
			<PlaygroundNote>
				A real (simulated) filesystem runs in your browser. Somewhere in the nested folders below
				your home directory hides a lost API key — use <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">pwd</code
				>,
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls -a</code
				>, and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>
				to hunt it down. Type
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">help</code
				> for the full command list.
			</PlaygroundNote>
			<LessonActivity title="Find the Lost API Key" scenarioId="navigation" id="navigation" />

			<VibeBox
				prompts={[
					'Take me to my project folder and confirm where I ended up',
					"I'm lost in some deep directory — get me back home and show me the path I took"
				]}
			/>
		</div>

		<!-- 2.4 Making Things -->
		<div id="section-2-4" class="mb-14">
			<SectionHeader
				level="section"
				icon={FolderPlus}
				title="2.4 Making Things"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				So far you've been a tourist — looking, never touching. Time to build. Two commands create
				the skeleton of every project you'll ever start: <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mkdir</code
				>
				for folders and
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">touch</code
				> for empty files.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/making-things.webp"
					alt="mkdir and touch — growing new folders and files in the tree"
					caption="mkdir grows new branches; touch sprouts empty files"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> The AI proposes a project layout — "create a src folder with a components
				subfolder, plus a README." You could click through a file manager… or type one line.
			</Callout>

			<CodeBlock
				title="Create folders and files"
				code={`mkdir notes            # One new folder in the current directory
mkdir src tests docs   # Three at once
touch README.md        # One new, empty file
ls                     # Verify — trust, but verify`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Plain <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mkdir</code
				>
				has one rule: the parent must already exist. Ask it for a nested path and it refuses:
			</p>

			<CodeBlock
				title="Nested folders need -p"
				code={`mkdir src/components/buttons
# mkdir: cannot create directory 'src/components/buttons': No such file or directory

mkdir -p src/components/buttons   # -p creates every missing parent
# (no output — in the shell, silence means success)`}
			/>

			<Callout type="tip">
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mkdir -p</code
				>
				is also <em>re-runnable</em>: if the folders already exist, it succeeds quietly instead of
				erroring. That's why AI-generated setup scripts always reach for
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-p</code
				> — the command is safe whether it's the first run or the fifth.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">touch</code
				>
				has a funny origin story: its real job is updating a file's "last modified" timestamp — touching
				it. But if the file doesn't exist, touch creates it, empty. That side effect became its main job:
				it's the standard way to say "make me a blank file right here."
			</p>

			<CodeBlock
				title="A whole project skeleton in three lines"
				code={`mkdir -p my-app/src/components my-app/tests
touch my-app/README.md my-app/src/main.js
ls -R my-app   # -R lists recursively, the whole tree at once`}
			/>

			<VibeBox
				prompts={[
					'Set up a folder structure for a small Python project — show me the mkdir commands before running them',
					'Create the standard src/tests/docs skeleton in this directory and list the result'
				]}
			/>
		</div>

		<!-- 2.5 Looking Inside Files -->
		<div id="section-2-5" class="mb-8">
			<SectionHeader
				level="section"
				icon={Eye}
				title="2.5 Looking Inside Files"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				An AI agent just wrote a config file into your project. Before you trust it, you want to
				<em>read</em> it — without the ceremony of opening an editor. The terminal has a whole toolkit
				for exactly this, graded by file size.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/looking-inside.webp"
					alt="cat, less, head, tail — reading file contents in the terminal"
					caption="cat for a glance, less for a read, head and tail for the edges"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> "What did the agent actually put in
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">config.yaml</code
				>?" Reading files is how you verify work — an instinct this whole course keeps returning to.
			</Callout>

			<CodeBlock
				title="cat — dump the whole file to the screen"
				code={`cat config.yaml
# port: 8080
# debug: false
# database: ./data/app.db`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cat</code
				>
				(short for "concatenate") is perfect for short files — it prints everything and returns your prompt.
				But cat a 10,000-line log and it firehoses past you. For anything long, you want a
				<strong>pager</strong>:
			</p>

			<CodeBlock
				title="less — read at your own pace"
				code={`less server.log
# Opens a full-screen reader:
#   space / b     page down / up
#   arrow keys    scroll line by line
#   /error        search for "error" (n = next match)
#   q             QUIT — back to your prompt`}
			/>

			<Callout type="important">
				<strong>Remember q.</strong> Getting "trapped" in a full-screen pager is every beginner's
				rite of passage: the prompt vanishes, typing does strange things, panic sets in. Press
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">q</code
				>
				and you're free. This matters double because
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">man</code
				> pages (Part 1) open in less too — same keys, same escape hatch.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Sometimes you only care about the edges of a file — the header row of a CSV, or the most
				recent lines of a log. That's <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">head</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">tail</code
				>:
			</p>

			<CodeBlock
				title="head and tail — just the edges"
				code={`head server.log        # First 10 lines
head -n 3 server.log   # First 3 lines
tail server.log        # Last 10 lines — where the newest log entries live
tail -n 20 server.log  # Last 20`}
			/>

			<Callout type="tip">
				Out in the real world (beyond this playground), <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">tail -f</code
				>
				("follow") keeps the file open and streams new lines as they're written — the classic way to watch
				a server log live while your app runs. Press
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">Ctrl+C</code
				> to stop following.
			</Callout>

			<div class="mb-6 grid gap-3 sm:grid-cols-4">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 text-[13px] font-semibold"
						style="color: var(--color-text); font-family: var(--font-mono);"
					>
						cat
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Short files. Whole thing, instantly.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 text-[13px] font-semibold"
						style="color: var(--color-text); font-family: var(--font-mono);"
					>
						less
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Long files. Scroll, search, q to quit.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 text-[13px] font-semibold"
						style="color: var(--color-text); font-family: var(--font-mono);"
					>
						head
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						The beginning. Headers, first impressions.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 text-[13px] font-semibold"
						style="color: var(--color-text); font-family: var(--font-mono);"
					>
						tail
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						The end. Fresh log lines, latest entries.
					</p>
				</div>
			</div>

			<h4
				id="workspace-setup"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Build Your Workspace
			</h4>
			<PlaygroundNote>
				Put the whole part together: navigate with <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cd</code
				>, build a project skeleton with
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mkdir -p</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">touch</code
				>, then verify your work with
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cat</code
				>.
			</PlaygroundNote>
			<LessonActivity
				title="Build Your Workspace"
				scenarioId="workspace-setup"
				id="workspace-setup"
			/>

			<VibeBox
				prompts={[
					'Show me the last 30 lines of the newest log file in this project',
					'Read the config file the agent just created and explain each setting to me'
				]}
			/>
		</div>
	</div>
</section>
