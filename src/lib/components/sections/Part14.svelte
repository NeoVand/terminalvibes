<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base, resolve } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
	import { cheatSheet } from '$lib/data/cheat-sheet';
	import { progress, toggleChecklistItem } from '$lib/data/progress';

	let { onOpenPlayground }: { onOpenPlayground?: () => void } = $props();
	const skills = [
		{
			id: 'keyboard',
			label: 'I can move around an unfinished command, replace a word, and cancel it.',
			lesson: 'keyboard-workshop'
		},
		{
			id: 'navigate',
			label: 'I can find my current folder, inspect its contents, and navigate to a known file.',
			lesson: 'section-2-1'
		},
		{
			id: 'paths',
			label: 'I can explain the path I am about to use, including spaces and relative locations.',
			lesson: 'section-2-2'
		},
		{
			id: 'rm-safety',
			label: 'I can identify the exact files affected by a change and decide how to recover.',
			lesson: 'part-3'
		},
		{
			id: 'pipes',
			label: 'I can build a short pipeline in stages and explain where its output goes.',
			lesson: 'part-4'
		},
		{
			id: 'grep-find',
			label: 'I can choose a text search or filename search and inspect its results.',
			lesson: 'part-4'
		},
		{
			id: 'permissions',
			label: 'I can read relevant permissions and choose a limited change when needed.',
			lesson: 'part-5'
		},
		{
			id: 'path-env',
			label: 'I can investigate a command-not-found error without guessing an installation.',
			lesson: 'part-5'
		},
		{
			id: 'audit',
			label: 'I can explain a proposed command’s action, target, and verification.',
			lesson: 'part-11'
		},
		{
			id: 'script',
			label: 'I can save, inspect, and run a small script using an editor.',
			lesson: 'part-6'
		},
		{
			id: 'exit-codes',
			label: 'I can check a command’s status and use it to decide a next step.',
			lesson: 'part-13'
		},
		{
			id: 'sed-backup',
			label:
				'I can preview a text transformation and review the result before replacing important work.',
			lesson: 'part-7'
		},
		{
			id: 'processes',
			label: 'I can identify a running process and choose an appropriate way to stop it.',
			lesson: 'part-8'
		},
		{
			id: 'verify-network',
			label: 'I can inspect a request’s reply and select a value from JSON.',
			lesson: 'part-9'
		},
		{
			id: 'secrets',
			label: 'I can keep real credentials out of commands, transcripts, and shared files.',
			lesson: 'section-9-4'
		},
		{
			id: 'toolshed',
			label: 'I can inspect an archive and measure a folder before making changes.',
			lesson: 'part-10'
		}
	];
</script>

<section id="part-14" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 14"
			title="Make it yours: independent practice and a field guide"
		/>
		<p class="lead">
			You began by making the terminal print a message. Now you have ways to find your place, change
			files, recover from mistakes, inspect running work, and ask better questions. The next step is
			to use those skills together on a task that feels useful to you.
		</p>
		<p>
			You are allowed to look things up. A good result includes understanding what changed and how
			you checked it. Finishing without a reference is not the goal.
		</p>
		<div id="section-14-1" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="14.1 A method you can carry into another task"
			/>
			<ExpandableImage
				src="{base}/images/mindset.webp"
				alt="Several small tools join into a pipeline beside a careful reader."
				caption="Observe, make one useful change, then check the result."
			/>
			<WorkflowSteps
				title="A method worth keeping"
				steps={[
					{ label: 'Orient', detail: 'Which machine, folder, and input?' },
					{ label: 'Act', detail: 'One change you can explain.' },
					{ label: 'Verify', detail: 'What evidence supports success?' }
				]}
			/>

			<p>
				When a task feels large, write down the desired result in one sentence. “Organize my
				downloaded reports without losing the originals.” “Find which line explains a failed job.”
				“Save a copy of today's notes.” A concrete outcome helps you choose a first action.
			</p>
			<ol>
				<li>
					<strong>Orient.</strong> Identify the machine, current folder, relevant files, or running program.
				</li>
				<li>
					<strong>Inspect.</strong> Read the input and the command you propose to use. Predict what it
					will touch.
				</li>
				<li>
					<strong>Act.</strong> Make one understandable change. Preserve a recovery route when existing
					work matters.
				</li>
				<li>
					<strong>Verify.</strong> Read the output, compare files, check the process, or ask the server.
					Decide what the evidence actually proves.
				</li>
			</ol>
			<p>
				A pipeline can connect several steps, but build it a stage at a time when you are still
				learning it. Separate commands that you can explain are more useful than a compact line you
				cannot inspect.
			</p>
			<p>
				When an error appears, keep its message long enough to read it. It often tells you whether
				the next check belongs to spelling, location, permissions, syntax, a process, or the
				network. Reset the practice sandbox when you want a fresh attempt; on your own machine,
				recovery depends on the operation and the copies you kept.
			</p>
		</div>
		<div id="section-14-2" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="14.2 Use a reference at the moment you need it"
			/>
			<ExpandableImage
				src="{base}/images/quick-reference.webp"
				alt="A compact reference gathers terminal commands by the jobs they do."
				caption="Look up the operation you need, then adapt its example to your files."
			/>
			<p>
				The header's cheatsheet stays available while you work. The categories below use the same
				command data, so this chapter and the panel stay together as the reference improves. For
				editing gestures, revisit the <a href={resolve('/#keyboard-workshop')}>keyboard workshop</a
				>.
			</p>
			<p>
				Examples with <Code code="&lt;file&gt;" /> or an uppercase name such as PID ask you to substitute
				your own value. Do not type angle brackets as decoration: they are real shell operators. Read
				the explanation before adapting a command.
			</p>
			{#snippet referenceText(
				text: string
			)}{#each text.split('`') as segment, index (index)}{#if index % 2}<Code
							code={segment}
						/>{:else}{segment}{/if}{/each}{/snippet}
			{#each cheatSheet as category (category.label)}<details>
					<summary>{category.label}</summary>
					<div class="table-wrap">
						<table>
							<thead><tr><th>Example</th><th>What it does</th></tr></thead><tbody
								>{#each category.commands as entry, index (index)}<tr
										><td><Code code={entry.command} /></td><td
											>{@render referenceText(entry.description)}{#if entry.detail}<p>
													{@render referenceText(entry.detail)}
												</p>{/if}</td
										></tr
									>{/each}</tbody
							>
						</table>
					</div>
				</details>{/each}
			<p>
				Use the built-in help and local manual when a flag differs from an example. The browser
				sandbox implements a useful subset of a shell. “Not supported here” does not mean the same
				command is invalid in your actual terminal.
			</p>
		</div>
		<div id="section-14-3" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="14.3 Put the skills together" />
			<p>
				These missions are a chance to choose a sequence yourself. Read the brief, inspect what is
				present, and decide what evidence will count as done. Use the cheatsheet, earlier chapters,
				or a small tutor hint whenever you need one.
			</p>
			<ExpandableImage
				src="{base}/images/final-challenge.webp"
				alt="A messy home folder contains reports, notes, logs, and a place for backups."
				caption="Several small jobs, one workspace. Choose a first step you can verify."
			/>
			<h4 id="capstone">Mission: one messy home folder</h4>
			<ol>
				<li>
					Inspect downloads. Move the report PDFs into documents and remove only the temporary files
					identified by the task. Leave unrelated files alone.
				</li>
				<li>
					Find the error in the application log and save the relevant lines as logs/error.txt. Read
					the saved result.
				</li>
				<li>
					Use Edit a file to create backup.sh, inspect it, make it executable, and run it. Verify
					the backup and the original.
				</li>
			</ol>
			<p>
				You can do these in any sensible order. Pause between operations to check the tree. If you
				get stuck, name the smallest unresolved question: “Which files match this pattern?” is
				easier to answer than “How do I do the whole mission?”
			</p>
			<LessonActivity title="One messy home folder" scenarioId="capstone" id="capstone" />
			<h4 id="midnight-deploy">Mission: the midnight deploy</h4>
			<p>
				A previous server is still using the port. The configuration needs a reviewed change. The
				intended server must start, and its health reply must be saved. Work from evidence rather
				than the deadline in the story.
			</p>
			<p>
				Identify the old listener before stopping it. Preserve the configuration's previous
				contents, inspect the edit, then start the intended server. Save and read its response. A
				process existing, a URL using https, and an application being healthy are related
				observations; none proves every other one.
			</p>
			<LessonActivity
				title="The midnight deploy"
				scenarioId="midnight-deploy"
				id="midnight-deploy"
			/>
			<p>
				After either mission, write a short handover: what you changed, what you kept, how you
				checked it, and what you would do if the result were wrong. That explanation is useful
				evidence of understanding.
			</p>
			<h4>Your skill notebook</h4>
			<p>
				Check a statement after completing a related task you can explain. Looking up syntax is
				welcome. These notes are saved in this browser; they are your reflection, not a score or a
				certificate. Uncheck something when you want more practice.
			</p>
			<div class="skill-list">
				{#each skills as skill (skill.id)}<div class="skill-row">
						<label
							><input
								type="checkbox"
								checked={!!$progress.checklist[skill.id]}
								onchange={() => toggleChecklistItem(skill.id)}
							/><span>{skill.label}</span></label
						><a href={resolve(`/#${skill.lesson}`)}>Practise</a>
					</div>{/each}
			</div>
			<ChallengeActivity title="Clear the desk for the demo" part={14} id="ch-14-desk-clear" />
			<p class="reflection">
				<strong>Try again later:</strong> choose one mission after a break and change one detail, such
				as a filename or destination. Keep your references available. Notice which parts you can now choose
				without coaching.
			</p>
		</div>
		<div id="section-14-4" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="14.4 Take one useful task into your own terminal"
			/>
			<ExpandableImage
				src="{base}/images/keep-learning.webp"
				alt="A garden path branches toward several new places to explore."
				caption="Choose a small task you want to repeat. Let that task choose the next tool."
			/>
			<p>
				Begin in a fresh practice folder on your own machine. Make a notebook, find a sentence in
				it, copy it, and compare the two copies. Practise one keyboard repair. Keep valuable files
				outside the experiment until the steps feel familiar.
			</p>
			<p>
				The native terminal will expose differences the simulation keeps small: your actual shell,
				real permissions, installed tools, other processes, and the network. When something differs,
				write down the command, its output, and the environment. That is a useful question to
				investigate, not evidence that you failed the course.
			</p>
			<h4>Choose a direction that solves a problem you have</h4>
			<ul>
				<li>
					<strong>Find things faster:</strong> try one of the rg, fd, fzf, or zoxide tasks in Part 10
					on a familiar folder.
				</li>
				<li>
					<strong>Keep long work organized:</strong> use named tabs or practise detaching a tmux session
					in Part 12.
				</li>
				<li>
					<strong>Repeat a chore:</strong> build a small script from Part 13 and test what happens when
					an input is missing.
				</li>
				<li>
					<strong>Work remotely:</strong> practise SSH only with an account you are authorized to use;
					keep local and remote identities clear.
				</li>
				<li>
					<strong>Track changes over time:</strong> learn Git so you can inspect history, compare
					revisions, and make deliberate recoveries. The sister course
					<a href="https://neovand.github.io/gitvibes/">GitVibes</a> follows that path.
				</li>
			</ul>
			<p>
				The local manual describes the tools you actually have. Official project guides explain
				optional additions. When a guide assumes knowledge you have not learned, pause at that
				assumption and try a smaller example. You can return to the <button
					type="button"
					onclick={onOpenPlayground}
					class="practice-link">course playground</button
				> whenever a disposable workspace would help.
			</p>
			<p class="reflection">
				<strong>A good next task:</strong> pick one small thing you currently do by hand and want to understand
				better. Write down what done would look like. Start by looking around.
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
	.chapter-copy ul,
	.chapter-copy ol {
		padding-left: 1.5rem;
		margin: 1rem 0;
	}
	.chapter-copy ul {
		list-style: disc;
	}
	.chapter-copy ol {
		list-style: decimal;
	}
	.chapter-copy li {
		margin: 0.55rem 0;
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

	.skill-list {
		display: grid;
		gap: 0.5rem;
	}
	.skill-row {
		display: flex;
		gap: 1rem;
		align-items: center;
		justify-content: space-between;
		border: 1px solid var(--color-border);
		border-radius: 0.5rem;
		padding: 0.8rem;
		font-size: 0.87rem;
	}
	.skill-row label {
		display: flex;
		gap: 0.75rem;
		align-items: flex-start;
		cursor: pointer;
	}
	.skill-row input {
		flex-shrink: 0;
		margin-top: 0.4rem;
		accent-color: var(--color-primary);
	}
	.skill-row a {
		white-space: nowrap;
		font-size: 0.8rem;
	}
	.practice-link {
		color: var(--color-primary-text);
		text-decoration: underline;
		text-underline-offset: 3px;
		cursor: pointer;
	}
	@media (max-width: 500px) {
		.skill-row {
			align-items: flex-start;
			flex-direction: column;
			gap: 0.3rem;
		}
		.skill-row a {
			margin-left: 1.75rem;
		}
	}
</style>
