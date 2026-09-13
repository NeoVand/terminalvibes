import { describe, expect, it } from 'vitest';
import rawCatalog from '$lib/data/art-concepts.json';
import {
	choiceIsCurrent,
	parseAvailability,
	parseDecisions,
	selectionExport,
	type ArtCatalog,
	type ArtDecision
} from './art-review';

const catalog = rawCatalog as ArtCatalog;
const concept = catalog.concepts[0];
const variant = concept.variants[0];
const image = {
	path: variant.path,
	sha256: 'a'.repeat(64),
	width: 1536,
	height: 1024,
	bytes: 2048
};
const chosen: ArtDecision = {
	status: 'chosen',
	variant: variant.id,
	sha256: image.sha256,
	note: 'Keep the whole frame.',
	updatedAt: '2026-09-13T00:00:00Z'
};

describe('local artwork decisions', () => {
	it('starts with no choices and never promotes a saved note into a choice', () => {
		expect(parseDecisions(null, catalog)).toEqual({});
		const decisions = parseDecisions(
			{
				schemaVersion: 1,
				decisions: { [concept.id]: { ...chosen, status: 'draft', variant: null, sha256: null } }
			},
			catalog
		);
		expect(choiceIsCurrent(concept, decisions[concept.id], [image])).toBe(false);
	});
	it('indexes only valid local slots and preserves the actual image dimensions', () => {
		const indexed = parseAvailability(
			{
				schemaVersion: 1,
				files: [
					image,
					{ ...image, path: 'https://example.com/foreign.webp' },
					{ ...image, path: 'art-candidates/unknown/01.webp' },
					{ ...image, sha256: 'bad' },
					{ ...image, width: 0 }
				]
			},
			catalog
		);
		expect(indexed).toEqual([image]);
	});
	it('rejects unknown, malformed, and fabricated approvals when restoring storage', () => {
		expect(
			parseDecisions(
				{
					schemaVersion: 1,
					decisions: { invented: chosen, [concept.id]: { ...chosen, variant: '99' } }
				},
				catalog
			)
		).toEqual({});
		expect(
			parseDecisions(
				{ schemaVersion: 1, decisions: { [concept.id]: { ...chosen, sha256: null } } },
				catalog
			)
		).toEqual({});
	});
	it('requires the exact approved file hash and treats changed or missing files as unapproved', () => {
		expect(choiceIsCurrent(concept, chosen, [image])).toBe(true);
		expect(choiceIsCurrent(concept, chosen, [])).toBe(false);
		expect(choiceIsCurrent(concept, chosen, [{ ...image, sha256: 'b'.repeat(64) }])).toBe(false);
		expect(choiceIsCurrent(concept, { ...chosen, status: 'changes-requested' }, [image])).toBe(
			false
		);
	});
	it('exports auditable choices and explicitly flags stale files without replacing artwork', () => {
		const payload = selectionExport(catalog, { [concept.id]: chosen }, []);
		expect(payload.catalogVersion).toBe(catalog.version);
		expect(payload.selections).toHaveLength(1);
		expect(payload.selections[0]).toMatchObject({
			conceptId: concept.id,
			candidatePath: variant.path,
			sha256: image.sha256,
			verifiedAgainstCurrentFile: false,
			note: chosen.note
		});
		expect(parseDecisions(payload, catalog)).toEqual({ [concept.id]: chosen });
	});
});
