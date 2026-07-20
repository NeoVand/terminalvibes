import { writable, get } from 'svelte/store';
import { browser } from '$app/environment';

/**
 * Local-only learning progress: which sections have been read, which
 * playground scenarios have been completed (and when — the timestamps drive
 * the spaced-repetition nudges), and the self-assessed skill checklist.
 * Everything lives in localStorage; there is no backend.
 */
export interface ScenarioProgress {
	/** ISO timestamp of the most recent completion */
	completedAt: string;
	/** How many times it's been completed (resets don't decrement) */
	count: number;
}

export interface ProgressState {
	scenarios: Record<string, ScenarioProgress>;
	/** sectionId -> ISO timestamp of first visit */
	sections: Record<string, string>;
	/** skill-checklist item id -> checked */
	checklist: Record<string, boolean>;
	/**
	 * Which curriculum layout these section ids belong to. Section ids are
	 * positional, so a reordering makes saved ids mean something else — the
	 * stamp is what lets a migration run exactly once, on exactly the data it
	 * was written for.
	 */
	version?: number;
}

const STORAGE_KEY = 'terminalvibes-progress-v1';

/** Bump when section ids move, and add the matching step to MIGRATIONS. */
const CURRENT_VERSION = 2;

const EMPTY: ProgressState = {
	scenarios: {},
	sections: {},
	checklist: {},
	version: CURRENT_VERSION
};

/**
 * One entry per reordering, applied in sequence from the stored version up to
 * CURRENT_VERSION. Chaining matters: these maps share keys — `section-7-1`
 * meant Your Cockpit before v1 and Text Surgery after it — so applying them in
 * the wrong order, or twice, silently rewrites the wrong sections.
 */
const MIGRATIONS: Record<number, Record<string, string>> = {
	// → v1: the Power Tools band pushed Cockpit / Under the Hood / Conclusion
	// from 7/8/9 to 11/12/13.
	1: {
		'section-7-1': 'section-11-1',
		'section-7-2': 'section-11-2',
		'section-7-3': 'section-11-3',
		'section-7-4': 'section-11-4',
		'section-8-1': 'section-12-1',
		'section-8-2': 'section-12-2',
		'section-9-1': 'section-13-1',
		'section-9-2': 'section-13-2',
		'section-9-3': 'section-13-3',
		'section-9-4': 'section-13-4'
	},
	// → v2: the AI audit moved late (6.1 → 11.1), scripting took Part 6, and
	// everything from Your Cockpit onwards shifted by one.
	2: {
		'section-6-1': 'section-11-1',
		'section-6-2': 'section-6-1',
		'section-6-3': 'section-6-2',
		'section-11-1': 'section-12-1',
		'section-11-2': 'section-12-2',
		'section-11-3': 'section-12-3',
		'section-11-4': 'section-12-4',
		'section-12-1': 'section-13-1',
		'section-12-2': 'section-13-2',
		'section-13-1': 'section-14-1',
		'section-13-2': 'section-14-2',
		'section-13-3': 'section-14-3',
		'section-13-4': 'section-14-4'
	}
};

/**
 * Walk saved section ids forward to the current layout. Data written before
 * the stamp existed is treated as v0, which is correct: the only ids in the
 * wild without one predate every migration.
 */
export function migrateSections(
	sections: Record<string, string>,
	from: number
): Record<string, string> {
	let current = sections;
	for (let v = from + 1; v <= CURRENT_VERSION; v++) {
		const step = MIGRATIONS[v];
		if (!step) continue;
		const next: Record<string, string> = {};
		for (const [id, ts] of Object.entries(current)) next[step[id] ?? id] = ts;
		current = next;
	}
	return current;
}

function load(): ProgressState {
	if (!browser) return EMPTY;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return EMPTY;
		const parsed = JSON.parse(raw) as Partial<ProgressState>;
		return {
			scenarios: parsed.scenarios ?? {},
			sections: migrateSections(parsed.sections ?? {}, parsed.version ?? 0),
			checklist: parsed.checklist ?? {},
			version: CURRENT_VERSION
		};
	} catch {
		return EMPTY;
	}
}

export const progress = writable<ProgressState>(load());

if (browser) {
	progress.subscribe((state) => {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
		} catch {
			// storage full or blocked — progress just won't persist
		}
	});
}

export function markScenarioComplete(id: string): void {
	progress.update((state) => {
		const prev = state.scenarios[id];
		return {
			...state,
			scenarios: {
				...state.scenarios,
				[id]: { completedAt: new Date().toISOString(), count: (prev?.count ?? 0) + 1 }
			}
		};
	});
}

export function markSectionVisited(id: string): void {
	const state = get(progress);
	if (state.sections[id]) return;
	progress.update((s) => ({
		...s,
		sections: { ...s.sections, [id]: new Date().toISOString() }
	}));
}

export function toggleChecklistItem(id: string): void {
	progress.update((s) => ({
		...s,
		checklist: { ...s.checklist, [id]: !s.checklist[id] }
	}));
}

/** Wipe every recording — completions, sections read, checklist. */
export function resetProgress(): void {
	progress.set({ scenarios: {}, sections: {}, checklist: {}, version: CURRENT_VERSION });
}

export interface StaleCompletion {
	id: string;
	daysAgo: number;
}

/**
 * Completed scenarios not practiced in `minDays` — oldest first. This is the
 * spaced-repetition signal: skills fade, recovery skills fastest.
 */
export function staleCompletions(state: ProgressState, minDays = 7): StaleCompletion[] {
	const now = Date.now();
	return Object.entries(state.scenarios)
		.map(([id, p]) => ({
			id,
			daysAgo: Math.floor((now - new Date(p.completedAt).getTime()) / 86_400_000)
		}))
		.filter((s) => s.daysAgo >= minDays)
		.sort((a, b) => b.daysAgo - a.daysAgo);
}
