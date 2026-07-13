<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * The living background: a near-continuous fabric of soft phosphor pixels
	 * behind the entire app. Cells ease in and out of brightness (no hard
	 * pops), a gentle ambient breath keeps the whole surface alive, and the
	 * cursor presses a smooth Gaussian dent into the fabric that glows and
	 * twinkles while it rests there. Sits at z-index -1 under everything;
	 * opaque surfaces hide it, frosted panels let it whisper through.
	 *
	 * Deliberately cheap: one 2D canvas, a Map of active cells (only those
	 * are updated/drawn), 24 fps tick, pauses when the tab is hidden and
	 * respects prefers-reduced-motion.
	 */

	const CELL = 13; // grid pitch in px
	const DOT = 11; // drawn dot size — a 2px seam between neighbors
	const AMBIENT_BIRTHS_PER_SEC = 120; // baseline breath across the screen
	const GOAL_FADE_PER_SEC = 0.3; // how fast a cell's target settles to 0
	const EASE = 0.16; // per-tick approach toward the target (softness)
	const MOUSE_SIGMA = 90; // Gaussian radius of the cursor's press, px
	const MAX_CELLS = 4000;

	let canvas: HTMLCanvasElement;

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;

		// Each active cell eases its brightness toward a goal; the goal decays.
		interface Cell {
			cx: number;
			cy: number;
			a: number; // displayed brightness 0..1
			goal: number; // where the brightness is headed
		}
		// Non-reactive canvas bookkeeping (lives inside the effect, drawn via
		// rAF) — SvelteMap reactivity would be pure overhead here.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const cells = new Map<number, Cell>();
		let cols = 0;
		let rows = 0;
		let dpr = 1;

		// Theme: warm phosphor green in the dark, soft bark-brown in the light.
		let dark = true;
		let ceiling = 0.15;
		function readTheme() {
			const root = document.documentElement;
			dark = root.classList.contains('dark')
				? true
				: root.classList.contains('light')
					? false
					: window.matchMedia('(prefers-color-scheme: dark)').matches;
			ceiling = dark ? 0.15 : 0.11;
		}
		readTheme();
		const themeObs = new MutationObserver(readTheme);
		themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', readTheme);

		function resize() {
			dpr = Math.min(window.devicePixelRatio || 1, 2);
			canvas.width = Math.floor(window.innerWidth * dpr);
			canvas.height = Math.floor(window.innerHeight * dpr);
			cols = Math.ceil(window.innerWidth / CELL);
			rows = Math.ceil(window.innerHeight / CELL);
			cells.clear();
			ctx!.clearRect(0, 0, canvas.width, canvas.height);
		}
		resize();
		window.addEventListener('resize', resize);

		function press(cx: number, cy: number, goal: number) {
			if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
			const key = cy * cols + cx;
			const cell = cells.get(key);
			if (cell) {
				cell.goal = Math.max(cell.goal, goal);
			} else if (cells.size < MAX_CELLS) {
				cells.set(key, { cx, cy, a: 0, goal });
			}
		}

		let mouseX = -1;
		let mouseY = -1;
		function onMove(e: MouseEvent) {
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
		window.addEventListener('mousemove', onMove, { passive: true });

		let raf = 0;
		let last = performance.now();
		const FRAME = 1000 / 24;

		function tick(now: number) {
			raf = requestAnimationFrame(tick);
			const dt = now - last;
			if (dt < FRAME) return;
			last = now;

			// Ambient breath: soft blooms scattered across the whole surface
			const expected = (AMBIENT_BIRTHS_PER_SEC * dt) / 1000;
			let births = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
			while (births-- > 0) {
				press(
					Math.floor(Math.random() * cols),
					Math.floor(Math.random() * rows),
					0.2 + Math.random() * 0.45
				);
			}

			// The cursor's press: a smooth Gaussian dent, recomputed for every
			// cell under it each tick — the fabric follows the hand, no dice.
			if (mouseX >= 0) {
				const reach = Math.ceil((MOUSE_SIGMA * 2.6) / CELL);
				const mcx = Math.round(mouseX / CELL);
				const mcy = Math.round(mouseY / CELL);
				for (let gy = mcy - reach; gy <= mcy + reach; gy++) {
					for (let gx = mcx - reach; gx <= mcx + reach; gx++) {
						const dx = gx * CELL + CELL / 2 - mouseX;
						const dy = gy * CELL + CELL / 2 - mouseY;
						const g = Math.exp(-(dx * dx + dy * dy) / (2 * MOUSE_SIGMA * MOUSE_SIGMA));
						if (g > 0.04) press(gx, gy, g * 0.9);
					}
				}
			}

			ctx!.clearRect(0, 0, canvas.width, canvas.height);
			const goalDecay = (GOAL_FADE_PER_SEC * dt) / 1000;
			const [r, g, b] = dark ? [126, 231, 135] : [124, 74, 30];
			for (const [key, c] of cells) {
				c.goal = Math.max(0, c.goal - goalDecay);
				c.a += (c.goal - c.a) * EASE;
				if (c.a < 0.01 && c.goal < 0.01) {
					cells.delete(key);
					continue;
				}
				// A slow, shallow per-cell shimmer — fabric, not static
				const tw = 0.86 + 0.14 * Math.sin(now / 620 + c.cx * 1.7 + c.cy * 2.9);
				const alpha = ceiling * c.a * tw;
				ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${alpha})`;
				ctx!.fillRect(
					(c.cx * CELL + (CELL - DOT) / 2) * dpr,
					(c.cy * CELL + (CELL - DOT) / 2) * dpr,
					DOT * dpr,
					DOT * dpr
				);
			}
		}
		raf = requestAnimationFrame(tick);

		function onVisibility() {
			if (document.hidden) {
				cancelAnimationFrame(raf);
			} else {
				last = performance.now();
				raf = requestAnimationFrame(tick);
			}
		}
		document.addEventListener('visibilitychange', onVisibility);

		return () => {
			cancelAnimationFrame(raf);
			window.removeEventListener('resize', resize);
			window.removeEventListener('mousemove', onMove);
			document.removeEventListener('visibilitychange', onVisibility);
			themeObs.disconnect();
			mql.removeEventListener('change', readTheme);
		};
	});
</script>

<canvas bind:this={canvas} class="bg-pixels" aria-hidden="true"></canvas>

<style>
	.bg-pixels {
		position: fixed;
		inset: 0;
		z-index: -1;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
	}
</style>
