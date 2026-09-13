import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import { parse } from 'svelte/compiler';

const root = fileURLToPath(new URL('../src/lib/components/', import.meta.url));
function plain(value, constants) {
	if (Array.isArray(value)) return value.map((item) => plain(item, constants)).join('');
	if (value?.type === 'Text') return value.data;
	const expression = value?.expression;
	if (expression?.type === 'Identifier') return constants.get(expression.name) ?? '';
	if (expression?.type === 'Literal') return String(expression.value);
	if (expression?.type === 'TemplateLiteral' && expression.expressions.length === 0)
		return expression.quasis.map((part) => part.value.cooked ?? part.value.raw).join('');
	return '';
}
/** Preserve shell examples regardless of the Svelte quoting style used for props. */
export function examplesAsText(source) {
	const replacements = [];
	const ast = parse(source, { modern: true });
	const constants = new Map();
	for (const statement of ast.instance?.content.body ?? []) {
		if (statement.type !== 'VariableDeclaration') continue;
		for (const declaration of statement.declarations) {
			if (declaration.id.type === 'Identifier')
				constants.set(declaration.id.name, plain({ expression: declaration.init }, constants));
		}
	}
	function walk(node) {
		if (!node || typeof node !== 'object') return;
		if (
			node.type === 'Component' &&
			['Code', 'CodeBlock', 'CommandTranscript'].includes(node.name)
		) {
			const text = node.attributes
				.filter((attr) => ['title', 'code', 'command', 'output'].includes(attr.name))
				.map((attr) => plain(attr.value, constants))
				.filter(Boolean)
				.join(' ');
			const escaped = text
				.replaceAll('&', '&amp;')
				.replaceAll('<', '&lt;')
				.replaceAll('>', '&gt;')
				.replaceAll('{', '&#123;')
				.replaceAll('}', '&#125;');
			replacements.push({ start: node.start, end: node.end, text: ` ${escaped} ` });
			return;
		}
		for (const value of Object.values(node)) {
			if (Array.isArray(value)) value.forEach(walk);
			else if (value && typeof value === 'object') walk(value);
		}
	}
	walk(ast.fragment);
	for (const edit of replacements.sort((a, b) => b.start - a.start))
		source = source.slice(0, edit.start) + edit.text + source.slice(edit.end);
	return source;
}
/** Expand teaching widgets in their actual reading position for static indexes. */
export function courseSource(file, { examples = false } = {}) {
	const read = (path) => {
		const raw = readFileSync(path, 'utf8');
		return examples ? examplesAsText(raw) : raw;
	};
	let source = read(join(root, 'sections', file));
	for (const name of ['FirstCommand', 'KeyboardWorkshop']) {
		source = source.replace(new RegExp(`<${name}\\s*/>`, 'g'), () =>
			read(join(root, 'playground', `${name}.svelte`))
		);
	}
	return source;
}
