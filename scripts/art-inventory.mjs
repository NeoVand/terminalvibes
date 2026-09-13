import { createHash } from 'node:crypto';
import { existsSync, readFileSync, readdirSync, writeFileSync, mkdirSync } from 'node:fs';
import { resolve, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse } from 'svelte/compiler';

export const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const catalogFile = resolve(root, 'src/lib/data/art-concepts.json');
const candidateDirectory = resolve(root, 'static/art-candidates');
const illustrationSources = [
	'sections/Hero.svelte',
	...Array.from({ length: 14 }, (_, index) => `sections/Part${index + 1}.svelte`),
	'playground/KeyboardWorkshop.svelte',
	'layout/Header.svelte'
].map((file) => `src/lib/components/${file}`);

function attribute(node, name) {
	const attribute = node.attributes?.find(
		(value) => value.type === 'Attribute' && value.name === name
	);
	if (!attribute || attribute.value === true) return '';
	return (Array.isArray(attribute.value) ? attribute.value : [attribute.value])
		.map((value) => {
			if (value.type === 'Text') return value.data;
			if (value.expression?.type === 'TemplateLiteral') {
				return value.expression.quasis.map((quasi) => quasi.value.cooked).join('');
			}
			return '';
		})
		.join('');
}

/** Read actual component nodes so a nearby heading cannot steal an image's section. */
export function scanIllustrations() {
	const illustrations = [];
	for (const file of illustrationSources) {
		const source = readFileSync(resolve(root, file), 'utf8');
		const ast = parse(source, { modern: true });
		function walk(node, ancestors = []) {
			if (!node || typeof node !== 'object') return;
			if (node.name === 'img' || node.name === 'ExpandableImage') {
				const src = attribute(node, 'src');
				if (/\.(webp|png|jpe?g)$/.test(src)) {
					const section =
						[...ancestors]
							.reverse()
							.map((parent) => attribute(parent, 'id'))
							.find(Boolean) || 'hero';
					illustrations.push({
						file,
						section,
						src: src.replace(/^\//, ''),
						alt: attribute(node, 'alt'),
						caption: attribute(node, 'caption')
					});
				}
			}
			for (const [key, value] of Object.entries(node)) {
				if (['attributes', 'metadata', 'loc'].includes(key)) continue;
				if (Array.isArray(value)) value.forEach((child) => walk(child, [...ancestors, node]));
				else if (value && typeof value === 'object') walk(value, [...ancestors, node]);
			}
		}
		walk(ast.fragment);
	}
	return illustrations;
}

export function loadCatalog() {
	return JSON.parse(readFileSync(catalogFile, 'utf8'));
}

export function validateCatalog(catalog, illustrations = scanIllustrations()) {
	const errors = [];
	const ids = new Set();
	for (const concept of catalog.concepts) {
		if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(concept.id) || ids.has(concept.id))
			errors.push(`Invalid/duplicate concept: ${concept.id}`);
		ids.add(concept.id);
		if (concept.variants.length < 5) errors.push(`${concept.id}: fewer than five alternatives`);
		const variants = new Set();
		for (const variant of concept.variants) {
			if (!/^0[1-9]$/.test(variant.id) || variants.has(variant.id))
				errors.push(`${concept.id}: invalid/duplicate variant ${variant.id}`);
			variants.add(variant.id);
			if (variant.path !== `art-candidates/${concept.id}/${variant.id}.webp`)
				errors.push(`${concept.id}: unexpected candidate path`);
		}
		if (!concept.purpose || !concept.visualBrief || !concept.altSuggestion)
			errors.push(`${concept.id}: missing teaching/visual brief`);
		for (const reference of concept.sourceRefs) {
			if (
				!illustrations.some(
					(usage) =>
						usage.file === reference.file &&
						usage.section === reference.section &&
						usage.src === reference.src &&
						usage.alt === reference.alt
				)
			) {
				errors.push(
					`${concept.id}: stale reference ${reference.file}#${reference.section} (${reference.src})`
				);
			}
		}
		for (const placement of concept.placements) {
			const source = readFileSync(resolve(root, placement.file), 'utf8');
			if (!source.includes(`id="${placement.section}"`))
				errors.push(`${concept.id}: missing placement ${placement.section}`);
		}
	}
	for (const usage of illustrations) {
		if (
			!catalog.concepts.some((concept) =>
				concept.sourceRefs.some(
					(reference) =>
						reference.file === usage.file &&
						reference.section === usage.section &&
						reference.src === usage.src &&
						reference.alt === usage.alt
				)
			)
		) {
			errors.push(`Uncatalogued illustration: ${usage.file}#${usage.section} (${usage.src})`);
		}
	}
	return errors;
}

export async function scanAvailability(catalog, directory = candidateDirectory) {
	const { default: sharp } = await import('sharp');
	const files = [];
	const errors = [];
	const expected = new Set();
	for (const concept of catalog.concepts) {
		for (const variant of concept.variants) {
			const suffix = `${concept.id}/${variant.id}.webp`;
			expected.add(suffix);
			const absolute = resolve(directory, suffix);
			if (!existsSync(absolute)) continue;
			try {
				const bytes = readFileSync(absolute);
				const metadata = await sharp(bytes).metadata();
				if (metadata.format !== 'webp' || !metadata.width || !metadata.height)
					throw new Error('expected a readable WebP image');
				files.push({
					path: variant.path,
					sha256: createHash('sha256').update(bytes).digest('hex'),
					bytes: bytes.length,
					width: metadata.width,
					height: metadata.height
				});
			} catch (error) {
				errors.push(`${suffix}: ${error.message}`);
			}
		}
	}
	if (existsSync(directory)) {
		for (const entry of readdirSync(directory, { recursive: true, withFileTypes: true })) {
			if (!entry.isFile() || !/\.webp$/i.test(entry.name)) continue;
			const suffix = relative(directory, resolve(entry.parentPath, entry.name))
				.split(sep)
				.join('/');
			if (!expected.has(suffix)) errors.push(`Uncatalogued candidate: ${suffix}`);
		}
	}
	return { schemaVersion: 1, generatedAt: new Date().toISOString(), files, errors };
}

export function promptFor(catalog, concept, variant) {
	return [
		`Create ONE standalone illustration. Follow this alternative's specific medium, camera angle, and palette: ${catalog.variantDirections.find((direction) => direction.id === variant.id).brief}`,
		'No lettering anywhere: no words, motivational signs, book titles, labels, numbers, code, keyboard legends, or watermarks. All signs, pages and screens should use blank surfaces or simple non-text shapes. The website will supply the real explanatory text separately.',
		`TerminalVibes artwork candidate ${concept.id}/${variant.id}. ${concept.title}.`,
		`Teaching purpose: ${concept.purpose}`,
		`Scene: ${concept.visualBrief}`,
		`Concept-specific details: ${concept.visualChecks.join(' ')}`,
		`Format: ${concept.aspectRatio}. ${catalog.artDirection}`,
		`Accuracy guardrails: ${catalog.guardrails.join(' ')}`,
		'The requested camera angle and medium take priority over earlier images in this conversation. Create a fresh composition. Leave all decorative surfaces free of lettering.'
	].join('\n\n');
}

async function main() {
	const [command = '--check', conceptId, variantId] = process.argv.slice(2);
	if (command === '--scan') {
		console.log(JSON.stringify(scanIllustrations(), null, 2));
		return;
	}
	const catalog = loadCatalog();
	const errors = validateCatalog(catalog);
	if (errors.length) throw new Error(errors.join('\n'));
	if (command === '--availability') {
		const result = await scanAvailability(catalog);
		mkdirSync(candidateDirectory, { recursive: true });
		writeFileSync(
			resolve(candidateDirectory, 'availability.json'),
			`${JSON.stringify(result, null, 2)}\n`
		);
		console.log(
			`${result.files.length}/${catalog.concepts.reduce((sum, concept) => sum + concept.variants.length, 0)} candidates available. Local index: static/art-candidates/availability.json`
		);
		if (result.errors.length) throw new Error(result.errors.join('\n'));
	} else if (command === '--prompt') {
		const concept = catalog.concepts.find((entry) => entry.id === conceptId);
		const variant = concept?.variants.find((entry) => entry.id === variantId);
		if (!concept || !variant)
			throw new Error('Usage: node scripts/art-inventory.mjs --prompt CONCEPT_ID 01');
		console.log(promptFor(catalog, concept, variant));
	} else if (command === '--check') {
		console.log(
			`${catalog.concepts.length} concepts, ${catalog.concepts.reduce((sum, concept) => sum + concept.variants.length, 0)} candidate slots; all ${scanIllustrations().length} active raster usages covered.`
		);
	} else throw new Error(`Unknown option: ${command}`);
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
