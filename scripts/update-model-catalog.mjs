/** Refresh the static tutor catalog from official public text-model lineups. No API key needed. */
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const sources = {
	openai: 'https://developers.openai.com/api/docs/models.md',
	anthropic: 'https://platform.claude.com/docs/en/models/overview.md'
};
const catalogPath = fileURLToPath(
	new URL('../src/lib/ai/cloud/model-catalog.json', import.meta.url)
);
const validId = /^[a-z0-9][a-z0-9._-]{0,127}$/;

export function parseModels(provider, markdown) {
	const models = [];
	if (provider === 'openai') {
		// The featured text lineup excludes image, speech, embedding and legacy-only endpoints.
		const section = markdown.match(/## Featured models\s+([\s\S]*?)(?=\n## |$)/)?.[1];
		if (!section)
			throw new Error('OpenAI featured-model section changed; review the source before updating.');
		for (const match of section.matchAll(
			/\[([^\]\n]+)\]\(\/api\/docs\/models\/([a-z0-9._-]+?)(?:\.md)?\)/g
		)) {
			models.push({
				provider,
				id: match[2],
				label: match[1],
				source: sources[provider].replace(/\.md$/, '')
			});
		}
	} else if (provider === 'anthropic') {
		const header = markdown.split('\n').find((line) => /^\| Feature\s+\|/.test(line));
		const idRow = markdown.split('\n').find((line) => /^\| Claude API ID\s+\|/.test(line));
		if (!header || !idRow)
			throw new Error('Anthropic model table changed; review the source before updating.');
		const labels = header
			.split('|')
			.slice(2, -1)
			.map((value) => value.trim());
		const ids = idRow
			.split('|')
			.slice(2, -1)
			.map((value) => value.trim().replaceAll('`', ''));
		if (labels.length !== ids.length)
			throw new Error('Anthropic model table columns do not match.');
		ids.forEach((id, index) =>
			models.push({
				provider,
				id,
				label: labels[index],
				source: sources[provider].replace(/\.md$/, '')
			})
		);
	} else throw new Error('Unknown provider');
	if (!models.length || models.length > 30)
		throw new Error(`${provider}: unexpected model count; refusing to replace the catalog.`);
	const unique = new Set();
	for (const model of models) {
		if (!validId.test(model.id) || !/^[A-Za-z0-9 .()/-]{1,100}$/.test(model.label))
			throw new Error(`${provider}: invalid model metadata.`);
		if (unique.has(model.id)) throw new Error(`${provider}: duplicate model ID.`);
		unique.add(model.id);
	}
	return models;
}

export function updatedCatalog(previous, models, date = new Date().toISOString().slice(0, 10)) {
	for (const provider of Object.keys(sources)) {
		const before = previous?.models?.filter((model) => model.provider === provider).length ?? 0;
		const after = models.filter((model) => model.provider === provider).length;
		if (!after || (before > 2 && after < before / 2))
			throw new Error(`${provider}: model list shrank unexpectedly; manual review required.`);
	}
	if (JSON.stringify(previous?.models) === JSON.stringify(models)) return previous;
	return { schemaVersion: 1, updated: date, models };
}

export async function refreshCatalog(fetcher = fetch) {
	const models = [];
	for (const [provider, url] of Object.entries(sources)) {
		const response = await fetcher(url, { signal: AbortSignal.timeout(30000), redirect: 'error' });
		if (!response.ok)
			throw new Error(`${provider}: official source returned HTTP ${response.status}.`);
		const text = await response.text();
		if (text.length > 1_000_000) throw new Error(`${provider}: source larger than expected.`);
		models.push(...parseModels(provider, text));
	}
	let previous;
	try {
		previous = JSON.parse(await readFile(catalogPath, 'utf8'));
	} catch (error) {
		if (error.code !== 'ENOENT') throw error;
	}
	const next = updatedCatalog(previous, models);
	if (next === previous) {
		console.log('Official model lineups unchanged.');
		return;
	}
	await writeFile(catalogPath, `${JSON.stringify(next, null, '\t')}\n`);
	console.log(
		`Updated ${models.length} public text-model entries. Review the diff before merging.`
	);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
	await refreshCatalog();
}
