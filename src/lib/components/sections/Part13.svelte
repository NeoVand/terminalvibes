<script lang="ts">
	import {
		BookOpen,
		Library,
		Wand2,
		Table,
		Trophy,
		Gamepad2,
		SearchCode,
		ListChecks,
		BookMarked,
		Bot,
		GitBranch
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import Callout from '../ui/Callout.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
	import { progress, toggleChecklistItem } from '$lib/data/progress';

	let {
		onOpenPlayground
	}: {
		onOpenPlayground?: () => void;
	} = $props();

	const SKILL_CHECKLIST = [
		{
			id: 'navigate',
			label:
				'I can get anywhere with pwd, ls, and cd — using TAB completion, not typing full paths.'
		},
		{
			id: 'paths',
			label: 'I can read any path on sight: absolute vs relative, ~, ., and .. — no guessing.'
		},
		{
			id: 'rm-safety',
			label:
				'I never delete blind: ls (or echo the glob) first, then rm — and I know there is no trash can.'
		},
		{
			id: 'pipes',
			label: 'I can chain small tools with | and redirect with > and >> — and I know > truncates.'
		},
		{
			id: 'grep-find',
			label:
				'I can find things: grep for text inside files, find for files by name — and I know which is which.'
		},
		{
			id: 'permissions',
			label:
				'I can decode an ls -l permission string and fix "permission denied" with the minimal chmod.'
		},
		{
			id: 'path-env',
			label: 'I can demystify "command not found" with echo $PATH and which.'
		},
		{
			id: 'audit',
			label: 'I audit AI-proposed commands: name it, read the flags, find the target, rehearse it.'
		},
		{
			id: 'script',
			label: 'I can write and run a script: shebang, chmod +x, ./, variables, and $1.'
		},
		{
			id: 'exit-codes',
			label: 'I know what $? holds and when && vs || vs ; runs the next command.'
		},
		{
			id: 'sed-backup',
			label:
				'I can find-and-replace across files with sed — and I never run -i without a .bak backup.'
		},
		{
			id: 'processes',
			label:
				'I can find what is hogging a port or a CPU, stop it politely, and escalate to -9 only when it refuses.'
		},
		{
			id: 'verify-network',
			label:
				'I check a server myself with curl instead of trusting "it\'s running" — and I can pull one value out of JSON.'
		},
		{
			id: 'secrets',
			label:
				'I keep API keys in a locked-down .env file, never typed into a command where history keeps them.'
		},
		{
			id: 'toolshed',
			label:
				'I can install a missing tool, peek inside an archive before unpacking it, and measure with du before deleting.'
		}
	];
</script>

<section id="part-13" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 13"
			title="Conclusion: The Terminal Is Yours Now"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"The terminal isn't a relic the AI era left behind — it's the interface the AI era runs on."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			You started this course unable to read a shell command. Now you navigate, build, search, pipe,
			permission, script, and — most importantly — <em>audit</em>. This last part distills the
			mindset, hands you a reference card, sets one final challenge, and points you at the places to
			keep growing.
		</p>

		<!-- 13.1 The Command-Line Mindset -->
		<div id="section-13-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Wand2}
				title="13.1 The Command-Line Mindset"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/mindset.webp"
					alt="The Command-Line Mindset — small tools composed into pipelines, read before run"
					caption="Not a list of commands — a way of thinking: small tools, composed, read before run"
				/>
			</div>

			<p class="mb-6" style="color: var(--color-text-secondary);">
				Commands fade if you don't use them; the mindset sticks. Three ideas carry everything you've
				learned — and you can rehearse any of them anytime in the
				<button
					type="button"
					onclick={onOpenPlayground}
					class="cursor-pointer underline underline-offset-2"
					style="color: var(--color-primary);">Terminal Playground</button
				> — a real shell sandbox, right in your browser.
			</p>

			<div class="mt-6 space-y-3">
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: var(--color-text-inverse);">1</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							Compose small tools
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The Unix philosophy from <CourseLink to="part-4" />: each command does one thing well,
							and <Code code="|" />
							snaps them together.
							<Code code="grep" /> doesn't sort and
							<Code code="sort" /> doesn't count — yet
							<Code code="grep ERROR log | sort | uniq -c" /> answers a question none of them could alone.
							When a problem looks big, don't hunt for a big tool — chain small ones.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: var(--color-text-inverse);">2</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							Read before you run
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The safety habit that threads the whole course: <Code code="ls" />
							before <Code code="rm" />, echo the glob before trusting it, count the arrows in a
							redirect, audit every AI-proposed command with the four-step routine from 6.1. The
							terminal does exactly what you say, immediately, with no undo — reading first is what
							makes that power safe to hold.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: var(--color-text-inverse);">3</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							The terminal is the AI-native interface
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The claim from the introduction, now closing the loop: text in, text out is the
							language AI speaks natively, which is why every coding agent works by running shell
							commands. It's measurable now — <a
								href="https://www.tbench.ai/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">Terminal-Bench</a
							>
							(Stanford × Laude Institute) is an entire benchmark that scores AI agents on real terminal
							work — and it matters because trust hasn't kept up with use:
							<a
								href="https://survey.stackoverflow.co/2025/ai/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">Stack Overflow's 2025 survey</a
							> found 84% of developers using AI tools while only about 29% trust their output. Someone
							still has to close that gap. You can watch what an agent runs, audit what it proposes, and
							step in when it's wrong — which is the whole point of learning to read the shell.
						</p>
					</div>
				</div>
			</div>

			<VibeBox
				prompts={[
					'Quiz me on the command-line mindset: give me five real-world tasks and check my one-liners',
					'From now on, before running any command, show it to me and wait — I read before we run'
				]}
			/>
		</div>

		<!-- 13.2 Quick Reference -->
		<div id="section-13-2" class="mb-8">
			<SectionHeader
				level="section"
				icon={Table}
				title="13.2 Quick Reference Card"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/quick-reference.webp"
					alt="Quick Reference Card — the essential terminal commands, one dense table"
					caption="Keep this cheat sheet handy — every command from the course, one glance away"
				/>
			</div>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Everything from the course, grouped the way you'll reach for it. When a command's flags slip
				your mind, <Code code="--help" /> is one keystroke closer than this table.
			</p>

			<div class="overflow-x-auto rounded-lg" style="background: var(--color-bg-secondary);">
				<table class="w-full text-xs">
					<thead>
						<tr style="background: var(--color-bg-tertiary);">
							<th class="px-3 py-2.5 text-left font-semibold" style="color: var(--color-text);"
								>Task</th
							>
							<th class="px-3 py-2.5 text-left font-semibold" style="color: var(--color-text);"
								>Command</th
							>
							<th class="px-3 py-2.5 text-left font-semibold" style="color: var(--color-text);"
								>Remember</th
							>
						</tr>
					</thead>
					<tbody style="color: var(--color-text-secondary);">
						<tr style="background: var(--color-bg-tertiary);">
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Orient &amp; navigate</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Where am I?</td>
							<td class="px-3 py-2"><Code code="pwd" /></td>
							<td class="px-3 py-2">Print working directory</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">What's here?</td>
							<td class="px-3 py-2"><Code code="ls -la" /></td>
							<td class="px-3 py-2"><Code code="-a" /> shows dotfiles</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Go somewhere</td>
							<td class="px-3 py-2"><Code code="cd path" /></td>
							<td class="px-3 py-2"
								><Code code="cd .." /> up,
								<Code code="cd ~" /> home,
								<Code code="cd -" /> back</td
							>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Create &amp; inspect</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Make folders / files</td>
							<td class="px-3 py-2"
								><Code code="mkdir -p a/b" /> ·
								<Code code="touch f" /></td
							>
							<td class="px-3 py-2"><Code code="-p" /> builds the whole path</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Read a file</td>
							<td class="px-3 py-2"
								><Code code="cat" /> ·
								<Code code="less" /> ·
								<Code code="head" /> ·
								<Code code="tail" /></td
							>
							<td class="px-3 py-2"
								><Code code="q" /> quits
								<Code code="less" />;
								<Code code="tail -f" /> follows</td
							>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Copy, move, delete</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Copy / move</td>
							<td class="px-3 py-2"
								><Code code="cp -r src dst" /> ·
								<Code code="mv src dst" /></td
							>
							<td class="px-3 py-2"><Code code="mv" /> also renames</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Delete</td>
							<td class="px-3 py-2"
								><Code code="rm file" /> ·
								<Code code="rm -r dir" /></td
							>
							<td class="px-3 py-2">No trash can — <Code code="ls" /> first, always</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Select many files</td>
							<td class="px-3 py-2"
								><Code code="*.log" /> ·
								<Code code="report?.txt" /></td
							>
							<td class="px-3 py-2"><Code code="echo" /> the glob before trusting it</td>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Text &amp; pipes</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Redirect output</td>
							<td class="px-3 py-2"
								><Code code=">" /> ·
								<Code code=">>" /> ·
								<Code code="2>" /></td
							>
							<td class="px-3 py-2"
								><Code code=">" /> truncates;
								<Code code=">>" /> appends</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Search text</td>
							<td class="px-3 py-2"><Code code="grep -rin &quot;text&quot; ." /></td>
							<td class="px-3 py-2"
								>recursive, ignore case, line numbers; <Code code="-v" /> inverts</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Shape a stream</td>
							<td class="px-3 py-2"><Code code="sort | uniq -c | sort -n" /></td>
							<td class="px-3 py-2"><Code code="uniq" /> needs sorted input first</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Find files by name</td>
							<td class="px-3 py-2"><Code code="find . -name &quot;*.md&quot;" /></td>
							<td class="px-3 py-2"
								><Code code="find" /> = filenames,
								<Code code="grep" /> = contents</td
							>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Permissions &amp; environment</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Make runnable</td>
							<td class="px-3 py-2"><Code code="chmod +x script.sh" /></td>
							<td class="px-3 py-2">Then run with <Code code="./script.sh" /></td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">"command not found"</td>
							<td class="px-3 py-2"
								><Code code="echo $PATH" /> ·
								<Code code="which cmd" /></td
							>
							<td class="px-3 py-2">The shell only searches PATH</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Shortcuts</td>
							<td class="px-3 py-2"><Code code="alias gs='git status'" /></td>
							<td class="px-3 py-2"
								>Persist in <Code code=".bashrc" /> /
								<Code code=".zshrc" />, then
								<Code code="source" /> it</td
							>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Text surgery</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Find &amp; replace</td>
							<td class="px-3 py-2"><Code code="sed 's/old/new/g' f.txt" /></td>
							<td class="px-3 py-2"
								>Prints the result; the file is untouched until <Code code="-i" /></td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Edit the file itself</td>
							<td class="px-3 py-2"><Code code="sed -i.bak 's/a/b/g' f.txt" /></td>
							<td class="px-3 py-2">Never bare <Code code="-i" /> — the suffix is your undo</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Drop / show lines</td>
							<td class="px-3 py-2"
								><Code code="sed '/DEBUG/d'" /> ·
								<Code code="sed -n '40,55p'" /></td
							>
							<td class="px-3 py-2">Address picks lines, command decides their fate</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Pull a column</td>
							<td class="px-3 py-2"><Code code={`awk '{print $2}'`} /></td>
							<td class="px-3 py-2"
								><Code code="-F," /> for CSV; <Code code="cut" /> for clean delimiters</td
							>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Processes, ports &amp; the network</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">What's running?</td>
							<td class="px-3 py-2"
								><Code code="ps aux" /> ·
								<Code code="pgrep node" /></td
							>
							<td class="px-3 py-2">PID is the handle; %CPU finds the runaway</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Stop it</td>
							<td class="px-3 py-2"
								><Code code="kill PID" /> ·
								<Code code="kill -9 PID" /></td
							>
							<td class="px-3 py-2">Ask politely first; <Code code="-9" /> skips all cleanup</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">"Address already in use"</td>
							<td class="px-3 py-2"><Code code="lsof -i :3000" /></td>
							<td class="px-3 py-2">Find the PID, kill it, start yours</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Background a job</td>
							<td class="px-3 py-2"
								><Code code="cmd &" /> ·
								<Code code="jobs" /> ·
								<Code code="fg %1" /></td
							>
							<td class="px-3 py-2"><Code code="Ctrl+Z" /> pauses, <Code code="bg" /> resumes</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Is the server alive?</td>
							<td class="px-3 py-2"><Code code="curl localhost:3000/health" /></td>
							<td class="px-3 py-2">
								<Code code="-s -o f.json" /> saves it quietly; <Code code="-I" /> = headers</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Read JSON</td>
							<td class="px-3 py-2"><Code code="curl -s URL | jq -r .field" /></td>
							<td class="px-3 py-2"><Code code="-r" /> drops the quotes for the next command</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Keep a secret</td>
							<td class="px-3 py-2"
								><Code code="echo 'K=v' > .env" /> ·
								<Code code="chmod 600 .env" /></td
							>
							<td class="px-3 py-2">Never type a key into a command — history keeps it</td>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>The toolshed</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Install a tool</td>
							<td class="px-3 py-2"><Code code="brew install NAME" /></td>
							<td class="px-3 py-2"
								>Linux: <Code code="sudo apt install" />. Confirm with <Code code="which" /></td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Open an archive</td>
							<td class="px-3 py-2"
								><Code code="tar -tzf f.tar.gz" /> ·
								<Code code="tar -xzf f.tar.gz" /></td
							>
							<td class="px-3 py-2">t lists, x extracts — peek before you unpack</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">What's eating the disk?</td>
							<td class="px-3 py-2"
								><Code code="du -sh *" /> ·
								<Code code="df -h" /></td
							>
							<td class="px-3 py-2">Measure before you delete</td>
						</tr>
						<tr
							style="background: var(--color-bg-tertiary); border-top: 1px solid var(--color-border);"
						>
							<td colspan="3" class="px-3 py-1.5 font-semibold" style="color: var(--color-text);"
								>Chaining, history &amp; help</td
							>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Chain on success</td>
							<td class="px-3 py-2"
								><Code code="a && b" /> ·
								<Code code="a || b" /></td
							>
							<td class="px-3 py-2"><Code code="$?" /> holds the last exit code; 0 = success</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Recall a command</td>
							<td class="px-3 py-2"
								><Code code="Ctrl+R" /> ·
								<Code code="!!" /> ·
								<Code code="history" /></td
							>
							<td class="px-3 py-2">Ctrl+R is the biggest speed unlock</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Get help</td>
							<td class="px-3 py-2"
								><Code code="cmd --help" /> ·
								<Code code="man cmd" /></td
							>
							<td class="px-3 py-2"><Code code="q" /> quits the pager; tldr for examples</td>
						</tr>
						<tr style="border-top: 1px solid var(--color-border);">
							<td class="px-3 py-2">Practice all commands</td>
							<td class="px-3 py-2">
								<button
									type="button"
									onclick={onOpenPlayground}
									class="cursor-pointer underline underline-offset-2"
									style="color: var(--color-primary);">Terminal Playground</button
								>
							</td>
							<td class="px-3 py-2">Try-it activities throughout Parts 1–6</td>
						</tr>
					</tbody>
				</table>
			</div>
		</div>

		<!-- 13.3 The Final Challenge -->
		<div id="section-13-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Trophy}
				title="13.3 The Final Challenge"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Reading is not knowing. Here's the exam — one gloriously messy home folder, no step-by-step
				instructions. Everything you need is in Parts 1 through 6, and the playground will tell you
				the moment you've won.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/final-challenge.webp"
					alt="The Final Challenge — one messy home folder, every skill from the course at once"
					caption="One messy home folder — navigation, organizing, searching, and scripting, all at once"
				/>
			</div>

			<Callout type="important">
				<strong>Your mission:</strong> a home folder where downloads, notes, and stray scripts have been
				piling up for months. Explore it, sort the loose files into sensible folders, hunt down the one
				file that contains the phrase you're told to find, and finish by writing a small executable script
				— every part of the course, combined, in any order that works.
			</Callout>

			<h4
				id="capstone"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: One Messy Home Folder
			</h4>
			<PlaygroundNote>
				Start with <Code code="ls -la" /> and a look around before you touch anything — read before you
				run, even now. A ✔ appears in the terminal when every goal is met — no partial credit.
			</PlaygroundNote>
			<LessonActivity title="The Final Challenge" scenarioId="capstone" id="capstone" />

			<h4 class="mt-10 mb-3 text-lg font-semibold" style="color: var(--color-text);">
				And One More: The Midnight Deploy
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The first challenge covers Parts 1–6. This one is the power tools: a release is due, a stale
				server is squatting on your port, the config still says <Code code="http:" />, and you
				refuse to ship on faith. Free the port, fix the config <em>with a backup</em>, start your
				server, and save the proof it's alive — Parts 7, 8, 9 and 10 in a single sitting.
			</p>

			<h4
				id="midnight-deploy"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: The Midnight Deploy
			</h4>
			<PlaygroundNote>
				Four moves: find and stop whoever holds port 3000, rewrite <Code code="config.yml" /> with
				<Code code="sed -i.bak" />, start the server, then <Code code="curl" /> the health endpoint into
				<Code code="status.json" />. Verification is part of the job, not an afterthought.
			</PlaygroundNote>
			<LessonActivity
				title="The Midnight Deploy"
				scenarioId="midnight-deploy"
				id="midnight-deploy"
			/>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Skill Checklist
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Beyond the challenge, here's the honest self-test. Check each item only when you could do it
				<em>right now, without looking anything up</em>. (Saved locally in your browser — nobody's
				grading you but you.)
			</p>

			<div class="mb-4 space-y-1.5">
				{#each SKILL_CHECKLIST as item (item.id)}
					<button
						type="button"
						onclick={() => toggleChecklistItem(item.id)}
						class="flex w-full cursor-pointer items-start gap-3 rounded-lg p-3 text-left transition-opacity hover:opacity-80"
						style="background: var(--color-bg-secondary);"
					>
						<span
							class="mt-0.5 flex h-4.5 w-4.5 flex-shrink-0 items-center justify-center rounded border text-[11px] font-bold"
							style="border-color: {$progress.checklist[item.id]
								? 'var(--color-tip)'
								: 'var(--color-border)'}; color: var(--color-tip); background: {$progress.checklist[
								item.id
							]
								? 'color-mix(in srgb, var(--color-tip) 15%, transparent)'
								: 'transparent'};"
						>
							{$progress.checklist[item.id] ? '✔' : ''}
						</span>
						<span
							class="text-[13px]"
							style="color: {$progress.checklist[item.id]
								? 'var(--color-text-muted)'
								: 'var(--color-text-secondary)'};"
						>
							{item.label}
						</span>
					</button>
				{/each}
			</div>
		</div>

		<!-- 13.4 Keep Learning -->
		<div id="section-13-4" class="mb-14">
			<SectionHeader
				level="section"
				icon={Library}
				title="13.4 Keep Learning — The References That Matter"
				color="var(--color-primary)"
			/>

			<div class="mb-6">
				<ExpandableImage
					src="{base}/images/keep-learning.webp"
					alt="Keep learning — a forest path branching toward deeper command-line territory"
					caption="This course ends here — the prompt keeps going"
				/>
			</div>

			<p class="mb-5 text-[14px] leading-relaxed" style="color: var(--color-text-secondary);">
				You've practiced everything here in a real shell — but the command line is deep, and the
				best references are worth knowing by name. These six will cover you from quick lookups to
				true mastery:
			</p>

			<div class="mb-4 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<BookOpen size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://linuxcommand.org/tlcl.php"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">The Linux Command Line</a
							><span style="color: var(--color-text);"> — the book, free forever</span></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						William Shotts' 500-page classic, now in its 3rd edition (No Starch Press, February
						2026) and still free as a PDF from
						<a
							href="https://linuxcommand.org"
							target="_blank"
							rel="noopener noreferrer"
							class="underline underline-offset-2"
							style="color: var(--color-primary);">linuxcommand.org</a
						>. It starts exactly where this course ends and goes all the way to serious shell
						scripting. When you want to know <em>why</em> the shell works the way it does, this is the
						answer.
					</p>
				</div>

				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<Gamepad2 size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://overthewire.org/wargames/bandit/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">OverTheWire: Bandit</a
							><span style="color: var(--color-text);"> — the terminal as a game</span></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						A free wargame played entirely over SSH: each level hides the password to the next
						somewhere in the filesystem, and your only tools are the ones from this course — <Code
							code="ls"
						/>,
						<Code code="cat" />,
						<Code code="grep" />,
						<Code code="find" />. The most fun way to make everything here reflexive.
					</p>
				</div>

				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<SearchCode size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://explainshell.com"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">explainshell.com</a
							><span style="color: var(--color-text);">
								— paste a command, get the anatomy</span
							></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The audit tool from section 6.1, permanently bookmarked. It maps every flag and argument
						of a pasted command to the matching lines of the real man pages — the perfect second
						opinion on anything an AI proposes.
					</p>
				</div>

				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<ListChecks size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://tldr.sh"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">tldr pages</a
							><span style="color: var(--color-text);"> — man pages, but the good parts</span></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Community-written cheat sheets: <Code code="tldr tar" /> gives you the five examples you actually
						wanted instead of forty flags. Still actively maintained in 2026, installable as a command
						or usable in the browser — the fastest "how do I use this again?" answer that isn't an AI.
					</p>
				</div>

				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<BookMarked size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://man7.org"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">man7.org</a
							><span style="color: var(--color-text);"> — the manual, in a browser</span></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The canonical Linux man pages, online and linkable — the same authoritative text <Code
							code="man"
						/> shows you locally, handy when you want to read documentation without leaving the browser
						(or share a link to a specific flag's definition).
					</p>
				</div>

				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<Bot size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://code.claude.com/docs/en/terminal-guide"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">Claude Code's terminal guide</a
							><span style="color: var(--color-text);">
								— even the AI vendors teach this now</span
							></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The clearest sign the terminal is the AI-native interface: Anthropic publishes its own
						beginner terminal guide for people picking up Claude Code. Cross-check what you learned
						here, and note who's telling you these skills matter — the company whose agent you'll be
						supervising.
					</p>
				</div>
			</div>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Your Next Course: Git
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				There's one command this course kept respectfully walking past: <Code code="git" />. It's
				the other half of the vibe coder's toolkit — the save-game system that makes AI-generated
				changes reviewable, undoable, and safe to experiment with. And it lives exactly where you
				now feel at home: the terminal.
			</p>

			<div class="mb-4 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-1 flex items-center gap-1.5 text-[14px] font-semibold">
						<GitBranch size={14} style="color: var(--color-primary);" />
						<span
							><a
								href="https://neovand.github.io/gitvibes/"
								target="_blank"
								rel="noopener noreferrer"
								class="underline underline-offset-2"
								style="color: var(--color-primary);">GitVibes</a
							><span style="color: var(--color-text);">
								— the sister course, learn Git next</span
							></span
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Same format, same free-forever deal, same in-browser playground — but for Git: commits,
						branches, undo, merge conflicts, and the guardrails that keep AI agents from wrecking
						your history. Everything you just learned about reading commands is the head start;
						TerminalVibes graduates are exactly who it was written for.
					</p>
				</div>
			</div>
		</div>

		<!-- Final Thoughts -->
		<div class="mb-8">
			<Callout type="important">
				<strong>Final Thoughts:</strong> The terminal has outlived every interface fashion of the last
				fifty years, and the AI era just made it more central, not less — because text is what both you
				and your agents speak. You can now read what the machine is told to do, verify it, and run it
				with intent. The promise of this course was never memorizing commands. It was having a way to
				read what you're about to run — especially when you didn't write it.
			</Callout>
		</div>
	</div>
</section>
