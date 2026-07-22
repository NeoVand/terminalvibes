# TerminalVibes Content-Coverage Gaps

_Audited 2026-07-21, against the current 14-part course. This is the **topic-coverage** axis:
commands and concepts the course never teaches. It complements `CURRICULUM_GAPS.md`, which
audited the taught-but-unpracticed axis in the 9-part era (most of its recommendations —
`capture-errors`, `script-args`, `quoting`, `history-recall`, `count-lines`, `help-lookup` —
have since shipped as scenarios)._

Each entry was verified absent from every section source before listing. Placement suggestions
reference existing sections so an entry can be picked up as a self-contained task.

---

## Tier 1 — real gaps worth a subsection or lesson

| Gap                                          | Why it matters                                                                                                                                                                                                                               | Suggested placement                                                                                                                                        | Effort |
| -------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| **`scp` / `rsync`**                          | 9.5 gets the learner _onto_ a server and never moves a file to or from it — the single most common next question after a first `ssh`. `rsync -avz` is also a staple of agent-proposed deploy commands.                                       | New half-section after 9.5, or grow 9.5 into "A Door to Another Machine — and a Truck". Sandbox: real-machine lab (network stubs already exist for `ssh`). | M      |
| **Here-docs (`cat <<EOF > file`)**           | Coding agents write files this way _constantly_ — it may be the most common multi-line pattern a learner will be asked to approve, and the course's audit method never shows one. Also the natural completion of Part 4's redirection story. | Part 6.1 (agents write scripts) or Part 4.1 callout + an audit example in Part 11.                                                                         | S–M    |
| **Readline line-editing (`Ctrl+A/E/U/W/K`)** | 12.2 teaches recall (`Ctrl+R`, `!!`) but not editing the recalled line — half of the "watch someone fluent" speed story. `kill = ^U` already appears in 13.1's `stty` output with no forward reference.                                      | New card grid in 12.2 beside the recall cards.                                                                                                             | S      |
| **A five-line `nano` lesson**                | The course only teaches how to _exit_ editors. Combined with 9.5, "edit a config on the server" is a dead end — `nano file`, arrows, `Ctrl+O`, `Ctrl+X` closes it. Deliberately tiny; vim stays exit-only.                                   | Part 2.5 callout (it already teaches the escape hatches) or 12.3.                                                                                          | S      |

## Tier 2 — callout-sized gaps

| Gap                                                         | Why                                                                                                                                                                                             | Placement                                                         | Effort |
| ----------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- | ------ |
| **Brace expansion (`mkdir -p src/{components,lib}`)**       | Agents emit this shape constantly; a learner who just mastered globs will misread it as a pattern match (it isn't — it expands unconditionally).                                                | Part 2.4 (mkdir) or 3.4 (one "not a glob" callout).               | S      |
| **`tee`**                                                   | "See it _and_ save it" — completes the redirection family, and pairs naturally with watching agent output while keeping a receipt. Already implemented in the sandbox, never taught.            | Part 4.1, one code block.                                         | S      |
| **The actual `PATH` append line (`export PATH="$PATH:…"`)** | 5.4 explains `PATH` and 5.5 teaches the config file, but the exact line every installer tells you to add is never shown. Learners will paste it from a worse source.                            | Part 5.5, one code block + why `$PATH` appears on the right side. | S      |
| **`for` loop reading literacy**                             | 13.2 teaches `while read`; agents more often emit `for f in *.txt; do …; done`. One reading-level example (not a writing lesson) closes it.                                                     | 13.2, beside the `while read` explainer.                          | S      |
| **Name `nohup` (or `disown`)**                              | 8.4 says a background job dies with the window "unless you take extra steps" — and never names the steps. One sentence: `nohup cmd &`, or "this is what tmux is for" with a pointer to 12.4.    | Part 8.4.                                                         | S      |
| **`top`/`htop` as the live view**                           | `ps` is taught as a snapshot; `htop` appears only as an install example in 5.3. One line: "the live version of this table is `top`, press `q` to leave."                                        | Part 8.1 callout.                                                 | S      |
| **`cron` shape callout**                                    | `man 5 crontab` is used as the man-sections example in 1.3, then scheduling never returns. A recognition-level callout (five fields, then a command; `crontab -e`) with a real-machine framing. | Part 6 outro or 13.2 (automation).                                | S      |
| **Checksums (`shasum -a 256`)**                             | The `curl \| bash` discussion in 11.1 explains trusting the source; verifying a download is the natural companion habit and one command.                                                        | Part 11.1 red-flag entry addendum, or 10.1.                       | S      |
| **Leading-dash filenames and `--`**                         | The classic trap (`rm -file` reads as flags); `--` is the standard escape. Cheap insurance in the deletion part.                                                                                | Part 3.3 callout.                                                 | S      |
| **`chown` recognition**                                     | Never mentioned; "wrong owner" errors appear the first time a learner touches Docker volumes or a server. Recognition-level only — symbolic `chmod` stays the focus.                            | Part 5.1 or 5.3, one sentence + cheat-sheet row.                  | S      |
| **Clipboard bridges (`pbcopy` / `xclip` / `clip.exe`)**     | Everyday quality-of-life ("get this output into a chat/AI"), and inherently cross-platform — which is this course's strength.                                                                   | Part 12.1 card.                                                   | S      |

## Tier 3 — deliberate exclusions (reaffirmed, keep out)

- **PowerShell as a language** — well-signposted "different language" framing already; keep.
- **Deep git** — GitVibes owns it; the `gs` alias wink is the right amount.
- **`if`/conditionals, arrays, advanced bash** — 13.2's strict-mode preamble is the ceiling; the "friendly refusal" posture in the sandbox is right.
- **vim beyond `:q!`** — exit-only remains correct for this audience.
- **`tr`, process substitution `<(…)`, `awk` beyond field-printing** — noise for this audience.
- **systemd/services/daemons, firewalls, DNS tooling** — beyond scope.

## Maintenance risks (not gaps, but debts)

1. **Dated references need a review cadence.** macOS 26 Tahoe, Ghostty 1.3, Warp's pricing posture, WSL-open-source, Windows `sudo`, the 2025–26 incident links, Stack Overflow 2025 survey numbers. Recommend a `last reviewed:` stamp per part and a twice-yearly sweep.
2. **Sandbox honesty notes** — the `$(…)` teach-around callout in 6.1 is the model; any new Tier 1/2 content should say up front when it's a real-machine lab.
3. **Cheat sheet parity** — every Tier 1/2 addition needs its cheat-sheet row and search-index entry, plus `npm run build:timeline` / `build:index` regeneration (see repo memory: chip & CourseLink conventions).
