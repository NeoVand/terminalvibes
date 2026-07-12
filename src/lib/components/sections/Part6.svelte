<script lang="ts">
	import { Bot, ShieldAlert, FileCode2, Braces } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import MermaidDiagram from '../ui/MermaidDiagram.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-6" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Bot}
			partLabel="Part 6"
			title="Terminal for the AI Era: Read, Verify, Run"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"The AI writes the command. You decide whether it runs. That decision is the whole job."
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			This is the chapter this whole course exists for. Your AI assistant proposes shell commands
			all day long — install this, delete that, pipe this into that. Everything you've learned so
			far (paths, wildcards, pipes, permissions) was building toward one skill: <strong
				style="color: var(--color-text);">reading a command you didn't write</strong
			>
			and deciding, with confidence, whether to let it run. In this part you'll learn a repeatable audit
			routine, write your first script (so agent-written scripts stop being mysterious), and learn the
			exit-code logic that agents and CI pipelines live on.
		</p>

		<!-- 6.1 Read Before You Run -->
		<div id="section-6-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={ShieldAlert}
				title="6.1 Read Before You Run"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/read-before-you-run.webp"
					alt="Read Before You Run — inspecting an AI-proposed command before pressing Enter"
					caption="Every AI-proposed command gets the same inspection before it earns your Enter key"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> Your agent says "run this to fix it" and hands you a line of symbols
				you can't read. Pressing Enter on faith works fine — right up until the day it doesn't. You need
				a routine that turns "looks fine, I guess" into an actual verdict, in under a minute.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				And "the day it doesn't" is not hypothetical — this actually happens, to teams full of
				experts. In July 2025, a hacker slipped a destructive prompt into
				<a
					href="https://www.theregister.com/security/2025/07/24/destructive-ai-prompt-published-in-amazon-q-extension/615835"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">version 1.84 of Amazon's AI coding extension</a
				>, instructing the agent to wipe users' systems and cloud resources. The same month,
				<a
					href="https://fortune.com/2025/07/23/ai-coding-tool-replit-wiped-database-called-it-a-catastrophic-failure/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">Replit's agent deleted a live production database</a
				>
				during an explicit code freeze. And in April 2026, a Cursor-driven agent
				<a
					href="https://www.euronews.com/next/2026/04/28/an-ai-agent-deleted-a-companys-entire-database-in-9-seconds-then-wrote-an-apology"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);"
					>deleted a company's production database <em>and</em> its backups in about nine seconds</a
				>. In every case the missing safeguard wasn't more expertise on the team — it was a human
				who read the command before approving it.
			</p>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Here's the routine. Four steps, same order, every time. It feels slow for the first week;
				after that it takes fifteen seconds and runs in your head automatically.
			</p>

			<div class="mt-6 mb-6 space-y-3">
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: white;">1</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							Name the command
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The first word is the program. Do you know what it does? <code
								style="font-family: var(--font-mono);">rm</code
							>
							deletes, <code style="font-family: var(--font-mono);">curl</code> downloads,
							<code style="font-family: var(--font-mono);">chmod</code> changes permissions. If the
							first word is a stranger,
							<code style="font-family: var(--font-mono);">man &lt;command&gt;</code> or a quick "what
							does this do?" to your AI comes first.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: white;">2</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">Read each flag</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Flags change behavior, sometimes drastically — <code
								style="font-family: var(--font-mono);">rm</code
							>
							and <code style="font-family: var(--font-mono);">rm -rf</code> are different animals.
							Look each one up with
							<code style="font-family: var(--font-mono);">man</code> or
							<code style="font-family: var(--font-mono);">--help</code> (Part 1). Never wave through
							a flag you can't explain.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: white;">3</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							Identify what it targets
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The most important question: <em>what</em> does this act on? A path? A wildcard? The
							current directory? Check where you are with
							<code style="font-family: var(--font-mono);">pwd</code>, and remember that
							<code style="font-family: var(--font-mono);">*</code> means "everything here" — whatever
							"here" happens to be.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: white;">4</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">Rehearse it</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Before the real thing, run a harmless preview: <code
								style="font-family: var(--font-mono);">echo</code
							>
							the command to see what the wildcards expand to, or
							<code style="font-family: var(--font-mono);">ls</code> the target to see what would be
							hit. Many commands have a built-in rehearsal flag —
							<code style="font-family: var(--font-mono);">--dry-run</code> or
							<code style="font-family: var(--font-mono);">-n</code> — that shows what
							<em>would</em> happen without doing it.
						</p>
					</div>
				</div>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Here's the routine applied to a real suggestion. The agent proposes <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);"
					>rm -rf build/*</code
				> — deleting is irreversible (Part 3), so it earns the full treatment:
			</p>

			<CodeBlock
				title="Auditing before deleting"
				code={`# Step 1-2: rm deletes; -r recurses into folders, -f skips confirmation.
# Step 3: the target is build/* - everything inside build/, wherever I am.
pwd
# /home/vibe/projects/webapp        <- good, I'm where I think I am

# Step 4a: rehearse the glob - what does build/* actually expand to?
echo rm -rf build/*
# rm -rf build/assets build/index.html build/main.js

# Step 4b: or just look at the target directly
ls build/

# Verdict: only generated files. NOW it earns the Enter key.
rm -rf build/*`}
			/>

			<Callout type="tip">
				<strong>explainshell is your second opinion.</strong> Paste any command into
				<a
					href="https://explainshell.com"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">explainshell.com</a
				>
				and it dissects every piece — command, flags, arguments — with the matching lines from the actual
				man pages. It's the fastest way to check an AI's explanation against the documentation, because
				unlike the AI, explainshell only quotes the manual.
			</Callout>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The Red-Flag List
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Some patterns should make you slow down <em>every</em> time, no matter how confident the agent
				sounds. None of these are forbidden — they all have legitimate uses — but each one is a "stop
				and run the full audit" trigger:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">rm -rf</code
						> — recursive, forced deletion
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						No trash can, no confirmation, no undo (Part 3). The danger scales with the target:
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>rm -rf build</code
						>
						is routine,
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>rm -rf *</code
						>
						depends entirely on where you're standing, and anything involving
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">~</code
						>
						or
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">/</code
						> deserves a hard stop.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">sudo</code
						> — anything
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">sudo</code
						>
						removes every guardrail the system has (Part 5). The rule from section 5.3 doubles here: never
						sudo a command you don't understand — <em>especially</em> one an AI wrote. Understand first,
						elevate second.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>curl ... | bash</code
						> — run code straight off the internet
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						This downloads a script and executes it in one motion, sight unseen. Honesty requires a
						2026 update: it's now an <em>official</em> install method — Claude Code's documented
						installer is
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>curl -fsSL https://claude.ai/install.sh | bash</code
						>, and Codex CLI ships the same way. The real rule is about the <em>source</em>: piping
						a script over HTTPS from the documented domain of a vendor you chose is a normal install
						path; piping one from a random gist, README, or an agent's suggestion is not. When in
						doubt, the two-step version is always available —
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>curl -o install.sh &lt;url&gt;</code
						>, read it, <em>then</em> run it — and package managers (brew, winget, apt) remain the more
						auditable alternative.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">&gt;</code
						> — onto a file you care about
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						From Part 4: <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">&gt;</code
						>
						<strong>truncates first</strong> — the old contents are gone before the new ones arrive.
						An agent "updating" your
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">.bashrc</code
						>
						with
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">&gt;</code
						>
						instead of
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>&gt;&gt;</code
						> just erased it. Check the arrow count.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>chmod 777</code
						> — everyone may do everything
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The "make the error go away" hammer (Part 5). It works by giving every user on the
						system full control of the file — which is almost never what the situation actually
						needs. If an agent reaches for 777, ask it what the <em>minimal</em> permission would be;
						the answer is usually 755 or 644.
					</p>
				</div>
			</div>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The newest red flag: commands the agent was tricked into proposing
			</h4>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				One more pattern, unique to the AI era: <strong style="color: var(--color-text);"
					>prompt injection</strong
				>. Any text an agent reads — a README, a GitHub issue, a dependency's docs — can contain
				instructions that steer the commands it proposes next.
				<a
					href="https://www.helpnetsecurity.com/2026/06/29/mozilla-warns-of-indirect-prompt-injection-risk-in-ai-coding-agents/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">Mozilla warned in June 2026</a
				>
				about exactly this kind of indirect injection through repositories, and
				<a
					href="https://www.microsoft.com/en-us/security/blog/2026/05/07/prompts-become-shells-rce-vulnerabilities-ai-agent-frameworks/"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);"
					>Microsoft's "prompts become shells" research (May 2026)</a
				>
				showed injected text escalating all the way to remote code execution in agent frameworks. The
				consequence for you: an agent's proposed command deserves the full audit
				<em>even when you didn't write the prompt that produced it</em> — the instruction may not have
				come from you at all.
			</p>

			<Callout type="important">
				<strong>You are the approval step — and the prompt is your moment.</strong> Every major
				agent — Claude Code, Codex CLI, Copilot's agent mode — asks "allow this command?" before
				running it, and
				<a
					href="https://www.anthropic.com/engineering/claude-code-sandboxing"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">OS-level sandboxing</a
				>
				(macOS Seatbelt, Linux bubblewrap) is becoming the default posture underneath. That permission
				prompt <em>is</em> the modern read-before-you-run: the skill this course teaches is what you
				do in the seconds it's on screen. Never YOLO-approve. An agent can propose a thousand
				commands an hour; it only takes one unread
				<code style="font-family: var(--font-mono);">rm</code> to make it a bad day.
			</Callout>

			<h4
				id="audit-the-agent"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Audit the Agent
			</h4>
			<PlaygroundNote>
				An agent left three proposed commands in <code>agent-plan.txt</code> — two are safe, one
				would wipe files you care about. Read the plan with <code>cat</code>, audit each command
				(rehearse with <code>echo</code> and <code>ls</code>!), run the safe ones, and don't run the
				trap.
			</PlaygroundNote>
			<LessonActivity title="Audit the Agent" scenarioId="audit-the-agent" id="audit-the-agent" />

			<VibeBox
				prompts={[
					'Explain this command flag by flag before I run it, and tell me exactly which files it will touch',
					'Rewrite this command with a dry-run or preview step first, so I can see what it would do'
				]}
			/>
		</div>

		<!-- 6.2 Your First Script -->
		<div id="section-6-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={FileCode2}
				title="6.2 Your First Script"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/first-script.webp"
					alt="Your First Script — commands saved into a file, made executable, and run with ./"
					caption="A script is just commands you saved — teach the file once, run it forever"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You keep typing the same three commands to back up your notes.
				And your AI agents keep leaving mysterious <code>.sh</code> files in your projects. Both problems
				have the same answer: a shell script is nothing more than commands saved in a file.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				That's the whole secret. Everything you've typed at the prompt this entire course could be
				pasted into a file and replayed. Let's build one — a tiny backup script — and hit every
				ingredient along the way.
			</p>

			<CodeBlock
				title="backup.sh"
				code={`#!/usr/bin/env bash
# Back up the notes folder with today's date in the name.

BACKUP_NAME="notes-backup-$(date +%F)"

mkdir -p backups
cp -r notes "backups/$BACKUP_NAME"
echo "Backed up notes to backups/$BACKUP_NAME"`}
			/>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Three new things in eight lines:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						The shebang: <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>#!/usr/bin/env bash</code
						>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The first line of every script tells the system which program should interpret the rest
						of the file. <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>#!/usr/bin/env bash</code
						>
						means "run this with bash, wherever bash lives on this machine" — which is why it's preferred
						over hard-coding a path like
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>/bin/bash</code
						>. Everything after it is exactly what you'd type at the prompt (and
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">#</code
						> lines are comments, ignored by the shell).
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						Variables
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>BACKUP_NAME="..."</code
						>
						creates a variable (no spaces around the
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">=</code
						>
						— bash is strict about that), and
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>$BACKUP_NAME</code
						> uses it — the same dollar-sign expansion you met with environment variables in Part 5, just
						local to the script.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						Quoted paths
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>"backups/$BACKUP_NAME"</code
						>
						— double quotes let the variable expand while protecting against spaces. Quoting variables
						is the habit that separates scripts that work from scripts that work
						<em>until</em> a filename has a space in it.
					</p>
				</div>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Now make it runnable. Two steps, both from Part 5: give the file execute permission, then
				run it with the explicit <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">./</code
				> path:
			</p>

			<CodeBlock
				title="Make it executable, then run it"
				code={`chmod +x backup.sh
./backup.sh
# Backed up notes to backups/notes-backup-2026-07-12

# Why ./ ? The shell only searches PATH for commands (Part 5) -
# ./backup.sh says "the one right here, in this directory."`}
			/>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				Arguments: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$1</code
				> makes it reusable
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Inside a script, <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$1</code
				>
				is whatever word came first after the script's name —
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$2</code
				> the second, and so on. One change turns our notes-only script into a back-up-anything script:
			</p>

			<CodeBlock
				title="backup.sh, take two — back up anything"
				code={`#!/usr/bin/env bash
# Usage: ./backup.sh <folder>

TARGET="$1"
BACKUP_NAME="$TARGET-backup-$(date +%F)"

mkdir -p backups
cp -r "$TARGET" "backups/$BACKUP_NAME"
echo "Backed up $TARGET to backups/$BACKUP_NAME"`}
			/>

			<CodeBlock
				title="Same script, any folder"
				code={`./backup.sh notes
# Backed up notes to backups/notes-backup-2026-07-12

./backup.sh recipes
# Backed up recipes to backups/recipes-backup-2026-07-12`}
			/>

			<Callout type="important">
				<strong>Agents write scripts constantly.</strong> Ask an AI to "set up the project" or
				"automate the deploy" and odds are it produces a
				<code style="font-family: var(--font-mono);">.sh</code>
				file. Until today that file was a black box you ran on trust. Now it's a short text file you can
				<code style="font-family: var(--font-mono);">cat</code>, read line by line, and audit with
				the exact routine from 6.1 — because a script is just commands, and you read commands now.
			</Callout>

			<Callout type="tip">
				<strong>Scripts get the audit too — line by line.</strong> Before running any script (yours,
				an agent's, or one from the internet), read it top to bottom. Each line is a command; each
				command gets the four-step check. The shebang tells you the language, the variables tell you
				the moving parts, and the verbs (<code style="font-family: var(--font-mono);">cp</code>,
				<code style="font-family: var(--font-mono);">rm</code>,
				<code style="font-family: var(--font-mono);">curl</code>) tell you the risk.
			</Callout>

			<h4
				id="first-script"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Automate the Backup
			</h4>
			<PlaygroundNote>
				Build <code>backup.sh</code> right in the sandbox — write it line by line with
				<code>echo &gt;&gt;</code> (this playground has no full-screen editor), then
				<code>chmod +x</code> it and run it with <code>./backup.sh</code>. Check your work with
				<code>cat</code> and <code>ls backups</code>.
			</PlaygroundNote>
			<LessonActivity title="Automate the Backup" scenarioId="first-script" id="first-script" />

			<VibeBox
				prompts={[
					'Write a bash script that backs up a folder I pass as $1, and explain every line before I run it',
					'Here is a script an agent generated — walk me through what each line does and flag anything risky'
				]}
			/>
		</div>

		<!-- 6.3 Exit Codes & Chaining -->
		<div id="section-6-3" class="mb-8">
			<SectionHeader
				level="section"
				icon={Braces}
				title="6.3 Exit Codes &amp; Chaining"
				color="var(--color-primary)"
			/>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/exit-codes.webp"
					alt="Exit Codes & Chaining — every command reports success or failure, and && listens"
					caption="Every command files a report when it finishes — 0 means success, anything else means trouble"
				/>
			</div>

			<Callout type="note">
				<strong>The Problem:</strong> You want "run the tests, and deploy
				<em>only if they pass</em>" — but you've been eyeballing the output and deciding by hand.
				The shell has a built-in way for commands to report success or failure, and a grammar for
				acting on it.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				Every command, when it finishes, hands the shell a number called its <strong
					style="color: var(--color-text);">exit code</strong
				>: <strong style="color: var(--color-text);">0 means success</strong>, and anything else (1
				to 255) means some flavor of failure. You never see it unless you ask — the special variable
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$?</code
				> holds the exit code of the last command:
			</p>

			<CodeBlock
				title="Asking how the last command went"
				code={`ls notes
# recipes.md  todo.md
echo $?
# 0            <- found it, success

ls no-such-folder
# ls: cannot access 'no-such-folder': No such file or directory
echo $?
# 2            <- non-zero: it failed, and it said so`}
			/>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				On its own that's a curiosity. It becomes a superpower with the three <strong
					style="color: var(--color-text);">chaining operators</strong
				>, which decide whether the next command runs based on the last one's exit code:
			</p>

			<div class="mb-6 space-y-3">
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);"
							>a &amp;&amp; b</code
						> — "and then" (only on success)
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">b</code
						>
						only if
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">a</code
						> exited 0. The workhorse: "do this, and if it worked, do that."
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">a || b</code
						> — "or else" (only on failure)
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">b</code
						>
						only if
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">a</code
						> failed. The fallback: "try this, or else do that."
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4 class="mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">a ; b</code
						> — "and regardless"
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						Run <code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">b</code
						>
						no matter what happened to
						<code
							class="rounded px-1 py-0.5 text-xs"
							style="background: var(--color-code-bg); font-family: var(--font-mono);">a</code
						>. Just two commands on one line — no safety logic at all.
					</p>
				</div>
			</div>

			<CodeBlock
				title="The truth table, live"
				code={`true && echo "ran"        # ran        (true exits 0)
false && echo "ran"       #            (nothing - && skips after failure)
true || echo "ran"        #            (nothing - || skips after success)
false || echo "ran"       # ran

# The pattern you'll actually use every day:
npm test && npm run deploy
# tests pass  -> deploy runs
# tests fail  -> deploy never happens

# And the friendly-status combo:
npm test && echo "all green" || echo "tests failed"`}
			/>

			<MermaidDiagram
				definition={`flowchart TD
  A(["npm test"]) --> B{"exit code?"}
  B -->|"0 — success"| C(["npm run deploy"])
  B -->|"non-zero — failure"| D(["echo 'tests failed'"])
  classDef success stroke:#67b177,stroke-width:2px;
  classDef danger stroke:#9a3412,stroke-width:2px;
  class C success;
  class D danger;`}
				id="exit-code-chaining"
			/>
			<p class="mt-2 px-1 text-xs" style="color: var(--color-text-muted);">
				One number decides which branch runs — this tiny mechanism is the backbone of every CI
				pipeline.
			</p>

			<h4 class="mt-8 mb-2 text-[14px] font-semibold" style="color: var(--color-text);">
				The classic horror story: <code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">;</code
				>
				where
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">&amp;&amp;</code
				> belonged
			</h4>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Why does the choice of connector matter so much? Because of lines like this one, which has
				genuinely destroyed home directories:
			</p>

			<CodeBlock
				title="Two characters between routine and disaster"
				code={`# THE TRAP - a semicolon runs the rm NO MATTER WHAT:
cd /tmp/build ; rm -rf *
# If /tmp/build doesn't exist, cd FAILS... and rm -rf * runs
# anyway - in whatever directory you were standing in. Maybe ~.

# THE SAFE VERSION - && only deletes if the cd succeeded:
cd /tmp/build && rm -rf *
# cd fails -> the chain stops -> nothing is deleted.`}
			/>

			<Callout type="caution">
				<strong>Audit the connectors, not just the commands.</strong> When an AI proposes a chained
				one-liner, add a fifth question to the 6.1 routine:
				<em>what happens if the first command fails?</em>
				A
				<code style="font-family: var(--font-mono);">;</code> says "I don't care" — which is almost
				never true when the next command is destructive. If you see
				<code style="font-family: var(--font-mono);">cd &lt;anywhere&gt; ; rm</code>, send it back
				and ask for <code style="font-family: var(--font-mono);">&amp;&amp;</code>.
			</Callout>

			<p class="mb-4 text-[14px]" style="color: var(--color-text-secondary);">
				And here's why this little number matters beyond one-liners: <strong
					style="color: var(--color-text);">the entire automated world runs on exit codes</strong
				>. CI pipelines decide pass-or-fail by the exit code of your test command — a green
				checkmark on GitHub literally means "everything exited 0." And coding agents watch exit
				codes the same way: run a command, read
				<code
					class="rounded px-1 py-0.5 text-xs"
					style="background: var(--color-code-bg); font-family: var(--font-mono);">$?</code
				>, and decide whether to continue, retry, or fix. When your agent says "the tests failed,
				let me look" — it didn't read your mind. It read an exit code. Scripts join the same game: a
				script's own exit code is that of its last command, so scripts can chain scripts, and the
				whole tower stands on one convention. Zero means go.
			</p>

			<h4
				id="exit-codes"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Deploy Only on Green
			</h4>
			<PlaygroundNote>
				The tests here fail on the first run. Use <code>$?</code>, <code>&amp;&amp;</code>, and
				<code>||</code> to build a one-liner that deploys only when the tests pass — then fix the failing
				check and watch the same line take the other branch.
			</PlaygroundNote>
			<LessonActivity title="Deploy Only on Green" scenarioId="exit-codes" id="exit-codes" />

			<VibeBox
				prompts={[
					'Rewrite this chained command so the destructive step only runs if everything before it succeeded',
					'Explain what this one-liner does if the first command fails — trace it connector by connector'
				]}
			/>
		</div>
	</div>
</section>
