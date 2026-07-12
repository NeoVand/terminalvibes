<script lang="ts">
	import { onMount } from 'svelte';

	let { definition, id = 'mermaid' }: { definition: string; id?: string } = $props();

	let container: HTMLDivElement;
	let mermaidModule: typeof import('mermaid') | null = $state(null);
	let renderCount = $state(0);
	let isVisible = $state(false);

	function isDark(): boolean {
		const root = document.documentElement;
		if (root.classList.contains('dark')) return true;
		if (root.classList.contains('light')) return false;
		return window.matchMedia('(prefers-color-scheme: dark)').matches;
	}

	function getMermaidConfig(dark: boolean) {
		return {
			startOnLoad: false,
			theme: 'base' as const,
			themeVariables: dark
				? {
						// Dark mode — flowcharts
						primaryColor: '#1d3323',
						primaryTextColor: '#e2ede2',
						primaryBorderColor: '#4ade80',
						secondaryColor: '#332614',
						secondaryTextColor: '#e7cfa8',
						secondaryBorderColor: '#b48a52',
						tertiaryColor: '#1a2016',
						tertiaryTextColor: '#cbd5c4',
						tertiaryBorderColor: '#3a4732',
						lineColor: '#6b7a5f',
						textColor: '#e2ede2',
						mainBkg: '#1a2016',
						nodeBorder: '#4ade80',
						clusterBkg: '#151a12',
						clusterBorder: '#3a4732',
						titleColor: '#e2ede2',
						edgeLabelBackground: '#1a2016',
						nodeTextColor: '#e2ede2',
						// sequenceDiagram
						actorBkg: '#1a2016',
						actorTextColor: '#cbd5c4',
						actorBorder: '#3a4732',
						actorLineColor: '#3a4732',
						noteBkgColor: 'transparent',
						noteTextColor: '#64748b',
						noteBorderColor: 'transparent',
						signalColor: '#5c6b52',
						signalTextColor: '#9caf8e',
						activationBkgColor: '#1a2016',
						activationBorderColor: '#5c6b52',
						sequenceNumberColor: '#9caf8e',
						// gitGraph (unused by the fs-tree, kept theme-consistent)
						git0: '#4ade80',
						git1: '#b48a52',
						git2: '#fdba74',
						git3: '#d97706',
						git4: '#86efac',
						git5: '#0891b2',
						git6: '#65a30d',
						git7: '#fb923c',
						gitBranchLabel0: '#0c110a',
						gitBranchLabel1: '#e2ede2',
						gitBranchLabel2: '#0c110a',
						gitBranchLabel3: '#e2ede2',
						gitBranchLabel4: '#0c110a',
						gitBranchLabel5: '#e2ede2',
						gitBranchLabel6: '#e2ede2',
						gitBranchLabel7: '#e2ede2',
						gitInv0: '#4ade80',
						commitLabelColor: '#9caf8e',
						// Near-opaque, not fully: rotated labels sometimes cross the
						// lane below, and the label text must stay easy to read (a
						// hint of the crossed pill showing through is acceptable).
						// Don't shrink the font — mermaid derives the label's
						// distance from its node from the text width, so smaller
						// text collapses onto the commit dot.
						commitLabelBackground: 'rgba(26, 32, 22, 0.92)',
						commitLabelFontSize: '12px',
						tagLabelColor: '#e2ede2',
						tagLabelBackground: '#9a3412',
						tagLabelBorder: '#fdba74',
						tagLabelFontSize: '12px'
					}
				: {
						// Light mode — flowcharts
						primaryColor: '#e9f7ee',
						primaryTextColor: '#14301c',
						primaryBorderColor: '#86d8a2',
						secondaryColor: '#faf3ea',
						secondaryTextColor: '#5c3d1e',
						secondaryBorderColor: '#d9b98c',
						tertiaryColor: '#f7f9f4',
						tertiaryTextColor: '#3f4a38',
						tertiaryBorderColor: '#cbd5c0',
						lineColor: '#9aab90',
						textColor: '#24301f',
						mainBkg: '#f7f9f4',
						nodeBorder: '#86d8a2',
						clusterBkg: '#f7f9f4',
						clusterBorder: '#e0e8d8',
						titleColor: '#24301f',
						edgeLabelBackground: '#ffffff',
						nodeTextColor: '#24301f',
						// sequenceDiagram
						actorBkg: '#eff3ea',
						actorTextColor: '#4c5540',
						actorBorder: '#cbd5c0',
						actorLineColor: '#cbd5c0',
						noteBkgColor: 'transparent',
						noteTextColor: '#94a3b8',
						noteBorderColor: 'transparent',
						signalColor: '#9aab90',
						signalTextColor: '#6b7a5f',
						activationBkgColor: '#eff3ea',
						activationBorderColor: '#9aab90',
						sequenceNumberColor: '#6b7a5f',
						// gitGraph (unused by the fs-tree, kept theme-consistent)
						git0: '#15803d',
						git1: '#8b5e34',
						git2: '#d97706',
						git3: '#0891b2',
						git4: '#65a30d',
						git5: '#06b6d4',
						git6: '#84cc16',
						git7: '#ea580c',
						gitBranchLabel0: '#ffffff',
						gitBranchLabel1: '#ffffff',
						gitBranchLabel2: '#ffffff',
						gitBranchLabel3: '#ffffff',
						gitBranchLabel4: '#ffffff',
						gitBranchLabel5: '#ffffff',
						gitBranchLabel6: '#ffffff',
						gitBranchLabel7: '#ffffff',
						gitInv0: '#166534',
						commitLabelColor: '#6b7a5f',
						commitLabelBackground: 'rgba(239, 243, 234, 0.94)',
						commitLabelFontSize: '12px',
						tagLabelColor: '#ffffff',
						tagLabelBackground: '#9a3412',
						tagLabelBorder: '#7c2d12',
						tagLabelFontSize: '12px'
					},
			gitGraph: {
				mainBranchName: 'main',
				showCommitLabel: true,
				showBranches: true,
				rotateCommitLabel: true,
				mainBranchOrder: 0
			},
			flowchart: {
				curve: 'basis' as const,
				padding: 20,
				htmlLabels: true,
				useMaxWidth: true,
				nodeSpacing: 30,
				rankSpacing: 50
			},
			sequence: {
				useMaxWidth: true,
				mirrorActors: false,
				messageAlign: 'center' as const,
				actorMargin: 80,
				noteMargin: 8,
				messageFontSize: 12,
				actorFontSize: 13,
				noteFontSize: 10,
				width: 180,
				height: 36
			},
			fontSize: 14,
			fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif"
		};
	}

	onMount(() => {
		let themeObs: MutationObserver | undefined;

		const viewportObserver = new IntersectionObserver(
			([entry]) => {
				if (entry?.isIntersecting) isVisible = true;
			},
			{ rootMargin: '100px' }
		);
		viewportObserver.observe(container);

		return () => {
			viewportObserver.disconnect();
			themeObs?.disconnect();
		};
	});

	$effect(() => {
		if (!isVisible) return;

		if (!mermaidModule) {
			import('mermaid').then((m) => {
				m.default.initialize(getMermaidConfig(isDark()));
				mermaidModule = m;

				const mql = window.matchMedia('(prefers-color-scheme: dark)');
				mql.addEventListener('change', () => {
					m.default.initialize(getMermaidConfig(isDark()));
					renderCount++;
				});

				const themeObs = new MutationObserver(() => {
					m.default.initialize(getMermaidConfig(isDark()));
					renderCount++;
				});
				themeObs.observe(document.documentElement, {
					attributes: true,
					attributeFilter: ['class']
				});
			});
			return;
		}

		if (!container || !definition) return;
		// eslint-disable-next-line @typescript-eslint/no-unused-expressions
		renderCount;

		const uniqueId = `${id}-${Date.now()}`;
		mermaidModule.default
			.render(uniqueId, definition)
			.then(({ svg }) => {
				// eslint-disable-next-line svelte/no-dom-manipulating -- dedicated mount point
				container.innerHTML = svg;

				const svgEl = container.querySelector('svg');
				if (svgEl) {
					if (!svgEl.getAttribute('viewBox')) {
						const w = svgEl.getAttribute('width');
						const h = svgEl.getAttribute('height');
						if (w && h) {
							svgEl.setAttribute('viewBox', `0 0 ${parseFloat(w)} ${parseFloat(h)}`);
						}
					}
					svgEl.setAttribute('preserveAspectRatio', 'xMidYMid meet');
					svgEl.removeAttribute('width');
					svgEl.removeAttribute('height');
				}

				for (const circle of container.querySelectorAll('circle')) {
					const r = parseFloat(circle.getAttribute('r') ?? '0');
					if (r > 10) circle.setAttribute('r', '10');
				}

				// gitGraph tag pills (tags, origin/*, HEAD) are pinned so close to
				// their commit that the pill's bottom edge lands on the dot's top
				// edge (~y-9.7 vs y-10 in mermaid v11 geometry). Lift the whole
				// tag — polygon, pin-hole and text — clear of the node.
				for (const el of container.querySelectorAll('.tag-label, .tag-label-bkg, .tag-hole')) {
					const prior = el.getAttribute('transform');
					el.setAttribute('transform', `translate(0, -6)${prior ? ` ${prior}` : ''}`);
				}
			})
			.catch((err) => {
				console.warn('Mermaid render error:', err);
				// eslint-disable-next-line svelte/no-dom-manipulating -- dedicated mount point
				container.innerHTML = `<p style="color: var(--color-text-muted); font-size: 12px;">Diagram loading...</p>`;
			});
	});
</script>

<div
	class="mermaid-container flex items-center justify-center overflow-hidden py-1"
	bind:this={container}
></div>

<style>
	/* Reserve space before the diagram renders so lazy materialization
	   doesn't shift the content below. */
	.mermaid-container:empty {
		min-height: 180px;
	}

	.mermaid-container :global(svg) {
		width: 100%;
		height: auto;
	}

	.mermaid-container :global(.commit-id),
	.mermaid-container :global(.commit-msg) {
		font-size: 11px !important;
	}
</style>
