<script lang="ts">
	import { FolderTree, Copy, MoveRight, Trash2, Hash } from 'lucide-svelte';
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

<section id="part-3" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={FolderTree}
			partLabel="Part 3"
			title="Copy, Move, Delete: Power Tools and the Safety Rules"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"The terminal assumes you mean exactly what you say. Deleting is the moment to be sure you
			do."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			In Part 2 you learned to look and to create. Now come the tools that <em>change</em> things:
			copy, move, rename, delete. They're wonderfully fast — one line does what fifty drag-and-drops
			would — and they come with a responsibility the graphical world hid from you: there is no
			confirmation dialog, and for
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
			>, no trash can. This part teaches the commands and, just as deliberately, the habits that
			make them safe.
		</p>

		<Callout type="important">
			The safety net in the terminal isn't a feature — it's a <strong>ritual</strong>: look before
			you act (<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
			>
			first), prefer interactive flags (<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">-i</code
			>) while learning, and preview every wildcard with
			<code
				class="rounded px-1.5 py-0.5 text-xs"
				style="background: var(--color-code-bg); font-family: var(--font-mono);">echo</code
			> before letting it loose. Every habit in this part exists because someone, somewhere, lost a day's
			work not having it.
		</Callout>

		<!-- 3.1 Copying -->
		<div id="section-3-1" class="mb-14">
			<SectionHeader level="section" icon={Copy} title="3.1 Copying" color="var(--color-primary)" />

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Copying is the gentlest of the three power tools — the original is never touched. It's also
				your cheapest insurance policy: one <code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cp</code
				> before an experiment means there's always a way back.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/copying.webp"
					alt="cp — duplicating files and folders, originals untouched"
					caption="cp duplicates: the original stays put, the copy goes where you point"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You're about to let an AI agent rewrite
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">config.yaml</code
				>. If its "improvement" breaks everything, you want the original back in one command.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cp</code
				>
				always reads the same way: <strong>source first, destination second</strong> — "copy
				<em>this</em>, to <em>there</em>." What "there" means depends on what the destination is:
			</p>

			<CodeBlock
				title="The two shapes of cp"
				code={`# Destination is a new name: copy + rename in one step
cp config.yaml config.yaml.bak

# Destination is an existing folder: copy INTO it, same name
cp config.yaml backups/`}
			/>

			<Callout type="tip">
				That first line is the <strong>backup-before-experiment</strong> pattern, and it's worth
				making a reflex: before any risky edit — yours or an agent's —
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cp file file.bak</code
				>. Restoring later is just the reverse:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cp config.yaml.bak config.yaml</code
				>. (Part 6's Git-free time machine, until you have Git.)
			</Callout>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Copying Folders Needs -r
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Ask <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cp</code
				> to copy a directory and it declines — a folder can contain thousands of files, and cp wants
				you to say you mean it:
			</p>

			<CodeBlock
				title="cp -r for directories"
				code={`cp projects backup-projects
# cp: -r not specified; omitting directory 'projects'

cp -r projects backup-projects   # -r = recursive: the folder and everything inside`}
			/>

			<Callout type="warning">
				<strong>cp overwrites silently.</strong> If the destination file already exists, cp replaces
				it — no question asked, old contents gone. While you're learning, add
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-i</code
				>
				("interactive"):
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cp -i config.yaml backups/</code
				>
				asks
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">overwrite?</code
				> before clobbering anything. This same silent-overwrite rule returns with mv in the next section
				— it's a theme.
			</Callout>

			<VibeBox
				prompts={[
					'Back up my config file before you change anything, and tell me the restore command',
					'Copy the whole src folder to src-backup so we can experiment safely'
				]}
			/>
		</div>

		<!-- 3.2 Moving & Renaming -->
		<div id="section-3-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={MoveRight}
				title="3.2 Moving &amp; Renaming"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Here's a small mind-bender: the terminal has no "rename" command, because it doesn't need
				one. Renaming <em>is</em> moving — moving a file to a new name in the same place. One
				command,
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mv</code
				>, does both.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/moving-renaming.webp"
					alt="mv — one command for both moving and renaming"
					caption="mv relocates or renames — same command, and the original doesn't stay behind"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> The agent scaffolded your project but named the main file
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">untitled.py</code
				>, and dropped three data files in the project root that belong in
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">data/</code
				>. Tidy it up.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Like <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cp</code
				>, it's always <strong>source first, destination second</strong> — and the same two shapes:
			</p>

			<CodeBlock
				title="mv — rename or relocate"
				code={`# Destination is a new name: RENAME
mv untitled.py main.py

# Destination is an existing folder: MOVE into it
mv sales.csv users.csv logs.csv data/

# Both at once: move AND rename
mv draft.md docs/chapter-1.md`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two nice surprises compared to <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cp</code
				>: mv moves whole folders <em>without</em> needing
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-r</code
				>
				(on the same disk it just relabels the folder's address — instant, even for gigabytes), and since
				nothing is duplicated, there's no copy lying around to get stale.
			</p>

			<Callout type="warning">
				<strong>The overwrite danger, part two.</strong> If the destination name already exists,
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mv</code
				>
				replaces it silently — and unlike cp, you lose <em>both</em> versions of the story: the
				destination's old contents are gone, and the source no longer exists under its old name.
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>mv notes.txt ideas.txt</code
				>
				when ideas.txt already exists destroys ideas.txt. The fix is the same reflex:
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mv -i</code
				>
				asks before overwriting, and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				> the destination first when in doubt.
			</Callout>

			<VibeBox
				prompts={[
					'Rename untitled.py to main.py and move every CSV in this folder into data/',
					'Reorganize these files into sensible folders — show me the mv commands before running them'
				]}
			/>
		</div>

		<!-- 3.3 Deleting -->
		<div id="section-3-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Trash2}
				title="3.3 Deleting (Carefully)"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				This is the most important safety lesson in the entire course. Everything else in the
				terminal is forgiving — errors are harmless, cd can't hurt you, cp leaves originals alone.
				<code
					class="rounded px-1.5 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				> is the exception. Read this section twice.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/deleting.webp"
					alt="rm — deletion with no trash can and no undo"
					caption="rm doesn't move files to a trash can — it erases them, immediately and permanently"
				/>
			</div>

			<Callout type="caution">
				<strong>rm has no trash can.</strong> When your file manager "deletes" a file, it moves it
				to the Trash, where it sits recoverable for weeks.
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				>
				does no such thing: the file is gone the instant you press Enter. No confirmation, no undo, no
				recovery. Treat every
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				> as permanent, because it is.
			</Callout>

			<CodeBlock
				title="The rm family"
				code={`rm old-notes.txt        # Delete one file. Permanently.
rm draft1.md draft2.md  # Delete several
rmdir empty-folder      # Delete a folder — only works if it's EMPTY
rm -r old-project       # Delete a folder and everything inside it
rm -f missing.txt       # -f = force: no complaints if it doesn't exist`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Each flag is reasonable alone. <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-r</code
				>
				recurses into folders;
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">-f</code
				>
				suppresses prompts and "no such file" errors so scripts run clean. Combined as
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -rf</code
				>, they mean:
				<em>delete everything at this path, recursively, without asking, without stopping</em>. Now
				add the two ingredients from your recent lessons and you have the terminal's most famous
				disaster recipe:
			</p>

			<div class="mb-6 grid gap-3 sm:grid-cols-3">
				<div class="rounded-lg p-4" style="background: var(--color-caution-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-caution);">
						rm -rf — no questions
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						Recursive and forced: nothing slows it down, nothing asks "are you sure?"
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-caution-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-caution);">
						+ a wildcard
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						<code style="font-family: var(--font-mono);">*</code> expands to "everything here" — however
						much that turns out to be (next section).
					</p>
				</div>
				<div class="rounded-lg p-4" style="background: var(--color-caution-bg);">
					<p class="mb-1 text-[13px] font-semibold" style="color: var(--color-caution);">
						+ the wrong directory
					</p>
					<p class="text-xs" style="color: var(--color-text-secondary);">
						You <em>thought</em> you were in ~/tmp. You were in ~/projects. Part 2's pwd habit exists
						for this moment.
					</p>
				</div>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A single mistyped space does it too: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>rm -rf old-app /</code
				>
				(note the stray space) is not "delete old-app/" — it's "delete old-app,
				<em>and also the entire filesystem starting at root</em>." This exact typo has destroyed
				production servers. It's why modern systems refuse plain
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -rf /</code
				>
				without an extra flag — but they won't save you from
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">~</code
				> or a wrong folder.
			</p>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Ritual: ls First, Then rm
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Here's the habit that makes rm boring instead of scary. Never aim rm at anything you haven't
				just looked at. List first, confirm with your eyes, then recall the command (<strong
					>up-arrow</strong
				>) and swap
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				>
				for
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				> — same targets, guaranteed:
			</p>

			<CodeBlock
				title="Look, confirm, then delete"
				code={`ls old-project          # 1. LOOK: what exactly is in there?
pwd                     # 2. CONFIRM: am I where I think I am?
rm -r old-project       # 3. Same target you just inspected — up-arrow, edit, Enter`}
			/>

			<Callout type="important">
				<strong>The AI angle — this is a stop-and-read moment.</strong> When a coding agent proposes
				a command containing
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -rf</code
				>, do not rubber-stamp it. Read three things before approving:
				<strong>the exact path</strong>
				(absolute? relative to <em>what</em>?), <strong>any wildcard</strong> (what could it expand
				to?), and <strong>the working directory</strong> the agent is running in. Agents make location
				mistakes exactly the way beginners do — they just make them faster. Deletion is the one category
				of command you always read in full; Part 6 turns this instinct into a complete auditing method.
			</Callout>

			<Callout type="tip">
				Training wheels while you learn: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -i</code
				>
				asks before every single deletion, and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -I</code
				> (capital i) asks once when deleting more than three files — a good permanent default. And for
				anything precious, the calmer move is often mv: relocate to a scrap folder today, delete the scrap
				folder next week.
			</Callout>

			<h4
				id="tidy-up"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Clean the Downloads Mess
			</h4>
			<PlaygroundNote>
				A cluttered downloads folder awaits: inspect what's there with <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">ls</code
				>
				and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">cat</code
				>, make folders, sort keepers into them with
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">mv</code
				>, and
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				> the junk — practicing the ls-first ritual where deletion can't hurt you.
			</PlaygroundNote>
			<LessonActivity title="Clean the Downloads Mess" scenarioId="tidy-up" id="tidy-up" />

			<VibeBox
				prompts={[
					'You suggested rm -rf — walk me through exactly what that path resolves to before I approve it',
					'Delete the build artifacts in this project, but list everything you plan to remove first'
				]}
			/>
		</div>

		<!-- 3.4 Wildcards -->
		<div id="section-3-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={Hash}
				title="3.4 Wildcards"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Everything so far has operated on files one name at a time. Wildcards — also called
				<strong>globs</strong> — let one pattern stand for many names: "every .log file," "all the photos
				from January." This is where the terminal starts beating the file manager by orders of magnitude.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/wildcards.webp"
					alt="Wildcards — one pattern matching many filenames"
					caption="A glob is a net: the shell casts it over the directory and hands your command whatever it catches"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> The agent's test run left 40
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">.tmp</code
				> files scattered through your project. Deleting them one by one would take ten minutes. One pattern
				does it in a second — if you can trust what the pattern matches.
			</Callout>

			<div class="my-4 overflow-hidden rounded-lg" style="background: var(--color-bg-secondary);">
				<table class="w-full text-[13px]">
					<thead>
						<tr style="background: var(--color-bg-tertiary);">
							<th class="px-4 py-2 text-left font-semibold" style="color: var(--color-text);"
								>Pattern</th
							>
							<th class="px-4 py-2 text-left font-semibold" style="color: var(--color-text);"
								>Matches</th
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
									style="background: var(--color-code-bg); font-family: var(--font-mono);">*</code
								></td
							>
							<td class="px-4 py-2">Any run of characters (including none)</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);"
								>*.log → app.log, errors.log</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);">?</code
								></td
							>
							<td class="px-4 py-2">Exactly one character</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);"
								>page?.html → page1.html, not page12.html</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-4 py-2"
								><code
									class="rounded px-1.5 py-0.5 text-xs"
									style="background: var(--color-code-bg); font-family: var(--font-mono);"
									>[abc]</code
								></td
							>
							<td class="px-4 py-2">One character from the set (ranges like [0-9] work too)</td>
							<td class="px-4 py-2 text-xs" style="font-family: var(--font-mono);"
								>report-[12].txt → report-1.txt, report-2.txt</td
							>
						</tr>
					</tbody>
				</table>
			</div>

			<h4 class="mt-6 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Big Idea: the Shell Expands the Glob, Not the Command
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				This is the one concept that makes wildcards predictable instead of magical. When you type
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm *.tmp</code
				>, the
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm</code
				>
				program never sees a star. The <em>shell</em> expands the pattern against the current
				directory <em>first</em>, then runs the command with the resulting list of plain filenames:
			</p>

			<MermaidDiagram
				definition={`flowchart LR
  A["rm *.tmp"] -->|"shell expands"| B["rm cache1.tmp<br/>cache2.tmp scratch.tmp"]
  B -->|"rm runs"| C(["3 files deleted"])`}
				id="glob-expansion"
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two consequences follow directly. First, what a glob matches depends entirely on
				<strong>where you are</strong> — the same
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">*.tmp</code
				>
				is three files in one folder and three hundred in another (this is the wildcard half of the rm
				-rf disaster from 3.3). Second, since expansion happens before <em>any</em> command runs, you
				can ask a harmless command to show you the expansion:
			</p>

			<CodeBlock
				title="The habit: echo the glob first"
				code={`echo *.tmp
# cache1.tmp cache2.tmp scratch.tmp    <- exactly what rm would receive

rm *.tmp                               # Now you KNOW what this deletes`}
			/>

			<Callout type="important">
				<strong>Echo the glob first.</strong>
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">echo</code
				>
				just prints its arguments — so
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>echo &lt;pattern&gt;</code
				>
				is a free, perfectly safe preview of any wildcard. (<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>ls &lt;pattern&gt;</code
				> works too.) Make it a reflex before every destructive glob, and apply it to AI-proposed commands:
				when an agent suggests a command containing a wildcard, echo that pattern in the target directory
				before you approve the real thing.
			</Callout>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Globs compose with everything you already know — they're just a way of writing file lists:
			</p>

			<CodeBlock
				title="Wildcards with cp, mv, ls"
				code={`cp *.md drafts/           # Copy every Markdown file into drafts/
mv photo-0?.jpg january/  # Move photo-01.jpg through photo-09.jpg
ls report-[12].txt        # List just report-1.txt and report-2.txt
ls src/*.js               # Globs work inside paths too`}
			/>

			<Callout type="warning">
				Two classic surprises: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">*</code
				>
				does <strong>not</strong> match hidden dotfiles (a small mercy —
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">rm *</code
				>
				spares your .env), and a pattern that matches <em>nothing</em> is passed to the command
				literally, star and all — which is why a typo'd glob often produces the baffling error
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>cannot access '*.tpm'</code
				>. Both surprises are caught instantly by the echo habit.
			</Callout>

			<h4
				id="glob-practice"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Select Exactly the Right Files
			</h4>
			<PlaygroundNote>
				A folder full of similar names — your job is to write patterns that catch exactly the right
				ones and nothing else. <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">echo</code
				> every glob before you commit to it; that's the skill being tested.
			</PlaygroundNote>
			<LessonActivity
				title="Select Exactly the Right Files"
				scenarioId="glob-practice"
				id="glob-practice"
			/>

			<VibeBox
				prompts={[
					'Write a glob that matches all the 2024 log files but not the 2025 ones, and echo it first',
					'Move every image file in this folder into photos/ — show me what the wildcard matches before moving'
				]}
			/>
		</div>
	</div>
</section>
