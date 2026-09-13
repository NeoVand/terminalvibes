export interface ArtReference {
	file: string;
	section: string;
	src: string;
	alt: string;
	caption: string;
}
export interface ArtVariant {
	id: string;
	label: string;
	path: string;
}
export interface ArtConcept {
	id: string;
	title: string;
	chapter: number | 'brand';
	kind: 'replacement' | 'new' | 'brand';
	purpose: string;
	visualBrief: string;
	visualChecks: string[];
	styleReferences?: string[];
	altSuggestion: string;
	aspectRatio: string;
	sourceRefs: ArtReference[];
	placements: { file: string; section: string }[];
	derivedAssets: { path: string; purpose: string }[];
	variants: ArtVariant[];
}
export interface ArtCatalog {
	schemaVersion: number;
	version: string;
	title: string;
	minimumAlternatives: number;
	artDirection: string;
	guardrails: string[];
	variantDirections: { id: string; name: string; brief: string }[];
	reviewNotes: string[];
	reviewScope?: string[];
	concepts: ArtConcept[];
}
export interface AvailableArt {
	path: string;
	sha256: string;
	bytes: number;
	width: number;
	height: number;
}
export interface ArtDecision {
	status: 'draft' | 'chosen' | 'changes-requested';
	variant: string | null;
	sha256: string | null;
	note: string;
	updatedAt: string;
}
export type ArtDecisions = Record<string, ArtDecision>;
export const ART_REVIEW_STORAGE_KEY = 'tv-art-review-selections-v1';

/** Accept only catalogued paths. The local index cannot inject a remote image URL. */
export function parseAvailability(value: unknown, catalog: ArtCatalog): AvailableArt[] {
	if (
		!value ||
		typeof value !== 'object' ||
		!('schemaVersion' in value) ||
		value.schemaVersion !== 1 ||
		!('files' in value) ||
		!Array.isArray(value.files)
	)
		return [];
	const expected = new Set(
		catalog.concepts.flatMap((concept) => concept.variants.map((variant) => variant.path))
	);
	return value.files.filter(
		(file): file is AvailableArt =>
			!!file &&
			typeof file === 'object' &&
			expected.has(file.path) &&
			/^[a-f0-9]{64}$/.test(file.sha256) &&
			Number.isSafeInteger(file.bytes) &&
			file.bytes > 0 &&
			Number.isSafeInteger(file.width) &&
			file.width > 0 &&
			Number.isSafeInteger(file.height) &&
			file.height > 0
	);
}

/** Restored decisions must name real slots; an image hash is still checked at display/export time. */
export function parseDecisions(value: unknown, catalog: ArtCatalog): ArtDecisions {
	if (
		!value ||
		typeof value !== 'object' ||
		!('schemaVersion' in value) ||
		value.schemaVersion !== 1 ||
		!('decisions' in value) ||
		!value.decisions ||
		typeof value.decisions !== 'object'
	)
		return {};
	const decisions: ArtDecisions = {};
	for (const concept of catalog.concepts) {
		const decision = (value.decisions as Record<string, unknown>)[concept.id];
		if (!decision || typeof decision !== 'object') continue;
		const entry = decision as Partial<ArtDecision>;
		if (
			!['draft', 'chosen', 'changes-requested'].includes(entry.status ?? '') ||
			typeof entry.note !== 'string' ||
			typeof entry.updatedAt !== 'string'
		)
			continue;
		if (entry.variant !== null && !concept.variants.some((variant) => variant.id === entry.variant))
			continue;
		if (
			entry.sha256 !== null &&
			(typeof entry.sha256 !== 'string' || !/^[a-f0-9]{64}$/.test(entry.sha256))
		)
			continue;
		if (entry.status === 'chosen' && (!entry.variant || !entry.sha256)) continue;
		decisions[concept.id] = entry as ArtDecision;
	}
	return decisions;
}

export function choiceIsCurrent(
	concept: ArtConcept,
	decision: ArtDecision | undefined,
	files: AvailableArt[]
): boolean {
	if (decision?.status !== 'chosen') return false;
	const variant = concept.variants.find((candidate) => candidate.id === decision.variant);
	return (
		!!variant && files.some((file) => file.path === variant.path && file.sha256 === decision.sha256)
	);
}

export function selectionExport(
	catalog: ArtCatalog,
	decisions: ArtDecisions,
	files: AvailableArt[]
) {
	return {
		schemaVersion: 1,
		catalogVersion: catalog.version,
		exportedAt: new Date().toISOString(),
		decisions,
		selections: catalog.concepts
			.filter((concept) => decisions[concept.id])
			.map((concept) => {
				const decision = decisions[concept.id];
				return {
					conceptId: concept.id,
					title: concept.title,
					...decision,
					candidatePath:
						concept.variants.find((variant) => variant.id === decision.variant)?.path ?? null,
					verifiedAgainstCurrentFile: choiceIsCurrent(concept, decision, files),
					originals: concept.sourceRefs.map(({ src, section }) => ({ src, section }))
				};
			})
	};
}
