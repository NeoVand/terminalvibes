<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CourseLink from '../ui/CourseLink.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
</script>

<section id="part-8" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 8"
			title="Processes & ports: get your prompt back"
		/>
		<p class="lead">
			A command does not always finish straight away. A server waits for requests. A log viewer
			waits for new lines. A download may still be working. The useful question is: <strong
				>what is running, and do I want it to keep running?</strong
			>
		</p>
		<p>
			In this chapter you will get your prompt back, identify a running program, and resolve a port
			conflict without guessing. The practice activities use simulated processes. The short native
			exercises are for your own terminal.
		</p>
		<div id="section-8-1" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="8.1 Meet a running program" />
			<p>
				A <strong>process</strong> is a running instance of a program. Opening an editor starts a
				process. Running a second copy starts another. The operating system gives each one a number
				called its <strong>process ID</strong>, or PID.
			</p>
			<p>
				A filename tells you where a program is stored. A PID tells you which running instance you
				are looking at. Deleting a program's file is not the normal way to stop it.
			</p>
			<ExpandableImage
				src="{base}/images/everything-is-a-process.webp"
				alt="A glass apiary with a separate numbered cell for each running program."
				caption="A process is a running program. Its PID identifies that instance."
			/>

			<p>
				Run <Code code="ps aux" /> to see a broad process list on macOS or Linux. Its columns vary, so
				start with only three: the owner, PID, and command. CPU usage is another useful clue when the
				machine feels busy.
			</p>
			<CommandTranscript
				command="ps aux"
				output={`USER       PID  %CPU  COMMAND
vibe      1024   0.0  bash
vibe       400   0.4  node server.js
vibe       437  97.4  spinner.sh --forever`}
				title="Example: a shortened process list"
			/>
			<p>
				In this example, process 437 is using a lot of CPU. That is a reason to investigate, not
				proof that it is broken: useful work can be expensive too. Read the command and owner before
				deciding what to stop. Your machine will have different PIDs, and a number can be reused
				after its process ends.
			</p>
			<p>
				To narrow a long list, try <Code code="ps aux | grep server" />. The search command itself
				may appear in the results. Inspect the whole line instead of copying the first number you
				see.
			</p>
			<details>
				<summary>A live view, when a snapshot is not enough</summary>
				<p>
					<Code code="top" /> updates a process list while you watch. Press <Code code="q" /> to leave.
					The layout and sorting keys differ between macOS and Linux; the on-screen help or <Code
						code="man top"
					/> explains your version. A changing CPU value shows activity over time. It still does not tell
					you whether that activity is useful.
				</p>
				<p>
					Optional tools such as htop and btop offer more visual process views. Learn to identify
					the owner and command before using their stop buttons. A prettier list does not change
					what stopping a process does.
				</p>
			</details>
			<p class="reflection">
				Before continuing: in the example above, which number identifies the server? Which text
				tells you what it is running?
			</p>
		</div>
		<div id="section-8-2" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="8.2 Get your prompt back" />
			<p>
				First try the smallest useful action. If the program is running in the terminal in front of
				you, press <strong>Ctrl+C</strong>. This sends an interrupt to the foreground process group.
				Many command-line programs respond by stopping. Some handle it differently, so look for the
				prompt to return.
			</p>
			<p class="native">
				<strong>Try in your terminal:</strong> run <Code code="sleep 30" />. This program waits for
				30 seconds and prints nothing. While you wait, press Ctrl+C. Your prompt should return
				early. You stopped a waiting program; you did not delete a file.
			</p>
			<p>
				If the program lives in another terminal, you can find its PID and send a signal with <Code
					code="kill"
				/>. The name sounds harsher than the default action: <Code code="kill 437" /> normally sends TERM,
				a request to terminate. That gives a cooperating program a chance to finish cleanup.
			</p>
			<ExpandableImage
				src="{base}/images/stopping-things.webp"
				alt="A green TERM message beside a sealed red KILL message."
				caption="Interrupt the foreground job; request termination of another process; verify the result."
			/>
			<WorkflowSteps
				title="Get a prompt back"
				steps={[
					{ label: 'Find the foreground job', detail: 'Which program is waiting here?' },
					{ label: 'Interrupt deliberately', detail: 'Ctrl+C often asks it to stop.' },
					{
						label: 'Look for the prompt',
						detail: 'A returned prompt lets the shell accept another command.'
					}
				]}
			/>
			<p>
				For the sample list above, you would inspect process 437, send <Code code="kill 437" />, and
				inspect again. If it is gone, you are done. If you get “No such process,” it may already
				have finished. If you get “Operation not permitted,” check ownership. Do not immediately add
				sudo.
			</p>
			<p>
				<Code code="kill -9 437" /> sends KILL. A process cannot catch this signal to clean up, so unsaved
				work may be lost. Use it only after identifying the process and giving a normal stop a chance.
				Even KILL is not a guarantee that every entry vanishes instantly; some system states take time
				to resolve.
			</p>
			<h4 id="runaway-process">Try it: Stop the runaway</h4>
			<LessonActivity title="Stop the runaway" scenarioId="runaway-process" id="runaway-process" />
			<p>
				After the activity, explain what evidence made you choose that process. “It had the biggest
				number” is not enough; a PID is an identifier, not a danger score.
			</p>
		</div>
		<div id="section-8-3" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="8.3 Find who is using a port" />
			<p>
				A server listens for connections at an address and a <strong>port</strong>. Think of the
				address as a building and the port as the place inside it where a particular service
				answers. Port 3000 is a common development choice; it is not a special kind of server.
			</p>
			<p>
				“Address already in use” often means another process is already listening on the address and
				port your new server requested. The exact rules include the network protocol, address, and
				socket settings. For everyday debugging, find the listener before changing anything.
			</p>
			<ExpandableImage
				src="{base}/images/port-3000.webp"
				alt="A harbor with an occupied pier marked 3000 and another boat waiting."
				caption="A port conflict is a clue: identify the existing listener."
			/>
			<div id="port-ritual">
				<h4>A repeatable port check</h4>
				<p>
					In this course's playground, <Code code="lsof -i :3000" /> identifies a simulated listener.
					On macOS or Linux with lsof installed, the more specific command below asks for TCP listeners
					and keeps addresses and port numbers numeric.
				</p>
				<CodeBlock
					title="Your terminal: inspect TCP port 3000"
					code="lsof -nP -iTCP:3000 -sTCP:LISTEN"
				/>
				<ol>
					<li>Read the command, owner, PID, and listening address.</li>
					<li>
						If it is your old server, return to its terminal and press Ctrl+C, or terminate its
						verified PID.
					</li>
					<li>
						Run the inspection again. An empty result means this check found no matching listener,
						subject to your permissions.
					</li>
					<li>Start the intended server and check its response.</li>
				</ol>
			</div>
			<p>
				If the existing listener is useful, leave it running and configure the new server to use
				another port. You are solving a conflict, not collecting processes to kill. If lsof is
				missing on Linux, <Code code="ss -ltnp" /> is a common alternative; read its local manual and
				note that process details can require additional permissions.
			</p>
			<h4 id="free-the-port">Try it: Free port 3000</h4>
			<LessonActivity title="Free port 3000" scenarioId="free-the-port" id="free-the-port" />
			<p class="reflection">
				Why is “kill whatever uses port 3000” a weaker plan than “identify my old server, then stop
				it”?
			</p>
		</div>
		<div id="section-8-4" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="8.4 Give each job a place" />
			<p>
				A foreground job owns your terminal while it runs. A background job lets the shell accept
				another command. Add <Code code="&amp;" /> to start a job in the background; use <Code
					code="jobs"
				/> to see jobs tracked by this shell.
			</p>
			<ExpandableImage
				src="{base}/images/background-jobs.webp"
				alt="One program works on a stage while two others work behind the curtain."
				caption="Foreground and background describe how a job shares this shell’s terminal."
			/>
			<p class="native">
				<strong>Try in your terminal:</strong> run <Code code="sleep 60 &amp;" />, then <Code
					code="jobs"
				/>. You may see a job number such as <Code code="[1]" /> and a PID. They are different identifiers.
				The job number belongs to this shell; the PID belongs to the operating system.
			</p>
			<p>
				<Code code="fg %1" /> brings job 1 to the foreground. Press Ctrl+C to stop the sleep. If your
				shell listed a different job number, use that number. Ctrl+Z suspends a foreground job; it does
				not finish it. <Code code="bg %1" /> resumes a suspended job in the background.
			</p>
			<p>
				Background output can still appear over your prompt. Background jobs may also be affected
				when the shell exits. The ampersand is not a reliable way to make an unattended service. For
				everyday development, a second terminal tab is often easier. <CourseLink to="part-12" /> introduces
				tmux for sessions you can detach and revisit.
			</p>
			<h4 id="backstage-jobs">Try it: Two things at once</h4>
			<LessonActivity title="Two things at once" scenarioId="backstage-jobs" id="backstage-jobs" />
			<p>
				Try one change after the guided activity: bring a different job forward, identify what owns
				the terminal, then return to a prompt. You are learning to account for running work, not
				merely hide it.
			</p>
		</div>
		<ChallengeActivity title="Clear the agent’s processes" part={8} id="ch-8-agent-cleanup" />
		<p class="reflection">
			<strong>Takeaway to practise:</strong> identify, stop appropriately, and check again. It works for
			a waiting command, yesterday's server, and a tool an agent started for you.
		</p>
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
