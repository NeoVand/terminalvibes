<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import Callout from '../ui/Callout.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import CommandTranscript from '../ui/CommandTranscript.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import WorkflowSteps from '../ui/WorkflowSteps.svelte';
</script>

<section id="part-9" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 9"
			title="Network conversations: ask, inspect, verify"
		/>
		<p class="lead">
			A web page, an API, and a remote computer all involve a conversation with another program.
			This chapter makes that conversation visible: send a request, inspect the reply, and keep
			track of which machine you are using.
		</p>
		<p>
			You do not need an account or a real API key for the browser activities. Their addresses,
			replies, processes, and credentials are simulated. Native exercises are marked separately.
		</p>
		<div id="section-9-1" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="9.1 Know where a request goes" />
			<p>
				Read <Code code="http://localhost:3000/health" /> in pieces. <Code code="http" /> names the protocol.
				<Code code="localhost" /> refers to the machine making the request. <Code code="3000" /> is the
				port. <Code code="/health" /> is the path requested from that server.
			</p>
			<ExpandableImage
				src="{base}/images/localhost.webp"
				alt="A lighthouse directs its beam inward toward numbered doors on its own island."
				caption="localhost means the machine where the request runs."
			/>
			<WorkflowSteps
				title="Follow one request"
				steps={[
					{ label: 'Address', detail: 'Choose the machine, port, and requested path.' },
					{
						label: 'Response',
						detail: 'Inspect whether the transfer worked and what the server returned.'
					},
					{ label: 'Meaning', detail: 'Read the body and check the value your task needs.' }
				]}
			/>

			<p>
				A server must be running before it can answer. Typing an address does not start it. If
				nothing is listening at the requested address and port, the request may fail with
				“connection refused.” A wrong path can produce a different result: the server answers, but
				says that resource was not found.
			</p>
			<p>
				A development tool printing a localhost link does <strong>not</strong> prove the server is
				reachable only from your computer. Its listening configuration matters. Binding to <Code
					code="127.0.0.1"
				/> or <Code code="::1" /> is loopback-only. Binding to <Code code="0.0.0.0" /> or <Code
					code="::"
				/> can accept connections through other interfaces, subject to network and firewall rules.
			</p>
			<p>
				For a local practice server, choose the tool's loopback binding option and verify its
				listener as in Part 8. Do not rely on the friendliness of the link it prints.
			</p>
		</div>
		<div id="section-9-2" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="9.2 Ask, then inspect the answer" />
			<p>
				<Code code="curl" /> sends a request and prints the response body. That body is the content sent
				back: it might be a page, a message, or structured data. Let us ask the practice server whether
				it is healthy.
			</p>
			<ExpandableImage
				src="{base}/images/curl.webp"
				alt="A telegraph prints a reply after a cable carries a request to a numbered door."
				caption="A request is a question. The response is evidence you can inspect."
			/>
			<CommandTranscript
				command="curl -sS http://localhost:3000/health"
				output={`{"status":"ok"}`}
				title="In the health-check playground"
			/>
			<p>
				<Code code="-s" /> hides the progress meter; <Code code="-S" /> keeps curl's error messages visible
				when silent mode is on. The server's response body is still printed. These options make a small
				reply easier to read without concealing a failed connection.
			</p>
			<p>
				Save the body when you want to inspect it again: <Code
					code="curl -sS http://localhost:3000/health &gt; status.json"
				/>. Then run <Code code="cat status.json" />. Remember that the shell opens the output file
				before curl runs. A failed request can leave an empty or replaced file; the filename alone
				is not proof of success.
			</p>
			<h4 id="health-check">Try it: Is it alive?</h4>
			<LessonActivity title="Is it alive?" scenarioId="health-check" id="health-check" />
			<details>
				<summary>Native curl: three different kinds of failure</summary>
				<p>
					A network failure means curl could not complete the transfer. An HTTP error means the
					server responded with a status such as 404 or 500. An application error means the body
					reports a problem, perhaps even with HTTP status 200. Check the level relevant to your
					task.
				</p>
				<p>
					In your own terminal, <Code code="curl -i URL" /> includes response headers with a normal request.
					<Code code="curl -I URL" /> makes a HEAD request; some servers treat that differently. Replace
					URL with an address you intend to contact.
				</p>
				<p>
					curl does not treat every HTTP error status as a failing exit code by default. <Code
						code="--fail-with-body"
					/> makes HTTP status 400 and above fail while retaining the body on supported versions. Check
					your version's <a href="https://curl.se/docs/manpage.html">curl manual</a>. A successful
					transfer still does not prove that the returned data is what you wanted.
				</p>
			</details>
			<p class="reflection">
				If a request fails, what would you check first: the server process, the address and port,
				the path, or the response body? Let the actual message guide the next check.
			</p>
		</div>
		<div id="section-9-3" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="9.3 Find one value inside JSON" />
			<p>
				JSON is a text format for structured data. An object groups named values inside braces. An
				array holds an ordered list inside square brackets. Strings use double quotes; numbers and
				the values true, false, and null do not.
			</p>
			<ExpandableImage
				src="{base}/images/reading-json.webp"
				alt="Nested transparent jars represent named values inside a JSON document."
				caption="Inspect the structure before choosing a path through it."
			/>
			<p>
				Do not start with a long filter. Ask the practice API for its reply, then use <Code
					code="jq '.'"
				/> to format the JSON. The dot means “the value I received.”
			</p>
			<CodeBlock
				title="In the API playground: inspect the whole reply"
				code="curl -sS api.vibecloud.dev/releases | jq '.'"
			/>
			<p>
				The sample object has a <Code code="latest" /> field. To select it, use <Code
					code="jq '.latest'"
				/>. To print a string without its JSON quotation marks, add <Code code="-r" />.
			</p>
			<div id="json-pipeline">
				<CommandTranscript
					command="curl -sS api.vibecloud.dev/releases | jq -r '.latest'"
					output="2.1.0"
					title="Read one value from the practice reply"
				/>
			</div>
			<p>
				Read the pipe from left to right: curl produces a body; jq reads it and selects a value. Put
				quotes around the jq program so your shell does not interpret brackets, spaces, or other
				characters first. This is especially useful with a query such as <Code
					code="jq '.items[0].tag'"
				/>. Array positions start at zero, so this selects the first item's tag.
			</p>
			<p>
				If you see <Code code="null" />, the field may be absent or its value may explicitly be
				null. If jq reports a parse error, the input may be an HTML error page rather than JSON.
				Look at the original response instead of adding random filters.
			</p>
			<h4 id="api-detective">Try it: Question the API</h4>
			<LessonActivity title="Question the API" scenarioId="api-detective" id="api-detective" />
			<p>
				For an independent variation, inspect <Code code=".items" />, then select the second item's
				tag. First predict which version it will contain. The
				<a href="https://jqlang.org/manual/">jq manual</a> is a reference to use as your questions grow;
				you do not need its whole language today.
			</p>
		</div>
		<div id="section-9-4" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="9.4 Keep credentials out of commands" />
			<p>
				An API key is a credential. Whoever can use it may be able to use an account's permissions
				or spend its budget. A pretend key is useful for practice; a real key has no place in this
				course's sandbox, shared transcript, or screenshot.
			</p>
			<ExpandableImage
				src="{base}/images/keys-and-secrets.webp"
				alt="A safe holds a credential card beside a command-history scroll."
				caption="Do not put a real credential in a command or a shared transcript."
			/>
			<p>
				The browser activity gives you a fake template, <Code code=".env.example" />. Read it, copy
				it to <Code code=".env" />, restrict that file's permissions with <Code
					code="chmod 600 .env"
				/>, and inspect the result. The sample script refers to a variable rather than containing a
				credential.
			</p>
			<h4 id="secret-keeper">Try it: Keep the key secret</h4>
			<LessonActivity title="Keep the key secret" scenarioId="secret-keeper" id="secret-keeper" />
			<h4>When you configure a real project</h4>
			<p class="native">
				<strong>Use an editor:</strong> open the project's credential file with your normal editor.
				With nano, run <Code code="nano .env" />, type the value inside the editor, press Ctrl+O and
				Enter to save, then Ctrl+X to exit. Configure restrictive permissions before entering a real
				value. Do not type the value into an echo command; that command can enter shell history.
			</p>
			<p>
				Keep private configuration out of version control. A template such as <Code
					code=".env.example"
				/> should contain names and fake values only. A suitable <Code code=".gitignore" /> entry prevents
				an untracked file from being added accidentally; it does not remove a credential already committed
				to Git.
			</p>
			<p>
				<Code code="chmod 600" /> restricts ordinary file access to the owner. It does not hide the file
				from programs running as that owner, administrators, backups, or an agent with equivalent access.
				Give each tool only the access it needs.
			</p>
			<Callout type="important" title="A .env file is not automatically loaded"
				>Different applications parse configuration differently. Follow the project's documented
				loading method. <Code code="source .env" /> executes the file as shell code in the current shell;
				it is not a general-purpose or safe parser for an arbitrary .env file. Only source trusted shell
				code you have read.</Callout
			>
			<p>
				If a real key has appeared in a commit, log, screenshot, or shared command, revoke or rotate
				it at the provider. Editing the visible copy does not invalidate copies elsewhere. Do not
				create a backup containing the old secret while trying to remove it.
			</p>
		</div>
		<div id="section-9-5" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="9.5 Work on another machine without losing your bearings"
			/>
			<p>
				<Code code="ssh" /> opens a secure connection to an account on another machine. The commands you
				type after logging in run there. Your local files do not quietly move across with you.
			</p>
			<ExpandableImage
				src="{base}/images/ssh.webp"
				alt="A doorway in one garden opens onto a distant server garden."
				caption="After logging in, the shell, current folder, and running commands belong to the remote machine."
			/>
			<p class="native">
				<strong>Requires an account you are allowed to use:</strong>
				<Code code="ssh learner@server.example" /> is an example shape, not a working course server. Replace
				the account and hostname with details from your administrator or hosting provider. Before accepting
				a new host key, verify its fingerprint through a trusted channel. A changed-key warning needs
				investigation; do not bypass it just to make the connection proceed.
			</p>
			<p>
				Once connected, establish your bearings with <Code code="hostname" />, <Code
					code="whoami"
				/>, and <Code code="pwd" />. The first identifies the machine, the second the account, and
				the third the current folder. A familiar prompt color is not enough evidence.
			</p>
			<p>
				<Code code="localhost" /> now means the remote machine for commands running in that session. Your
				own browser still uses your own computer's localhost. Type <Code code="exit" /> to leave the remote
				shell; check your local identity again if unsure.
			</p>
			<h4>Move a file deliberately</h4>
			<p>
				Run <Code code="scp notes.txt learner@server.example:notes.txt" /> from your
				<strong>local</strong> terminal to copy a simple file to that account. The colon marks the remote
				path. Reverse source and destination to download. Check both locations before repeating a copy,
				since an existing destination can be replaced.
			</p>
			<p>
				For repeated folder copies, learn rsync's preview first. A command such as <Code
					code="rsync -av --dry-run notes/ learner@server.example:notes/"
				/> lists proposed work without transferring it. Review the paths, then deliberately remove the
				dry-run option to transfer. The source's trailing slash means its contents. Avoid adding <Code
					code="--delete"
				/> until you understand the deletion it would request.
			</p>
			<p>
				The <a href="https://man.openbsd.org/ssh">OpenSSH manual</a> covers host identity and connection
				options. A private SSH key stays private; share its public key only where you intend to authorize
				access.
			</p>
		</div>
		<ChallengeActivity title="Prove the release" part={9} id="ch-9-prove-the-release" />
		<p class="reflection">
			Before the final check, name the machine making the request, the address it contacted, and the
			piece of the reply that supports your conclusion.
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
