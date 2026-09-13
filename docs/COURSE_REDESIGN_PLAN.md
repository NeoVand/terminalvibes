# TerminalVibes: course audit and redesign plan

Audited September 13, 2026. The findings below describe the repository before the redesign. See [implementation checkpoint](IMPLEMENTATION_CHECKPOINT.md) for completed work and remaining artwork review; this audit is retained as the reasoning behind the changes.

**Deployment constraint:** the site must remain fully static, built with GitHub Actions and hosted on GitHub Pages. No application server, serverless relay, credential service, or required local companion is part of this plan. Cloud AI is optional direct browser-to-provider access using the learner's own key.

## Judgment

TerminalVibes has a distinctive visual identity, substantial teaching material, and unusually promising practice infrastructure. It is also much harder to begin than it appears to its author. It often reads like an illustrated reference for someone who already understands software development, presented as a first course for someone who does not.

The central problem is sequencing. The course explains the landscape before giving the learner a reason to care about it. It introduces unfamiliar terms inside explanations of other unfamiliar terms. It sometimes treats advanced caution, concise commands, and developer vocabulary as evidence of progress before a beginner has learned how to recover from a typo.

Your fiancée's experience is valuable evidence of that mismatch. A learner who wants to learn but cannot find how to edit a line has encountered a missing piece of the product. More patience from the learner is not the fix.

Keep the illustrated world, the crab, the interactive filesystem, and the ambition. Rebuild the beginner route around small actions, visible consequences, and comfortable recovery. Add depth through connected missions and a substantial field guide. A terminal bible can have a gentle front door.

## What I inspected

- Read the rendered introduction and all 14 current chapters; inspected relevant source, scenarios, challenge grading, cheatsheet matching, and tutor architecture.
- Exercised the local app in a desktop browser and checked its opening at a 390-pixel mobile viewport. Tested the first playground, keyboard behavior, contextual cheatsheet, and default scripted tutor.
- Reviewed the 58-image contact sheet and individual artwork. The artwork already contains teaching diagrams; it is not merely decorative.
- Ran existing focused tests: **300 passed across seven files**, covering playground behavior and AI retrieval/gating. Passing these tests does not establish teaching effectiveness or complete real-shell compatibility.
- Checked official provider documentation and selected shell/tool references. Also reproduced selected Bash/zsh differences on this machine.

I did not download and benchmark the local language models, connect paid provider accounts, audit every operating system, or visually review the exported PDF. The findings about observed answer quality concern the default scripted mode. The architecture findings apply to the current source.

Earlier plans in this repository are useful history, but some refer to old chapter numbers or gaps that have since been filled. This audit uses the current course.

## Findings that should determine the work order

| Priority | Finding and evidence                                                                                                                                                                                                                                                                         | Consequence                                                                                                   | Required change                                                                                                                                               |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| P0       | In the measured desktop layout, Part 1 starts about 7,425 pixels down and its first embedded exercise about 11,147 pixels down. The introductory section alone contains roughly 1,886 rendered words, including code and captions. There is an earlier link to a separate playground.        | The main reading path delays the first personal success. A separate destination does not repair the sequence. | Put one live command in the opening viewport. Move terminal history, terminology comparisons, and AI context after initial practice or into optional reading. |
| P0       | Line-editing shortcuts exist, but are buried in Part 12. The ordinary playground key handler implements history arrows and Tab, with Ctrl+C handled separately for active CLI-agent sessions. In the first exercise, Ctrl+C left an unsubmitted command intact; Ctrl+K opened global search. | The tool does not reliably practice the skill the learner actually needs.                                     | Build and verify a focused line editor; resolve global shortcut conflicts; publish an honest browser/native support matrix.                                   |
| P0       | The first challenge says, “Every wrong guess is an Enter you did not have to press.” General challenge feedback rewards a shorter route.                                                                                                                                                     | Experimentation becomes a score penalty while the course is trying to make experimentation feel comfortable.  | Grade the task outcome and understanding first. Make optimization an optional later activity.                                                                 |
| P0       | Beside “Say hello,” the cheatsheet suggests writing a secret file, shell variables, script arguments, and exit codes. Matching uses shared command words, so every advanced use of echo looks relevant.                                                                                      | Help increases confusion at the moment it should reduce it.                                                   | Curate references by skill and exercise, with intent-based search and an explicit search-all option.                                                          |
| P0       | Early prose says # lines represent machine replies; later blocks display replies without #. The Copy button copies the entire code string.                                                                                                                                                   | Learners must decipher an inconsistent transcript convention and may copy output as a command.                | Store commands, output, errors, and commentary separately. Copy only runnable input.                                                                          |
| P0       | Some examples teach unsafe or inaccurate habits: inline secret-writing commands, blanket Bash/zsh equivalence, and the implication that a printed localhost URL proves a server is private.                                                                                                  | A successful lesson can transfer the wrong behavior to a real terminal.                                       | Correct these before making them more prominent through improved prose, illustrations, or a stronger tutor.                                                   |
| P1       | The tutor has mock/local backends and two fixed local model choices. Reading context drives suggestions, but the normal answer call does not receive a structured snapshot of the learner's active exercise and last error.                                                                  | A larger model would still be missing the most useful evidence.                                               | Add learner context and a better teaching policy alongside cloud providers and a monthly reviewed model catalog.                                              |
| P1       | The repeated forest/gold/green appearance is specified throughout the image prompts, including explicit bans on blue and purple.                                                                                                                                                             | A newer generator following the same brief will reproduce much of the sameness.                               | Rewrite art direction and visual teaching roles before regenerating assets.                                                                                   |

Evidence screenshots: [desktop opening](/Users/neo/repos/terminalvibes/docs/images/audit-2026-09-opening.png), [first-exercise cheatsheet](/Users/neo/repos/terminalvibes/docs/images/audit-2026-09-cheatsheet.png), [mobile opening](/Users/neo/repos/terminalvibes/docs/images/audit-2026-09-mobile.png). Scroll measurements describe this local layout, not a universal device-independent value.

## What is worth preserving

The seeded filesystem and visible file tree make an otherwise invisible activity concrete. Reset, undo/redo, saved progress, shareable practice, and goal checking are valuable foundations. Undo is especially useful for experimentation, provided it stays clearly labeled as a sandbox feature rather than something ordinary shell deletion offers.

The staged text-processing examples are often good: a learner can see data become smaller and more useful. The mango-to-kiwi example gives text replacement a comprehensible purpose. Later scenarios involving files, logs, backups, and servers create opportunities for authentic work.

The course already distinguishes reading progress from exercise activity and completion, and includes a spaced-review nudge. Preserve that distinction and extend it toward evidence of retained skills. It does not need a new progress system that merely renames scrolling “mastery.”

The art makes the course memorable and welcoming. Keep its complexity and craft. Put that richness around clearer teaching steps and more varied visual experiences.

## The teaching contract

Each short lesson should promise a concrete result: “Find the file,” “Fix the word without retyping,” or “Save just the lines you need.” Most steps should introduce one main new idea, while deliberately reusing earlier skills.

Use this rhythm:

1. Give the learner a reason to act, in one or two sentences.
2. Show one small worked example, with input and result visibly separated.
3. Let the learner do it immediately.
4. Point to what changed and explain why.
5. Change one detail and let them try again with less help.
6. Include a recoverable mistake when it serves the skill.
7. Revisit the skill later inside a different useful task.

This is consistent with general educational guidance on worked examples, practice, concrete representations, graphics paired with explanations, and spaced retrieval. It is a design basis, not proof that a specific terminal lesson will work; novice observation must decide that. [IES practice guide](https://ies.ed.gov/ncee/wwc/PracticeGuide/1)

Write in adult, simple language. Avoid baby talk, exaggerated praise, and a metaphor for every noun. A plain explanation of a folder should not require knowing Node, npm, dependencies, and node_modules. Introduce the real term after the learner has something concrete to attach it to.

Replace long parenthetical definitions with separate short steps. State the ordinary case first, then reveal exceptions when they change the learner's next action. Keep necessary limitations close to the command; move interesting history into optional sidebars. Remove repeated “magic,” catastrophe anecdotes, and claims that everything works the same everywhere.

“It printed nothing” needs explanation. Some commands complete without printing text. Teach the learner to check the resulting state, rather than equating silence with either failure or guaranteed success.

## A proposed opening: the first few minutes

The following is proposed lesson copy, not a claim that these behaviors are implemented yet. Show one step at a time with a small illustration beside the terminal. Do not put this whole sequence above an inactive terminal.

### Make the terminal say hello

This is a practice terminal. The commands here cannot change files on your computer.

Click after the cursor, type this, and press **Enter**:

```sh
echo "Hello, world!"
```

**The terminal prints:**

```text
Hello, world!
```

You gave the terminal an instruction. That instruction is called a **command**.

Here, `echo` prints the text you give it. The quotation marks keep these words together. The quotation marks themselves are not printed.

**Your turn:** make it say something you choose. Keep `echo` and the quotation marks. Change the words between them.

### You can change your mind

Press the **Up arrow**. Your previous command comes back so you can edit it. It has not run again.

Change one word. Press **Enter** when you are ready.

You do not have to type a command from scratch every time.

### Get comfortable fixing a mistake

Try this:

```sh
ech "Hello again"
```

The terminal cannot find a command named `ech`. That message tells us which word to fix. This mistake has not changed your files.

Press **Up**, change `ech` to `echo`, and try again.

### Leave a command unfinished on purpose

Type a new message but do not press Enter. Now press **Ctrl+C**.

The unfinished command disappears. You have a fresh prompt—the place where you type the next command.

This step must use a verified keyboard implementation. In a browser that intercepts the key, provide a clearly labeled demonstration and a native-terminal practice step.

### Your first useful habit

Before the next lesson, use the tiny keyboard practice to jump to the beginning and end of a line. Then use `pwd` and the visible folder map to discover where your commands are working.

Only now explain the terminal as the window and the shell as the program interpreting these instructions. Unix history can wait until the learner is curious.

The opening succeeds when the learner can change a message, recover from a typo, and explain which text they typed and which text the computer printed. Completing four unrelated commands is a weaker first milestone.

## Keyboard workshop: “Fix it without retyping it”

Move this immediately after the opening. Revisit its gestures throughout the course. Offer a later power-user workshop for more advanced history, selection, and editor behavior.

Default the lesson explicitly to Bash Readline and zsh's Emacs-style bindings. Detect or ask for the learner's actual shell and terminal when entering the native track. Vi bindings and custom keymaps belong in a clearly marked alternative.

| Action                       | Initial gesture                | Practice                                             |
| ---------------------------- | ------------------------------ | ---------------------------------------------------- |
| Move to the beginning/end    | Ctrl+A / Ctrl+E                | Fix the command name; append a missing argument.     |
| Remove text after the cursor | Ctrl+K                         | Keep a useful prefix and replace its ending.         |
| Remove backward text         | Ctrl+U                         | Show the Bash/zsh difference below.                  |
| Remove the preceding word    | Ctrl+W                         | Change one argument without starting over.           |
| Restore killed text          | Ctrl+Y                         | Demonstrate the editing buffer, distinct from files. |
| Move by words                | Alt+B / Alt+F, where supported | Reach the middle argument of a longer command.       |
| Remove the following word    | Alt+D, where supported         | Replace a forward word.                              |
| Reuse/edit a command         | Up / Down                      | Repair a typo and rerun.                             |
| Search previous commands     | Ctrl+R                         | Find a previous command, inspect it, then run.       |
| Complete a name              | Tab                            | Complete a path containing a space.                  |
| Cancel an unfinished command | Ctrl+C                         | Discard it without executing it.                     |
| Redraw a cluttered display   | Ctrl+L                         | Show that files and command history remain.          |

Binding reference: [Readline user manual](https://tiswww.case.edu/php/chet/readline/rluserman.html), [zsh line editor](https://zsh.sourceforge.io/Doc/Release/Zsh-Line-Editor.html).

**Do not teach Ctrl+U as an unconditional universal “delete the whole line.”** Bash's default binding removes backward to the beginning; zsh's default Emacs binding kills the whole line. For an ordinary single-line command, Ctrl+E followed by Ctrl+U gives a useful whole-line editing exercise in either. Ctrl+C is the clearer instruction when the intent is to abandon the command. These bindings were also checked locally during this audit.

Use an animated cursor, a highlighted removal region, and selectable before/after text. Each exercise has a practical goal: change a filename, repair the first word, remove an unwanted suffix, retrieve a command. Do not grade typing speed. “Quickly replacing a word” should first mean direct editing; history substitution syntax can be an optional later technique with preview precautions.

Explain Ctrl+D separately: on an empty shell prompt it can end the shell session, and its behavior depends on context. Similarly, Ctrl+C during a running foreground program differs from canceling an unsubmitted line. Clearing/redrawing a screen is different from clearing history; scrollback behavior depends on the terminal and command.

### Browser implementation requirements

- Scope global search shortcuts so they do not steal editing keys from the focused terminal. The observed Ctrl+K conflict is a first fix.
- Implement cursor-aware editing, a kill/yank buffer, history that restores the unfinished draft, and completion that handles quoting, spaces, cursor position, and ambiguous candidates.
- Let Shift+Tab leave the control. Document a keyboard-only way to switch between completion and focus navigation. Do not create a keyboard trap.
- Test Chrome, Safari, and Firefox on macOS and Windows/Linux where available. Browser-reserved Ctrl+L, Ctrl+R, and Ctrl+W cannot simply be assumed interceptable. macOS Option behavior also depends on terminal settings.
- Distinguish “key captured here,” “demonstrated here,” and “practice in your terminal.” An on-screen key button helps explain a gesture but does not prove the learner can perform it physically.
- Keep a mobile-friendly demonstration route and recommend a physical keyboard for skill practice. Test virtual-keyboard visibility, focus, and terminal scrolling separately.

## Current chapter-by-chapter audit

Every chapter needs an editorial pass. Several need to become multiple shorter lessons; some material should move earlier or later rather than simply expand.

| Current part                    | Keep                                                                | Main problem                                                                                                                   | Rewrite direction                                                                                                                                                  |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Introduction                    | Welcoming world; promise of practice                                | Long terminology/history/AI framing before action; crowded navigation                                                          | Replace the opening with the live hello sequence. Put the course map and history behind an invitation to explore.                                                  |
| 1 — First contact               | Echo, intentional typo, help habit                                  | Too many concepts before a win; manuals/platform caveats dominate; first challenge assumes developer context                   | Teach command/input/output, change a message, repair a mistake. Use a tiny help lookup whose task requires only known commands.                                    |
| 2 — Moving around               | Folder map; relative/absolute paths; visible filesystem             | Opening uses Node/npm context; navigation, creation, reading, and editing accumulate too quickly                               | Follow one familiar notebook folder. Split orientation, creation, and editing. Teach spaces with an actual filename.                                               |
| 3 — Copy, move, delete          | Before/after changes; backups; wildcard awareness                   | Repeated fear framing; overwrite and glob details need stronger sequencing and shell accuracy                                  | Begin with a disposable copy. Predict targets, perform one operation, verify. Introduce deletion after recovery and target inspection.                             |
| 4 — Text and pipes              | Incrementally useful log pipeline                                   | Redirection, error streams, search, patterns, pipes, find, and xargs compete                                                   | Split reading/search, saving output, and composing pipelines. Show intermediate data. Move advanced filename handling to a later workshop.                         |
| 5 — Permissions and environment | Concrete permission imagery; useful PATH concepts                   | Permissions, environment, startup files, and process scope are distinct mental models                                          | Split these subjects. Teach a missing-command diagnosis before startup-file customization; teach script environment scope with a visible comparison.               |
| 6 — Scripts                     | Reusable task and arguments                                         | Writing/saving a script is under-taught; simulator workarounds obscure the real workflow; backup example overclaims robustness | Use a real editing workflow. Grow three known commands into a script, then add arguments, checks, and failure handling.                                            |
| 7 — Text surgery                | Specific replacement example; preview mindset                       | Sed/awk/regex arrive as dense recipes                                                                                          | Make a later workshop: search → preview → compare → change → verify. Distinguish plain replacement, regex, and structured-data editing.                            |
| 8 — Processes                   | Running jobs, ports, monitoring                                     | Essential “get my prompt back” arrives late; some network claims are too broad                                                 | Move foreground interruption early. Keep process inspection, graceful stopping, and port diagnosis as a later practical mission.                                   |
| 9 — Network and secrets         | Useful curl/JSON/remote tasks                                       | Networking, JSON, secrets, SSH, and transfer are compressed together; secret examples contradict guidance                      | Split web requests, structured data, credentials, and remote work. Use fake fixtures; teach connection/HTTP/parsing failures separately.                           |
| 10 — Toolshed                   | Installation, archives, links, disk usage                           | A collection of useful topics without enough repeated workflow                                                                 | Introduce package installation when the native track needs it. Give archives and disk investigation a mission each. Add a discoverable modern-tool workshop.       |
| 11 — Auditing AI                | Read-before-run habit; inspect the proposed change                  | Overgeneralized agent-safety claims; beginner path assumes interest in coding agents                                           | Make this an applied elective after file and process competence. Inspect actual context, scope, changes, and verification.                                         |
| 12 — Cockpit                    | High-value keyboard, history, customization material                | The most immediately useful gestures appear near the end; prose promises unpracticed behavior                                  | Move basic editing to lesson 2. Keep history fluency, aliases, and deliberate configuration changes later. Avoid sudo history shortcuts as a beginner centerpiece. |
| 13 — Under the hood             | Interesting explanation of terminals; opportunity for serious depth | Terminal internals and robust scripting are mixed; abstraction jumps and sweeping claims                                       | Separate optional PTY/signals internals from practical scripting decisions, loops, quoting, cleanup, and reliability.                                              |
| 14 — Continuing independently   | Capstones; compact reference; transfer ambition                     | Memorization/no-lookup framing and broad competence claims; duplicated reference data                                          | Offer independent tasks where lookup is allowed. Assess inspection, execution, explanation, and verification. Generate reference views from shared content.        |

## Accuracy and prerequisite repairs

These are concrete corrections to prioritize, not a claim that every command in the course has been certified.

| Problem                                                                                                                                                              | Repair                                                                                                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Part 1's help exercise asks the learner to save output with > before redirection is taught, then inspect it with another not-yet-established command.                | Have them look up and display a small number of lines first. Add saving only after redirection is introduced, or explicitly teach it before requiring it.                                                             |
| The first challenge treats ls -A as a misconception because the simulator does not support it. The command is valid on this machine and common real implementations. | Implement relevant flags or label the simulator limitation. Never present a real option as a learner misconception. The “never both” claim about short/long aliases also needs correction.                            |
| Secret lessons use echo with a secret value in command text, including the cheatsheet.                                                                               | Teach entering a fake lab secret through an editor. Explain history, accidental commits, and revocation. Real learner credentials never belong in course fixtures or tutor context.                                   |
| Sourcing .env is presented too casually.                                                                                                                             | Explain that source executes shell code; dotenv formats and app loading differ. Use a deliberately trusted, shell-compatible file only when that is the lesson.                                                       |
| Permission changes risk suggesting a key is hidden from the learner's own agent.                                                                                     | Explain that owner-only permissions do not isolate another process running as that owner. Check that backups do not retain the exposed value.                                                                         |
| Broad Bash/zsh equivalence; unquoted jq expressions with brackets.                                                                                                   | Label shell scope and quote filters. Unmatched globs differ by default: a local Bash test preserved the literal pattern while zsh rejected it. [zsh expansion](https://zsh.sourceforge.io/Doc/Release/Expansion.html) |
| A child script is described as though none of its changes survive.                                                                                                   | Separate shell state from external effects: its directory/environment changes do not modify the parent shell, but files it writes remain.                                                                             |
| find piped directly into xargs assumes simple filenames.                                                                                                             | Teach an appropriate find -exec or null-delimited form when names may contain whitespace/newlines; verify the chosen platform recipe.                                                                                 |
| Cut/awk examples can be mistaken for general CSV parsing.                                                                                                            | Label simplified delimiter-separated fixtures. Real quoted CSV needs an appropriate parser.                                                                                                                           |
| A server printing a localhost URL is treated as evidence of private binding.                                                                                         | Inspect the actual listen address; printed connection advice does not establish the interface binding. Separate address, port, and protocol.                                                                          |
| Curl's silent mode and HTTP errors need clearer treatment.                                                                                                           | Show transport errors, HTTP status, and body separately. Choose -sS and explicit failure handling when appropriate; explain that -I issues HEAD. [curl manual](https://curl.se/docs/manpage.html)                     |
| The early backup script claims to work for arbitrary targets but uses the target as part of a destination path and reports success too freely.                       | Start with a constrained task, then handle invalid input, absolute/nested paths, collisions, repeated runs, and failed copies. Verify outputs before announcing success.                                              |
| Strict shell flags and traps are portrayed as a universal robustness recipe.                                                                                         | Teach their particular semantics and limitations. Use explicit checks for expected failures; explain cleanup and signal exit behavior with small examples.                                                            |

Track each repair in a command-example manifest: shell/platform, fixture, input, expected stdout/stderr/status, changed files, prerequisite skills, and simulator support. Validate important executable examples against disposable native-shell fixtures as well as the simulator. Do not broaden the simulator indiscriminately to preserve a flawed lesson.

## Proposed course structure

Use three connected entry points: **Start here**, **Get something done**, and **Understand it deeply**. The first is a guided course; the others are searchable routes into the same skills. Depth should be available without making every beginner read the whole encyclopedia.

The following is a working sequence of 24 short chapters, grouped into four stages. Chapter count is provisional; a successful learner journey matters more than a target number.

| Stage / chapter                       | Learner's result                                       | Main prerequisite / environment                     |
| ------------------------------------- | ------------------------------------------------------ | --------------------------------------------------- |
| Start 1. Hello, terminal              | Print a personal message and fix a typo                | None; browser                                       |
| 2. Edit and recover                   | Repair, recall, and discard a command                  | First command; verified keyboard trainer            |
| 3. Where am I?                        | Move between home and a familiar folder                | Prompt and commands; browser                        |
| 4. Make a small project               | Create a garden notebook and handle a spaced name      | Navigation; browser                                 |
| 5. Read, edit, save                   | Change a note, save it, close it, verify it            | Files; editor lab/native bridge                     |
| 6. Copy, move, remove                 | Organize a disposable folder and verify each change    | Paths and inspection; browser then native           |
| Daily work 7. Your own terminal       | Repeat a familiar task in a dedicated practice folder  | Initial browser wins; macOS/Linux/Windows-WSL route |
| 8. Ask for help; understand errors    | Diagnose a typo, wrong path, and missing command       | Basic navigation; both                              |
| 9. Find a file or a line              | Locate a misplaced note and relevant text              | Paths and reading; both                             |
| 10. Save and connect output           | Build a useful small report                            | Search and input/output; both                       |
| 11. Install useful tools              | Install, locate, and remove one selected tool          | Native setup and help; native                       |
| 12. Keep your place and your history  | Reuse work with search, aliases, and navigation aids   | Keyboard basics; native                             |
| Real projects 13. Processes and ports | Stop a stuck task and identify a running server        | Recovery and errors; simulation/native              |
| 14. Environment and PATH              | Explain why a command or setting is missing            | Processes and installation; both                    |
| 15. Permissions and credentials       | Diagnose access and handle a fake secret correctly     | Files, editor, environment; both                    |
| 16. Web requests and JSON             | Fetch a fixture, inspect status, extract a field       | Streams and errors; simulation/native               |
| 17. Work on another machine           | Identify local vs remote; connect and transfer a file  | Paths, credentials, networking; native/guided demo  |
| 18. Archives, disk, and links         | Inspect an archive and explain what consumes space     | Files, paths, inspection; both                      |
| Automation 19. Your first script      | Save and run a task already done manually              | Editor and known commands; both where supported     |
| 20. Decisions, arguments, loops       | Process several files and handle missing input         | First script; native parity fixtures                |
| 21. Scripts you can trust             | Handle failure, verify results, and rerun safely       | Conditions, loops, exit status; native              |
| 22. A comfortable workspace           | Use a fuzzy selector and persistent terminal workspace | History, processes, native tools                    |
| 23. Work with an AI assistant         | Inspect and verify a proposed change in context        | Files, errors, script basics; sandbox               |
| 24. Independent missions              | Complete a new practical task using references         | Relevant learned skills; browser → native           |

Optional deep chapters: shell expansion and quoting; regex and text transformations; terminal/TTY/PTY behavior; signals and job control; startup-file rules; shell portability; scheduling with the platform's scheduler; Git's basic inspect/diff/restore workflow; safe bulk renaming and structured-data transformations.

A basic editor deserves proper instruction. Teach one accessible route thoroughly, including “where did I save it?” and “how do I leave?” Offer nano and opening a file in a graphical editor; provide a small Vim escape card before a tool can unexpectedly open it. Advanced Vim proficiency is optional.

The Windows route must name its environment. PowerShell is a different shell; Unix examples should use an explicit WSL/Bash route or a separately authored PowerShell track. Do not silently present PowerShell as interchangeable. Native setup can be skipped by someone staying in the browser, but native-only missions must say so.

### The professional perspective: teach workflows before tool collecting

Effective terminal work depends on recovering quickly, inspecting before changing, narrowing a search, understanding context, and verifying a result. A terse one-liner is not automatically better than a clear sequence. Looking something up is a normal professional skill.

Introduce modern tools in practical pairs with an available baseline, then show when their defaults matter:

| Need                   | Suggested treatment                                                                                                                                                                            |
| ---------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Find text              | Learn a small grep example, then a repository search with [ripgrep](https://github.com/BurntSushi/ripgrep). Explain ignored/hidden files so “no results” is not mistaken for proof of absence. |
| Find a filename        | Learn the path/pattern distinction, then compare a focused find task with [fd](https://github.com/sharkdp/fd).                                                                                 |
| Pick from many choices | Use [fzf](https://github.com/junegunn/fzf) to select from a list; teach selection and canceling before advanced shell integrations.                                                            |
| Return to a place      | Teach cd and history first, then [zoxide](https://github.com/ajeetdsouza/zoxide). The learner should still be able to explain the resulting location.                                          |
| Read comfortably       | Learn cat/less, then [bat](https://github.com/sharkdp/bat), including how to leave its pager.                                                                                                  |
| Preserve a workspace   | Use [tmux](https://github.com/tmux/tmux) in a later native mission with attach/detach and an explicit exit/recovery card.                                                                      |
| Improve a script       | Use [ShellCheck](https://github.com/koalaman/shellcheck) to investigate a concrete bug; interpret the warning and verify the repair.                                                           |

Add smaller field-guide entries for directory trees, concise help, process viewers, disk explorers, archive tools, clipboard integration, and command timing. Do not require installing a large collection before the learner has a use for it.

## Playground redesign

Give each mission four visible elements: **the task**, **the terminal**, **what changed**, and **help if needed**. Put the next action beside the relevant output. Keep richer explanations expandable without hiding information required to proceed.

Use one sandbox identity per active mission. Show the current folder, selected file preview, and recent change. In the first navigation lessons the tree is a teaching aid; later gradually ask the learner to locate themselves using commands before revealing it.

Add layered hints: restate the goal → point to the relevant concept → show a partial command → show an example with different data → reveal a worked solution. Let the learner choose. Do not force a long Socratic exchange when they ask for direct help.

Validate the outcome and, where necessary, the skill. If the lesson is about copying, creating a matching file by another route is not enough to prove copying. If the mission is simply to produce a report, accept multiple correct approaches. Require preservation and verification only when they are part of the stated task. Make feedback explain those criteria.

Separate optional efficiency puzzles from learning progress. Give full recognition for a correct task completed through exploration. Later challenges can compare approaches without penalizing the earlier attempt.

Maintain an explicit compatibility view: **works in this practice terminal**, **shown as a simulation**, or **requires your terminal**. Full-screen editors, interactive history, long-running jobs, networking, and complex shell syntax need deliberate treatment. Never suggest that a browser imitation is already a complete shell.

Keep reset/undo/share, but make shared snapshots exclude credentials and clearly describe their contents. Preserve the learner's draft when navigating away. Verify screen-reader announcements, accessible focus order, selection/copy behavior, reduced motion, zoom, and mobile virtual-keyboard overlap.

## Cheatsheet redesign

The cheatsheet should answer “What am I trying to do?” as well as “What is this command?” Searches such as “delete whole line,” “go back,” “stuck,” “find a word,” and “leave this screen” should lead to the right help.

Model entries with explicit skill IDs, supported environments, entry type, example, explanation, recovery advice, and lesson link. Distinguish a command, a key gesture, and a conceptual reference. Associate entries with exercises intentionally instead of matching any shared command word.

Show a small “For this exercise” collection and a visible way to search everything. If a scoped search returns nothing, offer global results with their level/environment labeled. Include the simplest form first: the hello exercise needs plain echo, not shell-variable and secret-file examples.

Keep a persistent “Get unstuck” strip: cancel a command, leave a pager/editor, locate yourself, restore a previous command, and ask about the last error. Explain context where a key has different effects. Generate the panel, chapter references, and downloadable sheet from the same entries so they do not drift.

## Tutor and provider design

### Improve the teaching behavior and context

The default scripted response I tested did not explain the last failed command. It offered a nearby course extract. The UI does disclose scripted mode initially, but its continuing “local · in your browser” badge is not sufficiently explicit about whether a model is actually answering. Keep the status truthful throughout: scripted guide, named local model, or provider/model.

The current AgentBackend interface is a useful extension point. The bigger gap is the context contract. Send a bounded, structured snapshot with each question: lesson and skill, task goal, selected OS/shell, active sandbox identity, working directory, last relevant command, stdout/stderr/exit status, relevant file changes, and the learner's requested hint level. Include file content only when needed and deliberately selected or otherwise explicitly covered by the learner's sharing choice.

The normal tutor currently demonstrates in its own sandbox; the CLI agent can use the invoking playground. Make that distinction visible. A demonstration must not silently complete the learner's exercise. Prefer a copy of the relevant sandbox for demonstrations and make “try it yourself” easy.

Replace the universal long-answer recipe with modes: **Explain this error**, **Give me a small hint**, **Show an example**, and **Check my understanding**. Default to a short direct explanation and one useful next step. Do not demand a runnable example or a fresh search for every conversational turn. Retrieve course evidence when it helps, cite the actual sections used, and permit clearly labeled extensions beyond the course when appropriate.

Use a provider-independent evaluation set: wrong folder, spaces in filenames, cursor editing, an unsupported simulator command, ambiguous “it failed,” a frustrated learner, a mistaken premise, and hostile instructions inside a file. Evaluate accuracy, usefulness of the first step, unnecessary jargon, valid citations, and whether the learner can subsequently act unaided. Stronger models are a means to better help, not the outcome measure.

### Bring your own OpenAI or Anthropic key

The learner-facing flow should be simple:

1. Open tutor settings and choose the included guide, a local model, OpenAI, or Anthropic.
2. For a cloud provider, enter an API key. Explain briefly what is sent to the provider, how the course handles the credential, and that provider usage can cost money.
3. Choose a model from the checked-in provider catalog, maintained by a monthly pull-request bot. Allow an exact model ID for new or account-specific models. The browser does not discover models.
4. Show the active provider/model beside the conversation. Allow disconnect and immediate session cleanup.

Do not make cloud setup a condition of learning. Preserve the free browser course and optional local inference.

### Monthly model-catalog pull requests

The user's implementation decision is to discover models during maintenance, not in the browser. A monthly GitHub Actions workflow checks official provider model sources, updates a versioned JSON catalog, and opens or updates a reviewable pull request only when model data changes. The static site reads that catalog. Keep provenance, review dates, provider IDs, and compatibility information with it. Never bundle credentials or discover models with a learner's key.

Discovery and compatibility are separate. Public model sources describe a provider's offering, not the learner's account access. Mark new candidates for review rather than claiming every discovered model supports this tutor's tools. Let the learner enter an exact model ID when the monthly catalog lags or their account has a special model. Validate on the first requested interaction without automatically making paid probes across the list. Provider/API access errors must explain that the catalog does not guarantee account entitlement.

Do not invent pricing from model names or assume the list provides it. Display known provider-reported usage and identify estimates as estimates. Explain a removed/unavailable model and let the learner select another; do not silently substitute a more expensive one.

### Architecture decision

Keep the static adapter and GitHub Actions → GitHub Pages deployment. Implement optional direct browser connections to the selected provider. There is no project-operated backend or proxy. GitHub Actions builds assets; it must never inject a maintainer API key into those assets.

Both official TypeScript SDKs expose an explicit browser opt-in, disabled by default because of credential exposure. That permits this architecture; it does not make a browser a secret vault. The learner's key is necessarily accessible to the running client and must be sent to the chosen provider. A compromised page or sufficiently privileged browser extension can expose it. Keep the setup explanation brief and accurate. [OpenAI SDK browser configuration](https://github.com/openai/openai-node/blob/main/docs/configuration.md), [Anthropic SDK client](https://github.com/anthropics/anthropic-sdk-typescript/blob/main/src/client.ts)

During this audit, unauthenticated OPTIONS preflights to both model-list endpoints accepted the requested authentication headers with the GitHub Pages origin specified. This supports feasibility, but does not verify authenticated discovery, streaming, or a particular account's policy. Those are implementation acceptance checks, including checks from the deployed Pages origin. Provider or account restrictions must produce an honest unavailable state, not an attempt to bypass them through a public CORS proxy.

Recommended first implementation:

- Keep the supplied key in memory for the current page session; clear the form after connecting and drop credential references on disconnect/page teardown. Re-enter after a fresh load. Do not persist it in localStorage, sessionStorage, IndexedDB, cookies, or service-worker caches. Memory-only storage reduces persistence; it does not defeat malicious code running in the page.
- Tell the learner that requests go directly to their selected provider and which lesson/terminal context accompanies a question. “Your key never leaves your browser” would still be false. Never include the key in prompts, tool arguments/results, URLs, logs, analytics, share links, or course files.
- Keep provider endpoints fixed. Use the documented SDK browser opt-in and required provider headers; omit ambient browser credentials. Sanitize rendered model Markdown, restrict unnecessary third-party scripts, and use a static-compatible content-security policy. Review these controls with the actual model-download and asset-loading requirements.
- Offer restricted/project-specific keys and provider-side spending controls where supported. Apply per-turn output limits and a visible stop action. A browser-only budget counter is a convenience, not an enforceable account spending limit.
- Implement OpenAI Responses and Anthropic Messages adapters behind AgentBackend. Normalize streaming, tool calls/results, cancellation, errors, and usage. Update the existing prompt that currently asserts all inference runs in the browser.
- Retain bounded course-search and sandbox tools. Validate calls in code, identify the target sandbox, and keep the existing approval boundary for proposed execution. The provider adapter does not gain access to the host shell.
- Handle invalid/revoked keys, browser/CORS restrictions, no compatible models, pagination, 429/timeouts, disconnect during streaming, pending approvals, and provider/model switches. Scope model caches to the current connection and clear them on disconnect. Avoid automatic retry of an already-applied tool action.
- Do not charge for cloud-generated suggestions on every scroll. Use curated or cached suggestions by default, with any paid background behavior explicit.

The result remains a static website. The deliberate tradeoff is optional browser-side handling of a user-supplied key, with no bundled shared secret and no claim of server-grade credential isolation. If a provider connection is unavailable, the included guide and local model route remain usable.

## Illustration and visual teaching plan

Keep the crab's recognizable silhouette, personality, and material detail. Keep the garden as a place the learner returns to. Broaden the world: a sunny potting bench, a coastal workshop, a rain-lit greenhouse, a twilight observatory, a paper-and-ink study. Vary camera distance, page rhythm, texture, lighting, and negative space as well as color.

Allow cream, coral, teal, indigo, lavender, and daylight neutrals in chapter art. Preserve consistent functional colors for errors, selections, and success in the actual interface. A chapter's mood should not redefine what a warning means.

The current prompt restrictions explain much of the repetition. Remove the repeated “No blue, no purple” rule and replace palette policing with a small art-direction guide. OpenAI currently documents the requested GPT Image 2.5 Flare model; it is a suitable candidate to evaluate for this artwork. An explicit API workflow can request its documented model ID. This audit has not generated or compared new images. [GPT Image 2.5 Flare model documentation](https://developers.openai.com/api/docs/models/gpt-image-2.5-flare)

Use more visuals in three roles:

| Role                | Purpose                                                                                    | Format                                                                          |
| ------------------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| Rich scene          | Invite curiosity, establish a memorable place, connect a chapter's tasks                   | Detailed generated illustration; optional enlargement                           |
| Precise explanation | Show command tokens, folder relationships, streams, JSON paths, or local/remote boundaries | HTML/SVG with selectable text and a useful accessible description               |
| Visible action      | Show cursor movement, word removal, file changes, or data passing through stages           | Small controllable animation or stepper, with reduced-motion/static alternative |

Do not bake the only correct command, keyboard instruction, or critical label into raster art. Generated lettering can be wrong and small image text is hard to read on a phone. Keep exact instructional text in the page. Mobile needs purposeful crops or alternate diagrams, not just a smaller poster.

Initial visual inventory: command vs reply; command/argument/option; cursor and killed text; home/current/parent folders; quoted filename; copy vs move; redirection vs pipe; stdout vs stderr; JSON field path; shell vs child process; address vs port; local vs remote prompt. Each should answer a specific question beside the relevant exercise.

Pilot three art briefs before replacing the library:

1. **Hello workbench:** morning light, cream paper, green leaves, coral accents; the crab opens a small window onto a welcoming workspace. No embedded technical text. Leave room for the real terminal in the layout.
2. **Keyboard repair bench:** close-up composition, brass tools, indigo and apricot; the crab repairs a sentence. The live cursor/key overlays carry the actual instruction.
3. **Where am I?:** overhead garden paths with distinct landmarks and teal/clay tones. The exact directory labels and current-location marker remain live, accessible overlays.

Compare these in the actual lesson at desktop and phone sizes. Retain the complexity the user likes while checking that the learner can name what the image explains. Generate chapter by chapter only after the lesson structure is stable. Reserve image dimensions, use suitable responsive sources, lazy-load offscreen art, and measure loading rather than guessing a performance budget.

## Implementation sequence and acceptance gates

| Milestone                     | Concrete deliverable                                                                                                                      | Ready when                                                                                                                                                                                                                              |
| ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 0. Repair misleading behavior | Critical errata; input/output representation; first-exercise reference mappings; honest tutor state; remove beginner efficiency penalties | Copied examples run without output pollution; known real options are not labeled misconceptions; targeted regressions pass.                                                                                                             |
| 1. Prove the first 15 minutes | New opening, keyboard workshop, navigation mission, three visual pilots, contextual help                                                  | A first-time learner can start, edit, cancel, recover, and locate themselves without live coaching.                                                                                                                                     |
| 2. Build the tutor foundation | Learner-context contract, concise hint/error modes, direct browser provider adapters, in-memory keys, monthly catalog PR bot              | Monthly catalog updates create reviewable PRs; direct streaming works from GitHub Pages for supported accounts/browsers; storage/error/cancel/isolation checks pass; answers use the active exercise context; build stays fully static. |
| 3. Rewrite the guided course  | New sequence; all existing chapters edited or deliberately moved; practical editor/native bridge                                          | Every required exercise has taught prerequisites, verified examples, useful feedback, and a recovery path.                                                                                                                              |
| 4. Expand practical depth     | Modern-tool missions, reliable scripts, remote work, optional internals and field guide                                                   | Each addition solves a recognizable task and declares its environment; beginner navigation remains manageable.                                                                                                                          |
| 5. Refresh the visual library | Chapter-specific art and explanatory microvisuals; unified reference exports                                                              | Technical labels are correct, mobile readable, accessible alternatives present, and measured loading acceptable.                                                                                                                        |

Milestones 1 and 2 can proceed as separate workstreams once the context contract is agreed. Avoid a months-long all-at-once rewrite: the first release should make the opening materially better while retaining access to the existing course.

### Evaluation with real beginners

Run a small formative pilot with the intended learner and several other true beginners. Treat it as qualitative product evidence, not a statistically powered study. Include someone who uses Windows and someone who is uncomfortable with technical language.

Ask them to think aloud. Observe before explaining. Record where they pause, what they think a command will do, which text they try to type, how they ask for help, and whether they recover. Do not count a task as independently completed if a facilitator supplied the decisive next step.

Proposed targets to test and refine:

- First successful personal command within 30 seconds of choosing Start.
- Within the opening session: independently change a message, repair a typo, discard an unfinished line, and explain input versus output.
- After the navigation mission: identify the current folder, reach a requested folder, and recover from a wrong turn.
- In a later session: repeat a few gestures and complete a changed task. Looking up a key is allowed; aim for growing fluency, not a memory contest.
- In the native bridge: transfer a familiar task and explain which environment is active.
- After tutor help: complete a related step without simply copying its answer.

Measure confidence alongside performance. Ask “What would you try next?” and “What do you think changed?” A cheerful completion badge is not evidence that either answer is clear.

## Implementation map

These are the main existing seams to work through, not a requirement to rewrite the framework.

| Area                     | Current source                                                                                                                                                                                                                                                                               | Intended change                                                                                         |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Opening and lesson prose | [Hero.svelte](/Users/neo/repos/terminalvibes/src/lib/components/sections/Hero.svelte), Part1–Part14 in the same directory                                                                                                                                                                    | Action-first opening; shorter connected lessons; relocate optional depth.                               |
| Terminal interaction     | [TerminalPlayground.svelte](/Users/neo/repos/terminalvibes/src/lib/components/playground/TerminalPlayground.svelte:674)                                                                                                                                                                      | Separate line-editor behavior from panel UI; cursor-aware keys and completion; honest support labeling. |
| Global key handling      | [Search.svelte](/Users/neo/repos/terminalvibes/src/lib/components/layout/Search.svelte:92)                                                                                                                                                                                                   | Respect focused interactive controls and terminal-specific chords.                                      |
| Code and output          | [CodeBlock.svelte](/Users/neo/repos/terminalvibes/src/lib/components/ui/CodeBlock.svelte:34)                                                                                                                                                                                                 | Typed command/transcript model and input-only copying.                                                  |
| Practice and grading     | [scenarios.ts](/Users/neo/repos/terminalvibes/src/lib/playground/scenarios.ts), [ChallengeActivity.svelte](/Users/neo/repos/terminalvibes/src/lib/components/ui/ChallengeActivity.svelte:248), [first challenge](/Users/neo/repos/terminalvibes/src/lib/playground/challenges/part-01.ts:62) | Prerequisite-clean tasks; layered hints; outcome-based beginner assessment.                             |
| Contextual reference     | [exercise-commands.ts](/Users/neo/repos/terminalvibes/src/lib/playground/exercise-commands.ts:74), [cheat-sheet.ts](/Users/neo/repos/terminalvibes/src/lib/data/cheat-sheet.ts)                                                                                                              | Skill-based mappings and structured reference types; shared exports.                                    |
| Tutor                    | [types.ts](/Users/neo/repos/terminalvibes/src/lib/ai/types.ts), [runtime.svelte.ts](/Users/neo/repos/terminalvibes/src/lib/ai/runtime.svelte.ts), [tools.ts](/Users/neo/repos/terminalvibes/src/lib/ai/local/tools.ts)                                                                       | Learner context; provider-neutral teaching policy; streaming adapters and state transitions.            |
| Content infrastructure   | [course-map.ts](/Users/neo/repos/terminalvibes/src/lib/data/course-map.ts), [search-index.ts](/Users/neo/repos/terminalvibes/src/lib/data/search-index.ts)                                                                                                                                   | Stable skill/lesson IDs and prerequisites; keep search, citations, navigation, and progress aligned.    |
| Art                      | [IMAGE_PROMPTS.md](/Users/neo/repos/terminalvibes/docs/IMAGE_PROMPTS.md)                                                                                                                                                                                                                     | Varied chapter briefs, consistent character guide, and precise live diagrams.                           |

Extract reusable lesson blocks and metadata incrementally while rewriting the opening. A wholesale content-platform migration is unnecessary before proving the new teaching sequence. Preserve old section links through redirects/aliases where chapters move, and migrate stored progress conservatively rather than silently marking new skills complete.

The next implementation should be the complete opening slice: a first command, a repair, a keyboard gesture, a visible folder, an appropriate hint, and an independent retry. That slice will reveal whether the proposed prose, visual language, simulator, cheatsheet, and tutor work together for the person this course is meant to help.
