# Local artwork review

**Current scope: ten new teaching concepts, fifty alternatives, in the original course style.** The owner ended the replacement-art work. Keep existing course artwork. Generate only the keyboard workshop, editor/save, script arguments, conditions, loops, checked copying, and modern finding, choosing, revisiting, and reading concepts. Each receives five actual generated compositions for owner choice.

The full inventory still records 64 concepts and all 56 current raster usages for traceability. `reviewScope` restricts the local gallery and prompt generator to the ten requested concepts. The other 54 concepts are outside this task.

Use the original course files as direct style references: near-black woodland, aged brass, warm parchment, green terminal lettering, and intricate natural hermit crabs. Preserve their palette, exposure, and rendering. Vary composition within that style. The ten briefs supply exact lesson-grounded text and technical checks.

The abandoned replacement experiments and their prompts remain under ignored `output/artwork-rejected/`, outside static output. Do not resume old generation plans. No candidate is selected automatically.

**Generation complete:** all fifty candidates are available locally. `static/art-candidates/provenance-audit.json` records the successful file, hash, uniqueness, prompt, and full-frame checks. The actual prompt and source fingerprint for every alternative are saved beside it. `corrections-original-style.json` records targeted text edits; prior attempts remain in the ignored archive. Owner selection and lesson insertion remain outstanding.

## Inventory and generation handoff

The serializable source of truth is `src/lib/data/art-concepts.json`. Every concept includes its teaching purpose, a scene brief, visual accuracy checks, current source paths/sections/alts/captions, proposed placements, suggested alt text, derived assets, and five candidate paths. Proposed alt text must be revised after a real image is chosen.

```sh
# Check all current raster usages are covered, links exist, and every concept has five slots.
node scripts/art-inventory.mjs --check

# Print actual usage locations extracted from the Svelte syntax trees.
node scripts/art-inventory.mjs --scan

# Assemble a complete generation prompt for one concept and alternative.
node scripts/art-inventory.mjs --prompt file-editor-save 01
```

Generate five distinct compositions per in-scope concept, not crops or recolors. Pass the listed `styleReferences` to the built-in image generator after inspecting them. Check text, code, connections, and visual fit against both the lesson and original artwork. The model can render text, diagrams, and code; choose the amount required for the explanation. Preserve the complete generated frame.

Save candidates at these exact local paths:

```text
static/art-candidates/<concept-id>/01.webp
static/art-candidates/<concept-id>/02.webp
static/art-candidates/<concept-id>/03.webp
static/art-candidates/<concept-id>/04.webp
static/art-candidates/<concept-id>/05.webp
```

The whole `static/art-candidates/` directory is ignored by Git, including generation provenance and review metadata. Never place drafts in `static/images/`. The early v2 workbench drafts are archived under `output/artwork-rejected/early-workbench-drafts/` and are outside this review.

Existing logos, favicons, social previews, and timeline thumbnails are outside the current image scope. Final lesson insertion follows the owner’s choices.

## Review locally

```sh
node scripts/art-inventory.mjs --availability
npm run dev
```

Open `/art-review` on that development server. If a base path is configured, include it before `/art-review`.

The scanner records readable WebP files, actual pixel dimensions, byte sizes, and SHA256 hashes in the ignored `static/art-candidates/availability.json`. Run it again after adding or replacing files, then use **Refresh images**. Missing, unreadable, or unindexed candidates cannot be chosen. Unknown WebP paths and unreadable expected files cause the scanner to report an error.

The gallery preserves the whole frame. A 1536 × 1024 generation stays that size even if the brief requested 16:9; it is shown with its actual dimensions, never silently cropped. Open a preview to inspect fine details. Left and Right arrow keys, or the Previous/Next image buttons, cycle through the current concept's available alternatives and wrap at either end. Missing images are skipped. Browsing does not choose an image. Escape closes the dialog and returns keyboard focus to its opener. Current artwork and style-reference previews remain single-image views.

Filter by concept, chapter, or review state. **Choose** records an explicit choice, **Request changes** records the note without approving an image, and **Clear choice & notes** removes that concept's decision. Notes save while typing. A missing or changed file invalidates its previous choice until the reviewer explicitly chooses again.

Choices remain in this browser's local storage (`tv-art-review-selections-v1`). **Export choices** downloads a JSON record with notes, candidate paths, original references, and hashes. It distinguishes choices that match the current file from stale decisions. Export before changing browsers or clearing browser data. The gallery does not upload decisions or change lesson source files.

## Production isolation

`/art-review` is a prerendered notice in production. Its development-only dynamic import is removed from the production bundle, so the gallery and concept manifest are not shipped. The static adapter removes its copy of `build/art-candidates/` after writing output, even when unapproved files exist locally. The original local files stay untouched.

The SvelteKit service-worker asset filter also excludes `art-candidates` before generating the precache list; the worker never caches candidate requests. The normal static Pages build and offline course continue to work. No server is introduced.

## Checks

```sh
node --test scripts/art-inventory.test.mjs
npx vitest run src/lib/components/art/art-review.test.ts
npx playwright test --config playwright.art-review.config.ts
```

`src/routes/art-review/art-review.e2e.ts` includes a normal production assertion plus four development-only browser checks. The dedicated Playwright configuration starts a Vite development server and enables those checks. Tests mock existing artwork in memory; they never write pretend generations into the candidate directory.
