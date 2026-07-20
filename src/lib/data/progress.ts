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
}

const STORAGE_KEY = 'terminalvibes-progress-v1';

const EMPTY: ProgressState = { scenarios: {}, sections: {}, checklist: {} };

/**
 * The Power Tools expansion renumbered the last three parts (7/8/9 →
 * 11/12/13). Progress saved under the old section ids is carried over here so
 * returning learners keep their read history.
 */
const SECTION_ID_RENAMES: Record<string, string> = {
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
};

function migrateSections(sections: Record<string, string>): Record<string, string> {
	const out: Record<string, string> = {};
	for (const [id, ts] of Object.entries(sections)) {
		out[SECTION_ID_RENAMES[id] ?? id] = ts;
	}
	return out;
}

function load(): ProgressState {
	if (!browser) return EMPTY;
	try {
		const raw = localStorage.getItem(STORAGE_KEY);
		if (!raw) return EMPTY;
		const parsed = JSON.parse(raw) as Partial<ProgressState>;
		return {
			scenarios: parsed.scenarios ?? {},
			sections: migrateSections(parsed.sections ?? {}),
			checklist: parsed.checklist ?? {}
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
	progress.set({ scenarios: {}, sections: {}, checklist: {} });
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
