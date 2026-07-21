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

	/* ── the mini timeline ──────────────────────────────────────────────────
	   Granularity is PARTS (15), not sections (57), and that is a measurement
	   rather than a preference. The expanded bar gets ~216px (280px sidebar,
	   less 32px of padding and 32px for the reset button). At 57 segments with
	   1.5px gaps each segment is (216 - 84) / 57 = 2.3px — below the 5.5px
	   height at which the rail itself gives up on the hatch (`is-tiny`) and
	   well under any width that can show a partial fill. At 15 segments each
	   gets ~13px, which holds the hatch, a fill boundary and a ring.

	   Section-level resolution is not lost, it moves: each part segment is
	   FILLED by the fraction of its own sections read, so 3-of-4 still reads as
	   three quarters. That is the honest trade at this size — resolution in the
	   fill, not in the segment count.

	   Widths are proportional to each part's anchor count, so the bar keeps the
	   rail's sense of course shape; `min-width` stops the two-anchor parts
	   (Part 11, Part 13) from disappearing. */
	const partBars = $derived(
		partStats.map((p, i) => ({
			...p,
			weight: p.sections + p.playgrounds,
			readFrac: p.sections ? p.sectionsRead / p.sections : 0,
			doneFrac: p.playgrounds ? p.playgroundsDone / p.playgrounds : 0,
			// Drawn UNDER doneFrac in a dimmer caramel, so a part you have started
			// but not finished is visibly different from one you have not opened —
			// the bar's version of the same three states the rows show.
			engagedFrac: p.playgrounds ? engagedStats[i].playgroundsDone / p.playgrounds : 0
		}))
	);

	/** Which part the reader is inside — the rail's GREEN, "where you are now". */
	const activePartId = $derived(sections.find((s) => isActive(s.id))?.id ?? null);

	const progressLabel = $derived(
		`Course progress: ${sectionsRead} of ${TOTAL_SECTIONS} sections read, ` +
			`${doneCount} of ${TOTAL_PLAYGROUNDS} exercises completed` +
			(attemptedCount ? `, ${attemptedCount} started.` : '.')
	);

	function partTitle(p: (typeof partBars)[number]): string {
		const read = `${p.sectionsRead}/${p.sections} read`;
		if (!p.playgrounds) return `${p.label} — ${read}`;
		const started = Math.round(p.engagedFrac * p.playgrounds) - p.playgroundsDone;
		const solved = `${p.playgroundsDone}/${p.playgrounds} solved`;
		return `${p.label} — ${read} · ${solved}${started > 0 ? ` · ${started} started` : ''}`;
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
  The mini timeline, in the header rail's own semantic system: BROWN sections
  on the thread, CARAMEL playgrounds in their own lane, GREEN for where you are
  now. Solid = read/solved, hatched = not. Geometry — two lanes — is what keeps
  brown and caramel apart in dark mode, exactly as on the rail; no new hues.

  One snippet serves both orientations. The horizontal form sits in the
  expanded drawer; the vertical form is rotated by CSS alone (flex direction
  swaps, and the fill reads `--f` into height instead of width) so the two can
  never drift apart.
-->
{#snippet miniTimeline(vertical: boolean)}
	<div
		class="mini"
		class:mini-v={vertical}
		class:mini-h={!vertical}
		role="img"
		aria-label={progressLabel}
	>
		<div class="mini-lane mini-sec">
			{#each partBars as p (p.id)}
				<div
					class="mini-seg"
					class:is-here={p.id === activePartId}
					style="flex-grow: {p.weight}; --f: {p.readFrac};"
					title={partTitle(p)}
				>
					<div class="fill"></div>
				</div>
			{/each}
		</div>
		<div class="mini-lane mini-pg">
			{#each partBars as p (p.id)}
				<div
					class="mini-pgseg"
					class:has-pg={p.playgrounds > 0}
					style="flex-grow: {p.weight}; --f: {p.doneFrac}; --a: {p.engagedFrac};"
				>
					{#if p.playgrounds}<div class="tryfill"></div>
						<div class="fill"></div>{/if}
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
	{#if sectionsRead > 0 || doneCount > 0}
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
			<div class="flex items-center">
				<div class="min-w-0 flex-1">
					{#if wide}
						<p class="truncate text-[10.5px]" style="color: var(--color-text-muted);">
							{@render progressCounts()}
						</p>
					{:else}
						{@render miniTimeline(false)}
					{/if}
				</div>
				{#if !wide}
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
				{/if}
			</div>
			{#if !wide}
				<p class="mt-1 text-[10.5px]" style="color: var(--color-text-muted);">
					{@render progressCounts()}
				</p>
			{/if}
		</div>
	{/if}

	<nav
		class="flex-1 overflow-y-auto px-3 py-2"
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
					{#if active}
						<span
							class="absolute top-1.5 bottom-1.5 left-0 w-[3px] rounded-r-full"
							style="background: var(--color-primary);"
						></span>
					{/if}
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
		{#if !wide && (sectionsRead > 0 || doneCount > 0)}
			<div class="mini-vwrap" title={progressLabel}>
				{@render miniTimeline(true)}
			</div>
		{/if}

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
	   The header rail's three semantic colours, on the rail's own tokens.
	   Caramel switches source per theme for the same reason it does there:
	   --color-playground-border is a dark brown in dark mode, so the agent
	   button's gold takes over — same role, no new hue invented. */
	.mini {
		--tv-green: var(--color-primary);
		--tv-brown: var(--color-vibe);
		--tv-caramel: var(--color-playground-border);
		--hatch-ink: color-mix(in srgb, var(--tv-brown) 82%, transparent);
		--hatch-bed: color-mix(in srgb, var(--tv-brown) 11%, transparent);
		--pg-bed: color-mix(in srgb, var(--tv-caramel) 16%, transparent);
		--pg-edge: color-mix(in srgb, var(--tv-caramel) 60%, transparent);
		display: flex;
	}

	@media (prefers-color-scheme: dark) {
		:global(:root:not(.light)) .mini {
			--tv-caramel: var(--color-btn-agent);
		}
	}
	:global(:root.dark) .mini {
		--tv-caramel: var(--color-btn-agent);
	}
	:global(:root.light) .mini {
		--tv-caramel: var(--color-playground-border);
	}

	.mini-lane {
		display: flex;
		min-width: 0;
		min-height: 0;
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
		/* 6px, deliberately: the rail drops its hatch below 5.5px (`is-tiny`)
		   because a 118deg stripe stops resolving there. Sitting just above that
		   line is what lets the sidebar keep the hatch honestly. */
		height: 6px;
	}
	.mini-h .mini-pg {
		height: 2.5px;
		margin-top: 2px;
	}
	.mini-h .mini-seg,
	.mini-h .mini-pgseg {
		min-width: 7px;
	}
	.mini-h .fill {
		width: calc(var(--f) * 100%);
		height: 100%;
	}

	/* ---- vertical: the collapsed rail ---- */
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
		gap: 2px;
	}
	.mini-v .mini-sec {
		width: 3px;
	}
	.mini-v .mini-pg {
		width: 2.5px;
		margin-left: 2px;
	}
	.mini-v .mini-seg,
	.mini-v .mini-pgseg {
		min-height: 9px;
	}
	.mini-v .fill {
		height: calc(var(--f) * 100%);
		width: 100%;
	}

	/* ---- section segments: brown, hatched until read ---- */
	.mini-seg {
		position: relative;
		flex-shrink: 1;
		flex-basis: 0;
		overflow: hidden;
		border-radius: 1.5px;
		background-color: var(--hatch-bed);
		background-image: repeating-linear-gradient(
			118deg,
			var(--hatch-ink) 0 1.7px,
			transparent 2.1px 5px
		);
	}
	.mini-seg .fill {
		background: var(--tv-brown);
		border-radius: 1.5px;
		transition:
			width 400ms ease-out,
			height 400ms ease-out;
	}
	/* GREEN = where you are now. A ring, not a fill — recolouring the fill would
	   conflate "here" with "read", which is the one thing the rail is careful
	   never to do. */
	.mini-seg.is-here {
		overflow: visible;
		box-shadow: 0 0 0 1px var(--tv-green);
		z-index: 1;
	}

	/* ---- playground lane: caramel, its own geometry ---- */
	.mini-pgseg {
		position: relative;
		flex-shrink: 1;
		flex-basis: 0;
		overflow: hidden;
		border-radius: 1.5px;
	}
	/* At 2.5px a hatch is a single stray stripe, so unsolved playgrounds degrade
	   to a dim caramel bed — the same fallback the rail makes at `is-small`,
	   which is still unmistakably "not filled in" against solid caramel. */
	.mini-pgseg.has-pg {
		background: var(--pg-bed);
		box-shadow: inset 0 0 0 0.5px var(--pg-edge);
	}
	.mini-pgseg .fill {
		/* Positioned, so the SOLID (completed) fill paints above the absolutely
		   positioned half-tone beneath it rather than under it. */
		position: relative;
		z-index: 1;
		background: var(--tv-caramel);
		border-radius: 1.5px;
		transition:
			width 400ms ease-out,
			height 400ms ease-out;
	}

	/* STARTED-but-unsolved, drawn under the solid fill in a half-strength
	   caramel. Three tones in one lane — bed, half, solid — is what stops a part
	   you have opened and worked in from looking identical to one you have only
	   scrolled past. Same track and same axis as .fill, so it needs no geometry
	   of its own beyond reading --a where .fill reads --f. */
	.mini-pgseg .tryfill {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--tv-caramel) 45%, transparent);
		border-radius: 1.5px;
		transition:
			width 400ms ease-out,
			height 400ms ease-out;
	}
	.mini-h .tryfill {
		width: calc(var(--a) * 100%);
		height: 100%;
	}
	.mini-v .tryfill {
		height: calc(var(--a) * 100%);
		width: 100%;
	}

	@media (prefers-reduced-motion: reduce) {
		.mini-seg .fill,
		.mini-pgseg .fill,
		.mini-pgseg .tryfill {
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
