<script lang="ts">
	import { Package, Boxes, Link2, HardDrive } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';

	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-10" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Package}
			partLabel="Part 10"
			title="The Toolshed: Getting, Unpacking, Finding"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"First, install X." — every setup guide ever written
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			This part is about owning your machine: fetching new tools, unpacking what arrives, knowing
			where things actually live, and finding out what's eating your disk. Four everyday chores that
			every guide assumes you already know — and that your agent will hand you commands for without
			explaining.
		</p>

		<Callout type="important">
			The thread running through this part: <strong
				>none of it is magic, it's all just files in places</strong
			>. Installing puts a file where your shell looks. An archive is one file holding many. A
			symlink is a file that points at another. Disk pressure is files being bigger than you
			thought.
		</Callout>

		<!-- 10.1 Package Managers -->
		<div id="section-10-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Package}
				title="10.1 Package Managers — Getting New Tools"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				When a command doesn't exist, your shell says
				<Code code="command not found" /> — which, as <CourseLink to="section-5-4" /> taught you, means
				"nothing on your
				<Code code="$PATH" /> has that name." A
				<strong style="color: var(--color-text);">package manager</strong> is a program whose entire
				job is installing other programs. You name a tool; it finds the right build for your system,
				puts it somewhere your <Code code="PATH" /> already looks, and remembers enough to update or remove
				it later.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/package-managers.webp"
					alt="A general store of labelled brass tins, one sliding down a chute into a basket marked /usr/local/bin"
					caption="Installed = placed where $PATH can see it"
				/>
			</div>

			<CodeBlock
				title="One idea, several spellings"
				code={`brew install cowsay            # macOS (Homebrew)
sudo apt install cowsay        # Debian/Ubuntu Linux
npm i -g serve                 # i = install, -g = global
brew install jq                # jq isn't preinstalled either — same one line

which cowsay                   # where did it land?
/usr/local/bin/cowsay          # ...somewhere on $PATH. That's all "installed" means.`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That last pair of lines is the whole concept. Before the install,
				<Code code="which cowsay" /> finds nothing and the command fails. After it, there's a file at
				<Code code="/usr/local/bin/cowsay" />, that directory is listed in your
				<Code code="$PATH" />, and so typing <Code code="cowsay" /> works. Installing a command-line tool
				is mostly just <em>putting a file somewhere the shell already looks</em>.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Two spellings of one idea, and Windows has a third in <Code code="winget" />, which pulls
				from its own catalogue the same way. <Code code="apt" /> needs <Code code="sudo" /> because it
				writes into folders that belong to the machine rather than to you; Homebrew owns its own directory,
				so it doesn't.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One thing no setup guide mentions: Homebrew isn't on a stock Mac. <Code code="brew" /> is itself
				third-party software, installed once by following the instructions at
				<a
					href="https://brew.sh"
					target="_blank"
					rel="noopener noreferrer"
					class="font-medium underline underline-offset-2"
					style="color: var(--color-primary);">brew.sh</a
				>
				— and until you do, the first line of that block answers <Code code="command not found" />,
				which is a confusing way to be told you're missing the thing that installs things.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="npm i -g serve" /> is the odd one out. <Code code="i" /> is install;
				<Code code="-g" /> is global, meaning put it where <Code code="PATH" /> can see it rather than
				inside this project's
				<Code code="node_modules" /> folder, where <Code code="which serve" /> would never look. And
				<Code code="npm" /> installs JavaScript tools and nothing else, so if what you want isn't JavaScript,
				<Code code="npm" /> can't help you. It also <em>runs</em> things: <Code
					code="npm run <name>"
				/> executes a script the project defined for itself in its <Code code="package.json" /> file,
				which is all
				<Code code="npm test &amp;&amp; npm run deploy" /> in <CourseLink to="section-6-2" /> was ever
				doing.
			</p>

			<Callout type="caution">
				<strong>Read what an install pulls in</strong> — especially from an agent. Three things
				deserve a second look: <Code code="sudo npm install" /> (a global <Code code="npm" /> install
				should rarely need root, and needing it usually means something is misconfigured);
				<Code code="curl … | bash" /> installers (<CourseLink to="section-9-2" /> decoded exactly why
				— download, read, then run); and any package whose name is one typo away from a popular one. That
				last one has a name — <em>typosquatting</em> — and a fix: copy the install command from the project's
				own documentation rather than from a search result.
			</Callout>

			<VibeBox
				prompts={[
					"I'm on macOS and this guide says apt install — what's the equivalent for me?",
					'Before I run this install command, tell me what it downloads and where it puts things'
				]}
			/>
			<h4
				id="summon-a-tool"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Install a Tool
			</h4>
			<PlaygroundNote>
				Watch <Code code="cowsay" /> fail, install it, and watch the same command start working — then
				use <Code code="which" /> to see exactly where the file landed.
			</PlaygroundNote>
			<LessonActivity title="Install a Tool" scenarioId="summon-a-tool" id="summon-a-tool" />
		</div>

		<!-- 10.2 Archives -->
		<div id="section-10-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Boxes}
				title="10.2 Archives — `tar` &amp; `zip`"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="tar -xzf release.tar.gz" /> is probably the most-copied command in computing, and
				almost nobody can explain the letters. They're not magic — they're four separate instructions
				jammed together:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/archives.webp"
					alt="A wooden crate marked release.tar.gz with files spiralling out, and brass plates decoding x, z and f"
					caption="Many files, one crate — peek before you unpack"
				/>
			</div>

			<CodeBlock
				title="Decoding the flag soup"
				code={`tar -xzf release.tar.gz
     │││
     ││└── f: "the next word is the archive's filename"
     │└─── z: it's gzip-compressed (that's the .gz)
     └──── x: extract

tar -tzf release.tar.gz     # t: LIST what's inside — don't unpack yet
tar -czf backup.tar.gz notes/   # c: create an archive from notes/`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Swap one letter and you change the verb: <Code code="x" /> extracts,
				<Code code="c" /> creates, <Code code="t" /> lists. The <Code code="z" /> and
				<Code code="f" /> stay put, unless something other than gzip did the squeezing:
				<Code code="-xjf" /> for a <Code code=".tar.bz2" />, <Code code="-xJf" /> for a
				<Code code=".tar.xz" /> — same idea, different squeezer. Once you can read the letters, the command
				stops being an incantation you paste and becomes a sentence you understand — which is the entire
				thesis of this course applied to one very ugly command.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="tar" /> and <Code code="zip" /> split the job differently.
				<Code code="tar" /> only bundles — it glues many files into one and stops there, which is why
				compression is a separate <Code code="z" /> and why you end up with two extensions in
				<Code code=".tar.gz" />. A <Code code=".zip" /> does both jobs in one format, which is what a
				browser download or a Windows machine usually hands you; <Code code=".tar.gz" /> is the Unix default.
				Opening one is <Code code="unzip archive.zip" />, and <Code code="unzip -l" /> lists what's inside
				without extracting anything — <Code code="l" /> for list, the zip spelling of
				<Code code="tar -tzf" />.
			</p>

			<Callout type="tip">
				<strong>Peek before you unpack.</strong> An archive decides where its own contents land, and
				a badly-built one scatters files all over your current folder instead of tidying them into
				one directory. <Code code="tar -tzf archive.tar.gz" /> lists everything without extracting anything
				— it costs a second and it's the same "look before you leap" habit as echo-the-glob in <CourseLink
					to="section-3-4"
				/>.
			</Callout>

			<VibeBox
				prompts={[
					'Explain this command letter by letter before I run it: tar -xjf archive.tar.bz2',
					"Make me a compressed backup of my notes folder with today's date in the filename"
				]}
			/>
			<h4
				id="open-the-crate"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Peek, Then Unpack
			</h4>
			<PlaygroundNote>
				A release archive just landed. List what's inside with <Code code="tar -tzf" />
				<em>before</em> extracting it — then unpack it for real.
			</PlaygroundNote>
			<LessonActivity title="Peek, Then Unpack" scenarioId="open-the-crate" id="open-the-crate" />
		</div>

		<!-- 10.3 Links -->
		<div id="section-10-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Link2}
				title="10.3 Links &amp; Where Things Live"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You've been seeing these for nine parts without being told what they are. Run
				<Code code="ls -l" /> in the right folder and some entries have an arrow:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/symlinks.webp"
					alt="A brass signpost reading current -> releases/v2.1 pointing at a lit cabin, beside a dark broken signpost"
					caption="A signpost, not a copy"
				/>
			</div>

			<CodeBlock
				title="The arrow ls has been showing you"
				code={`ls -l /usr/local/bin
lrwxr-xr-x  node -> /opt/homebrew/Cellar/node/22.3.0/bin/node
                └── a symbolic link: a signpost pointing somewhere else

ln -s releases/v2.1 current    # plant your own signpost
ls -l
current -> releases/v2.1`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Those lines are trimmed — a real <Code code="ls -l" /> puts owner, group, size and date between
				the permissions and the name — but the character doing the work is the first one. That
				<Code code="l" /> is the type character from <CourseLink to="section-5-1" />'s legend, the
				one entry that legend pointed forward to here.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A <strong style="color: var(--color-text);">symlink</strong> — symbolic link, which is what
				the <Code code="-s" /> stands for — is a tiny file whose entire content is "look over there instead."
				It is
				<em>not</em> a copy: there's still one real thing, and the link is a pointer to it. That's
				why deleting the link leaves the original alone — and why deleting the original leaves a
				<strong style="color: var(--color-text);">broken link</strong>, an arrow pointing at
				nothing, which is the source of a whole genre of confusing errors.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A link's target can be absolute or relative, and the two behave differently.
				<Code code="/opt/homebrew/Cellar/…" /> above is absolute: it means the same thing from anywhere.
				<Code code="releases/v2.1" /> is relative, worked out from the <em>link's</em> own folder rather
				than from yours — so moving the link somewhere else breaks it while the file it pointed at sits
				untouched.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				This is how a surprising amount of your machine is wired. Homebrew installs the real files
				deep in its own folders and drops symlinks into <Code code="/usr/local/bin" />;
				<Code code="node_modules/.bin" /> is full of them. A
				<strong style="color: var(--color-text);">version manager</strong> — <Code code="nvm" /> for Node,
				<Code code="pyenv" /> for Python — lets one machine hold several versions of the same language,
				and switches between them by re-pointing a single link. When a tool insists it's installed but
				the command "isn't found" — or points at the wrong version — a symlink is usually the culprit,
				and <Code code="ls -l" /> plus <Code code="which" /> is how you catch it.
			</p>

			<Callout type="tip">
				This one is a real-machine lesson — the sandbox has no symlinks to practise on. Next time
				you're in a terminal, run <Code code="ls -l /usr/local/bin" /> (or
				<Code code="ls -l node_modules/.bin" /> in any JavaScript project) and read the arrows. It's a
				good five-minute tour of how your tools are actually assembled.
			</Callout>

			<VibeBox
				prompts={[
					'Why does which node show one path but node --version report a different version than I expect?',
					'Explain what ln -s does and when I would want a symlink instead of a copy'
				]}
			/>
		</div>

		<!-- 10.4 Disk Detective -->
		<div id="section-10-4" class="mb-8">
			<SectionHeader
				level="section"
				icon={HardDrive}
				title="10.4 Disk Detective"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				"Your disk is almost full" arrives at the worst possible moment, and the panic response —
				deleting things that look big — is how people lose work. Two commands turn the guess into a
				measurement.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/disk-detective.webp"
					alt="A cellar of barrels labelled with du sizes, a huge one reading 1.9G node_modules under a magnifier"
					caption="Measure before you delete"
				/>
			</div>

			<CodeBlock
				title="Where did it all go?"
				code={`du -sh *              # how big is each thing HERE?
204M    dist
3.1M    docs
1.9G    node_modules
12M     src

df -h                 # how full is the whole disk?
Filesystem  Size  Used Avail Capacity
/dev/disk1  494G  405G   89G     82%`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="du" /> is "disk usage" — <Code code="-s" /> gives one summary line per item instead
				of every nested folder, and <Code code="-h" /> is the same human-readable flag you aliased onto
				<Code code="ls" /> in <CourseLink to="section-5-5" />. It's what turns the raw byte counts
				from
				<CourseLink to="section-2-5" /> into K, M and G, each rung roughly a thousand of the one below
				— so <Code code="1.9G" /> dwarfs <Code code="12M" /> by far more than the digits suggest. <Code
					code="df"
				/> is "disk free", the whole-disk view; a real one also prints where each disk is mounted, plus
				a few extra columns on macOS you can ignore.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The everyday move is <Code code="du -sh *" />: one number per folder, sorted out by eye, and
				the hog is immediately obvious. It's usually <Code code="node_modules" />, a build cache, or
				old container images — things that regenerate, which is exactly why they're safe to delete.
				One catch: <Code code="*" /> never matches a name that starts with a dot, so a
				<Code code=".cache" /> folder stays invisible until you name it yourself:
				<Code code="du -sh .cache" />.
			</p>

			<Callout type="tip">
				<strong>Measure, then delete — in that order.</strong> It's the same discipline as
				<Code code="ls" /> before <Code code="rm" /> in <CourseLink to="section-3-3" />: make the
				invisible visible <em>before</em> the irreversible step. Deleting the wrong 200 MB is annoying;
				deleting the wrong 200 MB because you never checked is avoidable.
			</Callout>

			<VibeBox
				prompts={[
					'My disk is nearly full — walk me through finding what is using the space, biggest first',
					'Is it safe to delete node_modules and .cache? What regenerates and what does not?'
				]}
			/>
			<h4
				id="space-hog"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Find the Space Hog
			</h4>
			<PlaygroundNote>
				The disk is filling up. Size every folder with <Code code="du -sh *" /> first, then remove the
				one that's actually large — measurement before deletion.
			</PlaygroundNote>
			<LessonActivity title="Find the Space Hog" scenarioId="space-hog" id="space-hog" />

			<p class="mt-10 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				That's the toolshed stocked. You can install what you're missing, open what arrives, follow
				the arrows to where things really live, and find what's eating your disk — the last of the
				everyday chores that used to require someone else's help.
			</p>
		</div>

		<ChallengeActivity title="Hand It Over, Not the Bloat" part={10} id="ch-10-handover" />
	</div>
</section>
