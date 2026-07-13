<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * The living background: a sparse grid of soft "phosphor pixels" behind the
	 * entire app. Almost still — a handful of cells breathe in and out per
	 * second — but the area around the cursor gets gently excited. Sits at
	 * z-index -1 under everything; opaque surfaces hide it, frosted panels and
	 * plain text areas let it whisper through.
	 *
	 * Deliberately cheap: one 2D canvas, a decaying-cell list (only fading
	 * cells are redrawn), ~24 fps tick, pauses when the tab is hidden and
	 * respects prefers-reduced-motion.
	 */

	const CELL = 16; // grid pitch in px
	const DOT = 3; // drawn dot size
	const AMBIENT_BIRTHS_PER_SEC = 26; // whole-screen baseline flicker
	const MOUSE_BIRTHS_PER_MOVE = 3; // extra sparks near the cursor
	const MOUSE_RADIUS = 110; // px
	const FADE_PER_SEC = 0.9; // alpha decay rate

	let canvas: HTMLCanvasElement;

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = canvas.getContext('2d', { alpha: true });
		if (!ctx) return;

		interface Cell {
			cx: number;
			cy: number;
			a: number; // current alpha 0..1 (scaled by theme ceiling at draw)
		}
		let cells: Cell[] = [];
		let cols = 0;
		let rows = 0;
		let dpr = 1;

		// Theme: warm phosphor green in the dark, soft bark-brown in the light.
		let dark = true;
		let ceiling = 0.16; // max dot alpha
		function readTheme() {
			const root = document.documentElement;
			dark = root.classList.contains('dark')
				? true
				: root.classList.contains('light')
					? false
					: window.matchMedia('(prefers-color-scheme: dark)').matches;
			ceiling = dark ? 0.16 : 0.12;
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
			cells = [];
			ctx!.clearRect(0, 0, canvas.width, canvas.height);
		}
		resize();
		window.addEventListener('resize', resize);

		function birth(cx: number, cy: number, strength: number) {
			if (cx < 0 || cy < 0 || cx >= cols || cy >= rows) return;
			// Reuse a live cell on the same spot instead of stacking
			const existing = cells.find((c) => c.cx === cx && c.cy === cy);
			if (existing) {
				existing.a = Math.max(existing.a, strength);
			} else if (cells.length < 400) {
				cells.push({ cx, cy, a: strength });
			}
		}

		let mouseX = -1;
		let mouseY = -1;
		let lastSpark = 0;
		function onMove(e: MouseEvent) {
			mouseX = e.clientX;
			mouseY = e.clientY;
			const now = performance.now();
			// Throttle spark bursts so fast movement doesn't flood the grid
			if (now - lastSpark < 40) return;
			lastSpark = now;
			for (let i = 0; i < MOUSE_BIRTHS_PER_MOVE; i++) {
				const ang = Math.random() * Math.PI * 2;
				const r = Math.sqrt(Math.random()) * MOUSE_RADIUS;
				birth(
					Math.round((mouseX + Math.cos(ang) * r) / CELL),
					Math.round((mouseY + Math.sin(ang) * r) / CELL),
					0.5 + Math.random() * 0.5
				);
			}
		}
		window.addEventListener('mousemove', onMove, { passive: true });

		let raf = 0;
		let last = performance.now();
		let acc = 0;
		const FRAME = 1000 / 24;

		function tick(now: number) {
			raf = requestAnimationFrame(tick);
			const dt = now - last;
			if (dt < FRAME) return;
			last = now;
			acc += dt;

			// Ambient births: a gentle scatter across the whole screen
			const expected = (AMBIENT_BIRTHS_PER_SEC * dt) / 1000;
			let births = Math.floor(expected) + (Math.random() < expected % 1 ? 1 : 0);
			while (births-- > 0) {
				birth(
					Math.floor(Math.random() * cols),
					Math.floor(Math.random() * rows),
					0.25 + Math.random() * 0.5
				);
			}

			ctx!.clearRect(0, 0, canvas.width, canvas.height);
			const decay = (FADE_PER_SEC * dt) / 1000;
			const [r, g, b] = dark ? [126, 231, 135] : [124, 74, 30];
			for (let i = cells.length - 1; i >= 0; i--) {
				const c = cells[i];
				c.a -= decay;
				if (c.a <= 0) {
					cells.splice(i, 1);
					continue;
				}
				// Ease the fade so dots bloom quickly and linger softly
				const alpha = ceiling * c.a * c.a;
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
