<script lang="ts">
	import { tick } from 'svelte';
	import { Sun, Moon, ScrollText, Gamepad2, Bot, X, RotateCcw } from 'lucide-svelte';
	import { resetAllLearningState } from '$lib/data/progress';
	// Brand marks live locally: lucide removed them in v1. See GithubIcon.svelte.
	import Github from '$lib/components/ui/GithubIcon.svelte';
	import Linkedin from '$lib/components/ui/LinkedinIcon.svelte';
	import { base } from '$app/paths';
	import Search from './Search.svelte';
	import ThreadRail from './ThreadRail.svelte';
	import type { PlacedItem } from '$lib/timeline/mapping';
	import { watchRailBreakpoint } from '$lib/timeline/breakpoint';

	let {
		theme = 'system',
		onToggleTheme,
		onToggleCheatSheet,
		onTogglePlayground,
		onToggleAgent,
		onNavigate,
		timelineItems = [],
		scrollPosition = 0,
		readIds = new Set<string>(),
		doneIds = new Set<string>()
	}: {
		theme: string;
		onToggleTheme: () => void;
		onToggleCheatSheet: () => void;
		onTogglePlayground: () => void;
		onToggleAgent: () => void;
		onNavigate?: (id: string) => void;
		/** the course manifest with measured offsets — empty until measured */
		timelineItems?: PlacedItem[];
		scrollPosition?: number;
		readIds?: Set<string>;
		doneIds?: Set<string>;
	} = $props();

	let aboutOpen = $state(false);

	/** Whether the search box currently holds focus, and so is at full width. */
	let searchExpanded = $state(false);

	// The rail is a fisheye over 100+ anchors and is hover-driven. Gate on
	// matchMedia rather than CSS so it is not merely hidden: a display:none rail
	// would still mount, measure a zero width, and keep a ResizeObserver alive
	// for nothing.
	//
	// The query itself lives in $lib/timeline/breakpoint because the sidebar's
	// mini timeline is its exact complement — it renders when this does not.
	// That file also carries the measurements behind the 744px value and the
	// shedding ladder this header uses to hold the rail down to it.
	let wide = $state(false);
	$effect(() => watchRailBreakpoint((m) => (wide = m)));

	/* ── reset ──────────────────────────────────────────────────────────────
	   Lives here rather than in the sidebar because it is an action ON the
	   timeline, and the timeline is here. The sidebar keeps its own copy for
	   the widths where the rail is not mounted; `wide` gates both, so exactly
	   one of the two is rendered at every width and never both. */

	// Wiping an hour of reading is not something a stray click gets to do, so
	// the first press only arms. Same affordance the sidebar has always had.
	let resetArmed = $state(false);
	let resetTimer: ReturnType<typeof setTimeout> | undefined;

	/* Held across the wipe to drop the rail's live dwell tracker.

	   The tracker buffers dwell in memory and FLUSHES IT BACK on teardown, so
	   clearing storage underneath a running rail achieves nothing: the next
	   unmount writes the old seconds straight back. Unmounting first, letting
	   that final flush land, and only then clearing is what makes the heat map
	   actually go out. `await tick()` is the wait for the teardown. */
	let railSuppressed = $state(false);

	async function handleReset() {
		if (!resetArmed) {
			resetArmed = true;
			clearTimeout(resetTimer);
			resetTimer = setTimeout(() => (resetArmed = false), 2500);
			return;
		}
		clearTimeout(resetTimer);
		resetArmed = false;

		railSuppressed = true;
		await tick();
		resetAllLearningState();
		railSuppressed = false;

		// "Back to the initial state" includes where the reader is standing. A
		// reset that leaves them at section 9.3 with an empty rail has cleared
		// the record but not the experience.
		const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
		window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
	}

	$effect(() => () => clearTimeout(resetTimer));
</script>

<header
	class="app-header fixed top-0 right-0 left-0 z-50 flex items-center"
	class:search-expanded={searchExpanded}
	style="height: var(--header-height);"
>
	<div
		class="flex flex-shrink-0 items-center justify-center"
		style="width: var(--sidebar-collapsed-width);"
	>
		<!-- 32px button around a 24px mark. The button is the tap target; the
		     mark is what has to line up with the table of contents.

		     Measured, not guessed. The sidebar's icons are lucide glyphs at
		     size 17 in both states, and this cell is `--sidebar-collapsed-width`
		     wide, so the mark's centre already sits at x=26 against the
		     collapsed rail's icon column at x=25.5 — half a pixel, and it stays
		     that way because both numbers come from the same variable.

		     What was wrong was SIZE. At `h-8 w-8` the mark measured 28x32: `w-8`
		     was being flex-shrunk to fit the 28px button while `h-8` was not, so
		     the logo was squashed AND overhanging its own button by 4px top and
		     bottom. Beside 17px icons it read as a slab rather than the first
		     item in a column. The art has ~8% transparent margin (ink is 862 of
		     1024px), so a 24px box puts ~20px of actual ink on screen — a step
		     above the 17px icons, which is right for the one coloured mark in
		     the chrome, without being double their weight. shrink-0 is what
		     keeps it square. -->
		<button
			onclick={() => (aboutOpen = true)}
			class="flex h-8 w-8 cursor-pointer items-center justify-center transition-opacity hover:opacity-80"
			aria-label="About TerminalVibes"
		>
			<img
				src="{base}/images/logo-transparent.webp"
				alt=""
				class="h-6 w-6 shrink-0"
				width="24"
				height="24"
			/>
		</button>
	</div>

	<!-- The logo is unconditional; the wordmark is the first thing spent when
	     the rail needs room. See the ladder in the stylesheet below. -->
	<span
		class="wordmark -ml-1.5 text-[15px] font-bold tracking-tight"
		style="color: var(--color-text); font-family: var(--font-heading); letter-spacing: -0.02em;"
	>
		TerminalVibes
	</span>

	<!-- The Thread rail lives in the one flexible cell of the header, between
	     the wordmark and the control cluster. flex-1 is what makes it
	     responsive: it takes every pixel the cluster does not, so the rail runs
	     right up to the search box and gives 60px back when the box opens.
	     min-w-0 lets it shrink, and .thread-cell's min-width is the floor below
	     which the sweep stops being usable (see the CSS below). -->
	<div class="thread-cell flex min-w-0 flex-1 items-center">
		{#if wide}
			<!-- Immediately left of the rail, and deliberately the quietest
			     control in the header until it is armed, at which point it turns
			     --color-warning and says so. 24px is the WCAG 2.2 SC 2.5.8 (AA)
			     floor for a pointer target and every pixel past it comes
			     straight out of the rail beside it. -->
			<button
				onclick={handleReset}
				class="reset-btn flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded transition-all"
				class:is-armed={resetArmed}
				aria-label={resetArmed ? 'Click again to reset all progress' : 'Reset progress'}
				title={resetArmed ? 'Click again to reset all progress' : 'Reset all progress'}
			>
				<RotateCcw size={13} />
			</button>
		{/if}

		<div class="rail-cell min-w-0 flex-1">
			{#if wide && !railSuppressed && timelineItems.length}
				<ThreadRail
					items={timelineItems}
					position={scrollPosition}
					{readIds}
					{doneIds}
					{onNavigate}
				/>
			{/if}
		</div>
	</div>

	<!-- One control set for all breakpoints. Nothing here is duplicated per
	     width; each control just sheds its optional half as the rail needs the
	     pixels back. The order of shedding is in the stylesheet. -->
	<div class="header-cluster flex flex-shrink-0 items-center">
		<div class="search-slot">
			<Search {onNavigate} onExpandedChange={(v) => (searchExpanded = v)} />
		</div>

		<button
			onclick={onTogglePlayground}
			class="playground-btn labelled-btn flex h-8 w-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg transition-all"
			aria-label="Open Terminal Playground"
		>
			<Gamepad2 size={16} />
			<span class="btn-label text-xs font-semibold">Playground</span>
		</button>

		<button
			onclick={onToggleAgent}
			class="agent-btn labelled-btn flex h-8 w-8 cursor-pointer items-center justify-center gap-1.5 rounded-lg transition-all"
			aria-label="Open Agent"
		>
			<Bot size={16} />
			<span class="btn-label text-xs font-semibold">Agent</span>
		</button>

		<button
			onclick={onToggleCheatSheet}
			class="cheatsheet-btn flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-all"
			aria-label="Terminal Cheat Sheet"
		>
			<ScrollText size={16} />
		</button>

		<a
			href="https://github.com/NeoVand/terminalvibes"
			target="_blank"
			rel="noopener noreferrer"
			class="gh-link h-8 w-8 items-center justify-center rounded-lg transition-opacity hover:opacity-70"
			style="color: var(--color-text-muted);"
			aria-label="View on GitHub"
		>
			<Github size={16} />
		</a>

		<button
			onclick={onToggleTheme}
			class="flex h-8 w-8 cursor-pointer items-center justify-center rounded-lg transition-opacity hover:opacity-70"
			style="color: var(--color-text-muted);"
			aria-label="Toggle theme"
		>
			{#if theme === 'dark'}
				<Sun size={16} />
			{:else}
				<Moon size={16} />
			{/if}
		</button>
	</div>
</header>

{#if aboutOpen}
	<div class="fixed inset-0 z-[100] flex items-center justify-center p-4">
		<button
			class="absolute inset-0 bg-black/40 backdrop-blur-sm"
			onclick={() => (aboutOpen = false)}
			aria-label="Close about"
		></button>
		<div
			class="about-modal relative flex w-full max-w-xl flex-col overflow-hidden rounded-xl border shadow-2xl sm:flex-row"
			style="background: var(--color-surface); border-color: var(--color-border);"
		>
			<button
				onclick={() => (aboutOpen = false)}
				class="absolute top-3 right-3 z-10 flex h-7 w-7 cursor-pointer items-center justify-center rounded-md transition-opacity hover:opacity-70"
				style="color: var(--color-text-muted); background: color-mix(in srgb, var(--color-surface) 70%, transparent);"
				aria-label="Close"
			>
				<X size={16} />
			</button>

			<!-- The leafy T fills the whole left half — the logo IS the artwork -->
			<div class="about-logo-pane sm:w-1/2">
				<img
					src="{base}/images/logo-transparent.webp"
					alt="TerminalVibes logo"
					class="h-full w-full object-contain p-6"
					width="512"
					height="512"
				/>
			</div>

			<div class="flex flex-col justify-center p-6 sm:w-1/2 sm:p-7">
				<h2
					class="text-xl font-bold"
					style="color: var(--color-text); font-family: var(--font-heading); letter-spacing: -0.02em;"
				>
					TerminalVibes
				</h2>
				<p class="mb-4 text-xs" style="color: var(--color-text-muted);">
					The Terminal for Vibe Coders
				</p>

				<p class="mb-5 text-sm leading-relaxed" style="color: var(--color-text-secondary);">
					An interactive educational app built to teach the terminal to developers working with AI
					tools. For educational purposes only.
				</p>

				<p class="mb-4 text-sm font-medium" style="color: var(--color-text);">
					Created by Neo Mohsenvand
				</p>

				<div class="flex gap-2">
					<a
						href="https://github.com/NeoVand"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
						style="background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid var(--color-border);"
					>
						<Github size={14} />
						GitHub
					</a>
					<a
						href="https://linkedin.com/in/mohsenvand"
						target="_blank"
						rel="noopener noreferrer"
						class="flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80"
						style="background: var(--color-bg-tertiary); color: var(--color-text-secondary); border: 1px solid var(--color-border);"
					>
						<Linkedin size={14} />
						LinkedIn
					</a>
				</div>
			</div>
		</div>
	</div>
{/if}

<style>
	/* Frosted glass, matching the sidebar's treatment: content scrolls
	   visibly behind the header through the blur. */

	/* The logo webp is transparent — no plate behind it, so the pane
	   reads as one continuous modal surface. */
	.about-logo-pane {
		min-height: 220px;
	}

	/* ── the shedding ladder ────────────────────────────────────────────────
	   The rail is held down to iPad mini portrait (744px) by spending the
	   control cluster rather than the rail. Everything optional in this header
	   has a width at which it stops being worth what it costs the timeline,
	   and these are those widths. Measured in the browser, not estimated:

	     wordmark             90px   (96px of type, less its own -ml-1.5)
	     Playground label     76px   (label, its gap, and the button's px-2.5)
	     Agent label          45px
	     GitHub link          36px   (32px target + gap; the About modal, which
	                                  this logo opens, carries the same link)
	     search box       260 -> 32  (228px, collapsing to its magnifier)

	   Spend order is cheapest-to-lose first, which is also least-visible
	   first: labels have icons carrying the same meaning, the GitHub link is
	   duplicated in the About modal, the search box keeps its whole function
	   behind one click, and the wordmark goes last because it is the only one
	   of the four that is pure identity. The logo never goes.

	   Resulting rail widths at rest, all clear of the 448px floor below:

	     1280 -> 518    1120 -> 480    860 -> 484    820 -> 546    744 -> 470

	   Below 744 nothing is left to sell — the cluster is already down to five
	   32px icons — so that is where RAIL_MEDIA_QUERY unmounts the rail and the
	   sidebar's mini timeline takes over. */

	/* Default is the narrowest arrangement, and the ladder adds things back.
	   Mobile-first the same way the rest of the app is: the phone case is the
	   one that must never depend on a query having matched. */
	.wordmark {
		display: none;
	}
	.btn-label {
		display: none;
	}
	.gh-link {
		display: none;
	}
	.header-cluster {
		gap: 2px;
		padding-right: 4px;
	}
	.thread-cell {
		gap: 6px;
		padding-left: 8px;
		padding-right: 8px;
	}

	/* 744px — iPad mini portrait, where the rail comes back. */
	@media (min-width: 860px) {
		.wordmark {
			display: inline;
		}
		.header-cluster {
			gap: 4px;
			padding-right: 8px;
		}
	}

	@media (min-width: 1120px) {
		.gh-link {
			display: flex;
		}
	}

	@media (min-width: 1280px) {
		.btn-label {
			display: inline;
		}
		.labelled-btn {
			width: auto;
			padding-left: 10px;
			padding-right: 10px;
		}
	}

	/* The rail's width floor, measured rather than guessed.
	   Cursor travel per anchor is a fixed FRACTION of the sweep and only scales
	   with the rail's pixel width, so a floor is a division. The tightest
	   section in the real document is 4.4 (`sort` / `uniq` / `wc` / `cut`),
	   which takes 0.6775% of the sweep at the hover magnification A = 3.2 —
	   5.15px at the approved 760px rail. Three pixels of travel therefore needs
	   3 / 0.006775 = 442.8px of rail, and 448 is that with a little air.

	   +46px for the cell's own chrome: 8px of padding each side, the 24px reset
	   button, and the 6px gap between it and the rail. It is a tripwire, not a
	   layout driver — the tightest real band is 1120px, which leaves the cell
	   at 526px, 32px clear. It is here so that a future change to the header
	   cluster fails visibly instead of quietly starving the sweep.

	   Scoped to the same 744px gate the rail mounts at — below it the cell is
	   empty, and an unconditional min-width would make a 375px header overflow
	   sideways to reserve room for a rail that is not there.

	   A RESTING-state guarantee only, and `.search-expanded` is what says so.
	   Opening the search box deliberately squeezes the rail leftward — that is
	   the behaviour, not a regression — and below about 1256px the squeeze does
	   take the rail under this floor. The floor is about the rail being
	   reliably TARGETABLE, and while the search box holds focus the pointer is
	   in the search box and the rail is displaying hits rather than being
	   swept. It restores itself on blur.

	   Suspending it is not cosmetic. A min-width that outranks the squeeze does
	   not protect anything — the cell cannot shrink, the cluster beside it is
	   flex-shrink-0, so the overflow comes out of the RIGHT EDGE and the theme
	   toggle leaves the viewport. Measured at 1120px with the box open: the
	   cluster ended 28px past the header's right edge. A floor that defends the
	   rail by pushing the controls off screen is worse than no floor. */
	@media (min-width: 744px) {
		.thread-cell {
			min-width: 494px;
		}

		.app-header.search-expanded .thread-cell {
			min-width: 0;
		}
	}

	.search-slot {
		margin-right: 0;
	}

	@media (min-width: 860px) {
		.search-slot {
			margin-right: 4px;
		}
	}

	/* Quiet by default — it sits beside the rail all day and must not compete
	   with it — and unmistakable once armed. The armed colour is the shared
	   warning token, so both themes follow it. */
	.reset-btn {
		color: var(--color-text-muted);
		opacity: 0.55;
	}

	.reset-btn:hover {
		opacity: 1;
		background: color-mix(in srgb, var(--color-text) 6%, transparent);
	}

	.reset-btn.is-armed {
		color: var(--color-warning);
		opacity: 1;
		background: color-mix(in srgb, var(--color-warning) 12%, transparent);
	}

	.app-header {
		background: var(--header-glass);
		backdrop-filter: blur(20px) saturate(1.4);
		-webkit-backdrop-filter: blur(20px) saturate(1.4);
		box-shadow: 0 1px 0 color-mix(in srgb, var(--color-border) 80%, transparent);
	}

	/* The trio reads as a warm gradient across the header: playground tan,
	   agent amber, cheat sheet moss — each with the same 10% hover wash. */
	.playground-btn {
		color: var(--color-btn-playground);
	}

	.playground-btn:hover {
		background: color-mix(in srgb, var(--color-btn-playground) 10%, transparent);
	}

	.agent-btn {
		color: var(--color-btn-agent);
	}

	.agent-btn:hover {
		background: color-mix(in srgb, var(--color-btn-agent) 10%, transparent);
	}

	/* Same inviting treatment as the playground button, in the cheat
	   sheet's accent — matching its "Quick reference" callout on the page */
	.cheatsheet-btn {
		color: var(--color-btn-cheatsheet);
	}

	.cheatsheet-btn:hover {
		background: color-mix(in srgb, var(--color-btn-cheatsheet) 10%, transparent);
	}
</style>
