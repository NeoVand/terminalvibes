# TerminalVibes — Port Spec (from GitVibes)

TerminalVibes is the sister site of GitVibes: a free, interactive, single-page course
that teaches **the terminal (bash) to complete novices** on macOS, Linux, and Windows
(via WSL / Git Bash). Same pedagogy, same layout, same component library — new subject,
new palette (green & brown instead of blue & purple), new playground engine (a virtual
filesystem + bash interpreter instead of isomorphic-git).

- **Name:** TerminalVibes
- **Tagline:** "The Terminal for Vibe Coders"
- **One-liner:** Learn the command line as your home base for AI-assisted coding —
  read, verify, and run shell commands with confidence.
- **Canonical URL:** https://neovand.github.io/terminalvibes/
- **Repo:** terminalvibes
- **Persona / author voice:** identical to GitVibes. Friendly, precise, safety-first.
  The reader is a "vibe coder": they build with AI assistants, and the AI constantly
  proposes shell commands they can't yet read. This course fixes that.
- **Windows stance:** bash-first. Windows readers are told up front to use **WSL**
  (recommended) or **Git Bash** (lighter). PowerShell/cmd differences get short
  callouts where relevant (e.g. `dir` vs `ls`), never full parallel tracks.

## Palette (green & brown)

Defined in `src/routes/layout.css`. Semantics unchanged; hues swapped:
primary indigo→**forest green**, vibe purple→**warm brown/tan**, playground pink→
**amber/bark**. Terminal is classic green-on-dark in dark mode, pale sage in light.
Callout colors (note/tip/warning/caution) keep their blue/sky/amber/red semantics.

## Curriculum (sidebar ids must match exactly)

Section anchor ids follow GitVibes conventions: `section-<part>-<n>`, playground
scenarios are kebab-case ids with `isPlayground: true` nav entries.

### Hero / Introduction (`hero`)

- `section-intro-what` — What Is the Terminal? (terminal vs shell vs console; why it
  survived 50 years; why AI coding makes it MORE relevant, not less)
- `section-intro-history` — A Brief History (Unix 1969, Thompson & Ritchie, Bourne
  shell → bash 1989 → zsh default on macOS; "bash-compatible" is the lingua franca)
- `section-intro-shells` — Your Machine's Terminal (macOS Terminal.app/iTerm2 & zsh≈bash;
  Linux distros; Windows: WSL recommended, Git Bash lighter, Windows Terminal app;
  PowerShell is a different language — we teach bash)
- `section-intro-anatomy` — Anatomy of a Prompt (`user@host:~/projects$ `), the cursor,
  where you type, Enter runs it, up-arrow recalls

### Part 1 — First Contact

- `section-1-1` — Opening Your Terminal (per-OS, keyboard shortcuts, "it's just an app")
- `section-1-2` — Your First Commands (`whoami`, `echo`, `date`, `clear`; nothing you
  type here can break anything — commands only act when you press Enter)
- **PG `first-steps`** — "Say hello to the machine" (echo/whoami/pwd/date)
- `section-1-3` — Getting Help (`--help`, `man`, `q` to quit a pager, tldr pages;
  ask your AI to explain a command — then verify with --help)

### Part 2 — Moving Around

- `section-2-1` — Where Am I? (`pwd`, `ls`, `ls -a` hidden dotfiles, `ls -l` preview)
- `section-2-2` — Paths (absolute vs relative, `/`, `~`, `.`, `..`; TAB completion is
  not optional — it prevents typos)
- `section-2-3` — Changing Directories (`cd`, `cd ..`, `cd ~`, `cd -`)
- **PG `navigation`** — "Find the lost API key" (treasure hunt through nested dirs)
- `section-2-4` — Making Things (`mkdir`, `mkdir -p`, `touch`)
- `section-2-5` — Looking Inside Files (`cat`, `less`, `head`, `tail`, `tail -f` mention)
- **PG `workspace-setup`** — "Build your project skeleton" (mkdir -p + touch a layout)

### Part 3 — Copy, Move, Delete

- `section-3-1` — Copying (`cp`, `cp -r`; trailing-slash gotchas kept simple)
- `section-3-2` — Moving & Renaming (`mv` is both; mv overwrite danger, `-i`)
- `section-3-3` — Deleting (THE safety lesson: `rm` has **no trash can**; `rm -r`,
  `rm -f`, why `rm -rf` + wildcards + wrong cwd = disaster; `ls` first, then `rm`)
- **PG `tidy-up`** — "Clean the downloads mess" (inspect, mkdir, mv into folders, rm junk)
- `section-3-4` — Wildcards (`*`, `?`, `[abc]`; "echo the glob first" habit)
- **PG `glob-practice`** — "Select exactly the right files" (glob targeting)

### Part 4 — Text & Pipes (the superpower chapter)

- `section-4-1` — Redirection (`>`, `>>`, `2>`, `<`; > truncates! )
- `section-4-2` — Pipes (`|`; small tools composed; the Unix philosophy)
- `section-4-3` — Searching Text (`grep`, `-i -n -r -v -c`; grep through logs & code)
- **PG `log-detective`** — "Find the crash in server.log" (grep/pipe hunt)
- `section-4-4` — Counting & Shaping (`wc`, `sort`, `uniq`, `cut`; sort|uniq -c|sort -n)
- **PG `pipeline-practice`** — "Top visitors from access.log" (build a real pipeline)
- `section-4-5` — Finding Files (`find . -name -type`; find vs grep distinction)
- **PG `find-files`** — "Hunt down every TODO" (find + grep combo)

### Part 5 — Permissions & Environment

- `section-5-1` — Reading `ls -l` (rwx / user group other; the 10-char string decoded)
- `section-5-2` — chmod (`+x` to run a script; octal 755/644 as recipes)
- **PG `fix-permissions`** — "The script won't run" (chmod +x, ./)
- `section-5-3` — sudo (respect it; when it's needed; never `sudo` a command you
  don't understand — especially one an AI wrote)
- `section-5-4` — Environment Variables (`echo $HOME`, `export`, `PATH` and
  "command not found" demystified, `which`)
- **PG `path-repair`** — "command not found" (inspect PATH, find the tool, run it)
- `section-5-5` — Your Shell Config (`.bashrc`/`.zshrc`, `alias`, `source`)
- **PG `alias-workshop`** — "Make your own shortcuts" (alias + use it)

### Part 6 — Terminal for the AI Era (the differentiator chapter)

- `section-6-1` — Read Before You Run (auditing AI-suggested commands: identify the
  command, its flags, its targets; `echo` it first; `--dry-run`/`-n`; explainshell)
- **PG `audit-the-agent`** — "The agent wants to run 3 commands" (inspect, defuse the
  dangerous one, run the safe ones)
- `section-6-2` — Your First Script (`#!/usr/bin/env bash`, chmod +x, `./`, variables,
  `$1`; scripts are saved commands)
- **PG `first-script`** — "Automate the backup" (build script via echo >>, run it)
- `section-6-3` — Exit Codes & Chaining (`$?`, 0 = success, `&&`, `||`, `;`;
  why `cd /tmp && rm -rf *` chained wrongly is a horror story)
- **PG `exit-codes`** — "Only deploy when tests pass" (&&/|| logic)

### Part 7 — Your Cockpit

- `section-7-1` — Make It Yours (colors/themes: Terminal.app profiles, iTerm2,
  Windows Terminal, GNOME; prompt customization taste of PS1 / starship)
- `section-7-2` — History Superpowers (up-arrow, `history`, `!!`, `sudo !!`, Ctrl-R)
- `section-7-3` — Terminal in VS Code (integrated terminal, ⌃`, panel vs editor;
  this is where vibe coders live)
- `section-7-4` — Many Terminals at Once (tabs, splits; tmux exists, one-liner intro)

### Part 8 — Conclusion

- `section-8-1` — The Command-Line Mindset (compose small tools; read before running;
  the terminal is the AI-native interface)
- `section-8-2` — Quick Reference (dense table like GitVibes 8.2)
- `section-8-3` — Final Challenge
- **PG `capstone`** — "One messy home folder" (navigate + organize + grep + script:
  everything combined)
- `section-8-4` — Keep Learning (The Linux Command Line (free book), OverTheWire
  Bandit, explainshell.com, tldr pages, man pages)

15 playground scenarios total.

## Engine contract (`src/lib/playground/`)

Old git files are replaced by:

- `shell-engine.ts` — `ShellEngine` class: in-memory VFS (dirs/files, mode bits,
  mtime), cwd, env (`HOME=/home/vibe`, `USER=vibe`, `PATH`), aliases, `$?` last
  exit code. Seed type `FsSeed { files: Record<string,string>; executables?: string[];
cwd?: string; env?: Record<string,string> }`. Paths in seeds are absolute or
  `~`-relative. `reset(seed)` rebuilds from scratch. Helper API used by scenario
  checks: `exists(path)`, `isDir(path)`, `readFile(path)`, `listDir(path)`,
  `isExecutable(path)`, `resolve(path)` (→ absolute), `cwd`, `env`, `aliases`,
  `lastExitCode`, `historyLog` (commands run).
- `shell-commands.ts` — `runShellCommand(engine, input): Promise<CommandResult>`
  with `CommandResult { output: string; error?: boolean; colored?: boolean }`.
  Output `'__CLEAR__'` clears the terminal (for `clear`). Colored output is
  HTML with pre-escaped content styled via the CSS variables
  (`--color-terminal-*`, `--color-diff-*`) exactly like GitVibes' colorizers.
- `fs-tree.ts` — `buildFsTree(engine): string` returns a mermaid `flowchart TD`
  of the filesystem rooted at `~` (dirs as rounded nodes, files as leaf nodes,
  cwd highlighted, executables marked `*`). Replaces `git-graph.ts`.
- `scenarios.ts` — same `PlaygroundScenario` interface as GitVibes but with
  `seed?: FsSeed`, `check?: (engine: ShellEngine) => Promise<boolean>`.
- `share.ts` — unchanged mechanism (`#pg=` links, replay).

Supported commands (each with helpful, teaching error messages):
`pwd ls cd mkdir touch cat less more head tail wc grep sort uniq cut tr echo printf
cp mv rm rmdir find which whoami date clear help man history env export unset alias
unalias chmod cal df du file stat basename dirname seq tee xargs sleep true false
exit type source bash sh open nano vim sudo curl ssh` — the last several are
"teaching stubs" (e.g. `nano` explains this playground has no full-screen editor and
suggests `echo >>`; `sudo` explains why it's not available in the sandbox; `curl`
returns a canned response). Parser supports: quoting (`"` `'`), `$VAR` and `~`
expansion, globs (`*` `?` `[...]`), pipes `|`, redirection `> >> 2> <`, chaining
`&& || ;`, comments `#`. Not supported (with friendly messages): command
substitution, subshells, background `&`, loops/conditionals typed interactively
(scripts run via `bash script.sh` support a small subset: comments, echo, plain
commands, `$1`, variables).

`run-tests`-style scenario verbs from GitVibes are not needed; `./script.sh`
execution IS supported when the file is executable (runs the script subset).

## Images

All banner/illustration images live at `static/images/<name>.webp` and are
GENERATED BY THE USER from prompts in `docs/IMAGE_PROMPTS.md` (same pipeline:
drop PNG → `node scripts/optimize-images.mjs`). Sections reference the new names
now; 404s in the draft are expected until generation. Keep the GitVibes prompt
style: whimsical, cozy, consistent illustrated world — but themed around
terminals, shells (hermit crabs/nautilus as shell mascot is welcome), green
forests and warm brown wood instead of blue/purple space.

## What stays identical

Layout components (Header/Sidebar/CheatSheet/Search/PlaygroundPanel), ui
components (Callout, CodeBlock, SectionHeader, VibeBox, ExpandableImage,
MermaidDiagram, LessonActivity, PlaygroundNote), progress.ts (localStorage,
spaced-repetition nudge), theme.ts, service worker, PDF cheat sheet script,
GH Pages deploy. Only strings/ids/colors/content change.
