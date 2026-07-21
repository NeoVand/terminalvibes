/**
 * The one breakpoint that decides WHICH progress timeline the reader gets.
 *
 * At or above this width the header's Thread rail mounts and owns course
 * progress; below it the rail is not mounted (no width to be legible, no
 * pointer to drive its fisheye) and the sidebar's mini timeline takes over.
 *
 * Both surfaces import THIS constant rather than each writing their own query,
 * because the failure mode is a viewport width showing BOTH timelines or
 * NEITHER. One string, two consumers, no boundary to get wrong.
 *
 * Consumers: src/lib/components/layout/Header.svelte (mounts the rail when it
 * matches) and src/lib/components/layout/Sidebar.svelte (renders the mini
 * timeline when it does not).
 *
 * ── why 744 and not 1280 ────────────────────────────────────────────────────
 * 744pt is iPad mini portrait; 820pt is iPad Air portrait. The rail is the
 * app's one piece of ambient art and it used to vanish at 1280, which killed
 * it on every tablet held upright — far earlier than the width actually
 * demanded.
 *
 * What the rail needs is not viewport width but its OWN width, and the header
 * can buy that back by spending the control cluster instead. Header.svelte
 * sheds, in order: the Playground/Agent text labels (<1280), the GitHub link
 * and the 260px search box, which collapses to its magnifier (<1120), and the
 * wordmark (<860). Measured rail widths with that ladder in place:
 *
 *   1280 → 518px    1120 → 480px    860 → 484px    820 → 554px    744 → 478px
 *
 * all of them clear the 448px sweep floor documented on `.thread-cell` in
 * Header.svelte. Below 744 no amount of shedding clears it, so that is where
 * the rail stops and the sidebar's mini timeline takes over.
 *
 * This is a resting-state guarantee. Focusing the search box deliberately
 * squeezes the rail leftward, and on tablets that squeeze does dip under the
 * floor — see the note on `.thread-cell`. That is a mode the reader is in for
 * as long as they are typing, and it restores itself on blur.
 */
export const RAIL_MEDIA_QUERY = '(min-width: 744px)';

/**
 * Track `RAIL_MEDIA_QUERY` from inside an `$effect`. Returns the teardown, so
 * the call site is one line:
 *
 * ```ts
 * let wide = $state(false);
 * $effect(() => watchRailBreakpoint((m) => (wide = m)));
 * ```
 *
 * `wide` starts false on both surfaces, which is the mobile arrangement — so
 * SSR and the first client frame render the sidebar timeline and no rail, then
 * both flip together on the same matchMedia event. There is no frame with two
 * timelines and none with zero.
 */
export function watchRailBreakpoint(set: (matches: boolean) => void): () => void {
	const mq = window.matchMedia(RAIL_MEDIA_QUERY);
	const sync = () => set(mq.matches);
	sync();
	mq.addEventListener('change', sync);
	return () => mq.removeEventListener('change', sync);
}
