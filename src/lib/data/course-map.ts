/**
 * The course as a graph rather than a list.
 *
 * Labels and icons are NOT duplicated here — they resolve from sidebarNav, so
 * a part renamed in the sidebar is renamed everywhere it's referenced. That
 * indirection is the point: cross-references in the prose name a part instead
 * of numbering it, which keeps them correct if the curriculum is ever
 * reordered.
 */

export interface CourseNode {
	/** Anchor id, e.g. 'part-8'. */
	id: string;
	/** What a learner can do after this part — one short clause. */
	gives: string;
	/** Parts whose skills this one genuinely builds on. */
	needs: string[];
	/**
	 * 'core'      — the spine; skipping one breaks what follows
	 * 'power'     — everyday power tools, each independently useful
	 * 'mastery'   — synthesis and enrichment; rewarding, not load-bearing
	 */
	track: 'core' | 'power' | 'mastery';
}

/**
 * Prerequisites are the honest ones: what the lesson actually leans on, not
 * everything that happens to come earlier. `find-files` needs pipes; it does
 * not need chmod.
 */
export const courseGraph: CourseNode[] = [
	{ id: 'hero', gives: 'what a terminal is, and why it matters now', needs: [], track: 'core' },
	{ id: 'part-1', gives: 'open a terminal and ask it for help', needs: ['hero'], track: 'core' },
	{ id: 'part-2', gives: 'know where you are and move anywhere', needs: ['part-1'], track: 'core' },
	{
		id: 'part-3',
		gives: 'copy, move and delete without losing work',
		needs: ['part-2'],
		track: 'core'
	},
	{
		id: 'part-4',
		gives: 'redirect, pipe, search and count — compose small tools',
		needs: ['part-2', 'part-3'],
		track: 'core'
	},
	{
		id: 'part-5',
		gives: 'fix "permission denied" and "command not found"',
		needs: ['part-2', 'part-4'],
		track: 'core'
	},
	{
		id: 'part-6',
		gives: 'audit any command an agent proposes',
		needs: ['part-3', 'part-4', 'part-5'],
		track: 'core'
	},
	{
		id: 'part-7',
		gives: 'change text in bulk — safely',
		needs: ['part-4'],
		track: 'power'
	},
	{
		id: 'part-8',
		gives: 'unstick a machine: stop a process, free a port',
		needs: ['part-4', 'part-7'],
		track: 'power'
	},
	{
		id: 'part-9',
		gives: 'check a server yourself and keep keys safe',
		needs: ['part-5', 'part-8'],
		track: 'power'
	},
	{
		id: 'part-10',
		gives: 'install tools, open archives, find what fills the disk',
		needs: ['part-3', 'part-5'],
		track: 'power'
	},
	{
		id: 'part-11',
		gives: 'make the terminal fast and yours',
		needs: ['part-4', 'part-5'],
		track: 'mastery'
	},
	{
		id: 'part-12',
		gives: 'understand what is really happening underneath',
		needs: ['part-8'],
		track: 'mastery'
	},
	{
		id: 'part-13',
		gives: 'the mindset, a reference card, and two final challenges',
		needs: ['part-6', 'part-10'],
		track: 'mastery'
	}
];

export function nodeFor(id: string): CourseNode | undefined {
	return courseGraph.find((n) => n.id === id);
}

/** Course order, for laying the map out in reading sequence. */
export const courseOrder: string[] = courseGraph.map((n) => n.id);

/**
 * Everything you'd need before `id` makes sense, walked transitively and
 * returned in reading order — the "what do I have to read first?" answer.
 */
export function prerequisitesOf(id: string): string[] {
	const seen = new Set<string>();
	const walk = (current: string) => {
		for (const need of nodeFor(current)?.needs ?? []) {
			if (seen.has(need)) continue;
			seen.add(need);
			walk(need);
		}
	};
	walk(id);
	return courseOrder.filter((n) => seen.has(n));
}
