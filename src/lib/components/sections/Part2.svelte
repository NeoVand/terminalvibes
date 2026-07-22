<script lang="ts">
	import {
		Compass,
		MapPin,
		Route,
		MoveRight,
		FolderPlus,
		Eye,
		List,
		Rows3,
		FileText,
		BookOpen,
		ArrowUpToLine,
		ArrowDownToLine
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
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
			definition={`flowchart LR
  A(["pwd"]) --> B(["ls"])
  B --> C(["cd"])
  C -->|"repeat"| A
  C --> D(["mkdir / touch"])
  D --> E(["cat / less"])
  E --> B`}
			id="moving-around-overview"
		/>

		<Callout type="important">
			This three-beat rhythm — <strong
				><Code code="pwd" />
				&rarr;
				<Code code="ls" />
				&rarr;
				<Code code="cd" /></strong
			>
			— is the terminal equivalent of looking up from your phone to check the street signs. Run it any
			time you feel lost, and
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
				<strong>The scenario:</strong> Your AI assistant says "run
				<Code code="npm install" /> in the project folder." Node is the program that runs JavaScript outside
				a browser, and <Code code="npm" /> is how a Node project fetches its
				<strong>dependencies</strong> — the code other people wrote that it leans on rather than
				rewriting. All of it lands in a <Code code="node_modules" /> folder, routinely hundreds of megabytes
				of it. Which folder is your terminal actually in right now?
			</Callout>

			<p class="mb-4" style="color: var(--color-text-secondary);">
				<Code code="pwd" />
				("print working directory") answers the question in one line:
			</p>

			<CodeBlock
				title="Ask the shell where you are"
				code={`pwd
# /home/vibe`}
			/>

			<p class="mt-4 mb-4" style="color: var(--color-text-secondary);">
				That answer — <Code code="/home/vibe" />
				— is a <strong>path</strong>, the full address of the folder you're standing in (paths get
				their own section next). It also names your
				<strong style="color: var(--color-text);">home directory</strong> — the folder that belongs
				to your account, where your files, settings and downloads live. Every account on the machine
				gets one, and this one is the home of the account named
				<Code code="vibe" /> — you. Now look around with
				<Code code="ls" /> ("list"):
			</p>

			<CodeBlock
				title="See what's in the current directory"
				code={`ls
# documents  notes.txt  projects`}
			/>

			<div class="mb-6 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-tip);"
					>
						<MapPin size={14} />
						<Code code="pwd" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"Where am I?" — prints the full path of your working directory. Instant, harmless, run
						it constantly.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-tip);"
					>
						<List size={14} />
						<Code code="ls" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"What's here?" — lists the files and folders in the current directory (or any path you
						give it).
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-tip-bg);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-tip);"
					>
						<Rows3 size={14} />
						<Code code="ls -l" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						"Tell me more" — one file per line with sizes, dates, and permissions: who's allowed to
						read or change each file.
					</p>
				</div>
			</div>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Hidden Layer: Dotfiles
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Plain <Code code="ls" />
				is holding out on you. Any file or folder whose name starts with a dot — a
				<strong style="color: var(--color-text);">dotfile</strong> — is hidden by default. That's
				where configuration lives:
				<Code code=".bashrc" />, your shell's own settings file (<CourseLink to="section-5-5" />);
				<Code code=".gitignore" />; and the
				<Code code=".env" />
				file holding your API keys — an <strong style="color: var(--color-text);">API</strong> being
				a door a service opens for other programs rather than for people, which is why that file is
				worth hiding (<CourseLink to="section-9-2" />). Add
				<Code code="-a" /> ("all") to see them:
			</p>

			<CodeBlock
				title="Reveal hidden files"
				code={`ls -a
# .  ..  .bashrc  .config  documents  notes.txt  projects`}
			/>

			<Callout type="tip">
				Notice the first two entries: <Code code="." />
				and
				<Code code=".." />. They're not files — they're built-in nicknames for "this directory" and
				"the parent directory," and they show up in <em>every</em> folder. They're about to become very
				useful in the next section.
			</Callout>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				A First Peek at <Code code="ls -l" />
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The long listing packs a lot into each line. For now, read just three things: the leading
				<Code code="d" />
				means "directory," the number before the date is the size in
				<strong style="color: var(--color-text);">bytes</strong>, and the name is at the end. A byte
				is one character's worth of storage, so a 118-byte file holds roughly 118 characters. The
				rest of that cryptic string is the permissions code, and we decode it fully in <CourseLink
					to="part-5"
				/>.
			</p>

			<CodeBlock
				title="The long listing — details per file"
				code={`ls -l
# total 12
# drwxr-xr-x  3 vibe staff 4096 Jul 10 09:14 documents
# -rw-r--r--  1 vibe staff  118 Jul 12 08:30 notes.txt
# drwxr-xr-x  4 vibe staff 4096 Jul 11 17:02 projects`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Three things in that block mislead on sight. <Code code="total 12" /> is not a count of the files
				— it's how much disk they take up, measured in blocks rather than bytes. The small number just
				after the permissions is a link count, not a second size. And the two names beside it,
				<Code code="vibe staff" />, are the file's owner and its group. All three get taken apart in
				<CourseLink to="section-5-1" />.
			</p>

			<Callout type="note">
				Single-letter flags cluster: <Code code="ls -la" />
				is
				<Code code="ls -l -a" />
				typed faster — "long listing, including hidden files," the most common
				<Code code="ls" />
				invocation in the wild. Only single letters cluster this way, and only behind one dash (<CourseLink
					to="section-1-3"
				/>). (On Windows,
				<Code code="dir" />
				is the Command Prompt cousin of
				<Code code="ls" />
				— but inside WSL, or inside Git Bash, which bundles a bash shell into Windows,
				<Code code="ls" /> works exactly as shown.)
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
				<Code code="~/projects/app/.env" />". Is that a file? A folder? Where <em>is</em> it? You can't
				follow directions written in a language you can't read.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Everything starts at the <strong style="color: var(--color-text);">root</strong>, written as
				a single slash
				<Code code="/" /> — the one folder every other folder lives inside. Everything else hangs somewhere
				beneath it, and a path is the walk from one point to another, with
				<Code code="/" /> between each step. Fair warning, because the word gets reused: this root is
				a <em>place</em>. The other root you'll meet is a <em>person</em>, the administrator account
				in <CourseLink to="section-5-3" />, and the two have nothing to do with each other.
			</p>

			<MermaidDiagram
				definition={`flowchart TD
  ROOT(["/  (root)"]) --> HOME(["home"])
  ROOT --> USR(["usr"])
  HOME --> VIBE(["vibe (~)"])
  VIBE --> PROJ(["projects"])
  PROJ --> APP(["app"])
  APP --> ENV[".env"]
  APP --> README["README.md"]`}
				id="filesystem-tree"
			/>
			<p class="mt-2 px-1 text-xs" style="color: var(--color-text-muted);">
				Reading the tree: the file
				<Code code=".env" />
				lives at
				<Code code="/home/vibe/projects/app/.env" />
				— root, then home, then vibe, then projects, then app.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The branches sitting beside <Code code="home" /> at the top belong to the machine rather than
				to you, and a handful come up often enough to name.
				<Code code="/bin" />
				and
				<Code code="/usr/bin" />
				hold binaries — the programs themselves.
				<Code code="/etc" />
				holds system-wide configuration — that's what
				<Code code="/etc/hosts" /> in the table below is, the short list of names your machine resolves
				itself before asking the network.
				<Code code="/tmp" />
				is scratch space anyone can write to and the machine may clear without asking. And
				<Code code="/usr" />, despite the spelling, is where the system's own software lives — it
				has nothing to do with users.
			</p>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Absolute vs. Relative
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				An <strong>absolute path</strong> starts at the root with
				<Code code="/" />
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
							<td class="px-4 py-2"><Code code="/" /></td>
							<td class="px-4 py-2">The root — the very top of the tree</td>
							<td class="px-4 py-2 text-xs"><Code code="/etc/hosts" /></td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"><Code code="~" /></td>
							<td class="px-4 py-2">Your home directory (here, /home/vibe)</td>
							<td class="px-4 py-2 text-xs"><Code code="~/projects/app" /></td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"><Code code="." /></td>
							<td class="px-4 py-2">The current directory — "right here"</td>
							<td class="px-4 py-2 text-xs"><Code code="./script.sh" /></td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"><Code code=".." /></td>
							<td class="px-4 py-2">The parent directory — one level up</td>
							<td class="px-4 py-2 text-xs"><Code code="../other-project" /></td>
						</tr>
					</tbody>
				</table>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				And they compose. Standing in <Code code="~/projects/app" />, the path
				<Code code="../../documents" />
				means "up two levels, then into documents." Now you can re-read the AI's instruction:
				<Code code="~/projects/app/.env" />
				is a hidden file named
				<Code code=".env" />, inside app, inside projects, inside your home directory.
			</p>

			<Callout type="important">
				<strong>Treat TAB completion as a habit, not a convenience.</strong> Type the first few
				letters of any path and press <strong>TAB</strong>: the shell finishes the name for you.
				Nothing happens? Press TAB twice to see every possible completion. A completed path is a
				path that <em>exists</em>, spelled exactly right, with spaces and special characters escaped
				for you. Most people who look fast in a terminal are completing, not typing. Try it:
				<Code code="cd pro" />, TAB, watch it become
				<Code code="cd projects/" />. That trailing slash is a marker meaning "this one's a folder"
				— the shell mostly doesn't care either way, but the habit stops you misreading your own
				commands later.
			</Callout>

			<Callout type="tip">
				Spaces are the classic path trap: <Code code="cd My Projects" />
				tells the shell to cd into "My" and hands it a mystery second word. Wrap it in quotes (<Code
					code="cd &quot;My Projects&quot;"
				/>) — or just TAB-complete, which escapes the space automatically. Better yet, name your own
				folders with dashes:
				<Code code="my-projects" />.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Those quotes are worth understanding properly, because you'll be reaching for them for the
				rest of the course. There are two kinds, and one difference that matters.
				<strong style="color: var(--color-text);">Single quotes</strong>
				are literal — nothing inside them means anything to the shell, so
				<Code code="'$HOME'" />
				stays five characters instead of turning into the path to your home directory, and
				<Code code="'*.txt'" />
				stays five characters instead of becoming a list of files.
				<strong style="color: var(--color-text);">Double quotes</strong> still let
				<Code code="$NAME" />
				and
				<Code code="$(...)" /> expand into their values (<CourseLink to="section-5-4" />) while
				still protecting the spaces. Reach for single quotes when you want the shell to keep its
				hands off, double quotes when you want a value in the middle of a phrase.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A backslash does the same job for exactly one character: <Code code="My\ Projects" /> is one filename,
				not two words — which is what TAB completion is doing when it "escapes" a space for you. Anything
				the shell would otherwise read as punctuation — a space, a
				<Code code="*" />, a
				<Code code="$" />, a quote mark — can be defused by putting a backslash in front of it.
			</p>

			<VibeBox
				prompts={[
					'Explain this path to me piece by piece: ~/projects/app/.env',
					'Give me the absolute path to my current directory and a relative path from here to my home folder'
				]}
			/>
			<h4
				id="quoting"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Mind the Gap
			</h4>
			<PlaygroundNote>
				Two folders here have spaces in their names — the classic trap. Quote the path to
				<Code code="cd &quot;My Projects&quot;" />, then leave a <Code code="shipped.txt" /> behind.
			</PlaygroundNote>
			<LessonActivity title="Mind the Gap" scenarioId="quoting" id="quoting" />
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
				You can read the map; now walk it. <Code code="cd" />
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
				<strong>The setup:</strong> Your project lives at
				<Code code="~/projects/app" />
				but your terminal opens in
				<Code code="~" />. Every command the AI gives you assumes you've made the trip.
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
				That last one is a gem most tutorials skip: <Code code="cd -" />
				toggles between your two most recent locations — perfect when you're hopping between a project
				and a config folder. It's also one of the rare places a lone dash is a value rather than a flag
				(<CourseLink to="section-1-3" />) — here it stands in for "the last place I was," not for a
				setting. And remember the habit from 2.2: type
				<Code code="cd" />, a few letters, then TAB your way down the tree.
			</p>

			<Callout type="tip">
				<strong>You can't fall off the map.</strong>
				<Code code="cd" />
				never creates, changes, or deletes anything — it only moves your point of view. Mistype a name
				and the worst you get is
				<Code code="no such file or directory" />, a completely harmless error. Genuinely lost?
				<Code code="cd ~" /> teleports you home from anywhere. Wander boldly.
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
				your home directory hides a lost API key — use <Code code="pwd" />,
				<Code code="ls -a" />, and
				<Code code="cd" />
				to hunt it down. Type
				<Code code="help" /> for the full command list.
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
				the skeleton of every project you'll ever start: <Code code="mkdir" />
				for folders and
				<Code code="touch" /> for empty files.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/making-things.webp"
					alt="mkdir and touch — growing new folders and files in the tree"
					caption="mkdir grows new branches; touch sprouts empty files"
				/>
			</div>

			<Callout type="note">
				<strong>The scenario:</strong> The AI proposes a project layout — "create a
				<Code code="src" /> folder with a <Code code="components" /> subfolder, plus a README." You could
				click through a file manager… or type one line.
			</Callout>

			<CodeBlock
				title="Create folders and files"
				code={`mkdir notes            # One new folder in the current directory
mkdir src tests docs   # Three at once — src is short for "source"
touch README.md        # One new, empty file
ls                     # Verify — trust, but verify`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Plain <Code code="mkdir" />
				has one rule: the parent must already exist. Ask it for a nested path and it refuses:
			</p>

			<CodeBlock
				title="Nested folders need `-p`"
				code={`mkdir src/components/buttons
# mkdir: cannot create directory 'src/components/buttons': No such file or directory

mkdir -p src/components/buttons   # -p = parents: create every missing one on the way
# (no output — in the shell, silence means success)`}
			/>

			<Callout type="tip">
				<Code code="mkdir -p" />
				is also <em>re-runnable</em>: if the folders already exist, it succeeds quietly instead of
				erroring. That's why AI-generated setup scripts always reach for
				<Code code="-p" /> — the command is safe whether it's the first run or the fifth.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="touch" />
				has a funny origin story: its real job is updating a file's "last modified" timestamp — touching
				it. But if the file doesn't exist,
				<Code code="touch" /> creates it, empty. That side effect became its main job: it's the standard
				way to say "make me a blank file right here."
			</p>

			<CodeBlock
				title="A whole project skeleton in three lines"
				code={`mkdir -p my-app/src/components my-app/tests
touch my-app/README.md my-app/src/main.js
ls -R my-app   # -R walks into every folder inside, and those folders' folders too`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Nothing on the machine requires that shape — <Code code="src" />, <Code code="tests" /> and
				<Code code="docs" /> are a convention other people will recognize, not a rule anything enforces.
				And that walking-into-everything behaviour has a name,
				<em>recursive</em>, which comes back in <CourseLink to="section-3-1" /> as the flag that lets
				copying and deleting reach a whole tree at once.
			</p>

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
				<strong>The question:</strong> "What did the agent actually put in
				<Code code="config.yaml" />?" Reading files is how you verify work — an instinct this whole
				course keeps returning to.
			</Callout>

			<CodeBlock
				title="`cat` — dump the whole file to the screen"
				code={`cat config.yaml
# port: 8080
# debug: false
# database: ./data/app.db`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That file is <strong style="color: var(--color-text);">YAML</strong> — a config format built
				to be read by humans, one <Code code="key: value" /> to a line. (A config file being any file
				that changes how a program behaves without changing the program itself.)
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A few other extensions keep turning up and work the same way.
				<Code code=".csv" />
				is comma-separated values: one record per line, the fields split on commas, the first line usually
				naming the columns.
				<Code code=".md" />
				is Markdown — plain text with light formatting marks, like
				<Code code="#" /> for a heading. <Code code=".sh" /> is a shell script. Every one of them is ordinary
				text underneath: a file of characters, each character stored as a number. That's why the commands
				below read all of them equally well, and why an extension is a convention for humans and editors
				rather than the thing that makes a file work.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="cat" />
				(short for "concatenate") is perfect for short files — it prints everything and returns your prompt.
				But
				<Code code="cat" />
				a 10,000-line log and it firehoses past you. For anything long, you want a
				<strong>pager</strong>:
			</p>

			<CodeBlock
				title="`less` — read at your own pace"
				code={`less server.log
# Opens a full-screen reader:
#   space / b     page down / up
#   arrow keys    scroll line by line
#   /error        search for "error" — press Enter to run it (n = next match)
#   q             QUIT — back to your prompt`}
			/>

			<Callout type="important">
				<strong>Remember q.</strong> Getting "trapped" in a full-screen pager is every beginner's
				rite of passage: the prompt vanishes, typing does strange things, panic sets in. Press
				<Code code="q" />
				and you're free. This matters double because
				<Code code="man" /> pages (<CourseLink to="part-1" />) open in less too — same keys, same
				escape hatch.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				While we're here, four escape hatches worth memorizing now — because each one has stranded
				somebody for an embarrassingly long time. Two are characters you type; two are chords, held
				down together in one motion. The comments say which is which:
			</p>

			<CodeBlock
				title="How to get out of things"
				code={`q            # type it — any pager: less, or a man page. One keypress, no Enter
:q!          # type it — vim. Press Esc FIRST, then these three, then Enter (:wq saves instead)
Ctrl+X       # chord — nano. It says so at the bottom, but nobody reads it
Ctrl+C       # chord — a running command, or a line you typed but haven't run`}
			/>

			<p class="mt-3 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code=":q!" /> is the famous one. Git — the tool that records snapshots of a project as you
				work (<CourseLink to="section-5-5" />) — drops you into <Code code="vim" /> on most machines to
				write the note that goes with a snapshot. The keyboard stops behaving, there's no visible way
				out, and the answer is
				<Code code="Esc" /> then <Code code=":q!" /> then Enter, which leaves without saving. You are
				not expected to learn vim today; you're just expected to be able to leave.
			</p>

			<Callout type="tip" title="The one editor you can walk into on purpose">
				Those escape hatches treat editors as places you fell into. <Code code="nano" /> is the one worth
				entering deliberately: <Code code="nano notes.txt" /> opens the file, you type the way you'd type
				anywhere, and the only two chords that matter are printed at the bottom of its screen the whole
				time — <Code code="Ctrl+O" /> then Enter to save ("write out"),
				<Code code="Ctrl+X" /> to leave. It ships on nearly every Linux machine and every Mac, and the
				day <CourseLink to="section-9-5" /> lands you on a server with a config file to fix, this is the
				tool you'll reach for. (Not in the playground — its files are edited with
				<Code code="echo" /> and friends; <Code code="nano" /> is a real-machine comfort.)
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Sometimes you only care about the edges of a file — the header row of a CSV, or the most
				recent lines of a log. That's <Code code="head" />
				and
				<Code code="tail" />:
			</p>

			<CodeBlock
				title="`head` and `tail` — just the edges"
				code={`head server.log        # First 10 lines
head -n 3 server.log   # First 3 lines
tail server.log        # Last 10 lines — where the newest log entries live
tail -n 20 server.log  # Last 20`}
			/>

			<Callout type="tip">
				Out in the real world (beyond this playground), <Code code="tail -f" />
				("follow") keeps the file open and streams new lines as they're written — the classic way to watch
				a server log live while your app runs. Press
				<Code code="Ctrl+C" /> to stop following.
			</Callout>

			<div class="mb-6 grid gap-3 sm:grid-cols-4">
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<FileText size={14} style="color: var(--color-primary);" />
						<Code code="cat" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Short files. Whole thing, instantly.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<BookOpen size={14} style="color: var(--color-primary);" />
						<Code code="less" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Long files. Scroll, search, q to quit.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<ArrowUpToLine size={14} style="color: var(--color-primary);" />
						<Code code="head" />
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						The beginning. Headers, first impressions.
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-bg-secondary);">
					<p
						class="mb-1 flex items-center gap-1.5 text-[13px] font-semibold"
						style="color: var(--color-text);"
					>
						<ArrowDownToLine size={14} style="color: var(--color-primary);" />
						<Code code="tail" />
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
				Put the whole part together: navigate with <Code code="cd" />, build a project skeleton with
				<Code code="mkdir -p" />
				and
				<Code code="touch" />, then verify your work with
				<Code code="ls" />
				and
				<Code code="cat" />.
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

		<ChallengeActivity title="Scaffold It From Here" part={2} id="ch-2-scaffold" />
	</div>
</section>
