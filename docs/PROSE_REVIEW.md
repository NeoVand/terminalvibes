# TerminalVibes Prose Review

Editorial review of educational copy across Hero + Parts 1–9 (primary), with notes on playground hints, AgentPanel intro, and VibeBox framing. Voice target: **human, beautiful, humble, very educational, fun to read, never cringy**.

Reviewed July 2026 against the live section sources under `src/lib/components/sections/`.

---

## Verdict

This course already has a real teacher’s voice — patient, precise, and unusually good at turning shell folklore into habits. The best passages (permissions as a “10-character rulebook,” wildcards as shell expansion rather than magic, the `rm` ritual, the staged access-log pipeline, the PTY/line-discipline tour) sound like a thoughtful human who has broken things and wants you not to. Educational scaffolding is strong: problem → concept → command → habit → verify, with playgrounds that actually practice the habit named in the prose.

Where the voice frays is not ignorance or laziness — it’s over-performance. The AI-era framing is often true and useful, but it is also repeated so often that the curriculum starts to sound like a pitch for itself. Hero is a second course before Part 1. Intensifiers (`exactly`, `literally`, `the whole`, `superpower`, `dangerous`, `YOLO`) accumulate until warmth tips into marketing. A few epigraphs and closers peacock (“make you dangerous,” “That’s a pilot,” “never again pressing Enter on faith”) in ways the teaching body usually avoids.

The edit that would raise the whole book one register: **trust the teaching more, sell less**. Cut or relocate Hero’s product/AI manifesto; keep AI as a recurring _use case_ (especially Part 6) rather than a chorus in every intro; purge hollow intensifiers; and keep the humble, concrete lines that already do the real work — “Errors are feedback, not failure,” “Echo the glob first,” “Nothing is broken. The file simply doesn’t have its `x` bit yet.”

---

## Voice scorecard

| Criterion            | Score  | Evidence                                                                                                                                                                                                                                                                                         |
| -------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Human**            | 8/10   | Conversational without being chatty; “Wander boldly,” “Everyone gets stuck in a pager exactly once,” the password-prompt-shows-nothing aside. Occasional LLM-ish cadence: stacked “exactly / literally / the whole,” parallel list rhetoric, “this is the chapter this whole course exists for.” |
| **Beautiful**        | 7/10   | Real imagery that earns its place: filesystem as upside-down tree; glob as a net; teletype furniture; “pipe wearing a teletype costume.” Beauty dips when metaphors pile on (“glass cockpit,” “agent-fleet dashboard,” “victory-lap deep dive”) or when beauty is asked to do marketing’s job.   |
| **Humble**           | 6.5/10 | Strong humility in safety teaching and “you don’t need the arithmetic.” Undercut by peacock closers (Part 8 “dangerous,” Part 8 “more than most professionals,” Part 9 “That’s a pilot”) and Hero’s “AI-native interface” victory lap.                                                           |
| **Very educational** | 9/10   | Outstanding mental models, habit language, progressive disclosure, accurate caveats (`uniq` adjacency, `>` truncates first, glob expansion by the shell). Currency notes (Tahoe, WSL open source, tldr v2.2) mostly help; a few will age fast.                                                   |
| **Fun to read**      | 8/10   | Dry wit works (“Bourne Again” pun, `touch`’s side-effect career, “garish red” SSH profile). Fun fails when it tries for cool (“Never YOLO-approve,” “Vibe it,” “vibe coders live”).                                                                                                              |
| **Never cringy**     | 6/10   | Body copy is largely clean. Brand surface (`TerminalVibes`, `Vibe it`, username `vibe@sandbox`) plus a thin layer of vibe-speak and AI-hype create the main cringe risk — amplified by formula fatigue (“The Problem,” “The AI-Era Move,” “This is where vibe coding actually happens”).         |

---

## What already sings

Specific lines and sections that already hit the voice target — keep and protect these.

### Epigraphs that earn their place

- **Part 2:** _“In the terminal you are always standing somewhere. The first skill is knowing where.”_ — calm, memorable, pedagogical.
- **Part 3:** _“The terminal assumes you mean exactly what you say. Deleting is the moment to be sure you do.”_ — stakes without panic theater.
- **Part 5:** _“‘Permission denied’ and ‘command not found’ aren’t errors. They’re the system explaining its rules — once you can read them.”_ — reframes frustration into literacy.
- **Part 6:** _“The AI writes the command. You decide whether it runs. That decision is the whole job.”_ — the right AI framing: agency, not awe.

### Teaching that sounds like a person

- **Part 1.2:** _“Errors are feedback, not failure”_ / _“Error messages in the terminal are answers — read them.”_
- **Part 1.3:** _“You will never memorize every command — nobody does. What experienced people memorize instead is how to look things up.”_
- **Part 2.2:** TAB-completion as _“THE typo-prevention habit”_ (keep the habit; soften the all-caps later).
- **Part 2.3:** _“You can’t fall off the map.”_ / _“Wander boldly.”_
- **Part 2.4:** _“(no output — in the shell, silence means success)”_ — tiny, perfect cultural note.
- **Part 3.3:** the three-panel disaster recipe (`rm -rf` + wildcard + wrong directory) and the _ls → pwd → rm_ ritual.
- **Part 3.4:** _“the Shell Expands the Glob, Not the Command”_ — the course’s clearest “big idea” heading.
- **Part 4.4:** building `cut | sort | uniq -c | sort -n` stage by stage, then: _“Read the finished pipeline aloud and it’s a sentence.”_
- **Part 5.2:** _“Nothing is broken. The file simply doesn’t have its `x` bit yet.”_
- **Part 5.3:** password prompt shows nothing — _“Every beginner assumes their keyboard broke; it’s just a privacy habit from 1970 that stuck.”_
- **Part 5.4:** _“Command not found” always means exactly one of three things_ — typo / not installed / outside PATH.
- **Part 6.1:** four-step audit; explainshell as _“unlike the AI, explainshell only quotes the manual”_; nuanced `curl | bash` (source matters).
- **Part 6.3:** `cd … ; rm -rf *` vs `&&` — horror story with a precise moral: _“Audit the connectors, not just the commands.”_
- **Part 8.1:** teletype → tty → PTY → cooked/raw → Ctrl+C as SIGINT — the most beautiful educational stretch in the book.
- **Playground hints** (`scenarios.ts`): plain, specific, habit-aligned — e.g. _“`echo _.tmp`is a free preview of what`rm _.tmp` would delete.”_ These often out-humble the surrounding marketing.

### Structural strengths

- Habits over trivia: `pwd`/`ls`/`cd` rhythm, echo-the-glob, ls-before-rm, build pipelines one stage at a time, ask AI then verify with `--help`.
- Callouts that teach (`caution` on `>` truncate, `uniq` gotcha, quote `find` patterns) rather than cheerlead.
- Cross-part callbacks that feel earned when brief (pager `q`, Part 5 permissions preview in Part 2).

---

## What undercuts the voice

### 1. Hero overload

Hero currently contains: welcome pitch, stats pills, playground CTA, cheat-sheet CTA, “What Is the Terminal?,” AI-agent product roll call, Terminal-Bench + Stack Overflow stats, history essay + timeline, OS setup tabs, anatomy of a prompt + Mermaid loop. That is an entire Part 0–1.5 before “First Contact.”

The opening already states the thesis well:

> Your AI assistant keeps proposing shell commands — this guide teaches you to read, verify, and run them with confidence.

Then it restates the same thesis three more times with rising intensity (“more relevant… not less,” “literally measured,” “AI-native one”). By the time the learner opens a terminal in Part 1, the emotional work has been done twice.

### 2. Formula fatigue: “The Problem”

Nearly every subsection opens with a callout:

> **The Problem:** …

Early on it scaffolds empathy. By Part 4–6 it becomes a template the reader can predict and skim past. Many “Problems” are also the same problem in costume: _an AI suggested something; you don’t yet understand it._

### 3. AI-era chorus

Useful when concrete (audit routine, red flags, agent incidents, OSC markers). Exhausting when it reappears as:

- section titles (_The AI-Era Move_)
- closing moral of every intro
- Part 7/8/9 reprises of Terminal-Bench / 84% / 29%
- “this is where vibe coding actually happens”

The course’s unique value _is_ AI-era supervision — it doesn’t need to remind the reader every 400 words.

### 4. Intensifier / peacock layer

Recurring hollow or nearly-hollow intensifiers and peacock moves:

- _exactly_, _literally_, _the whole_, _the single most_, _orders of magnitude_
- _superpower_ (Part 4 title + body; Part 6 exit codes)
- _dangerous in the best way_ (Part 8 intro)
- _That’s a pilot_ (Part 9)
- _Never YOLO-approve_ (Part 6)
- _you now know more… than most people who use it professionally_ (Part 8)
- _All of it makes you dangerous…_ (Part 8)

These are the main cringe vectors. The teaching beside them is usually stronger without them.

### 5. Brand / prose tension

- Product name **TerminalVibes** + **“Vibe it”** boxes + username `vibe` create a playful brand surface.
- Body prose aims for timeless teacher voice.
- When the teacher says “vibe coders live” (Part 7) or “This is where vibe coding actually happens,” brand leaks into pedagogy and ages poorly.

VibeBox _content_ (the quoted prompts) is often excellent — practical, humble. The chrome label “Vibe it” is the cringe risk, not the prompts.

### 6. Dated currency as flex

Useful when operational (how to open Terminal on Tahoe; WSL install path). Flex-adjacent when the date is the point:

- tldr “client spec hit v2.2 in March 2026”
- Ghostty “v1.3, 2026”
- “2026 twist… multiple AI agents in parallel”
- Stack Overflow 2025 / Terminal-Bench v2.1 repeated in Hero and Part 9

Prefer timeless claims; put year-stamped facts where they help a setup step, or in a footnote-like aside once.

### 7. Related copy (skim)

- **AgentPanel intro:** _“Right now I’m a scripted guide…”_ — clear, honest, human. Keep.
- **Playground hints:** consistently strong; use them as a voice model for section intros.
- **VibeBox label “Vibe it”:** softest rename candidate in the product (e.g. “Ask an AI,” “Try asking,” “Prompt ideas”) if brand allows.

---

## Part-by-part review

### Hero

**Strengths**

- Clean definition: terminal as “text conversation with your computer.”
- Terminal / shell / console distinction is crystal.
- History has real charm (Multics joke, Bourne Again pun, spare PDP-7).
- Prompt anatomy is visually and verbally excellent.
- OS tabs are practical and non-condescending.

**Weaknesses / cringe risks**

- Product-stat pills (`9 parts`, `100% free`, `No signup`) set a landing-page register before teaching begins.
- AI lab roll call + benchmark + survey in the same breath as “what is a terminal?”
- Closing history moral: _“the control panel that was already waiting for the AI era”_ — pretty, slightly messianic.
- macOS “best position” can read as fan-service (soft).

**Density:** Too long — a mini-course. Just-right length would be ~40–50% of current prose, with setup details kept and manifesto trimmed.

**Best keep**

- Welcome sentence about reading/verifying agent commands.
- Three-layer definitions; prompt anatomy; prompt loop caption (_“Master this loop and the rest of the course is just vocabulary.”_).
- Timeline entries; Why ‘bash’? callout.
- Playground + PowerShell-is-different warnings.

**Strongest cut candidates**

- Stats pills (or move to footer/about).
- Second and third restatements of the AI thesis (keep one short paragraph max).
- Terminal-Bench + SO survey block here (keep once, preferably Part 6 or 9 — not both Hero and 9).
- “AI-native interface” closer after history (the history can end on “why small tools and text still matter”).

**Rewrite suggestions**

Before:

> A 50-year-old interface turns out to be the AI-native one: text in, text out is exactly how language models think. Learning to read that text is the difference between supervising your agents and hoping for the best.

After:

> Text in, text out is also how language models work — which is why so many coding agents drive a shell. Learning to read that text is how you supervise them instead of hoping for the best.

Before:

> This isn’t a niche skill anymore — it’s literally measured. Terminal-Bench… And Stack Overflow’s 2025 survey found…

After (if keeping stats at all):

> Plenty of developers use AI tools; far fewer trust what those tools run. Being able to read a shell command closes that gap. (Optional link to Terminal-Bench / survey in a footnote or Part 6.)

---

### Part 1 — First Contact

**Strengths**

- Warm, deflating opener: _“it’s just an app.”_
- First commands sequence is perfect pedagogy (whoami → echo → date → clear → intentional typo).
- Help section teaches a lifelong skill, not a command list.
- “Ask the AI, verify with `--help`” is the course’s core habit in miniature.

**Weaknesses / cringe risks**

- Epigraph is fine but slightly generic compared to Parts 2–3.
- “The AI-Era Move” as a heading — rename to something humble (“A third way to get help”).
- Claude Code docs link is useful; “entry ticket to AI coding” overclaims.

**Density:** Just right for a first lesson. Slightly long only in 1.1 OS rehash of Hero.

**Best keep / cut**

- Keep: fearsome-reputation deflation; break-it-on-purpose; pager `q`; AI-then-verify tip.
- Cut/merge: duplicate macOS Tahoe praise already in Hero; shorten Windows paragraph by pointing back to Hero tabs.

**Rewrite**

Before:

> terminal literacy is the entry ticket to AI coding.

After:

> if you use a coding agent, being able to read its commands is part of using it safely.

---

### Part 2 — Moving Around

**Strengths**

- Best epigraph in the early course.
- Location-confusion diagnosis is human and accurate.
- Paths section (tree, absolute/relative, four shortcuts) is exemplary.
- Making Things + Looking Inside are paced well; `touch` origin story is fun without trying.

**Weaknesses / cringe risks**

- “The Problem” every subsection — by 2.5, predictable.
- TAB callout: _“This is THE typo-prevention habit… Professionals never type… neither do you.”_ — good habit, slightly hectoring.
- Title _“Your Mental Map of the Machine”_ is fine; opening AI mention is already covered by the important callout below.

**Density:** Slightly long (five sections) but earned. 2.1 could trim one restatement of pwd/ls.

**Best keep / cut**

- Keep: pwd/ls/cd as street signs; dotfiles; path composition paragraph; `cd -`; silence-means-success; cat/less/head/tail grid.
- Soften: THE / Professionals never / neither do you.

**Rewrite**

Before:

> This is THE typo-prevention habit — a completed path is a path that exists… Professionals never type a full path by hand, and after this section, neither do you.

After:

> Treat TAB completion as a habit, not a convenience: a completed path is a path that exists, spelled correctly, with spaces escaped for you. Most people who look fast in a terminal are completing, not typing.

---

### Part 3 — Copy, Move, Delete

**Strengths**

- Responsibility framing without fearmongering.
- `cp` as insurance; `mv` mind-bender (rename is move); `rm` as the course’s safety centerpiece — all excellent.
- Wildcard “shell expands first” + echo habit — peak educational prose.
- AI stop-and-read on `rm -rf` is concrete, not hype.

**Weaknesses / cringe risks**

- “Power Tools” in the title is mild marketing; content is humble.
- “most famous disaster recipe” — fine if kept dry; avoid savoring catastrophe.
- Slight repetition of overwrite warnings (necessary, but can cross-link more tightly).

**Density:** Just right. Longest stretch (3.3) deserves its length.

**Best keep / cut**

- Keep almost all of 3.3–3.4.
- Soften part title if desired: “Copy, Move, Delete — and the Habits That Keep You Safe.”

---

### Part 4 — Text & Pipes

**Strengths**

- Redirection truncate caution is crystal.
- Unix philosophy paragraph (McIlroy) is earned, not decorative.
- grep flag grid is usable and memorable.
- Top-visitors pipeline stages are the best “show your work” teaching in the course.

**Weaknesses / cringe risks**

- Title _“The Terminal’s Superpower”_ + epigraph _“that’s the whole superpower”_ + body _“most composable interface ever built”_ — stack of peacock words.
- Opening: _“This part changes everything”_ — hollow intensifier; the content already changes everything by demonstrating.

**Density:** Just right to slightly rich; 4.5 find+xargs is advanced but well-bridged.

**Rewrite**

Before:

> This is the moment the terminal stops being a quaint retro tool and becomes the most composable interface ever built — and it’s exactly the style of command your AI assistant loves to write.

After:

> This is where the terminal stops feeling like a museum piece. Once output can move into files and into other commands, small tools multiply — and you’ll recognize the same style in a lot of AI-suggested one-liners.

Before (title/epigraph):

> Text & Pipes: The Terminal’s Superpower / “Pipes let them talk to each other — that’s the whole superpower.”

After:

> Text & Pipes: How Small Tools Combine / “Every command speaks plain text. Pipes let them talk to each other.”

---

### Part 5 — Permissions & Environment

**Strengths**

- Outstanding epigraph and intro promise (_errors become signposts_).
- Visual decode of `rwxr-xr-x`; directory meaning of rwx; 755/644 without forcing octal math.
- `chmod 777` caution; sudo password UX; PATH trichotomy — all humble and clear.
- Shell config as “just a shell script… No magic, ever.”

**Weaknesses / cringe risks**

- Opening callout’s “AI agents… are users too” is good once; don’t lean harder.
- Windows sudo note is useful but slightly newsy.
- 2025/2026 incident teaser pointing to Part 6 — OK; keep the fear in Part 6 where it’s taught.

**Density:** Just right. One of the most evenly voiced parts.

**Best keep:** nearly everything. Minimal cuts — mostly intensifiers if any (_exactly two recipes_ is fine).

---

### Part 6 — Terminal for the AI Era

**Strengths**

- This is the thesis chapter and it mostly deserves to be. Epigraph is perfect.
- Four-step audit + worked `rm -rf build/*` example = curriculum gold.
- Red-flag list is specific and nuanced (especially `curl | bash` source distinction).
- Scripts demystified as “commands saved in a file”; exit-code chaining with the `;` vs `&&` horror story.

**Weaknesses / cringe risks**

- Incident paragraph (Amazon Q, Replit, Cursor) is powerful; three named disasters in one breath can feel like doom-scroll journalism. One vivid case + “this keeps happening” may teach better than a stack.
- _“Never YOLO-approve”_ — pure cringe; the surrounding sentence is enough.
- _“You are the approval step — and the prompt is your moment”_ — slightly trailer-voiced; salvageable.
- Prompt-injection subsection is important but dense with 2026 citations; risk of dating and alarming without a calm next action (which the audit routine already is).

**Density:** Long but mostly justified. Trim citation stack and peacock phrases; keep ritual length.

**Rewrite**

Before:

> Never YOLO-approve. An agent can propose a thousand commands an hour; it only takes one unread `rm` to make it a bad day.

After:

> Don’t approve on autopilot. An agent can propose commands faster than you can casually skim them — and it only takes one unread `rm` to ruin an afternoon.

Before:

> This is the chapter this whole course exists for.

After:

> Everything so far was building toward one skill: reading a command you didn’t write.

---

### Part 7 — Your Cockpit

**Strengths**

- Practical, friendly; history section (especially Ctrl+R) is delightful and useful.
- Ghostty vs Warp comparison tries to be honest about tradeoffs — good humility when it works.
- Separate agent terminal vs your terminal — excellent habit.

**Weaknesses / cringe risks**

- Title/epigraph _“Cockpit”_ + _“thousands of hours”_ + _“vibe coders live”_ — brand/lifestyle tone.
- _“This is where vibe coding actually happens”_ — strongest cut in Part 7.
- _“glass cockpit”_ metaphor stacks on cockpit title.
- “2026 twist… agent-fleet dashboard” — trendy; the underlying advice (tabs/splits) doesn’t need the fleet hype.
- Product tour (Ghostty, Warp, Starship, Zellij) risks becoming a blog roundup; keep recommendations shorter and less dated.

**Density:** Slightly thin on exercises (no playgrounds) but OK for a “room” chapter; prose is medium-long for the amount of skill taught.

**Rewrite**

Before:

> This is where vibe coding actually happens. When a coding agent in VS Code… runs a command, it runs in this integrated terminal…

After:

> When a coding agent in VS Code runs a command, it usually runs in this integrated terminal — the same panel you can read, scroll, and type into.

Before (epigraph):

> You’ll spend thousands of hours in this window. Make it fast, make it comfortable, make it yours.

After:

> If you’re going to live in this window, you might as well like it: readable fonts, a prompt that helps, history that finds last Tuesday’s command.

---

### Part 8 — Under the Hood

**Strengths**

- 8.1 is the course’s literary and educational peak: furniture teletypes, PTY as costume, cooked vs raw, `^[[A` explained, Ctrl+C as signal, Enter-on-`ls` narration.
- Grown-up script preamble (`set -euo pipefail`, `trap`) connects mechanics to habits beautifully.
- Agent-as-Unix-tool (`claude -p` in a pipeline) is the right kind of AI framing — compositional, not messianic.

**Weaknesses / cringe risks**

- Intro: _“All of it makes you dangerous in the best way.”_ — retire immediately.
- Closer: _“you now know more about it than most people who use it professionally.”_ — peacock; unnecessary after a section that already proved mastery by explanation.
- Take-stock tip: same peacock energy.
- Epigraph _“the machine has never been more alive”_ — pretty but vague; 8.1’s own sentences are better poetry.
- 8.2 product landscape (Warp, cmux, Ghostty lib) dates quickly; keep the protocol insight, shorten the vendor tour.

**Density:** 8.1 just right (deep but narrated). 8.2 slightly long / newsy.

**Rewrite**

Before:

> Nothing here is required to use the terminal. All of it makes you dangerous in the best way.

After:

> Nothing here is required to use the terminal. All of it makes the everyday mysteries — `tty`, `^[[A`, Ctrl+C — feel ordinary.

Before:

> That’s a deeper understanding of the terminal than most working professionals carry — and the tour is nearly over.

After:

> If you can narrate a keystroke through the PTY and clean up on SIGINT, you have a working model most day-to-day use never requires — and the course has one send-off left.

---

### Part 9 — Conclusion

**Strengths**

- Mindset triad structure is sound (compose / read-before-run / AI-native).
- Quick reference card is useful and habit-annotated (_echo the glob_, _`>` truncates_).
- Capstone + honest checklist (_nobody’s grading you but you_) — humble, educational.
- Keep Learning list is generous and well-described (Shotts, Bandit, explainshell, tldr, man7).
- GitVibes handoff is appropriate sister-course framing when kept soft.

**Weaknesses / cringe risks**

- Mindset #3 reprints Hero’s Terminal-Bench + 84%/29% block — third time is too many.
- _“That’s not a spectator. That’s a pilot.”_ — trailer voice; undercuts the humble checklist beside it.
- Final Thoughts callout: _“never again pressing Enter on faith”_ — absolute promise; soft to _“you have a way not to.”_
- Epigraph restates Hero again; consider a quieter closer about habits.

**Density:** Just right for a finale; trim repeated stats and peacock closer.

**Rewrite**

Before:

> Someone has to close that gap, and it’s the person who can read the commands. You can now watch what your agent does, audit what it proposes, and step in when it’s wrong. That’s not a spectator. That’s a pilot.

After:

> Someone still has to close that gap. You can watch what an agent runs, audit what it proposes, and step in when it’s wrong — which is the whole point of learning to read the shell.

Before (Final Thoughts):

> That’s the whole promise of this course: not memorizing commands, but never again pressing Enter on faith.

After:

> The promise of this course was never memorizing commands. It was having a way to read what you’re about to run — especially when you didn’t write it.

---

## Cross-cutting recommendations

1. **Hero trim (highest leverage)**  
   Keep: welcome thesis (one paragraph), playground CTA, terminal/shell/console, short history or timeline (not both at full length), OS tabs, prompt anatomy.  
   Move/cut: stats pills, lab roll call, duplicate AI manifesto, benchmark/survey (to Part 6 once).

2. **Vary “The Problem”**  
   Keep the device for true puzzles (permission denied, glob danger). Elsewhere use: a one-line scenario, a question heading, or no callout — just teach. Aim for ≤50% of subsections using the exact label.

3. **AI-framing discipline**
   - Hero: one short “why this matters for AI assistants.”
   - Parts 1–5: AI as occasional realistic scenario, not closing moral.
   - Part 6: full treatment (audit, incidents, red flags).
   - Parts 7–9: brief callbacks only; no reprinted survey block.

4. **Intensifier purge** (see Appendix)  
   Search-and-consider: `exactly`, `literally`, `the whole`, `superpower`, `dangerous`, `YOLO`, `pilot`, `orders of magnitude`, `changes everything`, `most composable ever`.

5. **Epigraph pass**  
   Keep Parts 2, 3, 5, 6. Soften or rewrite 4 (superpower), 7 (thousands of hours), 8 (more alive), 9 (AI-era slogan). Hero doesn’t need a fake epigraph.

6. **Aging facts**  
   Policy: year-stamped product news only when it changes a learner action (install path, default app). Roundups of “current favorite terminal in 2026” → shorten and prefer timeless criteria (fast, local, AI optional).

7. **Brand leakage**  
   Keep `vibe` as playground username if desired. Avoid “vibe coding actually happens” in teacher voice. Consider renaming “Vibe it” chrome to something plainer.

8. **Let playground hints set the floor**  
   When a section intro feels overwritten, draft it in the register of `scenarios.ts` hints: concrete verbs, one habit, no manifesto.

9. **Incident storytelling**  
   Prefer one well-told failure + “patterns like this keep showing up” over a citation cluster. Link out for readers who want the dossier.

10. **Formula variation for section openers**  
    Alternate: story beat → command → concept; or concept → tiny experiment → habit. Not always Problem → explanation → AI moral.

---

## Keep / Cut / Rewrite priority list

Ranked for editorial impact vs. effort.

| Priority | Action                                                                                                   | Where                                         |
| -------- | -------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| 1        | **Trim Hero to orientation + setup + prompt anatomy**; one AI thesis paragraph max                       | Hero                                          |
| 2        | **Retire peacock phrases**: dangerous, YOLO, pilot, “more than most professionals,” “changes everything” | Parts 6–9, Part 8 intro                       |
| 3        | **Rename/soften “superpower”** framing                                                                   | Part 4 title, epigraph, body                  |
| 4        | **Deduplicate Terminal-Bench + SO 84%/29%** — appear once                                                | Hero and/or Part 9 → keep in Part 6 or 9 only |
| 5        | **Rewrite Part 7 “vibe coding actually happens”** and cockpit hype                                       | Part 7.3–7.4                                  |
| 6        | **Vary or retire “The Problem”** on ~half of subsections                                                 | Parts 1–6                                     |
| 7        | **Rename “The AI-Era Move”**; soften “entry ticket”                                                      | Part 1.3                                      |
| 8        | **Compress 8.2 vendor/news tour**; keep protocol + script armor                                          | Part 8.2                                      |
| 9        | **Soften Final Thoughts absolute promise**                                                               | Part 9                                        |
| 10       | **TAB-completion hectoring** → invitational habit language                                               | Part 2.2                                      |
| 11       | **Incident stack** → one primary story + links                                                           | Part 6.1                                      |
| 12       | **Consider “Vibe it” label** → plainer UI chrome                                                         | VibeBox                                       |
| 13       | **Epigraph polish** for Parts 4, 7, 8, 9                                                                 | as above                                      |
| 14       | **Protect without “improving”** the already-great passages listed in “What already sings”                | Parts 2–6, 8.1                                |

---

## Appendix: phrases to retire or soften

### Hollow or peacock intensifiers

| Phrase                                         | Why                        | Soft alternative                                   |
| ---------------------------------------------- | -------------------------- | -------------------------------------------------- |
| _literally measured_                           | Intensifier + flex         | _there’s even a benchmark for…_ or cut             |
| _exactly_ (as drumbeat)                        | Overused connective tissue | delete, or use only for true precision             |
| _the whole job / whole secret / whole promise_ | Absolute marketing cadence | _the job_, _the idea_, _what this course is for_   |
| _superpower_                                   | Comic-book                 | _the real leverage_, _what makes composition work_ |
| _changes everything_                           | Trailer                    | show the change; don’t announce it                 |
| _most composable interface ever built_         | Unprovable peacock         | _unusually composable_ / _built for composition_   |
| _dangerous in the best way_                    | Cringe                     | cut                                                |
| _Never YOLO-approve_                           | Forced cool                | _Don’t approve on autopilot_                       |
| _That’s a pilot_                               | Brand trailer              | cut; keep the behaviors                            |
| _orders of magnitude_                          | Cliché unless numeric      | _much faster than clicking_                        |
| _glass cockpit_                                | Metaphor pile-on           | _one place where code, agent, and shell meet_      |
| _agent-fleet dashboard_                        | Trend-speak                | _several agents, each in its own pane_             |
| _victory-lap deep dive_                        | Self-congratulatory        | _optional deep dive_                               |
| _entry ticket to AI coding_                    | Overclaim                  | _part of using coding agents safely_               |
| _you now know more than most professionals_    | Peacock                    | cut; the explanation is the proof                  |
| _never again pressing Enter on faith_          | Absolute vow               | _a reliable way not to press Enter on faith_       |

### Repeated rhetorical moves to use sparingly

- **“The Problem:”** callout opener
- **AI moral coda** at end of unrelated sections
- **“This is the moment / chapter / where…”** announcements
- **Lab/product roll calls** (Claude Code, Codex, Goose, Amp, Warp, Ghostty…) more than once per part
- **Survey/benchmark reprise** (84% / 29%, Terminal-Bench)
- **“In the AI era…”** as a sentence starter
- **“Professionals never X, and neither do you”** (hectoring twin of good habit advice)

### Brand-adjacent wording to watch

- _Vibe it_ (UI label)
- _vibe coders live_
- _where vibe coding actually happens_
- _TerminalVibes starter aliases_ (fine as a comment header; less fine if voice becomes fandom)

### Formulas that still work — keep, don’t over-copy

- _Errors are feedback, not failure_
- _Echo the glob first_
- _ls first, then rm_
- _Silence means success_
- _Ask the AI, verify with --help_
- _Audit the connectors, not just the commands_
- _Nothing is broken — it’s missing `x`_

---

## Related copy (brief)

| Surface                               | Note                                                                          |
| ------------------------------------- | ----------------------------------------------------------------------------- |
| **Playground hints** (`scenarios.ts`) | Voice model for the rest of the book: concrete, humble, habit-first. Protect. |
| **AgentPanel intro**                  | Honest about scripted vs local model — human and clear.                       |
| **VibeBox prompts**                   | Usually excellent teaching prompts; chrome label is the weak point.           |
| **RichHint**                          | Presentation only; inherits hint quality from scenarios.                      |

---

_End of review. No Svelte sources were modified; this document is editorial only._
