<script lang="ts">
	import { Globe, Home, Send, Braces, KeyRound, DoorOpen } from 'lucide-svelte';
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

<section id="part-9" class="py-10">
	<div class="mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={Globe}
			partLabel="Part 9"
			title="Talking to the Network"
			color="var(--color-primary)"
		/>

		<blockquote
			class="my-8 border-l-4 py-1 pl-5 text-lg italic"
			style="color: var(--color-text-secondary); border-color: var(--color-primary); font-family: var(--font-heading);"
		>
			"The server is running." — prove it.
		</blockquote>

		<p class="mb-8 text-[15px] leading-relaxed" style="color: var(--color-text-secondary);">
			In <CourseLink to="part-8" /> you took a port back and started a server on it. Now let's talk to
			it. This part is about asking questions over the network and reading the answers: what
			<Code code="localhost" /> actually means, how to check a server yourself instead of trusting a claim,
			how to pull one value out of a wall of JSON — and how to handle the API keys that make all of it
			work without leaving them lying around in your shell history.
		</p>

		<Callout type="important">
			The habit this part builds is the one <CourseLink to="part-11" /> will formalise, aimed here at
			a new target:
			<strong>verify with your own command</strong>. When an agent says the server is up, the deploy
			worked, or the API returned success, there is a one-line way to check — and now you'll know
			it.
		</Callout>

		<!-- 9.1 What Is localhost -->
		<div id="section-9-1" class="mb-14">
			<SectionHeader
				level="section"
				icon={Home}
				title="9.1 What Is localhost?"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="localhost" /> is the name your machine uses for
				<em>itself</em>. Ask for <Code code="localhost" /> and the request never touches the network —
				it leaves one program on your computer and goes straight into another. That's why a dev server
				announcing "listening on <Code code="http://localhost:3000" />" is visible to you and to
				nobody else. A URL packs several answers into one line:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/localhost.webp"
					alt="A lighthouse shining its lamp inward on its own island, doors numbered 3000, 5173 and 8080"
					caption="localhost = this very machine · the port is which door"
				/>
			</div>

			<CodeBlock
				title="Reading a URL"
				code={`http://localhost:3000/api/health
└─┬─┘  └───┬───┘ └─┬┘ └────┬────┘
  │        │       │       └── which room inside — the path
  │        │       └── which door — the port
  │        └── which machine — here, this one
  └── the language — http`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The first part names the language: <strong style="color: var(--color-text);">HTTP</strong>,
				the hypertext transfer protocol — the rules a program and a server use to ask and answer. On
				the public web you'll see <Code code="https" /> instead, the same conversation encrypted so nobody
				in between can read it. And the tail end is a <em>URL</em> path, not a folder on your disk:
				<Code code="/api/health" /> exists only because someone wrote that route into the server. Ask
				for one nobody wrote and you get a 404 — the server saying it has no such path — not a broken
				machine.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You've met ports already: they're the numbered doors from <CourseLink to="section-8-3" />,
				and the same rule applies — one program per port. That's why the numbers recur. <Code
					code="3000"
				/> is the Node convention,
				<Code code="5173" /> is Vite's — the tool that runs the dev server for a great many JavaScript
				projects — and <Code code="8080" /> is the classic alternate web port. If your agent starts a
				project and mentions a number in that neighborhood, it's telling you which door to knock on.
			</p>

			<Callout type="tip">
				<Code code="127.0.0.1" /> is the same place as <Code code="localhost" /> — the numeric version
				of "here." Machines find each other on a network by <strong>IP</strong> address — internet
				protocol, the numbering scheme every networked machine answers to — and <Code
					code="127.0.0.1"
				/> is the one number reserved to mean <em>this</em> machine. You'll see both spellings in error
				messages and config files; they mean the same computer.
			</Callout>

			<VibeBox
				prompts={[
					'My app says it is running on localhost:5173 but the browser shows nothing — how do I check from the terminal?',
					'Explain the difference between localhost and a real domain like example.com'
				]}
			/>
		</div>

		<!-- 9.2 curl -->
		<div id="section-9-2" class="mb-14">
			<SectionHeader
				level="section"
				icon={Send}
				title="9.2 `curl` — Ask the Network"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				<Code code="curl" /> sends a request and prints the reply. That's it — and that's enough to settle
				most arguments with an agent. Instead of trusting "the server is running," you ask the server:
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/curl.webp"
					alt="A brass telegraph machine printing a ticker tape reading status ok, one cable running to a distant door numbered 3000"
					caption="Send a request. Read the reply. Believe nothing else."
				/>
			</div>

			<CodeBlock
				title="Asking, and saving the answer"
				code={`curl localhost:3000/health
{"status":"ok"}

curl localhost:3000/health          # with nothing listening
curl: (7) Failed to connect to localhost port 3000: Connection refused

curl -s -o status.json localhost:3000/health   # save it instead of printing
curl -I localhost:3000/health                  # just the headers`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				Four flags cover almost everything you'll need. <Code code="-o FILE" /> saves the reply instead
				of printing it. <Code code="-s" /> ("silent") hides the progress meter — always use it inside
				pipelines and scripts. <Code code="-I" /> shows you just the headers a server sends back, which
				is the quickest "is this thing alive and what does it serve?" And <Code code="-H" /> adds one
				to what you send.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A <strong style="color: var(--color-text);">header</strong> is a name/value line travelling
				alongside the request, carrying everything that isn't the content — what format you want
				back, who you are, what software is asking. (Nothing to do with the header row of a
				spreadsheet; the word just gets reused.) An
				<strong style="color: var(--color-text);">API</strong> — an application programming
				interface, a door a service opens for other programs rather than for people — knows which
				requests are yours because your key rides in one. That's the whole subject of <CourseLink
					to="section-9-4"
				/>.
			</p>

			<Callout type="caution">
				<strong>Now you can read the red-flag pattern.</strong> You will meet
				<Code code="curl ... | bash" /> everywhere, and it decodes with what you already have:
				<Code code="curl" /> fetches a script off the internet, and the pipe feeds it straight into a
				shell that runs it — unread, unreviewed, with your permissions. The two-step version is always
				available:
				<Code code="curl -o install.sh <url>" />, read the file, <em>then</em> run it. When it's the
				right call to skip that step — and it sometimes is — is the subject of
				<CourseLink to="section-11-1" />.
			</Callout>

			<VibeBox
				prompts={[
					'Check whether my local API is responding on port 8000 and show me the raw response',
					'You said the deploy succeeded — give me a curl command that proves the new version is live'
				]}
			/>
			<h4
				id="health-check"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Is It Alive?
			</h4>
			<PlaygroundNote>
				The agent says the server is up. Ask it yourself with <Code code="curl" />, then save the
				reply to <Code code="status.json" /> with <Code code="-s -o" /> so you have the receipt.
			</PlaygroundNote>
			<LessonActivity title="Is It Alive?" scenarioId="health-check" id="health-check" />
		</div>

		<!-- 9.3 Reading JSON -->
		<div id="section-9-3" class="mb-14">
			<SectionHeader
				level="section"
				icon={Braces}
				title="9.3 Reading JSON with `jq`"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				APIs answer in <strong style="color: var(--color-text);">JSON</strong> — labelled boxes
				inside labelled boxes, built out of nested <Code code={`{ "name": value }`} /> pairs. Printed
				raw it's a wall of braces; what you usually want is one value out of the middle. <Code
					code="jq"
				/> is the tool that reaches in and takes it, and since it reads from a pipe, it joins the pipelines
				you built in <CourseLink to="part-4" />.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One thing the sandbox hides: <Code code="jq" /> is not standard equipment. It's a third-party
				tool you install first (<CourseLink to="section-10-1" />), so your first
				<Code code="| jq" /> on a fresh machine may well answer
				<Code code="command not found" /> rather than a version number.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/reading-json.webp"
					alt="Nested glass apothecary jars, a brass key labelled jq .latest lowering toward the innermost vial"
					caption="APIs answer in nested boxes — jq holds the keys"
				/>
			</div>

			<CodeBlock
				title="From wall of braces to one value"
				code={`curl -s api.vibecloud.dev/releases
{"latest":"2.1.0","downloads":48213,"items":[{"tag":"2.1.0"}]}

curl -s api.vibecloud.dev/releases | jq .latest
"2.1.0"

curl -s api.vibecloud.dev/releases | jq -r .latest    # -r = raw, no quotes
2.1.0

curl -s api.vibecloud.dev/releases | jq -r .items[0].tag
2.1.0`}
			/>

			<MermaidDiagram
				definition={`flowchart LR
  A["curl -s …"] -->|"JSON"| B["jq -r .latest"]
  B -->|"2.1.0"| C(["> version.txt"])`}
				id="json-pipeline"
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				A filter is just a path: <Code code="." /> is the whole document,
				<Code code=".latest" /> is one key, <Code code=".server.port" /> walks deeper, and
				<Code code=".items[0]" /> takes the first element of a list. The <Code code="-r" /> flag matters
				more than it looks: without it a string keeps its JSON quotes, which breaks the next command in
				the pipeline. Reach for <Code code="-r" /> whenever the value is going somewhere else.
			</p>

			<Callout type="tip">
				<strong
					>If <Code code="jq" /> says <Code code="parse error" />, look at the raw reply.</strong
				>
				It means one thing only:
				<Code code="jq" /> tried to read what arrived as JSON, and the bytes weren't JSON. Nine times
				out of ten what arrived is an HTML error page — the tag-based format web pages are written in,
				so you'll see angle brackets, a leading <Code code="<!doctype html>" /> and no braces anywhere.
				The real problem is upstream: a wrong URL, or a dead server. Drop the <Code code="| jq" /> and
				read what actually arrived, the same build-the-pipeline-one-stage-at-a-time habit from
				<CourseLink to="part-4" />.
			</Callout>

			<VibeBox
				prompts={[
					'Pull just the version number out of this API response and explain the jq filter you used',
					'This jq command returns null and I do not know why — help me inspect the JSON structure first'
				]}
			/>
			<h4
				id="api-detective"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Question the API
			</h4>
			<PlaygroundNote>
				Ask <Code code="api.vibecloud.dev/releases" /> for the latest version, pull it out with
				<Code code="jq -r" />, and leave just the number in <Code code="version.txt" />.
			</PlaygroundNote>
			<LessonActivity title="Question the API" scenarioId="api-detective" id="api-detective" />
		</div>

		<!-- 9.4 Keys & Secrets -->
		<div id="section-9-4" class="mb-14">
			<SectionHeader
				level="section"
				icon={KeyRound}
				title="9.4 Keys &amp; Secrets"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				Every API you talk to wants a key, and keys are the one kind of text you must never type
				casually into a terminal. Here's the uncomfortable reason:
				<strong style="color: var(--color-text);">your shell writes down everything you type</strong
				>. A key pasted into a command lives on in <Code code="~/.zsh_history" /> — or
				<Code code="~/.bash_history" /> if you're on bash — a plain text file that anyone who sits down
				at your machine can read, and search with the tricks in <CourseLink to="section-12-2" />.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/keys-and-secrets.webp"
					alt="A brass safe holding a .env card, beside a history scroll where a plainly-typed key is struck out"
					caption="Keys live in files — never in commands"
				/>
			</div>

			<Callout type="caution">
				<strong>Never put a secret directly in a command.</strong> Not in <Code code="curl -H" />,
				not in an <Code code="export" /> you type by hand, not in a script you commit. It lands in your
				history, in your terminal scrollback — the output your window is still holding, which is what
				a screen-share shows — and often in logs you don't control. Unlike a password, an API key is usually
				a straight line to a bill.
			</Callout>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The standard answer is a <Code code=".env" /> file — "env" for environment, and nothing inside
				it but plain-text <Code code="NAME=value" /> lines, one per key. The file is locked down, and
				your commands reference the <em>variable</em> instead of the value. That's the environment
				variables and permissions from
				<CourseLink to="part-5" /> doing real work together:
			</p>

			<CodeBlock
				title="Keys in a file, not in a command"
				code={`echo 'API_KEY=sk-vibe-9c2f10ab' > .env    # the key lives here
chmod 600 .env                          # only you can read it
source .env                             # run it in THIS shell, so the value sticks

curl -H "Authorization: Bearer $API_KEY" https://api.example.com/deploy
#                                 ↑ the variable, never the key itself

echo ".env" >> .gitignore               # and never commit it`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				That header line has more moving parts than it looks.
				<Code code="Authorization" /> is the header's name, the colon separates name from value, and
				<Code code="Bearer" /> is a fixed keyword saying what kind of credential follows — only the token
				at the end is yours. An API that wants <Code code="X-API-Key: sk-vibe-9c2f10ab" /> is the same
				line with a different name and no keyword at all.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				The quotes change style mid-block on purpose. Single quotes are fully literal, which is what
				you want when writing the key into a file; double quotes still expand
				<Code code="$API_KEY" />, which is what you want when handing its value to
				<Code code="curl" />. That's the rule from <CourseLink to="section-2-2" />, and getting it
				backwards sends the server the eight characters <Code code="$API_KEY" /> instead of the key.
				<Code code="source" /> is what makes the variable available to that <Code code="curl" /> at all,
				for the reason in <CourseLink to="section-5-5" />.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				<Code code="chmod 600" /> is the <CourseLink to="part-5" /> permission lesson with the stakes
				turned up: read and write for you, nothing at all for anyone else. And <Code
					code=".gitignore"
				/> keeps the key out of your repository — because a key pushed to GitHub is a key that belongs
				to the internet, usually within minutes.
			</p>

			<p class="mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				One catch before you lean on that last line: a <Code code=".gitignore" /> entry stops
				<Code code="git" />
				<em>starting</em> to track a file and does nothing at all for one it already tracks — which is
				exactly where you are if the key is already committed. Then the only fix is to revoke and reissue
				the key, which you do on the provider's website rather than in the terminal. It works because
				revoking kills the key on their servers; deleting the commit leaves it alive.
			</p>

			<Callout type="tip">
				<strong>Agents leak keys by accident.</strong> An assistant that can read your files can
				read your <Code code=".env" />, and one that writes code may inline a key it found "to make
				the example runnable." When you review agent-written code, <Code code="grep" /> for the shape
				of a key —
				<Code code="grep -rn 'sk-' ." /> — before you commit anything.
			</Callout>

			<VibeBox
				prompts={[
					'Move the hard-coded API key in this script into a .env file and show me the safest way to load it',
					'I accidentally committed an API key — what do I actually need to do, in order?'
				]}
			/>
			<h4
				id="secret-keeper"
				class="mt-8 mb-3 scroll-mt-20 text-lg font-semibold"
				style="color: var(--color-text);"
			>
				Try It: Keep the Key Secret
			</h4>
			<PlaygroundNote>
				<Code code="deploy.sh" /> has a key typed straight into it. Move it into
				<Code code=".env" />, lock the file with <Code code="chmod 600" />, and point the script at
				<Code code="$API_KEY" /> instead — with a <Code code=".bak" />, naturally.
			</PlaygroundNote>
			<LessonActivity title="Keep the Key Secret" scenarioId="secret-keeper" id="secret-keeper" />
		</div>

		<!-- 9.5 ssh -->
		<div id="section-9-5" class="mb-8">
			<SectionHeader
				level="section"
				icon={DoorOpen}
				title="9.5 A Door to Another Machine"
				color="var(--color-primary)"
			/>

			<p class="mb-4 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				One last idea, and it reframes everything you've learned: with
				<Code code="ssh" /> — secure shell, logging into another machine over the network — the same terminal
				can drive a <em>different computer</em>: a server in a data center, a Raspberry Pi in your
				closet, a cloud box that runs your app. Every command in this course works there, unchanged.
			</p>

			<div class="my-6">
				<ExpandableImage
					src="{base}/images/ssh.webp"
					alt="A freestanding door in a forest, open onto a distant glowing server-garden, with a padlock and key"
					caption="Same conversation, different machine"
				/>
			</div>

			<CodeBlock
				title="Stepping through the door"
				code={`vibe@laptop:~$ ssh vibe@garden.example.com
vibe@garden:~$                  # the prompt changed — you are THERE now

vibe@garden:~$ ls               # this lists the server's files
vibe@garden:~$ exit             # back to your own machine
vibe@laptop:~$`}
			/>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				This is where <CourseLink to="section-intro-anatomy" /> from the introduction earns its keep:
				<strong style="color: var(--color-text);"
					>the prompt tells you which machine you're on</strong
				>. That is not a cosmetic detail. A <Code code="rm -rf" /> typed on the wrong side of that door
				is a very different afternoon, and the habit of glancing at the hostname before running anything
				destructive is one experienced people never drop.
			</p>

			<p class="mt-4 mb-3 text-[14px]" style="color: var(--color-text-secondary);">
				You log in with a <strong style="color: var(--color-text);">key pair</strong> rather than a
				password: two matching files in <Code code="~/.ssh" />. The <em>public</em> half is
				<Code code="id_ed25519.pub" /> — the <Code code=".pub" /> is what tells them apart — and it goes
				onto the server, where it acts as a lock anyone may see; the <em>private</em> half,
				<Code code="id_ed25519" />, never leaves your machine. "Goes onto the server" is a concrete
				act: that public half gets appended to <Code code="~/.ssh/authorized_keys" /> on the far side.
				Same rule as <CourseLink to="section-9-4" />, in a different costume: the secret stays in a
				file, on your computer, with tight permissions.
			</p>

			<Callout type="tip">
				This is a real-machine lesson — the sandbox has no other computer to visit. When you do have
				a server to reach, ask your assistant to walk you through generating a key with
				<Code code="ssh-keygen" /> and installing it; it's a five-minute setup you do once per machine.
			</Callout>

			<VibeBox
				prompts={[
					'Walk me through setting up an ssh key so I can log into my server without a password',
					'What is the difference between my public and private ssh key, and which one goes where?'
				]}
			/>

			<p class="mt-10 text-[14.5px] leading-relaxed" style="color: var(--color-text-secondary);">
				You can now start a server, prove it's alive, read what it says, keep its keys safe, and
				step onto another machine entirely. One more part of tooling to go — how to get new tools,
				unpack what arrives, and find out what's eating your disk.
			</p>
		</div>

		<ChallengeActivity title="Prove the Release" part={9} id="ch-9-prove-the-release" />
	</div>
</section>
