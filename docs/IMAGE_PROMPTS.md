# TerminalVibes — Image Generation Prompts

Every prompt below is **fully self-contained**: copy one fenced block, paste it into your image model, done. Style, palette, world, and format are restated inside every block, so no prompt depends on any other.

**Pipeline:**

- Section banners are generated at **16:9** (1920×1080 or larger), dropped into `static/images/` as PNG, then `node scripts/optimize-images.mjs` converts them to WebP.
- `node scripts/make-poster.mjs` refreshes the README banner poster after new art lands.
- `og-image.png` is **1200×630** and stays a PNG at exactly that size (not run through the optimizer).
- `logo.webp` is **1:1** and must read at 28px — simple silhouette, works on light and dark backgrounds.

**One real photo:** `static/images/thompson-ritchie.jpg` (Ken Thompson and Dennis Ritchie at the PDP-11 at Bell Labs, public domain) appears in the A Brief History section. It is **sourced, not generated** — no prompt exists or should exist for it.

---

## Site-wide

### logo.webp — site logo

Square 1:1. Browser tab, header, PWA icon. Must read at 28px on both light and dark.

```
Minimal storybook emblem, flat bold shapes with the softest painterly grain, for a logo that must stay legible at 28 pixels on both light and dark backgrounds. A small friendly hermit crab peeks from a spiral nautilus shell, and the shell's opening doubles as a rounded dark terminal window containing a tiny glowing ">_" prompt — the only "text" in the mark. The world this logo belongs to is a whimsical children's-book forest where computing lives among trees, so the forms are warm and organic, never corporate. Palette, exactly: shell in warm saddle brown #8b5e34 with tan #c89b6d highlights and cream-tan #dfc09a linework; the terminal opening in deep forest-black #0c110a; the ">_" prompt and a thin rim light in pale phosphor green #7ee787; an optional simple circular background in forest green #166534. No blue, no purple, no gradients that muddy at small sizes. Centered composition, thick silhouette, generous internal negative space, no other text, no extra props. The crab's expression: one small curious eye, friendly. Square format.
```

### Hero.webp — hero banner

16:9. Top of the page — the first image every visitor sees.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture and soft edges, set in a forest world where computing lives among trees and glowing CRT-style terminal windows are treasured magical objects. Wide establishing shot: a moonlit woodland clearing where a large rounded terminal screen, framed in carved warm wood like a cottage window, stands between mossy trunks and glows gently. On the screen, one short legible monospace line: "$ hello, world" with a fat blinking block cursor. A small friendly hermit crab wearing a spiral nautilus shell — the course's mascot — sits on a stump before it, one claw raised in welcome. A path of flat stepping stones leads toward the screen; fireflies drift up echoing the phosphor light. Palette, exactly: deep forest-black background #0c110a shading to #10160d, tree greens #166534 and #15803d, leaf glints in spring green #4ade80, screen glow and firefly light in pale phosphor greens #7ee787 and #86efac, wood and shell in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a highlights, one warm amber #fdba74 lantern accent. No blue, no purple. Emotional beat: an invitation — the machine was never scary. The phosphor screen is the main light source, rim-lighting the crab. 16:9 wide banner, focal point right-of-center, edges dark and quiet with generous text-safe margins, no text anywhere except the single screen line.
```

### og-image.png — social share card

1200×630 PNG, kept as PNG. Link previews on social platforms. Title text is part of the image here.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a world where a friendly hermit crab in a spiral nautilus shell tends glowing CRT-style terminal windows in a deep forest of warm wood. Social-card composition at exactly 1200×630: the right half holds a rounded, wood-framed terminal screen glowing among dark trees, showing one short legible monospace line "$ hello, world" with a block cursor; the hermit crab mascot perches on the frame's corner, lit by the screen. The left half stays calm and dark for typography: set the title "TerminalVibes" in a chunky, hand-lettered storybook style in cream-tan #dfc09a, with the smaller subtitle "The Terminal for Vibe Coders" beneath it in pale phosphor green #7ee787. Palette, exactly: background deep forest-black #0c110a to #10160d, foliage in forest greens #166534 and #15803d with spring-green #4ade80 glints, screen glow #7ee787 and #86efac, wood and shell in saddle brown #8b5e34 and tan #c89b6d, one small warm amber #fdba74 firefly accent. No blue, no purple, no other text. Bold shapes that survive thumbnail size; emotional beat: warm confidence. Main light source: the phosphor screen.
```

---

## Hero / Introduction

### what-is-terminal.webp — What Is the Terminal? (`section-intro-what`)

16:9. The terminal is a text conversation; terminal vs shell vs console; AI agents speak bash.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where computing lives inside trees and glowing CRT-style terminal windows are magical objects. Cutaway side view, like a dollhouse diagram made warm: on the left, a small friendly hermit crab in a spiral nautilus shell — the course mascot — stands at a wood-framed terminal screen and posts a little paper note reading "ls" into a slot beneath it. Behind the wall, revealed by the cutaway, a gentle clockwork contraption of cogs, ropes, and pneumatic tubes (the shell, the program inside) carries the note deeper to a vast tree of labeled drawers (the computer itself) and ferries an answer back. Queued politely behind the crab, one small brass clockwork songbird holds its own note — the AI agents speak this language too. Palette, exactly: deep forest-black background #0c110a/#10160d, wood and machinery in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a paper, foliage in forest greens #166534 and #15803d, the screen and traveling notes glowing pale phosphor green #7ee787/#86efac, one warm amber #fdba74 lamp inside the machinery. No blue, no purple. Emotional beat: "oh — it's just a conversation." Light source: the screen plus the amber lamp. 16:9, focal point on the note entering the slot, quiet dark edges with text-safe margins, no text except the tiny "ls" note.
```

### terminal-history.webp — A Brief History (`section-intro-history`)

16:9. Unix 1969 at Bell Labs → sh → Bourne → bash 1989 → zsh → today's AI agents. (The real Thompson & Ritchie photo sits beside this banner in the section.)

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell tends glowing terminal windows framed in warm wood. Wide interior shot: a museum corridor grown inside a hollow ancient tree, its growth rings forming alcoves along the curved wall. Era by era, the alcoves hold: a clattering teletype with paper spilling out (1969), a boxy deep-bellied CRT terminal (the Bourne years), a beige tower and screen (bash, 1989), a slim laptop, and in the newest alcove a tiny brass clockwork songbird perched at a modern terminal — today's AI agent, speaking the same language. One continuous thread of pale phosphor-green light runs through every alcove, connecting a single unbroken "$" prompt across fifty years. The hermit crab, wearing tiny round museum-guide spectacles, gestures along the thread with a wooden pointer. Palette, exactly: background deep forest-black #0c110a/#10160d, tree interior in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a highlights, moss in forest greens #166534/#15803d, the connecting thread and screens in phosphor greens #7ee787/#86efac, brass details in warm amber #fdba74, one rust accent #9a3412 on the oldest machine. No blue, no purple. Emotional beat: fifty years, one idea. 16:9, focal point mid-corridor, dark quiet edges, no readable text.
```

### your-machines-terminal.webp — Your Machine's Terminal (`section-intro-shells`)

16:9. macOS is Unix; Windows arrives via the WSL bridge (or Git Bash); Linux is home. Same shell light in every window.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture, soft edges — a forest world where computing lives among trees and glowing terminal windows are warm magical objects. Wide night scene: three treehouse cottages built on branches of one great oak, each with a round window glowing the same pale phosphor green. The first cottage is tidy and elegant with a polished brass knocker (macOS — it was Unix all along); the second is cheerfully hand-built from mismatched planks and patches (Linux — home turf); the third sits in a separate tree entirely, reached by a sturdy wooden bridge with a small lantern-lit gate (Windows — you arrive over the WSL bridge), and a modest rope-ladder shortcut dangles beside the bridge (the lighter Git Bash way in). At the signpost where all paths meet stands the course mascot: a small friendly hermit crab in a spiral nautilus shell, holding a tiny map. Palette, exactly: deep forest-black sky #0c110a/#10160d, foliage in forest greens #166534/#15803d with spring-green #4ade80 glints, identical window glow in phosphor greens #7ee787/#86efac, wood in saddle brown #8b5e34 and tan #c89b6d, cream-tan #dfc09a trim, bridge lantern in warm amber #fdba74. No blue, no purple. Emotional beat: different homes, the same light inside. Light sources: the three windows and one lantern. 16:9, focal point on the three glows, quiet dark edges, no text.
```

### prompt-anatomy.webp — Anatomy of a Prompt (`section-intro-anatomy`)

16:9. `vibe@sandbox:~/projects$` decoded: who, where, whose turn; the blinking cursor; nothing runs until Enter.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell teaches at glowing wood-framed terminal screens. Affectionate close-up: one large rounded CRT screen in a carved warm-wood frame fills the right two-thirds, showing a single big, legible monospace prompt line — "vibe@sandbox:~/projects$" — followed by a fat blinking block cursor. The hermit crab stands on the bottom of the frame with a small wooden pointer, mid-lecture, tapping the "$". Three little parchment ribbon-tags are tied to parts of the line like botanical specimen labels — hand-inked with the single words "who", "where", and "your turn". A brass "Enter" lever on the frame's side sits untouched, gleaming: nothing happens until it's pulled. Palette, exactly: deep forest-black background #0c110a/#10160d with faint fern silhouettes in forest greens #166534/#15803d, the screen glowing pale phosphor greens #7ee787/#86efac, frame and pointer in saddle brown #8b5e34 and tan #c89b6d, parchment tags #f6efe3 with cream-tan #dfc09a ribbons, lever accent in warm amber #fdba74. No blue, no purple. Emotional beat: the cryptic line, made friendly. Light source: the screen itself, rim-lighting the crab. 16:9, focal point on the prompt line, dark quiet edges with text-safe margins, no text beyond the prompt line and the three tag words.
```

---

## Part 1 — First Contact

### opening-terminal.webp — Opening Your Terminal (`section-1-1`)

16:9. It's just an app — Spotlight on macOS, Ctrl+Alt+T on Linux, Windows Terminal's WSL profile. Open five if you like.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a deep forest where computing lives inside trees and terminal windows glow like hearth light. Wide shot at the base of a great mossy tree: a round wooden door stands slightly ajar, spilling warm phosphor-green light onto the forest floor, with a worn doormat and a small hanging lantern. Through the gap, the corner of a glowing prompt is just visible. The course mascot — a small friendly hermit crab in a spiral nautilus shell — holds the door open with one claw, beckoning the viewer in. The deflating-the-myth detail: along the same root line, three more identical round doors stand casually open too, each glowing the same green — it's just an app; open five if you like. Palette, exactly: deep forest-black night #0c110a/#10160d, bark and doors in saddle brown #8b5e34 with tan #c89b6d grain and cream-tan #dfc09a trim, moss and undergrowth in forest greens #166534/#15803d with spring-green #4ade80 tips, door-glow in phosphor greens #7ee787/#86efac, lantern in warm amber #fdba74. No blue, no purple. Emotional beat: it was never locked. Light sources: the open doors and the lantern. 16:9, focal point on the main door, quiet dark edges safe for overlaid text, no text in the image.
```

### first-commands.webp — Your First Commands (`section-1-2`)

16:9. whoami, echo, date, clear — and the on-purpose typo: errors are feedback, not failure.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell has gentle conversations with glowing wood-framed terminal screens. Medium interior shot, a snug tree-hollow study: the hermit crab speaks into an old brass ear-trumpet tube wired to a rounded CRT screen, and the conversation travels as little glowing paper notes through the tube. The screen shows two short legible monospace exchanges: "$ whoami" answered by "vibe", and beneath it "$ ecoh" answered by a gentle "command not found". Beside the screen, the machine's answer to the typo is embodied as a tiny mechanical hand offering the note back with a friendly shrug — nothing broke. A cup of acorn tea steams on the desk; a "clear" squeegee leans against the frame. Palette, exactly: deep forest-black surroundings #0c110a/#10160d, desk and frame in saddle brown #8b5e34 and tan #c89b6d, cream-tan #dfc09a and parchment #f6efe3 notes, moss accents in forest greens #166534/#15803d, screen text and traveling notes in phosphor greens #7ee787/#86efac, tea-steam catching warm amber #fdba74 lamplight. No blue, no purple. Emotional beat: delight — the machine answers, and mistakes cost nothing. Light: the screen plus one amber lamp. 16:9, focal point on the screen exchange, dark quiet edges, no text except the four short screen lines.
```

### getting-help.webp — Getting Help (`section-1-3`)

16:9. --help, man pages, q to quit the pager, tldr pages — and the AI-era move: ask the AI, verify with --help.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where computing lives among trees and a friendly hermit crab in a spiral nautilus shell is the recurring hero. Interior wide shot: a snug library inside a hollow log, shelves packed with tiny bark-bound manuals — one thick tome per command. At the center lectern, a giant open book glows faintly phosphor green like a man page, and the hermit crab reads it through a brass magnifying glass. At the library's back wall, a small wooden exit door bears a single carved letter "q" — the way out of the pager, for everyone who gets stuck exactly once. On a lower shelf sits a friendlier row of thin, cheerful pamphlets (the tldr pages). Perched on the lectern, a small brass clockwork songbird chirps an explanation while the crab checks the big book anyway — ask the AI, verify with the manual. A wise owl librarian watches from above. Palette, exactly: deep forest-black shadows #0c110a/#10160d, wood and books in saddle brown #8b5e34, tan #c89b6d, cream-tan #dfc09a and parchment #f6efe3, moss in forest greens #166534/#15803d, page-glow in phosphor greens #7ee787/#86efac, one warm amber #fdba74 reading lamp. No blue, no purple. Emotional beat: you are never without the manual. 16:9, focal point on the glowing book, quiet dark edges, no text except the carved "q".
```

---

## Part 2 — Moving Around

### where-am-i.webp — Where Am I? (`section-2-1`)

16:9. pwd tells you where you're standing; ls shows what's around you; ls -a reveals the hidden dotfiles.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world whose hero is a small friendly hermit crab in a spiral nautilus shell, and where terminal screens glow pale green among the trees. High overhead three-quarter shot: the hermit crab stands as a tiny explorer on a mossy overlook, holding up a wooden pocket compass whose face is a miniature glowing terminal screen reading "~/projects" in legible monospace (pwd — where am I). Below and beyond, the forest floor reads like a living map: tidy clearings connected by paths, and in the nearest clearing, little parcels and scroll-files laid out in neat rows in the open (ls — what's around me). At the clearing's shaded edge, a few shy parcels wearing dot-shaped masks peek from under leaves — the hidden dotfiles that only show themselves when politely asked (ls -a). Palette, exactly: night ground in deep forest-blacks #0c110a/#10160d, canopy and moss in forest greens #166534/#15803d with spring-green #4ade80 highlights, compass-screen and parcel tags glowing phosphor greens #7ee787/#86efac, wood, parcels and the crab's shell in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a wrapping, one warm amber #fdba74 lantern at the overlook. No blue, no purple. Emotional beat: bearings found. 16:9, focal point on the compass, quiet dark edges, no text except "~/projects".
```

### paths.webp — Paths (`section-2-2`)

16:9. The filesystem is a tree growing down from `/`; absolute vs relative routes; `~`, `.`, `..`; TAB completion prevents typos.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell navigates a landscape of glowing green terminal light and warm wood. Close overhead shot of a hand-drawn parchment trail map pinned to a wooden notice board with brass tacks, lit by a small lantern; the hermit crab presses a "you are here" acorn pin into it. On the map, drawn in storybook cartography: a great root marked with a carved "/" at the top from which every trail descends like an upside-down tree; a heart-marked home cottage labeled "~"; and two routes inked to the same treasure spot — one long formal trail traced all the way from the root "/" (the absolute path), one short dotted hop from the acorn pin (the relative path). Tiny wooden trail signs along the dotted route read ".." and ".". Half-finished lettering on one trail is being completed by a helpful inked quill on its own — TAB completion finishing the word without typos. Palette, exactly: surrounding night in deep forest-black #0c110a/#10160d, parchment map #f6efe3 with cream-tan #dfc09a edges, inked trails in forest greens #166534/#15803d, glowing route highlights in phosphor greens #7ee787/#86efac, board and frame in saddle brown #8b5e34 and tan #c89b6d, lantern in warm amber #fdba74, one rust #9a3412 wax seal. No blue, no purple. Emotional beat: two correct answers to "how do I get there." 16:9, focal point on the two routes, dark quiet edges, no text besides "/", "~", "..", ".".
```

### changing-directories.webp — Changing Directories (`section-2-3`)

16:9. cd moves you through the tree; cd .. climbs; cd ~ goes home; cd - is the back button.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where computing lives among trees, terminal light glows phosphor green, and the recurring hero is a small friendly hermit crab in a spiral nautilus shell. Dynamic wide shot across a moonlit stream: stepping-stone clearings float like giant lily pads, each holding a tiny mossy folder-mound with a glowing name-lantern. The hermit crab is caught mid-joyful-hop between two pads, motion lines and water ripples beneath it (cd — moving between directories). A knotted rope hangs from a branch, worn smooth from use, swinging back toward the pad the crab just left — a small carved tag on it reads "cd -" (the back button). Upstream, a ladder of pads climbs toward a parent clearing (cd ..), and far in the background a warm cottage window glows: home, "~", always one hop away. Palette, exactly: night water and sky in deep forest-blacks #0c110a/#10160d, pads and canopy in forest greens #166534/#15803d with spring-green #4ade80 rims, folder lanterns in phosphor greens #7ee787/#86efac, rope, dock and the crab's shell in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a highlights, the home window in warm amber #fdba74. No blue, no purple. Emotional beat: getting around is play. 16:9, focal point on the mid-air crab, quiet dark edges, no text except the tiny "cd -" tag.
```

### making-things.webp — Making Things (`section-2-4`)

16:9. mkdir grows new branches; mkdir -p builds the whole nested path at once; touch sprouts empty files.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell builds and gardens by the light of phosphor-green terminal screens. Sunny-dusk wide shot of a woodland construction-garden: the hermit crab, wearing a tiny acorn hard-hat, taps a wooden mallet and a nested set of planter boxes grows up out of the earth in one satisfying motion — a box inside a box inside a box, each one sprouting the next like stacked flowerbeds (mkdir -p building the whole path at once). Beside the beds, a seed tray holds a neat row of small blank parchment envelopes just beginning to sprout — empty files, freshly touched, ready to be filled. A blueprint scroll is unrolled on a stump, its plan matching the boxes. A wood-framed terminal screen leans against the fence, softly glowing, overseeing the work. Palette, exactly: deep forest-black treeline #0c110a/#10160d, garden greens in forest #166534/#15803d with bright spring-green #4ade80 shoots, screen and sprouting-glow in phosphor greens #7ee787/#86efac, boxes, tools and shell in saddle brown #8b5e34 and tan #c89b6d, blueprint parchment #f6efe3 with cream-tan #dfc09a, one warm amber #fdba74 work-lantern. No blue, no purple. Emotional beat: making structure feels like gardening. 16:9, focal point on the nested boxes, dark quiet edges, no text.
```

### looking-inside.webp — Looking Inside Files (`section-2-5`)

16:9. cat for a glance, less for a read (q to quit), head and tail for the edges, tail -f follows a growing log.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where a friendly hermit crab in a spiral nautilus shell reads by phosphor-green terminal light in warm wooden rooms. Interior medium shot of a scroll-reading nook inside a hollow trunk: at the center, the hermit crab turns the brass crank of a page-turning lectern that presents one comfortable page of a very long scroll at a time (less) — a small carved "q" latch on its side promises the way out. To the left, a whole scroll lies unrolled in one dramatic spill across the floor, end to end (cat — everything at once). On the shelf, two neatly clipped scroll-ends are displayed like specimens: just the top curl and just the bottom curl (head and tail). And in the corner, one enchanted scroll on a spool quietly grows longer on its own, inch by glowing inch, ticking as new lines arrive — tail -f, following a live log. Palette, exactly: room shadows in deep forest-black #0c110a/#10160d, woodwork in saddle brown #8b5e34 and tan #c89b6d, scrolls in parchment #f6efe3 and cream-tan #dfc09a, moss trim in forest greens #166534/#15803d, glowing script and the growing scroll in phosphor greens #7ee787/#86efac, reading lamp in warm amber #fdba74. No blue, no purple. Emotional beat: reading without ever opening an editor. 16:9, focal point on the lectern, quiet dark edges, no text except the carved "q".
```

---

## Part 3 — Copy, Move, Delete

### copying.webp — Copying (`section-3-1`)

16:9. cp duplicates — the original stays put; cp -r copies a whole folder tree.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell runs small wooden workshops lit by phosphor-green terminal screens. Interior wide shot of a duplicating press inside a tree stump: the hermit crab pulls the lever of a lovingly built wooden copying machine; a single parchment parcel entered on the left, and on the right two absolutely identical parcels now sit side by side — the fresh copy still glowing faintly warm at its edges, the original demonstrably untouched with its wax seal intact. Behind the press, a conveyor of rollers carries an entire open crate stacked with parcels toward the intake — cp -r, the whole folder and everything inside it, queued for duplication. A wood-framed terminal screen on the wall glows with the machine's soft heartbeat. Palette, exactly: workshop shadows in deep forest-black #0c110a/#10160d, machine and crates in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a labels, parcels in parchment #f6efe3, moss and ivy in forest greens #166534/#15803d, screen and copy-glow in phosphor greens #7ee787/#86efac, one rust #9a3412 wax seal, warm amber #fdba74 lamplight. No blue, no purple. Emotional beat: perfect duplicates, zero risk to the original. 16:9, focal point on the twin parcels, dark quiet edges, no text.
```

### moving-renaming.webp — Moving & Renaming (`section-3-2`)

16:9. mv relocates or renames — same command, and the original doesn't stay behind; it silently overwrites an occupied destination.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where computing is handled by a small friendly hermit crab in a spiral nautilus shell, in warm wooden rooms lit by phosphor-green terminal screens. Interior wide shot of a tiny woodland post office: at the counter, the hermit crab in a postal cap carefully peels the old paper name-tag off a parchment parcel and smooths on a fresh one — renaming, same parcel, same contents, new label. Behind it, a rope-and-pulley basket carries a second parcel across the room toward a different pigeonhole shelf — moving, and pointedly, no copy remains at the counter where it started. One shelf slot already holds an occupant: a resident parcel with a small worried face drawn on its tag, and a thin warning ribbon across the slot — the destination mv will silently overwrite if nobody checks. A sorting board of pigeonholes fills the back wall; a wood-framed terminal glows above the counter. Palette, exactly: room shadows in deep forest-black #0c110a/#10160d, counters and shelves in saddle brown #8b5e34 and tan #c89b6d, parcels in parchment #f6efe3 with cream-tan #dfc09a tags, ivy in forest greens #166534/#15803d, screen glow in phosphor greens #7ee787/#86efac, warning ribbon in rust #9a3412, desk lamp in warm amber #fdba74. No blue, no purple. Emotional beat: one gesture, two meanings — and one thing to watch for. 16:9, focal point on the tag being smoothed on, quiet dark edges, no readable text.
```

### deleting.webp — Deleting, Carefully (`section-3-3`)

16:9. THE safety lesson: rm doesn't move files to a trash can — it erases them, immediately and permanently. ls first, then rm.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world whose hero is a small friendly hermit crab in a spiral nautilus shell, where terminal screens glow phosphor green among warm wood. Wide dusk shot at the quiet edge of a clearing: an old stone well with "rm" carved into its rim — and the telling details: no bucket, no rope, no winch. Things dropped in are simply gone. Anywhere else in a storybook there would be a trash can to fish things back out of; here there is pointedly none, just deep dark. The hermit crab holds a parchment parcel over the mouth of the well but has paused, lantern raised in the other claw, reading the parcel's name-tag one more time — look first, then delete. A small weathered sign planted by the well reads "no way back" in worn hand-carved letters. Fireflies keep respectful distance. Palette, exactly: deep forest-black dusk #0c110a/#10160d, well stones anchored by saddle brown #8b5e34 timber and tan #c89b6d, parcel in parchment #f6efe3 with cream-tan #dfc09a tag, moss and grass in forest greens #166534/#15803d, faint firefly and distant-screen glow in phosphor greens #7ee787/#86efac, lantern in warm amber #fdba74, the well's inner dark rimmed with a whisper of rust #9a3412. No blue, no purple. Emotional beat: respect, not fear — caution as a kindness to your future self. 16:9, focal point on the paused claw and label, very quiet edges, no text except the carved "rm" and the sign "no way back".
```

### wildcards.webp — Wildcards (`section-3-4`)

16:9. A glob is a net: the shell casts it over the directory and hands your command whatever it catches. Echo the glob first.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where a friendly hermit crab in a spiral nautilus shell works by the glow of phosphor-green terminal screens. Wide action shot in a moonlit clearing scattered with parchment parcels of every size, each wearing a little name-tag: the hermit crab has cast a beautiful woven net over part of the clearing, and the net's knots are tied in the unmistakable shape of a star — the "*" glob. Beneath the net, every parcel whose tag ends in ".log" glows bright phosphor green, gently gathered; parcels with other tags sit dim and untouched just outside the mesh. One legible tag inside the net reads "build.log". Hanging on the crab's belt is a second, finer net with a single small "?"-shaped knot — the one-character wildcard, for another day. Crucially, the crab hasn't pulled the drawstring yet: it is leaning close, counting what the net caught before committing — echo the glob first, then act. Palette, exactly: deep forest-black night #0c110a/#10160d, grass and canopy in forest greens #166534/#15803d with spring-green #4ade80 blades, caught-parcel glow in phosphor greens #7ee787/#86efac, net fiber, parcels and shell in saddle brown #8b5e34, tan #c89b6d and parchment #f6efe3 with cream-tan #dfc09a tags, one warm amber #fdba74 lantern on a stick. No blue, no purple. Emotional beat: one pattern, many catches — count before you commit. 16:9, focal point on the glowing catch, quiet dark edges, no text except "build.log".
```

---

## Part 4 — Text & Pipes

### redirection.webp — Redirection (`section-4-1`)

16:9. > reroutes output into a file and truncates first; >> appends; 2> catches the error stream separately.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell operates gentle wooden machinery lit by phosphor-green terminal light. Wide shot of a hillside aqueduct at night: glowing green water — a command's output — pours from the spout of a wood-framed terminal screen into hand-carved wooden channels. The crab works a set of gate levers where the flow divides. Channel one (a single chevron ">" carved on its gate) empties a barrel completely before refilling it — a small startled fish watches its old water vanish over the side, the picture of "truncates first." Channel two (a double ">>" carved on its gate) tops up an already-full barrel gently from the surface, everything below preserved. Off to the side, a narrow rusty gutter labeled with a carved "2" catches a thin, murky rust-tinged trickle that separates itself from the clean flow — the error stream, bottled into its own small pot. Palette, exactly: deep forest-black hillside #0c110a/#10160d, channels and barrels in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a rims, moss in forest greens #166534/#15803d, the flowing output in phosphor greens #7ee787/#86efac, the error trickle in rust #9a3412, lever handles catching warm amber #fdba74 lantern light. No blue, no purple. Emotional beat: plumbing you can trust — once you know which gate does what. 16:9, focal point on the emptying barrel, quiet dark edges, no text except the carved ">", ">>" and "2".
```

### pipes.webp — Pipes (`section-4-2`)

16:9. The superpower: a pipe connects the output of one command to the input of the next. Small tools, composed — the Unix philosophy.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where computing runs on water, wood, and phosphor-green light, tended by a small friendly hermit crab in a spiral nautilus shell. Grand wide establishing shot, the signature image of the course: a whimsical chain of humble wooden watermill machines threads through a moonlit forest along a single glowing stream, each connected to the next by bamboo pipes. Machine one is a simple sieve wheel (filtering), machine two a sorting flume with tipping trays (ordering), machine three a counting clacker with a tally drum (tallying) — each machine small, single-purpose, almost toy-like, yet together the line turns a churning inflow into one bright, orderly ribbon of light at the end. No single machine could have done it; the pipe is the magic. The hermit crab conducts from a stump with a twig baton, utterly content. Fireflies follow the stream. Palette, exactly: deep forest-black night #0c110a/#10160d, machinery in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a paddles, canopy in forest greens #166534/#15803d with spring-green #4ade80 leaf glints, the piped stream glowing phosphor greens #7ee787/#86efac, brass fittings in warm amber #fdba74. No blue, no purple. Emotional beat: small tools, composed into something wonderful — the Unix philosophy as a watermill symphony. 16:9, focal point mid-chain where water passes machine to machine, quiet dark edges safe for text, no text in the image.
```

### grep.webp — Searching Text (`section-4-3`)

16:9. grep keeps only the lines that match — the haystack goes in, the needles come out. -i, -n, -r, -v for the variations.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell solves mysteries by phosphor-green terminal light. Interior night shot of a detective's study inside a hollow trunk: hundreds of parchment strips — the lines of a huge log file — hang from wooden rails in overlapping rows, floor to ceiling, a proper haystack. The hermit crab, wearing a tiny deerstalker cap, sweeps a warm brass magnifying glass across them; wherever the lens passes, only the strips containing the word "ERROR" ignite in bright phosphor green and seem to lift slightly off the rail, while every other strip stays dim and sleepy. One glowing strip is legible: "ERROR: crash at 03:12". On the desk, a pin-board carries a few captured strips connected by red string — the case coming together. A stack of unsearched scroll-crates by the door hints at -r, whole directories still to sweep. Palette, exactly: study shadows in deep forest-black #0c110a/#10160d, woodwork in saddle brown #8b5e34 and tan #c89b6d, strips in parchment #f6efe3 with cream-tan #dfc09a edges, ivy in forest greens #166534/#15803d, matching-line glow in phosphor greens #7ee787/#86efac, the pin-board string in rust #9a3412, desk lamp in warm amber #fdba74. No blue, no purple. Emotional beat: the needle found; the haystack undisturbed. 16:9, focal point on the lens and the lit strip, quiet dark edges, no text except "ERROR: crash at 03:12".
```

### counting-shaping.webp — Counting & Shaping (`section-4-4`)

16:9. wc counts, sort orders, uniq collapses (needs sorted input), cut slices columns — and sort | uniq -c | sort -rn ranks everything.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where a friendly hermit crab in a spiral nautilus shell runs harvest machinery under phosphor-green lantern light. Interior wide shot of a sorting barn at night: glowing berries — lines of text — pour from a chute into a wooden sorting flume that settles them into neat like-with-like rows (sort). Down the line, identical berries stack themselves into little towers, and beside each tower a small chalk slate shows a tally count (uniq -c). At the end of the line the towers stand rearranged tallest-first on a display shelf, the winner wearing a tiny ribbon (sort -rn — biggest first). On a side bench, a fine wooden comb-blade slices a striped fruit into clean columns, keeping only the second stripe (cut), and a click-counter clacks away totting up everything that passed (wc). The hermit crab chalks the final count, satisfied. Palette, exactly: barn shadows in deep forest-black #0c110a/#10160d, timber and machines in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a slats, berry-glow and tally marks in phosphor greens #7ee787/#86efac, foliage through the door in forest greens #166534/#15803d, the winner's ribbon in warm amber #fdba74, one rust #9a3412 crate stamp. No blue, no purple. Emotional beat: a raw pile in, a ranked answer out. 16:9, focal point on the ranked towers, quiet dark edges, no readable text.
```

### finding-files.webp — Finding Files (`section-4-5`)

16:9. find walks the whole tree and reports every path that matches — find is for filenames, grep is for contents.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell searches by lantern and phosphor-green terminal light. Wide night shot of a great tree rendered as a living filesystem: branches fork into smaller branches, and parcels — files — rest in knotholes, under leaf piles, down in root burrows, everywhere. The hermit crab walks the tree with a lantern whose beam is uncannily thorough, and wherever the light passes, every parcel whose name-tag matches lights up phosphor green no matter how deep it hides — one in the highest knothole, one under leaves, one down a burrow — while non-matching parcels stay dark. One legible glowing tag reads "notes.md". The beam clearly traces the whole tree, trunk to twig: find walks everything. In a lit window across the clearing, a second silhouette bends over a single open scroll with a magnifying glass — the other detective, grep, who reads what's inside files instead. Palette, exactly: deep forest-black night #0c110a/#10160d, bark and parcels in saddle brown #8b5e34 and tan #c89b6d with parchment #f6efe3 and cream-tan #dfc09a tags, canopy in forest greens #166534/#15803d with spring-green #4ade80 edges, match-glow in phosphor greens #7ee787/#86efac, the lantern flame in warm amber #fdba74. No blue, no purple. Emotional beat: nothing stays lost. 16:9, focal point on the beam sweeping the trunk, quiet dark edges, no text except "notes.md".
```

---

## Part 5 — Permissions & Environment

### reading-ls-l.webp — Reading ls -l (`section-5-1`)

16:9. Ten characters, three audiences: rwx for user, group, and other — the file's complete rulebook at a glance.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell decodes the rules of things by phosphor-green terminal light. Medium interior shot in a wooden hall: a grand carved door bears a brass plaque with ten inlaid letter-tiles, large and legible — "-rwxr-xr--" — each tile catching the light individually, like a combination everyone is allowed to read. Before the door wait three visitors in a polite queue: the hermit crab itself holding a full ring of three keys (the user — read, write, run), a round amiable badger holding two keys (the group), and a passing squirrel with just one small key (everyone else). The crab, doubling as guide, points a wooden pointer at the tiles, matching key-rings to letters. A wood-framed terminal glows on the side wall showing nothing but a soft cursor — the same information, screen and door. Palette, exactly: hall shadows in deep forest-black #0c110a/#10160d, door and paneling in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a carving, plaque and keys in warm amber #fdba74 brass, moss trim in forest greens #166534/#15803d, tile-glow and screen in phosphor greens #7ee787/#86efac. No blue, no purple. Emotional beat: ten characters, the whole story. 16:9, focal point on the plaque, quiet dark edges, no text except "-rwxr-xr--".
```

### chmod.webp — chmod (`section-5-2`)

16:9. chmod +x flips the execute switch — the one-line fix for "Permission denied"; 755 and 644 as recipes on the wall.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where a friendly hermit crab in a spiral nautilus shell runs a locksmith's bench by phosphor-green lamplight. Close interior shot of the workbench inside a knothole: the hermit crab presses a brass seal-stamp onto a rolled script-scroll, leaving a small glowing green wax seal shaped like a letter "x" — and at that exact moment the scroll pops out two tiny wooden legs and stands up, ready to run. Execute permission, granted; "Permission denied" cured. Beside the bench, a rejected moment memorialized: the same scroll earlier, legless, slumped against a little sign reading "denied". On the pegboard behind hang labeled recipe-tags for the standard mixes — one tag carved "755", one carved "644" — with small key-ring icons showing who gets what. A modest wood-framed terminal glows above the bench. Palette, exactly: workshop shadows in deep forest-black #0c110a/#10160d, bench and pegboard in saddle brown #8b5e34 and tan #c89b6d, scroll in parchment #f6efe3 with cream-tan #dfc09a ribbon, the wax seal and its glow in phosphor greens #7ee787/#86efac over a spring-green #4ade80 flare, ivy in forest greens #166534/#15803d, the stamp's brass in warm amber #fdba74, "denied" sign in rust #9a3412. No blue, no purple. Emotional beat: permissions are just stamps — and you hold the stamp. 16:9, focal point on the seal meeting the scroll, quiet dark edges, no text except "755", "644", "denied".
```

### sudo.webp — sudo (`section-5-3`)

16:9. Borrowed superpowers for exactly one command — handle with respect. Never sudo what you don't understand, especially what an AI wrote.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell treats power with storybook seriousness, lit by phosphor-green terminal glow. Medium shot deep among the roots: a grand iron-banded door set into the living rootwork, taller than everything else in the frame, warm light pressing quietly through its seams — the room where the system's rules can be overridden. The hermit crab stands before it holding a single large ceremonial key on a loop of cord, but it has paused: in its other claw is a small parchment note — the command it is about to run — and it is reading it one more time before the key turns. An old stag-beetle gatekeeper in a tiny waistcoat watches from a root ledge, neither hostile nor smiling; beside the door a modest hourglass stands, its sand nearly out — borrowed power lasts exactly one command. Palette, exactly: root-cellar darkness in deep forest-black #0c110a/#10160d, roots and door timber in saddle brown #8b5e34 and tan #c89b6d, iron bands with rust #9a3412 rivets, the through-the-seams light in warm amber #fdba74, moss in forest greens #166534/#15803d, the note and a distant terminal's glow in phosphor greens #7ee787/#86efac. No blue, no purple. Emotional beat: real power, real pause — respect, not fear. 16:9, focal point on the paused key and note, very quiet edges, no readable text.
```

### env-vars.webp — Environment Variables (`section-5-4`)

16:9. A backpack of named values every command carries; $PATH is the list of places the shell searches — and why "command not found" happens.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where a friendly hermit crab in a spiral nautilus shell keeps the shell's secrets in a warm wooden pantry lit by phosphor-green light. Interior wide shot: floor-to-ceiling pantry shelves of glass jars, each hand-labeled in tidy ink — legible labels on the front row read "$HOME" (a tiny glowing cottage inside), "$USER" (a small name-tag), and "$PATH" (a folded strip of miniature signposts, unspooling like a map). At the counter, the crab in an apron packs a little canvas backpack for a departing courier snail — every command that leaves this pantry carries the same backpack of named values, filled from these jars. On the floor by the door, a puzzled woodland mouse holds up a note reading "command not found"; the crab lifts the "$PATH" jar down toward it — the answer was always in the jar: the shell only looked where the signposts point. Palette, exactly: pantry shadows in deep forest-black #0c110a/#10160d, shelves in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a label cards, jar contents glowing phosphor greens #7ee787/#86efac, herbs and ivy in forest greens #166534/#15803d, lamplight in warm amber #fdba74, one rust #9a3412 jar lid. No blue, no purple. Emotional beat: it was never magic — just jars. 16:9, focal point on the "$PATH" jar changing hands, quiet dark edges, no text except "$HOME", "$USER", "$PATH", "command not found".
```

### shell-config.webp — Your Shell Config (`section-5-5`)

16:9. .bashrc / .zshrc runs at every shell startup; aliases are your shortcuts; source reloads without reopening.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world whose hero — a small friendly hermit crab — literally lives in a spiral nautilus shell, here lovingly renovated by phosphor-green lamplight. Interior cutaway shot into the crab's own shell, revealed as a snug den mid-decoration: the crab pins short ribbon-shortcuts to a cork board (its aliases — one legible ribbon reads "gs → git status"), hangs a little wind chime, paints trim. Open on the desk lies a bark-bound journal titled ".bashrc" in neat ink — the den's morning routine, read aloud by the house every time the crab wakes. The magical beat: the crab tips a small watering can over the journal and a soft green shimmer washes through the whole den, every ribbon and chime glowing briefly as the changes take effect at once — source, no need to move out and back in. A round window in the shell wall glows terminal-green onto the scene. Palette, exactly: den shadows in deep forest-black #0c110a/#10160d, shell interior and furniture in saddle brown #8b5e34, tan #c89b6d and cream-tan #dfc09a, the journal in parchment #f6efe3, ivy and ferns in forest greens #166534/#15803d, the shimmer and window in phosphor greens #7ee787/#86efac with spring-green #4ade80 sparks, lamplight in warm amber #fdba74. No blue, no purple. Emotional beat: your shell, your den. 16:9, focal point on the watering-can shimmer, quiet dark edges, no text except ".bashrc" and "gs → git status".
```

---

## Part 6 — Terminal for the AI Era

### read-before-you-run.webp — Read Before You Run (`section-6-1`)

16:9. The chapter the course exists for: auditing AI-proposed commands. The agent proposes, the permission prompt appears, and the human reads before stamping approval — including commands the agent was tricked into proposing.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where a friendly hermit crab in a spiral nautilus shell supervises helpful machines by phosphor-green terminal light. Medium shot at a night desk, the emotional core of the whole course: a well-meaning brass clockwork songbird — an AI coding agent — has just delivered a scroll of proposed commands and waits, head tilted, genuinely eager. The hermit crab reads the scroll under a lantern with a brass magnifying glass, unhurried. On the scroll, three short monospace lines: two glow calm phosphor green, but one line is written in a different, spikier hand and sprouts tiny thorns off the parchment — a command the bird was tricked into carrying, picked up somewhere in the woods; a burr from that place still clings to the bird's satchel. In front of the crab sit two wooden stamps — one round "ALLOW" stamp glowing soft green, one square "DENY" stamp in rust — and the big brass Enter lever beyond them remains untouched. The crab's claw hovers over the stamps, verdict forming. Palette, exactly: deep forest-black night #0c110a/#10160d, desk and stamps in saddle brown #8b5e34 and tan #c89b6d, scroll in parchment #f6efe3 with cream-tan #dfc09a edges, safe lines and screen glow in phosphor greens #7ee787/#86efac, the thorned line and DENY stamp in rust #9a3412, lantern and the bird's brass in warm amber #fdba74, ferns in forest greens #166534/#15803d. No blue, no purple. Emotional beat: the pause is the power — nothing runs until you say so. 16:9, focal point on the scroll and hovering claw, quiet dark edges, no text except "ALLOW" and "DENY".
```

### first-script.webp — Your First Script (`section-6-2`)

16:9. A script is just commands you saved: shebang first line, chmod +x, run with ./ — and $1 makes it reusable for any folder.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world where a friendly hermit crab in a spiral nautilus shell builds gentle machines by phosphor-green lamplight. Interior medium shot of a workshop bench: the hermit crab feeds a hand-written recipe scroll into a lovely wooden music-box machine. The scroll's first line is legible monospace — "#!/usr/bin/env bash" — followed by a few soft unreadable steps; a small glowing green wax seal shaped like an "x" hangs from its ribbon (chmod +x, already stamped), and the machine's brass start-plate is engraved "./" — you point at the recipe right here to run it. As the scroll winds through, tiny hammers replay each saved step in order: one hammer stacks a miniature parcel into a miniature crate labeled "backups" — the backup happening by itself. The reusability beat: the recipe has one inlaid blank slot shaped like a luggage tag, marked "$1", and beside the machine wait two different folder-parcels — "notes" and "recipes" — either of which fits the slot. Teach the file once, run it on anything. Palette, exactly: workshop dark in deep forest-black #0c110a/#10160d, machine and bench in saddle brown #8b5e34 and tan #c89b6d with warm amber #fdba74 brass, scroll in parchment #f6efe3 with cream-tan #dfc09a, seal and screen glow in phosphor greens #7ee787/#86efac, ivy in forest greens #166534/#15803d. No blue, no purple. Emotional beat: automation as a saved recipe, not a mystery. 16:9, focal point on the scroll entering the machine, quiet dark edges, no text except "#!/usr/bin/env bash", "$1", "./" and the tiny labels "backups", "notes", "recipes".
```

### exit-codes.webp — Exit Codes & Chaining (`section-6-3`)

16:9. Every command reports 0 or failure; && runs on success, || on failure, and ; ignores the report — the classic cd ; rm horror story.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where a friendly hermit crab in a spiral nautilus shell runs a miniature night railway by phosphor-green signal light. Wide shot of a tabletop-scale switchyard among tree roots: little wooden carts roll out of a testing shed, and every cart flies a pennant declaring how its run went — a green pennant embroidered "0" for success, or a rust-red pennant for failure. Ahead, the track forks at a polished lever switch operated by the crab: the success track crosses a handsome bridge whose gate is carved "&&" (only green pennants pass), while the failure track curves gently into a warm repair siding whose gate is carved "||" — a lantern-lit workshop, not a punishment. The cautionary detail: off to the side, an old disused third track runs straight through a broken gate carved ";" — its signal box dark, ignoring pennants entirely — fenced off with a small rope and a worried little sign. A terminal screen on the shed wall glows with a single legible "$?". Palette, exactly: deep forest-black night #0c110a/#10160d, track and carts in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a trim, success pennants and signal lamps in phosphor greens #7ee787/#86efac with spring-green #4ade80, failure pennants and the ";" gate in rust #9a3412, workshop lantern in warm amber #fdba74, moss in forest greens #166534/#15803d. No blue, no purple. Emotional beat: one small number decides the branch — and the connector that ignores it is the dangerous one. 16:9, focal point on the fork, quiet dark edges, no text except "0", "&&", "||", ";", "$?".
```

---

## Part 7 — Your Cockpit

### make-it-yours.webp — Make It Yours (`section-7-1`)

16:9. Themes, fonts, and prompts: the refreshed stock Terminal.app, iTerm2, the fast minimal Ghostty, the account-and-credits Warp — plus a Starship prompt charm.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where a friendly hermit crab in a spiral nautilus shell shops for its perfect window by phosphor-green lantern light. Wide shot of a small night market in a clearing — four charming stalls, each selling a different style of glowing terminal window, all showing the same soft green prompt inside. Stall one: a beloved old cottage window, clearly just lovingly repainted and re-glazed, "freshly restored" bunting overhead — the stock terminal, good again. Stall two: a generous power-user's window festooned with dozens of swatch cards of color schemes and split hinges — the tinkerer's choice. Stall three: an almost weightless, wonderfully plain window that somehow glows the brightest and cleanest, no ornament at all, its little price tag reading "free" — the fast minimal upgrade. Stall four: the flashiest booth, ringed with signup clipboards, a coin-slot meter ticking beside its AI-assistant parrot — nice window, mind the meter. The crab stands at a jewelry side-cart trying prompt charms on a cord — tiny glyphs for directory and git branch, and a little star-shaped charm that glows brightest (the Starship prompt) — while one stall screen legibly shows "~/projects >". Palette, exactly: night market dark #0c110a/#10160d, stalls in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a canopies, all window glow in phosphor greens #7ee787/#86efac, foliage in forest greens #166534/#15803d, bunting and charms in warm amber #fdba74, the coin meter in rust #9a3412. No blue, no purple. Emotional beat: same shell inside every window — choose the room you'll love. 16:9, focal point on the crab and charms, quiet dark edges, no text except "free" and "~/projects >".
```

### history-superpowers.webp — History Superpowers (`section-7-2`)

16:9. The shell remembers everything: up-arrow, history | grep, !! (and sudo !!), and Ctrl+R reverse search — the biggest speed unlock.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell keeps perfect records by phosphor-green light. Interior wide shot of a memory attic inside a tree crown: a brass player-piano-style archive machine spools an endless paper ribbon of every command ever typed, the ribbon looping up and around the rafters in glowing coils. The crab rides a small pulley basket up the ribbon, hand over hand — the up-arrow, one command back per pull. Mounted on the machine, a swiveling warm searchlight lens slides along the ribbon and pins one old line in its beam, legible in monospace: "ssh forest-server" — Ctrl+R, three letters and last Tuesday's command is back. On the machine's front sits a chunky repeat-stamp engraved "!!" beside a smaller dignified key labeled "sudo" — the legendary combo, resubmit the last line with authority. A sieve tray on the desk filters ribbon segments — history piped through grep. Palette, exactly: attic dark in deep forest-black #0c110a/#10160d, machine and rafters in saddle brown #8b5e34 and tan #c89b6d with warm amber #fdba74 brass, ribbon in parchment #f6efe3 and cream-tan #dfc09a with phosphor-green #7ee787/#86efac ink, ivy in forest greens #166534/#15803d, one rust #9a3412 lever knob. No blue, no purple. Emotional beat: nothing you typed is ever lost — fluency is recall, not typing. 16:9, focal point on the searchlight beam, quiet dark edges, no text except "ssh forest-server", "!!" and "sudo".
```

### vscode-terminal.webp — Terminal in VS Code (`section-7-3`)

16:9. Editor above, terminal below, one window — where vibe coding actually happens: the agent runs commands in the same pane you can read, with per-command approval and an allow/deny list.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, set in a forest world where a friendly hermit crab in a spiral nautilus shell works alongside helpful clockwork machines by phosphor-green light. Interior wide shot of a two-story treehouse study built into one window frame — the abstract, cozy spirit of an editor with its terminal panel, no brand marks. The upper story glows softly with pinned parchment pages of code being written; the lower story is a proper wood-framed terminal, phosphor green, connected to the upper floor by a small wooden ladder. In the lower terminal two desks share the same glow: at one, a brass clockwork songbird — the coding agent — is about to pull a miniature command lever, but the lever passes through a charming little toll-gate first: a two-slot wooden letterbox mounted on the frame, its slots carved "allow" and "deny", with a short pinned list beside it showing a few pre-approved green tokens and a few rust-red barred ones — the allowlist and denylist. At the second desk sits the hermit crab, reading the same pane, one claw resting near the gate: per-command approval, human in the loop. A small "+" tile on the frame edge hints at spawning one more terminal — one for the agent, one for you. Palette, exactly: study dark in deep forest-black #0c110a/#10160d, timber in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a trim, pages in parchment #f6efe3, both stories' glow in phosphor greens #7ee787/#86efac, foliage in forest greens #166534/#15803d, the bird's brass and lamplight in warm amber #fdba74, denied tokens in rust #9a3412. No blue, no purple. Emotional beat: human and AI sharing one shell — participant, not spectator. 16:9, focal point on the toll-gate moment, quiet dark edges, no text except "allow", "deny", "+".
```

### many-terminals.webp — Many Terminals at Once (`section-7-4`)

16:9. Tabs and splits become an agent-fleet dashboard: one agent per pane, each on its own copy of the project; a server pane, a tail -f pane — and tmux panes that survive sleep.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a friendly hermit crab in a spiral nautilus shell conducts many glowing terminal windows at once. Wide interior shot of a grand wooden cabinet wall — a beehive of rounded terminal panes in a warm timber grid, each pane its own little glowing room. The 2026 twist, front and center: in three of the panes, small brass clockwork songbirds — AI agents — each work busily at their own tiny desk-island, and each island visibly sits on its own separate potted sapling of the same tree (one worktree per agent, no collisions). Other panes hold the classics: one pane's machinery hums steadily with a little water-wheel that never stops (the dev server), one pane's scroll grows line by line on a spool (tail -f on a log), one pane is empty with a patient blinking cursor — the free prompt. One pane at the edge is tucked under a tiny quilt yet still softly glowing — the multiplexer session that survives sleep and lost connections. Below the wall, the hermit crab sits on a mushroom swivel-stool with a twig baton, eyes sweeping pane to pane, approving and course-correcting — a fleet conductor. Palette, exactly: room dark in deep forest-black #0c110a/#10160d, cabinet timber in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a mullions, every pane glowing phosphor greens #7ee787/#86efac with spring-green #4ade80 flickers, saplings in forest greens #166534/#15803d, birds' brass and one desk lamp in warm amber #fdba74, a single rust #9a3412 warning flag raised in one agent's pane awaiting review. No blue, no purple. Emotional beat: calm parallelism — ten shells, one unhurried supervisor. 16:9, focal point on the crab's sweeping gaze, quiet dark edges, no text.
```

---

## Part 8 — Conclusion

### mindset.webp — The Command-Line Mindset (`section-8-1`)

16:9. Three ideas that stick: compose small tools, read before you run, the terminal is the AI-native interface. Not a spectator — a pilot.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world whose small hero — a friendly hermit crab in a spiral nautilus shell — has finished its apprenticeship among glowing terminal windows and warm wood machines. Grand wide shot at first light: the crab stands at the top of the forest canopy on a lookout platform, wearing a tiny aviator scarf, one claw resting on a small brass pilot's wheel mounted at the rail — a pilot now, not a passenger. Its shell is decorated with every small charm collected through the course: a woven star-net, a brass key, a magnifying glass, a green wax "x" seal, a tiny "0" pennant, a little round approval stamp. Below, the whole storybook world is visible at once and finally reads as one system: the watermill pipe-chain, the jar pantry, the post office, the stone well, the switchyard, the treehouse study — all connected by a single glowing phosphor-green stream that winds through everything. Beside the crab on the rail perches its brass clockwork songbird, quiet and companionable, looking out at the same view. Palette, exactly: pre-dawn sky lifting from deep forest-black #0c110a/#10160d, canopy in forest greens #166534/#15803d with spring-green #4ade80 dew glints, the connecting stream and every window in phosphor greens #7ee787/#86efac, platform, wheel and charms in saddle brown #8b5e34, tan #c89b6d and warm amber #fdba74, cream-tan #dfc09a scarf. No blue, no purple. Emotional beat: it was one system all along — and it answers to you. 16:9, focal point on the crab at the wheel, quiet dark edges, no text.
```

### quick-reference.webp — Quick Reference (`section-8-2`)

16:9. Every command from the course, one glance away — a beloved tool-roll, oiled and ready.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, set in a forest world where a friendly hermit crab in a spiral nautilus shell keeps its tools by phosphor-green lamplight. Overhead close shot, tabletop still-life: a beautifully organized leather-and-canvas tool roll lies unrolled on a warm wooden workbench, every pocket holding one small gleaming tool, each with a tiny stamped brass name-tag. Four tags are legible in clean monospace — "ls", "cd", "grep", "rm" — the rest soft and out of focus, a full course's worth of pockets. The tools themselves rhyme with their commands in miniature: a tiny lantern by "ls", a walking cane by "cd", a magnifier by "grep", and by "rm" a small tool sheathed in its own guard-cap — the only one stored with a safety on. Everything is oiled, worn smooth with use, deeply cared for. The hermit crab's claws enter frame from the bottom edge, tying the roll's cream ribbon; a wood-framed terminal glows quietly at the bench's top edge. Palette, exactly: bench and leather in saddle brown #8b5e34 and tan #c89b6d with cream-tan #dfc09a stitching, background falling to deep forest-black #0c110a/#10160d, tag-glow and screen in phosphor greens #7ee787/#86efac, a sprig of fir in forest greens #166534/#15803d, brass tags in warm amber #fdba74, the rm guard-cap in rust #9a3412. No blue, no purple. Emotional beat: the whole course, pocket-sized and within reach. 16:9, focal point on the four named tools, quiet dark edges, no text except "ls", "cd", "grep", "rm".
```

### final-challenge.webp — The Final Challenge (`section-8-3`)

16:9. One gloriously messy home folder, no instructions: explore it, sort it, hunt down the hidden phrase, and finish with a small executable script.

```
Whimsical, cozy children's-storybook illustration with painterly gouache texture, from a forest world whose hero — a small friendly hermit crab in a spiral nautilus shell — is about to take its final exam by phosphor-green lantern light. Wide shot of the crab's own home clearing, gloriously messy for once: months of parchment parcels and scrolls drifted into heaps, a leaning tower of unsorted files against the fence, a tangle of old log-ribbon fluttering from a branch. The three tasks hide in plain storybook sight: a cluster of empty labeled crates waits to receive the sorted mess; deep inside one heap, a single scroll-edge glints phosphor green — the one file holding the phrase to find; and on the front stump lie a blank recipe scroll, a quill, and the brass "x" seal-stamp — the script still to be written. The crab stands at the center with rolled-up resolve, tool-roll open at its feet, lantern lit, completely unafraid; its clockwork songbird perches on the fence, told kindly to only watch tonight. A small wooden sign by the gate reads "no instructions". Palette, exactly: night clearing in deep forest-black #0c110a/#10160d, mess and crates in saddle brown #8b5e34, tan #c89b6d, parchment #f6efe3 and cream-tan #dfc09a, undergrowth in forest greens #166534/#15803d, the glinting scroll and home window in phosphor greens #7ee787/#86efac, lantern in warm amber #fdba74, one rust #9a3412 ribbon in the tangle. No blue, no purple. Emotional beat: exam-night calm — you are ready for this. 16:9, focal point on the crab amid the mess, quiet dark edges, no text except "no instructions".
```

### keep-learning.webp — Keep Learning (`section-8-4`)

16:9. The course ends, the prompt keeps going: six references on the horizon (the book, the wargame, explainshell, tldr, the man pages, the AI vendor's own guide), and one path onward to Git.

```
Whimsical, cozy children's-storybook illustration, painterly gouache texture and soft edges, from a forest world where a small friendly hermit crab in a spiral nautilus shell has just finished its apprenticeship among glowing terminal windows. Wide dusk shot at a threshold: in the left foreground, the corner of the crab's warm study — desk edge, a closed and well-worn workbook with a terminal-prompt emboss on its bark cover, the home terminal window still glowing, door left open behind. From the doorway, a path of stepping stones — each faintly phosphor-lit, the first few shaped subtly like ">" prompts — leads out into a vast night forest. On the horizon, exactly six distant warm windows glow among the trees at different heights and depths: one shaped like a thick book, one like a castle gate with tiered lights (the wargame with levels), one like a magnifying lens, one like a small friendly pamphlet stand, one like a tall library window, one like a modern lodge with a tiny brass bird on its roof. Farther still, one grander tree glows with branching, forking limbs of light — the next course, where branches and merges live. The crab stands on the first stone with a tiny knapsack, its clockwork songbird on its shell, both looking outward. Palette, exactly: night in deep forest-black #0c110a/#10160d, study and stones in saddle brown #8b5e34, tan #c89b6d and cream-tan #dfc09a, forest in greens #166534/#15803d with spring-green #4ade80 fireflies, stone-glow and all seven distant lights in phosphor greens #7ee787/#86efac warmed by amber #fdba74, one rust #9a3412 knapsack strap. No blue, no purple. Emotional beat: commencement — home stays lit, and the path continues. 16:9, focal point on the crab at the first stone, quiet dark edges, no text.
```
