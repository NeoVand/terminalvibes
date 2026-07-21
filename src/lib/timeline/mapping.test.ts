import { describe, expect, it } from 'vitest';
import {
	CH_MIN,
	CH_RATIO,
	CY,
	RAIL_H,
	TUNE,
	buildModel,
	challengeMark,
	laneMark,
	layoutMarks,
	makeLayout,
	makeMapping,
	pick,
	solveP,
	type PlacedItem,
	type TimelineItem
} from './mapping';
import manifest from '../data/timeline-manifest.json';
import { anchorIds } from '../data/sections';
import measured from './measured-offsets.fixture.json';

/**
 * This file is the port's definition of done.
 *
 * The Thread rail was approved on a specific, numerically verified claim:
 * sweeping the cursor left to right walks the document forward through every
 * anchor, in order, exactly once, with every anchor wide enough to hit. That
 * claim is a property of the mapping in mapping.ts, not of the component, so
 * it is enforced here — and these assertions are deliberately tight enough
 * that a "harmless" rewrite of the numerics fails them.
 *
 * Offsets come from a real measurement of the rendered page
 * (measured-offsets.fixture.json), not from an even spacing: the tight anchors
 * are tight precisely because the real document is uneven, and an idealised
 * fixture would quietly stop testing the thing that matters.
 */

const items = manifest as TimelineItem[];

/** The measured page: anchor -> scroll top, over a scrollable height of `h`. */
const tops = new Map(measured.a.map((x) => [x.id, x.top]));
const placed: PlacedItem[] = items.map((it) => ({
	...it,
	f: (tops.get(it.id) as number) / measured.h
}));

/**
 * Raw anchor spans — every item, parts included — which is what the cursor
 * actually sweeps through. (The rail FOLDS parts into the following section
 * for drawing; that is a rendering decision and must not hide an anchor that
 * the sweep can no longer reach.)
 */
const spans = placed.map((it, i) => ({
	id: it.id,
	kind: it.kind,
	a: it.f,
	b: i + 1 < placed.length ? placed[i + 1].f : 1
}));

const RAIL_W = 760;
const SWEEP = 4000;

function spanIndexAt(u: number): number {
	for (let i = 0; i < spans.length; i++) if (u >= spans[i].a && u < spans[i].b) return i;
	return u >= 1 ? spans.length - 1 : 0;
}

describe('manifest', () => {
	it('is in document order and covers every anchor exactly once', () => {
		expect(items.map((i) => i.id)).toEqual(measured.a.map((x) => x.id));
		expect(new Set(items.map((i) => i.id)).size).toBe(items.length);
		expect([...items.map((i) => i.id)].sort()).toEqual([...anchorIds].sort());
	});

	it('has a title for every activity and a kind for every item', () => {
		for (const it of items) {
			expect(['part', 'section', 'playground', 'challenge']).toContain(it.kind);
			// Both activity kinds name themselves on their tag, and a title that
			// fell back to the raw id is the tell that the tag lost its `title`.
			if (it.kind === 'playground' || it.kind === 'challenge') {
				expect(it.title).not.toBe(it.id);
			}
		}
	});

	it('closes every part on its challenge', () => {
		// The fourteen are the Parts' exit tests, and the owner treats each as the
		// marker where one Part ends and the next begins. So a challenge is always
		// the LAST anchor before the next `kind: 'part'` — if one drifted into the
		// middle of a chapter, the rail would hand it a span it does not own.
		const chs = items.filter((it) => it.kind === 'challenge');
		expect(chs).toHaveLength(14);
		for (const ch of chs) {
			const next = items[items.indexOf(ch) + 1];
			expect(next === undefined || next.kind === 'part').toBe(true);
		}
	});

	it('records the two known sidebarNav discrepancies as page truth', () => {
		// The page has `quoting` BEFORE section-2-3 and contains `midnight-deploy`;
		// sidebarNav says otherwise. Building the rail from sidebarNav would hand
		// one bar's scroll span to the wrong anchor — this pins the correct order.
		const order = new Map(items.map((it, i) => [it.id, i]));
		expect(order.get('quoting')!).toBeLessThan(order.get('section-2-3')!);
		expect(order.has('midnight-deploy')).toBe(true);
	});
});

describe('model', () => {
	const model = buildModel(placed);

	it('tiles [0,1] with the bar row, no gaps and no overlaps', () => {
		expect(model.bars[0].s).toBe(0);
		expect(model.bars[model.bars.length - 1].e).toBe(1);
		for (let i = 1; i < model.bars.length; i++) {
			expect(model.bars[i].s).toBe(model.bars[i - 1].e);
			expect(model.bars[i].e).toBeGreaterThan(model.bars[i].s);
		}
	});

	it('gives part headers no span of their own', () => {
		// The rule, stated directly: a part header's own document position is
		// handed to the FIRST CHILD, which therefore starts exactly at the part's
		// f — not at its own. Asserting `part.start === kids[0].s` alone would be
		// vacuous, because buildModel assigns one from the other.
		const flowById = new Map(model.flow.map((f) => [f.item.id, f]));
		for (let i = 0; i < model.parts.length; i++) {
			const p = model.parts[i];
			if (!p.kids.length) continue;
			const first = p.kids[0];
			expect(first.s).toBeLessThan(first.item.f);
			if (i > 0) expect(first.s).toBe(p.item.f);
			// …and the previous segment ends there, so no document is unclaimed.
			const prevIdx = model.flow.indexOf(first) - 1;
			if (prevIdx >= 0) expect(model.flow[prevIdx].e).toBe(first.s);
		}
		// Parts are not themselves navigable flow entries.
		for (const p of model.parts) expect(flowById.has(p.item.id)).toBe(false);
		expect(model.parts[0].start).toBe(0);
		expect(model.parts[model.parts.length - 1].end).toBe(1);
		// No part appears in the flow, and every non-part item does.
		expect(model.flow.some((f) => f.item.kind === 'part')).toBe(false);
		expect(model.flow.length).toBe(placed.filter((i) => i.kind !== 'part').length);
	});

	it('gives every item a part and every playground a diamond', () => {
		for (const it of placed) expect(model.partOf.has(it.id)).toBe(true);
		expect(model.pgs.length).toBe(placed.filter((i) => i.kind === 'playground').length);
	});
});

describe('mapping', () => {
	const cursors = [0, 0.05, 0.13, 0.25, 0.37, 0.5, 0.62, 0.75, 0.88, 0.95, 1];

	it('ships the approved tuning', () => {
		// A and sigma are product decisions, not implementation details: they were
		// chosen and signed off on, and every measured number below is a function
		// of them. Changing either should be a deliberate edit here too.
		expect(TUNE.A).toBe(3.2);
		expect(TUNE.sigma).toBe(0.115);
		expect(TUNE.pgGrabPx).toBe(24);
	});

	it('pins the endpoints', () => {
		for (const p of cursors) {
			const m = makeMapping(p, TUNE);
			expect(m.toDoc(0)).toBe(0);
			expect(m.toDoc(1)).toBe(1);
			expect(m.toScreen(0)).toBe(0);
			expect(m.toScreen(1)).toBe(1);
		}
	});

	it('is strictly increasing for every cursor position', () => {
		for (const p of cursors) {
			const m = makeMapping(p, TUNE);
			let prev = -1;
			let backward = 0;
			for (let k = 0; k <= SWEEP; k++) {
				const u = m.toDoc(k / SWEEP);
				if (u <= prev) backward++;
				prev = u;
			}
			expect(backward, `toDoc must be strictly increasing at p=${p}`).toBe(0);
		}
	});

	it('round-trips toScreen(toDoc(s)) to better than 1e-9', () => {
		let maxErr = 0;
		for (const p of cursors) {
			const m = makeMapping(p, TUNE);
			for (let k = 0; k <= 2000; k++) {
				const s = k / 2000;
				maxErr = Math.max(maxErr, Math.abs(m.toScreen(m.toDoc(s)) - s));
			}
		}
		expect(maxErr).toBeLessThan(1e-9);
	});

	it('magnifies at the cursor and relaxes to the far field', () => {
		const m = makeMapping(0.5, TUNE);
		// mag is normalised: 1 at the cursor, ~0 far away.
		expect(m.mag(0.5)).toBeCloseTo(1, 10);
		expect(m.mag(0)).toBeLessThan(0.01);
		// mag is (1/w - 1)/(A - 1), NOT the raw Gaussian: at one sigma out the
		// bump is still 0.368 but the real local expansion is only 0.154 of the
		// way to full. Sizing marks by the bump would inflate them well beyond
		// the zoom they claim to show.
		expect(m.mag(0.5 + TUNE.sigma)).toBeCloseTo(0.154, 3);
		expect(m.mag(0.5 + TUNE.sigma)).toBeLessThan(m.lens(0.5 + TUNE.sigma) / 2);
		// Local document density at the cursor is A times sparser than far away.
		const eps = 1e-4;
		const atCursor = (m.toDoc(0.5 + eps) - m.toDoc(0.5 - eps)) / (2 * eps);
		const farAway = (m.toDoc(0 + 2 * eps) - m.toDoc(0)) / (2 * eps);
		expect(farAway / atCursor).toBeCloseTo(TUNE.A, 2);
	});

	it('degenerates to the identity when A = 1', () => {
		const m = makeMapping(0.5, { ...TUNE, A: 1 });
		for (let k = 0; k <= 100; k++) {
			const s = k / 100;
			expect(m.toDoc(s)).toBeCloseTo(s, 12);
		}
		expect(m.mag(0.5)).toBe(0);
	});

	it('solveP lands the lens on its own target', () => {
		for (const target of [0, 0.07, 0.31, 0.5, 0.585, 0.83, 1]) {
			const p = solveP(target, TUNE);
			expect(makeMapping(p, TUNE).toDoc(p)).toBeCloseTo(target, 8);
		}
	});
});

describe('the rest/hover magnification split', () => {
	/**
	 * The rail rests at `aRest` and blooms to `A` when the pointer arrives, and
	 * the tween walks A continuously between the two. So the approved sweep
	 * property has to survive EVERY magnification in that range, not just the
	 * hover endpoint — otherwise the rail would be briefly broken mid-animation,
	 * in exactly the moment the reader is looking at it.
	 */
	const range = [TUNE.aRest, 2.0, 2.4, 2.8, TUNE.A];

	it('rests gentler than it hovers', () => {
		expect(TUNE.aRest).toBeLessThan(TUNE.A);
		expect(TUNE.aRest).toBeGreaterThan(1); // still lensed, not a flat bar
	});

	it.each(range)('sweeps forward through every anchor at A = %s', (A) => {
		const tune = { ...TUNE, A };
		const seen: number[] = [];
		for (let k = 0; k <= SWEEP; k++) {
			const p = k / SWEEP;
			seen.push(spanIndexAt(makeMapping(p, tune).toDoc(p)));
		}
		let backward = 0;
		for (let k = 1; k < seen.length; k++) if (seen[k] < seen[k - 1]) backward++;
		expect(backward, `A = ${A} runs backwards`).toBe(0);
		expect(new Set(seen).size, `A = ${A} skips anchors`).toBe(spans.length);
	});

	it.each(range)('keeps every anchor hittable at A = %s', (A) => {
		const tune = { ...TUNE, A };
		const counts = new Map<number, number>();
		for (let k = 0; k <= SWEEP; k++) {
			const p = k / SWEEP;
			const i = spanIndexAt(makeMapping(p, tune).toDoc(p));
			counts.set(i, (counts.get(i) ?? 0) + 1);
		}
		const worst = Math.min(...[...counts.values()].map((c) => (c / SWEEP) * RAIL_W));
		expect(worst, `A = ${A} starves an anchor below 1.5px`).toBeGreaterThan(1.5);
	});
});

describe('the sweep — the property the direction was approved on', () => {
	/** Walk the cursor 0 -> 1 and record which anchor sits under it. */
	const seq: number[] = [];
	for (let k = 0; k <= SWEEP; k++) {
		const p = k / SWEEP;
		seq.push(spanIndexAt(makeMapping(p, TUNE).toDoc(p)));
	}

	it('never runs backwards', () => {
		let backward = 0;
		for (let k = 1; k < seq.length; k++) if (seq[k] < seq[k - 1]) backward++;
		expect(backward).toBe(0);
	});

	it('visits every anchor, and skips none', () => {
		const visited = new Set(seq);
		const missed = spans.filter((_, i) => !visited.has(i)).map((s) => s.id);
		expect(missed).toEqual([]);
		expect(visited.size).toBe(spans.length);
	});

	it('visits each anchor in one contiguous run — nothing is revisited', () => {
		const seen = new Set<number>();
		let cur = -1;
		for (const i of seq) {
			if (i === cur) continue;
			expect(seen.has(i), `anchor ${spans[i].id} is entered twice`).toBe(false);
			seen.add(i);
			cur = i;
		}
	});

	it('gives every anchor enough cursor travel to hit at a 760px rail', () => {
		const counts = new Map<number, number>();
		for (const i of seq) counts.set(i, (counts.get(i) ?? 0) + 1);
		const px = (i: number) => ((counts.get(i) ?? 0) / SWEEP) * RAIL_W;

		const byKind = (kind: string) =>
			spans
				.map((s, i) => ({ kind: s.kind, px: px(i) }))
				.filter((x) => x.kind === kind)
				.map((x) => x.px)
				.sort((a, b) => a - b);

		const median = (a: number[]) => a[Math.floor(a.length / 2)];

		const sections = byKind('section');
		const playgrounds = byKind('playground');
		const parts = byKind('part');
		const challenges = byKind('challenge');

		/* The floors measured on the approved prototype. Lowering A or widening
		   sigma pushes these down; this is the assertion that stops a TUNING
		   change from quietly making the small marks unhittable — and the tuning
		   itself is still pinned exactly, three tests up.

		   Re-derived once, for the fourteen challenges. They are content, not
		   tuning: 107 anchors became 121, so every anchor's share of a 760px rail
		   fell. Measured on the same rig with the challenge cards hidden, this
		   page still reproduces the prototype's numbers to the digit (5.13 /
		   3.04 / 1.71), so the drop below is entirely the new anchors and nothing
		   else moved:

		     sections[0]   5.13 → 4.94      median 7.79 → 7.60
		                   (floored at 4.93 — the measurement is 4.9399999…)
		     playgrounds   3.04 → 3.04      median 3.80 → 3.61

		   That is a 3–5% squeeze for a 13% rise in anchor count, and every mark
		   stays far above the 1.5px hard floor asserted in the rest/hover split.
		   Same precedent as the part note below, which was re-derived when
		   prompt-designer and midnight-deploy were added back. */
		expect(sections[0]).toBeGreaterThanOrEqual(4.93);
		expect(median(sections)).toBeGreaterThanOrEqual(7.6);
		expect(playgrounds[0]).toBeGreaterThanOrEqual(3.04);
		expect(median(playgrounds)).toBeGreaterThanOrEqual(3.61);
		// The challenges' own floor, new with them. They read tighter than the
		// playgrounds because each is one anchor at the very end of a chapter,
		// where the following part header is already crowding the span.
		expect(challenges).toHaveLength(14);
		expect(challenges[0]).toBeGreaterThanOrEqual(2.46);
		expect(median(challenges)).toBeGreaterThanOrEqual(2.66);
		// Parts read a little tighter than the 1.80/2.19 quoted on the prototype
		// because that snapshot was missing two anchors (prompt-designer and
		// midnight-deploy); adding them back splits two part spans. It costs
		// nothing in practice: the chapter lane is hit-tested over the FOLDED
		// part span (partAt), which is an order of magnitude wider than the raw
		// anchor span measured here. Kept as a regression floor all the same.
		expect(parts[0]).toBeGreaterThanOrEqual(1.71);
		expect(median(parts)).toBeGreaterThanOrEqual(2.09);
	});
});

describe('hit testing', () => {
	const model = buildModel(placed);

	it('reaches every bar and every playground across a sweep', () => {
		const barsHit = new Set<string>();
		const pgsHit = new Set<string>();
		for (let k = 0; k <= SWEEP; k++) {
			const p = k / SWEEP;
			const map = makeMapping(p, TUNE);
			const x = p * RAIL_W;
			barsHit.add(pick(model, map, RAIL_W, x, 24, TUNE));
			const hi = pick(model, map, RAIL_W, x, 4, TUNE);
			if (!hi.startsWith('part:')) pgsHit.add(hi);
		}
		const missedBars = model.bars.map((b) => b.item.id).filter((id) => !barsHit.has(id));
		expect(missedBars).toEqual([]);
		// The 24px grab radius is what keeps the diamonds reachable; drop it and
		// the ones in the compressed tail become unclickable.
		const missedPgs = model.pgs.map((f) => f.item.id).filter((id) => !pgsHit.has(id));
		expect(missedPgs).toEqual([]);
	});

	it('gives the diamonds a real grab window, not a pixel', () => {
		// The whole point of pgGrabPx: a diamond gets ~3.8px of CURSOR travel, but
		// the pointer must have a comfortable window in which the high lane snaps
		// to it. Shrink the radius to 12 and this floor halves.
		const counts = new Map<string, number>();
		for (let k = 0; k <= SWEEP; k++) {
			const p = k / SWEEP;
			const id = pick(model, makeMapping(p, TUNE), RAIL_W, p * RAIL_W, 4, TUNE);
			if (!id.startsWith('part:')) counts.set(id, (counts.get(id) ?? 0) + 1);
		}
		const travel = model.pgs
			.map((f) => ((counts.get(f.item.id) ?? 0) / SWEEP) * RAIL_W)
			.sort((a, b) => a - b);
		// 9.31 / 13.30 before the fourteen challenges landed; see the note on the
		// travel floors above for why content, unlike tuning, may move these.
		expect(travel[0]).toBeGreaterThanOrEqual(8.93);
		expect(travel[Math.floor(travel.length / 2)]).toBeGreaterThanOrEqual(13.11);
	});

	it('routes the low lane to chapters and the mid lane to sections', () => {
		const map = makeMapping(0.5, TUNE);
		expect(pick(model, map, RAIL_W, 380, 44, TUNE)).toMatch(/^part:\d+$/);
		expect(pick(model, map, RAIL_W, 380, 24, TUNE)).not.toMatch(/^part:/);
	});
});

describe('mark layout', () => {
	const model = buildModel(placed);
	const out = makeLayout(model);

	it('keeps the thread continuous and inside the rail', () => {
		for (const p of [0, 0.25, 0.5, 0.75, 1]) {
			const map = makeMapping(p, TUNE);
			layoutMarks(model, map, RAIL_W, 0.585, out, TUNE);
			expect(out.bars[0].x).toBeCloseTo(0, 6);
			const last = out.bars[out.bars.length - 1];
			expect(last.x + last.w).toBeLessThanOrEqual(RAIL_W + 0.01);
			for (const b of out.bars) {
				expect(b.w).toBeGreaterThan(0);
				expect(b.h).toBeGreaterThanOrEqual(TUNE.barMinH - 1e-9);
				expect(b.h).toBeLessThanOrEqual(TUNE.barMaxH + 1e-9);
			}
			for (const g of out.pgs) {
				expect(g.size).toBeGreaterThanOrEqual(TUNE.pgMin - 1e-9);
				expect(g.size).toBeLessThanOrEqual(TUNE.pgMax + 1e-9);
				expect(g.stemH).toBeGreaterThanOrEqual(1);
			}
		}
	});

	it('never lets the section under the cursor shrink below a usable width', () => {
		// This is what the magnification is FOR, and it is the assertion that
		// actually notices a change to A: the bar the cursor is sitting on is
		// 16.9px wide at worst with A = 3.2, but only 11.7px at A = 2.2 and 8.6px
		// at A = 1.6. Cursor-travel alone does not catch that — the tightest
		// anchors sit near the rail ends, where the lens is clipped by the edge.
		let minW = Infinity;
		let minDiamond = Infinity;
		for (let k = 0; k <= 1000; k++) {
			const p = k / 1000;
			const map = makeMapping(p, TUNE);
			layoutMarks(model, map, RAIL_W, 0.5, out, TUNE);
			minW = Math.min(minW, out.bars[model.bars.indexOf(model.barAt(map.toDoc(p)))].w);
			let bd = Infinity;
			let bj = 0;
			for (let j = 0; j < out.pgs.length; j++) {
				const d = Math.abs(out.pgs[j].cx - p * RAIL_W);
				if (d < bd) {
					bd = d;
					bj = j;
				}
			}
			if (bd < 8) minDiamond = Math.min(minDiamond, out.pgs[bj].size);
		}
		// 16.94 before the challenges; 16.05 with them. Still nearly double the
		// 8.6px this same measurement reports at A = 1.6, which is the failure
		// this floor was written to catch.
		expect(minW).toBeGreaterThanOrEqual(16.05);
		expect(minDiamond).toBeGreaterThanOrEqual(10.7);
	});

	it('marks exactly one bar as holding the reading head, and fills it', () => {
		const map = makeMapping(0.5, TUNE);
		layoutMarks(model, map, RAIL_W, 0.585, out, TUNE);
		expect(out.bars.filter((b) => b.active).length).toBe(1);
		const active = out.bars.find((b) => b.active)!;
		expect(active.headW).toBeGreaterThan(0);
		expect(active.headW).toBeLessThanOrEqual(active.w);
	});
});

describe('the two activity lanes are one geometry, mirrored', () => {
	/* Two owner reports, both structural rather than cosmetic:

	     "the playground markers on the timeline are kind of closer to the
	      timeline than the challenges"
	     "under the magnifier the challenges don't change their Y position"

	   Both were the challenge lane carrying its own constants — a fixed centre
	   at 39.5 and its own min/max — instead of reflecting the lane above. These
	   pin the reflection so a future retune of one lane cannot silently
	   desynchronise the other. */

	const ks = [0, 0.05, 0.13, 0.21, 0.34, 0.5, 0.66, 0.8, 0.95, 1];

	it('hangs a challenge exactly as far below the thread as a playground sits above it', () => {
		for (const k of ks) {
			const pg = laneMark(k, TUNE);
			const ch = challengeMark(k, TUNE);
			// the square's top edge above CY vs the diamond's top vertex below it
			expect(CY - pg.base).toBeCloseTo(ch.vertex - CY, 10);
		}
	});

	it('gives both lanes the same stem at the same magnification', () => {
		for (const k of ks) {
			expect(challengeMark(k, TUNE).stemH).toBeCloseTo(laneMark(k, TUNE).stemH, 10);
		}
	});

	it('moves the challenge in Y as the lens passes over it, not only in size', () => {
		const cold = challengeMark(0, TUNE);
		const hot = challengeMark(1, TUNE);
		// it must LIFT away from the thread, by the same 3px the playground does
		expect(hot.vertex - cold.vertex).toBeCloseTo(3, 10);
		expect(hot.vertex - cold.vertex).toBeCloseTo(
			laneMark(0, TUNE).base - laneMark(1, TUNE).base,
			10
		);
		// and the centre must move with it — the old code pinned it at 39.5
		expect(hot.vertex + hot.half).not.toBeCloseTo(cold.vertex + cold.half, 1);
	});

	it('keeps the mirrored rhomboid inside the 48px rail at every magnification', () => {
		for (const k of ks) {
			const ch = challengeMark(k, TUNE);
			// wholly below the thread, wholly on the rail
			expect(ch.vertex).toBeGreaterThan(CY);
			expect(ch.vertex + 2 * ch.half).toBeLessThanOrEqual(RAIL_H);
			// and the element box is inside the drawn diamond, never above it
			expect(ch.top).toBeGreaterThanOrEqual(ch.vertex);
		}
		// the tightest case, stated as a number so a retune has to face it
		expect(challengeMark(1, TUNE).vertex + 2 * challengeMark(1, TUNE).half).toBeCloseTo(46.44, 1);
	});

	it('scales the diamond with the square rather than pinning it to a max', () => {
		// above the floor the edge is a fixed fraction of the lane above
		for (const k of ks) {
			const edge = challengeMark(k, TUNE).edge;
			const ratioEdge = laneMark(k, TUNE).size * CH_RATIO;
			expect(edge).toBeCloseTo(Math.max(CH_MIN, ratioEdge), 10);
		}
		// and the floor binds only in the far field
		expect(challengeMark(0.21, TUNE).edge).toBeCloseTo(CH_MIN, 1);
		expect(challengeMark(0.5, TUNE).edge).toBeGreaterThan(CH_MIN);
	});

	it('reads at a comparable weight to the square it mirrors', () => {
		// across the diagonal, at full magnification, against the square's edge
		const across = 2 * challengeMark(1, TUNE).half;
		expect(across / laneMark(1, TUNE).size).toBeGreaterThan(1.05);
		expect(across / laneMark(1, TUNE).size).toBeLessThan(1.2);
	});
});
