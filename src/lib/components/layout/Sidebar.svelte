<script lang="ts">
	import { untrack } from 'svelte';
	import { SvelteMap, SvelteSet } from 'svelte/reactivity';
	import { slide } from 'svelte/transition';
	import { cubicOut } from 'svelte/easing';
	import { ChevronRight, PanelLeftClose, PanelLeft, RotateCcw } from 'lucide-svelte';
	import { autohideScroll } from '$lib/actions/autohide-scroll';
	import { sidebarNav, isActivity, type NavItem } from '$lib/data/sidebar-nav';
	import { progress, resetAllLearningState, activityStateOf } from '$lib/data/progress';
	import {
		TOTAL_PLAYGROUNDS,
		TOTAL_SECTIONS,
		playgroundIds,
		summarizeParts
	} from '$lib/timeline/summary';
	import { watchRailBreakpoint } from '$lib/timeline/breakpoint';
	import { buildHeatLut, lutColour } from '$lib/timeline/heat';
	import { DWELL } from '$lib/timeline/dwell';
	import { allChallenges } from '$lib/playground/challenges';

	let {
		open = false,
		activeSection = '',
		onToggle,
		onNavigate
	}: {
		open: boolean;
		activeSection: string;
		onToggle: () => void;
		onNavigate: (id: string) => void;
	} = $props();

	const sections = sidebarNav;

	/**
	 * One clock for everything that moves when a part opens: the children
	 * sliding down, the caret turning, and the thread lighting up beside
	 * them. They are three views of a single gesture, so they must not drift
	 * apart — the moment they do, opening a part stops reading as one motion
	 * and starts reading as three things happening near each other.
	 *
	 * Exposed to CSS as --nav-open-ms on the nav so the stylesheet and the
	 * slide transition cannot fall out of step.
	 */
	const OPEN_MS = 280;

	/* ── who owns "course progress" at this width ───────────────────────────
	   The mini timeline is MOBILE ONLY. On desktop the header's Thread rail is
	   the live, cursor-driven version of the same model, and two timelines on
	   one screen is one too many.

	   `wide` is the rail's own condition, read from the shared
	   RAIL_MEDIA_QUERY — the header does not evaluate a private copy of the
	   string, it imports the same watcher. So the two are complementary by
	   construction: at every width, `wide` renders the rail and `!wide`
	   renders the mini timeline, and there is no width where both or neither
	   is true. Both start false (the mobile arrangement) and flip on the same
	   matchMedia event, so the boundary holds during hydration too.

	   Note this gates only the little bar. The exercise-count subtitle and the
	   reset button below stay at every width — see the expanded drawer. */
	let wide = $state(false);
	$effect(() => watchRailBreakpoint((m) => (wide = m)));

	// Look up every child id's parent section id, straight from the nav tree.
	// Playground activities (first-steps, fix-permissions, …) deliberately
	// don't follow the `section-N-` naming, so string-prefix matching can't
	// tell which part they belong to — this can. Plain object: built once
	// from static data, never reactively mutated.
	const childToParent: Record<string, string> = {};
	for (const s of sections) {
		for (const c of s.children ?? []) childToParent[c.id] = s.id;
	}

	/* ── progress, on the SAME denominators as the header rail ──────────────
	   This used to divide by `sectionIds.length` — 71, being 15 part headers
	   plus 56 sections, with all 35 playgrounds excluded. The rail counts the
	   manifest's 57 `kind: 'section'` anchors and reports playgrounds
	   separately. Both surfaces now read `summarizeParts`, so the sidebar's
	   percentage is by construction the sum of the rail's per-part chips.
	   See src/lib/timeline/summary.ts for why part headers are not "read". */

	/** Module-constant, never mutated — so a plain Set, not a SvelteSet. */
	const pgSet = new Set<string>(playgroundIds);

	/* READ is scroll-derived and therefore prose-only. The scroll-spy writes
	   `progress.sections` for every anchor it passes, activities included, so an
	   unfiltered set would count a playground as "read" the moment it scrolled
	   by — which is how the exercise line came to claim completions the learner
	   had never earned. Filtering here is the same guard `timeline/state` puts on
	   the rail's sets, for the same reason. */
	const readIds = $derived(new Set(Object.keys($progress.sections).filter((id) => !pgSet.has(id))));
	// Intersected with the manifest for the same reason the rail does it: the
	// scenario record also collects ids from the standalone playground panel and
	// from stale localStorage, which would otherwise inflate the count past 35.
	const doneIds = $derived(new Set(Object.keys($progress.scenarios).filter((id) => pgSet.has(id))));
	/** Started but not solved — disjoint from doneIds, as on the rail. */
	const attemptedIds = $derived(
		new Set(
			Object.keys($progress.attempts).filter((id) => pgSet.has(id) && !$progress.scenarios[id])
		)
	);

	const partStats = $derived(summarizeParts(readIds, doneIds));
	/* The same rollup over "engaged" (attempted ∪ completed), so the mini
	   timeline can show a part being worked without editing the shared
	   summarizeParts: it is pure, so calling it twice is just arithmetic. */
	const engagedStats = $derived(summarizeParts(readIds, new Set([...doneIds, ...attemptedIds])));
	const sectionsRead = $derived(partStats.reduce((a, p) => a + p.sectionsRead, 0));
	const readPct = $derived(Math.round((sectionsRead / TOTAL_SECTIONS) * 100));
	/** COMPLETED, never "arrived at" — this is the number the counter quotes. */
	const doneCount = $derived(partStats.reduce((a, p) => a + p.playgroundsDone, 0));
	const attemptedCount = $derived(attemptedIds.size);

	const stateOf = (id: string) => activityStateOf($progress, id);

	/**
	 * Activity rows keep their own colour whether or not they are the active
	 * row — the type IS the signal. Prose rows return undefined and fall back
	 * to the green/muted pair. Earth-red for challenges, matching the card and
	 * the rail's challenge lane; never a hex, so both themes follow.
	 */
	function activityColor(item: NavItem): string | undefined {
		if (item.isChallenge) return 'var(--color-challenge)';
		if (item.isPlayground) return 'var(--color-important)';
		return undefined;
	}

	/**
	 * Weight follows ENGAGEMENT, so the TOC agrees with the rail: an activity
	 * you have never touched is the quietest row on the list, one you have
	 * started sits between, and one you have solved is at full strength. Prose
	 * rows are unaffected — they were never dimmed by this.
	 */
	function activityOpacity(item: NavItem, activity: boolean, childActive: boolean): string {
		if (!activity || childActive) return '1';
		const st = stateOf(item.id);
		if (st === 'completed') return '1';
		return st === 'attempted' ? '0.8' : '0.55';
	}

	/* ── which theme, so the heat ramp can be resolved ──────────────────────
	   Same three-way read as the rail's own `isDarkTheme()`: an explicit
	   `.dark`/`.light` on the root wins, and `system` falls through to the media
	   query. Both inputs are watched, because the header's theme toggle writes
	   the class and the OS can change the query underneath a `system` reader.

	   Assigning state inside an `$effect` is the right shape here and not the
	   usual smell: both inputs are DOM events outside Svelte's graph, so there
	   is nothing for a `$derived` to depend on. It is the same arrangement
	   `wide` uses above, one subscription per external source. */
	let dark = $state(true);
	$effect(() => {
		const mq = window.matchMedia('(prefers-color-scheme: dark)');
		const read = () => {
			const c = document.documentElement.classList;
			dark = c.contains('dark') ? true : c.contains('light') ? false : mq.matches;
		};
		read();
		mq.addEventListener('change', read);
		const mo = new MutationObserver(read);
		mo.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		return () => {
			mq.removeEventListener('change', read);
			mo.disconnect();
		};
	});

	/* THE ramp — imported, not re-derived. `buildHeatLut` is the same function
	   the header rail paints its section bars with, at the same `chromaGamma`,
	   so a part at 60% here is literally the colour a section at 60% heat is up
	   there. The INPUT differs and honestly must: the rail measures dwell
	   seconds and the sidebar has no tracker (the rail owns it and is not
	   mounted at this width), so the scalar here is the fraction of the part's
	   sections read. Same ramp, coarser signal — which is the whole trade this
	   surface makes. */
	const heatLut = $derived(buildHeatLut(dark ? 'dark' : 'light', DWELL.chromaGamma));

	/** Which part each challenge belongs to, and 14 of the 15 parts have one. */
	const challengeOfPart = $derived(
		new Map(allChallenges.map((c) => [c.partId as string, stateOf(c.id)]))
	);

	/* ── the mini timeline ──────────────────────────────────────────────────
	   GRANULARITY IS PARTS (15), and that survives the rebuild unchanged,
	   because it was always a measurement rather than a preference. The
	   expanded bar gets ~216px (280px sidebar, less 32px of padding and 32px
	   for the reset button). At 57 segments with 1.5px gaps each segment is
	   (216 - 84) / 57 = 2.3px — under the 5.5px at which the rail itself gives
	   up on the hatch (`is-tiny`). At 15 segments each gets ~13px, which is
	   room for a mark, a ring and a real stretch of texture.

	   WHAT CHANGED is where the sub-part resolution goes. It used to be a
	   partial-WIDTH fill: a part 3-of-4 read drew as a brown box three quarters
	   full, with a visible edge inside it. That is a progress bar, and the rail
	   is not a progress bar — it is a map of places, each one flat. So the
	   fraction now drives COLOUR instead of geometry, through the rail's own
	   heat LUT. This is exactly the move `DWELL.bucketsPerBar: 1` made on the
	   rail when 57 little gradients read as "too busy": resolution into the
	   fill, never into a second edge.

	   The activity lanes stop being strips with fractions in them and become
	   MARKS, because that is what they are on the rail: one square per part
	   that has playgrounds, one rhomboid per part that has a challenge, in
	   their own lanes either side of the thread. Three states each, stepping
	   monotonically in weight, on the rail's own tokens.

	   Widths are proportional to each part's anchor count, so the bar keeps the
	   rail's sense of course shape; `min-width` stops the two-anchor parts
	   (Part 11, Part 13) from disappearing. */
	const partBars = $derived(
		partStats.map((p, i) => {
			const readFrac = p.sections ? p.sectionsRead / p.sections : 0;
			const engaged = engagedStats[i].playgroundsDone;
			return {
				...p,
				weight: p.sections + p.playgrounds,
				readFrac,
				/* Never been here. The one thing the hatch is allowed to mean, on
				   this surface as on the rail. */
				cold: p.sectionsRead === 0,
				tone: lutColour(heatLut, readFrac),
				/** none | some | all — absent when the part holds no playgrounds. */
				pg: !p.playgrounds
					? null
					: p.playgroundsDone === p.playgrounds
						? 'all'
						: engaged > 0
							? 'some'
							: 'none',
				/** The rail's three challenge states, straight from the same record. */
				ch: challengeOfPart.get(p.id) ?? null
			};
		})
	);

	/** Which part the reader is inside — the rail's GREEN, "where you are now". */
	const activePartId = $derived(sections.find((s) => isActive(s.id))?.id ?? null);

	/** Challenges are DRAWN on the mini timeline now, so they are spoken too. */
	const challengesDone = $derived(
		allChallenges.filter((c) => stateOf(c.id) === 'completed').length
	);

	const progressLabel = $derived(
		`Course progress: ${sectionsRead} of ${TOTAL_SECTIONS} sections read, ` +
			`${doneCount} of ${TOTAL_PLAYGROUNDS} exercises completed` +
			(attemptedCount ? `, ${attemptedCount} started` : '') +
			`, ${challengesDone} of ${allChallenges.length} challenges solved.`
	);

	const CH_WORD = { untouched: 'not attempted', attempted: 'started', completed: 'solved' };

	function partTitle(p: (typeof partBars)[number]): string {
		const bits = [`${p.sectionsRead}/${p.sections} read`];
		if (p.playgrounds) bits.push(`${p.playgroundsDone}/${p.playgrounds} solved`);
		if (p.ch) bits.push(`challenge ${CH_WORD[p.ch]}`);
		return `${p.label} — ${bits.join(' · ')}`;
	}

	const expandedSections = new SvelteSet<string>();
	/**
	 * What the learner explicitly asked for, which always outranks auto-expand.
	 *
	 * Without this, collapsing the part you're currently reading didn't stick:
	 * scroll-spy keeps `activeSection` inside that part, so the auto-expand
	 * effect re-opened it on the very next tick. An entry is dropped once the
	 * reader moves on to a different part, so the automatic behaviour returns.
	 */
	const userIntent = new SvelteMap<string, 'open' | 'closed'>();
	let flyoutSection = $state<string | null>(null);
	let flyoutY = $state(0);

	/* Resetting wipes every recording (bar, ✔ ticks, checklist, dwell heat) —
	   ask twice.

	   This is the PHONE copy of the reset. On any width where the header's
	   Thread rail is mounted the control lives up there, immediately left of
	   the rail it acts on; down here the rail is not mounted and the sidebar is
	   the only place progress is shown, so it is the only place the button can
	   be. Both are gated on the same `wide`, so exactly one exists at any
	   width — never both, never neither. Both call the same
	   `resetAllLearningState`, so "reset" means the identical thing at every
	   width; the header's copy additionally has to drop the live dwell tracker,
	   which cannot exist here because the rail that owns it is not mounted. */
	let resetArmed = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	function handleResetProgress() {
		if (!resetArmed) {
			resetArmed = true;
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => (resetArmed = false), 2500);
			return;
		}
		clearTimeout(resetTimer);
		resetArmed = false;
		resetAllLearningState();
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
	}

	$effect(() => () => clearTimeout(resetTimer));

	function toggleSection(id: string) {
		if (expandedSections.has(id)) {
			expandedSections.delete(id);
			userIntent.set(id, 'closed');
		} else {
			expandedSections.add(id);
			userIntent.set(id, 'open');
		}
	}

	function scrollTo(id: string, closeSidebarOnMobile = true) {
		const el = document.getElementById(id);
		if (el) {
			onNavigate(id);
			if (closeSidebarOnMobile && open && window.innerWidth < 1024) onToggle();
		}
	}

	function isActive(sectionId: string): boolean {
		if (activeSection === sectionId) return true;
		// A child (section or playground activity) lights up its parent part.
		if (childToParent[activeSection] === sectionId) return true;
		if (sectionId === 'hero')
			return activeSection === 'hero' || activeSection.startsWith('section-intro-');
		const partNum = sectionId.replace('part-', '');
		return activeSection.startsWith(`section-${partNum}-`);
	}

	function openFlyout(sectionId: string, event: MouseEvent) {
		const btn = event.currentTarget as HTMLElement;
		const rect = btn.getBoundingClientRect();
		flyoutY = rect.top;
		flyoutSection = flyoutSection === sectionId ? null : sectionId;
	}

	function closeFlyout() {
		flyoutSection = null;
	}

	function handleFlyoutNavigate(id: string) {
		scrollTo(id, false);
		closeFlyout();
	}

	/** The part the reader was last inside, so we can forget stale intent. */
	let lastReadPart: string | null = null;

	$effect(() => {
		const parent = childToParent[activeSection] ?? null;
		if (!parent || !isActive(parent)) return;

		// Moving to a different part retires the previous part's override:
		// closing one section shouldn't keep it shut forever.
		if (parent !== lastReadPart) {
			if (lastReadPart) userIntent.delete(lastReadPart);
			lastReadPart = parent;
		}

		untrack(() => {
			// Collapse whatever opened on its own, keeping deliberate opens.
			for (const id of [...expandedSections]) {
				if (id !== parent && userIntent.get(id) !== 'open') expandedSections.delete(id);
			}
			// Follow the reader — unless they closed this one by hand.
			if (userIntent.get(parent) !== 'closed') expandedSections.add(parent);
		});
	});
</script>

{#snippet navIcon(item: NavItem, active: boolean, size: number)}
	{@const Icon = item.icon}
	<Icon {size} strokeWidth={active ? 2.5 : 2} />
{/snippet}

<!--
  An activity's THREE states, told the same way in the nav and the flyout.

  untouched — no mark at all, and the row sits at the lowest opacity. Absence is
  the quietest possible statement, and it is the honest one: nothing has
  happened here.
  attempted — a small OUTLINE of the shape this activity wears on the header
  rail: a square for a playground, a rhomboid for a challenge. Borrowing the
  rail's shapes rather than inventing a third marker means the TOC and the rail
  are two views of one vocabulary, and it deliberately avoids a circle — the one
  marker shape the owner has asked not to see beside these rows.
  completed — the filled tick, unchanged.

  The outline inherits `currentColor` from the row, so a challenge's is
  earth-red and a playground's caramel, with no second colour decision.
-->
{#snippet activityMark(item: NavItem)}
	{@const st = stateOf(item.id)}
	{#if st === 'completed'}
		<span class="act-tick" style="color: var(--color-tip);" aria-hidden="true">✔</span>
		<span class="sr-only">— completed</span>
	{:else if st === 'attempted'}
		<span class="act-open" class:act-rhomb={item.isChallenge} aria-hidden="true"></span>
		<span class="sr-only">— started, not solved</span>
	{/if}
{/snippet}

<!--
  The counts, and the reset confirmation that borrows their line. Desktop and
  mobile show the identical text — the owner objected to the little timeline,
  not to knowing how many exercises are left — so this is one definition
  rendered into one of two positions, never two copies that can drift.
-->
{#snippet progressCounts()}
	{#if resetArmed}
		Click again to reset all progress
	{:else}
		<!-- "done", explicitly. The count is COMPLETIONS — scenarios whose goal
		     check passed — and never activities the reader merely scrolled onto.
		     Anything started but unsolved is reported separately rather than
		     folded in, because those are the two things this line used to
		     confuse. -->
		<!-- One expression rather than an {#if}: the separator's leading space is
		     significant, and a block tag lets the formatter wrap the line and eat
		     it, which is how this rendered as "0/35 done· 1 started". -->
		{readPct}% read · {doneCount}/{TOTAL_PLAYGROUNDS} done{attemptedCount
			? ` · ${attemptedCount} started`
			: ''}
	{/if}
{/snippet}

<!--
  The mini timeline, in the header rail's own system rather than a second one.

  What it borrows, and the borrow is of the SYSTEM, not the geometry — at 216px
  there is no room for 57 segments and shrinking the rail would turn it to mud:

    ONE FLAT COLOUR PER UNIT. No gradient, no partial-width fill, no edge
    inside a segment. The unit here is a PART rather than a section, and its
    read fraction picks a colour off the rail's own heat LUT.

    THE HATCH MEANS ONE THING — never been here — at the rail's own weight and
    angle, with the rail's ink/bed relationship in both themes.

    THE MARK SHAPES. Squares are playgrounds, rhomboids are challenges, in
    their own lanes either side of the thread, at the rail's rest sizes and on
    the rail's tokens. Lane AND silhouette, because in dark mode caramel and
    clay collapse toward each other under deuteranopia and the shape is the
    channel that survives — the same reason the rail's own comment gives for
    never merging them.

    GREEN IS ONLY "where you are now", and it is a ring, never a fill.

  One snippet serves both orientations. The horizontal form sits in the
  expanded drawer with the rail's exact arrangement — playgrounds above the
  thread, challenges below. The vertical form is that picture rotated a quarter
  turn by CSS alone, so the two cannot drift apart; see `.mini-v`, which also
  documents why it drops to a single lane at 3px.
-->
{#snippet miniTimeline(vertical: boolean)}
	<div
		class="mini"
		class:mini-v={vertical}
		class:mini-h={!vertical}
		role="img"
		aria-label={progressLabel}
	>
		<!-- Playgrounds: above the thread, as on the rail. -->
		<div class="mini-lane mini-pg" aria-hidden="true">
			{#each partBars as p (p.id)}
				<div class="mini-cell" style="flex-grow: {p.weight};">
					{#if p.pg}
						<span class="stem"></span><span class="mark sq is-{p.pg}"></span>
					{/if}
				</div>
			{/each}
		</div>

		<!-- The thread. -->
		<div class="mini-lane mini-sec">
			{#each partBars as p (p.id)}
				<div
					class="mini-seg"
					class:is-cold={p.cold}
					class:is-here={p.id === activePartId}
					style="flex-grow: {p.weight}; --tone: {p.tone};"
					title={partTitle(p)}
				></div>
			{/each}
		</div>

		<!-- Challenges: below the thread, as on the rail. -->
		<div class="mini-lane mini-ch" aria-hidden="true">
			{#each partBars as p (p.id)}
				<div class="mini-cell" style="flex-grow: {p.weight};">
					{#if p.ch}
						<span class="stem"></span><span class="mark rh is-{p.ch}"></span>
					{/if}
				</div>
			{/each}
		</div>
	</div>
{/snippet}

<!-- Backdrop on mobile when expanded -->
{#if open}
	<button
		class="fixed inset-0 z-40 bg-black/30 lg:hidden"
		onclick={onToggle}
		aria-label="Close sidebar"
	></button>
{/if}

<!-- Flyout backdrop (click outside to close) -->
{#if flyoutSection && !open}
	<button class="fixed inset-0 z-40" onclick={closeFlyout} aria-label="Close flyout"></button>
{/if}

<!-- ───── EXPANDED SIDEBAR ───── -->
<aside
	class="sidebar-expanded fixed top-0 bottom-0 left-0 z-40 flex flex-col border-r transition-all duration-200 ease-out"
	style="width: var(--sidebar-width); padding-top: var(--header-height); border-color: var(--color-border-light);"
	class:translate-x-0={open}
	class:-translate-x-full={!open}
	data-fabric
>
	<div class="flex items-center justify-between px-4 py-3">
		<span
			class="text-xs font-bold tracking-widest uppercase"
			style="color: var(--color-text-muted); letter-spacing: 0.14em; font-family: var(--font-heading);"
		>
			Contents
		</span>
		<button
			onclick={onToggle}
			class="flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
			style="color: var(--color-text-muted);"
			aria-label="Collapse sidebar"
		>
			<PanelLeftClose size={16} />
		</button>
	</div>

	<!-- `sectionsRead`, not `readPct`: one section out of 57 rounds to 2%, but a
	     future denominator could round the first read section to 0 and hide the
	     bar just as the learner earns it. -->
	<!-- Mobile only. On desktop the header rail says all of this and says it
	     better, so a percentage line under CONTENTS was a second, coarser
	     answer to a question already answered above it. -->
	{#if !wide && (sectionsRead > 0 || doneCount > 0)}
		<div class="px-4 pb-2" title={progressLabel}>
			<!-- mr-1 puts the reset button on the same vertical axis (30px from
			     the right edge) as the section carets and the collapse button.

			     The flex-1 cell is the only thing that changes with width: on
			     mobile it holds the mini timeline and the counts sit on their own
			     line beneath; on desktop the bar is the rail's job, so the counts
			     move up into the freed cell rather than leaving a blank row above
			     themselves.

			     The reset button now shares that gate. It used to sit outside the
			     branch and render at every width, which is why the app carried
			     two of them the moment the header grew its own: `wide` is the
			     header's condition too, so hanging this on `!wide` is what makes
			     the pair exclusive by construction rather than by two independent
			     numbers agreeing. The two-click arm/confirm flow and its text in
			     the subtitle are unchanged. -->
			<!-- Everything in here is already inside the `!wide` gate above, so the
			     three nested `wide` checks this used to carry were dead: the
			     desktop-only counts branch could never render, and the two `!wide`
			     guards could never be false. Flattened to what actually runs. The
			     counts line stays UNCONDITIONALLY on mobile — below 744px the rail
			     is not mounted and this is the only place the numbers appear. -->
			<div class="flex items-center">
				<div class="min-w-0 flex-1">
					{@render miniTimeline(false)}
				</div>
				<button
					onclick={handleResetProgress}
					class="mr-1 ml-2 flex h-5 w-5 shrink-0 cursor-pointer items-center justify-center rounded transition-all hover:opacity-100"
					style="color: {resetArmed
						? 'var(--color-warning)'
						: 'var(--color-text-muted)'}; opacity: {resetArmed ? '1' : '0.6'};"
					aria-label={resetArmed ? 'Click again to reset all progress' : 'Reset progress'}
					title={resetArmed ? 'Click again to reset all progress' : 'Reset progress'}
				>
					<RotateCcw size={11} />
				</button>
			</div>
			<p class="mt-1 text-[10.5px]" style="color: var(--color-text-muted);">
				{@render progressCounts()}
			</p>
		</div>
	{/if}

	<!-- pl-[5.5px], not px-3: the icon column must land on the SAME x whether the
	     sidebar is collapsed or open, so the marks never slide sideways under the
	     cursor when it toggles. 5.5 (nav) + 12 (the row's own px-3) + 8.5 (half of
	     a 17px icon) = 26px, which is the app logo's centre. Vertical movement on
	     expand is expected and fine; horizontal is not. -->
	<nav
		class="flex-1 overflow-y-auto py-2 pr-3 pl-[5.5px]"
		style="--nav-open-ms: {OPEN_MS}ms"
		use:autohideScroll
	>
		{#each sections as section, i (section.id)}
			{@const active = isActive(section.id)}
			{@const expanded = Boolean(section.children) && expandedSections.has(section.id)}
			<!-- Blocks and rows sit flush against each other so the thread's
			     per-row pieces meet with no seam; the rows' own py-2.5 is what
			     keeps the list breathing, not margins between them. -->
			<div class="nav-block">
				<div
					class="nav-item relative flex w-full items-center gap-2.5 px-3 py-2.5 text-left transition-all"
					class:spine-start={i === 0}
					class:spine-end={i === sections.length - 1}
					style="color: {active ? 'var(--color-primary)' : 'var(--color-text)'};"
				>
					<!-- The lit half of the thread: from this icon's centre down
					     through everything the part holds. A real element rather
					     than a second background on ::before, because opacity is
					     the only thing that can fade the brightening up in step
					     with the slide instead of switching it on at frame one. -->
					<span class="nav-spine-lit" class:is-lit={expanded} aria-hidden="true"></span>
					<button
						onclick={() => {
							// The label both navigates and toggles: clicking a part opens
							// it, clicking it again closes it. The caret does the same
							// without moving the page.
							if (section.children) toggleSection(section.id);
							scrollTo(section.id);
						}}
						class="flex flex-1 cursor-pointer items-center gap-2.5 text-left"
						style="color: inherit;"
					>
						{@render navIcon(section, active, 17)}
						<span
							class="flex-1"
							style="font-family: var(--font-heading); font-weight: {active
								? '700'
								: '500'}; font-size: 14.5px; letter-spacing: -0.01em;"
						>
							{section.label}
						</span>
					</button>
					{#if section.children}
						<!-- -mr-1 lines the caret up with the collapse and reset buttons
						     (all centered 30px from the sidebar's right edge) -->
						<button
							onclick={() => toggleSection(section.id)}
							class="-mr-1 flex h-5 w-5 cursor-pointer items-center justify-center rounded transition-colors"
							aria-label={expandedSections.has(section.id) ? 'Collapse' : 'Expand'}
						>
							<!-- Timed from OPEN_MS rather than a duration- class so the
							     caret turns on exactly the clock the children slide on.
							     cubic-bezier(0.33, 1, 0.68, 1) is cubicOut, the easing
							     passed to slide below. -->
							<ChevronRight
								size={13}
								style="transform: rotate({expanded
									? '90deg'
									: '0deg'}); opacity: 0.5; transition: transform {OPEN_MS}ms cubic-bezier(0.33, 1, 0.68, 1);"
							/>
						</button>
					{/if}
				</div>

				{#if expanded}
					<!-- Both numbers are derived from the section row above, not
					     eyeballed, so the two stay locked together:

					     The rule hangs from the section ICON. That icon starts at
					     12px (nav px-3) + 12px (row px-3) = 24px and is 17px wide,
					     so its centre is 32.5px. This div's content edge is at 12px,
					     so ml-5 (20px) puts the 1px border at 32-33 — centred on it.

					     The child icons line up with the section LABEL, which starts
					     after the icon and its gap-2.5: 24 + 17 + 10 = 51px. From the
					     border at 33px, the child button's own px-2.5 contributes
					     10px, so this padding must be the remaining 8px (pl-2). -->
					<div
						class="ml-5 space-y-0.5 border-l pl-2"
						style="border-color: var(--thread-lit);"
						transition:slide={{ duration: OPEN_MS, easing: cubicOut }}
					>
						{#each section.children as child (child.id)}
							{@const childActive = activeSection === child.id}
							{@const activity = isActivity(child)}
							<button
								onclick={() => scrollTo(child.id)}
								class="nav-child-item relative flex w-full cursor-pointer items-center gap-2 px-2.5 py-1 text-left text-[13px] transition-all"
								style="color: {activityColor(child) ??
									(childActive
										? 'var(--color-primary)'
										: 'var(--nav-child-ink)')}; font-weight: {childActive
									? '600'
									: '400'}; opacity: {activityOpacity(
									child,
									activity,
									childActive
								)}; font-size: {activity ? '12px' : '13px'};"
							>
								{@render navIcon(child, childActive, activity ? 11 : 13)}
								<span
									>{child.label}{#if activity}{@render activityMark(child)}{/if}</span
								>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/each}
	</nav>
</aside>

<!-- ───── COLLAPSED ICON RAIL ───── -->
{#if !open}
	<aside
		class="sidebar-collapsed fixed top-0 bottom-0 left-0 z-40 flex flex-col items-center border-r py-2"
		style="width: var(--sidebar-collapsed-width); padding-top: calc(var(--header-height) + 8px); border-color: var(--color-border-light);"
		data-fabric
	>
		<button
			onclick={onToggle}
			class="mb-2 flex h-9 w-9 cursor-pointer items-center justify-center rounded-md transition-colors hover:opacity-70"
			style="color: var(--color-text-muted);"
			aria-label="Expand sidebar"
		>
			<PanelLeft size={17} />
		</button>

		<!-- The only progress a mobile reader sees before opening the drawer, so
		     it is the same model rather than a different summary: the identical
		     15 part segments, rotated, hugging the right border. It spans the
		     rail's full height rather than tracking the icon column — the icons
		     are a fixed 42px each while the rail is viewport-height, so the two
		     only coincide at one window size, and a track that stretches is
		     always fully visible where an aligned one would clip on a short
		     viewport. Gated like the expanded bar: before the first section is
		     read there is nothing to say — and, like it, only below the rail's
		     breakpoint. The spine is the same mini timeline rotated, so it is
		     the same duplicate of the header rail and falls under the same rule;
		     leaving it on desktop is exactly the "two timelines" the change is
		     removing, just turned sideways. -->
		<!-- No timeline on the COLLAPSED rail. A 3px vertical strip beside a
		     column of icons is not a smaller version of the header rail, it is a
		     different and worse object — and on a phone the collapsed rail is the
		     default state, so it was the first thing a reader saw. The marks wait
		     for the drawer, which is one tap away. -->

		<div class="mb-1.5"></div>

		{#each sections as section (section.id)}
			{@const active = isActive(section.id)}
			<button
				onclick={(e) => {
					if (section.children) {
						openFlyout(section.id, e);
					} else {
						scrollTo(section.id);
						closeFlyout();
					}
				}}
				onmouseenter={(e) => {
					if (section.children) {
						openFlyout(section.id, e);
					}
				}}
				class="group relative mb-0.5 flex h-10 w-10 cursor-pointer items-center justify-center transition-all"
				style="color: {active ? 'var(--color-primary)' : 'var(--color-text-muted)'};"
				aria-label={section.label}
			>
				{@render navIcon(section, active, 17)}
				{#if !flyoutSection}
					<span
						class="pointer-events-none absolute left-14 z-50 rounded-md px-2.5 py-1.5 text-xs font-medium whitespace-nowrap opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
						style="background: var(--color-surface); color: var(--color-text); border: 1px solid var(--color-border);"
					>
						{section.label}
					</span>
				{/if}
			</button>
		{/each}
	</aside>

	{#if flyoutSection}
		{@const section = sections.find((s) => s.id === flyoutSection)}
		{#if section}
			<div
				class="fixed z-50 rounded-xl border shadow-xl"
				style="left: calc(var(--sidebar-collapsed-width) + 6px); top: {flyoutY}px; width: 210px; background: var(--color-surface); border-color: var(--color-border);"
				role="group"
				aria-label={section.label}
				onmouseleave={closeFlyout}
			>
				<button
					onclick={() => {
						handleFlyoutNavigate(section.id);
					}}
					class="flyout-header flex w-full cursor-pointer items-center gap-2 rounded-t-xl px-3 py-2.5 text-left transition-colors"
					style="color: var(--color-text); border-bottom: 1px solid var(--color-border-light); font-family: var(--font-heading); font-size: 13.5px; font-weight: 600; letter-spacing: -0.01em;"
				>
					{@render navIcon(section, isActive(section.id), 15)}
					{section.label}
				</button>

				{#if section.children}
					<div class="px-1.5 py-1.5">
						{#each section.children as child (child.id)}
							{@const childActive = activeSection === child.id}
							{@const activity = isActivity(child)}
							<button
								onclick={() => handleFlyoutNavigate(child.id)}
								class="flyout-child flex w-full cursor-pointer items-center gap-1.5 rounded-md px-2.5 py-1 text-left transition-all"
								style="color: {activityColor(child) ??
									(childActive
										? 'var(--color-primary)'
										: 'var(--color-text-secondary)')}; font-weight: {childActive
									? '600'
									: '400'}; opacity: {activityOpacity(
									child,
									activity,
									childActive
								)}; font-size: {activity ? '11px' : '12px'};"
							>
								{@render navIcon(child, childActive, activity ? 10 : 12)}
								<span
									>{child.label}{#if activity}{@render activityMark(child)}{/if}</span
								>
							</button>
						{/each}
					</div>
				{/if}
			</div>
		{/if}
	{/if}
{/if}

<style>
	/* ───── mini timeline ─────────────────────────────────────────────────
	   The header rail's semantic colours, on the rail's own tokens. Caramel and
	   clay switch source per theme for the same reason they do there:
	   --color-playground-border is a dark brown in dark mode, so the agent
	   button's gold takes over — same role, no new hue invented. */
	.mini {
		--tv-green: var(--color-primary);
		--tv-brown: var(--color-vibe);
		--tv-caramel: var(--color-playground-border);
		--tv-clay: var(--color-challenge);
		--tv-earned-bright: var(--color-earned-bright);
		--tv-clay-bright: var(--color-challenge-bright);

		/* THE HATCH, and this is the correction the whole rebuild turns on.
		   It was ink 82% over bed 11% — a 7.5:1 relationship, with no dark-mode
		   branch at all, so dark got the light values and the stripes were seven
		   times brighter than the bar they were meant to be texturing. That is
		   the identical defect the rail was just fixed for ("eight times
		   brighter"), and it is what "the hashing of the boxes" names.

		   These are the rail's own numbers, copied rather than re-judged: light
		   keeps 72/9, dark lifts the bed to 30 and pulls the ink down to 52 so
		   the two sit close together and the hatch becomes a SURFACE rather than
		   the subject. */
		--hatch-ink: color-mix(in srgb, var(--tv-brown) 72%, transparent);
		--hatch-bed: color-mix(in srgb, var(--tv-brown) 9%, transparent);
		--thread-dim: color-mix(in srgb, var(--tv-brown) 26%, transparent);

		/* Unattempted marks, at the rail's exact weights. Playgrounds whisper
		   (a hairline over a barely-there fill); challenges do not, because
		   there is one per chapter and it is the reward at the end of it. */
		--pg-line: color-mix(in srgb, var(--tv-caramel) 38%, transparent);
		--pg-fill: color-mix(in srgb, var(--tv-caramel) 7%, transparent);
		--ch-line: var(--tv-clay);
		--ch-fill: color-mix(in srgb, var(--tv-clay) 26%, transparent);

		display: flex;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not(.light)) .mini {
			--tv-caramel: var(--color-btn-agent);
			--hatch-bed: color-mix(in srgb, var(--tv-brown) 30%, transparent);
			--hatch-ink: color-mix(in srgb, var(--tv-brown) 52%, transparent);
			--thread-dim: color-mix(in srgb, var(--tv-brown) 42%, transparent);
		}
	}
	:global(:root.dark) .mini {
		--tv-caramel: var(--color-btn-agent);
		--hatch-bed: color-mix(in srgb, var(--tv-brown) 30%, transparent);
		--hatch-ink: color-mix(in srgb, var(--tv-brown) 52%, transparent);
		--thread-dim: color-mix(in srgb, var(--tv-brown) 42%, transparent);
	}
	:global(:root.light) .mini {
		--tv-caramel: var(--color-playground-border);
		--hatch-bed: color-mix(in srgb, var(--tv-brown) 9%, transparent);
		--hatch-ink: color-mix(in srgb, var(--tv-brown) 72%, transparent);
		--thread-dim: color-mix(in srgb, var(--tv-brown) 26%, transparent);
	}

	.mini-lane {
		display: flex;
		min-width: 0;
		min-height: 0;
	}
	/* The activity lanes are a row of cells on the SAME flex weights as the
	   thread, so a part's mark is centred over that part's segment however the
	   widths fall out. Nothing in them is a strip any more. */
	.mini-cell {
		position: relative;
		flex-basis: 0;
		flex-shrink: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* ---- the marks ------------------------------------------------------
	   The rail's rest sizes: `pgMin` is 4 and `CH_MIN` is 4.6, and the diamond's
	   EDGE is CH_RATIO (0.8) of the square's so that a shape rotated 45° does
	   not end up 41% wider than its neighbour. 4.5 / 3.6 keeps that ratio while
	   sitting a touch above the rail's floor, because these marks never magnify
	   — the rail's smallest state is this surface's only state. */
	.mini .mark {
		--pg-edge-size: 4.2px;
		--ch-edge-size: 3.4px;
		display: block;
		box-sizing: border-box;
		/* `flex: 0 0 auto` is load-bearing, not tidiness. These sit in a flex row,
		   and a flex item's declared width is only a BASIS — the default
		   `flex-shrink: 1` lets the row squash it along the main axis whenever the
		   track is tight, which is most of the time at sidebar width. The square
		   stopped being square, and a rotated rectangle reads as neither a square
		   nor a rhomboid. Opting out of shrink is what makes the declared size the
		   real size. */
		flex: 0 0 auto;
	}
	.mini .sq {
		width: var(--pg-edge-size);
		height: var(--pg-edge-size);
		/* NOT the rail's 1.5px. That radius is tuned for a mark that spans 4 to
		   9.5px under the lens and spends most of its life at the top of that
		   range; these never magnify, so 1.5px on a 5.2px box rounds 3px off
		   each corner and the square becomes a circle — which is both the wrong
		   shape and the one marker the owner has asked not to see. 0.16 of the
		   edge is the rail's own radius-to-size ratio at full magnification, so
		   these are that ratio held rather than the absolute number copied. */
		border-radius: 0.85px;
		border: 1px solid var(--pg-line);
		background: var(--pg-fill);
	}
	.mini .rh {
		width: var(--ch-edge-size);
		height: var(--ch-edge-size);
		border-radius: 0.7px;
		transform: rotate(45deg);
		border: 1px solid var(--ch-line);
		background: var(--ch-fill);
	}
	/* Three states, stepping monotonically in weight exactly as on the rail:
	   outline -> solid on-colour -> the family's BRIGHT lift. The rail spends a
	   star on that last step because within one lane at 5px the solved/unsolved
	   step would otherwise be colour alone, and dark-mode clay against bright
	   clay is close under deuteranopia. A star is not drawable at 4.5px without
	   an SVG per mark, so the brightness step is carried by a ring instead: a
	   halo the unsolved states do not have is a change in EXTENT, which is the
	   same kind of channel a shape change is. */
	.mini .sq.is-some {
		background: var(--tv-caramel);
		border-color: var(--tv-caramel);
	}
	.mini .sq.is-all {
		background: var(--tv-earned-bright);
		border-color: var(--tv-earned-bright);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--tv-earned-bright) 30%, transparent);
	}
	.mini .rh.is-attempted {
		background: var(--tv-clay);
		border-color: var(--tv-clay);
	}
	.mini .rh.is-completed {
		background: var(--tv-clay-bright);
		border-color: var(--tv-clay-bright);
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--tv-clay-bright) 30%, transparent);
	}

	/* The hairline that ties a mark back to the thread, at the rail's own
	   opacities. It is what makes the three lanes read as one object rather
	   than three rows that happen to share an axis. */
	.mini .stem {
		position: absolute;
		background: color-mix(in srgb, var(--tv-caramel) 38%, transparent);
	}
	.mini-ch .stem {
		background: color-mix(in srgb, var(--tv-clay) 42%, transparent);
	}

	/* ---- horizontal: the expanded drawer ---- */
	.mini-h {
		flex-direction: column;
	}
	.mini-h .mini-lane {
		flex-direction: row;
		gap: 1.5px;
	}
	.mini-h .mini-sec {
		/* 6px: just above the 5.5px at which the rail gives up on the hatch
		   (`is-tiny`), which is what lets this bar keep it honestly. */
		height: 6px;
	}
	.mini-h .mini-pg,
	.mini-h .mini-ch {
		height: 7px;
	}
	.mini-h .mini-seg,
	.mini-h .mini-cell {
		min-width: 7px;
	}
	/* Stems run vertically, from the thread out to the mark. */
	.mini-h .stem {
		left: 50%;
		width: 1px;
		margin-left: -0.5px;
	}
	.mini-h .mini-pg .stem {
		top: 50%;
		bottom: -1px;
	}
	.mini-h .mini-ch .stem {
		top: -1px;
		bottom: 50%;
	}

	/* ---- vertical: the collapsed rail ----------------------------------
	   ONE LANE, and that is a judgement rather than an omission.

	   This strip is 3px wide with the icon column 4px to its left; three lanes
	   plus stems would need ~15px and would put a 4.5px mark within a pixel of
	   the nav icons. The rail has the precedent for degrading rather than
	   shrinking: `.tt-seg.is-tiny` drops the hatch and falls back to a flat
	   `--thread-dim` the moment a bar is too narrow to carry a 45° stripe, on
	   the grounds that under ~3px a diagonal is just noise. A 3px column is
	   exactly that case, so it takes the same fallback — flat tones, no hatch —
	   and the marks wait for the drawer, which is one tap away.

	   The strip stays full-height for the reason it always did: the icons are a
	   fixed 42px pitch while the rail is viewport-height, so a track aligned to
	   them clips on a short viewport where a stretched one never does. What
	   made it read as a barcode was the hashing, not the length. */
	.mini-vwrap {
		position: absolute;
		top: calc(var(--header-height) + 58px);
		right: 5px;
		bottom: 10px;
	}
	.mini-v {
		flex-direction: row;
		height: 100%;
	}
	.mini-v .mini-lane {
		flex-direction: column;
		gap: 1.5px;
	}
	.mini-v .mini-sec {
		width: 3px;
	}
	.mini-v .mini-pg,
	.mini-v .mini-ch {
		display: none;
	}
	.mini-v .mini-seg {
		min-height: 9px;
	}
	.mini-v .mini-seg.is-cold {
		background-image: none;
		background-color: var(--thread-dim);
	}

	/* ---- the thread: ONE FLAT COLOUR PER PART --------------------------
	   `--tone` is resolved in script off the rail's own heat LUT, so a part's
	   read fraction lands on the same ramp a section's dwell heat does up there.
	   No gradient and no fill edge: the rail collapsed to one bucket per bar
	   precisely because 57 little ramps read as too busy, and 15 of them at a
	   third of the size would read worse. */
	.mini-seg {
		position: relative;
		flex-shrink: 1;
		flex-basis: 0;
		border-radius: 1.5px;
		background-color: var(--tone);
		transition: background-color 400ms ease-out;
	}
	/* The hatch means exactly one thing, here as on the rail: you have never
	   been here. 45° and the rail's own stop pattern — a 0.3px solid core
	   ramping to nothing by 0.75px over a 3.9px period, which is roughly an
	   eighth of the ink the old 118°/1.7px-hard stripe carried, and it is
	   ANTIALIASED rather than a sub-pixel hard edge.

	   background-size is PINNED, and that is the other half of "the hashing of
	   the boxes". With `auto` the gradient box is the element box, so CSS
	   centres the pattern's line on each segment individually — and these
	   segments are flex-grown to fifteen different widths, so every box hashed
	   at a different phase and the row read as fifteen unrelated scratch
	   patches. 31.68px is the rail's tile: 7 periods along each axis
	   (3.9px along the gradient line is 3.9 x √2 along x), so the tiles abut in
	   phase and the texture is continuous across the whole bar. */
	.mini-seg.is-cold {
		background-color: var(--hatch-bed);
		background-image: repeating-linear-gradient(
			45deg,
			var(--hatch-ink) 0 0.3px,
			transparent 0.75px 3.9px
		);
		background-size: 31.68px 31.68px;
	}
	/* GREEN = where you are now, and only that. A ring, never a fill —
	   recolouring the segment would conflate "here" with "read", which is the
	   one thing the rail is careful never to do. This is the rail's own
	   `.tt-seg.is-active` value; the vertical strip takes a thinner, stronger
	   one because a 1.5px ring on a 3px column is wider than the column. */
	.mini-seg.is-here {
		box-shadow: 0 0 0 1.5px color-mix(in srgb, var(--tv-green) 55%, transparent);
		z-index: 1;
	}
	.mini-v .mini-seg.is-here {
		box-shadow: 0 0 0 1px color-mix(in srgb, var(--tv-green) 75%, transparent);
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-seg {
			transition-duration: 1ms;
		}
	}

	.sidebar-expanded {
		/* Subsection ink, a step up from --color-text-muted toward
		   --color-text-secondary. The muted token was carrying 13px rows at
		   3.34:1 in dark and 3.88:1 in light, both under the 4.5:1 that normal
		   text wants; 30% of the way to secondary reads as the same quiet
		   second level while clearing 4.47:1 and 4.74:1. */
		--nav-child-ink: color-mix(in srgb, var(--color-text-muted) 70%, var(--color-text-secondary));
		/* Clearance the thread leaves around each icon: the 17px glyph plus
		   3px either side, so the strokes never touch the line. Widening this
		   shortens the connecting dashes between rows — at the ~44.7px row
		   pitch, 23px leaves about 10.8px of line above and below each icon. */
		--thread-gap: 23px;
		background: color-mix(in srgb, var(--color-bg) 55%, transparent);
		backdrop-filter: blur(28px) saturate(1.5);
		-webkit-backdrop-filter: blur(28px) saturate(1.5);
	}

	.sidebar-collapsed {
		background: color-mix(in srgb, var(--color-bg) 40%, transparent);
		backdrop-filter: blur(24px) saturate(1.4);
		-webkit-backdrop-filter: blur(24px) saturate(1.4);
	}

	.nav-item:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	/* ───── the thread ───────────────────────────────────────────────────
	   A hairline threading the section icons from the rocket at the top to
	   the book at the bottom, so the parts read as stops on a single course
	   rather than fifteen unrelated rows.

	   It BREAKS at every icon. Drawing it straight through looked dirty:
	   these are outlined, open glyphs, so a line crossing one shows through
	   its interior and collides with its strokes. Stopping short either side
	   lets the icon sit in the thread the way a bead sits on a string — and
	   as a side effect nothing overlaps any more, so the line no longer has
	   to be ordered behind the icons to stay legible.

	   It is deliberately NOT one element. Each row draws the two pieces that
	   cross it and each open part's rule draws its own, so the thread is
	   produced by layout instead of measured against it: nothing to
	   recompute on resize, on expand, or per frame while a part animates
	   open, and no way for it to fall out of sync with the rows it connects.
	   The cost is that rows must sit flush — hence no margins between blocks.

	   left: 20px is the row's own offset to the icon's centre. The row
	   begins at the nav's 12px padding and pads itself 12px more, so the
	   17px icon spans 12–29px within the row and its centre is 20.5px. */
	.nav-item::before,
	.nav-item::after {
		content: '';
		position: absolute;
		left: 20px;
		width: 1px;
		background: var(--thread-dim);
		pointer-events: none;
	}

	/* Above the icon, and below it. The gap is centred on 50% because the
	   icon is vertically centred in its row, so neither piece needs to know
	   the row height. */
	.nav-item::before {
		top: 0;
		bottom: calc(50% + var(--thread-gap) / 2);
	}
	.nav-item::after {
		top: calc(50% + var(--thread-gap) / 2);
		bottom: 0;
	}

	/* The thread starts and ends ON an icon, not in the space above the
	   first or below the last: the first row has no piece above its icon,
	   the last none below. */
	.nav-item.spine-start::before,
	.nav-item.spine-end::after {
		content: none;
	}

	/* Inside an open part the thread lifts one step, --thread-dim →
	   --thread-lit. Both stay far below the text beside them; the point is
	   the *relative* change, which reads as "you are inside this" without
	   either state becoming a visible bar.

	   It starts below this row's icon, so the brighter run always begins at
	   the part it belongs to. On the last row it is also what carries the
	   thread past the point .spine-end stopped it. */
	.nav-spine-lit {
		position: absolute;
		left: 20px;
		top: calc(50% + var(--thread-gap) / 2);
		bottom: 0;
		width: 1px;
		background: var(--thread-lit);
		opacity: 0;
		transition: opacity var(--nav-open-ms) cubic-bezier(0.33, 1, 0.68, 1);
		pointer-events: none;
	}
	.nav-spine-lit.is-lit {
		opacity: 1;
	}

	/* ───── child rows: one column, one spacing ───────────────────────────
	   Vertical padding went 0.375rem → 0.25rem (py-1.5 → py-1) in BOTH the
	   expanded nav and the collapsed flyout. It has to be both: they are two
	   renderings of the same list, and a reader who opens the flyout would
	   otherwise see a different TOC. The subsection type is already a step
	   down from the part label, so the tighter row still reads as a list —
	   and it buys back ~5px per row, which is what makes room for a
	   fifteenth child (the Part's challenge) in the taller Parts.

	   min-height is the floor that stops the tighter padding from shrinking
	   a row below a usable tap target on mobile, where this sidebar IS the
	   primary nav: 26px clears the 24px of WCAG 2.2 SC 2.5.8 (AA) even for
	   the 11–12px activity rows, whose text alone is shorter than a
	   subsection's. Without it the saving would come straight out of the
	   touch target. */
	.nav-child-item,
	.flyout-child {
		min-height: 26px;
	}

	/* ───── activity state marks ─────────────────────────────────────────── */
	.act-tick {
		margin-left: 0.3em;
	}

	/* ATTEMPTED: the rail's own shape, drawn as an OUTLINE. An outline reads as
	   "open, not closed" where a filled mark would read as a second kind of
	   completion. 0.58em keeps it a shade under the tick at both row sizes
	   (13px and 11px) without a second rule per size, and currentColor makes it
	   the row's own hue — earth-red for a challenge, caramel for a playground. */
	.act-open {
		display: inline-block;
		width: 0.58em;
		height: 0.58em;
		margin-left: 0.4em;
		vertical-align: -0.01em;
		border: 1.5px solid currentColor;
		border-radius: 1px;
		opacity: 0.85;
	}

	/* Challenges are rhomboids on the rail, so they are rhomboids here. Rotating
	   the same box costs nothing and keeps the two surfaces honest; the slight
	   shrink stops the turned corners from sitting taller than the tick. */
	.act-rhomb {
		transform: rotate(45deg) scale(0.86);
	}

	.nav-child-item:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
		border-radius: 6px;
	}

	.flyout-header:hover {
		background: color-mix(in srgb, var(--color-text) 4%, transparent);
	}

	.flyout-child:hover {
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
	}
</style>
