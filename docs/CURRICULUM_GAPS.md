# TerminalVibes Curriculum & Technical Gap Analysis

## Executive summary

The course’s core loop — **navigate → create → mutate safely → search/pipe → permissions → audit AI → script/chain** — is unusually coherent, and the playground already implements most of what Parts 1–6 teach. The highest-ROI gaps are not “add a new product,” but **close the taught-but-unpracticed loop** and **stop claiming mastery the sandbox never checks**.

**Top priorities (in order):**

1. **Part 6 scripts vs sandbox reality** — prose teaches `$1`, quoting, and `$(date +%F)`; `first-script` / checklist claim `$1`, but the drill never runs a script with arguments, and command substitution is explicitly unsupported (`shell-commands.ts`).
2. **Part 7 “biggest speed unlock” with zero LessonActivity** — `history`, `!!`, Ctrl+R are taught as career skills; playground has `history` + up-arrow but no Ctrl+R / history-expansion practice, and Part 7 has no scenario.
3. **Redirection asymmetry** — `>` / `>>` / `|` are drilled hard; `2>` / `2>&1` and `wc` are taught in Part 4.1–4.2 / cheat sheet but absent from every scenario check.
4. **Habit claims without practice checks** — Part 9 checklist requires TAB completion; Part 2.2 insists TAB is mandatory; playground _implements_ TAB (`TerminalPlayground.svelte`) but no scenario or activity forces it. Same pattern for `source ~/.bashrc` (taught + stubbed in `alias-workshop` notes, not checked).
5. **Agent approval gate under-leveraged as a lesson** — the product’s best AI-era teaching surface (gated `bash` in AgentPanel) is only loosely tied to Part 6; Parts 7–8 describe IDE/agent workflows the in-app agent already partially models.

---

## What the course covers well

- **Progressive skill stack with real stakes:** filesystem map (Part 2) → irreversible `rm` + echo-the-glob (Part 3) → compose small tools (Part 4) → decode the machine’s “no” (Part 5) → supervise AI (Part 6). Habits are named and repeated (`pwd`/`ls`/`cd`, ls-before-rm, build pipelines stage-by-stage).
- **Playground fidelity to the teaching subset:** `shell-commands.ts` deliberately supports quoting, `$VAR`/`$?`, globs, pipes, `> >> 2> <`, `&& || ;`, aliases, `chmod`, `find`/`grep`, scripts — and refuses loops/command substitution/background jobs with learner-friendly messages instead of half-broken behavior.
- **Scenario design as pedagogy:** 15 lesson scenarios (`scenarios.ts` / `lessonScenarioIds`) with goal checks that encode the habit (e.g. `audit-the-agent` fails if `rm -rf` appears in history; `glob-practice` requires `final.md` untouched; `exit-codes` requires `&&`).
- **Cheat sheet + Part 9 reference card** align with the taught surface (`src/lib/data/cheat-sheet.ts`, Part 9.2), including panic-button culture (Ctrl+C, `q`, echo-the-glob).
- **AI-era centerpiece is earned:** Part 6.1 audit routine + `audit-the-agent` scenario is the product’s unique value, and AgentPanel’s approval gate (`gate.ts` / `runtime.svelte.ts`) mirrors the lesson’s “never YOLO-approve” thesis.

---

## Technical gaps

### Sandbox / command coverage gaps

| Capability                                                                                                                                                                | Status in sandbox                                                  | Curriculum use                                                    | Gap                                                                                                                    |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| Core file/nav/text tools (`pwd` `ls` `cd` `mkdir` `touch` `cp` `mv` `rm` `cat` `head` `tail` `grep` `find` `cut` `sort` `uniq` `chmod` `alias` `which` `echo` `export` …) | Implemented (`BIN_COMMANDS` in `shell-engine.ts`)                  | Heavily taught + practiced                                        | None material                                                                                                          |
| Pipes / `>` / `>>` / `&&` `\|\|` `;` / globs / `$?`                                                                                                                       | Implemented                                                        | Parts 3–6 + scenarios                                             | Strong                                                                                                                 |
| `2>` / `2>&1` / stdin `<`                                                                                                                                                 | Implemented (`shell-commands.ts`)                                  | Part 4.1 teaches `2>`; cheat sheet lists it                       | **Supported but never scenario-checked**                                                                               |
| `wc` `tr` `tee` `xargs`                                                                                                                                                   | Implemented + `man` pages                                          | Part 4 prose (`wc` central; `xargs` shown once with `find`)       | **Available, undertheorized / unpracticed**                                                                            |
| `history`                                                                                                                                                                 | Implemented (session log)                                          | Part 7.2                                                          | **No LessonActivity; no `history \| grep` drill**                                                                      |
| `!!` / Ctrl+R / history expansion                                                                                                                                         | **Not implemented** (up-arrow only in `TerminalPlayground.svelte`) | Part 7.2 calls Ctrl+R “the crown jewel”; Part 9 card lists Ctrl+R | **Taught as essential; cannot practice in product**                                                                    |
| `$(...)` / backticks                                                                                                                                                      | Explicitly rejected (`SUBST_MSG`)                                  | Part 6.2 script examples use `$(date +%F)`                        | **Prose shows syntax the sandbox cannot run**                                                                          |
| Loops / `if`                                                                                                                                                              | Rejected (`KEYWORDS`)                                              | Correctly deferred                                                | OK as non-goal                                                                                                         |
| `sudo` `curl` `wget` `ssh` `nano`/`vim` `ps`/`top`/`kill`                                                                                                                 | Teaching stubs / canned network                                    | Parts 5.3, 6.1 red flags, Part 7 install tips                     | Intentionally simulated — fine if framed; learners can’t rehearse “download then skim” for `curl \| sh` inside sandbox |
| `tail -f`                                                                                                                                                                 | Not supported (man page admits real `tail -f`)                     | Cheat sheet + Part 7.4 / Part 9 card                              | Mentioned as everyday skill; sandbox can’t demo follow                                                                 |
| `man` / `help` / `--help`                                                                                                                                                 | Sandbox has rich `man` pages + `help`                              | Part 1.3                                                          | **Taught early; `first-steps` never requires a help lookup**                                                           |
| TAB completion                                                                                                                                                            | Implemented (commands + paths)                                     | Part 2.2 + checklist `navigate`                                   | **Works, but never required by a check**                                                                               |
| `source` / `.`                                                                                                                                                            | Implemented                                                        | Part 5.5; `alias-workshop` seed has `~/.bashrc`                   | PlaygroundNote asks to append aliases to `~/.bashrc`; **check only verifies in-session `alias`**                       |
| Script `$1` params                                                                                                                                                        | Engine supports `params` for script execution                      | Part 6.2 + checklist `script`                                     | **`first-script` never passes args; checklist overclaims**                                                             |
| Agent gated bash                                                                                                                                                          | Full approval UX                                                   | Part 6 thesis                                                     | **Underused as a structured lesson** (see mismatches)                                                                  |

**Evidence anchors**

- Unsupported features called out at top of `src/lib/playground/shell-commands.ts` (lines 4–8): no command substitution, loops, or background jobs.
- Part 6.2 CodeBlocks (`Part6.svelte`) show `BACKUP_NAME="…$(date +%F)"` while playground rejects `$(...)`.
- `STUBS` set (`nano` `vim` `sudo` `curl` `wget` `ssh` `ps` `top` `kill` …) vs red-flag teaching that assumes real network/admin consequences.

### Curriculum–product mismatches

1. **Checklist vs drills (Part 9.3 `SKILL_CHECKLIST`)**
   - `navigate` claims TAB completion mastery → no scenario verifies TAB use.
   - `script` claims “variables, and `$1`” → `first-script` builds a fixed-path backup with `echo >`/`>>`; no `./backup.sh notes`.
   - No checklist item for globs, `history`/Ctrl+R, or `2>` — even though Parts 3, 4.1, and 7 emphasize them.

2. **`alias-workshop` notes vs check** (`scenarios.ts` id `alias-workshop`; Part 5.5 PlaygroundNote)
   - Note: append favorite alias to `~/.bashrc` with `echo >>`.
   - Check: only `aliases.get('ll'|'proj')` and that those names appear in history — **persistence habit not verified**.

3. **Part 6 prose vs playground script path**
   - Ideal script in prose uses `cp -r`, variables, `$1`, and command substitution.
   - Hands-on path correctly simplifies to `echo`/`>>` (playground-friendly) but never reconnects to `$1` with a sandbox-legal date (`date` without `+%F` formatting, or a fixed string).

4. **Parts 7–8 are read-only chapters inside a practice product**
   - Zero `LessonActivity` / `scenarioId` bindings in `Part7.svelte` / `Part8.svelte`.
   - Part 7.2 sells history recall as “the single biggest speed unlock in this entire course” while the only related sandbox feature is `history` + ArrowUp.

5. **`cp -r` taught, barely practiced**
   - Part 3.1 and Part 6 scripts center recursive copy.
   - Scenarios that mutate files favor `mv`/`rm` (`tidy-up`, `glob-practice`, `capstone`); `audit-the-agent` uses plain `cp` of one file. Learners can finish the course without recursive copy muscle memory.

6. **Agent panel ↔ playground mutual exclusion**
   - `agent.e2e.ts` documents panels as mutually exclusive.
   - Curriculum tells learners to practice in the Terminal Playground _and_ to treat agent approval as the modern skill — but they cannot see both surfaces at once, and no Part walks “ask agent → approve/deny in AgentPanel” as a graded activity.

7. **Help literacy gap**
   - Part 1.3 + recurring “verify with `--help`” habit.
   - No scenario requires `man`/`help`/`ls --help` (sandbox `man` is unusually good teaching content going unused).

### UX/product gaps that block learning

1. **Parts without practice affordances:** After Part 6, motivation and “cockpit” identity (Part 7) and systems literacy (Part 8) have VibeBox prompts and diagrams but no sandbox goals — easy to skim and forget.
2. **Ctrl+R absence:** Calling it the crown jewel while the playground only has up-arrow creates a false sense that the product taught the skill.
3. **Command-substitution landmine:** A motivated learner copying Part 6.2’s “take two” script into the playground hits a wall message mid-chapter — undermines trust unless prose warns “sandbox can’t do `$(…)` yet; on your machine…”
4. **`tail -f` / multi-pane / Starship / VS Code:** Correctly out of sandbox scope, but Part 7 spends significant attention here with no “do this on your real machine” checklist item — soft accountability.
5. **Suggestions/agent grounding:** `reading-context.svelte.ts` + `suggestions.ts` ground chips in the current section — strong — but static starters skew to chmod/rm/pipes; Parts 7–8 and quoting/`2>` are underrepresented as suggestion targets.
6. **Capstone breadth vs depth:** `capstone` recombines globs + grep + script well, but skips pipes ranking, `2>`, PATH repair, audit refusal, and `&&` — the finale doesn’t stress-test the AI-era or chaining skills.

---

## Missed learning opportunities

### High priority (fits current parts with small additions)

1. **Script arguments (`$1`) as a required drill**
   - **Why:** Beginners and AI users constantly receive parameterized `.sh` files; checklist already claims this.
   - **Where:** Part 6.2 after the “take two” CodeBlock; extend `first-script` or add `script-args`.
   - **Playground:** Already supports script params — just seed `./backup.sh notes.txt` style goals without `$(...)`.
   - **Angle:** “Make the script reusable, then audit `./backup.sh secret-folder` the same way you’d audit an agent script.”

2. **Stderr capture (`2>`) micro-scenario**
   - **Why:** AI logs and failed commands dump to stderr; Part 4.1 already teaches it; sandbox already implements it.
   - **Where:** Part 4.1 or fold into `log-detective` / new `capture-errors`.
   - **Playground:** Supported today (`shell-commands.test.ts` covers `2>`).
   - **Angle:** “Separate the useful report from the scary red text — `ls good bad > out.txt 2> err.txt`.”

3. **`wc` as the pipeline’s scorekeeper**
   - **Why:** Part 4 introduces pipes with `wc -l`; scenarios jump to `cut|sort|uniq` without counting.
   - **Where:** Part 4.2–4.3; tweak `log-detective` goal to include `grep ERROR … | wc -l` or a one-stage warm-up.
   - **Playground:** Fully supported.
   - **Angle:** “Before ranking IPs, answer: how many ERROR lines?”

4. **Help-before-run habit in Part 1**
   - **Why:** Course thesis is verify-before-trust; Part 1.3 is the first chance.
   - **Where:** Extend `first-steps` or add a 30-second check: `man echo` / `help` / `ls --help`.
   - **Playground:** `man`/`help` already ship teaching pages.
   - **Angle:** “Before you trust anyone’s explanation of a flag — including ours — ask the machine.”

5. **Align `alias-workshop` check with `source` / `~/.bashrc`**
   - **Why:** Part 5.5’s whole point is persistence; current check stops at session aliases.
   - **Where:** Part 5.5 / `alias-workshop`.
   - **Playground:** `source` works (`shell-commands.test.ts`).
   - **Angle:** “Define → append → `source ~/.bashrc` → prove `ll` still works after `unalias`.”

6. **Wire AgentPanel approval into Part 6 as an explicit try-it**
   - **Why:** Product already pauses on bash (`interruptOn: ['bash']`); curriculum describes the moment but practices it only via a static `agent-plan.txt`.
   - **Where:** Part 6.1 after `audit-the-agent`.
   - **Playground/agent:** Gate + mock/local backends exist; e2e covers gated demos.
   - **Angle:** “Ask the tutor to tidy the sandbox; deny the destructive proposal; approve the backup.”

### Medium priority (natural new subsection or scenario)

7. **History search drill (Part 7.2)** — even without Ctrl+R: `history | grep mkdir`, re-run by number if/when supported, or document “up-arrow here; Ctrl+R on your machine” with a real-machine checkbox. Prefer implementing a minimal Ctrl+R later (stretch).

8. **Quoting / spaces-in-paths scenario (Part 2.2)** — prose warns about `cd My Projects`; seed a `"My Projects"` directory and require quoted `cd`/`ls`. Sandbox quoting already works.

9. **`cp -r` backup drill (Part 3.1 or 6.2)** — “copy the project tree before the agent rewrites it.” Sandbox supports `cp -r`.

10. **`find … | xargs` lite lab (Part 4.5)** — prose shows it; sandbox implements `xargs`; optional after `find-files` with a clear “prefer `grep -rn` for everyday search” moral (already in prose).

11. **Export / env hygiene (Part 5.4)** — `export`/`env`/`unset` work; no scenario. Angle: “Agent says set `API_KEY`; show it with `env | grep`, then unset.”

12. **Part 8 “Ctrl+C is SIGINT” with `sleep`** — sandbox has `sleep`; a tiny “start `sleep 30`, cancel with Ctrl+C” demo would ground 8.1 — **if** the playground input path actually delivers SIGINT to running commands (verify before promising; otherwise keep as real-machine lab).

### Lower priority / stretch

13. **Command substitution literacy** — teach reading `$(…)` in agent scripts without implementing full substitution; or implement a minimal `$(date)` for pedagogy (L effort).
14. **`tee` for “watch and save”** — useful with agents logging output; supported, unused.
15. **`tr` for quick cleanup** — supported; niche for this course.
16. **Pager fluency beyond `q`** — `less`/`man` exist; no drill for searching inside a pager.
17. **Multi-agent / worktree mental model (Part 7.4)** — valuable, but needs real machine or a narrative sim, not VFS.

---

## Important terminal topics currently missing

| Topic                                                   | Why essential                                                | Currently                                                 | Suggested placement                                   |
| ------------------------------------------------------- | ------------------------------------------------------------ | --------------------------------------------------------- | ----------------------------------------------------- |
| Quoting & spaces in paths                               | #1 real-world `cd`/`rm` footgun; agents quote inconsistently | Tip in Part 2.2 only; no drill                            | Part 2.2 scenario                                     |
| Stderr vs stdout (`2>`, `2>&1`)                         | Debugging AI/tool failures                                   | Taught Part 4.1; unpracticed                              | Part 4.1 micro-lab                                    |
| Counting with `wc`                                      | Pipeline sanity check                                        | Taught; not in scenarios                                  | Part 4.2–4.3                                          |
| Script arguments `$1`                                   | Reuse + auditing agent scripts                               | Taught; checklist claims; unpracticed                     | Part 6.2 scenario                                     |
| Looking up help on the machine                          | Course thesis                                                | Part 1.3 prose only                                       | Part 1 / `first-steps`                                |
| History recall (Ctrl+R / `history \| grep`)             | Daily speed + incident review                                | Part 7.2 prose; partial sandbox                           | Part 7.2 activity                                     |
| Reading `$(…)` / nesting in AI scripts                  | Agents emit these constantly                                 | Shown in Part 6; sandbox rejects                          | Part 6.2 callout + optional real-machine              |
| `source` config reload                                  | Makes aliases/`PATH` changes real                            | Prose + incomplete workshop                               | Part 5.5                                              |
| Recursive copy `cp -r` muscle memory                    | Pre-change backups                                           | Taught; weakly practiced                                  | Part 3 or 6                                           |
| Dry-run / preview flags (`--dry-run`, `echo` rehearsal) | AI approval literacy                                         | Mentions in Part 6.1; not systematized beyond globs       | Part 6.1 checklist row                                |
| Exit-code reading in agent output                       | Part 6.3 / 7.3 claim                                         | `exit-codes` scenario good; not tied to agent terminal UI | Part 6.3 ↔ AgentPanel                                 |
| Files with leading dashes / `--`                        | Classic `rm`/`cd` trap                                       | Absent                                                    | Stretch in Part 3                                     |
| Processes (`ps`/`kill`/job control)                     | Unstick machines                                             | Stubs only                                                | Out of scope / brief panic note                       |
| Networking (`curl` real)                                | Install scripts                                              | Stub + red-flag theory                                    | Keep stub; real-machine Starship audit already hinted |
| Git                                                     | Everyday for this audience                                   | Alias example only; GitVibes handoff                      | Explicit non-goal                                     |
| Ownership/`chown`, octal `chmod` deep                   | Real sysadmin                                                | Symbolic `chmod +x` focus                                 | Stay symbolic; optional cheat-sheet note              |
| Shell differences bash vs zsh                           | macOS default zsh                                            | Mentioned for config filenames                            | Keep light                                            |

---

## Scenario / exercise gaps

**Existing lesson scenarios → skills (inventory condensed)**

| scenarioId          | Part hook | Skills exercised                    |
| ------------------- | --------- | ----------------------------------- |
| `first-steps`       | 1.2       | `whoami` `pwd` `date` `echo`        |
| `navigation`        | 2.3       | `cd` `ls` `ls -a` `cat` hidden dirs |
| `workspace-setup`   | 2.4–2.5   | `mkdir -p` `touch` `ls`             |
| `tidy-up`           | 3.3       | `mv` `rm` `mkdir` (not `cp`)        |
| `glob-practice`     | 3.4       | `*` `?` echo-before-rm              |
| `log-detective`     | 4.3       | `grep` `>` `head`/`tail`            |
| `pipeline-practice` | 4.4       | `cut\|sort\|uniq\|sort`             |
| `find-files`        | 4.5       | `find` `grep -rn`                   |
| `fix-permissions`   | 5.2       | `ls -l` `chmod +x` `./`             |
| `path-repair`       | 5.4       | `$PATH` `which` `find` path run     |
| `alias-workshop`    | 5.5       | `alias` (session only)              |
| `audit-the-agent`   | 6.1       | Refuse `rm -rf`; run safe cmds      |
| `first-script`      | 6.2       | shebang via echo; `chmod`; run      |
| `exit-codes`        | 6.3       | `$?` `&&` `\|\|`                    |
| `capstone`          | 9.3       | globs + grep + script combo         |

**Weak / missing drills relative to teaching weight**

- Over-represented: navigate/create, glob+rm, grep+redirect, pipeline ranking, chmod+x, audit refusal, basic script, `&&`.
- Under-represented vs prose: **`2>`**, **`wc`**, **`$1`**, **`source`**, **`cp -r`**, **help/`man`**, **quoting**, **history**, **TAB as required habit**, **agent live gate**.
- Capstone does not include: audit, chaining, PATH, or stderr — consider a “capstone+” variant or swap one leg for an audit/`&&` beat.
- Parts **7 and 8: zero scenarios** despite high conceptual load.

**PlaygroundNote vs check inconsistencies to fix editorially**

- `alias-workshop` (append to `~/.bashrc` claimed, not checked).
- Part 9 checklist `script` / `navigate` (claims beyond checks).

---

## Recommended additions (ranked)

1. **Fix Part 6 script story for the sandbox** — warn that `$(…)` isn’t supported here; add `$1` practice with fixed backup names. **Effort: S. ROI: very high** (stops false mastery + landmine).
2. **Add `2>` (and optionally `wc -l`) to Part 4 practice** — extend `log-detective` or tiny new scenario. **Effort: S. ROI: high**.
3. **Tighten `alias-workshop` to `echo >>` + `source`** — match Part 5.5 teaching. **Effort: S. ROI: high**.
4. **Require a help lookup in Part 1** — `man`/`help` in `first-steps` check. **Effort: S. ROI: high** (thesis reinforcement).
5. **Part 7.2 LessonActivity: history archaeology** — `history | grep …` on a seeded historyLog (may need seed API for prior commands). **Effort: M. ROI: high**.
6. **Spaces-and-quotes scenario in Part 2** — one directory name with a space. **Effort: S. ROI: high**.
7. **Explicit AgentPanel try-it in Part 6.1** — scripted prompts + approve/deny rubric (mock backend already demos pipes/gate). **Effort: M. ROI: very high** (uses unique product surface).
8. **`cp -r` backup beat** in Part 3 or capstone. **Effort: S. ROI: medium**.
9. **Align Part 9 checklist with real checks** — drop unearned claims or add drills. **Effort: S. ROI: medium** (credibility).
10. **Optional Ctrl+R in playground** — only if product wants to match Part 7 promises. **Effort: L. ROI: medium** (great UX; not required if honest “real machine” lab exists).
11. **Minimal `$(date …)` or teach-around callout polish** across all script examples. **Effort: S–M. ROI: medium**.
12. **Part 8 SIGINT live demo** — only if Ctrl+C interrupts `sleep`. **Effort: M. ROI: lower** (enrichment).

---

## Explicit non-goals

Stay coherent as a **beginner → AI-command-supervisor** course, not a sysadmin or Git academy:

- Deep Git / branching / rebasing (point to GitVibes; keep `gs` alias as a wink only).
- Full job control, daemons, systemd, networking servers.
- Real `sudo` power inside the sandbox.
- Implementing full bash (`for`/`if`, arrays, advanced expansion) — current “friendly refusal” is the right product posture.
- Turning Part 8 PTY theory into a mandatory lab — keep it enrichment.
- OS-specific GUI terminal tourism beyond Hero setup tabs.
- Replacing Bandit / OverTheWire-style wargames — Part 9 already points outward.

---

## Appendix: inventory

### Commands/concepts taught by part

| Part | Title                     | Core concepts / commands                                                                                                                          |
| ---- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Hero | Product framing           | Terminal vs shell; OS setup; prompt anatomy; playground/cheat sheet CTAs                                                                          |
| 1    | First Contact             | Open terminal; `whoami` `pwd` `date` `echo` `clear`; `--help` `man` `tldr`; errors as feedback                                                    |
| 2    | Moving Around             | `pwd` `ls` `-a` `-l`; absolute/relative/`~`/`.`/`..`; TAB; quoting spaces; `cd` `cd -`; `mkdir` `-p` `touch`; `cat` `less` `head` `tail`; `ls -R` |
| 3    | Copy/Move/Delete          | `cp` `cp -r`; `mv`; `rm` `-r` `-f`; `rmdir`; ls-before-rm; globs `*` `?` `[]`; echo-the-glob                                                      |
| 4    | Text & Pipes              | `>` `>>` `2>` `<`; `\|`; `grep` flags; `wc` `sort` `uniq` `cut`; `find` + quote patterns; `xargs` cameo                                           |
| 5    | Permissions & Environment | `ls -l` bits; `chmod +x` / symbolic; `sudo` caution; `echo $VAR` `export` `env`; `$PATH` `which`; aliases; `source` `~/.bashrc`/`~/.zshrc`        |
| 6    | AI Era                    | Four-step audit; red flags (`rm -rf` `sudo` `curl\|bash`); scripts/shebang/`$1`; `$?` `&&` `\|\|` `;`                                             |
| 7    | Cockpit                   | Themes/fonts/Starship/`PS1`; `history` `!!` Ctrl+R; VS Code terminal; panes/`tail -f`                                                             |
| 8    | Under the Hood            | tty/PTY/line discipline; Ctrl+C/SIGINT; OSC/agent markers; advanced script/agent pipeline ideas                                                   |
| 9    | Conclusion                | Mindset; quick reference; capstone; self checklist; further learning                                                                              |

### Scenarios list and skills they exercise

See table in **Scenario / exercise gaps** above (`src/lib/playground/scenarios.ts`, `lessonScenarioIds`).

### Notable commands mentioned in prose but not practiced

| Mentioned in           | Command / concept          | In sandbox?                 | In a lesson scenario check? |
| ---------------------- | -------------------------- | --------------------------- | --------------------------- |
| Part 1.3               | `man` / `--help` / `tldr`  | `man`/`help` yes; `tldr` no | No                          |
| Part 2.2               | TAB completion             | Yes (UI)                    | No                          |
| Part 2.2               | Quotes around spaces       | Yes                         | No                          |
| Part 2.3               | `cd -`                     | (engine-dependent; taught)  | No                          |
| Part 3.1               | `cp -r`                    | Yes                         | No dedicated                |
| Part 3.3               | `rmdir`                    | Yes                         | No                          |
| Part 4.1               | `2>` / `2>&1`              | Yes                         | No                          |
| Part 4.2–4.4           | `wc`                       | Yes                         | No                          |
| Part 4.5               | `xargs`                    | Yes                         | No                          |
| Part 5.4               | `export` / `env` / `unset` | Yes                         | Partial (`echo $PATH` only) |
| Part 5.5               | `source ~/.bashrc`         | Yes                         | No (note only)              |
| Part 6.2               | `$1` / `$(date +%F)`       | `$1` yes; `$(…)` **no**     | No                          |
| Part 7.2               | `!!` / Ctrl+R              | **No**                      | No                          |
| Part 7.2               | `history \| grep`          | `history` yes               | No                          |
| Part 7.4 / cheat sheet | `tail -f`                  | **No**                      | No                          |
| Part 8 / cheat sheet   | Ctrl+C interrupt semantics | Partial (line cancel)       | No LessonActivity           |
| Cheat sheet Panic      | `reset` `:q!` Ctrl+D       | Mostly N/A / stubs          | No                          |

### Product surfaces that shape practice (for editors)

- Lesson embedding: `LessonActivity` + `PlaygroundNote` in Parts 1–6, 9 (`scenarioId` props).
- Free playground: `TerminalPlayground.svelte` (TAB, ArrowUp, scenario dropdown, goal checks, RichHint).
- Reference: `CheatSheet.svelte` + `src/lib/data/cheat-sheet.ts` + Part 9.2 card.
- Progress: Part 9.3 `SKILL_CHECKLIST` (self-attested, not auto-linked to scenario completion).
- Agent: `AgentPanel.svelte` + gated `bash` tool + `search_course` + contextual suggestions (`suggestions.ts`, `reading-context.svelte.ts`).
- E2E intent signal: `src/routes/agent.e2e.ts` (panel exclusivity, gated demo flow, contextual suggestions).
