import assert from 'node:assert/strict';
import { copyFileSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { resolve } from 'node:path';
import { test } from 'node:test';
import {
	loadCatalog,
	promptFor,
	root,
	scanAvailability,
	scanIllustrations,
	validateCatalog
} from './art-inventory.mjs';
import { excludePrivateArt, isPrivateArtPath } from './static-art-isolation.mjs';

const catalog = loadCatalog();
test('every active illustration is inventoried and every concept has at least five real candidate slots', () => {
	assert.deepEqual(validateCatalog(catalog), []);
	assert.ok(scanIllustrations().length >= 56);
	assert.ok(catalog.concepts.every((concept) => concept.variants.length >= 5));
	const missing = structuredClone(catalog);
	missing.concepts.shift();
	assert.ok(validateCatalog(missing).some((error) => error.includes('Uncatalogued illustration')));
});
test('keyboard and history retain separate artwork and review choices', () => {
	const keyboard = catalog.concepts.find((concept) => concept.id === 'keyboard-line-editing');
	const history = catalog.concepts.find((concept) => concept.id === 'history-superpowers');
	assert.equal(keyboard.sourceRefs[0].section, 'keyboard-workshop');
	assert.equal(history.sourceRefs[0].section, 'section-12-2');
	assert.notEqual(keyboard.sourceRefs[0].src, history.sourceRefs[0].src);
	assert.notEqual(keyboard.variants[0].path, history.variants[0].path);
});
test('each prompt combines its teaching brief with a distinct visual direction', () => {
	const concept = catalog.concepts.find((entry) => entry.id === 'file-editor-save');
	const prompts = concept.variants.map((variant) => promptFor(catalog, concept, variant));
	assert.equal(new Set(prompts).size, 5);
	for (const prompt of prompts) {
		assert.ok(prompt.includes(concept.visualBrief));
		assert.ok(prompt.includes(`Teaching purpose: ${concept.purpose}`));
	}
});
test('the new-section scope prevents generating abandoned replacements', () => {
	const paths = catalog.concepts.find((concept) => concept.id === 'paths');
	assert.throws(() => promptFor(catalog, paths, paths.variants[0]), /outside.*scope/);
	const invalid = structuredClone(catalog);
	invalid.reviewScope.push('unknown-concept');
	assert.ok(validateCatalog(invalid).some((error) => error.includes('Unknown review concept')));
});
test('availability accepts real WebP bytes only, preserves dimensions, and rejects unlisted files', async () => {
	const dir = mkdtempSync(resolve(tmpdir(), 'terminalvibes-art-test-'));
	try {
		const concept = catalog.concepts[0];
		mkdirSync(resolve(dir, concept.id));
		copyFileSync(resolve(root, 'static/images/Hero.webp'), resolve(dir, concept.id, '01.webp'));
		writeFileSync(resolve(dir, concept.id, '02.webp'), 'not an image');
		writeFileSync(resolve(dir, concept.id, '99.webp'), 'unlisted');
		const scan = await scanAvailability(catalog, dir);
		assert.equal(scan.files.length, 1);
		assert.match(scan.files[0].sha256, /^[a-f0-9]{64}$/);
		assert.ok(scan.files[0].width > 0 && scan.files[0].height > 0);
		assert.equal(scan.errors.length, 2);
	} finally {
		rmSync(dir, { recursive: true, force: true });
	}
});
test('private art is stripped after static output is written and excluded at any base path', async () => {
	const calls = [];
	const adapter = excludePrivateArt({ name: 'test', adapt: async () => calls.push('write') });
	await adapter.adapt({ rimraf: (path) => calls.push(`remove:${path}`) });
	assert.deepEqual(calls, ['write', 'remove:build/art-candidates']);
	for (const path of [
		'art-candidates/hello/01.webp',
		'/terminalvibes/art-candidates/availability.json'
	])
		assert.equal(isPrivateArtPath(path), true);
	assert.equal(isPrivateArtPath('/terminalvibes/images/Hero.webp'), false);
});
