<script lang="ts">
	import { onMount } from 'svelte';

	/**
	 * The living background: a near-continuous fabric of soft phosphor pixels
	 * behind the entire app. Brightness comes from two sources added together.
	 *
	 * The ambient layer is a *field*, not a population: a slow drifting
	 * interference pattern evaluated fresh for every cell each frame. Nothing
	 * is born and nothing dies — cells brighten and dim as the pattern sweeps
	 * across them, so neighbours move together and the surface breathes
	 * instead of flickering. A fixed per-cell speckle offset keeps the texture
	 * pixellated rather than plasma-like, and because that offset is constant
	 * the variation it creates is still smooth in time.
	 *
	 * On top of that, event energy: the cursor presses a Gaussian dent swept
	 * along its path, and circular waves ripple outward from it — each wave
	 * stochastically brightening some cells more than others, like light
	 * catching threads. Only those cells live in the Map. A second canvas
	 * above the content replays everything in difference blend, clipped to
	 * [data-fabric] surfaces (TOC, code blocks, callouts), so the fabric
	 * subtly inverts through what sits on top of it.
	 *
	 * Deliberately cheap: the ambient field is separable, so it costs a few
	 * hundred sines per frame rather than one per cell. Full-rate rAF with
	 * every rate constant expressed per second so the look is identical at
	 * 60/120/144 Hz; pauses when the tab is hidden and respects
	 * prefers-reduced-motion.
	 */

	const CELL = 13; // grid pitch in px
	const DOT = 11; // drawn dot size — a 2px seam between neighbors
	const GOAL_FADE_PER_SEC = 0.5; // release — quick enough that waves read as motion
	// Brightness chases its goal on an exponential with separate time
	// constants: quick to catch the light, slow to let it go. The asymmetry
	// is what makes the fabric feel responsive *and* watery rather than
	// merely fast or merely soft.
	const ATTACK_MS = 70;
	const RELEASE_MS = 260;
	// Ambient field. The two products below beat against each other into soft
	// drifting blobs; LO/HI is the smoothstep window that decides how much of
	// the screen is lit at once, and SPECKLE is how far a single cell may
	// stray from its neighbours.
	const AMBIENT_LO = 0.8;
	const AMBIENT_HI = 1.75;
	const AMBIENT_SPECKLE = 0.9;
	const AMBIENT_LEVEL = 0.55; // ambient can never reach full event brightness
	const DRAW_FLOOR = 0.012; // below this a cell is invisible; skip the fill
	const TWINKLE_MS = 540; // period of the per-cell shimmer
	const MOUSE_SIGMA = 90; // Gaussian radius of the cursor's press, px
	const MOUSE_REACH = MOUSE_SIGMA * 2.6; // where the Gaussian is worth evaluating
	const MAX_CELLS = 4000;
	const MAX_DT = 50; // clamp after a stall so nothing lurches
	const RING_EVERY_MS = 1050; // a new wave leaves the cursor about once a second
	const RING_SPEED = 130; // outward speed, px/s
	const RING_SIGMA = 24; // radial thickness of the wave band
	const RING_BAND = RING_SIGMA * 3; // where the band is worth evaluating
	const RING_MAX_R = 360; // waves dissolve past this radius

	let canvas: HTMLCanvasElement;
	let overlay: HTMLCanvasElement;

	onMount(() => {
		if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

		const ctx = canvas.getContext('2d', { alpha: true });
		const octx = overlay.getContext('2d', { alpha: true });
		if (!ctx || !octx) return;

		// Cells carrying event energy ease toward a goal; the goal decays. The
		// grid position is the Map key, so it isn't stored again here.
		interface Cell {
			a: number; // displayed brightness 0..1
			goal: number; // where the brightness is headed
		}
		// Non-reactive canvas bookkeeping (lives inside the effect, drawn via
		// rAF) — SvelteMap reactivity would be pure overhead here.
		// eslint-disable-next-line svelte/prefer-svelte-reactivity
		const cells = new Map<number, Cell>();
		interface Ring {
			x: number;
			y: number;
			born: number;
			seed: number;
		}
		let rings: Ring[] = [];
		let lastRing = 0;
		let ringSeed = 1;
		let cols = 0;
		let rows = 0;
		// Ambient field scratch, sized in resize()
		let fx1 = new Float32Array(0);
		let fx2 = new Float32Array(0);
		let fy1 = new Float32Array(0);
		let fy2 = new Float32Array(0);
		let speckle = new Float32Array(0);

		// Theme: warm phosphor green in the dark, soft bark-brown in the light.
		let dark = true;
		let ceiling = 0.15;
		let overlayCeiling = 0.1;
		function readTheme() {
			const root = document.documentElement;
			dark = root.classList.contains('dark')
				? true
				: root.classList.contains('light')
					? false
					: window.matchMedia('(prefers-color-scheme: dark)').matches;
			ceiling = dark ? 0.15 : 0.11;
			overlayCeiling = dark ? 0.1 : 0.08;
		}
		readTheme();
		const themeObs = new MutationObserver(readTheme);
		themeObs.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
		const mql = window.matchMedia('(prefers-color-scheme: dark)');
		mql.addEventListener('change', readTheme);

		function resize() {
			const dpr = Math.min(window.devicePixelRatio || 1, 2);
			const size = (cv: HTMLCanvasElement, c2d: CanvasRenderingContext2D) => {
				cv.width = Math.floor(window.innerWidth * dpr);
				cv.height = Math.floor(window.innerHeight * dpr);
				// Work in CSS pixels on both canvases
				c2d.setTransform(dpr, 0, 0, dpr, 0, 0);
			};
			size(canvas, ctx!);
			size(overlay, octx!);
			cols = Math.ceil(window.innerWidth / CELL);
			rows = Math.ceil(window.innerHeight / CELL);
			cells.clear();

			// The ambient field is a sum of two products of one-dimensional
			// waves, which means each frame only needs cols+rows sines instead
			// of one per cell — a few hundred rather than several thousand.
			fx1 = new Float32Array(cols);
			fx2 = new Float32Array(cols);
			fy1 = new Float32Array(rows);
			fy2 = new Float32Array(rows);
			// A cell's speckle offset never changes, so as the field drifts
			// over it the cell still fades smoothly — it just peaks at its own
			// level rather than its neighbour's. This is what keeps the look
			// pixellated without reintroducing frame-to-frame noise.
			speckle = new Float32Array(cols * rows);
			for (let gy = 0; gy < rows; gy++) {
				for (let gx = 0; gx < cols; gx++) {
					speckle[gy * cols + gx] = hash(gx, gy, 0);
				}
			}
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
				cells.set(key, { a: 0, goal });
			}
		}

		// Stable pseudo-random per (cell, ring): the same thread catches the
		// same light for the whole pass of one wave — stochastic but not noisy.
		function hash(cx: number, cy: number, seed: number) {
			const s = Math.sin(cx * 127.1 + cy * 311.7 + seed * 74.7) * 43758.5453;
			return s - Math.floor(s);
		}

		// The cursor is read straight from the event and used the same frame —
		// no smoothing, no lag. `prev` is where it was when we last drew, so a
		// frame can sweep the press along the whole segment travelled rather
		// than stamping one blob per frame.
		let mouseX = -1;
		let mouseY = -1;
		let prevX = -1;
		let prevY = -1;
		function onMove(e: MouseEvent) {
			if (mouseX < 0) {
				// Entering (or first move): start the sweep here, don't streak
				// in from wherever the pointer was last seen.
				prevX = e.clientX;
				prevY = e.clientY;
			}
			mouseX = e.clientX;
			mouseY = e.clientY;
		}
		function onLeave() {
			mouseX = -1;
			mouseY = -1;
		}
		// pointerrawupdate delivers samples as the device produces them instead
		// of coalescing them to the frame boundary, so the position we draw
		// with is the freshest one available rather than one already a frame
		// old. (We keep only the latest, so a flick still sweeps the chord
		// between frames — at these frame times the corner it cuts is invisible.)
		const MOVE_EVENT = 'onpointerrawupdate' in window ? 'pointerrawupdate' : 'pointermove';
		window.addEventListener(MOVE_EVENT, onMove as EventListener, { passive: true });
		document.documentElement.addEventListener('pointerleave', onLeave);

		// Surfaces the overlay ripples through, re-queried occasionally
		// (sections mount lazily) and measured every tick (they scroll).
		let fabricEls: Element[] = [];
		let lastQuery = 0;

		let raf = 0;
		let last = performance.now();

		function tick(now: number) {
			raf = requestAnimationFrame(tick);
			// Every rate below is per-second, so running at whatever the display
			// gives us costs nothing in consistency and buys temporal resolution.
			const dt = Math.min(now - last, MAX_DT);
			last = now;

			if (mouseX >= 0) {
				// The cursor's press: a Gaussian swept along the segment the
				// pointer travelled since the last frame — distance to a capsule,
				// not to a point. A slow drift is an ordinary round dent; a fast
				// flick lays down one continuous smear instead of a dotted line
				// of separate blobs, which is what read as stop-motion before.
				const vx = mouseX - prevX;
				const vy = mouseY - prevY;
				const vlen2 = vx * vx + vy * vy;
				const gx0 = Math.floor((Math.min(prevX, mouseX) - MOUSE_REACH) / CELL);
				const gx1 = Math.ceil((Math.max(prevX, mouseX) + MOUSE_REACH) / CELL);
				const gy0 = Math.floor((Math.min(prevY, mouseY) - MOUSE_REACH) / CELL);
				const gy1 = Math.ceil((Math.max(prevY, mouseY) + MOUSE_REACH) / CELL);
				for (let gy = gy0; gy <= gy1; gy++) {
					const py = gy * CELL + CELL / 2;
					for (let gx = gx0; gx <= gx1; gx++) {
						const px = gx * CELL + CELL / 2;
						// Where along the segment this cell is closest, clamped
						// to the ends so the capsule gets its round caps.
						let t = vlen2 > 0 ? ((px - prevX) * vx + (py - prevY) * vy) / vlen2 : 1;
						t = t < 0 ? 0 : t > 1 ? 1 : t;
						const dx = px - (prevX + vx * t);
						const dy = py - (prevY + vy * t);
						const g = Math.exp(-(dx * dx + dy * dy) / (2 * MOUSE_SIGMA * MOUSE_SIGMA));
						// The head of the sweep is a touch brighter than its
						// tail, so the smear still reads as having a direction.
						if (g > 0.04) press(gx, gy, g * 0.7 * (0.78 + 0.22 * t));
					}
				}
				// ...and waves depart from it, one about every second
				if (now - lastRing > RING_EVERY_MS) {
					lastRing = now;
					rings.push({ x: mouseX, y: mouseY, born: now, seed: ringSeed++ });
				}
			}
			prevX = mouseX;
			prevY = mouseY;

			// Each wave: an annulus sweeping outward, fading as it travels.
			// Per-cell jitter makes threads catch the light unevenly, and a few
			// cells flare brighter than the wave itself.
			rings = rings.filter((ring) => ((now - ring.born) / 1000) * RING_SPEED < RING_MAX_R);
			for (const ring of rings) {
				const rad = ((now - ring.born) / 1000) * RING_SPEED;
				const fade = Math.pow(1 - rad / RING_MAX_R, 1.4) * Math.min(1, rad / 50);
				if (fade <= 0.02) continue;
				// Walk only the rows the band actually crosses, and within each
				// row only the one or two spans where it does — a wave near its
				// maximum radius touches a thin annulus, not the square that
				// encloses it, and the difference is most of the work.
				const outer = rad + RING_BAND;
				const inner = rad - RING_BAND;
				const gy0 = Math.floor((ring.y - outer) / CELL);
				const gy1 = Math.ceil((ring.y + outer) / CELL);
				const spanFor = (half: number, py: number) => {
					const h2 = half * half - py * py;
					return h2 > 0 ? Math.sqrt(h2) : -1;
				};
				for (let gy = gy0; gy <= gy1; gy++) {
					const dy = gy * CELL + CELL / 2 - ring.y;
					const xOuter = spanFor(outer, dy);
					if (xOuter < 0) continue;
					const xInner = inner > 0 ? spanFor(inner, dy) : -1;
					// Outside the hole the band is one span; across the hole it
					// splits into the two sides of the annulus.
					const spans =
						xInner < 0
							? [[ring.x - xOuter, ring.x + xOuter]]
							: [
									[ring.x - xOuter, ring.x - xInner],
									[ring.x + xInner, ring.x + xOuter]
								];
					for (const [sx, ex] of spans) {
						const sgx = Math.floor(sx / CELL);
						const egx = Math.ceil(ex / CELL);
						for (let gx = sgx; gx <= egx; gx++) {
							const dx = gx * CELL + CELL / 2 - ring.x;
							const d = Math.sqrt(dx * dx + dy * dy) - rad;
							if (d > RING_BAND || d < -RING_BAND) continue;
							const band = Math.exp(-(d * d) / (2 * RING_SIGMA * RING_SIGMA)) * fade;
							if (band <= 0.05) continue;
							const h = hash(gx, gy, ring.seed);
							const flare = h > 0.93 ? 1.7 : 1;
							press(gx, gy, Math.min(0.95, band * (0.5 + h * 0.9) * flare * 0.8));
						}
					}
				}
			}

			// Overlay clip: the [data-fabric] surfaces currently on screen
			if (now - lastQuery > 2000) {
				lastQuery = now;
				fabricEls = Array.from(document.querySelectorAll('[data-fabric]'));
			}
			const vw = window.innerWidth;
			const vh = window.innerHeight;
			ctx!.clearRect(0, 0, vw, vh);
			octx!.clearRect(0, 0, vw, vh);
			let clipped = false;
			for (const el of fabricEls) {
				const r = el.getBoundingClientRect();
				if (r.width < 1 || r.bottom < 0 || r.top > vh || r.right < 0 || r.left > vw) continue;
				if (!clipped) {
					octx!.save();
					octx!.beginPath();
					clipped = true;
				}
				if (typeof octx!.roundRect === 'function') {
					octx!.roundRect(r.x, r.y, r.width, r.height, 8);
				} else {
					octx!.rect(r.x, r.y, r.width, r.height);
				}
			}
			if (clipped) octx!.clip();

			const goalDecay = (GOAL_FADE_PER_SEC * dt) / 1000;
			// Frame-rate-independent easing: the fraction to close this frame
			// depends on how long the frame actually was, so the *time* a cell
			// takes to reach its goal is fixed no matter the refresh rate.
			const attack = 1 - Math.exp(-dt / ATTACK_MS);
			const release = 1 - Math.exp(-dt / RELEASE_MS);
			const [r, g, b] = dark ? [126, 231, 135] : [124, 74, 30];

			// Event energy (cursor + waves) settles first. A cell is only
			// dropped once it is well under the visible floor, so it is never
			// removed while still showing anything.
			for (const [key, c] of cells) {
				c.goal = Math.max(0, c.goal - goalDecay);
				c.a += (c.goal - c.a) * (c.goal > c.a ? attack : release);
				if (c.a < DRAW_FLOOR * 0.3 && c.goal < DRAW_FLOOR * 0.3) cells.delete(key);
			}

			// Rebuild the ambient field for this instant. Four slow drifts at
			// mutually unrelated rates, so the pattern never visibly repeats.
			const ts = now / 1000;
			for (let gx = 0; gx < cols; gx++) {
				fx1[gx] = Math.sin(gx * 0.35 + ts * 0.55);
				fx2[gx] = Math.sin(gx * 0.19 - ts * 0.37);
			}
			for (let gy = 0; gy < rows; gy++) {
				fy1[gy] = Math.sin(gy * 0.29 - ts * 0.43);
				fy2[gy] = Math.sin(gy * 0.23 + ts * 0.31);
			}

			const span = AMBIENT_HI - AMBIENT_LO;
			const twPhase = (now / TWINKLE_MS) % (Math.PI * 2);
			for (let gy = 0; gy < rows; gy++) {
				const y1 = fy1[gy];
				const y2 = fy2[gy];
				const row = gy * cols;
				const y = gy * CELL + (CELL - DOT) / 2;
				for (let gx = 0; gx < cols; gx++) {
					const key = row + gx;
					const h = speckle[key];
					// The field, offset by this cell's fixed speckle
					const f = fx1[gx] * y1 + 0.8 * fx2[gx] * y2 + (h - 0.5) * AMBIENT_SPECKLE;
					// Smoothstep, so cells ease in and out of the lit band with
					// zero gradient at both ends — no edge to catch the eye
					let v = (f - AMBIENT_LO) / span;
					v = v <= 0 ? 0 : v >= 1 ? 1 : v * v * (3 - 2 * v);

					const c = cells.get(key);
					let level = v * AMBIENT_LEVEL + (c ? c.a : 0);
					if (level < DRAW_FLOOR) continue;
					if (level > 1) level = 1;

					// A slow shimmer, each cell on its own phase
					const tw = 0.72 + 0.28 * Math.sin(twPhase + h * 6.283);
					const x = gx * CELL + (CELL - DOT) / 2;
					ctx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${ceiling * level * tw})`;
					ctx!.fillRect(x, y, DOT, DOT);
					if (clipped) {
						octx!.fillStyle = `rgba(${r}, ${g}, ${b}, ${overlayCeiling * level * tw})`;
						octx!.fillRect(x, y, DOT, DOT);
					}
				}
			}
			if (clipped) octx!.restore();
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
			window.removeEventListener(MOVE_EVENT, onMove as EventListener);
			document.documentElement.removeEventListener('pointerleave', onLeave);
			document.removeEventListener('visibilitychange', onVisibility);
			themeObs.disconnect();
			mql.removeEventListener('change', readTheme);
		};
	});
</script>

<canvas bind:this={canvas} class="bg-pixels" aria-hidden="true"></canvas>
<canvas bind:this={overlay} class="bg-pixels-overlay" aria-hidden="true"></canvas>

<style>
	.bg-pixels,
	.bg-pixels-overlay {
		position: fixed;
		inset: 0;
		width: 100vw;
		height: 100vh;
		pointer-events: none;
	}

	.bg-pixels {
		z-index: -1;
	}

	/* Above the page surfaces it ripples through, below the header (50)
	   and every modal; difference blend inverts instead of glowing, and a
	   whisper of blur melts the dots into the glass they pass behind. */
	.bg-pixels-overlay {
		z-index: 45;
		mix-blend-mode: difference;
		filter: blur(2px);
	}
</style>
