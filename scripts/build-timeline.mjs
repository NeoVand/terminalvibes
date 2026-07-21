#!/usr/bin/env node
/**
 * Builds src/lib/data/timeline-manifest.json — the document model behind the
 * header's Thread rail.
 *
 * Why a build step rather than a runtime querySelectorAll:
 *
 *   1. `sidebarNav` is a DISPLAY index, not a document model. It lists
 *      section-2-3 before `quoting` (the DOM has it after), and it omits
 *      `midnight-deploy` entirely. A rail built from it would hand one bar's
 *      scroll span to the wrong anchor.
 *   2. The thumbnail step needs an anchor -> banner map in Node anyway, so
 *      document order comes along at zero extra cost.
 *   3. It is CI-checkable: mapping.test.ts asserts the manifest tiles the
 *      document and covers every id in sections.ts.
 *
 * Run with: npm run build:timeline  (commit the JSON — CI never rebuilds it.)
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SECTIONS_DIR = join(ROOT, 'src/lib/components/sections');
const OUT_FILE = join(ROOT, 'src/lib/data/timeline-manifest.json');

/* ── the four id lists, parsed out of sections.ts so they never drift ───── */

const sectionsSource = readFileSync(join(ROOT, 'src/lib/data/sections.ts'), 'utf8');

function idList(name) {
	const m = sectionsSource.match(new RegExp(`${name} = \\[([\\s\\S]*?)\\]`));
	if (!m) throw new Error(`could not parse ${name} from sections.ts`);
	return [...m[1].matchAll(/'([a-z0-9-]+)'/g)].map((x) => x[1]);
}

const sectionIds = idList('sectionIds');
const playgroundIds = new Set(idList('playgroundAnchorIds'));
const challengeIds = new Set(idList('challengeAnchorIds'));
const toolIds = new Set(idList('toolAnchorIds'));
const allIds = new Set([...sectionIds, ...playgroundIds, ...challengeIds, ...toolIds]);

/* ── walk the section files in page order (same list as build-course-index) ── */

const files = ['Hero.svelte', ...Array.from({ length: 14 }, (_, i) => `Part${i + 1}.svelte`)];

/** `hero` and `part-N` are structural; everything else rides the thread. */
function kindOf(id) {
	if (id === 'hero' || /^part-\d+$/.test(id)) return 'part';
	if (playgroundIds.has(id)) return 'playground';
	if (challengeIds.has(id)) return 'challenge';
	// tool anchors (prompt-designer) are real prose with no scenario, so they
	// are bars, not diamonds — the rail has no fourth lane.
	return 'section';
}

function decode(s) {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&mdash;/g, '—')
		.replace(/&nbsp;/g, ' ')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/\s+/g, ' ')
		.trim();
}

/** Inner HTML of a heading → plain text (the headings carry <strong>, <Code>…). */
function headingText(inner) {
	return decode(inner.replace(/<[^>]*>/g, '').replace(/\{[^{}]*\}/g, ''));
}

const items = [];

for (const file of files) {
	const raw = readFileSync(join(SECTIONS_DIR, file), 'utf8');
	// One string for every positional pass, so anchor / title / image indices
	// are directly comparable. Replace the script and style blocks with spaces
	// of the same length rather than deleting them, so nothing shifts.
	const source = raw.replace(/<(script|style)[\s\S]*?<\/\1>/g, (m) => ' '.repeat(m.length));

	// <LessonActivity … /> carries the playground's clever name. It is written
	// both inline and across several lines (6 of 35 are multi-line), so the
	// regex must not be line-anchored — a single-line one silently loses them.
	const activityTitle = new Map();
	// Its `id` prop renders as data-lesson-activity, NOT as a DOM id — the real
	// anchor is the <h4 id="…"> above it. Blank the tags out (preserving length)
	// so the anchor scan sees each playground id exactly once, at the h4.
	const scan = source.replace(/<LessonActivity\b[^>]*\/>/g, (m) => {
		const id = /\bid="([a-z0-9-]+)"/.exec(m)?.[1];
		const title = /title="([^"]*)"/.exec(m)?.[1];
		if (id && title) activityTitle.set(id, decode(title));
		return ' '.repeat(m.length);
	});

	// <ChallengeActivity … /> is the other half of the pair, and differs in the one
	// way that matters here: its `id` prop IS the rendered DOM anchor (the card
	// carries no heading above it), so the tag is deliberately NOT blanked — the
	// anchor scan below is meant to find it. Only the title is harvested.
	for (const m of scan.matchAll(/<ChallengeActivity\b[^>]*\/>/g)) {
		const id = /\bid="([a-z0-9-]+)"/.exec(m[0])?.[1];
		const title = /title="([^"]*)"/.exec(m[0])?.[1];
		if (id && title) activityTitle.set(id, decode(title));
	}

	const anchors = [...scan.matchAll(/id="([a-z0-9-]+)"/g)]
		.filter((m) => allIds.has(m[1]))
		.map((m) => ({ id: m[1], at: m.index }));

	// The anchor's own rendered heading is the truth — sidebar-nav's labels have
	// drifted from it in at least two places. Two forms are in use: a
	// <SectionHeader title="…" /> and a bare <h2>…</h2>, so collect both and
	// take whichever comes first inside the anchor's span.
	const titles = [
		...[...scan.matchAll(/<SectionHeader\b[^>]*?\btitle="([^"]*)"/g)].map((m) => ({
			text: decode(m[1]),
			at: m.index
		})),
		...[...scan.matchAll(/<(h[2-4])\b[^>]*>([\s\S]*?)<\/\1>/g)]
			.filter((m) => !/\bsr-only\b/.test(m[0]))
			// Anchor at the heading's TEXT, not its opening tag: several anchors
			// live on the heading element itself (<h4 id="prompt-designer">), so
			// keying off the tag start would place the title before its own anchor
			// and the section would fall back to its raw id.
			.map((m) => ({ text: headingText(m[2]), at: m.index + m[0].indexOf('>') }))
	]
		.filter((t) => t.text)
		.sort((a, b) => a.at - b.at);
	const images = [...scan.matchAll(/images\/([A-Za-z0-9._-]+\.webp)/g)].map((m) => ({
		file: m[1],
		at: m.index
	}));

	const comp = file.replace('.svelte', '');

	for (let i = 0; i < anchors.length; i++) {
		const { id, at } = anchors[i];
		const end = i + 1 < anchors.length ? anchors[i + 1].at : scan.length;
		const kind = kindOf(id);
		const between = (list) => list.find((x) => x.at > at && x.at < end);

		// Both activity kinds name themselves on the tag. A challenge especially
		// must not fall through to `between(titles)`: it is the LAST thing in its
		// Part, so the next heading it would find belongs to the next chapter.
		let title =
			kind === 'playground' || kind === 'challenge' ? activityTitle.get(id) : between(titles)?.text;
		if (!title) title = id;

		items.push({
			id,
			kind,
			title,
			image: between(images)?.file ?? null,
			comp
		});
	}
}

/* ── banner inheritance ───────────────────────────────────────────────────

   Only the 56 section anchors carry a banner in the prose. The other 51 —
   every part, every playground, and the `prompt-designer` tool anchor — had
   `image: null`, and the rail's card drew a synthetic "Part 3" plate for them
   PERMANENTLY. That is what the empty-looking cards were: not a loading state.

   Rather than commission 51 more banners, each anchor borrows the nearest one
   that is genuinely about the same material:

     • a PART takes its FIRST SECTION's banner — the opening subject of the
       chapter is the fairest single image for the chapter.
     • a PLAYGROUND takes its CONTAINING SECTION's banner — the section it
       drills, i.e. the nearest section at or before it.
     • `prompt-designer` falls under the same backwards rule.

   Borrowed art is recorded as such (`inherited: true`) so a surface can mark
   it. Crucially, `thumb` names the anchor that OWNS the file: a borrower
   reuses the owner's already-encoded thumbnail instead of getting a
   byte-identical copy of its own. 107 anchors still cost 57 files, and
   hovering a part then its first section is a warm cache hit, not a
   second download of the same picture.                                      */

const firstSectionAfter = (i) => {
	for (let j = i + 1; j < items.length; j++) {
		if (items[j].kind === 'part') break; // never reach past the next chapter
		if (items[j].kind === 'section' && items[j].image) return items[j];
	}
	return null;
};
const sectionAtOrBefore = (i) => {
	for (let j = i - 1; j >= 0; j--) {
		if (items[j].kind === 'section' && items[j].image) return items[j];
	}
	return null;
};

for (let i = 0; i < items.length; i++) {
	const it = items[i];
	if (it.image) {
		it.thumb = it.id;
		it.inherited = false;
		continue;
	}
	const donor = it.kind === 'part' ? firstSectionAfter(i) : sectionAtOrBefore(i);
	if (!donor) continue; // reported below
	it.image = donor.image;
	it.thumb = donor.thumb ?? donor.id;
	it.inherited = true;
}

const unbannered = items.filter((it) => !it.image).map((it) => it.id);
if (unbannered.length) {
	throw new Error(
		`anchors with no banner and no section to inherit one from: ${unbannered.join(', ')}`
	);
}

/* ── invariants: this is the check that would have caught midnight-deploy ── */

const seen = new Map();
for (const it of items) {
	if (seen.has(it.id)) throw new Error(`duplicate anchor id in the page: ${it.id}`);
	seen.set(it.id, it);
}

const missing = [...allIds].filter((id) => !seen.has(id));
if (missing.length) {
	throw new Error(
		`anchors declared in sections.ts but not found in the page: ${missing.join(', ')}`
	);
}

const untitled = items.filter(
	(it) => (it.kind === 'playground' || it.kind === 'challenge') && it.title === it.id
);
if (untitled.length) {
	throw new Error(
		`activities with no title prop: ${untitled.map((i) => `${i.id} (${i.kind})`).join(', ')}`
	);
}

// Every Part closes on its challenge, so the manifest must carry all fourteen —
// a missing one means a <ChallengeActivity> was dropped from a chapter, and the
// rail, the sidebar and the deep link would all point at nothing.
const missingChallenges = [...challengeIds].filter((id) => !items.some((it) => it.id === id));
if (missingChallenges.length) {
	throw new Error(
		`challenge(s) declared in sections.ts but not rendered: ${missingChallenges.join(', ')}`
	);
}

if (items[0].id !== 'hero' || items[0].kind !== 'part') {
	throw new Error('the manifest must open on the hero part');
}

/* ── advisory: sidebarNav drift (deliberately NOT fixed here) ───────────── */

const navSource = readFileSync(join(ROOT, 'src/lib/data/sidebar-nav.ts'), 'utf8');
const navIds = [...navSource.matchAll(/id:\s*'([a-z0-9-]+)'/g)]
	.map((m) => m[1])
	.filter((id) => allIds.has(id));
const navSet = new Set(navIds);
const absent = items.filter((it) => !navSet.has(it.id)).map((it) => it.id);
if (absent.length) {
	console.warn(`  warning: in the page but absent from sidebarNav: ${absent.join(', ')}`);
}
// A missing PLAYGROUND row is not advisory. The sidebar's gamepad row is the
// only route to an activity, and the subtitle divides by the full scenario
// count — so an absent row makes "n/35 exercises" permanently unreachable and
// silently caps every learner one short. `midnight-deploy` was exactly this.
// The same reasoning covers challenges: a challenge has no heading of its own
// in the prose, so its sidebar row is even more exclusively the way in.
const absentActivities = items
	.filter((it) => (it.kind === 'playground' || it.kind === 'challenge') && !navSet.has(it.id))
	.map((it) => it.id);
if (absentActivities.length) {
	throw new Error(
		`activity/activities missing a sidebarNav row: ${absentActivities.join(', ')} — ` +
			'the sidebar row is the only route to them'
	);
}
const order = new Map(items.map((it, i) => [it.id, i]));
for (let i = 1; i < navIds.length; i++) {
	if (order.get(navIds[i]) < order.get(navIds[i - 1])) {
		console.warn(
			`  warning: sidebarNav lists ${navIds[i]} after ${navIds[i - 1]}, the page has it before`
		);
	}
}

/* ── write ──────────────────────────────────────────────────────────────── */

// Stable key order — the inheritance pass adds `thumb`/`inherited` late, and a
// field order that depends on which branch ran makes the committed JSON churn.
const rows = items.map((it) => ({
	id: it.id,
	kind: it.kind,
	title: it.title,
	image: it.image,
	thumb: it.thumb,
	inherited: it.inherited,
	comp: it.comp
}));

writeFileSync(OUT_FILE, JSON.stringify(rows, null, '\t') + '\n');
const counts = rows.reduce((a, it) => ((a[it.kind] = (a[it.kind] ?? 0) + 1), a), {});
const own = rows.filter((i) => !i.inherited).length;
console.log(
	`timeline-manifest.json: ${rows.length} anchors ` +
		`(${counts.part} parts, ${counts.section} sections, ${counts.playground} playgrounds, ` +
		`${counts.challenge} challenges), ` +
		`${rows.length} banners (${own} own, ${rows.length - own} inherited), ` +
		`${new Set(rows.map((r) => r.thumb)).size} thumbnail files`
);
