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

	const CELL = 24; // grid pitch in px
	const DOT = 10; // drawn dot size
	const AMBIENT_BIRTHS_PER_SEC = 80; // whole-screen baseline flicker
	const FADE_PER_SEC = 0.32; // slow decay — dots linger and twinkle out
	const MOUSE_SIGMA = 95; // Gaussian radius of the cursor's field, px
	const MOUSE_FIELD_PER_TICK = 10; // standing refreshes under the cursor

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
			} else if (cells.length < 1600) {
				cells.push({ cx, cy, a: strength });
			}
		}

		let mouseX = -1;
		let mouseY = -1;
		function onMove(e: MouseEvent) {
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
		window.addEventListener('mousemove', onMove, { passive: true });

		/** Standard normal via Box–Muller — the cursor's field is a true Gaussian. */
		function gaussian(): number {
			const u = Math.random() || 1e-9;
			const v = Math.random() || 1e-9;
			return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
		}

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

			// The cursor's standing field: refresh cells around the mouse with
			// Gaussian falloff every tick, so a resting cursor keeps a soft,
			// twinkling glow that never fully dies while it stays.
			if (mouseX >= 0) {
				for (let i = 0; i < MOUSE_FIELD_PER_TICK; i++) {
					const dx = gaussian() * MOUSE_SIGMA;
					const dy = gaussian() * MOUSE_SIGMA;
					const dist2 = (dx * dx + dy * dy) / (MOUSE_SIGMA * MOUSE_SIGMA);
					const strength = Math.exp(-dist2 / 2) * (0.55 + Math.random() * 0.45);
					birth(Math.round((mouseX + dx) / CELL), Math.round((mouseY + dy) / CELL), strength);
				}
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
				// Ease the fade so dots bloom quickly and linger softly, with a
				// slow per-cell twinkle while they live
				const tw = 0.72 + 0.28 * Math.sin(now / 340 + c.cx * 7.3 + c.cy * 3.1);
				const alpha = ceiling * c.a * c.a * tw;
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
