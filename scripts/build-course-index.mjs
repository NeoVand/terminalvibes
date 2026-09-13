#!/usr/bin/env node
/**
 * Builds src/lib/ai/course-index.json — the lexical retrieval corpus for the
 * Agent panel. Chunks come from two sources:
 *
 *   1. The course sections (src/lib/components/sections/*.svelte), split at
 *      every `id="section-…"` / `id="part-…"` anchor so each chunk maps to a
 *      real deep link on the page. Long sections split into multiple chunks
 *      that share the same anchor id.
 *   2. The cheat sheet categories (src/lib/data/cheat-sheet.ts), under ids
 *      like `cheat-panic-button` — no page anchor, but retrieval gold for
 *      "how do I quit vim"-style panic questions.
 *
 * Run with: npm run build:index  (commit the JSON — CI never rebuilds it).
 */
import { readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';
import ts from 'typescript';
import { parse } from 'svelte/compiler';
import { courseSource } from './course-source.mjs';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const SECTIONS_DIR = join(ROOT, 'src/lib/components/sections');
const OUT_FILE = join(ROOT, 'src/lib/ai/course-index.json');
const MAX_CHUNK = 1200;

/* ── section ids (parsed from sections.ts so the two never drift) ───────── */

const sectionsSource = readFileSync(join(ROOT, 'src/lib/data/sections.ts'), 'utf8');
const sectionIdsMatch = sectionsSource.match(/sectionIds = \[([\s\S]*?)\]/);
if (!sectionIdsMatch) throw new Error('could not parse sectionIds from sections.ts');
const sectionIds = new Set([...sectionIdsMatch[1].matchAll(/'([a-z0-9-]+)'/g)].map((m) => m[1]));
sectionIds.add('hello-first-command');
sectionIds.add('keyboard-workshop');

/* ── titles from sidebar-nav.ts labels ──────────────────────────────────── */

const navSource = readFileSync(join(ROOT, 'src/lib/data/sidebar-nav.ts'), 'utf8');
const labels = new Map();
for (const m of navSource.matchAll(/id:\s*'([a-z0-9-]+)',\s*label:\s*(?:'([^']+)'|"([^"]+)")/g)) {
	labels.set(m[1], m[2] ?? m[3]);
}

function titleFor(id) {
	const label = labels.get(id) ?? id;
	const section = id.match(/^section-(\d+)-(\d+)$/);
	if (section) return `${section[1]}.${section[2]} ${label}`;
	const part = id.match(/^part-(\d+)$/);
	if (part) return `Part ${part[1]} · ${label}`;
	if (id.startsWith('section-intro-')) return `Intro · ${label}`;
	if (id === 'hero') return 'Introduction';
	return label;
}

function partFor(id) {
	const m = id.match(/^(?:section|part)-(\d+)/);
	return m ? Number(m[1]) : 0;
}

/* ── svelte markup → plain text ─────────────────────────────────────────── */

function stripMarkup(src) {
	// Template-literal attribute values (CodeBlock code={`…`}) hold the shell
	// commands — pure retrieval gold. Stash them so tag-stripping can't eat
	// the > and < characters inside them, then restore as plain text.
	const literals = [];
	let s = src.replace(/\{`([\s\S]*?)`\}/g, (_, lit) => {
		literals.push(lit);
		return `\u0001${literals.length - 1}\u0001`;
	});
	// Slices begin mid-tag (at the id="…" attribute) and end right before
	// the next anchor's id attribute, so trim the partial tags at both ends
	// before general tag-stripping.
	s = s.replace(/^[^<>]*>/, ' ');
	s = s.replace(/<[^<>]*$/, ' ');
	s = s.replace(/<!--[\s\S]*?-->/g, ' ');
	// Cross-references display the sidebar's chapter/section name in the course.
	// Keep that name in retrieval text instead of leaving a gap in the sentence.
	s = s.replace(/<CourseLink\b[^>]*\/>/g, (tag) => {
		const to = tag.match(/\bto="([^"]+)"/)?.[1];
		return ` ${tag.match(/\blabel="([^"]+)"/)?.[1] ?? labels.get(to) ?? ''} `;
	});
	// code="…" string attributes (<Code code="sort" />) hold the other half of
	// the shell commands. Hoist each tag's code value out as plain text before
	// tag-stripping eats the whole tag — same for already-stashed {`…`} values.
	// eslint-disable-next-line no-control-regex -- \u0001 is our own chunk sentinel
	s = s.replace(/<[A-Za-z][^<>]*?\bcode=(?:"([^"]*)"|(\u0001\d+\u0001))[^<>]*?>/g, ' $1$2 ');
	// A transcript's command/output are attributes, not child markup. Preserve both.
	s = s.replace(/<CommandTranscript\b[\s\S]*?\/>/g, (tag) => {
		// eslint-disable-next-line no-control-regex -- internal literal sentinel
		const values = [...tag.matchAll(/(?:command|output)=(?:"([^"]*)"|(\u0001\d+\u0001))/g)];
		return values.map((match) => match[1] ?? match[2]).join(' ');
	});
	// Svelte expressions (attribute handlers, {#if}/{#each} tags, {base}, …),
	// innermost first so nested braces unwind. Must run before tag-stripping:
	// an inline `onclick={() => …}` would otherwise break the <[^>]+> regex.
	while (/\{[^{}]*\}/.test(s)) s = s.replace(/\{[^{}]*\}/g, ' ');
	s = s.replace(/<[^>]+>/g, ' ');
	// eslint-disable-next-line no-control-regex -- \u0001 is our own chunk sentinel
	s = s.replace(/\u0001(\d+)\u0001/g, (_, i) => ` ${literals[Number(i)]} `);
	s = s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&#39;/g, "'")
		.replace(/&nbsp;/g, ' ')
		.replace(/&mdash;/g, '—')
		.replace(/&#123;/g, '{')
		.replace(/&#125;/g, '}');
	return s.replace(/\s+/g, ' ').trim();
}

/** Split long text into ≤ MAX_CHUNK pieces at sentence boundaries. */
function chunkText(text) {
	if (text.length <= MAX_CHUNK) return text ? [text] : [];
	const sentences = text.split(/(?<=[.!?])\s+/);
	const chunks = [];
	let current = '';
	for (const sentence of sentences) {
		if (current && current.length + sentence.length + 1 > MAX_CHUNK) {
			chunks.push(current);
			current = sentence;
		} else {
			current = current ? `${current} ${sentence}` : sentence;
		}
	}
	if (current) chunks.push(current);
	return chunks;
}

/* ── walk the section files in page order ───────────────────────────────── */

// Hero first, then every PartN component in numeric page order.
const files = [
	'Hero.svelte',
	...readdirSync(SECTIONS_DIR)
		.filter((f) => /^Part\d+\.svelte$/.test(f))
		.sort((a, b) => parseInt(a.slice(4), 10) - parseInt(b.slice(4), 10))
];

const entries = [];

for (const file of files) {
	let source = courseSource(file, { examples: true });
	source = source.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');

	// Anchor positions, in document order, restricted to real section ids.
	const anchors = [...source.matchAll(/id="([a-z0-9-]+)"/g)]
		.filter((m) => sectionIds.has(m[1]))
		.map((m) => ({ id: m[1], start: m.index }));

	for (let i = 0; i < anchors.length; i++) {
		const { id, start } = anchors[i];
		const end = i + 1 < anchors.length ? anchors[i + 1].start : source.length;
		const text = stripMarkup(source.slice(start, end));
		for (const chunk of chunkText(text)) {
			entries.push({ id, part: partFor(id), title: titleFor(id), text: chunk });
		}
	}
}

/* Teaching steps live in widget script data; capture their visible strings too. */
for (const [name, id] of [
	['FirstCommand', 'hello-first-command'],
	['KeyboardWorkshop', 'keyboard-workshop']
]) {
	const widget = readFileSync(join(ROOT, `src/lib/components/playground/${name}.svelte`), 'utf8');
	const scriptNode = parse(widget, { modern: true }).instance?.content;
	const script = scriptNode ? widget.slice(scriptNode.start, scriptNode.end) : '';
	const ast = ts.createSourceFile(`${name}.ts`, script, ts.ScriptTarget.Latest, true);
	let stepText = '';
	function walk(node) {
		if (ts.isVariableDeclaration(node) && node.name.getText(ast) === 'steps' && node.initializer) {
			function literal(child) {
				if (
					ts.isPropertyAssignment(child) &&
					/^(title|instruction|keys|example|reply)$/.test(child.name.getText(ast)) &&
					ts.isStringLiteral(child.initializer)
				)
					stepText += child.initializer.text + ' ';
				ts.forEachChild(child, literal);
			}
			literal(node.initializer);
		}
		ts.forEachChild(node, walk);
	}
	walk(ast);
	for (const chunk of chunkText(stepText.trim()))
		entries.push({ id, part: 0, title: titleFor(id), text: chunk });
}

/* ── cheat sheet categories ─────────────────────────────────────────────── */

// Transpile data-only TypeScript rather than maintaining an incomplete type regex.
const cheatSource = readFileSync(join(ROOT, 'src/lib/data/cheat-sheet.ts'), 'utf8');
const { outputText } = ts.transpileModule(cheatSource, {
	compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext }
});
const { cheatSheet } = await import(`data:text/javascript,${encodeURIComponent(outputText)}`);

for (const category of cheatSheet) {
	const slug = category.label
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/^-|-$/g, '');
	const text = category.commands
		.map((c) => `${c.command} — ${c.description}.${c.detail ? ` ${c.detail}` : ''}`)
		.join(' ')
		.replace(/\s+/g, ' ')
		.trim();
	for (const chunk of chunkText(text)) {
		entries.push({
			id: `cheat-${slug}`,
			part: 0,
			title: `Cheat Sheet · ${category.label}`,
			text: chunk
		});
	}
}

/* ── write ──────────────────────────────────────────────────────────────── */

const empty = entries.filter((e) => !e.text);
if (empty.length) throw new Error(`empty chunks for: ${empty.map((e) => e.id).join(', ')}`);

writeFileSync(OUT_FILE, JSON.stringify(entries, null, '\t') + '\n');
console.log(
	`course-index.json: ${entries.length} chunks from ${files.length} section files + ${cheatSheet.length} cheat sheet categories`
);
