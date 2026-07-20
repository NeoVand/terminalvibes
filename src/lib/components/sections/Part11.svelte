<script lang="ts">
	import {
		Bot,
		ShieldAlert,
		Trash2,
		Ban,
		CloudDownload,
		Eraser,
		LockOpen,
		PenLine
	} from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import PlaygroundNote from '../ui/PlaygroundNote.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import VibeBox from '../ui/VibeBox.svelte';
</script>

<section id="part-11" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Bot}
			partLabel="Part 11"
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
			Everything so far was building toward this. Your AI assistant proposes shell commands all day
			long — install this, delete that, rewrite those files, restart the server. Ten parts ago none
			of it was readable. Now every piece is: paths and wildcards, pipes and redirection,
			permissions, scripts, <Code code="sed -i" />, <Code code="kill -9" />,
			<Code code="curl" />, installers. This part puts them together into the one skill the whole
			course exists for —
			<strong style="color: var(--color-text);">reading a command you didn't write</strong> and deciding,
			with confidence, whether to let it run.
		</p>

		<Callout type="note">
			This part comes late on purpose. Auditing a command means recognising every piece of it, so it
			had to wait until you had met the dangerous ones. You are not learning new commands here — you
			are learning what to do in the seconds before you press Enter.
		</Callout>

		<div id="section-11-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={ShieldAlert}
				title="11.1 Read Before You Run"
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
						style="background: var(--color-primary); color: var(--color-text-inverse);">1</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">
							Name the command
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The first word is the program. Do you know what it does? <Code code="rm" />
							deletes, <Code code="curl" /> downloads,
							<Code code="chmod" /> changes permissions. If the first word is a stranger,
							<Code code="man <command>" /> or a quick "what does this do?" to your AI comes first.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: var(--color-text-inverse);">2</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">Read each flag</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Flags change behavior, sometimes drastically — <Code code="rm" />
							and <Code code="rm -rf" /> are different animals. Look each one up with
							<Code code="man" /> or
							<Code code="--help" /> (<CourseLink to="part-1" />). Never wave through a flag you
							can't explain.
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
							Identify what it targets
						</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							The most important question: <em>what</em> does this act on? A path? A wildcard? The
							current directory? Check where you are with
							<Code code="pwd" />, and remember that
							<Code code="*" /> means "everything here" — whatever "here" happens to be.
						</p>
					</div>
				</div>
				<div class="flex gap-3 rounded-lg p-3" style="background: var(--color-bg-secondary);">
					<span
						class="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold"
						style="background: var(--color-primary); color: var(--color-text-inverse);">4</span
					>
					<div>
						<p class="text-[13px] font-medium" style="color: var(--color-text);">Rehearse it</p>
						<p class="text-xs" style="color: var(--color-text-muted);">
							Before the real thing, run a harmless preview: <Code code="echo" />
							the command to see what the wildcards expand to, or
							<Code code="ls" /> the target to see what would be hit. Many commands have a built-in rehearsal
							flag —
							<Code code="--dry-run" /> or
							<Code code="-n" /> — that shows what
							<em>would</em> happen without doing it.
						</p>
					</div>
				</div>
			</div>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Here's the routine applied to a real suggestion. The agent proposes <Code
					code="rm -rf build/*"
				/> — deleting is irreversible (<CourseLink to="part-3" />), so it earns the full treatment:
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
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Trash2 size={14} style="color: var(--color-caution);" />
						<span><Code code="rm -rf" /> — recursive, forced deletion</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						No trash can, no confirmation, no undo (<CourseLink to="part-3" />). The danger scales
						with the target:
						<Code code="rm -rf build" />
						is routine,
						<Code code="rm -rf *" />
						depends entirely on where you're standing, and anything involving
						<Code code="~" />
						or
						<Code code="/" /> deserves a hard stop.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<ShieldAlert size={14} style="color: var(--color-caution);" />
						<span><Code code="sudo" /> — anything</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						<Code code="sudo" />
						removes every guardrail the system has (<CourseLink to="part-5" />). The rule from
						section 5.3 doubles here: never sudo a command you don't understand —
						<em>especially</em> one an AI wrote. Understand first, elevate second.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<CloudDownload size={14} style="color: var(--color-caution);" />
						<span><Code code="curl ... | bash" /> — run code straight off the internet</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						This downloads a script and executes it in one motion, sight unseen. Honesty requires a
						2026 update: it's now an <em>official</em> install method — Claude Code's documented
						installer is
						<Code code="curl -fsSL https://claude.ai/install.sh | bash" />, and Codex CLI ships the
						same way. The real rule is about the <em>source</em>: piping a script over HTTPS from
						the documented domain of a vendor you chose is a normal install path; piping one from a
						random gist, README, or an agent's suggestion is not. When in doubt, the two-step
						version is always available —
						<Code code="curl -o install.sh <url>" />, read it, <em>then</em> run it — and package managers
						(brew, winget, apt) remain the more auditable alternative.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Eraser size={14} style="color: var(--color-caution);" />
						<span><Code code=">" /> — onto a file you care about</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						From <CourseLink to="part-4" />: <Code code=">" />
						<strong>truncates first</strong> — the old contents are gone before the new ones arrive.
						An agent "updating" your
						<Code code=".bashrc" />
						with
						<Code code=">" />
						instead of
						<Code code=">>" /> just erased it. Check the arrow count.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<LockOpen size={14} style="color: var(--color-caution);" />
						<span><Code code="chmod 777" /> — everyone may do everything</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						The "make the error go away" hammer (<CourseLink to="part-5" />). It works by giving
						every user on the system full control of the file — which is almost never what the
						situation actually needs. If an agent reaches for 777, ask it what the <em>minimal</em> permission
						would be; the answer is usually 755 or 644.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<PenLine size={14} style="color: var(--color-caution);" />
						<span><Code code="sed -i" /> — a silent mass edit with no undo</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						From <CourseLink to="part-7" />: <Code code="-i" /> rewrites the real files in place, often
						across a whole glob of them, with no preview and no backup. Unlike the flags above, the fix
						isn't refusal — it's amendment. Ask for
						<Code code="-i.bak" />, which keeps every original beside its edited version, and you
						get an undo button for free.
					</p>
				</div>
				<div class="rounded-lg p-5" style="background: var(--color-bg-secondary);">
					<h4
						class="mb-2 flex items-center gap-1.5 text-[14px] font-semibold"
						style="color: var(--color-text);"
					>
						<Ban size={14} style="color: var(--color-caution);" />
						<span><Code code="kill -9" /> — reached for first, not last</span>
					</h4>
					<p class="text-[13px]" style="color: var(--color-text-secondary);">
						From <CourseLink to="part-8" />: plain <Code code="kill" /> asks a program to stop and lets
						it save its work; <Code code="-9" /> removes it mid-sentence, skipping every cleanup. It's
						a legitimate last resort and a poor default — when an agent opens with it, ask whether the
						polite version was tried.
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
				<strong>You are the approval step.</strong> Every major agent — Claude Code, Codex CLI,
				Copilot's agent mode — asks "allow this command?" before running it, and
				<a
					href="https://www.anthropic.com/engineering/claude-code-sandboxing"
					target="_blank"
					rel="noopener noreferrer"
					class="underline underline-offset-2"
					style="color: var(--color-primary);">OS-level sandboxing</a
				>
				(macOS Seatbelt, Linux bubblewrap) is becoming the default posture underneath. That permission
				prompt <em>is</em> the modern read-before-you-run: the skill this course teaches is what you
				do in the seconds it's on screen. Don't approve on autopilot — an agent can propose commands
				faster than you can casually skim them, and it only takes one unread
				<Code code="rm" /> to ruin an afternoon.
			</Callout>

			<h4
				id="audit-the-agent"
				class="mt-6 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Audit the Agent
			</h4>
			<PlaygroundNote>
				An agent left three proposed commands in <Code code="agent-plan.txt" />
				— two are safe, one would wipe files you care about. Read the plan with
				<Code code="cat" />, audit each command (rehearse with
				<Code code="echo" />
				and
				<Code code="ls" />!), run the safe ones, and don't run the trap.
			</PlaygroundNote>
			<LessonActivity title="Audit the Agent" scenarioId="audit-the-agent" id="audit-the-agent" />

			<VibeBox
				prompts={[
					'Explain this command flag by flag before I run it, and tell me exactly which files it will touch',
					'Rewrite this command with a dry-run or preview step first, so I can see what it would do'
				]}
			/>
		</div>
	</div>
</section>
