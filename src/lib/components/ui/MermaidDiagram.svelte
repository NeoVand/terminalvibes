<script lang="ts">
	import { onMount } from 'svelte';
	import { Maximize2, RotateCcw, X, ZoomIn, ZoomOut } from 'lucide-svelte';

	let { definition, id = 'mermaid' }: { definition: string; id?: string } = $props();

	let container: HTMLDivElement;
	let mermaidModule: typeof import('mermaid') | null = $state(null);
	let renderCount = $state(0);
	let isVisible = $state(false);
	let rendered = $state(false);

	// ── expand-to-zoom modal ─────────────────────────────────────────
	// Diagrams embedded in the narrow content column (or the playground
	// panel) can be dense; the modal shows the same SVG full-screen with
	// wheel zoom and drag pan.
	let expanded = $state(false);
	let modalSvg = $state('');
	let zoom = $state(1);
	let panX = $state(0);
	let panY = $state(0);
	let dragging = false;
	let lastX = 0;
	let lastY = 0;

	function openModal() {
		const svg = container?.querySelector('svg');
		if (!svg) return;
		modalSvg = svg.outerHTML;
		zoom = 1.4;
		panX = 0;
		panY = 0;
		expanded = true;
	}

	function setZoom(next: number) {
		zoom = Math.min(6, Math.max(0.4, next));
	}

	function onWheel(e: WheelEvent) {
		e.preventDefault();
		setZoom(zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15));
	}

	function onPointerDown(e: PointerEvent) {
		dragging = true;
		lastX = e.clientX;
		lastY = e.clientY;
		(e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
	}

	function onPointerMove(e: PointerEvent) {
		if (!dragging) return;
		panX += e.clientX - lastX;
		panY += e.clientY - lastY;
		lastX = e.clientX;
		lastY = e.clientY;
	}

	function onPointerUp() {
		dragging = false;
	}

	function onModalKeydown(e: KeyboardEvent) {
		if (e.key === 'Escape' && expanded) {
			e.stopPropagation();
			expanded = false;
		}
	}

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
				rendered = true;

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

<svelte:window onkeydown={onModalKeydown} />

<div class="mermaid-wrap">
	<div
		class="mermaid-container flex items-center justify-center overflow-hidden py-1"
		bind:this={container}
	></div>
	{#if rendered}
		<button
			type="button"
			class="mermaid-expand"
			onclick={openModal}
			aria-label="Expand diagram"
			title="Expand diagram"
		>
			<Maximize2 size={13} />
		</button>
	{/if}
</div>

{#if expanded}
	<div class="mermaid-modal" role="dialog" aria-modal="true" aria-label="Expanded diagram">
		<button
			class="mermaid-modal-backdrop"
			onclick={() => (expanded = false)}
			aria-label="Close diagram"
		></button>
		<div
			class="mermaid-modal-viewport"
			role="presentation"
			onwheel={onWheel}
			onpointerdown={onPointerDown}
			onpointermove={onPointerMove}
			onpointerup={onPointerUp}
			onpointercancel={onPointerUp}
			ondblclick={() => {
				zoom = 1.4;
				panX = 0;
				panY = 0;
			}}
		>
			<div
				class="mermaid-modal-stage"
				style="transform: translate({panX}px, {panY}px) scale({zoom});"
			>
				<!-- eslint-disable-next-line svelte/no-at-html-tags -- mermaid-generated SVG, same trust as the inline render -->
				{@html modalSvg}
			</div>
		</div>
		<div class="mermaid-modal-controls">
			<button type="button" onclick={() => setZoom(zoom * 1.25)} aria-label="Zoom in">
				<ZoomIn size={15} />
			</button>
			<button type="button" onclick={() => setZoom(zoom / 1.25)} aria-label="Zoom out">
				<ZoomOut size={15} />
			</button>
			<button
				type="button"
				onclick={() => {
					zoom = 1.4;
					panX = 0;
					panY = 0;
				}}
				aria-label="Reset view"
			>
				<RotateCcw size={14} />
			</button>
			<button type="button" onclick={() => (expanded = false)} aria-label="Close">
				<X size={15} />
			</button>
		</div>
	</div>
{/if}

<style>
	.mermaid-wrap {
		position: relative;
	}

	.mermaid-expand {
		position: absolute;
		top: 0.4rem;
		right: 0.4rem;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 1.6rem;
		width: 1.6rem;
		border-radius: 0.4rem;
		border: 1px solid var(--color-border);
		background: color-mix(in srgb, var(--color-surface) 85%, transparent);
		color: var(--color-text-muted);
		cursor: zoom-in;
		opacity: 0;
		transition:
			opacity 0.15s ease,
			color 0.15s ease,
			border-color 0.15s ease;
	}

	.mermaid-wrap:hover .mermaid-expand,
	.mermaid-expand:focus-visible {
		opacity: 1;
	}

	.mermaid-expand:hover {
		color: var(--color-primary);
		border-color: var(--color-primary);
	}

	.mermaid-modal {
		position: fixed;
		inset: 0;
		z-index: 120;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mermaid-modal-backdrop {
		position: absolute;
		inset: 0;
		background: color-mix(in srgb, var(--color-bg) 78%, transparent);
		backdrop-filter: blur(10px);
		-webkit-backdrop-filter: blur(10px);
		border: none;
		cursor: zoom-out;
	}

	.mermaid-modal-viewport {
		position: relative;
		width: min(94vw, 1400px);
		height: min(88vh, 900px);
		overflow: hidden;
		border-radius: 0.75rem;
		border: 1px solid var(--color-border);
		background: var(--color-bg-secondary);
		cursor: grab;
		touch-action: none;
	}

	.mermaid-modal-viewport:active {
		cursor: grabbing;
	}

	.mermaid-modal-stage {
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		transform-origin: center center;
		transition: none;
	}

	.mermaid-modal-stage :global(svg) {
		max-width: 88%;
		max-height: 88%;
		height: auto;
	}

	.mermaid-modal-controls {
		position: absolute;
		bottom: 4vh;
		display: flex;
		gap: 0.4rem;
		padding: 0.35rem;
		border-radius: 0.6rem;
		border: 1px solid var(--color-border);
		background: var(--color-surface);
		box-shadow: 0 8px 30px rgb(0 0 0 / 0.25);
	}

	.mermaid-modal-controls button {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		height: 2rem;
		width: 2rem;
		border-radius: 0.45rem;
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
	}

	.mermaid-modal-controls button:hover {
		background: var(--color-bg-tertiary);
		color: var(--color-primary);
	}

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
