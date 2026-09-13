# Local artwork review

**Generation stopped — direction rejected by the owner.** The interrupted batch used an assistant-imposed text ban and an overly juvenile visual style. Do not resume its generation plan. The original images combine intricate illustration with commands, labels, diagrams, and before/after examples; future briefs must preserve that teaching substance and expand the palette. Calibrate five alternatives for one concept with the owner before scaling across the course. Existing drafts and exact prompts are retained as historical evidence, with no selections or replacements.

The consolidated inventory has **64 illustration concepts and 320 candidate slots**. It covers all 56 active raster usages in the opening, Parts 1–14, keyboard workshop, and header. The two header logo usages share one logo concept. The keyboard workshop and later history lesson get separate concepts, even though they currently share an old image.

Nine new explanations cover saving an editor draft, script arguments, conditions, loops, checked copying, and modern tools for finding, choosing, revisiting, and reading files. These have explicit lesson placements. No candidate is selected initially, and no course image is replaced by the review UI.

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

Generate five genuinely distinct compositions, not five crops or recolors. The per-alternative direction is combined with the concept's specific teaching scene and accuracy checks. The crab and garden provide continuity; materials, lighting, framing, and palettes vary. Render exact commands, shortcuts, labels, and results directly in the generated artwork when they help teach the concept. Supply the exact lesson-grounded text in each brief and check its accuracy and legibility. Accessible course prose remains alongside the image. The old concept briefs still need revision; changing a global rule alone does not repair the interrupted batch.

Save candidates at these exact local paths:

```text
static/art-candidates/<concept-id>/01.webp
static/art-candidates/<concept-id>/02.webp
static/art-candidates/<concept-id>/03.webp
static/art-candidates/<concept-id>/04.webp
static/art-candidates/<concept-id>/05.webp
```

The whole `static/art-candidates/` directory is ignored by Git, including generation provenance and review metadata. Never place drafts in `static/images/`. Existing v2 drafts are unapproved and may be deliberately imported into a suitable slot; they are never automatically selected.

Favicons are derived from the approved crab logo. The social preview is derived from the approved opening illustration with real brand typography. Timeline thumbnails are derived from their approved lesson artwork. Inspect these crops at their actual display size; approval of a full illustration is not automatic approval of its crops. UI screenshots are captured from the product rather than generated.

## Review locally

```sh
node scripts/art-inventory.mjs --availability
npm run dev
```

Open `/art-review` on that development server. If a base path is configured, include it before `/art-review`.

The scanner records readable WebP files, actual pixel dimensions, byte sizes, and SHA256 hashes in the ignored `static/art-candidates/availability.json`. Run it again after adding or replacing files, then use **Refresh images**. Missing, unreadable, or unindexed candidates cannot be chosen. Unknown WebP paths and unreadable expected files cause the scanner to report an error.

The gallery preserves the whole frame. A 1536 × 1024 generation stays that size even if the brief requested 16:9; it is shown with its actual dimensions, never silently cropped. Open a preview to inspect fine details. Escape closes the dialog and returns keyboard focus to its opener.

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
