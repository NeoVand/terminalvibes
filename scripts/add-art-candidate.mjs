import { createHash } from 'node:crypto';
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { loadCatalog, root } from './art-inventory.mjs';

const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');

/** Convert one actual generated image without cropping or inventing alternatives. */
export async function addCandidate({
	conceptId,
	variantId,
	sourcePath,
	promptPath,
	directory = resolve(root, 'static/art-candidates')
}) {
	const concept = loadCatalog().concepts.find((entry) => entry.id === conceptId);
	const variant = concept?.variants.find((entry) => entry.id === variantId);
	if (!concept || !variant)
		throw new Error('Unknown concept or alternative; use the artwork catalog IDs.');
	const prompt = (await readFile(promptPath, 'utf8')).trim();
	if (!prompt) throw new Error('The actual generation prompt is required.');
	const source = await readFile(sourcePath);
	const input = await sharp(source).metadata();
	if (!input.width || !input.height || (input.pages ?? 1) > 1)
		throw new Error('Expected one readable, still generated image.');
	// Ordinary asset compression only: retain the entire frame, dimensions and alpha.
	const { data, info } = await sharp(source)
		.webp({ quality: 92, alphaQuality: 100, effort: 6 })
		.toBuffer({ resolveWithObject: true });
	const folder = resolve(directory, conceptId);
	await mkdir(folder, { recursive: true });
	const target = resolve(folder, `${variantId}.webp`);
	const metadataPath = resolve(folder, `${variantId}.json`);
	const lock = resolve(folder, `${variantId}.lock`);
	// Exclusive per-slot reservation protects previous drafts and concurrent imports.
	await writeFile(lock, '', { flag: 'wx' });
	try {
		await writeFile(
			metadataPath,
			`${JSON.stringify(
				{
					schemaVersion: 1,
					conceptId,
					variantId,
					importedAt: new Date().toISOString(),
					generator: 'Codex built-in image generation tool (model selection not exposed)',
					prompt,
					source: {
						path: resolve(sourcePath),
						sha256: digest(source),
						width: input.width,
						height: input.height,
						hasAlpha: input.hasAlpha ?? false
					},
					candidate: {
						path: variant.path,
						sha256: digest(data),
						bytes: data.length,
						width: info.width,
						height: info.height
					},
					requestedAspectRatio: concept.aspectRatio,
					transformation: 'Full-frame WebP encoding; no resize, crop, compositing, or recoloring.',
					selection: null
				},
				null,
				2
			)}\n`,
			{ flag: 'wx' }
		);
		try {
			await writeFile(target, data, { flag: 'wx' });
		} catch (error) {
			await rm(metadataPath);
			throw error;
		}
		return {
			path: target,
			conceptId,
			variantId,
			width: info.width,
			height: info.height,
			bytes: data.length
		};
	} finally {
		await rm(lock);
	}
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
	const [conceptId, variantId, sourcePath, promptPath] = process.argv.slice(2);
	if (!conceptId || !variantId || !sourcePath || !promptPath) {
		console.error(
			'Usage: node scripts/add-art-candidate.mjs CONCEPT_ID 01 /absolute/generated.png /absolute/actual-prompt.txt'
		);
		process.exitCode = 1;
	} else {
		addCandidate({ conceptId, variantId, sourcePath, promptPath })
			.then((result) => console.log(JSON.stringify(result)))
			.catch((error) => {
				console.error(error.message);
				process.exitCode = 1;
			});
	}
}
