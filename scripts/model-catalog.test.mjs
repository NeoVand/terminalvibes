import { test } from 'node:test';
import assert from 'node:assert/strict';
import { parseModels, updatedCatalog } from './update-model-catalog.mjs';

test('OpenAI extracts the featured text lineup and excludes the image catalog', () => {
	const markdown =
		'## Featured models\n- [Example Text](/api/docs/models/example-text.md): text\n\n## Other models\n- [Image](/api/docs/models/image.md)';
	assert.deepEqual(
		parseModels('openai', markdown).map((model) => model.id),
		['example-text']
	);
});
test('Anthropic pairs exact API IDs with table labels, not Bedrock IDs', () => {
	const markdown =
		'| Feature | Claude One | Claude Two |\n| Claude API ID | `claude-one` | `claude-two-20260101` |\n| Amazon Bedrock ID | other | other |';
	assert.deepEqual(
		parseModels('anthropic', markdown).map((model) => [model.id, model.label]),
		[
			['claude-one', 'Claude One'],
			['claude-two-20260101', 'Claude Two']
		]
	);
});
test('malformed or empty sources fail closed', () => {
	assert.throws(() => parseModels('openai', '<html>maintenance</html>'));
	assert.throws(() =>
		parseModels('anthropic', '| Feature | Claude |\n| Claude API ID | `bad/../../id` |')
	);
	assert.throws(() =>
		parseModels('anthropic', '| Feature | Claude |\n| Claude API ID | `one` | `two` |')
	);
});
test('unchanged models do not create monthly timestamp-only PRs', () => {
	const models = [
		{ provider: 'openai', id: 'one' },
		{ provider: 'anthropic', id: 'two' }
	];
	const previous = { schemaVersion: 1, updated: '2026-01-01', models };
	assert.equal(updatedCatalog(previous, models, '2026-02-01'), previous);
});
test('a model change updates the date but a collapsed catalog is rejected', () => {
	const previous = { models: [1, 2, 3, 4].map((id) => ({ provider: 'openai', id: String(id) })) };
	assert.throws(() =>
		updatedCatalog(previous, [{ provider: 'openai' }, { provider: 'anthropic' }])
	);
	const models = [
		{ provider: 'openai', id: 'new' },
		{ provider: 'anthropic', id: 'other' }
	];
	assert.equal(updatedCatalog(null, models, '2026-02-01').updated, '2026-02-01');
});
