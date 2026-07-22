<script lang="ts">
	import { onMount } from 'svelte';
	import Header from '$lib/components/layout/Header.svelte';
	import Sidebar from '$lib/components/layout/Sidebar.svelte';
	import CheatSheet from '$lib/components/layout/CheatSheet.svelte';
	import PlaygroundPanel from '$lib/components/layout/PlaygroundPanel.svelte';
	import AgentPanel from '$lib/components/layout/AgentPanel.svelte';
	import Hero from '$lib/components/sections/Hero.svelte';
	import Part1 from '$lib/components/sections/Part1.svelte';
	import Part2 from '$lib/components/sections/Part2.svelte';
	import Part3 from '$lib/components/sections/Part3.svelte';
	import Part4 from '$lib/components/sections/Part4.svelte';
	import Part5 from '$lib/components/sections/Part5.svelte';
	import Part6 from '$lib/components/sections/Part6.svelte';
	import Part7 from '$lib/components/sections/Part7.svelte';
	import Part8 from '$lib/components/sections/Part8.svelte';
	import Part9 from '$lib/components/sections/Part9.svelte';
	import Part10 from '$lib/components/sections/Part10.svelte';
	import Part11 from '$lib/components/sections/Part11.svelte';
	import Part12 from '$lib/components/sections/Part12.svelte';
	import Part13 from '$lib/components/sections/Part13.svelte';
	import Part14 from '$lib/components/sections/Part14.svelte';
	import { resolve } from '$app/paths';
	import { anchorIds } from '$lib/data/sections';
	import { courseEntry } from '$lib/data/sidebar-nav';
	import { partPages } from '$lib/data/part-pages';
	import { markSectionVisited } from '$lib/data/progress';
	import { createProgressSets, timelineManifest } from '$lib/timeline/state.svelte';
	import { createReflowWatcher, measureOffsets, scrollFraction } from '$lib/timeline/measure';
	import type { PlacedItem } from '$lib/timeline/mapping';
	import { readingContext } from '$lib/ai/reading-context.svelte';
	import { decodeSharedFromHash, type SharedSession } from '$lib/playground/share';
	import {
		loadThemePreference,
		saveThemePreference,
		getEffectiveTheme,
		applyTheme,
		type ThemePreference
	} from '$lib/theme';

	let sidebarOpen = $state(false);
	let cheatSheetOpen = $state(false);
	let playgroundOpen = $state(false);
	let agentOpen = $state(false);
	let sharedSession = $state<SharedSession | null>(null);
	let activeSection = $state('hero');
	let theme = $state<ThemePreference>('system');
	let navClickActive = false;

	/* ---- the header's Thread rail --------------------------------------
	   Three small additions, no restructuring. `activeSection` is a DISCRETE
	   id and is not enough for the rail: its reading head and its per-bar
	   green fill are continuous, so it needs the scroll FRACTION as well. That
	   is computed inside the existing rAF-throttled scroll handler — there is
	   no second scroll listener. */
	let scrollPosition = $state(0);
	let timelineItems = $state<PlacedItem[]>([]);
	const progressSets = createProgressSets();
	const manifestIds = timelineManifest.map((it) => it.id);

	function remeasureTimeline() {
		const { f } = measureOffsets(manifestIds);
		timelineItems = timelineManifest
			.filter((it) => f.has(it.id))
			.map((it) => ({ ...it, f: f.get(it.id)! }));
		scrollPosition = scrollFraction();
	}

	// The Agent panel grounds its suggested questions in the section the
	// learner is reading — mirror the existing scroll-spy value, no second
	// observer.
	$effect(() => {
		readingContext.sectionId = activeSection;
	});

	function getEffectiveThemeLocal(): 'light' | 'dark' {
		return getEffectiveTheme(theme);
	}

	function toggleTheme() {
		const effective = getEffectiveThemeLocal();
		theme = effective === 'dark' ? 'light' : 'dark';
		saveThemePreference(theme);
		applyTheme(theme);
	}

	function sectionScrollTop(el: HTMLElement): number {
		const headerHeight =
			parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--header-height')) ||
			48;
		return el.getBoundingClientRect().top + window.scrollY - headerHeight - 16;
	}

	function scrollToSection(id: string, behavior: ScrollBehavior = 'smooth') {
		const el = document.getElementById(id);
		if (el) {
			window.scrollTo({ top: sectionScrollTop(el), behavior });
		}
		if (typeof window !== 'undefined') {
			const url = `${window.location.pathname}${window.location.search}#${id}`;
			history.replaceState(null, '', url);
		}
	}

	// Images above a deep-linked section load lazily and shift the layout after
	// the initial scroll lands, so keep re-aligning until things settle. A
	// layout shift moves the section's desired position; any other viewport
	// movement (scrollbar drag, keyboard, script) means someone else is
	// scrolling — they win and the loop stops.
	function keepSectionAligned(id: string, duration = 1500) {
		const started = performance.now();
		let lastDesired = -1;
		function tick() {
			if (!navClickActive) return;
			const el = document.getElementById(id);
			if (el) {
				const desired = sectionScrollTop(el);
				const layoutShifted = lastDesired === -1 || Math.abs(desired - lastDesired) > 2;
				if (!layoutShifted && Math.abs(window.scrollY - desired) > 2) {
					return;
				}
				if (Math.abs(window.scrollY - desired) > 2) {
					window.scrollTo({ top: desired, behavior: 'instant' });
				}
				lastDesired = desired;
			}
			if (performance.now() - started < duration) {
				requestAnimationFrame(tick);
			}
		}
		requestAnimationFrame(tick);
	}

	onMount(() => {
		theme = loadThemePreference();
		applyTheme(theme);

		// A shared playground session (#pg=...) opens the panel and replays
		const decoded = decodeSharedFromHash(window.location.hash);
		if (decoded) {
			sharedSession = decoded;
			playgroundOpen = true;
		}

		const hash = window.location.hash.slice(1);
		if (hash && anchorIds.includes(hash)) {
			activeSection = hash;
			navClickActive = true;
			requestAnimationFrame(() => {
				scrollToSection(hash, 'instant');
				keepSectionAligned(hash);
			});
		}

		// `anchorIds` is sectionIds ++ playgroundAnchorIds ++ toolAnchorIds, which
		// is NOT document order — every playground sits after every section. The
		// scan below walks forward and breaks at the first anchor still below the
		// fold, which is only correct on a document-ordered list. Unsorted, it
		// broke at the first section past the fold and never examined a single
		// playground: scrolling onto one highlighted its parent part instead, and
		// markSectionVisited() never fired for playground anchors at all.
		const sectionEls = anchorIds
			.map((id) => document.getElementById(id))
			.filter((el): el is HTMLElement => el !== null)
			.sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1));

		function updateActiveSection() {
			// The rail's reading head is continuous and must track the scroll even
			// while a nav click is settling, so it updates before the early return.
			scrollPosition = scrollFraction();
			if (navClickActive) return;
			const offset = window.innerHeight * 0.2;
			let best: string | null = null;
			for (const el of sectionEls) {
				if (el.getBoundingClientRect().top <= offset) {
					best = el.id;
				} else {
					break;
				}
			}
			if (best) {
				activeSection = best;
				markSectionVisited(best);
			}
		}

		let rafId = 0;
		let scrollbarTimer: ReturnType<typeof setTimeout> | undefined;
		function onScroll() {
			cancelAnimationFrame(rafId);
			rafId = requestAnimationFrame(updateActiveSection);
			// Reveal the root scrollbar while scrolling; hide it after idle
			document.documentElement.classList.add('is-scrolling');
			clearTimeout(scrollbarTimer);
			scrollbarTimer = setTimeout(
				() => document.documentElement.classList.remove('is-scrolling'),
				800
			);
		}

		window.addEventListener('scroll', onScroll, { passive: true });
		updateActiveSection();

		if (window.innerWidth >= 1024) {
			sidebarOpen = true;
		}

		const params = new URLSearchParams(window.location.search);
		if (params.has('playground')) {
			playgroundOpen = true;
			const url = `${window.location.pathname}${window.location.hash}`;
			history.replaceState(null, '', url);
		}

		const clearNavClick = () => {
			navClickActive = false;
		};
		window.addEventListener('wheel', clearNavClick, { passive: true });
		window.addEventListener('touchmove', clearNavClick, { passive: true });

		// Decorate every section anchor's heading with a copy-permalink button.
		for (const el of sectionEls) {
			const heading = el.querySelector('h2, h3, h4') ?? (/^H[2-4]$/.test(el.tagName) ? el : null);
			if (!heading || heading.querySelector('.heading-anchor')) continue;
			const anchor = document.createElement('a');
			anchor.className = 'heading-anchor';
			anchor.href = `#${el.id}`;
			anchor.textContent = '#';
			anchor.setAttribute('aria-label', 'Copy link to this section');
			anchor.addEventListener('click', (event) => {
				event.preventDefault();
				const url = `${location.origin}${location.pathname}#${el.id}`;
				history.replaceState(null, '', `#${el.id}`);
				navigator.clipboard?.writeText(url).catch(() => {});
			});
			heading.appendChild(anchor);
		}

		// Measure the rail's anchors after the first paint, then keep them honest.
		// This page reflows for the whole session — mermaid diagrams and lesson
		// playgrounds are lazily rendered behind IntersectionObservers, so it
		// grows as the reader scrolls, not just at load. createReflowWatcher
		// debounces all of it behind one ResizeObserver on <main>.
		requestAnimationFrame(remeasureTimeline);
		const stopWatcher = createReflowWatcher({
			target: document.getElementById('main-content'),
			onReflow: remeasureTimeline,
			onResize: remeasureTimeline
		});

		return () => {
			window.removeEventListener('scroll', onScroll);
			cancelAnimationFrame(rafId);
			clearTimeout(scrollbarTimer);
			window.removeEventListener('wheel', clearNavClick);
			window.removeEventListener('touchmove', clearNavClick);
			stopWatcher();
			progressSets.destroy();
		};
	});

	function handleNavigate(id: string) {
		activeSection = id;
		navClickActive = true;
		// Jump instantly: a smooth scroll across a page this tall takes long
		// enough that lazy content materializes mid-flight and the target
		// drifts. The alignment loop absorbs any shifts that land afterwards.
		scrollToSection(id, 'instant');
		keepSectionAligned(id, 2500);
	}

	function toggleSidebar() {
		sidebarOpen = !sidebarOpen;
	}

	// The three header panels are mutually exclusive: opening one closes
	// the others. Agent/Playground additionally enter desktop "reading
	// mode": the sidebar auto-collapses and the content reflows beside the
	// panel — the sidebar's prior state is restored when both close.
	let sidebarBeforePanel = false;

	/** Call BEFORE mutating any open flags when a side panel is opening. */
	function enterReadingMode() {
		if (!playgroundOpen && !agentOpen) {
			sidebarBeforePanel = sidebarOpen;
			sidebarOpen = false;
		}
	}

	/** Call AFTER mutating flags — restores the sidebar once both are closed. */
	function maybeLeaveReadingMode() {
		if (!playgroundOpen && !agentOpen) {
			sidebarOpen = sidebarBeforePanel;
		}
	}

	function toggleCheatSheet() {
		if (!cheatSheetOpen) {
			playgroundOpen = false;
			agentOpen = false;
			maybeLeaveReadingMode();
		}
		cheatSheetOpen = !cheatSheetOpen;
	}

	function togglePlayground() {
		if (!playgroundOpen) {
			enterReadingMode();
			cheatSheetOpen = false;
			agentOpen = false;
			playgroundOpen = true;
		} else {
			playgroundOpen = false;
			maybeLeaveReadingMode();
		}
	}

	function toggleAgent() {
		if (!agentOpen) {
			enterReadingMode();
			cheatSheetOpen = false;
			playgroundOpen = false;
			agentOpen = true;
		} else {
			agentOpen = false;
			maybeLeaveReadingMode();
		}
	}

	function openPlayground() {
		if (!playgroundOpen) {
			enterReadingMode();
		}
		cheatSheetOpen = false;
		agentOpen = false;
		playgroundOpen = true;
	}
</script>

<svelte:head>
	<title>TerminalVibes -- The Terminal for Vibe Coders</title>
	<meta
		name="description"
		content="An interactive guide to the terminal for developers using AI tools. Learn to read, verify, and run shell commands with confidence on macOS, Linux, and Windows."
	/>
	<link rel="canonical" href="https://neovand.github.io/terminalvibes/" />
	<meta property="og:title" content="TerminalVibes — The Terminal for Vibe Coders" />
	<meta
		property="og:description"
		content="An interactive, visual terminal tutorial for AI-assisted developers. Learn navigation, pipes, permissions, and command auditing."
	/>
	<meta property="og:image" content="https://neovand.github.io/terminalvibes/og-image.png" />
	<meta
		property="og:image:alt"
		content="The Terminal for Vibe Coders — read, verify, and run shell commands with confidence"
	/>
	<meta property="og:type" content="website" />
	<meta property="og:url" content="https://neovand.github.io/terminalvibes/" />
	<meta name="twitter:card" content="summary_large_image" />
	<meta name="twitter:title" content="TerminalVibes — The Terminal for Vibe Coders" />
	<meta
		name="twitter:description"
		content="An interactive, visual terminal tutorial for AI-assisted developers."
	/>
	<meta name="twitter:image" content="https://neovand.github.io/terminalvibes/og-image.png" />
	<meta
		name="twitter:image:alt"
		content="The Terminal for Vibe Coders — read, verify, and run shell commands with confidence"
	/>
	<!-- Safe {@html}: the payload is JSON.stringify of a static literal — no
	     user input can reach it. It exists only to emit the JSON-LD script tag,
	     which Svelte cannot render any other way. -->
	<!-- eslint-disable-next-line svelte/no-at-html-tags -->
	{@html `<script type="application/ld+json">${JSON.stringify({
		'@context': 'https://schema.org',
		'@type': 'Course',
		name: 'TerminalVibes — The Terminal for Vibe Coders',
		description:
			'A free, interactive terminal course for developers who work with AI coding agents: navigating the filesystem, managing files safely, pipes and text tools, permissions and environment, and auditing AI-proposed commands — with 21 hands-on exercises in a sandboxed in-browser bash playground.',
		url: 'https://neovand.github.io/terminalvibes/',
		provider: {
			'@type': 'Organization',
			name: 'TerminalVibes',
			url: 'https://neovand.github.io/terminalvibes/'
		},
		isAccessibleForFree: true,
		educationalLevel: 'Beginner',
		teaches: [
			'Terminal fundamentals (prompt, commands, getting help)',
			'Navigating and managing files (cd, ls, cp, mv, rm)',
			'Pipes, redirection, and text tools (grep, sort, uniq, find)',
			'Permissions, sudo, and environment variables',
			'Reading and auditing shell commands proposed by AI agents'
		],
		hasCourseInstance: {
			'@type': 'CourseInstance',
			courseMode: 'Online',
			courseWorkload: 'PT5H'
		},
		offers: {
			'@type': 'Offer',
			price: 0,
			priceCurrency: 'USD',
			category: 'Free'
		}
	})}</scr${''}ipt>`}
</svelte:head>

<a href="#main-content" class="skip-link">Skip to content</a>

<Header
	theme={getEffectiveThemeLocal()}
	onToggleTheme={toggleTheme}
	onToggleCheatSheet={toggleCheatSheet}
	onTogglePlayground={togglePlayground}
	onToggleAgent={toggleAgent}
	onNavigate={handleNavigate}
	{timelineItems}
	{scrollPosition}
	readIds={progressSets.readIds}
	doneIds={progressSets.doneIds}
	{cheatSheetOpen}
	{playgroundOpen}
	{agentOpen}
/>
<Sidebar open={sidebarOpen} {activeSection} onToggle={toggleSidebar} onNavigate={handleNavigate} />
<CheatSheet open={cheatSheetOpen} onToggle={toggleCheatSheet} />
<PlaygroundPanel open={playgroundOpen} onToggle={togglePlayground} shared={sharedSession} />
<AgentPanel open={agentOpen} onToggle={toggleAgent} onNavigate={handleNavigate} />

<main
	id="main-content"
	class="main-content transition-[margin] duration-200 ease-out"
	class:reading-mode={playgroundOpen || agentOpen}
	style="padding-top: var(--header-height); margin-left: {sidebarOpen
		? 'var(--sidebar-width)'
		: 'var(--sidebar-collapsed-width)'};"
>
	<Hero onOpenPlayground={openPlayground} onOpenAgent={toggleAgent} />
	<Part1 />
	<Part2 />
	<Part3 />
	<Part4 />
	<Part5 />
	<Part6 />
	<Part7 />
	<Part8 />
	<Part9 />
	<Part10 />
	<Part11 />
	<Part12 />
	<Part13 />
	<Part14 onOpenPlayground={openPlayground} />

	<footer class="px-6 py-12" style="border-top: 1px solid var(--color-border);">
		<div class="mx-auto max-w-4xl">
			<!-- Every part as its own shareable page — the course's internal
			     linking surface, in the sidebar's own naming and iconography. -->
			<p
				class="mb-4 text-xs font-bold tracking-widest uppercase"
				style="color: var(--color-text-muted); font-family: var(--font-heading); letter-spacing: 0.14em;"
			>
				The course, part by part
			</p>
			<div class="footer-parts mb-10 grid gap-x-6 gap-y-2 sm:grid-cols-2 lg:grid-cols-3">
				{#each partPages as p (p.id)}
					{@const entry = courseEntry(p.id)}
					{@const EntryIcon = entry?.icon}
					<a
						href={resolve('/parts/[slug]', { slug: p.slug })}
						class="footer-part-link flex items-center gap-2 py-1 text-[13px]"
					>
						{#if EntryIcon}
							<EntryIcon size={14} aria-hidden="true" class="shrink-0" />
						{/if}
						<span class="truncate">{entry?.label ?? p.title}</span>
					</a>
				{/each}
			</div>
			<p class="text-center text-xs" style="color: var(--color-text-muted);">
				Built for the vibe coding generation.
			</p>
		</div>
	</footer>
</main>
