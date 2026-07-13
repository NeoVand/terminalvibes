export const sectionIds = [
	'hero',
	'section-intro-what',
	'section-intro-history',
	'section-intro-shells',
	'section-intro-anatomy',
	'section-intro-under-the-hood',
	'part-1',
	'section-1-1',
	'section-1-2',
	'section-1-3',
	'part-2',
	'section-2-1',
	'section-2-2',
	'section-2-3',
	'section-2-4',
	'section-2-5',
	'part-3',
	'section-3-1',
	'section-3-2',
	'section-3-3',
	'section-3-4',
	'part-4',
	'section-4-1',
	'section-4-2',
	'section-4-3',
	'section-4-4',
	'section-4-5',
	'part-5',
	'section-5-1',
	'section-5-2',
	'section-5-3',
	'section-5-4',
	'section-5-5',
	'part-6',
	'section-6-1',
	'section-6-2',
	'section-6-3',
	'part-7',
	'section-7-1',
	'section-7-2',
	'section-7-3',
	'section-7-4',
	'part-8',
	'section-8-1',
	'section-8-2',
	'section-8-3',
	'section-8-4'
] as const;

/**
 * Anchor ids of the embedded playground activities (the sidebar's gamepad
 * entries). Kept separate from sectionIds so the part/section hierarchy stays
 * clean, but deep links and scroll-spy treat them the same way.
 */
export const playgroundAnchorIds = [
	'first-steps',
	'navigation',
	'workspace-setup',
	'tidy-up',
	'glob-practice',
	'log-detective',
	'pipeline-practice',
	'find-files',
	'fix-permissions',
	'path-repair',
	'alias-workshop',
	'audit-the-agent',
	'first-script',
	'exit-codes',
	'capstone'
] as const;

/** Every id that can appear in the URL hash and the sidebar scroll-spy. */
export const anchorIds: readonly string[] = [...sectionIds, ...playgroundAnchorIds];
