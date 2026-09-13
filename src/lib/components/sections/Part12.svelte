<script lang="ts">
	import { BookOpen } from 'lucide-svelte';
	import { base, resolve } from '$app/paths';
	import Code from '../ui/Code.svelte';
	import CodeBlock from '../ui/CodeBlock.svelte';
	import ExpandableImage from '../ui/ExpandableImage.svelte';
	import LessonActivity from '../ui/LessonActivity.svelte';
	import ChallengeActivity from '../ui/ChallengeActivity.svelte';
	import SectionHeader from '../ui/SectionHeader.svelte';
	import StarshipDesigner from '../starship/StarshipDesigner.svelte';
</script>

<section id="part-12" class="py-10">
	<div class="chapter-copy mx-auto max-w-4xl px-6">
		<SectionHeader
			icon={BookOpen}
			partLabel="Part 12"
			title="Your cockpit: readable, familiar, easy to revisit"
		/>
		<p class="lead">
			A comfortable terminal helps you notice what matters. Make the text readable, keep your
			location visible, and give each running job a clear place. Then add shortcuts where they save
			effort.
		</p>
		<div id="cockpit-overview">
			<p>
				You already have the essentials in the <a href={resolve('/#keyboard-workshop')}
					>early keyboard workshop</a
				>: jump, remove a word, restore text, and cancel. This chapter builds on those moves.
				Customization is optional; a plain terminal can do serious work.
			</p>
		</div>
		<div id="section-12-1" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="12.1 Make the window easy to read" />
			<ExpandableImage
				src="{base}/images/make-it-yours.webp"
				alt="A terminal window has a carefully chosen font, color theme, and prompt."
				caption="Readability comes first. Decoration is optional."
			/>
			<p>
				Start in your terminal application's settings. Increase the font until punctuation is
				comfortable to distinguish. Check a zero against a capital O and a one against a lowercase
				l. Use enough contrast to read dim output as well as the prompt.
			</p>
			<p>
				Try a larger line spacing and a wider window before adding plugins. A long command that
				wraps across four narrow lines is harder to inspect. Change one setting, use it for a while,
				then decide whether it helped.
			</p>
			<h4>What your prompt should tell you</h4>
			<p>
				A useful prompt answers “which machine, which account, which folder?” For a project, a
				branch name or last-command status may help too. Keep the information you actually use. A
				long list of versions and symbols can hide the place where you type.
			</p>
			<p>
				The shell creates the prompt; the terminal application draws it. Bash commonly configures it
				through PS1. zsh has its own prompt notation. Copying Bash escape sequences into zsh does
				not produce the same result.
			</p>
			<details>
				<summary>Try a temporary Bash prompt</summary>
				<p>
					Use this only inside Bash. The first line keeps your old setting; the second shows your
					account, host, and current folder. The final line restores the saved value. This changes
					the current shell session, not a startup file.
				</p>
				<CodeBlock
					title="Bash only: try a prompt"
					code={`old_prompt=$PS1
PS1='\\u@\\h:\\w\\$ '`}
				/><CodeBlock title="Bash only: restore it" code="PS1=$old_prompt" />
				<p>
					Once you like a change, put it in the appropriate shell configuration file deliberately.
					Keep a known-working terminal open while you test a new one. If the new shell reports an
					error, use that working window to repair the file.
				</p>
			</details>
			<h4 id="prompt-designer">Try it: design your prompt</h4>
			<p>
				The designer below creates a Starship configuration you can inspect and download. It does
				not install anything on your computer. Starship is an optional cross-shell prompt tool;
				installation and initialization are separate steps, and initialization differs by shell.
			</p>
			<StarshipDesigner />
			<p>
				Before replacing an existing configuration, save a copy and compare the change. Follow <a
					href="https://starship.rs/guide/">Starship's setup guide</a
				> for your system. Treat an installer as executable code even when it belongs to a popular tool.
			</p>
		</div>
		<div id="section-12-2" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="12.2 Recall, inspect, and edit" />
			<p>
				Your command history records commands. Scrollback is the text displayed above the prompt,
				including output. They are different records. Clearing the view does not necessarily clear
				history; closing a terminal does not guarantee that either record has been erased.
			</p>
			<ExpandableImage
				src="{base}/images/history-superpowers.webp"
				alt="A crab follows a ribbon of past commands back to a previous task."
				caption="Recall the command, check it, then decide whether to run it."
			/>
			<p>
				Press Up to recall an earlier command. Edit it before pressing Enter. Down moves toward more
				recent history. In the course playground, returning past the newest entry restores the
				unfinished draft you had before browsing.
			</p>
			<p>
				Try this deliberately: run <Code code="echo blue" />, start typing a different unfinished
				command, then press Up and Down. Your earlier command and current draft have different jobs.
				You are choosing which one to edit.
			</p>
			<p>
				<Code code="history" /> prints the history available to this shell. Filtering it with <Code
					code="history | grep releases"
				/> finds matching lines in that available record, not necessarily every command you have ever
				run. Shell settings control what is saved, how much, and whether sessions share it.
			</p>
			<h4 id="history-recall">Try it: Retrace your steps</h4>
			<LessonActivity title="Retrace your steps" scenarioId="history-recall" id="history-recall" />
			<h4>Search older history in your terminal</h4>
			<p class="native">
				Press Ctrl+R, type a remembered fragment, and inspect the match. Press Ctrl+R again for an
				older match. Enter runs the selected command; Ctrl+C cancels the search. In many
				Readline-style setups an arrow key accepts a match for editing, but check your shell
				bindings. Browsers may reserve Ctrl+R for reload, so practise this in your own terminal.
			</p>
			<p>
				Interactive history expansion such as <Code code="!!" /> can repeat the previous command in shells
				that enable it. It is optional shorthand, and often less clear than Up, inspect, and edit. In
				particular, do not prepend sudo to an unexamined recalled command just because it previously failed.
			</p>
			<h4>Keep the short editing moves close</h4>
			<p>
				Ctrl+A and Ctrl+E move to the beginning and end. Ctrl+K removes the suffix after the cursor.
				Ctrl+W removes a previous whitespace-delimited word; Ctrl+Y restores killed text. Bash's
				Ctrl+U normally removes text before the cursor, while zsh's default Emacs binding removes
				the whole line. Ctrl+E followed by Ctrl+U clears a single line in both.
			</p>
			<p>
				These gestures assume the usual Emacs-style key bindings. Vi editing mode and personal
				configuration differ. On macOS, Option-based word shortcuts may require terminal
				configuration; Esc followed by the letter is a common alternative. The workshop shows the
				actual cursor movement so you can connect the key with its effect.
			</p>
			<p class="reflection">
				Return to a command from the activity and change one path before running it. What did you
				inspect to make sure the recalled command still fits today's task?
			</p>
		</div>
		<div id="section-12-3" class="lesson">
			<SectionHeader
				level="section"
				icon={BookOpen}
				title="12.3 Keep the editor and terminal connected"
			/>
			<p>
				Your editor is where you comfortably change a file. Your terminal runs a command that uses
				that file. Keeping them together shortens the loop: edit, save, run, inspect, adjust.
			</p>
			<ExpandableImage
				src="{base}/images/vscode-terminal.webp"
				alt="An editor shows a file above a terminal pane."
				caption="Save the file above before running a command below that reads it."
			/>
			<p>
				Many editors include a terminal panel. Open it through the editor's menu, then run pwd. The
				panel may start in your project folder, but verify instead of assuming. Its shell can be
				Bash, zsh, PowerShell, or another configured shell; being inside an editor does not choose
				Bash automatically.
			</p>
			<p>
				Make a tiny notes.txt in a practice folder. Type one sentence in the editor and save it. In
				the terminal, run <Code code="cat notes.txt" />. Change the sentence, save again, and rerun
				cat. This reveals an easy mistake: the terminal reads the saved file, not an unsaved editor
				buffer.
			</p>
			<p>
				In a course playground, use <strong>Edit a file</strong> to open the same simulated filesystem
				that the commands use. Save, then inspect with cat. It is a compact file editor rather than a
				simulation of every nano or Vim key.
			</p>
			<details>
				<summary>When editing a real file feels unfamiliar</summary>
				<p>
					With nano installed, run <Code code="nano notes.txt" />, type a sentence, press Ctrl+O,
					press Enter to confirm the filename, then press Ctrl+X. In nano's footer, a caret such as
					^O means Control+O.
				</p>
				<p>
					If you have opened Vim accidentally, press Esc, then type <Code code=":q!" /> and Enter to leave
					without saving. To save a file you intentionally edited in Vim, Esc then <Code
						code=":wq"
					/> and Enter writes it and quits. Learn its modes in a dedicated session before using it for
					an important first edit.
				</p>
			</details>
			<p>
				If the editor offers “Open in integrated terminal,” use it when it helps, then still check
				pwd. Familiar layout is a convenience, not a replacement for knowing which file and folder
				you are using.
			</p>
		</div>
		<div id="section-12-4" class="lesson">
			<SectionHeader level="section" icon={BookOpen} title="12.4 Give parallel work a clear home" />
			<p>
				Try two terminal tabs before learning a multiplexer. Put a running server in one and your
				commands in the other. Name the tabs when possible. When something prints continuously, its
				dedicated tab makes the source obvious.
			</p>
			<ExpandableImage
				src="{base}/images/many-terminals.webp"
				alt="Separate terminal panes hold a server, its logs, and an interactive prompt."
				caption="One job per pane makes it easier to know what is running."
			/>
			<p>
				Each shell has its own current directory and variables. Changing folders in tab one does not
				move tab two. They still share the underlying files. A saved edit in one can affect a
				command running in another.
			</p>
			<h4>Native practice: detach and return with tmux</h4>
			<p>
				tmux manages terminal sessions with windows and panes. After installing it, run <Code
					code="tmux new -s practice"
				/>. Inside, run pwd so you can recognize the session. Press Ctrl+B, release both keys, then
				press D to detach. You return to the shell outside tmux.
			</p>
			<CodeBlock
				title="Your terminal: find and return to the session"
				code={`tmux ls
tmux attach -t practice`}
			/>
			<p>
				Back inside, Ctrl+B then % creates a side-by-side pane; Ctrl+B then a double-quote creates a
				stacked pane. The prefix and the next key are separate presses. Use Ctrl+B then an arrow key
				to move focus. Type exit in an unused pane to close its shell.
			</p>
			<p>
				Detaching leaves the session running while its host remains available. It does not survive a
				reboot automatically, and it is not a service manager. Practise on disposable work first.
				The <a href="https://github.com/tmux/tmux/wiki/Getting-Started"
					>tmux getting-started guide</a
				> covers navigation and copy mode.
			</p>
			<p class="reflection">
				Try leaving one harmless command running in a tmux session, detach, and return. Name which
				shell is outside, which is inside, and what “detach” preserved.
			</p>
		</div>
		<ChallengeActivity title="Hand over the cockpit" part={12} id="ch-12-handover" />
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
