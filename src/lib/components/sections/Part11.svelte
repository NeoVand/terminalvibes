<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
</script>

<section id="part-11" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 11"
			title="Work with an agent: understand the next step"
		/>
		<p class="lead">
			An AI can explain an error, suggest a command, and help you explore an unfamiliar tool. Your
			terminal knowledge gives you a way to check that help. You do not need to understand every
			possible command; you need to make the proposed next step understandable.
		</p>
		<p>
			Use the same review for a suggestion from an assistant, a tutorial, or a colleague. Where it
			came from is context. What it will do is the decision.
		</p>
		<div id="section-11-1" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="11.1 Turn a proposal into something you can check"
			/>
			<ExpandableImage
				src="{base}/images/read-before-you-run.webp"
				alt="A learner inspects a proposed command with a magnifying glass before pressing Enter."
				caption="Make the action, target, and expected result clear before running a suggestion."
			/>
			<WorkflowSteps
				title="A small review loop"
				steps={[
					{ label: 'Understand', detail: 'Name the intended change and exact targets.' },
					{ label: 'Choose', detail: 'Approve only the action that fits the task.' },
					{ label: 'Verify', detail: 'Inspect evidence that the action worked.' }
				]}
			/>

			<p>
				Imagine that you ask an assistant to back up your notes. It proposes creating a backups
				folder, copying one file, then “cleaning up” your home folder. The first two steps may help.
				The last could defeat the entire request.
			</p>
			<h4>Ask four concrete questions</h4>
			<ol>
				<li>
					<strong>What is the job?</strong> Say it in ordinary language: “Copy my ideas file while keeping
					the original.”
				</li>
				<li>
					<strong>What does this command touch?</strong> Read its paths, flags, variables, and redirects.
					Use pwd and inspect the target if location matters.
				</li>
				<li>
					<strong>What could be lost or exposed?</strong> An existing destination, a running process,
					private data, or access permissions may change.
				</li>
				<li>
					<strong>How will I know it worked?</strong> Choose a check you can run afterwards, such as reading
					the copy or comparing the two files.
				</li>
			</ol>
			<p>For this backup, the useful sequence is short and understandable:</p>
			<CodeBlock
				title="Inspect the paths before using this plan"
				code={`mkdir -p ~/backups
cp ~/notes/ideas.md ~/backups/ideas.md
cat ~/backups/ideas.md`}
			/>
			<p>
				mkdir prepares the destination. cp copies the file and can replace an existing destination
				with that name. cat lets you inspect the result. None of those steps requires clearing the
				rest of your home directory.
			</p>
			<p>
				If the plan adds <Code code="rm -rf ~/*" />, decline that step. The target expands across
				ordinary non-hidden entries in your home directory; recursive, forced deletion is unrelated
				to preserving your ideas. You do not need to run it to prove that the scope is wrong.
			</p>
			<h4 id="audit-the-agent">Try it: Audit the agent</h4>
			<LessonActivity title="Audit the agent" scenarioId="audit-the-agent" id="audit-the-agent" />
			<p>
				After the activity, explain the rejected step in your own words. “The assistant said it was
				cleanup” describes its label. “It removes the originals and unrelated files” describes its
				effect.
			</p>
			<h4>Recognize places where details matter</h4>
			<div class="table-wrap">
				<table>
					<thead><tr><th>When a proposal contains…</th><th>Ask before running it</th></tr></thead
					><tbody>
						<tr
							><td><Code code="rm -r" /> or <Code code="rm -f" /></td><td
								>Which exact paths will disappear? Is deletion required? What copy would let me
								recover?</td
							></tr
						>
						<tr
							><td><Code code="sudo" /></td><td
								>Why does this need another account's privileges? Am I fixing ownership,
								installation, or just guessing?</td
							></tr
						>
						<tr
							><td>A download piped into a shell</td><td
								>Which source supplies executable code? Can I inspect the complete installer and its
								documented behavior first?</td
							></tr
						>
						<tr
							><td><Code code="&gt;" /> onto an existing file</td><td
								>Am I intentionally replacing it? A pipeline failure does not restore the earlier
								contents.</td
							></tr
						>
						<tr
							><td><Code code="chmod 777" /></td><td
								>Who actually needs which permission? Broad access is rarely the smallest fix.</td
							></tr
						>
						<tr
							><td><Code code="sed -i" /></td><td
								>Have I previewed the transformation and checked the correct files? How will I
								review or undo it?</td
							></tr
						>
						<tr
							><td><Code code="kill -9" /></td><td
								>Have I identified this process and tried an appropriate normal stop?</td
							></tr
						>
					</tbody>
				</table>
			</div>
			<p>
				These patterns are reasons to read carefully. They are not a substitute for understanding: a
				plain cp can replace a valuable file, and a complex command can be appropriate once its
				scope is clear.
			</p>
			<h4>Ask for help that leaves you able to act</h4>
			<p>
				Try: “I ran this command in this folder and got this error. Explain the first thing to
				check. Give me one step.” Include the relevant command and exact error, but remove private
				values. A vague “it broke” asks the assistant to guess both the event and your intention.
			</p>
			<p>
				If the answer feels too large, ask for a smaller example using a disposable file. If it
				introduces a new flag, ask what changes when the flag is removed. If it claims success, ask
				which file, response, or exit status supports that claim.
			</p>
			<p>
				The course tutor can receive the latest practice-terminal interaction when context sharing
				is enabled. Its separate demonstrations are not your computer's terminal, and a
				demonstration should not be mistaken for work you have completed yourself. Check the
				provider/model label to know whether you are using the included guide, a local model, or a
				cloud connection.
			</p>
			<Callout type="note" title="Optional cloud help"
				>You can use the course without an API key. If you connect your own provider key, requests
				go from this static site to that provider and may incur usage charges. The key is kept only
				for the current page session. Share only the task context you intend the provider to
				receive.</Callout
			>
			<h4>Keep instructions and evidence separate</h4>
			<p>
				A file, web page, or tool reply can contain text telling an assistant to ignore the task,
				reveal data, or run another command. That text is part of the material being examined; it
				does not become your authorization. An assistant can still mishandle it, so keep its
				permissions and tools limited to the work.
			</p>
			<p>
				Approval prompts depend on the agent and its settings. Do not assume every tool asks before
				every change, or that a safe-sounding explanation makes a command safe. Know whether the
				agent can edit files, run commands, or contact services, and review the resulting changes.
			</p>
			<ChallengeActivity title="Approve the release plan" part={11} id="ch-11-approve-the-plan" />
			<p class="reflection">
				<strong>Your independent check:</strong> choose one approved command and describe its action,
				target, and verification. Then suggest a smaller step if the original command does more than the
				task needs.
			</p>
		</div>
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
	.chapter-copy ol {
		padding-left: 1.5rem;
		margin: 1rem 0;
	}
	.chapter-copy ol {
		list-style: decimal;
	}
	.chapter-copy li {
		margin: 0.55rem 0;
	}
	.table-wrap {
		overflow-x: auto;
		margin: 1.5rem 0;
	}
	.chapter-copy table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.88rem;
		line-height: 1.65;
	}
	.chapter-copy th,
	.chapter-copy td {
		text-align: left;
		padding: 0.7rem;
		border-bottom: 1px solid var(--color-border);
		vertical-align: top;
	}
	.chapter-copy th {
		color: var(--color-text);
	}
	.chapter-copy .reflection {
		background: var(--color-bg-secondary);
		padding: 1rem;
		border-radius: 0.6rem;
	}
</style>
