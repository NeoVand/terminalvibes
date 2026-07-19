# TerminalVibes Expansion — The Power Tools Band

_Planned 2026-07-19. Supersedes the "explicit non-goals" list in CURRICULUM_GAPS.md for
processes, networking, and sed — the course is growing from "beginner → AI-command-supervisor"
into a complete, friendly home for learning the terminal._

## The idea in one paragraph

Parts 1–6 are a tight, proven arc that ends at the course's signature move: auditing AI-proposed
commands. We keep that arc untouched and insert a four-part **Power Tools band** right after it —
**Text Surgery (sed & awk)**, **Processes & Ports**, **Talking to the Network**, and **The
Toolshed** — each framed through the same AI-era lens ("agents propose these commands daily; now
you can read them, verify them, and fix things when they go wrong"). The Cockpit, Under the Hood,
and Conclusion shift to the end, where they land even better: Under the Hood's SIGINT theory now
arrives after the learner has actually used `kill`, and the Final Challenge gains a second capstone
that stress-tests the new band.

## New course map

| #      | Part                       | Status   | Sections                                                                                                                          |
| ------ | -------------------------- | -------- | --------------------------------------------------------------------------------------------------------------------------------- |
| —      | Introduction               | existing | unchanged                                                                                                                         |
| 1      | First Contact              | existing | unchanged                                                                                                                         |
| 2      | Moving Around              | edit     | + "escape hatches" card in 2.5 (q / `:q!` / Ctrl+X)                                                                               |
| 3      | Copy, Move, Delete         | existing | unchanged                                                                                                                         |
| 4      | Text & Pipes               | edit     | + forward pointer to Part 7 ("grep finds; sed changes")                                                                           |
| 5      | Permissions & Environment  | edit     | + pointer from 5.4 env vars to 9.4 Keys & Secrets                                                                                 |
| 6      | Terminal for the AI Era    | edit     | + `sed -i`, `kill -9`, `tar xf` rows in the red-flag table; band intro                                                            |
| **7**  | **Text Surgery**           | **NEW**  | 7.1 Find & Replace · 7.2 Line Surgery · 7.3 Editing in Place · 7.4 Columns & awk                                                  |
| **8**  | **Processes & Ports**      | **NEW**  | 8.1 Everything Is a Process · 8.2 Stopping Things · 8.3 Who's on Port 3000? · 8.4 Background & Foreground                         |
| **9**  | **Talking to the Network** | **NEW**  | 9.1 What Is localhost? · 9.2 curl — Ask the Network · 9.3 Reading JSON · 9.4 Keys & Secrets · 9.5 A Door to Another Machine (ssh) |
| **10** | **The Toolshed**           | **NEW**  | 10.1 Package Managers · 10.2 Archives — tar & zip · 10.3 Links & Where Things Live · 10.4 Disk Detective                          |
| 11     | Your Cockpit               | renumber | was Part 7; fix "last chapter" cross-references                                                                                   |
| 12     | Under the Hood             | renumber | was Part 8; 12.1 now references the learner's own `kill` experience                                                               |
| 13     | Conclusion                 | renumber | was Part 9; + capstone-2 "The Midnight Deploy"; + new checklist items                                                             |

Totals: 9 → 13 parts · 39 → 56 sections · 21 → 34 playground drills · 42 → 59 image prompts.

---

## Part 7 — Text Surgery (sed & awk)

**Thesis:** grep answers "which lines?"; sed answers "make them different." The single most
common file-mutating command agents propose, taught fully: substitute, delete, print, addresses,
and the `-i` footgun.

### Sections

- **7.1 Find & Replace** — `sed 's/old/new/'`, the `g` flag, alternate delimiters (`s|a|b|`),
  case-insensitive `I`. Anatomy callouts on every character of `s/mango/kiwi/g`. Stream model:
  sed never touches the input file unless you tell it to — output flows to the screen or through
  `>` like everything in Part 4. Banner: `find-replace.webp`.
- **7.2 Line Surgery** — sed as a line editor: `/DEBUG/d` (drop lines), `-n` + `p` (print only
  what you ask: `sed -n '40,55p'`), addresses (line numbers, ranges, `/regex/`, `$`). The film-
  strip mental model: every line passes through; commands decide its fate. Banner:
  `line-surgery.webp`.
- **7.3 Editing in Place** — `-i` and why the agent's version is scary: `sed -i.bak` as the house
  rule (instant backup, instant diff, instant undo). Ties directly back to Part 6's audit habit:
  when the agent proposes `sed -i`, you amend it, not reject it. Banner: `edit-in-place.webp`.
- **7.4 Columns & awk** — just enough awk: `awk '{print $2}'`, `-F,`, compared honestly with
  `cut` (cut for simple splits, awk when columns are space-ragged). Not an awk course; a reading
  ability. Banner: `columns-awk.webp`.

### Drills

| id               | Title                   | Goal check                                                                                                                                             |
| ---------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `sed-rename`     | Rebrand the Menu        | `kiwi-menu.txt` exists = `menu.txt` with every "mango"→"kiwi"; original untouched; history has `sed`                                                   |
| `log-surgery`    | Silence the Debug Noise | `clean.log` = `app.log` minus `/DEBUG/` lines; original untouched                                                                                      |
| `in-place-audit` | The Agent's Mass Edit   | seeded `agent-plan.txt` proposes `sed -i` with **no backup**; pass = all `*.yml` now `https:` **and** `.bak` files exist (learner amended to `-i.bak`) |
| `column-pull`    | Pull the Column         | `emails.txt` contains column 2 of `signups.csv` (accept `awk -F,` or `cut -d,`)                                                                        |

### Engine work

- `sed` subset (M): script parsing, `s///` with `g`/`I` and alternate delimiters, `d`, `p`+`-n`,
  addresses (`N`, `N,M`, `/re/`, `$`), `-i[suffix]`, `-E`. BRE-lite → JS RegExp translation.
  Man page + tests.
- `awk` lite (S): `-F`, `{print $N}` / `{print $1, $3}` / `$0`, optional `/re/ {print}` guard.
  Man page + tests.

---

## Part 8 — Processes & Ports

**Thesis:** the missing survival skill. "Port 3000 is already in use" is the #1 real-world
terminal moment for this audience, and Part 12's signals theory deserves a practical prequel.

### Sections

- **8.1 Everything Is a Process** — `ps aux` (read the columns: PID, %CPU, COMMAND), `pgrep`.
  Every running program — the dev server, the shell itself, the agent — is a row with a number.
  Banner: `everything-is-a-process.webp`.
- **8.2 Stopping Things** — `kill <PID>` sends a polite letter (SIGTERM: "please finish and
  stop"); `kill -9` removes the floor (SIGKILL: no cleanup, no goodbye). Escalation ethic: ask
  first, `-9` last. Ctrl+C revealed as "kill for the foreground process" — cashing a cheque
  Part 12 will explain in full. Banner: `stopping-things.webp`.
- **8.3 Who's on Port 3000?** — ports as numbered doors; `lsof -i :3000` as the harbormaster's
  ledger; the full ritual: read the error → find the PID → kill it → start yours. EADDRINUSE
  decoded. Banner: `port-3000.webp`.
- **8.4 Background & Foreground** — `&`, `jobs`, `fg`, Ctrl+Z. One terminal, several things
  running. Honest framing: tabs/splits (Part 11) are often nicer; job control is for when you're
  already in the one terminal. Banner: `background-jobs.webp`.

### Drills

| id                | Title              | Goal check                                                                                                                                    |
| ----------------- | ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------- |
| `free-the-port`   | Free Port 3000     | seeded stale `node` process holds :3000; `./start.sh` fails with EADDRINUSE until it's killed; pass = old PID gone **and** new server running |
| `runaway-process` | Stop the Runaway   | seeded `spinner.sh` at 97% CPU **ignores SIGTERM**; pass = process gone (requires the `kill` → `kill -9` escalation)                          |
| `backstage-jobs`  | Two Things at Once | ran `slowbuild &`, `jobs`, and `fg` (habit-style checks, like `first-steps`)                                                                  |

### Engine work

- Process table in `ShellEngine` (M): `seed.processes` (`{pid, cmd, cpu, port?, ignoresTerm?}`),
  PID allocation, `ps aux`, `pgrep`, `kill` with signal semantics, seeded executables that spawn
  processes (`start.sh` → binds :3000), `lsof -i`.
- Minimal job control (M): `&` on long-running commands, `jobs`, `fg`, `kill %1`, Ctrl+Z. Keep
  the scope small and honest; anything deeper stays a friendly refusal.

---

## Part 9 — Talking to the Network

**Thesis:** curl graduates from red-flag cameo to daily tool. The dev server the learner just
killed in Part 8 becomes the thing they now talk to.

### Sections

- **9.1 What Is localhost?** — URL anatomy (`http://localhost:3000/api/health` decoded segment by
  segment), localhost = this very machine, ports as doors revisited. Banner: `localhost.webp`.
- **9.2 curl — Ask the Network** — `curl localhost:3000/health` to verify the agent's claim that
  "the server is running"; `-o` to save; `-I` for headers; `-s` for scripts. The Part 6
  `curl | bash` red flag revisited with full understanding. Banner: `curl.webp`.
- **9.3 Reading JSON** — APIs answer in JSON; pipe to `jq` (`| jq .version`, `-r`) with the
  honest fallback `| grep` when jq isn't installed. Pipes from Part 4 meet the network. Banner:
  `reading-json.webp`.
- **9.4 Keys & Secrets** — the hygiene lesson this audience needs most: keys live in `.env`
  files, never in command arguments (history remembers everything — `history | grep` from Part 11
  cuts both ways); `chmod 600 .env`; `$API_KEY` via `source`. Banner: `keys-and-secrets.webp`.
- **9.5 A Door to Another Machine** — ssh in one honest lesson: same conversation, different
  machine; the prompt tells you where you are; key pairs (the lock is public, the key never
  leaves home). Real-machine lab, no sandbox sim. Banner: `ssh.webp`.

### Drills

| id              | Title               | Goal check                                                                                                                                          |
| --------------- | ------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `health-check`  | Is It Alive?        | ran `curl localhost:3000/health` against the seeded server; `status.json` saved containing `"ok"`                                                   |
| `api-detective` | Question the API    | `version.txt` contains `2.1.0`, extracted from canned `api.vibecloud.dev/releases` JSON via a pipe                                                  |
| `secret-keeper` | Keep the Key Secret | seeded `deploy.sh` hardcodes `sk-…`; pass = `.env` holds the key, `chmod 600 .env`, and `deploy.sh` uses `$API_KEY` instead (sed practice included) |

### Engine work

- Virtual network (M): port registry driven by the process table — `curl localhost:3000` answers
  only while the server process lives, "connection refused" after it's killed (the Part 8 ↔ 9
  payoff); canned remote hosts via `seed.network`; curl flags `-o -s -I -H`; `ping` with canned
  latency (S).
- `jq` lite (S–M): `.`, `.key`, `.key.sub`, `-r`.

---

## Part 10 — The Toolshed

**Thesis:** owning your machine: getting new tools, unpacking what arrives, knowing where things
live and what's eating the disk.

### Sections

- **10.1 Package Managers** — `brew install` (macOS), `sudo apt install` (Linux), `npm i -g`
  (with the "read what it pulls in" caution). Connects back to `$PATH` and `which` from Part 5:
  installing IS "putting a file where PATH can see it". Banner: `package-managers.webp`.
- **10.2 Archives — tar & zip** — decoding the infamous flag soup: `tar -xzf release.tar.gz`
  letter by letter; `tar -tzf` to peek before you unpack (the audit habit again); `zip`/`unzip`.
  Banner: `archives.webp`.
- **10.3 Links & Where Things Live** — `ln -s` as a signpost, not a copy; reading the `->` in
  `ls -l` (finally explaining what brew and node_modules/.bin have been doing all along);
  `/usr/local/bin` demystified. Banner: `symlinks.webp`.
- **10.4 Disk Detective** — `du -sh */` to find the space hog, `df -h` for the whole disk;
  measure before you delete (the `rm` safety lesson, now with evidence). Banner:
  `disk-detective.webp`.

### Drills

| id                              | Title              | Goal check                                                                                    |
| ------------------------------- | ------------------ | --------------------------------------------------------------------------------------------- |
| `open-the-crate`                | Peek, Then Unpack  | files extracted from seeded `release.tar.gz` **and** history shows `tar -t…` before `tar -x…` |
| `summon-a-tool`                 | Install cowsay     | ran a package-manager install; `cowsay` then actually runs (and moos)                         |
| `space-hog`                     | Find the Space Hog | `node_modules` removed, **and** `du` appears in history before the `rm` (measure-first habit) |
| `mend-the-signpost` _(stretch)_ | Mend the Signpost  | `current` symlink re-pointed to `releases/v2.0` — ships only with engine symlinks             |

### Engine work

- `tar`/`zip`/`unzip` on the VFS (M): archive files store a JSON manifest of paths+contents;
  `c/x/t/z/f` flags; `cat` on an archive prints a friendly "binary" note.
- Package-manager sim (S–M): tiny curated registry — `cowsay` (pure delight) and `serve` (a
  static server that binds a port — reusable in Parts 8–9 drills); installs into
  `/usr/local/bin`; `brew` / `apt` / `npm -g` frontends.
- VFS symlinks (M, **riskiest engine change** — touches path resolution, `ls -l`, `rm`, `find`):
  build last; 10.3 prose + `mend-the-signpost` degrade gracefully if deferred.

---

## Edits to existing parts

1. **Part 2.5** — "Escape Hatches" card: `q` (pagers, already taught), `:q!` (vim — "the most
   famous trap in computing"), Ctrl+X (nano). Small, disproportionate goodwill.
2. **Part 4** — closing pointer: "grep finds lines; in Part 7 sed will change them."
3. **Part 5.4** — one-line pointer to 9.4 for API-key hygiene.
4. **Part 6** — red-flag table gains `sed -i` (no backup), `kill -9` (skips cleanup), and
   `tar -xzf` into a non-empty dir; short band intro at the part's end ("your audit vocabulary is
   about to quadruple").
5. **Part 11 (Cockpit)** — fix "last chapter" references (curl|sh is now three chapters back);
   the dev-server-hogging-a-terminal passage now cross-links Part 8's alternatives.
6. **Part 12 (Under the Hood)** — 12.1 references the learner's own `kill`/Ctrl+C experience
   from Part 8 instead of introducing signals cold.
7. **Part 13 (Conclusion)** — checklist items for sed-with-backup, polite-then-`-9`, curl health
   check, peek-before-unpack; Quick Reference & cheat sheet additions; capstone-2.

### Capstone 2 — `midnight-deploy` ("The Midnight Deploy")

The band's finale, placed beside the existing capstone in 13.3: a stale server squats on :3000,
`config.yml` still says `http:`, and the deploy must only ship on green. Pass = port freed
(`lsof`/`kill`), config fixed with `sed -i.bak`, `./deploy.sh && curl localhost:3000/health`
succeeding, `status.json` containing `"ok"`. Every new part contributes one beat.

---

## Cross-cutting integration checklist

- `sections.ts` — new section ids (`section-7-*` … `section-10-*`), old 7/8/9 → 11/12/13; new
  playground anchor ids.
- `sidebar-nav.ts` — four new groups (icons: Scissors, Cpu, Globe, Package).
- `progress.ts` — **one-time migration map** for renamed section ids so nobody loses progress.
- `search-index.ts`, `suggestions.ts` (agent starter chips for new parts), `cheat-sheet.ts` +
  print route — four new categories plus Panic Button rows: "port already in use → `lsof -i
:3000`", "trapped in vim → `:q!`".
- Component files: new `Part7–Part10.svelte`; rename old `Part7/8/9.svelte` → `Part11/12/13.svelte`;
  `+page.svelte` ordering.
- `README.md` — curriculum table, drill count, banner count, poster regen (`make-poster.mjs`).
- `IMAGE_PROMPTS.md` — prompts 43–59 (done, see there).
- E2E: search/agent tests that reference section ids; new scenario check tests.

## Rollout

Work happens on a long-lived branch (suggested: `expand/power-tools`) so main stays shippable and
the band lands as one coherent reveal; small standalone edits (escape hatches, red-flag rows,
cheat-sheet panic rows) can cherry-pick to main early.

1. **Phase 0 — scaffold & renumber** (mechanical): renames, ids, migration, nav, empty part shells.
2. **Phase 1 — Text Surgery**: sed/awk engine → prose → drills. No dependencies; art needed first.
3. **Phase 2 — Processes & Ports**: process table + job control → prose → drills.
4. **Phase 3 — Talking to the Network**: virtual network + jq (depends on Phase 2's port registry).
5. **Phase 4 — The Toolshed**: tar/zip + package sim (+ symlinks last, stretch).
6. **Phase 5 — Integration**: capstone-2, checklist, cheat sheet, README, poster, e2e sweep. Merge.

**Art pipeline (you):** generate in phase order — prompts 43–46 (Text Surgery) unblock Phase 1's
merge, then 47–50, 51–55, 56–59. House pipeline as ever: 16:9 PNG → `static/images/` exact
filename → `node scripts/optimize-images.mjs` → `node scripts/make-poster.mjs` at the end.
