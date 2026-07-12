# TerminalVibes — Image Generation Prompts

Each image below is generated from **the global style block + its own prompt**. Copy both into your image model together — the style block keeps all 39 pieces living in the same illustrated world.

**Asset location:** Finished images belong in `static/images/` using kebab-case filenames (e.g. `what-is-terminal.webp`). Drop the render in as PNG and run `node scripts/optimize-images.mjs` to convert it to WebP. The app serves assets from `static/images/` only — do not keep duplicate copies in the repo.

**Formats:**

- Section banners: **16:9**, rendered at 1920×1080 or larger.
- `logo.webp`: **1:1** square, works at 32px — keep it bold and simple.
- `og-image.png`: **1200×630** social card (kept as PNG at that exact size; not run through the optimizer).

**One real photo:** `static/images/thompson-ritchie.jpg` (Ken Thompson and Dennis Ritchie at the PDP-11, public domain) is a genuine historical photograph used in the A Brief History section. It is **sourced, not generated** — do not create a prompt-based substitute.

---

## Global style block (prepend to every prompt)

> Whimsical, cozy children's-storybook illustration style with painterly texture and soft edges — a consistent illustrated world across a whole series. THE WORLD: a warm woodland workshop where computing lives among trees. Palette: deep forest greens and mossy sage, warm brown wood and bark, cream parchment highlights, and the soft phosphor-green glow of terminal screens as the only "electric" color. Light sources are warm — lanterns, fireflies, dappled sun through leaves — plus that gentle green screen-glow. RECURRING MOTIFS: rounded dark terminal windows (three little dots in the title bar, a `$` prompt and a blinking rectangular cursor inside) built into wooden frames, tree stumps, and cottage desks; and a small friendly hermit crab with a spiral nautilus shell who appears as the guide — curious, never scared, often carrying or pointing at something. Cozy and inviting, never corporate, never dystopian. AVOID: blue/purple sci-fi palettes, neon cyberpunk, photorealism, brand logos, readable walls of code (a few short legible words are fine when the prompt asks for them), human faces.

---

## Site-wide

### logo.webp — site logo (1:1)

> A minimal emblem: the friendly hermit crab peeking out of its spiral nautilus shell, and the shell opening doubles as a rounded dark terminal window with a tiny pale-green `>_` prompt glowing inside. Flat, bold storybook shapes readable at 32 pixels. Deep forest green background circle, warm brown shell, cream linework. No text.

### Hero.webp — hero banner (16:9)

> A wide storybook establishing shot: a cozy woodland clearing at dusk where a large rounded terminal window — framed in carved warm-brown wood like a cottage window — glows soft phosphor green between the trees. On the screen, one legible line: `$ hello, world` with a blinking cursor. The hermit crab guide sits on a mossy stump in front of it, waving one claw in welcome. Fireflies echo the screen glow; a winding path of flat stepping stones leads toward the window, inviting the reader in. Spacious composition with room for overlaid title text on the left third.

### og-image.png — social card (1200×630)

> The same world as the hero, composed for a link preview: the glowing wooden-framed terminal window centered-right with `$ hello, world` legible on screen, the hermit crab guide beside it, forest greens and warm browns all around. Left half kept calm and dark for the overlaid site title "TerminalVibes — The Terminal for Vibe Coders". Bold shapes that survive small sizes.

---

## Hero / Introduction

### what-is-terminal.webp — What Is the Terminal? (`section-intro-what`)

> A cutaway "how it works" storybook diagram disguised as a scene: a wooden cottage desk holds a glowing terminal window (the terminal), and behind the wall a friendly workshop machine of cogs, ropes and pneumatic tubes (the shell) passes little paper notes between the window and a great tree of drawers (the computer). The hermit crab hands a note reading `ls` into the tube. Convey: you type words, a helper carries them, the machine answers. No labels needed beyond the one word `ls`.

### terminal-history.webp — A Brief History (`section-intro-history`)

> A museum corridor grown inside a hollow ancient tree: along the rings of the trunk, small alcoves show the eras — a teletype machine with paper spilling out, a boxy green-glow CRT, a modern laptop — each connected by one continuous glowing green thread of prompt text running through all of them. The hermit crab, wearing tiny round museum-guide glasses, gestures along the thread. Mood: fifty years, one unbroken idea.

### your-machines-terminal.webp — Your Machine's Terminal (`section-intro-shells`)

> Three cozy birdhouse-style cottages on branches of the same big oak, each with a glowing terminal window shaped slightly differently — one rounded and tidy (macOS), one hand-built and patched (Linux), one reached by a small wooden bridge from a different tree entirely (Windows, arriving via the bridge = WSL). The same warm green glow in all three windows; the hermit crab stands at the signpost where the paths meet. Mood: different homes, same light inside.

### prompt-anatomy.webp — Anatomy of a Prompt (`section-intro-anatomy`)

> A big affectionate close-up: one wooden-framed terminal window fills the right two-thirds, showing a single large, legible prompt line — `vibe@forest:~/projects$` — with a fat blinking cursor after it. The hermit crab stands on the frame with a tiny wooden pointer stick, mid-lecture, gesturing at the `$`. Little hand-drawn ribbon tags (blank or with single words like `you`, `where`) tied to parts of the line like botanical labels. Mood: a friendly anatomy lesson.

---

## Part 1 — First Contact

### opening-terminal.webp — Opening Your Terminal (`section-1-1`)

> A round wooden door in the base of a great tree, slightly ajar, spilling warm green terminal-glow onto the forest floor at night. A worn doormat, a lantern, and the hermit crab holding the door open with one claw, beckoning. Through the gap, the corner of a glowing prompt is just visible. Mood: it was never locked — it's just an app.

### first-commands.webp — Your First Commands (`section-1-2`)

> The hermit crab's first conversation with the machine: it speaks into an old brass speaking-tube connected to the terminal window, and the screen answers with short legible lines — `$ whoami` → `vibe`, `$ date` and a cheerful reply. Speech rendered as little paper notes traveling through the tube. Everything soft, safe and delighted; a cup of acorn tea steams on the desk. Mood: nothing here can break.

### getting-help.webp — Getting Help (`section-1-3`)

> A snug forest library inside a hollow log: shelves of tiny bark-bound manuals, one open giant book on a reading stand whose pages glow faint green like a man page, with a legible `q` carved on a small wooden exit door at the back of the room (q quits the pager). The hermit crab reads with a magnifying glass; a wise owl librarian perches above. Mood: every command ships with its own book.

---

## Part 2 — Moving Around

### where-am-i.webp — Where Am I? (`section-2-1`)

> The hermit crab as a tiny explorer standing on a mossy overlook, holding up a wooden compass whose face is a small green-glowing screen reading `~/projects`. Below, the forest floor is an aerial map of clearings and paths — folders as clearings, files as little parcels laid out in rows. Mood: pwd and ls — position and surroundings at a glance.

### paths.webp — Paths (`section-2-2`)

> A hand-drawn parchment trail map pinned to a wooden board: from a heart-marked home cottage (`~`) at the top, dotted trails wind through named clearings to a treasure spot. Two routes are drawn to the same destination — one long trail from the great root marked `/`, one short hop from a "you are here" acorn pin. Small wooden trail signs read `..` and `.`. The hermit crab pushes the pin in. Mood: absolute vs relative, both correct.

### changing-directories.webp — Changing Directories (`section-2-3`)

> The hermit crab mid-hop between lily-pad clearings in a stream, each pad holding a tiny folder-shaped moss hummock; a rope swing overhead labeled with a small carved `cd -` arcs back toward the pad it just left. The home cottage glows in the background. Motion lines, joyful movement. Mood: getting around is quick once you know the swings.

### making-things.webp — Making Things (`section-2-4`)

> A sunny woodland construction site: the hermit crab in a tiny acorn hard-hat taps a wooden mallet, and neat nested boxes grow out of the ground like stacked flowerbeds — a box inside a box inside a box (mkdir -p) — while a row of small blank paper seed-packets sprout in a tray (touch: empty files, ready to fill). Blueprint parchment on a stump. Mood: making structure feels like gardening.

### looking-inside.webp — Looking Inside Files (`section-2-5`)

> A scroll-reading nook: the hermit crab unrolls a long parchment scroll from a wooden spool — the head of the scroll crisp and readable, the tail winding off into the dark of the shelf (head and tail). Beside it, a page-turning lectern with a hand crank (less). One scroll on a hook continuously grows longer on its own, inch by inch (tail -f). Mood: reading without opening an editor.

---

## Part 3 — Copy, Move, Delete

### copying.webp — Copying (`section-3-1`)

> A cozy print workshop inside a stump: the hermit crab operates a small wooden duplicating press — a parcel goes in, and two identical parcels sit side by side after, one still warm and glowing faintly. Behind, a whole crate of parcels rides a conveyor toward the press (cp -r copies the whole crate). Mood: perfect duplicates, originals untouched.

### moving-renaming.webp — Moving & Renaming (`section-3-2`)

> A tiny forest post office: the hermit crab in a postal cap re-addresses a parcel at the counter — peeling off one paper name-tag and smoothing on a fresh blank one (rename), while behind it a pulley-basket carries another parcel across the room to a different shelf (move). Same parcel, same stamp, new label or new shelf. One shelf spot already holds a parcel with a small "careful — this spot is taken" ribbon (overwrite). Mood: mv is one gesture, two meanings.

### deleting.webp — Deleting (Carefully) (`section-3-3`)

> The safety lesson, told gently: at the edge of the clearing stands a stone well marked with a carved `rm` — parcels dropped in are simply gone; there is no bucket and no rope. NO trash can anywhere in the image. The hermit crab holds a parcel over the well but is looking carefully at its label first, lantern raised (ls before rm). A small worn sign: `no way back`. Mood: respectful caution, not horror.

### wildcards.webp — Wildcards (`section-3-4`)

> The hermit crab holds up a wooden stencil card punched with a star `*` and looks through it at shelves of parcels — through the stencil, all parcels whose tags end in `.log` glow softly green while the rest stay dim. A second stencil with `?` leans against the shelf. One legible tag on the stencil: `*.log`. Mood: one pattern selects many things at once — look before you act.

---

## Part 4 — Text & Pipes

### redirection.webp — Redirection (`section-4-1`)

> A wooden aqueduct scene: glowing green water (output) flows from a terminal window's spout down carved channels. One channel fills a barrel from the top after emptying it — a small worried fish watches its old water vanish (`>` truncates!) — while a second channel gently tops up an already-full barrel (`>>`). A rusty side-gutter carries murky red-tinged trickle to its own small pot (`2>` errors). The hermit crab works the gate levers. Mood: plumbing you can trust once you know the valves.

### pipes.webp — Pipes (`section-4-2`)

> The signature image of the course: a whimsical Rube Goldberg water-mill line through the forest — glowing green stream flows out of one small wooden machine into the next through bamboo pipes: a sieve wheel, a sorting flume, a counting clacker — each machine humble and single-purpose, together doing something wonderful. The hermit crab conducts from a stump with a twig baton. Mood: small tools, composed — the Unix philosophy as a watermill symphony.

### grep.webp — Searching Text (`section-4-3`)

> A detective vignette: the hermit crab in a tiny deerstalker cap sweeps a warm magnifying glass across a wall of hanging parchment strips (log lines); wherever the lens passes, lines containing the word `ERROR` light up green while the rest stay faded — one legible glowing strip reads `ERROR: crash at 03:12`. A pin-board with red string connects a few glowing strips. Mood: the needle found, the haystack calm.

### counting-shaping.webp — Counting & Shaping (`section-4-4`)

> A harvest-sorting barn: berries pour down a wooden chute into a sorting tray where they settle into neat color-grouped rows (sort); identical berries stack into little towers with a tally chalkboard beside each stack (uniq -c); the tallest tower wears a tiny ribbon (sort -rn: biggest first). The hermit crab chalks the counts. Mood: raw pile in, ranked answer out.

### finding-files.webp — Finding Files (`section-4-5`)

> Night search in the woods: the hermit crab holds a lantern whose beam sweeps the forest floor, and every parcel whose name-tag matches lights up green wherever it hides — under leaves, up in a knothole, deep in a burrow — while a distant magnifying-glass silhouette (grep, the other detective) reads a scroll's contents instead. One legible tag in the beam: `notes.md`. Mood: find hunts names; grep reads insides.

---

## Part 5 — Permissions & Environment

### reading-ls-l.webp — Reading ls -l (`section-5-1`)

> A brass plaque study scene: a large carved wooden door-plate shows, big and legible, `-rwxr-xr--` — each character a little inlaid tile. Three small figures wait at the door: the hermit crab with a full ring of keys (user), a badger with a smaller ring (group), and a passing squirrel with none (other). The hermit crab points at tiles with its pointer stick. Mood: ten characters, whole story.

### chmod.webp — chmod (`section-5-2`)

> A locksmith's bench inside a knothole workshop: the hermit crab stamps a small green wax seal shaped like an `x` onto a rolled script-scroll — and the scroll's little legs pop out, ready to run (chmod +x: now it's executable). On the pegboard hang labeled key-recipes on wooden tags: `755`, `644`. Mood: permissions are just stamps you control.

### sudo.webp — sudo (`section-5-3`)

> A door of quiet consequence: deep in the roots, a grand iron-banded door with a warm but serious glow around its seams. The hermit crab stands before it holding a single large ceremonial key, pausing — reading a small parchment before turning it (never sudo what you don't understand). A wise old stag beetle gatekeeper watches, neither hostile nor smiling. Mood: real power, treated with respect — not fear.

### env-vars.webp — Environment Variables (`section-5-4`)

> The shell's cozy pantry: rows of glass jars on wooden shelves, each with a hand-inked label — legible ones read `$HOME`, `$USER`, `$PATH` — holding little glowing contents (a tiny cottage, a name-tag, a folded map). The `$PATH` jar holds a strip of tiny signposts in a row. The hermit crab, in an apron, lifts the `$PATH` jar down to inspect it — around it on the floor, a small puzzled woodland mouse holds a note reading `command not found`. Mood: it was never magic — just jars.

### shell-config.webp — Your Shell Config (`section-5-5`)

> A personalization workshop: the hermit crab decorates the inside of its own spiral shell like a den — pinning tiny shortcut ribbons to a corkboard (aliases), a small legible strip reading `alias gs=git status`, hanging a wind-chime, painting trim. On the desk, an open bark-bound journal titled `.bashrc` in neat ink. A watering can pours a soft green shimmer over it all (source: reload). Mood: your shell, your den.

---

## Part 6 — Terminal for the AI Era

### read-before-you-run.webp — Read Before You Run (`section-6-1`)

> The differentiator image: a helpful but slightly over-eager clockwork messenger bird delivers a scroll of proposed commands to the hermit crab, who reads it carefully by lantern light with the magnifying glass BEFORE the big brass `Enter` lever gets pulled. On the scroll, two short legible lines look tame and one line is subtly tangled/thorny. The crab's claw rests on the lever — not pulling. Mood: the bird means well; you still read the scroll.

### first-script.webp — Your First Script (`section-6-2`)

> A recipe-writing scene: the hermit crab pens a numbered recipe onto a scroll — first line legible: `#!/usr/bin/env bash` — then feeds the scroll into a small wooden music-box machine that replays the steps by itself, little hammers tapping each step in order. A green `x` wax seal (chmod +x) glints on the scroll's ribbon. Mood: a script is a saved recipe the machine can cook alone.

### exit-codes.webp — Exit Codes & Chaining (`section-6-3`)

> A railway-switch scene in miniature: a little wooden cart rolls out of a testing shed flying either a green `0` pennant or a red pennant; ahead, a track switch sends green-pennant carts onward across a bridge labeled with a carved `&&`, while red-pennant carts are gently diverted to a repair siding labeled `||`. The hermit crab operates the switch, calm and logical. Mood: every command reports back; chains decide what happens next.

---

## Part 7 — Your Cockpit

### make-it-yours.webp — Make It Yours (`section-7-1`)

> A terminal-window decorating party: several wooden-framed terminal windows leaning in a workshop, each painted differently — one moss green, one autumn amber, one dusk-dark — with different prompt charms hanging below the screen (a star, an acorn, a tiny branch symbol like a git prompt). The hermit crab holds a paintbrush, admiring its favorite. Mood: same terminal, your colors.

### history-superpowers.webp — History Superpowers (`section-7-2`)

> A memory attic: a long paper ribbon of every command ever typed spools from a brass player-piano-style machine, winding around the rafters. The hermit crab rides a small pulley basket UP the ribbon (up-arrow), while a warm searchlight lens slides along the ribbon highlighting one legible old line, `ssh forest-server` (Ctrl+R). A small stamp on the machine reads `!!`. Mood: nothing you typed is ever lost.

### vscode-terminal.webp — Terminal in VS Code (`section-7-3`)

> A treehouse study with a big two-story window: the upper pane shows parchment pages of code being written; the lower pane is a familiar glowing green terminal window — one desk, both views, a little wooden ladder between them. The hermit crab sits at the junction, one claw on each level. (Abstract, cozy — evokes an editor with an integrated terminal, no brand marks.) Mood: where vibe coders actually live.

### many-terminals.webp — Many Terminals at Once (`section-7-4`)

> A beehive of glowing windows: a wooden cabinet of small terminal windows in a grid, each softly green with a different tiny task scurrying inside — one scrolling a log, one running tests, one idle with a blinking cursor. The hermit crab, conductor-like, watches all of them from a swivel stool made of a mushroom. One window is split down the middle by a neat wooden mullion (splits). Mood: calm parallelism.

---

## Part 8 — Conclusion

### mindset.webp — The Command-Line Mindset (`section-8-1`)

> A dawn summit scene: the hermit crab stands at the top of the forest canopy at first light, its shell now decorated with all the tiny charms collected through the course (stencil, key, magnifier, wax seal, pennant). Below, the whole woodland-workshop world is visible at once — the watermill pipes, the pantry, the post office, the well — all connected by one glowing green stream. Mood: it was one system all along.

### quick-reference.webp — Quick Reference (`section-8-2`)

> A beautifully organized tool-roll: an unrolled leather-and-canvas roll on a wooden table, each pocket holding one tiny gleaming tool with a small carved name-tag — legible tags read `ls`, `cd`, `grep`, `rm` among others left indistinct. Everything oiled, loved, within reach. The hermit crab folds the roll's ribbon. Mood: the whole course, pocket-sized.

### final-challenge.webp — The Final Challenge (`section-8-3`)

> The night before the exam, cozy edition: one gloriously messy home clearing — parcels scattered, a leaning tower of unsorted scrolls, one tangled log-line strip fluttering in the breeze — and the hermit crab rolling up its sleeves (as much as a crab can), lantern lit, tool-roll open, completely unafraid. A small wooden sign: `one messy home folder`. Mood: you are ready for this.

### keep-learning.webp — Keep Learning (`section-8-4`)

> A commencement at dusk: the hermit crab stands at the edge of the familiar clearing where a stepping-stone path — each stone faintly terminal-green — leads out toward a wider night forest full of distant warm windows (other books, other communities, deeper tools), fireflies rising like scattered prompts. Its shell carries a tiny knapsack. The home terminal window glows behind it, door left open. Mood: the path continues, and home stays lit.
