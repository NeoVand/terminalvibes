# Course redesign checkpoint

September 13, 2026. This records implemented behavior, separate from the original audit and proposed future chapter structure.

## Content and learning tools

- Rewrote the introduction and all fourteen chapters in connected, adult beginner language. The original chapter URLs and anchors remain available.
- Put a live five-step first command exercise at the beginning: hello, personal variation, typo, repair, and cancellation. Terminology and history are optional reading afterward.
- Added a seven-step keyboard workshop and a shared cursor-aware playground editor: movement, word removal, restoration, history, completion, and cancellation. Native Bash/zsh differences and browser-reserved shortcuts are explained.
- Added a file editor sharing the practice terminal's filesystem. The new seed-list exercise requires a saved change and a readback. Dirty drafts, undo/redo, reset, and non-shareable editor changes have explicit behavior.
- Revised 36 scenario exercises and challenge feedback. Exploration is welcomed; outcome checks come before optional efficiency comparisons.
- Expanded practical scripts, conditions, loops, error handling, quoted paths, command status, modern search tools, and terminal sessions. Native-only examples are labeled and do not pretend the simulator implements every Bash feature.
- Separated example input from printed replies. Updated course retrieval, search, sidebar entries, and the reading rail to match the actual new content, including optional closed sections.
- Reworked the reference panel around learner intent and lesson context. Keyboard entries open practice; command templates require their values before copying. Regenerated and visually reviewed the eight-page printable reference.

## Optional cloud tutor

OpenAI and Anthropic connect directly from the browser to fixed provider endpoints. Keys remain in page-session memory and are cleared on disconnect or reload. A request begins only when the learner asks a question. Course context and optional recent practice context are disclosed; every proposed sandbox command requires approval.

The model picker reads a checked-in catalog. A monthly GitHub Actions workflow proposes catalog changes from official public documentation in a PR, without provider secrets or automatic merging. Exact model IDs are also supported. The workflow becomes scheduled after reaching the default branch.

The site remains an adapter-static GitHub Pages site. There is no application server or credential relay.

## Validation completed before artwork generation

- 594 Vitest checks, five catalog checks, and four content extraction checks passed.
- All 85 production browser tests passed, including desktop/mobile reference interactions, first-command practice, keyboard gestures, editor state, tutor privacy/approval/cancellation, and reading navigation.
- Svelte checking reported zero errors and warnings at the content checkpoint.
- Native-shell fixture checks covered representative chapter examples and script failure cases; those are not a claim of universal platform compatibility.
- Inspected the working opening in the browser and all eight pages of the printable reference.

The provider tests use mocked API responses. No authenticated paid-provider run or new learner observation has been performed. Automated checks establish functional behavior, not that the teaching is now effortless for every beginner. A fresh observation with the intended learner remains valuable evidence after this implementation.

## Artwork phase

The owner has narrowed this phase to new sections only, matching the existing artwork exactly. Existing course illustrations remain. Ten teaching concepts each receive five generated alternatives: keyboard movement, saving an editor draft, four scripting explanations, and four modern-tool explanations. The gallery and prompt generator use an explicit review scope so earlier replacement plans cannot restart accidentally.

The original reference style is near-black woodland, aged brass, warm parchment, green terminal lettering, and intricate natural hermit crabs. Each new brief includes original-file references, exact teaching text, and technical checks. The rejected replacement-art rounds remain archived outside static output. No image is selected automatically; final insertion follows owner choice.

All fifty candidates are generated and available in the local `/art-review` gallery: five distinct compositions for each of the ten concepts. The original reference files were supplied directly to the generator. Visual review covered the teaching text, commands, diagram connections, and fit with the original artwork. Targeted corrections fixed the search examples and a misleading directory prompt.

The local provenance audit verified fifty unique generated originals and fifty unique WebP candidates, matching source hashes, exact saved prompts, unchanged frame dimensions, and no automatic selections. The candidates total 20,909,372 bytes. The availability scan reports 50/50. Gallery refresh preserves the owner's choices; completed generation is not owner approval.

The owner supplied all ten choices on September 13, 2026. Every exported hash matched its candidate. The selections are installed in the keyboard workshop, saved-file exercise, scripting explanations, and modern-tool explanations, with descriptive alt text, captions, full-size expansion, and full-frame mobile derivatives. The primary files are exact copies of the selected candidates. The keyboard illustration replaces the history image previously borrowed for that new workshop; the original history illustration remains in its history lesson. Other original illustrations are unchanged.

The committed approval export and installation manifest are under `docs/artwork/`. The ten full-size files total 4,151,538 bytes; the ten mobile derivatives total 1,012,046 bytes. The course index and reading-rail artwork mapping are synchronized. A subsection boundary check prevents a new teaching diagram from being assigned to the preceding playground's thumbnail.

Unselected candidates, generation records, and browser-local decisions remain excluded from Git and GitHub Pages output. Rejected early workbench drafts remain in the ignored archive. The selected artwork and its required derivatives now ship with the static course; no server or runtime image service is introduced. The content, implementation, and owner-selected artwork work is complete.
